// Jocelino — recados_jogo.js — os recados do povo da Vila no mundo (plano de 15/10, "Quadro de pedidos da Vila", T3). As regras
// moram em recados.js; aqui fica o que o jogador vê e faz:
// - o cartão "Recado do dia" no quadro da Vila e a linha do recado em "Aceitas" (abrirQuadro, empreitas_jogo.js, chama daqui);
// - a entrega direto da mochila (decisão do dono, 15/10): botão direito no morador que pediu; com tudo na mochila, ANTES da conversa
//   normal ele pergunta "Entregar 3 couves para a Dona Zélia? (Cr$ 70)". Sim: entrega, paga, amizade +50, o som das moedas e o
//   obrigado com o retrato alegre. Agora não: a conversa normal (a diária do Bira, a lista do Zé...). Se o item for material de um
//   serviço aceito ou pedido por outro recado aceito, a pergunta avisa antes ("Você vai precisar de 4 madeiras para consertar a cerca
//   da Dona Zélia..."). Só no mapa do morador (o Lourival do alto-mar não recebe);
// - sem a quantidade: a conversa normal e, quando ela fecha, o aviso do que falta e de onde vem (sem roubar o clique da diária);
// - a coleta: AO_PEGAR (o ímã de ferramentas.js e o catar de achados.js) soma no recado de coleta aceito;
// - de manhã, o recado do dia sai depois do quadro de serviços (o recado pula os clientes dos serviços do dia); à noite, o aceito
//   vencido sai sem multa e o resumo traz uma linha na voz da pessoa, sem bronca;
// - a linha no quadro de tarefas.
// O recado NÃO conta para a Fala da Vila nem para a carreira (decisão do dono, 15/10).

// "para a Dona Zélia", "para o Zé" (RECADO_ARTIGO mora em recados.js)
const recadoPara = cliente => (RECADO_ARTIGO[cliente] ? RECADO_ARTIGO[cliente] + ' ' : '') + Recados.nome(cliente);
// De onde vem cada item (o aviso do que falta).
const RECADO_ORIGEM = {
  goiaba: 'goiaba nasce no chão do quintal e da Vila', flor: 'flor do mato nasce no chão do quintal, da Vila e da mata',
  coco: 'coco cai no chão do quintal, da Vila e da praia', fibra: 'fibra sai do mato, com a foice',
  madeira: 'madeira sai do galho, do toco e da árvore, com o machado', pedra: 'pedra sai das pedras do chão, com a picareta',
  sardinha: 'pesque na praia, com a vara', tainha: 'pesque na praia, com a vara', cogumelo: 'cogumelo nasce no chão da mata',
};
// Quantos dias faltam para a horta dar a cultura (o pé mais adiantado); null sem nada plantado.
function recadoDiasDaHorta(item) {
  let m = null;
  for (const c of Object.values((G.horta && G.horta.covas) || {})) if (c && c.planta === item) { const d = Math.max(0, Horta.diasDa(c) - c.dias); m = m === null ? d : Math.min(m, d); }
  return m;
}
// O aviso do que falta: "Faltam 2 couves para a Dona Zélia (a horta dá em 3 dias)."
function textoFaltaRecado(id) {
  const P = PEDIDOS_VILA[id], r = Recados.podeEntregar(id), n = Recados.faltam(id), falta = n === 1 ? 'Falta' : 'Faltam';
  if (r === 'juntando') return `Recado ${P.cliente === 'zelia' ? 'da' : 'do'} ${Recados.nome(P.cliente)}: falta juntar ${Itens.qtd(n, P.item)} (conta o que pegar do chão desde que aceitou).`;
  let onde = '';
  if (P.tipo === 'coleta') onde = 'você já juntou: é só ter na mochila';
  else if (typeof CULTURAS !== 'undefined' && CULTURAS[P.item]) { const d = recadoDiasDaHorta(P.item); onde = d === null ? 'plante na horta do quintal' : d === 0 ? 'tem pé pronto na horta: é só colher' : `a horta dá em ${d} dia${d > 1 ? 's' : ''}`; }
  else onde = RECADO_ORIGEM[P.item] || '';
  return `${falta} ${Itens.qtd(n, P.item)} para ${recadoPara(P.cliente)}${onde ? ` (${onde})` : ''}.`;
}
// O item também é pedido por um serviço aceito (o curto gasta no último golpe; a longa, ao começar) ou por OUTRO recado aceito (revisão da
// T3: a Zélia e o Bira pedindo 3 flores cada, entregar a um zerava o outro em silêncio)? Só avisa se a entrega deixar a mochila sem o
// bastante para eles: "4 madeiras para consertar a cerca da Dona Zélia e 15 madeiras para o Zé" (null se não falta).
function recadoOutrosPedidos(item, qtd, idRecado = '') {
  if (!G.mochila) return null;
  const partes = []; let n = 0;
  for (const cid in (G.empreitas && G.empreitas.aceitas) || {}) {
    const E = dadosEmpreita(cid), a = G.empreitas.aceitas[cid]; if (!E || !a) continue;
    const mat = E.tipo === 'curta' ? E.material : E.tipo === 'longa' && a.estado === 'reservada' ? Empreitas.material(cid) : null;
    if (!mat || !mat[item]) continue;
    n += mat[item]; partes.push(`${Itens.qtd(mat[item], item)} para ${E.tipo === 'curta' ? E.nome[0].toLowerCase() + E.nome.slice(1) : `a obra "${E.nome}"`}`);
  }
  for (const rid in (G.recados && G.recados.ativos) || {}) {
    const R = PEDIDOS_VILA[rid]; if (rid === idRecado || !R || R.item !== item) continue;
    n += R.qtd; partes.push(`${Itens.qtd(R.qtd, item)} para ${recadoPara(R.cliente)}`);
  }
  return n && G.mochila.total(item) - qtd < n ? partes.join(' e ') : null;
}
// Os recados só se entregam no morador do mapa dele (o Lourival do alto-mar e quem aparece no salão, no palco ou no subsolo não recebe).
const recadoNoMapaDele = p => !!G.mapa && RECADO_MORADOR[p.id] === G.mapaId;

// ---------- o quadro: "Recado do dia" e a linha dos aceitos ----------
function cartaoRecado(id, botao) {
  const P = PEDIDOS_VILA[id];
  return el('div', { class: 'orel-item recado', 'data-recado': id }, el('img', { src: urlItem(P.item) }),
    el('div', {}, el('div', {}, el('b', {}, Recados.nome(P.cliente)), ' quer ' + Itens.qtd(P.qtd, P.item)),
      el('div', { class: 'recado-fala' }, `"${Recados.fala(id)}"`),
      el('div', { class: 'orel-preco' }, Recados.textoEstado(id))), botao || null);
}
// A seção do recado do dia (null sem recado hoje: dia 1, quadro fechado ou nada possível; ou já aceito, que vai para "Aceitas").
function recadoNoQuadro(redesenha) {
  if (typeof Recados === 'undefined' || !G.recados) return null;
  const id = Recados.noQuadro(); if (!id) return null;
  const cheio = Object.keys(G.recados.ativos).length >= ECO.recados.maxAtivos;
  const botao = cheio ? el('button', { class: 'botao', disabled: 'disabled', title: 'No máximo 2 recados de uma vez' }, 'Termine um recado antes')
    : el('button', { class: 'botao', onclick: e => { e.stopPropagation(); const r = Recados.aceitar(id);
      if (r === 'ok') { sons.tocar('carimbo', 1, 0.05, -6); avisar(`Recado aceito: ${Recados.titulo(id)}.`); hudSujo(); if (redesenha) redesenha(); }
      else avisar({ limite: 'Termine um recado antes de pegar outro.', ja: 'Já aceitou esse recado.' }[r] || 'Esse recado não está mais no quadro.'); } }, 'Aceitar');
  return [el('div', { class: 'cad-sub' }, 'Recado do dia'), el('div', { class: 'qv-lista' }, cartaoRecado(id, botao))];
}
// As linhas dos recados aceitos (na seção "Aceitas" do quadro), com o estado: "tem 1/3 · até amanhã".
function linhasRecadosAceitos() {
  if (typeof Recados === 'undefined' || !G.recados) return [];
  return Object.keys(G.recados.ativos).map(id => cartaoRecado(id, null));
}

// ---------- a entrega no morador ----------
let _recadoPulado = null, _avisoRecado = '';
function conversaSemRecado(p) { _recadoPulado = p; try { conversar(p); } finally { _recadoPulado = null; } }
function entregarRecadoNoMorador(p, id) {
  const P = PEDIDOS_VILA[id], v = Recados.paga(id), r = Recados.entregar(id);
  if (r !== 'ok') { avisar(textoFaltaRecado(id)); return; }
  sons.tocar('moedas', 1, 0.05, -4); hudSujo();
  if (typeof guiaEvento === 'function') guiaEvento('conversou', p.id);   // (foi uma conversa: o guia conta como as outras)
  G.feitosHoje.push(`Recado entregue: ${Itens.qtd(P.qtd, P.item)} para ${recadoPara(P.cliente)}: Cr$ ${v}.`);
  avisar(`Recado entregue! + Cr$ ${v}`);
  abrirConversa(Recados.nome(P.cliente), urlArte('retratos/' + P.cliente + '_alegre'), [P.obrigado]);
}
function perguntarEntregaRecado(p, id) {
  const P = PEDIDOS_VILA[id], qual = `${Itens.qtd(P.qtd, P.item)} para ${recadoPara(P.cliente)}`, m = recadoOutrosPedidos(P.item, P.qtd, id);
  const v = Recados.paga(id), texto = m ? `Você vai precisar de ${m}. Entregar ${qual} mesmo assim? (Cr$ ${v})` : `Entregar ${qual}? (Cr$ ${v})`;
  perguntar(texto, ['Sim', 'Agora não'], i => { if (i === 0) entregarRecadoNoMorador(p, id); else conversaSemRecado(p); });
}
// Antes da conversa normal: o morador que pediu e tem recado aceito.
ANTES_DE_CONVERSAR.push(p => {
  if (!G.recados || p === _recadoPulado || !recadoNoMapaDele(p)) return false;
  const ids = Recados.ativosDe(p.id); if (!ids.length) return false;
  const pronto = ids.find(id => Recados.podeEntregar(id) === 'ok');
  if (pronto) { perguntarEntregaRecado(p, pronto); return true; }
  _avisoRecado = textoFaltaRecado(ids[0]);   // a conversa normal acontece; o aviso vem quando ela fecha
  return false;
});
ATUALIZADORES.push(() => { if (_avisoRecado && !menuAberto()) { avisar(_avisoRecado); _avisoRecado = ''; } });

// ---------- a coleta ----------
AO_PEGAR.push((item, qtd) => {
  if (!G.recados) return;
  for (const id of Recados.contarColeta(item, qtd)) {
    const P = PEDIDOS_VILA[id];
    avisar(`Recado: juntou ${Itens.qtd(P.qtd, P.item)}! Leve para ${recadoPara(P.cliente)} (${ondeFica(RECADO_MORADOR[P.cliente])}).`);
  }
});

// ---------- a manhã e a noite ----------
// De manhã: o quadro de serviços primeiro (o recado pula os clientes dos serviços do dia), depois o recado.
MANHA.push(() => {
  if (!G.recados) return;
  if (G.empreitas && G.empreitas.dia !== G.dia) Empreitas.poeQuadro(G.dia);
  Recados.poeDoDia(G.dia);
});
// À noite: o aceito no último dia do prazo vence, sem multa, com uma linha na voz da pessoa.
NOITE.push(linhas => { if (!G.recados) return; for (const r of Recados.noite()) linhas.push(Recados.linhaVencido(r.id)); });

// ---------- o quadro de tarefas ----------
// "Recado até amanhã: 3 couves para a Dona Zélia" e o progresso (o cartão e a Caderneta põem o "1/3" depois do texto: no texto ele
// sairia dobrado); o mapa é o do morador quando dá para entregar, senão o de onde vem.
TAREFAS.push(() => {
  if (!G.recados || !G.mochila) return [];
  return Object.keys(G.recados.ativos).map(id => {
    const P = PEDIDOS_VILA[id], a = G.recados.ativos[id], juntando = P.tipo === 'coleta' && a.juntou < P.qtd;
    const feito = juntando ? a.juntou : Math.min(P.qtd, G.mochila.total(P.item)), pronto = Recados.podeEntregar(id) === 'ok';
    const origem = P.mapas.includes(G.mapaId) ? G.mapaId : P.mapas.find(m => Recados.aberto(m)) || P.mapas[0];
    return { texto: `Recado ${Recados.textoPrazo(a.ate)}: ${juntando ? 'juntar ' : ''}${Itens.qtd(P.qtd, P.item)} para ${recadoPara(P.cliente)}`,
      feito, meta: P.qtd, mapa: pronto ? RECADO_MORADOR[P.cliente] : origem, recado: id };
  });
});
