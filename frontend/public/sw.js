// Service worker do Educação Gamer.
//
// PRINCÍPIO: este arquivo NUNCA pode servir dado velho de jogo. O site é
// multiplayer em tempo real — uma resposta em cache no lugar de uma
// consulta real quebraria o jogo de formas difíceis de diagnosticar.
//
// Por isso a regra é conservadora:
//   - chamadas de API e WebSocket: SEMPRE da rede, nunca do cache
//   - arquivos estáticos (js, css, imagens): cache primeiro, rede depois
//   - navegação: rede primeiro, cache só se estiver offline
//
// Trocar a versão abaixo força a limpeza dos caches antigos na próxima
// visita. Precisa ser alterada quando o comportamento do SW mudar.
const VERSAO = "eg-v1";
const CACHE_ESTATICO = `${VERSAO}-estatico`;

// Só o essencial pra a casca do app abrir offline. Nada de dado de jogo.
const ESSENCIAIS = ["/", "/favicon.png", "/manifest.json"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_ESTATICO)
      .then((cache) => cache.addAll(ESSENCIAIS))
      // Um recurso que falhe no pré-cache não pode impedir a instalação.
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves.filter((c) => !c.startsWith(VERSAO)).map((c) => caches.delete(c))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const req = evento.request;

  // Só interfere em GET. POST, PATCH e DELETE passam direto.
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Recursos de outros domínios (Google Fonts, gtag, a API em outro host)
  // ficam de fora: não são nossos pra cachear.
  if (url.origin !== self.location.origin) return;

  // ===== NUNCA cachear =====
  // API e socket precisam de dado fresco sempre. Um ranking ou uma sala em
  // cache mostraria informação errada, e no jogo isso é pior que nada.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/socket.io/")
  ) {
    return;
  }

  // ===== Navegação: rede primeiro =====
  // Assim uma versão nova do site chega na hora. O cache só entra em cena
  // se a pessoa estiver realmente sem internet.
  if (req.mode === "navigate") {
    evento.respondWith(
      fetch(req).catch(() => caches.match("/").then((r) => r || Response.error()))
    );
    return;
  }

  // ===== Estáticos: cache primeiro =====
  // Arquivos com hash no nome (build do Vite) nunca mudam de conteúdo, então
  // servir do cache é seguro e deixa o carregamento instantâneo.
  evento.respondWith(
    caches.match(req).then((cacheado) => {
      if (cacheado) return cacheado;
      return fetch(req)
        .then((resposta) => {
          // Só guarda respostas completas e bem-sucedidas.
          if (!resposta || resposta.status !== 200 || resposta.type !== "basic") {
            return resposta;
          }
          const copia = resposta.clone();
          caches.open(CACHE_ESTATICO).then((cache) => cache.put(req, copia));
          return resposta;
        })
        .catch(() => cacheado);
    })
  );
});
