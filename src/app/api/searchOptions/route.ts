/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The route to get valid search options
 */

import db from '@/database';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (request: NextRequest) => {
   const searchParams = request.nextUrl.searchParams;
   const field = searchParams.get('field') || '';
   if (!['type', 'make,model'].includes(field)) {
      return NextResponse.json({ message: `Invalid field: ${field}` }, { status: 400 });
   }
   try {
      const result = await db.query({ text: `SELECT DISTINCT ${field} AS option FROM media`, rowMode: 'array' });
      return NextResponse.json(result.rows.map((v) => v.join(' ')));
   } catch (e) {
      return NextResponse.json({ message: 'Database query failed' }, { status: 500 });
   }
};
