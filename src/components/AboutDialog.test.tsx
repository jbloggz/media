/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for AboutDialog.tsx
 */

import '@testing-library/jest-dom';
import { act } from 'react';
import { render } from '@testing-library/react';
import * as useAPI from '../hooks/useAPI';
import { AboutDialog } from '.';

jest.mock('../hooks/useAPI');
jest.spyOn(useAPI, 'useAPI').mockReturnValue({
   isLoading: false,
   data: {
      version: '1.2.3',
      timestamp: 1712666246,
   },
   error: undefined,
   mutate: jest.fn(),
   isValidating: false,
});

describe('AboutDialog', () => {
   it('should render the dialog', () => {
      const component = render(<AboutDialog show={true} onClose={jest.fn()} />);
      expect(component.getByText('About')).toBeInTheDocument();
   });

   it('should call the onClose when close button clicked', () => {
      const onClose = jest.fn();
      const component = render(<AboutDialog show={true} onClose={onClose} />);
      const btn = component.getByText('Close');
      act(() => {
         btn.click();
      });
      expect(onClose).toHaveBeenCalled();
   });
});
