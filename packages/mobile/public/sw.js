/**
 * Service worker for PWA functionality
 * Caches static assets and API responses
 */

const CACHE_NAME = "bluepilot-v1";
const STATIC_CACHE = "bluepilot-static-v1";
const API_CACHE = "bluepilot-api-v1";

// Static assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// API endpoints that can be cached
const CACHEABLE_API_PATTERNS = [
  /\/api\/agent\/policy/,
  /\/api\/agent\/history/,
];

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    // For API requests, use network-first with cache fallback
    if (CACHEABLE_API_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            // Clone and cache successful responses
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(API_CACHE).then((cache) => cache.put(request, responseClone));
            }
            return response;
          })
          .catch(() => {
            // Fallback to cache
            return caches.open(API_CACHE).then((cache) => cache.match(request));
          })
      );
      return;
    }
    return;
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches
      .match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        return new Response("Offline - Please check your connection", {
          status: 503,
          statusText: "Service Unavailable",
          headers: new Headers({ "Content-Type": "text/plain" }),
        });
      })
  );
});

// Handle messages from clients
self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "CACHE_URL") {
    event.waitUntil(
      caches.open(STATIC_CACHE).then((cache) => cache.add(event.data.url))
    );
  }
});

export {};
