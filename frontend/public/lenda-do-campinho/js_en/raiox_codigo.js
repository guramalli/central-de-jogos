/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🩻 RAIO-X — CÓDIGO E MEMÓRIA (v407; pedido do dono: "faça tudo menos I1")
   A8) save que não grava não fica mais calado: libera espaço (cópias velhas "rac_save_semconta_*") e avisa o jogador;
       pede ao navegador para NÃO apagar os dados do jogo sozinho (navigator.storage.persist);
       migraSave: um único ponto que conhece a VERSÃO do formato do save (s.fmt) e faz as conversões, uma vez por save.
   T4) a limpeza dos saves da volta para a v258 (antigo volta_v258.js) virou o passo 1 do migraSave.
   Picos de 15–37 ms no atualiza: quando vários adversários desistem juntos, todos procuravam o caminho de volta
       no MESMO quadro (busca de até 5.000 quadrados cada). Agora são no máximo 2 buscas (ou ~3 ms) por quadro;
       os outros tentam no quadro seguinte. E adversário calmo bem longe da tela é atualizado 4x menos.
   Prefixo rx. Carregar no FIM do index.html (depois de game.js, nuvem.js, contas.js, caca_grupo.js, torre_coop.js
   e de todos os arquivos que embrulham atualizaMonstro).
   ============================================================ */
const RX = { avisouSave: 0, buscas: 0, msBusca: 0, dentroMon: false, barrou: false };

/* ---------- A8: espaço do navegador ---------- */
// apaga as cópias "rac_save_semconta_<criado>" (contas.js guarda o personagem do aparelho quando a pessoa escolhe o da conta).
// manter = quantas das mais NOVAS ficam.
function rxLimpaSemConta(manter = 1) {
  const ks = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('rac_save_semconta_')) ks.push(k); } } catch (e) { return 0; }
  ks.sort((a, b) => (Number(b.slice(18)) || 0) - (Number(a.slice(18)) || 0)); // a mais nova primeiro
  let n = 0; for (const k of ks.slice(manter)) { try { localStorage.removeItem(k); n++; } catch (e) { } }
  return n;
}
// chamada por salvar() (game.js) quando o localStorage recusa o save: libera espaço, tenta de novo e, se não der, AVISA
function salvarFalhou(erro, chave, s) {
  const tenta = () => { try { localStorage.setItem(chave, JSON.stringify(s)); return true; } catch (e) { return false; } };
  if (rxLimpaSemConta(1) && tenta()) return;
  if (rxLimpaSemConta(0) && tenta()) return;
  try { localStorage.removeItem('rac_log_grande'); localStorage.removeItem('rac_chao_ms'); } catch (e) { }
  if (tenta()) return;
  const agora = Date.now(); if (agora - RX.avisouSave < 120000) return; // no máximo 1 aviso a cada 2 minutos
  const primeira = !RX.avisouSave; RX.avisouSave = agora;
  const online = typeof NUVEM !== 'undefined' && NUVEM.ativa && !NUVEM.parada;
  const txt = '⚠️ This browser is out of space and the game could NOT save here.' + (online ? ' Your progress is still being saved online, in your account.' : '') + ' To be safe, keep a copy in 💾 Save → Export.';
  try { log(txt, 'l-dano'); } catch (e) { }
  if (primeira && typeof avisoJogo === 'function') try { avisoJogo(txt, { titulo: 'Couldn\'t save' }); } catch (e) { }
}
// ao abrir o jogo: cópias "semconta" acumuladas (mais de 3) — as mais velhas saem
try { rxLimpaSemConta(3); } catch (e) { }
// pede ao navegador para não apagar os dados do jogo quando o aparelho ficar sem espaço (sem perguntar nada no Chrome/Edge)
{
  const _iniRx = iniciarJogo;
  iniciarJogo = async function () {
    const r = await _iniRx.apply(this, arguments);
    try { const st = navigator.storage; if (st && st.persist && st.persisted) st.persisted().then(p => { if (!p) return st.persist(); }).catch(() => { }); } catch (e) { }
    return r;
  };
}

/* ---------- A8: versão do formato do save (s.fmt) e ponto ÚNICO de migração ----------
   Para mudar o formato do save no futuro: aumente SAVE_FORMATO e escreva o passo novo em MIGRACOES_SAVE[n]
   (recebe o save e o converte do formato n-1 para n). Cada passo roda UMA vez por save. */
const SAVE_FORMATO = 1;
const MIGRACOES_SAVE = {
  // 0 → 1 (v407): o formato de hoje, sem mudar dados. Traz a limpeza que ficava em volta_v258.js (v264): quem jogou
  // nas v259–v263 podia ter jogadas de OUTRAS classes (a v262 dava todas para todo mundo) e a posição "Volante".
  1: s => {
    if (s.classe && Array.isArray(s.dribles) && typeof DRIBLES !== 'undefined') {
      const outra = id => DRIBLES[id] && DRIBLES[id].classe && DRIBLES[id].classe !== s.classe;
      s.dribles = s.dribles.filter(id => !outra(id));
      if (Array.isArray(s.hotbar)) s.hotbar = s.hotbar.map(h => h && h.t === 'd' && outra(h.id) ? null : h);
    }
    if (s.posicao && typeof POSICOES !== 'undefined' && !POSICOES[s.posicao]) s.posicao = typeof posicaoDaClasse === 'function' ? posicaoDaClasse(s.classe) : 'meia';
    delete s.estiloCompleto;
  },
};
function migraSave(s) {
  if (!s || typeof s !== 'object') return s;
  let f = Number(s.fmt) || 0;
  if (f > SAVE_FORMATO) return s; // save de uma versão MAIS NOVA do jogo (ex.: voltou a versão): não mexe
  while (f < SAVE_FORMATO) { f++; try { if (MIGRACOES_SAVE[f]) MIGRACOES_SAVE[f](s); } catch (e) { console.warn('migraSave', f, e); } s.fmt = f; }
  return s;
}
{
  const _normRx = normalizaSave; // primeira coisa que iniciarJogo faz com o save
  normalizaSave = function (s) { try { migraSave(s); } catch (e) { } return _normRx.apply(this, arguments); };
}

/* ---------- picos no atualiza: buscas de caminho dos adversários espalhadas pelos quadros ---------- */
{
  const _caminhoRx = caminho;
  caminho = function () {
    if (!RX.dentroMon) return _caminhoRx.apply(this, arguments);
    if (RX.buscas >= 2 || RX.msBusca > 3) { RX.barrou = true; return null; } // este fica para o próximo quadro
    const t = performance.now();
    try { return _caminhoRx.apply(this, arguments); } finally { RX.buscas++; RX.msBusca += performance.now() - t; }
  };
  const _atualizaRx = atualiza;
  atualiza = function () { RX.buscas = 0; RX.msBusca = 0; return _atualizaRx.apply(this, arguments); };
  // adversário calmo, longe da tela (5 quadrados além da beirada), sem chefão/arena/combo/caça em grupo: 1 atualização a cada ~4 quadros
  const emGrupo = () => (typeof CG !== 'undefined' && CG.modo) || (typeof CO !== 'undefined' && CO.jogando);
  const _amRx = atualizaMonstro;
  atualizaMonstro = function (m, dt) {
    if (m && m.d && G.p && !m.bravo && !m.voltando && !m.pas && !m.ar && !m.espelho && !m.d.chefe && !m.d.arena && !m.d.pedraTorre && !(m._fila && m._fila.length) && !emGrupo() && !naTela(m, 5)) {
      m._rxAc = (m._rxAc || 0) + (dt || 16);
      if (m._rxAc < 60) { m.mov = false; return; }
      dt = Math.min(m._rxAc, 250); m._rxAc = 0;
    } else if (m) m._rxAc = 0;
    RX.dentroMon = true; RX.barrou = false;
    try { return _amRx.call(this, m, dt); }
    finally { RX.dentroMon = false; if (RX.barrou && m) { m.tCam = 0; m.tCamV = 0; } } // não achou vaga para buscar: tenta já no próximo quadro
  };
}
