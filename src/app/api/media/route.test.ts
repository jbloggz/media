/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for api/media/route.ts
 */

import '@testing-library/jest-dom';
import { NextRequest } from 'next/server';
import db from '@/database';
import { GET } from './route';

jest.mock('../../../database', () => ({
   ...jest.requireActual('../../../database'),
   __esModule: true,
   default: {
      query: jest.fn(),
   },
}));

describe('api/media', () => {
   it('should return a valid response when given filters', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               durationMin: '10',
               durationMax: '20',
               id: '456',
            }),
         },
      };

      const resp = [
         { id: 123, path: '/foo1', timestamp: 3984723 },
         { id: 456, path: '/foo2', timestamp: 3984724 },
         { id: 789, path: '/foo3', timestamp: 3984725 },
      ];
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [{ prev: 123, current: 456, next: 789 }] });
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: resp });
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual({ prev: resp[0], current: resp[1], next: resp[2] });
   });

   it('should return a valid response when not given filters', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({ id: '456' }),
         },
      };

      const resp = [
         { id: 123, path: '/foo1', timestamp: 3984723 },
         { id: 456, path: '/foo2', timestamp: 3984724 },
         { id: 789, path: '/foo3', timestamp: 3984725 },
      ];
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [{ prev: 123, current: 456, next: 789 }] });
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: resp });
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual({ prev: resp[0], current: resp[1], next: resp[2] });
   });

   it('should return a 500 error on database errors', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({ id: '456' }),
         },
      };

      (db.query as jest.Mock).mockImplementation(() => {
         throw new Error('failed');
      });
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(500);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual(expect.objectContaining({ message: expect.anything() }));
   });

   it('should return a 400 error if id not provided', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams(),
         },
      };

      const response = await GET(request as NextRequest);
      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual(expect.objectContaining({ message: 'No id provided' }));
   });

   it('should return a 404 error if id cannot be found', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({ id: '456' }),
         },
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(404);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual(expect.objectContaining({ message: 'Cannot find media' }));
   });
});
