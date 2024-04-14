/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The Gallery Image Viewer Dialog
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSwipeable, LEFT, RIGHT, DOWN, SwipeDirections, UP } from 'react-swipeable';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSearchAPI } from '@/hooks';
import { MediaCarousel, MediaInformation } from '.';

interface MediaDialogProps {
   id: number;
   onClose: () => void;
   onChange: (id: number) => void;
}

const isTouchEnabled = () => {
   return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export interface MediaState {
   id: number;
   prev?: Media;
   current?: Media;
   next?: Media;
   swipeDir?: SwipeDirections;
}

export const MediaDialog = (props: MediaDialogProps) => {
   const [state, setState] = useState<MediaState>({ id: props.id });
   const [showControls, setShowControls] = useState(false);
   const [showInfo, setShowInfo] = useState(false);
   const api = useSearchAPI<APIMedia>({ url: '/api/media', params: { id: state.id } });
   const mediaRef = useRef<HTMLElement>(null);
   const [swipeEnabled, setSwipeEnabled] = useState(true);

   const onClose = useCallback(() => {
      props.onClose();
   }, [props]);

   const isMediaZoomedOut = () => {
      return !!(window.visualViewport?.width && mediaRef.current?.clientWidth && window.visualViewport?.width / mediaRef.current?.clientWidth >= 0.9);
   };

   const onSwipe = useCallback(
      (dir: SwipeDirections, force: boolean = false) => {
         if (!force && (!isMediaZoomedOut() || !swipeEnabled)) {
            /* We are not allowed to do swipe actions at the moment */
            return;
         }
         setSwipeEnabled(true);

         if (dir == DOWN) {
            onClose();
         } else {
            setState({ ...state, swipeDir: dir });
         }
      },
      [state, onClose, swipeEnabled]
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
            onClose();
         } else if (event.key === 'ArrowLeft') {
            onSwipe(RIGHT, true);
         } else if (event.key === 'ArrowRight') {
            onSwipe(LEFT, true);
         }
      };

      document.addEventListener('keydown', handleKeyPress);

      return () => {
         document.removeEventListener('keydown', handleKeyPress);
      };
   }, [onClose, onSwipe]);

   const gotoMedia = useCallback(
      (media?: Media) => {
         if (!media) {
            return;
         }
         props.onChange(media.id);
         setState({ ...state, id: media.id });
      },
      [state, props]
   );

   const onSwipeComplete = useCallback(
      (dir?: SwipeDirections) => {
         switch (dir) {
            case RIGHT:
               gotoMedia(state.prev);
               break;

            case LEFT:
               gotoMedia(state.next);
               break;

            case UP:
               setShowInfo(true);
               setState({ ...state, swipeDir: undefined });
               break;
         }
      },
      [state, gotoMedia]
   );

   const handlers = useSwipeable({
      onSwiped: (e) => {
         if (!showInfo) {
            switch (e.dir) {
               case DOWN:
                  onSwipe(e.dir);
                  break;

               case UP:
                  onSwipe(e.dir);
                  break;

               default:
                  onSwipe(e.dir);
                  break;
            }
         }
      },
      onSwiping: () => {
         setSwipeEnabled(isMediaZoomedOut());
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
         <div className="relative modal-box bg-base-100 flex flex-col w-full h-full max-h-full max-w-full overflow-hidden">
            {showInfo && state.current ? (
               <MediaInformation media={state.current} />
            ) : (
               <MediaCarousel
                  ref={mediaRef}
                  state={state}
                  showControls={showControls}
                  onClick={() => setShowControls(!showControls)}
                  onSwipe={onSwipe}
                  onTransitionEnd={() => onSwipeComplete(state.swipeDir)}
               />
            )}

            {(showControls || showInfo) && (
               <div className="fixed top-3 right-3 flex space-x-3">
                  {state.current && (
                     <>
                        <button className="btn btn-circle opacity-80" onClick={() => setShowInfo(!showInfo)}>
                           {showInfo ? <ArrowUturnLeftIcon className="h-6 w-6" /> : <InformationCircleIcon className="h-6 w-6" />}
                        </button>
                        <a className="btn btn-circle opacity-80" href={`/api/${state.current.type}?id=${state.id}&download=1`}>
                           <ArrowDownTrayIcon className="h-6 w-6" />
                        </a>
                     </>
                  )}

                  <button className="btn btn-circle opacity-80" onClick={onClose}>
                     <XMarkIcon className="h-6 w-6" />
                  </button>
               </div>
            )}
         </div>
      </dialog>
   );
};
