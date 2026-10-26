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
// eg-v15: o jogo Lenda do Campinho (/lenda-do-campinho/) fica FORA deste SW.
// Ele tem imagens com nome fixo e muitos arquivos; na regra de "cache
// primeiro" daqui, a arte nova nunca chegaria e o cache cresceria a cada
// versão. O próprio jogo cuida do que precisa (e o vercel.json já dá o
// cache certo às imagens).
// eg-v16: o Jocelino (/jocelino/) também fica FORA deste SW. É um jogo Godot
// com arquivos de nome fixo (index.pck, index.js) que mudam a cada versão;
// no "cache primeiro" daqui, quem abriu uma vez ficava preso na versão velha
// (nem Ctrl+Shift+R resolvia). A subida de versão apaga a cópia guardada.
// (eg-v16, sem subir versão) The Last Dance (/thelastdance/) também fica
// FORA: protótipo em JS puro com nomes fixos; nunca foi guardado no cache.
// (eg-v16, sem subir versão) Torre Infinita (/torre/) também fica FORA:
// protótipo em módulos ES com nomes fixos; nunca foi guardado no cache.
// eg-v17: o Ghotin2 (/ghotin2/) também fica FORA. Os arquivos dele têm nome
// fixo (sons/efeitos.mp3, sons/sons.json, 3d/*.glb, sprites, json) e caíam no
// "cache primeiro": quem já tinha aberto ficava com o json dos sons velho e o
// MP3 novo (cada som tocava o trecho errado) e com modelos/animações antigos.
// A subida de versão apaga a cópia guardada.
// eg-v18: o "fetch" podia entregar `undefined` ao navegador. Quando a busca na
// rede falhava (internet oscilando, pedido cancelado ao trocar de página) e o
// arquivo ainda não estava no cache, o `.catch(() => cacheado)` devolvia o
// próprio `cacheado` — que era undefined. O Chrome então acusava "Failed to
// convert value to Response" e o arquivo (JS, CSS, /pwa-192.png) falhava
// com net::ERR_FAILED, mesmo que uma nova tentativa fosse funcionar. Agora
// toda resposta passa por `garantir()` e vira um Response de verdade.
// Também: a Vercel responde 200 com o index.html para um /assets/ que não
// existe mais (deploy novo, aba antiga). Esse HTML era guardado no cache com
// o nome do .js/.css e servido pra sempre. Agora só entra no cache resposta
// com o tipo certo, e a subida de versão limpa o que já tinha sido guardado
// errado (só o Cache Storage do SW: login e saves do navegador não são tocados).
const VERSAO = "eg-v18";
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

// Garante que o respondWith() sempre receba um Response (nunca undefined).
// Response.error() é o mesmo "erro de rede" que o navegador daria sem SW.
function garantir(resposta) {
  return resposta instanceof Response ? resposta : Response.error();
}

// Só guarda no cache resposta inteira, nossa e do TIPO esperado pela
// extensão: um .js/.css que voltou como text/html é o index.html da Vercel
// no lugar de um arquivo que não existe mais — guardar isso quebraria a
// página até alguém limpar o cache.
const TIPO_ESPERADO = { js: "javascript", mjs: "javascript", css: "text/css", png: "image/", jpg: "image/", jpeg: "image/", webp: "image/", svg: "image/", gif: "image/", ico: "image/", json: "json", mp3: "audio/", ogg: "audio/", wav: "audio/", woff: "font", woff2: "font" };
function podeGuardar(resposta, pathname) {
  if (!resposta || resposta.status !== 200 || resposta.type !== "basic") return false;
  const ext = (pathname.match(/.([a-z0-9]+)$/i) || [])[1];
  const esperado = ext && TIPO_ESPERADO[ext.toLowerCase()];
  if (!esperado) return !(resposta.headers.get("content-type") || "").includes("text/html") || !pathname.includes(".");
  return (resposta.headers.get("content-type") || "").includes(esperado);
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

  // Pedido "só do cache" de outro modo (o Chrome faz isso com o DevTools
  // aberto): repassar com fetch() lança erro. Deixa o navegador resolver.
  if (req.cache === "only-if-cached" && req.mode !== "same-origin") return;

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

  // ===== Lenda do Campinho: fica de fora (ver eg-v15) =====
  if (url.pathname === "/lenda-do-campinho" || url.pathname.startsWith("/lenda-do-campinho/")) return;

  // ===== Jocelino: fica de fora (ver eg-v16) =====
  if (url.pathname === "/jocelino" || url.pathname.startsWith("/jocelino/")) return;

  // ===== The Last Dance: fica de fora (ver eg-v16) =====
  if (url.pathname === "/thelastdance" || url.pathname.startsWith("/thelastdance/")) return;

  // ===== Torre Infinita: fica de fora (ver eg-v16) =====
  if (url.pathname === "/torre" || url.pathname.startsWith("/torre/")) return;

  // ===== Ghotin2: fica de fora (ver eg-v17) =====
  if (url.pathname === "/ghotin2" || url.pathname.startsWith("/ghotin2/")) return;

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
      }).then(garantir, () => Response.error())
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
            if (podeGuardar(resposta, url.pathname)) {
              const copia = resposta.clone();
              caches.open(CACHE_ESTATICO).then((cache) => cache.put(req, copia)).catch(() => {});
            }
            return resposta;
          })
          // Sem internet: se tem cache, ele já foi entregue abaixo; se não
          // tem, vira erro de rede (antes devolvia undefined — ver eg-v18).
          .catch(() => cacheado || Response.error());
        return cacheado || daRede;
      }).then(garantir, () => Response.error())
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
          // Só guarda resposta completa, bem-sucedida e do tipo certo (ver
          // podeGuardar: o index.html no lugar de um .js nunca entra).
          if (!podeGuardar(resposta, url.pathname)) {
            return resposta;
          }
          const copia = resposta.clone();
          caches
            .open(CACHE_ESTATICO)
            .then((cache) => cache.put(req, copia).then(() => url.pathname.startsWith("/assets/") && apararAssets(cache)))
            .catch(() => {});
          return resposta;
        })
        // Falhou na rede e não está no cache: erro de rede de verdade (antes
        // devolvia o `cacheado` vazio, ou seja, undefined — ver eg-v18).
        .catch(() => Response.error());
    }).then(garantir, () => Response.error())
  );
});
