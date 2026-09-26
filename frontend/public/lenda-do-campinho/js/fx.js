/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   EFEITOS DAS LUTAS (animações desenhadas no Higgsfield)
   Folhas a/fx/fx_<nome>.webp: 12 quadros (4x3, 192 px cada).
   - Os efeitos de sempre (impacto, explosão, cura, área...) TROCAM o
     desenho simples pela animação (não somam: a luta não fica poluída).
     O toque do ataque automático, que é toda hora, continua discreto.
   - UM visual por golpe (sem poluir): o efeito da jogada vira a animação;
     só algumas ganham um toque próprio (chute com bola de fogo nos pés,
     chuva de bolas = meteoros, raiz = raízes, água gelada = gelo, relâmpago
     também nos vizinhos); o drible com a bola ganha só um corte leve.
   - Golpes fortes tremem a tela e dão um clarão rápido.
   - Adversário tonto: estrelinhas girando na cabeça (animadas).
   Carregar DEPOIS de game.js e vocacoes.js.
   ============================================================ */
const FX = { img: {}, tremor: null, clarao: null };
const FX_NOMES = ['impacto', 'explosao', 'raio', 'redemoinho', 'onda', 'cura', 'escudo', 'tontura', 'corte', 'meteoro', 'gelo', 'poeira', 'raizes', 'nivel', 'fogo_bola'];
(function () {
  const v = ((document.querySelector('script[src*="fx.js"]') || {}).src || '').split('v=')[1] || '1';
  for (const n of FX_NOMES) { const im = new Image(); const o = FX.img[n] = { im, ok: false }; im.onload = () => { o.ok = true; }; im.src = `a/fx/fx_${n}.webp?v=${v}`; }
})();

// um efeito desenhado: tamanho em quadrados do mapa; dy sobe/desce o centro; atraso em ms
function fxAnim(nome, x, y, o = {}) {
  if (!FX.img[nome]) return;
  G.fx.push({ tipo: 'spr', spr: nome, x, y, t0: G.agora + (o.atraso || 0), dur: (o.dur || 650) + (o.atraso || 0), atraso: o.atraso || 0, tam: o.tam || 1.4, dy: o.dy || 0, flip: !!o.flip, alfa: o.alfa || 1, laco: o.laco });
}
function tremeTela(forca = 6, dur = 260) { FX.tremor = { t0: G.agora, dur, forca }; }
function clarao(a = 0.22, dur = 110, cor = '255,255,255') { FX.clarao = { t0: G.agora, dur, a, cor }; }

/* ---------- desenho ---------- */
const _desenhaEfeitoFx = desenhaEfeito;
desenhaEfeito = function (ctx, f) {
  if (f.tipo !== 'spr') return _desenhaEfeitoFx(ctx, f);
  const o = FX.img[f.spr]; if (!o || !o.ok) return;
  const vida = f.dur - f.atraso, t = G.agora - (f.t0 + f.atraso); if (t < 0 || t >= vida) return;
  const q = Math.min(11, Math.floor(t / vida * 12)); const lado = f.tam * T;
  const cx = f.x * T, cy = f.y * T - 0.5 * T + f.dy * T;
  ctx.save(); ctx.globalAlpha = f.alfa;
  if (f.flip) { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }
  ctx.drawImage(o.im, (q % 4) * 192, Math.floor(q / 4) * 192, 192, 192, cx - lado / 2, cy - lado / 2, lado, lado);
  ctx.restore();
};
// tremor (mexe a câmera só durante o desenho) e clarão (por cima de tudo)
const _desenhaFx = desenha;
desenha = function (dt) {
  const tr = FX.tremor; let ox = 0, oy = 0;
  if (tr) { const k = (G.agora - tr.t0) / tr.dur; if (k >= 1 || k < 0) FX.tremor = null; else { const f = tr.forca * (1 - k); ox = (Math.random() * 2 - 1) * f; oy = (Math.random() * 2 - 1) * f; } }
  if (G.cam) { G.cam.x += ox; G.cam.y += oy; }
  try { _desenhaFx.apply(this, arguments); } finally { if (G.cam) { G.cam.x -= ox; G.cam.y -= oy; } }
  const c = FX.clarao;
  if (c && CTX) { const k = (G.agora - c.t0) / c.dur; if (k >= 1 || k < 0) FX.clarao = null; else { CTX.save(); CTX.setTransform(1, 0, 0, 1, 0, 0); CTX.fillStyle = `rgba(${c.cor},${c.a * (1 - k)})`; CTX.fillRect(0, 0, CV.width, CV.height); CTX.restore(); } }
};

/* ---------- os efeitos de sempre ganham a animação ---------- */
const FX_DO_TIPO = {
  impacto: ['impacto', 1.2], bola: ['impacto', 1.0],
  explosao: ['explosao', 1.9, { dur: 750 }], bolaforte: ['explosao', 1.5, { dur: 650 }],
  raio: ['raio', 2.3, { dy: -0.6, dur: 600 }], giro: ['redemoinho', 1.15, { dy: 0.3, alfa: 0.8, dur: 600 }], vento: ['poeira', 1.1, { dy: 0.4, alfa: 0.85 }],
  cura: ['cura', 1.3, { dur: 800, alfa: 0.85 }], curaforte: ['cura', 1.7, { dur: 900, alfa: 0.85 }], escudo: ['escudo', 1.8, { dur: 800, alfa: 0.85 }],
  puff: ['poeira', 1.1, { dy: 0.3, dur: 500, alfa: 0.85 }], morte: ['poeira', 1.3, { dy: 0.2, dur: 600, alfa: 0.85 }], nivel: ['nivel', 2.2, { dy: -0.6, dur: 1300 }],
};
// estes mostram a bola fazendo o drible: mantêm o desenho e ganham só um corte leve
const FX_SOMA = { chapeu: ['corte', 1.2, { alfa: 0.75 }], elastico: ['corte', 1.2, { flip: true, alfa: 0.75 }], caneta: ['corte', 1.1, { alfa: 0.75 }] };
let FX_SUPRIME = null; // jogada especial que troca o efeito normal por outro (ex.: chuva de bolas = meteoros)
const _efeitoFx = efeito;
efeito = function (tipo, x, y, cor, raio) {
  if (FX_SUPRIME && FX_SUPRIME.tipo === tipo && G.agora < FX_SUPRIME.ate) return;
  const m = FX_DO_TIPO[tipo] || (tipo === 'area' ? ['onda', Math.max(1.8, (raio || 1) * 2), { dy: 0.45, dur: 700, alfa: 0.9 }] : null);
  let r;
  if (m && FX.img[m[0]].ok) fxAnim(m[0], x, y, Object.assign({ tam: m[1] }, m[2] || {})); // troca o desenho simples (não soma)
  else r = _efeitoFx.apply(this, arguments);
  const s = FX_SOMA[tipo]; if (s) fxAnim(s[0], x, y, Object.assign({ tam: s[1] }, s[2]));
  if (tipo === 'explosao') { tremeTela(6, 260); clarao(0.14, 110, '255,230,160'); }
  else if (tipo === 'raio') { tremeTela(4, 200); clarao(0.18, 90, '200,240,255'); }
  return r;
};

/* ---------- jogadas com um toque próprio (só o que o efeito normal não mostra) ---------- */
// troca: o efeito normal da jogada (dr.fx) some por 1,5 s e entra este no lugar
const FX_JOGADA = {
  chute_colocado: (p) => fxAnim('fogo_bola', p.x, p.y, { tam: 0.9, dy: 0.45, dur: 450, alfa: 0.9 }),
  trivela: (p) => fxAnim('fogo_bola', p.x, p.y, { tam: 0.9, dy: 0.45, dur: 450, alfa: 0.9 }),
  voleio: (p) => fxAnim('fogo_bola', p.x, p.y, { tam: 1.0, dy: 0.3, dur: 500, alfa: 0.9 }),
  bicicleta: (p) => fxAnim('fogo_bola', p.x, p.y, { tam: 1.3, dy: 0.1, dur: 600 }),
  canhao: (p) => fxAnim('fogo_bola', p.x, p.y, { tam: 1.5, dy: 0.1, dur: 650 }),
  carrinho: (p) => fxAnim('poeira', p.x, p.y, { tam: 1.4, dy: 0.35, alfa: 0.85 }),
  tranco: () => tremeTela(5, 240),
  relampago: (p, a) => { const c = a || p; G.mons.filter(m => m !== a && m.hp > 0 && dist(m, c) < 3.5).slice(0, 2).forEach((m, i) => fxAnim('raio', m.x, m.y, { tam: 2.1, dy: -0.6, dur: 600, atraso: 120 + i * 120 })); },
  chuva_bolas: { troca: true, fn: (p, a) => { const c = a || p; for (let i = 0; i < 3; i++) { const ang = i / 3 * Math.PI * 2 + 0.4, r = i ? 1.1 : 0; fxAnim('meteoro', c.x + Math.cos(ang) * r, c.y + Math.sin(ang) * r * 0.6, { tam: 1.9, dy: -0.4, dur: 650, atraso: i * 150 }); } setTimeout(() => tremeTela(5, 280), 380); } },
  agua_gelada: { troca: true, fn: (p) => fxAnim('gelo', p.x, p.y, { tam: 1.8, dur: 800, alfa: 0.9 }) },
  raiz: { troca: true, fn: (p, a) => { const c = a || p; fxAnim('raizes', c.x, c.y, { tam: 2.4, dy: 0.1, dur: 1000 }); tremeTela(3, 200); } },
};
let FX_CAST = 0; // o tituloSkill só aparece quando a jogada saiu de verdade
const _tituloSkillFx = tituloSkill;
tituloSkill = function () { FX_CAST = G.agora; return _tituloSkillFx.apply(this, arguments); };
const _usarDribleFx = usarDrible;
usarDrible = function (id) {
  const antes = FX_CAST, alvo = G.alvo && G.mons.includes(G.alvo) ? G.alvo : null;
  const j = FX_JOGADA[id], dr = DRIBLES[id];
  if (j && j.troca && dr) FX_SUPRIME = { tipo: dr.fx, ate: G.agora + 1500 };
  const r = _usarDribleFx.apply(this, arguments);
  if (FX_CAST === antes) { if (j && j.troca) FX_SUPRIME = null; return r; } // não saiu (sem foco, recarga...)
  if (j && G.p) try { (j.fn || j)(G.p, alvo); } catch (e) { }
  return r;
};
// especiais de classe
const _usarClasseFx = usarClasse;
usarClasse = function () {
  const antes = FX_CAST; const r = _usarClasseFx.apply(this, arguments);
  if (FX_CAST !== antes && G.p) { const id = (CLASSES[G.save.classe] || {}).especial?.id; if (id === 'firula') fxAnim('fogo_bola', G.p.x, G.p.y, { tam: 1.1, dy: 0.3, dur: 600, alfa: 0.9 }); else if (id === 'leitura') fxAnim('onda', G.p.x, G.p.y, { tam: 3.4, dy: 0.45, dur: 800, alfa: 0.8 }); }
  return r;
};
// o chefão bate forte: a tela treme
const _recebeDanoFx = recebeDano;
recebeDano = function (dano, m) {
  const r = _recebeDanoFx.apply(this, arguments);
  if (m && m.d && m.d.chefe && dano > stats().maxHp * 0.08) tremeTela(4, 180); // só golpe forte de chefão
  return r;
};

/* ---------- tontos: estrelinhas girando (animadas) na cabeça ---------- */
const _desenhaEntFx = desenhaEnt;
desenhaEnt = function (ctx, e) {
  const r = _desenhaEntFx.apply(this, arguments);
  if (e && (e.atordoado || 0) > G.agora && FX.img.tontura.ok) {
    const o = FX.img.tontura, q = Math.floor(G.agora / 70) % 8 + 2; // quadros do meio, em laço
    const lado = 1.25 * T, cx = e.x * T, cy = e.y * T - alturaEnt(e) * T - 0.05 * T;
    ctx.drawImage(o.im, (q % 4) * 192, Math.floor(q / 4) * 192, 192, 192, cx - lado / 2, cy - lado / 2, lado, lado);
  }
  return r;
};

// o nome da jogada fica um pouco menos na tela (a animação já mostra o que aconteceu)
const _tituloDurFx = tituloSkill;
tituloSkill = function () { const r = _tituloDurFx.apply(this, arguments); const u = (G.titulos || [])[G.titulos.length - 1]; if (u) u.dur = 1100; return r; };
