/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🗺️ CHÃO NOVO (v379, dono: "o chão está mal desenhado, artes repetidas, soa como algo feito sem vontade... quero deixar
   muito mais profissional, será parte de um pacote pago na Steam"). Repaginação dos mapas de Atlântida em diante
   (piloto aprovado: "aprovei, aplique em todos os outros").
   O desenho do chão (renderChao, assets.js) dos mapas da lista CHAO2.mapas:
   1) TEXTURAS GRANDES SEM EMENDA (a/t2_*.webp, 1024 px, Higgsfield) — antes uma textura de 256 px repetia a cada
      2 quadradinhos e o "carimbo" aparecia.
   2) FORMAS LISAS: cada chão é desenhado em 1/4 do tamanho, desfocado e "cortado no meio" do desfoque — escadinha vira
      curva, reta continua reta. Piso construído (pedra lavrada, metal, lajes) com borda escura, sombra de contato e
      filete de luz; chão natural com beirada macia; terreno ALTO (planalto) com penhasco e sombra comprida.
   3) ESPAÇO: o vazio estrelado fica embaixo e o chão vira uma PLATAFORMA FLUTUANTE com penhasco (Estação, Saturno,
      Nebulosa, Multiverso, ilhas do Vale Celeste).
   4) CAVERNAS: só o piso muda (paredes e faces continuam retas, como o jogo precisa).
   5) MANCHAS DE TOM largas e ENFEITES DE CHÃO por tipo de chão (a/dc2_<bioma>_1..16.webp), em grupinhos, fora de
      caminhos, objetos, portas e personagens.
   6) CAÇAS ABERTAS: fora das salas vira PLANALTO do tema (rochas, cristais, floresta, recife, juncos...) no lugar do
      "tapete" de enfeites em xadrez; enfeites só na beirada, espaçados.
   7) ATLÂNTIDA: ruas curvas, praças e plataformas redondas (só o chão muda; portais, prédios e personagens no lugar).
   Carregar NO FIM (depois de assets.js, cacadas.js, atlantida.js, espaco.js, espaco_novo.js, multiverso.js, jurassico.js, vale.js).
   ============================================================ */
// planaltos: o terreno ALTO que cerca as salas das caças abertas
Object.assign(CH, { PLANALTO_LUA: 101, PLANALTO_MARTE: 102, PLANALTO_ANEL: 103, PLANALTO_NEB: 104, PLANALTO_DESERTO: 105, PLANALTO_FLORESTA: 106, PLANALTO_PANTANO: 107, PLANALTO_RECIFE: 108, PLANALTO_NEVE: 109 });
for (const [k, cor] of [['PLANALTO_LUA', '#565a6c'], ['PLANALTO_MARTE', '#7a3a24'], ['PLANALTO_ANEL', '#5a4a80'], ['PLANALTO_NEB', '#5a2a6a'], ['PLANALTO_DESERTO', '#9a5a30'], ['PLANALTO_FLORESTA', '#2a5a2a'], ['PLANALTO_PANTANO', '#3a4a2a'], ['PLANALTO_RECIFE', '#3a6a7a'], ['PLANALTO_NEVE', '#3a5a4a']])
  ESTILO_CHAO[CH[k]] = { cor, borda: '#222', r: 0, e: 0, tex: 'pedra', o: 9.5 };
const CHAO2 = {
  // textura nova de cada chão: [arte, quantos quadradinhos ela cobre]
  tex: {
    [CH.AREIA_MAR]: ['t2_areia_mar', 7], [CH.PEDRA_MAR]: ['t2_pedra_mar', 5], [CH.REGOLITO]: ['t2_regolito', 8], [CH.METAL]: ['t2_metal_lua', 4],
    [CH.MARTE]: ['t2_marte', 8], [CH.ANEL]: ['t2_anel', 8], [CH.NEBULOSA]: ['t2_nebulosa', 8], [CH.CONCRETO_ESC]: ['t2_concreto_esc', 4], [CH.PISO]: ['t2_piso_est', 4],
    [CH.MV_PRACA]: ['t2_mv_praca', 5], [CH.MV_LAVA]: ['t2_lava_derretida', 4], [CH.ESTRELAS]: ['t2_estrelas', 10], [CH.CAVERNA]: ['t2_caverna', 7], [CH.MV_PISO_ANAO]: ['t2_mv_piso_anao', 5], [CH.ROCHA_LAVA]: ['t2_rocha_lava', 7],
    [CH.MV_NEVE]: ['t2_neve', 8], [CH.MV_NUVEM]: ['t2_nuvem', 8], [CH.PEDRA]: ['t2_pedra', 7], [CH.GELO]: ['t2_gelo', 7], [CH.GRAMA]: ['t2_grama', 7], [CH.GRAMA_FLOR]: ['t2_grama', 7],
    [CH.AREIA]: ['t2_areia', 8], [CH.ARENITO]: ['t2_arenito', 6], [CH.LODO]: ['t2_lodo', 7], [CH.PARALELO]: ['t2_paralelo', 5], [CH.TERRA]: ['t2_terra', 7], [CH.CONCRETO]: ['t2_concreto_esc', 4],
    [CH.CAMPO_TERRA]: ['t2_campo_terra', 7], [CH.CALCADA_PT]: ['t2_calcada_pt', 5],
    [CH.PLANALTO_LUA]: ['t2_planalto_lua', 6], [CH.PLANALTO_MARTE]: ['t2_planalto_marte', 6], [CH.PLANALTO_ANEL]: ['t2_planalto_anel', 6], [CH.PLANALTO_NEB]: ['t2_planalto_nebulosa', 6],
    [CH.PLANALTO_DESERTO]: ['t2_planalto_deserto', 6], [CH.PLANALTO_FLORESTA]: ['t2_planalto_floresta', 5], [CH.PLANALTO_PANTANO]: ['t2_planalto_pantano', 5], [CH.PLANALTO_RECIFE]: ['t2_planalto_recife', 5], [CH.PLANALTO_NEVE]: ['t2_planalto_neve', 5],
  },
  // piso construído: borda escura de acabamento (o resto: beirada macia)
  piso: new Set([CH.PEDRA_MAR, CH.METAL, CH.CONCRETO_ESC, CH.PISO, CH.MV_PRACA, CH.MV_PISO_ANAO, CH.PARALELO, CH.CALCADA_PT, CH.CONCRETO]),
  junta: { [CH.JUR_PAREDE]: CH.JUR_COPA },
  alto: new Set([CH.JUR_COPA, CH.JUR_PAREDE, CH.PLANALTO_LUA, CH.PLANALTO_MARTE, CH.PLANALTO_ANEL, CH.PLANALTO_NEB, CH.PLANALTO_DESERTO, CH.PLANALTO_FLORESTA, CH.PLANALTO_PANTANO, CH.PLANALTO_RECIFE, CH.PLANALTO_NEVE]),
  // chãos desenhados como sempre foram (quadradinho certo): paredes de caverna e suas faces, copas da selva, campos, tapetes, lava corrente
  cru: new Set([CH.PAREDE_CAV, CH.FACE_CAV, CH.CAMPO, CH.TAPETE, CH.QUADRA, CH.QUADRA_AZUL, CH.MADEIRA].filter(v => v != null)),
  // enfeites por tipo de chão: [prefixo, densidade de grupinhos por quadradinho, tamanho mín/máx (em quadradinhos)]
  dc: {
    [CH.AREIA_MAR]: ['dc2_atl', 0.02, 0.28, 0.5], [CH.REGOLITO]: ['dc2_lua', 0.022, 0.3, 0.62], [CH.MARTE]: ['dc2_marte', 0.022, 0.3, 0.6], [CH.ANEL]: ['dc2_anel', 0.022, 0.26, 0.5],
    [CH.NEBULOSA]: ['dc2_nebulosa', 0.022, 0.26, 0.5], [CH.CAVERNA]: ['dc2_caverna', 0.026, 0.28, 0.52], [CH.MV_NEVE]: ['dc2_neve', 0.02, 0.28, 0.52], [CH.ROCHA_LAVA]: ['dc2_lava', 0.024, 0.28, 0.52],
    [CH.AREIA]: ['dc2_deserto', 0.02, 0.28, 0.52], [CH.LODO]: ['dc2_pantano', 0.026, 0.28, 0.5], [CH.GRAMA]: ['dc2_floresta', 0.028, 0.26, 0.48], [CH.GRAMA_FLOR]: ['dc2_floresta', 0.04, 0.26, 0.48],
    [CH.JUR_CHAO]: ['dc2_jur', 0.026, 0.3, 0.56], [CH.GELO]: ['dc2_gelo', 0.022, 0.26, 0.5], [CH.METAL]: ['dc2_estacao', 0.006, 0.28, 0.46], [CH.CONCRETO_ESC]: ['dc2_estacao', 0.01, 0.28, 0.46],
    [CH.TERRA]: ['dc2_floresta', 0.01, 0.24, 0.42], [CH.PEDRA]: ['dc2_neve', 0.008, 0.24, 0.42],
  },
  biomas: {
    atl: { base: CH.AREIA_MAR, luz: true }, lua: { base: CH.REGOLITO }, marte: { base: CH.MARTE }, anel: { base: CH.ANEL }, neb: { base: CH.NEBULOSA },
    estacao: { base: CH.METAL }, mv: { base: CH.MV_PRACA }, anao: { base: CH.CAVERNA }, neve: { base: CH.MV_NEVE }, vale: {}, jur: {},
    deserto: { base: CH.AREIA }, floresta: { base: CH.GRAMA }, pantano: { base: CH.LODO }, montanha: { base: CH.PEDRA },
    caverna: { base: CH.CAVERNA }, lava: { base: CH.CAVERNA, paredeCru: [CH.ROCHA_LAVA] }, /* v394: a rocha (parede) por cima, no quadradinho exato — com a rocha de fundo, a terra arredondada cobria as paredes fininhas e virava parede invisível (dono: "não tem nada no mapa porém não dá para passar", no Rio de Lava) */ gelo: { base: CH.GELO }, catacumba: { base: CH.PARALELO }, tumba: { base: CH.ARENITO }, esgoto: { base: CH.CONCRETO_ESC }, tunel: { base: CH.CONCRETO },
  },
  // planalto de cada tema de caça aberta
  planalto: { lunar: CH.PLANALTO_LUA, marciano: CH.PLANALTO_MARTE, anel: CH.PLANALTO_ANEL, nebular: CH.PLANALTO_NEB, deserto: CH.PLANALTO_DESERTO, bambu: CH.PLANALTO_FLORESTA, fazenda: CH.PLANALTO_FLORESTA,
    mv_floresta: CH.PLANALTO_FLORESTA, pantano: CH.PLANALTO_PANTANO, recife: CH.PLANALTO_RECIFE, mv_nuvens: CH.PLANALTO_NEVE, mv_pico: CH.PLANALTO_NEVE, mv_ponte: CH.PLANALTO_NEVE },
  mapas: {},
};
// quais mapas: os principais de Atlântida em diante e as caças que se entra por eles (pelo TEMA de cada caça)
{
  const M = CHAO2.mapas;
  Object.assign(M, { atlantida: 'atl', lua: 'lua', marte: 'marte', saturno: 'anel', nebulosa: 'neb', estacao: 'estacao', copa_intergalactica: 'estacao', multiverso: 'mv', arena_ecos: 'mv', torre_infinita: 'caverna',
    pedraforte: 'anao', picos_nublados: 'neve', vale_celeste: 'vale' });
  for (const k of Object.keys(MAPAS_DEF)) { if (/^vale_z\d$/.test(k)) M[k] = 'vale'; if (/^jur_/.test(k)) M[k] = 'jur'; }
  const TEMA_BIOMA = { lunar: 'lua', marciano: 'marte', anel: 'anel', nebular: 'neb', recife: 'atl', deserto: 'deserto', bambu: 'floresta', fazenda: 'floresta', mv_floresta: 'floresta',
    pantano: 'pantano', mv_nuvens: 'neve', mv_pico: 'neve', mv_ponte: 'montanha', esgoto: 'esgoto', cristal: 'caverna', catacumba: 'catacumba', mina: 'caverna', mv_mina: 'caverna', mv_grutas: 'caverna',
    tumba: 'tumba', gelo: 'gelo', tunel: 'tunel', lava: 'lava', mv_lava: 'lava', mv_trono: 'anao' };
  const HOSTS = new Set(['atlantida', 'estacao', 'lua', 'marte', 'saturno', 'nebulosa', 'multiverso', 'pedraforte', 'picos_nublados']);
  try { for (const c of CACADAS) if (HOSTS.has(c.host) && MAPAS_DEF[c.id] && TEMA_BIOMA[c.tema]) M[c.id] = TEMA_BIOMA[c.tema]; } catch (e) { }
}

/* ---------- o desenho ---------- */
{
  const pronto = n => spr(n).ok;
  // as artes que um mapa usa: as texturas dos chãos dele e os enfeites
  function artesDoMapa(m) {
    const usados = new Set(m.chao), l = new Set();
    for (const t of usados) { const d = CHAO2.tex[t]; if (d) l.add(d[0]); const dc = CHAO2.dc[t]; if (dc) for (let i = 1; i <= 16; i++) l.add(`${dc[0]}_${i}`); }
    return [...l];
  }
  function manchas(W, H, cel, seed) {
    const r = mulberry(seed), w = Math.ceil(W / cel) + 2, h = Math.ceil(H / cel) + 2, c = mkCanvas(w, h), x = c.getContext('2d'), img = x.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { const v = r() * 255; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
    x.putImageData(img, 0, 0); return c;
  }
  let FOLHA = null;
  // v393 (dono: "o jogo está travando muito quando entro no Vale dos Dinossauros"): o chão do labirinto levava ~2,6 s de uma
  // vez só (o navegador congelava). Agora o desenho é feito em ETAPAS (renderChao2G, um gerador): um pouquinho por quadro,
  // atrás da tela de entrada (bola rolando + barra). renderChao2 continua existindo e faz tudo de uma vez (para quem precisa).
  function renderChao2(m, bio) { const g = renderChao2G(m, bio); let r; while (!(r = g.next()).done); return r.value; }
  function* renderChao2G(m, bio) {
    const B = CHAO2.biomas[bio] || {}, W = m.w * T, H = m.h * T, c = mkCanvas(W, H), x = c.getContext('2d'), r = mulberry(m.w * 977 + m.h * 13 + m.id.length * 7);
    // tela de trabalho em FAIXAS de 1024 px de altura (o Labirinto Jurássico tem 9600×7040 px: uma tela inteira a mais
    // seriam 270 MB — no celular derrubava o jogo)
    const FX = Math.min(H, 256), F = (() => { const fc = mkCanvas(W, FX); return { c: fc, x: fc.getContext('2d') }; })(); // (de cada desenho: dois mapas podem estar sendo feitos ao mesmo tempo)
    const at = (i, j) => (i >= 0 && j >= 0 && i < m.w && j < m.h) ? m.chao[j * m.w + i] : -1;
    const padrao2 = t => { const d = CHAO2.tex[t]; if (d && pronto(d[0])) { const e = spr(d[0]); const p = x.createPattern(e.im, 'repeat'); const k = (d[1] * T) / e.im.width; p.setTransform(new DOMMatrix([k, 0, 0, k, (t * 97) % 300, (t * 53) % 300])); return p; } return padrao(x, TEX_CHAO[t], (2 * T) / 256) || (ESTILO_CHAO[t] || {}).cor || '#888'; };
    const cont = {}; for (const t of m.chao) cont[t] = (cont[t] || 0) + 1;
    const VAZIO = CH.ESTRELAS, temVazio = !!cont[VAZIO];
    const naoVazio = Object.keys(cont).map(Number).filter(t => t !== VAZIO);
    const base = (B.base != null && cont[B.base]) ? B.base : naoVazio.filter(t => !CHAO2.cru.has(t) && !CHAO2.alto.has(t) && t !== CH.AGUA).sort((a, b) => cont[b] - cont[a])[0] ?? naoVazio[0]; // (o terreno alto nunca é o fundo)
    // máscara lisa de um conjunto de quadradinhos: desenha em 1/4, desfoca, corta no meio (camadas: borda, dentro, filete)
    const Q = 4, w4 = Math.ceil(W / Q), h4 = Math.ceil(H / Q), tq = T / Q, ss = (e0, e1, v) => { const k = Math.min(1, Math.max(0, (v - e0) / (e1 - e0))); return k * k * (3 - 2 * k); };
    // v395: em pedaços (o desfoque em faixas com margem, a conta dos pixels em blocos), para nenhuma etapa travar o jogo
    function* mascara(tiles, organico, desf) {
      const sm = mkCanvas(w4, h4), sx = sm.getContext('2d'); sx.fillStyle = '#000';
      if (!organico) for (const [i, j] of tiles) sx.fillRect(i * tq, j * tq, tq, tq);
      else for (let n = 0; n < tiles.length; n++) { const [i, j] = tiles[n]; const rr = tq * (0.66 + r() * 0.12); sx.beginPath(); sx.arc((i + 0.5 + (r() - 0.5) * 0.2) * tq, (j + 0.5 + (r() - 0.5) * 0.2) * tq, rr, 0, 7); sx.fill(); if (n % 3000 === 2999) yield; }
      yield;
      const bl = mkCanvas(w4, h4), bx = bl.getContext('2d'), mg = Math.ceil(tq * desf * 3) + 2, FB = 192;
      for (let y0 = 0; y0 < h4; y0 += FB) {
        const sy = Math.max(0, y0 - mg), sh = Math.min(h4, y0 + FB + mg) - sy;
        bx.save(); bx.beginPath(); bx.rect(0, y0, w4, FB); bx.clip(); bx.filter = `blur(${tq * desf}px)`; bx.drawImage(sm, 0, sy, w4, sh, 0, sy, w4, sh); bx.restore();
        yield;
      }
      const A = bx.getImageData(0, 0, w4, h4).data; yield;
      return function* (fn) {
        const c2 = mkCanvas(w4, h4), q = c2.getContext('2d'), im = q.createImageData(w4, h4), D = im.data, N = w4 * h4;
        for (let k0 = 0; k0 < N; k0 += 300000) { const k1 = Math.min(N, k0 + 300000); for (let k = k0; k < k1; k++) D[k * 4 + 3] = Math.round(255 * fn(A[k * 4 + 3] / 255)); yield; }
        q.putImageData(im, 0, 0); return c2;
      };
    }
    // pinta "pinta" através da máscara e desenha no mapa (deslocado dy, com o modo de mistura "modo"), faixa por faixa
    function* aplica(msk, pinta, dy = 0, modo) {
      for (let y0 = 0; y0 < H; y0 += FX) {
        const fh = Math.min(FX, H - y0);
        F.x.globalCompositeOperation = 'source-over'; F.x.clearRect(0, 0, W, FX); F.x.imageSmoothingEnabled = true; F.x.imageSmoothingQuality = 'high';
        F.x.drawImage(msk, 0, y0 / Q, w4, fh / Q, 0, 0, W, fh);
        F.x.globalCompositeOperation = 'source-in'; F.x.save(); F.x.translate(0, -y0); pinta(F.x, y0, fh); F.x.restore(); F.x.globalCompositeOperation = 'source-over';
        x.save(); if (modo) x.globalCompositeOperation = modo; x.drawImage(F.c, 0, 0, W, fh, 0, y0 + dy, W, fh); x.restore();
        yield;
      }
    }
    // desenha livre (ex.: a água, que tem o seu próprio desenho) e depois recorta pela máscara lisa
    function* aplicaDepois(msk, pintaLivre) {
      for (let y0 = 0; y0 < H; y0 += FX) {
        const fh = Math.min(FX, H - y0);
        F.x.globalCompositeOperation = 'source-over'; F.x.clearRect(0, 0, W, FX); F.x.save(); F.x.translate(0, -y0); pintaLivre(F.x); F.x.restore();
        F.x.globalCompositeOperation = 'destination-in'; F.x.imageSmoothingEnabled = true; F.x.imageSmoothingQuality = 'high'; F.x.drawImage(msk, 0, y0 / Q, w4, fh / Q, 0, 0, W, fh); F.x.globalCompositeOperation = 'source-over';
        x.drawImage(F.c, 0, 0, W, fh, 0, y0, W, fh);
        yield;
      }
    }
    const cor = c0 => (q, y0, fh) => { q.fillStyle = c0; q.fillRect(0, y0, W, fh); }, tex = t => (q, y0, fh) => { q.fillStyle = padrao2(t); q.fillRect(0, y0, W, fh); };
    // forma "construída" ou "alta": sombra, borda escura (e parede de penhasco), textura, filete de luz
    function* desenhaPiso(camada, pintaDentro, alto, flutua) {
      const borda = yield* camada(v => ss(0.3, 0.4, v)); const dentro = yield* camada(v => ss(0.47, 0.53, v)); const filete = yield* camada(v => Math.max(0, ss(0.47, 0.53, v) - ss(0.6, 0.72, v)));
      { // a sombra desfocada, em faixas (só o pedaço da máscara que cai na faixa, com margem para o desfoque)
        const bz = Math.round(T * (alto ? 0.25 : 0.12)), dy = T * (alto ? 0.28 : 0.06), mg = bz * 3 + Q;
        for (let y0 = 0; y0 < H; y0 += 512) {
          const a = Math.max(dy, y0 - mg), b = Math.min(H + dy, y0 + 512 + mg); if (b <= a) continue;
          const s0 = (a - dy) / Q, s1 = (b - dy) / Q;
          x.save(); x.beginPath(); x.rect(0, y0, W, 512); x.clip(); x.filter = `blur(${bz}px)`; x.globalAlpha = alto ? 0.7 : 0.45; x.imageSmoothingEnabled = true;
          x.drawImage(borda, 0, s0, w4, s1 - s0, 0, a, W, b - a); x.restore();
          yield;
        }
      }
      if (alto) yield* aplica(borda, cor(flutua ? 'rgba(40,30,60,0.95)' : 'rgba(20,20,30,0.9)'), T * (flutua ? 0.32 : 0.18));
      yield* aplica(borda, cor('rgba(28,42,52,0.85)'));
      yield* aplica(dentro, pintaDentro);
      yield* aplica(filete, cor(alto ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)'), 0, 'soft-light');
    }
    const tilesDe = pred => { const l = []; for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) if (pred(m.chao[j * m.w + i])) l.push([i, j]); return l; };
    // 1) o fundo: o vazio do espaço (e o chão vira plataforma flutuante) ou o chão de baixo do bioma
    if (temVazio) {
      x.fillStyle = padrao2(VAZIO); for (let y0 = 0; y0 < H; y0 += 1024) { x.fillRect(0, y0, W, Math.min(1024, H - y0)); yield; }
      const ilha = tilesDe(t => t !== VAZIO); if (ilha.length) { const cm = yield* mascara(ilha, false, 0.45); yield* desenhaPiso(cm, tex(base), true, true); }
    } else { x.fillStyle = padrao2(base); for (let y0 = 0; y0 < H; y0 += 1024) { x.fillRect(0, y0, W, Math.min(1024, H - y0)); yield; } }
    yield { p: 0.08 };
    // 2) os outros chãos, na ordem das camadas
    // chão que se desenha JUNTO com outro (a parede de pedra fininha da arena do Rex vira parte da mata alta em volta:
    // sozinha, uma fileira de 1 quadradinho na diagonal, ficava uma faixa em escadinha)
    const junta = t => { const a = CHAO2.junta[t]; return (a != null && cont[a]) ? a : t; };
    const tipos = naoVazio.filter(t => t !== base && ESTILO_CHAO[t] && junta(t) === t).sort((a, b) => ESTILO_CHAO[a].o - ESTILO_CHAO[b].o);
    for (const [it, t] of tipos.entries()) {
      yield { p: 0.08 + 0.74 * it / Math.max(1, tipos.length) };
      const tiles = tilesDe(v => v !== VAZIO && junta(v) === t), est = ESTILO_CHAO[t];
      if (t === CH.AGUA && typeof pintaAgua === 'function') { // a água de sempre, com a beirada lisa
        const cmA = yield* mascara(tiles, true, 0.45); const msk = yield* cmA(v => ss(0.42, 0.56, v)), tudo = new Path2D(); tudo.rect(0, 0, W, H);
        yield* aplicaDepois(msk, q => pintaAgua(q, m, tudo)); continue;
      }
      if (B.paredeCru && B.paredeCru.includes(t)) { // parede do bioma no quadradinho exato, com a arte nova e uma sombra suave em volta
        const p = new Path2D(); for (const [i, j] of tiles) p.rect(i * T, j * T, T, T);
        for (let j0 = 0; j0 < m.h; j0 += 8) { // (a sombra em faixas de 8 fileiras: o desfoque no mapa inteiro de uma vez travava)
          const pf = new Path2D(); let tem = false; for (const [i, j] of tiles) if (j >= j0 - 1 && j < j0 + 9) { pf.rect(i * T, j * T, T, T); tem = true; }
          if (!tem) continue;
          x.save(); x.beginPath(); x.rect(0, j0 * T, W, 8 * T); x.clip(); x.filter = `blur(${Math.round(T * 0.12)}px)`; x.globalAlpha = 0.55; x.fillStyle = '#120a08'; x.translate(0, T * 0.08); x.fill(pf); x.restore();
          yield;
        }
        x.fillStyle = padrao2(t) || padrao(x, TEX_CHAO[t], (2 * T) / 256) || est.cor; x.fill(p);
        { // a beirada: só onde a parede encontra o chão (não em volta de cada quadradinho)
          const bd = new Path2D(), eP = (i, j) => i < 0 || j < 0 || i >= m.w || j >= m.h || junta(m.chao[j * m.w + i]) === t;
          for (const [i, j] of tiles) { if (!eP(i, j + 1)) bd.rect(i * T, (j + 1) * T - T * 0.1, T, T * 0.1); if (!eP(i, j - 1)) bd.rect(i * T, j * T, T, T * 0.06); if (!eP(i - 1, j)) bd.rect(i * T, j * T, T * 0.06, T); if (!eP(i + 1, j)) bd.rect((i + 1) * T - T * 0.06, j * T, T * 0.06, T); }
          x.fillStyle = 'rgba(0,0,0,0.38)'; x.fill(bd);
        }
        yield; continue;
      }
      if (CHAO2.cru.has(t)) { // como sempre foi: o quadradinho certo, com a textura e a tinta de antes
        const p = new Path2D(); for (const [i, j] of tiles) p.rect(i * T, j * T, T, T);
        x.fillStyle = padrao(x, TEX_CHAO[t], (2 * T) / 256) || est.cor; x.fill(p);
        if (est.tinta) { x.save(); x.clip(p); x.fillStyle = est.tinta; x.fillRect(0, 0, W, H); x.restore(); }
        continue;
      }
      const alto = CHAO2.alto.has(t), piso = CHAO2.piso.has(t) || alto;
      const camada = yield* mascara(tiles, !piso, t === CH.METAL ? 0.22 : piso ? 0.48 : 0.45);
      if (piso) yield* desenhaPiso(camada, tex(t), alto, false);
      else { // (a lava: pedra quente + a tinta laranja de antes + um brilho que vaza para fora da beirada)
        const msk = yield* camada(v => ss(0.32, 0.62, v));
        if (t === CH.MV_LAVA) {
          { const c1 = yield* camada(v => ss(0.08, 0.45, v) * 0.35); yield* aplica(c1, cor('rgba(255,120,30,1)'), 0, 'screen'); } // brilho no chão em volta
          yield* aplica(msk, tex(t)); // a lava derretida (arte própria, v379)
          { const c2 = yield* camada(v => ss(0.7, 1, v) * 0.28); yield* aplica(c2, cor('rgba(255,220,120,1)'), 0, 'screen'); } // o miolo mais quente
          { const c3 = yield* camada(v => Math.max(0, ss(0.32, 0.46, v) - ss(0.5, 0.64, v))); yield* aplica(c3, cor('rgba(52,22,14,0.9)')); } // beirada de rocha esfriada
        } else { yield* aplica(msk, tex(t)); if (est.tinta) yield* aplica(msk, cor(est.tinta)); }
      }
    }
    yield { p: 0.84 };
    // 3) manchas largas de tom (claro e escuro)
    { const n1 = manchas(W, H, T * 5, m.w * 31 + 1), n2 = manchas(W, H, T * 12, m.h * 17 + 3);
      for (let y0 = 0; y0 < H; y0 += 768) { // (em faixas)
        x.save(); x.beginPath(); x.rect(0, y0, W, 768); x.clip(); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.globalCompositeOperation = 'soft-light';
        x.globalAlpha = 0.3; x.drawImage(n1, -T * 2.5, -T * 2.5, n1.width * T * 5, n1.height * T * 5);
        x.globalAlpha = 0.36; x.drawImage(n2, -T * 6, -T * 6, n2.width * T * 12, n2.height * T * 12); x.restore();
        yield;
      } }
    // 4) enfeites em grupinhos, pelo tipo de chão de cada lugar
    const livreDc = (i, j, t) => { if (i < 0 || j < 0 || i >= m.w || j >= m.h) return false; const k = j * m.w + i; if (m.chao[k] !== t || m.obj[k]) return false; for (const s of m.saidas) if (Math.abs(s.x - i) <= 1 && Math.abs(s.y - j) <= 1) return false; for (const n of m.npcs) if (Math.abs(n.x - i) <= 1 && Math.abs(n.y - j) <= 1) return false; return true; };
    yield { p: 0.9 };
    for (const [tS, D] of Object.entries(CHAO2.dc)) {
      const t = +tS; if (!cont[t]) continue; yield;
      const nG = Math.round(cont[t] * D[1]);
      for (let g = 0, tent = 0; g < nG && tent < nG * 6; tent++) {
        const gi = (r() * m.w) | 0, gj = (r() * m.h) | 0; if (!livreDc(gi, gj, t)) continue; g++;
        const tema = 1 + ((r() * 16) | 0), q = 1 + ((r() * 4) | 0);
        for (let k = 0; k < q; k++) {
          const ang = r() * Math.PI * 2, d = k ? (0.35 + r() * 0.9) : 0, cx = (gi + 0.5) * T + Math.cos(ang) * d * T, cy = (gj + 0.5) * T + Math.sin(ang) * d * T;
          if (!livreDc(Math.floor(cx / T), Math.floor(cy / T), t)) continue;
          const e = spr(`${D[0]}_${r() < 0.7 ? tema : 1 + ((r() * 16) | 0)}`); if (!e.ok) continue;
          const w = T * (D[2] + r() * (D[3] - D[2])) * (k ? 0.8 : 1), h = w * e.im.height / e.im.width;
          x.save(); x.globalAlpha = 0.18; x.fillStyle = '#000'; x.beginPath(); x.ellipse(cx, cy + h * 0.32, w * 0.42, h * 0.16, 0, 0, 7); x.fill(); x.restore();
          x.save(); x.translate(cx, cy); if (r() < 0.5) x.scale(-1, 1); x.rotate((r() - 0.5) * 0.5); x.drawImage(e.im, -w / 2, -h / 2, w, h); x.restore();
        }
      }
    }
    // 5) luz do fundo do mar (Atlântida)
    if (B.luz) { x.save(); x.globalCompositeOperation = 'soft-light'; for (let k = 0; k < Math.ceil(W / (T * 6)); k++) { const x0 = k * T * 6 + r() * T * 3; const g = x.createLinearGradient(x0, 0, x0 + T * 4, H); g.addColorStop(0, 'rgba(255,255,230,0.0)'); g.addColorStop(0.5, 'rgba(255,255,230,0.18)'); g.addColorStop(1, 'rgba(255,255,230,0.0)'); x.fillStyle = g; x.beginPath(); x.moveTo(x0, 0); x.lineTo(x0 + T * 2.2, 0); x.lineTo(x0 + T * 2.2 + H * 0.35, H); x.lineTo(x0 + H * 0.35, H); x.closePath(); x.fill(); } x.restore(); }
    m.campos.forEach(f => drawLinhasCampo(x, f));
    yield { p: 1 };
    return c;
  }
  // v385 (dono: "quando entro nos mapas atualizados, mostra o antigo e depois pula para o novo"): enquanto a arte do chão
  // novo baixa, uma CORTINA escura com o nome do lugar cobre o mapa (no lugar do chão antigo); abre quando o chão novo fica
  // pronto. Demorou demais (3,5 s, internet lenta): mostra o chão antigo e abre a cortina, como antes.
  // v393 (dono escolheu "bola rolando + barra"): a tela de entrada mostra o nome do lugar, uma bola rolando em cima de uma
  // barra que enche conforme o mapa fica pronto, a porcentagem e uma dica. A bola gira por CSS (continua girando mesmo
  // se o navegador estiver ocupado).
  const DICAS_ENTRADA = ['Dica: segure o clique para andar sem parar.', 'Dica: comida dá bônus por vários minutos — até 3 ao mesmo tempo!',
    'Dica: a tecla Y abre os emotes e as frases prontas.', 'Dica: clique com o botão direito em outro jogador para chamar para o grupo.',
    'Dica: na caça em grupo, todo mundo ganha experiência pelo bicho de cada um.', 'Dica: o Quadro de cada área de caça tem desafios com prêmio.',
    'Dica: itens +7 ou mais brilham no seu boneco!', 'Dica: o Centro de Treinamento treina as habilidades sozinho, até você andar.'];
  let cortinaDica = '', cortinaMapa = null;
  // v399 (dono: "a animação de transição de mapas ainda está aparecendo, acho que é desnecessária"): a tela de entrada SAIU.
  // O jogo não pausa mais; enquanto o chão novo não fica pronto aparece um chão liso da cor do lugar (o pré-desenho dos
  // vizinhos faz isso ser raro). A função continua (só esconde) para quem ainda a chama.
  const CORTINA_LIGADA = false;
  const cortina = (on, m, prog) => {
    if (!CORTINA_LIGADA) on = false;
    let c = document.getElementById('chaoCortina');
    if (!c) {
      c = el('div', { id: 'chaoCortina' }, el('div', { class: 'cc-caixa' }, el('span', { class: 'cc-nome' }), el('div', { class: 'cc-pista' }, el('div', { class: 'cc-barra' }, el('i', {})), el('div', { class: 'cc-bola' }, el('b', {}, '⚽'))), el('small', { class: 'cc-pct' }), el('p', { class: 'cc-dica' })));
      document.body.append(c);
      // a bola do próprio jogo (a mesma do pé do personagem), desenhada uma vez
      try { if (typeof desenhaBola === 'function') { const bc = mkCanvas(52, 52); desenhaBola(bc.getContext('2d'), 26, 26, 22, 0); const bb = c.querySelector('.cc-bola b'); bb.textContent = ''; bb.style.background = `url(${bc.toDataURL()}) center/contain no-repeat`; } } catch (e) { }
    }
    if (on) {
      const r = typeof CV !== 'undefined' && CV ? CV.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
      Object.assign(c.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      if (cortinaMapa !== m) { cortinaMapa = m; cortinaDica = DICAS_ENTRADA[(Math.random() * DICAS_ENTRADA.length) | 0]; c.querySelector('.cc-barra i').style.width = '0%'; c.querySelector('.cc-bola').style.left = '0%'; }
      const pct = Math.round(Math.max(0, Math.min(1, prog == null ? 0.02 : prog)) * 100);
      c.querySelector('.cc-nome').textContent = m && m.nome ? (/^\p{Extended_Pictographic}/u.test(m.nome) ? '' : '📍 ') + m.nome : ''; // (o nome que já começa com emoji não ganha o 📍)
      c.querySelector('.cc-barra i').style.width = pct + '%'; c.querySelector('.cc-bola').style.left = pct + '%';
      c.querySelector('.cc-pct').textContent = pct + '%'; c.querySelector('.cc-dica').textContent = cortinaDica;
      c.classList.add('on');
    } else { c.classList.remove('on'); cortinaMapa = null; }
  };
  const _rcN = renderChao;
  renderChao = function (m) {
    if (m._chao) return m._chao;
    const bio = m && !m.interior && CHAO2.mapas[m.id];
    if (!bio) return _rcN.apply(this, arguments);
    const artes = artesDoMapa(m); artes.forEach(n => spr(n));
    if (!artes.every(n => pronto(n) || spr(n).err) || !spr('t_grama').ok) {
      if (m._chaoDesistiu) { const r = _rcN.apply(this, arguments); return r; }
      // enquanto espera: um chão liso da cor do bioma, coberto pela cortina
      const B = CHAO2.biomas[bio] || {}, cor = (ESTILO_CHAO[B.base] || ESTILO_CHAO[m.chao[0]] || {}).cor || '#2a2438';
      const ph = mkCanvas(m.w * T, m.h * T), px = ph.getContext('2d'); px.fillStyle = cor; px.fillRect(0, 0, ph.width, ph.height);
      m._chao = ph; cortina(true, m, 0.02 + 0.2 * artes.filter(n => pronto(n) || spr(n).err).length / Math.max(1, artes.length));
      if (!m._esperaChao2) {
        const t0 = Date.now();
        m._esperaChao2 = setInterval(() => {
          const pr = artes.every(n => pronto(n) || spr(n).err);
          if (pr || Date.now() - t0 > 3500) { clearInterval(m._esperaChao2); m._esperaChao2 = null; if (!pr) { m._chaoDesistiu = true; cortina(false); setTimeout(() => { m._chaoDesistiu = false; delete m._chao; }, 4000); } delete m._chao; }
        }, 120);
      }
      return m._chao;
    }
    return comecaDesenho(m, bio, arguments);
  };
  // o desenho em etapas (v393) — v395 (amigo do dono: "ficou pior a animação de entrada, está dando um delay desnecessário"):
  //  1) PRÉ-DESENHO: enquanto você joga, o chão dos mapas vizinhos (pelas saídas) vai sendo feito em segundo plano, ~6 ms por
  //     quadro (imperceptível). Ao passar pela porta ele já está pronto: entra na hora, sem tela nenhuma.
  //  2) mapa LEVE (até ~450 ms neste aparelho) que não ficou pronto antes: desenha de uma vez, como antes da v393 — sem tela.
  //  3) só mapa PESADO (ex.: Labirinto Jurássico) ainda não pronto usa a tela de entrada, e ela só aparece se demorar
  //     mais de 0,25 s (não pisca). O tempo de cada mapa é medido e guardado por aparelho (rac_chao_ms).
  //  4) memória: ficam guardados só os chãos do mapa atual, dos 2 anteriores e o pré-desenhado (celular agradece).
  const LEVE = 450;
  const TEMPOS = (() => { try { return JSON.parse(localStorage.getItem('rac_chao_ms') || '{}') || {}; } catch (e) { return {}; } })();
  const estima = m => TEMPOS[m.id] != null ? TEMPOS[m.id] : Math.round(m.w * m.h * 0.1);
  const FAZENDO = new Map(); // mapa -> { g, p, args, trab (ms de trabalho), fundo (pré-desenho) }
  let preFeito = null; // o último mapa pré-desenhado (fica guardado até você entrar nele)
  function novoDesenho(m, bio, args, fundo) { const f = { g: renderChao2G(m, bio), p: 0.02, args, trab: 0, fundo }; FAZENDO.set(m, f); return f; }
  function comecaDesenho(m, bio, args) {
    let f = FAZENDO.get(m);
    if (f) f.fundo = false; // (vinha sendo pré-desenhado: continua de onde parou, agora com pressa)
    else { f = novoDesenho(m, bio, args, false); passoDesenho(m, f, m._chaoVelho ? 8 : estima(m) <= LEVE ? Infinity : 40); }
    if (!FAZENDO.has(m)) return m._chao; // terminou de uma vez
    if (!m._chaoTemp) {
      const velho = m._chaoVelho; // (redesenho no meio do jogo: fica o chão de antes, sem tela de entrada)
      if (velho) m._chaoTemp = velho;
      else { const B = CHAO2.biomas[bio] || {}, cor = (ESTILO_CHAO[B.base] || ESTILO_CHAO[m.chao[0]] || {}).cor || '#2a2438'; const ph = mkCanvas(m.w * T, m.h * T), px = ph.getContext('2d'); px.fillStyle = cor; px.fillRect(0, 0, ph.width, ph.height); m._chaoTemp = ph; }
    }
    if (!m._chaoVelho && G.mapa === m && CORTINA_LIGADA) { cortina(true, m, f.p); G.carregandoChao = true; }
    return m._chaoTemp; // (sem guardar em m._chao: o renderChao volta aqui a cada quadro)
  }
  function passoDesenho(m, f, orc) {
    const t0 = performance.now();
    try {
      while (performance.now() - t0 < orc) {
        const r = f.g.next();
        if (r.done) {
          f.trab += performance.now() - t0; FAZENDO.delete(m); m._chao = r.value; m._chao2 = true; m._chaoVelho = r.value; m._chaoTemp = null;
          TEMPOS[m.id] = Math.round(f.trab); try { localStorage.setItem('rac_chao_ms', JSON.stringify(TEMPOS)); } catch (e) { }
          if (f.fundo) preFeito = m;
          if (G.mapa === m) { G.carregandoChao = false; cortina(false); }
          return true;
        }
        if (r.value && r.value.p != null) { f.p = r.value.p; if (G.mapa === m && !m._chaoVelho && !f.fundo) cortina(true, m, f.p); }
      }
    } catch (e) {
      console.warn('chão novo', m.id, e); FAZENDO.delete(m); m._chaoTemp = null;
      try { m._chao = _rcN.apply(null, f.args); } catch (e2) { } if (G.mapa === m) { G.carregandoChao = false; cortina(false); }
    }
    f.trab += performance.now() - t0;
    return false;
  }
  // a cada quadro: primeiro o mapa onde você está; o pré-desenho só anda quando não há nada com pressa
  const _loopChao = loop;
  loop = function (ts) {
    let frente = false;
    for (const [m, f] of FAZENDO) { if (m === G.mapa) { frente = true; passoDesenho(m, f, m._chaoVelho ? 8 : CORTINA_LIGADA ? 28 : 14); } } // (sem a tela de entrada o jogo continua andando: um pouco por quadro)
    for (const [m, f] of FAZENDO) { if (m === G.mapa) continue; if (!f.fundo) { FAZENDO.delete(m); m._chaoTemp = null; continue; } if (!frente) passoDesenho(m, f, G.pausado ? 12 : 6); } // (com uma janela aberta o jogo está parado: dá para adiantar mais)
    if (G.carregandoChao && !(G.mapa && FAZENDO.has(G.mapa))) { G.carregandoChao = false; cortina(false); }
    if (!G.carregandoChao) return _loopChao.apply(this, arguments);
    const pz = G.pausado; G.pausado = true; try { return _loopChao.apply(this, arguments); } finally { G.pausado = pz; } // (carregando: parado como numa pausa)
  };
  // escolhe um vizinho para pré-desenhar (o mais pesado primeiro; um de cada vez; só com a arte já baixada)
  function preDesenha() {
    try {
      const m = G.mapa; if (!m || !G.rodando || [...FAZENDO.values()].some(f => f.fundo) || FAZENDO.has(m)) return;
      vizinhosArte(m);
      const ids = [...new Set((m.saidas || []).map(s => s.para))].filter(id => id !== m.id && CHAO2.mapas[id] && typeof MAPAS !== 'undefined' && MAPAS_DEF[id]);
      const cands = [];
      for (const id of ids) {
        let v = null; try { v = getMapa(id); } catch (e) { continue; }
        if (!v || v.interior || v._chao2 || FAZENDO.has(v) || estima(v) < 120) continue;
        if (!artesDoMapa(v).every(n => pronto(n) || spr(n).err) || !spr('t_grama').ok) continue;
        cands.push(v);
      }
      cands.sort((a, b) => estima(b) - estima(a));
      if (cands[0]) novoDesenho(cands[0], CHAO2.mapas[cands[0].id], [cands[0]], true);
    } catch (e) { }
  }
  setInterval(preDesenha, 1500);
  function vizinhosArte(m) { try { for (const id of new Set((m.saidas || []).map(s => s.para))) if (CHAO2.mapas[id] && MAPAS_DEF[id]) { const v = getMapa(id); if (!v.interior) artesDoMapa(v).forEach(n => spr(n)); } } catch (e) { } }
  // memória: solta o chão dos mapas que ficaram para trás (fica o atual, os 2 anteriores e o pré-desenhado)
  const recentes = [];
  function soltaChaos() {
    try {
      if (!G.mapa || typeof MAPAS === 'undefined') return;
      const id = G.mapa.id; const k = recentes.indexOf(id); if (k >= 0) recentes.splice(k, 1); recentes.unshift(id); recentes.length = Math.min(recentes.length, 3);
      if (preFeito === G.mapa) preFeito = null;
      for (const [mid, mm] of Object.entries(MAPAS)) {
        if (!mm || !mm._chao2 || recentes.includes(mid) || mm === preFeito || FAZENDO.has(mm)) continue;
        mm._chao = null; mm._chaoVelho = null; mm._chao2 = false; mm._chaoTemp = null;
      }
    } catch (e) { }
  }
  window.CHAO2_FAZENDO = FAZENDO; window.CHAO2_PRE = { TEMPOS, estima, preDesenha, recentes, gerador: renderChao2G }; // (testes)
  // saiu do mapa antes de terminar: a cortina não fica presa
  const _entCortina = entrarMapa;
  entrarMapa = function () { const r = _entCortina.apply(this, arguments); try { if (!(G.mapa && CHAO2.mapas[G.mapa.id] && !G.mapa.interior && !G.mapa._chao2)) cortina(false); } catch (e) { } return r; };
  // e já vai baixando a arte dos mapas vizinhos (pelas saídas do mapa onde você está), sem pressa
  const vizinhos = () => {
    try {
      const m = G.mapa; if (!m) return;
      const ids = [...new Set((m.saidas || []).map(s => s.para))].filter(id => CHAO2.mapas[id]).slice(0, 4);
      ids.forEach((id, i) => setTimeout(() => { try { const v = getMapa(id); if (!v.interior) artesDoMapa(v).forEach(n => spr(n)); } catch (e) { } }, 1500 + i * 900));
    } catch (e) { }
  };
  const _entViz = entrarMapa;
  entrarMapa = function () { const r = _entViz.apply(this, arguments); soltaChaos(); setTimeout(vizinhos, 800); return r; };
  const css = document.createElement('style');
  css.textContent = `#chaoCortina { position: fixed; z-index: 49; pointer-events: none; display: flex; align-items: center; justify-content: center; background: #0d0a18; opacity: 0; transition: opacity .25s; }
  #chaoCortina.on { opacity: 1; transition: opacity .15s ease .25s; } /* (só aparece se ainda estiver carregando depois de 0,25 s) */
  #chaoCortina .cc-caixa { display: flex; flex-direction: column; align-items: center; gap: 10px; width: min(78%, 420px); }
  #chaoCortina .cc-nome { color: #ffe3a0; font: 800 22px Fredoka, Nunito, sans-serif; text-shadow: 0 2px 6px #000; text-align: center; }
  #chaoCortina .cc-pista { position: relative; width: 100%; height: 34px; margin-top: 14px; }
  #chaoCortina .cc-barra { position: absolute; left: 0; right: 0; bottom: 0; height: 12px; border-radius: 8px; background: #2a2340; border: 2px solid #4a3f6a; overflow: hidden; }
  #chaoCortina .cc-barra i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #3ac26a, #b8f05a); transition: width .25s linear; }
  #chaoCortina .cc-bola { position: absolute; bottom: 9px; left: 0; width: 26px; height: 26px; margin-left: -13px; transition: left .25s linear; animation: ccPula .42s ease-in-out infinite alternate; }
  #chaoCortina .cc-bola b { display: block; width: 26px; height: 26px; font-size: 24px; line-height: 26px; text-align: center; animation: ccGira .5s linear infinite; } /* (abaixo das janelas: z 50) */
  #chaoCortina .cc-pct { color: #cfc4ff; font: 700 13px Nunito, sans-serif; }
  #chaoCortina .cc-dica { margin: 4px 0 0; color: #a99fd0; font: 600 13px Nunito, sans-serif; text-align: center; }
  @keyframes ccGira { to { transform: rotate(360deg); } } @keyframes ccPula { from { transform: translateY(0); } to { transform: translateY(-9px); } }`;
  document.head.append(css);
}

/* ---------- Atlântida: ruas curvas, praças e plataformas redondas (só o CHÃO muda) ---------- */
function trilhaCurva(b, pts, larg, ch, so) {
  const W = b.m.w, H = b.m.h, cr = (p0, p1, p2, p3, t) => { const t2 = t * t, t3 = t2 * t; return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); };
  const P = [pts[0], ...pts, pts[pts.length - 1]], meia = larg / 2;
  for (let k = 0; k < P.length - 3; k++) for (let s = 0; s <= 1; s += 0.02) {
    const x = cr(P[k][0], P[k + 1][0], P[k + 2][0], P[k + 3][0], s), y = cr(P[k][1], P[k + 1][1], P[k + 2][1], P[k + 3][1], s);
    for (let j = Math.floor(y - meia); j <= Math.ceil(y + meia); j++) for (let i = Math.floor(x - meia); i <= Math.ceil(x + meia); i++) {
      if (i < 0 || j < 0 || i >= W || j >= H) continue; if ((i + 0.5 - x) ** 2 + (j + 0.5 - y) ** 2 > meia * meia) continue;
      const k2 = j * W + i; if (!so || so(b.m.chao[k2])) b.m.chao[k2] = ch;
    }
  }
}
function elipseChao(b, cx, cy, rx, ry, ch, so) { const m = b.m; for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) { if (i < 0 || j < 0 || i >= m.w || j >= m.h) continue; if (((i + 0.5 - cx) / rx) ** 2 + ((j + 0.5 - cy) / ry) ** 2 > 1) continue; const k = j * m.w + i; if (!so || so(m.chao[k])) m.chao[k] = ch; } }
{
  const _criaAtl2 = criaAtlantida;
  criaAtlantida = function () {
    const m = _criaAtl2.apply(this, arguments), A = CH.AREIA_MAR, PM = CH.PEDRA_MAR, b = { m }, W = m.w, H = m.h, ok = t => t === A || t === PM;
    try {
      const antes = m.chao.slice();
      for (let k = 0; k < m.chao.length; k++) if (m.chao[k] === PM) m.chao[k] = A; // apaga as ruas retas (a areia volta)
      elipseChao(b, 45, 4.8, 11.5, 4.6, PM, ok); // doca do submarino
      trilhaCurva(b, [[3.5, 9.6], [20, 9.9], [33, 9.4], [45, 9.6], [57, 9.9], [70, 9.4], [86.5, 9.6]], 2.6, PM, ok); // calçada dos prédios do norte
      trilhaCurva(b, [[45, 9], [43.5, 18], [46.5, 27], [45, 34]], 3.6, PM, ok);
      trilhaCurva(b, [[2.5, 39.5], [14, 38], [26, 40.8], [36, 39.4], [54, 39.6], [64, 38.2], [76, 40.8], [87.5, 39.5]], 3.4, PM, ok);
      trilhaCurva(b, [[45, 44], [43.8, 52], [46.2, 60], [45, 67.5]], 3.2, PM, ok);
      elipseChao(b, 45, 39, 10, 7.6, PM, ok); // a Praça de Netuno
      ATL_BAIRROS.forEach(z => {
        const w = 35, cx = z.x + (w >> 1), cy = z.y + 11;
        elipseChao(b, cx, cy, 5.2, 3.8, PM, ok);
        const ya = cy < 39 ? 37.5 : 41.5, xm = cx + (cx < 45 ? 6 : -6);
        trilhaCurva(b, [[cx, cy], [cx + (cx < 45 ? 3 : -3), (cy + ya) / 2], [xm, ya]], 2.6, PM, ok);
        for (const [lx, ly] of [[z.x + 4, z.y + 4], [z.x + w - 11, z.y + 4], [z.x + 4, z.y + 15], [z.x + w - 11, z.y + 15]]) {
          const px = lx + 2, py = ly + 1.6; elipseChao(b, px, py, 3.8, 2.8, PM, ok);
          trilhaCurva(b, [[px, py], [(px + cx) / 2 + (py < cy ? -2 : 2) * (px < cx ? 1 : -1), (py + cy) / 2], [cx, cy]], 2.2, PM, ok);
        }
      });
      trilhaCurva(b, [[3.5, 67.2], [22, 67.5], [45, 67.1], [68, 67.5], [86.5, 67.2]], 2.2, PM, ok); // calçada dos prédios do sul
      for (let it = 0; it < 3; it++) for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) { const k = j * W + i; if (m.chao[k] !== A) continue; if ([k - 1, k + 1, k - W, k + W].filter(q => m.chao[q] === PM).length >= 3) m.chao[k] = PM; }
      const ENF = new Set(['coral_grande', 'alga_alta', 'concha_gigante', 'ancora_bau', 'coluna_ruina', 'bolhas']);
      for (let k = 0; k < m.chao.length; k++) if (antes[k] === A && m.chao[k] === PM && m.obj[k] && ENF.has(m.obj[k].t)) m.obj[k] = null;
      m._tracadoNovo = true;
    } catch (e) { console.warn('traçado de Atlântida', e); }
    return m;
  };
}

/* ---------- caças abertas: o planalto do tema no lugar do "tapete" de enfeites ---------- */
{
  const _criaCacaC2 = criaCaca;
  criaCaca = function (c) {
    const m = _criaCacaC2.apply(this, arguments);
    try {
      const t = TEMAS_CACA[c.tema], alto = CHAO2.mapas[c.id] && CHAO2.planalto[c.tema]; if (!alto || !t || !t.aberto) return m;
      const W = m.w, H = m.h, borda = new Set(t.borda || []), r = mulberry(c.seed * 7 + 3);
      // "fora" = a área bloqueada fora das salas: a ligada à borda do mapa E os bolsões presos entre salas (4+ quadradinhos);
      // a água solta fora das salas (pântano, recife) também entra. Bloqueios pequenos dentro das salas ficam como estão.
      const bloq = new Uint8Array(W * H); for (let k = 0; k < W * H; k++) { const o = m.obj[k]; if ((o && !o.predio && (o.t === 'x' || borda.has(o.t))) || (m.chao[k] === CH.AGUA && !o)) bloq[k] = 1; }
      const fora = new Uint8Array(W * H), comp = new Int32Array(W * H).fill(-1);
      for (let k0 = 0; k0 < W * H; k0++) {
        if (!bloq[k0] || comp[k0] >= 0) continue;
        const lista = [k0], pil = [k0]; comp[k0] = k0; let naBorda = false;
        while (pil.length) { const k = pil.pop(), i = k % W, j = (k / W) | 0; if (i === 0 || j === 0 || i === W - 1 || j === H - 1) naBorda = true;
          for (const [a, b2] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + a, jj = j + b2; if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue; const q = jj * W + ii; if (bloq[q] && comp[q] < 0) { comp[q] = k0; lista.push(q); pil.push(q); } } }
        if (naBorda || lista.length >= 4) for (const k of lista) fora[k] = 1;
      }
      const anda = k => !fora[k] && !(m.obj[k] && (m.obj[k].t === 'x' || m.obj[k].predio)) && m.chao[k] !== CH.AGUA;
      const beira = (i, j) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b2]) => { const ii = i + a, jj = j + b2; return ii >= 0 && jj >= 0 && ii < W && jj < H && anda(jj * W + ii); });
      const postos = [];
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const k = j * W + i; if (!fora[k]) continue;
        m.chao[k] = alto; m.obj[k] = { t: 'x', v: 0 }; // (a água que vira planalto continua bloqueada pelo 'x')
        if (t.borda && t.borda.length && beira(i, j) && r() < 0.32 && !postos.some(([a, b2]) => Math.abs(a - i) + Math.abs(b2 - j) < 4)) { m.obj[k] = { t: t.borda[(r() * t.borda.length) | 0], v: (r() * 1000) | 0 }; postos.push([i, j]); }
      }
      // pedacinhos soltos de passarela/trilha (menos de 4 quadradinhos) voltam a ser chão
      const tr = t.trilha; if (tr != null) { const vis = new Uint8Array(W * H);
        for (let k0 = 0; k0 < W * H; k0++) { if (vis[k0] || m.chao[k0] !== tr) continue; const comp = [k0], pil = [k0]; vis[k0] = 1;
          while (pil.length) { const k = pil.pop(), i = k % W, j = (k / W) | 0; for (const [a, b2] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + a, jj = j + b2; if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue; const q = jj * W + ii; if (!vis[q] && m.chao[q] === tr) { vis[q] = 1; comp.push(q); pil.push(q); } } }
          if (comp.length < 4) for (const k of comp) m.chao[k] = t.chao; } }
      // manchas de variação (ex.: neve na floresta) e poças de água pequenas demais viram o chão da sala: menos "sujeira"
      const juntaPequenos = (alvo, min, vira) => { const vis = new Uint8Array(W * H);
        for (let k0 = 0; k0 < W * H; k0++) { if (vis[k0] || m.chao[k0] !== alvo || fora[k0]) continue; const comp = [k0], pil = [k0]; vis[k0] = 1;
          while (pil.length) { const k = pil.pop(), i = k % W, j = (k / W) | 0; for (const [a, b2] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + a, jj = j + b2; if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue; const q = jj * W + ii; if (!vis[q] && m.chao[q] === alvo && !fora[q]) { vis[q] = 1; comp.push(q); pil.push(q); } } }
          if (comp.length < min) for (const k of comp) { m.chao[k] = vira; if (alvo === CH.AGUA && m.obj[k] && m.obj[k].t === 'x') m.obj[k] = null; } } };
      if (t.var != null) juntaPequenos(t.var, 10, t.chao);
      juntaPequenos(CH.AGUA, 4, t.chao);
      m._planalto = true;
    } catch (e) { console.warn('planalto', c.id, e); }
    return m;
  };
}
if (typeof MAPAS !== 'undefined') for (const k of Object.keys(CHAO2.mapas)) delete MAPAS[k];
window.CHAO2 = CHAO2;

/* ---------- v380: o Escritório da Agência (dono: "os pontos que ficaram sem atualizar") ----------
   antes: o mesmo azulejo das casinhas. Agora: taco de madeira em espinha de peixe, tapete azul com friso dourado no meio
   da sala e sombra suave junto das paredes (as paredes, janelas e quadros continuam os de sempre) */
{
  const ESC = { id: 'agencia_escritorio', piso: 't2_parquet_esc', tapete: 't2_tapete_esc' };
  const _rcEsc = renderChao;
  renderChao = function (m) {
    if (!m || m.id !== ESC.id || m._chao) return _rcEsc.apply(this, arguments);
    const p = spr(ESC.piso), t = spr(ESC.tapete);
    if (!(p.ok && t.ok)) { // (a arte ainda carregando: chão antigo agora, o novo assim que chegar)
      if (!p.err && !t.err && !m._esperaEsc) m._esperaEsc = setInterval(() => { const a = spr(ESC.piso), b = spr(ESC.tapete); if ((a.ok || a.err) && (b.ok || b.err)) { clearInterval(m._esperaEsc); m._esperaEsc = null; delete m._chao; } }, 300);
      return _rcEsc.apply(this, arguments);
    }
    const W = m.w * T, H = m.h * T, c = mkCanvas(W, H), x = c.getContext('2d');
    const pad = (e, tiles) => { const q = x.createPattern(e.im, 'repeat'), k = (tiles * T) / e.im.width; q.setTransform(new DOMMatrix([k, 0, 0, k, 0, 0])); return q; };
    x.fillStyle = pad(p, 4); x.fillRect(0, 0, W, H);
    x.save(); x.globalCompositeOperation = 'soft-light'; const brilho = x.createRadialGradient(W / 2, H * 0.55, T, W / 2, H * 0.55, W * 0.6); brilho.addColorStop(0, 'rgba(255,240,210,0.55)'); brilho.addColorStop(1, 'rgba(0,0,0,0.5)'); x.fillStyle = brilho; x.fillRect(0, 0, W, H); x.restore();
    // o tapete (entre a recepção e a saída, sem passar por baixo dos móveis da parede)
    const tx = 3.55 * T, ty = 5.2 * T, tw = 5.9 * T, th = 2.5 * T;
    x.save(); x.shadowColor = 'rgba(0,0,0,0.35)'; x.shadowBlur = T * 0.18; x.shadowOffsetY = T * 0.06; x.fillStyle = '#1d2a5a'; x.beginPath(); x.roundRect(tx, ty, tw, th, T * 0.18); x.fill(); x.restore();
    x.save(); x.beginPath(); x.roundRect(tx, ty, tw, th, T * 0.18); x.clip(); x.fillStyle = pad(t, 3); x.fillRect(tx, ty, tw, th); x.restore();
    x.save(); x.strokeStyle = '#d9b45a'; x.lineWidth = T * 0.05; x.beginPath(); x.roundRect(tx + T * 0.16, ty + T * 0.16, tw - T * 0.32, th - T * 0.32, T * 0.1); x.stroke();
    x.globalAlpha = 0.55; x.lineWidth = T * 0.025; x.beginPath(); x.roundRect(tx + T * 0.26, ty + T * 0.26, tw - T * 0.52, th - T * 0.52, T * 0.07); x.stroke();
    // a estrela da agência no meio
    x.globalAlpha = 0.85; x.fillStyle = '#d9b45a'; x.beginPath(); const cx = tx + tw / 2, cy = ty + th / 2; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? T * 0.17 : T * 0.4; x.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } x.closePath(); x.fill(); x.restore();
    // sombra junto das paredes
    x.save(); const s1 = x.createLinearGradient(0, 2 * T, 0, 2.9 * T); s1.addColorStop(0, 'rgba(30,15,5,0.45)'); s1.addColorStop(1, 'rgba(30,15,5,0)'); x.fillStyle = s1; x.fillRect(0, 2 * T, W, 0.9 * T);
    for (const [x0, dir] of [[0, 1], [W, -1]]) { const g = x.createLinearGradient(x0, 0, x0 + dir * 0.9 * T, 0); g.addColorStop(0, 'rgba(30,15,5,0.4)'); g.addColorStop(1, 'rgba(30,15,5,0)'); x.fillStyle = g; x.fillRect(dir > 0 ? 0 : W - 0.9 * T, 0, 0.9 * T, H); }
    x.restore();
    desenhaParedes(x, m);
    m._chao = c; return c;
  };
}
