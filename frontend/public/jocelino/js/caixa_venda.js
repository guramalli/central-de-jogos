// Jocelino — caixa_venda.js — a caixa de venda do quintal (a do Stardew; caixa_venda.gd do Godot): o Jocelino põe o que
// quer vender, pode tirar até a noite, e de madrugada o carroceiro leva tudo; o dinheiro entra no resumo da noite.
// Preço: o que o Ananias compra vale o preço dele; a coleta e o minério têm tabela própria; o que a loja vende volta
// pela metade; ferramenta não se vende. O Negócio (habilidade) dá +1% por nível e as vantagens Pechincha/Atravessador.

const PRECO_CAIXA = Object.assign({}, ECO.caixa);   // a colheita e o peixe entram pelo horta.js e pelo pesca.js

const CaixaVenda = {
  preco(id) {
    if (!id || Itens.ehFerramenta(id)) return 0;
    if (LOJA.COMPRA[id]) return LOJA.COMPRA[id];
    if (PRECO_CAIXA[id]) return PRECO_CAIXA[id];
    if (LOJA.PRECOS[id]) return Math.floor(LOJA.PRECOS[id] / 2);
    return 0;
  },
  por(id, qtd) { if (!CaixaVenda.preco(id)) return 0; const n = G.mochila.remover(id, qtd); if (n) G.caixaVenda[id] = (G.caixaVenda[id] || 0) + n; return n; },
  // Devolve à mochila só o que cabe (o resto fica na caixa: nada some).
  tirar(id, qtd) {
    const tem = G.caixaVenda[id] || 0;
    let n = 0;
    while (n < Math.min(qtd, tem) && G.mochila.cabe(id)) { G.mochila.adicionar(id, 1); n++; }
    G.caixaVenda[id] = tem - n;
    if (G.caixaVenda[id] <= 0) delete G.caixaVenda[id];
    return n;
  },
  bruto() { let t = 0; for (const id in G.caixaVenda) t += CaixaVenda.preco(id) * G.caixaVenda[id] * (typeof fatorFeira === 'function' ? fatorFeira(id) : 1) * (typeof fatorPeixe === 'function' ? fatorPeixe(id) : 1); return Math.round(t); },   // Feirante/Atacadista na colheita
  total() { return Math.round(CaixaVenda.bruto() * (typeof Habilidades !== 'undefined' ? Habilidades.bonusVenda() : 1)); },
  madrugada() {
    // (tarefa 6) O que não se vende (a marmita de um save antigo: comida de casa) o carroceiro não leva: volta para a mochila, e o
    // que não couber fica na caixa (nada some sem pagar).
    const volta = {};
    for (const id of Object.keys(G.caixaVenda)) if (!CaixaVenda.preco(id)) { const n = CaixaVenda.tirar(id, G.caixaVenda[id]); if (n) volta[id] = n; }
    const fica = {}, itens = {};
    for (const [id, n] of Object.entries(G.caixaVenda)) (CaixaVenda.preco(id) ? itens : fica)[id] = n;
    const total = CaixaVenda.total();
    G.caixaVenda = fica; G.dinheiro += total;
    if (total && typeof Habilidades !== 'undefined') Habilidades.ganhar('negocio', Math.min(30, Math.floor(total / 5)));
    return { total, itens, volta, fica };
  },
};
INICIADORES.push(s => { G.caixaVenda = Object.assign({}, s.caixaVenda || {}); });
COLETORES.push(s => { s.caixaVenda = Object.assign({}, G.caixaVenda); });
NOITE.push(linhas => { const r = CaixaVenda.madrugada(); if (r.total) linhas.push(`O carroceiro levou a caixa de venda e pagou Cr$ ${r.total}.`); G.ganhoTotal = (G.ganhoTotal || 0) + (r.total || 0);
  const lista = o => Object.entries(o).map(([id, n]) => Itens.qtd(n, id)).join(', ');
  if (Object.keys(r.volta).length) linhas.push(`O carroceiro não leva ${lista(r.volta)} (não se vende): voltou para a mochila.`);
  if (Object.keys(r.fica).length) linhas.push(`Não se vende e ficou na caixa de venda (a mochila está cheia): ${lista(r.fica)}.`); });

// A tela: à esquerda o que dá para vender da mochila; à direita o que já está na caixa; embaixo quanto o carroceiro paga.
function usarCaixaVenda() {
  const caixa = el('div', { class: 'painel caixa-venda' });
  const desenha = () => {
    caixa.innerHTML = '';
    const ids = [...new Set(G.mochila.slots.filter(Boolean).map(s => s.id))].filter(id => CaixaVenda.preco(id) > 0);
    const linha = (id, qtd, botoes) => el('div', { class: 'orel-item cv-item' }, el('img', { src: urlItem(id) }),
      el('div', {}, el('b', {}, Itens.nome(id)), el('div', { class: 'orel-preco' }, `×${qtd} · Cr$ ${CaixaVenda.preco(id)} cada`)), el('div', { class: 'orel-bts' }, ...botoes));
    const bt = (txt, f) => el('button', { class: 'botao', onclick: e => { e.stopPropagation(); f(); sons.tocar('pegar', 1.1, 0.03, -8); hudSujo(); desenha(); } }, txt);
    const mochila = el('div', { class: 'cv-col' }, el('div', { class: 'cad-sub' }, 'Na mochila'),
      ...(ids.length ? ids.map(id => linha(id, G.mochila.total(id), [bt('+1', () => CaixaVenda.por(id, 1)), bt('Tudo', () => CaixaVenda.por(id, G.mochila.total(id)))]))
        : [el('div', { class: 'rodape' }, 'Nada para vender na mochila.')]));
    const naCaixa = Object.keys(G.caixaVenda);
    const dentro = el('div', { class: 'cv-col' }, el('div', { class: 'cad-sub' }, 'Na caixa'),
      ...(naCaixa.length ? naCaixa.map(id => linha(id, G.caixaVenda[id], [bt('Tirar', () => { if (!CaixaVenda.tirar(id, G.caixaVenda[id])) avisar('A mochila está cheia.'); })]))
        : [el('div', { class: 'rodape' }, 'A caixa está vazia.')]));
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, 'Caixa de venda'),
      el('div', { class: 'cv-colunas' }, mochila, dentro),
      el('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-top:10px' },
        el('div', { style: 'font-weight:900' }, `O carroceiro paga de madrugada: Cr$ ${CaixaVenda.total()}`),
        el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('abrir', 1, 0.03, -6);
  return true;
}
