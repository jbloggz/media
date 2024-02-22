/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The route to download an image thumbnail
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/database';

export const GET = async (request: NextRequest) => {
   const searchParams = request.nextUrl.searchParams;
   const id = +(searchParams.get('id') || 0);

   try {
      const result = await db.query('SELECT thumbnail FROM media WHERE id = $1', [id]);
      const image = result.rows[0]['thumbnail'];
      return new NextResponse(image, {
         status: 200,
         headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'max-age=86400',
         },
      });
   } catch (e) {
      return NextResponse.json({ message: 'Cannot find thumbnail' }, { status: 404 });
   }
};
