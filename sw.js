/* Service worker: offline support for the Insight PWA.
   The CACHE name is bumped automatically from package.json by
   scripts/prepare-www.cjs (APK build) and the GitHub Pages workflow,
   so every release invalidates the offline cache. */
const CACHE = "insight-v1.1.0";
const CORE = [
  "./",
  "./index.html",
  "./css/base.css",
  "./css/app.css",
  "./css/screens.css",
  "./js/main.js",
  "./js/dom.js",
  "./js/i18n.js",
  "./js/state.js",
  "./js/colors.js",
  "./js/storage.js",
  "./js/screens/setup.js",
  "./js/screens/chooseSubject.js",
  "./js/screens/gameplay.js",
  "./js/screens/session.js",
  "./js/screens/final.js",
  "./i18n/en.json",
  "./i18n/fa.json",
  "./data/words.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (e) =>
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting()),
  ),
);

self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  ),
);

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((res) => {
          // Cache same-origin successful responses for next time.
          if (
            res &&
            res.status === 200 &&
            new URL(e.request.url).origin === self.location.origin
          ) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match("./index.html"));
    }),
  );
});
