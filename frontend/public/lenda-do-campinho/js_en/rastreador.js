/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
// v410.8 (desempenho): getComputedStyle aqui obrigava o navegador a recalcular o estilo da página a cada redesenho do
// rastreador (~2 ms numa vitória). A direção da lista só muda com o layout: guarda e confere de novo só se ele mudou (ou a cada 2 s).
let RAST_DIR = { sig: '', t: 0, rev: false };
function rastColRev(R) {
  const sig = innerWidth + 'x' + innerHeight + '|' + document.body.className + '|' + R.className + '|' + (R.parentElement ? R.parentElement.className : ''), ag = performance.now();
  if (sig !== RAST_DIR.sig || ag - RAST_DIR.t > 2000) RAST_DIR = { sig, t: ag, rev: getComputedStyle(R).flexDirection === 'column-reverse' };
  return RAST_DIR.rev;
}
/* ============================================================
   📜 RASTREADOR DE MISSÕES RECOLHIDO (v155)
   Os cartões de missão/desafio ocupavam muito da tela. Agora:
   - fica só uma etiqueta "📜 Missões (3) · ✔ 1 pronta";
   - v291: a lista NÃO abre mais sozinha (abria a cada adversário vencido ou item pego e cobria a tela):
     quando o progresso muda, só a etiqueta dá uma piscada; a pessoa abre se quiser;
   - clicar na etiqueta abre/fecha (a escolha fica guardada neste aparelho).
   Dica e tutorial continuam aparecendo normalmente.
   Carregar DEPOIS de ui.js.
   ============================================================ */
const RAST_PISCA_MS = 1600;
let RAST_FIXO = false; try { RAST_FIXO = localStorage.getItem('rac_rast_aberto_v1') === '1'; } catch (e) { }
let RAST_ASSIN = null, RAST_ATE = 0; // RAST_ATE: até quando a etiqueta pisca
{
  const _atualizaRastreadorR = atualizaRastreador;
  atualizaRastreador = function () {
    const r = _atualizaRastreadorR.apply(this, arguments);
    const R = $('#rastreador'); if (!R) return r;
    const cartoes = [...R.querySelectorAll(':scope > .rast')]; if (!cartoes.length) { RAST_ASSIN = null; return r; }
    // mudou algum número? a etiqueta pisca (a lista só abre se a pessoa clicar)
    const assin = cartoes.map(c => { const o = c.querySelector('.rast-onde'); return o ? c.textContent.replace(o.textContent, '') : c.textContent; }).join('|'); // v238: trocar de mapa ("aqui neste mapa") não abre a lista
    if (RAST_ASSIN !== null && assin !== RAST_ASSIN) RAST_ATE = (G.agora || 0) + RAST_PISCA_MS;
    RAST_ASSIN = assin;
    const prontas = cartoes.filter(c => c.classList.contains('pronta')).length;
    const aberto = RAST_FIXO, pisca = !aberto && (G.agora || 0) < RAST_ATE;
    const etiqueta = el('button', { class: 'btn mini rast-etiqueta' + (prontas ? ' tem-pronta' : '') + (pisca ? ' pisca' : ''), type: 'button', title: aberto ? 'Hide missions' : 'Show missions',
      onclick: ev => { ev.stopPropagation(); RAST_FIXO = !aberto; RAST_ATE = 0; try { localStorage.setItem('rac_rast_aberto_v1', RAST_FIXO ? '1' : '0'); } catch (e) { } G.uiSujo = true; } },
      `📜 Missions (${cartoes.length})${prontas ? ` · ✔ ${prontas} mission${prontas > 1 ? 's' : ''} ready` : ''} ${aberto ? '▾' : '▸'}`);
    if (!aberto) cartoes.forEach(c => c.remove());
    // a etiqueta fica colada na lista (a lista cresce "para cima" no computador: column-reverse)
    const primeiro = R.querySelector(':scope > .rast');
    if (rastColRev(R)) R.insertBefore(etiqueta, primeiro || null); else R.append(etiqueta);
    return r;
  };
  // a piscada acaba: redesenha a etiqueta
  const _atualizaR = atualiza;
  atualiza = function () { const r = _atualizaR.apply(this, arguments); if (RAST_ATE && (G.agora || 0) >= RAST_ATE) { RAST_ATE = 0; G.uiSujo = true; } return r; };
}
{
  const st = document.createElement('style');
  st.textContent = `#rastreador .rast-etiqueta { pointer-events: auto; align-self: flex-start; margin: 3px 0; opacity: .92; font-size: 13px; padding: 4px 10px; }
  #rastreador .rast-etiqueta.tem-pronta { background: #3aa04a; color: #fff; box-shadow: 0 0 0 2px #ffe14a; }
  #rastreador .rast-etiqueta.pisca { animation: rastPisca .8s ease-in-out 2; }
  @keyframes rastPisca { 0%, 100% { transform: scale(1); filter: none; } 50% { transform: scale(1.07); filter: brightness(1.25); box-shadow: 0 0 0 3px #ffe14a; } }
  #rastreador .rast-q { pointer-events: auto; cursor: pointer; }
  #rastreador .rast-q:hover { filter: brightness(1.06); box-shadow: 0 0 0 2px #ffe14a, 0 2px 0 rgba(0,0,0,.3); }
  #rastreador .rast-onde { font-size: 11.5px; opacity: .85; margin-top: 2px; }`;
  document.head.append(st);
}

/* ---------- v155: nível 25 → o botão da Carreira pisca até o jogador abrir a Carreira ---------- */
function guiaCarreira() {
  const s = typeof G !== 'undefined' && G.save; if (!s) return;
  const quer = s.nivel >= (typeof CARR_NIVEL_MIN !== 'undefined' ? CARR_NIVEL_MIN : 25) && !(s.carreira && s.carreira.ativa) && !(s.flags && s.flags.abriu_carreira);
  document.querySelectorAll('[data-abre="carreira"]').forEach(b => b.classList.toggle('pulsa-guia', quer));
  const cm = document.getElementById('chMenu'); if (cm) cm.classList.toggle('pulsa-guia', quer); // celular: o ☰ pisca, e lá dentro a Carreira
  document.querySelectorAll('#celMenu .cm-bt').forEach(b => { if (/Carreira|Career/.test(b.textContent)) b.classList.toggle('pulsa-guia', quer); });
}
function abriuCarreira() { if (G.save && G.save.flags) { G.save.flags.abriu_carreira = true; guiaCarreira(); } }
document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-abre="carreira"], #celMenu .cm-bt'); if (b && /Carreira|Career/.test(b.textContent)) abriuCarreira(); }, true);
document.addEventListener('keydown', ev => { if ((ev.key === 'u' || ev.key === 'U') && !/INPUT|TEXTAREA/.test((ev.target && ev.target.tagName) || '')) abriuCarreira(); }, true);
setInterval(guiaCarreira, 1000);
{
  const st = document.createElement('style');
  st.textContent = `@keyframes pulsaGuia { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,225,74,.95); transform: scale(1); } 50% { box-shadow: 0 0 0 7px rgba(255,225,74,0); transform: scale(1.08); } }
  .pulsa-guia { animation: pulsaGuia 1.1s ease-in-out infinite; outline: 3px solid #ffe14a; outline-offset: 1px; position: relative; z-index: 5; }`;
  document.head.append(st);
}
