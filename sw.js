// RetailOps 360 — Service Worker
const CACHE_NAME = 'retailops-v4';
const APP_SHELL  = ['./index.html'];

// Domaines externes — toujours réseau, jamais cache
const NETWORK_ONLY = [
  'api.emailjs.com',
  'emailjs.com',
  'api.anthropic.com',
  'api.notion.com',
  'cdn.jsdelivr.net',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Laisser passer les appels vers domaines externes (API, CDN...)
  if (NETWORK_ONLY.some(d => url.hostname.includes(d))) {
    e.respondWith(fetch(e.request));
    return;
  }

  // App shell : cache en priorité, réseau en fallback
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res && res.status === 200 && e.request.method === 'GET') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});

// Mise à jour forcée depuis l'app
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
