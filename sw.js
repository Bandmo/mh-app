// Caches the app shell so it opens instantly. Data always comes live from
// the Sheet; only these files are cached. Bump VERSION when index.html changes.
const VERSION = 'mh-10-17';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  // cache:'reload' so install bypasses the browser's own HTTP cache --
  // GitHub Pages serves these with max-age=600, which is why a fresh
  // upload could still install the old index.html for ten minutes.
  e.waitUntil(caches.open(VERSION).then(c =>
    c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // never touch Apps Script calls
  // Network first so a new deploy shows up; cache if offline.
  // Same reason: go past the HTTP cache on the network-first leg too.
  e.respondWith(fetch(new Request(e.request, { cache: 'no-cache' })).then(r => {
    const copy = r.clone();
    caches.open(VERSION).then(c => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request)));
});
