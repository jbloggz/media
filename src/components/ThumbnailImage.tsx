/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A single thumbnail image
 */
'use client';

import Image from 'next/image';
import classNames from 'classnames';
import { CheckCircleIcon, StopCircleIcon } from '@heroicons/react/24/solid';
import { CheckIcon } from '@heroicons/react/24/outline';
import { ImageSkeleton } from '.';

interface ThumbnailImageProps {
   meta?: ThumbMeta;
   noOverlay?: boolean;
   onClick?: (id: number) => void;
   selectMode?: boolean;
   selected?: boolean;
}

const prettyDuration = (duration: number): string => {
   const duration_s = Math.floor(duration / 1000);
   const hours = Math.floor(duration_s / 3600);
   const minutes = Math.floor(duration_s / 60) - hours * 60;
   const seconds = duration_s - hours * 3600 - minutes * 60;

   return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const ThumbnailImage = (props: ThumbnailImageProps) => {
   const innerClasses = classNames(
      'm-auto flex items-center justify-center bg-gray-300 rounded dark:bg-gray-700 relative group transition-all',
      { 'w-full h-full': !props.selected },
      { 'w-[90%] h-[90%] rounded-xl translate-y-[5%]': props.selected }
   );

   return (
      <div className="relative w-full aspect-square overflow-hidden" onClick={() => props.onClick && props.meta?.id && props.onClick(props.meta.id)}>
         <div className={innerClasses}>
            <ImageSkeleton />
            {props.meta && (
               <>
                  <Image
                     unoptimized={true}
                     src={`/api/thumb?id=${props.meta.id}`}
                     fill={true}
                     alt=""
                     sizes="100px"
                     className={(props.onClick ? 'cursor-pointer' : '') + (props.selected ? ' rounded-xl' : '')}
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
            {props.selectMode &&
               (props.selected ? (
                  <>
                     <div className="w-5 h-5 bg-gray-300 border border-blue-400 left-1.5 top-1.5 absolute rounded-full" />
                     <CheckCircleIcon className="w-6 h-6 absolute top-1 left-1 fill-blue-400 cursor-pointer" />
                  </>
               ) : (
                  <div className="w-5 h-5 border border-gray-300 left-1.5 top-1.5 absolute rounded-full cursor-pointer" />
               ))}
         </div>
      </div>
   );
};
