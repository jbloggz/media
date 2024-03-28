/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for NavUserMenu.tsx
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import mocks from '@/mocks';
import { NavBar } from '.';

/* Since NavBar is an async component, we need this hack to resolve it, or jest complains */
const awaitNavBar = async () => {
   const NavBarResolved = await NavBar();
   return () => NavBarResolved;
};

describe('NavBar', () => {
   it('should render the nav bar', async () => {
      const NavBarResolved = await awaitNavBar();
      const component = render(<NavBarResolved />);
      expect(component.getByText('Media Browser')).toBeInTheDocument();
   });

   it('should render the user email when valid', async () => {
      mocks.nextAuth.getServerSession.mockResolvedValueOnce({ user: { email: 'foobar' } });
      const NavBarResolved = await awaitNavBar();
      const component = render(<NavBarResolved />);
      expect(component.getByText('foobar')).toBeInTheDocument();
   });
});
