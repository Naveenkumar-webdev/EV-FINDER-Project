// ======================================================
// EV Finder Mobile App - Service Worker (Offline & PWA)
// ======================================================

const CACHE_NAME = 'ev-finder-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './login.html',
  './register.html',
  './layout.html',
  './view-stations.html',
  './booking.html',
  './history.html',
  './profile.html',
  './recommendation.html',
  './admin-stations.html',
  './css/global.css',
  './css/index.css',
  './css/layout.css',
  './css/responsive.css',
  './css/admin.css',
  './css/view-stations.css',
  './css/booking.css',
  './css/history.css',
  './css/login.css',
  './css/register.css',
  './js/api.js',
  './js/responsive.js',
  './js/layout.js',
  './js/view-stations.js',
  './js/booking.js',
  './js/history.js',
  './js/login.js',
  './js/register.js',
  './manifest.json'
];

// Install Event - Pre-cache Core Mobile App Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching mobile app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Serve from Cache first, fallback to Network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
