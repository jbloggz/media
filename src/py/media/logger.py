#
# MIT License
#
# Author: Josef Barnes
#
# Global app logger
#

'''
Global app logger
'''

# System Imports
import sys
import signal
import logging
from pathlib import Path
from typing import Optional


# The global app logger instance
logger = logging.getLogger('media')


def set_log_level(level: int):  # pragma: no cover
    '''
    Set the logger level.

    Args:
        logger: The logger object to setup
        level: The new log level
    '''
    level = max(logging.DEBUG, min(level, logging.CRITICAL))
    logger.setLevel(logging.INFO)
    logger.info(f'Setting log level to %s', logging.getLevelName(level))
    logger.setLevel(level)


def init_logger(path: Optional[Path] = None, debug: bool = False):  # pragma: no cover
    '''
    Setup the logging

    Args:
        logger: The logger object to setup
        path:   Path to the desired logfile
        debug:  Whether to enable debug logging
    '''
    set_log_level(logging.DEBUG if debug else logging.INFO)
    signal.signal(signal.SIGUSR1, lambda *_: set_log_level(logger.level - 10))
    signal.signal(signal.SIGUSR2, lambda *_: set_log_level(logger.level + 10))

    fmt = '%(asctime)s.%(msecs)03d | %(levelname)-8s | %(message)s'
    timefmt = '%Y/%m/%d %H:%M:%S'

    if path is not None:
        handler = logging.FileHandler(path)
        formatter = logging.Formatter(fmt, timefmt)
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    else:
        stderr_handler = logging.StreamHandler(sys.stderr)
        formatter = logging.Formatter(fmt, timefmt)
        stderr_handler.setFormatter(formatter)
        logger.addHandler(stderr_handler)
