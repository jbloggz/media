/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The Gallery Image Viewer Carousel
 */

import { forwardRef } from 'react';
import { LEFT, RIGHT, SwipeDirections, UP } from 'react-swipeable';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { MediaState } from './MediaDialog';
import { MediaItem } from '.';

interface MediaCarouselProps {
   state: MediaState;
   showControls: boolean;
   onClick: () => void;
   onSwipe: (dir: SwipeDirections, force: boolean) => void;
   onTransitionEnd: () => void;
}

export const MediaCarousel = forwardRef<HTMLElement, MediaCarouselProps>(function MediaCarousel(props, ref) {
   return (
      <>
         {props.state.prev && (
            <MediaItem
               className={props.state.swipeDir === RIGHT ? 'transition-transform' : '-translate-x-full transition-transform invisible'}
               media={props.state.prev}
            />
         )}

         {props.state.next && (
            <MediaItem
               className={props.state.swipeDir === LEFT ? 'transition-transform' : 'translate-x-full transition-transform invisible'}
               media={props.state.next}
            />
         )}

         {props.state.id && (
            <MediaItem
               ref={ref}
               className={
                  props.state.swipeDir === RIGHT && props.state.prev
                     ? 'translate-x-full transition-transform'
                     : props.state.swipeDir === LEFT && props.state.next
                     ? '-translate-x-full transition-transform'
                     : props.state.swipeDir === UP && props.state.next
                     ? '!w-[200px] !h-[200px] mx-auto translate-y-16 transition-all'
                     : ''
               }
               media={props.state.current}
               isCurrent
               onClick={props.onClick}
               onTransitionEnd={props.onTransitionEnd}
            />
         )}

         {props.showControls && (
            <>
               {props.state.prev && (
                  <button className="btn btn-circle opacity-80 fixed top-1/2 left-10 " onClick={() => props.onSwipe(RIGHT, true)}>
                     <ArrowLeftIcon className="h-6 w-6" />
                  </button>
               )}

               {props.state.next && (
                  <button className="btn btn-circle opacity-80 fixed top-1/2 right-10 " onClick={() => props.onSwipe(LEFT, true)}>
                     <ArrowRightIcon className="h-6 w-6" />
                  </button>
               )}
            </>
         )}
      </>
   );
});
