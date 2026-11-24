// Service worker gerado por tools/build.mjs — não edite sw.js à mão.
const VERSAO = 'dbf3631bb0';
const CACHE = 'forja-' + VERSAO;
const ARQUIVOS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./js/audio.js",
  "./js/combat.js",
  "./js/conteudo.js",
  "./js/dungeon.js",
  "./js/game.js",
  "./js/main.js",
  "./js/paineis1.js",
  "./js/paineis2.js",
  "./js/rules.js",
  "./js/sprites.js",
  "./js/srd.js",
  "./js/store.js",
  "./js/story.js",
  "./js/ui.js",
  "./js/uibase.js",
  "./js/uiutil.js",
  "./js/world.js",
  "./icons/apple-touch-icon.png",
  "./icons/favicon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png"
];

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
