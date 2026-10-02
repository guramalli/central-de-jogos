/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📊 ESTATÍSTICAS ANÔNIMAS (v353 — item 4 do pacote de melhorias)
   Para saber onde os jogadores travam ou desistem, SEM saber quem é quem:
   - só CONTAGENS por dia ("abriu o jogo", "chegou ao nível 10", "entrou em Atlântida"...);
   - nada de nome, conta, e-mail, ID de aparelho, cookie ou texto livre — o servidor só soma +1
     num contador do dia (POST /api/lenda/contagens) e não guarda o IP;
   - só no site (a Steam não manda nada) e nunca com "Não rastrear" ligado no navegador;
   - dá para desligar: Mais › 📊 (ou localStorage rac_estatisticas = '0').
   Cada marco é mandado UMA vez por personagem (guardado no próprio save: s.est).
   ============================================================ */
const EST = {
  fila: [], marcos: [2, 5, 10, 15, 20, 30, 40, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000],
  inicio: Date.now(),
};
function estLigado() {
  try {
    if (window.LENDA_STEAM || typeof PORTAL === 'undefined' || !PORTAL.ativo) return false;
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl) return false;
    return localStorage.getItem('rac_estatisticas') !== '0';
  } catch (e) { return false; }
}
function estConta(evento, valor) {
  if (!estLigado()) return;
  const v = String(valor == null ? '' : valor).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
  if (EST.fila.length < 40) EST.fila.push({ e: evento, v });
}
// uma vez por personagem (marcos de progresso)
function estUmaVez(evento, valor) {
  const s = G.save; if (!s) return;
  const k = evento + ':' + valor; s.est = s.est || {}; if (s.est[k]) return; s.est[k] = 1; estConta(evento, valor);
}
function estEnvia(fim) {
  if (!EST.fila.length || !estLigado()) { EST.fila.length = 0; return; }
  const lote = EST.fila.splice(0, 20);
  const corpo = JSON.stringify({ v: typeof VERSAO_JOGO !== 'undefined' ? VERSAO_JOGO : 0, p: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'celular' : 'computador', ev: lote });
  const url = PORTAL.api + '/api/lenda/contagens';
  try {
    // text/plain: o navegador manda sem pedir licença antes (e sem login nem cookie)
    if (fim && navigator.sendBeacon) navigator.sendBeacon(url, new Blob([corpo], { type: 'text/plain' }));
    else fetch(url, { method: 'POST', body: corpo, headers: { 'Content-Type': 'text/plain' }, credentials: 'omit', keepalive: true }).catch(() => { });
  } catch (e) { }
}
setInterval(() => estEnvia(false), 60000);
addEventListener('pagehide', () => {
  const min = (Date.now() - EST.inicio) / 60000;
  if (G.save) estConta('sessao', min < 5 ? 'm0_5' : min < 15 ? 'm5_15' : min < 30 ? 'm15_30' : min < 60 ? 'm30_60' : 'm60');
  estEnvia(true);
});
// abriu o jogo (tela de título)
estConta('abriu', (() => { try { return localStorage.getItem('rac_estatisticas_dia') ? 'volta' : 'novo'; } catch (e) { return ''; } })());
// voltou depois de 1, 7, 30 dias (só a DATA do primeiro dia fica no aparelho; nada vai junto)
try {
  const hoje = Math.floor(Date.now() / 864e5), d0 = Number(localStorage.getItem('rac_estatisticas_dia')) || hoje;
  localStorage.setItem('rac_estatisticas_dia', String(d0));
  const passou = hoje - d0, ja = JSON.parse(localStorage.getItem('rac_estatisticas_ret') || '[]');
  for (const d of [1, 7, 30]) if (passou >= d && !ja.includes(d)) { ja.push(d); estConta('retorno', 'd' + d); }
  localStorage.setItem('rac_estatisticas_ret', JSON.stringify(ja));
} catch (e) { }
// personagem criado / jogo começou
{
  const _iniEst = iniciarJogo;
  iniciarJogo = async function (sv) {
    const novo = sv && !sv.est && (sv.nivel || 1) <= 1;
    const r = await _iniEst.apply(this, arguments);
    try { if (novo) estUmaVez('personagem', G.save.classe || ''); estConta('jogou', ''); } catch (e) { }
    return r;
  };
}
// marcos: nível, fim do tutorial, mapa novo, primeira derrota
{
  let nv = 0, tut = null, mapa = null;
  setInterval(() => {
    const s = G.save; if (!s || !G.rodando) return;
    if (s.nivel !== nv) { nv = s.nivel; for (const m of EST.marcos) if (s.nivel >= m) estUmaVez('nivel', m); }
    if (tut !== null && tut < 99 && s.tut >= 99) estUmaVez('tutorial', 'fim'); tut = s.tut;
    if (G.mapa && G.mapa.id !== mapa) { mapa = G.mapa.id; if (!G.mapa.interior && !/^(casa|int_|tr_)/.test(mapa)) estUmaVez('mapa', mapa.replace(/_\d+$/, '')); }
  }, 5000);
  if (typeof renascer === 'function') { const _renEst = renascer; renascer = function () { try { estUmaVez('derrota', 'primeira'); } catch (e) { } return _renEst.apply(this, arguments); }; }
}
// botão para desligar (Mais ›)
function estAlterna() {
  const lig = estLigado(); try { localStorage.setItem('rac_estatisticas', lig ? '0' : '1'); } catch (e) { }
  avisoJogo(lig ? '📊 Estatísticas anônimas DESLIGADAS. O jogo não manda mais nenhuma contagem.' : '📊 Estatísticas anônimas ligadas. Só contagens, sem nome nem conta (veja "Direitos autorais e privacidade").');
}
(function poeBotaoEst(t = 0) {
  if (window.LENDA_STEAM || typeof PORTAL === 'undefined' || !PORTAL.ativo) return;
  const lista = document.querySelector('.tb-lista'); if (!lista) { if (t < 40) setTimeout(() => poeBotaoEst(t + 1), 500); return; }
  if (document.getElementById('btnEst')) return;
  const b = el('button', { class: 'btn', id: 'btnEst', type: 'button', role: 'menuitem' }, '📊 Estatísticas anônimas'); b.onclick = estAlterna;
  lista.append(b);
})();
