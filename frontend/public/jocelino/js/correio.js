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
  fama_5: { de: 'Dona Cotinha', dia: 1e9, texto: 'Quatro estrelas, Casa Tradicional! Meu coração não aguenta. Com tanta gente, a Rosa vai precisar de ajuda: põe anúncio de ajudante. E a quinta estrela, dizem, só com o Paladar de cinco garfos e o troféu do concurso da Rádio, que é domingo sim, domingo não. Beijos da Cotinha.' },
  fama_6: { de: 'Dona Cotinha', dia: 1e9, texto: 'Cinco estrelas! Patrimônio da Vila! O Prefeito vai pôr uma placa de bronze na fachada e mandou um prêmio. A pedra da sopa, guardem com carinho: ela trouxe sorte pra todo mundo. Um beijo da Cotinha.' },
};
// (C10) espera: as cartas que podem esperar, [id, dia em que entrou na fila]; vistas: a caixa no fim da manhã (o que chegou depois é
// novo); ultimaEspera: o dia da última que saiu da fila; novidade: { id, dia } da carta lida hoje (a novidade do dia no Agora, cartao.js).
INICIADORES.push(s => { const c = s.correio || {}; G.correio = { caixa: (c.caixa || []).slice(), lidas: (c.lidas || []).slice(), espera: (c.espera || []).map(x => x.slice()), vistas: (c.vistas || []).slice(), ultimaEspera: c.ultimaEspera || 0, novidade: c.novidade || null }; });
COLETORES.push(s => { const c = G.correio; s.correio = { caixa: c.caixa.slice(), lidas: c.lidas.slice(), espera: (c.espera || []).map(x => x.slice()), vistas: (c.vistas || []).slice(), ultimaEspera: c.ultimaEspera || 0, novidade: c.novidade || null }; });
// (C10, 16/10; o teste crítico: a carta da Dona Zefa caía no dia 3, junto da mata e da lojinha, e do dia 10 ao 30 quase nada chegava)
// UMA NOVIDADE POR DIA. Como o correio do Stardew: a carta do Willy no dia 2, a do Marlon (a mina) no 5, a festa do ovo na véspera
// do dia 13 — uma por vez, e o que não tem pressa (a carta da mãe com os biscoitos) chega num dia qualquer. Aqui:
// - cartasNovasHoje(): as cartas que chegaram desde a manhã de ontem (as da noite — a estrela, a família — e as desta manhã: o VIP, a
//   festa, as de data). O guia não abre uma missão de carta numa manhã que já trouxe outra carta (guia.js, tique).
// - cartaQuePodeEsperar(id): a carta da família de Aracaju (afeto.js) vai para a fila e chega num DIA VAZIO: nenhuma carta nova, nenhum
//   sistema novo do guia hoje nem ontem, nenhum VIP ou festa hoje, nem o dia da inauguração ou o seguinte; ECO.guia.cartaFamilia.intervalo
//   dias depois da anterior. Passados maxEspera dias na fila, chega mesmo com a carta do guia (só a do VIP ou da festa a segura).
// - a carta de data (CARTAS[id].dia: a da Prefeitura, no dia 15) entra na mesma fila, marcada 'data', e chega na 1ª manhã sem outra carta.
// (a lista fica guardada no dia da 1ª consulta — a do guia, de manhã, antes da carta dele: a do guia conta pelo g.desde)
function cartasNovasHoje() {
  const c = G.correio; if (!c) return [];
  if (!c.manha || c.manha.dia !== G.dia) c.manha = { dia: G.dia, ids: c.caixa.filter(id => !(c.vistas || []).includes(id)) };
  return c.manha.ids;
}
const fechaManhaDoCorreio = () => { if (G.correio) G.correio.vistas = G.correio.caixa.slice(); };   // (o guia e o fim da manhã chamam)
function cartaQuePodeEsperar(id) {
  const c = G.correio; if (!c) return; c.espera = c.espera || [];
  if (c.caixa.includes(id) || c.lidas.includes(id) || c.espera.some(([x]) => x === id)) return;
  c.espera.push([id, G.dia]);
}
function diaVazio(dia = G.dia) {
  const g = G.guia, p = G.pensao;
  if (cartasNovasHoje().length) return false;
  if (g && Object.values(g.desde || {}).some(d => d === dia || d === dia - 1)) return false;
  if (p && p.abreDia > 0 && (dia === p.abreDia || dia === p.abreDia + 1)) return false;
  if (p && (p.agenda || []).some(e => e.dia === dia && !e.fim)) return false;
  return true;
}
// Fim da manhã (o MANHA de guia.js chama, depois do guia e da agenda da pensão): a carta da fila, se hoje é dia dela; e a caixa vista.
function entregaQuemEspera() {
  const c = G.correio; if (!c) return;
  const F = ECO.guia.cartaFamilia;
  const g = G.guia, cartaDoGuia = !!g && Object.values(g.desde || {}).some(d => d === G.dia), livre = !cartasNovasHoje().length && !cartaDoGuia;
  const chega = x => { c.espera = c.espera.filter(y => y !== x); c.caixa.push(x[0]);
    if (G.feitosHoje && !G.feitosHoje.includes('Chegou carta na caixa de correio.')) G.feitosHoje.push('Chegou carta na caixa de correio.'); };
  // a carta de data (a da Prefeitura, dia 15) vem na 1ª manhã sem outra carta; a da família, no dia vazio (ou passado o maxEspera)
  const d = (c.espera || []).find(x => x[2] === 'data'), f = (c.espera || []).find(x => x[2] !== 'data');
  if (d && livre) chega(d);
  // (revisão) passado o maxEspera, ela chega mesmo com a carta do guia; só a do VIP ou da festa (a noite marcada) a segura mais um dia
  else if (f && G.dia - (c.ultimaEspera || -99) >= F.intervalo && (diaVazio() || (G.dia - f[1] >= F.maxEspera && !cartasNovasHoje().some(id => /^(vip|festa)_/.test(id))))) { chega(f); c.ultimaEspera = G.dia; }
  fechaManhaDoCorreio();
}
// De manhã: chega o que é do dia (e não chegou antes). (C10) Pela fila: na 1ª manhã sem outra carta (entregaQuemEspera).
MANHA.push(() => {
  const c = G.correio; c.espera = c.espera || [];
  for (const id in CARTAS) if (G.dia >= CARTAS[id].dia && !c.caixa.includes(id) && !c.lidas.includes(id) && !c.espera.some(([x]) => x === id)) c.espera.push([id, G.dia, 'data']);
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
  G.correio.novidade = { id, dia: G.dia };   // (C10) a novidade do dia no Agora (cartao.js, novidadeDoDia), até as 16h
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
