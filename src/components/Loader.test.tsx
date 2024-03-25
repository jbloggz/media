/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for Loader.tsx
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import mocks from '@/mocks';
import { Loader } from '.';

describe('Loader', () => {
   it('should render the loader by default', () => {
      const component = render(<Loader />);
      expect(component.container.childElementCount).toBeGreaterThan(0);
   });

   it('should not render the loader if isLoading is false', () => {
      const component = render(<Loader isLoading={false} />);
      expect(component.container.childElementCount).toEqual(0);
   });

   it('should not render children if isLoading is true', () => {
      const component = render(
         <Loader isLoading={true}>
            <p data-testid="test">hello</p>
         </Loader>
      );
      expect(component.queryByTestId('test')).not.toBeInTheDocument();
   });

   it('should not render children if isLoading is not defined', () => {
      const component = render(
         <Loader>
            <p data-testid="test">hello</p>
         </Loader>
      );
      expect(component.queryByTestId('test')).not.toBeInTheDocument();
   });

   it('should render children if isLoading is false', () => {
      const component = render(
         <Loader isLoading={false}>
            <p data-testid="test">hello</p>
         </Loader>
      );
      expect(component.queryByTestId('test')).toBeInTheDocument();
   });

   it('should create toast and not render children if there is an error', () => {
      const message = 'Oh no!!';
      const component = render(
         <Loader isLoading={false} error={{message}}>
            <p data-testid="test">hello</p>
         </Loader>
      );
      expect(component.queryByTestId('test')).not.toBeInTheDocument();
      expect(mocks.reactToastify.toast.error).toHaveBeenCalledWith(message)
   });
});
