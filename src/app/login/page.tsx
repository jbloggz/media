/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The google auth login page
 */
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import 'react-toastify/dist/ReactToastify.css';
import { Loader } from '@/components';

const GoogleLogin = () => {
   const [isLoading, setLoading] = useState(false);
   const urlParams = useSearchParams();
   const error = urlParams.get('error')
      ? {
           message: 'Authentication failed',
        }
      : undefined;

   return (
      <main className="h-screen flex justify-center items-center">
         <div className="card bg-neutral-900 rounded-3xl p-5 flex flex-col items-center">
            <Loader error={error} isLoading={isLoading} showOnError>
               <Image className="m-2" src="/favicon-192x192.png" width={64} height={64} alt="media" />
               <button
                  className="btn p-6 m-4 content-center"
                  onClick={() => {
                     setLoading(true);
                     signIn('google');
                  }}
               >
                  <Image alt="Google logo" height="24" width="24" id="provider-logo" src="/googleIcon.svg" />
                  Sign in with Google
               </button>
            </Loader>
         </div>
      </main>
   );
};

export default GoogleLogin;
