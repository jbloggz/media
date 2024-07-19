/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for App.tsx
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { App } from '.';

describe('App', () => {
   it('should render the component', () => {
      const component = render(
         <App session={{ expires: '' }}>
            <p data-testid="child">hello</p>
         </App>
      );
      const elem = component.getByTestId('child');
      expect(elem).toBeInTheDocument();
   });
});
