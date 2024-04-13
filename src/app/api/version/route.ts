/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The route to get the app version
 */

import { exec } from 'child_process';
import { NextResponse } from 'next/server';

const execPromise = (command: string): Promise<string> => {
   return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
         if (error) {
            reject(`exec error: ${error}`);
            return;
         }
         if (stderr) {
            reject(`stderr: ${stderr}`);
            return;
         }
         resolve(stdout);
      });
   });
};

export const GET = async () => {
   try {
      const version = (await execPromise('git describe --tags --dirty --broken')).trim();
      const date = (await execPromise('git show --no-patch --format=%cI')).trim();
      const dt = new Date(date);
      return NextResponse.json({ version, timestamp: Math.round(dt.getTime() / 1000) });
   } catch (e) {
      return NextResponse.json({ message: e }, { status: 500 });
   }
};
