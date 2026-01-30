const CACHE_NAME = "matcha-v1";
const STATIC_CACHE = "matcha-static-v1";
const DYNAMIC_CACHE = "matcha-dynamic-v1";

const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/login",
  "/favicon.ico",
  "/vercel.svg",
  "/file.svg",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("Service Worker: Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log("Service Worker: Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - network first, then cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response
          const responseClone = response.clone();
          // Cache the response
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === "error") {
          return response;
        }

        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      });
    })
  );
});

// Background sync for offline form submissions
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync", event.tag);
  
  if (event.tag === "sync-forms") {
    event.waitUntil(syncForms());
  }
});

async function syncForms() {
  // Get pending form submissions from IndexedDB
  // and submit them when online
  console.log("Syncing pending forms...");
}

// Push notifications
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push notification received");
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Matcha Notification";
  const options = {
    body: data.body || "You have a new notification",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: data,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked");
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || "/dashboard")
  );
});
