const CACHE = "auge-v2";
const STATIC = ["/"];

// ─── INSTALL ─────────────────────────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ────────────────────────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH ───────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
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

// ─── NOTIFICATION SCHEDULING ─────────────────────────────────────────────────
// schedule shape: { [id]: { title, body, fireAt (ms epoch), url, repeat: "daily"|"weekly"|null } }
let schedule = {};

function checkAndNotify() {
  const now = Date.now();
  const updated = {};
  for (const [id, entry] of Object.entries(schedule)) {
    if (!entry.fireAt) continue;
    if (now >= entry.fireAt) {
      self.registration.showNotification(entry.title, {
        body: entry.body,
        icon: "/icon.svg",
        badge: "/icon-maskable.svg",
        data: { url: entry.url, id },
        tag: id,
        renotify: false,
        requireInteraction: false,
        vibrate: [200, 100, 200],
      });
      // Advance next occurrence
      if (entry.repeat === "weekly") {
        updated[id] = { ...entry, fireAt: entry.fireAt + 7 * 24 * 60 * 60 * 1000 };
      } else if (entry.repeat === "daily") {
        updated[id] = { ...entry, fireAt: entry.fireAt + 24 * 60 * 60 * 1000 };
      }
      // no repeat = deleted (not added to updated)
    } else {
      updated[id] = entry;
    }
  }
  schedule = updated;
}

// Poll every 60 s while the SW is alive
const _interval = setInterval(checkAndNotify, 60_000);

// ─── MESSAGE FROM APP ─────────────────────────────────────────────────────────
self.addEventListener("message", (e) => {
  if (!e.data) return;

  if (e.data.type === "SCHEDULE_NOTIFICATIONS") {
    schedule = e.data.schedule || {};
    // Immediate check in case something is already overdue
    checkAndNotify();
  }

  if (e.data.type === "CLEAR_NOTIFICATIONS") {
    schedule = {};
  }
});

// ─── NOTIFICATION CLICK (deep link) ──────────────────────────────────────────
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = e.notification.data?.url || "/";
  e.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((cls) => {
        // Focus existing window and navigate
        const win = cls.find((c) => "focus" in c);
        if (win) {
          return win.focus().then(() => {
            if ("navigate" in win) return win.navigate(target);
          });
        }
        return clients.openWindow(target);
      })
  );
});
