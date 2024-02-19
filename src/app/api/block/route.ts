/**
 * MIT License
 *
 * Copyright (c) 2024 Josef Barnes
 *
 * The route to download the block info
 */

import db from '@/database';

export const GET = async () => {
   try {
      const result = await db.query('SELECT heading,count,total FROM block ORDER BY id');
      return Response.json(result.rows);
   } catch (e) {
      return new Response(null, { status: 500, statusText: 'Database query failed' });
   }
};
