/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   PORTAL: ligação com o site Educação Gamer
   Só liga quando o jogo roda DENTRO do site (educacaogamer.com.br/lenda-do-campinho/).
   Mesmo endereço = mesmo navegador: o jogo lê o login do site (eg_token / eg_user).
   - Barra "Voltar ao Educação Gamer" e "Jogando como NICK"
   - Nome do personagem já vem com o apelido do site
   - 🐞 Bug: envia direto pra rota de feedback que o site JÁ tem
     (POST /api/feedback, tipo "bug": grava no banco e manda e-mail pro dono)
   Carregar DEPOIS de beta.js.
   ============================================================ */
const PORTAL = (() => {
  const h = location.hostname;
  const producao = /(^|\.)educacaogamer\.com\.br$/.test(h);
  const local = (h === 'localhost' || h === '127.0.0.1') && location.pathname.startsWith('/lenda-do-campinho');
  let token = null, user = null;
  try { token = localStorage.getItem('eg_token'); user = JSON.parse(localStorage.getItem('eg_user') || 'null'); } catch (e) { }
  return { ativo: producao || local, api: producao ? 'https://api.educacaogamer.com.br' : 'http://localhost:4000', token, user };
})();

// mensagem do bug: o texto da pessoa + o essencial dos dados técnicos (limite do site: 2000 caracteres)
function mensagemBugPortal(texto) {
  const s = G.save, p = G.p;
  const dados = [
    `Versão ${VERSAO_JOGO}`,
    s ? `Jogador: ${s.nome}, nível ${s.nivel}, classe ${s.classe || '-'}` : 'Tela inicial',
    G.mapa && p ? `Mapa: ${G.mapa.id} (${Number(p.x).toFixed(1)}, ${Number(p.y).toFixed(1)})` : '',
    `Tela: ${innerWidth}x${innerHeight} · ${document.body.classList.contains('modo-celular') ? 'celular' : 'computador'}`,
    `Navegador: ${navigator.userAgent.slice(0, 160)}`,
    ...(ERROS_JOGO.length ? ['Erros:', ...ERROS_JOGO.slice(-4)] : []),
  ].filter(Boolean).join('\n');
  const cabeca = '[Lenda do Campinho] ';
  const corpo = texto.slice(0, 2000 - cabeca.length - 40);
  return (cabeca + corpo + '\n\n--- dados do jogo ---\n' + dados).slice(0, 2000);
}

if (PORTAL.ativo) (function () {
  // ---------- tela inicial: voltar ao portal + quem está jogando ----------
  const topo = document.querySelector('#inicio .inicio-topo');
  if (topo && !document.querySelector('.portal-barra')) {
    const quem = PORTAL.user && PORTAL.user.nickname
      ? el('span', { class: 'portal-quem' }, '🎮 Jogando como ', el('b', {}, PORTAL.user.nickname))
      : el('a', { class: 'portal-quem', href: '/login' }, '🔑 Entrar na conta do Educação Gamer');
    topo.prepend(el('div', { class: 'portal-barra' }, el('a', { class: 'btn mini', href: '/' }, '← Voltar ao Educação Gamer'), quem));
  }
  // apelido do site no nome do personagem (dá pra trocar)
  const nomeInp = document.getElementById('inpNome');
  if (nomeInp && PORTAL.user && PORTAL.user.nickname) {
    const preenche = () => { if (!nomeInp.value) nomeInp.value = String(PORTAL.user.nickname).replace(/[<>]/g, '').slice(0, 14); };
    preenche(); const bt = document.getElementById('btnNovo'); if (bt) bt.addEventListener('click', () => setTimeout(preenche, 0));
  }
  // no jogo: a marca do topo volta ao portal
  const marca = document.querySelector('#topo .marca');
  if (marca) { marca.style.cursor = 'pointer'; marca.title = 'Voltar ao Educação Gamer'; marca.addEventListener('click', () => { if (confirm('Voltar para o Educação Gamer? Seu progresso fica salvo.')) { try { salvar(); } catch (e) { } location.href = '/'; } }); }
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade) grade.append(el('button', { class: 'btn cm-bt', type: 'button', onclick: () => { try { salvar(); } catch (e) { } location.href = '/'; } }, el('span', { class: 'cm-ic' }, '🏠'), 'Educação Gamer'));

  // ---------- 🐞 bug: envia direto pra equipe ----------
  const _modalBugPortal = modalBug;
  modalBug = function () {
    _modalBugPortal();
    const ops = document.querySelector('#modalConteudo .opcoes'); const area = document.querySelector('#modalConteudo .bug-txt'); const ok = document.querySelector('#modalConteudo .bug-ok');
    if (!ops || !area) return;
    const avisa = (msg, erro) => { if (!ok) return; ok.textContent = msg; ok.hidden = false; ok.style.background = erro ? '#ffe0d8' : ''; ok.style.color = erro ? '#8a1a1a' : ''; };
    const b = el('button', { class: 'btn amarelo', type: 'button' }, PORTAL.token ? '📨 Enviar para a equipe' : '🔑 Entrar para enviar');
    b.onclick = async () => {
      if (!PORTAL.token) { if (confirm('Para enviar, entre na sua conta do Educação Gamer. Ir para o login agora? (seu progresso fica salvo)')) { try { salvar(); } catch (e) { } location.href = '/login'; } return; }
      const texto = area.value.trim();
      if (texto.length < 5) { avisa('Conte o que aconteceu antes de enviar.', true); area.focus(); return; }
      b.disabled = true; b.textContent = 'Enviando...';
      try {
        const r = await fetch(PORTAL.api + '/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + PORTAL.token }, body: JSON.stringify({ type: 'bug', message: mensagemBugPortal(texto) }) });
        const j = await r.json().catch(() => ({}));
        if (r.ok) { b.textContent = '✅ Enviado!'; avisa('Recebemos! Obrigado por ajudar a melhorar o Lenda do Campinho.'); area.value = ''; return; }
        b.disabled = false; b.textContent = '📨 Enviar para a equipe';
        avisa(r.status === 401 ? 'Sua sessão do site expirou. Entre de novo no Educação Gamer e tente outra vez.' : (j.error || 'Não deu para enviar agora. Tente de novo mais tarde.'), true);
      } catch (e) { b.disabled = false; b.textContent = '📨 Enviar para a equipe'; avisa('Sem conexão com o site agora. Tente de novo em instantes (ou copie o relatório).', true); }
    };
    ops.prepend(b);
    const copiar = [...ops.querySelectorAll('button')].find(x => /Copiar/.test(x.textContent)); if (copiar) copiar.classList.remove('amarelo');
  };

  const st = document.createElement('style');
  st.textContent = `
  .portal-barra { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
  .portal-quem { font-size: 13px; color: #5e2f14; font-weight: 700; text-decoration: none; }
  a.portal-quem { color: #7a3410; text-decoration: underline; }
  `;
  document.head.append(st);
})();
