/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   💬 HISTÓRICO (v366, dono: "dê a opção de aumentar o chat 'histórico' para ver mais coisas e depois voltar ao normal...
   o horário no chat está sempre o mesmo").
   - O horário de cada mensagem agora é a HORA DE VERDADE (do computador/celular), como num chat. Antes era o relógio
     do jogo, que fica PARADO com o Modo Treino ligado (o calendário do clube não anda) e dentro de casas e prédios.
   - Botão ⤢ no canto do histórico: abre uma janela grande POR CIMA do jogo (mesma largura, crescendo para cima, ~60%
     da tela), com mais mensagens guardadas (400). ⤡ (ou Esc) volta ao normal. Fica lembrado neste navegador.
   Carregar no fim (depois de ui.js).
   ============================================================ */
{
  // (a hora de verdade e as 400 mensagens ficam no log() original, em ui.js: vários arquivos embrulham o log)
  const KEY = 'rac_log_grande';
  let btn = null;
  function posiciona() {
    const L = $('#log'); if (!L) return;
    if (!document.body.classList.contains('log-grande')) { L.style.cssText = ''; return; }
    L.style.cssText = ''; const r = L.getBoundingClientRect(); // tamanho normal (com o estilo do layout)
    const alto = Math.max(r.height, Math.round(window.innerHeight * 0.6));
    Object.assign(L.style, { position: 'fixed', left: r.left + 'px', width: r.width + 'px', top: Math.max(8, r.bottom - alto) + 'px', height: Math.min(alto, r.bottom - 8) + 'px', zIndex: 60 });
  }
  function alterna(grande) {
    const g = grande == null ? !document.body.classList.contains('log-grande') : !!grande;
    document.body.classList.toggle('log-grande', g);
    try { localStorage.setItem(KEY, g ? '1' : '0'); } catch (e) { }
    if (btn) { btn.textContent = g ? '⤡' : '⤢'; btn.title = g ? 'Voltar o histórico ao tamanho normal (Esc)' : 'Aumentar o histórico para ver mais mensagens'; }
    posiciona(); posBotao();
    const L = $('#log'); if (L) L.scrollTop = L.scrollHeight;
  }
  function posBotao() {
    const L = $('#log'); if (!L || !btn) return;
    const r = L.getBoundingClientRect();
    Object.assign(btn.style, { position: 'fixed', top: (r.top + 4) + 'px', left: (r.right - 34) + 'px', zIndex: 61, display: r.width > 0 && r.height > 20 ? '' : 'none' });
  }
  function poeBotao(t = 0) {
    const L = $('#log'); if (!L) { if (t < 40) setTimeout(() => poeBotao(t + 1), 500); return; }
    if (document.getElementById('btnLogGrande')) return;
    btn = el('button', { id: 'btnLogGrande', class: 'btn mini', type: 'button', onclick: () => alterna() }, '⤢');
    document.body.append(btn);
    let g = false; try { g = localStorage.getItem(KEY) === '1'; } catch (e) { }
    alterna(g);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => poeBotao()); else poeBotao();
  window.addEventListener('resize', () => { posiciona(); posBotao(); });
  setInterval(() => { try { posiciona(); posBotao(); } catch (e) { } }, 1200); // o layout dos painéis pode mudar (colunas, tela cheia)
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('log-grande') && (document.getElementById('modal') || {}).hidden !== false) alterna(false); });
  window.alternaHistorico = alterna;
  const css = document.createElement('style');
  css.textContent = `
  #btnLogGrande { padding: 1px 7px; font-size: 14px; line-height: 1.2; opacity: .85; }
  #btnLogGrande:hover { opacity: 1; }
  body.log-grande #log { box-shadow: 0 -6px 24px rgba(0,0,0,.45); }
  body.modo-celular #btnLogGrande, body.cel3 #btnLogGrande { display: none !important; }
  body:has(#modal:not([hidden])) #btnLogGrande { visibility: hidden; } /* v405: o ⤢ ficava por cima das janelas */`;
  document.head.append(css);
}
