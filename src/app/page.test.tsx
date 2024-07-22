/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for page.tsx
 */

import { act } from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { Gallery, SearchDialog } from '@/components';
import * as useSearchAPI from '../hooks/useSearchAPI';
import * as useNavBarIcons from '../hooks/useNavBarIcons';
import Home from './page';

jest.mock('../components/Gallery', () => ({
   Gallery: jest.fn().mockReturnValue(<div data-testid="Gallery"></div>),
}));
jest.mock('../components/SearchDialog', () => ({
   SearchDialog: jest.fn().mockReturnValue(<div data-testid="SearchDialog"></div>),
}));
jest.mock('../hooks/useNavBarIcons', () => ({
   useNavBarIcons: jest.fn(),
}));
jest.mock('../hooks/useSearchAPI');
const mockUseSeachAPI = jest.spyOn(useSearchAPI, 'useSearchAPI');

describe('Home', () => {
   it('should render the Gallery with data', () => {
      mockUseSeachAPI.mockReturnValue({ isLoading: false, data: [], error: undefined, mutate: jest.fn(), isValidating: false });
      render(<Home />);
      expect(Gallery).toHaveBeenCalled();
   });

   it('should render the Gallery with no data', () => {
      mockUseSeachAPI.mockReturnValue({ isLoading: false, data: null, error: undefined, mutate: jest.fn(), isValidating: false });
      render(<Home />);
      expect(Gallery).toHaveBeenCalled();
   });

   it('should enable selectMode when icon clicked', () => {
      mockUseSeachAPI.mockReturnValue({ isLoading: false, data: null, error: undefined, mutate: jest.fn(), isValidating: false });
      render(<Home />);
      const icons = (useNavBarIcons.useNavBarIcons as jest.Mock).mock.lastCall[0];
      act(() => {
         icons[0].onClick();
      });

      expect((Gallery as jest.Mock).mock.lastCall[0].selectMode).toBe(true);
   });

   it('should open search dialog when icon clicked', () => {
      mockUseSeachAPI.mockReturnValue({ isLoading: false, data: null, error: undefined, mutate: jest.fn(), isValidating: false });
      render(<Home />);
      const icons = (useNavBarIcons.useNavBarIcons as jest.Mock).mock.lastCall[0];
      act(() => {
         icons[1].onClick();
      });

      expect((SearchDialog as jest.Mock).mock.lastCall[0].open).toBe(true);
   });

   it('should reset filter when search x clicked', () => {
      mockUseSeachAPI.mockReturnValue({ isLoading: false, data: null, error: undefined, mutate: jest.fn(), isValidating: false });
      const component = render(<Home />);
      act(() => {
         const setFilter = (SearchDialog as jest.Mock).mock.lastCall[0].setFilter;
         setFilter({ path: 'foo' });
      });
      act(() => {
         const icons = (useNavBarIcons.useNavBarIcons as jest.Mock).mock.lastCall[0];
         icons[2].onClick();
      });
      component.rerender(<Home />);
      expect((SearchDialog as jest.Mock).mock.lastCall[0].filter).toEqual({});
   });

   it('should disable selectMode when x clicked', () => {
      mockUseSeachAPI.mockReturnValue({ isLoading: false, data: null, error: undefined, mutate: jest.fn(), isValidating: false });
      render(<Home />);
      let icons = (useNavBarIcons.useNavBarIcons as jest.Mock).mock.lastCall[0];
      act(() => {
         icons[0].onClick();
      });
      icons = (useNavBarIcons.useNavBarIcons as jest.Mock).mock.lastCall[0];
      expect((Gallery as jest.Mock).mock.lastCall[0].selectMode).toBe(true);
      act(() => {
         icons[0].onClick();
      });
      expect((Gallery as jest.Mock).mock.lastCall[0].selectMode).toBe(false);
   });
});
