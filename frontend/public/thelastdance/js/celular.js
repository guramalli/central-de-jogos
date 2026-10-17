// Celular dele no canto de baixo da tela: ZapZap (conversas e grupo), Instagrão (perfil, fotos, directs,
// notificações) e Telefone (Bruno Moon e Carioca ligando toda hora). Conteúdo em js/dialogos/celular_conversas.js.
// Enquanto o celular está aberto o personagem fica parado mexendo no celular (o jogo trata como "tela aberta").
// O que já foi lido/respondido fica salvo no navegador (localStorage "nsf_celular"); ?celular=zerar recomeça.
(function (global) {
  "use strict";
  const doc = global.document, NSF = global.NSF, DADOS = NSF && NSF.CELULAR;
  if (!doc || !DADOS) return;

  const CSS = `
  #cel-botao { position: fixed; right: max(12px, env(safe-area-inset-right)); bottom: max(12px, env(safe-area-inset-bottom));
    z-index: 25; width: 58px; height: 84px; padding: 0; border: 0; background: none; cursor: pointer;
    filter: drop-shadow(0 4px 10px rgba(0,0,0,.55)); transition: transform .15s; -webkit-tap-highlight-color: transparent; }
  #cel-botao:hover, #cel-botao:focus-visible { transform: translateY(-3px) rotate(-4deg); outline: none; }
  #cel-botao.tocando { animation: cel-vibra .16s linear infinite alternate; }
  body:has(.escolha) #cel-botao { bottom: calc(max(12px, env(safe-area-inset-bottom)) + 214px); }
  .cel-badge { position: absolute; top: -4px; right: -6px; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 11px;
    background: #e8263f; color: #fff; font: 700 12px/22px system-ui, sans-serif; border: 2px solid #0b0712; text-align: center; }
  .cel-badge:empty { display: none; }
  .cel-aviso { position: fixed; right: max(12px, env(safe-area-inset-right)); z-index: 25; max-width: min(300px, calc(100vw - 90px));
    bottom: calc(max(12px, env(safe-area-inset-bottom)) + 92px); background: rgba(22,13,36,.96); color: #f3ecff;
    border: 2px solid #ff5ad8; border-radius: 14px; padding: 9px 12px; font: 600 14px/1.3 system-ui, sans-serif;
    box-shadow: 0 0 18px rgba(255,90,216,.35); cursor: pointer; animation: cel-sobe .2s ease-out; }
  body:has(.escolha) .cel-aviso { bottom: calc(max(12px, env(safe-area-inset-bottom)) + 306px); }
  .cel-aviso small { display: block; font-weight: 400; color: #c9b8ee; }
  .cel-tela { position: fixed; right: max(10px, env(safe-area-inset-right)); bottom: max(10px, env(safe-area-inset-bottom));
    z-index: 26; width: min(350px, calc(100vw - 20px)); height: min(660px, calc(100dvh - 20px));
    background: #08060c; border-radius: 38px; padding: 10px; box-shadow: 0 0 0 2px #3a2a50, 0 18px 50px rgba(0,0,0,.7);
    display: flex; flex-direction: column; font: 14px/1.35 system-ui, sans-serif; color: #111; animation: cel-sobe .22s ease-out; }
  .cel-fora { position: fixed; inset: 0; z-index: 25; background: rgba(5,2,12,.25); }
  .cel-vidro { flex: 1; min-height: 0; border-radius: 30px; overflow: hidden; display: flex; flex-direction: column; background: #f4f4f4; position: relative; }
  .cel-status { flex: none; display: flex; justify-content: space-between; align-items: center; padding: 8px 20px 4px;
    font: 600 12px system-ui, sans-serif; color: #fff; background: #111; }
  .cel-status .ilha { width: 86px; height: 20px; border-radius: 12px; background: #000; }
  .cel-app { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .cel-barra { flex: none; display: flex; justify-content: space-around; background: #111; padding: 6px 0 8px; }
  .cel-barra button { background: none; border: 0; color: #ddd; font: 600 18px system-ui; width: 64px; padding: 4px; cursor: pointer; border-radius: 10px; }
  .cel-barra button:hover, .cel-barra button:focus-visible { background: #2a2a2a; outline: none; }
  .cel-home { flex: 1; background: radial-gradient(circle at 30% 20%, #ff5ad8 0, transparent 45%), radial-gradient(circle at 80% 80%, #3949ab 0, transparent 50%), #1b1030;
    color: #fff; padding: 26px 18px; display: flex; flex-direction: column; gap: 22px; overflow-y: auto; }
  .cel-relogio { text-align: center; font: 300 56px/1 system-ui, sans-serif; letter-spacing: 1px; }
  .cel-data { text-align: center; font-size: 14px; opacity: .85; margin-top: -14px; }
  .cel-apps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px 10px; margin-top: 10px; }
  .cel-icone { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; background: none; border: 0;
    color: #fff; font: 600 12px system-ui, sans-serif; cursor: pointer; }
  .cel-icone b { display: grid; place-items: center; width: 60px; height: 60px; border-radius: 16px; font-size: 30px; box-shadow: 0 4px 10px rgba(0,0,0,.35); }
  .cel-icone:hover b, .cel-icone:focus-visible b { transform: scale(1.06); } .cel-icone:focus-visible { outline: none; }
  .cel-icone .cel-badge { top: -6px; right: 4px; }
  .cel-np { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 10px; background: rgba(0,0,0,.35);
    border-radius: 14px; padding: 10px 14px; font-weight: 600; }
  .cel-np button { border: 0; border-radius: 14px; padding: 6px 12px; font: 700 12px system-ui; cursor: pointer; background: #555; color: #fff; }
  .cel-np button[aria-pressed="true"] { background: #7c4dff; }
  .cel-topo { flex: none; display: flex; align-items: center; gap: 10px; padding: 10px 12px; color: #fff; background: #0f6b5a; min-height: 52px; }
  .cel-topo h2 { margin: 0; font: 700 18px system-ui, sans-serif; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cel-topo small { display: block; font: 400 12px system-ui; opacity: .85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cel-topo .tit { flex: 1; min-width: 0; }
  .cel-topo button { background: none; border: 0; color: inherit; font: 600 20px system-ui; cursor: pointer; padding: 2px 6px; border-radius: 8px; position: relative; }
  .cel-topo button:focus-visible { outline: 2px solid currentColor; }
  .cel-topo .cel-badge { top: -4px; right: -8px; min-width: 18px; height: 18px; padding: 0 4px; font: 700 11px/14px system-ui, sans-serif; }
  .cel-abas { flex: none; display: flex; background: #0f6b5a; }
  .cel-abas button { flex: 1; background: none; border: 0; border-bottom: 3px solid transparent; color: #cfe9e3; font: 700 13px system-ui; padding: 8px; cursor: pointer; }
  .cel-abas button[aria-selected="true"] { color: #fff; border-color: #fff; }
  .cel-lista { flex: 1; overflow-y: auto; background: #fff; }
  .cel-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px; background: #fff; border: 0;
    border-bottom: 1px solid #eee; cursor: pointer; text-align: left; font: inherit; color: #111; }
  .cel-item:hover, .cel-item:focus-visible { background: #f0f7f5; outline: none; }
  .cel-item .meio { flex: 1; min-width: 0; }
  .cel-item .nome { font-weight: 700; } .cel-item .prev { color: #666; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cel-item .num { background: #25d366; color: #fff; border-radius: 11px; min-width: 22px; height: 22px; font: 700 12px/22px system-ui; text-align: center; padding: 0 6px; }
  .cel-item .perdida { color: #e8263f; }
  .cel-av { flex: none; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; color: #fff; font: 700 18px system-ui; }
  .cel-msgs { flex: 1; overflow-y: auto; padding: 12px 10px; display: flex; flex-direction: column; gap: 6px;
    background: #e9e1d6 radial-gradient(rgba(0,0,0,.04) 1px, transparent 1px) 0 0/14px 14px; }
  .cel-msg { max-width: 80%; padding: 6px 10px; border-radius: 10px; background: #fff; align-self: flex-start; box-shadow: 0 1px 1px rgba(0,0,0,.12);
    white-space: pre-wrap; animation: cel-sobe .16s ease-out; }
  .cel-msg.eu { align-self: flex-end; background: #d9fdd3; }
  .cel-msg .autor { display: block; font: 700 12px system-ui; margin-bottom: 1px; }
  .cel-sis { align-self: center; font-size: 12px; color: #555; background: #fff8c5; border-radius: 8px; padding: 4px 10px; text-align: center; }
  .cel-resp { flex: none; display: flex; flex-direction: column; gap: 6px; padding: 8px; background: #f0f0f0; border-top: 1px solid #ddd; }
  .cel-resp small { color: #666; font-weight: 600; padding: 0 4px; }
  .cel-resp button { text-align: left; font: 600 13px/1.3 system-ui; border: 1px solid #b9d8cf; background: #fff; color: #0b5345;
    border-radius: 16px; padding: 8px 12px; cursor: pointer; }
  .cel-resp button:hover, .cel-resp button:focus-visible { background: #e6f7f1; border-color: #25d366; outline: none; }
  .cel-campo { flex: none; margin: 8px; padding: 9px 14px; border-radius: 20px; background: #fff; color: #999; font-size: 13px; }
  .insta .cel-topo, .insta .cel-abas { background: #fff; color: #111; border-bottom: 1px solid #eee; }
  .insta .cel-topo h2 { font: italic 700 22px Georgia, serif; }
  .insta .cel-msgs { background: #fff; } .insta .cel-msg { background: #efefef; box-shadow: none; border-radius: 18px; }
  .insta .cel-msg.eu { background: linear-gradient(135deg, #7b2ff7, #f107a3); color: #fff; }
  .insta .cel-resp button { border-color: #e2c6f2; color: #6a1b9a; } .insta .cel-item .num { background: #f107a3; }
  .cel-perfil { padding: 14px; background: #fff; }
  .cel-perfil .linha { display: flex; align-items: center; gap: 16px; }
  .cel-perfil .foto { width: 76px; height: 76px; border-radius: 50%; display: grid; place-items: center; font-size: 40px;
    background: #ffe0b2; box-shadow: 0 0 0 3px #fff, 0 0 0 5px #f107a3; flex: none; }
  .cel-perfil .nums { flex: 1; display: flex; justify-content: space-around; text-align: center; font-size: 12px; }
  .cel-perfil .nums b { display: block; font-size: 16px; }
  .cel-perfil .bio { margin-top: 10px; white-space: pre-wrap; font-size: 13px; }
  .cel-grade { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; background: #fff; }
  .cel-grade button { aspect-ratio: 1; border: 0; display: grid; place-items: center; font-size: 34px; cursor: pointer; }
  .cel-grade button:focus-visible { outline: 3px solid #f107a3; outline-offset: -3px; }
  .cel-post { flex: 1; overflow-y: auto; background: #fff; }
  .cel-post .img { aspect-ratio: 1; display: grid; place-items: center; font-size: 110px; }
  .cel-post .acoes { display: flex; gap: 12px; align-items: center; padding: 10px 12px 2px; font-weight: 700; }
  .cel-post .acoes button { border: 0; background: none; font-size: 26px; cursor: pointer; padding: 0; }
  .cel-post p { margin: 4px 12px 14px; }
  .cel-chamada { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 40px 18px 26px;
    color: #fff; background: linear-gradient(180deg, #1b1030, #3a1b5c); text-align: center; }
  .cel-chamada .cel-av { width: 110px; height: 110px; font-size: 46px; animation: cel-pulsa 1.1s ease-in-out infinite; }
  .cel-chamada h2 { margin: 14px 0 2px; font: 600 24px system-ui; } .cel-chamada .sub { opacity: .8; }
  .cel-chamada .falas { flex: 1; width: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; margin: 16px 0; justify-content: flex-end; }
  .cel-chamada .falas div { background: rgba(255,255,255,.12); border-radius: 12px; padding: 7px 10px; text-align: left; animation: cel-sobe .16s; }
  .cel-chamada .falas div.eu { background: rgba(37,211,102,.25); text-align: right; }
  .cel-chamada .par { display: flex; gap: 40px; justify-content: center; }
  .cel-redondo { width: 64px; height: 64px; border-radius: 50%; border: 0; color: #fff; font-size: 28px; cursor: pointer; }
  .cel-redondo.verde { background: #25d366; } .cel-redondo.vermelho { background: #e8263f; }
  .cel-redondo:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
  .cel-chamada .opcoes { display: flex; flex-direction: column; gap: 6px; width: 100%; margin-bottom: 14px; }
  .cel-chamada .opcoes button { font: 600 13px system-ui; color: #fff; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.35);
    border-radius: 14px; padding: 9px 12px; cursor: pointer; text-align: left; }
  .cel-chamada .opcoes button:hover, .cel-chamada .opcoes button:focus-visible { background: rgba(255,255,255,.25); outline: none; }
  .cel-central { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 27; width: min(300px, calc(100vw - 32px));
    background: linear-gradient(180deg, #1b1030, #3a1b5c); color: #fff; border-radius: 28px; padding: 22px 18px 18px; text-align: center;
    box-shadow: 0 0 0 3px #3a2a50, 0 0 0 6px #08060c, 0 0 40px rgba(255,90,216,.45), 0 20px 50px rgba(0,0,0,.6);
    font: 15px/1.3 system-ui, sans-serif; animation: cel-chega .3s ease-out; }
  .cel-central .cel-av { width: 84px; height: 84px; font-size: 36px; margin: 0 auto 10px; animation: cel-pulsa 1.1s ease-in-out infinite; }
  .cel-central h2 { margin: 0; font: 700 21px system-ui, sans-serif; } .cel-central .sub { opacity: .8; margin: 2px 0 18px; }
  .cel-central .par { display: flex; justify-content: space-around; }
  .cel-central .par div { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 13px; opacity: .9; }
  @keyframes cel-chega { from { opacity: 0; transform: translate(-50%, -40%) scale(.9); } to { opacity: 1; transform: translate(-50%, -50%); } }
  @keyframes cel-vibra { from { transform: rotate(-8deg); } to { transform: rotate(8deg); } }
  @keyframes cel-sobe { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @keyframes cel-pulsa { 50% { box-shadow: 0 0 0 14px rgba(255,255,255,.12); } }
  @media (prefers-reduced-motion: reduce) { .cel-central, .cel-central .cel-av, #cel-botao.tocando, .cel-msg, .cel-tela, .cel-aviso, .cel-chamada .cel-av { animation: none; } }`;

  // ---------- estado salvo ----------
  const CHAVE = "nsf_celular";
  let est = {};
  try {
    if (/[?&]celular=zerar/.test(global.location.search)) global.localStorage.removeItem(CHAVE);
    est = JSON.parse(global.localStorage.getItem(CHAVE) || "{}") || {};
  } catch (e) { est = {}; }
  est.c = est.c || {}; est.chamadas = est.chamadas || []; est.curtidas = est.curtidas || {}; est.vez = est.vez || {};
  est.segundos = est.segundos || 0;
  function salvar() { try { global.localStorage.setItem(CHAVE, JSON.stringify(est)); } catch (e) { /* sem armazenamento: só nesta tela */ } }

  est.dinamicas = est.dinamicas || []; // conversas que surgem no jogo (ex.: a menina que topou o vinho)
  const CONVERSAS = [...est.dinamicas, ...DADOS.conversas];
  function info(c) { // estado de uma conversa (lidas, respostas, rodada)
    if (!est.c[c.id]) {
      let n = c.mensagens.length; // começa com as últimas mensagens do contato "não lidas"
      while (n > 0 && c.mensagens[n - 1].de !== "eu") n--;
      est.c[c.id] = { lidas: c.grupo ? Math.max(0, c.mensagens.length - 2) : n, extras: [], rodada: 0 };
    }
    return est.c[c.id];
  }
  const chegou = (c) => !c.novas || est.segundos >= (c.chega || 0);
  const msgs = (c) => [...c.mensagens, ...info(c).extras];
  function receberNovas(c) { // as "novas" entram na conversa na ordem em que chegaram (depois do que ele já respondeu)
    const inf = info(c);
    if (!c.novas || inf.novasOk || !chegou(c)) return false;
    inf.extras.push(...c.novas); inf.novasOk = true; salvar();
    return true;
  }
  const rodadaAtual = (c) => { const r = c.rodadas && c.rodadas[info(c).rodada]; return r && (!r.esperaNovas || info(c).novasOk) ? r : null; };
  const naoLidas = (c) => Math.max(0, msgs(c).filter((m) => !m.sis).length - info(c).lidas);
  const perdidasNovas = () => est.chamadas.filter((x) => x.perdida && !x.vista).length;
  const avisosNovos = () => (est.avisosVistos ? 0 : DADOS.avisos.length);
  const total = () => CONVERSAS.reduce((s, c) => s + naoLidas(c), 0) + perdidasNovas() + avisosNovos();
  const zapNovas = () => CONVERSAS.filter((c) => c.app === "zap").reduce((s, c) => s + naoLidas(c), 0);
  const dmNovas = () => CONVERSAS.filter((c) => c.app === "insta").reduce((s, c) => s + naoLidas(c), 0);

  // ---------- elementos ----------
  function el(tag, classe, texto) {
    const e = doc.createElement(tag);
    if (classe) e.className = classe;
    if (texto != null) e.textContent = texto;
    return e;
  }
  function botao(classe, texto, aoClicar, rotulo) {
    const b = el("button", classe, texto);
    b.type = "button";
    if (rotulo) b.setAttribute("aria-label", rotulo);
    b.addEventListener("click", (e) => { e.stopPropagation(); aoClicar(e); });
    return b;
  }
  function avatar(nome, cor, emoji) {
    const a = el("span", "cel-av", emoji || [...nome.trim()][0].toUpperCase());
    a.style.background = cor || "#7b6a99";
    a.setAttribute("aria-hidden", "true");
    return a;
  }
  const CORES_AUTOR = ["#1e88e5", "#d81b60", "#43a047", "#fb8c00", "#8e24aa", "#00897b"];

  const estilo = el("style"); estilo.textContent = CSS; doc.head.appendChild(estilo);
  const bCel = el("button"); bCel.id = "cel-botao"; bCel.type = "button"; bCel.setAttribute("aria-label", "Abrir o celular");
  bCel.innerHTML = `<svg width="58" height="84" viewBox="0 0 58 84" aria-hidden="true">
    <rect x="3" y="2" width="52" height="80" rx="11" fill="#141019" stroke="#ff5ad8" stroke-width="3"/>
    <rect x="8" y="10" width="42" height="64" rx="5" fill="url(#celg)"/>
    <rect x="21" y="5" width="16" height="3" rx="1.5" fill="#000"/>
    <rect x="13" y="20" width="12" height="12" rx="3" fill="#25d366"/><rect x="33" y="20" width="12" height="12" rx="3" fill="#f107a3"/>
    <rect x="13" y="40" width="12" height="12" rx="3" fill="#4fc3f7"/><rect x="33" y="40" width="12" height="12" rx="3" fill="#ffca28"/>
    <rect x="22" y="68" width="14" height="2.5" rx="1.2" fill="#fff" opacity=".7"/>
    <defs><linearGradient id="celg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b2a86"/><stop offset="1" stop-color="#1b1030"/></linearGradient></defs></svg>`;
  const badge = el("span", "cel-badge"); bCel.appendChild(badge);
  doc.body.appendChild(bCel);

  let fora = null; // fundo transparente: tocar fora do celular fecha
  let tela = null, app = null, pilha = [], atual = null, aviso = null, avisoRelogio = null;
  const aberto = () => !!tela;

  function atualizarBadge() {
    const n = total();
    badge.textContent = n ? String(n) : "";
    bCel.setAttribute("aria-label", n ? `Abrir o celular (${n} novidades)` : "Abrir o celular");
  }

  function mostrarAviso(texto, sub, aoClicar, ms) {
    if (aviso) aviso.remove();
    clearTimeout(avisoRelogio);
    aviso = el("div", "cel-aviso", texto);
    aviso.setAttribute("role", "status");
    if (sub) aviso.appendChild(el("small", "", sub));
    aviso.addEventListener("click", () => { esconderAviso(); aoClicar(); });
    doc.body.appendChild(aviso);
    if (ms) avisoRelogio = setTimeout(esconderAviso, ms);
  }
  function esconderAviso() { if (aviso) { aviso.remove(); aviso = null; } clearTimeout(avisoRelogio); }

  // ---------- o personagem mexendo no celular ----------
  function poseCelular(sim) {
    const a = global.NSF_APTO;
    if (!a || !a.heroi || !a.jog || a.jog.sentado) return;
    const h = a.heroi;
    if (sim && h.roupas && h.roupas.celular_mao) { h.vestir("celular_mao"); a.jog.pose = "celular"; a.jog.dir = "baixo"; }
    else if (!sim && a.jog.pose === "celular") { h.tirar("celular_mao"); a.jog.pose = null; }
  }

  // ---------- abrir / fechar / navegar ----------
  function abrir(destino) {
    esconderAviso();
    if (!tela) {
      tela = el("div", "cel-tela");
      tela.setAttribute("role", "dialog"); tela.setAttribute("aria-label", "Celular");
      const vidro = el("div", "cel-vidro");
      const status = el("div", "cel-status");
      const hora = el("span", "", horaAgora());
      status.append(hora, el("span", "ilha"), el("span", "", "5G ▂▄▆ 🔋23%"));
      app = el("div", "cel-app");
      const barra = el("div", "cel-barra");
      barra.append(botao("", "◀", voltar, "Voltar"), botao("", "⬤", () => ir({ nome: "home" }, true), "Tela inicial"),
        botao("", "✕", fechar, "Fechar o celular"));
      vidro.append(status, app, barra);
      tela.appendChild(vidro);
      fora = el("div", "cel-fora");
      fora.addEventListener("click", (e) => { // fora do celular: fecha (menos no meio de uma ligação)
        e.stopPropagation();
        if (atual && (atual.nome === "ligando" || atual.nome === "emLigacao")) return;
        fechar();
      });
      fora.addEventListener("pointerdown", (e) => e.stopPropagation());
      doc.body.append(fora, tela);
      bCel.style.display = "none";
      poseCelular(true);
      if (NSF.Audio && NSF.Audio.curtida) NSF.Audio.curtida();
    }
    pilha = [];
    ir(destino || { nome: "home" }, true);
  }
  function fechar() {
    if (atual && atual.nome === "emLigacao") encerrarLigacao(true);
    if (atual && atual.nome === "ligando") recusar();
    if (tela) tela.remove();
    if (fora) fora.remove();
    tela = null; app = null; fora = null; atual = null; pilha = [];
    bCel.style.display = "";
    poseCelular(false);
    atualizarBadge();
  }
  function ir(destino, limpar) {
    if (limpar) pilha = [];
    else if (atual) pilha.push(atual);
    atual = destino;
    desenhar();
  }
  function voltar() {
    if (!atual || atual.nome === "ligando" || atual.nome === "emLigacao") return;
    if (!pilha.length) { if (atual.nome === "home") fechar(); else ir({ nome: "home" }, true); return; }
    atual = pilha.pop();
    desenhar();
  }
  function horaAgora() {
    const d = new Date();
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function desenhar() {
    if (!app) return;
    app.replaceChildren();
    app.className = "cel-app" + (["insta", "post", "dms", "avisos"].includes(atual.nome) || (atual.nome === "chat" && atual.conversa.app === "insta") ? " insta" : "");
    ({ home: telaHome, zap: telaZap, chat: telaChat, insta: telaInsta, post: telaPost, dms: telaDms, avisos: telaAvisos,
      ligando: telaLigando, emLigacao: telaEmLigacao })[atual.nome]();
    atualizarBadge();
  }

  // ---------- telas ----------
  function telaHome() {
    const h = el("div", "cel-home");
    let dia = "";
    try { dia = global.localStorage.getItem("nsf_dia") || ""; } catch (e) { /* sem armazenamento */ }
    h.append(el("div", "cel-relogio", horaAgora()), el("div", "cel-data", dia || "Quinta-feira"));
    const apps = el("div", "cel-apps");
    const icone = (nome, emoji, fundo, n, acao) => {
      const b = botao("cel-icone", null, acao, n ? `${nome} (${n} novas)` : nome);
      const q = el("b", "", emoji); q.style.background = fundo;
      b.append(q, el("span", "", nome));
      if (n) b.appendChild(el("span", "cel-badge", String(n)));
      apps.appendChild(b);
    };
    icone("ZapZap", "💬", "#25d366", zapNovas(), () => ir({ nome: "zap", aba: "conversas" }));
    icone("Instagrão", "📷", "linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)", dmNovas() + avisosNovos(), () => ir({ nome: "insta" }));
    icone("Telefone", "📞", "#4fc3f7", perdidasNovas(), () => ir({ nome: "zap", aba: "chamadas" }));
    h.appendChild(apps);
    const np = el("div", "cel-np");
    np.appendChild(el("span", "", "🌙 Não perturbe"));
    const bnp = botao("", est.naoPerturbe ? "Ligado" : "Desligado", () => {
      est.naoPerturbe = !est.naoPerturbe; salvar(); desenhar();
    });
    bnp.setAttribute("aria-pressed", est.naoPerturbe ? "true" : "false");
    np.appendChild(bnp);
    h.appendChild(np);
    app.appendChild(h);
  }

  function linhaConversa(c, lista) {
    const todas = msgs(c), ult = todas[todas.length - 1], n = naoLidas(c);
    const b = botao("cel-item", null, () => ir({ nome: "chat", conversa: c }));
    const meio = el("span", "meio");
    meio.append(el("div", "nome", c.nome),
      el("div", "prev", ult ? (ult.sis || (ult.de === "eu" ? "Você: " : c.grupo ? ult.de + ": " : "") + (ult.t || "")) : ""));
    b.append(avatar(c.nome, c.cor, c.grupo ? "💀" : null), meio);
    if (n) b.appendChild(el("span", "num", String(n)));
    lista.appendChild(b);
  }

  function telaZap() {
    const topo = el("div", "cel-topo");
    topo.append(el("h2", "", "ZapZap"), el("span", "", "🔍"));
    const abas = el("div", "cel-abas");
    abas.setAttribute("role", "tablist");
    for (const [id, nome] of [["conversas", "Conversas"], ["chamadas", "Chamadas"]]) {
      const b = botao("", nome + (id === "chamadas" && perdidasNovas() ? ` (${perdidasNovas()})` : ""), () => { atual.aba = id; desenhar(); });
      b.setAttribute("role", "tab"); b.setAttribute("aria-selected", atual.aba === id ? "true" : "false");
      abas.appendChild(b);
    }
    const lista = el("div", "cel-lista");
    if (atual.aba === "chamadas") {
      for (const x of est.chamadas) x.vista = true;
      salvar();
      for (const l of DADOS.ligacoes) { // ligar de volta
        const b = botao("cel-item", null, () => fazerLigacao(l));
        const meio = el("span", "meio");
        meio.append(el("div", "nome", l.nome), el("div", "prev", "Toque para ligar"));
        b.append(avatar(l.nome, l.cor), meio, el("span", "", "📞"));
        lista.appendChild(b);
      }
      if (!est.chamadas.length) lista.appendChild(el("div", "cel-item", "Nenhuma chamada ainda."));
      for (const x of est.chamadas.slice().reverse().slice(0, 30)) {
        const d = el("div", "cel-item");
        const meio = el("span", "meio");
        meio.append(el("div", "nome" + (x.perdida ? " perdida" : ""), x.nome),
          el("div", "prev", (x.perdida ? "↙ Perdida" : x.feita ? "↗ Feita" : "↙ Atendida") + " · " + x.hora));
        d.append(avatar(x.nome, (DADOS.ligacoes.find((l) => l.id === x.id) || {}).cor), meio);
        lista.appendChild(d);
      }
    } else {
      for (const c of CONVERSAS) if (c.app === "zap") linhaConversa(c, lista);
    }
    app.append(topo, abas, lista);
  }

  function telaChat() {
    const c = atual.conversa, inf = info(c);
    const topo = el("div", "cel-topo");
    const tit = el("div", "tit");
    tit.append(el("h2", "", c.nome), el("small", "", atual.digitando ? "digitando…" : c.grupo ? c.membros.join(", ") + ", Você" : "online"));
    topo.append(botao("", "←", voltar, "Voltar"), avatar(c.nome, c.cor, c.grupo ? "💀" : null), tit);
    const area = el("div", "cel-msgs");
    const cores = {};
    (c.membros || []).forEach((m, i) => { cores[m] = CORES_AUTOR[i % CORES_AUTOR.length]; });
    for (const m of msgs(c)) {
      if (m.sis) { area.appendChild(el("div", "cel-sis", m.sis)); continue; }
      const eu = m.de === "eu", b = el("div", "cel-msg" + (eu ? " eu" : ""));
      if (c.grupo && !eu) { const a = el("span", "autor", m.de); a.style.color = cores[m.de] || "#555"; b.appendChild(a); }
      b.appendChild(doc.createTextNode(m.t));
      area.appendChild(b);
    }
    inf.lidas = msgs(c).filter((m) => !m.sis).length;
    salvar();
    const rodada = rodadaAtual(c);
    let baixo;
    if (rodada && !atual.digitando) {
      baixo = el("div", "cel-resp");
      baixo.appendChild(el("small", "", "Responder:"));
      for (const o of rodada.opcoes) baixo.appendChild(botao("", o.eu, () => responder(c, o)));
    } else {
      baixo = el("div", "cel-campo", atual.digitando ? "…" : "Mensagem");
    }
    app.append(topo, area, baixo);
    area.scrollTop = area.scrollHeight;
  }

  function responder(c, o) {
    const inf = info(c), tela0 = atual;
    inf.extras.push({ de: "eu", t: o.eu });
    inf.rodada++;
    salvar();
    tela0.digitando = true;
    desenhar();
    const voltas = o.volta || [];
    let k = 0;
    const proxima = () => {
      if (k >= voltas.length) {
        if (!voltas.length) inf.extras.push({ sis: "Visualizou e não respondeu 👀" });
        tela0.digitando = false; salvar();
        if (atual === tela0) desenhar(); else atualizarBadge();
        return;
      }
      const v = voltas[k++];
      inf.extras.push(typeof v === "string" ? { de: c.grupo ? "?" : "ela", t: v } : v);
      salvar();
      if (atual === tela0) desenhar(); else atualizarBadge();
      setTimeout(proxima, 1100 + Math.random() * 600);
    };
    setTimeout(proxima, voltas.length ? 1300 : 1600);
  }

  function telaInsta() {
    const d = DADOS.dono;
    const topo = el("div", "cel-topo");
    const bAv = botao("", "♡", () => { est.avisosVistos = true; salvar(); ir({ nome: "avisos" }); }, "Notificações");
    if (avisosNovos()) bAv.appendChild(el("span", "cel-badge", String(avisosNovos())));
    const bDm = botao("", "✈", () => ir({ nome: "dms" }), "Mensagens diretas");
    if (dmNovas()) bDm.appendChild(el("span", "cel-badge", String(dmNovas())));
    topo.append(el("h2", "", "Instagrão"), bAv, bDm);
    const lista = el("div", "cel-lista");
    const perfil = el("div", "cel-perfil"), linha = el("div", "linha"), nums = el("div", "nums");
    for (const [n, r] of [[DADOS.posts.length, "posts"], [d.seguidores, "seguidores"], [d.seguindo, "seguindo"]]) {
      const s = el("span"); s.append(el("b", "", String(n)), doc.createTextNode(r)); nums.appendChild(s);
    }
    linha.append(el("span", "foto", "🥸"), nums);
    perfil.append(el("div", "", "@" + d.insta), linha, el("div", "bio"));
    perfil.lastChild.append(el("b", "", d.nome), doc.createTextNode("\n" + d.bio));
    perfil.firstChild.style.cssText = "font-weight:700;margin-bottom:10px";
    const grade = el("div", "cel-grade");
    DADOS.posts.forEach((p, i) => {
      const b = botao("", p.icone, () => ir({ nome: "post", i }), "Foto: " + p.legenda);
      b.style.background = p.fundo;
      grade.appendChild(b);
    });
    lista.append(perfil, grade);
    app.append(topo, lista);
  }
  function telaPost() {
    const p = DADOS.posts[atual.i], curti = !!est.curtidas[atual.i];
    const topo = el("div", "cel-topo");
    topo.append(botao("", "←", voltar, "Voltar"), el("h2", "", "Publicação"));
    const corpo = el("div", "cel-post");
    const img = el("div", "img", p.icone); img.style.background = p.fundo;
    const acoes = el("div", "acoes");
    acoes.append(botao("", curti ? "❤️" : "🤍", () => {
      est.curtidas[atual.i] = !curti; salvar();
      if (!curti && NSF.Audio && NSF.Audio.curtida) NSF.Audio.curtida();
      desenhar();
    }, curti ? "Descurtir" : "Curtir"), el("span", "", (p.curtidas + (curti ? 1 : 0)) + " curtidas"));
    const leg = el("p");
    leg.append(el("b", "", DADOS.dono.insta + " "), doc.createTextNode(p.legenda));
    corpo.append(img, acoes, leg);
    app.append(topo, corpo);
  }
  function telaDms() {
    const topo = el("div", "cel-topo");
    topo.append(botao("", "←", voltar, "Voltar"), el("h2", "", DADOS.dono.insta));
    const lista = el("div", "cel-lista");
    for (const c of CONVERSAS) if (c.app === "insta") linhaConversa(c, lista);
    app.append(topo, lista);
  }
  function telaAvisos() {
    const topo = el("div", "cel-topo");
    topo.append(botao("", "←", voltar, "Voltar"), el("h2", "", "Notificações"));
    const lista = el("div", "cel-lista");
    for (const a of DADOS.avisos) lista.appendChild(el("div", "cel-item", a));
    app.append(topo, lista);
  }

  // ---------- cartão "ligando…" no centro da tela (o celular do canto vibra junto) ----------
  // Serve para as ligações do celular e para as do jogo (ex.: a Gatinha de Campinas): NSF.Celular.chamadaCentral({...}).
  let central = null;
  function chamadaCentral(o) {
    fecharCentral();
    const c = el("div", "cel-central");
    c.setAttribute("role", "alertdialog"); c.setAttribute("aria-label", o.nome + " ligando");
    c.append(avatar(o.nome, o.cor, o.emoji), el("h2", "", o.nome), el("div", "sub", "ligando pra você…"));
    const par = el("div", "par");
    const lado = (b, rot) => { const d = el("div"); d.append(b, el("span", "", rot)); return d; };
    par.append(lado(botao("cel-redondo vermelho", "✆", () => { fecharCentral(); if (o.aoRecusar) o.aoRecusar(); }, "Recusar"), "Recusar"),
      lado(botao("cel-redondo verde", "✆", () => { fecharCentral(); if (o.aoAtender) o.aoAtender(); }, "Atender"), "Atender"));
    c.appendChild(par);
    c.addEventListener("click", (e) => e.stopPropagation());
    doc.body.appendChild(c);
    bCel.classList.add("tocando");
    central = c;
    const verde = c.querySelector(".verde"); if (verde) verde.focus({ preventScroll: true });
    return { fechar: fecharCentral };
  }
  function fecharCentral() { if (central) { central.remove(); central = null; } bCel.classList.remove("tocando"); }

  // ---------- ligações (Bruno Moon e Carioca ligando toda hora) ----------
  let chamada = null; // { l, perdeRelogio, feita }
  const tocandoAviso = () => { const t = doc.getElementById("tocando"); return t && t.classList.contains("visivel"); };
  const ocupado = () => {
    const a = global.NSF_APTO;
    return ligacaoDoJogoAberta() || tocandoAviso() || !!central || (a && a.porta && (a.porta.menu || a.porta.saindo)) || !!chamada;
  };
  function registrar(l, como) {
    est.chamadas.push({ id: l.id, nome: l.nome, hora: horaAgora(), perdida: como === "perdida", feita: como === "feita" });
    if (est.chamadas.length > 60) est.chamadas.splice(0, est.chamadas.length - 60);
    salvar();
  }
  function tocarAgora() {
    const ls = DADOS.ligacoes;
    if (!ls.length) return;
    est.proximaLig = ((est.proximaLig || 0) + 1) % ls.length;
    const l = ls[est.proximaLig];
    chamada = { l };
    if (NSF.Audio) NSF.Audio.toque(true);
    if (tela) ir({ nome: "ligando", l });
    else chamadaCentral({ nome: l.nome, cor: l.cor, aoRecusar: recusar, aoAtender: () => { abrir({ nome: "ligando", l }); atender(); } });
    chamada.perdeRelogio = setTimeout(() => { // ninguém atendeu
      pararToque();
      registrar(l, "perdida");
      chamada = null;
      if (atual && atual.nome === "ligando") ir({ nome: "home" }, true);
      mostrarAviso(`Chamada perdida de ${l.nome}`, "Ele vai ligar de novo, pode apostar", () => abrir({ nome: "zap", aba: "chamadas" }), 4500);
      atualizarBadge();
    }, 16000);
  }
  function pararToque() {
    if (NSF.Audio) NSF.Audio.toque(false);
    fecharCentral();
    esconderAviso();
    if (chamada) clearTimeout(chamada.perdeRelogio);
  }
  function recusar() {
    if (!chamada) return;
    pararToque();
    registrar(chamada.l, "perdida");
    est.chamadas[est.chamadas.length - 1].vista = true;
    salvar();
    chamada = null;
    if (tela) ir({ nome: "home" }, true);
  }
  function atender() {
    if (!chamada) return;
    pararToque();
    registrar(chamada.l, chamada.feita ? "feita" : "atendida");
    ir({ nome: "emLigacao", l: chamada.l, falas: [], inicio: Date.now() }, true);
    rodarConversa();
  }
  function fazerLigacao(l) { // ligar de volta: chama um pouco e ele atende
    if (chamada) return;
    chamada = { l, feita: true };
    ir({ nome: "ligando", l, saindo: true }, true);
    chamada.perdeRelogio = setTimeout(atender, 2200);
  }
  function telaLigando() {
    const l = atual.l, c = el("div", "cel-chamada");
    const cima = el("div");
    cima.append(avatar(l.nome, l.cor), el("h2", "", l.nome), el("div", "sub", atual.saindo ? "chamando…" : "ligando pra você…"));
    const par = el("div", "par");
    if (atual.saindo) par.appendChild(botao("cel-redondo vermelho", "✆", () => { clearTimeout(chamada.perdeRelogio); chamada = null; ir({ nome: "home" }, true); }, "Desligar"));
    else par.append(botao("cel-redondo vermelho", "✆", recusar, "Recusar"), botao("cel-redondo verde", "✆", atender, "Atender"));
    c.append(cima, par);
    app.appendChild(c);
  }
  function telaEmLigacao() {
    const l = atual.l, c = el("div", "cel-chamada");
    const cima = el("div");
    const av = avatar(l.nome, l.cor); av.style.animation = "none"; av.style.width = av.style.height = "72px"; av.style.fontSize = "30px";
    cima.append(av, el("h2", "", l.nome), el("div", "sub", tempoLigacao()));
    const falas = el("div", "falas");
    for (const f of atual.falas) falas.appendChild(el("div", f.eu ? "eu" : "", f.t));
    c.append(cima, falas);
    if (atual.opcoes) {
      const op = el("div", "opcoes");
      for (const o of atual.opcoes) op.appendChild(botao("", o.eu, () => escolherNaLigacao(o)));
      c.appendChild(op);
    }
    c.appendChild(botao("cel-redondo vermelho", "✆", () => encerrarLigacao(false), "Desligar"));
    app.appendChild(c);
    falas.scrollTop = falas.scrollHeight;
  }
  function tempoLigacao() {
    const seg = Math.floor((Date.now() - atual.inicio) / 1000);
    return `em ligação · ${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, "0")}`;
  }
  function falarNaLigacao(lista, eu, depois) {
    const tela0 = atual;
    let k = 0;
    const prox = () => {
      if (atual !== tela0) return;
      if (k >= lista.length) { depois(); return; }
      tela0.falas.push({ t: lista[k++], eu });
      desenhar();
      setTimeout(prox, 1500);
    };
    prox();
  }
  // Passos de uma ligação: { quem: "ele" | "eu", t: "fala" } ou { quem, audio: "voz gravada" } (toca a voz e mostra
  // só a ondinha, sem legenda; sem o pacote dos amigos aberto ou sem som liberado, o áudio é pulado).
  function rodarPassos(passos, depois) {
    const tela0 = atual;
    let k = 0;
    const prox = () => {
      if (atual !== tela0) return;
      if (k >= passos.length) { depois(); return; }
      const p = passos[k++], eu = p.quem === "eu";
      if (!p.audio) { tela0.falas.push({ t: p.t, eu }); desenhar(); setTimeout(prox, 1600); return; }
      const A = NSF.Audio, url = NSF.VIP ? NSF.VIP.url(p.audio) : p.audio;
      if (!A || !A.voz) { prox(); return; }
      let fim = null;
      A.voz(url, () => { if (fim) fim(); }).then(() => {
        const linha = { t: "🔊 ▂▃▅▇▅▃▂▃▅", eu };
        tela0.falas.push(linha); desenhar();
        fim = () => { linha.t = "🔊 áudio"; if (atual === tela0) desenhar(); setTimeout(prox, 700); };
      }).catch(() => prox());
    };
    prox();
  }
  function rodarConversa() {
    const l = atual.l, n = est.vez[l.id] || 0, conv = l.conversas[n % l.conversas.length];
    est.vez[l.id] = n + 1; salvar();
    const tela0 = atual;
    const opcoes = () => {
      if (conv.opcoes && conv.opcoes.length) { tela0.opcoes = conv.opcoes; if (atual === tela0) desenhar(); }
      else setTimeout(() => { if (atual === tela0) encerrarLigacao(false); }, 2200); // sem escolha: desliga sozinho
    };
    const passos = conv.passos || (conv.falas || []).map((t) => ({ quem: "ele", t }));
    setTimeout(() => rodarPassos(passos, opcoes), 600);
  }
  function escolherNaLigacao(o) {
    const tela0 = atual;
    tela0.opcoes = null;
    tela0.falas.push({ t: o.eu, eu: true });
    desenhar();
    setTimeout(() => falarNaLigacao(o.volta || [], false, () => setTimeout(() => {
      if (atual === tela0) encerrarLigacao(false);
    }, 1800)), 900);
  }
  function encerrarLigacao(fechando) {
    chamada = null;
    if (!fechando && tela) ir({ nome: "home" }, true);
    agendarLigacao();
  }

  let ligRelogio = null;
  function agendarLigacao(seg) {
    clearTimeout(ligRelogio);
    const s = seg || 70 + Math.random() * 70;
    ligRelogio = setTimeout(() => {
      if (est.naoPerturbe || doc.hidden) { agendarLigacao(30); return; }
      if (ocupado() || (atual && (atual.nome === "chat" && atual.digitando))) { agendarLigacao(15); return; }
      tocarAgora();
      agendarLigacao();
    }, s * 1000);
  }

  // ---------- relógio: mensagens que chegam com o tempo ----------
  for (const c of CONVERSAS) receberNovas(c);
  setInterval(() => {
    if (doc.hidden) return;
    est.segundos++;
    if (atual && atual.nome === "emLigacao" && app) { const sub = app.querySelector(".sub"); if (sub) sub.textContent = tempoLigacao(); }
    if (est.segundos % 5 === 0) salvar();
    for (const c of CONVERSAS) {
      if (!receberNovas(c)) continue;
      const m = c.novas[0];
      const ver = () => abrir({ nome: c.app === "insta" ? "dms" : "zap", aba: "conversas" });
      if (!tela && !chamada) mostrarAviso(`${c.app === "insta" ? "📷" : "💬"} ${c.nome}`, (c.grupo ? m.de + ": " : "") + m.t, ver, 5000);
      if (tela && atual && ["home", "zap", "dms", "insta"].includes(atual.nome)) desenhar();
      if (NSF.Audio && NSF.Audio.curtida) NSF.Audio.curtida();
      atualizarBadge();
    }
  }, 1000);

  // O jogo para enquanto alguma tela está aberta (NSF.Ligacao.aberta()): o celular conta como tela aberta.
  const ligacaoDoJogoAberta = (NSF.Ligacao && NSF.Ligacao.aberta) || (() => false);
  if (NSF.Ligacao) NSF.Ligacao.aberta = () => ligacaoDoJogoAberta() || aberto();

  bCel.addEventListener("click", (e) => {
    e.stopPropagation();
    if (chamada && !tela) abrir({ nome: "ligando", l: chamada.l });
    else if (tela) fechar();
    else abrir();
  });
  doc.addEventListener("keydown", (e) => { if (e.key === "Escape" && tela) { e.stopPropagation(); voltar(); } }, true);

  atualizarBadge();
  if (!/[?&](test|semcelular)/.test(global.location.search)) agendarLigacao(40 + Math.random() * 25);
  // Conversa nova (ex.: paquera que deu certo): "chega" conta a partir de agora.
  function novaConversa(c) {
    const nova = Object.assign({}, c, { chega: est.segundos + (c.chega || 0) });
    est.dinamicas.unshift(nova); CONVERSAS.unshift(nova);
    salvar(); atualizarBadge();
    if (tela && atual && ["home", "zap"].includes(atual.nome)) desenhar();
  }
  NSF.Celular = { abrir, fechar, aberto, tocarAgora, novaConversa, chamadaCentral, fecharCentral, estado: () => est };
})(typeof window !== "undefined" ? window : globalThis);
