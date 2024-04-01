/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Unit tests for MediaInformation.tsx
 */

import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import { render } from '@testing-library/react';
import { MediaInformation } from '.';

const media: Media = {
   id: 1234,
   path: '/path/to/media.jpg',
   timestamp: 1634567890,
   type: 'image',
   make: 'Canon',
   model: 'EOS 5D Mark IV',
   height: 1080,
   width: 1920,
   size: 1024,
   latitude: 37.7749,
   longitude: -122.4194,
};

describe('MediaInformation', () => {
   it('should render the component with the correct media information', () => {
      const component = render(<MediaInformation media={media} />);

      expect(component.getByText('Filename')).toBeInTheDocument();
      expect(component.getByText('Timestamp')).toBeInTheDocument();
      expect(component.getByText('Media Type')).toBeInTheDocument();
      expect(component.getByText('Camera (make/model)')).toBeInTheDocument();
      expect(component.getByText('Height (pixels)')).toBeInTheDocument();
      expect(component.getByText('Width (pixels)')).toBeInTheDocument();
      expect(component.getByText('File Size (bytes)')).toBeInTheDocument();
      expect(component.getByRole('tab', { name: 'General' })).toHaveClass('tab-active');
   });

   it('should display "Unknown" when camera make and model are not available', () => {
      media.make = undefined;
      media.model = undefined;
      const component = render(<MediaInformation media={media} />);

      expect(component.getByText('Camera (make/model)').parentElement?.nextSibling).toHaveTextContent('Unknown');
   });

   it('should default to showing the General tab', () => {
      const component = render(<MediaInformation media={media} />);
      expect(component.getByRole('tab', { name: /general/i, hidden: true })).toHaveClass('tab-active');
   });

   it('should show the Size tab when clicked', () => {
      const component = render(<MediaInformation media={media} />);
      const sizeTab = component.getByRole('tab', { name: /size/i, hidden: true });
      expect(sizeTab).not.toHaveClass('tab-active');
      act(() => {
         sizeTab.click();
      });
      expect(sizeTab).toHaveClass('tab-active');
   });

   it('should show the Map tab when clicked', () => {
      const component = render(<MediaInformation media={media} />);
      const mapTab = component.getByRole('tab', { name: /map/i, hidden: true });
      expect(mapTab).not.toHaveClass('tab-active');
      act(() => {
         mapTab.click();
      });
      expect(mapTab).toHaveClass('tab-active');
   });

   it('should show the Tags tab when clicked', () => {
      const component = render(<MediaInformation media={media} />);
      const tagsTab = component.getByRole('tab', { name: /tags/i, hidden: true });
      expect(tagsTab).not.toHaveClass('tab-active');
      act(() => {
         tagsTab.click();
      });
      expect(tagsTab).toHaveClass('tab-active');
   });

   it('should show the General tab when clicked', () => {
      const component = render(<MediaInformation media={media} />);
      const tagsTab = component.getByRole('tab', { name: /tags/i, hidden: true });
      expect(tagsTab).not.toHaveClass('tab-active');
      act(() => {
         tagsTab.click();
      });
      expect(tagsTab).toHaveClass('tab-active');
      const generalTab = component.getByRole('tab', { name: /general/i, hidden: true });
      expect(generalTab).not.toHaveClass('tab-active');
      act(() => {
         generalTab.click();
      });
      expect(generalTab).toHaveClass('tab-active');
   });
});
