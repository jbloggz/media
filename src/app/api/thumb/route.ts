/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * The route to download an image thumbnail
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/database';

export const GET = async (request: NextRequest) => {
   const searchParams = request.nextUrl.searchParams;
   const block = searchParams.get('block') || '';
   const index = +(searchParams.get('index') || 0);

   try {
      const result = await db.query(
         `
         SELECT media.thumbnail
         from media_position
         JOIN block ON block.id = media_position.block
         JOIN media ON media.id = media_position.media
         WHERE block.heading = $1 AND media_position.position = $2
         `,
         [block, index]
      );
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
