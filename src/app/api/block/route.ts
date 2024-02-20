/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The route to download the block info
 */

import db from '@/database';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (request: NextRequest) => {
   const searchParams = request.nextUrl.searchParams;
   const query = searchParams.get('q') || '';

   if (query === '') {
      /* No query provided, so get all blocks */
      try {
         const result = await db.query('SELECT heading,count,total FROM block ORDER BY id');
         return NextResponse.json(result.rows);
      } catch (e) {
         return NextResponse.json({ message: 'Database query failed' }, { status: 500 });
      }
   } else {
      return NextResponse.json({ message: 'Not Implemented' }, { status: 400 });
   }
};
