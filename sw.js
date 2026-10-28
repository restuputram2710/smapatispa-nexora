/* SMAPATISPA NEXORA — service worker
   - Berkas aplikasi (HTML/CSS/JS): jaringan dulu, cadangan dari cache bila offline/lambat.
   - Font & pustaka CDN: cache dulu (jarang berubah).
   - Permintaan ke server Apps Script TIDAK pernah disimpan (data selalu segar & privat). */
const CACHE = 'nexora-v1';
const INTI = ['./', 'index.html', 'css/style.css', 'js/config.js', 'js/icons.js', 'js/core.js', 'js/ui.js', 'js/app.js', 'js/common.js', 'js/siswa.js', 'js/staf.js', 'js/admin.js', 'manifest.webmanifest', 'assets/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(INTI)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

function jaringanDulu(req) {
  return new Promise((resolve) => {
    let selesai = false;
    const t = setTimeout(() => { caches.match(req).then((c) => { if (c && !selesai) { selesai = true; resolve(c); } }); }, 4000);
    fetch(req).then((res) => {
      clearTimeout(t);
      if (res && res.ok) { const salin = res.clone(); caches.open(CACHE).then((c) => c.put(req, salin)); }
      if (!selesai) { selesai = true; resolve(res); }
    }).catch(() => {
      clearTimeout(t);
      caches.match(req).then((c) => { if (!selesai) { selesai = true; resolve(c || caches.match('index.html')); } });
    });
  });
}
function cacheDulu(req) {
  return caches.match(req).then((c) => c || fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) { const s = res.clone(); caches.open(CACHE).then((x) => x.put(req, s)); } return res; }));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/script\.google(usercontent)?\.com$/.test(url.hostname) || url.hostname === 'api.qrserver.com') return;
  if (url.origin === location.origin) { e.respondWith(jaringanDulu(req)); return; }
  if (/fonts\.(googleapis|gstatic)\.com$|cdnjs\.cloudflare\.com$/.test(url.hostname)) e.respondWith(cacheDulu(req));
});
