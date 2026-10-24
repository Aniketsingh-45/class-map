// Class Map Service Worker (App Shell Cache)
const CACHE_NAME = "classmap-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/manifest.json",
  "/icon.svg",
  "/ux-patch.css",
  "/ux-patch.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Do not cache API POST/PUT calls or dynamic auth requests in Service Worker (IndexedDB handles queue)
  if (e.request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then((hit) => {
      return hit || fetch(e.request).catch(() => {
        // Fallback for navigation requests
        if (e.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});
