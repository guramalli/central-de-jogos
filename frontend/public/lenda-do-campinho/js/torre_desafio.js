/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🗼🔥 TORRE INFINITA — DESAFIO (v353, pedido do dono: "a torre está muito fácil")
   - TEMPO por andar: 90 s (comum) / 180 s (chefão) / 480 s (Guardião, v362). Acabou: a Torre te teletransporta para fora
     (sem prêmio; o recorde continua). O tempo para junto com o jogo (janela aberta).
   - ONDAS: além das criaturas do começo, mais duas ondas entram pelas bordas (no tempo marcado ou quando sobram
     poucas) — inclusive uma versão VELOZ que vem direto em você. O andar só termina quando TODAS as ondas saírem.
   - PEDRA DA TORRE (andares comuns): muita vida, não anda e, enquanto não quebra, chama um reforço a cada 6 s.
     v355: QUEBRAR A PEDRA VENCE O ANDAR na hora (é a meta); as criaturas que sobraram somem.
   - CHEFÃO e GUARDIÃO perigosos: ONDA DE CHOQUE (aviso de ~0,9 s; tira uma parte do fôlego MÁXIMO — a defesa
     não zera), INVESTIDA até você e FÚRIA na metade da vida (mais rápido e mais forte). Cada golpe comum dele
     também tira 3% do fôlego máximo.
   - Painel no alto (andar, tempo, inimigos, Pedra) e bordas avermelhadas que pulsam nos últimos 10 s.
   O mapa (lava, tochas, Pedra no centro, ondas) é montado em torre_infinita.js. Carregar DEPOIS dele.
   ============================================================ */
const TD = { mapa: null };
// v362 (dono, nível 555: "mesmo não morrendo, não consigo matar a tempo"): o Guardião foi calibrado (v322) para 5–10 min de luta
// e o limite de 180 s da v353 o deixava quase impossível na mão (o robô da s18, perfeito, leva ~150 s). Guardião: 8 min.
function tdTempoTotal(n) { return (RELIQUIA_ANDAR[n] ? 480 : n % 10 === 0 ? 180 : 90) * 1000; }
function tdVivos(semPedra) { return G.mons.filter(m => !(semPedra && m.d.pedraTorre)).length; }
function tdSpawn(id, x, y) {
  const sp = { m: id, x, y, raio: 2 }; const m = criaMonstro(sp); if (!m) return null;
  m.bravo = true; G.mons.push(m); efeito('area', m.x, m.y, '#ff3a5a', 1.2); return m;
}
function tdBorda() { // um ponto livre na borda da arena, longe do jogador
  for (let t = 0; t < 20; t++) {
    const ang = Math.random() * Math.PI * 2, x = Math.round(17 + Math.cos(ang) * 9.2), y = Math.round(14 + Math.sin(ang) * 9.2 / 1.1);
    if (podeAndar(x + 0.5, y + 0.5) && (!G.p || Math.hypot(x - G.p.x, y - G.p.y) > 5)) return [x, y];
  }
  return [17, 6];
}
{
  const _atualizaTD = atualiza;
  atualiza = function (dt) {
    const r = _atualizaTD.apply(this, arguments);
    try { tdPasso(dt || 16); } catch (e) { }
    return r;
  };
}
function tdPasso(dt) {
  const M = G.mapa;
  if (!M || !M.torre) { if (TD.mapa) { TD.mapa = null; tdHud(false); } return; }
  const cfg = M.torreCfg || { ids: [], ondas: [], ondaEm: [] };
  if (TD.mapa !== M) { Object.assign(TD, { mapa: M, n: M.torre, total: tdTempoTotal(M.torre), resta: tdTempoTotal(M.torre), t: 0, onda: 0, invoca: 6000, acabou: false }); }
  if (TD.acabou || G.torreLimpo) { tdHud(true); return; }
  TD.t += dt; TD.resta -= dt;
  // ondas
  if (TD.onda < cfg.ondas.length && (TD.t >= cfg.ondaEm[TD.onda] || tdVivos(true) <= 3)) {
    const q = cfg.ondas[TD.onda]; for (let k = 0; k < q; k++) { const [x, y] = tdBorda(); tdSpawn(cfg.ids[k % cfg.ids.length], x, y); }
    TD.onda++; banner(`⚠️ Onda ${TD.onda + 1}!`, `Mais ${q} adversários entraram na arena!`); som('apito');
  }
  // a Pedra chama reforços (e fica PARADA no lugar: pedra não anda nem é empurrada)
  const pedra = G.mons.find(m => m.d.pedraTorre);
  if (pedra) { pedra._fixo = pedra._fixo || { x: pedra.x, y: pedra.y }; pedra.x = pedra._fixo.x; pedra.y = pedra._fixo.y; }
  if (pedra && TD.t >= TD.invoca) {
    TD.invoca = TD.t + 6000;
    if (G.mons.length < 16 && cfg.ids.length) {
      const ang = Math.random() * Math.PI * 2; const nm = tdSpawn(cfg.ids[(Math.random() * cfg.ids.length) | 0], Math.round(pedra.x + Math.cos(ang) * 2.2), Math.round(pedra.y + Math.sin(ang) * 2.2));
      if (nm) { efeito('area', pedra.x, pedra.y, '#ff2a2a', 2.2); if (Math.random() < 0.4) fala(pedra, pedra.d.falas[(Math.random() * pedra.d.falas.length) | 0]); }
    }
  }
  // chefão / guardião
  for (const m of G.mons) if (m.d.chefe) tdChefe(m, dt);
  // tempo esgotado: para fora!
  if (TD.resta <= 0) {
    TD.acabou = true; G.torreLimpo = true; TD.resta = 0;
    banner('⏰ Tempo esgotado!', 'A Torre te expulsou... tente de novo!'); som('erro');
    if (typeof coFimHost === 'function') coFimHost('tempo');
    log(`⏰ O tempo do andar ${M.torre} acabou e a Torre te teletransportou para fora. O seu recorde continua.`, 'l-dano');
    setTimeout(() => { if (G.mapa && G.mapa.torre) torreVoltaHub(); }, 1600);
  }
  tdHud(true);
}
function tdChefe(m, dt) {
  const s = stats(), g = /_g$/.test(m.tipo), pct = g ? 0.16 : 0.11, T = m._td || (m._td = { onda: TD.t + 6000, dash: TD.t + 9000, bravo: false, aviso: 0 });
  if (!T.bravo && m.hp < m.d.hp * 0.5) {
    T.bravo = true; m.d.vel = (m.d.vel || 100) * 1.3; m.d.atk = Math.round(m.d.atk * 1.3);
    banner(`😡 ${m.d.nome} ficou FURIOSO!`, 'Mais rápido e mais forte!'); // som e brilho da fúria: chefes_vivos.js
  }
  // onda de choque, com aviso
  if (TD.t >= T.onda && !T.aviso) { T.aviso = TD.t + 900; texto(m, '⚠️ ONDA DE CHOQUE!', '#ff5a5a', 900, -0.6); efeito('area', m.x, m.y, '#ff3a3a', 3.5); som('chefe_aviso'); if (typeof coFx === 'function') coFx({ k: 'aviso', x: m.x, y: m.y }); }
  if (T.aviso && TD.t >= T.aviso) {
    T.aviso = 0; T.onda = TD.t + (T.bravo ? 5000 : 7000); efeito('impacto', m.x, m.y, '#ff5a2a', 3.5); efeito('area', m.x, m.y, '#ffb03a', 3.5); som('chefe_choque'); if (typeof tremeTela === 'function') tremeTela(6, 400);
    if (G.p && Math.hypot(G.p.x - m.x, G.p.y - m.y) <= 3.5) recebeDano(Math.round(s.maxHp * pct), m);
    if (typeof coFx === 'function') coFx({ k: 'choque', x: m.x, y: m.y, r: 3.5, p: pct, u: m.uid }); // Torre em grupo: os colegas perto também levam
  }
  // investida até o jogador
  if (m._dash) {
    const pas = dt / 1000 * 14; let k = 0;
    while (k < pas && TD.t < m._dash.fim) { const nx = m.x + m._dash.dx * 0.25, ny = m.y + m._dash.dy * 0.25; if (!podeAndar(nx, ny)) { m._dash.fim = 0; break; } m.x = nx; m.y = ny; k += 0.25; }
    if (TD.t >= m._dash.fim) { if (G.p && Math.hypot(G.p.x - m.x, G.p.y - m.y) <= 1.5) { recebeDano(Math.round(s.maxHp * pct * 0.7), m); efeito('impacto', G.p.x, G.p.y, '#ff5a2a'); } m._dash = null; }
  } else if (TD.t >= T.dash && G.p) {
    const dx = G.p.x - m.x, dy = G.p.y - m.y, d = Math.hypot(dx, dy);
    T.dash = TD.t + (T.bravo ? 6000 : 9000);
    if (d > 2.5) { m._dash = { dx: dx / d, dy: dy / d, fim: TD.t + 350 }; texto(m, 'INVESTIDA!', '#ffb03a', 700, -0.6); m.flip = dx < 0; }
  }
}
// v355 (dono: "a meta é matar a pedra"): quebrou a PEDRA DA TORRE = andar vencido na hora (as criaturas que sobraram somem)
{
  const _matarTD = matar;
  matar = function (m) {
    const r = _matarTD.apply(this, arguments);
    try {
      if (m && m.d && m.d.pedraTorre && G.mapa && G.mapa.torre && !G.torreLimpo && !TD.acabou) {
        for (const o of G.mons) efeito('puff', o.x, o.y);
        G.mons = []; G.respawns = []; G.projs = [];
        const cfg = G.mapa.torreCfg; if (cfg) TD.onda = cfg.ondas.length; // nenhuma onda a caminho
        banner('🗿 Pedra quebrada!', 'Andar vencido!'); som('chefe_queda');
        G.torreLimpo = true; torreLimpou();
      }
    } catch (e) { }
    return r;
  };
}
// pedra não anda nem ataca (como as Pedras Celestiais do Vale)
{
  const _amTD = atualizaMonstro;
  atualizaMonstro = function (m) { if (m && m.d && m.d.pedraTorre) return; return _amTD.apply(this, arguments); };
}
// cada golpe comum do chefão da Torre também tira 3% do fôlego máximo (a defesa não zera)
{
  const _ataTD = monstroAtaca;
  monstroAtaca = function (m) {
    const r = _ataTD.apply(this, arguments);
    try { if (G.mapa && G.mapa.torre && m.d.chefe && G.save.hp > 0) recebeDano(Math.max(1, Math.round(stats().maxHp * 0.03)), m); } catch (e) { }
    return r;
  };
}
// o andar só termina quando todas as ondas tiverem entrado
{
  const _limpouTD = torreLimpou;
  torreLimpou = function () {
    const cfg = G.mapa && G.mapa.torreCfg;
    if (TD.acabou) return;
    if (cfg && TD.mapa === G.mapa && TD.onda < cfg.ondas.length) { G.torreLimpo = false; return; }
    const sobrou = Math.max(0, Math.ceil(TD.resta / 1000));
    const r = _limpouTD.apply(this, arguments);
    if (sobrou) log(`⏱️ Andar vencido com ${sobrou} s de sobra!`, 'l-xp');
    return r;
  };
}
// painel do andar + bordas vermelhas
function tdHud(on) {
  let h = document.getElementById('torreHud'), v = document.getElementById('torreVinheta');
  if (!on) { if (h) h.remove(); if (v) v.remove(); return; }
  if (!h) { h = el('div', { id: 'torreHud' }); document.body.append(h); }
  if (!v) { v = el('div', { id: 'torreVinheta' }); document.body.append(v); }
  const seg = Math.ceil(Math.max(0, TD.resta) / 1000), mm = Math.floor(seg / 60), ss = String(seg % 60).padStart(2, '0');
  const pedra = G.mons.find(m => m.d.pedraTorre), cfg = (G.mapa && G.mapa.torreCfg) || { ondas: [] };
  const txt = `🗼 Andar ${TD.n} · ⏳ ${mm}:${ss} · 👾 ${tdVivos(true)}` + (TD.onda < cfg.ondas.length ? ` · 🌊 ${cfg.ondas.length - TD.onda} onda(s) a caminho` : '') + (pedra ? ` · 🗿 Quebre a Pedra: ${Math.ceil(pedra.hp / pedra.d.hp * 100)}%` : '');
  if (h.textContent !== txt) h.textContent = txt;
  const urg = seg <= 10 && !TD.acabou && !G.torreLimpo;
  h.classList.toggle('urgente', urg); v.classList.toggle('urgente', urg);
}
{
  const css = document.createElement('style');
  css.textContent = `#torreHud { position: fixed; top: 58px; left: 50%; transform: translateX(-50%); z-index: 60; pointer-events: none; padding: 6px 14px; border-radius: 12px;
    background: rgba(30,6,16,.86); color: #ffe0c0; border: 2px solid #c8203a; font: 800 15px Nunito, 'Segoe UI', sans-serif; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,.45); }
  #torreHud.urgente { color: #fff; background: rgba(160,10,30,.92); animation: tdPulsa .5s ease-in-out infinite alternate; }
  #torreVinheta { position: fixed; inset: 0; z-index: 5; pointer-events: none; background: radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(70,0,20,.5) 100%); }
  #torreVinheta.urgente { animation: tdVinheta .5s ease-in-out infinite alternate; }
  @media (prefers-reduced-motion: reduce) { #torreHud.urgente, #torreVinheta.urgente { animation: none; } #torreVinheta.urgente { background: radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(170,0,30,.6) 100%); } }
  @keyframes tdPulsa { from { transform: translateX(-50%) scale(1); } to { transform: translateX(-50%) scale(1.08); } }
  @keyframes tdVinheta { from { background: radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(120,0,20,.45) 100%); } to { background: radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(200,0,30,.7) 100%); } }`;
  document.head.append(css);
}
