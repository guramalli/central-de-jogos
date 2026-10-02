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
const agmEle = j => j.menina ? 'ela' : 'ele', agmDele = j => j.menina ? 'dela' : 'dele', agmO = j => j.menina ? 'a' : 'o';
const AGM_ARQ_ABRE = {
  pai_ambicioso: j => `Então você é o empresário? ${agPrimeiro(j)} é ${j.menina ? 'a melhor' : 'o melhor'} da várzea, todo mundo sabe. Quero ver o que você tem pra oferecer.`,
  mae_protetora: j => `${j.menina ? 'Ela' : 'Ele'} tem só ${agmIdade(j) | 0} anos. Já apareceu gente aqui prometendo mundos e fundos...`,
  avo: j => `Entra, entra... senta aí, toma um cafezinho. Fui eu que criei ${agPrimeiro(j)} desde pequenininh${agmO(j)}.`,
  desconfiada: j => `Hum. Mais um empresário. Da última vez assinamos um papel cheio de letrinha e nos enrolaram.`,
  tio: j => `Opa, opa! Eu sou o tio. Quem cuida da carreira d${agmO(j)} ${agPrimeiro(j)} sou eu. Comigo é negócio.`,
  estruturada: j => `Boa tarde. Antes de qualquer coisa, queremos entender o seu plano de carreira para ${agPrimeiro(j)}, passo a passo.`,
};
const AGM_TONS = { // [fala, {arquétipo: [confiança, irrita?, resposta]}]
  humilde: ['🙏 “Vim conhecer vocês e ' + 'a família. Sem pressa nenhuma.”', {
    pai_ambicioso: [0, 0, 'Hum. Tá bom... mas tempo é dinheiro, viu?'], mae_protetora: [10, 0, 'Que bom ouvir isso. Pode sentar.'], avo: [12, 0, 'Assim que eu gosto, com calma.'],
    desconfiada: [5, 0, 'Pelo menos não chegou se achando.'], tio: [-5, 0, 'Sem pressa? Eu tenho pressa, meu amigo!'], estruturada: [0, 0, 'Certo. E o plano?'] }],
  confiante: ['💪 “A minha agência vai transformar esse talento num craque.”', {
    pai_ambicioso: [10, 0, 'Agora sim, gostei da atitude!'], mae_protetora: [-5, 0, 'Todo mundo diz isso...'], avo: [0, 0, 'Se Deus quiser, né?'],
    desconfiada: [-10, 1, 'Ih, lá vem. Já ouvi essa antes.'], tio: [5, 0, 'É isso aí, sócio!'], estruturada: [5, 0, 'Confiança é bom. Vamos ver os detalhes.'] }],
  direto: ['🎯 “Vou ser direto: quero representar seu garoto. Vamos falar de contrato?”', {
    pai_ambicioso: [5, 0, 'Direto ao ponto, gosto disso.'], mae_protetora: [-5, 0, 'Calma... contrato já?'], avo: [-10, 1, 'Nossa, que pressa! Nem tomou o café...'],
    desconfiada: [10, 0, 'Pelo menos é sincero.'], tio: [10, 0, 'Fala comigo então, que eu resolvo!'], estruturada: [10, 0, 'Ótimo. Objetividade.'] }],
};
// perguntas da sondagem: [texto, necessidade que ela testa (ou 'principal'), respostas]
const AGM_PERGUNTAS = [
  ['futuro', '🔮 “O que vocês esperam para o futuro $DELE?”', 'principal'],
  ['escola', '📚 “E a escola, como vai?”', 'estudo'],
  ['longe', '🏠 “E se um dia $ELE precisar morar longe?”', 'proximidade'],
  ['casa', '💰 “Como está a situação aí em casa?”', 'dinheiro'],
  ['tranquilos', '🛡️ “O que deixaria vocês mais tranquilos?”', 'seguranca'],
  ['clube', '⭐ “Vocês sonham com um clube grande?”', 'status'],
  ['contratos', '📄 “Vocês já tiveram problema com contratos?”', 'transparencia'],
];
const AGM_RESP = { // [é a principal, é a secundária, não é]
  estudo: ['A escola é tudo! Sem estudo, nada de bola.', 'Escola é importante também, né...', 'Vai bem, $ELE se vira.'],
  proximidade: ['Longe?! Nem pensar, ainda é muito novinh$O.', 'Ia doer o coração, mas a gente aguenta se precisar.', 'Se for pro bem $DELE, a gente apoia.'],
  dinheiro: ['Tá apertado... qualquer ajuda faz diferença aqui.', 'Dá pra levar, mas uma ajuda viria bem.', 'Graças a Deus, a gente se vira bem.'],
  seguranca: ['Saber que tem um adulto de confiança com $ELE em todo teste, todo treino.', 'Alguém acompanhando seria bom.', '$ELE é espert$O, sabe se cuidar.'],
  status: ['Clube grande, televisão, fama... é isso que $ELE merece!', 'Seria lindo ver $ELE num clube grande.', 'O importante é $ELE ser feliz jogando.'],
  transparencia: ['Já! Por isso aqui contrato é curto e claro, sem letrinha.', 'Contrato tem que ser claro, né?', 'Não, nunca tivemos.'],
};
const AGM_FUTURO = { estudo: 'Que $ELE estude e tenha um futuro, com ou sem bola.', dinheiro: 'Que $ELE ajude a família a sair do aperto.', proximidade: 'Que $ELE cresça aqui, pertinho da gente.',
  seguranca: 'Que $ELE esteja sempre protegid$O, sabe?', status: 'Que $ELE jogue num clube gigante, na televisão!', transparencia: 'Que ninguém mais engane a gente.' };
const agmTxtJ = (t, j) => t.replace(/\$DELE/g, agmDele(j)).replace(/\$ELE/g, agmEle(j)).replace(/\$O/g, agmO(j)).replace(/^(ele|ela) /, m => m[0].toUpperCase() + m.slice(1));

/* ---------- resumo da família (cartão do candidato) ---------- */
function agmFamResumo(j) {
  const f = j.fam; if (!f || !f.visitas) return '';
  const sabe = Object.keys(f.sabe || {}).map(n => `${AGM_NECESSIDADES[n]}${n === f.need[0] ? ' (principal)' : ''}`), nao = Object.keys(f.nao || {}).map(n => AGM_NECESSIDADES[n].split(' ')[1]);
  return ` · ${AGM_ARQUETIPOS[f.arq][0]} · 🤝 ${Math.round(f.confianca)}${sabe.length ? ` · quer: ${sabe.join(', ')}` : ''}${nao.length ? ` · não liga para: ${nao.join(', ')}` : ''}`;
}
function agmPacEl(pac) { return '⏳ Paciência: ' + '●'.repeat(Math.max(0, pac)) + '○'.repeat(Math.max(0, AGM_VISITA_PAC - pac)); }

/* ---------- a visita ---------- */
function agmVisitaFamilia(j) {
  const a = agDados(), f = j.fam;
  if (a.jogadores.length >= agmMaxJogadores(a.nivel)) { log(`Sua agência só representa ${agmMaxJogadores(a.nivel)} garotos neste nível.`, 'l-sis'); return; }
  if (f.voltaSem != null && a.semana < f.voltaSem) { log(`A família de ${agPrimeiro(j)} pediu para você voltar outra semana (semana ${f.voltaSem}).`, 'l-sis'); return; }
  if (a.acoes <= 0) { log('Visitar uma família gasta 1 ação da semana — acabaram as ações desta semana.', 'l-sis'); return; }
  a.acoes--; f.visitas = (f.visitas || 0) + 1; f.sabe = f.sabe || {}; f.nao = f.nao || {};
  const v = { pac: AGM_VISITA_PAC, perguntas: 0, revisou: false, falas: new Set() }; // estado da visita (não vai para o save)
  const quem = { nome: `${f.nome} (${(AG_PARENTES[f.par] || [])[1] || 'família'} d${agmO(j)} ${agPrimeiro(j)})`, look: f.look };
  const titulo = `👪 Visita à família de ${agPrimeiro(j)}`;
  const info = extra => el('span', {}, el('b', {}, agmPacEl(v.pac)), ` · ${AGM_ARQUETIPOS[f.arq][0]}`, f.rival ? ' · 😬 tem outra agência rondando' : '',
    Object.keys(f.sabe).length ? el('div', {}, '🔎 Já sabe: ' + Object.keys(f.sabe).map(n => AGM_NECESSIDADES[n] + (n === f.need[0] ? ' (principal)' : '')).join(', ')) : '',
    Object.keys(f.nao).length ? el('div', {}, '✖️ Não liga para: ' + Object.keys(f.nao).map(n => AGM_NECESSIDADES[n]).join(', ')) : '', extra ? el('div', {}, extra) : '');
  const med = d => ({ rot: '🤝 Confiança da família', v: f.confianca, delta: d });
  const muda = (d, irrita) => { f.confianca = clamp(Math.round(f.confianca + d), 0, 100); if (irrita) v.pac -= 2; return d; };
  const acabou = (fala, voce) => { f.voltaSem = a.semana + 1; salvar();
    agDialogo({ titulo, quem, voce, txt: fala, info: info('A paciência acabou. A confiança que você ganhou fica guardada para a próxima visita.'), medidor: med(), ops: [{ txt: '↩ Voltar para a agência', fn: () => abreAgencia3('olheiros') }] }); };
  // 1) abertura
  const abre = AGM_ARQ_ABRE[f.arq](j) + (f.rival && f.visitas === 1 ? ' Aliás, outra agência também passou aqui esta semana.' : '');
  if (f.visitas > 1) return sondagem(`Você de novo? Pode entrar, vamos continuar a conversa.`, null, 0);
  agDialogo({ titulo, quem, txt: abre, info: info(`Primeira impressão: escolha o tom. ${j.nome}, ${agmIdade(j) | 0} anos, ${AGM_POS[j.pos][0]}.`), medidor: med(),
    ops: Object.entries(AGM_TONS).map(([tom, [fala, reac]]) => ({ txt: fala, fn: () => {
      let [d, irr, resp] = reac[f.arq];
      if (tom === 'confiante') { const extra = a.nivel >= 3 ? 5 : -5; d += extra; resp += a.nivel >= 3 ? ' (Ouvi falar bem da sua agência.)' : ' (Nunca ouvi falar da sua agência...)'; }
      sondagem(resp, fala, muda(d, irr));
    } })) });
  // 2) sondagem
  function sondagem(fala, voce, d) {
    if (v.pac <= 0) return acabou('Olha, já está ficando tarde... Volta outra semana que a gente continua.', voce);
    const ops = [];
    for (const [id, txt, nec] of AGM_PERGUNTAS) if (!v.falas.has(id) && !(nec !== 'principal' && (f.sabe[nec] || f.nao[nec])) && !(nec === 'principal' && f.sabe[f.need[0]]))
      ops.push({ txt: agmTxtJ(txt, j), sub: '1 de paciência', fn: () => pergunta(id, txt, nec) });
    if (f.arq === 'tio' && !f.tioOuvido) ops.push({ txt: '🙋 “E o senhor, tio, o que acha de tudo isso?”', sub: '1 de paciência', fn: () => { v.pac--; f.tioOuvido = true; sondagem('Finalmente alguém me pergunta! Eu acho que o garoto tem que render... pra todo mundo, né?', '🙋 “E o senhor, tio, o que acha?”', muda(10)); } });
    if (!v.falas.has('plano')) ops.push({ txt: '📋 Apresentar um plano de carreira por etapas', sub: '1 de paciência', fn: () => { v.falas.add('plano'); v.pac--; const dd = f.arq === 'estruturada' ? 15 : f.arq === 'desconfiada' ? 5 : 3; sondagem(f.arq === 'estruturada' ? 'Isso! Etapas, metas, prazos. Agora estamos conversando.' : 'Hum, pelo menos tem um plano.', '📋 “Este é o plano: base, peneiras, contrato aos 17...”', muda(dd)); } });
    if (!v.falas.has('promessa')) ops.push({ txt: `🌈 “Prometo: ${agmEle(j)} vai ser craque da seleção!”`, sub: '1 de paciência', fn: () => { v.falas.add('promessa'); v.pac--; const irr = f.arq === 'pai_ambicioso' || f.arq === 'estruturada'; sondagem(irr ? 'Promessa eu não como. Quero saber o que é concreto.' : 'Tomara, né...', '🌈 “Vai ser craque da seleção!”', muda(irr ? -10 : -3, irr)); } });
    ops.push({ txt: '📝 Fazer a proposta', cls: 'amarelo', fn: () => proposta() }, { txt: '🚪 Encerrar a visita por hoje', cls: 'cinza', fn: () => { salvar(); abreAgencia3('olheiros'); } });
    agDialogo({ titulo, quem, voce, txt: fala, info: info(), medidor: med(d), ops });
  }
  function pergunta(id, txt, nec) {
    v.falas.add(id); v.perguntas++; v.pac--; let d = 2, fala, irr = false;
    if (nec === 'principal') { const n = f.need[0]; f.sabe[n] = true; fala = agmTxtJ(AGM_FUTURO[n], j); d = f.arq === 'mae_protetora' ? 10 : 5; }
    else {
      const k = f.need[0] === nec ? 0 : f.need[1] === nec ? 1 : 2; fala = agmTxtJ(AGM_RESP[nec][k], j);
      if (k < 2) f.sabe[nec] = true; else f.nao[nec] = true;
      if (nec === 'dinheiro' && f.arq === 'mae_protetora' && v.perguntas <= 2) { irr = true; d = -10; fala = 'Dinheiro?! Logo de cara? ' + fala; } // falar de dinheiro cedo irrita
    }
    sondagem(fala, agmTxtJ(txt, j), muda(d, irr));
  }
  // 3) proposta: o jogador monta as cláusulas
  function proposta(contra) {
    if (f.arq === 'avo' && v.perguntas < 2 && !v.avisouPressa) { v.avisouPressa = true; muda(-10, true); if (v.pac <= 0) return acabou('Que pressa é essa? Volta outra semana, com calma.'); }
    if (f.arq === 'tio' && !f.tioOuvido && !v.tioReclamou) { v.tioReclamou = true; muda(-15); }
    const T = v.termos || { comissao: 10, anos: 2, adiantamento: 0, ajuda: 0, bolsa: false, saida: false, restricao: false, acompanhante: false };
    const sel = (lista, val, fmtF) => el('select', {}, ...lista.map(x => el('option', { value: x, selected: x === val ? 'selected' : null }, fmtF(x))));
    const sCom = sel([5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20], T.comissao, x => `${x}%`), sAnos = sel([1, 2, 3, 4], T.anos, x => `${x} ano${x > 1 ? 's' : ''}`);
    const sAd = sel(AGM_ADIANT, T.adiantamento, x => x ? agFmt(x) : 'nenhum'), sAj = sel(AGM_AJUDA, T.ajuda, x => x ? `${agFmt(x)}/semana` : 'nenhuma');
    const chk = (v0) => { const c = el('input', { type: 'checkbox' }); c.checked = !!v0; return c; };
    const cB = chk(T.bolsa), cS = chk(T.saida), cR = chk(T.restricao), cA = chk(T.acompanhante);
    const linha = (rot, ctl, dica) => el('label', { class: 'agm-termo' }, el('span', {}, rot), ctl, el('small', {}, dica));
    const custo = el('b', {}), le = () => ({ comissao: +sCom.value, anos: +sAnos.value, adiantamento: +sAd.value, ajuda: +sAj.value, bolsa: cB.checked, saida: cS.checked, restricao: cR.checked, acompanhante: cA.checked });
    const calc = () => { const t = le(); custo.textContent = `Agora: 💰 ${agFmt(t.adiantamento)} · por semana: 💰 ${agFmt(t.ajuda + (t.bolsa ? AGM_BOLSA_SEM : 0))} enquanto durar o contrato`; };
    [sCom, sAnos, sAd, sAj, cB, cS, cR, cA].forEach(x => x.onchange = calc); calc();
    abreModal.largo = true;
    abreModal(el('h2', {}, `📝 Proposta para a família de ${agPrimeiro(j)}`), el('p', {}, info(contra ? `A família pediu ajustes: ${contra}` : 'Monte o contrato. Cada cláusula atende uma necessidade — e só a família sabe quais importam.')),
      el('div', { class: 'agm-termos' },
        linha('💼 Sua comissão', sCom, 'Quanto menor, mais agrada quem precisa de Dinheiro'), linha('📅 Duração', sAnos, 'Curto (até 2 anos) agrada Transparência'),
        linha('💵 Adiantamento', sAd, 'Pago na assinatura · atende Dinheiro'), linha('🤲 Ajuda semanal', sAj, 'Atende Dinheiro e Segurança'),
        linha('🎓 Bolsa de estudo', cB, `${agFmt(AGM_BOLSA_SEM)}/semana · atende Estudo`), linha('🚪 Cláusula de saída', cS, 'Atende Transparência'),
        linha('📍 Sem clubes longe até os 16 anos', cR, 'Atende Proximidade'), linha('🧑‍🤝‍🧑 Acompanhante em testes', cA, 'Atende Segurança')),
      el('p', {}, (v.falas.has('plano') || a.nivel >= 3) ? '⭐ Status: ' + (v.falas.has('plano') ? 'você apresentou um plano de carreira.' : 'a sua agência já é conhecida (nível 3+).') : '⭐ Status: apresente um plano de carreira na conversa para atender quem sonha alto.'),
      el('p', {}, custo),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => { v.termos = { ...le(), plano: v.falas.has('plano') || a.nivel >= 3 }; objecoes(v.termos); } }, '🤝 Apresentar a proposta'),
        el('button', { class: 'btn', type: 'button', onclick: () => sondagem('Pode perguntar mais alguma coisa, se quiser.', null, 0) }, '↩ Voltar à conversa')));
  }
  // 4) objeções
  function objecoes(T) {
    const r = agmAvaliaProposta(j, T), voce = `📝 Comissão ${T.comissao}%, ${T.anos} ano(s)${T.adiantamento ? `, adiantamento ${agFmt(T.adiantamento)}` : ''}${T.ajuda ? `, ajuda ${agFmt(T.ajuda)}/sem.` : ''}${T.bolsa ? ', bolsa' : ''}${T.saida ? ', cláusula de saída' : ''}${T.restricao ? ', sem clubes longe' : ''}${T.acompanhante ? ', acompanhante' : ''}`;
    if (G.save.ouro < T.adiantamento) return agDialogo({ titulo, quem, voce, txt: 'E esse adiantamento, você tem como pagar mesmo?', info: info('💸 Faltam tostões para o adiantamento.'), medidor: med(), ops: [{ txt: '📝 Mudar a proposta', fn: () => proposta() }] });
    if (r.decisao === 'aceita') {
      agmAssinaContrato(j, T, r);
      return agDialogo({ titulo: `✍️ ${j.nome} assinou com a ${a.nome}!`, quem, voce, txt: r.fala, info: el('span', {}, el('b', {}, r.bonus || 'Contrato assinado!'), el('div', {}, `Comissão ${T.comissao}% · ${T.anos} ano(s) · vale até a semana ${j.contrato.ateSemana}`)), medidor: med(),
        ops: [{ txt: '👤 Ver meus jogadores', cls: 'amarelo', fn: () => abreAgencia3('jogadores') }] });
    }
    if (r.decisao === 'contraproposta' && !v.revisou && v.pac > 0) {
      return agDialogo({ titulo, quem, voce, txt: r.fala, info: info('A família fez uma contraproposta. Ajustar gasta 1 de paciência.'), medidor: med(),
        ops: [{ txt: '📝 Ajustar a proposta', cls: 'amarelo', fn: () => { v.revisou = true; v.pac--; proposta(r.pede); } }, { txt: '🚪 Pensar e voltar outra semana', cls: 'cinza', fn: () => { f.voltaSem = a.semana + 1; salvar(); abreAgencia3('olheiros'); } }] });
    }
    // recusa (ou a contraproposta de novo sem paciência)
    f.recusas = (f.recusas || 0) + 1; muda(-10);
    if (f.recusas >= 2) {
      a.candidatos.splice(a.candidatos.indexOf(j), 1); agmGanhaRep(a, AGM_REP_GANHO.familiaInsatisfeita); salvar();
      return agDialogo({ titulo: '❌ Não deu certo', quem, voce, txt: f.rival ? 'Desculpa... fechamos com a outra agência. A proposta deles foi melhor.' : 'Não, obrigad' + (AG_PARENTES[f.par] && AG_PARENTES[f.par][2] ? 'a' : 'o') + '. Vamos seguir outro caminho.',
        info: `${j.nome} saiu da sua lista e a família saiu insatisfeita (reputação ${AGM_REP_GANHO.familiaInsatisfeita}). Dica: descubra as necessidades antes de propor.`, ops: [{ txt: '↩ Voltar para a agência', fn: () => abreAgencia3('olheiros') }] });
    }
    f.voltaSem = a.semana + 1; salvar();
    agDialogo({ titulo: '❌ A família recusou', quem, voce, txt: r.fala, info: info('Você pode tentar de novo a partir da próxima semana. Uma segunda recusa e a família desiste.'), medidor: med(-10), ops: [{ txt: '↩ Voltar para a agência', fn: () => abreAgencia3('olheiros') }] });
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
  if (!ok0) pede = { estudo: 'e a escola?', dinheiro: 'precisamos de uma ajuda em dinheiro', proximidade: 'não queremos clube longe tão cedo', seguranca: 'queremos alguém acompanhando', status: 'queremos ver o plano para um clube grande', transparencia: 'contrato curto e com saída' }[f.need[0]];
  else if (!ok1) pede = { estudo: 'uma ajuda com os estudos', dinheiro: 'um adiantamento ajudaria', proximidade: 'que fique perto de casa no começo', seguranca: 'alguém de confiança nos testes', status: 'mostrar que dá para chegar longe', transparencia: 'um contrato mais curto' }[f.need[1]];
  else if (T.comissao > 10) pede = 'essa comissão está alta';
  if (decisao === 'aceita') fala = { pai_ambicioso: 'Fechado! Agora é com você: quero ver resultado.', mae_protetora: `Tá bom... cuida bem ${agmDele(j)}, viu? Confio em você.`, avo: 'Que Deus abençoe essa parceria. Pode contar com a gente pra sempre.', desconfiada: 'Contrato claro, do jeito certo. Assim dá. Vou falar bem de você por aí.', tio: 'Negócio fechado, sócio! A gente se fala... depois.', estruturada: 'Excelente. Plano aprovado.' }[f.arq];
  else if (decisao === 'contraproposta') fala = `${f.rival ? 'A outra agência ofereceu condições boas também... ' : ''}Quase lá. Mas ${pede || 'dá pra melhorar um pouco'}.`;
  else fala = `${f.rival ? 'A outra agência ofereceu mais. ' : ''}Não, assim não dá. ${pede ? pede[0].toUpperCase() + pede.slice(1) + '.' : ''}`;
  return { nota, decisao, bem, pede, fala };
}
function agmAssinaContrato(j, T, r) {
  const a = agDados(), s = G.save, f = j.fam;
  s.ouro -= T.adiantamento; a.candidatos.splice(a.candidatos.indexOf(j), 1);
  j.fase = 'desenvolvimento'; j.contrato = { ...T, ateSemana: a.semana + T.anos * 52, desde: a.semana }; j.confianca = clamp(Math.round(f.confianca), 30, 100);
  let bonus = '';
  if (r.bem) {
    if (f.arq === 'mae_protetora') { j.confianca = Math.min(100, j.confianca + 20); bonus = '💞 Mãe protetora bem atendida: confiança inicial alta!'; }
    else if (f.arq === 'avo') { j.pers.lealdade = 100; if (!j.revelados.includes('lealdade')) j.revelados.push('lealdade'); bonus = '❤️ Criado pela avó, bem atendido: lealdade máxima à agência!'; }
    else if (f.arq === 'desconfiada') { (a.indicacoes = a.indicacoes || []).push({ sem: a.semana + 4, regiao: j.regiao, de: j.nome }); bonus = '📣 Família desconfiada bem atendida: vai indicar outro garoto em breve!'; }
    else if (f.arq === 'tio') { j.tioCobra = a.semana + agRi(10, 30); bonus = '🤫 O tio sumiu da história... por enquanto.'; }
    else if (f.arq === 'pai_ambicioso') bonus = '💼 Pai ambicioso bem atendido: aceitou a sua comissão.';
    else if (f.arq === 'estruturada') bonus = '📋 Família estruturada bem atendida: topa contrato longo.';
  }
  const t = agPega(Object.keys(AGM_TRACOS).filter(x => !j.revelados.includes(x))); if (t) j.revelados.push(t); // convivendo, você descobre mais um traço
  a.jogadores.push(j); a.marcos.assinados++; agmHist(j, `assinou com a agência (comissão ${T.comissao}%, ${T.anos} ano(s))`);
  log(`✍️ ${j.nome} agora é da ${a.nome}!`, 'l-loot'); try { som('moeda'); } catch (e) { }
  agmConfereNivel(a); salvar(); r.bonus = bonus;
}
// toda semana: ajuda e bolsa do contrato; indicações da família desconfiada
AGM_GANCHOS_SEMANA.push(function (a, lin) {
  const s = G.save;
  for (const j of a.jogadores) {
    const c = j.contrato; if (!c || a.semana > c.ateSemana) continue;
    const v = (c.ajuda || 0) + (c.bolsa ? AGM_BOLSA_SEM : 0); if (!v) continue;
    if (s.ouro >= v) s.ouro -= v; else { j.confianca = Math.max(0, j.confianca - 5); lin(`💸 Faltaram tostões para a ajuda/bolsa de ${agPrimeiro(j)}: a confiança da família caiu.`, 1, j.id); }
  }
  for (const ind of (a.indicacoes || []).slice()) if (a.semana >= ind.sem) {
    a.indicacoes.splice(a.indicacoes.indexOf(ind), 1);
    const ol = a.olheiros.slice().sort((x, y) => y.olho - x.olho)[0], c = agmNovoCandidato(a, ind.regiao, ol || null);
    if (!c.faixa) c.faixa = { ...agmFaixa(c.P, agmMargem(10)), ol: null, olNome: 'indicação', olho: 10, reobs: 0 };
    c.fam.confianca = Math.min(100, c.fam.confianca + 15); a.candidatos.push(c); lin(`📣 A família de ${ind.de} indicou ${c.nome} (${agmIdade(c) | 0} anos, ${AGM_POS[c.pos][0]}): ${agmEstrelasTxt(c.faixa)}. A família já chega confiando em você.`, 1);
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
