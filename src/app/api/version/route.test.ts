/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for api/version/route.ts
 */

import * as childProcess from 'child_process';
import '@testing-library/jest-dom';
import { GET } from './route';

jest.mock('child_process');

describe('api/version', () => {
   it('should return the version and timestamp', async () => {
      const mockExec = jest.spyOn(childProcess, 'exec');
      mockExec.mockImplementationOnce((_, cback) => (cback as any)(null, '1.2.3', null));
      mockExec.mockImplementationOnce((_, cback) => (cback as any)(null, '2024-04-09T22:37:26+10:00', null));
      const response = await GET();
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
         version: '1.2.3',
         timestamp: 1712666246,
      });
   });

   it('should return an error that occurs', async () => {
      const mockExec = jest.spyOn(childProcess, 'exec');
      mockExec.mockImplementationOnce((_, cback) => (cback as any)('oh no', null, null));
      const response = await GET();
      expect(response.status).toEqual(500);
      expect(response.body).toEqual({
         message: 'exec error: oh no',
      });
   });

   it('should return an error if stderr is written to', async () => {
      const mockExec = jest.spyOn(childProcess, 'exec');
      mockExec.mockImplementationOnce((_, cback) => (cback as any)(null, null, 'bad'));
      const response = await GET();
      expect(response.status).toEqual(500);
      expect(response.body).toEqual({
         message: 'stderr: bad',
      });
   });
});
