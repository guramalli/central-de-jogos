/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📅 CARTÃO "HOJE" (v407, Raio-X I2 — aprovado pelo dono: "faça tudo menos I1")
   Quem voltava no dia seguinte via só a recompensa diária e o mesmo "Coma 3 alimentos". Agora, junto do "🎯 Agora",
   uma etiqueta "📅 Hoje 1/3" abre o cartão do dia:
   - 3 METAS CURTAS (cabem numa sessão de 20–40 min): vencer 10 adversários do seu nível · acertar 3 perguntas (Quiz
     do Seu Juca ou aula da Professora Lúcia) · fazer 1 gol (pênalti ou lance de futebol);
   - um BAÚ quando as 3 ficam prontas, e a SEQUÊNCIA de dias com o baú aberto (faltar um dia PAUSA, não zera — R11);
   - o presente da recompensa diária e o atalho para as Tarefas da semana;
   - "🌅 Desde a última vez": ao voltar num dia novo, o cartão abre sozinho UMA vez (no lugar da janela da recompensa
     diária: uma janela só) e conta o que você fez da última vez e o que há de novo hoje.
   Fica salvo em save.hoje. Prefixo: hj. Carregar no FIM (depois de diaria.js, tarefas.js, objetivo_agora.js,
   hud_v407.js e revela_nivel.js).
   ============================================================ */
const HJ_METAS = [
  { id: 'vence', ic: '⚔️', n: 10, txt: n => `Vença ${n} adversários do seu nível`, conta: (h) => h.vence || 0 },
  { id: 'quiz', ic: '❓', n: 3, txt: n => `Acerte ${n} perguntas (Quiz do Seu Juca ou aula da Professora Lúcia)`, conta: (h, s) => ((s.st.quiz || 0) + (s.st.prof || 0)) - (h.base.quiz || 0) },
  { id: 'gol', ic: '⚽', n: 1, txt: () => 'Faça 1 gol (pênalti ou lance de futebol)', conta: (h, s) => (s.st.gols || 0) - (h.base.gols || 0) },
];
const hjTutFeito = s => typeof TUTORIAL === 'undefined' || (s.tut || 0) >= TUTORIAL.length;
const hjFoto = s => ({ nivel: s.nivel || 1, ouro: Math.round(s.ouro || 0), abates: (s.st && s.st.abates) || 0, missoes: Object.values(s.quests || {}).filter(e => e && e.s === 'feita').length, figs: Object.keys(s.figs || {}).length });
function hjDados(s = G.save) {
  if (!s) return null;
  const hoje = diaHoje();
  if (!s.hoje || typeof s.hoje !== 'object') s.hoje = { dia: hoje, vence: 0, base: { quiz: (s.st.quiz || 0) + (s.st.prof || 0), gols: s.st.gols || 0 }, bau: false, seq: 0, foto: hjFoto(s), semana: typeof tarSemanaId === 'function' ? tarSemanaId() : '' };
  const h = s.hoje;
  if (h.dia !== hoje) { // virou o dia: guarda o que aconteceu da última vez e começa as metas novas
    h.ontem = { dia: h.dia, bau: !!h.bau, feitas: HJ_METAS.filter(m => m.conta(h, s) >= m.n).length, antes: h.foto || hjFoto(s), depois: hjFoto(s), semanaAntes: h.semana || '' };
    h.dia = hoje; h.vence = 0; h.base = { quiz: (s.st.quiz || 0) + (s.st.prof || 0), gols: s.st.gols || 0 }; h.bau = false; h.foto = hjFoto(s); h.mostrou = false;
    h.semana = typeof tarSemanaId === 'function' ? tarSemanaId() : '';
  }
  if (!h.base) h.base = { quiz: 0, gols: 0 };
  return h;
}
const hjFeitas = (h, s = G.save) => HJ_METAS.filter(m => m.conta(h, s) >= m.n).length;
const hjBauPronto = (h, s = G.save) => !h.bau && hjFeitas(h, s) >= HJ_METAS.length;
function hjPremio(s = G.save) { return { ouro: (50 + (s.nivel || 1) * 20) * 3, garrafas: 3, pacotinho: ((s.hoje && s.hoje.seq) || 0) % 3 === 2 }; }
function hjAbreBau() {
  const s = G.save, h = hjDados(s); if (!h || !hjBauPronto(h, s)) return;
  const p = hjPremio(s); h.bau = true; h.seq = (h.seq || 0) + 1;
  s.ouro += p.ouro; try { recebeItem(tarMelhor('hp'), p.garrafas); } catch (e) { }
  if (p.pacotinho) try { recebeItem('pacotinho', 1); } catch (e) { }
  log(`🧰 Baú do dia aberto: ${fmt(p.ouro)} tostões, ${p.garrafas} garrafas de fôlego${p.pacotinho ? ' e um Pacotinho de Figurinhas' : ''}! Sequência: ${h.seq} dia(s).`, 'l-loot');
  som('moeda'); salvar(); G.uiSujo = true; hjModal();
}
// o que mudou desde a última vez (só no primeiro cartão do dia novo)
function hjNovidades(h, s) {
  const o = h.ontem; if (!o) return null;
  const a = o.antes || {}, d = o.depois || {}, fez = [];
  if (d.nivel > a.nivel) fez.push(`subiu do nível ${a.nivel} para o ${d.nivel}`);
  if (d.abates > a.abates) fez.push(`venceu ${fmt(d.abates - a.abates)} adversários`);
  if (d.missoes > a.missoes) fez.push(`terminou ${d.missoes - a.missoes} missão(ões)`);
  if (d.figs > a.figs) fez.push(`colou ${d.figs - a.figs} figurinha(s) nova(s)`);
  if (d.ouro > a.ouro) fez.push(`juntou ${fmt(d.ouro - a.ouro)} tostões`);
  const novo = ['📅 3 metas novas e um baú esperando por você.'];
  try { if (!diariaEstado().pegou) novo.push(`🎁 O presente do dia ${diariaEstado().dia} da recompensa diária.`); } catch (e) { }
  try { if (typeof ARENAS !== 'undefined' && ARENAS.some(x => s.nivel >= x.req) && (typeof rvLiberado !== 'function' || rvLiberado('arenas'))) novo.push('🏟️ O prêmio grande das Arenas voltou (a 1ª vitória de hoje vale o prêmio grande).'); } catch (e) { }
  if (h.semana && o.semanaAntes && h.semana !== o.semanaAntes && (typeof rvLiberado !== 'function' || rvLiberado('tarefas'))) novo.push('🗓️ Começou uma semana nova: Tarefas da semana novinhas.');
  try { if (MISSOES.some(q => statusMissao(q) === 'disponivel')) novo.push('❗ Tem missão nova esperando (siga a seta amarela).'); } catch (e) { }
  return el('div', { class: 'hj-ontem' }, el('b', {}, '🌅 Que bom que você voltou!'),
    el('p', {}, fez.length ? `Da última vez você ${fez.join(', ')}.` : 'Da última vez foi um dia tranquilo.'),
    el('p', {}, el('b', {}, 'Hoje tem: ')), el('ul', {}, ...novo.map(t => el('li', {}, t))));
}
function hjModal(comNovidades) {
  const s = G.save; if (!s) return; const h = hjDados(s);
  const metas = el('div', { class: 'hj-metas' }, ...HJ_METAS.map(m => {
    const v = Math.max(0, Math.min(m.n, m.conta(h, s))), ok = v >= m.n;
    const barra = el('div', { class: 'hj-barra' }, el('i', { style: `width:${Math.round(v / m.n * 100)}%` }));
    return el('div', { class: 'hj-meta' + (ok ? ' ok' : '') }, el('span', { class: 'hj-ic' }, ok ? '✅' : m.ic), el('div', { class: 'hj-tx' }, el('b', {}, m.txt(m.n)), barra), el('small', {}, `${v}/${m.n}`));
  }));
  const p = hjPremio(s), pronto = hjBauPronto(h, s);
  const bau = el('div', { class: 'hj-bau' + (pronto ? ' pronto' : '') + (h.bau ? ' aberto' : '') }, el('span', { class: 'hj-bau-ic' }, h.bau ? '📭' : '🧰'),
    el('div', {}, el('b', {}, h.bau ? 'Baú de hoje aberto! Volte amanhã para outro.' : pronto ? 'Baú pronto para abrir!' : 'Baú do dia: complete as 3 metas'),
      el('small', {}, `${fmt(p.ouro)} tostões + ${p.garrafas} garrafas de fôlego${p.pacotinho ? ' + 1 Pacotinho de Figurinhas' : ''}`)),
    pronto ? el('button', { class: 'btn verde', type: 'button', onclick: hjAbreBau }, 'Abrir o baú') : '');
  const seq = el('p', { class: 'hj-seq' }, `🔥 Sequência: ${h.seq || 0} dia(s) com o baú aberto. Faltou um dia? Ela só PAUSA — continua de onde parou.`);
  const extras = el('div', { class: 'opcoes hj-extras' });
  try { const d = diariaEstado(); extras.append(el('button', { class: 'btn' + (d.pegou ? '' : ' amarelo'), type: 'button', onclick: () => modalDiaria() }, d.pegou ? '🎁 Recompensa diária (já pegou)' : `🎁 Pegar o presente do dia ${d.dia}`)); } catch (e) { }
  if (typeof modalTarefas === 'function') {
    const lib = typeof rvLiberado !== 'function' || rvLiberado('tarefas');
    extras.append(el('button', { class: 'btn', type: 'button', disabled: lib ? null : 'disabled', title: lib ? 'As 6 tarefas que mudam toda segunda-feira' : '', onclick: () => modalTarefas('semana') }, lib ? '🗓️ Tarefas da semana' : `🔒 Tarefas da semana (nível ${typeof rvNivelDe === 'function' ? rvNivelDe('tarefas') : 8})`));
  }
  extras.append(el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Fechar'));
  abreModal(el('h2', {}, '📅 Hoje'), comNovidades ? hjNovidades(h, s) : '', el('p', { class: 'hj-sub' }, 'Três metas curtinhas para hoje. Fez as três? Abra o baú!'), metas, bau, seq, extras);
}
// a etiqueta perto do "🎯 Agora"
function hjEtiqueta() {
  const s = G.save; if (!s || !hjTutFeito(s)) return null;
  const h = hjDados(s), f = hjFeitas(h, s), pronto = hjBauPronto(h, s);
  return el('button', { class: 'btn mini hj-chip' + (pronto ? ' pronto' : '') + (h.bau ? ' feito' : ''), type: 'button', title: 'As 3 metas de hoje, o baú e a sua sequência de dias',
    onclick: ev => { ev.stopPropagation(); hjModal(); } }, el('b', {}, '📅 Hoje '), el('span', {}, h.bau ? '✔ baú aberto' : pronto ? '🧰 baú pronto!' : `${f}/3`), (h.seq || 0) > 0 ? el('small', {}, ` · 🔥${h.seq}`) : '');
}
// a recompensa diária deixa o cartão "Hoje" abrir no lugar dela (diaria.js pergunta)
function hjAssumeDiaria() { const s = G.save; if (!s || !hjTutFeito(s)) return false; const h = hjDados(s); return !!(h && h.ontem && !h.mostrou); }
{
  // contagem: "vença 10 adversários do seu nível" (o fraco demais não conta)
  const _matarHj = matar;
  matar = function (m) {
    let conta = false;
    try { const s = G.save, d = m && m.d; conta = !!(s && d && !d.treino && !d.pedra && (d.xp || 0) > 0 && nivelMonstro(d) >= (s.nivel || 1) - Math.max(5, Math.round((s.nivel || 1) * 0.2))); } catch (e) { }
    const r = _matarHj.apply(this, arguments);
    if (conta) try { const h = hjDados(); const antes = hjBauPronto(h); h.vence = (h.vence || 0) + 1; if (!antes && hjBauPronto(h)) { log('🧰 As 3 metas de hoje estão prontas! Abra o baú no 📅 Hoje.', 'l-xp'); } } catch (e) { }
    return r;
  };
  // quiz e gol: avisa quando a última meta fica pronta
  const _ceHj = contaEvento;
  contaEvento = function (tipo) {
    let antes = false; try { if (G.save) antes = hjBauPronto(hjDados()); } catch (e) { }
    const r = _ceHj.apply(this, arguments);
    try { if (G.save && /^(quiz|prof|gols)$/.test(tipo) && !antes && hjBauPronto(hjDados())) log('🧰 As 3 metas de hoje estão prontas! Abra o baú no 📅 Hoje.', 'l-xp'); } catch (e) { }
    return r;
  };
  // a etiqueta, logo depois do "🎯 Agora" (ou da etiqueta de Missões)
  const _rastHj = atualizaRastreador;
  atualizaRastreador = function () {
    const r = _rastHj.apply(this, arguments);
    try {
      const R = document.getElementById('rastreador'); if (!R || !G.save) return r;
      const b = hjEtiqueta(); if (!b) return r;
      const ag = R.querySelector('.obj-agora') || R.querySelector('.rast-etiqueta');
      if (ag) { if (getComputedStyle(R).flexDirection === 'column-reverse') ag.before(b); else ag.after(b); } else R.append(b);
    } catch (e) { }
    return r;
  };
  // ao voltar num dia novo: o cartão abre sozinho uma vez (espera a tela ficar calma, como a recompensa diária)
  let espera = null;
  const _iniHj = iniciarJogo;
  iniciarJogo = async function () {
    const r = await _iniHj.apply(this, arguments);
    clearInterval(espera); const t0 = Date.now();
    espera = setInterval(() => {
      try {
        if (!G.save || Date.now() - t0 > 600000) { clearInterval(espera); return; }
        if (!hjAssumeDiaria()) return;
        const livre = G.rodando && !G.pausado && $('#modal').hidden && !(typeof HIST !== 'undefined' && HIST) && !G.jogoC && !G.fut && (typeof rvQuieto !== 'function' || rvQuieto());
        if (livre && Date.now() - t0 > 2500) { clearInterval(espera); hjDados().mostrou = true; hjModal(true); }
      } catch (e) { clearInterval(espera); }
    }, 1000);
    return r;
  };
  // virou o dia com o jogo aberto: a etiqueta se atualiza
  setInterval(() => { try { if (G.save && G.save.hoje && G.save.hoje.dia !== diaHoje()) { hjDados(); G.uiSujo = true; } } catch (e) { } }, 30000);
  const st = document.createElement('style');
  st.textContent = `#rastreador .hj-chip { pointer-events: auto; align-self: flex-start; margin: 3px 0; font-size: 13px; padding: 4px 10px; background: rgba(30,18,46,.88); color: #fff4d0; border: 2px solid #8fd0ff; white-space: nowrap; }
  #rastreador .hj-chip b { color: #8fd0ff; } #rastreador .hj-chip small { opacity: .85; }
  #rastreador .hj-chip.pronto { border-color: #7dff9a; animation: hjPulsa 1.4s ease-in-out infinite; } #rastreador .hj-chip.pronto b { color: #7dff9a; }
  #rastreador .hj-chip.feito { opacity: .7; }
  @keyframes hjPulsa { 50% { box-shadow: 0 0 0 4px rgba(125,255,154,.35); } }
  .hj-sub { margin: 0 0 8px; } .hj-metas { display: flex; flex-direction: column; gap: 6px; }
  .hj-meta { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; background: rgba(0,0,0,.06); }
  .hj-meta.ok { background: rgba(58,194,106,.18); } .hj-ic { font-size: 24px; width: 30px; text-align: center; } .hj-tx { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .hj-barra { height: 8px; border-radius: 6px; background: rgba(0,0,0,.15); overflow: hidden; } .hj-barra i { display: block; height: 100%; background: #3ac26a; }
  .hj-bau { display: flex; align-items: center; gap: 10px; margin: 10px 0 4px; padding: 10px; border-radius: 12px; border: 2px dashed rgba(138,75,36,.4); }
  .hj-bau > div { flex: 1; display: flex; flex-direction: column; } .hj-bau.pronto { border: 2px solid #3ac26a; background: rgba(58,194,106,.12); } .hj-bau.aberto { opacity: .75; }
  .hj-bau-ic { font-size: 34px; } .hj-seq { margin: 6px 0; font-weight: 700; }
  .hj-ontem { padding: 10px 12px; margin-bottom: 10px; border-radius: 12px; background: rgba(255,210,63,.22); border: 2px solid #e0a800; } .hj-ontem p { margin: 4px 0; } .hj-ontem ul { margin: 2px 0 0 18px; padding: 0; }`;
  document.head.append(st);
}
