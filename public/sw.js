// Service Worker for Offline Support
const CACHE_NAME = "malik-tech-dairy-v1";
const OFFLINE_URL = "/offline.html";

const urlsToCache = [
  "/",
  "/dashboard",
  "/dashboard/animals",
  "/dashboard/milk",
  "/offline.html",
  "/manifest.json",
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip API requests
  if (event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(event.request).catch(() => {
          // If offline and request is a navigation, show offline page
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
        })
      );
    })
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-milk-logs") {
    event.waitUntil(syncMilkLogs());
  }
});

async function syncMilkLogs() {
  // Get pending logs from IndexedDB
  // Send to server
  // Clear from IndexedDB on success
}

