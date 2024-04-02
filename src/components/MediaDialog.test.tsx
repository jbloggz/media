/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for MediaDialog.tsx
 */

import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import { fireEvent, render } from '@testing-library/react';
import { MediaDialog } from '.';
import * as useSearchAPI from '../hooks/useSearchAPI';
import { MediaCarousel } from './MediaCarousel';
import { useSwipeable } from 'react-swipeable';

/* Mock out dependencies */
jest.mock('../hooks/useSearchAPI');
const mockUseSeachAPI = jest.spyOn(useSearchAPI, 'useSearchAPI');
jest.mock('./MediaCarousel', () => ({
   MediaCarousel: jest.fn().mockReturnValue(<div data-testid="MediaCarousel"></div>),
}));
jest.mock('./MediaInformation', () => ({
   MediaInformation: jest.fn().mockReturnValue(<div data-testid="MediaInformation"></div>),
}));
jest.mock('react-swipeable', () => ({
   ...jest.requireActual('react-swipeable'),
   useSwipeable: jest.fn(),
}));

describe('MediaDialog', () => {
   it('should render a MediaCarousel by default', () => {
      mockUseSeachAPI.mockReturnValue({ isLoading: false, data: { current: { id: 123 } }, error: undefined, mutate: jest.fn(), isValidating: false });
      const component = render(<MediaDialog id={123} onClose={jest.fn()} onChange={jest.fn()} />);
      expect(component.getByTestId('MediaCarousel')).toBeInTheDocument();
      expect(component.queryByTestId('MediaInformation')).not.toBeInTheDocument();
   });

   it('should render a MediaInformation when the info button is clicked', () => {
      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: { current: { id: 123 }, next: { id: 54 } },
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      const component = render(<MediaDialog id={123} onClose={jest.fn()} onChange={jest.fn()} />);

      /* Simulate a click on the carousel to show the controls */
      act(() => {
         (MediaCarousel as jest.Mock).mock.calls[0][0].onClick();
      });

      /* Simulate a click on the info button to show the MediaInformation */
      const infoButton = component.getAllByRole('button', { hidden: true })[0];
      act(() => {
         infoButton.click();
      });

      expect(component.getByTestId('MediaInformation')).toBeInTheDocument();
      expect(component.queryByTestId('MediaCarousel')).not.toBeInTheDocument();
   });

   it('should toggle the controls when the mouse enters/leaves', () => {
      const mockOnClose = jest.fn();
      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: { current: { id: 123 }, prev: { id: 234 } },
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      const component = render(<MediaDialog id={123} onClose={mockOnClose} onChange={jest.fn()} />);
      const dialog = component.getByRole('dialog');

      act(() => {
         fireEvent.mouseEnter(dialog);
      });

      const closeButton = component.getAllByRole('button', { hidden: true })[1];
      expect(closeButton).toBeInTheDocument();

      act(() => {
         fireEvent.mouseLeave(dialog);
      });

      expect(closeButton).not.toBeInTheDocument();
   });

   it('should call onclose function when close button is clicked', () => {
      const mockOnClose = jest.fn();
      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: { current: { id: 123 }, prev: { id: 234 } },
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      const component = render(<MediaDialog id={123} onClose={mockOnClose} onChange={jest.fn()} />);

      /* Simulate a click on the carousel to show the controls */
      act(() => {
         (MediaCarousel as jest.Mock).mock.calls[0][0].onClick();
      });

      const closeButton = component.getAllByRole('button', { hidden: true })[1];
      expect(mockOnClose).toHaveBeenCalledTimes(0);
      act(() => {
         closeButton.click();
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
   });

   it('should go to previous media when swiping right', () => {
      const mockOnClose = jest.fn();
      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: { id: 123, current: { id: 123 }, prev: { id: 234 }, next: { id: 456 } },
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      render(<MediaDialog id={123} onClose={mockOnClose} onChange={jest.fn()} />);

      /* Simulate a swipe right */
      act(() => {
         (MediaCarousel as jest.Mock).mock.lastCall[0].onSwipe('Right');
      });
      act(() => {
         (MediaCarousel as jest.Mock).mock.lastCall[0].onTransitionEnd();
      });

      expect(mockUseSeachAPI.mock.lastCall?.[0]).toEqual(expect.objectContaining({ params: { id: 234 } }));
   });

   it('should go to next media when swiping left', () => {
      const mockOnClose = jest.fn();
      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: { id: 123, current: { id: 123 }, prev: { id: 234 }, next: { id: 456 } },
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      render(<MediaDialog id={123} onClose={mockOnClose} onChange={jest.fn()} />);

      /* Simulate a swipe left */
      act(() => {
         (MediaCarousel as jest.Mock).mock.lastCall[0].onSwipe('Left');
      });
      act(() => {
         (MediaCarousel as jest.Mock).mock.lastCall[0].onTransitionEnd();
      });

      expect(mockUseSeachAPI.mock.lastCall?.[0]).toEqual(expect.objectContaining({ params: { id: 456 } }));
   });

   it('should go to next media when react-swipeable swipes left', () => {
      const mockOnClose = jest.fn();
      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: { id: 123, current: { id: 123 }, prev: { id: 234 }, next: { id: 456 } },
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      render(<MediaDialog id={123} onClose={mockOnClose} onChange={jest.fn()} />);

      const onSwiped = (useSwipeable as jest.Mock).mock.lastCall?.[0].onSwiped;
      /* Simulate a swipe left */
      act(() => {
         onSwiped({ dir: 'Left' });
      });
      act(() => {
         (MediaCarousel as jest.Mock).mock.lastCall[0].onTransitionEnd();
      });

      expect(mockUseSeachAPI.mock.lastCall?.[0]).toEqual(expect.objectContaining({ params: { id: 456 } }));
   });

   it('should go to prev media when react-swipeable swipes right', () => {
      const mockOnClose = jest.fn();
      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: { id: 123, current: { id: 123 }, prev: { id: 234 }, next: { id: 456 } },
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      render(<MediaDialog id={123} onClose={mockOnClose} onChange={jest.fn()} />);

      const onSwiped = (useSwipeable as jest.Mock).mock.lastCall?.[0].onSwiped;
      /* Simulate a swipe left */
      act(() => {
         onSwiped({ dir: 'Right' });
      });
      act(() => {
         (MediaCarousel as jest.Mock).mock.lastCall[0].onTransitionEnd();
      });

      expect(mockUseSeachAPI.mock.lastCall?.[0]).toEqual(expect.objectContaining({ params: { id: 234 } }));
   });

   it('should show the MediaInformation react-swipeable swipes up', () => {
      const mockOnClose = jest.fn();
      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: { id: 123, current: { id: 123 }, prev: { id: 234 }, next: { id: 456 } },
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      const component = render(<MediaDialog id={123} onClose={mockOnClose} onChange={jest.fn()} />);

      const onSwiped = (useSwipeable as jest.Mock).mock.lastCall?.[0].onSwiped;
      /* Simulate a swipe left */
      act(() => {
         onSwiped({ dir: 'Up' });
      });
      act(() => {
         (MediaCarousel as jest.Mock).mock.lastCall[0].onTransitionEnd();
      });

      expect(component.getByTestId('MediaInformation')).toBeInTheDocument();
      expect(component.queryByTestId('MediaCarousel')).not.toBeInTheDocument();
   });

   it('should call the onClose react-swipeable swipes down', () => {
      const mockOnClose = jest.fn();
      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: { id: 123, current: { id: 123 }, prev: { id: 234 }, next: { id: 456 } },
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      render(<MediaDialog id={123} onClose={mockOnClose} onChange={jest.fn()} />);

      const onSwiped = (useSwipeable as jest.Mock).mock.lastCall?.[0].onSwiped;
      /* Simulate a swipe left */
      act(() => {
         onSwiped({ dir: 'Down' });
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
   });

   it('should do nothing when swiping left if there is no next media', () => {
      const mockOnClose = jest.fn();
      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: { id: 123, current: { id: 123 }, prev: { id: 234 } },
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      render(<MediaDialog id={123} onClose={mockOnClose} onChange={jest.fn()} />);

      /* Simulate a swipe left */
      act(() => {
         (MediaCarousel as jest.Mock).mock.lastCall[0].onSwipe('Left');
      });
      act(() => {
         (MediaCarousel as jest.Mock).mock.lastCall[0].onTransitionEnd();
      });

      expect(mockUseSeachAPI.mock.lastCall?.[0]).toEqual(expect.objectContaining({ params: { id: 123 } }));
   });

   it('should do nothing when swiping right if there is no prev media', () => {
      const mockOnClose = jest.fn();
      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: { id: 123, current: { id: 123 }, next: { id: 234 } },
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      render(<MediaDialog id={123} onClose={mockOnClose} onChange={jest.fn()} />);

      /* Simulate a swipe left */
      act(() => {
         (MediaCarousel as jest.Mock).mock.lastCall[0].onSwipe('Right');
      });
      act(() => {
         (MediaCarousel as jest.Mock).mock.lastCall[0].onTransitionEnd();
      });

      expect(mockUseSeachAPI.mock.lastCall?.[0]).toEqual(expect.objectContaining({ params: { id: 123 } }));
   });

   it('should show the MediaInformation when swiping up', () => {
      const mockOnClose = jest.fn();
      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: { id: 123, current: { id: 123 }, prev: { id: 234 }, next: { id: 456 } },
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      const component = render(<MediaDialog id={123} onClose={mockOnClose} onChange={jest.fn()} />);

      /* Simulate a swipe up */
      act(() => {
         (MediaCarousel as jest.Mock).mock.lastCall[0].onSwipe('Up');
      });
      act(() => {
         (MediaCarousel as jest.Mock).mock.lastCall[0].onTransitionEnd();
      });

      expect(component.getByTestId('MediaInformation')).toBeInTheDocument();
      expect(component.queryByTestId('MediaCarousel')).not.toBeInTheDocument();
   });

   it('should go to previous media when pressing left arrow', () => {
      const mockOnClose = jest.fn();
      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: { id: 123, current: { id: 123 }, prev: { id: 234 }, next: { id: 456 } },
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      const component = render(<MediaDialog id={123} onClose={mockOnClose} onChange={jest.fn()} />);

      /* Simulate an left arrow press */
      act(() => {
         fireEvent.keyDown(component.container, { key: 'ArrowLeft', code: 'ArrowLeft' });
      });
      act(() => {
         (MediaCarousel as jest.Mock).mock.lastCall[0].onTransitionEnd();
      });

      expect(mockUseSeachAPI.mock.lastCall?.[0]).toEqual(expect.objectContaining({ params: { id: 234 } }));
   });

   it('should go to next media when pressing right arrow', () => {
      const mockOnClose = jest.fn();
      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: { id: 123, current: { id: 123 }, prev: { id: 234 }, next: { id: 456 } },
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      const component = render(<MediaDialog id={123} onClose={mockOnClose} onChange={jest.fn()} />);

      /* Simulate a right arrow press */
      act(() => {
         fireEvent.keyDown(component.container, { key: 'ArrowRight', code: 'ArrowRight' });
      });
      act(() => {
         (MediaCarousel as jest.Mock).mock.lastCall[0].onTransitionEnd();
      });

      expect(mockUseSeachAPI.mock.lastCall?.[0]).toEqual(expect.objectContaining({ params: { id: 456 } }));
   });

   it('should call onclose function when escape button is pressed', () => {
      const mockOnClose = jest.fn();
      mockUseSeachAPI.mockReturnValue({
         isLoading: false,
         data: { current: { id: 123 }, prev: { id: 234 } },
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      const component = render(<MediaDialog id={123} onClose={mockOnClose} onChange={jest.fn()} />);

      /* Simulate an escape button press */
      act(() => {
         fireEvent.keyDown(component.container, { key: 'Escape', code: 'escape' });
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
   });
});
