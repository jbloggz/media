/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for SearchDialog.tsx
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import * as useAPI from '../hooks/useAPI';
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

describe('SearchDialog', () => {
   it('should not be open if the open prop is false', () => {
      render(<SearchDialog filter={{}} setFilter={jest.fn()} onClose={jest.fn()} />);
      expect(screen.getByText('General')).not.toBeVisible();
   });

   it('should be open if the open prop is true', () => {
      render(<SearchDialog filter={{}} setFilter={jest.fn()} onClose={jest.fn()} open />);
      expect(screen.getByText('General')).toBeVisible();
   });

   it('should close the dialog when cancel button is clicked', () => {
      const mockClose = jest.fn();
      const component = render(<SearchDialog filter={{}} setFilter={jest.fn()} onClose={mockClose} open />);
      const cancelButton = component.getByText('Cancel');
      expect(mockClose).not.toHaveBeenCalled();
      act(() => {
         cancelButton.click();
      });
      expect(mockClose).toHaveBeenCalled();
   });

   it('should call the setFilter callback on submit', () => {
      const mockSetFilter = jest.fn();
      const mockClose = jest.fn();
      const component = render(<SearchDialog filter={{}} setFilter={mockSetFilter} onClose={mockClose} open />);
      const submitButton = component.getByRole('button', { name: /search/i, hidden: true });
      expect(mockClose).not.toHaveBeenCalled();
      act(() => {
         submitButton.click();
      });
      expect(mockSetFilter).toHaveBeenCalledWith({});
      expect(mockClose).toHaveBeenCalled();
   });

   it('should close the dialog when escape is pressed', () => {
      const mockClose = jest.fn();
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={jest.fn()} onClose={mockClose} open />);
      expect(mockClose).not.toHaveBeenCalled();
      act(() => {
         fireEvent.keyDown(component.container, { key: 'Escape', code: 'escape' });
      });
      expect(mockClose).toHaveBeenCalled();
   });

   it('should default to showing the General tab', () => {
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={jest.fn()} onClose={jest.fn()} open />);
      expect(component.getByRole('tab', { name: /general/i, hidden: true })).toHaveClass('tab-active');
   });

   it('should show the Size tab when clicked', () => {
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={jest.fn()} onClose={jest.fn()} open />);
      const sizeTab = component.getByRole('tab', { name: /size/i, hidden: true });
      expect(sizeTab).not.toHaveClass('tab-active');
      act(() => {
         sizeTab.click();
      });
      expect(sizeTab).toHaveClass('tab-active');
   });

   it('should show the Map tab when clicked', () => {
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={jest.fn()} onClose={jest.fn()} open />);
      const mapTab = component.getByRole('tab', { name: /map/i, hidden: true });
      expect(mapTab).not.toHaveClass('tab-active');
      act(() => {
         mapTab.click();
      });
      expect(mapTab).toHaveClass('tab-active');
   });

   it('should show the Tags tab when clicked', () => {
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={jest.fn()} onClose={jest.fn()} open />);
      const tagsTab = component.getByRole('tab', { name: /tags/i, hidden: true });
      expect(tagsTab).not.toHaveClass('tab-active');
      act(() => {
         tagsTab.click();
      });
      expect(tagsTab).toHaveClass('tab-active');
   });

   it('should show the General tab when clicked', () => {
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={jest.fn()} onClose={jest.fn()} open />);
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
      render(<SearchDialog filter={{ sizeMax: 1234, type: ['image'] }} setFilter={jest.fn()} onClose={jest.fn()} open />);
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
      render(<SearchDialog filter={{ sizeMax: 1234, camera: ['foo'] }} setFilter={jest.fn()} onClose={jest.fn()} open />);
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
      render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={jest.fn()} onClose={jest.fn()} open />);
      expect(Select).toHaveBeenCalledWith(
         expect.objectContaining({
            options: [],
         }),
         {}
      );
   });

   it('should update filter when path regex changes', () => {
      const setFilter = jest.fn();
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} onClose={jest.fn()} open />);
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
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} onClose={jest.fn()} open />);
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
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} onClose={jest.fn()} open />);
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
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} onClose={jest.fn()} open />);
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
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} onClose={jest.fn()} open />);
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
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} onClose={jest.fn()} open />);
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
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} onClose={jest.fn()} open />);
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
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} onClose={jest.fn()} open />);
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
      const component = render(
         <SearchDialog filter={{ sizeMax: 1234, location: { lat: 234, lng: 23 } }} setFilter={setFilter} onClose={jest.fn()} open />
      );
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
      const component = render(<SearchDialog filter={{ sizeMax: 1234 }} setFilter={setFilter} onClose={jest.fn()} open />);
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
      const component = render(
         <SearchDialog filter={{ sizeMax: 1234, location: { lat: 234, lng: 23 } }} setFilter={setFilter} onClose={jest.fn()} open />
      );
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
