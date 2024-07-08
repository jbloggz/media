#
# MIT License
#
# Author: Josef Barnes
#
# Unit tests for the util functions
#

'''
Unit tests for the util functions
'''

# System Imports
import unittest
import os
from unittest.mock import MagicMock, patch
from types import SimpleNamespace
from pathlib import Path

# 3rd Party Imports
from PIL import Image
import pyfakefs.fake_filesystem_unittest

# Local imports
from media.model import FileMetadata
from media.logger import logger
from media.util import generate_image_thumbnail, parse_exif_timestamp, parse_video_duration, decode_exif, parse_exif_property, parse_exif_gps, calculate_sha256, load_video_metadata, load_image_metadata, load_file_metadata, get_file_stats


# Disable logging
logger.disabled = True


class TestGetFileStats(unittest.TestCase):
    @patch('os.stat')
    def test_can_stat_file(self, mock_stat):
        mock_stat.return_value = SimpleNamespace(
            st_size=1234,
            st_mtime=1720448887
        )
        self.assertEqual(get_file_stats('test.foo'), (1720448887, 1234))


class TestGenerateImageThumbnail(unittest.TestCase):
    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_can_generate_thumbnail_landscape(self):
        mock_image = MagicMock(spec=Image.Image)
        mock_image.width = 1920
        mock_image.height = 1080
        generate_image_thumbnail(mock_image, 320)
        mock_image.crop.assert_called_with((420, 0, 1500, 1080))

    def test_can_generate_thumbnail_portrait(self):
        mock_image = MagicMock(spec=Image.Image)
        mock_image.width = 1080
        mock_image.height = 1920
        generate_image_thumbnail(mock_image, 320)
        mock_image.crop.assert_called_with((0, 420, 1080, 1500))

    def test_converts_color_mode(self):
        mock_image = MagicMock(spec=Image.Image)
        mock_image.width = 1920
        mock_image.height = 1080
        mock_image.mode = 'P'
        mock_image.crop.return_value = mock_image
        generate_image_thumbnail(mock_image, 320)
        mock_image.convert.assert_called_with('RGB')


class TestDecodeExifTimestamp(unittest.TestCase):
    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_can_parse_timestamp(self):
        exif = {
            'DateTime': '2022:05:12 13:45:21'
        }
        self.assertEqual(parse_exif_timestamp(exif), 1652327121)

    def test_can_parse_alternate_timestamp(self):
        exif = {
            'DateTime': '2022/05/12 13:45:21'
        }
        self.assertEqual(parse_exif_timestamp(exif), 1652327121)

    def test_ignores_invalid_timestamp(self):
        exif = {
            'ExifOffset': {
                'DateTimeOriginal': 'foo',
                'DateTimeDigitized': '2022/05/12 13:45:20',
            },
            'DateTime': '2022/05/12 13:45:21'
        }
        self.assertEqual(parse_exif_timestamp(exif), 1652327120)

    def test_ignores_future_timestamp(self):
        exif = {
            'ExifOffset': {
                'DateTimeOriginal': '2025/05/12 13:45:21',
            },
            'DateTime': '2022/05/12 13:45:21'
        }
        self.assertEqual(parse_exif_timestamp(exif), 1652327121)

    def test_returns_none_if_no_valid_value(self):
        exif = {
            'ExifOffset': {
                'DateTimeOriginal': '2025/05/12 13:4521',
            },
            'DateTime': '202205/12 13:45:21'
        }
        self.assertEqual(parse_exif_timestamp(exif), None)


class TestParseVideoDuration(unittest.TestCase):
    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_can_parse_duration_from_probe(self):
        self.assertEqual(parse_video_duration({'format': {'duration': 321}}, {'duration': 123}), 321000)

    def test_can_parse_duration_from_video(self):
        self.assertEqual(parse_video_duration({'format': {'duration': None}}, {'duration': 123}), 123000)

    def test_throws_if_no_valid_duration(self):
        self.assertRaises(ValueError, parse_video_duration, {}, ())


class TestDecodeExif(unittest.TestCase):
    def setUp(self):
        self.exif_bytes = b'Exif\x00\x00II*\x00\x08\x00\x00\x00\x0b\x00\x0f\x01\x02\x00\x08\x00\x00\x00\x92\x00\x00\x00\x10\x01\x02\x00\t\x00\x00\x00\x9a\x00\x00\x00\x12\x01\x03\x00\x01\x00\x00\x00\x06\x00\x00\x00\x1a\x01\x05\x00\x01\x00\x00\x00\xa4\x00\x00\x00\x1b\x01\x05\x00\x01\x00\x00\x00\xac\x00\x00\x00(\x01\x03\x00\x01\x00\x00\x00\x02\x00\x00\x001\x01\x02\x00\x0e\x00\x00\x00\xb4\x00\x00\x002\x01\x02\x00\x14\x00\x00\x00\xc2\x00\x00\x00\x13\x02\x03\x00\x01\x00\x00\x00\x01\x00\x00\x00i\x87\x04\x00\x01\x00\x00\x00\xd6\x00\x00\x00%\x88\x04\x00\x01\x00\x00\x00\x82\x03\x00\x00\x00\x00\x00\x00samsung\x00SM-G991B\x00\x00H\x00\x00\x00\x01\x00\x00\x00H\x00\x00\x00\x01\x00\x00\x00G991BXXS9EWH1\x002023:09:22 10:10:29\x00\'\x00\x9a\x82\x05\x00\x01\x00\x00\x00\xb0\x02\x00\x00\x9d\x82\x05\x00\x01\x00\x00\x00\xb8\x02\x00\x00"\x88\x03\x00\x01\x00\x00\x00\x02\x00\x00\x00\'\x88\x03\x00\x01\x00\x00\x00\xfa\x00\x00\x00\x00\x90\x07\x00\x04\x00\x00\x000220\x03\x90\x02\x00\x14\x00\x00\x00\xc0\x02\x00\x00\x04\x90\x02\x00\x14\x00\x00\x00\xd4\x02\x00\x00\x10\x90\x02\x00\x07\x00\x00\x00\xe8\x02\x00\x00\x11\x90\x02\x00\x07\x00\x00\x00\xf0\x02\x00\x00\x12\x90\x02\x00\x07\x00\x00\x00\xf8\x02\x00\x00\x01\x91\x01\x00\x04\x00\x00\x00\x01\x02\x03\x00\x01\x92\x05\x00\x01\x00\x00\x00\x00\x03\x00\x00\x02\x92\x05\x00\x01\x00\x00\x00\x08\x03\x00\x00\x03\x92\x05\x00\x01\x00\x00\x00\x10\x03\x00\x00\x04\x92\x05\x00\x01\x00\x00\x00\x18\x03\x00\x00\x05\x92\x05\x00\x01\x00\x00\x00 \x03\x00\x00\x07\x92\x03\x00\x01\x00\x00\x00\x02\x00\x00\x00\t\x92\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\n\x92\x05\x00\x01\x00\x00\x00(\x03\x00\x00\x86\x92\x01\x00\r\x00\x00\x000\x03\x00\x00\x90\x92\x02\x00\x05\x00\x00\x00>\x03\x00\x00\x91\x92\x02\x00\x05\x00\x00\x00D\x03\x00\x00\x92\x92\x02\x00\x05\x00\x00\x00J\x03\x00\x00\x00\xa0\x07\x00\x04\x00\x00\x000100\x01\xa0\x03\x00\x01\x00\x00\x00\x01\x00\x00\x00\x02\xa0\x03\x00\x01\x00\x00\x00\xc0\x0f\x00\x00\x03\xa0\x03\x00\x01\x00\x00\x00\xd0\x0b\x00\x00\x05\xa0\x04\x00\x01\x00\x00\x00P\x03\x00\x00\x01\xa3\x01\x00\x04\x00\x00\x00\x01\x00\x00\x00\x01\xa4\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\x02\xa4\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\x03\xa4\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\x04\xa4\n\x00\x01\x00\x00\x00n\x03\x00\x00\x05\xa4\x03\x00\x01\x00\x00\x00\x1a\x00\x00\x00\x06\xa4\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\x08\xa4\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\t\xa4\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\n\xa4\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00 \xa4\x02\x00\x0c\x00\x00\x00v\x03\x00\x00\x00\x00\x00\x00\x01\x00\x00\x002\x00\x00\x00\t\x00\x00\x00\x05\x00\x00\x002023:09:22 10:10:29\x002023:09:22 10:10:29\x00+10:00\x00\x00+10:00\x00\x00+10:00\x00\x00\x8d\x00\x00\x00\x19\x00\x00\x00\xa9\x00\x00\x00d\x00\x00\x00o\x00\x00\x00d\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\xa9\x00\x00\x00d\x00\x00\x00\x1b\x00\x00\x00\x05\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x000326\x00\x000326\x00\x000326\x00\x00\x02\x00\x01\x00\x02\x00\x04\x00\x00\x00R98\x00\x02\x00\x07\x00\x04\x00\x00\x000100\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00R12LLMF05VM\x00\n\x00\x00\x00\x01\x00\x04\x00\x00\x00\x02\x02\x00\x00\x01\x00\x02\x00\x02\x00\x00\x00S\x00\x00\x00\x02\x00\x05\x00\x03\x00\x00\x00\x00\x04\x00\x00\x03\x00\x02\x00\x02\x00\x00\x00E\x00\x00\x00\x04\x00\x05\x00\x03\x00\x00\x00\x18\x04\x00\x00\x05\x00\x01\x00\x01\x00\x00\x00\x00\x00\x00\x00\x06\x00\x05\x00\x01\x00\x00\x000\x04\x00\x00\x07\x00\x05\x00\x03\x00\x00\x008\x04\x00\x00\x1b\x00\x01\x00\x0f\x00\x00\x00P\x04\x00\x00\x1d\x00\x02\x00\x0b\x00\x00\x00`\x04\x00\x00\x00\x00\x00\x00\x1b\x00\x00\x00\x01\x00\x00\x006\x00\x00\x00\x01\x00\x00\x00\x15A\x01\x00\xa8a\x00\x00\x99\x00\x00\x00\x01\x00\x00\x00\x01\x00\x00\x00\x01\x00\x00\x00\xc9\x80\x16\x00\xa8a\x00\x00\x06\x01\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\n\x00\x00\x00\x01\x00\x00\x00\x07\x00\x00\x00\x01\x00\x00\x00ASCII\x00\x00\x00CELLID\x00\x002023:09:22\x00\x00'
        self.exif = Image.Exif()
        self.exif.load(self.exif_bytes)

    def test_can_decode_exif(self):
        self.assertEqual(decode_exif(self.exif), {
            'DateTime': '2023:09:22 10:10:29',
            'ExifOffset': {
                'ApertureValue': 1.69,
                'BrightnessValue': 1.11,
                'ColorSpace': 1,
                'ComponentsConfiguration': '0x01020300',
                'Contrast': 0,
                'CustomRendered': 0,
                'DateTimeDigitized': '2023:09:22 10:10:29',
                'DateTimeOriginal': '2023:09:22 10:10:29',
                'DigitalZoomRatio': 0,
                'ExifImageHeight': 3024,
                'ExifImageWidth': 4032,
                'ExifInteroperabilityOffset': 848,
                'ExifVersion': '0x30323230',
                'ExposureBiasValue': 0.0,
                'ExposureMode': 0,
                'ExposureProgram': 2,
                'ExposureTime': 0.02,
                'FNumber': 1.8,
                'Flash': 0,
                'FlashPixVersion': '0x30313030',
                'FocalLength': 5.4,
                'FocalLengthIn35mmFilm': 26,
                'ISOSpeedRatings': 250,
                'ImageUniqueID': 'R12LLMF05VM',
                'MaxApertureValue': 1.69,
                'MeteringMode': 2,
                'OffsetTime': '+10:00',
                'OffsetTimeDigitized': '+10:00',
                'OffsetTimeOriginal': '+10:00',
                'Saturation': 0,
                'SceneCaptureType': 0,
                'SceneType': '0x01000000',
                'Sharpness': 0,
                'ShutterSpeedValue': 5.64,
                'SubsecTime': '0326',
                'SubsecTimeDigitized': '0326',
                'SubsecTimeOriginal': '0326',
                'UserComment': '0x00000000000000000000000000',
                'WhiteBalance': 0
            },
            'GPSInfo': {
                'GPSAltitude': 262.0,
                'GPSAltitudeRef': '0x00',
                'GPSDateStamp': '2023:09:22',
                'GPSLatitude': [27.0, 54.0, 3.28788],
                'GPSLatitudeRef': 'S',
                'GPSLongitude': [153.0, 1.0, 58.99044],
                'GPSLongitudeRef': 'E',
                'GPSProcessingMethod': '0x415343494900000043454c4c494400',
                'GPSTimeStamp': [0.0, 10.0, 7.0],
                'GPSVersionID': '0x02020000'
            },
            'Make': 'samsung',
            'Model': 'SM-G991B',
            'Orientation': 6,
            'ResolutionUnit': 2,
            'Software': 'G991BXXS9EWH1',
            'XResolution': 72.0,
            'YCbCrPositioning': 1,
            'YResolution': 72.0
        })

    def test_returns_none_if_exif_is_none(self):
        self.assertIsNone(decode_exif(None))


class TestParseExifProperty(unittest.TestCase):
    def test_can_parse_property(self):
        self.assertEqual(parse_exif_property({'foo': 'bar'}, 'foo'), 'bar')

    def test_returns_none_if_not_string(self):
        self.assertEqual(parse_exif_property({'foo': 1}, 'foo'), None)

    def test_strips_non_printable_characters(self):
        self.assertEqual(parse_exif_property({'foo': 'he\x12llo'}, 'foo'), 'hello')


class TestParseExifGPS(unittest.TestCase):
    def test_can_parse_gps(self):
        exif = {
            'GPSInfo': {
                'GPSLatitudeRef': 'N',
                'GPSLongitudeRef': 'E',
                'GPSLatitude': (53, 37.5, 18.9),
                'GPSLongitude': (123.4, 45, 10.8),
            }
        }
        self.assertEqual(parse_exif_gps(exif), (53.63025, 124.153))

    def test_can_parse_gps_negative(self):
        exif = {
            'GPSInfo': {
                'GPSLatitudeRef': 'S',
                'GPSLongitudeRef': 'W',
                'GPSLatitude': (53, 37.5, 18.9),
                'GPSLongitude': (123.4, 45, 10.8),
            }
        }
        self.assertEqual(parse_exif_gps(exif), (-53.63025, -124.153))

    def test_returns_none_on_failure(self):
        exif = {
            'GPSInfo': {
                'GPSLatitudeRef': 'S',
                'GPSLongitudeRef': 'W',
                'GPSLatitude': 4,
                'GPSLongitude': (123.4, 45, 10.8),
            }
        }
        self.assertEqual(parse_exif_gps(exif), (None, None))


class TestCalculateSHA256(pyfakefs.fake_filesystem_unittest.TestCase):
    def setUp(self):
        self.setUpPyfakefs()

    def test_can_calclulate_sha256(self):
        self.fs.create_file(self.id(), contents='hello')
        self.assertEqual(calculate_sha256(Path(self.id())), '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')

    def test_can_calclulate_large_file(self):
        contents = ''
        for i in range(100000):
            contents += f'{i}'
        self.fs.create_file(self.id(), contents=contents)
        self.assertEqual(calculate_sha256(Path(self.id())), '1432bdc73930323a72540d53a607cddc754af291656653840d63f7c0413c31d1')


class TestLoadVideoMetadata(unittest.TestCase):
    def setUp(self):
        self.file = FileMetadata(
            path='/foo/bar.jpg',
            type='video',
            timestamp=1718338124,
            size=1234
        )

    @patch('media.util.ffmpeg.probe', ValueError('failed'))
    def test_throws_if_ffmpeg_probe_fails(self):
        self.assertRaises(ValueError, load_video_metadata, self.file)

    @patch('media.util.ffmpeg.probe')
    def test_throws_if_no_video_streams(self, mock_probe):
        mock_probe.return_value = {}
        self.assertRaises(ValueError, load_video_metadata, self.file)

    @patch('media.util.ffmpeg.probe')
    def test_throws_if_no_width(self, mock_probe):
        mock_probe.return_value = {
            'streams': [
                {
                    'codec_type': 'video'
                }
            ]
        }
        self.assertRaises(KeyError, load_video_metadata, self.file)

    @patch('media.util.ffmpeg.probe')
    @patch('media.util.av.open', MagicMock())
    @patch('media.util.generate_image_thumbnail', MagicMock())
    def test_can_load_metadata(self, mock_probe):
        mock_probe.return_value = {
            'streams': [
                {
                    'codec_type': 'video',
                    'width': 1920,
                    'height': 1080,
                    'duration': 123,
                }
            ]
        }
        os.environ['THUMBNAIL_SIZE'] = '320'
        load_video_metadata(self.file)
        self.assertEqual(self.file.width, 1920)

    @patch('media.util.ffmpeg.probe')
    @patch('media.util.av.open', MagicMock())
    @patch('media.util.generate_image_thumbnail', MagicMock())
    def test_can_load_metadata_if_cannot_get_rotation(self, mock_probe):
        mock_probe.return_value = {
            'streams': [
                {
                    'codec_type': 'audio',
                },
                {
                    'codec_type': 'video',
                    'width': 1920,
                    'height': 1080,
                    'duration': 123,
                    'tags': {
                        'rotate': {
                            'error'
                        }
                    }
                }
            ]
        }
        os.environ['THUMBNAIL_SIZE'] = '320'
        load_video_metadata(self.file)
        self.assertEqual(self.file.width, 1920)


class TestLoadImageMetadata(unittest.TestCase):
    def setUp(self):
        self.image_patcher = patch('media.util.Image.open')
        self.mock_image = self.image_patcher.start()
        self.decode_exif_patcher = patch('media.util.decode_exif')
        self.mock_decode_exif = self.decode_exif_patcher.start()
        self.generate_image_thumbnail_patcher = patch('media.util.generate_image_thumbnail')
        self.mock_generate_image_thumbnail = self.generate_image_thumbnail_patcher.start()

    def tearDown(self):
        self.image_patcher.stop()
        self.decode_exif_patcher.stop()
        self.generate_image_thumbnail_patcher.stop()

    def test_loads_metadata_with_valid_exif(self):
        os.environ['THUMBNAIL_SIZE'] = '128'

        # Mocking the image and EXIF data
        self.mock_image.return_value.size = (1920, 1080)
        self.mock_decode_exif.return_value = {
            'Make': 'TestMake',
            'Model': 'TestModel',
            'DateTime': '2021:09:22 20:00:00',
            'GPSInfo': {
                'GPSLatitudeRef': 'N',
                'GPSLongitudeRef': 'E',
                'GPSLatitude': (40, 30, 0),
                'GPSLongitude': (70, 40, 0),
            }
        }

        file = FileMetadata(path='example.jpg', type='image', timestamp=1632345600, size=1024)
        use_file_time = False

        load_image_metadata(file, use_file_time)

        self.assertEqual(file.width, 1920)
        self.assertEqual(file.height, 1080)
        self.assertEqual(file.make, 'TestMake')
        self.assertEqual(file.model, 'TestModel')
        self.assertEqual(file.timestamp, 1632304800)
        self.assertEqual(file.latitude, 40.5)
        self.assertEqual(file.longitude, 70.66666666666667)
        self.assertIsNotNone(file.thumbnail)

    def test_handles_corrupted_or_incomplete_exif(self):
        os.environ['THUMBNAIL_SIZE'] = '128'

        # Mocking the image and corrupted EXIF data
        # Mocking the image and EXIF data
        self.mock_image.return_value.size = (1920, 1080)
        self.mock_decode_exif.return_value = {
            'Make': 'TestMake',
            'Model': 'TestModel',
            'DateTime': 'InvalidDateTime',
            'GPSInfo': {
                'GPSLatitudeRef': 'N',
                'GPSLongitudeRef': 'E',
                'GPSLatitude': (40, 30, 0),
                'GPSLongitude': (70, 40, 0),
            }
        }

        file = FileMetadata(path='example.jpg', type='image', timestamp=1632345600, size=1024)
        use_file_time = False

        load_image_metadata(file, use_file_time)

        self.assertEqual(file.width, 1920)
        self.assertEqual(file.height, 1080)
        self.assertEqual(file.make, 'TestMake')
        self.assertEqual(file.model, 'TestModel')
        self.assertEqual(file.timestamp, 1632345600)
        self.assertEqual(file.latitude, 40.5)
        self.assertEqual(file.longitude, 70.66666666666667)
        self.assertIsNotNone(file.thumbnail)

    def test_uses_file_time_if_asked(self):
        os.environ['THUMBNAIL_SIZE'] = '128'

        # Mocking the image and EXIF data
        self.mock_image.return_value.size = (1920, 1080)
        self.mock_decode_exif.return_value = {
            'Make': 'TestMake',
            'Model': 'TestModel',
            'DateTime': '2021:09:22 20:00:00',
            'GPSInfo': {
                'GPSLatitudeRef': 'N',
                'GPSLongitudeRef': 'E',
                'GPSLatitude': (40, 30, 0),
                'GPSLongitude': (70, 40, 0),
            }
        }

        file = FileMetadata(path='example.jpg', type='image', timestamp=1632345600, size=1024)
        use_file_time = True

        load_image_metadata(file, use_file_time)

        self.assertEqual(file.width, 1920)
        self.assertEqual(file.height, 1080)
        self.assertEqual(file.make, 'TestMake')
        self.assertEqual(file.model, 'TestModel')
        self.assertEqual(file.timestamp, 1632345600)
        self.assertEqual(file.latitude, 40.5)
        self.assertEqual(file.longitude, 70.66666666666667)
        self.assertIsNotNone(file.thumbnail)

    def test_hadles_decode_exif_failing(self):
        os.environ['THUMBNAIL_SIZE'] = '128'

        # Mocking the image and EXIF data
        self.mock_image.return_value.size = (1920, 1080)
        self.mock_decode_exif.return_value = None

        file = FileMetadata(path='example.jpg', type='image', timestamp=1632345600, size=1024)
        use_file_time = True

        load_image_metadata(file, use_file_time)

        self.assertEqual(file.width, 1920)
        self.assertEqual(file.height, 1080)
        self.assertIsNone(file.make)
        self.assertIsNone(file.model)
        self.assertEqual(file.timestamp, 1632345600)
        self.assertIsNone(file.latitude)
        self.assertIsNone(file.longitude)
        self.assertIsNotNone(file.thumbnail)


class TestLoadFileMetadata(unittest.TestCase):
    def setUp(self):
        self.load_image_metadata_patcher = patch('media.util.load_image_metadata')
        self.mock_load_image_metadata = self.load_image_metadata_patcher.start()
        self.load_video_metadata_patcher = patch('media.util.load_video_metadata')
        self.mock_load_video_metadata = self.load_video_metadata_patcher.start()
        self.calculate_sha256_patcher = patch('media.util.calculate_sha256')
        self.mock_calculate_sha256 = self.calculate_sha256_patcher.start()
        self.stat_patcher = patch('media.util.get_file_stats')
        self.mock_stat = self.stat_patcher.start()
        self.mock_stat.return_value = 1632304800, 8675309

    def tearDown(self):
        self.load_image_metadata_patcher.stop()
        self.load_video_metadata_patcher.stop()
        self.calculate_sha256_patcher.stop()
        self.stat_patcher.stop()

    def test_returns_none_if_invalid_mime_type(self):
        self.assertIsNone(load_file_metadata(Path('foo.qwerty'), True))

    def test_returns_none_if_unsupported_mime_type(self):
        self.assertIsNone(load_file_metadata(Path('foo.pdf'), True))

    def test_calls_load_image_metadata(self):
        path = Path('foo.jpg')
        use_file_time = True
        load_file_metadata(path, use_file_time)
        self.mock_load_image_metadata.assert_called_once()
        self.mock_load_video_metadata.assert_not_called()
        call = self.mock_load_image_metadata.mock_calls[0]
        self.assertEqual(call.args[0].path, 'foo.jpg')

    def test_calls_load_video_metadata(self):
        path = Path('foo.mp4')
        use_file_time = True
        load_file_metadata(path, use_file_time)
        self.mock_load_image_metadata.assert_not_called()
        self.mock_load_video_metadata.assert_called_once()
        call = self.mock_load_video_metadata.mock_calls[0]
        self.assertEqual(call.args[0].path, 'foo.mp4')
