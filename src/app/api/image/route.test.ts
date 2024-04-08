/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for api/image/route.ts
 */

import { readFileSync } from 'fs';
import '@testing-library/jest-dom';
import { NextRequest } from 'next/server';
import mime from 'mime';
import db from '@/database';
import { GET } from './route';

jest.mock('../../../database', () => ({
   ...jest.requireActual('../../../database'),
   __esModule: true,
   default: {
      query: jest.fn(),
   },
}));

jest.mock('fs', () => ({
   ...jest.requireActual('fs'),
   readFileSync: jest.fn(),
}));

jest.mock('mime', () => ({
   __esModule: true,
   default: {
      getType: jest.fn(),
   },
}));

jest.mock('sharp', () => ({
   ...jest.requireActual('sharp'),
   __esModule: true,
   default: jest.fn().mockImplementation(() => ({
      resize: jest.fn().mockReturnThis(),
      withMetadata: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockReturnThis(),
   })),
}));

describe('api/image', () => {
   it('should return a valid image with valid search parameters', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               id: '123',
               w: '432',
            }),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({ rows: [1, 2, 3] });
      (readFileSync as jest.Mock).mockReturnValue('file_data');
      (mime.getType as jest.Mock).mockReturnValue('image/jpeg');

      const response = await GET(request as NextRequest);
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.headers.get('Content-Type')).toEqual('image/jpeg');
      expect(response.headers.get('Cache-Control')).toEqual('max-age=86400');
      expect(response.headers.get('Content-Disposition')).toEqual(null);
   });

   it('should allow download of a image', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               id: '123',
               width: '432',
               download: 'true',
            }),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({ rows: [{path: '/path/to/foo.jpg'}] });
      (readFileSync as jest.Mock).mockReturnValue('file_data');
      (mime.getType as jest.Mock).mockReturnValue('image/jpeg');

      const response = await GET(request as NextRequest);
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.headers.get('Content-Type')).toEqual('image/jpeg');
      expect(response.headers.get('Cache-Control')).toEqual('max-age=86400');
      expect(response.headers.get('Content-Disposition')).toEqual(`attachment; filename=foo.jpg`);
   });

   it('should return a 404 error for a bad mime type', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               width: '432',
            }),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({ rows: [{path: '/path/to/foo.pdf'}] });
      (readFileSync as jest.Mock).mockReturnValue('file_data');
      (mime.getType as jest.Mock).mockReturnValue(null);

      const response = await GET(request as NextRequest);
      expect(response.status).toEqual(404);
      expect(response.body).toBeDefined();
   });

   it('should return a 404 error on database errors', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               id: '123',
               width: '432',
            }),
         },
      };

      (db.query as jest.Mock).mockImplementation(() => {
         throw new Error('failed');
      });
      (readFileSync as jest.Mock).mockReturnValue('file_data');
      (mime.getType as jest.Mock).mockReturnValue(null);

      const response = await GET(request as NextRequest);
      expect(response.status).toEqual(404);
      expect(response.body).toBeDefined();
   });
});
