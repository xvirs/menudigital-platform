// Minimal pass-through service worker — required for the admin to be
// installable as a PWA. We don't cache anything: every request goes
// straight to the network so that the operator always sees fresh data
// from the GitHub API.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Default network behaviour. No-op handler is enough to make the
  // app pass the "installable" check on Chrome/Edge.
});
