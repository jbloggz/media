/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * The route to download an image thumbnail
 */

import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

export const GET = async (request: NextRequest) => {
   const searchParams = request.nextUrl.searchParams;
   const index = +(searchParams.get('index') || 0);

   const imagePath = `public/${(index % 5) + 1}-thumb.jpg`;
   const image = fs.readFileSync(path.resolve(imagePath));

   return new Response(image, {
      status: 200,
      headers: {
         'Content-Type': 'image/jpeg',
         'Cache-Control': 'max-age=86400',
      },
   });
};
