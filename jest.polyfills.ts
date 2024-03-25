/**
 * The block below contains polyfills for Node.js globals
 * required for Jest to function when running JSDOM tests.
 * These HAVE to be require's and HAVE to be in this exact
 * order.
 */

import { TextDecoder, TextEncoder } from 'util';

Object.defineProperties(globalThis, {
   TextDecoder: { value: TextDecoder },
   TextEncoder: { value: TextEncoder },
});
