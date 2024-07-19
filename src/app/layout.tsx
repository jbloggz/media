/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The main layout that wraps the entire application
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth';
import { ToastContainer } from 'react-toastify';
import Script from 'next/script';
import { App } from '@/components';
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
         <body className={inter.className} style={{ overscrollBehavior: 'none' }}>
            {session?.user?.email ? <App session={session}>{children}</App> : <Login />}
            <ToastContainer stacked autoClose={false} draggable theme="dark" />
            <Script id="sw">{`if (navigator.serviceWorker) {navigator.serviceWorker.register('/service-worker.js');}`}</Script>
         </body>
      </html>
   );
};

export default RootLayout;
