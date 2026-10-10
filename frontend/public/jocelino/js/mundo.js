// Jocelino — mundo.js — os lugares do mundo maior (vida de dia, etapa 1): a mata aberta desde o começo, a praia que
// abre com a carta do Seu Lourival (dia 2) e a pedreira com a do Seu Tonico (dia 5), como a mina do Stardew no dia 5.
// Antes de abrir, a saída explica e não deixa passar (personagens.js).

const LUGARES_CARTA = { praia: 'lourival_praia', pedreira: 'tonico_pedreira' };
Object.assign(CARTAS, {
  lourival_praia: { de: 'Seu Lourival', dia: 2, texto: 'Compadre Jocelino! Vem conhecer a praia: é só descer pela rua da Vila, sentido sul. A banca de peixe é minha, do lado do píer. Um dia te ensino a pescar.' },
  tonico_pedreira: { de: 'Seu Tonico', dia: 5, texto: 'Jocelino, a pedreira da Serra abriu: é seguir a estrada a leste da Vila. Pedra boa vale na obra e na caixa de venda, e lá embaixo tem ferro. Passa na ferraria quando quiser.' },
});
const Mundo = {
  aberto(id) { return !(id in LUGARES_CARTA) || !!(G.lugares && G.lugares[id]); },
  fechado(id) {
    if (Mundo.aberto(id)) return '';
    return id === 'praia' ? 'O caminho da praia está fechado por enquanto. (O Seu Lourival vai mandar notícia.)'
      : 'A estrada da pedreira está fechada por enquanto. (O Seu Tonico vai mandar notícia.)';
  },
};
// O save novo começa fechado; o save antigo abre o que já passou do dia da carta.
INICIADORES.push(s => {
  G.lugares = Object.assign({ praia: G.dia >= 2, pedreira: G.dia >= 5 }, s.lugares || {});
  G.diaPedreira = s.diaPedreira || 0;
});
COLETORES.push(s => { s.lugares = Object.assign({}, G.lugares); s.diaPedreira = G.diaPedreira; });
MANHA.push(() => { for (const id in LUGARES_CARTA) if (!G.lugares[id] && G.dia >= CARTAS[LUGARES_CARTA[id]].dia) G.lugares[id] = true; });
