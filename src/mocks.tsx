/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Global mocks
 */

import fetchMock from 'jest-fetch-mock';
import 'jest-location-mock';
import * as nextNavigation from 'next/navigation';
import * as nextAuth from 'next-auth/react';
import * as reactToastify from 'react-toastify';
import * as GoogleMaps from '@vis.gl/react-google-maps';
import * as reactSelect from 'react-select';
import { PropsWithChildren } from 'react';
import { Circle, initialize as initializeGoogleMapsMocks } from '@googlemaps/jest-mocks';

fetchMock.enableMocks();

/* Mocks for postgres */
jest.mock('pg');

/* Mocks for next-auth */
jest.mock('next-auth', () => jest.fn());
jest.mock('next-auth/react');
const mockSignIn = jest.spyOn(nextAuth, 'signIn') as jest.MockedFunction<typeof nextAuth.signIn>;
const mockSignOut = jest.spyOn(nextAuth, 'signOut') as jest.MockedFunction<typeof nextAuth.signOut>;

/* Mocks for Next.js router */
jest.mock('next/navigation');
const mockNextRouter = {
   back: jest.fn(),
   forward: jest.fn(),
   refresh: jest.fn(),
   push: jest.fn(),
   replace: jest.fn(),
   prefetch: jest.fn(),
};
jest.spyOn(nextNavigation, 'useRouter').mockImplementation(() => mockNextRouter);

/* Mocks for react-toastify */
jest.mock('react-toastify');
const mockToast = jest.spyOn(reactToastify, 'toast') as jest.MockedFunction<typeof reactToastify.toast>;

/* Mocks for react-select */
jest.mock('react-select');
const mockReactSelect = jest.spyOn(reactSelect.default, 'render' as never);

/* Mocks for Google Maps */
jest.mock('@vis.gl/react-google-maps');
const mockGoogleMap = jest.spyOn(GoogleMaps, 'Map') as jest.MockedFunction<typeof GoogleMaps.Map>;
const mockGoogleMapAPIProvider = jest.spyOn(GoogleMaps, 'APIProvider') as jest.MockedFunction<typeof GoogleMaps.APIProvider>;
mockGoogleMapAPIProvider.mockImplementation((props: PropsWithChildren<GoogleMaps.APIProviderProps>) => <>{props.children}</>);
const mockGoogleUseMap = jest.spyOn(GoogleMaps, 'useMap') as jest.MockedFunction<typeof GoogleMaps.useMap>;
mockGoogleUseMap.mockImplementation(() => new google.maps.Map(document.createElement('div')));

/* Initialise google maps mocks, and Keep track of necessary instances */
const mockGoogleCircleInstances: Circle[] = [];
beforeEach(() => {
   initializeGoogleMapsMocks();
   mockGoogleCircleInstances.length = 0;
   google.maps.Circle = jest.fn().mockImplementation(() => {
      const circle = {
         addListener: jest.fn(),
         setMap: jest.fn(),
         getCenter: jest.fn(),
         getRadius: jest.fn(),
      };
      mockGoogleCircleInstances.push(circle as Circle);
      return circle;
   });
});

/* Make sure mock are always reset before each test */
beforeEach(() => {
   jest.clearAllMocks();
   fetchMock.resetMocks();
});

const mocks = {
   googleMaps: {
      Map: mockGoogleMap,
      APIProvider: mockGoogleMapAPIProvider,
      useMap: mockGoogleUseMap,
      instantiatedCircles: mockGoogleCircleInstances,
   },
   nextAuth: {
      signIn: mockSignIn,
      signOut: mockSignOut,
   },
   nextNavigation: {
      router: mockNextRouter,
   },
   reactToastify: {
      toast: mockToast,
   },
   reactSelect: {
      Select: mockReactSelect,
   },
};

export default mocks;