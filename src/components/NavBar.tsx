/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The main navigation bar at the top of the page
 */

import { NavUserMenu } from '@/components';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { getServerSession } from 'next-auth';

const NavBar = async () => {
   const session = await getServerSession();
   const email = session?.user?.email || '';

   return (
      <nav className="w-full navbar bg-base-100">
         <div className="flex-none">
            <label htmlFor="app-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost">
               <Bars3Icon className="w-6 h-6" />
            </label>
         </div>
         <div className="flex-1 px-2 mx-2">Media Browser</div>
         <NavUserMenu email={email} />
      </nav>
   );
};

export default NavBar;
