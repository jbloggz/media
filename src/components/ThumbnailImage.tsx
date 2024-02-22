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

interface ThumbnailImageProps {
   meta?: ThumbMeta;
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
      <div className="relative w-full aspect-square overflow-hidden">
         <div ref={container} className="flex items-center justify-center w-full h-full bg-gray-300 rounded dark:bg-gray-700 relative group">
            <svg
               className="w-10 h-10 text-gray-200 dark:text-gray-600"
               aria-hidden="true"
               xmlns="http://www.w3.org/2000/svg"
               fill="currentColor"
               viewBox="0 0 20 18"
            >
               <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
            </svg>
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
