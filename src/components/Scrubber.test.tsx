/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for Scrubber.tsx
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { Scrubber } from '.';
import { DraggableCore } from 'react-draggable';
import { useThrottleFn } from '../hooks/useThrottleFn';
import { useIntervalFn } from '../hooks/useIntervalFn';

jest.mock('react-draggable', () => ({
   ...jest.requireActual('react-draggable'),
   DraggableCore: jest.fn().mockReturnValue(<div data-testid="DraggableCore"></div>),
}));

jest.mock('../hooks/useThrottleFn', () => ({
   useThrottleFn: jest.fn(),
}));

jest.mock('../hooks/useIntervalFn', () => ({
   useIntervalFn: jest.fn(),
}));

describe('Scrubber', () => {
   beforeAll(() => {
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 1000 });
   });

   it('should handle empty blocks', () => {
      const blocks: MediaBlock[] = [];
      const scrollPosition = 0;
      const currentBlock = 0;
      const onScrub = jest.fn();
      const onScrubStart = jest.fn();
      const onScrubStop = jest.fn();

      const component = render(
         <Scrubber
            blocks={blocks}
            scrollPosition={scrollPosition}
            currentBlock={currentBlock}
            onScrub={onScrub}
            onScrubStart={onScrubStart}
            onScrubStop={onScrubStop}
         />
      );

      expect(component.getByTestId('DraggableCore')).toBeInTheDocument();
   });

   it('should handle a single block', () => {
      const blocks: MediaBlock[] = [{ day: '2024-03-31', count: 10, total: 10 }];
      const scrollPosition = 0;
      const currentBlock = 0;
      const onScrub = jest.fn();
      const onScrubStart = jest.fn();
      const onScrubStop = jest.fn();

      const component = render(
         <Scrubber
            blocks={blocks}
            scrollPosition={scrollPosition}
            currentBlock={currentBlock}
            onScrub={onScrub}
            onScrubStart={onScrubStart}
            onScrubStop={onScrubStop}
         />
      );

      expect(component.getByTestId('DraggableCore')).toBeInTheDocument();
   });

   it('should handle multiple blocks', () => {
      const blocks: MediaBlock[] = [
         { day: '2024-04-17', count: 10, total: 10 },
         { day: '2024-04-15', count: 5, total: 15 },
         { day: '2024-04-12', count: 34, total: 49 },
         { day: '2024-03-31', count: 21, total: 70 },
      ];
      const scrollPosition = 0;
      const currentBlock = 0;
      const onScrub = jest.fn();
      const onScrubStart = jest.fn();
      const onScrubStop = jest.fn();

      const component = render(
         <Scrubber
            blocks={blocks}
            scrollPosition={scrollPosition}
            currentBlock={currentBlock}
            onScrub={onScrub}
            onScrubStart={onScrubStart}
            onScrubStop={onScrubStop}
         />
      );

      expect(component.getByTestId('DraggableCore')).toBeInTheDocument();
   });

   it('should scrub to the nearest node on drag', () => {
      const blocks: MediaBlock[] = [
         { day: '2024-04-17', count: 10, total: 10 },
         { day: '2024-04-15', count: 5, total: 15 },
         { day: '2024-04-12', count: 34, total: 49 },
         { day: '2024-03-31', count: 21, total: 70 },
      ];
      const scrollPosition = 0;
      const currentBlock = 0;
      const onScrub = jest.fn();
      const onScrubStart = jest.fn();
      const onScrubStop = jest.fn();

      const component = render(
         <Scrubber
            blocks={blocks}
            scrollPosition={scrollPosition}
            currentBlock={currentBlock}
            onScrub={onScrub}
            onScrubStart={onScrubStart}
            onScrubStop={onScrubStop}
         />
      );
      expect(component.getByTestId('DraggableCore')).toBeInTheDocument();

      const mockDraggableCalls = (DraggableCore as unknown as jest.Mock).mock.calls;
      const mockDraggable = mockDraggableCalls[mockDraggableCalls.length - 1][0];
      const draggableElem = component.getByTestId('DraggableCore');
      mockDraggable.nodeRef.current = draggableElem;

      act(() => {
         mockDraggable.onDrag(null, { y: 400 });
      });

      expect(onScrub).toHaveBeenCalledTimes(1);
      expect(onScrub).toHaveBeenCalledWith(2);
   });

   it('should be no-op if scrubbed with no nodes defined', () => {
      const blocks: MediaBlock[] = [
         { day: '2024-04-17', count: 10, total: 10 },
         { day: '2024-04-15', count: 5, total: 15 },
         { day: '2024-04-12', count: 34, total: 49 },
         { day: '2024-03-31', count: 21, total: 70 },
      ];
      const scrollPosition = 0;
      const currentBlock = 0;
      const onScrub = jest.fn();
      const onScrubStart = jest.fn();
      const onScrubStop = jest.fn();

      const component = render(
         <Scrubber
            blocks={blocks}
            scrollPosition={scrollPosition}
            currentBlock={currentBlock}
            onScrub={onScrub}
            onScrubStart={onScrubStart}
            onScrubStop={onScrubStop}
         />
      );
      expect(component.getByTestId('DraggableCore')).toBeInTheDocument();

      const mockDraggableCalls = (DraggableCore as unknown as jest.Mock).mock.calls;
      const mockDraggable = mockDraggableCalls[0][0];
      const draggableElem = component.getByTestId('DraggableCore');
      mockDraggable.nodeRef.current = draggableElem;

      act(() => {
         mockDraggable.onDrag(null, { y: 100 });
      });

      expect(onScrub).not.toHaveBeenCalled();
   });

   it('should update slider position if within scrollbar', () => {
      const blocks: MediaBlock[] = [
         { day: '2024-04-17', count: 10, total: 10 },
         { day: '2024-04-15', count: 5, total: 15 },
         { day: '2024-04-12', count: 34, total: 49 },
         { day: '2024-03-31', count: 21, total: 70 },
      ];
      const scrollPosition = 0;
      const currentBlock = 0;
      const onScrub = jest.fn();
      const onScrubStart = jest.fn();
      const onScrubStop = jest.fn();

      const component = render(
         <Scrubber
            blocks={blocks}
            scrollPosition={scrollPosition}
            currentBlock={currentBlock}
            onScrub={onScrub}
            onScrubStart={onScrubStart}
            onScrubStop={onScrubStop}
         />
      );
      expect(component.getByTestId('DraggableCore')).toBeInTheDocument();

      const mockDraggableCalls = (DraggableCore as unknown as jest.Mock).mock.calls;
      const mockDraggable = mockDraggableCalls[mockDraggableCalls.length - 1][0];
      const draggableElem = component.getByTestId('DraggableCore');
      mockDraggable.nodeRef.current = draggableElem;

      act(() => {
         mockDraggable.onDrag(null, { y: 0 });
      });

      expect(onScrub).toHaveBeenCalledTimes(1);
      expect(onScrub).toHaveBeenCalledWith(0);
   });

   it('should scrub to the last node if at the end', () => {
      const blocks: MediaBlock[] = [
         { day: '2024-04-17', count: 10, total: 10 },
         { day: '2024-04-15', count: 5, total: 15 },
         { day: '2024-04-12', count: 34, total: 49 },
         { day: '2024-03-31', count: 21, total: 70 },
      ];
      const scrollPosition = 0;
      const currentBlock = 0;
      const onScrub = jest.fn();
      const onScrubStart = jest.fn();
      const onScrubStop = jest.fn();

      const component = render(
         <Scrubber
            blocks={blocks}
            scrollPosition={scrollPosition}
            currentBlock={currentBlock}
            onScrub={onScrub}
            onScrubStart={onScrubStart}
            onScrubStop={onScrubStop}
         />
      );
      expect(component.getByTestId('DraggableCore')).toBeInTheDocument();

      const mockDraggableCalls = (DraggableCore as unknown as jest.Mock).mock.calls;
      const mockDraggable = mockDraggableCalls[mockDraggableCalls.length - 1][0];
      const draggableElem = component.getByTestId('DraggableCore');
      mockDraggable.nodeRef.current = draggableElem;

      act(() => {
         mockDraggable.onDrag(null, { y: 1000 });
      });

      expect(onScrub).toHaveBeenCalledTimes(1);
      expect(onScrub).toHaveBeenCalledWith(3);
   });

   it('should call onScrubStart/onScrubStop when starting/stopping drag', () => {
      const blocks: MediaBlock[] = [
         { day: '2024-04-17', count: 10, total: 10 },
         { day: '2024-04-15', count: 5, total: 15 },
         { day: '2024-04-12', count: 34, total: 49 },
         { day: '2024-03-31', count: 21, total: 70 },
      ];
      const scrollPosition = 0;
      const currentBlock = 0;
      const onScrub = jest.fn();
      const onScrubStart = jest.fn();
      const onScrubStop = jest.fn();

      const component = render(
         <Scrubber
            blocks={blocks}
            scrollPosition={scrollPosition}
            currentBlock={currentBlock}
            onScrub={onScrub}
            onScrubStart={onScrubStart}
            onScrubStop={onScrubStop}
         />
      );
      expect(component.getByTestId('DraggableCore')).toBeInTheDocument();

      const mockDraggableCalls = (DraggableCore as unknown as jest.Mock).mock.calls;
      const mockDraggable = mockDraggableCalls[mockDraggableCalls.length - 1][0];

      expect(onScrubStart).toHaveBeenCalledTimes(0);
      expect(onScrubStop).toHaveBeenCalledTimes(0);

      act(() => {
         mockDraggable.onStart();
      });

      expect(onScrubStart).toHaveBeenCalledTimes(1);
      expect(onScrubStop).toHaveBeenCalledTimes(0);

      act(() => {
         mockDraggable.onStop();
      });

      expect(onScrubStart).toHaveBeenCalledTimes(1);
      expect(onScrubStop).toHaveBeenCalledTimes(1);
   });

   it('should handle scrubber visibility', () => {
      const blocks: MediaBlock[] = [
         { day: '2024-04-17', count: 10, total: 10 },
         { day: '2024-04-15', count: 5, total: 15 },
         { day: '2024-04-12', count: 34, total: 49 },
         { day: '2024-03-31', count: 21, total: 70 },
      ];
      const scrollPosition = 100;
      const currentBlock = 0;
      const onScrub = jest.fn();
      const onScrubStart = jest.fn();
      const onScrubStop = jest.fn();

      const component = render(
         <Scrubber
            blocks={blocks}
            scrollPosition={scrollPosition}
            currentBlock={currentBlock}
            onScrub={onScrub}
            onScrubStart={onScrubStart}
            onScrubStop={onScrubStop}
         />
      );

      act(() => {
         (useThrottleFn as jest.Mock).mock.calls[0][0]();
      });
      act(() => {
         (useIntervalFn as jest.Mock).mock.calls[2][0]();
      });
      expect(component.container.querySelector('.opacity-60')).toBeInTheDocument();
      act(() => {
         (useIntervalFn as jest.Mock).mock.calls[1][0]();
      });
      expect(component.container.querySelector('.opacity-0')).toBeInTheDocument();

      const mockDraggableCalls = (DraggableCore as unknown as jest.Mock).mock.calls;
      const mockDraggable = mockDraggableCalls[mockDraggableCalls.length - 1][0];
      act(() => {
         mockDraggable.onStart();
      });
      act(() => {
         (useIntervalFn as jest.Mock).mock.calls[3][0]();
      });
      expect(onScrubStart).toHaveBeenCalledTimes(1);
      expect(component.container.querySelector('.opacity-0')).toBeInTheDocument();
   });
});
