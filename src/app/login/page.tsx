/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The login page
 */
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import 'react-toastify/dist/ReactToastify.css';
import { Loader } from '@/components';

const Login = () => {
   const [isLoading, setLoading] = useState(false);
   const urlParams = useSearchParams();
   const error = urlParams.get('error')
      ? {
           message: 'Authentication failed',
        }
      : undefined;

   return (
      <main className="h-screen flex flex-col items-center justify-center">
         <Loader error={error} isLoading={isLoading} showOnError>
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
         </Loader>
      </main>
   );
};

export default Login;
