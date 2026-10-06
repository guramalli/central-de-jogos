/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   💬 CONVERSA COM NPC (v407, Raio-X): a fala virou uma caixa larga EMBAIXO da tela (como nos RPGs), com o retrato em
   BUSTO do personagem (arte Higgsfield, a/busto_<id>_v407.webp, feita a partir do próprio boneco do jogo) e texto maior.
   Quem ainda não tem busto continua com o retrato do corpo inteiro. Vale para toda janela que tem retrato + balão de fala
   (.npc-topo > .fala). No celular a janela fica onde sempre ficou, só com o texto maior.
   Prefixo: dlg. Carregar DEPOIS de ui.js.
   ============================================================ */
const DLG_BUSTOS = new Set(['mae', 'ze', 'zuzu', 'massagista_vila', 'aurelio', 'ginga', 'tata', 'dada', 'presidente', 'marinho', 'vera', 'lia', 'prof_coral', 'lider_rio', 'rodrigues', 'olheira_carla']);
const DLG_IMG = {};
function bustoNPC(id) {
  if (!DLG_BUSTOS.has(id)) return null;
  if (!DLG_IMG[id]) { const im = new Image(); im.src = `a/busto_${id}_v407.webp`; DLG_IMG[id] = im; }
  return DLG_IMG[id];
}
{
  const _retratoDlg = retratoNPC;
  retratoNPC = function (npc) {
    const id = npc && (npc.id || (npc.d && npc.d.id));
    const im = id && bustoNPC(id);
    if (!im) return _retratoDlg.apply(this, arguments);
    const c = mkCanvas(320, 320); c.className = 'dlg-busto';
    const pinta = () => { const x = c.getContext('2d'); x.clearRect(0, 0, 320, 320); x.drawImage(im, 0, 0, 320, 320); };
    if (im.complete && im.naturalWidth) pinta();
    else { // enquanto o busto chega, mostra o retrato de sempre por cima do lugar
      try { const r = _retratoDlg.apply(this, arguments); const x = c.getContext('2d'); const k = Math.min(320 / r.width, 320 / r.height); x.drawImage(r, (320 - r.width * k) / 2, 320 - r.height * k, r.width * k, r.height * k); } catch (e) { }
      im.addEventListener('load', pinta, { once: true });
    }
    return c;
  };
  const _abreModalDlg = abreModal;
  abreModal = function () {
    const r = _abreModalDlg.apply(this, arguments); // (abreModal.largo continua sendo lido no nome global, que é este)
    try { const M = document.getElementById('modal'); M.classList.toggle('dlg-npc', !!document.querySelector('#modalConteudo > .npc-topo > .fala')); } catch (e) { }
    return r;
  };
  const st = document.createElement('style'); st.id = 'dialogo-npc-css';
  st.textContent = `
  #modal.dlg-npc .fala p { font-size: 17px; line-height: 1.5; }
  #modal.dlg-npc .npc-topo canvas.dlg-busto { background: radial-gradient(circle at 50% 40%, #fff6dc, #ecd09a 70%); }
  @media (min-width: 901px) {
    /* v408.5 (dono: "voltar para o meio"): a conversa fica no MEIO da tela de novo; o retrato em busto e o texto maior continuam */
    #modal.dlg-npc .modal-caixa { width: min(820px, 94vw); max-height: 80vh; padding: 14px 20px 16px; }
    #modal.dlg-npc #modalConteudo h2 { font-size: 22px; margin-bottom: 6px; }
    #modal.dlg-npc .npc-topo { gap: 18px; align-items: stretch; }
    #modal.dlg-npc .npc-topo canvas { width: 150px; height: 150px; object-fit: contain; border-width: 3px; border-radius: 12px; }
    #modal.dlg-npc .fala { padding: 12px 18px; display: flex; flex-direction: column; justify-content: center; }
    #modal.dlg-npc .fala p { font-size: 19px; }
    #modal.dlg-npc .opcoes .btn { font-size: 16px; padding: 8px 14px; }
  }`;
  document.head.append(st);
}
