/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A block of thumbnails to display
 */
'use client';

import { forwardRef, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSearchAPI } from '@/hooks';
import { ThumbnailImage } from '.';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface ThumbnailBlockProps {
   block: MediaBlock;
   className?: string;
   onItemClick: (id: number) => void;
   selectMode?: boolean;
   selectedItems: Set<number>;
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

   const onSelectAllClick = useCallback((items: ThumbMeta[]) => {
      const select_all = props.selectedItems.size !== props.block.count;
      for (const item of items) {
         select_all !== props.selectedItems.has(item.id) && props.onItemClick(item.id);
      }
   }, [props]);

   return (
      <div ref={ref} className={props.className}>
         <div className="flex flex-row">
            {props.block.heading && <h1 className="text-xl font-bold p-2 flex-grow">{getBlockHeading(props.block.heading)}</h1>}
            {props.selectMode && items && (
               <button className="btn btn-circle opacity-70 hover:opacity-100" onClick={() => onSelectAllClick(items)}>
                  {props.selectedItems.size === props.block.count ? (
                     <CheckCircleIconSolid className="w-6 h-6 m-2 cursor-pointer" />
                  ) : (
                     <CheckCircleIcon className="w-6 h-6 m-2 cursor-pointer" />
                  )}
               </button>
            )}
         </div>
         <div className="pb-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
            {items
               ? items.map((meta) => (
                    <ThumbnailImage
                       key={meta.id}
                       meta={meta}
                       onClick={props.onItemClick}
                       selectMode={props.selectMode}
                       selected={props.selectedItems.has(meta.id)}
                    />
                 ))
               : Array.from(Array(props.block.count)).map((_, i) => <ThumbnailImage key={i} />)}
         </div>
      </div>
   );
});
