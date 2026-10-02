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
  let MO = { filtro: 'todas', ordem: 'situacao', busca: '' };
  try { Object.assign(MO, JSON.parse(localStorage.getItem(CH) || '{}')); } catch (e) { }
  const guarda = () => { try { localStorage.setItem(CH, JSON.stringify({ filtro: MO.filtro, ordem: MO.ordem })); } catch (e) { } };
  const ORD_ST = { pronta: 0, ativa: 1, disponivel: 2, nivel: 3, bloqueada: 4, feita: 5 };
  const NOME_ST = { pronta: '✔ Prontas para entregar', ativa: '▶ Em andamento', disponivel: '🆕 Disponíveis', nivel: '🔒 Próximos níveis', feita: '✅ Concluídas' };
  const FILTROS = [['todas', '📋 Todas', () => true], ['andamento', '▶ Em andamento', st => st === 'ativa' || st === 'pronta'],
    ['disponiveis', '🆕 Disponíveis', st => st === 'disponivel'], ['proximas', '🔒 Próximas', st => st === 'nivel'], ['feitas', '✅ Concluídas', st => st === 'feita']];
  const ORDENS = [['situacao', 'Situação (e nível)'], ['nivel', 'Nível: menor → maior'], ['nivel_desc', 'Nível: maior → menor'], ['npc', 'Quem dá a missão']];
  const sem = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const faixa = l => { const a = Math.floor((l || 1) / 50) * 50; return `Nível ${Math.max(1, a)}–${a + 49}`; };
  const _modalMissoesOrg = modalMissoes;
  modalMissoes = function () {
    const r = _modalMissoesOrg.apply(this, arguments);
    const box = document.getElementById('modalConteudo'), lista = box && box.querySelector('.lista'); if (!lista) return r;
    // as linhas saem na mesma ordem desta conta (a mesma do modalMissoes original; o sort é estável)
    const qs = MISSOES.map(q => ({ q, st: statusMissao(q) })).filter(x => x.st !== 'bloqueada').sort((a, b) => ORD_ST[a.st] - ORD_ST[b.st]);
    const linhas = [...lista.querySelectorAll(':scope > .linha-item')]; if (linhas.length !== qs.length) return r;
    const itens = qs.map((x, i) => ({ ...x, li: linhas[i], npc: (NPCS[x.q.npc] || {}).nome || '', busca: sem(x.q.titulo + ' ' + descMissao(x.q)) }));
    for (const it of itens) { const b = it.li.querySelector('.nm b'); if (b && !b.querySelector('.mo-nv')) b.prepend(el('span', { class: 'mo-nv' }, `Nv ${it.q.lvl || 1}`)); }
    const barra = el('div', { class: 'mo-barra' }), btnsF = el('div', { class: 'mo-filtros' });
    const sel = el('select', { class: 'mo-ordem', title: 'Ordenar por' }, ...ORDENS.map(([v, t]) => el('option', { value: v }, t))); sel.value = MO.ordem;
    const busca = el('input', { class: 'mo-busca', type: 'search', placeholder: '🔎 Procurar missão...', value: MO.busca });
    function aplica() {
      lista.querySelectorAll('.mo-grupo, .mo-vazio').forEach(x => x.remove());
      const f = FILTROS.find(x => x[0] === MO.filtro) || FILTROS[0], termo = sem(MO.busca.trim());
      btnsF.innerHTML = '';
      for (const [id, nome, fn] of FILTROS) {
        const n = itens.filter(it => fn(it.st)).length;
        btnsF.append(el('button', { class: 'btn mini' + (MO.filtro === id ? ' amarelo' : ''), type: 'button', onclick: () => { MO.filtro = id; guarda(); aplica(); } }, `${nome} (${n})`));
      }
      const vis = itens.filter(it => f[2](it.st) && (!termo || it.busca.includes(termo)));
      const lv = it => it.q.lvl || 1;
      const cmp = { situacao: (a, b) => ORD_ST[a.st] - ORD_ST[b.st] || lv(a) - lv(b), nivel: (a, b) => lv(a) - lv(b) || ORD_ST[a.st] - ORD_ST[b.st],
        nivel_desc: (a, b) => lv(b) - lv(a) || ORD_ST[a.st] - ORD_ST[b.st], npc: (a, b) => a.npc.localeCompare(b.npc, 'pt') || lv(a) - lv(b) }[MO.ordem];
      vis.sort(cmp);
      const grupo = { situacao: it => NOME_ST[it.st], nivel: it => faixa(lv(it)), nivel_desc: it => faixa(lv(it)), npc: it => '👤 ' + (it.npc || 'Outros') }[MO.ordem];
      for (const it of itens) it.li.style.display = 'none';
      let ult = null;
      for (const it of vis) {
        const g = grupo(it); if (g !== ult) { lista.append(el('div', { class: 'mo-grupo' }, g)); ult = g; }
        it.li.style.display = ''; lista.append(it.li);
      }
      if (!vis.length) lista.append(el('p', { class: 'mo-vazio' }, termo ? 'Nenhuma missão com esse nome aqui.' : 'Nenhuma missão neste filtro.'));
    }
    sel.onchange = () => { MO.ordem = sel.value; guarda(); aplica(); };
    busca.oninput = () => { MO.busca = busca.value; aplica(); };
    barra.append(btnsF, el('div', { class: 'mo-linha2' }, el('label', {}, 'Ordenar por ', sel), busca));
    lista.before(barra); aplica();
    return r;
  };
  const css = document.createElement('style');
  css.textContent = `.mo-barra { display: flex; flex-direction: column; gap: 6px; margin: 4px 0 8px; }
  .mo-filtros { display: flex; flex-wrap: wrap; gap: 4px; }
  .mo-linha2 { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 13px; }
  .mo-ordem, .mo-busca { font: inherit; font-size: 13px; padding: 4px 8px; border-radius: 8px; border: 2px solid #c8a878; background: #fffaf0; color: #3d2b3a; }
  .mo-busca { flex: 1; min-width: 160px; }
  .mo-grupo { font-weight: 800; font-size: 14px; color: #6a4a2a; margin: 10px 2px 2px; padding-bottom: 2px; border-bottom: 2px solid rgba(106,74,42,.25); }
  .mo-nv { display: inline-block; margin-right: 6px; padding: 0 6px; border-radius: 8px; background: #6a4a2a; color: #fff; font-size: 11px; font-weight: 700; vertical-align: 1px; }
  .mo-vazio { color: #7a6048; font-style: italic; }`;
  document.head.append(css);
}
