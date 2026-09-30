/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📦🔨 ARMAZÉM + FORJA (v283)
   - A FORJA enxerga o ARMAZÉM: os equipamentos guardados lá aparecem na lista (marcados "📦 no armazém")
     e podem ser forjados sem tirar de lá; os materiais e troféus que faltam na mochila são pegos do armazém
     (primeiro gasta o que está na mochila, depois o do armazém).
   - O ARMAZÉM ganhou um ORGANIZADOR POR RARIDADE: o botão "✨ Organizar por raridade" arruma tudo
     (mítico → lendário → épico → raro → incomum → comum; dentro de cada um, o mais forjado primeiro e
     depois por nome) e os botões de raridade mostram só os itens daquela raridade.
   Carregar DEPOIS de armazem.js, itens.js e arenas.js.
   ============================================================ */
{
  let naForja = false; // só dentro da forja o armazém conta como "mochila" para os materiais
  const noArmazem = id => (G.save.armazem || []).filter(e => e.id === id && !e.r).reduce((a, e) => a + e.q, 0);
  const _contaItemForja = contaItem;
  contaItem = function (id) { const n = _contaItemForja.apply(this, arguments); return naForja ? n + noArmazem(id) : n; };
  const _removeItemForja = removeItem;
  removeItem = function (id, q = 1) {
    if (!naForja) return _removeItemForja.apply(this, arguments);
    const naMochila = _contaItemForja(id), daMochila = Math.min(q, naMochila);
    if (daMochila > 0 && !_removeItemForja.call(this, id, daMochila)) return false;
    let falta = q - daMochila; const a = G.save.armazem || [];
    for (let j = a.length - 1; j >= 0 && falta > 0; j--) { const e = a[j]; if (e.id !== id || e.r) continue; const t = Math.min(falta, e.q); e.q -= t; falta -= t; if (e.q <= 0) a.splice(j, 1); }
    G.uiSujo = true; return falta <= 0;
  };
  // os equipamentos do armazém entram na lista da forja
  const _refinaveisArm = itensRefinaveis;
  itensRefinaveis = function () {
    const L = _refinaveisArm.apply(this, arguments);
    (G.save.armazem || []).forEach((e, i) => { if (ITENS[e.id] && ITENS[e.id].tipo === 'equip') L.push({ id: e.id, r: e.r || 0, onde: 'armazem', i, ref: e }); });
    return L;
  };
  const _modalRefinoArm = modalRefino;
  modalRefino = function (npc, msg) {
    naForja = true;
    try { _modalRefinoArm.apply(this, arguments); } finally { naForja = false; }
    // marca na lista o que está no armazém (as linhas vêm na mesma ordem da lista)
    const itens = itensRefinaveis(), linhas = document.querySelectorAll('#modalConteudo .lista .linha-item');
    if (linhas.length === itens.length) itens.forEach((o, k) => { if (o.onde === 'armazem') { const b = linhas[k].querySelector('.nm b'); if (b) b.append(el('span', { class: 'forja-arm' }, ' 📦 no armazém')); } });
    const lista = document.querySelector('#modalConteudo .lista');
    if (lista) lista.before(el('p', { class: 'forja-arm-dica' }, '📦 O armazém também vale aqui: os equipamentos guardados lá aparecem na lista, e os materiais que faltarem na mochila saem do armazém.'));
  };
  const _refinarArm = refinar;
  refinar = function (o, npc) {
    if (o.onde !== 'armazem') { naForja = true; try { return _refinarArm.apply(this, arguments); } finally { naForja = false; } }
    // item do armazém: o mesmo refino, mas quem muda é o item guardado lá
    const s = G.save, alvo = o.ref, c = custoRefino(o.id, o.r);
    naForja = true;
    try {
      if (!alvo || !(s.armazem || []).includes(alvo)) return modalRefino(npc);
      if (s.ouro < c.tostoes || !c.mats.every(([m, n]) => contaItem(m) >= n)) return;
      s.ouro -= c.tostoes; c.mats.forEach(([m, n]) => removeItem(m, n));
    } finally { naForja = false; }
    let msg;
    if (Math.random() < c.chance) {
      const novo = o.r + 1; alvo.r = novo; alvo.q = 1;
      msg = `✨ SUCESSO! ${nomeItem(o.id, novo)} ficou mais forte! (ele continua guardado no armazém)`; som('nivel'); banner(nomeItem(o.id, novo), 'Refino bem-sucedido!'); log(msg, 'l-lvl'); contaEvento('refino');
    } else if (c.cai) {
      const volta = Math.max(0, o.r - 1); if (volta) alvo.r = volta; else delete alvo.r;
      msg = `💥 Não deu certo... e o item voltou para ${nomeItem(o.id, volta)}. Refino alto é assim: arriscado!`; som('erro'); log(msg, 'l-dano');
    } else { msg = `💥 Não deu certo desta vez... O item continua ${nomeItem(o.id, o.r)}. Tente de novo!`; som('erro'); log(msg, 'l-dano'); }
    salvar(); G.uiSujo = true; atualizaRetrato(); modalRefino(npc, msg);
  };

  /* ---------- organizador por raridade no armazém ---------- */
  const ORDEM_ARM = () => ['mitico', 'lendario', 'epico', 'raro', 'incomum', 'comum'].filter(r => RARIDADE[r]);
  const NOME_RAR = { mitico: 'Míticos', lendario: 'Lendários', epico: 'Épicos', raro: 'Raros', incomum: 'Incomuns', comum: 'Comuns' };
  let filtroRar = null;
  function organizaArmazem() {
    const a = armazem(), ordem = ORDEM_ARM();
    const pos = e => { const k = ordem.indexOf(raridadeItem(e.id)); return k < 0 ? ordem.length : k; };
    // junta pilhas iguais que ficaram separadas
    for (let j = a.length - 1; j >= 0; j--) { const e = a[j]; if (e.r || !empilha(e.id)) continue; const k = a.findIndex(x => x !== e && x.id === e.id && !x.r); if (k >= 0 && k < j) { a[k].q += e.q; a.splice(j, 1); } }
    a.sort((x, y) => pos(x) - pos(y) || (y.r || 0) - (x.r || 0) || ITENS[x.id].nome.localeCompare(ITENS[y.id].nome, 'pt'));
    salvar(); som('equip'); log('📦 Armazém organizado por raridade: os mais raros primeiro!', 'l-info');
  }
  const _modalArmazemRar = modalArmazem;
  modalArmazem = function (filtro) {
    _modalArmazemRar.apply(this, arguments);
    const grades = document.querySelectorAll('#modalConteudo .arm-grade'), gArm = grades[1]; if (!gArm) return;
    // quantos de cada raridade tem no armazém
    const conta = {}; for (const e of armazem()) if (ITENS[e.id]) { const r = raridadeItem(e.id); conta[r] = (conta[r] || 0) + 1; }
    const aplica = () => {
      let vis = 0;
      gArm.querySelectorAll('.arm-slot').forEach(b => { const ok = !filtroRar || b.classList.contains('rar-' + filtroRar); b.hidden = !ok; if (ok) vis++; });
      const v = gArm.querySelector('.vazio-rar'); if (v) v.remove();
      if (!vis && filtroRar && gArm.querySelector('.arm-slot')) gArm.append(el('p', { class: 'vazio vazio-rar' }, `Nenhum item ${RARIDADE[filtroRar].nome} no armazém.`));
      barra.querySelectorAll('button').forEach(b => b.classList.toggle('sel', (b.dataset.rar || null) === filtroRar));
    };
    const barra = el('div', { class: 'arm-rar' },
      el('button', { class: 'btn mini arm-org', type: 'button', onclick: () => { organizaArmazem(); modalArmazem(filtro); } }, '✨ Organizar por raridade'),
      el('button', { class: 'btn mini arm-chip', type: 'button', onclick: () => { filtroRar = null; aplica(); } }, 'Todos'),
      ...ORDEM_ARM().filter(r => conta[r]).map(r => el('button', { class: 'btn mini arm-chip', type: 'button', 'data-rar': r, style: `--rc:${RARIDADE[r].cor}`, onclick: () => { filtroRar = r; aplica(); } }, `${NOME_RAR[r]} (${conta[r]})`)));
    gArm.before(barra);
    if (filtroRar && !conta[filtroRar]) filtroRar = null;
    aplica();
  };
  const css = document.createElement('style');
  css.textContent = `.arm-rar{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 6px}
.arm-rar .arm-chip{border-left:6px solid var(--rc,#bbb)!important;color:#3a2a1a!important;text-shadow:none!important}
.arm-rar .arm-chip.sel{outline:2px solid #ffd23f;background:#fff4c8}
.arm-rar .arm-org{background:#ffd23f}
.forja-arm{color:#7a5a2a;font-weight:600;font-size:.85em}
.forja-arm-dica{font-size:.9em;color:#5a4a2a;background:#fff4d8;border-radius:8px;padding:4px 8px}`;
  document.head.append(css);
}
