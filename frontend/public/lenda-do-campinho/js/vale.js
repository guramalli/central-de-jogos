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
  ['Praça Europeia', '100–150', CH.PARALELO, ['buenos_meia', 'rio_rapido', 'ponta_alfama', 'paris_zagueiro'], 135, '255,90,90'],
  ['Calçadão da Copa', '150–200', CH.CALCADA_PT, ['munique_zagueiro', 'milao_meia', 'extremo_madri', 'ponta_camden'], 185, '200,120,255'],
  ['Recife Perdido', '200–250', CH.AREIA_MAR, ['rato', 'morcego', 'mumia', 'escorpiao'], 235, '90,230,230'],
  ['Cratera dos Dragões', '250–300', CH.CAVERNA, ['jacare', 'touro', 'yeti', 'dragao'], 285, '255,200,80'],
  ['Campo Galáctico', '300–400', CH.REGOLITO, ['et_coelho', 'et_marciano', 'et_anel', 'et_cometa'], 360, '255,255,220'],
];

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

/* ---------- os mapas (v367, dono: "uma pessoa de nível baixo entra e passa para níveis mais difíceis sem querer e pode
   morrer de bobeira... e o mapa está muito cru") ----------
   - PRAÇA CELESTIAL (vale_celeste): o lugar seguro onde se chega (Vila, Rio, Estação). No meio, a cratera do primeiro
     meteoro e o Guardião; em volta, 8 PORTAIS, um por zona, com a faixa de nível. Cada portal só abre a partir do
     nível mínimo da zona (quem é forte entra em qualquer zona mais fraca). Quem fica sem fôlego acorda na praça.
   - 8 ILHAS (vale_z1..vale_z8): uma por zona, flutuando no céu estrelado, com chão e enfeites do tema, trilhas, a cratera
     no meio (onde a Pedra Celestial cai) e o portal de volta para a praça. */
const ZONA_MIN = [1, 25, 50, 100, 150, 200, 250, 300];
const ZONA_TEMA = [
  { chao: CH.GRAMA, var: CH.GRAMA_FLOR, trilha: CH.TERRA, props: ['arvore', 'ipe_amarelo', 'ipe_roxo', 'arbusto', 'mangueira', 'arbusto'], meio: ['minigol', 'bandeirinhas'] },
  { chao: CH.CAMPO_TERRA, var: CH.GRAMA, trilha: CH.TERRA, props: ['arvore', 'arbusto', 'orelhao', 'muro_grafite', 'poste', 'pipoqueiro'], meio: ['gol_caixote_d', 'gol_caixote_e', 'arquib_metal'] },
  { chao: CH.AREIA, var: CH.ARENITO, trilha: CH.ARENITO, props: ['palmeira_tamara', 'duna', 'camelo', 'tenda_beduina', 'lanterna_arabe', 'palmeira_tamara'], meio: ['piramide', 'obelisco'] },
  { chao: CH.PARALELO, var: CH.CALCADA_PT, trilha: CH.CALCADA_PT, props: ['cipreste', 'estatua', 'banco', 'vespa', 'mesa_italiana', 'poste3', 'cipreste'], meio: ['chafariz', 'fonte_italiana', 'torre_relogio'] },
  { chao: CH.AREIA, var: CH.CALCADA_PT, trilha: CH.CALCADA_PT, props: ['coqueiro', 'coqueiro2', 'guarda_sol', 'cadeira_praia', 'banca_coco', 'quiosque'], meio: ['rede_futevolei', 'torre_salva'] },
  { chao: CH.AREIA_MAR, var: CH.PEDRA_MAR, trilha: CH.PEDRA_MAR, props: ['coral_grande', 'alga_alta', 'concha_gigante', 'coluna_ruina', 'coral_grande', 'alga_alta'], meio: ['estatua_netuno', 'ancora_bau'] },
  { chao: CH.CAVERNA, var: CH.ROCHA_LAVA, trilha: CH.PEDRA, props: ['rocha_lava', 'estalagmite', 'cristais', 'cogumelos', 'rochas', 'rocha_lava'], meio: ['tocha', 'cristais'], lava: 1 },
  { chao: CH.REGOLITO, var: CH.NEBULOSA, trilha: CH.ANEL, props: ['cratera', 'rochas_lua', 'cristal_flutuante', 'meteorito', 'cogumelo_cosmico', 'cacto_alien'], meio: ['estrela_caida', 'geiser'] },
].map(t => Object.assign(t, { props: t.props.filter(p => OBJ_INFO[p]), meio: t.meio.filter(p => OBJ_INFO[p]) }));
const ZW_ = 60, ZH_ = 48, ZCX = 30, ZCY = 22;
const PRACA = { W: 60, H: 54, cx: 30, cy: 26, portais: [] };
// enfeite nunca na frente de saída/porta/NPC/placa/começo
function valeProtegido(m) {
  const W = m.w, P = new Uint8Array(W * m.h), marca = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < W && y < m.h) P[y * W + x] = 1; };
  for (const s of m.saidas) marca(s.x - 2, s.y - 1, s.x + 2, s.y + 3);
  for (const p of m.predios) marca(p.porta.x - 1, p.porta.y, p.porta.x + 1, p.porta.y + 3);
  for (const n of m.npcs) marca(n.x - 2, n.y - 2, n.x + 2, n.y + 3);
  for (const p of m.placas) marca(p.x - 1, p.y - 1, p.x + 1, p.y + 1);
  if (m.inicio) marca(m.inicio.x - 2, m.inicio.y - 2, m.inicio.x + 2, m.inicio.y + 2);
  for (const sp of m.spawns) marca(sp.x - 1, sp.y - 1, sp.x + 1, sp.y + 1); // onde os adversários nascem fica livre
  return P;
}
// dá para andar do começo até tudo? Se um enfeite fechou a passagem, sai só o enfeite que é "rolha"
function valeGaranteCaminho(m) {
  const W = m.w, H = m.h, N = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const bloq = o => !!o && (o.t === 'x' || OBJ_BLOQUEIA.has(o.t) || o.predio);
  const enfeite = o => !!o && o.t !== 'x' && !o.predio && o.t !== 'placa';
  for (let tent = 0; tent < 30; tent++) {
    const vis = new Uint8Array(W * H), q = [m.inicio.y * W + m.inicio.x]; vis[q[0]] = 1;
    while (q.length) { const i = q.pop(), x = i % W, y = (i / W) | 0; for (const [dx, dy] of N) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const k = ny * W + nx; if (!vis[k] && ((CH_ANDA(m.chao[k]) && !bloq(m.obj[k])) || m.saidas.some(s => s.x === nx && s.y === ny))) { vis[k] = 1; q.push(k); } } }
    const falta = [...m.saidas.map(s => [s.x, s.y]), ...m.npcs.map(n => [n.x, n.y + 1]), ...m.spawns.map(s => [s.x, s.y])].filter(([x, y]) => !vis[y * W + x]);
    if (!falta.length) return 0;
    if (tent === 0) (window.VALE_FALTA = window.VALE_FALTA || []).push(m.id + ': ' + falta.slice(0, 4).map(f => f.join(',')).join(' | '));
    let tirou = 0;
    for (let i = 0; i < W * H; i++) {
      if (!enfeite(m.obj[i])) continue; const x = i % W, y = (i / W) | 0, vz = N.map(([dx, dy]) => (y + dy) * W + x + dx);
      if (vz.some(k => vis[k]) && vz.some(k => !vis[k] && CH_ANDA(m.chao[k]) && (!m.obj[k] || enfeite(m.obj[k])))) { m.obj[i] = null; tirou++; }
    }
    if (!tirou) return 1;
  }
  return 1;
}
// a praça: um disco de pedra celeste flutuando nas estrelas, a cratera no meio e os 8 portais em volta
function criaPracaCeleste() {
  const { W, H, cx, cy } = PRACA, b = new Construtor('vale_celeste', '☄️ Vale das Pedras Celestiais — Praça Celestial', W, H, CH.ESTRELAS, 4401), m = b.m;
  const raio = (x, y) => Math.hypot(x - cx, (y - cy) * 1.05), dentro = (x, y) => raio(x, y) <= 23.5;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (dentro(x, y)) b.chao(x, y, raio(x, y) > 21.6 ? CH.ANEL : CH.MV_PRACA); else b.obj(x, y, 'x'); }
  for (let y = cy - 5; y <= cy + 5; y++) for (let x = cx - 6; x <= cx + 6; x++) if (Math.hypot(x - cx, (y - cy) * 1.25) <= 4.6) b.chao(x, y, CH.REGOLITO);
  for (let a = 0; a < Math.PI * 2; a += 0.02) b.chao(Math.round(cx + Math.cos(a) * 11.5), Math.round(cy + Math.sin(a) * 11), CH.ANEL);
  b.obj(cx, cy, 'cratera_meteoro'); b.obj(cx - 2, cy - 1, 'estilhacos_estrela'); b.obj(cx + 2, cy + 1, 'estilhacos_estrela'); b.obj(cx + 1, cy - 2, 'cristal_flutuante');
  PRACA.portais = [];
  ZONAS_VALE.forEach((z, i) => {
    const ang = -Math.PI / 2 + i * (Math.PI * 2 / 8), px = Math.round(cx + Math.cos(ang) * 17) - 1, py = Math.round(cy + Math.sin(ang) * 15.5) - 1;
    const p = b.predio('ent_celeste', px, py, 3, 2); const d = p.porta;
    m.saidas.push({ x: d.x, y: d.y, para: 'vale_z' + (i + 1), tx: ZCX, ty: ZH_ - 9, req: { flag: 'vale_z' + (i + 1), msg: `🔒 ZONA ${i + 1}: ${z[0]} (níveis ${z[1]}). Ainda é perigosa demais para você: volte no nível ${ZONA_MIN[i]}!` } });
    for (let j = d.y + 1; j <= d.y + 2; j++) for (let k = d.x - 1; k <= d.x + 1; k++) if (dentro(k, j)) { m.obj[j * W + k] = null; b.chao(k, j, CH.ANEL); }
    b.placa(d.x + 2, d.y + 1, `☄️ ZONA ${i + 1}: ${z[0].toUpperCase()} — níveis ${z[1]}. ${i ? `Só abre a partir do nível ${ZONA_MIN[i]}.` : 'Para quem está começando!'}`);
    PRACA.portais.push({ x: d.x, y: d.y + 1 });
  });
  b.npc('guardiao_vale', cx, cy + 6); m.inicio = { x: cx, y: cy + 9 }; m.renasce = { x: cx, y: cy + 9 };
  b.placa(cx - 3, cy + 8, '☄️ PRAÇA CELESTIAL — cada portal leva a uma ilha onde caem Pedras Celestiais. Os portais só abrem para quem tem o nível da zona: aqui é seguro!');
  const P = valeProtegido(m), rng = mulberry(4413);
  for (let k = 0, t = 0; k < 26 && t < 900; t++) { const x = 3 + ((rng() * (W - 6)) | 0), y = 3 + ((rng() * (H - 6)) | 0), i = y * W + x; if (m.chao[i] !== CH.MV_PRACA || m.obj[i] || P[i] || Math.hypot(x - cx, y - cy) < 7) continue; b.obj(x, y, ['cristal_flutuante', 'estrela_caida', 'cogumelo_cosmico', 'meteorito'][(rng() * 4) | 0]); k++; }
  valeGaranteCaminho(m);
  Object.assign(m, { vale: true, espaco: { tinta: 'rgba(140,90,255,0.06)' } });
  return m;
}
MAPAS_DEF.vale_celeste = criaPracaCeleste;
// as ilhas
function criaIlhaVale(i) {
  const z = ZONAS_VALE[i], t = ZONA_TEMA[i], W = ZW_, H = ZH_, b = new Construtor('vale_z' + (i + 1), `☄️ Zona ${i + 1}: ${z[0]} (níveis ${z[1]})`, W, H, CH.ESTRELAS, 4421 + i), m = b.m, rng = mulberry(4431 + i * 17);
  const fase = rng() * 6, terra = (x, y) => { const a = Math.atan2(y - ZCY, x - ZCX), r = 1 + 0.12 * Math.sin(a * 3 + fase) + 0.07 * Math.sin(a * 5 + fase * 2); return ((x - ZCX) / 26) ** 2 + ((y - ZCY) / 18.5) ** 2 <= r; };
  const ilha = (x, y) => terra(x, y) || (y >= H - 9 && y <= H - 3 && Math.abs(x - ZCX) <= 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (ilha(x, y)) b.chao(x, y, t.chao); else b.obj(x, y, 'x'); }
  for (let k = 0; k < 9; k++) { const mx = 8 + rng() * 44, my = 6 + rng() * 32, rr = 2.5 + rng() * 3; for (let y = Math.floor(my - rr); y <= my + rr; y++) for (let x = Math.floor(mx - rr); x <= mx + rr; x++) if (terra(x, y) && (x - mx) ** 2 + ((y - my) * 1.15) ** 2 <= rr * rr) b.chao(x, y, t.var); }
  for (let a = 0; a < Math.PI * 2; a += 0.015) for (const dr of [0, 0.7]) { const x = Math.round(ZCX + Math.cos(a) * (12 + dr)), y = Math.round(ZCY + Math.sin(a) * (8.5 + dr)); if (terra(x, y)) b.chao(x, y, t.trilha); }
  for (let y = ZCY + 9; y <= H - 3; y++) for (let x = ZCX - 1; x <= ZCX + 1; x++) b.chao(x, y, t.trilha);
  for (const ang of [Math.PI * 0.15, Math.PI * 0.85, Math.PI * 1.35, Math.PI * 1.65]) for (let r = 12; r <= 24; r += 0.5) { const x = Math.round(ZCX + Math.cos(ang) * r), y = Math.round(ZCY + Math.sin(ang) * r * 0.72); if (terra(x, y)) b.chao(x, y, t.trilha); }
  for (let y = ZCY - 5; y <= ZCY + 5; y++) for (let x = ZCX - 7; x <= ZCX + 7; x++) if (Math.hypot(x - ZCX, (y - ZCY) * 1.3) <= 5) b.chao(x, y, CH.REGOLITO);
  for (const [dx, dy] of [[-5, -2], [5, 2], [-4, 3], [4, -3]]) b.obj(ZCX + dx, ZCY + dy, 'cratera_meteoro');
  const pv = b.predio('ent_celeste', ZCX - 1, H - 5, 3, 2); m.saidas.push({ x: pv.porta.x, y: pv.porta.y, para: 'vale_celeste', tx: 0, ty: 0 });
  m.inicio = { x: ZCX, y: H - 9 }; m.renasce = { x: ZCX, y: H - 9 };
  b.placa(ZCX + 2, H - 8, `☄️ ZONA ${i + 1}: ${z[0].toUpperCase()} — níveis ${z[1]}. A Pedra Celestial cai na cratera do meio. O portal embaixo volta para a Praça Celestial.`);
  const mons = z[3].filter(id => MONSTROS[id]);
  for (let k = 0; k < 8; k++) { const ang = -Math.PI / 2 + (k + 0.5) * Math.PI / 4, x = Math.round(ZCX + Math.cos(ang) * 18), y = Math.round(ZCY + Math.sin(ang) * 12.5); if (y > H - 15) continue; if (mons.length && terra(x, y)) b.spawn(mons[k % mons.length], x, y, 3, 3); }
  if (t.lava) for (const [ox, oy] of [[-17, -5], [16, 6], [-10, 10], [12, -10]]) for (let y = ZCY + oy - 1; y <= ZCY + oy + 1; y++) for (let x = ZCX + ox - 2; x <= ZCX + ox + 2; x++) if (terra(x, y) && Math.abs(x - ZCX - ox) / 2.2 + Math.abs(y - ZCY - oy) <= 1.6 && m.chao[y * W + x] !== t.trilha && !m.spawns.some(sp => Math.hypot(sp.x - x, sp.y - y) < 3)) { b.chao(x, y, CH.MV_LAVA); b.obj(x, y, 'x'); }
  const P = valeProtegido(m);
  const livre = (x, y) => { const k = y * W + x; return terra(x, y) && !m.obj[k] && !P[k] && m.chao[k] !== t.trilha && m.chao[k] !== CH.REGOLITO && m.chao[k] !== CH.MV_LAVA; };
  for (const [dx, dy] of [[-9, -6], [9, 6], [-9, 6], [9, -6]]) { const x = ZCX + dx, y = ZCY + dy; if (t.meio.length && livre(x, y)) b.obj(x, y, t.meio[(rng() * t.meio.length) | 0]); }
  const juntoTrilha = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => m.chao[(y + dy) * W + x + dx] === t.trilha);
  for (let k = 0, n = 0; n < 72 && k < 3000; k++) { const x = 2 + ((rng() * (W - 4)) | 0), y = 2 + ((rng() * (H - 4)) | 0); if (!livre(x, y) || juntoTrilha(x, y)) continue; b.obj(x, y, t.props[(rng() * t.props.length) | 0]); n++; }
  valeGaranteCaminho(m);
  Object.assign(m, { valeZona: i, espaco: { tinta: 'rgba(120,80,255,0.05)' } });
  return m;
}
ZONAS_VALE.forEach((z, i) => { MAPAS_DEF['vale_z' + (i + 1)] = () => criaIlhaVale(i); });
// a volta de cada ilha cai na frente do portal certo, na praça
{
  const _getVale = getMapa;
  getMapa = function (id) {
    const m = _getVale.apply(this, arguments);
    if (/^vale_z\d$/.test(id) && !m._valeLig) { try { getMapa('vale_celeste'); } catch (e) { } const k = +id.slice(6) - 1, s = m.saidas.find(q => q.para === 'vale_celeste'), d = PRACA.portais[k]; if (s && d) { s.tx = d.x; s.ty = d.y; } m._valeLig = true; }
    return m;
  };
}
// cada portal abre quando o jogador chega no nível da zona
function liberaZonasVale() { const s = G.save; if (!s || !s.flags) return; ZONA_MIN.forEach((L, i) => { if (s.nivel >= L) s.flags['vale_z' + (i + 1)] = true; }); }
setInterval(() => { try { liberaZonasVale(); } catch (e) { } }, 2500);
{ const _iniVale = iniciarJogo; iniciarJogo = async function () { const r = await _iniVale.apply(this, arguments); try { liberaZonasVale(); } catch (e) { } return r; }; }
function zonaDe() { return G.mapa && G.mapa.valeZona != null ? G.mapa.valeZona : -1; }

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
  if (s && id === 'vale_celeste' && G.mapa && !/^vale_/.test(G.mapa.id)) s.voltaVale = { id: G.mapa.id, x: G.p ? G.p.x : null, y: G.p ? G.p.y + 1 : null };
  // v367: o vale mudou de desenho — a posição de um save antigo pode cair fora do chão: começa no lugar seguro
  if ((id === 'vale_celeste' || /^vale_z\d$/.test(id)) && x != null) {
    try { const mm = getMapa(id), k = Math.floor(y) * mm.w + Math.floor(x), o = mm.obj[k]; if (!(k >= 0 && k < mm.w * mm.h) || !CH_ANDA(mm.chao[k]) || mm.chao[k] === CH.ESTRELAS || (o && (o.t === 'x' || o.predio))) { arguments[1] = mm.inicio.x + 0.5; arguments[2] = mm.inicio.y + 0.5; } } catch (e) { }
  }
  const r = _entrarMapaVale.apply(this, arguments);
  if (/^vale_z\d$/.test(id)) iniciaQuedas();
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
function iniciaQuedas() { // v367: cada ilha tem a sua pedra; quem chega vê uma cair logo
  VALE.meteoros = []; const zi = zonaDe();
  VALE.zonas = zi >= 0 ? [{ i: zi, pedra: null, prox: G.agora + 6000 }] : [];
}
function caiPedra(z) {
  const pos = posLivre(ZCX, ZCY, 4);
  if (!pos) { z.prox = G.agora + 5000; return; }
  z.prox = Infinity; VALE.meteoros.push({ z, x: pos.x, y: pos.y, t0: G.agora, dur: 1400 });
}
function pousaPedra(met) {
  const k = met.z.i + 1; const sp = { m: 'pedra_' + k, x: Math.floor(met.x), y: Math.floor(met.y), qtd: 1, raio: 0, pedraCeleste: true };
  const m = criaMonstro(sp); if (!m) { met.z.prox = G.agora + 5000; return; }
  m.limiares = [0.75, 0.5, 0.25]; G.mons.push(m); met.z.pedra = m;
  efeito('explosao', m.x, m.y); som('explosao');
  if (zonaDe() === met.z.i) { banner('☄️ Uma Pedra Celestial caiu!', `${m.d.nome} · nível ${m.d.nivel}`); }
  log(`☄️ Uma ${m.d.nome} (nível ${m.d.nivel}) caiu na zona ${k}: ${ZONAS_VALE[met.z.i][0]}! Quebre com chutes para ganhar tesouros.`, 'l-xp');
}
const _atualizaVale = atualiza;
atualiza = function (dt) {
  const r = _atualizaVale.apply(this, arguments);
  const m = G.mapa; if (!m || m.valeZona == null || !VALE.zonas.length) return r;
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
    m.limiares.shift(); const z = zonaDe(); const mons = z >= 0 ? ZONAS_VALE[z][3].filter(id => MONSTROS[id]) : [];
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
