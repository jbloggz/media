/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for Select.tsx
 */

import react from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { Props } from 'react-select';
import mocks from '@/mocks';
import { Select } from '.';

const useStateSpy = jest.spyOn(react, 'useState');

describe('Select', () => {
   it('should render a ReactSelect component and pass through any props', () => {
      render(<Select placeholder="testing" />);
      expect(mocks.reactSelect.Select).toHaveBeenCalledWith(expect.objectContaining({ placeholder: 'testing' }), null);
   });

   it('should open menu on focus', () => {
      const setStateMock = jest.fn();
      useStateSpy.mockReturnValueOnce([false, setStateMock]);
      render(<Select />);
      const props = mocks.reactSelect.Select.mock.calls[0][0] as Props;
      act(() => {
         props.onFocus && props.onFocus({} as never);
      });
      expect(setStateMock).toHaveBeenCalledWith(true);
   });

   it('should close menu on blur', () => {
      const setStateMock = jest.fn();
      useStateSpy.mockReturnValueOnce([false, setStateMock]);
      render(<Select />);

      const props = mocks.reactSelect.Select.mock.calls[0][0] as Props;
      act(() => {
         props.onBlur && props.onBlur({} as never);
      });
      expect(setStateMock).toHaveBeenCalledWith(false);
   });

   it('should open menu when menu chevron is clicked and menu is not open', () => {
      const setStateMock = jest.fn();
      useStateSpy.mockReturnValueOnce([false, setStateMock]);
      const component = render(<Select />);
      const elem = component.getByRole('button');
      expect(elem).toBeInTheDocument();
      act(() => {
         elem.click();
      });
      expect(setStateMock).toHaveBeenCalledWith(true);
   });

   it('should close menu when menu chevron is clicked and menu is already open', () => {
      const setStateMock = jest.fn();
      useStateSpy.mockReturnValueOnce([true, setStateMock]);
      const component = render(<Select />);
      const elem = component.getByRole('button');
      expect(elem).toBeInTheDocument();
      act(() => {
         elem.click();
      });
      expect(setStateMock).toHaveBeenCalledWith(false);
   });
});
