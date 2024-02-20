/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The route to manually process a directory
 */

import db from '@/database';
import { NextRequest, NextResponse } from 'next/server';

export const POST = async (request: NextRequest) => {
   let res;
   try {
      res = await request.json();
   } catch (e) {
      return NextResponse.json({ message: 'No input found' }, { status: 400 });
   }

   if (!res.path) {
      return NextResponse.json({ message: 'No path specified' }, { status: 400 });
   }

   try {
      await db.query("SELECT pg_notify('media_processor', $1)", [res.path]);
   } catch (e) {
      return NextResponse.json({ message: 'Unable to contact database' }, { status: 500 });
   }

   return NextResponse.json({ success: true });
};
