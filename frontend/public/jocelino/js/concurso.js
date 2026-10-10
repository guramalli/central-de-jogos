// Jocelino — concurso.js — o Concurso da Rádio Maré, no último dia de cada estação (o concurso de culinária do Dave,
// sem reflexo nenhum): o Jocelino escolhe 3 pratos que a despensa rende e manda para a rádio; 3 jurados dão nota, cada
// um com o seu gosto — o Seu Aurélio quer ingrediente raro, a Dona Lurdes quer capricho (nível) e o Paulo, locutor,
// quer o prato da estação. Ganhou dos rivais: troféu na parede da pensão (melhoria 'trofeu') e uma receita nova.
// A carta chega 3 dias antes. Regras puras (testadas na s1); a tela é abrirConcurso().

// Os pratos de cada estação (o gosto do locutor): Outono, Inverno, Primavera, Verão.
const CONCURSO_TEMAS = [
  { nome: 'peixe do outono', pratos: ['peixe_frito', 'moqueca', 'sardinha_frita', 'lambari_crocante', 'peixe_ensopado', 'peixada', 'caldo_peixe', 'moqueca_capixaba', 'robalo_assado'] },
  { nome: 'caldo de inverno', pratos: ['sopa_pedra', 'caldo_caranguejo', 'sopa_legumes', 'caldo_peixe', 'caldeirada', 'pirao', 'mingau_milho', 'canjica'] },
  { nome: 'horta da primavera', pratos: ['salada_rosa', 'couve_mineira', 'pure_abobora', 'virado', 'mandioca_frita', 'farofa_ovo', 'escondidinho', 'pf_peao'] },
  { nome: 'doce de verão', pratos: ['cocada_tijolinho', 'goiabada', 'rabanada', 'arroz_doce', 'bolo_milho', 'bolinho_chuva', 'doce_leite_calixto', 'pamonha'] },
];
const JURADOS = [
  { id: 'aurelio', nome: 'Seu Aurélio, da Gazeta', gosto: 'raridade', texto: 'quer ingrediente raro' },
  { id: 'lurdes', nome: 'Dona Lurdes, cozinheira de mão cheia', gosto: 'nivel', texto: 'quer prato caprichado' },
  { id: 'paulo', nome: 'Paulo, locutor da Rádio Maré', gosto: 'tema', texto: 'quer o prato da estação' },
];
const Concurso = {
  RIVAL_BASE: 16, RIVAL_POR_ANO: 2,
  hoje(dia) { return dia % 28 === 0; },
  estacaoAbs(dia) { return Math.floor((dia - 1) / 28); },
  raridade(id) { const pr = Pratos.PRATOS[id]; return (pr && pr.raridade) || 1; },
  // A nota dos 3 jurados (0 a 10 cada, média dos 3 pratos), o total e a nota do melhor rival.
  julgar(p, ids, est, ano = 0) {
    const tema = CONCURSO_TEMAS[est % 4], media = f => Math.round(ids.reduce((s, id) => s + f(id), 0) / ids.length * 10) / 10;
    const notas = {
      raridade: media(id => 2 + 2 * Concurso.raridade(id)),
      nivel: media(id => p.nivel(id)),
      tema: media(id => tema.pratos.includes(id) ? 10 : 4 + Math.min(3, Concurso.raridade(id))),
    };
    const jurados = JURADOS.map(j => ({ id: j.id, nome: j.nome, gosto: j.gosto, nota: notas[j.gosto] }));
    const total = Math.round(jurados.reduce((s, j) => s + j.nota, 0) * 10) / 10, rivais = Concurso.RIVAL_BASE + Concurso.RIVAL_POR_ANO * ano;
    return { pratos: ids.slice(), jurados, total, rivais, venceu: total > rivais, tema: tema.nome };
  },
  // O prêmio (uma vez por estação): o troféu e a receita de pesquisa mais simples que ainda falta.
  premiar(p, res, estAbs) {
    p.concursos = p.concursos || {};
    if (p.concursos[estAbs]) return null;
    p.concursos[estAbs] = res.venceu ? 'venceu' : 'participou';
    if (!res.venceu) return null;
    if (!p.melhorias.includes('trofeu')) p.melhorias.push('trofeu');
    const falta = Object.keys(RECEITAS_NOVAS).filter(id => RECEITAS_NOVAS[id].caminho === 'ingrediente' && !p.receitas.includes(id))
      .sort((a, b) => RECEITAS_NOVAS[a].raridade - RECEITAS_NOVAS[b].raridade);
    const receita = falta[0] || '';
    if (receita) p.liberarReceita(receita);
    return { receita };
  },
  // Os pratos que dá para mandar: os do caderno que a despensa (ou a panela) rende.
  candidatos(p) { return p.receitas.filter(id => p.rende(id) > 0 || p.porcoes(id) > 0); },
  // Manda os 3 pratos: gasta uma porção de cada, julga e premia.
  participar(p, ids, dia) {
    const est = Concurso.estacaoAbs(dia);
    if ((p.concursos || {})[est] || ids.length !== 3) return null;
    const f0 = mulberry(dia * 71), f = { randf: f0, randi: () => Math.floor(f0() * 4294967296) };
    for (const id of ids) { if (p.porcoes(id) > 0) { p.panela[id]--; if (p.panela[id] <= 0) delete p.panela[id]; } else p.consumir(id, f); }
    const res = Concurso.julgar(p, ids, est % 4, Math.floor(est / 4));
    res.premio = Concurso.premiar(p, res, est);
    return res;
  },
};
// A carta 3 dias antes e a tarefa do dia.
MANHA.push(() => {
  const p = G.pensao;
  if (!p || p.estado !== 'aberta') return;
  if (Concurso.hoje(G.dia + 3)) {
    const tema = CONCURSO_TEMAS[Concurso.estacaoAbs(G.dia + 3) % 4];
    CARTAS['concurso_' + G.dia] = { de: 'Rádio Maré', dia: G.dia, texto: `Atenção, Vila Maré! No último dia da estação tem o Concurso da Rádio. Mande 3 pratos da sua cozinha para os jurados: o Seu Aurélio quer ingrediente raro, a Dona Lurdes quer capricho e o Paulo, aqui da rádio, quer ${tema.nome}. O vencedor leva o troféu e uma receita!` };
    G.correio.caixa.push('concurso_' + G.dia);
  }
});
TAREFAS.push(() => {
  const p = G.pensao;
  return p && p.estado === 'aberta' && Concurso.hoje(G.dia) && !(p.concursos || {})[Concurso.estacaoAbs(G.dia)] ? [{ texto: 'Concurso da Rádio hoje: mande 3 pratos (botão Concurso, no salão)' }] : [];
});
const podeConcurso = () => !!G.pensao && G.pensao.estado === 'aberta' && Concurso.hoje(G.dia) && !(G.pensao.concursos || {})[Concurso.estacaoAbs(G.dia)];

// ---------- a tela do concurso ----------
function abrirConcurso() {
  const p = G.pensao;
  if (!podeConcurso()) { abrirPlaca('O Concurso da Rádio é no último dia de cada estação. A carta chega 3 dias antes.'); return true; }
  const est = Concurso.estacaoAbs(G.dia), tema = CONCURSO_TEMAS[est % 4], escolha = [];
  const caixa = el('div', { class: 'painel concurso' });
  const desenha = () => {
    caixa.innerHTML = '';
    const cands = Concurso.candidatos(p);
    caixa.append(el('div', { class: 'conc-topo' }, el('img', { src: urlArte('ui/microfone_radio'), class: 'conc-mic' }),
      el('div', {}, el('div', { class: 'titulo', style: 'font-size:28px' }, 'Concurso da Rádio Maré'),
        el('div', { class: 'rodape', style: 'text-align:left' }, `Escolha 3 pratos (gasta uma porção de cada). O prato da estação é ${tema.nome}.`))),
      el('div', { class: 'conc-jurados' }, ...JURADOS.map(j => el('div', { class: 'conc-jurado' }, el('img', { src: urlArte('retratos/' + j.id + '_normal') }),
        el('div', {}, el('b', {}, j.nome), el('div', {}, j.texto))))));
    const grade = el('div', { class: 'conc-pratos' });
    if (!cands.length) grade.append(el('div', { class: 'rodape' }, 'A despensa não rende nenhum prato: guarde ingredientes primeiro.'));
    for (const id of cands) grade.append(el('div', { class: 'conc-prato' + (escolha.includes(id) ? ' sel' : ''), onclick: e => { e.stopPropagation();
      const k = escolha.indexOf(id); if (k >= 0) escolha.splice(k, 1); else if (escolha.length < 3) escolha.push(id); sons.tocar('pagina', 1, 0.05, -8); desenha(); } },
      el('img', { src: urlArte(iconePratoGrande(id)) }), el('div', {}, Pratos.PRATOS[id].nome), el('div', { class: 'conc-info' }, `${'★'.repeat(Concurso.raridade(id))} · Nv ${p.nivel(id)}${tema.pratos.includes(id) ? ' · da estação' : ''}`)));
    caixa.append(grade, el('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-top:10px' },
      el('div', { style: 'font-weight:900' }, `${escolha.length}/3 escolhidos`),
      el('div', { style: 'display:flex;gap:8px' }, el('button', { class: 'botao', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Depois'),
        el('button', { class: 'botao forte' + (escolha.length === 3 ? '' : ' desligado'), onclick: e => { e.stopPropagation(); if (escolha.length !== 3) return;
          const r = Concurso.participar(p, escolha, G.dia); if (r) { fecharModal(); mostrarResultadoConcurso(r); } } }, 'Mandar para a rádio'))));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('abrir', 1, 0.03, -6);
  return true;
}
function mostrarResultadoConcurso(r) {
  const caixa = el('div', { class: 'painel concurso' },
    el('div', { class: 'titulo', style: 'font-size:28px' }, r.venceu ? 'A Pensão da Rosa venceu o concurso!' : 'Não foi dessa vez...'),
    el('div', { class: 'conc-jurados' }, ...r.jurados.map(j => el('div', { class: 'conc-jurado' }, el('img', { src: urlArte('retratos/' + j.id + (j.nota >= 7 ? '_alegre' : '_normal')) }),
      el('div', {}, el('b', {}, j.nome), el('div', { class: 'conc-nota' }, `Nota ${j.nota}`))))),
    el('div', { class: 'fx-linha lucro' }, el('span', {}, 'Total da pensão'), el('b', {}, `${r.total} de 30`)),
    el('div', { class: 'fx-linha' }, el('span', {}, 'Melhor rival'), el('b', {}, `${r.rivais}`)),
    r.venceu ? el('div', { class: 'conc-premio' }, el('img', { src: urlArte('ui/trofeu_concurso') }),
      el('div', {}, el('b', {}, 'Prêmio: o troféu na parede da pensão (gorjeta um pouco maior)'), r.premio && r.premio.receita ? el('div', {}, `e uma receita nova no caderno: ${Pratos.PRATOS[r.premio.receita].nome}!`) : null))
      : el('div', { class: 'rodape', style: 'text-align:left' }, 'Prato raro, caprichado e da estação: na próxima estação tem mais concurso!'),
    el('div', { style: 'text-align:right;margin-top:10px' }, el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  abrirModal(caixa);
  sons.tocar(r.venceu ? 'fanfarra' : 'cliente_hmpf', 1, 0, -4);
}
