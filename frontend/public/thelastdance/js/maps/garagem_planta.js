// Planta da GARAGEM do prédio (subsolo). Sair de casa: apartamento -> elevador -> garagem -> anda até o carro ->
// toca no carro -> menu "Para onde você vai?". Voltar: destino -> garagem (ao lado do carro) -> porta do elevador.
// Base em blocos com os nomes das artes do kit do ChatGPT (kit_chatgpt/garagem): sem arte, aparece em blocos.
// Unidade: metro. Paredes do fundo: x = 0 (esquerda da tela, com o elevador) e y = 0 (direita, as vagas).
(function (global) {
  "use strict";

  const LARG = 16, PROF = 12;
  const PE_DIREITO = 3.0, CORTE_FRENTE = 0.35, ESP = 0.15;
  const BRANCO = "rgba(232,232,222,0.8)", AMARELO = "rgba(240,196,40,0.85)";

  // Faixas pintadas no chão: divisórias das vagas, linha tracejada da pista e a zebra na frente do elevador.
  const faixas = [];
  for (const x of [1.5, 3.9, 6.3, 8.7, 11.1, 13.5]) faixas.push({ x0: x - 0.05, y0: 0, x1: x + 0.05, y1: 5.3, cor: BRANCO });
  for (let x = 2.0; x < 15.5; x += 1.8) faixas.push({ x0: x, y0: 7.95, x1: x + 1.0, y1: 8.08, cor: AMARELO });
  for (let k = 0; k < 5; k++) faixas.push({ x0: 0.35 + k * 0.36, y0: 6.3, x1: 0.53 + k * 0.36, y1: 7.9, cor: BRANCO });

  const PLANTA = {
    id: "garagem",
    nome: "Garagem",
    musica: "garagem",
    largura: LARG, profundidade: PROF,
    peDireito: PE_DIREITO,
    texturaParede: "parede_garagem",
    inicio: { x: 1.1, y: 7.1, dir: "baixo" },
    inicios: { elevador: { x: 1.1, y: 7.1 }, carro: { x: 7.0, y: 5.5 } },  // carro: chegou de carro, na frente dele
    inicioPadrao: "elevador",
    roteiroDemo: ["carro", "pilar", "saída", "elevador"],
    faixas,

    comodos: [
      { nome: "Garagem", x0: 0, y0: 0, x1: LARG, y1: PROF, piso: "#3d3d42", piso2: "#45454a", piso_arte: "piso_garagem" },
    ],

    caixas: [
      // paredes
      { nome: "", tipo: "parede", x0: -ESP, y0: -ESP, x1: 0, y1: PROF, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: 0, y0: -ESP, x1: LARG, y1: 0, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: LARG, y0: -ESP, x1: LARG + ESP, y1: PROF + ESP, z1: CORTE_FRENTE },
      { nome: "", tipo: "parede", x0: -ESP, y0: PROF, x1: LARG, y1: PROF + ESP, z1: CORTE_FRENTE },

      // carros estacionados de ré (frente para +y). O dele abre o menu de destinos.
      { nome: "Hatch vermelho", tipo: "sofa", x0: 1.9, y0: 0.4, x1: 3.65, y1: 4.4, z1: 1.5, arte: "carro_hatch" },
      { nome: "Carro dele (cinza)", tipo: "movel", x0: 6.55, y0: 0.3, x1: 8.4, y1: 4.8, z1: 1.6, arte: "carro_x1",
        destinos: true, falarDe: { x: 7.3, y: 5.35 } },   // na frente do carro (o lado do motorista fica escondido na câmera)
      { nome: "Sedã preto", tipo: "mesa", x0: 9.05, y0: 0.3, x1: 10.9, y1: 5.1, z1: 1.45, arte: "carro_sedan" },

      // pilares
      { nome: "Pilar", tipo: "parede", x0: 3.6, y0: 5.4, x1: 4.2, y1: 6.0, z1: 2.6, arte: "pilar" },
      { nome: "Pilar", tipo: "parede", x0: 11.0, y0: 5.5, x1: 11.6, y1: 6.1, z1: 2.6, arte: "pilar" }, // longe da frente do carro dele
      { nome: "Pilar", tipo: "parede", x0: 13.2, y0: 5.4, x1: 13.8, y1: 6.0, z1: 2.6, arte: "pilar" },
    ],

    naParede: [
      // elevador na parede da esquerda (x = 0): leva de volta para casa
      { nome: "Elevador", tipo: "porta", plano: "x0", a: 6.4, b: 7.8, z0: 0, z1: 2.3, arte: "porta_elevador_garagem",
        saida: true, vai: { nome: "Elevador", url: "elevador.html?subir=1" } },
      { nome: "Extintor", tipo: "quadro", plano: "x0", a: 4.6, b: 5.0, z0: 0.8, z1: 1.6, arte: "extintor" },
      // placa de saída para a rampa (fundo, à direita)
      { nome: "Placa SAÍDA", tipo: "neon", plano: "y0", a: 14.0, b: 15.4, z0: 2.0, z1: 2.5, arte: "placa_saida", texto: ["SAÍDA", ""] },
    ],

    // O carro leva para: (mesmos lugares de antes; a padaria volta para cá)
    destinos: [
      { nome: "Padaria", descricao: "Café, pão na chapa e energia para mais uma noite", url: "padaria.html", ativo: true },
      { nome: "Balada", descricao: "Em breve", ativo: false },
      { nome: "Casa do amigo", descricao: "Churrasco, cerveja gelada e piscina", url: "casa_amigo.html", ativo: true },
      // só depois de aceitar o convite do Vibola para surfar (logo após a ligação da Gatinha de Campinas)
      { nome: "Praia", descricao: "A turma tá na areia e o mar tá clássico 🏄", url: "surf.html", ativo: true, so: "nsf_surf" },
    ],

    pontos: [
      { nome: "elevador", x: 0.6, y: 7.1 },
      { nome: "carro", x: 7.3, y: 5.35 },
      { nome: "pilar", x: 9.6, y: 6.6 },
      { nome: "saída", x: 14.7, y: 7.5 },
    ],
  };

  // Chegou perto do carro (a até 2,6 m da frente): as lanternas piscam duas vezes e o alarme faz "bip-bip".
  // Só repete depois que ele se afasta de novo.
  const CARRO = PLANTA.caixas.find((c) => c.arte === "carro_x1");
  let destravado = false, piscaDesde = null;
  PLANTA.aoIniciar = (api) => { PLANTA.api = api; };
  // Prancha no rack do teto do carro: só quando ele aceitou o convite do Carioca para surfar (nsf_surf na sessão)
  const vaiSurfar = () => { try { return sessionStorage.getItem("nsf_surf") === "1"; } catch (_) { return false; } };
  function prancha(ctx, T) {
    const cx = (CARRO.x0 + CARRO.x1) / 2, z = CARRO.z1 - 0.2, ya = CARRO.y0 + 1.0, yb = CARRO.y1 - 0.5;
    const caminho = (pts) => { ctx.beginPath(); pts.forEach(([x, y, zz], i) => { const [px, py] = T(x, y, zz); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }); };
    ctx.save();
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    // rack: duas barras atravessadas
    ctx.strokeStyle = "#1b1b22"; ctx.lineWidth = 5;
    for (const y of [ya + 0.5, yb - 0.5]) { caminho([[CARRO.x0 + 0.35, y, z - 0.02], [CARRO.x1 - 0.35, y, z - 0.02]]); ctx.stroke(); }
    // contorno da prancha (bico para a frente do carro, rabeta reta atrás)
    const N = 18, lado = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, y = ya + (yb - ya) * t;
      const meia = 0.27 * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * t)), 0.7) * (t > 0.85 ? (1 - t) / 0.15 : 1) + (t > 0.85 ? 0.01 : 0);
      lado.push([cx + meia, y], [cx - meia, y]);
    }
    const dir = lado.filter((_, i) => i % 2 === 0), esq = lado.filter((_, i) => i % 2 === 1).reverse();
    const contorno = (zz) => dir.concat(esq).map(([x, y]) => [x, y, zz]);
    ctx.fillStyle = "#c9c2b8"; caminho(contorno(z)); ctx.closePath(); ctx.fill();              // borda (grossura)
    ctx.fillStyle = "#fffaf0"; ctx.strokeStyle = "#1c2733"; ctx.lineWidth = 2.5;
    caminho(contorno(z + 0.07)); ctx.closePath(); ctx.fill(); ctx.stroke();                     // deck
    ctx.strokeStyle = "#ff5ad8"; ctx.lineWidth = 4;                                             // faixa neon
    caminho([[cx, ya + 0.15, z + 0.07], [cx, yb - 0.2, z + 0.07]]); ctx.stroke();
    // cordinhas amarrando no rack
    ctx.strokeStyle = "#ffd36b"; ctx.lineWidth = 2;
    for (const y of [ya + 0.5, yb - 0.5]) { caminho([[cx - 0.3, y, z + 0.08], [cx + 0.3, y, z + 0.08]]); ctx.stroke(); }
    ctx.restore();
  }
  PLANTA.aoDesenhar = (ctx, T, agora) => {
    const api = PLANTA.api;
    if (!api || !CARRO) return;
    if (vaiSurfar()) prancha(ctx, T);
    const cx = (CARRO.x0 + CARRO.x1) / 2, d = Math.hypot(api.jog.x - cx, api.jog.y - CARRO.y1);
    if (!destravado && d < 2.6 && !api.jog.oculto) {
      destravado = true; piscaDesde = agora;
      if (global.NSF.Audio) global.NSF.Audio.alarmeCarro();
    } else if (destravado && d > 4) destravado = false;
    if (piscaDesde == null) return;
    const u = agora - piscaDesde;
    if (u > 900) { piscaDesde = null; return; }
    if (!((u > 0 && u < 220) || (u > 420 && u < 640))) return; // duas piscadas
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const x of [CARRO.x0 + 0.3, CARRO.x1 - 0.3]) {
      const [px, py] = T(x, CARRO.y1, 0.62);
      const g = ctx.createRadialGradient(px, py, 0, px, py, 34);
      g.addColorStop(0, "rgba(255,240,200,0.95)"); g.addColorStop(0.35, "rgba(255,170,40,0.6)"); g.addColorStop(1, "rgba(255,140,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 34, 0, 7); ctx.fill();
    }
    ctx.restore();
  };

  if (global.NSF) { global.NSF.PLANTA_GARAGEM = PLANTA; global.NSF.PLANTA_ATUAL = PLANTA; }
  if (typeof module !== "undefined") module.exports = PLANTA;
})(typeof window !== "undefined" ? window : globalThis);
