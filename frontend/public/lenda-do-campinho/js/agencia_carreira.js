/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ⚽ AGÊNCIA 3.0 — ETAPA 6: CARREIRA PROFISSIONAL (v341). Do documento do dono:
   - Aos 17 anos o clube de base oferece o PRIMEIRO CONTRATO PROFISSIONAL. A negociação usa o sistema da família, mas
     o clube tem necessidades próprias (Preço baixo, Contrato longo ou Multa alta); cada outro clube interessado dá
     +10 de poder de barganha.
   - A agência passa a ganhar de verdade: comissão sobre o salário (a do contrato com a família), patrocínios e a
     taxa de intermediação (5% a 10%, pela reputação) em cada transferência.
   - PATROCÍNIOS por nível de visibilidade (loja local 20, regional 45, nacional 70, global 90), com obrigação de
     ações (1 ação a cada 4/3/2/1 semanas). A agência fica com 10% a 20% (negociado). Marca polêmica (refrigerante muito doce ou jogo
     cheio de anúncios — v407 U2; antes era aposta/bebida) paga o dobro, mas famílias que precisam de Segurança perdem 15 de confiança.
   - Decisões de carreira (cartas): renovação, empréstimo, convocação para a seleção de base; e as propostas de
     transferência, que dá para negociar com o diretor.
   - Valor de mercado do documento (agmValor). A VENDA PARA A EUROPA é o clímax: cena especial, o maior pagamento,
     um salto de reputação e o garoto vira LENDA DA AGÊNCIA (sai do calendário e libera a vaga).
   Carregar DEPOIS de agencia_desenvolvimento.js.
   ============================================================ */
const AGM_SAL_BASE = { pequeno: 30000, medio: 100000, grande: 300000 }; // v344: ×2 (a agência dava prejuízo) // salário semanal de profissional por porte do clube
const AGM_PATRO_MARCAS = { loja: ['Loja do Seu Bené', 'Esportes da Esquina', 'Chuteiraria Gol'], regional: ['Refri Gol', 'Lanche do Craque', 'Isotônico Raio'], nacional: ['Chuteiras Foguete', 'Celular Drible', 'Banco Bola de Ouro'], global: ['Tênis Pulo Alto Mundial', 'Galáxia Sports', 'Planeta Bola'] };
// v407 (Raio-X U2): o dono trocou aposta e cerveja por marcas que uma criança entende — a "polêmica" agora é
// se a marca faz bem para a saúde do jogador e o que a torcida pensa (famílias de Segurança continuam não gostando).
const AGM_PATRO_POLEMICAS = ['🥤 Refri Mega Açúcar (refrigerante muito doce)', '📱 Joguinho Mil Anúncios (jogo de celular cheio de propaganda)'];
const AGM_LEMBRANCAS = {
  lemb_contrato: { nome: 'Primeiro Contrato Profissional (emoldurado)', tipo: 'loot', venda: 1, desc: 'Lembrança da sua agência: o primeiro contrato profissional de um garoto seu. Não venda!', iconeBase: 'i_contrato' },
  lemb_patrocinio: { nome: 'Chuteira do Primeiro Patrocinador', tipo: 'loot', venda: 1, desc: 'Lembrança da sua agência: a chuteira do primeiro patrocínio. Não venda!', iconeBase: 'i_chuteira_elite' },
  lemb_camisa: { nome: 'Camisa Autografada da Primeira Venda Internacional', tipo: 'loot', venda: 1, desc: 'Lembrança da sua agência: autografada pelo seu primeiro craque vendido ao exterior.', iconeBase: 'i_camisa_lenda' },
  lemb_lenda: { nome: 'Bola de Ouro da Agência', tipo: 'loot', venda: 1, desc: 'Lembrança da sua agência: a primeira Lenda que você formou, da várzea até a Europa.', iconeBase: 'i_bola_ouro' },
};
for (const [id, it] of Object.entries(AGM_LEMBRANCAS)) if (!ITENS[id]) ITENS[id] = it;
function agmLembranca(a, id, lin) { if ((a.lembrancas = a.lembrancas || {})[id]) return; a.lembrancas[id] = a.semana; try { recebeItem(id, 1); } catch (e) { } const t = `🎁 Lembrança para o seu armazém: ${AGM_LEMBRANCAS[id].nome}!`; if (lin) lin(t, 1); else log(t, 'l-loot'); }
const agmTaxaTransf = a => 5 + Math.round(a.rep / 20); // 5% a 10%, pela reputação
function agmSalarioPro(j, degrau) { return Math.round(AGM_SAL_BASE[degrau || 'pequeno'] * Math.max(0.6, 1 + (agmOverall(j) - 10) * 0.12)); }
function agmInteressados(j) { return (j.convites || []).length + (j.propostas || []).length + (j.sondagemExterior ? 1 : 0) + (j.visib >= 60 ? 1 : 0); }
// clubes profissionais (inventados) por degrau 0–4: 0–2 Brasil, 3 América do Sul, 4 Europa
function agmClubePro(nv) { const c = AG_CLUBES[clamp(nv, 0, 4)], [nome, pais, cor] = agPega(c.nomes); return { nome, pais, cor, nivel: c.nivel, tipo: 'pro', degrau: nv >= 2 ? 'grande' : nv === 1 ? 'medio' : 'pequeno' }; }
const agmOvrClube = nv => AG_CLUBES[clamp(nv, 0, 4)].ovr / 5; // o "overall" que o clube espera, na escala 1–20

/* ---------- 1) o primeiro contrato profissional: negociar com o clube ---------- */
const AGM_CLUBE_NEC = { preco: '💲 Preço baixo', longo: '📅 Contrato longo', multa: '🔒 Multa alta' };
function agmNegociaPro(j) {
  const a = agDados(), of = j.ofertaPro; if (!of) return;
  if (a.acoes <= 0) { log('Negociar o contrato gasta 1 ação da semana — acabaram as ações.', 'l-sis'); return; }
  if (!of.need) { const l = agEmbM(Object.keys(AGM_CLUBE_NEC)); of.need = [l[0], l[1]]; of.sabe = {}; of.nao = {}; of.conf = Math.round(40 + a.rep * 0.3); }
  a.acoes--; const v = { pac: 4, falas: new Set() }, clube = of.clube, base = agmSalarioPro(j, clube.degrau), inter = agmInteressados(j);
  const quem = agDiretor(clube), titulo = `📑 Contrato profissional de ${agPrimeiro(j)}`;
  const info = () => el('span', {}, el('b', {}, '⏳ Paciência: ' + '●'.repeat(Math.max(0, v.pac)) + '○'.repeat(Math.max(0, 4 - v.pac))), ` · salário de referência ${agFmt(base)}/semana · ${inter} outro(s) clube(s) interessado(s) (+${inter * 10} de barganha)`,
    Object.keys(of.sabe).length ? el('div', {}, '🔎 O clube quer: ' + Object.keys(of.sabe).map(n => AGM_CLUBE_NEC[n] + (n === of.need[0] ? ' (principal)' : '')).join(', ')) : '',
    Object.keys(of.nao).length ? el('div', {}, '✖️ Não liga para: ' + Object.keys(of.nao).map(n => AGM_CLUBE_NEC[n]).join(', ')) : '');
  const med = d => ({ rot: '🤝 Boa vontade do clube', v: of.conf, delta: d });
  const PERG = [['prioridade', '🎯 “Qual é a prioridade do clube nesse contrato?”', null], ['orcamento', '💲 “O orçamento está apertado?”', 'preco'], ['futuro', '📅 “Vocês pensam nele a longo prazo?”', 'longo'], ['perder', '🔒 “Vocês têm medo de perder o garoto cedo?”', 'multa']];
  const RESP = { preco: ['Muito. Salário alto, nem pensar.', 'Um pouco, tem que caber no orçamento.', 'Dinheiro não é o problema aqui.'], longo: ['Queremos ele aqui por muitos anos!', 'Seria bom um contrato mais longo.', 'Prazo tanto faz.'], multa: ['Muito! Clube grande vive rondando a nossa base.', 'Uma multa decente nos protege.', 'Se ele quiser sair, a gente conversa.'] };
  const conversa = (fala, voce, d) => {
    if (v.pac <= 0) return proposta('A conversa já foi longa. Vamos ao que interessa: qual é a proposta?');
    const ops = PERG.filter(([id, , n]) => !v.falas.has(id) && !(n && (of.sabe[n] || of.nao[n]))).map(([id, txt, n]) => ({ txt, sub: '1 de paciência', fn: () => {
      v.falas.add(id); v.pac--; let r;
      if (!n) { of.sabe[of.need[0]] = true; r = { preco: 'Sinceramente? Caber no orçamento.', longo: 'Segurar o garoto por bastante tempo.', multa: 'Não perder ele de graça para um clube rico.' }[of.need[0]]; }
      else { const k = of.need[0] === n ? 0 : of.need[1] === n ? 1 : 2; r = RESP[n][k]; if (k < 2) of.sabe[n] = true; else of.nao[n] = true; }
      of.conf = Math.min(100, of.conf + 2); conversa(r, txt, 2);
    } }));
    ops.push({ txt: '📝 Fazer a proposta', cls: 'amarelo', fn: () => proposta() }, { txt: '🚪 Pensar e voltar outra hora', cls: 'cinza', fn: () => { salvar(); abreAgencia3('jogadores'); } });
    agDialogo({ titulo, quem, voce, txt: fala, info: info(), medidor: med(d), ops });
  };
  const proposta = (pedido) => {
    const T = v.T || { pct: 100, anos: 3, multa: 'media' };
    const sP = el('select', {}, ...[70, 85, 100, 120, 150, 200].map(p => el('option', { value: p, selected: p === T.pct ? 'selected' : null }, `${agFmt(base * p / 100)}/semana (${p}%)`)));
    const sA = el('select', {}, ...[1, 2, 3, 4, 5].map(n => el('option', { value: n, selected: n === T.anos ? 'selected' : null }, `${n} ano${n > 1 ? 's' : ''}`)));
    const sM = el('select', {}, ...[['baixa', 'baixa (fácil sair)'], ['media', 'média'], ['alta', 'alta (difícil sair)']].map(([k, t]) => el('option', { value: k, selected: k === T.multa ? 'selected' : null }, t)));
    const linha = (rot, ctl, dica) => el('label', { class: 'agm-termo' }, el('span', {}, rot), ctl, el('small', {}, dica));
    abreModal.largo = true;
    abreModal(el('h2', {}, `📝 Proposta ao ${clube.nome}`), el('p', {}, info()), pedido ? el('p', { class: 'dica' }, pedido) : '',
      el('div', { class: 'agm-termos' }, linha('💵 Salário', sP, `Sua comissão: ${j.contrato ? j.contrato.comissao : 10}% do salário, toda semana`), linha('📅 Duração', sA, '4 anos ou mais agrada quem quer contrato longo'),
        linha('🔒 Multa rescisória', sM, 'Alta agrada quem tem medo de perder o garoto (mas dificulta vendê-lo depois)')),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => { v.T = { pct: +sP.value, anos: +sA.value, multa: sM.value }; avalia(v.T); } }, '🤝 Apresentar a proposta'),
        el('button', { class: 'btn', type: 'button', onclick: () => conversa('Pode perguntar.', null, 0) }, '↩ Voltar à conversa')));
  };
  const avalia = T => {
    const atende = { preco: T.pct <= 85, longo: T.anos >= 4, multa: T.multa === 'alta' }, peso = n => n === of.need[0] ? 2 : n === of.need[1] ? 1 : 0;
    let nota = of.conf + inter * 10 - Math.max(0, T.pct - 100) * 0.4; for (const n of Object.keys(atende)) if (atende[n]) nota += peso(n) * 10;
    nota = Math.round(nota); const voce = `📝 ${agFmt(base * T.pct / 100)}/semana, ${T.anos} ano(s), multa ${T.multa}`;
    if (nota > 70) {
      const sal = Math.round(base * T.pct / 100); j.fase = 'carreira'; j.clube = { ...clube, tipo: 'pro', pais: clube.pais || 'Brasil', nivel: AGM_DEGRAU_CLUBE[clube.degrau] };
      j.pro = { salario: sal, anos: T.anos, ateSemana: a.semana + T.anos * 52, multa: T.multa, desde: a.semana }; j.ofertaPro = null;
      a.marcos.contratos++; agmGanhaRep(a, AGM_REP_GANHO.contratoPro); agmLembranca(a, 'lemb_contrato'); agmHist(j, `virou profissional no ${clube.nome} (${agFmt(sal)}/semana, ${T.anos} anos)`);
      salvar(); try { if (typeof agCelebra === 'function') agCelebra('contrato', `📑 ${j.nome} virou PROFISSIONAL!`, `Contrato de ${T.anos} anos com o ${clube.nome}: ${agFmt(sal)} por semana. Sua comissão: ${agFmt(sal * (j.contrato ? j.contrato.comissao : 10) / 100)} por semana.`, 'confete', j); } catch (e) { }
      return agDialogo({ titulo, quem, voce, txt: 'Negócio fechado! Bem-vindo ao time profissional.', info: `Comissão de ${j.contrato ? j.contrato.comissao : 10}% sobre o salário, toda semana · reputação +${AGM_REP_GANHO.contratoPro}`, ops: [{ txt: '👤 Ver meus jogadores', cls: 'amarelo', fn: () => abreAgencia3('jogadores') }] });
    }
    const falta = !atende[of.need[0]] ? { preco: 'esse salário não cabe no orçamento', longo: 'queremos um contrato mais longo', multa: 'precisamos de uma multa alta' }[of.need[0]] : !atende[of.need[1]] ? { preco: 'o salário está salgado', longo: 'um ano a mais ajudaria', multa: 'a multa podia ser maior' }[of.need[1]] : 'o salário está acima do que pagamos';
    if (nota >= 50 && !v.revisou) { v.revisou = true; return agDialogo({ titulo, quem, voce, txt: `Quase. Mas ${falta}.`, info: info(), medidor: med(), ops: [{ txt: '📝 Ajustar a proposta', cls: 'amarelo', fn: () => proposta(`O clube pediu: ${falta}.`) }, { txt: '🚪 Voltar outra hora', cls: 'cinza', fn: () => { salvar(); abreAgencia3('jogadores'); } }] }); }
    of.conf = Math.max(0, of.conf - 10); salvar();
    agDialogo({ titulo, quem, voce, txt: `Assim não dá: ${falta}. Pense melhor e volte.`, info: `A oferta continua até a semana ${of.ate}. (Boa vontade do clube −10.)`, medidor: med(-10), ops: [{ txt: '↩ Voltar para a agência', fn: () => abreAgencia3('jogadores') }] });
  };
  conversa(`${agPrimeiro(j)} fez 17 anos e já está pronto. O ${clube.nome} quer fazer o primeiro contrato profissional. Vamos conversar?`, null, 0);
}

/* ---------- 2) propostas de transferência: negociar com o diretor ---------- */
function agmNegociaTransf(j, p) {
  const a = agDados(), base = p.valor, teto = base * 1.6, pacMax = 3 + (a.nivel >= 4 ? 1 : 0); let atual = base, pac = pacMax; const usadas = new Set();
  const quem = agDiretor(p.clube), titulo = `💼 ${p.clube.nome} (${p.clube.pais}) quer ${agPrimeiro(j)}`, inter = agmInteressados(j) - 1, esperado = agmOvrClube(p.clube.nivel);
  const T = [
    { id: 'numeros', txt: '📊 Mostrar os números em campo', ch: () => 45 + (agmOverall(j) - esperado) * 8, sobe: [0.08, 0.14], ok: 'Os números são bons mesmo.', nao: 'Números eu também tenho. Não me impressionou.' },
    { id: 'vis', txt: '👁️ Mostrar quanto ele aparece (visibilidade)', ch: () => 20 + j.visib * 0.6, sobe: [0.06, 0.12], ok: 'É, todo mundo está falando dele.', nao: 'Pouca gente conhece esse menino ainda.' },
    { id: 'blefe', txt: `📞 “Tem ${inter > 0 ? `mais ${inter} clube(s)` : 'outro clube'} interessado...”`, sub: inter > 0 ? 'é verdade: chance maior' : '🎲 blefe: se falhar, a paciência cai mais', ch: () => inter > 0 ? 50 + inter * 10 : 25 + a.nivel * 6, sobe: [0.12, 0.2], pac: inter > 0 ? 1 : 2, ok: 'Outros?! Calma, vamos melhorar a proposta.', nao: 'Então pode ligar para eles. Não gosto de blefe!' },
    { id: 'parceria', txt: '🤝 Propor uma parceria (prioridade nos próximos craques)', ch: () => 72, sobe: [0.03, 0.06], ok: 'Parceria me interessa. Dá para melhorar um pouco.', nao: 'Parceria é bom, mas o orçamento é curto.' },
  ];
  const taxa = agmTaxaTransf(a), valTxt = x => `${agFmt(x)} (sua taxa de ${taxa}%: ${agFmt(x * taxa / 100)})`;
  const rodada = (fala, voce, d) => {
    const ultima = pac <= 0 || T.every(t => usadas.has(t.id));
    const ops = ultima ? [] : T.filter(t => !usadas.has(t.id)).map(t => ({ txt: t.txt, sub: t.sub, fn: () => { usadas.add(t.id); const ok = agSorte(clamp(t.ch(), 5, 92)), p0 = pac; if (ok) { atual = Math.min(teto, Math.round(atual * (1 + agRnd(t.sobe[0], t.sobe[1])))); pac--; } else pac -= t.pac || 1; pac = Math.max(0, pac); rodada(ok ? `${t.ok} Posso chegar a ${agFmt(atual)}.` : t.nao, t.txt, pac - p0); } }));
    ops.push({ txt: `✅ Vender: ${agFmt(atual)}`, cls: 'amarelo', fn: () => { agmVende(j, p, atual); } }, { txt: '❌ Recusar', cls: 'cinza', fn: () => { j.propostas = (j.propostas || []).filter(x => x !== p); salvar(); abreAgencia3('jogadores'); } });
    agDialogo({ titulo, quem, voce, txt: ultima ? `${fala ? fala + ' ' : ''}Última oferta: ${agFmt(atual)}. Pegar ou largar.` : fala, info: el('span', {}, el('b', {}, `Oferta: ${valTxt(atual)}`), atual > base ? el('small', { class: 'agc-up' }, ` ▲ +${Math.round((atual / base - 1) * 100)}%`) : '', el('div', {}, `Valor de mercado estimado: ${agFmt(agmValor(j))}`)),
      medidor: { rot: '⏳ Paciência do diretor', v: pac / pacMax * 100, delta: d }, ops });
  };
  rodada(`Queremos ${agPrimeiro(j)} no ${p.clube.nome}. Oferecemos ${agFmt(base)}. Proposta justa, não acha?`);
}
function agmVende(j, p, valor) {
  const a = agDados(), s = G.save, taxa = agmTaxaTransf(a), com = Math.round(valor * taxa / 100), europa = p.clube.nivel >= 4, fora = p.clube.pais !== 'Brasil';
  s.ouro += com; a.totais.transf += valor; a.totais.comissao += com; a.totais.vendaMax = Math.max(a.totais.vendaMax, valor); j.vendaMax = Math.max(j.vendaMax || 0, valor);
  a.marcos.transf++; if (fora) { a.marcos.fora++; (a.paises = a.paises || {})[p.clube.pais] = 1; agmLembranca(a, 'lemb_camisa'); }
  agmGanhaRep(a, clamp(AGM_REP_GANHO.vendaMin + valor / 5e6, AGM_REP_GANHO.vendaMin, AGM_REP_GANHO.vendaMax));
  j.clube = { ...p.clube }; j.pro = { salario: Math.round(AGM_SAL_BASE.grande * (1 + p.clube.nivel) * Math.max(0.6, 1 + (agmOverall(j) - 12) * 0.12)), anos: 4, ateSemana: a.semana + 208, multa: 'media', desde: a.semana };
  j.propostas = []; j.visib = Math.min(100, j.visib + 10); agmHist(j, `vendid${agmO(j)} ao ${p.clube.nome} (${p.clube.pais}) por ${agFmt(valor)}`);
  try { som('moeda'); banner('💼 TRANSFERÊNCIA!', `${j.nome} → ${p.clube.nome}`); } catch (e) { }
  if (europa) return agmViraLenda(j, p, valor, com);
  salvar(); try { if (typeof agCelebra === 'function') agCelebra('transferencia', `💼 ${j.nome} → ${p.clube.nome}!`, `Venda de ${agFmt(valor)}. Sua taxa (${taxa}%): ${agFmt(com)} tostões.`, 'moedas', j); } catch (e) { }
  log(`💼 ${j.nome} vendid${agmO(j)} ao ${p.clube.nome} por ${agFmt(valor)}. Sua taxa: ${agFmt(com)}.`, 'l-loot'); abreAgencia3('jogadores');
}
// o clímax: da várzea até a Europa — vira Lenda da agência e sai do calendário (libera a vaga)
function agmViraLenda(j, p, valor, com) {
  const a = agDados(); a.jogadores.splice(a.jogadores.indexOf(j), 1); a.rotina = (a.rotina || []).filter(r => r.jog !== j.id);
  const L = { id: j.id, nome: j.nome, pos: j.pos, ovr: agmOverall(j), venda: valor, clube: p.clube.nome, pais: p.clube.pais, look: { ...j.look, alt: 1.74 }, semana: a.semana, regiao: j.regiao };
  a.lendas.push(L); j.ovr = L.ovr; agHall(j, `🌟 Lenda da agência: ${p.clube.nome} (${p.clube.pais})`);
  agmLembranca(a, 'lemb_lenda'); if (typeof agmTitulosV3 === 'function') agmTitulosV3(a);
  if (typeof agmEscritorioLendas === 'function') agmEscritorioLendas();
  salvar();
  try { if (typeof agCelebra === 'function') agCelebra('superagente', `🌟 ${j.nome}: LENDA DA AGÊNCIA!`, `Da ${AGM_REGIOES[j.regiao] ? AGM_REGIOES[j.regiao][0].replace(/^\S+\s/, '').toLowerCase() : 'várzea'} até o ${p.clube.nome}, na ${p.clube.pais}, por ${agFmt(valor)}! Sua taxa: ${agFmt(com)}. Agora ${agmEle(j)} visita o seu escritório de vez em quando.`, 'confete', j); } catch (e) { }
  log(`🌟 ${j.nome} virou LENDA DA AGÊNCIA: vendid${agmO(j)} ao ${p.clube.nome} (${p.clube.pais}) por ${agFmt(valor)}!`, 'l-lvl'); abreAgencia3('agencia');
}

/* ---------- 3) patrocínios ---------- */
function agmAceitaPatro(j, of, pct) {
  const a = agDados(); j.ofertasPatro = (j.ofertasPatro || []).filter(x => x !== of);
  if (pct > 10 && Math.random() < 0.5) { log(`📣 A ${of.marca} achou caro e desistiu.`, 'l-sis'); salvar(); abreAgencia3('jogadores'); return; }
  const P = AGM_PATROCINIOS[of.tier]; j.patrocinios.push({ marca: of.marca, tier: of.tier, pagto: of.pagto, pct, cada: P[3], prox: a.semana + P[3], falhas: 0, polemica: of.polemica });
  a.marcos.patroc++; agmLembranca(a, 'lemb_patrocinio'); agmHist(j, `patrocínio: ${of.marca}`);
  if (of.polemica && j.fam && j.fam.need.includes('seguranca')) { j.confianca = Math.max(0, j.confianca - 15); log(`😠 A família de ${agPrimeiro(j)} não gostou da marca (${of.marca}): confiança −15.`, 'l-sis'); }
  try { if (typeof agCelebra === 'function') agCelebra('patrocinio', `📣 ${j.nome} é garot${agmO(j)}-propaganda!`, `${of.marca}: ${of.pagto ? agFmt(of.pagto) + '/semana' : 'chuteiras e material'} · sua parte ${pct}%. Obrigação: 1 ação a cada ${P[3]} semana(s).`, 'flash', j); } catch (e) { }
  salvar(); abreAgencia3('jogadores');
}

/* ---------- 4) cartas de carreira ---------- */
const agmJ = (a, d) => a.jogadores.find(x => x.id === d.jog);
Object.assign(AGM_CARTAS, {
  renovacao: { titulo: '📑 Renovação de contrato',
    txt: (a, d) => { const j = agmJ(a, d); return j ? `O contrato de ${j.nome} com o ${j.clube && j.clube.nome} acaba na semana ${j.pro && j.pro.ateSemana}. O clube oferece renovar com 10% de aumento.` : 'Jogador saiu.'; },
    ops: [['✅ Renovar agora (+10%)', (a, d) => { const j = agmJ(a, d); if (!j || !j.pro) return 'Sem efeito.'; j.pro.salario = Math.round(j.pro.salario * 1.1); j.pro.ateSemana = a.semana + 156; return `${j.nome} renovou por 3 anos: ${agFmt(j.pro.salario)}/semana.`; }],
      ['⏳ Esperar uma proposta melhor', (a, d) => { const j = agmJ(a, d); if (!j || !j.pro) return 'Sem efeito.'; if (Math.random() < 0.5) { j.pro.salario = Math.round(j.pro.salario * 1.25); j.pro.ateSemana = a.semana + 156; return `Valeu a pena: o clube subiu para 25% de aumento! (${agFmt(j.pro.salario)}/semana)`; } j.semClubeEm = j.pro.ateSemana; return `O clube não melhorou. ${j.nome} fica livre quando o contrato acabar — e aí chovem propostas (ou não).`; }]],
    padrao: (a, d) => AGM_CARTAS.renovacao.ops[0][1](a, d) },
  emprestimo: { titulo: '🔁 Empréstimo para ganhar minutos',
    txt: (a, d) => { const j = agmJ(a, d); return j ? `${j.nome} quase não joga no ${j.clube && j.clube.nome} (forma ${Math.round(j.estado.forma)}). Um clube menor quer ${agmEle(j)} emprestad${agmO(j)} por 6 meses.` : 'Jogador saiu.'; },
    ops: [['✈️ Emprestar (forma e visibilidade sobem)', (a, d) => { const j = agmJ(a, d); if (!j) return '—'; j.estado.forma = Math.min(100, j.estado.forma + 25); j.visib = Math.min(100, j.visib + 6); j.estado.moral = Math.min(100, j.estado.moral + 5); return `${j.nome} foi emprestad${agmO(j)} e está jogando todo fim de semana!`; }],
      ['💪 Ficar e brigar pela vaga', (a, d) => { const j = agmJ(a, d); if (!j) return '—'; if (j.pers.disciplina >= 60 || Math.random() < 0.4) { j.estado.forma = Math.min(100, j.estado.forma + 15); return `${j.nome} treinou dobrado e ganhou a vaga!`; } j.estado.moral = Math.max(0, j.estado.moral - 10); return `${j.nome} continua no banco e ficou desanimad${agmO(j)}.`; }]],
    padrao: (a, d) => AGM_CARTAS.emprestimo.ops[1][1](a, d) },
  convocacao: { titulo: '🇧🇷 Convocação para a seleção de base',
    txt: (a, d) => { const j = agmJ(a, d); return j ? `${j.nome} foi convocad${agmO(j)} para a seleção de base! O clube pergunta se libera.` : 'Jogador saiu.'; },
    ops: [['✅ Liberar (visibilidade +10, reputação +1)', (a, d) => { const j = agmJ(a, d); if (!j) return '—'; j.visib = Math.min(100, j.visib + 10); j.estado.fadiga = Math.min(100, j.estado.fadiga + 15); agmGanhaRep(a, 1); agmHist(j, 'convocad' + agmO(j) + ' para a seleção de base'); return `${j.nome} vestiu a camisa da seleção de base!`; }],
      ['🙅 Pedir dispensa', (a, d) => { const j = agmJ(a, d); if (j) j.estado.moral = Math.max(0, j.estado.moral - 5); return 'Dispensa pedida. Ficou chateado(a).'; }]],
    padrao: (a, d) => AGM_CARTAS.convocacao.ops[0][1](a, d) },
});

/* ---------- 5) toda semana ---------- */
AGM_GANCHOS_SEMANA.push(function (a, lin) {
  const s = G.save;
  for (const j of a.jogadores.slice()) {
    // a) aos 17, o clube de base oferece o contrato profissional
    if (j.fase === 'desenvolvimento' && j.clube && j.clube.tipo === 'base' && agmIdade(j) >= 17 && (!j.ofertaPro || j.ofertaPro.ate < a.semana)) {
      if (j.ofertaPro && j.ofertaPro.ate < a.semana) { lin(`⌛ A oferta de contrato profissional do ${j.ofertaPro.clube.nome} para ${j.nome} venceu. Outra vem em breve.`, 1, j.id); }
      j.ofertaPro = { clube: { ...j.clube }, ate: a.semana + 6 }; lin(`📑 O ${j.clube.nome} quer fazer o PRIMEIRO CONTRATO PROFISSIONAL de ${j.nome}! Negocie na aba 👤 Jogadores (até a semana ${a.semana + 6}).`, 1, j.id);
    }
    if (j.fase !== 'carreira') continue;
    // b) salário → comissão da agência
    if (j.pro && j.clube) { const c = Math.round(j.pro.salario * ((j.contrato && j.contrato.comissao) || 10) / 100); s.ouro += c; a.totais.comissao += c; }
    // c) jogando, aparece
    if (j.clube && j.estado.forma > 50) j.visib = Math.min(100, j.visib + 0.5);
    // d) fim de contrato
    if (j.pro && j.clube) {
      if (a.semana >= j.pro.ateSemana - 8 && a.semana < j.pro.ateSemana && !j.semClubeEm && !(a.cartas || []).some(c => c.tipo === 'renovacao' && c.dados.jog === j.id)) agmCarta(a, 'renovacao', { jog: j.id }, lin);
      if (a.semana >= j.pro.ateSemana) { lin(`📭 O contrato de ${j.nome} com o ${j.clube.nome} acabou: ${agmEle(j)} está livre no mercado.`, 1, j.id); j.clube = null; j.pro = null; j.semClubeEm = null; }
    }
    // e) propostas de transferência (sem clube chovem mais)
    j.propostas = (j.propostas || []).filter(p => p.ate >= a.semana);
    const chance = (j.clube ? 0.04 : 0.25) + j.visib / 1000;
    if (j.propostas.length < 2 && Math.random() < chance) {
      const ovr = agmOverall(j), atual = j.clube ? (j.clube.nivel || 0) : -1;
      // v344: o degrau vem do overall (a Europa pede overall 14,5+, visibilidade 80+ e 18 anos); subir um degrau a mais só até 1 acima do que o overall sustenta
      const nvOvr = ovr >= 14.5 && j.visib >= 80 && agmIdade(j) >= 18 ? 4 : ovr >= 13.5 ? 3 : ovr >= 11.5 ? 2 : ovr >= 10 ? 1 : 0;
      let nv = Math.max(nvOvr, Math.min(nvOvr + 1, 3, atual + (Math.random() < 0.3 ? 1 : 0)));
      if (nv >= atual) { const clube = agmClubePro(nv); if (!j.clube || clube.nome !== j.clube.nome) { const valor = Math.round(agmValor(j) * agRnd(0.8, 1.1) * (j.clube ? (j.pro && j.pro.multa === 'alta' ? 1.3 : j.pro && j.pro.multa === 'baixa' ? 0.85 : 1) : 0.5));
        j.propostas.push({ clube, valor, ate: a.semana + 4 }); lin(`📩 ${nv >= 4 ? '🌍 DA EUROPA! ' : ''}O ${clube.nome} (${clube.pais}) quer ${j.nome}: ${agFmt(valor)}.`, 1, j.id); } }
    }
    // f) patrocínios: ofertas, pagamento e obrigação (1 ação a cada N semanas)
    j.ofertasPatro = (j.ofertasPatro || []).filter(o => o.ate >= a.semana);
    const tier = ['global', 'nacional', 'regional', 'loja'].find(t => j.visib >= AGM_PATROCINIOS[t][1] && !j.patrocinios.some(p => p.tier === t));
    if (tier && j.patrocinios.length < 2 && !j.ofertasPatro.length && Math.random() < 0.1) {
      const pol = tier !== 'loja' && Math.random() < 0.25, P = AGM_PATROCINIOS[tier];
      const of = { tier, marca: pol ? agPega(AGM_PATRO_POLEMICAS) : agPega(AGM_PATRO_MARCAS[tier]), pagto: P[2] * (pol ? 2 : 1), polemica: pol, ate: a.semana + 4 };
      j.ofertasPatro.push(of); lin(`📣 Patrocínio! ${of.marca} quer ${j.nome} (${P[0]}): ${of.pagto ? agFmt(of.pagto) + '/semana' : 'chuteiras e material'}.`, 1, j.id);
    }
    for (const p of j.patrocinios.slice()) {
      if (p.pagto) { const parte = Math.round(p.pagto * p.pct / 100); s.ouro += parte; a.totais.comissao += parte; } else j.estado.forma = Math.min(100, j.estado.forma + 1);
      if (a.semana >= p.prox) {
        if (a.acoes > 0) { a.acoes--; p.prox = a.semana + p.cada; p.falhas = 0; lin(`📸 ${j.nome} gravou a propaganda da ${p.marca} (1 ação desta semana).`, 0, j.id); }
        else { p.falhas++; p.prox = a.semana + 1; if (p.falhas >= 2) { j.patrocinios.splice(j.patrocinios.indexOf(p), 1); lin(`❌ A ${p.marca} cancelou o patrocínio de ${j.nome}: faltou ação para as obrigações.`, 1, j.id); } }
      }
    }
    // g) decisões de carreira (cartas)
    const tem = t => (a.cartas || []).some(c => c.tipo === t && c.dados.jog === j.id);
    if (j.clube && j.estado.forma < 45 && !tem('emprestimo') && Math.random() < 0.06) agmCarta(a, 'emprestimo', { jog: j.id }, lin);
    if (agmIdade(j) <= 20 && j.visib >= 50 && !tem('convocacao') && Math.random() < 0.05) agmCarta(a, 'convocacao', { jog: j.id }, lin);
    // h) aposentadoria
    if (agmIdade(j) >= 35) { j.ovr = agmOverall(j); agHall(j, 'aposentou-se'); a.jogadores.splice(a.jogadores.indexOf(j), 1); lin(`👋 ${j.nome} pendurou as chuteiras. Obrigado por tudo, craque!`, 1); }
  }
});

/* ---------- 6) na ficha do jogador ---------- */
{
  const _clubeEl = agmClubeEl;
  agmClubeEl = function (j) {
    const box = _clubeEl.apply(this, arguments), a = agDados(), s = G.save;
    if (j.ofertaPro && j.fase === 'desenvolvimento') box.append(el('button', { class: 'btn amarelo mini', type: 'button', disabled: a.acoes ? null : 'disabled', onclick: () => agmNegociaPro(j) }, `📑 Negociar o contrato profissional com o ${j.ofertaPro.clube.nome} (1 ação · até a semana ${j.ofertaPro.ate})`));
    if (j.fase === 'carreira') {
      const com = j.pro ? Math.round(j.pro.salario * ((j.contrato && j.contrato.comissao) || 10) / 100) : 0;
      box.append(el('small', { class: 'agm-pro' }, j.clube && j.pro ? `⚽ Profissional no ${j.clube.nome} (${j.clube.pais || 'Brasil'}) · salário ${agFmt(j.pro.salario)}/semana · sua comissão ${agFmt(com)}/semana · contrato até a semana ${j.pro.ateSemana} · multa ${j.pro.multa}` : '📭 Sem clube: livre no mercado (as propostas chegam mais rápido)'),
        el('small', {}, `💰 Valor de mercado: ${agFmt(agmValor(j))}${j.patrocinios.length ? ' · 📣 ' + j.patrocinios.map(p => `${p.marca} (${p.pct}%, próxima ação na semana ${p.prox})`).join(', ') : ''}`));
    }
    for (const p of j.propostas || []) box.append(el('div', { class: 'agm-proposta' }, el('b', {}, `${p.clube.nivel >= 4 ? '🌍 ' : '📩 '}${p.clube.nome} (${p.clube.pais}) oferece ${agFmt(p.valor)} · até a semana ${p.ate}`),
      el('div', { class: 'ag-acoes' }, el('button', { class: 'btn amarelo mini', type: 'button', onclick: () => agmNegociaTransf(j, p) }, '💬 Negociar com o diretor'),
        el('button', { class: 'btn mini', type: 'button', onclick: () => agmVende(j, p, p.valor) }, '✅ Vender como está'),
        el('button', { class: 'btn mini', type: 'button', onclick: () => { j.propostas = j.propostas.filter(x => x !== p); salvar(); abreAgencia3('jogadores'); } }, '❌ Recusar'))));
    for (const o of j.ofertasPatro || []) box.append(el('div', { class: 'agm-proposta' }, el('b', {}, `📣 ${o.marca} · ${AGM_PATROCINIOS[o.tier][0]} · ${o.pagto ? agFmt(o.pagto) + '/semana' : 'chuteiras e material'}${o.polemica ? ' · ⚠️ marca polêmica: paga o dobro, mas faz bem para a saúde e para a torcida?' : ''} · até a semana ${o.ate}`),
      el('small', {}, `Obrigação: 1 ação a cada ${AGM_PATROCINIOS[o.tier][3]} semana(s).${o.polemica && j.fam && j.fam.sabe && j.fam.sabe.seguranca ? ' A família, que preza Segurança, não vai gostar (−15 de confiança).' : ''}`),
      el('div', { class: 'ag-acoes' }, el('button', { class: 'btn amarelo mini', type: 'button', onclick: () => agmAceitaPatro(j, o, 10) }, '✅ Aceitar (sua parte: 10%)'),
        el('button', { class: 'btn mini', type: 'button', onclick: () => agmAceitaPatro(j, o, 20) }, '💬 Pedir 20% (podem desistir)'),
        el('button', { class: 'btn mini', type: 'button', onclick: () => { j.ofertasPatro = j.ofertasPatro.filter(x => x !== o); salvar(); abreAgencia3('jogadores'); } }, '❌ Recusar'))));
    return box;
  };
}
{
  const st = document.createElement('style');
  st.textContent = `
  .agm-pro { font-weight: 700; color: #1a5a2a; }
  .agm-proposta { background: #eef6ff; border: 1px solid #a8c8e8; border-radius: 10px; padding: 5px 8px; margin: 3px 0; }
  .agm-proposta b { font-size: 13px; }
  `;
  document.head.append(st);
}
