/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for NavUserMenu.tsx
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import mocks from '@/mocks';
import { NavUserMenu } from '.';

describe('NavUserMenu', () => {
   it('should render dropdown menu with user email and logout button', () => {
      const email = 'test@example.com';

      const component = render(<NavUserMenu email={email} />);

      expect(component.getByText(email)).toBeInTheDocument();
      expect(component.getByText('Logout')).toBeInTheDocument();
   });

   it('should call the signoit function when then logout link is clicked', () => {
      const email = 'test@example.com';

      const component = render(<NavUserMenu email={email} />);
      const logoutLink = component.getByText('Logout');
      expect(mocks.nextAuth.signOut).not.toHaveBeenCalled();
      act(() => {
         logoutLink.click();
      });
      expect(mocks.nextAuth.signOut).toHaveBeenCalled();
   });
});
