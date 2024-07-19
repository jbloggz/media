/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for NavBar.tsx
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import * as useSession from '../hooks/useSession';
import { NavBar } from '.';

/* Mock out dependencies */
jest.mock('../hooks/useSession');
const mockUseSession = jest.spyOn(useSession, 'useSession');

describe('NavBar', () => {
   it('should render the nav bar', async () => {
      mockUseSession.mockReturnValue({ user: { email: 'foo@example.com' }, expires: '' });
      const component = render(<NavBar icons={[]} />);
      expect(component.getByText('Media Browser')).toBeInTheDocument();
   });

   it('should render the user email when valid', async () => {
      mockUseSession.mockReturnValue({ user: { email: 'foo@example.com' }, expires: '' });
      const component = render(<NavBar icons={[]} />);
      expect(component.getByText('foo@example.com')).toBeInTheDocument();
   });

   it('should render the icons passed tot he navbar', async () => {
      mockUseSession.mockReturnValue({ user: { email: 'foo@example.com' }, expires: '' });
      const component = render(
         <NavBar
            icons={[
               { elem: <div data-testid="icon1">J</div>, onClick: () => {} },
               { elem: <div data-testid="icon2">O</div>, onClick: () => {} },
               { elem: <div data-testid="icon3">E</div>, onClick: () => {} },
            ]}
         />
      );
      expect(component.getByTestId('icon1')).toBeInTheDocument();
      expect(component.getByTestId('icon2')).toBeInTheDocument();
      expect(component.getByTestId('icon3')).toBeInTheDocument();
   });
});
