/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A loader centred in the page
 */
'use client';

import { PropsWithChildren, useEffect } from 'react';
import { toast } from 'react-toastify';

interface GenericError {
   message?: string;
}

interface LoaderProps<T> {
   isLoading?: boolean;
   error?: GenericError;
   size?: 'xs' | 'sm' | 'md' | 'lg';
   showOnError?: boolean;
}

export const Loader = <T extends object>(props: PropsWithChildren<LoaderProps<T>>) => {
   useEffect(() => {
      if (props.error && props.error.message) {
         toast.error(props.error.message);
      }
   }, [props.error]);

   const size = props.size || 'lg';
   const loadingSizes = {
      xs: 'loading-xs',
      sm: 'loading-sm',
      md: 'loading-md',
      lg: 'loading-lg',
   };

   return props.isLoading || typeof props.isLoading === 'undefined' ? (
      <div className="flex h-screen">
         <div className="m-auto">
            <span className={`loading loading-spinner ${loadingSizes[size]}`}></span>
         </div>
      </div>
   ) : props.error && props.error.message && !props.showOnError ? null : (
      props.children
   );
};
