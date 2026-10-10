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
  // Panela da noite: quantas porções rende uma panela de cada prato (o "postar no cardápio" do Bancho).
  porcoes: { pf_peao: 4, peixe_frito: 4, sopa_pedra: 6, cocada_tijolinho: 6, rabanada: 4, marmita_peao: 4, pamonha: 4, goiabada: 6, bolo_milho: 6, caldo_caranguejo: 4, moqueca: 4 },
  porcoesPadrao: 4,
  marmitasMax: 3,          // a sobra vira marmita (a família come o resto)
  cafeBoasVindas: 1.3,     // cafezinho na medida antes do prato: +30% no preço
  // Caprichar (o Enhance do Bancho): +30% do preço base por nível; porções +50% no nível 10.
  precoPorNivel: 0.30, porcoesNivel10: 0.5,
  // A Rosa como chef: experiência por prato que sai, que sobe 1,35× por nível; preparo 4% mais rápido por nível.
  chef: { xpBase: 40, xpCresce: 1.35, preparoPorNivel: 0.04 },
  taxaContratacao: 0.5,    // taxa de contratação = soma dos atributos × isto
};
