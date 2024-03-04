/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The Gallery Search Dialog
 */
'use client';

import { useReducer, useRef, useState } from 'react';
import { Select } from '@/components';
import { useAPI } from '@/hooks';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchDialogProps {
   filter: SearchFilter;
   setFilter: (f: SearchFilter) => void;
}

const searchReducer = (current: SearchFilter, filter: SearchFilter | null): SearchFilter => {
   return filter
      ? {
           ...current,
           ...filter,
        }
      : {};
};

const SearchDialog = (props: SearchDialogProps) => {
   const dialogRef = useRef<HTMLDialogElement>(null);
   const [activeTab, setActiveTab] = useState('media');
   const [filter, dispatchFilter] = useReducer(searchReducer, props.filter);

   const typeQuery = useAPI<string[]>({ url: '/api/searchOptions?field=type' });
   const camerQuery = useAPI<string[]>({ url: '/api/searchOptions?field=make,model' });
   const typeOptions: SelectOption[] = typeQuery.data ? typeQuery.data.map((v) => ({ label: v, value: v })) : [];
   const cameraOptions: SelectOption[] = camerQuery.data ? camerQuery.data.map((v) => ({ label: v, value: v })) : [];

   const submit = () => {
      props.setFilter(filter);
      dialogRef.current && dialogRef.current.close();
   };

   const cancel = () => {
      /* Reset back the previous search filter */
      dispatchFilter(props.filter);
      dialogRef.current && dialogRef.current.close();
   };

   const show = () => {
      /* Show the modal, but make sure no inputs are focussed */
      if (dialogRef.current) {
         dialogRef.current.showModal();
         dialogRef.current.querySelectorAll('input').forEach((elem) => elem.blur());
      }
   };

   const reset = () => {
      /* Clear the filter */
      dispatchFilter(null);
      props.setFilter({});
   };

   return (
      <div className="fixed top-3 right-16">
         <button className="btn btn-circle opacity-70 hover:opacity-100" onClick={show}>
            <MagnifyingGlassIcon className="w-6 h-6" />
         </button>
         {Object.keys(props.filter).length > 0 && (
            <button className="btn btn-circle opacity-70 hover:opacity-100" onClick={reset}>
               <XMarkIcon className="h-6 w-6" />
            </button>
         )}
         <dialog ref={dialogRef} className="modal">
            <div className="modal-box flex flex-col w-full h-full max-h-full max-w-full md:max-w-2xl md:max-h-[750px]">
               <div className="container space-y-5">
                  <h1 className="text-xl font-bold">Search</h1>

                  <div role="tablist" className="tabs tabs-lifted">
                     <a role="tab" className={`tab ${activeTab == 'media' ? 'tab-active' : ''}`} onClick={() => setActiveTab('media')}>
                        Media
                     </a>
                     <a role="tab" className={`tab ${activeTab == 'file' ? 'tab-active' : ''}`} onClick={() => setActiveTab('file')}>
                        File
                     </a>
                     <a role="tab" className={`tab ${activeTab == 'location' ? 'tab-active' : ''}`} onClick={() => setActiveTab('location')}>
                        Location
                     </a>
                     <a role="tab" className={`tab ${activeTab == 'people' ? 'tab-active' : ''}`} onClick={() => setActiveTab('people')}>
                        People
                     </a>
                  </div>

                  <div className={`${activeTab === 'media' ? 'block' : 'hidden'}`}>
                     <div className="form-control w-full max-w-xs">
                        <div className="label">
                           <span className="label-text">Media Type</span>
                        </div>
                        <Select
                           name="type"
                           placeholder="Select..."
                           isMulti
                           options={typeOptions}
                           value={typeOptions.filter((v) => filter.type?.includes(v.value))}
                           onChange={(v: readonly SelectOption[]) => dispatchFilter({ type: v.map((opt) => opt.value) })}
                        />
                     </div>

                     <label className="form-control w-full">
                        <div className="label">
                           <span className="label-text">Video Duration (seconds)</span>
                        </div>
                        <div className="flex w-full">
                           <input
                              name="durationMin"
                              type="number"
                              value={filter.durationMin || ''}
                              onChange={(e) => dispatchFilter({ durationMin: +e.target.value })}
                              min={0}
                              placeholder="min"
                              className="input input-bordered max-w-32"
                           />
                           <span className="mx-2 my-auto">to</span>
                           <input
                              name="durationMax"
                              type="number"
                              value={filter.durationMax || ''}
                              onChange={(e) => dispatchFilter({ durationMax: +e.target.value })}
                              min={0}
                              placeholder="max"
                              className="input input-bordered max-w-32"
                           />
                        </div>
                     </label>

                     <div className="form-control w-full max-w-xs">
                        <div className="label">
                           <span className="label-text">Camera (make/model)</span>
                        </div>
                        <Select
                           name="camera"
                           placeholder="Select..."
                           isMulti
                           options={cameraOptions}
                           value={cameraOptions.filter((v) => filter.camera?.includes(v.value))}
                           onChange={(v: readonly SelectOption[]) => dispatchFilter({ camera: v.map((opt) => opt.value) })}
                        />
                     </div>
                  </div>

                  <div className={`${activeTab === 'file' ? 'block' : 'hidden'}`}>
                     <label className="form-control w-full">
                        <div className="label">
                           <span className="label-text">Height (pixels)</span>
                        </div>
                        <div className="flex w-full">
                           <input
                              name="heightMin"
                              type="number"
                              value={filter.heightMin || ''}
                              onChange={(e) => dispatchFilter({ heightMin: +e.target.value })}
                              placeholder="min"
                              className="input input-bordered max-w-32"
                           />
                           <span className="mx-2 my-auto">to</span>
                           <input
                              name="heightMax"
                              type="number"
                              value={filter.heightMax || ''}
                              onChange={(e) => dispatchFilter({ heightMax: +e.target.value })}
                              placeholder="max"
                              className="input input-bordered max-w-32"
                           />
                        </div>
                     </label>

                     <label className="form-control w-full">
                        <div className="label">
                           <span className="label-text">Width (pixels)</span>
                        </div>
                        <div className="flex w-full">
                           <input
                              name="widthMin"
                              type="number"
                              value={filter.widthMin || ''}
                              onChange={(e) => dispatchFilter({ widthMin: +e.target.value })}
                              placeholder="min"
                              className="input input-bordered max-w-32"
                           />
                           <span className="mx-2 my-auto">to</span>
                           <input
                              name="widthMax"
                              type="number"
                              value={filter.widthMax || ''}
                              onChange={(e) => dispatchFilter({ widthMax: +e.target.value })}
                              placeholder="max"
                              className="input input-bordered max-w-32"
                           />
                        </div>
                     </label>

                     <label className="form-control w-full">
                        <div className="label">
                           <span className="label-text">File Size (bytes)</span>
                        </div>
                        <div className="flex w-full">
                           <input
                              name="sizeMin"
                              type="number"
                              value={filter.sizeMin || ''}
                              onChange={(e) => dispatchFilter({ sizeMin: +e.target.value })}
                              placeholder="min"
                              className="input input-bordered max-w-32"
                           />
                           <span className="mx-2 my-auto">to</span>
                           <input
                              name="SizeMax"
                              type="number"
                              value={filter.sizeMax || ''}
                              onChange={(e) => dispatchFilter({ sizeMax: +e.target.value })}
                              placeholder="max"
                              className="input input-bordered max-w-32"
                           />
                        </div>
                     </label>
                  </div>

                  <div className={`${activeTab === 'location' ? 'block' : 'hidden'}`}>
                     <label className="form-control w-full max-w-xs">
                        <div className="label">
                           <span className="label-text">GPS Location (degrees)</span>
                        </div>
                        <input
                           name="location"
                           type="text"
                           value={filter.location || ''}
                           onChange={(e) => dispatchFilter({ location: e.target.value })}
                           placeholder="latitude,longitude"
                           className="input input-bordered"
                        />
                     </label>

                     <label className="form-control w-full max-w-xs">
                        <div className="label">
                           <span className="label-text">Radius (km)</span>
                        </div>
                        <input
                           name="radius"
                           type="number"
                           value={filter.radius || ''}
                           onChange={(e) => dispatchFilter({ radius: +e.target.value })}
                           placeholder="1"
                           className="input input-bordered w-24"
                        />
                     </label>
                  </div>

                  <div className={`${activeTab === 'people' ? 'block' : 'hidden'}`}>
                     <p>Coming soon!</p>
                  </div>
               </div>

               <div className="modal-action mt-auto">
                  <button className="btn" onClick={submit}>
                     Search
                  </button>
                  <button className="btn ml-4" onClick={cancel}>
                     Cancel
                  </button>
               </div>
            </div>
         </dialog>
      </div>
   );
};

export default SearchDialog;
