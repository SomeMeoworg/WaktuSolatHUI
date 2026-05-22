const CACHE_NAME = 'waktu-solat-static-v2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/malaysia-jakim.geojson'
];

// On install, precache core app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass service worker cache for non-GET requests or APIs/external services
  if (event.request.method !== 'GET') return;
  
  // Explicitly ignore Cloudflare Page API requests - these are cached at the DB layer
  if (requestUrl.pathname.startsWith('/api/')) return;
  
  // Only handle HTTP/HTTPS protocols
  if (!event.request.url.startsWith('http')) return;

  // Stale-While-Revalidate strategy for root index.html to ensure background updates
  if (requestUrl.pathname === '/' || requestUrl.pathname === '/index.html') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => null);
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Cache-First strategy for static assets (Vite assets, styles, JS, fonts, audio, icons)
  const isStaticAsset = 
    requestUrl.pathname.includes('/assets/') ||
    requestUrl.pathname.includes('/audio/') ||
    requestUrl.pathname.includes('/icons/') ||
    event.request.url.match(/\.(js|css|woff2|ttf|png|jpg|jpeg|svg|ico)$/) ||
    event.request.url.includes('fonts.googleapis.com') ||
    event.request.url.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Network-First with cache fallback for other same-origin requests (like GEOJSON map files)
  if (requestUrl.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});
