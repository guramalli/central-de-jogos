// Área com senha: o que é privado (rostos dos amigos, vozes, músicas com dono, a cena do quarto) vem trancado em
// pacotes assets/vip/<pacote>.bin (AES-256-GCM, ver tools/vip_trancar.mjs). Com a senha certa, o servidor devolve a
// chave; ela fica salva neste aparelho e cada tela destranca no navegador só os pacotes que usa (PACOTES_DA_TELA).
// PORTÃO: o jogo é só para convidados. Nas páginas do jogo, quem não tem a chave salva volta para a página inicial,
// que pede a senha. Só uma chave ERRADA manda de volta: falta de internet ou de memória num pacote não tira ninguém
// do jogo (aquele conteúdo só não aparece desta vez). No computador de quem desenvolve (localhost) fica liberado.
// API: NSF.VIP.pronto (Promise: pacotes da tela abertos ou não) ; .url(caminho) (endereço do arquivo destrancado, ou o
//      próprio caminho) ; .ativo() ; .entrar(senha) (Promise; rejeita com a mensagem de erro) ; .sair() ; .local
(function (global) {
  "use strict";
  const NSF = global.NSF = global.NSF || {};
  const LS = "nsf_vip_chave", PASTA = "assets/vip/";
  const host = global.location ? global.location.hostname : "";
  const API = /(^|\.)educacaogamer\.com\.br$/.test(host) ? "https://api.educacaogamer.com.br"
    : "http://localhost:4000"; // o site rodando no computador (backend com npm run dev)
  NSF.API = API; // o servidor do site (também usado pelo ranking do surf)
  // o que cada tela abre (os nomes batem com tools/vip_trancar.mjs)
  const PACOTES_DA_TELA = {
    "casa_amigo.html": ["amigos", "sertanejo", "vozes"],
    "apartamento.html": ["cena", "tv", "vozes"],
    "padaria.html": ["padaria", "vozes"],
    "elevador.html": ["vozes"],
    "garagem.html": ["vozes"],
    "surf.html": ["amigos"],             // a turma assistindo da areia
    "balada.html": ["amigos", "vozes"],
  };
  const PACOTE_TESTE = "vozes"; // pequeno: confere se a chave abre (na entrada)
  // muda a cada vez que os pacotes são trancados (tools/vip_trancar.mjs reescreve esta linha): fura o cache do site
  const VERSAO_PACOTES = "mvea2z0j";

  const urls = new Map();
  const ler = () => { try { return global.localStorage.getItem(LS) || ""; } catch (e) { return ""; } };
  const chaveValida = (c) => /^[0-9a-f]{64}$/.test(c || "");
  const hex = (h) => new Uint8Array(h.match(/../g).map((b) => parseInt(b, 16)));
  const chaveErrada = (e) => e && e.name === "OperationError"; // AES-GCM não confere = chave errada

  async function destrancar(chaveHex, pacote) {
    const r = await fetch(PASTA + pacote + ".bin?v=" + VERSAO_PACOTES, { cache: "no-cache" });
    if (!r.ok) throw new Error("pacote " + pacote + ": " + r.status);
    const bruto = new Uint8Array(await r.arrayBuffer());
    const chave = await global.crypto.subtle.importKey("raw", hex(chaveHex), "AES-GCM", false, ["decrypt"]);
    const claro = new Uint8Array(await global.crypto.subtle.decrypt({ name: "AES-GCM", iv: bruto.slice(0, 12) }, chave, bruto.slice(12)));
    const tam = new DataView(claro.buffer).getUint32(0, true);
    const indice = JSON.parse(new TextDecoder().decode(claro.subarray(4, 4 + tam)));
    const base = 4 + tam;
    for (const a of indice.arquivos) {
      urls.set(a.c, URL.createObjectURL(new Blob([claro.subarray(base + a.i, base + a.i + a.n)], { type: a.t })));
    }
  }

  const chaveSalva = ler();
  // ?portao: no computador, faz como no site (para testar o portão)
  const local = (host === "localhost" || host === "127.0.0.1" || host === "") && !/[?&]portao/.test(global.location ? global.location.search : "");
  const tela = global.location ? global.location.pathname.split("/").pop() : "";
  const paginaInicial = !(tela in PACOTES_DA_TELA);
  // abertas a todos (sem senha): o mod do surf. Com a senha, a tela ainda abre os pacotes dela (os amigos na areia)
  const ABERTAS = new Set(["surf.html"]);
  const paraEntrada = () => { if (!local && !paginaInicial && !ABERTAS.has(tela)) global.location.replace("./"); };
  if (!chaveValida(chaveSalva)) paraEntrada(); // sem senha: nem carrega o jogo

  function abrir(chaveHex, pacotes) {
    return Promise.all(pacotes.map((p) => destrancar(chaveHex, p).catch((e) => {
      if (chaveErrada(e)) throw e;                     // chave errada: aí sim pede a senha de novo
      if (global.console) global.console.warn("[vip] não abriu o pacote", p, e); // internet/memória: segue sem ele
    })));
  }
  const pronto = (chaveValida(chaveSalva) && global.crypto && global.crypto.subtle)
    ? abrir(chaveSalva, paginaInicial ? [PACOTE_TESTE] : PACOTES_DA_TELA[tela]).catch(() => {
      try { global.localStorage.removeItem(LS); } catch (e) { /* ok */ }
      paraEntrada();
    })
    : Promise.resolve();

  async function entrar(senha) {
    let r;
    try {
      r = await fetch(API + "/api/thelastdance/vip", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }) });
    } catch (e) { throw new Error("Sem conexão com o servidor. Tente de novo."); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.chave) throw new Error(d.error || "Não deu certo. Tente de novo.");
    try { await destrancar(d.chave, PACOTE_TESTE); } // confere se a chave abre os pacotes antes de guardar
    catch (e) { if (chaveErrada(e)) throw new Error("A chave do servidor não abre os pacotes. Avise quem cuida do jogo."); }
    try { global.localStorage.setItem(LS, d.chave); } catch (e) { /* sem armazenamento: vale só agora */ }
  }
  function sair() {
    try { global.localStorage.removeItem(LS); } catch (e) { /* ok */ }
    for (const u of urls.values()) URL.revokeObjectURL(u);
    urls.clear();
  }

  // ativo = este aparelho tem a chave (mesmo que algum pacote não tenha baixado agora)
  NSF.VIP = { pronto, url: (c) => urls.get(c) || c, ativo: () => chaveValida(ler()), entrar, sair, local };
})(typeof window !== "undefined" ? window : globalThis);
