const CACHE = "auge-v1";
const STATIC = [
  "/",
  "/src/main.tsx",
];

// Install: pré-cacheia a shell do app
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Activate: limpa caches antigas
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: stale-while-revalidate para assets, network-first para API
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Ignora requests de outras origens e requests não-GET
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;

  // API: sempre vai para rede (não cacheia)
  if (url.pathname.startsWith("/api/")) return;

  // Assets estáticos: stale-while-revalidate
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      const networkPromise = fetch(e.request).then((res) => {
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(() => cached);
      return cached || networkPromise;
    })
  );
});
