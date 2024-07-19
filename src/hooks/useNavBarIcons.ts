/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A react hook for updating the icons displayed in the nav bar
 */

import { useContext, useEffect } from 'react';
import { NavBarIconContext } from '@/context';

export const useNavBarIcons = (icons: NavBarIcon[]) => {
   const setNavBarIcons = useContext(NavBarIconContext);
   useEffect(() => {
      setNavBarIcons(icons);
      return () => {
         setNavBarIcons([]);
      };
   }, [icons, setNavBarIcons]);
};
