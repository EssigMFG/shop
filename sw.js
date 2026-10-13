// Essig MFG Shop launcher: service worker.
// Android Chrome and Windows Edge/Chrome only offer "Install app" when a page
// has one. It caches the launcher's own small files so the icon opens instantly;
// the My Tasks page itself (script.google.com) is never cached.
// Bump VERSION whenever a launcher file changes, so phones pick up the new copy.
const VERSION = "essig-shop-v3";   // v3 (10/13): all install steps listed, phones first
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first (so updates show up), cached copy when offline. Same-site GETs only.
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(fetch(e.request)
    .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return res; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
