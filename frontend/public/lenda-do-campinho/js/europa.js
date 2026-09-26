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
  chuteira_elite: { nome: 'Chuteira de Elite', tipo: 'equip', slot: 'chuteira', atk: 30, st: { vel: 8 }, lvl: 60, preco: 60000, venda: 14000, desc: 'Ataque 30, +8 velocidade.' },
  chuteira_lenda: { nome: 'Chuteira de Platina', tipo: 'equip', slot: 'chuteira', atk: 36, st: { vel: 12, chute: 4, drible: 2 }, lvl: 80, venda: 60000, raro: true, desc: 'LENDÁRIA. Ataque 36, +12 velocidade, +4 chute, +2 drible.' },
  camisa_elite: { nome: 'Camisa de Elite', tipo: 'equip', slot: 'camisa', def: 24, st: { hp: 200 }, lvl: 60, preco: 65000, venda: 15000, avatar: 'roupa-futebol', desc: '+200 fôlego.', cor: '#f4f4f8', cor2: '#1a2a5a' },
  camisa_lenda: { nome: 'Camisa Negra e Ouro', tipo: 'equip', slot: 'camisa', def: 30, st: { hp: 320, drible: 2, chute: 2, visao: 2 }, lvl: 80, venda: 70000, raro: true, avatar: 'roupa-futebol', desc: 'LENDÁRIA. +320 fôlego e +2 em tudo.', cor: '#1a1a1a', cor2: '#e8b848' },
  caneleira_elite: { nome: 'Caneleira de Elite', tipo: 'equip', slot: 'perna', def: 11, st: { defesa: 2, hp: 60 }, lvl: 65, preco: 45000, venda: 11000, desc: '+2 defesa, +60 fôlego.', cor: '#c8c8d8' },
  cachecol: { nome: 'Cachecol da Paz', tipo: 'equip', slot: 'acessorio', def: 4, st: { foco: 160, regen: 3, visao: 2 }, lvl: 55, venda: 9000, avatar: 'pescoco-cachecol', desc: 'Presente dos líderes comunitários. +160 foco, +3 recuperação, +2 visão.' },
  apito_ouro: { nome: 'Apito de Ouro', tipo: 'equip', slot: 'acessorio', def: 6, st: { hp: 220, foco: 120, regen: 3 }, lvl: 75, venda: 25000, raro: true, avatar: 'pescoco-apito', desc: 'LENDÁRIO. +220 fôlego, +120 foco, +3 recuperação.' },
  bola_ouro: { nome: 'Bola de Ouro', tipo: 'chave', desc: 'O prêmio máximo do futebol mundial. Você é uma LENDA.' },
  passaporte: { nome: 'Passaporte', tipo: 'chave', desc: 'Liberado para voar para a Europa.' },
  pastel_nata: { nome: 'Pastel de Nata', tipo: 'comida', efeito: { dur: 600, regen: 3, atr: { inteligencia: 8 } }, lvl: 50, preco: 400, venda: 80, desc: 'Doce de Lisboa: +Inteligência e recuperação por 10 min.' },
  churros: { nome: 'Churros', tipo: 'comida', efeito: { dur: 600, regenFoco: 4, atr: { habilidade: 8 } }, lvl: 65, preco: 700, venda: 140, desc: 'De Madri: +Habilidade e foco por 10 min.' },
  fish_chips: { nome: 'Fish and Chips', tipo: 'comida', efeito: { dur: 900, regen: 4, atr: { folego: 8, defesa: 8 } }, lvl: 80, preco: 1200, venda: 240, desc: 'De Londres: +Fôlego, +Defesa e recuperação por 15 min.' },
  megafone: { nome: 'Megafone', tipo: 'loot', venda: 450, desc: 'Confiscado de um fanático. Nada de gritaria!' },
  ingresso: { nome: 'Ingresso Premium', tipo: 'loot', venda: 380, desc: 'Vale um bom dinheiro.' },
});

/* ---------- adversários ---------- */
const GRUPO_ULTRA = 'ultra';
Object.assign(MONSTROS, {
  // Lisboa (50-65)
  ponta_alfama: { nome: 'Ponta Veloz de Alfama', hp: 2600, atk: 170, def: 60, xp: 2300, vel: 330, aggro: 5, atkCd: 1700, ouro: [120, 260], loot: [['couro', 0.3, 1, 2], ['pastel_nata', 0.06, 1, 1], ['ingresso', 0.05, 1, 1], ['chuteira_elite', 0.002, 1, 1]], falas: ['Pela linha!', 'Ninguém me pega!'], look: {} },
  medio_chiado: { nome: 'Médio do Chiado', hp: 2800, atk: 165, def: 62, xp: 2500, vel: 250, aggro: 6, atkCd: 2000, ranged: { alcance: 5, dano: 160, cd: 2400, proj: 'bola' }, ouro: [130, 280], loot: [['couro', 0.3, 1, 2], ['fio_ouro', 0.02, 1, 1], ['pastel_nata', 0.05, 1, 1]], falas: ['Lançamento!', 'Vê só o passe!'], look: {} },
  central_belem: { nome: 'Central de Belém', hp: 3400, atk: 185, def: 75, xp: 2800, vel: 230, aggro: 5, atkCd: 2000, ouro: [150, 300], loot: [['couro', 0.35, 1, 2], ['caneleira_elite', 0.003, 1, 1]], falas: ['Aqui não passa!', 'Muralha de Belém!'], look: {} },
  ultra_lisboa: { nome: 'Fanático da Claque', hp: 2200, atk: 150, def: 50, xp: 2100, vel: 280, aggro: 7, atkCd: 1800, grupo: GRUPO_ULTRA, ranged: { alcance: 5, dano: 140, cd: 2600, proj: 'papel' }, ouro: [100, 220], loot: [['megafone', 0.06, 1, 1], ['retalho', 0.4, 1, 3]], falas: ['Uuuuh! Vaia!', 'Esse bairro é nosso!', 'Fora, forasteiro!'], look: {} },
  capitao_tejo: { nome: 'O Capitão do Tejo', hp: 90000, atk: 300, def: 85, xp: 120000, vel: 260, aggro: 2, atkCd: 1500, chefe: true, respawn: 600000, ranged: { alcance: 5, dano: 250, cd: 2600, proj: 'bolaforte' }, ouro: [15000, 22000], loot: [['fio_ouro', 1, 2, 3], ['chuteira_elite', 0.35, 1, 1], ['camisa_elite', 0.35, 1, 1], ['apito_ouro', 0.08, 1, 1]], falas: ['O Tejo é meu!', 'Mostra o que o Brasil tem!'], look: {} },
  // Madri (65-80)
  extremo_madri: { nome: 'Extremo Relâmpago', hp: 4200, atk: 220, def: 80, xp: 3800, vel: 340, aggro: 5, atkCd: 1700, ouro: [200, 380], loot: [['couro', 0.35, 1, 2], ['churros', 0.06, 1, 1], ['ingresso', 0.06, 1, 1]], falas: ['¡Olé!', 'Rápido demais pra você!'], look: {} },
  pivote_madri: { nome: 'Pivote Maestro', hp: 4500, atk: 215, def: 82, xp: 4100, vel: 250, aggro: 6, atkCd: 2000, ranged: { alcance: 5, dano: 205, cd: 2400, proj: 'bola' }, ouro: [220, 400], loot: [['fio_ouro', 0.03, 1, 1], ['churros', 0.06, 1, 1], ['camisa_elite', 0.003, 1, 1]], falas: ['Toco y me voy!', 'Visão de jogo!'], look: {} },
  zagueiro_toureiro: { nome: 'Zagueiro Toureiro', hp: 5400, atk: 250, def: 100, xp: 4600, vel: 230, aggro: 5, atkCd: 2000, ouro: [240, 420], loot: [['couro', 0.4, 1, 3], ['caneleira_elite', 0.004, 1, 1]], falas: ['¡Toro!', 'Vem que eu te seguro!'], look: {} },
  ultra_madri: { nome: 'Fanático do Bairro Rival', hp: 3600, atk: 200, def: 70, xp: 3500, vel: 290, aggro: 7, atkCd: 1800, grupo: GRUPO_ULTRA, ranged: { alcance: 5, dano: 185, cd: 2600, proj: 'copo' }, ouro: [180, 340], loot: [['megafone', 0.07, 1, 1], ['retalho', 0.4, 2, 4]], falas: ['¡Fuera!', 'Uuuuh!', 'Aqui manda a torcida!'], look: {} },
  galactico: { nome: 'O Galáctico', hp: 160000, atk: 380, def: 105, xp: 250000, vel: 270, aggro: 2, atkCd: 1500, chefe: true, respawn: 720000, ranged: { alcance: 5, dano: 320, cd: 2600, proj: 'bolaforte' }, ouro: [30000, 40000], loot: [['fio_ouro', 1, 3, 4], ['chuteira_lenda', 0.12, 1, 1], ['camisa_elite', 0.4, 1, 1], ['apito_ouro', 0.15, 1, 1]], falas: ['Sou de outra galáxia!', 'Autógrafo? Depois.'], look: {} },
  // Londres (80-100)
  ponta_camden: { nome: 'Ponta de Camden', hp: 6200, atk: 280, def: 105, xp: 5600, vel: 340, aggro: 5, atkCd: 1700, ouro: [320, 560], loot: [['couro', 0.4, 2, 3], ['fish_chips', 0.05, 1, 1], ['ingresso', 0.08, 1, 1]], falas: ['Mind the gap!', 'Too fast!'], look: {} },
  box2box: { nome: 'Volante Box-to-Box', hp: 7000, atk: 300, def: 115, xp: 6200, vel: 270, aggro: 6, atkCd: 1900, ranged: { alcance: 5, dano: 280, cd: 2400, proj: 'bola' }, ouro: [340, 600], loot: [['fio_ouro', 0.04, 1, 1], ['fish_chips', 0.05, 1, 1], ['chuteira_lenda', 0.001, 1, 1]], falas: ['Área a área!', 'Nunca paro!'], look: {} },
  zagueiro_ferro: { nome: 'Zagueiro de Ferro', hp: 8200, atk: 330, def: 135, xp: 7000, vel: 230, aggro: 5, atkCd: 2000, ouro: [360, 640], loot: [['couro', 0.5, 2, 3], ['camisa_lenda', 0.001, 1, 1]], falas: ['Solid as a rock!', 'Não hoje!'], look: {} },
  fanatico_eastend: { nome: 'Fanático do East End', hp: 5600, atk: 270, def: 95, xp: 5400, vel: 290, aggro: 7, atkCd: 1800, grupo: GRUPO_ULTRA, ranged: { alcance: 5, dano: 250, cd: 2600, proj: 'papel' }, ouro: [300, 520], loot: [['megafone', 0.08, 1, 1], ['retalho', 0.5, 2, 4]], falas: ['Booo!', 'Fora daqui!', 'Our street!'], look: {} },
  lorde: { nome: 'O Lorde do Futebol', hp: 280000, atk: 460, def: 130, xp: 500000, vel: 270, aggro: 2, atkCd: 1400, chefe: true, respawn: 900000, ranged: { alcance: 5, dano: 400, cd: 2400, proj: 'bolaforte' }, ouro: [60000, 80000], loot: [['fio_ouro', 1, 4, 6], ['camisa_lenda', 0.3, 1, 1], ['chuteira_lenda', 0.3, 1, 1]], falas: ['God save the ball!', 'Um brasileiro? Interessante.'], look: {} },
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
  comissaria: { nome: 'Comissária Luana', ola: 'Bem-vindo(a) ao balcão de embarque! Para onde vamos voar hoje?', aviao: true, look: { corpo: 'f', pele: 'pele-morena', cabelo: 'cabelo-coque', corCabelo: 'preto', roupa: 'roupa-terno', corRoupa: '#1a3a8a', baixo: 'baixo-saia', pescoco: 'pescoco-gravata', alt: 1.72 } },
  lojista_lisboa: { nome: 'Dona Amália da Pastelaria', ola: 'Olá, miúdo(a)! Pastéis de nata acabadinhos de sair do forno!', loja: ['pastel_nata', 'agua_coco', 'vitamina', 'chuteira_elite', 'camisa_elite', 'caneleira_elite'], look: { corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-coque', corCabelo: 'grisalho', roupa: 'roupa-xadrez', baixo: 'baixo-saia', alt: 1.66 } },
  lojista_madri: { nome: 'Don Paco dos Churros', ola: '¡Hola! Churros com chocolate para o craque brasileiro!', loja: ['churros', 'pastel_nata', 'agua_coco', 'vitamina', 'chuteira_elite', 'camisa_elite', 'caneleira_elite'], look: { pele: 'pele-media', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-regata', baixo: 'baixo-jeans', chapeu: 'chapeu-panama', alt: 1.72 } },
  lojista_londres: { nome: 'Sr. Wallace do Fish & Chips', ola: 'Good evening! Um peixinho com batatas para aguentar o frio?', loja: ['fish_chips', 'churros', 'pastel_nata', 'agua_coco', 'vitamina', 'chuteira_elite', 'camisa_elite', 'caneleira_elite'], look: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'ruivo', roupa: 'roupa-terno', baixo: 'baixo-jeans', chapeu: 'chapeu-cartola', alt: 1.74 } },
  lider_lisboa: { nome: 'Dona Fátima, líder do bairro', ola: 'A Claque do bairro anda assustando as famílias. Torcer é festa, não é briga!', look: { corpo: 'f', pele: 'pele-negra', cabelo: 'cabelo-black-power', corCabelo: 'grisalho', roupa: 'roupa-camiseta', corRoupa: '#1a8a4a', baixo: 'baixo-jeans', pescoco: 'pescoco-cachecol', alt: 1.7 } },
  lider_madri: { nome: 'Carmen, professora do bairro', ola: 'Os fanáticos daqui confundem paixão com intimidação. Me ajuda a mudar isso?', look: { corpo: 'f', pele: 'pele-media', cabelo: 'cabelo-liso-longo', corCabelo: 'castanho', roupa: 'roupa-jaleco', baixo: 'baixo-jeans', rosto: 'rosto-redondos', mao: 'mao-livro', alt: 1.7 } },
  lider_londres: { nome: 'Oliver, treinador comunitário', ola: 'No East End todo mundo ama futebol. Só precisamos lembrar que o rival não é inimigo.', look: { pele: 'pele-retinta', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-moletom', corRoupa: '#3a3a4a', baixo: 'baixo-moletom', pescoco: 'pescoco-apito', alt: 1.76 } },
};
for (const k in NPCS_EUROPA) { NPCS[k] = NPCS_EUROPA[k]; NPCS[k].look = Object.assign({ tipo: 'humano', corpo: 'm' }, NPCS[k].look); }

/* ---------- missões ---------- */
MISSOES.push(
  // Lisboa
  { id: 'l_pontas', npc: 'lojista_lisboa', titulo: 'Bem-vindo a Lisboa', lvl: 50, texto: 'Os pontas de Alfama correm mais que o bonde! Mostra que o Brasil também corre: passe por 30 deles.', req: { kill: 'ponta_alfama', n: 30 }, rec: { xp: 150000, ouro: 8000, itens: [['pastel_nata', 5]] }, fim: 'Magnífico! Agora Lisboa já sabe o teu nome.' },
  { id: 'l_paz', npc: 'lider_lisboa', titulo: 'Missão da Paz: a Claque', lvl: 52, texto: 'Entre no Bairro da Claque e vença 25 fanáticos no jogo limpo, sem briga. Quando virem que respeito se ganha jogando, eles vão baixar a bola.', req: { kill: 'ultra_lisboa', n: 25 }, rec: { xp: 180000, ouro: 9000, itens: [['cachecol', 1]], evento: 'paz' }, fim: 'Eles pararam de vaiar e pediram uma foto! Toma o Cachecol da Paz: torcer é festa, nunca violência.' },
  { id: 'l_centrais', npc: 'lojista_lisboa', titulo: 'Muralha de Belém', lvl: 55, pre: 'l_pontas', texto: 'Os centrais de Belém não deixam ninguém passar. Vence 30.', req: { kill: 'central_belem', n: 30 }, rec: { xp: 220000, ouro: 12000, itens: [['caneleira_elite', 1]] }, fim: 'Caneleira de Elite pra ti!' },
  { id: 'l_chefe', npc: 'lider_lisboa', titulo: 'O Capitão do Tejo', lvl: 60, pre: 'l_paz', texto: 'O CAPITÃO DO TEJO manda no cais, ao sul. Se você vencer, todo o bairro vai te respeitar.', req: { kill: 'capitao_tejo', n: 1 }, rec: { xp: 400000, ouro: 30000, flag: 'venceu_lisboa' }, fim: 'Lisboa é tua! Madri já está de olho em você.' },
  // Madri
  { id: 'm_extremos', npc: 'lojista_madri', titulo: '¡Bienvenido a Madri!', lvl: 65, texto: 'Os extremos relâmpago correm pela Plaza. Passe por 35.', req: { kill: 'extremo_madri', n: 35 }, rec: { xp: 380000, ouro: 20000, itens: [['churros', 5]] }, fim: '¡Qué crack! Madri se rende ao seu futebol.' },
  { id: 'm_paz', npc: 'lider_madri', titulo: 'Missão da Paz: Bairro Rival', lvl: 67, texto: 'Os fanáticos do Bairro Rival intimidam quem passa. Vença 30 no jogo limpo e mostre que rivalidade é dentro de campo.', req: { kill: 'ultra_madri', n: 30 }, rec: { xp: 420000, ouro: 22000, itens: [['megafone', 1]], evento: 'paz' }, fim: 'Hoje eles cantaram em vez de vaiar. É assim que se torce!' },
  { id: 'm_toureiros', npc: 'lojista_madri', titulo: 'Olé!', lvl: 70, pre: 'm_extremos', texto: 'Os zagueiros toureiros investem como touros. Drible 35 deles com classe.', req: { kill: 'zagueiro_toureiro', n: 35 }, rec: { xp: 520000, ouro: 28000, itens: [['apito_ouro', 1]] }, fim: '¡Olé, olé! Toma o Apito de Ouro.' },
  { id: 'm_chefe', npc: 'lider_madri', titulo: 'O Galáctico', lvl: 75, pre: 'm_paz', texto: 'O GALÁCTICO treina no Campo del Barrio, a leste. Ele acha que ninguém é do nível dele.', req: { kill: 'galactico', n: 1 }, rec: { xp: 900000, ouro: 60000, flag: 'venceu_madri' }, fim: 'Você é de outro planeta! Londres te espera.' },
  // Londres
  { id: 'o_pontas', npc: 'lojista_londres', titulo: 'Welcome to London', lvl: 80, texto: 'Os pontas de Camden são rápidos como o metrô. Passe por 40.', req: { kill: 'ponta_camden', n: 40 }, rec: { xp: 900000, ouro: 50000, itens: [['fish_chips', 5]] }, fim: 'Brilliant! Um brasileiro dominando Londres.' },
  { id: 'o_paz', npc: 'lider_londres', titulo: 'Missão da Paz: East End', lvl: 82, texto: 'Os fanáticos do East End precisam lembrar que o rival não é inimigo. Vença 35 no jogo limpo e depois vamos organizar um jogo de paz.', req: { kill: 'fanatico_eastend', n: 35 }, rec: { xp: 1000000, ouro: 55000, evento: 'paz' }, fim: 'O East End inteiro jogou junto hoje. Isso vale mais que qualquer taça.' },
  { id: 'o_ferro', npc: 'lojista_londres', titulo: 'Zaga de Ferro', lvl: 86, pre: 'o_pontas', texto: 'Os zagueiros de ferro são a defesa mais dura do mundo. Vence 40.', req: { kill: 'zagueiro_ferro', n: 40 }, rec: { xp: 1400000, ouro: 70000, itens: [['camisa_lenda', 1]] }, fim: 'A Camisa Negra e Ouro é sua.' },
  { id: 'o_lorde', npc: 'lider_londres', titulo: 'A Bola de Ouro', lvl: 90, pre: 'o_paz', texto: 'O LORDE DO FUTEBOL guarda a Bola de Ouro no grande estádio de Londres. Só uma lenda pode tirá-la dele.', req: { kill: 'lorde', n: 1 }, rec: { xp: 3000000, ouro: 200000, flag: 'lenda_mundial', itens: [['bola_ouro', 1]] }, fim: 'BOLA DE OURO! Da Vila do Campinho para o mundo: você é uma LENDA MUNDIAL!' },
);

/* ---------- viagens de avião ---------- */
const VOOS = {
  cidade: { nome: 'Brasil (Cidade)', lvl: 1, preco: 1500 },
  lisboa: { nome: 'Lisboa, Portugal', lvl: 50, preco: 2500 },
  madri: { nome: 'Madri, Espanha', lvl: 65, preco: 4000 },
  londres: { nome: 'Londres, Inglaterra', lvl: 80, preco: 6000 },
};
function modalVoo(npc) {
  const s = G.save; const lista = el('div', { class: 'lista' });
  for (const [id, v] of Object.entries(VOOS)) {
    if (id === G.mapa.id) continue;
    let ok = s.nivel >= v.lvl, motivo = ok ? '' : `Precisa do nível ${v.lvl}`;
    if (ok && id !== 'cidade' && typeof podeViajar === 'function') { const r = podeViajar(id); if (!r.ok) { ok = false; motivo = r.motivo; } }
    lista.append(el('div', { class: 'linha-item' + (ok ? '' : ' bloq') }, el('div', { class: 'nm' }, el('b', {}, '✈️ ' + v.nome), el('small', {}, (ok ? 'Embarque liberado' : motivo) + (typeof previsaoTxt === 'function' ? previsaoTxt(id) : ''))), precoTag(v.preco),
      el('button', { class: 'btn amarelo mini', disabled: ok ? null : 'disabled', onclick: () => {
        if (s.ouro < v.preco) { log('Tostões insuficientes para a passagem.', 'l-dano'); som('erro'); return; }
        s.ouro -= v.preco; fechaModal(); const m = getMapa(id); trocaMapa(id, m.inicio.x + 0.5, m.inicio.y + 0.5); som('apito');
        if (id !== 'cidade') banner(m.nome, 'Bem-vindo(a) à Europa!');
      } }, 'Voar')));
  }
  abreModal(el('h2', {}, '✈️ Aeroporto'), el('p', {}, 'Na Europa os adversários são MUITO mais fortes. Para jogar lá você precisa de nível e de um contrato com um clube do país (fale com o Empresário Rodrigues) — ou fama suficiente para ser convidado.'), lista);
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
  const b = new Construtor('lisboa', 'Lisboa — Bairro Alto', 52, 40, CH.CALCADA_PT, 606);
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
  bairroHostil(b, 37, 1, 14, 14, 'Bairro da Claque', 'ultra_lisboa', 8);
  b.npc('lider_lisboa', 41, 17); b.placa(39, 17, 'BAIRRO DA CLAQUE — cuidado: os fanáticos andam em grupo');
  b.spawn('capitao_tejo', 46, 33, 1, 1); b.placa(43, 32, 'CAIS DO TEJO — domínio do Capitão');
  objLargo(b, 44, 21, 'chafariz', 3);
  b.npc('quadro', 11, 18);
  for (let x = 4; x < 50; x += 7) { if (b.livre(x, 15)) b.obj(x, 15, 'poste3'); if (b.livre(x, 18)) b.obj(x, 18, 'poste3'); }
  b.espalha(['banca_jornal', 'lixeira2', 'cabine'], 3, 2, 19, 12, 12);
  b.espalha(['arvore', 'vaso', 'lixeira2'], 10, 2, 19, 48, 13);
  return b.m;
}
function mapaMadri() {
  const b = new Construtor('madri', 'Madri — Plaza e Barrio', 52, 40, CH.PARALELO, 707);
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
  bairroHostil(b, 1, 1, 14, 12, 'Bairro Rival', 'ultra_madri', 9);
  b.npc('lider_madri', 8, 14); b.placa(10, 14, 'BAIRRO RIVAL — rivalidade é dentro de campo');
  b.npc('quadro', 17, 21);
  for (let x = 19; x < 34; x += 5) { if (b.livre(x, 12)) b.obj(x, 12, 'poste3'); if (b.livre(x, 23)) b.obj(x, 23, 'poste3'); }
  b.espalha(['arvore', 'vaso', 'lixeira2', 'banca_jornal'], 14, 1, 13, 50, 25);
  return b.m;
}
function mapaLondres() {
  const b = new Construtor('londres', 'Londres — Camden e East End', 52, 40, CH.TIJOLO, 808);
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
  b.npc('lider_londres', 32, 12); b.placa(32, 14, 'EAST END — o rival não é inimigo');
  b.predio('b_aeroporto', 2, 33, 8, 4); b.npc('comissaria', 6, 38);
  b.m.inicio = { x: 8, y: 38 }; b.m.renasce = { x: 9, y: 38 };
  objLargo(b, 10, 19, 'onibus2', 3); b.obj(22, 17, 'cabine'); b.obj(27, 21, 'cabine');
  b.npc('quadro', 22, 21);
  for (let x = 3; x < 50; x += 6) { if (b.livre(x, 17)) b.obj(x, 17, 'poste3'); if (b.livre(x, 21)) b.obj(x, 21, 'poste3'); }
  b.espalha(['lixeira2', 'banca_jornal', 'cabine'], 6, 1, 5, 22, 12);
  return b.m;
}
Object.assign(MAPAS_DEF, { lisboa: mapaLisboa, madri: mapaMadri, londres: mapaLondres });
Object.assign(DESAFIOS, {
  lisboa: [['ponta_alfama', 150], ['central_belem', 150], ['ultra_lisboa', 150]],
  madri: [['extremo_madri', 180], ['zagueiro_toureiro', 180], ['ultra_madri', 180]],
  londres: [['ponta_camden', 200], ['zagueiro_ferro', 200], ['fanatico_eastend', 200]],
});

// Aeroporto na Cidade (Brasil)
const _mapaCidadeBase = MAPAS_DEF.cidade;
MAPAS_DEF.cidade = function () {
  const m = _mapaCidadeBase(); const p = m.predios.find(b => b.x === 40 && b.y === 33); if (p) p.spr = 'b_aeroporto';
  m.npcs.push({ id: 'comissaria', x: 43, y: 32 }); m.obj[32 * m.w + 43] = null;
  m.placas.push({ x: 44, y: 31, texto: 'AEROPORTO — voos para a Europa (nível 50+)' }); m.obj[31 * m.w + 44] = { t: 'placa', v: 1 };
  return m;
};

// Ajuste de dificuldade da Europa: mais resistentes, um pouco mais fortes e mais XP
{
  const fator = { lisboa: 2.5, madri: 2.8, londres: 3.0 };
  const cidadeDe = { ponta_alfama: 'lisboa', medio_chiado: 'lisboa', central_belem: 'lisboa', ultra_lisboa: 'lisboa', capitao_tejo: 'lisboa', extremo_madri: 'madri', pivote_madri: 'madri', zagueiro_toureiro: 'madri', ultra_madri: 'madri', galactico: 'madri', ponta_camden: 'londres', box2box: 'londres', zagueiro_ferro: 'londres', fanatico_eastend: 'londres', lorde: 'londres' };
  for (const [id, c] of Object.entries(cidadeDe)) { const m = MONSTROS[id]; const f = m.chefe ? 2 : fator[c]; m.hp = Math.round(m.hp * f); m.atk = Math.round(m.atk * 1.15); m.xp = Math.round(m.xp * 1.5); if (m.ranged) m.ranged.dano = Math.round(m.ranged.dano * 1.15); }
}
