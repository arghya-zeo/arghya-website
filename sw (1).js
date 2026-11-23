const V = "az-v2";
const CORE = ["./", "manifest.webmanifest", "icon-192.png", "icon-512.png", "profile.jpg"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  // Pages: network first (always fresh), cache when offline
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); return res; }).catch(() => caches.match(r).then(m => m || caches.match("./"))));
    return;
  }
  // Everything else (images, fonts, icons): cache first, refresh in background
  e.respondWith(caches.match(r).then(m => {
    const net = fetch(r).then(res => { if (res && (res.ok || res.type === "opaque")) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); } return res; }).catch(() => m);
    return m || net;
  }));
});
