// Paquera estilo Stardew Valley: tocar numa menina (NPC com  paquera: "<perfil>") abre a caixa de diálogo embaixo,
// com o retrato dela, o texto aparecendo letra a letra e as respostas para escolher. Cada resposta muda o interesse
// dela (corações); no fim ele faz o convite para o vinho e ela topa... ou manda ele ir catar coquinho.
// Algumas nem dão bola; cantada pesada com quem não curte = tapa. Uma tentativa por menina por dia (salvo no navegador).
// Conteúdo em js/dialogos/paquera.js. API: NSF.Paquera.abrir(npc) ; .aberta() ; .resultado(npc) ; ?paquera=zerar recomeça.
(function (global) {
  "use strict";
  const doc = global.document, NSF = global.NSF, DADOS = NSF && NSF.PAQUERA;
  if (!doc || !DADOS) return;

  const CSS = `
  .pq-fundo { position: fixed; inset: 0; z-index: 27; background: linear-gradient(transparent 40%, rgba(5,2,12,.55)); }
  .pq-caixa { position: fixed; left: 50%; bottom: max(10px, env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 28;
    width: min(820px, calc(100vw - 16px)); display: grid; grid-template-columns: 1fr auto; gap: 14px; padding: 18px 16px 14px;
    background: #2a1840; border: 4px solid #ff8be6; border-radius: 10px; color: #fff3fb;
    box-shadow: 0 0 0 4px #12081d, 0 0 0 6px #b0279a, 0 10px 30px rgba(0,0,0,.6), inset 0 0 0 2px #4a2a6a;
    font: 25px/1.15 "VT323", ui-monospace, monospace; animation: pq-sobe .2s ease-out; }
  .pq-placa { position: absolute; top: -20px; left: 18px; background: #ff8be6; color: #2a0f3d; font: 700 15px system-ui, sans-serif;
    padding: 3px 12px; border-radius: 6px; box-shadow: 0 0 0 3px #12081d; letter-spacing: .02em; }
  .pq-placa.eu { background: #59e8ff; } .pq-placa.narra { background: #ffd36b; }
  .pq-texto { min-height: 4.6em; white-space: pre-wrap; word-break: break-word; }
  .pq-texto.narra { color: #ffe7a8; font-style: italic; }
  .pq-seta { position: absolute; right: 168px; bottom: 10px; color: #ff8be6; animation: pq-pula .6s ease-in-out infinite alternate; font-size: 22px; }
  .pq-opcoes { display: flex; flex-direction: column; gap: 6px; margin-top: 2px; }
  .pq-opcoes button { text-align: left; font: inherit; font-size: 23px; color: #fff3fb; background: rgba(255,255,255,.06);
    border: 2px solid transparent; border-radius: 6px; padding: 4px 10px 4px 28px; cursor: pointer; position: relative; line-height: 1.1; }
  .pq-opcoes button::before { content: attr(data-n); position: absolute; left: 8px; color: #b9a8dd; }
  .pq-opcoes button:hover, .pq-opcoes button:focus-visible { border-color: #ff8be6; background: rgba(255,139,230,.14); outline: none; }
  .pq-opcoes button:hover::before, .pq-opcoes button:focus-visible::before { content: "►"; color: #ff8be6; }
  .pq-lado { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 140px; }
  .pq-retrato { position: relative; width: 132px; height: 132px; border: 4px solid #ffd36b; border-radius: 8px; overflow: hidden;
    background: radial-gradient(circle at 50% 35%, #6a3a8a, #1b0f2b); box-shadow: 0 0 0 3px #12081d; }
  .pq-retrato img { position: absolute; left: 50%; top: 3%; width: 104%; transform: translateX(-50%); image-rendering: pixelated; }
  .pq-reacao { position: absolute; top: -6px; right: -6px; font-size: 30px; animation: pq-pop .5s ease-out; filter: drop-shadow(0 2px 2px #000); }
  .pq-nome { font: 700 14px system-ui, sans-serif; color: #ffd6f4; text-align: center; line-height: 1.2; }
  .pq-coracoes { font-size: 18px; letter-spacing: 1px; line-height: 1; }
  .pq-coracoes .c { color: #4a2a5a; } .pq-coracoes .c.cheio { color: #ff4f8b; text-shadow: 0 0 6px rgba(255,79,139,.7); }
  .pq-coracoes .c.meio { color: #ff9ab8; }
  .pq-tapa { position: fixed; inset: 0; z-index: 29; display: grid; place-items: center; pointer-events: none;
    font: 900 clamp(60px, 18vw, 140px)/1 system-ui, sans-serif; color: #fff; text-shadow: 0 0 0 #000, 6px 6px 0 #e8263f, 0 0 30px #ff2a55;
    background: rgba(255,255,255,.85); animation: pq-tapa .9s ease-out forwards; }
  .pq-treme { animation: pq-treme .35s linear 2; }
  @keyframes pq-sobe { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }
  @keyframes pq-pula { to { transform: translateY(4px); } }
  @keyframes pq-pop { 0% { transform: scale(0); } 60% { transform: scale(1.35); } 100% { transform: scale(1); } }
  @keyframes pq-tapa { 0% { background: rgba(255,255,255,.9); transform: scale(1.4); } 30% { transform: scale(1); } 100% { background: rgba(255,255,255,0); opacity: 0; } }
  @keyframes pq-treme { 0%, 100% { translate: 0 0; } 25% { translate: -10px 4px; } 50% { translate: 9px -5px; } 75% { translate: -6px -3px; } }
  @media (max-width: 560px) {
    .pq-caixa { grid-template-columns: 1fr 92px; font-size: 21px; padding: 16px 10px 10px; gap: 8px; }
    .pq-lado { width: 92px; } .pq-retrato { width: 88px; height: 88px; } .pq-seta { right: 110px; }
    .pq-opcoes button { font-size: 20px; }
  }
  @media (prefers-reduced-motion: reduce) { .pq-caixa, .pq-seta, .pq-reacao, .pq-tapa, .pq-treme { animation: none; } }`;

  // ---------- estado do dia: uma tentativa por menina por dia ----------
  const CHAVE = "nsf_paquera";
  const diaAtual = () => { try { return global.localStorage.getItem("nsf_dia") || "0"; } catch (e) { return "0"; } };
  let est = {};
  try {
    if (/[?&]paquera=zerar/.test(global.location.search)) global.localStorage.removeItem(CHAVE);
    est = JSON.parse(global.localStorage.getItem(CHAVE) || "{}") || {};
  } catch (e) { est = {}; }
  est.conquistas = est.conquistas || [];
  function doDia() { if (est.dia !== diaAtual()) { est.dia = diaAtual(); est.r = {}; } return est.r; }
  function salvar() { try { global.localStorage.setItem(CHAVE, JSON.stringify(est)); } catch (e) { /* sem armazenamento */ } }
  const resultado = (n) => (n && n.paquera ? doDia()[n.paquera] || null : null);

  // ---------- caixa ----------
  let fundo = null, caixa = null, placa, texto, opcoes, seta, retrato, reacao, coracoes, avancar = null, digitando = null;
  let aberta = false, npc = null, perfil = null, interesse = 0;

  function el(tag, classe, t) { const e = doc.createElement(tag); if (classe) e.className = classe; if (t != null) e.textContent = t; return e; }
  function montar() {
    if (!doc.getElementById("pq-css")) {
      const s = el("style"); s.id = "pq-css"; s.textContent = CSS; doc.head.appendChild(s);
      const f = el("link"); f.rel = "stylesheet"; f.href = "https://fonts.googleapis.com/css2?family=VT323&display=swap"; doc.head.appendChild(f);
    }
    fundo = el("div", "pq-fundo");
    caixa = el("div", "pq-caixa");
    caixa.setAttribute("role", "dialog"); caixa.setAttribute("aria-live", "polite");
    const esq = el("div");
    placa = el("div", "pq-placa"); texto = el("div", "pq-texto"); opcoes = el("div", "pq-opcoes"); seta = el("div", "pq-seta", "▼");
    esq.append(placa, texto, opcoes);
    const lado = el("div", "pq-lado");
    retrato = el("div", "pq-retrato");
    const img = el("img"); img.alt = ""; img.src = perfil.retrato;
    img.onerror = () => { img.remove(); retrato.appendChild(el("div", "", "👩")).style.cssText = "font-size:70px;text-align:center;line-height:132px"; };
    retrato.appendChild(img);
    coracoes = el("div", "pq-coracoes"); coracoes.setAttribute("aria-label", "Interesse dela");
    lado.append(retrato, el("div", "pq-nome", npc.nome), coracoes);
    caixa.append(esq, lado, seta);
    for (const alvo of [fundo, caixa]) alvo.addEventListener("click", (e) => { e.stopPropagation(); tocar(); });
    doc.body.append(fundo, caixa);
    desenharCoracoes();
  }
  function desmontar() { if (fundo) fundo.remove(); if (caixa) caixa.remove(); fundo = caixa = null; }

  function desenharCoracoes() {
    if (!coracoes || perfil.tipo === "freira") { if (coracoes) coracoes.textContent = ""; return; }
    coracoes.replaceChildren();
    for (let i = 0; i < 5; i++) {
      const v = interesse - i * 2;
      coracoes.appendChild(el("span", "c" + (v >= 2 ? " cheio" : v >= 1 ? " meio" : ""), "♥"));
    }
  }
  function mostrarReacao(emoji) {
    if (reacao) reacao.remove();
    reacao = el("span", "pq-reacao", emoji);
    retrato.appendChild(reacao);
  }

  // Avança: se o texto ainda está aparecendo, completa; senão segue.
  function tocar() {
    if (digitando) { digitando(); return; }
    if (avancar) { const a = avancar; avancar = null; a(); }
  }

  // Fala na caixa, letra a letra; resolve quando o jogador toca para seguir.
  function dizer(quem, frase) {
    return new Promise((resolve) => {
      opcoes.replaceChildren();
      placa.className = "pq-placa" + (quem === "eu" ? " eu" : quem === "narra" ? " narra" : "");
      placa.textContent = quem === "eu" ? "Você" : quem === "narra" ? "..." : npc.nome;
      texto.className = "pq-texto" + (quem === "narra" ? " narra" : "");
      texto.textContent = "";
      seta.style.visibility = "hidden";
      let i = 0;
      const letras = [...frase];
      const fim = () => { clearInterval(rel); digitando = null; texto.textContent = frase; seta.style.visibility = ""; avancar = resolve; };
      const rel = setInterval(() => { i += 1; texto.textContent = letras.slice(0, i).join(""); if (i >= letras.length) fim(); }, 28);
      digitando = fim;
    });
  }
  // Mostra as opções; resolve com a escolhida (clique ou teclas 1-3).
  function escolher(lista) {
    return new Promise((resolve) => {
      seta.style.visibility = "hidden";
      opcoes.replaceChildren();
      lista.forEach((o, i) => {
        const b = el("button", "", o.t); b.type = "button"; b.dataset.n = String(i + 1);
        b.addEventListener("click", (e) => { e.stopPropagation(); teclaEscolha = null; resolve(o); });
        opcoes.appendChild(b);
      });
      teclaEscolha = (k) => { const o = lista[k]; if (o) { teclaEscolha = null; resolve(o); } };
      const primeiro = opcoes.querySelector("button"); if (primeiro) primeiro.focus({ preventScroll: true });
    });
  }
  let teclaEscolha = null;

  // Uma boa, uma média e uma ruim (quando tem), embaralhadas.
  const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];
  function tres(lista) {
    const escolhidas = [];
    for (const nota of ["boa", "media", "ruim"]) {
      const da = lista.filter((o) => o.nota === nota && !escolhidas.includes(o));
      if (da.length) escolhidas.push(sortear(da));
    }
    while (escolhidas.length < Math.min(3, lista.length)) {
      const resto = lista.filter((o) => !escolhidas.includes(o));
      escolhidas.push(sortear(resto));
    }
    return escolhidas.sort(() => Math.random() - 0.5);
  }

  function pontos(o) {
    const t = perfil.tipo;
    let p = { boa: 2, media: 1, ruim: -2 }[o.nota] || 0;
    if (o.gosta && o.gosta.includes(t)) p += 2;
    if (o.odeia && o.odeia.includes(t)) p -= 3;
    return p;
  }
  const nivel = (p) => (p >= 3 ? "amou" : p >= 1 ? "gostou" : p === 0 ? "neutro" : p >= -2 ? "nao_curtiu" : "odiou");
  const EMOJI = { amou: "😍", gostou: "😊", neutro: "😐", nao_curtiu: "🙄", odiou: "😤" };
  function fraseReacao(o, nv, p) {
    if (o.volta) return p > 0 ? o.volta.bom : o.volta.ruim;
    const R = DADOS.reacoes, t = (R[perfil.tipo] && R[perfil.tipo][nv]) || R.geral[nv];
    return sortear(t);
  }

  // Ela reage à resposta; devolve o fim da conversa ("fora"/"tapa") ou null para continuar.
  async function reagir(o) {
    const p = pontos(o), nv = nivel(p);
    if (o.tapa && o.odeia && o.odeia.includes(perfil.tipo)) return tapa();
    interesse = Math.max(0, Math.min(10, interesse + p));
    desenharCoracoes();
    mostrarReacao(EMOJI[nv]);
    if (p > 0 && NSF.Audio && NSF.Audio.curtida) NSF.Audio.curtida();
    await dizer("ela", fraseReacao(o, nv, p));
    if (interesse <= 0) { await dizer("ela", perfil.fora); return "fora"; }
    return null;
  }
  async function tapa() {
    mostrarReacao("💢");
    if (NSF.Audio && NSF.Audio.tapa) NSF.Audio.tapa();
    const t = el("div", "pq-tapa", "PÁ!");
    doc.body.appendChild(t);
    setTimeout(() => t.remove(), 950);
    const tela = doc.getElementById("tela");
    for (const e of [caixa, tela]) if (e) { e.classList.remove("pq-treme"); void e.offsetWidth; e.classList.add("pq-treme"); }
    await dizer("narra", "Ela te deu um tapa. A padaria inteira olhou.");
    await dizer("ela", "Se enxerga, ô!");
    return "tapa";
  }

  async function conversa() {
    const ja = resultado(npc);
    if (ja) { // já tentou hoje
      const FRASES = { topou: "Já combinamos, né? Te vejo mais tarde. 😘", fora: "Já falei que não, querido.",
        tapa: "Quer outro? 🖐️", ignorou: "Ela continua sem te dar a menor bola.", desistiu: "Desistiu rapidinho, hein?" };
      await dizer(ja === "ignorou" ? "narra" : "ela", FRASES[ja] || "...");
      return null;
    }
    if (Math.random() < perfil.ignora) { await dizer("narra", perfil.ignorou); return "ignorou"; }

    await dizer("narra", "Você chega perto dela. Ela levanta os olhos.");
    await dizer("ela", sortear(perfil.tipo === "freira" ? ["Pois não, meu filho?"] : ["Oi...?", "Pois não?", "Hm? Posso ajudar?", "Oi! 🙂"]));
    const abertura = await escolher(tres(DADOS.aberturas));
    await dizer("eu", abertura.t);
    let fim = await reagir(abertura);
    if (fim) return fim;

    // dois assuntos: um dela (se tiver) e um geral
    const proprias = (perfil.perguntas || []).slice().sort(() => Math.random() - 0.5);
    const gerais = DADOS.perguntas.slice().sort(() => Math.random() - 0.5);
    const assuntos = [...proprias.slice(0, 1), ...gerais].slice(0, 2);
    for (const a of assuntos) {
      await dizer("ela", a.ela);
      const r = await escolher(tres(a.respostas));
      await dizer("eu", r.t);
      fim = await reagir(r);
      if (fim) return fim;
    }

    await dizer("narra", "Chegou a hora. Faz o convite...");
    const convite = await escolher(tres(DADOS.convites));
    await dizer("eu", convite.t);
    if (convite.tapa && convite.odeia && convite.odeia.includes(perfil.tipo)) return tapa();
    interesse = Math.max(0, Math.min(10, interesse + pontos(convite)));
    desenharCoracoes();
    const meta = 3 + perfil.dificuldade, sorte = Math.random() < 0.5 ? 0 : 1;
    if (perfil.tipo !== "freira" && interesse + sorte >= meta) {
      mostrarReacao("😍");
      if (NSF.Audio && NSF.Audio.curtida) { NSF.Audio.curtida(); setTimeout(NSF.Audio.curtida, 160); setTimeout(NSF.Audio.curtida, 320); }
      await dizer("ela", perfil.topou);
      await dizer("narra", `💕 ${perfil.nome} topou o vinho! Ela salvou seu número e vai te chamar no ZapZap.`);
      return "topou";
    }
    mostrarReacao(perfil.tipo === "freira" ? "🙏" : "🙄");
    await dizer("ela", perfil.fora);
    return "fora";
  }

  async function abrir(n) {
    if (aberta || !n || !n.paquera || !DADOS.perfis[n.paquera]) return false;
    npc = n; perfil = DADOS.perfis[n.paquera]; interesse = 3; aberta = true;
    const a = global.NSF_APTO;
    if (a && a.teclas) a.teclas.clear();
    montar();
    let r = null;
    try { r = await conversa(); } finally {
      desmontar(); aberta = false; avancar = digitando = teclaEscolha = null;
    }
    if (r) {
      doDia()[n.paquera] = r;
      if (r === "topou") {
        est.conquistas.push({ id: n.paquera, nome: perfil.nome, dia: diaAtual() });
        if (NSF.Celular && NSF.Celular.novaConversa && perfil.zap) NSF.Celular.novaConversa({
          id: "paquera_" + n.paquera + "_" + Date.now(), nome: perfil.nome + " 🍷", app: "zap", cor: "#d81b60",
          mensagens: [], chega: 25, novas: [{ de: "ela", t: perfil.zap }],
          rodadas: [{ esperaNovas: true, opcoes: [
            { eu: "Às 21h! Já tô gelando o vinho 🍷", volta: ["Fechado 😘"] },
            { eu: "Agora mesmo, se quiser 😏", volta: ["Calma, apressadinho 😂", "Mais tarde eu te chamo"] },
          ] }] });
      }
      salvar();
      const BALAO = { topou: "💕", fora: "Vai catar coquinho!", tapa: "Hunf! 💢", ignorou: "..." };
      n.balao = { texto: BALAO[r] || "...", ate: performance.now() + 3000 };
    }
    return true;
  }

  doc.addEventListener("keydown", (e) => {
    if (!aberta) return;
    if (teclaEscolha && /^[1-9]$/.test(e.key)) { e.preventDefault(); e.stopPropagation(); teclaEscolha(+e.key - 1); return; }
    if (e.key === " " || e.key === "Enter") { if (!teclaEscolha) { e.preventDefault(); e.stopPropagation(); tocar(); } }
    else e.stopPropagation(); // o personagem não anda com a caixa aberta
  }, true);

  // O jogo para enquanto a caixa está aberta (como nas outras telas).
  const antes = (NSF.Ligacao && NSF.Ligacao.aberta) || (() => false);
  if (NSF.Ligacao) NSF.Ligacao.aberta = () => antes() || aberta;

  NSF.Paquera = { abrir, aberta: () => aberta, resultado, estado: () => est };
})(typeof window !== "undefined" ? window : globalThis);
