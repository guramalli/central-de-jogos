/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — CÓPIA DE SEGURANÇA DO PROGRESSO
   Exporta o save para um arquivo .json e importa de volta
   (outro navegador, outro computador ou depois de limpar dados).
   Carregar DEPOIS de ui.js.
   ============================================================ */
const BACKUP_TIPO = 'rumo-ao-craque-save';

function resumoSave(s) {
  if (!s) return 'nenhum progresso salvo';
  const fase = typeof faseIdx === 'function' && FASES[faseIdx(s.nivel)] ? FASES[faseIdx(s.nivel)].nome : '';
  return `${s.nome} — level ${s.nivel}${fase ? ' (' + fase + ')' : ''}${s.time ? ' · club ' + s.time.nome : ''}`;
}
function saveValido(s) {
  return s && typeof s === 'object' && typeof s.nome === 'string' && Number.isFinite(s.nivel) && s.nivel >= 1 && Array.isArray(s.mochila) && s.sk && s.equip && s.v;
}
function exportarSave() {
  if (G.save && G.rodando) salvar(); // grava a posição atual antes
  const s = lerSave();
  if (!s) { avisoJogo('There\'s no saved progress to export yet.'); return; }
  const pacote = { tipo: BACKUP_TIPO, versao: 1, exportadoEm: new Date().toISOString(), save: s };
  const blob = new Blob([JSON.stringify(pacote)], { type: 'application/json' });
  const data = new Date(); const d = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  const nomeArq = `lenda-do-campinho_${(s.nome || 'jogador').replace(/[^\p{L}\p{N}_-]+/gu, '-')}_nivel${s.nivel}_${d}.json`;
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nomeArq;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  if (typeof log === 'function' && G.rodando) log(`💾 Progress exported: ${nomeArq}`, 'l-sis');
  return nomeArq;
}
function importarArquivo(arquivo, aoTerminar) {
  const leitor = new FileReader();
  leitor.onload = async () => {
    let pacote = null;
    try { pacote = JSON.parse(leitor.result); } catch { }
    const s = pacote && (pacote.tipo === BACKUP_TIPO ? pacote.save : pacote); // aceita também o save "puro"
    if (!saveValido(s)) { avisoJogo('This file isn\'t a Lenda do Campinho save (or it\'s damaged).'); return aoTerminar && aoTerminar(false); }
    const atual = lerSave();
    const msg = `Load progress from the file?\n\nFile: ${resumoSave(s)}\nCurrent: ${resumoSave(atual)}\n\nThe current progress in this browser will be REPLACED.`;
    if (!(await perguntaJogo(msg, { titulo: 'Load progress', sim: 'Load', perigo: true }))) return aoTerminar && aoTerminar(false);
    delete s.conta; // o save importado passa a ser de quem está jogando (o jogo pergunta se houver outro na conta)
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { avisoJogo('Couldn\'t save the game in this browser.'); return aoTerminar && aoTerminar(false); }
    G.rodando = false; // não deixa o jogo aberto regravar o save antigo por cima
    await avisoJogo(`${s.nome}'s progress loaded! The game will restart.`, { ok: 'Restart' });
    location.reload();
  };
  leitor.readAsText(arquivo);
}
function escolheArquivo() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => { if (inp.files && inp.files[0]) importarArquivo(inp.files[0]); };
  inp.click();
}
function modalBackup() {
  const atual = lerSave();
  abreModal(el('h2', {}, '💾 Backup'),
    el('p', {}, 'Your progress is saved in this browser. Export a file every now and then: with it you can get everything back if you clear your browser data, or keep playing on another computer.'),
    el('p', {}, el('b', {}, 'Current progress: '), resumoSave(atual)),
    el('div', { class: 'opcoes' },
      el('button', { class: 'btn amarelo', disabled: atual ? null : 'disabled', onclick: () => exportarSave() }, '⬇️ Export (download file)'),
      el('button', { class: 'btn', onclick: escolheArquivo }, '📂 Import file...')),
    el('p', { class: 'vazio' }, 'Importing REPLACES the current progress in this browser (the game asks you to confirm first).'));
  if (!G.rodando) $('#modal').onclick = null;
}
// botões: na barra de cima do jogo e na tela inicial
(function () {
  const som = document.getElementById('btnSom');
  if (som && !document.getElementById('btnBackup')) { const b = el('button', { class: 'btn mini', id: 'btnBackup', title: 'Export / import your progress' }, '💾 Save'); b.onclick = modalBackup; som.before(b); }
  const menu = document.getElementById('inicioMenu');
  if (menu && !document.getElementById('btnBackupInicio')) { const b = el('button', { class: 'btn', id: 'btnBackupInicio' }, '💾 Export / import progress'); b.onclick = modalBackup; menu.append(b); }
})();
