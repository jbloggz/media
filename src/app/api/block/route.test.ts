/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for api/block/route.ts
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

describe('api/block', () => {
   it('should return a valid response when given filters', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               durationMin: '10',
               durationMax: '20',
            }),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({ rows: [1, 2, 3] });
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual([1, 2, 3]);
   });

   it('should return a valid response when not given filters', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams(),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({ rows: [4, 5, 6] });
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual([4, 5, 6]);
   });

   it('should return a 500 error on database errors', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams(),
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
});
