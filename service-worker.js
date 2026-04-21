const CACHE_NAME = "jubla-reporting-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/site.webmanifest",
  "/favicon.ico",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
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

  // API-Aufrufe: Network-first (aktuellste Daten)
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
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => {
        // Offline: Fallback auf Startseite
        return caches.match("/index.html");
      }),
  );
});
