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
   heading: string;
   start: number;
   end: number;
}

const ThumbnailBlock = forwardRef<HTMLDivElement, ThumbnailBlockProps>(function ThumbnailBlock(props, ref) {
   return (
      <div key={props.heading} ref={ref} className={props.className}>
         {props.heading && <h1 className="text-xl font-bold p-2">{props.heading}</h1>}
         <div className="pb-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
            {Array.from(Array(props.end - props.start)).map((_, i) => (
               <div key={`${props.heading}-${i + props.start}`} className="relative w-full aspect-square rounded overflow-hidden">
                  <ThumbnailImage block={props.heading} index={i} />
               </div>
            ))}
         </div>
      </div>
   );
});

export default ThumbnailBlock;
