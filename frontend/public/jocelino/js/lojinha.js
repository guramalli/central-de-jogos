// Jocelino — lojinha.js — a lojinha da Rosa (roteiro ditado em 13/10: "depois que ele receber o pagamento... um diálogo com a
// mulher dele para que ela conte que tem muita vontade de abrir um restaurante e que estão vendendo aquela lojinha, e ela está
// querendo comprar; ela tem um sonho de ter um restaurante 5 estrelas"). Como é no Stardew: a primeira compra grande (a reforma
// da casa com a Robin) é a meta do dinheiro, à vista. Aqui: a entrada abre a chave (e a reforma); as parcelas saem aos domingos.
const Lojinha = {
  estado() { return G.lojinha; },
  comprada() { return !!G.lojinha && G.lojinha.comprada; },
  // (revisão final) Da conversa até a compra, a entrada é a meta do dinheiro: a barrinha sob o relógio e o resumo da noite dizem o
  // mesmo que o cartão ("A lojinha da Rosa: Cr$ 300/2.000"), no lugar do Bazar.
  metaDinheiro() {
    const L = G.lojinha; if (!L || !L.conversou || L.comprada) return null;
    const m = ECO.lojinha.entrada, f = Math.max(0, Math.min(G.dinheiro, m)), mil = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return { texto: `A lojinha da Rosa: Cr$\u00a0${mil(f)}/${mil(m)}`, curto: `Lojinha da Rosa: Cr$\u00a0${mil(f)}/${mil(m)}`, feito: f, meta: m };   // (curto: a barrinha estreita)
  },
  comprar() {
    const L = G.lojinha;
    if (L.comprada) return 'ja';
    if (!L.conversou) return 'sem_conversa';
    if (G.dinheiro < ECO.lojinha.entrada) return 'sem_dinheiro';
    G.dinheiro -= ECO.lojinha.entrada; G.gastoHoje = (G.gastoHoje || 0) + ECO.lojinha.entrada;
    L.comprada = true; G.pensao.abrirReforma();
    // A missão da pensão abre na hora (e não só na manhã seguinte): o Agora e a seta já falam da reforma. Abre só ela (o tique inteiro
    // abriria também as outras missões de carta, que são do dia seguinte).
    const gm = typeof Guia !== 'undefined' ? Guia.missao('pensao') : null, g = G.guia;
    if (g && gm && !g.abertas.includes('pensao') && !g.feitas.includes('pensao') && Guia.podeAbrir(gm)) { Guia._abrir(gm); if (Guia.feita(gm)) Guia._fechar(gm); }
    // (revisão final) A carta da venda ("a chave fica comigo até lá") já cumpriu o papel: sai da caixa, para não tomar o Agora e a seta.
    if (G.correio) { G.correio.caixa = G.correio.caixa.filter(x => x !== 'cotinha_pensao'); if (!G.correio.lidas.includes('cotinha_pensao')) G.correio.lidas.push('cotinha_pensao'); }
    hudSujo();
    return 'ok';
  },
};
INICIADORES.push(s => {
  const l = s.lojinha;
  // O save antigo: com a pensão já aberta, pronta ou em reforma, a lojinha conta como comprada e quitada (revisão final, decisão do
  // controlador: quem estava na reforma de antes não comprou nada, então não paga parcela).
  const e = s.pensao && s.pensao.estado, velha = !l && e && e !== 'fechada';
  G.lojinha = l ? Object.assign({ sonho: false, conversou: false, comprada: false, pagas: 0, quitada: false }, l)
    : { sonho: !!velha, conversou: !!velha, comprada: !!velha, pagas: velha ? ECO.lojinha.parcelas : 0, quitada: !!velha };
});
COLETORES.push(s => { s.lojinha = Object.assign({}, G.lojinha); });
// A primeira diária do Bira: a Rosa quer conversar (o "Agora" e a seta da primeira vez levam até ela).
function lojinhaDepoisDaDiaria() { if (G.lojinha && !G.lojinha.sonho) { G.lojinha.sonho = true; hudSujo(); } }
// A conversa (a Rosa no quintal ou em casa): o sonho, a lojinha da Dona Cotinha e o preço.
ANTES_DE_CONVERSAR.push(p => {
  if (p.id !== 'rosa' || !G.lojinha || !G.lojinha.sonho || G.lojinha.conversou) return false;
  G.lojinha.conversou = true;
  if (G.correio && !G.correio.caixa.includes('cotinha_pensao') && !G.correio.lidas.includes('cotinha_pensao')) G.correio.caixa.push('cotinha_pensao');
  abrirConversa('Rosa', urlArte('retratos/rosa_alegre'), [
    'Jocelino, senta aqui. Primeira diária na mão... deixa eu te contar uma coisa que eu guardo desde a feira de Aracaju.',
    'Eu sempre sonhei em cozinhar pra fora. Um restaurante nosso: PF caprichado, moqueca de domingo, gente fazendo fila na porta.',
    `A Dona Cotinha tá vendendo a lojinha dela, a casa amarela na Vila, entre o depósito e a ferraria. Com Cr$ ${ECO.lojinha.entrada} de entrada ela entrega a chave, e o resto a gente paga aos domingos com o que a pensão render.`,
    'Um dia vai ser o melhor restaurante da Baixada. Cinco estrelas, Jocelino! Gente vindo de Santos, de São Paulo...',
  ]);
  sons.tocar('rosa_animada', 1, 0.05, -6); hudSujo();
  return true;
});
// As parcelas: no resumo do domingo, com dinheiro; sem dinheiro, fica para o próximo (sem multa: punição branda, como no Stardew).
NOITE.push(linhas => {
  const L = G.lojinha; if (!L || !L.comprada || L.quitada || (G.dia - 1) % 7 !== 6) return;
  const P = ECO.lojinha;
  if (G.dinheiro < P.parcela) { linhas.push(`Parcela da lojinha: ficou para o próximo domingo (faltam ${P.parcelas - L.pagas}).`); return; }
  G.dinheiro -= P.parcela; G.gastoHoje = (G.gastoHoje || 0) + P.parcela; L.pagas++;
  if (L.pagas >= P.parcelas) {
    L.quitada = true; linhas.push('Última parcela paga: a lojinha é toda da família! A Dona Cotinha mandou um abraço.');
    // A carta da Dona Cotinha chega na caixa na manhã seguinte (a noite grava, o correio avisa de manhã).
    if (G.correio && !G.correio.caixa.includes('cotinha_quitada') && !G.correio.lidas.includes('cotinha_quitada')) G.correio.caixa.push('cotinha_quitada');
  }
  else linhas.push(`Parcela da lojinha: Cr$ ${P.parcela} (faltam ${P.parcelas - L.pagas}).`);
});
// O "Agora": a Rosa quer conversar.
TAREFAS.push(() => G.lojinha && G.lojinha.sonho && !G.lojinha.conversou ? [{ texto: 'A Rosa quer conversar com você (no quintal)', urgente: true }] : []);
// (tarefa 7, o robô jogador) A entrada juntou: o Agora manda comprar (antes sugeria o regadorzinho e o Bazar com a barrinha cheia).
TAREFAS.push(() => { const L = G.lojinha; return L && L.conversou && !L.comprada && G.dinheiro >= ECO.lojinha.entrada ? [{ texto: `A entrada da lojinha (Cr$ ${String(ECO.lojinha.entrada).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}) já está no bolso: compre na fachada amarela, na Vila`, urgente: true }] : []; });
