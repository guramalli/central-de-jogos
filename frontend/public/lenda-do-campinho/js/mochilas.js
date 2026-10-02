/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎒 MOCHILAS COMO NO TIBIA (v361, dono: "a pessoa consegue colocar várias mochilas dentro das outras para criar
   lootbags"; limite = PESO, como no Tibia). O núcleo (espaços, peso, onde um item novo entra) está em game.js;
   aqui ficam:
   - arrumaBolsas(): conserta a lista (saves antigos, bolsa que voltou do armazém, excesso de itens numa bolsa);
   - abrir/fechar bolsas (as janelas ficam embaixo da mochila, na aba Mochila) e a 🎯 bolsa de loot;
   - ARRASTAR: item para cima de uma bolsa = entra nela; para uma janela = vai para aquela bolsa/mochila;
   - bolsa com coisas dentro não é vendida nem jogada fora (esvazie antes); no armazém ela vai inteira;
   - o peso de cada item aparece na dica e na janela do item.
   Carregar DEPOIS de itens_marcas.js (fim da fila dos painéis).
   ============================================================ */
function bolsaDescendeDe(s, u, ancestral) { // a bolsa u está (em algum nível) dentro da bolsa "ancestral"?
  const porU = new Map(s.mochila.filter(e => e.u != null).map(e => [e.u, e]));
  let x = porU.get(u), passos = 0;
  while (x && x.c != null && passos++ < 60) { if (x.c === ancestral) return true; x = porU.get(x.c); }
  return false;
}
function arrumaBolsas(s = G.save) {
  if (!s || !Array.isArray(s.mochila)) return;
  const M = s.mochila, novoU = () => (s.uidBolsa = (s.uidBolsa || 0) + 1);
  const vistos = new Set();
  for (const e of M) {
    if (ehBolsa(e.id)) { if (e.u == null || vistos.has(e.u)) e.u = novoU(); vistos.add(e.u); }
    else if (e.u != null) delete e.u;
  }
  const porU = new Map(M.filter(e => e.u != null).map(e => [e.u, e]));
  for (const e of M) { // bolsa que sumiu, bolsa dentro dela mesma
    if (e.c == null) continue;
    if (!porU.has(e.c) || e.c === e.u || (e.u != null && bolsaDescendeDe(s, e.c, e.u))) delete e.c;
  }
  // bolsa com mais itens do que cabe: o excesso vai para onde tiver espaço
  const conts = [null, ...porU.keys()];
  const conta = u => M.reduce((n, e) => n + ((e.c ?? null) === u ? 1 : 0), 0);
  const cap = u => u == null ? mochilaSlots(s) : (ITENS[porU.get(u).id].espacos || 0);
  for (const u of conts) {
    let n = conta(u); if (n <= cap(u)) continue;
    const dentro = M.filter(e => (e.c ?? null) === u);
    for (let k = dentro.length - 1; k >= 0 && n > cap(u); k--) {
      const e = dentro[k];
      const dest = conts.find(v => v !== u && conta(v) < cap(v) && !(e.u != null && (v === e.u || (v != null && bolsaDescendeDe(s, v, e.u)))));
      if (dest === undefined) break;
      if (dest == null) delete e.c; else e.c = dest; n--;
    }
  }
  if (s.bolsaLoot != null && !porU.has(s.bolsaLoot)) delete s.bolsaLoot;
}
function abreBolsa(u) {
  const s = G.save; s.bolsasAbertas = s.bolsasAbertas || [];
  const k = s.bolsasAbertas.indexOf(u); if (k >= 0) s.bolsasAbertas.splice(k, 1); else s.bolsasAbertas.push(u);
  som('equip'); G.uiSujo = true;
}
function marcaBolsaLoot(u) {
  const s = G.save; const bag = s.mochila.find(e => e.u === u); if (!bag) return;
  if (s.bolsaLoot === u) { delete s.bolsaLoot; log('🎯 Bolsa de loot desligada: o loot volta a entrar no primeiro espaço livre.', 'l-info'); }
  else { s.bolsaLoot = u; log(`🎯 ${ITENS[bag.id].nome} agora é a sua BOLSA DE LOOT: o que você ganha dos adversários entra nela primeiro.`, 'l-info'); }
  som('equip'); G.uiSujo = true;
}
// muda um item de lugar (dest = .u da bolsa, ou null = mochila principal)
function moveNaMochila(i, dest) {
  const s = G.save, e = s.mochila[i]; if (!e) return false;
  dest = dest ?? null; if ((e.c ?? null) === dest) return false;
  if (e.u != null && dest != null && (dest === e.u || bolsaDescendeDe(s, dest, e.u))) { log('Não dá para pôr uma bolsa dentro dela mesma!', 'l-sis'); som('erro'); return false; }
  if (espacosLivres(dest, s) <= 0) { log(dest == null ? 'A mochila principal está cheia.' : `Não cabe: a ${ITENS[s.mochila.find(x => x.u === dest).id].nome} está cheia.`, 'l-sis'); som('erro'); return false; }
  if (dest == null) delete e.c; else e.c = dest;
  som('equip'); G.uiSujo = true; return true;
}
// arrastar dentro da mochila (um tipo próprio no dataTransfer: não mistura com o arrasto de equipar nem com a barra)
const MIME_MOVE = 'text/x-lenda-mochila';
{
  const instala = () => { ['mochila', 'bolsasAbertas'].forEach(id => instalaEm(document.getElementById(id))); };
  const instalaEm = mo => {
    if (!mo || mo._bolsas) return; mo._bolsas = true;
    mo.addEventListener('dragstart', ev => {
      const b = ev.target.closest && ev.target.closest('.mochila-grade .slot[data-i]'); if (!b) return;
      try { ev.dataTransfer.setData(MIME_MOVE, b.dataset.i); ev.dataTransfer.effectAllowed = 'move'; } catch (e) { }
      if (!ev.dataTransfer.getData('text/plain')) ev.dataTransfer.setData('text/plain', 'm:' + b.dataset.i);
      document.body.classList.add('movendo-item');
    });
    const tem = ev => ev.dataTransfer && [...ev.dataTransfer.types].includes(MIME_MOVE);
    ['dragenter', 'dragover'].forEach(t => mo.addEventListener(t, ev => { if (tem(ev)) { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; } }));
    mo.addEventListener('drop', ev => {
      if (!tem(ev)) return; ev.preventDefault(); ev.stopPropagation(); document.body.classList.remove('movendo-item');
      const i = +ev.dataTransfer.getData(MIME_MOVE), s = G.save; if (!s || !s.mochila[i]) return;
      const alvo = ev.target.closest && ev.target.closest('.slot[data-i]');
      if (alvo && +alvo.dataset.i !== i) { const e = s.mochila[+alvo.dataset.i]; if (e && ehBolsa(e.id)) { moveNaMochila(i, e.u); return; } }
      const g = ev.target.closest && ev.target.closest('.mochila-grade'); if (!g) return;
      moveNaMochila(i, g.dataset.bolsa === '' ? null : +g.dataset.bolsa);
    });
    document.addEventListener('dragend', () => document.body.classList.remove('movendo-item'), true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instala); else instala();
  const _pM = atualizaPaineis; atualizaPaineis = function () { const r = _pM.apply(this, arguments); try { instala(); } catch (e) { } return r; };
}
// bolsa com coisas dentro: não vende nem joga fora (esvazie antes); para o armazém ela vai inteira (armazem.js)
let BOLSA_INTEIRA = false;
if (typeof podeTirarBolsa === 'function') {
  const _ptb = podeTirarBolsa;
  podeTirarBolsa = function (id) {
    if (BOLSA_INTEIRA) return true;
    const s = G.save;
    if (ehBolsa(id)) { const bolsas = s.mochila.filter(e => e.id === id); if (bolsas.length && bolsas.every(b => b.u != null && s.mochila.some(x => x.c === b.u))) { log(`Tire as coisas de dentro da ${ITENS[id].nome} antes.`, 'l-dano'); som('erro'); return false; } }
    return _ptb.apply(this, arguments);
  };
}
if (typeof guardaDaMochila === 'function') {
  const _gm = guardaDaMochila;
  guardaDaMochila = function (i) { const s = G.save, e = s.mochila[i]; if (e && typeof bolsaComCoisas === 'function' && bolsaComCoisas(s.mochila, e)) { BOLSA_INTEIRA = true; try { return _gm.apply(this, arguments); } finally { BOLSA_INTEIRA = false; } } return _gm.apply(this, arguments); };
}
// saves antigos: arruma ao entrar (as bolsas antigas viram bolsas de verdade, com o que não coube dentro delas)
{ const _iniB = iniciarJogo; iniciarJogo = async function () { const r = await _iniB.apply(this, arguments); try { arrumaBolsas(G.save); G.uiSujo = true; } catch (e) { } return r; }; }
// peso na dica e na janela do item; bolsas dizem quantos espaços têm
if (typeof tipItem === 'function') {
  const _tipB = tipItem;
  tipItem = function (id) { const box = _tipB.apply(this, arguments); try { const it = ITENS[id]; if (box && it) box.append(el('small', { class: 'tip-peso' }, `⚖️ Peso ${pesoItem(id)}${ehBolsa(id) ? ` · 🎒 ${it.espacos} espaços` : ''}`)); } catch (e) { } return box; };
}
if (typeof modalItem === 'function') {
  const _modB = modalItem;
  modalItem = function (id) {
    const r = _modB.apply(this, arguments);
    try {
      const box = document.getElementById('modalConteudo'), it = ITENS[id], s = G.save; if (!box || !it) return r;
      box.append(el('p', { class: 'dica' }, `⚖️ Peso: ${pesoItem(id)} · sua carga: ${fmt(Math.round(pesoMochila()))}/${fmt(capPeso())}`));
      if (ehBolsa(id)) {
        const bag = s.mochila.find(e => e.id === id); const n = bag ? s.mochila.filter(e => e.c === bag.u).length : 0;
        box.append(el('p', { class: 'dica' }, `🎒 ${it.espacos} espaços${bag ? ` · ${n} itens dentro` : ''}. Clique na bolsa (na mochila) para abrir; arraste itens para cima dela para guardar dentro. Bolsas podem ficar dentro de outras bolsas.`));
        if (bag) box.append(el('div', { class: 'opcoes' },
          el('button', { class: 'btn', type: 'button', onclick: () => { fechaModal(); if (!(s.bolsasAbertas || []).includes(bag.u)) abreBolsa(bag.u); } }, '📂 Abrir'),
          el('button', { class: 'btn' + (s.bolsaLoot === bag.u ? ' amarelo' : ''), type: 'button', onclick: () => { marcaBolsaLoot(bag.u); fechaModal(); } }, s.bolsaLoot === bag.u ? '🎯 Deixar de ser a bolsa de loot' : '🎯 Usar como bolsa de loot')));
      }
    } catch (e) { }
    return r;
  };
}
// as bolsas antigas diziam "até 4 bolsas contam"
for (const it of Object.values(ITENS)) if (it.tipo === 'bolsa' && it.desc) it.desc = it.desc.replace(' Fica dentro da mochila (até 4 bolsas contam).', ' Abre como uma janela; pode ficar dentro de outras bolsas.');
{
  const st = document.createElement('style');
  st.textContent = `
  :is(#mochila, #bolsasAbertas) .mochila-org .carga { font-size: 12px; font-weight: 700; margin-left: 4px; }
  :is(#mochila, #bolsasAbertas) .mochila-org .carga.pesada { color: #d23a2a; }
  :is(#mochila, #bolsasAbertas) .slot.bolsa { box-shadow: inset 0 0 0 2px rgba(168,116,58,.55); }
  :is(#mochila, #bolsasAbertas) .slot.bolsa.aberta { box-shadow: inset 0 0 0 2px #ffd23f; background: #fff3c8; }
  :is(#mochila, #bolsasAbertas) .slot.bolsa.loot::after { content: '🎯'; position: absolute; left: 1px; top: -2px; font-size: 11px; }
  :is(#mochila, #bolsasAbertas) .bolsa-janela { margin-top: 8px; border: 2px solid #c9a46a; border-radius: 8px; padding: 4px; background: rgba(255,248,232,.65); }
  :is(#mochila, #bolsasAbertas) .bolsa-janela.loot { border-color: #e0b020; }
  :is(#mochila, #bolsasAbertas) .bolsa-tit { display: flex; align-items: center; gap: 5px; margin-bottom: 4px; font-size: 12px; }
  :is(#mochila, #bolsasAbertas) .bolsa-tit canvas, #mochila .bolsa-tit img { width: 20px; height: 20px; }
  :is(#mochila, #bolsasAbertas) .bolsa-tit b { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  :is(#mochila, #bolsasAbertas) .bolsa-tit .btn.mini { padding: 1px 6px; }
  body.movendo-item .mochila-grade { outline: 2px dashed #e0b020; outline-offset: 2px; border-radius: 6px; }
  body.movendo-item .slot.bolsa { box-shadow: inset 0 0 0 3px #e0b020; }
  .tip-peso { display: block; opacity: .8; margin-top: 2px; }
  .arm-slot.em-bolsa { opacity: .85; }
  .arm-slot { position: relative; }
  .arm-abre { position: absolute; right: 1px; bottom: 0; background: #fff3c8; border: 1px solid #c9a46a; border-radius: 4px; font-size: 11px; line-height: 13px; padding: 0 3px; cursor: pointer; }
  .arm-bolsa { margin-top: 8px; border-top: 2px dashed #c9a46a; padding-top: 4px; }
  .arm-bolsa h4 { margin: 2px 0 4px; font-size: 13px; }
  .bolsas-painel { padding: 6px; }
  .bolsas-tit { font-weight: 700; font-size: 13px; margin-bottom: 2px; }
  #bolsasAbertas .vazio { font-size: 12px; opacity: .75; margin: 4px 0; }
  #bolsasAbertas .bolsa-janela:first-child { margin-top: 4px; }`;
  document.head.append(st);
}
