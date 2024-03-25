/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for typeGuards.ts
 */

import '@testing-library/jest-dom';
import { isGpsCoord } from './typeGuards';

describe('isGpsCoord', () => {
   it("should return true when passed an object with 'lat' and 'lng' properties of type number", () => {
      const obj = { lat: 1, lng: 2 };
      const result = isGpsCoord(obj);
      expect(result).toBe(true);
   });

   it('should return false when passed an empty object', () => {
      const obj = {};
      const result = isGpsCoord(obj);
      expect(result).toBe(false);
   });

   it('should ignore extra properties', () => {
      const obj = { lat: 1, lng: 2, foo: 'bar' };
      const result = isGpsCoord(obj);
      expect(result).toBe(true);
   });
});
