/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   BETA: selo "BETA" na logo e botão "🐞 Informar bug"
   O relatório junta o que o jogador escreveu + dados técnicos
   (versão, mapa, posição, nível, navegador, últimos erros e chat).
   Para onde vai: configure BUG_DESTINO abaixo. Sem destino,
   o jogador copia o texto ou baixa o arquivo para enviar.
   ============================================================ */
const BUG_DESTINO = { email: '', formulario: '' }; // ex.: email: 'contato@educacaogamer.com.br' — ou o link de um formulário
const VERSAO_JOGO = ((document.querySelector('script[src*="game.js"]') || {}).src || '').split('v=')[1] || '?';

// guarda os últimos erros do jogo para o relatório
const ERROS_JOGO = [];
addEventListener('error', e => { ERROS_JOGO.push(`${new Date().toLocaleTimeString()} ${e.message} @ ${(e.filename || '').split('/').pop()}:${e.lineno}`); if (ERROS_JOGO.length > 15) ERROS_JOGO.shift(); });
addEventListener('unhandledrejection', e => { ERROS_JOGO.push(`${new Date().toLocaleTimeString()} promessa: ${e.reason && e.reason.message || e.reason}`); if (ERROS_JOGO.length > 15) ERROS_JOGO.shift(); });

function relatorioBug(texto) {
  const s = G.save, p = G.p;
  const linhas = [
    'LENDA DO CAMPINHO — RELATÓRIO DE BUG (BETA)',
    `Data: ${new Date().toLocaleString('pt-BR')}`, `Versão: ${VERSAO_JOGO}`, '',
    'O QUE ACONTECEU:', texto || '(não descrito)', '',
    'DADOS DO JOGO:',
    s ? `Jogador: ${s.nome} · nível ${s.nivel} · classe ${s.classe || '-'} · tostões ${s.ouro}` : 'Sem jogo aberto (tela inicial)',
    G.mapa && p ? `Mapa: ${G.mapa.id} (${G.mapa.nome}) · posição ${Number(p.x).toFixed(2)}, ${Number(p.y).toFixed(2)}` : '',
    s ? `Tutorial: ${s.tut} · montado: ${!!s.montado} · skin: ${s.skin || '-'} · dia ${s.dia}` : '',
    `Tela: ${innerWidth}×${innerHeight} (x${devicePixelRatio}) · ${document.body.classList.contains('modo-celular') ? 'modo celular' : 'modo computador'}`,
    `Navegador: ${navigator.userAgent}`, '',
    'ÚLTIMOS ERROS:', ...(ERROS_JOGO.length ? ERROS_JOGO : ['(nenhum)']), '',
    'ÚLTIMAS MENSAGENS DO CHAT:', ...[...document.querySelectorAll('#log div')].slice(-15).map(d => d.textContent),
  ];
  return linhas.filter(l => l !== undefined).join('\n');
}
function baixaArquivo(nome, conteudo, tipo) {
  const url = typeof conteudo === 'string' && conteudo.startsWith('data:') ? conteudo : URL.createObjectURL(new Blob([conteudo], { type: tipo || 'text/plain;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = nome; document.body.append(a); a.click(); a.remove();
  if (!url.startsWith('data:')) setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function modalBug() {
  // foto da tela do jogo tirada ANTES de abrir a janela
  let foto = null; try { if (G.rodando && CV) foto = CV.toDataURL('image/jpeg', 0.8); } catch (e) { }
  const area = el('textarea', { class: 'bug-txt', rows: 5, maxlength: 2000, placeholder: 'Conte o que aconteceu: o que você estava fazendo, o que esperava e o que apareceu. Ex.: "Saí de casa e a tela ficou roxa, sem o mapa."' });
  const dados = el('details', { class: 'bug-dados' }, el('summary', {}, 'Ver os dados técnicos que vão junto'), el('pre', {}, relatorioBug('(seu texto)')));
  const ok = el('p', { class: 'bug-ok', hidden: 'hidden' });
  const pronto = msg => { ok.textContent = msg; ok.hidden = false; };
  const ops = el('div', { class: 'opcoes' });
  if (BUG_DESTINO.email) ops.append(el('button', { class: 'btn amarelo', type: 'button', onclick: () => {
    const corpo = relatorioBug(area.value.trim()); const assunto = `Bug Lenda do Campinho v${VERSAO_JOGO}`;
    location.href = `mailto:${BUG_DESTINO.email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo.slice(0, 1800))}`;
    pronto('Abrindo o seu e-mail... Se quiser mandar a foto da tela, baixe ela abaixo e anexe no e-mail.');
  } }, '📧 Enviar por e-mail'));
  if (BUG_DESTINO.formulario) ops.append(el('button', { class: 'btn amarelo', type: 'button', onclick: () => { navigator.clipboard && navigator.clipboard.writeText(relatorioBug(area.value.trim())).catch(() => { }); open(BUG_DESTINO.formulario, '_blank', 'noopener'); pronto('O relatório foi copiado. Cole no formulário que abriu.'); } }, '📝 Abrir formulário'));
  ops.append(
    el('button', { class: 'btn' + (BUG_DESTINO.email || BUG_DESTINO.formulario ? '' : ' amarelo'), type: 'button', onclick: async () => {
      try { await navigator.clipboard.writeText(relatorioBug(area.value.trim())); pronto('Relatório copiado! Cole numa mensagem para o Educação Gamer.'); }
      catch (e) { baixaArquivo(`bug-lenda-v${VERSAO_JOGO}.txt`, relatorioBug(area.value.trim())); pronto('Não deu para copiar, então baixei o arquivo do relatório.'); }
    } }, '📋 Copiar relatório'),
    el('button', { class: 'btn', type: 'button', onclick: () => { baixaArquivo(`bug-lenda-v${VERSAO_JOGO}-${Date.now()}.txt`, relatorioBug(area.value.trim())); pronto('Arquivo do relatório baixado.'); } }, '💾 Baixar arquivo'),
    foto ? el('button', { class: 'btn', type: 'button', onclick: () => { baixaArquivo(`tela-lenda-${Date.now()}.jpg`, foto); pronto('Foto da tela baixada.'); } }, '📷 Baixar foto da tela') : '',
    el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Fechar'));
  abreModal(el('h2', {}, '🐞 Informar bug'),
    el('p', {}, 'O jogo está em BETA: ainda pode ter erros. Obrigado por ajudar a melhorar!'),
    area, dados, ok, ops);
  setTimeout(() => area.focus(), 50);
}

(function () {
  // selo BETA na logo da tela inicial e no topo do jogo
  const logo = document.querySelector('.logo-jogo');
  if (logo && !logo.querySelector('.selo-beta')) logo.append(el('span', { class: 'selo-beta', title: 'Versão de testes: pode ter erros' }, 'BETA'));
  const marca = document.querySelector('#topo .marca b');
  if (marca && !document.querySelector('#topo .tag-beta')) marca.after(el('span', { class: 'tag-beta' }, 'BETA'));
  const aviso = document.querySelector('#inicio .sub');
  if (aviso && !document.querySelector('.aviso-beta')) aviso.after(el('p', { class: 'aviso-beta' }, '🧪 Versão BETA: o jogo ainda está em testes e pode ter erros. Achou algum? Use o botão 🐞 Informar bug.'));
  // botão no topo do jogo, na tela inicial e no menu do celular
  const som = document.getElementById('btnSom');
  if (som && !document.getElementById('btnBug')) { const b = el('button', { class: 'btn mini', id: 'btnBug', type: 'button', title: 'Informar um problema do jogo' }, '🐞 Bug'); b.onclick = () => modalBug(); som.before(b); }
  const menu = document.getElementById('inicioMenu');
  if (menu && !document.getElementById('btnBugInicio')) { const b = el('button', { class: 'btn', id: 'btnBugInicio', type: 'button' }, '🐞 Informar bug'); b.onclick = () => modalBug(); menu.append(b); }
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade) grade.append(el('button', { class: 'btn cm-bt', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); modalBug(); } }, el('span', { class: 'cm-ic' }, '🐞'), 'Informar bug'));
  const hud = document.querySelector('#celHud .ch-nome');
  if (hud) hud.append(el('span', { class: 'tag-beta' }, 'BETA'));

  const st = document.createElement('style');
  st.textContent = `
  .logo-jogo { position: relative; display: block; width: min(560px, 88%); margin-left: auto; margin-right: auto; }
  .logo-jogo img { width: 100% !important; }
  .selo-beta { position: absolute; right: -2%; top: 14%; transform: rotate(12deg); background: linear-gradient(#ff6a5a, #d8303a); color: #fff; font: 800 clamp(14px, 2.6vw, 22px)/1 Fredoka, sans-serif; letter-spacing: 1px; padding: 6px 12px; border-radius: 10px; border: 3px solid #fff; box-shadow: 0 4px 0 #8a1a1a, 0 6px 12px rgba(0,0,0,.3); animation: seloBeta 2.4s ease-in-out infinite; pointer-events: none; }
  @keyframes seloBeta { 50% { transform: rotate(8deg) scale(1.06); } }
  .tag-beta { display: inline-block; margin-left: 6px; background: #d8303a; color: #fff; font: 800 10px/1 Fredoka, sans-serif; letter-spacing: .5px; padding: 3px 5px; border-radius: 5px; vertical-align: middle; }
  .aviso-beta { margin: 4px auto 0; max-width: 560px; font-size: 13px; color: #8a1a1a; background: #ffe8d8; border: 2px dashed #d86a4a; border-radius: 8px; padding: 5px 10px; }
  .bug-txt { width: 100%; box-sizing: border-box; font: 600 14px Nunito, sans-serif; padding: 8px; border-radius: 8px; border: 2px solid var(--madeira3); background: #fffaf0; resize: vertical; }
  .bug-dados { margin: 8px 0; font-size: 12px; }
  .bug-dados pre { max-height: 160px; overflow: auto; background: #241640; color: #e8e0ff; padding: 8px; border-radius: 6px; white-space: pre-wrap; font-size: 11px; }
  .bug-ok { background: #d8f5c0; color: #1a6a2a; font-weight: 800; border-radius: 6px; padding: 6px 10px; }
  /* lista de batalha com altura fixa: rola quando tiver muitos adversários */
  #listaBatalha { height: 240px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--madeira3) transparent; padding-right: 2px; }
  `;
  document.head.append(st);
})();

// aba Habilidades aberta: a porcentagem das barras acompanha o treino (1x por segundo)
setInterval(() => {
  if (!G.rodando || !G.skSujo) return;
  const aba = document.getElementById('aba-skills'); if (!aba || !aba.offsetParent) return;
  G.skSujo = false; G.uiSujo = true;
}, 1000);
