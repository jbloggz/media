/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for Select.tsx
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { ImageSkeleton } from '.';

describe('ImageSkeleton', () => {
   it('should render a ImageSkeleton component successfully', () => {
      const wrapper = render(<ImageSkeleton />);
      const svgElement = wrapper.getByRole('img', { hidden: true });
      expect(svgElement).toBeInTheDocument();
   });
});
