/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   TREINO DE PÊNALTI (novo)
   Visão de trás do batedor, estádio com torcida, goleiro que mergulha.
   1) MIRA: clique/toque no ponto do gol (ou setas + Espaço)
   2) FORÇA: a barra sobe e desce — pare no VERDE (Espaço/clique)
   Série de 5 cobranças, com placar, recorde e prêmio.
   A habilidade Chute deixa a batida mais precisa (e treina a cada chute).
   Substitui abrirPenalti() do ui.js. Carregar depois de ui.js.
   ============================================================ */
const PN = { W: 640, H: 400, gol: { x1: 190, x2: 450, y1: 108, y2: 218 }, spot: { x: 320, y: 336 }, serie: 5 };

function abrirPenalti() {
  const s = G.save;
  const cv = el('canvas', { id: 'cvPenalti', width: PN.W, height: PN.H });
  const ctx = cv.getContext('2d');
  const passo = el('p', { class: 'pn-passo' });
  const placar = el('div', { class: 'pn-placar' });
  const acoes = el('div', { class: 'opcoes pn-acoes' });
  const goleiroLook = { tipo: 'humano', corpo: 'm', pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#2ad96a', baixo: 'baixo-shorts' };
  preCarrega(goleiroLook);
  const eu = lookJogador();
  // torcida (desenhada uma vez): arquibancada com pontinhos coloridos
  const torcida = mkCanvas(PN.W, 100); { const x = torcida.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 100); g.addColorStop(0, '#1d1242'); g.addColorStop(1, '#3d2a80'); x.fillStyle = g; x.fillRect(0, 0, PN.W, 100);
    const cores = ['#ff5a4d', '#ffd60a', '#ffffff', '#4f82ff', '#06d6a0', '#ff8ccb', '#ffb86f'];
    for (let fil = 0; fil < 7; fil++) for (let i = 0; i < 70; i++) { x.fillStyle = cores[(i * 7 + fil * 3) % cores.length]; x.globalAlpha = 0.55 + ((i * 13 + fil) % 5) / 12; x.beginPath(); x.arc(i * 9.3 + (fil % 2) * 4 + 3, 8 + fil * 11, 3.4, 0, 7); x.fill(); }
    x.globalAlpha = 1; }

  let rodada = 0, gols = 0; const marcas = []; // 'gol' | 'perdeu'
  let fase = 'mira', mira = { x: 320, y: 160 }, forca = 0, forcaDir = 1, forcaT = 0;
  let lance = null, raf = null, vib = 0, ult = performance.now();
  const recorde = () => (s.st.recordePenalti || 0);

  function atualizaTextos() {
    placar.innerHTML = '';
    placar.append(el('span', {}, `Cobrança ${Math.min(rodada + 1, PN.serie)} de ${PN.serie}`), el('span', { class: 'pn-bolas' }, ...Array.from({ length: PN.serie }, (_, i) => el('i', { class: 'pn-bola ' + (marcas[i] || '') }))), el('span', {}, `Recorde: ${recorde()}/${PN.serie}`));
    passo.textContent = fase === 'mira' ? '① Clique (ou toque) no ponto do gol onde quer chutar. No teclado: setas + ESPAÇO.'
      : fase === 'forca' ? '② Agora a FORÇA: aperte ESPAÇO (ou clique) com a barra no VERDE!'
      : fase === 'fim' ? '' : '...';
  }

  // ---------- desenho ----------
  function persp(y) { return 1 + (y - PN.gol.y2) / 260; } // coisas mais perto da câmera ficam maiores
  function desenhaCampo(t) {
    ctx.drawImage(torcida, 0, vib ? Math.sin(t / 60) * 2 : 0);
    // placas de propaganda
    const cores = ['#e60000', '#ffd60a', '#2b1b5e', '#06d6a0'];
    for (let i = 0; i < 4; i++) { ctx.fillStyle = cores[i % 4]; ctx.fillRect(i * 160, 86, 160, 14); }
    ctx.font = '800 10.5px Nunito, sans-serif'; ctx.textAlign = 'center';
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i === 1 ? '#2b1b5e' : '#fff'; ctx.fillText(i % 2 ? 'EDUCAÇÃO GAMER' : 'LENDA DO CAMPINHO', i * 160 + 80, 97); }
    // gramado com faixas (perspectiva)
    for (let i = 0; i < 12; i++) { const y0 = 100 + i * i * 2.2, y1 = 100 + (i + 1) * (i + 1) * 2.2; ctx.fillStyle = i % 2 ? '#48b052' : '#3fa34a'; ctx.fillRect(0, y0, PN.W, y1 - y0 + 1); }
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5;
    // linha do gol, pequena área e grande área em perspectiva
    ctx.beginPath(); ctx.moveTo(0, PN.gol.y2); ctx.lineTo(PN.W, PN.gol.y2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(160, PN.gol.y2); ctx.lineTo(140, 256); ctx.lineTo(500, 256); ctx.lineTo(480, PN.gol.y2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(90, PN.gol.y2); ctx.lineTo(28, 318); ctx.lineTo(612, 318); ctx.lineTo(550, PN.gol.y2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(PN.spot.x, 318, 60, 16, 0, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(PN.spot.x, PN.spot.y + 6, 5, 2.5, 0, 0, 7); ctx.fill();
  }
  function desenhaGol(t) {
    const { x1, x2, y1, y2 } = PN.gol; const fundo = 16; // profundidade da rede
    const rip = lance && lance.rede ? lance.rede : null;
    const bojo = (x, y) => { if (!rip) return 0; const k = (t - rip.t0) / 700; if (k < 0 || k > 1) return 0; const d = Math.hypot(x - rip.x, y - rip.y); return Math.exp(-d * d / 1800) * 14 * Math.sin(k * Math.PI) * (1 - k * 0.5); };
    ctx.fillStyle = 'rgba(20,40,20,0.35)'; ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    ctx.strokeStyle = 'rgba(240,245,255,0.55)'; ctx.lineWidth = 1;
    for (let x = x1 + 8; x < x2; x += 10) { ctx.beginPath(); for (let y = y1 + 4; y <= y2; y += 6) { const b = bojo(x, y); const px = x + (x - 320) * b * 0.02, py = y - b * 0.6; y === y1 + 4 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.stroke(); }
    for (let y = y1 + 8; y < y2; y += 10) { ctx.beginPath(); for (let x = x1 + 2; x <= x2 - 2; x += 6) { const b = bojo(x, y); const px = x, py = y - b * 0.9; x === x1 + 2 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.stroke(); }
    // laterais da rede
    ctx.fillStyle = 'rgba(240,245,255,0.18)'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + fundo, y1 - 8); ctx.lineTo(x1 + fundo, y2 - 6); ctx.lineTo(x1, y2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x2, y1); ctx.lineTo(x2 - fundo, y1 - 8); ctx.lineTo(x2 - fundo, y2 - 6); ctx.lineTo(x2, y2); ctx.fill();
    // traves (com tremida quando a bola bate)
    const tr = lance && lance.trave && t - lance.trave < 400 ? Math.sin((t - lance.trave) / 20) * 2 * (1 - (t - lance.trave) / 400) : 0;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#9aa0b0'; ctx.lineWidth = 1.5;
    ctx.fillRect(x1 - 7 + tr, y1 - 7, 7, y2 - y1 + 7); ctx.strokeRect(x1 - 7 + tr, y1 - 7, 7, y2 - y1 + 7);
    ctx.fillRect(x2 + tr, y1 - 7, 7, y2 - y1 + 7); ctx.strokeRect(x2 + tr, y1 - 7, 7, y2 - y1 + 7);
    ctx.fillRect(x1 - 7, y1 - 7 + tr, x2 - x1 + 14, 7); ctx.strokeRect(x1 - 7, y1 - 7 + tr, x2 - x1 + 14, 7);
  }
  function desenhaGoleiro(t) {
    const spr = spriteBoneco(goleiroLook, 'frente', 0); if (!spr) return;
    const h = 104, w = h * spr.c.width / spr.c.height;
    let x = 320 + Math.sin(t / 260) * 10, y = PN.gol.y2, rot = 0; // balançando esperando
    if (lance && lance.pulo) {
      const k = clamp((t - lance.pulo.t0) / lance.pulo.dur, 0, 1); const e = 1 - Math.pow(1 - k, 3);
      x = lance.pulo.x0 + (lance.pulo.x - lance.pulo.x0) * e; y = PN.gol.y2 - Math.sin(e * Math.PI * 0.9) * lance.pulo.alto - (lance.pulo.y < 170 ? e * 30 : 0);
      rot = lance.pulo.lado * e * (Math.abs(lance.pulo.x - 320) > 40 ? 1.25 : 0.2);
    }
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, PN.gol.y2, 26, 6, 0, 0, 7); ctx.fill();
    ctx.translate(x, y - h * 0.45); ctx.rotate(rot); ctx.drawImage(spr.c, -w / 2, -h * 0.55, w, h);
    // luvas
    ctx.fillStyle = '#ffd60a'; ctx.strokeStyle = '#3d2b3a'; ctx.lineWidth = 2;
    for (const lx of [-w * 0.42, w * 0.42]) { ctx.beginPath(); ctx.arc(lx, -h * 0.08, 7, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  function desenhaBatedor(t) {
    const q = lance && lance.corrida ? Math.floor((t - lance.t0) / 110) % 4 : 0;
    const spr = spriteBoneco(eu, 'costas', lance && t - lance.t0 < 520 ? q : 0); if (!spr) return;
    const h = 170, w = h * spr.c.width / spr.c.height;
    let x = 268, y = PN.H + 30;
    if (lance) { const k = clamp((t - lance.t0) / 520, 0, 1); x = 268 + (300 - 268) * k; y = PN.H + 30 - 26 * k; }
    ctx.drawImage(spr.c, x - w / 2, y - h, w, h);
  }
  function posBola(t) {
    if (!lance || t < lance.t0 + 500) return { x: PN.spot.x, y: PN.spot.y, r: 11, sombra: PN.spot.y + 6 };
    const k = (t - lance.t0 - 500) / lance.voo;
    const { fx, fy } = lance;
    if (k <= 1) { const x = PN.spot.x + (fx - PN.spot.x) * k; const chao = PN.spot.y + (PN.gol.y2 - PN.spot.y) * k + 6; const y = PN.spot.y + (fy - PN.spot.y) * k - Math.sin(k * Math.PI) * lance.arco; return { x, y, r: 11 - 5.5 * k, sombra: chao, giro: k * 12 }; }
    const k2 = Math.min(k - 1, 1.2);
    if (lance.res === 'defesa') return { x: fx + lance.rebote.x * k2, y: fy + lance.rebote.y * k2 + k2 * k2 * 60, r: 5.5 + k2 * 2, sombra: PN.gol.y2 + 20 + k2 * 60, giro: 12 + k2 * 10 };
    if (lance.res === 'trave') return { x: fx + lance.rebote.x * k2, y: fy + lance.rebote.y * k2 + k2 * k2 * 90, r: 5.5 + k2 * 3, sombra: PN.gol.y2 + k2 * 90, giro: 12 - k2 * 10 };
    if (lance.res === 'fora') return { x: fx + (fx - PN.spot.x) * k2 * 0.4, y: fy - k2 * 70, r: Math.max(2, 5.5 - k2 * 3), sombra: null, giro: 12 + k2 * 8 };
    return { x: fx, y: Math.min(PN.gol.y2 - 4, fy + k2 * k2 * 40), r: 5.5, sombra: PN.gol.y2 - 2, giro: 12 }; // gol: cai dentro da rede
  }
  function desenhaBolaPn(t) {
    const b = posBola(t);
    if (b.sombra != null) { ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(b.x, b.sombra, b.r * 0.9, b.r * 0.35, 0, 0, 7); ctx.fill(); }
    desenhaBola(ctx, b.x, b.y, b.r, b.giro || 0); // a bola do jogo (arte.js)
  }
  function desenhaMira(t) {
    if (fase !== 'mira' && fase !== 'forca') return;
    const pul = fase === 'mira' ? 1 + Math.sin(t / 150) * 0.12 : 1;
    ctx.save(); ctx.translate(mira.x, mira.y);
    const traca = (cor, lw) => { ctx.strokeStyle = cor; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(0, 0, 16 * pul, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-9, 0); ctx.moveTo(9, 0); ctx.lineTo(26, 0); ctx.moveTo(0, -26); ctx.lineTo(0, -9); ctx.moveTo(0, 9); ctx.lineTo(0, 26); ctx.stroke(); };
    traca('#ffffff', 7); traca(fase === 'forca' ? '#ffb000' : '#ff2a2a', 3.5);
    ctx.fillStyle = fase === 'forca' ? '#ffb000' : '#ff2a2a'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 7); ctx.fill(); ctx.restore();
  }
  function desenhaForca() {
    if (fase !== 'forca') return;
    const x = 596, y0 = 330, h = 190, w = 22;
    ctx.fillStyle = 'rgba(20,10,40,0.75)'; ctx.fillRect(x - 6, y0 - h - 26, w + 12, h + 34);
    const zona = (a, b, c) => { ctx.fillStyle = c; ctx.fillRect(x, y0 - h * b, w, h * (b - a)); };
    zona(0, 0.45, '#e8a03a'); zona(0.45, 0.55, '#d8d05a'); zona(0.55, 0.85, '#3ad86a'); zona(0.85, 1, '#e8403a');
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x, y0 - h, w, h);
    const yy = y0 - h * forca; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - 8, yy); ctx.lineTo(x - 2, yy - 6); ctx.lineTo(x - 2, yy + 6); ctx.fill(); ctx.fillRect(x - 2, yy - 2, w + 4, 4);
    ctx.font = '800 12px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('FORÇA', x + w / 2, y0 - h - 10);
  }
  function desenhaTexto(t) {
    if (!lance || !lance.txt || t < lance.t0 + 500 + lance.voo) return;
    const k = Math.min(1, (t - lance.t0 - 500 - lance.voo) / 250);
    ctx.save(); ctx.translate(320, 70); ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
    ctx.font = "700 52px Fredoka, 'Trebuchet MS', sans-serif"; ctx.textAlign = 'center'; ctx.lineWidth = 8; ctx.strokeStyle = '#1d1242'; ctx.strokeText(lance.txt, 0, 0); ctx.fillStyle = lance.cor; ctx.fillText(lance.txt, 0, 0);
    if (lance.sub) { ctx.font = "700 20px Fredoka, sans-serif"; ctx.lineWidth = 5; ctx.strokeText(lance.sub, 0, 30); ctx.fillStyle = '#fff'; ctx.fillText(lance.sub, 0, 30); }
    ctx.restore();
    if (lance.res === 'gol') for (let i = 0; i < 26; i++) { const a = i * 2.4 + (t - lance.t0) / 900, r = ((t - lance.t0 - 500 - lance.voo) / 4 + i * 9) % 260; ctx.fillStyle = ['#ffd60a', '#ff5a4d', '#06d6a0', '#4f82ff', '#fff'][i % 5]; ctx.fillRect(320 + Math.cos(a) * r, 150 + Math.sin(a) * r * 0.6, 6, 3); }
  }
  function quadro(t) {
    const dt = Math.min(50, t - ult); ult = t;
    if (fase === 'forca') { forca += forcaDir * dt / 900; if (forca > 1) { forca = 1; forcaDir = -1; } if (forca < 0) { forca = 0; forcaDir = 1; } }
    if (fase === 'mira') { const vx = (teclas.r ? 1 : 0) - (teclas.l ? 1 : 0), vy = (teclas.d ? 1 : 0) - (teclas.u ? 1 : 0); if (vx || vy) { mira.x = clamp(mira.x + vx * dt * 0.28, PN.gol.x1 - 30, PN.gol.x2 + 30); mira.y = clamp(mira.y + vy * dt * 0.22, PN.gol.y1 - 25, PN.gol.y2 - 6); } }
    ctx.clearRect(0, 0, PN.W, PN.H);
    desenhaCampo(t); desenhaGol(t);
    const bolaAtras = lance && t > lance.t0 + 500 + lance.voo * 0.8 && lance.res !== 'defesa';
    if (bolaAtras) desenhaBolaPn(t);
    desenhaGoleiro(t);
    if (!bolaAtras) desenhaBolaPn(t);
    desenhaBatedor(t); desenhaMira(t); desenhaForca(); desenhaTexto(t);
    raf = requestAnimationFrame(quadro);
  }

  // ---------- controles ----------
  const teclas = {};
  function pontoDoEvento(ev) { const r = cv.getBoundingClientRect(); const p = ev.touches ? ev.touches[0] || ev.changedTouches[0] : ev; return { x: (p.clientX - r.left) * PN.W / r.width, y: (p.clientY - r.top) * PN.H / r.height }; }
  function acao(p) {
    if (fase === 'mira') {
      if (p) { mira.x = clamp(p.x, PN.gol.x1 - 30, PN.gol.x2 + 30); mira.y = clamp(p.y, PN.gol.y1 - 25, PN.gol.y2 - 6); }
      fase = 'forca'; forca = 0; forcaDir = 1; som('toque'); atualizaTextos();
    } else if (fase === 'forca') chutar();
  }
  cv.addEventListener('mousemove', ev => { if (fase === 'mira') { const p = pontoDoEvento(ev); mira.x = clamp(p.x, PN.gol.x1 - 30, PN.gol.x2 + 30); mira.y = clamp(p.y, PN.gol.y1 - 25, PN.gol.y2 - 6); } });
  cv.addEventListener('click', ev => acao(fase === 'mira' ? pontoDoEvento(ev) : null));
  cv.addEventListener('touchstart', ev => { ev.preventDefault(); acao(fase === 'mira' ? pontoDoEvento(ev) : null); }, { passive: false });
  window.teclaModal = ev => {
    const k = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd' }[ev.key];
    if (k) { ev.preventDefault(); teclas[k] = true; setTimeout(() => { teclas[k] = false; }, 120); return; }
    if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); acao(null); }
  };

  // ---------- o chute ----------
  function chutar() {
    const st = stats(); const t = performance.now();
    treinaSkill('chute', 4); som('chute');
    const erro = Math.max(4, 34 - st.chute * 0.5);
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    const forte = Math.max(0, forca - 0.85), fraco = forca < 0.45;
    let fx = mira.x + gauss() * erro, fy = mira.y + gauss() * erro - forte * 260 + (fraco ? 6 : 0);
    const { x1, x2, y1, y2 } = PN.gol;
    const naTrave = (Math.abs(fx - x1 + 3) < 5 || Math.abs(fx - x2 - 3) < 5) && fy > y1 - 7 && fy < y2 || (Math.abs(fy - y1 + 3) < 5 && fx > x1 - 7 && fx < x2 + 7);
    const dentro = fx > x1 + 2 && fx < x2 - 2 && fy > y1 + 2 && fy < y2;
    // goleiro: tenta adivinhar o canto (chute fraco é mais fácil de ler)
    const adivinha = Math.random() < clamp(0.42 - st.chute * 0.0035 + (fraco ? 0.25 : 0), 0.12, 0.72);
    const lado = fx < 320 ? -1 : 1;
    const alvoX = adivinha ? clamp(fx, 320 - 150, 320 + 150) : (Math.random() < 0.2 ? 320 : 320 - lado * rnd(70, 140));
    const alvoY = adivinha ? clamp(fy, 125, 210) : 200;
    let alcance = 50 + (fraco ? 22 : 0); if (Math.abs(fx - 320) > 100 && fy < 138) alcance *= 0.5; // no ângulo: quase indefensável
    const defende = dentro && Math.hypot(fx - alvoX, (fy - alvoY) * 1.2) < alcance;
    const angulo = dentro && !defende && Math.abs(fx - 320) > 100 && fy < 140;
    let res, txt, cor, sub = null;
    if (naTrave) { res = 'trave'; txt = 'NA TRAVE!'; cor = '#ffb03a'; }
    else if (!dentro) { res = 'fora'; txt = fy < y1 ? 'POR CIMA!' : 'PRA FORA!'; cor = '#ff8a5a'; }
    else if (defende) { res = 'defesa'; txt = 'DEFENDEU!'; cor = '#8ae8ff'; }
    else { res = 'gol'; txt = angulo ? 'NO ÂNGULO!' : 'GOOOL!'; cor = angulo ? '#ff8ccb' : '#ffd60a'; if (angulo) sub = 'Golaço!'; }
    if (fraco && res === 'defesa') sub = 'Chute fraquinho...';
    if (forte > 0 && res === 'fora') sub = 'Força demais!';
    const voo = 480 - forca * 160;
    lance = { t0: t, fx, fy, voo, arco: 18 + forca * 18, res, txt, cor, sub, corrida: true,
      pulo: { t0: t + 540, dur: 420, x0: 320, x: alvoX, y: alvoY, lado: alvoX < 320 ? -1 : alvoX > 320 ? 1 : 0, alto: alvoY < 170 ? 40 : 14 },
      rebote: res === 'defesa' ? { x: (fx - 320) * 0.9 + rnd(-40, 40), y: 70 } : res === 'trave' ? { x: fx < 320 ? -60 : 60, y: 40 } : null };
    fase = 'voo'; atualizaTextos();
    const fimVoo = 500 + voo;
    setTimeout(() => {
      if (res === 'gol') { lance.rede = { x: fx, y: fy, t0: performance.now() }; vib = 1; som('gol'); gols++; s.st.gols++; contaEvento('gols'); marcas[rodada] = 'gol'; }
      else { marcas[rodada] = 'perdeu'; if (res === 'trave') { lance.trave = performance.now(); som('erro'); } else som(res === 'defesa' ? 'toque' : 'erro'); }
      atualizaTextos();
    }, fimVoo);
    setTimeout(() => { vib = 0; rodada++; if (rodada >= PN.serie) fimSerie(); else { lance = null; fase = 'mira'; mira = { x: 320, y: 160 }; atualizaTextos(); } }, fimVoo + 1500);
  }
  function fimSerie() {
    fase = 'fim';
    const novoRec = gols > recorde(); if (novoRec) s.st.recordePenalti = gols;
    const ouro = gols * 2 + (gols === PN.serie ? 15 : 0); s.ouro += ouro;
    if (s.nivel < 12 && gols) ganhaXp(gols * 3);
    const frase = gols === 5 ? 'PERFEITO! Cinco de cinco!' : gols >= 4 ? 'Muito bem, craque!' : gols >= 2 ? 'Boa! Dá pra melhorar.' : 'Treino é assim mesmo. Tenta de novo!';
    log(`⚽ Série de pênaltis: ${gols}/${PN.serie} gols. ${frase}${ouro ? ` Ganhou ${ouro} tostões.` : ''}${novoRec ? ' NOVO RECORDE!' : ''}`, gols >= 4 ? 'l-lvl' : 'l-info');
    if (novoRec && gols >= 3) som('nivel');
    atualizaTextos(); // placar com o recorde novo
    passo.textContent = `${frase} ${gols}/${PN.serie} gols${ouro ? ` · +${ouro} tostões` : ''}${novoRec ? ' · NOVO RECORDE!' : ''}`;
    acoes.innerHTML = ''; acoes.append(el('button', { class: 'btn amarelo', type: 'button', onclick: () => { rodada = 0; gols = 0; marcas.length = 0; lance = null; fase = 'mira'; mira = { x: 320, y: 160 }; acoes.innerHTML = ''; atualizaTextos(); } }, 'Jogar outra série'), el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Sair'));
    G.uiSujo = true; salvar();
  }

  atualizaTextos();
  raf = requestAnimationFrame(quadro);
  window.pararPenalti = () => { cancelAnimationFrame(raf); window.pararPenalti = null; window.teclaModal = null; };
  window._pnDesenha = quadro; // (para testes)
  abreModal.largo = true;
  abreModal(el('h2', {}, '⚽ Treino de pênalti'), el('div', { class: 'penalti-wrap pn-novo' }, placar, cv, passo, acoes), el('p', { class: 'vazio' }, 'Cada chute treina a habilidade Chute: quanto maior, mais precisa a batida. Cantos de cima (no ângulo) são quase indefensáveis!'));
}

(function () {
  const st = document.createElement('style');
  st.textContent = `
  .pn-novo { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .pn-novo canvas { width: 100%; max-width: 640px; height: auto; border-radius: 12px; border: 3px solid var(--madeira2, #5e2f14); cursor: crosshair; touch-action: none; background: #1d1242; }
  .pn-placar { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 640px; font-weight: 800; font-size: 14px; color: var(--madeira2, #5e2f14); }
  .pn-bolas { display: flex; gap: 6px; }
  .pn-bola { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #5e2f14; background: #efe3c8; display: inline-block; }
  .pn-bola.gol { background: #3ad86a; } .pn-bola.perdeu { background: #e8403a; }
  .pn-passo { text-align: center; font-size: 16px; font-weight: 800; margin: 2px 0; min-height: 22px; }
  .pn-acoes:empty { display: none; }
  `;
  document.head.append(st);
})();
