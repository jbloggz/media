/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for Gallery.tsx
 */

import { ForwardedRef } from 'react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import { RenderResult, fireEvent, render } from '@testing-library/react';
import mocks from '@/mocks';
import { useThrottleFn } from '../hooks/useThrottleFn';
import { Scrubber } from './Scrubber';
import { Gallery, MediaDialog } from '.';

interface MockThumbnailBlockProps {
   block: MediaBlock;
   className?: string;
   onImageClick?: (id: number) => void;
   ref: ForwardedRef<HTMLDivElement>;
}

/* Mock out dependencies */
const MockThumbnailBlock = jest
   .fn()
   .mockImplementation((props, ref) => <div ref={ref} data-block={JSON.stringify(props.block)} data-testid="ThumbnailBlock"></div>);
jest.mock('./ThumbnailBlock', () => {
   const { forwardRef } = jest.requireActual('react');
   return {
      ThumbnailBlock: forwardRef(function ThumbnailBlock(props: MockThumbnailBlockProps, ref: ForwardedRef<HTMLDivElement>) {
         return MockThumbnailBlock(props, ref);
      }),
   };
});
jest.mock('./Scrubber', () => ({
   Scrubber: jest.fn().mockReturnValue(<div data-testid="Scrubber"></div>),
}));
jest.mock('./MediaDialog', () => ({
   MediaDialog: jest.fn().mockReturnValue(<div data-testid="MediaDialog"></div>),
}));
jest.mock('../hooks/useThrottleFn', () => ({
   useThrottleFn: jest.fn(),
}));

const getRenderedBlockElems = (component: RenderResult) => component.queryAllByTestId('ThumbnailBlock');

const getRenderedBlocks = (component: RenderResult) => getRenderedBlockElems(component).map((e) => JSON.parse(e.getAttribute('data-block') ?? '{}'));

describe('Gallery', () => {
   it('should initially render the main section with the first ThumbnailBlock', () => {
      const blocks: MediaBlock[] = [
         { day: '2022-01-03', count: 5, total: 5 },
         { day: '2022-01-02', count: 3, total: 8 },
         { day: '2022-01-01', count: 7, total: 15 },
      ];

      const component = render(<Gallery blocks={blocks} />);
      /* Re-render to make sure the refs are correct */
      component.rerender(<Gallery blocks={blocks} />);
      const renderedBlocks = getRenderedBlocks(component);

      expect(component.getByRole('main')).toBeInTheDocument();
      expect(renderedBlocks).toEqual(blocks.slice(0, 1));
   });

   it('should render an empty main section when no blocks are passed as props', () => {
      const component = render(<Gallery blocks={[]} />);

      const mainSection = component.getByRole('main');
      const thumbnailBlocks = component.queryAllByRole('thumbnail-block');

      expect(mainSection).toBeInTheDocument();
      expect(thumbnailBlocks.length).toBe(0);
   });

   it('should render the block that is scrubbed to', () => {
      const blocks: MediaBlock[] = [
         { day: '2022-01-03', count: 5, total: 5 },
         { day: '2022-01-02', count: 3, total: 8 },
         { day: '2022-01-01', count: 7, total: 15 },
      ];

      const component = render(<Gallery blocks={blocks} />);
      component.rerender(<Gallery blocks={blocks} />);

      let renderedBlocks = getRenderedBlocks(component);
      expect(renderedBlocks).toHaveLength(1);
      expect(renderedBlocks).toEqual(blocks.slice(0, 1));

      act(() => {
         (Scrubber as jest.Mock).mock.lastCall?.[0].onScrubStart();
         (Scrubber as jest.Mock).mock.lastCall?.[0].onScrub(1);
         (Scrubber as jest.Mock).mock.lastCall?.[0].onScrubStop();
      });

      renderedBlocks = getRenderedBlocks(component);
      expect(renderedBlocks).toEqual(blocks.slice(1, 3));
   });

   it('should add block to the end if possible', () => {
      const blocks: MediaBlock[] = [
         { day: '2022-01-03', count: 5, total: 5 },
         { day: '2022-01-02', count: 3, total: 8 },
         { day: '2022-01-01', count: 7, total: 15 },
      ];

      const component = render(<Gallery blocks={blocks} />);
      component.rerender(<Gallery blocks={blocks} />);

      act(() => {
         (useThrottleFn as jest.Mock).mock.lastCall?.[0]();
      });

      const renderedBlocks = getRenderedBlocks(component);
      expect(renderedBlocks).toEqual(blocks.slice(0, 2));
   });

   it('should remove a block from the end if possible', () => {
      const blocks: MediaBlock[] = [
         { day: '2022-01-03', count: 5, total: 5 },
         { day: '2022-01-02', count: 3, total: 8 },
         { day: '2022-01-01', count: 7, total: 15 },
      ];

      const component = render(<Gallery blocks={blocks} />);
      component.rerender(<Gallery blocks={blocks} />);

      act(() => {
         (useThrottleFn as jest.Mock).mock.lastCall?.[0]();
      });
      act(() => {
         (useThrottleFn as jest.Mock).mock.lastCall?.[0]();
      });

      let renderedBlocks = getRenderedBlocks(component);
      expect(renderedBlocks).toEqual(blocks);

      const renderedBlocksElems = getRenderedBlockElems(component);
      renderedBlocksElems[2].getBoundingClientRect = () => ({ top: 100000, bottom: 101000 } as DOMRect);

      act(() => {
         (useThrottleFn as jest.Mock).mock.lastCall?.[0]();
      });

      renderedBlocks = getRenderedBlocks(component);
      expect(renderedBlocks).toEqual(blocks.slice(0, 2));
   });

   it('should remove a block from the start if possible', () => {
      const blocks: MediaBlock[] = [
         { day: '2022-01-03', count: 5, total: 5 },
         { day: '2022-01-02', count: 3, total: 8 },
         { day: '2022-01-01', count: 7, total: 15 },
      ];

      const component = render(<Gallery blocks={blocks} />);
      component.rerender(<Gallery blocks={blocks} />);

      act(() => {
         (useThrottleFn as jest.Mock).mock.lastCall?.[0]();
      });
      act(() => {
         (useThrottleFn as jest.Mock).mock.lastCall?.[0]();
      });

      let renderedBlocks = getRenderedBlocks(component);
      expect(renderedBlocks).toEqual(blocks);

      const renderedBlocksElems = getRenderedBlockElems(component);
      renderedBlocksElems[0].getBoundingClientRect = () => ({ top: -101000, bottom: -100000 } as DOMRect);

      act(() => {
         (useThrottleFn as jest.Mock).mock.lastCall?.[0]();
      });

      renderedBlocks = getRenderedBlocks(component);
      expect(renderedBlocks).toEqual(blocks.slice(1, 3));
   });

   it('should add block to the start if possible', () => {
      const blocks: MediaBlock[] = [
         { day: '2022-01-03', count: 5, total: 5 },
         { day: '2022-01-02', count: 3, total: 8 },
         { day: '2022-01-01', count: 7, total: 15 },
      ];

      const component = render(<Gallery blocks={blocks} />);
      component.rerender(<Gallery blocks={blocks} />);

      act(() => {
         (Scrubber as jest.Mock).mock.lastCall?.[0].onScrubStart();
         (Scrubber as jest.Mock).mock.lastCall?.[0].onScrub(2);
         (Scrubber as jest.Mock).mock.lastCall?.[0].onScrubStop();
      });

      let renderedBlocks = getRenderedBlocks(component);
      expect(renderedBlocks).toEqual(blocks.slice(2, 3));

      act(() => {
         (useThrottleFn as jest.Mock).mock.lastCall?.[0]();
      });

      renderedBlocks = getRenderedBlocks(component);
      expect(renderedBlocks).toEqual(blocks.slice(1, 3));
   });

   it('should not add/remove blocks while scrubbing', () => {
      const blocks: MediaBlock[] = [
         { day: '2022-01-03', count: 5, total: 5 },
         { day: '2022-01-02', count: 3, total: 8 },
         { day: '2022-01-01', count: 7, total: 15 },
      ];

      const component = render(<Gallery blocks={blocks} />);
      component.rerender(<Gallery blocks={blocks} />);

      act(() => {
         (Scrubber as jest.Mock).mock.lastCall?.[0].onScrubStart();
      });
      act(() => {
         (useThrottleFn as jest.Mock).mock.lastCall?.[0]();
      });

      let renderedBlocks = getRenderedBlocks(component);
      expect(renderedBlocks).toEqual(blocks.slice(0, 1));
   });

   it('should set the correct visible block in the scrubber', () => {
      const blocks: MediaBlock[] = [
         { day: '2022-01-03', count: 5, total: 5 },
         { day: '2022-01-02', count: 3, total: 8 },
         { day: '2022-01-01', count: 7, total: 15 },
      ];

      const component = render(<Gallery blocks={blocks} />);
      component.rerender(<Gallery blocks={blocks} />);
      act(() => {
         (useThrottleFn as jest.Mock).mock.lastCall?.[0]();
      });
      act(() => {
         (useThrottleFn as jest.Mock).mock.lastCall?.[0]();
      });

      expect((Scrubber as jest.Mock).mock.lastCall?.[0].currentBlock).toEqual(0);

      const mainElem = component.getByRole('main');
      mainElem.getBoundingClientRect = () => ({ top: 0, bottom: 100 } as DOMRect);
      mainElem.scrollTop = 100;
      const renderedBlocksElems = getRenderedBlockElems(component);
      renderedBlocksElems[0].getBoundingClientRect = () => ({ top: -200, bottom: -10 } as DOMRect);
      renderedBlocksElems[1].getBoundingClientRect = () => ({ top: -10, bottom: 200 } as DOMRect);
      renderedBlocksElems[2].getBoundingClientRect = () => ({ top: 200, bottom: 300 } as DOMRect);

      act(() => {
         fireEvent.scroll(mainElem);
      });
      expect((Scrubber as jest.Mock).mock.lastCall?.[0].currentBlock).toEqual(1);
   });

   it('should set the select id in the MediaDialog when clicked in the Thumbnail block', () => {
      const blocks: MediaBlock[] = [
         { day: '2022-01-03', count: 5, total: 5 },
         { day: '2022-01-02', count: 3, total: 8 },
         { day: '2022-01-01', count: 7, total: 15 },
      ];

      const component = render(<Gallery blocks={blocks} />);
      component.rerender(<Gallery blocks={blocks} />);
      act(() => {
         (MockThumbnailBlock as jest.Mock).mock.lastCall?.[0].onImageClick(1234);
      });

      expect((MediaDialog as jest.Mock).mock.lastCall?.[0].id).toEqual(1234);
      expect(mocks.nextNavigation.router.push).toHaveBeenCalledWith('#view:1234');
   });

   it('should close the mediadialog when the onclose is triggered', () => {
      const blocks: MediaBlock[] = [
         { day: '2022-01-03', count: 5, total: 5 },
         { day: '2022-01-02', count: 3, total: 8 },
         { day: '2022-01-01', count: 7, total: 15 },
      ];

      const component = render(<Gallery blocks={blocks} />);
      component.rerender(<Gallery blocks={blocks} />);
      act(() => {
         (MockThumbnailBlock as jest.Mock).mock.lastCall?.[0].onImageClick(1234);
      });
      act(() => {
         (MediaDialog as jest.Mock).mock.lastCall?.[0].onClose();
      });

      expect(mocks.nextNavigation.router.back).toHaveBeenCalled();
   });

   it('should change the selected image when the MeidaDialog onChange handler is triggered', () => {
      const blocks: MediaBlock[] = [
         { day: '2022-01-03', count: 5, total: 5 },
         { day: '2022-01-02', count: 3, total: 8 },
         { day: '2022-01-01', count: 7, total: 15 },
      ];

      const component = render(<Gallery blocks={blocks} />);
      component.rerender(<Gallery blocks={blocks} />);
      act(() => {
         (MockThumbnailBlock as jest.Mock).mock.lastCall?.[0].onImageClick(1234);
      });

      expect((MediaDialog as jest.Mock).mock.lastCall?.[0].id).toEqual(1234);
      expect(mocks.nextNavigation.router.push).toHaveBeenCalledWith('#view:1234');

      act(() => {
         (MediaDialog as jest.Mock).mock.lastCall?.[0].onChange(431);
      });

      expect((MediaDialog as jest.Mock).mock.lastCall?.[0].id).toEqual(431);
      expect(mocks.nextNavigation.router.replace).toHaveBeenCalledWith('#view:431');
   });
});
