/**
 * MIT License
 *
 * Copyright (c) 2024 Josef Barnes
 *
 * schema.sql: This file is the database schema for the media database
 */

/* A table to store the media items */
CREATE TABLE IF NOT EXISTS media (
   id          SERIAL8 PRIMARY KEY,
   path        TEXT NOT NULL UNIQUE, -- path relative to root level
   type        TEXT NOT NULL,        -- mime type (either image or video)
   timestamp   INT8 NOT NULL,        -- in epoch seconds
   size        INT4 NOT NULL,        -- file size (in bytes)
   width       INT4 NOT NULL,        -- in pixels
   height      INT4 NOT NULL,        -- in pixels
   duration    INT4 DEFAULT NULL,    -- video duration in milliseconds (NULL for images)
   latitude    REAL DEFAULT NULL,    -- in degrees
   longitude   REAL DEFAULT NULL,    -- in degrees
   make        TEXT DEFAULT NULL,    -- make of the camera (NULL if unknown or N/A)
   model       TEXT DEFAULT NULL,    -- model of the camera (NULL if unknown or N/A)
   sha256      TEXT NOT NULL,        -- SHA256 checksum for the file
   thumbnail   BYTEA NOT NULL        -- Thumbnail of the media
);
CREATE INDEX IF NOT exists media_path_idx ON media(path);
CREATE INDEX IF NOT exists media_type_idx ON media(type);
CREATE INDEX IF NOT exists media_timestamp_idx ON media(timestamp);
CREATE INDEX IF NOT exists media_camera_idx ON media(make, model);

/* A table for caching the blocks of media files */
CREATE TABLE IF NOT EXISTS block (
   id          SERIAL8 PRIMARY KEY,
   heading     TEXT NOT NULL,        -- name of the block
   count       INT4 NOT NULL,        -- number of files in the block
   total       INT4 NOT NULL         -- total files in this an all previous blocks
);

/* Mapping of thumbnails to their block position */
CREATE TABLE IF NOT EXISTS media_position (
   media       INT8 NOT NULL REFERENCES media(id) ON DELETE CASCADE,  -- media id
   block       INT4 NOT NULL REFERENCES block(id) ON DELETE CASCADE,  -- block id
   position    INT4 NOT NULL                                          -- offset within the block
);
CREATE INDEX IF NOT exists media_position_index ON media_position(block, position);

/* A table for storing running processes and progress */
CREATE TABLE IF NOT EXISTS progress (
   name        TEXT PRIMARY KEY,     -- name of the process
   message     JSON DEFAULT NULL     -- message for current process
);

/* A table to store the push subscriptions */
CREATE TABLE IF NOT EXISTS push_subscription (
   id              SERIAL8 PRIMARY KEY,
   value           TEXT NOT NULL UNIQUE   -- The subscription data
);
