const CACHE_NAME = 'lushycrown-dynamic-v2';

// Install
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate → clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // ---------------------------
  // 1. HTML → NETWORK FIRST
  // ---------------------------
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // ---------------------------
  // 2. Google Fonts → CACHE FIRST (they rarely change)
  // ---------------------------
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then(cached => {
        return cached || fetch(request).then(res => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, res.clone());
            return res;
          });
        });
      })
    );
    return;
  }

  // ---------------------------
  // 3. CDN (Cloudflare, etc.) → STALE WHILE REVALIDATE
  // ---------------------------
  if (url.origin.includes('cdnjs.cloudflare.com')) {
    event.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request).then(res => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, res.clone());
            return res;
          });
        });

        return cached || fetchPromise;
      })
    );
    return;
  }

  // ---------------------------
  // 4. Images (including Unsplash) → CACHE FIRST (with fallback)
  // ---------------------------
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(cached => {
        return (
          cached ||
          fetch(request)
            .then(res => {
              return caches.open(CACHE_NAME).then(cache => {
                // works even for opaque responses (no-cors)
                cache.put(request, res.clone());
                return res;
              });
            })
            .catch(() => cached)
        );
      })
    );
    return;
  }

  // ---------------------------
  // 5. Default → STALE WHILE REVALIDATE
  // ---------------------------
  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request)
        .then(res => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, res.clone());
            return res;
          });
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});