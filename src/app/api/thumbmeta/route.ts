/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The route to for getting thumbnail metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import moment from 'moment-timezone';
import db, { searchParamsToSQL } from '@/database';

export const GET = async (request: NextRequest) => {
   const searchParams = request.nextUrl.searchParams;
   let [filters, bindings] = searchParamsToSQL(searchParams);

   /* Add the day filter */
   const day = searchParams.get('day');
   if (day) {
      const tzDay = moment.tz(day, process.env['TIMEZONE'] || '');
      const start = tzDay.clone().startOf('day');
      const end = tzDay.clone().endOf('day');
      filters += `${filters !== '' ? ' AND' : ''} timestamp BETWEEN ${start.unix()} AND ${end.unix()}`;
   }

   if (filters === '') {
      return NextResponse.json({ message: 'At least 1 filter must be provided for thumbnail metadata' }, { status: 400 });
   }
   try {
      const result = await db.query(`SELECT id, type, duration FROM media WHERE ${filters} ORDER BY timestamp DESC, id DESC`, bindings);
      return NextResponse.json(result.rows.map((row) => ({ type: row.type, id: +row.id, duration: +row.duration, path: `/api/thumb?id=${row.id}` })));
   } catch (e) {
      return NextResponse.json({ message: 'Cannot find thumbnail metadata' }, { status: 404 });
   }
};
