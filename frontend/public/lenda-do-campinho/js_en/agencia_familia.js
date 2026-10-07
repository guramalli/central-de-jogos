/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   👪 AGÊNCIA 3.0 — ETAPA 4: A CONQUISTA DA FAMÍLIA (v338). Do documento do dono: a negociação é um quebra-cabeça
   de informação. Cada família tem um ARQUÉTIPO e 2 necessidades ocultas (principal peso 2, secundária peso 1);
   você descobre conversando antes de propor. Propor no escuro funciona, mas sai caro.
   - Visitar a família gasta 1 ação da semana. Barras: 🤝 Confiança (começa 20–50 pela reputação, e o que você
     ganhou fica para a próxima visita) e ⏳ Paciência (5 falas por visita; pergunta gasta 1, fala que irrita gasta 2;
     zerou → "volte outra semana").
   - Etapas: ABERTURA (humilde, confiante ou direto — cada arquétipo reage diferente) → SONDAGEM (perguntas que
     revelam ou descartam necessidades) → PROPOSTA (comissão, duração, adiantamento, ajuda semanal, bolsa, cláusula
     de saída, restrição de clubes longe até 16 anos, acompanhante em testes) → OBJEÇÕES (aceita / contraproposta /
     recusa; com rival o limite sobe 15).
   - Nota = Confiança + Σ(termo atende × peso × 10) − (comissão − 10) × 2 (agmNotaFamilia) + o jeito de cada arquétipo.
   - Bem atendidos: pai ambicioso aceita comissão maior; mãe protetora começa com confiança alta; criado pela avó tem
     lealdade máxima; família desconfiada indica outro garoto; o tio "empresário" some... mas cobra depois.
   Carregar DEPOIS de agencia_semana.js.
   ============================================================ */
const AGM_VISITA_PAC = 5, AGM_BOLSA_SEM = 15000;
const AGM_ADIANT = [0, 25000, 50000, 100000, 250000], AGM_AJUDA = [0, 5000, 10000, 25000];
const agmEle = j => j.menina ? 'she' : 'he', agmDele = j => j.menina ? 'her' : 'his', agmO = j => '';
const AGM_ARQ_ABRE = {
  pai_ambicioso: j => `So you’re the agent? ${agPrimeiro(j)} is ${j.menina ? 'the best' : 'the best'} in the sandlot, everybody knows it. I want to see what you’ve got to offer.`,
  mae_protetora: j => `${j.menina ? 'She' : 'Ele'} is only ${agmIdade(j) | 0} years old. People have come here before promising the moon...`,
  avo: j => `Come in, come in... have a seat, have some coffee. I’m the one who raised ${agPrimeiro(j)} since tiny${agmO(j)}.`,
  desconfiada: j => `Hmm. Another agent. Last time we signed a paper full of fine print and got tricked.`,
  tio: j => `Hey, hey! I’m the uncle. I’m the one who handles the career of${agmO(j)} ${agPrimeiro(j)}. With me, it’s business.`,
  estruturada: j => `Good afternoon. Before anything else, we want to understand your career plan for ${agPrimeiro(j)}, step by step.`,
};
const AGM_TONS = { // [fala, {arquétipo: [confiança, irrita?, resposta]}]
  humilde: ['🙏 “I came to meet you all and ' + 'the family. No rush at all.”', {
    pai_ambicioso: [0, 0, 'Hmm. Okay... but time is money, you know?'], mae_protetora: [10, 0, 'Good to hear that. Have a seat.'], avo: [12, 0, 'That’s how I like it, nice and calm.'],
    desconfiada: [5, 0, 'At least you didn’t come in acting like a big shot.'], tio: [-5, 0, 'No rush? I’m in a rush, my friend!'], estruturada: [0, 0, 'Right. And the plan?'] }],
  confiante: ['💪 “My agency will turn this talent into a star.”', {
    pai_ambicioso: [10, 0, 'Now that’s the attitude I like!'], mae_protetora: [-5, 0, 'Everybody says that...'], avo: [0, 0, 'God willing, right?'],
    desconfiada: [-10, 1, 'Uh-oh, here we go. I’ve heard that one before.'], tio: [5, 0, 'That’s it, partner!'], estruturada: [5, 0, 'Confidence is good. Let’s see the details.'] }],
  direto: ['🎯 “I’ll be direct: I want to represent your kid. Shall we talk contracts?”', {
    pai_ambicioso: [5, 0, 'Straight to the point, I like that.'], mae_protetora: [-5, 0, 'Easy... a contract already?'], avo: [-10, 1, 'Wow, what a hurry! You haven’t even had your coffee...'],
    desconfiada: [10, 0, 'At least you’re honest.'], tio: [10, 0, 'Talk to me then, I’ll sort it out!'], estruturada: [10, 0, 'Great. Straight to business.'] }],
};
// perguntas da sondagem: [texto, necessidade que ela testa (ou 'principal'), respostas]
const AGM_PERGUNTAS = [
  ['futuro', '🔮 “What do you hope for $DELE future?”', 'principal'],
  ['escola', '📚 “And how’s school going?”', 'estudo'],
  ['longe', '🏠 “What if one day $ELE has to live far away?”', 'proximidade'],
  ['casa', '💰 “How are things at home?”', 'dinheiro'],
  ['tranquilos', '🛡️ “What would make you feel more at ease?”', 'seguranca'],
  ['clube', '⭐ “Do you dream of a big club?”', 'status'],
  ['contratos', '📄 “Have you ever had trouble with contracts?”', 'transparencia'],
];
const AGM_RESP = { // [é a principal, é a secundária, não é]
  estudo: ['School is everything! No studying, no soccer.', 'School is important too, right...', 'It’s going fine, $ELE gets by.'],
  proximidade: ['Far away?! No way, still way too young.', 'It would break our hearts, but we’d manage if we had to.', 'If it’s for $DELE own good, we’ll support it.'],
  dinheiro: ['Things are tight... any help makes a difference here.', 'We get by, but some help would be nice.', 'Thank God, we manage just fine.'],
  seguranca: ['Knowing a trusted adult is there whenever $ELE has a trial or a practice.', 'Having someone go along would be nice.', 'Oh, $ELE is smart and knows how to stay safe.'],
  status: ['A big club, TV, fame... that’s what $ELE deserves!', 'It would be lovely if $ELE played for a big club.', 'What matters is that $ELE is happy playing.'],
  transparencia: ['We have! That’s why contracts here are short and clear, no fine print.', 'A contract has to be clear, right?', 'No, we never have.'],
};
const AGM_FUTURO = { estudo: 'That $ELE keeps studying and has a future, with or without soccer.', dinheiro: 'That $ELE helps the family get out of a tight spot.', proximidade: 'That $ELE grows up here, close to us.',
  seguranca: 'That $ELE is always safe and protected, you know?', status: 'That $ELE plays for a giant club, on TV!', transparencia: 'That nobody ever fools us again.' };
const agmTxtJ = (t, j) => t.replace(/\$DELE/g, agmDele(j)).replace(/\$ELE/g, agmEle(j)).replace(/\$O/g, agmO(j)).replace(/^(he|she) /, m => m[0].toUpperCase() + m.slice(1));

/* ---------- resumo da família (cartão do candidato) ---------- */
function agmFamResumo(j) {
  const f = j.fam; if (!f || !f.visitas) return '';
  const sabe = Object.keys(f.sabe || {}).map(n => `${AGM_NECESSIDADES[n]}${n === f.need[0] ? ' (main)' : ''}`), nao = Object.keys(f.nao || {}).map(n => AGM_NECESSIDADES[n].split(' ')[1]);
  return ` · ${AGM_ARQUETIPOS[f.arq][0]} · 🤝 ${Math.round(f.confianca)}${sabe.length ? ` · wants: ${sabe.join(', ')}` : ''}${nao.length ? ` · doesn't care about: ${nao.join(', ')}` : ''}`;
}
function agmPacEl(pac) { return '⏳ Patience: ' + '●'.repeat(Math.max(0, pac)) + '○'.repeat(Math.max(0, AGM_VISITA_PAC - pac)); }

/* ---------- a visita ---------- */
function agmVisitaFamilia(j) {
  const a = agDados(), f = j.fam;
  if (a.jogadores.length >= agmMaxJogadores(a.nivel)) { log(`Your agency can only represent ${agmMaxJogadores(a.nivel)} kids at this level.`, 'l-sis'); return; }
  if (f.voltaSem != null && a.semana < f.voltaSem) { log(`${agPrimeiro(j)}’s family asked you to come back another week (week ${f.voltaSem}).`, 'l-sis'); return; }
  if (a.acoes <= 0) { log('Visiting a family uses 1 action this week — you’re out of actions this week.', 'l-sis'); return; }
  a.acoes--; f.visitas = (f.visitas || 0) + 1; f.sabe = f.sabe || {}; f.nao = f.nao || {};
  const v = { pac: AGM_VISITA_PAC, perguntas: 0, revisou: false, falas: new Set() }; // estado da visita (não vai para o save)
  const quem = { nome: `${f.nome} (${(AG_PARENTES[f.par] || [])[1] || 'family'} of ${agPrimeiro(j)})`, look: f.look };
  const titulo = `👪 Visit to ${agPrimeiro(j)}’s family`;
  const info = extra => el('span', {}, el('b', {}, agmPacEl(v.pac)), ` · ${AGM_ARQUETIPOS[f.arq][0]}`, f.rival ? ' · 😬 another agency is circling' : '',
    Object.keys(f.sabe).length ? el('div', {}, '🔎 Already known: ' + Object.keys(f.sabe).map(n => AGM_NECESSIDADES[n] + (n === f.need[0] ? ' (main)' : '')).join(', ')) : '',
    Object.keys(f.nao).length ? el('div', {}, '✖️ Doesn’t care about: ' + Object.keys(f.nao).map(n => AGM_NECESSIDADES[n]).join(', ')) : '', extra ? el('div', {}, extra) : '');
  const med = d => ({ rot: '🤝 Family trust', v: f.confianca, delta: d });
  const muda = (d, irrita) => { f.confianca = clamp(Math.round(f.confianca + d), 0, 100); if (irrita) v.pac -= 2; return d; };
  const acabou = (fala, voce) => { f.voltaSem = a.semana + 1; salvar();
    agDialogo({ titulo, quem, voce, txt: fala, info: info('Their patience ran out. The trust you earned is saved for the next visit.'), medidor: med(), ops: [{ txt: '↩ Back to the agency', fn: () => abreAgencia3('olheiros') }] }); };
  // 1) abertura
  const abre = AGM_ARQ_ABRE[f.arq](j) + (f.rival && f.visitas === 1 ? ' By the way, another agency stopped by this week too.' : '');
  if (f.visitas > 1) return sondagem(`You again? Come on in, let’s continue our chat.`, null, 0);
  agDialogo({ titulo, quem, txt: abre, info: info(`First impression: choose your tone. ${j.nome}, ${agmIdade(j) | 0} years old, ${AGM_POS[j.pos][0]}.`), medidor: med(),
    ops: Object.entries(AGM_TONS).map(([tom, [fala, reac]]) => ({ txt: fala, fn: () => {
      let [d, irr, resp] = reac[f.arq];
      if (tom === 'confiante') { const extra = a.nivel >= 3 ? 5 : -5; d += extra; resp += a.nivel >= 3 ? ' (I’ve heard good things about your agency.)' : ' (Never heard of your agency...)'; }
      sondagem(resp, fala, muda(d, irr));
    } })) });
  // 2) sondagem
  function sondagem(fala, voce, d) {
    if (v.pac <= 0) return acabou('Look, it’s getting late... Come back another week and we’ll pick up from here.', voce);
    const ops = [];
    for (const [id, txt, nec] of AGM_PERGUNTAS) if (!v.falas.has(id) && !(nec !== 'principal' && (f.sabe[nec] || f.nao[nec])) && !(nec === 'principal' && f.sabe[f.need[0]]))
      ops.push({ txt: agmTxtJ(txt, j), sub: '1 patience', fn: () => pergunta(id, txt, nec) });
    if (f.arq === 'tio' && !f.tioOuvido) ops.push({ txt: '🙋 “And you, Uncle, what do you think of all this?”', sub: '1 patience', fn: () => { v.pac--; f.tioOuvido = true; sondagem('Finally someone asks me! I think the kid has to deliver... for everyone, right?', '🙋 “And you, Uncle, what do you think?”', muda(10)); } });
    if (!v.falas.has('plano')) ops.push({ txt: '📋 Present a step-by-step career plan', sub: '1 patience', fn: () => { v.falas.add('plano'); v.pac--; const dd = f.arq === 'estruturada' ? 15 : f.arq === 'desconfiada' ? 5 : 3; sondagem(f.arq === 'estruturada' ? 'Yes! Steps, goals, deadlines. Now we’re talking.' : 'Hmm, at least you have a plan.', '📋 “Here’s the plan: youth academy, tryouts, a contract at 17...”', muda(dd)); } });
    if (!v.falas.has('promessa')) ops.push({ txt: `🌈 “I promise: ${agmEle(j)} will be a national team star!”`, sub: '1 patience', fn: () => { v.falas.add('promessa'); v.pac--; const irr = f.arq === 'pai_ambicioso' || f.arq === 'estruturada'; sondagem(irr ? 'I can’t eat promises. I want to know what’s concrete.' : 'Let’s hope so, right...', '🌈 “Gonna be a national team star!”', muda(irr ? -10 : -3, irr)); } });
    ops.push({ txt: '📝 Make the offer', cls: 'amarelo', fn: () => proposta() }, { txt: '🚪 End the visit for today', cls: 'cinza', fn: () => { salvar(); abreAgencia3('olheiros'); } });
    agDialogo({ titulo, quem, voce, txt: fala, info: info(), medidor: med(d), ops });
  }
  function pergunta(id, txt, nec) {
    v.falas.add(id); v.perguntas++; v.pac--; let d = 2, fala, irr = false;
    if (nec === 'principal') { const n = f.need[0]; f.sabe[n] = true; fala = agmTxtJ(AGM_FUTURO[n], j); d = f.arq === 'mae_protetora' ? 10 : 5; }
    else {
      const k = f.need[0] === nec ? 0 : f.need[1] === nec ? 1 : 2; fala = agmTxtJ(AGM_RESP[nec][k], j);
      if (k < 2) f.sabe[nec] = true; else f.nao[nec] = true;
      if (nec === 'dinheiro' && f.arq === 'mae_protetora' && v.perguntas <= 2) { irr = true; d = -10; fala = 'Money?! Right off the bat? ' + fala; } // falar de dinheiro cedo irrita
    }
    sondagem(fala, agmTxtJ(txt, j), muda(d, irr));
  }
  // 3) proposta: o jogador monta as cláusulas
  function proposta(contra) {
    if (f.arq === 'avo' && v.perguntas < 2 && !v.avisouPressa) { v.avisouPressa = true; muda(-10, true); if (v.pac <= 0) return acabou('What’s the rush? Come back another week, and take it easy.'); }
    if (f.arq === 'tio' && !f.tioOuvido && !v.tioReclamou) { v.tioReclamou = true; muda(-15); }
    const T = v.termos || { comissao: 10, anos: 2, adiantamento: 0, ajuda: 0, bolsa: false, saida: false, restricao: false, acompanhante: false };
    const sel = (lista, val, fmtF) => el('select', {}, ...lista.map(x => el('option', { value: x, selected: x === val ? 'selected' : null }, fmtF(x))));
    const sCom = sel([5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20], T.comissao, x => `${x}%`), sAnos = sel([1, 2, 3, 4], T.anos, x => `${x} ano${x > 1 ? 's' : ''}`);
    const sAd = sel(AGM_ADIANT, T.adiantamento, x => x ? agFmt(x) : 'nenhum'), sAj = sel(AGM_AJUDA, T.ajuda, x => x ? `${agFmt(x)}/semana` : 'nenhuma');
    const chk = (v0) => { const c = el('input', { type: 'checkbox' }); c.checked = !!v0; return c; };
    const cB = chk(T.bolsa), cS = chk(T.saida), cR = chk(T.restricao), cA = chk(T.acompanhante);
    const linha = (rot, ctl, dica) => el('label', { class: 'agm-termo' }, el('span', {}, rot), ctl, el('small', {}, dica));
    const custo = el('b', {}), le = () => ({ comissao: +sCom.value, anos: +sAnos.value, adiantamento: +sAd.value, ajuda: +sAj.value, bolsa: cB.checked, saida: cS.checked, restricao: cR.checked, acompanhante: cA.checked });
    const calc = () => { const t = le(); custo.textContent = `Now: 💰 ${agFmt(t.adiantamento)} · per week: 💰 ${agFmt(t.ajuda + (t.bolsa ? AGM_BOLSA_SEM : 0))} while the contract lasts`; };
    [sCom, sAnos, sAd, sAj, cB, cS, cR, cA].forEach(x => x.onchange = calc); calc();
    abreModal.largo = true;
    abreModal(el('h2', {}, `📝 Offer for ${agPrimeiro(j)}’s family`), el('p', {}, info(contra ? `The family asked for changes: ${contra}` : 'Build the contract. Each clause meets a need — and only the family knows which ones matter.')),
      el('div', { class: 'agm-termos' },
        linha('💼 Your commission', sCom, 'The lower it is, the happier anyone who needs Money will be'), linha('📅 Length', sAnos, 'Short (up to 2 years) pleases Transparency'),
        linha('💵 Advance payment', sAd, 'Paid at signing · meets Money'), linha('🤲 Weekly allowance', sAj, 'Meets Money and Safety'),
        linha('🎓 Scholarship', cB, `${agFmt(AGM_BOLSA_SEM)}/semana · atende Estudo`), linha('🚪 Exit clause', cS, 'Meets Transparency'),
        linha('📍 No faraway clubs until age 16', cR, 'Meets Closeness'), linha('🧑‍🤝‍🧑 Someone to go along to trials', cA, 'Meets Safety')),
      el('p', {}, (v.falas.has('plano') || a.nivel >= 3) ? '⭐ Status: ' + (v.falas.has('plano') ? 'you presented a career plan.' : 'your agency is already well known (level 3+).') : '⭐ Status: present a career plan in the conversation to win over families who dream big.'),
      el('p', {}, custo),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => { v.termos = { ...le(), plano: v.falas.has('plano') || a.nivel >= 3 }; objecoes(v.termos); } }, '🤝 Present the offer'),
        el('button', { class: 'btn', type: 'button', onclick: () => sondagem('You can ask something else if you want.', null, 0) }, '↩ Back to the conversation')));
  }
  // 4) objeções
  function objecoes(T) {
    const r = agmAvaliaProposta(j, T), voce = `📝 Commission ${T.comissao}%, ${T.anos} year(s)${T.adiantamento ? `, advance ${agFmt(T.adiantamento)}` : ''}${T.ajuda ? `, allowance ${agFmt(T.ajuda)}/wk.` : ''}${T.bolsa ? ', scholarship' : ''}${T.saida ? ', release clause' : ''}${T.restricao ? ', no faraway clubs' : ''}${T.acompanhante ? ', guardian' : ''}`;
    if (G.save.ouro < T.adiantamento) return agDialogo({ titulo, quem, voce, txt: 'And this advance... can you really pay it?', info: info('💸 Not enough coins for the advance.'), medidor: med(), ops: [{ txt: '📝 Change the offer', fn: () => proposta() }] });
    if (r.decisao === 'aceita') {
      agmAssinaContrato(j, T, r);
      return agDialogo({ titulo: `✍️ ${j.nome} signed with ${a.nome}!`, quem, voce, txt: r.fala, info: el('span', {}, el('b', {}, r.bonus || 'Contract signed!'), el('div', {}, `Commission ${T.comissao}% · ${T.anos} year(s) · valid until week ${j.contrato.ateSemana}`)), medidor: med(),
        ops: [{ txt: '👤 See my players', cls: 'amarelo', fn: () => abreAgencia3('jogadores') }] });
    }
    if (r.decisao === 'contraproposta' && !v.revisou && v.pac > 0) {
      return agDialogo({ titulo, quem, voce, txt: r.fala, info: info('The family made a counteroffer. Adjusting costs 1 patience.'), medidor: med(),
        ops: [{ txt: '📝 Adjust the offer', cls: 'amarelo', fn: () => { v.revisou = true; v.pac--; proposta(r.pede); } }, { txt: '🚪 Think it over and come back another week', cls: 'cinza', fn: () => { f.voltaSem = a.semana + 1; salvar(); abreAgencia3('olheiros'); } }] });
    }
    // recusa (ou a contraproposta de novo sem paciência)
    f.recusas = (f.recusas || 0) + 1; muda(-10);
    if (f.recusas >= 2) {
      a.candidatos.splice(a.candidatos.indexOf(j), 1); agmGanhaRep(a, AGM_REP_GANHO.familiaInsatisfeita); salvar();
      return agDialogo({ titulo: '❌ It didn\'t work out', quem, voce, txt: f.rival ? 'Sorry... we signed with the other agency. Their offer was better.' : 'No, thank you' + (AG_PARENTES[f.par] && AG_PARENTES[f.par][2] ? 'a' : 'o') + '. We\'ll go a different way.',
        info: `${j.nome} left your list and the family was unhappy (reputation ${AGM_REP_GANHO.familiaInsatisfeita}). Tip: find out what they need before making an offer.`, ops: [{ txt: '↩ Back to the agency', fn: () => abreAgencia3('olheiros') }] });
    }
    f.voltaSem = a.semana + 1; salvar();
    agDialogo({ titulo: '❌ The family said no', quem, voce, txt: r.fala, info: info('You can try again starting next week. If they say no a second time, the family gives up.'), medidor: med(-10), ops: [{ txt: '↩ Back to the agency', fn: () => abreAgencia3('olheiros') }] });
  }
}
// a nota da família (documento) + o jeito de cada arquétipo
function agmAvaliaProposta(j, T) {
  const f = j.fam, base = agmNotaFamilia(f, T); let nota = base.nota; const atende = n => Object.entries(AGM_TERMOS).some(([t, ns]) => ns.includes(n) && agmTermoAtende(t, T));
  const ok0 = atende(f.need[0]), ok1 = atende(f.need[1]), bem = ok0 && ok1;
  if (f.arq === 'pai_ambicioso' && bem && T.comissao > 10) nota += (T.comissao - 10); // aceita comissão maior (metade da penalidade)
  if (f.arq === 'estruturada' && bem && T.anos >= 3) nota += 5;                       // aceita contrato longo
  const clausulas = [T.adiantamento > 0, T.ajuda > 0, T.bolsa, T.saida, T.restricao, T.acompanhante].filter(Boolean).length;
  if (f.arq === 'desconfiada' && clausulas > 3) nota -= 10;                           // cláusulas demais
  if (f.arq === 'tio' && !f.tioOuvido) nota -= 15;                                    // ninguém perguntou nada ao tio
  const lim = f.rival ? 15 : 0, decisao = nota > 70 + lim ? 'aceita' : nota >= 50 + lim ? 'contraproposta' : 'recusa';
  let pede = '', fala;
  if (!ok0) pede = { estudo: 'what about school?', dinheiro: 'we need some help with money', proximidade: 'we don\'t want a faraway club so soon', seguranca: 'we want someone to go along', status: 'we want to see the plan for a big club', transparencia: 'a short contract with a way out' }[f.need[0]];
  else if (!ok1) pede = { estudo: 'some help with school', dinheiro: 'an advance would help', proximidade: 'staying close to home at first', seguranca: 'someone we trust at the trials', status: 'show that they can go far', transparencia: 'a shorter contract' }[f.need[1]];
  else if (T.comissao > 10) pede = 'that commission is too high';
  if (decisao === 'aceita') fala = { pai_ambicioso: 'Deal! Now it\'s up to you: I want to see results.', mae_protetora: `All right... take good care of ${agmDele(j)} career, okay? I trust you.`, avo: 'May God bless this partnership. You can count on us forever.', desconfiada: 'A clear contract, done the right way. That works. I\'ll say good things about you around town.', tio: 'It\'s a deal, partner! We\'ll talk... later.', estruturada: 'Excellent. Plan approved.' }[f.arq];
  else if (decisao === 'contraproposta') fala = `${f.rival ? 'The other agency made a good offer too... ' : ''}Almost there. But ${pede || 'you can do a little better'}.`;
  else fala = `${f.rival ? 'The other agency offered more. ' : ''}No, this won't work. ${pede ? pede[0].toUpperCase() + pede.slice(1) + '.' : ''}`;
  return { nota, decisao, bem, pede, fala };
}
function agmAssinaContrato(j, T, r) {
  const a = agDados(), s = G.save, f = j.fam;
  s.ouro -= T.adiantamento; a.candidatos.splice(a.candidatos.indexOf(j), 1);
  j.fase = 'desenvolvimento'; j.contrato = { ...T, ateSemana: a.semana + T.anos * 52, desde: a.semana }; j.confianca = clamp(Math.round(f.confianca), 30, 100);
  let bonus = '';
  if (r.bem) {
    if (f.arq === 'mae_protetora') { j.confianca = Math.min(100, j.confianca + 20); bonus = '💞 Protective mom well taken care of: high starting trust!'; }
    else if (f.arq === 'avo') { j.pers.lealdade = 100; if (!j.revelados.includes('lealdade')) j.revelados.push('lealdade'); bonus = '❤️ Raised by grandma, well taken care of: maximum loyalty to the agency!'; }
    else if (f.arq === 'desconfiada') { (a.indicacoes = a.indicacoes || []).push({ sem: a.semana + 4, regiao: j.regiao, de: j.nome }); bonus = '📣 Suspicious family well taken care of: they\'ll recommend another kid soon!'; }
    else if (f.arq === 'tio') { j.tioCobra = a.semana + agRi(10, 30); bonus = '🤫 The uncle vanished from the story... for now.'; }
    else if (f.arq === 'pai_ambicioso') bonus = '💼 Ambitious dad well taken care of: he accepted your commission.';
    else if (f.arq === 'estruturada') bonus = '📋 Stable family well taken care of: they agree to a long contract.';
  }
  const t = agPega(Object.keys(AGM_TRACOS).filter(x => !j.revelados.includes(x))); if (t) j.revelados.push(t); // convivendo, você descobre mais um traço
  a.jogadores.push(j); a.marcos.assinados++; agmHist(j, `signed with the agency (commission ${T.comissao}%, ${T.anos} year(s))`);
  log(`✍️ ${j.nome} is now with ${a.nome}!`, 'l-loot'); try { som('moeda'); } catch (e) { }
  agmConfereNivel(a); salvar(); r.bonus = bonus;
}
// toda semana: ajuda e bolsa do contrato; indicações da família desconfiada
AGM_GANCHOS_SEMANA.push(function (a, lin) {
  const s = G.save;
  for (const j of a.jogadores) {
    const c = j.contrato; if (!c || a.semana > c.ateSemana) continue;
    const v = (c.ajuda || 0) + (c.bolsa ? AGM_BOLSA_SEM : 0); if (!v) continue;
    if (s.ouro >= v) s.ouro -= v; else { j.confianca = Math.max(0, j.confianca - 5); lin(`💸 Not enough coins for ${agPrimeiro(j)}'s allowance/scholarship: the family's trust dropped.`, 1, j.id); }
  }
  for (const ind of (a.indicacoes || []).slice()) if (a.semana >= ind.sem) {
    a.indicacoes.splice(a.indicacoes.indexOf(ind), 1);
    const ol = a.olheiros.slice().sort((x, y) => y.olho - x.olho)[0], c = agmNovoCandidato(a, ind.regiao, ol || null);
    if (!c.faixa) c.faixa = { ...agmFaixa(c.P, agmMargem(10)), ol: null, olNome: 'referral', olho: 10, reobs: 0 };
    c.fam.confianca = Math.min(100, c.fam.confianca + 15); a.candidatos.push(c); lin(`📣 ${ind.de}'s family recommended ${c.nome} (${agmIdade(c) | 0} years old, ${AGM_POS[c.pos][0]}): ${agmEstrelasTxt(c.faixa)}. The family already trusts you from the start.`, 1);
  }
});

/* ---------- estilo ---------- */
{
  const st = document.createElement('style');
  st.textContent = `
  .agm-termos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 14px; margin: 8px 0; }
  .agm-termo { display: grid; grid-template-columns: 1fr auto; gap: 2px 8px; align-items: center; background: #fff8e6; border: 1px solid #e0cc98; border-radius: 10px; padding: 6px 10px; cursor: pointer; }
  .agm-termo span { font-weight: 700; } .agm-termo small { grid-column: 1 / -1; opacity: .8; font-size: 11.5px; }
  .agm-termo input[type=checkbox] { width: 20px; height: 20px; }
  @media (max-width: 560px) { .agm-termos { grid-template-columns: 1fr; } }
  `;
  document.head.append(st);
}
