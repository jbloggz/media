/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Shared types for the app
 */

/* A block of media items */
interface MediaBlock {
   /* The heading for this block */
   heading?: string;

   /* The number of items in this block */
   count: number;

   /* The cumulative sum of the number of items */
   total: number;
}

/* GPS coordinates */
interface GpsCoord {
   /* Latitude in degrees [-90, 90] */
   lat: number;

   /* Longitude in degrees [-180, 180] */
   lng: number;
}

/* Metadata for a thumbnail */
interface ThumbMeta {
   /* The id of the media item this thumbnail is associated to */
   id: number;

   /* The API path to download the thumbnail */
   path: string;

   /* The media type */
   type: 'image' | 'video';

   /* The video duration in milliseconds */
   duration?: number;
}

/* A response containing block items */
interface BlockResponse {
   /* The data contianed in the response */
   data?: ThumbMeta[];

   /* An error if the response failed */
   error?: Error,
}

/* Search filters for the gallery */
interface SearchFilter {
   /* The path regex */
   path?: string;

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

   /* GPS coordinates */
   location?: GpsCoord;

   /* Location radius in km */
   radius?: number;
}

/* Search filters for the gallery */
interface NavBarIcon {
   /* The icon component */
   elem: JSX.Element;

   /* The onclick handler to assign */
   onClick: () => void;
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
   type: 'image' | 'video';

   /* The unix timestamp of the media */
   timestamp: number;

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

/* The API response for the app version */
interface Version {
   /* The version number */
   version: string;

   /* The last commit time */
   timestamp: number;
}
