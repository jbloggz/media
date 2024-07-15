/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for useToggleFn.ts
 */

import '@testing-library/jest-dom';
import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { useToggle } from '.';

describe('useToggle', () => {
   it('should default to off', () => {
      const state = renderHook(() => useToggle());
      expect(state.result.current.enabled).toEqual(false);
   });

   it('should use initial state', () => {
      const state = renderHook(() => useToggle(false));
      expect(state.result.current.enabled).toEqual(false);
      const state2 = renderHook(() => useToggle(true));
      expect(state2.result.current.enabled).toEqual(true);
   });

   it('should be able to be disabled', () => {
      const state = renderHook(() => useToggle(true));
      act(() => {
         state.result.current.hide();
      });
      expect(state.result.current.enabled).toEqual(false);
   });

   it('should be able to be enabled', () => {
      const state = renderHook(() => useToggle(false));
      act(() => {
         state.result.current.show();
      });
      expect(state.result.current.enabled).toEqual(true);
   });

   it('should be able to be toggled', () => {
      const state = renderHook(() => useToggle(false));
      act(() => {
         state.result.current.toggle();
      });
      expect(state.result.current.enabled).toEqual(true);
      act(() => {
         state.result.current.toggle();
      });
      expect(state.result.current.enabled).toEqual(false);
   });
});
