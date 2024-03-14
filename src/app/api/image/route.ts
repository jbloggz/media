/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The route to download an image
 */

import { readFileSync } from 'fs';
import { basename } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import mime from 'mime';
import db from '@/database';

export const GET = async (request: NextRequest) => {
   const searchParams = request.nextUrl.searchParams;
   const id = +(searchParams.get('id') || 0);
   const width = +(searchParams.get('w') || 0);
   const download = !!searchParams.get('download');

   try {
      const result = await db.query('SELECT path FROM media WHERE id = $1', [id]);
      const path = result.rows[0]['path'];
      const type = mime.getType(path);
      if (!type) {
         return NextResponse.json({ message: `Unknown mime type for ${path}` }, { status: 404 });
      }
      let buf = readFileSync(path);
      if (width) {
         buf = await sharp(buf, { failOn: 'none' }).resize(width).withMetadata().toBuffer();
      }

      const headers: HeadersInit = {
         'Content-Type': type,
         'Cache-Control': 'max-age=86400',
      };

      if (download) {
         headers['Content-Disposition'] = `attachment; filename=${basename(path)}`;
      }

      return new NextResponse(buf, { status: 200, headers });
   } catch (e) {
      return NextResponse.json({ message: 'Cannot find thumbnail' + e }, { status: 404 });
   }
};
