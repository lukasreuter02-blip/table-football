// Table Football – Service Worker (Version d3f82c0c49): Offline-Start, neue Versionen bei Netz sofort
const CACHE = 'tf-d3f82c0c49';
const FONTS = 'fonts-v1';
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('tf-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Seite: erst aus dem Netz (neueste Version; nach 4 s ohne Antwort aus dem Speicher), ohne Netz aus dem Speicher
function page(req) {
  const net = fetch(req).then((res) => {
    if (res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', cp)); }
    return res;
  });
  const late = new Promise((ok) => setTimeout(ok, 4000)).then(() => caches.match('./index.html'));
  return Promise.race([net.catch(() => caches.match('./index.html')), late.then((r) => r || net)]);
}
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') { e.respondWith(page(req)); return; }
  // Schriften (Google Fonts): aus dem Speicher, im Hintergrund auffrischen
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then((c) => c.match(req).then((hit) => {
      const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  // eigene Dateien (Manifest, Icons): aus dem Speicher, sonst aus dem Netz
  if (url.origin === self.location.origin) e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
