/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ARMAZÉM (o "depot" do Tibia)
   - Um baú do armazém em cada lugar (Vila, Praia, Cidade, CT,
     Estádio e todas as cidades do mundo) e o Baú da sua casa.
   - É UM armazém só: o que você guarda num aparece em todos.
   - 500 espaços (v361; antes 150); itens iguais ficam empilhados num espaço só.
   - v361: dá para guardar BOLSAS CHEIAS (vão inteiras, com tudo dentro, e dão os espaços delas), como o depot do Tibia.
   Salvo em save.armazem = [{ id, q, r, u (bolsa), c (dentro da bolsa u) }].
   Carregar ANTES de casas.js.
   ============================================================ */
const ARMAZEM_MAX = 500, MOCHILA_MAX = 30;
const noTopoArm = a => a.filter(e => e.c == null).length; // os espaços contam só o que está solto no armazém
function armazemMax() { return ARMAZEM_MAX; } // v345: função (a versão Steam pode aumentar)
const ARMAZEM_LOCAIS = ['vila', 'praia', 'cidade', 'ct', 'estadio', 'cairo', 'doha', 'toquio', 'miami', 'buenos', 'rio', 'lisboa', 'paris', 'munique', 'milao', 'madri', 'londres', 'santos'];

function armazem() {
  const s = G.save; if (!Array.isArray(s.armazem)) s.armazem = [];
  if (Array.isArray(s.deposito) && s.deposito.length) { for (const d of s.deposito) guardaNoArmazem(d.id, d.q || 1, d.r || 0); s.deposito = []; } // depósito antigo da casa
  return s.armazem;
}
function guardaNoArmazem(id, q = 1, r = 0) { // true se coube
  const a = G.save.armazem || (G.save.armazem = []);
  // (bug 06/10/2026: a pilha SOLTA primeiro — somar numa pilha que está dentro de uma bolsa do armazém escondia o prêmio)
  if (!r && empilha(id)) { const ex = a.find(e => e.id === id && !e.r && e.c == null) || a.find(e => e.id === id && !e.r); if (ex) { ex.q += q; return true; } }
  if (noTopoArm(a) >= armazemMax()) return false;
  if (!r && empilha(id)) a.push({ id, q }); else for (let i = 0; i < q; i++) a.push(r ? { id, q: 1, r } : { id, q: 1 });
  return true;
}
function juntaPilhas(lista, max = Infinity) { // v326 (v396: na mochila, até PILHA_MAX por espaço e só na mesma bolsa)
  if (!Array.isArray(lista)) return;
  for (let j = lista.length - 1; j >= 0; j--) {
    const e = lista[j]; if (!e || e.r || !ITENS[e.id] || !empilha(e.id)) continue;
    const k = lista.findIndex(x => x !== e && x.id === e.id && !x.r && x.q < max && (max === Infinity || (x.c ?? null) === (e.c ?? null)));
    if (k >= 0 && k < j) { const p = Math.min(e.q, max - lista[k].q); lista[k].q += p; e.q -= p; if (e.q <= 0) lista.splice(j, 1); }
  }
}
{ const _iniPilha = iniciarJogo; iniciarJogo = async function () { const r = await _iniPilha.apply(this, arguments); try { juntaPilhas(G.save.mochila, typeof PILHA_MAX !== 'undefined' ? PILHA_MAX : Infinity); juntaPilhas(G.save.armazem); G.uiSujo = true; } catch (e) { } return r; }; }
function cabeNaMochila(id, r) { const s = G.save; return s.mochila.length < capMochila() || (!r && empilha(id) && s.mochila.some(i => i.id === id && !i.r && i.q < PILHA_MAX)); }
// v361: uma bolsa e tudo o que está dentro dela (e dentro das bolsas de dentro): índices na lista
function subarvoreBolsa(lista, i) {
  const out = [i], raiz = lista[i]; if (!raiz || raiz.u == null) return out;
  const fila = [raiz.u]; while (fila.length) { const u = fila.shift(); lista.forEach((e, k) => { if (e.c === u && !out.includes(k)) { out.push(k); if (e.u != null) fila.push(e.u); } }); }
  return out;
}
const bolsaComCoisas = (lista, e) => !!(e && ehBolsa(e.id) && e.u != null && lista.some(x => x.c === e.u));
// tira a subárvore de uma lista e devolve os itens (a bolsa primeiro)
function arrancaSubarvore(lista, i) { const ks = subarvoreBolsa(lista, i); const itens = ks.map(k => lista[k]); ks.slice().sort((x, y) => y - x).forEach(k => lista.splice(k, 1)); return itens; }
function guardaDaMochila(i) {
  const s = G.save; const e = s.mochila[i]; if (!e) return false;
  if (bolsaComCoisas(s.mochila, e)) { // bolsa cheia vai INTEIRA (ocupa 1 espaço do armazém)
    const a = armazem(); if (noTopoArm(a) >= armazemMax()) { log('O armazém está cheio!', 'l-dano'); som('erro'); return false; }
    const itens = arrancaSubarvore(s.mochila, i); delete itens[0].c; a.push(...itens);
    if (s.bolsasAbertas) s.bolsasAbertas = s.bolsasAbertas.filter(u => u !== e.u);
    G.uiSujo = true; return true;
  }
  if (!guardaNoArmazem(e.id, e.q, e.r || 0)) { log('O armazém está cheio!', 'l-dano'); som('erro'); return false; }
  s.mochila.splice(i, 1); G.uiSujo = true; return true;
}
function retiraDoArmazem(j, tudo = true) {
  const s = G.save, a = armazem(); const e = a[j]; if (!e) return false;
  if (bolsaComCoisas(a, e)) { // bolsa cheia volta INTEIRA
    const ks = subarvoreBolsa(a, j), peso = ks.reduce((t, k) => t + pesoItem(a[k].id) * (a[k].q || 1), 0);
    if (s.mochila.length >= capMochila()) { log('Sua mochila está cheia!', 'l-dano'); som('erro'); return false; }
    if (pesoMochila(s) + peso > capPeso(s)) { avisaPeso(); som('erro'); return false; }
    const itens = arrancaSubarvore(a, j); const bolsa = itens[0]; delete bolsa.c; poeNaBolsa(bolsa, s); s.mochila.push(...itens);
    G.uiSujo = true; return true;
  }
  if (!cabeNaMochila(e.id, e.r)) { log('Sua mochila está cheia!', 'l-dano'); som('erro'); return false; }
  const q = tudo ? e.q : 1;
  if (pesoMochila(s) + pesoItem(e.id) * q > capPeso(s)) { avisaPeso(); som('erro'); return false; }
  if (!e.r && empilha(e.id)) { const ex = s.mochila.find(i => i.id === e.id && !i.r); if (ex) ex.q += q; else s.mochila.push(poeNaBolsa({ id: e.id, q }, s)); }
  else s.mochila.push(poeNaBolsa(e.r ? { id: e.id, q: 1, r: e.r } : { id: e.id, q: 1 }, s));
  e.q -= q; if (e.q <= 0) a.splice(j, 1);
  G.uiSujo = true; return true;
}

/* ---------- janela do armazém ---------- */
const ARM_ABERTAS = new Set(); // bolsas do armazém abertas na janela
function slotArm(e, onclick, dica) {
  const b = el('button', { class: 'slot arm-slot', type: 'button' });
  b.append(iconeClone(iconeItem(e.id)));
  if (e.q > 1) b.append(el('span', { class: 'qtd' }, fmt(e.q)));
  if (e.r) b.append(el('span', { class: 'ref' }, '+' + e.r));
  if (typeof marcaRaridade === 'function') marcaRaridade(b, e.id);
  if (typeof comTip === 'function' && typeof tipItem === 'function') comTip(b, () => tipItem(e.id, e.r || 0, dica));
  b.onclick = onclick; return b;
}
function modalArmazem(filtro) {
  const s = G.save, a = armazem(); filtro = filtro || '';
  const passa = e => !filtro || ITENS[e.id].nome.toLowerCase().includes(filtro.toLowerCase());
  const gMoch = el('div', { class: 'arm-grade' }), gArm = el('div', { class: 'arm-grade' });
  const dentroDe = (lista, e) => e.u != null ? lista.filter(x => x.c === e.u).length : 0;
  s.mochila.forEach((e, i) => {
    if (!ITENS[e.id] || fixoNaMochila(e.id)) return; const n = dentroDe(s.mochila, e);
    const b = slotArm(e, () => { if (guardaDaMochila(i)) { som('equip'); salvar(); modalArmazem(filtro); } }, n ? `Clique para GUARDAR a bolsa INTEIRA (${n} itens dentro)` : 'Clique para GUARDAR no armazém');
    if (e.c != null) b.classList.add('em-bolsa'); if (n) b.append(el('span', { class: 'ref' }, '📂' + n)); gMoch.append(b);
  });
  // armazém: com busca, mostra tudo o que combina (até dentro das bolsas); sem busca, o que está solto + as bolsas abertas (▸)
  const abreArm = u => { ARM_ABERTAS.has(u) ? ARM_ABERTAS.delete(u) : ARM_ABERTAS.add(u); modalArmazem(filtro); };
  const slotA = (e, j) => {
    const n = dentroDe(a, e);
    const b = slotArm(e, () => { if (retiraDoArmazem(j)) { som('equip'); salvar(); modalArmazem(filtro); } }, n ? `Clique para PEGAR a bolsa INTEIRA (${n} itens dentro) · ▸ abre a bolsa` : 'Clique para PEGAR de volta');
    if (n) { b.append(el('span', { class: 'ref' }, '📂' + n)); b.append(el('span', { class: 'arm-abre', title: 'Abrir a bolsa (ver o que tem dentro)', onclick: ev => { ev.stopPropagation(); abreArm(e.u); } }, ARM_ABERTAS.has(e.u) ? '▾' : '▸')); }
    return b;
  };
  a.forEach((e, j) => { if (ITENS[e.id] && (filtro ? passa(e) : e.c == null)) gArm.append(slotA(e, j)); });
  const extras = [];
  if (!filtro) for (const u of [...ARM_ABERTAS]) {
    const bag = a.find(e => e.u === u); if (!bag) { ARM_ABERTAS.delete(u); continue; }
    const g = el('div', { class: 'arm-grade' }); a.forEach((e, j) => { if (e.c === u && ITENS[e.id]) g.append(slotA(e, j)); });
    extras.push(el('div', { class: 'arm-bolsa' }, el('h4', {}, `📂 ${ITENS[bag.id].nome} (${dentroDe(a, bag)}/${ITENS[bag.id].espacos})`), g));
  }
  if (!gMoch.children.length) gMoch.append(el('p', { class: 'vazio' }, 'Nada para guardar.'));
  if (!gArm.children.length) gArm.append(el('p', { class: 'vazio' }, filtro ? 'Nada com esse nome.' : 'O armazém está vazio.'));
  const guardaTipo = (teste, nome) => () => { let n = 0; for (let i = s.mochila.length - 1; i >= 0; i--) { const it = ITENS[s.mochila[i].id]; if (it && teste(it, s.mochila[i]) && guardaDaMochila(i)) n++; } log(n ? `Você guardou ${n} ${nome} no armazém.` : `Não tinha ${nome} para guardar.`, 'l-info'); if (n) { som('equip'); salvar(); } modalArmazem(filtro); };
  const busca = el('input', { class: 'arm-busca', placeholder: '🔎 Procurar no armazém...', value: filtro });
  busca.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') modalArmazem(busca.value.trim()); });
  abreModal.largo = true;
  abreModal(el('h2', {}, '📦 Armazém'),
    el('p', { class: 'arm-dica' }, `É um armazém só: o que você guarda aqui aparece em qualquer baú de armazém (e no baú da sua casa). Clique num item para passar de um lado para o outro. Bolsas cheias vão e voltam inteiras (▸ abre a bolsa). Espaços: ${noTopoArm(a)}/${armazemMax()}.`),
    el('div', { class: 'opcoes arm-atalhos' },
      el('button', { class: 'btn mini', type: 'button', onclick: guardaTipo(it => it.tipo === 'loot', 'materiais/loot') }, 'Guardar materiais e loot'),
      el('button', { class: 'btn mini', type: 'button', onclick: guardaTipo(it => it.tipo === 'equip', 'equipamentos') }, 'Guardar equipamentos'),
      el('button', { class: 'btn mini', type: 'button', onclick: guardaTipo(it => it.tipo === 'movel', 'móveis') }, 'Guardar móveis')),
    el('div', { class: 'arm-cols' },
      el('div', {}, el('h3', {}, `🎒 Mochila (${s.mochila.length}/${capMochila()}) · ⚖️ ${fmt(Math.round(pesoMochila()))}/${fmt(capPeso())}`), gMoch),
      el('div', {}, el('h3', {}, `📦 Armazém (${noTopoArm(a)}/${armazemMax()})`), busca, gArm, ...extras)));
}

/* ---------- baús do armazém nos mapas ---------- */
function poeBauArmazem(m) {
  const livre = (x, y) => x > 1 && y > 1 && x < m.w - 2 && y < m.h - 2 && !m.obj[y * m.w + x] && CH_ANDA(m.chao[y * m.w + x]) && m.chao[y * m.w + x] !== CH.AGUA
    && !m.saidas.some(s => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1) && !m.npcs.some(n => Math.abs(n.x - x) <= 1 && Math.abs(n.y - y) <= 1)
    && !m.pontos.some(p => Math.abs(p.x - x) <= 2 && Math.abs(p.y - y) <= 2) && !m.campos.some(c => x >= c.x - 1 && x <= c.x + c.w && y >= c.y - 1 && y <= c.y + c.h);
  const c = m.inicio || { x: m.w >> 1, y: m.h >> 1 };
  for (let r = 2; r < 14; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = c.x + dx, y = c.y + dy;
    if (livre(x, y) && livre(x, y + 1)) { m.obj[y * m.w + x] = { t: 'bau', v: 1 }; m.pontos.push({ x, y, tipo: 'armazem' }); return; }
  }
}
for (const mapa of ARMAZEM_LOCAIS) {
  const base = MAPAS_DEF[mapa]; if (!base) continue;
  MAPAS_DEF[mapa] = function () { const m = base(); try { poeBauArmazem(m); } catch (e) { } return m; };
}
const _usarPontoArm = usarPonto;
usarPonto = function (pt) { if (pt.tipo === 'armazem') return modalArmazem(); return _usarPontoArm(pt); };
const _interacaoPertoArm = interacaoPerto;
interacaoPerto = function () { const r = _interacaoPertoArm(); if (r && r.tipo === 'ponto' && r.pt.tipo === 'armazem') r.txt = 'Abrir o armazém'; return r; };
if (typeof OBJ_MINI !== 'undefined') OBJ_MINI.bau = OBJ_MINI.bau || '#c8903a';

(function () {
  const st = document.createElement('style');
  st.textContent = `
  .arm-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .arm-cols h3 { margin: 4px 0; font-size: 15px; color: var(--madeira2); }
  .arm-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(48px, 1fr)); gap: 4px; max-height: 300px; overflow-y: auto; padding: 2px; }
  .arm-grade .slot { width: 100%; cursor: pointer; }
  .arm-dica { font-size: 13px; margin: 2px 0 6px; }
  .arm-atalhos { justify-content: flex-start; margin-bottom: 6px; }
  .arm-busca { width: 100%; box-sizing: border-box; margin-bottom: 4px; padding: 5px 8px; border-radius: 8px; border: 2px solid var(--madeira3); font: 700 13px Nunito, sans-serif; background: #fffaf0; }
  @media (max-width: 640px) { .arm-cols { grid-template-columns: 1fr; } }
  `;
  document.head.append(st);
})();
