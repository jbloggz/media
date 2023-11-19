/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * The drawer that wraps the entire application
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';

const AppDrawer = (props: { children: React.ReactNode }) => {
   const [isOpen, setOpen] = useState(false);

   return (
      <div className="drawer">
         <input id="app-drawer" type="checkbox" className="drawer-toggle" checked={isOpen} onChange={(e) => setOpen(e.currentTarget.checked)} />
         <div className="drawer-content flex flex-col h-screen">
            {props.children}
         </div>
         <div className="drawer-side">
            <label htmlFor="app-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
            <ul className="menu p-4 w-3/5 min-h-full bg-base-200">
               <li>
                  <Link href="/" onClick={() => setOpen(false)}>
                     Browser
                  </Link>
               </li>
               <li>
                  <Link href="/settings" onClick={() => setOpen(false)}>
                     Settings
                  </Link>
               </li>
               <li>
                  <Link href="/logout" onClick={() => setOpen(false)}>
                     Logout
                  </Link>
               </li>
            </ul>
         </div>
      </div>
   );
};

export default AppDrawer;
