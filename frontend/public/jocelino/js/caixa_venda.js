// Jocelino — caixa_venda.js — a caixa de venda do quintal (a do Stardew; caixa_venda.gd do Godot): o Jocelino põe o que
// quer vender, pode tirar até a noite, e de madrugada o carroceiro leva tudo; o dinheiro entra no resumo da noite.
// Preço: o que o Ananias compra vale o preço dele; a coleta e o minério têm tabela própria; o que a loja vende volta
// pela metade; ferramenta não se vende. O Negócio (habilidade) dá +1% por nível e as vantagens Pechincha/Atravessador.

const PRECO_CAIXA = { pedra: 1, ferro_velho: 3, barra_ferro: 15, sucata_aco: 5, barra_aco: 30, bronze_velho: 8, barra_bronze: 40,
  coco: 5, caju: 6, goiaba: 6, pitanga: 5, jabuticaba: 8, araca: 7, cogumelo: 10, cambuci: 9, concha: 4, flor: 5, pedra_bonita: 12,
  pamonha: 20, peixe_frito: 30, bolo: 40, rabanada: 25, moqueca: 80, cocada: 15, goiabada: 30, caldo_caranguejo: 50, marmita: 10 };

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
  bruto() { let t = 0; for (const id in G.caixaVenda) t += CaixaVenda.preco(id) * G.caixaVenda[id] * (typeof fatorFeira === 'function' ? fatorFeira(id) : 1); return Math.round(t); },   // Feirante/Atacadista na colheita
  total() { return Math.round(CaixaVenda.bruto() * (typeof Habilidades !== 'undefined' ? Habilidades.bonusVenda() : 1)); },
  madrugada() {
    const total = CaixaVenda.total(), itens = Object.assign({}, G.caixaVenda);
    G.caixaVenda = {}; G.dinheiro += total;
    if (total && typeof Habilidades !== 'undefined') Habilidades.ganhar('negocio', Math.min(30, Math.floor(total / 5)));
    return { total, itens };
  },
};
INICIADORES.push(s => { G.caixaVenda = Object.assign({}, s.caixaVenda || {}); });
COLETORES.push(s => { s.caixaVenda = Object.assign({}, G.caixaVenda); });
NOITE.push(linhas => { const r = CaixaVenda.madrugada(); if (r.total) linhas.push(`O carroceiro levou a caixa de venda e pagou Cr$ ${r.total}.`); });

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
