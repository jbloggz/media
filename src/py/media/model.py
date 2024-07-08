#
# MIT License
#
# Author: Josef Barnes
#
# Models shared across the App
#

'''
Models chared across the app
'''

# 3rd Party Imports
from pydantic import BaseModel


class FileMetadata(BaseModel):
    '''
    The metadata for a media file
    '''
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
