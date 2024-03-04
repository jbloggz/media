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

/* Search filters for the gallery */
interface SearchFilter {
   /* The media type */
   type?: string[];

   /* Minimum video duration */
   camera?: string[];

   /* Minimum video duration in seconds */
   durationMin?: number;

   /* Maximum video duration in seconds */
   durationMax?: number;

   /* Minimum height in pixels */
   heightMin?: number;

   /* Maximum height in pixels */
   heightMax?: number;

   /* Minimum width in pixels */
   widthMin?: number;

   /* Maximum width in pixels */
   widthMax?: number;

   /* Minimum file size in bytes */
   sizeMin?: number;

   /* Maximum file size in bytes */
   sizeMax?: number;

   /* GPS coordinates (lat,lng) */
   location?: string;

   /* Location radius in km */
   radius?: number;
}

/* An option for a select input */
interface SelectOption {
   /* The lable to display */
   label: string;

   /* The internal value */
   value: string;
}

/* A media file and it's properties */
interface Media {
   /* The media id */
   id: number;

   /* The file location on disk */
   path: string;

   /* The media type */
   type: string;

   /* The unix timestamp of the media */
   timestamp: Date;

   /* File size in bytes */
   size: number;

   /* Width in pixels */
   width: number;

   /* Height in pixels */
   height: number;

   /* Video duration in milliseconds */
   duration?: number;

   /* GPS latitude in degrees (-90 -> 90) */
   latitude?: number;

   /* GPS longitude in degrees (-180 -> 180) */
   longitude?: number;

   /* Camera make */
   make?: string;

   /* Camera model */
   model?: string;
}

/* The API response for the media endpoint */
interface APIMedia {
   /* The previous media entry */
   prev?: Media;

   /* The selected media entry */
   current: Media;

   /* The next media entry */
   next?: Media;
}