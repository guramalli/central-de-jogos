/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🧭 TUTORIAL SEM BECO (v407, Raio-X R2 — pedido do dono: "faça tudo menos I1")
   No teste de jogador novo, o tutorial mandava fazer coisas que não davam certo:
   - (d) "clique num pombo": a seta levava ao pombo mais perto, que muitas vezes fica na ZONA SEGURA (perto das
     pessoas ninguém desafia ninguém) e o aviso "Zona segura" repetia sem parar. Agora a seta leva a um pombo
     LONGE das pessoas e o aviso não fica repetindo;
   - (f) há 2 baús perto de casa (o da bola e o Armazém, do lado da porta) e só um tem a bola: o certo ganha
     uma ⚽ e um círculo piscando, e o Armazém avisa "a bola está no outro baú";
   - (e) "Coma 3 alimentos" não dizia COMO comer;
   - (a) passo da Mochila: apertar I (ou abrir a mochila) também conta como "Entendi".
   Prefixo tv*. Carregar no FIM (depois de zona_segura.js, armazem.js, mapa_marca.js, mochila_tibia.js, celular2.js).
   ============================================================ */
const TV = { zsAlvo: null, zsT: -1e9 };
const tvCel = () => typeof CEL !== 'undefined' && !!CEL;
const tvNoTutorial = () => !!(G.save && typeof TUTORIAL !== 'undefined' && G.save.tut < TUTORIAL.length);

// ---------- (d) o pombo do tutorial: longe da zona segura (ele e os 8 quadrados em volta, onde você fica para driblar) ----------
function tvForaDaZona(x, y) {
  if (typeof zonaSegura !== 'function') return true;
  const z = zonaSegura(), m = G.mapa;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (z.has((y + dy) * m.w + x + dx)) return false;
  return true;
}
function tvPomboLivre() {
  if (!G.mapa || !G.mons) return null;
  const a = G.alvo; // já escolheu um pombo bom: a seta continua nele
  if (a && a.tipo === 'pombo' && a.hp > 0 && G.mons.includes(a) && tvForaDaZona(Math.floor(a.x), Math.floor(a.y))) return { mapa: G.mapa.id, x: a.x, y: a.y, ent: a };
  let melhor = null, dm = 1e9;
  for (const m of G.mons) {
    if (m.tipo !== 'pombo' || m.hp <= 0 || !tvForaDaZona(Math.floor(m.x), Math.floor(m.y))) continue;
    const d = dist(m, G.p); if (d < dm) { dm = d; melhor = m; }
  }
  return melhor ? { mapa: G.mapa.id, x: melhor.x, y: melhor.y, ent: melhor } : null;
}

// a seta das missões de "passe por N ..." também prefere quem está fora da zona segura (no mesmo mapa)
if (typeof alvoMonstro === 'function') {
  const _alvoMonstroTv = alvoMonstro;
  alvoMonstro = function (tipo) {
    const r = _alvoMonstroTv.apply(this, arguments);
    try {
      if (!r || !r.ent || r.mapa !== G.mapa.id || tvForaDaZona(Math.floor(r.ent.x), Math.floor(r.ent.y))) return r;
      const a = G.alvo; if (a && a.tipo === tipo && a.hp > 0 && G.mons.includes(a) && tvForaDaZona(Math.floor(a.x), Math.floor(a.y))) return { mapa: G.mapa.id, x: a.x, y: a.y, ent: a };
      let melhor = null, dm = 1e9;
      for (const m of G.mons) { if (m.tipo !== tipo || m.hp <= 0 || !tvForaDaZona(Math.floor(m.x), Math.floor(m.y))) continue; const d = dist(m, G.p); if (d < dm) { dm = d; melhor = m; } }
      return melhor ? { mapa: G.mapa.id, x: melhor.x, y: melhor.y, ent: melhor } : r;
    } catch (e) { return r; }
  };
}

// ---------- (d) o aviso da zona segura não fica repetindo ----------
if (typeof avisaZonaSegura === 'function') {
  const _avisaZsTv = avisaZonaSegura;
  avisaZonaSegura = function () {
    const k = G.alvo ? (G.alvo.uid || G.alvo) : null;
    if (k === TV.zsAlvo && G.agora - TV.zsT < 30000) return;   // o mesmo adversário: avisa uma vez só
    if (G.agora - TV.zsT < 8000) return;                         // outro adversário: no máximo 1 aviso a cada 8 s
    TV.zsAlvo = k; TV.zsT = G.agora;
    if (tvNoTutorial()) {
      if (typeof ZS !== 'undefined') ZS.avisou = G.agora;
      const t = '🛡️ No one gets challenged near people. Follow the YELLOW ARROW to a pigeon farther away!';
      log(t, 'l-sis'); if (typeof avisoTela === 'function') avisoTela(t, 'l-info');
      return;
    }
    return _avisaZsTv.apply(this, arguments);
  };
}

// ---------- (f) o baú certo: ⚽ + círculo piscando; o Armazém avisa que a bola está no outro ----------
function tvBauBola() {
  const s = G.save; if (!s || !G.mapa || s.flags.pegou_bola) return null;
  const q = s.quests && s.quests.q_bola; if (!q && !tvNoTutorial()) return null;
  return (G.mapa.pontos || []).find(p => p.tipo === 'bau_bola') || null;
}
if (typeof desenhaGuia === 'function') {
  const _guiaTv = desenhaGuia;
  desenhaGuia = function (ctx, tela) {
    const r = _guiaTv.apply(this, arguments);
    try {
      const b = tvBauBola(); if (!b) return r;
      const s = G.dpr || 1, ch = tela(b.x + 0.5, b.y + 0.75), k = 1 + 0.18 * Math.sin(G.agora / 230);
      if (ch.x < -60 || ch.y < -60 || ch.x > CV.width + 60 || ch.y > CV.height + 60) return r;
      ctx.save();
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3.5 * s; ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 4 * s;
      ctx.beginPath(); ctx.ellipse(ch.x, ch.y, 26 * s * k, 10 * s * k, 0, 0, 7); ctx.stroke();
      // a bolinha em cima do baú (a seta amarela já fica por cima dele)
      const t = tela(b.x + 0.5, b.y - 0.15), pul = Math.abs(Math.sin(G.agora / 300)) * 5 * s;
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.strokeStyle = '#3d2b3a'; ctx.lineWidth = 2.5 * s;
      ctx.beginPath(); ctx.arc(t.x + 24 * s, t.y - pul, 13 * s, 0, 7); ctx.fill(); ctx.stroke();
      ctx.font = `${Math.round(17 * s)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000'; ctx.fillText('⚽', t.x + 24 * s, t.y - pul + 1 * s);
      ctx.restore();
    } catch (e) { }
    return r;
  };
}
if (typeof usarPonto === 'function') {
  const _usarPontoTv = usarPonto;
  usarPonto = function (pt) {
    if (pt && pt.tipo === 'armazem' && G.mapa && G.mapa.id === 'vila' && tvBauBola()) {
      const t = '📦 That\'s the STORAGE (it keeps your stuff). Your ball is in the OTHER chest, the one with the ⚽, on the other side of the house: follow the yellow arrow!';
      log(t, 'l-info'); if (typeof avisoTela === 'function') avisoTela(t, 'l-info'); if (typeof fala === 'function') fala(G.p, 'Not that chest...');
      return;
    }
    return _usarPontoTv.apply(this, arguments);
  };
}

// ---------- (a) passo da Mochila: abrir a mochila (tecla I / 🎒) também vale como "Entendi" ----------
const tvPassoMochila = () => typeof TUTORIAL !== 'undefined' && TUTORIAL.findIndex(st => st.ok && /MOCHILA/i.test(st.txt));
function tvAbriuMochila() {
  try {
    const s = G.save; if (!s) return;
    if (s.tut === tvPassoMochila()) avancaTutorial();
    if (G.dicasFila && G.dicasFila[0] && G.dicasFila[0].id === 'equip') { G.dicasFila.shift(); G.uiSujo = true; }
  } catch (e) { }
}
if (typeof abreAba === 'function') {
  const _abreAbaTv = abreAba;
  abreAba = function (n) { if (n === 'mochila') tvAbriuMochila(); return _abreAbaTv.apply(this, arguments); };
}
// no PC o quadro "Mochilas" pode estar fora da tela (coluna comprida): no passo da Mochila ele rola até aparecer, uma vez
if (typeof atualizaRastreador === 'function') {
  const _rastTv = atualizaRastreador;
  atualizaRastreador = function () {
    const r = _rastTv.apply(this, arguments);
    try {
      const s = G.save; if (!s || tvCel() || s.tut !== tvPassoMochila()) return r;
      if (TV.rolou === s.tut) return r; TV.rolou = s.tut;
      const b = document.querySelector('[data-painel="bolsas"]'); if (b && b.offsetParent !== null) b.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (e) { }
    return r;
  };
}
// no celular a mochila abre pelo botão 🎒 (#chMochila, celular2.js)
document.addEventListener('click', ev => { if (ev.target && ev.target.closest && ev.target.closest('#chMochila')) tvAbriuMochila(); }, true);

// ---------- (e) "Coma 3 alimentos": dizer COMO se come ----------
{
  const q = typeof MISSOES !== 'undefined' && MISSOES.find(m => m.id === 'q_lanche');
  if (q) {
    q.req.desc = tvCel() ? 'Eat 3 foods: tap the food in the 🎒 and then Eat' : 'Eat 3 foods: click the food in the 🎒 Backpack and then Eat';
    q.texto += tvCel() ? ' To eat: tap the 🎒 button, tap the food and then "Eat".' : ' To eat: in the 🎒 Backpacks panel (or the I key), click the food and then "Eat" (or right-click it).';
  }
}
