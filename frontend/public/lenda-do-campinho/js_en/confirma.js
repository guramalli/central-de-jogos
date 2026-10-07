/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ✅ PERGUNTAS E AVISOS NO ESTILO DO JOGO (v242)
   Troca as caixinhas do navegador ("www.educacaogamer.com.br diz"):
   - perguntaJogo(texto, { titulo, sim, nao, perigo }) → Promise<true|false>
   - avisoJogo(texto, { titulo, ok }) → Promise (fecha no botão)
   - textoParaCopiar(texto) → mostra o texto selecionado para copiar
   Fica por cima de tudo (até da tela inicial), pausa o jogo enquanto está aberta,
   Enter = sim, Esc = não. Se abrir outra, ela aparece por cima.
   Carregar ANTES dos outros scripts (não depende de nada).
   ============================================================ */
let CJ_ABERTAS = 0, CJ_PAUSOU = false;
function cjCaixa(monta) {
  return new Promise(resolve => {
    const fundo = document.createElement('div'); fundo.className = 'cj-fundo';
    const caixa = document.createElement('div'); caixa.className = 'cj-caixa'; caixa.setAttribute('role', 'dialog'); caixa.setAttribute('aria-modal', 'true');
    fundo.append(caixa); document.body.append(fundo);
    const g = typeof G !== 'undefined' && G ? G : null;
    if (!CJ_ABERTAS && g && g.rodando && !g.pausado) { g.pausado = true; CJ_PAUSOU = true; } // pausa o jogo enquanto houver caixa aberta
    CJ_ABERTAS++;
    let teclas = null;
    const fecha = valor => {
      window.removeEventListener('keydown', teclas, true); fundo.remove();
      if (--CJ_ABERTAS <= 0) { CJ_ABERTAS = 0; if (CJ_PAUSOU && g && g.pausado) g.pausado = false; CJ_PAUSOU = false; }
      resolve(valor);
    };
    const r = monta(caixa, fecha);
    teclas = ev => { // o jogo não recebe as teclas enquanto a caixa está aberta
      ev.stopPropagation();
      const topo = [...document.querySelectorAll('.cj-fundo')].pop(); if (topo && topo !== fundo) return; // só a de cima responde
      if (ev.key === 'Enter') { ev.preventDefault(); const a = document.activeElement; if (a && a.tagName === 'BUTTON' && caixa.contains(a)) a.click(); else fecha(r.enter); }
      else if (ev.key === 'Escape') { ev.preventDefault(); fecha(r.esc); }
    };
    window.addEventListener('keydown', teclas, true);
    setTimeout(() => { const b = caixa.querySelector('.cj-foco'); if (b) b.focus(); }, 0);
  });
}
function cjTexto(caixa, titulo, texto) {
  if (titulo) { const h = document.createElement('h3'); h.textContent = titulo; caixa.append(h); }
  const p = document.createElement('p'); p.textContent = texto; caixa.append(p);
}
function cjBotao(rot, classe, fn) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + classe; b.textContent = rot; b.onclick = fn; return b; }
function perguntaJogo(texto, op = {}) {
  return cjCaixa((caixa, fecha) => {
    cjTexto(caixa, op.titulo, texto);
    const ops = document.createElement('div'); ops.className = 'cj-ops';
    ops.append(cjBotao(op.nao || 'Cancel', '', () => fecha(false)), cjBotao(op.sim || 'Yes', (op.perigo ? 'vermelho' : 'amarelo') + ' cj-foco', () => fecha(true)));
    caixa.append(ops);
    return { enter: true, esc: false };
  });
}
function avisoJogo(texto, op = {}) {
  return cjCaixa((caixa, fecha) => {
    cjTexto(caixa, op.titulo, texto);
    const ops = document.createElement('div'); ops.className = 'cj-ops';
    ops.append(cjBotao(op.ok || 'Got it', 'amarelo cj-foco', () => fecha(true)));
    caixa.append(ops);
    return { enter: true, esc: true };
  });
}
function textoParaCopiar(texto) {
  return cjCaixa((caixa, fecha) => {
    cjTexto(caixa, 'Copy the text', 'Select and copy (Ctrl+C or press and hold, then "Copy"):');
    const t = document.createElement('textarea'); t.className = 'cj-area'; t.value = texto; t.readOnly = true; caixa.append(t);
    setTimeout(() => { t.focus(); t.select(); }, 30);
    const ops = document.createElement('div'); ops.className = 'cj-ops';
    ops.append(cjBotao('Close', 'amarelo', () => fecha(true)));
    caixa.append(ops);
    return { enter: true, esc: true };
  });
}
{
  const st = document.createElement('style');
  st.textContent = `.cj-fundo { position: fixed; inset: 0; z-index: 100000; background: rgba(20,12,30,.55); display: flex; align-items: center; justify-content: center; padding: 16px; animation: cjEntra .12s ease-out; }
  .cj-caixa { background: #f7e3b5; color: #3b2410; border: 4px solid #6b4423; border-radius: 14px; box-shadow: 0 6px 0 rgba(0,0,0,.35), 0 10px 40px rgba(0,0,0,.45);
    max-width: 440px; width: 100%; padding: 16px 18px 14px; font: 700 15px Nunito, sans-serif; }
  .cj-caixa h3 { margin: 0 0 8px; font: 700 20px Fredoka, Nunito, sans-serif; }
  .cj-caixa p { margin: 0 0 14px; line-height: 1.4; white-space: pre-line; }
  .cj-ops { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
  .cj-area { width: 100%; min-height: 90px; box-sizing: border-box; margin-bottom: 12px; font: 600 14px Nunito, sans-serif; border-radius: 8px; border: 2px solid #6b4423; padding: 6px; }
  @keyframes cjEntra { from { opacity: 0; transform: scale(.97); } }`;
  (document.head || document.documentElement).append(st);
}
