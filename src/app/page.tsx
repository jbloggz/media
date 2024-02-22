/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The home page where all the photos can be browsed
 */
'use client';

import { Gallery, SearchDialog } from '@/components';
import { useAPI } from '@/hooks';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Home = () => {
   const [query, setQuery] = useState('');
   const api = useAPI<MediaBlock[]>({ url: `/api/block?q=${query}` });

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
            api.data && (
               <>
                  <Gallery blocks={api.data} query={query} />
                  <SearchDialog query={query} setQuery={setQuery} />
               </>
            )
         )}
      </>
   );
};

export default Home;
