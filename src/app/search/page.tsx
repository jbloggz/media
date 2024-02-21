/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The search page
 */
'use client';

import Link from 'next/link';
import { useState } from 'react';

const Search = () => {
   const [query, setQuery] = useState('');

   return (
      <div className="container px-8">
         <h1 className="text-xl pb-4 font-bold">Search</h1>
         <label className="input input-bordered flex items-center gap-2 max-w-xs mb-5">
            <input type="text" className="grow bg-inherit" placeholder="Search" onBlur={(e) => setQuery(e.target.value)} />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70">
               <path
                  fillRule="evenodd"
                  d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                  clipRule="evenodd"
               />
            </svg>
         </label>
         <Link role="button" className="btn btn-neutral" href={`/?q=${query}`}>
            search
         </Link>
      </div>
   );
};

export default Search;
