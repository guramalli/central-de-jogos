// Planta do ELEVADOR do prédio: passagem obrigatória entre o apartamento (12º andar) e a garagem (G).
// elevador.html?descer=1 (saiu de casa) -> garagem ; elevador.html?subir=1 (chegou de carro) -> apartamento.
// A cena é automática: ele aparece, o mostrador conta os andares e abre um quadro rápido com 4 opções
// (peidar, assobiar, olhar o celular, mexer no bigode), cada uma com som/animação. Quando o elevador chega e a
// ação terminou, "plim", a porta abre e ele sai.
(function (global) {
  "use strict";

  const PE_DIREITO = 2.6, CORTE_FRENTE = 0.35, ESP = 0.12;
  const URL_ATUAL = typeof location !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams("");
  const SOBE = URL_ATUAL.has("subir");
  const ANDAR_CASA = 12;
  const VIAGEM_S = 6;

  const ESPELHO = { nome: "Espelho", tipo: "espelho", plano: "x0", a: 0.45, b: 1.75, z0: 0.95, z1: 2.25 }; // desenhado pelo jogo

  const PLANTA = {
    id: "elevador",
    nome: "Elevador",
    musica: "elevador",
    largura: 2.4, profundidade: 2.2,
    peDireito: PE_DIREITO,
    texturaParede: "parede_elevador",
    artesExtras: ["espelho_bigode", "espelho_bigode2"], // reflexo do close do bigode
    inicio: { x: 1.2, y: 1.3, dir: "baixo" },

    comodos: [
      { nome: "Cabine", x0: 0, y0: 0, x1: 2.4, y1: 2.2, piso: "#3a3a40", piso2: "#424249", piso_arte: "piso_elevador" },
    ],
    caixas: [
      { nome: "", tipo: "parede", x0: -ESP, y0: -ESP, x1: 0, y1: 2.2, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: 0, y0: -ESP, x1: 2.4, y1: 0, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: 2.4, y0: -ESP, x1: 2.4 + ESP, y1: 2.2 + ESP, z1: CORTE_FRENTE },
      { nome: "", tipo: "parede", x0: -ESP, y0: 2.2, x1: 2.4, y1: 2.2 + ESP, z1: CORTE_FRENTE },
    ],
    naParede: [
      // porta da cabine (no fundo, à direita): só abre quando o elevador chega
      { nome: "Porta do elevador", tipo: "porta", plano: "y0", a: 0.55, b: 1.65, z0: 0, z1: 2.1, arte: "porta_cabine",
        saida: true, trancada: true,
        vai: SOBE ? { nome: "Apartamento", url: "apartamento.html?comodo=entrada" }
                  : { nome: "Garagem", url: "garagem.html?comodo=elevador" } },
      { nome: "Painel", tipo: "cardapio", plano: "y0", a: 1.8, b: 2.2, z0: 0.85, z1: 1.55, arte: "painel_elevador" },
      ESPELHO,
    ],
    pontos: [{ nome: "centro", x: 1.2, y: 1.3 }],
    roteiroDemo: ["centro"],

    viagem: { de: SOBE ? 0 : ANDAR_CASA, para: SOBE ? ANDAR_CASA : 0, inicio: null, segundos: VIAGEM_S },
    efeitos: [],    // partículas da ação: nuvenzinha do peido, notas do assobio, corações das curtidas
    legenda: null,  // { texto, ate }
    curtidas: null, // { n, ate }
    reflexo: null,  // instante em que começou a mexer no bigode (o espelho mostra o close)

    aoDesenhar(ctx, T, agora) {
      // mostrador acima da porta: andar atual e seta
      const v = PLANTA.viagem;
      const p = v.inicio == null ? 0 : Math.min(1, (agora - v.inicio) / (v.segundos * 1000));
      const andar = Math.round(v.de + (v.para - v.de) * p);
      const texto = (andar === 0 ? "G" : String(andar)) + (p > 0 && p < 1 ? (v.para > v.de ? " ▲" : " ▼") : "");
      const [x, y] = T(1.1, 0, 2.3);
      ctx.save();
      ctx.translate(x, y); ctx.transform(1, -0.5, 0, 1, 0, 0); // no plano da parede do fundo
      ctx.fillStyle = "#120a08"; ctx.fillRect(-34, -13, 68, 26);
      ctx.strokeStyle = "#6b6b70"; ctx.lineWidth = 2; ctx.strokeRect(-34, -13, 68, 26);
      ctx.fillStyle = "#ffb347"; ctx.shadowColor = "#ff8a1f"; ctx.shadowBlur = 8;
      ctx.font = "700 17px ui-monospace, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(texto, 0, 1);
      ctx.restore();
      desenharEfeitos(ctx, T, agora);
    },

    aoIniciar(api, info) {
      PLANTA.api = api;
      if (api.heroi && global.NSF.Poses) global.NSF.Poses.preparar(api.heroi);
      setTimeout(comecar, info && info.chegando ? 2600 : 400);
    },
  };

  // ---------------------------------------------------------------- a viagem
  let escolheu = false, chegou = false;
  function comecar() {
    PLANTA.viagem.inicio = performance.now();
    setTimeout(mostrarOpcoes, 600);
    setTimeout(() => { chegou = true; talvezSair(); }, VIAGEM_S * 1000);
  }
  function talvezSair() {
    if (!escolheu || !chegou) return;
    const api = PLANTA.api, porta = PLANTA.naParede[0];
    if (global.NSF.Audio) global.NSF.Audio.ding();
    porta.trancada = false;
    api.porta.aberta = true;
    setTimeout(() => api.sair(porta.vai), 900);
  }

  // Quadro rápido: só as opções (sem conversa), em cima do mapa.
  const OPCOES = [
    { id: "peidar", texto: "Peidar", icone: "💨" },
    { id: "assobiar", texto: "Assobiar uma música", icone: "🎵" },
    { id: "celular", texto: "Olhar o celular", icone: "📱" },
    { id: "bigode", texto: "Mexer no bigode", icone: "🥸" },
  ];
  function mostrarOpcoes() {
    const doc = global.document;
    const caixa = doc.createElement("div");
    caixa.className = "escolha";
    caixa.setAttribute("role", "dialog");
    caixa.setAttribute("aria-label", "O que fazer no elevador");
    const t = doc.createElement("div");
    t.className = "escolha-titulo";
    t.textContent = SOBE ? "Subindo... o que fazer?" : "Descendo... o que fazer?";
    caixa.appendChild(t);
    const grade = doc.createElement("div");
    grade.className = "escolha-grade";
    for (const op of OPCOES) {
      const b = doc.createElement("button");
      b.dataset.acao = op.id;
      const ic = doc.createElement("span");
      ic.className = "escolha-icone"; ic.textContent = op.icone; ic.setAttribute("aria-hidden", "true");
      b.append(ic, doc.createTextNode(op.texto));
      b.addEventListener("click", () => { caixa.remove(); fazer(op.id); });
      grade.appendChild(b);
    }
    caixa.appendChild(grade);
    doc.body.appendChild(caixa);
    grade.querySelector("button").focus();
  }

  // ---------------------------------------------------------------- as ações
  function fazer(id) {
    const api = PLANTA.api, jog = api.jog, heroi = api.heroi, Audio = global.NSF.Audio, agora = performance.now();
    let dur = 2600;
    if (id === "peidar") {
      if (Audio) Audio.peido();
      for (let k = 0; k < 7; k++) PLANTA.efeitos.push({ tipo: "nuvem", t0: agora + k * 90, dur: 1800, dx: -10 + k * 6, sem: k });
      legenda("Ninguém vai saber...", 2200);
    } else if (id === "assobiar") {
      if (Audio) Audio.assobio();
      for (let k = 0; k < 8; k++) PLANTA.efeitos.push({ tipo: "nota", t0: agora + k * 300, dur: 1400, sem: k });
      legenda("♪ fiu-fiu ♪", 2600);
      dur = 2900;
    } else if (id === "celular") {
      jog.dir = "baixo";
      if (heroi) { heroi.vestir("celular_mao"); jog.pose = "celular"; }
      PLANTA.curtidas = { n: 37, ate: agora + 4300 };
      for (let k = 0; k < 9; k++) {
        const t0 = agora + 500 + k * 380;
        PLANTA.efeitos.push({ tipo: "coracao", t0, dur: 1300, sem: k });
        setTimeout(() => { if (Audio) Audio.curtida(); if (PLANTA.curtidas) PLANTA.curtidas.n += 1 + (k % 3); }, t0 - agora);
      }
      setTimeout(() => legenda("@gatinha_campinas curtiu sua foto", 1800), 2200);
      dur = 4300;
    } else if (id === "bigode") {
      jog.dir = "esquerda"; // virado para o espelho
      if (heroi) { heroi.vestir("pose_bigode"); jog.pose = "bigode"; }
      PLANTA.reflexo = agora;
      ESPELHO.arte = "espelho_bigode"; // já no primeiro quadro
      legenda("Tá no ponto.", 3000);
      dur = 3200;
    }
    setTimeout(() => {
      PLANTA.reflexo = null; PLANTA.curtidas = null; ESPELHO.arte = undefined;
      jog.pose = null;
      if (heroi) { heroi.tirar("celular_mao"); heroi.tirar("pose_bigode"); }
      jog.dir = "baixo";
      escolheu = true;
      talvezSair();
    }, dur);
  }
  function legenda(texto, ms) { PLANTA.legenda = { texto, ate: performance.now() + ms }; }

  // Partículas e balões em volta do personagem (a posição dele na tela vem de T).
  function desenharEfeitos(ctx, T, agora) {
    const api = PLANTA.api;
    if (!api) return;
    const jog = api.jog;
    // reflexo no espelho: alterna os dois quadros do close (a mão "enrolando" o bigode)
    if (PLANTA.reflexo) ESPELHO.arte = Math.floor((agora - PLANTA.reflexo) / 280) % 2 ? "espelho_bigode2" : "espelho_bigode";
    const [px, py] = T(jog.x, jog.y, 0);
    const k = py - T(jog.x, jog.y, 1)[1]; // px por metro de altura
    PLANTA.efeitos = PLANTA.efeitos.filter((e) => agora < e.t0 + e.dur);
    for (const e of PLANTA.efeitos) {
      const u = (agora - e.t0) / e.dur;
      if (u < 0) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - u);
      if (e.tipo === "nuvem") {
        const x = px - 30 + e.dx - u * 40, y = py - 0.55 * k - u * 30 + Math.sin(e.sem * 2 + u * 6) * 6;
        ctx.fillStyle = "rgba(150,200,90,0.75)";
        ctx.beginPath(); ctx.arc(x, y, 10 + u * 22, 0, 7); ctx.fill();
      } else if (e.tipo === "nota") {
        const x = px + 30 + Math.sin(e.sem * 1.7 + u * 5) * 18, y = py - 1.75 * k - u * 70;
        ctx.fillStyle = "#ffd36b"; ctx.font = "700 26px system-ui, sans-serif"; ctx.textAlign = "center";
        ctx.fillText(e.sem % 2 ? "♪" : "♫", x, y);
      } else if (e.tipo === "coracao") {
        const x = px + 18 + Math.sin(e.sem * 2.3 + u * 4) * 16, y = py - 1.2 * k - u * 90;
        coracao(ctx, x, y, 9 + (1 - u) * 4);
      }
      ctx.restore();
    }
    if (PLANTA.curtidas && agora < PLANTA.curtidas.ate) { // contador de curtidas
      const x = px + 62, y = py - 1.15 * k;
      ctx.save();
      ctx.fillStyle = "rgba(20,12,30,0.9)"; ctx.strokeStyle = "#ff5ad8"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(x - 4, y - 16, 112, 28, 14); ctx.fill(); ctx.stroke();
      coracao(ctx, x + 14, y - 3, 7);
      ctx.fillStyle = "#fff"; ctx.font = "700 14px system-ui, sans-serif"; ctx.textBaseline = "middle";
      ctx.fillText(PLANTA.curtidas.n + " curtidas", x + 26, y - 2);
      ctx.restore();
    }
    if (PLANTA.legenda && agora < PLANTA.legenda.ate) { // balão rápido acima da cabeça
      const x = px, y = py - 2.05 * k;
      ctx.save();
      ctx.font = "600 15px system-ui, sans-serif";
      const w = ctx.measureText(PLANTA.legenda.texto).width + 22;
      ctx.fillStyle = "rgba(22,13,36,0.95)"; ctx.strokeStyle = "#cdbdf0"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(x - w / 2, y - 30, w, 28, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#f3ecff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(PLANTA.legenda.texto, x, y - 16);
      ctx.restore();
    }
  }
  function coracao(ctx, x, y, r) {
    ctx.fillStyle = "#ff2d55";
    ctx.beginPath();
    ctx.arc(x - r / 2, y, r / 2, Math.PI, 0); ctx.arc(x + r / 2, y, r / 2, Math.PI, 0);
    ctx.lineTo(x, y + r * 0.95); ctx.closePath(); ctx.fill();
  }

  if (global.NSF) { global.NSF.PLANTA_ELEVADOR = PLANTA; global.NSF.PLANTA_ATUAL = PLANTA; }
  if (typeof module !== "undefined") module.exports = PLANTA;
})(typeof window !== "undefined" ? window : globalThis);
