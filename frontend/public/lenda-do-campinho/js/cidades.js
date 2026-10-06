/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — MUNDO: midgame (Cairo, Doha, Tóquio, Miami),
   América do Sul (Buenos Aires, Rio) e Europa + reescala de níveis.
   v233: a ORDEM segue a relevância do futebol de cada país:
   Cairo 56 · Doha 68 · Tóquio 80 · Miami 93 · Buenos Aires 106 · Rio 118 ·
   Lisboa 130 · Paris 142 · Munique 154 · Milão 162 · Madri 170 · Londres 186.
   Carregar DEPOIS de europa.js.
   ============================================================ */

/* ---------- força dos adversários por nível ---------- */
function statsNivel(L) { return { hp: Math.round(0.75 * L * L), atk: Math.round(3.1 * L), def: Math.round(0.7 * L), xp: Math.round(0.55 * L * L) }; }
const ARQUETIPO = {
  rapido: { hp: 0.85, atk: 0.95, def: 0.9, xp: 0.9, vel: 340, aggro: 5, atkCd: 1700 },
  meia: { hp: 0.95, atk: 0.95, def: 0.95, xp: 1.0, vel: 250, aggro: 6, atkCd: 2000, ranged: 'bola' },
  zagueiro: { hp: 1.3, atk: 1.1, def: 1.4, xp: 1.2, vel: 230, aggro: 5, atkCd: 2000, grande: true },
  fanatico: { hp: 0.8, atk: 0.9, def: 0.8, xp: 0.85, vel: 290, aggro: 7, atkCd: 1800, ranged: 'papel', grupo: true },
  chefe: { hp: 18, atk: 1.6, def: 1.2, xp: 40, vel: 270, aggro: 2, atkCd: 1500, ranged: 'bolaforte' }, // vida 28→18: sozinho levava 3–4 min (teste de balanceamento)
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
// v153: Paris
Object.assign(ITENS, {
  croissant: { nome: 'Croissant', tipo: 'comida', efeito: { dur: 900, regen: 5, atr: { habilidade: 9, inteligencia: 9 } }, lvl: 156, preco: 2200, venda: 440, desc: 'De Paris: +Habilidade, +Inteligência e recuperação por 15 min.' },
  macarons: { nome: 'Caixinha de Macarons', tipo: 'comida', efeito: { dur: 900, regen: 4, regenFoco: 4, vel: 8, atr: { defesa: 9, folego: 9 } }, lvl: 160, preco: 2600, venda: 520, desc: 'De Paris: +Defesa, +Fôlego, foco e velocidade por 15 min.' },
  boina: { nome: 'Boina de Artista', tipo: 'loot', venda: 2200, desc: 'Com um pincel ainda sujo de tinta.' },
  mini_eiffel: { nome: 'Torre Eiffel de Lembrança', tipo: 'loot', venda: 1900, desc: 'Uma miniatura dourada da torre mais famosa do mundo.' },
});
Object.assign(OBJ_INFO, { banca_livros: { w: 1.9, b: 1 }, metro_paris: { w: 1.9, b: 1 }, carrinho_crepe: { w: 1.4, b: 1 }, cavalete: { w: 1.1, b: 1 } });
Object.assign(PORTAS, { b_paris1: { x: 0.5, y: 0.93 }, b_paris2: { x: 0.5, y: 0.93 } });
['i_croissant', 'i_macarons', 'i_boina', 'i_mini_eiffel', 'b_paris1', 'b_paris2', 'banca_livros', 'metro_paris', 'carrinho_crepe', 'cavalete'].forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });
// v234: Santos — pastel com caldo de cana, sacas de café do porto e a estatueta do Rei
Object.assign(ITENS, {
  pastel_caldo: { nome: 'Pastel com Caldo de Cana', tipo: 'comida', efeito: { dur: 900, regen: 6, regenFoco: 4, vel: 10, atr: { habilidade: 10, folego: 10, inteligencia: 10 } }, lvl: 182, preco: 3400, venda: 680, desc: 'De Santos: +Habilidade, +Fôlego, +Inteligência, velocidade, foco e recuperação por 15 min.' },
  saca_cafe: { nome: 'Saca de Café', tipo: 'loot', venda: 2600, desc: 'Por mais de cem anos, o café do Brasil saiu pelo Porto de Santos para o mundo inteiro.' },
  estatueta_rei: { nome: 'Estatueta Dourada do Rei', tipo: 'chave', desc: 'Presente do Museu Pelé para quem enfrentou o Esquadrão de 1962 na Vila Belmiro. O Rei do Futebol mora no coração de quem joga com alegria!' },
});
['i_pastel_caldo', 'i_saca_cafe', 'i_estatueta_rei', 'b_santos1', 'b_santos2', 'guindaste_porto', 'sacas_cafe', 'jardim_orla', 'carrinho_caldo', 'mureta_orla', 'pilar_orla', 'farol_orla', 'pavilhao_orla', 't_calcada_santos', 'mureta_reta',
  'b_santos3', 'b_santos4', 'b_santos5', 'b_santos6', 'b_santos7', 'b_santos8', 'b_santos9'].forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });
Object.assign(OBJ_INFO, { guindaste_porto: { w: 1.6, b: 1 }, sacas_cafe: { w: 1.2, b: 1 }, jardim_orla: { w: 1.5, b: 1 }, carrinho_caldo: { w: 1.4, b: 1 }, mureta_orla: { w: 1.12, b: 1 }, mureta_reta: { w: 1.0, b: 1 }, pilar_orla: { w: 0.7, b: 1 }, farol_orla: { w: 1.1, b: 1 }, pavilhao_orla: { w: 2.4, b: 1 } });
Object.assign(PORTAS, { b_santos1: { x: 0.5, y: 0.93 }, b_santos2: { x: 0.5, y: 0.93 }, b_santos3: { x: 0.5, y: 0.93 }, b_santos4: { x: 0.5, y: 0.93 }, b_santos5: { x: 0.5, y: 0.93 },
  b_santos6: { x: 0.5, y: 0.93 }, b_santos7: { x: 0.5, y: 0.93 }, b_santos8: { x: 0.5, y: 0.93 }, b_santos9: { x: 0.5, y: 0.93 } });
// Buenos Aires e Rio de Janeiro (v233: níveis 106 e 118; os itens Galáxia viraram equipamento de Madri e Londres)
Object.assign(ITENS, {
  chuteira_galaxia: { nome: 'Chuteira Galáxia', tipo: 'equip', slot: 'chuteira', atk: 52, st: { vel: 14, drible: 3 }, lvl: 172, preco: 420000, venda: 90000, desc: 'Ataque 52, +14 velocidade, +3 drible.' },
  camisa_galaxia: { nome: 'Camisa Galáxia', tipo: 'equip', slot: 'camisa', def: 38, st: { hp: 500, defesa: 2 }, lvl: 172, preco: 480000, venda: 100000, avatar: 'roupa-futebol', desc: '+500 fôlego, +2 defesa.', cor: '#1a1450', cor2: '#3ae0ff' },
  caneleira_galaxia: { nome: 'Caneleira Galáxia', tipo: 'equip', slot: 'perna', def: 18, st: { defesa: 4, hp: 220 }, lvl: 178, preco: 380000, venda: 80000, desc: '+4 defesa, +220 fôlego.', cor: '#3a1a6a' },
  medalha_copa: { nome: 'Medalha da Copa', tipo: 'equip', slot: 'acessorio', def: 8, st: { hp: 400, foco: 250, regen: 5 }, lvl: 188, preco: 600000, venda: 130000, avatar: 'pescoco-medalha', desc: '+400 fôlego, +250 foco, +5 recuperação.' },
  empanada: { nome: 'Empanadas', tipo: 'comida', efeito: { dur: 900, regen: 5, atr: { habilidade: 10, folego: 8 } }, lvl: 165, preco: 2400, venda: 480, desc: 'De Buenos Aires: +Habilidade, +Fôlego e recuperação por 15 min.' },
  biscoito_mate: { nome: 'Biscoito e Mate Gelado', tipo: 'comida', efeito: { dur: 900, regen: 6, regenFoco: 4, vel: 10, atr: { defesa: 10, inteligencia: 10 } }, lvl: 180, preco: 3200, venda: 640, desc: 'Da praia do Rio: +Defesa, +Inteligência, velocidade e recuperação por 15 min.' },
  bandoneon: { nome: 'Bandoneón', tipo: 'loot', venda: 2400, desc: 'O acordeão do tango. Toca sozinho de saudade.' },
  pandeiro: { nome: 'Pandeiro', tipo: 'loot', venda: 3000, desc: 'Ninguém fica parado quando ele toca.' },
  insignia_estrela: { nome: 'Insígnia de Estrela', tipo: 'loot', venda: 1800, desc: 'Presente de torcedor para quem joga bonito.' },
  bandeira_verde: { nome: 'Bandeira Verde-Amarela', tipo: 'loot', venda: 2000, desc: 'Tremulou na arquibancada da Geral.' },
  taca_copa: { nome: 'Taça da Copa do Mundo', tipo: 'chave', desc: 'O maior troféu do futebol. Você é CAMPEÃO DO MUNDO.' },
});
Object.assign(OBJ_INFO, { estatua_tango: { w: 1.5, b: 1 }, arcos_lapa: { w: 6.5, b: 1 }, mural_tango: { w: 2.2, b: 1 }, banca_empanada: { w: 1.8, b: 1 }, carrinho_mate: { w: 1.6, b: 1 }, bondinho: { w: 2.6, b: 1 } });
['i_chuteira_galaxia', 'i_camisa_galaxia', 'i_caneleira_galaxia', 'i_medalha_copa', 'i_empanada', 'i_biscoito_mate', 'i_bandoneon', 'i_pandeiro', 'i_insignia_estrela', 'i_bandeira_verde', 'i_taca_copa', 'i_bola_coroa',
  'b_buenos1', 'b_buenos2', 'b_rio1', 'b_rio2', 'estatua_tango', 'arcos_lapa', 'mural_tango', 'banca_empanada', 'carrinho_mate', 'bondinho'].forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });
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
['arcos_lapa', 'bondinho', 'estatua_tango'].forEach(t => OBJ_VISAO.add(t));
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
  // v153: nada de banca ou árvore dentro do campo (o espalha podia cair no gramado)
  for (const cp of b.m.campos) for (let j = cp.y; j < cp.y + cp.h; j++) for (let i = cp.x; i < cp.x + cp.w; i++) { const o = b.m.obj[j * b.m.w + i]; if (o && o.t !== 'gol') b.m.obj[j * b.m.w + i] = null; }
  return b.m;
}

/* ---------- as cidades ---------- */
const CIDADES = [
  { id: 'cairo', nome: 'Cairo — Às margens do Nilo', L: 56, base: CH.AREIA, rua: CH.PEDRA, seed: 901, agua: true, cais: CH.PEDRA, predios: ['b_cairo1', 'b_cairo2'], marco: 'piramide', marcoLarg: 5,
    props: ['tenda_mercado', 'jarros', 'obelisco', 'camelo', 'palmeira_tamara'], arvores: ['palmeira_tamara'], enfeitesLoja: [['tenda_mercado', 2], ['jarros', -2]], zona: 'Arquibancada Norte', comida: 'falafel', lootEsp: 'escaravelho',
    nomes: { rapido: 'Corredor das Pirâmides', meia: 'Escriba do Nilo', zagueiro: 'Guardião da Esfinge', fanatico: 'Tamboreiro do Bazar', chefe: 'O Faraó da Bola' },
    cores: ['#e0203a', '#ffffff'], chefeLook: { pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-camisa10-ouro', baixo: 'baixo-shorts', chapeu: 'chapeu-coroa', pescoco: 'pescoco-medalha' },
    loja: { nome: 'Seu Karim do Mercado', ola: 'Ahlan! Falafel quentinho e equipamento de primeira para o craque viajante!', look: { pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-xadrez', corRoupa: '#c8903a', baixo: 'baixo-jeans' } },
    lider: { nome: 'Nour, treinadora do bairro', ola: 'Aqui o futebol é paixão! Mas paixão não pode virar confusão.', look: { corpo: 'f', pele: 'pele-negra', cabelo: 'cabelo-coque', corCabelo: 'preto', roupa: 'roupa-moletom', corRoupa: '#e0203a', baixo: 'baixo-jeans', pescoco: 'pescoco-apito' } } },
  { id: 'toquio', nome: 'Tóquio — Distrito Neon', L: 80, base: CH.CALCADA, rua: CH.ASFALTO, seed: 902, predios: ['b_toquio1', 'b_toquio2'], marco: 'torii', marcoLarg: 3,
    props: ['lanterna_pedra', 'bambu', 'maneki', 'cerejeira', 'ponte_arco'], arvores: ['cerejeira', 'bambu'], enfeitesLoja: [['lanterna_pedra', 2], ['maneki', -2]], zona: 'Jardim Zen', comida: 'onigiri', lootEsp: 'leque',
    nomes: { rapido: 'Ninja da Linha de Fundo', meia: 'Mestra do Origami', zagueiro: 'Lutador de Sumô', chefe: 'O Sensei do Drible' },
    cores: ['#1a3ab9', '#ffffff'], chefeLook: { pele: 'pele-clara', cabelo: 'cabelo-coque', corCabelo: 'grisalho', roupa: 'roupa-futebol', corRoupa: '#1a1a2a', baixo: 'baixo-shorts', chapeu: 'chapeu-faixa', rosto: 'rosto-escuros' },
    loja: { nome: 'Dona Yuki do Onigiri', ola: 'Irasshaimase! Onigiri fresquinho para dar foco no treino.', look: { corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-liso-longo', corCabelo: 'preto', roupa: 'roupa-camiseta', corRoupa: '#e05a8a', baixo: 'baixo-saia' } },
    lider: { nome: 'Mestre Kenji', ola: 'Disciplina, respeito e treino. Assim nasce um craque.', look: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-moletom', corRoupa: '#1a1a2a', baixo: 'baixo-moletom', rosto: 'rosto-redondos' } } },
  { id: 'doha', nome: 'Doha — Cidade das Dunas', L: 68, base: CH.AREIA, rua: CH.ASFALTO, seed: 903, agua: true, cais: CH.CALCADA, predios: ['b_doha1', 'b_doha2'], marco: 'fonte_moderna', marcoLarg: 3,
    props: ['duna', 'tenda_beduina', 'lanterna_arabe', 'carro_luxo', 'palmeira_real'], arvores: ['palmeira_real'], enfeitesLoja: [['lanterna_arabe', 2], ['palmeira_real', -3]], zona: 'Dunas Douradas', comida: 'tamaras', lootEsp: 'lamparina', zonaChao: CH.AREIA,
    nomes: { rapido: 'Vento do Deserto', meia: 'Maga da Miragem', zagueiro: 'Sentinela do Oásis', chefe: 'O Falcão do Deserto' },
    cores: ['#8a1a3a', '#ffffff'], chefeLook: { pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#8a1a3a', baixo: 'baixo-shorts', costas: 'costas-capa', rosto: 'rosto-escuros' },
    loja: { nome: 'Seu Rashid das Tâmaras', ola: 'Tâmaras doces e equipamento de luxo. Seja bem-vindo!', look: { pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-terno', corRoupa: '#f4f4f8', baixo: 'baixo-jeans' } },
    lider: { nome: 'Layla, capitã da seleção feminina', ola: 'Aqui treinamos no calor de 40 graus. Aguenta?', look: { corpo: 'f', pele: 'pele-morena', cabelo: 'cabelo-coque', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#8a1a3a', baixo: 'baixo-shorts', chapeu: 'chapeu-faixa' } } },
  { id: 'miami', nome: 'Miami — Ocean Drive', L: 93, base: CH.CALCADA, rua: CH.ASFALTO, seed: 904, agua: true, cais: CH.AREIA, predios: ['b_miami1', 'b_miami2'], marco: 'torre_salva', marcoLarg: 2,
    props: ['flamingo', 'carro_retro', 'food_truck', 'cadeira_sol', 'neon_palmeira'], arvores: ['neon_palmeira', 'palmeira_real'], enfeitesLoja: [['food_truck', 3], ['flamingo', -2]], zona: 'Calçadão Neon', comida: 'cachorro_quente', lootEsp: 'oculos_neon',
    nomes: { rapido: 'Surfista Veloz', meia: 'Estrela de TV', zagueiro: 'Fisiculturista da Praia', chefe: 'O Showman de Miami' },
    cores: ['#ff5ad0', '#3ac8e8'], chefeLook: { pele: 'pele-clara', cabelo: 'cabelo-topete', corCabelo: 'loiro', roupa: 'roupa-rockstar-ouro', baixo: 'baixo-praia', rosto: 'rosto-estrela', mao: 'mao-microfone' },
    loja: { nome: 'Tio Joe do Food Truck', ola: 'Hey, buddy! Cachorro-quente e chuteira nova, tudo aqui!', look: { pele: 'pele-negra', cabelo: 'cabelo-black-power', corCabelo: 'preto', roupa: 'roupa-regata', baixo: 'baixo-praia', chapeu: 'chapeu-bone', pescoco: 'pescoco-havaiano' } },
    lider: { nome: 'Coach Sofia', ola: 'Nos Estados Unidos o futebol está crescendo. Me ajuda a mostrar como se joga!', look: { corpo: 'f', pele: 'pele-media', cabelo: 'cabelo-liso-longo', corCabelo: 'loiro', roupa: 'roupa-moletom', corRoupa: '#3ac8e8', baixo: 'baixo-moletom', pescoco: 'pescoco-apito', chapeu: 'chapeu-bone' } } },
  { id: 'milao', nome: 'Milão — Piazza e Curva', L: 162, base: CH.PARALELO, rua: CH.CALCADA_PT, seed: 905, predios: ['b_milao1', 'b_milao2'], marco: 'fonte_italiana', marcoLarg: 3, // v153: a catedral agora é o monumento (Duomo)
    props: ['vespa', 'mesa_italiana', 'fonte_italiana', 'estatua', 'cipreste'], arvores: ['cipreste'], enfeitesLoja: [['mesa_italiana', 2], ['vespa', -2]], zona: 'Curva dos Ultras', comida: 'pizza', lootEsp: 'ingresso',
    nomes: { rapido: 'Estilista da Ala', meia: 'Regista de Milão', zagueiro: 'Líbero Catenaccio', fanatico: 'Ultra da Curva', chefe: 'Il Maestro' },
    cores: ['#1a1a1a', '#1a3ab9'], chefeLook: { pele: 'pele-clara', cabelo: 'cabelo-liso-longo', corCabelo: 'castanho', roupa: 'roupa-smoking-ouro', baixo: 'baixo-shorts', chapeu: 'chapeu-louros', rosto: 'rosto-escuros' },
    loja: { nome: 'Nonna Giulia da Pizzaria', ola: 'Mangia, mangia! Craque bem alimentado joga melhor!', look: { corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-coque', corCabelo: 'grisalho', roupa: 'roupa-xadrez', corRoupa: '#c01a2a', baixo: 'baixo-saia' } },
    lider: { nome: 'Padre Marco, do oratório', ola: 'Os ultras da Curva são meninos do bairro. Só precisam de um bom exemplo.', look: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-terno', corRoupa: '#1a1a2a', baixo: 'baixo-jeans', rosto: 'rosto-redondos' } } },
  { id: 'munique', nome: 'Munique — Praça do Relógio', L: 154, base: CH.PARALELO, rua: CH.ASFALTO, seed: 906, predios: ['b_munique1', 'b_munique2'], marco: 'maibaum', marcoLarg: 1, // v153: a torre do relógio agora é o monumento (Prefeitura)
    props: ['mesa_bavara', 'banca_pretzel', 'maibaum', 'bicicleta', 'pinheiro'], arvores: ['pinheiro'], enfeitesLoja: [['banca_pretzel', 2], ['bicicleta', -2]], zona: 'Parque Alpino', comida: 'pretzel', lootEsp: 'cronometro', zonaChao: CH.GRAMA,
    nomes: { rapido: 'Relâmpago Bávaro', meia: 'Relojoeira da Praça', zagueiro: 'Muralha Alpina', chefe: 'O General Bávaro' },
    cores: ['#c01a2a', '#ffffff'], chefeLook: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'loiro', roupa: 'roupa-cavaleiro-ouro', baixo: 'baixo-shorts', chapeu: 'chapeu-espartano-ouro' },
    loja: { nome: 'Frau Helga da Padaria', ola: 'Guten Tag! Pretzel quentinho saindo do forno!', look: { corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-liso-longo', corCabelo: 'loiro', roupa: 'roupa-xadrez', corRoupa: '#3a6ad9', baixo: 'baixo-saia' } },
    lider: { nome: 'Treinador Hans', ola: 'Aqui tudo é organizado: treino, tática e muita dedicação.', look: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'ruivo', roupa: 'roupa-moletom', corRoupa: '#c01a2a', baixo: 'baixo-moletom', pescoco: 'pescoco-apito' } } },
  // ---- Paris (v233: entre Lisboa e Munique) ----
  { id: 'paris', nome: 'Paris — Às margens do Sena', L: 142, base: CH.PARALELO, rua: CH.ASFALTO, seed: 909, agua: true, cais: CH.PEDRA, predios: ['b_paris1', 'b_paris2'], marco: 'metro_paris', marcoLarg: 2,
    props: ['banca_livros', 'carrinho_crepe', 'cavalete', 'mesa_cafe', 'carrinho_flores'], arvores: ['arvore'], enfeitesLoja: [['carrinho_crepe', 2], ['mesa_cafe', -2]], zona: 'Parque dos Príncipes', comida: 'croissant', lootEsp: 'boina',
    nomes: { rapido: 'Ciclista do Sena', meia: 'Artista de Montmartre', zagueiro: 'Guarda da Bastilha', fanatico: 'Torcedor dos Príncipes', chefe: 'Le Grand Capitaine' },
    cores: ['#1a2a6a', '#d42a2a'], chefeLook: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#1a2a6a', baixo: 'baixo-shorts', pescoco: 'pescoco-cachecol' },
    loja: { nome: 'Madame Colette da Boulangerie', ola: 'Bonjour! Croissant quentinho e macarons coloridos para o craque brasileiro!', look: { corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-coque', corCabelo: 'castanho', roupa: 'roupa-xadrez', corRoupa: '#d42a2a', baixo: 'baixo-saia' } },
    lider: { nome: 'Monsieur Didier, o técnico', ola: 'Em Paris o futebol é arte: cada passe é uma pincelada!', look: { pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-moletom', corRoupa: '#1a2a6a', baixo: 'baixo-moletom', pescoco: 'pescoco-apito' } } },
  // ---- América do Sul (v233: antes da Europa; a final da Copa continua no Rio, na Arena da Copa) ----
  { id: 'buenos', nome: 'Buenos Aires — La Boca', L: 106, base: CH.PARALELO, rua: CH.PEDRA, seed: 907, agua: true, cais: CH.PEDRA, predios: ['b_buenos1', 'b_buenos2'], marco: 'estatua_tango', marcoLarg: 2,
    props: ['mural_tango', 'banca_empanada', 'mesa_cafe', 'carrinho_flores', 'poste3'], arvores: ['arvore'], enfeitesLoja: [['banca_empanada', 2], ['mesa_cafe', -2]], zona: 'Bombonerita', comida: 'empanada', lootEsp: 'bandoneon',
    nomes: { rapido: 'Pibe do Caminito', meia: 'Enganche Portenho', zagueiro: 'Caudilho da Boca', fanatico: 'Hincha da Bombonerita', chefe: 'El Maestro del Tango' },
    cores: ['#1a3ab9', '#f8d838'], chefeLook: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#1a1a1a', baixo: 'baixo-shorts' },
    loja: { nome: 'Doña Rosa das Empanadas', ola: '¡Hola, pibe! Empanadas quentinhas: quem come uma joga como um craque do bairro!', look: { corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-coque', corCabelo: 'grisalho', roupa: 'roupa-xadrez', corRoupa: '#1a3ab9', baixo: 'baixo-saia' } },
    lider: { nome: 'Profe Martín', ola: 'Aqui o futebol é tango: tem ritmo, tem drama e tem muito coração.', look: { pele: 'pele-media', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-moletom', corRoupa: '#1a3ab9', baixo: 'baixo-moletom', pescoco: 'pescoco-apito' } } },
  { id: 'rio', nome: 'Rio de Janeiro — Copacabana', L: 118, base: CH.AREIA, rua: CH.CALCADA_PT, seed: 908, agua: true, cais: CH.AREIA, predios: ['b_rio1', 'b_rio2'], marco: 'arcos_lapa', marcoLarg: 6,
    props: ['carrinho_mate', 'bondinho', 'guarda_sol', 'cadeira_praia', 'quiosque'], arvores: ['coqueiro', 'coqueiro2'], enfeitesLoja: [['carrinho_mate', 2], ['guarda_sol', -2]], zona: 'Arquibancada da Geral', comida: 'biscoito_mate', lootEsp: 'pandeiro',
    nomes: { rapido: 'Passista de Copacabana', meia: 'Sambista da Lapa', zagueiro: 'Leão do Calçadão', fanatico: 'Torcedor da Geral', chefe: 'O Rei do Maracanã' },
    cores: ['#f8d838', '#1a9a3a'], chefeLook: { pele: 'pele-retinta', cabelo: 'cabelo-black-power', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#f8d838', baixo: 'baixo-shorts', chapeu: 'chapeu-coroa' },
    loja: { nome: 'Seu Tião do Mate', ola: 'Ó o mate! Biscoito e mate geladinho pra aguentar o calor de Copacabana!', look: { pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-regata', baixo: 'baixo-praia', chapeu: 'chapeu-bone' } },
    lider: { nome: 'Dona Glória, técnica da seleção', ola: 'Bem-vindo(a) de volta ao Brasil! Vença a elite daqui e ganhe o mundo. Quando for uma lenda, a Copa do Mundo te espera aqui no Rio!', look: { corpo: 'f', pele: 'pele-morena', cabelo: 'cabelo-cacheado', corCabelo: 'grisalho', roupa: 'roupa-moletom', corRoupa: '#1a9a3a', baixo: 'baixo-moletom', pescoco: 'pescoco-apito' } } },
  // ---- v234: Santos (a última parada antes da Copa: Vila Belmiro, a casa do Rei) ----
  { id: 'santos', nome: 'Santos — Orla e Vila Belmiro', L: 188, base: CH.CALCADA, rua: CH.ASFALTO, seed: 910, agua: true, cais: CH.AREIA, predios: ['b_santos1', 'b_santos2'], marco: 'farol_orla', marcoLarg: 1,
    props: ['jardim_orla', 'sacas_cafe', 'carrinho_caldo', 'guarda_sol', 'quiosque'], arvores: ['coqueiro', 'coqueiro2'], enfeitesLoja: [['carrinho_caldo', 2], ['sacas_cafe', -2]], zona: 'Praia do Gonzaga', comida: 'pastel_caldo', lootEsp: 'saca_cafe',
    nomes: { rapido: 'Moleque da Vila', meia: 'Camisa 10 da Baixada', zagueiro: 'Xerife da Vila Belmiro', chefe: 'Capitão dos Meninos da Vila' },
    cores: ['#f4f4f8', '#1a1a1a'], chefeLook: { pele: 'pele-media', cabelo: 'cabelo-curto', corCabelo: 'loiro', roupa: 'roupa-futebol', corRoupa: '#f4f4f8', baixo: 'baixo-shorts' },
    loja: { nome: 'Seu Nenê do Pastel', ola: 'Pastel quentinho e caldo de cana geladinho! Aqui na Baixada Santista é tradição!', look: { pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-regata', corRoupa: '#f4f4f8', baixo: 'baixo-jeans', chapeu: 'chapeu-bone' } },
    lider: { nome: 'Dona Zilda, técnica da base', ola: 'Aqui na Vila Belmiro nascem os Meninos da Vila: pedalada, chapéu, caneta e muita alegria. Aguenta o ritmo deles?', look: { corpo: 'f', pele: 'pele-negra', cabelo: 'cabelo-coque', corCabelo: 'preto', roupa: 'roupa-moletom', corRoupa: '#1a1a1a', baixo: 'baixo-moletom', pescoco: 'pescoco-apito' } } },
];

// v233: equipamento de cada loja/queda segue o DEGRAU da cidade (a ordem nova do mundo)
const GEAR_POR_CIDADE = {
  cairo: ['chuteira_mundo', 'camisa_mundo', 'caneleira_mundo'], doha: ['chuteira_mundo', 'camisa_mundo', 'caneleira_mundo', 'pulseira'], toquio: ['camisa_mundo', 'caneleira_mundo', 'pulseira'], miami: ['chuteira_mundo', 'camisa_mundo', 'pulseira'],
  buenos: ['chuteira_elite', 'camisa_elite', 'caneleira_elite'], rio: ['chuteira_elite', 'camisa_elite', 'caneleira_elite', 'cachecol'],
  lisboa: ['chuteira_elite', 'camisa_elite', 'caneleira_elite', 'chuteira_tita'], paris: ['chuteira_elite', 'camisa_tita', 'chuteira_tita', 'caneleira_elite'],
  munique: ['chuteira_tita', 'camisa_tita', 'caneleira_elite', 'cachecol'], milao: ['chuteira_tita', 'camisa_tita', 'caneleira_galaxia', 'cachecol'],
  madri: ['chuteira_galaxia', 'camisa_galaxia', 'caneleira_galaxia', 'camisa_tita'], londres: ['chuteira_galaxia', 'camisa_galaxia', 'caneleira_galaxia', 'medalha_copa'],
  santos: ['chuteira_galaxia', 'camisa_galaxia', 'caneleira_galaxia', 'medalha_copa'],
};
const LOOT_GEAR = { cairo: 'chuteira_mundo', doha: 'pulseira', toquio: 'camisa_mundo', miami: 'pulseira', buenos: 'chuteira_elite', rio: 'caneleira_elite',
  lisboa: 'chuteira_tita', paris: 'camisa_tita', munique: 'camisa_lenda', milao: 'chuteira_lenda', madri: 'caneleira_galaxia', londres: 'medalha_copa', santos: 'medalha_copa' };

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
  che.loot = [['fio_ouro', 1, 2, 4], [LOOT_GEAR[id], 0.4, 1, 1], ['apito_ouro', L >= 100 ? 0.1 : 0, 1, 1], [c.lootEsp, 1, 2, 3]].filter(l => l[1] > 0); // chance 0 não entra (nem aparece na wiki)
  c.rapido = id + '_rapido'; c.meia = id + '_meia'; c.zagueiro = id + '_zagueiro'; c.chefe = id + '_chefe';
  if (c.nomes.fanatico) {
    const fan = montaMonstro(id + '_fanatico', c.nomes.fanatico, 'fanatico', L, { proj: id === 'milao' ? 'copo' : 'papel', falas: ['Uuuuh!', 'Esse lugar é nosso!', 'Vaia!'], look: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'castanho', roupa: 'roupa-moletom', corRoupa: cor, baixo: 'baixo-jeans', chapeu: 'chapeu-gorro', pescoco: 'pescoco-cachecol', rosto: 'rosto-pintura' } });
    fan.loot = [['megafone', 0.07, 1, 1], ['retalho', 0.5, 2, 4]]; c.fanatico = id + '_fanatico';
  }
  NPCS['loja_' + id] = { nome: c.loja.nome, ola: c.loja.ola, loja: [c.comida, 'agua_coco', 'vitamina', ...GEAR_POR_CIDADE[id]], look: Object.assign({ tipo: 'humano', corpo: 'm', alt: 1.72 }, c.loja.look) };
  NPCS['lider_' + id] = { nome: c.lider.nome, ola: c.lider.ola, look: Object.assign({ tipo: 'humano', corpo: 'm', alt: 1.72 }, c.lider.look) };
  MAPAS_DEF[id] = () => (c.cria || criaCidade)(c); // v234: Santos tem mapa próprio (santos_mapa.js)
  DESAFIOS[id] = [[c.rapido, 150], [c.meia, 150], [c.zagueiro, 150]].concat(c.fanatico ? [[c.fanatico, 150]] : []);
  // missões (v407 Raio-X R8: artigo certo com prepLugar — "ao Rio", "ao Cairo" — e sem "Quem joga como Mestra do Origami lê")
  const xpNivel = x => xpPara(x + 1) - xpPara(x);
  const cidadeCurta = c.nome.split(' —')[0];
  MISSOES.push(
    { id: id + '_m1', npc: 'loja_' + id, titulo: `Bem-vindo(a) ${prepLugar('a', cidadeCurta)}`, lvl: L - 6, texto: `Os adversários do tipo ${c.nomes.rapido} correm pelas ruas ${prepLugar('de', cidadeCurta)}. Mostre o futebol brasileiro: passe por 30 deles.`, req: { kill: c.rapido, n: 30 }, rec: { xp: Math.round(xpNivel(L) * 0.9), ouro: L * 120, itens: [[c.comida, 5]] }, fim: `${cidadeCurta} já sabe o seu nome!` },
    { id: id + '_m2', npc: 'loja_' + id, titulo: 'A muralha local', lvl: L - 3, pre: id + '_m1', texto: `Os adversários do tipo ${c.nomes.zagueiro} são a defesa mais dura ${prepLugar('de', cidadeCurta)}. Vença 30 deles pela cidade.`, req: { kill: c.zagueiro, n: 30 }, rec: { xp: Math.round(xpNivel(L) * 1.1), ouro: L * 160, itens: [[GEAR_POR_CIDADE[id][0], 1]] }, fim: 'Toma um equipamento digno de você!' },
    c.fanatico
      ? { id: id + '_m3', npc: 'lider_' + id, titulo: `Missão da Paz: ${c.zona}`, lvl: L - 4, texto: `Os fanáticos da ${c.zona} intimidam quem passa. Vença 25 no jogo limpo e mostre que rivalidade é dentro de campo.`, req: { kill: c.fanatico, n: 25 }, rec: { xp: Math.round(xpNivel(L) * 1.1), ouro: L * 150, evento: 'paz', itens: [[L < 100 ? 'pulseira' : 'cachecol', 1]] }, fim: 'Hoje eles cantaram em vez de vaiar. Torcer é festa!' }
      : { id: id + '_m3', npc: 'lider_' + id, titulo: `Treino ${prepLugar('em', cidadeCurta)}`, lvl: L - 4, texto: `Os adversários do tipo ${c.nomes.meia} leem o jogo como ninguém. Vença 30 deles pelas ruas ${prepLugar('de', cidadeCurta)} para aprender.`, req: { kill: c.meia, n: 30 }, rec: { xp: Math.round(xpNivel(L) * 1.1), ouro: L * 150, itens: [['pulseira', 1]] }, fim: 'Você aprendeu muito aqui!' },
    { id: id + '_m4', npc: 'lider_' + id, titulo: c.nomes.chefe, lvl: L + 2, pre: id + '_m3', texto: `${c.nomes.chefe.toUpperCase()} manda no canto sudeste da cidade. Vença e a próxima liga vai te chamar.`, req: { kill: c.chefe, n: 1 }, rec: { xp: Math.round(xpNivel(L) * 3), ouro: L * 400, flag: 'venceu_' + id }, fim: `LENDÁRIO! ${cidadeCurta} conquistada. Fale com o Empresário Rodrigues sobre a próxima liga!` },
  );
}

/* ---------- extras de Buenos Aires, do Rio e de Paris ---------- */
MONSTROS.buenos_fanatico.loot.push(['insignia_estrela', 0.07, 1, 1]);
MONSTROS.rio_fanatico.loot.push(['bandeira_verde', 0.07, 1, 1]);
MONSTROS.paris_fanatico.loot.push(['mini_eiffel', 0.07, 1, 1]);
NPCS.loja_paris.loja.splice(1, 0, 'macarons');
// a final: a Copa do Mundo (Arena da Copa, no Rio — arenas.js)
MISSOES.push({ id: 'rio_m5', npc: 'lider_rio', titulo: 'A Copa do Mundo', lvl: 192, pre: 'rio_m4', texto: 'Chegou a hora. A ARENA DA COPA DO MUNDO abriu as portas aqui no Rio, e A LENDA DA COPA espera por você no gramado. Vença a final e traga a taça para casa!', req: { kill: 'ch_lenda_copa', n: 1 }, rec: { xp: 30000000, ouro: 2000000, flag: 'campeao_copa', itens: [['taca_copa', 1]] }, fim: 'É CAMPEÃ(O) DO MUNDO! Do campinho de terra até a taça mais famosa do planeta. A Vila inteira está chorando de alegria!' });

/* ---------- Europa reescalonada (v233: Lisboa 130, Madri 170, Londres 186) ---------- */
const NIVEL_EUROPA = { lisboa: 130, madri: 170, londres: 186 };
const NIVEL_EUROPA_V232 = { lisboa: 106, madri: 118, londres: 154 }; // para reescalar as recompensas das missões
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
const SOBE_EUROPA = { l_: 74, m_: 99, o_: 100 };
for (const q of MISSOES) for (const [pref, d] of Object.entries(SOBE_EUROPA)) if (q.id.startsWith(pref) && q.lvl < 100) q.lvl += d;
{ const CID_PREF = { l_: 'lisboa', m_: 'madri', o_: 'londres' };
  for (const q of MISSOES) { const pref = q.id.slice(0, 2); const cid = CID_PREF[pref]; if (!cid || !/^(l_|m_|o_)/.test(q.id)) continue;
    const k = NIVEL_EUROPA[cid] / NIVEL_EUROPA_V232[cid];
    if (q.rec.xp) q.rec.xp = Math.round(q.rec.xp * 3 * k * k); if (q.rec.ouro) q.rec.ouro = Math.round(q.rec.ouro * k); } }
// lojas e quedas de equipamento da Europa antiga: pelo degrau novo
for (const cid of ['lisboa', 'madri', 'londres']) {
  const n = NPCS['lojista_' + cid]; if (n && Array.isArray(n.loja)) n.loja = n.loja.filter(id => !ITENS[id] || ITENS[id].tipo !== 'equip').concat(GEAR_POR_CIDADE[cid]);
}
for (const [id, [cid, arq]] of Object.entries(EUR_ARQ)) {
  if (arq === 'chefe') continue;
  const m = MONSTROS[id]; m.loot = m.loot.filter(l => !ITENS[l[0]] || ITENS[l[0]].tipo !== 'equip');
  if (arq === 'rapido' || arq === 'zagueiro') m.loot.push([LOOT_GEAR[cid], arq === 'zagueiro' ? 0.004 : 0.003, 1, 1]);
}
// v233: ordem pela relevância do futebol (o nível de cada voo é o do degrau da cidade)
const ORDEM_MUNDO = ['cairo', 'doha', 'toquio', 'miami', 'buenos', 'rio', 'lisboa', 'paris', 'munique', 'milao', 'madri', 'londres', 'santos'];
Object.assign(VOOS, {
  cairo: { nome: 'Cairo, Egito', lvl: 50, preco: 2000 },
  doha: { nome: 'Doha, Catar', lvl: 62, preco: 3000 },
  toquio: { nome: 'Tóquio, Japão', lvl: 74, preco: 4000 },
  miami: { nome: 'Miami, Estados Unidos', lvl: 86, preco: 5000 },
  buenos: { nome: 'Buenos Aires, Argentina', lvl: 100, preco: 7000 },
  rio: { nome: 'Rio de Janeiro, Brasil', lvl: 112, preco: 9000 },
  lisboa: { nome: 'Lisboa, Portugal', lvl: 124, preco: 11000 },
  paris: { nome: 'Paris, França', lvl: 136, preco: 13000 },
  munique: { nome: 'Munique, Alemanha', lvl: 148, preco: 16000 },
  milao: { nome: 'Milão, Itália', lvl: 156, preco: 18000 },
  madri: { nome: 'Madri, Espanha', lvl: 162, preco: 20000 },
  londres: { nome: 'Londres, Inglaterra', lvl: 176, preco: 25000 },
  santos: { nome: 'Santos, Brasil (Vila Belmiro)', lvl: 182, preco: 28000 },
});
// ordem de exibição dos voos
{ const ord = ['cidade', ...ORDEM_MUNDO]; const cp = Object.assign({}, VOOS); for (const k of Object.keys(VOOS)) delete VOOS[k]; for (const k of ord) VOOS[k] = cp[k]; }

/* ---------- v233: comidas típicas no degrau novo (cada cidade mantém a sua comida; a força é a do degrau) ---------- */
{
  const C = (lvl, preco, venda, efeito) => ({ lvl, preco, venda, efeito });
  const COMIDA_DEGRAU = {
    falafel: ['Do Cairo', C(50, 180, 36, { dur: 600, regen: 2, atr: { defesa: 7 } })],
    tamaras: ['De Doha', C(62, 260, 52, { dur: 600, vel: 12, atr: { folego: 7 } })],
    onigiri: ['De Tóquio', C(74, 340, 68, { dur: 600, regenFoco: 3, atr: { inteligencia: 7 } })],
    cachorro_quente: ['De Miami', C(86, 420, 84, { dur: 600, regen: 2.5, atr: { habilidade: 7 } })],
    empanada: ['De Buenos Aires', C(100, 400, 80, { dur: 600, regen: 3, atr: { habilidade: 8 } })],
    biscoito_mate: ['Da praia do Rio', C(112, 700, 140, { dur: 600, regenFoco: 4, vel: 6, atr: { folego: 8 } })],
    pastel_nata: ['Doce de Lisboa', C(124, 1600, 320, { dur: 900, regen: 4, regenFoco: 3, atr: { defesa: 7, habilidade: 7, inteligencia: 7, folego: 7 } })],
    croissant: ['De Paris', C(136, 1900, 380, { dur: 900, regen: 5, atr: { habilidade: 10, inteligencia: 10 } })],
    macarons: ['De Paris', C(140, 2000, 400, { dur: 900, regen: 4, regenFoco: 3, vel: 6, atr: { defesa: 8, folego: 8 } })],
    pretzel: ['De Munique', C(148, 2100, 420, { dur: 900, regen: 5, atr: { folego: 10, defesa: 10 } })],
    pizza: ['De Milão', C(156, 2200, 440, { dur: 900, regen: 5, regenFoco: 3, atr: { defesa: 8, habilidade: 8, inteligencia: 8, folego: 8 } })],
    churros: ['De Madri', C(162, 2400, 480, { dur: 900, regen: 5, regenFoco: 4, atr: { habilidade: 10, folego: 9 } })],
    fish_chips: ['De Londres', C(176, 3200, 640, { dur: 900, regen: 6, regenFoco: 4, vel: 10, atr: { defesa: 10, inteligencia: 10, folego: 10 } })],
  };
  const NM = { defesa: 'Defesa', inteligencia: 'Inteligência', folego: 'Fôlego', habilidade: 'Habilidade' };
  const descComida = (de, e) => {
    const a = Object.entries(e.atr || {}); const p = [];
    if (a.length === 4 && a.every(([, v]) => v === a[0][1])) p.push(`+${a[0][1]} em TUDO`); else a.forEach(([k]) => p.push('+' + NM[k]));
    if (e.vel) p.push('velocidade'); if (e.regenFoco) p.push('foco'); if (e.regen) p.push('recuperação');
    return `${de}: ${p.length > 1 ? p.slice(0, -1).join(', ') + ' e ' + p[p.length - 1] : p[0]} por ${Math.round(e.dur / 60)} min.`;
  };
  for (const [id, [de, v]] of Object.entries(COMIDA_DEGRAU)) if (ITENS[id]) Object.assign(ITENS[id], v, { desc: descComida(de, v.efeito) });
}

/* ---------- bebidas dos níveis altos (o teste de balanceamento mostrou que a Vitamina, 520, não segura a Europa) ---------- */
Object.assign(ITENS, {
  energetico: { nome: 'Energético do Craque', tipo: 'consumivel', efeito: { hp: 1500 }, lvl: 70, preco: 450, venda: 90, desc: 'Recupera 1.500 de fôlego. Nível 70.', icon: { k: 'copo', c: '#ff5a2a' } },
  guarana: { nome: 'Guaraná da Amazônia', tipo: 'consumivel', efeito: { foco: 900 }, lvl: 70, preco: 420, venda: 84, desc: 'Recupera 900 de foco. Nível 70.', icon: { k: 'copo', c: '#c8702a' } },
  kit_massagista: { nome: 'Kit do Massagista', tipo: 'consumivel', efeito: { hp: 3500 }, lvl: 110, preco: 1200, venda: 240, desc: 'Recupera 3.500 de fôlego. Nível 110.', icon: { k: 'copo', c: '#f4f4f8' } },
  isotonico_pro: { nome: 'Isotônico Pro', tipo: 'consumivel', efeito: { foco: 2000 }, lvl: 110, preco: 1100, venda: 220, desc: 'Recupera 2.000 de foco. Nível 110.', icon: { k: 'copo', c: '#2a8aff' } },
});
['i_energetico', 'i_guarana', 'i_kit_massagista', 'i_isotonico_pro'].forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });
for (const [id, n] of Object.entries(NPCS)) if (/^loja_|^lojista_/.test(id) && Array.isArray(n.loja)) for (const b of ['energetico', 'guarana', 'kit_massagista', 'isotonico_pro']) if (!n.loja.includes(b)) n.loja.splice(3, 0, b);

/* ---------- v233: aviso (uma vez) de que o mundo mudou de ordem ---------- */
{
  const _iniciarJogoOrdem = iniciarJogo;
  iniciarJogo = async function () {
    const r = await _iniciarJogoOrdem.apply(this, arguments);
    try {
      const s = G.save; s.flags = s.flags || {};
      if (!s.flags.aviso_ordem_v233 && (s.nivel || 1) >= 45) {
        s.flags.aviso_ordem_v233 = true;
        log('🌍 O mapa-múndi foi reorganizado pela força do futebol de cada país: Cairo → Doha → Tóquio → Miami → Buenos Aires → Rio → Lisboa → Paris → Munique → Milão → Madri → Londres. A final da Copa continua no Rio!', 'l-lvl');
        const c = CIDADES.find(k => k.id === G.mapa.id); const L = c ? c.L : (NIVEL_EUROPA[G.mapa.id] || 0);
        if (L && L > (s.nivel || 1) + 10) log(`⚠️ Cuidado: aqui os adversários agora são nível ${L}. O aeroporto leva você para uma cidade do seu nível.`, 'l-dano');
      }
    } catch (e) { }
    return r;
  };
}
