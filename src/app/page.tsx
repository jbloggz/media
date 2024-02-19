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

const Home = () => {
   const api = useAPI<MediaBlock[]>({ url: `/api/block` });

   return api.isLoading ? (
      <div className="flex h-screen">
         <div className="m-auto">
            <span className="loading loading-spinner loading-lg"></span>
         </div>
      </div>
   ) : api.data ? (
      <Gallery blocks={api.data} />
   ) : (
      <p>{api.error?.message || 'Unknown error occurred'}</p>
   );
};

export default Home;
