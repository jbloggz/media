/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for ThumbnailBlock.tsx
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { ThumbnailBlock } from '.';
import { createRef } from 'react';
import * as useSearchAPI from '../hooks/useSearchAPI';
import { APIError } from '@/hooks';
import mocks from '@/mocks';

jest.mock('../hooks/useSearchAPI');
const mockUseSeachAPI = jest.spyOn(useSearchAPI, 'useSearchAPI');
jest.mock('./ThumbnailImage', () => ({
   ThumbnailImage: () => <div data-testid="MockThumbnailImage"></div>,
}));

describe('ThumbnailBlock', () => {
   it('should render a div with the given className and ref', () => {
      const className = 'test-class';
      const ref = createRef<HTMLDivElement>();
      const block: MediaBlock = { heading: '2024-03-27', count: 10, total: 83 };

      mockUseSeachAPI.mockReturnValue({ isLoading: false, data: [], error: undefined, mutate: jest.fn(), isValidating: false });
      const component = render(<ThumbnailBlock block={block} className={className} ref={ref} selectedItems={new Set()} onItemClick={jest.fn()} />);

      expect(component.container.querySelector('div')).toHaveClass(className);
      expect(ref.current).toBeInTheDocument();
   });

   it('should render the number of thumbnails in the props block count if the api is loading', () => {
      const className = 'test-class';
      const ref = createRef<HTMLDivElement>();
      const block: MediaBlock = { heading: '2024-03-27', count: 10, total: 83 };

      mockUseSeachAPI.mockReturnValue({ isLoading: true, data: null, error: undefined, mutate: jest.fn(), isValidating: false });
      const component = render(<ThumbnailBlock block={block} className={className} ref={ref} selectedItems={new Set()} onItemClick={jest.fn()} />);

      expect(component.getAllByTestId('MockThumbnailImage')).toHaveLength(10);
   });

   it('should render the thumbnails provided by the API', () => {
      const className = 'test-class';
      const ref = createRef<HTMLDivElement>();
      const block: MediaBlock = { heading: '2024-03-27', count: 10, total: 83 };

      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: [
            { id: 123, type: 'image' },
            { id: 435, type: 'image' },
            { id: 235, type: 'video', duration: 361 },
         ],
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      const component = render(<ThumbnailBlock block={block} className={className} ref={ref} selectedItems={new Set()} onItemClick={jest.fn()} />);
      expect(component.getAllByTestId('MockThumbnailImage')).toHaveLength(3);
   });

   it('should call toast on an API error', () => {
      const className = 'test-class';
      const ref = createRef<HTMLDivElement>();
      const block: MediaBlock = { heading: '2024-03-27', count: 8, total: 83 };

      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: null,
         error: new APIError('Oh no!!', 400),
         mutate: jest.fn(),
         isValidating: false,
      });
      const component = render(<ThumbnailBlock block={block} className={className} ref={ref} selectedItems={new Set()} onItemClick={jest.fn()} />);
      expect(component.getAllByTestId('MockThumbnailImage')).toHaveLength(8);
      expect(mocks.reactToastify.toast.error).toHaveBeenCalledWith('Oh no!!');
   });

   it("should call toast with default message on an API error that doesn't have a message", () => {
      const className = 'test-class';
      const ref = createRef<HTMLDivElement>();
      const block: MediaBlock = { heading: '2024-03-27', count: 8, total: 83 };

      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: null,
         error: new APIError('', 400),
         mutate: jest.fn(),
         isValidating: false,
      });
      const component = render(<ThumbnailBlock block={block} className={className} ref={ref} selectedItems={new Set()} onItemClick={jest.fn()} />);
      expect(component.getAllByTestId('MockThumbnailImage')).toHaveLength(8);
      expect(mocks.reactToastify.toast.error).toHaveBeenCalledWith('Unknown error occurred');
   });
});
