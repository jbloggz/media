/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Shared types for the app
 */

/* A block of media items */
interface MediaBlock {
   /* A name to use for this block */
   heading: string;

   /* The number of items in this block */
   count: number;

   /* The cumulative sum of the number of items */
   total: number;
}

/* The API response format for the /api/blocks endpoint */
interface APIBlocks {
   /* The number of items per block */
   blockSize: number;

   /* The media blocks available */
   blocks: MediaBlock[];
}
