/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for useAPI.ts
 */

import '@testing-library/jest-dom';
import { renderHook, waitFor } from '@testing-library/react';
import { APIRequest, useAPI } from '.';

const runUseAPI = async <T>(req: APIRequest<T>) => {
   let resp: ReturnType<typeof useAPI<T>> | undefined;
   await waitFor(() => {
      const { result } = renderHook(() => useAPI<T>(req));
      expect(result.current.isLoading).toBeFalsy();
      resp = result.current;
   });

   if (!resp) {
      throw Error('Request failed to run');
   }
   return resp;
};

interface ExampleData {
   access_token: string;
}

describe('useAPI', () => {
   it('should return data when API request is successful', async () => {
      const req: APIRequest<ExampleData> = {
         url: 'https://example.com/api1',
         method: 'GET',
      };

      fetchMock.mockResponse(JSON.stringify({ access_token: '12345' }));
      const resp = await runUseAPI(req);
      expect(resp.data?.access_token).toEqual('12345');
      expect(resp.error).toBeUndefined();
      expect(resp.isLoading).toBe(false);
   });

   it('can successfully post data', async () => {
      const req: APIRequest<ExampleData> = {
         url: 'https://example.com/api2',
         method: 'POST',
         body: '{"foo": "bar"}',
      };

      fetchMock.mockResponse(JSON.stringify({ access_token: '12345' }));
      const resp = await runUseAPI(req);
      expect(resp.data?.access_token).toEqual('12345');
      expect(resp.error).toBeUndefined();
      expect(resp.isLoading).toBe(false);
   });

   it('data should be undefnied when API request is disabled', async () => {
      const req: APIRequest<ExampleData> = {
         url: 'https://example.com/api3',
         method: 'GET',
         disabled: true,
      };

      fetchMock.mockResponse(JSON.stringify({ access_token: '6789' }));
      const resp = await runUseAPI(req);
      expect(resp.data).toBeUndefined();
      expect(resp.error).toBeUndefined();
      expect(resp.isLoading).toBe(false);
   });

   it('should return error when API request fails', async () => {
      const req: APIRequest<ExampleData> = {
         url: 'https://example.com/api4',
         method: 'GET',
      };

      fetchMock.mockResponse(JSON.stringify({}), { status: 500, statusText: 'Internal server error' });
      const resp = await runUseAPI(req);
      expect(resp.data).toBeUndefined();
      expect(resp.error).toBeDefined();
      expect(resp.isLoading).toBe(false);
   });

   it('should return error when API response is not valid JSON', async () => {
      const req: APIRequest<ExampleData> = {
         url: 'https://example.com/api5',
         method: 'GET',
      };

      fetchMock.mockResponse('Invalid JSON', { status: 200 });
      const resp = await runUseAPI(req);
      expect(resp.data).toBeUndefined();
      expect(resp.error).toBeDefined();
      expect(resp.isLoading).toBe(false);
   });

   it('should return error when API request fails with 400 status code', async () => {
      const req: APIRequest<ExampleData> = {
         url: 'https://example.com/api6',
         method: 'GET',
      };

      fetchMock.mockResponse(JSON.stringify({}), { status: 400, statusText: 'Tsk Tsk' });
      const resp = await runUseAPI(req);
      expect(resp.data).toBeUndefined();
      expect(resp.error?.message).toEqual('Tsk Tsk');
      expect(resp.isLoading).toBe(false);
   });

   it('on error, returns message if available', async () => {
      const req: APIRequest<ExampleData> = {
         url: 'https://example.com/api7',
         method: 'GET',
      };

      fetchMock.mockResponse(JSON.stringify({ message: 'oh no' }), { status: 500, statusText: 'Internal server error' });
      const resp = await runUseAPI(req);
      expect(resp.data).toBeUndefined();
      expect(resp.error?.message).toEqual('oh no');
      expect(resp.isLoading).toBe(false);
   });

   it('should default to GET when no method provided', async () => {
      const req: APIRequest<ExampleData> = {
         url: 'https://example.com/api8',
      };

      fetchMock.mockResponse(async (req: Request) => {
         if (req.method === 'GET') {
            return JSON.stringify({ access_token: 'qwerty' });
         } else {
            return JSON.stringify({
               status: 404,
               body: 'Not Found',
            });
         }
      });
      const resp = await runUseAPI(req);
      expect(resp.data?.access_token).toEqual('qwerty');
      expect(resp.error).toBeUndefined();
      expect(resp.isLoading).toBe(false);
   });
});
