const CACHE_NAME = "mfs-pin-queue-v2";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; }).map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      const fetchPromise = fetch(event.request)
        .then(function(networkResponse) {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, copy); });
          }
          return networkResponse;
        })
        .catch(function() { return cached; });
      return cached || fetchPromise;
    })
  );
});
