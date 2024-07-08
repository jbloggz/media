#
# MIT License
#
# Author: Josef Barnes
#
# A script to sync files and trigger the media processor
#

'''
Insert media into the app from syncthing shares.
This process has the job of automatically triggering the media processor based
on when files are sync'd from a remote source via syncthing. It does this by
monitoring the Syncthing API for LocalIndexUpdated events.

Syncthing itself should not be used to sync files to the repository, because it
will remove files that are deleted from the remote source (eg. if someone is
clearing space on their phone). Instead, syncthing should sync to a separate
location, and it is the responsibility of this process to copy files into the
media repository.

This is achieved via the paths that are provided. The paths are a JSON list of
objects, each containing a src, dst, glob and exclude. All files that match the
glob in src will be copied to dst, with the exception of files that match the
exclude. For example:

[
  {"src": "/home/foo/bar", dst: "/home/foo/media/bar", "glob": "*.jpg", "exclude": null},
  {"src": "/home/foo/qwerty", dst: "/home/qwerty", "glob": "*.mp4", "exclude": "\\.trashed"}
]

When an event is detected from syncthing, the paths are processed to copy any
new files to the media repository, then the media processor is called to insert
the new files. This script will never overwrite or delete existing files in the
`dst`, so it is safe from volatility in the syncthing share.

Like with the manual processor script. You need to provide the path to an
env file that contains the connection information for postgres, as well as the
Syncthing API key. The following must be set in the env file:

PGHOST - host of the postgres database
PGUSER - The user to connect as
PGDATABASE - The database to connect to
TIMEZONE - Name of the timezone to use
SYNCTHING_API_KEY - Key for accessing the syncthing REST API
'''

# System Imports
import os
import time
import sys
import json
import argparse
import shutil
import re
from pathlib import Path
from typing import List, Optional

# 3rd Party Imports
import requests
import urllib3
from dotenv import load_dotenv
from pydantic import BaseModel

# Local Imports
from media.media_processor import MediaProcessor
from media.logger import logger, init_logger
from media.database import db


# Disable warnings about self signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class CopyPath(BaseModel):
    '''
    A src/dst for copying files filtered by a glob
    '''
    src: Path               # The src path to copy from
    dst: Path               # The dst path to copy to
    glob: str               # A glob to filter on src files
    exclude: Optional[str]  # A regular expression to exclude certain files


def read_paths(path: Path) -> List[CopyPath]:
    '''
    Read the copy paths from file

    Args:
        path: Path to the copy paths file

    Returns:
        A list of copy paths
    '''
    with open(path, 'r') as fp:
        data = json.load(fp)
        assert isinstance(data, list)
        return [CopyPath(**v) for v in data]


def get_events_since(session: requests.Session, host: str, since: int):
    '''
    Get a list of events with id greater than 'since'

    Args:
        session: An active requests session
        host:    The host/port of the syncthing API
        since:   The since value to pass the the API

    Returns:
        The events that were found
    '''
    url = f'{host}/rest/events?events=LocalIndexUpdated&since={since}'
    return session.get(url, verify=False).json()


def event_generator(host: str):
    '''
    Generator for syncthing LocalIndexUpdated events

    Args:
        host: The host/port of the syncthing API

    Yields:
        The events that were found
    '''
    session = requests.Session()
    session.headers['X-API-Key'] = os.environ['SYNCTHING_API_KEY']
    since = 0
    while True:
        # We continually poll the syncthing API for LocalIndexUpdated events.
        # The 'since' parameter can be used to only get events with an ID greater
        # than the since value. However, if syncthing is restarted, then the ids
        # are reset. So if we dont see any events, then check with a since value
        # 1 less. If we still dont see any events, then the ids must have been
        # reset, so restart our since value.
        events = get_events_since(session, host, since)
        if not events and since > 0:
            # No events found, check that the ids haven't been reset
            if not get_events_since(session, host, since - 1):
                logger.warning('Detected event id reset')
                since = 0
            continue
        logger.debug(f'Found {len(events)} syncthing events: {events}')
        since = events[-1]['id']
        yield events


def copy_files(paths: List[CopyPath], dry_run: bool) -> List[Path]:
    '''
    Copy files from src to dst in the paths

    Args:
        paths:   The list of paths to copy
        dry_run: Do a dry run on rsync

    Returns:
        The list of files that were copied
    '''
    new_files: List[Path] = []
    for path in paths:
        src_files = {f.relative_to(path.src) for f in path.src.rglob(path.glob)}
        dst_files = {f.relative_to(path.dst) for f in path.dst.rglob(path.glob)}

        diff = src_files - dst_files
        exclude = re.compile(path.exclude) if path.exclude is not None else None
        for f in diff:
            src = path.src / f
            dst = path.dst / f
            if exclude is not None and exclude.search(src.as_posix()):
                continue
            logger.info(f'Copying {src} to {dst}')
            if not dry_run:
                os.makedirs(dst.parent, exist_ok=True)
                shutil.copy2(src, dst)
            new_files.append(dst)

    return new_files


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
    parser.add_argument('-H', '--host', required=True, type=str, help='Host/port of syncthing API')
    parser.add_argument('-l', '--log-file', required=True, type=str, help='Path to log file')
    parser.add_argument('-n', '--ncpu', type=int, default=2, help='Number of threads to run')
    parser.add_argument('-r', '--dry-run', action='store_true', help='Don\'t make any changes. Log changes that would ba made')
    parser.add_argument('paths', type=str, help='path to a file containing a JSON list of paths to copy')

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
    if args.env:
        load_dotenv(args.env)

    init_logger(args.log_file, args.debug)
    processor = MediaProcessor(args.ncpu, args.dry_run)
    copy_paths = read_paths(args.paths)

    while True:
        try:
            for _ in event_generator(args.host):
                new_files = copy_files(copy_paths, args.dry_run)
                with db.open():
                    processor.run(new_files)
        except KeyboardInterrupt:
            logger.info('Caught keyboard interrupt. Exiting')
            break
        except:
            logger.exception('Uncaught exception. Will reconnect in 1 minute')
            time.sleep(60)


if __name__ == '__main__':  # pragma: no cover
    try:
        sys.exit(main(parse_args()))
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception(exc, exc_info=True)
