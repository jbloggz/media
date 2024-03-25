/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for AppDrawer.tsx
 */

import assert from 'assert';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import mocks from '@/mocks';
import { AppDrawer } from '.';

describe('AppDrawer', () => {
   it('should render children successfully when children are provided', () => {
      const component = render(
         <AppDrawer>
            <p data-testid="child">hello</p>
         </AppDrawer>
      );
      const elem = component.getByTestId('child');
      expect(elem).toBeInTheDocument();
   });

   it('should toggle drawer open and closed when checkbox is clicked', () => {
      const component = render(
         <AppDrawer>
            <p data-testid="child">hello</p>
         </AppDrawer>
      );
      const checkbox = component.getByRole('checkbox');
      assert('checked' in checkbox);
      act(() => {
         checkbox.click();
      });
      expect(checkbox.checked).toBe(true);
      act(() => {
         checkbox.click();
      });
      expect(checkbox.checked).toBe(false);
   });

   it('should close drawer when any link is clicked', () => {
      const component = render(
         <AppDrawer>
            <p data-testid="child">hello</p>
         </AppDrawer>
      );
      const checkbox = component.getByRole('checkbox');
      assert('checked' in checkbox);

      const links = component.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
         act(() => {
            checkbox.click();
         });
         expect(checkbox.checked).toBe(true);
         act(() => {
            link.click();
         });
         expect(checkbox.checked).toBe(false);
      }
   });

   it('should call signOut function when Logout link is clicked', () => {
      const { getByText } = render(
         <AppDrawer>
            <p data-testid="child">hello</p>
         </AppDrawer>
      );
      const logoutLink = getByText('Logout');
      logoutLink.click();
      expect(mocks.nextAuth.signOut).toHaveBeenCalled();
   });
});
