/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * The login page
 */
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

const Login = () => {
   const [isLoading, setLoading] = useState(false);
   const urlParams = useSearchParams();

   return (
      <main className="h-screen flex flex-col items-center justify-center">
         {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
         ) : (
            <>
               <h1 className="text-2xl m-4">Media</h1>
               <button
                  className="btn px-6 py-6 content-center"
                  onClick={() => {
                     setLoading(true);
                     signIn('google');
                  }}
               >
                  <Image alt="Google logo" height="24" width="24" id="provider-logo" src="/googleIcon.svg" />
                  Sign in with Google
               </button>
               {urlParams.get('error') && !isLoading && (
                  <div className="toast toast-center">
                     <div className="alert alert-error block">
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           className="inline stroke-current shrink-0 h-6 w-6 mr-2"
                           fill="none"
                           viewBox="0 0 24 24"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                           />
                        </svg>
                        <span>{urlParams.get('error')}</span>
                     </div>
                  </div>
               )}
            </>
         )}
      </main>
   );
};

export default Login;
