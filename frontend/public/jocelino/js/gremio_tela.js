// Jocelino — gremio_tela.js — o Grêmio na Vila: o prédio (a arte muda com as alas prontas), fechado antes do dia da carta, a
// lista do povo (as alas, os pacotes e o Entregar), a marquinha da mochila, a carta da Dona Zélia e a noite do baile.
const GREMIO_PE = [30, 23, 6, 4];   // x, y, largura e altura na Vila (a s27 confere que é livre; um abaixo da roda de samba)
PLACAS.gremio = 'Grêmio Recreativo Vila Maré';
const estagioGremio = () => { const n = Object.keys(G.gremio.alas).length; return n >= 6 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0; };
function poeGremio(b) {
  if (!b || b.id !== 'vila' || !G.gremio) return;
  let o = b.objs.find(x => x.id === 'gremio');
  if (!o) { o = b.interativo('gremio', 'objetos/gremio_0', ...GREMIO_PE); o.acao = () => abrirGremio(); }
  o.nome = 'objetos/gremio_' + estagioGremio();
}
AO_MONTAR.push(b => poeGremio(b));
function abrirGremio() {
  if (!Gremio.aberto()) { abrirPlaca('O Grêmio Recreativo Vila Maré: fechado há anos. Pela janela, o salão do baile cheio de poeira.'); return true; }
  if (G.guia) G.guia.cont.gremio = (G.guia.cont.gremio || 0) + 1;
  const caixa = el('div', { class: 'painel gremio', style: `background-image:url(${urlArte('ui/lista_povo')})` });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, 'A lista do povo — Grêmio Recreativo Vila Maré'));
    for (const a of GREMIO_ALAS) {
      const aberta = Gremio.alaAberta(a.id), pronta = Gremio.alaPronta(a.id);
      const bloco = el('div', { class: 'gr-ala' + (pronta ? ' pronta' : aberta ? '' : ' fechada') }, el('div', { class: 'gr-nome' }, a.nome + (pronta ? ' — pronta!' : ''), el('span', { class: 'gr-efeito' }, a.efeito)));
      if (!aberta) bloco.append(el('div', { class: 'gr-falta' }, `Fechada: entregue mais ${ECO.gremio.abre[a.id] - G.gremio.prontos.length} pacote(s) para abrir.`));
      else if (!pronta) for (const pid of a.pacotes) {
        const P = Gremio.pacote(pid), ok = Gremio.pronto(pid), f = Gremio.falta(pid), e = G.gremio.entregue[pid] || {};
        const itens = P.dinheiro ? [el('span', { class: 'gr-item' }, `Cr$ ${e.dinheiro || 0} de ${P.dinheiro}`)]
          : Object.keys(P.itens).map(id => el('span', { class: 'gr-item' + (f[id] ? '' : ' ok'), title: Itens.nome(id) }, el('img', { src: urlItem(id) }), ` ${e[id] || 0}/${P.itens[id]}`));
        bloco.append(el('div', { class: 'gr-pacote' + (ok ? ' ok' : '') }, el('b', {}, P.nome), ...itens,
          ok ? el('span', { class: 'gr-ok' }, 'Pronto') : el('button', { class: 'botao forte', onclick: ev => { ev.stopPropagation(); entregarNoGremio(pid); desenha(); } }, P.dinheiro ? 'Pagar' : 'Entregar')));
      }
      caixa.append(bloco);
    }
    caixa.append(el('div', { class: 'rodape' }, 'Entregar pega da mochila o que você tiver (pode ser aos poucos). O selinho verde na mochila mostra o que serve aqui.'));
  };
  desenha(); abrirModal(caixa); sons.tocar('abrir', 1, 0.03, -6); return true;
}
function entregarNoGremio(pid) {
  const r = Gremio.entregar(pid, G.mochila), P = Gremio.pacote(pid), lista = o => Object.entries(o).map(([id, n]) => id === 'dinheiro' ? 'Cr$ ' + n : Itens.qtd(n, id)).join(', ');
  if (r.r === 'nada') avisar(P.dinheiro ? 'Sem dinheiro para a parcela agora.' : 'Nada disso na mochila ainda.');
  else if (r.r === 'ok') { avisar(`Entregue: ${lista(r.deu)}.`); sons.tocar('feito', 1, 0.03, -8); }
  else if (r.r === 'pronto' || r.r === 'ala') { sons.tocar('feito', 1, 0.03, -6); avisar(`Pacote pronto: ${P.nome}!` + (Object.keys(r.premio).length ? ` Ganhou ${lista(r.premio)}.` : '')); }
  if (r.r === 'ala') { const a = Gremio.ala(r.ala); avisar(`O Grêmio ganhou a ${a.nome}! A partir de amanhã: ${a.efeito}`); poeGremio(MAPAS.vila); }
  hudSujo(); return r;
}
// A noite: a ala pronta hoje entra no resumo; o Cofre pronto é a noite do baile.
NOITE.push(linhas => {
  if (!G.gremio) return;
  for (const a of GREMIO_ALAS) if (G.gremio.alas[a.id] === G.dia)
    linhas.push(a.id === 'cofre' ? 'Teve o baile de reinauguração do Grêmio: a Vila inteira dançou até tarde! Aos sábados, o pessoal do Grêmio janta na pensão.' : `O Grêmio ficou mais bonito: a ${a.nome} está pronta. ${a.efeito}`);
});
// A horta coberta: a pérgola em cima do canteiro do Tio Juca, com a Cozinha do Grêmio pronta.
AO_MONTAR.push(b => { if (b.id === 'quintal' && typeof Gremio !== 'undefined' && Gremio.alaPronta('cozinha') && !b.objs.some(o => o.id === 'horta_coberta')) { const C = QUINTAL.CANTEIRO; b.enfeite('objetos/horta_coberta', C.x + Math.floor(C.w / 2), C.y + C.h - 1, false); } });
