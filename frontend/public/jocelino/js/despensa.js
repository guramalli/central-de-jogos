// Jocelino — despensa.js — a despensa viva da Rosa e a encomenda pelo orelhão (o app de ingredientes do Dave, do nosso
// jeito): ao entrar na pensão com ingrediente na mochila a Rosa pergunta "Guardo tudo?"; a tela da despensa mostra as
// prateleiras (arte a/ui/despensa_prateleiras) com cada ingrediente, quanto tem, a raridade e de onde vem; o orelhão da
// Vila encomenda o que a Mercearia não tem e chega na manhã seguinte numa caixa na porta da pensão.

// O catálogo do orelhão (preço por unidade). A fase da pensão libera o que ela já sabe usar.
const ENCOMENDA = { linguica: 7, carne_seca: 9, macarrao: 3, milho: 4, goiaba: 3, tomate: 4, coco: 4, couve: 3, mandioca: 3, sardinha: 4,
  pescada: 8, caranguejo: 10, leite_coco: 6, dende: 7, queijo_coalho: 16 };
INICIADORES.push(s => { G.encomendas = Object.assign({ pedidas: {}, chegou: {} }, s.encomendas || {}); });
COLETORES.push(s => { s.encomendas = { pedidas: Object.assign({}, G.encomendas.pedidas), chegou: Object.assign({}, G.encomendas.chegou) }; });
// De manhã: o que foi pedido ontem chega numa caixa na porta da pensão.
MANHA.push(() => {
  const e = G.encomendas;
  if (!Object.keys(e.pedidas).length) return;
  for (const id in e.pedidas) e.chegou[id] = (e.chegou[id] || 0) + e.pedidas[id];
  e.pedidas = {};
  G.feitosHoje.push('A encomenda chegou: tem uma caixa na porta da pensão.');
  if (MAPAS.vila) poeCaixaEncomenda(MAPAS.vila);
});
AO_MONTAR.push(b => { if (b.id === 'vila') poeCaixaEncomenda(b); });
TAREFAS.push(() => G.encomendas && Object.keys(G.encomendas.chegou).length ? [{ texto: 'Abrir a caixa da encomenda na porta da pensão' }] : []);
function poeCaixaEncomenda(b) {
  const tem = Object.keys(G.encomendas.chegou).length > 0, ja = b.objs.find(o => o.id === 'caixa_encomenda');
  if (tem && !ja && b.pensao) {
    const t = b.pensao.tiles.reduce((a, c) => (c.y > a.y || (c.y === a.y && c.x > a.x)) ? c : a);
    const o = b.interativo('caixa_encomenda', 'objetos/caixa_encomenda', t.x + 1, t.y + 1, 1, 1, [12, 8]);
    o.acao = () => abrirCaixaEncomenda();
    sons.tocar('campainha_bike', 1, 0.03, -4);
  } else if (!tem && ja) b.tirar(ja);
}
function abrirCaixaEncomenda() {
  const e = G.encomendas, p = G.pensao, partes = [];
  for (const id in e.chegou) { p.despensa[id] = (p.despensa[id] || 0) + e.chegou[id]; p.veIngrediente(id); partes.push(Itens.qtd(e.chegou[id], id)); }
  e.chegou = {};
  if (MAPAS.vila) poeCaixaEncomenda(MAPAS.vila);
  sons.tocar('pegar', 0.9, 0.05, -2);
  abrirPlaca(partes.length ? `Encomenda aberta! Foi tudo para a despensa: ${partes.join(', ')}.` : 'A caixa está vazia.');
  return true;
}
function encomendar(id, qtd) {
  const preco = ENCOMENDA[id] * qtd;
  if (!G.pensao || !G.pensao.aceita(id)) { avisar('A Rosa ainda não sabe usar isso (a pensão precisa ficar mais famosa).'); return false; }
  if (G.dinheiro < preco) { avisar('Não dá: falta dinheiro.'); return false; }
  G.dinheiro -= preco; G.encomendas.pedidas[id] = (G.encomendas.pedidas[id] || 0) + qtd;
  sons.tocar('moedas', 1, 0.05, -6); hudSujo();
  return true;
}
// O orelhão da Vila: o catálogo, com o que já foi pedido para amanhã.
function abrirOrelhao() {
  const caixa = el('div', { class: 'painel orelhao' });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, 'Encomenda pelo orelhão'),
      el('div', { class: 'rodape', style: 'text-align:left;margin-bottom:8px' }, 'O caminhão do Seu Firmino entrega amanhã cedo, numa caixa na porta da pensão. Ingrediente que a Mercearia não tem.'));
    const grade = el('div', { class: 'orel-grade' });
    for (const id in ENCOMENDA) {
      const pode = G.pensao && G.pensao.aceita(id), ped = G.encomendas.pedidas[id] || 0, ing = Pratos.INGREDIENTES[id];
      grade.append(el('div', { class: 'orel-item' + (pode ? '' : ' trancado') }, el('img', { src: urlItem(id) }),
        el('div', {}, el('b', {}, Itens.nome(id)), el('div', { class: 'orel-preco' }, `Cr$ ${ENCOMENDA[id]} cada · ${'★'.repeat(ing ? ing.raridade : 1)}${ped ? ` · ${ped} para amanhã` : ''}`),
          pode ? null : el('div', { class: 'orel-preco' }, '🔒 a pensão precisa de mais fama')),
        pode ? el('div', { class: 'orel-bts' }, [1, 5].map(n => el('button', { class: 'botao', onclick: e => { e.stopPropagation(); if (encomendar(id, n)) desenha(); } }, '+' + n))) : null));
    }
    caixa.append(grade, el('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-top:10px' },
      el('div', { style: 'font-weight:900' }, `Cr$ ${G.dinheiro}`), el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Desligar')));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('abrir', 0.9, 0.03, -6);
  return true;
}

// ---------- a despensa viva ----------
// Ao entrar na pensão aberta com ingrediente na mochila: a Rosa pergunta se guarda.
function rosaPerguntaGuardar() {
  const p = G.pensao;
  if (!p || !despensaAceitaGuardar() || !G.mochila) return false;
  const temAlgo = Object.keys(Pratos.INGREDIENTES).some(id => G.mochila.total(id) > 0 && p.aceita(id) && (id !== 'pedra' || (p.despensa.pedra || 0) < Pensao.PEDRA_MAX));
  if (!temAlgo) return false;
  perguntar('Rosa: "Trouxe coisa boa, meu bem? Guardo tudo na despensa?"', ['Guardar tudo', 'Agora não'], i => { if (i === 0) guardarNaDespensa(true); });
  return true;
}
// (14/10, o jogador: "clico no guardar e nada acontece") A despensa recebe ingrediente desde que a cozinha fica pronta (na pintura,
// pronta para a inauguração e aberta): como no Dave, o estoque se enche antes de abrir. Antes disso, a reforma.
const despensaAceitaGuardar = () => { const p = G.pensao; return !!p && (p.estado === 'aberta' || p.estado === 'pronta' || (typeof emReforma === 'function' && emReforma() && cozinhaPronta())); };
function guardarNaDespensa(silencioso) {
  const p = G.pensao;
  if (!despensaAceitaGuardar()) { abrirPlaca('A despensa ainda está empoeirada: ela recebe ingrediente quando a cozinha da Rosa ficar pronta.'); return true; }
  const g = p.guardar(G.mochila);
  const partes = Object.keys(g).map(id => Itens.qtd(g[id], id));
  if (partes.length) { sons.tocar('pegar', 1, 0.05, -4); avisar('Guardou: ' + partes.join(', ') + '.'); }
  hudSujo();
  if (!silencioso) abrirDespensa();
  return true;
}
// A tela da despensa: as prateleiras com cada ingrediente, quanto tem, a raridade e de onde vem.
function abrirDespensa() {
  const p = G.pensao;
  const caixa = el('div', { class: 'despensa com-arte' });
  const ids = Object.keys(Pratos.INGREDIENTES).filter(id => (p.despensa[id] || 0) > 0 || (G.mochila && G.mochila.total(id) > 0) || p.aceita(id));
  const prat = el('div', { class: 'desp-prateleiras' });
  for (const id of ids) {
    const n = p.despensa[id] || 0, ing = Pratos.INGREDIENTES[id], pode = p.aceita(id);
    // (13/10, o tema) Um pote por vaga da prateleira: o ícone, quanto tem e o nome; a raridade e a origem ficam na dica do mouse
    // (a lousa ao lado avisa), para o cartão caber no vão entre a prateleira e a toalhinha de crochê.
    prat.append(el('div', { class: 'desp-item' + (n ? '' : ' vazio') + (pode ? '' : ' trancado'), title: `${Itens.nome(id)} — ${'★'.repeat(ing.raridade)} ${origemDe(id)}` },
      el('img', { src: urlItem(id) }), el('div', { class: 'desp-qtd' }, n ? '×' + n : (pode ? '—' : '🔒')),
      el('div', { class: 'desp-nome' }, Itens.nome(id))));
  }
  const naMochila = Object.keys(Pratos.INGREDIENTES).filter(id => G.mochila && G.mochila.total(id) > 0 && p.aceita(id));
  caixa.append(el('div', { class: 'titulo titulo-tela giz' }, 'Despensa da Rosa'),
    prat);
  // (o cardápio do Bancho, 13/10) Ao lado das prateleiras, a lousa do rendimento (o Dave mostra, no estoque, quantas porções cada
  // receita dá): "Peixe Frito do Lourival: 1 peixe e 1 farinha = 1 panela = 4 porções", e quantas panelas a despensa dá agora.
  const rend = el('div', { class: 'lousa desp-rendimento' }, el('div', { class: 'giz-titulo' }, 'O que a despensa dá'));
  p.receitas.forEach((id, i) => {
    const P = Pratos.PRATOS[id], n = Math.min(99, p.rende(id)), k = p.porcoesPorPanela(id), falta = Object.keys(P.porcao).filter(x => p._tem(x) < P.porcao[x]);
    if (i) rend.append(el('div', { class: 'giz-divisoria' }));
    rend.append(el('div', { class: 'rend-linha' + (n ? '' : ' falta') },
      el('div', {}, el('span', { class: 'giz rend-nome' }, P.nome + ':'), ` ${listaE(Object.entries(P.porcao).map(([x, q]) => ingredienteNaPanela(x, q)))} = 1 panela = ${k} porções`),
      el('div', { class: 'rend-tem' }, n ? `a despensa dá ${panelasTxt(n)} (${n * k} porções)` : `falta ${listaE(falta.map(nomeNaPanela))}`)));
  });
  rend.append(el('div', { class: 'rend-onde' }, 'Passe o mouse num ingrediente para ver de onde ele vem. O que falta, a Mercearia do Seu Ananias vende ou o orelhão da Vila encomenda.'), el('div', { class: 'rend-botoes' },
    naMochila.length && despensaAceitaGuardar() ? el('button', { class: 'tabua', onclick: e => { e.stopPropagation(); guardarNaDespensa(true); fecharModal(); abrirDespensa(); } }, `Guardar o da mochila (${naMochila.length})`)
      : naMochila.length ? el('div', { class: 'rend-onde' }, 'A despensa recebe ingrediente quando a cozinha da Rosa ficar pronta.') : null,
    el('button', { class: 'tabua acesa', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  abrirModal(el('div', { class: 'despensa-tela' }, caixa, rend));
  sons.tocar('abrir', 1, 0.03, -6);
  return true;
}
