/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🌀 O MULTIVERSO DA BOLA (v322): o conteúdo depois da Copa Intergaláctica (níveis 400 → 1000)
   Pedido do dono: mais conteúdo para quem chegou no topo, sempre pensando no futuro.
   - ESTÁDIO DO MULTIVERSO (hub): um estádio flutuando entre as galáxias, com PORTAIS para mundos
     novos. Cada mundo novo é um pacote (criaturas, cidade, áreas de caça, chefão, itens, missões):
     criar o próximo é só abrir mais um portal (os selados já estão lá, esperando).
     Chega-se pelo Guardião do Multiverso (praça do aeroporto do Rio), pela Torre de Controle da
     Estação ou pelo aeroporto — a partir do nível 400 e depois de vencer a Copa Intergaláctica.
   - REINO DE PEDRAFORTE (anões, níveis 405–470): cidade escavada na montanha, rio de lava, forja;
     4 áreas de caça e o Rei Pedregulho, o Goleiro da Montanha.
   - PICOS NUBLADOS (gigantes, níveis 482–560): vila de gigantes acima das nuvens; 4 áreas e o
     Titã do Trovão.
   - Itens 405–545 em 4 faixas (Rúnica, Brasa, Titânica, Tempestade) — SÓ caem dos adversários, com
     chance baixíssima (nenhum NPC vende), pedido do dono: "o jogador terá que jogar de verdade".
   - Desafios Lendários (missões pesadas que pagam muito bem) com o Guardião do Multiverso.
   - A Torre Infinita e as Relíquias ficam em torre_infinita.js.
   Modelo: atlantida.js / espaco.js. Carregar DEPOIS de viagens_equip.js e economia_ouro.js.
   ============================================================ */

/* ---------- chãos novos ---------- */
Object.assign(CH, { MV_PISO_ANAO: 64, MV_LAVA: 65, MV_NEVE: 66, MV_NUVEM: 67, MV_PRACA: 68 });
Object.assign(ESTILO_CHAO, {
  [CH.MV_PISO_ANAO]: { cor: '#8a7a6a', borda: '#5a4a3a', r: 0, e: 0, tex: 'pedra', o: 5.71, tinta: 'rgba(110,70,30,0.22)' },
  [CH.MV_LAVA]: { cor: '#ff7a1a', borda: '#a83a0a', r: 0.3, e: 0.06, tex: 'liso', o: 5.72, tinta: 'rgba(255,110,20,0.62)' },
  [CH.MV_NEVE]: { cor: '#eef5fb', borda: '#c4d4e4', r: 0.45, e: 0.1, tex: 'areia', o: 3.61, tinta: 'rgba(240,248,255,0.62)' },
  [CH.MV_NUVEM]: { cor: '#f4f8ff', borda: '#d0dcec', r: 0.5, e: 0.12, tex: 'liso', o: 3.62 },
  [CH.MV_PRACA]: { cor: '#cfc4e8', borda: '#9a8ac0', r: 0, e: 0, tex: 'calcada', o: 5.73, tinta: 'rgba(160,130,255,0.2)' },
});
Object.assign(TEX_CHAO, { [CH.MV_PISO_ANAO]: 't_pedra', [CH.MV_LAVA]: 't_rocha_lava', [CH.MV_NEVE]: 't_gelo', [CH.MV_PRACA]: 't_calcada' });
Object.assign(CH_MINI, { 64: '#8a7a6a', 65: '#ff7a1a', 66: '#eef5fb', 67: '#ffffff', 68: '#cfc4e8' });
if (typeof chaoSuaviza === 'function') { const _chaoSuavizaMv = chaoSuaviza; chaoSuaviza = t => (t === CH.MV_PISO_ANAO || t === CH.MV_PRACA) ? false : _chaoSuavizaMv(t); }

/* ---------- objetos e prédios ---------- */
Object.assign(OBJ_INFO, {
  carrinho_mina: { w: 1.3, b: 1 }, bigorna_runica: { w: 0.95, b: 1 }, lampiao_cristal: { w: 0.55, b: 1 }, barris_anao: { w: 1.05, b: 1 },
  pinheiro_gigante: { w: 2.2, b: 1 }, toco_machado: { w: 1.3, b: 1 }, pedra_runica: { w: 1.4, b: 1 }, nuvem_arbusto: { w: 1.7, b: 1 },
  mv_portal_selado: { w: 2.3, b: 1 }, mv_portal_rio: { w: 2.3, b: 1 }, // v362: o portal da praça do Rio, aberto
});
['carrinho_mina', 'bigorna_runica', 'lampiao_cristal', 'barris_anao', 'pinheiro_gigante', 'toco_machado', 'pedra_runica', 'nuvem_arbusto', 'mv_portal_selado', 'mv_portal_rio'].forEach(k => OBJ_BLOQUEIA.add(k));
Object.assign(OBJ_MINI, { carrinho_mina: '#8a5a2a', pinheiro_gigante: '#2a6a3a', pedra_runica: '#7a8a7a', nuvem_arbusto: '#ffffff', lampiao_cristal: '#ffd23f', mv_portal_selado: '#6a3ad9', mv_portal_rio: '#8a4ae0' });
['pinheiro_gigante', 'pedra_runica', 'mv_portal_selado', 'mv_portal_rio'].forEach(t => OBJ_VISAO.add(t));

/* ---------- as criaturas ---------- */
// [id, nome, nível, arquétipo, altura (tiles), voa, item que derruba, nome do item, descrição, falas, mundo]
const MV_BICHOS = [
  ['mv_anao_mineiro', 'Ball-Kicking Dwarf', 405, 'zagueiro', 1.0, false, 'pepita_runica', 'Rune Nugget', 'Gold from the dwarf mines, with a rune that glows in the dark.', ['By my grandpa\'s beard!', 'That ball is mine!'], 'anoes'],
  ['mv_cogumelo', 'Bouncing Mushroom', 412, 'rapido', 0.85, false, 'esporo_brilhante', 'Jar of Glowing Spores', 'Blue spores that light up the dwarf caves.', ['Boing!', 'Bling bling!'], 'anoes'],
  ['mv_morcego_lampiao', 'Lantern Bat', 420, 'rapido', 0.85, true, 'lampiaozinho', 'Little Lantern', 'The lantern the bats carry through the caves.', ['Eeek! Light!', 'Get the ball!'], 'anoes'],
  ['mv_golem_brasa', 'Ember Golem', 432, 'zagueiro', 1.5, false, 'brasa_eterna', 'Eternal Ember', 'A stone with a heart of fire that never goes out.', ['Grrr... hot!', 'Red-hot ball!'], 'anoes'],
  ['mv_besouro_bigorna', 'Anvil Beetle', 445, 'zagueiro', 1.1, false, 'lasca_bigorna', 'Anvil Shell Chip', 'Metal harder than a dwarf\'s anvil.', ['Klonk!', 'Tough shell!'], 'anoes'],
  ['mv_anao_ferreira', 'Dwarf Blacksmith', 455, 'meia', 1.0, false, 'martelo_runico', 'Little Rune Hammer', 'The hammer that forges the dwarves\' cleats.', ['At the forge and on the field!', 'Hit and hit back!'], 'anoes'],
  ['mv_carneiro_nuvem', 'Cloud Lamb', 482, 'rapido', 1.0, false, 'la_nuvem', 'Ball of Cloud Wool', 'Super light wool that floats on its own.', ['Baaaa!', 'Jump the cloud!'], 'gigantes'],
  ['mv_gigante_lenhador', 'Lumberjack Giant', 492, 'zagueiro', 2.0, false, 'botao_gigante', 'Giant\'s Button', 'It fell off a giant\'s shirt. It\'s as big as a plate!', ['HO HO! Little one!', 'Tree-trunk defense!'], 'gigantes'],
  ['mv_aguia_trovao', 'Thunder Eagle', 503, 'rapido', 1.25, true, 'pena_trovao', 'Thunder Feather', 'It gives you a tiny shock when you touch it.', ['Kreee!', 'Lightning in the box!'], 'gigantes'],
  ['mv_ciclope', 'Cyclops Striker', 515, 'meia', 2.1, false, 'monoculo_ciclope', 'Cyclops Monocle', 'Just one eye, perfect aim.', ['Got you in my sights!', 'Eye on the ball!'], 'gigantes'],
  ['mv_troll_ponte', 'Bridge Troll Goalkeeper', 528, 'zagueiro', 1.9, false, 'luva_troll', 'Troll\'s Moss Glove', 'A goalkeeper glove with little flowers growing on it.', ['You shall not pass!', 'Toll: one dribble!'], 'gigantes'],
  ['mv_gigante_gelo', 'Ice Giant', 542, 'zagueiro', 2.25, false, 'gelo_eterno', 'Eternal Ice Crystal', 'Ice that never melts, not even in the sun.', ['Brrr... cold!', 'Frozen goal!'], 'gigantes'],
];
// [id, nome, nível, altura, troféu, nome do troféu, descrição, mundo]
const MV_CHEFES = [
  ['mv_chefe_golem_rei', 'King Boulder, the Mountain Goalkeeper', 470, 2.7, 'caco_coroa_cristal', 'Crystal Crown Shard', 'A piece of King Boulder\'s crown. It glows purple.', 'anoes'],
  ['mv_chefe_tita', 'Thunder Titan', 560, 3.0, 'coroa_raios', 'Crown of Lightning', 'The Thunder Titan\'s crown. It still sparks!', 'gigantes'],
];
const MV_ID = new Set([...MV_BICHOS.map(b => b[0]), ...MV_CHEFES.map(c => c[0])]);
// quadros de corrida (Higgsfield, 4 quadros cada) — a escala compensa o quadro ser mais alto que o bicho
Object.assign(CORRE_ESC, { mv_anao_mineiro: 1.016, mv_anao_ferreira: 1.003, mv_cogumelo: 1.154, mv_golem_brasa: 1, mv_morcego_lampiao: 1.133, mv_aguia_trovao: 1.176, mv_besouro_bigorna: 1, mv_carneiro_nuvem: 1.002,
  mv_chefe_golem_rei: 1.008, mv_gigante_lenhador: 1.009, mv_ciclope: 1.002, mv_troll_ponte: 1.012, mv_gigante_gelo: 1, mv_chefe_tita: 1 });
CORRE_VOA.add('mv_morcego_lampiao'); CORRE_VOA.add('mv_aguia_trovao');

/* ---------- itens: 4 faixas de equipamento (SÓ caem), poções, comida, loot ---------- */
const MV_FAIXAS = [
  { id: 'runica', L: 410, nome: 'Rune', pecas: {
    chuteira_runica: ['Rune Cleats', 'chuteira', { atk: 182, st: { vel: 46, chute: 16, drible: 16 } }],
    camisa_runica: ['Rune Jersey', 'camisa', { def: 134, st: { hp: 5200, defesa: 18 }, avatar: 'roupa-futebol', cor: '#5a6470', cor2: '#3ac8ff', estampa: 'tx_camisa_runica' }],
    calcao_runico: ['Rune Shorts', 'calcao', { def: 36, st: { vel: 24, hp: 900 }, avatar: 'baixo-shorts' }],
    caneleira_runica: ['Rune Shin Guard', 'perna', { def: 52, st: { defesa: 14, hp: 1900 } }],
    elmo_runico: ['Rune Miner\'s Helmet', 'cabeca', { def: 28, st: { hp: 1650, drible: 12, chute: 12, visao: 14 }, avatar: 'chapeu-coroa' }],
    amuleto_runico: ['Rune Nugget Amulet', 'acessorio', { def: 14, st: { foco: 1100, regen: 11, hp: 600 }, avatar: 'pescoco-medalha' }] } },
  { id: 'brasa', L: 455, nome: 'Ember', pecas: {
    chuteira_brasa: ['Ember Cleats', 'chuteira', { atk: 198, st: { vel: 48, chute: 17, drible: 17 } }],
    camisa_brasa: ['Forge Jersey', 'camisa', { def: 146, st: { hp: 5900, defesa: 20 }, avatar: 'roupa-futebol', cor: '#2a2226', cor2: '#ff7a1a', estampa: 'tx_camisa_brasa' }],
    calcao_brasa: ['Ember Shorts', 'calcao', { def: 40, st: { vel: 26, hp: 1100 }, avatar: 'baixo-shorts' }],
    caneleira_bigorna: ['Anvil Shin Guard', 'perna', { def: 57, st: { defesa: 16, hp: 2200 } }],
    coroa_cristal: ['King Boulder\'s Crystal Crown', 'cabeca', { def: 31, st: { hp: 1850, drible: 13, chute: 13, visao: 15 }, avatar: 'chapeu-coroa' }],
    medalhao_brasa: ['Ember Medallion', 'acessorio', { def: 16, st: { foco: 1300, regen: 12, hp: 750 }, avatar: 'pescoco-medalha' }] } },
  { id: 'titanica', L: 500, nome: 'Titanic', pecas: {
    chuteira_titanica: ['Titanic Cleats', 'chuteira', { atk: 216, st: { vel: 50, chute: 19, drible: 19 } }],
    camisa_titanica: ['Titanic Jersey', 'camisa', { def: 160, st: { hp: 6700, defesa: 22 }, avatar: 'roupa-futebol', cor: '#2a6a2a', cor2: '#ffcf3a', estampa: 'tx_camisa_titanica' }],
    calcao_titanico: ['Titanic Shorts', 'calcao', { def: 44, st: { vel: 28, hp: 1300 }, avatar: 'baixo-shorts' }],
    caneleira_tronco: ['Giant Trunk Shin Guard', 'perna', { def: 62, st: { defesa: 18, hp: 2500 } }],
    elmo_titanico: ['Titanic Helmet', 'cabeca', { def: 34, st: { hp: 2100, drible: 15, chute: 15, visao: 17 }, avatar: 'chapeu-coroa' }],
    colar_pena_trovao: ['Thunder Feather Necklace', 'acessorio', { def: 18, st: { foco: 1500, regen: 13, hp: 900 }, avatar: 'pescoco-medalha' }] } },
  { id: 'tempestade', L: 545, nome: 'Storm', pecas: {
    chuteira_tempestade: ['Storm Cleats', 'chuteira', { atk: 236, st: { vel: 54, chute: 21, drible: 21 } }],
    camisa_tempestade: ['Storm Jersey', 'camisa', { def: 175, st: { hp: 7600, defesa: 24 }, avatar: 'roupa-futebol', cor: '#1a2a6a', cor2: '#ffe14a', estampa: 'tx_camisa_tempestade' }],
    calcao_tempestade: ['Storm Shorts', 'calcao', { def: 48, st: { vel: 30, hp: 1500 }, avatar: 'baixo-shorts' }],
    caneleira_gelo_eterno: ['Eternal Ice Shin Guard', 'perna', { def: 68, st: { defesa: 20, hp: 2850 } }],
    coroa_tempestade: ['Storm Crown', 'cabeca', { def: 38, st: { hp: 2400, drible: 17, chute: 17, visao: 19 }, avatar: 'chapeu-coroa' }],
    amuleto_tempestade: ['Storm Amulet', 'acessorio', { def: 20, st: { foco: 1750, regen: 15, hp: 1100 }, avatar: 'pescoco-medalha' }] } },
];
const MV_ITENS_EQUIP = [];
for (const f of MV_FAIXAS) for (const [id, [nome, slot, x]] of Object.entries(f.pecas)) {
  const desc = [x.atk ? `Attack ${x.atk}` : '', ...Object.entries(x.st).map(([k, v]) => `+${fmt(v)} ${{ hp: 'stamina', foco: 'foco', vel: 'velocidade', regen: 'recovery', defesa: 'defesa', drible: 'drible', chute: 'chute', visao: 'vision' }[k]}`)].filter(Boolean).join(', ');
  ITENS[id] = Object.assign({ nome, tipo: 'equip', slot, lvl: f.L, venda: Math.round(f.L * f.L * 9), faixaMv: f.id, desc: `${f.nome} tier (only drops from Multiverse opponents, super rare). ${desc}.` }, x);
  MV_ITENS_EQUIP.push(id);
}
// as camisas usam o tecido próprio (visual_itens.js aceita tx_); calção e caneleira: o tecido por cima (como roupas_tecidos.js)
const MV_TX_CAL = { calcao_runico: 'tx_calcao_runico', calcao_brasa: 'tx_calcao_brasa', calcao_titanico: 'tx_calcao_titanico', calcao_tempestade: 'tx_calcao_tempestade' };
const MV_TX_CAN = { caneleira_runica: 'tx_caneleira_runica', caneleira_bigorna: 'tx_caneleira_bigorna', caneleira_tronco: 'tx_caneleira_tronco', caneleira_gelo_eterno: 'tx_caneleira_gelo_eterno' };
// chapéus e colares ainda sem arte própria: usam a arte de uma peça parecida que já existe
const MV_VISUAL = { elmo_runico: 'elmo_negro', coroa_cristal: 'coroa_galactica', elmo_titanico: 'capacete_dragao', coroa_tempestade: 'coroa_imortal',
  amuleto_runico: 'colar_rubi', medalhao_brasa: 'medalha_copa', colar_pena_trovao: 'estrela_campea', amuleto_tempestade: 'amuleto_lunar' };
{
  const _lookMv = lookJogador;
  lookJogador = function () {
    const s = G.save, eq = s && s.equip;
    if (!eq) return _lookMv.apply(this, arguments);
    const troca = {}; for (const slot of ['cabeca', 'acessorio']) { const v = MV_VISUAL[eq[slot]]; if (v && ITENS[v]) { troca[slot] = eq[slot]; eq[slot] = v; } }
    let L; try { L = _lookMv.apply(this, arguments); } finally { Object.assign(eq, troca); }
    try {
      if (L && !L.folha) {
        if (MV_TX_CAL[eq.calcao]) { L.txCalcao = MV_TX_CAL[eq.calcao]; delete L._kb; }
        if (MV_TX_CAN[eq.perna]) { L.txCanel = MV_TX_CAN[eq.perna]; delete L._kb; }
      }
    } catch (e) { }
    return L;
  };
}
Object.assign(ITENS, {
  elixir_multiverso: { nome: 'Multiverse Elixir', tipo: 'consumivel', efeito: { hp: 20000 }, lvl: 400, preco: 9500, venda: 1900, desc: 'Restores 20,000 stamina. Level 400.', icon: { k: 'copo', c: '#ff9a3a' } },
  foco_multiverso: { nome: 'Rune Focus Crystal', tipo: 'consumivel', efeito: { foco: 10000 }, lvl: 400, preco: 9000, venda: 1800, desc: 'Restores 10,000 focus. Level 400.', icon: { k: 'copo', c: '#5ac8ff' } },
  banquete_anao: { nome: 'Dwarf Feast', tipo: 'comida', efeito: { dur: 900, regen: 13, regenFoco: 9, atr: { defesa: 24, habilidade: 24, inteligencia: 24, folego: 24 } }, lvl: 400, preco: 11000, venda: 2200, desc: 'Stone bread, mushroom soup and honey pie: +24 to EVERYTHING and lots of recovery for 15 min.', iconeBase: 'i_folha_magica', matiz: 20 },
});
for (const [id, , L, , , , item, nomeItem, descItem] of MV_BICHOS) ITENS[item] = { nome: nomeItem, tipo: 'loot', venda: Math.round(L * 16), desc: descItem };
for (const [id, , L, , item, nomeItem, descItem] of MV_CHEFES) ITENS[item] = { nome: nomeItem, tipo: 'loot', venda: Math.round(L * 600), desc: descItem };
const MV_ASSETS = ['mv_portal_anoes', 'mv_portal_gigantes', 'mv_portal_selado', 'mv_portal_rio', 'mv_torre_infinita2', 'b_anao_casa', 'b_anao_forja', 'b_anao_taverna', 'b_anao_salao', 'b_gig_cabana', 'b_gig_castelo', 'b_gig_moinho', 'b_gig_casa_pedra',
  'carrinho_mina', 'bigorna_runica', 'lampiao_cristal', 'barris_anao', 'pinheiro_gigante', 'toco_machado', 'pedra_runica', 'nuvem_arbusto', ...MV_ID,
  ...MV_BICHOS.map(b => 'i_' + b[6]), ...MV_CHEFES.map(c => 'i_' + c[4]), ...MV_ITENS_EQUIP.map(id => 'i_' + id)];
MV_ASSETS.forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });

/* ---------- os adversários ---------- */
// faixa de equipamento que cada nível derruba (sempre bem raro)
const mvFaixaDe = L => L < 440 ? MV_FAIXAS[0] : L < 478 ? MV_FAIXAS[1] : L < 525 ? MV_FAIXAS[2] : MV_FAIXAS[3];
const MV_CHANCE_PECA = 0.0008; // cada peça da faixa: ~1 em 1.250 adversários
function mvCriaBicho(id, nome, L, arq, alt, voa, falas) {
  const m = montaMonstro(id, nome, arq, L, { falas, proj: voa || arq === 'meia' ? 'bolaforte' : 'bola' });
  m.look = { tipo: id, spr: id, voa, grande: alt >= 1.3 }; ALTURA_BICHO[id] = alt;
  m.ouro = [Math.round(0.8 * L ** 1.5), Math.round(1.2 * L ** 1.5)];
  // medido na suíte de classes (habilidades realistas ~90, melhor equipamento do nível): com o ataque normal ninguém precisava
  // nem de poção contra 3 de uma vez; com ×1,8 fica no peso dos níveis 100–300 (400–650% do fôlego por minuto contra 3)
  if (arq !== 'chefe') { m.hp = Math.round(m.hp * 2.0); m.xp = Math.round(m.xp * 1.6); m.atk = Math.round(m.atk * 1.8); if (m.ranged) m.ranged.dano = Math.round(m.ranged.dano * 1.8); }
  return m;
}
for (const [id, nome, L, arq, alt, voa, item, , , falas] of MV_BICHOS) {
  const m = mvCriaBicho(id, nome, L, arq, alt, voa, falas); const f = mvFaixaDe(L); const pecas = Object.keys(f.pecas);
  const p1 = pecas[(L >> 1) % pecas.length], p2 = pecas[((L >> 1) + 3) % pecas.length];
  m.loot = [[item, 0.3, 1, 2], ['fio_ouro', 0.025, 1, 1], ['elixir_multiverso', 0.05, 1, 1], [p1, MV_CHANCE_PECA, 1, 1], [p2, MV_CHANCE_PECA, 1, 1]];
}
for (const [id, nome, L, alt, item] of MV_CHEFES) {
  const ch = mvCriaBicho(id, nome, L, 'chefe', alt, false, ['Nobody gets past my goal!', 'Show me the soccer from your land!', 'Nobody has beaten me in a thousand years!']);
  // s18 (melhor equipamento + 3 comidas + habilidades ~90): com ×2,2/×1,1 caía em 25–80 s quase sem dar dano. Agora: 1,5–3 min e precisa de poção
  ch.hp = Math.round(ch.hp * 5.5); ch.xp = Math.round(ch.xp * 2.4); ch.atk = Math.round(ch.atk * 2.65); if (ch.ranged) ch.ranged.dano = Math.round(ch.ranged.dano * 2.4); ch.respawn = 1200000; ch.ouro = ch.ouro.map(v => v * 3);
  const f = mvFaixaDe(L); const pecas = Object.keys(f.pecas);
  ch.loot = [[item, 1, 1, 1], ['fio_ouro', 1, 3, 6], ...pecas.map(p => [p, p.startsWith('coroa') ? 0.02 : 0.035, 1, 1])];
}
// retratos (wiki, lista de batalha): a arte de cada criatura
{
  const _desenhaBichoMv = desenhaBicho;
  desenhaBicho = function (x, tipo, px, py, s, a) {
    if (!MV_ID.has(tipo)) return _desenhaBichoMv.apply(this, arguments);
    const im = aSprite(tipo); if (!im) return;
    const h = Math.min(ALTURA_BICHO[tipo] || 1, 1.6) * T * s, w = h * im.width / im.height;
    x.save(); x.translate(px, py); if (a && a.flip === false) x.scale(-1, 1); x.drawImage(im, -w / 2, -h, w, h); x.restore();
  };
}

/* ---------- ajudantes de mapa ---------- */
// lugar fechado (Pedraforte): o que não é chão vira rocha; a parede com chão embaixo fica "de frente", às vezes com enfeite
function mvFechaRocha(b, piso, enfeites) {
  const { w: W, h: H } = b.m;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    if (piso[j * W + i]) continue;
    const frente = j + 1 < H && piso[(j + 1) * W + i];
    b.m.chao[j * W + i] = frente ? CH.FACE_CAV : CH.PAREDE_CAV; b.m.obj[j * W + i] = { t: 'x', v: 0 };
    if (frente && enfeites && hash2(i * 11, j * 13) < 0.16) b.m.obj[j * W + i] = { t: enfeites[(hash2(i, j) * enfeites.length) | 0], v: 0 };
  }
}
// enfeites espalhados, mas nunca na frente de porta/entrada/NPC/placa (crivo: nada bloqueando passagem)
function mvProtegido(m, entradas) {
  const W = m.w, P = new Uint8Array(W * m.h), marca = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < W && y < m.h) P[y * W + x] = 1; };
  for (const s of m.saidas) marca(s.x - 2, s.y - 1, s.x + 2, s.y + 3);
  for (const p of m.predios) marca(p.porta.x - 1, p.porta.y, p.porta.x + 1, p.porta.y + 2);
  for (const n of m.npcs) marca(n.x - 2, n.y - 2, n.x + 2, n.y + 3);
  for (const p of m.placas) marca(p.x - 1, p.y - 1, p.x + 1, p.y + 1);
  for (const e of entradas || []) marca(e.x - 1, e.y - 1, e.x + 3, e.y + 6);
  if (m.inicio) marca(m.inicio.x - 2, m.inicio.y - 2, m.inicio.x + 2, m.inicio.y + 2);
  return (x, y) => !!P[y * W + x];
}
function mvEspalha(b, tipos, n, filtro, prot) {
  let tent = 0; const { w: W, h: H } = b.m;
  while (n > 0 && tent++ < n * 60) {
    const i = 3 + ((b.r() * (W - 6)) | 0), j = 3 + ((b.r() * (H - 6)) | 0);
    if (!b.livre(i, j) || prot(i, j) || !filtro(b.m.chao[j * W + i])) continue;
    b.obj(i, j, tipos[(b.r() * tipos.length) | 0]); n--;
  }
}
const mvEntradasDe = host => (typeof MV_CACAS !== 'undefined' ? MV_CACAS : []).filter(c => c.host === host).map(c => c.pos);
// portal-prédio com passagem para outro mapa (a porta é o meio da base)
function mvPortal(b, spr, x, y, para, tx, ty, req) {
  const p = b.predio(spr, x, y, 4, 2); const d = p.porta;
  if (para) b.m.saidas.push(Object.assign({ x: d.x, y: d.y, para, tx, ty }, req ? { req } : {}));
  return d;
}

/* ---------- o Estádio do Multiverso (hub) ---------- */
const MV_HUB = { portalAnoes: null, portalGigantes: null, chegada: { x: 30, y: 39 } };
function criaMultiverso() {
  const W = 60, H = 46; const b = new Construtor('multiverso', '🌀 Multiverse Stadium', W, H, CH.ESTRELAS, 4401);
  const cx = 30, cy = 23, rx = 27, ry = 20, dentro = (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 0.97;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (dentro(x, y)) b.chao(x, y, CH.MV_PRACA); else b.obj(x, y, 'x'); }
  // o campo no meio, com o anel de passarela em volta
  for (let y = 13; y <= 28; y++) for (let x = 19; x <= 40; x++) if (y <= 14 || y >= 27 || x <= 20 || x >= 39) b.chao(x, y, CH.METAL);
  b.campo(22, 16, 16, 10, CH.CAMPO);
  for (const [x, y] of [[21, 15], [38, 15], [21, 26], [38, 26]]) b.obj(x, y, 'holofote');
  // chegada (embaixo) e a avenida até o campo
  b.ret(27, 36, 7, 6, CH.METAL); b.ret(29, 28, 3, 9, CH.METAL);
  b.m.inicio = { x: 30, y: 39 }; b.m.renasce = { x: 30, y: 39 };
  b.npc('guardiao_volta', 34, 38);
  b.placa(26, 37, '🌀 MULTIVERSE STADIUM — after the Intergalactic Cup, the portals opened! Each portal leads to a world where soccer is different. The Infinite Tower (on the right) never ends.');
  // os portais (em cima, em arco) e as passarelas até eles
  const pa = mvPortal(b, 'mv_portal_anoes', 12, 9, 'pedraforte', 32, 44, { flag: 'mv_lib_anoes', msg: '🔒 The Dwarf Portal only opens from level 400.' });
  const pg = mvPortal(b, 'mv_portal_gigantes', 20, 5, 'picos_nublados', 32, 44, { flag: 'mv_lib_gigantes', msg: '🔒 The Giant Portal only opens from level 478.' });
  const ps1 = mvPortal(b, 'mv_portal_selado', 36, 5), ps2 = mvPortal(b, 'mv_portal_selado', 44, 9);
  MV_HUB.portalAnoes = pa; MV_HUB.portalGigantes = pg;
  for (const d of [pa, pg, ps1, ps2]) { for (let y = d.y + 1; y <= 13; y++) b.chao(d.x, y, CH.METAL); }
  b.ret(pa.x, 12, 20 - pa.x, 2, CH.METAL); b.ret(40, 12, ps2.x - 40 + 1, 2, CH.METAL);
  b.placa(pa.x - 2, pa.y + 1, '⛏️ DWARF PORTAL — the Kingdom of Stonehold, inside the mountain (levels 405 to 470).');
  b.placa(pg.x + 2, pg.y + 1, '☁️ GIANT PORTAL — the Cloudy Peaks, above the clouds (levels 482 to 560).');
  b.placa(ps1.x + 2, ps1.y + 1, '🔒 SEALED PORTAL — nobody knows yet what world is on the other side... Coming soon!');
  b.placa(ps2.x + 2, ps2.y + 1, '🔒 SEALED PORTAL — they say dinosaurs play soccer over there. Coming soon!');
  // a Torre Infinita (à direita)
  b.predio('mv_torre_infinita2', 46, 18, 7, 4); b.ret(41, 22, 9, 2, CH.METAL); b.ret(49, 22, 2, 3, CH.METAL); // v353 (dono: "mais amedrontadora e maior"): obsidiana, correntes, portão-bocarra
  b.npc('mestre_torre', 53, 23);
  b.placa(46, 24, '🗼 INFINITE TOWER — each floor is harder than the one before, from level 406 to 1000... and beyond. Talk to the Tower Master.');
  // o Guardião, a loja e o quadro (embaixo do campo)
  b.npc('guardiao_mv', 26, 31); b.npc('loja_mv', 35, 31); b.npc('quadro', 23, 33);
  // enfeites só no chão da praça (nunca nas passarelas)
  mvEspalha(b, ['cristal_flutuante', 'estrela_caida', 'cogumelo_cosmico', 'cristal_flutuante'], 20, t => t === CH.MV_PRACA, mvProtegido(b.m));
  b.m.espaco = { tinta: 'rgba(140,90,255,0.08)' };
  return b.m;
}
MAPAS_DEF.multiverso = criaMultiverso;

/* ---------- Reino de Pedraforte (anões) ---------- */
function criaPedraforte() {
  const W = 64, H = 50; const b = new Construtor('pedraforte', '⛏️ Kingdom of Stonehold', W, H, CH.PAREDE_CAV, 4501); const m = b.m;
  const piso = new Uint8Array(W * H);
  const cava = (x, y, w, h, ch) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i > 0 && j > 0 && i < W - 1 && j < H - 1) { piso[j * W + i] = 1; m.chao[j * W + i] = ch; } };
  // a grande caverna (chão de pedra bruta) e o salão do rei, lá em cima
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (((x - 32) / 28) ** 2 + ((y - 27) / 20) ** 2 <= 1) cava(x, y, 1, 1, CH.CAVERNA);
  cava(23, 3, 18, 9, CH.CAVERNA);
  // ruas calçadas: a avenida do rei (vertical) e a rua das oficinas (horizontal)
  cava(30, 7, 4, 40, CH.MV_PISO_ANAO); cava(6, 21, 52, 3, CH.MV_PISO_ANAO); cava(24, 8, 16, 4, CH.MV_PISO_ANAO);
  // o rio de lava, com três pontes
  for (let x = 5; x < 59; x++) for (const y of [32, 33]) { if (!piso[y * W + x]) continue; if ((x >= 30 && x <= 33) || x === 13 || x === 14 || x === 50 || x === 51) { m.chao[y * W + x] = CH.MV_PISO_ANAO; continue; } m.chao[y * W + x] = CH.MV_LAVA; }
  // chegada: o portal de volta (embaixo)
  cava(28, 41, 8, 6, CH.MV_PISO_ANAO);
  mvFechaRocha(b, piso, ['cristais', 'tocha', 'estalagmite', 'cristais']);
  for (let x = 5; x < 59; x++) for (const y of [32, 33]) if (m.chao[y * W + x] === CH.MV_LAVA) m.obj[y * W + x] = { t: 'x', v: 0 }; // lava não se atravessa
  mvPortal(b, 'mv_portal_anoes', 30, 42, 'multiverso', 0, 0); // destino ligado depois (frente do portal no hub)
  b.m.inicio = { x: 32, y: 45 }; b.m.renasce = { x: 32, y: 45 };
  // prédios
  b.predio('b_anao_salao', 27, 5, 8, 4);
  b.predio('b_anao_forja', 18, 15, 6, 3); b.predio('b_anao_taverna', 40, 15, 6, 3);
  b.predio('b_anao_casa', 9, 25, 5, 3); b.predio('b_anao_casa', 50, 25, 5, 3); b.predio('b_anao_casa', 18, 36, 5, 3); b.predio('b_anao_casa', 41, 36, 5, 3);
  // NPCs
  b.npc('rei_barbaferro', 29, 10); b.npc('mestra_bigorna', 21, 19); b.npc('taverneiro_anao', 43, 19); b.npc('quadro', 35, 10);
  b.placa(34, 44, '⛏️ KINGDOM OF STONEHOLD — the dwarves have played soccer inside the mountain for a thousand years! Talk to King Ironbeard (up top, in front of the hall).');
  // enfeites: lampiões nas ruas, a forja, os barris da taverna, carrinhos de mina
  for (let y = 12; y <= 40; y += 6) { if (!m.obj[y * W + 29] && piso[y * W + 29]) b.obj(29, y, 'lampiao_cristal'); if (!m.obj[y * W + 34] && piso[y * W + 34]) b.obj(34, y, 'lampiao_cristal'); }
  for (const x of [17, 25, 39, 47]) if (!m.obj[24 * W + x] && piso[24 * W + x]) b.obj(x, 24, 'lampiao_cristal');
  b.obj(25, 17, 'bigorna_runica'); b.obj(17, 18, 'barris_anao'); b.obj(47, 17, 'barris_anao'); b.obj(39, 18, 'barris_anao');
  for (const [x, y] of [[13, 14], [51, 14], [14, 40], [50, 40]]) if (!m.obj[y * W + x] && piso[y * W + x]) b.obj(x, y, 'carrinho_mina');
  mvEspalha(b, ['cogumelos', 'cristais', 'estalagmite', 'rochas'], 40, t => t === CH.CAVERNA, mvProtegido(m, mvEntradasDe('pedraforte')));
  for (const [x, y] of [[8, 31], [20, 31], [40, 31], [56, 31], [10, 34], [26, 34], [38, 34], [54, 34]]) if (piso[y * W + x] && !m.obj[y * W + x]) b.obj(x, y, 'rocha_lava');
  Object.assign(m, { fechado: true, luzCor: '255,200,140', luzes: ['lampiao_cristal', 'tocha', 'cristais', 'rocha_lava', 'cogumelos'] });
  return m;
}
MAPAS_DEF.pedraforte = criaPedraforte;

/* ---------- Picos Nublados (gigantes) ---------- */
function criaPicos() {
  const W = 64, H = 50; const b = new Construtor('picos_nublados', '☁️ Cloudy Peaks', W, H, CH.MV_NUVEM, 4601); const m = b.m;
  const terra = (x, y) => ((x - 32) / 28) ** 2 + ((y - 26) / 21) ** 2 <= 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (terra(x, y)) { b.chao(x, y, CH.MV_NEVE); continue; }
    const borda = terra(x + 1, y) || terra(x - 1, y) || terra(x, y + 1) || terra(x, y - 1);
    b.obj(x, y, borda && (x + y) % 3 === 0 ? 'nuvem_arbusto' : 'x');
  }
  // campinhos de grama no meio da neve (manchas redondas, não quadradas)
  for (let k = 0; k < 11; k++) {
    const mx = 8 + b.r() * 48, my = 7 + b.r() * 36, rr = 3.5 + b.r() * 3.5;
    for (let y = Math.floor(my - rr); y <= my + rr; y++) for (let x = Math.floor(mx - rr); x <= mx + rr; x++) if (terra(x, y) && (x - mx) ** 2 + ((y - my) * 1.15) ** 2 <= rr * rr) b.chao(x, y, CH.GRAMA);
  }
  // caminhos de pedra: a subida até o castelo e a estrada das cabanas
  b.ret(30, 11, 4, 34, CH.PEDRA); b.ret(7, 23, 50, 2, CH.PEDRA); b.ret(26, 11, 12, 3, CH.PEDRA);
  b.ret(28, 41, 8, 5, CH.PEDRA);
  mvPortal(b, 'mv_portal_gigantes', 30, 42, 'multiverso', 0, 0);
  b.m.inicio = { x: 32, y: 45 }; b.m.renasce = { x: 32, y: 45 };
  b.predio('b_gig_castelo', 29, 7, 5, 4);
  b.predio('b_gig_cabana', 13, 16, 5, 3); b.predio('b_gig_cabana', 46, 16, 5, 3);
  b.predio('b_gig_moinho', 11, 29, 4, 3); b.predio('b_gig_casa_pedra', 48, 29, 5, 3);
  b.npc('rainha_nimbus', 34, 13); b.npc('ferreiro_gigante', 20, 20); b.npc('cozinheira_gigante', 43, 20); b.npc('quadro', 27, 13);
  b.placa(35, 44, '☁️ CLOUDY PEAKS — the giants live above the clouds, and their field is as big as a mountain! Talk to Queen Nimbus, in front of the castle.');
  const prot = mvProtegido(m, mvEntradasDe('picos_nublados'));
  mvEspalha(b, ['pinheiro_gigante', 'pinheiro_gigante', 'pedra_runica', 'toco_machado', 'pinheiro'], 46, t => t === CH.MV_NEVE || t === CH.GRAMA, prot);
  mvEspalha(b, ['nuvem_arbusto'], 8, t => t === CH.MV_NEVE, prot);
  return m;
}
MAPAS_DEF.picos_nublados = criaPicos;
// a volta pelos portais cai na frente do portal certo, no hub
{
  const _getMv = getMapa;
  getMapa = function (id) {
    const m = _getMv.apply(this, arguments);
    if ((id === 'pedraforte' || id === 'picos_nublados') && !m._mvLigado) {
      try { getMapa('multiverso'); } catch (e) { }
      const d = id === 'pedraforte' ? MV_HUB.portalAnoes : MV_HUB.portalGigantes;
      const sd = m.saidas.find(s => s.para === 'multiverso'); if (sd && d) { sd.tx = d.x; sd.ty = d.y + 1; }
      m._mvLigado = true;
    }
    return m;
  };
}

/* ---------- as áreas de caça ---------- */
Object.assign(TEMAS_CACA, {
  mv_mina: { chao: CH.CAVERNA, parede: CH.PAREDE_CAV, props: ['carrinho_mina', 'barris_anao', 'cristais', 'lampiao_cristal'], enfeite: ['cristais', 'estalagmite'], luz: ['lampiao_cristal', 'cristais'], tocha: 'lampiao_cristal', cor: '255,210,140' },
  mv_grutas: { chao: CH.CAVERNA, parede: CH.PAREDE_CAV, props: ['cogumelos', 'cristais', 'estalagmite', 'lampiao_cristal'], enfeite: ['cristais', 'cogumelos'], luz: ['cristais', 'cogumelos', 'lampiao_cristal'], tocha: 'cristais', cor: '140,200,255' },
  mv_lava: { chao: CH.CAVERNA, parede: CH.ROCHA_LAVA, props: ['rocha_lava', 'bigorna_runica', 'estalagmite', 'rocha_lava'], enfeite: ['rocha_lava', 'estalagmite'], densa: 1, luz: ['rocha_lava', 'tocha'], tocha: 'rocha_lava', cor: '255,120,60' },
  mv_nuvens: { aberto: 1, chao: CH.MV_NEVE, var: CH.GRAMA, trilha: CH.PEDRA, borda: ['nuvem_arbusto', 'nuvem_arbusto', 'pinheiro', 'nuvem_arbusto'], props: ['pedra_runica', 'nuvem_arbusto', 'pinheiro'] },
  mv_floresta: { aberto: 1, chao: CH.GRAMA, var: CH.MV_NEVE, trilha: CH.TERRA, borda: ['pinheiro', 'pinheiro', 'arbusto', 'pinheiro', 'pinheiro_gigante', 'arbusto'], props: ['toco_machado', 'pedra_runica', 'pinheiro_gigante'] },
  mv_ponte: { aberto: 1, chao: CH.PEDRA, var: CH.MV_NEVE, trilha: CH.TERRA, borda: ['rochas', 'pinheiro', 'rochas', 'pedra_runica'], agua: 0.2, props: ['pedra_runica', 'rochas', 'toco_machado'] },
  mv_trono: { chao: CH.CAVERNA, parede: CH.PAREDE_CAV, props: [] },
  mv_pico: { aberto: 1, chao: CH.MV_NEVE, borda: [], props: [] },
});
const lkAnao = (pele, cor, extra) => Object.assign({ tipo: 'humano', corpo: 'm', alt: 1.12, mvEscala: 0.66, folha: 'barbudo', pele, cabelo: 'cabelo-curto', corCabelo: 'ruivo', roupa: 'roupa-futebol', corRoupa: cor, baixo: 'baixo-jeans' }, extra || {});
const lkGigante = (pele, cor, extra) => Object.assign({ tipo: 'humano', corpo: 'm', alt: 2.35, mvEscala: 1.5, folha: 'grandao', pele, cabelo: 'cabelo-curto', corCabelo: 'castanho', roupa: 'roupa-futebol', corRoupa: cor, baixo: 'baixo-jeans' }, extra || {});
const MV_CACAS = [
  { id: 'caca_mv_minas', nome: 'Crystal Mines', host: 'pedraforte', m: 'mv_anao_mineiro', sec: 'mv_cogumelo', tema: 'mv_mina', ent: 'ent_toca', pos: { x: 9, y: 16 }, guia: 'Miner Bento Longbeard', look: lkAnao('pele-clara', '#3a7a3a', { corCabelo: 'ruivo' }) },
  { id: 'caca_mv_grutas', nome: 'Lantern Caves', host: 'pedraforte', m: 'mv_morcego_lampiao', sec: 'mv_cogumelo', tema: 'mv_grutas', ent: 'ent_cristal', pos: { x: 52, y: 16 }, guia: 'Lamplighter Gilda', look: lkAnao('pele-media', '#2a5ad0', { corpo: 'f', folha: 'trancas', cabelo: 'cabelo-rabo', corCabelo: 'loiro' }) },
  { id: 'caca_mv_lava', nome: 'Lava River', host: 'pedraforte', m: 'mv_golem_brasa', sec: 'mv_besouro_bigorna', tema: 'mv_lava', ent: 'ent_vulcao', pos: { x: 9, y: 35 }, guia: 'Firefighter Tito Iron-Foot', look: lkAnao('pele-morena', '#d02a2a', { corCabelo: 'preto' }) },
  { id: 'caca_mv_trono', nome: 'King Boulder\'s Ancient Forge', host: 'pedraforte', m: 'mv_anao_ferreira', sec: 'mv_besouro_bigorna', tema: 'mv_trono', chefe: 'mv_chefe_golem_rei', ent: 'ent_catacumba', pos: { x: 52, y: 35 }, guia: 'Old Blacksmith Olaf', look: lkAnao('pele-clara', '#6a4a2a', { corCabelo: 'grisalho' }) },
  { id: 'caca_mv_nuvens', nome: 'Cloud Fields', host: 'picos_nublados', m: 'mv_carneiro_nuvem', sec: 'mv_aguia_trovao', tema: 'mv_nuvens', ent: 'ent_celeste', pos: { x: 7, y: 19 }, guia: 'Shepherdess Brisa', look: lkGigante('pele-clara', '#7ab8ff', { corpo: 'f', folha: 'adulta', cabelo: 'cabelo-coque', corCabelo: 'loiro' }) },
  { id: 'caca_mv_floresta', nome: 'Lumberjack Forest', host: 'picos_nublados', m: 'mv_gigante_lenhador', sec: 'mv_carneiro_nuvem', tema: 'mv_floresta', ent: 'ent_trilha', pos: { x: 53, y: 19 }, guia: 'Lumberjack Joca Trunk', look: lkGigante('pele-morena', '#c0302a', { folha: 'barbudo' }) },
  { id: 'caca_mv_ponte', nome: 'Troll Bridge', host: 'picos_nublados', m: 'mv_troll_ponte', sec: 'mv_ciclope', tema: 'mv_ponte', ent: 'ent_toca', pos: { x: 10, y: 35 }, guia: 'Bridge Guard Matias', look: lkGigante('pele-negra', '#3a7a3a') },
  { id: 'caca_mv_pico', nome: 'Thunder Peak', host: 'picos_nublados', m: 'mv_gigante_gelo', sec: 'mv_aguia_trovao', tema: 'mv_pico', chefe: 'mv_chefe_tita', ent: 'ent_gelo', pos: { x: 51, y: 35 }, guia: 'Giant Climber Íris', look: lkGigante('pele-media', '#f4f4f8', { corpo: 'f', folha: 'adulta', cabelo: 'cabelo-rabo', corCabelo: 'preto' }) },
];
// as duas áreas dos chefões têm desenho próprio
function dgMvTrono(c) {
  const D = dgNovo(c, 50, 44, CH.PAREDE_CAV), { W } = D;
  D.cava(19, 34, 12, 7, CH.MV_PISO_ANAO);                                   // sala de entrada
  D.cava(23, 22, 4, 12, CH.MV_PISO_ANAO);                                   // corredor central
  D.cava(4, 22, 42, 9, CH.CAVERNA); D.cava(4, 6, 12, 16, CH.CAVERNA); D.cava(34, 6, 12, 16, CH.CAVERNA); // forjas dos dois lados
  D.cava(16, 3, 18, 15, CH.MV_PISO_ANAO);                                   // o salão do trono
  D.cava(16, 18, 4, 4, CH.CAVERNA); D.cava(30, 18, 4, 4, CH.CAVERNA);
  // o tapete vermelho até o trono, cristais em volta do rei, e pedras de lava (que brilham) nas forjas
  D.chao(24, 4, 2, 14, CH.TAPETE); D.chao(16, 18, 4, 4, CH.TAPETE); D.chao(30, 18, 4, 4, CH.TAPETE); D.chao(18, 16, 14, 2, CH.TAPETE);
  for (const [x, y] of [[20, 5], [29, 5], [20, 9], [29, 9], [17, 4], [32, 4], [17, 12], [32, 12]]) D.poe(x, y, 'cristais');
  for (const [x, y] of [[8, 24], [9, 25], [10, 24], [40, 24], [41, 25], [39, 25], [10, 10], [11, 11], [38, 10], [37, 11]]) D.poe(x, y, 'rocha_lava');
  for (const [x, y] of [[6, 7], [14, 7], [36, 7], [44, 7], [6, 20], [44, 20], [12, 29], [38, 29]]) D.poe(x, y, 'bigorna_runica');
  for (const [x, y] of [[18, 4], [31, 4], [22, 14], [27, 14], [19, 35], [30, 35]]) D.poe(x, y, 'lampiao_cristal');
  for (const [x, y] of [[5, 29], [45, 29], [5, 12], [45, 12]]) D.poe(x, y, 'barris_anao');
  D.fecha(CH.PAREDE_CAV, CH.FACE_CAV, 'cristais');
  for (const [x, y] of [[9, 14], [40, 14], [10, 26], [20, 26], [30, 26], [40, 26]]) D.grupo(x, y, 4, 2);
  D.b.spawn('mv_besouro_bigorna', 9, 8, 3, 2); D.b.spawn('mv_besouro_bigorna', 40, 8, 3, 2);
  D.b.spawn('mv_chefe_golem_rei', 25, 7, 1, 1);
  D.b.placa(22, 17, '👑 THE THRONE OF KING BOULDER — the goalkeeper who hasn\'t let in a goal in a thousand years. Only go in if you\'re ready!');
  return dgFim(D, c, { ex: 25, ey: 39, guia: [21, 36], quadro: [29, 36], placa: [20, 39], fechado: true, cor: '255,180,110', luzes: ['lampiao_cristal', 'cristais', 'tocha', 'rocha_lava'] });
}
function dgMvPico(c) {
  const D = dgNovo(c, 52, 44, CH.MV_NEVE), { W } = D;
  // a trilha que sobe a montanha em zigue-zague até o cume
  D.cava(19, 34, 14, 8, CH.PEDRA);
  D.cava(6, 28, 40, 6, CH.MV_NEVE); D.cava(6, 18, 6, 10, CH.MV_NEVE); D.cava(6, 18, 40, 6, CH.MV_NEVE); D.cava(40, 10, 6, 8, CH.MV_NEVE); D.cava(10, 8, 36, 6, CH.MV_NEVE);
  D.circ(26, 6, 6, CH.GELO);                                                 // o cume
  D.chao(6, 30, 40, 2, CH.PEDRA); D.chao(8, 20, 2, 8, CH.PEDRA); D.chao(8, 20, 36, 2, CH.PEDRA); D.chao(42, 12, 2, 8, CH.PEDRA); D.chao(12, 10, 32, 2, CH.PEDRA);
  for (const [x, y] of [[14, 32], [36, 32], [16, 22], [34, 22], [20, 12], [32, 12]]) D.poe(x, y, 'pedra_runica');
  D.abre(['pinheiro', 'nuvem_arbusto', 'rochas', 'pinheiro', 'nuvem_arbusto']);
  for (const [x, y] of [[12, 30], [24, 30], [38, 30], [9, 24], [20, 20], [32, 20], [43, 15], [18, 10], [36, 10]]) D.grupo(x, y, 4, 2);
  D.b.spawn('mv_aguia_trovao', 30, 30, 3, 2); D.b.spawn('mv_aguia_trovao', 26, 20, 3, 2);
  D.b.spawn('mv_chefe_tita', 26, 5, 1, 1);
  D.b.placa(30, 9, '⚡ THE SUMMIT OF THE THUNDER TITAN — when he kicks, the whole sky thunders. Only climb up if you\'re ready!');
  return dgFim(D, c, { ex: 26, ey: 39, guia: [21, 36], quadro: [31, 36], placa: [20, 39], fechado: false });
}
MV_CACAS.forEach((c, i) => {
  c.seed = 9601 + i * 151;
  registraCaca(c);
  if (c.tema === 'mv_trono') MAPAS_DEF[c.id] = () => dgMvTrono(c);
  else if (c.tema === 'mv_pico') MAPAS_DEF[c.id] = () => dgMvPico(c);
  else { // as áreas do gerador ganham o segundo adversário (1 grupo em cada 3)
    const base = MAPAS_DEF[c.id];
    MAPAS_DEF[c.id] = function () { const m = base(); m.spawns.forEach((sp, k) => { if (sp.m === c.m && k % 3 === 2) sp.m = c.sec; }); return m; };
  }
  if (typeof PAPEL !== 'undefined' && !PAPEL['guia_' + c.id]) PAPEL['guia_' + c.id] = c.look.corpo === 'f' ? 'adulta' : 'adulto';
  // a placa da área fala das DUAS espécies (o texto padrão dizia "aqui só tem...")
  { const cria = MAPAS_DEF[c.id];
    MAPAS_DEF[c.id] = function () {
      const m = cria(); const d1 = MONSTROS[c.m], d2 = MONSTROS[c.sec];
      for (const p of m.placas) if (/aqui só tem|only .+ here/.test(p.texto)) p.texto = `🎯 ${c.nome.toUpperCase()} — here play ${d1.nome} (level ${nivelMonstro(d1)}) and ${d2.nome} (level ${nivelMonstro(d2)})${c.chefe ? `, and deep inside lives ${MONSTROS[c.chefe].nome}` : ''}. Missions from the Guide and challenges on the Board!`;
      return m;
    }; }
  const d = MONSTROS[c.m]; if (NPCS['guia_' + c.id]) NPCS['guia_' + c.id].ola = `Welcome to ${c.nome}! Here the "${d.nome}" team (level ${nivelMonstro(d)}) plays alongside ${MONSTROS[c.sec].nome}. Tough game! Want a mission?`;
});
DESAFIOS.pedraforte = [['mv_anao_mineiro', 200], ['mv_cogumelo', 200], ['mv_golem_brasa', 200]];
DESAFIOS.picos_nublados = [['mv_carneiro_nuvem', 200], ['mv_gigante_lenhador', 200], ['mv_troll_ponte', 200]];
DESAFIOS.multiverso = [['mv_anao_mineiro', 300], ['mv_besouro_bigorna', 300], ['mv_aguia_trovao', 300], ['mv_gigante_gelo', 300]];

/* ---------- NPCs ---------- */
const LOOK_GUARDIAO = { tipo: 'humano', corpo: 'm', alt: 1.85, folha: 'anciao', pele: 'pele-retinta', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-terno', corRoupa: '#4a2a8a', baixo: 'baixo-jeans', chapeu: 'chapeu-cartola', chapeuVar: 'coroa_galactica', mvManterChapeu: true };
Object.assign(NPCS, {
  guardiao_rio: { nome: 'Multiverse Guardian', mvViagem: 'ir', look: LOOK_GUARDIAO, ola: 'This portal was sealed for a thousand years... It only opens for those who won the Intergalactic Cup. On the other side there are worlds where dwarves, giants and creatures you\'ve never seen play soccer!' },
  guardiao_volta: { nome: 'Multiverse Guardian', mvViagem: 'voltar', look: LOOK_GUARDIAO, ola: 'Where do you want to go back to? The portal takes you to Earth or to the Space Station.' },
  guardiao_mv: { nome: 'Grand Guardian Orbitto', look: Object.assign({}, LOOK_GUARDIAO, { corRoupa: '#1a1a4a', pescoco: 'pescoco-apito' }), ola: 'The Legendary Challenges are for those who really want to be number 1: tough, long... and they pay like nothing else. Want to take them on?' },
  loja_mv: { nome: 'Star Merchant Zuri', loja: ['elixir_multiverso', 'foco_multiverso', 'banquete_anao', 'soro_estelar', 'cristal_foco'], look: { tipo: 'humano', corpo: 'f', alt: 1.74, pele: 'pele-negra', cabelo: 'cabelo-black-power', corCabelo: 'preto', roupa: 'roupa-terno', corRoupa: '#d8a020', baixo: 'baixo-saia' }, ola: 'Multiverse Elixirs, focus crystals and the famous Dwarf Feast! Equipment? Oh, that only drops from opponents... and it\'s super rare!' },
  rei_barbaferro: { nome: 'King Ironbeard, of the dwarves', look: lkAnao('pele-clara', '#8a1a2a', { corCabelo: 'grisalho', chapeu: 'chapeu-cartola', chapeuVar: 'coroa', mvManterChapeu: true, mvEscala: 0.72 }), ola: 'Welcome to Stonehold! Down here we forge the best cleats in the Multiverse... and play the best soccer inside the mountain. Prove your worth!' },
  mestra_bigorna: { nome: 'Master Anvil, the forger', loja: ['elixir_multiverso', 'foco_multiverso'], look: lkAnao('pele-morena', '#6a4a2a', { corpo: 'f', folha: 'avental', cabelo: 'cabelo-rabo', corCabelo: 'ruivo' }), ola: 'Rune and Ember cleats? Only the opponents here carry them, and they almost never drop them. I sell what keeps you on your feet.' },
  taverneiro_anao: { nome: 'Innkeeper Barrel', loja: ['banquete_anao', 'elixir_multiverso'], look: lkAnao('pele-media', '#c88a3a', { corCabelo: 'castanho' }), ola: 'Fresh Dwarf Feast! Whoever eats it can last a whole game against an Ember Golem.' },
  rainha_nimbus: { nome: 'Queen Nimbus, of the giants', look: lkGigante('pele-clara', '#7ab8ff', { corpo: 'f', folha: 'adulta', cabelo: 'cabelo-coque', corCabelo: 'loiro', chapeu: 'chapeu-cartola', chapeuVar: 'coroa_estelar', mvManterChapeu: true, mvEscala: 1.6 }), ola: 'Well, well, a little one! Up here everything is big: the ball, the goal, the opponents. If you want to play with the giants, you\'ll need courage!' },
  ferreiro_gigante: { nome: 'Giant Blacksmith Bruno', loja: ['elixir_multiverso', 'foco_multiverso'], look: lkGigante('pele-negra', '#5a5a6a', { folha: 'avental' }), ola: 'Giant potions! Titanic Equipment? Only by taking it from the lumberjacks and the trolls... and good luck with that!' },
  cozinheira_gigante: { nome: 'Giant Cook Dona Farofa', loja: ['banquete_anao'], look: lkGigante('pele-morena', '#ff7a9a', { corpo: 'f', folha: 'gordinha', cabelo: 'cabelo-coque' }), ola: 'Giant food, giant portions! The dwarves invented the feast, but we make it bigger.' },
});
if (typeof PAPEL !== 'undefined') Object.assign(PAPEL, { guardiao_rio: 'adulto', guardiao_volta: 'adulto', guardiao_mv: 'adulto', loja_mv: 'adulta', rei_barbaferro: 'adulto', mestra_bigorna: 'adulta', taverneiro_anao: 'adulto', rainha_nimbus: 'adulta', ferreiro_gigante: 'adulto', cozinheira_gigante: 'adulta' });

// anões menores e gigantes maiores que o normal (cidade_arrumada.js deixa todo mundo do tamanho do seu boneco)
{
  const _altMv = alturaEnt;
  alturaEnt = function (e) {
    const h = _altMv.apply(this, arguments); const d = e && (e._dV || e.d), l = d && d.look;
    if (!l || !l.mvEscala || !G.save || e === G.p) return h;
    return Math.max(ALT_FASE[faseIdx(G.save.nivel)], 1.5) * l.mvEscala;
  };
}

/* ---------- viagem: o portal do Rio, a Estação e o hub ---------- */
const MV_NIVEL = 400;
function mvPodeIr() { const s = G.save; return !s ? 'no game' : s.nivel < MV_NIVEL ? `🔒 Only from level ${MV_NIVEL}` : !s.flags.campeao_galaxia ? '🔒 Win the Intergalactic Cup first (Chapter 9)' : ''; }
let MV_VOLTA_RIO = null;
function mvVaiHub() { fechaModal(); som('porta'); trocaMapa('multiverso', MV_HUB.chegada.x + 0.5, MV_HUB.chegada.y + 0.5); banner('🌀 Multiverse Stadium', 'The portals are open!'); }
function modalViagemMv(npc) {
  const d = npc.d, fecha = el('button', { class: 'btn', onclick: fechaModal }, 'Not now'); const ops = [];
  if (d.mvViagem === 'ir') {
    const trava = mvPodeIr();
    ops.push(el('button', { class: 'btn amarelo', disabled: trava ? 'disabled' : null, onclick: mvVaiHub }, trava || '🌀 Go through the portal to the Multiverse'));
  } else {
    ops.push(el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); som('porta'); getMapa('rio'); const p = MV_VOLTA_RIO || getMapa('rio').inicio; trocaMapa('rio', p.x + 0.5, p.y + 1.5); } }, '🌎 Go back to Earth (Rio airport square)'));
    ops.push(el('button', { class: 'btn', onclick: () => { fechaModal(); som('porta'); trocaMapa('estacao'); } }, '🛰️ Go to the Space Station'));
  }
  abreModal(el('h2', {}, d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, d.ola))),
    el('p', { class: 'dica' }, 'In the Multiverse: the Kingdom of Stonehold (dwarves, levels 405–470), the Cloudy Peaks (giants, 482–560) and the Infinite Tower (from 406 to 1000).'),
    el('div', { class: 'opcoes', style: 'flex-direction:column;align-items:stretch' }, ...ops, fecha));
}
{
  const _abrirNPCMv = abrirNPC;
  abrirNPC = function (npc) { if (npc && npc.d && npc.d.mvViagem) return modalViagemMv(npc); return _abrirNPCMv.apply(this, arguments); };
  if (typeof iconeNPC === 'function') { const _iconeNPCMv = iconeNPC; iconeNPC = function (n) { const d = n.d || NPCS[n.id] || {}; return d.mvViagem ? '🌀' : _iconeNPCMv(n); }; }
  // o portal selado e o Guardião na praça do aeroporto do Rio, ao lado da Capitã Iara e da Dra. Estela
  const base = MAPAS_DEF.rio;
  MAPAS_DEF.rio = function () {
    const m = base(); const W = m.w; const livre = (x, y) => !m.obj[y * W + x] && CH_ANDA(m.chao[y * W + x]) && !m.npcs.some(n => n.x === x && n.y === y);
    // v362: o portal fica DENTRO da calçada (antes, em x 30, invadia a rua) e está ABERTO (arte nova mv_portal_rio)
    // o baú do armazém e a massagista vão para o canto esquerdo da praça (ficavam no meio da fila dos transportes)
    { const bauPt = m.pontos.find(p => p.tipo === 'armazem' && p.x >= 12 && p.x <= 30 && p.y >= 43 && p.y <= 50), mas = m.npcs.find(n => n.id === 'massagista_rio');
      if (bauPt && (bauPt.x !== 12 || bauPt.y !== 45) && !m.obj[45 * W + 12]) { m.obj[45 * W + 12] = m.obj[bauPt.y * W + bauPt.x]; m.obj[bauPt.y * W + bauPt.x] = null; bauPt.x = 12; bauPt.y = 45; }
      if (mas && !m.obj[45 * W + 13]) { mas.x = 13; mas.y = 45; } }
    const [px, py, nx, ny, lx, ly] = [28, 45, 28, 48, 26, 46];
    if (livre(px, py) && livre(px + 1, py) && livre(nx, ny)) {
      m.obj[py * W + px] = { t: 'mv_portal_rio', v: 1 }; m.obj[py * W + px + 1] = { t: 'x', v: 0 }; if (livre(px - 1, py)) m.obj[py * W + px - 1] = { t: 'x', v: 0 };
      m.npcs.push({ id: 'guardiao_rio', x: nx, y: ny }); MV_VOLTA_RIO = { x: nx, y: ny };
      if (livre(lx, ly)) { m.obj[ly * W + lx] = { t: 'placa', v: 1 }; m.placas.push({ x: lx, y: ly, texto: '🌀 MULTIVERSE PORTAL — open to the aces! Talk to the Guardian. From level 400, for those who won the Intergalactic Cup.' }); }
    } else poeNpcPerto(m, 'guardiao_rio', 'estela');
    return m;
  };
  // Estação: a Torre de Controle também leva ao Multiverso
  if (typeof destinosEspaco === 'function') {
    const _dest = destinosEspaco;
    destinosEspaco = function () { const l = _dest.apply(this, arguments); l.push({ id: 'multiverso', nome: '🌀 Multiverse Stadium (levels 400+)', req: MV_NIVEL, flag: 'campeao_galaxia', msgFlag: 'Win the Intergalactic Cup' }); return l; };
  }
  // aeroporto: mais uma linha
  if (typeof modalVoo === 'function') {
    const _vooMv = modalVoo;
    modalVoo = function () {
      const r = _vooMv.apply(this, arguments);
      try {
        const lista = document.querySelector('#modalConteudo .lista'); if (!lista) return r;
        const trava = mvPodeIr();
        lista.append(el('div', { class: 'linha-item' + (trava ? ' bloq' : '') },
          el('div', { class: 'nm' }, el('b', {}, '🌀 Multiverse (the Guardian\'s portal, in Rio)'), el('small', {}, `From level ${MV_NIVEL} · after winning the Intergalactic Cup${trava ? ' — ' + trava.replace('🔒 ', '') : ' ✔'}`)),
          el('button', { class: 'btn amarelo mini', disabled: trava ? 'disabled' : null, onclick: mvVaiHub }, trava ? '🔒' : 'Go through')));
      } catch (e) { }
      return r;
    };
  }
}
// os portais do hub abrem pelo nível (o aviso na porta diz quanto falta)
function mvLiberaPortais() { const s = G.save; if (!s) return; if (s.nivel >= 400) s.flags.mv_lib_anoes = true; if (s.nivel >= 478) s.flags.mv_lib_gigantes = true; }
{
  const _entraMv = entrarMapa;
  entrarMapa = function () { const r = _entraMv.apply(this, arguments); try { mvLiberaPortais(); } catch (e) { } return r; };
  const _subiuMv = subiuNivel;
  subiuNivel = function () { const r = _subiuMv.apply(this, arguments); try { mvLiberaPortais(); } catch (e) { } return r; };
}
const MAPAS_MV = new Set(['multiverso', 'pedraforte', 'picos_nublados']);

/* ---------- missões ---------- */
{
  const xpNivel = x => xpPara(x + 1) - xpPara(x);
  MISSOES.push(
    // Pedraforte
    { id: 'mv_a1', npc: 'rei_barbaferro', titulo: 'The dwarves\' ball', lvl: 400, texto: 'Here in Stonehold, if you can\'t dribble past a dwarf, you can\'t enter the hall! Get past 120 Ball-Kicking Dwarves in the Crystal Mines.', req: { kill: 'mv_anao_mineiro', n: 120 }, rec: { xp: Math.round(xpNivel(406) * 1.6), ouro: 3000000, itens: [['banquete_anao', 5]] } },
    { id: 'mv_a2', npc: 'rei_barbaferro', titulo: 'The ember that never goes out', lvl: 428, pre: 'mv_a1', texto: 'The Ember Golems made the Lava River way too hot. Beat 160 of them.', req: { kill: 'mv_golem_brasa', n: 160 }, rec: { xp: Math.round(xpNivel(433) * 1.8), ouro: 6000000, itens: [['elixir_multiverso', 40]] } },
    { id: 'mv_a3', npc: 'rei_barbaferro', titulo: 'The Mountain Goalkeeper', lvl: 465, pre: 'mv_a2', texto: 'My cousin, King Boulder, hasn\'t lost a game in a thousand years and he\'s become unbearable. Go to the Ancient Forge and beat him!', req: { kill: 'mv_chefe_golem_rei', n: 1 }, rec: { xp: Math.round(xpNivel(470) * 2.5), ouro: 14000000 } },
    // Picos Nublados
    { id: 'mv_g1', npc: 'rainha_nimbus', titulo: 'The runaway lambs', lvl: 478, texto: 'My Cloud Lambs ran off onto the field and won\'t let anyone play. Get past 150 of them!', req: { kill: 'mv_carneiro_nuvem', n: 150 }, rec: { xp: Math.round(xpNivel(483) * 1.6), ouro: 9000000, itens: [['banquete_anao', 8]] } },
    { id: 'mv_g2', npc: 'rainha_nimbus', titulo: 'The all-seeing eye', lvl: 510, pre: 'mv_g1', texto: 'The Cyclops Strikers at Troll Bridge never miss a shot. Beat 180 of them.', req: { kill: 'mv_ciclope', n: 180 }, rec: { xp: Math.round(xpNivel(516) * 1.8), ouro: 16000000, itens: [['elixir_multiverso', 60]] } },
    { id: 'mv_g3', npc: 'rainha_nimbus', titulo: 'The Thunder Titan', lvl: 555, pre: 'mv_g2', texto: 'The biggest giant of all lives on Thunder Peak. When he kicks, the sky thunders. Beat the Titan!', req: { kill: 'mv_chefe_tita', n: 1 }, rec: { xp: Math.round(xpNivel(560) * 2.5), ouro: 30000000, flag: 'campeao_multiverso' } },
    // Desafios Lendários (pesados e muito bem pagos) — com o Grão-Guardião
    { id: 'mv_l1', npc: 'guardiao_mv', titulo: '⭐ Legendary: the toughest shell', lvl: 440, lendaria: true, texto: 'The Anvil Beetles have the toughest shell in the Multiverse. Beat 600 of them at the Lava River or the Ancient Forge, in Stonehold (Dwarf Portal). Bring your best potions.', req: { kill: 'mv_besouro_bigorna', n: 600 }, rec: { xp: Math.round(xpNivel(450) * 4), ouro: 45000000, itens: [['fio_ouro', 30]] } },
    { id: 'mv_l2', npc: 'guardiao_mv', titulo: '⭐ Legendary: the stone throne', lvl: 470, lendaria: true, pre: 'mv_l1', texto: 'Beat King Boulder TEN times at the Ancient Forge, in Stonehold (Dwarf Portal). He comes back every 20 minutes... and angrier every time.', req: { kill: 'mv_chefe_golem_rei', n: 10 }, rec: { xp: Math.round(xpNivel(475) * 5), ouro: 90000000, itens: [['caco_coroa_cristal', 3]] } },
    { id: 'mv_l3', npc: 'guardiao_mv', titulo: '⭐ Legendary: ruler of the sky', lvl: 500, lendaria: true, pre: 'mv_l2', texto: 'The Thunder Eagles rule the giants’ sky. Beat 800 of them in the Cloud Fields or on Thunder Peak, in the Cloudy Peaks (Giant Portal).', req: { kill: 'mv_aguia_trovao', n: 800 }, rec: { xp: Math.round(xpNivel(510) * 5), ouro: 140000000, itens: [['fio_ouro', 50]] } },
    { id: 'mv_l4', npc: 'guardiao_mv', titulo: '⭐ Legendary: the Titan\'s fury', lvl: 560, lendaria: true, pre: 'mv_l3', texto: 'Beat the Thunder Titan TEN times on Thunder Peak, in the Cloudy Peaks (Giant Portal). Only the greatest in history have done it.', req: { kill: 'mv_chefe_tita', n: 10 }, rec: { xp: Math.round(xpNivel(565) * 7), ouro: 260000000, itens: [['coroa_raios', 2]] } },
  );
}

/* ---------- forja 400+ ---------- */
if (typeof materialRaroRefino === 'function') {
  const _matMv = materialRaroRefino;
  materialRaroRefino = function (lvl) { return lvl >= 525 ? 'gelo_eterno' : lvl >= 478 ? 'la_nuvem' : lvl >= 440 ? 'brasa_eterna' : lvl >= 400 ? 'pepita_runica' : _matMv(lvl); };
}

/* ---------- história: Capítulo 11 (v407 Raio-X R12: era 10, igual à Galáxia) ---------- */
if (typeof CAPITULOS !== 'undefined') {
  CAPITULOS.multiverso = {
    rotulo: 'Chapter 11', titulo: 'The Soccer Multiverse', emoji: '🌀', implica: ['galaxia'],
    cond: (s, mapa) => MAPAS_MV.has(mapa) || /^caca_mv_|^torre_infinita/.test(mapa || ''),
    cenas: [
      { img: 'cap_mv_1', kb: 'kb-a', cor: ['#140a40', '#ffb04a'], txt: n => 'After the Intergalactic Cup, a portal sealed for a thousand years started to glow in the Rio airport square. On the other side: a stadium floating between galaxies.' },
      { img: 'cap_mv_1', kb: 'kb-zoom', foco: '45% 45%', cor: ['#140a40', '#ffb04a'], txt: n => `Around the field, portals to worlds no one had ever seen. And next to it, a tower so tall that no one had ever seen the top. ${typeof _hn === 'function' ? _hn(n) : 'The legend'} smiled: soccer had no end.` },
      { img: 'cap_mv_2', kb: 'kb-b', cor: ['#3a1a0a', '#7ab8ff'], txt: n => 'Through one portal, the dwarves of Stonehold playing soccer inside the mountain, among forges and lava rivers. Through the other, the giants of the Cloudy Peaks, above the clouds.' },
      { img: 'cap_mv_2', kb: 'kb-zoom', foco: '70% 30%', cor: ['#3a1a0a', '#7ab8ff'], txt: n => 'Every world with its own teams, its own stars and its own champions. And all of them wanting to know if the legend from Earth was really that good...' },
    ],
    final: { emoji: '🌀', titulo: 'The Soccer Multiverse', sub: n => 'Chapter 11 has begun! Stonehold (levels 405–470), Cloudy Peaks (482–560) and the Infinite Tower, up to level 1000.', botao: 'Go through! 🌀' },
  };
  const ord = CAPITULOS_ORDEM; const ig = ord.indexOf('gloria'); if (!ord.includes('multiverso')) ord.splice(ig >= 0 ? ig : ord.length, 0, 'multiverso');
}
['cap_mv_1', 'cap_mv_2'].forEach(n => { if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });
