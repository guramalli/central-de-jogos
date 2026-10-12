// Jocelino — bazar.js — o Bazar do Seu Salim no Mercado Municipal (o JojaMart/Pierre's do nosso jeito, com as compras grandes
// do Stardew): 6 coisas para a família, cada uma uma vez, com efeito no dia a dia; o folheto chega no dia 4; a meta de
// dinheiro aparece embaixo do relógio ("Bicicleta 180/450") e no fim do resumo da noite.
const Bazar = {
  iniciar(s) { const b = s.bazar || {}; G.bazar = { comprados: (b.comprados || []).slice(), meta: b.meta || '' }; },
  salvar(s) { s.bazar = { comprados: G.bazar.comprados.slice(), meta: G.bazar.meta }; },
  dado(id) { return ECO.bazar.itens.find(i => i.id === id) || null; },
  tem(id) { return !!G.bazar && G.bazar.comprados.includes(id); },
  aberto(dia, min) { return (dia - 1) % 7 !== 6 && min >= 9 * 60 && min < 17 * 60; },
  comprar(id) {
    const it = Bazar.dado(id); if (!it) return 'nao';
    if (Bazar.tem(id)) return 'ja';
    if (G.dinheiro < it.preco) return 'dinheiro';
    G.dinheiro -= it.preco; G.gastoHoje = (G.gastoHoje || 0) + it.preco; G.bazar.comprados.push(id);
    if (G.bazar.meta === id) G.bazar.meta = '';
    return 'ok';
  },
  meta() {
    if (!G.bazar || !(typeof Guia !== 'undefined' ? Guia.liberado('bazar') : G.dia >= ECO.guia.dias.bazar)) return null;
    const falta = ECO.bazar.itens.filter(i => !Bazar.tem(i.id));
    return falta.find(i => i.id === G.bazar.meta) || falta[0] || null;
  },
};
INICIADORES.push(s => Bazar.iniciar(s));
COLETORES.push(s => Bazar.salvar(s));
// A energia da comida: a marmita rende mais com o fogão a gás e com a cozinha nova da casa da família.
function energiaDaComida(id) {
  const e = Itens.energia(id); if (id !== 'marmita') return e;
  return Math.round(e * (Bazar.tem('fogao_gas') ? ECO.bazar.fogao : 1) * (typeof CasaFamilia !== 'undefined' && CasaFamilia.tem(4) ? ECO.bazar.cozinha : 1));
}
CARTAS.folheto_salim = { de: 'Seu Salim', dia: 4, texto: 'BAZAR DO SALIM — no Mercado Municipal, das 9h às 17h (domingo fechado). Garrafa térmica, bicicleta, fogão a gás, máquina de costura, televisão e até um Fusca! Preço bom, freguês melhor ainda. Venha conhecer!' };
// Os efeitos de cada dia: o cafezinho da garrafa de manhã; à noite, a costura da Rosa e a novela com a família.
MANHA.push(() => { if (Bazar.tem('garrafa_termica')) G.mochila.adicionar('cafe', 1); });
NOITE.push(linhas => {
  if (Bazar.tem('maquina_costura') && (G.dia - 1) % 7 !== 6) { G.dinheiro += ECO.bazar.costura; G.ganhoHoje += ECO.bazar.costura; linhas.push(`A Rosa costurou para fora: Cr$ ${ECO.bazar.costura}.`); }
  if (Bazar.tem('televisao')) { G.amizade = G.amizade || {}; for (const id of ['rosa', 'ritinha', 'zezinho']) G.amizade[id] = (G.amizade[id] || 0) + 1; linhas.push('A família viu a novela junta na televisão nova (amizade +1).'); }
});
// O balcão no Mercado.
function abrirBazar() {
  if (!Bazar.aberto(G.dia, G.minutos)) { abrirPlaca('Bazar do Seu Salim: fechado agora. Abre das 9h às 17h, menos no domingo.'); return true; }
  const caixa = el('div', { class: 'painel loja' });
  caixa.append(el('div', { class: 'titulo', style: 'font-size:28px;display:flex;justify-content:space-between' }, el('span', {}, 'Bazar do Seu Salim'), el('span', {}, 'Cr$ ' + G.dinheiro)));
  for (const it of ECO.bazar.itens) {
    const tem = Bazar.tem(it.id), meta = Bazar.meta() && Bazar.meta().id === it.id;
    caixa.append(el('div', { class: 'linha' }, el('img', { src: urlItem(it.id) }), el('div', {}, el('b', {}, it.nome), el('div', { class: 'tem' }, it.efeito)),
      tem ? el('span', { class: 'preco' }, 'Já é seu') : el('span', {},
        el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); const r = Bazar.comprar(it.id); avisar(r === 'ok' ? `Comprou: ${it.nome}!` : 'O dinheiro não dá.'); if (r === 'ok') { sons.tocar('dinheiro', 1.1, 0.05, -4); if (it.id === 'fusca' && MAPAS.quintal) poeFusca(MAPAS.quintal); } fecharModal(); abrirBazar(); hudSujo(); } }, 'Cr$ ' + it.preco),
        el('button', { class: 'botao', onclick: e => { e.stopPropagation(); G.bazar.meta = it.id; fecharModal(); abrirBazar(); } }, meta ? 'Juntando ✓' : 'Juntar para'))));
  }
  abrirModal(caixa); sons.tocar('abrir', 1, 0.03, -6); return true;
}
// O fusca da família no quintal: viagem rápida para os lugares abertos.
const DESTINOS_FUSCA = [['vila', 'A Vila', { x: 23, y: 4 }], ['praia', 'A praia', { x: 22, y: 4 }], ['bairro', 'O Bairro Novo', { x: 2, y: 10 }]];
function poeFusca(b) {
  if (!b || b.id !== 'quintal' || !Bazar.tem('fusca') || b.objs.some(o => o.id === 'fusca_familia')) return;
  const o = b.interativo('fusca_familia', 'objetos/fusca', 23, 22, 3, 1, [20, 8]);
  o.acao = () => { const ds = DESTINOS_FUSCA.filter(([id]) => id === 'vila' || (id === 'praia' && G.lugares && G.lugares.praia) || (id === 'bairro' && G.bairro && G.bairro.aberto));
    perguntar('Ir de Fusca para onde?', ds.map(d => d[1]).concat(['Ficar']), i => { if (i < ds.length) { entrarMapa(ds[i][0], ds[i][2]); sons.tocar('passo', 0.6, 0, -6); } }); return true; };
}
AO_MONTAR.push(b => poeFusca(b));
