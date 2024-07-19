/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for layout.tsx
 */

import { ReactNode } from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import mocks from '@/mocks';
import RootLayout from './layout';
import GoogleLogin from './login/page';
import { App } from '../components/App';

jest.mock('../components/App', () => ({
   App: jest.fn().mockImplementation(({ children }) => <div data-testid="App">{children}</div>),
}));
jest.mock('../components/NavBar', () => ({
   NavBar: jest.fn().mockReturnValue(<div data-testid="NavBar"></div>),
}));
jest.mock('./login/page', () => ({
   __esModule: true,
   default: jest.fn().mockReturnValue(<div data-testid="Login"></div>),
}));

/* Since RootLayout is an async component, we need this hack to resolve it, or jest complains */
const awaitRootLayout = async (children: ReactNode) => {
   const RootLayoutResolved = await RootLayout({ children });
   return () => RootLayoutResolved;
};

const originalConsoleError = console.error.bind(console.error);

describe('RootLayout', () => {
   beforeEach(() => {
      console.error = (msg) => !msg.toString().includes('Warning: validateDOMNesting') && originalConsoleError(msg);
   });

   afterEach(() => {
      console.error = originalConsoleError;
   });

   it('should render the App if the user is logged in', async () => {
      mocks.nextAuth.getServerSession.mockResolvedValue({ user: { email: 'test@example.com' }, expires: '' });
      const RootLayoutResolved = await awaitRootLayout(<div>Test App</div>);
      const component = render(<RootLayoutResolved />);
      expect(component.getByText('Test App')).toBeInTheDocument();
   });

   it('should render the LoginPage if the user is not logged in', async () => {
      mocks.nextAuth.getServerSession.mockResolvedValue({});
      const RootLayoutResolved = await awaitRootLayout(<div>Test App</div>);
      render(<RootLayoutResolved />);
      expect(GoogleLogin as jest.Mock).toHaveBeenCalled();
      expect(App as jest.Mock).not.toHaveBeenCalled();
   });
});
