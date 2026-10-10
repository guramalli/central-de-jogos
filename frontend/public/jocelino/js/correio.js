// Jocelino — correio.js — a caixa de correio do quintal (o correio do Stardew): as cartas chegam de manhã, o envelope
// pula em cima da caixa e o botão direito lê. Fase 1: a carta da Dona Cotinha (dia 2) que abre a Pensão da Rosa.

const CARTAS = {
  cotinha_pensao: { de: 'Dona Cotinha', dia: 2,
    texto: 'Seu Jocelino, sou a Dona Cotinha, da pensão fechada na rua da Vila, entre o depósito e a ferraria. Me mudei pra Santos com a filha e a casa ficou largada. A Rosa me disse que sonha em cozinhar pra fora... A chave está com ela. Limpe o salão, troque as telhas e faça umas banquetas que a pensão é de vocês. Só peço uma coisa: não mexam na pedra da sopa.\n\nPS da Rosa: amor, eu já tenho até o cardápio!' },
};
INICIADORES.push(s => { G.correio = { caixa: (s.correio && s.correio.caixa || []).slice(), lidas: (s.correio && s.correio.lidas || []).slice() }; });
COLETORES.push(s => { s.correio = { caixa: G.correio.caixa.slice(), lidas: G.correio.lidas.slice() }; });
// De manhã: chega o que é do dia (e não chegou antes).
MANHA.push(() => {
  for (const id in CARTAS) if (G.dia >= CARTAS[id].dia && !G.correio.caixa.includes(id) && !G.correio.lidas.includes(id)) G.correio.caixa.push(id);
  if (G.correio.caixa.length) G.feitosHoje.push('Chegou carta na caixa de correio.');
});
TAREFAS.push(() => G.correio && G.correio.caixa.length ? [{ texto: 'Tem carta na caixa de correio' }] : []);
function abrirCorreio() {
  if (!G.correio.caixa.length) { abrirPlaca('A caixa de correio está vazia.'); return true; }
  const id = G.correio.caixa.shift();
  G.correio.lidas.push(id);
  const c = CARTAS[id];
  sons.tocar('letra', 1, 0.03, -4);
  abrirPlaca(c.texto, { quem: 'Carta de ' + c.de });
  return true;
}
// O envelope pulando em cima da caixa (como no Stardew).
const _desenhaCaixaCorreio = desenhaMapa;
desenhaMapa = function (ctx) {
  _desenhaCaixaCorreio(ctx);
  if (G.mapaId !== 'quintal' || !G.correio || !G.correio.caixa.length) return;
  const cx = G.mapa.objs.find(o => o.id === 'caixa_correio');
  if (!cx) return;
  const y = cx.y - 110 + Math.sin(G.agora * 5) * 5;
  desenhaFx(ctx, 'envelope', cx.x, y + 11);
};
