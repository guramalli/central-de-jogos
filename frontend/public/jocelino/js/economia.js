// Jocelino — economia.js — os números da evolução da pensão num lugar só (PROVISÓRIOS: o plano do balanço ajusta
// tudo aqui, simulando 2 anos de jogo). Os sistemas leem daqui; nada de número solto espalhado pelo código.

const ECO = {
  // Recompensa de cada tipo de meta da Caderneta da Rosa.
  metas: {
    curtidas: { dinheiro: 40, pitadas: 2 }, nivel_prato: { dinheiro: 30, pitadas: 1 }, pesquisar: { dinheiro: 25, pitadas: 0 },
    servir_clientes: { dinheiro: 20 }, servir_bebida_medida: { dinheiro: 15, pitadas: 1 }, nota_noite: { dinheiro: 25, pitadas: 1 },
    caprichar: { pitadas: 1 }, contratar: { dinheiro: 20 }, melhoria: { pitadas: 2 },
  },
  metasAtivas: 3,
};
