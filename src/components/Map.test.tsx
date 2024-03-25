/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for Loader.tsx
 */

import assert from 'assert';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import mocks from '@/mocks';
import { Map, MapCircle, defaultSearchRadius } from '.';

describe('Map', () => {
   it('should render a GoogleMap component with the provided mapId, center, and default zoom level', () => {
      const mapId = 'map1';
      const defaultCenter = { lat: 37.7749, lng: -122.4194 };
      const defaultZoom = 10;
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'Test1';

      render(<Map mapId={mapId} center={defaultCenter} zoom={defaultZoom} />);

      expect(mocks.googleMaps.APIProvider).toHaveBeenCalledWith(
         expect.objectContaining({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
         }),
         {}
      );

      expect(mocks.googleMaps.Map).toHaveBeenCalledWith(
         expect.objectContaining({
            defaultCenter,
            mapId,
            defaultZoom,
         }),
         {}
      );
   });

   it('should default the zoom level if not provided', () => {
      const mapId = 'map2';
      const defaultCenter = { lat: 37.7749, lng: -122.4194 };
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'Test2';

      render(<Map mapId={mapId} center={defaultCenter} />);

      expect(mocks.googleMaps.Map).toHaveBeenCalledWith(
         expect.objectContaining({
            defaultCenter,
            mapId,
         }),
         {}
      );

      const call = mocks.googleMaps.Map.mock.calls[0][0];
      expect(call.defaultZoom).toBeGreaterThan(0);
   });

   it('should render a message when no Google Maps API key is provided', () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = '';
      render(<Map mapId="map3" center={{ lat: 37.7749, lng: -122.4194 }} />);
      expect(screen.getByText('Cannot use maps')).toBeInTheDocument();
   });

   it('should pass children components to the GoogleMap component', () => {
      const mapId = 'map4';
      const defaultCenter = { lat: 37.7749, lng: -122.4194 };
      const defaultZoom = 10;
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'Test4';

      render(
         <Map mapId={mapId} center={defaultCenter} zoom={defaultZoom}>
            <div>Child Component</div>
         </Map>
      );

      expect(mocks.googleMaps.Map).toHaveBeenCalledWith(
         expect.objectContaining({
            children: <div>Child Component</div>,
         }),
         {}
      );
   });

   it('should handle onClick events and pass the clicked GPS coordinates to the provided onClick function', () => {
      const mapId = 'map5';
      const defaultCenter = { lat: 37.7749, lng: -122.4194 };
      const defaultZoom = 10;
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'Test5';

      const mockOnClick = jest.fn();
      render(<Map mapId={mapId} center={defaultCenter} zoom={defaultZoom} onClick={mockOnClick} />);

      assert(mocks.googleMaps.Map.mock.calls[0][0].onClick);
      mocks.googleMaps.Map.mock.calls[0][0].onClick({
         detail: { latLng: { lat: 40.7128, lng: -74.006 }, placeId: null },
         type: '',
         map: null as any,
         stoppable: false,
         stop: () => {},
      });
      expect(mockOnClick).toHaveBeenCalledWith({ lat: 40.7128, lng: -74.006 });
   });
});

describe('MapCircle', () => {
   it('should create a circle with provided radius and center', () => {
      render(<MapCircle center={{ lat: 40.7128, lng: -74.006 }} radius={1234} />);

      expect(google.maps.Circle).toHaveBeenCalledWith(
         expect.objectContaining({
            center: { lat: 40.7128, lng: -74.006 },
            radius: 1234,
         })
      );
   });

   it('should not create a circle when map is not available', () => {
      mocks.googleMaps.useMap.mockImplementationOnce(() => null);
      render(<MapCircle center={{ lat: 40.7128, lng: -74.006 }} radius={1234} />);

      expect(google.maps.Circle).not.toHaveBeenCalled();
   });

   it('should calculate radius based on map zoom if not provided', () => {
      render(<MapCircle center={{ lat: 40.7128, lng: -74.006 }} />);

      expect(google.maps.Circle).toHaveBeenCalledWith(
         expect.objectContaining({
            center: { lat: 40.7128, lng: -74.006 },
            radius: defaultSearchRadius,
         })
      );
   });

   it('should call provided onChange handler when radius onChange is fired', () => {
      const center = { lat: 40.7128, lng: -74.006 };
      const radius = 1234;
      const onChange = jest.fn();
      render(<MapCircle center={center} radius={radius} onChange={onChange} />);
      expect(mocks.googleMaps.instantiatedCircles).toHaveLength(1);
      const circle = mocks.googleMaps.instantiatedCircles[0];
      const newCenter = { lat: 41.7128, lng: -75.006 };
      const newRadius = 5678;

      const [listenerName, listenerFn] = circle.addListener.mock.calls.find((v) => v[0] === 'radius_changed');
      expect(listenerName).toEqual('radius_changed');
      expect(listenerFn).toBeDefined();
      circle.getCenter.mockReturnValueOnce({ toJSON: () => newCenter });
      circle.getRadius.mockReturnValueOnce(newRadius);
      listenerFn();
      expect(onChange).toHaveBeenCalledWith(newCenter, newRadius);
   });

   it('should call provided onChange handler with the current center when radius onChange is fired but getCenter is falsey', () => {
      const center = { lat: 40.7128, lng: -74.006 };
      const radius = 1234;
      const onChange = jest.fn();
      render(<MapCircle center={center} radius={radius} onChange={onChange} />);
      expect(mocks.googleMaps.instantiatedCircles).toHaveLength(1);
      const circle = mocks.googleMaps.instantiatedCircles[0];
      const newRadius = 5678;

      const [listenerName, listenerFn] = circle.addListener.mock.calls.find((v) => v[0] === 'radius_changed');
      expect(listenerName).toEqual('radius_changed');
      expect(listenerFn).toBeDefined();
      circle.getCenter.mockReturnValueOnce(undefined);
      circle.getRadius.mockReturnValueOnce(newRadius);
      listenerFn();
      expect(onChange).toHaveBeenCalledWith(center, newRadius);
   });

   it('should call provided onChange handler when center onChange is fired', () => {
      const center = { lat: 40.7128, lng: -74.006 };
      const radius = 1234;
      const onChange = jest.fn();
      render(<MapCircle center={center} radius={radius} onChange={onChange} />);
      expect(mocks.googleMaps.instantiatedCircles).toHaveLength(1);
      const circle = mocks.googleMaps.instantiatedCircles[0];
      const newCenter = { lat: 41.7128, lng: -75.006 };
      const newRadius = 5678;

      const [listenerName, listenerFn] = circle.addListener.mock.calls.find((v) => v[0] === 'center_changed');
      expect(listenerName).toEqual('center_changed');
      expect(listenerFn).toBeDefined();
      circle.getCenter.mockReturnValueOnce({ toJSON: () => newCenter });
      circle.getRadius.mockReturnValueOnce(newRadius);
      listenerFn();
      expect(onChange).toHaveBeenCalledWith(newCenter, newRadius);
   });

   it('should call provided onChange handler with the current center when center onChange is fired but getCenter is falsey', () => {
      const center = { lat: 40.7128, lng: -74.006 };
      const radius = 1234;
      const onChange = jest.fn();
      render(<MapCircle center={center} radius={radius} onChange={onChange} />);
      expect(mocks.googleMaps.instantiatedCircles).toHaveLength(1);
      const circle = mocks.googleMaps.instantiatedCircles[0];
      const newRadius = 5678;

      const [listenerName, listenerFn] = circle.addListener.mock.calls.find((v) => v[0] === 'center_changed');
      expect(listenerName).toEqual('center_changed');
      expect(listenerFn).toBeDefined();
      circle.getCenter.mockReturnValueOnce(undefined);
      circle.getRadius.mockReturnValueOnce(newRadius);
      listenerFn();
      expect(onChange).toHaveBeenCalledWith(center, newRadius);
   });

   it('should call provided onChange handler with default radius if radius prop not provided', () => {
      const center = { lat: 40.7128, lng: -74.006 };
      const onChange = jest.fn();
      render(<MapCircle center={center} onChange={onChange} />);
      expect(mocks.googleMaps.instantiatedCircles).toHaveLength(1);
      expect(onChange).toHaveBeenCalledWith(center, expect.anything());
   });
});
