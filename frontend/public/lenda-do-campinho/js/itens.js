/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — ITENS MAIS CLAROS, FORJA E BARRA DE ATALHOS
   - cada item mostra no próprio quadro o atributo principal e uma
     seta comparando com o que você está usando (▲ melhor, ▼ pior)
   - dica flutuante ao passar o mouse, com todos os atributos
   - "Forja" (refino +1…+10) também nas lojas das cidades
   - dribles e itens voltam para a barra: arrastar ou botão
   Carregar DEPOIS de ui.js.
   ============================================================ */
const NOME_ST = { atk: 'Ataque', def: 'Defesa', drible: 'Drible', chute: 'Chute', defesa: 'Defesa (skill)', visao: 'Visão', hp: 'Fôlego', foco: 'Foco', vel: 'Velocidade', regen: 'Recuperação' };
const ICONE_ST = { atk: '⚔', def: '🛡', drible: '🌀', chute: '🎯', defesa: '🧱', visao: '👁', hp: '❤', foco: '✨', vel: '👟', regen: '♻' };
const fmtN = v => String(Math.round(v * 10) / 10).replace('.', ',');

function valoresItem(id, r = 0) {
  const it = ITENS[id]; const v = {}; if (!it) return v;
  if (it.atk) v.atk = it.atk * (1 + 0.12 * r);
  if (it.def) v.def = it.def * (1 + 0.12 * r);
  for (const k in (it.st || {})) v[k] = it.st[k] * (1 + 0.1 * r);
  return v;
}
function statPrincipal(id, r) {
  const v = valoresItem(id, r);
  if (v.atk) return ['atk', v.atk]; if (v.def) return ['def', v.def];
  let melhor = null; for (const k in v) if (!melhor || v[k] > melhor[1]) melhor = [k, v[k]]; return melhor;
}
function equipadoNoSlot(slot) { const s = G.save; const id = s.equip[slot]; return id ? { id, r: (s.equipR || {})[slot] || 0 } : null; }
// compara com o que está equipado no mesmo lugar do corpo
function comparaItem(id, r = 0) {
  const it = ITENS[id]; if (!it || it.tipo !== 'equip') return null;
  const eq = equipadoNoSlot(it.slot); const a = valoresItem(id, r), b = eq ? valoresItem(eq.id, eq.r) : {};
  const dif = {}; let mais = 0, menos = 0;
  new Set([...Object.keys(a), ...Object.keys(b)]).forEach(k => { const d = (a[k] || 0) - (b[k] || 0); if (Math.abs(d) >= 0.05) { dif[k] = d; d > 0 ? mais++ : menos++; } });
  const mesmo = eq && eq.id === id && eq.r === r;
  const veredito = mesmo ? 'igual' : !eq ? 'melhor' : mais && !menos ? 'melhor' : menos && !mais ? 'pior' : mais || menos ? 'misto' : 'igual';
  return { eq, dif, veredito };
}
const SETA = { melhor: ['▲', 'melhor'], pior: ['▼', 'pior'], misto: ['◆', 'misto'] };

/* ---------- raridade de cada item (pela forma de conseguir) ---------- */
const ORDEM_RAR = ['comum', 'incomum', 'raro', 'epico', 'lendario'];
let RAR_CACHE = null;
function raridadeItem(id) {
  if (!RAR_CACHE) {
    RAR_CACHE = {}; const drop = {};
    for (const k in MONSTROS) for (const [iid, ch] of (MONSTROS[k].loot || [])) {
      const r = raridadeDe(iid, ch, MONSTROS[k].chefe);
      if (!drop[iid] || ORDEM_RAR.indexOf(r) < ORDEM_RAR.indexOf(drop[iid])) drop[iid] = r; // vale o jeito mais fácil de conseguir
    }
    const vendidos = new Set(); for (const k in NPCS) (NPCS[k].loja || []).forEach(i => vendidos.add(i));
    const missao = new Set(); for (const q of MISSOES) ((q.rec && q.rec.itens) || []).forEach(([i]) => missao.add(i));
    for (const iid in ITENS) {
      const it = ITENS[iid]; let r;
      if (it.raro) r = 'lendario';
      else if (vendidos.has(iid) && it.preco) r = (it.lvl || 0) >= 100 ? 'raro' : (it.lvl || 0) >= 40 ? 'incomum' : 'comum';
      else if (drop[iid]) r = drop[iid];
      else if (missao.has(iid)) r = it.tipo === 'equip' ? 'raro' : 'incomum';
      else r = it.tipo === 'equip' ? 'incomum' : 'comum';
      if (iid === 'fio_ouro') r = 'epico';
      RAR_CACHE[iid] = r;
    }
  }
  return RAR_CACHE[id] || 'comum';
}
function marcaRaridade(elm, id) { ORDEM_RAR.forEach(r => elm.classList.remove('rar-' + r)); elm.classList.remove('raro'); elm.classList.add('rar-' + raridadeItem(id)); }

/* ---------- dica flutuante ---------- */
let TIP = null;
function tipItem(id, r, extra) {
  const it = ITENS[id]; const s = G.save; const box = el('div', { class: 'tip-item' });
  const rar = raridadeItem(id);
  box.append(el('b', { class: 'tip-nome txt-' + rar }, nomeItem(id, r)), el('span', { class: 'tag-rar rar-' + rar }, RARIDADE[rar].nome.toUpperCase()));
  const tipoTxt = it.tipo === 'equip' ? ({ cabeca: 'Cabeça', acessorio: 'Pescoço', camisa: 'Camisa', calcao: 'Calção', perna: 'Caneleira', chuteira: 'Chuteira' })[it.slot] || 'Equipamento' : ({ comida: 'Comida (bônus temporário)', consumivel: 'Consumível', loot: 'Material / troféu', chave: 'Item de missão' })[it.tipo] || '';
  box.append(el('small', { class: 'tip-tipo' }, tipoTxt + (it.lvl ? ` · nível ${it.lvl}` : '')));
  if (it.lvl && s.nivel < it.lvl) box.append(el('div', { class: 'tip-neg' }, `Precisa do nível ${it.lvl} (você é ${s.nivel})`));
  const v = valoresItem(id, r);
  if (Object.keys(v).length) {
    const cmp = comparaItem(id, r);
    const tab = el('div', { class: 'tip-stats' });
    for (const k in v) {
      const d = cmp && cmp.dif[k];
      tab.append(el('span', {}, `${ICONE_ST[k] || '•'} ${NOME_ST[k] || k}`), el('b', {}, (k === 'atk' || k === 'def' ? '' : '+') + fmtN(v[k])),
        el('i', { class: d > 0 ? 'tip-pos' : d < 0 ? 'tip-neg' : '' }, d ? (d > 0 ? '▲ +' : '▼ ') + fmtN(d) : ''));
    }
    if (cmp) for (const k in cmp.dif) if (!(k in v)) tab.append(el('span', {}, `${ICONE_ST[k] || '•'} ${NOME_ST[k] || k}`), el('b', {}, '0'), el('i', { class: 'tip-neg' }, '▼ ' + fmtN(cmp.dif[k])));
    box.append(tab);
    if (cmp && cmp.veredito !== 'igual') box.append(el('small', { class: 'tip-cmp' }, cmp.eq ? `Comparado com o que você usa: ${nomeItem(cmp.eq.id, cmp.eq.r)}` : 'Você não usa nada nesse lugar: equipe!'));
    else if (cmp) box.append(el('small', { class: 'tip-cmp' }, 'É o que você está usando.'));
  }
  if (it.tipo === 'equip') box.append(el('small', { class: 'tip-forja' }, r >= REFINO_MAX ? '🔨 Forjado ao máximo (+10)!' : `🔨 Forja: +${r}/${REFINO_MAX}. Leve à Forja (Seu Remendo na Vila ou lojas das cidades) para deixar +${r + 1}.`));
  if (it.desc && it.tipo !== 'equip') box.append(el('p', {}, it.desc));
  if (extra) box.append(el('small', { class: 'tip-dica' }, extra));
  return box;
}
function mostraTip(ev, conteudo) {
  escondeTip(); TIP = conteudo; document.body.append(TIP); moveTip(ev);
}
function moveTip(ev) {
  if (!TIP) return; const w = TIP.offsetWidth, h = TIP.offsetHeight;
  let x = ev.clientX + 16, y = ev.clientY + 14;
  if (x + w > innerWidth - 8) x = ev.clientX - w - 12; if (y + h > innerHeight - 8) y = innerHeight - h - 8;
  TIP.style.left = Math.max(8, x) + 'px'; TIP.style.top = Math.max(8, y) + 'px';
}
function escondeTip() { if (TIP) { TIP.remove(); TIP = null; } }
let MOUSE = { x: -1, y: -1 };
window.addEventListener('mousemove', ev => { MOUSE = { x: ev.clientX, y: ev.clientY }; }, { passive: true });
function comTip(elm, fn) {
  // os ouvintes entram uma vez só e leem elm._tip na hora: um quadro que é
  // redesenhado (ex.: slot da barra que trocou de item/drible) mostra sempre a dica ATUAL
  elm._tip = fn;
  if (!elm._comTip) {
    elm._comTip = true;
    elm.addEventListener('mouseenter', ev => { if (elm._tip) mostraTip(ev, elm._tip()); });
    elm.addEventListener('mousemove', moveTip);
    elm.addEventListener('mouseleave', escondeTip);
  }
  elm.removeAttribute('title');
}
// selo no quadro: atributo principal + seta de comparação
function seloItem(slotEl, id, r) {
  const it = ITENS[id]; if (!it) return;
  const p = statPrincipal(id, r);
  if (p) slotEl.append(el('span', { class: 'selo-st' }, `${ICONE_ST[p[0]] || ''}${fmtN(p[1])}`));
  const cmp = comparaItem(id, r);
  if (cmp && SETA[cmp.veredito]) slotEl.append(el('span', { class: 'seta-cmp ' + SETA[cmp.veredito][1] }, SETA[cmp.veredito][0]));
  marcaRaridade(slotEl, id);
}

/* ---------- barra de atalhos: arrastar e soltar ---------- */
function colocaNaBarra(t, id, i) {
  const hb = G.save.hotbar;
  const ja = hb.findIndex(h => h && h.t === t && h.id === id);
  if (i == null) { if (ja >= 0) return ja; i = hb.findIndex(h => !h); if (i < 0) { log('Barra de atalhos cheia. Arraste por cima de um atalho para trocar, ou clique com o botão direito para liberar.', 'l-sis'); return -1; } }
  if (ja >= 0 && ja !== i) hb[ja] = hb[i]; // troca de lugar
  hb[i] = { t, id }; G.uiSujo = true; som('equip'); salvar(); return i;
}
function arrastavel(elm, dado) {
  elm.draggable = true;
  elm.addEventListener('dragstart', ev => { escondeTip(); ev.dataTransfer.setData('text/plain', dado); ev.dataTransfer.effectAllowed = 'copyMove'; document.body.classList.add('arrastando'); });
  elm.addEventListener('dragend', () => document.body.classList.remove('arrastando'));
}
const _montaPaineisBase = montaPaineis;
montaPaineis = function () {
  _montaPaineisBase();
  document.querySelectorAll('#hotbar .slot').forEach((b, i) => {
    arrastavel(b, 'h:' + i);
    b.addEventListener('dragover', ev => { ev.preventDefault(); b.classList.add('alvo-drop'); });
    b.addEventListener('dragleave', () => b.classList.remove('alvo-drop'));
    b.addEventListener('drop', ev => {
      ev.preventDefault(); b.classList.remove('alvo-drop'); document.body.classList.remove('arrastando');
      const [t, v] = (ev.dataTransfer.getData('text/plain') || '').split(':'); const hb = G.save.hotbar;
      if (t === 'h') { const j = +v; if (j !== i) { [hb[i], hb[j]] = [hb[j], hb[i]]; G.uiSujo = true; salvar(); } return; }
      if (t === 'd' && DRIBLES[v]) colocaNaBarra('d', v, i);
      else if (t === 'i' && ITENS[v]) colocaNaBarra('i', v, i);
    });
    b.addEventListener('contextmenu', () => { if (!G.save.dicas.barra_volta) { G.save.dicas.barra_volta = true; log('Atalho removido. Para colocar de novo: aba HABILIDADES (dribles) ou MOCHILA — arraste para a barra ou use "Pôr na barra".', 'l-sis'); } });
  });
};

/* ---------- painéis: selos, dicas e lista de dribles ---------- */
const _atualizaPaineisBase = atualizaPaineis;
atualizaPaineis = function () {
  const tinhaTip = !!TIP; escondeTip();
  _atualizaPaineisBase();
  if (tinhaTip) setTimeout(() => { let e = document.elementFromPoint(MOUSE.x, MOUSE.y); while (e && !e._tip) e = e.parentElement; if (e) mostraTip({ clientX: MOUSE.x, clientY: MOUSE.y }, e._tip()); }, 0);
  const s = G.save; if (!s) return;
  // mochila
  document.querySelectorAll('#mochila .mochila-grade .slot').forEach((b, i) => {
    const it = s.mochila[i]; if (!it || !ITENS[it.id]) return;
    const r = it.r || 0; const def = ITENS[it.id];
    seloItem(b, it.id, r); marcaRaridade(b, it.id);
    const acao = def.tipo === 'equip' ? 'Botão direito: EQUIPAR' : def.tipo === 'comida' ? 'Botão direito: COMER · arraste para a barra' : def.tipo === 'consumivel' ? 'Botão direito: USAR · arraste para a barra' : '';
    comTip(b, () => tipItem(it.id, r, acao));
    if (def.tipo === 'comida' || def.tipo === 'consumivel') arrastavel(b, 'i:' + it.id);
  });
  // equipamento (cada quadro diz o seu lugar do corpo em data-slot)
  document.querySelectorAll('#equip .eq-slot[data-slot]').forEach(b => {
    const slot = b.dataset.slot; const id = s.equip[slot]; if (!id || !ITENS[id]) return;
    const r = (s.equipR || {})[slot] || 0; const p = statPrincipal(id, r); marcaRaridade(b, id);
    if (p) b.append(el('span', { class: 'selo-st' }, `${ICONE_ST[p[0]] || ''}${fmtN(p[1])}`));
    comTip(b, () => tipItem(id, r, 'Clique para tirar'));
  });
  // barra de atalhos (itens) com dica
  document.querySelectorAll('#hotbar .slot').forEach((b, i) => { const h = s.hotbar[i]; ORDEM_RAR.forEach(r => b.classList.remove('rar-' + r)); if (h && h.t === 'i' && ITENS[h.id]) { marcaRaridade(b, h.id); comTip(b, () => tipItem(h.id, 0, 'Botão direito remove da barra')); } else b._tip = null; });
  // habilidades: dribles aprendidos
  const sk = $('#skills'); if (!sk) return;
  const box = el('div', { class: 'dribles-lista' }, el('h4', {}, 'Dribles'), el('small', { class: 'vazio' }, 'Arraste para a barra de atalhos (1–0) ou use o botão.'));
  if (!s.dribles.length) box.append(el('p', { class: 'vazio' }, 'Nenhum drible ainda. Os professores ensinam dribles novos!'));
  for (const d of s.dribles) {
    const dr = DRIBLES[d]; if (!dr) continue;
    const pos = s.hotbar.findIndex(h => h && h.t === 'd' && h.id === d);
    const card = el('div', { class: 'drible-card' + (s.nivel < dr.lvl ? ' bloq' : '') }, iconeClone(iconeDrible(d)),
      el('div', { class: 'nm' }, el('b', {}, dr.nome), el('small', {}, `${dr.foco} foco · ${(dr.cd / 1000).toFixed(1).replace('.0', '')}s`)),
      pos >= 0 ? el('span', { class: 'kbd', title: 'Tecla na barra' }, teclaSlot(pos))
        : el('button', { class: 'btn mini amarelo', onclick: () => { const i = colocaNaBarra('d', d); if (i >= 0) log(`${dr.nome} voltou para a barra (tecla ${teclaSlot(i)}).`, 'l-sis'); } }, 'Pôr na barra'));
    card.title = dr.desc; arrastavel(card, 'd:' + d);
    box.append(card);
  }
  const fora = s.dribles.filter(d => DRIBLES[d] && !s.hotbar.some(h => h && h.t === 'd' && h.id === d));
  if (fora.length > 1) box.append(el('button', { class: 'btn mini', onclick: () => { fora.forEach(d => colocaNaBarra('d', d)); } }, 'Pôr todos na barra'));
  sk.append(box);
};

/* ---------- janela do item: comparação completa ---------- */
const _modalItemBase = modalItem;
modalItem = function (id, r = 0) {
  _modalItemBase(id, r);
  const topo = document.querySelector('#modalConteudo .npc-topo'); if (!topo) return;
  const t = tipItem(id, r); t.classList.add('no-modal'); topo.after(t);
  const it = ITENS[id];
  if ((it.tipo === 'comida' || it.tipo === 'consumivel')) { const ja = G.save.hotbar.findIndex(h => h && h.t === 'i' && h.id === id); if (ja >= 0) t.append(el('small', { class: 'tip-dica' }, `Está na barra: tecla ${teclaSlot(ja)}`)); }
};

/* ---------- lojas: comparação nos itens à venda ---------- */
const _modalLojaBase = modalLoja;
modalLoja = function (npc, aba = 'comprar') {
  _modalLojaBase(npc, aba);
  if (aba !== 'comprar') return;
  const linhas = document.querySelectorAll('#modalConteudo .lista .linha-item'); const ids = (npc.d.loja || []).filter(id => ITENS[id] && ITENS[id].preco);
  linhas.forEach((ln, k) => {
    const id = ids[k]; if (!id) return; const it = ITENS[id];
    if (it.tipo === 'equip') {
      const small = ln.querySelector('.nm small'); if (small) small.textContent = statsItemTxt(id, 0) + (it.lvl > 1 ? ` · nível ${it.lvl}` : '');
      const cmp = comparaItem(id, 0); const nm = ln.querySelector('.nm b');
      if (cmp && SETA[cmp.veredito] && nm) nm.append(' ', el('span', { class: 'chip-cmp ' + SETA[cmp.veredito][1] }, `${SETA[cmp.veredito][0]} ${cmp.veredito === 'melhor' ? 'melhor que o seu' : cmp.veredito === 'pior' ? 'pior que o seu' : 'diferente do seu'}`));
    }
    const ic = ln.querySelector('canvas'); if (ic) { const w = el('span', { class: 'moldura-rar' }); ic.replaceWith(w); w.append(ic); marcaRaridade(w, id); }
    comTip(ln, () => tipItem(id, 0));
  });
};

/* ---------- Forja em mais lugares ---------- */
function ligaForjas() {
  for (const k in NPCS) if (/^loja_|^lojista_/.test(k)) NPCS[k].refino = true;
  const neide = Object.keys(NPCS).find(k => /Loja Esportiva da Neide/.test(NPCS[k].ola || '')); if (neide) NPCS[neide].refino = true;
}
ligaForjas();
const _modalRefinoBase = modalRefino;
modalRefino = function (npc, msg) {
  _modalRefinoBase(npc, msg);
  const h = document.querySelector('#modalConteudo h2'); if (h) h.textContent = `🔨 Forja — ${npc.d.nome}`;
};
// o botão do diálogo passa a se chamar Forja
const _abrirNPCBase = abrirNPC;
abrirNPC = function (npc) {
  _abrirNPCBase(npc);
  document.querySelectorAll('#modalConteudo button').forEach(b => { if (b.textContent === 'Refinar equipamentos') b.textContent = '🔨 Forja: fortalecer itens (+1 a +10)'; });
};
document.addEventListener('mousedown', escondeTip); window.addEventListener('blur', escondeTip);

/* ---------- estilo ---------- */
(function () {
  if (document.getElementById('itens-css')) return;
  const st = document.createElement('style'); st.id = 'itens-css';
  st.textContent = `
  .slot, .eq-slot { position: relative; }
  .selo-st { position: absolute; left: 1px; bottom: 1px; font: 700 10px/1 Fredoka, Nunito, sans-serif; color: #fff; background: rgba(30,18,40,.78); border-radius: 4px; padding: 1px 3px; pointer-events: none; font-variant-numeric: tabular-nums; }
  .seta-cmp { position: absolute; left: 1px; top: 1px; font: 800 11px/1 Nunito, sans-serif; padding: 1px 3px; border-radius: 4px; pointer-events: none; color: #fff; }
  .seta-cmp.melhor { background: #1f9a3a; } .seta-cmp.pior { background: #c0392b; } .seta-cmp.misto { background: #c99a1a; }
  /* raridade: borda + fundo colorido (comum cinza, incomum verde, raro azul, épico roxo, lendário dourado) */
  .rar-comum { border-color: #9a8f86 !important; background: radial-gradient(circle at 50% 45%, #f4ece0 0 55%, #d9cfc2 100%) !important; }
  .rar-incomum { border-color: #2fae4a !important; background: radial-gradient(circle at 50% 45%, #eaffe9 0 50%, #9fe0a4 100%) !important; }
  .rar-raro { border-color: #2f7fe0 !important; background: radial-gradient(circle at 50% 45%, #e6f2ff 0 50%, #93c4ff 100%) !important; }
  .rar-epico { border-color: #9a3fe0 !important; background: radial-gradient(circle at 50% 45%, #f5e8ff 0 45%, #cf9cff 100%) !important; box-shadow: 0 0 6px #b86aff88; }
  .rar-lendario { border-color: #e0a010 !important; background: radial-gradient(circle at 50% 45%, #fff8dc 0 45%, #ffd25a 100%) !important; box-shadow: 0 0 8px #ffc83aaa; animation: brilhoLend 2.4s ease-in-out infinite; }
  @keyframes brilhoLend { 50% { box-shadow: 0 0 14px #ffc83a; } }
  .slot.rar-comum, .slot.rar-incomum, .slot.rar-raro, .slot.rar-epico, .slot.rar-lendario, .eq-slot[class*=rar-] { border-width: 2px; border-style: solid; }
  .moldura-rar { display: inline-flex; border: 2px solid; border-radius: 6px; padding: 1px; flex: none; }
  .tag-rar { align-self: flex-start; font: 800 10px/1 Nunito, sans-serif; letter-spacing: .5px; padding: 2px 6px; border-radius: 8px; border: 1px solid; }
  .txt-comum { color: #5a4a3a; } .txt-incomum { color: #1f8a3a; } .txt-raro { color: #1f63c0; } .txt-epico { color: #7a2ad9; } .txt-lendario { color: #b8860b; }
  .chip-cmp { font: 700 11px Nunito, sans-serif; padding: 1px 6px; border-radius: 10px; color: #fff; vertical-align: 1px; }
  .chip-cmp.melhor { background: #1f9a3a; } .chip-cmp.pior { background: #c0392b; } .chip-cmp.misto { background: #c99a1a; }
  .tip-item { position: fixed; z-index: 100000; max-width: 280px; background: #fdf3dc; color: #3d2b3a; border: 3px solid #6a4a2a; border-radius: 10px; padding: 8px 10px; box-shadow: 0 6px 18px rgba(0,0,0,.35); font: 600 13px Nunito, sans-serif; pointer-events: none; display: flex; flex-direction: column; gap: 3px; }
  .tip-item.no-modal { position: static; max-width: none; box-shadow: none; border-width: 2px; margin: 6px 0; pointer-events: auto; }
  .tip-nome { font: 700 15px Fredoka, Nunito, sans-serif; } .tip-nome.raro { color: #b8860b; } .tip-nome.forte { color: #7a2ad9; }
  .tip-tipo { color: #7a6048; }
  .tip-stats { display: grid; grid-template-columns: 1fr auto auto; gap: 1px 10px; align-items: baseline; margin: 2px 0; }
  .tip-stats b { text-align: right; font-variant-numeric: tabular-nums; } .tip-stats i { font-style: normal; font-weight: 800; font-size: 12px; min-width: 44px; text-align: right; }
  .tip-pos { color: #1f8a3a; } .tip-neg { color: #c0392b; font-weight: 700; }
  .tip-cmp { color: #6a5040; font-style: italic; } .tip-forja { color: #6a4a8a; } .tip-dica { color: #1f6a9a; font-weight: 700; }
  .tip-item p { margin: 2px 0 0; font-weight: 600; }
  .dribles-lista { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; } .dribles-lista h4 { margin: 4px 0 0; font-family: Fredoka, Nunito, sans-serif; }
  .drible-card { display: flex; align-items: center; gap: 6px; background: #fffaf0; border: 2px solid var(--papel2, #e0c9a0); border-radius: 8px; padding: 3px 6px; cursor: grab; }
  .drible-card canvas { width: 28px; height: 28px; } .drible-card .nm { flex: 1; display: flex; flex-direction: column; line-height: 1.1; } .drible-card.bloq { opacity: .55; }
  body.arrastando #hotbar .slot { outline: 2px dashed #ffd23f; outline-offset: -2px; }
  #hotbar .slot.alvo-drop { background: #ffd23f55; }
  `;
  document.head.append(st);
})();
