// Jocelino — calendario_pensao.js — (14/10, Tarefa E1 do guia do Bancho) A semana da Pensão da Rosa numa lousa de giz: de hoje
// até 6 dias à frente, o que vai acontecer em cada noite. Como é nos jogos de referência:
// - Stardew: o calendário na porta do Pierre mostra as festas e os aniversários da estação; ele INFORMA, não manda. O jogador
//   olha, se prepara (compra o presente, guarda o peixe) e decide sozinho.
// - Dave the Diver: o VIP avisa antes e diz o prato; a noite de festa tem tema; o concurso tem data. Ninguém "aceita missão".
// Aqui, cada dia mostra só o que é CERTO:
//   o VIP e o prato dele e a festa com o prato do tema (os da agenda: entram quando a carta chega, 3 dias antes; o resto da semana
//   ainda não tem carta, e o calendário não adivinha); o Concurso da Rádio (a cada 14 dias, no domingo, data fixa); o Viajante da
//   Capital (às quintas, com a pensão no degrau dele); os moradores que jantam naquela noite (clientela.js, pelo dia da semana) e o
//   prato de cada um; o filho que aparece (a Ritinha no caixa ou o Zezinho); o domingo fechado.
// Fica de fora o que é surpresa ou sorteio: o Doutor Paladar (chega disfarçado, como o crítico do Dave) e os clientes de fora.
// (16/10, E2 das encomendas de festa) Os pedidos da Vila com prazo saíram da agenda. (E3) No lugar deles, a festa que um morador
// marcou na pensão (encomendas.js): a linha cal-encomenda no dia dela, com o retrato dele, "Festa da Dona Zélia", o prato para a
// turma e a ocasião, e o enfeite da turma de ícone. Entra no dia em que a Rosa conta (o aviso: 1 a 4 dias antes, conforme o prato).
// (T5 das conversas e histórias) Os aniversários (presentes.js): uma linha pequena com o retrato e o bolo no dia de cada um, logo
// abaixo do nome do dia; com a pensão ainda fechada, a placa do calendário da Vila diz os da semana.
// Abre pelo botão "Calendário" do rodapé do salão (palco.js) e pelo calendário da Vila (mapa_vila.js). Primeira vez com a Rosa
// explicando (a seta e a faixa, guia_setas.js: PRIMEIRA_TELA.calendario); some depois de fechado uma vez.
// Regras puras em Calendario (a s44 confere); a tela em abrirCalendarioPensao(). A arte é a que já existe (a lousa, os retratos,
// os pratos, os enfeites da festa, o microfone da rádio); nada desenhado por código.

const Calendario = {
  DIAS: 7,
  domingo: d => (d - 1) % 7 === 6,
  // Um dia do calendário (d: dia absoluto; hoje: o dia de hoje).
  dia(p, d, hoje) {
    const aberta = !!p && ['aberta', 'pronta'].includes(p.estado), ag = (p && p.agenda) || [];
    const e = { dia: d, hoje: d === hoje, amanha: d === hoje + 1, semana: DIAS[(d - 1) % 7], estacao: ESTACOES[Math.floor((d - 1) / 28) % 4],
      noEstacao: (d - 1) % 28 + 1, domingo: Calendario.domingo(d) };
    e.fechado = e.domingo;
    const ev = tipo => ag.find(x => x.tipo === tipo && x.dia === d && !x.fim);
    const v = ev('vip'), f = ev('festa');
    e.vip = v && typeof vipDe === 'function' && vipDe(v.id) ? { id: v.id, nome: vipDe(v.id).nome, prato: v.prato } : null;
    e.festa = f ? { nome: f.nome, prato: f.prato, categoria: f.categoria || '' } : null;
    // (E3) a festa de um morador, já avisada (ela é surpresa até a Rosa contar)
    const enc = ag.find(x => x.tipo === 'encomenda' && x.dia === d && !x.fim && x.avisado <= hoje);
    e.encomenda = enc && typeof AvisoFesta !== 'undefined' ? { quem: enc.quem, titulo: 'Festa ' + AvisoFesta.da(enc), prato: enc.prato, turma: enc.turma,
      ocasiao: AvisoFesta.ocasiao(enc), enfeite: Encomendas.enfeite(enc), mudou: !!enc.mudou } : null;
    const est = Concurso.estacaoAbs(d);
    // (revisão) a mesma regra do botão do Concurso (podeConcurso): só com a pensão 'aberta', não 'pronta'
    e.concurso = Concurso.temNoDia(p, d) ? { tema: CONCURSO_TEMAS[est % 4].nome } : null;
    e.viajante = Viajante.presente(p, d);
    // (C1, 16/10) a inauguração cai no dia em que a pensão abre (o abreDia; ou hoje, se a pensão já abriu e ainda não jantou), e
    // não num domingo (relatório B, dia 8: pronta para amanhã, a Semana dizia "Hoje: Inauguração"); os moradores e o filho, só
    // dali em diante
    const abre = aberta ? Calendario.diaDaInauguracao(p, hoje) : 0, antes = aberta && p.abreDia > 0 && d < p.abreDia;
    e.inauguracao = aberta && p.ultimaJanta === -1 && !p.fama && d === abre;
    e.patrimonio = aberta && p.festaDia === d;
    // (E3) na noite da festa dele, o anfitrião vem com a turma, e não de novo como freguês da semana
    e.moradores = !aberta || e.fechado || antes ? [] : (CLIENTELA[(d - 1) % 7] || []).filter(c => !(e.encomenda && e.encomenda.quem === c.id)).map(c => ({ id: c.id, nome: c.nome, prato: c.prato, sabe: p.receitas.includes(c.prato) }));
    e.filho = aberta && !e.fechado && !antes ? Clientela.filhoDaNoite(d) : '';
    // (T5 das conversas) os aniversários do dia (presentes.js): a Vila e a família, com ou sem a pensão aberta
    e.aniversarios = typeof Presentes !== 'undefined' ? Presentes.noDia(d) : [];
    return e;
  },
  // (C1) O dia da primeira janta: o abreDia (ou hoje, se já passou), pulando o domingo.
  diaDaInauguracao(p, hoje) { const d = Math.max(hoje, p.abreDia > 0 ? p.abreDia : hoje); return Calendario.domingo(d) ? d + 1 : d; },
  // A semana: hoje e os 6 dias seguintes.
  semana(p, hoje) { return Array.from({ length: Calendario.DIAS }, (_, k) => Calendario.dia(p, hoje + k, hoje)); },
  // Tem alguma coisa marcada (VIP, festa do tema ou a festa de um morador, já avisada) na agenda? (a seta da primeira vez no botão do
  // rodapé espera isso)
  temEspecial(p, hoje) { return ((p && p.agenda) || []).some(x => (x.tipo === 'vip' || x.tipo === 'festa' || (x.tipo === 'encomenda' && x.avisado <= hoje)) && !x.fim && x.dia >= hoje && x.dia < hoje + Calendario.DIAS); },
};

// ---------- a tela ----------
const _nomeCurto = n => String(n).split(',')[0];
const _prato = id => (Pratos.PRATOS[id] || { nome: id }).nome;
function _linhaCal(classe, img, titulo, info) {
  return el('div', { class: 'cal-linha ' + classe + (img ? '' : ' sem-img') }, img ? el('img', { src: urlArte(img), alt: '' }) : null,
    el('div', { class: 'cal-txt' }, el('b', {}, titulo), info ? el('span', {}, info) : null));
}
function _diaCal(e) {
  const cab = e.hoje ? 'Hoje' : e.amanha ? 'Amanhã' : e.semana[0].toUpperCase() + e.semana.slice(1);
  const caixa = el('div', { class: 'cal-dia' + (e.hoje ? ' hoje' : '') + (e.fechado ? ' fechado' : ''), 'data-dia': e.dia },
    el('div', { class: 'cal-cabeca' }, el('span', { class: 'cal-nome' }, cab), el('span', { class: 'cal-data' }, `${e.hoje || e.amanha ? e.semana + ', ' : ''}dia ${e.noEstacao}`)));
  if (e.fechado) caixa.append(el('div', { class: 'cal-fechou' }, 'Fechado'), el('div', { class: 'cal-nota' }, 'Domingo a família descansa.'));
  // (T5 das conversas) o aniversário: uma linha pequena com o retrato e o bolo (como o calendário do Pierre no Stardew)
  for (const a of e.aniversarios || []) {
    const ret = ARTE_LISTA.includes(`retratos/${a.id}_normal`) ? `retratos/${a.id}_normal` : '';
    const l = _linhaCal('cal-aniversario cal-filho', ret, _nomeCurto(a.nome), 'aniversário');
    l.querySelector('.cal-txt span').prepend(el('img', { class: 'cal-enfeite', src: urlArte('salao/bolo_festa'), alt: '', style: 'width:20px;height:20px;vertical-align:middle;margin:0 3px 0 0;border-radius:0' }));
    l.dataset.quem = a.id;
    caixa.append(l);
  }
  if (e.inauguracao) caixa.append(_linhaCal('cal-festa', 'salao/enfeite_festa', 'Inauguração', 'a Vila vem convidada'));
  if (e.patrimonio) caixa.append(_linhaCal('cal-festa', 'salao/enfeite_festa', 'Festa do Patrimônio', 'a Vila inteira vem'));
  if (e.vip) caixa.append(_linhaCal('cal-vip', ARTE_LISTA.includes(`retratos/${e.vip.id}_normal`) ? `retratos/${e.vip.id}_normal` : '', _nomeCurto(e.vip.nome), `pede ${_prato(e.vip.prato)}`));
  if (e.festa) {
    const enf = typeof ENFEITE_FESTA !== 'undefined' ? (ENFEITE_FESTA[e.festa.nome] || ENFEITE_FESTA[''])[0] : 'enfeite_festa';
    caixa.append(_linhaCal('cal-festa', 'salao/' + enf, e.festa.nome, `${_prato(e.festa.prato)}${e.festa.categoria ? ' e todo ' + CATEGORIAS[e.festa.categoria].toLowerCase() : ''} vale 50% mais`));
  }
  if (e.encomenda) {
    // (E3) o retrato do anfitrião (o Tonhão não tem: vale o enfeite) e o enfeite da turma de ícone; cal-festa dá a cor e a seta da 1ª vez
    const c = e.encomenda, ret = ARTE_LISTA.includes(`retratos/${c.quem}_normal`) ? `retratos/${c.quem}_normal` : '';
    const l = _linhaCal('cal-encomenda cal-festa', ret || c.enfeite, c.titulo, `${_prato(c.prato)} para ${c.turma} · ${c.ocasiao}${c.mudou ? ' (mudou de dia)' : ''}`);
    // (o enfeite pequeno, junto do título: a coluna do dia é estreita e o texto não pode ficar espremido entre duas figuras)
    if (ret) l.querySelector('.cal-txt b').append(' ', el('img', { class: 'cal-enfeite', src: urlArte(c.enfeite), alt: '', style: 'width:24px;height:24px;vertical-align:middle;margin:0' }));
    l.dataset.quem = c.quem;
    caixa.append(l);
  }
  if (e.concurso) caixa.append(_linhaCal('cal-concurso', 'ui/microfone_radio', 'Concurso da Rádio', `3 pratos; o tema: ${e.concurso.tema}`));
  if (e.viajante) caixa.append(_linhaCal('cal-viajante', 'retratos/viajante_normal', 'O Viajante', 'na praça, só hoje'));
  if (e.moradores.length) {
    caixa.append(el('div', { class: 'cal-sub' }, 'Jantam aqui'));
    for (const m of e.moradores) caixa.append(_linhaCal('cal-morador', ARTE_LISTA.includes(`retratos/${m.id}_normal`) ? `retratos/${m.id}_normal` : '', m.nome,
      m.sabe ? `gosta de ${_prato(m.prato)}` : `gosta de ${_prato(m.prato)} (falta a receita)`));
  }
  if (e.filho === 'ritinha') caixa.append(_linhaCal('cal-filho', 'retratos/ritinha_normal', 'Ritinha no caixa', 'gorjeta 10% maior'));
  else if (e.filho === 'zezinho') caixa.append(_linhaCal('cal-filho', 'retratos/zezinho_normal', 'Zezinho por perto', 'de olho na cocada'));
  return caixa;
}
function abrirCalendarioPensao() {
  const p = G.pensao;
  if (!p || !['aberta', 'pronta'].includes(p.estado)) {
    // (T5 das conversas) sem a pensão, a lousa ainda não existe, mas os aniversários da semana já estão anotados
    const anivs = [];
    for (let d = G.dia; d < G.dia + Calendario.DIAS; d++) for (const a of typeof Presentes !== 'undefined' ? Presentes.noDia(d) : []) anivs.push(`${a.nome} (${d === G.dia ? 'hoje' : d === G.dia + 1 ? 'amanhã' : DIAS[(d - 1) % 7] + ', dia ' + ((d - 1) % 28 + 1)})`);
    abrirPlaca('O calendário da Vila. Quando a pensão da Rosa abrir, ela anota aqui a semana: quem vem jantar, as festas e o domingo fechado.'
      + (anivs.length ? ` Aniversário nesta semana: ${anivs.join(', ')}.` : ''));
    return true;
  }
  const sem = Calendario.semana(p, G.dia);
  const ultimo = sem[sem.length - 1];
  const lousa = el('div', { class: 'lousa calendario-pensao' },
    el('div', { class: 'giz-titulo' }, 'A semana da pensão'),
    el('div', { class: 'cal-topo' }, `${sem[0].estacao}, dia ${sem[0].noEstacao}` + (ultimo.estacao === sem[0].estacao ? ` a ${ultimo.noEstacao}` : ` a ${ultimo.estacao}, dia ${ultimo.noEstacao}`)),
    // a fala da Rosa na primeira vez (guia_setas.js escreve nela; a seta fica no dia)
    el('div', { class: 'guia-faixa cal-faixa', hidden: true }, el('img', { src: urlArte('retratos/rosa_normal'), alt: '' }), el('div', { class: 'guia-faixa-texto' })),
    el('div', { class: 'cal-semana' }, ...sem.map(_diaCal)),
    el('div', { class: 'giz-divisoria' }),
    el('div', { class: 'cal-pe' },
      el('img', { class: 'giz-enfeite palmeira', src: urlArte('ui/pensao/palmeirinha_giz'), alt: '' }),
      el('div', { class: 'cal-notas' },
        el('div', {}, 'O jantar especial e a festa entram aqui quando a carta chega, 3 dias antes. A festa de um vizinho entra quando ele marca com a Rosa. Os clientes de fora vêm sem avisar.')),
      el('button', { class: 'tabua', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar'),
      el('img', { class: 'giz-enfeite palmeira', src: urlArte('ui/pensao/palmeirinha_giz'), alt: '' })));
  // a primeira vez: fechou a lousa, a Rosa já explicou (a seta e a faixa somem)
  abrirModal(lousa, () => { if (G.limpou) G.limpou.tela_calendario = (G.limpou.tela_calendario || 0) + 1; });
  if (typeof sons !== 'undefined') sons.tocar('abrir', 0.9, 0.03, -6);
  return true;
}
