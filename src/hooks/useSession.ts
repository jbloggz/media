/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A react hook for getting the current user session
 */

import { useContext } from 'react';
import { SessionContext } from '@/context';

export const useSession = () => {
   return useContext(SessionContext);
};
