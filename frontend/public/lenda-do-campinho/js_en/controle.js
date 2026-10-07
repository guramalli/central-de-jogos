/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎮 CONTROLE (gamepad) — v353 (pacote de melhorias: "controle" para a Steam e para o PC)
   Layout padrão (Xbox / PlayStation / genéricos com "standard mapping"):
     Analógico esquerdo = andar          A / ✕ = falar, pegar, entrar (E)      B / ◯ = fechar / cancelar (Esc)
     X / ▢ = drible ↔ chute (X)          Y / △ = marcar o adversário mais perto (Espaço)
     Direcional = habilidades 1–4        LB / RB = habilidades 5–6
     LT = melhor poção de FÔLEGO (F)     RT = melhor poção de FOCO (R)
     Start = Mapa (M)                    Select / Back = Missões (J)
   Com uma janela aberta: direcional ↑↓←→ passa pelos botões, A aperta, B fecha.
   ============================================================ */
const CTRL = { ant: [], foco: -1, pad: false, ultimoAviso: 0 };
const CTRL_ZONA = 0.28;
function ctrlBotoesModal() {
  const m = $('#modal'); if (!m || m.hidden) return [];
  return [...m.querySelectorAll(/*pt-en*/'button, a[href], [tabindex="0"]')].filter(b => !b.disabled && b.offsetParent !== null);
}
function ctrlAperta(i, pad) { const b = pad.buttons[i]; return !!(b && (b.pressed || b.value > 0.5)); }
function ctrlPasso() {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  const pad = pads.find(p => p.mapping === 'standard') || pads[0];
  if (!pad || typeof G === 'undefined' || !G.rodando) { if (CTRL.pad && G) { G.joy = null; CTRL.pad = false; } return; }
  const ant = CTRL.ant, agora = pad.buttons.map((b, i) => ctrlAperta(i, pad)), novo = i => agora[i] && !ant[i]; // "acabou de apertar"
  CTRL.ant = agora;
  const modal = $('#modal') && !$('#modal').hidden;
  // ---- janela aberta: navega pelos botões ----
  if (modal) {
    if (CTRL.pad) { G.joy = null; CTRL.pad = false; }
    const bs = ctrlBotoesModal(); if (!bs.length) return;
    const passo = novo(13) || novo(15) ? 1 : novo(12) || novo(14) ? -1 : 0;
    if (passo) { CTRL.foco = (bs.indexOf(document.activeElement) + passo + bs.length) % bs.length; bs[CTRL.foco].focus(); bs[CTRL.foco].scrollIntoView({ block: 'nearest' }); }
    if (novo(0)) { const b = bs.includes(document.activeElement) ? document.activeElement : bs.find(x => !x.classList.contains('fechar')) || bs[0]; b.click(); }
    if (novo(1)) { const x = $('#modal .fechar'); if (x && !x.hidden) fechaModalX(); }
    return;
  }
  if (G.pausado) { if (CTRL.pad) { G.joy = null; CTRL.pad = false; } return; } // pausado sem janela (aba escondida, história)
  // ---- andar (analógico esquerdo) ----
  const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0, d = Math.hypot(ax, ay);
  if (d > CTRL_ZONA) { const k = Math.min(1, (d - CTRL_ZONA) / (1 - CTRL_ZONA)) / d; G.joy = { x: ax * k, y: ay * k }; CTRL.pad = true; G.caminho = null; }
  else if (CTRL.pad) { G.joy = null; CTRL.pad = false; }
  // ---- botões ----
  const faz = (i, fn) => { if (novo(i)) { try { fn(); } catch (e) { } } };
  faz(0, () => interagir());
  faz(1, () => { G.alvo = null; G.caminho = null; G.uiSujo = true; });
  faz(2, () => trocaModo());
  faz(3, () => alvoMaisProximo());
  faz(12, () => usarHotbar(0)); faz(13, () => usarHotbar(2)); faz(14, () => usarHotbar(1)); faz(15, () => usarHotbar(3));
  faz(4, () => usarHotbar(4)); faz(5, () => usarHotbar(5));
  faz(6, () => bebeMelhor('hp')); faz(7, () => bebeMelhor('foco'));
  faz(9, () => modalMapa()); faz(8, () => modalMissoes());
  faz(11, () => alvoMaisProximo());
}
// v407 (Raio-X): o controle só é conferido DEPOIS que ele aparece (evento gamepadconnected) — antes eram 30 conferências
// por segundo para sempre, mesmo em quem nunca ligou um controle. Desligou o último controle: para de conferir.
CTRL.timer = null;
function ctrlLiga() { if (!CTRL.timer) CTRL.timer = setInterval(ctrlPasso, 33); }
try { if (navigator.getGamepads && [...navigator.getGamepads()].some(Boolean)) ctrlLiga(); } catch (e) { } // já estava ligado (ex.: Steam)
addEventListener('gamepaddisconnected', () => {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  if (pads.length || !CTRL.timer) return;
  clearInterval(CTRL.timer); CTRL.timer = null; CTRL.ant = [];
  if (CTRL.pad && typeof G !== 'undefined') { G.joy = null; CTRL.pad = false; }
});
addEventListener('gamepadconnected', () => {
  ctrlLiga();
  if (Date.now() - CTRL.ultimoAviso < 60000) return; CTRL.ultimoAviso = Date.now();
  try { banner('🎮 Controller connected!', 'Stick moves · A talks · X dribble/shoot · Y targets · LT/RT potions'); } catch (e) { }
});
// os botões do controle também aparecem na janela de Atalhos (H)
if (typeof modalAtalhos === 'function') {
  const _atalhosCtrl = modalAtalhos;
  modalAtalhos = function () {
    const r = _atalhosCtrl.apply(this, arguments);
    try {
      const c = $('#modalConteudo'); if (c && !c.querySelector('.ctrl-ajuda')) c.append(el('div', { class: 'ctrl-ajuda' }, el('h3', {}, '🎮 Controller'),
        el('p', {}, 'Left stick: move · A: talk/pick up/enter · B: close/cancel · X: dribble ↔ shoot · Y: target opponent'),
        el('p', {}, 'D-pad: skills 1–4 · LB/RB: skills 5–6 · LT: stamina potion · RT: focus potion · Start: Map · Select: Missions'),
        el('p', {}, 'With a window open: D-pad moves between buttons, A presses, B closes.')));
    } catch (e) { }
    return r;
  };
}
