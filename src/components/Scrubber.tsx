/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * The scrubber bar to the right of the screen
 */
'use client';

import { useIntervalFn, useThrottleFn } from '@/hooks';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DraggableCore, DraggableData } from 'react-draggable';

/* Number of ms without scrolling to hide the scrubber */
const scrubberHideTimeout = 5000;

interface ScrubberProps {
   blocks: MediaBlock[];
   scrollPosition: number;
   visibleIdx: number;
   onScrub: (idx: number) => void;
   onScrubStart: () => void;
   onScrubStop: () => void;
}

const Scrubber = (props: ScrubberProps) => {
   const scrollbarElemRef = useRef<HTMLDivElement>(null);
   const sliderElemRef = useRef<HTMLDivElement>(null);
   const [visibleMonth, setVisibleMonth] = useState('');
   const [LastScrollPosition, setLastScrollPosition] = useState(0);
   const [lastScrollTime, setLastScrollTime] = useState(0);
   const [isScrubbing, setIsScrubbing] = useState(false);

   /* Update the last scroll time and position when it changes */
   useThrottleFn(
      useCallback(() => {
         const scrollbarElem = scrollbarElemRef.current;
         if (!scrollbarElem) {
            return;
         }
         if (Math.abs(LastScrollPosition - props.scrollPosition) > 5) {
            setLastScrollPosition(props.scrollPosition);
            setLastScrollTime(Date.now());
         }
      }, [props.scrollPosition, LastScrollPosition]),
      100,
      props.scrollPosition
   );

   /* Periodically check if we need to show/hide the scrubber */
   useIntervalFn(
      useCallback(() => {
         const scrollbarElem = scrollbarElemRef.current;
         if (!scrollbarElem) {
            return;
         }
         if (isScrubbing) {
            setLastScrollTime(Date.now());
         } else if (Math.abs(lastScrollTime - Date.now()) > scrubberHideTimeout) {
            scrollbarElem.classList.remove('opacity-60');
            scrollbarElem.classList.add('opacity-0');
         } else {
            scrollbarElem.classList.remove('opacity-0');
            scrollbarElem.classList.add('opacity-60');
         }
      }, [lastScrollTime, isScrubbing]),
      100
   );

   /* Get the position of a block within the scrubber bar */
   const getBlockPosition = useCallback(
      (idx: number) => {
         const scrollbarElem = scrollbarElemRef.current;
         if (!scrollbarElem) {
            return 0;
         }

         const scrollbarHeight = scrollbarElem.clientHeight;
         return idx === 0 ? 0 : (props.blocks[idx - 1].total / props.blocks[props.blocks.length - 2].total) * scrollbarHeight;
      },
      [props.blocks]
   );

   const onDragStart = useCallback(() => {
      setIsScrubbing(true);
      props.onScrubStart();
   }, [props]);

   const onDragStop = useCallback(() => {
      setIsScrubbing(false);
      props.onScrubStop();
   }, [props]);

   const onDrag = useCallback(
      (data: DraggableData) => {
         const scrollbarElem = scrollbarElemRef.current;
         const sliderElem = sliderElemRef.current;
         if (!scrollbarElem || !sliderElem || props.blocks.length === 0) {
            return;
         }
         sliderElem.style.top = `${data.y - 16}px`;

         let prevDiff = null;
         for (let i = 0; i < props.blocks.length; i++) {
            const diff = Math.abs(getBlockPosition(i) - data.y);
            if (prevDiff !== null && diff > prevDiff) {
               if (i - 1 != props.visibleIdx) {
                  props.onScrub(i - 1);
               }
               return;
            }
            prevDiff = diff;
         }
         props.onScrub(props.blocks.length - 1);
      },
      [getBlockPosition, props]
   );

   /* Get the shorthand version of the block heading */
   useEffect(() => {
      const sliderElem = sliderElemRef.current;
      if (!sliderElem || props.blocks.length === 0) {
         return;
      }

      const [month, year] = props.blocks[props.visibleIdx].heading.split(' ');
      setVisibleMonth(`${month.substring(0, 3)} ${year}`);

      // If we aren't scrubbing, make sure we're positioned at a block */
      if (!isScrubbing) {
         sliderElem.style.top = `${getBlockPosition(props.visibleIdx) - 16}px`;
      }
   }, [isScrubbing, props.blocks, props.visibleIdx, getBlockPosition]);

   return (
      <div
         ref={scrollbarElemRef}
         className="fixed w-1 bg-gray-500 top-28 bottom-10 right-2 transition-opacity duration-1000 opacity-0 hover:opacity-100 rounded"
      >
         {props.blocks.map((month, idx) => (
            <div key={month.heading} className="absolute w-1 h-1 bg-gray-700 rounded-full" style={{ top: `${getBlockPosition(idx) - 2}px` }}></div>
         ))}
         <DraggableCore nodeRef={sliderElemRef} onDrag={(_, d) => onDrag(d)} onStart={onDragStart} onStop={onDragStop}>
            <div ref={sliderElemRef} className="absolute w-16 h-8 right-5 bg-gray-500 rounded-[3px] text-center cursor-pointer">
               <div className="absolute w-5 h-5 rotate-45 -right-2.5 top-1.5 bg-gray-500"></div>
               <span className="relative inline-block text-xs font-bold pt-2 select-none">{visibleMonth}</span>
            </div>
         </DraggableCore>
      </div>
   );
};

export default Scrubber;
