/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for useNavBarIcons.ts
 */

import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import { useNavBarIcons } from '.';

describe('UseNavBarIcons', () => {
   it('can set nav bar icons', () => {
      const icons: NavBarIcon[] = [
         { elem: <div data-testid="icon1">J</div>, onClick: () => {} },
         { elem: <div data-testid="icon2">O</div>, onClick: () => {} },
         { elem: <div data-testid="icon3">E</div>, onClick: () => {} },
      ];

      renderHook(() => useNavBarIcons(icons));
   });
});
