/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The dropdown menu for the user on the right of the navigation bar
 */
'use client';

import { signOut } from 'next-auth/react';
import { useToggle } from '@/hooks';
import { AboutDialog } from '.';
import { useSession } from '@/hooks';

export const NavUserMenu = () => {
   const about = useToggle();
   const session = useSession();
   const email = session.user?.email || '';

   return (
      <>
         <div className="dropdown dropdown-bottom dropdown-end">
            <button tabIndex={0} className="btn m-1 btn-circle btn-ghost">
               <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-8">
                     <span className="text-md">{email.substring(0, 1).toUpperCase()}</span>
                  </div>
               </div>
            </button>
            <ul onClick={(e) => e.currentTarget.blur()} tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box">
               <li className="!cursor-default disabled active:disabled">
                  <span>{email}</span>
               </li>
               <li>
                  <a onClick={about.show}>About</a>
               </li>
               <div className="divider m-0 p-0 my-2"></div>
               <li>
                  <a onClick={() => signOut()}>Logout</a>
               </li>
            </ul>
         </div>
         <AboutDialog show={about.enabled} onClose={about.hide} />
      </>
   );
};
