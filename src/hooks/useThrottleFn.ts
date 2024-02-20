/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A react hook for calling a function when state changes at a throttled rate
 */

import { useEffect, useRef } from 'react';

const useThrottleFn = <T>(fn: (v: T) => void, msRate: number, state: T) => {
   const lastRan = useRef(Date.now());

   useEffect(() => {
      const handler = setTimeout(() => {
         if (Date.now() - lastRan.current >= msRate) {
            fn(state);
            lastRan.current = Date.now();
         }
      }, msRate - (Date.now() - lastRan.current));

      return () => {
         clearTimeout(handler);
      };
   }, [fn, msRate, state]);
};

export default useThrottleFn;
