/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for page.tsx
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { Gallery } from '@/components';
import * as useSearchAPI from '../hooks/useSearchAPI';
import Home from './page';

jest.mock('../components/Gallery', () => ({
   Gallery: jest.fn().mockReturnValue(<div data-testid="Gallery"></div>),
}));
jest.mock('../components/SearchDialog', () => ({
   SearchDialog: jest.fn().mockReturnValue(<div data-testid="SearchDialog"></div>),
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
});
