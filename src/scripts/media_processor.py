#
# MIT License
#
# Author: Josef Barnes
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
TIMEZONE - Name of the timezone to use
'''

# System Imports
import os
import io
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
from typing import Optional, Dict, List

# 3rd Party Imports
import psycopg
import ffmpeg
import av
from pydantic import BaseModel
from dotenv import load_dotenv
from PIL.ExifTags import TAGS, GPSTAGS
from PIL import Image, TiffImagePlugin, ImageOps, ImageFile


logger = logging.getLogger('media_processor')


class FileMetadata(BaseModel):
    path: str                       # Path of the file on disk
    type: str                       # media type (either image or video)
    timestamp: int                  # When the file was created
    size: int                       # Size in bytes
    width: int = 0                  # Width in pixels
    height: int = 0                 # Height in pixels
    duration: int | None = None     # Duration in milliseconds (for videos)
    latitude: float | None = None   # Latitude in degrees (-90 -> 90)
    longitude: float | None = None  # Longitude in degrees (-180 -> 180)
    make: str | None = None         # Make of the device that created the file
    model: str | None = None        # Model of the device that created the file
    sha256: str = ''                # SHA256 checksum of the file
    thumbnail: bytes = b''          # Thumbnail of the file


class Result(BaseModel):
    processed: int = 0  # Number of files processed and inserted
    skipped: int = 0    # Number of files that didn't need to be processed
    failed: int = 0     # Number of files that failed to process


class Lock:
    '''
    A class to represent an advisory lock in postgres
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

    def __init__(self, db: psycopg.Cursor, interval: int, log_progress: bool):
        '''
        Constructor

        Args:
            db: An opened postgres cursor
            interval: The interval to force an update to the db
        '''
        self.db = db
        self.interval = interval
        self.log = log_progress
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
        now = time.time()
        if now - self.last_time < self.interval and state == self.last_state:
            # It's been less than interval seconds, and the state hasn't changed, so do nothing
            return
        self.last_time = now
        self.last_state = state
        message = data or {}
        message['state'] = state
        message['ete'] = None if not message.get('processed') else message.get(
            'duration', 0) / message.get('processed', 1) * (message.get('total', 0) - message.get('processed', 0))
        self.db.execute('INSERT INTO progress VALUES (%(name)s, %(msg)s) ON CONFLICT (name) DO UPDATE SET message = %(msg)s', {
            'name': 'index',
            'msg': json.dumps(message)
        })
        if self.log:
            logger.info(json.dumps(message))


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


def generate_thumbnail(file: FileMetadata, img: Image):
    '''
    Generate a thumbnail for a media file

    Args:
        file: The file to generate the thumb
        img: The image to generate the thumb from
    '''
    size = min(img.width, img.height)
    box = ((img.width - size) // 2, (img.height - size) // 2, (img.width + size) // 2, (img.height + size) // 2)
    cropped = img.crop(box)
    thumb_size = int(os.environ['THUMBNAIL_SIZE'])
    cropped.thumbnail((thumb_size, thumb_size))
    thumb = io.BytesIO()
    if cropped.mode in ("RGBA", "P"):
        cropped = cropped.convert("RGB")
    cropped.save(thumb, format='JPEG')
    file.thumbnail = thumb.getvalue()


def decode_exif_timestamp(file: FileMetadata, key: str, exif_time: str) -> int:
    '''
    Convert a string exif formatted timestamp to unix epoch seconds

    Args:
        file:      The file that is being processed
        key:       The exif key that is being parsed
        exif_time: The exit timestamp

    Returns:
        A unix epoch timestamp
    '''
    ts = None
    for fmt in ['%Y:%m:%d %H:%M:%S', '%Y/%m/%d %H:%M:%S']:
        try:
            if ts is not None:
                break
            ts = int(datetime.datetime.strptime(exif_time, fmt).timestamp())
        except:
            pass

    if ts is None:
        logger.warning(f'Unable to decode {key} for {file.path}: {exif_time}')
    elif ts > time.time():
        logger.warning(f'Invalid time found in {key} for {file.path}: {exif_time}')
        ts = None

    return ts


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
            logger.debug(f'Inserting: {file.dict()}')
            copy.write_row(list(file.dict().values()))


def load_video_duration(probe: List, video_info: Dict) -> int:
    '''
    Get the video duration form the ffprobe metadata

    Args:
        probe: The ffprobe output
        video_info: The stream info for the video

    Returns:
        The duration in milliseconds
    '''
    try:
        return int(float(probe['format']['duration']) * 1000)
    except:
        pass

    try:
        return int(float(video_info['duration']) * 1000)
    except:
        pass

    raise ValueError('Unable to find video duration')


def load_video_metadata(file: FileMetadata):
    '''
    Load the metadata for a video file using ffmpeg

    Args:
        file: The file to load the metadata
    '''
    try:
        probe = ffmpeg.probe(file.path)
    except:
        raise ValueError('ffprobe failed. Possibly corrupt file')
    try:
        video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
    except:
        raise ValueError('No valid video stream found')
    file.width = int(video_info['width'])
    file.height = int(video_info['height'])
    file.duration = load_video_duration(probe, video_info)

    frames = av.open(file.path).decode(video=0)
    try:
        rotation = int(video_info.get('tags', {}).get('rotate', 0))
    except:
        rotation = 0

    generate_thumbnail(file, next(frames).to_image().rotate(-rotation))


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


def sanitise_string(file: FileMetadata, key: str, raw: str) -> str:
    if [c for c in raw if not 32 <= ord(c) <= 126]:
        logger.warning(f'Non-printable characters found in {key} of {file.path}: {raw.encode()}')
        return ''.join(c for c in raw if 32 <= ord(c) <= 126)
    return raw


def sanitise_exif(file: FileMetadata, exif: Dict) -> Dict:
    '''
    Sanitise the exif data

    Args:
        file: The file being processed
        exif: The decoded exif data

    Returns:
        The sanitised exif data
    '''
    sanitised = {
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

    if not isinstance(exif, dict):
        return sanitised

    if 'Make' in exif and isinstance(exif['Make'], str):
        sanitised['Make'] = sanitise_string(file, 'Make', exif['Make'])

    if 'Model' in exif and isinstance(exif['Model'], str):
        sanitised['Model'] = sanitise_string(file, 'Model', exif['Model'])

    if 'DateTime' in exif and isinstance(exif['DateTime'], str):
        sanitised['DateTime'] = exif['DateTime']

    eo = exif.get('ExifOffset')
    if isinstance(eo, dict):
        if 'DateTimeOriginal' in eo and isinstance(eo['DateTimeOriginal'], str):
            sanitised['ExifOffset']['DateTimeOriginal'] = eo['DateTimeOriginal']

        if 'DateTimeDigitized' in eo and isinstance(eo['DateTimeDigitized'], str):
            sanitised['ExifOffset']['DateTimeDigitized'] = eo['DateTimeDigitized']

    gps = exif.get('GPSInfo')
    if isinstance(gps, dict):
        if 'GPSLatitudeRef' in gps and isinstance(gps['GPSLatitudeRef'], str):
            sanitised['GPSInfo']['GPSLatitudeRef'] = gps['GPSLatitudeRef']

        if 'GPSLatitude' in gps and isinstance(gps['GPSLatitude'], list) and len(gps['GPSLatitude']) > 2:
            sanitised['GPSInfo']['GPSLatitude'] = gps['GPSLatitude']

        if 'GPSLongitudeRef' in gps and isinstance(gps['GPSLongitudeRef'], str):
            sanitised['GPSInfo']['GPSLongitudeRef'] = gps['GPSLongitudeRef']

        if 'GPSLongitude' in gps and isinstance(gps['GPSLongitude'], list) and len(gps['GPSLongitude']) > 2:
            sanitised['GPSInfo']['GPSLongitude'] = gps['GPSLongitude']

    return sanitised


def load_image_metadata(file: FileMetadata, use_file_time: bool):
    '''
    Load the metadata for a image file using ffmpeg

    Args:
        file:          The file to load the metadata
        use_file_time: Don't get the time from the exif data
    '''
    img = Image.open(file.path)
    file.width = img.size[0]
    file.height = img.size[1]
    raw_exif = img.getexif()
    if raw_exif is None:
        return

    exif = sanitise_exif(file, decode_exif(raw_exif))

    if not use_file_time:
        timestamp = None
        if timestamp is None and exif['ExifOffset']['DateTimeOriginal'] is not None:
            timestamp = decode_exif_timestamp(file, 'DateTimeOriginal', exif['ExifOffset']['DateTimeOriginal'])
        if timestamp is None and exif['ExifOffset']['DateTimeDigitized'] is not None:
            timestamp = decode_exif_timestamp(file, 'DateTimeDigitized', exif['ExifOffset']['DateTimeDigitized'])
        if timestamp is None and exif['DateTime'] is not None:
            timestamp = decode_exif_timestamp(file, 'DateTime', exif['DateTime'])
        if timestamp is not None:
            file.timestamp = timestamp

    if exif['Make']:
        file.make = exif['Make']

    if exif['Model']:
        file.model = exif['Model']

    if exif['GPSInfo']['GPSLatitude'] is not None and exif['GPSInfo']['GPSLongitude'] is not None:
        lat = list(exif['GPSInfo']['GPSLatitude'])
        lng = list(exif['GPSInfo']['GPSLongitude'])
        if len(lat) > 2 and len(lng) > 2:
            lat_sign = 1 if exif['GPSInfo']['GPSLatitudeRef'] == 'N' else -1
            lng_sign = 1 if exif['GPSInfo']['GPSLongitudeRef'] == 'E' else -1
            file.latitude = (lat[0] + lat[1] / 60 + lat[2] / 3600) * lat_sign
            file.longitude = (lng[0] + lng[1] / 60 + lng[2] / 3600) * lng_sign

    generate_thumbnail(file, ImageOps.exif_transpose(Image.open(file.path)))


def get_existing_media(db: psycopg.Cursor) -> Dict[Path, int]:
    '''
    Get a all existing files in the database

    Args:
        db: An opened postgres cursor

    Returns:
        A map of the files to their timestamps that exist in the database
    '''
    db.execute('SELECT id,path,timestamp FROM media ORDER BY timestamp DESC')
    return {Path(row[1]): {
        'id': row[0],
        'timestamp': row[2]
    } for row in db.fetchall()}


def validate_file(file: FileMetadata):
    '''
    Validate that a file has all the necessary fields set

    Raises:
        ValueError: If the validation fails

    Args:
        file: The file to validate
    '''
    if not Path(file.path).exists():
        raise ValueError('Validation failed: file does not exist')
    if file.type not in ['video', 'image']:
        raise ValueError(f'Validation failed: Invalid type of {file.type}')
    if not isinstance(file.timestamp, int) or file.timestamp == 0:
        raise ValueError(f'Validation failed: invalid timestamp of {file.timestamp}')
    if not isinstance(file.size, int) or file.size == 0:
        raise ValueError(f'Validation failed: invalid size of {file.size}')
    if not isinstance(file.width, int) or file.width == 0:
        raise ValueError(f'Validation failed: invalid width of {file.width}')
    if not isinstance(file.height, int) or file.height == 0:
        raise ValueError(f'Validation failed: invalid length of {file.hight}')
    if file.type == 'video' and (not isinstance(file.duration, int) or file.duration == 0):
        raise ValueError(f'Validation failed: Invalid video duration of {file.duration}')
    if file.type == 'image' and file.duration is not None:
        raise ValueError(f'Validation failed: Duration must not be set for images: {file.duration}')
    if not (file.latitude is None or ((isinstance(file.latitude, int) or isinstance(file.latitude, float)))):
        raise ValueError(f'Validation failed: Invalid latitude of {file.latitude}')
    if not (file.longitude is None or ((isinstance(file.longitude, int) or isinstance(file.longitude, float)))):
        raise ValueError(f'Validation failed: Invalid longitude of {file.longitude}')
    if file.make is not None and (not isinstance(file.make, str) or file.make == ''):
        raise ValueError(f'Validation failed: Invalid make of {file.make}')
    if file.model is not None and (not isinstance(file.model, str) or file.model == ''):
        raise ValueError(f'Validation failed: Invalid model of {file.model}')
    if not isinstance(file.sha256, str) or len(file.sha256) != 64:
        raise ValueError(f'Validation failed: Invalid sha256 of {file.sha256}')
    if not isinstance(file.thumbnail, bytes) or len(file.thumbnail) == 0:
        raise ValueError(f'Validation failed: Invalid thumbnail of {file.thumbnail}')


def process_file(args: argparse.Namespace, file_path: Path) -> Optional[FileMetadata]:
    '''
    Process a file and load its metadata

    Args:
        args:      Command line arguments
        file_path: Path of the file to process

    Returns:
        The processed files metadata
    '''
    mime_type = mimetypes.guess_type(file_path)[0]
    if mime_type is None:
        logger.warning(f'Skipping unsupported file: {file_path}')
        return None

    stats = os.stat(file_path)
    file = FileMetadata(path=str(file_path), type=mime_type, timestamp=int(stats.st_mtime), size=stats.st_size)

    if mime_type.startswith('image'):
        file.type = 'image'
        load_image_metadata(file, args.file_time)
    elif mime_type.startswith('video') or mime_type in ['audio/3gpp']:
        file.type = 'video'
        load_video_metadata(file)
    else:
        logger.warning(f'Skipping unsupported file of mime type {mime_type}: {file_path}')
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
    start_time = int(time.time())
    logger.info(f'Indexing {path}')
    res = Result()
    progress = Progress(db, args.progress_update, args.log_progress)
    existing_files = get_existing_media(db)
    files = [path] if path.is_file() else [f for f in path.rglob('*') if f.is_file()]
    to_process = [f for f in files if f not in existing_files]
    res.skipped += len(files) - len(to_process)
    if res.skipped > 0:
        logger.info(f'Skipping {res.skipped} file{"s" if res.skipped > 1 else ""} already indexed')

    # Set this to allow loading truncated images
    ImageFile.LOAD_TRUNCATED_IMAGES = True

    processed: List[FileMetadata] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.ncpu) as executor:
        futures = {executor.submit(process_file, args, path): path for path in to_process}
        for future in concurrent.futures.as_completed(futures):
            try:
                path = futures[future]
                file = future.result()
                if file:
                    res.processed += 1
                    processed.append(file)
                else:
                    res.skipped += 1
            except Exception as e:
                logger.error(f'Unable to process {path}: {e}')
                res.failed += 1

            now = int(time.time())
            progress.update('processing', {
                'processed': res.processed,
                'skipped': res.skipped,
                'failed': res.failed,
                'total': len(to_process),
                'time': now,
                'duration': now - start_time
            })

    if args.dry_run:
        json.dump([f.model_dump(exclude=['thumbnail']) for f in processed], sys.stdout)
    else:
        with db.connection.transaction():
            insert_media(db, processed)

    logger.info(f'Processed: {res.processed}, skipped: {res.skipped}, failed: {res.failed}')
    now = int(time.time())
    progress.update('complete', {
        'processed': res.processed,
        'skipped': res.skipped,
        'failed': res.failed,
        'total': len(to_process),
        'time': now,
        'duration': now - start_time
    })
    return res


def set_log_level(level):
    '''
    Set the logger level.

    Args:
        level: The new log level
    '''
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
    parser.add_argument('-r', '--dry-run', action='store_true', help='Don\'t modify the database. Dump to stdout changes to make')
    parser.add_argument('-u', '--progress-update', type=int, default=3, help='Progress update interval')
    parser.add_argument('-U', '--log-progress', action='store_true', help='Log progress')
    parser.add_argument('-t', '--file-time', action='store_true', help='Force the use of the file timestamp')

    args = parser.parse_args()

    if not Path(args.env).exists():
        parser.error(f'{args.env} not found')

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
                    cur.execute('LISTEN media_processor')
                    logger.info('Connected to db. Listening...')
                    for notify in conn.notifies():
                        with Lock(cur):
                            index_directory(args, cur, Path(notify.payload))
        except KeyboardInterrupt:
            break
        except:
            logger.exception('Uncaught exception. Will reconnect in 10s')
            time.sleep(10)


if __name__ == '__main__':  # pragma: no cover
    try:
        sys.exit(main(parse_args()))
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception(exc, exc_info=True)
