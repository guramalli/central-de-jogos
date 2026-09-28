/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📊 ANALISADOR DE CAÇA (v209), como o Hunting Analyser do Tibia:
   tempo de caça, vitórias, XP (e XP por hora), tostões e loot ganhos,
   garrafas/isotônicos gastos e o saldo por hora. Conta desde que o jogo
   abriu ou desde o último "Zerar". Dá para fixar um resumo no canto da tela.
   Carregar DEPOIS de game.js e pocoes.js.
   ============================================================ */
const AN = { t0: 0, pausa: 0, xp: 0, vit: 0, ouro: 0, lootV: 0, loot: {}, gastoV: 0, gasto: {}, porTipo: {}, fixo: false, _kill: false };
try { AN.fixo = localStorage.getItem('rac_analisador_fixo') === '1'; } catch (e) { }
function zeraAnalisador() { Object.assign(AN, { t0: performance.now(), pausa: 0, xp: 0, vit: 0, ouro: 0, lootV: 0, loot: {}, gastoV: 0, gasto: {}, porTipo: {} }); }
zeraAnalisador();
function anHoras() { return Math.max(1 / 60, (performance.now() - AN.t0 - AN.pausa) / 3600000); } // no mínimo 1 min (os "por hora" não explodem no começo)
function anTempo() { const s = Math.floor((performance.now() - AN.t0 - AN.pausa) / 1000); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`; }
{
  // XP de qualquer lugar (vitórias e missões)
  const _ganhaXpAn = ganhaXp;
  ganhaXp = function () { const s = G.save; const antes = s ? s.xp : 0; const r = _ganhaXpAn.apply(this, arguments); if (s) AN.xp += Math.max(0, s.xp - antes); return r; };
  // vitória: tostões e itens que caíram
  const _matarAn = matar;
  matar = function (m) {
    const s = G.save; const ouro0 = s ? s.ouro : 0; AN._kill = true;
    try { return _matarAn.apply(this, arguments); }
    finally { AN._kill = false; if (s) { AN.ouro += Math.max(0, s.ouro - ouro0); AN.vit++; if (m && m.d) AN.porTipo[m.d.nome] = (AN.porTipo[m.d.nome] || 0) + 1; } }
  };
  const _addItemAn = addItem;
  addItem = function (id, q = 1) {
    const r = _addItemAn.apply(this, arguments);
    if (AN._kill && r && ITENS[id]) { AN.loot[id] = (AN.loot[id] || 0) + q; AN.lootV += (ITENS[id].venda || 0) * q; }
    return r;
  };
  // garrafas e isotônicos gastos
  const _usarItemAn = usarItem;
  usarItem = function (id) {
    const antes = typeof contaItem === 'function' ? contaItem(id) : 0; const r = _usarItemAn.apply(this, arguments);
    const it = ITENS[id]; if (it && it.tipo === 'consumivel' && typeof contaItem === 'function' && contaItem(id) < antes) { AN.gasto[id] = (AN.gasto[id] || 0) + 1; AN.gastoV += it.preco || 0; }
    return r;
  };
  // tempo parado com janela aberta não conta
  let ultimo = performance.now();
  setInterval(() => { const agora = performance.now(); if (!G.rodando || G.pausado) AN.pausa += agora - ultimo; ultimo = agora; atualizaMiniAnalisador(); }, 1000);
}
const porHora = v => fmt(Math.round(v / anHoras()));
function modalAnalisador() {
  const corpo = el('div', { class: 'an-corpo' });
  const pinta = () => {
    corpo.innerHTML = '';
    const saldo = AN.ouro + AN.lootV - AN.gastoV;
    const linha = (rot, v, ph, cls) => el('div', { class: 'an-linha' + (cls ? ' ' + cls : '') }, el('span', {}, rot), el('b', {}, v), el('small', {}, ph ? ph + ' por hora' : ''));
    corpo.append(
      linha('⏱️ Tempo de caça', anTempo()), linha('⚽ Vitórias', fmt(AN.vit), porHora(AN.vit)), linha('✨ XP ganha', fmt(AN.xp), porHora(AN.xp)),
      linha('💰 Tostões', fmt(AN.ouro), porHora(AN.ouro)), linha('🎒 Loot (valor de venda)', fmt(AN.lootV), porHora(AN.lootV)),
      linha('🧃 Garrafas e isotônicos gastos', fmt(AN.gastoV), porHora(AN.gastoV)), linha('📈 Saldo', (saldo < 0 ? '−' : '') + fmt(Math.abs(saldo)), (saldo < 0 ? '−' : '') + porHora(Math.abs(saldo)), saldo < 0 ? 'neg' : 'pos'));
    const lista = (tit, obj, fmtK) => { const ks = Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 8); return ks.length ? el('div', { class: 'an-lista' }, el('b', {}, tit), ...ks.map(([k, n]) => el('div', {}, `${n}× ${fmtK(k)}`))) : null; };
    corpo.append(el('div', { class: 'an-listas' }, lista('Adversários', AN.porTipo, k => k), lista('Loot', AN.loot, k => ITENS[k] ? ITENS[k].nome : k), lista('Gastos', AN.gasto, k => ITENS[k] ? ITENS[k].nome : k)));
  };
  pinta();
  const fixar = el('label', { class: 'an-fixar' }, el('input', { type: 'checkbox', id: 'anFixo', checked: AN.fixo ? 'checked' : null, onchange: ev => { AN.fixo = ev.target.checked; try { localStorage.setItem('rac_analisador_fixo', AN.fixo ? '1' : '0'); } catch (e) { } atualizaMiniAnalisador(); } }), ' Mostrar um resumo no canto da tela');
  abreModal(el('h2', {}, '📊 Analisador de caça'), el('p', { class: 'dica' }, 'Conta desde que você abriu o jogo (ou desde o último "Zerar"). O tempo com uma janela aberta não conta.'), corpo, fixar,
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => { zeraAnalisador(); pinta(); atualizaMiniAnalisador(); } }, '↺ Zerar'), el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Fechar')));
  const t = setInterval(() => { if ($('#modal').hidden || !document.body.contains(corpo)) { clearInterval(t); return; } pinta(); }, 1000);
}
function atualizaMiniAnalisador() {
  let w = document.getElementById('miniAnalisador');
  if (!AN.fixo || !G.rodando || !G.save) { if (w) w.remove(); return; }
  if (!w) { w = el('button', { id: 'miniAnalisador', class: 'mini-an', type: 'button', title: 'Analisador de caça (clique para abrir)', onclick: () => modalAnalisador() }); document.body.append(w); }
  const r = CV.getBoundingClientRect(); w.style.left = (r.left + 8) + 'px'; w.style.top = (r.top + 8) + 'px';
  const saldo = AN.ouro + AN.lootV - AN.gastoV;
  w.textContent = `📊 ${porHora(AN.xp)} XP/h · ${saldo < 0 ? '−' : ''}${porHora(Math.abs(saldo))} 💰/h`;
}
{
  const poe = () => {
    const lista = document.querySelector('#topo .tb-lista');
    if (lista && !document.getElementById('btnAnalisador')) lista.append(el('button', { class: 'btn', id: 'btnAnalisador', type: 'button', role: 'menuitem', onclick: () => { if (G.save) modalAnalisador(); } }, '📊 Analisador de caça'));
    const grade = document.querySelector('#celMenu .cm-grade');
    if (grade && !document.getElementById('cmAnalisador')) grade.append(el('button', { class: 'btn cm-bt', id: 'cmAnalisador', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); if (G.save) modalAnalisador(); } }, el('span', { class: 'cm-ic' }, '📊'), 'Análise'));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(poe, 0)); else setTimeout(poe, 0);
  const _iniAn = iniciarJogo; iniciarJogo = async function () { const r = await _iniAn.apply(this, arguments); zeraAnalisador(); poe(); return r; };
  const st = document.createElement('style');
  st.textContent = `.an-corpo { display: grid; gap: 4px; }
  .an-linha { display: grid; grid-template-columns: 1fr auto 150px; gap: 10px; align-items: baseline; padding: 5px 8px; border-radius: 8px; background: rgba(0,0,0,.05); }
  .an-linha b { font-size: 18px; font-variant-numeric: tabular-nums; } .an-linha small { opacity: .75; text-align: right; font-variant-numeric: tabular-nums; }
  .an-linha.pos b { color: #1d7a42; } .an-linha.neg b { color: #b0301a; }
  .an-listas { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; margin-top: 8px; } .an-lista { font-size: 13.5px; display: grid; gap: 2px; }
  .an-fixar { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-weight: 700; }
  .mini-an { position: fixed; z-index: 35; background: rgba(20,14,34,.82); color: #fff; border: 1px solid rgba(255,255,255,.25); border-radius: 8px; padding: 4px 9px; font: 700 12.5px Nunito, sans-serif; cursor: pointer; }
  @media (max-width: 600px) { .an-linha { grid-template-columns: 1fr auto; } .an-linha small { grid-column: 1 / -1; text-align: left; } }`;
  document.head.append(st);
}
