const CACHE_NAME = "jubla-reporting-v1.1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/strikes.html",
  "/site.webmanifest",
  "/assets/images/favicon.ico",
  "/assets/css/main.css",
  "/assets/css/strikes.css",
  "/assets/js/api-client.js",
  "/assets/js/config.js",
  "/assets/js/ui-controller.js",
  "/assets/js/validation.js",
  "/assets/js/reporting.js",
  "/assets/js/strikes-ui.js",
  "/assets/fonts/Nunito-VariableFont_wght.ttf",
  "/assets/fonts/Nunito-Italic-VariableFont_wght.ttf",
  "/assets/vendor/fontawesome/css/all.min.css",
  "/assets/vendor/fontawesome/webfonts/fa-solid-900.woff2",
  "/assets/vendor/fontawesome/webfonts/fa-regular-400.woff2",
  "/assets/vendor/fontawesome/webfonts/fa-brands-400.woff2"
];

// ── Install: Cache assets ──────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("Fehler beim Caching von Assets:", err);
      });
    }),
  );
  self.skipWaiting();
});

// ── Activate: Clean old caches ─────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// ── Fetch: Cache-first for assets, network-first for API ───
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API-Aufrufe: Network-first
  if (url.pathname.includes("/.netlify/")) {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => {
          return new Response(
            JSON.stringify({
              ok: false,
              error: "Offline – API nicht verfügbar",
            }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          );
        }),
    );
    return;
  }

  // Statische Assets: Cache-first
  event.respondWith(
    caches
      .match(request)
      .then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const responseToCache = response.clone();
          if (request.url.startsWith("http")) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }

          return response;
        });
      })
      .catch(() => {
        return caches.match("/index.html");
      }),
  );
});
