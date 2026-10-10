// Jocelino — eventos.js — a agenda da pensão (os VIPs, as festas e os pedidos do Dave the Diver, do nosso jeito):
// - Cliente especial: chega numa noite marcada (carta na véspera), pede um prato certo; servido, dá prêmio (dinheiro,
//   curtidas, pitadas) e uma frase; se não tiver o prato, vai embora decepcionado.
// - Festa: noite temática anunciada por carta (Noite do PF, Arraiá da Pensão...): o prato tema paga 50% mais, vem mais
//   gente e o salão ganha bandeirinhas; o prato tema leva a fitinha no cardápio da parede.
// - Pedido da Vila: no quadro de pedidos da Vila ("A Zélia quer 3 PFs até sábado"); conta os pratos servidos na janta.

const VIPS = [
  { id: 'aurelio', nome: 'Seu Aurélio, crítico da Gazeta', gosta: ['moqueca', 'caldo_caranguejo', 'peixe_frito', 'pf_peao'], premio: { dinheiro: 60, curtidas: 15, pitadas: 2 },
    carta: 'Prezada Pensão da Rosa: amanhã à noite o crítico Aurélio, da Gazeta de Santos, janta aí. Dizem que ele só escreve bem de quem acerta o prato que ele pede.', frase: 'Escreverei maravilhas! Que sustância!' },
  { id: 'orlando', nome: 'Seu Orlando, o Prefeito', gosta: ['marmita_peao', 'pf_peao', 'sopa_pedra'], premio: { dinheiro: 100, curtidas: 8, pitadas: 3 },
    carta: 'Gabinete do Prefeito: o Seu Orlando vai jantar amanhã na Pensão da Rosa para conhecer o tal PF famoso. Capricho, que é ano de eleição!', frase: 'Essa pensão merece uma placa!' },
  { id: 'calixto', nome: 'Seu Calixto, o caminhoneiro', gosta: ['bolo_milho', 'pamonha', 'cocada_tijolinho', 'rabanada'], premio: { dinheiro: 40, curtidas: 6, pitadas: 6 },
    carta: 'O caminhoneiro Calixto passa amanhã pela Vila e quer um doce que lembre a casa da mãe dele, lá em Aracaju. Ele paga em receita: sabe tudo de tempero!', frase: 'Igualzinho o da minha mãe! Toma, uns segredos de tempero.' },
  { id: 'santos', nome: 'Seu Santos, dono da firma', gosta: ['marmita_peao', 'moqueca', 'pf_peao'], premio: { dinheiro: 80, curtidas: 10, pitadas: 2 },
    carta: 'A J. Santos Construções avisa: o patrão, Seu Santos, vai jantar na pensão amanhã. Se gostar, manda a peãozada inteira comer aí.', frase: 'Vou mandar meus peões todos pra cá!' },
];
const FESTAS = [
  { nome: 'Noite do PF em Dobro', pratos: ['pf_peao', 'marmita_peao'] },
  { nome: 'Festa do Peixe Frito', pratos: ['peixe_frito', 'moqueca'] },
  { nome: 'Arraiá da Pensão', pratos: ['pamonha', 'bolo_milho', 'cocada_tijolinho'], ensina: 'canjica' },
  { nome: 'Noite dos Doces da Vó', pratos: ['rabanada', 'goiabada', 'cocada_tijolinho'] },
  { nome: 'Jogo do Santos na Rádio', pratos: ['caldo_caranguejo', 'pf_peao', 'sopa_pedra'] },
];
const QUEM_PEDE = ['Dona Zélia', 'Mestre Bira', 'o Zé da masseira', 'Seu Ananias', 'Seu Tonico', 'a Ritinha'];
const DIAS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

const Eventos = {
  // Planeja os eventos do dia seguinte (chamado de manhã): VIP a cada ~5 dias, festa a cada 7, até 2 pedidos abertos.
  planejar(p, dia, rng) {
    if (p.estado !== 'aberta' && p.estado !== 'pronta') return [];
    p.agenda = p.agenda || [];
    const novos = [], desde = dia - (p.abreDia > 0 ? p.abreDia : dia);
    let amanha = dia + 1; if ((amanha - 1) % 7 === 6) amanha++;   // domingo a pensão fecha: fica para segunda
    const marcado = tipo => p.agenda.some(e => e.tipo === tipo && e.dia === amanha);
    if (desde >= 2 && desde % 5 === 2 && !marcado('vip')) {
      const v = VIPS[Math.floor(desde / 5) % VIPS.length], ok = v.gosta.filter(id => p.receitas.includes(id));
      novos.push({ tipo: 'vip', id: v.id, dia: amanha, prato: ok.length ? ok[0] : v.gosta[v.gosta.length - 1] });
    }
    if (desde >= 4 && desde % 7 === 4 && !marcado('festa')) {
      const f = FESTAS[Math.floor(desde / 7) % FESTAS.length], ok = f.pratos.filter(id => p.receitas.includes(id));
      novos.push({ tipo: 'festa', nome: f.nome, dia: amanha, prato: ok.length ? ok[0] : p.receitas[0] });
    }
    if (p.agenda.filter(e => e.tipo === 'pedido' && !e.fim).length < 2 && rng.randf() < 0.6) {
      const prato = p.receitas[rng.randi() % p.receitas.length], qtd = 2 + rng.randi() % 3;
      novos.push({ tipo: 'pedido', quem: QUEM_PEDE[rng.randi() % QUEM_PEDE.length], prato, qtd, feito: 0, ate: dia + 3 + qtd, premio: qtd * 12 + 10 });
    }
    p.agenda.push(...novos);
    p.agenda = p.agenda.filter(e => !(e.fim && e.dia !== undefined && e.dia < dia - 1) && !(e.fim && e.ate < dia - 2));
    return novos;
  },
  hoje(p, dia, tipo) { return (p.agenda || []).find(e => e.tipo === tipo && e.dia === dia && !e.fim); },
  // Depois da janta: os pratos servidos contam nos pedidos; os vencidos fecham. Devolve os pedidos cumpridos hoje.
  depoisDaJanta(p, rel, dia) {
    const feitos = [];
    for (const e of p.agenda || []) {
      if (e.tipo !== 'pedido' || e.fim) continue;
      e.feito = Math.min(e.qtd, e.feito + ((rel.pratos || {})[e.prato] || 0));
      if (e.feito >= e.qtd) { e.fim = 'feito'; feitos.push(e); }
      else if (dia > e.ate) e.fim = 'venceu';
    }
    return feitos;
  },
};
const vipDe = id => VIPS.find(v => v.id === id);
// A receita com o nome do VIP (ele ensina quando é bem servido).
const receitaDoVip = id => Object.keys(typeof RECEITAS_NOVAS !== 'undefined' ? RECEITAS_NOVAS : {}).find(r => RECEITAS_NOVAS[r].caminho === 'vip' && RECEITAS_NOVAS[r].vip === id) || '';

// ---------- o Viajante da Capital ----------
// O "Viajante" do Stardew e os mercadores do Dave, do nosso jeito: seu Nonato vem de São Paulo de caminhonete às quintas
// (a partir do degrau 3) e vende receita secreta e ingrediente raro, tudo caro.
const Viajante = {
  DIA: 3,                 // quinta (0 = segunda)
  GRAU: 3,
  RECEITAS: { arroz_polvo: 300 },
  INGREDIENTES: { polvo: 40, camarao: 18, lagosta: 70, pimenta_cheiro: 35, dende: 12 },
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
TAREFAS.push(() => Viajante.presente(G.pensao, G.dia) ? [{ texto: 'O Viajante da Capital está na praça (só hoje)' }] : []);
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
          if (r === 'ok') { G.dinheiro -= preco; hudSujo(); sons.tocar('moedas', 1, 0.05, -4); sons.tocar('fanfarra', 1.1, 0, -6); avisar(`Receita nova no caderno: ${Pratos.PRATOS[id].nome}!`); desenha(); }
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
  for (const e of p.agenda || []) if (!e.fim && ((e.tipo === 'pedido' && G.dia > e.ate) || (e.tipo !== 'pedido' && e.dia < G.dia))) e.fim = e.tipo === 'pedido' ? 'venceu' : 'passou';
  const f = mulberry(G.dia * 433), rng = { randf: f, randi: () => Math.floor(f() * 4294967296) };
  for (const e of Eventos.planejar(p, G.dia, rng)) {
    if (e.tipo === 'vip') { const v = vipDe(e.id); CARTAS['vip_' + G.dia] = { de: v.nome, dia: 1e9, texto: v.carta + `\n\n(Ele vai pedir: ${Pratos.PRATOS[e.prato].nome}.)` }; G.correio.caixa.push('vip_' + G.dia); }
    else if (e.tipo === 'festa') { CARTAS['festa_' + G.dia] = { de: 'Rosa', dia: 1e9, texto: `Amor, amanhã é a ${e.nome}! O prato da festa é ${Pratos.PRATOS[e.prato].nome}: vale 50% mais e vem mais gente. Enche a despensa!` }; G.correio.caixa.push('festa_' + G.dia); }
    else if (e.tipo === 'pedido') G.feitosHoje.push(`Pedido novo no quadro da Vila: ${e.quem} quer ${e.qtd} ${Pratos.PRATOS[e.prato].nome}.`);
  }
});
// As cartas da agenda voltam ao recarregar (o texto é refeito pela agenda).
INICIADORES.push(s => {
  const p = G.pensao;
  for (const e of (p && p.agenda) || []) {
    const k = (e.tipo === 'vip' ? 'vip_' : 'festa_') + (e.dia - 1);
    if (e.tipo === 'vip' && !CARTAS[k]) CARTAS[k] = { de: vipDe(e.id).nome, dia: 1e9, texto: vipDe(e.id).carta };
    if (e.tipo === 'festa' && !CARTAS[k]) CARTAS[k] = { de: 'Rosa', dia: 1e9, texto: `A ${e.nome}! O prato da festa é ${Pratos.PRATOS[e.prato].nome}.` };
  }
});
TAREFAS.push(() => {
  const p = G.pensao;
  if (!p || p.estado !== 'aberta') return [];
  const r = [];
  const v = Eventos.hoje(p, G.dia, 'vip'), f = Eventos.hoje(p, G.dia, 'festa');
  if (v) r.push({ texto: `Hoje janta ${vipDe(v.id).nome}: quer ${Pratos.PRATOS[v.prato].nome}` });
  if (f) r.push({ texto: `Hoje é a ${f.nome}: ${Pratos.PRATOS[f.prato].nome} vale mais` });
  for (const e of p.agenda || []) if (e.tipo === 'pedido' && !e.fim) r.push({ texto: `${e.quem}: ${Pratos.PRATOS[e.prato].nome} até ${DIAS[(e.ate - 1) % 7]}`, feito: e.feito, meta: e.qtd });
  return r;
});
// O quadro de pedidos da Vila mostra os pedidos.
function abrirQuadroPedidos() {
  const p = G.pensao, ps = ((p && p.agenda) || []).filter(e => e.tipo === 'pedido' && !e.fim);
  if (!p || p.estado !== 'aberta') { abrirPlaca('O quadro de pedidos da Vila. Quando a pensão abrir, o povo deixa encomenda aqui.'); return true; }
  abrirPlaca(ps.length ? ps.map(e => `${e.quem} quer ${e.qtd} ${Pratos.PRATOS[e.prato].nome} até ${DIAS[(e.ate - 1) % 7]} (${e.feito}/${e.qtd}). Prêmio: Cr$ ${e.premio}.`).join('\n\n') : 'Nenhum pedido agora. Volte amanhã!', { quem: 'Quadro de pedidos da Vila' });
  return true;
}
