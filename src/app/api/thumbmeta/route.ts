/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The route to for getting thumbnail metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import db, { searchParamsToSQL } from '@/database';

export const GET = async (request: NextRequest) => {
   const searchParams = request.nextUrl.searchParams;
   const [filters, bindings] = searchParamsToSQL(searchParams);
   console.log(filters, bindings);
   if (filters === '') {
      return NextResponse.json({ message: 'At least 1 filter must be provided for thumbnail metadata' }, { status: 400 });
   }
   try {
      const result = await db.query(`SELECT id, type, duration FROM media WHERE ${filters} ORDER BY timestamp DESC`, bindings);
      return NextResponse.json(result.rows.map((row) => ({ type: row.type, id: +row.id, duration: +row.duration })));
   } catch (e) {
      return NextResponse.json({ message: 'Cannot find thumbnail metadata' }, { status: 404 });
   }
};
