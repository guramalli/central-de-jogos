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
  { id: 'lua', nome: 'Lua — Mar da Tranquilidade', nomeCurto: 'Lua', emoji: '🌕', req: 298, chao: CH.REGOLITO, tema: 'lunar', predios: ['b_lua1', 'b_lua2'], props: ['cratera', 'rochas_lua', 'buggy_lunar', 'bandeira_bola'], ent: 'ent_cratera', tinta: 'rgba(120,140,255,0.10)', gravidade: 1.12,
    ets: [['et_coelho', 'Coelhinho Lunar', 305, 'rapido', 1.0, false, 'antena_alien', 'Antena de ET', 'Ainda pega o sinal do jogo na TV da Terra.', ['Pim pim!', 'Pula mais alto!']],
      ['et_rocha', 'Rochedo Lunar', 312, 'zagueiro', 1.25, false, 'amostra_lunar', 'Amostra de Rocha Lunar', 'Um pedacinho da Lua num potinho.', ['Rrrrock!', 'Aqui não passa!']],
      ['et_selenita', 'Selenita Goleiro', 320, 'meia', 1.35, false, 'luvas_selenitas', 'Luvas Selenitas', 'Brilham quando defendem um chute.', ['Defendi!', 'Bola é minha!']]],
    chefe: ['ch_capitao_lunar', 'Capitão Lunar', 328, 2.2], lider: { nome: 'Comandante Luna', pele: 'pele-clara', cor: '#c0c8e0' } },
  { id: 'marte', nome: 'Marte — Vale Vermelho', nomeCurto: 'Marte', emoji: '🔴', req: 325, chao: CH.MARTE, tema: 'marciano', predios: ['b_marte1', 'b_marte2'], props: ['rochas_marte', 'cacto_alien', 'geiser', 'rover'], ent: 'ent_escotilha', tinta: 'rgba(255,120,60,0.10)',
    ets: [['et_marciano', 'Marcianinho Artilheiro', 332, 'rapido', 0.95, false, 'cristal_marciano', 'Cristal Marciano', 'Verde e quentinho. Os marcianos usam de amuleto.', ['Bip bop gol!', 'Terráqueo!']],
      ['et_robo', 'Robô Minerador', 340, 'zagueiro', 1.3, false, 'engrenagem', 'Engrenagem de Robô', 'Ainda gira sozinha de vez em quando.', ['BIP. BLOQUEIO.', 'Zzzt!']],
      ['et_rover', 'Aranha-Rover', 348, 'meia', 1.0, false, 'roda_rover', 'Roda de Rover', 'Rodou quilômetros na areia vermelha.', ['Bip bip!', 'Radar ligado!']]],
    chefe: ['ch_general_marciano', 'General Marciano', 353, 2.3], lider: { nome: 'Engenheira Rubi', pele: 'pele-morena', cor: '#d0663a' } },
  { id: 'saturno', nome: 'Saturno — Anéis de Cristal', nomeCurto: 'Saturno', emoji: '🪐', req: 350, chao: CH.ANEL, tema: 'anel', predios: ['b_saturno1', 'b_saturno2'], props: ['cristal_flutuante', 'meteorito', 'cristais'], ent: 'ent_cristal_esp', tinta: 'rgba(170,120,255,0.12)',
    ets: [['et_anel', 'Anelzinho Flutuante', 357, 'meia', 1.0, true, 'fragmento_anel', 'Fragmento de Anel', 'Um pedacinho dos anéis de Saturno. Gira sozinho!', ['Uiii!', 'Rodopio!']],
      ['et_cristal', 'Cristalino', 365, 'zagueiro', 1.3, false, 'lasca_cristal', 'Lasca de Cristal Violeta', 'Faz um "plim" bonito quando cai.', ['Plim!', 'Duro como cristal!']],
      ['et_medusa', 'Água-viva Espacial', 372, 'meia', 1.2, true, 'orbe_medusa', 'Orbe de Água-viva', 'Brilha no escuro do espaço.', ['Blup... gol!', 'Flutua, flutua!']]],
    chefe: ['ch_rainha_aneis', 'Rainha dos Anéis', 378, 2.4], lider: { nome: 'Astrônoma Vega', pele: 'pele-negra', cor: '#a890d8' } },
  { id: 'nebulosa', nome: 'Nebulosa de Órion — Campo das Estrelas', nomeCurto: 'Nebulosa', emoji: '🌌', req: 375, chao: CH.NEBULOSA, tema: 'nebular', predios: ['b_nebula1', 'b_nebula2'], props: ['cogumelo_cosmico', 'estrela_caida', 'cristais'], ent: 'ent_buraco_minhoca', tinta: 'rgba(255,120,220,0.12)',
    ets: [['et_nuvem', 'Nuvenzinha Nebular', 382, 'rapido', 1.1, true, 'poeira_estelar', 'Poeira de Estrela', 'Brilha com todas as cores.', ['Fuuu!', 'Nuvem veloz!']],
      ['et_cometa', 'Cometa Artilheiro', 390, 'rapido', 1.0, true, 'lasca_cometa', 'Lasca de Cometa', 'Ainda está geladinha do espaço.', ['Zuuum!', 'Chute de cometa!']],
      ['et_cavaleiro', 'Cavaleiro Estelar', 397, 'zagueiro', 1.6, false, 'insignia_estelar', 'Insígnia Estelar', 'Medalha dos cavaleiros da galáxia.', ['Pela galáxia!', 'Defendo as estrelas!']]],
    chefe: ['ch_imperador_nebular', 'Imperador Nebular', 398, 2.5], lider: { nome: 'Guardiã Órion', pele: 'pele-media', cor: '#d8a0dc' } },
];
const PLANETA_POR_ID = {}; PLANETAS.forEach(p => PLANETA_POR_ID[p.id] = p);
const ETS_ID = new Set(); PLANETAS.forEach(p => { p.ets.forEach(e => ETS_ID.add(e[0])); ETS_ID.add(p.chefe[0]); }); ETS_ID.add('ch_supremo');
const MAPAS_ESPACO = new Set(['estacao', 'copa_intergalactica', ...PLANETAS.map(p => p.id)]);

/* ---------- itens: equipamentos 300–400, poções, comida, loot ---------- */
Object.assign(ITENS, {
  chuteira_lunar: { nome: 'Chuteira Lunar', tipo: 'equip', slot: 'chuteira', atk: 100, st: { vel: 22, drible: 8 }, lvl: 305, preco: 3000000, venda: 600000, desc: 'Ataque 100, +22 velocidade, +8 drible.', iconeBase: 'i_chuteira_galaxia', matiz: 190 },
  camisa_lunar: { nome: 'Camisa Lunar', tipo: 'equip', slot: 'camisa', def: 76, st: { hp: 2000, defesa: 6 }, lvl: 305, preco: 3200000, venda: 640000, avatar: 'roupa-futebol', cor: '#e8ecf8', cor2: '#6a7aa8', desc: '+2.000 fôlego, +6 defesa.', iconeBase: 'i_camisa_galaxia', matiz: 190 },
  caneleira_lunar: { nome: 'Caneleira Lunar', tipo: 'equip', slot: 'perna', def: 34, st: { defesa: 8, hp: 800 }, lvl: 308, preco: 2800000, venda: 560000, desc: '+8 defesa, +800 fôlego.', iconeBase: 'i_caneleira_galaxia', matiz: 190 },
  amuleto_lunar: { nome: 'Amuleto Lunar', tipo: 'equip', slot: 'acessorio', def: 10, st: { foco: 500, regen: 7 }, lvl: 310, preco: 2500000, venda: 500000, avatar: 'pescoco-medalha', desc: '+500 foco, +7 recuperação.', iconeBase: 'i_insignia_estrela', matiz: 190 },
  chuteira_marciana: { nome: 'Chuteira Marciana', tipo: 'equip', slot: 'chuteira', atk: 112, st: { vel: 24, chute: 9, drible: 9 }, lvl: 335, venda: 800000, desc: 'Ataque 112, +24 velocidade, +9 chute e drible.', iconeBase: 'i_chuteira_galaxia', matiz: 110 },
  camisa_marciana: { nome: 'Camisa Marciana', tipo: 'equip', slot: 'camisa', def: 84, st: { hp: 2500, defesa: 7 }, lvl: 335, venda: 840000, avatar: 'roupa-futebol', cor: '#d0463a', cor2: '#3ad06a', desc: '+2.500 fôlego, +7 defesa.', iconeBase: 'i_camisa_galaxia', matiz: 110 },
  caneleira_marciana: { nome: 'Caneleira Marciana', tipo: 'equip', slot: 'perna', def: 38, st: { defesa: 9, hp: 1000 }, lvl: 338, venda: 760000, desc: '+9 defesa, +1.000 fôlego.', iconeBase: 'i_caneleira_galaxia', matiz: 110 },
  chuteira_estelar: { nome: 'Chuteira Estelar', tipo: 'equip', slot: 'chuteira', atk: 124, st: { vel: 26, chute: 10, drible: 10 }, lvl: 360, venda: 1000000, desc: 'Ataque 124, +26 velocidade, +10 chute e drible.', iconeBase: 'i_chuteira_galaxia', matiz: 260 },
  camisa_estelar: { nome: 'Camisa Estelar', tipo: 'equip', slot: 'camisa', def: 92, st: { hp: 3100, defesa: 8 }, lvl: 360, venda: 1050000, avatar: 'roupa-futebol', cor: '#6a3ad9', cor2: '#f8d838', desc: '+3.100 fôlego, +8 defesa.', iconeBase: 'i_camisa_galaxia', matiz: 260 },
  caneleira_estelar: { nome: 'Caneleira Estelar', tipo: 'equip', slot: 'perna', def: 42, st: { defesa: 10, hp: 1250 }, lvl: 363, venda: 950000, desc: '+10 defesa, +1.250 fôlego.', iconeBase: 'i_caneleira_galaxia', matiz: 260 },
  capacete_estelar: { nome: 'Capacete Estelar', tipo: 'equip', slot: 'cabeca', def: 18, st: { hp: 900, visao: 6 }, lvl: 365, venda: 900000, avatar: 'chapeu-coroa', desc: '+900 fôlego, +6 visão.', iconeBase: 'i_bola_coroa', matiz: 200 },
  chuteira_galactica: { nome: 'Chuteira Galáctica', tipo: 'equip', slot: 'chuteira', atk: 138, st: { vel: 30, chute: 12, drible: 12 }, lvl: 385, venda: 1400000, desc: 'Ataque 138, +30 velocidade, +12 chute e drible.', iconeBase: 'i_chuteira_galaxia', matiz: 40 },
  camisa_galactica: { nome: 'Camisa Galáctica', tipo: 'equip', slot: 'camisa', def: 102, st: { hp: 3800, defesa: 10 }, lvl: 385, venda: 1450000, avatar: 'roupa-futebol', cor: '#1a1450', cor2: '#ffcf3a', desc: '+3.800 fôlego, +10 defesa.', iconeBase: 'i_camisa_galaxia', matiz: 40 },
  caneleira_galactica: { nome: 'Caneleira Galáctica', tipo: 'equip', slot: 'perna', def: 46, st: { defesa: 12, hp: 1500 }, lvl: 388, venda: 1300000, desc: '+12 defesa, +1.500 fôlego.', iconeBase: 'i_caneleira_galaxia', matiz: 40 },
  coroa_galactica: { nome: 'Coroa Galáctica', tipo: 'equip', slot: 'cabeca', def: 22, st: { hp: 1200, drible: 9, chute: 9, visao: 6 }, lvl: 395, venda: 2000000, avatar: 'chapeu-coroa', desc: 'Do Supremo da Galáxia. +1.200 fôlego, +9 drible e chute, +6 visão.', iconeBase: 'i_bola_coroa', matiz: 280 },
  soro_estelar: { nome: 'Soro Estelar', tipo: 'consumivel', efeito: { hp: 12000 }, lvl: 300, preco: 5200, venda: 1040, desc: 'Recupera 12.000 de fôlego. Nível 300.', icon: { k: 'copo', c: '#f8d838' } },
  cristal_foco: { nome: 'Cristal de Foco', tipo: 'consumivel', efeito: { foco: 6000 }, lvl: 300, preco: 4800, venda: 960, desc: 'Recupera 6.000 de foco. Nível 300.', icon: { k: 'copo', c: '#b07aff' } },
  rango_astronauta: { nome: 'Rango de Astronauta', tipo: 'comida', efeito: { dur: 900, regen: 10, regenFoco: 7, atr: { defesa: 18, habilidade: 18, inteligencia: 18, folego: 18 } }, lvl: 300, preco: 6000, venda: 1200, desc: 'Comida de tubinho: +18 em TUDO e muita recuperação por 15 min.', iconeBase: 'i_areia_colorida', matiz: 200 },
  trofeu_galaxia: { nome: 'Troféu da Copa Intergaláctica', tipo: 'loot', venda: 400 * 250, desc: 'Prova de que você venceu o Supremo da Galáxia. Peça de colecionador.', iconeBase: 'i_taca_copa', matiz: 250 },
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
  const ch = criaET(cid, cnome, cL, 'chefe', calt, false, ['Terráqueo, prepare-se!', 'No meu planeta a bola é minha!', 'Mostre o futebol da Terra!']);
  const g = GEAR_ESP(cL); ch.loot = [['fio_ouro', 1, 2, 4], [p.ets[0][6], 1, 3, 5], [g[0], 0.35, 1, 1], [g[1], 0.2, 1, 1]];
}
{
  const sup = criaET('ch_supremo', 'O Supremo da Galáxia', 400, 'chefe', 2.8, false, ['Mil galáxias, nenhum rival à altura...', 'Mostre por que chamam você de LENDA!', 'A Copa Intergaláctica é minha!']);
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
  const W = 56, H = 40; const b = new Construtor('estacao', 'Estação Espacial Galáctica', W, H, CH.METAL, 2301);
  // janelas para o espaço em volta (3 de largura)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < 3 || y < 3 || x >= W - 3 || y >= H - 3) { b.chao(x, y, CH.ESTRELAS); b.obj(x, y, 'x'); }
  // chegada do foguete
  objLargo(b, 7, 7, 'foguete', 1); b.npc('estela_estacao', 10, 8); b.m.inicio = { x: 9, y: 10 }; b.m.renasce = { x: 9, y: 10 };
  b.placa(12, 6, '🚀 ESTAÇÃO ESPACIAL — os ETs também jogam futebol e desafiam os humanos! Fale com a Torre de Controle para voar aos planetas.');
  // doca das naves + torre de controle
  objLargo(b, 44, 8, 'nave', 3); b.npc('torre_esp', 40, 10); b.obj(38, 7, 'console_esp'); b.obj(49, 12, 'radar');
  // praça central
  b.predio('b_estacao1', 14, 14, 5, 3); b.predio('b_estacao2', 36, 14, 5, 3);
  b.npc('loja_esp', 24, 22); b.npc('lider_esp', 31, 22); b.npc('quadro', 28, 25);
  b.espalha(['console_esp', 'radar', 'console_esp'], 10, 4, 18, W - 8, H - 22, t => t === CH.METAL);
  b.m.espaco = { tinta: 'rgba(90,120,255,0.06)' };
  return b.m;
}
MAPAS_DEF.estacao = criaEstacao;

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
  b.placa(13, 8, `${p.emoji} ${p.nomeCurto.toUpperCase()} — aqui os ETs jogam futebol! Vença os times deles e desafie ${p.chefe[1].toUpperCase()}.`);
  // bairro dos ETs
  const [p1, p2] = p.predios;
  [[16, 3], [22, 3], [37, 3], [43, 3], [49, 3], [16, 28], [37, 28], [43, 28]].forEach(([x, y], i) => b.predio(i % 2 ? p2 : p1, x, y, 5, 3));
  b.npc('lider_' + p.id, 29, 21); b.npc('quadro', 34, 21);
  // chefão no canto (território)
  const [cid] = p.chefe; b.ret(50, 12, 10, 8, CH.METAL); b.spawn(cid, 55, 16, 1, 1); b.placa(49, 11, `Território de ${MONSTROS[cid].nome.toUpperCase()} (nível ${nivelMonstro(MONSTROS[cid])})`);
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
  const W = 40, H = 30; const b = new Construtor('copa_intergalactica', '🏆 Copa Intergaláctica', W, H, CH.METAL, 2999);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) { b.chao(x, y, CH.ESTRELAS); b.obj(x, y, 'x'); }
  for (let x = 3; x < W - 3; x++) b.obj(x, 2, 'arquibancada');
  b.campo(6, 6, 28, 16, CH.CAMPO);
  for (const [x, y] of [[3, 4], [W - 4, 4], [3, H - 5], [W - 4, H - 5]]) b.obj(x, y, 'holofote');
  b.spawn('ch_supremo', 20, 13, 1, 1); b.spawn('et_cavaleiro', 10, 13, 2, 2); b.spawn('et_cavaleiro', 30, 13, 2, 2);
  b.npc('piloto_copa', 20, H - 4); b.m.inicio = { x: 20, y: H - 5 }; b.m.renasce = { x: 20, y: H - 5 };
  b.placa(17, H - 4, '🏆 COPA INTERGALÁCTICA — a grande final contra O SUPREMO DA GALÁXIA. Boa sorte, lenda da Terra!');
  b.m.espaco = { tinta: 'rgba(255,210,80,0.06)' };
  return b.m;
}
MAPAS_DEF.copa_intergalactica = criaCopaIntergalactica;

/* ---------- áreas de caça (3 por planeta) ---------- */
{
  const guias = { lua: ['Cadete Nino', 'pele-clara'], marte: ['Cadete Tupã', 'pele-morena'], saturno: ['Cadete Stella', 'pele-negra'], nebulosa: ['Cadete Orion', 'pele-media'] };
  const nomes = {
    et_coelho: 'Crateras dos Coelhinhos', et_rocha: 'Pedreira Lunar', et_selenita: 'Estádio Selenita',
    et_marciano: 'Vale dos Marcianinhos', et_robo: 'Mina dos Robôs', et_rover: 'Deserto dos Rovers',
    et_anel: 'Carrossel dos Anéis', et_cristal: 'Caverna de Cristal Violeta', et_medusa: 'Lago das Águas-vivas',
    et_nuvem: 'Mar de Nuvens', et_cometa: 'Cauda do Cometa', et_cavaleiro: 'Fortaleza Estelar',
  };
  PLANETAS.forEach((p, ip) => p.ets.forEach(([m], k) => {
    const [gn, gp] = guias[p.id];
    registraCaca({ id: 'caca_' + m, nome: nomes[m], host: p.id, m, tema: p.tema, ent: p.ent, guia: `${gn} ${k + 1}`, look: lkGuia(gp, '#f4f4f8', { chapeu: null, roupa: 'roupa-terno', corRoupa: '#e8ecf8' }), seed: 12001 + ip * 311 + k * 97, pos: { x: [10, 30, 50][k], y: 40 } });
  }));
  // guias falam do desafio dos ETs
  PLANETAS.forEach(p => p.ets.forEach(([m]) => { const n = NPCS['guia_caca_' + m]; const d = MONSTROS[m]; if (n) n.ola = `Este é o campo do time "${d.nome}" (nível ${nivelMonstro(d)}). Eles nunca jogaram contra um humano e estão doidos para te desafiar! Quer uma missão?`; }));
  // os temas espaciais pintam o céu da área de caça também
  const _criaCacaEsp = criaCaca;
  criaCaca = function (c) { const m = _criaCacaEsp.apply(this, arguments); const t = TEMAS_CACA[c.tema]; if (t && t.tinta) m.espaco = { tinta: t.tinta }; return m; };
  PLANETAS.forEach(p => { DESAFIOS[p.id] = p.ets.map(e => [e[0], 200]); });
  DESAFIOS.estacao = [['et_coelho', 150], ['et_rocha', 150], ['et_selenita', 150]];
}

/* ---------- NPCs ---------- */
const LOOK_ASTRO = (corpo, pele, cor) => ({ tipo: 'humano', corpo, alt: 1.72, pele, cabelo: corpo === 'f' ? 'cabelo-coque' : 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-terno', corRoupa: cor, baixo: 'baixo-jeans' });
Object.assign(NPCS, {
  estela: { nome: 'Dra. Estela, a astronauta', viagemEsp: 'decolar', look: LOOK_ASTRO('f', 'pele-negra', '#e8ecf8'), ola: 'Sabia que os extraterrestres também jogam futebol? E eles querem desafiar os humanos! O foguete está pronto.' },
  estela_estacao: { nome: 'Dra. Estela, a astronauta', viagemEsp: 'terra', look: LOOK_ASTRO('f', 'pele-negra', '#e8ecf8'), ola: 'Quando quiser voltar para a Terra, o foguete te leva de volta à praia do Rio.' },
  torre_esp: { nome: 'Torre de Controle', viagemEsp: 'torre', look: LOOK_ASTRO('m', 'pele-media', '#3a4a6a'), ola: 'Torre de Controle na escuta! Para qual planeta vamos voar hoje?' },
  piloto_copa: { nome: 'Piloto Cósmico', viagemEsp: 'torre', look: LOOK_ASTRO('m', 'pele-clara', '#ffcf3a'), ola: 'Pronto para voltar? Escolha o destino.' },
  loja_esp: { nome: 'Loja Galáctica do Seu Plutão', loja: ['soro_estelar', 'cristal_foco', 'rango_astronauta', 'chuteira_lunar', 'camisa_lunar', 'caneleira_lunar', 'amuleto_lunar'], look: LOOK_ASTRO('m', 'pele-retinta', '#f8d838'), ola: 'Soro Estelar, Cristal de Foco e equipamento lunar! Tudo para o craque que vai jogar nas estrelas.' },
  lider_esp: { nome: 'Comandante Nova', look: Object.assign(LOOK_ASTRO('f', 'pele-media', '#1a2a6a'), { cabelo: 'cabelo-rabo', corCabelo: 'ruivo', pescoco: 'pescoco-apito' }), ola: 'Os ETs de todos os planetas desafiaram a Terra para a Copa Intergaláctica. E a Terra escolheu VOCÊ.' },
});
for (const p of PLANETAS) {
  NPCS['piloto_' + p.id] = { nome: `Piloto da nave (${p.nomeCurto})`, viagemEsp: 'torre', look: LOOK_ASTRO('m', 'pele-morena', '#e8ecf8'), ola: 'A nave está abastecida. Para onde agora?' };
  NPCS['lider_' + p.id] = { nome: p.lider.nome, look: Object.assign(LOOK_ASTRO('f', p.lider.pele, p.lider.cor), { cabelo: 'cabelo-rabo' }), ola: `Aqui em ${p.nomeCurto} os ETs jogam bola desde sempre. Eles querem saber se os humanos são bons mesmo!` };
}
const ESP_NIVEL = 298, ESP_PRECO = 200000;
let ESP_VOLTA = null;
function destinosEspaco() {
  const s = G.save;
  return [{ id: 'estacao', nome: '🛰️ Estação Espacial', req: ESP_NIVEL }, ...PLANETAS.map(p => ({ id: p.id, nome: `${p.emoji} ${p.nomeCurto} (níveis ${p.ets[0][2]}–${p.chefe[2]})`, req: p.req })),
    { id: 'copa_intergalactica', nome: '🏆 Copa Intergaláctica (final)', req: 395, flag: 'venceu_imperador', msgFlag: 'Vença o Imperador Nebular primeiro' }];
}
function modalViagemEspaco(npc) {
  const s = G.save; const d = npc.d; const fecha = el('button', { class: 'btn', onclick: fechaModal }, 'Agora não');
  const ops = [];
  if (d.viagemEsp === 'decolar') {
    const pode = s.nivel >= ESP_NIVEL, tem = s.ouro >= ESP_PRECO;
    ops.push(el('button', { class: 'btn amarelo', disabled: pode && tem ? null : 'disabled', onclick: () => { s.ouro -= ESP_PRECO; fechaModal(); som('porta'); trocaMapa('estacao', 9.5, 10.5); banner('🚀 Estação Espacial', 'Os ETs querem jogar!'); } },
      !pode ? `🔒 Só a partir do nível ${ESP_NIVEL}` : !tem ? `Faltam ${fmt(ESP_PRECO - s.ouro)} tostões` : `🚀 Decolar para a Estação Espacial (${fmt(ESP_PRECO)} tostões)`));
  } else if (d.viagemEsp === 'terra') {
    ops.push(el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); som('porta'); getMapa('rio'); const p = ESP_VOLTA || getMapa('rio').inicio; trocaMapa('rio', p.x + 0.5, p.y + 1.5); } }, '🌎 Voltar para a Terra (praia do Rio)'));
  } else {
    for (const t of destinosEspaco()) {
      if (G.mapa && t.id === G.mapa.id) continue;
      const trava = s.nivel < t.req ? `🔒 nível ${t.req}` : t.flag && !s.flags[t.flag] ? `🔒 ${t.msgFlag}` : '';
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
    if (n) { ESP_VOLTA = { x: n.x, y: n.y }; const sx = n.x + 2, sy = n.y; if (!m.obj[sy * m.w + sx]) m.obj[sy * m.w + sx] = { t: 'foguete', v: 1 }; }
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
    { id: 'esp_m1', npc: 'lider_esp', titulo: 'Primeiro passo na Lua', lvl: 298, texto: 'Os ETs mandaram o desafio: querem ver se os humanos sabem jogar. Voe até a Lua e passe no drible por 60 Coelhinhos Lunares.', req: { kill: 'et_coelho', n: 60 }, rec: { xp: Math.round(xpNivel(305) * 1.5), ouro: 1500000, itens: [['soro_estelar', 10], ['cristal_foco', 5]] }, fim: 'Os Coelhinhos ficaram de boca aberta! A notícia já está correndo a galáxia.' },
    { id: 'esp_m2', npc: 'lider_esp', titulo: 'O Capitão da Lua', lvl: 326, pre: 'esp_m1', texto: 'O Capitão Lunar é o craque mais famoso da Lua. Vença ele no território dele!', req: { kill: 'ch_capitao_lunar', n: 1 }, rec: { xp: Math.round(xpNivel(328) * 3), ouro: 2500000, itens: [['amuleto_lunar', 1]] }, fim: 'A Lua é nossa! Agora Marte quer jogar.' },
    { id: 'esp_m3', npc: 'lider_esp', titulo: 'O General de Marte', lvl: 351, pre: 'esp_m2', texto: 'O General Marciano treina o time mais disciplinado do Sistema Solar. Mostre o drible brasileiro!', req: { kill: 'ch_general_marciano', n: 1 }, rec: { xp: Math.round(xpNivel(353) * 3), ouro: 3500000, itens: [['chuteira_marciana', 1]] }, fim: 'Marte bateu continência para você!' },
    { id: 'esp_m4', npc: 'lider_esp', titulo: 'A Rainha dos Anéis', lvl: 376, pre: 'esp_m3', texto: 'Nos anéis de Saturno mora a Rainha, que nunca levou um gol. Vença-a!', req: { kill: 'ch_rainha_aneis', n: 1 }, rec: { xp: Math.round(xpNivel(378) * 3), ouro: 4500000, itens: [['capacete_estelar', 1]] }, fim: 'A Rainha dos Anéis te deu um sorriso de respeito.' },
    { id: 'esp_m5', npc: 'lider_esp', titulo: 'O Imperador Nebular', lvl: 396, pre: 'esp_m4', texto: 'O último guardião antes da final: o Imperador Nebular, na Nebulosa de Órion.', req: { kill: 'ch_imperador_nebular', n: 1 }, rec: { xp: Math.round(xpNivel(398) * 3), ouro: 6000000, flag: 'venceu_imperador' }, fim: 'O caminho está livre: a COPA INTERGALÁCTICA te espera! Fale com a Torre de Controle.' },
    { id: 'esp_m6', npc: 'lider_esp', titulo: 'A Copa Intergaláctica', lvl: 398, pre: 'esp_m5', texto: 'É a final das finais. No estádio entre as estrelas, O SUPREMO DA GALÁXIA espera. Vença e a Terra será campeã do universo!', req: { kill: 'ch_supremo', n: 1 }, rec: { xp: Math.round(xpNivel(400) * 6), ouro: 15000000, itens: [['coroa_galactica', 1]], flag: 'campeao_galaxia' }, fim: 'CAMPEÃ(O) DA GALÁXIA! Da Vila do Campinho para o universo inteiro.' },
  );
  for (const p of PLANETAS) {
    const [a, , c] = p.ets;
    MISSOES.push(
      { id: p.id + '_esp1', npc: 'lider_' + p.id, titulo: `Desafio em ${p.nomeCurto}`, lvl: a[2] - 4, texto: `O time "${a[1]}" quer medir forças com um humano. Passe por 60 deles!`, req: { kill: a[0], n: 60 }, rec: { xp: Math.round(xpNivel(a[2]) * 1.2), ouro: a[2] * 3000, itens: [[GEAR_ESP(a[2])[1], 1]] }, fim: 'Eles pediram revanche... mas já sabem quem manda!' },
      { id: p.id + '_esp2', npc: 'lider_' + p.id, titulo: `O melhor time de ${p.nomeCurto}`, lvl: c[2] - 3, pre: p.id + '_esp1', texto: `Agora o time mais forte daqui: "${c[1]}". Vença 60 deles.`, req: { kill: c[0], n: 60 }, rec: { xp: Math.round(xpNivel(c[2]) * 1.5), ouro: c[2] * 4000, itens: [[GEAR_ESP(c[2])[0], 1]] }, fim: `${p.nomeCurto} inteiro está falando de você!` },
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
    rotulo: 'Capítulo 8', titulo: 'Rumo às Estrelas', emoji: '🚀', implica: ['mundo', 'europa', 'retorno', 'copa', 'atlantida'],
    cond: (s, mapa) => MAPAS_ESPACO.has(mapa) || /^caca_et_/.test(mapa),
    cenas: [
      { img: 'cap_esp_1', kb: 'kb-a', cor: ['#140a40', '#f8a040'], txt: n => 'Um sinal estranho chegou do céu: uma bola de futebol desenhada com estrelas. Era um convite... dos extraterrestres!' },
      { img: 'cap_esp_1', kb: 'kb-zoom', foco: '55% 40%', cor: ['#140a40', '#f8a040'], txt: n => `A Dra. Estela ligou os motores e o foguete subiu, subiu... levando ${typeof _hn === 'function' ? _hn(n) : 'a lenda'} para fora da Terra.` },
      { img: 'cap_esp_2', kb: 'kb-b', cor: ['#0a0a1e', '#8ab0ff'], txt: n => 'Na Lua, o segredo apareceu: os ETs também jogam futebol! E cada planeta tem seus times, doidos para desafiar os humanos.' },
    ],
    final: { emoji: '🚀', titulo: 'Rumo às Estrelas', sub: n => 'Capítulo 8 começou! Lua, Marte, Saturno e a Nebulosa (níveis 305 a 400). No fim, a Copa Intergaláctica!', botao: 'Decolar! 🚀' },
  };
  CAPITULOS.galaxia = {
    rotulo: 'Capítulo 9', titulo: 'Campeã(o) da Galáxia', emoji: '🏆', implica: ['espaco'],
    cond: s => !!s.flags.campeao_galaxia,
    cenas: [
      { img: 'cap_esp_3', kb: 'kb-a', cor: ['#0a0a1e', '#ffcf3a'], txt: n => 'O estádio flutuava entre as estrelas. De um lado, o Supremo da Galáxia. Do outro, a criança do campinho de terra.' },
      { img: 'cap_esp_3', kb: 'kb-zoom', foco: '50% 55%', cor: ['#0a0a1e', '#ffcf3a'], txt: n => 'Drible, caneta, bicicleta... e GOOOL! ETs de mil planetas pularam nas arquibancadas. A Terra era campeã do universo!' },
      { img: 'historia_1', kb: 'kb-d', cor: ['#f7b35a', '#3aa0c8'], txt: n => 'Lá na Vila, o Seu Zé olhou para o céu e sorriu: "Eu sempre soube." E o universo ainda guarda muitos campos por descobrir...' },
    ],
    final: { emoji: '🏆', titulo: 'Campeã(o) da Galáxia!', sub: n => `Parabéns${n ? ', ' + n : ''}! Você venceu a Copa Intergaláctica. Novos mundos vão aparecer nas próximas atualizações!`, botao: 'A lenda continua... ⚽' },
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
