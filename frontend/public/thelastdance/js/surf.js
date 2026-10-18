// Minigame de surf (surf.html): visto da areia, olhando para o mar. A onda quebra da esquerda para a direita e ele
// surfa na parede dela. 3 ondas; cada onda ganha uma nota de 0 a 10 dos juízes e o resultado é a soma das 2 melhores
// (como no campeonato de verdade). A turma assiste da areia (os amigos de costas, olhando o mar) e comemora.
// CONTROLE (inspirado nos jogos de surf: poucos comandos; a inclinação da onda dá a velocidade):
//   D / →  vai (para a frente, pela parede)     A / ←  volta (a prancha vira para trás, em direção à espuma)
//         — ir e voltar têm a mesma velocidade —
//   W / ↑  sobe a parede     S / ↓  desce (descer dá impulso; subir gasta)     Espaço  pula
// Manobras pela posição na onda:
//   CUTBACK  voltando (prancha para trás) e subindo a parede
//   FLOATER  subir até a crista e andar em cima dela
//   AÉREO    perto da crista, Espaço (com impulso); A/D no ar giram (360, 720)
//   TUBO     sem apertar nada, a onda vai alcançando e cobre ele (2 s ou mais: tubaço)
//   CAVADA   ir ao pé da onda e subir com força
// Sem dificuldade: ele nunca cai (a espuma só empurra; o tubo cospe ele para fora).
// Arte do mar desenhada por código em pixel art (cena em meia resolução, ampliada sem suavizar).
(function (global) {
  "use strict";

  // ---------- regras (sem tela: testadas em tests/surf.test.js) ----------
  const REGRAS = { ondas: 3, segundosOnda: 28, vCrista: 300 };
  // nota dos juízes: cresce rápido no começo e fica difícil perto do 10
  const nota = (pontos) => Math.min(10, Math.round(100 * (1 - Math.exp(-Math.max(0, pontos) / 10000))) / 10);
  // perto da espuma (d pequeno) vale até 3x; longe, no ombro da onda, 1x
  const proximidade = (d) => 1 + 2 * Math.max(0, 1 - Math.max(0, d) / 800);
  // a mesma manobra seguida vale cada vez menos
  function repeticao(historico, nome) {
    let n = 0;
    for (let i = historico.length - 1; i >= 0 && historico[i] === nome; i--) n++;
    return [1, 0.6, 0.35, 0.2][Math.min(n, 3)];
  }
  // resultado: soma das 2 melhores notas
  const resultado = (notas) => Math.round(10 * notas.slice().sort((a, b) => b - a).slice(0, 2).reduce((s, n) => s + n, 0)) / 10;
  function titulo(total) {
    if (total >= 17) return "Campeão da praia 🏆";
    if (total >= 12) return "Mandou bem 🤙";
    if (total >= 6) return "Dá pro gasto 🏄";
    return "Melhor voltar pro churrasco 😂";
  }
  const Regras = { REGRAS, nota, proximidade, repeticao, resultado, titulo };
  if (typeof module !== "undefined") module.exports = Regras;
  if (!global.document) return;

  const NSF = global.NSF;
  const doc = global.document;
  const params = new URLSearchParams(global.location.search);
  const A = () => NSF.Audio;

  // ---------- cena (pixels lógicos: altura 1080, largura acompanha a tela) ----------
  const H = 1080, HORIZ = 330, Y_BASE = 800, AREIA = 930, HMAX = 300, ESC = 0.15, PX = 2; // PX: tamanho do "pixel" da arte
  let W = NSF.CONFIG.larguraBase;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const escolher = (l) => l[Math.floor(Math.random() * l.length)];
  const lim = (v, a, b) => Math.max(a, Math.min(b, v));
  const DOIS_PI = Math.PI * 2;

  // ---------- a turma na areia (de costas, olhando o mar) ----------
  // personagem: amigo do pacote trancado (assets/characters/npcs/<id>/); tres: quadros 3D (sprites3d.json)
  const AMIGOS = [
    { id: "vibola", nome: "Vibola", x: 0.08, personagem: "vibola" },
    { id: "vini", nome: "Vini", x: 0.18, personagem: "vini" },
    { id: "gustavinho", nome: "Gustavinho", x: 0.83, personagem: "gustavinho", tres: true },
    { id: "juan", nome: "Juan", x: 0.93, personagem: "juan" },
  ];
  const FALAS = {
    drop: ["Dropou! 🏄", "Agora vai!", "Segura, peão!", "Aê, mermão! Brabo!"],
    aereo: ["VOOOOU! 🛫", "Ô LOCO, BICHO! Que aéreo!", "O Medina tá com medo!"],
    giro: ["GIROU NO AR!! 🌀", "360?! Tá de sacanagem!", "Chama a TV!"],
    tubo: ["Ó O TUBOOO!", "Entrou no barril!", "Tá lá dentro, tá lá dentro!"],
    saiuTubo: ["SAIU SECO! 💦", "Cuspido pelo tubo!!", "Que tubaço!"],
    batida: ["Rasgou a crista!", "Bateu bonito!", "Isso é surf!"],
    cutback: ["Que cutback!", "Voltou pra espuma com estilo!", "Cutback de respeito!"],
    floater: ["Andou na crista! 🤯", "Floater lindo!", "Flutuou, mermão!"],
    espuma: ["A espuma te pegou! 😂", "Corre que ela vem!", "Foge da espuma!"],
    notaAlta: ["NOTA DEZ! 🔥", "Contrata esse cara!"],
    notaBoa: ["Boa, peão! 🤙", "Mandou bem!", "Próxima é nota dez!"],
  };

  // ---------- o surfista ----------
  // Personagem 3D em pixel art (o padrão): sem camisa, de bermuda, animação de surf e remada (surf3d.json).
  // O modular antigo só com ?conjunto=modular.
  let surf3d = null, heroi = null;
  const usa3d = (() => {
    const c = params.get("conjunto");
    return c !== "modular";
  })();
  async function carregar3d() {
    const pasta = "assets/characters/personagem_v2/pixel/";
    const m = await (await global.fetch(pasta + "surf3d.json")).json();
    await Promise.all(["surf", "remar"].map((k) => carregarImg(pasta + m[k].folha).then((im) => { m[k].img = im; })));
    m.escala = (1375 * ESC) / m.altura_em_pe_px; // mesma altura do personagem antigo no mar
    surf3d = m;
  }
  function carregarImg(url) {
    return new Promise((ok, erro) => {
      const im = new global.Image();
      im.onload = () => ok(im);
      im.onerror = () => erro(new Error("imagem: " + url));
      im.src = url;
    });
  }
  // personagem antigo (modular, de neoprene): poses montadas girando os ossos
  function girar(graus, px, py) {
    const r = graus * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r);
    return [c, sn, -sn, c, px - c * px + sn * py, py - sn * px - c * py];
  }
  function mul(m, n) {
    return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
      m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  }
  const POSES = {
    base:    { tronco: 6, braco_sup_esq: 55, antbraco_esq: -20, braco_sup_dir: -60, antbraco_dir: 25, coxa_esq: 22, canela_esq: -30, coxa_dir: -22, canela_dir: 30 },
    agacha:  { tronco: 14, braco_sup_esq: 40, antbraco_esq: -10, braco_sup_dir: -45, antbraco_dir: 15, coxa_esq: 34, canela_esq: -50, coxa_dir: -34, canela_dir: 50 },
    batida:  { tronco: -12, braco_sup_esq: 115, antbraco_esq: -30, braco_sup_dir: -40, antbraco_dir: 10, coxa_esq: 16, canela_esq: -20, coxa_dir: -16, canela_dir: 20 },
    aereo:   { tronco: 2, braco_sup_esq: 140, antbraco_esq: -20, braco_sup_dir: -25, antbraco_dir: 45, coxa_esq: 42, canela_esq: -78, coxa_dir: -42, canela_dir: 78 },
    tubo:    { tronco: 20, braco_sup_esq: 25, antbraco_esq: 0, braco_sup_dir: -115, antbraco_dir: 10, coxa_esq: 38, canela_esq: -56, coxa_dir: -38, canela_dir: 56 },
  };
  let poseAtual = Object.assign({}, POSES.base), poseAlvo = "base", pesAbaixo = 0;
  const quadroFrente = {}, quadroLado = {};
  async function carregarHeroi() {
    const pm = new global.PersonagemModular(global.PERSONAGEM_MODULAR, "personagem_modular/");
    await pm.carregar();
    for (const id of ["neoprene_cima", "neoprene_calca"]) if (pm.roupas[id]) pm.vestir(id);
    pm.animacoes.surf = { fps: 1, loop: true, vistas: { frente: [quadroFrente], costas: [quadroFrente], lado_direito: [quadroLado], lado_esquerdo: [quadroLado] } };
    pm.tocar("surf");
    pm.pixelado = false;
    heroi = pm;
  }
  function aplicarPose(dt) {
    if (!heroi) return;
    const alvo = POSES[poseAlvo] || POSES.base, k = 1 - Math.exp(-dt * 14);
    for (const o of Object.keys(alvo)) poseAtual[o] += (alvo[o] - poseAtual[o]) * k;
    const ossos = heroi.rig.vistas.frente.ossos;
    for (const [o, g] of Object.entries(poseAtual)) quadroFrente[o] = girar(g, ossos[o].pivo[0], ossos[o].pivo[1]);
    let soma = 0;
    for (const lado of ["esq", "dir"]) {
      const m = mul(quadroFrente["coxa_" + lado], quadroFrente["canela_" + lado]), p = ossos["pe_" + lado].pivo;
      soma += p[1] - (m[1] * p[0] + m[3] * p[1] + m[5]);
    }
    pesAbaixo = soma / 2;
    if (s.fase === "remando") {
      const o = heroi.rig.vistas.lado_direito.ossos, a = s.relogio * 330;
      quadroLado.braco = girar(a, o.braco.pivo[0], o.braco.pivo[1]);
      quadroLado.braco_tras = girar(a + 180, o.braco_tras.pivo[0], o.braco_tras.pivo[1]);
    }
  }

  // ---------- controles ----------
  const ent = { cima: false, baixo: false, freia: false, acelera: false, pula: false };
  let pulouAgora = false, freouAgora = false;
  function apertar(nome, sim) {
    if (!(nome in ent)) return;
    if (sim && !ent[nome]) {
      if (nome === "pula") pulouAgora = true;
      if (nome === "freia") freouAgora = true;
      if (s.fase === "remando") remar();
    }
    ent[nome] = sim;
  }

  // ---------- estado ----------
  const s = {
    fase: "intro", onda: 0, notas: [], pontos: 0, hist: [], tOnda: 0,
    x: 0, h: 0.5, vh: 0, v: 0, crista: 0, forca: 0, quebrada: false, secoes: [], tuboL: 90,
    remo: null, tubo: null, ar: null, floater: null, giro: 0, ang: 0, noFundo: false,
    dir: 1, virar: 1, u: 0, m: 1,          // dir: para onde a prancha aponta; u: velocidade em relação à crista; m: impulso
    cam: 0, tremor: 0, pausa: 0, avisos: [], gotas: [], rastro: [], fala: null, festa: -9, relogio: 0, espera: 0,
    ultima: {}, ultimaCavada: -9, avisoEspuma: -9,
  };
  global.NSF_SURF = { s, ent, comando: (n, sim) => apertar(n, sim !== false), regras: Regras };

  // ---------- onda ----------
  function secaoEm(x) {
    for (const sc of s.secoes) if (x >= sc.ini && x < sc.fim) return sc;
    return { tipo: "normal" };
  }
  function gerarSecoes(inicio) {
    s.secoes = [];
    let x = inicio, primeira = true;
    while (x < inicio + 40 * REGRAS.vCrista) {
      const tipo = primeira ? "normal" : escolher(["normal", "tubular", "tubular", "cheia"]);
      const len = primeira ? 1300 : rnd(1000, 1700);
      s.secoes.push({ ini: x, fim: x + len, tipo });
      x += len; primeira = false;
    }
  }
  const vCrista = () => { const t = secaoEm(s.crista).tipo; return t === "tubular" ? 330 : t === "cheia" ? 260 : 300; };
  function altura(d) {
    let h;
    if (d < 0) h = s.quebrada ? HMAX * Math.max(0.3, 0.62 + d / 2600) : HMAX * Math.max(0.15, 1 + d / 900);
    else if (d < 450) h = HMAX;
    else if (d < 1900) h = HMAX * (1 - 0.72 * (d - 450) / 1450);
    else h = HMAX * 0.28;
    return h * s.forca;
  }

  // ---------- fases ----------
  function novaOnda() {
    s.fase = "remando"; s.quebrada = false; s.forca = 0; s.pontos = 0; s.hist = []; s.tOnda = 0;
    s.tubo = s.ar = s.floater = null; s.giro = 0; s.rastro = []; s.dir = 1; s.virar = 1; s.u = 0; s.m = 1;
    s.x = s.x || 0; s.crista = s.x - 110; s.h = 0; s.vh = 0; s.v = 0;
    s.remo = { t: 0, dur: 3.2 };
    poseAlvo = "base";
  }
  function remar() { // remar é só para curtir: ele pega a onda de qualquer jeito (cada toque adianta um pouquinho)
    if (!s.remo) return;
    s.remo.t = Math.min(s.remo.dur, s.remo.t + 0.14);
    for (let i = 0; i < 3; i++) gota(s.x + rnd(-10, 40), Y_BASE - altura(s.x - s.crista) * 0.12, rnd(-80, 80), rnd(-220, -120), 2);
  }
  function dropar() {
    s.fase = "surfando"; s.quebrada = true; s.remo = null;
    gerarSecoes(s.crista);
    s.v = REGRAS.vCrista + 140; s.h = 0.95; s.vh = -1.4; s.u = 160; s.m = 1.2; s.dir = 1;
    pontuar("DROP!", 200);
    if (A()) A().swoosh(true);
    falar("drop");
  }
  function fimOnda() {
    if (s.fase !== "surfando") return;
    if (s.tubo) sairTubo();
    pontuar("Completou a onda!", 600);
    const n = nota(s.pontos);
    s.notas.push(n); s.onda++;
    s.fase = "nota"; s.espera = 3.2; s.ultimaNota = n; s.ar = null; s.giro = 0;
    falar(n >= 8 ? "notaAlta" : "notaBoa");
    s.festa = s.relogio;
  }
  function fimJogo() {
    s.fase = "fim";
    const total = resultado(s.notas);
    let recorde = 0;
    try { recorde = +global.localStorage.getItem("nsf_surf_recorde") || 0; if (total > recorde) global.localStorage.setItem("nsf_surf_recorde", String(total)); } catch (e) { /* ok */ }
    mostrarFim(total, Math.max(total, recorde), total > recorde && recorde > 0);
  }

  // ---------- pontos e manobras ----------
  function pontuar(texto, pts, cor) {
    s.pontos += pts;
    aviso(pts ? `${texto} +${pts}` : texto, cor || "#ffffff", pts >= 2000 ? 54 : 42);
  }
  const pode = (nome, seg) => s.relogio - (s.ultima[nome] || -99) > seg;
  function manobra(nome, base, d, extra) {
    const fator = repeticao(s.hist, nome);
    s.hist.push(nome); s.ultima[nome] = s.relogio;
    return Math.round(base * proximidade(d) * fator * (extra || 1));
  }
  function entrarTubo() {
    s.tubo = { t: 0, grande: secaoEm(s.crista).tipo === "tubular" };
    aviso("No tubo...", "#9ff3ff", 40);
    falar("tubo");
  }
  function sairTubo(cuspido) {
    const t = s.tubo.t, grande = s.tubo.grande;
    s.tubo = null; s.ultima.tubo = s.relogio;
    if (t < 0.5) return;
    const tubaco = t >= 2;
    const pts = Math.round((900 + 1500 * t + (tubaco ? 1500 : 0)) * (grande ? 1.5 : 1) * repeticao(s.hist, "tubo"));
    s.hist.push("tubo");
    pontuar(`${tubaco ? "TUBAÇO" : "TUBO"} ${t.toFixed(1)}s${cuspido ? " (cuspido!)" : ""}`, pts, "#9ff3ff");
    espirro(cuspido ? 40 : 26, cuspido ? 1.4 : 1);
    if (cuspido) tremer(8);
    if (A()) A().swoosh(true);
    falar("saiuTubo"); s.festa = s.relogio;
  }

  // ---------- efeitos ----------
  function aviso(texto, cor, tam) { s.avisos.push({ texto, y: 0, vida: 1.6, cor, tam }); if (s.avisos.length > 4) s.avisos.shift(); }
  function gota(x, y, vx, vy, r) { if (s.gotas.length < 400) s.gotas.push({ x, y, vx, vy, r, vida: 1 }); }
  function espirro(n, forca) {
    const [x, y] = posPrancha(), f = forca || 1;
    for (let i = 0; i < n; i++) gota(x - rnd(0, 50), y, rnd(-260, 60) * f, rnd(-520, -180) * f, rnd(2, 5));
  }
  function falar(tipo) {
    if (s.fala && s.relogio - s.fala.t < 1.4) return; // não atropela a fala anterior
    s.fala = { quem: Math.floor(Math.random() * AMIGOS.length), texto: escolher(FALAS[tipo]), t: s.relogio };
  }
  function tremer(f) { s.tremor = Math.max(s.tremor, f); }

  // ---------- atualização ----------
  function posPrancha() {
    const d = s.x - s.crista, alt = altura(d);
    let y;
    if (s.fase === "remando") y = Y_BASE - alt * 0.16 + Math.sin(s.relogio * 2.4) * 4;
    else if (s.floater) y = Y_BASE - alt - 6;
    else y = Y_BASE - (0.05 + 0.82 * s.h) * alt;
    if (s.ar) y -= s.ar.alt;
    return [s.x, y];
  }
  function atualizar(dt) {
    s.relogio += dt;
    if (s.pausa > 0) { s.pausa -= dt; dt = 0; } // pausinha no impacto (batida, aterrissagem): dá peso
    if (s.fase === "remando") {
      const r = s.remo;
      r.t += dt;
      s.forca = Math.min(1, r.t / r.dur);
      s.crista = s.x - 110;
      if (r.t >= r.dur * 0.75) dropar();
    } else if (s.fase === "surfando") {
      atualizarSurf(dt);
    } else if (s.fase === "nota") {
      s.forca = Math.max(0, s.forca - dt * 0.5);
      if ((s.espera -= dt) <= 0) { if (s.onda >= REGRAS.ondas) fimJogo(); else novaOnda(); }
    }
    pulouAgora = freouAgora = false;
    // câmera: ele um pouco à esquerda do meio, olhando um pouco à frente quando está rápido
    const alvoCam = s.fase === "surfando"
      ? s.crista - W * (W < 900 ? 0.3 : 0.32) + lim(s.x - s.crista, -200, 1400) * 0.55 // segue a onda; ele anda pela tela
      : s.x - W * (W < 900 ? 0.36 : 0.4);
    s.cam += (alvoCam - s.cam) * Math.min(1, dt * 3.5);
    if (s.fase === "surfando") s.cam = lim(s.cam, s.x - W * 0.7, s.x - W * 0.2); // ele nunca sai da tela
    s.tremor = Math.max(0, s.tremor - dt * 40);
    for (const a of s.avisos) { a.vida -= dt; a.y -= dt * 60; }
    s.avisos = s.avisos.filter((a) => a.vida > 0);
    for (const g of s.gotas) { g.vy += 900 * dt; g.x += g.vx * dt; g.y += g.vy * dt; g.vida -= dt * 0.9; }
    s.gotas = s.gotas.filter((g) => g.vida > 0 && g.y < Y_BASE + 60);
    for (const r of s.rastro) r.vida -= dt * 0.9;
    s.rastro = s.rastro.filter((r) => r.vida > 0);
    if (s.quebrada && s.forca > 0.5 && Math.random() < dt * 30) gota(s.crista + rnd(-40, 30), Y_BASE - altura(1) + rnd(0, 30), rnd(-160, 20), rnd(-260, -80), rnd(2, 4));
    aplicarPose(dt);
  }
  const U = 290; // velocidade de ir e de voltar (px/s em relação à crista): a mesma nos dois sentidos
  function atualizarSurf(dt) {
    const vc = vCrista();
    s.tOnda += dt;
    s.forca = Math.min(1, s.forca + dt * 0.6);
    s.crista += vc * dt;
    s.tuboL += ((secaoEm(s.crista).tipo === "tubular" ? 280 : 200) - s.tuboL) * Math.min(1, dt * 2);

    // ---- para onde vai: D vai, A volta (mesma velocidade); sem nada, a onda o alcança devagar ----
    if (ent.acelera && !ent.freia) s.dir = 1;
    else if (ent.freia && !ent.acelera) s.dir = -1;
    const anda = ent.acelera !== ent.freia;
    let alvoU = anda ? s.dir * U : s.tubo ? -45 : -110; // no tubo, a onda o engole devagar
    if (s.x - s.crista > 1300) alvoU = Math.min(alvoU, -160);   // longe demais, no ombro: a onda perde força
    s.u += (alvoU - s.u) * Math.min(1, dt * 2.6);
    s.virar += (s.dir - s.virar) * Math.min(1, dt * 11);       // a prancha vira (de um lado para o outro)

    if (s.ar) { // no ar: sobe, cai; A/D giram
      const ar = s.ar;
      ar.t += dt; ar.vy -= 1350 * dt; ar.alt = Math.max(0, ar.alt + ar.vy * dt);
      if (!ar.pequeno) {
        if (ent.acelera) ar.giroV += 16 * dt; else if (ent.freia) ar.giroV -= 16 * dt;
        ar.giroV *= Math.exp(-dt * 1.2);
        s.giro += ar.giroV * dt;
      }
      s.x += (vc + s.u) * dt;
      if (ar.alt <= 0 && ar.t > 0.15) aterrissar();
      return;
    }

    // ---- sobe e desce: W/S; sem nada, desce devagar até o meio-baixo da onda (onde o tubo se forma) ----
    const alvoVh = ent.cima ? 1.5 : ent.baixo ? -1.5 : (0.33 - s.h) * 1.2;
    s.vh += (alvoVh - s.vh) * Math.min(1, dt * 6);
    // impulso: descer a parede dá, subir gasta; um pouco de atrito
    s.m = lim(s.m - s.vh * (s.vh > 0 ? 0.3 : 0.6) * dt - 0.04 * dt, 0.3, 1.6);

    // ---- floater: em cima da crista ----
    if (s.floater) {
      const f = s.floater;
      f.t += dt; s.h = 1; s.vh = 0;
      s.x += (vc + s.u) * dt;
      if (pulouAgora) { // do floater direto para o aéreo
        const t = f.t; s.floater = null; pontuar("Floater", Math.round(400 + 800 * t)); return pular(true);
      }
      if (ent.baixo || (!ent.cima && f.t > 0.35) || f.t > 2.2) {
        const d = s.x - s.crista;
        s.floater = null; s.h = 0.9; s.vh = -1.2;
        pontuar("FLOATER", manobra("floater", 500 + 900 * Math.min(2, f.t), d), "#ffd36b");
        espirro(20, 1); tremer(4); s.pausa = 0.05;
        if (A()) A().swoosh(true);
        falar("floater"); s.festa = s.relogio;
      }
      return;
    }

    s.h += s.vh * dt;
    s.x += (vc + s.u) * dt;
    let d = s.x - s.crista;

    // ---- tubo: perto da espuma e baixo, a onda cobre ele (anda junto); lá no fundo, ela cospe para fora ----
    const cobre = d < s.tuboL * 0.7 && s.h < 0.62;
    if (cobre && !s.tubo && pode("tubo", 1.5)) entrarTubo();
    if (s.tubo) {
      s.tubo.t += dt;
      if (d < -10) { // fundo demais: o tubo cospe ele para fora (sem cair)
        d = s.tuboL * 0.75; s.x = s.crista + d; s.u = U * 1.2; s.dir = 1; s.m = Math.min(1.6, s.m + 0.4);
        sairTubo(true);
      } else if (!cobre) sairTubo();
    } else if (d < 5) { // na espuma, fora do tubo: ela empurra para a frente
      s.x = s.crista + 5; s.u = Math.max(s.u, 80); d = 5;
      if (s.relogio - s.avisoEspuma > 4) { s.avisoEspuma = s.relogio; aviso("A espuma empurrou! 💨", "#ffd36b", 40); falar("espuma"); }
    }

    // ---- manobras ----
    if (s.h <= 0) { s.h = 0; if (s.vh < 0) s.vh = 0; }
    if (s.h < 0.14) s.noFundo = true;
    if (s.noFundo && s.vh > 0.8) { // cavada: foi ao pé da onda e voltou subindo com força
      s.noFundo = false;
      if (pode("cavada", 1.0)) {
        pontuar("Cavada", manobra("cavada", 300, d)); s.ultimaCavada = s.relogio;
        espirro(10, 0.7); if (A()) A().swoosh(false);
      }
    }
    // cutback: voltando (prancha para trás) e subindo a parede
    if (s.dir < 0 && s.u < -120 && s.vh > 0.6 && s.h > 0.4 && pode("cutback", 1.4)) {
      const combo = s.relogio - s.ultimaCavada < 1.8 ? 1.3 : 1;
      pontuar(combo > 1 ? "CUTBACK COMBO" : "CUTBACK", manobra("cutback", 900, d, combo * (0.7 + 0.3 * s.m)), "#ffd36b");
      espirro(26, 1.2); tremer(5);
      if (A()) A().swoosh(true);
      if (Math.random() < 0.7) falar("cutback");
    }
    // chegou na crista: subindo, vira floater; senão, só encosta e volta
    if (s.h >= 1) {
      s.h = 1;
      if (s.vh > 0.4 && !s.tubo) { s.floater = { t: 0 }; aviso("Floater...", "#ffd36b", 38); espirro(14, 0.9); }
      else s.vh = -0.4;
    }
    if (pulouAgora) return pular(false);

    // rastro na água e spray da borda, conforme a curva e o impulso
    const [bx, by] = posPrancha();
    s.rastro.push({ x: bx - 40 * s.dir, y: by + 6, vida: 1 });
    if (s.rastro.length > 70) s.rastro.shift();
    const curva = (Math.abs(s.vh) + Math.abs(s.dir - s.virar)) * (0.6 + 0.4 * s.m);
    if (Math.random() < dt * 30 * curva) gota(bx - s.dir * rnd(30, 60), by + 4, -s.dir * rnd(40, 200), rnd(-300, -120) * Math.min(1.5, curva), rnd(2, 4));
    poseAlvo = s.tubo ? "tubo" : s.h > 0.8 ? "batida" : ent.baixo || s.h < 0.2 ? "agacha" : "base";
    s.v = vc + s.u;
    if (s.tOnda >= REGRAS.segundosOnda) fimOnda();
  }
  // Espaço: perto da crista = aéreo (o impulso só deixa mais alto); embaixo, um pulinho
  function pular(doFloater) {
    const grande = doFloater || s.h > 0.68;
    s.ar = grande ? { t: 0, alt: 0, vy: 520 + s.m * 260, giroV: 0, pequeno: false }
      : { t: 0, alt: 0, vy: 320, giroV: 0, pequeno: true };
    if (grande) { s.h = 0.97; aviso("AÉREO!", "#ff8be6", 50); espirro(26, 1.2); }
    if (A()) A().swoosh(grande);
    if (s.tubo) sairTubo();
  }
  function aterrissar() {
    const ar = s.ar, d = s.x - s.crista;
    s.ar = null;
    if (ar.pequeno) { s.giro = 0; if (pode("pulinho", 1.5)) pontuar("Pulinho", 150); return; }
    const voltas = Math.round(s.giro / DOIS_PI);
    s.giro = 0;
    s.h = 0.8; s.vh = -1.0; s.m = Math.min(1.6, s.m + 0.2);
    const n = Math.abs(voltas);
    const nome = n >= 2 ? "AÉREO 720!!" : n === 1 ? "AÉREO 360!" : "Aterrissou o aéreo!";
    pontuar(nome, manobra(n ? "giro" : "aereo", 1800 + 1600 * n, d), "#ff8be6");
    espirro(30, 1.3); tremer(n ? 10 : 6); s.pausa = 0.07;
    if (A()) A().swoosh(true);
    falar(n ? "giro" : "aereo"); s.festa = s.relogio;
  }

  // ---------- desenho: cena em pixel art (meia resolução, ampliada sem suavizar) ----------
  const fundo = doc.createElement("canvas"), frente = doc.createElement("canvas");
  function prepararCamada(c) {
    const w = Math.ceil(W / PX), h = Math.ceil(H / PX);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const g = c.getContext("2d");
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    g.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0);
    g.imageSmoothingEnabled = false;
    return g;
  }
  // faixas de cor chapadas (no lugar de degradê: cara de pixel art)
  function faixas(ctx, y0, y1, cores, x0, x1) {
    const n = cores.length, hh = (y1 - y0) / n;
    cores.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x0 == null ? 0 : x0, Math.floor(y0 + i * hh), (x1 == null ? W : x1) - (x0 || 0), Math.ceil(hh) + 1); });
  }
  // arte da praia (kit do ChatGPT, tools/kit_praia.py); enquanto não carrega (ou se faltar), fica o desenho por código
  const ARTE = {};
  ["ceu_mar", "ilhas", "areia", "guarda_sol", "isopor", "cadeira_praia", "coqueiro",
    ...[0, 1, 2].flatMap((i) => [`onda_crista_${i}`, `onda_parede_${i}`, `onda_espuma_${i}`])].forEach((n) => {
    const im = new Image();
    im.onload = () => { ARTE[n] = im; };
    im.src = "assets/maps/praia/" + n + ".png";
  });
  const quadro = (n) => ARTE[`${n}_${Math.floor(s.relogio * 6) % 3}`] || ARTE[n + "_0"];
  // desenha a arte no tamanho certo: cada pixel do arquivo vira um "pixel" da cena (PX px de tela)
  function pintar(ctx, im, x, y, esc, espelhar) {
    const w = im.width * PX * (esc || 1), h = im.height * PX * (esc || 1);
    if (espelhar) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, w, h); ctx.restore(); }
    else ctx.drawImage(im, x, y, w, h);
    return [w, h];
  }
  let corDoMar = null; // cor da última linha do céu_mar (continua o mar até a onda)
  function corFundoMar(im) {
    if (corDoMar) return corDoMar;
    try {
      const c = document.createElement("canvas"); c.width = im.width; c.height = 1;
      const g = c.getContext("2d"); g.drawImage(im, 0, im.height - 1, im.width, 1, 0, 0, im.width, 1);
      const d = g.getImageData(0, 0, im.width, 1).data; let r = 0, gg = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
      const n = d.length / 4; corDoMar = `rgb(${r / n | 0},${gg / n | 0},${b / n | 0})`;
    } catch (e) { corDoMar = "#1c5d8c"; }
    return corDoMar;
  }
  const NUVENS = Array.from({ length: 7 }, (_, i) => ({ x: i * 380 + rnd(0, 200), y: rnd(60, 220), w: rnd(150, 280) }));
  function ceu(ctx) {
    if (ARTE.ceu_mar) {
      const im = ARTE.ceu_mar, h = im.height * PX, w = Math.max(im.width * PX, W + 40);
      ctx.drawImage(im, -(w - W) / 2, 0, w, h); // céu e mar ao longe (o horizonte cai em HORIZ)
      if (ARTE.ilhas) {
        const im2 = ARTE.ilhas, w2 = im2.width * PX, passo = w2 + 900;
        const x = ((W * 0.15 - s.cam * 0.04) % passo + passo) % passo - w2;
        for (let xx = x; xx < W; xx += passo) pintar(ctx, im2, Math.round(xx), HORIZ - im2.height * PX + 2);
      }
      gaivotas(ctx);
      return;
    }
    faixas(ctx, 0, HORIZ, ["#2b6cb0", "#3478bb", "#3f86c6", "#4c94cf", "#5ca2d7", "#70b1dd", "#88c0e2", "#a5cfe3", "#c6dde0", "#e7e2c7"]);
    // sol com halo em anéis
    const sx = W * 0.78, sy = 150;
    for (const [r, c] of [[150, "rgba(255,240,190,0.12)"], [110, "rgba(255,240,190,0.18)"], [74, "rgba(255,244,205,0.32)"], [46, "#fff6d6"], [36, "#fffbe9"]]) {
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(sx, sy, r, 0, DOIS_PI); ctx.fill();
    }
    // nuvens: blocos com sombra embaixo
    for (const n of NUVENS) {
      const x = (((n.x - s.cam * 0.05 + s.relogio * 8) % (W + 700)) + W + 700) % (W + 700) - 350;
      for (const [dx, dy, r, c] of [[0.05, 0.06, 0.24, "#c9dbe8"], [0.3, 0.02, 0.28, "#c9dbe8"], [0.58, 0.06, 0.22, "#c9dbe8"],
        [0, 0, 0.26, "#ffffff"], [0.26, -0.1, 0.3, "#ffffff"], [0.52, -0.02, 0.26, "#ffffff"], [0.74, 0.04, 0.18, "#f1f6fa"]]) {
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + dx * n.w, n.y + dy * n.w, r * n.w, 0, DOIS_PI); ctx.fill();
      }
      ctx.fillStyle = "#c9dbe8"; ctx.fillRect(x - n.w * 0.2, n.y + n.w * 0.12, n.w * 1.05, n.w * 0.08);
    }
    // ilhas ao longe (duas camadas) e o farol
    const ilha = (base, cor, escala, alt) => {
      const mx = ((base - s.cam * escala) % (W + 1100) + W + 1100) % (W + 1100) - 400;
      ctx.fillStyle = cor;
      ctx.beginPath(); ctx.moveTo(mx, HORIZ); ctx.quadraticCurveTo(mx + 150, HORIZ - alt, mx + 330, HORIZ - alt * 0.45);
      ctx.quadraticCurveTo(mx + 430, HORIZ - alt * 0.7, mx + 620, HORIZ); ctx.fill();
      return mx;
    };
    ilha(900, "#7ea8bd", 0.05, 90);
    const mx = ilha(200, "#5b8aa3", 0.08, 130);
    ctx.fillStyle = "#f2efe6"; ctx.fillRect(mx + 470, HORIZ - 60, 10, 34);      // farol
    ctx.fillStyle = "#c8323c"; ctx.fillRect(mx + 470, HORIZ - 52, 10, 6); ctx.fillRect(mx + 470, HORIZ - 40, 10, 6);
    if (Math.floor(s.relogio * 2) % 2) { ctx.fillStyle = "#fff6a0"; ctx.fillRect(mx + 466, HORIZ - 68, 18, 8); }
    gaivotas(ctx);
  }
  function gaivotas(ctx) {
    ctx.fillStyle = "#2d3e50";
    for (let i = 0; i < 3; i++) {
      const gx = ((s.relogio * 40 + i * 260) % (W + 200)) - 100, gy = 120 + i * 40 + Math.sin(s.relogio * 2 + i) * 8, a = Math.sin(s.relogio * 8 + i) > 0 ? 6 : 2;
      ctx.fillRect(gx - 12, gy - a, 8, 3); ctx.fillRect(gx - 4, gy, 8, 3); ctx.fillRect(gx + 4, gy - a, 8, 3);
    }
  }
  function marAoFundo(ctx) {
    if (ARTE.ceu_mar) { // o mar do céu_mar continua até a base da onda; por cima, só as marolas andando
      const y0 = ARTE.ceu_mar.height * PX;
      ctx.fillStyle = corFundoMar(ARTE.ceu_mar); ctx.fillRect(0, y0 - 1, W, Y_BASE - y0 + 2);
      ctx.fillStyle = "rgba(220,240,250,0.3)";
      for (let i = 3; i < 9; i++) {
        const y = HORIZ + 16 + i * i * 5, off = ((s.relogio * 12 + i * 97 - s.cam * (0.1 + i * 0.02)) % 180 + 180) % 180;
        for (let x = -180 + off; x < W; x += 180) ctx.fillRect(x, y, 30 + i * 5, 2);
      }
      return;
    }
    faixas(ctx, HORIZ, Y_BASE, ["#4a98c6", "#3f8ebe", "#3684b6", "#2e7aac", "#2770a2", "#216697", "#1c5d8c"]);
    // brilho do sol na água (coluna de tracinhos que piscam)
    const sx = W * 0.78;
    for (let i = 0; i < 22; i++) {
      const y = HORIZ + 8 + i * 9, w = 30 + i * 3, off = Math.sin(s.relogio * 3 + i * 1.7) * 12;
      if ((i + Math.floor(s.relogio * 6)) % 3 === 0) continue;
      ctx.fillStyle = i < 8 ? "#fff3c4" : "rgba(255,243,196,0.6)";
      ctx.fillRect(sx - w / 2 + off, y, w * (0.4 + 0.3 * ((i * 7) % 3)), 3);
    }
    // marolas ao longe
    ctx.fillStyle = "rgba(220,240,250,0.35)";
    for (let i = 0; i < 9; i++) {
      const y = HORIZ + 16 + i * i * 5, off = ((s.relogio * 12 + i * 97 - s.cam * (0.1 + i * 0.02)) % 180 + 180) % 180;
      for (let x = -180 + off; x < W; x += 180) ctx.fillRect(x, y, 30 + i * 5, 2);
    }
  }
  function topoDaOnda() {
    const passo = 8, topo = [];
    for (let sx = -passo; sx <= W + passo; sx += passo) topo.push([sx, Y_BASE - altura(s.cam + sx - s.crista)]);
    return topo;
  }
  function parede(ctx) {
    const topo = topoDaOnda();
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-8, Y_BASE);
    for (const [x, y] of topo) ctx.lineTo(x, y);
    ctx.lineTo(W + 8, Y_BASE); ctx.closePath(); ctx.clip();
    const tex = quadro("onda_parede");
    if (tex) { // textura da parede (3 quadros), presa à água: anda junto com o mundo
      const t = tex.width * PX, y = Y_BASE - HMAX * s.forca - 6, hh = HMAX * s.forca + 8;
      const ini = Math.floor(s.cam * 0.9 / t);  // um bloco sim, outro espelhado: as emendas somem
      for (let i = ini; (i * t - s.cam * 0.9) < W; i++) {
        const x = Math.floor(i * t - s.cam * 0.9);
        if (i % 2) { ctx.save(); ctx.translate(x + t, y); ctx.scale(-1, 1); ctx.drawImage(tex, 0, 0, t + 1, hh); ctx.restore(); }
        else ctx.drawImage(tex, x, y, t + 1, hh);
      }
    } else faixas(ctx, Y_BASE - HMAX, Y_BASE, ["#a4f0dd", "#78dfcb", "#4cc6b7", "#33aaa6", "#278d97", "#1f7388", "#185c76", "#134c66"]);
    // listras de água correndo na parede
    if (!tex) for (const [f, c] of [[0.22, "rgba(230,255,250,0.5)"], [0.42, "rgba(220,255,250,0.32)"], [0.62, "rgba(200,245,245,0.25)"], [0.82, "rgba(190,235,240,0.22)"]]) {
      ctx.fillStyle = c;
      for (let i = 0; i < topo.length; i += 2) {
        const [x] = topo[i], alt = Y_BASE - topo[i][1];
        if (Math.sin((x + s.cam) * 0.013 + f * 20) < 0.1) continue;
        ctx.fillRect(x, Y_BASE - alt * f + Math.sin((x + s.cam) / 60 + s.relogio * 3 + f * 9) * 3, 16, 3);
      }
    }
    ctx.restore();
    // beirada da crista (linha clara + espuma pontilhada no alto)
    ctx.fillStyle = "#eafffb";
    for (const [x, y] of topo) ctx.fillRect(x, y - 2, 9, 4);
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < topo.length; i += 3) { const [x, y] = topo[i]; if (((i * 13 + Math.floor(s.relogio * 8)) % 5) < 2) ctx.fillRect(x, y - 6, 5, 4); }
  }
  function rastro(ctx) { // marca da prancha na água
    ctx.fillStyle = "rgba(240,255,255,0.75)";
    for (const r of s.rastro) {
      ctx.globalAlpha = r.vida * 0.7;
      ctx.fillRect(r.x - s.cam - 4, r.y, 8 + 6 * r.vida, 3);
    }
    ctx.globalAlpha = 1;
  }
  function labio(ctx) { // crista caindo por cima (na seção tubular vira o tubo: ele aparece lá dentro)
    if (!s.quebrada || s.forca < 0.3) return;
    const cr = quadro("onda_crista");
    if (cr) { // a arte da crista, espelhada: enrola para a direita (para onde a onda anda); o oco do tubo fica na crista
      const w = cr.width * PX, h = cr.height * PX * s.forca, x = Math.round(s.crista - s.cam - w * 0.35);
      ctx.save(); ctx.translate(x + w, Y_BASE + 8 - h); ctx.scale(-1, 1); ctx.drawImage(cr, 0, 0, w, h); ctx.restore();
      return;
    }
    const xc = s.crista - s.cam, L = s.tuboL, topo = Y_BASE - altura(1);
    const forma = () => {
      ctx.beginPath();
      ctx.moveTo(xc + L + 20, topo + 2);
      ctx.quadraticCurveTo(xc + L * 0.25, topo - HMAX * 0.28 * s.forca, xc - 14, Y_BASE + 6);
      ctx.lineTo(xc + 30, Y_BASE + 6);
      ctx.quadraticCurveTo(xc + L * 0.5, topo + HMAX * 0.12 * s.forca, xc + L - 10, topo + 12);
      ctx.closePath();
    };
    ctx.save(); forma(); ctx.clip();
    faixas(ctx, topo - HMAX * 0.3, Y_BASE + 8, ["#c9fbf1", "#a6f0e3", "#86e2d6", "#9fe9de", "#c8f6ef", "#effffb"], xc - 30, xc + L + 30);
    ctx.restore();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(xc + L + 20, topo + 2); ctx.quadraticCurveTo(xc + L * 0.25, topo - HMAX * 0.28 * s.forca, xc - 14, Y_BASE + 6); ctx.stroke();
  }
  function espuma(ctx) {
    if (!s.quebrada || s.forca < 0.05) return;
    const xc = Math.min(s.crista - s.cam + 10, W);
    const esp = quadro("onda_espuma");
    if (esp) { // espuma (3 quadros) repetida da crista para trás
      const w = esp.width * PX, h = esp.height * PX * s.forca, fim = xc - (ARTE.onda_crista_0 ? ARTE.onda_crista_0.width * PX * 0.18 : 0);
      for (let x = fim - w; x > -w; x -= w - 2) ctx.drawImage(esp, Math.floor(x), Y_BASE + 16 - h, w, h);
      return;
    }
    const borda = (sx) => {
      const d = s.cam + sx - s.crista, alt = altura(Math.min(d, -1));
      return Y_BASE - alt - 10 - Math.abs(Math.sin((sx + s.cam) / 37 + s.relogio * 5)) * 18 - Math.abs(Math.sin((sx + s.cam) / 13 - s.relogio * 7)) * 8;
    };
    // sombra azulada embaixo e a espuma branca por cima (duas camadas)
    for (const [dy, cor] of [[16, "#b9dce6"], [0, "#f4fcff"]]) {
      ctx.fillStyle = cor;
      ctx.beginPath(); ctx.moveTo(xc, Y_BASE + 14);
      for (let sx = xc; sx >= -10; sx -= 10) ctx.lineTo(sx, borda(sx) + dy);
      ctx.lineTo(-10, Y_BASE + 14); ctx.closePath(); ctx.fill();
    }
    // bolhas e respingos
    for (let sx = xc; sx >= -20; sx -= 19) {
      const d = s.cam + sx - s.crista, alt = altura(Math.min(d, -1));
      const k = Math.sin(sx * 12.9 + Math.floor(s.relogio * 6)) * 0.5 + 0.5;
      ctx.fillStyle = k > 0.5 ? "#a9d3df" : "#d7eef4";
      ctx.fillRect(sx + k * 10, Y_BASE - alt * (0.2 + 0.55 * k), 6 + k * 10, 6 + k * 6);
    }
  }
  function aguaDaFrente(ctx) {
    faixas(ctx, Y_BASE, AREIA, ["#1a6f95", "#1f7c9e", "#2789a6", "#3297ae", "#41a5b5", "#55b3bb", "#6fc1c1", "#8fcfc7"]);
    for (let i = 0; i < 3; i++) { // restos de espuma chegando na areia
      const y = Y_BASE + 34 + i * 30 + Math.sin(s.relogio * 0.8 + i) * 6;
      ctx.fillStyle = `rgba(240,252,255,${0.65 - i * 0.12})`;
      for (let x = -10; x <= W + 10; x += 14) {
        const yy = y + Math.sin((x + s.cam * (0.6 + i * 0.1)) / 45 + i * 2) * 5;
        if (Math.sin(x * 0.07 + i * 3 + s.relogio) > -0.3) ctx.fillRect(x, yy, 12, 3);
      }
    }
  }
  const PINTAS = Array.from({ length: 160 }, () => [Math.random(), Math.random(), Math.random()]);
  function areia(ctx) {
    if (ARTE.areia) {
      const im = ARTE.areia, y = AREIA - 40, h = H - y, w = im.width * PX * h / (im.height * PX);
      for (let x = 0; x < W; x += w - 1) ctx.drawImage(im, Math.floor(x), y, w, h);
      const chao = (im2, fx, dy, espelhar) => { if (im2) pintar(ctx, im2, Math.round(W * fx - im2.width * PX / 2), H - im2.height * PX - dy, 1, espelhar); };
      if (W >= 1200 && ARTE.coqueiro) pintar(ctx, ARTE.coqueiro, -110, H - ARTE.coqueiro.height * PX - 4);
      chao(ARTE.cadeira_praia, 0.5, 14);
      chao(ARTE.isopor, 0.33, 8);
      chao(ARTE.guarda_sol, 0.66, 2);
      return;
    }
    // beira molhada e a linha da arrebentação na areia
    const onda = Math.sin(s.relogio * 0.7) * 10;
    ctx.fillStyle = "#c9b48a"; ctx.fillRect(0, AREIA - 4 + onda * 0.3, W, 20);
    ctx.fillStyle = "#f5fbff";
    for (let x = 0; x < W; x += 12) ctx.fillRect(x, AREIA - 8 + onda * 0.3 + Math.sin(x / 40 + s.relogio) * 3, 10, 4);
    faixas(ctx, AREIA + 14, H, ["#ecd6a4", "#efdcab", "#f2e1b3", "#f0dcac", "#ead39f", "#e2c791"]);
    for (const [px, py, k] of PINTAS) { // grãos e conchinhas
      ctx.fillStyle = k > 0.92 ? "#fff6e8" : k > 0.5 ? "#d9bf8a" : "#e6cd99";
      ctx.fillRect(px * W, AREIA + 20 + py * (H - AREIA - 20), k > 0.92 ? 6 : 4, k > 0.92 ? 4 : 4);
    }
    // guarda-sol, toalha, isopor e uma prancha fincada
    const gx = W * 0.72;
    ctx.fillStyle = "#e85fa8"; ctx.fillRect(gx - 140, H - 70, 150, 34);                   // toalha
    ctx.fillStyle = "#ffffff"; for (let i = 0; i < 5; i++) ctx.fillRect(gx - 140 + i * 30, H - 70, 12, 34);
    ctx.fillStyle = "#5a4630"; ctx.fillRect(gx - 4, H - 260, 8, 230);                       // haste
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? "#fff3e0" : "#ff5ad8";
      ctx.beginPath(); ctx.moveTo(gx, H - 280); ctx.arc(gx, H - 200, 150, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = "rgba(90,60,30,0.18)"; ctx.fillRect(gx - 150, H - 46, 300, 16);         // sombra
    const ix = W * 0.33;
    ctx.fillStyle = "#3a7ab8"; ctx.fillRect(ix - 4, H - 92, 98, 16); ctx.fillStyle = "#e9f1f5"; ctx.fillRect(ix, H - 78, 90, 56);
    ctx.fillStyle = "#c8323c"; ctx.fillRect(ix + 14, H - 104, 12, 14); ctx.fillStyle = "#ffd36b"; ctx.fillRect(ix + 32, H - 106, 12, 16);
    const px = W * 0.5; // prancha fincada na areia
    ctx.fillStyle = "#1c2733"; ctx.fillRect(px - 22, H - 250, 44, 220);
    ctx.fillStyle = "#fffaf0"; ctx.fillRect(px - 18, H - 246, 36, 214); ctx.fillRect(px - 10, H - 258, 20, 14);
    ctx.fillStyle = "#ff5ad8"; ctx.fillRect(px - 3, H - 240, 6, 200);
  }
  // ---------- a turma na areia ----------
  async function carregarAmigos() {
    await (NSF.VIP ? NSF.VIP.pronto : Promise.resolve());
    const url = (u) => (NSF.VIP ? NSF.VIP.url(u) : u), PASTA = "assets/characters/npcs/";
    await Promise.all(AMIGOS.filter((a) => a.personagem).map(async (a) => {
      try {
        if (a.tres) {
          const r = await global.fetch(url(PASTA + a.personagem + "/sprites3d.json"));
          if (r.ok) {
            const m = await r.json(), c = m.cima;
            await Promise.all(Object.values(c).map((f) => carregarImg(url(PASTA + a.personagem + "/" + f.folha)).then((im) => { f.img = im; })));
            a.tira = c; a.altura = m.altura_px;
            return;
          }
        }
        const d = await (await global.fetch(url(PASTA + a.personagem + "/personagem.json"))).json();
        const pm = await new global.PersonagemModular(d, PASTA + a.personagem + "/").carregar();
        pm.definirVista("costas"); pm.tocar("parado"); pm.tempo = Math.random() * 2; pm.pixelado = false;
        a.pm = pm;
      } catch (e) { /* sem a senha / sem o arquivo: fica a silhueta */ }
    }));
  }
  const ALT_AMIGO = 330; // px na tela (estão mais perto da câmera que o surfista)
  function turma(ctx, dt) {
    const pulo = Math.max(0, 1 - (s.relogio - s.festa) / 1.1);
    AMIGOS.forEach((a, i) => {
      const x = W * a.x, y = H - 8 - Math.abs(Math.sin((s.relogio - s.festa) * 9 + i)) * 30 * pulo;
      ctx.fillStyle = "rgba(90,60,30,0.25)"; ctx.fillRect(x - 46, H - 16, 92, 10);
      if (a.pm) {
        a.pm.atualizar(dt);
        a.pm.desenhar(ctx, x, y, ALT_AMIGO / 1375);
      } else if (a.tira) {
        const rindo = pulo > 0.05 && a.tira.rir, f = rindo ? a.tira.rir : a.tira.parado;
        const q = Math.floor(s.relogio * f.fps + i) % f.quadros, e = ALT_AMIGO / a.altura;
        ctx.drawImage(f.img, q * f.larg, 0, f.larg, f.alt, x - f.pes[0] * e, y - f.pes[1] * e, f.larg * e, f.alt * e);
      } else { // silhueta (sem arte ou sem o pacote dos amigos)
        ctx.fillStyle = ["#2a2030", "#3b2a22", "#1f2a36", "#34261f", "#2c2238"][i];
        ctx.fillRect(x - 54, y - 150, 108, 150);
        ctx.beginPath(); ctx.arc(x, y - 200, 44, 0, DOIS_PI); ctx.fill();
        if (a.boné) { ctx.fillStyle = "#ff5ad8"; ctx.fillRect(x - 46, y - 236, 92, 26); ctx.fillRect(x - 70, y - 216, 40, 10); }
      }
      if (pulo > 0.2 && !a.tira) { // braços para cima comemorando
        ctx.fillStyle = "rgba(255,255,255,0.0)";
      }
    });
    // fala da turma
    if (s.fala && s.relogio - s.fala.t < 2.6) {
      const a = AMIGOS[s.fala.quem], x = W * a.x, texto = a.nome + ": " + s.fala.texto;
      ctx.font = "700 30px system-ui, sans-serif";
      const w = ctx.measureText(texto).width + 36, bx = lim(x - w / 2, 12, W - w - 12), by = H - ALT_AMIGO - 90;
      ctx.fillStyle = "rgba(255,255,255,0.96)"; ctx.strokeStyle = "#2a2030"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(bx, by, w, 52, 18); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 12, by + 51); ctx.lineTo(x, by + 76); ctx.lineTo(x + 12, by + 51); ctx.fill();
      ctx.fillStyle = "#2a2030"; ctx.fillText(texto, bx + 18, by + 36);
    }
  }
  function gotas(ctx) {
    for (const g of s.gotas) {
      ctx.globalAlpha = Math.max(0, g.vida);
      ctx.fillStyle = g.r > 3.5 ? "#ffffff" : "#d8f4ff";
      ctx.fillRect(g.x - s.cam - g.r, g.y - g.r, g.r * 2, g.r * 2);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- o surfista (em resolução cheia por cima da cena) ----------
  // prancha: a arte do kit da praia (assets/maps/praia/prancha.png, bico para a direita) quando existir; senão, por código
  const artePrancha = new Image();
  artePrancha.src = "assets/maps/praia/prancha.png";
  function prancha(ctx) {
    if (artePrancha.complete && artePrancha.naturalWidth) {
      const w = 196, h = Math.round(w * artePrancha.naturalHeight / artePrancha.naturalWidth);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(artePrancha, -98, 14 - h, w, h);
      return;
    }
    ctx.fillStyle = "#fffaf0"; ctx.strokeStyle = "#1c2733"; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-88, 0); ctx.quadraticCurveTo(-90, 10, -70, 12); ctx.lineTo(70, 12); ctx.quadraticCurveTo(100, 8, 96, -4); ctx.quadraticCurveTo(60, 2, -88, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ff5ad8"; ctx.fillRect(-70, 5, 150, 3);
    ctx.fillStyle = "#1c2733";
    ctx.beginPath(); ctx.moveTo(-74, 12); ctx.lineTo(-64, 26); ctx.lineTo(-58, 12); ctx.fill();
  }
  function desenharTira3d(ctx, f, x, y) {
    const q = Math.floor(s.relogio * f.fps) % f.quadros, e = surf3d.escala;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(f.img, q * f.larg, 0, f.larg, f.alt, x - f.pes[0] * e, y - f.pes[1] * e, f.larg * e, f.alt * e);
  }
  function desenharSurfista(ctx) {
    if ((!heroi && !surf3d) || s.fase === "intro" || s.fase === "fim") return;
    let [x, y] = posPrancha();
    x -= s.cam;
    // inclinação: acompanha o movimento na parede (subindo, o bico aponta para cima)
    const alt = Math.max(60, altura(s.x - s.crista)), vc = vCrista();
    const alvoAng = s.fase === "surfando" && !s.ar && !s.floater
      ? lim(Math.atan2(-s.vh * alt * 0.82, 240 + Math.abs(s.u) * 0.5), -0.85, 0.85) * s.dir : 0;
    s.ang += (alvoAng - s.ang) * 0.18;
    if (s.ar) { // sombra na água enquanto está no ar
      ctx.fillStyle = "rgba(10,40,60,0.3)";
      ctx.beginPath(); ctx.ellipse(x, y + s.ar.alt + 6, 70, 10, 0, 0, DOIS_PI); ctx.fill();
    }
    ctx.save();
    ctx.translate(x, y);
    if (s.fase === "remando") {
      ctx.save(); ctx.translate(40, 2); prancha(ctx); ctx.restore();
      if (surf3d) desenharTira3d(ctx, surf3d.remar, 34, 4);
      else { heroi.definirVista("lado_direito"); ctx.rotate(Math.PI / 2); heroi.desenhar(ctx, -2, 10 - 130 * ESC, ESC); }
      ctx.restore();
      return;
    }
    ctx.rotate(s.ang + s.giro);
    const vira = Math.sign(s.virar) * Math.max(0.15, Math.abs(s.virar));
    ctx.scale(vira, 1); // a prancha aponta para onde ele vai (A volta: para trás)
    const agacha = s.tubo || ent.baixo ? 0.88 : 1;           // agachado no tubo / descendo
    ctx.scale(1, agacha);
    prancha(ctx);
    if (surf3d) desenharTira3d(ctx, surf3d.surf, 4, 2);
    else { heroi.definirVista("frente"); heroi.desenhar(ctx, 0, pesAbaixo * ESC + 2, ESC); }
    ctx.restore();
    if (s.m > 1.25 && !s.ar && s.fase === "surfando") { // linhas de velocidade (impulso alto)
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let i = 0; i < 4; i++) ctx.fillRect(x - s.dir * (160 + ((s.relogio * 900 + i * 70) % 140)) - (s.dir < 0 ? 70 : 0), y - 40 - i * 26, 70, 3);
    }
  }

  // ---------- HUD ----------
  function texto(ctx, t, x, y, tam, cor, alinhar) {
    ctx.font = `800 ${tam}px system-ui, sans-serif`; ctx.textAlign = alinhar || "center";
    ctx.lineWidth = Math.max(4, tam / 7); ctx.strokeStyle = "rgba(20,10,30,0.85)"; ctx.strokeText(t, x, y);
    ctx.fillStyle = cor || "#fff"; ctx.fillText(t, x, y);
    ctx.textAlign = "left";
  }
  const toque = global.matchMedia && global.matchMedia("(pointer: coarse)").matches;
  function hud(ctx) {
    const meio = W / 2;
    if (s.fase !== "nota") s.avisos.forEach((a, i) => {
      ctx.globalAlpha = Math.min(1, a.vida * 2);
      texto(ctx, a.texto, meio, 470 + a.y - (s.avisos.length - 1 - i) * 54, Math.min(a.tam, W / 14), a.cor);
    });
    ctx.globalAlpha = 1;
    if (s.fase === "intro" || s.fase === "fim") return;
    texto(ctx, `Onda ${Math.min(s.onda + 1, REGRAS.ondas)}/${REGRAS.ondas}`, W - 24, 130, 34, "#fff", "right");
    texto(ctx, s.notas.map((n) => n.toFixed(1)).join("  ·  ") || "", W - 24, 175, 28, "#ffd36b", "right");
    if (s.fase === "remando") texto(ctx, "Lá vem a onda... 🌊", meio, 300, 56, "#ffd36b");
    if (s.fase === "surfando") {
      texto(ctx, String(Math.round(s.pontos)), meio, 140, 58, "#fff");
      texto(ctx, `nota ${nota(s.pontos).toFixed(1)}`, meio, 182, 28, "#ffd36b");
      const tw = Math.min(420, W - 80), tx = meio - tw / 2;
      ctx.fillStyle = "rgba(20,10,30,0.6)"; ctx.fillRect(tx, 200, tw, 10);
      ctx.fillStyle = "#9ff3ff"; ctx.fillRect(tx, 200, tw * Math.max(0, 1 - s.tOnda / REGRAS.segundosOnda), 10);
      // velocímetro
      const vel = lim((s.m - 0.2) / 1.4, 0, 1);
      ctx.fillStyle = "rgba(20,10,30,0.6)"; ctx.fillRect(24, 220, 180, 14);
      ctx.fillStyle = vel > 0.7 ? "#ff8be6" : "#7dff9a"; ctx.fillRect(24, 220, 180 * vel, 14);
      texto(ctx, "impulso", 24, 212, 20, "#fff", "left");
      if (s.tubo) texto(ctx, `TUBO ${s.tubo.t.toFixed(1)}s!`, meio, 255, 34, "#9ff3ff");
      else if (s.floater) texto(ctx, "Em cima da crista! Solte ou desça para fechar o floater", meio, 255, 28, "#ffd36b");
      else if (secaoEm(s.crista).tipo === "tubular" && s.x - s.crista < 420) texto(ctx, "🌀 Seção tubular: solte tudo e deixe a onda te cobrir!", meio, 255, 28, "#9ff3ff");
      if (!toque) { // legenda do teclado
        const ajuda = "D vai · A volta · W/S sobe e desce · Espaço pula (perto da crista: aéreo)";
        ctx.font = "700 22px system-ui, sans-serif"; ctx.fillStyle = "rgba(20,10,30,0.55)";
        const lw = Math.min(W - 24, ctx.measureText(ajuda).width + 40); ctx.beginPath(); ctx.roundRect(meio - lw / 2, AREIA - 52, lw, 38, 14); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText(ajuda, meio, AREIA - 26); ctx.textAlign = "left";
      }
    }
    if (s.fase === "nota") {
      ctx.fillStyle = "rgba(20,10,30,0.7)"; ctx.beginPath(); ctx.roundRect(meio - 230, 230, 460, 190, 24); ctx.fill();
      texto(ctx, "Nota dos juízes", meio, 285, 32, "#fff");
      texto(ctx, s.ultimaNota.toFixed(1), meio, 370, 84, s.ultimaNota >= 8 ? "#7dff9a" : s.ultimaNota >= 5 ? "#ffd36b" : "#ff8b8b");
      texto(ctx, "Completou a onda 🤙", meio, 410, 24, "#c9b8ee");
    }
  }

  function desenhar(ctx, agora) {
    W = NSF.CONFIG.larguraBase;
    const dt = Math.min(0.05, Math.max(0, (agora - (desenhar.ultimo || agora)) / 1000));
    desenhar.ultimo = agora;
    atualizar(dt);
    const tx = (Math.random() - 0.5) * s.tremor, ty = (Math.random() - 0.5) * s.tremor;
    // sem a arte, o lábio desenhado vai na frente dele no tubo; com a arte, a crista fica atrás e a cortina d'água cobre
    const noTubo = !ARTE.onda_crista_0 && (!!s.tubo || (s.x - s.crista < s.tuboL && s.x - s.crista > -20 && s.tuboL > 150));
    // fundo: céu, mar, parede, marca da prancha (e o lábio, quando ele não está no tubo)
    const f = prepararCamada(fundo);
    ceu(f); marAoFundo(f); parede(f); rastro(f);
    if (!noTubo) labio(f);
    // frente: lábio (tubo), espuma, água da frente, respingos, areia e a turma
    const fr = prepararCamada(frente);
    if (noTubo) labio(fr);
    espuma(fr); aguaDaFrente(fr); gotas(fr); areia(fr); turma(fr, dt);
    ctx.save();
    ctx.translate(tx, ty);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(fundo, 0, 0, fundo.width * PX, fundo.height * PX);
    desenharSurfista(ctx);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(frente, 0, 0, frente.width * PX, frente.height * PX);
    ctx.restore();
    hud(ctx);
    if (A() && !desenhar.mar && A().estado().contexto === "running") { A().mar(true); desenhar.mar = true; }
  }

  // ---------- teclado e botões ----------
  const tela = doc.getElementById("tela");
  const TECLAS = { KeyW: "cima", ArrowUp: "cima", KeyS: "baixo", ArrowDown: "baixo", KeyA: "freia", ArrowLeft: "freia",
    KeyD: "acelera", ArrowRight: "acelera", Space: "pula" };
  const teclaDe = (e) => TECLAS[e.code] || TECLAS[{ w: "KeyW", s: "KeyS", a: "KeyA", d: "KeyD", " ": "Space" }[(e.key || "").toLowerCase()]];
  global.addEventListener("keydown", (e) => {
    const n = teclaDe(e);
    if (!n || !caixa.hidden) return;
    e.preventDefault();
    if (!e.repeat) apertar(n, true);
  });
  global.addEventListener("keyup", (e) => { const n = teclaDe(e); if (n) apertar(n, false); });
  global.addEventListener("blur", () => { for (const k of Object.keys(ent)) ent[k] = false; });
  tela.addEventListener("pointerdown", () => { if (s.fase === "remando") remar(); });
  // botões na tela (celular): segurar = apertado; vários dedos ao mesmo tempo
  const botoes = doc.getElementById("botoes");
  if (botoes) {
    botoes.hidden = !(toque || params.has("botoes"));
    for (const b of botoes.querySelectorAll("[data-acao]")) {
      const n = b.dataset.acao;
      const solta = (e) => { if (e) e.preventDefault(); b.classList.remove("apertado"); apertar(n, false); };
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        try { b.setPointerCapture(e.pointerId); } catch (erro) { /* sem captura: solta no pointerup */ }
        b.classList.add("apertado"); apertar(n, true);
      });
      b.addEventListener("pointerup", solta); b.addEventListener("pointercancel", solta); b.addEventListener("lostpointercapture", () => solta());
      b.addEventListener("contextmenu", (e) => e.preventDefault());
    }
  }

  // ---------- telas de começo e fim ----------
  const caixa = doc.getElementById("caixa");
  function comecar() { caixa.hidden = true; s.onda = 0; s.notas = []; novaOnda(); }
  function mostrarInicio() {
    caixa.innerHTML = "";
    const h = doc.createElement("h1"); h.textContent = "🏄 Surf na praia";
    const p = doc.createElement("p");
    p.textContent = toque ? "▶ vai · ◀ volta (a prancha vira) · ▲▼ sobe e desce a onda · PULAR. Ele nunca cai!"
      : "D vai · A volta (a prancha vira) · W/S sobe e desce a onda · Espaço pula. Ele nunca cai!";
    const ul = doc.createElement("ul");
    for (const t of ["Voltando (prancha para trás) e subindo a parede: CUTBACK", "Suba até a crista e ande em cima dela: FLOATER",
      "Perto da crista, pule: AÉREO (no ar, ◀/▶ ou A/D giram: 360!)", "Sem apertar nada, a onda te alcança e cobre: TUBO (2 s = tubaço)",
      "Desça até o pé da onda e suba com tudo: cavada (descer dá impulso)", "3 ondas; a nota final é a soma das 2 melhores"]) {
      const li = doc.createElement("li"); li.textContent = t; ul.appendChild(li);
    }
    const b = doc.createElement("button"); b.type = "button"; b.textContent = "Bora surfar!";
    b.addEventListener("click", comecar);
    caixa.append(h, p, ul, b);
    let recorde = 0;
    try { recorde = +global.localStorage.getItem("nsf_surf_recorde") || 0; } catch (e) { /* ok */ }
    if (recorde) { const r = doc.createElement("small"); r.textContent = `Seu recorde: ${recorde.toFixed(1)}`; caixa.appendChild(r); }
    caixa.hidden = false;
  }
  function mostrarFim(total, recorde, novo) {
    caixa.innerHTML = "";
    const h = doc.createElement("h1"); h.textContent = titulo(total);
    const p = doc.createElement("p"); p.textContent = `Notas: ${s.notas.map((n) => n.toFixed(1)).join(" · ")}`;
    const t = doc.createElement("div"); t.className = "total"; t.textContent = total.toFixed(1);
    const r = doc.createElement("small"); r.textContent = novo ? "Novo recorde! 🎉" : `Recorde: ${recorde.toFixed(1)}`;
    const b = doc.createElement("button"); b.type = "button"; b.textContent = "Surfar de novo";
    b.addEventListener("click", comecar);
    const v = doc.createElement("a"); v.href = "garagem.html?comodo=carro"; v.textContent = "Voltar para o carro";
    caixa.append(h, t, p, r, b, v);
    caixa.hidden = false;
  }

  // ---------- começo ----------
  const bSom = doc.getElementById("som");
  if (bSom && A() && !A().ligado()) { bSom.textContent = "Som: desligado"; bSom.setAttribute("aria-pressed", "false"); }
  if (bSom) bSom.addEventListener("click", () => {
    const on = A() ? A().alternar() : false;
    bSom.textContent = on ? "Som: ligado" : "Som: desligado"; bSom.setAttribute("aria-pressed", String(on));
  });
  if (A()) { A().trilha("praia"); A().musica(true); }
  (function avisoDeitar() { // celular em pé: sugere deitar (uma vez por visita)
    let visto = false;
    try { visto = global.sessionStorage.getItem("nsf_aviso_deitar") === "1"; } catch (e) { /* ok */ }
    if (!toque || visto || global.innerWidth > global.innerHeight || params.has("test")) return;
    const a = doc.createElement("div"); a.className = "aviso-deitar"; a.setAttribute("role", "dialog");
    const i = doc.createElement("div"); i.className = "aviso-deitar-cel"; i.textContent = "📱";
    const t1 = doc.createElement("b"); t1.textContent = "Está no celular?";
    const t2 = doc.createElement("span"); t2.textContent = "Para surfar, deite o celular.";
    const ok = doc.createElement("button"); ok.type = "button"; ok.textContent = "Ok, entendi";
    a.append(i, t1, t2, ok);
    const fechar = () => { a.remove(); try { global.sessionStorage.setItem("nsf_aviso_deitar", "1"); } catch (e) { /* ok */ } };
    ok.addEventListener("click", fechar);
    global.addEventListener("resize", () => { if (global.innerWidth > global.innerHeight) fechar(); });
    doc.body.appendChild(a);
  })();

  s.forca = 0.6; s.crista = -500; s.quebrada = true; gerarSecoes(-500); // de fundo, enquanto lê as instruções
  (usa3d ? carregar3d().catch((e) => { NSF.estado.erros.push(String(e)); return carregarHeroi(); }) : carregarHeroi())
    .catch((e) => NSF.estado.erros.push(String(e)));
  carregarAmigos();
  NSF.iniciar(tela, desenhar, { adaptar: true });
  global.NSF_SURF.desenhar = desenhar;
  if (params.has("direto")) comecar(); else mostrarInicio();
})(typeof window !== "undefined" ? window : globalThis);
