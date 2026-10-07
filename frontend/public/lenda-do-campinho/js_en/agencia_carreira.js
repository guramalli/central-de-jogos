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
const AGM_PATRO_MARCAS = { loja: ['Seu Bené’s Shop', 'Corner Sports', 'Goal Cleats'], regional: ['Goal Soda', 'Star Snacks', 'Lightning Sports Drink'], nacional: ['Rocket Cleats', 'Dribble Phone', 'Golden Ball Bank'], global: ['High Jump World Sneakers', 'Galaxy Sports', 'Planet Ball'] };
// v407 (Raio-X U2): o dono trocou aposta e cerveja por marcas que uma criança entende — a "polêmica" agora é
// se a marca faz bem para a saúde do jogador e o que a torcida pensa (famílias de Segurança continuam não gostando).
const AGM_PATRO_POLEMICAS = ['🥤 Mega Sugar Soda (a super sweet soda)', '📱 Thousand Ads Game (a phone game full of ads)'];
const AGM_LEMBRANCAS = {
  lemb_contrato: { nome: 'First Pro Contract (framed)', tipo: 'loot', venda: 1, desc: 'A keepsake from your agency: the first pro contract of one of your kids. Don’t sell it!', iconeBase: 'i_contrato' },
  lemb_patrocinio: { nome: 'First Sponsor’s Cleats', tipo: 'loot', venda: 1, desc: 'A keepsake from your agency: the cleats from the first sponsorship. Don’t sell them!', iconeBase: 'i_chuteira_elite' },
  lemb_camisa: { nome: 'Signed Jersey from the First International Sale', tipo: 'loot', venda: 1, desc: 'A keepsake from your agency: signed by the first star you sold abroad.', iconeBase: 'i_camisa_lenda' },
  lemb_lenda: { nome: 'Agency Golden Ball', tipo: 'loot', venda: 1, desc: 'A keepsake from your agency: the first Legend you developed, from the sandlot all the way to Europe.', iconeBase: 'i_bola_ouro' },
};
for (const [id, it] of Object.entries(AGM_LEMBRANCAS)) if (!ITENS[id]) ITENS[id] = it;
function agmLembranca(a, id, lin) { if ((a.lembrancas = a.lembrancas || {})[id]) return; a.lembrancas[id] = a.semana; try { recebeItem(id, 1); } catch (e) { } const t = `🎁 A keepsake for your storage: ${AGM_LEMBRANCAS[id].nome}!`; if (lin) lin(t, 1); else log(t, 'l-loot'); }
const agmTaxaTransf = a => 5 + Math.round(a.rep / 20); // 5% a 10%, pela reputação
function agmSalarioPro(j, degrau) { return Math.round(AGM_SAL_BASE[degrau || 'pequeno'] * Math.max(0.6, 1 + (agmOverall(j) - 10) * 0.12)); }
function agmInteressados(j) { return (j.convites || []).length + (j.propostas || []).length + (j.sondagemExterior ? 1 : 0) + (j.visib >= 60 ? 1 : 0); }
// clubes profissionais (inventados) por degrau 0–4: 0–2 Brasil, 3 América do Sul, 4 Europa
function agmClubePro(nv) { const c = AG_CLUBES[clamp(nv, 0, 4)], [nome, pais, cor] = agPega(c.nomes); return { nome, pais, cor, nivel: c.nivel, tipo: 'pro', degrau: nv >= 2 ? 'grande' : nv === 1 ? 'medio' : 'pequeno' }; }
const agmOvrClube = nv => AG_CLUBES[clamp(nv, 0, 4)].ovr / 5; // o "overall" que o clube espera, na escala 1–20

/* ---------- 1) o primeiro contrato profissional: negociar com o clube ---------- */
const AGM_CLUBE_NEC = { preco: '💲 Low price', longo: '📅 Long contract', multa: '🔒 High release clause' };
function agmNegociaPro(j) {
  const a = agDados(), of = j.ofertaPro; if (!of) return;
  if (a.acoes <= 0) { log('Negotiating the contract uses 1 action this week — you’re out of actions.', 'l-sis'); return; }
  if (!of.need) { const l = agEmbM(Object.keys(AGM_CLUBE_NEC)); of.need = [l[0], l[1]]; of.sabe = {}; of.nao = {}; of.conf = Math.round(40 + a.rep * 0.3); }
  a.acoes--; const v = { pac: 4, falas: new Set() }, clube = of.clube, base = agmSalarioPro(j, clube.degrau), inter = agmInteressados(j);
  const quem = agDiretor(clube), titulo = `📑 Pro contract for ${agPrimeiro(j)}`;
  const info = () => el('span', {}, el('b', {}, '⏳ Patience: ' + '●'.repeat(Math.max(0, v.pac)) + '○'.repeat(Math.max(0, 4 - v.pac))), ` · reference salary ${agFmt(base)}/week · ${inter} other club(s) interested (+${inter * 10} bargaining power)`,
    Object.keys(of.sabe).length ? el('div', {}, '🔎 The club wants: ' + Object.keys(of.sabe).map(n => AGM_CLUBE_NEC[n] + (n === of.need[0] ? ' (main)' : '')).join(', ')) : '',
    Object.keys(of.nao).length ? el('div', {}, '✖️ Doesn’t care about: ' + Object.keys(of.nao).map(n => AGM_CLUBE_NEC[n]).join(', ')) : '');
  const med = d => ({ rot: '🤝 Club goodwill', v: of.conf, delta: d });
  const PERG = [['prioridade', '🎯 “What’s the club’s priority in this contract?”', null], ['orcamento', '💲 “Is the budget tight?”', 'preco'], ['futuro', '📅 “Are you thinking long-term with this kid?”', 'longo'], ['perder', '🔒 “Are you afraid of losing the kid too early?”', 'multa']];
  const RESP = { preco: ['Very. A high salary is out of the question.', 'A little, it has to fit the budget.', 'Money isn’t the problem here.'], longo: ['We want this kid here for many years!', 'A longer contract would be nice.', 'The length doesn’t really matter.'], multa: ['Very! Big clubs are always circling our youth academy.', 'A decent release clause protects us.', 'If the kid wants to leave, we’ll talk.'] };
  const conversa = (fala, voce, d) => {
    if (v.pac <= 0) return proposta('This chat has gone on long enough. Let’s get down to business: what’s your offer?');
    const ops = PERG.filter(([id, , n]) => !v.falas.has(id) && !(n && (of.sabe[n] || of.nao[n]))).map(([id, txt, n]) => ({ txt, sub: '1 patience', fn: () => {
      v.falas.add(id); v.pac--; let r;
      if (!n) { of.sabe[of.need[0]] = true; r = { preco: 'Honestly? Fitting the budget.', longo: 'Keeping the kid for a long time.', multa: 'Not losing the kid for free to a rich club.' }[of.need[0]]; }
      else { const k = of.need[0] === n ? 0 : of.need[1] === n ? 1 : 2; r = RESP[n][k]; if (k < 2) of.sabe[n] = true; else of.nao[n] = true; }
      of.conf = Math.min(100, of.conf + 2); conversa(r, txt, 2);
    } }));
    ops.push({ txt: '📝 Make the offer', cls: 'amarelo', fn: () => proposta() }, { txt: '🚪 Think it over and come back later', cls: 'cinza', fn: () => { salvar(); abreAgencia3('jogadores'); } });
    agDialogo({ titulo, quem, voce, txt: fala, info: info(), medidor: med(d), ops });
  };
  const proposta = (pedido) => {
    const T = v.T || { pct: 100, anos: 3, multa: 'media' };
    const sP = el('select', {}, ...[70, 85, 100, 120, 150, 200].map(p => el('option', { value: p, selected: p === T.pct ? 'selected' : null }, `${agFmt(base * p / 100)}/semana (${p}%)`)));
    const sA = el('select', {}, ...[1, 2, 3, 4, 5].map(n => el('option', { value: n, selected: n === T.anos ? 'selected' : null }, `${n} ano${n > 1 ? 's' : ''}`)));
    const sM = el('select', {}, ...[['baixa', 'low (easy to leave)'], ['media', 'medium'], ['alta', 'high (hard to leave)']].map(([k, t]) => el('option', { value: k, selected: k === T.multa ? 'selected' : null }, t)));
    const linha = (rot, ctl, dica) => el('label', { class: 'agm-termo' }, el('span', {}, rot), ctl, el('small', {}, dica));
    abreModal.largo = true;
    abreModal(el('h2', {}, `📝 Offer to ${clube.nome}`), el('p', {}, info()), pedido ? el('p', { class: 'dica' }, pedido) : '',
      el('div', { class: 'agm-termos' }, linha('💵 Salary', sP, `Your commission: ${j.contrato ? j.contrato.comissao : 10}% of the salary, every week`), linha('📅 Length', sA, '4 years or more pleases clubs that want a long contract'),
        linha('🔒 Release clause', sM, 'High pleases clubs afraid of losing the kid (but makes a sale harder later)')),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => { v.T = { pct: +sP.value, anos: +sA.value, multa: sM.value }; avalia(v.T); } }, '🤝 Present the offer'),
        el('button', { class: 'btn', type: 'button', onclick: () => conversa('Go ahead and ask.', null, 0) }, '↩ Back to the conversation')));
  };
  const avalia = T => {
    const atende = { preco: T.pct <= 85, longo: T.anos >= 4, multa: T.multa === 'alta' }, peso = n => n === of.need[0] ? 2 : n === of.need[1] ? 1 : 0;
    let nota = of.conf + inter * 10 - Math.max(0, T.pct - 100) * 0.4; for (const n of Object.keys(atende)) if (atende[n]) nota += peso(n) * 10;
    nota = Math.round(nota); const voce = `📝 ${agFmt(base * T.pct / 100)}/week, ${T.anos} year(s), clause ${T.multa}`;
    if (nota > 70) {
      const sal = Math.round(base * T.pct / 100); j.fase = 'carreira'; j.clube = { ...clube, tipo: 'pro', pais: clube.pais || 'Brazil', nivel: AGM_DEGRAU_CLUBE[clube.degrau] };
      j.pro = { salario: sal, anos: T.anos, ateSemana: a.semana + T.anos * 52, multa: T.multa, desde: a.semana }; j.ofertaPro = null;
      a.marcos.contratos++; agmGanhaRep(a, AGM_REP_GANHO.contratoPro); agmLembranca(a, 'lemb_contrato'); agmHist(j, `went pro at ${clube.nome} (${agFmt(sal)}/week, ${T.anos} years)`);
      salvar(); try { if (typeof agCelebra === 'function') agCelebra('contrato', `📑 ${j.nome} went PRO!`, `${T.anos}-year contract with ${clube.nome}: ${agFmt(sal)} per week. Your commission: ${agFmt(sal * (j.contrato ? j.contrato.comissao : 10) / 100)} per week.`, 'confete', j); } catch (e) { }
      return agDialogo({ titulo, quem, voce, txt: 'Deal! Welcome to the pro team.', info: `${j.contrato ? j.contrato.comissao : 10}% commission on the salary, every week · reputation +${AGM_REP_GANHO.contratoPro}`, ops: [{ txt: '👤 See my players', cls: 'amarelo', fn: () => abreAgencia3('jogadores') }] });
    }
    const falta = !atende[of.need[0]] ? { preco: 'this salary doesn’t fit the budget', longo: 'we want a longer contract', multa: 'we need a high release clause' }[of.need[0]] : !atende[of.need[1]] ? { preco: 'the salary is too steep', longo: 'one more year would help', multa: 'the release clause could be higher' }[of.need[1]] : 'the salary is above what we pay';
    if (nota >= 50 && !v.revisou) { v.revisou = true; return agDialogo({ titulo, quem, voce, txt: `Almost. But ${falta}.`, info: info(), medidor: med(), ops: [{ txt: '📝 Adjust the offer', cls: 'amarelo', fn: () => proposta(`The club asked: ${falta}.`) }, { txt: '🚪 Come back later', cls: 'cinza', fn: () => { salvar(); abreAgencia3('jogadores'); } }] }); }
    of.conf = Math.max(0, of.conf - 10); salvar();
    agDialogo({ titulo, quem, voce, txt: `That won’t work: ${falta}. Think it over and come back.`, info: `The offer stands until week ${of.ate}. (Club goodwill −10.)`, medidor: med(-10), ops: [{ txt: '↩ Back to the agency', fn: () => abreAgencia3('jogadores') }] });
  };
  conversa(`${agPrimeiro(j)} just turned 17 and is ready. ${clube.nome} wants to sign the first pro contract. Shall we talk?`, null, 0);
}

/* ---------- 2) propostas de transferência: negociar com o diretor ---------- */
function agmNegociaTransf(j, p) {
  const a = agDados(), base = p.valor, teto = base * 1.6, pacMax = 3 + (a.nivel >= 4 ? 1 : 0); let atual = base, pac = pacMax; const usadas = new Set();
  const quem = agDiretor(p.clube), titulo = `💼 ${p.clube.nome} (${p.clube.pais}) wants ${agPrimeiro(j)}`, inter = agmInteressados(j) - 1, esperado = agmOvrClube(p.clube.nivel);
  const T = [
    { id: 'numeros', txt: '📊 Show the on-field stats', ch: () => 45 + (agmOverall(j) - esperado) * 8, sobe: [0.08, 0.14], ok: 'The numbers really are good.', nao: 'I’ve got numbers too. Not impressed.' },
    { id: 'vis', txt: '👁️ Show how much attention the kid gets (visibility)', ch: () => 20 + j.visib * 0.6, sobe: [0.06, 0.12], ok: 'Yeah, everyone’s talking about this kid.', nao: 'Not many people know this kid yet.' },
    { id: 'blefe', txt: `📞 “We’ve got ${inter > 0 ? `${inter} more club(s)` : 'outro clube'} interested too...”`, sub: inter > 0 ? 'it’s true: better chance' : '🎲 bluff: if it fails, patience drops more', ch: () => inter > 0 ? 50 + inter * 10 : 25 + a.nivel * 6, sobe: [0.12, 0.2], pac: inter > 0 ? 1 : 2, ok: 'Others?! Easy now, let’s improve the offer.', nao: 'Then go ahead and call them. I don’t like bluffs!' },
    { id: 'parceria', txt: '🤝 Propose a partnership (first pick on your future stars)', ch: () => 72, sobe: [0.03, 0.06], ok: 'A partnership interests me. I can improve it a little.', nao: 'A partnership is nice, but the budget is short.' },
  ];
  const taxa = agmTaxaTransf(a), valTxt = x => `${agFmt(x)} (your ${taxa}% fee: ${agFmt(x * taxa / 100)})`;
  const rodada = (fala, voce, d) => {
    const ultima = pac <= 0 || T.every(t => usadas.has(t.id));
    const ops = ultima ? [] : T.filter(t => !usadas.has(t.id)).map(t => ({ txt: t.txt, sub: t.sub, fn: () => { usadas.add(t.id); const ok = agSorte(clamp(t.ch(), 5, 92)), p0 = pac; if (ok) { atual = Math.min(teto, Math.round(atual * (1 + agRnd(t.sobe[0], t.sobe[1])))); pac--; } else pac -= t.pac || 1; pac = Math.max(0, pac); rodada(ok ? `${t.ok} I can go up to ${agFmt(atual)}.` : t.nao, t.txt, pac - p0); } }));
    ops.push({ txt: `✅ Sell: ${agFmt(atual)}`, cls: 'amarelo', fn: () => { agmVende(j, p, atual); } }, { txt: '❌ Decline', cls: 'cinza', fn: () => { j.propostas = (j.propostas || []).filter(x => x !== p); salvar(); abreAgencia3('jogadores'); } });
    agDialogo({ titulo, quem, voce, txt: ultima ? `${fala ? fala + ' ' : ''}Final offer: ${agFmt(atual)}. Take it or leave it.` : fala, info: el('span', {}, el('b', {}, `Offer: ${valTxt(atual)}`), atual > base ? el('small', { class: 'agc-up' }, ` ▲ +${Math.round((atual / base - 1) * 100)}%`) : '', el('div', {}, `Estimated market value: ${agFmt(agmValor(j))}`)),
      medidor: { rot: '⏳ Director’s patience', v: pac / pacMax * 100, delta: d }, ops });
  };
  rodada(`We want ${agPrimeiro(j)} at ${p.clube.nome}. We’re offering ${agFmt(base)}. A fair offer, don’t you think?`);
}
function agmVende(j, p, valor) {
  const a = agDados(), s = G.save, taxa = agmTaxaTransf(a), com = Math.round(valor * taxa / 100), europa = p.clube.nivel >= 4, fora = p.clube.pais !== 'Brazil';
  s.ouro += com; a.totais.transf += valor; a.totais.comissao += com; a.totais.vendaMax = Math.max(a.totais.vendaMax, valor); j.vendaMax = Math.max(j.vendaMax || 0, valor);
  a.marcos.transf++; if (fora) { a.marcos.fora++; (a.paises = a.paises || {})[p.clube.pais] = 1; agmLembranca(a, 'lemb_camisa'); }
  agmGanhaRep(a, clamp(AGM_REP_GANHO.vendaMin + valor / 5e6, AGM_REP_GANHO.vendaMin, AGM_REP_GANHO.vendaMax));
  j.clube = { ...p.clube }; j.pro = { salario: Math.round(AGM_SAL_BASE.grande * (1 + p.clube.nivel) * Math.max(0.6, 1 + (agmOverall(j) - 12) * 0.12)), anos: 4, ateSemana: a.semana + 208, multa: 'media', desde: a.semana };
  j.propostas = []; j.visib = Math.min(100, j.visib + 10); agmHist(j, `sold${agmO(j)} to ${p.clube.nome} (${p.clube.pais}) for ${agFmt(valor)}`);
  try { som('moeda'); banner('💼 TRANSFER!', `${j.nome} → ${p.clube.nome}`); } catch (e) { }
  if (europa) return agmViraLenda(j, p, valor, com);
  salvar(); try { if (typeof agCelebra === 'function') agCelebra('transferencia', `💼 ${j.nome} → ${p.clube.nome}!`, `Sale of ${agFmt(valor)}. Your fee (${taxa}%): ${agFmt(com)} coins.`, 'moedas', j); } catch (e) { }
  log(`💼 ${j.nome} sold${agmO(j)} to ${p.clube.nome} for ${agFmt(valor)}. Your fee: ${agFmt(com)}.`, 'l-loot'); abreAgencia3('jogadores');
}
// o clímax: da várzea até a Europa — vira Lenda da agência e sai do calendário (libera a vaga)
function agmViraLenda(j, p, valor, com) {
  const a = agDados(); a.jogadores.splice(a.jogadores.indexOf(j), 1); a.rotina = (a.rotina || []).filter(r => r.jog !== j.id);
  const L = { id: j.id, nome: j.nome, pos: j.pos, ovr: agmOverall(j), venda: valor, clube: p.clube.nome, pais: p.clube.pais, look: { ...j.look, alt: 1.74 }, semana: a.semana, regiao: j.regiao };
  a.lendas.push(L); j.ovr = L.ovr; agHall(j, `🌟 Agency Legend: ${p.clube.nome} (${p.clube.pais})`);
  agmLembranca(a, 'lemb_lenda'); if (typeof agmTitulosV3 === 'function') agmTitulosV3(a);
  if (typeof agmEscritorioLendas === 'function') agmEscritorioLendas();
  salvar();
  try { if (typeof agCelebra === 'function') agCelebra('superagente', `🌟 ${j.nome}: AGENCY LEGEND!`, `From ${AGM_REGIOES[j.regiao] ? AGM_REGIOES[j.regiao][0].replace(/^\S+\s/, '').toLowerCase() : 'sandlot'} all the way to ${p.clube.nome} in ${p.clube.pais}, for ${agFmt(valor)}! Your fee: ${agFmt(com)}. Now ${agmEle(j)} drops by your office every now and then.`, 'confete', j); } catch (e) { }
  log(`🌟 ${j.nome} became an AGENCY LEGEND: sold${agmO(j)} to ${p.clube.nome} (${p.clube.pais}) for ${agFmt(valor)}!`, 'l-lvl'); abreAgencia3('agencia');
}

/* ---------- 3) patrocínios ---------- */
function agmAceitaPatro(j, of, pct) {
  const a = agDados(); j.ofertasPatro = (j.ofertasPatro || []).filter(x => x !== of);
  if (pct > 10 && Math.random() < 0.5) { log(`📣 ${of.marca} thought it was too expensive and backed out.`, 'l-sis'); salvar(); abreAgencia3('jogadores'); return; }
  const P = AGM_PATROCINIOS[of.tier]; j.patrocinios.push({ marca: of.marca, tier: of.tier, pagto: of.pagto, pct, cada: P[3], prox: a.semana + P[3], falhas: 0, polemica: of.polemica });
  a.marcos.patroc++; agmLembranca(a, 'lemb_patrocinio'); agmHist(j, `sponsorship: ${of.marca}`);
  if (of.polemica && j.fam && j.fam.need.includes('seguranca')) { j.confianca = Math.max(0, j.confianca - 15); log(`😠 ${agPrimeiro(j)}’s family didn’t like the brand (${of.marca}): trust −15.`, 'l-sis'); }
  try { if (typeof agCelebra === 'function') agCelebra('patrocinio', `📣 ${j.nome} is a brand ambassador${agmO(j)}!`, `${of.marca}: ${of.pagto ? agFmt(of.pagto) + '/semana' : 'cleats and gear'} · your share ${pct}%. Duty: 1 action every ${P[3]} week(s).`, 'flash', j); } catch (e) { }
  salvar(); abreAgencia3('jogadores');
}

/* ---------- 4) cartas de carreira ---------- */
const agmJ = (a, d) => a.jogadores.find(x => x.id === d.jog);
Object.assign(AGM_CARTAS, {
  renovacao: { titulo: '📑 Contract renewal',
    txt: (a, d) => { const j = agmJ(a, d); return j ? `${j.nome}’s contract with ${j.clube && j.clube.nome} ends in week ${j.pro && j.pro.ateSemana}. The club offers to renew with a 10% raise.` : 'The player has left.'; },
    ops: [['✅ Renew now (+10%)', (a, d) => { const j = agmJ(a, d); if (!j || !j.pro) return 'No effect.'; j.pro.salario = Math.round(j.pro.salario * 1.1); j.pro.ateSemana = a.semana + 156; return `${j.nome} renewed for 3 years: ${agFmt(j.pro.salario)}/week.`; }],
      ['⏳ Wait for a better offer', (a, d) => { const j = agmJ(a, d); if (!j || !j.pro) return 'No effect.'; if (Math.random() < 0.5) { j.pro.salario = Math.round(j.pro.salario * 1.25); j.pro.ateSemana = a.semana + 156; return `It paid off: the club went up to a 25% raise! (${agFmt(j.pro.salario)}/week)`; } j.semClubeEm = j.pro.ateSemana; return `The club didn’t improve the offer. ${j.nome} becomes a free agent when the contract ends — and then offers pour in (or not).`; }]],
    padrao: (a, d) => AGM_CARTAS.renovacao.ops[0][1](a, d) },
  emprestimo: { titulo: '🔁 Loan for more playing time',
    txt: (a, d) => { const j = agmJ(a, d); return j ? `${j.nome} barely plays at ${j.clube && j.clube.nome} (form ${Math.round(j.estado.forma)}). A smaller club says ${agmEle(j)} can go there on loan${agmO(j)} for 6 months.` : 'The player has left.'; },
    ops: [['✈️ Loan out (form and visibility go up)', (a, d) => { const j = agmJ(a, d); if (!j) return '—'; j.estado.forma = Math.min(100, j.estado.forma + 25); j.visib = Math.min(100, j.visib + 6); j.estado.moral = Math.min(100, j.estado.moral + 5); return `${j.nome} was loaned${agmO(j)} out and is playing every weekend!`; }],
      ['💪 Stay and fight for a spot', (a, d) => { const j = agmJ(a, d); if (!j) return '—'; if (j.pers.disciplina >= 60 || Math.random() < 0.4) { j.estado.forma = Math.min(100, j.estado.forma + 15); return `${j.nome} trained twice as hard and won the spot!`; } j.estado.moral = Math.max(0, j.estado.moral - 10); return `${j.nome} is still on the bench and feels discouraged${agmO(j)}.`; }]],
    padrao: (a, d) => AGM_CARTAS.emprestimo.ops[1][1](a, d) },
  convocacao: { titulo: '🇧🇷 Youth national team call-up',
    txt: (a, d) => { const j = agmJ(a, d); return j ? `${j.nome} was called up${agmO(j)} to the youth national team! The club asks if you’ll release the player.` : 'The player has left.'; },
    ops: [['✅ Release (visibility +10, reputation +1)', (a, d) => { const j = agmJ(a, d); if (!j) return '—'; j.visib = Math.min(100, j.visib + 10); j.estado.fadiga = Math.min(100, j.estado.fadiga + 15); agmGanhaRep(a, 1); agmHist(j, 'convocad' + agmO(j) + ' to the youth national team'); return `${j.nome} wore the youth national team jersey!`; }],
      ['🙅 Ask to be excused', (a, d) => { const j = agmJ(a, d); if (j) j.estado.moral = Math.max(0, j.estado.moral - 5); return 'Excused. The kid got upset.'; }]],
    padrao: (a, d) => AGM_CARTAS.convocacao.ops[0][1](a, d) },
});

/* ---------- 5) toda semana ---------- */
AGM_GANCHOS_SEMANA.push(function (a, lin) {
  const s = G.save;
  for (const j of a.jogadores.slice()) {
    // a) aos 17, o clube de base oferece o contrato profissional
    if (j.fase === 'desenvolvimento' && j.clube && j.clube.tipo === 'base' && agmIdade(j) >= 17 && (!j.ofertaPro || j.ofertaPro.ate < a.semana)) {
      if (j.ofertaPro && j.ofertaPro.ate < a.semana) { lin(`⌛ ${j.ofertaPro.clube.nome}’s pro contract offer for ${j.nome} expired. Another one will come soon.`, 1, j.id); }
      j.ofertaPro = { clube: { ...j.clube }, ate: a.semana + 6 }; lin(`📑 ${j.clube.nome} wants to sign ${j.nome}’s FIRST PRO CONTRACT! Negotiate in the 👤 Players tab (until week ${a.semana + 6}).`, 1, j.id);
    }
    if (j.fase !== 'carreira') continue;
    // b) salário → comissão da agência
    if (j.pro && j.clube) { const c = Math.round(j.pro.salario * ((j.contrato && j.contrato.comissao) || 10) / 100); s.ouro += c; a.totais.comissao += c; }
    // c) jogando, aparece
    if (j.clube && j.estado.forma > 50) j.visib = Math.min(100, j.visib + 0.5);
    // d) fim de contrato
    if (j.pro && j.clube) {
      if (a.semana >= j.pro.ateSemana - 8 && a.semana < j.pro.ateSemana && !j.semClubeEm && !(a.cartas || []).some(c => c.tipo === 'renovacao' && c.dados.jog === j.id)) agmCarta(a, 'renovacao', { jog: j.id }, lin);
      if (a.semana >= j.pro.ateSemana) { lin(`📭 ${j.nome}’s contract with ${j.clube.nome} is over: ${agmEle(j)} is a free agent.`, 1, j.id); j.clube = null; j.pro = null; j.semClubeEm = null; }
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
        j.propostas.push({ clube, valor, ate: a.semana + 4 }); lin(`📩 ${nv >= 4 ? '🌍 FROM EUROPE! ' : ''}${clube.nome} (${clube.pais}) wants ${j.nome}: ${agFmt(valor)}.`, 1, j.id); } }
    }
    // f) patrocínios: ofertas, pagamento e obrigação (1 ação a cada N semanas)
    j.ofertasPatro = (j.ofertasPatro || []).filter(o => o.ate >= a.semana);
    const tier = ['global', 'nacional', 'regional', 'loja'].find(t => j.visib >= AGM_PATROCINIOS[t][1] && !j.patrocinios.some(p => p.tier === t));
    if (tier && j.patrocinios.length < 2 && !j.ofertasPatro.length && Math.random() < 0.1) {
      const pol = tier !== 'loja' && Math.random() < 0.25, P = AGM_PATROCINIOS[tier];
      const of = { tier, marca: pol ? agPega(AGM_PATRO_POLEMICAS) : agPega(AGM_PATRO_MARCAS[tier]), pagto: P[2] * (pol ? 2 : 1), polemica: pol, ate: a.semana + 4 };
      j.ofertasPatro.push(of); lin(`📣 Sponsorship! ${of.marca} wants ${j.nome} (${P[0]}): ${of.pagto ? agFmt(of.pagto) + '/semana' : 'cleats and gear'}.`, 1, j.id);
    }
    for (const p of j.patrocinios.slice()) {
      if (p.pagto) { const parte = Math.round(p.pagto * p.pct / 100); s.ouro += parte; a.totais.comissao += parte; } else j.estado.forma = Math.min(100, j.estado.forma + 1);
      if (a.semana >= p.prox) {
        if (a.acoes > 0) { a.acoes--; p.prox = a.semana + p.cada; p.falhas = 0; lin(`📸 ${j.nome} filmed the ad for ${p.marca} (1 action this week).`, 0, j.id); }
        else { p.falhas++; p.prox = a.semana + 1; if (p.falhas >= 2) { j.patrocinios.splice(j.patrocinios.indexOf(p), 1); lin(`❌ ${p.marca} canceled ${j.nome}’s sponsorship: not enough actions for the duties.`, 1, j.id); } }
      }
    }
    // g) decisões de carreira (cartas)
    const tem = t => (a.cartas || []).some(c => c.tipo === t && c.dados.jog === j.id);
    if (j.clube && j.estado.forma < 45 && !tem('emprestimo') && Math.random() < 0.06) agmCarta(a, 'emprestimo', { jog: j.id }, lin);
    if (agmIdade(j) <= 20 && j.visib >= 50 && !tem('convocacao') && Math.random() < 0.05) agmCarta(a, 'convocacao', { jog: j.id }, lin);
    // h) aposentadoria
    if (agmIdade(j) >= 35) { j.ovr = agmOverall(j); agHall(j, 'aposentou-se'); a.jogadores.splice(a.jogadores.indexOf(j), 1); lin(`👋 ${j.nome} hung up the cleats. Thanks for everything, star!`, 1); }
  }
});

/* ---------- 6) na ficha do jogador ---------- */
{
  const _clubeEl = agmClubeEl;
  agmClubeEl = function (j) {
    const box = _clubeEl.apply(this, arguments), a = agDados(), s = G.save;
    if (j.ofertaPro && j.fase === 'desenvolvimento') box.append(el('button', { class: 'btn amarelo mini', type: 'button', disabled: a.acoes ? null : 'disabled', onclick: () => agmNegociaPro(j) }, `📑 Negotiate the pro contract with ${j.ofertaPro.clube.nome} (1 action · until week ${j.ofertaPro.ate})`));
    if (j.fase === 'carreira') {
      const com = j.pro ? Math.round(j.pro.salario * ((j.contrato && j.contrato.comissao) || 10) / 100) : 0;
      box.append(el('small', { class: 'agm-pro' }, j.clube && j.pro ? `⚽ Pro at ${j.clube.nome} (${j.clube.pais || 'Brazil'}) · salary ${agFmt(j.pro.salario)}/week · your commission ${agFmt(com)}/week · contract until week ${j.pro.ateSemana} · release clause ${j.pro.multa}` : '📭 No club: free agent (offers arrive faster)'),
        el('small', {}, `💰 Market value: ${agFmt(agmValor(j))}${j.patrocinios.length ? ' · 📣 ' + j.patrocinios.map(p => `${p.marca} (${p.pct}%, next promo in week ${p.prox})`).join(', ') : ''}`));
    }
    for (const p of j.propostas || []) box.append(el('div', { class: 'agm-proposta' }, el('b', {}, `${p.clube.nivel >= 4 ? '🌍 ' : '📩 '}${p.clube.nome} (${p.clube.pais}) offers ${agFmt(p.valor)} · until week ${p.ate}`),
      el('div', { class: 'ag-acoes' }, el('button', { class: 'btn amarelo mini', type: 'button', onclick: () => agmNegociaTransf(j, p) }, '💬 Negotiate with the director'),
        el('button', { class: 'btn mini', type: 'button', onclick: () => agmVende(j, p, p.valor) }, '✅ Sell as is'),
        el('button', { class: 'btn mini', type: 'button', onclick: () => { j.propostas = j.propostas.filter(x => x !== p); salvar(); abreAgencia3('jogadores'); } }, '❌ Decline'))));
    for (const o of j.ofertasPatro || []) box.append(el('div', { class: 'agm-proposta' }, el('b', {}, `📣 ${o.marca} · ${AGM_PATROCINIOS[o.tier][0]} · ${o.pagto ? agFmt(o.pagto) + '/semana' : 'cleats and gear'}${o.polemica ? ' · ⚠️ controversial brand: pays double, but is it good for health and for the fans?' : ''} · until week ${o.ate}`),
      el('small', {}, `Duty: 1 action every ${AGM_PATROCINIOS[o.tier][3]} week(s).${o.polemica && j.fam && j.fam.sabe && j.fam.sabe.seguranca ? ' The family cares about Safety and won\'t like this (−15 trust).' : ''}`),
      el('div', { class: 'ag-acoes' }, el('button', { class: 'btn amarelo mini', type: 'button', onclick: () => agmAceitaPatro(j, o, 10) }, '✅ Accept (your share: 10%)'),
        el('button', { class: 'btn mini', type: 'button', onclick: () => agmAceitaPatro(j, o, 20) }, '💬 Ask for 20% (they may back out)'),
        el('button', { class: 'btn mini', type: 'button', onclick: () => { j.ofertasPatro = j.ofertasPatro.filter(x => x !== o); salvar(); abreAgencia3('jogadores'); } }, '❌ Decline'))));
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
