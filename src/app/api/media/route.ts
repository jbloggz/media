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

   const idQuery = `
      WITH data AS (
         SELECT id As current, LAG(id) OVER (ORDER BY timestamp DESC, id DESC) AS prev, LEAD(id) OVER (ORDER BY timestamp DESC, id DESC) AS next
         FROM media
         ${filters !== '' ? `WHERE ${filters}` : ''}
      )
      SELECT * FROM data WHERE current = ${+id}
   `;

   const dataQuery = `
      SELECT id, path, type, timestamp, size, width, height, duration, latitude, longitude, make, model
      FROM media
      WHERE id IN ($1, $2, $3)
   `;

   try {
      const ids = (await db.query(idQuery, bindings)).rows[0];
      if (!ids) {
         return NextResponse.json({ message: 'Cannot find media' }, { status: 404 });
      }

      const media = (await db.query(dataQuery, [ids.prev, ids.current, ids.next])).rows.reduce((acc, obj) => {
         acc[obj.id === ids.prev ? 'prev' : obj.id === ids.current ? 'current' : 'next'] = obj;
         return acc;
      }, {});

      return NextResponse.json(media, {
         headers: {
            'Cache-Control': 'max-age=86400',
         },
      });
   } catch (e) {
      return NextResponse.json({ message: 'Database query failed' + e }, { status: 500 });
   }
};
