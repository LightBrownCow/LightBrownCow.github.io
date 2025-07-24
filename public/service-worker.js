const CACHE_NAME = `pwa-shell-313414`;
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.png",
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  console.log("Installing service worker and caching files...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching:", FILES_TO_CACHE);
      return cache.addAll(FILES_TO_CACHE);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches
        .match(event.request)
        .then((cached) => cached || caches.match("/index.html")),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      const cached = await cache.match(event.request);
      if (cached) return cached;

      try {
        const response = await fetch(event.request);
        if (
          event.request.method === "GET" &&
          event.request.url.startsWith(self.location.origin + "/assets/")
        ) {
          cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        return caches.match("/index.html");
      }
    })(),
  );
});
