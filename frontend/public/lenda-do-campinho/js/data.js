/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — dados do jogo (itens, adversários, dribles,
   missões, NPCs, quiz). Tudo que é "balanceamento" mora aqui.
   ============================================================ */

// Onde ficam as peças de avatar do Educação Gamer (CORS liberado)
const ASSET_BASE = 'https://www.educacaogamer.com.br';

// Ranking online (opcional). Se quiser plugar na API do site, coloque
// a URL aqui. O jogo faz POST {nome, nivel, xp, posicao, fase, ...}
// e GET para listar o top. Com null, o ranking fica só no aparelho.
const CONFIG = {
  rankingUrl: null,
  versaoSave: 1,
};

/* ---------- Avatar (peças do site) ---------- */
const AVATAR = {
  peles: [
    { id: 'pele-clara', nome: 'Clara', cor: '#fcdccc', corF: '#fcd4c4' },
    { id: 'pele-media', nome: 'Média', cor: '#ec9c7c', corF: '#f4ac94' },
    { id: 'pele-morena', nome: 'Morena', cor: '#cc8464', corF: '#d4846c' },
    { id: 'pele-negra', nome: 'Negra', cor: '#a4644c', corF: '#ac6454' },
    { id: 'pele-retinta', nome: 'Retinta', cor: '#643c3c', corF: '#643c3c' },
  ],
  cabelos: [
    { id: 'cabelo-curto', nome: 'Curto', estilo: 'curto', cor: '#884838' },
    { id: 'cabelo-cacheado', nome: 'Cacheado', estilo: 'cacheado', cor: '#683838' },
    { id: 'cabelo-liso-longo', nome: 'Liso longo', estilo: 'longo', cor: '#282828' },
    { id: 'cabelo-coque', nome: 'Coque', estilo: 'coque', cor: '#583838' },
    { id: 'cabelo-black-power', nome: 'Black power', estilo: 'black', cor: '#484848' },
  ],
  coresCabelo: [
    { id: 'original', nome: 'Original', cor: null },
    { id: 'preto', nome: 'Preto', cor: '#2a2230' },
    { id: 'castanho', nome: 'Castanho', cor: '#7a4a2a' },
    { id: 'loiro', nome: 'Loiro', cor: '#ffb94a' },
    { id: 'grisalho', nome: 'Grisalho', cor: '#e2dfea' },
    { id: 'ruivo', nome: 'Ruivo', cor: '#e0582a' },
    { id: 'rosa', nome: 'Rosa', cor: '#ff8ccb' },
    { id: 'azul', nome: 'Azul', cor: '#4f82ff' },
    { id: 'roxo', nome: 'Roxo', cor: '#a066ff' },
    { id: 'verde', nome: 'Verde', cor: '#46c776' },
  ],
  roupas: [
    { id: 'roupa-camiseta', nome: 'Camiseta', cor: '#a868c8', cor2: '#784898' },
    { id: 'roupa-moletom', nome: 'Moletom', cor: '#5888c8', cor2: '#4070b0' },
    { id: 'roupa-xadrez', nome: 'Xadrez', cor: '#882828', cor2: '#581018' },
    { id: 'roupa-regata', nome: 'Regata', cor: '#f0f0f0', cor2: '#c8c8d8' },
  ],
  baixos: [
    { id: 'baixo-shorts', nome: 'Shorts', cor: '#5878a8' },
    { id: 'baixo-jeans', nome: 'Jeans', cor: '#587898' },
    { id: 'baixo-saia', nome: 'Saia', cor: '#d84848' },
    { id: 'baixo-moletom', nome: 'Moletom', cor: '#888898' },
  ],
  rostos: [
    { id: null, nome: 'Nada' },
    { id: 'rosto-redondos', nome: 'Óculos' },
    { id: 'rosto-escuros', nome: 'Óculos escuros' },
  ],
};

/* ---------- Fases da vida ---------- */
const FASES = [
  { nome: 'Criança', min: 1, fundo: 'fundo-quarto' },
  { nome: 'Juvenil', min: 10, fundo: 'fundo-roxo' },
  { nome: 'Sub-20', min: 25, fundo: 'fundo-estadio' },
  { nome: 'Profissional', min: 40, fundo: 'fundo-estadio' },
  { nome: 'Lenda', min: 60, fundo: 'fundo-galaxia' },
];

/* ---------- Posições (as "vocações") ---------- */
const POSICOES = {
  atacante: {
    nome: 'Atacante', desc: 'Mais dano com dribles e chutes. Fôlego equilibrado.',
    hp: 12, foco: 7, taxa: { drible: 1, chute: 1, defesa: 1.6, visao: 1.5 }, dano: 1.12, cor: '#ff6b5a',
  },
  meia: {
    nome: 'Meio-campo', desc: 'Muito foco e visão de jogo: dribles especiais e curas fortes.',
    hp: 9, foco: 15, taxa: { drible: 1.3, chute: 1.2, defesa: 1.8, visao: 0.8 }, dano: 1, cor: '#5ac8ff',
  },
  zagueiro: {
    nome: 'Zagueiro', desc: 'Muito fôlego e defesa. Aguenta a pancada de vários de uma vez.',
    hp: 17, foco: 5, taxa: { drible: 1.15, chute: 1.4, defesa: 0.8, visao: 2 }, dano: 0.95, cor: '#7ee06a',
  },
};

const SKILLS = {
  drible: { nome: 'Drible', desc: 'Dano dos ataques corpo a corpo e dribles.' },
  chute: { nome: 'Chute', desc: 'Dano dos ataques a distância e chutes.' },
  defesa: { nome: 'Defesa', desc: 'Bloqueia parte das divididas que você toma.' },
  visao: { nome: 'Visão de jogo', desc: 'Força das curas e dribles especiais. Treina gastando foco.' },
};

/* ---------- Itens ---------- */
// slot: cabeca | camisa | calcao | perna | chuteira | acessorio
// icon: {k: forma, c: cor principal, c2: detalhe}
const ITENS = {
  // --- chave / missão
  bola: { nome: 'Bola de Capotão', tipo: 'chave', desc: 'Sua primeira bola. Nunca saia de casa sem ela.', icon: { k: 'bola' } },
  bola_praia: { nome: 'Bola de Praia Roubada', tipo: 'loot', venda: 4, desc: 'As gaivotas vivem levando essas.', icon: { k: 'bola', c: '#ff5a5a', c2: '#ffe14a' } },

  // --- consumíveis
  agua: { nome: 'Garrafa de Água', tipo: 'consumivel', efeito: { hp: 60 }, preco: 10, venda: 3, desc: 'Recupera 60 de fôlego.', icon: { k: 'garrafa', c: '#7cc8ff' } },
  isotonico: { nome: 'Isotônico', tipo: 'consumivel', efeito: { foco: 50 }, preco: 15, venda: 4, desc: 'Recupera 50 de foco.', icon: { k: 'garrafa', c: '#4fd06a' } },
  acai: { nome: 'Tigela de Açaí', tipo: 'consumivel', efeito: { hp: 220 }, lvl: 14, preco: 55, venda: 12, desc: 'Recupera 220 de fôlego. Nível 14.', icon: { k: 'tigela', c: '#6a2a8a' } },
  suco_verde: { nome: 'Suco Verde', tipo: 'consumivel', efeito: { foco: 160 }, lvl: 20, preco: 70, venda: 15, desc: 'Recupera 160 de foco. Nível 20.', icon: { k: 'copo', c: '#7ad04a' } },
  vitamina: { nome: 'Vitamina de Banana', tipo: 'consumivel', efeito: { hp: 520 }, lvl: 35, preco: 160, venda: 30, desc: 'Recupera 520 de fôlego. Nível 35.', icon: { k: 'copo', c: '#f8e27a' } },
  agua_coco: { nome: 'Água de Coco Gelada', tipo: 'consumivel', efeito: { foco: 380 }, lvl: 38, preco: 170, venda: 32, desc: 'Recupera 380 de foco. Nível 38.', icon: { k: 'coco', c: '#5a9a3a' } },
  pacotinho: { nome: 'Pacotinho de Figurinhas', tipo: 'consumivel', efeito: { figurinha: 1 }, preco: 120, venda: 20, desc: 'Abra para ganhar uma figurinha aleatória do álbum.', icon: { k: 'pacote', c: '#ffcc33' } },

  // --- loot para vender
  pena: { nome: 'Pena de Pombo', tipo: 'loot', venda: 2, desc: 'Leve e inútil. Dona Cida compra.', icon: { k: 'pena', c: '#b0b0c0' } },
  bola_murcha: { nome: 'Bola Murcha', tipo: 'loot', venda: 6, desc: 'Dá pra remendar e revender.', icon: { k: 'bola', c: '#c8b890', c2: '#6a5a40' } },
  osso: { nome: 'Osso Babado', tipo: 'loot', venda: 8, desc: 'O Caramelo não quer mais.', icon: { k: 'osso' } },
  apito_velho: { nome: 'Apito Velho', tipo: 'loot', venda: 15, desc: 'Ainda apita, meio rouco.', icon: { k: 'apito', c: '#c0c0c8' } },
  concha: { nome: 'Concha Bonita', tipo: 'loot', venda: 14, desc: 'Brilha no sol.', icon: { k: 'concha' } },
  oculos_sol: { nome: 'Óculos de Sol', tipo: 'loot', venda: 30, desc: 'Estilo de praia.', icon: { k: 'oculos' } },
  roda_skate: { nome: 'Roda de Skate', tipo: 'loot', venda: 45, desc: 'Gira que é uma beleza.', icon: { k: 'roda' } },
  cone: { nome: 'Cone de Treino', tipo: 'loot', venda: 60, desc: 'Laranja e cheio de história.', icon: { k: 'cone' } },
  prancheta: { nome: 'Prancheta Tática', tipo: 'loot', venda: 110, desc: 'Cheia de setinhas.', icon: { k: 'prancheta' } },
  cronometro: { nome: 'Cronômetro', tipo: 'loot', venda: 140, desc: 'Marca até o tempo do intervalo.', icon: { k: 'relogio' } },
  cartao: { nome: 'Cartão Amarelo', tipo: 'loot', venda: 180, desc: 'Tirado do bolso de um árbitro.', icon: { k: 'cartao', c: '#ffd23f' } },
  cartao_vermelho: { nome: 'Cartão Vermelho', tipo: 'loot', venda: 420, desc: 'Raríssimo.', icon: { k: 'cartao', c: '#ff3b3b' } },
  luva: { nome: 'Luva de Goleiro', tipo: 'loot', venda: 260, desc: 'Grudenta.', icon: { k: 'luva' } },

  // --- CABEÇA
  bone: { nome: 'Boné do Campinho', tipo: 'equip', slot: 'cabeca', def: 1, lvl: 1, preco: 40, venda: 10, avatar: 'chapeu-bone', desc: 'Protege do sol da tarde.', icon: { k: 'bone', c: '#3a6ad9' } },
  faixa_suor: { nome: 'Faixa de Suor', tipo: 'equip', slot: 'cabeca', def: 1, st: { drible: 1 }, lvl: 3, preco: 90, venda: 25, avatar: 'chapeu-faixa', desc: '+1 drible.', icon: { k: 'faixa', c: '#ff5a5a' } },
  faixa_capitao: { nome: 'Faixa de Capitão', tipo: 'equip', slot: 'cabeca', def: 3, st: { hp: 30 }, lvl: 12, preco: 900, venda: 220, avatar: 'chapeu-faixa', desc: '+30 fôlego máximo.', icon: { k: 'faixa', c: '#ffd23f' } },
  headset: { nome: 'Headset de Análise', tipo: 'equip', slot: 'cabeca', def: 3, st: { visao: 2, foco: 40 }, lvl: 22, preco: 3200, venda: 700, avatar: 'chapeu-headset', desc: '+2 visão, +40 foco.', icon: { k: 'headset' } },
  louros: { nome: 'Coroa de Louros', tipo: 'equip', slot: 'cabeca', def: 5, st: { drible: 2, chute: 2 }, lvl: 32, venda: 2500, avatar: 'chapeu-louros', desc: '+2 drible, +2 chute.', icon: { k: 'louros' } },
  coroa: { nome: 'Coroa do Craque', tipo: 'equip', slot: 'cabeca', def: 8, st: { drible: 4, chute: 4, visao: 3, hp: 80 }, lvl: 50, venda: 20000, avatar: 'chapeu-coroa', raro: true, desc: 'Lendária. Só quem venceu O Paredão usa.', icon: { k: 'coroa' } },

  // --- CAMISA
  camiseta: { nome: 'Camiseta Surrada', tipo: 'equip', slot: 'camisa', def: 1, lvl: 1, preco: 20, venda: 5, desc: 'Já foi branca um dia.', icon: { k: 'camisa', c: '#e8e8e8' }, cor: null },
  camisa_vila: { nome: 'Camisa do Time da Vila', tipo: 'equip', slot: 'camisa', def: 3, lvl: 5, preco: 250, venda: 60, avatar: 'roupa-futebol', desc: 'Amarela, com o escudo costurado à mão.', icon: { k: 'camisa', c: '#f8d838', c2: '#2a8a3a' }, cor: '#f8d838', cor2: '#2a8a3a' },
  camisa_listrada: { nome: 'Camisa Listrada da Praia', tipo: 'equip', slot: 'camisa', def: 5, st: { hp: 20 }, lvl: 12, preco: 1100, venda: 260, avatar: 'roupa-futebol', desc: '+20 fôlego.', icon: { k: 'camisa', c: '#3aa0e0', c2: '#ffffff' }, cor: '#3aa0e0', cor2: '#ffffff', listras: true },
  camisa_futsal: { nome: 'Camisa de Futsal', tipo: 'equip', slot: 'camisa', def: 8, st: { vel: 8 }, lvl: 20, preco: 4200, venda: 900, avatar: 'roupa-futebol', desc: '+8 velocidade.', icon: { k: 'camisa', c: '#ff7a2a', c2: '#1a1a2a' }, cor: '#ff7a2a', cor2: '#1a1a2a' },
  camisa_ct: { nome: 'Camisa do CT', tipo: 'equip', slot: 'camisa', def: 11, st: { hp: 60 }, lvl: 30, preco: 12000, venda: 2600, avatar: 'roupa-futebol', desc: '+60 fôlego.', icon: { k: 'camisa', c: '#2a4ad9', c2: '#ffffff' }, cor: '#2a4ad9', cor2: '#ffffff' },
  camisa_pro: { nome: 'Camisa Profissional', tipo: 'equip', slot: 'camisa', def: 15, st: { hp: 90, drible: 1 }, lvl: 40, venda: 6000, avatar: 'roupa-futebol', desc: '+90 fôlego, +1 drible.', icon: { k: 'camisa', c: '#e0e0f0', c2: '#d42a2a' }, cor: '#f0f0f8', cor2: '#d42a2a', listras: true },
  camisa10: { nome: 'Camisa 10 de Ouro', tipo: 'equip', slot: 'camisa', def: 20, st: { hp: 150, drible: 5, chute: 5, visao: 2 }, lvl: 50, venda: 30000, avatar: 'roupa-camisa10-ouro', raro: true, desc: 'LENDÁRIA. A camisa que todo mundo sonha em vestir.', icon: { k: 'camisa', c: '#e8b848', c2: '#fff2a0' }, cor: '#e8b848', cor2: '#fff2a0' },

  // --- CALÇÃO
  shorts_rasgado: { nome: 'Shorts Rasgado', tipo: 'equip', slot: 'calcao', def: 1, lvl: 1, preco: 15, venda: 4, desc: 'Ventilado.', icon: { k: 'calcao', c: '#5878a8' } },
  calcao_tactel: { nome: 'Calção de Tactel', tipo: 'equip', slot: 'calcao', def: 2, lvl: 6, preco: 180, venda: 45, desc: 'Faz aquele barulhinho.', icon: { k: 'calcao', c: '#2a2a3a' }, cor: '#2a2a3a' },
  calcao_praia: { nome: 'Bermuda de Praia', tipo: 'equip', slot: 'calcao', def: 3, st: { vel: 4 }, lvl: 12, preco: 800, venda: 190, avatar: 'baixo-praia', desc: '+4 velocidade.', icon: { k: 'calcao', c: '#ff8a3a' }, cor: '#ff8a3a' },
  calcao_pro: { nome: 'Calção Profissional', tipo: 'equip', slot: 'calcao', def: 6, st: { hp: 40 }, lvl: 28, preco: 7000, venda: 1500, desc: '+40 fôlego.', icon: { k: 'calcao', c: '#ffffff' }, cor: '#f0f0f8' },
  calcao_camuflado: { nome: 'Calção Camuflado', tipo: 'equip', slot: 'calcao', def: 8, st: { defesa: 2 }, lvl: 38, venda: 4200, avatar: 'baixo-camuflada', desc: '+2 defesa.', icon: { k: 'calcao', c: '#5a6a3a' }, cor: '#5a6a3a' },

  // --- PERNAS (caneleira/meião)
  caneleira_papelao: { nome: 'Caneleira de Papelão', tipo: 'equip', slot: 'perna', def: 1, lvl: 2, preco: 30, venda: 8, desc: 'Melhor que nada.', icon: { k: 'caneleira', c: '#c8a070' }, cor: '#e8e8e8' },
  caneleira_plastico: { nome: 'Caneleira de Plástico', tipo: 'equip', slot: 'perna', def: 3, lvl: 10, preco: 600, venda: 140, desc: 'Agora sim.', icon: { k: 'caneleira', c: '#3a8ad9' }, cor: '#3a6ad9' },
  caneleira_carbono: { nome: 'Caneleira de Carbono', tipo: 'equip', slot: 'perna', def: 7, st: { defesa: 1 }, lvl: 30, preco: 9000, venda: 2000, desc: '+1 defesa.', icon: { k: 'caneleira', c: '#2a2a2a' }, cor: '#1a1a1a' },

  // --- CHUTEIRA (a "arma": atk)
  pe_descalco: { nome: 'Chinelo', tipo: 'equip', slot: 'chuteira', atk: 1, lvl: 1, preco: 5, venda: 1, desc: 'Ataque 1.', icon: { k: 'chinelo' } },
  tenis_velho: { nome: 'Tênis Velho', tipo: 'equip', slot: 'chuteira', atk: 3, lvl: 1, preco: 35, venda: 8, desc: 'Ataque 3.', icon: { k: 'chuteira', c: '#e0e0e0' }, cor: '#e0e0e0' },
  chuteira_pano: { nome: 'Chuteira de Pano', tipo: 'equip', slot: 'chuteira', atk: 5, lvl: 3, preco: 150, venda: 35, desc: 'Ataque 5.', icon: { k: 'chuteira', c: '#1a1a1a' }, cor: '#2a2a2a' },
  chuteira_couro: { nome: 'Chuteira de Couro', tipo: 'equip', slot: 'chuteira', atk: 8, lvl: 8, preco: 480, venda: 110, desc: 'Ataque 8.', icon: { k: 'chuteira', c: '#6a3a1a' }, cor: '#6a3a1a' },
  chuteira_society: { nome: 'Chuteira Society', tipo: 'equip', slot: 'chuteira', atk: 11, st: { vel: 6 }, lvl: 16, preco: 2400, venda: 560, desc: 'Ataque 11, +6 velocidade.', icon: { k: 'chuteira', c: '#2ad96a' }, cor: '#2ad96a' },
  chuteira_travas: { nome: 'Chuteira de Travas de Metal', tipo: 'equip', slot: 'chuteira', atk: 15, lvl: 26, preco: 8000, venda: 1800, desc: 'Ataque 15.', icon: { k: 'chuteira', c: '#d92a5a' }, cor: '#d92a5a' },
  chuteira_pro: { nome: 'Chuteira Profissional', tipo: 'equip', slot: 'chuteira', atk: 19, st: { vel: 6 }, lvl: 40, venda: 5000, desc: 'Ataque 19, +6 velocidade.', icon: { k: 'chuteira', c: '#ff7a1a' }, cor: '#ff7a1a' },
  chuteira_ouro: { nome: 'Chuteira de Ouro', tipo: 'equip', slot: 'chuteira', atk: 26, st: { vel: 12, chute: 3 }, lvl: 55, venda: 40000, raro: true, desc: 'LENDÁRIA. Ataque 26, +12 velocidade, +3 chute.', icon: { k: 'chuteira', c: '#f0c030' }, cor: '#f0c030' },

  // --- ACESSÓRIO
  munhequeira: { nome: 'Munhequeira', tipo: 'equip', slot: 'acessorio', st: { visao: 1 }, lvl: 1, preco: 120, venda: 30, desc: '+1 visão de jogo.', icon: { k: 'munhequeira', c: '#ff5a9a' } },
  apito: { nome: 'Apito de Capitão', tipo: 'equip', slot: 'acessorio', def: 1, st: { foco: 30 }, lvl: 10, preco: 700, venda: 160, avatar: 'pescoco-apito', desc: '+30 foco máximo.', icon: { k: 'apito', c: '#f0c030' } },
  colar_havaiano: { nome: 'Colar Havaiano', tipo: 'equip', slot: 'acessorio', st: { regen: 3 }, lvl: 14, preco: 1500, venda: 350, avatar: 'pescoco-havaiano', desc: '+3 regeneração de fôlego e foco.', icon: { k: 'colar' } },
  medalha_bronze: { nome: 'Medalha de Bronze', tipo: 'equip', slot: 'acessorio', def: 2, st: { hp: 40, foco: 20 }, lvl: 20, venda: 900, avatar: 'pescoco-medalha', desc: '+40 fôlego, +20 foco.', icon: { k: 'medalha', c: '#c87a3a' } },
  medalha_prata: { nome: 'Medalha de Prata', tipo: 'equip', slot: 'acessorio', def: 3, st: { hp: 80, foco: 50 }, lvl: 32, venda: 2800, avatar: 'pescoco-medalha', desc: '+80 fôlego, +50 foco.', icon: { k: 'medalha', c: '#c8c8d8' } },
  medalha_colecionador: { nome: 'Medalha do Colecionador', tipo: 'equip', slot: 'acessorio', def: 3, st: { drible: 3, chute: 3, visao: 3, regen: 2 }, lvl: 1, venda: 1, avatar: 'pescoco-medalha', raro: true, desc: 'Prêmio por completar o álbum. +3 em tudo.', icon: { k: 'medalha', c: '#ff5aff' } },
  medalha_ouro: { nome: 'Medalha de Ouro', tipo: 'equip', slot: 'acessorio', def: 5, st: { hp: 150, foco: 100, regen: 2 }, lvl: 45, venda: 9000, avatar: 'pescoco-medalha', raro: true, desc: '+150 fôlego, +100 foco.', icon: { k: 'medalha', c: '#f0c030' } },
};

/* ---------- Dribles (as "magias") ---------- */
// tipo: melee (adjacente), dist (à distância), cura, buff, area
const DRIBLES = {
  pedalada: { nome: 'Pedalada', tipo: 'melee', lvl: 2, foco: 10, cd: 2000, poder: 1.3, skill: 'drible', fx: 'giro', cor: '#ffd23f', desc: 'Pedaladas em cima do marcador.' },
  respiro: { nome: 'Respiro', tipo: 'cura', lvl: 4, foco: 20, cd: 1000, poder: 1, fx: 'cura', cor: '#5affb0', desc: 'Respira fundo e recupera fôlego.' },
  chute_colocado: { nome: 'Chute Colocado', tipo: 'dist', lvl: 6, foco: 15, cd: 2000, alcance: 5, poder: 1.5, skill: 'chute', fx: 'bola', cor: '#ffffff', desc: 'Chute no cantinho, à distância.' },
  arrancada: { nome: 'Arrancada', tipo: 'buff', lvl: 8, foco: 30, cd: 2000, dur: 22000, vel: 70, fx: 'vento', cor: '#9ad8ff', desc: 'Fica mais rápido por 22 segundos.' },
  chapeu: { nome: 'Chapéu', tipo: 'melee', lvl: 12, foco: 25, cd: 2000, poder: 2.1, skill: 'drible', fx: 'chapeu', cor: '#ff9a3a', desc: 'A bola passa por cima da cabeça dele.' },
  voleio: { nome: 'Voleio', tipo: 'dist', lvl: 15, foco: 35, cd: 2000, alcance: 5, poder: 2.5, skill: 'chute', fx: 'bolaforte', cor: '#ffe27a', desc: 'Pega de primeira, sem deixar cair.' },
  elastico: { nome: 'Elástico', tipo: 'melee', lvl: 20, foco: 40, cd: 2000, poder: 3.0, skill: 'drible', fx: 'elastico', cor: '#ff5ad0', desc: 'Pra lá e pra cá, e ele caiu sentado.' },
  folego_campeao: { nome: 'Fôlego de Campeão', tipo: 'cura', lvl: 22, foco: 60, cd: 1000, poder: 2.4, fx: 'curaforte', cor: '#5affb0', desc: 'Uma cura enorme.' },
  caneta: { nome: 'Caneta', tipo: 'melee', lvl: 28, foco: 50, cd: 2000, poder: 4.0, skill: 'drible', fx: 'caneta', cor: '#7affff', desc: 'A bola passa no meio das pernas.' },
  tabela: { nome: 'Tabelinha', tipo: 'area', lvl: 32, foco: 70, cd: 2000, raio: 1, poder: 2.4, skill: 'drible', fx: 'area', cor: '#b07aff', desc: 'Dribla todo mundo colado em você.' },
  bicicleta: { nome: 'Bicicleta', tipo: 'dist', lvl: 40, foco: 90, cd: 3000, alcance: 5, poder: 5.6, skill: 'chute', fx: 'explosao', cor: '#ffffff', desc: 'O golaço mais bonito do futebol.' },
  relampago: { nome: 'Pedalada Relâmpago', tipo: 'area', lvl: 55, foco: 160, cd: 3000, raio: 2, poder: 4.2, skill: 'drible', fx: 'raio', cor: '#ffe14a', desc: 'Lendário. Dribla todos num raio de 2.' },
};

/* ---------- Adversários ---------- */
// look: aparência do sprite. ranged: ataque à distância.
const MONSTROS = {
  // Zona 1 — Vila do Campinho
  pombo: {
    nome: 'Pombo Folgado', hp: 16, atk: 4, def: 0, xp: 5, vel: 170, aggro: 0, atkCd: 2200, fig: 'f_pombo',
    look: { tipo: 'pombo' }, ouro: [0, 2], loot: [['pena', 0.6, 1, 2]], falas: ['Pruuu!', 'Pru pru?'],
  },
  moleque: {
    nome: 'Moleque Fominha', hp: 32, atk: 8, def: 1, xp: 12, vel: 200, aggro: 0, atkCd: 2000, fig: 'f_fominha',
    look: { tipo: 'humano', pele: '#cc8464', cabelo: '#2a2230', estilo: 'curto', camisa: '#e04040', calcao: '#303040', meia: '#e0e0e0', chuteira: '#303030', fase: 0 },
    ouro: [1, 6], loot: [['bola_murcha', 0.25, 1, 1], ['agua', 0.1, 1, 1]], falas: ['A bola é minha!', 'Passa pra mim!', 'Só eu chuto!'],
  },
  caramelo: {
    nome: 'Cachorro Caramelo', hp: 48, atk: 12, def: 2, xp: 20, vel: 290, aggro: 5, atkCd: 1800, fig: 'f_caramelo',
    look: { tipo: 'cachorro' }, ouro: [0, 4], loot: [['osso', 0.4, 1, 1], ['bola_murcha', 0.15, 1, 1]], falas: ['Au au!', 'AU!', 'Grrr...'],
  },
  zagueiro_rua: {
    nome: 'Zagueiro da Rua', hp: 85, atk: 16, def: 4, xp: 35, vel: 190, aggro: 4, atkCd: 2000, fig: 'f_zagueiro_rua',
    look: { tipo: 'humano', pele: '#a4644c', cabelo: '#1a1a1a', estilo: 'raspado', camisa: '#404040', calcao: '#202020', meia: '#303030', chuteira: '#101010', fase: 1 },
    ouro: [3, 12], loot: [['caneleira_papelao', 0.05, 1, 1], ['faixa_suor', 0.02, 1, 1], ['agua', 0.15, 1, 1], ['apito_velho', 0.05, 1, 1]], falas: ['Aqui não passa!', 'Vai ter que me driblar!'],
  },
  tonhao: {
    nome: 'Tonhão, Capitão Rival', hp: 520, atk: 30, def: 6, xp: 450, vel: 210, aggro: 0, atkCd: 1800, chefe: true, respawn: 60000, fig: 'f_tonhao',
    look: { tipo: 'humano', pele: '#ec9c7c', cabelo: '#583020', estilo: 'moicano', camisa: '#b01818', calcao: '#ffffff', meia: '#b01818', chuteira: '#101010', fase: 1, faixa: '#ffd23f', grande: true },
    ouro: [80, 140], loot: [['camisa_vila', 0.3, 1, 1], ['chuteira_couro', 0.25, 1, 1], ['faixa_suor', 0.4, 1, 1]], falas: ['Esse campinho é MEU!', 'Volta pro berço, pirralho!'],
  },

  // Zona 2 — Praia
  caranguejo: {
    nome: 'Caranguejo Beliscão', hp: 110, atk: 22, def: 6, xp: 55, vel: 150, aggro: 3, atkCd: 2000, fig: 'f_caranguejo',
    look: { tipo: 'caranguejo' }, ouro: [4, 14], loot: [['concha', 0.3, 1, 1], ['agua', 0.1, 1, 2]], falas: ['*clac clac*'],
  },
  gaivota: {
    nome: 'Gaivota Ladra', hp: 90, atk: 20, def: 3, xp: 50, vel: 320, aggro: 5, atkCd: 1700, fig: 'f_gaivota',
    look: { tipo: 'gaivota' }, ouro: [2, 10], loot: [['bola_praia', 0.45, 1, 1], ['oculos_sol', 0.06, 1, 1]], falas: ['Qué! Qué!', 'Minha bola!'],
  },
  futevoleiro: {
    nome: 'Futevoleira', hp: 200, atk: 30, def: 8, xp: 110, vel: 220, aggro: 5, atkCd: 2200, fig: 'f_futevoleiro',
    ranged: { alcance: 4, dano: 28, cd: 2400, proj: 'bola' },
    look: { tipo: 'humano', pele: '#b87450', cabelo: '#e8c070', estilo: 'curto', camisa: null, calcao: '#ff8a3a', meia: null, chuteira: null, fase: 2 },
    ouro: [8, 24], loot: [['oculos_sol', 0.08, 1, 1], ['acai', 0.06, 1, 1], ['calcao_praia', 0.01, 1, 1]], falas: ['Sem deixar cair!', 'Pé na areia, bola no ar!'],
  },
  salva_vidas: {
    nome: 'Salva-vidas Marrento', hp: 300, atk: 38, def: 10, xp: 170, vel: 230, aggro: 5, atkCd: 2000, fig: 'f_salva',
    look: { tipo: 'humano', pele: '#cc8464', cabelo: '#3a2a1a', estilo: 'curto', camisa: '#ff3a3a', calcao: '#ff3a3a', meia: null, chuteira: null, fase: 3, bone: '#ffd23f' },
    ouro: [12, 34], loot: [['apito_velho', 0.15, 1, 1], ['acai', 0.1, 1, 1], ['camisa_listrada', 0.008, 1, 1], ['apito', 0.01, 1, 1]], falas: ['Área restrita!', 'Aqui quem manda sou eu!'],
  },
  rei_areia: {
    nome: 'Rei da Areia', hp: 2600, atk: 70, def: 14, xp: 2600, vel: 240, aggro: 2, atkCd: 1700, chefe: true, respawn: 240000, fig: 'f_rei_areia',
    ranged: { alcance: 4, dano: 55, cd: 2600, proj: 'areia' },
    look: { tipo: 'humano', pele: '#8a5434', cabelo: '#f0d080', estilo: 'longo', camisa: null, calcao: '#f0c030', meia: null, chuteira: null, fase: 3, coroa: true, grande: true },
    ouro: [300, 500], loot: [['colar_havaiano', 0.35, 1, 1], ['calcao_praia', 0.3, 1, 1], ['camisa_listrada', 0.2, 1, 1]], falas: ['Ninguém me tira dessa areia!', 'Vem, novato!'],
  },

  // Zona 3 — Cidade
  skatista: {
    nome: 'Skatista Folgada', hp: 330, atk: 45, def: 12, xp: 220, vel: 330, aggro: 5, atkCd: 1800, fig: 'f_skatista',
    look: { tipo: 'humano', pele: '#fcdccc', cabelo: '#5a3a2a', estilo: 'longo', camisa: '#2a2a2a', calcao: '#5a6a8a', meia: '#e0e0e0', chuteira: '#e03a3a', fase: 2, bone: '#e03a3a' },
    ouro: [14, 40], loot: [['roda_skate', 0.25, 1, 1], ['isotonico', 0.2, 1, 2]], falas: ['Irado!', 'Sai da frente!'],
  },
  pivo: {
    nome: 'Pivô de Futsal', hp: 460, atk: 55, def: 18, xp: 300, vel: 210, aggro: 4, atkCd: 2000, fig: 'f_pivo',
    look: { tipo: 'humano', pele: '#a4644c', cabelo: '#1a1a1a', estilo: 'raspado', camisa: '#ff7a2a', calcao: '#1a1a2a', meia: '#ff7a2a', chuteira: '#ffffff', fase: 3, numero: true },
    ouro: [20, 50], loot: [['cone', 0.12, 1, 1], ['acai', 0.12, 1, 1], ['chuteira_society', 0.005, 1, 1]], falas: ['Segura o pivô!', 'Encosta que eu giro!'],
  },
  ala: {
    nome: 'Ala Veloz', hp: 390, atk: 50, def: 14, xp: 280, vel: 320, aggro: 5, atkCd: 1700, fig: 'f_ala',
    look: { tipo: 'humano', pele: '#ec9c7c', cabelo: '#e0c050', estilo: 'curto', camisa: '#ff7a2a', calcao: '#1a1a2a', meia: '#ff7a2a', chuteira: '#2ad96a', fase: 2, numero: true },
    ouro: [18, 46], loot: [['isotonico', 0.25, 1, 2], ['cone', 0.1, 1, 1]], falas: ['Pela ponta!', 'Ninguém me alcança!'],
  },
  goleiro_linha: {
    nome: 'Goleiro-Linha', hp: 490, atk: 55, def: 16, xp: 340, vel: 220, aggro: 5, atkCd: 2200, fig: 'f_goleiro_linha',
    ranged: { alcance: 4, dano: 52, cd: 2400, proj: 'bola' },
    look: { tipo: 'humano', pele: '#cc8464', cabelo: '#2a2230', estilo: 'cacheado', camisa: '#2ad96a', calcao: '#1a1a1a', meia: '#2ad96a', chuteira: '#1a1a1a', fase: 3, luvas: true },
    ouro: [22, 56], loot: [['luva', 0.08, 1, 1], ['acai', 0.1, 1, 1]], falas: ['Sai jogando!', 'Tiro de meta!'],
  },
  rei_quadra: {
    nome: 'Rei da Quadra', hp: 7500, atk: 120, def: 22, xp: 9000, vel: 250, aggro: 2, atkCd: 1600, chefe: true, respawn: 300000, fig: 'f_rei_quadra',
    look: { tipo: 'humano', pele: '#643c3c', cabelo: '#1a1a1a', estilo: 'black', camisa: '#ffd23f', calcao: '#1a1a2a', meia: '#ffd23f', chuteira: '#ffd23f', fase: 3, coroa: true, grande: true, numero: true },
    ouro: [900, 1400], loot: [['headset', 0.3, 1, 1], ['camisa_futsal', 0.35, 1, 1], ['medalha_bronze', 0.5, 1, 1]], falas: ['Na minha quadra, eu sou o rei!', 'Olé! Olé!'],
  },

  // Zona 4 — CT das Categorias de Base
  volante: {
    nome: 'Volante Carrinho', hp: 720, atk: 75, def: 25, xp: 520, vel: 230, aggro: 5, atkCd: 2000, fig: 'f_volante',
    look: { tipo: 'humano', pele: '#fcdccc', cabelo: '#3a2a1a', estilo: 'curto', camisa: '#2a4ad9', calcao: '#ffffff', meia: '#2a4ad9', chuteira: '#101010', fase: 3, numero: true },
    ouro: [30, 80], loot: [['prancheta', 0.1, 1, 1], ['suco_verde', 0.12, 1, 1], ['calcao_pro', 0.005, 1, 1]], falas: ['CARRINHO!', 'Falta tática!'],
  },
  lateral: {
    nome: 'Lateral Maratonista', hp: 640, atk: 70, def: 20, xp: 480, vel: 340, aggro: 6, atkCd: 1700, fig: 'f_lateral',
    look: { tipo: 'humano', pele: '#a4644c', cabelo: '#1a1a1a', estilo: 'cacheado', camisa: '#2a4ad9', calcao: '#ffffff', meia: '#2a4ad9', chuteira: '#ff7a1a', fase: 3, numero: true },
    ouro: [28, 74], loot: [['cronometro', 0.08, 1, 1], ['suco_verde', 0.15, 1, 1]], falas: ['Sobe e desce!', 'Nunca canso!'],
  },
  preparador: {
    nome: 'Preparador Físico', hp: 920, atk: 85, def: 24, xp: 700, vel: 240, aggro: 5, atkCd: 2000, fig: 'f_preparador',
    ranged: { alcance: 4, dano: 70, cd: 2500, proj: 'cone' },
    look: { tipo: 'humano', pele: '#ec9c7c', cabelo: '#9a9a9a', estilo: 'raspado', camisa: '#e0e0e0', calcao: '#2a2a3a', meia: '#e0e0e0', chuteira: '#2a2a2a', fase: 4, apito: true },
    ouro: [40, 100], loot: [['cronometro', 0.15, 1, 1], ['cone', 0.2, 1, 1], ['vitamina', 0.1, 1, 1]], falas: ['Mais dez voltas!', 'Tá cansado? Então corre!'],
  },
  zagueiro_sub20: {
    nome: 'Zagueiro Sub-20', hp: 1150, atk: 95, def: 35, xp: 900, vel: 220, aggro: 5, atkCd: 2000, fig: 'f_zagueiro_sub20',
    look: { tipo: 'humano', pele: '#643c3c', cabelo: '#1a1a1a', estilo: 'black', camisa: '#2a4ad9', calcao: '#ffffff', meia: '#2a4ad9', chuteira: '#101010', fase: 3, numero: true, grande: true },
    ouro: [45, 110], loot: [['prancheta', 0.12, 1, 1], ['vitamina', 0.1, 1, 1], ['caneleira_carbono', 0.004, 1, 1], ['medalha_prata', 0.003, 1, 1]], falas: ['Aqui é só no corpo!', 'Passa a bola ou passa você.'],
  },
  capitao_sub20: {
    nome: 'Capitão da Seleção Sub-20', hp: 17000, atk: 170, def: 38, xp: 22000, vel: 260, aggro: 2, atkCd: 1600, chefe: true, respawn: 360000, fig: 'f_capitao',
    ranged: { alcance: 4, dano: 120, cd: 3000, proj: 'bola' },
    look: { tipo: 'humano', pele: '#cc8464', cabelo: '#1a1a1a', estilo: 'moicano', camisa: '#f8d838', calcao: '#2a4ad9', meia: '#ffffff', chuteira: '#2ad96a', fase: 3, faixa: '#ffffff', grande: true, numero: true },
    ouro: [2500, 3500], loot: [['louros', 0.35, 1, 1], ['medalha_prata', 0.5, 1, 1], ['calcao_camuflado', 0.3, 1, 1]], falas: ['Isso aqui é Seleção!', 'Mostra teu futebol!'],
  },

  // Zona 5 — Estádio
  meia_armador: {
    nome: 'Meia Armadora', hp: 1350, atk: 110, def: 32, xp: 1100, vel: 250, aggro: 6, atkCd: 2000, fig: 'f_meia',
    ranged: { alcance: 5, dano: 105, cd: 2400, proj: 'bola' },
    look: { tipo: 'humano', pele: '#ec9c7c', cabelo: '#3a2a1a', estilo: 'longo', camisa: '#d42a2a', calcao: '#101010', meia: '#d42a2a', chuteira: '#ffffff', fase: 3, numero: true },
    ouro: [60, 150], loot: [['prancheta', 0.2, 1, 1], ['agua_coco', 0.1, 1, 1], ['chuteira_pro', 0.003, 1, 1]], falas: ['Lançamento!', 'Enxerguei o passe!'],
  },
  centroavante: {
    nome: 'Centroavante Tanque', hp: 1750, atk: 130, def: 40, xp: 1400, vel: 230, aggro: 5, atkCd: 2000, fig: 'f_centroavante',
    look: { tipo: 'humano', pele: '#a4644c', cabelo: '#1a1a1a', estilo: 'raspado', camisa: '#d42a2a', calcao: '#101010', meia: '#d42a2a', chuteira: '#f0c030', fase: 4, numero: true, grande: true },
    ouro: [70, 170], loot: [['vitamina', 0.15, 1, 1], ['camisa_pro', 0.004, 1, 1], ['medalha_ouro', 0.001, 1, 1]], falas: ['Área é minha casa!', 'Trombada!'],
  },
  xerife: {
    nome: 'Zagueiro Xerife', hp: 2150, atk: 140, def: 55, xp: 1800, vel: 220, aggro: 5, atkCd: 2000, fig: 'f_xerife',
    look: { tipo: 'humano', pele: '#fcdccc', cabelo: '#c0c0c0', estilo: 'curto', camisa: '#d42a2a', calcao: '#101010', meia: '#d42a2a', chuteira: '#101010', fase: 4, numero: true, grande: true, faixa: '#ffd23f' },
    ouro: [80, 190], loot: [['vitamina', 0.2, 1, 1], ['chuteira_pro', 0.004, 1, 1], ['calcao_camuflado', 0.005, 1, 1]], falas: ['Na minha área, não!', 'Vai ter que passar por cima!'],
  },
  arbitro: {
    nome: 'Árbitro Rigoroso', hp: 1500, atk: 120, def: 30, xp: 1500, vel: 260, aggro: 6, atkCd: 2000, fig: 'f_arbitro',
    ranged: { alcance: 5, dano: 115, cd: 2200, proj: 'cartao' },
    look: { tipo: 'humano', pele: '#ec9c7c', cabelo: '#1a1a1a', estilo: 'raspado', camisa: '#1a1a1a', calcao: '#1a1a1a', meia: '#1a1a1a', chuteira: '#101010', fase: 4, apito: true },
    ouro: [70, 170], loot: [['cartao', 0.25, 1, 1], ['cartao_vermelho', 0.04, 1, 1], ['agua_coco', 0.12, 1, 1]], falas: ['FALTA!', 'Amarelo pra você!', 'Reclamou? Vermelho!'],
  },
  paredao: {
    nome: 'O Paredão, Goleiro Lendário', hp: 48000, atk: 230, def: 60, xp: 60000, vel: 240, aggro: 2, atkCd: 1500, chefe: true, respawn: 600000, fig: 'f_paredao',
    ranged: { alcance: 5, dano: 190, cd: 2600, proj: 'bolaforte' },
    look: { tipo: 'humano', pele: '#643c3c', cabelo: '#1a1a1a', estilo: 'black', camisa: '#7a2ad9', calcao: '#1a1a1a', meia: '#7a2ad9', chuteira: '#f0c030', fase: 4, luvas: true, grande: true, coroa: true },
    ouro: [9000, 12000], loot: [['coroa', 0.25, 1, 1], ['chuteira_ouro', 0.15, 1, 1], ['medalha_ouro', 0.4, 1, 1]], falas: ['Ninguém faz gol em mim!', 'Tenta, se for capaz!'],
  },

  // Bonecos de treino (não atacam, não morrem de verdade)
  boneco: {
    nome: 'Boneco de Treino', hp: 999999, atk: 0, def: 0, xp: 0, vel: 0, aggro: 0, atkCd: 99999, treino: true,
    look: { tipo: 'boneco' }, ouro: [0, 0], loot: [], falas: [],
  },
};

/* ---------- Álbum de figurinhas ---------- */
const FIGURINHAS = [
  { id: 'f_pombo', nome: 'Pombo Folgado', cor: '#b0b0c0' },
  { id: 'f_fominha', nome: 'Moleque Fominha', cor: '#e04040' },
  { id: 'f_caramelo', nome: 'Caramelo', cor: '#d08a3a' },
  { id: 'f_zagueiro_rua', nome: 'Zagueiro da Rua', cor: '#404040' },
  { id: 'f_tonhao', nome: 'Tonhão', cor: '#b01818' },
  { id: 'f_caranguejo', nome: 'Beliscão', cor: '#e0503a' },
  { id: 'f_gaivota', nome: 'Gaivota Ladra', cor: '#e8e8f0' },
  { id: 'f_futevoleiro', nome: 'Futevoleira', cor: '#ff8a3a' },
  { id: 'f_salva', nome: 'Salva-vidas', cor: '#ff3a3a' },
  { id: 'f_rei_areia', nome: 'Rei da Areia', cor: '#f0c030' },
  { id: 'f_skatista', nome: 'Skatista', cor: '#2a2a2a' },
  { id: 'f_pivo', nome: 'Pivô', cor: '#ff7a2a' },
  { id: 'f_ala', nome: 'Ala Veloz', cor: '#ffa05a' },
  { id: 'f_goleiro_linha', nome: 'Goleiro-Linha', cor: '#2ad96a' },
  { id: 'f_rei_quadra', nome: 'Rei da Quadra', cor: '#ffd23f' },
  { id: 'f_volante', nome: 'Volante', cor: '#2a4ad9' },
  { id: 'f_lateral', nome: 'Lateral', cor: '#4a6af9' },
  { id: 'f_preparador', nome: 'Preparador', cor: '#e0e0e0' },
  { id: 'f_zagueiro_sub20', nome: 'Zagueiro Sub-20', cor: '#1a3ab9' },
  { id: 'f_capitao', nome: 'Capitão Sub-20', cor: '#f8d838' },
  { id: 'f_meia', nome: 'Meia Armadora', cor: '#d42a2a' },
  { id: 'f_centroavante', nome: 'Centroavante', cor: '#b41a1a' },
  { id: 'f_xerife', nome: 'Xerife', cor: '#8a1010' },
  { id: 'f_arbitro', nome: 'Árbitro', cor: '#1a1a1a' },
  { id: 'f_paredao', nome: 'O Paredão', cor: '#7a2ad9' },
  { id: 'f_ze', nome: 'Seu Zé (1978)', cor: '#6a8a3a' },
  { id: 'f_tata', nome: 'Mestre Tatá', cor: '#3aa0e0' },
  { id: 'f_ginga', nome: 'Mestre Ginga', cor: '#ff5ad0' },
  { id: 'f_dada', nome: 'Seu Dadá', cor: '#f0c030' },
  { id: 'f_mascote', nome: 'Mascote EG', cor: '#7a4aff' },
];

/* ---------- Missões ---------- */
// req: kill {m, n} | item {id, n} | flag | gols n | quiz n | prof n | nivel
const MISSOES = [
  // ------ Vila do Campinho
  { id: 'q_bola', npc: 'mae', titulo: 'Minha primeira bola', lvl: 1,
    texto: 'Filho(a), sua bola de capotão ficou no baú do quintal, do lado direito de casa. Vai lá buscar!',
    req: { flag: 'pegou_bola', desc: 'Pegue a bola no baú do quintal' },
    rec: { xp: 25, ouro: 10, itens: [['agua', 3]] }, fim: 'Isso! Agora vai lá no campinho falar com o Seu Zé. Ele treina a molecada.' },
  { id: 'q_pombos', npc: 'ze', titulo: 'Aquecimento', lvl: 1, pre: 'q_bola',
    texto: 'Então você quer jogar bola? Primeiro aquece. Esses pombos folgados vivem sentados no campinho. Dribla 6 deles!',
    req: { kill: 'pombo', n: 6 }, rec: { xp: 60, ouro: 20, drible: 'pedalada' },
    fim: 'Boa! Vou te ensinar a PEDALADA. Use no hotbar (tecla 1) quando estiver colado num adversário.' },
  { id: 'q_moleques', npc: 'ze', titulo: 'Os Fominhas', lvl: 3, pre: 'q_pombos',
    texto: 'Tem uns moleques fominhas que não passam a bola pra ninguém. Mostra pra 10 deles como se joga!',
    req: { kill: 'moleque', n: 10 }, rec: { xp: 160, ouro: 40, itens: [['chuteira_pano', 1]] },
    fim: 'Ganhou uma chuteira de pano! Equipe ela na mochila.' },
  { id: 'q_penaltis', npc: 'ze', titulo: 'Treino de pênalti', lvl: 4, pre: 'q_moleques',
    texto: 'Craque de verdade não treme no pênalti. Vai na marca do pênalti do campinho e faz 5 gols.',
    req: { gols: 5, desc: 'Marque 5 gols na marca do pênalti' }, rec: { xp: 140, drible: 'chute_colocado' },
    fim: 'Que batida! Aprendeu o CHUTE COLOCADO: ataca de longe.' },
  { id: 'q_escola', npc: 'lucia', titulo: 'Craque na escola', lvl: 1,
    texto: 'Jogador bom também é bom aluno! Responda 5 perguntas certas comigo e te ensino a respirar como atleta.',
    req: { prof: 5, desc: 'Acerte 5 perguntas da Professora Lúcia' }, rec: { xp: 150, drible: 'respiro', itens: [['munhequeira', 1]] },
    fim: 'Parabéns! Aprendeu o RESPIRO, que recupera seu fôlego. E leve essa munhequeira.' },
  { id: 'q_quiz', npc: 'juca', titulo: 'Sabe tudo de bola?', lvl: 2,
    texto: 'Quem manja de futebol ganha figurinha! Acerte 8 perguntas do meu quiz.',
    req: { quiz: 8, desc: 'Acerte 8 perguntas no quiz do Seu Juca' }, rec: { xp: 250, itens: [['pacotinho', 2]] },
    fim: 'Toma dois pacotinhos! Complete o álbum e ganhe um prêmio especial.' },
  { id: 'q_caramelo', npc: 'ze', titulo: 'Caramelo fujão', lvl: 5, pre: 'q_penaltis',
    texto: 'Os caramelos do mato vivem roubando nossas bolas. Dribla 8 deles, com carinho!',
    req: { kill: 'caramelo', n: 8 }, rec: { xp: 320, ouro: 60, itens: [['faixa_suor', 1]] },
    fim: 'Eles só queriam brincar... Toma essa faixa!' },
  { id: 'q_zagueiros', npc: 'ze', titulo: 'A muralha da rua', lvl: 7, pre: 'q_caramelo',
    texto: 'Os zagueiros da rua lá do mato leste batem mais que jogam. Passa por 10 deles.',
    req: { kill: 'zagueiro_rua', n: 10 }, rec: { xp: 650, ouro: 80, itens: [['camisa_vila', 1]] },
    fim: 'Você merece a camisa do Time da Vila!' },
  { id: 'q_tonhao', npc: 'ze', titulo: 'O desafio do capitão', lvl: 8, pre: 'q_zagueiros',
    texto: 'Chegou a hora. O TONHÃO, capitão do time rival, tomou o lado leste do campinho. Vence ele e você vai longe!',
    req: { kill: 'tonhao', n: 1 }, rec: { xp: 1100, ouro: 150, drible: 'arrancada', flag: 'libera_praia' },
    fim: 'Você venceu o Tonhão! Aprendeu a ARRANCADA. A estrada pra PRAIA (leste) está liberada. No nível 10, volte aqui pra peneira!' },
  { id: 'q_peneira', npc: 'ze', titulo: 'A peneira', lvl: 10, pre: 'q_tonhao',
    texto: 'Tá na hora da peneira! Escolha sua posição. Ela muda como você evolui, então pense bem.',
    req: { flag: 'escolheu_posicao', desc: 'Escolha sua posição com o Seu Zé' }, rec: { xp: 400, itens: [['apito', 1]] },
    fim: 'Agora você é JUVENIL! O mundo é seu.' },

  // ------ Praia
  { id: 'p_caranguejos', npc: 'tata', titulo: 'Pé na areia', lvl: 10,
    texto: 'Areia é outro esporte, parceiro. Aprende a se mexer driblando 12 caranguejos beliscões.',
    req: { kill: 'caranguejo', n: 12 }, rec: { xp: 900, ouro: 120, drible: 'chapeu' },
    fim: 'Te ensinei o CHAPÉU (nível 12). A bola passa por cima e o marcador fica olhando pro céu!' },
  { id: 'p_gaivotas', npc: 'marinho', titulo: 'Gaivotas ladras', lvl: 11,
    texto: 'As gaivotas roubaram as bolas das crianças! Me traz 8 bolas de praia roubadas.',
    req: { item: 'bola_praia', n: 8 }, rec: { xp: 1300, ouro: 150, itens: [['camisa_listrada', 1]] },
    fim: 'As crianças agradecem! Fica com essa camisa listrada.' },
  { id: 'p_futevolei', npc: 'tata', titulo: 'Rei do futevôlei', lvl: 13, pre: 'p_caranguejos',
    texto: 'Agora é futevôlei. Vence 15 futevoleiros sem deixar a bola cair!',
    req: { kill: 'futevoleiro', n: 15 }, rec: { xp: 2200, ouro: 200, drible: 'voleio' },
    fim: 'Aprendeu o VOLEIO (nível 15): chute forte à distância.' },
  { id: 'p_salva', npc: 'marinho', titulo: 'Salva-vidas marrentos', lvl: 15, pre: 'p_gaivotas',
    texto: 'Uns salva-vidas se acham donos da praia. Coloca 12 deles no lugar.',
    req: { kill: 'salva_vidas', n: 12 }, rec: { xp: 3200, ouro: 260, itens: [['caneleira_plastico', 1]] },
    fim: 'Praia em paz de novo. Toma essa caneleira!' },
  { id: 'p_rei', npc: 'tata', titulo: 'O Rei da Areia', lvl: 17, pre: 'p_futevolei',
    texto: 'O REI DA AREIA mora no fim da praia, depois dos coqueiros ao sul. Ele nunca perdeu. Até hoje.',
    req: { kill: 'rei_areia', n: 1 }, rec: { xp: 6500, ouro: 500, flag: 'libera_cidade' },
    fim: 'LENDÁRIO! A estrada para a CIDADE (norte da praia) está aberta.' },

  // ------ Cidade
  { id: 'c_skate', npc: 'ginga', titulo: 'Rolê no skate park', lvl: 18,
    texto: 'Na cidade o jogo é rápido. Os skatistas folgados tão atrapalhando a quadra. Dribla 15 deles.',
    req: { kill: 'skatista', n: 15 }, rec: { xp: 5000, ouro: 400, drible: 'elastico' },
    fim: 'Aprendeu o ELÁSTICO (nível 20)! Pra lá, pra cá... e passou.' },
  { id: 'c_pivos', npc: 'ginga', titulo: 'Domínio da quadra', lvl: 20, pre: 'c_skate',
    texto: 'Pivô é forte, de costas pro gol. Vence 15 pivôs nas quadras.',
    req: { kill: 'pivo', n: 15 }, rec: { xp: 7000, ouro: 500, itens: [['chuteira_society', 1]] },
    fim: 'Ganhou uma chuteira society!' },
  { id: 'c_alas', npc: 'neide', titulo: 'Ninguém segura os alas', lvl: 21,
    texto: 'Sou a Dona Neide, da loja. Os alas velozes passam correndo e derrubam minhas prateleiras! Pega 20 deles.',
    req: { kill: 'ala', n: 20 }, rec: { xp: 8000, ouro: 600, drible: 'folego_campeao' },
    fim: 'Meu falecido marido era preparador... ele me ensinou o FÔLEGO DE CAMPEÃO. Agora é seu (nível 22).' },
  { id: 'c_goleiros', npc: 'ginga', titulo: 'Goleiro também joga', lvl: 22, pre: 'c_pivos',
    texto: 'Goleiro-linha sai jogando e chuta de longe. Vence 15 deles.',
    req: { kill: 'goleiro_linha', n: 15 }, rec: { xp: 10000, ouro: 700, itens: [['camisa_futsal', 1]] },
    fim: 'Toma a camisa de futsal oficial!' },
  { id: 'c_rei', npc: 'ginga', titulo: 'O Rei da Quadra', lvl: 24, pre: 'c_goleiros',
    texto: 'O REI DA QUADRA fica na quadra coberta, no nordeste. Se você vencer ele, te indico pro CT.',
    req: { kill: 'rei_quadra', n: 1 }, rec: { xp: 20000, ouro: 1200, flag: 'libera_ct' },
    fim: 'Você é o novo Rei da Quadra! O CT DAS CATEGORIAS DE BASE (leste) te espera.' },

  // ------ CT
  { id: 't_volantes', npc: 'aurelio', titulo: 'Marcação cerrada', lvl: 26,
    texto: 'Aqui no CT é profissional. Primeira lição: passa por 20 volantes carrinho.',
    req: { kill: 'volante', n: 20 }, rec: { xp: 18000, ouro: 1000, drible: 'caneta' },
    fim: 'Aprendeu a CANETA (nível 28). O drible mais humilhante do futebol.' },
  { id: 't_laterais', npc: 'aurelio', titulo: 'Sobe e desce', lvl: 28, pre: 't_volantes',
    texto: 'Os laterais não cansam nunca. Vence 20 deles.',
    req: { kill: 'lateral', n: 20 }, rec: { xp: 20000, ouro: 1100, itens: [['chuteira_travas', 1]] },
    fim: 'Chuteira de travas de metal pra você!' },
  { id: 't_preparadores', npc: 'bia', titulo: 'Resistência total', lvl: 30,
    texto: 'Sou a nutricionista Bia. Os preparadores físicos tão exagerando no treino! Vence 15 deles.',
    req: { kill: 'preparador', n: 15 }, rec: { xp: 25000, ouro: 1300, drible: 'tabela', itens: [['suco_verde', 10]] },
    fim: 'Aprendeu a TABELINHA (nível 32): dribla todos que estão colados em você!' },
  { id: 't_zagueiros', npc: 'aurelio', titulo: 'A zaga da Seleção', lvl: 33, pre: 't_laterais',
    texto: 'Os zagueiros sub-20 são a melhor defesa do país. Passa por 20.',
    req: { kill: 'zagueiro_sub20', n: 20 }, rec: { xp: 30000, ouro: 1600, itens: [['camisa_ct', 1]] },
    fim: 'Camisa do CT! Você está quase lá.' },
  { id: 't_capitao', npc: 'aurelio', titulo: 'Capitão da Seleção', lvl: 37, pre: 't_zagueiros',
    texto: 'O CAPITÃO DA SELEÇÃO SUB-20 treina no campo principal, ao norte. Vença-o e o estádio é seu.',
    req: { kill: 'capitao_sub20', n: 1 }, rec: { xp: 60000, ouro: 3000, flag: 'libera_estadio' },
    fim: 'É PROFISSIONAL! O ESTÁDIO (norte do CT) abriu as portas.' },

  // ------ Estádio
  { id: 'e_meias', npc: 'dada', titulo: 'O cérebro do time', lvl: 40,
    texto: 'Eu sou o Dadá, joguei aqui 20 anos. Vence 25 meias armadores e te ensino meu golaço.',
    req: { kill: 'meia_armador', n: 25 }, rec: { xp: 60000, ouro: 3000, drible: 'bicicleta' },
    fim: 'BICICLETA! O golaço mais bonito do mundo agora é seu.' },
  { id: 'e_centroavantes', npc: 'presidente', titulo: 'Contratação', lvl: 42,
    texto: 'Sou o presidente do clube. Quer um contrato? Vence 25 centroavantes tanque.',
    req: { kill: 'centroavante', n: 25 }, rec: { xp: 80000, ouro: 4000, itens: [['camisa_pro', 1]] },
    fim: 'Contrato assinado! Veste a camisa profissional.' },
  { id: 'e_xerifes', npc: 'dada', titulo: 'Xerifes da área', lvl: 44, pre: 'e_meias',
    texto: 'Os xerifes da zaga não deixam ninguém entrar na área. Passa por 25.',
    req: { kill: 'xerife', n: 25 }, rec: { xp: 100000, ouro: 5000, itens: [['chuteira_pro', 1]] },
    fim: 'Chuteira profissional pra você!' },
  { id: 'e_arbitros', npc: 'presidente', titulo: 'Sem roubalheira', lvl: 45, pre: 'e_centroavantes',
    texto: 'Tem árbitro distribuindo cartão pra todo lado. Vence 20 deles no jogo limpo.',
    req: { kill: 'arbitro', n: 20 }, rec: { xp: 100000, ouro: 5000, itens: [['caneleira_carbono', 1]] },
    fim: 'Jogo limpo! Caneleira de carbono pra você.' },
  { id: 'e_paredao', npc: 'dada', titulo: 'O Paredão', lvl: 50, pre: 'e_xerifes',
    texto: 'Ninguém nunca fez gol no PAREDÃO, o goleiro lendário que guarda o gol oeste do estádio. Ninguém... até agora?',
    req: { kill: 'paredao', n: 1 }, rec: { xp: 250000, ouro: 12000, drible: 'relampago', itens: [['camisa10', 1]], flag: 'craque' },
    fim: 'GOOOOL! Você é o CRAQUE! Toma a CAMISA 10 DE OURO e a PEDALADA RELÂMPAGO (nível 55). Agora... rumo à Lenda (nível 60)!' },
];

/* ---------- NPCs ---------- */
const NPCS = {
  mae: { nome: 'Mãe', look: { tipo: 'humano', pele: '#cc8464', cabelo: '#2a1a1a', estilo: 'coque', camisa: '#5ac878', calcao: '#3a5aa0', meia: null, chuteira: '#6a3a2a', fase: 4, fem: true },
    ola: 'Oi, meu amor! Cuidado lá fora, viu? Se cansar demais, volta pra casa que eu cuido de você.', cura: true },
  ze: { nome: 'Seu Zé', look: { tipo: 'humano', pele: '#ec9c7c', cabelo: '#d0d0d0', estilo: 'raspado', camisa: '#2a8a3a', calcao: '#1a1a1a', meia: '#2a8a3a', chuteira: '#1a1a1a', fase: 4, apito: true, bone: '#2a8a3a' },
    ola: 'Opa! Eu treino a molecada do campinho há 40 anos. Joguei muito, sabia?', professor: ['pedalada', 'chute_colocado', 'arrancada'], posicao: true },
  lucia: { nome: 'Professora Lúcia', look: { tipo: 'humano', pele: '#a4644c', cabelo: '#1a1a1a', estilo: 'black', camisa: '#ff8ccb', calcao: '#3a3a5a', meia: null, chuteira: '#3a2a2a', fase: 4, fem: true, oculos: true },
    ola: 'Bem-vindo(a) à escola! Aqui se aprende matemática COM futebol.', prof: true, professor: ['respiro'] },
  cida: { nome: 'Dona Cida', look: { tipo: 'humano', pele: '#fcdccc', cabelo: '#a0a0a0', estilo: 'coque', camisa: '#d84848', calcao: '#4a3a5a', meia: null, chuteira: '#3a2a2a', fase: 4, fem: true },
    ola: 'Bazar da Cida! Tem de tudo e compro suas tralhas também.', loja: ['agua', 'isotonico', 'tenis_velho', 'bone', 'caneleira_papelao', 'shorts_rasgado', 'camiseta', 'calcao_tactel', 'chuteira_couro', 'camisa_vila', 'munhequeira'] },
  juca: { nome: 'Seu Juca da Banca', look: { tipo: 'humano', pele: '#cc8464', cabelo: '#3a2a1a', estilo: 'curto', camisa: '#f0f0f0', calcao: '#5a4a3a', meia: null, chuteira: '#3a2a2a', fase: 4, oculos: true },
    ola: 'Jornal, revista e FIGURINHA! Topa um quiz de futebol?', quiz: true, loja: ['pacotinho'] },
  motorista: { nome: 'Motorista Valdir', look: { tipo: 'humano', pele: '#a4644c', cabelo: '#1a1a1a', estilo: 'curto', camisa: '#3a6ad9', calcao: '#2a2a3a', meia: null, chuteira: '#1a1a1a', fase: 4, bone: '#3a6ad9' },
    ola: 'Ônibus circular! Levo você pra qualquer lugar que você já conhece.', onibus: true },
  quadro: { nome: 'Quadro de Desafios', quadro: true, ola: 'Desafios repetíveis: derrote adversários e ganhe XP e tostões extras.' },

  tata: { nome: 'Mestre Tatá', look: { tipo: 'humano', pele: '#8a5434', cabelo: '#f0f0f0', estilo: 'raspado', camisa: null, calcao: '#3aa0e0', meia: null, chuteira: null, fase: 4, bone: '#ffffff' },
    ola: 'Salve! Joguei futevôlei nessa praia a vida inteira.', professor: ['chapeu', 'voleio'] },
  marinho: { nome: 'Chefe Marinho', look: { tipo: 'humano', pele: '#ec9c7c', cabelo: '#3a2a1a', estilo: 'curto', camisa: '#ffd23f', calcao: '#ff3a3a', meia: null, chuteira: null, fase: 4, apito: true },
    ola: 'Chefe dos salva-vidas. Os bons, tá?', cura: true },
  bene: { nome: 'Quiosque do Bené', look: { tipo: 'humano', pele: '#cc8464', cabelo: '#1a1a1a', estilo: 'cacheado', camisa: '#ff8a3a', calcao: '#2a8a3a', meia: null, chuteira: null, fase: 4 },
    ola: 'Açaí, água de coco e roupa de praia!', loja: ['agua', 'isotonico', 'acai', 'calcao_praia', 'camisa_listrada', 'caneleira_plastico', 'faixa_capitao', 'colar_havaiano', 'apito'] },

  rodrigues: { nome: 'Empresário Rodrigues', look: { tipo: 'humano', pele: '#cc8464', cabelo: '#1a1a1a', estilo: 'curto', camisa: '#1a1a2a', calcao: '#1a1a2a', meia: null, chuteira: '#101010', fase: 4, gravata: true, oculos: true },
    ola: 'Rodrigues, empresário de craques. Quando você for adulto(a) (nível 25), eu te ajudo a fundar seu próprio clube!', empresario: true },
  ginga: { nome: 'Mestre Ginga', look: { tipo: 'humano', pele: '#643c3c', cabelo: '#1a1a1a', estilo: 'black', camisa: '#ff5ad0', calcao: '#1a1a2a', meia: '#ff5ad0', chuteira: '#ffffff', fase: 4 },
    ola: 'Futsal é arte, meu jovem. Espaço curto, ideia rápida.', professor: ['elastico'] },
  neide: { nome: 'Dona Neide', look: { tipo: 'humano', pele: '#fcdccc', cabelo: '#ffb94a', estilo: 'longo', camisa: '#2a4ad9', calcao: '#1a1a2a', meia: null, chuteira: '#2a2a2a', fase: 4, fem: true, oculos: true },
    ola: 'Loja Esportiva da Neide. Só material de primeira!', loja: ['agua', 'isotonico', 'acai', 'suco_verde', 'chuteira_society', 'camisa_futsal', 'headset', 'faixa_capitao', 'colar_havaiano'], professor: ['folego_campeao'] },

  aurelio: { nome: 'Professor Aurélio', look: { tipo: 'humano', pele: '#fcdccc', cabelo: '#8a8a8a', estilo: 'curto', camisa: '#1a1a3a', calcao: '#1a1a3a', meia: '#1a1a3a', chuteira: '#1a1a1a', fase: 4, oculos: true },
    ola: 'Bem-vindo ao CT. Aqui a gente forma craque.', professor: ['caneta'] },
  bia: { nome: 'Nutricionista Bia', look: { tipo: 'humano', pele: '#a4644c', cabelo: '#3a1a1a', estilo: 'longo', camisa: '#ffffff', calcao: '#5ac878', meia: null, chuteira: '#ffffff', fase: 4, fem: true },
    ola: 'Atleta come bem! Tenho sucos e vitaminas.', loja: ['agua', 'isotonico', 'acai', 'suco_verde', 'vitamina', 'agua_coco', 'calcao_pro', 'camisa_ct', 'chuteira_travas', 'caneleira_carbono'], professor: ['tabela'], cura: true },

  dada: { nome: 'Seu Dadá', look: { tipo: 'humano', pele: '#643c3c', cabelo: '#e0e0e0', estilo: 'black', camisa: '#f0c030', calcao: '#1a1a1a', meia: '#f0c030', chuteira: '#1a1a1a', fase: 4 },
    ola: 'Hehe, joguei 20 anos nesse estádio. 312 gols!', professor: ['bicicleta', 'relampago'] },
  presidente: { nome: 'Presidente Almeida', look: { tipo: 'humano', pele: '#fcdccc', cabelo: '#c0c0c0', estilo: 'curto', camisa: '#2a2a3a', calcao: '#2a2a3a', meia: null, chuteira: '#101010', fase: 4, gravata: true },
    ola: 'O clube precisa de craques. Você é um?', loja: ['vitamina', 'agua_coco', 'suco_verde', 'acai', 'pacotinho'] },
};

/* ---------- Custo para aprender dribles com professores ---------- */
const PRECO_DRIBLE = { pedalada: 0, respiro: 0, chute_colocado: 60, arrancada: 200, chapeu: 800, voleio: 1500, elastico: 3000, folego_campeao: 4000, caneta: 8000, tabela: 12000, bicicleta: 25000, relampago: 60000 };

/* ---------- Quiz de futebol (Seu Juca) ---------- */
const QUIZ = [
  ['Quantos jogadores cada time tem em campo no futebol?', ['11', '10', '12', '9']],
  ['Quantas Copas do Mundo masculinas o Brasil venceu até hoje?', ['5', '4', '6', '3']],
  ['Em que ano o Brasil ganhou sua primeira Copa do Mundo?', ['1958', '1950', '1962', '1970']],
  ['Quem é conhecido como o "Rei do Futebol"?', ['Pelé', 'Garrincha', 'Zico', 'Maradona']],
  ['Quanto dura o tempo regulamentar de uma partida de futebol?', ['90 minutos', '80 minutos', '100 minutos', '60 minutos']],
  ['Qual país sediou a Copa do Mundo de 2014?', ['Brasil', 'Alemanha', 'Rússia', 'África do Sul']],
  ['Quantos jogadores cada time tem em quadra no futsal?', ['5', '6', '7', '4']],
  ['Qual cartão expulsa um jogador de campo?', ['Vermelho', 'Amarelo', 'Azul', 'Verde']],
  ['A marca do pênalti fica a quantos metros do gol?', ['11 metros', '9 metros', '12 metros', '16 metros']],
  ['Qual seleção venceu a Copa do Mundo de 2022?', ['Argentina', 'França', 'Brasil', 'Croácia']],
  ['Em que país foi a Copa do Mundo de 2022?', ['Catar', 'Rússia', 'Emirados Árabes', 'Arábia Saudita']],
  ['Qual país venceu a primeira Copa do Mundo, em 1930?', ['Uruguai', 'Brasil', 'Argentina', 'Itália']],
  ['Em que estádio aconteceu o "Maracanaço", em 1950?', ['Maracanã', 'Pacaembu', 'Morumbi', 'Mineirão']],
  ['Quantas Copas do Mundo a Alemanha já venceu?', ['4', '3', '5', '2']],
  ['Qual jogadora brasileira foi eleita a melhor do mundo pela FIFA seis vezes?', ['Marta', 'Formiga', 'Cristiane', 'Debinha']],
  ['Qual jogador pode usar as mãos dentro da própria área?', ['O goleiro', 'O capitão', 'O zagueiro', 'Ninguém']],
  ['Quanto dura cada tempo de uma partida oficial de futsal?', ['20 minutos', '25 minutos', '30 minutos', '15 minutos']],
  ['Qual seleção tem o apelido de "Azzurra"?', ['Itália', 'França', 'Argentina', 'Uruguai']],
  ['Em que ano o Brasil conquistou o pentacampeonato?', ['2002', '1994', '1998', '2006']],
  ['Qual taça o Brasil ganhou em definitivo ao ser tricampeão, em 1970?', ['Jules Rimet', 'Taça Libertadores', 'Copa América', 'Taça Brasil']],
  ['Quem marcou os dois gols do Brasil na final da Copa de 2002?', ['Ronaldo', 'Rivaldo', 'Ronaldinho', 'Roberto Carlos']],
  ['O que é um "hat-trick"?', ['Três gols do mesmo jogador num jogo', 'Um drible por cima', 'Um gol de cabeça', 'Uma defesa com os pés']],
  ['Qual a cor do cartão de advertência?', ['Amarelo', 'Vermelho', 'Branco', 'Laranja']],
  ['Qual clube inglês é chamado de "Red Devils"?', ['Manchester United', 'Liverpool', 'Arsenal', 'Chelsea']],
  ['Qual é a principal competição de clubes da América do Sul?', ['Copa Libertadores', 'Copa Sul-Americana', 'Recopa', 'Copa América']],
  ['Qual o apelido mais famoso da Seleção Brasileira?', ['Canarinho', 'Albiceleste', 'Furia', 'Tricolor']],
  ['Quantos gols Pelé marcou em Copas do Mundo?', ['12', '8', '15', '10']],
  ['Quem é o maior artilheiro da história das Copas, com 16 gols?', ['Miroslav Klose', 'Ronaldo', 'Pelé', 'Messi']],
  ['O que é um "gol olímpico"?', ['Gol direto de escanteio', 'Gol de bicicleta', 'Gol do meio de campo', 'Gol nas Olimpíadas']],
  ['Onde o Brasil conquistou o tetracampeonato, em 1994?', ['Estados Unidos', 'França', 'Itália', 'México']],
  ['Em que país foi a Copa de 1970, do tri do Brasil?', ['México', 'Chile', 'Inglaterra', 'Alemanha']],
  ['Qual jogador brasileiro ganhou a Bola de Ouro em 2007?', ['Kaká', 'Ronaldinho', 'Neymar', 'Rivaldo']],
  ['Quantos jogadores tem cada dupla no futevôlei?', ['2', '3', '4', '1']],
  ['Quando a bola sai pela linha lateral, a jogada recomeça com...', ['Arremesso lateral', 'Escanteio', 'Tiro de meta', 'Pênalti']],
  ['Quantos pontos vale uma vitória em campeonatos de pontos corridos?', ['3', '2', '1', '4']],
  ['Quem era o técnico do Brasil no penta de 2002?', ['Luiz Felipe Scolari', 'Tite', 'Zagallo', 'Parreira']],
  ['Em que ano aconteceu a primeira Copa do Mundo feminina?', ['1991', '1995', '1985', '2000']],
  ['Qual seleção venceu mais Copas do Mundo femininas?', ['Estados Unidos', 'Alemanha', 'Brasil', 'Noruega']],
  ['Qual clube brasileiro tem o apelido de "Peixe"?', ['Santos', 'Vasco', 'Grêmio', 'Bahia']],
  ['Qual clube é chamado de "Timão"?', ['Corinthians', 'Palmeiras', 'São Paulo', 'Flamengo']],
  ['Qual jogador era chamado de "Anjo de Pernas Tortas"?', ['Garrincha', 'Didi', 'Nilton Santos', 'Vavá']],
  ['Qual jogador era conhecido como "Galinho de Quintino"?', ['Zico', 'Sócrates', 'Romário', 'Júnior']],
  ['Qual jogador brasileiro ficou conhecido como "Fenômeno"?', ['Ronaldo', 'Romário', 'Adriano', 'Rivaldo']],
  ['Quantas substituições cada time pode fazer num jogo oficial pela regra atual?', ['5', '3', '4', '6']],
  ['Em que ano Ronaldinho Gaúcho ganhou a Bola de Ouro?', ['2005', '2002', '2007', '2009']],
  ['Qual país venceu mais vezes a Copa América?', ['Argentina', 'Brasil', 'Uruguai', 'Chile']],
  ['Em que país o Brasil ganhou a Copa de 1958?', ['Suécia', 'Suíça', 'Chile', 'Inglaterra']],
  ['Quem tira o cartão do bolso durante o jogo?', ['O árbitro', 'O bandeirinha', 'O técnico', 'O capitão']],
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
  defesa: { nome: 'Defesa', icone: '🛡️', cor: '#4a8ae8', desc: 'Reduz o dano das divididas e aumenta a chance de bloqueio.' },
  habilidade: { nome: 'Habilidade', icone: '✨', cor: '#ff9a3a', desc: 'Aumenta o dano dos dribles e chutes e a chance de crítico.' },
  inteligencia: { nome: 'Inteligência', icone: '🧠', cor: '#b07aff', desc: 'Mais foco, dribles especiais mais fortes, curas melhores e mais XP em missões e quiz.' },
  folego: { nome: 'Fôlego', icone: '💨', cor: '#4fc26a', desc: 'Mais fôlego máximo, recuperação mais rápida e mais velocidade.' },
};
const PONTOS_POR_NIVEL = 2;
const CLASSES = {
  paredao: {
    nome: 'Paredão', principal: 'defesa', cor: '#4a8ae8', emoji: '🛡️',
    desc: 'Ninguém passa! Aguenta pancada e protege a área.',
    passiva: 'Bloqueio perfeito: 12% de chance de anular totalmente uma dividida.',
    especial: { id: 'muralha', nome: 'Muralha', cd: 30000, dur: 6000, desc: 'Por 6 segundos você toma só metade do dano.' },
    base: { defesa: 10, habilidade: 5, inteligencia: 5, folego: 7 },
  },
  driblador: {
    nome: 'Driblador', principal: 'habilidade', cor: '#ff9a3a', emoji: '✨',
    desc: 'Pura ginga: dribles que fazem o adversário sentar.',
    passiva: 'Craque: chance de crítico maior (dano x1,8 — "GOLAÇO!").',
    especial: { id: 'firula', nome: 'Firula', cd: 25000, dur: 3, desc: 'Seus próximos 3 ataques são críticos garantidos.' },
    base: { defesa: 5, habilidade: 10, inteligencia: 6, folego: 6 },
  },
  cerebro: {
    nome: 'Cérebro', principal: 'inteligencia', cor: '#b07aff', emoji: '🧠',
    desc: 'Enxerga o jogo antes de todo mundo. Estudioso e estrategista.',
    passiva: 'Leitura: dribles gastam 20% menos foco e você ganha +25% de XP em missões e no quiz.',
    especial: { id: 'leitura', nome: 'Leitura de Jogo', cd: 40000, desc: 'Recupera 35% do foco na hora e acalma todos os adversários por perto.' },
    base: { defesa: 5, habilidade: 6, inteligencia: 10, folego: 6 },
  },
  motorzinho: {
    nome: 'Motorzinho', principal: 'folego', cor: '#4fc26a', emoji: '💨',
    desc: 'Não cansa nunca! Corre o jogo inteiro.',
    passiva: 'Pulmão de aço: +8% de velocidade e recuperação de fôlego dobrada.',
    especial: { id: 'segundo_folego', nome: 'Segundo Fôlego', cd: 45000, desc: 'Recupera 40% do fôlego na hora.' },
    base: { defesa: 6, habilidade: 6, inteligencia: 5, folego: 10 },
  },
};

/* ---------- Moeda, alimentos, materiais e refino ---------- */
const MOEDA = { nome: 'tostão', plural: 'tostões' };
Object.assign(ITENS, {
  // Alimentos: dão um bônus que dura alguns minutos (só um por vez). O bônus cresce com o nível.
  pao_queijo: { nome: 'Pão de Queijo', tipo: 'comida', efeito: { dur: 180, regen: 1.2 }, preco: 12, venda: 3, desc: 'Quentinho! Recupera fôlego mais rápido por 3 min.' },
  melancia: { nome: 'Fatia de Melancia', tipo: 'comida', efeito: { dur: 180, regen: 1, regenFoco: 1 }, preco: 10, venda: 2, desc: 'Refrescante. Recupera fôlego e foco mais rápido por 3 min.' },
  banana: { nome: 'Banana', tipo: 'comida', efeito: { dur: 240, vel: 14 }, preco: 15, venda: 3, desc: 'Energia rápida: +velocidade por 4 min.' },
  coxinha: { nome: 'Coxinha', tipo: 'comida', efeito: { dur: 300, atr: { habilidade: 4 } }, preco: 25, venda: 6, desc: '+Habilidade por 5 min.' },
  pastel: { nome: 'Pastel de Feira', tipo: 'comida', efeito: { dur: 300, atr: { folego: 4 }, regen: 0.8 }, preco: 25, venda: 6, desc: '+Fôlego por 5 min.' },
  tapioca: { nome: 'Tapioca', tipo: 'comida', efeito: { dur: 300, atr: { inteligencia: 4 } }, preco: 25, venda: 6, desc: '+Inteligência por 5 min.' },
  sanduiche: { nome: 'Sanduíche Natural', tipo: 'comida', efeito: { dur: 300, atr: { defesa: 4 } }, preco: 25, venda: 6, desc: '+Defesa por 5 min.' },
  brigadeiro: { nome: 'Brigadeiro', tipo: 'comida', efeito: { dur: 300, regenFoco: 2.5 }, preco: 20, venda: 5, desc: 'Docinho! Recupera foco bem mais rápido por 5 min.' },
  prato_feito: { nome: 'Prato Feito', tipo: 'comida', efeito: { dur: 600, regen: 1.6, atr: { folego: 6, defesa: 3 } }, lvl: 8, preco: 90, venda: 20, desc: 'Arroz, feijão, bife e salada: +Fôlego, +Defesa e recuperação por 10 min. Nível 8.' },
  feijoada: { nome: 'Feijoada Completa', tipo: 'comida', efeito: { dur: 900, regen: 2, regenFoco: 1.5, atr: { defesa: 6, habilidade: 6, inteligencia: 6, folego: 6 } }, lvl: 15, preco: 240, venda: 50, desc: 'O banquete dos campeões: +6 em TODOS os atributos e recuperação por 15 min. Nível 15.' },
  // Materiais de refino
  retalho: { nome: 'Retalho de Tecido', tipo: 'loot', venda: 5, desc: 'Material de refino (+4 a +6). O Seu Remendo usa.' },
  couro: { nome: 'Pedaço de Couro', tipo: 'loot', venda: 20, desc: 'Material de refino (+7 a +10). Cai de adversários da Cidade pra frente.' },
  fio_ouro: { nome: 'Fio de Ouro', tipo: 'loot', venda: 150, desc: 'Material raríssimo para o refino +10. Chefões deixam cair.' },
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
function custoRefino(id, r) {
  const it = ITENS[id]; const base = it.preco || (it.venda || 10) * 4;
  const mats = [];
  if (r + 1 >= 4 && r + 1 <= 6) mats.push(['retalho', r - 2]);
  if (r + 1 >= 7 && r + 1 <= 9) mats.push(['couro', r - 5]);
  if (r + 1 === 10) mats.push(['couro', 3], ['fio_ouro', 1]);
  return { tostoes: Math.round(base * 0.3 * Math.pow(r + 1, 1.7)) + 20, mats, chance: REFINO_CHANCE[r] };
}
function nomeItem(id, r) { return ITENS[id].nome + (r ? ` +${r}` : ''); }

// NPCs novos
NPCS.remendo = { nome: 'Seu Remendo, o Sapateiro', refino: true, ola: 'Conserto, costuro e deixo qualquer chuteira nova em folha... e ainda MELHOR! Me traga tostões e materiais que eu refino seu equipamento até +10.' };
NPCS.zuzu = { nome: 'Tia Zuzu da Lanchonete', ola: 'Saco vazio não para em pé, meu anjo! Craque come bem antes do treino.', loja: ['pao_queijo', 'melancia', 'banana', 'coxinha', 'pastel', 'tapioca', 'sanduiche', 'brigadeiro', 'prato_feito', 'feijoada'] };
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
  { id: 'q_lanche', npc: 'zuzu', titulo: 'Lanche de campeão', lvl: 2,
    texto: 'Treinar de barriga vazia não dá! Coma 3 alimentos (pode comprar aqui comigo). Cada comida dá um bônus por alguns minutos.',
    req: { comer: 3, desc: 'Coma 3 alimentos' }, rec: { xp: 90, itens: [['pao_queijo', 5], ['coxinha', 2]] },
    fim: 'Isso! Comida boa = craque forte. Toma uns pães de queijo pra viagem.' },
  { id: 'q_refino', npc: 'remendo', titulo: 'Nova em folha', lvl: 4,
    texto: 'Traga um equipamento e deixe comigo: vou refinar até +2. Refino deixa o item mais forte!',
    req: { refino: 2, desc: 'Refine equipamentos 2 vezes com o Seu Remendo' }, rec: { xp: 180, itens: [['retalho', 6]] },
    fim: 'Viu como ficou? Do +4 em diante eu preciso de Retalhos de Tecido, e depois de Couro e Fio de Ouro.' });
