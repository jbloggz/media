/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for ThumbnailImage.tsx
 */

import { act } from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { ThumbnailImage } from '.';

describe('ThumbnailImage', () => {
   it('should render only the skeleton when meta not provided', () => {
      const component = render(<ThumbnailImage />);
      const images = component.getAllByRole('img', { hidden: true });
      expect(images).toHaveLength(1);
      expect(images[0].tagName.toLowerCase()).toEqual('svg');
   });

   it('should render the image if meta is provided', () => {
      const component = render(<ThumbnailImage meta={{ id: 1234, type: 'image' }} />);
      const images = component.getAllByRole('img', { hidden: true });
      expect(images).toHaveLength(2);
      expect(images[0].tagName.toLowerCase()).toEqual('svg');
      expect(images[1].tagName.toLowerCase()).toEqual('img');
      expect((images[1] as HTMLImageElement).src.endsWith('id=1234')).toBeTruthy();
   });

   it('should render an overlay for videos', () => {
      const component = render(<ThumbnailImage meta={{ id: 1234, type: 'video', duration: 345 }} />);
      const images = component.getAllByRole('img', { hidden: true });
      expect(images).toHaveLength(3);
      expect(images[0].tagName.toLowerCase()).toEqual('svg');
      expect(images[1].tagName.toLowerCase()).toEqual('img');
      expect((images[1] as HTMLImageElement).src.endsWith('id=1234')).toBeTruthy();
      expect((images[2] as HTMLImageElement).src.endsWith('/play.png')).toBeTruthy();
   });

   it('should render an overlay when noOverlay prop is passed', () => {
      const component = render(<ThumbnailImage meta={{ id: 1234, type: 'video', duration: 345 }} noOverlay />);
      const images = component.getAllByRole('img', { hidden: true });
      expect(images).toHaveLength(2);
      expect(images[0].tagName.toLowerCase()).toEqual('svg');
      expect(images[1].tagName.toLowerCase()).toEqual('img');
      expect((images[1] as HTMLImageElement).src.endsWith('id=1234')).toBeTruthy();
   });

   it('should allow undefined duration for videos', () => {
      const component = render(<ThumbnailImage meta={{ id: 1234, type: 'video' }} />);
      const images = component.getAllByRole('img', { hidden: true });
      expect(images).toHaveLength(3);
      expect(images[0].tagName.toLowerCase()).toEqual('svg');
      expect(images[1].tagName.toLowerCase()).toEqual('img');
      expect((images[1] as HTMLImageElement).src.endsWith('id=1234')).toBeTruthy();
      expect((images[2] as HTMLImageElement).src.endsWith('/play.png')).toBeTruthy();
   });

   it('should have a pointer cursor if an onClick handler is defined', () => {
      const component = render(<ThumbnailImage meta={{ id: 1234, type: 'image' }} onClick={jest.fn()} />);
      const image = component.getAllByRole('img', { hidden: true })[1];
      expect(image).toHaveClass('cursor-pointer');
   });

   it('should not have a pointer cursor if an onClick handler is not defined', () => {
      const component = render(<ThumbnailImage meta={{ id: 1234, type: 'image' }} />);
      const image = component.getAllByRole('img', { hidden: true })[1];
      expect(image).not.toHaveClass('cursor-pointer');
   });

   it('should call onClick handler when the image is clicked', () => {
      const onClick = jest.fn();
      const component = render(<ThumbnailImage meta={{ id: 6745, type: 'image' }} onClick={onClick} />);
      const container = component.container.children[0] as HTMLElement;
      act(() => {
         container.click();
      });
      expect(onClick).toHaveBeenCalledWith(6745);
   });

   it('correctly renders the duration', async () => {
      const component = render(<ThumbnailImage meta={{ id: 1234, type: 'video', duration: 7362000 }} />);
      const duration = await component.findByText('02:02:42');
      expect(duration).toBeInTheDocument();
   });

   it('correctly renders undefined duration', async () => {
      const component = render(<ThumbnailImage meta={{ id: 1234, type: 'video' }} />);
      const duration = await component.findByText('00:00:00');
      expect(duration).toBeInTheDocument();
   });

   it('should have a circle icon if selection mode is enabled', () => {
      const component = render(<ThumbnailImage meta={{ id: 1234, type: 'image' }} onClick={jest.fn()} selectMode />);
      const image = component.getAllByRole('img', { hidden: true })[1];
      expect(image.nextElementSibling).toHaveClass('rounded-full');
   });

   it('should have a tick icon if selected', () => {
      const component = render(<ThumbnailImage meta={{ id: 1234, type: 'image' }} onClick={jest.fn()} selectMode selected />);
      const image = component.getAllByRole('img', { hidden: true })[1];
      expect(image.nextElementSibling?.nextElementSibling?.tagName).toBe('svg');
   });

});
