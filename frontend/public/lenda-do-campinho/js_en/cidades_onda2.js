/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🌍 CIDADES COM CARA PRÓPRIA (v408, Raio-X A7 — onda 2). O dono aprovou o piloto do Rio e pediu as outras no mesmo padrão:
   - TERMINAL DE CHEGADA com a arquitetura do país (arte nova Higgsfield, a/b_term_<cidade>_v408.webp — antes era o mesmo
     "AEROPORTO" em todas) e o largo da chegada com o PISO da cidade;
   - PISO PRÓPRIO de cada cidade (texturas novas *_v408): baldosas de Buenos Aires, lajes de Londres, mármore de Doha,
     lajes de granito de Tóquio, mosaico da Galleria em Milão, tijolinho em espinha em Madri, paralelepípedo em leque em
     Munique, granilite colorido em Miami; Lisboa ganha a pedra portuguesa SUAVE do Rio; Paris continua no paralelepípedo,
     Cairo no arenito, Santos na pedra portuguesa suave (o calçadão de bolinhas continua na orla);
   - MONUMENTOS em escala de marco (~1,5–1,8× maiores), sem o quadrado cinza: o chão em volta vira o da cidade (praça) ou o
     natural (grama/areia), com um caminho até eles;
   - PRAÇAS VAZIAS preenchidas: os maiores pedaços de calçada sem nada viram pracinhas (piso da cidade, árvore típica nos
     cantos, fonte no meio, bancos e a feirinha local: churros em Madri, gelato em Milão, pretzel em Munique, máquina de
     bebidas em Tóquio, coluna de cartazes em Paris, banco de azulejo em Lisboa, a fonte do bule dourado em Doha...).
   CRIVO DE MAPAS: enfeite só em quadro livre de calçada, fora de zona de caça, longe de porta/NPC/placa/saída/ponto/spawn,
   fora da frente das portas e do desenho dos prédios; se algum caminho fechar, o último enfeite sai (alcancaveis).
   Prefixo: o2c. Carregar DEPOIS de rio_piloto.js (embrulha MAPAS_DEF das cidades por último).
   ============================================================ */
/* ---------- pisos novos ---------- */
const O2C_PISOS = [ // [nome do CH, id, textura, quadros que a textura t2 cobre, cor média]
  ['BALDOSA_BA', 141, 'baldosa_v408', 2.6, '#d2bf9c'], ['LAJE_LONDRES', 142, 'laje_londres_v408', 3.6, '#b5b0aa'],
  ['MARMORE_DOHA', 143, 'marmore_doha_v408', 4, '#d2cdc1'], ['LAJE_TOQUIO', 144, 'laje_toquio_v408', 4.2, '#b8b5b3'],
  ['MOSAICO_MILAO', 145, 'mosaico_milao_v4081', 3.6, '#d4b194'] /* v408.1 (dono: "piso de Milão claro demais"): mais quente e com contraste médio */, ['TIJOLO_MADRI', 146, 'tijolo_madri_v408', 3.4, '#b18877'],
  ['LEQUE_MUNIQUE', 147, 'leque_munique_v408', 3, '#b0a8a2'], ['TERRAZZO_MIAMI', 148, 'terrazzo_miami_v408', 4, '#e6dfd5'],
];
for (const [k, id, tex, n, cor] of O2C_PISOS) {
  CH[k] = id;
  if (typeof ESTILO_CHAO !== 'undefined' && ESTILO_CHAO[CH.PARALELO]) ESTILO_CHAO[id] = Object.assign({}, ESTILO_CHAO[CH.PARALELO], { cor, borda: '#7a7064', o: (ESTILO_CHAO[CH.PARALELO].o || 6.6) + (id - 140) * 0.01 });
  if (typeof TEX_CHAO !== 'undefined') TEX_CHAO[id] = 't_' + tex;
  if (!ASSET_SET.has('t_' + tex)) { ASSETS.push('t_' + tex); ASSET_SET.add('t_' + tex); } // (o desenho do chão das cidades só espera as texturas da lista)
  if (typeof CH_MINI !== 'undefined') CH_MINI[id] = cor;
  if (typeof CHAO2 !== 'undefined') { CHAO2.tex[id] = ['t2_' + tex, n]; CHAO2.piso.add(id); }
}
// a pedra portuguesa suave do Rio (rio_piloto.js) agora também em Lisboa e Santos: entra na lista para o chão esperar por ela
if (typeof TEX_CHAO !== 'undefined' && TEX_CHAO[CH.CALCADA_PT_SUAVE] && !ASSET_SET.has(TEX_CHAO[CH.CALCADA_PT_SUAVE])) { ASSETS.push(TEX_CHAO[CH.CALCADA_PT_SUAVE]); ASSET_SET.add(TEX_CHAO[CH.CALCADA_PT_SUAVE]); }
/* ---------- arte nova: terminais e enfeites ---------- */
const O2C_TERM = ['santos', 'buenos', 'lisboa', 'madri', 'paris', 'milao', 'munique', 'londres', 'cairo', 'doha', 'toquio', 'miami'];
for (const c of O2C_TERM) { const n = `b_term_${c}_v408`; if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } PORTAS[n] = { x: 0.5, y: 0.955 }; }
const O2C_OBJ = { carrinho_churros: 1.25, maquina_bebidas: 0.95, coluna_morris: 0.7, banco_azulejo: 1.4, carrinho_gelato: 1.3, fonte_dallah: 2.2, banca_filete: 1.3, banca_papiro: 1.5 };
for (const [n, w] of Object.entries(O2C_OBJ)) { OBJ_INFO[n] = { w, b: 1 }; OBJ_BLOQUEIA.add(n); if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } }
if (typeof OBJ_MINI !== 'undefined') Object.assign(OBJ_MINI, { carrinho_churros: '#c84a2a', maquina_bebidas: '#9ac8f0', coluna_morris: '#2a5a3a', banco_azulejo: '#3a6ac8', carrinho_gelato: '#7ac8a0', fonte_dallah: '#d8a83a', banca_filete: '#2a6a4a', banca_papiro: '#c8a060' });

/* ---------- o jeito de cada cidade ----------
   piso: chão das praças, do largo do terminal e da volta dos monumentos; arv: árvore típica; banco; centro: peça do meio da praça;
   feira: barraquinhas e enfeites da beirada; boas: placa de boas-vindas (curta, para crianças) */
const O2C_CID = {
  santos: { piso: CH.CALCADA_PT_SUAVE, // (o calçadão de bolinhas fica só na orla: nas praças ficava forte demais)
    arv: 'coqueiro', banco: 'banco_jardim', centro: 'chafariz', feira: ['carrinho_caldo', 'sacas_cafe', 'banca_coco', 'carrinho_flores'],
    boas: '🇧🇷 WELCOME TO SANTOS! The city of King Pelé, of the coffee port and of the world’s biggest beachfront garden.' },
  buenos: { piso: CH.BALDOSA_BA, arv: 'ipe_roxo', banco: 'banco_jardim', centro: 'chafariz', feira: ['banca_empanada', 'banca_filete', 'carrinho_flores', 'mesa_cafe'],
    boas: '🇦🇷 ¡BIENVENIDO A BUENOS AIRES! The sidewalks have "baldosas" made of little squares, and the purple trees are jacarandas.' },
  lisboa: { piso: CH.CALCADA_PT_SUAVE, arv: 'ipe_roxo', banco: 'banco_azulejo', centro: 'chafariz', feira: ['barraca_pastel', 'carrinho_flores', 'banca_jornal', 'mesa_cafe'],
    boas: '🇵🇹 BEM-VINDO A LISBOA! Welcome to Lisbon! Portuguese pavement was born here, and the benches are decorated with blue tiles.' },
  madri: { piso: CH.TIJOLO_MADRI, arv: 'arvore', banco: 'banco_jardim', centro: 'fonte_italiana', feira: ['carrinho_churros', 'carrinho_flores', 'banca_jornal', 'mesa_cafe'],
    boas: '🇪🇸 ¡BIENVENIDO A MADRID! Try churros with hot chocolate: it\'s the city\'s favorite snack.' },
  paris: { piso: CH.PARALELO, arv: 'arvore', banco: 'banco_jardim', centro: 'chafariz', feira: ['carrinho_crepe', 'coluna_morris', 'banca_livros', 'carrinho_flores', 'cavalete', 'mesa_cafe'],
    boas: '🇫🇷 BIENVENUE À PARIS! The green columns covered in posters tell you what\'s on at the theaters and circuses in town.' },
  milao: { piso: CH.MOSAICO_MILAO, arv: 'cipreste', banco: 'banco_jardim', centro: 'fonte_italiana', feira: ['carrinho_gelato', 'mesa_italiana', 'vespa', 'carrinho_flores'],
    boas: '🇮🇹 BENVENUTO A MILANO! Welcome to Milan! The mosaic floor looks like the Galleria, and the gelato here is famous all over the world.' },
  munique: { piso: CH.LEQUE_MUNIQUE, arv: 'pinheiro', banco: 'banco_jardim', centro: 'chafariz', feira: ['banca_pretzel', 'mesa_bavara', 'bicicleta', 'carrinho_flores'],
    boas: '🇩🇪 WILLKOMMEN IN MÜNCHEN! Welcome to Munich! The little paving stones make fan-shaped patterns, and pretzels are the snack of the square.' },
  londres: { piso: CH.LAJE_LONDRES, arv: 'arvore', banco: 'banco_jardim', centro: 'chafariz', feira: ['cabine', 'banca_jornal', 'carrinho_flores', 'mesa_cafe'],
    boas: '🇬🇧 WELCOME TO LONDON! The red phone booths and the double-decker buses are the face of the city.' },
  cairo: { piso: CH.ARENITO, arv: 'palmeira_tamara', banco: 'banco', centro: 'chafariz', feira: ['banca_papiro', 'tenda_mercado', 'pilha_especiarias', 'jarros'],
    boas: '🇪🇬 WELCOME TO CAIRO! The ancient Egyptians made their paper from papyrus, the plant that grows along the Nile.' },
  doha: { piso: CH.MARMORE_DOHA, arv: 'palmeira_real', banco: 'banco_jardim', centro: 'fonte_dallah', feira: ['lanterna_arabe', 'pilha_especiarias', 'arara_tapetes', 'tenda_mercado'],
    boas: '🇶🇦 WELCOME TO DOHA! The golden pot on the fountain is the "dallah", the coffee pot people use to serve guests.' },
  toquio: { piso: CH.LAJE_TOQUIO, arv: 'cerejeira', banco: 'banco_jardim', centro: 'chafariz', feira: ['maquina_bebidas', 'lanterna_papel', 'bonsai', 'lanterna_pedra'],
    boas: '🇯🇵 WELCOME TO TOKYO! There\'s a drink vending machine on almost every corner here, and the cherry trees bloom in spring.' },
  miami: { piso: CH.TERRAZZO_MIAMI, arv: 'palmeira_real', banco: 'banco_jardim', centro: 'fonte_moderna', feira: ['carrinho_hotdog', 'flamingo', 'carrinho_flores', 'cadeira_sol'],
    boas: '🇺🇸 WELCOME TO MIAMI! The colorful buildings with rounded corners are in the "Art Deco" style.' },
};

/* ---------- monumentos em escala de marco (base nova em quadros; o desenho cresce junto) ---------- */
const O2C_MON = {
  mon_esfinge: { w: 11, h: 5 }, mon_toquio: { w: 8, h: 4 }, mon_doha: { w: 10, h: 5 }, mon_miami: { w: 6, h: 4 }, mon_belem: { w: 8, h: 5 },
  mon_alcala: { w: 11, h: 4 }, mon_duomo: { w: 11, h: 5 }, mon_rathaus: { w: 9, h: 5 }, mon_bigben: { w: 6, h: 4 },
  mon_eiffel: { w: 9, h: 5 }, mon_arco: { w: 9, h: 5 }, mon_louvre: { w: 12, h: 5 }, mon_notredame: { w: 8, h: 5 }, mon_obelisco: { w: 5, h: 4 },
  mon_pele: { w: 4, h: 3 }, mon_bolsa_cafe: { w: 7, h: 4 }, // (os Prédios Tortos de Santos ficam do tamanho de antes: maiores, caíam em cima da rua)
};
if (typeof MONUMENTOS !== 'undefined') for (const id of O2C_TERM) for (const d of (MONUMENTOS[id] || [])) {
  const n = O2C_MON[d.spr]; if (!n) continue;
  Object.assign(d, n);
  const W = d.w + 0.5, H = W * d.ar; // (mesma conta de monumentos.js)
  PORTAS[d.spr] = { x: d.w % 2 ? 0.5 : 0.5 + 0.5 / W, y: 1 - 0.3 / H };
  d.alto = Math.max(0, Math.ceil(H * 0.97 - d.h));
}

/* ---------- as praças que cada cidade desenha (K.praca) ficam anotadas no mapa ---------- */
if (typeof kitCidade === 'function') {
  const _kitO2c = kitCidade;
  kitCidade = function (b, c) {
    const K = _kitO2c.apply(this, arguments), _praca = K.praca;
    K.praca = function (x, y, w, h) { (b.m._o2cPracaK = b.m._o2cPracaK || []).push([x, y, w, h]); return _praca.apply(this, arguments); };
    return K;
  };
}
/* ---------- embrulha o mapa de cada cidade (depois de tudo: monumentos, ambiente, Rio piloto...) ---------- */
for (const id of O2C_TERM) {
  const base = MAPAS_DEF[id]; if (!base) continue;
  MAPAS_DEF[id] = function () {
    const m = base.apply(this, arguments);
    try { o2cArruma(m, id); } catch (e) { console.error('cities wave 2', id, e); }
    return m;
  };
}

function o2cArruma(m, id) {
  if (m._o2c) return; m._o2c = true;
  const C = O2C_CID[id]; if (!C) return;
  const W = m.w, H = m.h, i = (x, y) => y * W + x, dentro = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1;
  const PAV = new Set([CH.CALCADA, CH.PEDRA, CH.PARALELO, CH.CONCRETO, CH.CALCADA_PT, CH.CALCADA_PT_SUAVE, CH.ARENITO, C.piso]);
  // Lisboa: a pedra portuguesa da cidade inteira fica suave (a do Rio, aprovada pelo dono)
  if (id === 'lisboa') for (let k = 0; k < m.chao.length; k++) if (m.chao[k] === CH.CALCADA_PT) m.chao[k] = CH.CALCADA_PT_SUAVE;
  // 1) o terminal com a cara do país
  const ae = m.predios.find(p => p.spr === 'b_aeroporto');
  if (ae) ae.spr = `b_term_${id}_v408`;
  // o baú do armazém ficava bem na frente da porta do terminal: vai para o lado, encostado no prédio
  const arm = ae && m.pontos.find(p => p.tipo === 'armazem' && Math.abs(p.x - (ae.porta ? ae.porta.x : ae.x + 4)) <= 1 && p.y >= ae.y + ae.h - 1 && p.y <= ae.y + ae.h + 1);
  if (arm) {
    const ini0 = m.renasce || m.inicio, imp0 = pontosImportantes(m).filter(pt => !(pt.x === arm.x && pt.y === arm.y));
    for (const [x, y] of [[ae.x + ae.w + 1, ae.y + ae.h], [ae.x - 2, ae.y + ae.h], [ae.x + ae.w, ae.y + ae.h + 1], [ae.x + ae.w, ae.y + ae.h - 1], [ae.x - 1, ae.y + ae.h - 1]]) {
      if (!dentro(x, y) || m.obj[i(x, y)] || !CH_ANDA(m.chao[i(x, y)]) || m.chao[i(x, y)] === CH.AGUA || m.npcs.some(n => Math.abs(n.x - x) <= 1 && Math.abs(n.y - y) <= 1)) continue;
      m.obj[i(arm.x, arm.y)] = null; m.obj[i(x, y)] = { t: 'bau', v: 1 }; const vx = arm.x, vy = arm.y; arm.x = x; arm.y = y;
      const d = alcancaveis(m, ini0);
      if (d[(y + 1) * W + x] && imp0.every(pt => d[pt.y * W + pt.x] || (pt.x === x && pt.y === y))) break;
      m.obj[i(x, y)] = null; arm.x = vx; arm.y = vy; m.obj[i(vx, vy)] = { t: 'bau', v: 1 };
    }
  }
  // 2) monumentos: sem o quadrado cinza — praça com o piso da cidade, ou o chão natural (grama/areia) com um caminho até a placa
  for (const p of m.predios.filter(p => p.monumento)) {
    const x0 = p.x - 2, x1 = p.x + p.w + 1, y0 = p.y - 1, y1 = p.y + p.h + 1, conta = {};
    for (let y = y0 - 2; y <= y1 + 2; y++) for (let x = x0 - 2; x <= x1 + 2; x++) if (dentro(x, y) && (x < x0 || x > x1 || y < y0 || y > y1)) { const c = m.chao[i(x, y)]; if (c !== CH.ASFALTO && c !== CH.AGUA) conta[c] = (conta[c] || 0) + 1; }
    const viz = +Object.keys(conta).sort((a, b) => conta[b] - conta[a])[0];
    const natural = viz === CH.GRAMA || viz === CH.GRAMA_FLOR || viz === CH.AREIA ? viz : null;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (dentro(x, y) && (m.chao[i(x, y)] === CH.PEDRA || m.chao[i(x, y)] === CH.CALCADA)) m.chao[i(x, y)] = natural != null ? natural : C.piso;
    if (natural == null) { // a praça calçada em volta (o mesmo chão, até 8 quadros) vira o piso da cidade
      const vis = new Uint8Array(W * H), fila = [];
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (dentro(x, y) && m.chao[i(x, y)] === C.piso) { vis[i(x, y)] = 1; fila.push(x, y); }
      for (let k = 0; k < fila.length; k += 2) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = fila[k] + dx, b = fila[k + 1] + dy; if (!dentro(a, b) || vis[i(a, b)] || a < x0 - 8 || a > x1 + 8 || b < y0 - 8 || b > y1 + 8) continue;
        const c = m.chao[i(a, b)]; if (c !== CH.PEDRA && c !== CH.CALCADA && c !== C.piso) continue; vis[i(a, b)] = 1; m.chao[i(a, b)] = C.piso; fila.push(a, b);
      }
    }
    if (natural != null) { // um caminho (3 quadros) da frente do monumento até a calçada ou a rua mais perto, pelo chão natural
      const nat = c => c === natural || ((natural === CH.GRAMA || natural === CH.GRAMA_FLOR) && (c === CH.GRAMA || c === CH.GRAMA_FLOR));
      const px = p.porta ? p.porta.x : p.x + (p.w >> 1), sy = p.y + p.h + 1, pai = new Int32Array(W * H).fill(-1), fila = [px, sy];
      let fim = -1; if (dentro(px, sy)) pai[i(px, sy)] = i(px, sy);
      for (let k = 0; k < fila.length && fim < 0; k += 2) {
        const x = fila[k], y = fila[k + 1];
        for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
          const a2 = x + dx, b2 = y + dy; if (!dentro(a2, b2) || pai[i(a2, b2)] >= 0 || Math.abs(a2 - px) + Math.abs(b2 - sy) > 16) continue;
          if (b2 >= p.y - 1 && b2 < sy && a2 >= p.x - 2 && a2 <= p.x + p.w + 1) continue; // (não passa por cima do monumento)
          const c = m.chao[i(a2, b2)]; if (c === CH.AGUA) continue; pai[i(a2, b2)] = i(x, y);
          if (!nat(c) && c !== C.piso && CH_ANDA(c)) { fim = i(a2, b2); break; }
          fila.push(a2, b2);
        }
      }
      if (fim >= 0) for (let k = pai[fim]; k >= 0; k = pai[k] === k ? -1 : pai[k]) { const x = k % W, y = (k / W) | 0; for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0]]) if (dentro(x + dx, y + dy) && nat(m.chao[i(x + dx, y + dy)])) m.chao[i(x + dx, y + dy)] = C.piso; if (pai[k] === k) break; }
      for (let x = px - 1; x <= px + 1; x++) if (dentro(x, p.y + p.h) && nat(m.chao[i(x, p.y + p.h)])) m.chao[i(x, p.y + p.h)] = C.piso;
    }
  }
  // 3) o que precisa ficar livre
  const inicio = m.renasce || m.inicio || { x: W >> 1, y: H >> 1 };
  const antes = alcancaveis(m, inicio), importantes = pontosImportantes(m).filter(pt => antes[pt.y * W + pt.x]);
  const proibido = new Uint8Array(W * H);
  const marca = (x0, y0, x1, y1) => { for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) proibido[i(x, y)] = 1; };
  for (const n of m.npcs) marca(n.x - 2, n.y - 2, n.x + 2, n.y + 2);
  for (const s of m.saidas) marca(s.x - 2, s.y - 2, s.x + 2, s.y + 2);
  for (const p of m.placas) marca(p.x - 1, p.y - 1, p.x + 1, p.y + 1);
  for (const p of m.pontos) marca(p.x - 2, p.y - 2, p.x + 2, p.y + 2);
  for (const s of m.spawns) { const r = (s.raio || 1) + 2; marca(s.x - r, s.y - r, s.x + r, s.y + r); }
  for (const c of m.campos) marca(c.x - 1, c.y - 1, c.x + c.w, c.y + c.h);
  for (const p of [m.inicio, m.renasce]) if (p) marca(p.x - 2, p.y - 2, p.x + 2, p.y + 2);
  for (const p of m.predios) {
    const alto = p.alto != null ? p.alto : Math.max(2, Math.round(p.w * 1.1 - p.h)); // o desenho do prédio sobe acima da pegada
    marca(p.x - 1, p.y - alto, p.x + p.w, p.y + p.h);
    if (p.porta) marca(p.porta.x - 1, p.porta.y, p.porta.x + 1, p.porta.y + 4); // a frente da porta fica aberta
  }
  if (m.lotes && m.lotes.ct) marca(m.lotes.ct.x - 1, m.lotes.ct.y - 1, m.lotes.ct.x + 12, m.lotes.ct.y + 5); // o centro de treino
  const proibidoZ = proibido.slice(); // (a beirada das zonas de caça usa esta: sem a zona, com os grupos)
  for (const z of (m.zonas || [])) marca(z.x - 1, z.y - 1, z.x + z.w, z.y + z.h);
  // 4) as pracinhas
  const ok = (x, y, mask = proibido) => dentro(x, y) && !mask[i(x, y)] && !m.obj[i(x, y)] && PAV.has(m.chao[i(x, y)]);
  const postos = [];
  const poe = (x, y, t, larg = 1, mask = proibido) => {
    const meia = larg >> 1;
    for (let k = -meia; k <= meia; k++) if (!ok(x + k, y, mask)) return false;
    m.obj[i(x, y)] = { t, v: (hash2(x, y) * 1000) | 0 }; const tiles = [i(x, y)];
    for (let k = 1; k <= meia; k++) { m.obj[i(x - k, y)] = { t: 'x', v: 0 }; m.obj[i(x + k, y)] = { t: 'x', v: 0 }; tiles.push(i(x - k, y), i(x + k, y)); }
    postos.push(tiles); return true;
  };
  const confere = () => { let d = alcancaveis(m, inicio); while (postos.length && !importantes.every(pt => d[pt.y * W + pt.x])) { for (const k of postos.pop()) m.obj[k] = null; d = alcancaveis(m, inicio); } postos.length = 0; };
  const pinta = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (dentro(x, y) && PAV.has(m.chao[i(x, y)])) m.chao[i(x, y)] = C.piso; };
  const feira = C.feira, arv = C.arv; let nf = 0;
  const reg = (x0, y0, w, h, tipo) => (m._o2cPracas = m._o2cPracas || []).push([tipo, x0, y0, w, h]);
  // uma praça: árvore típica nos cantos, a peça do meio, bancos virados para ela, canteiros, a feirinha na beirada de baixo e vasos na de cima
  const decora = (x0, y0, w, h, comCentro = true) => {
    const cx = x0 + (w >> 1), cy = y0 + (h >> 1);
    if (comCentro && w >= 9 && h >= 7) poe(cx, cy, C.centro, 3);
    for (const [x, y] of [[x0, y0], [x0 + w - 1, y0], [x0, y0 + h - 1], [x0 + w - 1, y0 + h - 1]]) poe(x, y, arv);
    if (w >= 11) { poe(cx - 4, cy, C.banco) || poe(cx - 4, cy + 1, C.banco); poe(cx + 4, cy, C.banco) || poe(cx + 4, cy + 1, C.banco); } else if (h >= 5) { poe(x0, cy, C.banco); poe(x0 + w - 1, cy, C.banco); }
    if (h >= 7 && w >= 9) { poe(cx - 2, cy - 2, 'canteiro'); poe(cx + 2, cy - 2, 'canteiro'); }
    { const n = Math.min(5, Math.floor((w - 3) / 3)), passo = (w - 4) / Math.max(1, n); for (let k = 0; k < n; k++) poe(Math.round(x0 + 2 + passo * (k + 0.5)), y0 + h - 1, feira[nf++ % feira.length]); } // (no máximo 5 barraquinhas, espalhadas)
    if (w >= 12) for (let x = x0 + 3; x <= x0 + w - 4; x += 4) poe(x, y0, 'palmeira_vaso');
    confere();
  };
  // 4a) as praças desenhadas no mapa (lojas e missões): o piso da cidade e o que faltava em volta da gente
  const FONTES = new Set(['chafariz', 'fonte_moderna', 'fonte_italiana', 'fonte_dallah', 'torii', 'coreto']);
  for (const [x0, y0, w, h] of (m._o2cPracaK || [])) {
    pinta(x0, y0, w, h);
    let temFonte = false; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const o = m.obj[i(x, y)]; if (o && FONTES.has(o.t)) { temFonte = true; if (C.centro === 'fonte_dallah' && /^(chafariz|fonte_moderna)$/.test(o.t)) o.t = 'fonte_dallah'; } } // (Doha: a fonte da praça vira a do bule dourado)
    decora(x0 + 1, y0 + 1, w - 2, h - 2, !temFonte); reg(x0, y0, w, h, 'praca');
    marca(x0, y0, x0 + w - 1, y0 + h - 1);
  }
  // 4b) o largo do terminal: só o quarteirão dele (o mesmo chão da chegada), com o piso da cidade; a frente da porta fica livre até a rua
  if (ae) {
    const ch0 = m.chao[i(inicio.x, inicio.y)], vis = new Uint8Array(W * H), fila = [inicio.x, inicio.y]; vis[i(inicio.x, inicio.y)] = 1;
    let rx0 = W, ry0 = H, rx1 = 0, ry1 = 0;
    for (let k = 0; k < fila.length; k += 2) {
      const x = fila[k], y = fila[k + 1]; rx0 = Math.min(rx0, x); rx1 = Math.max(rx1, x); ry0 = Math.min(ry0, y); ry1 = Math.max(ry1, y);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = x + dx, b = y + dy;
        if (!dentro(a, b) || vis[i(a, b)] || a < ae.x - 8 || a > ae.x + ae.w + 8 || b < ae.y - 3 || b > ae.y + ae.h + 12) continue;
        if (m.chao[i(a, b)] !== ch0) continue; vis[i(a, b)] = 1; fila.push(a, b);
      }
    }
    if (PAV.has(ch0)) for (let k = 0; k < vis.length; k++) if (vis[k]) m.chao[k] = C.piso;
    if (ae.porta) marca(ae.porta.x - 1, ae.porta.y, ae.porta.x + 1, ry1);
    const yb = ae.y + ae.h + 1;
    if (ry1 - yb >= 3) { decora(rx0 + 1, yb, rx1 - rx0 - 1, ry1 - yb, false); reg(rx0, yb, rx1 - rx0, ry1 - yb, 'terminal'); }
    // dos lados do prédio: só uma árvore típica em cada canto de fora (o resto fica livre para andar)
    for (const [x, y] of [[rx0 + 1, ry0 + 1], [rx1 - 1, ry0 + 1]]) if (Math.abs(x - ae.x - ae.w / 2) > ae.w / 2 + 2) poe(x, y, arv);
    confere();
    marca(rx0, ry0, rx1, ry1);
  }
  // 4c) as zonas de caça calmas (não as das torcidas): o piso da cidade e enfeites só na beirada de dentro, longe dos grupos
  for (const z of (m.zonas || [])) {
    if (z.hostil) continue;
    let pav = 0; for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.w; x++) if (dentro(x, y) && PAV.has(m.chao[i(x, y)])) pav++;
    if (pav < z.w * z.h * 0.6) continue; // (zona de grama, areia ou mata: fica como está)
    pinta(z.x, z.y, z.w, z.h);
    const borda = [];
    for (let x = z.x + 1; x < z.x + z.w - 1; x += 4) borda.push([x, z.y + 1], [x, z.y + z.h - 2]);
    for (let y = z.y + 4; y < z.y + z.h - 3; y += 4) borda.push([z.x + 1, y], [z.x + z.w - 2, y]);
    let k = 0; for (const [x, y] of borda) poe(x, y, k++ % 3 === 0 ? feira[nf++ % feira.length] : arv, 1, proibidoZ);
    confere(); reg(z.x, z.y, z.w, z.h, 'zona');
  }
  // 4d) os maiores pedaços de calçada sem nada viram pracinhas
  const maiorRet = () => { // maior retângulo de quadros "ok" (histograma por linha)
    const alt = new Int16Array(W); let best = null;
    for (let y = 1; y < H - 1; y++) {
      for (let x = 0; x < W; x++) alt[x] = ok(x, y) ? alt[x] + 1 : 0;
      const pilha = [];
      for (let x = 0; x <= W; x++) {
        const h = x < W ? alt[x] : 0; let ini = x;
        while (pilha.length && pilha[pilha.length - 1][1] >= h) {
          const [px, ph] = pilha.pop(); const w = x - px;
          if (ph >= 6 && w >= 8) { const a = Math.min(w, 18) * Math.min(ph, 12); if (!best || a > best.a) best = { a, x: px, y: y - ph + 1, w, h: ph }; }
          ini = px;
        }
        pilha.push([ini, h]);
      }
    }
    return best;
  };
  for (let n = 0; n < 6; n++) {
    const r = maiorRet(); if (!r || r.a < 48) break;
    const w = Math.min(r.w, 18), h = Math.min(r.h, 12), x0 = r.x + ((r.w - w) >> 1), y0 = r.y + ((r.h - h) >> 1);
    pinta(x0, y0, w, h); decora(x0 + 1, y0 + 1, w - 2, h - 2, true); reg(x0, y0, w, h, 'nova');
    marca(r.x - 1, r.y - 1, r.x + r.w, r.y + r.h); // (esse pedaço já foi)
  }
  // 5) a placa de boas-vindas no largo do terminal (texto curto, para crianças)
  if (ae) {
    const livre = (x, y) => dentro(x, y) && !m.obj[i(x, y)] && CH_ANDA(m.chao[i(x, y)]) && m.chao[i(x, y)] !== CH.AGUA && !m.npcs.some(n => Math.abs(n.x - x) <= 1 && Math.abs(n.y - y) <= 1)
      && !m.pontos.some(n => Math.abs(n.x - x) <= 1 && Math.abs(n.y - y) <= 1) && !(Math.abs(x - inicio.x) <= 1 && Math.abs(y - inicio.y) <= 1) && !m.placas.some(p => Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1);
    if (!m.placas.some(p => p.texto === C.boas)) for (const [x, y] of [[ae.x - 1, ae.y + ae.h + 1], [ae.x + ae.w, ae.y + ae.h + 1], [ae.x - 1, ae.y + ae.h + 2], [ae.x + ae.w, ae.y + ae.h + 2], [ae.x - 2, ae.y + ae.h], [ae.x + ae.w + 1, ae.y + ae.h]]) if (livre(x, y)) {
      m.obj[i(x, y)] = { t: 'placa', v: 1 }; m.placas.push({ x, y, texto: C.boas });
      const d = alcancaveis(m, inicio); if (importantes.every(pt => d[pt.y * W + pt.x])) break;
      m.obj[i(x, y)] = null; m.placas.pop();
    }
  }
  // v408.1: as praças sem nada ganham grupinhos (o2cPreenche, no fim do arquivo)
  try { o2cPreenche(m, C, (m._o2cPracas || []).map(r => r.slice(1).concat(r[0] === 'zona' ? [1] : [])), id); } catch (e) { console.error('full squares', id, e); }
  delete m._chao; delete m._chaoV; // o chão mudou
}

/* ---------- quem salvou num lugar que agora tem enfeite (ou virou mar, na Vila) volta para a chegada do mapa ---------- */
{
  const _iniciarJogoO2c = iniciarJogo;
  iniciarJogo = async function (save, ...resto) {
    try {
      if (save && (save.mapa === 'vila' || O2C_TERM.includes(save.mapa)) && typeof tileBloqueado === 'function') {
        const mp = getMapa(save.mapa), x = Math.floor(save.x), y = Math.floor(save.y);
        if (mp && (!(x >= 0 && y >= 0 && x < mp.w && y < mp.h) || tileBloqueado(mp, x, y))) { const p = mp.renasce || mp.inicio; if (p) { save.x = p.x + 0.5; save.y = p.y + 0.5; } }
      }
    } catch (e) { console.warn('cities wave 2: position', e); }
    return _iniciarJogoO2c.call(this, save, ...resto);
  };
}

/* ============================================================
   🧺 PRAÇAS CHEIAS (v408.1, dono: "melhore as praças vazias" — a pior era Milão, um branco enorme com pouca coisa).
   Depois de tudo pronto, cada praça (a das lojas, o largo do terminal e as pracinhas novas) é varrida: todo pedaço de
   4×4 quadros sem nada nas praças pequenas, 5×5 nas grandes (6×6 no resto da calçada, 7×7 nas zonas de caça calmas) ganha um GRUPINHO de 3 quadros numa fileira só (sobra sempre corredor para andar):
   mesinhas de café com gente, jardim (canteiros + estátua ou árvore), feirinha local com freguês, banca/poste/bicicletário,
   vizinhos conversando perto de um banco. Crivo: nada perto de NPC/porta/placa/saída/ponto/spawn/chegada, nada na
   frente das portas nem no desenho dos prédios; se algum caminho fechar, o grupinho sai (alcancaveis).
   ============================================================ */
const O2C_CAFE = { milao: 'mesa_italiana', munique: 'mesa_bavara' };
function o2cPreenche(m, C, rects, id) {
  if (typeof vbmFigurante !== 'function') return 0; rects = rects || [];
  const W = m.w, H = m.h, i = (x, y) => y * W + x, dentro = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1;
  const PAV = new Set([CH.CALCADA, CH.PEDRA, CH.PARALELO, CH.CONCRETO, CH.CALCADA_PT, CH.CALCADA_PT_SUAVE, CH.ARENITO, CH.CALCADA_SANTOS, C.piso]);
  const inicio = m.renasce || m.inicio || { x: W >> 1, y: H >> 1 };
  const antes = alcancaveis(m, inicio), importantes = pontosImportantes(m).filter(pt => antes[pt.y * W + pt.x]);
  const mask = new Uint8Array(W * H);
  const marca = (x0, y0, x1, y1) => { for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) mask[i(x, y)] = 1; };
  for (const n of m.npcs) marca(n.x - 2, n.y - 2, n.x + 2, n.y + 2);
  for (const s of m.saidas) marca(s.x - 2, s.y - 2, s.x + 2, s.y + 2);
  for (const p of m.placas) marca(p.x - 1, p.y - 1, p.x + 1, p.y + 1);
  for (const p of m.pontos) marca(p.x - 2, p.y - 2, p.x + 2, p.y + 2);
  for (const s of m.spawns) { const r = (s.raio || 1) + 2; marca(s.x - r, s.y - r, s.x + r, s.y + r); }
  for (const z of (m.zonas || [])) if (z.hostil || /torcida|arquibancada/i.test(z.nome || '')) marca(z.x - 1, z.y - 1, z.x + z.w, z.y + z.h);
  for (const c of m.campos) marca(c.x - 1, c.y - 1, c.x + c.w, c.y + c.h);
  marca(inicio.x - 2, inicio.y - 2, inicio.x + 2, inicio.y + 2);
  for (const p of m.predios) {
    const alto = p.alto != null ? p.alto : Math.max(2, Math.round(p.w * 1.1 - p.h));
    marca(p.x - 1, p.y - alto, p.x + p.w, p.y + p.h);
    if (p.porta) marca(p.porta.x - 1, p.porta.y, p.porta.x + 1, p.porta.y + 4);
  }
  if (m.lotes && m.lotes.ct) marca(m.lotes.ct.x - 1, m.lotes.ct.y - 1, m.lotes.ct.x + 12, m.lotes.ct.y + 5);
  const vazio = (x, y) => dentro(x, y) && !mask[i(x, y)] && !m.obj[i(x, y)] && PAV.has(m.chao[i(x, y)]);
  const postos = [];
  const poe = (x, y, t) => { if (!vazio(x, y)) return false; m.obj[i(x, y)] = { t, v: (hash2(x, y) * 1000) | 0 }; postos.push([i(x, y)]); return true; };
  const gente = (x, y, o) => { if (!vazio(x, y)) return false; vbmFigurante(m, x, y, Object.assign({ semente: x * 97 + y * 13 + id.length }, o)); postos.push([i(x, y)]); return true; };
  const confere = () => { let d = alcancaveis(m, inicio); while (postos.length && !importantes.every(pt => d[pt.y * W + pt.x])) { for (const k of postos.pop()) m.obj[k] = null; d = alcancaveis(m, inicio); } postos.length = 0; };
  const feira = C.feira || ['carrinho_flores'], cafe = O2C_CAFE[id] || 'mesa_cafe', arv = C.arv || 'arvore', banco = C.banco || 'banco_jardim';
  let nf = 0, n = 0;
  const GRUPOS = [
    (x, y) => { poe(x - 1, y, cafe); gente(x, y, { lado: true, vira: true }); poe(x + 1, y, cafe); },                          // café na calçada
    (x, y) => { poe(x - 1, y, 'canteiro'); poe(x, y, hash2(x, y) < 0.5 ? 'estatua_jardim' : arv); poe(x + 1, y, 'canteiro'); }, // jardinzinho
    (x, y) => { poe(x - 1, y, feira[nf++ % feira.length]); gente(x, y, {}); poe(x + 1, y, feira[nf++ % feira.length]); },        // feirinha com freguês
    (x, y) => { poe(x - 1, y, 'banca_jornal'); poe(x, y, 'poste3'); poe(x + 1, y, 'bicicletario'); },                            // banca, poste e bicicletas
    (x, y) => { gente(x - 1, y, { lado: true }); gente(x, y, { lado: true, vira: true }); poe(x + 1, y, banco); },               // vizinhos conversando
    (x, y) => { poe(x - 1, y, banco); poe(x, y, arv); gente(x + 1, y, { crianca: true }); },                                    // sombra e banco
  ];
  // as praças anotadas primeiro; depois o mapa inteiro (todo pedaço de calçada/praça de 5×5 sem nada, fora das ruas e campos)
  const naZona = (x, y) => (m.zonas || []).some(z => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h);
  const c = m.centroTreino; if (c && c.X != null) marca(c.X - 2, c.Y - 2, c.X + c.W + 1, c.Y + c.H + 1);
  for (const s of m.spawns) if (s.qtd === 1) marca(s.x - 6, s.y - 6, s.x + 6, s.y + 6); // (o chefão precisa de espaço)
  for (const [x0, y0, w, h, zona, geral] of rects.concat([[3, 3, W - 6, H - 6, 0, 1]])) { // (o mapa inteiro fica longe da beirada: nada nos fundos encostados na cerca)
    for (let volta = 0; volta < 2; volta++) for (let cy = y0 + 2; cy <= y0 + h - 3; cy++) for (let cx = x0 + 2; cx <= x0 + w - 3; cx++) {
      const z = zona || naZona(cx, cy), peq = w * h <= 320, A = z ? 3 : geral ? 2 : peq ? 1 : 2, B = z ? 3 : geral ? 3 : 2; // vão de 4×4 nas praças pequenas e 5×5 nas grandes (com 4×4 a de Milão ficava entupida); 6×6 no resto da calçada; 7×7 nas zonas de caça calmas (os adversários precisam de espaço)
      // o pedaço 5×5 está sem nada? (o que fica perto de gente/porta conta como vazio, mas ali nada é posto: o grupinho
      // tenta a fileira do meio, a de cima e a de baixo, e cada peça confere o seu quadro)
      let livre = true;
      for (let y = cy - A; y <= cy + B && livre; y++) for (let x = cx - A; x <= cx + B; x++) if (!dentro(x, y) || m.obj[i(x, y)] || !PAV.has(m.chao[i(x, y)])) { livre = false; break; }
      if (!livre) continue;
      const g = GRUPOS[Math.floor(hash2(cx, cy, 5) * GRUPOS.length) % GRUPOS.length];
      for (const yy of [cy, cy - 1, cy + 1, cy - 2, cy + 2]) { const p0 = postos.length; g(cx, yy); if (postos.length > p0) { n++; break; } }
      confere();
    }
  }
  delete m._chao; delete m._chaoV;
  return n;
}
// o Rio (piloto da onda 1) também: o terminal e a Praça Tiradentes
if (MAPAS_DEF.rio) {
  const _rioO2c = MAPAS_DEF.rio;
  MAPAS_DEF.rio = function () {
    const m = _rioO2c.apply(this, arguments);
    try { if (!m._o2cRio) { m._o2cRio = true; o2cPreenche(m, { piso: CH.CALCADA_PT_SUAVE, arv: 'coqueiro', banco: 'banco_jardim', feira: ['carrinho_mate', 'carrinho_acai', 'banca_coco', 'carrinho_flores'] }, [[2, 43, 29, 8], [34, 31, 20, 9]], 'rio'); } } catch (e) { console.error('rio squares', e); }
    return m;
  };
}
