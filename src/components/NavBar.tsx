/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * The main navigation bar at the top of the page
 */

const NavBar = () => {
   return (
      <nav className="navbar bg-base-100">
         <div className="flex-none">
            <button className="btn btn-square btn-ghost rounded-md">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
               </svg>
            </button>
         </div>
         <div className="flex-1">
            <p className="text-xl pl-2">Media Browser</p>
         </div>
         <div className="dropdown dropdown-bottom dropdown-end">
            <label tabIndex={0} className="btn m-1 btn-circle btn-ghost">
               <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-8">
                     <span className="text-md">K</span>
                  </div>
               </div>
            </label>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-32">
               <li>
                  <a>Logout</a>
               </li>
            </ul>
         </div>
      </nav>
   );
};

export default NavBar;
