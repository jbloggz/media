/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A Google map wrapper
 */
'use client';

import React, { PropsWithChildren, useEffect } from 'react';
import { APIProvider, Map as GoogleMap, useMap } from '@vis.gl/react-google-maps';

export const defaultZoomLevel = 12;
export const defaultSearchRadius = 1000;

const calculateDefaultSearchRadius = (zoom: number) => {
   return defaultSearchRadius * Math.pow(2, defaultZoomLevel - zoom);
};

interface MapProps {
   mapId: string;
   center: GpsCoord;
   zoom?: number;
   onClick?: (pos: GpsCoord) => void;
}

interface MapCircleProps {
   center: GpsCoord;
   radius?: number;
   editable?: boolean;
   onChange?: (center: GpsCoord, radius: number) => void;
}

export const MapCircle = (props: MapCircleProps) => {
   const map = useMap();
   useEffect(() => {
      if (!map) {
         return;
      }

      const radius = props.radius || calculateDefaultSearchRadius(map.getZoom() || defaultZoomLevel);
      const circle = new google.maps.Circle({
         map,
         center: props.center,
         radius,
         editable: props.editable,
      });

      circle.addListener('radius_changed', () => {
         props.onChange && props.onChange(circle.getCenter()?.toJSON() || props.center, circle.getRadius());
      });
      circle.addListener('center_changed', () => {
         props.onChange && props.onChange(circle.getCenter()?.toJSON() || props.center, circle.getRadius());
      });

      if (props.onChange && !props.radius) {
         props.onChange(props.center, radius);
      }

      return () => {
         circle.setMap(null);
      };
   }, [map, props]);

   return <></>;
};

export const Map = (props: PropsWithChildren<MapProps>) => {
   return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
         <GoogleMap
            mapId={props.mapId}
            defaultCenter={props.center}
            defaultZoom={props.zoom || defaultZoomLevel}
            onClick={(e) => e.detail.latLng && props.onClick && props.onClick(e.detail.latLng)}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
         >
            {props.children}
         </GoogleMap>
      </APIProvider>
   ) : (
      <p>Cannot use maps</p>
   );
};
