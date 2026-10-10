// Jocelino — loja.js — o depósito do Seu Ananias (abre das 9h às 17h; fecha em dia de festa): abas Comprar (material e
// comida), Vender (o que sobra do quintal) e Mercearia (os ingredientes da Pensão da Rosa que a fama já abriu).
// Clique compra 1; Shift+clique compra 5 (ou vende tudo, na aba Vender). Os preços são os do Godot.

let _abaLoja = 0;
const ABAS_LOJA = ['Comprar', 'Vender', 'Mercearia'];

function entrarDeposito() {
  if (G.minutos < 9 * 60 || G.minutos >= 17 * 60) { abrirPlaca('Depósito do Seu Ananias: fechado agora. Abre das 9h às 17h.'); return true; }
  abrirLoja();
  return true;
}
const descontoHab = () => (typeof Habilidades !== 'undefined' ? Habilidades.desconto() : 1);
function precoLoja(id) { return Math.max(1, Math.round(LOJA.PRECOS[id] * (G.fatorPreco || 1) * descontoHab())); }
function precoMercearia(id) { return Math.max(1, Math.round(Pratos.MERCEARIA[id] * (G.fatorPreco || 1) * descontoHab())); }

function _comprar(id, qtd, preco) {
  const pode = Math.min(qtd, Math.floor(G.dinheiro / preco), G.mochila.espacoPara(id));
  if (pode <= 0) { avisar(G.dinheiro < preco ? 'O dinheiro não dá.' : 'A mochila está cheia.'); return 0; }
  const levou = pode - G.mochila.adicionar(id, pode);
  G.dinheiro -= levou * preco; G.gastoHoje += levou * preco;
  sons.tocar('dinheiro', 1, 0.05, -4);
  avisar('Comprou ' + Itens.qtd(levou, id) + '.');
  hudSujo();
  return levou;
}
const comprarLoja = (id, qtd) => _comprar(id, qtd, precoLoja(id));
const comprarMercearia = (id, qtd) => _comprar(id, qtd, precoMercearia(id));
function venderLoja(id, qtd) {
  const n = Math.min(qtd, G.mochila.total(id));
  if (n <= 0) return 0;
  G.mochila.remover(id, n);
  const v = n * LOJA.COMPRA[id];
  G.dinheiro += v; G.ganhoHoje += v;
  sons.tocar('dinheiro', 1.1, 0.05, -4);
  avisar(`Vendeu ${Itens.qtd(n, id)} por Cr$ ${v}.`);
  hudSujo();
  return n;
}

function abrirLoja() {
  const caixa = el('div', { class: 'painel' });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px;display:flex;justify-content:space-between' },
      el('span', {}, 'Depósito do Seu Ananias'), el('span', {}, 'Cr$ ' + G.dinheiro)));
    caixa.append(el('div', { class: 'abas' }, ABAS_LOJA.map((n, i) => el('div', { class: 'aba' + (i === _abaLoja ? ' ativa' : ''), onclick: e => { e.stopPropagation(); _abaLoja = i; desenha(); } }, n))));
    let ids, preco, acao, dica;
    if (_abaLoja === 0) { ids = Object.keys(LOJA.PRECOS); preco = precoLoja; acao = (id, s) => comprarLoja(id, s ? 5 : 1); dica = 'Clique: compra 1 · Shift+clique: compra 5'; }
    else if (_abaLoja === 1) { ids = Object.keys(LOJA.COMPRA); preco = id => LOJA.COMPRA[id]; acao = (id, s) => venderLoja(id, s ? 999 : 1); dica = 'Clique: vende 1 · Shift+clique: vende tudo'; }
    else {
      const grau = G.pensao ? G.pensao.grau() : 1;
      ids = Object.keys(Pratos.MERCEARIA).filter(id => Pratos.fase(id) <= grau); preco = precoMercearia; acao = (id, s) => comprarMercearia(id, s ? 5 : 1);
      dica = 'Ingredientes da Pensão da Rosa. Mais coisas aparecem quando a pensão fica famosa.';
    }
    const falta = typeof compras !== 'undefined' ? compras.falta(G.mochila) : {};
    caixa.append(el('div', { class: 'grade' }, ids.map(id => el('div', { class: 'linha', onclick: e => { e.stopPropagation(); acao(id, e.shiftKey); desenha(); } },
      el('img', { src: urlItem(id) }), el('div', {}, Itens.nome(id), falta[id] ? el('span', { style: 'color:var(--destaque)' }, `  (falta ${falta[id]})`) : null,
        el('div', { class: 'tem' }, 'tem ' + G.mochila.total(id))), el('span', { class: 'preco' }, 'Cr$ ' + preco(id))))));
    caixa.append(el('div', { class: 'rodape' }, dica));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('abrir', 1.1, 0.03, -6);
}
