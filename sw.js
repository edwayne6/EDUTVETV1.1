/**
 * Service Worker for EDUTVET
 * Handles offline support, HTTP caching, and asset caching
 */

const CACHE_NAME = 'edutvet-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/documents.html',
  '/admin.html',
  '/privacy-policy.html',
  '/terms-of-service.html',
  '/cookie-policy.html',
  '/styles.css',
  '/tailwind.config.js',
  '/scripts/scripts.js',
  '/scripts/tracker.js',
  '/scripts/analytics.js',
  '/scripts/scroll-animations.js',
  '/scripts/cache-manager.js',
  '/scripts/config.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('Some assets failed to cache:', err);
          // Fail silently - not all assets need to be cached
        });
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim()) // Control existing clients
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external URLs
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - network first with 10 second timeout
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      Promise.race([
        fetch(request),
        new Promise((resolve) => setTimeout(() => resolve(null), 10000))
      ])
        .then((response) => {
          if (response && response.ok) {
            // Clone and cache successful API responses
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
            return response;
          }
          // If network fails, try cache
          return caches.match(request)
            .then((cached) => cached || response);
        })
        .catch(() => caches.match(request)) // Fall back to cache
    );
    return;
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) {
          // Return cached but also update in background
          if (request.method === 'GET' && !url.pathname.includes('?' )) {
            fetch(request).then((response) => {
              if (response && response.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response);
                });
              }
            }).catch(() => {}); // Ignore errors in background update
          }
          return cached;
        }

        // Not in cache, try network
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response && response.ok && request.method === 'GET') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Offline - return cached or offline page
            return caches.match(request)
              .then((cached) => cached || createOfflineResponse());
          });
      })
  );
});

// Create offline response
function createOfflineResponse() {
  return new Response(
    '<!DOCTYPE html><html><head><title>Offline</title></head><body>' +
    '<h1>You are offline</h1><p>This page is not available offline. Please check your connection.</p>' +
    '</body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  );
}

// Handle push notifications (if implemented)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New notification',
    icon: '/icon.png',
    badge: '/badge.png',
    tag: 'edutvet-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'EduTVET', options)
  );
});
