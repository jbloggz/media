/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The login page
 */
'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
   const [isLoading, setLoading] = useState(false);
   const urlParams = useSearchParams();

   useEffect(() => {
      if (urlParams.get('error') && !isLoading) {
         toast.error(urlParams.get('error'));
      }
   }, [urlParams, isLoading]);

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
                     toast.dismiss();
                     setLoading(true);
                     signIn('google');
                  }}
               >
                  <Image alt="Google logo" height="24" width="24" id="provider-logo" src="/googleIcon.svg" />
                  Sign in with Google
               </button>
            </>
         )}
      </main>
   );
};

export default Login;
