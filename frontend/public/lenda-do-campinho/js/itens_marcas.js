/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏷️ MARCAS NOS ITENS (v348, pedido do dono)
   1) POÇÕES: a garrafa de fôlego e o isotônico de foco tinham o mesmo formato — pequenininhos na barra, ficavam
      parecidos. Agora o ÍCONE já sai com um disco colorido atrás e um selo no canto: ❤ branco no vermelho = fôlego (HP),
      ⚡ branco no azul = foco (mana). Vale em todo lugar que usa iconeItem (barra, mochila, loja, dica, armazém).
      A Recompensa Diária troca os emojis 🧃/🥤 (também parecidos) por ❤️/⚡.
   2) CADEADO: "🔒 Travar" na janela do item. Item travado não aparece para venda (nem no "Vender todo o loot"),
      não pode ser jogado fora e mostra 🔒 na mochila. Fica no save (s.travados[id]) e vale para todas as unidades.
   Carregar DEPOIS de luxo.js/pocoes.js/padrao_itens.js.
   ============================================================ */
// ---------- 1) poções ----------
const PM_TIPO = {};
for (const [id, it] of Object.entries(ITENS)) {
  const e = it.tipo === 'consumivel' && it.efeito; if (!e) continue;
  if (e.hp && !e.foco) PM_TIPO[id] = 'hp'; else if (e.foco && !e.hp) PM_TIPO[id] = 'foco';
}
function pmDesenha(base, tipo) {
  const c = mkCanvas(96, 96), x = c.getContext('2d'), hp = tipo === 'hp';
  const g = x.createRadialGradient(48, 52, 6, 48, 52, 47);
  g.addColorStop(0, hp ? 'rgba(255,110,110,0.75)' : 'rgba(110,180,255,0.75)'); g.addColorStop(1, hp ? 'rgba(210,30,40,0)' : 'rgba(30,90,220,0)');
  x.fillStyle = g; x.beginPath(); x.arc(48, 52, 47, 0, Math.PI * 2); x.fill();
  x.drawImage(base, 0, 0, 96, 96);
  const cx = 75, cy = 21, r = 18;
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fillStyle = hp ? '#e3262e' : '#1c74e0'; x.fill();
  x.lineWidth = 4; x.strokeStyle = '#fff'; x.stroke();
  x.fillStyle = '#fff'; x.beginPath();
  if (hp) { x.moveTo(cx, cy + 10); x.bezierCurveTo(cx - 15, cy - 1, cx - 7, cy - 13, cx, cy - 5); x.bezierCurveTo(cx + 7, cy - 13, cx + 15, cy - 1, cx, cy + 10); }
  else { const p = [[3, -13], [-8, 2], [-1, 2], [-4, 13], [8, -3], [1, -3], [4, -13]]; p.forEach(([a, b], i) => i ? x.lineTo(cx + a, cy + b) : x.moveTo(cx + a, cy + b)); x.closePath(); }
  x.fill();
  return c;
}
{
  const cache = new Map(); const _iconePM = iconeItem;
  iconeItem = function (id) {
    const base = _iconePM.apply(this, arguments); const t = PM_TIPO[id]; if (!t || !base) return base;
    const h = cache.get(id); if (h && h.base === base) return h.c;   // a arte ainda carregando devolve outro desenho: refaz quando chegar
    const c = pmDesenha(base, t); cache.set(id, { base, c }); return c;
  };
}
if (typeof DIARIA !== 'undefined') { if (DIARIA[1]) DIARIA[1].ic = '❤️'; if (DIARIA[2]) DIARIA[2].ic = '⚡'; }

// ---------- 2) cadeado ----------
function itemTravado(id) { const s = G.save; return !!(s && s.travados && s.travados[id]); }
function alternaTrava(id) {
  const s = G.save; if (!s) return false; s.travados = s.travados || {};
  if (s.travados[id]) delete s.travados[id]; else s.travados[id] = true;
  try { salvar(); } catch (e) { } G.uiSujo = true; return !!s.travados[id];
}
{
  // janela do item: botão de travar; travado não joga fora
  const _modalItemTv = modalItem;
  modalItem = function (id, r = 0) {
    const out = _modalItemTv.apply(this, arguments); const it = ITENS[id]; if (!it || it.tipo === 'chave') return out;
    const box = document.getElementById('modalConteudo'), ops = box && box.querySelector('.opcoes'); if (!ops) return out;
    const tv = itemTravado(id);
    for (const b of ops.querySelectorAll('button')) if (b.textContent.trim() === 'Jogar fora' && tv) { b.disabled = true; b.title = 'Item travado: destrave para jogar fora'; }
    ops.append(el('button', { class: 'btn' + (tv ? ' amarelo' : ''), type: 'button', title: tv ? 'Destravar: volta a poder ser vendido e jogado fora' : 'Travar: não aparece para venda e não pode ser jogado fora', onclick: () => { const agora = alternaTrava(id); log(agora ? `🔒 ${it.nome} travado: não será vendido nem jogado fora.` : `🔓 ${it.nome} destravado.`, 'l-sis'); modalItem(id, r); } }, tv ? '🔓 Destravar' : '🔒 Travar'));
    if (tv) { const p = el('p', { class: 'trava-aviso' }, '🔒 Travado: não aparece para venda e não pode ser jogado fora.'); ops.before(p); }
    return out;
  };
  // loja (aba Vender): travados não entram na lista; aviso com quantos ficaram de fora
  const _lojaTv = modalLoja;
  modalLoja = function (npc, aba = 'comprar') {
    if (aba !== 'vender' || !G.save) return _lojaTv.apply(this, arguments);
    const s = G.save, tv = Object.keys(s.travados || {}).filter(id => ITENS[id] && ITENS[id].venda && s.mochila.some(m => m.id === id));
    const guard = tv.map(id => [id, ITENS[id].venda]); guard.forEach(([id]) => { ITENS[id].venda = 0; });
    try { _lojaTv.apply(this, arguments); } finally { guard.forEach(([id, v]) => { ITENS[id].venda = v; }); }
    const box = document.getElementById('modalConteudo'), tabs = box && box.querySelector('.tabs-modal');
    const dica = tv.length ? `🔒 ${tv.length} item(ns) travado(s) não aparece(m) aqui: ${tv.map(id => ITENS[id].nome).join(', ')}. Para destravar, clique no item na mochila.`
      : '🔒 Dica: para nunca vender um item sem querer, clique nele na mochila e toque em "Travar".';
    if (tabs) { const lista = box.querySelector('.lista'); (lista || tabs).before(el('p', { class: 'trava-aviso' }, dica)); }
  };
  // "Vender todo o loot" também respeita o cadeado
  if (typeof lootVendavel === 'function') { const _lootTv = lootVendavel; lootVendavel = function () { return _lootTv.apply(this, arguments).filter(m => !itemTravado(m.id)); }; }
  // 🔒 na mochila
  const _paineisTv = atualizaPaineis;
  atualizaPaineis = function () {
    const out = _paineisTv.apply(this, arguments); const s = G.save; if (!s || !s.travados) return out;
    document.querySelectorAll('#mochila .mochila-grade .slot').forEach((b, i) => { const m = s.mochila[i]; if (m && s.travados[m.id]) { b.classList.add('travado'); b.append(el('span', { class: 'trava' + (m.r ? ' com-ref' : '') }, '🔒')); b.title += ' (travado)'; } });
    return out;
  };
  const css = document.createElement('style');
  css.textContent = '.slot.travado { box-shadow: inset 0 0 0 2px #ffcf3a; } .slot .trava { position: absolute; right: 2px; top: 2px; font-size: 13px; line-height: 16px; padding: 0 2px; border-radius: 6px; background: rgba(40,26,10,.82); pointer-events: none; } .slot .trava.com-ref { right: 30px; } .trava-aviso { font-size: 13px; color: #6a5040; margin: 6px 0; }';
  document.head.append(css);
}
