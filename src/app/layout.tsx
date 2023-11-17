/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * The main layout that wraps the entire application
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
   title: 'Media',
   description: 'Media Browser',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
   return (
      <html lang="en" data-theme="business">
         <body className={inter.className}>{children}</body>
      </html>
   );
};

export default RootLayout;
