/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for api/video/route.ts
 */

import { statSync } from 'fs';
import '@testing-library/jest-dom';
import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { ReadableStream } from 'stream/web';
import mime from 'mime';
import db from '@/database';
import { streamFile } from './streamFile';
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
   statSync: jest.fn(),
}));

jest.mock('mime', () => ({
   __esModule: true,
   default: {
      getType: jest.fn(),
   },
}));

jest.mock('./streamFile', () => ({
   streamFile: jest.fn(),
}));

jest.mock('next/headers', () => ({
   headers: jest.fn(),
}));

describe('api/video', () => {
   it('should return a valid reponse when given a valid id parameter', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               id: '123',
            }),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({
         rows: [{ path: '/path/to/foo.jpg' }],
      });
      (mime.getType as jest.Mock).mockReturnValue('video/mp4');
      (statSync as jest.Mock).mockReturnValue({ size: 1234 });
      (headers as jest.Mock).mockReturnValue({ get: () => 'bytes=0-' });
      (streamFile as jest.Mock).mockReturnValue(new ReadableStream());

      const response = await GET(request as NextRequest);
      expect(response.status).toEqual(206);
      expect(response.body).toBeDefined();
      expect(response.headers.get('Content-Type')).toEqual('video/mp4');
      expect(response.headers.get('Content-Range')).toEqual('bytes 0-1233/1234');
      expect(response.headers.get('Accept-Ranges')).toEqual('bytes');
      expect(response.headers.get('Content-Disposition')).toBeNull();
   });

   it('should return a valid reponse when not provided ranges', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               id: '123',
            }),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({
         rows: [{ path: '/path/to/foo.jpg' }],
      });
      (mime.getType as jest.Mock).mockReturnValue('video/mp4');
      (statSync as jest.Mock).mockReturnValue({ size: 1234 });
      (headers as jest.Mock).mockReturnValue({ get: () => null });
      (streamFile as jest.Mock).mockReturnValue(new ReadableStream());

      const response = await GET(request as NextRequest);
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.headers.get('Content-Type')).toEqual('video/mp4');
      expect(response.headers.get('Content-Range')).toBeNull();
      expect(response.headers.get('Accept-Ranges')).toBeNull();
      expect(response.headers.get('Content-Disposition')).toBeNull();
   });

   it('should return a 404 error if the mime type is invalid', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               id: '123',
            }),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({
         rows: [{ path: '/path/to/foo.jpg' }],
      });
      (mime.getType as jest.Mock).mockReturnValue(null);

      const response = await GET(request as NextRequest);
      expect(response.status).toEqual(404);
      expect(response.body).toEqual({ message: 'Unknown mime type for /path/to/foo.jpg' });
   });

   it('should return a 404 error for database errors', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               id: '123',
            }),
         },
      };

      (db.query as jest.Mock).mockImplementation(() => {
         throw new Error('failed');
      });

      const response = await GET(request as NextRequest);
      expect(response.status).toEqual(404);
      expect(response.body).toEqual({ message: 'Cannot find video' });
   });

   it('should set the Content-Disposition header id download parameter is set', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams({
               id: '123',
               download: 'true',
            }),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({
         rows: [{ path: '/path/to/foo.jpg' }],
      });
      (mime.getType as jest.Mock).mockReturnValue('video/mp4');
      (statSync as jest.Mock).mockReturnValue({ size: 1234 });
      (headers as jest.Mock).mockReturnValue({ get: () => 'bytes=0-' });
      (streamFile as jest.Mock).mockReturnValue(new ReadableStream());

      const response = await GET(request as NextRequest);
      expect(response.status).toEqual(206);
      expect(response.body).toBeDefined();
      expect(response.headers.get('Content-Type')).toEqual('video/mp4');
      expect(response.headers.get('Content-Range')).toEqual('bytes 0-1233/1234');
      expect(response.headers.get('Accept-Ranges')).toEqual('bytes');
      expect(response.headers.get('Content-Disposition')).toEqual('attachment; filename=foo.jpg');
   });

   it('should return 400 error for incorrect ranges header', async () => {
      const request = {
         nextUrl: {
            searchParams: new URLSearchParams(),
         },
      };

      (db.query as jest.Mock).mockResolvedValue({
         rows: [{ path: '/path/to/foo.jpg' }],
      });
      (mime.getType as jest.Mock).mockReturnValue('video/mp4');
      (statSync as jest.Mock).mockReturnValue({ size: 1234 });
      (headers as jest.Mock).mockReturnValue({ get: () => 'bytes=dodgy' });
      (streamFile as jest.Mock).mockReturnValue(new ReadableStream());

      const response = await GET(request as NextRequest);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({ message: 'Invalid range header: bytes=dodgy' });
   });
});
