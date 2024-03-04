/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A Gallery Image Viewer Media Item
 */
'use client';

import { basename } from 'path';
import { TransitionEventHandler } from 'react';
import Image from 'next/image';
import { Loader } from '.';

interface MediaItemProps {
   media?: Media;
   className?: string;
   onTransitionEnd?: TransitionEventHandler<HTMLElement>;
   isCurrent?: boolean;
}

const MediaItem = (props: MediaItemProps) => {
   return !props.media ? (
      <Loader isLoading={props.isCurrent ? true : false} />
   ) : props.media.type === 'image' ? (
      <>
         <Loader isLoading={props.isCurrent ? true : false} />
         <Image
            key={props.media.id}
            className={`object-contain ${props.className}`}
            src={`/api/image?id=${props.media.id}`}
            alt={basename(props.media.path)}
            loader={(v) => `${v.src}&w=${v.width}`}
            onTransitionEnd={props.onTransitionEnd}
            fill
            sizes={'100vw'}
         />
      </>
   ) : (
      <video
         key={props.media.id}
         className={`absolute w-full h-full inset-0 ${props.className}`}
         autoPlay={props.isCurrent}
         preload={props.isCurrent ? 'auto' : 'none'}
         controls
         onTransitionEnd={props.onTransitionEnd}
      >
         <source src={`/api/video?id=${props.media.id}`} />
      </video>
   );
};

export default MediaItem;
