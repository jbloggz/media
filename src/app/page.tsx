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

/**
 * Build the query parameters based on the seach filters
 *
 * @param filter  The search filters selected
 *
 * @returns A url query parameter string
 */
const buildQuery = (filter: SearchFilter): string => {
   const params = new URLSearchParams();

   for (const [key, value] of Object.entries(filter)) {
      if (Array.isArray(value)) {
         for (const opt of value) {
            params.append(key, opt.toString());
         }
      } else {
         params.append(key, value.toString());
      }
   }

   return params.toString();
};

const Home = () => {
   const [filter, setFilter] = useState<SearchFilter>({});
   const query = buildQuery(filter);
   const api = useAPI<MediaBlock[]>({ url: `/api/block?${query}` });

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
                  <SearchDialog filter={filter} setFilter={setFilter} />
               </>
            )
         )}
      </>
   );
};

export default Home;
