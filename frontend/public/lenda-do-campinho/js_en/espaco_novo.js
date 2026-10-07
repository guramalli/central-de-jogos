/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🚀🌊 ESPAÇO E ATLÂNTIDA REPAGINADOS (v288) — com as regras das cidades novas (v272):
   - a Estação Espacial, a Lua, Marte, Saturno, a Nebulosa e Atlântida ganham desenho próprio, maior,
     dividido em BAIRROS (quadras) ligados por avenidas — ou por PONTES sobre o céu estrelado
     em Saturno e na Nebulosa, que são ilhas flutuando no espaço;
   - cada time de ETs tem o SEU bairro, com a entrada da área de caça no meio dele (lote certo);
   - praça central com a técnica, o quadro e o holograma da bola; o chefão num campo só dele;
   - prédios novos (6 por lugar) e enfeites espaciais (poste, horta, holograma, banco);
   - Atlântida: 4 bairros (um por "andar" de portais), cada um com 4 portais em volta de uma pracinha.
   Quem salvou dentro de um desses mapas volta para a chegada dele (uma vez).
   Carregar NO FIM (depois de cidades_novas.js, atlantida.js, espaco.js, vale.js e missoes_colecao.js).
   ============================================================ */
{
  /* ---------- artes novas ---------- */
  const AR = { b_lua1: 0.99, b_lua2: 1.375, b_lua3: 1.088, b_lua4: 1.147, b_lua5: 1.042, b_lua6: 1.24,
    b_marte1: 1.386, b_marte2: 1.867, b_marte3: 1.119, b_marte4: 0.956, b_marte5: 1.289, b_marte6: 1.07,
    b_saturno1: 1.664, b_saturno2: 1.108, b_saturno3: 1.342, b_saturno4: 1.221, b_saturno5: 1.453, b_saturno6: 1.091,
    b_nebula1: 1.466, b_nebula2: 1.334, b_nebula3: 1.244, b_nebula4: 1.231, b_nebula5: 1.332, b_nebula6: 1.26,
    b_estacao1: 1.353, b_estacao2: 1.327, b_estacao3: 1.098, b_estacao4: 1.164, b_estacao5: 1.078, b_estacao6: 1.044,
    b_atl1: 1.28, b_atl2: 1.292, b_atl3: 1.231, b_atl4: 1.215, b_atl5: 1.213, b_atl6: 1.087 };
  Object.assign(CN_AR, AR);
  for (const n of Object.keys(AR)) { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } if (!PORTAS[n]) PORTAS[n] = { x: 0.5, y: 0.93 }; }
  const OBJ_ESP = { poste_esp: 0.9, horta_esp: 2.0, holo_bola: 1.6, banco_esp: 1.8 };
  for (const [n, w] of Object.entries(OBJ_ESP)) { OBJ_INFO[n] = { w, b: 1 }; OBJ_BLOQUEIA.add(n); if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } }
  Object.assign(OBJ_MINI, { holo_bola: '#6ad8ff', horta_esp: '#5ab04a' });
}

/* ---------- ajudantes ---------- */
// "vazio": céu estrelado onde não se anda (janelas da estação, o espaço entre as ilhas)
function espVazio(b, x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { b.chao(i, j, CH.ESTRELAS); b.obj(i, j, 'x'); } }
function espAbre(b, x, y, w, h, t) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { b.chao(i, j, t); b.obj(i, j, null); } }

/* ============================================================
   PLANETAS: 90×66, nove quadras (3×3) separadas por faixas de 4 quadros.
   Lua e Marte: as faixas são avenidas de metal. Saturno e Nebulosa: as faixas são o céu estrelado,
   e só as PONTES de metal ligam uma ilha à outra.
   O que vai em cada quadra muda de planeta para planeta.
   ============================================================ */
const PL_W = 90, PL_H = 66;
const PL_COL = [[2, 24], [30, 30], [64, 24]], PL_LIN = [[2, 18], [24, 18], [46, 18]]; // [início, tamanho]
const PL_DESENHO = {
  //        NO        N          NE        O        C        L          SO        S          SE
  lua: ['pouso', 'bairro', 'et1', 'et2', 'praca', 'chefe', 'et3', 'bairro2', 'mirante'],
  marte: ['et1', 'bairro', 'mirante', 'et2', 'praca', 'bairro2', 'pouso', 'chefe', 'et3'],
  saturno: ['et2', 'mirante', 'pouso', 'bairro', 'praca', 'et1', 'chefe', 'et3', 'bairro2'],
  nebulosa: ['chefe', 'et3', 'bairro', 'et1', 'praca', 'mirante', 'bairro2', 'et2', 'pouso'],
};
const PL_ILHAS = { saturno: 1, nebulosa: 1 };
const PL_MIRANTE = {
  lua: ['🚩 FIRST LANDING MEMORIAL — this is where the first soccer ball touched the Moon\'s ground!', ['bandeira_bola', 'buggy_lunar', 'cratera', 'rochas_lua']],
  marte: ['📡 RESEARCH BASE — the engineers study how the ball bounces on the red sand of Mars.', ['radar', 'rover', 'geiser', 'console_esp']],
  saturno: ['💎 CRYSTAL GARDEN — the floating crystals shine with the light of the rings.', ['cristal_flutuante', 'cristais', 'meteorito', 'cristal_flutuante']],
  nebulosa: ['⭐ GROVE OF FALLEN STARS — every star that falls here turns into a glowing mushroom!', ['estrela_caida', 'cogumelo_cosmico', 'cristais', 'estrela_caida']],
};
function criaPlanetaNovo(p) {
  const b = new Construtor(p.id, p.nome, PL_W, PL_H, p.chao, 2400 + p.req);
  const m = b.m, ilhas = PL_ILHAS[p.id], M = CH.METAL;
  const K = kitCidade(b, { id: p.id, arte: p.id === 'nebulosa' ? 'nebula' : p.id, arvores: [p.props[0]], poste: 'poste_esp' });
  const sprs = Array.from({ length: 6 }, (_, k) => `b_${p.id === 'nebulosa' ? 'nebula' : p.id}${k + 1}`);
  const blocos = []; for (let l = 0; l < 3; l++) for (let c = 0; c < 3; c++) blocos.push({ x: PL_COL[c][0], w: PL_COL[c][1], y: PL_LIN[l][0], h: PL_LIN[l][1], c, l });
  /* --- beirada e faixas --- */
  const borda = [...p.props.filter(t => OBJ_INFO[t] && OBJ_INFO[t].b), 'x'];
  if (ilhas) {
    espVazio(b, 0, 0, PL_W, PL_H);
    for (const q of blocos) espAbre(b, q.x, q.y, q.w, q.h, p.chao);
    // pontes (3 de largura) entre as ilhas vizinhas
    for (const q of blocos) {
      if (q.c < 2) { const y = q.y + (q.h >> 1) - 1; espAbre(b, q.x + q.w, y, 4, 3, M); }
      if (q.l < 2) { const x = q.x + (q.w >> 1) - 1; espAbre(b, x, q.y + q.h, 3, 4, M); }
    }
  } else {
    for (let y = 0; y < PL_H; y++) for (let x = 0; x < PL_W; x++) if (x < 2 || y < 2 || x >= PL_W - 2 || y >= PL_H - 2) b.obj(x, y, (x + y) % 2 ? 'x' : borda[(x * 5 + y * 3) % borda.length]);
    for (const [x0, w] of PL_COL.slice(0, 2)) b.ret(x0 + w + 1, 2, 2, PL_H - 4, M);
    for (const [y0, h] of PL_LIN.slice(0, 2)) b.ret(2, y0 + h + 1, PL_W - 4, 2, M);
  }
  const ets = p.ets.map(e => e[0]);
  const NOMES_CACA = {}; for (const c of CACADAS) if (c.host === p.id) NOMES_CACA[c.m] = c;
  /* --- cada quadra --- */
  PL_DESENHO[p.id].forEach((tipo, k) => {
    const q = blocos[k], { x, y, w, h } = q, cx = x + (w >> 1);
    if (tipo === 'pouso') {
      b.ret(x + 2, y + 2, w - 4, h - 4, M);
      objLargo(b, cx - 3, y + 6, 'nave', 3); b.npc('piloto_' + p.id, cx + 1, y + 8);
      m.inicio = { x: cx - 1, y: y + 10 }; m.renasce = { x: cx, y: y + 10 };
      for (const [px, py] of [[x + 2, y + 2], [x + w - 3, y + 2], [x + 2, y + h - 3], [x + w - 3, y + h - 3]]) K.poe(px, py, 'poste_esp');
      K.poe(x + w - 5, y + 5, 'radar'); K.poe(x + 4, y + h - 5, 'console_esp');
      b.placa(cx + 3, y + 10, `${p.emoji} ${p.nomeCurto.toUpperCase()} — the aliens play soccer here! Each team has its own neighborhood. Beat them all and challenge ${p.chefe[1].toUpperCase()}.`);
      K.zona(x, y, w, h, 'Landing Strip');
    } else if (tipo === 'praca') {
      b.ret(x + 1, y + 6, w - 2, h - 7, M);
      K.fila(x + 1, x + w - 2, y + 5, { max: 4, sprs: [sprs[0], sprs[2], sprs[1], sprs[4]] });
      objLargo(b, cx, y + 11, 'holo_bola', 1);
      b.npc('lider_' + p.id, cx - 6, y + 10); b.npc('quadro', cx + 6, y + 10);
      for (const [px, py] of [[x + 1, y + 6], [x + w - 2, y + 6], [x + 1, y + h - 2], [x + w - 2, y + h - 2]]) K.poe(px, py, 'poste_esp');
      for (const px of [cx - 9, cx - 3, cx + 3, cx + 9]) K.poe(px, y + h - 2, 'banco_esp');
      K.poe(x + 3, y + 13, 'horta_esp'); K.poe(x + w - 4, y + 13, 'horta_esp');
      b.placa(cx - 1, y + 15, `⭐ COLONY SQUARE — ${NPCS['lider_' + p.id].nome} and the challenge board. The hologram shows the game ball!`);
    } else if (tipo === 'bairro' || tipo === 'bairro2') {
      const um = tipo === 'bairro' ? [sprs[2], sprs[3], sprs[5]] : [sprs[4], sprs[1], sprs[3]];
      const dois = tipo === 'bairro' ? [sprs[0], sprs[4], sprs[1]] : [sprs[5], sprs[0], sprs[2]];
      K.fila(x, x + w - 1, y + 6, { max: 4, sprs: um }); b.ret(x, y + 7, w, 2, M);
      K.fila(x, x + w - 1, y + 15, { max: 4, sprs: dois }); b.ret(x, y + 16, w, 2, M);
      for (let px = x + 2; px < x + w - 1; px += 7) K.poe(px, y + 10, px % 2 ? 'horta_esp' : 'poste_esp');
    } else if (tipo === 'chefe') {
      b.campo(x + 3, y + 3, w - 6, 11, CH.CAMPO);
      for (const [px, py] of [[x + 1, y + 1], [x + w - 2, y + 1], [x + 1, y + 15], [x + w - 2, y + 15]]) K.poe(px, py, 'holofote');
      for (let px = x + 4; px < x + w - 4; px++) K.poe(px, y + 1, 'arquibancada');
      const [cid] = p.chefe; b.spawn(cid, cx, y + 8, 1, 1);
      b.placa(x + 2, y + 16, `👑 ${MONSTROS[cid].nome.toUpperCase()}'S STADIUM (level ${nivelMonstro(MONSTROS[cid])}) — the boss of ${p.nomeCurto}!`);
      K.zona(x, y, w, h, 'Boss Stadium');
    } else if (tipo === 'mirante') {
      const [txt, props] = PL_MIRANTE[p.id];
      b.ret(cx - 4, y + 6, 9, 6, M);
      objLargo(b, cx, y + 8, props[0], 1);
      for (const [px, py] of [[cx - 3, y + 11], [cx + 3, y + 11]]) K.poe(px, py, 'banco_esp');
      b.espalha(props, 10, x + 1, y + 1, w - 2, h - 2, t => t === p.chao);
      b.placa(cx - 5, y + 13, txt);
    } else { // et1 / et2 / et3: o bairro de um time de ETs, com a entrada da área de caça no meio
      const i = +tipo[2] - 1, et = ets[i], c = NOMES_CACA[et];
      b.espalha(p.props, 12, x + 1, y + 1, w - 2, h - 2, t => t === p.chao);
      for (let j = y + 6; j <= y + 11; j++) for (let ii = cx - 4; ii <= cx + 4; ii++) b.obj(ii, j, null); // o largo da entrada fica livre
      b.ret(cx - 3, y + 8, 7, 4, M);
      if (c) K.caca(c.id, cx - 1, y + 7);
      K.caça(et, [[x + 5, y + 4], [x + w - 6, y + 4], [x + 5, y + h - 5], [x + w - 6, y + h - 5]], 3, 2);
      K.zona(x, y, w, h, c ? c.nome : MONSTROS[et].nome);
    }
  });
  b.m.espaco = { tinta: p.tinta }; if (p.gravidade) b.m.gravidade = p.gravidade;
  b.m.semCentrinho = true; b.m.huntsProprios = true;
  return b.m;
}
criaPlaneta = criaPlanetaNovo;
// as entradas das áreas de caça agora vão no lote do bairro de cada time (não no "pedestal" antigo)
for (const c of CACADAS) if (PLANETA_POR_ID[c.host] || c.host === 'atlantida') delete c.pos;

/* ============================================================
   ESTAÇÃO ESPACIAL: 80×56, janelas para as estrelas em volta.
   Noroeste: a doca do foguete (chegada da Terra). Nordeste: a Torre de Controle e a doca das naves.
   Centro: a Praça da Estação (loja, comandante, quadro). Sul: o Jardim Hidropônico, a grande janela
   e a entrada do Vale Celeste.
   ============================================================ */
const ESTN_W = 80, ESTN_H = 56, ESTN_TORRE = { x: 60, y: 13 };
criaEstacao = function () {
  const W = ESTN_W, H = ESTN_H, b = new Construtor('estacao', 'Galactic Space Station', W, H, CH.METAL, 2301), m = b.m;
  const K = kitCidade(b, { id: 'estacao', arte: 'estacao', arvores: ['horta_esp'], poste: 'poste_esp' });
  espVazio(b, 0, 0, W, 3); espVazio(b, 0, H - 3, W, 3); espVazio(b, 0, 0, 3, H); espVazio(b, W - 3, 0, 3, H);
  const P = CH.CONCRETO_ESC;
  /* --- corredores --- */
  b.ret(3, 24, W - 6, 3, P); b.ret(38, 3, 4, H - 6, P);
  b.ret(5, 5, 11, 9, P); b.ret(60, 4, 13, 8, P); // as plataformas de pouso
  /* --- DOCA DO FOGUETE (noroeste): chegada da Terra --- */
  objLargo(b, 9, 8, 'foguete', 1); b.npc('estela_estacao', 12, 9);
  for (const [x, y, t] of [[24, 5, 'caixotes_porto'], [26, 5, 'barris'], [33, 5, 'caixotes_porto'], [24, 12, 'horta_esp'], [32, 12, 'horta_esp'], [29, 8, 'console_esp']]) K.poe(x, y, t);
  m.inicio = { x: 10, y: 12 }; m.renasce = { x: 11, y: 12 };
  b.placa(14, 12, '🚀 SPACE STATION — aliens play soccer too, and they challenge humans! The Control Tower (northeast) takes you to the planets.');
  for (const [x, y] of [[4, 4], [18, 4], [4, 15], [18, 15]]) K.poe(x, y, 'poste_esp');
  K.fila(20, 36, 22, { max: 3, sprs: ['b_estacao3', 'b_estacao1', 'b_estacao4'] });
  K.fila(4, 18, 22, { max: 2, sprs: ['b_estacao5', 'b_estacao6'] });
  K.zona(3, 3, 35, 19, 'Rocket Dock');
  /* --- TORRE DE CONTROLE e doca das naves (nordeste) --- */
  objLargo(b, 66, 8, 'nave', 3); b.npc('torre_esp', ESTN_TORRE.x, ESTN_TORRE.y - 3);
  K.poe(57, 8, 'console_esp'); K.poe(55, 12, 'console_esp'); K.poe(73, 14, 'radar');
  for (const [x, y, t] of [[45, 7, 'caixotes_porto'], [47, 7, 'barris'], [45, 13, 'horta_esp'], [51, 13, 'horta_esp']]) K.poe(x, y, t);
  for (const [x, y] of [[43, 4], [75, 4], [43, 17], [75, 17]]) K.poe(x, y, 'poste_esp');
  K.fila(42, 56, 22, { max: 3, sprs: ['b_estacao2', 'b_estacao6', 'b_estacao3'] });
  K.fila(60, 76, 22, { max: 3, sprs: ['b_estacao4', 'b_estacao5', 'b_estacao1'] });
  b.placa(ESTN_TORRE.x + 2, ESTN_TORRE.y - 3, '🛰️ CONTROL TOWER — ships to the Moon, Mars, Saturn, the Nebula and the Intergalactic Cup.');
  K.zona(42, 3, 35, 19, 'Control Tower');
  /* --- PRAÇA DA ESTAÇÃO (centro-oeste) --- */
  b.ret(5, 29, 31, 12, CH.PISO);
  objLargo(b, 20, 34, 'holo_bola', 1);
  b.npc('loja_esp', 12, 33); b.npc('lider_esp', 28, 33); b.npc('quadro', 20, 38);
  for (const [x, y] of [[5, 29], [35, 29], [5, 40], [35, 40]]) K.poe(x, y, 'poste_esp');
  for (const x of [10, 16, 24, 30]) K.poe(x, 40, 'banco_esp');
  b.placa(6, 38, '⭐ STATION SQUARE — the Galactic Shop, Commander Nova and the challenge board.');
  /* --- o Vale Celeste (sudoeste) --- */
  b.ret(5, 44, 31, 9, P); for (const x of [10, 30]) K.poe(x, 47, 'horta_esp'); m.lotes.vale_celeste = { x: 19, y: 47 };
  for (const [x, y] of [[6, 45], [34, 45], [6, 51], [34, 51]]) K.poe(x, y, 'poste_esp');
  /* --- JARDIM HIDROPÔNICO e a GRANDE JANELA (sudeste) --- */
  espVazio(b, 50, 38, 20, 8);
  for (let x = 50; x < 70; x += 2) K.poe(x, 37, 'banco_esp');
  for (const [x, y] of [[44, 30], [50, 30], [56, 30], [62, 30], [68, 30], [74, 30], [44, 48], [74, 48]]) K.poe(x, y, 'horta_esp');
  K.fila(42, 58, 52, { max: 3, sprs: ['b_estacao5', 'b_estacao2', 'b_estacao6'] });
  K.fila(60, 76, 52, { max: 3, sprs: ['b_estacao1', 'b_estacao3', 'b_estacao4'] });
  b.placa(48, 35, '🌌 THE GREAT WINDOW — from here you can see Earth... and the stars where the aliens play ball!');
  K.zona(42, 28, 35, 25, 'Hydroponic Garden');
  m.espaco = { tinta: 'rgba(90,120,255,0.06)' }; m.semCentrinho = true; m.huntsProprios = true;
  return m;
};

/* ============================================================
   ATLÂNTIDA: 90×70. A doca do submarino no norte, a Praça de Netuno no centro e 4 BAIRROS,
   cada um com 4 portais (um "andar" de níveis) em volta de uma pracinha:
   Recife dos Corais (205–229), Ruínas do Templo (230–253), Jardim de Algas (254–275) e a Fossa Vulcânica (276–296).
   ============================================================ */
const ATL_BAIRROS = [
  { x: 3, y: 12, nome: 'Coral Reef', emoji: '🪸', props: ['coral_grande', 'concha_gigante', 'coral_grande'] },
  { x: 52, y: 12, nome: 'Temple Ruins', emoji: '🏛️', props: ['coluna_ruina', 'ancora_bau', 'coluna_ruina'] },
  { x: 3, y: 42, nome: 'Seaweed Garden', emoji: '🌿', props: ['alga_alta', 'alga_alta', 'concha_gigante'] },
  { x: 52, y: 42, nome: 'Volcanic Trench', emoji: '🌋', props: ['coluna_ruina', 'coral_grande', 'alga_alta'] },
];
criaAtlantida = function () {
  const W = 90, H = 70, b = new Construtor('atlantida', 'Atlantis — Sunken City', W, H, CH.AREIA_MAR, 1301), m = b.m, PM = CH.PEDRA_MAR;
  const K = kitCidade(b, { id: 'atlantida', arte: 'atl', arvores: ['alga_alta'], poste: 'coluna_ruina' });
  const bordas = ['alga_alta', 'coral_grande', 'coluna_ruina', 'alga_alta'];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) b.obj(x, y, (x + y) % 2 ? 'x' : bordas[(x * 7 + y * 3) % bordas.length]);
  /* --- ruas de pedra --- */
  b.ret(2, 38, W - 4, 3, PM); b.ret(43, 2, 4, H - 4, PM); b.ret(2, 9, W - 4, 2, PM);
  /* --- doca do submarino (norte) --- */
  b.ret(34, 2, 22, 7, PM); objLargo(b, 40, 5, 'submarino', 3); b.npc('capita_atl', 49, 5);
  m.inicio = { x: 45, y: 8 }; m.renasce = { x: 46, y: 8 };
  b.placa(51, 7, '🌊 ATLANTIS — down here in the deep, even the CRITTERS play ball! There are 4 neighborhoods, each with 4 PORTALS (levels 205 to 296). Start with the Coral Reef!');
  K.fila(3, 32, 8, { max: 5, sprs: ['b_atl3', 'b_atl1', 'b_atl5', 'b_atl2', 'b_atl6'] });
  K.fila(57, 87, 8, { max: 5, sprs: ['b_atl4', 'b_atl6', 'b_atl2', 'b_atl3', 'b_atl1'] });
  /* --- PRAÇA DE NETUNO (centro) --- */
  for (let j = -7; j <= 7; j++) for (let i = -9; i <= 9; i++) if ((i * i) / 81 + (j * j) / 49 <= 1) b.chao(45 + i, 39 + j, PM);
  objLargo(b, 45, 36, 'estatua_netuno', 3);
  b.npc('loja_atl', 39, 41); b.npc('lider_atl', 51, 41); b.npc('quadro', 45, 44);
  for (const [x, y] of [[37, 34], [53, 34], [37, 44], [53, 44]]) K.poe(x, y, 'bolhas');
  b.placa(40, 45, '🔱 NEPTUNE SQUARE — Seu Coral the merchant, Queen Marina, Professor Coral and the challenge board.');
  /* --- os 4 bairros, cada um com 4 portais --- */
  const portais = CACADAS.filter(c => c.host === 'atlantida' && DUNGEONS_ATL.some(d => d[1] === c.id));
  ATL_BAIRROS.forEach((z, k) => {
    const w = 35, h = 22, cx = z.x + (w >> 1);
    b.ret(z.x + 1, z.y + 10, w - 2, 3, PM); b.ret(cx - 1, z.y + 1, 3, h - 2, PM);         // a cruz de ruas do bairro
    for (let j = -3; j <= 3; j++) for (let i = -4; i <= 4; i++) if (i * i / 16 + j * j / 9 <= 1) b.chao(cx + i, z.y + 11 + j, PM); // a pracinha
    objLargo(b, cx, z.y + 11, z.props[0], 1);
    const lotes = [[z.x + 4, z.y + 4], [z.x + w - 11, z.y + 4], [z.x + 4, z.y + 15], [z.x + w - 11, z.y + 15]];
    portais.slice(k * 4, k * 4 + 4).forEach((c, i) => { const [lx, ly] = lotes[i]; b.ret(lx - 1, ly - 1, 6, 4, PM); K.caca(c.id, lx, ly); });
    b.espalha(z.props.concat(['alga_alta']), 14, z.x + 1, z.y + 1, w - 2, h - 2, t => t === CH.AREIA_MAR);
    b.placa(cx + 2, z.y + 13, `${z.emoji} ${z.nome.toUpperCase()} — ${k === 0 ? 'the first neighborhood: start here!' : 'deeper down, tougher teams.'}`);
    K.zona(z.x, z.y, w, h, z.nome);
  });
  /* --- prédios do sul --- */
  K.fila(3, 42, 66, { max: 6, sprs: ['b_atl2', 'b_atl4', 'b_atl1', 'b_atl6', 'b_atl3', 'b_atl5'] });
  K.fila(48, 87, 66, { max: 6, sprs: ['b_atl5', 'b_atl3', 'b_atl6', 'b_atl1', 'b_atl4', 'b_atl2'] });
  b.espalha(['bolhas'], 16, 3, 3, W - 6, H - 6, t => t === CH.AREIA_MAR);
  m.submarino = true; m.semCentrinho = true; m.huntsProprios = true;
  return m;
};

/* ---------- chegadas que estavam com a posição do desenho antigo ---------- */
{
  const _trocaEspNovo = trocaMapa;
  trocaMapa = function (id, x, y) {
    try {
      if (id === 'atlantida' && x === 10.5 && y === 9.5) { const p = getMapa('atlantida').inicio; x = p.x + 0.5; y = p.y + 0.5; }
      else if (id === 'estacao' && x === 9.5 && y === 10.5) { const p = getMapa('estacao').inicio; x = p.x + 0.5; y = p.y + 0.5; }
      else if (id === 'estacao' && x === 44.5 && y === 11.5) { x = ESTN_TORRE.x + 0.5; y = ESTN_TORRE.y + 0.5; }
    } catch (e) { }
    return _trocaEspNovo.call(this, id, x, y, ...[].slice.call(arguments, 3));
  };
  // quem salvou dentro de um mapa que mudou de desenho volta para a chegada dele (uma vez)
  const NOVOS = ['estacao', 'atlantida', ...PLANETAS.map(p => p.id)], VERSAO = 288;
  const _iniEspNovo = iniciarJogo;
  iniciarJogo = async function (save, ...resto) {
    try {
      if (save) {
        save.mapasNovos = save.mapasNovos || {};
        if (NOVOS.includes(save.mapa) && save.mapasNovos[save.mapa] !== VERSAO) { const p = getMapa(save.mapa).renasce || getMapa(save.mapa).inicio; if (p) { save.x = p.x + 0.5; save.y = p.y + 0.5; } }
        for (const id of NOVOS) save.mapasNovos[id] = VERSAO;
      }
    } catch (e) { console.warn('mapas novos: posição', e); }
    return _iniEspNovo.call(this, save, ...resto);
  };
}
