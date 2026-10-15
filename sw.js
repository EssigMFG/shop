// Essig MFG Shop launcher: service worker.
// Android Chrome and Windows Edge/Chrome only offer "Install app" when a page
// has one. It caches the launcher's own small files so the icon opens instantly;
// the My Tasks page itself (script.google.com) is never cached.
// Bump VERSION whenever a launcher file changes, so phones pick up the new copy.
const VERSION = "essig-shop-v9";   // v9 (10/15): first-open notification screen in index.html; v8: push notifications
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/apple-touch-icon.png?v=5"];

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

// NEW (10/15, H10): push notifications. The shop schedule script sends an encrypted message
// ({ title, body, url, tag }); show it, and open the app at that link when it's tapped. Reminders
// (due today, overdue, clock out, weekly, test) replace their previous copy; everything else stacks.
const REPLACE_TAGS = ["dueToday", "overdue", "clockOut", "weekly", "test"];

self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : "" }; }
  const opts = { body: d.body || "", icon: "icons/icon-192.png", data: { url: d.url || "./" } };
  if (REPLACE_TAGS.indexOf(d.tag) !== -1) { opts.tag = d.tag; opts.renotify = true; }
  e.waitUntil(self.registration.showNotification(d.title || "Essig MFG", opts));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(clients.openWindow(url));
});
