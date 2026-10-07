/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📘 MEU TIME AUTO-EXPLICATIVO (v159)
   - botão "Como funciona" (abre sozinho na primeira vez);
   - caixa "Próximo passo": olha o time e diz o que fazer agora, com o botão que resolve;
   - energia em % em cada jogador e legenda dos números;
   - Mercado: mostra se o jogador é melhor que o seu titular da posição.
   Só explica: nenhuma regra do time mudou. Carregar DEPOIS de team.js.
   ============================================================ */
const ENERGIA_POR_MIN = 12;
function energiaMedia(lista) { const js = lista.filter(Boolean); return js.length ? Math.round(js.reduce((a, j) => a + clamp(j.energia, 0, 100), 0) / js.length) : 100; }
function minutosParaDescansar(lista, alvo = 70) { const t = G.save.time; const vel = ENERGIA_POR_MIN * (1 + 0.25 * ((t.estr && t.estr.med) || 0)); const falta = Math.max(0, ...lista.filter(Boolean).map(j => alvo - j.energia)); return Math.ceil(falta / vel); }

function modalComoFunciona(voltaPara) {
  const s = G.save, t = s.time; const d = DIVS[t.div];
  const sec = (tit, ...ps) => el('div', { class: 'guia-sec' }, el('h3', {}, tit), ...ps.map(p => el('p', {}, p)));
  abreModal.largo = true;
  abreModal(el('h2', {}, '📘 How My Team works'),
    sec('🎯 The goal', `Each season has ${t.liga.rodadas.length} rounds against the other ${TIMES_LIGA - 1} teams in the division. At the end, the TOP 2 move up a division and the BOTTOM 2 go down. Each title unlocks invites to leagues in other countries with similar strength (in Club → Leagues around the world, from weakest to strongest).`,
      `During the season there's also the Cup (knockout with bigger prizes) and the sponsor goal (Club tab).`),
    sec('⚽ Play a match', `In the "Play match" tab: "Kickoff!" = you play and make your own moves (you get full XP). "Simulate result" = you get the score right away (you get half the XP). A win puts prize money in the club's bank and a 25% bonus in YOUR pocket.`,
      `The screen shows your chance to win before the match: if it's low, improve your lineup first.`),
    sec('⚡ Energy (each player\'s colored bar)', `Each match uses 16 to 24 energy from everyone who played. Green = rested, yellow = getting tired, RED = exhausted. A tired player plays up to 38% worse.`,
      `Energy comes back BY ITSELF: ${ENERGIA_POR_MIN} points per real minute (faster with the Medical Department). So: have subs, rotating is the secret! The "Auto lineup" button already picks the most rested players.`),
    sec('📈 How players improve', `Players who play earn experience. "Train squad" (once per game day) gives experience to EVERYONE. Each level gives the player +2 to their stats, up to their limit: that's the "max" shown on the card (e.g.: max 46 = no stat goes above 46). A young player with a high max = future star!`,
      `From age 32 their body slows down a bit, and at 36 the player retires. The Youth Academy (Club tab) finds young players every season.`),
    sec('🔢 The numbers on the card', `ATQ = attack · DEF = defense · PAS = passing · FÍS = physical. The BIG number on the right is their overall strength in their position. The average strength in your division is now ~${d.base}: a starter well below that is a weak spot.`,
      `"Out of position" = a player in a position that isn't theirs: they play 15% worse (similar position) or 32% worse (very different). A stand-in goalkeeper plays at only 40%.`),
    sec('🛒 When to sign players', `Sign players when: (1) a starter is much weaker than the division average; (2) you don't have subs to rotate the tired ones; (3) your team moves up a division (rivals get stronger). The Market shows "⬆ better than your starter" when it's worth it.`,
      `Careful: every player has a SALARY per round. The scout brings new players every game day. Legends (bosses you've beaten) can also be signed.`),
    sec('💰 The club\'s bank', `Money in: prizes, ticket sales (home games), sponsorship and sales. Money out: salaries, training, signings and building. A NEGATIVE bank delays salaries and drops team morale. You can deposit money from your own pocket (Club tab).`),
    sec('🏗️ Buildings (Club tab)', `Medical Department = less tiredness and energy comes back faster (great first investment). Training Center = players improve faster. Stadium = more ticket sales. Scouts = better market. Youth Academy = more future stars.`),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => abrirTime(voltaPara || 'elenco') }, 'Got it, back to the team')));
}

// o que fazer agora (no máximo 3 dicas, a mais importante primeiro)
function proximosPassos() {
  const s = G.save, t = s.time; const esc = escalacaoAtual(); const tit = esc.map(x => x.j).filter(Boolean);
  const reservas = elencoCompleto().filter(j => !t.titulares.includes(j.id)); const dicas = [];
  const faltam = esc.filter(x => !x.j).length;
  if (faltam) dicas.push({ nivel: 3, txt: `You're missing ${faltam} starters in the lineup. Press "Auto lineup" or sign players in the Market.`, bt: ['Auto lineup', () => { autoEscalar(); abrirTime('elenco'); }] });
  if (t.caixa < 0) dicas.push({ nivel: 3, txt: 'The bank is NEGATIVE: salaries are late and morale drops. Sell a sub or deposit from your own pocket (Club tab).', bt: ['Go to the Club', () => abrirTime('clube')] });
  const em = energiaMedia(tit);
  if (em < 45) {
    const descansados = reservas.filter(j => !j.eu && j.energia >= 60).length;
    const min = minutosParaDescansar(tit);
    dicas.push({ nivel: 3, txt: `Your team is TIRED (average energy ${em}%): that makes them play much worse. ${descansados ? `You have ${descansados} rested sub(s): "Auto Lineup" will put them in.` : 'There are no rested subs.'} Or wait about ${min} min: energy comes back by itself.`, bt: descansados ? ['Auto lineup', () => { autoEscalar(); abrirTime('elenco'); }] : ['See the Market', () => abrirTime('mercado')] });
  }
  if (reservas.filter(j => !j.eu).length < 5) dicas.push({ nivel: 2, txt: `You only have ${reservas.filter(j => !j.eu).length} sub(s). With more subs you can rotate the tired ones. Sign players in the Market (check the salary!).`, bt: ['See the Market', () => abrirTime('mercado')] });
  const fora = esc.filter(x => x.j && !x.j.eu && x.j.pos !== x.slot);
  if (fora.length) dicas.push({ nivel: 1, txt: `${fora.map(x => x.j.nome).join(', ')} ${fora.length > 1 ? 'are' : 'is'} out of position and play${fora.length > 1 ? 'm' : ''} worse. It's best to have a player for each position.` });
  const fracos = esc.filter(x => x.j && !x.j.eu && ovr(x.j) < DIVS[t.div].base - 3);
  if (fracos.length) dicas.push({ nivel: 1, txt: `Weak spot: ${fracos.map(x => `${x.j.nome} (${ovr(x.j)})`).join(', ')} below the division average (~${DIVS[t.div].base}). Look for a new signing in the Market.`, bt: ['See the Market', () => abrirTime('mercado')] });
  if (treinoLiberado(t) && t.caixa >= custoTreino()) dicas.push({ nivel: 1, txt: `Training is available: all players gain experience (${fmt(custoTreino())} from the bank).` });
  if (!dicas.length) dicas.push({ nivel: 0, txt: 'All set! Team rested and lined up. Go to "Play match".', bt: ['Play match', () => abrirTime('jogar')] });
  return dicas.sort((a, b) => b.nivel - a.nivel).slice(0, 3);
}
function caixaProximoPasso() {
  const box = el('div', { class: 'guia-passo' }, el('b', {}, '💡 Next step'));
  for (const d of proximosPassos()) box.append(el('div', { class: 'guia-dica n' + d.nivel }, el('span', {}, d.txt), d.bt ? el('button', { class: 'btn mini amarelo', type: 'button', onclick: d.bt[1] }, d.bt[0]) : null));
  return box;
}

// cartão do jogador: energia em % ao lado da barrinha
{
  const _cartaJogadorG = cartaJogador;
  cartaJogador = function (j) {
    const c = _cartaJogadorG.apply(this, arguments);
    const bar = c.querySelector('.bl-hp'); const e = Math.round(clamp(j.energia, 0, 100));
    if (bar) { bar.title = `Energy ${e}%`; bar.after(el('small', { class: 'guia-en', style: `color:${e > 60 ? '#2a8a2a' : e > 30 ? '#a08a10' : '#c0301a'}` }, `⚡ energy ${e}%${e <= 30 ? ' (exhausted)' : e <= 60 ? ' (getting tired)' : ''}`)); }
    return c;
  };
}
// abrirTime: botão "Como funciona", legenda, "Próximo passo" e o comparativo do Mercado
{
  const _abrirTimeG = abrirTime;
  abrirTime = function (aba = 'elenco') {
    const r = _abrirTimeG.apply(this, arguments);
    const s = G.save; if (!s || !s.time) return r;
    const box = document.getElementById('modalConteudo'); const tabs = box && box.querySelector('.tabs-modal'); if (!tabs) return r;
    tabs.append(el('button', { class: 'btn verde', type: 'button', onclick: () => modalComoFunciona(aba) }, '📘 How it works'));
    if (aba === 'elenco' || aba === 'jogar') tabs.after(caixaProximoPasso());
    if (aba === 'elenco') {
      const h = [...box.querySelectorAll('h3')].find(x => /^(?:Titulares|Starters)/.test(x.textContent));
      if (h) h.after(el('p', { class: 'guia-legenda' }, 'ATQ attack · DEF defense · PAS passing · FÍS physical · big number = strength · ⚡ = energy (comes back by itself over time) · max = how high the stats can grow'));
    }
    if (aba === 'mercado') {
      const t = s.time; const esc = escalacaoAtual();
      const titularDa = pos => esc.filter(x => x.slot === pos && x.j).map(x => ovrNoSlot(x.j, pos)).sort((a, b) => a - b)[0]; // o mais fraco da posição
      for (const card of box.querySelectorAll('.lista .linha-item')) {
        const nome = (card.querySelector('.nm b') || {}).textContent; const j = (t.mercado || []).find(x => x.nome === nome && card.textContent.includes(POS_NOME[x.pos])); if (!j) continue;
        const ref = titularDa(j.pos); const dif = ref == null ? null : ovr(j) - Math.round(ref);
        const tag = ref == null ? el('small', { class: 'guia-cmp bom' }, `⬆ you don't have a starting ${POS_NOME[j.pos].toLowerCase()}`) : dif > 0 ? el('small', { class: 'guia-cmp bom' }, `⬆ +${dif} over your starting ${POS_NOME[j.pos].toLowerCase()}`) : el('small', { class: 'guia-cmp' }, dif === 0 ? '= same as your starter' : `${dif} below your starter (good as a sub)`);
        const nm = card.querySelector('.nm'); if (nm) nm.append(tag); // o salário já aparece na linha de cima
      }
      const p = box.querySelector('p'); if (p) p.after(el('p', { class: 'guia-legenda' }, 'It\'s worth signing when you see "⬆ over your starter" or when you need subs to rotate the tired ones. Remember the salary per round!'));
    }
    // primeira vez: o guia abre sozinho
    if (!s.flags.guia_time_visto) { s.flags.guia_time_visto = true; setTimeout(() => modalComoFunciona(aba), 50); }
    return r;
  };
}
{
  const st = document.createElement('style');
  st.textContent = `.guia-passo { margin: 8px 0; padding: 8px 10px; border-radius: 10px; background: #fff6d8; border: 2px solid #e8c040; }
  .guia-dica { display: flex; gap: 8px; align-items: center; justify-content: space-between; margin-top: 5px; font-size: 14px; line-height: 1.3; }
  .guia-dica.n3 { color: #a02010; font-weight: 700; } .guia-dica button { flex: none; }
  .guia-legenda { font-size: 12px; opacity: .85; margin: 2px 0 6px; } .guia-en { display: block; font-size: 11px; font-weight: 700; }
  .guia-cmp { display: block; font-size: 12px; font-weight: 700; color: #6a5a40; } .guia-cmp.bom { color: #1a8a2a; }
  .guia-sec h3 { margin: 12px 0 4px; } .guia-sec p { margin: 4px 0; line-height: 1.4; }`;
  document.head.append(st);
}
