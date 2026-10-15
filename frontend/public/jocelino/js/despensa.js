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
      // (15/10, o dono: "para saber se preciso ou não") quanto já tem: na despensa (o "tem 0" em destaque) e, se houver, na mochila
      const tem = G.pensao ? G.pensao.despensa[id] || 0 : 0, naMoch = G.mochila ? G.mochila.total(id) : 0;
      grade.append(el('div', { class: 'orel-item' + (pode ? '' : ' trancado') }, el('img', { src: urlItem(id) }),
        el('div', {}, el('b', {}, Itens.nome(id)), el('div', { class: 'orel-preco' }, `Cr$ ${ENCOMENDA[id]} cada · ${'★'.repeat(ing ? ing.raridade : 1)} · `,
          el('span', { class: 'orel-tem' + (tem ? '' : ' zero') }, `tem ${tem} na despensa`), naMoch ? ` (+${naMoch} na mochila)` : '', ped ? ` · ${ped} para amanhã` : ''),
          pode ? null : el('div', { class: 'orel-preco' }, '🔒 ' + abreNoDegrau(id))),
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
// Em que degrau o ingrediente trancado abre (a fase do ingrediente é o degrau da pensão: Pratos.fase ↔ Pensao.DEGRAUS).
const abreNoDegrau = id => { const f = Pratos.fase(id), d = Pensao.DEGRAUS[f - 1]; return d ? `Abre no ${'★'.repeat(f - 1)} ${d.nome} (${d.curtidas} curtidas)` : 'Abre com mais fama da pensão'; };
const minusculaInicial = s => s[0].toLowerCase() + s.slice(1);
const despensaAceitaGuardar = () => { const p = G.pensao; return !!p && (p.estado === 'aberta' || p.estado === 'pronta' || (typeof emReforma === 'function' && emReforma() && cozinhaPronta())); };
function guardarNaDespensa(silencioso) {
  const p = G.pensao;
  if (!despensaAceitaGuardar()) { abrirPlaca('A despensa ainda está empoeirada: ela recebe ingrediente quando a cozinha da Rosa ficar pronta.'); return true; }
  const g = p.guardar(G.mochila);
  for (const id in g) G.despensaMinha[id] = (G.despensaMinha[id] || 0) + g[id];   // (15/10) o que ele guardou, ele pode tirar
  const partes = Object.keys(g).map(id => Itens.qtd(g[id], id));
  if (partes.length) { sons.tocar('pegar', 1, 0.05, -4); avisar('Guardou: ' + partes.join(', ') + '.'); }
  // (14/10, o jogador: "por que não consigo entregar tomate?") O que a despensa ainda não aceita fica na mochila, e a Rosa diz quando abre.
  const ficou = Object.keys(Pratos.INGREDIENTES).filter(id => G.mochila.total(id) > 0 && !p.aceita(id));
  if (ficou.length) avisar(`Rosa: "${listaE(ficou.map(id => Itens.nome(id)))} ainda não cabe na despensa: ${minusculaInicial(abreNoDegrau(ficou[0]))}."`);
  hudSujo();
  if (!silencioso) abrirDespensa();
  return true;
}

// ---------- guardar e tirar um item (15/10, o dono: "retirar alguns ingredientes se eu quiser e colocar o item que eu quero") ----------
// Como o baú do Stardew: na tela da despensa, a mochila embaixo do armário; clique passa a pilha, botão direito passa 1.
// A economia (relatório 2026-10-14-guia-abc/despensa-report.md): a Expedição traz ingrediente de graça (só o salário) e a
// encomenda vende mandioca a Cr$ 3 que a caixa de venda paga Cr$ 24; com retirada livre, a despensa virava fábrica de dinheiro.
// Então só sai da despensa o que o PRÓPRIO Jocelino guardou: G.despensaMinha = { id: quanto }. O que a cozinha gasta sai primeiro
// do dele (o contador nunca passa do que a despensa tem: aparaMinha, a cada quadro e antes de a manhã pôr coisa nova).
INICIADORES.push(s => { G.despensaMinha = {}; for (const id in s.despensaMinha || {}) if (Pratos.INGREDIENTES[id] && s.despensaMinha[id] > 0) G.despensaMinha[id] = s.despensaMinha[id] | 0; });
COLETORES.push(s => { s.despensaMinha = Object.assign({}, G.despensaMinha || {}); });
function aparaMinha() {
  const p = G.pensao, m = G.despensaMinha; if (!p || !m) return;
  for (const id in m) { const n = Math.min(m[id], p.despensa[id] || 0); if (n > 0) m[id] = n; else delete m[id]; }
}
ATUALIZADORES.push(aparaMinha);
MANHA.unshift(aparaMinha); MANHA.push(aparaMinha);   // (a fornada da marmita gasta; depois a expedição e a encomenda põem)
NOITE.unshift(() => aparaMinha());
// (15/10, o controlador) O limite vale só para o que a caixa de venda compra (onde há arbitragem): o que ela não compra (arroz, feijão,
// ovo, linguiça... os da Mercearia) sai à vontade, venha de onde vier (presente, Expedição, encomenda, save antigo).
const temLimite = id => typeof CaixaVenda !== 'undefined' && CaixaVenda.preco(id) > 0;
const podeTirar = id => { const p = G.pensao; if (!p) return 0; const n = p.despensa[id] || 0; return temLimite(id) ? Math.min((G.despensaMinha || {})[id] || 0, n) : n; };
const _marcaDespensa = () => { if (G.limpou) G.limpou.tela_despensa = (G.limpou.tela_despensa || 0) + 1; };
// Por que esse item não entra na despensa ('' = entra).
function motivoNaoGuarda(id) {
  const p = G.pensao;
  if (!despensaAceitaGuardar()) return 'A despensa ainda está empoeirada: ela recebe ingrediente quando a cozinha da Rosa ficar pronta.';
  if (!Pratos.INGREDIENTES[id]) return 'A despensa só guarda ingrediente de cozinha.';
  if (!p.aceita(id)) return `${Itens.nome(id)} ainda não cabe na despensa: ${minusculaInicial(abreNoDegrau(id))}.`;
  if (id === 'pedra' && (p.despensa.pedra || 0) >= Pensao.PEDRA_MAX) return `A despensa já tem as ${Pensao.PEDRA_MAX} pedras da sopa: o resto é material de obra.`;
  return '';
}
// Guarda o espaço i da mochila (com `um`, só 1). Devolve quanto foi.
function guardarDaMochila(i, um = false) {
  const p = G.pensao, s = G.mochila.slots[i]; if (!s) return 0;
  const m = motivoNaoGuarda(s.id); if (m) { avisar(m); return 0; }
  const id = s.id, n = Math.min(um ? 1 : s.qtd, id === 'pedra' ? Pensao.PEDRA_MAX - (p.despensa.pedra || 0) : Infinity);
  s.qtd -= n; if (s.qtd <= 0) G.mochila.slots[i] = null;
  p.despensa[id] = (p.despensa[id] || 0) + n; p.veIngrediente(id);
  G.despensaMinha[id] = (G.despensaMinha[id] || 0) + n;
  _marcaDespensa(); sons.tocar('pegar', 1.1, 0.03, -8); hudSujo();
  return n;
}
// Tira da despensa para a mochila: a pilha (o que ele pode tirar, até uma pilha; o que não couber fica) ou, com `um`, 1.
function tirarDaDespensa(id, um = false) {
  aparaMinha();
  const p = G.pensao, n = p.despensa[id] || 0, pode = podeTirar(id);
  if (!n) return 0;
  if (!pode) { avisar(`Rosa: "${Itens.nome(id)} que veio da Expedição, da encomenda ou de presente fica para a cozinha. Só sai o que você mesmo guardou."`); return 0; }
  const quer = um ? 1 : Math.min(pode, Itens.pilha(id)), sobra = G.mochila.adicionar(id, quer), foi = quer - sobra;
  if (!foi) { avisar('A mochila está cheia.'); return 0; }
  p.despensa[id] -= foi; if (p.despensa[id] <= 0) delete p.despensa[id];
  if (G.despensaMinha[id]) { G.despensaMinha[id] -= foi; if (G.despensaMinha[id] <= 0) delete G.despensaMinha[id]; }
  if (sobra) avisar(`A mochila está cheia: coube só ${Itens.qtd(foi, id)}, o resto ficou na despensa.`);
  _marcaDespensa(); sons.tocar('pegar', 1.1, 0.03, -8); hudSujo();
  return foi;
}
// A tela da despensa: as prateleiras com cada ingrediente, quanto tem, a raridade e de onde vem.
function abrirDespensa() {
  { const r = G.mochila && G.mochila.guardarMao(); if (r && G.jog) soltar(r.id, r.qtd, G.jog.x, G.jog.y); }   // (como o baú: a mão volta à mochila)
  aparaMinha();
  const tela = el('div', { class: 'despensa-tela' });
  desenhaDespensa(tela);
  abrirModal(tela, () => hudSujo());
  sons.tocar('abrir', 1, 0.03, -6);
  return true;
}
// Monta (e remonta, a cada clique) a tela: o armário, a mochila embaixo e a lousa do rendimento ao lado. A rolagem das prateleiras
// fica onde estava.
function desenhaDespensa(tela) {
  const p = G.pensao, rolou = (tela.querySelector('.desp-prateleiras') || {}).scrollTop || 0;
  const redesenha = () => desenhaDespensa(tela);
  tela.innerHTML = '';
  const caixa = el('div', { class: 'despensa com-arte' });
  const ids = Object.keys(Pratos.INGREDIENTES).filter(id => (p.despensa[id] || 0) > 0 || (G.mochila && G.mochila.total(id) > 0) || p.aceita(id));
  const prat = el('div', { class: 'desp-prateleiras' });
  let presa = false;   // algum ingrediente com parte que não sai (veio da Expedição, da encomenda, de presente)
  for (const id of ids) {
    const n = p.despensa[id] || 0, ing = Pratos.INGREDIENTES[id], pode = p.aceita(id), sai = podeTirar(id);
    if (n > sai) presa = true;
    // (13/10, o tema) Um pote por vaga da prateleira: o ícone, quanto tem e o nome; a raridade e a origem ficam na dica do mouse
    // (a lousa ao lado avisa), para o cartão caber no vão entre a prateleira e a toalhinha de crochê.
    // (15/10) Clique tira a pilha para a mochila; botão direito tira 1. Com parte que não sai, o pote diz quanto pode tirar.
    const clica = um => e => { e.preventDefault(); e.stopPropagation(); if (tirarDaDespensa(id, um)) redesenha(); };
    prat.append(el('div', { class: 'desp-item' + (n ? '' : ' vazio') + (pode ? '' : ' trancado') + (sai ? ' pode-tirar' : ''), 'data-ing': id,
      title: `${Itens.nome(id)} — ${'★'.repeat(ing.raridade)} ${origemDe(id)}` + (pode ? '' : ` · 🔒 ${abreNoDegrau(id)}`)
        + (n ? (sai ? ` · Clique: tira para a mochila (botão direito: 1)${sai < n ? `. Pode tirar ${sai} de ${n}` : ''}` : ' · Veio da Expedição, da encomenda ou de presente: fica para a cozinha') : ''),
      onclick: n ? clica(false) : null, oncontextmenu: n ? clica(true) : e => e.preventDefault() },
      el('img', { src: urlItem(id), draggable: 'false' }), el('div', { class: 'desp-qtd' }, n ? '×' + n : (pode ? '—' : '🔒')),
      el('div', { class: 'desp-nome' }, Itens.nome(id)), n && sai < n ? el('div', { class: 'desp-pode' }, `pode tirar ${sai}`) : null));
  }
  const naMochila = Object.keys(Pratos.INGREDIENTES).filter(id => G.mochila && G.mochila.total(id) > 0 && p.aceita(id));
  caixa.append(el('div', { class: 'titulo titulo-tela giz' }, 'Despensa da Rosa'),
    prat);
  // (15/10) A mochila embaixo do armário (a grade e os espaços da tela do baú): clique guarda a pilha, botão direito guarda 1; o que
  // a despensa não aceita fica apagado e diz o porquê.
  const M = G.mochila, usados = M.slots.filter(Boolean).length;
  const grade = el('div', { class: 'bau-grade' }, ...M.slots.map((s, i) => {
    const nao = s ? motivoNaoGuarda(s.id) : '', clica = um => e => { e.preventDefault(); e.stopPropagation(); if (!s) return; if (guardarDaMochila(i, um)) redesenha(); };
    return el('div', { class: 'espaco' + (i < Mochila.BARRA ? ' barra' : '') + (s ? (nao ? ' apagado' : ' guarda') : ''), 'data-item': s ? s.id : null,
      title: s ? Itens.nome(s.id) + ' — ' + (nao || 'Clique: guarda na despensa (botão direito: 1)') : '',
      onclick: clica(false), oncontextmenu: clica(true) },
      s ? el('img', { src: urlItem(s.id), draggable: 'false' }) : null,
      s && Itens.pilha(s.id) > 1 ? el('div', { class: 'qtd' }, s.qtd) : null);
  }));
  const moch = el('div', { class: 'painel desp-mochila' },
    el('div', { class: 'titulo bau-sub' }, 'Mochila', el('span', { class: 'bau-conta' }, ` ${usados} de ${M.tam}`)), grade, faixaDaTela('desp-faixa'),
    el('div', { class: 'rodape desp-moch-rodape' }, 'Clique guarda a pilha na despensa; botão direito guarda 1. No armário, clique tira; botão direito tira 1.'),
    el('div', { class: 'rodape desp-moch-rodape' + (presa ? ' presa' : '') }, 'O que a caixa de venda compra (colheita, peixe, fruta) só sai se foi você que guardou: o que a Expedição, a encomenda e os presentes trazem disso fica para a cozinha.'));
  const esq = el('div', { class: 'desp-esq', style: `--moch-linhas:${Math.ceil(M.tam / 12)}` }, caixa, moch);
  requestAnimationFrame(() => { const pr = tela.querySelector('.desp-prateleiras'); if (pr) pr.scrollTop = rolou; });
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
  // (15/10, a clareza) a raridade (★), o 🔒 e a panela, no "(?)"
  const onde = linhaAjuda('despensa', 'Passe o mouse num ingrediente para ver de onde ele vem e a raridade (★). O que falta, a Mercearia do Seu Ananias vende ou o orelhão da Vila encomenda.',
    [GLOSSARIO.raridade, '🔒: a Rosa ainda não sabe usar; abre quando a pensão sobe de degrau.', GLOSSARIO.panela, 'Os ingredientes saem da despensa quando a pensão abre, nas panelas do cardápio.']);
  onde.classList.add('rend-onde');
  rend.append(onde, el('div', { class: 'rend-botoes' },
    naMochila.length && despensaAceitaGuardar() ? el('button', { class: 'tabua', onclick: e => { e.stopPropagation(); guardarNaDespensa(true); redesenha(); } }, `Guardar o da mochila (${naMochila.length})`)
      : naMochila.length ? el('div', { class: 'rend-onde' }, 'A despensa recebe ingrediente quando a cozinha da Rosa ficar pronta.') : null,
    el('button', { class: 'tabua acesa', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  tela.append(esq, rend);
}
