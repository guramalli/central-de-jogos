/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏁 MODOS FINALIZADOS (v324, pedido do dono: "fui campeão do mundo no clube, não tem mais o que fazer,
   coloque como finalizado; faça o mesmo na carreira").
   - Clube FINALIZADO: campeão do Mundial Interclubes (flag campeao_mundial_interclubes).
   - Carreira FINALIZADA: fama máxima (👑 Lenda Mundial 3.000) OU campeão da Liga da Coroa, a liga do topo (v325).
   O que muda: selo dourado "FINALIZADO" no topo da janela do modo (com o resumo da conquista), ✅ nos botões do menu
   e, na primeira vez, uma tela de comemoração. O modo continua jogável para quem quiser colecionar mais títulos.
   Zerou os dois → lembra que a 🕴️ Agência (modo Empresário) está liberada.
   Carregar DEPOIS de agencia.js.
   ============================================================ */
function zerouModoClube() { return !!(G.save && G.save.flags && G.save.flags.campeao_mundial_interclubes); }
// Carreira zerada: fama máxima (👑 Lenda Mundial 3.000/3.000) OU campeão da Liga da Coroa (mesma regra da Agência)
function zerouModoCarreira() {
  try { const c = G.save && G.save.carreira; return !!(c && ((c.fama || 0) >= CARR_FAMA_MAX || (c.titulosLiga || []).some(t => t.liga === CARR_TIERS[CARR_TIER_MAX].liga))); } catch (e) { return false; }
}
function fimCarreiraComo() {
  const c = G.save.carreira, coroa = CARR_TIERS[CARR_TIER_MAX].liga, n = (c.titulosLiga || []).filter(t => t.liga === coroa).length;
  const fama = (c.fama || 0) >= CARR_FAMA_MAX;
  return [fama ? `👑 Lenda Mundial com a fama máxima (${fmt(CARR_FAMA_MAX)})` : '', n ? `campeão(ã) da ${coroa}${n > 1 ? ` (${n}×)` : ''}` : ''].filter(Boolean).join(' e ');
}
function fimDicaAgencia() {
  if (!(zerouModoClube() && zerouModoCarreira())) return '';
  return el('button', { class: 'btn amarelo mini', type: 'button', onclick: () => { if (typeof abreAgencia === 'function') { fechaModal(); abreAgencia(); } } }, '🕴️ Próximo desafio: a Agência (modo Empresário)');
}
function seloFimClube() {
  const t = G.save.time; const mundiais = (t.trofeus || []).filter(x => /Mundial/i.test(x.nome)).length || 1;
  return el('div', { class: 'modo-fim' }, el('div', { class: 'modo-fim-selo' }, 'FINALIZADO'),
    el('div', { class: 'modo-fim-txt' }, el('b', {}, '🏆 Modo Clube zerado!'),
      el('small', {}, `O clube que nasceu na Várzea é campeão do Mundial Interclubes${mundiais > 1 ? ` (${mundiais}×)` : ''}. ${t.titulos || 0} título(s) em ${t.temporada || 1} temporada(s). Pode continuar jogando para encher a sala de troféus.`),
      fimDicaAgencia()));
}
function seloFimCarreira() {
  const c = G.save.carreira, como = fimCarreiraComo();
  return el('div', { class: 'modo-fim' }, el('div', { class: 'modo-fim-selo' }, 'FINALIZADA'),
    el('div', { class: 'modo-fim-txt' }, el('b', {}, '👑 Carreira zerada!'),
      el('small', {}, `${como.charAt(0).toUpperCase() + como.slice(1)}. ${(c.titulosLiga || []).length} título(s) de liga e ${(c.paises || []).length} país(es) na carreira. Pode continuar jogando pelos títulos.`),
      fimDicaAgencia()));
}
(function () {
  // o selo no topo das janelas dos modos
  if (typeof abrirTime === 'function') {
    const _abrirTimeFim = abrirTime;
    abrirTime = function () {
      const r = _abrirTimeFim.apply(this, arguments);
      try { const tabs = document.querySelector('#modalConteudo .tabs-modal'); if (tabs && zerouModoClube() && G.save.time) tabs.before(seloFimClube()); } catch (e) { }
      return r;
    };
  }
  if (typeof abrirCarreira === 'function') {
    const _abrirCarreiraFim = abrirCarreira;
    abrirCarreira = function () {
      const r = _abrirCarreiraFim.apply(this, arguments);
      try { const h = document.querySelector('#modalConteudo .carreira > h2'); if (h && zerouModoCarreira()) h.after(seloFimCarreira()); } catch (e) { }
      return r;
    };
  }
  // ✅ nos botões do menu + a comemoração da primeira vez (espera não ter janela nem outra comemoração aberta)
  function confere() {
    try {
      const s = G.save; if (!s || !s.flags || !G.rodando) return;
      const cl = zerouModoClube(), ca = zerouModoCarreira();
      document.querySelectorAll('[data-abre="time"]').forEach(b => b.classList.toggle('modo-zerado', cl));
      document.querySelectorAll('[data-abre="carreira"]').forEach(b => b.classList.toggle('modo-zerado', ca));
      if (!$('#modal').hidden || document.querySelector('.cm-foto, .ag-show, #historia:not([hidden])')) return;
      const foto = (id, titulo, txt) => (typeof cmFoto === 'function' ? cmFoto(id, titulo, txt) : banner(titulo, txt));
      const extra = cl && ca ? ' E agora que você zerou o Clube e a Carreira, a 🕴️ Agência (modo Empresário) está liberada: ☰ Mais → Agência!' : '';
      if (cl && !s.flags.fim_clube_visto) { s.flags.fim_clube_visto = true; salvar(); foto('cap_clube_mundial', '🏁 MODO CLUBE FINALIZADO!', 'Do campinho de terra ao título mundial: você zerou o modo Clube! A janela do seu time agora mostra o selo FINALIZADO. Dá para continuar jogando para colecionar mais troféus.' + extra); try { som('nivel'); } catch (e) { } return; }
      if (ca && !s.flags.fim_carreira_visto) { s.flags.fim_carreira_visto = true; salvar(); foto('cap_carreira_fim', '👑 CARREIRA FINALIZADA!', `${fimCarreiraComo().replace(/^./, x => x.toUpperCase())}: não existe nada acima disso. Você zerou a Carreira! Dá para continuar jogando por mais títulos.` + extra); try { som('nivel'); } catch (e) { } }
    } catch (e) { }
  }
  setInterval(confere, 4000);
  const st = document.createElement('style');
  st.textContent = `
  .modo-fim { position: relative; display: flex; align-items: center; gap: 14px; margin: 4px 0 10px; padding: 10px 14px; border-radius: 12px; border: 3px solid #d8a020; background: linear-gradient(135deg, #fff4c2, #ffe08a 60%, #ffd35a); box-shadow: inset 0 0 0 2px rgba(255,255,255,.6), 0 3px 8px rgba(0,0,0,.15); overflow: hidden; }
  .modo-fim::after { content: ''; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.55) 45%, transparent 60%); transform: translateX(-100%); animation: modoFimBrilho 4.5s ease-in-out infinite; pointer-events: none; }
  @keyframes modoFimBrilho { 0%, 55% { transform: translateX(-100%); } 85%, 100% { transform: translateX(100%); } }
  .modo-fim-selo { flex-shrink: 0; padding: 4px 12px; border: 4px double #2a8a3a; border-radius: 10px; color: #2a8a3a; font-weight: 900; font-size: 20px; letter-spacing: .08em; transform: rotate(-8deg); background: rgba(255,255,255,.75); }
  .modo-fim-txt { display: flex; flex-direction: column; gap: 3px; align-items: flex-start; }
  .modo-fim-txt b { font-size: 17px; color: #5a3a08; }
  .modo-fim-txt small { color: #5a3a08; }
  .modo-zerado { position: relative; }
  .modo-zerado::after { content: '✓'; position: absolute; top: -5px; right: -5px; width: 15px; height: 15px; border-radius: 50%; background: #2aa84a; color: #fff; font-size: 10px; font-weight: 900; line-height: 13px; text-align: center; border: 1.5px solid #fff; box-sizing: border-box; box-shadow: 0 1px 2px rgba(0,0,0,.4); pointer-events: none; }
  @media (max-width: 560px) { .modo-fim { flex-direction: column; align-items: flex-start; } .modo-fim-selo { font-size: 16px; } }
  @media (prefers-reduced-motion: reduce) { .modo-fim::after { animation: none; } }
  `;
  document.head.append(st);
})();
