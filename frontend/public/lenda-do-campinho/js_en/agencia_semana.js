/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📅 AGÊNCIA 3.0 — ETAPA 2: O CICLO SEMANAL (v336). Decisões do dono:
   - 1 semana = 30 min de relógio de verdade, ou antes pelo botão ⏩ Passar a semana (v346; com o jogo fechado conta até 10 h = 20 semanas; o Modo Treino pausa);
   - 3 ações por semana para a AGÊNCIA inteira (+1 por nível), divididas entre os garotos;
   - ROTINA MONTADA: você monta os slots da semana uma vez (jogador + ação); nas semanas em que você não usar as
     ações, a rotina roda sozinha rendendo 75%; com fadiga acima de 70 ou sem tostões, o slot vira Descanso;
   - a cada semana: salário dos olheiros, missões, a rotina, fadiga e lesão, idade, candidatos que desistem,
     e o relatório da secretária (com o resumo de quando você esteve fora).
   Telas novas: 📅 Semana · 👤 Jogadores · 🔁 Rotina · 🔎 Olheiros · 🏢 Agência.
   Liga SÓ com AGM_ATIVO (modo de teste) — ver agencia_modelo.js. Peneiras/testes (Etapa 5), a conversa com a família
   (Etapa 4), carreira (Etapa 6) e eventos (Etapa 7) entram nas próximas etapas.
   Carregar DEPOIS de agencia_modelo.js.
   ============================================================ */
const AGM_ACOES = { // [nome, custo, fadiga, efeito, vai na rotina?]
  treino: ['🎯 Focused Training', 40000, 20, '+1 to +2 in the chosen attribute (gives less near the ceiling)', 1],
  fisico: ['🏃 Fitness Training', 15000, 15, '+Physical and less risk of injury later on', 1],
  descanso: ['😴 Rest', 0, -40, 'Fatigue −40, Morale +5', 1],
  visita: ['🏠 Family Visit', 0, 0, 'Trust +8, Morale +10', 1],
  jogo: ['⚽ League Game', 0, 10, '+Visibility and form', 1],
  redes: ['📱 Social Media Content', 0, 0, '+Visibility (repeating within 4 weeks: −Discipline)', 1],
  mentor: ['🧠 Mentor / Sports Psychologist', 60000, 0, '+Emotional stability, −Temper', 1],
};
let AGM_GANHO_BASE = 1.5, /* v407: era 0.6 (o texto prometia +1 a +2 e dava 0,3–0,8) */ AGM_AUTO = 0.75, AGM_FADIGA_LIMITE = 70, AGM_ESPERA_CANDIDATO = 8;
const AGM_TREINA = new Set(['treino', 'fisico', 'jogo']); // não dá com lesão
const AGM_GANCHOS_SEMANA = []; // funções (a, lin) que rodam na virada de cada semana
const AGM_ACAO_TELA = {};      // ações com tela própria (peneira, teste...): id → função(j)
function agmMaxOlheiros(a) { return a.nivel + 1; } // v345: função (a versão Steam pode aumentar)

/* ---------- uma ação num garoto ---------- */
// manual: rende 100% e gasta uma ação da semana; auto (rotina): rende 75% e tem a proteção do dono
function agmAplicaAcao(a, j, acao, at, auto) {
  const s = G.save, A = AGM_ACOES[acao]; if (!A || !j) return { erro: 'Unknown action.' };
  const mult = auto ? AGM_AUTO : 1, e = j.estado;
  let custo = A[1], virou = null;
  if (j.lesao > 0 && AGM_TREINA.has(acao)) { if (!auto) return { erro: `${j.nome} is injured${j.menina ? '' : ''} (${j.lesao} week(s)).` }; virou = 'injury'; }
  else if (s.ouro < custo) { if (!auto) return { erro: 'Not enough coins.' }; virou = 'no coins'; }
  else if (auto && e.fadiga + Math.max(0, A[2]) > AGM_FADIGA_LIMITE) virou = 'fadiga alta';
  if (virou) { acao = 'descanso'; custo = 0; }
  s.ouro -= custo;
  const antes = { ovr: agmOverall(j) }; let txt = '';
  const mClube = j.clube && j.clube.degrau && AGM_CLUBES_BASE[j.clube.degrau] ? AGM_CLUBES_BASE[j.clube.degrau][4] : 1;
  if (acao === 'treino') {
    at = at && j.atr[at] != null ? at : agmPiorAtr(j);
    const g = agmGanho(j, at, AGM_GANHO_BASE * agRnd(0.8, 1.2), mClube) * mult; j.atr[at] = Math.min(agmTeto(j.P), j.atr[at] + g); // sem arredondar: ganhos pequenos (perto do teto) não podem sumir
    e.fadiga += 20; e.forma = Math.min(100, e.forma + 3); txt = `${AGM_ATR[at]} +${agmN(g)}`;
  } else if (acao === 'fisico') {
    const g = agmGanho(j, 'fis', AGM_GANHO_BASE * 0.8 * agRnd(0.8, 1.2), mClube) * mult; j.atr.fis = Math.min(agmTeto(j.P), j.atr.fis + g);
    j.preparo = Math.min(30, (j.preparo || 0) + 3 * mult); e.fadiga += 15; txt = `Physical +${agmN(g)}, fitness ${Math.round(j.preparo)}%`;
  } else if (acao === 'descanso') { e.fadiga -= 40; e.moral += 5 * mult; txt = 'descansou'; }
  else if (acao === 'visita') { j.visitaSem = a.semana; j.confianca = Math.min(100, (j.confianca || 0) + 8 * mult); e.moral += 10 * mult; txt = `trust ${Math.round(j.confianca)}`; }
  else if (acao === 'jogo') {
    const v = agRnd(2, 4) * mult + (j.especiais.includes('pe_quente') ? 1 : 0) + (Math.random() < 0.1 ? 4 : 0); j.visib = Math.min(100, j.visib + v);
    e.forma = Math.min(100, e.forma + 5); e.fadiga += 10; txt = `visibility +${v.toFixed(0)}`;
  } else if (acao === 'redes') {
    const v = 2 * mult; j.visib = Math.min(100, j.visib + v); const repetiu = j.redesSem != null && a.semana - j.redesSem < 4; j.redesSem = a.semana;
    if (repetiu) j.pers.disciplina = Math.max(0, j.pers.disciplina - 2); txt = `visibility +${v.toFixed(0)}${repetiu ? ', discipline −2' : ''}`;
  } else if (acao === 'mentor') { j.pers.estabilidade = Math.min(100, j.pers.estabilidade + 3 * mult); j.pers.temperamento = Math.max(0, j.pers.temperamento - 3 * mult); txt = 'stability +, temper −'; }
  e.fadiga = clamp(Math.round(e.fadiga), 0, 100); e.moral = clamp(Math.round(e.moral), 0, 100);
  j.ovrMax = Math.max(j.ovrMax || 0, agmOverall(j));
  const nome = AGM_ACOES[acao][0];
  return { acao, virou, custo, txt: `${nome}${txt ? ': ' + txt : ''}${virou ? ` (routine switched to Rest: ${virou})` : ''}`, dOvr: agmOverall(j) - antes.ovr };
}
// treino automático: o fundamento que mais faz o overall subir agora (peso da posição × espaço até o teto)
function agmPiorAtr(j) { const p = AGM_POS[j.pos][1], t = agmTeto(j.P), rende = k => (p[k] || 0.5) * agmFalta(j, k); void t; return agmAtrDe(j.pos).slice().sort((x, y) => rende(y) - rende(x))[0]; }
// ação escolhida na hora (gasta 1 das ações da semana)
function agmUsaAcao(j, acao, at) {
  const a = agDados(); if (!a || a.acoes <= 0) return { erro: 'You’re out of actions this week.' };
  const r = agmAplicaAcao(a, j, acao, at, false); if (r.erro) return r;
  a.acoes--; agmHist(j, r.txt); salvar(); return r;
}
function agmHist(j, txt) { const a = agDados(); j.hist.unshift(`S${a ? a.semana : 0}: ${txt}`); j.hist = j.hist.slice(0, 8); }

/* ---------- a virada da semana ---------- */
function agmViraSemana(a) {
  const s = G.save, L = []; const lin = (txt, imp, jog) => L.push({ txt, imp: !!imp, jog });
  // 1) salário dos olheiros (sem dinheiro: não recebem e a lealdade cai)
  const folha = a.olheiros.reduce((t, o) => t + o.salario, 0);
  if (folha) { if (s.ouro >= folha) { s.ouro -= folha; a.olheiros.forEach(o => { if (o.lealdade < 80) o.lealdade++; }); } else { a.olheiros.forEach(o => { o.lealdade = Math.max(0, o.lealdade - 10); }); lin(`💸 Not enough coins for the scouts' salaries (${agFmt(folha)}). Their loyalty dropped.`, 1); } }
  // 2) a rotina ocupa as ações que sobraram (75%)
  let livres = a.acoes;
  for (const sl of a.rotina || []) {
    if (livres <= 0) break; const j = a.jogadores.find(x => x.id === sl.jog); if (!j) continue;
    const r = agmAplicaAcao(a, j, sl.acao, sl.at, true); livres--; agmHist(j, '🔁 ' + r.txt); lin(`🔁 ${agPrimeiro(j)}: ${r.txt}`, !!r.virou, j.id);
  }
  // 3) cada garoto: recupera um pouco, lesões, idade
  for (const j of a.jogadores) {
    const e = j.estado;
    e.fadiga = Math.max(0, e.fadiga - 20); /* v407: era 10 */
    // v407: quem está num clube (base ou profissional) e não está machucado evolui um pouco jogando, toda semana
    if (j.clube && !(j.lesao > 0)) { const mC = j.clube.degrau && AGM_CLUBES_BASE[j.clube.degrau] ? AGM_CLUBES_BASE[j.clube.degrau][4] : 1; for (const k of agmAtrDe(j.pos)) j.atr[k] = Math.min(agmTeto(j.P), j.atr[k] + 0.08 * agmFIdadeTreino(agmIdade(j)) * agmFalta(j, k) * mC); j.ovrMax = Math.max(j.ovrMax || 0, agmOverall(j)); }
    e.forma += e.forma > 50 ? -2 : e.forma < 50 ? 2 : 0; e.moral += e.moral > 60 ? -1 : e.moral < 60 ? 1 : 0;
    if (j.lesao > 0) { j.lesao--; if (!j.lesao) lin(`💚 ${agPrimeiro(j)} recovered from the injury and can train again.`, 1, j.id); }
    else if (Math.random() < agmRiscoLesao(e.fadiga) * (1 - (j.preparo || 0) / 100)) { j.lesao = agRi(1, 4); e.moral = Math.max(0, e.moral - 10); agmHist(j, `injury (${j.lesao} weeks)`); lin(`🤕 ${agPrimeiro(j)} got hurt from being so tired (fatigue ${e.fadiga}): out${j.menina ? '' : ''} for ${j.lesao} week(s).`, 1, j.id); }
    j.idadeSem++;
    if (j.idadeSem % 52 === 0) { const an = j.idadeSem / 52; lin(`🎂 ${agPrimeiro(j)} turned ${an}!${an === 17 ? ' Old enough for a first pro contract.' : ''}`, 1, j.id); }
  }
  // 4) missões dos olheiros que voltaram (v337: reobservar também ocupa o olheiro por 1 semana)
  for (const o of a.olheiros) if (o.missao && o.missao.tipo === 'reobs' && a.semana + 1 >= o.missao.fim) {
    const j = a.candidatos.find(x => x.id === o.missao.cand); o.missao = null; agmExpOlheiro(o, 1, lin);
    if (j) { agmObserva(j, o, j.regiao); lin(`🔍 ${o.nome} took another look at ${j.nome}: ${agmEstrelasTxt(j.faixa)}.`, 1); }
  }
  for (const o of a.olheiros) if (o.missao && a.semana + 1 >= o.missao.fim) {
    const m = o.missao, n = agmCandidatos(o.rede, m.semanas), novos = Array.from({ length: n }, () => agmNovoCandidato(a, m.regiao, o, m.filtro || {}));
    a.candidatos.push(...novos); a.totais.descobertas += n; o.missao = null;
    const melhor = novos.reduce((x, y) => (y.faixa.hi > x.faixa.hi ? y : x));
    lin(`🔎 ${o.nome} came back from ${AGM_REGIOES[m.regiao][0]} with ${n} candidate(s). The most promising: ${melhor.nome} (${agmIdade(melhor) | 0} years old, ${AGM_POS[melhor.pos][0]}), ${agmEstrelasTxt(melhor.faixa)}.`, 1);
    agmExpOlheiro(o, m.semanas, lin);
  }
  // 4b) olheiro com lealdade baixa pode vender um relatório a uma agência rival (vira uma decisão sua)
  for (const o of a.olheiros) if (o.lealdade < 30 && Math.random() < 0.15 && !(a.cartas || []).some(c => c.tipo === 'olheiro_vendido' && c.dados.ol === o.id)) {
    const alvo = agPega(a.candidatos.filter(c => !c.fam.rival)); if (alvo) alvo.fam.rival = true;
    agmCarta(a, 'olheiro_vendido', { ol: o.id, cand: alvo ? alvo.id : null }, lin);
  }
  // 5) reobservações pedidas na semana
  for (const j of a.candidatos) if (j.reobsPend) { const o = a.olheiros.find(x => x.id === j.reobsPend) || a.olheiros[0]; j.reobsPend = null; if (o) { agmObserva(j, o, j.regiao); lin(`🔍 ${o.nome} took another look at ${j.nome}: ${agmEstrelasTxt(j.faixa)}.`, 1); } }
  // 6) candidatos esperando demais desistem (ou fecham com o rival)
  for (const j of a.candidatos.slice()) { j.espera = (j.espera || 0) + 1; j.idadeSem++; if (j.espera > AGM_ESPERA_CANDIDATO) { a.candidatos.splice(a.candidatos.indexOf(j), 1); lin(j.fam && j.fam.rival ? `😬 ${j.nome} signed with a rival agency.` : `👋 ${j.nome}'s family got tired of waiting and went another way.`, 1); }
    else if (j.fixado && j.espera === AGM_ESPERA_CANDIDATO) lin(`📌 ${j.nome}, whom you’re tracking, gives up next week if you don’t close the deal with the family.`, 1); }
  // 7) próxima semana
  a.semana++; a.acoes = agmAcoesSemana(a.nivel);
  for (const c of (a.cartas || []).slice()) if (a.semana - c.sem >= 4) { const r = agmResolveCarta(a, c.id, -1); if (r) lin(`🃏 No answer from you: ${r}`, 1); } // decisão esquecida: o padrão
  for (const g of AGM_GANCHOS_SEMANA) try { g(a, lin); } catch (e) { } // outras etapas penduram aqui o que acontece toda semana
  if (typeof agmEventosSemana === 'function') try { agmEventosSemana(a, lin); } catch (e) { }
  agmConfereNivel(a, lin);
  return L;
}
// experiência: a cada 12 semanas de trabalho, +1 num atributo (até 2 acima da faixa do nível dele)
function agmExpOlheiro(o, sem, lin) {
  const antes = Math.floor((o.exp || 0) / 12); o.exp = (o.exp || 0) + sem; if (Math.floor(o.exp / 12) <= antes) return;
  const teto = Math.min(20, AGM_OLHEIRO_NIVEIS[o.nivel][1][1] + 2), ats = ['olho', 'carater', 'rede'].filter(k => o[k] < teto); if (!ats.length) return;
  const k = agPega(ats), nome = { olho: 'technical eye', carater: 'character reading', rede: 'contact network' }[k];
  const s0 = agmSalarioOl(o); o[k]++; o.salario += agmSalarioOl(o) - s0; /* soma só a diferença: não apaga um aumento dado antes */ if (lin) lin(`📈 ${o.nome} gained experience: ${nome} ${o[k] - 1} → ${o[k]} (salary now ${agFmt(o.salario)}/week).`, 1);
}
/* ---------- cartas de decisão (2 escolhas) — a Etapa 7 reaproveita para os eventos ---------- */
// cada carta guarda só dados (tipo + ids): o texto e o efeito vêm daqui, então sobrevivem a recarregar o jogo
const AGM_CARTAS = {
  olheiro_vendido: {
    titulo: '🕵️ Bribed Scout',
    txt: (a, d) => { const o = a.olheiros.find(x => x.id === d.ol), j = a.candidatos.find(x => x.id === d.cand); return `${o ? o.nome : 'One of your scouts'} (low loyalty) passed ${j ? `the report on ${j.nome}` : 'your reports'} to a rival agency!${j ? ` Now there's a rival competing for ${agPrimeiro(j)}.` : ''}`; },
    ops: [
      ['👋 Fire', (a, d) => { const o = a.olheiros.find(x => x.id === d.ol); if (!o) return 'The scout had already left.'; a.olheiros.splice(a.olheiros.indexOf(o), 1); return `${o.nome} was fired.`; }],
      ['💰 Give a raise (+25% salary, loyalty +30)', (a, d) => { const o = a.olheiros.find(x => x.id === d.ol); if (!o) return 'The scout had already left.'; o.salario = Math.round(o.salario * 1.25); o.lealdade = Math.min(100, o.lealdade + 30); return `${o.nome} got a raise and promised to stay loyal (loyalty ${o.lealdade}).`; }],
    ],
    padrao: (a, d) => { const o = a.olheiros.find(x => x.id === d.ol); if (o) o.lealdade = Math.max(0, o.lealdade - 5); return `${o ? o.nome : 'The scout'} stays at the agency, but nobody really trusts them anymore.`; },
  },
};
function agmCarta(a, tipo, dados, lin) { (a.cartas = a.cartas || []).push({ id: 'c' + a.seq++, tipo, dados, sem: a.semana }); a.cartas = a.cartas.slice(-6); if (lin) lin(`🃏 Decision for you: ${AGM_CARTAS[tipo].titulo}`, 1); }
function agmResolveCarta(a, id, k) { // k = índice da escolha; −1 = o padrão (esqueceu)
  const c = (a.cartas || []).find(x => x.id === id); if (!c) return null; const C = AGM_CARTAS[c.tipo]; a.cartas.splice(a.cartas.indexOf(c), 1);
  if (k >= 0 && c.tipo.startsWith('ev_')) a.marcos.bons = (a.marcos.bons || 0) + 1; // v344: acontecimento resolvido por você conta na meta
  return C ? (k < 0 ? C.padrao(a, c.dados) : C.ops[k][1](a, c.dados)) : null;
}
function agmCartasEl(a) {
  if (!(a.cartas || []).length) return '';
  return el('div', { class: 'agm-cartas' }, ...a.cartas.map(c => { const C = AGM_CARTAS[c.tipo]; if (!C) return '';
    return el('div', { class: 'agm-carta' }, el('b', {}, C.titulo), el('p', {}, C.txt(a, c.dados)), el('small', {}, `Answer within ${Math.max(1, 4 - (a.semana - c.sem))} week(s).`),
      el('div', { class: 'ag-acoes' }, ...C.ops.map(([txt], k) => el('button', { class: 'btn mini' + (k ? '' : ' amarelo'), type: 'button', onclick: () => { const r = agmResolveCarta(a, c.id, k); log('🃏 ' + r, 'l-xp'); salvar(); abreAgencia3(AGM_ABA); } }, txt)))); }));
}
// o relógio: semanas inteiras que passaram desde a última; com o Modo Treino ligado, o relógio fica parado
function agmTick() {
  const s = G.save, a = agDados(); if (!s || !a || a.v !== AGM_VERSAO || !agLiberada()) return 0;
  const r = a.relogio, agora = Date.now();
  if (s.treinoOn) { const d = agora - (r.pausaUlt || agora); if (d > 0) r.ultimo += d; r.pausaUlt = agora; return 0; }
  r.pausaUlt = null;
  let n = Math.floor((agora - r.ultimo) / AGM_SEMANA_MS); if (n <= 0) return 0;
  r.ultimo += n * AGM_SEMANA_MS; const perdidas = Math.max(0, n - AGM_MAX_SEMANAS); n = Math.min(n, AGM_MAX_SEMANAS);
  const antes = new Map(a.jogadores.map(j => [j.id, { ovr: agmOverall(j), idade: agmIdade(j) | 0 }])), sem0 = a.semana; let todas = [];
  for (let k = 0; k < n; k++) todas = todas.concat(agmViraSemana(a));
  let linhas = todas;
  if (n > 1) { // muitas semanas de uma vez: resumo por garoto + só o que importa
    linhas = a.jogadores.map(j => { const b = antes.get(j.id); return b ? { txt: `👤 ${j.nome}: overall ${agmN(b.ovr)} → ${agmN(agmOverall(j))}${(agmIdade(j) | 0) > b.idade ? ` · turned ${agmIdade(j) | 0}` : ''}${j.lesao ? ` · 🤕 injured (${j.lesao} wk.)` : ''}`, imp: true, jog: j.id } : null; }).filter(Boolean)
      .concat(todas.filter(l => l.imp && !/^(🎂|🔁)/.test(l.txt)));
    const vir = todas.filter(l => /^🔁/.test(l.txt) && /virou Descanso|switched to Rest/.test(l.txt)).length; if (vir) linhas.push({ txt: `🛡️ The routine switched to Rest ${vir} time(s) to protect the kids (high fatigue or not enough coins).`, imp: true });
  }
  if (perdidas) linhas.unshift({ txt: `⏳ The agency went ${perdidas + n} weeks without you; only the last ${AGM_MAX_SEMANAS} counted.`, imp: true });
  (a.relatorios = a.relatorios || []).unshift({ de: sem0 + 1, ate: a.semana, linhas: linhas.slice(0, 60), visto: false });
  a.relatorios = a.relatorios.slice(0, 8);
  try { salvar(); } catch (e) { } agAvisa();
  return n;
}
function agmConfereNivel(a, lin) {
  while (a.nivel < 5) {
    const k = a.nivel + 1, ms = agmMetas(a, k); if (!ms.every(m => m[3])) break;
    a.nivel = k; const txt = `🎖️ YOUR AGENCY LEVELED UP: ${AGM_NIVEIS[k][1]}! Unlocked: ${AGM_NIVEIS[k][3]}, up to ${AGM_NIVEIS[k][2]} kids, ${agmAcoesSemana(k)} actions per week.`;
    try { banner('⭐ ' + AGM_NIVEIS[k][1].toUpperCase(), 'Your agency leveled up!'); som('nivel'); log('🕴️ ' + txt, 'l-lvl'); } catch (e) { }
    if (lin) lin(txt, 1); if (typeof agDecoraEscritorio === 'function') agDecoraEscritorio();
  }
}
function agmMetas(a, k) {
  if (!AGM_NIVEIS[k]) return [];
  return [[`Reach ${AGM_NIVEIS[k][0]} reputation`, x => [x.rep, AGM_NIVEIS[k][0]]], ...(AGM_METAS[k] || [])].map(([t, f]) => { const [v, alvo] = f(a); return [t, Math.min(v, alvo), alvo, v >= alvo]; });
}
function agmGanhaRep(a, n) { a.rep = clamp(Math.round((a.rep + n) * 10) / 10, 0, 100); agmConfereNivel(a); }

/* ---------- textos ---------- */
// v355: meia estrela = "½" (o ⯪ não existe nas fontes: virava quadradinho e, no começo do texto, levava as outras estrelas junto)
function agmEstrelas(v) { let t = ''; for (let i = 1; i <= 5; i++) t += v >= i ? '★' : v >= i - 0.5 ? '½' : '☆'; return t; }
function agmEstrelasTxt(f) { return f ? `potential ${agmEstrelas(f.c)} ${agmN(f.c)}★ ± ${agmN(f.m)} (from ${agmN(f.lo)} to ${agmN(f.hi)}★)` : 'potential ❔'; }
const agmN = v => String(Math.round(v * 10) / 10);
function agmProxSemana(a) { const ms = Math.max(0, AGM_SEMANA_MS - (Date.now() - a.relogio.ultimo)); return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`; }

/* ---------- telas ---------- */
let AGM_ABA = 'semana';
const AGM_ABA_V1 = { hoje: 'semana', negocios: 'semana', talentos: 'olheiros' };
function abreAgencia3(aba) {
  const a = agDados(); agmTick();
  // v357 (dono: "clico em dispensar e a página sobe pro topo"): na MESMA aba, o redesenho guarda a posição da rolagem
  const abaAntes = AGM_ABA, corpo0 = !$('#modal').hidden && document.querySelector('#modal .ag-corpo'), cont0 = $('#modalConteudo');
  const rolagem = corpo0 ? { corpo: corpo0.scrollTop, cont: cont0 ? cont0.scrollTop : 0 } : null;
  AGM_ABA = AGM_ABA_V1[aba] || aba || AGM_ABA;
  const novRel = (a.relatorios || []).filter(r => !r.visto).length;
  const abas = [['semana', `📅 Week${novRel ? ' 🔴' : ''}`], ['jogadores', '👤 Players'], ['rotina', '🔁 Routine'], ['olheiros', `🔎 Scouts${a.candidatos.length ? ` (${a.candidatos.length})` : ''}`], ['agencia', '🏢 Agency']];
  const nav = el('div', { class: 'ag-abas' }, ...abas.map(([id, nome]) => el('button', { class: 'btn mini' + (AGM_ABA === id ? ' amarelo' : ''), type: 'button', onclick: () => abreAgencia3(id) }, nome)));
  const corpo = el('div', { class: 'ag-corpo' }, ({ semana: agmTelaSemana, jogadores: agmTelaJogadores, rotina: agmTelaRotina, olheiros: agmTelaOlheiros, agencia: agmTelaAgencia })[AGM_ABA](a));
  abreModal.largo = true; abreModal(el('h2', {}, '⭐ LENDAS FC — AGENCY'), agmCabecalho(a), nav, corpo, el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Close')));
  try { agmEnfeitaEstrelas(document.querySelector('#modal .ag-corpo')); } catch (e) { }
  if (rolagem && abaAntes === AGM_ABA) { const c = document.querySelector('#modal .ag-corpo'), k = $('#modalConteudo'); if (c) c.scrollTop = rolagem.corpo; if (k) k.scrollTop = rolagem.cont; }
  agAvisa(); agMostraFila();
}
function agmCabecalho(a) {
  const relogio = el('span', { class: 'agm-relogio' }), N = AGM_NIVEIS[a.nivel];
  const atual = () => { relogio.textContent = G.save.treinoOn ? '⏸️ paused: Training Mode on' : `⏳ next week in ${agmProxSemana(a)}`; };
  atual(); const iv = setInterval(() => { if (!relogio.isConnected) return clearInterval(iv); atual(); if (Date.now() - a.relogio.ultimo >= AGM_SEMANA_MS && !G.save.treinoOn) { clearInterval(iv); abreAgencia3(AGM_ABA); } }, 1000);
  return el('div', { class: 'ag-cab' },
    el('div', { class: 'ag-cab-id' }, agImg('ag_brasao', 'ag-brasao'), el('div', {}, el('b', { class: 'ag-nome' }, a.nome), el('small', {}, `${'⭐'.repeat(a.nivel)} ${N[1]} · reputation ${agmN(a.rep)}/100`))),
    el('div', { class: 'ag-num' }, el('span', {}, `📅 Week ${a.semana}`), el('span', { class: 'agm-acoes-n' + (a.acoes ? '' : ' zero') }, `⚡ ${a.acoes}/${agmAcoesSemana(a.nivel)} actions`), relogio, G.save.treinoOn ? '' : el('button', { class: 'btn mini amarelo agm-passa', type: 'button', title: 'Ends the week now (without waiting for the clock)', onclick: () => agmPassaSemana(a) }, '⏩ End the Week'),
      el('span', {}, `👤 ${a.jogadores.length}/${agmMaxJogadores(a.nivel)}`), el('span', {}, `💰 ${agFmt(G.save.ouro)}`)));
}
// v346: o jogador vira a semana quando terminar (avisa se ainda sobram ações ou decisões)
async function agmPassaSemana(a) {
  const av = [], pend = (a.cartas || []).length;
  if (a.acoes > 0) av.push(`you still have${a.acoes > 1 ? 'm' : ''} ${a.acoes} action${a.acoes > 1 ? 's' : ''} this week (unused${a.acoes > 1 ? 'm' : ''} ones become 🔁 Routine, which only gives 75%)`);
  if (pend) av.push(`${pend} decis${pend > 1 ? 's are waiting for' : ' is waiting for'} your answer`);
  if (av.length && !(await perguntaJogo(`Go to next week? Heads up: ${av.join(' e ')}.`, { sim: '⏩ End the Week' }))) return;
  if (G.save.treinoOn || agDados() !== a) return;
  a.relogio.ultimo = Math.min(a.relogio.ultimo, Date.now() - AGM_SEMANA_MS);
  abreAgencia3('semana');
}
function agmBarra(rot, v, cor, max = 100) { return el('div', { class: 'agm-bar', title: `${rot}: ${Math.round(v)}` }, el('small', {}, rot), el('div', { class: 'agc-barra' }, el('i', { style: `width:${clamp(v / max * 100, 0, 100)}%;background:${cor}` })), el('b', {}, Math.round(v))); }
function agmEstadoEl(j) {
  const e = j.estado;
  return el('div', { class: 'agm-estado' }, agmBarra('😊 Morale', e.moral, '#3aa84a'), agmBarra('🔥 Form', e.forma, '#e0a020'), agmBarra('😓 Fatigue', e.fadiga, e.fadiga > AGM_FADIGA_LIMITE ? '#d8382a' : '#8a7ad8'),
    j.lesao ? el('b', { class: 'agm-lesao' }, `🤕 injured${j.menina ? '' : ''}: ${j.lesao} wk.`) : '');
}
function agmTelaSemana(a) {
  const box = el('div');
  const rel = (a.relatorios || [])[0];
  if (rel) {
    box.append(el('div', { class: 'agm-rel' + (rel.visto ? '' : ' novo') }, el('div', { class: 'agm-rel-cab' }, el('img', { src: 'a/ag_brasao.webp', alt: '', class: 'agm-rel-ic' }),
      el('b', {}, `📋 Report from Ms. Rosa — ${rel.de === rel.ate ? 'semana ' + rel.ate : `weeks ${rel.de} to ${rel.ate} (while you were away)`}`)),
      rel.linhas.length ? el('ul', {}, ...rel.linhas.map(l => el('li', { class: l.imp ? 'imp' : '' }, l.txt))) : el('p', {}, 'Quiet week: nothing special.')));
    for (const r of a.relatorios) r.visto = true;
  }
  box.append(agmCartasEl(a), el('h3', {}, `⚡ This week: ${a.acoes} of ${agmAcoesSemana(a.nivel)} free actions`));
  box.append(el('p', { class: 'dica' }, `Tap a kid to use an action (gives 100%). Whatever's left when the week ends becomes your 🔁 Routine (gives ${AGM_AUTO * 100}%).`));
  if (!a.jogadores.length) { box.append(el('div', { class: 'ag-vazio' }, agEmbaixadinha(), el('p', {}, 'You don\'t represent anyone yet. Send a scout from the 🔎 Scouts tab.'))); return box; }
  const lista = el('div', { class: 'lista' });
  for (const j of a.jogadores) lista.append(el('div', { class: 'linha-item agm-jog' }, agRetrato(j, 56),
    el('div', { class: 'nm' }, el('b', {}, `${j.nome} — ${agmIdade(j) | 0} years old · ${AGM_POS[j.pos][0]} · overall ${agmN(agmOverall(j))}`), agmEstadoEl(j),
      el('div', { class: 'ag-acoes' }, el('button', { class: 'btn amarelo mini', type: 'button', disabled: a.acoes ? null : 'disabled', onclick: () => agmEscolheAcao(j) }, a.acoes ? '⚡ Use an action' : 'No actions left this week'),
        j.hist[0] ? el('small', { class: 'ag-hist' }, '📜 ' + j.hist[0]) : ''))));
  box.append(lista); return box;
}
function agmEscolheAcao(j) {
  const a = agDados(), s = G.save;
  const volta = () => abreAgencia3('semana');
  const usa = (acao, at) => { const r = agmUsaAcao(j, acao, at); if (r.erro) { log(r.erro, 'l-sis'); return; } log(`⚡ ${agPrimeiro(j)}: ${r.txt}`, 'l-xp'); try { som(r.custo ? 'moeda' : 'clique'); } catch (e) { } volta(); };
  const ops = Object.entries(AGM_ACOES).map(([id, A]) => {
    const fadiga = j.estado.fadiga + Math.max(0, A[2]), risco = fadiga > AGM_FADIGA_LIMITE && A[2] > 0;
    const off = j.lesao && AGM_TREINA.has(id) ? '🤕 injured' : s.ouro < A[1] ? '💸 no coins' : null;
    return el('button', { class: 'btn agc-op' + (risco ? ' risco' : ''), type: 'button', disabled: off ? 'disabled' : null, onclick: () => AGM_ACAO_TELA[id] ? AGM_ACAO_TELA[id](j) : id === 'treino' ? agmEscolheAtr(j, usa) : usa(id) },
      el('span', {}, A[0] + (A[1] ? ` · 💰 ${agFmt(A[1])}` : ' · free')), el('small', {}, off || `${A[3]}${A[2] > 0 ? ` · fatigue +${A[2]}` : ''}${risco ? ` ⚠️ goes to ${Math.min(100, fadiga)}: injury risk ${Math.round(agmRiscoLesao(Math.min(100, fadiga)) * 100)}%/week` : ''}`));
  });
  abreModal.largo = true;
  abreModal(el('h2', {}, `⚡ Action for ${j.nome}`), el('div', { class: 'agc' }, el('div', { class: 'agc-quem' }, agRetrato(j, 96), el('b', {}, j.nome)), el('div', { class: 'agc-fala' }, agmEstadoEl(j), el('small', {}, `Free actions this week: ${a.acoes}`))),
    el('div', { class: 'agc-ops' }, ...ops), el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: volta }, '↩ Back')));
}
function agmEscolheAtr(j, usa) {
  abreModal.largo = true;
  abreModal(el('h2', {}, `🎯 Focused Training — ${j.nome}`), el('p', {}, 'Which skill should they train? The closer to their ceiling (which you don\'t know), the less it goes up.'),
    el('div', { class: 'agm-atrs' }, ...agmAtrDe(j.pos).map(k => el('button', { class: 'btn agm-atr-bt', type: 'button', onclick: () => usa('treino', k) }, el('span', {}, AGM_ATR[k]), el('div', { class: 'agc-barra' }, el('i', { style: `width:${j.atr[k] / 20 * 100}%` })), el('b', {}, agmN(j.atr[k]))))),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: () => agmEscolheAcao(j) }, '↩ Back')));
}
function agmFichaAtr(j) { return el('div', { class: 'agm-atrs ficha' }, ...agmAtrDe(j.pos).map(k => el('div', { class: 'agm-atr' }, el('span', {}, AGM_ATR[k]), el('div', { class: 'agc-barra' }, el('i', { style: `width:${j.atr[k] / 20 * 100}%` })), el('b', {}, agmN(j.atr[k]))))); }
function agmTracosEl(j) {
  return el('div', { class: 'agm-tracos' }, ...Object.entries(AGM_TRACOS).map(([t, [nome]]) => j.revelados.includes(t) ? el('span', { class: 'agm-traco', title: j.pers[t] >= 50 ? AGM_TRACOS[t][1] : AGM_TRACOS[t][2] }, `${nome}: ${j.pers[t] >= 70 ? 'alta' : j.pers[t] <= 30 ? 'baixa' : 'medium'}`) : el('span', { class: 'agm-traco oculto', title: 'You find out by spending time together (or with a scout who\'s good at reading character)' }, `${nome}: ❔`)),
    ...j.especiais.map(e => el('span', { class: 'agm-traco esp', title: AGM_ESPECIAIS[e][1] }, AGM_ESPECIAIS[e][0])));
}
function agmTelaJogadores(a) {
  const box = el('div');
  if (!a.jogadores.length) { box.append(el('div', { class: 'ag-vazio' }, agEmbaixadinha(), el('p', {}, 'Nobody here yet. Scouts find candidates (🔎 Scouts tab).'))); return box; }
  for (const j of a.jogadores) box.append(el('div', { class: 'linha-item ag-jog' }, agRetrato(j, 72), el('div', { class: 'nm' },
    el('b', {}, `${j.nome} — ${agmIdade(j) | 0} years old · ${AGM_POS[j.pos][0]} · overall ${agmN(agmOverall(j))}`),
    el('small', {}, `${agmEstrelasTxt(j.faixa)} · 👁️ visibility ${Math.round(j.visib)} · 🤝 trust ${Math.round(j.confianca)} · ${j.clube ? `${j.clube.tipo === 'pro' ? '⚽' : '🧒'} ${j.clube.nome}` : '🏘️ no club'}${j.fam ? ` · 👪 ${j.fam.nome}` : ''}`),
    agmFichaAtr(j), agmTracosEl(j), agmEstadoEl(j), typeof agmClubeEl === 'function' ? agmClubeEl(j) : '', j.hist.length ? el('small', { class: 'ag-hist' }, '📜 ' + j.hist.slice(0, 3).join(' · ')) : '',
    el('div', { class: 'ag-acoes' }, el('button', { class: 'btn mini', type: 'button', onclick: async () => { if (!(await perguntaJogo(`Stop representing ${j.nome}?`, { sim: 'Stop', perigo: true })) || !a.jogadores.includes(j)) return; if (j.fase === 'carreira') { j.ovr = agmOverall(j); agHall(j, 'left the agency'); } a.jogadores.splice(a.jogadores.indexOf(j), 1); a.rotina = (a.rotina || []).filter(r => r.jog !== j.id); agmGanhaRep(a, AGM_REP_GANHO.familiaInsatisfeita); salvar(); abreAgencia3('jogadores'); } }, 'Stop')))));
  return box;
}
function agmTelaRotina(a) {
  const n = agmAcoesSemana(a.nivel); a.rotina = a.rotina || [];
  const box = el('div', {}, el('p', {}, `🔁 Set up the standard week (${n} actions). In weeks when you don't use your actions, the routine runs on its own at ${AGM_AUTO * 100}%.`),
    el('p', { class: 'dica' }, `🛡️ Protection: if fatigue goes over ${AGM_FADIGA_LIMITE} or you run out of coins, that action becomes Rest and Dona Rosa lets you know in the report. Tryouts and trials aren't part of the routine: those are your decisions.`));
  if (!a.jogadores.length) { box.append(el('p', { class: 'vazio' }, 'First you need to represent someone.')); return box; }
  const linhas = [];
  for (let i = 0; i < n; i++) {
    const sl = a.rotina[i] || {};
    const sj = el('select', {}, el('option', { value: '' }, '— nobody —'), ...a.jogadores.map(j => el('option', { value: j.id, selected: sl.jog === j.id ? 'selected' : null }, agPrimeiro(j) + ' ' + j.nome.split(' ').slice(-1)[0])));
    const sa = el('select', {}, ...Object.entries(AGM_ACOES).filter(([, A]) => A[4]).map(([id, A]) => el('option', { value: id, selected: (sl.acao || 'descanso') === id ? 'selected' : null }, `${A[0]}${A[1] ? ' (' + agFmt(A[1]) + ')' : ''}`)));
    const st = el('select', {}, el('option', { value: '' }, 'automatic (whatever gives the most)'), ...['fin', 'pas', 'dri', 'mar', 'fis', 'vel', 'ref', 'psc'].map(k => el('option', { value: k, selected: sl.at === k ? 'selected' : null }, AGM_ATR[k])));
    const mostraAt = () => { st.style.display = sa.value === 'treino' ? '' : 'none'; }; sa.onchange = mostraAt; mostraAt();
    linhas.push([sj, sa, st]);
    box.append(el('div', { class: 'agm-slot' }, el('b', {}, `Action #${i + 1}`), sj, sa, st));
  }
  box.append(el('div', { class: 'ag-acoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => {
    a.rotina = linhas.map(([sj, sa, st]) => sj.value ? { jog: sj.value, acao: sa.value, at: sa.value === 'treino' ? st.value || null : null } : null).filter(Boolean);
    salvar(); log(`🔁 Routine saved: ${a.rotina.length} action(s) per week.`, 'l-xp'); abreAgencia3('rotina');
  } }, '💾 Save routine')));
  const custo = (a.rotina || []).reduce((t, r) => t + AGM_ACOES[r.acao][1], 0);
  if (a.rotina.length) box.append(el('small', {}, `Routine cost per week: 💰 ${agFmt(custo)} + scouts' salaries 💰 ${agFmt(a.olheiros.reduce((t, o) => t + o.salario, 0))}.`));
  return box;
}
const agmOlIc = o => o.nivel === 'lendario' ? '👑' : o.nivel === 'nacional' ? '🌎' : o.nivel === 'regional' ? '🎯' : '🧢';
function agmOlheiroEl(o, a, extra) {
  const ex = (o.exp || 0) % 12;
  return el('div', { class: 'linha-item agm-ol' + (o.lealdade < 30 ? ' desleal' : '') }, el('div', { class: 'agm-ol-ic' }, agmOlIc(o)),
    el('div', { class: 'nm' }, el('b', {}, `${o.nome} · ${AGM_OLHEIRO_NIVEIS[o.nivel][0]}`),
      el('div', { class: 'agm-ol-atr' }, agmBarra('👁️ Technical Eye', o.olho, '#3a8ad8', 20), agmBarra('🧠 Character Reading', o.carater, '#9a5ad8', 20), agmBarra('📇 Contact Network', o.rede, '#3aa070', 20)),
      el('small', {}, `📍 specialty: ${AGM_REGIOES[o.especialidade][0]} (+3 watching there) · 💰 ${agFmt(o.salario)}/week · ${o.lealdade < 30 ? '⚠️' : '🤝'} loyalty ${o.lealdade}${o.lealdade < 30 ? ' — might sell info to rivals!' : ''}${a ? ` · 📈 experience ${ex}/12` : ''}`),
      o.missao ? el('small', { class: 'agm-missao' }, o.missao.tipo === 'reobs' ? `🔍 Taking another look at a candidate · back in week ${o.missao.fim}` : `🧳 On a mission in ${AGM_REGIOES[o.missao.regiao][0]} · back in week ${o.missao.fim} (${Math.max(1, o.missao.fim - a.semana)} to go)`) : '', extra || ''));
}
// o mercado de olheiros: ofertas com os atributos à mostra, renovadas a cada 4 semanas
function agmMercadoOl(a) {
  const m = a.mercadoOl;
  if (!m || a.semana - m.sem >= 4 || m.nivel !== a.nivel) {
    const nivs = Object.keys(AGM_OLHEIRO_NIVEIS).filter(k => a.nivel >= AGM_OLHEIRO_NIVEIS[k][2]);
    const ofertas = nivs.map(k => agmNovoOlheiro(k, a)); while (ofertas.length < 3) ofertas.push(agmNovoOlheiro(agPega(nivs), a));
    a.mercadoOl = { sem: a.semana, nivel: a.nivel, ofertas };
  }
  return a.mercadoOl;
}
function agmTelaOlheiros(a) {
  const s = G.save, box = el('div'), maxOl = agmMaxOlheiros(a);
  box.append(el('h3', {}, `🔎 Your scouts (${a.olheiros.length}/${maxOl})`));
  if (!a.olheiros.length) box.append(el('p', { class: 'vazio' }, 'Without scouts, nobody discovers talent. Hire one at the market below.'));
  for (const o of a.olheiros) {
    const acoes = el('div', { class: 'ag-acoes' });
    if (!o.missao) {
      const sr = el('select', {}, ...Object.entries(AGM_REGIOES).map(([id, R]) => el('option', { value: id, disabled: a.nivel < R[4] ? 'disabled' : null, selected: id === o.especialidade && a.nivel >= R[4] ? 'selected' : null }, `${R[0]}${a.nivel < R[4] ? ` 🔒 ${AGM_NIVEIS[R[4]][1]}` : ` · ${agFmt(R[1])}/wk · gem ${R[2] * 100}%`}`)));
      const ss = el('select', {}, ...[2, 4, 6].map(n => el('option', { value: n }, `${n} semanas`)));
      const sp = el('select', {}, el('option', { value: '' }, 'any position'), ...Object.entries(AGM_POS).map(([id, [nome]]) => el('option', { value: id }, nome)));
      const si = el('select', {}, el('option', { value: '' }, 'qualquer idade'), ...[13, 14, 15, 16].map(n => el('option', { value: n }, `${n} anos`)));
      const info = el('small', {}); const calc = () => { const R = AGM_REGIOES[sr.value], n = +ss.value; info.textContent = `${AGM_REGIOES_OBS[sr.value]}.${sr.value === o.especialidade ? ' 📍 This is this scout\'s specialty: +3 scouting eye!' : ''} Costs ${agFmt(R[1] * n)} · brings ${agmCandidatos(o.rede, n)} candidate(s) · back in week ${a.semana + n}.`; };
      sr.onchange = ss.onchange = calc; calc();
      acoes.append(el('div', { class: 'agm-form' }, sr, ss, sp, si, el('button', { class: 'btn amarelo mini', type: 'button', onclick: () => {
        const R = AGM_REGIOES[sr.value], n = +ss.value, custo = R[1] * n; if (a.nivel < R[4]) return; if (s.ouro < custo) { log('Not enough coins.', 'l-dano'); return; }
        s.ouro -= custo; o.missao = { regiao: sr.value, semanas: n, fim: a.semana + n, filtro: { pos: sp.value || null, idade: si.value ? +si.value : null } };
        log(`🔎 ${o.nome} left for ${R[0]} (${n} weeks).`, 'l-xp'); try { som('moeda'); } catch (e) { } salvar(); abreAgencia3('olheiros');
      } }, '🧳 Send'), info));
    }
    acoes.append(el('div', { class: 'ag-acoes' },
      el('button', { class: 'btn mini', type: 'button', onclick: async () => { const c = Math.round(o.salario * 0.25); if (!(await perguntaJogo(`Give ${o.nome} a raise? Their salary goes from ${agFmt(o.salario)} to ${agFmt(o.salario + c)} per week (loyalty +30).`, { sim: '💰 Give a raise' })) || !a.olheiros.includes(o)) return; o.salario += c; o.lealdade = Math.min(100, o.lealdade + 30); log(`💰 ${o.nome} got a raise: loyalty ${o.lealdade}.`, 'l-xp'); salvar(); abreAgencia3('olheiros'); } }, '💰 Give a raise'),
      el('button', { class: 'btn mini', type: 'button', onclick: async () => { if (!(await perguntaJogo(`Fire ${o.nome}?${o.missao ? ' The current mission will be lost.' : ''}`, { sim: '👋 Fire', perigo: true })) || !a.olheiros.includes(o)) return; a.olheiros.splice(a.olheiros.indexOf(o), 1); log(`👋 ${o.nome} left the agency.`, 'l-sis'); salvar(); abreAgencia3('olheiros'); } }, '👋 Fire')));
    box.append(agmOlheiroEl(o, a, acoes));
  }
  // mercado
  const m = agmMercadoOl(a);
  box.append(el('h3', {}, '🧢 Scout Market'), el('small', {}, `New offers every 4 weeks (next ones in week ${m.sem + 4}). At your level you can have up to ${maxOl} scouts.`));
  for (const o of m.ofertas) {
    const preco = AGM_OLHEIRO_NIVEIS[o.nivel][3];
    box.append(agmOlheiroEl(o, null, el('div', { class: 'ag-acoes' }, el('button', { class: 'btn amarelo mini', type: 'button', onclick: () => {
      if (a.olheiros.length >= maxOl) { log(`At your level you can have up to ${maxOl} scouts. Level up or fire someone.`, 'l-sis'); return; }
      if (s.ouro < preco) { log('Not enough coins.', 'l-dano'); return; }
      s.ouro -= preco; m.ofertas.splice(m.ofertas.indexOf(o), 1); o.exp = 0; a.olheiros.push(o); log(`🧢 ${o.nome} (${AGM_OLHEIRO_NIVEIS[o.nivel][0]}) joined the agency!`, 'l-loot'); try { som('moeda'); } catch (e) { } salvar(); abreAgencia3('olheiros');
    } }, `Hire (${agFmt(preco)})`))));
  }
  // candidatos
  const nFix = a.candidatos.filter(j => j.fixado).length;
  box.append(el('h3', {}, `🧒 Candidates (${a.candidatos.length})${nFix ? ` · 📌 tracking ${nFix}` : ''}`));
  if (!a.candidatos.length) box.append(el('div', { class: 'ag-vazio' }, agEmbaixadinha(), el('p', {}, 'No candidates right now. Scouts bring boys and girls aged 13 to 16.')));
  const livres = a.olheiros.filter(o => !o.missao), reobsDe = new Map(a.olheiros.filter(o => o.missao && o.missao.tipo === 'reobs').map(o => [o.missao.cand, o]));
  for (const j of [...a.candidatos].sort((x, y) => (y.fixado ? 1 : 0) - (x.fixado ? 1 : 0))) { // v355: os que você acompanha (📌) vêm primeiro
    const custoR = AGM_REGIOES[j.regiao][1], f = j.faixa || {}, emReobs = reobsDe.get(j.id);
    box.append(el('div', { class: 'linha-item' + (j.fixado ? ' agm-fixado' : '') }, agRetrato(j, 56), el('div', { class: 'nm' },
      el('b', {}, `${j.nome} — ${agmIdade(j) | 0} years old · ${AGM_POS[j.pos][0]} · overall ${agmN(agmOverall(j))}`),
      el('small', { class: 'agm-relat' }, `📋 ${agmEstrelasTxt(j.faixa)}${f.olNome ? ` · report by ${f.olNome} (eye ${f.olho})` : ''}${f.reobs ? ` · 🔍 watched ${f.reobs + 1} times` : ''}`),
      el('small', {}, `${AGM_REGIOES[j.regiao][0]} · 👪 ${j.fam.nome} (${(AG_PARENTES[j.fam.par] || [])[1] || 'family'})${agmFamResumo(j)} · gives up in ${AGM_ESPERA_CANDIDATO + 1 - (j.espera || 0)} week(s)`),
      j.fam.rival ? el('small', { class: 'agm-rival' }, `😬 A rival agency is watching too — maybe ${j.menina ? 'ela' : 'ele'} is better than the report says.`) : '',
      agmFichaAtr(j), agmTracosEl(j),
      el('div', { class: 'ag-acoes' },
        emReobs ? el('small', {}, `🔍 ${emReobs.nome} is taking another look: the report arrives in week ${emReobs.missao.fim}`)
          : livres.length ? el('span', { class: 'agm-reobs' }, `🔍 Take another look (${agFmt(custoR)}, 1 week) with: `, ...livres.map(o => el('button', { class: 'btn mini', type: 'button', title: `technical eye ${o.olho}${o.especialidade === j.regiao ? ' (+3: specialty)' : ''}`, onclick: () => {
              if (s.ouro < custoR) { log('Not enough coins.', 'l-dano'); return; } s.ouro -= custoR; o.missao = { tipo: 'reobs', cand: j.id, fim: a.semana + 1 }; salvar(); abreAgencia3('olheiros');
            } }, `${agmOlIc(o)} ${o.nome.split(' ').slice(-1)[0]} (eye ${Math.min(20, o.olho + (o.especialidade === j.regiao ? 3 : 0))})`)))
          : el('small', {}, '🔍 To take another look, you need a free scout.'),
        el('button', { class: 'btn amarelo mini', type: 'button', disabled: (j.fam.voltaSem != null && a.semana < j.fam.voltaSem) || !a.acoes ? 'disabled' : null, onclick: () => agmVisitaFamilia(j) }, j.fam.voltaSem != null && a.semana < j.fam.voltaSem ? `👪 The family asked you to come back in week ${j.fam.voltaSem}` : a.acoes ? `👪 Visit the family (1 action)${j.fam.visitas ? ` · visit #${j.fam.visitas}` : ''}` : '👪 No actions left this week'),
        el('button', { class: 'btn mini' + (j.fixado ? ' amarelo' : ''), type: 'button', title: 'Mark to track (the card turns gold and moves to the top)', onclick: () => { j.fixado = !j.fixado; salvar(); abreAgencia3('olheiros'); } }, j.fixado ? '📌 Tracking' : '📌 Track'),
        el('button', { class: 'btn mini', type: 'button', onclick: () => { a.candidatos.splice(a.candidatos.indexOf(j), 1); salvar(); abreAgencia3('olheiros'); } }, 'Dismiss')))));
  }
  return box;
}
// assinatura simples desta etapa — a conversa com a família (arquétipos, termos do contrato) entra na Etapa 4
function agmAssinaProvisorio(j) {
  const a = agDados(); if (a.jogadores.length >= agmMaxJogadores(a.nivel)) { log(`Your agency can only represent ${agmMaxJogadores(a.nivel)} kids at this level.`, 'l-sis'); return; }
  a.candidatos.splice(a.candidatos.indexOf(j), 1); j.fase = 'desenvolvimento'; j.confianca = Math.min(100, j.fam.confianca + 20); j.contrato = { comissao: 10, anos: 2, ateSemana: a.semana + 104 };
  a.jogadores.push(j); a.marcos.assinados++; agmHist(j, 'signed with your agency'); log(`✍️ ${j.nome} is now with ${a.nome}!`, 'l-loot'); try { som('moeda'); } catch (e) { }
  agmConfereNivel(a); salvar(); abreAgencia3('jogadores');
}
function agmTelaAgencia(a) {
  const s = G.save, box = el('div'), k = a.nivel + 1;
  box.append(el('div', { class: 'agm-rep' }, el('b', {}, `${'⭐'.repeat(a.nivel)} ${AGM_NIVEIS[a.nivel][1]} · reputation ${agmN(a.rep)}/100`), el('div', { class: 'agc-barra' }, el('i', { style: `width:${a.rep}%` }))));
  if (AGM_NIVEIS[k]) { const ms = agmMetas(a, k);
    box.append(el('div', { class: 'ag-metas' }, el('b', {}, `🎯 Goals to become ${AGM_NIVEIS[k][1]} (${ms.filter(m => m[3]).length}/${ms.length})`),
      ...ms.map(([t, v, alvo, ok]) => el('div', { class: 'ag-meta' + (ok ? ' ok' : '') }, el('span', {}, (ok ? '✅ ' : '⬜ ') + t), el('div', { class: 'agc-barra' }, el('i', { style: `width:${Math.round(v / alvo * 100)}%` })), el('small', {}, `${agmN(v)}/${agmN(alvo)}`))),
      el('small', { class: 'ag-libera' }, `🔓 When you level up: ${AGM_NIVEIS[k][3]}, up to ${AGM_NIVEIS[k][2]} kids, ${agmAcoesSemana(k)} actions per week`))); }
  else box.append(el('div', { class: 'ag-metas topo' }, el('b', {}, '👑 International Agency: the very top!')));
  box.append(el('p', { class: 'dica' }, '🧢 To hire scouts, check the Scout Market in the 🔎 Scouts tab.'));
  const hall = a.hall || [];
  box.append(el('h3', {}, '🏛️ Hall of Fame'));
  if (!hall.length) box.append(el('p', { class: 'vazio' }, 'When one of your stars retires or becomes an Agency Legend, they get a spot here.'));
  else box.append(el('div', { class: 'lista' }, ...hall.map((h, i) => el('div', { class: 'linha-item' }, el('b', { class: 'pos-tag' }, i + 1), h.look ? agRetrato(h, 44) : '', el('div', { class: 'nm' }, el('b', {}, h.nome), el('small', {}, h.como || ''))))));
  const alb = a.album || {}, nAlb = AG_ALBUM.filter(([c]) => alb[c]).length;
  box.append(el('h3', {}, `📸 Agency Album (${nAlb}/${AG_ALBUM.length})`), el('div', { class: 'ag-album' }, ...AG_ALBUM.map(([c, leg, como]) => alb[c]
    ? el('button', { class: 'ag-foto', type: 'button', onclick: () => agCelebra(c, leg, '', 'confete') }, agImg('cap_ag_' + c), el('span', {}, leg))
    : el('div', { class: 'ag-foto trava', title: como }, el('div', { class: 'ag-foto-vazia' }, '❔'), el('span', {}, como)))));
  return box;
}

/* ---------- ligação com o jogo (só no modo de teste até o fim das etapas) ---------- */
if (AGM_ATIVO) {
  const _agDadosV1 = agDados;
  agDados = function () { const s = G.save; if (!s) return null; if (s.agencia && typeof s.agencia === 'object' && s.agencia.v !== AGM_VERSAO) agmMigraSave(s); return s.agencia && typeof s.agencia === 'object' ? s.agencia : null; };
  window.agCriaV1 = agCria; // (para os testes)
  agCria = function () {
    const s = G.save; s.agencia = agmNovaAgencia((s.nome || 'Legend').split(' ')[0].toUpperCase() + ' SPORTS');
    s.agencia.relatorios = [{ de: 0, ate: 0, visto: false, linhas: [ // boas-vindas: o ciclo da agência em 6 linhas
      { txt: '☀️ Welcome to your agency! Here time moves in WEEKS: one every 30 minutes (and up to 10 h with the game closed). Done with what you wanted to do? Use the ⏩ End the Week button.', imp: true },
      { txt: '🔎 1) Send your scout on a mission (🔎 Scouts tab). They come back with candidates and a report with the potential range in stars.', imp: true },
      { txt: '👪 2) Visit the candidate\'s family (costs 1 action): find out what they need and build the right contract.', imp: true },
      { txt: '⚡ 3) Every week you have actions to train, show off, and take care of the kids. Whatever\'s left becomes your 🔁 Routine (75%).', imp: true },
      { txt: '🏟️ 4) Tryouts and trials lead to a club\'s youth team; at 17 comes the professional contract, then sponsorships and transfers.', imp: true },
      { txt: '🌍 5) The dream: sell a kid to Europe. They become an Agency Legend and start visiting the office in the Village!', imp: true },
    ] }];
    return s.agencia;
  };
  agNivelRep = function () { const a = agDados(); return a ? a.nivel - 1 : 0; }; // (os troféus do escritório: nível 1 = nenhum)
  agTick = agmTick;
  const _abreV1 = abreAgencia;
  abreAgencia = function (aba) { if (!agLiberada() || !agDados()) return _abreV1.apply(this, arguments); return abreAgencia3(aba); };
  agAvisa = function () { try { const a = agDados(); const n = a && a.v === AGM_VERSAO ? (a.relatorios || []).filter(r => !r.visto).length : 0; for (const b of document.querySelectorAll('.btn-agencia')) b.dataset.n = n || ''; const tb = document.getElementById('tbAgencia'); if (tb) tb.hidden = !(G.save && agLiberada()); } catch (e) { } };
  agFalaSecretaria = function () {
    const s = G.save; if (!agLiberada()) return `The agency is still closed: it opens at level ${AG_NIVEL} or when you beat Career and Club.`;
    const a = agDados(); if (!a) return 'Everything’s ready to open YOUR agency! Just sign the paperwork here with me.';
    const rel = (a.relatorios || []).filter(r => !r.visto).length, k = a.nivel + 1, falta = AGM_NIVEIS[k] && agmMetas(a, k).find(m => !m[3]);
    return `Good morning, boss! We're in week ${a.semana}, with ${a.acoes} free action(s).${rel ? ` There are ${rel} new report(s) on your desk.` : ''}${a.candidatos.length ? ` ${a.candidatos.length} prospect(s) waiting.` : ''}${falta ? ` To become ${AGM_NIVEIS[k][1]}, you still need: ${falta[0].toLowerCase()}.` : ''}`;
  };
  agFalaOlheiro = function () {
    const a = agLiberada() && agDados(); if (!a) return NPCS.ag_olheiro.ola;
    const fora = a.olheiros.filter(o => o.missao); if (fora.length) return `I have ${fora.length} scout(s) on the road. ${fora[0].nome} comes back from ${AGM_REGIOES[fora[0].missao.regiao][0]} in week ${fora[0].missao.fim}.`;
    return `My scouts are just sitting around, boss! They say ${agPega(['on a dirt pitch', 'at the soccer school', 'at a sandlot tournament', 'on the school court'])} ${agPega(['out in the countryside', 'in the city', 'up in the Northeast'])} there's ${agPega(['a boy', 'a girl'])} who plays like a pro.`;
  };
} else {
  // fora do modo de teste: se um save de teste ficou no formato novo, volta para a cópia antiga
  const _agDadosV1b = agDados;
  agDados = function () { const s = G.save; if (s && s.agencia && s.agencia.v === AGM_VERSAO) s.agencia = s.agenciaV1 || null; return _agDadosV1b.apply(this, arguments); };
}

/* ---------- estilo ---------- */
{
  const st = document.createElement('style');
  st.textContent = `
  .agm-rel { background: #fff8e6; border: 2px solid #d8c090; border-radius: 12px; padding: 8px 12px; margin-bottom: 8px; }
  .agm-rel.novo { border-color: #e0a000; box-shadow: 0 0 0 3px rgba(255,200,40,.35); }
  .agm-rel-cab { display: flex; align-items: center; gap: 8px; }
  .agm-rel-ic { width: 30px; height: auto; }
  .agm-rel ul { margin: 6px 0 0; padding-left: 18px; font-size: 13.5px; }
  .agm-rel li { margin: 2px 0; } .agm-rel li.imp { font-weight: 700; }
  .agm-estado { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px 10px; margin: 3px 0; align-items: center; }
  .agm-bar { display: grid; grid-template-columns: auto 1fr auto; gap: 5px; align-items: center; font-size: 11.5px; }
  .agm-bar .agc-barra { height: 9px; min-width: 40px; }
  .agm-lesao { color: #c03a2a; font-size: 12px; }
  .agm-atrs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; margin: 6px 0; }
  .agm-atrs.ficha { gap: 2px 14px; margin: 3px 0; }
  .agm-atr, .agm-atr-bt { display: grid; grid-template-columns: 128px 1fr 34px; gap: 6px; align-items: center; font-size: 12.5px; }
  .agm-atr-bt { padding: 8px 10px; text-align: left; }
  .agm-atr .agc-barra, .agm-atr-bt .agc-barra { height: 9px; } .agm-atr .agc-barra i, .agm-atr-bt .agc-barra i { background: #3a8ad8; }
  .agm-tracos { display: flex; flex-wrap: wrap; gap: 4px; margin: 3px 0; }
  .agm-traco { font-size: 11px; padding: 1px 7px; border-radius: 9px; background: #e8f0ff; border: 1px solid #b8c8e8; }
  .agm-traco.oculto { background: #eee; border-color: #ccc; opacity: .75; } .agm-traco.esp { background: #fff0c0; border-color: #e0b040; font-weight: 700; }
  .agm-slot { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin: 4px 0; padding: 6px 8px; background: #fff8e6; border-radius: 10px; }
  .agm-slot b { width: 64px; } .agm-slot select, .agm-form select { max-width: 100%; }
  .agm-form { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 4px; }
  .agm-form small { width: 100%; opacity: .85; }
  .agm-missao { color: #2a6aa0; font-weight: 700; }
  .agm-ol-ic { font-size: 30px; width: 44px; text-align: center; flex-shrink: 0; }
  .agm-rep { display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px; } .agm-rep .agc-barra { height: 14px; } .agm-rep .agc-barra i { background: linear-gradient(90deg, #e0a000, #ffd23f); }
  .agm-acoes-n.zero { color: #ffb0a0; }
  .ag-num .agm-passa { padding: 1px 9px; font-size: 12px; line-height: 1.4; }
  .agc-op.risco { border-color: #d8382a; }
  .agm-ol-atr { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px 10px; margin: 2px 0; }
  .agm-ol.desleal { border-left: 4px solid #d8382a; }
  .agm-rival { color: #b0302a; font-weight: 700; } .agm-relat { font-weight: 700; }
  .agm-reobs { display: inline-flex; flex-wrap: wrap; gap: 4px; align-items: center; font-size: 12px; }
  .agm-cartas { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
  .agm-carta { background: linear-gradient(#fff3d0, #ffe6a8); border: 2px solid #e0a000; border-radius: 12px; padding: 8px 12px; animation: agPula 1.6s ease-in-out 2; }
  .agm-carta p { margin: 4px 0; }
  @media (max-width: 560px) { .agm-estado, .agm-ol-atr { grid-template-columns: 1fr; } .agm-atrs { grid-template-columns: 1fr; } .agm-atr, .agm-atr-bt { grid-template-columns: 112px 1fr 30px; } }
  `;
  document.head.append(st);
}

// v355: candidato acompanhado (📌) fica dourado
{ const css = document.createElement('style'); css.textContent = `.linha-item.agm-fixado { background: linear-gradient(90deg, rgba(255,214,90,.35), rgba(255,240,190,.25)); border: 2px solid #e8b030; box-shadow: 0 0 0 2px rgba(232,176,48,.25); }
  .linha-item.agm-fixado .nm > b::before { content: '📌 '; }`; document.head.append(css); }

// v358 (dono: o "½" ficou feio): na tela, cada sequência de 5 estrelas vira estrelas desenhadas — a meia é uma ★ pintada só
// pela metade (dourada à esquerda, cinza à direita). Nos textos do registro continua ★★½☆☆.
function agmEnfeitaEstrelas(raiz) {
  if (!raiz) return;
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT), nos = [];
  while (w.nextNode()) if (/[★½☆]{5}/.test(w.currentNode.nodeValue)) nos.push(w.currentNode);
  for (const no of nos) {
    const frag = document.createDocumentFragment(); let resto = no.nodeValue;
    for (let m; (m = /[★½☆]{5}/.exec(resto));) {
      frag.append(resto.slice(0, m.index));
      const caixa = document.createElement('span'); caixa.className = 'agm-estrelas';
      for (const c of m[0]) { const e = document.createElement('span'); e.className = c === '★' ? 'cheia' : c === '½' ? 'meia' : 'vazia'; e.textContent = '★'; caixa.append(e); }
      frag.append(caixa); resto = resto.slice(m.index + 5);
    }
    frag.append(resto); no.replaceWith(frag);
  }
}
{ const css = document.createElement('style'); css.textContent = `.agm-estrelas { letter-spacing: 1px; white-space: nowrap; font-size: 1.25em; line-height: 1; vertical-align: -1px; }
  .agm-estrelas .cheia { color: #f5b301; text-shadow: 0 0 1px #8a5a00; }
  .agm-estrelas .vazia { color: #cfc6b4; }
  .agm-estrelas .meia { background: linear-gradient(90deg, #f5b301 50%, #cfc6b4 50%); -webkit-background-clip: text; background-clip: text; color: transparent; }`; document.head.append(css); }
