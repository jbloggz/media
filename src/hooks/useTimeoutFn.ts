/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * A react hook for calling a function after a given timeout (in milliseconds)
 */

import { useEffect } from 'react';

const useTimeout = <T>(fn: () => void, ms: number) => {
   useEffect(() => {
      const handler = setTimeout(() => fn(), ms);

      return () => {
         clearTimeout(handler);
      };
   }, [fn, ms]);
};

export default useTimeout;
