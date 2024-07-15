/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for settings/page.tsx
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import Login from './page';
import mocks from '@/mocks';
import { act } from 'react';

describe('Login', () => {
   it('should render the Login page', () => {
      const component = render(<Login />);
      expect(component.getByRole('button', { hidden: true })).toBeInTheDocument();
      expect(component.getByText('Sign in with Google')).toBeInTheDocument();
   });

   it('should show the Login page even if there is an error', () => {
      (mocks.nextNavigation.useSearchParams.get as jest.Mock).mockReturnValue('Test Failed');
      const component = render(<Login />);
      expect(component.getByRole('button', { hidden: true })).toBeInTheDocument();
      expect(component.getByText('Sign in with Google')).toBeInTheDocument();
   });

   it('should call signIn function when login button is clicked', () => {
      (mocks.nextNavigation.useSearchParams.get as jest.Mock).mockReturnValue('Test Failed');
      const component = render(<Login />);
      const btn = component.getByRole('button', { hidden: true });

      expect(mocks.nextAuth.signIn).not.toHaveBeenCalled();
      act(() => {
         btn.click();
      });
      expect(mocks.nextAuth.signIn).toHaveBeenCalled();
   });
});
