/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The Gallery that displays all the media items
 */
'use client';

import { Scrubber, ThumbnailBlock } from '@/components';
import { useThrottleFn } from '@/hooks';
import { useCallback, useEffect, useRef, useState } from 'react';

/* How many pixels away from the start/end are we allowed to add/remove blocks */
const addBlockThreshold = 5000;
const removeBlockThreshold = 10000;

/** The range of blocks to display on the screen */
interface DisplayRange {
   /** The first block to display */
   start: number;

   /** One past the last block to display */
   end: number;
}

interface GalleryProps {
   /* The media blocks available */
   blocks: MediaBlock[];

   /* The filter query */
   query: string;
}

const Gallery = (props: GalleryProps) => {
   const mainElemRef = useRef<HTMLDivElement>(null);
   const blockRef = useRef<(HTMLDivElement | null)[]>(new Array(props.blocks.length));
   const [scrollPosition, setScrollPosition] = useState(0);
   const [blockRange, setBlockRange] = useState<DisplayRange>({ start: 0, end: 1 });
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

      /* Update the blocks to start ot the scrub index and show at least 30 items */
      let endIdx = idx;
      let count = 0;
      while (endIdx < props.blocks.length && count < 30) {
         count += props.blocks[endIdx].count;
         endIdx++;
      }
      setBlockRange({ start: idx, end: endIdx });
   };

   /* Helper function for checking if another block can be added to the bottom */
   const canPushBlock = (container: HTMLDivElement, blocks: MediaBlock[], blockRange: DisplayRange) => {
      const scrollBottom = container.scrollTop + container.clientHeight;
      return scrollBottom > container.scrollHeight - addBlockThreshold && blockRange.end < blocks.length;
   };

   /* Helper function for checking if another block can be added to the start */
   const canUnshiftBlock = (container: HTMLDivElement, blockRange: DisplayRange) => {
      return container.scrollTop < addBlockThreshold && blockRange.start > 0;
   };

   /* Helper function for checking if the last block can be removed */
   const canPopBlock = (container: HTMLDivElement, idx: number) => {
      const block = blockRef.current[idx];
      return block && block.getBoundingClientRect().top - container.clientHeight > removeBlockThreshold;
   };

   /* Helper function for checking if the first block can be removed */
   const canShiftBlock = (idx: number) => {
      const block = blockRef.current[idx];
      return block && block.getBoundingClientRect().bottom < -removeBlockThreshold;
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

      for (let i = blockRange.start; i < blockRange.end; i++) {
         if (isElementInView(blockRef.current[i])) {
            setVisibleBlock(i);
            break;
         }
      }
   }, [scrollPosition, blockRange]);

   /* Update the blocks displayed on screen depending on the scroll position */
   useThrottleFn(
      useCallback(() => {
         let { start, end } = blockRange;
         const mainElem = mainElemRef.current;
         if (isScrubbing || !mainElem || props.blocks.length === 0) {
            return;
         }

         /*
          * This is a hack to make sure we're never at exactly the top of the
          * page. If you're at exactly the top, then browsers wont keep your
          * position properly when you add content above you. So move down 1px.
          */
         if (mainElem.scrollTop === 0) {
            mainElem.scrollTop = 1;
         }

         if (canPushBlock(mainElem, props.blocks, blockRange)) {
            /* We are too close to the bottom, so add a block to the bottom */
            end += 1;
         } else if (canPopBlock(mainElem, end - 1)) {
            /* We are far enough away from the last block that we can remove it */
            end -= 1;
         } else if (canShiftBlock(start)) {
            /* We are far enough away from the first block that we can remove it */
            start += 1;
         } else if (canUnshiftBlock(mainElem, blockRange)) {
            /* We are too close to the top, so add a block to the top */
            start -= 1;
         }

         /*
          * Update the block range if it has changed.
          */
         if (start !== blockRange.start || end !== blockRange.end) {
            setBlockRange({ start, end });
         }
      }, [blockRange, isScrubbing, props.blocks]),
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
         {props.blocks.slice(blockRange.start, blockRange.end).map((block, idx) => (
            <ThumbnailBlock key={block.day} className={'pb-6'} block={block} query={props.query} ref={(elem) => (blockRef.current[blockRange.start + idx] = elem)} />
         ))}
         <Scrubber
            currentBlock={visibleBlock}
            blocks={props.blocks}
            scrollPosition={scrollPosition}
            onScrub={onScrub}
            onScrubStart={() => setIsScrubbing(true)}
            onScrubStop={() => setIsScrubbing(false)}
         />
         {props.blocks.length > 0 && (
            <p className="fixed bottom-0 left-3">
               Scroll = ({debugScrollTop}-{debugScrollBottom})/{debugScrollHeight}
               <br />
               Block = ({blockRange.start}-{blockRange.end})/{props.blocks.length}
               <br />
               Visible Block = {props.blocks[visibleBlock].day}
            </p>
         )}
      </main>
   );
};

export default Gallery;
