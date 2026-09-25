/* Lenda do Campinho — © 2026 Educação Gamer. Todos os direitos reservados.
   Service worker (só registrado no modo celular): deixa o jogo abrir mais rápido e funcionar sem internet.
   - Páginas, scripts e estilos: sempre da rede primeiro (atualizações chegam na hora); cópia só para sem internet.
   - Imagens e sons: da cópia na hora e atualiza por trás. */
const VERSAO = new URL(self.location).searchParams.get('v') || '1';
const CACHE_CODIGO = 'lenda-codigo-' + VERSAO, CACHE_MIDIA = 'lenda-midia';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('lenda-codigo-') && k !== CACHE_CODIGO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== self.location.origin) return;
  if (/\.(webp|png|jpe?g|gif|mp3|ogg|wav|m4a)$/i.test(url.pathname)) {
    e.respondWith(caches.open(CACHE_MIDIA).then(async c => {
      const copia = await c.match(req);
      const rede = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => copia);
      return copia || rede;
    }));
    return;
  }
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(CACHE_CODIGO).then(c => c.put(req, cp)); }
    return r;
  }).catch(() => caches.match(req).then(h => h || caches.match('./index.html'))));
});
