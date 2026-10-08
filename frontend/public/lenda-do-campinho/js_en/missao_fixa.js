/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📌 MISSÕES ACOMPANHADAS (v412; dono, 08/10/2026: "Coloque uma opção de você 'ticar' a quest que você quer
   acompanhar, para não ter que ficar procurando ela toda vez que abrir o quadro de quests.")
   - Na janela Missões, cada missão EM ANDAMENTO (ou pronta para entregar) ganha o botão "📌 Acompanhar".
   - Até QF_MAX (3) missões: a última marcada fica em 1º; marcando a 4ª, a mais antiga sai da lista (com aviso).
     (3 = cabe no rastreador da tela sem cobrir o jogo, também no celular; a seta segue uma só.)
   - As acompanhadas ficam no TOPO da janela Missões (grupo "📌 Acompanhando", em qualquer filtro — missoes_org.js)
     e no topo do rastreador da tela, com 📌 (ui.js / rastreador.js).
   - A seta amarela e o "🎯 Agora" seguem a 1ª acompanhada (botão "🎯 Seta nesta" escolhe outra); sem nenhuma, como antes.
     Como: durante a conta da seta/"Agora", as OUTRAS missões ativas ficam de fora (statusMissao → 'oculta'), então todos
     os embrulhos (como_chegar, origem_fio, passaporte, copa...) apontam o mesmo lugar que apontariam para ela sozinha.
   - Entregou ou desistiu: sai sozinha da lista. Guardado no save: save.questFixas = [ids] (save antigo: sem o campo = []).
   - Sem custo por quadro: a lista tem no máximo 3 ids; o rastreador e a seta já são refeitos só quando algo muda
     (desempenho_v410.js inclui as acompanhadas na assinatura do rastreador e na memória da seta).
   Prefixo qf. Carregar DEPOIS de ui.js, missoes_org.js, objetivo_agora.js, como_chegar.js, lance_chefe.js, passaporte.js,
   copa_historia.js (embrulhos de modalMissoes, objetivoAtual, objetivoTexto e statusMissao) e ANTES de desempenho_v410.js.
   ============================================================ */
const QF_MAX = 3;
let QF_FOCO = null; // id da missão acompanhada enquanto a seta/"Agora" é calculada
const QF_POR_ID = new Map(); let qfNMis = -1;
function qfMissao(id) {
  if (MISSOES.length !== qfNMis) { QF_POR_ID.clear(); for (const q of MISSOES) QF_POR_ID.set(q.id, q); qfNMis = MISSOES.length; }
  return QF_POR_ID.get(id) || null;
}
// a lista (ids), já sem as entregues/desistidas/que não existem mais
function qfLista() {
  const s = typeof G !== 'undefined' && G.save; if (!s || !Array.isArray(s.questFixas)) return [];
  const ok = id => { const e = s.quests && s.quests[id]; return !!(e && e.s === 'ativa' && qfMissao(id)); };
  if (!s.questFixas.every(ok)) s.questFixas = s.questFixas.filter(ok).slice(0, QF_MAX);
  return s.questFixas;
}
function qfTem(id) { return qfLista().includes(id); }
// a 1ª acompanhada (a que a seta segue)
function qfPrimeira() { const l = qfLista(); return l.length ? qfMissao(l[0]) : null; }
// marca/desmarca; volta { fixou, saiu (missão que saiu por passar do limite) }
function qfAlterna(id) {
  const s = G.save; if (!s || !qfMissao(id)) return {};
  const l = qfLista().slice(), i = l.indexOf(id);
  if (i >= 0) { l.splice(i, 1); s.questFixas = l; return { fixou: false }; }
  const e = s.quests[id]; if (!e || e.s !== 'ativa') return {};
  l.unshift(id); const saiu = l.length > QF_MAX ? qfMissao(l.pop()) : null;
  s.questFixas = l; return { fixou: true, saiu };
}
// passa uma acompanhada para o 1º lugar (a seta passa a seguir ela)
function qfPrimeiro(id) { const l = qfLista().slice(), i = l.indexOf(id); if (i > 0) { l.splice(i, 1); l.unshift(id); G.save.questFixas = l; } }

/* ---------- a seta e o "🎯 Agora" seguem a 1ª acompanhada ---------- */
{
  const _stQf = statusMissao;
  statusMissao = function (q) {
    const r = _stQf.apply(this, arguments);
    if (QF_FOCO !== null && q && q.id !== QF_FOCO && (r === 'ativa' || r === 'pronta')) return 'oculta';
    return r;
  };
  // só quando o jogador escolheu: fora do tutorial, sem um pedido "me leve até…" do rastreador (esse continua valendo)
  const foco = () => {
    const s = G.save; if (QF_FOCO !== null || !s || (typeof TUTORIAL !== 'undefined' && s.tut < TUTORIAL.length) || G.guiaPedido) return null;
    return qfPrimeira();
  };
  const comFoco = (q, fn, ctx, args) => { QF_FOCO = q.id; try { return fn.apply(ctx, args); } finally { QF_FOCO = null; } };
  const _oaQf = objetivoAtual;
  objetivoAtual = function () { const q = foco(); return q ? comFoco(q, _oaQf, this, arguments) : _oaQf.apply(this, arguments); };
  if (typeof objetivoTexto === 'function') {
    const _otQf = objetivoTexto;
    objetivoTexto = function () {
      const q = foco(); if (!q) return _otQf.apply(this, arguments);
      const r = comFoco(q, _otQf, this, arguments);
      return r && r.txt && !/^📌/.test(r.txt) ? Object.assign({}, r, { txt: '📌 ' + r.txt }) : r;
    };
  }
}

/* ---------- janela Missões: o botão "📌 Acompanhar" ---------- */
function qfDecora() {
  const box = document.getElementById('modalConteudo'), lista = box && box.querySelector('.lista'); if (!lista) return;
  const fix = qfLista(), lider = fix[0];
  for (const li of lista.querySelectorAll(':scope > .linha-item[data-qid]')) {
    const id = li.getAttribute('data-qid'), q = qfMissao(id); if (!q) continue;
    const st = statusMissao(q), pode = st === 'ativa' || st === 'pronta', tem = pode && fix.includes(id);
    let ops = li.querySelector(':scope > .qf-ops');
    li.classList.toggle('qf-fixa', tem);
    if (!pode) { if (ops) ops.remove(); continue; }
    if (!ops) {
      ops = el('div', { class: 'qf-ops' });
      const desiste = li.querySelector(':scope > button'); li.append(ops); if (desiste) ops.append(desiste);
    }
    let bt = ops.querySelector('.qf-bt');
    if (!bt) { bt = el('button', { class: 'btn mini qf-bt', type: 'button', onclick: ev => { ev.stopPropagation(); qfClique(id, li); } }); ops.prepend(bt); }
    bt.className = 'btn mini qf-bt' + (tem ? ' amarelo qf-on' : '');
    bt.textContent = tem ? '📌 Tracking' : '📌 Track';
    bt.title = tem ? 'Tap to stop tracking this quest' : `Stays at the top of Quests and on screen, and the yellow arrow leads to it (up to ${QF_MAX} quests)`;
    bt.setAttribute('aria-pressed', tem ? 'true' : 'false');
    // a 1ª é a que a seta segue; as outras podem passar para a frente
    let seta = ops.querySelector('.qf-seta-bt');
    if (tem && id !== lider) { if (!seta) ops.insertBefore(el('button', { class: 'btn mini qf-seta-bt', type: 'button', title: 'The yellow arrow and "Now" will follow this quest', onclick: ev => { ev.stopPropagation(); qfPrimeiro(id); qfMudou(lista); } }, '🎯 Arrow on this'), bt.nextSibling); }
    else if (seta) seta.remove();
    const nm = li.querySelector('.nm') || li; let tag = nm.querySelector(':scope > .qf-seta');
    if (tem && id === lider) { if (!tag) nm.append(el('div', { class: 'qf-seta' }, '🎯 The yellow arrow and “Now” follow this quest')); }
    else if (tag) tag.remove();
  }
}
function qfMudou(lista, li) {
  G.uiSujo = true; try { salvar(); } catch (e) { }
  if (lista && lista._moAplica) lista._moAplica();
  else if (lista) { const fix = qfLista(); for (const id of [...fix].reverse()) { const r = lista.querySelector(`:scope > .linha-item[data-qid="${CSS.escape(id)}"]`); if (r) lista.prepend(r); } }
  qfDecora();
  if (li && li.classList.contains('qf-fixa')) try { li.scrollIntoView({ block: 'nearest' }); } catch (e) { }
}
function qfClique(id, li) {
  const q = qfMissao(id); if (!q) return;
  const r = qfAlterna(id), lista = li && li.parentElement;
  if (r.fixou) {
    G.guiaPedido = null; // (um "me leve até…" antigo do rastreador não segura mais a seta)
    log(`📌 Tracking: ${q.titulo}. It stays at the top of Quests and on screen.`, 'l-info');
  }
  const box = document.getElementById('modalConteudo'); let av = box && box.querySelector('.qf-aviso');
  if (r.saiu) {
    const txt = `📌 You can track up to ${QF_MAX} quests. “${r.saiu.titulo}” left the list so this one could join.`;
    log(txt, 'l-info');
    if (box && lista) { if (!av) { av = el('p', { class: 'qf-aviso' }); (box.querySelector('.mo-barra') || lista).before(av); } av.textContent = txt; }
  } else if (av) av.remove();
  qfMudou(lista, li);
}
{
  const _mmQf = modalMissoes;
  modalMissoes = function () { const r = _mmQf.apply(this, arguments); try { qfDecora(); } catch (e) { console.warn('missão fixa', e); } return r; };
  const st = document.createElement('style');
  st.textContent = `.linha-item .qf-ops { display: flex; flex-direction: column; align-items: stretch; gap: 4px; flex: none; }
  .linha-item .qf-bt, .linha-item .qf-seta-bt { min-height: 34px; padding: 4px 10px; font-size: 13px; white-space: nowrap; }
  .linha-item .qf-bt:not(.qf-on) { background: #fffaf0; border: 2px dashed #c8962a; color: #6a4a2a; }
  .linha-item.qf-fixa { background: linear-gradient(90deg, rgba(255,214,90,.38), rgba(255,240,190,.3)); border: 2px solid #e8b030; box-shadow: 0 0 0 2px rgba(232,176,48,.25); }
  .linha-item .qf-seta { margin-top: 4px; font-size: 12px; font-weight: 700; color: #8a5a10; }
  .mo-grupo.qf-grupo { color: #a06a00; border-bottom-color: rgba(232,176,48,.6); }
  .qf-aviso { margin: 4px 0 6px; padding: 6px 10px; border-radius: 8px; background: #fff3c4; border: 2px solid #e8b030; font-size: 13px; }
  body.modo-celular .linha-item .qf-ops { flex-direction: row; flex-wrap: wrap; margin-left: auto; }
  body.modo-celular .linha-item .qf-bt, body.modo-celular .linha-item .qf-seta-bt { min-height: 38px; font-size: 14px; }
  #rastreador .rast-q.fixa { border-color: #e8b030; box-shadow: 0 0 0 2px rgba(255,214,90,.75), 0 2px 0 rgba(0,0,0,.3); }
  #rastreador .rast-q .rast-pin { font-size: 12px; }`;
  document.head.append(st);
}
