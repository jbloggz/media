/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The route to get the latest valid GPS coordinates
 */

import db from '@/database';
import { NextResponse } from 'next/server';

export const GET = async () => {
   try {
      const result = await db.query({
         text: `SELECT latitude,longitude FROM media WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY timestamp DESC LIMIT 1`,
      });
      if (result.rows.length === 0) {
         return NextResponse.json({ lat: 0, lng: 0 });
      }
      const row = result.rows[0];
      return NextResponse.json({lat: row.latitude, lng: row.longitude});
   } catch (e) {
      return NextResponse.json({ message: 'Database query failed' }, { status: 500 });
   }
};
