/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   VALE DAS PEDRAS CELESTIAIS (v144) — inspirado nas pedras Metin (Metin2)
   - Um mapa grande com 8 ZONAS, uma por faixa de nível (1–25 ... 300–400),
     separadas por paredões; em cada zona andam os adversários daquela faixa.
   - De tempos em tempos um METEORO cai no meio de cada zona e vira uma
     PEDRA CELESTIAL do nível da zona: não anda, não ataca, é muito resistente.
     Quebra melhor no CHUTE (no drible rende 60%). Em 75%, 50% e 25% de vida
     aparecem defensores (como no Metin2).
   - Quebrou: tostões, XP, poções da faixa, materiais de forja, figurinhas e
     chance boa de equipamento da faixa. Pedra mais alta = drop melhor.
   - Entradas: Vila, Rio e Estação Espacial. O Guardião do Vale leva de volta
     para o lugar de onde a pessoa veio.
   Carregar DEPOIS de espaco.js.
   ============================================================ */
Object.assign(OBJ_INFO, { cratera_meteoro: { w: 1.4, b: 0 }, estilhacos_estrela: { w: 1.1, b: 0 } });
const ASSETS_VALE = ['ent_celeste', 'cratera_meteoro', 'estilhacos_estrela', ...[1, 2, 3, 4, 5, 6, 7, 8].map(k => 'pedra_c' + k)];
ASSETS_VALE.forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });

/* ---------- as 8 zonas ---------- */
// [nome, níveis, chão, adversários, nível da pedra, cor do brilho]
const ZONAS_VALE = [
  ['Campinho Celeste', '1–25', CH.GRAMA, ['moleque', 'caramelo', 'zagueiro_rua', 'futevoleiro'], 15, '120,255,120'],
  ['Várzea das Estrelas', '25–50', CH.CAMPO_TERRA, ['skatista', 'volante', 'preparador', 'zagueiro_sub20'], 42, '120,190,255'],
  ['Dunas do Mundo', '50–100', CH.AREIA, ['cairo_rapido', 'toquio_meia', 'doha_zagueiro', 'miami_rapido'], 85, '255,170,80'],
  ['Praça Europeia', '100–150', CH.PARALELO, ['ponta_alfama', 'extremo_madri', 'milao_meia', 'munique_zagueiro'], 135, '255,90,90'],
  ['Calçadão da Copa', '150–200', CH.CALCADA_PT, ['ponta_camden', 'buenos_meia', 'rio_rapido'], 185, '200,120,255'],
  ['Recife Perdido', '200–250', CH.AREIA_MAR, ['rato', 'morcego', 'mumia', 'escorpiao'], 235, '90,230,230'],
  ['Cratera dos Dragões', '250–300', CH.CAVERNA, ['jacare', 'touro', 'yeti', 'dragao'], 285, '255,200,80'],
  ['Campo Galáctico', '300–400', CH.REGOLITO, ['et_coelho', 'et_marciano', 'et_anel', 'et_cometa'], 360, '255,255,220'],
];
const VALE_W = 104, VALE_H = 72, ZW = 25, ZH = 33;
// zonas em "cobrinha": em cima da esquerda para a direita (1–4), embaixo da direita para a esquerda (5–8)
const ZONA_RET = ZONAS_VALE.map((z, i) => { const lin = i < 4 ? 0 : 1, col = i < 4 ? i : 7 - i; return { x: 2 + col * (ZW + 1), y: 3 + lin * (ZH + 1), w: ZW, h: ZH }; });

/* ---------- as pedras (monstros parados) ---------- */
// vida das pedras: medida com um jogador típico de cada faixa chutando (teste de dano por segundo),
// para quebrar em ~40 s (zona 1) até ~80 s (zona 8): quanto mais alta, mais difícil
const PEDRA_HP = [900, 4000, 30000, 58000, 130000, 213000, 485000, 1075000];
function melhorItem(filtro, L) { let b = null; for (const [id, it] of Object.entries(ITENS)) if (filtro(it) && (it.lvl || 0) <= L && (!b || (it.lvl || 0) > (ITENS[b].lvl || 0))) b = id; return b; }
ZONAS_VALE.forEach(([nome, faixa, , mons, L], i) => {
  const k = i + 1; const st = statsNivel(L); const espaco = L >= 300 ? 1.7 : 1;
  const loot = [];
  const hp = melhorItem(it => it.tipo === 'consumivel' && it.efeito && it.efeito.hp, L); if (hp) loot.push([hp, 1, 2, 4]);
  const fo = melhorItem(it => it.tipo === 'consumivel' && it.efeito && it.efeito.foco, L); if (fo) loot.push([fo, 0.6, 1, 3]);
  const co = melhorItem(it => it.tipo === 'comida', L); if (co) loot.push([co, 0.3, 1, 1]);
  loot.push(['pacotinho', 0.35, 1, 1]);
  if (k <= 4) loot.push(['retalho', 0.8, 2, 4]);
  loot.push(['couro', 0.6, 1, 3]);
  if (k >= 3) loot.push(['fio_ouro', 0.2, 1, 1]);
  const raro = typeof materialRaroRefino === 'function' ? materialRaroRefino(L) : null; if (raro && ITENS[raro]) loot.push([raro, 0.5, 1, 2]);
  // equipamentos que os adversários da zona já derrubam, só que com chance bem maior (4%)
  const gear = new Set(); for (const m of mons) for (const [id] of (MONSTROS[m] ? MONSTROS[m].loot : [])) if (ITENS[id] && ITENS[id].tipo === 'equip' && !ITENS[id].mitico) gear.add(id);
  for (const id of gear) loot.push([id, 0.04, 1, 1]);
  MONSTROS['pedra_' + k] = {
    nome: `Pedra Celestial ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][i]}`, nivel: L, hp: PEDRA_HP[i], atk: 0, def: st.def,
    xp: Math.round(st.xp * 5 * (espaco > 1 ? 1.55 : 1)), vel: 0, aggro: 0, atkCd: 1e12, respawn: 1e12, pedra: k,
    ouro: [L * 30, L * 60], loot, falas: [], look: { tipo: 'pedra' + k, spr: 'pedra_c' + k, grande: true },
  };
  ALTURA_BICHO['pedra' + k] = 1.35 + i * 0.1;
});
const eDaPedra = m => m && m.d && m.d.pedra;
// pedra não anda nem ataca
const _atualizaMonstroVale = atualizaMonstro;
atualizaMonstro = function (m) { if (eDaPedra(m)) return; return _atualizaMonstroVale.apply(this, arguments); };
// retratos (lista de batalha, wiki)
const _desenhaBichoVale = desenhaBicho;
desenhaBicho = function (x, tipo, px, py, s, a) {
  if (!/^pedra\d$/.test(tipo)) return _desenhaBichoVale.apply(this, arguments);
  const im = aSprite('pedra_c' + tipo.slice(5)); if (!im) return;
  const h = 1.3 * T * s, w = h * im.width / im.height; x.drawImage(im, px - w / 2, py - h, w, h);
};

/* ---------- o mapa ---------- */
function criaVale() {
  const b = new Construtor('vale_celeste', '☄️ Vale das Pedras Celestiais', VALE_W, VALE_H, CH.PEDRA, 4401);
  const paredes = ['rochas', 'estalagmite', 'pedra', 'rochas'];
  for (let y = 0; y < VALE_H; y++) for (let x = 0; x < VALE_W; x++) b.obj(x, y, (x + y) % 2 ? 'x' : paredes[(x * 3 + y * 7) % paredes.length]);
  ZONA_RET.forEach((r, i) => {
    const z = ZONAS_VALE[i];
    b.ret(r.x, r.y, r.w, r.h, z[2]); b.limpa(r.x, r.y, r.w, r.h);
    // adversários da faixa
    z[3].forEach((m, j) => { if (MONSTROS[m]) b.spawn(m, r.x + 4 + (j % 2) * (r.w - 9), r.y + 5 + Math.floor(j / 2) * (r.h - 11), 3, 3); });
    // enfeites de meteoro
    b.espalha(['cratera_meteoro', 'estilhacos_estrela', 'cristais'], 5, r.x + 2, r.y + 2, r.w - 4, r.h - 4);
  });
  // passagens entre zonas vizinhas (e placas com a faixa de nível)
  const passa = (a, bz) => {
    const A = ZONA_RET[a], B = ZONA_RET[bz];
    if (A.y === B.y) { const x = Math.max(A.x, B.x) - 1, y = A.y + (A.h >> 1) - 2; b.ret(x, y, 1, 4, ZONAS_VALE[bz][2]); b.limpa(x, y, 1, 4); }
    else { const y = Math.max(A.y, B.y) - 1, x = A.x + (A.w >> 1) - 2; b.ret(x, y, 4, 1, ZONAS_VALE[bz][2]); b.limpa(x, y, 4, 1); }
  };
  for (let i = 0; i < 7; i++) passa(i, i + 1);
  ZONA_RET.forEach((r, i) => b.placa(r.x + (r.w >> 1) + 3, r.y + 1, `☄️ ZONA ${i + 1}: ${ZONAS_VALE[i][0].toUpperCase()} — níveis ${ZONAS_VALE[i][1]}. Pedras Celestiais caem aqui de tempos em tempos!`));
  // chegada (zona 1)
  const z1 = ZONA_RET[0]; b.npc('guardiao_vale', z1.x + 5, z1.y + 3); b.m.inicio = { x: z1.x + 3, y: z1.y + 4 }; b.m.renasce = { x: z1.x + 3, y: z1.y + 4 };
  b.placa(z1.x + 1, z1.y + 3, '☄️ VALE DAS PEDRAS CELESTIAIS — quebre as pedras que caem do céu CHUTANDO a bola nelas! Quanto mais longe, mais forte a zona.');
  b.m.vale = true;
  return b.m;
}
MAPAS_DEF.vale_celeste = criaVale;
function zonaDe(x, y) { return ZONA_RET.findIndex(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h); }

/* ---------- entradas (Vila, Rio, Estação) e volta ---------- */
NPCS.guardiao_vale = { nome: 'Guardião do Vale', valeVolta: true, look: { tipo: 'humano', corpo: 'm', alt: 1.76, pele: 'pele-retinta', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-terno', corRoupa: '#3a2a6a', baixo: 'baixo-jeans', chapeu: 'chapeu-coroa' },
  ola: 'Das estrelas caem pedras cheias de energia. Quem quebra uma com a força do chute leva os tesouros dela! Cada zona tem pedras mais fortes que a anterior.' };
for (const host of ['vila', 'rio', 'estacao']) {
  const base = MAPAS_DEF[host];
  MAPAS_DEF[host] = function () {
    const m = base(); const c = { id: 'vale_celeste', ent: 'ent_celeste', m: 'moleque', nome: 'Vale das Pedras Celestiais' };
    if (poeEntradaCaca(m, c)) { const pl = m.placas[m.placas.length - 1]; if (pl) pl.texto = '☄️ VALE DAS PEDRAS CELESTIAIS — pedras que caem do céu, para TODOS os níveis. Quebre com chutes e ganhe tesouros!'; }
    return m;
  };
}
const _entrarMapaVale = entrarMapa;
entrarMapa = function (id, x, y) {
  const s = G.save;
  if (s && id === 'vale_celeste' && G.mapa && G.mapa.id !== 'vale_celeste') s.voltaVale = { id: G.mapa.id, x: G.p ? G.p.x : null, y: G.p ? G.p.y + 1 : null };
  const r = _entrarMapaVale.apply(this, arguments);
  if (id === 'vale_celeste') iniciaQuedas();
  return r;
};
const _abrirNPCVale = abrirNPC;
abrirNPC = function (npc) {
  if (!npc || !npc.d || !npc.d.valeVolta) return _abrirNPCVale.apply(this, arguments);
  const s = G.save; const v = s.voltaVale && MAPAS_DEF[s.voltaVale.id] ? s.voltaVale : { id: 'vila' };
  const nomeV = (getMapa(v.id).nome || v.id).replace(/^🎯\s*/, '');
  abreModal(el('h2', {}, npc.d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, npc.d.ola))),
    el('ul', { class: 'ar-regras' }, el('li', {}, '☄️ Uma pedra cai em cada zona de tempos em tempos (fique de olho no céu!).'), el('li', {}, '⚽ CHUTE (tecla X) quebra bem mais rápido que o drible.'), el('li', {}, '🛡️ Em 75%, 50% e 25% aparecem defensores da pedra.'), el('li', {}, '🎁 Quanto mais forte a pedra, melhores os tesouros.')),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); som('porta'); if (v.x != null) trocaMapa(v.id, v.x, v.y); else trocaMapa(v.id); } }, `↩️ Voltar para ${nomeV}`), el('button', { class: 'btn', onclick: fechaModal }, 'Ficar mais um pouco')));
};
if (typeof iconeNPC === 'function') { const _iconeNPCVale = iconeNPC; iconeNPC = function (n) { const d = n.d || NPCS[n.id] || {}; return d.valeVolta ? '☄️' : _iconeNPCVale(n); }; }
// plaquinha em cima da entrada
const _desenhaPredioVale = desenhaPredio;
desenhaPredio = function (ctx, b) {
  const r = _desenhaPredioVale.apply(this, arguments);
  if (b && b.interior === 'vale_celeste') {
    const x = (b.porta.x + 0.5) * T, y = (b.porta.y + 1) * T + T * 0.28, txt = '☄️ Vale das Pedras Celestiais · todos os níveis', s = T * 0.27;
    ctx.font = `700 ${s}px Fredoka, Nunito, sans-serif`; const tw = ctx.measureText(txt).width + s * 1.1, th = s * 1.55;
    ctx.fillStyle = 'rgba(40,20,90,0.9)'; ctx.strokeStyle = '#b89aff'; ctx.lineWidth = s * 0.12; ctx.beginPath(); ctx.roundRect(x - tw / 2, y - th / 2, tw, th, th / 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f4ecff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + s * 0.05); ctx.textBaseline = 'alphabetic';
  }
  return r;
};

/* ---------- queda dos meteoros ---------- */
const VALE = { zonas: [], meteoros: [] };
function iniciaQuedas() {
  VALE.meteoros = [];
  VALE.zonas = ZONAS_VALE.map((z, i) => ({ i, pedra: null, prox: G.agora + (i === 0 ? 6000 : rnd(15000, 60000)) }));
  // quem chega vê logo uma pedra na zona onde está
  const zp = zonaDe(G.p.x, G.p.y); if (zp >= 0) VALE.zonas[zp].prox = G.agora + 6000;
}
function caiPedra(z) {
  const r = ZONA_RET[z.i]; const pos = posLivre(r.x + (r.w >> 1), r.y + (r.h >> 1), 9);
  if (!pos || zonaDe(pos.x, pos.y) !== z.i) { z.prox = G.agora + 5000; return; }
  z.prox = Infinity; VALE.meteoros.push({ z, x: pos.x, y: pos.y, t0: G.agora, dur: 1400 });
}
function pousaPedra(met) {
  const k = met.z.i + 1; const sp = { m: 'pedra_' + k, x: Math.floor(met.x), y: Math.floor(met.y), qtd: 1, raio: 0, pedraCeleste: true };
  const m = criaMonstro(sp); if (!m) { met.z.prox = G.agora + 5000; return; }
  m.limiares = [0.75, 0.5, 0.25]; G.mons.push(m); met.z.pedra = m;
  efeito('explosao', m.x, m.y); som('explosao');
  if (zonaDe(G.p.x, G.p.y) === met.z.i) { banner('☄️ Uma Pedra Celestial caiu!', `${m.d.nome} · nível ${m.d.nivel}`); }
  log(`☄️ Uma ${m.d.nome} (nível ${m.d.nivel}) caiu na zona ${k}: ${ZONAS_VALE[met.z.i][0]}! Quebre com chutes para ganhar tesouros.`, 'l-xp');
}
const _atualizaVale = atualiza;
atualiza = function (dt) {
  const r = _atualizaVale.apply(this, arguments);
  const m = G.mapa; if (!m || !m.vale || !VALE.zonas.length) return r;
  for (const z of VALE.zonas) {
    if (z.pedra && !G.mons.includes(z.pedra)) { z.pedra = null; z.prox = G.agora + rnd(90000, 150000); }
    if (!z.pedra && z.prox !== Infinity && G.agora >= z.prox) caiPedra(z);
  }
  for (let i = VALE.meteoros.length - 1; i >= 0; i--) { const met = VALE.meteoros[i]; if (G.agora - met.t0 >= met.dur) { VALE.meteoros.splice(i, 1); pousaPedra(met); } }
  return r;
};
// dano na pedra: chute cheio, drible 60%; defensores em 75/50/25%
const _aplicaDanoVale = aplicaDano;
aplicaDano = function (m, dano) {
  if (!eDaPedra(m)) return _aplicaDanoVale.apply(this, arguments);
  if (G.modo === 'drible') { dano = Math.max(1, Math.round(dano * 0.6)); if (typeof dica === 'function') dica('pedra_chute', 'Pedra Celestial é dura! No DRIBLE ela quebra devagar: troque para o CHUTE (tecla X) e mande a bola nela!'); }
  const r = _aplicaDanoVale.call(this, m, dano);
  if (m.limiares && m.hp > 0) while (m.limiares.length && m.hp / m.d.hp <= m.limiares[0]) {
    m.limiares.shift(); const z = zonaDe(m.x, m.y); const mons = z >= 0 ? ZONAS_VALE[z][3].filter(id => MONSTROS[id]) : [];
    for (let n = 0; n < 2 && mons.length; n++) { const g = criaMonstro({ m: mons[(Math.random() * mons.length) | 0], x: Math.floor(m.x), y: Math.floor(m.y), qtd: 1, raio: 3, guardaPedra: true }); if (g) { g.bravo = true; G.mons.push(g); efeito('puff', g.x, g.y); } }
    texto(m, 'DEFENSORES!', '#ffb84a', 1200, -0.8);
  }
  return r;
};
// pedra e defensores não "renascem" sozinhos
const _matarVale = matar;
matar = function (m) {
  const r = _matarVale.apply(this, arguments);
  if (m && m.sp && (m.sp.pedraCeleste || m.sp.guardaPedra)) G.respawns = G.respawns.filter(x => x.sp !== m.sp);
  if (eDaPedra(m)) { banner('💥 Pedra Celestial quebrada!', 'Os tesouros caíram no chão'); if (G.save) { G.save.st.pedras = (G.save.st.pedras || 0) + 1; } }
  return r;
};

/* ---------- visual: meteoros caindo e brilho das pedras ---------- */
const _desenhaNoiteVale = desenhaNoite;
desenhaNoite = function (ctx, cam, vw, vh) {
  const r = _desenhaNoiteVale.apply(this, arguments);
  const m = G.mapa; if (!m || !m.vale) return r;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const p of G.mons) {
    if (!eDaPedra(p)) continue;
    const cor = ZONAS_VALE[p.d.pedra - 1][5]; const pul = 0.75 + 0.25 * Math.sin(G.agora / 400 + p.x);
    const x = p.x * T, y = (p.y - 0.6) * T, rr = T * 1.3;
    const g = ctx.createRadialGradient(x, y, 4, x, y, rr); g.addColorStop(0, `rgba(${cor},${0.35 * pul})`); g.addColorStop(1, `rgba(${cor},0)`);
    ctx.fillStyle = g; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  for (const met of VALE.meteoros) {
    const k = Math.min(1, (G.agora - met.t0) / met.dur); const cor = ZONAS_VALE[met.z.i][5];
    const tx = met.x * T, ty = met.y * T, sx = tx + T * 6 * (1 - k), sy = ty - T * 9 * (1 - k);
    const g = ctx.createLinearGradient(sx + T * 2.5, sy - T * 3.5, sx, sy); g.addColorStop(0, `rgba(${cor},0)`); g.addColorStop(1, `rgba(${cor},0.9)`);
    ctx.strokeStyle = g; ctx.lineWidth = T * 0.35; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx + T * 2.5, sy - T * 3.5); ctx.lineTo(sx, sy); ctx.stroke();
    ctx.fillStyle = `rgba(255,255,240,0.95)`; ctx.beginPath(); ctx.arc(sx, sy, T * 0.22, 0, 7); ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(0,0,0,${0.25 * k})`; ctx.beginPath(); ctx.ellipse(tx, ty, T * 0.8 * k, T * 0.35 * k, 0, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'lighter';
  }
  ctx.restore(); return r;
};
