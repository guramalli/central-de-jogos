/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏟️ AGÊNCIA 3.0 — ETAPA 5: DESENVOLVIMENTO (v340). Do documento do dono:
   - VISIBILIDADE (0–100): quantos clubes conhecem o garoto. Sobe com jogos, peneiras e redes, e decide os convites:
     testes em clubes médios a partir de 30, grandes a partir de 60, sondagens do exterior a partir de 85.
   - PENEIRA (ação, tostões baixo, fadiga +10): teste aberto, 3 rodadas, cada uma num fundamento; passar em 2 de 3 aprova.
     Antes de cada rodada você dá a instrução: "jogue simples" (+5%, menos visibilidade) ou "arrisque" (−10%, visibilidade
     em dobro se der certo). Chance por rodada = (atributo + Forma/10 + Estabilidade/20) / 30 (agmChancePeneira).
   - TESTE EM CLUBE (ação, tostões alto): só por CONVITE; aprovação dá contrato de base. Mesmas 3 rodadas.
   - CLUBES: pequeno (overall 8+, ajuda de custo), médio (11+, vis 30, alojamento: +visibilidade toda semana), grande
     (13+, vis 60, treino ×1,3 e a família ganha Status).
   - LONGE DE CASA: quem tem Saudade alta perde moral toda semana até se adaptar — a menos que você visite a família
     com frequência. A cláusula "sem clubes longe até os 16 anos" do contrato é respeitada.
   Carregar DEPOIS de agencia_familia.js.
   ============================================================ */
const AGM_PENEIRA = { custo: 20000, fadiga: 10 }, AGM_TESTE = { custo: 100000, fadiga: 10 };
const AGM_DEGRAU_CLUBE = { pequeno: 0, medio: 1, grande: 2 }; // → AG_CLUBES (nomes inventados) por degrau
const AGM_CIDADES = ['Manaus', 'Porto Alegre', 'Recife', 'Curitiba', 'Belém', 'Fortaleza', 'Goiânia', 'Salvador'];
const AGM_FUNDAMENTOS = { linha: ['dri', 'pas', 'fin', 'mar'], GOL: ['ref', 'psc', 'pas', 'mar'] };
AGM_ACOES.peneira = ['🏟️ Tryout', AGM_PENEIRA.custo, AGM_PENEIRA.fadiga, 'Open trial at a club: 3 rounds, pass 2 to get in', 0];

/* ---------- clubes ---------- */
function agmNovoClube(degrau, perto) {
  const c = AG_CLUBES[AGM_DEGRAU_CLUBE[degrau]], [nome, , cor] = agPega(c.nomes), longe = perto ? false : Math.random() < (degrau === 'grande' ? 0.6 : degrau === 'medio' ? 0.45 : 0.25);
  return { nome, cor, degrau, longe, cidade: longe ? agPega(AGM_CIDADES) : 'aqui perto', tipo: 'base' };
}
const agmClubeTxt = c => `${c.nome} (${AGM_CLUBES_BASE[c.degrau][0].toLowerCase()}${c.longe ? `, in ${c.cidade} ✈️` : ', close to home'})`;
function agmPodeLonge(j) { return !(j.contrato && j.contrato.restricao && agmIdade(j) < 16); }
// 3 peneiras abertas por garoto, renovadas a cada 4 semanas (pequenos; médio se o overall já pede)
function agmPeneirasAbertas(a, j) {
  if (!j.peneiras || a.semana - j.peneiras.sem >= 4) {
    const l = [agmNovoClube('pequeno', true), agmNovoClube('pequeno')]; l.push(agmNovoClube(agmOverall(j) >= 10 ? 'medio' : 'pequeno'));
    j.peneiras = { sem: a.semana, clubes: l };
  }
  return j.peneiras.clubes;
}
function agmClubeEl(j) {
  const a = agDados(), c = j.clube, conv = (j.convites || []).filter(x => x.ate >= a.semana);
  const box = el('div', { class: 'agm-clube' });
  if (c && c.tipo === 'base') box.append(el('small', {}, `🏟️ ${agmClubeTxt(c)} youth academy · ${AGM_CLUBES_BASE[c.degrau][3]}${c.longe && !j.adaptado && j.pers.saudade >= 60 ? ` · 🥺 homesick (settling in ${j.adapta || 0}/${agmSemanasAdaptar(j)} weeks)` : ''}`));
  for (const cv of conv) box.append(el('button', { class: 'btn amarelo mini', type: 'button', disabled: a.acoes && !j.lesao ? null : 'disabled', onclick: () => agmFazTeste(j, cv.clube, 'teste') },
    `📩 Invitation: trial at ${agmClubeTxt(cv.clube)} · ${agFmt(AGM_TESTE.custo)} · 1 action · until week ${cv.ate}`));
  if (j.sondagemExterior) box.append(el('small', { class: 'agm-exterior' }, '🌍 Clubs from abroad are scouting! (the pro career arrives in the next stage)'));
  return box;
}

/* ---------- a peneira / o teste: 3 rodadas com instrução ---------- */
AGM_ACAO_TELA.peneira = j => {
  const a = agDados(), clubes = agmPeneirasAbertas(a, j);
  abreModal.largo = true;
  abreModal(el('h2', {}, `🏟️ Tryouts open for ${j.nome}`), el('p', {}, `Costs ${agFmt(AGM_PENEIRA.custo)}, 1 action and fatigue +${AGM_PENEIRA.fadiga}. Three rounds, each testing one skill: pass 2 and ${agmEle(j)} joins the club’s youth academy.`),
    el('div', { class: 'lista' }, ...clubes.map(c => { const B = AGM_CLUBES_BASE[c.degrau], abaixo = agmOverall(j) < B[1], longe = c.longe && !agmPodeLonge(j);
      return el('div', { class: 'linha-item' }, el('div', { class: 'agm-ol-ic' }, c.degrau === 'grande' ? '🏟️' : c.degrau === 'medio' ? '🏫' : '⚽'), el('div', { class: 'nm' }, el('b', {}, agmClubeTxt(c)),
        el('small', {}, `${B[3]} · requires overall ${B[1]}+${abaixo ? ` (⚠️ ${agPrimeiro(j)} has ${agmN(agmOverall(j))}: −15% per round)` : ''}${c.longe && j.pers.saudade >= 60 && j.revelados.includes('saudade') ? ' · 🥺 very homesick' : ''}`),
        el('div', { class: 'ag-acoes' }, el('button', { class: 'btn amarelo mini', type: 'button', disabled: longe ? 'disabled' : null, onclick: () => agmFazTeste(j, c, 'peneira') }, longe ? '📍 Contract: no faraway clubs until age 16' : 'Do the tryout')))); })),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: () => agmEscolheAcao(j) }, '↩ Back')));
};
function agmFazTeste(j, clube, tipo) {
  const a = agDados(), s = G.save, cfg = tipo === 'teste' ? AGM_TESTE : AGM_PENEIRA;
  if (a.acoes <= 0) { log('You’re out of actions this week.', 'l-sis'); return; }
  if (j.lesao) { log(`${j.nome} is injured${agmO(j)}.`, 'l-sis'); return; }
  if (s.ouro < cfg.custo) { log('Not enough coins.', 'l-dano'); return; }
  if (clube.longe && !agmPodeLonge(j)) { log('The contract with the family forbids faraway clubs until age 16.', 'l-sis'); return; }
  s.ouro -= cfg.custo; a.acoes--; j.estado.fadiga = Math.min(100, j.estado.fadiga + cfg.fadiga);
  if (tipo === 'teste') j.convites = (j.convites || []).filter(cv => cv.clube !== clube);
  const funds = agEmbM(j.pos === 'GOL' ? AGM_FUNDAMENTOS.GOL : AGM_FUNDAMENTOS.linha).slice(0, 3);
  const st = { r: 0, ok: 0, nao: 0, vis: 0, linhas: [] };
  const titulo = `${tipo === 'teste' ? '📩 Trial' : '🏟️ Tryout'} at ${clube.nome}`;
  const extra = () => (agmOverall(j) < AGM_CLUBES_BASE[clube.degrau][1] ? -0.15 : 0) + (j.contrato && j.contrato.acompanhante ? 0.03 : 0) + (j.especiais.includes('pe_quente') ? 0.05 : 0);
  const rodada = () => {
    const at = funds[st.r], base = agmChancePeneira(j, at), pct = x => Math.round(clamp(x + extra(), 0.02, 0.98) * 100);
    abreModal.largo = true;
    abreModal(el('h2', {}, titulo), el('div', { class: 'agm-pen' }, agRetrato(j, 96), el('div', {},
      el('b', { class: 'agm-pen-rod' }, `Round ${st.r + 1} of 3 — ${AGM_ATR[at]} (${agmN(j.atr[at])})`),
      el('div', { class: 'agm-pen-placar' }, ...[0, 1, 2].map(i => el('span', { class: i < st.r ? (st.linhas[i].ok ? 'ok' : 'nao') : '' }, i < st.r ? (st.linhas[i].ok ? '✅' : '❌') : '⬜'))),
      ...st.linhas.map(l => el('small', { class: 'agm-pen-lin' }, l.txt)),
      el('p', {}, `Form ${Math.round(j.estado.forma)} · ${j.revelados.includes('estabilidade') ? `estabilidade ${j.pers.estabilidade >= 70 ? 'alta' : j.pers.estabilidade <= 30 ? 'baixa' : 'medium'}` : 'stability ❔'}${j.contrato && j.contrato.acompanhante ? ' · 🧑‍🤝‍🧑 with a guardian' : ''}`))),
      el('p', { class: 'dica' }, 'What’s your instruction for this round?'),
      el('div', { class: 'agc-ops' },
        el('button', { class: 'btn agc-op', type: 'button', onclick: () => joga(at, 'simples') }, el('span', {}, `🛡️ “Keep it simple” — ${pct(base + 0.05)}%`), el('small', {}, '+5% chance, gains less visibility')),
        el('button', { class: 'btn agc-op', type: 'button', onclick: () => joga(at, null) }, el('span', {}, `⚽ “Play your game” — ${pct(base)}%`), el('small', {}, 'no instruction')),
        el('button', { class: 'btn agc-op', type: 'button', onclick: () => joga(at, 'arrisca') }, el('span', {}, `🔥 “Go for it!” — ${pct(base - 0.10)}%`), el('small', {}, '−10% chance, double visibility if it works'))));
  };
  const joga = (at, instr) => {
    const p = clamp(agmChancePeneira(j, at, instr) + extra(), 0.02, 0.98), ok = Math.random() < p;
    let v = 0; if (ok) { v = 3 * (instr === 'simples' ? 0.5 : instr === 'arrisca' ? 2 : 1) * (tipo === 'teste' ? 1.5 : 1); st.vis += v; }
    st.linhas.push({ ok, txt: `${ok ? '✅' : '❌'} ${AGM_ATR[at]}: ${ok ? agPega(['nailed it!', 'the coach wrote down the name!', 'did great!']) : agPega(['missed the play.', 'froze at the big moment.', 'not this time.'])}${v ? ` (+${agmN(v)} visibility)` : ''}` });
    st.r++; if (ok) st.ok++; else st.nao++;
    if (st.ok >= 2 || st.nao >= 2) fim(); else rodada();
  };
  const fim = () => {
    const aprovado = st.ok >= 2; j.visib = Math.min(100, j.visib + st.vis + (tipo === 'teste' ? 2 : 1));
    let txt;
    if (aprovado) {
      const antes = j.clube; j.clube = { ...clube, desde: a.semana }; j.adapta = 0; j.adaptado = !clube.longe;
      a.marcos.aprovados++; if (clube.degrau !== 'pequeno') a.marcos.baseMedio++; agmGanhaRep(a, AGM_REP_GANHO.peneira);
      if (clube.degrau === 'grande' && j.fam && j.fam.need.includes('status')) { j.confianca = Math.min(100, j.confianca + 10); }
      j.estado.moral = Math.min(100, j.estado.moral + 10);
      txt = `✅ APPROVED${agmO(j).toUpperCase()}! ${j.nome} joins the youth academy of ${agmClubeTxt(clube)}.${antes ? ` (Leaving ${antes.nome}.)` : ''}${clube.degrau === 'grande' && j.fam && j.fam.need.includes('status') ? ' The family is over the moon: a big club!' : ''}`;
      agmHist(j, `passed${agmO(j)} ${tipo === 'teste' ? 'the trial' : 'the open tryout'} at ${clube.nome}`);
      try { if (typeof agCelebra === 'function') agCelebra('teste', `✅ ${j.nome} passed${agmO(j)}!`, `${clube.nome} youth academy.`, 'carimbo', j); } catch (e) { }
    } else { j.estado.moral = Math.max(0, j.estado.moral - (j.pers.estabilidade < 40 ? 8 : 4)); txt = `❌ Didn’t pass ${tipo === 'teste' ? 'the trial' : 'the open tryout'} at ${clube.nome}. It happens: you can try another one.`; agmHist(j, `failed${agmO(j)} ${tipo === 'teste' ? 'the trial' : 'the open tryout'} at ${clube.nome}`); }
    salvar();
    abreModal.largo = true;
    abreModal(el('h2', {}, titulo), el('div', { class: 'agm-pen' }, agRetrato(j, 96), el('div', {}, el('b', { class: 'agm-pen-res ' + (aprovado ? 'ok' : 'nao') }, txt),
      ...st.linhas.map(l => el('small', { class: 'agm-pen-lin' }, l.txt)), el('small', {}, `👁️ Visibility now: ${Math.round(j.visib)}`))),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => abreAgencia3('semana') }, '↩ Back to the agency')));
  };
  rodada();
}

/* ---------- toda semana: clube de base, saudade, convites, sondagem do exterior ---------- */
function agmSemanasAdaptar(j) { return 6 + Math.round(j.pers.saudade / 10); }
AGM_GANCHOS_SEMANA.push(function (a, lin) {
  for (const j of a.jogadores) {
    if (j.fase !== 'desenvolvimento') continue;
    const c = j.clube;
    if (c && c.tipo === 'base') {
      if (c.degrau === 'pequeno') j.estado.moral = Math.min(100, j.estado.moral + 1);            // ajuda de custo
      if (c.degrau === 'medio') j.visib = Math.min(100, j.visib + 1);                             // alojamento: aparece mais
      if (c.longe && !j.adaptado) {
        j.adapta = (j.adapta || 0) + 1;
        if (j.adapta >= agmSemanasAdaptar(j)) { j.adaptado = true; lin(`🏡 ${agPrimeiro(j)} has settled into life in ${c.cidade}.`, 1, j.id); }
        else if (j.pers.saudade >= 60) {
          const visitou = j.visitaSem != null && a.semana - j.visitaSem <= 3;
          if (!visitou) { const perde = Math.round((j.pers.saudade - 50) / 10) + 1; j.estado.moral = Math.max(0, j.estado.moral - perde); if (!j.revelados.includes('saudade')) j.revelados.push('saudade');
            if (j.estado.moral < 35) lin(`🥺 ${agPrimeiro(j)} is very homesick (morale ${j.estado.moral}). A visit to the family would help.`, 1, j.id); }
        }
      }
    }
    // convites: a visibilidade abre portas (médio a partir de 30, grande a partir de 60)
    j.convites = (j.convites || []).filter(cv => cv.ate >= a.semana);
    const grau = c && c.tipo === 'base' ? AGM_DEGRAU_CLUBE[c.degrau] : -1;
    if (!j.convites.length && Math.random() < 0.2) {
      const deg = j.visib >= 60 && grau < 2 ? 'grande' : j.visib >= 30 && grau < 1 ? 'medio' : null;
      if (deg) { const clube = agmNovoClube(deg); j.convites.push({ clube, ate: a.semana + 4 }); lin(`📩 Invitation! ${agmClubeTxt(clube)} wants to see ${j.nome} in a trial (until week ${a.semana + 4}).`, 1, j.id); }
    }
    if (j.visib >= 85 && agmIdade(j) >= 16 && !j.sondagemExterior && Math.random() < 0.15) { j.sondagemExterior = true; lin(`🌍 A club from abroad is scouting ${j.nome}!`, 1, j.id); }
  }
});

/* ---------- estilo ---------- */
{
  const st = document.createElement('style');
  st.textContent = `
  .agm-clube { display: flex; flex-direction: column; gap: 3px; margin: 3px 0; }
  .agm-exterior { color: #1a6aa0; font-weight: 700; }
  .agm-pen { display: flex; gap: 14px; align-items: flex-start; margin: 6px 0; }
  .agm-pen > div { display: flex; flex-direction: column; gap: 5px; flex: 1; }
  .agm-pen .ag-ret { width: 80px; height: 100px; }
  .agm-pen-rod { font-size: 17px; }
  .agm-pen-placar { display: flex; gap: 6px; font-size: 26px; }
  .agm-pen-placar span.ok { animation: agPula .6s ease-in-out 2; }
  .agm-pen-lin { font-size: 13px; }
  .agm-pen-res { font-size: 16px; } .agm-pen-res.ok { color: #2a8a3a; } .agm-pen-res.nao { color: #b03a2a; }
  `;
  document.head.append(st);
}
