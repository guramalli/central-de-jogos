/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ARENAS TEMÁTICAS — chefões difíceis, raros e diários
   - 6 arenas, cada uma entra por um porteiro numa cidade-sede.
   - O chefão só entra em campo em horários de rodízio (relógio real):
     30 min a cada 2 h, cada arena num horário diferente.
   - Só dá para vencer cada chefão UMA vez por dia (dia real).
   - Golpes especiais com aviso no chão (fuja do círculo vermelho),
     escudo, reservas e "modo final" com pouco fôlego.
   - Deixam cair itens MÍTICOS que nenhum outro adversário tem.
   Carregar DEPOIS de todos os outros scripts do jogo.
   ============================================================ */

const ARENA_CICLO = 120, ARENA_JANELA = 30; // minutos (relógio real)
const ARENA_MITICO_BASE = 0.10, ARENA_MITICO_SORTE = 0.02, ARENA_MITICO_MAX = 0.30;

const ARENAS = [
  { id: 'arena_terrao', nome: 'Arena do Terrão', host: 'cidade', L: 32, req: 28, offset: 0, tema: 'terrao', seed: 1101, cor: '#e8a040',
    chefe: { id: 'ch_trovao', nome: 'Trovão, o Rei do Terrão', falas: ['O terrão é meu palco!', 'Sente a poeira!', 'Aqui só joga quem aguenta!'],
      look: { pele: 'pele-negra', cabelo: 'cabelo-moicano', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#3a3a4a', baixo: 'baixo-shorts', chapeu: 'chapeu-coroa', rosto: 'rosto-escuros' } },
    guarda: { id: 'gd_terrao', nome: 'Zagueiro do Terrão', arq: 'zagueiro', look: { pele: 'pele-media', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#3a3a4a', baixo: 'baixo-shorts' } },
    porteiro: { id: 'port_terrao', nome: 'Seu Batista, porteiro da Arena', look: { pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-terno', corRoupa: '#1a1a2a', baixo: 'baixo-jeans', pescoco: 'pescoco-apito' } },
    golpes: { bolada: 'Bomba do Terrão', onda: 'Poeira do Trovão', chuva: 'Chuva de Bolas', investida: 'Arrancada Trovão' } },
  { id: 'arena_ondas', nome: 'Arena das Ondas', host: 'praia', L: 44, req: 40, offset: 20, tema: 'ondas', seed: 1102, cor: '#3ac8e8',
    chefe: { id: 'ch_rainha_ondas', nome: 'A Rainha das Ondas', falas: ['A maré está do meu lado!', 'Pega essa onda!', 'Ninguém surfa melhor que eu!'],
      look: { corpo: 'f', pele: 'pele-morena', cabelo: 'cabelo-liso-longo', corCabelo: 'loiro', roupa: 'roupa-regata', corRoupa: '#1ac8e8', baixo: 'baixo-praia', chapeu: 'chapeu-coroa' } },
    guarda: { id: 'gd_ondas', nome: 'Surfista da Arena', arq: 'rapido', look: { pele: 'pele-morena', cabelo: 'cabelo-topete', corCabelo: 'loiro', roupa: 'roupa-regata', corRoupa: '#1ac8e8', baixo: 'baixo-praia' } },
    porteiro: { id: 'port_ondas', nome: 'Dona Iara, porteira da Arena', look: { corpo: 'f', pele: 'pele-negra', cabelo: 'cabelo-black-power', corCabelo: 'preto', roupa: 'roupa-regata', corRoupa: '#ff8a3a', baixo: 'baixo-praia', pescoco: 'pescoco-apito' } },
    golpes: { bolada: 'Bola de Areia', onda: 'Onda Gigante', chuva: 'Chuva de Conchas', investida: 'Surfada Veloz' } },
  { id: 'arena_piramides', nome: 'Arena das Pirâmides', host: 'cairo', L: 66, req: 60, offset: 40, tema: 'piramides', seed: 1103, cor: '#ffc040',
    chefe: { id: 'ch_esfinge', nome: 'A Esfinge Dourada', falas: ['Responda com os pés!', 'O sol do deserto me protege!', 'Mil anos invicta!'],
      look: { corpo: 'f', pele: 'pele-morena', cabelo: 'cabelo-coque', corCabelo: 'preto', roupa: 'roupa-camisa10-ouro', baixo: 'baixo-shorts', chapeu: 'chapeu-coroa', pescoco: 'pescoco-medalha' } },
    guarda: { id: 'gd_piramides', nome: 'Guardião da Pirâmide', arq: 'zagueiro', look: { pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#c8903a', baixo: 'baixo-shorts' } },
    porteiro: { id: 'port_piramides', nome: 'Seu Omar, porteiro da Arena', look: { pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-terno', corRoupa: '#f4f4f8', baixo: 'baixo-jeans', pescoco: 'pescoco-apito' } },
    golpes: { bolada: 'Raio do Sol', onda: 'Onda do Deserto', chuva: 'Tempestade de Areia', investida: 'Investida do Escaravelho' } },
  { id: 'arena_neon', nome: 'Arena Neon Sakura', host: 'toquio', L: 80, req: 74, offset: 60, tema: 'neon', seed: 1104, cor: '#ff5ad0',
    chefe: { id: 'ch_ronin', nome: 'Ronin Neon', falas: ['Mais rápido que a luz!', 'Silêncio... e drible.', 'Você não me vê chegar!'],
      look: { pele: 'pele-clara', cabelo: 'cabelo-anime', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#ff3ad0', baixo: 'baixo-shorts', chapeu: 'chapeu-faixa', rosto: 'rosto-escuros', costas: 'costas-capa' } },
    guarda: { id: 'gd_neon', nome: 'Ninja da Arena', arq: 'rapido', look: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#1a1a2a', baixo: 'baixo-shorts', chapeu: 'chapeu-faixa' } },
    porteiro: { id: 'port_neon', nome: 'Dona Sakura, porteira da Arena', look: { corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-coque', corCabelo: 'preto', roupa: 'roupa-terno', corRoupa: '#e05a8a', baixo: 'baixo-saia', pescoco: 'pescoco-apito' } },
    golpes: { bolada: 'Chute Neon', onda: 'Onda Neon', chuva: 'Pétalas Relâmpago', investida: 'Corte Relâmpago' } },
  { id: 'arena_nevasca', nome: 'Arena da Nevasca', host: 'munique', L: 150, req: 140, offset: 80, tema: 'nevasca', seed: 1105, cor: '#9adcff',
    chefe: { id: 'ch_nevasca', nome: 'A Rainha da Nevasca', falas: ['Aqui o jogo congela!', 'Sinta o frio da derrota!', 'Neve... e mais neve!'],
      look: { corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-liso-longo', corCabelo: 'grisalho', roupa: 'roupa-futebol', corRoupa: '#bfe8ff', baixo: 'baixo-shorts', chapeu: 'chapeu-coroa', costas: 'costas-capa', pescoco: 'pescoco-cachecol' } },
    guarda: { id: 'gd_nevasca', nome: 'Guardiã do Gelo', arq: 'meia', look: { corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-coque', corCabelo: 'loiro', roupa: 'roupa-futebol', corRoupa: '#7ac0e8', baixo: 'baixo-shorts', pescoco: 'pescoco-cachecol' } },
    porteiro: { id: 'port_nevasca', nome: 'Seu Klaus, porteiro da Arena', look: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'ruivo', roupa: 'roupa-terno', corRoupa: '#3a4a6a', baixo: 'baixo-jeans', pescoco: 'pescoco-cachecol' } },
    golpes: { bolada: 'Bola de Neve Gigante', onda: 'Onda Gelada', chuva: 'Nevasca', investida: 'Deslize no Gelo' } },
  { id: 'arena_lendas', nome: 'Arena das Lendas', host: 'londres', L: 165, req: 155, offset: 100, tema: 'lendas', seed: 1106, cor: '#ffe070',
    chefe: { id: 'ch_imortal', nome: 'O Imortal', falas: ['Eu nunca perdi.', 'Só uma lenda me vence!', 'A taça é eterna, eu também!'],
      look: { pele: 'pele-retinta', cabelo: 'cabelo-anime-ouro', roupa: 'roupa-cavaleiro-ouro', baixo: 'baixo-shorts', chapeu: 'chapeu-espartano-ouro', costas: 'costas-capa', rosto: 'rosto-estrela' } },
    guarda: { id: 'gd_lendas', nome: 'Guardião Lendário', arq: 'zagueiro', look: { pele: 'pele-negra', cabelo: 'cabelo-black-power', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#e8b848', baixo: 'baixo-shorts' } },
    porteiro: { id: 'port_lendas', nome: 'Dona Vitória, porteira da Arena', look: { corpo: 'f', pele: 'pele-negra', cabelo: 'cabelo-coque', corCabelo: 'grisalho', roupa: 'roupa-terno', corRoupa: '#1a1a1a', baixo: 'baixo-saia', pescoco: 'pescoco-medalha' } },
    golpes: { bolada: 'Chute Imortal', onda: 'Onda Dourada', chuva: 'Chuva de Estrelas', investida: 'Arrancada Lendária' } },
];
const ARENA_POR_ID = {}; for (const a of ARENAS) ARENA_POR_ID[a.id] = a;
const ARENA_DO_CHEFE = {}; for (const a of ARENAS) ARENA_DO_CHEFE[a.chefe.id] = a;

/* ---------- itens MÍTICOS (exclusivos das arenas) ---------- */
// iconeBase: arte existente que serve de base; matiz: giro de cor do ícone; brilho: cor da aura
const ITENS_MITICOS = {
  arena_terrao: {
    chuteira_trovao: { nome: 'Chuteira do Trovão', slot: 'chuteira', atk: 21, st: { vel: 10, chute: 3 }, iconeBase: 'i_chuteira_ouro', matiz: 190, brilho: '#5ab4ff' },
    faixa_trovao: { nome: 'Faixa do Rei do Terrão', slot: 'cabeca', def: 6, st: { drible: 3, chute: 3, hp: 60 }, avatar: 'chapeu-faixa', iconeBase: 'i_faixa_capitao', matiz: 200, brilho: '#5ab4ff' },
    apito_trovao: { nome: 'Apito do Trovão', slot: 'acessorio', def: 4, st: { hp: 120, foco: 60, regen: 3 }, avatar: 'pescoco-apito', iconeBase: 'i_apito_ouro', matiz: 190, brilho: '#5ab4ff' },
  },
  arena_ondas: {
    camisa_mare: { nome: 'Camisa Maré Alta', slot: 'camisa', def: 19, st: { hp: 150, vel: 6, regen: 2 }, avatar: 'roupa-futebol', cor: '#1ac8e8', cor2: '#ffffff', iconeBase: 'i_camisa_mundo', matiz: 175, brilho: '#3ae0ff' },
    calcao_tsunami: { nome: 'Calção Tsunami', slot: 'calcao', def: 11, st: { vel: 10, hp: 60 }, cor: '#1a8ae8', iconeBase: 'i_calcao_praia', matiz: 150, brilho: '#3ae0ff' },
    colar_perolas: { nome: 'Colar de Pérolas do Mar', slot: 'acessorio', def: 5, st: { regen: 5, foco: 120, visao: 2 }, avatar: 'pescoco-havaiano', iconeBase: 'i_colar_havaiano', matiz: 170, brilho: '#3ae0ff' },
  },
  arena_piramides: {
    chuteira_sol: { nome: 'Chuteira do Sol', slot: 'chuteira', atk: 33, st: { vel: 12, chute: 4 }, iconeBase: 'i_chuteira_ouro', matiz: 0, brilho: '#ffb020' },
    nemes_dourado: { nome: 'Coroa da Esfinge', slot: 'cabeca', def: 10, st: { drible: 5, chute: 5, visao: 4, hp: 140 }, avatar: 'chapeu-coroa', iconeBase: 'i_coroa', matiz: 0, brilho: '#ffb020' },
    caneleira_escaravelho: { nome: 'Caneleira do Escaravelho', slot: 'perna', def: 13, st: { defesa: 3, hp: 90 }, cor: '#2ab08a', iconeBase: 'i_caneleira_elite', matiz: 110, brilho: '#40e0a0' },
  },
  arena_neon: {
    camisa_sakura: { nome: 'Camisa Sakura Neon', slot: 'camisa', def: 30, st: { hp: 300, drible: 3, visao: 3 }, avatar: 'roupa-futebol', cor: '#ff5ad0', cor2: '#1a1a2a', iconeBase: 'i_camisa_elite', matiz: 300, brilho: '#ff5ad0' },
    calcao_neon: { nome: 'Calção Relâmpago Neon', slot: 'calcao', def: 15, st: { vel: 14, drible: 2, hp: 100 }, cor: '#ff3ad0', iconeBase: 'i_calcao_pro', matiz: 280, brilho: '#ff5ad0' },
    faixa_ronin: { nome: 'Faixa do Ronin', slot: 'cabeca', def: 12, st: { drible: 6, chute: 4, foco: 120 }, avatar: 'chapeu-faixa', iconeBase: 'i_faixa_suor', matiz: 290, brilho: '#ff5ad0' },
  },
  arena_nevasca: {
    chuteira_cristal: { nome: 'Chuteira de Cristal de Gelo', slot: 'chuteira', atk: 50, st: { vel: 14, chute: 5, drible: 3 }, iconeBase: 'i_chuteira_tita', matiz: 170, brilho: '#bfefff' },
    caneleira_glacial: { nome: 'Caneleira Glacial', slot: 'perna', def: 16, st: { defesa: 4, hp: 200 }, cor: '#bfe8ff', iconeBase: 'i_caneleira_carbono', matiz: 180, brilho: '#bfefff' },
    cachecol_nevasca: { nome: 'Cachecol da Nevasca', slot: 'acessorio', def: 8, st: { hp: 300, foco: 200, regen: 5 }, avatar: 'pescoco-cachecol', iconeBase: 'i_cachecol', matiz: 180, brilho: '#bfefff' },
  },
  arena_lendas: {
    camisa_imortal: { nome: 'Camisa do Imortal', slot: 'camisa', def: 40, st: { hp: 550, drible: 4, chute: 4, visao: 4 }, avatar: 'roupa-futebol', cor: '#f0c030', cor2: '#1a1a1a', iconeBase: 'i_camisa_lenda', matiz: 0, brilho: '#ffe070' },
    coroa_imortal: { nome: 'Coroa do Imortal', slot: 'cabeca', def: 16, st: { drible: 7, chute: 7, visao: 5, hp: 200 }, avatar: 'chapeu-coroa', iconeBase: 'i_coroa', matiz: 0, brilho: '#ffffff' },
    chuteira_eterna: { nome: 'Chuteira Eterna', slot: 'chuteira', atk: 56, st: { vel: 16, chute: 6, drible: 4 }, iconeBase: 'i_chuteira_lenda', matiz: 0, brilho: '#ffe070' },
  },
};
const NOME_SLOT_AR = { cabeca: 'Cabeça', acessorio: 'Pescoço', camisa: 'Camisa', calcao: 'Calção', perna: 'Caneleira', chuteira: 'Chuteira' };
function descMitico(it) {
  const p = []; if (it.atk) p.push(`Ataque ${it.atk}`); if (it.def) p.push(`Defesa ${it.def}`);
  const nm = { hp: 'fôlego', foco: 'foco', vel: 'velocidade', drible: 'drible', chute: 'chute', visao: 'visão', defesa: 'defesa', regen: 'recuperação' };
  for (const k in it.st) p.push(`+${it.st[k]} ${nm[k] || k}`);
  return p.join(', ');
}
for (const a of ARENAS) {
  a.miticos = Object.keys(ITENS_MITICOS[a.id]);
  for (const [id, it] of Object.entries(ITENS_MITICOS[a.id])) {
    ITENS[id] = Object.assign({ tipo: 'equip', lvl: a.req, venda: a.req * 900, mitico: true, arena: a.id }, it,
      { desc: `MÍTICO. ${descMitico(it)}. Só o chefão da ${a.nome} deixa cair — e é raríssimo.` });
  }
  a.trofeu = 'trofeu_' + a.tema;
  ITENS[a.trofeu] = { nome: `Troféu da ${a.nome}`, tipo: 'loot', venda: a.L * 60, trofeuArena: true, desc: `Prova de que você venceu ${a.chefe.nome}. Peça de colecionador (vende bem).` };
  ICON_ALIAS[a.trofeu] = 'trofeu';
}

/* ---------- raridade MÍTICA ---------- */
RARIDADE.mitico = { nome: 'mítico', cor: '#ff5ad8', log: 'l-mitico' };
if (!ORDEM_RAR.includes('mitico')) ORDEM_RAR.push('mitico');
const _raridadeItemAr = raridadeItem;
raridadeItem = function (id) {
  const it = ITENS[id];
  if (it && it.mitico) return 'mitico';
  if (it && it.trofeuArena) return 'epico';
  return _raridadeItemAr(id);
};
// ícone mítico: arte base com a cor trocada, aura brilhante e estrelinhas
const ICON_MIT = new Map();
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
const _iconeItemAr = iconeItem;
iconeItem = function (id) {
  const it = ITENS[id]; if (!it || !it.mitico) return _iconeItemAr(id);
  if (ICON_MIT.has(id)) return ICON_MIT.get(id);
  const c = mkCanvas(96, 96); const x = c.getContext('2d');
  const g = x.createRadialGradient(48, 50, 4, 48, 50, 48); g.addColorStop(0, hexA(it.brilho, 0.9)); g.addColorStop(0.5, hexA(it.brilho, 0.35)); g.addColorStop(1, hexA(it.brilho, 0));
  x.fillStyle = g; x.fillRect(0, 0, 96, 96);
  const e = spr(it.iconeBase);
  if (!e.ok) return c; // a arte ainda está carregando: não guarda, tenta de novo depois
  x.imageSmoothingQuality = 'high';
  x.filter = `hue-rotate(${it.matiz || 0}deg) saturate(1.45) brightness(1.08) drop-shadow(0 0 4px ${it.brilho})`;
  const s = Math.min(80 / e.im.width, 80 / e.im.height); const w = e.im.width * s, h = e.im.height * s;
  x.drawImage(e.im, (96 - w) / 2, (96 - h) / 2 + 2, w, h); x.filter = 'none';
  const estrela = (cx, cy, r) => { x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(cx, cy - r); x.quadraticCurveTo(cx, cy, cx + r, cy); x.quadraticCurveTo(cx, cy, cx, cy + r); x.quadraticCurveTo(cx, cy, cx - r, cy); x.quadraticCurveTo(cx, cy, cx, cy - r); x.fill(); };
  estrela(16, 16, 7); estrela(80, 24, 5); estrela(76, 80, 6);
  ICON_MIT.set(id, c); return c;
};

/* ---------- adversários das arenas ---------- */
for (const a of ARENAS) {
  const b = statsNivel(a.L);
  const atk = Math.round(b.atk * 1.15);
  MONSTROS[a.chefe.id] = {
    nome: a.chefe.nome, nivel: a.L, hp: Math.round(b.hp * 32), atk, def: Math.round(b.def * 1.3), xp: Math.round(b.xp * 35),
    vel: 280, aggro: 3, atkCd: 1700, chefe: true, arena: a.id, respawn: 1e12,
    ranged: { alcance: 5, dano: Math.round(atk * 0.9), cd: 2600, proj: 'bolaforte' },
    ouro: [a.L * 250, a.L * 400], loot: [['fio_ouro', 1, 1, 3], ['couro', 1, 2, 4], [a.trofeu, 1, 1, 1]],
    falas: a.chefe.falas, look: Object.assign({ tipo: 'humano', corpo: 'm', grande: true, alt: 1.8 }, a.chefe.look),
  };
  montaMonstro(a.guarda.id, a.guarda.nome, a.guarda.arq, a.L - 3, { falas: ['Ninguém chega no chefão!', 'Volta pro vestiário!', 'Arena fechada pra você!'], look: a.guarda.look });
  MONSTROS[a.guarda.id].loot = [['couro', 0.3, 1, 2], ['retalho', 0.3, 1, 2], ['fio_ouro', 0.012, 1, 1]];
  NPCS[a.porteiro.id] = { nome: a.porteiro.nome, arenaId: a.id, ola: `Bem-vindo(a) à ${a.nome}! Aqui o chefão só aparece de vez em quando, e só dá para vencê-lo uma vez por dia.`, look: Object.assign({ tipo: 'humano', corpo: 'm', alt: 1.72 }, a.porteiro.look) };
  if (typeof CLIMA_CIDADE !== 'undefined' && CLIMA_CIDADE[a.host]) CLIMA_CIDADE[a.id] = CLIMA_CIDADE[a.host];
}

/* ---------- mapas das arenas ---------- */
const TEMAS_ARENA = {
  terrao: { base: CH.TERRA, campo: CH.CAMPO_TERRA, props: ['poste', 'banco', 'cones', 'sacola_bolas', 'arbusto'], marco: 'placar', marcoLarg: 3 },
  ondas: { base: CH.AREIA, campo: CH.AREIA_MOLHADA, props: ['coqueiro', 'guarda_sol', 'boia', 'prancha', 'cadeira_praia'], marco: 'torre_salva', marcoLarg: 2, agua: true },
  piramides: { base: CH.AREIA, campo: CH.CAMPO_TERRA, props: ['obelisco', 'palmeira_tamara', 'jarros', 'lanterna_arabe', 'camelo'], marco: 'piramide', marcoLarg: 5 },
  neon: { base: CH.CALCADA, campo: CH.QUADRA_AZUL, props: ['cerejeira', 'lanterna_pedra', 'neon_palmeira', 'maneki', 'bambu'], marco: 'torii', marcoLarg: 3 },
  nevasca: { base: CH.PISO, campo: CH.QUADRA_AZUL, props: ['pinheiro', 'pinheiro', 'estatua', 'poste3'], marco: 'torre_relogio', marcoLarg: 3 },
  lendas: { base: CH.CONCRETO, campo: CH.CAMPO, props: ['estatua', 'trofeu', 'fonte_moderna', 'poste3'], marco: 'trofeu', marcoLarg: 1 },
};
const ARENA_W = 32, ARENA_H = 26, ARENA_CHEFE_POS = { x: 16, y: 10 };
function criaArena(a) {
  if (!a.porta) getMapa(a.host); // a saída volta para o porteiro
  const t = TEMAS_ARENA[a.tema]; const W = ARENA_W, H = ARENA_H;
  const b = new Construtor(a.id, a.nome, W, H, t.base, a.seed);
  bordaInvisivel(b);
  for (let x = 2; x < W - 2; x++) b.obj(x, 1, 'arquibancada');
  if (t.agua) { b.ret(1, 3, 2, H - 7, CH.AGUA); b.ret(W - 3, 3, 2, H - 7, CH.AGUA); }
  b.campo(5, 5, 22, 14, t.campo);
  for (const [x, y] of [[3, 3], [W - 4, 3], [3, H - 5], [W - 4, H - 5]]) if (b.livre(x, y)) b.obj(x, y, 'holofote');
  b.obj(9, 3, 'bandeirao'); b.obj(W - 10, 3, 'bandeirao');
  if (t.marcoLarg > 1) objLargo(b, 16, 3, t.marco, t.marcoLarg); else b.obj(16, 3, t.marco);
  const fora = ch => ch !== t.campo && ch !== CH.AGUA;
  b.espalha(t.props, 16, 1, 3, W - 2, H - 5, fora);
  b.spawn(a.guarda.id, 9, 12, 3, 3); b.spawn(a.guarda.id, 23, 12, 3, 3);
  const px = a.porta ? a.porta.x : 1, py = a.porta ? a.porta.y + 1 : 1;
  b.saida(16, H - 1, a.host, px, py);
  b.m.inicio = { x: 16, y: H - 3 }; b.m.renasce = { x: 16, y: H - 3 };
  b.placa(13, H - 3, `${a.nome.toUpperCase()} — o chefão ${a.chefe.nome} entra em campo em horários especiais. Fuja dos círculos vermelhos!`);
  b.m.arena = a.id;
  return b.m;
}
// porteiro na cidade-sede, perto de onde o jogador chega
function poePorteiro(m, a) {
  const livre = (x, y) => x > 1 && y > 1 && x < m.w - 2 && y < m.h - 2 && !m.obj[y * m.w + x] && CH_ANDA(m.chao[y * m.w + x]) && m.chao[y * m.w + x] !== CH.AGUA
    && !m.saidas.some(s => s.x === x && s.y === y) && !m.npcs.some(n => Math.abs(n.x - x) < 2 && Math.abs(n.y - y) < 2)
    && !m.campos.some(c => x >= c.x - 1 && x <= c.x + c.w && y >= c.y - 1 && y <= c.y + c.h);
  const c = m.inicio || { x: m.w >> 1, y: m.h >> 1 };
  for (let r = 3; r < 16; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = c.x + dx, y = c.y + dy;
    if (livre(x, y) && livre(x, y + 1) && livre(x + 1, y) && livre(x - 1, y)) {
      m.npcs.push({ id: a.porteiro.id, x, y });
      m.obj[y * m.w + x + 1] = { t: 'placa', v: 1 }; m.placas.push({ x: x + 1, y, texto: `🏟️ ${a.nome.toUpperCase()} — fale com o porteiro (nível ${a.req}+)` });
      a.porta = { x, y }; return;
    }
  }
}
for (const a of ARENAS) {
  MAPAS_DEF[a.id] = () => criaArena(a);
  const base = MAPAS_DEF[a.host];
  MAPAS_DEF[a.host] = function () { const m = base(); poePorteiro(m, a); return m; };
}

/* ---------- horário, dia e registro ---------- */
function hojeArena() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function janelaArena(a) {
  const d = new Date(); const min = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  const pos = ((min - a.offset) % ARENA_CICLO + ARENA_CICLO) % ARENA_CICLO;
  return pos < ARENA_JANELA ? { aberta: true, resta: ARENA_JANELA - pos, abre: 0 } : { aberta: false, resta: 0, abre: ARENA_CICLO - pos };
}
function regArena(id) { // sempre o MESMO objeto salvo (só completa o que faltar)
  const s = G.save; s.arenas = s.arenas || {};
  const r = s.arenas[id] || (s.arenas[id] = {});
  if (r.dia === undefined) r.dia = null;
  if (typeof r.vitorias !== 'number') r.vitorias = 0;
  if (typeof r.sorte !== 'number') r.sorte = 0;
  if (!Array.isArray(r.itens)) r.itens = [];
  if (!Array.isArray(r.guardados)) r.guardados = [];
  return r;
}
function venceuHoje(a) { return regArena(a.id).dia === hojeArena(); }
function chefeEmCampo(a) { return janelaArena(a).aberta && !venceuHoje(a); }
function fmtMin(min) { min = Math.max(0, Math.ceil(min)); const h = Math.floor(min / 60), m = min % 60; return h ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`; }
function horaAbre(a) { const d = new Date(Date.now() + janelaArena(a).abre * 60000); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
function chanceMitico(a) { return Math.min(ARENA_MITICO_MAX, ARENA_MITICO_BASE + ARENA_MITICO_SORTE * regArena(a.id).sorte); }
function statusArenaTxt(a) {
  if (venceuHoje(a)) return { txt: '✅ Você já venceu hoje. Volte amanhã!', cls: 'ar-ok' };
  const j = janelaArena(a);
  if (j.aberta) return { txt: `🔥 CHEFÃO EM CAMPO AGORA! Sai em ${fmtMin(j.resta)}`, cls: 'ar-aberta' };
  return { txt: `⏳ Entra em campo às ${horaAbre(a)} (daqui a ${fmtMin(j.abre)})`, cls: 'ar-fechada' };
}

/* ---------- porteiro e lista de arenas ---------- */
function retratoChefe(a) {
  const c = mkCanvas(110, 138); c.className = 'ar-retrato'; c.style.borderColor = a.cor;
  pintaAparencia(c, MONSTROS[a.chefe.id].look, { fundo: '#241640' }); return c;
}
function modalPorteiro(npc) {
  const a = ARENA_POR_ID[npc.d.arenaId]; const s = G.save; const reg = regArena(a.id); const st = statusArenaTxt(a);
  const itens = el('div', { class: 'ar-itens' });
  for (const id of a.miticos) {
    const tem = reg.itens.includes(id);
    const box = el('div', { class: 'ar-item rar-mitico' + (tem ? ' tem' : ''), title: ITENS[id].nome }, iconeItem(id), el('small', {}, ITENS[id].nome), tem ? el('b', {}, '✔ já tem') : null);
    if (typeof comTip === 'function') comTip(box, () => tipItem(id, 0));
    itens.append(box);
  }
  const ops = el('div', { class: 'opcoes' });
  const podeNivel = s.nivel >= a.req;
  ops.append(el('button', { class: 'btn amarelo', disabled: podeNivel ? null : 'disabled', onclick: () => { fechaModal(); const m = getMapa(a.id); trocaMapa(a.id, m.inicio.x + 0.5, m.inicio.y + 0.5); banner(a.nome, chefeEmCampo(a) ? `${a.chefe.nome} está em campo!` : 'O chefão não está em campo agora'); } }, podeNivel ? '🏟️ Entrar na arena' : `Precisa do nível ${a.req}`));
  if (reg.guardados.length) ops.append(el('button', { class: 'btn roxo', onclick: () => { const fica = []; for (const id of reg.guardados) { if (addItem(id, 1)) log(`Você retirou ${ITENS[id].nome} com o porteiro.`, 'l-mitico'); else fica.push(id); } reg.guardados = fica; if (fica.length) log('Mochila cheia! Libere espaço para pegar o resto.', 'l-dano'); salvar(); modalPorteiro(npc); } }, `Retirar itens guardados (${reg.guardados.length})`));
  ops.append(el('button', { class: 'btn', onclick: modalArenas }, 'Ver todas as arenas'), el('button', { class: 'btn', onclick: fechaModal }, 'Tchau!'));
  abreModal(el('h2', {}, `🏟️ ${a.nome}`),
    el('div', { class: 'npc-topo' }, retratoChefe(a), el('div', { class: 'fala' },
      el('p', {}, el('b', {}, a.chefe.nome), ` · Nível ${a.L}`),
      el('p', { class: 'ar-status ' + st.cls }, st.txt),
      el('ul', { class: 'ar-regras' },
        el('li', {}, `O chefão só entra em campo ${ARENA_JANELA} minutos a cada ${ARENA_CICLO / 60} horas (horário do seu relógio).`),
        el('li', {}, 'Só dá para vencê-lo UMA vez por dia. Se você ficar sem fôlego, pode tentar de novo enquanto ele estiver em campo.'),
        el('li', {}, 'Ele tem golpes especiais: quando aparecer um CÍRCULO VERMELHO no chão, saia de dentro!'),
        el('li', {}, 'Com pouco fôlego ele chama reservas, levanta um escudo e entra no MODO FINAL.'),
        el('li', {}, `Vitórias: ${reg.vitorias}. Chance de item mítico na próxima vitória: ${Math.round(chanceMitico(a) * 100)}% (sobe a cada vitória sem mítico).`)))),
    el('h3', {}, '✨ Itens MÍTICOS — só este chefão deixa cair'), itens, ops);
}
function modalArenas() {
  const s = G.save; const lista = el('div', { class: 'lista' });
  for (const a of ARENAS) {
    const st = statusArenaTxt(a); const reg = regArena(a.id); const pode = s.nivel >= a.req;
    const host = getNomeMapa(a.host);
    lista.append(el('div', { class: 'linha-item ar-linha' + (pode ? '' : ' bloq') },
      el('div', { class: 'nm' }, el('b', {}, `🏟️ ${a.nome} — ${a.chefe.nome}`), el('small', {}, `Nível ${a.req}+ · entrada em ${host} · míticos: ${reg.itens.length}/3`), el('small', { class: 'ar-status ' + st.cls }, pode ? st.txt : `🔒 Libera no nível ${a.req}`))));
  }
  abreModal(el('h2', {}, '🏟️ Arenas dos Chefões'),
    el('p', {}, `Cada arena tem um chefão muito difícil que entra em campo ${ARENA_JANELA} minutos a cada ${ARENA_CICLO / 60} horas, e só pode ser vencido uma vez por dia. Eles deixam cair itens MÍTICOS que nenhum outro adversário tem.`), lista,
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: fechaModal }, 'Fechar')));
}
function getNomeMapa(id) { try { return (MAPAS[id] && MAPAS[id].nome) || ({ cidade: 'Cidade', praia: 'Praia', cairo: 'Cairo', toquio: 'Tóquio', munique: 'Munique', londres: 'Londres' })[id] || id; } catch (e) { return id; } }
const _abrirNPCAr = abrirNPC;
abrirNPC = function (npc) { if (npc && npc.d && npc.d.arenaId) return modalPorteiro(npc); return _abrirNPCAr(npc); };
if (typeof iconeNPC === 'function') { const _iconeNPCAr = iconeNPC; iconeNPC = function (n) { const d = n.d || NPCS[n.id] || {}; return d.arenaId ? '🏟️' : _iconeNPCAr(n); }; }
// botão "Arenas" no topo
(function () {
  const nav = document.querySelector('.topo-nav'); if (!nav || document.getElementById('btnArenas')) return;
  const b = el('button', { class: 'btn mini roxo', id: 'btnArenas', type: 'button', title: 'Arenas dos chefões: horários e itens míticos' }, '🏟️ Arenas');
  b.addEventListener('click', () => { if (G.save) modalArenas(); });
  const ref = nav.querySelector('[data-abre="album"]'); if (ref) ref.after(b); else nav.append(b);
})();

/* ---------- presença do chefão na arena ---------- */
function arenaAtual() { return G.mapa && G.mapa.arena ? ARENA_POR_ID[G.mapa.arena] : null; }
function chefeDaArena(a) { return G.mons.find(m => m.tipo === a.chefe.id); }
function entraChefe(a) {
  const sp = { m: a.chefe.id, x: ARENA_CHEFE_POS.x, y: ARENA_CHEFE_POS.y, qtd: 1, raio: 0, arena: true };
  const m = criaMonstro(sp); if (!m) return;
  m.d = Object.assign({}, MONSTROS[a.chefe.id]); // cópia: o modo final muda os números só deste chefão
  m.ar = { prox: G.agora + 5000, fase: 0, escudoAte: 0 };
  G.mons.push(m); efeito('nivel', m.x, m.y); efeito('impacto', m.x, m.y, a.cor);
  banner(`${a.chefe.nome.toUpperCase()}!`, 'O chefão entrou em campo!'); som('apito'); fala(m, a.chefe.falas[0]);
  log(`🏟️ ${a.chefe.nome} entrou em campo na ${a.nome}!`, 'l-lendario');
}
function saiChefe(m, a, txt) {
  G.mons = G.mons.filter(x => x !== m); if (G.alvo === m) G.alvo = null;
  efeito('puff', m.x, m.y); G.teleArena = [];
  log(txt || `${a.chefe.nome} saiu de campo. Volte no próximo horário!`, 'l-sis');
}
function atualizaArena() {
  const a = arenaAtual(); if (!a) return;
  const m = chefeDaArena(a); const deve = chefeEmCampo(a);
  if (deve && !m && G.save.hp > 0) entraChefe(a);
  else if (!deve && m && !m.bravo) saiChefe(m, a);
}

/* ---------- golpes especiais (com aviso no chão) ---------- */
G.teleArena = [];
function golpeArena(m, a) {
  const p = G.p; const d = dist(m, p); const st = stats();
  const fase = m.ar.fase; const dano = pct => Math.round(Math.max(m.d.atk * 1.4, st.maxHp * pct) * (fase === 2 ? 1.2 : 1));
  const dur = fase === 2 ? 1000 : 1250;
  let tipo;
  const r = Math.random();
  if (d < 3.2 && r < 0.4) tipo = 'onda'; else if (r < 0.62) tipo = 'bolada'; else if (r < 0.85) tipo = 'chuva'; else tipo = 'investida';
  if (tipo === 'investida' && (d < 2 || d > 7 || !segLivre(m.x, m.y, p.x, p.y, 0.3))) tipo = 'bolada';
  const nome = a.golpes[tipo];
  tituloSkill(m, nome.toUpperCase() + '!', a.cor);
  if (tipo === 'onda') G.teleArena.push({ tipo: 'circ', x: m.x, y: m.y, r: 3.0, t0: G.agora, dur: dur + 200, dano: dano(0.3), m });
  else if (tipo === 'bolada') G.teleArena.push({ tipo: 'circ', x: p.x, y: p.y, r: 1.35, t0: G.agora, dur, dano: dano(0.22), m });
  else if (tipo === 'chuva') {
    const n = fase === 2 ? 6 : 4;
    for (let i = 0; i < n; i++) { const ang = Math.random() * Math.PI * 2, rr = i === 0 ? 0 : rnd(1, 2.8); G.teleArena.push({ tipo: 'circ', x: p.x + Math.cos(ang) * rr, y: p.y + Math.sin(ang) * rr, r: 1.05, t0: G.agora + i * 140, dur, dano: dano(0.14), m }); }
  } else {
    const ex = p.x + (p.x - m.x) / d * 1.2, ey = p.y + (p.y - m.y) / d * 1.2;
    G.teleArena.push({ tipo: 'linha', x: m.x, y: m.y, x1: ex, y1: ey, r: 0.8, t0: G.agora, dur: dur - 150, dano: dano(0.26), m });
  }
  som('chute');
}
function distSeg(p, a, b) { const vx = b.x - a.x, vy = b.y - a.y, L2 = vx * vx + vy * vy || 1; const k = clamp(((p.x - a.x) * vx + (p.y - a.y) * vy) / L2, 0, 1); return Math.hypot(p.x - (a.x + vx * k), p.y - (a.y + vy * k)); }
function resolveTelegrafos() {
  if (!G.teleArena.length) return;
  const vivo = G.save.hp > 0;
  G.teleArena = G.teleArena.filter(t => {
    if (G.agora < t.t0 + t.dur) return true;
    if (!G.mons.includes(t.m)) return false;
    let acertou;
    if (t.tipo === 'circ') { acertou = dist(G.p, t) <= t.r; efeito('impacto', t.x, t.y, '#ff6a4a'); }
    else {
      acertou = distSeg(G.p, { x: t.x, y: t.y }, { x: t.x1, y: t.y1 }) <= t.r;
      t.m.dash = { x0: t.m.x, y0: t.m.y, x1: t.x1, y1: t.y1, t0: G.agora, dur: 260 }; efeito('puff', t.m.x, t.m.y);
    }
    if (acertou && vivo) { recebeDano(t.dano, t.m); efeito('estrelas', G.p.x, G.p.y, '#ffb03a'); }
    else if (vivo && dist(G.p, t.m) < 12 && Math.random() < 0.25) texto(G.p, 'DESVIOU!', '#9affb0', 800);
    return false;
  });
}
function mudaFaseChefe(m, a, fase) {
  m.ar.fase = fase;
  const n = fase === 1 ? 2 : 3;
  for (let i = 0; i < n; i++) {
    const sp = { m: a.guarda.id, x: Math.floor(m.x), y: Math.floor(m.y), qtd: 1, raio: 3, invocado: true };
    const g = criaMonstro(sp); if (g) { g.bravo = true; g.invocado = true; G.mons.push(g); efeito('puff', g.x, g.y); }
  }
  m.ar.escudoAte = G.agora + 4000;
  if (fase === 1) { banner('RESERVAS!', `${a.chefe.nome} chamou os reservas e levantou um escudo!`); fala(m, 'Reservas, pro campo!'); }
  else {
    m.d.atk = Math.round(m.d.atk * 1.25); m.d.atkCd = Math.round(m.d.atkCd * 0.7);
    banner('MODO FINAL!', `${a.chefe.nome} vai com tudo! Cuidado com os golpes!`); fala(m, a.chefe.falas[2] || 'Agora é sério!');
  }
  som('apito');
}
const _atualizaMonstroAr = atualizaMonstro;
atualizaMonstro = function (m, dt) {
  const a = m.d.arena ? ARENA_POR_ID[m.d.arena] : null;
  if (!a || !m.ar) return _atualizaMonstroAr(m, dt);
  if (m.dash) { // arrancada: desliza até o ponto marcado
    const k = Math.min(1, (G.agora - m.dash.t0) / m.dash.dur);
    const nx = m.dash.x0 + (m.dash.x1 - m.dash.x0) * k, ny = m.dash.y0 + (m.dash.y1 - m.dash.y0) * k;
    mover(m, nx - m.x, ny - m.y, m.r); m.mov = true; m.flip = m.dash.x1 < m.dash.x0;
    if (k >= 1) m.dash = null;
    return;
  }
  _atualizaMonstroAr(m, dt);
  const pc = m.hp / m.d.hp;
  if (!m.bravo) { // fora de combate: recupera o fôlego e volta ao começo
    if (m.hp < m.d.hp) { m.hp = Math.min(m.d.hp, m.hp + m.d.hp * 0.03 * dt / 1000); if (m.hp >= m.d.hp) resetaChefe(m); }
    return;
  }
  if (m.ar.fase === 0 && pc <= 0.7) mudaFaseChefe(m, a, 1);
  else if (m.ar.fase === 1 && pc <= 0.35) mudaFaseChefe(m, a, 2);
  if (G.agora >= m.ar.prox && G.save.hp > 0 && dist(m, G.p) < 9) {
    golpeArena(m, a);
    const base = rnd(5200, 7200); m.ar.prox = G.agora + base * (m.ar.fase === 2 ? 0.62 : m.ar.fase === 1 ? 0.82 : 1);
  }
};
function resetaChefe(m) {
  m.hp = m.d.hp; const base = MONSTROS[m.tipo];
  m.d.atk = base.atk; m.d.atkCd = base.atkCd; m.ar = { prox: G.agora + 5000, fase: 0, escudoAte: 0 }; m.dash = null;
}
// escudo: quase nada passa
const _aplicaDanoAr = aplicaDano;
aplicaDano = function (m, dano) {
  if (m.ar && m.ar.escudoAte > G.agora && dano > 0) {
    dano = Math.max(1, Math.round(dano * 0.2));
    if (!m._avisoEsc || G.agora - m._avisoEsc > 1200) { m._avisoEsc = G.agora; texto(m, 'ESCUDO!', '#8ae8ff', 700, -0.6); }
  }
  return _aplicaDanoAr(m, dano);
};

/* ---------- vitória, itens míticos e dia ---------- */
const _matarAr = matar;
matar = function (m) {
  const a = m.d.arena ? ARENA_POR_ID[m.d.arena] : null;
  const pen = penalidadeNivel(m.d);
  _matarAr(m);
  G.respawns = G.respawns.filter(r => !(r.sp && (r.sp.arena || r.sp.invocado)));
  if (!a) return;
  const s = G.save; const reg = regArena(a.id);
  reg.dia = hojeArena(); reg.vitorias++;
  G.teleArena = [];
  for (const o of G.mons.filter(o => o.invocado)) { efeito('puff', o.x, o.y); }
  G.mons = G.mons.filter(o => !o.invocado);
  const primeira = !s.flags['arena_' + a.id]; s.flags['arena_' + a.id] = true;
  const chance = chanceMitico(a) * pen.drop;
  if (Math.random() < chance) {
    const id = a.miticos[rndi(0, a.miticos.length - 1)];
    reg.sorte = 0; if (!reg.itens.includes(id)) reg.itens.push(id);
    const coube = addItem(id, 1); if (!coube) reg.guardados.push(id);
    soltaDrop(m, id, 1, 'mitico', 0, 1);
    log(`✨✨ ITEM MÍTICO: ${ITENS[id].nome}! ✨✨${coube ? '' : ' (mochila cheia: o porteiro guardou pra você)'}`, 'l-mitico');
    setTimeout(() => { banner('✨ ITEM MÍTICO! ✨', ITENS[id].nome); som('raro'); setTimeout(() => som('nivel'), 400); }, 2600);
  } else {
    reg.sorte++;
    log(`Nenhum item mítico desta vez... A sua sorte na ${a.nome} aumentou: ${Math.round(chanceMitico(a) * 100)}% na próxima vitória.`, 'l-sis');
  }
  log(`🏟️ ${a.chefe.nome} vencido(a)! Volte amanhã para enfrentá-lo(a) de novo.${primeira ? ' Primeira vitória nesta arena!' : ''}`, 'l-lendario');
  salvar();
};
// ficar sem fôlego perto do chefão: ele recupera tudo
const _morrerAr = morrer;
morrer = function (m) {
  const a = arenaAtual();
  if (a) { const ch = chefeDaArena(a); if (ch) resetaChefe(ch); G.mons = G.mons.filter(o => !o.invocado); G.teleArena = []; }
  return _morrerAr(m);
};
// acordar depois de ficar exausto na arena: volta para o porteiro
const _renascerAr = renascer;
renascer = function () {
  const a = arenaAtual(); if (!a) return _renascerAr();
  const s = G.save; const st = stats(); s.hp = st.maxHp; s.foco = st.maxFoco;
  getMapa(a.host); const p = a.porta || getMapa(a.host).inicio;
  entrarMapa(a.host, p.x + 0.5, p.y + 1.5, true);
  log('Você acordou descansado(a) na entrada da arena. Bora de novo!', 'l-sis'); salvar();
};
// sair da arena: some o que ficou pendente
const _entrarMapaAr = entrarMapa;
entrarMapa = function (...args) { G.teleArena = []; const r = _entrarMapaAr.apply(this, args); try { atualizaArena(); } catch (e) { } return r; };

/* ---------- desenho: avisos no chão, escudo e barra do chefão ---------- */
function desenhaArenaChao(ctx) {
  const a = arenaAtual();
  for (const t of G.teleArena) {
    const k = clamp((G.agora - t.t0) / t.dur, 0, 1); if (G.agora < t.t0) continue;
    ctx.save();
    if (t.tipo === 'circ') {
      ctx.fillStyle = `rgba(255,60,50,${0.12 + 0.18 * k})`; ctx.beginPath(); ctx.ellipse(t.x * T, t.y * T, t.r * T, t.r * T * 0.62, 0, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(255,120,60,${0.25 + 0.3 * k})`; ctx.beginPath(); ctx.ellipse(t.x * T, t.y * T, t.r * T * k, t.r * T * 0.62 * k, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(255,40,40,${0.6 + 0.4 * Math.sin(G.agora / 60) * 0.5})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(t.x * T, t.y * T, t.r * T, t.r * T * 0.62, 0, 0, 7); ctx.stroke();
    } else {
      const ang = Math.atan2(t.y1 - t.y, t.x1 - t.x), L = Math.hypot(t.x1 - t.x, t.y1 - t.y);
      ctx.translate(t.x * T, t.y * T); ctx.rotate(ang);
      ctx.fillStyle = `rgba(255,60,50,${0.15 + 0.2 * k})`; ctx.fillRect(0, -t.r * T, L * T, t.r * 2 * T);
      ctx.fillStyle = `rgba(255,140,60,${0.3 + 0.3 * k})`; ctx.fillRect(0, -t.r * T, L * T * k, t.r * 2 * T);
      ctx.strokeStyle = 'rgba(255,40,40,0.9)'; ctx.lineWidth = 3; ctx.strokeRect(0, -t.r * T, L * T, t.r * 2 * T);
    }
    ctx.restore();
  }
  if (!a) return;
  const m = chefeDaArena(a); if (!m) return;
  if (m.ar && m.ar.escudoAte > G.agora) { const pul = 1 + Math.sin(G.agora / 120) * 0.06; ctx.save(); ctx.strokeStyle = 'rgba(140,232,255,0.9)'; ctx.fillStyle = 'rgba(140,232,255,0.16)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(m.x * T, m.y * T, 1.05 * T * pul, 0.66 * T * pul, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
  if (m.ar && m.ar.fase === 2) { ctx.save(); ctx.strokeStyle = `rgba(255,60,40,${0.5 + 0.3 * Math.sin(G.agora / 90)})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(m.x * T, m.y * T, 0.9 * T, 0.56 * T, 0, 0, 7); ctx.stroke(); ctx.restore(); }
}
if (typeof desenhaChaoClima === 'function') {
  const _dccAr = desenhaChaoClima;
  desenhaChaoClima = function (ctx, ...r) { _dccAr(ctx, ...r); desenhaArenaChao(ctx); };
} else {
  desenhaChaoClima = function (ctx) { desenhaArenaChao(ctx); };
}
const _desenhaBuffsAr = desenhaBuffs;
desenhaBuffs = function (ctx) {
  _desenhaBuffsAr(ctx);
  const a = arenaAtual(); if (!a) return;
  const m = chefeDaArena(a); if (!m || !(m.bravo || dist(m, G.p) < 9)) return;
  const px = G.dpr || 1; const W = Math.min(CV.width * 0.5, 520 * px), x0 = (CV.width - W) / 2, y0 = 40 * px, H = 14 * px;
  ctx.save();
  ctx.fillStyle = 'rgba(20,10,30,0.75)'; ctx.fillRect(x0 - 4 * px, y0 - 20 * px, W + 8 * px, H + 26 * px);
  ctx.font = `700 ${13 * px}px Fredoka, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = a.cor;
  const fase = m.ar.fase === 2 ? ' · MODO FINAL' : m.ar.escudoAte > G.agora ? ' · ESCUDO' : '';
  ctx.fillText(`${a.chefe.nome} · Nv ${a.L}${fase}`, CV.width / 2, y0 - 5 * px);
  ctx.fillStyle = '#3a1a1a'; ctx.fillRect(x0, y0, W, H);
  const pc = clamp(m.hp / m.d.hp, 0, 1);
  const g = ctx.createLinearGradient(x0, 0, x0 + W, 0); g.addColorStop(0, '#ff3a3a'); g.addColorStop(1, m.ar.fase === 2 ? '#ff8a1a' : '#ff5a8a');
  ctx.fillStyle = g; ctx.fillRect(x0, y0, W * pc, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5 * px; for (const f of [0.7, 0.35]) { ctx.beginPath(); ctx.moveTo(x0 + W * f, y0); ctx.lineTo(x0 + W * f, y0 + H); ctx.stroke(); }
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2 * px; ctx.strokeRect(x0, y0, W, H);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${10.5 * px}px Nunito, sans-serif`; ctx.fillText(`${fmt(Math.max(0, m.hp))} / ${fmt(m.d.hp)}`, CV.width / 2, y0 + H - 3 * px);
  ctx.restore();
};

/* ---------- laço: telegrafos, presença e avisos de horário ---------- */
const _atualizaAr = atualiza;
atualiza = function (dt) {
  _atualizaAr(dt);
  resolveTelegrafos();
  G.tArena = (G.tArena || 0) + dt; if (G.tArena > 1000) { G.tArena = 0; atualizaArena(); }
};
const ARENA_AVISO = {};
setInterval(() => {
  if (!G.rodando || !G.save) return;
  for (const a of ARENAS) {
    if (G.save.nivel < a.req) continue;
    const j = janelaArena(a); const hoje = venceuHoje(a); const antes = ARENA_AVISO[a.id];
    if (antes === undefined) { ARENA_AVISO[a.id] = { aberta: j.aberta, logo: false }; if (j.aberta && !hoje) log(`🏟️ ${a.chefe.nome} está em campo na ${a.nome} (entrada em ${getNomeMapa(a.host)}) por mais ${fmtMin(j.resta)}!`, 'l-lendario'); continue; }
    if (j.aberta && !antes.aberta && !hoje) { log(`🏟️ ${a.chefe.nome} entrou em campo na ${a.nome} (entrada em ${getNomeMapa(a.host)})! Fica ${ARENA_JANELA} min.`, 'l-lendario'); if (!arenaAtual()) banner('🏟️ Chefão em campo!', a.nome); }
    if (!j.aberta && j.abre <= 5 && !antes.logo && !hoje) { antes.logo = true; log(`⏰ Daqui a ${fmtMin(j.abre)} ${a.chefe.nome} entra em campo na ${a.nome}.`, 'l-sis'); }
    if (j.aberta) antes.logo = false;
    antes.aberta = j.aberta;
  }
}, 5000);

/* ---------- estilo ---------- */
(function () {
  const st = document.createElement('style');
  st.textContent = `
  .rar-mitico { border-color: #ff5ad8 !important; background: radial-gradient(circle at 50% 45%, #fff0ff 0 35%, #ffb0f0 70%, #9adcff 100%) !important; box-shadow: 0 0 10px #ff5ad8cc, 0 0 4px #5ae0ff inset; animation: brilhoMit 1.8s ease-in-out infinite; }
  @keyframes brilhoMit { 0%,100% { box-shadow: 0 0 8px #ff5ad8aa, 0 0 3px #5ae0ff inset; } 50% { box-shadow: 0 0 16px #ff5ad8, 0 0 8px #5ae0ff inset; } }
  .slot.rar-mitico, .eq-slot.rar-mitico { border-width: 2px; border-style: solid; }
  .txt-mitico { color: #c0209a; background: linear-gradient(90deg, #d0209a, #2a8ad0, #d0209a); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .tag-rar.rar-mitico { color: #fff; background: linear-gradient(90deg, #ff5ad8, #5a9aff) !important; }
  .l-mitico { color: #ff8ae8; font-weight: 800; background: linear-gradient(90deg, rgba(255,90,216,.22), rgba(90,224,255,.18)); text-shadow: 0 0 6px rgba(255,90,216,.6); }
  .ar-retrato { width: 110px; height: 138px; border: 3px solid; border-radius: 10px; flex-shrink: 0; }
  .ar-status { font-weight: 800; padding: 4px 8px; border-radius: 6px; display: inline-block; }
  .ar-aberta { background: #ffe0d8; color: #b0301a; animation: pisca 1.2s ease-in-out infinite; }
  .ar-fechada { background: #efe3c8; color: #6a4a2a; }
  .ar-ok { background: #d8f5c0; color: #1a6a2a; }
  .ar-regras { margin: 6px 0 0; padding-left: 18px; font-size: 13.5px; line-height: 1.35; }
  .ar-regras li { margin: 2px 0; }
  .ar-itens { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin: 6px 0 10px; }
  .ar-item { width: 112px; border: 2px solid; border-radius: 10px; padding: 6px 4px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 2px; }
  .ar-item canvas { width: 56px; height: 56px; }
  .ar-item small { font-weight: 800; color: #5a1a4a; font-size: 12px; line-height: 1.15; }
  .ar-item b { font-size: 11px; color: #1a6a2a; }
  .ar-item:not(.tem) canvas { filter: saturate(.9); }
  .ar-linha .nm small { display: block; }
  #btnArenas { white-space: nowrap; }
  `;
  document.head.append(st);
})();
