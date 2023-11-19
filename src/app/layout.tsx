/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * The main layout that wraps the entire application
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth';
import { AppDrawer, NavBar } from '@/components';
import { SessionProvider } from '@/components';
import Login from './login/page';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
   title: 'Media',
   description: 'Media Browser',
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
   const session = await getServerSession();
   return (
      <html lang="en" data-theme="business">
         <body className={inter.className}>
            {session?.user?.email ? (
               <SessionProvider session={session}>
                  <AppDrawer>
                     <NavBar />
                     {children}
                  </AppDrawer>
               </SessionProvider>
            ) : (
               <Login />
            )}
         </body>
      </html>
   );
};

export default RootLayout;
