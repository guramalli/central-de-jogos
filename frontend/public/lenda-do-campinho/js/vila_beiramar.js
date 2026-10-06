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
  const praia = y => y <= 32 ? 72 : y <= 36 ? 68 : y <= 39 ? 69 : y <= 42 ? 70 : 71 + Math.round(Math.sin(y / 3.2) * 1.2);
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
  m.zonas = (m.zonas || []).filter(z => z.nome !== 'Mata do Caramelo');
  m.zonas.push({ x: 74, y: 3, w: 14, h: 22, nome: 'Mata do Caramelo' });
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
  if (falta.length) console.warn('vila beira-mar: pontos sem caminho', JSON.stringify(falta));
  // a placa do trapiche agora fala do mar
  const pl = m.placas.find(p => /TRAPICHE/.test(p.texto)); if (pl) pl.texto = '🎣 PÍER DA VILA — aqui o rio Campinho encontra o mar... e o mar vai até o mundo todo!';
  delete m._chao; delete m._chaoV;
}
