/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A single thumbnail image
 */
'use client';

import Image from 'next/image';
import { ImageSkeleton } from '.';

interface ThumbnailImageProps {
   meta?: ThumbMeta;
   noOverlay?: boolean;
   onClick?: (id: number) => void;
}

const prettyDuration = (duration: number): string => {
   const duration_s = Math.floor(duration / 1000);
   const hours = Math.floor(duration_s / 3600);
   const minutes = Math.floor(duration_s / 60) - hours * 60;
   const seconds = duration_s - hours * 3600 - minutes * 60;

   return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const ThumbnailImage = (props: ThumbnailImageProps) => {
   return (
      <div className="relative w-full aspect-square overflow-hidden" onClick={() => props.onClick && props.meta?.id && props.onClick(props.meta.id)}>
         <div className="flex items-center justify-center w-full h-full bg-gray-300 rounded dark:bg-gray-700 relative group">
            <ImageSkeleton />
            {props.meta && (
               <>
                  <Image
                     unoptimized={true}
                     src={`/api/thumb?id=${props.meta.id}`}
                     fill={true}
                     alt=""
                     sizes="100px"
                     className={props.onClick ? 'cursor-pointer' : ''}
                  />
                  {props.meta.type === 'video' && !props.noOverlay && (
                     <>
                        <Image
                           unoptimized={true}
                           src={'/play.png'}
                           width={80}
                           height={80}
                           alt=""
                           className="cursor-pointer absolute top-0 bottom-0 left-0 right-0 m-auto opacity-50 group-hover:opacity-70"
                        />
                        <p className="absolute bottom-1 right-1 opacity-50 group-hover:opacity-70">{prettyDuration(props.meta.duration || 0)}</p>
                     </>
                  )}
               </>
            )}
         </div>
      </div>
   );
};
