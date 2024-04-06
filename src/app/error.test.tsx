/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for error.tsx
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import ErrorComponent from './error';

describe('Error', () => {
   it('should render null when error is defined', () => {
      const error = new Error('Test error');
      const reset = jest.fn();
      const component = render(<ErrorComponent error={error} reset={reset} />);
      expect(component.queryByText(error.message)).toBeNull();
   });

   it('should render null when error message is undefined', () => {
      const error = { message: 'test-digest', name: 'foo' };
      const reset = jest.fn();
      const component = render(<ErrorComponent error={error} reset={reset} />);
      expect(component.queryByText(error.message)).toBeNull();
   });
});
