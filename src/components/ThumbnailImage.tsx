/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A single thumbnail image
 */
'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { ImageSkeleton } from '.';

interface ThumbnailImageProps {
   meta?: ThumbMeta;
   onClick?: (id: number) => void;
}

const prettyDuration = (duration: number): string => {
   duration = Math.floor(duration / 1000);
   const hours = Math.floor(duration / 3600);
   const minutes = Math.floor(duration / 60) - hours * 60;
   const seconds = duration - hours * 60 - minutes * 60;

   return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/* How far from the screen before we load an image */
const imagePreloadOffset = 2000;

const ThumbnailImage = (props: ThumbnailImageProps) => {
   const [render, setRender] = useState(false);
   const container = useRef<HTMLDivElement>(null);
   const imageRect = container.current && container.current.getBoundingClientRect();
   const imageTop = imageRect?.top || NaN;
   const imageBottom = imageRect?.bottom || NaN;

   if (!render && imageBottom > -imagePreloadOffset && imageTop < window.innerHeight + imagePreloadOffset) {
      setRender(true);
   }

   return (
      <div className="relative w-full aspect-square overflow-hidden" onClick={() => props.onClick && props.meta?.id && props.onClick(props.meta.id)}>
         <div ref={container} className="flex items-center justify-center w-full h-full bg-gray-300 rounded dark:bg-gray-700 relative group">
            <ImageSkeleton />
            {props.meta && (
               <>
                  <Image unoptimized={true} src={`/api/thumb?id=${props.meta.id}`} fill={true} alt="" sizes="100px" className="cursor-pointer" />
                  {props.meta.type === 'video' && (
                     <>
                        <Image
                           unoptimized={true}
                           src={'/play.png'}
                           width={80}
                           height={80}
                           alt=""
                           className="cursor-pointer absolute top-0 bottom-0 left-0 right-0 m-auto opacity-50 group-hover:opacity-70"
                        />
                        <p className="absolute bottom-1 right-1 opacity-50 group-hover:opacity-70">{prettyDuration(props.meta.duration)}</p>
                     </>
                  )}
               </>
            )}
         </div>
      </div>
   );
};

export default ThumbnailImage;
