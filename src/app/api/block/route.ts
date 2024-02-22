/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The route to download a list of blocks with a given filter
 */

import db from '@/database';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (request: NextRequest) => {
   const searchParams = request.nextUrl.searchParams;
   const query = searchParams.get('q') || '';

   try {
      const result = await db.query(
         `
         WITH GroupedData AS (
            SELECT TO_CHAR(TO_TIMESTAMP(timestamp) AT TIME ZONE '${process.env['TIMEZONE']}', 'YYYY-MM-DD') AS day, COUNT(*) AS count
            FROM media
            ${query !== '' ? 'WHERE ' + query : ''}
            GROUP BY day
         )
         SELECT day, CAST(count AS INTEGER), CAST(SUM(count) OVER (ORDER BY day DESC) AS INTEGER) AS total
         FROM GroupedData
         ORDER BY day DESC
         `
      );

      return NextResponse.json(result.rows);
   } catch (e) {
      return NextResponse.json({ message: 'Database query failed' }, { status: 500 });
   }
};
