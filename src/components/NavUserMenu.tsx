/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The dropdown menu for the user on the right of the navigation bar
 */
'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';

export const NavUserMenu = (props: { email: string }) => {
   return (
      <div className="dropdown dropdown-bottom dropdown-end">
         <button tabIndex={0} className="btn m-1 btn-circle btn-ghost">
            <div className="avatar placeholder">
               <div className="bg-neutral text-neutral-content rounded-full w-8">
                  <span className="text-md">{props.email.substring(0, 1).toUpperCase()}</span>
               </div>
            </div>
         </button>
         <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box">
            <li className="!cursor-default disabled">
               <a>{props.email}</a>
               <div className="divider m-0 p-0 mt-2"></div>
            </li>
            <li>
               <Link href="/settings" onClick={(e) => e.currentTarget.blur()}>
                  Settings
               </Link>
            </li>
            <li>
               <a onClick={() => signOut()}>Logout</a>
            </li>
         </ul>
      </div>
   );
};
