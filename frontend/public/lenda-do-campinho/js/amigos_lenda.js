/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🤝 AMIGOS NO JOGO + 📣 TORCIDA (v353 — item 5 do pacote: social seguro para crianças)
   - Só com a conta do Educação Gamer e só os AMIGOS aceitos no site (quem adiciona amigo é o site).
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
async function modalAmigos() {
  if (!PORTAL.token) {
    abreModal(el('h2', {}, '🤝 Amigos'), el('p', {}, 'Entre com a sua conta do Educação Gamer para ver aqui os seus amigos que jogam o Lenda do Campinho e mandar torcida para eles.'),
      el('p', { class: 'vazio' }, 'Os amigos são adicionados no site (menu Amigos).'));
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
  abreModal(el('h2', {}, '🤝 Amigos'), el('p', { class: 'vazio' }, 'Seus amigos do Educação Gamer que jogam o Lenda. Torcida = frases prontas, 1 por amigo por dia.'), lista);
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
  .amg-frases { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; margin: 8px 0; }`;
  document.head.append(css);
}
