/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   SAIR: "Sair do jogo" (volta à tela inicial) e, dentro do site,
   "Sair da conta" (desloga do Educação Gamer, igual ao botão Sair do site:
   apaga eg_token / eg_user). Antes de sair, salva — e manda o save pra
   nuvem quando dá. O save deste navegador NÃO é apagado.
   Carregar DEPOIS de topo.js (usa o menu ☰ Mais).
   ============================================================ */
async function salvaAntesDeSair() {
  try { salvar(); } catch (e) { }
  // save online: espera no máximo 4 s (sem internet, sai assim mesmo; o save local fica)
  if (typeof NUVEM !== 'undefined' && NUVEM.ativa && typeof enviaSave === 'function') {
    try { NUVEM.enviando = false; await Promise.race([enviaSave(true), new Promise(r => setTimeout(r, 4000))]); } catch (e) { }
  }
}
function modalSair() {
  const logado = typeof PORTAL !== 'undefined' && PORTAL.ativo && PORTAL.token;
  const nome = logado && PORTAL.user && PORTAL.user.nickname ? PORTAL.user.nickname : '';
  const aviso = el('p', { class: 'vazio' }, '');
  const botoes = el('div', { class: 'sair-botoes' });
  const trava = (txt) => { botoes.querySelectorAll('button').forEach(b => b.disabled = true); aviso.textContent = txt; };
  botoes.append(el('button', { class: 'btn amarelo', type: 'button', onclick: async () => {
    trava('Salvando...'); await salvaAntesDeSair(); location.reload(); // recarrega = tela inicial ("Continuar" leva de volta)
  } }, '🚪 Sair do jogo'));
  if (logado) botoes.append(el('button', { class: 'btn vermelho', type: 'button', onclick: async () => {
    trava('Salvando e saindo da conta...'); await salvaAntesDeSair();
    try { localStorage.removeItem('eg_token'); localStorage.removeItem('eg_user'); } catch (e) { }
    location.href = '/';
  } }, '👋 Sair da conta' + (nome ? ` (${nome})` : '')));
  botoes.append(el('button', { class: 'btn', type: 'button', onclick: () => fechaModal() }, 'Continuar jogando'));
  abreModal(el('h2', {}, '🚪 Sair'),
    el('p', {}, 'Seu progresso é salvo antes de sair.' + (logado ? ' "Sair da conta" também desconecta você do site Educação Gamer.' : '')),
    botoes, aviso);
}
function sairDaContaInicio() {
  if (!confirm('Sair da sua conta do Educação Gamer?')) return;
  try { localStorage.removeItem('eg_token'); localStorage.removeItem('eg_user'); } catch (e) { }
  location.href = '/';
}
(function () {
  const lista = document.querySelector('#topo .tb-lista');
  if (lista && !document.getElementById('btnSair')) lista.append(el('button', { class: 'btn vermelho', id: 'btnSair', type: 'button', role: 'menuitem', onclick: () => modalSair() }, '🚪 Sair'));
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade && !document.getElementById('cmSair')) grade.append(el('button', { class: 'btn cm-bt', id: 'cmSair', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); modalSair(); } }, el('span', { class: 'cm-ic' }, '🚪'), 'Sair'));
  // tela inicial, dentro do site: "Jogando como X · Sair"
  const quem = document.querySelector('.portal-barra .portal-quem');
  if (quem && typeof PORTAL !== 'undefined' && PORTAL.token && !document.getElementById('inicioSairConta')) {
    quem.after(el('button', { class: 'btn mini', id: 'inicioSairConta', type: 'button', title: 'Sair da conta do Educação Gamer', onclick: () => sairDaContaInicio() }, 'Sair da conta'));
  }
  const st = document.createElement('style');
  st.textContent = `
  .sair-botoes { display: flex; flex-direction: column; gap: 8px; margin: 12px 0 4px; }
  .sair-botoes .btn { width: 100%; }
  .tb-lista .btn.vermelho, .sair-botoes .btn.vermelho { background: #d8303a; border-color: #8a1a20; color: #fff; }
  `;
  document.head.append(st);
})();
