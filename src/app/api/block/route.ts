/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The route to download a list of blocks with a given filter
 */

import { NextRequest, NextResponse } from 'next/server';
import db, { searchParamsToSQL } from '@/database';

export const GET = async (request: NextRequest) => {
   const searchParams = request.nextUrl.searchParams;
   const [filters, bindings] = searchParamsToSQL(searchParams);

   try {
      const result = await db.query(
         `
         WITH GroupedData AS (
            SELECT TO_CHAR(TO_TIMESTAMP(timestamp) AT TIME ZONE '${process.env['TIMEZONE']}', 'YYYY-MM-DD') AS heading, COUNT(*) AS count
            FROM media
            ${filters !== '' ? `WHERE ${filters}` : ''}
            GROUP BY heading
         )
         SELECT heading, CAST(count AS INTEGER), CAST(SUM(count) OVER (ORDER BY heading DESC) AS INTEGER) AS total
         FROM GroupedData
         ORDER BY heading DESC
         `,
         bindings
      );

      return NextResponse.json(result.rows);
   } catch (e) {
      return NextResponse.json({ message: 'Database query failed' }, { status: 500 });
   }
};
