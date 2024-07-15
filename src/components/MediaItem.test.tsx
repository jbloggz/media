/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for MediaItem.tsx
 */

import '@testing-library/jest-dom';
import { act } from 'react';
import { render } from '@testing-library/react';
import { Loader } from './Loader';
import { MediaItem } from '.';

jest.mock('./Loader', () => ({
   Loader: jest.fn().mockReturnValue(<div data-testid="Loader"></div>),
}));

describe('MediaItem', () => {
   it('should render an image', () => {
      const props = {
         media: {
            type: 'image',
            id: 123,
            path: '/path/to/image.jpg',
            timestamp: 1234,
            size: 3284,
            width: 235,
            height: 5432,
         } as Media,
         className: 'test-class',
         onClick: jest.fn(),
         onTransitionEnd: jest.fn(),
         isCurrent: true,
      };

      const component = render(<MediaItem {...props} />);

      expect(Loader).toHaveBeenCalledWith(expect.objectContaining({ isLoading: true }), {});
      expect(component.getByRole('img')).toBeInTheDocument();
   });

   it('should call onclick handler when image is clicked', () => {
      const props = {
         media: {
            type: 'image',
            id: 123,
            path: '/path/to/image.jpg',
            timestamp: 1234,
            size: 3284,
            width: 235,
            height: 5432,
         } as Media,
         className: 'test-class',
         onClick: jest.fn(),
         onTransitionEnd: jest.fn(),
         isCurrent: true,
      };

      const component = render(<MediaItem {...props} />);
      act(() => {
         component.getByRole('img').click();
      });

      expect(props.onClick).toHaveBeenCalled();
   });

   it('should render a video', () => {
      const props = {
         media: {
            type: 'video',
            id: 123,
            path: '/path/to/video.mp4',
            timestamp: 1234,
            size: 3284,
            width: 235,
            height: 5432,
            duration: 387,
         } as Media,
         className: 'test-class',
         onClick: jest.fn(),
         onTransitionEnd: jest.fn(),
         isCurrent: true,
      };

      const component = render(<MediaItem {...props} />);

      expect(Loader).not.toHaveBeenCalled();
      expect(component.container.querySelector('video')).toBeInTheDocument();
   });

   it('should call onclick handler when video is clicked', () => {
      const props = {
         media: {
            type: 'video',
            id: 123,
            path: '/path/to/video.mp4',
            timestamp: 1234,
            size: 3284,
            width: 235,
            height: 5432,
            duration: 387,
         } as Media,
         className: 'test-class',
         onClick: jest.fn(),
         onTransitionEnd: jest.fn(),
         isCurrent: true,
      };

      const component = render(<MediaItem {...props} />);
      act(() => {
         component.container.querySelector('video')?.click();
      });

      expect(props.onClick).toHaveBeenCalled();
   });

   it('should not render an Image or Video component when media prop is not provided', () => {
      const props = {
         className: 'test-class',
         onClick: jest.fn(),
         onTransitionEnd: jest.fn(),
         isCurrent: true,
      };

      const component = render(<MediaItem {...props} />);

      expect(component.queryByRole('img')).not.toBeInTheDocument();
      expect(component.container.querySelector('video')).toBeNull();
   });

   it('should preload the current video', () => {
      const props = {
         media: {
            type: 'video',
            id: 123,
            path: '/path/to/video.mp4',
            timestamp: 1234,
            size: 3284,
            width: 235,
            height: 5432,
            duration: 387,
         } as Media,
         className: 'test-class',
         onClick: jest.fn(),
         onTransitionEnd: jest.fn(),
         isCurrent: true,
      };

      const component = render(<MediaItem {...props} />);

      expect(Loader).not.toHaveBeenCalled();
      const video = component.container.querySelector('video');
      expect(video?.preload).toEqual('auto');
   });

   it('should not preload non-current videos', () => {
      const props = {
         media: {
            type: 'video',
            id: 123,
            path: '/path/to/video.mp4',
            timestamp: 1234,
            size: 3284,
            width: 235,
            height: 5432,
            duration: 387,
         } as Media,
         className: 'test-class',
         onClick: jest.fn(),
         onTransitionEnd: jest.fn(),
         isCurrent: false,
      };

      const component = render(<MediaItem {...props} />);

      expect(Loader).not.toHaveBeenCalled();
      const video = component.container.querySelector('video');
      expect(video?.preload).toEqual('none');
   });

   it('should disable loader on non-current images', () => {
      const props = {
         media: {
            type: 'image',
            id: 123,
            path: '/path/to/image.jpg',
            timestamp: 1234,
            size: 3284,
            width: 235,
            height: 5432,
         } as Media,
         className: 'test-class',
         onClick: jest.fn(),
         onTransitionEnd: jest.fn(),
         isCurrent: false,
      };

      render(<MediaItem {...props} />);
      expect(Loader).toHaveBeenCalledWith(expect.objectContaining({ isLoading: false }), {});
   });

   it('should disable loader on non-current undefined media', () => {
      const props = {
         className: 'test-class',
         onClick: jest.fn(),
         onTransitionEnd: jest.fn(),
         isCurrent: false,
      };

      render(<MediaItem {...props} />);
      expect(Loader).toHaveBeenCalledWith(expect.objectContaining({ isLoading: false }), {});
   });
});
