/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for api/searchOptions/route.ts
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

describe('api/searchOptions', () => {
   it('should return a valid response for type field', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               field: 'type',
            }),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({ rows: [['foo'], ['bar']] });
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual(['foo', 'bar']);
   });

   it('should return a valid response for make,model field', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               field: 'make,model',
            }),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({ rows: [['foo', 'bar'], ['bar', 'baz']] });
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual(['foo bar', 'bar baz']);
   });

   it('should return a 500 error on database errors', async () => {
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
      expect(response.status).toBe(500);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual(expect.objectContaining({ message: 'Database query failed' }));
   });

   it('should return a 400 error when invalid field', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               field: 'foobar',
            }),
         },
      };

      const response = await GET(request as NextRequest);
      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual(expect.objectContaining({ message: 'Invalid field: foobar' }));
   });

   it('should return a 400 error when field not provided', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams(),
         },
      };

      const response = await GET(request as NextRequest);
      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual(expect.objectContaining({ message: 'Invalid field: ' }));
   });

});
