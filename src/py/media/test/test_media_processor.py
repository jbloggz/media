#
# MIT License
#
# Author: Josef Barnes
#
# Unit tests for the metadata module
#

'''
Unit tests for the metadata module
'''

# System Imports
import unittest
from unittest.mock import patch
from pathlib import Path

# Local imports
from media.media_processor import MediaProcessor
from media.logger import logger
from media.model import FileMetadata


# Disable logging
logger.disabled = True


class TestMediaProcessor(unittest.TestCase):
    def setUp(self):
        self.file = FileMetadata(
            path='/foo/bar.jpg',
            type='image',
            timestamp=1718338124,
            size=1234,
            width=1920,
            height=1080,
            duration=None,
            latitude=None,
            longitude=None,
            make=None,
            model=None,
            sha256='1589a15e55fbebc6519c95d91d8f0a090618f20dc78e479858b9c27552484961',
            thumbnail=b'xxxxxxx',
        )

        # Setup mocks
        self.db_patcher = patch('media.media_processor.db')
        self.mock_db = self.db_patcher.start()
        self.path_patcher = patch('media.media_processor.Path')
        self.mock_path = self.path_patcher.start()
        self.mock_path.return_value.exists.return_value = True
        self.load_metadata_patcher = patch('media.media_processor.load_file_metadata')
        self.mock_load_metadata = self.load_metadata_patcher.start()
        self.mock_load_metadata.return_value = self.file

    def tearDown(self):
        # Remove mocks
        self.db_patcher.stop()
        self.path_patcher.stop()
        self.load_metadata_patcher.stop()

    def test_create_a_processor(self):
        p = MediaProcessor()
        self.assertIsNotNone(p)

    def test_can_validate_file(self):
        p = MediaProcessor()
        try:
            p.validate_file(self.file)
        except Exception as e:
            self.fail(e)

    def test_validation_fails_if_no_file(self):
        p = MediaProcessor()
        self.mock_path.return_value.exists.return_value = False
        self.assertRaises(ValueError, p.validate_file, self.file)

    def test_validation_fails_if_bad_type(self):
        p = MediaProcessor()
        self.file.type = 'foo'
        self.assertRaises(ValueError, p.validate_file, self.file)

    def test_validation_fails_if_bad_timestamp(self):
        p = MediaProcessor()
        self.file.timestamp = 0
        self.assertRaises(ValueError, p.validate_file, self.file)
        self.file.timestamp = '1718338124'
        self.assertRaises(ValueError, p.validate_file, self.file)

    def test_validation_fails_if_bad_size(self):
        p = MediaProcessor()
        self.file.size = 0
        self.assertRaises(ValueError, p.validate_file, self.file)
        self.file.size = '1718338124'
        self.assertRaises(ValueError, p.validate_file, self.file)

    def test_validation_fails_if_bad_width(self):
        p = MediaProcessor()
        self.file.width = 0
        self.assertRaises(ValueError, p.validate_file, self.file)
        self.file.width = '1718338124'
        self.assertRaises(ValueError, p.validate_file, self.file)

    def test_validation_fails_if_bad_height(self):
        p = MediaProcessor()
        self.file.height = 0
        self.assertRaises(ValueError, p.validate_file, self.file)
        self.file.height = '1718338124'
        self.assertRaises(ValueError, p.validate_file, self.file)

    def test_validation_fails_if_missing_video_duration(self):
        p = MediaProcessor()
        self.file.type = 'video'
        self.file.duration = 0
        self.assertRaises(ValueError, p.validate_file, self.file)
        self.file.duration = '1234'
        self.assertRaises(ValueError, p.validate_file, self.file)

    def test_validation_fails_if_image_has_duration(self):
        p = MediaProcessor()
        self.file.duration = 1234
        self.assertRaises(ValueError, p.validate_file, self.file)

    def test_validation_fails_if_bad_latitude(self):
        p = MediaProcessor()
        self.file.latitude = '123'
        self.assertRaises(ValueError, p.validate_file, self.file)

    def test_validation_fails_if_bad_longitude(self):
        p = MediaProcessor()
        self.file.longitude = '123'
        self.assertRaises(ValueError, p.validate_file, self.file)

    def test_validation_fails_if_bad_make(self):
        p = MediaProcessor()
        self.file.make = 123
        self.assertRaises(ValueError, p.validate_file, self.file)
        self.file.make = ''
        self.assertRaises(ValueError, p.validate_file, self.file)

    def test_validation_fails_if_bad_model(self):
        p = MediaProcessor()
        self.file.model = 123
        self.assertRaises(ValueError, p.validate_file, self.file)
        self.file.model = ''
        self.assertRaises(ValueError, p.validate_file, self.file)

    def test_validation_fails_if_bad_sha256(self):
        p = MediaProcessor()
        self.file.sha256 = 1234
        self.assertRaises(ValueError, p.validate_file, self.file)
        self.file.sha256 = 'wfi73gw'
        self.assertRaises(ValueError, p.validate_file, self.file)

    def test_validation_fails_if_bad_thumbnail(self):
        p = MediaProcessor()
        self.file.thumbnail = 1234
        self.assertRaises(ValueError, p.validate_file, self.file)
        self.file.thumbnail = b''
        self.assertRaises(ValueError, p.validate_file, self.file)

    def test_can_get_file_list(self):
        p = MediaProcessor()
        self.mock_path.return_value.is_file.return_value = True
        self.mock_db.strip_existing_paths.return_value = {Path('/foo/bar1.jpg')}
        files = p.get_file_list({self.mock_path('/foo/bar1.jpg'), self.mock_path('/foo/bar2.jpg'), self.mock_path('/foo/bar3.jpg')})
        self.assertEqual(files, {Path('/foo/bar1.jpg')})

    def test_can_get_file_list_from_dir(self):
        p = MediaProcessor()
        self.mock_path.return_value.is_file.return_value = False
        self.mock_path.return_value.rglob.return_value = {Path('/foo/bar1.jpg'), Path('/foo/bar2.jpg'), Path('/foo/bar3.jpg')}
        self.mock_db.strip_existing_paths.return_value = {Path('/foo/bar1.jpg'), Path('/foo/bar2.jpg'), Path('/foo/bar3.jpg')}
        files = p.get_file_list({self.mock_path('/foo')})
        self.assertEqual(files, {Path('/foo/bar1.jpg'), Path('/foo/bar2.jpg'), Path('/foo/bar3.jpg')})

    def test_can_run_processor(self):
        p = MediaProcessor()
        p.get_file_list = lambda _: {Path('/foo/bar.jpg')}
        p.run([Path('/foo/bar.jpg')])
        self.mock_db.bulk_insert_media.assert_called_with([self.file])

    @patch('json.dump')
    def test_doesnt_insert_media_on_dry_run(self, _):
        p = MediaProcessor(dry_run=True)
        p.get_file_list = lambda _: {Path('/foo/bar.jpg')}
        p.run([Path('/foo/bar.jpg')])
        self.mock_db.bulk_insert_media.assert_not_called()

    def test_skips_files_that_fail_processing(self):
        p = MediaProcessor()
        p.get_file_list = lambda _: {Path('/foo/bar.jpg'), Path('/foo/baz.jpg')}
        self.mock_load_metadata.side_effect = lambda f, _: self.file if f.name == 'bar.jpg' else None
        p.run([Path('/foo')])
        self.mock_db.bulk_insert_media.assert_called_with([self.file])

    def test_skips_files_that_throw_exceptions(self):
        p = MediaProcessor()
        p.get_file_list = lambda _: {Path('/foo/bar.jpg'), Path('/foo/baz.jpg')}
        self.mock_load_metadata.side_effect = lambda f, _: self.file if f.name == 'bar.jpg' else ValueError('Failed')
        p.run([Path('/foo')])
        self.mock_db.bulk_insert_media.assert_called_with([self.file])
