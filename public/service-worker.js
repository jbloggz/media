/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * This file contains the service worker for the PWA.
 */

self.addEventListener('activate', (event) => {
   event.waitUntil(self.clients.claim());
});

self.addEventListener('push', async (event) => {
   const data = event.data.json();

   if (data.type !== 'example_notification') {
      /* Ignore */
      return;
   }
   const title = 'Example Notification';
   const body = 'Some text to display';
   const icon = '/favicon.ico';
   const badge = '/badge.png';
   event.waitUntil(self.registration.showNotification(title, { body, icon, badge }));
});

self.addEventListener('notificationclick', (event) => {
   /* Open the home page when a notification is clicked */
   console.log(event);
   event.notification.close();
   event.waitUntil(self.clients.openWindow('/'));
});
