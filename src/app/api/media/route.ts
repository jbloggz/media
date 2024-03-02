/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The route to download the metadata for a media entry
 */

import { NextRequest, NextResponse } from 'next/server';
import db, { searchParamsToSQL } from '@/database';

export const GET = async (request: NextRequest) => {
   const searchParams = request.nextUrl.searchParams;
   const [filters, bindings] = searchParamsToSQL(searchParams);

   /* Get the ID parameter */
   const id = searchParams.get('id');
   if (!id) {
      return NextResponse.json({ message: 'No id provided' }, { status: 400 });
   }

   const query = `
      WITH data AS (
         SELECT id, path, type, timestamp, size, width, height, duration, latitude, longitude, make, model,
         LEAD(id) OVER (ORDER BY timestamp DESC, id DESC) AS "prevId",
         LAG(id) OVER (ORDER BY timestamp DESC, id DESC) AS "nextId"
         FROM media
         ${filters !== '' ? `WHERE ${filters}` : ''}
      )
      SELECT * FROM data WHERE id = ${+id}
   `;

   try {
      const result = await db.query(query, bindings);

      if (result.rows.length === 0) {
         return NextResponse.json({ message: 'Cannot find media' }, { status: 404 });
      }

      return NextResponse.json(result.rows[0]);
   } catch (e) {
      return NextResponse.json({ message: 'Database query failed' }, { status: 500 });
   }
};
