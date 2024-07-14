/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for api/thumbmeta/route.ts
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

describe('api/thumbmeta', () => {
   it('should return a valid response when given filters', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               durationMin: '10',
               durationMax: '20',
               heading: '2024-04-05',
            }),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({
         rows: [
            { type: 'image', id: '213', duration: null },
            { type: 'video', id: '423', duration: '2352' },
         ],
      });
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual([
         { type: 'image', id: 213, duration: 0 },
         { type: 'video', id: 423, duration: 2352 },
      ]);
   });

   it('should return a valid response when heading not provided', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               durationMin: '10',
               durationMax: '20',
            }),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({
         rows: [
            { type: 'image', id: '213', duration: null },
            { type: 'video', id: '423', duration: '2352' },
         ],
      });
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual([
         { type: 'image', id: 213, duration: 0 },
         { type: 'video', id: 423, duration: 2352 },
      ]);
   });

   it('should return a valid response when only heading provided', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               heading: '2023-12-12',
            }),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({
         rows: [
            { type: 'image', id: '213', duration: null },
            { type: 'video', id: '423', duration: '2352' },
         ],
      });
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual([
         { type: 'image', id: 213, duration: 0 },
         { type: 'video', id: 423, duration: 2352 },
      ]);
   });

   it('should return 400 error when no parameters provided', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams(),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({
         rows: [
            { type: 'image', id: '213', duration: null },
            { type: 'video', id: '423', duration: '2352' },
         ],
      });
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual({ message: 'At least 1 filter must be provided for thumbnail metadata' });
   });

   it('should return a 404 error on database errors', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               durationMin: '10',
               durationMax: '20',
            }),
         },
      };

      (db.query as jest.Mock).mockImplementation(() => {
         throw new Error('failed');
      });
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(404);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual({ message: 'Cannot find thumbnail metadata' });
   });
});
