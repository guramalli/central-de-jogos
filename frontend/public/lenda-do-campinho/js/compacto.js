/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🧩 VISUAL COMPACTO (v211): interface mais enxuta no computador, para caber
   mais informação e mais janelas (como no Tibia): bordas finas, retrato pequeno,
   barras finas, barra de atalhos e chat mais baixos, coluna lateral mais estreita.
   A tela do jogo cresce com o espaço que sobra (encaixaTela, em layout.js).
   Dá para voltar ao visual antigo no Menu ("Interface clássica"). No celular nada muda.
   Carregar por ÚLTIMO (o estilo precisa vir depois dos outros).
   ============================================================ */
const VISUAL_KEY = 'rac_visual';
function visualCompacto() { try { return localStorage.getItem(VISUAL_KEY) !== 'classico'; } catch (e) { return true; } }
function aplicaVisual(compacto) {
  document.body.classList.toggle('compacto', compacto);
  try { localStorage.setItem(VISUAL_KEY, compacto ? 'compacto' : 'classico'); } catch (e) { }
  const b = document.getElementById('btnInterface'); if (b) b.textContent = compacto ? '🧩 Interface clássica (maior)' : '🧩 Interface compacta';
  if (typeof encaixaTela === 'function') setTimeout(() => { try { encaixaTela(); } catch (e) { } }, 50);
  if (typeof G !== 'undefined' && G.rodando) G.uiSujo = true;
}
document.body.classList.toggle('compacto', visualCompacto());
{
  const poe = () => {
    const lista = document.querySelector('#topo .tb-lista');
    if (lista && !document.getElementById('btnInterface')) {
      lista.append(el('button', { class: 'btn', id: 'btnInterface', type: 'button', role: 'menuitem', title: 'Troca entre o visual compacto (mais espaço para o jogo e as janelas) e o clássico (tudo maior)', onclick: () => aplicaVisual(!document.body.classList.contains('compacto')) }));
      aplicaVisual(visualCompacto());
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(poe, 0)); else setTimeout(poe, 0);
  const _iniVis = iniciarJogo; iniciarJogo = async function () { const r = await _iniVis.apply(this, arguments); poe(); return r; };
  const C = 'body.compacto';
  const st = document.createElement('style'); st.id = 'compacto-css';
  st.textContent = `@media (min-width: 901px) {
  /* topo */
  ${C} #topo { padding: 2px 8px; gap: 8px; border-bottom-width: 1px; }
  ${C} #topo .marca { font-size: 15px; gap: 6px; } ${C} #topo .marca img { height: 22px; }
  ${C} .tb-info { font-size: 12.5px; padding: 1px 3px 1px 10px; }
  ${C} .tb-info .moeda { padding: 1px 8px; }
  ${C} #topo .btn { padding: 3px 8px; font-size: 12.5px; border-width: 1px; box-shadow: none; }
  /* área do jogo */
  ${C} #principal { padding: 4px 6px; }
  ${C} #colJogo { gap: 4px; }
  ${C} #tela { border-width: 2px; border-radius: 4px; box-shadow: none; }
  ${C} #log { height: 66px; font-size: 12.5px; line-height: 1.3; border-width: 1px; border-radius: 4px; padding: 3px 8px; }
  /* barra de atalhos */
  ${C} #barraAcoes { gap: 3px 4px; }
  ${C} #barraAcoes > .btn { font-size: 12px; border-width: 1px; box-shadow: none; }
  ${C} .slot { border-width: 1px; border-radius: 4px; box-shadow: none; }
  ${C} .slot .tecla { font-size: 9.5px; left: 2px; top: 0; } ${C} .slot .qtd { font-size: 11px; right: 2px; bottom: 0; }
  /* colunas de janelas */
  ${C} .coluna-paineis { width: 272px; gap: 4px; padding: 0 2px; top: 4px; }
  ${C} #lateral { margin-left: 5px; } ${C} #lateralEsq { margin-right: 5px; }
  ${C} .bloco { gap: 3px; }
  ${C} .painel { border-width: 1px; border-radius: 4px; box-shadow: none; padding: 5px; }
  ${C} .perfil { gap: 8px; }
  ${C} .perfil .retrato { width: 42px; height: 56px; border-width: 1px; border-radius: 4px; }
  ${C} .p-nome { font-size: 14.5px; line-height: 1.15; } ${C} .p-fase { font-size: 11.5px; } ${C} .p-nivel { font-size: 14.5px; line-height: 1.15; }
  ${C} .barras { gap: 3px; }
  ${C} .barra { height: 14px; border-width: 1px; border-radius: 3px; }
  ${C} .barra span { font-size: 10.5px; line-height: 12px; }
  ${C} .mini-wrap { padding: 2px; }
  ${C} .bloco[data-painel=perfil] > .grip, ${C} .bloco[data-painel=mini] > .grip { top: 3px; right: 3px; }
  ${C} .bloco[data-painel=perfil] > .bt-min, ${C} .bloco[data-painel=mini] > .bt-min { top: 3px; right: 24px; }
  ${C} .grip { font-size: 12px; padding: 1px 2px 0; border-width: 1px; }
  ${C} .bt-min { min-width: 16px; height: 16px; font-size: 10px; border-width: 1px; }
  ${C} .abas { gap: 2px; }
  ${C} .abas button { padding: 2px 2px; font-size: 11.5px; border-width: 1px; border-radius: 4px 4px 0 0; }
  ${C} .bloco-cab { padding: 1px 6px; font-size: 12px; border-width: 1px; border-radius: 4px 4px 0 0; margin-bottom: -3px; gap: 4px; }
  ${C} .bloco-volta { font-size: 11px; padding: 1px 5px; border-width: 1px; }
  ${C} .bloco.minimizado > .cab-min { min-height: 24px; font-size: 12.5px; border-width: 1px; padding: 2px 52px 2px 8px; border-radius: 4px; }
  ${C} .aba { min-height: 70px; max-height: 320px; }
  ${C} .bl-item { padding: 1px 4px; gap: 5px; border-width: 1px; } ${C} .bl-item canvas { width: 22px; height: 28px; } ${C} .bl-nome { font-size: 12px; } ${C} .bl-hp { height: 4px; margin-top: 1px; }
  ${C} .bloco-solto[data-painel="aba:batalha"] > .aba { max-height: 210px; }
  ${C} .prio-alvo { margin-bottom: 3px; font-size: 11px; gap: 3px; } ${C} .prio-alvo .prio-rot { white-space: nowrap; } ${C} .prio-alvo .btn { padding: 1px 5px; font-size: 10.5px; border-width: 1px; box-shadow: none; }
  ${C} .vazio { padding: 6px; font-size: 12px; }
  ${C} .rast { font-size: 12px; padding: 3px 8px; border-width: 1px; }
  @container coljogo (min-width: 640px) {
    ${C} #barraAcoes { grid-template-columns: repeat(2, minmax(0, 108px)) minmax(0, 1fr); }
    ${C} #hotbar { grid-template-columns: repeat(10, minmax(0, 42px)); gap: 3px; }
  }
}`;
  const poeCss = () => document.head.append(st); // por último: vence os estilos dos outros arquivos
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(poeCss, 0)); else setTimeout(poeCss, 0);
}
