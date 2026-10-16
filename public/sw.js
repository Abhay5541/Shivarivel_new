const CACHE_NAME = 'shivarivel-erp-v1';

// Static assets to pre-cache for instant loading
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/logo.png',
    '/logo-192.png',
    '/favicon.ico'
];

// 1. Install event: pre-cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// 2. Activate event: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Fetch event: Network-first strategy with cache fallback
self.addEventListener('fetch', (event) => {
    // Only handle GET requests for http/https
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    // Never cache Supabase auth or API calls
    if (event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // If good response, update cache for static assets (js, css, images, fonts)
                if (
                    networkResponse &&
                    networkResponse.status === 200 &&
                    (event.request.destination === 'script' ||
                        event.request.destination === 'style' ||
                        event.request.destination === 'image' ||
                        event.request.destination === 'font')
                ) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // If offline / network error, return from cache
                return caches.match(event.request);
            })
    );
});
