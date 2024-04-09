/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for settings/page.tsx
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import Settings from './page';

describe('Settings', () => {
   it('should render the Settings page', () => {
      const component = render(<Settings />);
      expect(component.getByText('Settings')).toBeInTheDocument();
   });
});
