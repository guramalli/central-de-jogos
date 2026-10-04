/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🤝 AMIGOS NO JOGO + 📣 TORCIDA (v353 — item 5 do pacote: social seguro para crianças)
   - Só com a conta do Educação Gamer e só os AMIGOS aceitos (v382, dono: "amigos apenas pelo site não é legal, não dá
     para adicionar pelo jogo?": agora dá — por apelido, ou ➕ em quem está perto no mundo compartilhado; pedidos recebidos
     e enviados aqui mesmo. Usa as rotas de amizade do site: /api/friends).
   - Lista: apelido, nível, fase; 👤 ver a ficha; 🏠 visitar a casa publicada.
   - 📣 Torcer: uma de 6 frases PRONTAS (nada de texto livre), 1 por amigo por dia.
     O amigo vê "📣 FULANO torceu por você: 👏 Mandou bem!" quando abrir o jogo (ou em até 5 min).
   - Conversa livre fica no chat do site (com as regras e a moderação de lá). Steam: desligado.
   Rotas: GET /api/lenda/amigos · POST /api/lenda/torcida · GET /api/lenda/torcidas
   ============================================================ */
const AMG = { torcidas: null };
const amgLigado = () => typeof PORTAL !== 'undefined' && PORTAL.ativo && !window.LENDA_STEAM;
async function amgPede(metodo, caminho, corpo) {
  const r = await fetch(PORTAL.api + '/api/lenda' + caminho, { method: metodo, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + PORTAL.token }, body: corpo ? JSON.stringify(corpo) : undefined });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, dados: j };
}
// amizade (as mesmas rotas do site): GET /api/friends · POST /api/friends/request · POST /api/friends/:id/accept · DELETE /api/friends/:id
async function amgSite(metodo, caminho, corpo) {
  const r = await fetch(PORTAL.api + '/api/friends' + caminho, { method: metodo, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + PORTAL.token }, body: corpo ? JSON.stringify(corpo) : undefined });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, dados: j };
}
async function amgPedeAmizade(alvo, depois) { // alvo: { targetUserId } ou { nickname }
  let r; try { r = await amgSite('POST', '/request', alvo); } catch (e) { r = { ok: false, dados: {} }; }
  if (r.ok) { som('moeda'); avisoJogo(`🤝 Pedido de amizade enviado para ${r.dados.nickname || alvo.nickname || 'o jogador'}! Quando aceitar, vocês podem caçar em grupo.`); }
  else avisoJogo('🤝 ' + ((r.dados && r.dados.error) || 'Não deu para enviar o pedido agora.'));
  if (typeof depois === 'function') depois(r.ok);
  return r.ok;
}
window.amgPedeAmizade = amgPedeAmizade;
// pedidos de amizade: recebidos (aceitar/recusar), enviados (cancelar) e adicionar por apelido
async function amgPedidos() {
  const caixa = el('div', { class: 'amg-pedidos' });
  const ap = el('input', { maxlength: 30, placeholder: 'Apelido no Educação Gamer', style: 'flex:1;min-width:150px' });
  const manda = () => { const n = ap.value.trim(); if (n) amgPedeAmizade({ nickname: n }, ok => { if (ok) modalAmigos(); }); };
  ap.addEventListener('keydown', e => { if (e.key === 'Enter') manda(); e.stopPropagation(); });
  caixa.append(el('div', { class: 'opcoes', style: 'align-items:center' }, '➕ Adicionar amigo:', ap, el('button', { class: 'btn amarelo', type: 'button', onclick: manda }, 'Enviar pedido')));
  let r; try { r = await amgSite('GET', ''); } catch (e) { r = { ok: false }; }
  if (!r.ok) return caixa;
  const rec = r.dados.receivedPending || [], env = r.dados.sentPending || [];
  for (const p of rec) caixa.append(el('div', { class: 'amg-linha amg-novo' }, el('span', {}, `📨 ${p.nickname} quer ser seu amigo`), el('div', { class: 'amg-botoes' },
    el('button', { class: 'btn mini amarelo', type: 'button', onclick: async () => { const x = await amgSite('POST', `/${p.friendshipId}/accept`); avisoJogo(x.ok ? `🤝 Agora você e ${p.nickname} são amigos!` : '🤝 Não deu para aceitar agora.'); modalAmigos(); } }, '✅ Aceitar'),
    el('button', { class: 'btn mini', type: 'button', onclick: async () => { await amgSite('DELETE', `/${p.friendshipId}`); modalAmigos(); } }, '❌ Recusar'))));
  if (env.length) caixa.append(el('details', {}, el('summary', {}, `⏳ Pedidos que você enviou (${env.length})`), ...env.map(p => el('div', { class: 'amg-linha' }, el('span', {}, `${p.nickname} ainda não respondeu`),
    el('button', { class: 'btn mini', type: 'button', onclick: async () => { await amgSite('DELETE', `/${p.friendshipId}`); modalAmigos(); } }, 'Cancelar')))));
  return caixa;
}
async function modalAmigos() {
  if (!PORTAL.token) {
    abreModal(el('h2', {}, '🤝 Amigos'), el('p', {}, 'Entre com a sua conta do Educação Gamer para ver aqui os seus amigos que jogam o Lenda do Campinho e mandar torcida para eles.'),
      el('p', { class: 'vazio' }, 'Com a conta, você adiciona amigos aqui mesmo no jogo.'));
    return;
  }
  abreModal(el('h2', {}, '🤝 Amigos'), el('p', { class: 'vazio' }, 'Carregando...'));
  let r; try { r = await amgPede('GET', '/amigos'); } catch (e) { r = { ok: false }; }
  if (!r.ok) { abreModal(el('h2', {}, '🤝 Amigos'), el('p', {}, r.status === 404 ? 'Em breve!' : 'Não deu para carregar os amigos agora. Tente de novo em instantes.')); return; }
  AMG.torcidas = r.dados.torcidas || {};
  const amigos = r.dados.amigos || [];
  const lista = el('div', { class: 'amg-lista' });
  if (!amigos.length) lista.append(el('p', { class: 'vazio' }, 'Nenhum amigo seu joga o Lenda ainda. Chame os seus amigos do site para jogar!'));
  for (const a of amigos) {
    const ult = a.ultimoJogo ? Math.floor((Date.now() - new Date(a.ultimoJogo)) / 864e5) : null;
    const linha = el('div', { class: 'amg-linha' },
      el('div', { class: 'amg-info' }, el('b', {}, a.apelido), el('span', {}, ` · Nv ${a.nivel} · ${a.fase || ''}${a.posicao ? ' · ' + a.posicao : ''}`),
        el('small', {}, ult == null ? '' : ult === 0 ? ' · jogou hoje' : ` · jogou há ${ult} dia(s)`)),
      el('div', { class: 'amg-botoes' },
        el('button', { class: 'btn mini', type: 'button', title: 'Ver a ficha', onclick: () => typeof modalPersonagens === 'function' && modalPersonagens(a.apelido) }, '👤'),
        a.casaId && typeof visitaCasa === 'function' ? el('button', { class: 'btn mini', type: 'button', title: 'Visitar a casa', onclick: () => { fechaModal(); visitaCasa(a.id, a.casaId); } }, '🏠') : '',
        el('button', { class: 'btn mini amg-torcer', type: 'button', onclick: () => amgEscolheTorcida(a) }, '📣 Torcer')));
    lista.append(linha);
  }
  const pedidos = await amgPedidos();
  abreModal(el('h2', {}, '🤝 Amigos'), pedidos, el('p', { class: 'vazio' }, 'Seus amigos do Educação Gamer que jogam o Lenda. Torcida = frases prontas, 1 por amigo por dia.'), lista);
}
function amgEscolheTorcida(a) {
  const caixa = el('div', { class: 'amg-frases' });
  for (const [tipo, texto] of Object.entries(AMG.torcidas || {})) caixa.append(el('button', { class: 'btn', type: 'button', onclick: () => amgTorce(a, tipo, texto) }, texto));
  abreModal(el('h2', {}, `📣 Torcer por ${a.apelido}`), caixa, el('button', { class: 'btn mini', type: 'button', onclick: modalAmigos }, '← Voltar'));
}
async function amgTorce(a, tipo, texto) {
  let r; try { r = await amgPede('POST', '/torcida', { para: a.id, tipo }); } catch (e) { r = { ok: false, dados: {} }; }
  if (r.ok) { som('moeda'); avisoJogo(`📣 Torcida enviada para ${a.apelido}: ${texto}`); modalAmigos(); }
  else avisoJogo('📣 ' + ((r.dados && r.dados.error) || 'Não deu para enviar agora.'));
}
// torcidas recebidas: ao entrar e a cada 5 min
async function amgRecebe() {
  if (!amgLigado() || !PORTAL.token || !G.rodando) return;
  let r; try { r = await amgPede('GET', '/torcidas'); } catch (e) { return; }
  if (!r.ok) return;
  for (const t of (r.dados.torcidas || []).slice(-5)) {
    log(`📣 ${t.de} torceu por você: ${t.texto}`, 'l-xp');
    banner(`📣 ${t.de} torceu por você!`, t.texto);
  }
  if ((r.dados.torcidas || []).length) som('raro');
}
if (amgLigado()) { setTimeout(amgRecebe, 15000); setInterval(amgRecebe, 5 * 60000); }
// pedidos de amizade novos: avisa ao entrar e a cada 5 min (só quando muda)
async function amgPedidosNovos() {
  if (!amgLigado() || !PORTAL.token || !G.rodando) return;
  let r; try { r = await amgSite('GET', '/pending-count'); } catch (e) { return; }
  const n = r.ok ? (+r.dados.count || +r.dados.pending || +r.dados.total || 0) : 0;
  if (n > (AMG.pedidosVistos || 0)) { log(`📨 Você tem ${n} pedido(s) de amizade! Abra ☰ Mais › 🤝 Amigos para aceitar.`, 'l-xp'); banner('📨 Pedido de amizade!', '☰ Mais › 🤝 Amigos'); }
  AMG.pedidosVistos = n;
}
if (amgLigado()) { setTimeout(amgPedidosNovos, 20000); setInterval(amgPedidosNovos, 5 * 60000); }
(function poeBotaoAmg(t = 0) {
  if (!amgLigado()) return;
  const lista = document.querySelector('.tb-lista'); if (!lista) { if (t < 40) setTimeout(() => poeBotaoAmg(t + 1), 500); return; }
  if (document.getElementById('btnAmigos')) return;
  const b = el('button', { class: 'btn', id: 'btnAmigos', type: 'button', role: 'menuitem' }, '🤝 Amigos'); b.onclick = modalAmigos;
  lista.prepend(b);
})();
{
  const css = document.createElement('style');
  css.textContent = `.amg-lista { display: flex; flex-direction: column; gap: 6px; max-height: 60vh; overflow: auto; }
  .amg-linha { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 8px; border-radius: 10px; background: rgba(0,0,0,.06); flex-wrap: wrap; }
  .amg-info small { opacity: .7; } .amg-botoes { display: flex; gap: 4px; }
  .amg-pedidos { margin-bottom: 8px; } .amg-novo { background: rgba(255,200,40,.18); }
  .amg-frases { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; margin: 8px 0; }`;
  document.head.append(css);
}
