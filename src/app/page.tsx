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
import { CheckCircleIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Gallery, Loader, SearchDialog } from '@/components';
import { SearchContext } from '@/context';
import { useNavBarIcons, useSearchAPI, useToggle } from '@/hooks';

const useFetchBlock = (block: MediaBlock) => {
   return useSearchAPI<ThumbMeta[]>({
      url: '/api/thumbmeta',
      params: { day: block.heading || '' },
   });
};

const Home = () => {
   const [filter, setFilter] = useState<SearchFilter>({});
   const api = useSearchAPI<MediaBlock[]>({ url: '/api/block', filter });
   const selectMode = useToggle();
   const showSearch = useToggle();

   useNavBarIcons(
      selectMode.enabled
         ? [
              {
                 elem: <XMarkIcon />,
                 onClick: () => selectMode.hide(),
              },
           ]
         : [
              {
                 elem: <CheckCircleIcon />,
                 onClick: () => selectMode.show(),
              },
              { elem: <MagnifyingGlassIcon />, onClick: () => showSearch.toggle() },
              ...(Object.keys(filter).length > 0 ? [{ elem: <XMarkIcon />, onClick: () => setFilter({}) }] : []),
           ]
   );

   return (
      <Loader {...api}>
         <SearchContext.Provider value={filter}>
            <Gallery blocks={api.data || []} useFetchBlock={useFetchBlock} scrubber selectMode={selectMode.enabled} setSelectedItems={() => {}} />
         </SearchContext.Provider>
         <SearchDialog filter={filter} setFilter={setFilter} open={showSearch.enabled} onClose={showSearch.toggle} />
      </Loader>
   );
};

export default Home;
