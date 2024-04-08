/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The route to download/stream a video
 */

import fs from 'fs';
import { basename } from 'path';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import parseRange from 'range-parser';
import mime from 'mime';
import db from '@/database';
import { streamFile } from './streamFile';

export const GET = async (request: NextRequest) => {
   const searchParams = request.nextUrl.searchParams;
   const id = +(searchParams.get('id') || 0);
   const download = !!searchParams.get('download');
   const headersList = headers();

   try {
      const result = await db.query('SELECT path FROM media WHERE id = $1', [id]);
      const path = result.rows[0]['path'];
      const type = mime.getType(path);
      if (!type) {
         return NextResponse.json({ message: `Unknown mime type for ${path}` }, { status: 404 });
      }

      const stat = fs.statSync(path);
      const fileSize = stat.size;
      const rangeHeader = headersList.get('Range');

      let range;
      if (rangeHeader && rangeHeader.startsWith('bytes=')) {
         const ranges = parseRange(fileSize, rangeHeader);
         if (ranges === -1 || ranges === -2 || ranges.type !== 'bytes' || ranges.length !== 1) {
            return NextResponse.json({ message: `Invalid range header: ${rangeHeader}` }, { status: 400 });
         }
         range = ranges[0];
      }

      const stream = streamFile(path, range);

      const headers: HeadersInit = {
         'Content-Type': type,
      };

      if (range) {
         headers['Content-Range'] = `bytes ${range.start}-${range.end}/${fileSize}`;
         headers['Accept-Ranges'] = 'bytes';
      }

      if (download) {
         headers['Content-Disposition'] = `attachment; filename=${basename(path)}`;
      }

      return new NextResponse(stream, { status: range ? 206 : 200, headers });
   } catch (e) {
      return NextResponse.json({ message: 'Cannot find video' }, { status: 404 });
   }
};
