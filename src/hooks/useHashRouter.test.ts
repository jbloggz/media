/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for useHashRouter.ts
 */

import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import { useHashRouter } from '.';
import { act } from 'react-dom/test-utils';
import mocks from '@/mocks';

describe('useHashRouter', () => {
   it("should return an object with 'hash', 'push', 'replace', and 'back' properties", () => {
      const { result } = renderHook(() => useHashRouter());

      expect(result.current).toHaveProperty('hash');
      expect(result.current).toHaveProperty('push');
      expect(result.current).toHaveProperty('replace');
      expect(result.current).toHaveProperty('back');
   });

   it("should set 'hash' property to an empty string by default", () => {
      const { result } = renderHook(() => useHashRouter());
      expect(result.current.hash).toBe('');
   });

   it("should set the 'hash' property to the current window location hash", () => {
      window.location.href = 'https://www.example.com#foobar';
      const { result } = renderHook(() => useHashRouter());
      expect(result.current.hash).toBe('foobar');
   });

   it("should update the hash and call the router 'push' when calling 'push' method", () => {
      const router = renderHook(() => useHashRouter());
      const newHash = 'newHash';

      act(() => router.result.current.push(newHash));

      expect(mocks.nextNavigation.router.push).toHaveBeenCalledWith('#newHash');
      expect(router.result.current.hash).toBe(newHash);
   });

   it("should update the hash and call the router 'replace' when calling 'replace' method", () => {
      const router = renderHook(() => useHashRouter());
      const newHash = 'qwerty';

      act(() => router.result.current.replace(newHash));

      expect(mocks.nextNavigation.router.replace).toHaveBeenCalledWith('#qwerty');
      expect(router.result.current.hash).toBe(newHash);
   });

   it("should call the router 'back' when calling 'back' method", () => {
      const router = renderHook(() => useHashRouter());
      act(() => router.result.current.back());

      expect(mocks.nextNavigation.router.back).toHaveBeenCalled();
   });

   it("should call the 'onChange' callback when the hash changes", () => {
      const onChange = jest.fn();
      renderHook(() => useHashRouter(onChange));
      const newHash = 'bar';

      act(() => {
         window.location.href = `https://www.example.com/foo#${newHash}`;
         window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      expect(onChange).toHaveBeenCalledWith(newHash);
   });

   it("should update the 'hash' state and call the 'onChange' callback only if the new hash is different from the current hash when calling 'hashChangeHandler' callback", () => {
      window.location.href = `https://www.example.com#hello`;
      const onChange = jest.fn();
      const router = renderHook(() => useHashRouter(onChange));

      act(() => {
         window.location.href = `https://www.example.com/foo#hello`;
         window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      expect(router.result.current.hash).toBe('hello');
      expect(onChange).not.toHaveBeenCalled();
   });
});
