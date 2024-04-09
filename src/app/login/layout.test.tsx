/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for settings/page.tsx
 */

import { ReactNode } from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import mocks from '@/mocks';
import LoginLayout from './layout';

/* Since LoginLayout is an async component, we need this hack to resolve it, or jest complains */
const awaitComponent = async (children: ReactNode) => {
   const LoginLayoutResolved = await LoginLayout({ children });
   return () => LoginLayoutResolved;
};

describe('LoginLayout', () => {
   it('should render the Layout and redirect ro credentials login by default', async () => {
      const ResolvedLoginLayout = await awaitComponent(<div>hello</div>);
      const component = render(<ResolvedLoginLayout />);
      expect(component.queryByText('hello')).not.toBeInTheDocument();
      expect(mocks.nextNavigation.redirect).toHaveBeenCalledWith('/api/auth/signin');
   });

   it('should not redirect to credentials login if useing google auth', async () => {
      process.env.NEXTAUTH_PROVIDER = 'google';
      const ResolvedLoginLayout = await awaitComponent(<div>hello</div>);
      const component = render(<ResolvedLoginLayout />);
      expect(component.getByText('hello')).toBeInTheDocument();
      expect(mocks.nextNavigation.redirect).not.toHaveBeenCalled();
   });
});
