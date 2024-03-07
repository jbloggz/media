import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
   return {
      name: 'Media',
      short_name: 'Media',
      start_url: '/',
      display: 'standalone',
      description: 'A app to manage your media files',
      lang: 'en',
      dir: 'auto',
      theme_color: '#000000',
      background_color: '#000000',
      orientation: 'any',
      display_override: ['window-controls-overlay'],
      icons: [
         {
            src: '/favicon-256x256.png',
            sizes: '256x256',
            type: 'image/png',
            purpose: 'maskable',
         },
         {
            src: '/favicon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
         },
      ],
      screenshots: [
         {
            src: '/screen1.png',
            sizes: '494x570',
            type: 'image/png',
         },
      ],
      related_applications: [],
      prefer_related_applications: false,
   };
}
