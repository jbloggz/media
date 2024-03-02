/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The Gallery Image Viewer Dialog
 */
'use client';

import { useEffect, useState } from 'react';
import Image, { ImageLoaderProps } from 'next/image';
import Link from 'next/link';
import { useSwipeable, LEFT, RIGHT, DOWN } from 'react-swipeable';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useSearchAPI } from '@/hooks';
import { Loader } from '.';

interface ImageDialogProps {
   id: number;
   onClose: () => void;
}

const isTouchEnabled = () => {
   return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const imageLoader = ({ src, width }: ImageLoaderProps) => {
   return `${src}&w=${width}`;
};

const MediaDialog = (props: ImageDialogProps) => {
   const [id, setId] = useState(props.id);
   const [showControls, setShowControls] = useState(false);
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

   const gotoMedia = (id?: number) => {
      if (id) {
         setId(id);
      }
   };

   const handlers = useSwipeable({
      onSwiped: (eventData) => {
         switch (eventData.dir) {
            case LEFT:
               gotoMedia(api.data?.prevId);
               break;

            case RIGHT:
               gotoMedia(api.data?.nextId);
               break;

            case DOWN:
               props.onClose();
               break;
         }
      },
   });

   return (
      <dialog
         className="modal"
         open
         onMouseEnter={() => !isTouchEnabled() && setShowControls(true)}
         onMouseLeave={() => !isTouchEnabled() && setShowControls(false)}
         {...handlers}
      >
         <div className="relative modal-box bg-black flex flex-col w-full h-full max-h-full max-w-full">
            {api.data && (
               <>
                  {api.data.type === 'image' ? (
                     <>
                        <Loader />
                        <Image
                           className="object-contain"
                           src={`/api/image?id=${api.data.id}`}
                           alt={api.data.path}
                           loader={imageLoader}
                           fill
                           sizes={'100vw'}
                           onClick={() => setShowControls(!showControls)}
                        />
                     </>
                  ) : (
                     <video className="m-auto" width={'100%'} controls preload="auto" autoPlay onClick={() => setShowControls(!showControls)}>
                        <source src={`/api/video?id=${api.data.id}`} />
                     </video>
                  )}
               </>
            )}

            {showControls && (
               <>
                  {api.data && (
                     <Link className="btn btn-circle opacity-80 fixed top-3 right-20 " href={`/api/${api.data.type}?id=${api.data.id}&download=1`}>
                        <ArrowDownTrayIcon className="h-6 w-6" />
                     </Link>
                  )}

                  <button className="btn btn-circle opacity-80 fixed top-3 right-3 " onClick={props.onClose}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                     </svg>
                  </button>

                  <Loader {...api}>
                     {api.data?.nextId && (
                        <button className="btn btn-circle opacity-80 fixed top-1/2 left-10 " onClick={() => gotoMedia(api.data?.nextId)}>
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
                        <button className="btn btn-circle opacity-80 fixed top-1/2 right-10 " onClick={() => gotoMedia(api.data?.prevId)}>
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
               </>
            )}
         </div>
      </dialog>
   );
};

export default MediaDialog;
