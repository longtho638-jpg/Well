/// <reference lib="webworker" />

/**
 * Service Worker for Offline Support
 * Phase 3: Scale Optimization
 */

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'wellnexus-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// Cache strategies
const CACHE_STRATEGIES = {
    // Network first for API calls
    api: /\/api\//,
    // Cache first for static assets
    static: /\.(js|css|png|jpg|jpeg|svg|woff2)$/,
    // Stale while revalidate for pages
    pages: /^\/(?!api)/,
};

// Install event - precache assets
self.addEventListener('install', (event: ExtendableEvent) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event: FetchEvent) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip cross-origin requests
    if (url.origin !== self.location.origin) return;

    // API requests - network first
    if (CACHE_STRATEGIES.api.test(url.pathname)) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Static assets - cache first
    if (CACHE_STRATEGIES.static.test(url.pathname)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Pages - stale while revalidate
    event.respondWith(staleWhileRevalidate(request));
});

// Network first strategy
async function networkFirst(request: Request): Promise<Response> {
    try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
        return response;
    } catch {
        const cached = await caches.match(request);
        return cached || new Response('Offline', { status: 503 });
    }
}

// Cache first strategy
async function cacheFirst(request: Request): Promise<Response> {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request: Request): Promise<Response> {
    const cached = await caches.match(request);

    const fetchPromise = fetch(request).then(response => {
        caches.open(CACHE_NAME).then(cache => {
            cache.put(request, response.clone());
        });
        return response;
    });

    return cached || fetchPromise;
}

// Background sync for offline mutations
self.addEventListener('sync', (event: SyncEvent) => {
    if (event.tag === 'sync-transactions') {
        event.waitUntil(syncPendingTransactions());
    }
});

async function syncPendingTransactions(): Promise<void> {
    // Placeholder for syncing offline transactions
    console.log('[SW] Syncing pending transactions...');
}

// Push notifications (future)
self.addEventListener('push', (event: PushEvent) => {
    const data = event.data?.json() || { title: 'WellNexus', body: 'New notification' };

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-badge-72x72.png',
        })
    );
});

export { };
