/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The Gallery Image Viewer Dialog
 */
'use client';

import { useSearchAPI } from '@/hooks';
import { useEffect, useState } from 'react';
import { Loader } from '.';
import Image from 'next/image';

interface ImageDialogProps {
   id: number;
   onClose: () => void;
}

const MediaDialog = (props: ImageDialogProps) => {
   const [id, setId] = useState(props.id);
   const api = useSearchAPI<Media & { prevId: number; nextId: number }>({ url: '/api/media', params: { id } });

   /* Allow esc key to close dialog */
   useEffect(() => {
      const handleKeyPress = (event: KeyboardEvent) => {
         if (event.key === 'Escape') {
            props.onClose();
         }
      };

      document.addEventListener('keydown', handleKeyPress);

      return () => {
         document.removeEventListener('keydown', handleKeyPress);
      };
   }, [props]);

   return (
      <dialog className="modal group" open>
         <div className="relative modal-box bg-black flex flex-col w-full h-full max-h-full max-w-full">
            {api.data && (
               <>
                  <Loader />
                  <Image className="object-contain" src={`/api/img?id=${api.data.id}`} alt={api.data.path} fill sizes={'100vw'} />
               </>
            )}

            <button
               className="btn btn-circle opacity-0 group-hover:opacity-50 hover:!opacity-100 fixed top-3 right-3 "
               onClick={props.onClose}
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>

            <Loader {...api}>
               {api.data?.nextId && (
                  <button
                     className="btn btn-circle opacity-0 group-hover:opacity-50 hover:!opacity-100 fixed top-1/2 left-10 "
                     onClick={() => api.data?.nextId && setId(api.data.nextId)}
                  >
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                     >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                     </svg>
                  </button>
               )}

               {api.data?.prevId && (
                  <button
                     className="btn btn-circle opacity-0 group-hover:opacity-50 hover:!opacity-100 fixed top-1/2 right-10 "
                     onClick={() => api.data?.prevId && setId(api.data.prevId)}
                  >
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                     >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                     </svg>
                  </button>
               )}
            </Loader>
         </div>
      </dialog>
   );
};

export default MediaDialog;
