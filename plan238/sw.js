/* يحفظ صفحة المتابعة في الجهاز بعد أول فتح، فتُفتح بلا شبكة.
   ويجلب النسخة الأحدث في الخلفية كلّما توفّرت الشبكة، فتظهر عند الفتح التالي. */
const CACHE = 'plan238-v1';
const SHELL = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('plan238-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const key = req.mode === 'navigate' ? './' : req;
    const hit = await c.match(key, {ignoreSearch: true});
    const net = fetch(req).then(r => { if (r && r.ok) c.put(key, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response('لا شبكة، ولم تُحفظ الصفحة في هذا الجهاز بعد.',
      {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
  }));
});
