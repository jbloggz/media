/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * PostgreSQL database connection pool
 */

import { Pool } from 'pg';

const db = new Pool();

export default db;

/**
 * Convert SearchFilter URL parameters to a SQL filter clause
 *
 * @param params THe search filter parameters
 *
 * @returns The SQL query and the list of binded values
 */
export const searchParamsToSQL = (params: URLSearchParams): [string, string[]] => {
   const filters: string[] = [];
   const bindings: string[] = [];
   let idx = 1;

   const types = params.getAll('type');
   if (types.length > 0) {
      filters.push(`type IN (${types.map(() => `$${idx++}`).join()})`);
      bindings.push(...types);
   }

   const cameras = params.getAll('camera');
   if (cameras.length > 0) {
      filters.push(`(make || ' ' || model) IN (${cameras.map(() => `$${idx++}`).join()})`);
      bindings.push(...cameras);
   }

   const durationMin = params.get('durationMin');
   if (durationMin) {
      filters.push(`duration >= $${idx++}`);
      bindings.push(durationMin);
   }

   const durationMax = params.get('durationMax');
   if (durationMax) {
      filters.push(`duration <= $${idx++}`);
      bindings.push(durationMax);
   }

   const heightMin = params.get('heightMin');
   if (heightMin) {
      filters.push(`height >= $${idx++}`);
      bindings.push(heightMin);
   }

   const heightMax = params.get('heightMax');
   if (heightMax) {
      filters.push(`height <= $${idx++}`);
      bindings.push(heightMax);
   }

   const widthMin = params.get('widthMin');
   if (widthMin) {
      filters.push(`width >= $${idx++}`);
      bindings.push(widthMin);
   }

   const widthMax = params.get('widthMax');
   if (widthMax) {
      filters.push(`width <= $${idx++}`);
      bindings.push(widthMax);
   }

   const sizeMin = params.get('sizeMin');
   if (sizeMin) {
      filters.push(`size >= $${idx++}`);
      bindings.push(sizeMin);
   }

   const sizeMax = params.get('sizeMax');
   if (sizeMax) {
      filters.push(`size <= $${idx++}`);
      bindings.push(sizeMax);
   }

   const gps = params.get('location');
   if (gps) {
      /* Convert the radius from meters to degrees */
      const degreeDiff = +(params.get('radius') || 1) / 111139;
      const [lat, lng] = gps.split(',').map((v) => +v);
      filters.push(`latitude BETWEEN ${lat - degreeDiff} AND ${lat + degreeDiff}`);
      filters.push(`longitude BETWEEN ${lng - degreeDiff} AND ${lng + degreeDiff}`);
   }

   return [filters.join(' AND '), bindings];
};
