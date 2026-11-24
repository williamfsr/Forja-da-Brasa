// Service worker gerado por tools/build.mjs — não edite sw.js à mão.
const VERSAO = '__VERSAO__';
const CACHE = 'forja-' + VERSAO;
const ARQUIVOS = __ARQUIVOS__;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('forja-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Offline primeiro: responde do cache e atualiza em segundo plano.
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return; const url = new URL(req.url); if (url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req, { ignoreSearch: true });
    const rede = fetch(req).then((r) => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || rede || (req.mode === 'navigate' ? c.match('./index.html') : undefined);
  }));
});
