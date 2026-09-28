/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🔎 ONDE ACHAR (v158): missão que pede itens mostra quem deixa cair
   cada item (e onde ele fica) e quem vende. Calculado das tabelas do jogo
   (loot dos adversários e lojas), então vale para qualquer missão nova.
   Carregar DEPOIS de ui.js, montarias.js, arenas.js e estadios.js.
   ============================================================ */
let ONDE_CACHE = null;
function nomeLugarCurto(id) { try { return getMapa(id).nome.split(' —')[0]; } catch (e) { return id; } }
function ondeNasce(tipo) { // mapa onde esse adversário aparece
  const d = MONSTROS[tipo]; if (!d) return null;
  if (d.arena && typeof ARENA_POR_ID !== 'undefined' && ARENA_POR_ID[d.arena]) return ARENA_POR_ID[d.arena].nome;
  if (d.estadio && typeof EST_POR_ID !== 'undefined' && EST_POR_ID[d.estadio]) return EST_POR_ID[d.estadio].nome;
  const sp = typeof indice === 'function' ? indice().spawn[tipo] : null; return sp ? nomeLugarCurto(sp.mapa) : null;
}
function fontesDoItem(id) {
  if (!ONDE_CACHE) ONDE_CACHE = {};
  const chave = id + '@' + ((G.save && G.save.nivel) || 1); if (ONDE_CACHE[chave]) return ONDE_CACHE[chave];
  const drops = [];
  for (const [tipo, d] of Object.entries(MONSTROS)) for (const l of (d.loot || [])) if (l[0] === id && l[1] > 0) {
    const lugar = ondeNasce(tipo); if (!lugar) continue; // quem não aparece em lugar nenhum não ajuda
    drops.push({ tipo, nome: d.nome, lugar, ch: l[1], nivel: d.nivel || (typeof nivelMonstro === 'function' ? nivelMonstro(d) : 0) || 0 });
  }
  // o que ajuda mais primeiro: adversário comum (chefão por último), perto do nível do jogador, e que deixa cair mais
  const nv = (G.save && G.save.nivel) || 1;
  const nota = x => (MONSTROS[x.tipo].chefe ? 1000 : 0) + Math.abs(x.nivel - nv) * (x.nivel > nv + 10 ? 3 : 1) - x.ch * 60;
  drops.sort((a, b) => nota(a) - nota(b));
  if (drops.some(x => x.nivel <= nv + 25)) for (let k = drops.length - 1; k >= 0; k--) if (drops[k].nivel > nv + 40) drops.splice(k, 1); // tem opção perto do seu nível: some a de muito longe
  const lojas = [];
  for (const [nid, n] of Object.entries(NPCS)) if (Array.isArray(n.loja) && n.loja.includes(id)) { const o = typeof indice === 'function' ? indice().npc[nid] : null; lojas.push({ nome: n.nome, lugar: o ? nomeLugarCurto(o.mapa) : '' }); }
  return (ONDE_CACHE[chave] = { drops, lojas });
}
const freqTxt = ch => ch >= 0.2 ? 'cai bastante' : ch >= 0.05 ? 'às vezes' : 'raro';
function itensDaMissao(q) { const r = q.req || {}; return r.itens ? r.itens.map(([id, n]) => [id, n]) : r.item ? [[r.item, r.n]] : []; }
// um bloco "Onde achar" com uma linha por item
function blocoOndeAchar(q, compacto) {
  const itens = itensDaMissao(q).filter(([id]) => ITENS[id]); if (!itens.length) return null;
  const box = el('div', { class: 'onde-achar' + (compacto ? ' compacto' : '') }, compacto ? null : el('b', {}, '🔎 Onde achar:'));
  for (const [id] of itens) {
    const { drops, lojas } = fontesDoItem(id); const partes = [];
    if (drops.length) partes.push('cai de ' + drops.slice(0, compacto ? 2 : 3).map(x => `${x.nome} (${x.lugar}, ${freqTxt(x.ch)})`).join(', ') + (drops.length > (compacto ? 2 : 3) ? ` e mais ${drops.length - (compacto ? 2 : 3)}` : ''));
    if (lojas.length) partes.push('vende com ' + lojas.slice(0, 2).map(x => x.nome + (x.lugar ? ` (${x.lugar})` : '')).join(', '));
    box.append(el('div', {}, typeof iconeClone === 'function' ? iconeClone(iconeItem(id)) : null, el('span', {}, el('b', {}, ITENS[id].nome + ': '), partes.length ? partes.join('; ') + '.' : 'pergunte por aí: esse vem de missões, baús ou eventos.')));
  }
  return box;
}
// na explicação da missão (quando o NPC oferece)
{
  const _modalMissaoOa = modalMissao;
  modalMissao = function (npc, q) {
    const r = _modalMissaoOa.apply(this, arguments);
    const fala = document.querySelector('#modalConteudo .fala'); const b = blocoOndeAchar(q, false);
    if (fala && b) { const obj = [...fala.querySelectorAll('p')].find(p => /Objetivo/.test(p.textContent)); if (obj) obj.after(b); else fala.append(b); }
    return r;
  };
}
// na janela Missões: as ativas e disponíveis ganham a linha "onde achar" (curta)
{
  const _modalMissoesOa = modalMissoes;
  modalMissoes = function () {
    const r = _modalMissoesOa.apply(this, arguments);
    const linhas = [...document.querySelectorAll('#modalConteudo .lista .linha-item')];
    for (const li of linhas) {
      if (li.classList.contains('bloq') || li.querySelector('.onde-achar')) continue;
      const titulo = (li.querySelector('.nm b') || {}).textContent; const q = MISSOES.find(x => x.titulo === titulo); if (!q) continue;
      const b = blocoOndeAchar(q, true); if (b) (li.querySelector('.nm') || li).append(b);
    }
    return r;
  };
}
{
  const st = document.createElement('style');
  st.textContent = `.onde-achar { margin: 6px 0; padding: 6px 8px; border-radius: 8px; background: rgba(90,160,255,.12); border-left: 3px solid #4a8ae0; font-size: 14px; line-height: 1.35; }
  .onde-achar > div { display: flex; gap: 6px; align-items: flex-start; margin-top: 4px; } .onde-achar img, .onde-achar canvas { width: 22px; height: 22px; flex: none; }
  .onde-achar.compacto { font-size: 12px; padding: 4px 6px; margin-top: 4px; }`;
  document.head.append(st);
}
