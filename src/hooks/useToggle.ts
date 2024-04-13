/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A react hook for toggling state
 */

import { useState } from 'react';

export const useToggle = (initial: boolean = false) => {
   const [enabled, setEnabled] = useState(initial);

   return {
      enabled,
      show: () => setEnabled(true),
      hide: () => setEnabled(false),
      toggle: () => setEnabled(!enabled),
   };
};
