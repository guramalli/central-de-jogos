// Árvore única de avanços (modo Obra Viva): um tronco (a obra) embaixo no centro e seis ramos subindo lado a lado.
// Embaixo de cada ramo ficam as melhorias compradas com dinheiro; acima delas, as estrelas de Pesquisa
// (pagas com Pontos de Engenharia), anel por anel — a árvore cresce para cima conforme as eras abrem os anéis.
// Coordenadas em unidades do SVG, com y para cima (o SVG inverte na hora de desenhar).
import { NODES, CENTER, TBRANCHES } from './talents.js';

// ordem das colunas = ordem dos ramos da Pesquisa, para as pontes ligarem colunas vizinhas
export const COLS = TBRANCHES.map(b => b.id);          // obra, forn, log, eng, merc, cien
export const BW = 300;                                 // largura de um ramo
export const SUB = 92;                                 // distância entre sub-colunas das compras
export const ROW = 100;                                // distância entre linhas das compras
export const RES0 = 560, RING = 270;                   // onde começa a Pesquisa e altura de cada anel
export const colX = b => (COLS.indexOf(b) - (COLS.length - 1) / 2) * BW;

// Compras com dinheiro: [sub-coluna, linha, de onde sai a linha] — linha 1 logo acima do tronco
export const SKILL_LAYOUT = {
  forn: { fornec: [0, 1], caminhao: [0, 2, 'fornec'], olaria: [0, 3, 'caminhao'], premold: [0, 4, 'olaria'] },
  log: { elevador: [-1, 1], cacamba: [0, 1], motor: [1, 1], maglev: [0, 2, 'cacamba'] },
  obra: { pedreiro: [-1, 1], ferram: [1, 1], treino: [-1, 2, 'pedreiro'], mestre: [1, 2, 'ferram'] },
  eng: { fundacao: [0, 1], guindaste: [-1, 2, 'fundacao'], projeto: [1, 2, 'fundacao'] },
  merc: { corretor: [-1, 1], bilheteria: [0, 1], aluguel: [1, 1], marketing: [0, 2, 'bilheteria'], banco: [1, 2, 'aluguel'], heliponto: [-1, 3, 'marketing'], porto: [0, 4, 'heliponto'] },
};

export const upgradePos = (b, k) => { const [c, r] = SKILL_LAYOUT[b][k]; return [colX(b) + c * SUB, r * ROW]; };
export const BASE_POS = [0, -40];

// Posição de um nó de Pesquisa (ids de data/talents.js)
export function researchPos(id) {
  if (id === CENTER) return BASE_POS;
  const n = NODES[id];
  const ringY = k => RES0 + (k - 1) * RING;
  if (n.kind === 'bridge') { // na divisa entre os dois ramos que ela liga, à altura do notável do anel
    const [a] = n.bridge;
    return [colX(a) + BW / 2, ringY(n.ring) + 205];
  }
  const x = colX(n.b), y = ringY(n.ring);
  if (n.kind === 'key') return [x + 92, y + 262];
  const part = id.split('-').pop();
  if (part === 'a1') return [x - 68, y + 40];
  if (part === 'a2') return [x - 68, y + 115];
  if (part === 'b1') return [x + 68, y + 78];
  return [x, y + 180]; // notável
}

// melhoria do ramo de onde sai a linha pontilhada até o 1º anel de Pesquisa (a mais alta do ramo)
export function researchRoot(b) {
  const L = SKILL_LAYOUT[b]; if (!L) return null;
  return Object.keys(L).sort((p, q) => L[q][1] - L[p][1] || Math.abs(L[p][0]) - Math.abs(L[q][0]))[0];
}

// nome curto embaixo do nó na árvore (o nome completo aparece no painel)
export const SHORT = {
  pedreiro: 'Pedreiro', treino: 'Treino', ferram: 'Ferramenta', mestre: 'Mestre',
  fornec: 'Fornecedor', caminhao: 'Caminhão', olaria: 'Olaria', premold: 'Pré-molde',
  elevador: 'Elevador', cacamba: 'Carrinho', motor: 'Motor', maglev: 'Magnético',
  fundacao: 'Fundação', guindaste: 'Guindaste', projeto: 'Projeto',
  corretor: 'Corretor', bilheteria: 'Turismo', aluguel: 'Aluguel', marketing: 'Marketing',
  banco: 'Banco', heliponto: 'Heliponto', porto: 'Porto espacial',
};
