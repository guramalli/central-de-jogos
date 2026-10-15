// Jocelino — loja.js — o depósito do Seu Ananias (abre das 8h às 17h, pedido do teste de 13/10; fecha em dia de festa): abas Comprar (material e
// comida), Vender (o que sobra do quintal), Mercearia (os ingredientes da Pensão da Rosa que a fama já abriu) e Sementes
// (as da estação e as coisas da horta).
// Clique compra 1; Shift+clique compra 5 (ou vende tudo, na aba Vender). Os preços são os do Godot.

let _abaLoja = 0;
const ABAS_LOJA = ['Comprar', 'Vender', 'Mercearia', 'Sementes'];

// (onda final) O horário do depósito, num lugar só (a loja, a seta "abre às 8h" e o imprevisto do cimento da obra leem daqui).
const DEPOSITO_HORARIO = { abre: 8 * 60, fecha: 17 * 60 };
const depositoFechado = () => G.minutos < DEPOSITO_HORARIO.abre || G.minutos >= DEPOSITO_HORARIO.fecha;
function entrarDeposito() {
  if (depositoFechado()) { abrirPlaca(`Depósito do Seu Ananias: fechado agora. Abre das ${DEPOSITO_HORARIO.abre / 60}h às ${DEPOSITO_HORARIO.fecha / 60}h.`); return true; }
  abrirLoja();
  return true;
}
const descontoHab = () => (typeof Habilidades !== 'undefined' ? Habilidades.desconto() : 1);
function precoLoja(id) { return Math.max(1, Math.round(LOJA.PRECOS[id] * (G.fatorPreco || 1) * descontoHab() * (typeof Gremio !== 'undefined' ? Gremio.descontoDeposito() : 1))); }
function precoMercearia(id) { return Math.max(1, Math.round(Pratos.MERCEARIA[id] * (G.fatorPreco || 1) * descontoHab())); }

// (T4b, Negócio 6 e 9) fiado: no depósito do Ananias, o que o dinheiro não cobre vai para a caderneta dele (G.fiado), até o limite
// (Fiado.livre, niveis_jogo.js). Paga-se no balcão ou o Ananias recebe no domingo à noite.
function _comprar(id, qtd, preco, fiado = false) {
  const livre = fiado && typeof Fiado !== 'undefined' ? Fiado.livre() : 0, caixa = Math.max(0, G.dinheiro);
  const pode = Math.min(qtd, Math.floor((caixa + livre) / preco), G.mochila.espacoPara(id));
  if (pode <= 0) { avisar(G.dinheiro + livre < preco ? (fiado && typeof Fiado !== 'undefined' && Fiado.limite() ? `O dinheiro e o fiado não dão (fiado: Cr$ ${G.fiado} de ${Fiado.limite().toLocaleString('pt-BR')}).` : 'O dinheiro não dá.') : 'A mochila está cheia.'); return 0; }
  const levou = pode - G.mochila.adicionar(id, pode), total = levou * preco, agora = Math.min(caixa, total), anotado = total - agora;
  G.dinheiro -= agora; G.gastoHoje += agora; if (anotado > 0) G.fiado = (G.fiado || 0) + anotado;
  sons.tocar('dinheiro', 1, 0.05, -4);
  avisar('Comprou ' + Itens.qtd(levou, id) + (anotado > 0 ? ` (Cr$ ${anotado} no fiado; deve Cr$ ${G.fiado})` : '') + '.');
  hudSujo();
  return levou;
}
const comprarLoja = (id, qtd) => _comprar(id, qtd, precoLoja(id), true);
const comprarMercearia = (id, qtd) => _comprar(id, qtd, precoMercearia(id), true);
// (T4b, Negócio 4) a Revenda: o Ananias compra de volta o material dele pela metade do preço da tabela.
const revendaLoja = () => typeof Habilidades !== 'undefined' && Habilidades.ganho('revenda') ? ECO.niveis.revendaItens.filter(id => LOJA.PRECOS[id] && !LOJA.COMPRA[id]) : [];
const precoVendaLoja = id => LOJA.COMPRA[id] || (revendaLoja().includes(id) ? Math.floor(LOJA.PRECOS[id] * ECO.niveis.revenda) : 0);
function venderLoja(id, qtd) {
  const n = Math.min(qtd, G.mochila.total(id));
  if (n <= 0 || !precoVendaLoja(id)) return 0;
  G.mochila.remover(id, n);
  const v = n * precoVendaLoja(id);
  G.dinheiro += v; G.ganhoHoje += v;
  sons.tocar('dinheiro', 1.1, 0.05, -4);
  avisar(`Vendeu ${Itens.qtd(n, id)} por Cr$ ${v}.`);
  hudSujo();
  return n;
}

// A legenda da semente na aba Sementes: quanto demora para crescer DE VERDADE para este jogador (Horta.diasPara, com o Agrônomo, como
// no Pierre do Stardew); tomate e milho dizem que voltam a dar (a rebrota é sempre a mesma espera: o pé volta `rebrota` dias antes).
function tempoDeCrescer(item) {
  const cultura = culturaDaSemente(item), c = CULTURAS[cultura];
  if (!c) return '';
  const n = Horta.diasPara(cultura), agro = typeof Habilidades !== 'undefined' && Habilidades.tem('agronomo');
  return `cresce em ${n} ${n === 1 ? 'dia' : 'dias'}${agro ? ' (Agrônomo)' : ''}${c.rebrota ? `, depois dá a cada ${c.rebrota}` : ''}`;
}

// (14/10, "na mercearia coloque uma explicação melhor no item") a linha pequena de cada item diz PARA QUE SERVE; a dica do mouse, o texto inteiro.
// Material do depósito: onde se usa, curto (tirado das descrições em dados.js; o resto cai na descrição do item).
const USO_MATERIAL = {
  cimento: 'obra e reforma', tijolo: 'paredes da obra', vergalhao: 'concreto armado', cal: 'aditivo da obra', tinta: 'pintura de muro',
  pigmento: 'cor do cimentado', ladrilho: 'piso colorido', telha: 'telhado', pao: 'comer: +60 energia', cafe: 'tomar: +25 energia',
  lapis: 'presente da Ritinha', impermeabilizante: 'aditivo forte da obra',
};
// Ingrediente da Mercearia: até 2 receitas que a pensão JÁ CONHECE e pedem o item (+N se houver mais).
const receitasQuePedem = id => (G.pensao ? G.pensao.receitas : []).filter(r => Pratos.PRATOS[r] && (Pratos.PRATOS[r].porcao || {})[id]).map(r => Pratos.PRATOS[r].nome);
function usoMercearia(id) {
  const rec = receitasQuePedem(id), nomes = rec.slice(0, 2).join(', ') + (rec.length > 2 ? ` +${rec.length - 2}` : '');
  return (rec.length ? 'vai pra despensa: ' + nomes : 'ingrediente da pensão (receita ainda por aprender)') + (G.pensao ? ' · na despensa: ' + (G.pensao.despensa[id] || 0) : '');
}
function usoMercearia_dica(id) {
  const rec = receitasQuePedem(id);
  return `${Itens.nome(id)}: ingrediente da Pensão da Rosa. ` + (rec.length ? 'Receitas que a pensão já sabe e pedem isto: ' + rec.join(', ') + '.' : 'Nenhuma receita que a pensão sabe pede isto ainda. Pesquise receitas novas com a Rosa.') +
    ' Guarde na despensa (a caixa da pensão) para a Rosa cozinhar.';
}
// A explicação curta (a linha pequena, antes do "tem N") e a longa (a dica do mouse) de um item de cada aba.
function explicaItemLoja(aba, id) {
  const desc = Itens.descricao(id);
  if (aba === 0) return { curta: USO_MATERIAL[id] || '', longa: desc };
  if (aba === 1) return { curta: '', longa: desc };
  if (aba === 2) return { curta: usoMercearia(id), longa: usoMercearia_dica(id) };
  if (id === 'esterco') return { curta: 'adubo: na cova vazia, antes de plantar', longa: ESTERCO_DICA };
  if (culturaDaSemente(id)) return { curta: tempoDeCrescer(id), longa: desc + (desc ? ' ' : '') + tempoDeCrescer(id) + '.' };
  if (id === 'regadorzinho') return { curta: 'para o Zezinho regar', longa: desc };
  return { curta: '', longa: desc };
}

function abrirLoja() {
  const caixa = el('div', { class: 'painel' });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px;display:flex;justify-content:space-between' },
      el('span', {}, 'Depósito do Seu Ananias'), el('span', {}, 'Cr$ ' + G.dinheiro)));
    if (typeof Fiado !== 'undefined') { const f = Fiado.linhaLoja(desenha); if (f) caixa.append(f); }   // (T4b) a caderneta do fiado
    caixa.append(el('div', { class: 'abas' }, ABAS_LOJA.map((n, i) => el('div', { class: 'aba' + (i === _abaLoja ? ' ativa' : ''), onclick: e => { e.stopPropagation(); _abaLoja = i; desenha(); } }, n))));
    let ids, preco, acao, dica;
    if (_abaLoja === 0) { ids = Object.keys(LOJA.PRECOS); preco = precoLoja; acao = (id, s) => comprarLoja(id, s ? 5 : 1); dica = 'Clique: compra 1 · Shift+clique: compra 5'; }
    else if (_abaLoja === 1) { ids = Object.keys(LOJA.COMPRA).concat(revendaLoja()); preco = precoVendaLoja; acao = (id, s) => venderLoja(id, s ? 999 : 1); dica = 'Clique: vende 1 · Shift+clique: vende tudo' + (revendaLoja().length ? ' · Revenda: o material do depósito volta pela metade' : ''); }
    else if (_abaLoja === 2) {
      const grau = G.pensao ? G.pensao.grau() : 1;
      ids = Object.keys(Pratos.MERCEARIA).filter(id => Pratos.fase(id) <= grau); preco = precoMercearia; acao = (id, s) => comprarMercearia(id, s ? 5 : 1);
      dica = 'Ingredientes da Pensão da Rosa. Mais coisas aparecem quando a pensão fica famosa.';
    }
    else { ids = sementesDaLoja(); preco = precoSemente; acao = (id, s) => _comprar(id, s ? 5 : 1, precoSemente(id), true); dica = 'Sementes da estação, adubo e coisas da horta. Clique: compra 1 · Shift+clique: compra 5'; }
    const falta = typeof compras !== 'undefined' ? compras.falta(G.mochila) : {};
    caixa.append(el('div', { class: 'grade loja' + (_abaLoja >= 2 ? ' uma' : '') }, ids.map(id => { const ex = explicaItemLoja(_abaLoja, id); return el('div', { class: 'linha', title: ex.longa, onclick: e => { e.stopPropagation(); acao(id, e.shiftKey); desenha(); } },
      el('img', { src: urlItem(id) }), el('div', { class: 'texto' }, Itens.nome(id), falta[id] ? el('span', { style: 'color:var(--destaque)' }, `  (falta ${falta[id]})`) : null,
        el('div', { class: 'tem' }, (ex.curta ? ex.curta + ' · ' : '') + 'tem ' + G.mochila.total(id))), el('span', { class: 'preco' }, 'Cr$ ' + preco(id))); })));
    caixa.append(el('div', { class: 'rodape' }, dica));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('abrir', 1.1, 0.03, -6);
}
