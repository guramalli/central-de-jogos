/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ATLÂNTIDA (v141): a primeira região "maluca" — níveis 200 a 300
   - Chega-se de SUBMARINO, com a Capitã Iara, na praia do Rio (nível 195+).
   - Atlântida é uma cidade no fundo do mar (sem adversários) com 16 PORTAIS
     para mundos perdidos: cada portal é uma área de caça (cacadas.js) com
     UM tipo de bicho novo, do nível 205 ao 296.
   - Bichos novos: uma arte só (a/bicho_<id>.webp, olhando para a esquerda),
     look { tipo, spr, voa }. Itens de cada bicho: a/i_<item>.webp.
   - Equipamentos 200–300 (Coral 205, Abissal 240, Dracônico 275), poções,
     missões da Rainha Marina e o Capítulo 7 da história.
   Para a próxima região (céu, Lua...): copiar este arquivo como modelo.
   Carregar DEPOIS de cacadas.js e montarias.js.
   ============================================================ */

/* ---------- chão do fundo do mar ---------- */
CH.AREIA_MAR = 38; CH.PEDRA_MAR = 39;
Object.assign(ESTILO_CHAO, {
  [CH.AREIA_MAR]: { cor: '#c8c09a', borda: '#a09870', r: 0.45, e: 0.12, tex: 'areia', o: 3.1 },
  [CH.PEDRA_MAR]: { cor: '#8aa8a8', borda: '#5a7878', r: 0.25, e: 0.05, tex: 'pedra', o: 5.1 },
});
Object.assign(TEX_CHAO, { [CH.AREIA_MAR]: 't_areia_mar', [CH.PEDRA_MAR]: 't_pedra_mar' });
Object.assign(CH_MINI, { 38: '#c8c09a', 39: '#8aa8a8' });

/* ---------- artes ---------- */
Object.assign(OBJ_INFO, {
  coral_grande: { w: 1.5, b: 1 }, alga_alta: { w: 1.1, b: 1 }, concha_gigante: { w: 1.4, b: 1 }, ancora_bau: { w: 1.4, b: 1 },
  submarino: { w: 2.6, b: 1 }, estatua_netuno: { w: 1.7, b: 1 }, coluna_ruina: { w: 0.95, b: 1 }, bolhas: { w: 0.7, b: 0 },
});
Object.keys(OBJ_INFO).forEach(k => { if (OBJ_INFO[k].b) OBJ_BLOQUEIA.add(k); });
Object.assign(OBJ_MINI, { coral_grande: '#e86a8a', alga_alta: '#3a8a3a', coluna_ruina: '#d8d0c0', submarino: '#f8d838' });
['estatua_netuno', 'submarino', 'coral_grande'].forEach(t => OBJ_VISAO.add(t));

/* ---------- temas novos das áreas de caça ---------- */
Object.assign(TEMAS_CACA, {
  recife: { aberto: 1, chao: CH.AREIA_MAR, var: CH.AREIA, trilha: CH.PEDRA_MAR, borda: ['coral_grande', 'alga_alta', 'rochas', 'coral_grande'], agua: 0.25, props: ['concha_gigante', 'coral_grande', 'bolhas', 'ancora_bau', 'alga_alta'] },
  mina: { chao: CH.CAVERNA, parede: CH.PAREDE_CAV, props: ['rochas', 'estalagmite', 'cristais'], enfeite: ['rochas', 'estalagmite'], luz: ['tocha'], tocha: 'tocha', cor: '255,190,110' },
});

/* ---------- os bichos ---------- */
// [id, nome, nível, arquétipo, altura (tiles), voa, item que derruba, nome do item, descrição, falas]
const BICHOS_ATL = [
  ['rato', 'Ball Boy Rat', 205, 'rapido', 0.72, false, 'queijo_furado', 'Holey Cheese', 'The rats\' favorite snack.', ['Squeak!', 'My ball!']],
  ['minhocao', 'Giant Sand Worm', 210, 'zagueiro', 1.15, false, 'areia_colorida', 'Little Bottle of Colored Sand', 'Sand in seven colors, from the lost dunes.', ['Grrrlub...', 'Blup!']],
  ['morcego', 'Dribbling Bat', 216, 'rapido', 0.75, true, 'asa_morcego', 'Bat Wing', 'Quick as a dribble in the dark.', ['Eeeek!', 'Catch me!']],
  ['aranha', 'Goalkeeper Spider', 222, 'meia', 0.8, false, 'novelo_teia', 'Ball of Web', 'Eight arms, eight gloves, zero goals allowed.', ['Nothing gets in here!', 'Tchic tchic!']],
  ['toupeira', 'Digger Mole', 228, 'zagueiro', 0.85, false, 'pepita', 'Gold Nugget', 'She digs up the grass looking for gold.', ['Dig, dig!', 'Hmpf!']],
  ['mumia', 'Defender Mummy', 234, 'zagueiro', 1.3, false, 'faixa_mumia', 'Mummy Wrap', 'Three thousand years of marking.', ['Oooooh...', 'You shall not paaass...']],
  ['tanuki', 'Playful Tanuki', 240, 'rapido', 0.9, false, 'folha_magica', 'Magic Leaf', 'The tanuki puts it on its head and turns into something else!', ['Pon-poko!', 'Hehe!']],
  ['escorpiao', 'Striker Scorpion', 246, 'meia', 0.8, false, 'ferrao', 'Scorpion Stinger', 'His tail shoots from far away.', ['Tsss!', 'Stinger shot!']],
  ['jacare', 'Big Goalie Gator', 252, 'zagueiro', 0.75, false, 'dente_jacare', 'Alligator Tooth', 'It fell out while saving a penalty.', ['Chomp!', 'Grrr!']],
  ['polvo', 'Juggler Octopus', 258, 'meia', 1.0, false, 'tinta_polvo', 'Octopus Ink', 'Dark blue ink for painting the scoreboard.', ['Blub blub!', 'Eight keepy-uppies!']],
  ['touro', 'Angry Bull', 264, 'rapido', 1.25, false, 'sino_touro', 'Bull Bell', 'Ding dong: here he comes!', ['Mooooo!', 'Snort!']],
  ['gargula', 'Goalkeeper Gargoyle', 270, 'zagueiro', 1.0, false, 'asa_pedra', 'Stone Wing', 'A piece of a gargoyle from the cathedral.', ['Crrrk...', 'Rock solid!']],
  ['yeti', 'Big Defender Yeti', 276, 'zagueiro', 1.7, false, 'pelo_yeti', 'Tuft of Yeti Fur', 'Warm and fluffy like a cloud.', ['UOOOH!', 'Nice and cold!']],
  ['fantasma', 'Little Ghost Fan', 282, 'meia', 1.1, true, 'lencol_fantasma', 'Ghost Sheet', 'He keeps cheering even after the final whistle.', ['Booo... goal!', 'Woohoo!']],
  ['dragao', 'Little Striker Dragon', 288, 'meia', 1.2, false, 'escama_dragao', 'Dragon Scale', 'Warm to the touch, glows in the dark.', ['Grooar!', 'Fire on the ball!']],
  ['dragao_anciao', 'Elder Dragon', 296, 'meia', 1.9, false, 'ovo_dragao', 'Dragon Egg', 'Super rare! They say it hatches when someone scores a bicycle kick goal.', ['GROOOOAR!', 'A thousand years of soccer!']],
];
const BICHOS_ATL_ID = new Set(BICHOS_ATL.map(b => b[0]));
const SPR_BICHO = id => id === 'rato' ? 'bicho_rato2' : 'bicho_' + id; // rato2: a 1ª arte segurava uma bola de futebol americano

/* ---------- itens: equipamentos 200–300, poções, comida, loot ---------- */
Object.assign(ITENS, {
  chuteira_coral: { nome: 'Coral Cleats', tipo: 'equip', slot: 'chuteira', atk: 66, st: { vel: 16, drible: 4 }, lvl: 205, preco: 900000, venda: 180000, desc: 'Attack 66, +16 speed, +4 dribbling.', iconeBase: 'i_chuteira_galaxia', matiz: 150 },
  camisa_coral: { nome: 'Coral Jersey', tipo: 'equip', slot: 'camisa', def: 48, st: { hp: 800, defesa: 3 }, lvl: 205, preco: 950000, venda: 190000, avatar: 'roupa-futebol', cor: '#ff7a5a', cor2: '#3ad0c0', desc: '+800 stamina, +3 defense.', iconeBase: 'i_camisa_galaxia', matiz: 150 },
  caneleira_coral: { nome: 'Coral Shin Guards', tipo: 'equip', slot: 'perna', def: 22, st: { defesa: 5, hp: 300 }, lvl: 208, preco: 800000, venda: 160000, desc: '+5 defense, +300 stamina.', iconeBase: 'i_caneleira_galaxia', matiz: 150 },
  colar_perola: { nome: 'Pearl Necklace', tipo: 'equip', slot: 'acessorio', def: 8, st: { foco: 300, regen: 5 }, lvl: 210, preco: 700000, venda: 140000, avatar: 'pescoco-medalha', desc: '+300 focus, +5 recovery.', iconeBase: 'i_medalha_copa', matiz: 170 },
  chuteira_abissal: { nome: 'Abyssal Cleats', tipo: 'equip', slot: 'chuteira', atk: 76, st: { vel: 18, chute: 5, drible: 5 }, lvl: 240, venda: 320000, desc: 'Attack 76, +18 speed, +5 shooting and dribbling.', iconeBase: 'i_chuteira_galaxia', matiz: 230 },
  camisa_abissal: { nome: 'Abyssal Jersey', tipo: 'equip', slot: 'camisa', def: 56, st: { hp: 1100, defesa: 4 }, lvl: 240, venda: 340000, avatar: 'roupa-futebol', cor: '#1a2a6a', cor2: '#3ae0ff', desc: '+1.100 stamina, +4 defense.', iconeBase: 'i_camisa_galaxia', matiz: 230 },
  caneleira_abissal: { nome: 'Abyssal Shin Guards', tipo: 'equip', slot: 'perna', def: 26, st: { defesa: 6, hp: 420 }, lvl: 244, venda: 300000, desc: '+6 defense, +420 stamina.', iconeBase: 'i_caneleira_galaxia', matiz: 230 },
  chuteira_draconica: { nome: 'Draconic Cleats', tipo: 'equip', slot: 'chuteira', atk: 88, st: { vel: 20, chute: 7, drible: 7 }, lvl: 275, venda: 520000, desc: 'Attack 88, +20 speed, +7 shooting and dribbling.', iconeBase: 'i_chuteira_galaxia', matiz: 300 },
  camisa_draconica: { nome: 'Draconic Jersey', tipo: 'equip', slot: 'camisa', def: 66, st: { hp: 1500, defesa: 5 }, lvl: 275, venda: 560000, avatar: 'roupa-futebol', cor: '#b01a1a', cor2: '#ffcf3a', desc: '+1.500 stamina, +5 defense.', iconeBase: 'i_camisa_galaxia', matiz: 300 },
  caneleira_draconica: { nome: 'Draconic Shin Guards', tipo: 'equip', slot: 'perna', def: 30, st: { defesa: 7, hp: 600 }, lvl: 278, venda: 500000, desc: '+7 defense, +600 stamina.', iconeBase: 'i_caneleira_galaxia', matiz: 300 },
  coroa_dragao: { nome: 'Dragon Crown', tipo: 'equip', slot: 'cabeca', def: 14, st: { hp: 600, drible: 6, chute: 6, visao: 4 }, lvl: 285, venda: 700000, avatar: 'chapeu-coroa', desc: 'From the Elder Dragon\'s head. +600 stamina, +6 dribbling and shooting, +4 vision.', iconeBase: 'i_bola_coroa', matiz: 330 },
  elixir_mar: { nome: 'Sea Elixir', tipo: 'consumivel', efeito: { hp: 6000 }, lvl: 200, preco: 2600, venda: 520, desc: 'Restores 6.000 stamina. Level 200.', icon: { k: 'copo', c: '#3ad0c0' } },
  perola_azul: { nome: 'Blue Pearl', tipo: 'consumivel', efeito: { foco: 3500 }, lvl: 200, preco: 2400, venda: 480, desc: 'Restores 3.500 focus. Level 200.', icon: { k: 'copo', c: '#5a8aff' } },
  bolinho_algas: { nome: 'Seaweed Cake', tipo: 'comida', efeito: { dur: 900, regen: 7, regenFoco: 5, atr: { defesa: 12, habilidade: 12, inteligencia: 12, folego: 12 } }, lvl: 200, preco: 3200, venda: 640, desc: 'From Atlantis: +12 to EVERYTHING and lots of recovery for 15 min.', iconeBase: 'i_folha_magica', matiz: 60 },
});
for (const [id, nome, L, , , , item, nomeItem, descItem] of BICHOS_ATL) ITENS[item] = { nome: nomeItem, tipo: 'loot', venda: Math.round(L * 14 * (id === 'dragao_anciao' ? 6 : 1)), desc: descItem };
const ICONES_ATL = BICHOS_ATL.map(b => 'i_' + b[6]);
const ASSETS_ATL = ['t_areia_mar', 't_pedra_mar', 'b_atl1', 'b_atl2', 'coral_grande', 'alga_alta', 'concha_gigante', 'ancora_bau', 'submarino', 'estatua_netuno', 'coluna_ruina', 'bolhas', 'ent_porao', 'ent_toca', 'ent_toca_deserto',
  ...BICHOS_ATL.map(b => SPR_BICHO(b[0])), ...ICONES_ATL];
ASSETS_ATL.forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });
// ícone "tingido" (equipamentos novos usam a arte de outro item com outra cor)
const ICON_TINGE = new Map();
const _iconeItemAtl = iconeItem;
iconeItem = function (id) {
  const it = ITENS[id]; if (!it || !it.iconeBase || it.mitico) return _iconeItemAtl(id);
  if (ICON_TINGE.has(id)) return ICON_TINGE.get(id);
  const e = spr(it.iconeBase); const c = mkCanvas(96, 96); if (!e.ok) return c;
  const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.filter = `hue-rotate(${it.matiz || 0}deg) saturate(1.3)`;
  const s = Math.min(84 / e.im.width, 84 / e.im.height); const w = e.im.width * s, h = e.im.height * s; x.drawImage(e.im, (96 - w) / 2, (96 - h) / 2, w, h);
  ICON_TINGE.set(id, c); return c;
};

/* ---------- adversários (bichos) ---------- */
const GEAR_TIER = L => L < 232 ? ['chuteira_coral', 'camisa_coral', 'caneleira_coral', 'colar_perola'] : L < 268 ? ['chuteira_abissal', 'camisa_abissal', 'caneleira_abissal'] : ['chuteira_draconica', 'camisa_draconica', 'caneleira_draconica', 'coroa_dragao'];
for (const [id, nome, L, arq, alt, voa, item, , , falas] of BICHOS_ATL) {
  const m = montaMonstro(id, nome, arq, L, { falas, proj: /dragao/.test(id) ? 'bolaforte' : id === 'aranha' ? 'papel' : 'bola' });
  m.look = { tipo: id, spr: SPR_BICHO(id), voa, grande: alt >= 1.3 };
  if (id === 'dragao_anciao') { m.hp = Math.round(m.hp * 1.6); m.xp = Math.round(m.xp * 1.5); m.atk = Math.round(m.atk * 1.1); }
  const g = GEAR_TIER(L);
  m.loot = [[item, 0.3, 1, 2], ['fio_ouro', 0.02, 1, 1], ['elixir_mar', 0.05, 1, 1], [g[(L >> 1) % g.length], id === 'dragao_anciao' ? 0.012 : 0.004, 1, 1]];
  if (id === 'dragao_anciao') m.loot.push(['coroa_dragao', 0.004, 1, 1]);
  ALTURA_BICHO[id] = alt;
}
// retratos (wiki, lista de batalha): desenha a arte do bicho novo
const _desenhaBichoAtl = desenhaBicho;
desenhaBicho = function (x, tipo, px, py, s, a) {
  if (!BICHOS_ATL_ID.has(tipo)) return _desenhaBichoAtl.apply(this, arguments);
  const im = aSprite(SPR_BICHO(tipo)); if (!im) return;
  const h = (ALTURA_BICHO[tipo] || 1) * T * s, w = h * im.width / im.height;
  x.save(); x.translate(px, py); if (a && a.flip === false) x.scale(-1, 1); x.drawImage(im, -w / 2, -h, w, h); x.restore();
};

/* ---------- Atlântida (mapa) ---------- */
const ATL_PORTAIS_X = [8, 20, 46, 58], ATL_PORTAIS_Y = [12, 20, 36, 44];
function criaAtlantida() {
  const W = 72, H = 56; const b = new Construtor('atlantida', 'Atlantis — Sunken City', W, H, CH.AREIA_MAR, 1301); const r = b.r;
  const bordas = ['alga_alta', 'coral_grande', 'coluna_ruina', 'alga_alta'];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) b.obj(x, y, (x + y) % 2 ? 'x' : bordas[(x * 7 + y * 3) % bordas.length]);
  // ruas de pedra: uma embaixo de cada fileira de portais + avenida central + praça
  for (const y of ATL_PORTAIS_Y) b.ret(4, y + 2, 64, 2, CH.PEDRA_MAR);
  b.ret(34, 3, 4, 50, CH.PEDRA_MAR);
  for (let j = -7; j <= 7; j++) for (let i = -7; i <= 7; i++) if (i * i + j * j <= 49) b.chao(36 + i, 29 + j, CH.PEDRA_MAR);
  // pedestal de cada portal (e o chão em volta fica livre de enfeites)
  for (const y of ATL_PORTAIS_Y) for (const x of ATL_PORTAIS_X) b.ret(x - 1, y - 1, 5, 3, CH.PEDRA_MAR);
  // doca do submarino (chegada)
  b.ret(3, 3, 13, 7, CH.PEDRA_MAR); objLargo(b, 7, 6, 'submarino', 3); b.npc('capita_atl', 11, 7);
  b.m.inicio = { x: 10, y: 9 }; b.m.renasce = { x: 10, y: 9 };
  b.placa(14, 8, '🌊 ATLANTIS — down here in the deep, even the CREATURES play soccer! Each of the 16 PORTALS is the field of a creature team (levels 205 to 296). Start with the ones at the top!');
  // praça: estátua, mercador, técnica, quadro
  objLargo(b, 36, 28, 'estatua_netuno', 3);
  b.npc('loja_atl', 31, 32); b.npc('lider_atl', 41, 32); b.npc('quadro', 36, 34);
  b.predio('b_atl1', 24, 25, 5, 3); b.predio('b_atl2', 44, 25, 5, 3);
  // enfeites só na areia (nunca na rua nem nos pedestais)
  b.espalha(['coral_grande', 'alga_alta', 'concha_gigante', 'ancora_bau', 'coluna_ruina', 'alga_alta', 'coral_grande'], 70, 3, 3, W - 6, H - 6, t => t === CH.AREIA_MAR);
  b.espalha(['bolhas'], 14, 3, 3, W - 6, H - 6, t => t === CH.AREIA_MAR);
  b.m.submarino = true;
  return b.m;
}
MAPAS_DEF.atlantida = () => criaAtlantida(); // v288: espaco_novo.js troca o desenho

/* ---------- os 16 portais (áreas de caça) ---------- */
const lkAtl = (pele, cor, extra) => lkGuia(pele, cor, Object.assign({ chapeu: null }, extra || {}));
const DUNGEONS_ATL = [
  ['rato', 'caca_esgotos', 'Sunken Sewers', 'esgoto', 'ent_bueiro', 'Merman Téo', lkAtl('pele-media', '#3ad0c0')],
  ['minhocao', 'caca_dunas', 'Giant Worm Dunes', 'deserto', 'ent_gruta_praia', 'Dona Areia, the explorer', lkAtl('pele-morena', '#e0a030', { corpo: 'f', cabelo: 'cabelo-coque' })],
  ['morcego', 'caca_morcegos', 'Bat Grotto', 'cristal', 'ent_cristal', 'Lantern Lu', lkAtl('pele-clara', '#6a3ad9', { corpo: 'f', cabelo: 'cabelo-rabo' })],
  ['aranha', 'caca_aranha', 'Goalkeeper Spider\'s Cellar', 'catacumba', 'ent_porao', 'Seu Vassoura, the janitor', lkAtl('pele-negra', '#6a6a6a', { corCabelo: 'grisalho' })],
  ['toupeira', 'caca_minas', 'Mole Mines', 'mina', 'ent_toca', 'Miner Zé Picareta', lkAtl('pele-media', '#e0a030', { chapeu: 'chapeu-bone' })],
  ['mumia', 'caca_piramide', 'Lost Pyramid', 'tumba', 'ent_tumba', 'Professor Tutan', lkAtl('pele-morena', '#d8b878', { corCabelo: 'grisalho' })],
  ['tanuki', 'caca_tanukis', 'Tanuki Grove', 'bambu', 'ent_torii', 'Sensei Hana', lkAtl('pele-clara', '#d02a5a', { corpo: 'f', cabelo: 'cabelo-coque', corCabelo: 'preto' })],
  ['escorpiao', 'caca_deserto', 'Red Desert', 'deserto', 'ent_toca_deserto', 'Samir the Bedouin', lkAtl('pele-morena', '#f4f4f0', { corCabelo: 'preto' })],
  ['jacare', 'caca_jacares', 'Alligator Swamp', 'pantano', 'ent_palafita', 'Ranger Kátia', lkAtl('pele-negra', '#3a7a3a', { corpo: 'f', cabelo: 'cabelo-black-power' })],
  ['polvo', 'caca_recife', 'Octopus Reef', 'recife', 'ent_cais', 'Nina the Mermaid', lkAtl('pele-media', '#3ad0c0', { corpo: 'f', cabelo: 'cabelo-rabo', corCabelo: 'ruivo' })],
  ['touro', 'caca_touros', 'Bull Ranch', 'fazenda', 'ent_celeiro', 'Cowboy Chico', lkAtl('pele-clara', '#c0302a', { chapeu: 'chapeu-palha' })],
  ['gargula', 'caca_catedral', 'Gargoyle Cathedral', 'catacumba', 'ent_catacumba', 'Sister Clara', lkAtl('pele-clara', '#2a2a3a', { corpo: 'f', cabelo: 'cabelo-coque' })],
  ['yeti', 'caca_yeti', 'Yeti Cave', 'gelo', 'ent_gelo', 'Climber Bruno', lkAtl('pele-clara', '#d02a2a', { chapeu: 'chapeu-gorro' })],
  ['fantasma', 'caca_fantasma', 'Ghost Stadium', 'tunel', 'ent_tunel', 'Seu Assombrado, the kit manager', lkAtl('pele-clara', '#f4f4f8', { corCabelo: 'grisalho' })],
  ['dragao', 'caca_vulcao', 'Dragon Volcano', 'lava', 'ent_vulcao', 'Rubi the Tamer', lkAtl('pele-morena', '#e05a2a', { corpo: 'f', cabelo: 'cabelo-black-power', corCabelo: 'ruivo' })],
  ['dragao_anciao', 'caca_covil', 'Elder Dragon\'s Lair', 'lava', 'ent_vulcao', 'Master Dragonildo', lkAtl('pele-retinta', '#b01a1a', { corCabelo: 'grisalho' })],
];
DUNGEONS_ATL.forEach(([m, id, nome, tema, ent, guia, look], i) => {
  registraCaca({ id, nome, host: 'atlantida', m, tema, ent, guia, look, seed: 9101 + i * 131, pos: { x: ATL_PORTAIS_X[i % 4], y: ATL_PORTAIS_Y[i >> 2] } });
});
// guias dos portais: cada portal é o campo de um time de bichos
DUNGEONS_ATL.forEach(([m, id]) => { const d = MONSTROS[m]; if (NPCS['guia_' + id]) NPCS['guia_' + id].ola = `Welcome! This is the field of the "${d.nome}" team (level ${nivelMonstro(d)}). These creatures have played soccer for a thousand years and haven't seen an opponent in centuries. Want a mission?`; });
DESAFIOS.atlantida = [['rato', 150], ['minhocao', 150], ['morcego', 150], ['aranha', 150]];

/* ---------- NPCs: submarino, mercador, técnica ---------- */
const LOOK_IARA = { tipo: 'humano', corpo: 'f', alt: 1.72, pele: 'pele-morena', cabelo: 'cabelo-rabo', corCabelo: 'preto', roupa: 'roupa-terno', corRoupa: '#1a3a6a', baixo: 'baixo-jeans', chapeu: 'chapeu-bone' };
Object.assign(NPCS, {
  capita_iara: { nome: 'Captain Iara, of the submarine', submarino: 'descer', look: LOOK_IARA, ola: 'They say that at the bottom of the sea there\'s a lost city where even the CREATURES play soccer! Rats, octopuses, yetis, dragons... Want to see it with your own eyes?' },
  capita_atl: { nome: 'Captain Iara, of the submarine', submarino: 'subir', look: LOOK_IARA, ola: 'The submarine is ready! Whenever you want to go back to the beach, just say so.' },
  loja_atl: { nome: 'Seu Coral, the merchant', loja: ['elixir_mar', 'perola_azul', 'bolinho_algas', 'chuteira_coral', 'camisa_coral', 'caneleira_coral', 'colar_perola'], look: { tipo: 'humano', corpo: 'm', alt: 1.72, pele: 'pele-media', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-xadrez', corRoupa: '#3ad0c0', baixo: 'baixo-shorts' }, ola: 'Welcome to the deep! Sea Elixir, pearls and coral cleats: all fresh!' },
  lider_atl: { nome: 'Queen Marina, Atlantis coach', look: { tipo: 'humano', corpo: 'f', alt: 1.76, pele: 'pele-media', cabelo: 'cabelo-rabo', corCabelo: 'ruivo', roupa: 'roupa-futebol', corRoupa: '#3ad0c0', baixo: 'baixo-saia', chapeu: 'chapeu-coroa' }, ola: 'Did you know that down in the deep the creatures play soccer? Each portal is the field of one of their teams, and nobody has come to play in a thousand years. They\'re dying for a challenge!' },
});
const ATL_NIVEL = 195, ATL_PRECO = 50000;
function modalSubmarino(npc) {
  const s = G.save; const d = npc.d; const desce = d.submarino === 'descer';
  const fecha = el('button', { class: 'btn', onclick: fechaModal }, 'Not now');
  let acao;
  if (desce) {
    const pode = s.nivel >= ATL_NIVEL, tem = s.ouro >= ATL_PRECO;
    acao = el('button', { class: 'btn amarelo', disabled: pode && tem ? null : 'disabled', onclick: () => {
      s.ouro -= ATL_PRECO; fechaModal(); som('porta'); trocaMapa('atlantida', 10.5, 9.5); banner('🌊 Atlantis', 'The lost city at the bottom of the sea');
    } }, !pode ? `🔒 Only from level ${ATL_NIVEL}` : !tem ? `You need ${fmt(ATL_PRECO - s.ouro)} more coins` : `🌊 Dive to Atlantis (${fmt(ATL_PRECO)} coins)`);
  } else {
    acao = el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); som('porta'); getMapa('rio'); const p = ATL_VOLTA || getMapa('rio').inicio; trocaMapa('rio', p.x + 0.5, p.y + 1.5); } }, '🏖️ Back to the Rio beach');
  }
  abreModal(el('h2', {}, d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, d.ola))),
    el('p', { class: 'dica' }, desce ? 'Atlantis has 16 portals to lost worlds, with opponents from level 205 to 296.' : 'The trip back is on the house.'),
    el('div', { class: 'opcoes' }, acao, fecha));
}
const _abrirNPCAtl = abrirNPC;
abrirNPC = function (npc) { if (npc && npc.d && npc.d.submarino) return modalSubmarino(npc); return _abrirNPCAtl.apply(this, arguments); };
if (typeof iconeNPC === 'function') { const _iconeNPCAtl = iconeNPC; iconeNPC = function (n) { const d = n.d || NPCS[n.id] || {}; return d.submarino ? '🌊' : _iconeNPCAtl(n); }; }
// a Capitã Iara e o submarino ficam na praia do Rio, perto da chegada
let ATL_VOLTA = null;
{
  const base = MAPAS_DEF.rio;
  MAPAS_DEF.rio = function () {
    const m = base(); poeNpcPerto(m, 'capita_iara', 'comissaria');
    const n = m.npcs.find(k => k.id === 'capita_iara');
    if (n) { ATL_VOLTA = { x: n.x, y: n.y }; const sx = n.x + 2, sy = n.y; if (!m.veiculosProprios && !m.obj[sy * m.w + sx] && !m.obj[sy * m.w + sx + 1]) { m.obj[sy * m.w + sx] = { t: 'submarino', v: 1 }; m.obj[sy * m.w + sx + 1] = { t: 'x', v: 0 }; } }
    return m;
  };
}

/* ---------- missões da Rainha Marina ---------- */
{
  const xpNivel = x => xpPara(x + 1) - xpPara(x);
  MISSOES.push(
    { id: 'atl_m1', npc: 'lider_atl', titulo: 'Welcome to Atlantis', lvl: 196, texto: 'The portals woke up and the creature teams want to play! Start with the easiest one, the Sunken Sewers team: dribble past 50 Ball Boy Rats.', req: { kill: 'rato', n: 50 }, rec: { xp: Math.round(xpNivel(205) * 1.5), ouro: 400000, itens: [['elixir_mar', 10], ['perola_azul', 5]] }, fim: 'You\'ve got real courage. Atlantis has its eye on you!' },
    { id: 'atl_m2', npc: 'lider_atl', titulo: 'The Pyramid\'s curse', lvl: 228, pre: 'atl_m1', texto: 'In the Lost Pyramid, the Defender Mummies won\'t let anyone through. Beat 60 of them.', req: { kill: 'mumia', n: 60 }, rec: { xp: Math.round(xpNivel(234) * 2), ouro: 700000, itens: [['colar_perola', 1], ['bolinho_algas', 5]] }, fim: 'The wraps fell off and the portal calmed down. Thank you, star!' },
    { id: 'atl_m3', npc: 'lider_atl', titulo: 'The cold of the Yeti Cave', lvl: 268, pre: 'atl_m2', texto: 'The Big Defender Yeti froze the ice portal. Get past 60 of them and bring the warmth of soccer back.', req: { kill: 'yeti', n: 60 }, rec: { xp: Math.round(xpNivel(276) * 2), ouro: 1200000, itens: [['chuteira_abissal', 1]] }, fim: 'Look at that, the ice melted from all your running!' },
    { id: 'atl_m4', npc: 'lider_atl', titulo: 'The Elder Dragon', lvl: 290, pre: 'atl_m3', texto: 'The last portal holds the Elder Dragon, who has played soccer for a thousand years. Beat 30 and you\'ll be the legend of Atlantis!', req: { kill: 'dragao_anciao', n: 30 }, rec: { xp: Math.round(xpNivel(296) * 4), ouro: 3000000, itens: [['coroa_dragao', 1]], flag: 'lenda_atlantida' }, fim: 'LEGEND OF ATLANTIS! The dragons bow when you walk by. And they say that above the clouds there\'s another field waiting...' },
  );
}

/* ---------- Capítulo 7 da história ---------- */
if (typeof CAPITULOS !== 'undefined') {
  CAPITULOS.atlantida = {
    rotulo: 'Chapter 7', titulo: 'Atlantis', emoji: '🌊', implica: ['mundo', 'europa', 'retorno', 'copa'],
    cond: (s, mapa) => mapa === 'atlantida' || /^caca_(esgotos|dunas|morcegos|aranha|minas|piramide|tanukis|deserto|jacares|recife|touros|catedral|yeti|fantasma|vulcao|covil)$/.test(mapa),
    cenas: [
      { img: 'cap_atl_1', kb: 'kb-a', cor: ['#0a3a6a', '#3ad0c0'], txt: n => `After the Cup, ${typeof _hn === 'function' ? _hn(n) : 'the legend'} heard an old story: at the bottom of the sea lies Atlantis, the city where soccer was born.` },
      { img: 'cap_atl_1', kb: 'kb-zoom', foco: '60% 45%', cor: ['#0a3a6a', '#3ad0c0'], txt: n => 'Captain Iara\'s yellow submarine went down, down, down... until the lights of the lost city appeared among the corals.' },
      { img: 'cap_atl_2', kb: 'kb-b', cor: ['#140a40', '#3ad0c0'], txt: n => 'In the town square, Queen Marina told the big secret: a thousand years ago, down in the deep, the CREATURES played soccer too! Rats, mummies, octopuses, yetis and even dragons had their own teams.' },
      { img: 'cap_atl_2', kb: 'kb-zoom', foco: '70% 40%', cor: ['#140a40', '#3ad0c0'], txt: n => 'Each portal leads to the field of one of those teams. When Atlantis sank, the portals closed and the creatures spent a thousand years with no one to challenge. Now they want to play... against you!' },
    ],
    final: { emoji: '🌊', titulo: 'Atlantis', sub: n => 'Chapter 7 has begun! Each portal is the field of a creature team (levels 205 to 296). Beat them all and challenge the dragons\' captain: the Elder Dragon!', botao: 'Dive in! 🌊' },
  };
  const ord = CAPITULOS_ORDEM; const ig = ord.indexOf('gloria'); if (!ord.includes('atlantida')) ord.splice(ig >= 0 ? ig : ord.length, 0, 'atlantida');
}

/* ---------- efeito "debaixo d'água" ---------- */
const _desenhaNoiteAtl = desenhaNoite;
desenhaNoite = function (ctx, cam, vw, vh) {
  const m = G.mapa;
  if (!m || !m.submarino) return _desenhaNoiteAtl.apply(this, arguments);
  ctx.save();
  ctx.fillStyle = 'rgba(20,110,160,0.18)'; ctx.fillRect(cam.x, cam.y, vw, vh);
  // raios de luz que balançam devagar
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const bx = cam.x + ((i * 0.27 + 0.1) % 1) * vw + Math.sin(G.agora / 2600 + i) * 40;
    const g = ctx.createLinearGradient(bx, cam.y, bx + vw * 0.18, cam.y + vh); g.addColorStop(0, 'rgba(180,240,255,0.12)'); g.addColorStop(1, 'rgba(180,240,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx, cam.y); ctx.lineTo(bx + 60, cam.y); ctx.lineTo(bx + vw * 0.18 + 140, cam.y + vh); ctx.lineTo(bx + vw * 0.18, cam.y + vh); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  // bolhinhas subindo
  ctx.fillStyle = 'rgba(220,250,255,0.5)'; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;
  for (let i = 0; i < 22; i++) {
    const per = 7000 + (i * 997) % 5000; const k = ((G.agora + i * 1337) % per) / per;
    const bx = cam.x + ((i * 0.618) % 1) * vw + Math.sin(k * 9 + i) * 8, by = cam.y + vh * (1.05 - k * 1.1), r = 2 + (i % 4);
    ctx.globalAlpha = Math.min(1, (1 - k) * 2) * 0.8; ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
};

/* ---------- forja: itens de nível 200+ pedem materiais de Atlântida ---------- */
if (typeof materialRaroRefino === 'function') {
  const _matAtl = materialRaroRefino;
  materialRaroRefino = function (lvl) { return lvl >= 268 ? 'escama_dragao' : lvl >= 232 ? 'dente_jacare' : lvl >= 200 ? 'novelo_teia' : _matAtl(lvl); };
}
if (typeof trofeuRefino === 'function') {
  const _trofAtl = trofeuRefino;
  trofeuRefino = function (lvl) { return lvl >= 200 && ITENS.trofeu_copa ? 'trofeu_copa' : _trofAtl(lvl); };
}
