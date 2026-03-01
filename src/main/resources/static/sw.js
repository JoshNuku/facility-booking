const CACHE_NAME = "facility-booking-v1";
const ASSETS = [
    "/api/v1/login.html",
    "/api/v1/index.html",
    "/api/v1/admin.html",
    "/api/v1/styles.css",
    "/api/v1/api.js",
    "/api/v1/app-auth.js",
    "/api/v1/app-user.js",
    "/api/v1/app-admin.js",
    "/api/v1/icon.svg",
    "/api/v1/manifest.json"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Network-first for API calls (non-static resources)
    if (url.pathname.startsWith("/api/v1/") && !url.pathname.match(/\.(html|css|js|svg|json)$/)) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-first for static assets
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});
