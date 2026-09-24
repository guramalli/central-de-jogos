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
// eg-v4: logotipo do portal refeito. As logos da RAIZ (educacao-gamer-*.png,
// favicon, ícones do PWA) também têm nome fixo e caíam na regra de cache
// eterno — quem já tinha visitado continuaria vendo a logo velha pra sempre.
// Agora elas entraram no ARTE_TROCAVEL abaixo, então troca de logo passa a
// chegar sozinha nas próximas vezes; esta subida de versão é pra alcançar
// quem já tem a antiga guardada.
// eg-v10: logo do Mentira Sincera trocado (e agora ele está na lista de
// ARTE_TROCAVEL: próximas trocas chegam sozinhas, sem subir a versão).
// eg-v11: arte própria das 12 patentes do Mentira (/ranks-mentira/),
// sobrescrevendo as cópias provisórias do Acromania.
// eg-v12: a busca da página (navegação) agora ignora explicitamente o
// cache HTTP do navegador (cache: "no-store"), não só o Cache Storage do
// SW. Sem isso, um F5 normal (sem Shift) podia reaproveitar um index.html
// antigo guardado pelo próprio navegador — depois de um deploy, esse HTML
// velho apontava pra arquivos JS/CSS com hash que já não existiam mais, e
// a tela ficava em branco. Reforça o Cache-Control do vercel.json, que
// resolve a mesma causa do lado do servidor.
// eg-v13: o cache de arquivos do build (/assets/) passou a ter limite — a
// cada deploy entravam arquivos novos (com hash novo) e os velhos ficavam
// guardados pra sempre. O manifest.json também passou a ser conferido por
// trás (antes, quem instalou o app nunca recebia um manifest novo). A
// subida de versão limpa o que já tinha acumulado.
// eg-v14: sem internet, quem está na v2 caía na casca do site CLÁSSICO
// (o reserva era sempre "/"). Agora a v2 tem a própria casca guardada.
const VERSAO = "eg-v14";
const CACHE_ESTATICO = `${VERSAO}-estatico`;

// Só o essencial pra a casca do app abrir offline. Nada de dado de jogo.
const ESSENCIAIS = ["/", "/v2/", "/favicon.png", "/manifest.json"];

// Pastas de arte com nome de arquivo FIXO (sem hash): quando uma imagem é
// regerada, o nome continua o mesmo. Elas precisam ser revalidadas, senão
// a versão antiga fica presa no cache do jogador pra sempre.
// Quantos arquivos do build (/assets/) ficam guardados, no máximo. Cada
// deploy gera nomes novos; passando do limite, saem os mais antigos (o
// Cache Storage devolve as chaves na ordem em que entraram).
const MAX_ASSETS = 80;

async function apararAssets(cache) {
  const chaves = (await cache.keys()).filter((r) => new URL(r.url).pathname.startsWith("/assets/"));
  const sobra = chaves.length - MAX_ASSETS;
  for (let i = 0; i < sobra; i++) await cache.delete(chaves[i]);
}

const ARTE_TROCAVEL = /^\/(titulos|ranks|ranks-quiz|ranks-acromania|ranks-mentira|temas-quiz|dificuldades|sounds)\/|^\/(educacao-gamer-logo[a-z-]*|favicon|pwa-[a-z0-9-]+|quiz-logo[a-z-]*|stop-logo|acromania-logo[a-z-]*|mentira-logo[a-z-]*|tribunal-logo[a-z-]*|impostor-logo[a-z-]*)\.png$/;

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

  // ===== Servidor de desenvolvimento (Vite): nunca cachear =====
  // O index.html registra este SW também no `npm run dev`. Lá os módulos
  // não têm hash (/v2/App.jsx, /src/...) e as dependências trocam de ?v=
  // quando o Vite re-otimiza: servir do cache misturava arquivo velho com
  // novo — duas cópias do React ("Invalid hook call") e tela piscando.
  // Nada disso existe no build de produção (lá é tudo /assets/).
  if (
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/node_modules/") ||
    url.pathname.startsWith("/src/") ||
    (url.pathname.startsWith("/v2/") && req.mode !== "navigate")
  ) {
    return;
  }

  // ===== Navegação: rede primeiro =====
  // Assim uma versão nova do site chega na hora. O cache só entra em cena
  // se a pessoa estiver realmente sem internet.
  if (req.mode === "navigate") {
    evento.respondWith(
      fetch(req, { cache: "no-store" }).catch(() => {
        // Sem internet: cada site volta pra própria casca (a v2 não pode
        // cair no clássico).
        const casca = url.pathname === "/v2" || url.pathname.startsWith("/v2/") ? "/v2/" : "/";
        return caches.match(casca).then((r) => r || caches.match("/")).then((r) => r || Response.error());
      })
    );
    return;
  }

  // ===== Arte trocável: entrega do cache, mas confere por trás =====
  // As pastas abaixo têm nomes FIXOS (titulo-futebol-bronze.png é sempre o
  // mesmo nome), diferente dos arquivos do Vite, que carregam um hash. Com
  // a regra de "cache primeiro" pura, regerar uma arte não adiantava nada:
  // quem já tinha a versão antiga guardada nunca mais recebia a nova.
  // (Foi o que aconteceu com a logo de futebol bronze.)
  //
  // Aqui a pessoa continua recebendo na hora o que está no cache — sem
  // perder velocidade — e o navegador busca a versão nova em segundo plano
  // pra próxima visita. Trocar uma arte passa a chegar sozinho.
  // O manifest.json entra aqui também: nome fixo, precisa chegar atualizado.
  if (ARTE_TROCAVEL.test(url.pathname) || url.pathname === "/manifest.json") {
    evento.respondWith(
      caches.match(req).then((cacheado) => {
        const daRede = fetch(req)
          .then((resposta) => {
            if (resposta && resposta.status === 200 && resposta.type === "basic") {
              const copia = resposta.clone();
              caches.open(CACHE_ESTATICO).then((cache) => cache.put(req, copia));
            }
            return resposta;
          })
          // Sem internet: se tem cache, ele já foi entregue abaixo.
          .catch(() => cacheado);
        return cacheado || daRede;
      })
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
          caches
            .open(CACHE_ESTATICO)
            .then((cache) => cache.put(req, copia).then(() => url.pathname.startsWith("/assets/") && apararAssets(cache)))
            .catch(() => {});
          return resposta;
        })
        .catch(() => cacheado);
    })
  );
});
