/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Shared types for the app
 */

/* A block of media items */
interface MediaBlock {
   /* The date for this block */
   day: string;

   /* The number of items in this block */
   count: number;

   /* The cumulative sum of the number of items */
   total: number;
}

/* Metadata for a thumbnail image */
interface ThumbImageMeta {
   /* The id of the media */
   id: number;

   /* The media type */
   type: 'image';
}

/* Metadata for a thumbnail video */
interface ThumbVideoMeta {
   /* The id of the media */
   id: number;

   /* The media type */
   type: 'video';

   /* THe duration in milliseconds */
   duration: number;
}

/* Metadata for a media thumbnail */
type ThumbMeta = ThumbImageMeta | ThumbVideoMeta;
