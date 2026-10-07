/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🃏 AGÊNCIA 3.0 — ETAPA 7: EVENTOS (v342). Do documento do dono: no início de cada semana, 0 a 2 eventos entre os
   jogadores agenciados, pesados pelos traços deles (Viciado em videogame — antes "Baladeiro", v407 U2 — puxa eventos de madrugada, Temperamento alto puxa brigas...).
   Cada evento é uma CARTA com duas escolhas (sistema de cartas da etapa 3), com 2–3 variações de texto e os nomes do
   garoto e do familiar. Sem resposta em 4 semanas, vale o "padrão". As 14 cartas do documento + o tio que volta para
   cobrar (Etapa 4). Escolhas que custam "1 ação" usam uma ação desta semana (ou da próxima, se acabaram).
   Carregar DEPOIS de agencia_carreira.js.
   ============================================================ */
const agmFam = j => (j.fam && j.fam.nome) || 'the family', agmNome = j => agPrimeiro(j);
const agmVar = (...l) => agPega(l); // variações de texto
function agmGastaAcao(a) { if (a.acoes > 0) a.acoes--; else a.devidas = (a.devidas || 0) + 1; }
function agmRevela(j, t) { if (!j.revelados.includes(t)) j.revelados.push(t); }
const agmMuda = (j, k, n) => { if (k in j.estado) j.estado[k] = clamp(Math.round(j.estado[k] + n), 0, 100); else if (k === 'confianca') j.confianca = clamp(Math.round(j.confianca + n), 0, 100); else if (k === 'visib') j.visib = clamp(j.visib + n, 0, 100); else j.pers[k] = clamp(Math.round(j.pers[k] + n), 0, 100); };
// [id, quando(j), peso(j), título, texto(j), [escolha A: [texto, efeito(a,j)]], [B], padrão = índice]
const AGM_EVENTOS = [
  ['carro_novo', j => j.fase === 'carreira' && j.pro, j => 1 + (j.pers.ambicao > 60 ? 1 : 0), '🚗 New car',
    j => agmVar(`${agmNome(j)} wants to spend the first paycheck on a red sports car.`, `${agmNome(j)} showed up to practice with a fancy car catalog and wants to buy it right now!`),
    ['🔑 Allow it (Morale +15, Discipline −5)', (a, j) => { agmMuda(j, 'moral', 15); agmMuda(j, 'disciplina', -5); return `${agmNome(j)} bought the car and is on cloud nine.`; }],
    ['🐷 Convince them to save (Morale −10, Trust +10)', (a, j) => { agmMuda(j, 'moral', -10); agmMuda(j, 'confianca', 10); return `${agmNome(j)} saved the money. ${agmFam(j)} loved your talk.`; }], 1],
  ['adiantamento', j => !!j.fam, j => 1 + (j.fam && j.fam.need.includes('dinheiro') ? 1 : 0), '💵 Loan request',
    j => agmVar(`${agmFam(j)} asked for a 50K loan to fix up the house.`, `${agmFam(j)} called: money is tight and they need a 50K advance.`),
    ['🤝 Lend it (−50K, Trust +15)', (a, j) => { if (G.save.ouro < 50000) { agmMuda(j, 'confianca', -10); return 'Not enough coins: the family got upset.'; } G.save.ouro -= 50000; agmMuda(j, 'confianca', 15); return `${agmFam(j)} was very grateful.`; }],
    ['🙅 Say no (Trust −10)', (a, j) => { agmMuda(j, 'confianca', -10); return 'The family got upset.'; }], 1],
  ['agente_rival', j => true, j => 1 + (j.pers.lealdade < 40 ? 2 : 0), '😈 Rival agent',
    j => agmVar(`A rival agent offered ${agmFam(j)} 100K under the table to switch agencies.`, `Estrela Sports is circling: they offered 100K to take ${agmNome(j)}.`),
    ['💰 Match the offer (−100K)', (a, j) => { if (G.save.ouro < 100000) return AGM_EVENTOS_POR.agente_rival[6][1](a, j); G.save.ouro -= 100000; agmMuda(j, 'confianca', 5); return `You matched the offer. ${agmNome(j)} stays.`; }],
    ['❤️ Trust the relationship', (a, j) => { agmRevela(j, 'lealdade'); if (j.pers.lealdade < 40) { agmRompe(a, j); return `${agmNome(j)} (low loyalty) left with the rival. Reputation ${AGM_REP_GANHO.rompeu}.`; } agmMuda(j, 'confianca', 5); return `${agmNome(j)} turned down the rival: "You’re my agent!"`; }], 1],
  ['polemica_redes', j => agmIdade(j) >= 15, j => 1 + (j.especiais.includes('baladeiro') ? 3 : 0) + (j.pers.disciplina < 35 ? 1 : 0), '📱 Social media drama',
    j => agmVar(`A livestream of ${agmNome(j)} playing video games until 3 a.m. went viral, and the fans didn't like it.`, `${agmNome(j)} posted a video late at night, the day before a game, and became the talk of the internet.`), // v407 (Raio-X U2): sem festa/balada
    ['📝 Official statement (Visibility −10)', (a, j) => { agmMuda(j, 'visib', -10); return 'The official statement calmed things down.'; }],
    ['🙈 Ignore it (30% chance a sponsor cancels)', (a, j) => { if (j.patrocinios.length && Math.random() < 0.3) { const p = j.patrocinios.splice((Math.random() * j.patrocinios.length) | 0, 1)[0]; return `${p.marca} canceled the sponsorship.`; } return 'Things calmed down on their own.'; }], 1],
  ['lesao_leve', j => j.estado.fadiga > 40, j => 1 + j.estado.fadiga / 40, '🤕 Minor injury',
    j => agmVar(`${agmNome(j)} has thigh pain${(j.convites || []).length ? ' well before the trial' : ''}.`, `${agmNome(j)} finished practice limping a little.`),
    ['⚡ Play anyway (25% chance of a serious injury)', (a, j) => { if (Math.random() < 0.25) { j.lesao = Math.max(j.lesao, agRi(6, 10)); agmMuda(j, 'moral', -10); return `Serious injury: out${agmO(j)} for ${j.lesao} weeks.`; } return 'Played and felt nothing. Phew!'; }],
    ['🧊 Hold off (misses the next trial, Morale −5)', (a, j) => { j.convites = []; agmMuda(j, 'moral', -5); agmMuda(j, 'fadiga', -20); return 'Rested. The trial will have to wait.'; }], 1],
  // v407 (Raio-X U2): o evento de namoro virou "saudade da família" (o id 'namorada' fica, por causa dos saves)
  ['namorada', j => agmIdade(j) >= 15, j => 1, '🏠 Homesick',
    j => agmVar(`${agmNome(j)} is very homesick and asks you to turn down clubs in other cities.`, `${agmNome(j)} called crying, missing the family, and won't even hear about playing far away.`),
    ['💞 Support them and stay close to home (Morale +10, Ambition −5)', (a, j) => { agmMuda(j, 'moral', 10); agmMuda(j, 'ambicao', -5); agmRevela(j, 'ambicao'); return `${agmNome(j)} is happy.`; }],
    ['🗣️ Talk about the career (Morale −10)', (a, j) => { agmMuda(j, 'moral', -10); return 'It was a hard talk, but an honest one.'; }], 0],
  ['escola', j => agmIdade(j) < 18, j => 1 + (j.fam && j.fam.need.includes('estudo') ? 1 : 0), '📚 Low grades',
    j => agmVar(`${agmNome(j)}’s grades dropped and ${agmFam(j)} is worried${j.fam && AG_PARENTES[j.fam.par] && !AG_PARENTES[j.fam.par][2] ? '' : ''}.`, `The school called ${agmFam(j)} in: ${agmNome(j)} is struggling in math.`),
    ['📖 Pay for tutoring (−30K, Trust +10)', (a, j) => { if (G.save.ouro >= 30000) G.save.ouro -= 30000; agmMuda(j, 'confianca', 10); return 'The tutoring worked: the grades are going up again.'; }],
    ['⚽ Put soccer first (Trust −15)', (a, j) => { agmMuda(j, 'confianca', -15); return 'The family didn’t like that at all.'; }], 0],
  ['briga_treino', j => !!j.clube, j => 0.5 + j.pers.temperamento / 30, '😤 Fight at practice',
    j => agmVar(`${agmNome(j)} had a big argument with the coach.`, `${agmNome(j)} stormed out of practice, slamming the door after a scolding.`),
    ['🙇 Demand an apology (Temper −5)', (a, j) => { agmMuda(j, 'temperamento', -5); agmRevela(j, 'temperamento'); return `${agmNome(j)} apologized to the coach.`; }],
    ['🛡️ Defend the player (Loyalty +10, club −10)', (a, j) => { agmMuda(j, 'lealdade', 10); j.clubeRel = (j.clubeRel || 0) - 10; agmRevela(j, 'temperamento'); return 'The player was grateful; the club frowned.'; }], 0],
  ['convite_idolo', j => true, j => 0.5, '🌟 An idol’s invitation',
    j => agmVar(`A former national team star wants to mentor ${agmNome(j)}.`, `A retired idol saw ${agmNome(j)} play and wants to help.`),
    ['✅ Accept (Stability +15, −1 action)', (a, j) => { agmGastaAcao(a); agmMuda(j, 'estabilidade', 15); agmRevela(j, 'estabilidade'); return `${agmNome(j)} got a top-notch mentor.`; }],
    ['🙅 Decline', () => 'Maybe next time.'], 1],
  ['saudade', j => j.clube && j.clube.longe && !j.adaptado, j => 2 + j.pers.saudade / 30, '📞 Homesick',
    j => agmVar(`${agmNome(j)} called crying and wants to come home.`, `${agmNome(j)} won’t stop talking about home. Being away from family is hard.`),
    ['🚗 Visit (−1 action, Morale +20)', (a, j) => { agmGastaAcao(a); j.visitaSem = a.semana; agmMuda(j, 'moral', 20); return 'The visit made all the difference.'; }],
    ['✈️ Send the family over (−40K, Morale +15)', (a, j) => { if (G.save.ouro >= 40000) G.save.ouro -= 40000; j.visitaSem = a.semana; agmMuda(j, 'moral', 15); return `${agmFam(j)} came to visit. What a joy!`; }], 1],
  ['proposta_varzea', j => agmIdade(j) < 18 && j.fase === 'desenvolvimento', j => 1, '🏆 Sandlot league offer',
    j => agmVar(`An amateur team offers a 20K prize for ${agmNome(j)} to play in the neighborhood final.`, `The sandlot crew wants ${agmNome(j)} in Sunday’s final: a 20K prize!`),
    ['✅ Allow it (+20K, injury risk)', (a, j) => { G.save.ouro += 20000; if (Math.random() < 0.2) { j.lesao = Math.max(j.lesao, agRi(1, 3)); return `Won the prize... but got hurt (${j.lesao} wk.).`; } agmMuda(j, 'moral', 5); return `${agmNome(j)} was the star of the final!`; }],
    ['🙅 Forbid it (Morale −5)', (a, j) => { agmMuda(j, 'moral', -5); return 'Got upset, but understood.'; }], 1],
  ['imprensa', j => j.visib >= 30, j => 1, '🎤 Interview',
    j => agmVar(`A reporter wants to interview ${agmNome(j)}.`, `The local TV station wants ${agmNome(j)} on the sports show.`),
    ['✅ Accept (Visibility +10)', (a, j) => { agmRevela(j, 'estabilidade'); if (j.pers.estabilidade < 40 && Math.random() < 0.4) { agmMuda(j, 'visib', -5); agmMuda(j, 'moral', -5); return `Nervous${agmO(j)}, ${agmNome(j)} made a blunder on live TV...`; } agmMuda(j, 'visib', 10); return 'Nailed the interview!'; }],
    ['🙅 Decline', () => 'No interview this time.'], 1],
  ['irmao', j => !j.irmaoVisto, j => 0.5, '👦 The little brother plays too',
    j => agmVar(`${agmFam(j)} said ${agmNome(j)}’s younger brother is also really good.`, `${agmFam(j)}: "The little one is good with the ball too, you know? Come see!"`),
    ['🔎 Send a scout (new prospect)', (a, j) => { j.irmaoVisto = true; const ol = a.olheiros.slice().sort((x, y) => y.olho - x.olho)[0]; const c = agmNovoCandidato(a, j.regiao || 'varzea', ol || null); c.nome = c.nome.split(' ')[0] + ' ' + j.nome.split(' ').slice(-1)[0]; c.look.pele = j.look.pele;
      c.fam = { ...j.fam, sabe: { ...(j.fam.sabe || {}) }, nao: { ...(j.fam.nao || {}) }, visitas: 0, recusas: 0, voltaSem: null, confianca: Math.min(100, j.confianca) };
      c.faixa = { ...agmFaixa(c.P, (c.faixa ? c.faixa.mr : agmMargem(10)) / 2), ol: ol ? ol.id : null, olNome: ol ? ol.nome : 'the family', olho: ol ? ol.olho : 10, reobs: 1 }; a.candidatos.push(c); return `${c.nome} joined the prospect list (the family already trusts you).`; }],
    ['🙏 Say thanks (Trust +5)', (a, j) => { j.irmaoVisto = true; agmMuda(j, 'confianca', 5); return 'The family was glad for the attention.'; }], 1],
  ['tio_cobra', j => j.tioCobra != null && agDados().semana >= j.tioCobra, j => 100, '🤑 The uncle is back',
    j => `${agmNome(j)}’s uncle showed up again: he says he "helped close the deal" and wants 50K.`,
    ['💵 Pay (−50K)', (a, j) => { delete j.tioCobra; if (G.save.ouro >= 50000) G.save.ouro -= 50000; return 'The uncle disappeared again, satisfied.'; }],
    ['🙅 Refuse (Trust −20)', (a, j) => { delete j.tioCobra; agmMuda(j, 'confianca', -20); return 'The uncle threw a fit and the family was shaken.'; }], 1],
];
const AGM_EVENTOS_POR = Object.fromEntries(AGM_EVENTOS.map(e => [e[0], e]));
function agmRompe(a, j) { a.jogadores.splice(a.jogadores.indexOf(j), 1); a.rotina = (a.rotina || []).filter(r => r.jog !== j.id); agmGanhaRep(a, AGM_REP_GANHO.rompeu); }
// registra as cartas (o texto é sorteado na hora e guardado na carta)
for (const [id, , , titulo, , A, B, pad] of AGM_EVENTOS) {
  AGM_CARTAS['ev_' + id] = { titulo,
    txt: (a, d) => d.txt || '',
    ops: [A, B].map(([t, fn]) => [t, (a, d) => { const j = a.jogadores.find(x => x.id === d.jog); if (!j) return 'The player isn’t with the agency anymore.'; const r = fn(a, j); agmHist(j, `${titulo}: ${r}`); return r; }]),
    padrao: (a, d) => { const j = a.jogadores.find(x => x.id === d.jog); if (!j) return 'The player isn’t with the agency anymore.'; const r = [A, B][pad][1](a, j); agmHist(j, `${titulo}: ${r}`); return `${titulo} — ${r}`; } };
}
// toda semana: 0 a 2 eventos (um por jogador de cada vez), pesados pelos traços; e as ações devidas
AGM_GANCHOS_SEMANA.push(function (a, lin) {
  if (a.devidas) { const d = Math.min(a.devidas, a.acoes); a.acoes -= d; a.devidas -= d; }
  const ocupados = new Set((a.cartas || []).filter(c => c.tipo.startsWith('ev_')).map(c => c.dados.jog));
  // o tio cobra na hora certa
  for (const j of a.jogadores) if (!ocupados.has(j.id) && AGM_EVENTOS_POR.tio_cobra[1](j)) { agmCriaEvento(a, j, 'tio_cobra', lin); ocupados.add(j.id); }
  const r = Math.random(), n = r < 0.55 ? 0 : r < 0.9 ? 1 : 2;
  for (let k = 0; k < n; k++) {
    const opcoes = [];
    for (const j of a.jogadores) if (!ocupados.has(j.id)) for (const e of AGM_EVENTOS) if (e[0] !== 'tio_cobra' && e[1](j)) opcoes.push([j, e[0], e[2](j)]);
    const tot = opcoes.reduce((t, o) => t + o[2], 0); if (!tot) break;
    let x = Math.random() * tot; const [j, id] = opcoes.find(o => (x -= o[2]) <= 0) || opcoes[opcoes.length - 1];
    agmCriaEvento(a, j, id, lin); ocupados.add(j.id);
  }
});
function agmCriaEvento(a, j, id, lin) { const e = AGM_EVENTOS_POR[id]; agmCarta(a, 'ev_' + id, { jog: j.id, txt: e[4](j) }, lin); }
// v407 (Raio-X U2): saves antigos — patrocínio de aposta/cerveja, "Baladeiro" e namoro que já estavam no save viram as
// versões para criança (marca refri/joguinho, carta de saudade da família, polêmica do videogame de madrugada).
function agmAtualizaTextosInfantis(s = G.save) {
  const a = s && s.agencia; if (!a || typeof a !== 'object' || !Array.isArray(a.jogadores)) return;
  const troca = m => typeof m !== 'string' ? m : /Aposta Certa/i.test(m) ? AGM_PATRO_POLEMICAS[1] : /Cerveja/i.test(m) ? AGM_PATRO_POLEMICAS[0] : m;
  for (const j of a.jogadores) {
    for (const p of [...(j.patrocinios || []), ...(j.ofertasPatro || [])]) p.marca = troca(p.marca);
    if (Array.isArray(j.hist)) j.hist = j.hist.map(t => typeof t !== 'string' ? t : t.replace('💌 Dating', '🏠 Homesick').replace(/Aposta Certa \(site de apostas\)/g, 'Thousand Ads Game').replace(/Cerveja Gelada/g, 'Mega Sugar Soda'));
  }
  for (const c of a.cartas || []) {
    const j = a.jogadores.find(x => x.id === (c.dados && c.dados.jog)); if (!j || !c.dados) continue;
    if (c.tipo === 'ev_namorada' && /namor/i.test(c.dados.txt || '')) c.dados.txt = AGM_EVENTOS_POR.namorada[4](j);
    if (c.tipo === 'ev_polemica_redes' && /festa|balada/i.test(c.dados.txt || '')) c.dados.txt = AGM_EVENTOS_POR.polemica_redes[4](j);
  }
}
{ const _iniAgmU2 = iniciarJogo; iniciarJogo = async function () { try { if (arguments[0]) agmAtualizaTextosInfantis(arguments[0]); } catch (e) { } return _iniAgmU2.apply(this, arguments); }; }
