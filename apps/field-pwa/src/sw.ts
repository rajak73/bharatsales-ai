import { clientsClaim } from 'workbox-core';

// This lets the service worker immediately claim the clients
clientsClaim();

declare const self: any;

// This will be replaced by the Vite PWA plugin with the pre-cache manifest
const precacheManifest = (self as any).__WB_MANIFEST;
if (precacheManifest) {
  console.log('Precache manifest present', precacheManifest.length, 'items');
}

// Ensure the service worker activates immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event: any) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('sync', (event: any) => {
  console.log('[Service Worker] Background sync event triggered:', event.tag);
  if (event.tag === 'bharatsales-sync') {
    console.log('[Service Worker] Starting bharatsales-sync...');
    event.waitUntil(
      (async () => {
        // Find all open clients (the PWA windows)
        const clients = await self.clients.matchAll({ type: 'window' });
        
        if (clients && clients.length > 0) {
          console.log('[Service Worker] Sending TRIGGER_SYNC message to client window');
          // Tell the first open client to run the Dexie sync logic
          clients[0].postMessage({ type: 'TRIGGER_SYNC' });
        } else {
          console.log('[Service Worker] No open windows found to handle sync.');
          // True headless background sync would require running Dexie inside the SW context.
          // For now, postMessage to the client is safer since Dexie is already loaded there.
        }
      })()
    );
  }
});

// Handle push notifications (optional future feature)
self.addEventListener('push', (event: any) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/favicon.svg'
      })
    );
  }
});
