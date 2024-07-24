/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for ThumbnailBlock.tsx
 */

import { act, createRef } from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { ThumbnailBlock } from '.';
import mocks from '@/mocks';

jest.mock('./ThumbnailImage', () => ({
   ThumbnailImage: () => <div data-testid="MockThumbnailImage"></div>,
}));

describe('ThumbnailBlock', () => {
   it('should render a div with the given className and ref', () => {
      const className = 'test-class';
      const ref = createRef<HTMLDivElement>();
      const block: MediaBlock = { heading: '2024-03-27', count: 10, total: 83 };
      const mockFetchBlock = (_: MediaBlock): BlockResponse => ({ data: [] });
      const component = render(
         <ThumbnailBlock
            block={block}
            useFetchBlock={mockFetchBlock}
            className={className}
            ref={ref}
            selectedItems={new Set()}
            onItemClick={jest.fn()}
         />
      );

      expect(component.container.querySelector('div')).toHaveClass(className);
      expect(ref.current).toBeInTheDocument();
   });

   it('should allow no heading', () => {
      const className = 'test-class';
      const ref = createRef<HTMLDivElement>();
      const block: MediaBlock = { count: 10, total: 83 };
      const mockFetchBlock = (_: MediaBlock): BlockResponse => ({ data: [] });
      const component = render(
         <ThumbnailBlock
            block={block}
            useFetchBlock={mockFetchBlock}
            className={className}
            ref={ref}
            selectedItems={new Set()}
            onItemClick={jest.fn()}
         />
      );
      expect(component.container.querySelector('div')).toHaveClass(className);
      expect(ref.current).toBeInTheDocument();
   });

   it('should render the number of thumbnails in the props block count if the data is undefined', () => {
      const className = 'test-class';
      const ref = createRef<HTMLDivElement>();
      const block: MediaBlock = { heading: '2024-03-27', count: 10, total: 83 };
      const mockFetchBlock = (_: MediaBlock): BlockResponse => ({});
      const component = render(
         <ThumbnailBlock
            block={block}
            useFetchBlock={mockFetchBlock}
            className={className}
            ref={ref}
            selectedItems={new Set()}
            onItemClick={jest.fn()}
         />
      );

      expect(component.getAllByTestId('MockThumbnailImage')).toHaveLength(10);
   });

   it('should render the thumbnails provided by the API', () => {
      const className = 'test-class';
      const ref = createRef<HTMLDivElement>();
      const block: MediaBlock = { heading: '2024-03-27', count: 10, total: 83 };
      const mockFetchBlock = (_: MediaBlock): BlockResponse => ({
         data: [
            { id: 123, type: 'image' },
            { id: 435, type: 'image' },
            { id: 235, type: 'video', duration: 361 },
         ],
      });
      const component = render(
         <ThumbnailBlock
            block={block}
            useFetchBlock={mockFetchBlock}
            className={className}
            ref={ref}
            selectedItems={new Set()}
            onItemClick={jest.fn()}
         />
      );
      expect(component.getAllByTestId('MockThumbnailImage')).toHaveLength(3);
   });

   it('should call toast on an API error', () => {
      const className = 'test-class';
      const ref = createRef<HTMLDivElement>();
      const block: MediaBlock = { heading: '2024-03-27', count: 8, total: 83 };

      const mockFetchBlock = (_: MediaBlock): BlockResponse => ({ error: new Error('Oh no!!') });
      const component = render(
         <ThumbnailBlock
            block={block}
            useFetchBlock={mockFetchBlock}
            className={className}
            ref={ref}
            selectedItems={new Set()}
            onItemClick={jest.fn()}
         />
      );
      expect(component.getAllByTestId('MockThumbnailImage')).toHaveLength(8);
      expect((mocks.reactToastify.toast.error as jest.Mock).mock.lastCall[0]).toBe('Oh no!!');
   });

   it("should call toast with default message on an API error that doesn't have a message", () => {
      const className = 'test-class';
      const ref = createRef<HTMLDivElement>();
      const block: MediaBlock = { heading: '2024-03-27', count: 8, total: 83 };

      const mockFetchBlock = (_: MediaBlock): BlockResponse => ({ error: new Error() });
      const component = render(
         <ThumbnailBlock
            block={block}
            useFetchBlock={mockFetchBlock}
            className={className}
            ref={ref}
            selectedItems={new Set()}
            onItemClick={jest.fn()}
         />
      );
      expect(component.getAllByTestId('MockThumbnailImage')).toHaveLength(8);
      expect((mocks.reactToastify.toast.error as jest.Mock).mock.lastCall[0]).toBe('Unknown error occurred');
   });

   it('should call the onClick handler for all items ith e select all is clicked', () => {
      const className = 'test-class';
      const ref = createRef<HTMLDivElement>();
      const block: MediaBlock = { heading: '2024-03-27', count: 3, total: 83 };
      const mockOnItemClick = jest.fn();
      const mockFetchBlock = (_: MediaBlock): BlockResponse => ({
         data: [
            { id: 123, type: 'image' },
            { id: 435, type: 'image' },
            { id: 235, type: 'video', duration: 361 },
         ],
      });
      const component = render(
         <ThumbnailBlock
            block={block}
            useFetchBlock={mockFetchBlock}
            className={className}
            ref={ref}
            selectedItems={new Set([123, 435, 235])}
            onItemClick={mockOnItemClick}
            selectMode
         />
      );
      expect(component.getAllByTestId('MockThumbnailImage')).toHaveLength(3);
      const selectAllButton = component.getByRole('button');
      act(() => {
         selectAllButton.click();
      });
      expect(mockOnItemClick).toHaveBeenCalledTimes(3);
   });
});
