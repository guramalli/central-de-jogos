/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — EUROPA (fim de jogo, nível 50 a 100)
   Lisboa, Madri e Londres: adversários fortes, bairros de
   torcida rival (zonas hostis), missões da paz e aeroporto.
   Carregar DEPOIS de game.js.
   ============================================================ */

/* ---------- chão novo ---------- */
CH.CALCADA_PT = 17; CH.PARALELO = 18; CH.TIJOLO = 19;
ESTILO_CHAO[CH.CALCADA_PT] = { cor: '#e8e4dc', borda: '#9a968e', r: 0, e: 0, tex: 'calcada', o: 6.5 };
ESTILO_CHAO[CH.PARALELO] = { cor: '#b8a48a', borda: '#8a7a64', r: 0, e: 0, tex: 'pedra', o: 6.6 };
ESTILO_CHAO[CH.TIJOLO] = { cor: '#b8664a', borda: '#8a4a34', r: 0, e: 0, tex: 'liso', o: 6.7 };
TEX_CHAO[CH.CALCADA_PT] = 't_calcada_pt'; TEX_CHAO[CH.PARALELO] = 't_paralelo'; TEX_CHAO[CH.TIJOLO] = 't_tijolo';
Object.assign(CH_MINI, { 17: '#e8e4dc', 18: '#b8a48a', 19: '#b8664a' });

/* ---------- artes novas ---------- */
const ASSETS_EUROPA = 'b_lisboa1 b_lisboa2 b_madri1 b_madri2 b_londres1 b_londres2 b_aeroporto b_sede bonde cabine onibus2 mesa_cafe chafariz poste3 carrinho_flores grafite grade_torcida lixeira2 banca_jornal bandeirao t_calcada_pt t_paralelo t_tijolo i_chuteira_elite i_chuteira_lenda i_camisa_elite i_camisa_lenda i_caneleira_elite i_cachecol i_passaporte i_contrato i_bola_ouro i_pastel_nata i_churros i_fish_chips i_megafone i_ingresso i_mala i_apito_ouro'.split(' ');
ASSETS_EUROPA.forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });
Object.assign(PORTAS, { b_lisboa1: { x: 0.5, y: 0.9 }, b_lisboa2: { x: 0.5, y: 0.9 }, b_madri1: { x: 0.5, y: 0.9 }, b_madri2: { x: 0.5, y: 0.9 }, b_londres1: { x: 0.5, y: 0.9 }, b_londres2: { x: 0.5, y: 0.9 }, b_aeroporto: { x: 0.5, y: 0.9 }, b_sede: { x: 0.5, y: 0.9 } });
// se o arquivo de portas existir, usa os valores medidos
fetch(ASSET_DIR + '_portas.json').then(r => r.json()).then(j => Object.assign(PORTAS, j)).catch(() => { });

Object.assign(OBJ_INFO, {
  bonde: { w: 2.8, b: 1 }, cabine: { w: 0.85, b: 1 }, onibus2: { w: 3.0, b: 1 }, mesa_cafe: { w: 1.4, b: 1 }, chafariz: { w: 2.2, b: 1 },
  poste3: { w: 0.7, b: 1 }, carrinho_flores: { w: 1.3, b: 1 }, grafite: { w: 1.08, b: 1 }, grade_torcida: { w: 1.1, b: 1 }, lixeira2: { w: 0.6, b: 1 },
  banca_jornal: { w: 1.6, b: 1 }, bandeirao: { w: 2.2, b: 1 },
});
['bonde', 'cabine', 'onibus2', 'mesa_cafe', 'chafariz', 'poste3', 'carrinho_flores', 'grafite', 'grade_torcida', 'lixeira2', 'banca_jornal', 'bandeirao'].forEach(t => OBJ_BLOQUEIA.add(t));
['bonde', 'onibus2', 'grafite', 'cabine', 'banca_jornal', 'bandeirao'].forEach(t => OBJ_VISAO.add(t));
Object.assign(OBJ_MINI, { grafite: '#5a4a6a', grade_torcida: '#8a8a9a', bonde: '#f0c030', onibus2: '#d03a3a', chafariz: '#7ac0e8' });

/* ---------- itens da Europa ---------- */
Object.assign(ITENS, {
  chuteira_elite: { nome: 'Elite Cleats', tipo: 'equip', slot: 'chuteira', atk: 30, st: { vel: 8 }, lvl: 60, preco: 60000, venda: 14000, desc: 'Attack 30, +8 speed.' },
  chuteira_lenda: { nome: 'Platinum Cleats', tipo: 'equip', slot: 'chuteira', atk: 36, st: { vel: 12, chute: 4, drible: 2 }, lvl: 80, venda: 60000, raro: true, desc: 'LEGENDARY. Attack 36, +12 speed, +4 shooting, +2 dribbling.' },
  camisa_elite: { nome: 'Elite Jersey', tipo: 'equip', slot: 'camisa', def: 24, st: { hp: 200 }, lvl: 60, preco: 65000, venda: 15000, avatar: 'roupa-futebol', desc: '+200 stamina.', cor: '#f4f4f8', cor2: '#1a2a5a' },
  camisa_lenda: { nome: 'Black and Gold Jersey', tipo: 'equip', slot: 'camisa', def: 30, st: { hp: 320, drible: 2, chute: 2, visao: 2 }, lvl: 80, venda: 70000, raro: true, avatar: 'roupa-futebol', desc: 'LEGENDARY. +320 stamina and +2 to everything.', cor: '#1a1a1a', cor2: '#e8b848' },
  caneleira_elite: { nome: 'Elite Shin Guards', tipo: 'equip', slot: 'perna', def: 11, st: { defesa: 2, hp: 60 }, lvl: 65, preco: 45000, venda: 11000, desc: '+2 defense, +60 stamina.', cor: '#c8c8d8' },
  cachecol: { nome: 'Peace Scarf', tipo: 'equip', slot: 'acessorio', def: 4, st: { foco: 160, regen: 3, visao: 2 }, lvl: 55, venda: 9000, avatar: 'pescoco-cachecol', desc: 'A gift from the community leaders. +160 focus, +3 recovery, +2 vision.' },
  apito_ouro: { nome: 'Golden Whistle', tipo: 'equip', slot: 'acessorio', def: 6, st: { hp: 220, foco: 120, regen: 3 }, lvl: 75, venda: 25000, raro: true, avatar: 'pescoco-apito', desc: 'LEGENDARY. +220 stamina, +120 focus, +3 recovery.' },
  bola_ouro: { nome: 'Ballon d’Or', tipo: 'chave', desc: 'The greatest prize in world soccer. You are a LEGEND.' },
  passaporte: { nome: 'Passport', tipo: 'chave', desc: 'Cleared to fly to Europe.' },
  pastel_nata: { nome: 'Pastel de Nata', tipo: 'comida', efeito: { dur: 600, regen: 3, atr: { inteligencia: 8 } }, lvl: 50, preco: 400, venda: 80, desc: 'A Lisbon treat: +Intelligence and recovery for 10 min.' },
  churros: { nome: 'Churros', tipo: 'comida', efeito: { dur: 600, regenFoco: 4, atr: { habilidade: 8 } }, lvl: 65, preco: 700, venda: 140, desc: 'From Madrid: +Skill and focus for 10 min.' },
  fish_chips: { nome: 'Fish and Chips', tipo: 'comida', efeito: { dur: 900, regen: 4, atr: { folego: 8, defesa: 8 } }, lvl: 80, preco: 1200, venda: 240, desc: 'From London: +Stamina, +Defense and recovery for 15 min.' },
  megafone: { nome: 'Megaphone', tipo: 'loot', venda: 450, desc: 'Taken from a rowdy fan. No shouting!' },
  ingresso: { nome: 'Premium Ticket', tipo: 'loot', venda: 380, desc: 'Worth a lot of money.' },
});

/* ---------- adversários ---------- */
const GRUPO_ULTRA = 'ultra';
Object.assign(MONSTROS, {
  // Lisboa (50-65)
  ponta_alfama: { nome: 'Alfama Tram', hp: 2600, atk: 170, def: 60, xp: 2300, vel: 330, aggro: 5, atkCd: 1700, ouro: [120, 260], loot: [['couro', 0.3, 1, 2], ['pastel_nata', 0.06, 1, 1], ['ingresso', 0.05, 1, 1], ['chuteira_elite', 0.002, 1, 1]], falas: ['Down the line!', 'Nobody can catch me!'], look: {} },
  medio_chiado: { nome: 'Chiado Poet', hp: 2800, atk: 165, def: 62, xp: 2500, vel: 250, aggro: 6, atkCd: 2000, ranged: { alcance: 5, dano: 160, cd: 2400, proj: 'bola' }, ouro: [130, 280], loot: [['couro', 0.3, 1, 2], ['fio_ouro', 0.02, 1, 1], ['pastel_nata', 0.05, 1, 1]], falas: ['Long ball!', 'Check out this pass!'], look: {} },
  central_belem: { nome: 'Belém Navigator', hp: 3400, atk: 185, def: 75, xp: 2800, vel: 230, aggro: 5, atkCd: 2000, ouro: [150, 300], loot: [['couro', 0.35, 1, 2], ['caneleira_elite', 0.003, 1, 1]], falas: ['You shall not pass!', 'Belém Wall!'], look: {} },
  ultra_lisboa: { nome: 'Rowdy Claque Fan', hp: 2200, atk: 150, def: 50, xp: 2100, vel: 280, aggro: 7, atkCd: 1800, grupo: GRUPO_ULTRA, ranged: { alcance: 5, dano: 140, cd: 2600, proj: 'papel' }, ouro: [100, 220], loot: [['megafone', 0.06, 1, 1], ['retalho', 0.4, 1, 3]], falas: ['Ooooh! Boo!', 'This neighborhood is ours!', 'Get out, outsider!'], look: {} },
  capitao_tejo: { nome: 'The Captain of the Tagus', hp: 90000, atk: 300, def: 85, xp: 120000, vel: 260, aggro: 2, atkCd: 1500, chefe: true, respawn: 600000, ranged: { alcance: 5, dano: 250, cd: 2600, proj: 'bolaforte' }, ouro: [15000, 22000], loot: [['fio_ouro', 1, 2, 3], ['chuteira_elite', 0.35, 1, 1], ['camisa_elite', 0.35, 1, 1], ['apito_ouro', 0.08, 1, 1]], falas: ['The Tagus is mine!', 'Show what Brazil\'s got!'], look: {} },
  // Madri (65-80)
  extremo_madri: { nome: 'Speedy Flamenco', hp: 4200, atk: 220, def: 80, xp: 3800, vel: 340, aggro: 5, atkCd: 1700, ouro: [200, 380], loot: [['couro', 0.35, 1, 2], ['churros', 0.06, 1, 1], ['ingresso', 0.06, 1, 1]], falas: ['¡Olé!', 'Too fast for you!'], look: {} },
  pivote_madri: { nome: 'Maestro Pivot', hp: 4500, atk: 215, def: 82, xp: 4100, vel: 250, aggro: 6, atkCd: 2000, ranged: { alcance: 5, dano: 205, cd: 2400, proj: 'bola' }, ouro: [220, 400], loot: [['fio_ouro', 0.03, 1, 1], ['churros', 0.06, 1, 1], ['camisa_elite', 0.003, 1, 1]], falas: ['Toco y me voy!', 'Great vision!'], look: {} },
  zagueiro_toureiro: { nome: 'Bullfighter Defender', hp: 5400, atk: 250, def: 100, xp: 4600, vel: 230, aggro: 5, atkCd: 2000, ouro: [240, 420], loot: [['couro', 0.4, 1, 3], ['caneleira_elite', 0.004, 1, 1]], falas: ['¡Toro!', 'Come on, I\'ll stop you!'], look: {} },
  ultra_madri: { nome: 'Rival Neighborhood Rowdy Fan', hp: 3600, atk: 200, def: 70, xp: 3500, vel: 290, aggro: 7, atkCd: 1800, grupo: GRUPO_ULTRA, ranged: { alcance: 5, dano: 185, cd: 2600, proj: 'copo' }, ouro: [180, 340], loot: [['megafone', 0.07, 1, 1], ['retalho', 0.4, 2, 4]], falas: ['¡Fuera!', 'Ooooh!', 'The fans are in charge here!'], look: {} },
  galactico: { nome: 'The Galáctico', hp: 160000, atk: 380, def: 105, xp: 250000, vel: 270, aggro: 2, atkCd: 1500, chefe: true, respawn: 720000, ranged: { alcance: 5, dano: 320, cd: 2600, proj: 'bolaforte' }, ouro: [30000, 40000], loot: [['fio_ouro', 1, 3, 4], ['chuteira_lenda', 0.12, 1, 1], ['camisa_elite', 0.4, 1, 1], ['apito_ouro', 0.15, 1, 1]], falas: ['I\'m from another galaxy!', 'Autograph? Later.'], look: {} },
  // Londres (80-100)
  ponta_camden: { nome: 'Camden Rocker', hp: 6200, atk: 280, def: 105, xp: 5600, vel: 340, aggro: 5, atkCd: 1700, ouro: [320, 560], loot: [['couro', 0.4, 2, 3], ['fish_chips', 0.05, 1, 1], ['ingresso', 0.08, 1, 1]], falas: ['Mind the gap!', 'Too fast!'], look: {} },
  box2box: { nome: 'Thames Box-to-Box', hp: 7000, atk: 300, def: 115, xp: 6200, vel: 270, aggro: 6, atkCd: 1900, ranged: { alcance: 5, dano: 280, cd: 2400, proj: 'bola' }, ouro: [340, 600], loot: [['fio_ouro', 0.04, 1, 1], ['fish_chips', 0.05, 1, 1], ['chuteira_lenda', 0.001, 1, 1]], falas: ['Box to box!', 'I never stop!'], look: {} },
  zagueiro_ferro: { nome: 'Tower Guard', hp: 8200, atk: 330, def: 135, xp: 7000, vel: 230, aggro: 5, atkCd: 2000, ouro: [360, 640], loot: [['couro', 0.5, 2, 3], ['camisa_lenda', 0.001, 1, 1]], falas: ['Solid as a rock!', 'Not today!'], look: {} },
  fanatico_eastend: { nome: 'East End Rowdy Fan', hp: 5600, atk: 270, def: 95, xp: 5400, vel: 290, aggro: 7, atkCd: 1800, grupo: GRUPO_ULTRA, ranged: { alcance: 5, dano: 250, cd: 2600, proj: 'papel' }, ouro: [300, 520], loot: [['megafone', 0.08, 1, 1], ['retalho', 0.5, 2, 4]], falas: ['Booo!', 'Get out of here!', 'Our street!'], look: {} },
  lorde: { nome: 'The Lord of Soccer', hp: 280000, atk: 460, def: 130, xp: 500000, vel: 270, aggro: 2, atkCd: 1400, chefe: true, respawn: 900000, ranged: { alcance: 5, dano: 400, cd: 2400, proj: 'bolaforte' }, ouro: [60000, 80000], loot: [['fio_ouro', 1, 4, 6], ['camisa_lenda', 0.3, 1, 1], ['chuteira_lenda', 0.3, 1, 1]], falas: ['God save the ball!', 'A Brazilian? Interesting.'], look: {} },
});
const APAR_EUROPA = {
  ponta_alfama: { pele: 'pele-clara', cabelo: 'cabelo-topete', corCabelo: 'castanho', roupa: 'roupa-futebol', corRoupa: '#1a8a4a', baixo: 'baixo-shorts', alt: 1.7 },
  medio_chiado: { corpo: 'm', pele: 'pele-media', cabelo: 'cabelo-liso-longo', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#1a8a4a', baixo: 'baixo-shorts', alt: 1.68 },
  central_belem: { pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#0a6a3a', baixo: 'baixo-shorts', alt: 1.76 },
  ultra_lisboa: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'castanho', roupa: 'roupa-moletom', corRoupa: '#1a8a4a', baixo: 'baixo-jeans', chapeu: 'chapeu-gorro', pescoco: 'pescoco-cachecol', rosto: 'rosto-pintura', alt: 1.7 },
  capitao_tejo: { pele: 'pele-morena', cabelo: 'cabelo-moicano', roupa: 'roupa-futebol', corRoupa: '#e0203a', baixo: 'baixo-shorts', chapeu: 'chapeu-faixa', alt: 1.72 },
  extremo_madri: { pele: 'pele-media', cabelo: 'cabelo-anime', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#f4f4f8', baixo: 'baixo-shorts', alt: 1.7 },
  pivote_madri: { pele: 'pele-clara', cabelo: 'cabelo-coque', corCabelo: 'castanho', corpo: 'm', roupa: 'roupa-futebol', corRoupa: '#f4f4f8', baixo: 'baixo-shorts', alt: 1.68 },
  zagueiro_toureiro: { pele: 'pele-morena', cabelo: 'cabelo-black-power', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#c01a2a', baixo: 'baixo-shorts', alt: 1.78 },
  ultra_madri: { pele: 'pele-media', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-moletom', corRoupa: '#c01a2a', baixo: 'baixo-jeans', chapeu: 'chapeu-bone', pescoco: 'pescoco-cachecol', rosto: 'rosto-pintura', alt: 1.7 },
  galactico: { pele: 'pele-clara', cabelo: 'cabelo-anime-ouro', roupa: 'roupa-camisa10-ouro', baixo: 'baixo-shorts', chapeu: 'chapeu-louros', rosto: 'rosto-estrela', alt: 1.72 },
  ponta_camden: { corpo: 'f', pele: 'pele-negra', cabelo: 'cabelo-rabo-rosa', roupa: 'roupa-futebol', corRoupa: '#1a3ab9', baixo: 'baixo-shorts', alt: 1.66 },
  box2box: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'ruivo', roupa: 'roupa-futebol', corRoupa: '#1a3ab9', baixo: 'baixo-shorts', alt: 1.74 },
  zagueiro_ferro: { pele: 'pele-retinta', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#5a5a6a', baixo: 'baixo-shorts', alt: 1.8 },
  fanatico_eastend: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'loiro', roupa: 'roupa-couro', baixo: 'baixo-jeans', chapeu: 'chapeu-gorro', pescoco: 'pescoco-cachecol', rosto: 'rosto-pintura', alt: 1.72 },
  lorde: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-smoking-ouro', baixo: 'baixo-shorts', chapeu: 'chapeu-cartola', rosto: 'rosto-monoculo', mao: 'mao-estatueta-ouro', alt: 1.74 },
};
for (const k in APAR_EUROPA) MONSTROS[k].look = Object.assign({ tipo: 'humano', corpo: 'm', grande: !!MONSTROS[k].chefe }, APAR_EUROPA[k]);

/* ---------- NPCs ---------- */
const NPCS_EUROPA = {
  comissaria: { nome: 'Flight Attendant Luana', ola: 'Welcome to the check-in counter! Where are we flying today?', aviao: true, look: { corpo: 'f', pele: 'pele-morena', cabelo: 'cabelo-coque', corCabelo: 'preto', roupa: 'roupa-terno', corRoupa: '#1a3a8a', baixo: 'baixo-saia', pescoco: 'pescoco-gravata', alt: 1.72 } },
  lojista_lisboa: { nome: 'Dona Amália from the Pastry Shop', ola: 'Olá, little one! Pastéis de nata fresh out of the oven!', loja: ['pastel_nata', 'agua_coco', 'vitamina', 'chuteira_elite', 'camisa_elite', 'caneleira_elite'], look: { corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-coque', corCabelo: 'grisalho', roupa: 'roupa-xadrez', baixo: 'baixo-saia', alt: 1.66 } },
  lojista_madri: { nome: 'Don Paco from the Churro Stand', ola: '¡Hola! Churros with chocolate for the Brazilian star!', loja: ['churros', 'pastel_nata', 'agua_coco', 'vitamina', 'chuteira_elite', 'camisa_elite', 'caneleira_elite'], look: { pele: 'pele-media', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-regata', baixo: 'baixo-jeans', chapeu: 'chapeu-panama', alt: 1.72 } },
  lojista_londres: { nome: 'Mr. Wallace from the Fish & Chips Shop', ola: 'Good evening! Some fish and chips to beat the cold?', loja: ['fish_chips', 'churros', 'pastel_nata', 'agua_coco', 'vitamina', 'chuteira_elite', 'camisa_elite', 'caneleira_elite'], look: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'ruivo', roupa: 'roupa-terno', baixo: 'baixo-jeans', chapeu: 'chapeu-cartola', alt: 1.74 } },
  lider_lisboa: { nome: 'Dona Fátima, neighborhood leader', ola: 'The neighborhood Claque has been scaring families. Cheering is a party, not a fight!', look: { corpo: 'f', pele: 'pele-negra', cabelo: 'cabelo-black-power', corCabelo: 'grisalho', roupa: 'roupa-camiseta', corRoupa: '#1a8a4a', baixo: 'baixo-jeans', pescoco: 'pescoco-cachecol', alt: 1.7 } },
  lider_madri: { nome: 'Carmen, neighborhood teacher', ola: 'The rowdy fans here confuse passion with bullying. Will you help me change that?', look: { corpo: 'f', pele: 'pele-media', cabelo: 'cabelo-liso-longo', corCabelo: 'castanho', roupa: 'roupa-jaleco', baixo: 'baixo-jeans', rosto: 'rosto-redondos', mao: 'mao-livro', alt: 1.7 } },
  lider_londres: { nome: 'Oliver, community coach', ola: 'In the East End everyone loves soccer. We just need to remember that a rival isn\'t an enemy.', look: { pele: 'pele-retinta', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-moletom', corRoupa: '#3a3a4a', baixo: 'baixo-moletom', pescoco: 'pescoco-apito', alt: 1.76 } },
};
for (const k in NPCS_EUROPA) { NPCS[k] = NPCS_EUROPA[k]; NPCS[k].look = Object.assign({ tipo: 'humano', corpo: 'm' }, NPCS[k].look); }

/* ---------- missões ---------- */
MISSOES.push(
  // Lisboa
  { id: 'l_pontas', npc: 'lojista_lisboa', titulo: 'Welcome to Lisbon', lvl: 50, texto: 'The Alfama Trams run faster than the streetcar! Show them Brazil can run too: get past 30 of them.', req: { kill: 'ponta_alfama', n: 30 }, rec: { xp: 150000, ouro: 8000, itens: [['pastel_nata', 5]] }, fim: 'Magnificent! Now Lisbon knows your name.' },
  { id: 'l_paz', npc: 'lider_lisboa', titulo: 'Peace Mission: the Claque', lvl: 52, texto: 'Enter the Claque Neighborhood and beat 25 rowdy fans by playing fair, no fighting. Once they see that respect is earned by playing, they\'ll calm down.', req: { kill: 'ultra_lisboa', n: 25 }, rec: { xp: 180000, ouro: 9000, itens: [['cachecol', 1]], evento: 'paz' }, fim: 'They stopped booing and asked for a photo! Here\'s the Peace Scarf: cheering is a party, never violence.' },
  { id: 'l_centrais', npc: 'lojista_lisboa', titulo: 'Belém Wall', lvl: 55, pre: 'l_pontas', texto: 'The Belém Navigators don\'t let anyone through. Beat 30.', req: { kill: 'central_belem', n: 30 }, rec: { xp: 220000, ouro: 12000, itens: [['caneleira_elite', 1]] }, fim: 'Elite Shin Guards for you!' },
  { id: 'l_chefe', npc: 'lider_lisboa', titulo: 'The Captain of the Tagus', lvl: 60, pre: 'l_paz', texto: 'THE CAPTAIN OF THE TAGUS rules the docks, to the south. If you win, the whole neighborhood will respect you.', req: { kill: 'capitao_tejo', n: 1 }, rec: { xp: 400000, ouro: 30000, flag: 'venceu_lisboa' }, fim: 'Lisbon is yours! Madrid already has its eye on you.' },
  // Madri
  { id: 'm_extremos', npc: 'lojista_madri', titulo: '¡Bienvenido a Madrid!', lvl: 65, texto: 'The Speedy Flamencos race around the Plaza. Get past 35.', req: { kill: 'extremo_madri', n: 35 }, rec: { xp: 380000, ouro: 20000, itens: [['churros', 5]] }, fim: '¡Qué crack! Madrid is amazed by your soccer.' },
  { id: 'm_paz', npc: 'lider_madri', titulo: 'Peace Mission: Rival Neighborhood', lvl: 67, texto: 'The rowdy fans of the Rival Neighborhood bully everyone who walks by. Beat 30 by playing fair and show that rivalry belongs on the field.', req: { kill: 'ultra_madri', n: 30 }, rec: { xp: 420000, ouro: 22000, itens: [['megafone', 1]], evento: 'paz' }, fim: 'Today they sang instead of booing. That\'s how you cheer!' },
  { id: 'm_toureiros', npc: 'lojista_madri', titulo: 'Olé!', lvl: 70, pre: 'm_extremos', texto: 'The Bullfighter Defenders charge like bulls. Dribble past 35 of them with style.', req: { kill: 'zagueiro_toureiro', n: 35 }, rec: { xp: 520000, ouro: 28000, itens: [['apito_ouro', 1]] }, fim: '¡Olé, olé! Here\'s the Golden Whistle.' },
  { id: 'm_chefe', npc: 'lider_madri', titulo: 'The Galáctico', lvl: 75, pre: 'm_paz', texto: 'THE CASTLE LORD trains at Campo del Barrio, to the east. He thinks nobody is on his level.', req: { kill: 'galactico', n: 1 }, rec: { xp: 900000, ouro: 60000, flag: 'venceu_madri' }, fim: 'You\'re from another planet! London is waiting for you.' },
  // Londres
  { id: 'o_pontas', npc: 'lojista_londres', titulo: 'Welcome to London', lvl: 80, texto: 'The Camden Rockers are as fast as the Tube. Get past 40.', req: { kill: 'ponta_camden', n: 40 }, rec: { xp: 900000, ouro: 50000, itens: [['fish_chips', 5]] }, fim: 'Brilliant! A Brazilian taking over London.' },
  { id: 'o_paz', npc: 'lider_londres', titulo: 'Peace Mission: East End', lvl: 82, texto: 'The East End rowdy fans need to remember that a rival isn\'t an enemy. Beat 35 by playing fair, and then we\'ll set up a peace match.', req: { kill: 'fanatico_eastend', n: 35 }, rec: { xp: 1000000, ouro: 55000, evento: 'paz' }, fim: 'The whole East End played together today. That\'s worth more than any trophy.' },
  { id: 'o_ferro', npc: 'lojista_londres', titulo: 'Iron Defense', lvl: 86, pre: 'o_pontas', texto: 'The Tower Guards are the toughest defense in the world. Beat 40.', req: { kill: 'zagueiro_ferro', n: 40 }, rec: { xp: 1400000, ouro: 70000, itens: [['camisa_lenda', 1]] }, fim: 'The Black and Gold Jersey is yours.' },
  { id: 'o_lorde', npc: 'lider_londres', titulo: 'The Ballon d’Or', lvl: 90, pre: 'o_paz', texto: 'THE LORD OF SOCCER keeps the Ballon d’Or in London’s great stadium. Only a legend can take it from him.', req: { kill: 'lorde', n: 1 }, rec: { xp: 3000000, ouro: 200000, flag: 'lenda_mundial', itens: [['bola_ouro', 1]] }, fim: 'GILDED BALL! From Campinho Village to the world: you are a WORLD LEGEND!' },
);

/* ---------- viagens de avião ---------- */
const VOOS = {
  cidade: { nome: 'Brazil (City)', lvl: 1, preco: 1500 },
  lisboa: { nome: 'Lisbon, Portugal', lvl: 50, preco: 2500 },
  madri: { nome: 'Madrid, Spain', lvl: 65, preco: 4000 },
  londres: { nome: 'London, England', lvl: 80, preco: 6000 },
};
function modalVoo(npc) {
  const s = G.save; const lista = el('div', { class: 'lista' });
  for (const [id, v] of Object.entries(VOOS)) {
    if (id === G.mapa.id) continue;
    let ok = s.nivel >= v.lvl, motivo = ok ? '' : `Requires level ${v.lvl}`;
    if (ok && id !== 'cidade' && typeof podeViajar === 'function') { const r = podeViajar(id); if (!r.ok) { ok = false; motivo = r.motivo; } }
    lista.append(el('div', { class: 'linha-item' + (ok ? '' : ' bloq') }, el('div', { class: 'nm' }, el('b', {}, '✈️ ' + v.nome), el('small', {}, (ok ? 'Boarding cleared' : motivo) + (typeof previsaoTxt === 'function' ? previsaoTxt(id) : ''))), precoTag(v.preco),
      el('button', { class: 'btn amarelo mini', disabled: ok ? null : 'disabled', onclick: () => {
        if (s.ouro < v.preco) { log('Not enough coins for the ticket.', 'l-dano'); som('erro'); return; }
        s.ouro -= v.preco; fechaModal(); const m = getMapa(id); trocaMapa(id, m.inicio.x + 0.5, m.inicio.y + 0.5); som('apito');
        if (id !== 'cidade') banner(m.nome, 'Welcome to Europe!');
      } }, 'Fly')));
  }
  abreModal(el('h2', {}, '✈️ Airport'), el('p', {}, 'In Europe the opponents are MUCH stronger. To play there you need a high enough level and a contract with a club in that country (talk to Rodrigues the Agent) — or enough fame to get invited.'), lista);
}

/* ---------- construção das cidades ---------- */
function bordaInvisivel(b) { const { w, h } = b.m; for (let x = 0; x < w; x++) { b.obj(x, 0, 'x'); b.obj(x, h - 1, 'x'); } for (let y = 0; y < h; y++) { b.obj(0, y, 'x'); b.obj(w - 1, y, 'x'); } }
function objLargo(b, x, y, tipo, largura) { // objeto largo: bloqueia os tiles vizinhos também
  b.obj(x, y, tipo); const meia = Math.floor(largura / 2);
  for (let i = 1; i <= meia; i++) { if (b.livre(x - i, y)) b.obj(x - i, y, 'x'); if (b.livre(x + i, y)) b.obj(x + i, y, 'x'); }
}
function bairroHostil(b, x, y, w, h, nome, monstro, qtd) {
  b.ret(x, y, w, h, CH.CONCRETO);
  const gx = x + Math.floor(w / 2), gy = y + Math.floor(h / 2);
  for (let i = x; i < x + w; i++) { if (Math.abs(i - gx) > 1) { b.obj(i, y + h - 1, 'grafite'); } }
  for (let j = y; j < y + h; j++) { if (Math.abs(j - gy) > 1) b.obj(x, j, 'grafite'); }
  b.obj(gx - 3, y + 2, 'bandeirao'); b.obj(gx + 3, y + 2, 'bandeirao');
  b.espalha(['grade_torcida', 'lixeira2'], 6, x + 1, y + 1, w - 2, h - 2);
  b.spawn(monstro, gx, gy - 1, qtd, Math.min(w, h) / 2 - 1 | 0);
  (b.m.zonas = b.m.zonas || []).push({ x, y, w, h, nome, hostil: true });
}
function mapaLisboa() {
  const b = new Construtor('lisboa', 'Lisbon — Bairro Alto', 52, 40, CH.CALCADA_PT, 606);
  bordaInvisivel(b);
  b.ret(1, 35, 50, 4, CH.AGUA); b.ret(1, 33, 50, 2, CH.PEDRA);
  b.ret(1, 16, 50, 2, CH.PARALELO); b.ret(12, 1, 2, 32, CH.PARALELO); b.ret(34, 1, 2, 32, CH.PARALELO);
  b.predio('b_aeroporto', 2, 27, 8, 4); b.npc('comissaria', 6, 32);
  b.m.inicio = { x: 8, y: 32 }; b.m.renasce = { x: 9, y: 32 };
  b.predio('b_lisboa1', 1, 1, 5, 3); b.predio('b_lisboa2', 6, 1, 5, 3); b.predio('b_lisboa1', 15, 1, 5, 3); b.predio('b_lisboa2', 21, 1, 5, 3); b.predio('b_lisboa1', 27, 1, 5, 3);
  b.predio('b_lisboa2', 1, 10, 5, 3); b.predio('b_lisboa1', 6, 10, 5, 3); b.predio('b_lisboa2', 15, 10, 5, 3); b.predio('b_lisboa1', 24, 10, 5, 3);
  b.npc('lojista_lisboa', 17, 14); b.obj(19, 14, 'mesa_cafe'); b.obj(21, 14, 'mesa_cafe'); b.obj(15, 14, 'carrinho_flores');
  objLargo(b, 5, 17, 'bonde', 3);
  b.campo(16, 20, 17, 10, CH.CAMPO);
  b.spawn('central_belem', 24, 24, 4, 4); b.spawn('medio_chiado', 20, 22, 3, 3); b.spawn('medio_chiado', 29, 27, 2, 2);
  b.spawn('ponta_alfama', 8, 22, 5, 4); b.spawn('ponta_alfama', 42, 24, 5, 5); b.spawn('ponta_alfama', 24, 7, 3, 3);
  bairroHostil(b, 37, 1, 14, 14, 'Superfans\' District', 'ultra_lisboa', 8);
  b.npc('lider_lisboa', 41, 17); b.placa(39, 17, 'SUPERFANS\' DISTRICT — watch out: the fanatics move in groups');
  b.spawn('capitao_tejo', 46, 33, 1, 1); b.placa(43, 32, 'TAGUS DOCKS — the Captain\'s turf');
  objLargo(b, 44, 21, 'chafariz', 3);
  b.npc('quadro', 11, 18);
  for (let x = 4; x < 50; x += 7) { if (b.livre(x, 15)) b.obj(x, 15, 'poste3'); if (b.livre(x, 18)) b.obj(x, 18, 'poste3'); }
  b.espalha(['banca_jornal', 'lixeira2', 'cabine'], 3, 2, 19, 12, 12);
  b.espalha(['arvore', 'vaso', 'lixeira2'], 10, 2, 19, 48, 13);
  return b.m;
}
function mapaMadri() {
  const b = new Construtor('madri', 'Madrid — Plaza and Barrio', 52, 40, CH.PARALELO, 707);
  bordaInvisivel(b);
  b.ret(18, 12, 16, 12, CH.CALCADA_PT);
  objLargo(b, 25, 18, 'chafariz', 3);
  b.predio('b_madri1', 18, 7, 6, 4); b.predio('b_madri1', 27, 7, 6, 4); b.predio('b_madri2', 12, 14, 5, 3); b.predio('b_madri2', 35, 14, 5, 3);
  b.predio('b_madri2', 18, 25, 6, 3); b.predio('b_madri1', 26, 25, 6, 4);
  b.predio('b_aeroporto', 2, 31, 8, 4); b.npc('comissaria', 6, 36);
  b.m.inicio = { x: 8, y: 36 }; b.m.renasce = { x: 9, y: 36 };
  b.npc('lojista_madri', 30, 21); b.obj(31, 20, 'mesa_cafe'); b.obj(20, 21, 'mesa_cafe'); b.obj(22, 13, 'carrinho_flores');
  b.campo(36, 24, 15, 11, CH.CAMPO);
  b.spawn('galactico', 47, 29, 1, 1); b.spawn('zagueiro_toureiro', 42, 29, 4, 4);
  b.spawn('extremo_madri', 22, 30, 5, 4); b.spawn('extremo_madri', 44, 8, 5, 5); b.spawn('pivote_madri', 10, 22, 5, 4); b.spawn('pivote_madri', 26, 16, 3, 3);
  bairroHostil(b, 1, 1, 14, 12, 'Rival District', 'ultra_madri', 9);
  b.npc('lider_madri', 8, 14); b.placa(10, 14, 'RIVAL NEIGHBORHOOD — rivalry belongs on the field');
  b.npc('quadro', 17, 21);
  for (let x = 19; x < 34; x += 5) { if (b.livre(x, 12)) b.obj(x, 12, 'poste3'); if (b.livre(x, 23)) b.obj(x, 23, 'poste3'); }
  b.espalha(['arvore', 'vaso', 'lixeira2', 'banca_jornal'], 14, 1, 13, 50, 25);
  return b.m;
}
function mapaLondres() {
  const b = new Construtor('londres', 'London — Camden and East End', 52, 40, CH.TIJOLO, 808);
  bordaInvisivel(b);
  b.ret(1, 18, 50, 3, CH.ASFALTO); b.ret(24, 1, 3, 38, CH.ASFALTO);
  b.predio('b_londres1', 1, 1, 5, 3); b.predio('b_londres1', 6, 1, 5, 3); b.predio('b_londres1', 11, 1, 5, 3); b.predio('b_londres1', 16, 1, 5, 3);
  b.predio('b_londres2', 28, 1, 6, 3); b.predio('b_londres1', 35, 1, 5, 3); b.predio('b_londres1', 41, 1, 5, 3);
  b.npc('lojista_londres', 30, 5); b.obj(32, 5, 'mesa_cafe');
  b.ret(1, 22, 22, 10, CH.GRAMA); b.espalha(['arvore', 'arvore', 'arbusto'], 16, 1, 22, 22, 10, FILTRO_GRAMA); b.ret(8, 25, 5, 3, CH.AGUA);
  b.spawn('ponta_camden', 12, 27, 6, 5); b.spawn('ponta_camden', 12, 10, 5, 4); b.spawn('box2box', 38, 22, 4, 3);
  b.campo(28, 24, 21, 12, CH.CAMPO);
  for (let x = 27; x <= 49; x++) if (b.livre(x, 37)) b.obj(x, 37, 'arquibancada');
  b.spawn('lorde', 45, 30, 1, 1); b.spawn('zagueiro_ferro', 37, 30, 5, 4); b.spawn('box2box', 33, 27, 3, 3);
  bairroHostil(b, 34, 6, 17, 11, 'East End', 'fanatico_eastend', 9);
  b.npc('lider_londres', 32, 12); b.placa(32, 14, 'EAST END — a rival isn\'t an enemy');
  b.predio('b_aeroporto', 2, 33, 8, 4); b.npc('comissaria', 6, 38);
  b.m.inicio = { x: 8, y: 38 }; b.m.renasce = { x: 9, y: 38 };
  objLargo(b, 10, 19, 'onibus2', 3); b.obj(22, 17, 'cabine'); b.obj(27, 21, 'cabine');
  b.npc('quadro', 22, 21);
  for (let x = 3; x < 50; x += 6) { if (b.livre(x, 17)) b.obj(x, 17, 'poste3'); if (b.livre(x, 21)) b.obj(x, 21, 'poste3'); }
  b.espalha(['lixeira2', 'banca_jornal', 'cabine'], 6, 1, 5, 22, 12);
  return b.m;
}
Object.assign(MAPAS_DEF, { lisboa: () => mapaLisboa(), /* v272: cidades_novas.js troca o desenho */ madri: () => mapaMadri(), londres: () => mapaLondres() }); // v288: cidades_novas.js troca o desenho
Object.assign(DESAFIOS, {
  lisboa: [['ponta_alfama', 150], ['central_belem', 150], ['ultra_lisboa', 150]],
  madri: [['extremo_madri', 180], ['zagueiro_toureiro', 180], ['ultra_madri', 180]],
  londres: [['ponta_camden', 200], ['zagueiro_ferro', 200], ['fanatico_eastend', 200]],
});

// Aeroporto na Cidade (Brasil)
const _mapaCidadeBase = MAPAS_DEF.cidade;
MAPAS_DEF.cidade = function () {
  const m = _mapaCidadeBase();
  // v153: o prédio do aeroporto é o b_ap1 do canto sudeste (com os mapas espalhados ele não fica mais em 40,33); a comissária fica na frente da porta
  const p = m.predios.filter(b => b.spr === 'b_ap1').sort((a, b) => (b.x + b.y) - (a.x + a.y))[0];
  const livre = (x, y) => x > 1 && y > 1 && x < m.w - 2 && y < m.h - 1 && !m.obj[y * m.w + x] && CH_ANDA(m.chao[y * m.w + x]) && !m.saidas.some(s => s.x === x && s.y === y) && !m.npcs.some(n => Math.abs(n.x - x) < 2 && Math.abs(n.y - y) < 2);
  let pos = null;
  // v165: ao LADO da porta (o aeroporto ficou colado na beirada de baixo do mapa maior; antes ela ia parar no meio da cidade)
  let pl = null;
  if (p) {
    p.spr = 'b_aeroporto'; const P = p.porta; const frente = (x, y) => x === P.x && (y === P.y || y === P.y + 1);
    // 1º: na calçada da FRENTE, ao lado da porta (mais perto primeiro)
    for (const dx of [2, -2, 3, -3, 1, -1, 4, -4]) { const x = P.x + dx, y = P.y + 1; if (pos || !livre(x, y)) continue; const lado = [[Math.sign(dx), 0], [0, 1]].find(([a, b]) => livre(x + a, y + b) && !frente(x + a, y + b)); if (lado) { pos = { x, y }; pl = { x: x + lado[0], y: y + lado[1] }; } }
    for (let r = 1; r < 9 && !pos; r++) for (let dy = -r; dy <= r && !pos; dy++) for (let dx = -r; dx <= r && !pos; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = P.x + dx, y = P.y + dy;
      if (frente(x, y) || !livre(x, y)) continue;
      const lado = [[1, 0], [-1, 0], [0, -1]].find(([a, b]) => livre(x + a, y + b) && !frente(x + a, y + b)); if (!lado) continue;
      pos = { x, y }; pl = { x: x + lado[0], y: y + lado[1] };
    }
  }
  if (!pos) { pos = { x: 43, y: 32 }; pl = { x: 44, y: 31 }; }
  m.npcs.push({ id: 'comissaria', x: pos.x, y: pos.y }); m.obj[pos.y * m.w + pos.x] = null;
  m.placas.push({ x: pl.x, y: pl.y, texto: 'AIRPORT — flights to Europe (level 50+)' }); m.obj[pl.y * m.w + pl.x] = { t: 'placa', v: 1 };
  return m;
};

// Ajuste de dificuldade da Europa: mais resistentes, um pouco mais fortes e mais XP
{
  const fator = { lisboa: 2.5, madri: 2.8, londres: 3.0 };
  const cidadeDe = { ponta_alfama: 'lisboa', medio_chiado: 'lisboa', central_belem: 'lisboa', ultra_lisboa: 'lisboa', capitao_tejo: 'lisboa', extremo_madri: 'madri', pivote_madri: 'madri', zagueiro_toureiro: 'madri', ultra_madri: 'madri', galactico: 'madri', ponta_camden: 'londres', box2box: 'londres', zagueiro_ferro: 'londres', fanatico_eastend: 'londres', lorde: 'londres' };
  for (const [id, c] of Object.entries(cidadeDe)) { const m = MONSTROS[id]; const f = m.chefe ? 2 : fator[c]; m.hp = Math.round(m.hp * f); m.atk = Math.round(m.atk * 1.15); m.xp = Math.round(m.xp * 1.5); if (m.ranged) m.ranged.dano = Math.round(m.ranged.dano * 1.15); }
}
