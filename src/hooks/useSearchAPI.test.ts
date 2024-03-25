/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for useSearchAPI.ts
 */

import '@testing-library/jest-dom';
import { renderHook, waitFor } from '@testing-library/react';
import { SearchRequest, useSearchAPI } from '.';
import React from 'react';

const runUseSearchAPI = async (req: SearchRequest) => {
   let resp: ReturnType<typeof useSearchAPI> | undefined;
   await waitFor(() => {
      const { result } = renderHook(() => useSearchAPI(req));
      expect(result.current.isLoading).toBeFalsy();
      resp = result.current;
   });

   if (!resp) {
      throw Error('Request failed to run');
   }
   return resp;
};

describe('useSearchAPI', () => {
   it('should search with no URL parameters is there are no params and an empty context', () => {
      const req: SearchRequest = {
         url: 'https://example.com',
      };

      jest.spyOn(React, 'useContext').mockImplementation(() => ({}));
      runUseSearchAPI(req);
      expect(fetchMock).toHaveBeenCalledWith('https://example.com', { method: 'GET', headers: { 'Content-Type': 'application/json' } });
   });

   it('should use the Search filters from the context by default', () => {
      const req: SearchRequest = {
         url: 'https://example.com',
      };

      jest.spyOn(React, 'useContext').mockImplementation(() => ({
         durationMin: 123,
         camera: ['test', 'foo'],
      }));
      runUseSearchAPI(req);
      expect(fetchMock).toHaveBeenCalledWith('https://example.com?durationMin=123&camera=test&camera=foo', {
         method: 'GET',
         headers: { 'Content-Type': 'application/json' },
      });
   });

   it('should use the params from the request if provided', () => {
      const req: SearchRequest = {
         url: 'https://example.com',
         params: { foo: 'bar', list: [1, 2, 3] },
      };

      jest.spyOn(React, 'useContext').mockImplementation(() => ({
         durationMin: 123,
         camera: ['test', 'foo'],
      }));
      runUseSearchAPI(req);
      expect(fetchMock).toHaveBeenCalledWith('https://example.com?foo=bar&list=1&list=2&list=3&durationMin=123&camera=test&camera=foo', {
         method: 'GET',
         headers: { 'Content-Type': 'application/json' },
      });
   });

   it('should use the filters from the request instead of the context if provided', () => {
      const req: SearchRequest = {
         url: 'https://example.com',
         params: { foo: 'bar', list: [1, 2, 3] },
         filter: { location: { lat: 123.45, lng: -87.43 } },
      };

      jest.spyOn(React, 'useContext').mockImplementation(() => ({
         durationMin: 123,
         camera: ['test', 'foo'],
      }));
      runUseSearchAPI(req);
      expect(fetchMock).toHaveBeenCalledWith('https://example.com?foo=bar&list=1&list=2&list=3&location=123.45%2C-87.43', {
         method: 'GET',
         headers: { 'Content-Type': 'application/json' },
      });
   });
});
