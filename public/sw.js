const CACHE_NAME = 'baronne-malia-v2';

// Detect the base path from the service worker's location
// e.g. /BaronneMalia/ or /
const BASE = self.location.pathname.replace(/\/sw\.js$/, '/') || '/';

const ASSETS_TO_CACHE = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon-192x192.png',
  BASE + 'icon-512x512.png'
];

// Install: cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: network-first for Supabase API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // NETWORK-FIRST for Supabase API calls (always fetch fresh data)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).then((response) => {
        return response;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // CACHE-FIRST for static assets (HTML, CSS, JS, icons)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || event.request.method !== 'GET') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match(BASE + 'index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
