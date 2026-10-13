// Jocelino — correio.js — a caixa de correio do quintal (o correio do Stardew): as cartas chegam de manhã, o envelope
// pula em cima da caixa e o botão direito lê. Fase 1: a carta da Dona Cotinha (dia 2) que abre a Pensão da Rosa.

const CARTAS = {
  // (roteiro de 13/10) A carta só chega pela conversa da Rosa (dia 1e9): a venda da lojinha, com entrada e parcelas.
  cotinha_pensao: { de: 'Dona Cotinha', dia: 1e9,
    texto: 'Seu Jocelino, a Rosa me contou do sonho dela. A lojinha é de vocês por Cr$ 2.000 de entrada, e o resto a gente acerta aos domingos, Cr$ 500 por vez. A chave fica comigo até lá: é só passar na porta. Só peço uma coisa: não mexam na pedra da sopa. Da Cotinha.' },
  // (roteiro de 13/10) Quitada a lojinha, a carta de despedida da dívida (só chega pela última parcela).
  cotinha_quitada: { de: 'Dona Cotinha', dia: 1e9, texto: 'Seu Jocelino, a Rosa me contou que foi paga a última parcela. A lojinha é toda de vocês, e não me deve mais nada. Me deu um aperto bom no peito: casa de comida precisa de gente que cozinhe com capricho. Guardem a pedra da sopa com carinho, ela traz sorte. Um abraço grande da Cotinha.' },
  fama_2: { de: 'Dona Cotinha', dia: 1e9, texto: 'Seu Jocelino, a primeira estrela! Até em Santos já falam do boteco da Rosa: disseram que o PF dela dá sustância pra levantar três paredes. Agora cabe mais um prato no quadro. Um abraço da Cotinha.' },
  fama_3: { de: 'Dona Cotinha', dia: 1e9, texto: 'Duas estrelas! A pensão está falada na Vila inteira, a Zélia me escreveu contando. Dica de velha: pesquise receita nova com a Rosa — gente gosta de novidade no quadro. Da Cotinha.' },
  fama_4: { de: 'Dona Cotinha', dia: 1e9, texto: 'Três estrelas, Pensão Famosa! Quem diria, a minha casa velha. Saiu até uma notinha no jornal de Praia Grande. Agora vem gente de fora e vem crítico: o Doutor Paladar passa uma vez por estação, disfarçado. Capricha! Da Cotinha.' },
  fama_5: { de: 'Dona Cotinha', dia: 1e9, texto: 'Quatro estrelas, Casa Tradicional! Meu coração não aguenta. Com tanta gente, a Rosa vai precisar de ajuda: põe anúncio de ajudante. E a quinta estrela, dizem, só com o Paladar contente duas vezes e o troféu do concurso da Rádio. Beijos da Cotinha.' },
  fama_6: { de: 'Dona Cotinha', dia: 1e9, texto: 'Cinco estrelas! Patrimônio da Vila! O Prefeito vai pôr uma placa de bronze na fachada e mandou um prêmio. A pedra da sopa, guardem com carinho: ela trouxe sorte pra todo mundo. Um beijo da Cotinha.' },
};
INICIADORES.push(s => { G.correio = { caixa: (s.correio && s.correio.caixa || []).slice(), lidas: (s.correio && s.correio.lidas || []).slice() }; });
COLETORES.push(s => { s.correio = { caixa: G.correio.caixa.slice(), lidas: G.correio.lidas.slice() }; });
// De manhã: chega o que é do dia (e não chegou antes).
MANHA.push(() => {
  for (const id in CARTAS) if (G.dia >= CARTAS[id].dia && !G.correio.caixa.includes(id) && !G.correio.lidas.includes(id)) G.correio.caixa.push(id);
  if (G.correio.caixa.length) G.feitosHoje.push('Chegou carta na caixa de correio.');
});
// (Frente 4: a carta que o guia já anuncia no quadro, com quem mandou, não repete o aviso genérico)
TAREFAS.push(() => G.correio && G.correio.caixa.some(id => !(typeof Guia !== 'undefined' && Guia.cartaNaTela(id))) ? [{ texto: 'Tem carta na caixa de correio' }] : []);
function abrirCorreio() {
  if (!G.correio.caixa.length) { abrirPlaca('A caixa de correio está vazia.'); return true; }
  const id = G.correio.caixa.shift();
  G.correio.lidas.push(id);
  const c = CARTAS[id];
  if (!c) return abrirCorreio();   // carta de um evento que já passou
  sons.tocar('letra', 1, 0.03, -4);
  abrirPlaca(c.texto, { quem: 'Carta de ' + c.de, depois: c.depois });
  if (c.anexo) for (const it in c.anexo) { const sobra = G.mochila.adicionar(it, c.anexo[it]); if (sobra) soltar(it, sobra, G.jog.x, G.jog.y); avisar('+ ' + Itens.qtd(c.anexo[it], it)); hudSujo(); }
  if (c.aoLer) c.aoLer();
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
