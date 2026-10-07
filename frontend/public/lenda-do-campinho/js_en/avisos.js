/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📢 AVISOS NA TELA (v163): com uma janela aberta (clube, loja, missões...),
   o chat fica escondido atrás dela e "Caixa insuficiente" passava despercebido.
   Agora a mensagem aparece também em cima da janela, grande, e some sozinha.
   Carregar DEPOIS de ui.js e celular2.js.
   ============================================================ */
function avisoTela(msg, cls) {
  let box = document.getElementById('avisosTela'); if (!box) { box = el('div', { id: 'avisosTela' }); document.body.append(box); }
  const tipo = /l-dano/.test(cls) ? 'ruim' : /l-(loot|xp|lvl|lendario|mitico)/.test(cls) ? 'bom' : 'info';
  const a = el('div', { class: 'aviso-tela ' + tipo }, (tipo === 'ruim' ? '⚠️ ' : tipo === 'bom' ? '✔ ' : 'ℹ️ ') + msg);
  a.addEventListener('click', () => a.remove());
  box.append(a); while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { a.classList.add('saindo'); setTimeout(() => a.remove(), 400); }, tipo === 'ruim' ? 5000 : 3500);
}
{
  const _logAv = log;
  log = function (msg, cls) {
    const r = _logAv.apply(this, arguments);
    try { const M = document.getElementById('modal'); if (M && !M.hidden && msg) avisoTela(String(msg).replace(/<[^>]+>/g, ''), cls || 'l-info'); } catch (e) { }
    return r;
  };
}
{
  const st = document.createElement('style');
  st.textContent = `#avisosTela { position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%); z-index: 80; display: flex; flex-direction: column-reverse; gap: 6px; align-items: center; pointer-events: none; width: min(560px, 92vw); }
  .aviso-tela { pointer-events: auto; cursor: pointer; padding: 10px 16px; border-radius: 12px; font: 800 16px Nunito, 'Segoe UI', sans-serif; color: #fff; box-shadow: 0 6px 18px rgba(0,0,0,.4); text-align: center; animation: avEntra .25s ease-out; transition: opacity .4s, transform .4s; line-height: 1.3; }
  .aviso-tela.ruim { background: #c0301a; border: 2px solid #ffd0c0; } .aviso-tela.bom { background: #2a8a3a; border: 2px solid #c8ffc8; } .aviso-tela.info { background: #3a3a6a; border: 2px solid #c8c8ff; }
  .aviso-tela.saindo { opacity: 0; transform: translateY(-8px); }
  @keyframes avEntra { from { opacity: 0; transform: translateY(-10px) scale(.96); } to { opacity: 1; transform: none; } }`;
  document.head.append(st);
}
