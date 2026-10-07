/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🦖 VALE JURÁSSICO (v364, pedido do dono: "um mapa gigantesco, caprichado, como um labirinto, com várias salas,
   e em cada sala uma espécie de dinossauro... e no final um boss diferente, com mecânica diferente: um tiranossauro
   gigantesco e faminto que quer destruir o futebol" — e "conseguir um pet caçando, com número exorbitante de abates").
   - O portal selado dos dinossauros, no Estádio do Multiverso, abre no nível 562 → Acampamento da Dra. Fóssil.
   - LABIRINTO (150×110): grade de 6×5 blocos; 10 blocos são SALAS (formato orgânico, tema próprio, UMA espécie cada),
     os outros são corredores tortuosos com becos sem saída. A dificuldade cresce com a distância da entrada; a sala
     mais difícil (Espino do Lago) fica colada ao Portão do Rei Rex.
   - REI REX (nível 700, arena própria): RUGIDO (aviso → quem não estiver escondido atrás de uma pedra fica tonto e
     perde fôlego; a pedra que segurou o rugido racha e, no 3º, quebra), PISÃO (círculos vermelhos no chão: saia de
     dentro) e FOME (na metade da vida: mais rápido, mais forte e chama a matilha de raptores).
   - Mascote TRICERINHO: o Ovo de Tricerinho cai de qualquer dinossauro do vale (1 em 5.000) e, para ninguém ficar
     sem, sai GARANTIDO depois de 8.000 dinossauros. O Vovô Ptero choca o ovo (24 h de verdade).
   Carregar DEPOIS de multiverso.js, armazem.js, loot_regioes.js, adornos2.js e saga_origem.js (espera em horas).
   ============================================================ */
{
  /* ---------- chãos ---------- */
  Object.assign(CH, { JUR_COPA: 70, JUR_PAREDE: 71, JUR_CHAO: 72, JUR_CINZA: 73 });
  Object.assign(ESTILO_CHAO, {
    [CH.JUR_COPA]: { cor: '#2a6a22', borda: '#173f12', r: 0, e: 0, tex: 'liso', o: 21.6, tinta: 'rgba(0,22,4,0.5)' }, // mais escura que o chão: o labirinto tem que se ler
    [CH.JUR_PAREDE]: { cor: '#2e5a24', borda: '#173a12', r: 0, e: 0, tex: 'liso', o: 19.6, tinta: 'rgba(12,18,0,0.42)' },
    [CH.JUR_CHAO]: { cor: '#3f8a2e', borda: '#2a6a1e', r: 0.3, e: 0.06, tex: 'liso', o: 0.6, tinta: 'rgba(255,245,170,0.16)' },
    [CH.JUR_CINZA]: { cor: '#3a3438', borda: '#221e22', r: 0.3, e: 0.06, tex: 'liso', o: 5.74, tinta: 'rgba(255,190,150,0.13)' },
  });
  Object.assign(TEX_CHAO, { [CH.JUR_COPA]: 't_jur_copa', [CH.JUR_PAREDE]: 't_jur_parede', [CH.JUR_CHAO]: 't_jur_chao', [CH.JUR_CINZA]: 't_jur_cinza' });
  Object.assign(CH_MINI, { 70: '#1f4f19', 71: '#2b5422', 72: '#4a8f35', 73: '#4a4448' });
  if (typeof chaoSuaviza === 'function') { const _cs = chaoSuaviza; chaoSuaviza = t => (t === CH.JUR_COPA || t === CH.JUR_PAREDE) ? false : _cs(t); }

  /* ---------- enfeites ---------- */
  const PROPS = { samambaia_gig: 1.5, palmeira_jur: 1.7, osso_gigante: 1.5, ninho_ovos: 1.1, rocha_vulc: 1.3, flor_gigante: 1.2, tronco_musgo: 1.6, cranio_dino: 1.6,
    pegada_fossil: 1.3, arbusto_cipo: 1.4, geiser: 1.2, bambu_jur: 1.1, pedra_musgo: 1.75, barraca_expedicao: 2.1, caixotes_expedicao: 1.2, fogueira_jur: 1.1 };
  for (const [k, w] of Object.entries(PROPS)) { OBJ_INFO[k] = { w, b: 1 }; OBJ_BLOQUEIA.add(k); }
  ['palmeira_jur', 'rocha_vulc', 'pedra_musgo', 'cranio_dino', 'bambu_jur', 'barraca_expedicao', 'tronco_musgo'].forEach(k => OBJ_VISAO.add(k));
  Object.assign(OBJ_MINI, { samambaia_gig: '#2f7a2a', palmeira_jur: '#3a6a22', rocha_vulc: '#3a2a2a', pedra_musgo: '#6a7a5a', flor_gigante: '#e04a3a', geiser: '#9ad8ff', barraca_expedicao: '#d8c08a', fogueira_jur: '#ff8a2a' });
  OBJ_INFO.mv_portal_jur = { w: 2.3, b: 1 }; OBJ_INFO.jur_portao_rex = { w: 3.4, b: 1 };
  const ART = ['t_jur_copa', 't_jur_parede', 't_jur_chao', 't_jur_cinza', 'mv_portal_jur', 'jur_portao_rex', ...Object.keys(PROPS)];

  /* ---------- as espécies ---------- */
  // [id, nome, nível, arquétipo, altura, voa, item, nome do item, descrição, falas, sala, chão da sala]
  const JUR = [
    ['jur_compy', 'Speedy Compy', 566, 'rapido', 0.75, false, 'peninha_verde', 'Little Green Feather', 'Compies are always losing feathers from running so much.', ['Pee-pee-pee!', 'Catch me!'], 'Fern Room', 'samambaias'],
    ['jur_raptor', 'Dribbling Raptor', 578, 'rapido', 1.05, false, 'garra_raptor', 'Raptor Claw', 'A little curved claw. Raptors dribble with it!', ['Krrr... dribble!', 'My ball!'], 'Raptor Clearing', 'clareira'],
    ['jur_paqui', 'Header Pachy', 590, 'zagueiro', 1.1, false, 'lasca_cabeca_dura', 'Hardhead Chip', 'A tiny piece of the Pachy\'s natural helmet. Super hard!', ['BONK!', 'Header!'], 'Pachy Rocks', 'rochedo'],
    ['jur_dilo', 'Spitting Dilo', 602, 'meia', 1.15, false, 'leque_dilofo', 'Dilo Frill', 'The colorful neck frill of the Dilo. It opens up when it\'s about to shoot!', ['Fsssh!', 'Long shot!'], 'Dilo Swamp', 'pantano'],
    ['jur_ptera', 'Left-Wing Ptera', 614, 'rapido', 1.2, true, 'pena_ptera', 'Ptera Feather', 'Light as the cliff wind.', ['Kraaa!', 'Cross!'], 'Nest Cliff', 'penhasco'],
    ['jur_trike', 'Center-Back Trike', 628, 'zagueiro', 1.55, false, 'chifre_trike', 'Trike Horn', 'A horn that fell off (and a new one is already growing!).', ['MOOO-RRR!', 'Nobody gets past me!'], 'Flower Field', 'flores'],
    ['jur_anqui', 'Kickabout Ankylo', 642, 'zagueiro', 1.35, false, 'placa_anquilo', 'Ankylo Plate', 'A plate from the Ankylo\'s armor, covered in spikes.', ['Plonk!', 'Tail whip!'], 'Ankylo Gravel', 'cascalho'],
    ['jur_estego', 'Goalkeeper Stego', 656, 'zagueiro', 1.65, false, 'placa_estego', 'Stego Back Plate', 'Orange and warm. The Stego uses it as a shield in goal.', ['Saved it!', 'Dino gloves!'], 'Stego Falls', 'cachoeira'],
    ['jur_paraso', 'Trombone Parasaur', 670, 'meia', 1.6, false, 'crista_musical', 'Musical Crest', 'Blow into it and out comes a trombone sound. That\'s how Parasaurs call the crowd!', ['Toot-toot!', 'Music on the field!'], 'Palm Grove', 'palmeiras'],
    ['jur_espino', 'Lake Spino', 684, 'zagueiro', 2.1, false, 'vela_espino', 'Spino Sail Piece', 'A piece of the Spino\'s red sail. It glows near lava.', ['GRRROAR!', 'The lake is mine!'], 'Volcanic Lake', 'vulcao'],
  ];
  window.JUR_ESPECIES = JUR;
  const JUR_ID = new Set([...JUR.map(x => x[0]), 'jur_rex']);
  for (const [id, , L, , , , item, nomeItem, desc] of JUR) ITENS[item] = { nome: nomeItem, tipo: 'loot', venda: Math.round(L * 16), desc };
  Object.assign(ITENS, {
    dente_rex: { nome: 'King Rex\'s Tooth', tipo: 'loot', venda: 4000000, raro: true, desc: 'A huge tooth (not pointy, thank goodness!) from King Rex. A trophy for whoever beat the tyrant of the valley.' },
    coroa_ossos_rex: { nome: 'King Rex\'s Bone Crown', tipo: 'loot', venda: 25000000, raro: true, colecionavel: true, desc: '⭐ King Rex\'s crown. Almost nobody has seen one up close.' },
    ovo_tricerinho: { nome: 'Tricy Egg', tipo: 'chave', venda: 0, desc: '🥚 A triceratops egg! Take it to Grandpa Ptero, at the Jurassic Valley Camp, to hatch it.' },
  });
  for (const id of [...JUR.map(x => 'i_' + x[6]), 'i_dente_rex', 'i_coroa_ossos_rex']) ART.push(id);
  if (typeof ICON_ALIAS !== 'undefined') ICON_ALIAS.ovo_tricerinho = 'ninho_ovos';
  if (typeof CHAVE_DE_USO !== 'undefined') CHAVE_DE_USO.add('ovo_tricerinho');
  // loot da região (mesmo sistema do loot_regioes.js)
  if (typeof LOOT_REG !== 'undefined') {
    LOOT_REG.jur_labirinto = ['Jurassic Valley', ['Fossil Fern Leaf', 'Amber Drop', 'Ammonite Fossil', 'Golden Fossil Egg']];
    LOOT_REG.jur_labirinto[1].forEach((nome, t) => {
      const id = `lr_jur_labirinto_${t + 1}`;
      ITENS[id] = { nome, tipo: 'loot', venda: 1, peso: LOOT_TIER[t][3], raro: t >= 2, colecionavel: t === 3, regiao: 'jur_labirinto', desc: LOOT_TIER_TXT[t]('Jurassic Valley'), icon: { k: 'pacote', c: ['#a8743a', '#3a9a5a', '#3a6ad0', '#e0b020'][t] } };
      ART.push('i_' + id);
    });
  }
  ART.push(...JUR.flatMap(x => [x[0], ...[1, 2, 3, 4].map(k => `${x[0]}_c${k}`)]), 'jur_rex', ...[1, 2, 3, 4].map(k => `jur_rex_c${k}`));
  for (const n of ART) if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); }
  Object.assign(CORRE_ESC, { jur_compy: 1.0, jur_raptor: 1.0, jur_paqui: 1.0, jur_dilo: 1.017, jur_ptera: 1.235, jur_paraso: 1.009, jur_trike: 1.006, jur_anqui: 1.001, jur_estego: 1.009, jur_espino: 1.0, jur_rex: 1.0 }); // v364b: quadros refeitos com cara de adversário (dono: "carinhas felizes")
  CORRE_VOA.add('jur_ptera');

  for (const [id, nome, L, arq, alt, voa, item, , , falas] of JUR) {
    const m = mvCriaBicho(id, nome, L, arq, alt, voa, falas);
    const pecas = Object.keys(mvFaixaDe(545).pecas);
    m.loot = [[item, 0.3, 1, 2], ['elixir_multiverso', 0.06, 1, 1], ['foco_multiverso', 0.04, 1, 1], ['fio_ouro', 0.03, 1, 1], [pecas[(L >> 1) % pecas.length], 0.0006, 1, 1]];
  }
  const rex = mvCriaBicho('jur_rex', 'King Rex, the Ball Devourer', 700, 'chefe', 3.2, false, ['GRRROOOAAARRR!', 'Soccer? I eat balls for breakfast!', 'Humans, out of my valley!', 'No ball escapes the King!']);
  // como os chefões do Multiverso, um pouco mais pesado (é o último do vale) — e o golpe tem teto (como na Torre)
  rex.hp = Math.round(rex.hp * 6.5); rex.xp = Math.round(rex.xp * 3); rex.atk = Math.round(rex.atk * 2.6); if (rex.ranged) rex.ranged.dano = Math.round(rex.ranged.dano * 2.3);
  rex.respawn = 900000; rex.ouro = rex.ouro.map(v => v * 4); rex.tetoGolpe = 0.3;
  rex.loot = [['dente_rex', 1, 1, 1], ['coroa_ossos_rex', 0.06, 1, 1], ['bau_torre', 1, 1, 2], ['elixir_multiverso', 1, 2, 4], ['ovo_tricerinho', 0.03, 1, 1],
    ...Object.keys(mvFaixaDe(545).pecas).map(p => [p, 0.03, 1, 1])];
  const REX_BASE = { vel: rex.vel, atk: rex.atk, atkCd: rex.atkCd };
  { // retratos (lista de batalha, wiki)
    const _db = desenhaBicho;
    desenhaBicho = function (x, tipo, px, py, s, a) {
      if (!JUR_ID.has(tipo)) return _db.apply(this, arguments);
      const im = aSprite(tipo); if (!im) return;
      const h = Math.min(ALTURA_BICHO[tipo] || 1, 1.6) * T * s, w = h * im.width / im.height;
      x.save(); x.translate(px, py); if (a && a.flip === false) x.scale(-1, 1); x.drawImage(im, -w / 2, -h, w, h); x.restore();
    };
  }

  /* ---------- NPCs ---------- */
  Object.assign(NPCS, {
    dra_fossil: { nome: 'Dr. Fossil, the paleontologist', look: { tipo: 'humano', corpo: 'f', alt: 1.72, pele: 'pele-morena', cabelo: 'cabelo-rabo', corCabelo: 'castanho', roupa: 'roupa-camiseta', corRoupa: '#c8a868', baixo: 'baixo-shorts', chapeu: 'chapeu-bone' },
      ola: 'A whole valley of dinosaurs playing soccer! I\'ve been studying them for years... but King Rex hates soccer and wants to kick the humans out of here. Will you help me?' },
    chocador_jur: { nome: 'Grandpa Ptero, the egg hatcher', look: { tipo: 'humano', corpo: 'm', alt: 1.7, folha: 'anciao', pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-camiseta', corRoupa: '#6a8a4a', baixo: 'baixo-jeans' },
      ola: 'Eggs, eggs, eggs! The valley dinosaurs sometimes leave an egg along the way. It\'s super rare! If you find one, bring it to me and I\'ll hatch it with lots of love.' },
    loja_jur: { nome: 'Merchant Amber', loja: ['elixir_multiverso', 'foco_multiverso', 'banquete_anao', 'soro_estelar', 'cristal_foco'], look: { tipo: 'humano', corpo: 'm', alt: 1.78, pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-camiseta', corRoupa: '#d88a2a', baixo: 'baixo-jeans' },
      ola: 'Potions, focus crystals and a feast to handle the dinosaurs! And I\'ll buy everything you bring back from the maze.' },
  });
  if (typeof PAPEL !== 'undefined') Object.assign(PAPEL, { dra_fossil: 'adulta', chocador_jur: 'adulto', loja_jur: 'adulto' });

  /* ---------- ajudantes de mapa ---------- */
  const r2 = (rng, a, b) => a + rng() * (b - a);
  function fechaSelva(m, piso) { // o que não é chão vira selva fechada (copa por cima, parede de folhas e cipós na frente)
    const W = m.w, H = m.h;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      if (piso[j * W + i]) continue;
      const frente = j + 1 < H && piso[(j + 1) * W + i];
      m.chao[j * W + i] = frente ? CH.JUR_PAREDE : CH.JUR_COPA; m.obj[j * W + i] = { t: 'x', v: 0 };
    }
  }
  function protegidos(m) { // nada na frente de saídas, NPCs, placas, prédios e do começo
    const W = m.w, P = new Uint8Array(W * m.h), marca = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < W && y < m.h) P[y * W + x] = 1; };
    for (const s of m.saidas) marca(s.x - 2, s.y - 2, s.x + 2, s.y + 3);
    for (const p of m.predios) marca(p.porta.x - 1, p.porta.y, p.porta.x + 1, p.porta.y + 3);
    for (const n of m.npcs) marca(n.x - 2, n.y - 2, n.x + 2, n.y + 3);
    for (const p of m.placas) marca(p.x - 1, p.y - 1, p.x + 1, p.y + 1);
    if (m.inicio) marca(m.inicio.x - 2, m.inicio.y - 2, m.inicio.x + 2, m.inicio.y + 2);
    return P;
  }
  // confere que dá para andar do começo até tudo (saídas, NPCs, spawns); se um enfeite fechou passagem, ele sai
  function garanteCaminho(m) {
    const W = m.w, H = m.h, N = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const chaoOk = i => CH_ANDA(m.chao[i]), anda = i => chaoOk(i) && (!m.obj[i] || !OBJ_BLOQUEIA_OU_X(m.obj[i]));
    for (let tent = 0; tent < 40; tent++) {
      const vis = new Uint8Array(W * H), q = [m.inicio.y * W + m.inicio.x]; vis[q[0]] = 1;
      while (q.length) { const i = q.pop(), x = i % W, y = (i / W) | 0; for (const [dx, dy] of N) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const k = ny * W + nx; if (!vis[k] && (anda(k) || m.saidas.some(s => s.x === nx && s.y === ny))) { vis[k] = 1; q.push(k); } } }
      const alvos = [...m.saidas.map(s => [s.x, s.y]), ...m.npcs.map(n => [n.x, n.y + 1]), ...m.spawns.map(s => [s.x, s.y])];
      const falta = alvos.filter(([x, y]) => !vis[y * W + x]);
      if (!falta.length) return 0;
      if (tent === 0) (window.JUR_FALTA = window.JUR_FALTA || []).push(m.id + ': ' + falta.slice(0, 5).map(f => f.join(',')).join(' | '));
      // só sai o enfeite que é "rolha": encosta na parte alcançada E num chão que ficou isolado
      let tirou = 0;
      for (let i = 0; i < W * H; i++) {
        const o = m.obj[i]; if (!o || o.t === 'x' || o.predio || !PROPS[o.t]) continue;
        const x = i % W, y = (i / W) | 0, vz = N.map(([dx, dy]) => (y + dy) * W + x + dx);
        if (vz.some(k => vis[k]) && vz.some(k => !vis[k] && chaoOk(k) && (!m.obj[k] || PROPS[m.obj[k].t]))) { m.obj[i] = null; tirou++; }
      }
      if (!tirou) return 1;
    }
    return 1;
  }
  const OBJ_BLOQUEIA_OU_X = o => o.t === 'x' || OBJ_BLOQUEIA.has(o.t) || o.predio;

  /* ---------- Acampamento da Dra. Fóssil ---------- */
  const ACAMP = { chegada: { x: 22, y: 29 }, saidaLab: { x: 22, y: 2 } };
  function criaAcampamento() {
    const W = 44, H = 36, b = new Construtor('jur_acampamento', '🦖 Jurassic Valley — Camp', W, H, CH.JUR_COPA, 5601), m = b.m, piso = new Uint8Array(W * H);
    const cava = (x, y, ch) => { if (x > 0 && y > 0 && x < W - 1 && y < H - 1) { piso[y * W + x] = 1; m.chao[y * W + x] = ch; } };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (((x - 22) / 19) ** 2 + ((y - 18) / 14) ** 2 <= 1) cava(x, y, CH.JUR_CHAO);
    for (let y = 1; y <= 6; y++) for (let x = 20; x <= 24; x++) cava(x, y, CH.TERRA); // a trilha para o labirinto
    for (let y = 6; y <= 30; y++) for (let x = 21; x <= 23; x++) cava(x, y, CH.TERRA);
    for (let x = 9; x <= 35; x++) for (let y = 17; y <= 18; y++) cava(x, y, CH.TERRA);
    fechaSelva(m, piso);
    const pp = mvPortal(b, 'mv_portal_jur', 20, 26, 'multiverso', 0, 0); // volta para o hub (destino ligado depois): a porta fica embaixo, com chão na frente
    b.saida(22, 1, 'jur_labirinto', 0, 0); // a entrada do labirinto (destino ligado depois)
    m.inicio = { x: 22, y: 29 }; m.renasce = { x: 22, y: 29 };
    b.npc('dra_fossil', 25, 15); b.npc('chocador_jur', 14, 20); b.npc('loja_jur', 30, 20);
    b.placa(18, 29, '🦖 JURASSIC VALLEY — dinosaurs play soccer here! Talk to Dr. Fossil (in the middle of the camp). The maze is to the north.');
    b.placa(20, 4, '⚠️ JURASSIC MAZE — 10 rooms, one species in each. The deeper you go, the stronger they get. At the end, King Rex\'s Gate.');
    for (const [x, y] of [[11, 13], [32, 13], [10, 23], [33, 24]]) b.obj(x, y, 'barraca_expedicao');
    b.obj(18, 14, 'fogueira_jur'); b.obj(28, 24, 'caixotes_expedicao'); b.obj(16, 24, 'caixotes_expedicao'); b.obj(29, 13, 'osso_gigante'); b.obj(13, 27, 'cranio_dino');
    if (typeof poeBauArmazem === 'function') poeBauArmazem(m);
    const P = protegidos(m), rng = mulberry(5611);
    for (let k = 0; k < 60; k++) { const x = 3 + ((rng() * (W - 6)) | 0), y = 3 + ((rng() * (H - 6)) | 0); if (!piso[y * W + x] || m.obj[y * W + x] || P[y * W + x] || m.chao[y * W + x] !== CH.JUR_CHAO) continue; b.obj(x, y, ['samambaia_gig', 'palmeira_jur', 'flor_gigante', 'arbusto_cipo', 'samambaia_gig'][(rng() * 5) | 0]); }
    garanteCaminho(m);
    ACAMP.portal = pp;
    return m;
  }
  MAPAS_DEF.jur_acampamento = criaAcampamento;

  /* ---------- o Labirinto ---------- */
  // v392 (dono: "precisa de muito mais criaturas e o caminho entre as salas está muito grande... precisa ser mais curto"):
  // labirinto mais compacto (5×4 blocos em vez de 6×5: menos corredores vazios), mais atalhos, becos curtos e o DOBRO de dinossauros
  const LAB = { W: 120, H: 90, COLS: 5, ROWS: 4 };
  const TEMA_SALA = {
    samambaias: { chao: CH.JUR_CHAO, props: ['samambaia_gig', 'samambaia_gig', 'flor_gigante', 'arbusto_cipo'] },
    clareira: { chao: CH.TERRA, props: ['tronco_musgo', 'osso_gigante', 'arbusto_cipo', 'samambaia_gig'] },
    rochedo: { chao: CH.PEDRA, props: ['pedra_musgo', 'pegada_fossil', 'pedra_musgo', 'cranio_dino'] },
    pantano: { chao: CH.LODO, agua: 0.1, props: ['bambu_jur', 'arbusto_cipo', 'tronco_musgo'] },
    penhasco: { chao: CH.PEDRA, props: ['ninho_ovos', 'ninho_ovos', 'pedra_musgo', 'cranio_dino'] },
    flores: { chao: CH.GRAMA_FLOR, props: ['flor_gigante', 'flor_gigante', 'palmeira_jur', 'samambaia_gig'] },
    cascalho: { chao: CH.ARENITO, props: ['pedra_musgo', 'osso_gigante', 'pegada_fossil'] },
    cachoeira: { chao: CH.JUR_CHAO, lago: 1, props: ['geiser', 'pedra_musgo', 'samambaia_gig', 'bambu_jur'] },
    palmeiras: { chao: CH.GRAMA, props: ['palmeira_jur', 'palmeira_jur', 'bambu_jur', 'flor_gigante'] },
    vulcao: { chao: CH.JUR_CINZA, lava: 1, props: ['rocha_vulc', 'rocha_vulc', 'geiser', 'cranio_dino'] },
  };
  function criaLabirinto() {
    const { W, H, COLS, ROWS } = LAB, CWd = W / COLS, CHt = H / ROWS;
    const b = new Construtor('jur_labirinto', '🦖 Jurassic Maze', W, H, CH.JUR_COPA, 5701), m = b.m, piso = new Uint8Array(W * H), rng = mulberry(5711);
    const cava = (x, y, ch) => { x = Math.round(x); y = Math.round(y); if (x > 1 && y > 1 && x < W - 2 && y < H - 2) { piso[y * W + x] = 1; if (ch != null) m.chao[y * W + x] = ch; } };
    const pincel = (x, y, r, ch) => { for (let j = Math.floor(y - r); j <= y + r; j++) for (let i = Math.floor(x - r); i <= x + r; i++) if ((i - x) ** 2 + (j - y) ** 2 <= r * r + 0.3) { const k = j * W + i; if (k >= 0 && k < W * H && piso[k] && ch == null) continue; cava(i, j, ch == null ? CH.TERRA : ch); } }; // corredor = trilha de terra (se destaca da selva)
    const id = (r, c) => r * COLS + c, rc = k => [Math.floor(k / COLS), k % COLS];
    const E = id(ROWS - 1, 2), B = id(0, 3), R10 = id(1, 3);
    const centro = k => { const [r, c] = rc(k); return { x: Math.round(c * CWd + CWd / 2 + r2(rng, -3, 3)), y: Math.round(r * CHt + CHt / 2 + r2(rng, -2, 2)) }; };
    const C = []; for (let k = 0; k < COLS * ROWS; k++) C[k] = centro(k);
    C[B] = { x: Math.round(3 * CWd + CWd / 2), y: Math.round(CHt / 2) + 1 }; C[R10] = { x: Math.round(3 * CWd + CWd / 2), y: Math.round(CHt + CHt / 2) + 1 };
    const viz = k => { const [r, c] = rc(k), v = []; if (r > 0) v.push(id(r - 1, c)); if (r < ROWS - 1) v.push(id(r + 1, c)); if (c > 0) v.push(id(r, c - 1)); if (c < COLS - 1) v.push(id(r, c + 1)); return v; };
    // árvore aleatória (sem o bloco do portão e a sala final), depois uns atalhos
    const lig = new Map(), liga = (a, z) => { (lig.get(a) || lig.set(a, new Set()).get(a)).add(z); (lig.get(z) || lig.set(z, new Set()).get(z)).add(a); };
    const fora = new Set([B, R10]), vis = new Set([E]), pilha = [E];
    while (pilha.length) { const k = pilha[pilha.length - 1], op = viz(k).filter(v => !vis.has(v) && !fora.has(v)); if (!op.length) { pilha.pop(); continue; } const v = op[(rng() * op.length) | 0]; liga(k, v); vis.add(v); pilha.push(v); }
    for (let n = 0, t = 0; n < 9 && t < 300; t++) { const k = (rng() * COLS * ROWS) | 0; if (fora.has(k)) continue; const op = viz(k).filter(v => !fora.has(v) && !(lig.get(k) || new Set()).has(v)); if (!op.length) continue; liga(k, op[(rng() * op.length) | 0]); n++; }
    const dist = (de, sem) => { const d = new Map([[de, 0]]), q = [de]; while (q.length) { const k = q.shift(); for (const v of lig.get(k) || []) if (!d.has(v) && !(sem && sem.has(v))) { d.set(v, d.get(k) + 1); q.push(v); } } return d; };
    let D = dist(E); const vz10 = viz(R10).filter(v => v !== B && D.has(v)); const ant10 = vz10.sort((a, z) => D.get(z) - D.get(a))[0]; liga(R10, ant10); liga(R10, B);
    D = dist(E);
    // as 10 salas: a final + 9 sorteadas (longe da entrada), em ordem de distância
    const cand = [...Array(COLS * ROWS).keys()].filter(k => k !== E && k !== B && k !== R10 && !viz(E).includes(k));
    for (let i = cand.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; [cand[i], cand[j]] = [cand[j], cand[i]]; }
    const salas9 = cand.slice(0, 9).sort((a, z) => D.get(a) - D.get(z) || a - z), SALAS = [...salas9, R10];
    // corredores (largura ~3, tortos) entre os centros ligados
    const feito = new Set();
    for (const [a, set] of lig) for (const z of set) {
      const ch = a < z ? a + '-' + z : z + '-' + a; if (feito.has(ch)) continue; feito.add(ch);
      const A = C[a], Z = C[z], mx = (A.x + Z.x) / 2 + (A.y === Z.y ? 0 : r2(rng, -6, 6)), my = (A.y + Z.y) / 2 + (A.x === Z.x ? 0 : r2(rng, -5, 5));
      for (const [P0, P1] of [[A, { x: mx, y: my }], [{ x: mx, y: my }, Z]]) { const n = Math.ceil(Math.hypot(P1.x - P0.x, P1.y - P0.y) * 2); for (let i = 0; i <= n; i++) { const t = i / n, ond = Math.sin(t * Math.PI * 2 + a) * 1.2; pincel(P0.x + (P1.x - P0.x) * t + (P0.y !== P1.y ? ond : 0), P0.y + (P1.y - P0.y) * t + (P0.x !== P1.x ? ond : 0), 1.25); } }
    }
    // becos sem saída nos blocos de corredor (cada um termina num enfeite: ninho, crânio, osso...)
    const becos = [];
    for (let k = 0; k < COLS * ROWS; k++) {
      if (SALAS.includes(k) || k === B || k === E) continue;
      pincel(C[k].x, C[k].y, 2.2, CH.JUR_CHAO); // clareirinha no cruzamento
      for (let n = 0; n < 1; n++) { let x = C[k].x, y = C[k].y; const ang = rng() * Math.PI * 2, L = 3 + rng() * 4; for (let s = 0; s < L; s++) { x += Math.cos(ang) + r2(rng, -0.4, 0.4); y += Math.sin(ang) * 0.8 + r2(rng, -0.4, 0.4); pincel(x, y, 1.1); } becos.push({ x: Math.round(x), y: Math.round(y) }); }
    }
    // as salas (formato orgânico)
    const salasInfo = [];
    SALAS.forEach((k, i) => {
      const esp = JUR[i], tema = TEMA_SALA[esp[11]], { x: cx, y: cy } = C[k], rx = 9.4 + rng() * 1.0, ry = 7.2 + rng() * 0.9, fase = rng() * 6;
      for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
        const a = Math.atan2(y - cy, x - cx), ruido = 1 + 0.16 * Math.sin(a * 3 + fase) + 0.08 * Math.sin(a * 5 + fase * 2);
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= ruido) cava(x, y, tema.chao);
      }
      salasInfo.push({ k, i, cx, cy, rx, ry, tema, esp });
    });
    // entrada (embaixo) e o portão do Rei Rex (em cima)
    const e = C[E]; pincel(e.x, e.y, 2.5); for (let y = e.y; y <= H - 3; y++) pincel(e.x, y, 1.2, CH.TERRA);
    const bc = C[B]; for (let y = bc.y - 2; y <= bc.y + 3; y++) for (let x = bc.x - 4; x <= bc.x + 4; x++) cava(x, y, CH.JUR_CINZA);
    for (let y = bc.y; y <= C[R10].y; y++) pincel(bc.x, y, 1.3, CH.JUR_CINZA);
    fechaSelva(m, piso);
    // detalhes das salas: água, lava, lago
    for (const s of salasInfo) {
      const { cx, cy, tema } = s, W2 = W;
      if (tema.lago) for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 3; x <= cx + 3; x++) if (((x - cx) / 3.2) ** 2 + ((y - cy) / 2.2) ** 2 <= 1 && piso[y * W2 + x]) m.chao[y * W2 + x] = CH.AGUA;
      if (tema.lava) for (const [ox, oy] of [[-4, -2], [4, 2], [-3, 3]]) for (let y = cy + oy - 1; y <= cy + oy + 1; y++) for (let x = cx + ox - 1; x <= cx + ox + 1; x++) if (piso[y * W2 + x] && Math.abs(x - cx - ox) + Math.abs(y - cy - oy) <= 2) { m.chao[y * W2 + x] = CH.MV_LAVA; m.obj[y * W2 + x] = { t: 'x', v: 0 }; }
      if (tema.agua) for (let n = 0; n < 4; n++) { const x = Math.round(cx + r2(rng, -s.rx + 2, s.rx - 2)), y = Math.round(cy + r2(rng, -s.ry + 2, s.ry - 2)); for (const [dx, dy] of [[0, 0], [1, 0], [0, 1]]) if (piso[(y + dy) * W2 + x + dx]) m.chao[(y + dy) * W2 + x + dx] = CH.AGUA; }
    }
    // saídas, portão, começo
    b.saida(e.x, H - 3, 'jur_acampamento', ACAMP.saidaLab.x, ACAMP.saidaLab.y + 2);
    m.inicio = { x: e.x, y: H - 6 }; m.renasce = { x: e.x, y: H - 6 };
    const pg = b.predio('jur_portao_rex', bc.x - 2, bc.y - 2, 5, 3); const porta = pg.porta;
    m.saidas.push({ x: porta.x, y: porta.y, para: 'jur_trex', tx: 20, ty: 31, req: { flag: 'jur_portao', msg: '🔒 King Rex\'s Gate only opens for those who have reached level 690.' } });
    b.placa(e.x + 1, H - 9, '🦖 JURASSIC MAZE — keep going and choose your path wisely: there are dead ends. The deepest rooms have the strongest dinosaurs.');
    b.placa(bc.x + 3, bc.y + 2, '👑 KING REX\'S GATE — the tyrant of the valley, who hates soccer, lives here. Hide behind the rocks when he roars!');
    // spawns (só a espécie da sala) e plaquinha com o nome da sala
    for (const s of salasInfo) {
      const [idE, nomeE, L] = s.esp, grande = (ALTURA_BICHO[idE] || 1) >= 1.5;
      const sy = s.tema.lago || s.tema.lava ? Math.round(s.cy + s.ry * 0.55) : s.cy; // lago/lava no meio: nascem mais embaixo
      b.spawn(idE, s.cx, sy, grande ? 11 : 15, 7);
      // plaquinha com o nome da sala: no chão livre mais perto de embaixo-à-esquerda do centro (com chão na frente para ler)
      let melhor = null;
      for (let y = Math.round(s.cy); y <= s.cy + s.ry; y++) for (let x = Math.round(s.cx - s.rx); x <= s.cx; x++) { const k = y * W + x; if (piso[k] && !m.obj[k] && piso[k + W] && !m.obj[k + W] && m.chao[k] !== CH.AGUA && m.chao[k + W] !== CH.AGUA && Math.hypot(x - s.cx, y - sy) > 3) { const sc = (s.cy + s.ry - y) + (x - (s.cx - s.rx)) * 0.5; if (!melhor || sc < melhor[2]) melhor = [x, y, sc]; } }
      if (melhor) b.placa(melhor[0], melhor[1], `🦖 ${s.esp[10].toUpperCase()} — ${nomeE} (level ${L})`);
    }
    // v392: uns dinossauros também nos cruzamentos do caminho (da espécie da sala mais perto), para o caminho não ficar vazio
    for (let k = 0; k < COLS * ROWS; k++) {
      if (SALAS.includes(k) || k === B || k === E || !(lig.get(k) || new Set()).size) continue;
      const perto = salasInfo.reduce((a, s) => !a || Math.hypot(s.cx - C[k].x, s.cy - C[k].y) < Math.hypot(a.cx - C[k].x, a.cy - C[k].y) ? s : a, null);
      if (perto) b.spawn(perto.esp[0], C[k].x, C[k].y, 3, 2);
    }
    // enfeites: nas salas (pelo tema) e no fim dos becos
    const P = protegidos(m);
    const centroLivre = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => piso[(y + dy) * W + x + dx] && !m.obj[(y + dy) * W + x + dx]);
    for (const s of salasInfo) {
      let n = 0, t = 0;
      while (n < 13 && t++ < 260) {
        const x = Math.round(s.cx + r2(rng, -s.rx, s.rx)), y = Math.round(s.cy + r2(rng, -s.ry, s.ry)), k = y * W + x;
        if (!piso[k] || m.obj[k] || P[k] || m.chao[k] === CH.AGUA || Math.hypot(x - s.cx, y - s.cy) < 2.5 || !centroLivre(x, y)) continue;
        b.obj(x, y, s.tema.props[(rng() * s.tema.props.length) | 0]); n++;
      }
    }
    for (const p of becos) { const k = p.y * W + p.x; if (piso[k] && !m.obj[k] && !P[k]) b.obj(p.x, p.y, ['ninho_ovos', 'cranio_dino', 'osso_gigante', 'pegada_fossil'][(rng() * 4) | 0]); }
    // corredores: samambaias encostadas na parede (só onde sobra largura)
    for (let k = 0, t = 0; k < 140 && t < 4000; t++) {
      const x = 3 + ((rng() * (W - 6)) | 0), y = 3 + ((rng() * (H - 6)) | 0), i = y * W + x;
      if (!piso[i] || m.obj[i] || P[i] || (m.chao[i] !== CH.JUR_CHAO && m.chao[i] !== CH.TERRA)) continue;
      const paredes = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !piso[(y + dy) * W + x + dx]).length;
      const largos = [[2, 0], [-2, 0], [0, 2], [0, -2]].filter(([dx, dy]) => piso[(y + dy) * W + x + dx]).length;
      if (paredes !== 1 || largos < 2) continue;
      b.obj(x, y, rng() < 0.6 ? 'samambaia_gig' : 'arbusto_cipo'); k++;
    }
    garanteCaminho(m);
    LAB.salas = salasInfo.map(s => ({ esp: s.esp[0], x: s.cx, y: s.cy })); LAB.portao = porta; LAB.entrada = { x: e.x, y: H - 3 };
    return m;
  }
  MAPAS_DEF.jur_labirinto = criaLabirinto;

  /* ---------- a arena do Rei Rex ---------- */
  const ARENA = { pedras: [[13, 12], [27, 12], [11, 19], [29, 19], [16, 24], [24, 24], [20, 8]] };
  function criaArenaRex() {
    const W = 40, H = 36, b = new Construtor('jur_trex', '👑 King Rex\'s Arena', W, H, CH.JUR_COPA, 5801), m = b.m, piso = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - 20, (y - 17) * 1.12); if (d <= 15.5) { piso[y * W + x] = 1; m.chao[y * W + x] = d >= 14 && (x + y) % 3 === 0 ? CH.ROCHA_LAVA : CH.JUR_CINZA; } }
    for (let y = 30; y <= 34; y++) for (let x = 19; x <= 21; x++) { piso[y * W + x] = 1; m.chao[y * W + x] = CH.JUR_CINZA; }
    fechaSelva(m, piso);
    b.saida(20, 34, 'jur_labirinto', 0, 0); // volta para a frente do portão (ligado depois)
    m.inicio = { x: 20, y: 31 }; m.renasce = { x: 20, y: 31 };
    for (const [x, y] of ARENA.pedras) b.obj(x, y, 'pedra_musgo');
    for (const [x, y] of [[8, 14], [32, 14], [9, 24], [31, 24], [20, 4]]) b.obj(x, y, 'rocha_vulc');
    b.obj(6, 18, 'geiser'); b.obj(34, 18, 'geiser'); b.obj(15, 5, 'cranio_dino'); b.obj(25, 5, 'osso_gigante');
    b.spawn('jur_rex', 20, 14, 1, 1);
    b.placa(21, 30, '👑 KING REX\'S ARENA — when he ROARS, hide behind a rock! The red circles on the ground are the STOMP: get out of them. When he\'s hungry, he calls the raptors.');
    m.espaco = { tinta: 'rgba(120,30,10,0.06)' };
    return m;
  }
  MAPAS_DEF.jur_trex = criaArenaRex;

  /* ---------- ligações: o portal selado do Multiverso vira o Portal Jurássico ---------- */
  {
    const _hub = MAPAS_DEF.multiverso;
    MAPAS_DEF.multiverso = function () {
      const m = _hub.apply(this, arguments);
      const p = m.predios.find(q => q.spr === 'mv_portal_selado' && q.x === 44 && q.y === 9);
      if (p) {
        p.spr = 'mv_portal_jur';
        m.saidas.push({ x: p.porta.x, y: p.porta.y, para: 'jur_acampamento', tx: ACAMP.chegada.x, ty: ACAMP.chegada.y, req: { flag: 'jur_lib', msg: '🔒 The Jurassic Portal only opens from level 562.' } });
        const pl = m.placas.find(q => /dinossauros jogam bola/.test(q.texto)); if (pl) pl.texto = '🦖 JURASSIC PORTAL — the Jurassic Valley, where dinosaurs play soccer (levels 566 to 700). Watch out for King Rex!';
        ACAMP.hub = { x: p.porta.x, y: p.porta.y + 1 };
      }
      return m;
    };
    const _get = getMapa;
    getMapa = function (id) {
      const m = _get.apply(this, arguments);
      if (id === 'jur_acampamento' && !m._jurLig) { try { getMapa('multiverso'); } catch (e) { } const s = m.saidas.find(q => q.para === 'multiverso'); if (s && ACAMP.hub) { s.tx = ACAMP.hub.x; s.ty = ACAMP.hub.y; } m._jurLig = true; }
      if (id === 'jur_acampamento' && !m._jurLab) { const s = m.saidas.find(q => q.para === 'jur_labirinto'); if (s) { try { getMapa('jur_labirinto'); } catch (e) { } if (LAB.entrada) { s.tx = LAB.entrada.x; s.ty = LAB.entrada.y - 2; } } m._jurLab = true; }
      if (id === 'jur_trex' && !m._jurLig) { try { getMapa('jur_labirinto'); } catch (e) { } const s = m.saidas.find(q => q.para === 'jur_labirinto'); if (s && LAB.portao) { s.tx = LAB.portao.x; s.ty = LAB.portao.y + 1; } m._jurLig = true; }
      return m;
    };
  }
  function liberaJur() { const s = G.save; if (!s || !s.flags) return; if (s.nivel >= 562 && !s.flags.jur_lib) { s.flags.jur_lib = true; if (G.rodando && s.flags.campeao_galaxia) log('🦖 The JURASSIC PORTAL has opened in the Multiverse Stadium! Dinosaurs playing soccer... and a hungry King Rex.', 'l-lvl'); } if (s.nivel >= 690) s.flags.jur_portao = true; }
  setInterval(() => { try { liberaJur(); } catch (e) { } }, 3000);
  { const _ini = iniciarJogo; iniciarJogo = async function () { const r = await _ini.apply(this, arguments); try { liberaJur(); } catch (e) { } return r; }; }

  /* ---------- missões: a Dra. Fóssil (uma espécie por vez) e o Vovô Ptero (o ovo) ---------- */
  const xpNivel = L => Math.max(1, xpPara(L + 1) - xpPara(L));
  const FALAS_DRA = [
    'Compies are small, but they\'re super fast! Get past 120 of them in the Fern Room and I\'ll write it all down.',
    'Raptors dribble in packs. Show them you dribble better: 120 Raptors in the Clearing!',
    'Pachys solve everything with a header. Watch your forehead! 120 Pachys at the Rocks.',
    'Dilos shoot from far away, out in the Swamp. Get close and get past 120 of them.',
    'Pteras cross the ball while flying, at Nest Cliff. 120 Pteras, and don\'t step on the eggs!',
    'Trikes are the defenders of the valley. Three horns, zero goals allowed... so far. 120 Trikes in the Flower Field.',
    'Ankylos hit the ball with their tails! 120 Ankylos in the Gravel.',
    'Stegos wear goalkeeper gloves (for real!). 120 Stegos at the Falls.',
    'Parasaurs play the trombone to call the crowd. 120 of them in the Palm Grove.',
    'The Lake Spino is the strongest of them all, out at the Volcanic Lake, right next to King Rex\'s gate. 120 Spinos!',
  ];
  let ant = null;
  JUR.forEach(([idE, nomeE, L], i) => {
    const q = { id: 'jur_k' + (i + 1), npc: 'dra_fossil', titulo: `🦖 Research: ${nomeE}`, lvl: L - 4, texto: FALAS_DRA[i], req: { kill: idE, n: 120 },
      rec: { xp: Math.round(xpNivel(L) * 1.5), ouro: L * 3000, itens: [['elixir_multiverso', 3]] }, fim: i < 9 ? 'Got it! What an amazing creature. On to the next room?' : 'You know the whole valley! Now there\'s only him left... King Rex.' };
    if (ant) q.pre = ant; MISSOES.push(q); ant = q.id;
  });
  MISSOES.push({ id: 'jur_rei', npc: 'dra_fossil', titulo: '👑 King Rex', lvl: 695, pre: ant, texto: 'King Rex hates soccer: he wants to swallow every ball in the valley and kick the humans out of here. Nobody has ever beaten him. When he ROARS, hide behind a rock; when red circles appear on the ground, get out of them. Beat King Rex!',
    req: { kill: 'jur_rex', n: 1 }, rec: { xp: Math.round(xpNivel(700) * 3), ouro: 700 * 40000, itens: [['bau_torre', 2]], flag: 'venceu_jur_rex' }, fim: 'YOU BEAT KING REX! The whole valley is celebrating... and the dinosaurs want to play soccer with you!' });
  MISSOES.push(
    { id: 'jur_ovo1', npc: 'chocador_jur', titulo: '🥚 An egg on the way', lvl: 566, texto: 'The valley dinosaurs sometimes leave a Tricy egg along the way... it\'s super rare! But don\'t give up: after lots and lots of dinosaurs, an egg ALWAYS shows up. Bring it to me.', req: { item: 'ovo_tricerinho', n: 1, desc: 'Find a Tricy Egg (dropped by the valley dinosaurs)' }, rec: { xp: Math.round(xpNivel(566) * 0.5), ouro: 566 * 2000 }, fim: 'What a beautiful egg! I\'ll put it in the incubator right now.' },
    { id: 'jur_ovo2', npc: 'chocador_jur', titulo: '🥚 The incubator', lvl: 566, pre: 'jur_ovo1', texto: 'Dinosaur eggs take a while to hatch: 24 hours, nice and warm. Go play and I\'ll take care of it!', req: { espera: 24, desc: 'Wait 24 h (real time)' }, rec: { xp: Math.round(xpNivel(566) * 0.5), ouro: 0, flag: 'pet_tricerinho' }, fim: 'AWESOME! The egg hatched... it\'s a TRICY! It already loves you. Take it with you (Equipment → ✨ Cosmetics → pet).' },
  );
  // o ovo: 1 em 5.000 de qualquer dinossauro do vale, garantido depois de 8.000
  {
    const _matar = matar;
    matar = function (m) {
      const r = _matar.apply(this, arguments);
      try {
        const s = G.save;
        if (s && m && m.tipo && JUR_ID.has(m.tipo) && m.tipo !== 'jur_rex' && !s.flags.pet_tricerinho && !contaItem('ovo_tricerinho') && !(s.quests.jur_ovo1 && s.quests.jur_ovo1.s === 'feita')) {
          s.jurAbates = (s.jurAbates || 0) + 1;
          if (Math.random() < 1 / 5000 || s.jurAbates >= 8000) {
            recebeItem('ovo_tricerinho', 1); s.jurAbates = 0;
            banner('🥚 A TRICY EGG!', 'Take it to Grandpa Ptero, at the Jurassic Valley Camp.'); log('🥚 You found a TRICY EGG! Take it to Grandpa Ptero, at the Camp, to hatch it.', 'l-lvl'); som('nivel');
          }
        }
        if (m && m.tipo === 'jur_rex' && s) { s.flags.venceu_jur_rex = true; banner('👑 You beat King Rex!', 'Soccer is saved in the Jurassic Valley!'); }
      } catch (e) { }
      return r;
    };
    // o Vovô Ptero mostra quanto falta para o ovo garantido
    const _ab = abrirNPC;
    abrirNPC = function (npc) {
      const r = _ab.apply(this, arguments);
      try {
        if (npc && npc.id === 'chocador_jur' && G.save && !G.save.flags.pet_tricerinho && !contaItem('ovo_tricerinho')) {
          const f = document.querySelector('#modalConteudo .fala'); const n = G.save.jurAbates || 0;
          if (f) f.append(el('p', { class: 'dica' }, `🦖 Dinosaurs you've gotten past since the last egg: ${fmt(n)}. After 8,000, an egg is sure to show up (before that, every dinosaur has a tiny chance).`));
        }
      } catch (e) { }
      return r;
    };
  }

  /* ---------- as mecânicas do Rei Rex ---------- */
  const JR = { ativo: false };
  function jrReset() {
    if (JR.rachadas) for (const [x, y] of JR.rachadas) { const m = getMapa('jur_trex'); if (!m.obj[y * m.w + x]) m.obj[y * m.w + x] = { t: 'pedra_musgo', v: 1 }; }
    Object.assign(MONSTROS.jur_rex, REX_BASE); Object.assign(JR, { ativo: false, rachadas: [], hits: {}, pisos: null, aviso: 0 });
  }
  function pedraNoCaminho(a, b) {
    const m = G.mapa, n = Math.ceil(dist(a, b) / 0.25);
    for (let i = 1; i < n; i++) { const t = i / n, x = Math.floor(a.x + (b.x - a.x) * t), y = Math.floor(a.y + (b.y - a.y) * t), o = m.obj[y * m.w + x]; if (o && OBJ_VISAO.has(o.t)) return [x, y, o]; }
    return null;
  }
  function jrPasso(dt) {
    const M = G.mapa; if (!M || M.id !== 'jur_trex') { if (JR.ativo) jrReset(); return; }
    const rx = G.mons.find(m => m.tipo === 'jur_rex' && m.hp > 0);
    if (!rx || !rx.bravo || !G.save || G.save.hp <= 0) { if (JR.ativo && !rx) jrReset(); return; }
    if (!JR.ativo) Object.assign(JR, { ativo: true, t: 0, rugido: 8000, pisao: 5000, matilha: 15000, aviso: 0, pisos: null, furia: false, hits: {}, rachadas: JR.rachadas || [] });
    JR.t += dt; const st = stats(), p = G.p;
    // FOME: na metade da vida
    if (!JR.furia && rx.hp < rx.d.hp * 0.5) {
      JR.furia = true; rx.d.vel = REX_BASE.vel * 1.35; rx.d.atk = Math.round(REX_BASE.atk * 1.25); rx.d.atkCd = Math.round(REX_BASE.atkCd * 0.8);
      banner('🦖 KING REX IS STARVING!', 'Faster, stronger... and calling the raptor pack!'); fala(rx, 'I\'M SO HUUUUNGRY!'); som('chefe_aviso'); if (typeof tremeTela === 'function') tremeTela(8, 500);
    }
    // RUGIDO: aviso, depois quem não estiver escondido atrás de uma pedra fica tonto
    if (JR.t >= JR.rugido && !JR.aviso) {
      JR.aviso = JR.t + 1700; texto(rx, '⚠️ HE\'S GONNA ROAR! HIDE!', '#ff4a3a', 1700, -0.8); efeito('area', rx.x, rx.y, '#ff3a3a', 4); som('chefe_aviso');
      if (!G.save.flags.dica_rugido) { G.save.flags.dica_rugido = true; banner('🪨 Hide behind a rock!', 'Keep a rock between you and King Rex when he roars.'); }
    }
    if (JR.aviso && JR.t >= JR.aviso) {
      JR.aviso = 0; JR.rugido = JR.t + (JR.furia ? 11000 : 14000);
      fala(rx, 'GRRROOOOAAARRR!'); som('chefe_furia'); efeito('area', rx.x, rx.y, '#ffb03a', 9); if (typeof tremeTela === 'function') tremeTela(10, 700);
      const pedra = pedraNoCaminho(rx, p);
      if (!pedra) { recebeDano(Math.round(st.maxHp * 0.22), rx); p.tontoAte = G.agora + 2500; texto(p, 'DIZZY FROM THE ROAR!', '#ffcf3a', 1300, -0.6); }
      else {
        const [x, y] = pedra, k = x + ',' + y; JR.hits[k] = (JR.hits[k] || 0) + 1; texto({ x: x + 0.5, y: y + 0.5 }, JR.hits[k] >= 3 ? 'THE ROCK BROKE!' : 'The rock cracked!', '#d8d0c0', 1200, -0.5);
        if (JR.hits[k] >= 3) { M.obj[y * M.w + x] = null; efeito('puff', x + 0.5, y + 0.5); efeito('impacto', x + 0.5, y + 0.5, '#d8d0c0'); JR.rachadas.push([x, y]); }
      }
    }
    // PISÃO: três círculos no chão (um embaixo de você); 1,3 s depois, quem estiver dentro leva
    if (!JR.pisos && JR.t >= JR.pisao) {
      const pts = [{ x: p.x, y: p.y }]; for (let k = 0; k < 2; k++) pts.push({ x: p.x + (Math.random() * 6 - 3), y: p.y + (Math.random() * 5 - 2.5) });
      JR.pisos = { ate: JR.t + 1300, pts, prox: 0 }; fala(rx, 'STOMP!');
    }
    if (JR.pisos) {
      if (JR.t >= JR.pisos.prox) { JR.pisos.prox = JR.t + 420; for (const q of JR.pisos.pts) efeito('area', q.x, q.y, '#ff2a2a', 1.6); }
      if (JR.t >= JR.pisos.ate) {
        for (const q of JR.pisos.pts) { efeito('impacto', q.x, q.y, '#ff7a3a'); if (Math.hypot(p.x - q.x, p.y - q.y) <= 1.6) { recebeDano(Math.round(st.maxHp * 0.18), rx); break; } }
        if (typeof tremeTela === 'function') tremeTela(6, 300);
        JR.pisos = null; JR.pisao = JR.t + (JR.furia ? 7000 : 9000);
      }
    }
    // MATILHA: com fome, chama 2 raptores (no máximo 6 bichos na arena)
    if (JR.furia && JR.t >= JR.matilha) {
      JR.matilha = JR.t + 18000;
      if (G.mons.length < 6) for (let k = 0; k < 2; k++) { const ang = Math.random() * Math.PI * 2, x = Math.round(20 + Math.cos(ang) * 12), y = Math.round(17 + Math.sin(ang) * 10); if (!podeAndar(x + 0.5, y + 0.5)) continue; const nm = criaMonstro({ m: 'jur_raptor', x, y, raio: 1 }); if (nm) { nm.bravo = true; nm.respawn = 999999999; G.mons.push(nm); efeito('area', nm.x, nm.y, '#ffb03a', 1.2); } }
      fala(rx, 'PACK! GET THE BALL!');
    }
  }
  window.JR_REX = JR;
  { const _at = atualiza; atualiza = function (dt) { const r = _at.apply(this, arguments); try { jrPasso(dt || 16); } catch (e) { } return r; }; }
  // os raptores chamados pelo Rex não voltam (cada luta é uma luta)
  { const _mt = matar; matar = function (m) { const r = _mt.apply(this, arguments); try { if (G.mapa && G.mapa.id === 'jur_trex' && m && m.tipo === 'jur_raptor') G.respawns = G.respawns.filter(x => x.sp !== m.sp); } catch (e) { } return r; }; }
}
