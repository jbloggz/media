/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A block of thumbnails to display
 */
'use client';

import { forwardRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { useAPI } from '@/hooks';
import { ThumbnailImage } from '.';

interface ThumbnailBlockProps {
   className?: string;
   block: MediaBlock;
}

const getBlockHeading = (day: string): string => {
   const dt = new Date(day);
   return dt.toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' });
};

const ThumbnailBlock = forwardRef<HTMLDivElement, ThumbnailBlockProps>(function ThumbnailBlock(props, ref) {
   const params = useSearchParams();
   const query = params.get('q') || '';
   const api = useAPI<ThumbMeta[]>({ url: `/api/thumbmeta?q=${query}&day=${props.block.day}` });

   useEffect(() => {
      if (api.error) {
         toast.error(api.error?.message || 'Unknown error occurred');
      }
   }, [api.error]);

   return (
      <div ref={ref} className={props.className}>
         {props.block.day && <h1 className="text-xl font-bold p-2">{getBlockHeading(props.block.day)}</h1>}
         <div className="pb-1 grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1">
            {api.data
               ? api.data.map((meta) => <ThumbnailImage key={meta.id} meta={meta} />)
               : Array.from(Array(props.block.count)).map((_, i) => <ThumbnailImage key={i} />)}
         </div>
      </div>
   );
});

export default ThumbnailBlock;
