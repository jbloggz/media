/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * The route to download an image thumbnail
 */

import { NextRequest } from 'next/server';
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
      return new Response(image, {
         status: 200,
         headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'max-age=86400',
         },
      });
   } catch (e) {
      return new Response(null, { status: 404, statusText: `Cannot find thumbnail: ${e}` });
   }
};
