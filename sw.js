/**
 * Service Worker for Edu-TVET
 * Handles offline support, HTTP caching, and asset caching
 */

const CACHE_NAME = 'edu-tvet-v1';
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

const EXTERNAL_ASSETS = [
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://kit.fontawesome.com/a076d05399.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        const cachePromises = [
          cache.addAll(STATIC_ASSETS).catch((err) => {
            console.warn('Some static assets failed to cache:', err);
          })
        ];
        
        // Cache external assets
        EXTERNAL_ASSETS.forEach((url) => {
          cachePromises.push(
            fetch(url)
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch((err) => {
                console.warn('Failed to cache external asset:', url, err);
              })
          );
        });
        
        return Promise.all(cachePromises);
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

  // Handle external URLs for specific CDNs
  if (url.origin !== location.origin) {
    // Allow caching of known CDNs
    const allowedHosts = ['cdn.jsdelivr.net', 'kit.fontawesome.com', 'cdnjs.cloudflare.com'];
    if (allowedHosts.includes(url.hostname)) {
      event.respondWith(
        caches.match(request)
          .then((cached) => {
            if (cached) {
              return cached;
            }
            return fetch(request)
              .then((response) => {
                if (response && response.ok) {
                  const responseClone = response.clone();
                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone);
                  });
                }
                return response;
              })
              .catch(() => {
                // If CDN fails, return empty response
                return new Response('', { status: 404 });
              });
          })
      );
      return;
    }
    // Skip other external URLs
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
    tag: 'edu-tvet-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Edu-TVET', options)
  );
});
