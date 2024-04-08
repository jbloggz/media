/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Create a ReadableStream from a file
 */

import fs from 'fs';
import { Range } from 'range-parser';

async function* nodeStreamToIterator(stream: fs.ReadStream) {
   for await (const chunk of stream) {
      yield chunk;
   }
}

const iteratorToStream = (iterator: AsyncGenerator<Uint8Array>): ReadableStream => {
   return new ReadableStream({
      async pull(controller) {
         const { value, done } = await iterator.next();

         if (done) {
            controller.close();
         } else {
            controller.enqueue(new Uint8Array(value));
         }
      },
   });
};

export const streamFile = (path: string, range?: Range) => {
   const fsStream = fs.createReadStream(path, range && { ...range });
   return iteratorToStream(nodeStreamToIterator(fsStream));
};
