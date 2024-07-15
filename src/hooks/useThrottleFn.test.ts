/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for useThrottleFn.ts
 */

import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import { useThrottleFn } from '.';
import { act } from 'react';
import { useState } from 'react';

describe('useThrottleFn', () => {
   // The function should execute the provided function with the provided state after the specified time has passed.
   it('should execute the provided function with the provided state after the specified time has passed', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const msRate = 1000;
      const state = 'test state';

      renderHook(() => useThrottleFn(fn, msRate, state));

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(msRate);

      expect(fn).toHaveBeenCalledWith(state);
   });

   it('should execute the provided function only once per interva, even if the state changes multiple times', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const msRate = 1000;

      const state = renderHook(()=> useState('test1'));
      const throttle = renderHook(()=> useThrottleFn(fn, msRate, state.result.current[0]));

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(msRate);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('test1');

      act(() => state.result.current[1]('test2'))
      throttle.rerender();
      act(() => state.result.current[1]('test3'))
      jest.advanceTimersByTime(msRate / 2);
      throttle.rerender();
      act(() => state.result.current[1]('test4'))
      throttle.rerender();
      jest.advanceTimersByTime(msRate);

      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith('test4');
   });
});
