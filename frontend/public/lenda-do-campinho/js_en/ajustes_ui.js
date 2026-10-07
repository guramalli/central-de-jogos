/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🪟 JANELAS AJUSTÁVEIS e MINIMAPA CLICÁVEL (v258)
   - Batalha, Equipamento, Mochila e Habilidades ganham uma alça na borda de baixo: arraste para
     aumentar/diminuir a altura da aba aberta (cada aba guarda a sua, salvo neste aparelho;
     duplo clique na alça volta ao tamanho normal).
   - Clique no minimapa: o personagem anda até lá (como no Tibia). Duplo clique abre o mapa grande
     (a tecla do mapa continua abrindo também).
   No celular (layout fixo) as alças não aparecem.
   Carregar DEPOIS de layout.js e minimapa.js.
   ============================================================ */
const ALT_KEY = 'rac_paineis_alt_v1';
let ALTURAS = {}; try { ALTURAS = JSON.parse(localStorage.getItem(ALT_KEY) || '{}') || {}; } catch (e) { ALTURAS = {}; }
function salvaAlturas() { try { localStorage.setItem(ALT_KEY, JSON.stringify(ALTURAS)); } catch (e) { } }
function aplicaAltura(t) {
  const p = typeof PAINEIS !== 'undefined' && PAINEIS[t]; if (!p) return;
  const h = ALTURAS[t];
  if (h && !(typeof LAY_ESTREITO !== 'undefined' && LAY_ESTREITO.matches)) { p.style.height = h + 'px'; p.style.maxHeight = 'none'; p.style.minHeight = '60px'; }
  else { p.style.height = ''; p.style.maxHeight = ''; p.style.minHeight = ''; }
}
function poeAlcas() {
  if (typeof LAY_ESTREITO !== 'undefined' && LAY_ESTREITO.matches) { document.querySelectorAll('.alca-redim').forEach(a => a.remove()); return; }
  document.querySelectorAll('.bloco-abas').forEach(b => {
    const it = b._item; if (!it || !Array.isArray(it.g)) return;
    it.g.forEach(aplicaAltura);
    if (b.querySelector(':scope > .alca-redim')) return;
    const alca = el('div', { class: 'alca-redim', title: 'Drag to change the height · double-click to reset' });
    alca.addEventListener('pointerdown', ev => {
      ev.preventDefault(); ev.stopPropagation();
      const tv = it.g.find(t => PAINEIS[t] && PAINEIS[t].offsetParent); if (!tv) return; const visivel = PAINEIS[tv]; // cada aba guarda a sua altura
      const y0 = ev.clientY, h0 = visivel.getBoundingClientRect().height;
      try { alca.setPointerCapture(ev.pointerId); } catch (e) { }
      document.body.classList.add('redimensionando');
      const move = e => { ALTURAS[tv] = Math.round(Math.max(70, Math.min(window.innerHeight * 0.85, h0 + e.clientY - y0))); aplicaAltura(tv); };
      const fim = () => { alca.removeEventListener('pointermove', move); alca.removeEventListener('pointerup', fim); alca.removeEventListener('pointercancel', fim); document.body.classList.remove('redimensionando'); salvaAlturas(); };
      alca.addEventListener('pointermove', move); alca.addEventListener('pointerup', fim); alca.addEventListener('pointercancel', fim);
    });
    alca.addEventListener('dblclick', ev => { ev.stopPropagation(); const tv = it.g.find(t => PAINEIS[t] && PAINEIS[t].offsetParent); if (tv) { delete ALTURAS[tv]; aplicaAltura(tv); salvaAlturas(); } });
    b.append(alca);
  });
}
if (typeof renderLayout === 'function') { const _renderAlt = renderLayout; renderLayout = function () { const r = _renderAlt.apply(this, arguments); try { poeAlcas(); } catch (e) { } return r; }; }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(poeAlcas, 0)); else setTimeout(poeAlcas, 0);

// ---------- minimapa: clicar anda até lá; duplo clique abre o mapa grande ----------
function tileDoMini(ev) {
  const c = ev.target, V = typeof MINI_VIEW !== 'undefined' && MINI_VIEW; if (!c || !V) return null;
  const r = c.getBoundingClientRect(); if (!r.width) return null;
  const px = (ev.clientX - r.left) * c.width / r.width, py = (ev.clientY - r.top) * c.height / r.height;
  return { x: Math.floor(V.x0 + (px - V.ox) / V.k), y: Math.floor(V.y0 + (py - V.oy) / V.k) };
}
function andaPeloMini(tx, ty) {
  const m = G.mapa; if (!m || !G.p) return false;
  // v360 (dono: "clicando no NPC pelo minimapa o boneco fica circulando o NPC"): o destino era o quadrado do próprio NPC,
  // que o boneco nunca ocupa. Agora faz como o clique no mundo: vai até o lado dele e abre a conversa.
  const npc = G.npcs.filter(e => e.hp === undefined && !e.coop && Math.hypot(e.x - (tx + 0.5), e.y - (ty + 0.5)) <= 1.25).sort((a, b) => Math.hypot(a.x - tx - 0.5, a.y - ty - 0.5) - Math.hypot(b.x - tx - 0.5, b.y - ty - 0.5))[0];
  if (npc) {
    const perto = (i, j) => Math.hypot(i + 0.5 - npc.x, j + 0.5 - npc.y) <= 1.6 && !(Math.floor(npc.x) === i && Math.floor(npc.y) === j);
    if (Math.hypot(G.p.x - npc.x, G.p.y - npc.y) <= 1.35) { abrirNPC(npc); return true; }
    const c = caminho(Math.floor(G.p.x), Math.floor(G.p.y), perto, 40000);
    if (!c) { log('I can\'t get there using the minimap.', 'l-sis'); return false; }
    G.caminho = c.length ? c : null; G.alvo = null; G.uiSujo = true;
    G.acaoChegar = () => { if (Math.hypot(G.p.x - npc.x, G.p.y - npc.y) <= 2) abrirNPC(npc); };
    if (!c.length) { const a = G.acaoChegar; G.acaoChegar = null; a(); }
    if (typeof efeito === 'function') efeito('toque', npc.x, npc.y, '#ffe14a');
    return true;
  }
  let alvo = null; // o lugar clicado pode ser parede/água: vai para o chão livre mais perto
  for (let r = 0; r <= 4 && !alvo; r++) for (let dy = -r; dy <= r && !alvo; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = tx + dx, y = ty + dy; if (x >= 0 && y >= 0 && x < m.w && y < m.h && podeAndar(x, y)) { alvo = { x, y }; break; } }
  if (!alvo) return false;
  const c = caminho(Math.floor(G.p.x), Math.floor(G.p.y), (i, j) => i === alvo.x && j === alvo.y, 40000);
  if (!c) { log('I can\'t get there using the minimap.', 'l-sis'); return false; }
  if (!c.length) c.push({ x: alvo.x + 0.5, y: alvo.y + 0.5 });
  G.caminho = c; G.acaoChegar = null; G.alvo = null; G.uiSujo = true;
  if (typeof efeito === 'function') efeito('toque', alvo.x + 0.5, alvo.y + 0.5, '#ffe14a');
  return true;
}
let MINI_ULT_CLIQUE = 0;
document.addEventListener('click', ev => {
  if (!ev.target || ev.target.id !== 'mini') return;
  ev.stopImmediatePropagation(); // o clique simples não abre mais o mapa grande (minimapa.js)
  if (!G.rodando || G.pausado || !G.save || G.save.hp <= 0) return;
  const t = tileDoMini(ev); if (t) andaPeloMini(t.x, t.y);
}, true);
document.addEventListener('dblclick', ev => {
  if (!ev.target || ev.target.id !== 'mini') return;
  ev.stopImmediatePropagation(); if (G.rodando && typeof modalMapa === 'function') { G.caminho = null; modalMapa(); }
}, true);
{
  const st = document.createElement('style');
  st.textContent = `.alca-redim { height: 9px; margin-top: -6px; cursor: ns-resize; border-radius: 0 0 6px 6px; position: relative; flex: none; }
  .alca-redim::after { content: ''; position: absolute; left: 50%; top: 3px; width: 42px; height: 3px; margin-left: -21px; border-radius: 2px; background: var(--madeira3, #b8733a); opacity: .55; }
  .alca-redim:hover::after, body.redimensionando .alca-redim::after { opacity: 1; background: var(--amarelo, #ffd23f); }
  body.redimensionando, body.redimensionando * { cursor: ns-resize !important; user-select: none !important; }
  .bloco.minimizado > .alca-redim { display: none; }
  #mini { cursor: pointer; }`;
  document.head.append(st);
}

/* ---------- v260: "fôlego (HP)" e "foco (mana)" em todos os itens e menus ----------
   Pedido do dono: sempre deixar claro que fôlego = HP e foco = mana. Um ajuste automático acrescenta o
   "(HP)"/"(mana)" nos textos das janelas, dos painéis laterais e das dicas de itens — os NOMES
   (negrito/títulos: "Garrafa de Fôlego", "Fôlego de Campeão") ficam como estão. O chat (log) não muda. */
const HPMANA_RE = /(?<!(?:Segundo|Second)[\s\u00a0])\b(f[oô]lego|foco|stamina|focus)(?![\s\u00a0]*\()(?![\s\u00a0]+de[\s\u00a0]+Campe)(?!\w)/gi;
const HPMANA_ONDE = '#modalConteudo, .tip-item, #lateral, #lateralEsq, #lateral2, #lateralEsq2, .cj-caixa, #celMenu';
const HPMANA_FORA = 'b, strong, h1, h2, h3, h4, .nm > b, .bloco-titulo, .abas, button.btn, input, textarea, select, .kbd, #tHp, #tFoco';
function hpManaTexto(t) { return t.replace(HPMANA_RE, (m, w) => /^(?:f[oô]lego|stamina)$/i.test(w) ? `${w} (HP)` : `${w} (mana)`); }
function hpManaNo(n) {
  if (n.nodeType !== 3 || !n.nodeValue || !/f[oô]lego|foco|stamina|focus/i.test(n.nodeValue)) return;
  const pai = n.parentElement; if (!pai || !pai.closest(HPMANA_ONDE) || pai.closest(HPMANA_FORA)) return;
  const novo = hpManaTexto(n.nodeValue); if (novo !== n.nodeValue) n.nodeValue = novo;
}
function hpManaVarre(raiz) {
  if (!raiz) return; if (raiz.nodeType === 3) return hpManaNo(raiz);
  if (raiz.nodeType !== 1) return;
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) hpManaNo(n);
}
{
  const obs = new MutationObserver(lista => { for (const m of lista) { if (m.type === 'characterData') hpManaNo(m.target); else m.addedNodes.forEach(hpManaVarre); } });
  const liga = () => { obs.observe(document.body, { childList: true, subtree: true, characterData: true }); hpManaVarre(document.body); };
  if (document.body) liga(); else document.addEventListener('DOMContentLoaded', liga);
}
