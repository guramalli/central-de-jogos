// Árvore de Melhorias (modo Obra Viva): posição de cada melhoria na aba do seu ramo.
// [coluna, linha, de onde sai a linha] — linha 0 é a base do ramo, embaixo no centro.
export const SKILL_LAYOUT = {
  forn: { fornec: [0, 1], caminhao: [0, 2, 'fornec'], olaria: [0, 3, 'caminhao'], premold: [0, 4, 'olaria'] },
  log: { elevador: [-1, 1], cacamba: [0, 1], motor: [1, 1], maglev: [0, 2, 'cacamba'] },
  obra: { pedreiro: [-1, 1], ferram: [1, 1], treino: [-1, 2, 'pedreiro'], mestre: [1, 2, 'ferram'] },
  eng: { fundacao: [0, 1], guindaste: [-1, 2, 'fundacao'], projeto: [1, 2, 'fundacao'] },
  merc: { corretor: [-1, 1], bilheteria: [0, 1], aluguel: [1, 1], marketing: [0, 2, 'bilheteria'], banco: [1, 2, 'aluguel'], heliponto: [-1, 3, 'marketing'], porto: [0, 4, 'heliponto'] },
};
