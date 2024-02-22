/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The Gallery Search Dialog
 */
'use client';

import { useRef, useState } from 'react';

interface SearchDialogProps {
   query: string;
   setQuery: (query: string) => void;
}

const SearchDialog = (props: SearchDialogProps) => {
   const [query, setQuery] = useState(props.query);
   const dialogRef = useRef<HTMLDialogElement>(null);

   const reset = () => {
      props.setQuery('');
      setQuery('');
   };

   return (
      <div className="fixed top-3 right-16">
         <button className="btn btn-circle opacity-70 hover:opacity-100" onClick={() => dialogRef.current && dialogRef.current.showModal()}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current">
               <path
                  d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
               />
            </svg>
         </button>
         {query && (
            <button className="btn btn-circle opacity-70 hover:opacity-100" onClick={reset}>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
         )}
         <dialog ref={dialogRef} className="modal">
            <div className="modal-box">
               <div className="container px-8">
                  <h1 className="text-xl pb-4 font-bold">Search</h1>
                  <label className="input input-bordered flex items-center gap-2 max-w-xs mb-5">
                     <input type="text" className="grow bg-inherit" placeholder="Search" onChange={(e) => setQuery(e.target.value)} value={query} />
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70">
                        <path
                           fillRule="evenodd"
                           d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                           clipRule="evenodd"
                        />
                     </svg>
                  </label>
               </div>
               <div className="modal-action">
                  <form method="dialog">
                     <button className="btn" onClick={() => props.setQuery(query)}>
                        Search
                     </button>
                     <button className="btn">Cancel</button>
                  </form>
               </div>
            </div>
         </dialog>
      </div>
   );
};

export default SearchDialog;
