/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A block of thumbnails to display
 */
'use client';

import { forwardRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSearchAPI } from '@/hooks';
import { ThumbnailImage } from '.';

interface ThumbnailBlockProps {
   block: MediaBlock;
   className?: string;
   onImageClick?: (id: number) => void;
}

const getBlockHeading = (heading: string): string => {
   const dt = new Date(heading);
   return dt.toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const ThumbnailBlock = forwardRef<HTMLDivElement, ThumbnailBlockProps>(function ThumbnailBlock(props, ref) {
   const api = useSearchAPI<ThumbMeta[]>({
      url: '/api/thumbmeta',
      params: props.block.heading ? { day: props.block.heading } : {},
      disabled: props.block.items !== undefined,
   });

   useEffect(() => {
      if (api.error) {
         toast.error(api.error?.message || 'Unknown error occurred');
      }
   }, [api.error]);

   const items = props.block.items || api.data;

   return (
      <div ref={ref} className={props.className}>
         {props.block.heading && <h1 className="text-xl font-bold p-2">{getBlockHeading(props.block.heading)}</h1>}
         <div className="pb-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
            {items
               ? items.map((meta) => <ThumbnailImage key={meta.id} meta={meta} onClick={props.onImageClick} />)
               : Array.from(Array(props.block.count)).map((_, i) => <ThumbnailImage key={i} />)}
         </div>
      </div>
   );
});
