/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The route to for getting thumbnail metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import moment from 'moment-timezone';
import db from '@/database';

export const GET = async (request: NextRequest) => {
   const searchParams = request.nextUrl.searchParams;
   const query = searchParams.get('q') || '';
   const day = searchParams.get('day') || '';
   const tzDay = moment.tz(day, process.env['TIMEZONE'] || '');
   const start = tzDay.clone().startOf('day');
   const end = tzDay.clone().endOf('day');
   try {
      const result = await db.query(
         `
         SELECT id, type, duration
         FROM media
         ${query === '' ? '' : `WHERE ${query}`}
         ${query === '' ? 'WHERE ' : 'AND '} timestamp BETWEEN $1 AND $2
         ORDER BY timestamp DESC
         `,
         [start.unix(), end.unix()]
      );

      return NextResponse.json(result.rows.map((row) => ({ type: row.type, id: +row.id, duration: +row.duration })));
   } catch (e) {
      return NextResponse.json({ message: 'Cannot find thumbnail metadata' }, { status: 404 });
   }
};
