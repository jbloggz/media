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
for the database from the env file passed in to the -e flag. The following
must be set in the env file:

PGHOST - host of the postgres database
PGUSER - The user to connect as
PGDATABASE - The database to connect to
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
import ffmpeg
from pydantic import BaseModel
from dotenv import load_dotenv
from PIL.ExifTags import TAGS, GPSTAGS
from PIL import Image, TiffImagePlugin


SHA256_CHUNK_SIZE = 1000000


class FileMetadata(BaseModel):
    path: str                       # Path of the file on disk
    type: str                       # media type (either image or video)
    timestamp: int                  # When the file was created
    size: int                       # Size in bytes
    width: int = 0                  # Width in pixels
    height: int = 0                 # Height in pixels
    duration: int | None = None     # Duration in milliseconds (for videos)
    latitude: int | None = None     # Latitude in degrees (-90 -> 90)
    longitude: int | None = None    # Longitude in degrees (-180 -> 180)
    make: str | None = None         # Make of the deivce that created the file
    model: str | None = None        # Model of the device that created the file
    sha256: str = ''                # SHA256 checksum of the file


class Result(BaseModel):
    processed: int = 0  # Number of files processed and inserted
    skipped: int = 0    # Number of files that didn't need to be processed
    failed: int = 0     # Number of files that failed to process


class Lock:
    '''
    A class to represent a advisory lock in postgres
    '''

    def __init__(self, db: psycopg.Cursor):
        '''
        Constructor

        Args:
            db: An opened postgres cursor
        '''
        self.db = db
        self.lock_id = 293841  # A random umber that is unique
        self.locked = False

    def __enter__(self):
        '''
        Entry function for 'with'. Acquires a lock
        '''
        self.acquire()

    def __exit__(self, exc_type, exc_val, exc_tb):
        '''
        Exit function for 'with'. Releases the held lock
        '''
        self.release()

    def acquire(self) -> bool:
        '''
        Acquire the lock

        Raises:
            ValueError: If the lock cannot be acquired

        Returns:
            True if the lock can be acquired
        '''
        resp = self.db.execute(f'SELECT pg_try_advisory_lock({self.lock_id})').fetchone()
        self.locked = resp[0] is True
        if not self.is_locked():
            raise ValueError('Another process is currently running')
        return self.is_locked()

    def release(self):
        '''
        Release a held lock. No op if lock not held
        '''
        self.db.execute(f'SELECT pg_advisory_unlock({self.lock_id})')
        self.locked = False

    def is_locked(self) -> bool:
        '''
        Check if lock is held

        Returns:
            True if the lock is help, false if not
        '''
        return self.locked


class Progress:
    '''
    A class to represent the progress of this process
    '''

    def __init__(self, db: psycopg.Cursor, interval: int):
        '''
        Constructor

        Args:
            db: An opened postgres cursor
            interval: The interval to force an update to the db
        '''
        self.db = db
        self.interval = interval
        self.last_time = 0
        self.last_state = ''
        self.update('initlialising')

    def update(self, state: str, data: Dict[str, str | int] = None):
        '''
        Update the progress of the process

        Args:
            state: The current state
            data: Context about the progress. Defaults to None.
        '''
        if time.time() - self.last_time < self.interval and state == self.last_state:
            # It's been less than interval seconds, and the state hasn't changed, so do nothing
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
    '''
    Update a dict recursively

    Args:
        mapping: The dict to update
        *updating_mappings: The parts of the dict to update
    '''
    for updating_mapping in updating_mappings:
        for k, v in updating_mapping.items():
            if k in mapping and isinstance(mapping[k], dict) and isinstance(v, dict):
                deep_update(mapping[k], v)
            else:
                mapping[k] = v


def calculate_sha256(file: FileMetadata):
    '''
    Calculate a SHA256 checksum of a file

    Args:
        file: The file to create the checksum
    '''
    sha256 = hashlib.sha256()
    with open(file.path, "rb") as fp:
        # Process in chunks of 4kB
        for data in iter(lambda: fp.read(4096), b""):
            sha256.update(data)
    file.sha256 = sha256.hexdigest()


def decode_exif_timestamp(exif_time: str) -> int:
    '''
    COnvert a string exif formatted timestamp to unix epock seconds

    Args:
        exif_time: The exit timestamp

    Returns:
        A unix epoch timestamp
    '''
    return int(datetime.datetime.strptime(exif_time, "%Y:%m:%d %H:%M:%S").timestamp())


def insert_media(db: psycopg.Cursor, media: List[FileMetadata]):
    '''
    Insert the file metadata into the database

    Args:
        db: An opened postgres cursor
        media: The list of files to insert
    '''
    if not media:
        return
    header = FileMetadata.__annotations__.keys()
    with db.copy(f'COPY media ({",".join(header)}) FROM STDIN') as copy:
        for file in media:
            copy.write_row(list(file.dict().values()))


def load_video_metadata(file: FileMetadata):
    '''
    Load the metadata for a video file using ffmpeg

    Args:
        file: The file to load the metadata
    '''
    probe = ffmpeg.probe(file.path)
    video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
    file.width = int(video_info['width'])
    file.height = int(video_info['height'])
    file.duration = int(float(video_info['duration']) * 1000)


def decode_exif(data, key=None):
    '''
    Recursively decode exif metadata

    Args:
        data: The exif node
        key: The key for this node, if it's parent is a map. Defaults to None.

    Returns:
        The decoded exif node
    '''
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


def load_image_metadata(file: FileMetadata):
    '''
    Load the metadata for a image file using ffmpeg

    Args:
        file: The file to load the metadata
    '''
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
    '''
    Get a list of all existing files added to the database

    Args:
        db: An opened postgres cursor

    Returns:
        A list of file paths that exist in the database
    '''
    db.execute('SELECT path FROM media')
    return {Path(row[0]) for row in db.fetchall()}


def validate_file(file: FileMetadata):
    '''
    Validate that a file has all the necessary fields set

    Raises:
        ValueError: If the validation fails

    Args:
        file: The file to validate
    '''
    if not Path(file.path).exists():
        raise ValueError(f'Validation failed: file does not exist: {file.path}')
    if file.type not in ['video', 'image']:
        raise ValueError(f'Validation failed: Invalid type of {file.type}: {file.path}')
    if not isinstance(file.timestamp, int) or file.timestamp == 0:
        raise ValueError(f'Validation failed: invalid timestamp of {file.timestamp}: {file.path}')
    if not isinstance(file.size, int) or file.size == 0:
        raise ValueError(f'Validation failed: invalid size of {file.size}: {file.path}')
    if not isinstance(file.width, int) or file.width == 0:
        raise ValueError(f'Validation failed: invalid width of {file.width}: {file.path}')
    if not isinstance(file.height, int) or file.height == 0:
        raise ValueError(f'Validation failed: invalid length of {file.hight}: {file.path}')
    if file.type == 'video' and (not isinstance(file.duration, int) or file.duration == 0):
        raise ValueError(f'Validation failed: Invalid video duration of {file.duration}: {file.path}')
    if file.type == 'image' and file.duration is not None:
        raise ValueError(f'Validation failed: Duration must not be set for images: {file.duration}: {file.path}')
    if not (file.latitude is None or ((isinstance(file.latitude, int) or isinstance(file.latitude, float)) and file.latitude > 0)):
        raise ValueError(f'Validation failed: Invalid latitude of {file.latitude}: {file.path}')
    if not (file.latitude is None or ((isinstance(file.latitude, int) or isinstance(file.latitude, float)) and file.latitude > 0)):
        raise ValueError(f'Validation failed: Invalid longitude of {file.longitude}: {file.path}')
    if file.make is not None and (not isinstance(file.make, str) or file.make == ''):
        raise ValueError(f'Validation failed: Invalid make of {file.make}: {file.path}')
    if file.model is not None and (not isinstance(file.model, str) or file.model == ''):
        raise ValueError(f'Validation failed: Invalid model of {file.model}: {file.path}')
    if not isinstance(file.sha256, str) or len(file.sha256) != 64:
        raise ValueError(f'Validation failed: Invalid sha256 of {file.sha256}: {file.path}')


def process_file(file_path: Path) -> Optional[FileMetadata]:
    '''
    Process a file and load its metadata

    Args:
        file_path: Path of the file to process

    Returns:
        The processed files metadata
    '''
    mime_type = mimetypes.guess_type(file_path)[0]
    if mime_type is None:
        logging.warning(f'Skipping unsupported file: {file_path}')
        return None

    stats = os.stat(file_path)
    file = FileMetadata(path=str(file_path), type=mime_type, timestamp=int(stats.st_mtime), size=stats.st_size)

    if mime_type.startswith('image'):
        file.type = 'image'
        load_image_metadata(file)
    elif mime_type.startswith('video'):
        file.type = 'video'
        load_video_metadata(file)
    else:
        logging.warning(f'Skipping unsupported file of mime type {mime_type}: {file_path}')
        return None

    calculate_sha256(file)

    validate_file(file)

    return file


def index_directory(args: argparse.Namespace, db: psycopg.Cursor, path: Path) -> Result:
    '''
    Process all the files in the provided directory

    Args:
        args: Command line arguments
        db: An opened postgres cursor
        path: The directory to search

    Returns:
        The counts of processed, skipped and failed files in the directory
    '''
    logging.info(f'Indexing {path}')
    res = Result()
    progress = Progress(db, args.progress_update)
    existing_files = get_existing_media(db)
    files = [f for f in path.rglob('*') if f.is_file()]
    to_process = [f for f in files if f not in existing_files]
    res.skipped += len(files) - len(to_process)
    if res.skipped > 0:
        logging.info(f'Skipping {res.skipped} file{"s" if res.skipped > 1 else ""} already indexed')

    processed: List[FileMetadata] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.ncpu) as executor:
        futures = {executor.submit(process_file, path): path for path in to_process}
        for future in concurrent.futures.as_completed(futures):
            try:
                path = futures[future]
                file = future.result()
                if file:
                    res.processed += 1
                    processed.append(file)
                else:
                    res.skipped += 1
            except:
                logging.exception(f'Unable to process {path}')
                res.failed += 1

            progress.update('processing', {
                'processed': res.processed,
                'skipped': res.skipped,
                'failed': res.failed,
                'total': len(to_process)
            })

    insert_media(db, processed)

    logging.info(f'Processed: {res.processed}, skipped: {res.skipped}, failed: {res.failed}')
    progress.update('complete', {
        'processed': res.processed,
        'skipped': res.skipped,
        'failed': res.failed,
        'total': len(to_process)
    })
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
    Setup the logging

    Args:
        args: Command line arguments
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
    Parse the command line arguments

    Returns:
        The parsed arguments
    '''
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument('-d', '--debug', action='store_true', help='Enable debug logging')
    parser.add_argument('-e', '--env', required=True, type=str, help='Path to .env file')
    parser.add_argument('-l', '--log-file', type=str, help='Path to log file')
    parser.add_argument('-n', '--ncpu', type=int, default=2, help='Number of threads to run')
    parser.add_argument('-p', '--path', type=str, help='Process a path and exit')
    parser.add_argument('-u', '--progress-update', type=int, default=3, help='Progress update interval')

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

    # If a path was supplied, run a single process on that path
    if args.path:
        with psycopg.connect(autocommit=True) as conn:
            with conn.cursor() as cur:
                with Lock(cur):
                    index_directory(args, cur, Path(args.path))
        return 0

    # Loop forever connecting to the database and listening for notifications
    while True:
        try:
            with psycopg.connect(autocommit=True) as conn:
                with conn.cursor() as cur:
                    cur.execute('LISTEN index')
                    logging.info('Connected to db. Listening...')
                    for notify in conn.notifies():
                        with Lock(cur):
                            index_directory(args, cur, Path(notify.payload))
        except KeyboardInterrupt:
            break
        except:
            logging.exception('Uncaught exception. Will reconnect in 10s')
            time.sleep(10)


if __name__ == '__main__':  # pragma: no cover
    try:
        sys.exit(main(parse_args()))
    except Exception as exc:  # pylint: disable=broad-except
        logging.exception(exc, exc_info=True)
