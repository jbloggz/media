/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The home page where all the photos can be browsed
 */
'use client';

import { useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { Gallery, Loader, SearchDialog } from '@/components';
import { SearchContext } from '@/context';
import { useSearchAPI } from '@/hooks';

const Home = () => {
   const [filter, setFilter] = useState<SearchFilter>({});
   const api = useSearchAPI<MediaBlock[]>({ url: '/api/block', filter });

   return (
      <Loader {...api}>
         <SearchContext.Provider value={filter}>
            <Gallery blocks={api.data || []} scrubber />
         </SearchContext.Provider>
         <SearchDialog filter={filter} setFilter={setFilter} />
      </Loader>
   );
};

export default Home;
