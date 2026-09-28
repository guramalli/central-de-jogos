/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ◐ ARCOS DE FÔLEGO E FOCO (v215), como os arcos de vida e mana do Tibia:
   em volta do seu boneco, à esquerda o FÔLEGO (verde → amarelo → vermelho conforme cai)
   e à direita o FOCO (azul). Enchem de baixo para cima. Dá para desligar no Menu.
   Também desenha, em letras pequenas logo abaixo do boneco, o aviso "Usando 1 das N garrafas..."
   (G.msgUso, preenchido em pocoes.js).
   Carregar DEPOIS dos outros arquivos que embrulham desenha().
   ============================================================ */
const ARCOS_KEY = 'rac_arcos';
let ARCOS_ON = true; try { ARCOS_ON = localStorage.getItem(ARCOS_KEY) !== '0'; } catch (e) { }
const MSG_USO_MS = 2500;
{
  let stCache = null, stT = 0; // stats() é pesado para chamar em todo quadro
  const maximos = () => { const t = performance.now(); if (!stCache || t - stT > 400) { stCache = stats(); stT = t; } return stCache; };
  const corFolego = pc => pc > 0.6 ? '#4fdc5a' : pc > 0.3 ? '#e8d23a' : '#ff4a3a';
  function arco(ctx, cx, cy, r, a0, a1, pc, cor, larg) {
    // a0 = ponta de baixo, a1 = ponta de cima; enche de a0 para a1
    const anti = a1 < a0;
    ctx.lineWidth = larg; ctx.lineCap = 'butt';
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
      const st = maximos(), cy = pe - alt * T * z * 0.46, raio = Math.max(alt * 0.62, 0.95) * T * z, larg = Math.max(4.5 * px, T * z * 0.11);
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
  const rotuloBt = () => ARCOS_ON ? '◐ Arcos de fôlego e foco: ligados' : '◐ Arcos de fôlego e foco: desligados';
  const poe = () => {
    const lista = document.querySelector('#topo .tb-lista');
    if (lista && !document.getElementById('btnArcos')) lista.append(el('button', { class: 'btn', id: 'btnArcos', type: 'button', role: 'menuitem', title: 'Os arcos em volta do boneco mostram o fôlego (esquerda) e o foco (direita), como no Tibia',
      onclick: ev => { ARCOS_ON = !ARCOS_ON; try { localStorage.setItem(ARCOS_KEY, ARCOS_ON ? '1' : '0'); } catch (e) { } ev.currentTarget.textContent = rotuloBt(); } }, rotuloBt()));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(poe, 0)); else setTimeout(poe, 0);
  const _iniArcos = iniciarJogo; iniciarJogo = async function () { const r = await _iniArcos.apply(this, arguments); poe(); return r; };
}
