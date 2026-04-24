const CACHE_NAME = 'wigstyling-v4';

// ---------------------------
// INSTALL → activate immediately
// ---------------------------
self.addEventListener('install', event => {
  self.skipWaiting();
});

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

// ---------------------------
// FORCE UPDATE FROM CLIENT
// ---------------------------
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ---------------------------
// FETCH HANDLER
// ---------------------------
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // ---------------------------
  // 1. HTML → ALWAYS NETWORK (CRITICAL FIX)
  // ---------------------------
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }) // 🚀 FORCE fresh HTML
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // ---------------------------
  // 2. JS & CSS → NETWORK FIRST (NO STALE UI)
  // ---------------------------
  if (
    request.destination === 'script' ||
    request.destination === 'style'
  ) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, resClone);
          });
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ---------------------------
  // 3. Google Fonts → CACHE FIRST
  // ---------------------------
  if (
    url.origin.includes('fonts.googleapis.com') ||
    url.origin.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;

        return fetch(request).then(res => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, resClone);
          });
          return res;
        });
      })
    );
    return;
  }

  // ---------------------------
  // 4. CDN → NETWORK FIRST (avoid stale libs)
  // ---------------------------
  if (url.origin.includes('cdnjs.cloudflare.com')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, resClone);
          });
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ---------------------------
  // 5. Images → CACHE FIRST
  // ---------------------------
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;

        return fetch(request).then(res => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, resClone);
          });
          return res;
        });
      })
    );
    return;
  }

  // ---------------------------
  // 6. EVERYTHING ELSE → NETWORK FIRST
  // ---------------------------
  event.respondWith(
    fetch(request)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, resClone);
        });
        return res;
      })
      .catch(() => caches.match(request))
  );
});