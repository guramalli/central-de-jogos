/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎯 "AGORA:" (v351 — "os primeiros 10 minutos", item 1 do dono)
   A seta amarela já apontava ONDE ir (objetivoAtual), mas nada dizia O QUE fazer lá. Agora uma etiqueta sempre
   visível, junto da de Missões, diz em palavras o mesmo objetivo da seta:
     ✔ Entregue "Missão" para Fulano · Passe por Pombo Folgado (12/30) — Vila · Fale com Seu Zé: missão nova "..."
     · sem nada para fazer: "Suba para o nível N: chegam missões novas".
   Tocar abre o menu de Missões. Durante o tutorial ela some (o tutorial já explica cada passo).
   Carregar DEPOIS de rastreador.js e ondeachar.js.
   ============================================================ */
function objetivoTexto() {
  const s = G.save; if (!s) return null;
  if (typeof TUTORIAL !== 'undefined' && s.tut < TUTORIAL.length) return null;
  const npc = q => (NPCS[q.npc] || {}).nome || 'quem deu a missão';
  for (const q of MISSOES) if (statusMissao(q) === 'pronta') return { txt: `✔ Entregue "${q.titulo}" para ${npc(q)}`, pronta: true };
  for (const q of MISSOES) if (statusMissao(q) === 'ativa') {
    const [a, b] = progressoMissao(q); let onde = '';
    try { if (q.req.kill && typeof ondeNasce === 'function') { const m = ondeNasce(q.req.kill); if (m) onde = ' — ' + (MAPAS_DEF[m] ? nomeLugarCurto(m) : m); } } catch (e) { }
    return { txt: `${descMissao(q) || q.titulo} (${a}/${b})${onde}` };
  }
  for (const q of MISSOES) if (statusMissao(q) === 'disponivel') return { txt: `Fale com ${npc(q)}: missão nova "${q.titulo}"` };
  let prox = null; for (const q of MISSOES) if (statusMissao(q) === 'nivel' && (!prox || (q.lvl || 0) < (prox.lvl || 0))) prox = q;
  if (prox) return { txt: `Suba para o nível ${prox.lvl}: chegam missões novas` };
  return null;
}
{
  const _rastAgora = atualizaRastreador;
  atualizaRastreador = function () {
    const r = _rastAgora.apply(this, arguments);
    const R = $('#rastreador'); if (!R || !G.save) return r;
    const o = objetivoTexto(); if (!o) return r;
    const b = el('button', { class: 'btn mini obj-agora' + (o.pronta ? ' pronta' : ''), type: 'button', title: 'O que fazer agora (a seta amarela leva até lá). Toque para ver todas as missões.',
      onclick: ev => { ev.stopPropagation(); modalMissoes(); } }, el('b', {}, '🎯 Agora: '), el('span', {}, o.txt));
    const et = R.querySelector('.rast-etiqueta');
    if (et) { if (getComputedStyle(R).flexDirection === 'column-reverse') et.before(b); else et.after(b); }
    else R.append(b);
    return r;
  };
  const css = document.createElement('style');
  css.textContent = `#rastreador .obj-agora { pointer-events: auto; align-self: flex-start; margin: 3px 0; max-width: 100%; text-align: left; font-size: 13px; padding: 4px 10px;
    background: rgba(30,18,46,.88); color: #fff4d0; border: 2px solid #ffd23f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #rastreador .obj-agora b { color: #ffd23f; }
  #rastreador .obj-agora.pronta { border-color: #7dff9a; box-shadow: 0 0 0 2px rgba(125,255,154,.35); }`;
  document.head.append(css);
}
/* v410 (dono: "não achei onde fica o Titã do Trovão"): tocar no cartão de uma missão de VENCER (ou de juntar item / falar com
   alguém) no rastreador abre ali mesmo o bloco "📍 Onde achar e como chegar" (como_chegar.js); tocar de novo fecha.
   Missão pronta continua como antes (a seta leva até quem entrega). A escolha fica aberta enquanto a missão estiver ativa. */
const OA_CC_ABERTO = new Set();
{
  const _rastOaCC = atualizaRastreador;
  atualizaRastreador = function () {
    const r = _rastOaCC.apply(this, arguments);
    try {
      const R = $('#rastreador'); if (!R || !G.save || typeof blocoComoChegar !== 'function') return r;
      for (const card of [...R.querySelectorAll(':scope > .rast-q')]) {
        if (card.classList.contains('pronta')) continue;
        const tit = (card.querySelector('b') || {}).textContent; const q = tit && MISSOES.find(x => x.titulo === tit && statusMissao(x) === 'ativa'); if (!q) continue;
        const rq = q.req || {}; if (!(rq.kill || rq.item || rq.itens || rq.fala)) continue;
        // o cartão do ui.js leva a seta até quem deu a missão; aqui o toque mostra onde achar (cópia sem o clique antigo)
        const novo = card.cloneNode(true); card.replaceWith(novo);
        novo.title = 'Toque para ver onde achar e como chegar';
        const onde = novo.querySelector('.rast-onde'); if (onde) onde.textContent = onde.textContent.replace(/ · clique para ir$/, '') + (OA_CC_ABERTO.has(q.id) ? ' · toque para fechar' : ' · toque: onde achar e como chegar');
        if (OA_CC_ABERTO.has(q.id)) { const b = blocoComoChegar(q, false); if (b) { b.classList.add('oa-cc'); novo.append(b); } }
        novo.addEventListener('click', ev => {
          ev.stopPropagation();
          if (OA_CC_ABERTO.has(q.id)) OA_CC_ABERTO.delete(q.id); else { OA_CC_ABERTO.clear(); OA_CC_ABERTO.add(q.id); }
          G.uiSujo = true;
        });
      }
      for (const id of [...OA_CC_ABERTO]) { const e = G.save.quests[id]; if (!e || e.s !== 'ativa') OA_CC_ABERTO.delete(id); }
    } catch (e) { console.warn('rastreador como chegar', e); }
    return r;
  };
  const css = document.createElement('style');
  css.textContent = `#rastreador .rast-q .como-chegar.oa-cc { font-size: 12px; margin: 4px 0 0; padding: 4px 6px; background: rgba(255,255,255,.12); color: inherit; max-width: 330px; }
  #rastreador .rast-q .como-chegar.oa-cc > b { font-size: 12.5px; }`;
  document.head.append(css);
}
