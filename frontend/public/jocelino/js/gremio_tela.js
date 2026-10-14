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
// (a lista do povo, 14/10: "não entendi o que é isso") A Dona Zélia explica na primeira vez que a lista abre (G.limpou.gremio_intro,
// salvo; não se repete): o que é o Grêmio, o que são as salas e os pacotes, que dá para entregar aos poucos e o que cada sala dá.
const FALAS_GREMIO = [
  'Seu Jocelino, o Grêmio era o clube dos bailes da Vila. Está fechado há anos, e a Vila quer ele de volta!',
  'Ele tem salas. Cada sala reabre quando os pacotes dela ficam completos. Cada pacote pede coisas da horta, da mata, da praia, da obra...',
  'Pode entregar aos poucos, com o que tiver na mochila. Não precisa juntar tudo de uma vez.',
  'E cada sala pronta dá um presente que muda a Vila (e ajuda você também). Olha a lista, é só começar!',
];
// A lista de itens (ou Cr$) de um pacote, em texto: "5 alfaces, 2 sacos de cimento".
const _listaGr = o => Object.entries(o).map(([id, n]) => id === 'dinheiro' ? 'Cr$ ' + n : Itens.qtd(n, id)).join(', ');
function abrirGremio() {
  if (!Gremio.aberto()) { abrirPlaca('O Grêmio Recreativo Vila Maré: fechado há anos. Pela janela, o salão do baile cheio de poeira.'); return true; }
  if (G.guia) G.guia.cont.gremio = (G.guia.cont.gremio || 0) + 1;
  if (G.limpou && !G.limpou.gremio_intro) {
    G.limpou.gremio_intro = 1;
    abrirConversa('Dona Zélia', urlArte('retratos/zelia_normal'), FALAS_GREMIO, () => abrirListaGremio());
    return true;
  }
  return abrirListaGremio();
}
function abrirListaGremio() {
  const caixa = el('div', { class: 'painel gremio', style: `background-image:url(${urlArte('ui/lista_povo')})` });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, 'A lista do povo — Grêmio Recreativo Vila Maré'));
    caixa.append(el('div', { class: 'gr-resumo' }, el('div', {}, 'Ajude a Vila a reabrir o Grêmio: complete os pacotes de cada sala.'), el('div', {}, 'Sala pronta = um presente para a Vila (e para você).')));
    for (const a of GREMIO_ALAS) {
      const aberta = Gremio.alaAberta(a.id), pronta = Gremio.alaPronta(a.id);
      const bloco = el('div', { class: 'gr-ala' + (pronta ? ' pronta' : aberta ? '' : ' fechada') }, el('div', { class: 'gr-nome' }, a.nome + (pronta ? ' ✓ (ala pronta)' : ''),
        el('span', { class: 'gr-efeito' }, el('b', {}, 'Prêmio da sala: '), a.efeito)));
      if (!aberta) bloco.append(el('div', { class: 'gr-falta' }, `Abre quando você completar mais ${ECO.gremio.abre[a.id] - G.gremio.prontos.length} pacote(s), de qualquer sala aberta.`));
      else {
        bloco.append(el('div', { class: 'gr-conta' }, `${a.pacotes.filter(p => Gremio.pronto(p)).length} de ${a.pacotes.length} pacotes prontos`));
        if (!pronta) for (const pid of a.pacotes) {
          const P = Gremio.pacote(pid), ok = Gremio.pronto(pid), f = Gremio.falta(pid), e = G.gremio.entregue[pid] || {};
          const itens = P.dinheiro ? [el('span', { class: 'gr-item' }, `Cr$ ${e.dinheiro || 0} de ${P.dinheiro}`)]
            : Object.keys(P.itens).map(id => el('span', { class: 'gr-item' + (f[id] ? '' : ' ok'), title: Itens.nome(id) + (Itens.descricao(id) ? ' — ' + Itens.descricao(id) : '') }, el('img', { src: urlItem(id) }), ` ${e[id] || 0}/${P.itens[id]}`));
          bloco.append(el('div', { class: 'gr-pacote' + (ok ? ' ok' : '') }, el('b', {}, P.nome), ...itens,
            P.premio ? el('span', { class: 'gr-premio' }, 'ganha: ' + _listaGr(P.premio)) : null,
            ok ? el('span', { class: 'gr-ok' }, 'Pronto') : el('button', { class: 'botao forte', onclick: ev => { ev.stopPropagation(); entregarNoGremio(pid); desenha(); } }, P.dinheiro ? `Pagar Cr$ ${f.dinheiro}` : 'Entregar o que tenho')));
        }
      }
      caixa.append(bloco);
    }
    caixa.append(el('div', { class: 'rodape' }, 'Entregue aos poucos, com o que tiver na mochila. O selinho verde num item da mochila quer dizer: o Grêmio pede isso.'));
  };
  desenha(); abrirModal(caixa); sons.tocar('abrir', 1, 0.03, -6); return true;
}
function entregarNoGremio(pid) {
  const r = Gremio.entregar(pid, G.mochila), P = Gremio.pacote(pid), lista = _listaGr;
  if (r.r === 'nada') avisar(P.dinheiro ? `A parcela é de Cr$ ${Gremio.falta(pid).dinheiro}: junte o valor inteiro.` : 'Nada disso na mochila ainda.');
  else if (r.r === 'ok') { avisar(`Entregue: ${lista(r.deu)}.`); sons.tocar('feito', 1, 0.03, -8); }
  else if (r.r === 'pronto' || r.r === 'ala') { sons.tocar('feito', 1, 0.03, -6); avisar(`Pacote pronto: ${P.nome}!` + (Object.keys(r.premio).length ? ` Ganhou ${lista(r.premio)}.` : '')); }
  if (r.r === 'ala') { const a = Gremio.ala(r.ala); avisar(`O Grêmio ganhou a ala ${a.de}! A partir de amanhã: ${a.efeito}`); poeGremio(MAPAS.vila); }
  hudSujo(); return r;
}
// A noite: a ala pronta hoje entra no resumo; o Cofre pronto é a noite do baile.
function linhasNoiteGremio() {
  const r = []; if (!G.gremio) return r;
  for (const a of GREMIO_ALAS) if (G.gremio.alas[a.id] === G.dia)
    r.push(a.id === 'cofre' ? 'Teve o baile de reinauguração do Grêmio: a Vila inteira dançou até tarde! Aos sábados, o pessoal do Grêmio janta na pensão.' : `O Grêmio ficou mais bonito: a ala ${a.de} está pronta. ${a.efeito}`);
  return r;
}
NOITE.push(linhas => { linhas.push(...linhasNoiteGremio()); });
// A horta coberta: a pérgola em cima do canteiro do Tio Juca, com a Cozinha do Grêmio pronta (na montagem do mapa e de manhã,
// que o quintal não se remonta ao dormir).
function poeHortaCoberta(b) {
  if (!b || b.id !== 'quintal' || typeof Gremio === 'undefined' || !G.gremio || !Gremio.alaPronta('cozinha') || b.objs.some(o => o.id === 'horta_coberta')) return;
  const C = QUINTAL.CANTEIRO; b.enfeite('objetos/horta_coberta', C.x + Math.floor(C.w / 2), C.y + C.h - 1, false).id = 'horta_coberta';
}
AO_MONTAR.push(b => poeHortaCoberta(b));
MANHA.push(() => poeHortaCoberta(MAPAS.quintal));
