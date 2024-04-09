/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The layout for the login page
 */

import { redirect } from 'next/navigation';

const LoginLayout = async ({ children }: { children: React.ReactNode }) => {
   if (process.env.NEXTAUTH_PROVIDER !== 'google') {
      return redirect('/api/auth/signin');
   }

   return <>{children}</>;
};

export default LoginLayout;
