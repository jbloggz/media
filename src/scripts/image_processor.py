#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# The script to process and index files in the provided directory
#

'''
Image processor and indexer.
This process has the job of indexing a directory and inserting the media
metadata into the postgres database. It gets the connection information
for the database from the env file passed in to the -e flag. Te following
must be set in the env file:

PGHOST - host of the postgres database
PGUSER - The user to connect as
PGDATABASE - THe database to connect to
'''

import os
import sys
import time
import json
import argparse
import signal
import mimetypes
import hashlib
import logging
import concurrent.futures
import datetime
import binascii
from pathlib import Path
from typing import Optional, Dict, List, Set
import psycopg
from pydantic import BaseModel
from dotenv import load_dotenv
from PIL.ExifTags import TAGS, GPSTAGS
from PIL import Image, TiffImagePlugin


SHA256_CHUNK_SIZE = 1000000


class FileMetadata(BaseModel):
    path: str
    type: str
    timestamp: int = 0
    size: int = 0
    width: int = 0
    height: int = 0
    duration: int | None = None
    latitude: int | None = None
    longitude: int | None = None
    make: str | None = None
    model: str | None = None
    sha256: str = ''


class Result(BaseModel):
    processed: int = 0
    skipped: int = 0
    failed: int = 0


class Lock:
    '''
    A class to represent a advisory lock in postgres
    '''

    def __init__(self, db: psycopg.Cursor):
        self.db = db
        self.lock_id = 293841  # A random umber that is unique
        self.locked = False

    def __enter__(self):
        self.acquire()

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()

    def acquire(self) -> bool:
        resp = self.db.execute(f'SELECT pg_try_advisory_lock({self.lock_id})').fetchone()
        self.locked = resp[0] is True
        if not self.is_locked():
            raise ValueError('Another process is currently running')
        return self.is_locked()

    def release(self):
        self.db.execute(f'SELECT pg_advisory_unlock({self.lock_id})')
        self.locked = False

    def is_locked(self) -> bool:
        return self.locked


class Progress:
    '''
    A class to represent the progress of this process
    '''

    def __init__(self, db: psycopg.Cursor):
        self.db = db
        self.last_time = 0
        self.last_state = ''
        self.update('initlialising')

    def update(self, state: str, data: Dict[str, str | int] = None):
        if time.time() - self.last_time < 10 and state == self.last_state:
            # It's been less than 10s, and the state hasn't changed, so do nothing
            return
        self.last_time = time.time()
        self.last_state = state
        message = data or {}
        message['time'] = time.time()
        message['state'] = state
        self.db.execute('INSERT INTO progress VALUES (%(name)s, %(msg)s) ON CONFLICT (name) DO UPDATE SET message = %(msg)s', {
            'name': 'index',
            'msg': json.dumps(message)
        })


def deep_update(mapping: Dict, *updating_mappings: Dict):
    for updating_mapping in updating_mappings:
        for k, v in updating_mapping.items():
            if k in mapping and isinstance(mapping[k], dict) and isinstance(v, dict):
                deep_update(mapping[k], v)
            else:
                mapping[k] = v


def calculate_sha256(file: FileMetadata):
    sha256 = hashlib.sha256()
    with open(file.path, "rb") as fp:
        # Process in chunks of 4kB
        for data in iter(lambda: fp.read(4096), b""):
            sha256.update(data)
    file.sha256 = sha256.hexdigest()


def decode_exif_timestamp(exif_time: str) -> int:
    return int(datetime.datetime.strptime(exif_time, "%Y:%m:%d %H:%M:%S").timestamp())


def insert_media(db: psycopg.Cursor, media: List[FileMetadata]):
    if not media:
        return
    header = FileMetadata.__annotations__.keys()
    with db.copy(f'COPY media ({",".join(header)}) FROM STDIN') as copy:
        for file in media:
            copy.write_row(list(file.dict().values()))


def decode_exif(data, key=None):
    tags = GPSTAGS if key == 'GPSInfo' else TAGS
    if isinstance(data, Image.Exif):
        res = {}
        for tag, val in data.items():
            tag_name = tags.get(tag, tag)
            res[tag_name] = decode_exif(data.get_ifd(tag) or val, tag_name)
        return res

    if isinstance(data, dict):
        res = {}
        for tag, val in data.items():
            tag_name = tags.get(tag, tag)
            res[tag_name] = decode_exif(val, tag_name)
        return res

    if isinstance(data, TiffImagePlugin.IFDRational):
        if data.denominator == 0:
            return decode_exif(0)
        return decode_exif(data.numerator) / decode_exif(data.denominator)

    if isinstance(data, tuple):
        return [decode_exif(v) for v in data]

    if isinstance(data, bytes):
        return decode_exif('0x' + binascii.hexlify(data).decode('utf-8'))

    return data


def load_exif_data(file: FileMetadata):
    img = Image.open(file.path)
    file.width = img.size[0]
    file.height = img.size[1]
    raw_exif = img.getexif()
    if raw_exif is None:
        return

    exif = {
        'Make': None,
        'Model': None,
        'DateTime': None,
        'ExifOffset': {
            'DateTimeOriginal': None,
            'DateTimeDigitized': None,
        },
        'GPSInfo': {
            'GPSLatitudeRef': None,
            'GPSLatitude': None,
            'GPSLongitudeRef': None,
            'GPSLongitude': None,
        },
    }

    deep_update(exif, decode_exif(raw_exif))

    if exif['ExifOffset']['DateTimeOriginal'] is not None:
        file.timestamp = decode_exif_timestamp(exif['ExifOffset']['DateTimeOriginal'])
    elif exif['ExifOffset']['DateTimeDigitized'] is not None:
        file.timestamp = decode_exif_timestamp(exif['ExifOffset']['DateTimeDigitized'])
    elif exif['DateTime'] is not None:
        file.timestamp = decode_exif_timestamp(exif['DateTime'])

    if exif['Make']:
        file.make = exif['Make']

    if exif['Model']:
        file.model = exif['Model']

    if exif['GPSInfo']['GPSLatitudeRef'] is not None and exif['GPSInfo']['GPSLongitude'] is not None:
        lat = list(exif['GPSInfo']['GPSLatitude'])
        lng = list(exif['GPSInfo']['GPSLongitude'])
        if len(lat) > 2 and len(lng) > 2:
            lat_sign = 1 if exif['GPSInfo']['GPSLatitudeRef'] == 'N' else -1
            lng_sign = 1 if exif['GPSInfo']['GPSLongitudeRef'] == 'E' else -1
            file.latitude = lat[0] + lat[1] / 60 + (lat[2] / 3600) * lat_sign
            file.longitude = lng[0] + lng[1] / 60 + (lng[2] / 3600) * lng_sign


def get_existing_media(db: psycopg.Cursor) -> Set[Path]:
    db.execute('SELECT path FROM media')
    return {Path(row[0]) for row in db.fetchall()}


def process_file(file_path: Path) -> Optional[FileMetadata]:
    '''
    _summary_

    _extended_summary_

    Args:
        db: _description_
        file_path: _description_

    Returns:
        _description_
    '''
    mime_type = mimetypes.guess_type(file_path)[0]
    if mime_type is None:
        logging.warning(f'Skipping unsupported file: {file_path}')
        return None

    file = FileMetadata(path=str(file_path), type=mime_type)

    if mime_type.startswith('image'):
        stats = os.stat(file_path)
        file.type = 'image'
        file.timestamp = int(stats.st_mtime)
        file.size = stats.st_size
        load_exif_data(file)
    else:
        # HANDLE VIDEO
        logging.warning(f'Skipping unsupported file: {file_path}')
        return None

    calculate_sha256(file)

    return file


def index_directory(args: argparse.Namespace, db: psycopg.Cursor, path: Path) -> Result:
    logging.info(f'Indexing {path}')
    res = Result()
    existing_files = get_existing_media(db)
    files = [f for f in path.rglob('*') if f.is_file()]
    to_process = [f for f in files if f not in existing_files]
    res.skipped += len(files) - len(to_process)
    if res.skipped > 0:
        logging.info(f'Skipping {res.skipped} file{"s" if res.skipped > 1 else ""} already indexed')

    processed: List[FileMetadata] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.ncpu) as executor:
        futures = [executor.submit(process_file, file) for file in to_process]
        for future in concurrent.futures.as_completed(futures):
            try:
                file = future.result()
                if file:
                    res.processed += 1
                    processed.append(file)
                else:
                    res.skipped += 1
            except Exception as e:
                logging.error(f'Unable to process {file.path}: {e}')
                res.failed += 1

    insert_media(db, processed)

    logging.info(f'Processed: {res.processed}, skipped: {res.skipped}, failed: {res.failed}')
    return res


def set_log_level(level):
    '''
    Set the logger level.

    Args:
        level: The new log level
    '''
    logger = logging.getLogger()
    level = max(logging.DEBUG, min(level, logging.CRITICAL))
    logger.setLevel(logging.INFO)
    logger.info(f'Setting log level to %s', logging.getLevelName(level))
    logger.setLevel(level)


def init_logging(args: argparse.Namespace):
    '''
    _summary_

    _extended_summary_

    Args:
        args: _description_
    '''
    logger = logging.getLogger()
    set_log_level(logging.DEBUG if args.debug else logging.INFO)
    signal.signal(signal.SIGUSR1, lambda *_: set_log_level(logger.level - 10))
    signal.signal(signal.SIGUSR2, lambda *_: set_log_level(logger.level + 10))

    fmt = '%(asctime)s.%(msecs)03d | %(levelname)-8s | %(message)s'
    timefmt = '%Y/%m/%d %H:%M:%S'

    if args.log_file is not None:
        handler = logging.FileHandler(args.log_file)
        formatter = logging.Formatter(fmt, timefmt)
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    else:
        stderr_handler = logging.StreamHandler(sys.stderr)
        formatter = logging.Formatter(fmt, timefmt)
        stderr_handler.setFormatter(formatter)
        logger.addHandler(stderr_handler)


def parse_args():  # pragma: no cover
    '''
    _summary_

    _extended_summary_

    Returns:
        _description_
    '''
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument('-d', '--debug', action='store_true', help='Enable debug logging')
    parser.add_argument('-n', '--ncpu', type=int, help='Number of threads to run')
    parser.add_argument('-e', '--env', required=True, type=str, help='Path to .env file')
    parser.add_argument('-l', '--log-file', type=str, help='Path to log file')

    args = parser.parse_args()

    return args


def main(args: argparse.Namespace):  # pragma: no cover
    '''
    Main function.

    Args:
        args: The command line arguments
    '''
    init_logging(args)

    if args.env:
        load_dotenv(args.env)

    # Loop forever connecting to the database and listening for notifications
    while True:
        try:
            with psycopg.connect(autocommit=True) as conn:
                with conn.cursor() as cur:
                    cur.execute('LISTEN index')
                    logging.info('Connected to db. Listening...')
                    for notify in conn.notifies():
                        with Lock(cur), conn.transaction():
                            index_directory(args, cur, Path(notify.payload))
        except KeyboardInterrupt:
            break
        except:
            logging.exception('Uncaught exception. Will reconnect in 10s')
            time.sleep(10)


if __name__ == '__main__':  # pragma: no cover
    try:
        sys.exit(main(parse_args()))
    except Exception as exc:
        logging.exception(exc, exc_info=True)
