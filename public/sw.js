// Self-unregistering Service Worker to cleanly remove stale or orphaned service workers
// and prevent "Failed to convert value to Response" errors.

self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    self.registration
      .unregister()
      .then(function () {
        return self.clients.matchAll();
      })
      .then(function (clients) {
        clients.forEach(function (client) {
          if (client.url && "navigate" in client) {
            client.navigate(client.url);
          }
        });
      })
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    fetch(event.request).catch(function () {
      return new Response("", { status: 408, statusText: "Request Timeout" });
    })
  );
});
