// Jocelino — vida.js — o mapa não fica parado (como o Stardew): vento que vai e volta com rajadas, árvores e arbustos
// balançando, folhas voando nas rajadas, rolinhas pousadas na grama que bicam o chão e voam quando o Jocelino chega
// perto, e um bando de pássaros cruzando o céu de vez em quando (com a sombra passando no chão). Só fora de casa.
// Tudo é desenhado por código no traço da arte (contorno escuro), sem arte nova.

const VIDA = { t: 0, vento: 0.5, rajada: 0, proxRajada: 12, bandos: [], folhas: [], rolinhas: [], proxBando: 20, mapaId: '' };
// Quanto cada coisa balança (inclinação no topo; a base fica presa no chão).
const BALANCO = { 'objetos/arvore': 0.022, 'objetos/coqueiro': 0.032, 'objetos/arvore_mata': 0.02, 'objetos/jabuticabeira': 0.018,
  'objetos/mangueira': 0.018, 'objetos/palmeira_jucara': 0.03, 'objetos/arbusto_1': 0.016, 'objetos/arbusto_2': 0.016, 'objetos/arbusto_3': 0.016 };
function balanco(o, t = VIDA.t) {
  const amp = BALANCO[o.nome];
  if (!amp || (G.mapa && G.mapa.dentro)) return 0;
  const f = o.x * 0.013 + o.y * 0.007;
  return (Math.sin(t * 1.3 + f) + 0.35 * Math.sin(t * 2.9 + f * 2)) * amp * (0.45 + VIDA.vento);
}

const COR_FOLHA = ['#d9822b', '#c4561f', '#e0b13a', '#7fa83f', '#a8742a'];
function _rolinhasDoMapa(m) {
  const r = [], rng = mulberry(G.dia * 131 + m.larg * 7 + m.alt);
  for (let k = 0; k < 40 && r.length < 4; k++) {
    const x = m.livre.x + Math.floor(rng() * m.livre.w), y = m.livre.y + Math.floor(rng() * m.livre.h);
    if (m.chaoEm(x, y) !== CH.GRAMA || m.ocupado.has(chaveT(x, y)) || m.saidaEm(x, y)) continue;
    r.push({ x: (x + 0.5) * TILE + (rng() - 0.5) * 20, y: (y + 0.7) * TILE, lado: rng() < 0.5 ? -1 : 1, bica: rng() * 3, pulo: 0, voando: false, vx: 0, vy: 0, z: 0, t: rng() * 10 });
  }
  return r;
}
function vidaAtualiza(dt) {
  const m = G.mapa;
  if (!m) return;
  VIDA.t += dt;
  // Vento: sobe e desce devagar; de tempos em tempos uma rajada.
  VIDA.proxRajada -= dt;
  if (VIDA.proxRajada <= 0) { VIDA.rajada = 4; VIDA.proxRajada = rnd(18, 35); }
  VIDA.rajada = Math.max(0, VIDA.rajada - dt);
  VIDA.vento = 0.45 + 0.25 * Math.sin(VIDA.t * 0.11) + (VIDA.rajada > 0 ? 0.6 * Math.sin(Math.PI * VIDA.rajada / 4) : 0);
  if (m.dentro || m.cenario) { VIDA.folhas.length = 0; VIDA.bandos.length = 0; return; }
  if (VIDA.mapaId !== m.id) { VIDA.mapaId = m.id; VIDA.rolinhas = _rolinhasDoMapa(m); VIDA.folhas.length = 0; VIDA.bandos.length = 0; }
  const vw = G.larg / G.zoom, vh = G.alt / G.zoom, cx = G.cam.x, cy = G.cam.y;
  // Folhas: nascem do lado esquerdo da tela durante a rajada e atravessam rodopiando.
  if (VIDA.rajada > 0 && Math.random() < dt * 9) VIDA.folhas.push({ x: cx - 20, y: cy + rnd(0, vh), vx: rnd(150, 230), f: rnd(0, 6), giro: rnd(-5, 5), ang: rnd(0, 6), cor: sorteio(COR_FOLHA) });
  for (const f of VIDA.folhas) { f.f += dt; f.x += f.vx * dt; f.y += Math.sin(f.f * 3) * 40 * dt + 12 * dt; f.ang += f.giro * dt; }
  VIDA.folhas = VIDA.folhas.filter(f => f.x < cx + vw + 30);
  // Bando: de tempos em tempos 3 a 6 pássaros cruzam a tela, um pouco em V.
  VIDA.proxBando -= dt;
  if (VIDA.proxBando <= 0) {
    VIDA.proxBando = rnd(25, 55);
    const lado = Math.random() < 0.5 ? 1 : -1, n = 3 + Math.floor(Math.random() * 4), y0 = cy + rnd(0.15, 0.6) * vh;
    const b = { lado, aves: [] };
    for (let i = 0; i < n; i++) b.aves.push({ x: (lado > 0 ? cx - 40 : cx + vw + 40) - lado * Math.abs(i - n / 2) * 26, y: y0 + i * 14 - n * 7, f: Math.random() * 6 });
    VIDA.bandos.push(b);
  }
  for (const b of VIDA.bandos) for (const a of b.aves) { a.x += b.lado * 170 * dt; a.y -= 8 * dt; a.f += dt * 10; }
  VIDA.bandos = VIDA.bandos.filter(b => b.aves.some(a => a.x > cx - 120 && a.x < cx + vw + 120));
  // Rolinhas: bicam o chão, dão pulinhos; com o Jocelino a menos de 2 ladrilhos, voam e somem. Voltam no dia seguinte.
  const j = G.jog;
  for (const r of VIDA.rolinhas) {
    r.t += dt;
    if (r.voando) { r.x += r.vx * dt; r.z += r.vy * dt; r.vy += 30 * dt; continue; }
    r.bica -= dt;
    if (r.bica <= 0) { r.bica = rnd(0.8, 2.5); if (Math.random() < 0.3) { r.pulo = 0.25; r.x += r.lado * rnd(4, 10); } if (Math.random() < 0.2) r.lado = -r.lado; }
    r.pulo = Math.max(0, r.pulo - dt);
    if (j && Math.hypot(j.x - r.x, j.y - r.y) < 2 * TILE) { r.voando = true; r.lado = j.x > r.x ? -1 : 1; r.vx = r.lado * rnd(160, 220); r.vy = rnd(140, 190); }
  }
  VIDA.rolinhas = VIDA.rolinhas.filter(r => !r.voando || r.z < 900);
}
ATUALIZADORES.push(vidaAtualiza);

// Rolinha no chão (entra na ordem de altura com o resto) — corpo pardo, cabeça, bico, olho e contorno escuro.
function _desenhaRolinha(ctx, r) {
  const voa = r.voando, bob = voa ? 0 : (r.bica < 0.25 ? 3 : 0), pz = r.pulo > 0 ? Math.sin(Math.PI * r.pulo / 0.25) * 5 : 0;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(r.x, r.y, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.translate(r.x, r.y - 12 - pz - r.z); ctx.scale(r.lado * 1.75, 1.75);
  ctx.lineWidth = 1.6; ctx.strokeStyle = '#1c140e';
  if (voa) {   // asas batendo
    const a = Math.sin(r.t * 30) * 0.9;
    ctx.fillStyle = '#7a6a5a';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(-1, -2, 9, 3, s * a - 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  }
  ctx.fillStyle = '#8f7f6c'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#b9a58c'; ctx.beginPath(); ctx.ellipse(1, 2, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6f6050'; ctx.beginPath(); ctx.moveTo(-7, -1); ctx.lineTo(-13, -3); ctx.lineTo(-12, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8f7f6c'; ctx.beginPath(); ctx.arc(7, -4 + bob, 3.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d98a3a'; ctx.beginPath(); ctx.moveTo(10, -4 + bob); ctx.lineTo(13.5, -3 + bob); ctx.lineTo(10, -2.4 + bob); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#111'; ctx.fillRect(7.5, -5.5 + bob, 1.6, 1.6);
  ctx.restore();
}
function vidaNoChao(m) {
  if (m.dentro || m.cenario || VIDA.mapaId !== m.id) return [];
  return VIDA.rolinhas.map(r => ({ y: r.y, desenha: ctx => _desenhaRolinha(ctx, r) }));
}
// O céu: folhas ao vento e o bando (com a sombra no chão, bem mais embaixo).
function desenhaCeu(ctx, m) {
  if (m.dentro || m.cenario) return;
  ctx.save();
  for (const f of VIDA.folhas) {
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.ang);
    ctx.fillStyle = f.cor; ctx.strokeStyle = 'rgba(30,18,8,.85)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke();
    ctx.restore();
  }
  for (const b of VIDA.bandos) for (const a of b.aves) {
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(a.x + 30, a.y + 170, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
    const asa = Math.sin(a.f) * 7;
    ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(a.x - 12, a.y - asa); ctx.quadraticCurveTo(a.x - 6, a.y - 4 - asa * 0.3, a.x, a.y); ctx.quadraticCurveTo(a.x + 6, a.y - 4 - asa * 0.3, a.x + 12, a.y - asa); ctx.stroke();
  }
  ctx.restore();
}
