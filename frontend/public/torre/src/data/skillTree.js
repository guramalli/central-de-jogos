// Árvore única de avanços (modo Obra Viva): um tronco (a obra) embaixo no centro e cinco ramos subindo lado a lado.
// Embaixo, as compras do dia a dia; acima, uma fileira por era com as tecnologias de era (data/upgrades.js ERA_TECH).
// Tudo com dinheiro — a Pesquisa saiu (decisão do usuário). Coordenadas em unidades do SVG, com y para cima.
import { ERA_TECH } from './upgrades.js';

export const COLS = ['obra', 'forn', 'log', 'eng', 'merc'];
export const BW = 300;                                 // largura de um ramo
export const SUB = 92;                                 // distância entre sub-colunas das compras
export const ROW = 140;                                // distância entre linhas das compras
export const ERA_ROW0 = 4;                             // tecnologia da era e fica na linha ERA_ROW0 + e
export const colX = b => (COLS.indexOf(b) - (COLS.length - 1) / 2) * BW;

// Compras com dinheiro (layout "colunas subindo", decidido com o usuário): [sub-coluna, linha, de onde sai a linha].
// As linhas seguem os pré-requisitos reais (req); quem só depende da altura da torre fica solto, sem linha.
export const SKILL_LAYOUT = {
  obra: { pedreiro: [0, 1], treino: [0, 2, 'pedreiro'], ferram: [0, 3, 'treino'], mestre: [0, 4, 'ferram'] },
  forn: { fornec: [0, 1], caminhao: [0, 2, 'fornec'], olaria: [0, 3, 'caminhao'], premold: [0, 4, 'olaria'] },
  log: { elevador: [-0.6, 1], motor: [0.6, 1], guindaste: [-0.6, 2, 'elevador'], cacamba: [0.6, 2, 'motor'], maglev: [0.6, 3, 'cacamba'] },
  eng: { fundacao: [0, 1], projeto: [0, 2, 'fundacao'] },
  merc: { aluguel: [-0.6, 1], bilheteria: [0.6, 1], marketing: [0.6, 2, 'bilheteria'], heliponto: [-0.6, 3], porto: [0, 4] },
};
// tecnologias de era: uma por era no centro da coluna, ligadas à compra (ou tecnologia) de baixo
const LINK0 = { obra: 'mestre', forn: 'premold', log: 'maglev', eng: 'projeto', merc: 'porto' };
for (const b of COLS) {
  let prev = LINK0[b];
  for (const k of Object.keys(ERA_TECH).filter(k => ERA_TECH[k].b === b).sort((x, y) => ERA_TECH[x].era - ERA_TECH[y].era)) {
    SKILL_LAYOUT[b][k] = [0, ERA_ROW0 + ERA_TECH[k].era, prev, 'tech']; prev = k;
  }
}

export const upgradePos = (b, k) => { const [c, r] = SKILL_LAYOUT[b][k]; return [colX(b) + c * SUB, r * ROW]; };
export const BASE_POS = [0, -40];

// nome curto embaixo do nó na árvore (o nome completo aparece no painel)
export const SHORT = {
  pedreiro: 'Pedreiro', treino: 'Treino', ferram: 'Ferramenta', mestre: 'Mestre',
  fornec: 'Fornecedor', caminhao: 'Caminhão', olaria: 'Olaria', premold: 'Pré-molde',
  elevador: 'Elevador', cacamba: 'Carrinho', motor: 'Motor', maglev: 'Magnético',
  fundacao: 'Fundação', guindaste: 'Guindaste', projeto: 'Projeto',
  corretor: 'Corretor', bilheteria: 'Turismo', aluguel: 'Aluguel', marketing: 'Marketing',
  banco: 'Banco', heliponto: 'Heliponto', porto: 'Porto espacial',
  escoramento: 'Escoramento', soldadores: 'Soldadores', mutirao: 'Mutirão', robos: 'Robôs', drones: 'Drones',
  usina: 'Usina de concreto', siderurgica: 'Siderúrgica', usinaTopo: 'Usina no topo', fabrica: 'Fábrica automática', asteroides: 'Asteroides',
  cabos: 'Cabos de aço', expresso: 'Expresso', pressurizada: 'Pressurizada', linear: 'Elevador linear', teleporte: 'Teletransporte',
  calculo: 'Cálculo', prefab: 'Pré-fabricação', flutuante: 'Fund. flutuante', amortecedor: 'Amortecedores', gravidade: 'Gravidade',
  imobiliaria: 'Imobiliária', agencia: 'Agência', hotelNuvens: 'Hotel nas nuvens', publicidade: 'Publicidade', turismoEsp: 'Turismo espacial',
};
