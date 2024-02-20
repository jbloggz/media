/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A react hook for calling a function at a given interval (in milliseconds)
 */

import { useEffect } from 'react';

const useIntervalFn = (fn: () => void, ms: number) => {
   useEffect(() => {
      const handler = setInterval(() => fn(), ms);

      return () => {
         clearInterval(handler);
      };
   }, [fn, ms]);
};

export default useIntervalFn;
