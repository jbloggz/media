/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A react hook for running filtered API searches
 */

import { useContext } from 'react';
import { SearchContext } from '@/context';
import { isGpsCoord } from '@/typeGuards';
import { useAPI } from '.';

type Params = Record<string, string | number | (string | number)[]>;

interface SearchRequest {
   /* The url to search */
   url: string;

   /* Any extra url parameters to add */
   params?: Params;

   /* Override the context provided filters */
   filter?: SearchFilter;

   /* Disable the query */
   disabled?: boolean;
}

/**
 * Build the query parameters based on the seach filters
 *
 * @param filter  The search filters selected
 *
 * @returns A url query parameter string
 */
const buildQuery = (filter: SearchFilter, params: Params): string => {
   const allParams = { ...params, ...filter };

   const urlParams = new URLSearchParams();
   for (const [key, value] of Object.entries(allParams)) {
      if (isGpsCoord(value)) {
         urlParams.append(key, `${value.lat},${value.lng}`);
      } else if (Array.isArray(value)) {
         for (const opt of value) {
            urlParams.append(key, opt.toString());
         }
      } else {
         urlParams.append(key, value.toString());
      }
   }

   return urlParams.toString();
};

const useSearchAPI = <T>(req: SearchRequest) => {
   const filter = useContext(SearchContext);
   const query = buildQuery(req.filter || filter, req.params || {});
   return useAPI<T>({ disabled: req.disabled, url: `${req.url}?${query}` });
};

export default useSearchAPI;
