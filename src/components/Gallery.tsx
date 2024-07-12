/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The Gallery that displays all the media items
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MediaDialog, Scrubber, ThumbnailBlock } from '@/components';
import { useHashRouter, useThrottleFn } from '@/hooks';

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
}

export const Gallery = (props: GalleryProps) => {
   const mainElemRef = useRef<HTMLDivElement>(null);
   const blockRef = useRef<(HTMLDivElement | null)[]>(new Array(props.blocks.length));
   const [scrollPosition, setScrollPosition] = useState(0);
   const [blockRange, setBlockRange] = useState<DisplayRange>({ start: 0, end: 1 });
   const [visibleBlock, setVisibleBlock] = useState(0);
   const [isScrubbing, setIsScrubbing] = useState(false);
   const [selectedImage, setSelectedImage] = useState<number | null>(null);
   const router = useHashRouter((v) => !v && setSelectedImage(null));

   /* Called when the user is scrubbing */
   const onScrub = useCallback(
      (idx: number) => {
         /*
          * This is a hack to make sure we're never at exactly the top of the
          * page. If you're at exactly the top, then browsers wont keep your
          * position properly when you add content above you. So move down 1px.
          */
         if (mainElemRef.current) {
            mainElemRef.current.scrollTop = 1;
         }

         /* Update the blocks to start ot the scrub index and show at least 30 items */
         let endIdx = idx;
         let count = 0;
         while (endIdx < props.blocks.length && count < 30) {
            count += props.blocks[endIdx].count;
            endIdx++;
         }
         setBlockRange({ start: idx, end: endIdx });
      },
      [props.blocks]
   );

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
         if (!mainElemRef.current || !elem) {
            return false;
         }
         const elemRect = elem.getBoundingClientRect();
         const mainRect = mainElemRef.current.getBoundingClientRect();
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
         if (isScrubbing || !mainElemRef.current || props.blocks.length === 0) {
            return;
         }

         /*
          * This is a hack to make sure we're never at exactly the top of the
          * page. If you're at exactly the top, then browsers wont keep your
          * position properly when you add content above you. So move down 1px.
          */
         if (mainElemRef.current.scrollTop === 0) {
            mainElemRef.current.scrollTop = 1;
         }

         if (canPushBlock(mainElemRef.current, props.blocks, blockRange)) {
            /* We are too close to the bottom, so add a block to the bottom */
            end += 1;
         } else if (canPopBlock(mainElemRef.current, end - 1)) {
            /* We are far enough away from the last block that we can remove it */
            end -= 1;
         } else if (canShiftBlock(start)) {
            /* We are far enough away from the first block that we can remove it */
            start += 1;
         } else if (canUnshiftBlock(mainElemRef.current, blockRange)) {
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

   return (
      <main
         className="container p-1 mx-auto overflow-y-scroll flex-1 no-scrollbar"
         ref={mainElemRef}
         onScroll={(e) => setScrollPosition(e.currentTarget.scrollTop)}
      >
         {props.blocks.slice(blockRange.start, blockRange.end).map((block, idx) => (
            <ThumbnailBlock
               key={block.day}
               className={'pb-6'}
               block={block}
               ref={(elem) => {
                  blockRef.current[blockRange.start + idx] = elem;
               }}
               onImageClick={(id) => {
                  router.push(`view:${id}`);
                  setSelectedImage(id);
               }}
            />
         ))}
         <Scrubber
            currentBlock={visibleBlock}
            blocks={props.blocks}
            scrollPosition={scrollPosition}
            onScrub={onScrub}
            onScrubStart={() => setIsScrubbing(true)}
            onScrubStop={() => setIsScrubbing(false)}
         />
         {selectedImage && (
            <MediaDialog
               id={selectedImage}
               onClose={() => {
                  router.back();
               }}
               onChange={(id) => {
                  router.replace(`view:${id}`);
                  setSelectedImage(id);
               }}
            />
         )}
      </main>
   );
};
