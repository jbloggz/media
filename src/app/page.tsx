/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The home page where all the photos can be browsed
 */
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Gallery, SearchDialog } from '@/components';
import { SearchContext } from '@/context';
import { useSearchAPI } from '@/hooks';

const Home = () => {
   const [filter, setFilter] = useState<SearchFilter>({});
   const api = useSearchAPI<MediaBlock[]>({ url: '/api/block', filter });

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
                  <SearchContext.Provider value={filter}>
                     <Gallery blocks={api.data} />
                  </SearchContext.Provider>
                  <SearchDialog filter={filter} setFilter={setFilter} />
               </>
            )
         )}
      </>
   );
};

export default Home;
