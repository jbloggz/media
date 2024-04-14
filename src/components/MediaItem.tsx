/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A Gallery Image Viewer Media Item
 */
'use client';

import { basename } from 'path';
import { ForwardedRef, TransitionEventHandler, forwardRef } from 'react';
import Image from 'next/image';
import { Loader } from '.';

interface MediaItemProps {
   media?: Media;
   className?: string;
   onClick?: () => void;
   onTransitionEnd?: TransitionEventHandler<HTMLElement>;
   isCurrent?: boolean;
}

export const MediaItem = forwardRef<HTMLElement, MediaItemProps>(function MediaItem(props, ref) {
   return !props.media ? (
      <Loader isLoading={props.isCurrent ? true : false} />
   ) : props.media.type === 'image' ? (
      <>
         <Loader isLoading={props.isCurrent ? true : false} />
         <Image
            ref={ref as ForwardedRef<HTMLImageElement>}
            key={props.media.id}
            className={`object-contain ${props.className}`}
            src={`/api/image?id=${props.media.id}`}
            alt={basename(props.media.path)}
            loader={(v) => `${v.src}&w=${v.width}`}
            onTransitionEnd={props.onTransitionEnd}
            onClick={props.onClick}
            fill
            sizes={'100vw'}
         />
      </>
   ) : (
      <video
         ref={ref as ForwardedRef<HTMLVideoElement>}
         key={props.media.id}
         className={`absolute w-full h-full inset-0 ${props.className}`}
         autoPlay={props.isCurrent}
         preload={props.isCurrent ? 'auto' : 'none'}
         controls
         onClick={props.onClick}
         onTransitionEnd={props.onTransitionEnd}
      >
         <source src={`/api/video?id=${props.media.id}`} />
      </video>
   );
});
