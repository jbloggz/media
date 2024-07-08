#
# MIT License
#
# Author: Josef Barnes
#
# The processor class
#

'''
The processor class
'''

# System Imports
import sys
import json
import concurrent.futures
from pathlib import Path
from typing import List, Set

# Local Imports
from media.model import FileMetadata
from media.util import load_file_metadata
from media.logger import logger
from media.database import db


class MediaProcessor:
    '''
    The class to process and insert media files into the database
    '''

    def __init__(self, ncpu=2, dry_run=False, use_file_mtime=False):
        '''
        Constructor

        Args:
            ncpu:            Number of CPUs to parallelise processing
            dry_run:         Don't make changes, just log what would be done
            use_file_mtime:  Use the filesystem mtime rather than exit timestamp
        '''
        self.ncpu = ncpu
        self.dry_run = dry_run
        self.use_file_mtime = use_file_mtime

    def validate_file(self, file: FileMetadata):
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
            raise ValueError(f'Validation failed: invalid length of {file.height}')
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
            raise ValueError(f'Validation failed: Invalid thumbnail of {file.thumbnail!r}')

    def get_file_list(self, paths: List[Path]) -> Set[Path]:
        '''
        Get the list of files that need to be processed

        Args:
            paths: List of paths to search

        Returns:
            List of files that need to be processed
        '''
        files = set()
        for path in paths:
            if path.is_file():
                files.add(path)
            else:
                files |= {f for f in path.rglob('*') if f.is_file()}
        logger.info(f'Found {len(files)} files to process')

        to_process = db.strip_existing_paths(files)
        skip_count = len(files - to_process)
        if skip_count:
            logger.info(f'Ignoring {skip_count} file{"s" if skip_count > 1 else ""} that are already processed')

        return to_process

    def run(self, paths: List[Path]):
        '''
        Process all the files in the provided directory

        Args:
            paths: The list of paths to process

        Returns:
            The counts of processed, skipped and failed files in the directory
        '''
        with db.lock():
            logger.info(f'Processing {paths}')
            db.update_progress('processor', 'starting')
            to_process = self.get_file_list(paths)
            logger.info(f'Processing {len(to_process)} files')

            processed: List[FileMetadata] = []
            skipped_count = 0
            failed_count = 0
            with concurrent.futures.ThreadPoolExecutor(max_workers=self.ncpu) as executor:
                futures = {executor.submit(load_file_metadata, p, self.use_file_mtime): p for p in to_process}
                for future in concurrent.futures.as_completed(futures):
                    path = futures.get(future)
                    try:
                        file = future.result()
                        if file is not None:
                            self.validate_file(file)
                            processed.append(file)
                        else:
                            skipped_count += 1
                    except Exception as e:
                        logger.error(f'Unable to process {path}: {e}')
                        failed_count += 1

                    db.update_progress('processor', 'processing', len(processed), len(to_process), {'skipped': skipped_count, 'failed': failed_count})

            if self.dry_run:
                logger.info(json.dumps([f.model_dump(exclude={'thumbnail'}) for f in processed]))
            else:
                db.bulk_insert_media(processed)

            logger.info(f'Processed: {len(processed)}, skipped: {skipped_count}, failed: {failed_count}')
            db.update_progress('processor', 'complete', len(processed), len(to_process), {'skipped': skipped_count, 'failed': failed_count})
