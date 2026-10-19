// Árvore de Engenharia (paga com Pontos de Engenharia).
// Mapa radial: 6 ramos em setores de 60°, 7 anéis (o anel k abre na era k-1).
// Por anel e ramo: braço A (2 nós pequenos), braço B (1 nó pequeno) e um notável onde os braços se encontram.
// Anéis 4 e 7 têm um nó-chave por ramo; anéis 2, 4 e 6 têm pontes entre ramos vizinhos.
//
// Efeitos: { s: stat, inc } soma no bônus "aumentado" (+x%), { s, more } multiplica,
// { s, add } soma valor absoluto (offline em segundos), { flag } liga uma regra especial.
import { ERAS } from './eras.js';

export const RINGS = 7;
export const ringRadius = k => 80 + 140 * k;
export const CENTER = 'inicio';

export const TBRANCHES = [
  { id: 'obra', n: 'Mão de obra', color: '#ff8a1e' },
  { id: 'forn', n: 'Fornecimento', color: '#e0664a' },
  { id: 'log', n: 'Logística', color: '#f2b630' },
  { id: 'eng', n: 'Engenharia', color: '#5d97c2' },
  { id: 'merc', n: 'Mercado', color: '#6fd08c' },
  { id: 'cien', n: 'Ciência', color: '#a08ae8' },
];

export const STAT_LABEL = {
  lay: 'assentamento', prod: 'produção', tranSpd: 'velocidade dos elevadores', tranCap: 'carga dos elevadores',
  all: 'produção, transporte e assentamento', fcost: 'material por andar', capF: 'limite da fundação',
  rent: 'aluguel', sale: 'preço de venda', tourism: 'turistas interessados', ticket: 'preço do ingresso',
  credit: 'limite de crédito', interest: 'juros do banco', offline: 'progresso offline',
  cost_obra: 'custo de Mão de obra', cost_forn: 'custo de Fornecimento', cost_log: 'custo de Logística',
  cost_eng: 'custo de Engenharia', cost_merc: 'custo de Mercado',
};

const pct = v => (Math.round(v * 1000) / 10).toString().replace('.', ',') + '%';
const num = v => (Math.round(v * 100) / 100).toString().replace('.', ',');
export function describeEffect(e) {
  if (e.text) return e.text;
  const L = STAT_LABEL[e.s] || e.s;
  if (e.add !== undefined) return e.s === 'offline' ? `+${e.add >= 3600 ? num(e.add / 3600) + ' h' : Math.round(e.add / 60) + ' min'} de ${L}` : `+${num(e.add)} ${L}`;
  if (e.inc !== undefined) return (e.inc >= 0 ? '+' : '−') + pct(Math.abs(e.inc)) + ' ' + L;
  if (e.more !== undefined) return e.more >= 1 ? `×${num(e.more)} ${L}` : `−${pct(1 - e.more)} ${L}`;
  return '';
}

// Nós pequenos: braço A (primário) e braço B (secundário, mais forte) por ramo
const SMALL = {
  obra: { a: { s: 'lay', inc: .08 }, b: { s: 'cost_obra', inc: -.06 } },
  forn: { a: { s: 'prod', inc: .08 }, b: { s: 'fcost', inc: -.03 } },
  log: { a: { s: 'tranSpd', inc: .08 }, b: { s: 'tranCap', inc: .12 } },
  eng: { a: { s: 'capF', inc: .15 }, b: { s: 'cost_eng', inc: -.06 } },
  merc: { a: { s: 'rent', inc: .06 }, b: k => k % 2 ? { s: 'sale', inc: .10 } : { s: 'ticket', inc: .10 } },
  cien: { a: { s: 'all', inc: .03 }, b: { s: 'offline', add: 900 } },
};

// Notáveis: [nome, efeitos] por anel 1..7
const NOTABLE = {
  obra: [
    ['Equipe unida', [{ s: 'lay', more: 1.2 }]],
    ['Canteiro organizado', [{ s: 'lay', more: 1.25 }, { s: 'cost_obra', inc: -.1 }]],
    ['Turno duplo', [{ s: 'lay', more: 1.35 }]],
    ['Mestres veteranos', [{ s: 'lay', more: 1.4 }, { s: 'all', inc: .05 }]],
    ['Exoesqueletos', [{ s: 'lay', more: 1.5 }]],
    ['Robôs pedreiros', [{ s: 'lay', more: 1.6 }, { s: 'cost_obra', inc: -.15 }]],
    ['Enxame de drones', [{ s: 'lay', more: 2 }]],
  ],
  forn: [
    ['Contrato fixo', [{ s: 'prod', more: 1.2 }]],
    ['Frota própria', [{ s: 'prod', more: 1.25 }, { s: 'cost_forn', inc: -.1 }]],
    ['Pedreira própria', [{ s: 'prod', more: 1.35 }]],
    ['Concreteira', [{ s: 'prod', more: 1.4 }, { s: 'fcost', inc: -.05 }]],
    ['Siderúrgica', [{ s: 'prod', more: 1.5 }]],
    ['Impressão 3D de blocos', [{ s: 'prod', more: 1.6 }, { s: 'fcost', inc: -.08 }]],
    ['Mineração de asteroides', [{ s: 'prod', more: 2 }]],
  ],
  log: [
    ['Roldanas novas', [{ s: 'tranSpd', more: 1.2 }]],
    ['Cabos de aço', [{ s: 'tranCap', more: 1.25 }]],
    ['Contrapeso duplo', [{ s: 'tranSpd', more: 1.35 }]],
    ['Elevador duplo', [{ s: 'tranCap', more: 1.4 }, { s: 'cost_log', inc: -.1 }]],
    ['Trilho magnético', [{ s: 'tranSpd', more: 1.5 }]],
    ['Tubo de vácuo', [{ s: 'tranCap', more: 1.6 }]],
    ['Elevador orbital', [{ s: 'tranSpd', more: 2 }]],
  ],
  eng: [
    ['Sondagem do solo', [{ s: 'capF', more: 1.5 }]],
    ['Estacas profundas', [{ s: 'cost_eng', inc: -.15 }, { s: 'capF', inc: .2 }]],
    ['Cálculo estrutural', [{ s: 'fcost', more: .9 }]],
    ['Núcleo de concreto', [{ s: 'capF', more: 2 }]],
    ['Amortecedor de massa', [{ s: 'fcost', more: .85 }, { s: 'lay', inc: .1 }]],
    ['Treliça de nanotubo', [{ s: 'capF', more: 3 }]],
    ['Ancoragem orbital', [{ s: 'fcost', more: .75 }]],
  ],
  merc: [
    ['Plantão de vendas', [{ s: 'sale', more: 1.25 }]],
    ['Imobiliária parceira', [{ s: 'rent', more: 1.25 }]],
    ['Agência de turismo', [{ s: 'tourism', more: 1.5 }]],
    ['Rating AAA', [{ s: 'credit', more: 1.5 }, { s: 'interest', inc: -.2 }]],
    ['Marca de luxo', [{ s: 'rent', more: 1.4 }, { s: 'sale', more: 1.4 }]],
    ['Bolsa de valores', [{ s: 'credit', more: 1.5 }, { s: 'interest', inc: -.2 }, { s: 'sale', more: 1.2 }]],
    ['Turismo interplanetário', [{ s: 'ticket', more: 2 }, { s: 'tourism', more: 1.5 }]],
  ],
  cien: [
    ['Laboratório', [{ s: 'all', more: 1.1 }]],
    ['Engenheiros estagiários', [{ s: 'offline', add: 3600 }]],
    ['Simulação computacional', [{ s: 'all', more: 1.15 }]],
    ['IA de obra', [{ s: 'all', more: 1.2 }, { s: 'offline', add: 3600 }]],
    ['Novos materiais', [{ s: 'fcost', more: .9 }, { s: 'all', more: 1.1 }]],
    ['Física aplicada', [{ s: 'all', more: 1.25 }]],
    ['Computação quântica', [{ s: 'all', more: 1.4 }]],
  ],
};

// Nós-chave: mudam regras. [anel 4, anel 7]
const KEYSTONE = {
  obra: [
    ['Turno da noite', [{ s: 'lay', more: 2 }, { s: 'rent', more: .85 }], 'A obra não para: assentamento dobra, mas o barulho derruba o aluguel.'],
    ['Mutirão', [{ flag: 'helpers', text: 'Pedreiros ajudam a subir material: +25% do assentamento vira transporte' }], 'Quem está no topo desce para buscar material.'],
  ],
  forn: [
    ['Usina no topo', [{ flag: 'topPlant', text: '25% da produção nasce direto no topo, sem passar pelo elevador' }], 'Uma usina de concreto sobe junto com a torre.'],
    ['Reciclagem', [{ flag: 'recycle', text: 'Material parado no térreo é vendido aos poucos' }], 'Sobra de obra vira dinheiro em vez de entulho.'],
  ],
  log: [
    ['Elevador expresso', [{ flag: 'express', text: 'Tempo de viagem cresce mais devagar com a altura (altura^0,85)' }], 'Trechos sem parada aceleram as viagens longas.'],
    ['Teletransporte de carga', [{ flag: 'teleport', text: 'Viagens dos elevadores contam no máximo 20 km de altura' }], 'Acima de 20 km, a distância deixa de importar.'],
  ],
  eng: [
    ['Fundação flutuante', [{ flag: 'floatFound', text: 'Cada nível de Fundação reforçada triplica o limite, em vez de dobrar' }], 'A torre se apoia em empuxo, não só em estacas.'],
    ['Pré-fabricação total', [{ flag: 'prefab', text: 'Material por andar cresce muito menos com a altura e a era' }], 'Andares saem prontos da fábrica.'],
  ],
  merc: [
    ['Corretor agressivo', [{ s: 'sale', more: 2 }, { s: 'rent', more: .7 }], 'Vender rende o dobro; inquilinos fogem da pressão.'],
    ['Banco próprio', [{ s: 'credit', more: 2 }, { s: 'interest', more: .5 }], 'A construtora vira seu próprio banco.'],
  ],
  cien: [
    ['Automação noturna', [{ s: 'offline', add: 16 * 3600 }], 'A obra continua até 24 h sem você.'],
    ['Gravidade controlada', [{ flag: 'gravity', text: 'Elevadores ficam mais rápidos quanto mais alta a torre' }], 'Quanto mais alto, mais leve a carga.'],
  ],
};

const BRIDGE_NAMES = ['Almoxarifado no andar', 'Carga sincronizada', 'Içamento calculado', 'Engenharia de valor', 'Pesquisa de mercado', 'Ergonomia científica'];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

const scaleEff = (e, k) => {
  const f = 1 + 0.15 * (k - 1);
  if (e.inc !== undefined) return { s: e.s, inc: Math.round(e.inc * f * 1000) / 1000 };
  if (e.add !== undefined) return { s: e.s, add: Math.round(e.add * f) };
  return e;
};

export const NODES = {};
export const EDGES = [];

function node(id, o) { NODES[id] = { id, ...o }; return id; }
function edge(a, b) { EDGES.push([a, b]); }
const polar = (r, a) => [Math.round(r * Math.cos(a)), Math.round(r * Math.sin(a))];

node(CENTER, { b: null, ring: 0, kind: 'start', name: 'Escritório central', eff: [{ text: 'Ponto de partida da árvore' }], cost: 0, x: 0, y: 0 });

TBRANCHES.forEach((br, bi) => {
  const th = (-90 + 60 * bi) * Math.PI / 180;
  let anchor = CENTER;
  for (let k = 1; k <= RINGS; k++) {
    const r0 = k === 1 ? 0 : ringRadius(k - 1), r1 = ringRadius(k), span = r1 - r0;
    const dl = r => Math.min(0.28, 46 / r);
    const smallCost = 1 + Math.floor((k - 1) / 2);
    const sa = SMALL[br.id].a, sbRaw = SMALL[br.id].b, sb = typeof sbRaw === 'function' ? sbRaw(k) : sbRaw;
    const ra1 = r0 + span / 3, ra2 = r0 + span * 2 / 3, rb = r0 + span / 2;
    const a1 = node(`${br.id}-${k}-a1`, { b: br.id, ring: k, kind: 'small', name: 'Melhoria de ' + br.n, eff: [scaleEff(sa, k)], cost: smallCost, ...xy(polar(ra1, th - dl(ra1))) });
    const a2 = node(`${br.id}-${k}-a2`, { b: br.id, ring: k, kind: 'small', name: 'Melhoria de ' + br.n, eff: [scaleEff(sa, k)], cost: smallCost, ...xy(polar(ra2, th - dl(ra2))) });
    const b1 = node(`${br.id}-${k}-b1`, { b: br.id, ring: k, kind: 'small', name: 'Especialização de ' + br.n, eff: [scaleEff(sb, k)], cost: smallCost + 1, ...xy(polar(rb, th + dl(rb))) });
    const [nm, ne] = NOTABLE[br.id][k - 1];
    const N = node(`${br.id}-${k}-N`, { b: br.id, ring: k, kind: 'notable', name: nm, eff: ne, cost: 3 + k, ...xy(polar(r1, th)) });
    edge(anchor, a1); edge(a1, a2); edge(a2, N); edge(anchor, b1); edge(b1, N);
    if (k === 4 || k === 7) {
      const [kn, ke, kd] = KEYSTONE[br.id][k === 4 ? 0 : 1];
      const pos = k === 4 ? polar(r1 + 70, th + 0.26) : polar(r1 + 85, th);
      const K = node(`${br.id}-K${k}`, { b: br.id, ring: k, kind: 'key', name: kn, eff: ke, desc: kd, cost: 10 + 2 * k, ...xy(pos) });
      edge(N, K);
    }
    anchor = N;
  }
});

// pontes entre ramos vizinhos nos anéis 2, 4 e 6
TBRANCHES.forEach((br, bi) => {
  const nx = TBRANCHES[(bi + 1) % TBRANCHES.length];
  const th = (-60 + 60 * bi) * Math.PI / 180;
  for (const k of [2, 4, 6]) {
    const v = Math.round(0.05 * k * 100) / 100;
    const id = node(`ponte-${br.id}-${k}`, {
      b: null, bridge: [br.id, nx.id], ring: k, kind: 'bridge', name: `${BRIDGE_NAMES[bi]} ${ROMAN[k / 2]}`,
      eff: [scaleEff({ ...SMALL[br.id].a, inc: v }, 1), scaleEff({ ...SMALL[nx.id].a, inc: v }, 1)],
      cost: 2 + Math.floor(k / 2), ...xy(polar(ringRadius(k), th)),
    });
    edge(`${br.id}-${k}-N`, id); edge(id, `${nx.id}-${k}-N`);
  }
});

function xy([x, y]) { return { x, y }; }

export const ADJ = {};
Object.keys(NODES).forEach(id => ADJ[id] = []);
EDGES.forEach(([a, b]) => { ADJ[a].push(b); ADJ[b].push(a); });

// era que abre o anel k
export const ringEra = k => Math.max(0, k - 1);
export const ringEraName = k => ERAS[ringEra(k)].n;
export const KIND_LABEL = { start: 'Início', small: 'Nó pequeno', notable: 'Notável', key: 'Nó-chave', bridge: 'Ponte' };
