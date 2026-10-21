// Árvore única de avanços (modo Obra Viva): um tronco (a obra) embaixo no centro e cinco ramos subindo lado a lado.
// Embaixo, as compras do dia a dia; acima, uma fileira por era com as tecnologias de era (data/upgrades.js ERA_TECH).
// Tudo com dinheiro — a Pesquisa saiu (decisão do usuário). Coordenadas em unidades do SVG, com y para cima.
import { ERA_TECH } from './upgrades.js';
import { FLAGS } from './flags.js';

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
  merc: { aluguel: [-0.6, 1], bilheteria: [0.6, 1], marketing: [0.6, 2, 'bilheteria'], imoveis: [-0.6, 2, 'aluguel'], heliponto: [-0.6, 3] },
};
// tecnologias de era: uma por era no centro da coluna, ligadas à compra (ou tecnologia) de baixo
const LINK0 = { obra: 'mestre', forn: 'premold', log: 'maglev', eng: 'projeto', merc: 'heliponto' };
// cada era tem um par (escolha 1 de 2): a original à esquerda e a alternativa à direita, as duas ligadas à fileira de baixo
for (const b of COLS) {
  let prev = LINK0[b];
  const base = Object.keys(ERA_TECH).filter(k => ERA_TECH[k].b === b && !isAlt(k)).sort((x, y) => ERA_TECH[x].era - ERA_TECH[y].era);
  for (const k of base) {
    const r = ERA_ROW0 + ERA_TECH[k].era, alt = ERA_TECH[k].pair;
    SKILL_LAYOUT[b][k] = [alt ? -0.66 : 0, r, prev, 'tech'];
    if (alt) SKILL_LAYOUT[b][alt] = [0.66, r, prev, 'tech'];
    prev = k;
  }
}
function isAlt(k) { const p = ERA_TECH[k].pair; return !!p && Object.keys(ERA_TECH).indexOf(k) > Object.keys(ERA_TECH).indexOf(p); }
// o porto espacial só abre a 100 km: fica na fileira da era do Espaço, ao lado do Turismo espacial
SKILL_LAYOUT.merc.porto = ERA_TECH.turismoEsp ? [1.4, ERA_ROW0 + ERA_TECH.turismoEsp.era, 'condominioOrbital'] : [0, 4]; // Mercado é a última coluna: sobra espaço à direita

// protótipo com risco: as defesas ficam ao lado das compras de Engenharia e Mão de obra
if (FLAGS.risco) {
  Object.assign(SKILL_LAYOUT.eng, { contravento: [-0.75, 2, 'fundacao'], sondagem: [0.75, 2, 'fundacao'], clima: [0.75, 3, 'sondagem'], manutencao: [-0.75, 3, 'contravento'] });
  Object.assign(SKILL_LAYOUT.obra, { seguranca: [0.75, 2, 'pedreiro'] });
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
  usina: 'Usina', siderurgica: 'Siderúrgica', usinaTopo: 'Usina topo', fabrica: 'Fábrica', asteroides: 'Asteroides',
  cabos: 'Cabos', expresso: 'Expresso', pressurizada: 'Pressuriz.', linear: 'Linear', teleporte: 'Teleporte',
  calculo: 'Cálculo', prefab: 'Pré-fabricação', flutuante: 'Fund. flutuante', amortecedor: 'Amortecedor', gravidade: 'Gravidade',
  imobiliaria: 'Imobiliária', agencia: 'Agência', hotelNuvens: 'Hotel', publicidade: 'Publicidade', turismoEsp: 'Turismo esp.',
  argamassa: 'Argamassa', parafusada: 'Parafusada', turnoNoite: 'Turno noite', impressao3d: 'Impressão 3D', exoesqueleto: 'Exoesqueleto',
  concretoAD: 'Concreto AD', vidroSolar: 'Vidro solar', modulosProntos: 'Módulos', nanotubos: 'Nanotubos', reciclagem: 'Reciclagem',
  gaiolaDupla: 'Gaiola dupla', contrapeso: 'Contrapeso', esteira: 'Esteira', tuboPneumatico: 'Tubo', elevadorEspacial: 'Cabo esp.',
  estacas: 'Estacas', fundacaoBarata: 'Fund. série', contrafortes: 'Contrafortes', grafeno: 'Grafeno', ancoraOrbital: 'Âncora',
  contravento: 'Contravento', sondagem: 'Sondagem', clima: 'Clima', seguranca: 'Segurança', manutencao: 'Manutenção',
  imoveis: 'Imóveis', corretores: 'Corretores', lojas: 'Lojas', eventos: 'Eventos', leilao: 'Leilão', condominioOrbital: 'Condomínio',
};
