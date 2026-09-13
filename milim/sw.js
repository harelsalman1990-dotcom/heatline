// אוצר — Service Worker: מעטפת האפליקציה עובדת גם בלי רשת
const CACHE = "otzar-v1";
const SHELL = ["./","./index.html","./styles.css","./app.js","./data.js","./thesaurus.js","./rewrite.js","./manifest.webmanifest",
               "./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png"];
self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  const isFont = url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com");
  if(isFont){                                   // גופנים: מהמטמון קודם
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit = await c.match(req); if(hit) return hit;
      try{ const res = await fetch(req); if(res && (res.ok||res.type==="opaque")) c.put(req,res.clone()); return res; }
      catch(err){ return hit || Response.error(); }
    }));
    return;
  }
  if(url.origin === location.origin){           // מעטפת: מהרשת קודם, מטמון כגיבוי
    e.respondWith(fetch(req).then(res=>{ const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy)); return res; })
      .catch(()=>caches.match(req).then(h=>h||caches.match("./index.html"))));
  }
});
