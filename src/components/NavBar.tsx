/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The main navigation bar at the top of the page
 */
'use client';

import { cloneElement } from 'react';
import { NavUserMenu } from '@/components';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface NavBarProps {
   icons: NavBarIcon[];
}

export const NavBar = (props: NavBarProps) => {
   return (
      <nav className="w-full navbar bg-base-100">
         <div className="flex-none">
            <label htmlFor="app-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost">
               <Bars3Icon className="w-6 h-6" />
            </label>
         </div>
         <div className="flex-1 px-2 mx-2">Media Browser</div>
         {props.icons.map((icon, idx) => (
            <button key={idx} className="btn btn-circle opacity-70 hover:opacity-100" onClick={icon.onClick}>
               {cloneElement(icon.elem, { className: 'w-6 h-6' })}
            </button>
         ))}
         <NavUserMenu />
      </nav>
   );
};
