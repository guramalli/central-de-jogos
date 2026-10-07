/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🔨 PRÉVIA DO REFINO (v349, pedido do dono): na Oficina do Seu Remendo, passar o mouse num item (ou no botão
   "Refinar +N") mostra cada atributo AGORA → DEPOIS do refino e quanto sobe (▲ +x), o ⚔️ Poder antes → depois,
   a chance de dar certo e o que acontece se falhar (no refino alto, como o item fica ao voltar 1 nível).
   Carregar DEPOIS de armazem_forja.js (que também embrulha o modalRefino) e de padrao_itens.js (poderItem).
   ============================================================ */
function tipRefino(o) {
  const it = ITENS[o.id], r = o.r, prox = r + 1, box = el('div', { class: 'tip-item tip-refino' });
  box.append(el('b', { class: 'tip-nome txt-' + raridadeItem(o.id) }, `${nomeItem(o.id, r)}  →  +${prox}`));
  const a = valoresItem(o.id, r), b = valoresItem(o.id, prox), tab = el('div', { class: 'tip-stats' });
  for (const k in b) {
    const d = b[k] - (a[k] || 0);
    tab.append(el('span', {}, `${ICONE_ST[k] || '•'} ${NOME_ST[k] || k}`), el('b', {}, `${fmtN(a[k] || 0)} → ${fmtN(b[k])}`), el('i', { class: 'tip-pos' }, d > 0 ? `▲ +${fmtN(d)}` : ''));
  }
  box.append(tab);
  if (typeof poderItem === 'function') {
    const pa = poderItem(o.id, r), pb = poderItem(o.id, prox);
    box.append(el('div', { class: 'tip-poder' }, el('span', {}, '⚔️ Power '), el('b', {}, `${fmtN(pa)} → ${fmtN(pb)}`), pb > pa ? el('i', { class: 'tip-pos' }, ` ▲ +${fmtN(pb - pa)}`) : ''));
  }
  const c = custoRefino(o.id, r);
  box.append(el('small', { class: 'tip-cmp' }, c.chance >= 1 ? '✅ Guaranteed upgrade: it always works.' : `🎲 Chance of success: ${Math.round(c.chance * 100)}%`));
  if (c.chance < 1) {
    if (c.cai && r > 0) {
      const pv = typeof poderItem === 'function' ? poderItem(o.id, r - 1) : null;
      box.append(el('small', { class: 'tip-neg' }, `💥 If it fails, it drops back to +${r - 1}` + (pv != null ? ` (⚔️ Power ${fmtN(poderItem(o.id, r))} → ${fmtN(pv)})` : '') + '. The item never breaks.'));
    } else box.append(el('small', { class: 'tip-cmp' }, '💥 If it fails, the item stays the same (you only spend the coins and materials).'));
  }
  if (o.onde === 'equip') box.append(el('small', { class: 'tip-dica' }, 'You\'re using this item: the upgrade works right away.'));
  return box;
}
{
  const _modalRefinoPv = modalRefino;
  modalRefino = function (npc, msg) {
    const out = _modalRefinoPv.apply(this, arguments);
    // as linhas vêm na mesma ordem de itensRefinaveis() (é o que o armazem_forja.js também usa)
    const itens = itensRefinaveis(), linhas = document.querySelectorAll('#modalConteudo .lista .linha-item');
    if (linhas.length === itens.length && typeof comTip === 'function')
      itens.forEach((o, k) => { if (o.r < REFINO_MAX && ITENS[o.id]) comTip(linhas[k], () => tipRefino(o)); });
    return out;
  };
}
