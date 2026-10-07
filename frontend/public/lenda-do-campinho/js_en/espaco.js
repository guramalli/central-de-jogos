/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ÁREA INTERESTELAR (v143): níveis 300 a 400
   Os extraterrestres também jogam futebol — e querem desafiar os humanos!
   - Foguete da Dra. Estela, na praia do Rio (nível 298+) → Estação Espacial.
   - Da Estação, a Torre de Controle leva a 4 planetas: Lua (305–328),
     Marte (330–353), Saturno (355–378) e Nebulosa (380–397). Cada planeta:
     cidade com ETs jogadores, 3 áreas de caça (cacadas.js) e um chefão ET.
   - Final: a Copa Intergaláctica contra o Supremo da Galáxia (nível 400).
   - ETs = arte única (a/et_<id>.webp, olhando para a esquerda), igual aos
     bichos de Atlântida (look.spr / look.voa).
   Modelo: atlantida.js. Carregar DEPOIS de atlantida.js.
   ============================================================ */

/* ---------- chãos do espaço ---------- */
CH.REGOLITO = 40; CH.MARTE = 41; CH.ANEL = 42; CH.NEBULOSA = 43; CH.METAL = 44; CH.ESTRELAS = 45;
Object.assign(ESTILO_CHAO, {
  [CH.REGOLITO]: { cor: '#868896', borda: '#62646e', r: 0.4, e: 0.1, tex: 'pedra', o: 3.2 },
  [CH.MARTE]: { cor: '#d0663a', borda: '#9a4424', r: 0.45, e: 0.12, tex: 'areia', o: 3.3 },
  [CH.ANEL]: { cor: '#8a74c0', borda: '#62508e', r: 0.4, e: 0.1, tex: 'areia', o: 3.4 },
  [CH.NEBULOSA]: { cor: '#c07ab8', borda: '#8a5086', r: 0.4, e: 0.1, tex: 'areia', o: 3.5 },
  [CH.METAL]: { cor: '#9aa4b8', borda: '#6a7488', r: 0, e: 0, tex: 'calcada', o: 5.6 },
  [CH.ESTRELAS]: { cor: '#0a0a1e', borda: '#05050f', r: 0.2, e: 0.05, tex: 'liso', o: 22 },
});
Object.assign(TEX_CHAO, { [CH.REGOLITO]: 't_poeira_lua', [CH.MARTE]: 't_marte', [CH.ANEL]: 't_solo_anel', [CH.NEBULOSA]: 't_solo_nebula', [CH.METAL]: 't_metal_esp', [CH.ESTRELAS]: 't_estrelas' });
Object.assign(CH_MINI, { 40: '#b4b6c0', 41: '#d0663a', 42: '#a890d8', 43: '#d8a0dc', 44: '#9aa4b8', 45: '#0a0a1e' });

/* ---------- objetos ---------- */
Object.assign(OBJ_INFO, {
  foguete: { w: 1.8, b: 1 }, nave: { w: 2.4, b: 1 }, console_esp: { w: 1.4, b: 1 }, radar: { w: 1.5, b: 1 },
  cratera: { w: 1.6, b: 0 }, rochas_lua: { w: 1.4, b: 1 }, buggy_lunar: { w: 1.8, b: 1 }, bandeira_bola: { w: 0.9, b: 1 },
  rochas_marte: { w: 1.4, b: 1 }, cacto_alien: { w: 1.1, b: 1 }, geiser: { w: 1.0, b: 0 }, rover: { w: 1.7, b: 1 },
  cristal_flutuante: { w: 1.3, b: 1 }, meteorito: { w: 1.1, b: 1 }, cogumelo_cosmico: { w: 1.5, b: 1 }, estrela_caida: { w: 1.2, b: 1 },
});
Object.keys(OBJ_INFO).forEach(k => { if (OBJ_INFO[k].b) OBJ_BLOQUEIA.add(k); });
Object.assign(OBJ_MINI, { foguete: '#f4f4f8', nave: '#f4f4f8', rochas_lua: '#8a8c96', rochas_marte: '#9a4424', cristal_flutuante: '#9a6ae0', cogumelo_cosmico: '#e070c0' });
['foguete', 'nave', 'radar'].forEach(t => OBJ_VISAO.add(t));

/* ---------- temas das áreas de caça espaciais ---------- */
Object.assign(TEMAS_CACA, {
  lunar: { aberto: 1, chao: CH.REGOLITO, trilha: CH.METAL, borda: ['rochas_lua', 'rochas_lua', 'buggy_lunar'], props: ['cratera', 'rochas_lua', 'bandeira_bola', 'cratera'], tinta: 'rgba(120,140,255,0.10)' },
  marciano: { aberto: 1, chao: CH.MARTE, trilha: CH.METAL, borda: ['rochas_marte', 'cacto_alien', 'rochas_marte'], props: ['geiser', 'rover', 'cacto_alien', 'rochas_marte'], tinta: 'rgba(255,120,60,0.10)' },
  anel: { aberto: 1, chao: CH.ANEL, trilha: CH.METAL, borda: ['cristal_flutuante', 'meteorito', 'cristal_flutuante'], props: ['meteorito', 'cristal_flutuante', 'cristais'], tinta: 'rgba(170,120,255,0.12)' },
  nebular: { aberto: 1, chao: CH.NEBULOSA, trilha: CH.METAL, borda: ['cogumelo_cosmico', 'estrela_caida', 'cogumelo_cosmico'], props: ['estrela_caida', 'cogumelo_cosmico', 'cristais'], tinta: 'rgba(255,120,220,0.12)' },
});

/* ---------- os planetas ---------- */
// ets: [id, nome, nível, arquétipo, altura, voa, item, nome do item, descrição do item, falas]
const PLANETAS = [
  { id: 'lua', nome: 'Moon — Sea of Tranquility', nomeCurto: 'Moon', emoji: '🌕', req: 298, chao: CH.REGOLITO, tema: 'lunar', predios: ['b_lua1', 'b_lua2'], props: ['cratera', 'rochas_lua', 'buggy_lunar', 'bandeira_bola'], ent: 'ent_cratera', tinta: 'rgba(120,140,255,0.10)', gravidade: 1.12,
    ets: [['et_coelho', 'Moon Bunny', 305, 'rapido', 1.0, false, 'antena_alien', 'Alien Antenna', 'It still picks up the game signal from Earth\'s TV.', ['Boing boing!', 'Jump higher!']],
      ['et_rocha', 'Moon Boulder', 312, 'zagueiro', 1.25, false, 'amostra_lunar', 'Moon Rock Sample', 'A little piece of the Moon in a tiny jar.', ['Rrrrock!', 'You shall not pass!']],
      ['et_selenita', 'Selenite Goalie', 320, 'meia', 1.35, false, 'luvas_selenitas', 'Selenite Gloves', 'They glow when they save a shot.', ['Saved it!', 'The ball is mine!']]],
    chefe: ['ch_capitao_lunar', 'Moon Captain', 328, 2.2], lider: { nome: 'Commander Luna', pele: 'pele-clara', cor: '#c0c8e0' } },
  { id: 'marte', nome: 'Mars — Red Valley', nomeCurto: 'Mars', emoji: '🔴', req: 325, chao: CH.MARTE, tema: 'marciano', predios: ['b_marte1', 'b_marte2'], props: ['rochas_marte', 'cacto_alien', 'geiser', 'rover'], ent: 'ent_escotilha', tinta: 'rgba(255,120,60,0.10)',
    ets: [['et_marciano', 'Little Martian Striker', 332, 'rapido', 0.95, false, 'cristal_marciano', 'Martian Crystal', 'Green and warm. The Martians use it as a lucky charm.', ['Beep boop goal!', 'Earthling!']],
      ['et_robo', 'Mining Robot', 340, 'zagueiro', 1.3, false, 'engrenagem', 'Robot Gear', 'It still spins by itself every now and then.', ['BEEP. BLOCKED.', 'Zzzt!']],
      ['et_rover', 'Spider Rover', 348, 'meia', 1.0, false, 'roda_rover', 'Rover Wheel', 'It rolled for miles across the red sand.', ['Beep beep!', 'Radar on!']]],
    chefe: ['ch_general_marciano', 'Martian General', 353, 2.3], lider: { nome: 'Engineer Rubi', pele: 'pele-morena', cor: '#d0663a' } },
  { id: 'saturno', nome: 'Saturn — Crystal Rings', nomeCurto: 'Saturn', emoji: '🪐', req: 350, chao: CH.ANEL, tema: 'anel', predios: ['b_saturno1', 'b_saturno2'], props: ['cristal_flutuante', 'meteorito', 'cristais'], ent: 'ent_cristal_esp', tinta: 'rgba(170,120,255,0.12)',
    ets: [['et_anel', 'Little Floating Ring', 357, 'meia', 1.0, true, 'fragmento_anel', 'Ring Fragment', 'A little piece of Saturn\'s rings. It spins by itself!', ['Wheee!', 'Spin!']],
      ['et_cristal', 'Crystalling', 365, 'zagueiro', 1.3, false, 'lasca_cristal', 'Violet Crystal Shard', 'It makes a pretty "ding" when it falls.', ['Ding!', 'Hard as crystal!']],
      ['et_medusa', 'Space Jellyfish', 372, 'meia', 1.2, true, 'orbe_medusa', 'Jellyfish Orb', 'It glows in the darkness of space.', ['Bloop... goal!', 'Float, float!']]],
    chefe: ['ch_rainha_aneis', 'Queen of the Rings', 378, 2.4], lider: { nome: 'Astronomer Vega', pele: 'pele-negra', cor: '#a890d8' } },
  { id: 'nebulosa', nome: 'Orion Nebula — Star Field', nomeCurto: 'Nebula', emoji: '🌌', req: 375, chao: CH.NEBULOSA, tema: 'nebular', predios: ['b_nebula1', 'b_nebula2'], props: ['cogumelo_cosmico', 'estrela_caida', 'cristais'], ent: 'ent_buraco_minhoca', tinta: 'rgba(255,120,220,0.12)',
    ets: [['et_nuvem', 'Little Nebula Cloud', 382, 'rapido', 1.1, true, 'poeira_estelar', 'Stardust', 'It shines with every color.', ['Whoosh!', 'Speedy cloud!']],
      ['et_cometa', 'Comet Striker', 390, 'rapido', 1.0, true, 'lasca_cometa', 'Comet Shard', 'It\'s still icy cold from space.', ['Zoooom!', 'Comet shot!']],
      ['et_cavaleiro', 'Star Knight', 397, 'zagueiro', 1.6, false, 'insignia_estelar', 'Star Badge', 'Medal of the knights of the galaxy.', ['For the galaxy!', 'I defend the stars!']]],
    chefe: ['ch_imperador_nebular', 'Nebula Emperor', 398, 2.5], lider: { nome: 'Guardian Orion', pele: 'pele-media', cor: '#d8a0dc' } },
];
const PLANETA_POR_ID = {}; PLANETAS.forEach(p => PLANETA_POR_ID[p.id] = p);
const ETS_ID = new Set(); PLANETAS.forEach(p => { p.ets.forEach(e => ETS_ID.add(e[0])); ETS_ID.add(p.chefe[0]); }); ETS_ID.add('ch_supremo');
const MAPAS_ESPACO = new Set(['estacao', 'copa_intergalactica', ...PLANETAS.map(p => p.id)]);

/* ---------- itens: equipamentos 300–400, poções, comida, loot ---------- */
Object.assign(ITENS, {
  chuteira_lunar: { nome: 'Moon Cleats', tipo: 'equip', slot: 'chuteira', atk: 100, st: { vel: 22, drible: 8 }, lvl: 305, preco: 3000000, venda: 600000, desc: 'Attack 100, +22 speed, +8 dribble.', iconeBase: 'i_chuteira_galaxia', matiz: 190 },
  camisa_lunar: { nome: 'Moon Jersey', tipo: 'equip', slot: 'camisa', def: 76, st: { hp: 2000, defesa: 6 }, lvl: 305, preco: 3200000, venda: 640000, avatar: 'roupa-futebol', cor: '#e8ecf8', cor2: '#6a7aa8', desc: '+2,000 stamina, +6 defense.', iconeBase: 'i_camisa_galaxia', matiz: 190 },
  caneleira_lunar: { nome: 'Moon Shin Guard', tipo: 'equip', slot: 'perna', def: 34, st: { defesa: 8, hp: 800 }, lvl: 308, preco: 2800000, venda: 560000, desc: '+8 defense, +800 stamina.', iconeBase: 'i_caneleira_galaxia', matiz: 190 },
  amuleto_lunar: { nome: 'Moon Amulet', tipo: 'equip', slot: 'acessorio', def: 10, st: { foco: 500, regen: 7 }, lvl: 310, preco: 2500000, venda: 500000, avatar: 'pescoco-medalha', desc: '+500 focus, +7 recovery.', iconeBase: 'i_insignia_estrela', matiz: 190 },
  chuteira_marciana: { nome: 'Martian Cleats', tipo: 'equip', slot: 'chuteira', atk: 112, st: { vel: 24, chute: 9, drible: 9 }, lvl: 335, venda: 800000, desc: 'Attack 112, +24 speed, +9 shot and dribble.', iconeBase: 'i_chuteira_galaxia', matiz: 110 },
  camisa_marciana: { nome: 'Martian Jersey', tipo: 'equip', slot: 'camisa', def: 84, st: { hp: 2500, defesa: 7 }, lvl: 335, venda: 840000, avatar: 'roupa-futebol', cor: '#d0463a', cor2: '#3ad06a', desc: '+2,500 stamina, +7 defense.', iconeBase: 'i_camisa_galaxia', matiz: 110 },
  caneleira_marciana: { nome: 'Martian Shin Guard', tipo: 'equip', slot: 'perna', def: 38, st: { defesa: 9, hp: 1000 }, lvl: 338, venda: 760000, desc: '+9 defense, +1,000 stamina.', iconeBase: 'i_caneleira_galaxia', matiz: 110 },
  chuteira_estelar: { nome: 'Star Cleats', tipo: 'equip', slot: 'chuteira', atk: 124, st: { vel: 26, chute: 10, drible: 10 }, lvl: 360, venda: 1000000, desc: 'Attack 124, +26 speed, +10 shot and dribble.', iconeBase: 'i_chuteira_galaxia', matiz: 260 },
  camisa_estelar: { nome: 'Star Jersey', tipo: 'equip', slot: 'camisa', def: 92, st: { hp: 3100, defesa: 8 }, lvl: 360, venda: 1050000, avatar: 'roupa-futebol', cor: '#6a3ad9', cor2: '#f8d838', desc: '+3,100 stamina, +8 defense.', iconeBase: 'i_camisa_galaxia', matiz: 260 },
  caneleira_estelar: { nome: 'Star Shin Guard', tipo: 'equip', slot: 'perna', def: 42, st: { defesa: 10, hp: 1250 }, lvl: 363, venda: 950000, desc: '+10 defense, +1,250 stamina.', iconeBase: 'i_caneleira_galaxia', matiz: 260 },
  capacete_estelar: { nome: 'Star Helmet', tipo: 'equip', slot: 'cabeca', def: 18, st: { hp: 900, visao: 6 }, lvl: 365, venda: 900000, avatar: 'chapeu-coroa', desc: '+900 stamina, +6 vision.', iconeBase: 'i_bola_coroa', matiz: 200 },
  chuteira_galactica: { nome: 'Galactic Cleats', tipo: 'equip', slot: 'chuteira', atk: 138, st: { vel: 30, chute: 12, drible: 12 }, lvl: 385, venda: 1400000, desc: 'Attack 138, +30 speed, +12 shot and dribble.', iconeBase: 'i_chuteira_galaxia', matiz: 40 },
  camisa_galactica: { nome: 'Galactic Jersey', tipo: 'equip', slot: 'camisa', def: 102, st: { hp: 3800, defesa: 10 }, lvl: 385, venda: 1450000, avatar: 'roupa-futebol', cor: '#1a1450', cor2: '#ffcf3a', desc: '+3,800 stamina, +10 defense.', iconeBase: 'i_camisa_galaxia', matiz: 40 },
  caneleira_galactica: { nome: 'Galactic Shin Guard', tipo: 'equip', slot: 'perna', def: 46, st: { defesa: 12, hp: 1500 }, lvl: 388, venda: 1300000, desc: '+12 defense, +1,500 stamina.', iconeBase: 'i_caneleira_galaxia', matiz: 40 },
  coroa_galactica: { nome: 'Galactic Crown', tipo: 'equip', slot: 'cabeca', def: 22, st: { hp: 1200, drible: 9, chute: 9, visao: 6 }, lvl: 395, venda: 2000000, avatar: 'chapeu-coroa', desc: 'From the Galaxy Supreme. +1,200 stamina, +9 dribble and shot, +6 vision.', iconeBase: 'i_bola_coroa', matiz: 280 },
  soro_estelar: { nome: 'Star Serum', tipo: 'consumivel', efeito: { hp: 12000 }, lvl: 300, preco: 5200, venda: 1040, desc: 'Recovers 12,000 stamina. Level 300.', icon: { k: 'copo', c: '#f8d838' } },
  cristal_foco: { nome: 'Focus Crystal', tipo: 'consumivel', efeito: { foco: 6000 }, lvl: 300, preco: 4800, venda: 960, desc: 'Recovers 6,000 focus. Level 300.', icon: { k: 'copo', c: '#b07aff' } },
  rango_astronauta: { nome: 'Astronaut Grub', tipo: 'comida', efeito: { dur: 900, regen: 10, regenFoco: 7, atr: { defesa: 18, habilidade: 18, inteligencia: 18, folego: 18 } }, lvl: 300, preco: 6000, venda: 1200, desc: 'Food in a tube: +18 to EVERYTHING and lots of recovery for 15 min.', iconeBase: 'i_areia_colorida', matiz: 200 },
  trofeu_galaxia: { nome: 'Intergalactic Cup Trophy', tipo: 'loot', venda: 400 * 250, desc: 'Proof that you beat the Galaxy Supreme. A collector\'s item.', iconeBase: 'i_taca_copa', matiz: 250 },
});
for (const p of PLANETAS) for (const [id, , L, , , , item, nomeItem, descItem] of p.ets) ITENS[item] = { nome: nomeItem, tipo: 'loot', venda: Math.round(L * 15), desc: descItem };
const ASSETS_ESP = ['t_poeira_lua', 't_marte', 't_solo_anel', 't_solo_nebula', 't_metal_esp', 't_estrelas', 'b_estacao1', 'b_estacao2', 'b_lua1', 'b_lua2', 'b_marte1', 'b_marte2', 'b_saturno1', 'b_saturno2', 'b_nebula1', 'b_nebula2',
  'foguete', 'nave', 'console_esp', 'radar', 'cratera', 'rochas_lua', 'buggy_lunar', 'bandeira_bola', 'rochas_marte', 'cacto_alien', 'geiser', 'rover', 'cristal_flutuante', 'meteorito', 'cogumelo_cosmico', 'estrela_caida',
  'ent_cratera', 'ent_escotilha', 'ent_cristal_esp', 'ent_buraco_minhoca', ...[...ETS_ID], ...PLANETAS.flatMap(p => p.ets.map(e => 'i_' + e[6]))];
ASSETS_ESP.forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });

/* ---------- os ETs e os chefões ---------- */
const GEAR_ESP = L => L < 330 ? ['chuteira_lunar', 'camisa_lunar', 'caneleira_lunar', 'amuleto_lunar'] : L < 355 ? ['chuteira_marciana', 'camisa_marciana', 'caneleira_marciana'] : L < 380 ? ['chuteira_estelar', 'camisa_estelar', 'caneleira_estelar', 'capacete_estelar'] : ['chuteira_galactica', 'camisa_galactica', 'caneleira_galactica'];
const criaET = (id, nome, L, arq, alt, voa, falas) => {
  const m = montaMonstro(id, nome, arq, L, { falas, proj: /cometa|cristal|medusa/.test(id) ? 'bolaforte' : 'bola' });
  m.look = { tipo: id, spr: id, voa, grande: alt >= 1.3 }; ALTURA_BICHO[id] = alt;
  if (arq !== 'chefe') { m.hp = Math.round(m.hp * 1.7); m.xp = Math.round(m.xp * 1.55); } // os equipamentos 300+ batem forte: ETs aguentam mais (teste de luta: 4–10 s, igual Atlântida)
  return m;
};
for (const p of PLANETAS) {
  for (const [id, nome, L, arq, alt, voa, item, , , falas] of p.ets) {
    const m = criaET(id, nome, L, arq, alt, voa, falas); const g = GEAR_ESP(L);
    m.loot = [[item, 0.3, 1, 2], ['fio_ouro', 0.02, 1, 1], ['soro_estelar', 0.05, 1, 1], [g[(L >> 1) % g.length], 0.004, 1, 1]];
  }
  const [cid, cnome, cL, calt] = p.chefe;
  const ch = criaET(cid, cnome, cL, 'chefe', calt, false, ['Get ready, Earthling!', 'On my planet, the ball is mine!', 'Show us Earth\'s soccer!']);
  const g = GEAR_ESP(cL); ch.loot = [['fio_ouro', 1, 2, 4], [p.ets[0][6], 1, 3, 5], [g[0], 0.35, 1, 1], [g[1], 0.2, 1, 1]];
}
{
  const sup = criaET('ch_supremo', 'The Galaxy Supreme', 400, 'chefe', 2.8, false, ['A thousand galaxies, and no rival good enough...', 'Show me why they call you a LEGEND!', 'The Intergalactic Cup is mine!']);
  sup.hp = Math.round(sup.hp * 1.8); sup.xp = Math.round(sup.xp * 1.5); sup.respawn = 1800000;
  sup.loot = [['trofeu_galaxia', 1, 1, 1], ['coroa_galactica', 0.25, 1, 1], ['chuteira_galactica', 0.25, 1, 1], ['fio_ouro', 1, 3, 6]];
}
// retratos (wiki, lista de batalha)
const _desenhaBichoEsp = desenhaBicho;
desenhaBicho = function (x, tipo, px, py, s, a) {
  if (!ETS_ID.has(tipo)) return _desenhaBichoEsp.apply(this, arguments);
  const im = aSprite(tipo); if (!im) return;
  const h = Math.min(ALTURA_BICHO[tipo] || 1, 1.6) * T * s, w = h * im.width / im.height;
  x.save(); x.translate(px, py); if (a && a.flip === false) x.scale(-1, 1); x.drawImage(im, -w / 2, -h, w, h); x.restore();
};

/* ---------- Estação Espacial (centro) ---------- */
function criaEstacao() {
  const W = 56, H = 40; const b = new Construtor('estacao', 'Galactic Space Station', W, H, CH.METAL, 2301);
  // janelas para o espaço em volta (3 de largura)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < 3 || y < 3 || x >= W - 3 || y >= H - 3) { b.chao(x, y, CH.ESTRELAS); b.obj(x, y, 'x'); }
  // chegada do foguete
  objLargo(b, 7, 7, 'foguete', 1); b.npc('estela_estacao', 10, 8); b.m.inicio = { x: 9, y: 10 }; b.m.renasce = { x: 9, y: 10 };
  b.placa(12, 6, '🚀 SPACE STATION — aliens play soccer too, and they challenge humans! Talk to the Control Tower to fly to the planets.');
  // doca das naves + torre de controle
  objLargo(b, 44, 8, 'nave', 3); b.npc('torre_esp', 40, 10); b.obj(38, 7, 'console_esp'); b.obj(49, 12, 'radar');
  // praça central
  b.predio('b_estacao1', 14, 14, 5, 3); b.predio('b_estacao2', 36, 14, 5, 3);
  b.npc('loja_esp', 24, 22); b.npc('lider_esp', 31, 22); b.npc('quadro', 28, 25);
  b.espalha(['console_esp', 'radar', 'console_esp'], 10, 4, 18, W - 8, H - 22, t => t === CH.METAL);
  b.m.espaco = { tinta: 'rgba(90,120,255,0.06)' };
  return b.m;
}
MAPAS_DEF.estacao = () => criaEstacao(); // v288: espaco_novo.js troca o desenho

/* ---------- planetas ---------- */
function criaPlaneta(p) {
  const W = 64, H = 50; const b = new Construtor(p.id, p.nome, W, H, p.chao, 2400 + p.req);
  const borda = [...p.props.filter(t => OBJ_INFO[t] && OBJ_INFO[t].b), 'x'];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) b.obj(x, y, (x + y) % 2 ? 'x' : borda[(x * 5 + y * 3) % borda.length]);
  // caminhos de metal
  b.ret(3, 24, W - 6, 2, CH.METAL); b.ret(31, 3, 2, H - 6, CH.METAL); b.ret(3, 43, W - 6, 2, CH.METAL);
  // pouso da nave
  b.ret(3, 3, 12, 7, CH.METAL); objLargo(b, 7, 6, 'nave', 3); b.npc('piloto_' + p.id, 11, 7);
  b.m.inicio = { x: 9, y: 9 }; b.m.renasce = { x: 9, y: 9 };
  b.placa(13, 8, `${p.emoji} ${p.nomeCurto.toUpperCase()} — the aliens play soccer here! Beat their teams and challenge ${p.chefe[1].toUpperCase()}.`);
  // bairro dos ETs
  const [p1, p2] = p.predios;
  [[16, 3], [22, 3], [37, 3], [43, 3], [49, 3], [16, 28], [37, 28], [43, 28]].forEach(([x, y], i) => b.predio(i % 2 ? p2 : p1, x, y, 5, 3));
  b.npc('lider_' + p.id, 29, 21); b.npc('quadro', 34, 21);
  // chefão no canto (território)
  const [cid] = p.chefe; b.ret(50, 12, 10, 8, CH.METAL); b.spawn(cid, 55, 16, 1, 1); b.placa(49, 11, `${MONSTROS[cid].nome.toUpperCase()}'s Territory (level ${nivelMonstro(MONSTROS[cid])})`);
  // ETs pela cidade
  const [e1, e2, e3] = p.ets.map(e => e[0]);
  b.spawn(e1, 12, 17, 5, 4); b.spawn(e1, 44, 36, 4, 4); b.spawn(e2, 22, 34, 4, 3); b.spawn(e2, 52, 30, 3, 3); b.spawn(e3, 40, 17, 4, 3); b.spawn(e3, 12, 34, 3, 3);
  // pedestais das 3 áreas de caça (embaixo)
  for (const x of [10, 30, 50]) b.ret(x - 1, 39, 5, 3, CH.METAL);
  b.espalha(p.props, 55, 3, 3, W - 6, H - 6, t => t === p.chao);
  b.m.espaco = { tinta: p.tinta }; if (p.gravidade) b.m.gravidade = p.gravidade;
  return b.m;
}
PLANETAS.forEach(p => { MAPAS_DEF[p.id] = () => criaPlaneta(p); });

/* ---------- Copa Intergaláctica (estádio do chefão final) ---------- */
function criaCopaIntergalactica() {
  const W = 40, H = 30; const b = new Construtor('copa_intergalactica', '🏆 Intergalactic Cup', W, H, CH.METAL, 2999);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) { b.chao(x, y, CH.ESTRELAS); b.obj(x, y, 'x'); }
  for (let x = 3; x < W - 3; x++) b.obj(x, 2, 'arquibancada');
  b.campo(6, 6, 28, 16, CH.CAMPO);
  for (const [x, y] of [[3, 4], [W - 4, 4], [3, H - 5], [W - 4, H - 5]]) b.obj(x, y, 'holofote');
  b.spawn('ch_supremo', 20, 13, 1, 1); b.spawn('et_cavaleiro', 10, 13, 2, 2); b.spawn('et_cavaleiro', 30, 13, 2, 2);
  b.npc('piloto_copa', 20, H - 4); b.m.inicio = { x: 20, y: H - 5 }; b.m.renasce = { x: 20, y: H - 5 };
  b.placa(17, H - 4, '🏆 INTERGALACTIC CUP — the grand final against THE GALAXY SUPREME. Good luck, legend of Earth!');
  b.m.espaco = { tinta: 'rgba(255,210,80,0.06)' };
  return b.m;
}
MAPAS_DEF.copa_intergalactica = criaCopaIntergalactica;

/* ---------- áreas de caça (3 por planeta) ---------- */
{
  const guias = { lua: ['Cadet Nino', 'pele-clara'], marte: ['Cadet Tupã', 'pele-morena'], saturno: ['Cadet Stella', 'pele-negra'], nebulosa: ['Cadet Orion', 'pele-media'] };
  const nomes = {
    et_coelho: 'Bunny Craters', et_rocha: 'Moon Quarry', et_selenita: 'Selenite Stadium',
    et_marciano: 'Little Martians Valley', et_robo: 'Robot Mine', et_rover: 'Rover Desert',
    et_anel: 'Ring Carousel', et_cristal: 'Violet Crystal Cave', et_medusa: 'Jellyfish Lake',
    et_nuvem: 'Sea of Clouds', et_cometa: 'Comet\'s Tail', et_cavaleiro: 'Star Fortress',
  };
  PLANETAS.forEach((p, ip) => p.ets.forEach(([m], k) => {
    const [gn, gp] = guias[p.id];
    registraCaca({ id: 'caca_' + m, nome: nomes[m], host: p.id, m, tema: p.tema, ent: p.ent, guia: `${gn} ${k + 1}`, look: lkGuia(gp, '#f4f4f8', { chapeu: null, roupa: 'roupa-terno', corRoupa: '#e8ecf8' }), seed: 12001 + ip * 311 + k * 97, pos: { x: [10, 30, 50][k], y: 40 } });
  }));
  // guias falam do desafio dos ETs
  PLANETAS.forEach(p => p.ets.forEach(([m]) => { const n = NPCS['guia_caca_' + m]; const d = MONSTROS[m]; if (n) n.ola = `This is the field of the "${d.nome}" team (level ${nivelMonstro(d)}). They've never played against a human and they can't wait to challenge you! Want a mission?`; }));
  // os temas espaciais pintam o céu da área de caça também
  const _criaCacaEsp = criaCaca;
  criaCaca = function (c) { const m = _criaCacaEsp.apply(this, arguments); const t = TEMAS_CACA[c.tema]; if (t && t.tinta) m.espaco = { tinta: t.tinta }; return m; };
  PLANETAS.forEach(p => { DESAFIOS[p.id] = p.ets.map(e => [e[0], 200]); });
  DESAFIOS.estacao = [['et_coelho', 150], ['et_rocha', 150], ['et_selenita', 150]];
}

/* ---------- NPCs ---------- */
const LOOK_ASTRO = (corpo, pele, cor) => ({ tipo: 'humano', corpo, alt: 1.72, pele, cabelo: corpo === 'f' ? 'cabelo-coque' : 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-terno', corRoupa: cor, baixo: 'baixo-jeans' });
Object.assign(NPCS, {
  estela: { nome: 'Dr. Estela, the astronaut', viagemEsp: 'decolar', look: LOOK_ASTRO('f', 'pele-negra', '#e8ecf8'), ola: 'Did you know aliens play soccer too? And they want to challenge humans! The rocket is ready.' },
  estela_estacao: { nome: 'Dr. Estela, the astronaut', viagemEsp: 'terra', look: LOOK_ASTRO('f', 'pele-negra', '#e8ecf8'), ola: 'Whenever you want to go back to Earth, the rocket will take you back to the beach in Rio.' },
  torre_esp: { nome: 'Control Tower', viagemEsp: 'torre', look: LOOK_ASTRO('m', 'pele-media', '#3a4a6a'), ola: 'Control Tower here! Which planet are we flying to today?' },
  piloto_copa: { nome: 'Cosmic Pilot', viagemEsp: 'torre', look: LOOK_ASTRO('m', 'pele-clara', '#ffcf3a'), ola: 'Ready to go back? Pick your destination.' },
  loja_esp: { nome: 'Seu Plutão\'s Galactic Shop', loja: ['soro_estelar', 'cristal_foco', 'rango_astronauta', 'chuteira_lunar', 'camisa_lunar', 'caneleira_lunar', 'amuleto_lunar'], look: LOOK_ASTRO('m', 'pele-retinta', '#f8d838'), ola: 'Star Serum, Focus Crystals and moon gear! Everything a star needs to play among the stars.' },
  lider_esp: { nome: 'Commander Nova', look: Object.assign(LOOK_ASTRO('f', 'pele-media', '#1a2a6a'), { cabelo: 'cabelo-rabo', corCabelo: 'ruivo', pescoco: 'pescoco-apito' }), ola: 'The aliens from every planet have challenged Earth to the Intergalactic Cup. And Earth chose YOU.' },
});
for (const p of PLANETAS) {
  NPCS['piloto_' + p.id] = { nome: `Spaceship Pilot (${p.nomeCurto})`, viagemEsp: 'torre', look: LOOK_ASTRO('m', 'pele-morena', '#e8ecf8'), ola: 'The ship is fueled up. Where to now?' };
  NPCS['lider_' + p.id] = { nome: p.lider.nome, look: Object.assign(LOOK_ASTRO('f', p.lider.pele, p.lider.cor), { cabelo: 'cabelo-rabo' }), ola: `Here on ${p.nomeCurto}, the aliens have played ball forever. They want to know if humans are really that good!` };
}
const ESP_NIVEL = 298, ESP_PRECO = 200000;
let ESP_VOLTA = null;
function destinosEspaco() {
  const s = G.save;
  return [{ id: 'estacao', nome: '🛰️ Space Station', req: ESP_NIVEL }, ...PLANETAS.map(p => ({ id: p.id, nome: `${p.emoji} ${p.nomeCurto} (levels ${p.ets[0][2]}–${p.chefe[2]})`, req: p.req })),
    { id: 'copa_intergalactica', nome: '🏆 Intergalactic Cup (final)', req: 395, flag: 'venceu_imperador', msgFlag: 'Beat the Nebula Emperor first' }];
}
function modalViagemEspaco(npc) {
  const s = G.save; const d = npc.d; const fecha = el('button', { class: 'btn', onclick: fechaModal }, 'Not now');
  const ops = [];
  if (d.viagemEsp === 'decolar') {
    const pode = s.nivel >= ESP_NIVEL, tem = s.ouro >= ESP_PRECO;
    ops.push(el('button', { class: 'btn amarelo', disabled: pode && tem ? null : 'disabled', onclick: () => { s.ouro -= ESP_PRECO; fechaModal(); som('porta'); trocaMapa('estacao', 9.5, 10.5); banner('🚀 Space Station', 'The aliens want to play!'); } },
      !pode ? `🔒 Only from level ${ESP_NIVEL}` : !tem ? `You need ${fmt(ESP_PRECO - s.ouro)} more coins` : `🚀 Take off to the Space Station (${fmt(ESP_PRECO)} coins)`));
  } else if (d.viagemEsp === 'terra') {
    ops.push(el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); som('porta'); getMapa('rio'); const p = ESP_VOLTA || getMapa('rio').inicio; trocaMapa('rio', p.x + 0.5, p.y + 1.5); } }, '🌎 Go back to Earth (Rio beach)'));
  } else {
    for (const t of destinosEspaco()) {
      if (G.mapa && t.id === G.mapa.id) continue;
      const trava = s.nivel < t.req ? `🔒 level ${t.req}` : t.flag && !s.flags[t.flag] ? `🔒 ${t.msgFlag}` : '';
      const ini = t.id === 'estacao' ? { x: 44, y: 11 } : null;
      ops.push(el('button', { class: 'btn ' + (trava ? '' : 'amarelo'), disabled: trava ? 'disabled' : null, onclick: () => { fechaModal(); som('porta'); if (ini) trocaMapa(t.id, ini.x + 0.5, ini.y + 0.5); else trocaMapa(t.id); } }, trava ? `${t.nome} — ${trava}` : t.nome));
    }
  }
  abreModal(el('h2', {}, d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, d.ola))),
    el('div', { class: 'opcoes', style: 'flex-direction:column;align-items:stretch' }, ...ops, fecha));
}
const _abrirNPCEsp = abrirNPC;
abrirNPC = function (npc) { if (npc && npc.d && npc.d.viagemEsp) return modalViagemEspaco(npc); return _abrirNPCEsp.apply(this, arguments); };
if (typeof iconeNPC === 'function') { const _iconeNPCEsp = iconeNPC; iconeNPC = function (n) { const d = n.d || NPCS[n.id] || {}; return d.viagemEsp ? '🚀' : _iconeNPCEsp(n); }; }
// a Dra. Estela e o foguete ficam na praia do Rio
{
  const base = MAPAS_DEF.rio;
  MAPAS_DEF.rio = function () {
    const m = base(); poeNpcPerto(m, 'estela', 'capita_iara');
    const n = m.npcs.find(k => k.id === 'estela');
    if (n) { ESP_VOLTA = { x: n.x, y: n.y }; const sx = n.x + 2, sy = n.y; if (!m.veiculosProprios && !m.obj[sy * m.w + sx]) m.obj[sy * m.w + sx] = { t: 'foguete', v: 1 }; }
    return m;
  };
}
// gravidade baixa na Lua: anda um pouco mais rápido
if (typeof velJogador === 'function') { const _velEsp = velJogador; velJogador = function () { const v = _velEsp.apply(this, arguments); return G.mapa && G.mapa.gravidade ? v * G.mapa.gravidade : v; }; }

/* ---------- missões ---------- */
{
  const xpNivel = x => xpPara(x + 1) - xpPara(x);
  const [lua, marte, saturno, nebulosa] = PLANETAS;
  MISSOES.push(
    { id: 'esp_m1', npc: 'lider_esp', titulo: 'First Step on the Moon', lvl: 298, texto: 'The aliens sent a challenge: they want to see if humans know how to play. Fly to the Moon and dribble past 60 Moon Bunnies.', req: { kill: 'et_coelho', n: 60 }, rec: { xp: Math.round(xpNivel(305) * 1.5), ouro: 1500000, itens: [['soro_estelar', 10], ['cristal_foco', 5]] }, fim: 'The Moon Bunnies were amazed! The news is already spreading across the galaxy.' },
    { id: 'esp_m2', npc: 'lider_esp', titulo: 'The Moon Captain', lvl: 326, pre: 'esp_m1', texto: 'The Moon Captain is the most famous star on the Moon. Beat him on his own turf!', req: { kill: 'ch_capitao_lunar', n: 1 }, rec: { xp: Math.round(xpNivel(328) * 3), ouro: 2500000, itens: [['amuleto_lunar', 1]] }, fim: 'The Moon is ours! Now Mars wants to play.' },
    { id: 'esp_m3', npc: 'lider_esp', titulo: 'The General of Mars', lvl: 351, pre: 'esp_m2', texto: 'The Martian General trains the most disciplined team in the Solar System. Show him the Brazilian dribble!', req: { kill: 'ch_general_marciano', n: 1 }, rec: { xp: Math.round(xpNivel(353) * 3), ouro: 3500000, itens: [['chuteira_marciana', 1]] }, fim: 'Mars salutes you!' },
    { id: 'esp_m4', npc: 'lider_esp', titulo: 'The Queen of the Rings', lvl: 376, pre: 'esp_m3', texto: 'In Saturn\'s rings lives the Queen, who has never let in a goal. Beat her!', req: { kill: 'ch_rainha_aneis', n: 1 }, rec: { xp: Math.round(xpNivel(378) * 3), ouro: 4500000, itens: [['capacete_estelar', 1]] }, fim: 'The Queen of the Rings gave you a respectful smile.' },
    { id: 'esp_m5', npc: 'lider_esp', titulo: 'The Nebula Emperor', lvl: 396, pre: 'esp_m4', texto: 'The last guardian before the final: the Nebula Emperor, in the Orion Nebula.', req: { kill: 'ch_imperador_nebular', n: 1 }, rec: { xp: Math.round(xpNivel(398) * 3), ouro: 6000000, flag: 'venceu_imperador' }, fim: 'The way is clear: the INTERGALACTIC CUP is waiting for you! Talk to the Control Tower.' },
    { id: 'esp_m6', npc: 'lider_esp', titulo: 'The Intergalactic Cup', lvl: 398, pre: 'esp_m5', texto: 'It\'s the final of all finals. In the stadium among the stars, THE GALAXY SUPREME is waiting. Win, and Earth will be champion of the universe!', req: { kill: 'ch_supremo', n: 1 }, rec: { xp: Math.round(xpNivel(400) * 6), ouro: 15000000, itens: [['coroa_galactica', 1]], flag: 'campeao_galaxia' }, fim: 'GALAXY CHAMPION! From Campinho Village to the whole universe.' },
  );
  for (const p of PLANETAS) { // v407 (Raio-X R8): "Desafio na Lua", "O melhor time da Nebulosa" (prepLugar em data.js)
    const [a, , c] = p.ets;
    MISSOES.push(
      { id: p.id + '_esp1', npc: 'lider_' + p.id, titulo: `Challenge ${prepLugar('em', p.nomeCurto)}`, lvl: a[2] - 4, texto: `The "${a[1]}" team wants to test their strength against a human. Get past 60 of them!`, req: { kill: a[0], n: 60 }, rec: { xp: Math.round(xpNivel(a[2]) * 1.2), ouro: a[2] * 3000, itens: [[GEAR_ESP(a[2])[1], 1]] }, fim: 'They asked for a rematch... but they already know who\'s boss!' },
      { id: p.id + '_esp2', npc: 'lider_' + p.id, titulo: `The best team ${prepLugar('de', p.nomeCurto)}`, lvl: c[2] - 3, pre: p.id + '_esp1', texto: `Now the strongest team around here: "${c[1]}". Beat 60 of them.`, req: { kill: c[0], n: 60 }, rec: { xp: Math.round(xpNivel(c[2]) * 1.5), ouro: c[2] * 4000, itens: [[GEAR_ESP(c[2])[0], 1]] }, fim: `All of ${p.nomeCurto} is talking about you!` },
    );
  }
}

/* ---------- forja 300+ ---------- */
{
  const _matEsp = materialRaroRefino;
  materialRaroRefino = function (lvl) { return lvl >= 380 ? 'insignia_estelar' : lvl >= 355 ? 'orbe_medusa' : lvl >= 330 ? 'engrenagem' : lvl >= 300 ? 'amostra_lunar' : _matEsp(lvl); };
  const _trofEsp = trofeuRefino;
  trofeuRefino = function (lvl) { return lvl >= 385 ? 'trofeu_galaxia' : _trofEsp(lvl); };
}

/* ---------- história: Capítulos 8 e 9 ---------- */
if (typeof CAPITULOS !== 'undefined') {
  CAPITULOS.espaco = {
    rotulo: 'Chapter 8', titulo: 'To the Stars', emoji: '🚀', implica: ['mundo', 'europa', 'retorno', 'copa', 'atlantida'],
    cond: (s, mapa) => MAPAS_ESPACO.has(mapa) || /^caca_et_/.test(mapa),
    cenas: [
      { img: 'cap_esp_1', kb: 'kb-a', cor: ['#140a40', '#f8a040'], txt: n => 'A strange signal came from the sky: a soccer ball drawn with stars. It was an invitation... from the aliens!' },
      { img: 'cap_esp_1', kb: 'kb-zoom', foco: '55% 40%', cor: ['#140a40', '#f8a040'], txt: n => `Dr. Estela started the engines and the rocket went up, up, up... taking ${typeof _hn === 'function' ? _hn(n) : 'the legend'} away from Earth.` },
      { img: 'cap_esp_2', kb: 'kb-b', cor: ['#0a0a1e', '#8ab0ff'], txt: n => 'On the Moon, the secret came out: aliens play soccer too! And every planet has its own teams, eager to challenge humans.' },
    ],
    final: { emoji: '🚀', titulo: 'To the Stars', sub: n => 'Chapter 8 has begun! Moon, Mars, Saturn and the Nebula (levels 305 to 400). At the end, the Intergalactic Cup!', botao: 'Take off! 🚀' },
  };
  CAPITULOS.galaxia = {
    rotulo: 'Chapter 9', titulo: 'Galaxy Champion', emoji: '🏆', implica: ['espaco'],
    cond: s => !!s.flags.campeao_galaxia,
    cenas: [
      { img: 'cap_esp_3', kb: 'kb-a', cor: ['#0a0a1e', '#ffcf3a'], txt: n => 'The stadium floated among the stars. On one side, the Galaxy Supreme. On the other, the kid from the little dirt pitch.' },
      { img: 'cap_esp_3', kb: 'kb-zoom', foco: '50% 55%', cor: ['#0a0a1e', '#ffcf3a'], txt: n => 'Dribble, nutmeg, bicycle kick... and GOOOAL! Aliens from a thousand planets jumped in the stands. Earth was champion of the universe!' },
      { img: 'historia_1', kb: 'kb-d', cor: ['#f7b35a', '#3aa0c8'], txt: n => 'Back in the Village, Seu Zé looked up at the sky and smiled: "I always knew it." And the universe still holds many fields to discover...' },
    ],
    final: { emoji: '🏆', titulo: 'Galaxy Champion!', sub: n => `Congratulations${n ? ', ' + n : ''}! You won the Intergalactic Cup. New worlds will appear in upcoming updates!`, botao: 'The legend continues... ⚽' },
  };
  const ord = CAPITULOS_ORDEM; for (const id of ['espaco', 'galaxia']) { const ig = ord.indexOf('gloria'); if (!ord.includes(id)) ord.splice(ig >= 0 ? ig : ord.length, 0, id); }
}

/* ---------- visual: céu de cada planeta e estrelas piscando ---------- */
const _desenhaNoiteEsp = desenhaNoite;
desenhaNoite = function (ctx, cam, vw, vh, x0, y0, x1, y1) {
  const m = G.mapa;
  if (!m || !m.espaco) return _desenhaNoiteEsp.apply(this, arguments);
  ctx.save();
  if (m.espaco.tinta) { ctx.fillStyle = m.espaco.tinta; ctx.fillRect(cam.x, cam.y, vw, vh); }
  // brilhinhos nas janelas estreladas
  ctx.fillStyle = '#ffffff';
  for (let y = Math.max(0, y0); y < Math.min(m.h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(m.w, x1); x++) {
    if (m.chao[y * m.w + x] !== CH.ESTRELAS) continue;
    const h = hash2(x, y); if (h > 0.35) continue;
    const a = 0.5 + 0.5 * Math.sin(G.agora / (400 + h * 900) + h * 20); ctx.globalAlpha = a * 0.9;
    ctx.beginPath(); ctx.arc((x + h * 3 % 1) * T, (y + (h * 7) % 1) * T, 1.6, 0, 7); ctx.fill();
  }
  ctx.restore();
};
