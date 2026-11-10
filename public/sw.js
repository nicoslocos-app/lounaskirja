// Network-only: never cache authenticated data, recipes or lunch reports.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
