/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The scrubber bar to the right of the screen
 */
'use client';

import { useIntervalFn, useThrottleFn } from '@/hooks';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DraggableCore, DraggableData } from 'react-draggable';

/* Number of ms without scrolling to hide the scrubber */
const scrubberHideTimeout = 5000;

/* Maximum number of scrubber nodes */
const scrubberNodeCount = 100;

interface Node {
   name: string;
   block: number;
   position: number;
}

interface ScrubberProps {
   blocks: MediaBlock[];
   scrollPosition: number;
   currentBlock: number;
   onScrub: (idx: number) => void;
   onScrubStart: () => void;
   onScrubStop: () => void;
}

const getNodeName = (heading?: string) => {
   const dt = heading ? new Date(heading) : new Date();
   return dt.toLocaleDateString('default', { month: 'short', year: 'numeric' });
};

/**
 * Build the list of nodes for the scrubber from the media blocks
 *
 * @param blocks The raw media blocks
 *
 * @returns A tuple of the scrubber nodes and the block to node map
 */
const buildNodes = (blocks: MediaBlock[]): [Node[], { [key: number]: number }] => {
   if (blocks.length < 2) {
      return [[], {}];
   }

   const nodes: Node[] = [];
   const blockToNodeMap: { [key: number]: number } = {};
   const total = blocks[blocks.length - 1].total;
   const mediaPerNode = total / scrubberNodeCount;
   let position = 0;
   let count = 0;
   let nodeIdx = 0;
   for (const [idx, block] of blocks.entries()) {
      if (count > mediaPerNode) {
         nodes.push({
            name: getNodeName(blocks[nodeIdx].heading),
            block: nodeIdx,
            position,
         });
         position += count / total;
         count = 0;
         nodeIdx = idx;
      }
      blockToNodeMap[idx] = nodes.length;
      count += block.count;
   }

   if (count > 0) {
      nodes.push({
         name: getNodeName(blocks[blocks.length - 1].heading),
         block: nodeIdx,
         position,
      });
   }

   /* Normalise the node positions */
   const max = nodes[nodes.length - 1].position;
   for (const node of nodes) {
      node.position /= max;
   }

   return [nodes, blockToNodeMap];
};

/**
 * Find the node that is closest to the sliders current position
 *
 * @param nodes           The list of all the nodes
 * @param sliderPosition  The current position of the slider (as a fraction)
 *
 * @returns The node that is closest to the slider
 */
const findClosestNode = (nodes: Node[], sliderPosition: number) => {
   let prevDiff = sliderPosition;
   for (let i = 1; i < nodes.length; i++) {
      const diff = Math.abs(nodes[i].position - sliderPosition);
      if (diff > prevDiff) {
         return nodes[i - 1];
      }
      prevDiff = diff;
   }
   return nodes[nodes.length - 1];
};

export const Scrubber = ({ blocks, scrollPosition, currentBlock, onScrub, onScrubStart, onScrubStop }: ScrubberProps) => {
   const scrollbarElemRef = useRef<HTMLDivElement>(null);
   const sliderElemRef = useRef<HTMLDivElement>(null);
   const [currentNode, setCurrentNode] = useState<Node>();
   const [lastScrollPosition, setLastScrollPosition] = useState(0);
   const [lastScrollTime, setLastScrollTime] = useState(0);
   const [isScrubbing, setIsScrubbing] = useState(false);
   const [nodes, setNodes] = useState<Node[]>([]);
   const [blockToNodeMap, setBlockToNodeMap] = useState<{ [key: number]: number }>({});
   const scrubberHeight = scrollbarElemRef.current?.clientHeight || 0;

   /* Build the nodes for the scrubber */
   useEffect(() => {
      const res = buildNodes(blocks);
      setNodes(res[0]);
      setBlockToNodeMap(res[1]);
   }, [blocks]);

   /*
    * Keep track of the last time we scrolled, so we can show/hide the scrubber
    * when scrolling starts/stops.
    */
   useThrottleFn(
      useCallback(() => {
         if (Math.abs(lastScrollPosition - scrollPosition) > 5) {
            setLastScrollPosition(scrollPosition);
            setLastScrollTime(Date.now());
         }
      }, [scrollPosition, lastScrollPosition]),
      100,
      scrollPosition
   );

   /*
    * Periodically check if we need to show/hide the scrubber, if we've recently
    * started or stopped scrolling.
    */
   useIntervalFn(
      useCallback(() => {
         const scrollbarElem = scrollbarElemRef.current;
         if (isScrubbing) {
            setLastScrollTime(Date.now());
         } else if (Math.abs(lastScrollTime - Date.now()) > scrubberHideTimeout) {
            scrollbarElem?.classList.remove('opacity-60');
            scrollbarElem?.classList.add('opacity-0');
         } else {
            scrollbarElem?.classList.remove('opacity-0');
            scrollbarElem?.classList.add('opacity-60');
         }
      }, [lastScrollTime, isScrubbing]),
      100
   );

   /*
    * When the react-draggable onDragStart is called, set the isScrubbing state
    * and call onScrubStart prop
    */
   const onDragStart = useCallback(() => {
      setIsScrubbing(true);
      onScrubStart();
   }, [onScrubStart]);

   /*
    * When the react-draggable onDragStop is called, set the isScrubbing state
    * and call onScrubStop prop
    */
   const onDragStop = useCallback(() => {
      setIsScrubbing(false);
      onScrubStop();
   }, [onScrubStop]);

   /*
    * When the react-draggable onDrag is called, set the position of the slider.
    * Also call the onScrub prop if we change node.
    */
   const onDrag = useCallback(
      (data: DraggableData) => {
         const sliderElem = sliderElemRef.current;
         if (!sliderElem || nodes.length === 0) {
            return;
         }
         if (data.y >= 0 && data.y <= scrubberHeight) {
            sliderElem.style.top = `${data.y - 16}px`;
         }

         const node = findClosestNode(nodes, data.y / scrubberHeight);
         if (currentNode !== node) {
            onScrub(node.block);
            setCurrentNode(node);
         }
      },
      [currentNode, onScrub, nodes, scrubberHeight]
   );

   /*
    * If the current block changes, make sure the slider adjusts appropriately
    */
   useEffect(() => {
      const sliderElem = sliderElemRef.current;
      if (!sliderElem || isScrubbing || nodes.length === 0) {
         return;
      }

      const node = nodes[blockToNodeMap[currentBlock]];
      if (node !== currentNode) {
         setCurrentNode(node);
      }
      const position = node.position * scrubberHeight;
      sliderElem.style.top = `${position - 16}px`;
   }, [isScrubbing, nodes, currentBlock, blockToNodeMap, currentNode, scrubberHeight]);

   return (
      <div ref={scrollbarElemRef} className="fixed w-1 bg-gray-500 top-28 bottom-10 right-2 transition-opacity duration-1000 opacity-0 rounded">
         {nodes.map((node, i) => (
            <div
               key={blocks[node.block]?.heading || i}
               className="absolute w-1 h-1 bg-gray-700 rounded-full"
               style={{ top: `${node.position * scrubberHeight - 2}px` }}
            ></div>
         ))}
         <DraggableCore nodeRef={sliderElemRef} onDrag={(_, d) => onDrag(d)} onStart={onDragStart} onStop={onDragStop}>
            <div ref={sliderElemRef} className="absolute w-16 h-8 right-5 bg-gray-500 rounded-[3px] text-center cursor-pointer">
               <div className="absolute w-5 h-5 rotate-45 -right-2.5 top-1.5 bg-gray-500"></div>
               <span className="relative inline-block text-xs font-bold pt-2 select-none">{currentNode?.name}</span>
            </div>
         </DraggableCore>
      </div>
   );
};
