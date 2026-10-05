/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   👁️ OLHAR (SHIFT + CLIQUE), como o "Look" do Tibia (v400; dono: "no Tibia, Shift+click inspeciona o item, dando a
   descrição dele... verifique se conseguimos aplicar"). Uma linha no chat descreve o que você clicou:
   - itens (mochila, equipamento, barra de atalhos, mochila das costas): nome (+refino), raridade, atributos, nível,
     peso e a descrição;
   - no mapa: adversários (nível, chefão, fôlego), personagens (o que fazem: loja, missão), outros jogadores (nível,
     guilda), você mesmo e as placas.
   No celular não existe Shift: segurar o dedo continua como antes. Carregar POR ÚLTIMO.
   ============================================================ */
const olhRar = id => { try { const r = typeof raridadeItem === 'function' ? raridadeItem(id) : null; return r && RARIDADE[r] ? RARIDADE[r].nome : ''; } catch (e) { return ''; } };
const olhNum = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
function olhItem(id, r, q) {
  const it = ITENS[id]; if (!it) return;
  const partes = [];
  const rar = olhRar(id); if (rar) partes.push(rar);
  if (it.tipo === 'equip') { try { const st = statsItemTxt(id, r || 0); if (st && st !== 'sem atributos') partes.push(st); } catch (e) { } }
  if (it.tipo === 'bolsa') partes.push(`${it.espacos} espaços`);
  if (it.lvl > 1) partes.push(`nível ${it.lvl}`);
  try { const p = pesoItem(id) * (q || 1); if (p) partes.push(`pesa ${olhNum(p)}`); } catch (e) { }
  if (it.venda > 0) partes.push(`vende por ${fmt(it.venda * (r ? 1 + 0.5 * r : 1))}${q > 1 ? ' cada' : ''}`);
  const nome = (q > 1 ? `${fmt(q)}x ` : '') + (typeof nomeItem === 'function' ? nomeItem(id, r) : it.nome);
  log(`👁️ Você vê: ${nome}${partes.length ? ` (${partes.join(' · ')})` : ''}.${it.desc ? ' ' + it.desc : ''}`, 'l-info');
  som('equip');
}
function olhEnt(e) {
  if (!e) return false;
  if (e === G.p) { const s = G.save, cl = CLASSES[s.classe]; log(`👁️ Você vê você mesmo: ${s.nome}, nível ${fmt(s.nivel)}${cl ? `, ${cl.nome}` : ''}.`, 'l-info'); return true; }
  const d = e.d || {};
  if (e.hp !== undefined) { // adversário
    const nv = typeof nivelMonstro === 'function' ? nivelMonstro(d) : d.nivel;
    const vida = d.hp ? Math.round(e.hp / d.hp * 100) : 100, dif = nv - G.save.nivel;
    const forca = d.treino ? 'boneco de treino' : dif >= 8 ? 'muito forte para você' : dif >= 3 ? 'forte' : dif <= -10 ? 'fraquinho para você' : 'do seu tamanho';
    log(`👁️ Você vê ${d.nome}${d.treino ? '' : ` (nível ${fmt(nv)}${d.chefe ? ', chefão' : ''})`}: ${forca}. Fôlego ${vida}%.`, 'l-info'); return true;
  }
  // personagem
  const n = (typeof NPCS !== 'undefined' && NPCS[e.id]) || d, faz = [];
  if (Array.isArray(n.loja)) faz.push('vende coisas');
  try { const qs = MISSOES.filter(q => q.npc === e.id); if (qs.some(q => statusMissao(q) === 'pronta')) faz.push('tem missão para entregar ✔'); else if (qs.some(q => statusMissao(q) === 'disponivel')) faz.push('tem missão nova ❗'); else if (qs.length) faz.push('dá missões'); } catch (er) { }
  log(`👁️ Você vê ${n.nome || d.nome || 'alguém'}${faz.length ? ` — ${faz.join(', ')}` : ''}.`, 'l-info'); return true;
}
// itens: Shift + clique em qualquer quadradinho
document.addEventListener('click', ev => {
  if (!ev.shiftKey || !G.rodando || !G.save) return;
  const s = G.save, t = ev.target.closest ? ev.target : null; if (!t) return;
  let id = null, r = 0, q = 1;
  const sl = t.closest('.mochila-grade .slot[data-i]'), eq = t.closest('.eq-slot[data-slot]'), hb = t.closest('#hotbar .slot'), co = t.closest('.mt-costas');
  if (sl) { const e = s.mochila[+sl.dataset.i]; if (e) { id = e.id; r = e.r || 0; q = e.q || 1; } }
  else if (eq) { id = s.equip[eq.dataset.slot]; r = (s.equipR || {})[eq.dataset.slot] || 0; }
  else if (co && s.costas) id = s.costas.id;
  else if (hb) { const k = [...hb.parentElement.children].indexOf(hb), h = s.hotbar[k]; if (h && h.t === 'i') { id = h.id; q = contaItem(h.id); } else if (h && h.t === 'd' && DRIBLES[h.id]) { ev.preventDefault(); ev.stopImmediatePropagation(); log(`👁️ Você vê o drible ${DRIBLES[h.id].nome}: ${DRIBLES[h.id].desc || ''}`, 'l-info'); return; } }
  if (!id) return;
  ev.preventDefault(); ev.stopImmediatePropagation(); olhItem(id, r, q);
}, true);
// mapa: Shift + clique (antes de marcar alvo ou andar)
{
  const prende = () => {
    if (typeof CV === 'undefined' || !CV) { setTimeout(prende, 500); return; } // (o canvas do mapa só existe depois do "Continuar")
    CV.addEventListener('mousedown', ev => {
      if (ev.button !== 0 || !ev.shiftKey || !G.rodando || G.pausado) return;
      ev.preventDefault(); ev.stopImmediatePropagation();
      try {
        // outro jogador (mundo compartilhado / caça em grupo)
        const j = typeof mjAlvo === 'function' ? mjAlvo(ev) : null;
        if (j) { const o = typeof MO !== 'undefined' && MO.outros && MO.outros.get(j.id); const tag = o && o.guilda ? ` [${o.guilda}]` : ''; log(`👁️ Você vê ${j.apelido}${tag} (nível ${fmt(j.nivel || 1)}), um jogador.`, 'l-info'); return; }
        const w = mundoDoMouse(ev), e = entNoPonto(w);
        if (e) { olhEnt(e); return; }
        const p = G.p, h = alturaEnt(p); if (Math.abs(w.x - p.x) < h * 0.4 && w.y > p.y - h && w.y < p.y + 0.2) { olhEnt(p); return; }
        const tx = Math.floor(w.x), ty = Math.floor(w.y);
        const pl = (G.mapa.placas || []).find(q => q.x === tx && q.y === ty); if (pl) { log(`👁️ Você vê uma placa: "${pl.texto}"`, 'l-info'); return; }
        const o = G.mapa.obj[ty * G.mapa.w + tx]; if (o && o.t && o.t !== 'x') { log(`👁️ Você vê ${String(o.t).replace(/_/g, ' ')}.`, 'l-info'); return; }
        log(`👁️ Você vê o chão${G.mapa.nome ? ` de ${G.mapa.nome.split(' —')[0]}` : ''}.`, 'l-info');
      } catch (er) { }
    }, true);
  };
  prende();
}
window.OLHAR = { olhItem, olhEnt };
