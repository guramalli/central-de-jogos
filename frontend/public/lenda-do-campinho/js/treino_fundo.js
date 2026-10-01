/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏋️ TREINO COM O JOGO MINIMIZADO (v320). O dono deixou o jogo aberto a noite toda treinando no boneco,
   mas com a janela minimizada — e a habilidade não subiu nada: com a aba escondida o navegador PARA o
   desenho da tela (requestAnimationFrame), e o jogo inteiro roda dentro dele.
   Agora: se você estava treinando (batendo no boneco de treino ou num aparelho do Centro de Treinamento)
   quando a janela foi minimizada/escondida, o jogo anota o ritmo do seu treino naquele momento. Ao voltar,
   você recebe o treino do tempo em que ela ficou escondida, no MESMO ritmo de quando estava na tela
   (até 12 horas, o mesmo limite do treino offline). O que o jogo tiver treinado sozinho nesse meio-tempo
   é descontado (nada conta em dobro). Se a página for fechada/recarregada, o treino é entregue ao voltar.
   Carregar DEPOIS de treino.js e centros_treino.js.
   ============================================================ */
{
  const JANELA = 90000, MIN_AMOSTRA = 15000, MAX_MS = 12 * 3600000, MIN_MS = 30000;
  const ev = []; // [quando, habilidade, tentativas] dos últimos 90 s
  let entregando = false, duranteFundo = null;
  const _treinaFundo = treinaSkill;
  treinaSkill = function (sk, n) {
    if (!entregando) {
      const ag = Date.now(); ev.push([ag, sk, n || 0]);
      while (ev.length && ag - ev[0][0] > JANELA) ev.shift();
      if (duranteFundo) duranteFundo[sk] = (duranteFundo[sk] || 0) + (n || 0); // o jogo rodou um pouco escondido: não conta em dobro
    }
    return _treinaFundo.apply(this, arguments);
  };
  function treinandoAgora() {
    if (typeof G === 'undefined' || !G.rodando || !G.save || G.save.hp <= 0) return false;
    if (G.estTreino) return true; // aparelho do Centro de Treinamento
    const a = G.alvo; return !!(a && a.d && a.d.treino); // boneco de treino
  }
  function ritmo() { // tentativas por milissegundo de cada habilidade, medido nos últimos 90 s
    const ag = Date.now(), rec = ev.filter(e => ag - e[0] <= JANELA); if (rec.length < 3) return null;
    const ms = ag - rec[0][0]; if (ms < MIN_AMOSTRA) return null;
    const t = {}; for (const [, sk, n] of rec) t[sk] = (t[sk] || 0) + n;
    for (const k in t) t[k] /= ms; return t;
  }
  function escondeu() {
    try {
      const s = G.save; if (!s || s.treinoOff || s.treinoBg || !treinandoAgora()) return;
      const taxa = ritmo(); if (!taxa) return;
      s.treinoBg = { desde: Date.now(), taxa }; duranteFundo = {};
      try { salvar(); } catch (e) { }
    } catch (e) { }
  }
  function entrega(silencioso) {
    const s = G.save, bg = s && s.treinoBg; if (!bg) return;
    s.treinoBg = null; const feito = duranteFundo || {}; duranteFundo = null;
    const ms = Math.min(MAX_MS, Math.max(0, Date.now() - bg.desde));
    if (ms < MIN_MS || !s.sk) { try { salvar(); } catch (e) { } return; }
    const linhas = [];
    entregando = true;
    try {
      for (const sk of Object.keys(bg.taxa || {})) {
        if (!s.sk[sk] || !SKILLS[sk]) continue;
        const n = Math.max(0, Math.round(bg.taxa[sk] * ms) - (feito[sk] || 0)); if (!n) continue;
        const antes = s.sk[sk].lv; treinaSkill(sk, n); const depois = s.sk[sk].lv;
        linhas.push(depois > antes ? `${SKILLS[sk].nome}: ${antes} → ${depois} 🎉` : `${SKILLS[sk].nome} ${depois}: a barra de treino encheu mais um pouco!`);
      }
    } finally { entregando = false; }
    try { salvar(); } catch (e) { }
    if (!linhas.length) return;
    const h = Math.floor(ms / 3600000), min = Math.round(ms % 3600000 / 60000);
    const tempo = h ? `${h}h${min ? String(min).padStart(2, '0') : ''}` : `${min} min`;
    log(`🏋️ Enquanto a janela esteve minimizada (${tempo}), seu personagem continuou treinando. ${linhas.join(' · ')}`, 'l-xp');
    G.uiSujo = true;
    if (silencioso || ms < 10 * 60000 || typeof abreModal !== 'function') return;
    let tentativas = 0; // outra janela aberta (presente diário, história...): espera ela fechar
    const mostra = () => {
      if (!$('#modal').hidden || document.querySelector('#historia:not([hidden])')) { if (++tentativas < 120) setTimeout(mostra, 1000); return; }
      abreModal(el('h2', {}, '🏋️ Treino continuou!'),
        el('p', {}, `A janela do jogo ficou minimizada por ${tempo}, mas o seu personagem não parou de treinar.`),
        ...linhas.map(l => el('p', { style: 'font-size:18px;font-weight:800' }, l)),
        el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: fechaModal }, 'Bora!')));
    };
    mostra();
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) escondeu(); else setTimeout(() => { try { entrega(false); } catch (e) { } }, 300); });
  // a página foi fechada/recarregada no meio: entrega quando o jogo abrir de novo
  const _iniciarFundo = iniciarJogo;
  iniciarJogo = async function (...a) {
    const r = await _iniciarFundo.apply(this, a);
    if (G.save && G.save.treinoBg) setTimeout(() => { try { duranteFundo = null; entrega(false); } catch (e) { } }, 2200);
    return r;
  };
  window.TREINO_FUNDO = { escondeu, entrega, ritmo, ev }; // (para os testes)
}
