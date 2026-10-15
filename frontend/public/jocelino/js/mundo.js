// Jocelino — mundo.js — os lugares do mundo maior (vida de dia, etapa 1): a mata aberta desde o começo, a praia que
// abre com a carta do Seu Lourival (dia 2) e a pedreira com a do Seu Tonico (dia 5), como a mina do Stardew no dia 5.
// Antes de abrir, a saída explica e não deixa passar (personagens.js).

const LUGARES_CARTA = { praia: 'lourival_praia', pedreira: 'tonico_pedreira' };
Object.assign(CARTAS, {
  lourival_praia: { de: 'Seu Lourival', dia: 2, anexo: { vara: 1 }, aoLer: () => { if (G.pesca) G.pesca.varaDada = true; }, texto: 'Compadre Jocelino! Vem conhecer a praia: é só descer pela rua da Vila, sentido sul. A banca de peixe é minha, do lado do píer. Toma uma vara de bambu, compadre: vira para a água, segura e solta. Da ponta do píer sai peixe melhor.' },
  tonico_pedreira: { de: 'Seu Tonico', dia: 5, texto: 'Jocelino, a pedreira da Serra abriu: é seguir a estrada a leste da Vila. Pedra boa vale na obra e na caixa de venda, e lá embaixo tem ferro. Passa na ferraria quando quiser.' },
});
// (T3 da mata, 15/10) A Mata da Serra, do outro lado da ponte da mata: abre na manhã seguinte à 1ª vez que a ponte é escorada (o
// serviço curto `escorar_ponte`, do Tio Juca; o dia fica em G.empreitas.consertados), com a carta do Seu Lourival. Cai cedo: o serviço
// sai nos primeiros dias do quadro. A carta não tem dia (1e9): só chega por aqui.
LUGARES_CARTA.serra = 'lourival_serra';
CARTAS.lourival_serra = { de: 'Seu Lourival', dia: 1e9, texto: 'Ponte firme, compadre! Do outro lado tem a trilha da Cachoeira Grande. Lá o rio dá tabarana. É só atravessar a ponte da mata e descer a trilha, sentido sul.' };
const ponteEscorada = () => (G.empreitas && G.empreitas.consertados && G.empreitas.consertados.escorar_ponte) || 0;
const Mundo = {
  aberto(id) { if (id === 'bairro') return !!(G.bairro && G.bairro.aberto); return !(id in LUGARES_CARTA) || !!(G.lugares && G.lugares[id]); },
  fechado(id) {
    if (Mundo.aberto(id)) return '';
    if (id === 'bairro') return 'O loteamento Bairro Novo ainda não foi aprovado. (A Prefeitura vai mandar carta.)';
    return id === 'praia' ? 'O caminho da praia está fechado por enquanto. (O Seu Lourival vai mandar notícia.)'
      : id === 'serra' ? 'Com a ponte bamba, o Tio Juca não deixa ninguém subir a trilha da serra. (Escorar a ponte é serviço do quadro da Vila.)'
      : 'A estrada da pedreira está fechada por enquanto. (O Seu Tonico vai mandar notícia.)';
  },
};
// O save novo começa fechado; o save antigo abre o que já passou do dia da carta.
INICIADORES.push(s => {
  G.lugares = Object.assign({ praia: G.dia >= 2, pedreira: G.dia >= 5, serra: false }, s.lugares || {});
  G.diaPedreira = s.diaPedreira || 0;
});
COLETORES.push(s => { s.lugares = Object.assign({}, G.lugares); s.diaPedreira = G.diaPedreira; });
MANHA.push(() => { for (const id in LUGARES_CARTA) if (!G.lugares[id] && G.dia >= CARTAS[LUGARES_CARTA[id]].dia) G.lugares[id] = true; });
// A serra: a ponte escorada num dia que já passou (o save de antes também: o dia do conserto já está no save) abre na manhã seguinte.
MANHA.push(() => {
  const d = ponteEscorada();
  if (G.lugares.serra || !d || d >= G.dia) return;
  G.lugares.serra = true;
  if (G.correio && !G.correio.caixa.includes('lourival_serra') && !G.correio.lidas.includes('lourival_serra')) {
    G.correio.caixa.push('lourival_serra');
    if (G.feitosHoje && !G.feitosHoje.includes('Chegou carta na caixa de correio.')) G.feitosHoje.push('Chegou carta na caixa de correio.');
  }
});
