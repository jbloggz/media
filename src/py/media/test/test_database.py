#
# MIT License
#
# Author: Josef Barnes
#
# Unit tests for the database module
#

'''
Unit tests for the database module
'''

# System Imports
import unittest
from unittest.mock import patch, ANY
from types import SimpleNamespace
from pathlib import Path

# Local imports
from media.database import Database
from media.logger import logger
from media.model import FileMetadata


# Disable logging
logger.disabled = True


class TestDatabase(unittest.TestCase):
    def setUp(self):
        # Patch PostgreSQL
        self.psql_patcher = patch('media.database.psycopg')
        self.mock_psql = self.psql_patcher.start()

    def tearDown(self):
        # Stop the patches
        self.psql_patcher.stop()

    def test_create_a_db(self):
        db = Database()
        self.assertIsNotNone(db)
        self.assertIsNone(db.db)
        self.assertFalse(db.is_locked())
        self.assertFalse(db.is_open())

    def test_can_open_db(self):
        db = Database()
        with db.open():
            self.assertFalse(db.is_locked())
            self.assertTrue(db.is_open())
        self.assertFalse(db.is_locked())
        self.assertFalse(db.is_open())

    def test_can_lock_db(self):
        db = Database()
        with db.open():
            db.db.execute.return_value = db.db
            db.db.fetchone.return_value = [True]
            with db.lock():
                self.assertTrue(db.is_locked())
                self.assertTrue(db.is_open())
            self.assertFalse(db.is_locked())
            self.assertTrue(db.is_open())
        self.assertFalse(db.is_locked())
        self.assertFalse(db.is_open())

    def test_thows_if_locked(self):
        db = Database()
        with db.open():
            db.db.execute.return_value = db.db
            db.db.fetchone.return_value = [False]
            with self.assertRaises(PermissionError):
                db.lock().__enter__()

    def test_can_retreive_notifies(self):
        db = Database()
        with db.open():
            def mock_notifies():
                yield SimpleNamespace(payload=f'world')
            db.db.connection.notifies.side_effect = mock_notifies
            messages = []
            for msg in db.listen('hello'):
                messages.append(msg)
            self.assertEqual(messages, ['world'])

    def test_bulk_insert_media(self):
        db = Database()
        with db.open():
            files = [
                FileMetadata(path='/foo/bar.jpg', type='image', timestamp=123456789, size=1234),
                FileMetadata(path='/foo/bar.mp4', type='video', timestamp=123456780, size=1235),
            ]
            db.bulk_insert_media(files)
            db.db.connection.transaction.assert_called()
            db.db.copy.assert_called()

    def test_bulk_insert_no_media(self):
        db = Database()
        with db.open():
            files = []
            db.bulk_insert_media(files)
            db.db.connection.transaction.assert_not_called()
            db.db.copy.assert_not_called()

    def test_existing_paths_stripped(self):
        db = Database()
        with db.open():
            files = {Path('/foo/bar1.jpg'), Path('/foo/bar2.jpg'), Path('/foo/bar3.jpg')}
            db.db.execute.return_value = db.db
            db.db.fetchall.return_value = [['/foo/bar2.jpg'], ['/foo/bar1.jpg']]
            stripped = db.strip_existing_paths(files)
            self.assertEqual(stripped, {Path('/foo/bar3.jpg')})
            db.db.execute.assert_called_with(ANY, [f.as_posix() for f in files])

    def test_existing_paths_stripped_no_paths(self):
        db = Database()
        with db.open():
            files = {}
            db.db.execute.return_value = db.db
            stripped = db.strip_existing_paths(files)
            self.assertEqual(stripped, {})
            db.db.execute.assert_not_called()

    def test_existing_paths_stripped_large_number(self):
        db = Database()
        with db.open():
            files = set()
            for i in range(10000):
                files.add(Path(f'/foo/bar{i}.jpg'))
            db.db.execute.return_value = db.db
            db.db.fetchall.return_value = [['/foo/bar532.jpg'], ['/foo/bar121.jpg']]
            stripped = db.strip_existing_paths(files)
            self.assertEqual(files - stripped, {Path('/foo/bar532.jpg'), Path('/foo/bar121.jpg')})
            db.db.execute.assert_called_with('SELECT path FROM media')

    def test_can_update_progress(self):
        db = Database()
        with db.open():
            db.update_progress('foo', 'bar')
            db.db.execute.assert_called()

    def test_wont_update_progress_if_time_same(self):
        db = Database()
        with db.open():
            db.update_progress('foo', 'bar')
            db.db.execute.assert_called()
            db.db.execute.reset_mock()
            db.update_progress('foo', 'bar')
            db.db.execute.assert_not_called()
