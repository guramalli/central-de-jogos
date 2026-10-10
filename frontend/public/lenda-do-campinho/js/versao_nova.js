/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🔄 AVISO DE VERSÃO NOVA (v318): o dono publicou a v317 (rabo do Touro refeito) com o jogo aberto e
   continuou vendo a arte antiga — a aba aberta segue com o código de quando foi carregada.
   Agora, a cada 3 minutos (e quando a aba volta a ficar visível), o jogo confere o index.html no site;
   se a versão de lá for mais nova, aparece um aviso "Versão nova!" — tocando, o jogo salva e recarrega.
   Nunca recarrega sozinho (ninguém perde o que está fazendo).
   ============================================================ */
{
  // v409 (dono: "a mensagem de atualize seu jogo lá em cima verde não está mais aparecendo"): desde a v408 as correções sobem
  // só os arquivos mudados (?v=408.1, 408.2...) e o assets.js ficava em 408 → o aviso nunca via a versão nova.
  // Agora vale o MAIOR ?v= de todos os scripts (com ponto). Atenção: depois de 408.9 vem 409 (408.10 seria lido como 408.1).
  const versaoDe = txt => { let mx = 0; for (const m of String(txt).matchAll(/\.js\?v=(\d+(?:\.\d+)?)/g)) mx = Math.max(mx, parseFloat(m[1])); return mx; };
  // v412.6 (BUG, dono: "não estamos fazendo nada no game e ele fica pedindo para atualizar o tempo todo"): a conta era feita
  // quando ESTE arquivo carregava — os scripts que vêm depois dele no index.html ainda não existiam na página. Quando o ?v= mais
  // alto estava num arquivo do fim (v412.5: chao_pronto, entrada_leve), "minha" ficava menor que a do site → aviso para sempre.
  // Agora a conta é feita na hora de conferir (a página já carregou tudo).
  let minhaC = 0; const minhaV = () => minhaC || (minhaC = versaoDe([...document.querySelectorAll('script[src]')].map(s => s.getAttribute('src')).join(' ')));
  let avisou = false, ultima = 0;
  function avisoVersao(v) {
    if (avisou) return; avisou = true;
    const d = document.createElement('button');
    d.type = 'button'; d.id = 'versaoNova';
    d.textContent = '🔄 Versão nova do jogo! Toque aqui para atualizar';
    d.title = 'O jogo é salvo e a página recarrega com as novidades (v' + v + ')';
    Object.assign(d.style, { position: 'fixed', top: '8px', left: '50%', transform: 'translateX(-50%)', zIndex: 9500, padding: '8px 16px', borderRadius: '20px', border: '2px solid #fff', background: '#2e9d4a', color: '#fff', font: 'bold 14px system-ui, sans-serif', boxShadow: '0 3px 10px rgba(0,0,0,.35)', cursor: 'pointer', maxWidth: 'calc(100vw - 32px)' });
    d.onclick = () => { try { if (typeof salvar === 'function') salvar(); } catch (e) { } location.reload(); };
    document.body.append(d);
  }
  async function confere() {
    if (avisou || document.readyState === 'loading' || !minhaV() || location.protocol === 'file:' || Date.now() - ultima < 60000) return; ultima = Date.now();
    try {
      const r = await fetch('index.html?nv=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return;
      const v = versaoDe(await r.text()); if (v > minhaV()) avisoVersao(v);
    } catch (e) { }
  }
  setInterval(confere, 180000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) confere(); });
  window.__confereVersao = () => { ultima = 0; return confere(); }; // (para os testes)
}
