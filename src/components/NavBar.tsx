/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The main navigation bar at the top of the page
 */

import { NavUserMenu } from "@/components";
import { getServerSession } from "next-auth";

const NavBar = async () => {
   const session = await getServerSession();
   const email = session?.user?.email || '';

   return (
      <nav className="w-full navbar bg-base-100">
         <div className="flex-none">
            <label htmlFor="app-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
               </svg>
            </label>
         </div>
         <div className="flex-1 px-2 mx-2">Media Browser</div>
         <NavUserMenu email={email} />
      </nav>
   );
};

export default NavBar;
