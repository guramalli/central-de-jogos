/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ◐ ARCOS DE FÔLEGO E FOCO (v215), como os arcos de vida e mana do Tibia:
   em volta do seu boneco, à esquerda o FÔLEGO (verde → amarelo → vermelho conforme cai)
   e à direita o FOCO (azul). Enchem de baixo para cima. No Menu dá para escolher: arcos e barrinhas,
   só os arcos (tira as barrinhas de cima da cabeça) ou só as barrinhas.
   Também desenha, em letras pequenas logo abaixo do boneco, o aviso "Usando 1 das N garrafas..."
   (G.msgUso, preenchido em pocoes.js).
   Carregar DEPOIS dos outros arquivos que embrulham desenha().
   ============================================================ */
const ARCOS_KEY = 'rac_arcos';
// v217: o que aparece no boneco — 'ambos' (arcos + barrinhas em cima), 'arcos' (só os arcos) ou 'barras' (só as barrinhas)
let HUD_BONECO = 'ambos';
try { const v = localStorage.getItem(ARCOS_KEY); HUD_BONECO = v === '0' ? 'barras' : (v === 'arcos' || v === 'barras') ? v : 'ambos'; } catch (e) { }
let ARCOS_ON = HUD_BONECO !== 'barras';
// v224: distância dos arcos até o boneco (Menu): perto (como era), média ou longe
const ARCOS_DIST_KEY = 'rac_arcos_dist', ARCOS_DISTS = { perto: 1, media: 1.2, longe: 1.4 };
let ARCOS_DIST = 'perto'; try { const v = localStorage.getItem(ARCOS_DIST_KEY); if (ARCOS_DISTS[v]) ARCOS_DIST = v; } catch (e) { }
// v226: a escolha também fica no SAVE da conta (vale em qualquer aparelho, no site e no app)
function guardaHud() {
  try { localStorage.setItem(ARCOS_KEY, HUD_BONECO === 'ambos' ? '1' : HUD_BONECO); localStorage.setItem(ARCOS_DIST_KEY, ARCOS_DIST); } catch (e) { }
  if (G.save) { G.save.hud = { boneco: HUD_BONECO, dist: ARCOS_DIST }; if (typeof salvar === 'function') salvar(); }
}
const MSG_USO_MS = 2500;
{
  let stCache = null, stT = 0; // stats() é pesado para chamar em todo quadro
  const maximos = () => { const t = performance.now(); if (!stCache || t - stT > 400) { stCache = stats(); stT = t; } return stCache; };
  const corFolego = pc => pc > 0.6 ? '#4fdc5a' : pc > 0.3 ? '#e8d23a' : '#ff4a3a';
  function arco(ctx, cx, cy, r, a0, a1, pc, cor, larg) {
    // a0 = ponta de baixo, a1 = ponta de cima; enche de a0 para a1
    const anti = a1 < a0;
    ctx.lineCap = 'butt';
    // v218: contorno escuro fininho em volta do arco inteiro (aparece em qualquer chão)
    const bd = Math.max(1.2, larg * 0.22);
    ctx.lineWidth = larg + bd * 2; ctx.strokeStyle = 'rgba(12,8,20,0.85)'; ctx.beginPath(); ctx.arc(cx, cy, r, a0 + (anti ? 0.012 : -0.012), a1 + (anti ? -0.012 : 0.012), anti); ctx.stroke();
    ctx.lineWidth = larg;
    ctx.strokeStyle = 'rgba(20,12,30,0.45)'; ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1, anti); ctx.stroke();
    if (pc <= 0) return;
    ctx.strokeStyle = cor; ctx.beginPath(); ctx.arc(cx, cy, r, a0, a0 + (a1 - a0) * Math.min(1, pc), anti); ctx.stroke();
  }
  const _desenhaArcos = desenha;
  desenha = function (dt) {
    const r = _desenhaArcos.apply(this, arguments);
    const s = G.save, p = G.p; if (!s || !p || !G.rodando) return r;
    const ctx = CTX, z = G.zoom, px = G.dpr || 1;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const alt = alturaEnt(p), sx = (p.x * T - G.cam.x) * z, pe = (p.y * T - G.cam.y) * z;
    if (ARCOS_ON && s.hp > 0) {
      // v408.4 (dono: "os arcos de vida diminuíram demais"): voltam ao tamanho, espessura e opacidade de antes da v407
      const st = maximos(), cy = pe - alt * T * z * 0.46, raio = Math.max(alt * 0.62, 0.95) * T * z * ARCOS_DISTS[ARCOS_DIST], larg = Math.max(4.5 * px, T * z * 0.11);
      const ab = 0.62 * Math.PI / 2; // meia-abertura de cada arco (em volta de 180° e de 0°)
      ctx.globalAlpha = 0.78;
      const pcH = s.hp / Math.max(1, st.maxHp), pcF = s.foco / Math.max(1, st.maxFoco);
      arco(ctx, sx, cy, raio, Math.PI - ab, Math.PI + ab, pcH, corFolego(pcH), larg); // esquerda: de baixo (180°−, a tela tem y para baixo) para cima (180°+)
      arco(ctx, sx, cy, raio, ab, -ab, pcF, '#3a8cff', larg);                           // direita: de baixo (+) para cima (−)
      ctx.globalAlpha = 1;
    }
    const m = G.msgUso;
    if (m) {
      const t = performance.now() - m.t0;
      if (t > MSG_USO_MS) G.msgUso = null;
      else {
        ctx.globalAlpha = t > MSG_USO_MS - 500 ? (MSG_USO_MS - t) / 500 : 1;
        const tam = 10.5 * px; ctx.font = `700 ${tam}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        const y = pe + T * z * 0.12;
        ctx.lineJoin = 'round'; ctx.lineWidth = tam * 0.3; ctx.strokeStyle = 'rgba(10,20,10,0.9)'; ctx.strokeText(m.txt, sx, y);
        ctx.fillStyle = '#a8ff8a'; ctx.fillText(m.txt, sx, y);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
    return r;
  };
  // botão no Menu para ligar/desligar os arcos
  const NOMES_HUD = { ambos: 'arcs and bars', arcos: 'arcs only', barras: 'bars only' }, PROX_HUD = { ambos: 'arcos', arcos: 'barras', barras: 'ambos' };
  const rotuloBt = () => `◐ Stamina and focus on the character: ${NOMES_HUD[HUD_BONECO]}`;
  const poe = () => {
    const lista = document.querySelector('#topo .tb-lista');
    if (lista && !document.getElementById('btnArcos')) lista.append(el('button', { class: 'btn', id: 'btnArcos', type: 'button', role: 'menuitem', title: 'Click to switch: rings around your character, bars above the head, or both', // v407 (Raio-X U4): sem a comparação com o Tibia no texto do jogador
      onclick: ev => { HUD_BONECO = PROX_HUD[HUD_BONECO]; ARCOS_ON = HUD_BONECO !== 'barras'; guardaHud(); ev.currentTarget.textContent = rotuloBt(); } }, rotuloBt()));
    const NOMES_DIST = { perto: 'perto', media: 'medium', longe: 'longe' }, PROX_DIST = { perto: 'media', media: 'longe', longe: 'perto' };
    const rotuloDist = () => `◐ Arc distance: ${NOMES_DIST[ARCOS_DIST]}`;
    if (lista && !document.getElementById('btnArcosDist')) lista.append(el('button', { class: 'btn', id: 'btnArcosDist', type: 'button', role: 'menuitem', title: 'Click to move the stamina and focus arcs farther from or closer to the character',
      onclick: ev => { ARCOS_DIST = PROX_DIST[ARCOS_DIST]; guardaHud(); ev.currentTarget.textContent = rotuloDist(); } }, rotuloDist()));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(poe, 0)); else setTimeout(poe, 0);
  const _iniArcos = iniciarJogo; iniciarJogo = async function (save) {
    // o save manda (escolha feita em outro aparelho); save antigo sem a escolha leva a deste aparelho
    try {
      const h = save && save.hud;
      if (h && typeof h === 'object') { if (NOMES_HUD[h.boneco]) HUD_BONECO = h.boneco; if (ARCOS_DISTS[h.dist]) ARCOS_DIST = h.dist; ARCOS_ON = HUD_BONECO !== 'barras'; }
      else if (save) save.hud = { boneco: HUD_BONECO, dist: ARCOS_DIST };
    } catch (e) { }
    const r = await _iniArcos.apply(this, arguments); poe();
    const b1 = document.getElementById('btnArcos'), b2 = document.getElementById('btnArcosDist');
    if (b1) b1.textContent = rotuloBt(); if (b2) b2.textContent = `◐ Arc distance: ${({ perto: 'perto', media: 'medium', longe: 'longe' })[ARCOS_DIST]}`;
    return r;
  };
}
