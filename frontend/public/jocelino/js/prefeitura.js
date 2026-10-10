// Jocelino — prefeitura.js — os pedidos fora do quadro (vida de dia, etapa 6): a Prefeitura semanal (os Pedidos Especiais
// do Stardew; pedidos_especiais.gd), as cartas de pedido com Aceitar, as noites agitadas e o ajudante Tião.

// ---------- a Prefeitura: uma obra de verdade por semana, a partir da carta do dia 15 ----------
// Só obras públicas em lugares que existem na Vila (o Mercado é a obra do Bira): a calçada da porta do Museu e a do
// quadro da Prefeitura; com a betoneira (pré-moldados), a calçada da roda de samba e o bueiro da rua.
const PREFEITURA_OBRAS = {
  pref_museu: { nome: 'Calçada de pedra na porta do Museu', texto: 'Na porta do Museu é só barro: o povo entra com o pé sujo.', material: { pedra: 20, cimento: 4, cal: 2 }, etapas: ['pa', 'colher', 'colher', 'regador'], paga: 500, premio: { receita: 'acelerador' }, piso: true, area: { w: 3, h: 1, textura: 'texturas/calcada' }, x: 4, y: 21, junto: 'museu', artes: ['objetos/vala', 'objetos/alicerce'] },
  pref_quadro: { nome: 'Calçada do quadro da Prefeitura', texto: 'O povo pisa no barro para ler os editais.', material: { cimento: 4, pedra: 12 }, etapas: ['pa', 'colher', 'regador'], paga: 400, premio: { itens: { impermeabilizante: 3 } }, piso: true, area: { w: 3, h: 1, textura: 'texturas/calcada' }, x: 32, y: 19, junto: 'quadro_prefeitura', artes: ['objetos/vala', 'objetos/alicerce'] },
  pref_praca: { nome: 'Calçada da roda de samba', texto: 'Calçada de lajota em volta da roda de samba da praça.', material: { lajota: 12, cimento: 4 }, etapas: ['pa', 'colher', 'regador'], paga: 450, premio: { itens: { lapis: 3 } }, betoneira: true, piso: true, area: { w: 3, h: 1, textura: 'texturas/piso_ladrilho' }, x: 30, y: 22, junto: 'roda_samba', artes: ['objetos/vala', 'objetos/alicerce'] },
  pref_bueiro: { nome: 'Bueiro da rua', texto: 'A rua alaga toda vez que chove: manilha embaixo da calçada.', material: { manilha: 3, cimento: 8 }, etapas: ['pa', 'pa', 'colher', 'regador'], paga: 600, premio: { itens: { barra_ferro: 3 } }, betoneira: true, fundacao: true, x: 21, y: 16, artes: ['objetos/vala', 'objetos/vala', 'objetos/alicerce'] },
};
for (const id in PREFEITURA_OBRAS) Object.assign(PREFEITURA_OBRAS[id], { cliente: 'prefeitura', mapa: 'vila', funcaoMin: 0, tipo: 'longa', dias: PREFEITURA_OBRAS[id].etapas.length, vezesDia: 3, ferramenta: PREFEITURA_OBRAS[id].etapas[0] });
Object.assign(EMPREITAS_EXTRAS, PREFEITURA_OBRAS);
CLIENTE_NOME.prefeitura = 'a Prefeitura';
CARTAS.prefeitura_abre = { de: 'Prefeitura da Vila Maré', dia: 15, aoLer: () => { G.empreitas.prefeitura.aberta = true; },
  texto: 'Sr. Jocelino, a Prefeitura da Vila Maré vai cuidar das obras públicas: o Museu, a praça, as calçadas e os bueiros. Toda semana sai um pedido de obra no quadro da Prefeitura, ao lado do Mercado: prazo de 7 dias, pagamento em dia. A Vila conta com o senhor.' };
const Prefeitura = {
  PRAZO: 7,
  iniciar(s) { const p = (s.empreitas && s.empreitas.prefeitura) || {}; G.empreitas.prefeitura = { aberta: !!p.aberta, ativo: p.ativo || '', aceitoDia: p.aceitoDia || 0, semana: p.semana ?? -1, concluidos: p.concluidos || 0, feitos: (p.feitos || []).slice() }; },
  semana(dia) { return Math.floor((dia - 1) / 7); },
  // Os pedidos que podem sair: os ainda não feitos (os de pré-moldado só com a betoneira no quintal).
  disponiveis() {
    const P = G.empreitas.prefeitura, bet = !!(G.horta && G.horta.colocados && G.horta.colocados.some(c => c.id === 'betoneira'));
    return Object.keys(PREFEITURA_OBRAS).filter(id => !P.feitos.includes(id) && (bet || !PREFEITURA_OBRAS[id].betoneira));
  },
  oferta(dia) {
    const P = G.empreitas.prefeitura;
    if (!P.aberta || P.ativo || P.semana === Prefeitura.semana(dia)) return '';
    const d = Prefeitura.disponiveis(); return d.length ? d[Prefeitura.semana(dia) % d.length] : '';
  },
  aceitar(dia) {
    const id = Prefeitura.oferta(dia); if (!id) return '';
    if (Empreitas.aceitar(id, G.mochila, G.dinheiro, { prefeitura: true }) !== 'ok') return '';
    Object.assign(G.empreitas.prefeitura, { ativo: id, aceitoDia: dia, semana: Prefeitura.semana(dia) });
    return id;
  },
};
AO_INICIAR_EMPREITAS.push(s => Prefeitura.iniciar(s));
// Entregue: os itens (mochila ou chão do quintal), a receita e a conta de concluídos (a obra fica no mapa, menos o bueiro).
AO_ENTREGAR.push(id => {
  const O = PREFEITURA_OBRAS[id]; if (!O) return '';
  const P = G.empreitas.prefeitura, t = [];
  P.ativo = ''; P.concluidos++; if (!P.feitos.includes(id)) P.feitos.push(id);
  for (const it in O.premio.itens || {}) {
    const sobra = G.mochila.adicionar(it, O.premio.itens[it]);
    if (sobra && G.mapa) { const m0 = G.mapa; G.mapa = getMapa('quintal'); soltar(it, sobra, 7.5 * TILE, 12 * TILE); G.mapa = m0; }
    t.push(Itens.qtd(O.premio.itens[it], it));
  }
  if (O.premio.receita && !G.empreitas.receitasExtras.includes(O.premio.receita)) { G.empreitas.receitasExtras.push(O.premio.receita); t.push('a receita do ' + Itens.nome(O.premio.receita).toLowerCase()); }
  return t.length ? `A Prefeitura agradece: ${t.join(', ')}.` : '';
});
// O prazo: 7 dias do aceite para entregar; vencido, o pedido some (o material gasto não volta).
NOITE.push(linhas => {
  const P = G.empreitas.prefeitura; if (!P || !P.ativo) return;
  if (!G.empreitas.aceitas[P.ativo]) { P.ativo = ''; return; }
  if (G.dia >= P.aceitoDia + Prefeitura.PRAZO - 1) { linhas.push(`O prazo da Prefeitura venceu: ${PREFEITURA_OBRAS[P.ativo].nome.toLowerCase()} ficou para outra vez.`); delete G.empreitas.aceitas[P.ativo]; P.ativo = ''; }
});
function abrirPrefeitura() {
  const P = G.empreitas.prefeitura;
  if (!P.aberta) { abrirPlaca('O quadro da Prefeitura: editais e avisos.'); return true; }
  if (P.ativo) { const O = PREFEITURA_OBRAS[P.ativo]; abrirPlaca(`Obra da Prefeitura: ${O.nome}. ${Empreitas.textoEstado(P.ativo)}.`); return true; }
  const id = Prefeitura.oferta(G.dia);
  if (!id) { abrirPlaca(Prefeitura.disponiveis().length ? 'O quadro da Prefeitura: o pedido desta semana já foi. Segunda-feira tem outro.' : 'O quadro da Prefeitura: nenhum pedido novo por enquanto.'); return true; }
  const O = PREFEITURA_OBRAS[id], pede = Object.entries(O.material).map(([m, q]) => Itens.qtd(q, m)).join(', ');
  const premio = [O.premio.receita ? 'a receita do ' + Itens.nome(O.premio.receita).toLowerCase() : '', ...Object.entries(O.premio.itens || {}).map(([m, q]) => Itens.qtd(q, m))].filter(Boolean).join(', ');
  perguntar(`Pedido da Prefeitura: ${O.nome}. ${O.texto} Pede ${pede}; ${O.etapas.length} dias de serviço; entregar em até 7 dias. Paga Cr$ ${O.paga}${premio ? ' + ' + premio : ''}.`, ['Aceitar', 'Agora não'], i => {
    if (i === 0 && Prefeitura.aceitar(G.dia)) { sons.tocar('carimbo', 1, 0.05, -6); avisar(`Aceito: ${O.nome}. A plaquinha está no lugar da obra.`); if (G.mapa) poeEmpreitasNoMapa(G.mapa); hudSujo(); }
  });
  return true;
}

// ---------- as cartas de pedido: de 5 em 5 dias, um morador pede um serviço (Aceitar ou Recusar; paga 15% a mais) ----------
const REMETENTES = ['cida', 'lourival', 'juca', 'zelia'];
CLIENTE_NOME.paulo = 'Paulo da Rádio';
const LUGAR_TEXTO = { vila: 'na Vila', praia: 'na praia', mata: 'na mata', quintal: 'no quintal' };
function cartaDePedido(dia) {
  if (dia < 5 || dia % 5 !== 0 || Empreitas.longasContadas() >= Empreitas.limite()) return '';
  const ids = Object.keys(EMPREITAS_LONGAS).filter(id => Empreitas.libera(id) && !G.empreitas.aceitas[id]);
  if (!ids.length) return '';
  const f = mulberry(dia * 389 + 17), cid = 'pedido_' + dia;
  G.empreitas.cartas[cid] = { servico: ids[Math.floor(f() * ids.length)], dia };
  registrarCartaPedido(cid);
  if (!G.correio.caixa.includes(cid) && !G.correio.lidas.includes(cid)) G.correio.caixa.push(cid);
  return cid;
}
function registrarCartaPedido(cid) {
  const c = G.empreitas.cartas[cid], E = c && EMPREITAS_LONGAS[c.servico]; if (!E) return;
  const de = REMETENTES.includes(E.cliente) ? E.cliente : 'paulo', valor = Math.round(E.paga * 1.15), mat = Object.entries(E.material).map(([m, q]) => Itens.qtd(q, m)).join(', ');
  const texto = de === 'paulo'
    ? `Seu Jocelino, aqui é o Paulo, da Rádio Maré. Um ouvinte, ${CLIENTE_NOME[E.cliente]}, pediu para eu escrever: precisa de ${E.nome.toLowerCase()} (${LUGAR_TEXTO[E.mapa]}) e quer o senhor. Paga Cr$ ${valor}. O material: ${mat}.`
    : `Seu Jocelino, preciso de um serviço: ${E.nome.toLowerCase()} (${LUGAR_TEXTO[E.mapa]}). Quero o senhor, e pago Cr$ ${valor}. O material: ${mat}.`;
  CARTAS[cid] = { de: CLIENTE_NOME[de], dia: c.dia, texto, depois: () => perguntar(`Aceitar o serviço (${E.nome})?`, ['Aceitar', 'Recusar'], i => responderCartaPedido(cid, i === 0)) };
}
function responderCartaPedido(cid, aceita) {
  const c = G.empreitas.cartas[cid]; delete G.empreitas.cartas[cid];
  if (!c || !aceita) return '';
  const r = Empreitas.aceitar(c.servico, G.mochila, G.dinheiro, { carta: true });
  if (r === 'limite') avisar('Agora não dá: já tem obra demais.');
  else if (r === 'ja') avisar('Esse serviço você já pegou.');
  else if (r === 'ok') { avisar(`Aceito: ${EMPREITAS_LONGAS[c.servico].nome}. A plaquinha está no lote.`); if (G.mapa) poeEmpreitasNoMapa(G.mapa); hudSujo(); }
  return r;
}
AO_INICIAR_EMPREITAS.push(s => { G.empreitas.cartas = JSON.parse(JSON.stringify((s.empreitas && s.empreitas.cartas) || {})); for (const cid in G.empreitas.cartas) registrarCartaPedido(cid); });
