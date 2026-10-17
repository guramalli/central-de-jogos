// Minigame de surf (surf.html): visto da areia, olhando para o mar. A onda quebra da esquerda para a direita e ele
// surfa na parede dela, de neoprene. 3 ondas; cada onda ganha uma nota de 0 a 10 dos juízes e o resultado é a soma
// das 2 melhores (como no campeonato de verdade).
//   Remar: toques rápidos (ou espaço) enquanto a onda chega.
//   Manobras (deslizar o dedo ou setas): ↓ cavada (ganha velocidade) · ↑ batida na crista (com muita velocidade: aéreo)
//   · ← rasgada (volta para perto da espuma) · → bombear (um pouco de velocidade) · segurar = tubo (seção tubular).
// Perto da espuma vale mais (até 3x); repetir a mesma manobra vale menos. Lento demais, a espuma pega (caixote).
// Tudo desenhado por código por enquanto (mar, onda, prancha, turma de costas na areia); a arte pode vir depois.
(function (global) {
  "use strict";

  // ---------- regras (sem tela: testadas em tests/surf.test.js) ----------
  const REGRAS = { ondas: 3, segundosOnda: 26, vCrista: 300 };
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
  const H = 1080, HORIZ = 360, Y_BASE = 790, AREIA = 935, HMAX = 290, ESC = 0.15;
  let W = NSF.CONFIG.larguraBase;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const escolher = (l) => l[Math.floor(Math.random() * l.length)];
  const lim = (v, a, b) => Math.max(a, Math.min(b, v));

  // Falas da turma na areia (de costas para a câmera, olhando o mar)
  const TURMA = ["Vibola", "Gustavinho", "Juan", "Vini"];
  const FALAS = {
    drop: ["Dropou! 🏄", "Agora vai!", "Segura, peão!"],
    aereo: ["VOOOOU! 🛫", "Ô LOCO, BICHO! Que aéreo!", "O Medina tá com medo!"],
    tubo: ["Ó O TUBOOO!", "Entrou no barril!", "Tá lá dentro, tá lá dentro!"],
    saiuTubo: ["SAIU SECO! 💦", "Cuspido pelo tubo!!", "Que tubaço!"],
    caixote: ["Caiu igual saco de batata 🥔", "Tomou um caixote de respeito", "Engoliu meio oceano!", "KKKKKKKKK"],
    batida: ["Rasgou a crista!", "Bateu bonito!", "Isso é surf!"],
    rasgada: ["Que rasgada!", "Voltou pra espuma, coragem!"],
    perdeu: ["Rema, preguiçoso! 😂", "A onda passou e ele ficou", "Rema mais forte!"],
    notaAlta: ["NOTA DEZ! 🔥", "Contrata esse cara!"],
    notaBaixa: ["Volta pro churrasco 😂", "Melhor ficar na areia com a gente"],
  };

  // ---------- personagem modular de neoprene, com poses de surf ----------
  function mul(m, n) {
    return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
      m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  }
  function girar(graus, px, py) {
    const r = graus * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    return [c, s, -s, c, px - c * px + s * py, py - s * px - c * py];
  }
  const ponto = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  // poses de frente (graus por osso; + = sentido horário na tela). Coxas abrem e canelas voltam = joelho dobrado.
  const POSES = {
    base:    { tronco: 6, braco_sup_esq: 55, antbraco_esq: -20, braco_sup_dir: -60, antbraco_dir: 25, coxa_esq: 22, canela_esq: -30, coxa_dir: -22, canela_dir: 30 },
    agacha:  { tronco: 14, braco_sup_esq: 40, antbraco_esq: -10, braco_sup_dir: -45, antbraco_dir: 15, coxa_esq: 34, canela_esq: -50, coxa_dir: -34, canela_dir: 50 },
    cavada:  { tronco: 16, braco_sup_esq: 18, antbraco_esq: 10, braco_sup_dir: -100, antbraco_dir: 20, coxa_esq: 32, canela_esq: -46, coxa_dir: -32, canela_dir: 46 },
    batida:  { tronco: -12, braco_sup_esq: 115, antbraco_esq: -30, braco_sup_dir: -40, antbraco_dir: 10, coxa_esq: 16, canela_esq: -20, coxa_dir: -16, canela_dir: 20 },
    rasgada: { tronco: -16, braco_sup_esq: 85, antbraco_esq: -15, braco_sup_dir: -105, antbraco_dir: 20, coxa_esq: 26, canela_esq: -36, coxa_dir: -26, canela_dir: 36 },
    aereo:   { tronco: 2, braco_sup_esq: 140, antbraco_esq: -20, braco_sup_dir: -25, antbraco_dir: 45, coxa_esq: 42, canela_esq: -78, coxa_dir: -42, canela_dir: 78 },
    tubo:    { tronco: 20, braco_sup_esq: 25, antbraco_esq: 0, braco_sup_dir: -115, antbraco_dir: 10, coxa_esq: 38, canela_esq: -56, coxa_dir: -38, canela_dir: 56 },
    caindo:  { tronco: 30, braco_sup_esq: 150, antbraco_esq: 30, braco_sup_dir: -150, antbraco_dir: -30, coxa_esq: 10, canela_esq: 20, coxa_dir: -30, canela_dir: -10 },
  };
  let heroi = null, poseAtual = Object.assign({}, POSES.base), poseAlvo = "base";
  const quadroFrente = {}, quadroLado = {};
  let pesAbaixo = 0; // quanto os pés subiram com os joelhos dobrados (o corpo desce isso para os pés ficarem na prancha)

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
    // pés: onde foram parar com os joelhos dobrados
    let soma = 0;
    for (const lado of ["esq", "dir"]) {
      const m = mul(quadroFrente["coxa_" + lado], quadroFrente["canela_" + lado]), p = ossos["pe_" + lado].pivo;
      soma += p[1] - ponto(m, p[0], p[1])[1];
    }
    pesAbaixo = soma / 2;
  }
  // remando deitado na prancha (de lado): os braços giram como remo
  function poseRemando(t) {
    const o = heroi.rig.vistas.lado_direito.ossos, a = t * 330;
    quadroLado.braco = girar(a, o.braco.pivo[0], o.braco.pivo[1]);
    quadroLado.braco_tras = girar(a + 180, o.braco_tras.pivo[0], o.braco_tras.pivo[1]);
  }

  // ---------- estado ----------
  const s = {
    fase: "intro", onda: 0, notas: [], pontos: 0, hist: [], tOnda: 0,
    x: 0, h: 0.5, hAlvo: 0.5, v: 0, crista: 0, forca: 0, quebrada: false, secoes: [], tuboL: 90,
    remo: null, manobra: null, tubo: null, ar: null, caiu: null, segurando: false, giro: 0,
    yPrev: null, ang: 0, cam: 0, avisos: [], gotas: [], fala: null, festa: -9, relogio: 0, espera: 0, ultimaCavada: -9,
  };
  global.NSF_SURF = { s, comando: (n) => executar(n), regras: Regras };

  // ---------- onda ----------
  function secaoEm(x) {
    for (const sc of s.secoes) if (x >= sc.ini && x < sc.fim) return sc;
    return { tipo: "normal" };
  }
  function gerarSecoes(inicio) {
    s.secoes = [];
    let x = inicio, primeira = true;
    while (x < inicio + 40 * REGRAS.vCrista) {
      // a primeira seção é normal (dá tempo de se acostumar); depois sorteia
      const tipo = primeira ? "normal" : escolher(["normal", "normal", "tubular", "tubular", "cheia"]);
      const len = primeira ? 1300 : rnd(900, 1600);
      s.secoes.push({ ini: x, fim: x + len, tipo });
      x += len; primeira = false;
    }
  }
  const vCrista = () => { const t = secaoEm(s.crista).tipo; return t === "tubular" ? 330 : t === "cheia" ? 255 : 300; };
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
    s.manobra = s.tubo = s.ar = s.caiu = null; s.segurando = false; s.giro = 0;
    s.x = s.x || 0; s.crista = s.x - 110; s.h = 0; s.v = 0;
    s.remo = { val: 0, t: 0, dur: 3.8 };
    poseAlvo = "base";
  }
  function remar() {
    if (!s.remo) return;
    s.remo.val = Math.min(1.15, s.remo.val + 0.14);
    if (Math.random() < 0.5) gota(s.x + rnd(-10, 40), Y_BASE - altura(s.x - s.crista) * 0.12, rnd(-80, 80), rnd(-220, -120), 2);
  }
  function dropar() {
    s.fase = "surfando"; s.quebrada = true; s.remo = null;
    gerarSecoes(s.crista);
    s.v = REGRAS.vCrista + 130; s.h = 1; s.hAlvo = 0.15;
    poseAlvo = "cavada"; s.manobra = { nome: "drop", t: 0, dur: 0.7 };
    pontuar("DROP!", 200);
    if (A()) A().swoosh(true);
    falar("drop");
  }
  function perdeuOnda() {
    s.fase = "perdeu"; s.espera = 2.2; s.remo = null;
    aviso("Perdeu a onda!", s.x, "#ffd36b", 44);
    falar("perdeu");
  }
  function fimOnda(motivo) {
    if (s.fase !== "surfando") return;
    if (motivo === "completou") pontuar("Completou a onda!", 600);
    const n = nota(s.caiu ? s.pontos * 0.75 : s.pontos);
    s.notas.push(n); s.onda++;
    s.fase = "nota"; s.espera = 3.2; s.ultimaNota = n; s.motivo = motivo;
    if (n >= 8) falar("notaAlta"); else if (n < 3) falar("notaBaixa");
  }
  function fimJogo() {
    s.fase = "fim";
    const total = resultado(s.notas);
    let recorde = 0;
    try { recorde = +global.localStorage.getItem("nsf_surf_recorde") || 0; if (total > recorde) global.localStorage.setItem("nsf_surf_recorde", String(total)); } catch (e) { /* ok */ }
    mostrarFim(total, Math.max(total, recorde), total > recorde && recorde > 0);
  }

  // ---------- manobras ----------
  function pontuar(texto, pts, cor) {
    s.pontos += pts;
    aviso(pts ? `${texto} +${pts}` : texto, s.x, cor || "#ffffff", pts >= 2000 ? 54 : 42);
  }
  function executar(nome) {
    if (s.fase === "remando") { remar(); return; }
    if (s.fase !== "surfando" || s.caiu || s.ar) return;
    if (nome === "soltar") { s.segurando = false; if (s.tubo) sairTubo(); return; }
    if (nome === "segurar") { s.segurando = true; return; }
    if (s.manobra || s.tubo || nome === "remar") return;
    const d = s.x - s.crista, vc = vCrista();
    const fator = repeticao(s.hist, nome === "cima" ? (s.v >= vc + 150 ? "aereo" : "batida") : nome);
    if (nome === "cavada") {
      s.v += 150; s.hAlvo = 0.06; poseAlvo = "cavada";
      s.manobra = { nome, t: 0, dur: 0.6 };
      pontuar("Cavada", Math.round(300 * fator));
      s.ultimaCavada = s.relogio; s.hist.push(nome);
      if (A()) A().swoosh(false);
    } else if (nome === "cima" && s.v >= vc + 150) { // aéreo: precisa de velocidade; mais rápido = mais chance de aterrissar
      const v0 = s.v, gira = v0 >= vc + 290;
      s.ar = { t: 0, dur: gira ? 1.15 : 0.95, gira, cai: Math.random() > lim(0.5 + (v0 - vc - 150) / 300, 0.5, 0.93), pts: Math.round((gira ? 3200 : 1900) * proximidade(d) * fator) };
      s.v -= 110; s.hAlvo = 0.95; poseAlvo = "aereo"; s.hist.push("aereo");
      aviso(gira ? "AÉREO 360!" : "AÉREO!", s.x, "#ff8be6", 50);
      espirro(22);
      if (A()) A().swoosh(true);
    } else if (nome === "cima") { // batida na crista; logo depois de uma cavada vira combo
      const combo = s.relogio - s.ultimaCavada < 1.6 ? 1.4 : 1;
      s.v -= 50; s.hAlvo = 0.98; poseAlvo = "batida";
      s.manobra = { nome: "batida", t: 0, dur: 0.75, desce: true };
      pontuar(combo > 1 ? "Batida COMBO" : "Batida", Math.round(700 * proximidade(d) * fator * combo), combo > 1 ? "#ffd36b" : null);
      s.hist.push("batida"); espirro(14);
      if (A()) A().swoosh(true);
      if (Math.random() < 0.5) falar("batida");
    } else if (nome === "rasgada") { // volta em direção à espuma: perde velocidade, vale muito se for perto dela
      s.v -= 190; s.hAlvo = 0.55; poseAlvo = "rasgada";
      s.manobra = { nome, t: 0, dur: 0.85, vira: true };
      pontuar("Rasgada", Math.round(900 * proximidade(d) * fator));
      s.hist.push(nome); espirro(18);
      if (A()) A().swoosh(true);
      if (Math.random() < 0.5) falar("rasgada");
    } else if (nome === "bombear") {
      s.v += 70; poseAlvo = "agacha"; s.hAlvo = lim(s.h + 0.15, 0.2, 0.7);
      s.manobra = { nome, t: 0, dur: 0.35 };
    }
  }
  function tentarTubo() {
    const d = s.x - s.crista;
    if (secaoEm(s.crista).tipo !== "tubular" || d > 320 || d < -30) return false;
    s.tubo = { t: 0, fecha: rnd(2.0, 4.4) };
    s.hAlvo = 0.32; poseAlvo = "tubo";
    aviso("No tubo...", s.x, "#9ff3ff", 40);
    falar("tubo");
    return true;
  }
  function sairTubo() {
    const t = s.tubo.t, d = s.x - s.crista;
    s.tubo = null; poseAlvo = "base"; s.hAlvo = 0.45;
    s.v = vCrista() + 240; // cuspido pelo tubo
    pontuar(`TUBO ${t.toFixed(1)}s!`, Math.round((1200 + t * 1300) * (d < 0 ? 1.3 : 1)), "#9ff3ff");
    s.hist.push("tubo"); espirro(26);
    if (A()) A().swoosh(true);
    falar("saiuTubo"); s.festa = s.relogio;
  }
  function caixote(motivo) {
    if (s.caiu) return;
    s.caiu = { t: 0, motivo }; s.tubo = null; s.manobra = null; s.ar = null; poseAlvo = "caindo";
    aviso(motivo, s.x, "#ff6b6b", 46);
    espirro(40);
    if (A()) A().tchibum();
    falar("caixote"); s.festa = s.relogio;
  }

  // ---------- efeitos ----------
  function aviso(texto, x, cor, tam) { s.avisos.push({ texto, x, y: 0, vida: 1.6, cor, tam }); if (s.avisos.length > 4) s.avisos.shift(); }
  function gota(x, y, vx, vy, r) { s.gotas.push({ x, y, vx, vy, r, vida: 1 }); }
  function espirro(n) {
    const [, y] = posPrancha();
    for (let i = 0; i < n; i++) gota(s.x - rnd(0, 50), y, rnd(-260, 60), rnd(-520, -180), rnd(2, 5));
  }
  function falar(tipo) {
    if (s.fala && s.relogio - s.fala.t < 1.2) return; // não atropela a fala anterior
    s.fala = { quem: Math.floor(Math.random() * TURMA.length), texto: escolher(FALAS[tipo]), t: s.relogio };
  }

  // ---------- atualização ----------
  function posPrancha() {
    const d = s.x - s.crista, alt = altura(d);
    let y;
    if (s.fase === "remando" || s.fase === "perdeu") y = Y_BASE - alt * 0.16 + Math.sin(s.relogio * 2.4) * 4;
    else y = Y_BASE - (0.06 + 0.8 * s.h) * alt;
    if (s.ar) y -= Math.sin(Math.PI * Math.min(1, s.ar.t / s.ar.dur)) * 150;
    return [s.x, y];
  }
  function atualizar(dt) {
    s.relogio += dt;
    if (s.fase === "remando") {
      const r = s.remo;
      r.t += dt; r.val = Math.max(0, r.val - dt * 0.16);
      s.forca = Math.min(1, r.t / r.dur);
      s.crista = s.x - 110;
      if (r.val >= 1 && r.t >= r.dur * 0.55) dropar();
      else if (r.t >= r.dur * 1.2) perdeuOnda();
    } else if (s.fase === "perdeu") {
      s.forca = Math.max(0, s.forca - dt * 0.8);
      s.crista += dt * 200; // a onda passa por ele
      if ((s.espera -= dt) <= 0) novaOnda();
    } else if (s.fase === "surfando") {
      atualizarSurf(dt);
    } else if (s.fase === "nota") {
      s.forca = Math.max(0, s.forca - dt * 0.5);
      if ((s.espera -= dt) <= 0) { if (s.onda >= REGRAS.ondas) fimJogo(); else novaOnda(); }
    }
    // câmera: ele um pouco à esquerda do meio (dá para ver a parede da onda à frente)
    const alvoCam = s.x - W * (W < 900 ? 0.38 : 0.42);
    s.cam += (alvoCam - s.cam) * Math.min(1, dt * 4);
    for (const a of s.avisos) { a.vida -= dt; a.y -= dt * 60; }
    s.avisos = s.avisos.filter((a) => a.vida > 0);
    for (const g of s.gotas) { g.vy += 900 * dt; g.x += g.vx * dt; g.y += g.vy * dt; g.vida -= dt * 0.9; }
    s.gotas = s.gotas.filter((g) => g.vida > 0 && g.y < Y_BASE + 60);
    // espuma da crista espirrando
    if (s.quebrada && s.forca > 0.5 && Math.random() < dt * 30) gota(s.crista + rnd(-40, 30), Y_BASE - altura(1) + rnd(0, 30), rnd(-160, 20), rnd(-260, -80), rnd(2, 4));
    aplicarPose(dt);
    if (heroi && (s.fase === "remando" || s.fase === "perdeu")) poseRemando(s.relogio);
  }
  function atualizarSurf(dt) {
    const vc = vCrista();
    s.tOnda += dt;
    s.forca = Math.min(1, s.forca + dt * 0.6); // a onda termina de crescer depois do drop
    s.crista += vc * dt;
    s.tuboL += ((secaoEm(s.crista).tipo === "tubular" ? 240 : 90) - s.tuboL) * Math.min(1, dt * 2);
    if (s.caiu) {
      s.caiu.t += dt; s.v *= Math.exp(-dt * 3); s.x += s.v * dt * 0.5;
      if (s.caiu.t > 1.9) fimOnda("caiu");
      return;
    }
    // velocidade volta aos poucos para um pouco menos que a da crista: parado demais, a espuma alcança
    if (s.tubo) s.v += (vc - 70 - s.v) * Math.min(1, dt * 3);
    else s.v += (vc - 45 - s.v) * Math.min(1, dt * 0.45);
    s.v = lim(s.v, vc - 220, vc + 430);
    s.x += s.v * dt;
    s.h += (s.hAlvo - s.h) * Math.min(1, dt * 5);
    const d = s.x - s.crista;
    if (s.manobra) {
      const m = s.manobra;
      m.t += dt;
      if (m.desce && m.t > m.dur * 0.45) { s.hAlvo = 0.45; m.desce = false; }
      if (m.t >= m.dur) { s.manobra = null; poseAlvo = s.segurando ? "agacha" : "base"; if (s.hAlvo < 0.2) s.hAlvo = 0.4; }
    }
    if (s.ar) {
      s.ar.t += dt;
      s.giro = s.ar.gira ? 2 * Math.PI * Math.min(1, s.ar.t / s.ar.dur) : -0.35 * Math.sin(Math.PI * s.ar.t / s.ar.dur);
      if (s.ar.t >= s.ar.dur) {
        const ar = s.ar; s.ar = null; s.giro = 0; s.hAlvo = 0.4; poseAlvo = "base";
        if (ar.cai) caixote("Aterrissou de cara!");
        else { pontuar(ar.gira ? "Aterrissou o 360!" : "Aterrissou!", ar.pts, "#ff8be6"); falar("aereo"); s.festa = s.relogio; espirro(20); }
      }
      return;
    }
    if (s.segurando && !s.tubo && !s.manobra) { if (!tentarTubo()) poseAlvo = "agacha"; }
    if (s.tubo) {
      s.tubo.t += dt;
      if (s.tubo.t > s.tubo.fecha) { caixote("O tubo fechou!"); return; }
      if (d < -s.tuboL * 0.9) { caixote("Ficou lá dentro..."); return; }
    } else if (d < -15) { caixote("A espuma te pegou!"); return; }
    if (d > 1750) { fimOnda("ombro"); return; }
    if (s.tOnda >= REGRAS.segundosOnda) fimOnda("completou");
  }

  // ---------- desenho ----------
  const NUVENS = Array.from({ length: 6 }, (_, i) => ({ x: i * 420 + rnd(0, 200), y: rnd(70, 230), w: rnd(140, 260) }));
  function ceu(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, HORIZ);
    g.addColorStop(0, "#3d8fd6"); g.addColorStop(0.7, "#9ad3f0"); g.addColorStop(1, "#fbe3b5");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HORIZ + 2);
    // sol
    const sx = W * 0.78, sy = 150, gs = ctx.createRadialGradient(sx, sy, 10, sx, sy, 160);
    gs.addColorStop(0, "rgba(255,250,220,1)"); gs.addColorStop(0.25, "rgba(255,236,170,0.9)"); gs.addColorStop(1, "rgba(255,236,170,0)");
    ctx.fillStyle = gs; ctx.beginPath(); ctx.arc(sx, sy, 160, 0, 7); ctx.fill();
    // nuvens (andam devagar, com um pouco de paralaxe da câmera)
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (const n of NUVENS) {
      const x = (((n.x - s.cam * 0.05 + s.relogio * 8) % (W + 600)) + W + 600) % (W + 600) - 300;
      for (const [dx, dy, r] of [[0, 0, 0.28], [0.25, -0.12, 0.3], [0.5, 0, 0.26], [0.72, 0.03, 0.2]]) {
        ctx.beginPath(); ctx.arc(x + dx * n.w, n.y + dy * n.w, r * n.w, 0, 7); ctx.fill();
      }
    }
    // morro ao longe (ilha) e gaivotas
    ctx.fillStyle = "#5b8aa3";
    const mx = ((-s.cam * 0.08) % (W + 900) + W + 900) % (W + 900) - 300;
    ctx.beginPath(); ctx.moveTo(mx, HORIZ); ctx.quadraticCurveTo(mx + 160, HORIZ - 120, mx + 380, HORIZ - 40); ctx.quadraticCurveTo(mx + 480, HORIZ - 70, mx + 620, HORIZ); ctx.fill();
    ctx.strokeStyle = "#2d3e50"; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const gx = ((s.relogio * 40 + i * 260) % (W + 200)) - 100, gy = 120 + i * 40 + Math.sin(s.relogio * 2 + i) * 8, a = 10 + Math.sin(s.relogio * 8 + i) * 4;
      ctx.beginPath(); ctx.moveTo(gx - 14, gy - a * 0.4); ctx.quadraticCurveTo(gx - 6, gy - a, gx, gy); ctx.quadraticCurveTo(gx + 6, gy - a, gx + 14, gy - a * 0.4); ctx.stroke();
    }
  }
  function marAoFundo(ctx) {
    const g = ctx.createLinearGradient(0, HORIZ, 0, Y_BASE);
    g.addColorStop(0, "#2f86b8"); g.addColorStop(1, "#16618c");
    ctx.fillStyle = g; ctx.fillRect(0, HORIZ, W, Y_BASE - HORIZ + 2);
    ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) { // brilhos na água
      const y = HORIZ + 14 + i * i * 5, off = (s.relogio * 12 + i * 97 - s.cam * (0.1 + i * 0.02)) % 180;
      for (let x = -180 + off; x < W; x += 180) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40 + i * 4, y); ctx.stroke(); }
    }
  }
  function parede(ctx) {
    const passo = 8, topo = [];
    for (let sx = -passo; sx <= W + passo; sx += passo) topo.push([sx, Y_BASE - altura(s.cam + sx - s.crista)]);
    // parede verde-azulada (mais clara perto da crista, translúcida)
    const g = ctx.createLinearGradient(0, Y_BASE - HMAX, 0, Y_BASE);
    g.addColorStop(0, "#7fe0d2"); g.addColorStop(0.35, "#2fa6a8"); g.addColorStop(1, "#0d4f73");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-passo, Y_BASE);
    for (const [x, y] of topo) ctx.lineTo(x, y);
    ctx.lineTo(W + passo, Y_BASE); ctx.closePath(); ctx.fill();
    // listras de água correndo na parede
    ctx.save(); ctx.clip();
    ctx.strokeStyle = "rgba(220,255,250,0.22)"; ctx.lineWidth = 3;
    for (const f of [0.28, 0.5, 0.7, 0.86]) {
      ctx.beginPath();
      for (let i = 0; i < topo.length; i++) {
        const [x] = topo[i], alt = Y_BASE - topo[i][1], y = Y_BASE - alt * f + Math.sin((x + s.cam) / 60 + s.relogio * 3 + f * 9) * 3;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
    // beirada da crista
    ctx.strokeStyle = "rgba(240,255,255,0.75)"; ctx.lineWidth = 4;
    ctx.beginPath(); topo.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  }
  function espuma(ctx) {
    if (!s.quebrada || s.forca < 0.05) return;
    const xc = s.crista - s.cam;
    if (xc < -40) { // espuma ocupa toda a tela à esquerda: faixa contínua
    }
    ctx.fillStyle = "#f2fbff";
    ctx.beginPath(); ctx.moveTo(Math.min(xc + 10, W), Y_BASE + 12);
    for (let sx = Math.min(xc + 10, W); sx >= -10; sx -= 10) {
      const d = s.cam + sx - s.crista, alt = altura(Math.min(d, -1));
      const y = Y_BASE - alt - 10 - Math.abs(Math.sin((sx + s.cam) / 37 + s.relogio * 5)) * 18 - Math.abs(Math.sin((sx + s.cam) / 13 - s.relogio * 7)) * 8;
      ctx.lineTo(sx, y);
    }
    ctx.lineTo(-10, Y_BASE + 12); ctx.closePath(); ctx.fill();
    // bolhas/sombra na espuma
    ctx.fillStyle = "rgba(150,200,215,0.45)";
    for (let sx = Math.min(xc, W); sx >= -20; sx -= 23) {
      const d = s.cam + sx - s.crista, alt = altura(Math.min(d, -1));
      const k = Math.sin(sx * 12.9 + Math.floor(s.relogio * 6)) * 0.5 + 0.5;
      ctx.beginPath(); ctx.arc(sx + k * 10, Y_BASE - alt * (0.25 + 0.5 * k), 5 + k * 9, 0, 7); ctx.fill();
    }
  }
  function labio(ctx) { // crista caindo por cima (na seção tubular vira o tubo: ele aparece lá dentro, atrás da água)
    if (!s.quebrada || s.forca < 0.3) return;
    const xc = s.crista - s.cam, L = s.tuboL, topo = Y_BASE - altura(1);
    const g = ctx.createLinearGradient(xc + L, topo, xc, Y_BASE);
    g.addColorStop(0, "rgba(140,235,225,0.92)"); g.addColorStop(0.7, "rgba(200,250,250,0.85)"); g.addColorStop(1, "rgba(250,255,255,0.95)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(xc + L + 20, topo + 2);
    ctx.quadraticCurveTo(xc + L * 0.25, topo - HMAX * 0.28 * s.forca, xc - 14, Y_BASE + 6);
    ctx.lineTo(xc + 30, Y_BASE + 6);
    ctx.quadraticCurveTo(xc + L * 0.5, topo + HMAX * 0.12 * s.forca, xc + L - 10, topo + 12);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(xc + L + 20, topo + 2); ctx.quadraticCurveTo(xc + L * 0.25, topo - HMAX * 0.28 * s.forca, xc - 14, Y_BASE + 6); ctx.stroke();
  }
  function aguaDaFrente(ctx) {
    const g = ctx.createLinearGradient(0, Y_BASE, 0, AREIA);
    g.addColorStop(0, "#1a6c93"); g.addColorStop(0.6, "#3a9fb6"); g.addColorStop(1, "#8fd3cf");
    ctx.fillStyle = g; ctx.fillRect(0, Y_BASE, W, AREIA - Y_BASE + 2);
    ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { // restos de espuma chegando na areia
      const y = Y_BASE + 40 + i * 38 + Math.sin(s.relogio * 0.8 + i) * 8;
      ctx.beginPath();
      for (let x = -10; x <= W + 10; x += 20) { const yy = y + Math.sin((x + s.cam * (0.6 + i * 0.1)) / 45 + i * 2) * 5; if (x < 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
      ctx.stroke();
    }
  }
  function prancha(ctx) {
    ctx.fillStyle = "#fffaf0"; ctx.strokeStyle = "#1c2733"; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-88, 0); ctx.quadraticCurveTo(-90, 10, -70, 12); ctx.lineTo(70, 12); ctx.quadraticCurveTo(100, 8, 96, -4); ctx.quadraticCurveTo(60, 2, -88, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ff5ad8"; ctx.fillRect(-70, 5, 150, 3); // faixa neon
    ctx.fillStyle = "#1c2733"; // quilhas
    ctx.beginPath(); ctx.moveTo(-74, 12); ctx.lineTo(-64, 26); ctx.lineTo(-58, 12); ctx.fill();
  }
  function desenharSurfista(ctx) {
    if (!heroi || s.fase === "intro" || s.fase === "fim") return;
    let [x, y] = posPrancha();
    x -= s.cam;
    // inclinação da prancha acompanha a subida/descida na parede
    if (s.yPrev != null && s.fase === "surfando") {
      const alvo = lim(Math.atan2(y - s.yPrev, Math.max(1, s.v * 0.016)) * 0.8, -0.6, 0.6);
      s.ang += (alvo - s.ang) * 0.2;
    } else s.ang *= 0.9;
    s.yPrev = y;
    ctx.save();
    ctx.translate(x, y);
    if (s.fase === "remando" || s.fase === "perdeu") { // deitado remando
      ctx.save(); ctx.translate(40, 2); prancha(ctx); ctx.restore();
      heroi.definirVista("lado_direito");
      ctx.rotate(Math.PI / 2);
      heroi.desenhar(ctx, -2, 10 - 130 * ESC, ESC);
      ctx.restore();
      return;
    }
    if (s.caiu) { // caixote: ele voa para um lado, a prancha para o outro, e some na espuma
      const t = s.caiu.t;
      ctx.globalAlpha = Math.max(0, 1 - t / 1.2);
      ctx.save(); ctx.translate(-60 * t, -120 * t + 260 * t * t); ctx.rotate(-5 * t); prancha(ctx); ctx.restore();
      ctx.translate(30 * t, -90 * t + 300 * t * t); ctx.rotate(4 * t);
      heroi.definirVista("frente");
      heroi.desenhar(ctx, 0, pesAbaixo * ESC, ESC);
      ctx.restore();
      return;
    }
    ctx.rotate(s.ang + s.giro);
    const m = s.manobra;
    if (m && m.vira && m.t > m.dur * 0.2 && m.t < m.dur * 0.75) ctx.scale(-1, 1); // rasgada: vira para trás
    prancha(ctx);
    heroi.definirVista("frente");
    heroi.desenhar(ctx, 0, pesAbaixo * ESC + 2, ESC);
    ctx.restore();
  }
  function gotas(ctx) {
    ctx.fillStyle = "rgba(245,255,255,0.9)";
    for (const g of s.gotas) { ctx.globalAlpha = Math.max(0, g.vida); ctx.beginPath(); ctx.arc(g.x - s.cam, g.y, g.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  // a turma de costas na areia, olhando o mar (silhuetas), guarda-sol e isopor
  const AMIGOS_X = [0.1, 0.2, 0.32, 0.86];
  function areia(ctx) {
    const g = ctx.createLinearGradient(0, AREIA, 0, H);
    g.addColorStop(0, "#f0dcae"); g.addColorStop(1, "#d6b47a");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, AREIA + 8);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, AREIA + Math.sin(x / 90 + s.relogio * 0.5) * 4);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    // guarda-sol
    const gx = W * 0.94;
    ctx.strokeStyle = "#5a4630"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(gx, H); ctx.lineTo(gx - 20, H - 210); ctx.stroke();
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? "#fff3e0" : "#ff5ad8";
      ctx.beginPath(); ctx.moveTo(gx - 20, H - 230);
      ctx.arc(gx - 20, H - 150, 150, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6); ctx.closePath(); ctx.fill();
    }
    // isopor com latinhas
    const ix = W * 0.26;
    ctx.fillStyle = "#e9f1f5"; ctx.fillRect(ix, H - 78, 90, 56); ctx.fillStyle = "#3a7ab8"; ctx.fillRect(ix - 4, H - 86, 98, 14);
    const pulo = Math.max(0, 1 - (s.relogio - s.festa) / 0.9);
    AMIGOS_X.forEach((fx, i) => {
      const x = W * fx, y = H - 10 - Math.abs(Math.sin((s.relogio - s.festa) * 9 + i)) * 26 * pulo;
      ctx.fillStyle = ["#2a2030", "#3b2a22", "#1f2a36", "#34261f"][i];
      ctx.beginPath(); ctx.ellipse(x, y - 40, 62, 70, 0, Math.PI, 0); ctx.fill();  // ombros
      ctx.fillRect(x - 62, y - 40, 124, 50);
      ctx.beginPath(); ctx.arc(x, y - 128, 36, 0, 7); ctx.fill();                  // cabeça
      if (i === 1) { ctx.fillStyle = "#ff5ad8"; ctx.beginPath(); ctx.arc(x, y - 140, 36, Math.PI, 0); ctx.fill(); ctx.fillRect(x - 52, y - 142, 30, 9); } // boné
      if (pulo > 0.2 && i !== 3) { ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 16; ctx.lineCap = "round"; // braços para cima comemorando
        ctx.beginPath(); ctx.moveTo(x - 50, y - 70); ctx.lineTo(x - 70, y - 160); ctx.moveTo(x + 50, y - 70); ctx.lineTo(x + 70, y - 160); ctx.stroke(); }
    });
    // fala da turma
    if (s.fala && s.relogio - s.fala.t < 2.6) {
      const i = s.fala.quem, x = W * AMIGOS_X[i === 3 ? 3 : i], texto = TURMA[i] + ": " + s.fala.texto;
      ctx.font = "700 30px system-ui, sans-serif";
      const w = ctx.measureText(texto).width + 36, bx = lim(x - w / 2, 12, W - w - 12), by = H - 280;
      ctx.fillStyle = "rgba(255,255,255,0.96)"; ctx.strokeStyle = "#2a2030"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(bx, by, w, 52, 18); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 12, by + 51); ctx.lineTo(x, by + 76); ctx.lineTo(x + 12, by + 51); ctx.fill();
      ctx.fillStyle = "#2a2030"; ctx.fillText(texto, bx + 18, by + 36);
    }
  }
  function texto(ctx, t, x, y, tam, cor, alinhar) {
    ctx.font = `800 ${tam}px system-ui, sans-serif`; ctx.textAlign = alinhar || "center";
    ctx.lineWidth = Math.max(4, tam / 7); ctx.strokeStyle = "rgba(20,10,30,0.85)"; ctx.strokeText(t, x, y);
    ctx.fillStyle = cor || "#fff"; ctx.fillText(t, x, y);
    ctx.textAlign = "left";
  }
  function hud(ctx) {
    const meio = W / 2;
    // textos das manobras empilhados no meio (o mais novo embaixo); somem na hora da nota
    if (s.fase !== "nota") s.avisos.forEach((a, i) => {
      ctx.globalAlpha = Math.min(1, a.vida * 2);
      texto(ctx, a.texto, meio, 470 + a.y - (s.avisos.length - 1 - i) * 54, Math.min(a.tam, W / 14), a.cor);
    });
    ctx.globalAlpha = 1;
    if (s.fase === "intro" || s.fase === "fim") return;
    texto(ctx, `Onda ${Math.min(s.onda + 1, REGRAS.ondas)}/${REGRAS.ondas}`, W - 24, 130, 34, "#fff", "right");
    texto(ctx, s.notas.map((n) => n.toFixed(1)).join("  ·  ") || "", W - 24, 175, 28, "#ffd36b", "right");
    if (s.fase === "remando") {
      const r = s.remo, [x, y] = posPrancha(), bx = lim(x - s.cam - 90, 20, W - 200);
      texto(ctx, Math.floor(s.relogio * 3) % 2 ? "REME! 👆👆👆" : "REME!  👆 👆", meio, 300, 64, "#ffd36b");
      texto(ctx, "toque rápido na tela (ou espaço)", meio, 350, 28, "#fff");
      ctx.fillStyle = "rgba(20,10,30,0.7)"; ctx.fillRect(bx, y - 120, 180, 18);
      ctx.fillStyle = r.val >= 1 ? "#7dff9a" : "#ff5ad8"; ctx.fillRect(bx + 3, y - 117, 174 * Math.min(1, r.val), 12);
    }
    if (s.fase === "surfando") {
      texto(ctx, String(Math.round(s.pontos)), meio, 140, 58, "#fff");
      texto(ctx, `nota ${nota(s.pontos).toFixed(1)}`, meio, 182, 28, "#ffd36b");
      // tempo da onda e velocidade
      const tw = Math.min(420, W - 80), tx = meio - tw / 2;
      ctx.fillStyle = "rgba(20,10,30,0.6)"; ctx.fillRect(tx, 200, tw, 10);
      ctx.fillStyle = "#9ff3ff"; ctx.fillRect(tx, 200, tw * Math.max(0, 1 - s.tOnda / REGRAS.segundosOnda), 10);
      const d = s.x - s.crista;
      if (secaoEm(s.crista).tipo === "tubular" && d < 420 && !s.tubo && !s.caiu) texto(ctx, "🌀 Seção tubular! SEGURE para entrar no tubo", meio, 255, 30, "#9ff3ff");
      else if (d < 80 && !s.tubo && !s.caiu) texto(ctx, "⚠️ A espuma tá chegando! ↓ cavada", meio, 255, 30, "#ff8b8b");
      else if (d > 1300 && !s.caiu) texto(ctx, "Longe demais da crista: ← rasgada", meio, 255, 30, "#ffd36b");
      if (s.tubo) texto(ctx, `TUBO ${s.tubo.t.toFixed(1)}s — solte para sair!`, meio, 255, 34, "#9ff3ff");
      // legenda dos controles
      const leg = ["↓ cavada", "↑ batida / aéreo", "← rasgada", "→ bombear", "segurar = tubo"];
      ctx.font = "600 22px system-ui, sans-serif"; ctx.fillStyle = "rgba(20,10,30,0.55)";
      const lw = Math.min(W - 24, 760); ctx.beginPath(); ctx.roundRect(meio - lw / 2, AREIA - 48, lw, 36, 12); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText(W < 760 ? "↓ cavada · ↑ batida · ← rasgada · segurar = tubo" : leg.join("  ·  "), meio, AREIA - 23); ctx.textAlign = "left";
    }
    if (s.fase === "perdeu") texto(ctx, "Vem outra...", meio, 330, 40, "#fff");
    if (s.fase === "nota") {
      ctx.fillStyle = "rgba(20,10,30,0.7)"; ctx.beginPath(); ctx.roundRect(meio - 230, 230, 460, 190, 24); ctx.fill();
      const m = { caiu: "Caiu! (vale 75%)", completou: "Completou a onda", ombro: "A onda perdeu força" }[s.motivo] || "";
      texto(ctx, "Nota dos juízes", meio, 285, 32, "#fff");
      texto(ctx, s.ultimaNota.toFixed(1), meio, 370, 84, s.ultimaNota >= 8 ? "#7dff9a" : s.ultimaNota >= 5 ? "#ffd36b" : "#ff8b8b");
      texto(ctx, m, meio, 410, 24, "#c9b8ee");
    }
  }
  function desenhar(ctx, agora) {
    W = NSF.CONFIG.larguraBase;
    const dt = Math.min(0.05, Math.max(0, (agora - (desenhar.ultimo || agora)) / 1000));
    desenhar.ultimo = agora;
    atualizar(dt);
    ceu(ctx); marAoFundo(ctx); parede(ctx);
    const noTubo = !!s.tubo || (s.x - s.crista < s.tuboL && s.x - s.crista > -20 && s.tuboL > 150);
    if (noTubo) { desenharSurfista(ctx); labio(ctx); } else { labio(ctx); desenharSurfista(ctx); }
    espuma(ctx); aguaDaFrente(ctx); gotas(ctx); areia(ctx); hud(ctx);
    // som do mar assim que o navegador liberar o áudio
    if (A() && !desenhar.mar && A().estado().contexto === "running") { A().mar(true); desenhar.mar = true; }
  }

  // ---------- controles ----------
  const tela = doc.getElementById("tela");
  let toque = null;
  tela.addEventListener("pointerdown", (e) => {
    toque = { x: e.clientX, y: e.clientY, t: performance.now(), usado: false, id: e.pointerId };
    if (s.fase === "remando") { executar("remar"); toque.usado = true; return; }
    toque.relogio = setTimeout(() => { if (toque && !toque.usado) { toque.usado = "segurar"; executar("segurar"); } }, 260);
  });
  tela.addEventListener("pointermove", (e) => {
    if (!toque || toque.usado) return;
    const dx = e.clientX - toque.x, dy = e.clientY - toque.y, dist = Math.hypot(dx, dy);
    if (dist < 34) return;
    clearTimeout(toque.relogio); toque.usado = true;
    executar(Math.abs(dy) > Math.abs(dx) ? (dy > 0 ? "cavada" : "cima") : (dx < 0 ? "rasgada" : "bombear"));
  });
  const soltar = () => { if (!toque) return; clearTimeout(toque.relogio); if (toque.usado === "segurar") executar("soltar"); toque = null; };
  tela.addEventListener("pointerup", soltar);
  tela.addEventListener("pointercancel", soltar);
  const TECLAS = { ArrowDown: "cavada", ArrowUp: "cima", ArrowLeft: "rasgada", ArrowRight: "bombear", s: "cavada", w: "cima", a: "rasgada", d: "bombear" };
  global.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (e.repeat) return; executar(s.fase === "remando" ? "remar" : "segurar"); return; }
    if (TECLAS[e.key] && !e.repeat) { e.preventDefault(); executar(s.fase === "remando" ? "remar" : TECLAS[e.key]); }
  });
  global.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") executar("soltar"); });

  // ---------- telas de começo e fim ----------
  const caixa = doc.getElementById("caixa");
  function mostrarInicio() {
    caixa.innerHTML = "";
    const h = doc.createElement("h1"); h.textContent = "🏄 Surf na praia";
    const p = doc.createElement("p"); p.textContent = "3 ondas. A nota final é a soma das 2 melhores. Perto da espuma vale mais; repetir manobra vale menos.";
    const ul = doc.createElement("ul");
    for (const t of ["Toques rápidos: remar até pegar a onda", "Deslize ↓ cavada (ganha velocidade)", "Deslize ↑ batida (com muita velocidade: aéreo!)",
      "Deslize ← rasgada · → bombear", "Segure o dedo na seção tubular: TUBO (solte para sair)"]) { const li = doc.createElement("li"); li.textContent = t; ul.appendChild(li); }
    const b = doc.createElement("button"); b.type = "button"; b.textContent = "Bora surfar!";
    b.addEventListener("click", () => { caixa.hidden = true; s.onda = 0; s.notas = []; novaOnda(); });
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
    b.addEventListener("click", () => { caixa.hidden = true; s.onda = 0; s.notas = []; novaOnda(); });
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
  // celular em pé: sugere deitar (uma vez por visita)
  (function avisoDeitar() {
    const toqueTela = global.matchMedia && global.matchMedia("(pointer: coarse)").matches;
    let visto = false;
    try { visto = global.sessionStorage.getItem("nsf_aviso_deitar") === "1"; } catch (e) { /* ok */ }
    if (!toqueTela || visto || global.innerWidth > global.innerHeight || params.has("test")) return;
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
  carregarHeroi().catch((e) => NSF.estado.erros.push(String(e)));
  NSF.iniciar(tela, desenhar, { adaptar: true });
  global.NSF_SURF.desenhar = desenhar;
  if (params.has("direto")) { caixa.hidden = true; novaOnda(); } else mostrarInicio();
})(typeof window !== "undefined" ? window : globalThis);
