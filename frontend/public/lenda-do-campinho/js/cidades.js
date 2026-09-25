/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — MUNDO: midgame (Cairo, Tóquio, Doha, Miami)
   e Europa ampliada (Milão, Munique) + reescala de níveis.
   Brasil 1–50 · Midgame 50–100 · Europa 100–160.
   Carregar DEPOIS de europa.js.
   ============================================================ */

/* ---------- força dos adversários por nível ---------- */
function statsNivel(L) { return { hp: Math.round(0.75 * L * L), atk: Math.round(3.1 * L), def: Math.round(0.7 * L), xp: Math.round(0.55 * L * L) }; }
const ARQUETIPO = {
  rapido: { hp: 0.85, atk: 0.95, def: 0.9, xp: 0.9, vel: 340, aggro: 5, atkCd: 1700 },
  meia: { hp: 0.95, atk: 0.95, def: 0.95, xp: 1.0, vel: 250, aggro: 6, atkCd: 2000, ranged: 'bola' },
  zagueiro: { hp: 1.3, atk: 1.1, def: 1.4, xp: 1.2, vel: 230, aggro: 5, atkCd: 2000, grande: true },
  fanatico: { hp: 0.8, atk: 0.9, def: 0.8, xp: 0.85, vel: 290, aggro: 7, atkCd: 1800, ranged: 'papel', grupo: true },
  chefe: { hp: 28, atk: 1.6, def: 1.2, xp: 40, vel: 270, aggro: 2, atkCd: 1500, ranged: 'bolaforte' },
};
function montaMonstro(id, nome, arq, L, extra = {}) {
  const b = statsNivel(L), a = ARQUETIPO[arq];
  const m = {
    nome, hp: Math.round(b.hp * a.hp), atk: Math.round(b.atk * a.atk), def: Math.round(b.def * a.def), xp: Math.round(b.xp * a.xp),
    vel: a.vel, aggro: a.aggro, atkCd: a.atkCd, ouro: [Math.round(L * 2.2), Math.round(L * 4.5)], loot: [], falas: extra.falas || ['Vem!'], look: {}, nivel: L,
  };
  if (a.ranged) m.ranged = { alcance: 5, dano: Math.round(m.atk * 0.95), cd: arq === 'chefe' ? 2500 : 2500, proj: extra.proj || a.ranged };
  if (a.grupo) m.grupo = 'ultra';
  if (arq === 'chefe') { m.chefe = true; m.respawn = 600000; m.ouro = [L * 150, L * 220]; }
  MONSTROS[id] = Object.assign(m, extra.dados || {});
  if (extra.look) MONSTROS[id].look = Object.assign({ tipo: 'humano', corpo: 'm', grande: arq === 'chefe' || !!a.grande }, extra.look);
  return MONSTROS[id];
}

/* ---------- itens novos e reescala dos antigos da Europa ---------- */
Object.assign(ITENS, {
  chuteira_mundo: { nome: 'Chuteira Mundial', tipo: 'equip', slot: 'chuteira', atk: 23, st: { vel: 6 }, lvl: 55, preco: 22000, venda: 5000, desc: 'Ataque 23, +6 velocidade.' },
  camisa_mundo: { nome: 'Camisa Mundial', tipo: 'equip', slot: 'camisa', def: 18, st: { hp: 120 }, lvl: 55, preco: 24000, venda: 5500, avatar: 'roupa-futebol', desc: '+120 fôlego.', cor: '#e03a3a', cor2: '#ffffff' },
  caneleira_mundo: { nome: 'Caneleira de Bronze', tipo: 'equip', slot: 'perna', def: 9, st: { defesa: 1, hp: 30 }, lvl: 60, preco: 20000, venda: 4500, desc: '+1 defesa, +30 fôlego.', cor: '#c87a3a' },
  pulseira: { nome: 'Pulseira da Sorte', tipo: 'equip', slot: 'acessorio', def: 3, st: { foco: 100, regen: 2, drible: 1, chute: 1 }, lvl: 70, preco: 30000, venda: 7000, desc: '+100 foco, +2 recuperação, +1 drible e chute.' },
  chuteira_tita: { nome: 'Chuteira Titã', tipo: 'equip', slot: 'chuteira', atk: 40, st: { vel: 10, drible: 3 }, lvl: 130, preco: 160000, venda: 38000, desc: 'Ataque 40, +10 velocidade, +3 drible.' },
  camisa_tita: { nome: 'Camisa Titã', tipo: 'equip', slot: 'camisa', def: 28, st: { hp: 270, defesa: 2 }, lvl: 130, preco: 170000, venda: 40000, avatar: 'roupa-futebol', desc: '+270 fôlego, +2 defesa.', cor: '#5a2a9a', cor2: '#d0d0e0' },
  falafel: { nome: 'Falafel', tipo: 'comida', efeito: { dur: 600, regen: 2, atr: { defesa: 7 } }, lvl: 50, preco: 180, venda: 36, desc: 'Do Cairo: +Defesa e recuperação por 10 min.' },
  onigiri: { nome: 'Onigiri', tipo: 'comida', efeito: { dur: 600, regenFoco: 3, atr: { inteligencia: 7 } }, lvl: 62, preco: 260, venda: 52, desc: 'De Tóquio: +Inteligência e foco por 10 min.' },
  tamaras: { nome: 'Tâmaras', tipo: 'comida', efeito: { dur: 600, vel: 12, atr: { folego: 7 } }, lvl: 74, preco: 340, venda: 68, desc: 'De Doha: +Fôlego e velocidade por 10 min.' },
  cachorro_quente: { nome: 'Cachorro-Quente', tipo: 'comida', efeito: { dur: 600, regen: 2.5, atr: { habilidade: 7 } }, lvl: 86, preco: 420, venda: 84, desc: 'De Miami: +Habilidade e recuperação por 10 min.' },
  pizza: { nome: 'Pizza Margherita', tipo: 'comida', efeito: { dur: 900, regen: 4, regenFoco: 3, atr: { defesa: 7, habilidade: 7, inteligencia: 7, folego: 7 } }, lvl: 124, preco: 1600, venda: 320, desc: 'De Milão: +7 em TUDO e recuperação por 15 min.' },
  pretzel: { nome: 'Pretzel', tipo: 'comida', efeito: { dur: 900, regen: 5, atr: { defesa: 10, folego: 10 } }, lvl: 136, preco: 1900, venda: 380, desc: 'De Munique: +Defesa, +Fôlego e muita recuperação por 15 min.' },
  escaravelho: { nome: 'Escaravelho de Ouro', tipo: 'loot', venda: 600, desc: 'Brilha como o sol do Cairo.' },
  leque: { nome: 'Leque Japonês', tipo: 'loot', venda: 900, desc: 'Pintado à mão.' },
  lamparina: { nome: 'Lamparina Dourada', tipo: 'loot', venda: 1300, desc: 'Será que tem um gênio dentro?' },
  oculos_neon: { nome: 'Óculos Neon', tipo: 'loot', venda: 1700, desc: 'Estilo Miami.' },
});
// Europa agora é o fim de jogo: requisitos de nível mais altos
Object.assign(ITENS.chuteira_elite, { lvl: 108 }); Object.assign(ITENS.camisa_elite, { lvl: 108 }); Object.assign(ITENS.caneleira_elite, { lvl: 112 });
Object.assign(ITENS.cachecol, { lvl: 100 }); Object.assign(ITENS.apito_ouro, { lvl: 118 });
Object.assign(ITENS.chuteira_lenda, { lvl: 150, atk: 46, desc: 'LENDÁRIA. Ataque 46, +12 velocidade, +4 chute, +2 drible.' });
Object.assign(ITENS.camisa_lenda, { lvl: 150, def: 34, st: { hp: 420, drible: 3, chute: 3, visao: 3 }, desc: 'LENDÁRIA. +420 fôlego e +3 em tudo.' });
Object.assign(ITENS.pastel_nata, { lvl: 100 }); Object.assign(ITENS.churros, { lvl: 112 }); Object.assign(ITENS.fish_chips, { lvl: 148 });
['i_chuteira_mundo', 'i_camisa_mundo', 'i_caneleira_mundo', 'i_pulseira', 'i_chuteira_tita', 'i_camisa_tita', 'i_falafel', 'i_onigiri', 'i_tamaras', 'i_cachorro_quente', 'i_pizza', 'i_pretzel', 'i_escaravelho', 'i_leque', 'i_lamparina', 'i_oculos_neon',
  'b_cairo1', 'b_cairo2', 'b_toquio1', 'b_toquio2', 'b_doha1', 'b_doha2', 'b_miami1', 'b_miami2', 'b_milao1', 'b_milao2', 'b_munique1', 'b_munique2',
  'piramide', 'palmeira_tamara', 'tenda_mercado', 'jarros', 'obelisco', 'camelo', 'torii', 'cerejeira', 'lanterna_pedra', 'bambu', 'ponte_arco', 'maneki',
  'palmeira_real', 'fonte_moderna', 'carro_luxo', 'duna', 'tenda_beduina', 'lanterna_arabe', 'torre_salva', 'flamingo', 'carro_retro', 'food_truck', 'cadeira_sol', 'neon_palmeira',
  'catedral', 'vespa', 'mesa_italiana', 'cipreste', 'fonte_italiana', 'estatua', 'torre_relogio', 'mesa_bavara', 'pinheiro', 'banca_pretzel', 'maibaum', 'bicicleta',
].forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });
Object.assign(OBJ_INFO, {
  piramide: { w: 5.5, b: 1 }, palmeira_tamara: { w: 2.0, b: 1 }, tenda_mercado: { w: 1.8, b: 1 }, jarros: { w: 1.0, b: 1 }, obelisco: { w: 0.9, b: 1 }, camelo: { w: 1.8, b: 1 },
  torii: { w: 3.0, b: 1 }, cerejeira: { w: 2.2, b: 1 }, lanterna_pedra: { w: 0.8, b: 1 }, bambu: { w: 1.2, b: 1 }, ponte_arco: { w: 2.6, b: 1 }, maneki: { w: 0.8, b: 1 },
  palmeira_real: { w: 2.0, b: 1 }, fonte_moderna: { w: 2.2, b: 1 }, carro_luxo: { w: 2.0, b: 1 }, duna: { w: 2.2, b: 1 }, tenda_beduina: { w: 2.6, b: 1 }, lanterna_arabe: { w: 0.8, b: 1 },
  torre_salva: { w: 1.6, b: 1 }, flamingo: { w: 0.8, b: 1 }, carro_retro: { w: 2.0, b: 1 }, food_truck: { w: 2.6, b: 1 }, cadeira_sol: { w: 1.4, b: 1 }, neon_palmeira: { w: 2.0, b: 1 },
  catedral: { w: 6.0, b: 1 }, vespa: { w: 1.1, b: 1 }, mesa_italiana: { w: 1.4, b: 1 }, cipreste: { w: 1.1, b: 1 }, fonte_italiana: { w: 2.4, b: 1 }, estatua: { w: 1.0, b: 1 },
  torre_relogio: { w: 3.0, b: 1 }, mesa_bavara: { w: 2.0, b: 1 }, pinheiro: { w: 1.8, b: 1 }, banca_pretzel: { w: 1.6, b: 1 }, maibaum: { w: 1.2, b: 1 }, bicicleta: { w: 1.2, b: 1 },
});
Object.keys(OBJ_INFO).forEach(k => { if (OBJ_INFO[k].b) OBJ_BLOQUEIA.add(k); });
['piramide', 'torii', 'catedral', 'torre_relogio', 'tenda_beduina', 'food_truck', 'cerejeira', 'palmeira_real', 'pinheiro', 'cipreste'].forEach(t => OBJ_VISAO.add(t));

/* ---------- gerador de cidade ---------- */
function criaCidade(c) {
  const b = new Construtor(c.id, c.nome, 52, 40, c.base, c.seed);
  bordaInvisivel(b);
  if (c.agua) { b.ret(1, 35, 50, 4, CH.AGUA); b.ret(1, 33, 50, 2, c.cais || CH.AREIA); }
  b.ret(1, 16, 50, 2, c.rua); b.ret(12, 1, 2, 32, c.rua); b.ret(34, 1, 2, 32, c.rua);
  // aeroporto
  b.predio('b_aeroporto', 2, 27, 8, 4); b.npc('comissaria', 6, 32);
  b.m.inicio = { x: 8, y: 32 }; b.m.renasce = { x: 9, y: 32 };
  // prédios
  const [p1, p2] = c.predios;
  [[1, 1], [6, 1], [15, 1], [21, 1], [27, 1], [1, 10], [6, 10], [15, 10], [24, 10]].forEach(([x, y], i) => b.predio(i % 2 ? p2 : p1, x, y, 5, 3));
  // loja e mestre/líder
  b.npc('loja_' + c.id, 17, 14); c.enfeitesLoja.forEach(([t, dx]) => b.obj(17 + dx, 14, t));
  // campo
  b.campo(16, 20, 17, 10, c.campo || CH.CAMPO);
  // marco da cidade
  objLargo(b, 44, 23, c.marco, c.marcoLarg || 5);
  // zona NE: bairro de torcida (hostil) ou área temática
  if (c.fanatico) { bairroHostil(b, 37, 1, 14, 14, c.zona, c.fanatico, 8); b.placa(39, 17, `${c.zona.toUpperCase()} — cuidado: os fanáticos andam em grupo`); }
  else { b.ret(37, 1, 14, 14, c.zonaChao || c.base); b.espalha(c.props, 14, 38, 2, 12, 12); b.spawn(c.rapido, 43, 7, 5, 4); (b.m.zonas = b.m.zonas || []).push({ x: 37, y: 1, w: 14, h: 14, nome: c.zona, hostil: false }); }
  b.npc('lider_' + c.id, 41, 17);
  // chefão (canto sudeste)
  b.spawn(c.chefe, 46, c.agua ? 32 : 34, 1, 1); b.placa(43, c.agua ? 31 : 33, `Território de ${MONSTROS[c.chefe].nome.toUpperCase()}`);
  // adversários
  b.spawn(c.zagueiro, 24, 24, 4, 4); b.spawn(c.meia, 20, 22, 3, 3); b.spawn(c.meia, 29, 27, 2, 2);
  b.spawn(c.rapido, 8, 22, 5, 4); b.spawn(c.rapido, 42, 28, 4, 3); b.spawn(c.meia, 24, 6, 3, 3);
  b.npc('quadro', 11, 18);
  for (let x = 4; x < 50; x += 7) { if (b.livre(x, 15)) b.obj(x, 15, c.poste || 'poste3'); if (b.livre(x, 18)) b.obj(x, 18, c.poste || 'poste3'); }
  b.espalha(c.props, 12, 2, 19, 48, 13);
  b.espalha(c.arvores, 10, 2, 19, 48, 13);
  return b.m;
}

/* ---------- as cidades ---------- */
const CIDADES = [
  { id: 'cairo', nome: 'Cairo — Às margens do Nilo', L: 56, base: CH.AREIA, rua: CH.PEDRA, seed: 901, agua: true, cais: CH.PEDRA, predios: ['b_cairo1', 'b_cairo2'], marco: 'piramide', marcoLarg: 5,
    props: ['tenda_mercado', 'jarros', 'obelisco', 'camelo', 'palmeira_tamara'], arvores: ['palmeira_tamara'], enfeitesLoja: [['tenda_mercado', 2], ['jarros', -2]], zona: 'Arquibancada Norte', comida: 'falafel', lootEsp: 'escaravelho',
    nomes: { rapido: 'Ponta das Pirâmides', meia: 'Meia do Nilo', zagueiro: 'Zagueiro Esfinge', fanatico: 'Fanático da Arquibancada', chefe: 'O Faraó da Bola' },
    cores: ['#e0203a', '#ffffff'], chefeLook: { pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-camisa10-ouro', baixo: 'baixo-shorts', chapeu: 'chapeu-coroa', pescoco: 'pescoco-medalha' },
    loja: { nome: 'Seu Karim do Mercado', ola: 'Ahlan! Falafel quentinho e equipamento de primeira para o craque viajante!', look: { pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-xadrez', corRoupa: '#c8903a', baixo: 'baixo-jeans' } },
    lider: { nome: 'Nour, treinadora do bairro', ola: 'Aqui o futebol é paixão! Mas paixão não pode virar confusão.', look: { corpo: 'f', pele: 'pele-negra', cabelo: 'cabelo-coque', corCabelo: 'preto', roupa: 'roupa-moletom', corRoupa: '#e0203a', baixo: 'baixo-jeans', pescoco: 'pescoco-apito' } } },
  { id: 'toquio', nome: 'Tóquio — Distrito Neon', L: 68, base: CH.CALCADA, rua: CH.ASFALTO, seed: 902, predios: ['b_toquio1', 'b_toquio2'], marco: 'torii', marcoLarg: 3,
    props: ['lanterna_pedra', 'bambu', 'maneki', 'cerejeira', 'ponte_arco'], arvores: ['cerejeira', 'bambu'], enfeitesLoja: [['lanterna_pedra', 2], ['maneki', -2]], zona: 'Jardim Zen', comida: 'onigiri', lootEsp: 'leque',
    nomes: { rapido: 'Ponta Ninja', meia: 'Meia Origami', zagueiro: 'Zagueiro Sumô', chefe: 'O Sensei do Drible' },
    cores: ['#1a3ab9', '#ffffff'], chefeLook: { pele: 'pele-clara', cabelo: 'cabelo-coque', corCabelo: 'grisalho', roupa: 'roupa-futebol', corRoupa: '#1a1a2a', baixo: 'baixo-shorts', chapeu: 'chapeu-faixa', rosto: 'rosto-escuros' },
    loja: { nome: 'Dona Yuki do Onigiri', ola: 'Irasshaimase! Onigiri fresquinho para dar foco no treino.', look: { corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-liso-longo', corCabelo: 'preto', roupa: 'roupa-camiseta', corRoupa: '#e05a8a', baixo: 'baixo-saia' } },
    lider: { nome: 'Mestre Kenji', ola: 'Disciplina, respeito e treino. Assim nasce um craque.', look: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-moletom', corRoupa: '#1a1a2a', baixo: 'baixo-moletom', rosto: 'rosto-redondos' } } },
  { id: 'doha', nome: 'Doha — Cidade das Dunas', L: 80, base: CH.AREIA, rua: CH.ASFALTO, seed: 903, agua: true, cais: CH.CALCADA, predios: ['b_doha1', 'b_doha2'], marco: 'fonte_moderna', marcoLarg: 3,
    props: ['duna', 'tenda_beduina', 'lanterna_arabe', 'carro_luxo', 'palmeira_real'], arvores: ['palmeira_real'], enfeitesLoja: [['lanterna_arabe', 2], ['palmeira_real', -3]], zona: 'Dunas Douradas', comida: 'tamaras', lootEsp: 'lamparina', zonaChao: CH.AREIA,
    nomes: { rapido: 'Ponta do Deserto', meia: 'Meia Miragem', zagueiro: 'Zagueiro Duna', chefe: 'O Falcão do Deserto' },
    cores: ['#8a1a3a', '#ffffff'], chefeLook: { pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#8a1a3a', baixo: 'baixo-shorts', costas: 'costas-capa', rosto: 'rosto-escuros' },
    loja: { nome: 'Seu Rashid das Tâmaras', ola: 'Tâmaras doces e equipamento de luxo. Seja bem-vindo!', look: { pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-terno', corRoupa: '#f4f4f8', baixo: 'baixo-jeans' } },
    lider: { nome: 'Layla, capitã da seleção feminina', ola: 'Aqui treinamos no calor de 40 graus. Aguenta?', look: { corpo: 'f', pele: 'pele-morena', cabelo: 'cabelo-coque', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#8a1a3a', baixo: 'baixo-shorts', chapeu: 'chapeu-faixa' } } },
  { id: 'miami', nome: 'Miami — Ocean Drive', L: 93, base: CH.CALCADA, rua: CH.ASFALTO, seed: 904, agua: true, cais: CH.AREIA, predios: ['b_miami1', 'b_miami2'], marco: 'torre_salva', marcoLarg: 2,
    props: ['flamingo', 'carro_retro', 'food_truck', 'cadeira_sol', 'neon_palmeira'], arvores: ['neon_palmeira', 'palmeira_real'], enfeitesLoja: [['food_truck', 3], ['flamingo', -2]], zona: 'Calçadão Neon', comida: 'cachorro_quente', lootEsp: 'oculos_neon',
    nomes: { rapido: 'Ponta Surfista', meia: 'Meia Estrela de TV', zagueiro: 'Zagueiro Fisiculturista', chefe: 'O Showman de Miami' },
    cores: ['#ff5ad0', '#3ac8e8'], chefeLook: { pele: 'pele-clara', cabelo: 'cabelo-topete', corCabelo: 'loiro', roupa: 'roupa-rockstar-ouro', baixo: 'baixo-praia', rosto: 'rosto-estrela', mao: 'mao-microfone' },
    loja: { nome: 'Tio Joe do Food Truck', ola: 'Hey, buddy! Cachorro-quente e chuteira nova, tudo aqui!', look: { pele: 'pele-negra', cabelo: 'cabelo-black-power', corCabelo: 'preto', roupa: 'roupa-regata', baixo: 'baixo-praia', chapeu: 'chapeu-bone', pescoco: 'pescoco-havaiano' } },
    lider: { nome: 'Coach Sofia', ola: 'Nos Estados Unidos o futebol está crescendo. Me ajuda a mostrar como se joga!', look: { corpo: 'f', pele: 'pele-media', cabelo: 'cabelo-liso-longo', corCabelo: 'loiro', roupa: 'roupa-moletom', corRoupa: '#3ac8e8', baixo: 'baixo-moletom', pescoco: 'pescoco-apito', chapeu: 'chapeu-bone' } } },
  { id: 'milao', nome: 'Milão — Piazza e Curva', L: 130, base: CH.PARALELO, rua: CH.CALCADA_PT, seed: 905, predios: ['b_milao1', 'b_milao2'], marco: 'catedral', marcoLarg: 5,
    props: ['vespa', 'mesa_italiana', 'fonte_italiana', 'estatua', 'cipreste'], arvores: ['cipreste'], enfeitesLoja: [['mesa_italiana', 2], ['vespa', -2]], zona: 'Curva dos Ultras', comida: 'pizza', lootEsp: 'ingresso',
    nomes: { rapido: 'Ala Elegante', meia: 'Regista de Milão', zagueiro: 'Líbero Catenaccio', fanatico: 'Ultra da Curva', chefe: 'Il Maestro' },
    cores: ['#1a1a1a', '#1a3ab9'], chefeLook: { pele: 'pele-clara', cabelo: 'cabelo-liso-longo', corCabelo: 'castanho', roupa: 'roupa-smoking-ouro', baixo: 'baixo-shorts', chapeu: 'chapeu-louros', rosto: 'rosto-escuros' },
    loja: { nome: 'Nonna Giulia da Pizzaria', ola: 'Mangia, mangia! Craque bem alimentado joga melhor!', look: { corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-coque', corCabelo: 'grisalho', roupa: 'roupa-xadrez', corRoupa: '#c01a2a', baixo: 'baixo-saia' } },
    lider: { nome: 'Padre Marco, do oratório', ola: 'Os ultras da Curva são meninos do bairro. Só precisam de um bom exemplo.', look: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-terno', corRoupa: '#1a1a2a', baixo: 'baixo-jeans', rosto: 'rosto-redondos' } } },
  { id: 'munique', nome: 'Munique — Praça do Relógio', L: 142, base: CH.PARALELO, rua: CH.ASFALTO, seed: 906, predios: ['b_munique1', 'b_munique2'], marco: 'torre_relogio', marcoLarg: 3,
    props: ['mesa_bavara', 'banca_pretzel', 'maibaum', 'bicicleta', 'pinheiro'], arvores: ['pinheiro'], enfeitesLoja: [['banca_pretzel', 2], ['bicicleta', -2]], zona: 'Parque Alpino', comida: 'pretzel', lootEsp: 'cronometro', zonaChao: CH.GRAMA,
    nomes: { rapido: 'Ponta Relâmpago Bávaro', meia: 'Meia Engrenagem', zagueiro: 'Zagueiro Muralha Alpina', chefe: 'O General Bávaro' },
    cores: ['#c01a2a', '#ffffff'], chefeLook: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'loiro', roupa: 'roupa-cavaleiro-ouro', baixo: 'baixo-shorts', chapeu: 'chapeu-espartano-ouro' },
    loja: { nome: 'Frau Helga da Padaria', ola: 'Guten Tag! Pretzel quentinho saindo do forno!', look: { corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-liso-longo', corCabelo: 'loiro', roupa: 'roupa-xadrez', corRoupa: '#3a6ad9', baixo: 'baixo-saia' } },
    lider: { nome: 'Treinador Hans', ola: 'Aqui tudo é organizado: treino, tática e muita dedicação.', look: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'ruivo', roupa: 'roupa-moletom', corRoupa: '#c01a2a', baixo: 'baixo-moletom', pescoco: 'pescoco-apito' } } },
];

const GEAR_POR_CIDADE = {
  cairo: ['chuteira_mundo', 'camisa_mundo', 'caneleira_mundo'], toquio: ['chuteira_mundo', 'camisa_mundo', 'caneleira_mundo', 'pulseira'], doha: ['camisa_mundo', 'caneleira_mundo', 'pulseira'], miami: ['chuteira_mundo', 'camisa_mundo', 'pulseira'],
  milao: ['chuteira_elite', 'camisa_elite', 'caneleira_elite', 'chuteira_tita'], munique: ['chuteira_elite', 'camisa_tita', 'chuteira_tita', 'caneleira_elite'],
};
const LOOT_GEAR = { cairo: 'chuteira_mundo', toquio: 'pulseira', doha: 'camisa_mundo', miami: 'pulseira', milao: 'chuteira_tita', munique: 'camisa_tita' };

for (const c of CIDADES) {
  const L = c.L, id = c.id, cor = c.cores[0];
  const lk = (base) => Object.assign({ roupa: 'roupa-futebol', corRoupa: cor, baixo: 'baixo-shorts' }, base);
  const rap = montaMonstro(id + '_rapido', c.nomes.rapido, 'rapido', L, { falas: ['Rápido demais!', 'Pela ponta!'], look: lk({ pele: 'pele-media', cabelo: 'cabelo-topete', corCabelo: 'castanho' }) });
  const mei = montaMonstro(id + '_meia', c.nomes.meia, 'meia', L, { falas: ['Lançamento!', 'Visão de jogo!'], look: lk({ corpo: 'f', pele: 'pele-morena', cabelo: 'cabelo-coque', corCabelo: 'preto' }) });
  const zag = montaMonstro(id + '_zagueiro', c.nomes.zagueiro, 'zagueiro', L, { falas: ['Aqui não passa!', 'Muralha!'], look: lk({ pele: 'pele-negra', cabelo: 'cabelo-black-power', corCabelo: 'preto' }) });
  const che = montaMonstro(id + '_chefe', c.nomes.chefe, 'chefe', L + 4, { falas: ['Você não passa!', 'Mostra o que o Brasil tem!'], look: c.chefeLook });
  rap.loot = [['couro', 0.35, 1, 2], [c.comida, 0.06, 1, 1], [c.lootEsp, 0.08, 1, 1], [LOOT_GEAR[id], 0.003, 1, 1]];
  mei.loot = [['couro', 0.3, 1, 2], ['fio_ouro', 0.025, 1, 1], [c.comida, 0.06, 1, 1], [c.lootEsp, 0.06, 1, 1]];
  zag.loot = [['couro', 0.45, 1, 3], [c.lootEsp, 0.1, 1, 1], [LOOT_GEAR[id], 0.004, 1, 1]];
  che.loot = [['fio_ouro', 1, 2, 4], [LOOT_GEAR[id], 0.4, 1, 1], ['apito_ouro', L >= 100 ? 0.1 : 0, 1, 1], [c.lootEsp, 1, 2, 3]];
  c.rapido = id + '_rapido'; c.meia = id + '_meia'; c.zagueiro = id + '_zagueiro'; c.chefe = id + '_chefe';
  if (c.nomes.fanatico) {
    const fan = montaMonstro(id + '_fanatico', c.nomes.fanatico, 'fanatico', L, { proj: id === 'milao' ? 'copo' : 'papel', falas: ['Uuuuh!', 'Esse lugar é nosso!', 'Vaia!'], look: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'castanho', roupa: 'roupa-moletom', corRoupa: cor, baixo: 'baixo-jeans', chapeu: 'chapeu-gorro', pescoco: 'pescoco-cachecol', rosto: 'rosto-pintura' } });
    fan.loot = [['megafone', 0.07, 1, 1], ['retalho', 0.5, 2, 4]]; c.fanatico = id + '_fanatico';
  }
  NPCS['loja_' + id] = { nome: c.loja.nome, ola: c.loja.ola, loja: [c.comida, 'agua_coco', 'vitamina', ...GEAR_POR_CIDADE[id]], look: Object.assign({ tipo: 'humano', corpo: 'm', alt: 1.72 }, c.loja.look) };
  NPCS['lider_' + id] = { nome: c.lider.nome, ola: c.lider.ola, look: Object.assign({ tipo: 'humano', corpo: 'm', alt: 1.72 }, c.lider.look) };
  MAPAS_DEF[id] = () => criaCidade(c);
  DESAFIOS[id] = [[c.rapido, 150], [c.meia, 150], [c.zagueiro, 150]].concat(c.fanatico ? [[c.fanatico, 150]] : []);
  // missões
  const xpNivel = x => xpPara(x + 1) - xpPara(x);
  const cidadeCurta = c.nome.split(' —')[0];
  MISSOES.push(
    { id: id + '_m1', npc: 'loja_' + id, titulo: `Bem-vindo a ${cidadeCurta}`, lvl: L - 6, texto: `${c.nomes.rapido}s correm por toda a cidade. Mostra o futebol brasileiro: passe por 30 deles.`, req: { kill: c.rapido, n: 30 }, rec: { xp: Math.round(xpNivel(L) * 0.9), ouro: L * 120, itens: [[c.comida, 5]] }, fim: `${cidadeCurta} já sabe o seu nome!` },
    { id: id + '_m2', npc: 'loja_' + id, titulo: 'A muralha local', lvl: L - 3, pre: id + '_m1', texto: `Os ${c.nomes.zagueiro}s são a defesa mais dura daqui. Vença 30.`, req: { kill: c.zagueiro, n: 30 }, rec: { xp: Math.round(xpNivel(L) * 1.1), ouro: L * 160, itens: [[GEAR_POR_CIDADE[id][0], 1]] }, fim: 'Toma um equipamento digno de você!' },
    c.fanatico
      ? { id: id + '_m3', npc: 'lider_' + id, titulo: `Missão da Paz: ${c.zona}`, lvl: L - 4, texto: `Os fanáticos da ${c.zona} intimidam quem passa. Vença 25 no jogo limpo e mostre que rivalidade é dentro de campo.`, req: { kill: c.fanatico, n: 25 }, rec: { xp: Math.round(xpNivel(L) * 1.1), ouro: L * 150, evento: 'paz', itens: [[L < 100 ? 'pulseira' : 'cachecol', 1]] }, fim: 'Hoje eles cantaram em vez de vaiar. Torcer é festa!' }
      : { id: id + '_m3', npc: 'lider_' + id, titulo: `Treino em ${cidadeCurta}`, lvl: L - 4, texto: `Os ${c.nomes.meia}s leem o jogo como ninguém. Vença 30 para aprender com eles.`, req: { kill: c.meia, n: 30 }, rec: { xp: Math.round(xpNivel(L) * 1.1), ouro: L * 150, itens: [['pulseira', 1]] }, fim: 'Você aprendeu muito aqui!' },
    { id: id + '_m4', npc: 'lider_' + id, titulo: c.nomes.chefe, lvl: L + 2, pre: id + '_m3', texto: `${c.nomes.chefe.toUpperCase()} manda no canto sudeste da cidade. Vença e a próxima liga vai te chamar.`, req: { kill: c.chefe, n: 1 }, rec: { xp: Math.round(xpNivel(L) * 3), ouro: L * 400, flag: 'venceu_' + id }, fim: `LENDÁRIO! ${cidadeCurta} conquistada. Fale com o Empresário Rodrigues sobre a próxima liga!` },
  );
}

/* ---------- Europa reescalonada (100–160) ---------- */
const NIVEL_EUROPA = { lisboa: 106, madri: 118, londres: 154 };
const EUR_ARQ = {
  ponta_alfama: ['lisboa', 'rapido'], medio_chiado: ['lisboa', 'meia'], central_belem: ['lisboa', 'zagueiro'], ultra_lisboa: ['lisboa', 'fanatico'], capitao_tejo: ['lisboa', 'chefe'],
  extremo_madri: ['madri', 'rapido'], pivote_madri: ['madri', 'meia'], zagueiro_toureiro: ['madri', 'zagueiro'], ultra_madri: ['madri', 'fanatico'], galactico: ['madri', 'chefe'],
  ponta_camden: ['londres', 'rapido'], box2box: ['londres', 'meia'], zagueiro_ferro: ['londres', 'zagueiro'], fanatico_eastend: ['londres', 'fanatico'], lorde: ['londres', 'chefe'],
};
for (const [id, [cid, arq]] of Object.entries(EUR_ARQ)) {
  const L = NIVEL_EUROPA[cid] + (arq === 'chefe' ? 4 : 0); const b = statsNivel(L), a = ARQUETIPO[arq]; const m = MONSTROS[id];
  m.nivel = L; m.hp = Math.round(b.hp * a.hp * (id === 'lorde' ? 1.5 : 1)); m.atk = Math.round(b.atk * a.atk); m.def = Math.round(b.def * a.def); m.xp = Math.round(b.xp * a.xp);
  if (m.ranged) m.ranged.dano = Math.round(m.atk * 0.95);
  m.ouro = arq === 'chefe' ? [L * 150, L * 220] : [Math.round(L * 2.2), Math.round(L * 4.5)];
}
const SOBE_EUROPA = { l_: 50, m_: 47, o_: 68 };
for (const q of MISSOES) for (const [pref, d] of Object.entries(SOBE_EUROPA)) if (q.id.startsWith(pref) && q.lvl < 100) q.lvl += d;
for (const q of MISSOES) if (/^(l_|m_|o_)/.test(q.id) && q.rec.xp) q.rec.xp = Math.round(q.rec.xp * 3);
Object.assign(VOOS, {
  cairo: { nome: 'Cairo, Egito', lvl: 50, preco: 2000 },
  toquio: { nome: 'Tóquio, Japão', lvl: 62, preco: 3000 },
  doha: { nome: 'Doha, Catar', lvl: 74, preco: 4000 },
  miami: { nome: 'Miami, Estados Unidos', lvl: 86, preco: 5000 },
  lisboa: { nome: 'Lisboa, Portugal', lvl: 100, preco: 7000 },
  madri: { nome: 'Madri, Espanha', lvl: 112, preco: 9000 },
  milao: { nome: 'Milão, Itália', lvl: 124, preco: 11000 },
  munique: { nome: 'Munique, Alemanha', lvl: 136, preco: 13000 },
  londres: { nome: 'Londres, Inglaterra', lvl: 148, preco: 16000 },
});
// ordem de exibição dos voos
{ const ord = ['cidade', 'cairo', 'toquio', 'doha', 'miami', 'lisboa', 'madri', 'milao', 'munique', 'londres']; const cp = Object.assign({}, VOOS); for (const k of Object.keys(VOOS)) delete VOOS[k]; for (const k of ord) VOOS[k] = cp[k]; }
