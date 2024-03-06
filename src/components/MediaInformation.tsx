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
import { ThumbnailImage } from '.';

interface MediaInformationProps {
   media: Media;
}

const MediaInformation = ({ media }: MediaInformationProps) => {
   const [activeTab, setActiveTab] = useState('general');

   return (
      <div className="overflow-y-auto overflow-x-hidden">
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

         <div className={`${activeTab === 'general' ? 'block' : 'hidden'} space-y-5`}>
            <label className="form-control">
               <div className="label">
                  <span className="label-text">Filename</span>
               </div>
               <p>{basename(media.path)}</p>
            </label>

            <label className="form-control">
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
            </label>

            <label className="form-control">
               <div className="label">
                  <span className="label-text">Media Type</span>
               </div>
               <p>{media.type}</p>
            </label>
            {media.type === 'video' && (
               <label className="form-control w-full">
                  <div className="label">
                     <span className="label-text">Video Duration (seconds)</span>
                  </div>
                  <p>{media.duration}</p>
               </label>
            )}

            <label className="form-control">
               <div className="label">
                  <span className="label-text">Camera (make/model)</span>
               </div>
               <p>{media.make || media.model ? `${media.make} ${media.model}` : 'Unknown'}</p>
            </label>
         </div>

         <div className={`${activeTab === 'size' ? 'block' : 'hidden'} space-y-5`}>
            <label className="form-control w-full">
               <div className="label">
                  <span className="label-text">Height (pixels)</span>
               </div>
               <p>{media.height}</p>
            </label>

            <label className="form-control w-full">
               <div className="label">
                  <span className="label-text">Width (pixels)</span>
               </div>
               <p>{media.width}</p>
            </label>

            <label className="form-control w-full">
               <div className="label">
                  <span className="label-text">File Size (bytes)</span>
               </div>
               <p>{media.size}</p>
            </label>
         </div>

         <div className={`${activeTab === 'location' ? 'block' : 'hidden'} space-y-5`}>
            <label className="form-control">
               <div className="label">
                  <span className="label-text">GPS Location (degrees)</span>
               </div>
               <p>{media.latitude && media.longitude ? `${media.latitude},${media.longitude}` : 'Unknown'}</p>
            </label>
         </div>

         <div className={`${activeTab === 'tags' ? 'block' : 'hidden'} space-y-5`}>
            <p className="pt-2">Coming soon!</p>
         </div>

      </div>
   );
};

export default MediaInformation;
