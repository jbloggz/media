/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for api/process/route.ts
 */

import '@testing-library/jest-dom';
import { NextRequest } from 'next/server';
import db from '@/database';
import { POST } from './route';

jest.mock('../../../database', () => ({
   ...jest.requireActual('../../../database'),
   __esModule: true,
   default: {
      query: jest.fn(),
   },
}));

describe('api/process', () => {
   it('should return a valid response when given filters', async () => {
      const request = {
         json: async () => ({
            path: 'foo',
         }),
      };

      const response = await POST(request as NextRequest);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual({ success: true });
   });

   it('should return a 500 error on database errors', async () => {
      const request = {
         json: async () => ({
            path: 'foo',
         }),
      };

      (db.query as jest.Mock).mockImplementation(() => {
         throw new Error('failed');
      });
      const response = await POST(request as NextRequest);
      expect(response.status).toBe(500);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual(expect.objectContaining({ message: 'Unable to contact database' }));
   });

   it('should return a 400 error if no input found', async () => {
      const request = {
         json: async () => {
            throw new Error('failed');
            return {};
         },
      };

      const response = await POST(request as NextRequest);
      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual(expect.objectContaining({ message: 'No input found' }));
   });

   it('should return a 400 error if path not provided', async () => {
      const request = {
         json: async () => ({}),
      };

      const response = await POST(request as NextRequest);
      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual(expect.objectContaining({ message: 'No path specified' }));
   });
});
