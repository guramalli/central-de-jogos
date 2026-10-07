/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🌊 A VILA À BEIRA-MAR (v408, Raio-X A7 — onda 2). O dono pediu a Vila mais parecida com a arte da abertura
   (a/historia_1.webp: vila à beira-mar, casas coloridas juntinhas, varal, padaria, bancos em volta do campinho de terra,
   píer e o MAR a leste). O que mudou (só o desenho; tudo o que o tutorial usa fica no mesmo lugar):
   - o rio reto agora DESÁGUA NO MAR: do sudeste em diante é mar, com faixa de areia, coqueiros, guarda-sóis,
     o trapiche e a ponte do sul viraram PÍERES que entram no mar, com barcos de pesca coloridos (arte nova a/barco_pesca.webp);
   - a Mata do Caramelo (caramelos e Zagueiros da Rua) mudou para o NORDESTE, do outro lado do rio (continua no "mato leste");
   - a Rua das Mangueiras (de baixo) ganhou 3 casinhas coloridas (rosa, lilás e verde — arte nova), juntinhas das casas à venda;
   - bancos em volta do campinho de terra.
   CRIVO: casa da Mãe, os 2 baús, Seu Zé, pênalti, Tonhão, pombos, ônibus, quadro e saídas não mudam de lugar; nada é posto
   colado em pessoa/porta/placa; se algum caminho fechar, o enfeite sai (alcancaveis/pontosImportantes).
   Prefixo: vbm. Carregar DEPOIS de vila_nova.js (embrulha mapaVila).
   ============================================================ */
const VBM_OBJ = { barco_pesca: 2.4 };
for (const [n, w] of Object.entries(VBM_OBJ)) { OBJ_INFO[n] = { w, b: 1 }; OBJ_BLOQUEIA.add(n); if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } }
for (const n of ['b_casa_rosa', 'b_casa_verde', 'b_casa_lilas']) { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } PORTAS[n] = { x: 0.5, y: 0.93 }; }
if (typeof OBJ_MINI !== 'undefined') OBJ_MINI.barco_pesca = '#f0f0f0';

{
  const _mapaVilaVbm = mapaVila;
  mapaVila = function () {
    const m = _mapaVilaVbm.apply(this, arguments);
    try { vbmArruma(m); } catch (e) { console.error('vila beira-mar', e); }
    try { vbmVila4081(m); } catch (e) { console.error('seaside village v408.1', e); }
    return m;
  };
}

function vbmArruma(m) {
  if (m._vbm || m.w !== 90 || m.h !== 64) return; m._vbm = true; // (só a Vila nova de 90×64)
  const W = m.w, H = m.h, i = (x, y) => y * W + x, dentro = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const AG = CH.AGUA, AR = CH.AREIA, MAD = CH.MADEIRA;
  const inicio = m.renasce || m.inicio;
  const antes = alcancaveis(m, inicio);
  // ---------- 1) o mar a leste: o rio desce até a altura da avenida e se abre no mar ----------
  // linha da praia (primeiro quadro de mar) em cada fileira, do y 31 para baixo
  // v408.1 (dono: "o mar pode avançar mais"): a praia chega mais perto do campinho
  const praia = y => y <= 32 ? 72 : y <= 34 ? 69 : y <= 51 ? 66 + Math.round(Math.sin(y / 3.2) * 0.8) : 68;
  for (let y = 30; y < H; y++) {
    const xs = praia(y);
    for (let x = 0; x < W; x++) {
      const k = i(x, y);
      if (y <= 32) { // a faixa logo abaixo da estrada da praia: areia depois do rio
        if (x >= 72 && y >= 31) { m.chao[k] = AR; m.obj[k] = null; }
        continue;
      }
      if (x >= xs) { m.chao[k] = AG; m.obj[k] = null; }
      else if (x >= 60 && m.chao[k] === AG) { m.chao[k] = AR; if (m.obj[k] && !m.obj[k].predio && m.obj[k].t !== 'barquinho') m.obj[k] = null; } // (o leito velho do rio vira areia)
      else if (x >= xs - 3 && (m.chao[k] === CH.GRAMA || m.chao[k] === CH.GRAMA_FLOR || m.chao[k] === AG || m.chao[k] === CH.TERRA)) { m.chao[k] = AR; if (m.obj[k] && !m.obj[k].predio) m.obj[k] = null; }
    }
  }
  // a beirada de baixo também é praia (a cerca viva some onde virou areia ou mar)
  for (let x = 0; x < W; x++) for (const y of [H - 2, H - 1]) { const k = i(x, y); if (m.chao[k] === AR || m.chao[k] === AG) m.obj[k] = null; }
  // os píeres: o trapiche (y 41–42) e a ponte do sul (y 58–59) entram no mar
  for (const [x0, x1, y0] of [[62, 79, 41], [64, 82, 58]]) for (let y = y0; y <= y0 + 1; y++) for (let x = x0; x <= x1; x++) { const k = i(x, y); if (m.chao[k] === AG || m.chao[k] === AR || m.chao[k] === MAD || x >= 64) { m.chao[k] = MAD; if (m.obj[k] && !m.obj[k].predio) m.obj[k] = null; } }
  for (let x = 80; x <= 82; x++) m.obj[i(x, 60)] = null;
  // a beirada leste do mar fica fechada (a parede invisível de sempre)
  for (let y = 31; y < H; y++) if (m.chao[i(W - 1, y)] === AG) m.obj[i(W - 1, y)] = null;
  // ---------- 2) a Mata do Caramelo vai para o nordeste (do outro lado do rio, acima da estrada da praia) ----------
  m.zonas = (m.zonas || []).filter(z => z.nome !== 'Caramelo Woods');
  m.zonas.push({ x: 74, y: 3, w: 14, h: 22, nome: 'Caramelo Woods' });
  const novos = { caramelo: { x: 80, y: 10 }, zagueiro_rua: { x: 81, y: 19 } };
  for (const s of m.spawns) if (s.x >= 72 && s.y >= 33 && novos[s.m]) { Object.assign(s, novos[s.m]); }
  for (const s of m.spawns) if (s.x >= 72 && s.y < 27) { // clareira em volta de cada grupo (as árvores da beirada ficam)
    for (let y = s.y - 4; y <= s.y + 4; y++) for (let x = s.x - 5; x <= s.x + 5; x++) { if (!dentro(x, y) || x >= W - 2 || y <= 1) continue; const o = m.obj[i(x, y)]; if (o && /^(arvore|mangueira|arbusto|pedra)$/.test(o.t) && hash2(x, y, 7) < 0.8) m.obj[i(x, y)] = null; }
  }
  // ---------- 3) três casinhas coloridas na Rua das Mangueiras (de baixo), juntinhas das casas à venda ----------
  for (let y = 51; y <= 57; y++) for (let x = 47; x <= 65; x++) { const o = m.obj[i(x, y)]; if (o && !o.predio && o.t !== 'placa') m.obj[i(x, y)] = null; }
  const casas = [['b_casa_rosa', 48], ['b_casa_lilas', 54], ['b_casa_verde', 60]];
  const ok5 = x => { for (let y = 55; y <= 57; y++) for (let k = x; k < x + 5; k++) { const o = m.obj[i(k, y)]; if (o || m.chao[i(k, y)] === AG) return false; } return !m.npcs.some(n => n.x >= x - 1 && n.x <= x + 5 && n.y >= 54 && n.y <= 58); };
  for (const [spr, x] of casas) if (ok5(x)) {
    for (let y = 55; y <= 57; y++) for (let k = x; k < x + 5; k++) m.obj[i(k, y)] = { t: 'x', v: 0, predio: true };
    m.predios.push({ spr, x, y: 55, w: 5, h: 3, porta: { x: x + 2, y: 57 } }); m.obj[i(x + 2, 57)] = null;
  }
  // o varal e a horta ficam entre as casas e o campinho
  const postos = [];
  const pertoDeGente = (x, y) => m.npcs.some(n => Math.abs(n.x - x) <= 1 && Math.abs(n.y - y) <= 1) || m.placas.some(p => Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1)
    || m.pontos.some(p => Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1) || m.saidas.some(s => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 2)
    || m.predios.some(p => p.porta && Math.abs(p.porta.x - x) <= 1 && y > p.porta.y && y <= p.porta.y + 2)
    || m.campos.some(c => x >= c.x - 1 && x <= c.x + c.w && y >= c.y - 1 && y <= c.y + c.h);
  const poe = (x, y, t, larg = 1, chaoOk = null) => {
    const meia = larg >> 1;
    for (let k = -meia; k <= meia; k++) { const a = x + k; if (!dentro(a, y) || m.obj[i(a, y)] || pertoDeGente(a, y)) return false; const c = m.chao[i(a, y)]; if (chaoOk ? !chaoOk.includes(c) : (c === AG || c === MAD)) return false; }
    m.obj[i(x, y)] = { t, v: (hash2(x, y) * 1000) | 0 }; const tiles = [i(x, y)];
    for (let k = 1; k <= meia; k++) { m.obj[i(x - k, y)] = { t: 'x', v: 0 }; m.obj[i(x + k, y)] = { t: 'x', v: 0 }; tiles.push(i(x - k, y), i(x + k, y)); }
    postos.push(tiles); return true;
  };
  // ---------- 4) bancos em volta do campinho de terra ----------
  for (const y of [39, 42, 45]) poe(57, y, 'banco');
  for (const x of [30, 36, 46, 52]) poe(x, 52, 'banco');
  // ---------- 5) a praia: coqueiros, guarda-sóis, cadeiras; barcos de pesca no mar, perto dos píeres ----------
  for (let y = 34; y <= 61; y += 4) { if (y >= 40 && y <= 43 || y >= 57 && y <= 60) continue; poe(praia(y) - 3, y, y % 8 ? 'coqueiro' : 'coqueiro2', 1, [AR]); }
  for (const y of [37, 47, 53]) { poe(praia(y) - 2, y, 'guarda_sol', 1, [AR]); poe(praia(y) - 1, y + 1, 'cadeira_praia', 1, [AR]); }
  for (let x = 75; x <= 86; x += 5) poe(x, 32, x % 2 ? 'coqueiro' : 'coqueiro2', 1, [AR]);
  for (const [x, y, t] of [[75, 38, 'barco_pesca'], [80, 55, 'barco_pesca'], [77, 62, 'jangada'], [85, 47, 'barco_pesca']]) poe(x, y, t, 1, [AG]);
  { const b = m.obj.findIndex(o => o && o.t === 'barquinho'); if (b >= 0) { m.obj[b] = null; poe(73, 44, 'barquinho', 1, [AG]); } }
  // o que precisa continuar alcançável
  const importantes = pontosImportantes(m).filter(pt => antes[pt.y * W + pt.x] || m.predios.some(p => p.porta && p.porta.x === pt.x && p.porta.y + 1 === pt.y));
  let d = alcancaveis(m, inicio);
  while (postos.length && !importantes.every(pt => d[pt.y * W + pt.x])) { for (const k of postos.pop()) m.obj[k] = null; d = alcancaveis(m, inicio); }
  const falta = importantes.filter(pt => !d[pt.y * W + pt.x]);
  if (falta.length) console.warn('seaside village: points with no path', JSON.stringify(falta));
  // a placa do trapiche agora fala do mar
  const pl = m.placas.find(p => /TRAPICHE/.test(p.texto)); if (pl) pl.texto = '🎣 VILLAGE PIER — here the Campinho river meets the sea... and the sea reaches the whole world!';
  delete m._chao; delete m._chaoV;
}

/* ============================================================
   👥 GENTE NAS PRAÇAS E NAS PORTAS (v408.1, dono: "melhore as praças vazias ... e a vila").
   Figurantes: pessoas paradas, SEM conversa (são enfeites do mapa, não NPCs: não entram na zona segura nem nas missões),
   desenhadas com o mesmo boneco dos personagens (spriteBoneco), de frente ou de lado, com a "respiração" de quem está
   parado (a mesma conta do desenhaEnt: sy = 1 + sen·0,012, a base fica no chão). Criança pode estar soltando PIPA
   (a pipa é desenhada por código, presa na mão dela pela linha, balançando com o vento).
   Uso: vbmFigurante(m, x, y, { crianca, pipa, lado, vira, semente }) — ocupa 1 quadro e bloqueia a passagem.
   ============================================================ */
OBJ_INFO.figurante = { w: 0.8, b: 1 }; OBJ_BLOQUEIA.add('figurante');
if (typeof OBJ_MINI !== 'undefined') OBJ_MINI.figurante = '#e0a070';
const VBM_PELES = ['pele-clara', 'pele-media', 'pele-morena', 'pele-negra', 'pele-retinta'];
const VBM_CAB_M = ['cabelo-curto', 'cabelo-curto', 'cabelo-black-power', 'cabelo-raspado', 'cabelo-topete', 'cabelo-cacheado'];
const VBM_CAB_F = ['cabelo-coque', 'cabelo-liso-longo', 'cabelo-cacheado', 'cabelo-rabo', 'cabelo-black-power'];
const VBM_COR_CAB = ['preto', 'castanho', 'preto', 'loiro', 'ruivo', 'grisalho'];
const VBM_ROUPA = ['roupa-camiseta', 'roupa-regata', 'roupa-xadrez', 'roupa-moletom', 'roupa-camiseta'];
const VBM_CORES = ['#e04a4a', '#3a7ae0', '#f0b030', '#3aa860', '#c050c0', '#f07a3a', '#2ab0b0', '#f4f4f4', '#ff7aa8', '#6a5ae0'];
function vbmLook(sem, crianca) {
  const r = k => hash2(sem, k, 77), pega = (l, k) => l[Math.floor(r(k) * l.length) % l.length];
  const f = r(1) < 0.5;
  return { tipo: 'humano', corpo: f ? 'f' : 'm', pele: pega(VBM_PELES, 2), cabelo: pega(f ? VBM_CAB_F : VBM_CAB_M, 3), corCabelo: crianca ? pega(['preto', 'castanho', 'loiro'], 4) : pega(VBM_COR_CAB, 4),
    roupa: pega(VBM_ROUPA, 5), corRoupa: pega(VBM_CORES, 6), baixo: f && r(7) < 0.4 ? 'baixo-saia' : pega(['baixo-shorts', 'baixo-jeans', 'baixo-moletom', 'baixo-shorts'], 8), corBaixo: pega(['#2a3a6a', '#5a4a3a', '#3a3a3a', '#7a8aa0'], 9),
    alt: crianca ? 1.22 + r(10) * 0.08 : 1.58 + r(10) * 0.16 };
}
function vbmFigurante(m, x, y, o = {}) {
  const k = y * m.w + x; if (m.obj[k]) return false;
  const sem = o.semente != null ? o.semente : x * 131 + y * 17 + (m.id || '').length;
  m.obj[k] = { t: 'figurante', v: sem % 1000, meta: { look: vbmLook(sem, o.crianca), lado: !!o.lado, vira: !!o.vira, pipa: !!o.pipa, sem } };
  return true;
}
{
  const _desenhaObjVbm = desenhaObj;
  desenhaObj = function (ctx, o, x, y) {
    if (!o || o.t !== 'figurante' || !o.meta) return _desenhaObjVbm.apply(this, arguments);
    const md = o.meta, fa = md.falaT ? G.agora - md.falaT : 1e9, falando = fa < 2600 && !md.pipa; // v408.2: falando, vira para o jogador
    const lado = falando ? true : md.lado, vira = falando ? md.olhaVira : md.vira, pulo = fa < 380 ? Math.sin(Math.PI * fa / 380) * 0.22 * T : 0;
    const comp = typeof spriteBoneco === 'function' ? spriteBoneco(md.look, lado ? 'lado' : 'frente', 0) : null;
    if (!comp) return;
    const h = md.look.alt * T, w = h * comp.c.width / comp.c.height, cx = (x + 0.5) * T, base = (y + 0.86) * T;
    ctx.fillStyle = 'rgba(30,20,40,0.22)'; ctx.beginPath(); ctx.ellipse(cx, base, Math.min(h * 0.2, 22), 7, 0, 0, 7); ctx.fill();
    const sy = 1 + Math.sin(G.agora / 450 + md.sem) * 0.012; // parado: só a respiração (a base fica no chão)
    ctx.save(); ctx.translate(cx, base - pulo); ctx.scale(vira ? -1 : 1, sy); ctx.drawImage(comp.c, -w / 2, -h, w, h); ctx.restore(); // (o pulinho leva o corpo inteiro; a sombra fica no chão)
    if (md.pipa) { // a pipa: no alto, à direita, balançando; a linha sai da mão da criança
      const t = G.agora / 1000 + md.sem, dir = md.vira ? -1 : 1;
      const px = cx + dir * (1.3 * T + Math.sin(t * 0.9) * 0.25 * T), py = base - h - 1.9 * T + Math.sin(t * 1.3) * 0.18 * T, mx = cx + dir * w * 0.3, my = base - pulo - h * 0.55;
      ctx.strokeStyle = 'rgba(60,50,60,0.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo((mx + px) / 2 + dir * 8, (my + py) / 2 + 14, px, py + 10); ctx.stroke();
      const cor = VBM_CORES[md.sem % VBM_CORES.length], rot = Math.sin(t * 1.7) * 0.18;
      ctx.save(); ctx.translate(px, py); ctx.rotate(rot);
      ctx.fillStyle = cor; ctx.strokeStyle = '#3d2b3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(9, 0); ctx.lineTo(0, 12); ctx.lineTo(-9, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke();
      ctx.strokeStyle = '#3d2b3a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 12); for (let k = 1; k <= 4; k++) ctx.lineTo(Math.sin(t * 3 + k) * 4, 12 + k * 6); ctx.stroke();
      for (let k = 1; k <= 3; k++) { ctx.fillStyle = k % 2 ? '#ffd23f' : '#ff5a5a'; ctx.beginPath(); ctx.arc(Math.sin(t * 3 + k * 1.5) * 4, 12 + k * 7, 2.4, 0, 7); ctx.fill(); }
      ctx.restore();
    }
  };
}

/* ============================================================
   🏖️ A VILA MAIS VIVA (v408.1, dono: "aproximar BEM MAIS da arte da abertura — vila à beira-mar viva").
   - o MAR também no SUL: atrás da Rua das Mangueiras vem a areia e o mar (as casas coloridas ficam de frente para a praia);
   - mais uma casa colorida na rua de cima (as casas ficam juntinhas, formando rua);
   - varais de roupa nos quintais, mesinha de café na frente da padaria, árvores e bancos em volta do campinho;
   - GENTE: vizinhos nas portas, banhistas e pescador no píer, crianças soltando pipa na praia;
   - a orla com quiosque, carrinho de açaí, pranchas, guarda-sóis, jangada e barcos de pesca.
   Tudo o que o tutorial usa fica no lugar (casa, os 2 baús, Seu Zé, pombos, ônibus, quadro, saídas); se algo fechar caminho, sai.
   ============================================================ */
function vbmVila4081(m) {
  if (m._vbm4081 || m.w !== 90 || m.h !== 64) return; m._vbm4081 = true;
  const W = m.w, H = m.h, i = (x, y) => y * W + x, dentro = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const AG = CH.AGUA, AR = CH.AREIA, MAD = CH.MADEIRA, inicio = m.renasce || m.inicio;
  const antes = alcancaveis(m, inicio), importantes0 = pontosImportantes(m).filter(pt => antes[pt.y * W + pt.x]);
  // ---------- 1) o mar no sul ----------
  for (let x = 24; x < W; x++) for (let y = 60; y < H; y++) {
    const k = i(x, y), o = m.obj[k]; if (o && o.predio) continue;
    if (m.chao[k] === AG || m.chao[k] === MAD) continue;
    const mar = y >= 62 && x >= 28;
    if (mar) { m.chao[k] = AG; m.obj[k] = null; }
    else if (y >= 61 || (y === 60 && x >= 26)) { m.chao[k] = AR; if (o && o.t !== 'poste') m.obj[k] = null; }
  }
  for (let y = 60; y < H; y++) for (const x of [24, 25]) { const k = i(x, y); if (!m.obj[k] && m.chao[k] === AR) m.obj[k] = { t: 'coqueiro', v: 1 }; }
  // ---------- 2) mais uma casa na rua de cima (entre a bicicletaria e a escola) ----------
  {
    const x0 = 42, y0 = 9; let ok = true; // (x 42–46: colada na bicicletaria, como as casas da abertura)
    for (let y = y0; y <= y0 + 2; y++) for (let x = x0; x < x0 + 5; x++) {
      const o = m.obj[i(x, y)], c = m.chao[i(x, y)];
      if ((o && (o.predio || !/^(bicicleta|arbusto|arvore|mangueira|pedra|vaso)$/.test(o.t))) || (c !== CH.GRAMA && c !== CH.GRAMA_FLOR)) ok = false;
    }
    if (ok && !m.npcs.some(n => n.x >= x0 - 1 && n.x <= x0 + 5 && n.y >= y0 && n.y <= y0 + 3)) {
      for (let y = y0; y <= y0 + 2; y++) for (let x = x0; x < x0 + 5; x++) m.obj[i(x, y)] = { t: 'x', v: 0, predio: true };
      m.predios.push({ spr: 'b_casa_rosa', x: x0, y: y0, w: 5, h: 3, porta: { x: x0 + 2, y: y0 + 2 } }); m.obj[i(x0 + 2, y0 + 2)] = null;
    }
  }
  // ---------- o kit: só em quadro livre, longe de gente/porta/placa/saída/ponto, e sem fechar caminho ----------
  const postos = [];
  const pertoDe = (x, y) => m.npcs.some(n => Math.abs(n.x - x) <= 1 && Math.abs(n.y - y) <= 1) || m.placas.some(p => Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1)
    || m.pontos.some(p => Math.abs(p.x - x) <= 2 && Math.abs(p.y - y) <= 2) || m.saidas.some(s => Math.abs(s.x - x) <= 2 && Math.abs(s.y - y) <= 2)
    || m.predios.some(p => p.porta && Math.abs(p.porta.x - x) <= 1 && y > p.porta.y && y <= p.porta.y + 2)
    || m.campos.some(c => x >= c.x - 1 && x <= c.x + c.w && y >= c.y - 1 && y <= c.y + c.h)
    || m.spawns.some(s => Math.abs(s.x - x) <= (s.raio || 1) + 1 && Math.abs(s.y - y) <= (s.raio || 1) + 1)
    || (Math.abs(inicio.x - x) <= 1 && Math.abs(inicio.y - y) <= 1);
  const RUA = new Set([CH.TERRA, CH.PEDRA]); // (rua e calçada ficam livres)
  const livre = (x, y, chaos) => {
    if (!dentro(x, y) || x < 1 || y < 1 || x >= W - 1 || m.obj[i(x, y)] || pertoDe(x, y)) return false;
    const c = m.chao[i(x, y)];
    return chaos ? chaos.includes(c) : (CH_ANDA(c) && c !== AG && !RUA.has(c) && c !== MAD);
  };
  const poe = (x, y, t, larg = 1, chaos = null) => {
    const meia = larg >> 1; for (let k = -meia; k <= meia; k++) if (!livre(x + k, y, chaos)) return false;
    m.obj[i(x, y)] = { t, v: (hash2(x, y) * 1000) | 0 }; const tiles = [i(x, y)];
    for (let k = 1; k <= meia; k++) { m.obj[i(x - k, y)] = { t: 'x', v: 0 }; m.obj[i(x + k, y)] = { t: 'x', v: 0 }; tiles.push(i(x - k, y), i(x + k, y)); }
    postos.push(tiles); return true;
  };
  const gente = (x, y, o = {}, chaos = null) => { if (!livre(x, y, chaos)) return false; vbmFigurante(m, x, y, o); postos.push([i(x, y)]); return true; };
  const tenta = (lista, f) => { for (const a of lista) if (f(...a)) return true; return false; };
  // ---------- 3) a praia do sul: quiosque, guarda-sóis, banhistas, pipas, barcos ----------
  const SUL = [AR];
  poe(33, 61, 'quiosque', 1, SUL); poe(52, 61, 'carrinho_acai', 1, SUL); poe(58, 61, 'rack_pranchas', 1, SUL);
  for (const x of [38, 45, 62]) { poe(x, 61, 'guarda_sol', 1, SUL); poe(x + 1, 61, 'cadeira_praia', 1, SUL); }
  poe(29, 61, 'jangada', 1, SUL); poe(66, 61, 'covos_pesca', 1, SUL);
  for (const x of [36, 49, 56]) if (!m.obj[i(x, 61)] && m.chao[i(x, 61)] === AR) m.obj[i(x, 61)] = { t: 'toalha_praia', v: x };
  gente(41, 61, { crianca: true, pipa: true, semente: 11 }, SUL); gente(55, 61, { crianca: true, pipa: true, vira: true, semente: 23 }, SUL);
  gente(47, 61, { semente: 31 }, SUL); gente(60, 61, { lado: true, semente: 37 }, SUL);
  for (const [x, t] of [[35, 'barco_pesca'], [50, 'barquinho'], [61, 'barco_pesca']]) if (m.chao[i(x, 62)] === AG && !m.obj[i(x, 62)]) m.obj[i(x, 62)] = { t, v: x };
  // ---------- 4) a praia do leste (perto do píer) ----------
  const LESTE = [AR];
  tenta([[63, 37], [63, 38], [64, 36]], (x, y) => poe(x, y, 'quiosque', 1, LESTE));
  tenta([[64, 47], [63, 46], [64, 49]], (x, y) => poe(x, y, 'carrinho_acai', 1, LESTE));
  tenta([[64, 44], [63, 45]], (x, y) => gente(x, y, { crianca: true, pipa: true, semente: 41 }, LESTE));
  tenta([[63, 52], [64, 53]], (x, y) => gente(x, y, { semente: 43, lado: true }, LESTE));
  tenta([[63, 49], [62, 50]], (x, y) => poe(x, y, 'kit_praia', 1, LESTE));
  // o pescador na ponta do píer (a fileira de baixo do píer continua livre)
  { let px = 0; for (let x = 62; x < W - 1; x++) if (m.chao[i(x, 41)] === MAD) px = x; if (px) gente(px, 41, { lado: true, semente: 53 }, [MAD]); }
  // ---------- 5) vizinhos nas portas (do lado da porta, nunca na frente) e varais nos quintais ----------
  for (const p of m.predios) {
    if (!p.porta || p.monumento || (p.spr === 'b_casa' && p.y < 20) || !/casa|padaria|quitanda|sorveteria|barbearia|bicicletaria/.test(p.spr)) continue;
    const y = p.porta.y + 1, lado = hash2(p.x, p.y, 3) < 0.5 ? 1 : -1;
    tenta([[p.porta.x + 2 * lado, y], [p.porta.x - 2 * lado, y], [p.porta.x + 3 * lado, p.porta.y], [p.porta.x - 3 * lado, p.porta.y]], (x, yy) => gente(x, yy, { lado: true, vira: x < p.porta.x, semente: p.x * 7 + p.y }));
  }
  for (const [x, y] of [[31, 53], [40, 53], [57, 53], [52, 18], [36, 6]]) poe(x, y, 'varal', 3);
  // ---------- 6) padaria: mesinha de café na calçada; quitanda: caixotes de frutas ----------
  tenta([[46, 26], [45, 26]], (x, y) => poe(x, y, 'mesa_cafe'));
  tenta([[53, 26], [59, 26]], (x, y) => poe(x, y, 'caixotes_frutas'));
  // ---------- 7) árvores e bancos em volta do campinho ----------
  for (const [x, y] of [[25, 33], [57, 33], [25, 51], [57, 51], [59, 38], [59, 44], [59, 50], [33, 52], [42, 52], [49, 52]]) poe(x, y, hash2(x, y) < 0.5 ? 'mangueira' : 'arvore');
  for (const [x, y] of [[27, 52], [39, 52], [55, 52]]) poe(x, y, 'banco');
  tenta([[58, 41], [58, 47]], (x, y) => gente(x, y, { crianca: true, lado: true, vira: true, semente: 61 }));
  // ---------- confere: se algum caminho fechou, tira o que foi posto por último ----------
  const importantes = importantes0.concat(m.predios.filter(p => p.spr === 'b_casa_rosa' && p.y === 9).map(p => ({ x: p.porta.x, y: p.porta.y + 1 })));
  let d = alcancaveis(m, inicio);
  while (postos.length && !importantes.every(pt => d[pt.y * W + pt.x])) { for (const k of postos.pop()) m.obj[k] = null; d = alcancaveis(m, inicio); }
  const falta = importantes.filter(pt => !d[pt.y * W + pt.x]); if (falta.length) console.warn('village v408.1: points with no path', JSON.stringify(falta));
  delete m._chao; delete m._chaoV;
}

/* ============================================================
   💬 FIGURANTES QUE DÃO OI (v408.2, dono: "uma criança clica num figurante e nada acontece").
   Clicar/tocar num figurante (ou apertar E / o botão Falar perto dele) mostra um BALÃOZINHO curto acima da cabeça
   (2,6 s, sem janela, sem missão), com uma frase pronta e gentil do jeito dele (café, banhista, pipa, vizinho, feira,
   pescador, criança) — e nas cidades do mundo, às vezes, um "olá" no idioma do lugar com a tradução.
   Ao falar ele dá um pulinho e vira para o jogador (o pulinho e a virada mexem no corpo inteiro, como o desenhaEnt).
   Não atrapalha: clique em NPC/adversário continua indo para eles (o figurante só responde quando não há ninguém ali),
   e o E só fala com figurante quando não tem pessoa, placa, baú nem adversário colado.
   ============================================================ */
const VBM_FRASES = {
  cafe: ['What delicious coffee!', 'Want some juice?', 'Is there a game today?', 'What a delicious cake!'],
  banhista: ['The water\'s great!', 'Did you put on sunscreen?', 'What a beautiful sunny day!', 'Wanna build a sandcastle?'],
  pipa: ['Look at my kite!', 'It\'s flying high!', 'The wind is great today!', 'Want to see it do a loop?'],
  vizinho: ['Good morning, ace!', 'Pickup game today?', 'Train hard!', 'Say hi to your mom for me!'],
  feira: ['Everything\'s fresh!', 'Smells so good!', 'I\'ll take two!', 'The market\'s packed today!'],
  pescador: ['The sea is calm today.', 'I caught a little fish!', 'The boats are back.', 'Patience is everything in fishing!'],
  crianca: ['Will you teach me a dribble?', 'I want to be a star like you!', 'Wanna play ball?', 'You\'re really good!'],
  gente: ['Hello!', 'What a lovely day!', 'Good luck in the game!', 'I love watching you play!'],
};
const VBM_OLA = { santos: ['Hey, how\'s it going?'], rio: ['Hey, how\'s it going?'], buenos: ['¡Hola! (Hello!)', '¡Buen día! (Good morning!)'], madri: ['¡Hola! (Hello!)', '¡Buenos días! (Good morning!)'],
  lisboa: ['Olá! Tudo bem? (Hi! How are you?)', 'Bom dia, miúdo! (Good morning, kid!)'], paris: ['Bonjour ! (Good morning!)', 'Salut ! (Hi!)'], milao: ['Ciao! (Hi!)', 'Buongiorno! (Good morning!)'], munique: ['Guten Tag! (Good day!)', 'Hallo! (Hi!)'],
  londres: ['Hello!', 'Good morning!'], cairo: ['Marhaba! (Hello!)'], doha: ['Marhaba! (Hello!)'], toquio: ['Konnichiwa! (Hello!)'], miami: ['Hi!', 'Hello!'] };
const VBM_FALA = { lista: [], n: 0 };
function vbmTipoFig(m, x, y, md) {
  if (md.pipa) return 'pipa';
  const i = (a, b) => b * m.w + a, perto = re => { for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) { const o = m.obj[i(x + dx, y + dy)]; if (o && re.test(o.t)) return true; } return false; };
  if (perto(/^mesa/)) return 'cafe';
  if (perto(/^(carrinho|banca|barraca|tenda|pilha|caixotes|arara)/)) return 'feira';
  const c = m.chao[i(x, y)]; if (c === CH.MADEIRA) return 'pescador'; if (c === CH.AREIA) return 'banhista';
  if (md.look.alt < 1.4) return 'crianca';
  if (m.predios.some(p => p.porta && Math.abs(p.porta.x - x) <= 3 && Math.abs(p.porta.y - y) <= 1)) return 'vizinho';
  return 'gente';
}
function vbmFala(x, y) {
  const m = G.mapa, o = m && m.obj[y * m.w + x]; if (!o || o.t !== 'figurante' || !o.meta) return false;
  const md = o.meta, tipo = vbmTipoFig(m, x, y, md), n = VBM_FALA.n++;
  const ola = VBM_OLA[m.id], lista = ola && (n + md.sem) % 2 === 0 ? ola : VBM_FRASES[tipo];
  const txt = lista[(md.sem + (md.falou || 0)) % lista.length]; md.falou = (md.falou || 0) + 1;
  md.falaT = G.agora; md.olhaVira = G.p ? G.p.x < x + 0.5 : md.vira;
  VBM_FALA.lista = VBM_FALA.lista.filter(f => f.o !== o); VBM_FALA.lista.push({ o, x, y, txt, t0: performance.now(), dur: 2600 }); // (o balão conta o tempo de verdade)
  if (typeof som === 'function') try { som('toque'); } catch (e) { }
  return true;
}
// o figurante (tile) debaixo do clique: a caixa do desenho dele (largura ~0,9 quadro, altura do boneco)
function vbmFigNoPonto(w) {
  const m = G.mapa; if (!m) return null; let melhor = null;
  for (let ty = Math.floor(w.y); ty <= Math.floor(w.y) + 2; ty++) for (let tx = Math.floor(w.x) - 1; tx <= Math.floor(w.x) + 1; tx++) {
    if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) continue; const o = m.obj[ty * m.w + tx]; if (!o || o.t !== 'figurante' || !o.meta) continue;
    const base = ty + 0.9, alt = o.meta.look.alt;
    if (Math.abs(w.x - (tx + 0.5)) < 0.45 && w.y > base - alt - 0.1 && w.y < base + 0.15 && (!melhor || ty > melhor.y)) melhor = { x: tx, y: ty };
  }
  return melhor;
}
{
  const _cliqueVbm = cliqueTela;
  cliqueTela = function (ev) {
    try {
      if (G.rodando && !G.pausado && G.mapa && G.p) {
        const w = mundoDoMouse(ev);
        if (!entNoPonto(w)) { // gente de verdade e adversários primeiro
          const f = vbmFigNoPonto(w);
          if (f) { if (Math.hypot(G.p.x - f.x - 0.5, G.p.y - f.y - 0.5) <= 7) vbmFala(f.x, f.y); else irE(f.x + 0.5, f.y + 0.5, 1.4, () => vbmFala(f.x, f.y)); return; }
        }
      }
    } catch (e) { console.warn('bystander: click', e); }
    return _cliqueVbm.apply(this, arguments);
  };
  const _pertoVbm = interacaoPerto;
  interacaoPerto = function () {
    const it = _pertoVbm.apply(this, arguments);
    if (it || !G.p || !G.mapa || G.mons.some(mo => dist(mo, G.p) < 2.5)) return it; // (perto de adversário o E continua marcando alvo)
    const m = G.mapa, px = Math.floor(G.p.x), py = Math.floor(G.p.y); let melhor = null, md = 1.7;
    for (let y = py - 2; y <= py + 2; y++) for (let x = px - 2; x <= px + 2; x++) {
      if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue; const o = m.obj[y * m.w + x]; if (!o || o.t !== 'figurante' || !o.meta) continue;
      const d = Math.hypot(G.p.x - x - 0.5, G.p.y - y - 0.5); if (d < md) { md = d; melhor = { tipo: 'figurante', fx: x, fy: y, x: x + 0.5, y: y + 0.9, alt: o.meta.look.alt, txt: 'Say hi' }; }
    }
    return melhor;
  };
  const _interagirVbm = interagir;
  interagir = function () {
    const it = interacaoPerto();
    if (it && it.tipo === 'figurante') { vbmFala(it.fx, it.fy); return; }
    return _interagirVbm.apply(this, arguments);
  };
  // o balãozinho: desenhado por cima de tudo (depois do mundo), preso na cabeça do figurante
  const _desenhaVbm = desenha;
  desenha = function () {
    const r = _desenhaVbm.apply(this, arguments);
    try { vbmDesenhaBaloes(); } catch (e) { }
    return r;
  };
  // passar o mouse por cima mostra a mãozinha
  if (typeof CV !== 'undefined' && CV) CV.addEventListener('mousemove', ev => setTimeout(() => {
    try { if (!G.rodando || !G.mapa || (G.mouse && G.mouse.ent)) return; if (vbmFigNoPonto(mundoDoMouse(ev))) CV.style.cursor = 'pointer'; } catch (e) { }
  }, 0));
}
function vbmDesenhaBaloes() {
  const L = VBM_FALA.lista; if (!L.length) return;
  const agora = performance.now(); VBM_FALA.lista = L.filter(f => G.mapa && f.o === G.mapa.obj[f.y * G.mapa.w + f.x] && agora - f.t0 < f.dur);
  if (!VBM_FALA.lista.length) return;
  const ctx = CTX, z = G.zoom, cam = G.cam, px = G.dpr || 1;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const f of VBM_FALA.lista) {
    const k = Math.max(0, (agora - f.t0) / f.dur), alfa = k < 0.08 ? k / 0.08 : k > 0.85 ? (1 - k) / 0.15 : 1;
    const alt = f.o.meta.look.alt, sx = ((f.x + 0.5) * T - cam.x) * z, sy = ((f.y + 0.86 - alt - 0.12) * T - cam.y) * z;
    const s = 13.5 * px; ctx.font = `700 ${s}px Fredoka, Nunito, sans-serif`; const tw = ctx.measureText(f.txt).width, w = tw + 18 * px, h = s + 12 * px;
    const bx = sx - w / 2, by = sy - h - 9 * px - (1 - Math.min(1, k * 8)) * 6 * px;
    ctx.globalAlpha = Math.max(0, alfa);
    ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = '#3d2b3a'; ctx.lineWidth = 2.2 * px;
    ctx.beginPath(); ctx.roundRect(bx, by, w, h, 9 * px); ctx.moveTo(sx - 6 * px, by + h); ctx.lineTo(sx, by + h + 8 * px); ctx.lineTo(sx + 6 * px, by + h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(sx - 5 * px, by + h - 2.5 * px, 10 * px, 3.5 * px); // (apaga o traço entre o balão e a pontinha)
    ctx.fillStyle = '#3d2b3a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(f.txt, sx, by + h / 2 + 1 * px);
  }
  ctx.restore();
}
