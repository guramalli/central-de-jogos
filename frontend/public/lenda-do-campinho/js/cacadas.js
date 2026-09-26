/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ÁREAS DE CAÇA (tipo as "caves" do Tibia)
   Lugares só de UM adversário, em grande quantidade, para treinar e
   fazer missões. Cada área fica numa cidade (entrada = um prédio com
   porta) e tem a cara do lugar: mata, praia, bambuzal, pântano, deserto,
   cais, fazenda... ou lugares fechados e escuros (tumba, túnel, catacumba,
   caverna de gelo, esgoto, cratera, gruta de cristal).
   Dentro: Guia da caçada (2 missões), Quadro de Desafios, saída.
   Os adversários são os MESMOS da cidade (nada novo), só que juntos e
   voltando mais rápido. Morrer lá dentro = acordar na cidade.
   Para criar uma área nova: uma linha em CACADAS (+ arte da entrada).
   Carregar DEPOIS de arenas.js, casas.js e clima.js.
   ============================================================ */

/* ---------- chão novo (texturas retingidas: emendam sem costura) ---------- */
CH.CAVERNA = 30; CH.PAREDE_CAV = 31; CH.ARENITO = 32; CH.GELO = 33; CH.LODO = 34; CH.ROCHA_LAVA = 35; CH.CONCRETO_ESC = 36; CH.FACE_CAV = 37;
Object.assign(ESTILO_CHAO, {
  [CH.CAVERNA]: { cor: '#6e5c4a', borda: '#4a3c30', r: 0.2, e: 0.05, tex: 'terra', o: 5.2 },
  [CH.ARENITO]: { cor: '#d6b67a', borda: '#a88a52', r: 0.1, e: 0.03, tex: 'pedra', o: 5.3 },
  [CH.GELO]: { cor: '#c4e2f2', borda: '#8ab4cc', r: 0.2, e: 0.04, tex: 'liso', o: 5.4 },
  [CH.LODO]: { cor: '#6e7a44', borda: '#4a5430', r: 0.45, e: 0.14, tex: 'terra', o: 1.5 },
  [CH.CONCRETO_ESC]: { cor: '#7a7e82', borda: '#56595e', r: 0, e: 0, tex: 'calcada', o: 5.5 },
  [CH.ROCHA_LAVA]: { cor: '#4a3434', borda: '#1e1212', r: 0.35, e: 0.12, tex: 'pedra', o: 20 },
  [CH.PAREDE_CAV]: { cor: '#3a3444', borda: '#17131e', r: 0.35, e: 0.12, tex: 'pedra', o: 21 },
  [CH.FACE_CAV]: { cor: '#5c5466', borda: '#2a2430', r: 0, e: 0, tex: 'pedra', o: 19 }, // a "frente" da parede (dá volume)
});
Object.assign(TEX_CHAO, { [CH.CAVERNA]: 't_caverna', [CH.PAREDE_CAV]: 't_parede_cav', [CH.ARENITO]: 't_arenito', [CH.GELO]: 't_gelo', [CH.LODO]: 't_lodo', [CH.ROCHA_LAVA]: 't_rocha_lava', [CH.CONCRETO_ESC]: 't_concreto_escuro', [CH.FACE_CAV]: 't_face_cav' });
Object.assign(CH_MINI, { 30: '#6e5c4a', 31: '#231e2c', 32: '#d6b67a', 33: '#c4e2f2', 34: '#6e7a44', 35: '#2e1a1a', 36: '#7a7e82', 37: '#3a3444' });

/* ---------- artes ---------- */
Object.assign(OBJ_INFO, {
  estalagmite: { w: 1.3, b: 1 }, cristais: { w: 1.1, b: 1 }, cogumelos: { w: 1.3, b: 1 }, tocha: { w: 0.42, b: 1 },
  teia: { w: 1.5, b: 1 }, gelo_bloco: { w: 1.3, b: 1 }, rocha_lava: { w: 1.35, b: 1 }, rochas: { w: 1.45, b: 1 },
});
Object.keys(OBJ_INFO).forEach(k => { if (OBJ_INFO[k].b) OBJ_BLOQUEIA.add(k); });
Object.assign(OBJ_MINI, { estalagmite: '#6a5a48', rochas: '#8a8580', cristais: '#8a6ae0', gelo_bloco: '#aee0f8', rocha_lava: '#a0402a' });
const ASSETS_CACA = 'estalagmite cristais cogumelos tocha teia gelo_bloco rocha_lava rochas t_caverna t_parede_cav t_arenito t_gelo t_lodo t_rocha_lava t_concreto_escuro t_face_cav ent_bueiro ent_gruta_praia ent_metro ent_tumba ent_torii ent_palafita ent_celeiro ent_gelo ent_vulcao ent_cais ent_catacumba ent_cristal ent_trilha ent_parque ent_tunel ent_oasis'.split(' ');
ASSETS_CACA.forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });

/* ---------- temas ---------- */
// aberto: paredes = vegetação/pedras (ou água); fechado: paredes de rocha, lugar escuro com tochas/cristais
const TEMAS_CACA = {
  mata: { aberto: 1, chao: CH.GRAMA, var: CH.GRAMA_FLOR, trilha: CH.TERRA, borda: ['arvore', 'arvore', 'mangueira', 'arbusto'], props: ['arbusto', 'pedra', 'cogumelos'] },
  campo: { aberto: 1, chao: CH.GRAMA, trilha: CH.TERRA, borda: ['arvore', 'arbusto', 'arvore'], props: ['cones', 'barreiras', 'sacola_bolas', 'bebedouro', 'arbusto'] },
  praia: { aberto: 1, chao: CH.AREIA, var: CH.AREIA_MOLHADA, borda: ['rochas', 'coqueiro', 'coqueiro2', 'rochas'], agua: 0.45, props: ['pedra', 'boia', 'castelo', 'guarda_sol', 'coqueiro'] },
  bambu: { aberto: 1, chao: CH.GRAMA, trilha: CH.TERRA, borda: ['bambu', 'bambu', 'cerejeira'], props: ['lanterna_pedra', 'bambu', 'pedra', 'cerejeira'] },
  deserto: { aberto: 1, chao: CH.AREIA, trilha: CH.ARENITO, borda: ['rochas', 'palmeira_tamara', 'rochas', 'duna'], props: ['jarros', 'rochas', 'palmeira_tamara', 'camelo'] },
  pantano: { aberto: 1, chao: CH.LODO, var: CH.GRAMA, trilha: CH.CAMPO_TERRA, borda: ['mangueira', 'arvore', 'arbusto'], agua: 0.35, props: ['cogumelos', 'arbusto', 'flamingo', 'pedra'] },
  cais: { aberto: 1, chao: CH.PARALELO, var: CH.CALCADA_PT, trilha: CH.CONCRETO, borda: [], agua: 1, props: ['poste3', 'banca_jornal', 'lixeira2', 'carrinho_flores', 'boia'] },
  fazenda: { aberto: 1, chao: CH.GRAMA, trilha: CH.TERRA, borda: ['arvore', 'cipreste', 'arbusto'], props: ['pedra', 'arbusto', 'cipreste'] },
  metro: { chao: CH.CONCRETO_ESC, parede: CH.PAREDE_CAV, props: ['grafite', 'lixeira2', 'banco', 'rochas'], enfeite: ['rochas'], luz: ['poste2', 'tocha'], tocha: 'poste2', cor: '255,215,150' },
  tunel: { chao: CH.CONCRETO, parede: CH.PAREDE_CAV, props: ['cones', 'barreiras', 'bebedouro', 'sacola_bolas'], enfeite: ['rochas'], luz: ['holofote'], tocha: 'holofote', cor: '255,245,210' },
  tumba: { chao: CH.ARENITO, parede: CH.PAREDE_CAV, props: ['jarros', 'obelisco', 'lanterna_arabe'], enfeite: ['rochas', 'estalagmite'], luz: ['tocha', 'lanterna_arabe'], tocha: 'tocha', cor: '255,190,110' },
  catacumba: { chao: CH.PARALELO, parede: CH.PAREDE_CAV, props: ['teia', 'rochas', 'estalagmite'], enfeite: ['estalagmite', 'teia'], luz: ['tocha'], tocha: 'tocha', cor: '255,190,110' },
  gelo: { chao: CH.GELO, parede: CH.PAREDE_CAV, props: ['gelo_bloco', 'cristais', 'pinheiro'], enfeite: ['gelo_bloco', 'estalagmite'], luz: ['cristais'], tocha: 'cristais', cor: '150,200,255' },
  esgoto: { chao: CH.CONCRETO_ESC, parede: CH.PAREDE_CAV, canal: 1, props: ['lixeira2', 'rochas'], enfeite: ['rochas'], luz: ['tocha'], tocha: 'tocha', cor: '255,200,130' },
  lava: { chao: CH.CAVERNA, parede: CH.ROCHA_LAVA, props: ['rocha_lava', 'rocha_lava', 'estalagmite', 'rochas'], enfeite: ['rocha_lava', 'rocha_lava', 'estalagmite'], densa: 1, luz: ['rocha_lava', 'tocha'], tocha: 'rocha_lava', cor: '255,120,60' },
  cristal: { chao: CH.CAVERNA, parede: CH.PAREDE_CAV, props: ['cristais', 'cogumelos', 'estalagmite'], enfeite: ['cristais', 'estalagmite'], luz: ['cristais', 'cogumelos'], tocha: 'cristais', cor: '170,140,255' },
};

/* ---------- as áreas ---------- */
const lkGuia = (pele, cor, extra) => Object.assign({ tipo: 'humano', corpo: 'm', alt: 1.72, pele, cabelo: 'cabelo-curto', corCabelo: 'castanho', roupa: 'roupa-futebol', corRoupa: cor, baixo: 'baixo-jeans', chapeu: 'chapeu-bone', pescoco: 'pescoco-apito' }, extra || {});
const CACADAS = [
  { id: 'caca_bosque', nome: 'Bosque do Caramelo', host: 'vila', m: 'caramelo', tema: 'mata', ent: 'ent_trilha', guia: 'Dona Cida, a guarda-florestal', look: lkGuia('pele-media', '#3a7a3a', { corpo: 'f', cabelo: 'cabelo-coque' }) },
  { id: 'caca_gruta', nome: 'Gruta dos Caranguejos', host: 'praia', m: 'caranguejo', tema: 'praia', ent: 'ent_gruta_praia', guia: 'Seu Nonato, o pescador', look: lkGuia('pele-morena', '#e8d8a8', { chapeu: 'chapeu-palha' }) },
  { id: 'caca_metro', nome: 'Metrô Abandonado', host: 'cidade', m: 'skatista', tema: 'metro', ent: 'ent_metro', guia: 'Rafa, o grafiteiro', look: lkGuia('pele-negra', '#e05a8a', { roupa: 'roupa-moletom' }) },
  { id: 'caca_anexo', nome: 'Campos Anexos do CT', host: 'ct', m: 'volante', tema: 'campo', ent: 'ent_parque', guia: 'Professor Válter', look: lkGuia('pele-clara', '#3a6ad9') },
  { id: 'caca_tunel', nome: 'Túnel do Estádio', host: 'estadio', m: 'centroavante', tema: 'tunel', ent: 'ent_tunel', guia: 'Seu Jorge, o roupeiro', look: lkGuia('pele-retinta', '#2a8a4a', { corCabelo: 'grisalho' }) },
  { id: 'caca_tumba', nome: 'Tumba da Esfinge', host: 'cairo', m: 'cairo_zagueiro', tema: 'tumba', ent: 'ent_tumba', guia: 'Doutora Nadia, arqueóloga', look: lkGuia('pele-morena', '#d8b878', { corpo: 'f', cabelo: 'cabelo-coque', corCabelo: 'preto', chapeu: 'chapeu-palha' }) },
  { id: 'caca_bambu', nome: 'Bambuzal dos Ninjas', host: 'toquio', m: 'toquio_rapido', tema: 'bambu', ent: 'ent_torii', guia: 'Mestre Kenji', look: lkGuia('pele-clara', '#2a2a3a', { corCabelo: 'grisalho', chapeu: null }) },
  { id: 'caca_oasis', nome: 'Oásis das Dunas', host: 'doha', m: 'doha_zagueiro', tema: 'deserto', ent: 'ent_oasis', guia: 'Karim, o guia do deserto', look: lkGuia('pele-morena', '#f4f4f0', { corCabelo: 'preto' }) },
  { id: 'caca_pantano', nome: 'Pântano dos Everglades', host: 'miami', m: 'miami_rapido', tema: 'pantano', ent: 'ent_palafita', guia: 'Capitã Joana, do barco', look: lkGuia('pele-negra', '#e0a030', { corpo: 'f', cabelo: 'cabelo-black-power', corCabelo: 'preto' }) },
  { id: 'caca_cais', nome: 'Cais Escondido', host: 'lisboa', m: 'ponta_alfama', tema: 'cais', ent: 'ent_cais', guia: 'Seu Manel, o marinheiro', look: lkGuia('pele-clara', '#2a4a8a', { corCabelo: 'grisalho' }) },
  { id: 'caca_fazenda', nome: 'Fazenda dos Toureiros', host: 'madri', m: 'zagueiro_toureiro', tema: 'fazenda', ent: 'ent_celeiro', guia: 'Don Paco, o fazendeiro', look: lkGuia('pele-clara', '#c0302a', { chapeu: 'chapeu-palha', corCabelo: 'grisalho' }) },
  { id: 'caca_catacumba', nome: 'Catacumbas de Milão', host: 'milao', m: 'milao_fanatico', tema: 'catacumba', ent: 'ent_catacumba', guia: 'Frei Lorenzo', look: lkGuia('pele-clara', '#6a4a2a', { chapeu: null, corCabelo: 'grisalho' }) },
  { id: 'caca_gelo', nome: 'Caverna de Gelo dos Alpes', host: 'munique', m: 'munique_zagueiro', tema: 'gelo', ent: 'ent_gelo', guia: 'Heidi, a alpinista', look: lkGuia('pele-clara', '#d02a2a', { corpo: 'f', cabelo: 'cabelo-coque', corCabelo: 'loiro', chapeu: 'chapeu-gorro' }) },
  { id: 'caca_esgoto', nome: 'Esgotos de Londres', host: 'londres', m: 'fanatico_eastend', tema: 'esgoto', ent: 'ent_bueiro', guia: 'Mr. Oliver, o encanador', look: lkGuia('pele-media', '#3a5a3a') },
  { id: 'caca_cratera', nome: 'Cratera da Patagônia', host: 'buenos', m: 'buenos_zagueiro', tema: 'lava', ent: 'ent_vulcao', guia: 'Doña Inés, a vulcanóloga', look: lkGuia('pele-media', '#e06a2a', { corpo: 'f', cabelo: 'cabelo-coque', corCabelo: 'preto' }) },
  { id: 'caca_cristal', nome: 'Gruta de Cristal da Tijuca', host: 'rio', m: 'rio_rapido', tema: 'cristal', ent: 'ent_cristal', guia: 'Seu Bené, o mateiro', look: lkGuia('pele-retinta', '#6a3ad9', { corCabelo: 'grisalho', chapeu: 'chapeu-palha' }) },
];
const CACA_POR_ID = {}; CACADAS.forEach((c, i) => { CACA_POR_ID[c.id] = c; c.seed = 7301 + i * 97; });
const nivelCaca = c => { const d = MONSTROS[c.m]; try { return nivelMonstro(d); } catch (e) { return d.nivel || d._nv || 1; } };

/* ---------- montagem do mapa da área ---------- */
const CACA_W = 52, CACA_H = 42;
function criaCaca(c) {
  const t = TEMAS_CACA[c.tema]; const W = CACA_W, H = CACA_H; const r = mulberry(c.seed);
  if (!c.porta) getMapa(c.host); // garante a porta na cidade (para a saída voltar em frente a ela)
  const b = new Construtor(c.id, '🎯 ' + c.nome, W, H, t.aberto ? t.chao : t.parede, c.seed);
  const piso = new Uint8Array(W * H); // 0 parede, 1 sala, 2 corredor
  const cava = (x, y, v = 1) => { if (x > 1 && y > 1 && x < W - 2 && y < H - 2 && piso[y * W + x] !== 1) piso[y * W + x] = v; };
  const salas = [{ x: (W >> 1) - 5, y: H - 10, w: 10, h: 6, entrada: true }];
  for (let tent = 0; salas.length < 12 && tent < 900; tent++) {
    const w = 6 + ((r() * 5) | 0), h = 5 + ((r() * 4) | 0), x = 3 + ((r() * (W - w - 6)) | 0), y = 3 + ((r() * (H - h - 14)) | 0);
    if (salas.some(s => x < s.x + s.w + 2 && x + w + 2 > s.x && y < s.y + s.h + 2 && y + h + 2 > s.y)) continue;
    salas.push({ x, y, w, h });
  }
  for (const s of salas) for (let j = s.y; j < s.y + s.h; j++) for (let i = s.x; i < s.x + s.w; i++) cava(i, j);
  if (t.aberto) for (const s of salas) for (let k = 0; k < 5; k++) { // beiradas redondas, com cara de clareira
    const cx = s.x + r() * s.w, cy = s.y + r() * s.h, rr = 1.6 + r() * 1.8;
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j <= rr * rr) cava(Math.round(cx + i), Math.round(cy + j));
  }
  const cen = s => ({ x: s.x + (s.w >> 1), y: s.y + (s.h >> 1) });
  const larg = t.aberto ? 3 : 2;
  const corredor = (p, q) => {
    const passo = (x, y) => { for (let a = 0; a < larg; a++) for (let d = 0; d < larg; d++) cava(x + a - (larg >> 1), y + d - (larg >> 1), 2); };
    let x = p.x, y = p.y; const hFirst = r() < 0.5;
    const anda = eixo => { if (eixo === 'h') while (x !== q.x) { passo(x, y); x += Math.sign(q.x - x); } else while (y !== q.y) { passo(x, y); y += Math.sign(q.y - y); } };
    anda(hFirst ? 'h' : 'v'); anda(hFirst ? 'v' : 'h'); passo(x, y);
  };
  const lig = [salas[0]], falta = salas.slice(1);
  while (falta.length) {
    let best = null;
    for (const a of falta) for (const o of lig) { const d = Math.abs(cen(a).x - cen(o).x) + Math.abs(cen(a).y - cen(o).y); if (!best || d < best.d) best = { a, o, d }; }
    corredor(cen(best.a), cen(best.o)); lig.push(best.a); falta.splice(falta.indexOf(best.a), 1);
  }
  for (let k = 0; k < 2 && salas.length > 4; k++) corredor(cen(salas[1 + ((r() * (salas.length - 1)) | 0)]), cen(salas[1 + ((r() * (salas.length - 1)) | 0)])); // um ou dois atalhos (não é beco sem saída)
  const P = (i, j) => i >= 0 && j >= 0 && i < W && j < H && piso[j * W + i] > 0;
  const vizPiso = (i, j) => P(i - 1, j) || P(i + 1, j) || P(i, j - 1) || P(i, j + 1);
  // chão e paredes
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const v = piso[j * W + i];
    if (v) {
      let ch = t.chao;
      if (v === 2 && t.trilha) ch = t.trilha;
      else if (t.var && hash2(i >> 1, j >> 1) < 0.28) ch = t.var;
      if (t.canal && v === 1 && !salas[0].entrada) ch = ch; // (canais abaixo)
      b.chao(i, j, ch);
      continue;
    }
    if (!t.aberto) { b.chao(i, j, P(i, j + 1) ? CH.FACE_CAV : t.parede); b.obj(i, j, 'x'); continue; }
    const perto = vizPiso(i, j);
    if (t.agua && (t.agua >= 1 || hash2(i * 3, j * 5) < t.agua)) { b.chao(i, j, CH.AGUA); continue; } // mar, lagoa, canal do cais
    if (t.borda.length && (i + j) % 2 === 0) b.obj(i, j, t.borda[(hash2(i, j * 7) * t.borda.length) | 0]);
    else b.obj(i, j, perto && t.borda.length ? t.borda[(hash2(j, i * 3) * t.borda.length) | 0] : 'x');
  }
  // esgoto: canal de água no meio das salas grandes (com passagem)
  if (t.canal) for (const s of salas.slice(1)) if (s.w >= 8) { const cy = s.y + (s.h >> 1); for (let i = s.x + 1; i < s.x + s.w - 1; i++) if (i !== s.x + (s.w >> 1) && i !== s.x + (s.w >> 1) - 1) b.chao(i, cy, CH.AGUA); }
  // enfeites nas paredes (fechado): rochas/cristais/tochas encostados na parede
  if (!t.aberto) for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
    if (piso[j * W + i] || !P(i, j + 1)) continue; // parede com chão logo abaixo (fica bonita "de frente")
    const h = hash2(i * 11, j * 13);
    if (h < 0.14) b.obj(i, j, t.tocha); else if (h < (t.densa ? 0.42 : 0.3) && t.enfeite) b.obj(i, j, t.enfeite[(h * 97 | 0) % t.enfeite.length]);
  }
  // sala de entrada: saída (volta para a cidade), guia, quadro, placa
  // a mesma arte da entrada vira a saída, no fundo da sala; a porta é alcançada por um caminhozinho na frente dela
  const E = salas[0], ex = E.x + (E.w >> 1), ey = E.y + E.h - 1;
  const chFrente = t.aberto ? (t.trilha || t.chao) : t.chao;
  for (let a = -2; a <= 2; a++) { b.chao(ex + a, ey + 1, chFrente); b.obj(ex + a, ey + 1, null); piso[(ey + 1) * W + ex + a] = 1; }
  b.predio(c.ent, ex - 1, ey - 1, 3, 2, c.host, ex);
  const sd = b.m.saidas.find(s => s.x === ex && s.y === ey); if (sd && c.porta) { sd.tx = c.porta.x; sd.ty = c.porta.y + 1; }
  b.npc('guia_' + c.id, E.x + 1, E.y + 1); b.npc('quadro', E.x + E.w - 2, E.y + 1);
  b.placa(E.x + 1, E.y + E.h - 1, `🎯 ${c.nome.toUpperCase()} — aqui só tem ${MONSTROS[c.m].nome} (nível ${nivelCaca(c)}). Missões com o Guia e desafios no Quadro!`);
  b.m.inicio = { x: ex, y: E.y + 2 }; b.m.renasce = { x: ex, y: E.y + 2 };
  // adversários: um grupo por sala (bem mais que na cidade), e só dessa espécie
  for (const s of salas.slice(1)) { const q = Math.max(3, Math.min(6, Math.round(s.w * s.h / 10))); b.spawn(c.m, s.x + (s.w >> 1), s.y + (s.h >> 1), q, 3); }
  // objetos soltos no chão: só onde tem chão em volta todo (nunca fecha passagem)
  const ocup = [];
  for (let j = 2; j < H - 2; j++) for (let i = 2; i < W - 2; i++) {
    if (piso[j * W + i] !== 1 || r() > 0.07) continue;
    if (i >= E.x - 1 && i <= E.x + E.w && j >= E.y - 1) continue;
    let ok = true; for (let dj = -1; dj <= 1 && ok; dj++) for (let di = -1; di <= 1; di++) if (!P(i + di, j + dj) || b.m.chao[(j + dj) * W + i + di] === CH.AGUA) { ok = false; break; }
    if (!ok || ocup.some(([a, bb]) => Math.abs(a - i) <= 2 && Math.abs(bb - j) <= 2) || b.m.obj[j * W + i]) continue;
    ocup.push([i, j]); b.obj(i, j, t.props[(r() * t.props.length) | 0]);
  }
  Object.assign(b.m, { caca: c.id, fechado: !t.aberto, luzCor: t.cor || null, luzes: t.luz || [] });
  return b.m;
}

// entrada na cidade: um "prédio" com porta perto de onde o jogador chega, num lugar que dá para alcançar andando
function poeEntradaCaca(m, c) {
  const W = m.w, H = m.h; const bloq = (x, y) => { if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return true; const o = m.obj[y * W + x]; return m.chao[y * W + x] === CH.AGUA || !CH_ANDA(m.chao[y * W + x]) || (o && OBJ_BLOQUEIA.has(o.t)); };
  const ini = m.inicio || { x: W >> 1, y: H >> 1 };
  // o que dá para alcançar a partir da chegada
  const alc = new Uint8Array(W * H); const fila = [[ini.x, ini.y]]; alc[ini.y * W + ini.x] = 1;
  while (fila.length) { const [x, y] = fila.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (bloq(nx, ny) || alc[ny * W + nx]) continue; alc[ny * W + nx] = 1; fila.push([nx, ny]); } }
  const livre = (x, y) => !bloq(x, y) && !m.obj[y * W + x] && !m.saidas.some(s => Math.abs(s.x - x) < 2 && Math.abs(s.y - y) < 2)
    && !m.npcs.some(n => Math.abs(n.x - x) < 3 && Math.abs(n.y - y) < 3) && !m.campos.some(f => x >= f.x - 1 && x <= f.x + f.w && y >= f.y - 1 && y <= f.y + f.h)
    && !m.predios.some(p => x >= p.x - 1 && x <= p.x + p.w && y >= p.y - 2 && y <= p.y + p.h + 1) && !(m.placas || []).some(p => Math.abs(p.x - x) < 2 && Math.abs(p.y - y) < 2);
  const cabe = (x, y) => { for (let j = y - 1; j <= y + 2; j++) for (let i = x - 1; i <= x + 3; i++) if (!livre(i, j)) return false; return alc[(y + 2) * W + x + 1] === 1; };
  for (let rr = 6; rr < 40; rr++) for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== rr) continue;
    const x = ini.x + dx, y = ini.y + dy;
    if (!cabe(x, y)) continue;
    const p = { spr: c.ent, x, y, w: 3, h: 2, porta: { x: x + 1, y: y + 1 }, interior: c.id };
    for (let j = y; j < y + 2; j++) for (let i = x; i < x + 3; i++) m.obj[j * W + i] = { t: 'x', v: 0, predio: true };
    m.obj[(y + 1) * W + x + 1] = null; m.predios.push(p); m.saidas.push({ x: x + 1, y: y + 1, para: c.id, porta: true });
    m.obj[(y + 1) * W + x + 3] = { t: 'placa', v: 1 }; m.placas.push({ x: x + 3, y: y + 1, texto: `🎯 ÁREA DE CAÇA: ${c.nome} — só ${MONSTROS[c.m].nome} (nível ${nivelCaca(c)}), em grande quantidade. Missões lá dentro!` });
    c.porta = { x: x + 1, y: y + 1 }; return true;
  }
  console.warn('área de caça sem lugar na cidade:', c.id); return false;
}

for (const c of CACADAS) {
  MAPAS_DEF[c.id] = () => criaCaca(c);
  const base = MAPAS_DEF[c.host];
  MAPAS_DEF[c.host] = function () { const m = base(); poeEntradaCaca(m, c); return m; };
  if (TEMAS_CACA[c.tema].aberto && CLIMA_CIDADE[c.host]) { CLIMA_CIDADE[c.id] = CLIMA_CIDADE[c.host]; if (HEMISFERIO_SUL.has(c.host)) HEMISFERIO_SUL.add(c.id); }
  const d = MONSTROS[c.m], L = nivelCaca(c);
  NPCS['guia_' + c.id] = { nome: c.guia, look: c.look, ola: `Bem-vindo(a) à área de caça ${c.nome}! Aqui só aparece ${d.nome} (nível ${L}), e muitos! Lugar perfeito para treinar. Quer uma missão?` };
  DESAFIOS[c.id] = [[c.m, 100], [c.m, 250]];
  const xpNivel = x => xpPara(x + 1) - xpPara(x);
  MISSOES.push(
    { id: c.id + '_m1', npc: 'guia_' + c.id, titulo: `Caçada: ${c.nome}`, lvl: Math.max(1, L - 5), texto: `Esta área está lotada de adversários do tipo ${d.nome}. Passe por 80 deles e mostre quem manda aqui!`, req: { kill: c.m, n: 80 }, rec: { xp: Math.round(xpNivel(L) * 0.8), ouro: L * 90, itens: [['pacotinho', 1]] }, fim: 'Isso é que é treino! Volte quando quiser: eles não param de aparecer.' },
    { id: c.id + '_m2', npc: 'guia_' + c.id, titulo: `Grande Caçada: ${c.nome}`, lvl: Math.max(1, L - 2), pre: c.id + '_m1', texto: `Agora o desafio de verdade: passe por 250 adversários do tipo ${d.nome}. Quem termina essa vira Caçador(a) Oficial: ${c.nome}!`, req: { kill: c.m, n: 250 }, rec: { xp: Math.round(xpNivel(L) * 2), ouro: L * 250, itens: [['pacotinho', 2]], flag: 'cacador_' + c.id }, fim: `CAÇADOR(A) OFICIAL: ${c.nome.toUpperCase()}! Seu nome vai ficar na nossa parede.` },
  );
}
if (typeof PAPEL !== 'undefined') CACADAS.forEach(c => { if (!PAPEL['guia_' + c.id]) PAPEL['guia_' + c.id] = c.look.corpo === 'f' ? 'adulta' : 'adulto'; });

/* ---------- regras dentro da área ---------- */
// voltam mais rápido (12–20 s em vez de 22–38 s)
const _matarCaca = matar;
matar = function (m) {
  const r = _matarCaca.apply(this, arguments);
  if (G.mapa && G.mapa.caca) for (let i = G.respawns.length - 1; i >= 0; i--) if (G.respawns[i].sp === m.sp) { G.respawns[i].em = Math.min(G.respawns[i].em, G.agora + rnd(12000, 20000)); break; }
  return r;
};
// ficou exausto lá dentro: acorda na cidade
const _renascerCaca = renascer;
renascer = function () {
  if (G.mapa && G.mapa.caca) { const c = CACA_POR_ID[G.mapa.caca]; if (c) G.mapa = getMapa(c.host); }
  return _renascerCaca.apply(this, arguments);
};
// ao entrar: explica o lugar e avisa se é forte demais
const _entrarMapaCaca = entrarMapa;
entrarMapa = function (id) {
  const r = _entrarMapaCaca.apply(this, arguments);
  const c = CACA_POR_ID[id];
  if (c && G.save) {
    const L = nivelCaca(c);
    log(`🎯 Área de caça: só ${MONSTROS[c.m].nome} (nível ${L}). Fale com ${c.guia.split(',')[0]} para pegar missões.`, 'l-sis');
    if (G.save.nivel < L - 6) { log(`⚠️ Cuidado! Os adversários daqui são nível ${L} e você é nível ${G.save.nivel}.`, 'l-dano'); }
  }
  return r;
};
// lugares fechados: escuro, com luz das tochas/cristais e em volta do jogador
const _desenhaNoiteCaca = desenhaNoite;
desenhaNoite = function (ctx, cam, vw, vh, x0, y0, x1, y1) {
  const m = G.mapa;
  if (!m || !m.fechado) return _desenhaNoiteCaca.apply(this, arguments);
  ctx.fillStyle = 'rgba(12,8,24,0.42)'; ctx.fillRect(cam.x, cam.y, vw, vh);
  ctx.globalCompositeOperation = 'lighter';
  const cor = m.luzCor || '255,200,130';
  const luz = (x, y, r, int) => { const g = ctx.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, `rgba(${cor},${int})`); g.addColorStop(1, `rgba(${cor},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
  for (let y = Math.max(0, y0); y < Math.min(m.h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(m.w, x1); x++) { const o = m.obj[y * m.w + x]; if (o && m.luzes.includes(o.t)) luz((x + 0.5) * T, (y + 0.2) * T, 150, 0.22); }
  const g = ctx.createRadialGradient(G.p.x * T, (G.p.y - 0.5) * T, 4, G.p.x * T, (G.p.y - 0.5) * T, 210);
  g.addColorStop(0, 'rgba(255,240,210,0.2)'); g.addColorStop(1, 'rgba(255,240,210,0)'); ctx.fillStyle = g; ctx.fillRect(G.p.x * T - 210, (G.p.y - 0.5) * T - 210, 420, 420);
  ctx.globalCompositeOperation = 'source-over';
};
if (typeof iconeNPC === 'function') { const _iconeNPCCaca = iconeNPC; iconeNPC = function (n) { return /^guia_caca_/.test(n.id || '') ? '🎯' : _iconeNPCCaca(n); }; }
// plaquinha em cima da entrada (na cidade): nome da área e nível
const _desenhaPredioCaca = desenhaPredio;
desenhaPredio = function (ctx, b) {
  const r = _desenhaPredioCaca.apply(this, arguments);
  const c = b && CACA_POR_ID[b.interior]; const im = c && aSprite(b.spr);
  if (im) {
    const w = (b.w + 0.5) * T, h = w * im.height / im.width, x = (b.porta.x + 0.5) * T, y = (b.porta.y + 1) * T + T * 0.28; // embaixo da porta (em cima ela some atrás do nome do mapa quando a entrada fica no alto)
    const txt = `🎯 ${c.nome} · nv ${nivelCaca(c)}`; const s = T * 0.27;
    ctx.font = `700 ${s}px Fredoka, Nunito, sans-serif`; const tw = ctx.measureText(txt).width + s * 1.1, th = s * 1.55;
    ctx.fillStyle = 'rgba(90,40,10,0.88)'; ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = s * 0.12;
    ctx.beginPath(); ctx.roundRect(x - tw / 2, y - th / 2, tw, th, th / 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff4c8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + s * 0.05); ctx.textBaseline = 'alphabetic';
  }
  return r;
};
