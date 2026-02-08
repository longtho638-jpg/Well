// Cleanup Service Worker - unregisters itself and clears all caches
// VitePWA is disabled; this SW replaces the old caching SW to fix Safari stale cache issues

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.map((name) => caches.delete(name)))
    ).then(() => self.registration.unregister())
     .then(() => self.clients.matchAll())
     .then((clients) => {
       clients.forEach((client) => client.navigate(client.url));
     })
  );
});
