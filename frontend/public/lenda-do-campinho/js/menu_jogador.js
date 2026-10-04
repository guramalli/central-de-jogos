/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🖱️ MENU DO JOGADOR (v384; dono: "chamar amigo para caçar deveria funcionar com o botão direito em cima do jogador, você
   teria um menu com algumas opções... uma delas deveria ser chamar para party")
   Botão direito (ou segurar o dedo, no celular) em cima de OUTRO jogador no mundo compartilhado:
   👥 Chamar para o grupo (cria o seu grupo se ainda não tem; vale qualquer jogador na faixa de nível) · ➕ Pedir amizade ·
   🛡️ Convidar para a guilda (líder/vice, só amigos) · 🔇 Silenciar.
   Carregar DEPOIS de mundo_online.js, caca_grupo.js e guilda.js.
   ============================================================ */
const MJ = { aberto: null };
const mjLigado = () => typeof moLigado === 'function' && moLigado() && !!(MO.mapa || (typeof CG !== 'undefined' && CG.remotos.size));
// quem está debaixo do cursor (os jogadores do mundo e os colegas de grupo na caça)
function mjAlvo(ev) {
  if (typeof mundoDoMouse !== 'function') return null;
  const w = mundoDoMouse(ev), lista = [];
  if (typeof MO !== 'undefined') for (const [id, o] of MO.outros) lista.push({ id, ent: o.ent, apelido: o.apelido, nivel: o.nivel });
  if (typeof CG !== 'undefined') for (const [id, r] of CG.remotos) { const m = cgMembro(id); lista.push({ id, ent: r.ent, apelido: m ? m.apelido : '', nivel: m ? m.nivel : 1 }); }
  let melhor = null;
  for (const a of lista) {
    const e = a.ent, h = alturaEnt(e), wd = h * 0.4 + 0.15;
    if (w.x > e.x - wd && w.x < e.x + wd && w.y > e.y - h - 0.3 && w.y < e.y + 0.3) if (!melhor || e.y > melhor.ent.y) melhor = a;
  }
  return melhor;
}
function mjFecha() { const m = document.getElementById('mjMenu'); if (m) m.remove(); MJ.aberto = null; }
async function mjAbre(a, cx, cy) {
  mjFecha();
  const s = G.save, eu = PORTAL.contaId;
  const item = (txt, fn, off, dica) => { const b = el('button', { class: 'btn mini', type: 'button', disabled: off ? 'disabled' : null, title: dica || '' }, txt); if (!off) b.onclick = () => { mjFecha(); fn(); }; return b; };
  // grupo
  const naFaixa = typeof cgFaixaOk === 'function' ? cgFaixaOk(a.nivel || 1, s.nivel) : true;
  const g = typeof CG !== 'undefined' ? CG.grupo : null, souLider = !g || g.lider === eu, jaNoGrupo = !!(g && g.membros.some(m => m.id === a.id));
  const fx = typeof cgFaixaDe === 'function' ? cgFaixaDe(s.nivel) : null;
  const grupo = jaNoGrupo ? item('👥 Já está no seu grupo', null, true)
    : !naFaixa ? item('👥 Chamar para o grupo', null, true, fx ? `Nível longe demais: você caça em grupo com os níveis ${fx.de} a ${fx.ate}` : '')
    : !souLider ? item('👥 Chamar para o grupo', null, true, 'Só o líder do seu grupo chama')
    : item('👥 Chamar para o grupo', () => mjChamaGrupo(a));
  // amizade (confere quem já é amigo)
  const amizade = el('span', {}, item('➕ Pedir amizade', () => typeof amgPedeAmizade === 'function' && amgPedeAmizade({ targetUserId: a.id }, ok => { if (ok && typeof MO !== 'undefined') MO.amigos = null; })));
  // guilda (líder/vice; o servidor só deixa convidar amigo)
  const gl = typeof GLD !== 'undefined' && GLD.dados && GLD.dados.guilda ? GLD.dados : null, podeGuilda = gl && ['lider', 'vice'].includes(gl.eu.papel);
  const guilda = el('span', {}, podeGuilda ? item('🛡️ Convidar para a guilda', () => mjGuilda(a)) : '');
  const mudo = typeof MO_MUDOS !== 'undefined' && MO_MUDOS.has(a.id);
  const menu = el('div', { id: 'mjMenu', role: 'menu' },
    el('b', { class: 'mj-nome' }, `${a.apelido} · Nv ${a.nivel}`), grupo, amizade, guilda,
    item(mudo ? '🔈 Mostrar de novo' : '🔇 Silenciar', () => { mudo ? MO_MUDOS.delete(a.id) : MO_MUDOS.add(a.id); try { localStorage.setItem('rac_mundo_mudos', JSON.stringify([...MO_MUDOS].slice(-300))); } catch (e) { } avisoJogo(mudo ? `🔈 ${a.apelido} aparece de novo.` : `🔇 ${a.apelido} foi silenciado (só para você).`); }));
  document.body.append(menu);
  const W = window.innerWidth, H = window.innerHeight, r = menu.getBoundingClientRect();
  menu.style.left = Math.min(cx, W - r.width - 6) + 'px'; menu.style.top = Math.min(cy, H - r.height - 6) + 'px';
  MJ.aberto = a.id;
  // depois de abrir: já é amigo? (troca o botão)
  try {
    const ids = typeof moAmigosIds === 'function' ? await moAmigosIds() : new Set();
    if (MJ.aberto !== a.id) return;
    if (ids.has(String(a.id))) { amizade.innerHTML = ''; amizade.append(item('🤝 Vocês já são amigos (ou tem pedido)', null, true)); }
    else if (podeGuilda) { guilda.innerHTML = ''; guilda.append(item('🛡️ Convidar para a guilda', null, true, 'Só dá para convidar amigos: peça amizade primeiro')); }
  } catch (e) { }
}
async function mjChamaGrupo(a) {
  try { await cgConecta(); } catch (e) { return avisoJogo('👥 Não deu para conectar agora.'); }
  if (!CG.grupo) {
    const r = await cgPede('grupo-criar', { perfil: cgPerfil(), mapa: G.mapa && G.mapa.id }); if (r.erro) return avisoJogo('👥 ' + r.erro);
    CG.ondeEnviado = G.mapa && G.mapa.id; cgAtualizaGrupo(r.grupo);
  }
  const r2 = await cgPede('grupo-convidar', { amigoId: a.id });
  if (r2.erro) return avisoJogo('👥 ' + r2.erro);
  som('moeda'); log(`👥 Você chamou ${a.apelido} para caçar em grupo (código ${CG.grupo.codigo}). Quando você entrar numa área de caça, o grupo vai junto!`, 'l-xp');
  avisoJogo(`👥 Convite enviado para ${a.apelido}!`);
}
async function mjGuilda(a) {
  const r = await gldPede('POST', '/convidar', { userId: a.id });
  avisoJogo(r.ok ? `🛡️ Convite da guilda enviado para ${a.apelido}!` : '🛡️ ' + gldErro(r));
}
// botão direito em cima de um jogador (antes do clique normal, que andaria até lá)
{
  const prende = () => {
    if (typeof CV === 'undefined' || !CV) return setTimeout(prende, 500);
    CV.addEventListener('mousedown', ev => {
      if (ev.button !== 2 || !G.rodando || !mjLigado()) return;
      const a = mjAlvo(ev); if (!a) return;
      ev.preventDefault(); ev.stopImmediatePropagation(); mjAbre(a, ev.clientX, ev.clientY);
    }, true);
    // celular: segurar o dedo em cima do jogador
    let toque = null;
    CV.addEventListener('touchstart', ev => {
      if (!mjLigado() || ev.touches.length !== 1) return;
      const t = ev.touches[0]; toque = { x: t.clientX, y: t.clientY, timer: setTimeout(() => { const a = mjAlvo({ clientX: toque.x, clientY: toque.y }); if (a) mjAbre(a, toque.x, toque.y); }, 600) };
    }, { passive: true });
    const solta = ev => { if (!toque) return; const t = ev.touches && ev.touches[0]; if (!t || Math.hypot(t.clientX - toque.x, t.clientY - toque.y) > 12) { clearTimeout(toque.timer); toque = null; } };
    CV.addEventListener('touchmove', solta, { passive: true });
    CV.addEventListener('touchend', () => { if (toque) { clearTimeout(toque.timer); toque = null; } }, { passive: true });
  };
  prende();
  document.addEventListener('mousedown', ev => { if (MJ.aberto && !ev.target.closest('#mjMenu')) mjFecha(); }, true);
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && MJ.aberto) mjFecha(); });
  const css = document.createElement('style');
  css.textContent = `#mjMenu { position: fixed; z-index: 90; display: flex; flex-direction: column; gap: 4px; min-width: 210px; padding: 8px; background: #fff7e6; border: 3px solid var(--madeira, #8a4b24); border-radius: 10px; box-shadow: 0 6px 18px rgba(0,0,0,.35); }
  #mjMenu .btn { width: 100%; justify-content: flex-start; text-align: left; } #mjMenu .mj-nome { padding: 2px 4px 4px; color: #4a2a10; }
  #mjMenu span { display: contents; }`;
  document.head.append(css);
}
window.MENU_JOGADOR = { mjAlvo, mjAbre, mjFecha };
