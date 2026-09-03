// Heatline service worker: the app shell works offline, updates arrive when online
const CACHE = "heatline-v1";
const SHELL = ["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  const isFont = url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com");
  if(isFont){                                   // fonts: cache first, they never change
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req); if(hit) return hit;
      try{ const res = await fetch(req); if(res && (res.ok || res.type === "opaque")) c.put(req, res.clone()); return res; }
      catch(err){ return hit || Response.error(); }
    }));
    return;
  }
  if(url.origin === location.origin){          // the shell: network first so updates land, cache when offline
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(h => h || caches.match("./index.html"))));
  }
});
