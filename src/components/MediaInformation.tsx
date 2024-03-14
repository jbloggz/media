/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The Gallery Image Viewer Information
 */
'use client';

import { basename } from 'path';
import { useState } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { Map, ThumbnailImage } from '.';

interface MediaInformationProps {
   media: Media;
}

const MediaInformation = ({ media }: MediaInformationProps) => {
   const [activeTab, setActiveTab] = useState('general');

   return (
      <div className="overflow-y-auto overflow-x-hidden flex flex-col h-full">
         <div className="w-[175px] mt-10 mb-6 mx-auto">
            <ThumbnailImage meta={media} noOverlay />
         </div>

         <div role="tablist" className="tabs tabs-lifted mb-2">
            <a role="tab" className={`tab ${activeTab == 'general' ? 'tab-active' : ''}`} onClick={() => setActiveTab('general')}>
               General
            </a>
            <a role="tab" className={`tab ${activeTab == 'size' ? 'tab-active' : ''}`} onClick={() => setActiveTab('size')}>
               Size
            </a>
            <a role="tab" className={`tab ${activeTab == 'location' ? 'tab-active' : ''}`} onClick={() => setActiveTab('location')}>
               Map
            </a>
            <a role="tab" className={`tab ${activeTab == 'tags' ? 'tab-active' : ''}`} onClick={() => setActiveTab('tags')}>
               Tags
            </a>
         </div>

         <div className={`${activeTab === 'general' ? 'block' : 'hidden'} space-y-5 flex-grow`}>
            <div className="form-control">
               <div className="label">
                  <span className="label-text">Filename</span>
               </div>
               <p>{basename(media.path)}</p>
            </div>

            <div className="form-control">
               <div className="label">
                  <span className="label-text">Timestamp</span>
               </div>
               <p>
                  {new Date(media.timestamp * 1000).toLocaleString('en-au', {
                     weekday: 'short',
                     year: 'numeric',
                     month: 'short',
                     day: 'numeric',
                     hour: 'numeric',
                     minute: '2-digit',
                     second: '2-digit',
                  })}
               </p>
            </div>

            <div className="form-control">
               <div className="label">
                  <span className="label-text">Media Type</span>
               </div>
               <p>{media.type}</p>
            </div>
            {media.type === 'video' && (
               <div className="form-control w-full">
                  <div className="label">
                     <span className="label-text">Video Duration (seconds)</span>
                  </div>
                  <p>{media.duration}</p>
               </div>
            )}

            <div className="form-control">
               <div className="label">
                  <span className="label-text">Camera (make/model)</span>
               </div>
               <p>{media.make || media.model ? `${media.make} ${media.model}` : 'Unknown'}</p>
            </div>
         </div>

         <div className={`${activeTab === 'size' ? 'block' : 'hidden'} space-y-5 flex-grow`}>
            <div className="form-control w-full">
               <div className="label">
                  <span className="label-text">Height (pixels)</span>
               </div>
               <p>{media.height}</p>
            </div>

            <div className="form-control w-full">
               <div className="label">
                  <span className="label-text">Width (pixels)</span>
               </div>
               <p>{media.width}</p>
            </div>

            <div className="form-control w-full">
               <div className="label">
                  <span className="label-text">File Size (bytes)</span>
               </div>
               <p>{media.size}</p>
            </div>
         </div>

         <div className={`${activeTab === 'location' ? 'block' : 'hidden'} space-y-5 flex-grow`}>
            {media.latitude && media.longitude ? (
               <Map mapId={'InfoMap'} center={{ lat: media.latitude, lng: media.longitude }} zoom={15}>
                  <AdvancedMarker position={{ lat: media.latitude, lng: media.longitude }} />
               </Map>
            ) : (
               <p>Unknown</p>
            )}
         </div>

         <div className={`${activeTab === 'tags' ? 'block' : 'hidden'} space-y-5 flex-grow`}>
            <p className="pt-2">Coming soon!</p>
         </div>
      </div>
   );
};

export default MediaInformation;
