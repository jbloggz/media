/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for api/thumb/route.ts
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

describe('api/thumb', () => {
   it('should return a valid response for valid id', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               id: '123',
            }),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({ rows: [{ thumbnail: 'abc' }] });
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.headers.get('Content-Type')).toEqual('image/jpeg');
      expect(response.headers.get('Cache-Control')).toEqual('max-age=86400');
   });

   it('should return a 404 error on database errors', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               field: 'make,model',
            }),
         },
      };

      (db.query as jest.Mock).mockImplementation(() => {
         throw new Error('failed');
      });
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(404);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual({ message: 'Cannot find thumbnail' });
   });
});
