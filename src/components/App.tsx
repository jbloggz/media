/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The top level App component
 */
'use client';

import { PropsWithChildren, useState } from 'react';
import { Session } from 'next-auth';
import { AppDrawer, NavBar } from '@/components';
import { NavBarIconContext, SessionContext } from '@/context';

interface AppProps {
   /* The email of the logged in user */
   session: Session;
}

export const App = (props: PropsWithChildren<AppProps>) => {
   const [navBarIcons, setNavBarIcons] = useState<NavBarIcon[]>([]);

   return (
      <SessionContext.Provider value={props.session}>
         <NavBarIconContext.Provider value={setNavBarIcons}>
            <AppDrawer>
               <NavBar icons={navBarIcons} />
               {props.children}
            </AppDrawer>
         </NavBarIconContext.Provider>
      </SessionContext.Provider>
   );
};
