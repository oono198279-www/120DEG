// sw.js - 120DEG PWA
const CACHE_VERSION = 'v1.0.0';
const APP_CACHE = `app-cache-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  '/120DEG/',
  '/120DEG/index.html',
  '/120DEG/manifest.webmanifest',
  '/120DEG/icons/icon-192.png',
  '/120DEG/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => (key !== APP_CACHE ? caches.delete(key) : null)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== location.origin) return;

  // HTMLはnetwork-first
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req).then(res => {
        const resClone = res.clone();
        caches.open(APP_CACHE).then(c => c.put(req, resClone));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // その他はcache-first + 背景更新
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        fetch(req).then(res => caches.open(APP_CACHE).then(c => c.put(req, res))).catch(()=>{});
        return cached;
      }
      return fetch(req).then(res => {
        const resClone = res.clone();
        caches.open(APP_CACHE).then(c => c.put(req, resClone));
        return res;
      });
    })
  );
});
