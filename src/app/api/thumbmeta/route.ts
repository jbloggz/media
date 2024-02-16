/**
 * MIT License
 *
 * Copyright (c) 2024 Josef Barnes
 *
 * The route to for getting thumbnail metadata
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
         SELECT media.id, media.type, media.duration
         from media_position
         JOIN block ON block.id = media_position.block
         JOIN media ON media.id = media_position.media
         WHERE block.heading = $1 AND media_position.position = $2
         `,
         [block, index]
      );

      const type = result.rows[0].type.toString();
      return Response.json(
         type == 'image'
            ? {
                 type,
                 id: +result.rows[0].id,
              }
            : {
                 type,
                 id: +result.rows[0].id,
                 duration: +result.rows[0].duration,
              }
      );
   } catch (e) {
      return new Response(null, { status: 404, statusText: `Cannot find thumbnail metadata: ${e}` });
   }
};
