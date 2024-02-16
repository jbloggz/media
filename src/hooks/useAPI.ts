/**
 * MIT License
 *
 * Copyright (c) 2024 Josef Barnes
 *
 * A react hook for calling the API using useSWR
 */

import useSWR from 'swr';

export interface APIRequest<T> {
   url: string;
   method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
   headers?: { [key: string]: string };
   body?: string;
   disabled?: boolean;
   validate?: (data: unknown) => data is T;
}

/* An Error object returned when the code is not 2XX */
export class APIError extends Error {
   code: number;

   constructor(errmsg: string, code: number) {
      super(errmsg);
      this.name = 'APIError';
      this.code = code;
   }
}

const fetcher = async <T>(req: APIRequest<T>) => {
   let headers = req.headers;
   if (req.method !== 'GET') {
      headers = { 'Content-Type': 'application/json' };
   }

   const resp = await fetch(req.url, { method: req.method || 'GET', headers: headers, body: req.body });
   const code = resp.status;
   let data;
   try {
      data = await resp.json();
   } catch {
      throw new APIError('Invalid API response', 500);
   }
   if (!resp.ok) {
      throw new APIError(data.statusText, code);
   }
   if (req.validate && !req.validate(data)) {
      throw new APIError('Response validation failed', code);
   }
   if (code >= 400) {
      throw new APIError(resp.statusText, code);
   }
   return data as T;
};

const useAPI = <T>(req: APIRequest<T>) => {
   return useSWR<T, APIError>(req.disabled ? null : [req], ([r]) => fetcher(r));
};

export default useAPI;
