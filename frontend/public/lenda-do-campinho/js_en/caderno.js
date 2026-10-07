/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📒 CADERNO DO CRAQUE (v408, Raio-X I6 — aprovado pelo dono). Eram 7 "cadernos" de coleção separados (álbum de
   figurinhas, conquistas, Museu, Bestiário, Wiki, missões de coleção e Livro das Lendas), cada um com a sua entrada no
   ☰ Menu. Agora é UM caderno com abas: Figurinhas · Conquistas · Bestiário · Museu · Coleções · Lendas · Passaporte.
   - Cada aba é a MESMA janela de antes (modalAlbum, modalConquistas, modalBestiario, modalMuseu, modalLendas e
     abrePassaporte, se existir): aqui só se junta a navegação. O que muda é o topo da janela: a barra
     "Seu caderno: 37% completo", as 3 próximas coisas fáceis de completar e as abas.
   - Como funciona: o abreModal ganha um embrulho; quando a janela que vai abrir é de uma aba do caderno (chamada pela
     aba, título conhecido, ou o mesmo emoji do título enquanto o caderno já está aberto), o topo do caderno entra em
     cima dela. Por isso os atalhos antigos (tecla B, tecla N, Ficha → Conquistas, Professor Coral → Museu...) abrem o
     Caderno já na aba certa.
   - ☰ Menu (e menu do celular): as entradas separadas somem e fica só "📒 Caderno do Craque".
   - Personagem NOVO (save.rvNovato, revela_nivel.js da v407): o Caderno aparece desde o nível 1, só com as abas já
     liberadas (Museu no 20; Lendas e Coleções no nível da primeira missão delas). Personagens antigos veem tudo.
   - Passaporte (outra frente da v408): a aba aparece quando existir abrePassaporte(); se existir também
     passaporteProgresso() → { feitos, total }, ele entra na % geral; passaporteProximas() → [{ txt, peso }] entra no "Quase lá".
   Prefixo: cdn. Carregar NO FIM (depois de ui.js, conquistas.js, museu.js, bestiario.js, wiki_extra.js, lendas.js,
   missoes_colecao.js, opcoes.js e revela_nivel.js).
   ============================================================ */
const CDN_NIVEL_MUSEU = 20; // novato: a aba Museu aparece neste nível (colecionáveis são raríssimos)
let CDN_ABA = null;      // aba sendo aberta agora (chamada direta)
let CDN_ESPERA = null;   // { aba, ate }: janela que abre depois (função assíncrona, ex.: Passaporte)
let CDN_ATUAL = null;    // aba que está na tela
let CDN_H2 = '';         // começo do título da janela da aba atual (o emoji): as janelas que se redesenham continuam no caderno
let CDN_INJ = 0;         // quantas vezes o topo do caderno entrou (para saber se a aba desenhou na hora)
let CDN_ULT = null;      // última aba vista (o botão do Menu volta nela)

const cdnColMissoes = () => (typeof MISSOES !== 'undefined' ? MISSOES.filter(q => /^col_/.test(q.id)) : []);
const cdnNivelMin = l => (l.length ? Math.min(...l) : 1);
// [chave, rótulo, ícone, abre(), título conhecido (rx), existe(), nível p/ novato (fn), progresso() -> { f, t, txt } | null]
const CDN_ABAS = [
  ['figurinhas', 'Stickers', '🎴', () => modalAlbum(), /^Álbum de figurinhas/, () => typeof modalAlbum === 'function', () => 1,
    s => { const t = FIGURINHAS.length, n = FIGURINHAS.filter(f => (s.figs || {})[f.id]).length; return { f: n / t, t: `${n}/${t}` }; }],
  ['conquistas', 'Achievements', '🏅', () => modalConquistas(), /^🏅 Conquistas/, () => typeof modalConquistas === 'function', () => 1,
    s => { const n = conquistasDe(fichaDoSaveLocal(s)).length, t = CONQUISTAS.length || 1; return { f: n / t, t: `${n}/${t}` }; }],
  ['bestiario', 'Bestiary', '📚', () => { if (typeof BST_F !== 'undefined') BST_F.sel = null; modalBestiario(); }, /^📚 Bestiário/, () => typeof modalBestiario === 'function', () => 1,
    () => { const l = BESTIARIO.bstLista(); let et = 0, conh = 0; for (const k of l) { const e = bstEtapa(k); et += e; if (e) conh++; } return { f: l.length ? et / (3 * l.length) : 0, t: `${conh}/${l.length}` }; }],
  ['museu', 'Museum', '🏛️', () => modalMuseu(), /^🏛️ Museu dos Colecionáveis/, () => typeof modalMuseu === 'function' && typeof museuDados === 'function', () => CDN_NIVEL_MUSEU,
    () => { const d = museuDados(); return { f: d.total ? d.doados / d.total : 0, t: `${d.doados}/${d.total}` }; }],
  ['colecoes', 'Collections', '🧺', () => cdnModalColecoes(), /^🧺 Missões de coleção/, () => cdnColMissoes().length > 0, () => cdnNivelMin(cdnColMissoes().map(q => q.lvl || 1)),
    () => { const l = cdnColMissoes(), n = l.filter(q => statusMissao(q) === 'feita').length; return { f: l.length ? n / l.length : 0, t: `${n}/${l.length}` }; }],
  ['lendas', 'Legends', '📜', () => modalLendas(), /^📜 O Livro das Lendas/, () => typeof modalLendas === 'function' && typeof QLENDAS !== 'undefined', () => cdnNivelMin(QLENDAS.map(L => L.lvl)),
    () => { const n = QLENDAS.filter(L => lendaDados(L.id).aberto).length; return { f: n / QLENDAS.length, t: `${n}/${QLENDAS.length}` }; }],
  ['passaporte', 'Passport', '🛂', () => abrePassaporte(), /^🛂 Passaporte do Craque/, () => typeof abrePassaporte === 'function', () => 1,
    () => { if (typeof passaporteProgresso !== 'function') return null; const p = passaporteProgresso() || {}; return p.total ? { f: Math.min(1, (p.feitos || 0) / p.total), t: `${p.feitos || 0}/${p.total}` } : null; }],
];
const CDN_POR = Object.fromEntries(CDN_ABAS.map(a => [a[0], a]));

// a aba aparece para este personagem? (personagem antigo: todas as que existem)
function cdnLiberada(k, s = G.save) {
  const a = CDN_POR[k]; if (!a || !s) return false;
  try { if (!a[5]()) return false; } catch (e) { return false; }
  if (!s.rvNovato) return true;
  let n = 1; try { n = a[6]() || 1; } catch (e) { }
  return (s.nivel || 1) >= n;
}
function cdnProgresso(k, s = G.save) { try { return CDN_POR[k][7](s); } catch (e) { return null; } }
// a % geral: a média das abas liberadas (cada aba vale o mesmo)
function cdnGeral(s = G.save, P = null) {
  const ps = CDN_ABAS.filter(a => cdnLiberada(a[0], s)).map(a => (P ? P[a[0]] : cdnProgresso(a[0], s))).filter(Boolean);
  if (!ps.length) return 0;
  const m = ps.reduce((x, p) => x + Math.max(0, Math.min(1, p.f || 0)), 0) / ps.length;
  return m >= 1 ? 100 : Math.floor(m * 100);
}

/* ---------- as 3 próximas coisas fáceis de completar ---------- */
function cdnProximas(s = G.save) {
  const C = []; // { aba, txt, peso (menor = mais fácil), vai() }
  const lib = k => cdnLiberada(k, s);
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
  try { // figurinhas
    if (lib('figurinhas')) {
      const t = FIGURINHAS.length, falta = FIGURINHAS.filter(f => !(s.figs || {})[f.id]).length;
      if (!falta && !s.flags.album_premio) C.push({ aba: 'figurinhas', txt: 'Album complete: claim your prize!', peso: 0 });
      else if (falta) C.push({ aba: 'figurinhas', txt: `${plural(falta, 'sticker', 'stickers')} left to complete the album`, peso: falta / t + 0.15 });
    }
  } catch (e) { }
  try { // bestiário: a criatura (não chefão) mais perto da próxima etapa
    if (lib('bestiario')) {
      let melhor = null;
      for (const k of BESTIARIO.bstLista()) {
        const d = MONSTROS[k]; if (!d || d.chefe) continue;
        const e = bstEtapa(k); if (e < 1 || e >= 3) continue;
        const et = bstEtapas(d), n = bstKills(k), rem = et[e] - n, p = rem / (et[e] - et[e - 1]);
        if (rem > 0 && (!melhor || p < melhor.p || (p === melhor.p && rem < melhor.rem))) melhor = { k, e, rem, p, nome: d.nome };
      }
      if (melhor) C.push({ aba: 'bestiario', peso: melhor.p * 0.9, vai: () => { BST_F.sel = melhor.k; modalBestiario(); },
        txt: `${plural(melhor.rem, 'win', 'wins')} left against ${melhor.nome} to ${melhor.e === 1 ? 'open its entry' : 'complete its entry'} in the Bestiary` });
    }
  } catch (e) { }
  try { // museu
    if (lib('museu') && window.MU_COLECOES) {
      const m = (s.museu && s.museu.doados) || {};
      const noArm = id => (s.armazem || []).some(x => x.id === id && x.c == null);
      const temPraDoar = window.MU_COLECOES.flatMap(c => c[2]).find(r => !m[r] && (contaItem(`lr_${r}_4`) > 0 || noArm(`lr_${r}_4`)));
      if (temPraDoar) C.push({ aba: 'museu', txt: 'you have a new collectible: donate it to the Museum!', peso: 0 });
      else for (const [, nome, regs] of window.MU_COLECOES) {
        const falta = regs.filter(r => !m[r]).length;
        if (falta > 0 && falta <= 2 && regs.length > falta) C.push({ aba: 'museu', txt: `${falta === 1 ? '1 collectible left' : `${falta} collectibles left`} for the ${nome} collection at the Museum`, peso: 0.5 + falta / regs.length });
      }
    }
  } catch (e) { }
  try { // missões de coleção
    if (lib('colecoes')) for (const q of cdnColMissoes()) {
      const st = statusMissao(q); if (st !== 'ativa' && st !== 'pronta') continue;
      const [id, n] = (q.req.itens || [])[0] || []; if (!id) continue;
      const tem = Math.min(n, contaItem(id)), nomeNpc = (NPCS[q.npc] || {}).nome || '';
      if (st === 'pronta') C.push({ aba: 'colecoes', txt: `mission ready: take ${n}× ${ITENS[id].nome} to ${nomeNpc.split(',')[0]}`, peso: 0 });
      else C.push({ aba: 'colecoes', txt: `${n - tem}× ${ITENS[id].nome} left for the mission "${q.titulo}"`, peso: (n - tem) / n });
    }
  } catch (e) { }
  try { // lendas
    if (lib('lendas')) for (const L of QLENDAS) {
      const ld = lendaDados(L.id); if (ld.aberto) continue;
      if (ld.guardiao) C.push({ aba: 'lendas', txt: `the legendary chest "${L.nome}" is unlocked!`, peso: 0 });
      else if ((s.nivel || 1) >= L.lvl) { C.push({ aba: 'lendas', txt: `a legend for you: ${L.nome}`, peso: 0.6 }); break; }
    }
  } catch (e) { }
  try { // conquistas: a próxima da lista (não dá para medir o quanto falta, então vem por último)
    if (lib('conquistas')) {
      const tem = new Set(conquistasDe(fichaDoSaveLocal(s)).map(c => c.id)), c = CONQUISTAS.find(x => !tem.has(x.id) && x.dica);
      if (c) C.push({ aba: 'conquistas', txt: `${c.ic} ${c.nome}: ${String(c.dica).replace(/\.$/, '')}`, peso: 0.95 });
    }
  } catch (e) { }
  try { // passaporte (se a frente do Passaporte oferecer)
    if (lib('passaporte') && typeof passaporteProximas === 'function') for (const p of (passaporteProximas() || []).slice(0, 2)) if (p && p.txt) C.push({ aba: 'passaporte', txt: String(p.txt), peso: p.peso != null ? p.peso : 0.5 });
  } catch (e) { }
  C.sort((a, b) => a.peso - b.peso);
  // uma por aba primeiro (variedade); depois completa com as outras
  const out = [], abas = new Set();
  for (const c of C) if (out.length < 3 && !abas.has(c.aba)) { out.push(c); abas.add(c.aba); }
  for (const c of C) if (out.length < 3 && !out.includes(c)) out.push(c);
  return out;
}

/* ---------- abrir ---------- */
function cdnChama(k, fn) {
  const ant = CDN_ABA; CDN_ABA = k; const inj0 = CDN_INJ; let r;
  try { r = fn(); } finally { CDN_ABA = ant; }
  if (CDN_INJ === inj0 && r && typeof r.then === 'function') { // abre depois (assíncrona): a próxima janela, em até 4 s, é desta aba
    CDN_ESPERA = { aba: k, ate: performance.now() + 4000 };
    r.then(() => setTimeout(() => { if (CDN_ESPERA && CDN_ESPERA.aba === k) CDN_ESPERA = null; }, 100), () => { CDN_ESPERA = null; });
  }
  return r;
}
// abre o Caderno numa aba (sem aba: a última vista, ou a primeira liberada)
function abreCaderno(aba) {
  if (!G.save) return;
  let k = aba && cdnLiberada(aba) ? aba : (CDN_ULT && cdnLiberada(CDN_ULT) ? CDN_ULT : null);
  if (!k) k = (CDN_ABAS.find(a => cdnLiberada(a[0])) || [])[0];
  if (!k) return;
  if (k === 'passaporte') cdnEmbrulhaPassaporte();
  return cdnChama(k, CDN_POR[k][3]);
}
window.abreCaderno = abreCaderno;

// cada janela antiga, chamada de onde for (tecla, botão, NPC), abre dentro do Caderno na aba dela
function cdnEmbrulha(nome, k) {
  const f = window[nome]; if (typeof f !== 'function' || f._cdn) return;
  const w = function () { const a = arguments, t = this; return cdnChama(k, () => f.apply(t, a)); };
  w._cdn = true; window[nome] = w;
}
function cdnEmbrulhaPassaporte() { cdnEmbrulha('abrePassaporte', 'passaporte'); }
cdnEmbrulha('modalAlbum', 'figurinhas'); cdnEmbrulha('modalConquistas', 'conquistas'); cdnEmbrulha('modalBestiario', 'bestiario');
cdnEmbrulha('modalMuseu', 'museu'); cdnEmbrulha('modalLendas', 'lendas');

/* ---------- 🧺 a aba Coleções (as missões de coleção, v287) ---------- */
function cdnModalColecoes() {
  const s = G.save; if (!s) return;
  const l = cdnColMissoes(), feitas = l.filter(q => statusMissao(q) === 'feita').length;
  const porNpc = new Map();
  for (const q of l) { if (!/_1$/.test(q.id)) continue; const arr = porNpc.get(q.npc) || []; arr.push(q); porNpc.set(q.npc, arr); }
  const rot = (q, n) => {
    const st = statusMissao(q), [id] = (q.req.itens || [])[0] || [], tem = id ? Math.min(n, contaItem(id)) : 0, quem = ((NPCS[q.npc] || {}).nome || '').split(',')[0];
    return { st, txt: { feita: '✅ done', pronta: `🎁 ready! take it to ${quem}`, ativa: `⏳ ${tem}/${n}`, disponivel: `🆕 ask ${quem}`, nivel: `🔒 level ${q.lvl}`, bloqueada: '⏭️ after the collection' }[st] || '' };
  };
  const blocos = [...porNpc.entries()].map(([npc, qs]) => {
    let fz = 0, tt = 0;
    const linhas = qs.map(q1 => {
      const q2 = MISSOES.find(q => q.id === q1.id.replace(/_1$/, '_2')), [id, n1] = q1.req.itens[0], n2 = q2 ? q2.req.itens[0][1] : 0;
      const r1 = rot(q1, n1), r2 = q2 ? rot(q2, n2) : null; tt += q2 ? 2 : 1; fz += (r1.st === 'feita') + (r2 && r2.st === 'feita' ? 1 : 0);
      const ic = iconeClone(iconeItem(id)); ic.className = 'cdn-col-ic';
      const onde = (String(q1.texto).match(/Quem deixa cair:[^.]*\./) || [''])[0];
      return el('div', { class: 'cdn-col-item' + (r1.st === 'feita' && (!r2 || r2.st === 'feita') ? ' ok' : '') }, ic,
        el('div', { class: 'cdn-col-txt' }, el('b', {}, ITENS[id] ? ITENS[id].nome : id), onde ? el('small', {}, onde) : '',
          el('div', { class: 'cdn-col-st' }, el('span', { class: 'st-' + r1.st }, `Collection ${n1}×: ${r1.txt}`), r2 ? el('span', { class: 'st-' + r2.st }, `Big order ${n2}×: ${r2.txt}`) : '')));
    });
    const nomeNpc = ((NPCS[npc] || {}).nome || npc);
    return el('details', { class: 'mu-col', open: fz < tt && qs.some(q => statusMissao(q) !== 'nivel') ? 'open' : null },
      el('summary', {}, `${fz >= tt ? '🏆' : '🧺'} ${nomeNpc} (${fz}/${tt})`), el('div', { class: 'cdn-col-grade' }, ...linhas));
  });
  abreModal.largo = true;
  abreModal(el('h2', {}, `🧺 Collection missions (${feitas}/${l.length})`),
    el('p', { class: 'dica' }, 'Collectors want the items that opponents drop: Professor Coral (Atlantis), the coaches on the planets and the leaders of some neighborhoods. First the Collection (10), then the Big order (25), with a bigger prize.'),
    ...blocos, el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Close')));
}

/* ---------- o topo do Caderno (entra em cima da janela da aba) ---------- */
function cdnQualAba(nos) {
  if (!G.save || !G.rodando) return null;
  if (typeof OPC_CAP !== 'undefined' && OPC_CAP && document.body.contains(OPC_CAP)) return null; // (janela embutida nas Configurações)
  const h2 = nos.flat(2).find(n => n && n.tagName === 'H2'), txt = h2 ? h2.textContent.trim() : '';
  if (CDN_ABA) return CDN_ABA;
  if (CDN_ESPERA) { const e = CDN_ESPERA; CDN_ESPERA = null; if (performance.now() < e.ate) return e.aba; }
  for (const a of CDN_ABAS) if (a[4] && a[4].test(txt)) return a[0];
  const M = document.getElementById('modal'), C = document.getElementById('modalConteudo');
  const noCaderno = M && !M.hidden && C && C.querySelector(':scope > .cdn-topo') && CDN_ATUAL;
  if (noCaderno && txt) {
    if (CDN_H2 && txt.slice(0, 2) === CDN_H2) return CDN_ATUAL; // a mesma janela se redesenhando (ex.: depois de doar ao Museu)
    if (CDN_ATUAL === 'bestiario' && /^📖/.test(txt)) return 'bestiario'; // as páginas da Wiki (Mascotes, Caçada Épica...) pelas abas do Bestiário
  }
  return null;
}
function cdnTopo(aba) {
  const s = G.save, P = {}; for (const a of CDN_ABAS) if (cdnLiberada(a[0]) || a[0] === aba) P[a[0]] = cdnProgresso(a[0]); // (uma conta por aba)
  const pct = cdnGeral(s, P), prox = cdnProximas(s);
  const abas = CDN_ABAS.filter(a => cdnLiberada(a[0]) || a[0] === aba).map(([k, nome, ic]) => {
    const p = P[k];
    return el('button', { type: 'button', role: 'tab', class: 'btn cdn-aba' + (k === aba ? ' amarelo ativa' : ''), 'aria-selected': k === aba ? 'true' : 'false', 'data-cdn': k,
      title: p ? `${nome}: ${p.t}` : nome, onclick: () => { if (k !== aba || k === 'bestiario') abreCaderno(k); } },
      el('span', { class: 'cdn-aba-ic' }, ic), el('span', {}, nome), p ? el('small', { class: 'cdn-aba-n' }, p.t) : '');
  });
  const detalhe = CDN_ABAS.filter(a => cdnLiberada(a[0])).map(a => { const p = P[a[0]]; return p ? `${a[1]}: ${Math.floor(p.f * 100)}%` : null; }).filter(Boolean).join(' · ');
  return el('div', { class: 'cdn-topo' },
    el('div', { class: 'cdn-cab' }, el('div', { class: 'cdn-tit' }, '📒 Star\'s Notebook'),
      el('div', { class: 'cdn-pct', title: detalhe, role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) },
        el('i', { style: `width:${pct}%` }), el('span', {}, `Your notebook: ${pct}% complete`))),
    prox.length ? el('div', { class: 'cdn-prox' }, el('span', { class: 'cdn-prox-t' }, '⭐ Almost there:'),
      ...prox.map(c => el('button', { type: 'button', class: 'cdn-chip', title: 'Open ' + CDN_POR[c.aba][1], onclick: () => { if (c.vai) cdnChama(c.aba, c.vai); else abreCaderno(c.aba); } }, /^\p{Extended_Pictographic}/u.test(c.txt) ? c.txt : `${CDN_POR[c.aba][2]} ${c.txt}`))) : '', // (texto que já começa com emoji não ganha outro)
    el('div', { class: 'cdn-abas', role: 'tablist' }, ...abas));
}
function cdnPoeTopo(aba) {
  const C = document.getElementById('modalConteudo'); if (!C) return;
  const velho = C.querySelector(':scope > .cdn-topo'); if (velho) velho.remove();
  const topo = cdnTopo(aba); C.prepend(topo); CDN_INJ++;
  const h2 = C.querySelector(':scope > h2'); if (h2) { h2.classList.add('cdn-h2'); CDN_H2 = h2.textContent.trim().slice(0, 2); }
  CDN_ATUAL = aba; CDN_ULT = aba;
  const M = document.querySelector('#modal .modal-caixa'); if (M) M.classList.add('largo', 'cdn-caixa');
  // a aba escolhida fica à vista (no celular as abas rolam de lado)
  const tl = topo.querySelector('.cdn-abas'), at = tl && tl.querySelector('.ativa');
  if (tl && at) requestAnimationFrame(() => { try { tl.scrollLeft = Math.max(0, at.offsetLeft - (tl.clientWidth - at.offsetWidth) / 2); } catch (e) { } });
}
{
  const _abCdn = abreModal;
  abreModal = function (...nos) {
    let aba = null; try { aba = cdnQualAba(nos); } catch (e) { aba = null; }
    if (aba) abreModal.largo = true;
    else { CDN_ATUAL = null; const M = document.querySelector('#modal .modal-caixa'); if (M) M.classList.remove('cdn-caixa'); }
    const r = _abCdn.apply(this, arguments);
    if (aba) try { cdnPoeTopo(aba); } catch (e) { console.warn('caderno', e); }
    return r;
  };
  const _fmCdn = fechaModal;
  fechaModal = function () { CDN_ATUAL = null; CDN_ESPERA = null; return _fmCdn.apply(this, arguments); };
}

/* ---------- ☰ Menu e menu do celular: uma entrada só ---------- */
const CDN_SOMEM = ['#topo .tb-lista [data-abre="album"]', '#btnConquistas', '#btnMuseu', '#btnLendas', '#btnWiki', '#btnPassaporte']; /* v408: o Passaporte mora no Caderno (coordenador) */ // (o Wiki, no jogo, já abria o Bestiário)
const CDN_SOMEM_CEL = ['#cmConquistas', '#cmBest', '#cmLendas', '#cmWiki', '#cmPassaporte'];
function cdnMenu() {
  const lista = document.querySelector('#topo .tb-lista');
  if (lista) {
    let b = document.getElementById('btnCaderno');
    if (!b) {
      b = el('button', { class: 'btn', id: 'btnCaderno', type: 'button', role: 'menuitem', title: 'Stickers, achievements, Bestiary, Museum, collections and legends (keys B and N)', onclick: () => abreCaderno() }, '📒 Star\'s Notebook');
      const ref = lista.querySelector('[data-abre="album"]'); if (ref) ref.before(b); else lista.prepend(b);
    }
    for (const sel of CDN_SOMEM) for (const x of document.querySelectorAll(sel)) if (x.closest('.tb-lista') && x.style.display !== 'none') { x.style.display = 'none'; x.dataset.cdn = '1'; } // (o ☰ Menu em grade lê o style.display)
  }
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade) {
    if (!document.getElementById('cmCaderno')) {
      const velho = [...grade.querySelectorAll('.cm-bt')].find(x => !x.id && /Álbum/.test(x.textContent));
      const b = el('button', { class: 'btn cm-bt', id: 'cmCaderno', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); abreCaderno(); } }, el('span', { class: 'cm-ic' }, '📒'), 'Notebook');
      if (velho) velho.before(b); else grade.append(b);
    }
    for (const x of grade.querySelectorAll('.cm-bt')) if (CDN_SOMEM_CEL.some(sel => x.matches(sel)) || (!x.id && /Álbum/.test(x.textContent))) x.classList.add('cdn-oculto');
  }
}
try { // o ☰ Menu em grade: o Caderno no grupo 🏅 Coleção
  if (typeof OPC_GRUPOS !== 'undefined') { const g = OPC_GRUPOS.find(x => x[0] === 'colecao'); if (g && !/caderno/.test(g[2].source)) g[2] = new RegExp(g[2].source + '|caderno', g[2].flags); }
} catch (e) { }
try { // teclas B e N: o nome na lista de teclas
  if (typeof ACOES_TECLA !== 'undefined') for (const a of ACOES_TECLA) { if (a[0] === 'album') a[1] = 'Star\'s Notebook: Stickers'; else if (a[0] === 'bestiario') a[1] = 'Star\'s Notebook: Bestiary'; }
} catch (e) { }
{
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(cdnMenu, 0)); else setTimeout(cdnMenu, 0);
  const _iniCdn = iniciarJogo; iniciarJogo = async function () { const r = await _iniCdn.apply(this, arguments); try { cdnMenu(); } catch (e) { } return r; };
  setInterval(() => { try { cdnMenu(); if (typeof abrePassaporte === 'function') cdnEmbrulhaPassaporte(); } catch (e) { } }, 1500); // (o menu do celular e o Passaporte chegam depois)
  if (typeof opcMenu === 'function') { const _omCdn = opcMenu; opcMenu = function () { try { cdnMenu(); } catch (e) { } return _omCdn.apply(this, arguments); }; }
}

{
  const st = document.createElement('style');
  st.textContent = `
  .cdn-oculto { display: none !important; }
  .cdn-topo { display: flex; flex-direction: column; gap: 6px; margin: 0 0 6px; }
  .cdn-cab { display: flex; align-items: center; gap: 8px 12px; flex-wrap: wrap; padding-right: 30px; }
  .cdn-tit { font: 800 21px/1.1 Fredoka, Nunito, sans-serif; color: var(--tinta, #3b2410); white-space: nowrap; }
  .cdn-pct { position: relative; flex: 1 1 220px; height: 24px; border-radius: 12px; background: #3a2a1a; overflow: hidden; box-shadow: inset 0 0 0 2px rgba(0,0,0,.25); }
  .cdn-pct i { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(90deg, #3fb34a, #ffd23f); border-radius: 12px; }
  .cdn-pct span { position: relative; display: block; text-align: center; font: 800 13px/24px Nunito, sans-serif; color: #fff; text-shadow: 0 1px 2px #000; }
  .cdn-prox { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; font-size: 13px; }
  .cdn-prox-t { font-weight: 800; color: #8a4b24; }
  .cdn-chip { border: 2px dashed #e0a020; background: #fff8e0; border-radius: 14px; padding: 4px 10px; font: 700 12.5px/1.25 Nunito, sans-serif; color: #4a2c10; cursor: pointer; text-align: left; max-width: 100%; }
  .cdn-chip:hover { background: #ffefb8; border-style: solid; }
  .cdn-abas { display: flex; flex-wrap: nowrap; gap: 5px; overflow-x: auto; overflow-y: hidden; padding: 2px 2px 6px; border-bottom: 3px solid rgba(138,75,36,.35); scrollbar-width: thin; }
  .cdn-abas > .cdn-aba { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 4px; padding: 5px 8px; font-size: 13.5px; white-space: nowrap; }
  @media (min-width: 761px) { body:not(.modo-celular) .cdn-abas { flex-wrap: wrap; overflow-x: visible; } } /* PC: as 7 abas cabem (quebram linha se faltar espaço) */
  .cdn-aba-ic { font-size: 16px; } .cdn-aba-n { font-size: 11px; font-weight: 800; opacity: .75; background: rgba(0,0,0,.08); border-radius: 8px; padding: 0 5px; }
  .cdn-aba.ativa { box-shadow: inset 0 0 0 2px #8a4b24; }
  #modalConteudo > h2.cdn-h2 { font-size: 17px; margin: 2px 0 6px; opacity: .9; }
  .cdn-col-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 6px; margin-top: 6px; }
  .cdn-col-item { display: flex; align-items: center; gap: 8px; padding: 5px 7px; border-radius: 6px; background: rgba(0,0,0,.05); }
  .cdn-col-item.ok { background: rgba(58,194,106,.16); }
  .cdn-col-ic { width: 40px; height: 40px; flex: none; }
  .cdn-col-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; font-size: 12.5px; line-height: 1.3; }
  .cdn-col-txt b { font-size: 13px; } .cdn-col-txt small { opacity: .8; }
  .cdn-col-st { display: flex; flex-direction: column; font-weight: 700; } .cdn-col-st .st-feita { color: #1f7a2e; } .cdn-col-st .st-pronta { color: #b06a00; } .cdn-col-st .st-nivel, .cdn-col-st .st-bloqueada { opacity: .6; }
  /* celular e telas estreitas: abas roláveis, botões grandes para o dedo */
  @media (max-width: 760px) { .cdn-tit { font-size: 18px; } .cdn-abas > .cdn-aba { min-height: 46px; padding: 8px 14px; font-size: 15px; } .cdn-chip { min-height: 40px; font-size: 13.5px; padding: 6px 12px; } .cdn-col-grade { grid-template-columns: 1fr; } }
  body.modo-celular .cdn-abas { scrollbar-width: none; } body.modo-celular .cdn-abas::-webkit-scrollbar { display: none; }
  body.modo-celular .cdn-abas > .cdn-aba { min-height: 46px !important; padding: 8px 14px !important; font-size: 15px !important; }
  /* celular: as "próximas" numa fileira que rola de lado (o topo não come a tela) */
  body.modo-celular .cdn-prox { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; } body.modo-celular .cdn-prox::-webkit-scrollbar { display: none; }
  body.modo-celular .cdn-prox-t { flex: none; }
  body.modo-celular .cdn-caixa .bst-filtros { flex-direction: column; } body.modo-celular .cdn-caixa .bst-sel { max-width: 100%; } /* (a busca do Bestiário ficava espremida no celular) */
  body.modo-celular .cdn-chip { flex: 0 0 auto; min-height: 44px; max-width: 74vw; font-size: 13.5px; padding: 5px 12px; white-space: normal; }`;
  document.head.append(st);
}
