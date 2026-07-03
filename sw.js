const CACHE_NAME = "lunaplate-static-20260703-p1-1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/styles.css?v=20260630-profile-serene-local2",
  "/cycle-store.js?v=20260703-p1-1",
  "/app.js?v=20260703-p1-1b",
  "/i18n.js?v=20260630-profile-serene-local2",
  "/manifest.webmanifest",
  "/assets/lunaplate-logo.png",
  "/assets/pwa/icon-192.png",
  "/assets/pwa/icon-512.png",
  "/assets/pwa/icon-maskable-192.png",
  "/assets/pwa/icon-maskable-512.png",
  "/assets/movement/breath.webp",
  "/assets/movement/butterfly.webp",
  "/assets/movement/cat-cow.webp",
  "/assets/movement/child-pose.webp",
  "/assets/movement/forward-fold.webp",
  "/assets/movement/hip-rock.webp",
  "/assets/movement/legs-wall.webp",
  "/assets/movement/mindful-walk.webp",
  "/assets/movement/neck-release.webp",
  "/assets/movement/shoulder-rolls.webp",
  "/assets/movement/side-stretch.webp",
  "/assets/movement/twist.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (event.request.method === "GET" && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
