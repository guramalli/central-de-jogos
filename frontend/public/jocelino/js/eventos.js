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
  { nome: 'Arraiá da Pensão', pratos: ['pamonha', 'bolo_milho', 'cocada_tijolinho'] },
  { nome: 'Noite dos Doces da Vó', pratos: ['rabanada', 'goiabada', 'cocada_tijolinho'] },
  { nome: 'Jogo do Santos na Rádio', pratos: ['caldo_caranguejo', 'pf_peao', 'sopa_pedra'] },
];
const QUEM_PEDE = ['Dona Zélia', 'Mestre Bira', 'o Zé da masseira', 'Seu Ananias', 'Seu Tonico', 'a Ritinha'];
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const Eventos = {
  // Planeja os eventos do dia seguinte (chamado de manhã): VIP a cada ~5 dias, festa a cada 7, até 2 pedidos abertos.
  planejar(p, dia, rng) {
    if (p.estado !== 'aberta' && p.estado !== 'pronta') return [];
    p.agenda = p.agenda || [];
    const novos = [], desde = dia - (p.abreDia > 0 ? p.abreDia : dia), amanha = dia + 1;
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

// ---------- no jogo ----------
MANHA.push(() => {
  const p = G.pensao;
  if (!p) return;
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
