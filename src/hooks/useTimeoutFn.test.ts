/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for useTimeoutFn.ts
 */

import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import { useTimeout } from '.';

describe('useTimeoutFn', () => {

   // The function should execute the provided callback function after the specified timeout.
   it('should execute callback function after specified timeout', () => {
     jest.useFakeTimers();
     const callback = jest.fn();
     renderHook(() => useTimeout(callback, 1000));
     jest.advanceTimersByTime(1000);
     expect(callback).toHaveBeenCalled();
     jest.useRealTimers();
   });

    it('should only execute callback function once, even on rerenders', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const hook = renderHook(() => useTimeout(callback, 1000));
      hook.rerender();
      hook.rerender();
      hook.rerender();
      jest.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
     });});
