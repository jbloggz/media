/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for database.ts
 */

import '@testing-library/jest-dom';
import { searchParamsToSQL } from './database';

describe('searchParamsToSQL', () => {
   it('should generate a valid SQL query and bindings when all parameters are present', () => {
      const params = new URLSearchParams();
      params.set('path', '.*\\.jpg');
      params.set('type', 'type1');
      params.set('camera', 'camera1');
      params.set('durationMin', '10');
      params.set('durationMax', '20');
      params.set('heightMin', '100');
      params.set('heightMax', '200');
      params.set('widthMin', '50');
      params.set('widthMax', '100');
      params.set('sizeMin', '500');
      params.set('sizeMax', '1000');
      params.set('location', '40.7128,-74.0060');
      params.set('radius', '1000');

      const expectedQuery =
         "path ~ $1 AND type IN ($2) AND (make || ' ' || model) IN ($3) AND duration >= $4 AND duration <= $5 AND height >= $6 AND height <= $7 AND width >= $8 AND width <= $9 AND size >= $10 AND size <= $11 AND latitude BETWEEN 40.703802258433136 AND 40.72179774156687 AND longitude BETWEEN -74.01499774156687 AND -73.99700225843313";
      const expectedBindings = ['.*\\.jpg', 'type1', 'camera1', '10', '20', '100', '200', '50', '100', '500', '1000'];

      const [query, bindings] = searchParamsToSQL(params);

      expect(query).toBe(expectedQuery);
      expect(bindings).toEqual(expectedBindings);
   });

   it('should generate a valid SQL query and bindings when only some parameters are present', () => {
      const params = new URLSearchParams();
      params.set('type', 'type1');
      params.set('durationMin', '10');
      params.set('heightMax', '200');
      params.set('sizeMin', '500');
      params.set('location', '40.7128,-74.0060');

      const expectedQuery =
         'type IN ($1) AND duration >= $2 AND height <= $3 AND size >= $4 AND latitude BETWEEN 40.712791002258435 AND 40.71280899774157 AND longitude BETWEEN -74.00600899774156 AND -74.00599100225844';
      const expectedBindings = ['type1', '10', '200', '500'];

      const [query, bindings] = searchParamsToSQL(params);

      expect(query).toBe(expectedQuery);
      expect(bindings).toEqual(expectedBindings);
   });

   it('should generate a valid SQL query and bindings when GPS location is present', () => {
      const params = new URLSearchParams();
      params.set('location', '40.7128,-74.0060');
      params.set('radius', '1000');

      const expectedQuery = 'latitude BETWEEN 40.703802258433136 AND 40.72179774156687 AND longitude BETWEEN -74.01499774156687 AND -73.99700225843313';
      const expectedBindings: string[] = [];

      const [query, bindings] = searchParamsToSQL(params);

      expect(query).toBe(expectedQuery);
      expect(bindings).toEqual(expectedBindings);
   });

   it('should generate a valid SQL query and bindings when only GPS location is present', () => {
      const params = new URLSearchParams();
      params.set('location', '40.7128,-74.0060');

      const expectedQuery = 'latitude BETWEEN 40.712791002258435 AND 40.71280899774157 AND longitude BETWEEN -74.00600899774156 AND -74.00599100225844';
      const expectedBindings: string[] = [];

      const [query, bindings] = searchParamsToSQL(params);

      expect(query).toBe(expectedQuery);
      expect(bindings).toEqual(expectedBindings);
   });

   it('should generate a valid SQL query and bindings when no parameters are present', () => {
      const params = new URLSearchParams();

      const expectedQuery = '';
      const expectedBindings: string[] = [];

      const [query, bindings] = searchParamsToSQL(params);

      expect(query).toBe(expectedQuery);
      expect(bindings).toEqual(expectedBindings);
   });

   it('should handle multiple values for type and camera parameters', () => {
      const params = new URLSearchParams();
      params.append('type', 'type1');
      params.append('type', 'type2');
      params.append('camera', 'camera1');
      params.append('camera', 'camera2');

      const expectedQuery = "type IN ($1,$2) AND (make || ' ' || model) IN ($3,$4)";
      const expectedBindings = ['type1', 'type2', 'camera1', 'camera2'];

      const [query, bindings] = searchParamsToSQL(params);

      expect(query).toBe(expectedQuery);
      expect(bindings).toEqual(expectedBindings);
   });

   it('should handle empty string values for duration, height, width, and size parameters', () => {
      const params = new URLSearchParams();
      params.set('durationMin', '');
      params.set('durationMax', '');
      params.set('heightMin', '');
      params.set('heightMax', '');
      params.set('widthMin', '');
      params.set('widthMax', '');
      params.set('sizeMin', '');
      params.set('sizeMax', '');

      const expectedQuery = '';
      const expectedBindings: string[] = [];

      const [query, bindings] = searchParamsToSQL(params);

      expect(query).toBe(expectedQuery);
      expect(bindings).toEqual(expectedBindings);
   });

   it('should handle negative values for duration, height, width, and size parameters', () => {
      const params = new URLSearchParams();
      params.set('durationMin', '-10');
      params.set('durationMax', '-20');
      params.set('heightMin', '-100');
      params.set('heightMax', '-200');
      params.set('widthMin', '-50');
      params.set('widthMax', '-100');
      params.set('sizeMin', '-500');
      params.set('sizeMax', '-1000');

      const expectedQuery =
         'duration >= $1 AND duration <= $2 AND height >= $3 AND height <= $4 AND width >= $5 AND width <= $6 AND size >= $7 AND size <= $8';
      const expectedBindings = ['-10', '-20', '-100', '-200', '-50', '-100', '-500', '-1000'];

      const [query, bindings] = searchParamsToSQL(params);

      expect(query).toBe(expectedQuery);
      expect(bindings).toEqual(expectedBindings);
   });

   it('should handle non-numeric values for duration, height, width, and size parameters', () => {
      const params = new URLSearchParams();
      params.set('durationMin', 'abc');
      params.set('durationMax', 'def');
      params.set('heightMin', 'ghi');
      params.set('heightMax', 'jkl');
      params.set('widthMin', 'mno');
      params.set('widthMax', 'pqr');
      params.set('sizeMin', 'stu');
      params.set('sizeMax', 'vwx');

      const expectedQuery = '';
      const expectedBindings: string[] = [];

      const [query, bindings] = searchParamsToSQL(params);

      expect(query).toBe(expectedQuery);
      expect(bindings).toEqual(expectedBindings);
   });

   it('should handle non-numeric values for radius parameter', () => {
      const params = new URLSearchParams();
      params.set('location', '40.7128,-74.0060');
      params.set('radius', 'abc');

      const expectedQuery = '';
      const expectedBindings: string[] = [];

      const [query, bindings] = searchParamsToSQL(params);

      expect(query).toBe(expectedQuery);
      expect(bindings).toEqual(expectedBindings);
   });

   it('should handle invalid GPS location parameter', () => {
      const params = new URLSearchParams();
      params.set('location', 'invalid');

      const expectedQuery = '';
      const expectedBindings: string[] = [];

      const [query, bindings] = searchParamsToSQL(params);

      expect(query).toBe(expectedQuery);
      expect(bindings).toEqual(expectedBindings);
   });
});
