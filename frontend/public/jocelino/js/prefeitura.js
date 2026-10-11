// Jocelino — prefeitura.js — os pedidos fora do quadro (vida de dia, etapa 6): a Prefeitura semanal (os Pedidos Especiais
// do Stardew; pedidos_especiais.gd), as cartas de pedido com Aceitar, as noites agitadas e o ajudante Tião.

// ---------- a Prefeitura: uma obra de verdade por semana, a partir da carta do dia 15 ----------
// Só obras públicas em lugares que existem na Vila (o Mercado é a obra do Bira): a calçada da porta do Museu e a do
// quadro da Prefeitura; com a betoneira (pré-moldados), a calçada da roda de samba e o bueiro da rua.
const PREFEITURA_OBRAS = {
  pref_museu: { nome: 'Calçada de pedra na porta do Museu', texto: 'Na porta do Museu é só barro: o povo entra com o pé sujo.', material: { pedra: 20, cimento: 4, cal: 2 }, etapas: ['pa', 'colher', 'colher', 'regador'], premio: { receita: 'acelerador' }, piso: true, area: { w: 3, h: 1, textura: 'texturas/calcada' }, x: 4, y: 23, junto: 'museu', artes: ['objetos/vala', 'objetos/alicerce'] },
  pref_quadro: { nome: 'Calçada do quadro da Prefeitura', texto: 'O povo pisa no barro para ler os editais.', material: { cimento: 4, pedra: 12 }, etapas: ['pa', 'colher', 'regador'], premio: { itens: { impermeabilizante: 3 } }, piso: true, area: { w: 3, h: 1, textura: 'texturas/calcada' }, x: 27, y: 23, junto: 'quadro_prefeitura', artes: ['objetos/vala', 'objetos/alicerce'] },
  pref_praca: { nome: 'Calçada da roda de samba', texto: 'Calçada de lajota em volta da roda de samba da praça.', material: { lajota: 12, cimento: 4 }, etapas: ['pa', 'colher', 'regador'], premio: { itens: { lapis: 3 } }, betoneira: true, piso: true, area: { w: 3, h: 1, textura: 'texturas/piso_ladrilho' }, x: 27, y: 19, junto: 'roda_samba', artes: ['objetos/vala', 'objetos/alicerce'] },
  pref_bueiro: { nome: 'Bueiro da rua', texto: 'A rua alaga toda vez que chove: manilha embaixo da calçada.', material: { manilha: 3, cimento: 8 }, etapas: ['pa', 'pa', 'colher', 'regador'], premio: { itens: { barra_ferro: 3 } }, betoneira: true, fundacao: true, x: 20, y: 17, artes: ['objetos/vala', 'objetos/vala', 'objetos/alicerce'] },
};
ecoCampo(PREFEITURA_OBRAS, 'paga', ECO.prefeitura.paga);
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
    return Object.keys(PREFEITURA_OBRAS).filter(id => !P.feitos.includes(id) && (bet || !PREFEITURA_OBRAS[id].betoneira) && (!PREFEITURA_OBRAS[id].libera || PREFEITURA_OBRAS[id].libera()));
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
  const a = G.empreitas.aceitas[P.ativo];
  if (G.dia >= P.aceitoDia + Prefeitura.PRAZO - 1 && a.estado === 'pronta' && !a.prazoExtra) { a.prazoExtra = true; linhas.push(`${PREFEITURA_OBRAS[P.ativo].nome}: ficou pronta no último dia do prazo. Entregue amanhã na plaquinha.`); return; }
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
  const de = REMETENTES.includes(E.cliente) ? E.cliente : 'paulo', valor = Math.round(E.paga * ECO.empreitas.carta), mat = Object.entries(E.material).map(([m, q]) => Itens.qtd(q, m)).join(', ');
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

// ---------- as noites agitadas (os eventos noturnos do Stardew; noite_agitada.gd): ~10% das noites, quase sempre boas ----------
const NOITES_AGITADAS = { mutirao: true, caminhao: true, ventania: true };
function noiteAgitada(dia) {
  if (dia <= 4) return '';
  const f = mulberry(dia * 911 + 3);
  if (f() >= 0.10) return '';
  const ids = Object.keys(NOITES_AGITADAS), e = ids[Math.floor(f() * ids.length)];
  return e === 'ventania' && !(typeof Clima !== 'undefined' && Clima.chove(dia)) ? '' : e;
}
function aplicarNoiteAgitada(e) {
  const obra = Object.keys(G.empreitas.aceitas).find(id => G.empreitas.aceitas[id].estado === 'obra'), a = obra && G.empreitas.aceitas[obra];
  if (e === 'mutirao') { if (!a) return ''; a.dias++; if (a.dias >= a.lista.length) a.estado = 'pronta'; return `Os vizinhos fizeram um mutirão de madrugada: ${dadosEmpreita(obra).nome.toLowerCase()} adiantou um dia!`; }
  if (e === 'ventania') { if (!a || a.dias <= 0) return ''; a.dias--; return `Uma ventania forte passou pela Vila: ${dadosEmpreita(obra).nome.toLowerCase()} atrasou um dia.`; }
  if (e === 'caminhao') {
    const b = getMapa('quintal'), f = mulberry(G.dia * 17 + 5); let n = 0;
    for (let k = 0; k < 300 && n < 5; k++) {
      const x = b.livre.x + Math.floor(f() * b.livre.w), y = b.livre.y + Math.floor(f() * b.livre.h);
      if (b.ocupado.has(chaveT(x, y)) || b.saidaEm(x, y) || b.chaoEm(x, y) !== CH.GRAMA || (typeof Horta !== 'undefined' && Horta.cova(x, y)) || dentroR(QUINTAL.CANTEIRO, x, y) || reservadoQuintal(x, y)) continue;
      if (b.detrito('pedra', x, y)) n++;
    }
    return n ? 'Um caminhão perdeu a carga na estrada de madrugada: tem pedra espalhada no quintal!' : '';
  }
  return '';
}
NOITE.push(linhas => { const e = noiteAgitada(G.dia), t = e && aplicarNoiteAgitada(e); if (t) linhas.push(t); });

// ---------- o ajudante Tião (os Junimos do Stardew; ajudante.gd): cuida das obras à noite, mas nunca começa, aduba ou entrega ----------
const TIAO = { CONTRATO: ECO.prefeitura.tiao.contrato, SALARIO: ECO.prefeitura.tiao.salario, MEDICO: ECO.prefeitura.tiao.medico, EVENTO: 0.08, FALTA: 0.04, VOLTA: 7, X: 3, Y: 11 };   // na calçada, do lado do depósito
const EVENTOS_TIAO = {
  acidente: { texto: 'O Tião machucou a mão na obra.', opcoes: [`Pagar o médico (Cr$ ${TIAO.MEDICO})`, 'Seguir sem ele'] },
  aumento: { texto: 'O Tião pediu aumento: Cr$ 5 a mais por dia.', opcoes: ['Dar o aumento', 'Recusar'] },
};
const Tiao = {
  iniciar(s) { const t = (s.empreitas && s.empreitas.tiao) || {}; G.empreitas.tiao = { contratado: !!t.contratado, salario: t.salario || TIAO.SALARIO, lealdade: t.lealdade ?? 5, folga: t.folga || 0, evento: t.evento || '', saiuDia: t.saiuDia ?? -99 }; },
  pode() { return Empreitas.funcao() >= 2; },
  contratar(dinheiro) {
    const t = G.empreitas.tiao;
    if (t.contratado) return 'ja';
    if (G.dia < t.saiuDia + TIAO.VOLTA) return 'magoado';
    if (dinheiro < TIAO.CONTRATO) return 'dinheiro';
    Object.assign(t, { contratado: true, salario: TIAO.SALARIO, lealdade: 5, folga: 0, evento: '' }); return 'ok';
  },
  demitir() { Object.assign(G.empreitas.tiao, { contratado: false, evento: '', folga: 0 }); },
  trabalhaHoje() { const t = G.empreitas.tiao; return t.contratado && t.folga <= 0 && !t.evento; },
  // À noite, antes do avanço: as obras que o Jocelino não cuidou hoje (a de regador na chuva já conta sozinha).
  trabalhar(chove) {
    if (!Tiao.trabalhaHoje()) return 0;
    let n = 0;
    for (const id in G.empreitas.aceitas) {
      const a = G.empreitas.aceitas[id];
      if (a.estado !== 'obra' || a.trabalhou || Empreitas.impedeHoje(id, chove) || (chove && Empreitas.ferramentaHoje(id) === 'regador')) continue;
      a.trabalhou = true; a.porTiao = (a.porTiao || 0) + 1; n++;
    }
    return n;
  },
  _vaiEmbora() { Object.assign(G.empreitas.tiao, { contratado: false, evento: '', folga: 0, saiuDia: G.dia }); },
  // Depois do serviço: a diária (sem dinheiro, a lealdade cai), a folga e os eventos.
  noite(rng) {
    const t = G.empreitas.tiao, r = { pago: 0, evento: '', falta: false, foi: false };
    if (!t.contratado) return r;
    if (t.folga > 0) { t.folga--; return r; }
    if (t.evento) return r;
    if (G.dinheiro >= t.salario) { G.dinheiro -= t.salario; r.pago = t.salario; }
    else { t.lealdade--; if (t.lealdade <= 0) { Tiao._vaiEmbora(); r.foi = true; return r; } }
    const x = rng();
    if (x < TIAO.EVENTO) { t.evento = rng() < 0.5 ? 'acidente' : 'aumento'; r.evento = t.evento; }
    else if (x < TIAO.EVENTO + TIAO.FALTA) { t.folga = 1; r.falta = true; }
    return r;
  },
  decidir(opcao) {
    const t = G.empreitas.tiao, r = { custo: 0, texto: '' };
    if (t.evento === 'acidente') {
      if (opcao === 0) { r.custo = TIAO.MEDICO; t.folga = 2; t.lealdade = Math.min(10, t.lealdade + 2); r.texto = 'O Tião agradeceu muito. Volta em 2 dias.'; }
      else { t.folga = 3; t.lealdade -= 2; r.texto = 'O Tião ficou magoado. Fica 3 dias em casa.'; }
    } else if (t.evento === 'aumento') {
      if (opcao === 0) { t.salario += 5; t.lealdade = Math.min(10, t.lealdade + 1); r.texto = `O Tião ficou contente: agora ganha Cr$ ${t.salario} por dia.`; }
      else { t.lealdade -= 1; r.texto = 'O Tião aceitou, mas ficou chateado.'; }
    }
    t.evento = '';
    if (t.lealdade <= 0) { Tiao._vaiEmbora(); r.texto += ' E foi embora.'; }
    return r;
  },
};
AO_INICIAR_EMPREITAS.push(s => Tiao.iniciar(s));
NOITE.push(linhas => {
  const r = Tiao.noite(mulberry(G.dia * 613 + 1));
  if (r.pago) linhas.push(`O Tião cuidou das obras: Cr$ ${r.pago} de diária.`);
  if (r.falta) linhas.push('O Tião avisou que amanhã não vem.');
  if (r.foi) linhas.push('O Tião ficou sem receber e foi embora.');
});
// O evento pergunta de manhã, quando a tela fica livre (e de novo depois de carregar, se ficou sem resposta).
let _perguntouTiao = '';
ATUALIZADORES.push(() => {
  const t = G.empreitas && G.empreitas.tiao; if (!t || !t.evento || !G.comecou || menuAberto()) return;
  const chave = G.dia + t.evento; if (_perguntouTiao === chave) return; _perguntouTiao = chave;
  const ev = EVENTOS_TIAO[t.evento];
  perguntar(ev.texto, ev.opcoes, i => responderEventoTiao(i));
});
// O Tião na Vila, perto do depósito, de dia, quando o Jocelino é pedreiro.
AO_MONTAR.push(b => { if (b.id === 'vila' && !b.moradores.some(m => m.id === 'tiao')) { const p = b.morador('tiao', 'Tião', TIAO.X, TIAO.Y, DIR.BAIXO, { vagueia: true, area: { x: 2 * TILE, y: TIAO.Y * TILE + 42, w: 3 * TILE, h: TILE } }); p.aoConversar = () => conversarTiao(); } });
ATUALIZADORES.push(() => { if (G.mapaId !== 'vila') return; const p = G.mapa.moradores.find(m => m.id === 'tiao'); if (p) p.visivel = Tiao.pode() && G.minutos >= 8 * 60 && G.minutos < 17 * 60; });
function conversarTiao() {
  const t = G.empreitas.tiao;
  if (!t.contratado) {
    abrirConversa('Tião', urlArte('retratos/tiao_normal'), ['Bom dia, Seu Jocelino. Tô procurando serviço.', `Se o senhor me contratar (Cr$ ${TIAO.CONTRATO}), eu cuido das suas obras à noite, por Cr$ ${TIAO.SALARIO} o dia. Começar, pôr aditivo e entregar é com o senhor.`], () =>
      perguntar('Contratar o Tião?', [`Contratar (Cr$ ${TIAO.CONTRATO})`, 'Agora não'], i => {
        if (i !== 0) return;
        const r = Tiao.contratar(G.dinheiro);
        if (r === 'ok') { G.dinheiro -= TIAO.CONTRATO; G.gastoHoje += TIAO.CONTRATO; sons.tocar('carimbo', 1, 0.05, -6); avisar('O Tião está contratado: à noite ele cuida das obras.'); hudSujo(); }
        else avisar({ dinheiro: 'O dinheiro não dá.', magoado: 'O Tião ainda está chateado. Volte daqui a uns dias.', ja: 'Ele já trabalha para você.' }[r]);
      }));
    return true;
  }
  abrirConversa('Tião', urlArte('retratos/tiao_alegre'), [`Tô cuidando das obras, Seu Jocelino. (Lealdade ${t.lealdade}/10, Cr$ ${t.salario} por dia.)`], () =>
    perguntar('Falar com o Tião', ['Tudo certo', 'Dispensar o Tião', 'Voltar'], i => { if (i === 1) { Tiao.demitir(); avisar('O Tião foi dispensado.'); } }));
  return true;
}
// A resposta ao evento do Tião: sem dinheiro para o médico, ele fica em casa (nunca deixa o dinheiro negativo).
function responderEventoTiao(i) {
  const t = G.empreitas.tiao;
  if (i === 0 && t.evento === 'acidente' && G.dinheiro < TIAO.MEDICO) { avisar('O dinheiro não dá para o médico: o Tião vai se tratar em casa.'); i = 1; }
  const d = Tiao.decidir(i);
  if (d.custo) { G.dinheiro -= d.custo; G.gastoHoje += d.custo; }
  avisar(d.texto); hudSujo();
  return d;
}
