/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎒 MOCHILAS IGUAIS AO TIBIA (v396; dono: "refaça a mecânica das backpacks, está muito ruim... quero algo igual o Tibia";
   escolhas do dono: coluna à direita, mochila equipada nas costas, pilhas com divisão; v399: até 999 por espaço).
   - COSTAS: a mochila principal é um item equipado (s.costas = { id, u }); os espaços dela são os espaços do item.
     Quem já jogava ganhou a Mochila de Campo (30 espaços = os 30 de antes, com tudo dentro). Trocar: arraste uma bolsa
     para o quadro "Costas" (ou "🎒 Usar nas costas" na bolsa) — a mochila antiga, com tudo o que tinha, vai para dentro da nova.
   - COLUNA: no computador as janelas (mochila das costas + bolsas abertas) ficam no painel da direita; cada janela
     minimiza (–), a das bolsas também fecha (✕), volta para a bolsa de fora (↑) e muda de ordem arrastando o título.
   - PILHAS: até PILHA_MAX (999) por espaço (game.js addItem). Shift + arrastar (ou "✂️ Dividir" na janela do item) pergunta quantos;
     soltar uma pilha em cima de outra igual junta as duas (até 999).
   Carregar DEPOIS de mochilas.js, armazem.js e luxo.js.
   ============================================================ */
ITENS.mochila_campo = { nome: 'Mochila de Campo', tipo: 'bolsa', espacos: 30, lvl: 1, preco: 2000, venda: 0, desc: 'A mochila de todo jogador: 30 espaços. Use nas costas ou guarde dentro de outra mochila.', icon: { k: 'pacote', c: '#7a5a2a' } };
// o ícone: a arte da Mochila de Viagem pintada de verde (campo)
{
  let ic = null;
  const _icMT = iconeItem;
  iconeItem = function (id) {
    if (id !== 'mochila_campo') return _icMT.apply(this, arguments);
    if (ic) return ic;
    const base = _icMT('mochila_viagem'); if (!base || !base.width) return _icMT.apply(this, arguments);
    if (base.width < 40) return base; // (a arte ainda não chegou: o desenho simples por enquanto)
    const c = mkCanvas(base.width, base.height), x = c.getContext('2d'); x.filter = 'hue-rotate(70deg) saturate(0.85)'; x.drawImage(base, 0, 0);
    return (ic = c);
  };
}
const mtNovoU = s => (s.uidBolsa = (s.uidBolsa || 0) + 1);
const mtFilhos = (s, u) => s.mochila.filter(e => (e.c ?? null) === (u ?? null));
// mochila das costas: todo save tem uma (os antigos ganham a Mochila de Campo, com os mesmos 30 espaços de antes)
function mtGaranteCostas(s = G.save) {
  if (!s) return; if (!s.costas || !ITENS[s.costas.id] || ITENS[s.costas.id].tipo !== 'bolsa') s.costas = { id: 'mochila_campo', u: mtNovoU(s) };
  if (s.costas.u == null || s.mochila.some(e => e.u === s.costas.u)) s.costas.u = mtNovoU(s);
}
// pilhas maiores que PILHA_MAX (saves antigos, item que voltou do armazém): divide onde tiver espaço
function mtDividePilhas(s = G.save) {
  if (!s || !Array.isArray(s.mochila)) return;
  for (const e of [...s.mochila]) {
    if (!e || e.r || !ITENS[e.id] || !empilha(e.id)) continue;
    while (e.q > PILHA_MAX && s.mochila.length < capMochila(s)) {
      const dest = espacosLivres(e.c ?? null, s) > 0 ? (e.c ?? null) : bolsaParaNovo(e.id, s);
      if (espacosLivres(dest, s) <= 0) break;
      const p = Math.min(e.q - PILHA_MAX, PILHA_MAX), n = { id: e.id, q: p }; if (dest != null) n.c = dest;
      s.mochila.push(n); e.q -= p;
    }
  }
}
{ const _arrMT = arrumaBolsas; arrumaBolsas = function (s = G.save) { const r = _arrMT.apply(this, arguments); try { mtGaranteCostas(s); mtDividePilhas(s); } catch (e) { } return r; }; }
{ const _iniMT = iniciarJogo; iniciarJogo = async function () { const r = await _iniMT.apply(this, arguments); try { mtGaranteCostas(G.save); arrumaBolsas(G.save); G.uiSujo = true; } catch (e) { } return r; }; }

// ---------- trocar a mochila das costas ----------
function mtTrocaCostas(i) {
  const s = G.save, X = s.mochila[i]; if (!X || !ehBolsa(X.id)) return false; mtGaranteCostas(s);
  const velho = s.costas, extra = mochilaSlots(s) - (ITENS[velho.id].espacos || 0); // (espaços a mais da versão Steam continuam valendo)
  const novoCap = (ITENS[X.id].espacos || 0) + extra, dentroX = mtFilhos(s, X.u).length;
  if (dentroX + 1 > novoCap) { log(`A ${ITENS[X.id].nome} precisa de 1 espaço livre para guardar a ${ITENS[velho.id].nome}.`, 'l-sis'); som('erro'); return false; }
  const xU = X.u, xC = X.c ?? null;
  for (const e of s.mochila) if (e !== X && e.c == null) e.c = velho.u; // o que estava na mochila antiga continua nela
  for (const e of s.mochila) if (e.c === xU) delete e.c; // o que estava na bolsa nova vira o "de cima"
  s.mochila.splice(s.mochila.indexOf(X), 1);
  const antiga = { id: velho.id, q: 1, u: velho.u }; s.mochila.push(antiga); // a mochila antiga entra na nova (1 espaço)
  if (xC != null && xC !== velho.u && s.mochila.some(e => e.u === xC)) { /* (a bolsa nova estava dentro de outra bolsa: tudo bem, ela saiu de lá) */ }
  s.costas = { id: X.id, u: xU };
  s.bolsasAbertas = (s.bolsasAbertas || []).filter(u => u !== xU);
  if (s.bolsaLoot === xU) delete s.bolsaLoot;
  arrumaBolsas(s);
  log(`🎒 Agora você usa a ${ITENS[X.id].nome} nas costas (${mochilaSlots(s)} espaços). A ${ITENS[velho.id].nome} foi para dentro dela, com tudo o que tinha.`, 'l-info');
  som('equip'); G.uiSujo = true; return true;
}
// ↑: a janela da bolsa volta para a bolsa de fora (se a de fora é a mochila das costas, a janela só fecha)
function mtSobe(u) {
  const s = G.save, bag = s.mochila.find(e => e.u === u); if (!bag) return;
  const l = s.bolsasAbertas || [], k = l.indexOf(u); if (k < 0) return;
  if (bag.c != null && !l.includes(bag.c)) l.splice(k, 1, bag.c); else l.splice(k, 1);
  som('equip'); G.uiSujo = true;
}
// ---------- dividir e juntar pilhas ----------
function mtPerguntaQtd(max, titulo, cb) {
  const n = el('input', { type: 'number', min: 1, max, value: Math.max(1, Math.floor(max / 2)), style: 'width:90px;font-size:18px' });
  const r = el('input', { type: 'range', min: 1, max, value: n.value, style: 'width:100%' });
  r.oninput = () => { n.value = r.value; }; n.oninput = () => { r.value = n.value; };
  const ok = () => { const v = Math.max(1, Math.min(max, parseInt(n.value) || 1)); fechaModal(); cb(v); };
  n.onkeydown = ev => { if (ev.key === 'Enter') ok(); };
  abreModal(el('h2', {}, titulo), el('p', {}, `Quantos? (1 a ${max})`), r, el('div', { class: 'opcoes', style: 'align-items:center' }, n,
    el('button', { class: 'btn amarelo', type: 'button', onclick: ok }, 'OK'), el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Cancelar')));
  setTimeout(() => { try { n.focus(); n.select(); } catch (e) { } }, 50);
}
// leva n itens da pilha i para a bolsa dest (null = mochila das costas) ou para cima da pilha j
function mtMoveParte(i, dest, n, j) {
  const s = G.save, e = s.mochila[i]; if (!e) return false; n = Math.max(1, Math.min(e.q, n | 0));
  const alvo = j != null ? s.mochila[j] : null;
  if (alvo && alvo !== e && alvo.id === e.id && !alvo.r && !e.r && empilha(e.id)) { // em cima de uma pilha igual: junta
    const p = Math.min(n, PILHA_MAX - alvo.q); if (p <= 0) { log(`Essa pilha já está cheia (${PILHA_MAX}).`, 'l-sis'); som('erro'); return false; }
    alvo.q += p; e.q -= p; if (e.q <= 0) s.mochila.splice(i, 1); som('equip'); G.uiSujo = true; return true;
  }
  if (n >= e.q) return moveNaMochila(i, dest); // a pilha inteira: só muda de lugar
  if (espacosLivres(dest, s) <= 0) { log(dest == null ? 'A mochila está cheia.' : `Não cabe: a ${ITENS[s.mochila.find(x => x.u === dest).id].nome} está cheia.`, 'l-sis'); som('erro'); return false; }
  const nova = { id: e.id, q: n }; if (dest != null) nova.c = dest; e.q -= n; s.mochila.unshift(nova); // (na primeira posição)
  som('equip'); G.uiSujo = true; return true;
}
// arrastar: Shift divide; soltar em cima de uma pilha igual junta (antes do arrasto de mochilas.js, que só muda de lugar)
{
  const MIME_MOVE_MT = 'text/x-lenda-mochila', MIME_JAN = 'text/x-lenda-janela';
  const instala = mo => {
    if (!mo || mo._mt) return; mo._mt = true;
    mo.addEventListener('drop', ev => {
      const dt = ev.dataTransfer; if (!dt || ![...dt.types].includes(MIME_MOVE_MT)) return;
      const s = G.save, i = +dt.getData(MIME_MOVE_MT), e = s && s.mochila[i]; if (!e) return;
      const alvoB = ev.target.closest && ev.target.closest('.slot[data-i]'), j = alvoB ? +alvoB.dataset.i : null, alvo = j != null ? s.mochila[j] : null;
      const g = ev.target.closest && ev.target.closest('.mochila-grade');
      const dest = alvo && ehBolsa(alvo.id) && j !== i ? alvo.u : g ? (g.dataset.bolsa === '' ? null : +g.dataset.bolsa) : null;
      const junta = alvo && j !== i && alvo.id === e.id && !alvo.r && !e.r && empilha(e.id);
      if (!ev.shiftKey && !junta) return; // (o resto: mochilas.js)
      ev.preventDefault(); ev.stopImmediatePropagation(); document.body.classList.remove('movendo-item');
      if (ev.shiftKey && e.q > 1) mtPerguntaQtd(e.q, `✂️ Dividir: ${ITENS[e.id].nome}`, n => mtMoveParte(i, dest, n, junta ? j : null));
      else mtMoveParte(i, dest, e.q, junta ? j : null);
    }, true);
    // a ordem das janelas: arraste o título de uma bolsa para cima de outra janela
    mo.addEventListener('dragstart', ev => {
      const t = ev.target.closest && ev.target.closest('.bolsa-janela:not(.mt-raiz) > .bolsa-tit'); if (!t) return;
      try { ev.dataTransfer.setData(MIME_JAN, t.parentElement.dataset.bolsa); ev.dataTransfer.effectAllowed = 'move'; } catch (e) { }
    });
    ['dragenter', 'dragover'].forEach(tp => mo.addEventListener(tp, ev => { if (ev.dataTransfer && [...ev.dataTransfer.types].includes(MIME_JAN)) ev.preventDefault(); }));
    mo.addEventListener('drop', ev => {
      const dt = ev.dataTransfer; if (!dt || ![...dt.types].includes(MIME_JAN)) return; ev.preventDefault();
      const s = G.save, u = +dt.getData(MIME_JAN), j = ev.target.closest && ev.target.closest('.bolsa-janela'); if (!s || !j) return;
      const l = s.bolsasAbertas || [], de = l.indexOf(u); if (de < 0) return; l.splice(de, 1);
      const para = j.dataset.bolsa === '' ? 0 : l.indexOf(+j.dataset.bolsa) + (j.getBoundingClientRect().top + j.offsetHeight / 2 < ev.clientY ? 1 : 0);
      l.splice(Math.max(0, para), 0, u); G.uiSujo = true;
    });
  };
  const _pMT = atualizaPaineis;
  atualizaPaineis = function () {
    const r = _pMT.apply(this, arguments);
    try { instala(document.getElementById('mochila')); mtPosiciona(); mtCostasNoEquip(); } catch (e) { console.warn('mochila tibia', e); }
    return r;
  };
}
// ---------- a coluna: no computador, as janelas ficam no painel da direita ----------
function mtPosiciona() {
  const mo = document.getElementById('mochila'), aba = document.getElementById('aba-mochila'); if (!mo || !aba) return;
  const painel = document.querySelector('[data-painel="bolsas"] .bolsas-painel'), bloco = painel && painel.closest('[data-painel]');
  const cel = document.body.classList.contains('modo-celular'); // (no celular tudo fica na aba Mochila, que abre pelo 🎒)
  const visivel = !cel && !!(bloco && bloco.offsetParent !== null && getComputedStyle(bloco).display !== 'none' && bloco.getBoundingClientRect().width >= 150);
  let aviso = document.getElementById('mtAviso');
  if (!aviso) { aviso = el('div', { id: 'mtAviso', class: 'vazio' }); aba.prepend(aviso); }
  // v400 (dono: "retire essa box 'Mochila', não tem usabilidade"): com as mochilas na coluna da direita, a aba/painel
  // "Mochila" some (a tecla I e o tutorial levam para a coluna 🎒 Mochilas)
  const bt = document.querySelector('.abas button[data-aba="mochila"]'), blocoSolto = document.querySelector('.bloco-solto[data-painel="aba:mochila"]');
  aviso.hidden = true; aviso.textContent = '';
  if (visivel) {
    if (mo.parentElement !== painel) painel.append(mo);
    const tit = painel.querySelector('.bolsas-tit'); if (tit && tit.textContent !== '🎒 Mochilas') tit.textContent = '🎒 Mochilas';
    if (bt && !bt.hidden) { bt.hidden = true; if (bt.classList.contains('ativa')) { const outro = bt.parentElement && [...bt.parentElement.querySelectorAll('button[data-aba]')].find(x => x !== bt && !x.hidden); if (outro) outro.click(); } }
    if (blocoSolto) blocoSolto.hidden = true;
  } else {
    if (mo.parentElement !== aba) aba.append(mo);
    if (bt) bt.hidden = false; if (blocoSolto) blocoSolto.hidden = false;
  }
}
window.addEventListener('resize', () => { try { mtPosiciona(); } catch (e) { } });
// tecla I / tutorial abrindo a aba Mochila: com a coluna à direita, mostra a coluna (rola até ela e pisca)
if (typeof abreAba === 'function') {
  const _abaMT = abreAba;
  abreAba = function (n) {
    const p = n === 'mochila' && document.querySelector('[data-painel="bolsas"] .bolsas-painel #mochila');
    if (p) { const bl = p.closest('.bloco'); if (bl) { if (bl.classList.contains('minimizado') && typeof minimiza === 'function') minimiza(bl, false); try { bl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { } bl.classList.remove('pisca'); void bl.offsetWidth; bl.classList.add('pisca'); } return; }
    return _abaMT.apply(this, arguments);
  };
}
// ---------- o quadro "Costas" no Equipamento ----------
function mtCostasNoEquip() { // v400: a mochila é um quadro do boneco (ui.js); aqui só o soltar outra mochila nele
  const b = document.querySelector('#equip .eq-slot[data-slot="costas"]'); if (!b || b._mt) return; b._mt = true;
  const tem = ev => ev.dataTransfer && [...ev.dataTransfer.types].includes('text/x-lenda-mochila');
  b.addEventListener('dragover', ev => { if (tem(ev)) { ev.preventDefault(); ev.stopPropagation(); b.classList.add('alvo-equip'); } }, true);
  b.addEventListener('dragleave', () => b.classList.remove('alvo-equip'));
  b.addEventListener('drop', ev => { b.classList.remove('alvo-equip'); if (!tem(ev)) return; ev.preventDefault(); ev.stopPropagation(); const i = +ev.dataTransfer.getData('text/x-lenda-mochila'); const e = G.save.mochila[i]; if (e && ehBolsa(e.id)) mtTrocaCostas(i); else { log('Aqui só vai mochila ou bolsa.', 'l-sis'); som('erro'); } }, true);
}
function mtEscolheCostas() {
  const s = G.save, bolsas = s.mochila.map((e, i) => ({ e, i })).filter(x => ehBolsa(x.e.id));
  const lista = el('div', { class: 'lista' });
  if (!bolsas.length) lista.append(el('p', {}, 'Você não tem outra mochila ou bolsa. Compre nas lojas (Bolsinha, Mochila de Viagem...) ou com o Barão Diamante.'));
  for (const { e, i } of bolsas) {
    const d = ITENS[e.id], n = mtFilhos(s, e.u).length;
    lista.append(el('div', { class: 'linha-item' }, iconeClone(iconeItem(e.id)), el('div', { class: 'nm' }, el('b', {}, d.nome), el('small', {}, `${d.espacos} espaços${n ? ` · ${n} itens dentro` : ''}`)),
      el('button', { class: 'btn amarelo mini', type: 'button', onclick: () => { if (mtTrocaCostas(i)) fechaModal(); } }, '🎒 Usar nas costas')));
  }
  abreModal(el('h2', {}, '🎒 Mochila das costas'), el('p', {}, `Agora: ${ITENS[s.costas.id].nome} (${mochilaSlots(s)} espaços). A que você usar nas costas vira a sua mochila principal; a antiga vai para dentro dela, com tudo o que tinha.`), lista);
}
// ---------- na janela do item: dividir pilha e usar a bolsa nas costas ----------
{
  const _modMT = modalItem;
  modalItem = function (id) {
    const r = _modMT.apply(this, arguments);
    try {
      const box = document.getElementById('modalConteudo'), s = G.save; if (!box || !ITENS[id]) return r;
      const ops = el('div', { class: 'opcoes' });
      const i = s.mochila.findIndex(e => e.id === id && !e.r && e.q > 1);
      if (i >= 0 && empilha(id)) ops.append(el('button', { class: 'btn', type: 'button', title: 'Separa uma parte da pilha num espaço novo', onclick: () => { const e = s.mochila[i]; mtPerguntaQtd(e.q - 1, `✂️ Dividir: ${ITENS[id].nome}`, n => mtMoveParte(i, e.c ?? null, n)); } }, '✂️ Dividir pilha'));
      if (ehBolsa(id)) { const k = s.mochila.findIndex(e => e.id === id); if (k >= 0) ops.append(el('button', { class: 'btn', type: 'button', onclick: () => { if (mtTrocaCostas(k)) fechaModal(); } }, '🎒 Usar nas costas')); }
      if (ops.children.length) box.append(ops);
    } catch (e) { }
    return r;
  };
}
{
  const st = document.createElement('style');
  st.textContent = `
  .bolsas-painel #mochila { margin: 0; }
  #mochila .bolsa-janela { margin-top: 6px; border: 2px solid #8a6a3a; border-radius: 8px; padding: 0 4px 4px; background: rgba(255,248,232,.75); }
  #mochila .bolsa-janela.mt-raiz { border-color: #5a4020; }
  #mochila .bolsa-janela.loot { border-color: #e0b020; }
  #mochila .bolsa-janela > .bolsa-tit { margin: 0 -4px 4px; padding: 3px 4px; background: linear-gradient(#a8743a, #8a5a2a); color: #fff3d6; border-radius: 5px 5px 0 0; display: flex; align-items: center; gap: 4px; font-size: 12px; }
  #mochila .bolsa-janela > .bolsa-tit[draggable="true"] { cursor: grab; }
  #mochila .bolsa-janela > .bolsa-tit b { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #mochila .bolsa-janela > .bolsa-tit small { opacity: .9; }
  #mochila .bolsa-janela > .bolsa-tit canvas, #mochila .bolsa-janela > .bolsa-tit img { width: 18px; height: 18px; }
  #mochila .bolsa-janela > .bolsa-tit .btn.mini { padding: 0 5px; min-width: 20px; line-height: 16px; font-size: 11px; }
  #mochila .bolsa-janela.mini { padding-bottom: 0; } #mochila .bolsa-janela.mini > .bolsa-tit { margin-bottom: 0; border-radius: 5px; }
  .bolsas-painel #mochila .mochila-grade { grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); }
  .bolsas-painel #mochila > .vazio { font-size: 11px; opacity: .7; }
  .bolsas-painel #bolsasAbertas { display: none; }
  body.modo-celular [data-painel="bolsas"] { display: none !important; }
  #mtAviso { margin: 4px 0 6px; font-size: 13px; }
  .mt-costas-velho { display: flex; align-items: center; gap: 6px; margin-top: 8px; padding: 4px 6px; border: 2px dashed #c9a46a; border-radius: 8px; font-size: 12px; }
  .mt-costas .eq-slot { position: relative; width: 38px; height: 38px; flex: none; }
  .mt-costas > span:nth-of-type(2) { flex: 1; } .mt-costas .rot { font-weight: 700; }
  .mt-costas.alvo { border-color: #e0b020; background: #fff3c8; }
  #mochila .mt-peso { font-weight: 800; font-size: 11px; background: rgba(0,0,0,.18); border-radius: 6px; padding: 0 5px; white-space: nowrap; } #mochila .mt-peso.pesada { background: #c0392b; }
  [data-painel="perfil"] .barra span { display: flex; justify-content: space-between; align-items: center; padding: 0 6px; gap: 6px; }
  [data-painel="perfil"] .barra span em { font-style: normal; font-weight: 700; opacity: .95; } [data-painel="perfil"] .barra span b { font-variant-numeric: tabular-nums; }
  .mt-status { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 10px; padding: 6px 8px; font-size: 12px; }
  .mt-st { display: flex; justify-content: space-between; align-items: center; padding: 2px 6px; border-radius: 6px; background: rgba(138,75,36,.1); }
  .mt-st span { opacity: .85; } .mt-st b { font-variant-numeric: tabular-nums; } .mt-st.pesada { background: rgba(210,58,42,.25); }
  .bloco.minimizado .mt-status { display: none; }
  #equip .eq-slot[data-slot="costas"] { background: radial-gradient(circle at 50% 45%, #fffaf0 0 50%, #ead7b0 100%) !important; border: 2px solid #b8925a !important; cursor: pointer; }
  #equip .eq-slot[data-slot="costas"].alvo-equip { border-color: #e0b020 !important; box-shadow: 0 0 0 3px rgba(224,176,32,.5); }
  /* v400: Habilidades em cartões */
  #skills .skv, #skills .skv-nivel { margin: 6px 0; padding: 6px 8px 7px; border-radius: 9px; background: rgba(255,248,230,.75); border: 2px solid rgba(138,75,36,.28); }
  #skills .skv-nivel { background: linear-gradient(#fff3c8, #ffe79a); border-color: #c9a46a; }
  #skills .skv-cab { display: flex; align-items: center; gap: 6px; }
  #skills .skv-ic { width: 26px; height: 26px; flex: none; display: grid; place-items: center; font-size: 16px; border-radius: 7px; background: rgba(138,75,36,.15); }
  #skills .skv-nome { flex: 1; font-weight: 700; font-size: 14px; }
  #skills .skv-lv { font: 800 20px Fredoka, Nunito, sans-serif; color: var(--madeira2, #5e2f14); font-variant-numeric: tabular-nums; }
  #skills .skv-bonus { font-size: 11px; font-weight: 800; color: #1f7a2e; background: rgba(58,194,106,.18); border-radius: 6px; padding: 1px 5px; }
  #skills .skv-barra { position: relative; height: 13px; margin-top: 5px; border-radius: 7px; background: #3a2a1a; box-shadow: inset 0 1px 2px rgba(0,0,0,.5); overflow: hidden; }
  #skills .skv-barra i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 7px; background: linear-gradient(#7ad85a, #3a9a2a); }
  #skills .skv-barra.xp i { background: linear-gradient(#ffe27a, #e0a020); }
  #skills .skv-barra span { position: relative; display: block; text-align: center; font: 800 10px/13px Nunito, sans-serif; color: #fff; text-shadow: 0 1px 2px #000; }
  #skills .sk-info { margin-top: 8px; padding: 6px 8px; border-radius: 9px; background: rgba(138,75,36,.08); }`;
  document.head.append(st);
}
// ---------- status do personagem (v399; dono: "a capacidade de carregar peso deve ficar no status do jogador, que também pode
// ser repaginado de uma maneira mais profissional"): barras com nome à esquerda e número à direita + quadro de status ----------
{
  const _abMT = atualizaBarras;
  atualizaBarras = function () {
    const r = _abMT.apply(this, arguments);
    try {
      const s = G.save; if (!s) return r; const st = stats();
      const poe = (id, nome, val) => { const e = document.getElementById(id); if (!e) return; const v = `${nome}|${val}`; if (e.dataset.v === v && e.firstElementChild && e.firstElementChild.tagName === 'EM') return; /* (o jogo reescreve o texto: refaz) */ e.dataset.v = v; e.innerHTML = ''; e.append(el('em', {}, nome), el('b', {}, val)); };
      const a = xpPara(s.nivel), b = xpPara(s.nivel + 1);
      poe('tHp', '❤️ Fôlego', `${fmt(Math.round(s.hp))} / ${fmt(st.maxHp)}`); poe('tFoco', '💧 Foco', `${fmt(Math.round(s.foco))} / ${fmt(st.maxFoco)}`);
      poe('tXp', '⭐ XP', `${Math.floor((s.xp - a) / Math.max(1, b - a) * 100)}%`);
      let q = document.getElementById('mtStatus');
      if (!q) { const barras = document.querySelector('[data-painel="perfil"] .painel.barras'); if (!barras) return r; q = el('div', { class: 'painel mt-status', id: 'mtStatus' }); barras.after(q); }
      const peso = pesoMochila(s), cap = capPeso(s), livre = Math.max(0, cap - peso);
      const linha = (ic, nome, val, dica, cls) => el('div', { class: 'mt-st' + (cls ? ' ' + cls : ''), title: dica }, el('span', {}, ic + ' ' + nome), el('b', {}, val));
      const chave = [cap, Math.round(livre), Math.round(st.atk || 0), Math.round(st.armadura || 0), Math.round(st.vel || 0)].join('|');
      if (q.dataset.v !== chave) {
        q.dataset.v = chave; q.innerHTML = '';
        q.append(linha('⚖️', 'Cap', fmt(cap), `Quanto peso você aguenta carregar (aumenta com o nível e o fôlego). Livre agora: ${fmt(Math.round(livre))}.`, livre < cap * 0.1 ? 'pesada' : ''),
          linha('⚔️', 'Ataque', fmt(Math.round(st.atk || 0)), 'Força dos seus golpes'),
          linha('🛡️', 'Defesa', fmt(Math.round(st.armadura || 0)), 'Quanto você aguenta dos golpes'),
          linha('💨', 'Velocidade', fmt(Math.round(st.vel || 0)), 'Velocidade de andar'));
      }
    } catch (e) { }
    return r;
  };
}
window.MOCHILA_TIBIA = { mtTrocaCostas, mtMoveParte, mtDividePilhas, mtGaranteCostas, mtPosiciona, mtSobe };
