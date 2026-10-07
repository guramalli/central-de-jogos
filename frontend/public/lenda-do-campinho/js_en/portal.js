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
  let contaId = user && user.id ? String(user.id) : null;
  if (!contaId && token) try { contaId = String(JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).id || '') || null; } catch (e) { }
  return { ativo: producao || local, api: producao ? 'https://api.educacaogamer.com.br' : 'http://localhost:4000', token, user, contaId };
})();
// v293: login que se renova sozinho. O login do site dura 7 dias; quem continua jogando troca o login ainda
// válido por um novo (POST /api/auth/renovar) ao abrir o jogo e a cada 6 h — só se ele já tiver mais de 12 h.
// Antes, quem jogava todo dia caía a cada 7 dias e o jogo parava de salvar online (e de mandar o ranking).
function lerTokenPortal(t) { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { return null; } }
async function renovaLoginPortal() {
  if (!PORTAL.ativo || !PORTAL.token) return false;
  const p = lerTokenPortal(PORTAL.token), agora = Date.now();
  if (!p || !p.exp || !p.iat || p.exp * 1000 <= agora || agora - p.iat * 1000 < 12 * 3600e3) return false;
  try {
    const antes = PORTAL.token;
    const r = await fetch(PORTAL.api + '/api/auth/renovar', { method: 'POST', headers: { Authorization: 'Bearer ' + antes } });
    if (!r.ok) return false;
    const j = await r.json(); if (!j || !j.token || PORTAL.token !== antes) return false;
    PORTAL.token = j.token; try { localStorage.setItem('eg_token', j.token); if (j.user) localStorage.setItem('eg_user', JSON.stringify(j.user)); } catch (e) { }
    return true;
  } catch (e) { return false; }
}
if (PORTAL.ativo && PORTAL.token) { setTimeout(renovaLoginPortal, 4000); setInterval(renovaLoginPortal, 6 * 3600e3); }
// v290: login e cadastro do site VOLTAM para o jogo depois (?volta=): antes a pessoa caía na página inicial do site
function urlConta(tipo, extra) { return (tipo === 'cadastro' ? '/registrar' : '/login') + '?' + (extra ? extra + '&' : '') + 'volta=' + encodeURIComponent(location.pathname + location.search); }
// o personagem aberto é desta conta? (save sem dono ainda = sim; o contas.js marca o dono)
function saveDaConta(s = G.save) { return !!s && (!s.conta || !PORTAL.contaId || s.conta === PORTAL.contaId); }

// mensagem do bug: o texto da pessoa + o essencial dos dados técnicos (limite do site: 2000 caracteres)
function mensagemBugPortal(texto) {
  const s = G.save, p = G.p;
  const dados = [
    `Version ${VERSAO_JOGO}`,
    s ? `Player: ${s.nome}, level ${s.nivel}, class ${s.classe || '-'}` : 'Title screen',
    G.mapa && p ? `Map: ${G.mapa.id} (${Number(p.x).toFixed(1)}, ${Number(p.y).toFixed(1)})` : '',
    `Screen: ${innerWidth}x${innerHeight} · ${document.body.classList.contains('modo-celular') ? 'celular' : 'computador'}`,
    `Browser: ${navigator.userAgent.slice(0, 160)}`,
    ...(ERROS_JOGO.length ? ['Errors:', ...ERROS_JOGO.slice(-4)] : []),
  ].filter(Boolean).join('\n');
  const cabeca = '[Lenda do Campinho] ';
  const corpo = texto.slice(0, 2000 - cabeca.length - 40);
  return (cabeca + corpo + '\n\n--- game data ---\n' + dados).slice(0, 2000);
}

if (PORTAL.ativo) (function () {
  // ---------- tela inicial: voltar ao portal + quem está jogando ----------
  const topo = document.querySelector('#inicio .inicio-topo');
  if (topo && !document.querySelector('.portal-barra')) {
    const quem = PORTAL.user && PORTAL.user.nickname
      ? el('span', { class: 'portal-quem' }, '🎮 Playing as ', el('b', {}, PORTAL.user.nickname))
      : el('a', { class: 'portal-quem', href: urlConta('entrar') }, '🔑 Log in to your Educação Gamer account');
    topo.prepend(el('div', { class: 'portal-barra' }, el('a', { class: 'btn mini', href: '/' }, '← Back to Educação Gamer'), quem));
  }
  // apelido do site no nome do personagem (dá pra trocar)
  const nomeInp = document.getElementById('inpNome');
  if (nomeInp && PORTAL.user && PORTAL.user.nickname) {
    const preenche = () => { if (!nomeInp.value) nomeInp.value = String(PORTAL.user.nickname).replace(/[<>]/g, '').slice(0, 14); };
    preenche(); const bt = document.getElementById('btnNovo'); if (bt) bt.addEventListener('click', () => setTimeout(preenche, 0));
  }
  // no jogo: a marca do topo volta ao portal
  const marca = document.querySelector('#topo .marca');
  if (marca) { marca.style.cursor = 'pointer'; marca.title = 'Back to Educação Gamer'; marca.addEventListener('click', async () => { if (await perguntaJogo('Go back to Educação Gamer? Your progress stays saved.', { sim: 'Back to the site' })) { try { salvar(); } catch (e) { } location.href = '/'; } }); }
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade) grade.append(el('button', { class: 'btn cm-bt', type: 'button', onclick: () => { try { salvar(); } catch (e) { } location.href = '/'; } }, el('span', { class: 'cm-ic' }, '🏠'), 'Educação Gamer'));

  // ---------- 🐞 bug: envia direto pra equipe ----------
  const _modalBugPortal = modalBug;
  modalBug = function () {
    _modalBugPortal();
    const ops = document.querySelector('#modalConteudo .opcoes'); const area = document.querySelector('#modalConteudo .bug-txt'); const ok = document.querySelector('#modalConteudo .bug-ok');
    if (!ops || !area) return;
    const avisa = (msg, erro) => { if (!ok) return; ok.textContent = msg; ok.hidden = false; ok.style.background = erro ? '#ffe0d8' : ''; ok.style.color = erro ? '#8a1a1a' : ''; };
    const b = el('button', { class: 'btn amarelo', type: 'button' }, PORTAL.token ? '📨 Send to the team' : '🔑 Log in to send');
    b.onclick = async () => {
      if (!PORTAL.token) { if (await perguntaJogo('To send this, log in to your Educação Gamer account. Go to the login now? (your progress stays saved)', { sim: 'Go to login' })) { try { salvar(); } catch (e) { } location.href = urlConta('entrar'); } return; }
      const texto = area.value.trim();
      if (texto.length < 5) { avisa('Tell us what happened before sending.', true); area.focus(); return; }
      b.disabled = true; b.textContent = 'Sending...';
      try {
        const r = await fetch(PORTAL.api + '/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + PORTAL.token }, body: JSON.stringify({ type: 'bug', message: mensagemBugPortal(texto) }) });
        const j = await r.json().catch(() => ({}));
        if (r.ok) { b.textContent = '✅ Sent!'; avisa('Got it! Thanks for helping make Lenda do Campinho better.'); area.value = ''; return; }
        b.disabled = false; b.textContent = '📨 Send to the team';
        avisa(r.status === 401 ? 'Your site session expired. Log in to Educação Gamer again and try once more.' : (j.error || 'Couldn\'t send right now. Try again later.'), true);
      } catch (e) { b.disabled = false; b.textContent = '📨 Send to the team'; avisa('No connection to the site right now. Try again in a moment (or copy the report).', true); }
    };
    ops.prepend(b);
    const copiar = [...ops.querySelectorAll('button')].find(x => /Copiar|Copy/.test(x.textContent)); if (copiar) copiar.classList.remove('amarelo');
  };

  const st = document.createElement('style');
  st.textContent = `
  .portal-barra { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
  .portal-quem { font-size: 13px; color: #5e2f14; font-weight: 700; text-decoration: none; }
  a.portal-quem { color: #7a3410; text-decoration: underline; }
  `;
  document.head.append(st);
})();
