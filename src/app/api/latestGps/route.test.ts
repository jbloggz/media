/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for api/latestGps/route.ts
 */

import '@testing-library/jest-dom';
import db from '@/database';
import { GET } from './route';

jest.mock('../../../database', () => ({
   ...jest.requireActual('../../../database'),
   __esModule: true,
   default: {
      query: jest.fn(),
   },
}));

describe('api/latestGps', () => {
   it('should return a valid response by default', async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [{ latitude: -32, longitude: 123 }] });
      const response = await GET();
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ lat: -32, lng: 123 });
   });

   it('should default to 0,0 if there is no valid data', async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [] });
      const response = await GET();
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ lat: 0, lng: 0 });
   });

   it('should return a 500 error on database errors', async () => {
      (db.query as jest.Mock).mockImplementation(() => {
         throw new Error('failed');
      });

      const response = await GET();
      expect(response.status).toEqual(500);
      expect(response.body).toEqual({ message: 'Database query failed' });
   });
});
