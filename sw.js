const CACHE_NAME = 'ukr-fishing-v3-boat-photos';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css?v=boat-photos-3',
  './lang.js?v=boat-photos-3',
  './script.js?v=boat-photos-3',
  './manifest.json',
  './assets/ui/keepnet-icon.png',
  './assets/ui/base-icon.png',
  './assets/ui/profile-icon.png',
  './assets/ui/journal-icon.png',
  './assets/ui/fishing-base-hub.png',
  './assets/boats/rowboat-card.png',
  './assets/boats/rowboat-detail.png',
  './assets/boats/motorboat-card.png',
  './assets/boats/motorboat-detail.png',
  './assets/boats/cutter-card.png',
  './assets/boats/cutter-detail.png',
  './assets/boats/yacht-card.png',
  './assets/boats/yacht-detail.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('Cache addAll warning:', err));
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Network-first strategy for HTML, JS, and CSS so code updates apply immediately
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for images and static media
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => cached);
    })
  );
});
