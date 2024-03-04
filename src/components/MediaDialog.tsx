/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The Gallery Image Viewer Dialog
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSwipeable, LEFT, RIGHT, DOWN, SwipeDirections } from 'react-swipeable';
import { ArrowDownTrayIcon, ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAPI, useSearchAPI } from '@/hooks';
import { MediaItem } from '.';

interface ImageDialogProps {
   id: number;
   onClose: () => void;
}

const isTouchEnabled = () => {
   return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

interface MediaState {
   id: number;
   prev?: Media;
   current?: Media;
   next?: Media;
   swipeDir?: SwipeDirections;
}

const MediaDialog = (props: ImageDialogProps) => {
   const [state, setState] = useState<MediaState>({ id: props.id });
   const [showControls, setShowControls] = useState(false);
   const api = useSearchAPI<APIMedia>({ url: '/api/media', params: { id: state.id } });

   const swipe = useCallback(
      (dir: SwipeDirections) => {
         setState({ ...state, swipeDir: dir });
      },
      [state]
   );

   useEffect(() => {
      if (!api.data || (api.data.current.id === state.current?.id && api.data.prev?.id === state.prev?.id && api.data.next?.id === state.next?.id)) {
         return;
      }
      setState({
         ...state,
         prev: api.data.prev && { ...api.data.prev },
         current: { ...api.data.current },
         next: api.data.next && { ...api.data.next },
         swipeDir: undefined,
      });
   }, [api.data, state]);

   /* Bind keyboard to actions */
   useEffect(() => {
      const handleKeyPress = (event: KeyboardEvent) => {
         if (event.key === 'Escape') {
            props.onClose();
         } else if (event.key === 'ArrowLeft') {
            swipe(RIGHT);
         } else if (event.key === 'ArrowRight') {
            swipe(LEFT);
         }
      };

      document.addEventListener('keydown', handleKeyPress);

      return () => {
         document.removeEventListener('keydown', handleKeyPress);
      };
   }, [props, swipe]);

   const gotoMedia = useCallback(
      (media?: Media) => {
         if (!media) {
            return;
         }

         setState({ ...state, id: media.id });
      },
      [state]
   );

   const handlers = useSwipeable({
      onSwiped: (e) => {
         switch (e.dir) {
            case DOWN:
               props.onClose();
               break;

            default:
               swipe(e.dir);
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
         <div className="relative modal-box bg-black flex flex-col w-full h-full max-h-full max-w-full overflow-hidden">
            {state.prev && (
               <MediaItem
                  className={state.swipeDir === RIGHT ? 'transition-transform' : '-translate-x-full transition-transform invisible'}
                  media={state.prev}
               />
            )}

            {state.next && (
               <MediaItem
                  className={state.swipeDir === LEFT ? 'transition-transform' : 'translate-x-full transition-transform invisible'}
                  media={state.next}
               />
            )}

            {state.id && (
               <MediaItem
                  className={
                     state.swipeDir === RIGHT && state.prev
                        ? 'translate-x-full transition-transform'
                        : state.swipeDir === LEFT && state.next
                        ? '-translate-x-full transition-transform'
                        : ''
                  }
                  media={state.current}
                  isCurrent
                  onTransitionEnd={() => gotoMedia(state.swipeDir === RIGHT ? state.prev : state.swipeDir === LEFT ? state.next : undefined)}
               />
            )}

            {showControls && (
               <>
                  {state.current && (
                     <a className="btn btn-circle opacity-80 fixed top-3 right-20 " href={`/api/${state.current.type}?id=${state.id}&download=1`}>
                        <ArrowDownTrayIcon className="h-6 w-6" />
                     </a>
                  )}

                  <button className="btn btn-circle opacity-80 fixed top-3 right-3 " onClick={props.onClose}>
                     <XMarkIcon className="h-6 w-6" />
                  </button>

                  {state.prev && (
                     <button className="btn btn-circle opacity-80 fixed top-1/2 left-10 " onClick={() => swipe(RIGHT)}>
                        <ArrowLeftIcon className="h-6 w-6" />
                     </button>
                  )}

                  {state.next && (
                     <button className="btn btn-circle opacity-80 fixed top-1/2 right-10 " onClick={() => swipe(LEFT)}>
                        <ArrowRightIcon className="h-6 w-6" />
                     </button>
                  )}
               </>
            )}
         </div>
      </dialog>
   );
};

export default MediaDialog;
