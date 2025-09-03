// Service Worker for FinancePro PWA
const CACHE_NAME = 'financepro-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Resources to cache for offline functionality
const STATIC_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
  // Add critical CSS and JS files during build
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  '/api/projects',
  '/api/dashboard/metrics',
  '/api/auth/me'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Handle API requests with cache-first strategy for GET requests
  if (url.pathname.startsWith('/api/')) {
    if (request.method === 'GET' && shouldCacheAPI(url.pathname)) {
      event.respondWith(
        caches.open(CACHE_NAME)
          .then((cache) => {
            return cache.match(request)
              .then((cachedResponse) => {
                if (cachedResponse) {
                  // Return cached version and update in background
                  fetch(request)
                    .then((response) => {
                      if (response.status === 200) {
                        cache.put(request, response.clone());
                      }
                    })
                    .catch(() => {
                      // Network failed, cached version is still valid
                    });
                  return cachedResponse;
                }
                
                // No cache, fetch from network
                return fetch(request)
                  .then((response) => {
                    if (response.status === 200) {
                      cache.put(request, response.clone());
                    }
                    return response;
                  })
                  .catch(() => {
                    // Return a basic offline response for API calls
                    return new Response(
                      JSON.stringify({ 
                        error: 'Offline', 
                        message: 'This data is not available offline' 
                      }),
                      {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                      }
                    );
                  });
              });
          })
      );
      return;
    }
  }

  // Handle static assets with cache-first strategy
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            });
        })
    );
    return;
  }

  // Default: network-first strategy
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Helper function to determine if API endpoint should be cached
function shouldCacheAPI(pathname) {
  return API_CACHE_PATTERNS.some(pattern => pathname.includes(pattern));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'expense-sync') {
    event.waitUntil(syncExpenses());
  }
  
  if (event.tag === 'project-sync') {
    event.waitUntil(syncProjects());
  }
});

// Sync offline expenses when back online
async function syncExpenses() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const offlineActions = await cache.match('/offline-actions');
    
    if (offlineActions) {
      const actions = await offlineActions.json();
      
      for (const action of actions.expenses || []) {
        try {
          await fetch('/api/charge-history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(action.data)
          });
        } catch (error) {
          console.error('Failed to sync expense:', error);
        }
      }
      
      // Clear synced actions
      await cache.delete('/offline-actions');
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync offline project updates when back online
async function syncProjects() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const offlineActions = await cache.match('/offline-actions');
    
    if (offlineActions) {
      const actions = await offlineActions.json();
      
      for (const action of actions.projects || []) {
        try {
          const url = action.id ? `/api/projects/${action.id}` : '/api/projects';
          const method = action.id ? 'PUT' : 'POST';
          
          await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(action.data)
          });
        } catch (error) {
          console.error('Failed to sync project:', error);
        }
      }
      
      // Clear synced actions
      await cache.delete('/offline-actions');
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const options = {
    body: 'You have new financial updates',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View Dashboard'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  if (event.data) {
    const payload = event.data.json();
    options.body = payload.message || options.body;
    options.data.url = payload.url || options.data.url;
  }

  event.waitUntil(
    self.registration.showNotification('FinancePro', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});