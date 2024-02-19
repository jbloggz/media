/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * A block of thumbnails to display
 */

import { forwardRef } from 'react';
import { ThumbnailImage } from '.';

interface ThumbnailBlockProps {
   className?: string;
   block: MediaBlock;
}

const ThumbnailBlock = forwardRef<HTMLDivElement, ThumbnailBlockProps>(function ThumbnailBlock(props, ref) {
   return (
      <div key={props.block.heading} ref={ref} className={props.className}>
         {props.block.heading && <h1 className="text-xl font-bold p-2">{props.block.heading}</h1>}
         <div className="pb-1 grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1">
            {Array.from(Array(props.block.count)).map((_, i) => (
               <div key={`${props.block.heading}-${i}`} className="relative w-full aspect-square overflow-hidden">
                  <ThumbnailImage block={props.block.heading} index={i} />
               </div>
            ))}
         </div>
      </div>
   );
});

export default ThumbnailBlock;
