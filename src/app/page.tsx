/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * The home page where all the photos can be browsed
 */
'use client';

import { Gallery } from '@/components';
import { useAPI } from '@/hooks';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Home = () => {
   const params = useSearchParams();
   const api = useAPI<MediaBlock[]>({ url: `/api/block?q=${params.get('q') || ''}` });

   useEffect(() => {
      if (api.error) {
         toast.error(api.error?.message || 'Unknown error occurred');
      }
   }, [api.error]);

   return (
      <>
         {api.isLoading ? (
            <div className="flex h-screen">
               <div className="m-auto">
                  <span className="loading loading-spinner loading-lg"></span>
               </div>
            </div>
         ) : (
            api.data && <Gallery blocks={api.data} />
         )}
      </>
   );
};

export default Home;
