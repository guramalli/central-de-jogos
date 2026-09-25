/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ARMAZÉM (o "depot" do Tibia)
   - Um baú do armazém em cada lugar (Vila, Praia, Cidade, CT,
     Estádio e todas as cidades do mundo) e o Baú da sua casa.
   - É UM armazém só: o que você guarda num aparece em todos.
   - 150 espaços; itens iguais ficam empilhados num espaço só.
   Salvo em save.armazem = [{ id, q, r }].
   Carregar ANTES de casas.js.
   ============================================================ */
const ARMAZEM_MAX = 150, MOCHILA_MAX = 30;
const ARMAZEM_LOCAIS = ['vila', 'praia', 'cidade', 'ct', 'estadio', 'cairo', 'toquio', 'doha', 'miami', 'lisboa', 'madri', 'milao', 'munique', 'londres'];

function armazem() {
  const s = G.save; if (!Array.isArray(s.armazem)) s.armazem = [];
  if (Array.isArray(s.deposito) && s.deposito.length) { for (const d of s.deposito) guardaNoArmazem(d.id, d.q || 1, d.r || 0); s.deposito = []; } // depósito antigo da casa
  return s.armazem;
}
function guardaNoArmazem(id, q = 1, r = 0) { // true se coube
  const a = G.save.armazem || (G.save.armazem = []);
  if (!r && empilha(id)) { const ex = a.find(e => e.id === id && !e.r); if (ex) { ex.q += q; return true; } }
  if (a.length >= ARMAZEM_MAX) return false;
  if (!r && empilha(id)) a.push({ id, q }); else for (let i = 0; i < q; i++) a.push(r ? { id, q: 1, r } : { id, q: 1 });
  return true;
}
function cabeNaMochila(id, r) { const s = G.save; return s.mochila.length < MOCHILA_MAX || (!r && empilha(id) && s.mochila.some(i => i.id === id && !i.r)); }
function guardaDaMochila(i) {
  const s = G.save; const e = s.mochila[i]; if (!e) return false;
  if (!guardaNoArmazem(e.id, e.q, e.r || 0)) { log('O armazém está cheio!', 'l-dano'); som('erro'); return false; }
  s.mochila.splice(i, 1); G.uiSujo = true; return true;
}
function retiraDoArmazem(j, tudo = true) {
  const s = G.save, a = armazem(); const e = a[j]; if (!e) return false;
  if (!cabeNaMochila(e.id, e.r)) { log('Sua mochila está cheia!', 'l-dano'); som('erro'); return false; }
  const q = tudo ? e.q : 1;
  if (!e.r && empilha(e.id)) { const ex = s.mochila.find(i => i.id === e.id && !i.r); if (ex) ex.q += q; else s.mochila.push({ id: e.id, q }); }
  else s.mochila.push(e.r ? { id: e.id, q: 1, r: e.r } : { id: e.id, q: 1 });
  e.q -= q; if (e.q <= 0) a.splice(j, 1);
  G.uiSujo = true; return true;
}

/* ---------- janela do armazém ---------- */
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
  s.mochila.forEach((e, i) => { if (ITENS[e.id] && ITENS[e.id].tipo !== 'chave') gMoch.append(slotArm(e, () => { if (guardaDaMochila(i)) { som('equip'); salvar(); modalArmazem(filtro); } }, 'Clique para GUARDAR no armazém')); });
  a.forEach((e, j) => { if (ITENS[e.id] && passa(e)) gArm.append(slotArm(e, () => { if (retiraDoArmazem(j)) { som('equip'); salvar(); modalArmazem(filtro); } }, 'Clique para PEGAR de volta')); });
  if (!gMoch.children.length) gMoch.append(el('p', { class: 'vazio' }, 'Nada para guardar.'));
  if (!gArm.children.length) gArm.append(el('p', { class: 'vazio' }, filtro ? 'Nada com esse nome.' : 'O armazém está vazio.'));
  const guardaTipo = (teste, nome) => () => { let n = 0; for (let i = s.mochila.length - 1; i >= 0; i--) { const it = ITENS[s.mochila[i].id]; if (it && teste(it, s.mochila[i]) && guardaDaMochila(i)) n++; } log(n ? `Você guardou ${n} ${nome} no armazém.` : `Não tinha ${nome} para guardar.`, 'l-info'); if (n) { som('equip'); salvar(); } modalArmazem(filtro); };
  const busca = el('input', { class: 'arm-busca', placeholder: '🔎 Procurar no armazém...', value: filtro });
  busca.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') modalArmazem(busca.value.trim()); });
  abreModal.largo = true;
  abreModal(el('h2', {}, '📦 Armazém'),
    el('p', { class: 'arm-dica' }, `É um armazém só: o que você guarda aqui aparece em qualquer baú de armazém (e no baú da sua casa). Clique num item para passar de um lado para o outro. Espaços: ${a.length}/${ARMAZEM_MAX}.`),
    el('div', { class: 'opcoes arm-atalhos' },
      el('button', { class: 'btn mini', type: 'button', onclick: guardaTipo(it => it.tipo === 'loot', 'materiais/loot') }, 'Guardar materiais e loot'),
      el('button', { class: 'btn mini', type: 'button', onclick: guardaTipo(it => it.tipo === 'equip', 'equipamentos') }, 'Guardar equipamentos'),
      el('button', { class: 'btn mini', type: 'button', onclick: guardaTipo(it => it.tipo === 'movel', 'móveis') }, 'Guardar móveis')),
    el('div', { class: 'arm-cols' },
      el('div', {}, el('h3', {}, `🎒 Mochila (${s.mochila.length}/${MOCHILA_MAX})`), gMoch),
      el('div', {}, el('h3', {}, `📦 Armazém (${a.length}/${ARMAZEM_MAX})`), busca, gArm)));
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
