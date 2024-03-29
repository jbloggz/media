/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A react hook for calling a function after a given timeout (in milliseconds)
 */

import { useEffect } from 'react';

export const useTimeout = (fn: () => void, ms: number) => {
   useEffect(() => {
      const handler = setTimeout(() => fn(), ms);

      return () => {
         clearTimeout(handler);
      };
   }, [fn, ms]);
};
