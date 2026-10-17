// Jocelino — eventos.js — a agenda da pensão (os VIPs e as festas do Dave the Diver, do nosso jeito):
// - Cliente especial: chega numa noite marcada (carta na véspera), pede um prato certo; servido, dá prêmio (dinheiro,
//   curtidas, pitadas) e uma frase; se não tiver o prato, vai embora decepcionado.
// - Festa: noite temática anunciada por carta (Noite do PF, Arraiá da Pensão...): o prato tema paga 50% mais, vem mais
//   gente e o salão ganha bandeirinhas; o prato tema leva a fitinha no cardápio da parede.
// (16/10, E2 das encomendas de festa) Os "pedidos da Vila" da agenda ("A Zélia quer 3 PFs até sábado") saíram: no lugar deles, um
// morador marca a festa dele na pensão (encomendas.js). O save antigo com pedido aberto é migrado lá (paga a parte já servida).

const VIPS = [
  { id: 'aurelio', nome: 'Seu Aurélio, crítico da Gazeta', gosta: ['moqueca', 'caldo_caranguejo', 'peixe_frito', 'pf_peao'], premio: { dinheiro: 60, curtidas: 15, pitadas: 2 },
    carta: 'Prezada Pensão da Rosa: amanhã à noite o crítico Aurélio, da Gazeta de Santos, janta aí. Dizem que ele só escreve bem de quem acerta o prato que ele pede.', frase: 'Escreverei maravilhas! Que sustância!' },
  { id: 'orlando', nome: 'Seu Orlando, o Prefeito', gosta: ['marmita_peao', 'pf_peao', 'sopa_pedra'], premio: { dinheiro: 100, curtidas: 8, pitadas: 3 },
    carta: 'Gabinete do Prefeito: o Seu Orlando vai jantar amanhã na Pensão da Rosa para conhecer o tal PF famoso. Capricho, que é ano de eleição!', frase: 'Essa pensão merece uma placa!' },
  { id: 'calixto', nome: 'Seu Calixto, o caminhoneiro', gosta: ['bolo_milho', 'pamonha', 'cocada_tijolinho', 'rabanada'], premio: { dinheiro: 40, curtidas: 6, pitadas: 6 },
    carta: 'O caminhoneiro Calixto passa amanhã pela Vila e quer um doce que lembre a casa da mãe dele, lá em Aracaju. Ele paga em receita: sabe tudo de tempero!', frase: 'Igualzinho o da minha mãe! Toma, uns segredos de tempero.' },
  { id: 'santos', nome: 'Seu Moreira, dono da firma', gosta: ['marmita_peao', 'moqueca', 'pf_peao'], premio: { dinheiro: 80, curtidas: 10, pitadas: 2 },
    carta: 'A J. Moreira Construções avisa: o patrão, Seu Moreira, vai jantar na pensão amanhã. Se gostar, manda a peãozada inteira comer aí.', frase: 'Vou mandar meus peões todos pra cá!' },
];
const FESTAS = [
  // (Tarefa D1) categoria: a festa pede uma categoria (receitas.js, CATEGORIAS): todo prato dela vale 50% mais na noite; o prato da
  // festa (o que os convidados pedem e leva a fitinha) continua o primeiro da lista que a pensão sabe.
  { nome: 'Noite do PF em Dobro', pratos: ['pf_peao', 'marmita_peao'], categoria: 'pf' },
  { nome: 'Festa do Peixe Frito', pratos: ['peixe_frito', 'moqueca'], categoria: 'peixe' },
  { nome: 'Arraiá da Pensão', pratos: ['pamonha', 'bolo_milho', 'cocada_tijolinho'], ensina: 'canjica' },
  { nome: 'Noite dos Doces da Vó', pratos: ['rabanada', 'goiabada', 'cocada_tijolinho'], categoria: 'doce' },
  { nome: 'Jogo do Santos na Rádio', pratos: ['caldo_caranguejo', 'pf_peao', 'sopa_pedra'] },
];
// O prêmio de função de cada VIP (o primeiro que a pensão ainda não tem), como os presentes dos VIPs do Dave.
// (14/10, Tarefa E2, o Dave: o dispenser de coquetel vem de presente de VIP) O Seu Orlando, na 2ª vez bem servido, ensina a caipirinha.
const FUNCOES_VIP = { aurelio: ['geladeira', 'barraca_praia'], orlando: ['varanda', 'caipirinha'], calixto: ['galinheiro'], santos: ['freezer'] };
const TEXTO_FUNCAO = { geladeira: 'uma geladeira para a pensão (libera a cerveja gelada)', galinheiro: 'um galinheiro no quintal: 3 ovos de graça toda manhã',
  freezer: 'um freezer: as panelas de peixe rendem 2 porções a mais', varanda: 'o alvará da varanda: dá para ampliar a pensão',
  barraca_praia: 'a ideia de uma barraca da Rosa na praia (um dia, uma filial!)',
  caipirinha: 'o segredo da caipirinha dele, com a cachaça da terra (a caipirinha entra nas bebidas: o freguês pede depois do prato)' };
const AVISO_DIAS = 3;
// O dia do evento avisado hoje: daqui a 3 dias (domingo a pensão fecha: fica para segunda).
const diaDoAviso = dia => { let d = dia + AVISO_DIAS; if ((d - 1) % 7 === 6) d++; return d; };
const DIAS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
// (C17) Quando é o dia d visto de hoje: "hoje", "amanhã" ou "daqui a N dias" (as Metas e o que falta para o degrau dizem a noite).
// (C17, revisão) "no sábado", "no domingo", "na sexta": o dia da semana com o artigo certo (as cartas da agenda e a revisita).
const naDia = d => { const k = (d - 1) % 7; return (k >= 5 ? 'no ' : 'na ') + DIAS[k]; };
const quandoDia = (d, hoje) => d <= hoje ? 'hoje' : d === hoje + 1 ? 'amanhã' : `daqui a ${d - hoje} dias`;

const Eventos = {
  // Planeja os eventos (chamado de manhã; a carta chega 3 dias antes): VIP a cada ~5 dias abertos, festa a cada 7. Sem sorteio: as
  // encomendas de festa têm o sorteio delas (Encomendas.planejar).
  planejar(p, dia) {
    if (p.estado !== 'aberta' && p.estado !== 'pronta') return [];
    p.agenda = p.agenda || [];
    const novos = [], desde = dia - (p.abreDia > 0 ? p.abreDia : dia);
    const amanha = diaDoAviso(dia);                               // a carta chega 3 dias antes
    const marcado = tipo => p.agenda.some(e => e.tipo === tipo && e.dia === amanha);
    // (C20, rodada 1) nem VIP nem festa do tema na noite da inauguração da Construtora Santos
    const daFirma = !!G.firma && !G.firma.feita && G.firma.inauguracaoDia === amanha;
    if (desde >= 2 && desde % 5 === 2 && !marcado('vip') && !daFirma) {
      // (T6 da mata) o VIP de uma vez por estação (o Nhô Quim, serra_jogo.js) fica fora do rodízio: o rodízio é o de sempre
      const rodizio = VIPS.filter(x => !x.porEstacao), v = rodizio[Math.floor(desde / 5) % rodizio.length], ok = v.gosta.filter(id => p.receitas.includes(id));
      // Ele pede a receita com o nome dele quando a pensão já aceita os ingredientes; a carta traz a receita para o caderno.
      const rv = receitaDoVip(v.id), da = rv && Object.keys(Pratos.PRATOS[rv].porcao).every(i => i === 'peixe' || p.aceita(i));
      if (da) p.liberarReceita(rv);
      novos.push({ tipo: 'vip', id: v.id, dia: amanha, avisado: dia, prato: da ? rv : (ok.length ? ok[0] : v.gosta[v.gosta.length - 1]), ensinou: da ? rv : '' });
    }
    if (desde >= 4 && desde % 7 === 4 && !marcado('festa') && !daFirma) {
      const f = FESTAS[Math.floor(desde / 7) % FESTAS.length], ok = f.pratos.filter(id => p.receitas.includes(id));
      novos.push({ tipo: 'festa', nome: f.nome, dia: amanha, avisado: dia, prato: ok.length ? ok[0] : p.receitas[0], categoria: f.categoria || '' });
    }
    p.agenda.push(...novos);
    p.agenda = p.agenda.filter(e => !(e.fim && e.dia !== undefined && e.dia < dia - 1));   // (os terminados há mais de 1 dia)
    return novos;
  },
  // O VIP bem servido dá um prêmio de função (o primeiro da lista dele que a pensão ainda não tem).
  premiar(p, vipId) {
    p.premios = p.premios || [];
    const f = (FUNCOES_VIP[vipId] || []).find(x => !p.premios.includes(x));
    if (!f) return '';
    p.premios.push(f);
    if (f === 'geladeira' && !p.melhorias.includes('geladeira')) p.melhorias.push('geladeira');
    return f;
  },
  // De manhã: o galinheiro bota 3 ovos na despensa.
  manhaDosPremios(p) { if (!(p.premios || []).includes('galinheiro')) return 0; p.despensa.ovo = (p.despensa.ovo || 0) + 3; return 3; },
  hoje(p, dia, tipo) { return (p.agenda || []).find(e => e.tipo === tipo && e.dia === dia && !e.fim); },
  // (C17) A noite d já tem VIP, festa do tema ou a Festa do Patrimônio: os da agenda (avisados) e os que o planejar ainda vai marcar
  // (as contas fixas: VIP com desde % 5 === 2, festa com desde % 7 === 4, a carta 3 dias antes por diaDoAviso; a mesma conta da
  // noiteLivre das encomendas). O Doutor Paladar não janta numa noite dessas (Paladar.noite).
  marcada(p, d) {
    if (!p) return false;
    if ((p.agenda || []).some(x => !x.fim && x.dia === d && (x.tipo === 'vip' || x.tipo === 'festa'))) return true;
    if (p.abreDia > 0) for (const d0 of [d - 3, d - 4]) {
      if (d0 < p.abreDia || diaDoAviso(d0) !== d) continue;
      const desde = d0 - p.abreDia;
      if ((desde >= 2 && desde % 5 === 2) || (desde >= 4 && desde % 7 === 4)) return true;
    }
    // (C20, rodada 1) a noite da inauguração da Construtora Santos (firma.js): a festa é da família, ninguém mais janta marcado
    return (!!p.festaDia && p.festaDia === d) || (!!G.firma && G.firma.inauguracaoDia === d && !G.firma.feita);
  },
  // (C17, 16/10; o teste crítico C, solução 8: a 5ª estrela era loteria — quem tirava 4 garfos esperava a estação seguinte) A REVISITA
  // DO DOUTOR PALADAR. Quando o degrau seguinte só espera os garfos (curtidas, sabor e receitas cumpridos; o concurso tem a data dele),
  // ele volta ECO.pensao.paladarVolta dias depois da última visita para provar de novo, numa noite sem outro acontecimento do salão
  // (Encomendas.noiteLivre: nem VIP, festa, encomenda, concurso, Patrimônio nem domingo), avisada com AVISO_DIAS dias ou mais. Se a
  // noite da estação vem antes, é ela. Fica na agenda como { tipo: 'paladar', dia, avisado }. Devolve a entrada nova (ou null).
  // Quem chama: a noite da visita (a matéria da Gazeta já diz "volto na sexta") e a manhã (com carta, se a falta veio depois).
  revisitaDoPaladar(p, dia) {
    // (C17, revisão) a revisita vencida (passou sem ele, sem fim) e a feita há mais de 1 dia saem da agenda: não se acumulam no save
    if (p && p.agenda && p.agenda.some(e => e.tipo === 'paladar' && (e.fim ? e.dia < dia - 1 : e.dia < dia)))
      p.agenda = p.agenda.filter(e => !(e.tipo === 'paladar' && (e.fim ? e.dia < dia - 1 : e.dia < dia)));
    if (!p || typeof Paladar === 'undefined' || !['aberta', 'pronta'].includes(p.estado) || p.grau() < Paladar.GRAU || !Paladar.soFaltaEle(p)) return null;
    const notas = p.paladarNotas || []; if (!notas.length) return null;   // ele ainda não veio: vem na noite da estação
    const ultima = Math.max(...notas.map(x => x.dia));
    p.agenda = p.agenda || [];
    if (p.agenda.some(e => e.tipo === 'paladar' && !e.fim && e.dia >= dia && e.dia > ultima)) return null;   // já marcada
    let d = Math.max(ultima + ECO.pensao.paladarVolta, dia + AVISO_DIAS);
    const livre = x => typeof Encomendas !== 'undefined' ? Encomendas.noiteLivre(p, x) : !((x - 1) % 7 === 6 || Eventos.marcada(p, x));
    let k = 0; for (; k < 14 && !livre(d); k++) d++;
    if (k === 14 && !livre(d)) return null;   // (revisão) sem noite livre em 14 dias: não marca noite ocupada; tenta de novo amanhã
    const est = Math.floor((dia - 1) / 28);
    for (const e of [est, est + 1]) { const n = Paladar.noite(p, e); if (n >= dia && n > ultima && n <= d) return null; }
    const v = { tipo: 'paladar', dia: d, avisado: dia };
    p.agenda.push(v);
    return v;
  },
};
// (C17) A frase da revisita (a carta da Gazeta, e o P.S. da matéria): o dia da semana e o que ele repara.
const textoRevisita = d => `O Doutor Paladar volta ${naDia(d)} (dia ${d}) para provar de novo. Ele repara em tudo: o prato que sai rápido, o balcão sem louça suja, a bebida na medida e o prato caprichado ou raro.`;
const vipDe = id => VIPS.find(v => v.id === id);
// A receita com o nome do VIP (ele ensina quando é bem servido).
const receitaDoVip = id => Object.keys(typeof RECEITAS_NOVAS !== 'undefined' ? RECEITAS_NOVAS : {}).find(r => RECEITAS_NOVAS[r].caminho === 'vip' && RECEITAS_NOVAS[r].vip === id) || '';

// ---------- o Viajante da Capital ----------
// O "Viajante" do Stardew e os mercadores do Dave, do nosso jeito: seu Nonato vem de São Paulo de caminhonete às quintas
// (a partir do degrau 3) e vende receita secreta e ingrediente raro, tudo caro.
const Viajante = {
  DIA: 3,                 // quinta (0 = segunda)
  GRAU: 3,
  RECEITAS: ECO.lojas.viajante.receitas,
  INGREDIENTES: ECO.lojas.viajante.ingredientes,
  presente(p, dia) { return !!p && (p.estado === 'aberta' || p.estado === 'pronta') && p.grau() >= Viajante.GRAU && (dia - 1) % 7 === Viajante.DIA; },
  comprarReceita(p, id, dinheiro) {
    if (!(id in Viajante.RECEITAS)) return 'nao';
    if (p.receitas.includes(id)) return 'ja_tem';
    if (dinheiro < Viajante.RECEITAS[id]) return 'dinheiro';
    p.liberarReceita(id); return 'ok';
  },
  comprarIngrediente(p, id, qtd, dinheiro) {
    if (!(id in Viajante.INGREDIENTES)) return 'nao';
    if (!p.aceita(id)) return 'trancado';
    if (dinheiro < Viajante.INGREDIENTES[id] * qtd) return 'dinheiro';
    p.despensa[id] = (p.despensa[id] || 0) + qtd; p.veIngrediente(id); return 'ok';
  },
};

// ---------- no jogo ----------
// O Viajante na Vila: a carroça (e o seu Nonato ao lado, quando a folha dele existir) na praça, às quintas.
const VIAJANTE_LUGAR = { x: 26, y: 18 };
function poeViajante(b) {
  const vem = Viajante.presente(G.pensao, G.dia), car = b.objs.find(o => o.id === 'viajante'), gente = b.moradores.find(m => m.id === 'viajante');
  if (vem && !car) {
    const o = b.interativo('viajante', 'objetos/carroca_mascate', VIAJANTE_LUGAR.x, VIAJANTE_LUGAR.y, 4, 2, [56, 18]);
    o.acao = () => conversaViajante();
    if (ARTE_LISTA.includes('personagens/viajante/andar') && !gente) {
      const m = b.morador('viajante', 'Seu Nonato, o Viajante', VIAJANTE_LUGAR.x + 4, VIAJANTE_LUGAR.y - 1, DIR.ESQUERDA);
      m.aoConversar = () => conversaViajante();
    }
  } else if (!vem && car) {
    b.tirar(car);
    if (gente) b.moradores = b.moradores.filter(m => m !== gente);
  }
}
AO_MONTAR.push(b => { if (b.id === 'vila') poeViajante(b); });
AO_ENTRAR_MAPA.push(id => { if (id === 'vila') poeViajante(G.mapa); });   // o mapa da Vila fica montado de um dia para o outro
MANHA.push(() => {
  if (MAPAS.vila) poeViajante(MAPAS.vila);
  if (Viajante.presente(G.pensao, G.dia)) G.feitosHoje.push('O Viajante da Capital chegou na praça da Vila: receita secreta e ingrediente raro, só hoje!');
});
TAREFAS.push(() => Viajante.presente(G.pensao, G.dia) ? [{ texto: 'O Viajante da Capital está na praça (só hoje)', urgente: true }] : []);
function conversaViajante() {
  const r = ARTE_LISTA.includes('retratos/viajante_normal') ? urlArte('retratos/viajante_normal') : null;
  abrirPlaca(['Seu Nonato: "Bom dia, freguês! Trago da Capital o que não se acha na Vila: receita de restaurante fino e ingrediente de primeira. Barato não é, mas vale cada cruzeiro!"'],
    { quem: 'Seu Nonato, o Viajante', retrato: r, depois: () => abrirViajante() });
  return true;
}
// A loja do Viajante: as receitas secretas e os ingredientes raros (o que a pensão ainda não aceita fica trancado).
function abrirViajante() {
  const p = G.pensao, caixa = el('div', { class: 'painel orelhao viajante' });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, 'O Viajante da Capital'),
      el('div', { class: 'rodape', style: 'text-align:left;margin-bottom:8px' }, 'Só às quintas, na praça. Receita comprada vai direto para o caderno da Rosa; ingrediente vai para a despensa.'));
    const grade = el('div', { class: 'orel-grade' });
    for (const id in Viajante.RECEITAS) {
      const tem = p.receitas.includes(id), preco = Viajante.RECEITAS[id];
      grade.append(el('div', { class: 'orel-item' + (tem ? ' trancado' : '') }, el('img', { src: urlArte(iconePratoGrande(id)) }),
        el('div', {}, el('b', {}, 'Receita: ' + Pratos.PRATOS[id].nome), el('div', { class: 'orel-preco' }, tem ? 'Já está no caderno' : `Cr$ ${preco} · ★★★★`)),
        tem ? null : el('div', { class: 'orel-bts' }, el('button', { class: 'botao', onclick: ev => { ev.stopPropagation();
          const r = Viajante.comprarReceita(p, id, G.dinheiro);
          if (r === 'ok') { G.dinheiro -= preco; hudSujo(); sons.tocar('moedas', 1, 0.05, -4); sons.tocar('receita_nova', 1, 0, -4); avisar(`Receita nova no caderno: ${Pratos.PRATOS[id].nome}!`); desenha(); }
          else avisar(r === 'dinheiro' ? 'Não dá: falta dinheiro.' : 'Não deu.'); } }, 'Comprar'))));
    }
    for (const id in Viajante.INGREDIENTES) {
      const pode = p.aceita(id), preco = Viajante.INGREDIENTES[id], ing = Pratos.INGREDIENTES[id];
      grade.append(el('div', { class: 'orel-item' + (pode ? '' : ' trancado') }, el('img', { src: urlItem(id) }),
        el('div', {}, el('b', {}, Itens.nome(id)), el('div', { class: 'orel-preco' }, `Cr$ ${preco} cada · ${'★'.repeat(ing ? ing.raridade : 1)} · tem ${p.despensa[id] || 0}`),
          pode ? null : el('div', { class: 'orel-preco' }, '🔒 a pensão precisa de mais fama')),
        pode ? el('div', { class: 'orel-bts' }, [1, 3].map(n => el('button', { class: 'botao', onclick: ev => { ev.stopPropagation();
          const r = Viajante.comprarIngrediente(p, id, n, G.dinheiro);
          if (r === 'ok') { G.dinheiro -= preco * n; hudSujo(); sons.tocar('moedas', 1, 0.05, -6); desenha(); } else avisar('Não dá: falta dinheiro.'); } }, '+' + n))) : null));
    }
    caixa.append(grade, el('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-top:10px' },
      el('div', { style: 'font-weight:900' }, `Cr$ ${G.dinheiro}`), el('button', { class: 'botao forte', onclick: ev => { ev.stopPropagation(); fecharModal(); } }, 'Até quinta!')));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('abrir', 0.9, 0.03, -6);
  return true;
}
MANHA.push(() => {
  const p = G.pensao;
  if (!p) return;
  for (const e of p.agenda || []) if (!e.fim && e.dia < G.dia) e.fim = 'passou';
  const ovos = Eventos.manhaDosPremios(p); if (ovos) G.feitosHoje.push(`O galinheiro botou ${ovos} ovos: já estão na despensa da Rosa.`);
  for (const e of Eventos.planejar(p, G.dia)) {
    if (e.tipo === 'vip') { const v = vipDe(e.id); CARTAS['vip_' + G.dia] = { de: v.nome, dia: 1e9, texto: v.carta.replace('amanhã', naDia(e.dia)) + `\n\n(Ele vai pedir: ${Pratos.PRATOS[e.prato].nome}.` + (e.ensinou ? ' A receita com o nome dele veio junto: a Rosa já anotou no caderno. Junte os ingredientes!)' : ')') }; G.correio.caixa.push('vip_' + G.dia); }
    else if (e.tipo === 'festa') { CARTAS['festa_' + G.dia] = { de: 'Rosa', dia: 1e9, texto: `Amor, ${naDia(e.dia)} é a ${e.nome}! O prato da festa é ${Pratos.PRATOS[e.prato].nome}${e.categoria ? ` (e todo ${CATEGORIAS[e.categoria].toLowerCase()} vale mais)` : ''}: vale 50% mais e vem mais gente. Enche a despensa!` }; G.correio.caixa.push('festa_' + G.dia); }
  }
  // (C17) A revisita do Doutor Paladar marcada de manhã (a falta virou "só os garfos" depois da última visita): a carta da Gazeta.
  // (A marcada na noite da visita já vai no P.S. da matéria.)
  const rv = Eventos.revisitaDoPaladar(p, G.dia);
  if (rv) { CARTAS['paladar_volta_' + G.dia] = { de: 'Gazeta de Santos', dia: 1e9, texto: textoRevisita(rv.dia) + '\n\n— Redação da Gazeta de Santos' }; G.correio.caixa.push('paladar_volta_' + G.dia); }
});
// As cartas da agenda voltam ao recarregar (o texto é refeito pela agenda).
INICIADORES.push(s => {
  const p = G.pensao;
  for (const e of (p && p.agenda) || []) {
    const k = (e.tipo === 'vip' ? 'vip_' : 'festa_') + (e.avisado || e.dia - 1);
    if (e.tipo === 'vip' && !CARTAS[k]) CARTAS[k] = { de: vipDe(e.id).nome, dia: 1e9, texto: vipDe(e.id).carta };
    if (e.tipo === 'festa' && !CARTAS[k]) CARTAS[k] = { de: 'Rosa', dia: 1e9, texto: `A ${e.nome}! O prato da festa é ${Pratos.PRATOS[e.prato].nome}.` };
    if (e.tipo === 'paladar' && !CARTAS['paladar_volta_' + e.avisado]) CARTAS['paladar_volta_' + e.avisado] = { de: 'Gazeta de Santos', dia: 1e9, texto: textoRevisita(e.dia) + '\n\n— Redação da Gazeta de Santos' };
  }
});
TAREFAS.push(() => {
  const p = G.pensao;
  if (!p || p.estado !== 'aberta') return [];
  const r = [];
  const v = Eventos.hoje(p, G.dia, 'vip'), f = Eventos.hoje(p, G.dia, 'festa');
  if (v) r.push({ texto: `Hoje janta ${vipDe(v.id).nome}: quer ${Pratos.PRATOS[v.prato].nome}`, mapa: 'pensao', urgente: true });
  if (f) r.push({ texto: `Hoje é a ${f.nome}: ${Pratos.PRATOS[f.prato].nome} vale mais`, mapa: 'pensao', urgente: true });
  if (Eventos.hoje(p, G.dia, 'paladar')) r.push({ texto: 'Hoje o Doutor Paladar volta para provar de novo: prato rápido, balcão limpo, bebida na medida e prato caprichado', mapa: 'pensao', urgente: true });
  return r;
});
