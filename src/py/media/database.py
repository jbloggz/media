#
# MIT License
#
# Author: Josef Barnes
#
# The script to process and index files in the provided directory
#

'''
A simple PostgreSQL database wrapper. The database can be imported with:

from .database import db

Open a connection by calling db.open(). Make sure the following are available
in your environment before calling open():

PGHOST - host of the postgres database
PGUSER - The user to connect as
PGDATABASE - The database to connect to
TIMEZONE - Name of the timezone to use
'''

# System Imports
import time
import json
from contextlib import contextmanager
from typing import Optional, Set, Dict, List
from pathlib import Path

# 3rd Party Imports
import psycopg
from pydantic import BaseModel

# Local imports
from media.model import FileMetadata
from media.logger import logger


class ProgressCacheEntry(BaseModel):
    '''
    An entry in the progress cache
    '''
    start: float  # The time that the entry was created
    time: int     # The last time of a progress update
    state: str    # The last state of a progress update


class Database:
    '''
    A wrapper around the app database
    '''

    def __init__(self):
        '''
        Constructor
        '''
        self.db: Optional[psycopg.Cursor] = None
        self.progress_cache: Dict[str, ProgressCacheEntry] = {}
        self.locked = False

    @contextmanager
    def open(self):
        '''
        A context manager to lock the database
        '''
        with psycopg.connect(autocommit=True) as connection:
            with connection.cursor() as cursor:
                self.db = cursor
                try:
                    yield self
                finally:
                    self.db = None

    @contextmanager
    def lock(self):
        '''
        A context manager to lock the database
        '''
        assert self.db is not None
        lock_id = 293841
        resp = self.db.execute(f'SELECT pg_try_advisory_lock({lock_id})').fetchone()
        self.locked = resp is not None and resp[0] is True
        if not self.is_locked():
            raise PermissionError('Another process is currently running')
        try:
            yield self
        finally:
            self.db.execute(f'SELECT pg_advisory_unlock({lock_id})')
            self.locked = False

    def is_open(self) -> bool:
        '''
        Check if db is open

        Returns:
            True if the db is open, false if not
        '''
        return self.db is not None

    def is_locked(self) -> bool:
        '''
        Check if lock is held

        Returns:
            True if the lock is help, false if not
        '''
        return self.locked

    def bulk_insert_media(self, media: List[FileMetadata]):
        '''
        Insert the file metadata into the database

        Args:
            media: The list of media to insert
        '''
        assert self.db is not None
        if not media:
            return
        header = FileMetadata.__annotations__.keys()
        with self.db.connection.transaction():
            with self.db.copy(f'COPY media ({",".join(header)}) FROM STDIN') as copy:
                for file in media:
                    logger.debug(f'Inserting: {file.model_dump()}')
                    copy.write_row(list(file.model_dump().values()))

    def strip_existing_paths(self, paths: Set[Path]) -> Set[Path]:
        '''
        Takes a set of paths and returns the set that is not already in the database

        Args:
            paths: A set of paths to check

        Returns:
            A set of paths not already in the database
        '''
        assert self.db is not None
        if len(paths) == 0:
            return paths

        # If there is less than 1000 paths to filter, than pass the filter to the db
        if len(paths) < 1000:
            query = psycopg.sql.SQL("SELECT path FROM media WHERE path IN ({})").format(psycopg.sql.SQL(',').join(psycopg.sql.Placeholder() * len(paths)))
            self.db.execute(query, [p.as_posix() for p in paths])
        else:
            self.db.execute('SELECT path FROM media')
        existing_paths = {Path(row[0]) for row in self.db.fetchall()}
        return paths - existing_paths

    def update_progress(self, name: str, state: str, progress: int = 0, total: int = 0, extra: Optional[Dict] = None):
        '''
        Update a process progress

        Args:
            name:     The name of the process to update
            state:    The current state of the process
            progress: The current progress amount
            total:    The total amount of progress
            extra:    Optional extra data to store for the progress
        '''
        assert self.db is not None
        now = time.time()
        cache = self.progress_cache.setdefault(name, ProgressCacheEntry(start=now, time=0, state=''))
        if int(now) <= cache.time and state == cache.state:
            # It's been less than 1 second, and the state hasn't changed, so do nothing
            return
        cache.time = int(now)
        cache.state = state
        message = extra or {}
        message['time'] = int(now)
        message['state'] = state
        message['progress'] = progress
        message['total'] = total
        message['duration'] = now - cache.start
        self.db.execute('INSERT INTO progress VALUES (%(name)s, %(msg)s) ON CONFLICT (name) DO UPDATE SET message = %(msg)s', {
            'name': name,
            'msg': json.dumps(message)
        })

    def listen(self, channel: str):
        '''
        Listen for notifications on a channel

        Args:
            channel: The name of the channel to listen

        Yields:
            The payload from a notification
        '''
        assert self.db is not None
        self.db.execute(f'LISTEN {channel}')
        for notify in self.db.connection.notifies():
            yield notify.payload


db = Database()
