/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A react hook that acts as a hash router
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const useHashRouter = (onChange?: (v: string) => void) => {
   const router = useRouter();
   const [hash, setHash] = useState<string>(() => (typeof window !== 'undefined' ? window.location.hash.slice(1) : ''));

   const hashChangeHandler = useCallback(() => {
      const newHash = window.location.hash.slice(1);
      if (hash !== newHash) {
         setHash(newHash);
         onChange && onChange(newHash);
      }
   }, [hash, onChange]);

   useEffect(() => {
      window.addEventListener('hashchange', hashChangeHandler);
      return () => {
         window.removeEventListener('hashchange', hashChangeHandler);
      };
   }, [hashChangeHandler]);

   const push = useCallback(
      (val: string) => {
         setHash(val);
         router.push(`#${val}`);
      },
      [router]
   );

   const replace = useCallback(
      (val: string) => {
         setHash(val);
         router.replace(`#${val}`);
      },
      [router]
   );

   const back = useCallback(() => {
      router.back();
   }, [router]);

   return { hash, push, replace, back };
};
