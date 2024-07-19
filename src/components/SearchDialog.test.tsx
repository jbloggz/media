/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for SearchDialog.tsx
 */

import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';
import { act } from 'react';
import mocks from '@/mocks';
import * as useAPI from '../hooks/useAPI';
import * as useNavBarIcons from '../hooks/useNavBarIcons';
import { Select } from './Select';
import { Map, MapCircle } from './Map';
import { SearchDialog } from '.';
import { PropsWithChildren } from 'react';
import { MapProps } from '@vis.gl/react-google-maps';

jest.mock('./Map', () => ({
   Map: jest.fn().mockImplementation((props: PropsWithChildren<MapProps>) => <div>{props.children}</div>),
   MapCircle: jest.fn().mockReturnValue(<div data-testid="Select"></div>),
}));

jest.mock('./Select', () => ({
   Select: jest.fn().mockReturnValue(<div data-testid="Select"></div>),
}));

jest.mock('../hooks/useAPI');
const mockUseAPI = jest.spyOn(useAPI, 'useAPI').mockReturnValue({
   isLoading: false,
   data: [],
   error: undefined,
   mutate: jest.fn(),
   isValidating: false,
});
jest.mock('../hooks/useNavBarIcons');
const mockUseNavBarIcons = jest.spyOn(useNavBarIcons, 'useNavBarIcons');


describe('SearchDialog', () => {
   it('should open dialog when search button is clicked', () => {
      render(<SearchDialog filter={{}} setFilter={jest.fn()} />);
      const searchIcon = mockUseNavBarIcons.mock.calls[0][0][0];
      act(() => {
         searchIcon.onClick();
      });
      expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
      expect(mocks.nextNavigation.router.push).toHaveBeenCalledWith('#search');
   });

   it('should navigate back when cancel button is clicked', () => {
      const component = render(<SearchDialog filter={{}} setFilter={jest.fn()} />);
      const searchIcon = mockUseNavBarIcons.mock.calls[0][0][0];
      const cancelButton = component.getByText('Cancel');
      act(() => {
         searchIcon.onClick();
      });
      act(() => {
         cancelButton.click();
      });
      expect(mocks.nextNavigation.router.back).toHaveBeenCalled();
   });

   it('should call the setFilter callback on submit', () => {
      const mockSetFilter = jest.fn();
      const component = render(<SearchDialog filter={{}} setFilter={mockSetFilter} />);
      const submitButton = component.getByRole('button', { name: /search/i, hidden: true });
      const searchIcon = mockUseNavBarIcons.mock.calls[0][0][0];
      act(() => {
         searchIcon.onClick();
      });
      act(() => {
         submitButton.click();
      });
      expect(mockSetFilter).toHaveBeenCalledWith({});
   });

   it('should call the setFilter callback with empty object on reset', () => {
      const mockSetFilter = jest.fn();
      render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={mockSetFilter} />);
      const resetIcon = mockUseNavBarIcons.mock.calls[0][0][1];
      act(() => {
         resetIcon.onClick();
      });
      expect(mockSetFilter).toHaveBeenCalledWith({});
   });

   it('should close the dialog when escape is pressed', () => {
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={jest.fn()} />);
      act(() => {
         fireEvent.keyDown(component.container, { key: 'Escape', code: 'escape' });
      });
      expect(mocks.nextNavigation.router.back).toHaveBeenCalled();
   });

   it('should default to showing the General tab', () => {
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={jest.fn()} />);
      expect(component.getByRole('tab', { name: /general/i, hidden: true })).toHaveClass('tab-active');
   });

   it('should show the Size tab when clicked', () => {
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={jest.fn()} />);
      const sizeTab = component.getByRole('tab', { name: /size/i, hidden: true });
      expect(sizeTab).not.toHaveClass('tab-active');
      act(() => {
         sizeTab.click();
      });
      expect(sizeTab).toHaveClass('tab-active');
   });

   it('should show the Map tab when clicked', () => {
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={jest.fn()} />);
      const mapTab = component.getByRole('tab', { name: /map/i, hidden: true });
      expect(mapTab).not.toHaveClass('tab-active');
      act(() => {
         mapTab.click();
      });
      expect(mapTab).toHaveClass('tab-active');
   });

   it('should show the Tags tab when clicked', () => {
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={jest.fn()} />);
      const tagsTab = component.getByRole('tab', { name: /tags/i, hidden: true });
      expect(tagsTab).not.toHaveClass('tab-active');
      act(() => {
         tagsTab.click();
      });
      expect(tagsTab).toHaveClass('tab-active');
   });

   it('should show the General tab when clicked', () => {
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={jest.fn()} />);
      const tagsTab = component.getByRole('tab', { name: /tags/i, hidden: true });
      expect(tagsTab).not.toHaveClass('tab-active');
      act(() => {
         tagsTab.click();
      });
      expect(tagsTab).toHaveClass('tab-active');
      const generalTab = component.getByRole('tab', { name: /general/i, hidden: true });
      expect(generalTab).not.toHaveClass('tab-active');
      act(() => {
         generalTab.click();
      });
      expect(generalTab).toHaveClass('tab-active');
   });

   it('should use media types returned from the API in the select dropdown', () => {
      mockUseAPI.mockImplementationOnce((opts) => {
         const resp = {
            isLoading: false,
            data: [] as string[],
            error: undefined,
            mutate: jest.fn(),
            isValidating: false,
         };
         if (opts.url === '/api/searchOptions?field=type') {
            resp.data = ['image', 'video'];
         }

         return resp;
      });
      render(<SearchDialog filter={{ sizeMax: 1234, type: ['image'] }} setFilter={jest.fn()} />);
      expect(Select).toHaveBeenCalledWith(
         expect.objectContaining({
            options: [
               { label: 'image', value: 'image' },
               { label: 'video', value: 'video' },
            ],
         }),
         {}
      );
   });

   it('should use cameras returned from the API in the select dropdown', () => {
      mockUseAPI.mockImplementation((opts) => {
         const resp = {
            isLoading: false,
            data: [] as string[],
            error: undefined,
            mutate: jest.fn(),
            isValidating: false,
         };
         if (opts.url === '/api/searchOptions?field=make,model') {
            resp.data = ['foo', 'bar', 'Something else'];
         }

         return resp;
      });
      render(<SearchDialog filter={{ sizeMax: 1234, camera: ['foo'] }} setFilter={jest.fn()} />);
      expect(Select).toHaveBeenCalledWith(
         expect.objectContaining({
            options: [
               { label: 'foo', value: 'foo' },
               { label: 'bar', value: 'bar' },
               { label: 'Something else', value: 'Something else' },
            ],
         }),
         {}
      );
   });

   it('should use empty set for media types and camera when API data is not ready', () => {
      mockUseAPI.mockReturnValue({
         isLoading: false,
         data: undefined,
         error: undefined,
         mutate: jest.fn(),
         isValidating: false,
      });
      render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={jest.fn()} />);
      expect(Select).toHaveBeenCalledWith(
         expect.objectContaining({
            options: [],
         }),
         {}
      );
   });

   it('should update filter when path regex changes', () => {
      const setFilter = jest.fn();
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} />);
      const input = component.container.querySelector('input[name="path"]') as HTMLInputElement;
      const submitButton = component.getByRole('button', { name: /search/i, hidden: true });
      act(() => {
         fireEvent.change(input, { target: { value: '.*' } });
      });
      act(() => {
         submitButton.click();
      });

      expect(setFilter).toHaveBeenCalledWith({ sizeMax: 1234, path: '.*' });
   });

   it('should update filter when media type select changes', () => {
      const setFilter = jest.fn();
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} />);
      const mediaTypeOnChange = (Select as jest.Mock).mock.calls[0][0].onChange;
      const submitButton = component.getByRole('button', { name: /search/i, hidden: true });
      act(() => {
         mediaTypeOnChange([
            { label: 'image', value: 'image' },
            { label: 'foo', value: 'Foo' },
         ]);
      });
      act(() => {
         submitButton.click();
      });

      expect(setFilter).toHaveBeenCalledWith({ sizeMax: 1234, type: ['image', 'Foo'] });
   });

   it('should update filter when durationMin changes', () => {
      const setFilter = jest.fn();
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} />);
      const input = component.container.querySelector('input[name="durationMin"]') as HTMLInputElement;
      const submitButton = component.getByRole('button', { name: /search/i, hidden: true });
      act(() => {
         fireEvent.change(input, { target: { value: '4232' } });
      });
      act(() => {
         submitButton.click();
      });

      expect(setFilter).toHaveBeenCalledWith({ sizeMax: 1234, durationMin: 4232 });
   });

   it('should update filter when durationMax changes', () => {
      const setFilter = jest.fn();
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} />);
      const minInput = component.container.querySelector('input[name="durationMin"]') as HTMLInputElement;
      const maxInput = component.container.querySelector('input[name="durationMax"]') as HTMLInputElement;
      const submitButton = component.getByRole('button', { name: /search/i, hidden: true });
      act(() => {
         fireEvent.change(minInput, { target: { value: '4232' } });
         fireEvent.change(maxInput, { target: { value: '9876' } });
      });
      act(() => {
         submitButton.click();
      });

      expect(setFilter).toHaveBeenCalledWith({ sizeMax: 1234, durationMin: 4232, durationMax: 9876 });
   });

   it('should update filter when camera changes', () => {
      const setFilter = jest.fn();
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} />);
      const cameraOnChange = (Select as jest.Mock).mock.calls[1][0].onChange;
      const submitButton = component.getByRole('button', { name: /search/i, hidden: true });
      act(() => {
         cameraOnChange([
            { label: 'bar', value: 'bar' },
            { label: 'foo', value: 'Foo' },
         ]);
      });
      act(() => {
         submitButton.click();
      });

      expect(setFilter).toHaveBeenCalledWith({ sizeMax: 1234, camera: ['bar', 'Foo'] });
   });

   it('should update filter when height changes', () => {
      const setFilter = jest.fn();
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} />);
      const minInput = component.container.querySelector('input[name="heightMin"]') as HTMLInputElement;
      const maxInput = component.container.querySelector('input[name="heightMax"]') as HTMLInputElement;
      const submitButton = component.getByRole('button', { name: /search/i, hidden: true });
      act(() => {
         fireEvent.change(minInput, { target: { value: '123' } });
         fireEvent.change(maxInput, { target: { value: '432' } });
      });
      act(() => {
         submitButton.click();
      });

      expect(setFilter).toHaveBeenCalledWith({ sizeMax: 1234, heightMin: 123, heightMax: 432 });
   });

   it('should update filter when width changes', () => {
      const setFilter = jest.fn();
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} />);
      const minInput = component.container.querySelector('input[name="widthMin"]') as HTMLInputElement;
      const maxInput = component.container.querySelector('input[name="widthMax"]') as HTMLInputElement;
      const submitButton = component.getByRole('button', { name: /search/i, hidden: true });
      act(() => {
         fireEvent.change(minInput, { target: { value: '123' } });
         fireEvent.change(maxInput, { target: { value: '432' } });
      });
      act(() => {
         submitButton.click();
      });

      expect(setFilter).toHaveBeenCalledWith({ sizeMax: 1234, widthMin: 123, widthMax: 432 });
   });

   it('should update filter when file size changes', () => {
      const setFilter = jest.fn();
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} />);
      const minInput = component.container.querySelector('input[name="sizeMin"]') as HTMLInputElement;
      const maxInput = component.container.querySelector('input[name="sizeMax"]') as HTMLInputElement;
      const submitButton = component.getByRole('button', { name: /search/i, hidden: true });
      act(() => {
         fireEvent.change(minInput, { target: { value: '912873' } });
         fireEvent.change(maxInput, { target: { value: '91287323' } });
      });
      act(() => {
         submitButton.click();
      });

      expect(setFilter).toHaveBeenCalledWith({ sizeMin: 912873, sizeMax: 91287323 });
   });

   it('should update filter when location changes', () => {
      mockUseAPI.mockImplementation((opts) => {
         const resp = {
            isLoading: false,
            data: [] as GpsCoord | string[],
            error: undefined,
            mutate: jest.fn(),
            isValidating: false,
         };
         if (opts.url === '/api/latestGps') {
            resp.data = { lat: 32, lng: 453 };
         }
         return resp;
      });
      const setFilter = jest.fn();
      const component = render(<SearchDialog filter={{ sizeMax: 1234, location: { lat: 234, lng: 23 } }} setFilter={setFilter} />);
      const circle = (MapCircle as jest.Mock).mock.calls[0][0];
      const submitButton = component.getByRole('button', { name: /search/i, hidden: true });
      act(() => {
         circle.onChange({ lat: 876, lng: 726 }, 9999);
      });
      act(() => {
         submitButton.click();
      });

      expect(setFilter).toHaveBeenCalledWith({ sizeMax: 1234, location: { lat: 876, lng: 726 }, radius: 9999 });
   });

   it('should add location when map is clicked', () => {
      mockUseAPI.mockImplementation((opts) => {
         const resp = {
            isLoading: false,
            data: [] as GpsCoord | string[],
            error: undefined,
            mutate: jest.fn(),
            isValidating: false,
         };
         if (opts.url === '/api/latestGps') {
            resp.data = { lat: 32, lng: 453 };
         }
         return resp;
      });
      const setFilter = jest.fn();
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} />);
      const map = (Map as jest.Mock).mock.calls[0][0];
      const submitButton = component.getByRole('button', { name: /search/i, hidden: true });
      act(() => {
         map.onClick({ lat: -25.64, lng: 123.43 });
      });
      act(() => {
         submitButton.click();
      });

      expect(setFilter).toHaveBeenCalledWith({ sizeMax: 1234, location: { lat: -25.64, lng: 123.43 } });
   });

   it('should clear location when "Clear location" buton is clicked', () => {
      const setFilter = jest.fn();
      const component = render(<SearchDialog filter={{ sizeMax: 1234, location: { lat: 234, lng: 23 } }} setFilter={setFilter} />);
      const clearButton = component.getByRole('button', { name: /clear location/i, hidden: true });
      const submitButton = component.getByRole('button', { name: /search/i, hidden: true });
      act(() => {
         clearButton.click();
      });
      act(() => {
         submitButton.click();
      });

      expect(setFilter).toHaveBeenCalledWith({ sizeMax: 1234 });
   });
});
