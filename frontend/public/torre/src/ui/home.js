// Página de Início (Obra Viva): logo, Continuar/Novo jogo, 3 espaços de save, Como jogar, Ranking e Configurações.
// Abre sempre ao carregar (menos nos testes automáticos); enquanto aberta, a simulação e o relógio da rodada param
// (main.js consulta homeOpen()). A cena continua desenhada atrás, desfocada.
import { S, save, activeSlot, setSlot, slotSummary, deleteSlot, exportSave, importSave } from '../sim/state.js';
import { FLAGS } from '../data/flags.js';
import { cfg, setCfg } from './config.js';
import { setSound, setVolume } from './audio.js';
import { fmtM, fmtPct } from './format.js';
import { repPct } from '../sim/prestige.js';
import { dropTip } from './coach.js';
import { LANG, setLang, t } from '../i18n.js';

const $ = id => document.getElementById(id);
let open = false, hooks = {};
export const homeOpen = () => open;

const ago = ms => {
  if (!ms) return '';
  const m = Math.floor((Date.now() - ms) / 60000);
  return m < 1 ? t('agora há pouco') : m < 60 ? t('há {0} min', m) : m < 1440 ? t('há {0} h', Math.floor(m / 60)) : m < 2880 ? t('há 1 dia') : t('há {0} dias', Math.floor(m / 1440));
};
const resumo = r => t('Torre nº {0} · Ano {1} · recorde {2}', r.torre, r.ano, fmtM(r.bestAlt)) + (r.won ? ' · ' + t('Órbita ✓') : '');

function show(panel) {
  $('hmMain').hidden = !!panel;
  for (const id of ['hmSlotsP', 'hmCfgP', 'hmJornaisP', 'hmNomeP']) $(id).hidden = id !== panel;
  if (panel === 'hmJornaisP') hooks.onJornais?.();
  if (panel === 'hmSlotsP') drawSlots();
  if (panel === 'hmCfgP') drawCfg();
}

function drawMain() {
  const r = slotSummary(activeSlot());
  $('hmContinue').textContent = r ? t('Continuar') : t('Novo jogo');
  $('hmContinueSub').textContent = r ? `${resumo(r)} · ${ago(r.last)}` : t('Comece a obra da Construtora Vigaluz');
}

function drawSlots() {
  const box = $('hmSlotsList'); box.innerHTML = '';
  for (const n of [1, 2, 3]) {
    const r = slotSummary(n), d = document.createElement('div');
    d.className = 'hm-slot' + (n === activeSlot() ? ' on' : ''); d.dataset.n = n;
    d.innerHTML = `<b>${t('Espaço {0}', n)}</b><span>${r ? `${resumo(r)} · ${t('Reputação {0}', fmtPct(repPct(r.pontosTotal)))} · ${ago(r.last)}` : t('Vazio')}</span>
      <div class="hm-acts"><button class="hm-btn hm-small hm-play">${r ? t('Jogar') : t('Novo jogo')}</button>${r ? `<button class="hm-btn hm-small hm-danger hm-del">${t('Apagar')}</button>` : ''}</div>`;
    d.querySelector('.hm-play').onclick = () => play(n);
    const del = d.querySelector('.hm-del');
    if (del) del.onclick = () => {
      if (!del.classList.contains('armed')) { del.classList.add('armed'); del.textContent = t('Confirmar'); setTimeout(() => { del.classList.remove('armed'); del.textContent = t('Apagar'); }, 3000); return; }
      const j = deleteSlot(n); hooks.onForget?.(j); if (n === activeSlot()) hooks.onSwitch?.(); drawSlots(); drawMain();
    };
    box.appendChild(d);
  }
}

function drawCfg() {
  const c = cfg();
  $('cfSom').checked = c.som; $('cfAmb').checked = c.ambiente !== false; $('cfVol').value = String(Math.round(c.vol * 100)); $('cfLeve').checked = c.leve; $('cfDicas').checked = c.dicas;
  $('cfSlotN').textContent = activeSlot();
  const rk = S.rank || {};
  $('cfRankTxt').textContent = rk.ativo && rk.apelido ? t('No ranking como “{0}”.', rk.apelido) : t('Você ainda não está no ranking.');
  $('cfRankSair').hidden = !(rk.ativo && rk.apelido);
  $('cfNick').value = rk.apelido || '';
  $('cfMsg').textContent = '';
}

// joga no espaço n: troca (se for outro), fecha o Início; partida nova (ou save sem nick) pede o nome do ranking (com a
// obra parada, ainda no Início); partida nova abre a história
function play(n) {
  if (n !== activeSlot()) { setSlot(n); hooks.onSwitch?.(); }
  const novo = !slotSummary(n);
  if (hooks.precisaNome?.()) { pendenteNovo = novo; show('hmNomeP'); $('hmNome').value = hooks.ultimoNome?.() || ''; $('hmNomeMsg').textContent = ''; $('hmNome').focus({ preventScroll: true }); return; }
  entrar(novo);
}
let pendenteNovo = false;
function entrar(novo) {
  S.vazio = false; // começou a jogar neste espaço
  closeHome();
  if (novo || !S.introSeen) hooks.onNewGame?.();
}

export function openHome() {
  if (!FLAGS.viva) return;
  dropTip(); // uma dica aberta não fica por cima do Início
  open = true; document.body.classList.add('home-open');
  $('home').hidden = false; show(null); drawMain();
  $('hmContinue').focus({ preventScroll: true });
}
export function closeHome() {
  open = false; document.body.classList.remove('home-open');
  $('home').hidden = true; save();
}

// hooks: onSwitch (trocou de espaço: limpar a cena), onNewGame (abrir a história), onHowto, onRanking, onRankLeave, onReviewTips
export function initHome(h = {}) {
  if (!FLAGS.viva) return;
  hooks = h;
  // logo do PixelLab: a própria tela carrega a imagem e troca o texto quando ela chega (o Início abre antes do resto da arte)
  const logo = $('hmLogoImg');
  logo.onload = () => { logo.hidden = false; $('hmLogoTxt').hidden = true; };
  logo.src = 'assets/logo.png';
  $('hmContinue').onclick = () => play(activeSlot());
  const nomeOk = () => { const erro = hooks.onRankJoin?.($('hmNome').value); if (erro) { $('hmNomeMsg').textContent = erro; return; } entrar(pendenteNovo); };
  $('hmNomeOk').onclick = nomeOk;
  $('hmNome').onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') nomeOk(); };
  $('hmNomeNo').onclick = () => { S.rank = { ...(S.rank || {}), semNome: true }; entrar(pendenteNovo); }; // não pergunta de novo neste save; dá para entrar depois (cartão ou Configurações)
  $('hmSlots').onclick = () => show('hmSlotsP');
  $('hmCfg').onclick = () => show('hmCfgP');
  // idioma (Início e Configurações): grava o jogo e recarrega a página no idioma escolhido
  for (const b of document.querySelectorAll('[data-lang]')) {
    b.classList.toggle('on', b.dataset.lang === LANG);
    b.onclick = () => { if (b.dataset.lang === LANG) return; if (S.introSeen) try { save(); } catch (e) { } setLang(b.dataset.lang); }; // só grava jogo já começado (não cria save vazio)
  }
  $('hmJornais').onclick = () => show('hmJornaisP');
  $('hmHowto').onclick = () => hooks.onHowto?.();
  $('hmRank').onclick = () => hooks.onRanking?.();
  for (const b of document.querySelectorAll('#home [data-back]')) b.onclick = () => show(null);
  $('cfSom').onchange = e => { setSound(e.target.checked); hooks.onSound?.(); }; // o botão Som do rodapé acompanha
  $('cfVol').oninput = $('cfVol').onchange = e => setVolume(Number(e.target.value) / 100);
  $('cfLeve').onchange = e => setCfg({ leve: e.target.checked });
  $('cfAmb').onchange = e => setCfg({ ambiente: e.target.checked });
  $('cfDicas').onchange = e => setCfg({ dicas: e.target.checked });
  $('cfRever').onclick = () => { setCfg({ dicas: true }); S.dicas = {}; save(); closeHome(); hooks.onReviewTips?.(); };
  $('cfRankSair').onclick = async () => { const ok = await hooks.onRankLeave?.(); drawCfg(); if (ok === false) $('cfMsg').textContent = t('Não deu para falar com o ranking agora; seu apelido sai assim que a conexão voltar.'); };
  $('cfNickOk').onclick = () => { const erro = hooks.onRankJoin?.($('cfNick').value); drawCfg(); $('cfMsg').textContent = erro || t('Apelido salvo. A altura da torre vai para o ranking ao passar de cada era, no fim do ano e se a torre cair.'); };
  $('cfExport').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([exportSave()], { type: 'application/json' }));
    a.download = `torre-infinita-espaco${activeSlot()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    $('cfMsg').textContent = t('Save exportado.');
  };
  $('cfImport').onclick = () => $('cfFile').click();
  $('cfFile').onchange = async e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    if (f.size > 2e6) { e.target.value = ''; $('cfMsg').textContent = t('Arquivo grande demais para ser um save.'); return; }
    const r = importSave(await f.text(), activeSlot());
    e.target.value = '';
    if (r.ok) { hooks.onSwitch?.(); $('cfMsg').textContent = t('Save importado neste espaço.'); drawMain(); }
    else $('cfMsg').textContent = r.erro;
  };
  const del = $('cfDel');
  del.onclick = () => {
    if (!del.classList.contains('armed')) { del.classList.add('armed'); del.textContent = t('Confirmar: apagar tudo deste espaço'); setTimeout(() => { del.classList.remove('armed'); del.textContent = t('Apagar este espaço'); }, 3000); return; }
    const j = deleteSlot(activeSlot()); hooks.onForget?.(j); hooks.onSwitch?.(); show(null); drawMain();
  };
  addEventListener('keydown', e => {
    if (!open) return;
    if (e.key === 'Escape' && $('hmMain').hidden) show(null);
  });
}
