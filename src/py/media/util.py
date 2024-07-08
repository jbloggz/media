#
# MIT License
#
# Author: Josef Barnes
#
# The script to process and index files in the provided directory
#

'''
Function to load metadata from media files
'''

# System Imports
import os
import io
import time
import mimetypes
import datetime
import binascii
import hashlib
from pathlib import Path
from typing import Optional, Dict

# 3rd Party Imports
import ffmpeg
import av
from PIL.ExifTags import TAGS, GPSTAGS
from PIL import Image, TiffImagePlugin, ImageOps, ImageFile

# Local Imports
from media.logger import logger
from media.model import FileMetadata


# Set this to allow loading truncated images
ImageFile.LOAD_TRUNCATED_IMAGES = True


def get_file_stats(path: Path):
    '''
    Get the timestamp and size of a file

    Args:
        path:   Path to the file

    Returns:
        A tuple with the timestamp and size
    '''
    stats = os.stat(path)
    return int(stats.st_mtime), stats.st_size


def generate_image_thumbnail(img: Image.Image, size: int):
    '''
    Generate a square thumbnail for an image

    Args:
        img:    The image to generate the thumb from
        size:   The width/height of the thumbnail to generate, in pixels

    Returns:
        A size x size thumbnail of the image
    '''
    min_xy = min(img.width, img.height)
    box = ((img.width - min_xy) // 2, (img.height - min_xy) // 2, (img.width + min_xy) // 2, (img.height + min_xy) // 2)
    cropped = img.crop(box)
    cropped.thumbnail((size, size))
    thumb = io.BytesIO()
    if cropped.mode in ('RGBA', 'P'):
        cropped = cropped.convert('RGB')
    cropped.save(thumb, format='JPEG')
    return thumb.getvalue()


def parse_exif_timestamp(exif: Dict) -> Optional[int]:
    '''
    Find the EXIF timestamp and convert to unix epoch seconds

    Args:
        exif:  The raw decoded EXIF data

    Returns:
        A unix epoch timestamp, or None if no valid timestamp found
    '''
    candidates = [
        exif.get('ExifOffset', {}).get('DateTimeOriginal'),
        exif.get('ExifOffset', {}).get('DateTimeDigitized'),
        exif.get('DateTime'),
    ]

    for value in candidates:
        if not isinstance(value, str):
            continue
        for fmt in ['%Y:%m:%d %H:%M:%S', '%Y/%m/%d %H:%M:%S']:
            try:
                ts = int(datetime.datetime.strptime(value, fmt).timestamp())
                if ts is not None and ts < time.time():
                    return ts
            except:
                pass

    return None


def parse_exif_property(exif: Dict, attr: str) -> Optional[str]:
    '''
    Find a top level attribute in EXIF data

    Args:
        exif: The raw decoded EXIF data
        attr: The name of the attribute to find

    Returns:
        The attribute value, or None if not found
    '''
    val = exif.get(attr)
    if not isinstance(val, str):
        return None

    # Strip any non-printable characters
    return ''.join(c for c in val if 32 <= ord(c) <= 126)


def parse_video_duration(probe: Dict, video_info: Dict) -> int:
    '''
    Get the video duration from the ffprobe metadata

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


def parse_exif_gps(exif):
    '''
    Get the GPS latitude/longitude from the EXIF data

    Args:
        exif: The raw decoded EXIF data

    Returns:
        The tuple of (lat, lng) in degrees
    '''
    try:
        gps = exif['GPSInfo']
        lat_sign = 1 if gps['GPSLatitudeRef'] == 'N' else -1
        lng_sign = 1 if gps['GPSLongitudeRef'] == 'E' else -1
        lat = gps['GPSLatitude']
        lng = gps['GPSLongitude']
        return float((lat[0] + lat[1] / 60 + lat[2] / 3600) * lat_sign), float((lng[0] + lng[1] / 60 + lng[2] / 3600) * lng_sign)
    except:
        return None, None


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


def calculate_sha256(path: Path | str) -> str:
    '''
    Calculate a SHA256 checksum of a file

    Args:
        path: The path of the file to create the checksum

    Returns:
        The hex encoded sha256 digest
    '''
    sha = hashlib.sha256()
    buf = bytearray(128 * 1024)
    mv = memoryview(buf)
    with open(path, 'rb', buffering=0) as fp:
        while nbytes := fp.readinto(mv):
            sha.update(mv[:nbytes])
    return sha.hexdigest()


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
        # Get the first video stream that is found
        streams = [s for s in probe['streams'] if s['codec_type'] == 'video']
        video_info = streams[0]
    except:
        raise ValueError('No valid video stream found')
    file.width = int(video_info['width'])
    file.height = int(video_info['height'])
    file.duration = parse_video_duration(probe, video_info)

    try:
        rotation = int(video_info.get('tags', {}).get('rotate', 0))
    except:
        rotation = 0

    size = int(os.environ['THUMBNAIL_SIZE'])
    frames = av.open(file.path).decode(video=0)
    file.thumbnail = generate_image_thumbnail(next(frames).to_image().rotate(-rotation), size)


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
    exif = decode_exif(img.getexif())
    if exif is None:
        return

    file.make = parse_exif_property(exif, 'Make')
    file.model = parse_exif_property(exif, 'Model')
    timestamp = parse_exif_timestamp(exif)
    if not use_file_time:
        if timestamp is None:
            logger.warning(f'Invalid time found for {file.path}')
        else:
            file.timestamp = timestamp

    file.latitude, file.longitude = parse_exif_gps(exif)
    size = int(os.environ['THUMBNAIL_SIZE'])
    file.thumbnail = generate_image_thumbnail(ImageOps.exif_transpose(Image.open(file.path)), size)


def load_file_metadata(path: Path, use_file_mtime: bool) -> Optional[FileMetadata]:
    '''
    Load the metadata for a file

    Args:
        path:           Path of the file to load
        use_file_mtime: Use the mtime form the filesystem rather than the exif data

    Returns:
        The file metadata, or None if it couldn't be loaded
    '''
    mime_type = mimetypes.guess_type(path)[0]
    if mime_type is None:
        logger.warning(f'Skipping unsupported file: {path}')
        return None

    timestamp, size = get_file_stats(path)
    file = FileMetadata(path=str(path), type=mime_type, timestamp=timestamp, size=size)

    if mime_type.startswith('image'):
        file.type = 'image'
        load_image_metadata(file, use_file_mtime)
    elif mime_type.startswith('video') or mime_type in ['audio/3gpp']:
        file.type = 'video'
        load_video_metadata(file)
    else:
        logger.warning(f'Skipping unsupported file of mime type {mime_type}: {path}')
        return None

    file.sha256 = calculate_sha256(file.path)

    return file
