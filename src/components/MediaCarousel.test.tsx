/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for MediaCarousel.tsx
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { MediaCarousel } from '.';
import { MediaItem } from './MediaItem';
import { LEFT, RIGHT, SwipeDirections, UP } from 'react-swipeable';

jest.mock('./MediaItem', () => ({
   MediaItem: jest.fn().mockReturnValue(<div data-testid="MediaItem"></div>),
}));

describe('MediaCarousel', () => {
   it('should render the current, previous and next media', () => {
      const state = {
         id: 1,
         current: {} as Media,
         prev: {} as Media,
         next: {} as Media,
         swipeDir: LEFT as SwipeDirections,
      };
      const component = render(
         <MediaCarousel state={state} showControls={true} onClick={jest.fn()} onSwipe={jest.fn()} onTransitionEnd={jest.fn()} />
      );
      expect(MediaItem as unknown as jest.Mock).toHaveBeenCalledTimes(3);
      expect(component.getAllByRole('button')).toHaveLength(2);
   });

   it('should not render the controls if showControls is false', () => {
      const state = {
         id: 1,
         current: {} as Media,
         prev: {} as Media,
         next: {} as Media,
         swipeDir: RIGHT as SwipeDirections,
      };
      const component = render(
         <MediaCarousel state={state} showControls={false} onClick={jest.fn()} onSwipe={jest.fn()} onTransitionEnd={jest.fn()} />
      );
      expect(MediaItem as unknown as jest.Mock).toHaveBeenCalledTimes(3);
      expect(component.queryAllByRole('button')).toHaveLength(0);
   });

   it('should not render the prev if not in props', () => {
      const state = {
         id: 1,
         current: {} as Media,
         next: {} as Media,
         swipeDir: UP as SwipeDirections,
      };
      const component = render(
         <MediaCarousel state={state} showControls={true} onClick={jest.fn()} onSwipe={jest.fn()} onTransitionEnd={jest.fn()} />
      );
      expect(MediaItem as unknown as jest.Mock).toHaveBeenCalledTimes(2);
      expect(component.queryAllByRole('button')).toHaveLength(1);
   });

   it('should not render the next if not in props', () => {
      const state = {
         id: 1,
         current: {} as Media,
         prev: {} as Media,
      };
      const component = render(
         <MediaCarousel state={state} showControls={true} onClick={jest.fn()} onSwipe={jest.fn()} onTransitionEnd={jest.fn()} />
      );
      expect(MediaItem as unknown as jest.Mock).toHaveBeenCalledTimes(2);
      expect(component.queryAllByRole('button')).toHaveLength(1);
   });

   it('should call onSwipe(LEFT) if next button is clicked', () => {
      const state = {
         id: 1,
         current: {} as Media,
         next: {} as Media,
      };
      const onSwipe = jest.fn();
      const component = render(<MediaCarousel state={state} showControls={true} onClick={jest.fn()} onSwipe={onSwipe} onTransitionEnd={jest.fn()} />);
      const btn = component.container.querySelector('button');
      btn?.click();
      expect(onSwipe).toHaveBeenCalledWith(LEFT, true);
   });

   it('should call onSwipe(RIGHT) if prev button is clicked', () => {
      const state = {
         id: 1,
         current: {} as Media,
         prev: {} as Media,
      };
      const onSwipe = jest.fn();
      const component = render(<MediaCarousel state={state} showControls={true} onClick={jest.fn()} onSwipe={onSwipe} onTransitionEnd={jest.fn()} />);
      const btn = component.container.querySelector('button');
      btn?.click();
      expect(onSwipe).toHaveBeenCalledWith(RIGHT, true);
   });
});
