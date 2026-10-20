// Melhorias do dia a dia, compradas com dinheiro.
import { FLAGS } from './flags.js';
import { VIVA } from './viva.js';
// custo = base * k^(nível - start)
// req: [id, nível mínimo] de outra melhoria; reqAlt: altura mínima já alcançada (m); max: nível máximo.
// Efeito por nível (usado em sim/economy.js rates()): mul = multiplica a cada nível (mul^nv); add = soma por nível (1 + add×nv).
export const BRANCHES = [
  { id: 'obra', n: 'Mão de obra' },
  { id: 'forn', n: 'Fornecimento' },
  { id: 'log', n: 'Logística' },
  { id: 'eng', n: 'Engenharia' },
  { id: 'merc', n: 'Mercado' },
];

export const UP = {
  // Mão de obra
  pedreiro: { b: 'obra', n: 'Contratar pedreiro', d: '+1 pedreiro assentando no topo da obra.', base: 12, k: 1.3, start: 1 },
  treino: { b: 'obra', n: 'Treinamento', d: '+25% de velocidade de assentamento por nível.', base: 60, k: 1.65, req: ['pedreiro', 3], add: 0.25 },
  ferram: { b: 'obra', n: 'Ferramentas elétricas', d: '×1,5 assentamento por nível.', base: 500, k: 3.2, max: 10, req: ['treino', 3], mul: 1.5 },
  mestre: { b: 'obra', n: 'Mestre de obras', d: '×2 assentamento por nível.', base: 20000, k: 9, max: 6, req: ['ferram', 2], mul: 2 },
  // Fornecimento
  fornec: { b: 'forn', n: 'Fornecedor de tijolos', d: '+1,5 de material por segundo no térreo.', base: 10, k: 1.28, start: 1 },
  caminhao: { b: 'forn', n: 'Caminhão maior', d: '+30% de produção por nível.', base: 80, k: 1.75, req: ['fornec', 3], add: 0.3 },
  olaria: { b: 'forn', n: 'Olaria própria', d: '×2 produção por nível.', base: 1000, k: 5, max: 10, req: ['caminhao', 3], mul: 2 },
  premold: { b: 'forn', n: 'Fábrica de pré-moldados', d: '×3 produção por nível.', base: 60000, k: 14, max: 6, req: ['olaria', 2], mul: 3 },
  // Logística
  elevador: { b: 'log', n: 'Novo elevador de carga', d: '+1 elevador subindo material.', base: 45, k: 2.6, max: 6, start: 1 },
  motor: { b: 'log', n: 'Motor mais forte', d: '×1,3 velocidade dos elevadores.', base: 30, k: 2.3, mul: 1.3 },
  cacamba: { b: 'log', n: 'Caçamba maior', d: '×1,3 carga por viagem.', base: 55, k: 2.3, req: ['motor', 1], mul: 1.3 },
  maglev: { b: 'log', n: 'Elevador magnético', d: '×4 velocidade dos elevadores.', base: 40000, k: 12, max: 6, req: ['cacamba', 4], mul: 4 },
  // Engenharia
  fundacao: { b: 'eng', n: 'Fundação reforçada', d: 'Dobra a altura máxima que a torre suporta.', base: 150, k: 3.6 },
  guindaste: { b: 'eng', n: 'Guindaste de torre', d: 'Ergue vigas e paletes até o topo para os pedreiros: +50% de assentamento por nível.', base: 250, k: 2.8, max: 10, req: ['fundacao', 1], add: 0.5 },
  projeto: { b: 'eng', n: 'Projeto otimizado', d: '−15% de material por andar.', base: 600, k: 3.4, max: 8, req: ['fundacao', 2] },
  // Mercado
  corretor: { b: 'merc', n: 'Corretor de imóveis', d: 'Nv 1 decide sozinho o destino de cada andar pronto (regra em Imóveis). +8% no preço de venda por nível.', base: 150, k: 4, max: 6 },
  aluguel: { b: 'merc', n: 'Andares comerciais', d: '+50% de renda de aluguel por nível.', base: 120, k: 2.1 },
  bilheteria: { b: 'merc', n: 'Elevador panorâmico', d: 'Leva turistas ao topo: mais lugares a cada nível (os lugares crescem com a altura).', base: 200, k: 1.9, reqAlt: 40 },
  marketing: { b: 'merc', n: 'Marketing da torre', d: '+25% de turistas interessados.', base: 400, k: 2.2, req: ['bilheteria', 1] },
  banco: { b: 'merc', n: 'Relacionamento bancário', d: 'Sobe o nível do banco: mais crédito e juros menores.', base: 2500, k: 30, max: 3 },
  heliponto: { b: 'merc', n: 'Heliponto no topo', d: 'Passeios de helicóptero: muitos lugares a mais por nível (crescem com a altura).', base: 60000, k: 2.4, reqAlt: 1000 },
  porto: { b: 'merc', n: 'Porto espacial', d: 'Turismo espacial: +0,05 turista espacial/s, com ingresso 40× mais caro.', base: 5e9, k: 3, reqAlt: 100000 },
};

// Protótipo Obra Viva: as três compras iniciais ganham nome concreto e ficam liberadas desde o começo
if (FLAGS.viva) for (const k in VIVA.upgrades) Object.assign(UP[k], VIVA.upgrades[k]);
if (FLAGS.viva) for (const k of ['bilheteria', 'heliponto', 'porto']) UP[k].soft = VIVA.softTourism; // ×4 por nível depois do 10º

// Obra Viva: tecnologias de era — cada era nova abre 1 compra em cada ramo, no topo da coluna da árvore.
// era: índice em ERAS (reqAlt = altura da era); st: o que multiplica (lay, prod, tran, fcost, rent, tour, ticket);
// flag: regra especial (lida em economy.js), vale com nível 1; icon: ícone reaproveitado de ui/icons.js.
const T = (b, era, n, d, extra) => ({ b, era, n, d, max: 3, k: 5, ...extra });
const ERA_ALT = [0, 100, 1000, 12000, 50000, 100000];
export const ERA_TECH = {
  // Mão de obra
  escoramento: T('obra', 1, 'Escoramento metálico', 'Escoras de aço no lugar da madeira: ×1,5 no assentamento por nível.', { base: 3e3, st: 'lay', mul: 1.5, icon: 'ferram' }),
  soldadores: T('obra', 2, 'Equipe de soldadores', 'Estrutura de aço soldada no topo: ×1,5 no assentamento por nível.', { base: 1e5, st: 'lay', mul: 1.5, icon: 'mestre' }),
  mutirao: T('obra', 3, 'Mutirão', 'Os pedreiros ajudam a subir material quando sobra tempo (parte do assentamento vira transporte).', { base: 3e6, max: 1, flag: 'helpers', icon: 'pedreiro' }),
  robos: T('obra', 4, 'Robôs de montagem', 'Braços robóticos assentam junto: ×2 no assentamento por nível.', { base: 4e7, st: 'lay', mul: 2, icon: 'treino' }),
  drones: T('obra', 5, 'Drones construtores', 'Drones montam as peças em gravidade baixa: ×2 no assentamento por nível.', { base: 4e8, st: 'lay', mul: 2, icon: 'guindaste' }),
  // Fornecimento
  usina: T('forn', 1, 'Usina de concreto', 'Concreto usinado chegando de caminhão-betoneira: ×1,5 de material por nível.', { base: 3e3, st: 'prod', mul: 1.5, icon: 'caminhao' }),
  siderurgica: T('forn', 2, 'Siderúrgica parceira', 'Aço e vidro direto da fábrica: ×1,6 de material por nível.', { base: 1e5, st: 'prod', mul: 1.6, icon: 'premold' }),
  usinaTopo: T('forn', 3, 'Usina no topo', 'Uma parte do material já é produzida lá em cima, sem passar pelos elevadores.', { base: 3e6, max: 1, flag: 'topPlant', icon: 'olaria' }),
  fabrica: T('forn', 4, 'Fábrica automatizada', 'Linha de produção sem parar: ×2 de material por nível.', { base: 4e7, st: 'prod', mul: 2, icon: 'premold' }),
  asteroides: T('forn', 5, 'Mineração de asteroides', 'Material vindo do espaço: ×2 de material por nível.', { base: 4e8, st: 'prod', mul: 2, icon: 'porto' }),
  // Logística
  cabos: T('log', 1, 'Cabos de aço', 'Elevadores com cabos mais fortes: ×1,2 na velocidade por nível.', { base: 3e3, st: 'tran', mul: 1.2, icon: 'motor' }),
  expresso: T('log', 2, 'Elevador expresso', 'Viagens sem paradas: a altura pesa menos no tempo de subida.', { base: 1e5, max: 1, flag: 'express', icon: 'elevador' }),
  pressurizada: T('log', 3, 'Cabine pressurizada', 'Elevadores para o ar rarefeito: ×1,25 na velocidade por nível.', { base: 3e6, st: 'tran', mul: 1.25, icon: 'elevador' }),
  linear: T('log', 4, 'Elevador linear', 'Motor linear magnético: ×1,4 na velocidade por nível.', { base: 4e7, st: 'tran', mul: 1.4, icon: 'maglev' }),
  teleporte: T('log', 5, 'Teletransporte de carga', 'Acima de 20 km a carga chega como se a torre parasse ali.', { base: 4e8, max: 1, flag: 'teleport', icon: 'maglev' }),
  // Engenharia
  calculo: T('eng', 1, 'Cálculo estrutural', 'Estrutura mais leve: −10% de material por andar a cada nível.', { base: 4e3, st: 'fcost', mul: 0.9, icon: 'projeto' }),
  prefab: T('eng', 2, 'Pré-fabricação total', 'Andares saem prontos da fábrica: o material por andar cresce bem menos com a altura.', { base: 1.5e5, max: 1, flag: 'prefab', icon: 'premold' }),
  flutuante: T('eng', 3, 'Fundação flutuante', 'Cada nível de fundação triplica o limite de altura (em vez de dobrar).', { base: 4e6, max: 1, flag: 'floatFound', icon: 'fundacao' }),
  amortecedor: T('eng', 4, 'Amortecedores de vento', 'A torre balança menos: −15% de material por andar a cada nível.', { base: 5e7, st: 'fcost', mul: 0.85, icon: 'projeto' }),
  gravidade: T('eng', 5, 'Gravidade artificial', 'Os elevadores ficam mais rápidos quanto mais alta a torre.', { base: 5e8, max: 1, flag: 'gravity', icon: 'fundacao' }),
  // Mercado
  imobiliaria: T('merc', 1, 'Imobiliária parceira', 'Andares sempre ocupados: +50% de aluguel por nível.', { base: 3e3, st: 'rent', add: 0.5, icon: 'corretor' }),
  agencia: T('merc', 2, 'Agência de turismo', 'Excursões para a torre: +50% de turistas interessados por nível.', { base: 1e5, st: 'tour', add: 0.5, icon: 'marketing' }),
  hotelNuvens: T('merc', 3, 'Hotel nas nuvens', 'Hospedagem acima das nuvens: +50% no ingresso por nível.', { base: 3e6, st: 'ticket', add: 0.5, icon: 'bilheteria' }),
  publicidade: T('merc', 4, 'Publicidade global', 'A torre vira cartão-postal: +50% de aluguel por nível.', { base: 4e7, st: 'rent', add: 0.5, icon: 'marketing' }),
  turismoEsp: T('merc', 5, 'Turismo espacial', 'Passeios até o espaço: +50% no ingresso por nível.', { base: 4e8, st: 'ticket', add: 0.5, icon: 'porto' }),
};
// Alternativas (escolha 1 de 2 por era e ramo; a outra fica travada até a próxima obra). Mesmo preço da irmã.
// Números equilibrados com tools/pares.mjs (out/2026): os dois lados de cada par rendem parecido (A/B entre ~0,85 e ~1,15).
// Estilos opostos: Obra assenta mais rápido × gasta menos material; Fornecimento quantidade × qualidade (aluguel);
// Logística velocidade × capacidade da gaiola; Engenharia limite × custo; Mercado aluguel/ingresso × venda.
// Estágios novos: cap (carga por viagem), capF (limite da fundação), fundCost (preço da Fundação), sale (valor de venda);
// st2/mul2/add2 = segundo efeito da mesma tecnologia.
const ALT_TECH = {
  argamassa: T('obra', 1, 'Argamassa polimérica', 'Assenta com menos material: −5% de material por andar a cada nível.', { base: 3e3, st: 'fcost', mul: 0.95, icon: 'argamassa', pair: 'escoramento' }),
  parafusada: T('obra', 2, 'Estrutura parafusada', 'Vigas parafusadas no lugar da solda: −4% de material por andar a cada nível.', { base: 1e5, st: 'fcost', mul: 0.96, pair: 'soldadores' }),
  turnoNoite: T('obra', 3, 'Turno da noite', 'A obra não para à noite: ×1,6 no assentamento e ×1,3 no material subindo por nível.', { base: 3e6, st: 'lay', mul: 1.6, st2: 'tran', mul2: 1.3, pair: 'mutirao' }),
  impressao3d: T('obra', 4, 'Impressão 3D de paredes', 'Paredes impressas no lugar: −10% de material por andar a cada nível.', { base: 4e7, st: 'fcost', mul: 0.9, pair: 'robos' }),
  exoesqueleto: T('obra', 5, 'Exoesqueletos', 'Pedreiros mais fortes: ×1,4 no assentamento e ×1,1 no material subindo por nível.', { base: 4e8, st: 'lay', mul: 1.4, st2: 'tran', mul2: 1.1, pair: 'drones' }),
  concretoAD: T('forn', 1, 'Concreto de alto desempenho', 'Andares de mais qualidade: +15% de aluguel por nível.', { base: 3e3, st: 'rent', add: 0.15, pair: 'usina' }),
  vidroSolar: T('forn', 2, 'Vidro solar', 'Fachada que gera energia: +20% de aluguel por nível.', { base: 1e5, st: 'rent', add: 0.2, pair: 'siderurgica' }),
  modulosProntos: T('forn', 3, 'Fábrica de módulos', 'Peças maiores saindo da fábrica: ×1,5 de material e ×1,15 de carga por viagem a cada nível.', { base: 3e6, st: 'prod', mul: 1.5, st2: 'cap', mul2: 1.15, pair: 'usinaTopo' }),
  nanotubos: T('forn', 4, 'Nanotubos de carbono', 'Material mais leve e forte: −10% de material por andar a cada nível.', { base: 4e7, st: 'fcost', mul: 0.9, pair: 'fabrica' }),
  reciclagem: T('forn', 5, 'Reciclagem total', 'Nada se perde: ×1,5 de material e −5% de material por andar a cada nível.', { base: 4e8, st: 'prod', mul: 1.5, st2: 'fcost', mul2: 0.95, pair: 'asteroides' }),
  gaiolaDupla: T('log', 1, 'Gaiola dupla', 'Cada viagem leva mais: ×1,25 de carga por viagem a cada nível.', { base: 3e3, st: 'cap', mul: 1.25, pair: 'cabos' }),
  contrapeso: T('log', 2, 'Contrapeso inteligente', 'Elevadores equilibrados: ×1,5 no material subindo por nível.', { base: 1e5, st: 'tran', mul: 1.5, pair: 'expresso' }),
  esteira: T('log', 3, 'Esteira vertical', 'Uma esteira sobe junto dos elevadores: ×1,3 de carga por viagem a cada nível.', { base: 3e6, st: 'cap', mul: 1.3, pair: 'pressurizada' }),
  tuboPneumatico: T('log', 4, 'Tubo pneumático', 'Material soprado até o topo: ×1,3 de carga por viagem e −8% de material por andar a cada nível.', { base: 4e7, st: 'cap', mul: 1.3, st2: 'fcost', mul2: 0.92, pair: 'linear' }),
  elevadorEspacial: T('log', 5, 'Cabo espacial', 'Um cabo do chão até a órbita: ×1,5 no material subindo.', { base: 4e8, max: 1, st: 'tran', mul: 1.5, pair: 'teleporte' }),
  estacas: T('eng', 1, 'Estacas profundas', 'Fundação mais funda: +70% no limite da torre e −4% de material por andar a cada nível.', { base: 4e3, st: 'capF', mul: 1.7, st2: 'fcost', mul2: 0.96, pair: 'calculo' }),
  fundacaoBarata: T('eng', 2, 'Fundação em série', 'Formas reaproveitadas: a Fundação reforçada custa 60% menos e cada andar gasta 20% menos material.', { base: 1.5e5, max: 1, st: 'fundCost', mul: 0.4, st2: 'fcost', mul2: 0.8, pair: 'prefab' }),
  contrafortes: T('eng', 3, 'Contrafortes', 'Apoios externos: o limite da torre dobra e o material sobe ×1,3 (menos balanço nos elevadores).', { base: 4e6, max: 1, st: 'capF', mul: 2, st2: 'tran', mul2: 1.3, pair: 'flutuante' }),
  grafeno: T('eng', 4, 'Núcleo de grafeno', 'Coluna central de grafeno: o limite da torre dobra a cada nível.', { base: 5e7, st: 'capF', mul: 2, pair: 'amortecedor' }),
  ancoraOrbital: T('eng', 5, 'Âncora orbital', 'A torre se prende à órbita: o limite triplica e o material sobe ×2.', { base: 5e8, max: 1, st: 'capF', mul: 3, st2: 'tran', mul2: 2, pair: 'gravidade' }),
  corretores: T('merc', 1, 'Corretores próprios', 'Andares vendidos valem mais: +50% na venda por nível.', { base: 3e3, st: 'sale', add: 0.5, pair: 'imobiliaria' }),
  lojas: T('merc', 2, 'Lojas no térreo', 'Comércio na base da torre: +10% de aluguel por nível.', { base: 1e5, st: 'rent', add: 0.1, pair: 'agencia' }),
  eventos: T('merc', 3, 'Salões de evento', 'Andares disputados para festas: +60% na venda e +50% no pagamento por andar concluído, por nível.', { base: 3e6, st: 'sale', add: 0.6, st2: 'floorPay', add2: 0.5, pair: 'hotelNuvens' }),
  leilao: T('merc', 4, 'Leilão de coberturas', 'Coberturas vão a leilão: +80% na venda por nível.', { base: 4e7, st: 'sale', add: 0.8, pair: 'publicidade' }),
  condominioOrbital: T('merc', 5, 'Condomínio orbital', 'Morar no espaço vale ouro: +100% na venda e +50% no pagamento por andar concluído, por nível.', { base: 4e8, st: 'sale', add: 1, st2: 'floorPay', add2: 0.5, pair: 'turismoEsp' }),
};
for (const k in ALT_TECH) { ALT_TECH[k].icon = k; ERA_TECH[ALT_TECH[k].pair].pair = k; }
Object.assign(ERA_TECH, ALT_TECH);
for (const k in ERA_TECH) ERA_TECH[k].reqAlt = ERA_ALT[ERA_TECH[k].era];
if (FLAGS.viva) Object.assign(UP, ERA_TECH);
// fator de uma etapa somando as tecnologias de era compradas (1 quando não há nenhuma); st2 = segundo efeito
export const TECH_BY_STAGE = {};
for (const k in ERA_TECH) { const u = ERA_TECH[k]; if (u.st) (TECH_BY_STAGE[u.st] ||= []).push(k); if (u.st2) (TECH_BY_STAGE[u.st2] ||= []).push(k); }

// Obra Viva: política de imóveis da era (não é compra: alterna Alugar/Vender sem custo; max 0 = a economia nunca "compra")
if (FLAGS.viva) UP.imoveis = { b: 'merc', n: 'Imóveis da era', d: 'Decida o destino dos andares desta era: alugar (renda contínua) ou vender (dinheiro na hora, cerca de 20 min de aluguel por andar).', base: 0, k: 1, max: 0, icon: 'corretores' };
export const KEYS = Object.keys(UP);
