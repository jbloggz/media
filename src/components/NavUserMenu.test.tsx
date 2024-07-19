/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for NavUserMenu.tsx
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { act } from 'react';
import mocks from '@/mocks';
import * as useSession from '../hooks/useSession';
import { NavUserMenu } from '.';

/* Mock out dependencies */
jest.mock('../hooks/useSession');
const mockUseSession = jest.spyOn(useSession, 'useSession');

describe('NavUserMenu', () => {
   it('should render dropdown menu with user email and logout button', () => {
      mockUseSession.mockReturnValue({ user: { email: 'test@example.com' }, expires: '' });
      const component = render(<NavUserMenu />);
      expect(component.getByText('test@example.com')).toBeInTheDocument();
      expect(component.getByText('Logout')).toBeInTheDocument();
   });

   it('should call the signout function when then logout link is clicked', () => {
      mockUseSession.mockReturnValue({ user: { email: 'test@example.com' }, expires: '' });
      const component = render(<NavUserMenu />);
      const logoutLink = component.getByText('Logout');
      expect(mocks.nextAuth.signOut).not.toHaveBeenCalled();
      act(() => {
         logoutLink.click();
      });
      expect(mocks.nextAuth.signOut).toHaveBeenCalled();
   });
});
