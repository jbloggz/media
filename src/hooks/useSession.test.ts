/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for useSession.ts
 */

import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import { useSession } from '.';

describe('UseSession', () => {
   it('can get the session', () => {
      const session = renderHook(() => useSession());
      expect(session.result.current.expires).toBe('');
   });
});
