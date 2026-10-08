/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🗂️ ORGANIZADOR DAS MISSÕES (v350, dono: "coloque um organizador no menu missões, ou pelo menos liste por níveis")
   Em cima da lista: filtros (Todas · Em andamento · Disponíveis · Próximas · Concluídas, com a contagem),
   "Ordenar por" (Situação — e por nível dentro de cada grupo · Nível ↑ · Nível ↓ · Quem dá a missão) e busca pelo nome.
   A lista ganha títulos de grupo e o nível de cada missão. A escolha fica lembrada (neste aparelho).
   Embrulha o modalMissoes (depois de ondeachar.js): as linhas são as mesmas, só mudam de ordem / aparecem ou somem.
   ============================================================ */
{
  const CH = 'rac_missoes_org';
  // v407 (Raio-X R4): + filtro por tipo (📖 História · ⭐ Extras · 🎯 Caçadas); "Todas" não mostra mais as 🔒 Próximas
  // (o jogador novo via "0 de 411" e 174 bloqueadas); na ordem por situação, a história principal vem primeiro.
  let MO = { filtro: 'todas', ordem: 'situacao', busca: '', cat: 'tudo' };
  try { Object.assign(MO, JSON.parse(localStorage.getItem(CH) || '{}')); } catch (e) { }
  const guarda = () => { try { localStorage.setItem(CH, JSON.stringify({ filtro: MO.filtro, ordem: MO.ordem, cat: MO.cat })); } catch (e) { } };
  const ORD_ST = { pronta: 0, ativa: 1, disponivel: 2, nivel: 3, bloqueada: 4, feita: 5 };
  const NOME_ST = { pronta: '✔ Ready to turn in', ativa: '▶ In progress', disponivel: '🆕 Available', nivel: '🔒 Next levels', feita: '✅ Completed' };
  const FILTROS = [['todas', '📋 All', st => st !== 'nivel'], ['andamento', '▶ In progress', st => st === 'ativa' || st === 'pronta'],
    ['disponiveis', '🆕 Available', st => st === 'disponivel'], ['proximas', '🔒 Upcoming', st => st === 'nivel'], ['feitas', '✅ Completed', st => st === 'feita']];
  const ORDENS = [['situacao', 'Status (and level)'], ['nivel', 'Level: low → high'], ['nivel_desc', 'Level: high → low'], ['npc', 'Who gives the mission']];
  const ehPrincipal = q => typeof mrxPrincipal === 'function' ? mrxPrincipal(q) : !!q.principal;
  const ehCacada = q => typeof CACA_POR_ID !== 'undefined' && !!CACA_POR_ID[String(q.id).replace(/_m\d+$/, '')];
  const CATS = [['tudo', '🗂️ All', () => true], ['historia', '📖 Story', q => ehPrincipal(q)], ['extras', '⭐ Extras', q => !ehPrincipal(q) && !ehCacada(q)], ['cacadas', '🎯 Hunts', q => ehCacada(q)]];
  const sem = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const faixa = l => { const a = Math.floor((l || 1) / 50) * 50; return `Level ${Math.max(1, a)}–${a + 49}`; };
  const _modalMissoesOrg = modalMissoes;
  modalMissoes = function () {
    const r = _modalMissoesOrg.apply(this, arguments);
    const box = document.getElementById('modalConteudo'), lista = box && box.querySelector('.lista'); if (!lista) return r;
    // as linhas saem na mesma ordem desta conta (a mesma do modalMissoes original; o sort é estável)
    const qs = MISSOES.map(q => ({ q, st: statusMissao(q) })).filter(x => x.st !== 'bloqueada').sort((a, b) => ORD_ST[a.st] - ORD_ST[b.st]);
    const linhas = [...lista.querySelectorAll(':scope > .linha-item')]; if (linhas.length !== qs.length) return r;
    const itens = qs.map((x, i) => ({ ...x, li: linhas[i], npc: (NPCS[x.q.npc] || {}).nome || '', busca: sem(x.q.titulo + ' ' + descMissao(x.q)) }));
    for (const it of itens) { const b = it.li.querySelector('.nm b'); if (b && !b.querySelector('.mo-nv')) b.prepend(el('span', { class: 'mo-nv' }, `Lv ${it.q.lvl || 1}`)); }
    // v410 (dono: "não achei onde fica o Titã do Trovão"): tocar na linha de uma missão de vencer / juntar / falar abre o
    // bloco completo "📍 Onde achar e como chegar" (no lugar do resumo de uma linha); tocar de novo volta ao resumo
    for (const it of itens) {
      const rq = it.q.req || {}; if (it.st === 'feita' || !(rq.kill || rq.item || rq.itens || rq.fala)) continue;
      it.li.classList.add('mo-cc'); it.li.title = 'Tap to see where to find it and how to get there';
      it.li.addEventListener('click', ev => {
        if (ev.target.closest('button, a, input, select, details')) return;
        if (typeof blocoComoChegar !== 'function') return;
        const nm = it.li.querySelector('.nm') || it.li, cheio = nm.querySelector('.como-chegar:not(.compacto)'), curto = nm.querySelector('.como-chegar.compacto');
        if (cheio) { cheio.remove(); if (curto) curto.hidden = false; return; }
        const b = blocoComoChegar(it.q, false);
        if (!b) { nm.append(el('div', { class: 'como-chegar' }, 'Talk to whoever gave you the mission: ' + it.npc)); return; }
        if (curto) curto.hidden = true; nm.append(b);
      });
    }
    const barra = el('div', { class: 'mo-barra' }), btnsF = el('div', { class: 'mo-filtros' }), btnsC = el('div', { class: 'mo-filtros mo-cats' });
    // o "X de 411 concluídas" assustava quem acabou de chegar: fica só a conta do que já foi feito
    try { const p = [...box.children].find(x => x.tagName === 'P' && / de \d+ concluídas/.test(x.textContent)); if (p) { const nf = itens.filter(it => it.st === 'feita').length; p.textContent = nf ? `✅ You’ve completed ${nf} ${nf === 1 ? 'mission' : 'missions'}.` : 'Talk to people with ❗ over their heads to get missions.'; } } catch (e) { }
    const sel = el('select', { class: 'mo-ordem', title: 'Sort by' }, ...ORDENS.map(([v, t]) => el('option', { value: v }, t))); sel.value = MO.ordem;
    const busca = el('input', { class: 'mo-busca', type: 'search', placeholder: '🔎 Search missions...', value: MO.busca });
    function aplica() {
      lista.querySelectorAll('.mo-grupo, .mo-vazio').forEach(x => x.remove());
      const f = FILTROS.find(x => x[0] === MO.filtro) || FILTROS[0], termo = sem(MO.busca.trim());
      const c = CATS.find(x => x[0] === MO.cat) || CATS[0], daCat = itens.filter(it => c[2](it.q));
      btnsC.innerHTML = '';
      for (const [id, nome, fn] of CATS) {
        const n = itens.filter(it => fn(it.q) && it.st !== 'feita' && it.st !== 'nivel').length;
        btnsC.append(el('button', { class: 'btn mini' + (MO.cat === id ? ' amarelo' : ''), type: 'button', onclick: () => { MO.cat = id; guarda(); aplica(); } }, n ? `${nome} (${n})` : nome));
      }
      btnsF.innerHTML = '';
      for (const [id, nome, fn] of FILTROS) {
        const n = daCat.filter(it => fn(it.st)).length;
        btnsF.append(el('button', { class: 'btn mini' + (MO.filtro === id ? ' amarelo' : ''), type: 'button', onclick: () => { MO.filtro = id; guarda(); aplica(); } }, `${nome} (${n})`));
      }
      // v412 (dono: "ticar a quest que você quer acompanhar, para não ter que ficar procurando"): as 📌 acompanhadas
      // (missao_fixa.js) ficam SEMPRE no topo, num grupo só delas, em qualquer filtro, categoria ou busca
      const fix = typeof qfLista === 'function' ? qfLista() : [];
      const fixos = fix.map(id => itens.find(it => it.q.id === id && (it.st === 'ativa' || it.st === 'pronta'))).filter(Boolean);
      const vis = daCat.filter(it => f[2](it.st) && (!termo || it.busca.includes(termo)) && !fixos.includes(it));
      const lv = it => it.q.lvl || 1;
      const cmp = { situacao: (a, b) => ORD_ST[a.st] - ORD_ST[b.st] || ehPrincipal(b.q) - ehPrincipal(a.q) || lv(a) - lv(b), nivel: (a, b) => lv(a) - lv(b) || ORD_ST[a.st] - ORD_ST[b.st],
        nivel_desc: (a, b) => lv(b) - lv(a) || ORD_ST[a.st] - ORD_ST[b.st], npc: (a, b) => a.npc.localeCompare(b.npc, 'pt') || lv(a) - lv(b) }[MO.ordem];
      vis.sort(cmp);
      const grupo = { situacao: it => NOME_ST[it.st], nivel: it => faixa(lv(it)), nivel_desc: it => faixa(lv(it)), npc: it => '👤 ' + (it.npc || 'Others') }[MO.ordem];
      for (const it of itens) it.li.style.display = 'none';
      if (fixos.length) {
        lista.append(el('div', { class: 'mo-grupo qf-grupo' }, `📌 Tracking (${fixos.length} of ${typeof QF_MAX !== 'undefined' ? QF_MAX : 3})`));
        for (const it of fixos) { it.li.style.display = ''; lista.append(it.li); }
      }
      let ult = null;
      for (const it of vis) {
        const g = grupo(it); if (g !== ult) { lista.append(el('div', { class: 'mo-grupo' }, g)); ult = g; }
        it.li.style.display = ''; lista.append(it.li);
      }
      if (!vis.length) lista.append(el('p', { class: 'mo-vazio' }, termo ? 'No mission with that name here.' : 'No missions in this filter.'));
      // as próximas ficam escondidas em "Todas": só um aviso com o atalho
      const nProx = daCat.filter(it => it.st === 'nivel').length;
      if (MO.filtro === 'todas' && nProx) lista.append(el('p', { class: 'mo-vazio' }, `🔒 ${nProx} more ${nProx === 1 ? 'mission arrives' : 'missions arrive'} in the next levels. `, el('button', { class: 'btn mini', type: 'button', onclick: () => { MO.filtro = 'proximas'; guarda(); aplica(); } }, 'See the next ones')));
    }
    lista._moAplica = aplica; // (missao_fixa.js reordena ao ticar/desticar, sem fechar a janela)
    sel.onchange = () => { MO.ordem = sel.value; guarda(); aplica(); };
    busca.oninput = () => { MO.busca = busca.value; aplica(); };
    barra.append(btnsC, btnsF, el('div', { class: 'mo-linha2' }, el('label', {}, 'Sort by ', sel), busca));
    lista.before(barra); aplica();
    return r;
  };
  const css = document.createElement('style');
  css.textContent = `.mo-barra { display: flex; flex-direction: column; gap: 6px; margin: 4px 0 8px; }
  .mo-filtros { display: flex; flex-wrap: wrap; gap: 4px; }
  .mo-cats .btn { font-weight: 700; }
  .mo-linha2 { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 13px; }
  .mo-ordem, .mo-busca { font: inherit; font-size: 13px; padding: 4px 8px; border-radius: 8px; border: 2px solid #c8a878; background: #fffaf0; color: #3d2b3a; }
  .mo-busca { flex: 1; min-width: 160px; }
  .mo-grupo { font-weight: 800; font-size: 14px; color: #6a4a2a; margin: 10px 2px 2px; padding-bottom: 2px; border-bottom: 2px solid rgba(106,74,42,.25); }
  .mo-nv { display: inline-block; margin-right: 6px; padding: 0 6px; border-radius: 8px; background: #6a4a2a; color: #fff; font-size: 11px; font-weight: 700; vertical-align: 1px; }
  .mo-vazio { color: #7a6048; font-style: italic; }
  .linha-item.mo-cc { cursor: pointer; } .linha-item.mo-cc:hover { box-shadow: inset 0 0 0 2px rgba(46,158,90,.45); }`;
  document.head.append(css);
}
