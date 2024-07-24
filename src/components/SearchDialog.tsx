/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The Gallery Search Dialog
 */
'use client';

import { useCallback, useEffect, useReducer, useState } from 'react';
import { useAPI } from '@/hooks';
import { Map, MapCircle, Select } from '@/components';

interface SearchDialogProps {
   filter: SearchFilter;
   setFilter: (f: SearchFilter) => void;
   open?: boolean;
   onClose: () => void;
}

interface SearchReducerAction {
   action: 'set' | 'update';
   filter: SearchFilter;
}

const searchReducer = (current: SearchFilter, value: SearchReducerAction): SearchFilter => {
   const newFilter =
      value.action === 'set'
         ? value.filter
         : {
              ...current,
              ...value.filter,
           };

   /* Remove any undefined values */
   return Object.fromEntries(Object.entries(newFilter).filter(([_, value]) => value !== undefined));
};

export const SearchDialog = (props: SearchDialogProps) => {
   const [activeTab, setActiveTab] = useState('general');
   const [filter, dispatchFilter] = useReducer(searchReducer, props.filter);

   const typeQuery = useAPI<string[]>({ url: '/api/searchOptions?field=type' });
   const cameraQuery = useAPI<string[]>({ url: '/api/searchOptions?field=make,model' });
   const latestCoords = useAPI<GpsCoord>({ url: '/api/latestGps' });
   const typeOptions: SelectOption[] = typeQuery.data ? typeQuery.data.map((v) => ({ label: v, value: v })) : [];
   const cameraOptions: SelectOption[] = cameraQuery.data ? cameraQuery.data.map((v) => ({ label: v, value: v })) : [];

   const submit = useCallback(() => {
      props.setFilter(filter);
      props.onClose();
   }, [props, filter]);

   const cancel = useCallback(() => {
      /* Reset back the previous search filter */
      dispatchFilter({ action: 'set', filter: props.filter });
      props.onClose();
   }, [props]);

   /* Clear the filter if the filter prop is reset */
   useEffect(() => {
      if (Object.keys(props.filter).length == 0 && props.open) {
         dispatchFilter({ action: 'set', filter: {} });
      }
   }, [props.filter, props.open]);

   /* Bind keyboard to actions */
   useEffect(() => {
      if (!props.open) {
         return;
      }
      const handleKeyPress = (event: KeyboardEvent) => {
         if (event.key === 'Escape') {
            cancel();
         }
      };

      document.addEventListener('keydown', handleKeyPress);

      return () => {
         document.removeEventListener('keydown', handleKeyPress);
      };
   }, [cancel, props.open]);

   return (
      <dialog className="modal" open={props.open}>
         <div className="modal-box flex flex-col w-full h-full max-h-full max-w-full md:max-w-2xl md:max-h-[750px]">
            <div className="container space-y-5 h-full flex flex-col">
               <h1 className="text-xl font-bold">Search</h1>

               <div role="tablist" className="tabs tabs-lifted">
                  <a role="tab" className={`tab ${activeTab == 'general' ? 'tab-active' : ''}`} onClick={() => setActiveTab('general')}>
                     General
                  </a>
                  <a role="tab" className={`tab ${activeTab == 'size' ? 'tab-active' : ''}`} onClick={() => setActiveTab('size')}>
                     Size
                  </a>
                  {latestCoords.data && (
                     <a role="tab" className={`tab ${activeTab == 'map' ? 'tab-active' : ''}`} onClick={() => setActiveTab('map')}>
                        Map
                     </a>
                  )}
                  <a role="tab" className={`tab ${activeTab == 'tags' ? 'tab-active' : ''}`} onClick={() => setActiveTab('tags')}>
                     Tags
                  </a>
               </div>

               <div className={`${activeTab === 'general' ? 'block' : 'hidden'} flex-grow`}>
                  <label className="form-control w-full">
                     <div className="label">
                        <span className="label-text">Path</span>
                     </div>
                     <div className="flex w-full">
                        <input
                           name="path"
                           type="text"
                           value={filter.path || ''}
                           onChange={(e) => dispatchFilter({ action: 'update', filter: { path: e.target.value } })}
                           placeholder="Regular expression"
                           className="input input-bordered max-w-xs"
                        />
                     </div>
                  </label>

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
                        onChange={(v: readonly SelectOption[]) => dispatchFilter({ action: 'update', filter: { type: v.map((opt) => opt.value) } })}
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
                           onChange={(e) => dispatchFilter({ action: 'update', filter: { durationMin: +e.target.value } })}
                           min={0}
                           placeholder="min"
                           className="input input-bordered max-w-32"
                        />
                        <span className="mx-2 my-auto">to</span>
                        <input
                           name="durationMax"
                           type="number"
                           value={filter.durationMax || ''}
                           onChange={(e) => dispatchFilter({ action: 'update', filter: { durationMax: +e.target.value } })}
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
                        onChange={(v: readonly SelectOption[]) => dispatchFilter({ action: 'update', filter: { camera: v.map((opt) => opt.value) } })}
                     />
                  </div>
               </div>

               <div className={`${activeTab === 'size' ? 'block' : 'hidden'} flex-grow`}>
                  <label className="form-control w-full">
                     <div className="label">
                        <span className="label-text">Height (pixels)</span>
                     </div>
                     <div className="flex w-full">
                        <input
                           name="heightMin"
                           type="number"
                           value={filter.heightMin || ''}
                           onChange={(e) => dispatchFilter({ action: 'update', filter: { heightMin: +e.target.value } })}
                           placeholder="min"
                           className="input input-bordered max-w-32"
                        />
                        <span className="mx-2 my-auto">to</span>
                        <input
                           name="heightMax"
                           type="number"
                           value={filter.heightMax || ''}
                           onChange={(e) => dispatchFilter({ action: 'update', filter: { heightMax: +e.target.value } })}
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
                           onChange={(e) => dispatchFilter({ action: 'update', filter: { widthMin: +e.target.value } })}
                           placeholder="min"
                           className="input input-bordered max-w-32"
                        />
                        <span className="mx-2 my-auto">to</span>
                        <input
                           name="widthMax"
                           type="number"
                           value={filter.widthMax || ''}
                           onChange={(e) => dispatchFilter({ action: 'update', filter: { widthMax: +e.target.value } })}
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
                           onChange={(e) => dispatchFilter({ action: 'update', filter: { sizeMin: +e.target.value } })}
                           placeholder="min"
                           className="input input-bordered max-w-32"
                        />
                        <span className="mx-2 my-auto">to</span>
                        <input
                           name="sizeMax"
                           type="number"
                           value={filter.sizeMax || ''}
                           onChange={(e) => dispatchFilter({ action: 'update', filter: { sizeMax: +e.target.value } })}
                           placeholder="max"
                           className="input input-bordered max-w-32"
                        />
                     </div>
                  </label>
               </div>

               <div className={`${activeTab === 'map' ? 'block' : 'hidden'} flex-grow relative`}>
                  {filter.location && (
                     <button
                        data-theme="light"
                        onClick={() => dispatchFilter({ action: 'update', filter: { radius: undefined, location: undefined } })}
                        className="google-map-btn absolute m-3 right-0 z-10"
                     >
                        Clear location
                     </button>
                  )}
                  {latestCoords.data && (
                     <Map
                        mapId={'SeachMap'}
                        center={filter.location || latestCoords.data}
                        onClick={(pos) => !filter.location && dispatchFilter({ action: 'update', filter: { location: pos } })}
                     >
                        {filter.location && (
                           <MapCircle
                              center={filter.location}
                              radius={filter.radius}
                              editable
                              onChange={(center, radius) => dispatchFilter({ action: 'update', filter: { location: center, radius: radius } })}
                           />
                        )}
                     </Map>
                  )}
               </div>

               <div className={`${activeTab === 'tags' ? 'block' : 'hidden'} flex-grow`}>
                  <p>Coming soon!</p>
               </div>
            </div>

            <div className="modal-action">
               <button className="btn" onClick={submit}>
                  Search
               </button>
               <button className="btn ml-4" onClick={cancel}>
                  Cancel
               </button>
            </div>
         </div>
      </dialog>
   );
};
