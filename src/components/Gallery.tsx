/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * The Gallery that displays all the media items
 */
'use client';

import { Scrubber, ThumbnailBlock } from '@/components';
import { useThrottleFn } from '@/hooks';
import { useCallback, useEffect, useRef, useState } from 'react';

/* How many pixes away from the start/end are we allowed to add/remove blocks */
const addBlockThreshold = 5000;
const removeBlockThreshold = 9000;

/** The range of blocks to display on the screen */
interface DisplayRange {
   /** The first block to display */
   blockStart: number;

   /** The first item to display with the first block */
   itemStart: number;

   /** One past the last block to display */
   blockEnd: number;

   /** One past the last item within the last block */
   itemEnd: number;
}

const Gallery = (props: APIBlocks) => {
   const mainElemRef = useRef<HTMLDivElement>(null);
   const blockRef = useRef<(HTMLDivElement | null)[]>(new Array(props.blocks.length));
   const [scrollPosition, setScrollPosition] = useState(0);
   const [blockRange, setBlockRange] = useState<DisplayRange>({ blockStart: 0, itemStart: 0, blockEnd: 1, itemEnd: 0 });
   const [visibleBlock, setVisibleBlock] = useState(0);
   const [isScrubbing, setIsScrubbing] = useState(false);

   /* Called when the user is scrubbing */
   const onScrub = (idx: number) => {
      const mainElem = mainElemRef.current;
      if (!mainElem) {
         return;
      }
      /*
       * This is a hack to make sure we're never at exactly the top of the
       * page. If you're at exactly the top, then browsers wont keep your
       * position properly when you add content above you. So move down 1px.
       */
      mainElem.scrollTop = 1;
      setBlockRange({ blockStart: idx, itemStart: 0, blockEnd: idx + 1, itemEnd: props.blocks[idx].count });
   };

   /* Helper function for bounded incrementing by an interval */
   const nextInterval = (current: number, interval: number, max: number) => {
      const value = current + interval - (current % interval);
      return value > max ? max : value;
   };

   /* Helper function for bounded decrementing by an interval */
   const prevInterval = (current: number, interval: number, min: number) => {
      const value = current - 1 - ((current - 1) % interval);
      return value < min ? min : value;
   };

   /* Get the block that is currently visible on screen */
   useEffect(() => {
      const isElementInView = (elem: HTMLElement | null) => {
         const mainElem = mainElemRef.current;
         if (!mainElem || !elem) {
            return false;
         }
         const elemRect = elem.getBoundingClientRect();
         const mainRect = mainElem.getBoundingClientRect();
         const mainRectMiddle = (mainRect.bottom - mainRect.top) / 2;
         return elemRect.top >= mainRect.top || (elemRect.top < mainRectMiddle && elemRect.bottom > mainRectMiddle);
      };

      let { blockStart, blockEnd } = blockRange;
      for (let i = blockStart; i < blockEnd; i++) {
         if (isElementInView(blockRef.current[i])) {
            setVisibleBlock(i);
            break;
         }
      }
   }, [scrollPosition, blockRange]);

   /* Update the blocks displayed on screen depending on the scroll position */
   useThrottleFn(
      useCallback(() => {
         let { blockStart, itemStart, blockEnd, itemEnd } = blockRange;
         const mainElem = mainElemRef.current;
         if (isScrubbing || !mainElem || props.blocks.length === 0) {
            return;
         }

         const mainHeight = mainElem.scrollHeight;
         const scrollTop = mainElem.scrollTop;
         const scrollBottom = mainElem.scrollTop + mainElem.clientHeight;

         /*
          * This is a hack to make sure we're never at exactly the top of the
          * page. If you're at exactly the top, then browsers wont keep your
          * position properly when you add content above you. So move down 1px.
          */
         if (mainElem.scrollTop === 0) {
            mainElem.scrollTop = 1;
         }

         if (scrollBottom > mainHeight - addBlockThreshold) {
            /*
             * We are getting too close to the bottom, so need more items added
             * to the end.
             */
            if (itemEnd === props.blocks[blockEnd - 1].count && blockEnd < props.blocks.length) {
               itemEnd = 0;
               blockEnd += 1;
            }
            itemEnd = nextInterval(itemEnd, props.blockSize, props.blocks[blockEnd - 1].count);
         }
         else if (scrollTop < addBlockThreshold) {
            /*
             * We are getting too close to the top, so need more items added to
             * the start. This is an else-if because we only want to add blocks
             * to the top after we have finished adding blocks to the bottom.
             */
            if (itemStart === 0 && blockStart > 0) {
               blockStart -= 1;
               itemStart = props.blocks[blockStart].count;
            }
            itemStart = prevInterval(itemStart, props.blockSize, 0);
         }

         if (scrollTop > removeBlockThreshold) {
            /*
             * We are far enough away from the top that we can remove some
             * items from the start.
             */
            itemStart = nextInterval(itemStart, props.blockSize, props.blocks[blockStart].count);
            if (itemStart === props.blocks[blockStart].count) {
               itemStart = 0;
               blockStart += 1;
            }
         }

         if (scrollBottom < mainHeight - removeBlockThreshold) {
            /*
             * We are far enough away from the bottom that we can remove some
             * items from the end.
             */
            itemEnd = prevInterval(itemEnd, props.blockSize, 0);
            if (itemEnd === 0) {
               blockEnd -= 1;
               itemEnd = props.blocks[blockEnd - 1].count;
            }
         }

         /*
          * Update the block range if it has changed.
          */
         if (
            blockStart !== blockRange.blockStart ||
            blockEnd !== blockRange.blockEnd ||
            itemStart !== blockRange.itemStart ||
            itemEnd !== blockRange.itemEnd
         ) {
            setBlockRange({ blockStart, itemStart, blockEnd, itemEnd });
         }
      }, [blockRange, isScrubbing, props.blockSize, props.blocks]),
      100,
      scrollPosition
   );

   /* Set the onscroll event handler for the main section */
   useEffect(() => {
      const elem = mainElemRef.current;
      if (elem) {
         elem.onscroll = () => {
            if (mainElemRef.current) {
               setScrollPosition(mainElemRef.current.scrollTop);
            }
         };
         return () => {
            elem.onscroll = null;
         };
      }
   }, []);

   const debugScrollTop = Math.round(mainElemRef.current?.scrollTop || 0);
   const debugScrollHeight = mainElemRef.current?.scrollHeight || 0;
   const debugClientHeight = mainElemRef.current?.clientHeight || 0;
   const debugScrollBottom = Math.round(debugScrollTop + debugClientHeight);

   return (
      <main className="container p-1 mx-auto overflow-y-scroll flex-1 no-scrollbar" ref={mainElemRef}>
         {props.blocks.slice(blockRange.blockStart, blockRange.blockEnd).map(({ heading, count }, idx) => (
            <ThumbnailBlock
               className={'pb-6'}
               key={heading}
               ref={(elem) => (blockRef.current[blockRange.blockStart + idx] = elem)}
               heading={heading}
               start={idx === 0 ? blockRange.itemStart : 0}
               end={idx === blockRange.blockEnd - blockRange.blockStart - 1 ? blockRange.itemEnd : count}
            />
         ))}
         <Scrubber
            visibleIdx={visibleBlock}
            blocks={props.blocks}
            scrollPosition={scrollPosition}
            onScrub={onScrub}
            onScrubStart={() => setIsScrubbing(true)}
            onScrubStop={() => setIsScrubbing(false)}
         />
         <p className="fixed bottom-0 left-3">
            ({debugScrollTop}|{debugScrollBottom})/{debugScrollHeight}, [{blockRange.blockStart}, {blockRange.itemStart}, {blockRange.blockEnd},{' '}
            {blockRange.itemEnd}], {isScrubbing ? 'scrubbing' : ''}
         </p>
      </main>
   );
};

export default Gallery;
