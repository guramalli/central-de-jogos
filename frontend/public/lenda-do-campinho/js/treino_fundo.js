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
    const a = G.alvo; if (a && a.d && a.d.treino) return true; // boneco de treino
    // v354: "treino de mana" — gastando foco (curas, habilidades) sem nenhum adversário por perto, mesmo sem mirar o boneco
    const ag = Date.now(); return ev.some(e => e[1] === 'visao' && ag - e[0] < 30000) && G.mons.every(m => m.d.treino || m.d.pedra || Math.hypot(m.x - G.p.x, m.y - G.p.y) > 8);
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
      const r = ritmo(); if (!r) return;
      // v334 (pedido do dono): só conta UMA habilidade — a do aparelho, ou a que você está treinando no boneco.
      // v354 (dono: "treino Visão e para quando minimizo"): batendo no boneco = a habilidade física mais treinada (a Visão
      // não pega carona); só gastando foco, sem bater (o "treino de mana") = a Visão.
      const fis = Object.keys(r).filter(k => k !== 'visao' && s.sk && s.sk[k]).sort((x, y) => r[y] - r[x])[0];
      const batendo = fis && r[fis] * 60000 >= 6; // 6+ golpes por minuto no boneco = treino físico
      const foco = G.estTreino && G.estTreino.d ? G.estTreino.d.sk : batendo ? fis : r.visao ? 'visao' : fis;
      if (!foco || !r[foco]) return;
      const taxa = { [foco]: r[foco] };
      // Visão = foco gasto. Escondido, o máximo é o quanto o foco REGENERA (como o treino de mana do Tibia),
      // com o bônus das comidas só enquanto elas durarem (o relógio delas agora anda com a janela escondida)
      let segs = null;
      if (foco === 'visao' && !G.estTreino) { // (no Quadro Tático a Visão não gasta foco: vale o ritmo medido)
        segs = []; const orig = s.comidas, ord = comidasAtivas(s).map(c => ({ ...c })).sort((a, b) => a.resta - b.resta); let t = 0;
        try {
          for (let k = 0; k <= ord.length; k++) {
            s.comidas = ord.slice(k).map(c => ({ ...c })); const reg = Math.max(0, stats().regenFoco) / 1000;
            const ate = k < ord.length ? Math.max(t, ord[k].resta * 1000) : 1e15; if (ate > t) segs.push([t, ate, Math.min(r.visao, reg)]); t = ate;
          }
        } finally { s.comidas = orig; }
      }
      s.treinoBg = { desde: Date.now(), taxa, segs }; duranteFundo = {};
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
        const bruto = sk === 'visao' && Array.isArray(bg.segs) ? bg.segs.reduce((a, [de, ate, tx]) => a + Math.max(0, Math.min(ms, ate) - de) * tx, 0) : bg.taxa[sk] * ms;
        const n = Math.max(0, Math.round(bruto) - (feito[sk] || 0)); if (!n) continue;
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
  // v354: o relógio das COMIDAS anda com a janela escondida (antes congelava: o jogo só conta o tempo quando desenha a tela)
  const CF = { desde: 0, rodou: 0 };
  const _atuFundo = atualiza;
  atualiza = function (dt) { if (CF.desde) CF.rodou += dt || 0; return _atuFundo.apply(this, arguments); };
  function comidasAndam() {
    if (!CF.desde) return; const s = G.save; const seg = Math.max(0, (Math.min(MAX_MS, Date.now() - CF.desde) - CF.rodou) / 1000); CF.desde = 0; CF.rodou = 0;
    if (!s || !seg) return; const lista = comidasAtivas(s);
    for (let i = lista.length - 1; i >= 0; i--) { lista[i].resta -= seg; if (lista[i].resta <= 0) { if (ITENS[lista[i].id]) log(`O efeito de ${ITENS[lista[i].id].nome} acabou enquanto a janela estava minimizada.`, 'l-sis'); lista.splice(i, 1); } }
    G.uiSujo = true;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { CF.desde = Date.now(); CF.rodou = 0; escondeu(); }
    else setTimeout(() => { try { comidasAndam(); entrega(false); } catch (e) { } }, 300);
  });
  // a página foi fechada/recarregada no meio: entrega quando o jogo abrir de novo
  const _iniciarFundo = iniciarJogo;
  iniciarJogo = async function (...a) {
    const r = await _iniciarFundo.apply(this, a);
    if (G.save && G.save.treinoBg) setTimeout(() => { try { duranteFundo = null; entrega(false); } catch (e) { } }, 2200);
    return r;
  };
  window.TREINO_FUNDO = { escondeu, entrega, ritmo, ev, CF, comidasAndam }; // (para os testes)
}
