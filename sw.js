// ---------------------------
// ACTIVATE → delete ALL old caches
// ---------------------------
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Skip waiting to ensure the new service worker takes over immediately
self.addEventListener('install', event => {
  self.skipWaiting();
});

// No fetch handler to avoid any caching logic