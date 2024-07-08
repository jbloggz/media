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
import sys
import time
import argparse
from pathlib import Path

# 3rd Party Imports
from dotenv import load_dotenv

# Local Imports
from media.media_processor import MediaProcessor
from media.logger import logger, init_logger
from media.database import db


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
    parser.add_argument('-t', '--use-file-mtime', action='store_true', help='Force the use of the file timestamp')

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
    processor = MediaProcessor(args.ncpu, args.dry_run, args.use_file_mtime)

    with db.open():
        # If a path was supplied, run a single process on that path
        if args.path:
            processor.run([Path(args.path)])
            return 0

        # Loop forever connecting to the database and listening for notifications
        while True:
            try:
                for path in db.listen('media_processor'):
                    processor.run([Path(path)])
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
