/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * A block of thumbnails to display
 */

import { forwardRef } from 'react';

interface ThumbnailBlockProps {
   className?: string;
   heading?: string;
   start: number;
   end: number;
}

const ThumbnailBlock = forwardRef<HTMLDivElement, ThumbnailBlockProps>(function ThumbnailBlock(props, ref) {
   return (
      <div key={props.heading} ref={ref} className={props.className}>
         {props.heading && <h1 className="text-xl font-bold p-2">{props.heading}</h1>}
         <div className="pb-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
            {Array.from(Array(props.end - props.start)).map((_, i) => (
               <div key={`${props.heading}-${i + props.start}`} className="w-full aspect-square">
                  <div className="flex items-center justify-center w-full h-full bg-gray-300 rounded dark:bg-gray-700">
                     <svg
                        className="w-10 h-10 text-gray-200 dark:text-gray-600"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 18"
                     >
                        <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                     </svg>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
});

export default ThumbnailBlock;
