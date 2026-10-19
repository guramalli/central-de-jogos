// Árvore única de avanços (modo Obra Viva): um tronco (a obra) embaixo no centro e seis ramos subindo lado a lado.
// Embaixo de cada ramo ficam as melhorias compradas com dinheiro; acima delas, as estrelas de Pesquisa
// (pagas com Pontos de Engenharia), anel por anel — a árvore cresce para cima conforme as eras abrem os anéis.
// Coordenadas em unidades do SVG, com y para cima (o SVG inverte na hora de desenhar).
import { NODES, CENTER, TBRANCHES } from './talents.js';

// ordem das colunas = ordem dos ramos da Pesquisa, para as pontes ligarem colunas vizinhas
export const COLS = TBRANCHES.map(b => b.id);          // obra, forn, log, eng, merc, cien
export const BW = 300;                                 // largura de um ramo
export const SUB = 92;                                 // distância entre sub-colunas das compras
export const ROW = 140;                                // distância entre linhas das compras
export const RES0 = 720, RING = 270;                   // onde começa a Pesquisa e altura de cada anel
export const colX = b => (COLS.indexOf(b) - (COLS.length - 1) / 2) * BW;

// Compras com dinheiro (layout "colunas subindo", decidido com o usuário): [sub-coluna, linha, de onde sai a linha].
// As linhas seguem os pré-requisitos reais (req); quem só depende da altura da torre fica solto, sem linha.
export const SKILL_LAYOUT = {
  obra: { pedreiro: [0, 1], treino: [0, 2, 'pedreiro'], ferram: [0, 3, 'treino'], mestre: [0, 4, 'ferram'] },
  forn: { fornec: [0, 1], caminhao: [0, 2, 'fornec'], olaria: [0, 3, 'caminhao'], premold: [0, 4, 'olaria'] },
  log: { elevador: [-0.6, 1], motor: [0.6, 1], cacamba: [0.6, 2, 'motor'], maglev: [0.6, 3, 'cacamba'] },
  eng: { fundacao: [0, 1], guindaste: [-0.6, 2, 'fundacao'], projeto: [0.6, 2, 'fundacao'] },
  merc: { aluguel: [-0.6, 1], bilheteria: [0.6, 1], marketing: [0.6, 2, 'bilheteria'], heliponto: [-0.6, 3], porto: [0, 4] },
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

// nome curto embaixo do nó na árvore (o nome completo aparece no painel)
export const SHORT = {
  pedreiro: 'Pedreiro', treino: 'Treino', ferram: 'Ferramenta', mestre: 'Mestre',
  fornec: 'Fornecedor', caminhao: 'Caminhão', olaria: 'Olaria', premold: 'Pré-molde',
  elevador: 'Elevador', cacamba: 'Carrinho', motor: 'Motor', maglev: 'Magnético',
  fundacao: 'Fundação', guindaste: 'Guindaste', projeto: 'Projeto',
  corretor: 'Corretor', bilheteria: 'Turismo', aluguel: 'Aluguel', marketing: 'Marketing',
  banco: 'Banco', heliponto: 'Heliponto', porto: 'Porto espacial',
};
