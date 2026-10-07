/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — dados do jogo (itens, adversários, dribles,
   missões, NPCs, quiz). Tudo que é "balanceamento" mora aqui.
   ============================================================ */

// v407 (Raio-X R8): artigo certo antes do nome do lugar nos textos-molde ("ao Rio", "ao Cairo", "à Lua", "a Tóquio")
// prepLugar('a'|'em'|'de', nome) → 'ao Rio de Janeiro', 'na Lua', 'de Tóquio'...
const LUGAR_ARTIGO = { 'Rio de Janeiro': 'o', 'Rio': 'o', 'Cairo': 'o', 'Moon': 'a', 'Nebula': 'a', 'Orion Nebula': 'a', 'Space Station': 'a', 'Vila Belmiro': 'a', 'Campinho Village': 'a', 'City': 'a', 'Beach': 'a' };
function prepLugar(prep, nome) {
  const art = LUGAR_ARTIGO[nome] || '';
  const t = { a: { o: 'to', a: 'to the', '': 'to' }, em: { o: 'in', a: nome === 'Moon' ? 'on the' : 'in the', '': 'in' }, de: { o: 'of', a: 'of the', '': 'of' } }[prep] || { o: prep, a: prep, '': prep };
  return `${t[art]} ${nome}`;
}
// Onde ficam as peças de avatar do Educação Gamer (CORS liberado)
const ASSET_BASE = 'https://www.educacaogamer.com.br';

// Ranking online: ligado pelo PORTAL (js/portal.js) quando o jogo roda dentro
// do site — PUT/GET /api/lenda/ranking (ver enviaRankingOnline em game.js e
// modalRanking em ui.js). Fora do site, o ranking fica só no aparelho.
const CONFIG = {
  rankingUrl: null, // não usado mais (mantido pra saves/código antigos)
  versaoSave: 1,
};

/* ---------- Avatar (peças do site) ---------- */
const AVATAR = {
  peles: [
    { id: 'pele-clara', nome: 'Clara', cor: '#fcdccc', corF: '#fcd4c4' },
    { id: 'pele-media', nome: 'Medium', cor: '#ec9c7c', corF: '#f4ac94' },
    { id: 'pele-morena', nome: 'Tan', cor: '#cc8464', corF: '#d4846c' },
    { id: 'pele-negra', nome: 'Brown', cor: '#a4644c', corF: '#ac6454' },
    { id: 'pele-retinta', nome: 'Dark Brown', cor: '#643c3c', corF: '#643c3c' },
  ],
  cabelos: [
    { id: 'cabelo-curto', nome: 'Short', estilo: 'curto', cor: '#884838' },
    { id: 'cabelo-cacheado', nome: 'Curly', estilo: 'cacheado', cor: '#683838' },
    { id: 'cabelo-liso-longo', nome: 'Long straight', estilo: 'longo', cor: '#282828' },
    { id: 'cabelo-coque', nome: 'Bun', estilo: 'coque', cor: '#583838' },
    { id: 'cabelo-black-power', nome: 'Afro', estilo: 'black', cor: '#484848' },
  ],
  coresCabelo: [
    { id: 'original', nome: 'Original', cor: null },
    { id: 'preto', nome: 'Black', cor: '#2a2230' },
    { id: 'castanho', nome: 'Brown', cor: '#7a4a2a' },
    { id: 'loiro', nome: 'Blond', cor: '#ffb94a' },
    { id: 'grisalho', nome: 'Gray', cor: '#e2dfea' },
    { id: 'ruivo', nome: 'Red', cor: '#e0582a' },
    { id: 'rosa', nome: 'Pink', cor: '#ff8ccb' },
    { id: 'azul', nome: 'Blue', cor: '#4f82ff' },
    { id: 'roxo', nome: 'Purple', cor: '#a066ff' },
    { id: 'verde', nome: 'Green', cor: '#46c776' },
  ],
  roupas: [
    { id: 'roupa-camiseta', nome: 'T-shirt', cor: '#a868c8', cor2: '#784898' },
    { id: 'roupa-moletom', nome: 'Hoodie', cor: '#5888c8', cor2: '#4070b0' },
    { id: 'roupa-xadrez', nome: 'Plaid', cor: '#882828', cor2: '#581018' },
    { id: 'roupa-regata', nome: 'Tank top', cor: '#f0f0f0', cor2: '#c8c8d8' },
  ],
  baixos: [
    { id: 'baixo-shorts', nome: 'Shorts', cor: '#5878a8' },
    { id: 'baixo-jeans', nome: 'Jeans', cor: '#587898' },
    { id: 'baixo-saia', nome: 'Skirt', cor: '#d84848' },
    { id: 'baixo-moletom', nome: 'Hoodie', cor: '#888898' },
  ],
  rostos: [
    { id: null, nome: 'None' },
    { id: 'rosto-redondos', nome: 'Glasses' },
    { id: 'rosto-escuros', nome: 'Sunglasses' },
  ],
};

/* ---------- Fases da vida ---------- */
const FASES = [
  { nome: 'Kid', min: 1, fundo: 'fundo-quarto' },
  { nome: 'Youth', min: 10, fundo: 'fundo-roxo' },
  { nome: 'Under-20', min: 25, fundo: 'fundo-estadio' },
  { nome: 'Pro', min: 40, fundo: 'fundo-estadio' },
  { nome: 'Legend', min: 60, fundo: 'fundo-galaxia' },
];

/* ---------- Posições (as "vocações") ---------- */
const POSICOES = {
  atacante: {
    nome: 'Striker', desc: 'More damage with dribbles and shots. Balanced stamina.',
    hp: 12, foco: 7, taxa: { drible: 1, chute: 1, defesa: 1.6, visao: 1.5 }, dano: 1.12, cor: '#ff6b5a',
  },
  meia: {
    nome: 'Midfielder', desc: 'Lots of focus and vision: special dribbles and strong heals.',
    hp: 9, foco: 15, taxa: { drible: 1.3, chute: 1.2, defesa: 1.8, visao: 0.8 }, dano: 1, cor: '#5ac8ff',
  },
  zagueiro: {
    nome: 'Center Back', desc: 'Lots of stamina and defense. Can take hits from several opponents at once.',
    hp: 17, foco: 5, taxa: { drible: 1.15, chute: 1.4, defesa: 0.8, visao: 2 }, dano: 0.95, cor: '#7ee06a',
  },
};

const SKILLS = {
  drible: { nome: 'Dribbling', desc: 'Damage from close-range attacks and dribbles.' },
  chute: { nome: 'Shooting', desc: 'Damage from long-range attacks and shots.' },
  defesa: { nome: 'Defense', desc: 'Blocks part of the tackles you take.' },
  visao: { nome: 'Vision', desc: 'Power of heals and special dribbles. Trains by spending focus.' },
};

/* ---------- Itens ---------- */
// slot: cabeca | camisa | calcao | perna | chuteira | acessorio
// icon: {k: forma, c: cor principal, c2: detalhe}
const ITENS = {
  // --- chave / missão
  bola: { nome: 'Old Leather Ball', tipo: 'chave', desc: 'Your first ball. Never leave home without it.', icon: { k: 'bola' } },
  bola_praia: { nome: 'Stolen Beach Ball', tipo: 'loot', venda: 4, desc: 'The seagulls are always taking these.', icon: { k: 'bola', c: '#ff5a5a', c2: '#ffe14a' } },

  // --- consumíveis
  agua: { nome: 'Water Bottle', tipo: 'consumivel', efeito: { hp: 60 }, preco: 10, venda: 3, desc: 'Restores 60 stamina.', icon: { k: 'garrafa', c: '#7cc8ff' } },
  isotonico: { nome: 'Focus Drink', tipo: 'consumivel', efeito: { foco: 50 }, preco: 15, venda: 4, desc: 'Restores 50 focus.', icon: { k: 'garrafa', c: '#4fd06a' } },
  acai: { nome: 'Açaí Bowl', tipo: 'consumivel', efeito: { hp: 220 }, lvl: 14, preco: 55, venda: 12, desc: 'Restores 220 stamina. Level 14.', icon: { k: 'tigela', c: '#6a2a8a' } },
  suco_verde: { nome: 'Green Juice', tipo: 'consumivel', efeito: { foco: 160 }, lvl: 20, preco: 70, venda: 15, desc: 'Restores 160 focus. Level 20.', icon: { k: 'copo', c: '#7ad04a' } },
  vitamina: { nome: 'Banana Smoothie', tipo: 'consumivel', efeito: { hp: 520 }, lvl: 35, preco: 160, venda: 30, desc: 'Restores 520 stamina. Level 35.', icon: { k: 'copo', c: '#f8e27a' } },
  agua_coco: { nome: 'Iced Coconut Water', tipo: 'consumivel', efeito: { foco: 380 }, lvl: 38, preco: 170, venda: 32, desc: 'Restores 380 focus. Level 38.', icon: { k: 'coco', c: '#5a9a3a' } },
  pacotinho: { nome: 'Sticker Pack', tipo: 'consumivel', efeito: { figurinha: 1 }, venda: 20, desc: 'A gift from the game: open it and the sticker shows up right away! Packs aren\'t sold in shops: at Seu Juca\'s newsstand you pick the sticker you want, and you see it first.', icon: { k: 'pacote', c: '#ffcc33' } }, // v408.3 (ECA Digital): sem preço = não se compra (era 120 tostões por uma figurinha sorteada); vitrine em figurinha_vista.js

  // --- loot para vender
  pena: { nome: 'Pigeon Feather', tipo: 'loot', venda: 2, desc: 'Light and useless. Dona Cida buys them.', icon: { k: 'pena', c: '#b0b0c0' } },
  bola_murcha: { nome: 'Flat Ball', tipo: 'loot', venda: 6, desc: 'You can patch it up and sell it.', icon: { k: 'bola', c: '#c8b890', c2: '#6a5a40' } },
  osso: { nome: 'Slobbery Bone', tipo: 'loot', venda: 8, desc: 'Caramelo doesn\'t want it anymore.', icon: { k: 'osso' } },
  apito_velho: { nome: 'Old Whistle', tipo: 'loot', venda: 15, desc: 'Still whistles, a little hoarse.', icon: { k: 'apito', c: '#c0c0c8' } },
  concha: { nome: 'Pretty Seashell', tipo: 'loot', venda: 14, desc: 'It sparkles in the sun.', icon: { k: 'concha' } },
  oculos_sol: { nome: 'Sunglasses', tipo: 'loot', venda: 30, desc: 'Beach style.', icon: { k: 'oculos' } },
  roda_skate: { nome: 'Skateboard Wheel', tipo: 'loot', venda: 45, desc: 'It spins beautifully.', icon: { k: 'roda' } },
  cone: { nome: 'Training Cone', tipo: 'loot', venda: 60, desc: 'Orange and full of history.', icon: { k: 'cone' } },
  prancheta: { nome: 'Tactics Clipboard', tipo: 'loot', venda: 110, desc: 'Full of little arrows.', icon: { k: 'prancheta' } },
  cronometro: { nome: 'Stopwatch', tipo: 'loot', venda: 140, desc: 'Even times the halftime break.', icon: { k: 'relogio' } },
  cartao: { nome: 'Yellow Card', tipo: 'loot', venda: 180, desc: 'Pulled from a referee\'s pocket.', icon: { k: 'cartao', c: '#ffd23f' } },
  cartao_vermelho: { nome: 'Red Card', tipo: 'loot', venda: 420, desc: 'Super rare.', icon: { k: 'cartao', c: '#ff3b3b' } },
  luva: { nome: 'Goalkeeper Glove', tipo: 'loot', venda: 260, desc: 'Sticky.', icon: { k: 'luva' } },

  // --- CABEÇA
  bone: { nome: 'Campinho Cap', tipo: 'equip', slot: 'cabeca', def: 1, lvl: 1, preco: 40, venda: 10, avatar: 'chapeu-bone', desc: 'Keeps the afternoon sun off.', icon: { k: 'bone', c: '#3a6ad9' } },
  faixa_suor: { nome: 'Sweatband', tipo: 'equip', slot: 'cabeca', def: 1, st: { drible: 1 }, lvl: 3, preco: 90, venda: 25, avatar: 'chapeu-faixa', desc: '+1 dribble.', icon: { k: 'faixa', c: '#ff5a5a' } },
  faixa_capitao: { nome: 'Captain\'s Armband', tipo: 'equip', slot: 'cabeca', def: 3, st: { hp: 30 }, lvl: 12, preco: 900, venda: 220, avatar: 'chapeu-faixa', desc: '+30 max stamina.', icon: { k: 'faixa', c: '#ffd23f' } },
  headset: { nome: 'Analysis Headset', tipo: 'equip', slot: 'cabeca', def: 3, st: { visao: 2, foco: 40 }, lvl: 22, preco: 3200, venda: 700, avatar: 'chapeu-headset', desc: '+2 vision, +40 focus.', icon: { k: 'headset' } },
  louros: { nome: 'Laurel Crown', tipo: 'equip', slot: 'cabeca', def: 5, st: { drible: 2, chute: 2 }, lvl: 32, venda: 2500, avatar: 'chapeu-louros', desc: '+2 dribble, +2 shot.', icon: { k: 'louros' } },
  coroa: { nome: 'Ace\'s Crown', tipo: 'equip', slot: 'cabeca', def: 8, st: { drible: 4, chute: 4, visao: 3, hp: 80 }, lvl: 50, venda: 20000, avatar: 'chapeu-coroa', raro: true, desc: 'Legendary. Only those who beat The Wall can wear it.', icon: { k: 'coroa' } },

  // --- CAMISA
  camiseta: { nome: 'Worn-Out T-Shirt', tipo: 'equip', slot: 'camisa', def: 1, lvl: 1, preco: 20, venda: 5, desc: 'It used to be white once.', icon: { k: 'camisa', c: '#e8e8e8' }, cor: null },
  camisa_vila: { nome: 'Village Team Jersey', tipo: 'equip', slot: 'camisa', def: 3, lvl: 5, preco: 250, venda: 60, avatar: 'roupa-futebol', desc: 'Yellow, with the crest sewn on by hand.', icon: { k: 'camisa', c: '#f8d838', c2: '#2a8a3a' }, cor: '#f8d838', cor2: '#2a8a3a' },
  camisa_listrada: { nome: 'Striped Beach Jersey', tipo: 'equip', slot: 'camisa', def: 5, st: { hp: 20 }, lvl: 12, preco: 1100, venda: 260, avatar: 'roupa-futebol', desc: '+20 stamina.', icon: { k: 'camisa', c: '#3aa0e0', c2: '#ffffff' }, cor: '#3aa0e0', cor2: '#ffffff', listras: true },
  camisa_futsal: { nome: 'Futsal Jersey', tipo: 'equip', slot: 'camisa', def: 8, st: { vel: 8 }, lvl: 20, preco: 4200, venda: 900, avatar: 'roupa-futebol', desc: '+8 speed.', icon: { k: 'camisa', c: '#ff7a2a', c2: '#1a1a2a' }, cor: '#ff7a2a', cor2: '#1a1a2a' },
  camisa_ct: { nome: 'Training Center Jersey', tipo: 'equip', slot: 'camisa', def: 11, st: { hp: 60 }, lvl: 30, preco: 12000, venda: 2600, avatar: 'roupa-futebol', desc: '+60 stamina.', icon: { k: 'camisa', c: '#2a4ad9', c2: '#ffffff' }, cor: '#2a4ad9', cor2: '#ffffff' },
  camisa_pro: { nome: 'Pro Jersey', tipo: 'equip', slot: 'camisa', def: 15, st: { hp: 90, drible: 1 }, lvl: 40, venda: 6000, avatar: 'roupa-futebol', desc: '+90 stamina, +1 dribble.', icon: { k: 'camisa', c: '#e0e0f0', c2: '#d42a2a' }, cor: '#f0f0f8', cor2: '#d42a2a', listras: true },
  camisa10: { nome: 'Golden Number 10 Jersey', tipo: 'equip', slot: 'camisa', def: 20, st: { hp: 150, drible: 5, chute: 5, visao: 2 }, lvl: 50, venda: 30000, avatar: 'roupa-camisa10-ouro', raro: true, desc: 'LEGENDARY. The jersey everyone dreams of wearing.', icon: { k: 'camisa', c: '#e8b848', c2: '#fff2a0' }, cor: '#e8b848', cor2: '#fff2a0' },

  // --- CALÇÃO
  shorts_rasgado: { nome: 'Ripped Shorts', tipo: 'equip', slot: 'calcao', def: 1, lvl: 1, preco: 15, venda: 4, desc: 'Well ventilated.', icon: { k: 'calcao', c: '#5878a8' } },
  calcao_tactel: { nome: 'Tactel Shorts', tipo: 'equip', slot: 'calcao', def: 2, lvl: 6, preco: 180, venda: 45, desc: 'Makes that swishy sound.', icon: { k: 'calcao', c: '#2a2a3a' }, cor: '#2a2a3a' },
  calcao_praia: { nome: 'Beach Shorts', tipo: 'equip', slot: 'calcao', def: 3, st: { vel: 4 }, lvl: 12, preco: 800, venda: 190, avatar: 'baixo-praia', desc: '+4 speed.', icon: { k: 'calcao', c: '#ff8a3a' }, cor: '#ff8a3a' },
  calcao_pro: { nome: 'Pro Shorts', tipo: 'equip', slot: 'calcao', def: 6, st: { hp: 40 }, lvl: 28, preco: 7000, venda: 1500, desc: '+40 stamina.', icon: { k: 'calcao', c: '#ffffff' }, cor: '#f0f0f8' },
  calcao_camuflado: { nome: 'Camo Shorts', tipo: 'equip', slot: 'calcao', def: 8, st: { defesa: 2 }, lvl: 38, venda: 4200, avatar: 'baixo-camuflada', desc: '+2 defense.', icon: { k: 'calcao', c: '#5a6a3a' }, cor: '#5a6a3a' },

  // --- PERNAS (caneleira/meião)
  caneleira_papelao: { nome: 'Cardboard Shin Guard', tipo: 'equip', slot: 'perna', def: 1, lvl: 2, preco: 30, venda: 8, desc: 'Better than nothing.', icon: { k: 'caneleira', c: '#c8a070' }, cor: '#e8e8e8' },
  caneleira_plastico: { nome: 'Plastic Shin Guard', tipo: 'equip', slot: 'perna', def: 3, lvl: 10, preco: 600, venda: 140, desc: 'Now we\'re talking.', icon: { k: 'caneleira', c: '#3a8ad9' }, cor: '#3a6ad9' },
  caneleira_carbono: { nome: 'Carbon Shin Guard', tipo: 'equip', slot: 'perna', def: 7, st: { defesa: 1 }, lvl: 30, preco: 9000, venda: 2000, desc: '+1 defense.', icon: { k: 'caneleira', c: '#2a2a2a' }, cor: '#1a1a1a' },

  // --- CHUTEIRA (a "arma": atk)
  pe_descalco: { nome: 'Flip-Flops', tipo: 'equip', slot: 'chuteira', atk: 1, lvl: 1, preco: 5, venda: 1, desc: 'Attack 1.', icon: { k: 'chinelo' } },
  tenis_velho: { nome: 'Old Sneakers', tipo: 'equip', slot: 'chuteira', atk: 3, lvl: 1, preco: 35, venda: 8, desc: 'Attack 3.', icon: { k: 'chuteira', c: '#e0e0e0' }, cor: '#e0e0e0' },
  chuteira_pano: { nome: 'Cloth Cleats', tipo: 'equip', slot: 'chuteira', atk: 5, lvl: 3, preco: 150, venda: 35, desc: 'Attack 5.', icon: { k: 'chuteira', c: '#1a1a1a' }, cor: '#2a2a2a' },
  chuteira_couro: { nome: 'Leather Cleats', tipo: 'equip', slot: 'chuteira', atk: 8, lvl: 8, preco: 480, venda: 110, desc: 'Attack 8.', icon: { k: 'chuteira', c: '#6a3a1a' }, cor: '#6a3a1a' },
  chuteira_society: { nome: 'Turf Cleats', tipo: 'equip', slot: 'chuteira', atk: 11, st: { vel: 6 }, lvl: 16, preco: 2400, venda: 560, desc: 'Attack 11, +6 speed.', icon: { k: 'chuteira', c: '#2ad96a' }, cor: '#2ad96a' },
  chuteira_travas: { nome: 'Metal-Stud Cleats', tipo: 'equip', slot: 'chuteira', atk: 15, lvl: 26, preco: 8000, venda: 1800, desc: 'Attack 15.', icon: { k: 'chuteira', c: '#d92a5a' }, cor: '#d92a5a' },
  chuteira_pro: { nome: 'Pro Cleats', tipo: 'equip', slot: 'chuteira', atk: 19, st: { vel: 6 }, lvl: 40, venda: 5000, desc: 'Attack 19, +6 speed.', icon: { k: 'chuteira', c: '#ff7a1a' }, cor: '#ff7a1a' },
  chuteira_ouro: { nome: 'Golden Cleats', tipo: 'equip', slot: 'chuteira', atk: 26, st: { vel: 12, chute: 3 }, lvl: 55, venda: 40000, raro: true, desc: 'LEGENDARY. Attack 26, +12 speed, +3 shot.', icon: { k: 'chuteira', c: '#f0c030' }, cor: '#f0c030' },

  // --- ACESSÓRIO
  munhequeira: { nome: 'Wristband', tipo: 'equip', slot: 'acessorio', st: { visao: 1 }, lvl: 1, preco: 120, venda: 30, desc: '+1 game vision.', icon: { k: 'munhequeira', c: '#ff5a9a' } },
  apito: { nome: 'Captain\'s Whistle', tipo: 'equip', slot: 'acessorio', def: 1, st: { foco: 30 }, lvl: 10, preco: 700, venda: 160, avatar: 'pescoco-apito', desc: '+30 max focus.', icon: { k: 'apito', c: '#f0c030' } },
  colar_havaiano: { nome: 'Hawaiian Lei', tipo: 'equip', slot: 'acessorio', st: { regen: 3 }, lvl: 14, preco: 1500, venda: 350, avatar: 'pescoco-havaiano', desc: '+3 stamina and focus regen.', icon: { k: 'colar' } },
  medalha_bronze: { nome: 'Bronze Medal', tipo: 'equip', slot: 'acessorio', def: 2, st: { hp: 40, foco: 20 }, lvl: 20, venda: 900, avatar: 'pescoco-medalha', desc: '+40 stamina, +20 focus.', icon: { k: 'medalha', c: '#c87a3a' } },
  medalha_prata: { nome: 'Silver Medal', tipo: 'equip', slot: 'acessorio', def: 3, st: { hp: 80, foco: 50 }, lvl: 32, venda: 2800, avatar: 'pescoco-medalha', desc: '+80 stamina, +50 focus.', icon: { k: 'medalha', c: '#c8c8d8' } },
  medalha_colecionador: { nome: 'Collector\'s Medal', tipo: 'equip', slot: 'acessorio', def: 3, st: { drible: 3, chute: 3, visao: 3, regen: 2 }, lvl: 1, venda: 1, avatar: 'pescoco-medalha', raro: true, desc: 'Reward for completing the album. +3 to everything.', icon: { k: 'medalha', c: '#ff5aff' } },
  medalha_ouro: { nome: 'Gold Medal', tipo: 'equip', slot: 'acessorio', def: 5, st: { hp: 150, foco: 100, regen: 2 }, lvl: 45, venda: 9000, avatar: 'pescoco-medalha', raro: true, desc: '+150 stamina, +100 focus.', icon: { k: 'medalha', c: '#f0c030' } },
};

/* ---------- Dribles (as "magias") ---------- */
// tipo: melee (adjacente), dist (à distância), cura, buff, area
const DRIBLES = {
  pedalada: { nome: 'Step-Over', tipo: 'melee', lvl: 2, foco: 10, cd: 2000, poder: 1.3, skill: 'drible', fx: 'giro', cor: '#ffd23f', desc: 'Step-overs right in front of the defender.' },
  respiro: { nome: 'Breather', tipo: 'cura', lvl: 4, foco: 20, cd: 1000, poder: 1, fx: 'cura', cor: '#5affb0', desc: 'Take a deep breath and recover stamina.' },
  chute_colocado: { nome: 'Placed Shot', tipo: 'dist', lvl: 6, foco: 15, cd: 2000, alcance: 5, poder: 1.5, skill: 'chute', fx: 'bola', cor: '#ffffff', desc: 'A shot into the corner, from far away.' },
  arrancada: { nome: 'Sprint Burst', tipo: 'buff', lvl: 8, foco: 30, cd: 2000, dur: 22000, vel: 70, fx: 'vento', cor: '#9ad8ff', desc: 'Become 30% faster for 22 seconds.' },
  chapeu: { nome: 'Rainbow Flick', tipo: 'melee', lvl: 12, foco: 25, cd: 2000, poder: 2.1, skill: 'drible', fx: 'chapeu', cor: '#ff9a3a', desc: 'The ball goes right over his head.' },
  voleio: { nome: 'Volley', tipo: 'dist', lvl: 15, foco: 35, cd: 2000, alcance: 5, poder: 2.5, skill: 'chute', fx: 'bolaforte', cor: '#ffe27a', desc: 'Hit it first time, before it touches the ground.' },
  elastico: { nome: 'Elastico', tipo: 'melee', lvl: 20, foco: 40, cd: 2000, poder: 3.0, skill: 'drible', fx: 'elastico', cor: '#ff5ad0', desc: 'This way and that way, and he falls on his bottom.' },
  folego_campeao: { nome: 'Champion\'s Stamina', tipo: 'cura', lvl: 22, foco: 60, cd: 1000, poder: 2.4, fx: 'curaforte', cor: '#5affb0', desc: 'A huge heal.' },
  caneta: { nome: 'Nutmeg', tipo: 'melee', lvl: 28, foco: 50, cd: 2000, poder: 4.0, skill: 'drible', fx: 'caneta', cor: '#7affff', desc: 'The ball goes right between his legs.' },
  tabela: { nome: 'One-Two', tipo: 'area', lvl: 32, foco: 70, cd: 2000, raio: 1, poder: 2.4, skill: 'drible', fx: 'area', cor: '#b07aff', desc: 'Dribble past everyone right next to you.' },
  bicicleta: { nome: 'Bicycle Kick', tipo: 'dist', lvl: 40, foco: 90, cd: 3000, alcance: 5, poder: 5.6, skill: 'chute', fx: 'explosao', cor: '#ffffff', desc: 'The most beautiful screamer in soccer.' },
  relampago: { nome: 'Lightning Step-Over', tipo: 'area', lvl: 55, foco: 160, cd: 3000, raio: 2, poder: 4.2, skill: 'drible', fx: 'raio', cor: '#ffe14a', desc: 'Legendary. Dribbles everyone within a radius of 2.' },
};

/* ---------- Adversários ---------- */
// look: aparência do sprite. ranged: ataque à distância.
const MONSTROS = {
  // Zona 1 — Vila do Campinho
  pombo: {
    nome: 'Cheeky Pigeon', hp: 16, atk: 4, def: 0, xp: 5, vel: 170, aggro: 0, atkCd: 2200, fig: 'f_pombo',
    look: { tipo: 'pombo' }, ouro: [0, 2], loot: [['pena', 0.6, 1, 2]], falas: ['Coooo!', 'Coo coo?'],
  },
  moleque: {
    nome: 'Ball-Hog Kid', hp: 32, atk: 8, def: 1, xp: 12, vel: 200, aggro: 0, atkCd: 2000, fig: 'f_fominha',
    look: { tipo: 'humano', pele: '#cc8464', cabelo: '#2a2230', estilo: 'curto', camisa: '#e04040', calcao: '#303040', meia: '#e0e0e0', chuteira: '#303030', fase: 0 },
    ouro: [1, 6], loot: [['bola_murcha', 0.25, 1, 1], ['agua', 0.1, 1, 1]], falas: ['The ball is mine!', 'Pass it to me!', 'Only I shoot!'],
  },
  caramelo: {
    nome: 'Caramelo the Dog', hp: 48, atk: 12, def: 2, xp: 20, vel: 290, aggro: 5, atkCd: 1800, fig: 'f_caramelo',
    look: { tipo: 'cachorro' }, ouro: [0, 4], loot: [['osso', 0.4, 1, 1], ['bola_murcha', 0.15, 1, 1]], falas: ['Woof woof!', 'WOOF!', 'Grrr...'],
  },
  zagueiro_rua: {
    nome: 'Street Defender', hp: 85, atk: 16, def: 4, xp: 35, vel: 190, aggro: 4, atkCd: 2000, fig: 'f_zagueiro_rua',
    look: { tipo: 'humano', pele: '#a4644c', cabelo: '#1a1a1a', estilo: 'raspado', camisa: '#404040', calcao: '#202020', meia: '#303030', chuteira: '#101010', fase: 1 },
    ouro: [3, 12], loot: [['caneleira_papelao', 0.05, 1, 1], ['faixa_suor', 0.02, 1, 1], ['agua', 0.15, 1, 1], ['apito_velho', 0.05, 1, 1]], falas: ['You shall not pass!', 'You\'ll have to dribble past me!'],
  },
  tonhao: {
    nome: 'Tonhão, Rival Captain', hp: 520, atk: 30, def: 6, xp: 450, vel: 210, aggro: 0, atkCd: 1800, chefe: true, respawn: 60000, fig: 'f_tonhao',
    look: { tipo: 'humano', pele: '#ec9c7c', cabelo: '#583020', estilo: 'moicano', camisa: '#b01818', calcao: '#ffffff', meia: '#b01818', chuteira: '#101010', fase: 1, faixa: '#ffd23f', grande: true },
    ouro: [80, 140], loot: [['camisa_vila', 0.3, 1, 1], ['chuteira_couro', 0.25, 1, 1], ['faixa_suor', 0.4, 1, 1]], falas: ['This little pitch is MINE!', 'Go back to your crib, kiddo!'],
  },

  // Zona 2 — Praia
  caranguejo: {
    nome: 'Pinchy Crab', hp: 110, atk: 22, def: 6, xp: 55, vel: 150, aggro: 3, atkCd: 2000, fig: 'f_caranguejo',
    look: { tipo: 'caranguejo' }, ouro: [4, 14], loot: [['concha', 0.3, 1, 1], ['agua', 0.1, 1, 2]], falas: ['*clack clack*'],
  },
  gaivota: {
    nome: 'Thief Seagull', hp: 90, atk: 20, def: 3, xp: 50, vel: 320, aggro: 5, atkCd: 1700, fig: 'f_gaivota',
    look: { tipo: 'gaivota' }, ouro: [2, 10], loot: [['bola_praia', 0.45, 1, 1], ['oculos_sol', 0.06, 1, 1]], falas: ['Squawk! Squawk!', 'My ball!'],
  },
  futevoleiro: {
    nome: 'Footvolley Player', hp: 200, atk: 30, def: 8, xp: 110, vel: 220, aggro: 5, atkCd: 2200, fig: 'f_futevoleiro',
    ranged: { alcance: 4, dano: 28, cd: 2400, proj: 'bola' },
    look: { tipo: 'humano', pele: '#b87450', cabelo: '#e8c070', estilo: 'curto', camisa: null, calcao: '#ff8a3a', meia: null, chuteira: null, fase: 2 },
    ouro: [8, 24], loot: [['oculos_sol', 0.08, 1, 1], ['acai', 0.06, 1, 1], ['calcao_praia', 0.01, 1, 1]], falas: ['Don\'t let it drop!', 'Feet in the sand, ball in the air!'],
  },
  salva_vidas: {
    nome: 'Bossy Lifeguard', hp: 300, atk: 38, def: 10, xp: 170, vel: 230, aggro: 5, atkCd: 2000, fig: 'f_salva',
    look: { tipo: 'humano', pele: '#cc8464', cabelo: '#3a2a1a', estilo: 'curto', camisa: '#ff3a3a', calcao: '#ff3a3a', meia: null, chuteira: null, fase: 3, bone: '#ffd23f' },
    ouro: [12, 34], loot: [['apito_velho', 0.15, 1, 1], ['acai', 0.1, 1, 1], ['camisa_listrada', 0.008, 1, 1], ['apito', 0.01, 1, 1]], falas: ['Restricted area!', 'I\'m the boss around here!'],
  },
  rei_areia: {
    nome: 'Sand King', hp: 2600, atk: 70, def: 14, xp: 2600, vel: 240, aggro: 2, atkCd: 1700, chefe: true, respawn: 240000, fig: 'f_rei_areia',
    ranged: { alcance: 4, dano: 55, cd: 2600, proj: 'areia' },
    look: { tipo: 'humano', pele: '#8a5434', cabelo: '#f0d080', estilo: 'longo', camisa: null, calcao: '#f0c030', meia: null, chuteira: null, fase: 3, coroa: true, grande: true },
    ouro: [300, 500], loot: [['colar_havaiano', 0.35, 1, 1], ['calcao_praia', 0.3, 1, 1], ['camisa_listrada', 0.2, 1, 1]], falas: ['Nobody gets me off this sand!', 'Come on, rookie!'],
  },

  // Zona 3 — Cidade
  skatista: {
    nome: 'Cheeky Skater', hp: 330, atk: 45, def: 12, xp: 220, vel: 330, aggro: 5, atkCd: 1800, fig: 'f_skatista',
    look: { tipo: 'humano', pele: '#fcdccc', cabelo: '#5a3a2a', estilo: 'longo', camisa: '#2a2a2a', calcao: '#5a6a8a', meia: '#e0e0e0', chuteira: '#e03a3a', fase: 2, bone: '#e03a3a' },
    ouro: [14, 40], loot: [['roda_skate', 0.25, 1, 1], ['isotonico', 0.2, 1, 2]], falas: ['Awesome!', 'Out of my way!'],
  },
  pivo: {
    nome: 'Futsal Pivot', hp: 460, atk: 55, def: 18, xp: 300, vel: 210, aggro: 4, atkCd: 2000, fig: 'f_pivo',
    look: { tipo: 'humano', pele: '#a4644c', cabelo: '#1a1a1a', estilo: 'raspado', camisa: '#ff7a2a', calcao: '#1a1a2a', meia: '#ff7a2a', chuteira: '#ffffff', fase: 3, numero: true },
    ouro: [20, 50], loot: [['cone', 0.12, 1, 1], ['acai', 0.12, 1, 1], ['chuteira_society', 0.005, 1, 1]], falas: ['Stop the pivot!', 'Lean on me and I\'ll spin!'],
  },
  ala: {
    nome: 'Speedy Winger', hp: 390, atk: 50, def: 14, xp: 280, vel: 320, aggro: 5, atkCd: 1700, fig: 'f_ala',
    look: { tipo: 'humano', pele: '#ec9c7c', cabelo: '#e0c050', estilo: 'curto', camisa: '#ff7a2a', calcao: '#1a1a2a', meia: '#ff7a2a', chuteira: '#2ad96a', fase: 2, numero: true },
    ouro: [18, 46], loot: [['isotonico', 0.25, 1, 2], ['cone', 0.1, 1, 1]], falas: ['Down the wing!', 'Nobody can catch me!'],
  },
  goleiro_linha: {
    nome: 'Sweeper Keeper', hp: 490, atk: 55, def: 16, xp: 340, vel: 220, aggro: 5, atkCd: 2200, fig: 'f_goleiro_linha',
    ranged: { alcance: 4, dano: 52, cd: 2400, proj: 'bola' },
    look: { tipo: 'humano', pele: '#cc8464', cabelo: '#2a2230', estilo: 'cacheado', camisa: '#2ad96a', calcao: '#1a1a1a', meia: '#2ad96a', chuteira: '#1a1a1a', fase: 3, luvas: true },
    ouro: [22, 56], loot: [['luva', 0.08, 1, 1], ['acai', 0.1, 1, 1]], falas: ['Playing it out!', 'Goal kick!'],
  },
  rei_quadra: {
    nome: 'Court King', hp: 7500, atk: 120, def: 22, xp: 9000, vel: 250, aggro: 2, atkCd: 1600, chefe: true, respawn: 300000, fig: 'f_rei_quadra',
    look: { tipo: 'humano', pele: '#643c3c', cabelo: '#1a1a1a', estilo: 'black', camisa: '#ffd23f', calcao: '#1a1a2a', meia: '#ffd23f', chuteira: '#ffd23f', fase: 3, coroa: true, grande: true, numero: true },
    ouro: [900, 1400], loot: [['headset', 0.3, 1, 1], ['camisa_futsal', 0.35, 1, 1], ['medalha_bronze', 0.5, 1, 1]], falas: ['On my court, I\'m the king!', 'Olé! Olé!'],
  },

  // Zona 4 — CT das Categorias de Base
  volante: {
    nome: 'Sliding Midfielder', hp: 720, atk: 75, def: 25, xp: 520, vel: 230, aggro: 5, atkCd: 2000, fig: 'f_volante',
    look: { tipo: 'humano', pele: '#fcdccc', cabelo: '#3a2a1a', estilo: 'curto', camisa: '#2a4ad9', calcao: '#ffffff', meia: '#2a4ad9', chuteira: '#101010', fase: 3, numero: true },
    ouro: [30, 80], loot: [['prancheta', 0.1, 1, 1], ['suco_verde', 0.12, 1, 1], ['calcao_pro', 0.005, 1, 1]], falas: ['SLIDE TACKLE!', 'Tactical foul!'],
  },
  lateral: {
    nome: 'Marathon Fullback', hp: 640, atk: 70, def: 20, xp: 480, vel: 340, aggro: 6, atkCd: 1700, fig: 'f_lateral',
    look: { tipo: 'humano', pele: '#a4644c', cabelo: '#1a1a1a', estilo: 'cacheado', camisa: '#2a4ad9', calcao: '#ffffff', meia: '#2a4ad9', chuteira: '#ff7a1a', fase: 3, numero: true },
    ouro: [28, 74], loot: [['cronometro', 0.08, 1, 1], ['suco_verde', 0.15, 1, 1]], falas: ['Up and down!', 'I never get tired!'],
  },
  preparador: {
    nome: 'Fitness Coach', hp: 920, atk: 85, def: 24, xp: 700, vel: 240, aggro: 5, atkCd: 2000, fig: 'f_preparador',
    ranged: { alcance: 4, dano: 70, cd: 2500, proj: 'cone' },
    look: { tipo: 'humano', pele: '#ec9c7c', cabelo: '#9a9a9a', estilo: 'raspado', camisa: '#e0e0e0', calcao: '#2a2a3a', meia: '#e0e0e0', chuteira: '#2a2a2a', fase: 4, apito: true },
    ouro: [40, 100], loot: [['cronometro', 0.15, 1, 1], ['cone', 0.2, 1, 1], ['vitamina', 0.1, 1, 1]], falas: ['Ten more laps!', 'Tired? Then run!'],
  },
  zagueiro_sub20: {
    nome: 'U-20 Defender', hp: 1150, atk: 95, def: 35, xp: 900, vel: 220, aggro: 5, atkCd: 2000, fig: 'f_zagueiro_sub20',
    look: { tipo: 'humano', pele: '#643c3c', cabelo: '#1a1a1a', estilo: 'black', camisa: '#2a4ad9', calcao: '#ffffff', meia: '#2a4ad9', chuteira: '#101010', fase: 3, numero: true, grande: true },
    ouro: [45, 110], loot: [['prancheta', 0.12, 1, 1], ['vitamina', 0.1, 1, 1], ['caneleira_carbono', 0.004, 1, 1], ['medalha_prata', 0.003, 1, 1]], falas: ['It\'s all muscle here!', 'Either the ball gets by or you do.'],
  },
  capitao_sub20: {
    nome: 'U-20 National Team Captain', hp: 17000, atk: 170, def: 38, xp: 22000, vel: 260, aggro: 2, atkCd: 1600, chefe: true, respawn: 360000, fig: 'f_capitao',
    ranged: { alcance: 4, dano: 120, cd: 3000, proj: 'bola' },
    look: { tipo: 'humano', pele: '#cc8464', cabelo: '#1a1a1a', estilo: 'moicano', camisa: '#f8d838', calcao: '#2a4ad9', meia: '#ffffff', chuteira: '#2ad96a', fase: 3, faixa: '#ffffff', grande: true, numero: true },
    ouro: [2500, 3500], loot: [['louros', 0.35, 1, 1], ['medalha_prata', 0.5, 1, 1], ['calcao_camuflado', 0.3, 1, 1]], falas: ['This is the National Team!', 'Show me your soccer!'],
  },

  // Zona 5 — Estádio
  meia_armador: {
    nome: 'Playmaking Midfielder', hp: 1350, atk: 110, def: 32, xp: 1100, vel: 250, aggro: 6, atkCd: 2000, fig: 'f_meia',
    ranged: { alcance: 5, dano: 105, cd: 2400, proj: 'bola' },
    look: { tipo: 'humano', pele: '#ec9c7c', cabelo: '#3a2a1a', estilo: 'longo', camisa: '#d42a2a', calcao: '#101010', meia: '#d42a2a', chuteira: '#ffffff', fase: 3, numero: true },
    ouro: [60, 150], loot: [['prancheta', 0.2, 1, 1], ['agua_coco', 0.1, 1, 1], ['chuteira_pro', 0.003, 1, 1]], falas: ['Long ball!', 'I saw the pass!'],
  },
  centroavante: {
    nome: 'Tank Striker', hp: 1750, atk: 130, def: 40, xp: 1400, vel: 230, aggro: 5, atkCd: 2000, fig: 'f_centroavante',
    look: { tipo: 'humano', pele: '#a4644c', cabelo: '#1a1a1a', estilo: 'raspado', camisa: '#d42a2a', calcao: '#101010', meia: '#d42a2a', chuteira: '#f0c030', fase: 4, numero: true, grande: true },
    ouro: [70, 170], loot: [['vitamina', 0.15, 1, 1], ['camisa_pro', 0.004, 1, 1], ['medalha_ouro', 0.001, 1, 1]], falas: ['The box is my home!', 'Bump!'],
  },
  xerife: {
    nome: 'Sheriff Defender', hp: 2150, atk: 140, def: 55, xp: 1800, vel: 220, aggro: 5, atkCd: 2000, fig: 'f_xerife',
    look: { tipo: 'humano', pele: '#fcdccc', cabelo: '#c0c0c0', estilo: 'curto', camisa: '#d42a2a', calcao: '#101010', meia: '#d42a2a', chuteira: '#101010', fase: 4, numero: true, grande: true, faixa: '#ffd23f' },
    ouro: [80, 190], loot: [['vitamina', 0.2, 1, 1], ['chuteira_pro', 0.004, 1, 1], ['calcao_camuflado', 0.005, 1, 1]], falas: ['Not in my box!', 'You\'ll have to go over me!'],
  },
  arbitro: {
    nome: 'Strict Referee', hp: 1500, atk: 120, def: 30, xp: 1500, vel: 260, aggro: 6, atkCd: 2000, fig: 'f_arbitro',
    ranged: { alcance: 5, dano: 115, cd: 2200, proj: 'cartao' },
    look: { tipo: 'humano', pele: '#ec9c7c', cabelo: '#1a1a1a', estilo: 'raspado', camisa: '#1a1a1a', calcao: '#1a1a1a', meia: '#1a1a1a', chuteira: '#101010', fase: 4, apito: true },
    ouro: [70, 170], loot: [['cartao', 0.25, 1, 1], ['cartao_vermelho', 0.04, 1, 1], ['agua_coco', 0.12, 1, 1]], falas: ['FOUL!', 'Yellow for you!', 'Complaining? Red!'],
  },
  paredao: {
    nome: 'The Wall, Legendary Goalkeeper', hp: 48000, atk: 230, def: 60, xp: 60000, vel: 240, aggro: 2, atkCd: 1500, chefe: true, respawn: 600000, fig: 'f_paredao',
    ranged: { alcance: 5, dano: 190, cd: 2600, proj: 'bolaforte' },
    look: { tipo: 'humano', pele: '#643c3c', cabelo: '#1a1a1a', estilo: 'black', camisa: '#7a2ad9', calcao: '#1a1a1a', meia: '#7a2ad9', chuteira: '#f0c030', fase: 4, luvas: true, grande: true, coroa: true },
    ouro: [9000, 12000], loot: [['coroa', 0.25, 1, 1], ['chuteira_ouro', 0.15, 1, 1], ['medalha_ouro', 0.4, 1, 1]], falas: ['Nobody scores on me!', 'Try it, if you can!'],
  },

  // Bonecos de treino (não atacam, não morrem de verdade)
  boneco: {
    nome: 'Training Dummy', hp: 999999, atk: 0, def: 0, xp: 0, vel: 0, aggro: 0, atkCd: 99999, treino: true,
    look: { tipo: 'boneco' }, ouro: [0, 0], loot: [], falas: [],
  },
};

/* ---------- Álbum de figurinhas ---------- */
const FIGURINHAS = [
  { id: 'f_pombo', nome: 'Cheeky Pigeon', cor: '#b0b0c0' },
  { id: 'f_fominha', nome: 'Ball-Hog Kid', cor: '#e04040' },
  { id: 'f_caramelo', nome: 'Caramelo', cor: '#d08a3a' },
  { id: 'f_zagueiro_rua', nome: 'Street Defender', cor: '#404040' },
  { id: 'f_tonhao', nome: 'Tonhão', cor: '#b01818' },
  { id: 'f_caranguejo', nome: 'Pinchy', cor: '#e0503a' },
  { id: 'f_gaivota', nome: 'Thief Seagull', cor: '#e8e8f0' },
  { id: 'f_futevoleiro', nome: 'Footvolley Player', cor: '#ff8a3a' },
  { id: 'f_salva', nome: 'Lifeguard', cor: '#ff3a3a' },
  { id: 'f_rei_areia', nome: 'Sand King', cor: '#f0c030' },
  { id: 'f_skatista', nome: 'Skater', cor: '#2a2a2a' },
  { id: 'f_pivo', nome: 'Pivot', cor: '#ff7a2a' },
  { id: 'f_ala', nome: 'Speedy Winger', cor: '#ffa05a' },
  { id: 'f_goleiro_linha', nome: 'Sweeper Keeper', cor: '#2ad96a' },
  { id: 'f_rei_quadra', nome: 'Court King', cor: '#ffd23f' },
  { id: 'f_volante', nome: 'Defensive Mid', cor: '#2a4ad9' },
  { id: 'f_lateral', nome: 'Fullback', cor: '#4a6af9' },
  { id: 'f_preparador', nome: 'Coach', cor: '#e0e0e0' },
  { id: 'f_zagueiro_sub20', nome: 'U-20 Defender', cor: '#1a3ab9' },
  { id: 'f_capitao', nome: 'U-20 Captain', cor: '#f8d838' },
  { id: 'f_meia', nome: 'Playmaking Midfielder', cor: '#d42a2a' },
  { id: 'f_centroavante', nome: 'Striker', cor: '#b41a1a' },
  { id: 'f_xerife', nome: 'Sheriff', cor: '#8a1010' },
  { id: 'f_arbitro', nome: 'Referee', cor: '#1a1a1a' },
  { id: 'f_paredao', nome: 'The Wall', cor: '#7a2ad9' },
  { id: 'f_ze', nome: 'Seu Zé (1978)', cor: '#6a8a3a' },
  { id: 'f_tata', nome: 'Master Tatá', cor: '#3aa0e0' },
  { id: 'f_ginga', nome: 'Master Ginga', cor: '#ff5ad0' },
  { id: 'f_dada', nome: 'Seu Dadá', cor: '#f0c030' },
  { id: 'f_mascote', nome: 'EG Mascot', cor: '#7a4aff' },
];

/* ---------- Missões ---------- */
// req: kill {m, n} | item {id, n} | flag | gols n | quiz n | prof n | nivel
const MISSOES = [
  // ------ Vila do Campinho
  { id: 'q_bola', npc: 'mae', titulo: 'My first ball', lvl: 1,
    texto: 'Sweetie, your leather ball is in the chest in the backyard, on the right side of the house. Go get it!',
    req: { flag: 'pegou_bola', desc: 'Get the ball from the chest in the backyard' },
    rec: { xp: 25, ouro: 10, itens: [['agua', 3]] }, fim: 'That\'s it! Now go to the little pitch and talk to Seu Zé. He coaches the kids.' },
  { id: 'q_pombos', npc: 'ze', titulo: 'Warm-Up', lvl: 1, pre: 'q_bola',
    texto: 'So you want to play ball? Warm up first. These cheeky pigeons are always sitting on the little pitch. Dribble past 6 of them!',
    req: { kill: 'pombo', n: 6 }, rec: { xp: 60, ouro: 20, drible: 'pedalada' },
    fim: 'Nice! You warmed up well. Dribbles come with experience: with every new level you learn them on your own (the STEP-OVER arrives at level 2 — use it on the hotbar when you\'re right next to an opponent).' }, // v407 (Raio-X): era "Vou te ensinar a PEDALADA (tecla 1)"; o drible chega sozinho no nível 2 (dribles_nivel.js)
  { id: 'q_moleques', npc: 'ze', titulo: 'The Ball Hogs', lvl: 3, pre: 'q_pombos',
    texto: 'There are some ball-hog kids who never pass the ball to anyone. Show 10 of them how it\'s done!',
    req: { kill: 'moleque', n: 10 }, rec: { xp: 160, ouro: 40, itens: [['chuteira_pano', 1]] },
    fim: 'You got cloth cleats! Equip them in your backpack.' },
  { id: 'q_penaltis', npc: 'ze', titulo: 'Penalty Practice', lvl: 4, pre: 'q_moleques',
    texto: 'A real star doesn\'t shake at the penalty spot. Go to the penalty spot on the little pitch and score 5 goals.',
    req: { gols: 5, desc: 'Score 5 goals from the penalty spot' }, rec: { xp: 140, drible: 'chute_colocado' },
    fim: 'What a strike! A penalty star. (The PLACED SHOT, which attacks from far away, arrives on its own at level 6.)' }, // v407 (Raio-X): o drible vem pelo nível, não pela missão
  { id: 'q_escola', npc: 'lucia', titulo: 'Star Student', lvl: 1,
    texto: 'A good player is also a good student! Answer 5 questions right with me and I\'ll teach you to breathe like an athlete.',
    req: { prof: 5, desc: 'Get 5 of Teacher Lúcia\'s questions right' }, rec: { xp: 150, drible: 'respiro', itens: [['munhequeira', 1]] },
    fim: 'Congratulations! You learned BREATHER, which recovers your stamina. And take this wristband.' },
  { id: 'q_quiz', npc: 'juca', titulo: 'Do You Know Soccer?', lvl: 2,
    texto: 'Soccer experts get stickers! Get 8 questions right on my quiz.',
    req: { quiz: 8, desc: 'Get 8 questions right on Seu Juca\'s quiz' }, rec: { xp: 250, itens: [['pacotinho', 2]] },
    fim: 'Here are two packs! Complete the album and win a special prize.' },
  { id: 'q_caramelo', npc: 'ze', titulo: 'Runaway Caramelo', lvl: 5, pre: 'q_penaltis',
    // v407 (Raio-X A3): no começo quase tudo era "vença N"; esta virou "recupere e entregue" (item que cai dos caramelos)
    texto: 'The wild Caramelo dogs ran off with the balls from the little pitch! Dribble past them gently, here in the Village, and bring me back 2 Flat Balls.',
    req: { item: 'bola_murcha', n: 2, de: 'caramelo', desc: 'Get back 2 Flat Balls from the Caramelo Dogs' }, rec: { xp: 320, ouro: 60, itens: [['faixa_suor', 1]] },
    fim: 'They just wanted to play... Take this sweatband!' },
  { id: 'q_zagueiros', npc: 'ze', titulo: 'The Street Wall', lvl: 7, pre: 'q_caramelo',
    texto: 'The street defenders out in the east woods kick more than they play. Get past 10 of them.',
    req: { kill: 'zagueiro_rua', n: 10 }, rec: { xp: 650, ouro: 80, itens: [['camisa_vila', 1]] },
    fim: 'You deserve the Village Team jersey!' },
  { id: 'q_tonhao', npc: 'ze', titulo: 'The Captain\'s Challenge', lvl: 8, pre: 'q_zagueiros',
    texto: 'The time has come. TONHÃO, the rival team\'s captain, took over the east side of the little pitch. Beat him and you\'ll go far!',
    req: { kill: 'tonhao', n: 1 }, rec: { xp: 1100, ouro: 150, drible: 'arrancada', flag: 'libera_praia' },
    fim: 'You beat Tonhão! The road to the BEACH (east) is open. At level 10, come back here for the tryout!' }, // v407 (Raio-X): a ARRANCADA já chegou sozinha no nível 8
  { id: 'q_peneira', npc: 'ze', titulo: 'The Tryout', lvl: 10, pre: 'q_tonhao',
    texto: 'It\'s tryout time! I\'ll watch you play and tell you what position you play (it matches your class).',
    req: { flag: 'escolheu_posicao', desc: 'Do the tryout with Seu Zé' }, rec: { xp: 400, itens: [['apito', 1]] },
    fim: 'Now you\'re a YOUTH player! The world is yours.' },

  // ------ Praia
  { id: 'p_caranguejos', npc: 'tata', titulo: 'Feet in the Sand', lvl: 10,
    texto: 'Sand is a whole different sport, buddy. Learn to move by dribbling past 12 pinchy crabs.',
    req: { kill: 'caranguejo', n: 12 }, rec: { xp: 900, ouro: 120, drible: 'chapeu' },
    fim: 'I taught you the RAINBOW FLICK (level 12). The ball goes over and the defender is left staring at the sky!' },
  { id: 'p_gaivotas', npc: 'marinho', titulo: 'Thief Seagulls', lvl: 11,
    texto: 'The seagulls stole the kids\' balls! Bring me 8 stolen beach balls.',
    req: { item: 'bola_praia', n: 8 }, rec: { xp: 1300, ouro: 150, itens: [['camisa_listrada', 1]] },
    fim: 'The kids say thanks! Keep this striped jersey.' },
  { id: 'p_futevolei', npc: 'tata', titulo: 'Footvolley King', lvl: 13, pre: 'p_caranguejos',
    texto: 'Now it\'s footvolley. Beat 15 footvolley players without letting the ball drop!',
    req: { kill: 'futevoleiro', n: 15 }, rec: { xp: 2200, ouro: 200, drible: 'voleio' },
    fim: 'You learned the VOLLEY (level 15): a powerful long-range shot.' },
  { id: 'p_salva', npc: 'marinho', titulo: 'Bossy Lifeguards', lvl: 15, pre: 'p_gaivotas',
    texto: 'Some lifeguards think they own the beach. Put 12 of them in their place.',
    req: { kill: 'salva_vidas', n: 12 }, rec: { xp: 3200, ouro: 260, itens: [['caneleira_plastico', 1]] },
    fim: 'The beach is peaceful again. Take this shin guard!' },
  { id: 'p_rei', npc: 'tata', titulo: 'The Sand King', lvl: 17, pre: 'p_futevolei',
    texto: 'The SAND KING lives at the end of the beach, past the coconut trees to the south. He\'s never lost. Until today.',
    req: { kill: 'rei_areia', n: 1 }, rec: { xp: 6500, ouro: 500, flag: 'libera_cidade' },
    fim: 'LEGENDARY! The road to the CITY (north of the beach) is open.' },

  // ------ Cidade
  { id: 'c_skate', npc: 'ginga', titulo: 'Skate Park Hangout', lvl: 18,
    texto: 'In the city, the game is fast. The cheeky skaters are getting in the way on the court. Dribble past 15 of them.',
    req: { kill: 'skatista', n: 15 }, rec: { xp: 5000, ouro: 400, drible: 'elastico' },
    fim: 'You learned the ELASTICO (level 20)! This way, that way... and you\'re through.' },
  { id: 'c_pivos', npc: 'ginga', titulo: 'Court Control', lvl: 20, pre: 'c_skate',
    texto: 'Pivots are strong, with their backs to the goal. Beat 15 pivots on the courts.',
    req: { kill: 'pivo', n: 15 }, rec: { xp: 7000, ouro: 500, itens: [['chuteira_society', 1]] },
    fim: 'You got turf cleats!' },
  { id: 'c_alas', npc: 'neide', titulo: 'Nobody Can Stop the Wingers', lvl: 21,
    texto: 'I\'m Dona Neide, from the shop. The speedy wingers run by and knock over my shelves! Catch 20 of them.',
    req: { kill: 'ala', n: 20 }, rec: { xp: 8000, ouro: 600, drible: 'folego_campeao' },
    fim: 'My late husband was a fitness coach... he taught me CHAMPION\'S STAMINA. Now it\'s yours (level 22).' },
  { id: 'c_goleiros', npc: 'ginga', titulo: 'Goalies Play Too', lvl: 22, pre: 'c_pivos',
    texto: 'Sweeper keepers play it out and shoot from far away. Beat 15 of them.',
    req: { kill: 'goleiro_linha', n: 15 }, rec: { xp: 10000, ouro: 700, itens: [['camisa_futsal', 1]] },
    fim: 'Take the official futsal jersey!' },
  { id: 'c_rei', npc: 'ginga', titulo: 'The Court King', lvl: 24, pre: 'c_goleiros',
    texto: 'The COURT KING is at the covered court, in the northeast. If you beat him, I\'ll recommend you to the Training Center.',
    req: { kill: 'rei_quadra', n: 1 }, rec: { xp: 20000, ouro: 1200, flag: 'libera_ct' },
    fim: 'You\'re the new Court King! The YOUTH ACADEMY TRAINING CENTER (east) is waiting for you.' },

  // ------ CT
  { id: 't_volantes', npc: 'aurelio', titulo: 'Tight Marking', lvl: 26,
    texto: 'Here at the Training Center, it\'s professional. First lesson: get past 20 sliding midfielders.',
    req: { kill: 'volante', n: 20 }, rec: { xp: 18000, ouro: 1000, drible: 'caneta' },
    fim: 'You learned the NUTMEG (level 28). The boldest dribble in soccer.' }, // v407 (Raio-X U3): era "mais humilhante"
  { id: 't_laterais', npc: 'aurelio', titulo: 'Up and Down', lvl: 28, pre: 't_volantes',
    texto: 'The fullbacks never get tired. Beat 20 of them.',
    req: { kill: 'lateral', n: 20 }, rec: { xp: 20000, ouro: 1100, itens: [['chuteira_travas', 1]] },
    fim: 'Metal-stud cleats for you!' },
  { id: 't_preparadores', npc: 'bia', titulo: 'Total Endurance', lvl: 30,
    texto: 'I\'m Bia, the nutritionist. The fitness coaches are overdoing the training! Beat 15 of them.',
    req: { kill: 'preparador', n: 15 }, rec: { xp: 25000, ouro: 1300, drible: 'tabela', itens: [['suco_verde', 10]] },
    fim: 'You learned the ONE-TWO (level 32): dribble past everyone right next to you!' },
  { id: 't_zagueiros', npc: 'aurelio', titulo: 'The National Team Defense', lvl: 33, pre: 't_laterais',
    texto: 'The U-20 defenders are the best defense in the country. Get past 20.',
    req: { kill: 'zagueiro_sub20', n: 20 }, rec: { xp: 30000, ouro: 1600, itens: [['camisa_ct', 1]] },
    fim: 'Training Center jersey! You\'re almost there.' },
  { id: 't_capitao', npc: 'aurelio', titulo: 'National Team Captain', lvl: 37, pre: 't_zagueiros',
    texto: 'The U-20 NATIONAL TEAM CAPTAIN trains on the main field, to the north. Beat him and the stadium is yours.',
    req: { kill: 'capitao_sub20', n: 1 }, rec: { xp: 60000, ouro: 3000, flag: 'libera_estadio' },
    fim: 'YOU\'RE A PRO! The STADIUM (north of the Training Center) has opened its doors.' },

  // ------ Estádio
  { id: 'e_meias', npc: 'dada', titulo: 'The Team\'s Brain', lvl: 40,
    texto: 'I\'m Dadá, I played here for 20 years. Beat 25 playmaking midfielders and I\'ll teach you my screamer.',
    req: { kill: 'meia_armador', n: 25 }, rec: { xp: 60000, ouro: 3000, drible: 'bicicleta' },
    fim: 'BICYCLE KICK! The most beautiful goal in the world is now yours.' },
  { id: 'e_centroavantes', npc: 'presidente', titulo: 'The Signing', lvl: 42,
    texto: 'I\'m the club president. Want a contract? Beat 25 tank strikers.',
    req: { kill: 'centroavante', n: 25 }, rec: { xp: 80000, ouro: 4000, itens: [['camisa_pro', 1]] },
    fim: 'Contract signed! Put on the pro jersey.' },
  { id: 'e_xerifes', npc: 'dada', titulo: 'Sheriffs of the Box', lvl: 44, pre: 'e_meias',
    texto: 'The sheriff defenders don\'t let anyone into the box. Get past 25.',
    req: { kill: 'xerife', n: 25 }, rec: { xp: 100000, ouro: 5000, itens: [['chuteira_pro', 1]] },
    fim: 'Pro cleats for you!' },
  { id: 'e_arbitros', npc: 'presidente', titulo: 'No Cheating', lvl: 45, pre: 'e_centroavantes',
    texto: 'There\'s a referee handing out cards left and right. Beat 20 of them with fair play.',
    req: { kill: 'arbitro', n: 20 }, rec: { xp: 100000, ouro: 5000, itens: [['caneleira_carbono', 1]] },
    fim: 'Fair play! Carbon shin guards for you.' },
  { id: 'e_paredao', npc: 'dada', titulo: 'The Wall', lvl: 50, pre: 'e_xerifes',
    texto: 'Nobody has ever scored on THE WALL, the legendary goalkeeper who guards the west goal of the stadium. Nobody... until now?',
    req: { kill: 'paredao', n: 1 }, rec: { xp: 250000, ouro: 12000, drible: 'relampago', itens: [['camisa10', 1]], flag: 'craque' },
    fim: 'GOOOOAL! You\'re the STAR! Take the GOLDEN NUMBER 10 JERSEY and the LIGHTNING STEP-OVER (level 55). Now the world is waiting for you: talk to Flight Attendant Luana at the City airport!' }, // v407 (Raio-X R8): era "rumo à Lenda (nível 60)", como se o jogo acabasse ali
];

/* ---------- NPCs ---------- */
const NPCS = {
  mae: { nome: 'Mom', look: { tipo: 'humano', pele: '#cc8464', cabelo: '#2a1a1a', estilo: 'coque', camisa: '#5ac878', calcao: '#3a5aa0', meia: null, chuteira: '#6a3a2a', fase: 4, fem: true },
    ola: 'Hi, sweetie! Be careful out there, okay? If you get too tired, come back home and I\'ll take care of you.', cura: true },
  ze: { nome: 'Seu Zé', look: { tipo: 'humano', pele: '#ec9c7c', cabelo: '#d0d0d0', estilo: 'raspado', camisa: '#2a8a3a', calcao: '#1a1a1a', meia: '#2a8a3a', chuteira: '#1a1a1a', fase: 4, apito: true, bone: '#2a8a3a' },
    ola: 'Hey there! I\'ve been coaching the kids at the little pitch for 40 years. I used to play a lot, you know?', professor: ['pedalada', 'chute_colocado', 'arrancada'], posicao: true },
  lucia: { nome: 'Teacher Lúcia', look: { tipo: 'humano', pele: '#a4644c', cabelo: '#1a1a1a', estilo: 'black', camisa: '#ff8ccb', calcao: '#3a3a5a', meia: null, chuteira: '#3a2a2a', fase: 4, fem: true, oculos: true },
    ola: 'Welcome to school! Here you learn math WITH soccer.', prof: true, professor: ['respiro'] },
  cida: { nome: 'Dona Cida', look: { tipo: 'humano', pele: '#fcdccc', cabelo: '#a0a0a0', estilo: 'coque', camisa: '#d84848', calcao: '#4a3a5a', meia: null, chuteira: '#3a2a2a', fase: 4, fem: true },
    ola: 'Cida\'s Bazaar! I\'ve got everything, and I\'ll buy your junk too.', loja: ['agua', 'isotonico', 'tenis_velho', 'bone', 'caneleira_papelao', 'shorts_rasgado', 'camiseta', 'calcao_tactel', 'chuteira_couro', 'camisa_vila', 'munhequeira'] },
  juca: { nome: 'Seu Juca from the Newsstand', look: { tipo: 'humano', pele: '#cc8464', cabelo: '#3a2a1a', estilo: 'curto', camisa: '#f0f0f0', calcao: '#5a4a3a', meia: null, chuteira: '#3a2a2a', fase: 4, oculos: true },
    ola: 'Newspapers, magazines and STICKERS! Up for a soccer quiz?', quiz: true, loja: [] }, // v408.3 (ECA Digital): no lugar do pacotinho às cegas, a vitrine de figurinhas à vista (figurinha_vista.js)
  motorista: { nome: 'Valdir the Bus Driver', look: { tipo: 'humano', pele: '#a4644c', cabelo: '#1a1a1a', estilo: 'curto', camisa: '#3a6ad9', calcao: '#2a2a3a', meia: null, chuteira: '#1a1a1a', fase: 4, bone: '#3a6ad9' },
    ola: 'City bus! I\'ll take you anywhere you already know.', onibus: true },
  quadro: { nome: 'Challenge Board', quadro: true, ola: 'Repeatable challenges: defeat opponents and earn extra XP and coins.' },

  tata: { nome: 'Master Tatá', look: { tipo: 'humano', pele: '#8a5434', cabelo: '#f0f0f0', estilo: 'raspado', camisa: null, calcao: '#3aa0e0', meia: null, chuteira: null, fase: 4, bone: '#ffffff' },
    ola: 'Hey there! I\'ve played footvolley on this beach my whole life.', professor: ['chapeu', 'voleio'] },
  marinho: { nome: 'Chief Marinho', look: { tipo: 'humano', pele: '#ec9c7c', cabelo: '#3a2a1a', estilo: 'curto', camisa: '#ffd23f', calcao: '#ff3a3a', meia: null, chuteira: null, fase: 4, apito: true },
    ola: 'Chief of the lifeguards. The good ones, okay?', cura: true },
  bene: { nome: 'Bené\'s Kiosk', look: { tipo: 'humano', pele: '#cc8464', cabelo: '#1a1a1a', estilo: 'cacheado', camisa: '#ff8a3a', calcao: '#2a8a3a', meia: null, chuteira: null, fase: 4 },
    ola: 'Stamina Bottles, Focus Drinks and beachwear!', loja: ['agua', 'isotonico', 'acai', 'calcao_praia', 'camisa_listrada', 'caneleira_plastico', 'faixa_capitao', 'colar_havaiano', 'apito'] },

  rodrigues: { nome: 'Agent Rodrigues', look: { tipo: 'humano', pele: '#cc8464', cabelo: '#1a1a1a', estilo: 'curto', camisa: '#1a1a2a', calcao: '#1a1a2a', meia: null, chuteira: '#101010', fase: 4, gravata: true, oculos: true },
    ola: 'Rodrigues, agent to the stars. When you\'re an adult (level 25), I\'ll help you start your own club!', empresario: true },
  ginga: { nome: 'Master Ginga', look: { tipo: 'humano', pele: '#643c3c', cabelo: '#1a1a1a', estilo: 'black', camisa: '#ff5ad0', calcao: '#1a1a2a', meia: '#ff5ad0', chuteira: '#ffffff', fase: 4 },
    ola: 'Futsal is art, young one. Small space, quick thinking.', professor: ['elastico'] },
  neide: { nome: 'Dona Neide', look: { tipo: 'humano', pele: '#fcdccc', cabelo: '#ffb94a', estilo: 'longo', camisa: '#2a4ad9', calcao: '#1a1a2a', meia: null, chuteira: '#2a2a2a', fase: 4, fem: true, oculos: true },
    ola: 'Neide\'s Sports Shop. Only top-quality gear!', loja: ['agua', 'isotonico', 'acai', 'suco_verde', 'chuteira_society', 'camisa_futsal', 'headset', 'faixa_capitao', 'colar_havaiano'], professor: ['folego_campeao'] },

  aurelio: { nome: 'Coach Aurélio', look: { tipo: 'humano', pele: '#fcdccc', cabelo: '#8a8a8a', estilo: 'curto', camisa: '#1a1a3a', calcao: '#1a1a3a', meia: '#1a1a3a', chuteira: '#1a1a1a', fase: 4, oculos: true },
    ola: 'Welcome to the Training Center. This is where we make stars.', professor: ['caneta'] },
  bia: { nome: 'Bia the Nutritionist', look: { tipo: 'humano', pele: '#a4644c', cabelo: '#3a1a1a', estilo: 'longo', camisa: '#ffffff', calcao: '#5ac878', meia: null, chuteira: '#ffffff', fase: 4, fem: true },
    ola: 'Athletes eat well! I have juices and smoothies.', loja: ['agua', 'isotonico', 'acai', 'suco_verde', 'vitamina', 'agua_coco', 'calcao_pro', 'camisa_ct', 'chuteira_travas', 'caneleira_carbono'], professor: ['tabela'], cura: true },

  dada: { nome: 'Seu Dadá', look: { tipo: 'humano', pele: '#643c3c', cabelo: '#e0e0e0', estilo: 'black', camisa: '#f0c030', calcao: '#1a1a1a', meia: '#f0c030', chuteira: '#1a1a1a', fase: 4 },
    ola: 'Hehe, I played 20 years in this stadium. 312 goals!', professor: ['bicicleta', 'relampago'] },
  presidente: { nome: 'President Almeida', look: { tipo: 'humano', pele: '#fcdccc', cabelo: '#c0c0c0', estilo: 'curto', camisa: '#2a2a3a', calcao: '#2a2a3a', meia: null, chuteira: '#101010', fase: 4, gravata: true },
    ola: 'The club needs stars. Are you one?', loja: ['vitamina', 'agua_coco', 'suco_verde', 'acai'] }, // v408.3 (ECA Digital): saiu o pacotinho (sorteio pago); a vitrine de figurinhas à vista entra aqui também
};

/* ---------- Custo para aprender dribles com professores ---------- */
const PRECO_DRIBLE = { pedalada: 0, respiro: 0, chute_colocado: 60, arrancada: 200, chapeu: 800, voleio: 1500, elastico: 3000, folego_campeao: 4000, caneta: 8000, tabela: 12000, bicicleta: 25000, relampago: 60000 };

/* ---------- Quiz de futebol (Seu Juca) ---------- */
const QUIZ = [
  ['How many players does each team have on the field in soccer?', ['11', '10', '12', '9']],
  ['How many men’s World Cups has Brazil won so far?', ['5', '4', '6', '3']],
  ['In what year did Brazil win its first World Cup?', ['1958', '1950', '1962', '1970']],
  ['Who is known as the "King of Football"?', ['Pelé', 'Garrincha', 'Zico', 'Maradona']],
  ['How long is the regular time of a soccer match?', ['90 minutes', '80 minutes', '100 minutes', '60 minutes']],
  ['Which country hosted the 2014 World Cup?', ['Brazil', 'Germany', 'Russia', 'South Africa']],
  ['How many players does each team have on the court in futsal?', ['5', '6', '7', '4']],
  ['Which card sends a player off the field?', ['Red', 'Yellow', 'Blue', 'Green']],
  ['How many meters from the goal is the penalty spot?', ['11 meters', '9 meters', '12 meters', '16 meters']],
  ['Which national team won the 2022 World Cup?', ['Argentina', 'France', 'Brazil', 'Croatia']],
  ['In which country was the 2022 World Cup played?', ['Qatar', 'Russia', 'United Arab Emirates', 'Saudi Arabia']],
  ['Which country won the first World Cup, in 1930?', ['Uruguay', 'Brazil', 'Argentina', 'Italy']],
  ['In which stadium did the "Maracanazo" happen, in 1950?', ['Maracanã', 'Pacaembu', 'Morumbi', 'Mineirão']],
  ['How many World Cups has Germany won?', ['4', '3', '5', '2']],
  ['Which Brazilian woman player was voted the best in the world by FIFA six times?', ['Marta', 'Formiga', 'Cristiane', 'Debinha']],
  ['Which player can use their hands inside their own box?', ['The goalkeeper', 'The captain', 'The defender', 'Nobody']],
  ['How long is each half of an official futsal match?', ['20 minutes', '25 minutes', '30 minutes', '15 minutes']],
  ['Which national team is nicknamed "Azzurra"?', ['Italy', 'France', 'Argentina', 'Uruguay']],
  ['In what year did Brazil win its fifth World Cup?', ['2002', '1994', '1998', '2006']],
  ['Which trophy did Brazil get to keep forever after winning its third title, in 1970?', ['Jules Rimet', 'Copa Libertadores', 'Copa América', 'Taça Brasil']],
  ['Who scored Brazil’s two goals in the 2002 World Cup final?', ['Ronaldo', 'Rivaldo', 'Ronaldinho', 'Roberto Carlos']],
  ['What is a "hat-trick"?', ['Three goals by the same player in one game', 'A dribble over the top', 'A header goal', 'A save with the feet']],
  ['What color is the warning card?', ['Yellow', 'Red', 'White', 'Orange']],
  ['Which English club is called the "Red Devils"?', ['Manchester United', 'Liverpool', 'Arsenal', 'Chelsea']],
  ['What is the top club competition in South America?', ['Copa Libertadores', 'Copa Sudamericana', 'Recopa', 'Copa América']],
  ['What is the most famous nickname of the Brazil national team?', ['Canarinho', 'Albiceleste', 'La Furia', 'Tricolor']], // v407 (Raio-X R8): "Furia" sem acento
  ['How many goals did Pelé score in World Cups?', ['12', '8', '15', '10']],
  ['Who is the top scorer in World Cup history, with 16 goals?', ['Miroslav Klose', 'Ronaldo', 'Pelé', 'Messi']],
  ['What is an "Olympic goal"?', ['A goal straight from a corner kick', 'A bicycle kick goal', 'A goal from midfield', 'A goal at the Olympics']],
  ['Where did Brazil win its fourth World Cup, in 1994?', ['United States', 'France', 'Italy', 'Mexico']],
  ['Which country hosted the 1970 World Cup, when Brazil won its third title?', ['Mexico', 'Chile', 'England', 'Germany']],
  ['Which Brazilian player won the Ballon d’Or in 2007?', ['Kaká', 'Ronaldinho', 'Neymar', 'Rivaldo']],
  ['How many players are on each footvolley team?', ['2', '3', '4', '1']],
  ['When the ball goes out over the sideline, play restarts with...', ['Throw-in', 'Corner kick', 'Goal kick', 'Penalty']],
  ['How many points is a win worth in round-robin leagues?', ['3', '2', '1', '4']],
  ['Who was Brazil’s coach when they won their fifth title in 2002?', ['Luiz Felipe Scolari', 'Tite', 'Zagallo', 'Parreira']],
  ['In what year was the first Women’s World Cup played?', ['1991', '1995', '1985', '2000']],
  ['Which national team has won the most Women’s World Cups?', ['United States', 'Germany', 'Brazil', 'Norway']],
  ['Which Brazilian club is nicknamed "Peixe"?', ['Santos', 'Vasco', 'Grêmio', 'Bahia']],
  ['Which club is called "Timão"?', ['Corinthians', 'Palmeiras', 'São Paulo', 'Flamengo']],
  ['Which player was called the "Angel with Bent Legs"?', ['Garrincha', 'Didi', 'Nilton Santos', 'Vavá']],
  ['Which player was known as "Galinho de Quintino" (the Little Rooster of Quintino)?', ['Zico', 'Sócrates', 'Romário', 'Júnior']],
  ['Which Brazilian player became known as "The Phenomenon"?', ['Ronaldo', 'Romário', 'Adriano', 'Rivaldo']],
  ['How many substitutions can each team make in an official match under the current rules?', ['5', '3', '4', '6']],
  ['In what year did Ronaldinho Gaúcho win the Ballon d’Or?', ['2005', '2002', '2007', '2009']],
  ['Which country has won the Copa América the most times?', ['Argentina', 'Brazil', 'Uruguay', 'Chile']],
  ['In which country did Brazil win the 1958 World Cup?', ['Sweden', 'Switzerland', 'Chile', 'England']],
  ['Who pulls the card out of their pocket during the game?', ['The referee', 'The linesman', 'The coach', 'The captain']],
];

/* ---------- Quadro de desafios por mapa ---------- */
const DESAFIOS = {
  vila: [['moleque', 40], ['caramelo', 40], ['zagueiro_rua', 40]],
  praia: [['caranguejo', 60], ['gaivota', 60], ['futevoleiro', 60], ['salva_vidas', 60]],
  cidade: [['skatista', 80], ['pivo', 80], ['ala', 80], ['goleiro_linha', 80]],
  ct: [['volante', 100], ['lateral', 100], ['preparador', 100], ['zagueiro_sub20', 100]],
  estadio: [['meia_armador', 120], ['centroavante', 120], ['xerife', 120], ['arbitro', 120]],
};

/* ---------- Aparências (peças de avatar do site) ----------
   Cada NPC/adversário humano é montado com as peças do catálogo.
   corRoupa recolore a camisa (ex.: uniforme). alt = altura em tiles. */
const APARENCIAS = {
  // NPCs
  mae: { corpo: 'f', pele: 'pele-morena', cabelo: 'cabelo-coque', corCabelo: 'preto', roupa: 'roupa-camiseta', corRoupa: '#4fae6a', baixo: 'baixo-saia', alt: 1.72 },
  ze: { pele: 'pele-media', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-futebol', corRoupa: '#2a8a3a', baixo: 'baixo-shorts', chapeu: 'chapeu-bone', pescoco: 'pescoco-apito', alt: 1.74 },
  lucia: { corpo: 'f', pele: 'pele-negra', cabelo: 'cabelo-black-power', corCabelo: 'preto', roupa: 'roupa-jaleco', baixo: 'baixo-jeans', rosto: 'rosto-redondos', mao: 'mao-livro', alt: 1.72 },
  cida: { corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-coque', corCabelo: 'grisalho', roupa: 'roupa-xadrez', baixo: 'baixo-saia', alt: 1.66 },
  juca: { pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'castanho', roupa: 'roupa-regata', baixo: 'baixo-jeans', rosto: 'rosto-redondos', mao: 'mao-livro', alt: 1.7 },
  motorista: { pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-camiseta', corRoupa: '#3a7ae0', baixo: 'baixo-jeans', chapeu: 'chapeu-bone', alt: 1.72 },
  tata: { pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-regata', baixo: 'baixo-praia', chapeu: 'chapeu-palha', alt: 1.72 },
  marinho: { pele: 'pele-media', cabelo: 'cabelo-curto', corCabelo: 'castanho', roupa: 'roupa-futebol', corRoupa: '#ff4a3a', baixo: 'baixo-praia', pescoco: 'pescoco-apito', alt: 1.76 },
  bene: { pele: 'pele-morena', cabelo: 'cabelo-cacheado', corCabelo: 'preto', roupa: 'roupa-regata', baixo: 'baixo-praia', pescoco: 'pescoco-havaiano', alt: 1.7 },
  rodrigues: { pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-terno', baixo: 'baixo-jeans', pescoco: 'pescoco-gravata', rosto: 'rosto-escuros', alt: 1.74 },
  ginga: { pele: 'pele-retinta', cabelo: 'cabelo-black-power', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#ff5ad0', baixo: 'baixo-shorts', mao: 'mao-bola', alt: 1.74 },
  neide: { corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-liso-longo', corCabelo: 'loiro', roupa: 'roupa-moletom', baixo: 'baixo-jeans', rosto: 'rosto-redondos', alt: 1.68 },
  aurelio: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-moletom', corRoupa: '#1e2a5a', baixo: 'baixo-moletom', pescoco: 'pescoco-apito', rosto: 'rosto-redondos', alt: 1.76 },
  bia: { corpo: 'f', pele: 'pele-negra', cabelo: 'cabelo-liso-longo', corCabelo: 'castanho', roupa: 'roupa-jaleco', baixo: 'baixo-jeans', alt: 1.7 },
  dada: { pele: 'pele-retinta', cabelo: 'cabelo-black-power', corCabelo: 'grisalho', roupa: 'roupa-camisa10-ouro', baixo: 'baixo-shorts', mao: 'mao-bola', alt: 1.74 },
  presidente: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-terno', baixo: 'baixo-jeans', pescoco: 'pescoco-gravata', alt: 1.74 },
  // Adversários humanos
  moleque: { pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#e84a3a', baixo: 'baixo-shorts', mao: 'mao-bola', alt: 1.32 },
  zagueiro_rua: { pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-couro', baixo: 'baixo-jeans', chapeu: 'chapeu-gorro', alt: 1.5 },
  tonhao: { pele: 'pele-media', cabelo: 'cabelo-moicano', roupa: 'roupa-futebol', corRoupa: '#b01818', baixo: 'baixo-shorts', chapeu: 'chapeu-faixa', alt: 1.5 },
  futevoleiro: { corpo: 'f', pele: 'pele-morena', cabelo: 'cabelo-rabo-rosa', roupa: 'roupa-regata', baixo: 'baixo-praia', rosto: 'rosto-escuros', alt: 1.62 },
  salva_vidas: { pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'castanho', roupa: 'roupa-futebol', corRoupa: '#ff3a3a', baixo: 'baixo-praia', chapeu: 'chapeu-bone', pescoco: 'pescoco-apito', alt: 1.68 },
  rei_areia: { pele: 'pele-negra', cabelo: 'cabelo-liso-longo', corCabelo: 'loiro', roupa: 'roupa-regata', baixo: 'baixo-praia', chapeu: 'chapeu-coroa', rosto: 'rosto-escuros', alt: 1.66 },
  skatista: { corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-undercut-rosa', roupa: 'roupa-moletom', corRoupa: '#2a2a3a', baixo: 'baixo-jeans', chapeu: 'chapeu-bone', alt: 1.6 },
  pivo: { pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#ff7a2a', baixo: 'baixo-shorts', alt: 1.7 },
  ala: { corpo: 'f', pele: 'pele-media', cabelo: 'cabelo-anime', corCabelo: 'loiro', roupa: 'roupa-futebol', corRoupa: '#ff9a3a', baixo: 'baixo-shorts', alt: 1.62 },
  goleiro_linha: { pele: 'pele-morena', cabelo: 'cabelo-cacheado', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#2ad96a', baixo: 'baixo-shorts', alt: 1.7 },
  rei_quadra: { pele: 'pele-retinta', cabelo: 'cabelo-black-power', corCabelo: 'preto', roupa: 'roupa-futebol', baixo: 'baixo-shorts', chapeu: 'chapeu-coroa', alt: 1.66 },
  volante: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'castanho', roupa: 'roupa-futebol', corRoupa: '#2a4ad9', baixo: 'baixo-shorts', alt: 1.72 },
  lateral: { corpo: 'f', pele: 'pele-negra', cabelo: 'cabelo-cacheado', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#3a62e9', baixo: 'baixo-shorts', alt: 1.66 },
  preparador: { pele: 'pele-media', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-moletom', baixo: 'baixo-moletom', pescoco: 'pescoco-apito', alt: 1.74 },
  zagueiro_sub20: { pele: 'pele-retinta', cabelo: 'cabelo-black-power', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#1a3ab9', baixo: 'baixo-shorts', alt: 1.72 },
  capitao_sub20: { pele: 'pele-morena', cabelo: 'cabelo-moicano', roupa: 'roupa-futebol', baixo: 'baixo-shorts', chapeu: 'chapeu-faixa', alt: 1.66 },
  meia_armador: { corpo: 'f', pele: 'pele-media', cabelo: 'cabelo-liso-longo', corCabelo: 'castanho', roupa: 'roupa-futebol', corRoupa: '#d42a2a', baixo: 'baixo-shorts', alt: 1.68 },
  centroavante: { pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#b41a1a', baixo: 'baixo-shorts', alt: 1.74 },
  xerife: { pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-futebol', corRoupa: '#8a1010', baixo: 'baixo-shorts', chapeu: 'chapeu-faixa', alt: 1.74 },
  arbitro: { pele: 'pele-media', cabelo: 'cabelo-curto', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#1e1e24', baixo: 'baixo-moletom', pescoco: 'pescoco-apito', alt: 1.74 },
  paredao: { pele: 'pele-retinta', cabelo: 'cabelo-black-power', corCabelo: 'preto', roupa: 'roupa-futebol', corRoupa: '#7a2ad9', baixo: 'baixo-shorts', chapeu: 'chapeu-coroa', alt: 1.7 },
};
for (const k in APARENCIAS) {
  const alvo = MONSTROS[k] || NPCS[k]; if (!alvo) continue;
  alvo.look = Object.assign({ tipo: 'humano', corpo: 'm', grande: !!(alvo.look && alvo.look.grande) }, APARENCIAS[k]);
}

/* ---------- Atributos e classes ----------
   4 atributos: cada nível dá pontos para distribuir e a classe
   ganha +1 automático no atributo principal. */
const ATRIBUTOS = {
  defesa: { nome: 'Defense', icone: '🛡️', cor: '#4a8ae8', desc: 'Reduces damage from tackles and increases the chance to block.' },
  habilidade: { nome: 'Skill', icone: '✨', cor: '#ff9a3a', desc: 'Increases dribble and shot damage and the chance of a critical hit.' },
  inteligencia: { nome: 'Intelligence', icone: '🧠', cor: '#b07aff', desc: 'More focus, stronger special dribbles, better heals and more XP from missions and quizzes.' },
  folego: { nome: 'Stamina', icone: '💨', cor: '#4fc26a', desc: 'More max stamina, faster recovery and more speed.' },
};
const PONTOS_POR_NIVEL = 2;
const CLASSES = {
  paredao: {
    nome: 'The Wall', principal: 'defesa', cor: '#4a8ae8', emoji: '🛡️',
    desc: 'Nobody gets through! Takes the hits and protects the box.',
    passiva: 'Perfect block: 12% chance to completely cancel a tackle.',
    especial: { id: 'muralha', nome: 'Fortress', cd: 30000, dur: 6000, desc: 'For 6 seconds you take only half damage.' },
    base: { defesa: 10, habilidade: 5, inteligencia: 5, folego: 7 },
  },
  driblador: {
    nome: 'Dribbler', principal: 'habilidade', cor: '#ff9a3a', emoji: '✨',
    desc: 'Pure swagger: dribbles that make the opponent fall on their bottom.',
    passiva: 'Ace: higher critical chance (damage x1.8 — "SCREAMER!").',
    especial: { id: 'firula', nome: 'Showboat', cd: 25000, dur: 3, desc: 'Your next 3 attacks are guaranteed critical hits.' },
    base: { defesa: 5, habilidade: 10, inteligencia: 6, folego: 6 },
  },
  cerebro: {
    nome: 'Playmaker', principal: 'inteligencia', cor: '#b07aff', emoji: '🧠',
    desc: 'Sees the game before everyone else. Studious and strategic.',
    passiva: 'Game reading: dribbles cost 20% less focus and you get +25% XP from missions and quizzes.',
    especial: { id: 'leitura', nome: 'Read the Game', cd: 40000, desc: 'Instantly recovers 35% focus and calms all nearby opponents.' },
    base: { defesa: 5, habilidade: 6, inteligencia: 10, folego: 6 },
  },
  motorzinho: {
    nome: 'Engine', principal: 'folego', cor: '#4fc26a', emoji: '💨',
    desc: 'Never gets tired! Runs the whole game.',
    passiva: 'Iron lungs: +8% speed and double stamina recovery.',
    especial: { id: 'segundo_folego', nome: 'Second Wind', cd: 45000, desc: 'Instantly recovers 40% stamina.' },
    base: { defesa: 6, habilidade: 6, inteligencia: 5, folego: 10 },
  },
};

/* ---------- Moeda, alimentos, materiais e refino ---------- */
const MOEDA = { nome: 'coin', plural: 'coins' };
Object.assign(ITENS, {
  // Alimentos: dão um bônus que dura alguns minutos (até 3 diferentes ao mesmo tempo, os bônus somam). O bônus cresce com o nível.
  pao_queijo: { nome: 'Cheese Bread', tipo: 'comida', efeito: { dur: 180, regen: 1.2 }, preco: 12, venda: 3, desc: 'Nice and warm! Recover stamina faster for 3 min.' },
  melancia: { nome: 'Watermelon Slice', tipo: 'comida', efeito: { dur: 180, regen: 1, regenFoco: 1 }, preco: 10, venda: 2, desc: 'Refreshing. Recover stamina and focus faster for 3 min.' },
  banana: { nome: 'Banana', tipo: 'comida', efeito: { dur: 240, vel: 14 }, preco: 15, venda: 3, desc: 'Quick energy: +speed for 4 min.' },
  coxinha: { nome: 'Coxinha', tipo: 'comida', efeito: { dur: 300, atr: { habilidade: 4 } }, preco: 25, venda: 6, desc: '+Skill for 5 min.' },
  pastel: { nome: 'Fair Pastel', tipo: 'comida', efeito: { dur: 300, atr: { folego: 4 }, regen: 0.8 }, preco: 25, venda: 6, desc: '+Stamina for 5 min.' },
  tapioca: { nome: 'Tapioca', tipo: 'comida', efeito: { dur: 300, atr: { inteligencia: 4 } }, preco: 25, venda: 6, desc: '+Intelligence for 5 min.' },
  sanduiche: { nome: 'Healthy Sandwich', tipo: 'comida', efeito: { dur: 300, atr: { defesa: 4 } }, preco: 25, venda: 6, desc: '+Defense for 5 min.' },
  brigadeiro: { nome: 'Brigadeiro', tipo: 'comida', efeito: { dur: 300, regenFoco: 2.5 }, preco: 20, venda: 5, desc: 'Sweet treat! Recover focus much faster for 5 min.' },
  prato_feito: { nome: 'Home-Style Plate', tipo: 'comida', efeito: { dur: 600, regen: 1.6, atr: { folego: 6, defesa: 3 } }, lvl: 8, preco: 90, venda: 20, desc: 'Rice, beans, steak and salad: +Stamina, +Defense and recovery for 10 min. Level 8.' },
  feijoada: { nome: 'Full Feijoada', tipo: 'comida', efeito: { dur: 900, regen: 2, regenFoco: 1.5, atr: { defesa: 6, habilidade: 6, inteligencia: 6, folego: 6 } }, lvl: 15, preco: 240, venda: 50, desc: 'The feast of champions: +6 to ALL attributes and recovery for 15 min. Level 15.' },
  // Materiais de refino
  retalho: { nome: 'Fabric Scrap', tipo: 'loot', venda: 5, desc: 'Upgrade material (+4 to +6). Seu Remendo uses it.' },
  couro: { nome: 'Piece of Leather', tipo: 'loot', venda: 20, desc: 'Upgrade material (+7 to +10). Dropped by opponents from the City onward.' },
  fio_ouro: { nome: 'Gold Thread', tipo: 'loot', venda: 150, desc: 'Super rare material for the +10 upgrade. Bosses drop it.' },
});
// materiais e comidas nos espólios
const LOOT_EXTRA = {
  pombo: [['pao_queijo', 0.05, 1, 1]], caramelo: [['pao_queijo', 0.08, 1, 1]], moleque: [['retalho', 0.15, 1, 1], ['banana', 0.06, 1, 1]],
  zagueiro_rua: [['retalho', 0.3, 1, 2]], tonhao: [['retalho', 1, 3, 5], ['couro', 0.3, 1, 1]],
  caranguejo: [['melancia', 0.08, 1, 1]], gaivota: [['retalho', 0.15, 1, 1]], futevoleiro: [['retalho', 0.25, 1, 2], ['tapioca', 0.05, 1, 1]], salva_vidas: [['retalho', 0.3, 1, 2], ['couro', 0.05, 1, 1]], rei_areia: [['couro', 0.8, 2, 3]],
  skatista: [['retalho', 0.3, 1, 2], ['couro', 0.06, 1, 1]], pivo: [['couro', 0.1, 1, 1], ['coxinha', 0.06, 1, 1]], ala: [['couro', 0.08, 1, 1]], goleiro_linha: [['couro', 0.12, 1, 1]], rei_quadra: [['couro', 1, 3, 4], ['fio_ouro', 0.3, 1, 1]],
  volante: [['couro', 0.15, 1, 1]], lateral: [['couro', 0.12, 1, 1], ['banana', 0.1, 1, 2]], preparador: [['couro', 0.18, 1, 2], ['prato_feito', 0.05, 1, 1]], zagueiro_sub20: [['couro', 0.2, 1, 2], ['fio_ouro', 0.01, 1, 1]], capitao_sub20: [['fio_ouro', 0.6, 1, 1], ['couro', 1, 3, 5]],
  meia_armador: [['couro', 0.2, 1, 2], ['fio_ouro', 0.015, 1, 1]], centroavante: [['couro', 0.25, 1, 2], ['fio_ouro', 0.02, 1, 1]], xerife: [['couro', 0.25, 1, 2], ['fio_ouro', 0.025, 1, 1]], arbitro: [['fio_ouro', 0.02, 1, 1], ['feijoada', 0.02, 1, 1]], paredao: [['fio_ouro', 1, 2, 3]],
};
for (const k in LOOT_EXTRA) if (MONSTROS[k]) MONSTROS[k].loot.push(...LOOT_EXTRA[k]);

// Refino: +1 até +10
const REFINO_MAX = 10;
const REFINO_CHANCE = [1, 1, 1, 1, 0.85, 0.75, 0.62, 0.5, 0.4, 0.3]; // chance de ir de r para r+1
// material raro pedido na forja (+5 em diante), pelo nível do item: [nível mínimo, material]
const MATERIAL_RARO_REFINO = [[130, 'megafone'], [110, 'ingresso'], [93, 'oculos_neon'], [80, 'lamparina'], [70, 'leque'], [60, 'escaravelho'], [40, 'cartao_vermelho'], [20, 'luva']];
function materialRaroRefino(lvl) { const f = MATERIAL_RARO_REFINO.find(([min]) => lvl >= min); return f ? f[1] : null; }
// troféu de arena pedido no +9 e no +10, pela faixa do item
const TROFEU_REFINO = [[155, 'trofeu_lendas'], [140, 'trofeu_nevasca'], [74, 'trofeu_neon'], [60, 'trofeu_piramides'], [40, 'trofeu_ondas'], [28, 'trofeu_terrao']];
function trofeuRefino(lvl) { const f = TROFEU_REFINO.find(([min]) => lvl >= min); return f ? f[1] : null; }
function custoRefino(id, r) {
  const it = ITENS[id]; const base = it.preco || (it.venda || 10) * 4;
  const mats = [];
  if (r + 1 >= 4 && r + 1 <= 6) mats.push(['retalho', r - 2]);
  if (r + 1 >= 7 && r + 1 <= 9) mats.push(['couro', r - 5]);
  if (r + 1 === 10) mats.push(['couro', 3], ['fio_ouro', 1]);
  // Item de nível 20+ (quem está começando não sofre com isso): os refinos altos são BEM difíceis,
  // pra que os itens mais fortes levem muito tempo de jogo.
  const lvl = it.lvl || 0, alvo = r + 1;
  // material RARO da região do item, do +5 em diante: 1, 2, 4, 6, 9, 12
  const raro = alvo >= 5 ? materialRaroRefino(lvl) : null;
  if (raro && ITENS[raro]) mats.push([raro, { 5: 1, 6: 2, 7: 4, 8: 6, 9: 9, 10: 12 }[alvo]]);
  // +9 e +10: troféu da arena da faixa do item (o chefão só pode ser vencido 1x por dia)
  const trofeu = alvo >= 9 ? trofeuRefino(lvl) : null;
  if (trofeu && ITENS[trofeu]) mats.push([trofeu, alvo === 10 ? 2 : 1]);
  let chance = REFINO_CHANCE[r];
  if (alvo >= 7 && lvl >= 40) chance *= lvl >= 100 ? 0.7 : 0.85;
  // tentar +8, +9 ou +10 e falhar faz o item voltar 1 nível (nunca quebra)
  const cai = alvo >= 8 && lvl >= 20;
  return { tostoes: Math.round(base * 0.3 * Math.pow(r + 1, 1.7)) + 20, mats, chance, cai };
}
function nomeItem(id, r) { return ITENS[id].nome + (r ? ` +${r}` : ''); }

// NPCs novos
NPCS.remendo = { nome: 'Seu Remendo, the Shoemaker', refino: true, ola: 'I fix, I sew, and I make any cleat good as new... and even BETTER! Bring me coins and materials and I\'ll upgrade your equipment up to +10.' };
NPCS.zuzu = { nome: 'Aunt Zuzu from the Snack Bar', ola: 'You can\'t play on an empty stomach, sweetie! A star eats well before practice.', loja: ['pao_queijo', 'melancia', 'banana', 'coxinha', 'pastel', 'tapioca', 'sanduiche', 'brigadeiro', 'prato_feito', 'feijoada'] };
APARENCIAS.remendo = { pele: 'pele-media', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-xadrez', corRoupa: '#7a5a3a', baixo: 'baixo-jeans', rosto: 'rosto-redondos', mao: 'mao-martelo', alt: 1.7 };
APARENCIAS.zuzu = { corpo: 'f', pele: 'pele-negra', cabelo: 'cabelo-coque', corCabelo: 'preto', roupa: 'roupa-camiseta', corRoupa: '#ff8a3a', baixo: 'baixo-saia', mao: 'mao-pipoca', alt: 1.7 };
for (const k of ['remendo', 'zuzu']) NPCS[k].look = Object.assign({ tipo: 'humano', corpo: 'm' }, APARENCIAS[k]);
// comidas também nas outras lojas
NPCS.bene.loja.push('tapioca', 'melancia', 'banana');
NPCS.neide.loja.push('sanduiche', 'banana', 'coxinha');
NPCS.bia.loja.push('prato_feito', 'feijoada', 'banana', 'brigadeiro');
NPCS.presidente.loja.push('feijoada', 'prato_feito');
// missões novas
MISSOES.splice(MISSOES.findIndex(q => q.id === 'q_quiz') + 1, 0,
  { id: 'q_lanche', npc: 'zuzu', titulo: 'Champion\'s Snack', lvl: 2,
    texto: 'You can\'t train on an empty stomach! Eat 3 foods (you can buy them here from me). Each food gives a bonus for a few minutes.',
    req: { comer: 3, desc: 'Eat 3 foods' }, rec: { xp: 90, itens: [['pao_queijo', 5], ['coxinha', 2]] },
    fim: 'That\'s it! Good food = strong star. Take some cheese bread for the road.' },
  { id: 'q_refino', npc: 'remendo', titulo: 'Good as New', lvl: 4,
    texto: 'Bring me some equipment and leave it with me: I\'ll upgrade it to +2. Upgrading makes the item stronger!',
    req: { refino: 2, desc: 'Upgrade equipment 2 times with Seu Remendo' }, rec: { xp: 180, itens: [['retalho', 6]] },
    fim: 'See how it turned out? From +4 on I need Fabric Scraps, and after that Leather and Gold Thread.' });

/* ---------- balanceamento: tostões no começo (Vila e Praia) ----------
   Vila e Praia são as áreas tranquilas (ninguém parte pra cima). Aqui a pessoa
   precisa juntar tostões pra comprar e FORJAR os itens antes da Cidade, onde os
   adversários são valentes. Antes: ~8 mil tostões até o nível 20, contra ~22 mil
   pra montar e refinar (+3) o conjunto da Praia. Agora rende ~3x mais. */
const BONUS_TOSTAO_INICIO = { pombo: 3, moleque: 3, caramelo: 3, zagueiro_rua: 3, tonhao: 2, futevoleiro: 3, caranguejo: 3, gaivota: 3, salva_vidas: 3, rei_areia: 2,
  // Cidade (primeira área valente): um pouco mais, pra continuar valendo mais que a Praia
  skatista: 1.6, pivo: 1.6, ala: 1.6, goleiro_linha: 1.6 };
for (const k in BONUS_TOSTAO_INICIO) { const m = MONSTROS[k]; if (m && m.ouro) m.ouro = m.ouro.map(v => Math.round(v * BONUS_TOSTAO_INICIO[k])); }
// sucatas que só caem de adversários (nenhuma loja vende: não dá pra comprar barato e revender)
const VENDA_SUCATA = { pena: 5, osso: 16, bola_murcha: 12, bola_praia: 12, concha: 28, apito_velho: 30 };
for (const k in VENDA_SUCATA) if (ITENS[k] && !ITENS[k].preco) ITENS[k].venda = VENDA_SUCATA[k];
