/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A react hook for running filtered API searches
 */

import { useContext } from 'react';
import { useAPI } from '.';
import { SearchContext } from '@/context';

interface SearchRequest {
   /* The url to search */
   url: string;

   /* Any extra url parameters to add */
   params?: URLSearchParams;

   /* Override the context provided filters */
   filter?: SearchFilter;
}

/**
 * Build the query parameters based on the seach filters
 *
 * @param filter  The search filters selected
 *
 * @returns A url query parameter string
 */
const buildQuery = (filter: SearchFilter, extra_params?: URLSearchParams): string => {
   const params = extra_params || new URLSearchParams();

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

const useSearchAPI = <T>(req: SearchRequest) => {
   const filter = useContext(SearchContext);
   const query = buildQuery(req.filter || filter, req.params);
   return useAPI<T>({ url: `${req.url}?${query}` });
};

export default useSearchAPI;
