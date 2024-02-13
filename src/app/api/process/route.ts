/**
 * MIT License
 *
 * Copyright (c) 2024 Josef Barnes
 *
 * The route to manually process a directory
 */

import db from '@/database';
import { NextRequest } from 'next/server';

export const POST = async (request: NextRequest) => {
   let res;
   try {
      res = await request.json();
   } catch (e) {
      return new Response(null, { status: 400, statusText: 'No input found' });
   }

   if (!res.path) {
      return new Response(null, { status: 400, statusText: 'No path specified' });
   }

   try {
      await db.query("SELECT pg_notify('media_processor', $1)", [res.path]);
   } catch (e) {
      return new Response(null, { status: 500, statusText: 'Unable to contact database:' + e });
   }

   return Response.json({ success: true });
};
