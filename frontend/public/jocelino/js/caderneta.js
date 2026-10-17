// Jocelino — caderneta.js — a Caderneta do Jocelino (tecla J): o próximo passo de cada frente, com quanto falta e o botão
// Mostrar (a seta leva até lá). Como é no Stardew: o diário (F), a página das habilidades e o Golden Scroll do Centro
// Comunitário; o resto o jogador descobre olhando. Divergência de propósito (o jogador pediu, 12/10): "ele precisa ser
// orientado do que pode ser feito" — a caderneta junta num lugar o que o Stardew deixa espalhado. Cada fonte é uma função
// no registro CADERNETA (como o TAREFAS); a caderneta lê os sistemas, nunca é lida por eles.
const CADERNETA_ABAS = [['hoje', 'Hoje'], ['quintal', 'Quintal e horta'], ['carreira', 'Carreira'], ['vila', 'Vila'], ['pensao', 'Pensão']];
const CADERNETA = [];
const DICA_XP = { folego: 'limpar, cortar e quebrar', alvenaria: 'a pá, a obra e o entulho', acabamento: 'lavar, rebocar e pintar na obra; regar e rebocar nas empreitas', negocio: 'vender', roca: 'colher a horta', pesca: 'pescar' };
// "falta 1 obra" / "faltam 5 alfaces, 5 couves" (a concordância com o que falta).
const faltaTxt = partes => ((partes.length > 1 || parseInt(partes[0], 10) > 1) ? 'faltam ' : 'falta ') + partes.join(', ');
const _liberado = sis => typeof Guia === 'undefined' || Guia.liberado(sis);
const Caderneta = {
  linhas() { const r = []; for (const f of CADERNETA) { try { r.push(...(f() || [])); } catch (e) { console.error('caderneta', e); } } return r; },
  // (T6) 'gente_<id>': o Mostrar da aba Gente (a linha nasce na hora e não entra nas linhas: nem no Agora, nem nas setas da s26)
  linha(id) { if (/^gente_/.test(id || '')) return typeof Gente !== 'undefined' ? Gente.linha(id.slice(6)) : null; return Caderneta.linhas().find(l => l.id === id) || null; },
};
// Hoje: o que tem hora.
CADERNETA.push(() => {
  const r = [], dom = (G.dia - 1) % 7 === 6, l = typeof listaDeHoje === 'function' ? listaDeHoje() : null;
  if (G.obra && !Obra.aberta(G.dia, G.minutos) && !(l && l.paga)) r.push({ id: 'hoje_obra', aba: 'hoje', hoje: true, texto: `A obra do Mestre Bira, na Vila: Cr$ ${Obra.diaria()} por dia, até as 17h`, alvo: { mapa: 'vila', morador: 'bira' } });
  // (15/10, T4) o recado do dia ainda no quadro (e com vaga para aceitar) entra na mesma linha
  if (G.empreitas && _liberado('quadro')) { const serv = Object.keys(G.empreitas.aceitas).length ? 0 : G.empreitas.quadro.filter(id => Empreitas.libera(id)).length, R = G.recados;   // (C11: sem o pedido da fama trancado)
    const rec = !!R && typeof ECO !== 'undefined' && ECO.recados && R.dia === G.dia && !!R.doDia && !R.ativos[R.doDia] && Object.keys(R.ativos).length < ECO.recados.maxAtivos;
    if (serv || rec) r.push({ id: 'hoje_quadro', aba: 'hoje', hoje: true, texto: serv && rec ? `${serv} serviço(s) e 1 recado no quadro da Vila` : serv ? `${serv} serviço(s) no quadro da Vila (pagam na hora)` : '1 recado de vizinho no quadro da Vila', alvo: { mapa: 'vila', objeto: 'quadro_pedidos' } }); }
  if (G.pensao && G.pensao.estado === 'aberta' && typeof pensaoAbreHoje === 'function' && pensaoAbreHoje() && G.pensao.ultimaJanta !== G.dia && G.minutos < 17 * 60) r.push({ id: 'hoje_pensao', aba: 'hoje', hoje: true, texto: 'A pensão abre às 17h: a Rosa conta com você', alvo: { mapa: 'vila', objeto: 'pensao' } });
  if (!dom && !depositoFechado()) r.push({ id: 'hoje_deposito', aba: 'hoje', texto: `O depósito do Ananias (material, sementes, comida) fecha às ${DEPOSITO_HORARIO.fecha / 60}h`, alvo: { mapa: 'vila', objeto: 'deposito' } });
  if (typeof Clima !== 'undefined' && Clima.chove(G.dia)) r.push({ id: 'hoje_chuva', aba: 'hoje', texto: `Chove hoje: a horta já está regada e a mata${typeof Mundo !== 'undefined' && Mundo.aberto('serra') ? ' e a serra dão' : ' dá'} mais cogumelo` });
  return r;
});
// (15/10, T4) Os recados aceitos (Hoje: têm prazo), com a barrinha e o Mostrar: a seta vai aonde o item nasce ou, com tudo na
// mochila, no morador (alvoDoRecado, guia_setas.js). As linhas das tarefas (pend_*, cartao.js) deixam o recado de fora: sem dobra.
CADERNETA.push(() => {
  if (!G.recados || typeof Recados === 'undefined' || !G.mochila) return [];
  return Object.keys(G.recados.ativos).filter(id => PEDIDOS_VILA[id]).map(id => {
    const P = PEDIDOS_VILA[id], a = G.recados.ativos[id], juntando = P.tipo === 'coleta' && a.juntou < P.qtd, feito = juntando ? a.juntou : Math.min(P.qtd, G.mochila.total(P.item));
    return { id: 'recado_' + id, aba: 'hoje', hoje: true, recado: id, feito, meta: P.qtd, alvo: () => alvoDoRecado(id),
      texto: `Recado: ${juntando ? 'juntar ' : ''}${Itens.qtd(P.qtd, P.item)} para ${recadoPara(P.cliente)} (${feito}/${P.qtd}) — ${Recados.textoPrazo(a.ate)}` };
  });
});
// O quintal e a horta.
const _alvoLimparQuintal = () => { if (G.mapaId !== 'quintal') return { mapa: 'quintal' }; const o = _maisPerto(x => DET_LIMPAR.includes(x.det)); return o ? { mapa: 'quintal', ponto: { x: o.x, y: o.y - 56 }, det: o.det } : null; };
const _pontoCova = k => { const [x, y] = k.split(',').map(Number); return { mapa: 'quintal', ponto: { x: (x + 0.5) * TILE, y: y * TILE } }; };
CADERNETA.push(() => {
  const r = [];
  if (typeof QuintalMarcos !== 'undefined' && G.quintalMarcos) { const t = QuintalMarcos.total(), f = t - QuintalMarcos.restantes(), m = QuintalMarcos.proximo();
    if (m) r.push({ id: 'quintal_limpar', aba: 'quintal', texto: `Limpar o quintal: ${f} de ${t} (o Tio Juca dá um prêmio em ${m}%)`, feito: f, meta: Math.ceil(t * m / 100), alvo: _alvoLimparQuintal }); }
  if (!G.horta || !_liberado('horta')) return r;
  const covas = Object.entries(G.horta.covas), maduras = covas.filter(([, c]) => Horta.madura(c)), secas = covas.filter(([, c]) => c.planta && !Horta.molhada(c, G.dia) && !Horta.madura(c)), vazias = covas.filter(([, c]) => !c.planta);
  const est = estacaoDoDia(G.dia), daEstacao = Object.keys(CULTURAS).filter(id => CULTURAS[id].estacoes.includes(est)), semente = G.mochila.slots.find(s => s && daEstacao.includes(culturaDaSemente(s.id)));
  if (maduras.length) r.push({ id: 'horta_colher', aba: 'quintal', hoje: true, texto: `${maduras.length} pé(s) da horta pronto(s) para colher`, alvo: _pontoCova(maduras[0][0]), rotulo: 'Botão direito: colher' });
  if (secas.length) r.push({ id: 'horta_regar', aba: 'quintal', hoje: true, texto: `Regar ${secas.length} cova(s) da horta (o barril enche o regador)`, alvo: _pontoCova(secas[0][0]), rotulo: 'Use o regador aqui' });
  if (vazias.length && semente) r.push({ id: 'horta_plantar', aba: 'quintal', texto: `${vazias.length} cova(s) vazia(s): plante ${Itens.nome(semente.id).toLowerCase()}`, alvo: _pontoCova(vazias[0][0]), rotulo: 'A semente na mão, botão direito na terra' });
  else if (!semente) r.push({ id: 'horta_sementes', aba: 'quintal', texto: `Sementes da estação (${daEstacao.map(id => Itens.nome(CULTURAS[id].semente)).join(', ')}): no depósito do Ananias, aba Sementes`, alvo: { mapa: 'vila', objeto: 'deposito' }, rotulo: 'Botão direito: comprar sementes (aba Sementes)' });
  r.push({ id: 'horta_espaco', aba: 'quintal', texto: 'A pá cava cova em qualquer grama limpa do quintal: quanto mais limpo, mais horta' });
  const q = MAPAS.quintal;
  if (q && Horta.plantadas() >= MINIMO_GALINHAS && covas.some(([k, c]) => { const [x, y] = k.split(',').map(Number); return c.planta && !Horta.protegida(q, x, y); }))
    r.push({ id: 'horta_cerca', aba: 'quintal', texto: 'Cerque a horta (cerca e portão do Tio Juca): as galinhas bicam a horta aberta' });
  return r;
});
// A carreira: a próxima função, a próxima ferramenta, as habilidades.
CADERNETA.push(() => {
  const r = [];
  // (C12, 16/10; o teste crítico: "a Carreira vazia") A mesma linha da tela H: "Próximo degrau: Meio-oficial — falta 1 obra entregue".
  if (G.obra && typeof Obra !== 'undefined') { const f = Obra.falta(); if (f) { const prox = FUNCOES[G.obra.funcao + 1];
    r.push({ id: 'carreira_funcao', aba: 'carreira', texto: `Próximo degrau: ${prox} — ${Obra.textoFalta()}`, alvo: { mapa: 'vila', morador: 'bira' } }); } }
  if (typeof Ferreiro !== 'undefined' && G.ferreiro && !G.ferreiro.oficina) {
    const op = Ferreiro.FERRAMENTAS.map(id => [id, Ferreiro.custo(id)]).filter(([, c]) => c).sort((a, b) => a[1].dinheiro - b[1].dinheiro)[0];
    if (op) { const [id, c] = op, m = Object.keys(c).find(k => k !== 'dinheiro');
      r.push({ id: 'carreira_ferramenta', aba: 'carreira', texto: `${Itens.nome(id)} melhor no Seu Tonico: Cr$ ${c.dinheiro}` + (m ? ` e ${Itens.qtd(c[m], m)} (tem ${G.mochila.total(m)})` : ''),
        feito: m ? Math.min(G.mochila.total(m), c[m]) : undefined, meta: m ? c[m] : undefined, alvo: { mapa: 'vila', objeto: 'oficina' }, rotulo: 'Botão direito: a oficina do Seu Tonico' }); } }
  if (typeof Habilidades !== 'undefined') for (const h of Habilidades.LISTA) { const n = Habilidades.nivel(h); if (n >= 10) continue;
    // (15/10, T4) e o que o próximo nível dá, numa linha só: "Roça nível 3 → 4: colher a horta · no 4: …"
    const prox = Habilidades.ganhoCurto ? Habilidades.ganhoCurto(h, n + 1) : '';
    r.push({ id: 'hab_' + h, aba: 'carreira', texto: `${NOMES_HAB[h]} nível ${n} → ${n + 1}: ${Habilidades.novoAoDormir && Habilidades.novoAoDormir(h) ? 'vale ao dormir' : DICA_XP[h]}${prox ? ` · no ${n + 1}: ${prox}` : ''}`, feito: Math.round(Habilidades.progresso(h) * 100), meta: 100 }); }
  return r;
});
// A Vila: o Grêmio (o pacote mais perto de pronto em cada ala aberta), o Bazar, o museu.
CADERNETA.push(() => {
  const r = [];
  if (typeof Gremio !== 'undefined' && G.gremio && Gremio.aberto()) for (const a of GREMIO_ALAS.filter(a => Gremio.alaAberta(a.id) && !Gremio.alaPronta(a.id))) {
    const pid = a.pacotes.filter(p => !Gremio.pronto(p)).sort((x, y) => Gremio.progresso(y) - Gremio.progresso(x))[0]; if (!pid) continue;
    const P = Gremio.pacote(pid), f = Gremio.falta(pid);
    r.push({ id: 'gremio_' + a.id, aba: 'vila', texto: `Grêmio, ${a.nome}: ${P.nome} (${faltaTxt(Object.entries(f).map(([id, n]) => id === 'dinheiro' ? 'Cr$ ' + n : Itens.qtd(n, id)))})`,
      feito: Math.round(Gremio.progresso(pid) * 100), meta: 100, alvo: { mapa: 'vila', objeto: 'gremio' }, rotulo: 'Botão direito: a lista do povo' });
  }
  // (revisão 3) O Bazar com o porquê: o item escolhido no "Juntar para" ("Juntando para"); sem escolha, o mais barato com o efeito dele.
  const be = typeof Bazar !== 'undefined' && Bazar.metaEscolhida(), b = be || (typeof Bazar !== 'undefined' && Bazar.meta());
  if (b) r.push({ id: 'vila_bazar', aba: 'vila', texto: be ? `Juntando para: ${b.nome} (${be.curto}), no Bazar do Salim — Cr$ ${b.preco}` : `Bazar do Salim: ${b.nome} — ${b.efeito.replace(/\.$/, '').toLowerCase()} (Cr$ ${b.preco}; "Juntar para" põe embaixo do relógio)`, feito: Math.min(G.dinheiro, b.preco), meta: b.preco, alvo: { mapa: 'vila', objeto: 'balcao_bazar' } });
  // (15/10, T4) os recados entregues: só a conta, sem meta (como no Stardew)
  if (G.recados && typeof Recados !== 'undefined' && (G.recados.entregues > 0 || Recados.liberado())) { const n = G.recados.entregues;
    r.push({ id: 'vila_recados', aba: 'vila', texto: `Recados para o povo: ${n} ${n === 1 ? 'entregue' : 'entregues'}` }); }
  if (typeof MUSEU !== 'undefined' && G.mina && G.mina.museu) { const tot = MUSEU.ANTIGOS.length + MUSEU.RAROS.length, d = G.mina.museu.doados.length;
    if (d < tot) r.push({ id: 'vila_museu', aba: 'vila', texto: `Museu da Vila: ${d} de ${tot} doados (cave as marcas no chão; os raros vêm da pedreira e da praia)`, feito: d, meta: tot, alvo: { mapa: 'vila', objeto: 'museu' } }); }
  return r;
});
// (C12, 16/10; o teste crítico: a aba Pensão dizia "Nada por aqui ainda" com a reforma em andamento) A reforma da lojinha: a etapa
// da vez e o que falta nela (o material para a Rosa, o trabalho de hoje no salão ou "amanhã continua"); pronta, o dia em que abre.
CADERNETA.push(() => {
  const p = G.pensao; if (!p || typeof ECO === 'undefined') return [];
  const alvo = { mapa: 'vila', objeto: 'pensao' }, i = ECO.reforma.findIndex(e => e.id === p.estado);
  if (p.estado === 'pronta') return [{ id: 'pensao_reforma', aba: 'pensao', texto: `A reforma acabou: a pensão abre ${p.abreDia === G.dia ? 'hoje, às 17h' : 'no dia ' + p.abreDia}`, alvo }];
  if (i < 0) return [];
  const E = ECO.reforma[i], fm = Object.entries(p.faltaMaterial ? p.faltaMaterial() : {});
  const falta = p.estado === 'limpar' ? 'falta limpar o salão (clique na sujeira, lá dentro)'
    : fm.length ? `falta ${fm.map(([it, q]) => Itens.qtd(q, it)).join(' e ')} (entregue à Rosa)`
    : p.feitaHoje && p.feitaHoje(G.dia) ? 'o trabalho de hoje está feito: amanhã continua'
    : `falta o trabalho no salão (${E.nome.toLowerCase()})`;
  return [{ id: 'pensao_reforma', aba: 'pensao', texto: `A reforma: etapa ${i + 1} de ${ECO.reforma.length} — ${falta}`, feito: i, meta: ECO.reforma.length, alvo }];
});
// (E5a das encomendas de festa; spec docs/superpowers/specs/2026-10-16-encomendas-festa-design.md, 3.8) A festa marcada na Caderneta.
// Como no Dave (a Party Night aparece no calendário e no Cobra, e o jogador só se prepara), do nosso jeito: uma linha só na aba
// Pensão, com o porquê (quem, a ocasião, o prato, quantas pessoas e quando), a barrinha de quanto a despensa já dá ("dá para 3 de 5"),
// o que falta e de onde vem, e o Mostrar até o lugar do primeiro ingrediente que falta (a Mercearia do Ananias, o orelhão, a praia
// para o peixe, a horta...). No dia da festa, a aba Hoje ganha a sua linha ("Hoje a turma da Dona Zélia janta na pensão (18h)"), com
// o Mostrar até a pensão (onde, às 17h, o quadro de giz mostra a reserva). Vivência, não missão: nenhuma ordem, só o que se vê.
// A despensa conta a mochila (o que está nela entra na despensa quando o Jocelino entra na pensão: a mesma conta do pratosDaJanta).
const CADFESTA_ONDE = { tem: 'no baú', mercearia: 'na Mercearia do Ananias', orelhao: 'no orelhão, que entrega no dia seguinte', viajante: 'com o Viajante, às quintas',
  horta: 'na horta', quintal: 'no quintal' };
const CADFESTA_PESCA = { mar: ['praia', 'no mar'], rio: ['mata', 'no rio'], alto: ['praia', 'no barco do Seu Lourival'], serra: ['serra', 'na serra'] };
const CADFESTA_CHAO = { mata: 'na mata', praia: 'na praia', serra: 'na serra', quintal: 'no quintal', vila: 'na Vila' };
const CadFesta = {
  // A festa marcada que ainda não aconteceu, depois do aviso (a de hoje conta).
  festa() {
    const p = G.pensao; if (!p || p.estado !== 'aberta' || typeof Encomendas === 'undefined' || typeof AvisoFesta === 'undefined') return null;
    const e = Encomendas.aberta(p, G.dia); return e && e.avisado <= G.dia ? e : null;
  },
  // A pensão com a mochila já na despensa (a janta de hoje conta com ela).
  despensa(p) {
    const q = Object.create(p); q.despensa = Object.assign({}, p.despensa);
    if (G.mochila) for (const id in Pratos.INGREDIENTES) { const n = id !== 'pedra' && p.aceita(id) ? G.mochila.total(id) : 0; if (n > 0) q.despensa[id] = (q.despensa[id] || 0) + n; }
    return q;
  },
  // Para quantos da turma a despensa dá o prato (a mesma conta da reserva: Encomendas.reservar).
  da(q, e) { let n = e.turma; while (n > 0 && q.rende(e.prato, n) < 1) n--; return n; },
  // Onde se pesca o peixe e onde se acha o que nasce no chão: [mapa, "no mar"].
  pesca(id) {
    if (id === 'siri') return ['praia', 'no covo, na praia'];
    const ids = id === 'peixe' ? Pratos.PEIXES : [id];
    if (typeof LUGARES_PESCA !== 'undefined') for (const l in LUGARES_PESCA) { const m = CADFESTA_PESCA[l]; if (m && (typeof Mundo === 'undefined' || Mundo.aberto(m[0])) && LUGARES_PESCA[l].some(x => ids.includes(x.id))) return m; }
    return ['praia', 'no mar'];
  },
  chao(id) {
    if (typeof ACHADOS_ESTACAO === 'undefined') return ['vila', CADFESTA_CHAO.vila];
    const T = { mata: ACHADOS_MATA, praia: [ACHADOS_PRAIA], serra: typeof ACHADOS_SERRA !== 'undefined' ? ACHADOS_SERRA : [], quintal: ACHADOS_ESTACAO, vila: ACHADOS_ESTACAO };
    const m = Object.keys(T).find(k => (typeof Mundo === 'undefined' || Mundo.aberto(k)) && T[k].some(est => (est || []).some(([x]) => x === id))) || 'vila';
    return [m, CADFESTA_CHAO[m]];
  },
  // De onde vem o que falta, em palavras ("no orelhão, que entrega no dia seguinte").
  onde(id, fonte) {
    if (fonte === 'pesca') return 'pescando ' + CadFesta.pesca(id)[1];
    if (fonte === 'coleta') return 'catando ' + CadFesta.chao(id)[1];
    return CADFESTA_ONDE[fonte] || '';
  },
  // O Mostrar do ingrediente que falta: o lugar de onde ele vem.
  alvo(p, id, fonte) {
    switch (fonte) {
      case 'mercearia': return { mapa: 'vila', objeto: 'deposito', mercearia: true };
      case 'orelhao': return { mapa: 'vila', objeto: 'orelhao' };
      case 'viajante': return typeof Viajante !== 'undefined' && Viajante.presente(p, G.dia) ? { mapa: 'vila', objeto: 'viajante' } : { mapa: 'vila' };
      case 'pesca': { const m = CadFesta.pesca(id)[0]; return G.mapaId === 'praia' && m === 'praia' && typeof PRAIA !== 'undefined' ? { mapa: 'praia', ponto: { x: (PRAIA.PIER_X + 1) * TILE, y: PRAIA.PIER_FIM * TILE } } : { mapa: m }; }
      case 'horta': { const k = G.horta && Object.keys(G.horta.covas).find(c => G.horta.covas[c] && G.horta.covas[c].planta === id); return k ? _pontoCova(k) : { mapa: 'quintal' }; }
      case 'coleta': return { mapa: CadFesta.chao(id)[0] };
      case 'quintal': return { mapa: 'quintal' };
      case 'tem': { const b = (G.baus || []).find(x => x.m && x.m.total && (id === 'peixe' ? Pratos.PEIXES.some(f => x.m.total(f) > 0) : x.m.total(id) > 0)); return b ? { mapa: b.mapa, ponto: { x: (b.x + 0.5) * TILE, y: b.y * TILE } } : null; }
    }
    return null;
  },
  // A frase do rótulo da seta.
  rotulo(qtd, fonte, id) {
    switch (fonte) {
      case 'mercearia': return `Botão direito: a Mercearia do Ananias — falta ${qtd} para a festa`;
      case 'orelhao': return `Botão direito: o orelhão — encomende ${qtd} para a festa (chega no dia seguinte)`;
      case 'viajante': return `O Viajante vem às quintas: falta ${qtd} para a festa`;
      case 'pesca': return `Pesque ${CadFesta.pesca(id)[1]}: falta ${qtd} para a festa`;
      case 'horta': return `Falta ${qtd} para a festa: colha na horta`;
      case 'coleta': return `Falta ${qtd} para a festa: cate ${CadFesta.chao(id)[1]}`;
      case 'quintal': return `Falta ${qtd} para a festa: está no quintal`;
      case 'tem': return `Falta ${qtd} na despensa para a festa: está no baú`;
    }
    return '';
  },
  // O que a despensa dá e o que falta: { da, falta: [[ingrediente, qtd, fonte]], partes: ["1 de pescada e 1 de dendê: no orelhão, que entrega no dia seguinte"] }
  // (o que vem do mesmo lugar junto: a linha não repete o lugar).
  situacao(p, e) {
    const q = CadFesta.despensa(p), g = q.gasto(e.prato, e.turma), fontes = Encomendas.fontes(p, e.prato, e.turma, G.dia, e.dia);
    const falta = Object.keys(g).filter(x => q._tem(x) < g[x]).map(x => [x, g[x] - q._tem(x), fontes[x] || '']);
    const grupos = []; for (const [x, n, f] of falta) { const o = CadFesta.onde(x, f); let g = grupos.find(k => k.o === o); if (!g) grupos.push(g = { o, itens: [] }); g.itens.push(qtdNaPanela(x, n)); }
    return { da: CadFesta.da(q, e), falta, partes: grupos.map(g => listaE(g.itens) + (g.o ? `: ${g.o}` : '')) };
  },
  // A pensão por fora: dentro do salão a seta não tem o que mostrar (o quadro de giz e a ponta já falam).
  aPensao() { return typeof noPalco === 'function' && noPalco() ? null : { mapa: 'vila', objeto: 'pensao' }; },
};
CADERNETA.push(() => {
  const e = CadFesta.festa(); if (!e) return [];
  const p = G.pensao, S = CadFesta.situacao(p, e), r = [], bem = S.falta.length === 0;
  // aba Pensão: a festa marcada
  const alvoFalta = S.falta.find(([x, , f]) => f && CadFesta.alvo(p, x, f));
  const base = `Festa ${AvisoFesta.da(e)}: ${AvisoFesta.prato(e)} para ${e.turma}, ${AvisoFesta.quando(e)} (${AvisoFesta.ocasiao(e)})`;
  const meio = e.turma * Encomendas.E.minimo;
  const texto = bem ? `${base} — a despensa já dá para a turma toda; às 17h a Rosa separa a reserva`
    : `${base} — dá para ${S.da} de ${e.turma}: ${S.falta.length > 1 || S.falta[0][1] > 1 ? 'faltam' : 'falta'} ${S.partes.join('; ')}${S.da < meio ? '. Com menos da metade, a festa fica pra próxima' : ''}`;
  r.push({ id: 'pensao_festa', aba: 'pensao', hoje: e.dia === G.dia, texto, feito: S.da, meta: e.turma,
    alvo: alvoFalta ? () => CadFesta.alvo(p, alvoFalta[0], alvoFalta[2]) : CadFesta.aPensao,
    rotulo: alvoFalta ? CadFesta.rotulo(qtdNaPanela(alvoFalta[0], alvoFalta[1]), alvoFalta[2], alvoFalta[0]) : 'Botão direito: entrar na pensão — às 17h, no quadro de giz, a Rosa mostra a reserva da turma' });
  // aba Hoje: no dia da festa
  if (e.dia === G.dia && (G.turno || p.ultimaJanta !== G.dia)) r.push(G.turno
    ? { id: 'hoje_festa', aba: 'hoje', hoje: true, texto: `A turma ${AvisoFesta.da(e)} está na pensão: ${AvisoFesta.prato(e)} para ${e.turma}` }
    : { id: 'hoje_festa', aba: 'hoje', hoje: true, feito: S.da, meta: e.turma, alvo: CadFesta.aPensao,
      texto: `Hoje a turma ${AvisoFesta.da(e)} janta na pensão (18h): ${AvisoFesta.prato(e)} para ${e.turma}; ${bem ? 'a despensa já dá' : `a despensa dá para ${S.da} de ${e.turma}`}`,
      rotulo: 'Botão direito: entrar na pensão — às 17h, no quadro de giz, a Rosa mostra a reserva da turma' });
  return r;
});
// A pensão: a próxima estrela e a melhoria ao alcance.
CADERNETA.push(() => {
  const p = G.pensao; if (!p || p.estado !== 'aberta') return [];
  const r = [], prox = p.proximoDegrau && p.proximoDegrau();
  if (prox) { const f = prox.falta, partes = []; if (f.curtidas) partes.push(`${f.curtidas} curtidas`); if (f.sabor) partes.push(`melhor sabor +${f.sabor} (caprichar e servir no salão)`); if (f.pesquisadas) partes.push(`${f.pesquisadas} receita(s) pesquisada(s)`);
    r.push({ id: 'pensao_degrau', aba: 'pensao', texto: `Próxima estrela (${prox.nome}): ${partes.length ? faltaTxt(partes) : 'falta pouco'}`, feito: Math.round(p.progresso() * 100), meta: 100, alvo: { mapa: 'vila', objeto: 'pensao' } }); }
  if (typeof MELHORIAS !== 'undefined') { const m = Object.entries(MELHORIAS).filter(([id, x]) => !p.melhorias.includes(id) && p.grau() >= x.grau && !x.premio).sort((a, b) => a[1].preco - b[1].preco)[0];
    if (m) r.push({ id: 'pensao_melhoria', aba: 'pensao', texto: `Melhoria do salão ao alcance: ${m[1].nome} (Cr$ ${m[1].preco})`, feito: Math.min(G.dinheiro, m[1].preco), meta: m[1].preco, alvo: { mapa: 'vila', objeto: 'pensao' } }); }
  // (onda final) O cardápio da noite (o do Bancho): o que está guardado no quadro de giz e quando se monta. Sem lugar: não vira ideia do "Agora".
  { const esc = p.cardapioNoite || {}, ids = Object.keys(esc).filter(id => (esc[id].panelas | 0) > 0 && p.receitas.includes(id));
    r.push({ id: 'pensao_cardapio', aba: 'pensao', texto: ids.length ? `Cardápio guardado: ${ids.map(id => `${Pratos.PRATOS[id].nome} (${esc[id].panelas} ${esc[id].panelas === 1 ? 'panela' : 'panelas'})`).join(', ')}. Às 17h, no quadro de giz do salão, você confere e abre a pensão`
      : 'O cardápio da noite: às 17h, no quadro de giz do salão, escolha os pratos e as panelas (sem cardápio, todos levam o prato da casa)' }); }
  // (onda final) As cenas de prato: quantas o jogador já viu (a 1ª venda de cada receita com cena, o prato do VIP e o da festa tocam).
  if (typeof CENAS_PRATO !== 'undefined') { const tot = Object.keys(CENAS_PRATO).length, v = (G.cenasVistas || []).length;
    if (v < tot) r.push({ id: 'pensao_cenas', aba: 'pensao', texto: `Cenas de prato: ${v} de ${tot} vistas (a 1ª venda do PF, de um peixe inteiro e de uma moqueca; o prato do VIP e o da festa também)`, feito: v, meta: tot }); }
  return r;
});
// A tela: as 5 abas; cada linha com a barrinha e o Mostrar (a seta leva até lá; de novo, tira a seta).
// (C12, 16/10; o teste crítico: os 5 cipós do Nhô Quim não estavam em lugar nenhum) A aba Mata e serra só aparece com linha nela
// (a serra aberta): antes de Vila e da Pensão. As linhas da serra (conhecer, coleta, peixes, o Nhô Quim) moram nela.
const CADERNETA_ABA_MATA = ['mata', 'Mata e serra'];
// (T6) A aba Gente vem sempre por último (fora do CADERNETA_ABAS: ela não tem linhas, tem gente; a s26 confere uma linha por aba de lá).
const CADERNETA_ABA_GENTE = ['gente', 'Gente'];
const abasDaCaderneta = () => { const a = CADERNETA_ABAS.slice(); if (Caderneta.linhas().some(l => l.aba === 'mata')) a.splice(a.findIndex(([id]) => id === 'pensao'), 0, CADERNETA_ABA_MATA); a.push(CADERNETA_ABA_GENTE); return a; };
function abrirCaderneta(aba = Caderneta.aba || 'hoje') {
  const caixa = el('div', { class: 'painel caderneta' });
  const desenha = () => {
    caixa.innerHTML = ''; const abas = abasDaCaderneta(); if (!abas.some(([id]) => id === aba)) aba = 'hoje'; Caderneta.aba = aba;
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, 'Caderneta do Jocelino'),
      el('div', { class: 'abas' }, abas.map(([id, nome]) => el('div', { class: 'aba' + (id === aba ? ' ativa' : ''), onclick: e => { e.stopPropagation(); aba = id; desenha(); } }, nome))));
    if (aba === 'gente') { caixa.append(Gente.tela(desenha), el('div', { class: 'rodape' }, 'Mostrar: a seta leva até a pessoa. A tecla J abre e fecha a caderneta.')); return; }
    const ls = Caderneta.linhas().filter(l => l.aba === aba);
    caixa.append(el('div', { class: 'cad-lista' }, ...(ls.length ? ls.map(l => el('div', { class: 'cad-linha' },
      el('div', { class: 'cad-texto' }, l.texto),
      l.meta ? el('div', { class: 'cad-barra' }, el('div', { style: `width:${Math.round(100 * Math.min(1, (l.feito || 0) / l.meta))}%` })) : el('div'),
      l.alvo ? el('button', { class: 'botao' + (G.setaFixa === l.id ? ' forte' : ''), onclick: e => { e.stopPropagation(); G.setaFixa = G.setaFixa === l.id ? null : l.id; desenha(); hudSujo(); } }, G.setaFixa === l.id ? 'Tirar a seta' : 'Mostrar') : null))
      : [el('div', { class: 'rodape' }, 'Nada por aqui ainda.')])),
      el('div', { class: 'rodape' }, 'Mostrar: a seta leva até lá. A tecla J abre e fecha a caderneta.'));
  };
  desenha(); abrirModal(caixa); sons.tocar('abrir', 1, 0.03, -6); return true;
}
INICIADORES.push(() => { G.setaFixa = null; });
// As ideias (o "Agora" do cartão da família): as linhas da caderneta com lugar — primeiro o que só dá hoje,
// depois o que está mais perto de pronto; o sorteio do dia desempata (fixo durante o dia).
Caderneta.ideias = function (n = 3) {
  const f = mulberry(G.dia * 104729), ls = Caderneta.linhas().filter(l => l.alvo).map(l => ({ l, k: (l.hoje ? 2 : 0) + (l.meta ? Math.min(1, (l.feito || 0) / l.meta) : 0) + f() * 0.05 }));
  return ls.sort((a, b) => b.k - a.k).slice(0, n).map(x => x.l);
};

// ---------- (T6 das conversas e histórias) A aba "Gente" (spec 2026-10-15-conversas-historias-design.md, seção 4.2 e a decisão 3) ----------
// Como é no Stardew (a aba Social do menu): cada morador numa linha, com o retrato, o nome e os 10 corações; as 2 caixinhas dos
// presentes da semana; quem ainda não foi apresentado fica em silhueta, com "???"; a lista vai de quem tem mais amizade para quem tem
// menos. Do nosso jeito:
// - NO ALTO, A FAMÍLIA (Rosa, Tio Juca, Ritinha e Zezinho), SEM CORAÇÕES nem caixinhas (decisão 3: só o carinho): o retrato, o
//   aniversário, os gostos descobertos e uma frase do dia a dia, que muda com a vida da casa (a pensão, a mudança, a chuva).
// - EMBAIXO, O POVO DA VILA: os corações (o cheio é o fx/coracao; o vazio, a mesma arte em transparência), as 2 caixinhas da semana
//   (a arte itens/presente: cheia quando o presente foi dado, transparente quando não; não existe arte de caixinha vazia), o aniversário
//   (o bolinho salao/bolo_festa quando é hoje ou amanhã), os gostos descobertos (os ícones dos itens) e o dia em que janta na pensão.
// - A FRASE DE CLIMA (vivência, não missões): quando uma cena da pessoa está pronta (Historias.pronta), a linha dela ganha a frase do
//   arco ("A Dona Zélia anda olhando muito o correio"). Nunca uma ordem, nunca "faltam X cenas". O Mostrar leva até a PESSOA.
// - AS LEMBRANÇAS: as cenas já vistas (Historias.lembrancas), com o Rever. O Rever fecha a Caderneta antes (a cena não toca com uma
//   janela aberta) e, se não dá agora, diz por quê num aviso.
// QUEM APARECE NA VILA (a ressalva da T1: o Seu Moreira e os peões ganham corações): o povo do piloto (o Bira, o Zé, a Dona Zélia, o
// Seu Lourival, o Seu Ananias e o Seu Tonico) aparece sempre, em silhueta até conhecer. O resto do povo com retrato (o Seu Moreira, o
// Nhô Quim, o Tião, os peões da turma, a Dona Cida, o Seu Orlando, a clientela e os vizinhos do Bairro Novo, e quem vier: a Marisa, a
// Dona Zefa, o Tiaguinho) aparece depois de conhecido (conversou uma vez, ou já tem amizade): a aba não entrega quem ainda vai chegar.
// Fica de fora quem não tem retrato (o Tonhão), o cachorro, o Viajante, os banhistas e os clientes de passagem.
const GENTE = {
  FAMILIA: ['rosa', 'juca', 'ritinha', 'zezinho'],
  VILA: ['bira', 'ze', 'zelia', 'lourival', 'ananias', 'tonico'],
  VILA_DEPOIS: ['santos', 'mateiro', 'tiao', 'severino', 'cicero', 'damiao', 'dona_cida', 'orlando', 'lurdes', 'paulo', 'nena', 'neide', 'valdir',
    'rosinete', 'tonha', 'nenem', 'marisa', 'zefa', 'tiaguinho'],
  // Onde procurar cada um (o Mostrar): [mapa, id do morador lá]. Quem está no mapa de agora é achado onde estiver.
  LUGAR: { rosa: ['quintal', 'rosa'], juca: ['quintal', 'juca'], ritinha: ['quintal', 'ritinha'], zezinho: ['quintal', 'zezinho'],
    bira: ['vila', 'bira'], ze: ['vila', 'ze'], zelia: ['vila', 'zelia'], ananias: ['vila', 'ananias'], tonico: ['vila', 'tonico'], tiao: ['vila', 'tiao'],
    santos: ['vila', 'santos'], severino: ['vila', 'severino'], cicero: ['vila', 'cicero'], damiao: ['vila', 'damiao'], lourival: ['praia', 'lourival'],
    mateiro: ['serra', 'mateiro'], dona_cida: ['bairro', 'balcao_padaria'], orlando: ['bairro', 'balcao_bar'],
    lurdes: ['bairro', 'dono_lurdes'], nena: ['bairro', 'dono_nena'], neide: ['bairro', 'dono_neide'], valdir: ['bairro', 'dono_valdir'],
    rosinete: ['bairro', 'dono_rosinete'], tonha: ['bairro', 'dono_tonha'], nenem: ['bairro', 'dono_nenem'] },
  GOSTOS: [['ama', 'Ama'], ['gosta', 'Gosta'], ['naoGosta', 'Não gosta'], ['odeia', 'Odeia']],
  // A frase do dia a dia da família: a 1ª que casa (a mais da vida de agora primeiro). Só o carinho: nunca uma ordem.
  FRASES: {
    rosa: [
      [() => G.firma && G.firma.feita, 'Guardou o recorte da inauguração dentro do caderno de receitas.'],
      [() => Gente._pensao('aberta') && G.pensao.grau && G.pensao.grau() >= 4, 'Já tem freguês que chama a pensão de "a casa da Rosa".'],
      [() => Gente._pensao('aberta'), 'Acorda cantando e passa o café pensando no cardápio da noite.'],
      [() => Gente._pensao('pronta'), 'Não larga das mesas da pensão: arruma, desarruma e arruma de novo.'],
      [() => G.lojinha && G.lojinha.comprada, 'Passa na frente da lojinha e já vê as mesas no lugar.'],
      [() => G.lojinha && G.lojinha.sonho, 'Suspira toda vez que passa na frente da lojinha da esquina.'],
      [() => true, 'Ainda estranha o vento do mar, mas já chama o quintal de "nosso".'],
    ],
    juca: [
      [() => G.casa && G.casa.mudou, 'Diz que a casa dele ficou sossegada demais desde a mudança.'],
      [() => Gente._chove(), 'Com chuva, pita o cachimbo na varanda e conta causo de Aracaju.'],
      [() => G.horta && Object.values(G.horta.covas || {}).some(c => c && c.planta), 'Confere a horta toda manhã, pé por pé, como quem conta galinha.'],
      [() => true, 'Pita o cachimbo na varanda e conta causo de Aracaju para quem passar.'],
    ],
    ritinha: [
      [() => Gente._pensao('aberta'), 'Anda contando os pratos da pensão de cabeça.'],
      [() => G.obra && G.obra.funcao >= 1 && typeof FUNCOES !== 'undefined', () => `Conta para a escola inteira que o pai agora é ${FUNCOES[G.obra.funcao].toLowerCase()}.`],
      [() => true, 'Desenha a Vila inteira no caderno, com o mar de fundo.'],
    ],
    zezinho: [
      [() => Gente._chove(), 'Pula nas poças do quintal quando a mãe não está olhando.'],
      [() => G.casa && G.casa.mudou, 'Arrumou um canto do quarto novo só para a coleção de pedras.'],
      [() => true, 'Corre atrás do Caramelo o dia inteiro.'],
    ],
  },
  // O que o Rever diz quando não dá agora (Historias.rever devolve o motivo; '' = começou).
  NAO_REVE: { janta: 'Agora não dá para lembrar: a janta da pensão está no fogo.', carga: 'Com material nos braços não dá para lembrar: largue a carga antes.',
    tocando: 'Uma lembrança de cada vez.', dormindo: 'Agora não dá para lembrar: é hora de dormir.' },
  NAO_REVE_OUTRO: 'Agora não dá para lembrar: termine o que está fazendo e tente de novo.',
};
const Gente = {
  _pensao(e) { return !!G.pensao && G.pensao.estado === e; },
  _chove() { return typeof Clima !== 'undefined' && Clima.chove(G.dia); },
  id(id) { return typeof Amizade !== 'undefined' ? Amizade.id(id) : id; },
  nome(id) { return typeof Amizade !== 'undefined' ? Amizade.nome(id) : id; },
  retrato(id) { return 'retratos/' + id + '_normal'; },
  temRetrato(id) { return typeof ARTE_LISTA === 'undefined' || ARTE_LISTA.includes(Gente.retrato(id)); },
  familia(id) { return GENTE.FAMILIA.includes(Gente.id(id)); },
  // Já se conhecem: a família sempre; o povo, depois da 1ª conversa (o motor de falas, ou o +10 da conversa) ou com amizade.
  conhece(id) {
    id = Gente.id(id); if (Gente.familia(id)) return true;
    return (typeof Conversas !== 'undefined' && Conversas.conhece(id)) || (G.amizade || {})[id] > 0 || id in (G.amizadeConversa || {});
  },
  // O povo da Vila na aba: [{ id, conhece }] — quem conhece primeiro, de quem tem mais amizade para quem tem menos (como no Stardew);
  // empate na ordem da lista; o piloto que não conhece, em silhueta, no fim.
  vila() {
    const r = [];
    GENTE.VILA.forEach((id, k) => r.push({ id, k, conhece: Gente.conhece(id) }));
    GENTE.VILA_DEPOIS.forEach((id, k) => { if (Gente.temRetrato(id) && Gente.conhece(id)) r.push({ id, k: 100 + k, conhece: true }); });
    const pts = id => (typeof Amizade !== 'undefined' ? Amizade.pontos(id) : 0);
    return r.filter(p => Gente.temRetrato(p.id)).sort((a, b) => (b.conhece - a.conhece) || (pts(b.id) - pts(a.id)) || (a.k - b.k));
  },
  // [estação, dia] → "9 de Outono"
  aniversario(id) { const a = typeof Presentes !== 'undefined' ? Presentes.aniversario(id) : null; return a ? `${a[1]} de ${ESTACOES[a[0]]}` : ''; },
  // 'hoje' | 'amanha' | ''
  aniversarioPerto(id) { if (typeof Presentes === 'undefined') return ''; return Presentes.aniversarioEm(id, G.dia) ? 'hoje' : Presentes.aniversarioEm(id, G.dia + 1) ? 'amanha' : ''; },
  // O dia em que janta na pensão ("às quartas"), só com a pensão aberta (antes, a pensão nem existe para o povo).
  janta(id) {
    if (!Gente._pensao('aberta') || typeof CLIENTELA === 'undefined') return '';
    const PL = ['segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados', 'domingos'];
    for (const d in CLIENTELA) if ((CLIENTELA[d] || []).some(c => Gente.id(c.id) === id)) return 'às ' + PL[d];
    return '';
  },
  // Os gostos descobertos: [[rótulo, [itens]]] (só os que têm item).
  gostos(id) { if (typeof Conversas === 'undefined' || !Conversas.descobertos) return []; const d = Conversas.descobertos(id); return GENTE.GOSTOS.filter(([k]) => d[k] && d[k].length).map(([k, n]) => [n, d[k]]); },
  // A frase da linha: a de clima de uma cena pronta (o arco casa; falta só o lugar e a hora) e, na família, senão, a do dia a dia.
  clima(id) { try { const p = typeof Historias !== 'undefined' ? Historias.pronta(id) : null; return (p && p.clima) || ''; } catch (e) { console.error(e); return ''; } },
  frase(id) {
    const c = Gente.clima(id); if (c) return c;
    for (const [se, f] of GENTE.FRASES[id] || []) { let ok = false; try { ok = !!se(); } catch (e) { ok = false; } if (ok) return typeof f === 'function' ? f() : f; }
    return '';
  },
  // A linha do Mostrar (Caderneta.linha('gente_<id>')): a seta até a pessoa. Quem não conhece, ou sem lugar, não tem.
  linha(id) {
    id = Gente.id(id); const L = GENTE.LUGAR[id]; if (!L || !Gente.conhece(id)) return null;
    const nome = Gente.nome(id);
    return { id: 'gente_' + id, aba: 'gente', texto: nome, rotulo: `Botão direito: falar com ${nome}`, alvo: () => {
      const aqui = G.mapa && (G.mapa.moradores || []).find(m => m.visivel !== false && typeof Amizade !== 'undefined' && Amizade.idDe(m) === id);
      return aqui ? { mapa: G.mapaId, morador: aqui.id } : { mapa: L[0], morador: L[1] };
    } };
  },
  // Rever uma lembrança: fecha a Caderneta e chama o motor; se não dá agora, o aviso diz por quê.
  rever(hid) {
    for (let k = 0; k < 5 && !$('#modal').hidden; k++) fecharModal();
    const m = typeof Historias !== 'undefined' ? Historias.rever(hid) : 'nao_existe';
    if (m) avisar(GENTE.NAO_REVE[m] || GENTE.NAO_REVE_OUTRO);
    return m;
  },

  // ---------- a tela ----------
  _img(arte, classe, title) { return el('img', { class: classe, src: urlArte(arte), alt: '', title: title || null, draggable: 'false' }); },
  _mostrar(id, desenha) {
    const l = Gente.linha(id); if (!l) return null;
    const on = G.setaFixa === l.id;
    return el('button', { class: 'botao gente-mostrar' + (on ? ' forte' : ''), onclick: e => { e.stopPropagation(); G.setaFixa = on ? null : l.id; desenha(); hudSujo(); } }, on ? 'Tirar a seta' : 'Mostrar');
  },
  _aniversario(id) {
    const a = Gente.aniversario(id); if (!a) return null;
    const perto = Gente.aniversarioPerto(id);
    return el('span', { class: 'gente-aniv' + (perto ? ' perto' : ''), 'data-perto': perto || null }, `Aniversário: ${a}`,
      perto ? [' ', Gente._img('salao/bolo_festa', 'gente-bolo', perto === 'hoje' ? 'Hoje!' : 'Amanhã'), perto === 'hoje' ? ' hoje!' : ' amanhã'] : null);
  },
  _gostos(id) {
    const gs = Gente.gostos(id); if (!gs.length) return null;
    return el('div', { class: 'gente-gostos' }, gs.map(([n, its]) => el('span', { class: 'gente-gosto' }, el('b', {}, n + ':'), its.map(it => Gente._img('itens/' + it, 'gente-item', Itens.nome(it))))));
  },
  _frase(id) { const f = Gente.frase(id); return f ? el('div', { class: 'gente-frase' }, f) : null; },
  linhaFamilia(id, desenha) {
    return el('div', { class: 'gente-linha familia', 'data-quem': id },
      Gente._img(Gente.retrato(id), 'gente-retrato'),
      el('div', { class: 'gente-miolo' },
        el('div', { class: 'gente-topo' }, el('span', { class: 'gente-nome' }, Gente.nome(id))),
        el('div', { class: 'gente-info' }, Gente._aniversario(id)),
        Gente._gostos(id), Gente._frase(id)),
      Gente._mostrar(id, desenha));
  },
  linhaVila(p, desenha) {
    const id = p.id;
    if (!p.conhece) return el('div', { class: 'gente-linha vila desconhecido', 'data-quem': id },
      Gente._img(Gente.retrato(id), 'gente-retrato silhueta'), el('div', { class: 'gente-miolo' }, el('div', { class: 'gente-topo' }, el('span', { class: 'gente-nome' }, '???'))), null);
    const c = typeof Amizade !== 'undefined' ? Amizade.coracoes(id) : 0, n = typeof Presentes !== 'undefined' ? Math.min(PRESENTE.POR_SEMANA, Presentes.naSemana(id)) : 0;
    const cor = el('span', { class: 'gente-coracoes', title: `${c} de 10 corações` }, Array.from({ length: 10 }, (_, k) => Gente._img('fx/coracao', 'gente-coracao' + (k < c ? '' : ' vazio'))));
    const cx = el('span', { class: 'gente-caixas', title: `Presentes da semana: ${n} de 2` }, [0, 1].map(k => Gente._img('itens/presente', 'gente-caixa' + (k < n ? '' : ' vazio'))));
    const janta = Gente.janta(id);
    return el('div', { class: 'gente-linha vila', 'data-quem': id },
      Gente._img(Gente.retrato(id), 'gente-retrato'),
      el('div', { class: 'gente-miolo' },
        el('div', { class: 'gente-topo' }, el('span', { class: 'gente-nome' }, Gente.nome(id)), el('span', { class: 'gente-marcas' }, cor, cx)),
        el('div', { class: 'gente-info' }, Gente._aniversario(id), janta ? el('span', { class: 'gente-janta' }, `Janta na pensão ${janta}`) : null),
        Gente._gostos(id), Gente._frase(id)),
      Gente._mostrar(id, desenha));
  },
  lembrancas() { try { return typeof Historias !== 'undefined' ? Historias.lembrancas() : []; } catch (e) { console.error(e); return []; } },
  tela(desenha) {
    const lem = Gente.lembrancas();
    return el('div', { class: 'gente' },
      el('div', { class: 'gente-sub' }, 'A família'),
      GENTE.FAMILIA.map(id => Gente.linhaFamilia(id, desenha)),
      el('div', { class: 'gente-sub' }, 'O povo da Vila'),
      Gente.vila().map(p => Gente.linhaVila(p, desenha)),
      lem.length ? el('div', { class: 'gente-sub' }, 'Lembranças') : null,   // (o el achata só um nível: as linhas vêm à parte)
      lem.map(l => el('div', { class: 'gente-lembranca', 'data-historia': l.id },
          l.quem && Gente.temRetrato(l.quem) ? Gente._img(Gente.retrato(l.quem), 'gente-retrato-p') : el('span'),
          el('span', { class: 'gente-lem-titulo' }, l.titulo, l.quem ? el('span', { class: 'gente-lem-quem' }, ` · ${Gente.nome(l.quem)}`) : null),
          el('button', { class: 'botao gente-rever', onclick: e => { e.stopPropagation(); Gente.rever(l.id); } }, 'Rever'))));
  },
};
