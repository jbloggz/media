/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for useIntervalFn.ts
 */

import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import { useIntervalFn } from '.';

describe('UseIntervalFn', () => {
   it('should execute the provided function every specified interval', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const ms = 1000;

      renderHook(() => useIntervalFn(fn, ms));

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(ms);
      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(ms);
      expect(fn).toHaveBeenCalledTimes(2);

      jest.clearAllTimers();
   });
});
