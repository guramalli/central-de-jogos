// Ranking online da torre única: fala com /api/torre/unica no servidor do site (backend/src/routes/torre.js).
// Cada espaço de save tem S.rank = { jogador (UUID), apelido, ativo, nao (saiu do ranking), naoTorre ("agora não" só nesta
// torre), fichaU, fichaUTorre, fichaUSeg, posicao, apagarPendente }. Duas listas: "Mais rápido até a Órbita" (a principal)
// e "Torre mais alta". Toda falha de rede vira "fora do ar" e o jogo segue (tempo limite de 6 s).
import { S, save } from '../sim/state.js';
import { FLAGS } from '../data/flags.js';
import { fmtM } from './format.js';
import { MARKS } from '../data/eras.js';
import { t } from '../i18n.js';

const $ = id => document.getElementById(id);
export const API = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) ? 'http://localhost:4000' : 'https://api.educacaogamer.com.br';
const ROTA = '/unica/ranking';
let lista = 'orbita';

async function api(path, { method = 'GET', body } = {}) {
  const ac = new AbortController(), tm = setTimeout(() => ac.abort(), 6000);
  try {
    const r = await fetch(API + '/api/torre' + path, { method, signal: ac.signal, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  } catch (e) { return { ok: false, offline: true, data: {} }; }
  finally { clearTimeout(tm); }
}
// mensagens do servidor (português) mostradas ao jogador: as conhecidas passam pelo dicionário; as outras ficam como vieram
const MOTIVOS = {
  'use só letras, números e espaço': () => t('use só letras, números e espaço'), 'use pelo menos 2 letras': () => t('use pelo menos 2 letras'),
  'não coloque contato nem site': () => t('não coloque contato nem site'), 'esse nome é reservado': () => t('esse nome é reservado'),
  'sem palavrão': () => t('sem palavrão'), 'escolha outro': () => t('escolha outro'),
};
const SERVIDOR = {
  'Escolha um apelido.': () => t('Escolha um apelido.'), 'O apelido precisa ter de 3 a 12 letras.': () => t('O apelido precisa ter de 3 a 12 letras.'),
  'Esse apelido não pode ser usado.': () => t('Esse apelido não pode ser usado.'),
  'Muitos pedidos. Espere uns minutos e tente de novo.': () => t('Muitos pedidos. Espere uns minutos e tente de novo.'),
  'O ranking ainda não foi configurado no servidor.': () => t('O ranking ainda não foi configurado no servidor.'),
  'O ranking está fora do ar agora.': () => t('O ranking está fora do ar agora.'),
  'Torre inválida para o ranking.': () => t('Torre inválida para o ranking.'), 'Dados da torre inválidos.': () => t('Dados da torre inválidos.'),
  'Torre fora do tempo.': () => t('Torre fora do tempo.'), 'Altura inválida.': () => t('Altura inválida.'),
  'Tempo até a Órbita inválido.': () => t('Tempo até a Órbita inválido.'),
  'Essa torre já foi substituída por uma mais nova.': () => t('Essa torre já foi substituída por uma mais nova.'),
  'Jogador inválido.': () => t('Jogador inválido.'),
};
export function msgServidor(m) {
  if (!m) return m;
  if (SERVIDOR[m]) return SERVIDOR[m]();
  const x = /^Esse apelido não pode ser usado: (.+)\.$/.exec(m);
  if (x && MOTIVOS[x[1]]) return t('Esse apelido não pode ser usado: {0}.', MOTIVOS[x[1]]());
  return m;
}
const rk = () => (S.rank ||= { jogador: '', apelido: '', ativo: false, nao: false, enviado: {} });
function jogador() {
  const r = rk();
  if (!r.jogador) r.jogador = (crypto.randomUUID ? crypto.randomUUID() : 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12));
  return r.jogador;
}

// ficha da torre atual (a não ser que a pessoa tenha saído do ranking)
export const pedirFicha = () => fichaUnica();
// chamada no laço de UI: corte, ficha, cartão de entrar e envios; a cada 60 s, os pedidos de saída que não chegaram
const PEND = 'torre-rank-apagar';
const pendentes = () => { try { return JSON.parse(localStorage.getItem(PEND) || '[]'); } catch (e) { return []; } };
let tickT = 0;
export function rankTick(bloqueado = false) {
  if (!FLAGS.viva) return;
  tickUnica(bloqueado);
  const now = performance.now();
  if (now - tickT < 60000) return;
  tickT = now;
  if (rk().apagarPendente) sairDoRanking();
  const p = pendentes();
  if (p.length) Promise.all(p.map(j => api(ROTA, { method: 'DELETE', body: { jogador: j } }).then(r => (r.ok ? null : j))))
    .then(rest => { try { localStorage.setItem(PEND, JSON.stringify(rest.filter(Boolean))); } catch (e) { } });
}
// apagar um espaço ou recomeçar: o apelido daquele jogador sai do ranking (se a rede falhar, tenta depois)
export function esquecerJogador(j = (rk().ativo || rk().apelido) ? rk().jogador : '') {
  if (!j) return;
  api(ROTA, { method: 'DELETE', body: { jogador: j } }).then(r => { if (!r.ok) try { localStorage.setItem(PEND, JSON.stringify([...pendentes(), j])); } catch (e) { } });
}

// devolve true se o servidor confirmou; se não, fica pendente e o rankTick tenta de novo
export async function sairDoRanking() {
  const r = rk();
  Object.assign(r, { ativo: false, nao: true, fichaU: '' });
  const res = r.jogador ? await api(ROTA, { method: 'DELETE', body: { jogador: r.jogador } }) : { ok: true };
  esconderCartao();
  r.apagarPendente = !res.ok; save();
  return res.ok;
}
// o último apelido usado neste aparelho (sugerido no nome do Novo jogo, em qualquer espaço)
const ULTIMO = 'torre-apelido';
export const ultimoApelido = () => { try { return localStorage.getItem(ULTIMO) || ''; } catch (e) { return ''; } };
// Novo jogo, Configurações ou o cartão: entrar no ranking ou trocar o apelido (vale a partir do próximo envio)
export function definirApelido(nome) {
  nome = String(nome || '').trim();
  if ([...nome].length < 3 || [...nome].length > 12) return t('O apelido precisa ter de 3 a 12 letras.');
  Object.assign(rk(), { apelido: nome, ativo: true, nao: false }); save();
  try { localStorage.setItem(ULTIMO, nome); } catch (e) { }
  if (S.maxAlt >= 40) enviarUnica(); // no começo da torre não manda 0 m: a altura vai nos pontos certos (tickUnica)
  return '';
}

// ---------- tela do ranking ----------
const valorTxt = (l, v) => l === 'orbita' ? t('{0} h {1} min', Math.floor(v / 3600), String(Math.floor(v % 3600 / 60)).padStart(2, '0')) : fmtM(v);
let pedido = 0;
async function drawRanking() {
  const meu = ++pedido;
  for (const b of document.querySelectorAll('.rk-tab')) b.classList.toggle('on', b.dataset.l === lista);
  const ul = $('rkList'); ul.innerHTML = `<li class="rk-wait">${t('Carregando…')}</li>`; $('rkMe').textContent = '';
  const res = await api(ROTA + `?lista=${lista}` + (rk().jogador ? `&jogador=${encodeURIComponent(rk().jogador)}` : ''));
  if (meu !== pedido) return; // trocou de aba antes da resposta chegar
  if (!res.ok) { ul.innerHTML = `<li class="rk-wait">${t('Ranking fora do ar agora. Tente mais tarde.')}</li>`; return; }
  const top = res.data.top || [];
  ul.innerHTML = top.length ? '' : `<li class="rk-wait">${t('Ninguém nesta lista ainda. Seja o primeiro!')}</li>`;
  top.forEach((x, k) => { const li = document.createElement('li'); li.innerHTML = `<b>${k + 1}.</b> <span></span> <i>${valorTxt(lista, x.valor)}</i>`; li.querySelector('span').textContent = x.apelido; ul.appendChild(li); });
  const eu = res.data.eu;
  $('rkMe').textContent = eu ? t('Você: Nº {0} de {1} · {2}', eu.posicao, res.data.total, valorTxt(lista, eu.valor)) : lista === 'orbita' ? t('Chegue à Órbita (400 km) para entrar nesta lista: vale o tempo de jogo somado de todas as torres.') : t('Para entrar: uma torre acima de {0} — o campo do apelido aparece na hora.', fmtM(res.data.corte || 0));
}
export function openRanking() {
  $('ranking').hidden = false; lista = 'orbita';
  drawRanking();
}

export function initRanking() {
  if (!FLAGS.viva) return;
  for (const b of document.querySelectorAll('.rk-tab')) b.onclick = () => { lista = b.dataset.l; drawRanking(); };
  $('rkClose').onclick = () => { $('ranking').hidden = true; };
  addEventListener('keydown', e => { if (e.key === 'Escape' && !$('ranking').hidden) { e.stopPropagation(); $('ranking').hidden = true; } }, true);
  initUnica();
}

// ---------- torre única: ranking de quem chegou mais alto (top 20) ----------
// A ficha é pedida no começo de cada torre (S.riscoTentativa); o corte (altura do 20º) vem do servidor a cada 5 min.
// Quando a torre passa do corte, aparece um cartão no pé da tela com o campo do apelido, sem pausar a obra. Depois de
// entrar, a altura vai sozinha ao passar de cada era, no fim do ano e no desabamento.
const U = { corte: null, total: 0, tCorte: -1e9, tFicha: -1e9, tEnvio: -1e9, enviada: 0, msgAte: 0 };
const torreAtual = () => S.riscoTentativa || 1;
async function fichaUnica() {
  const r = rk(); if (r.nao || (r.fichaU && r.fichaUTorre === torreAtual())) return;
  const alvo = r, torre = torreAtual(), seg0 = S.torreSeg || 0;
  U.tFicha = performance.now();
  const res = await api('/unica/partida', { method: 'POST', body: { jogador: jogador() } });
  if (res.ok && res.data.ficha && rk() === alvo && torreAtual() === torre) { Object.assign(alvo, { fichaU: res.data.ficha, fichaUTorre: torre, fichaUSeg: seg0 }); save(); }
}
async function buscarCorte() {
  U.tCorte = performance.now();
  const res = await api(ROTA);
  if (res.ok) { U.corte = res.data.corte || 0; U.total = res.data.total || 0; }
}
// envia a altura desta torre; devolve { ok, posicao } | { erro: 'nome', msg } | { offline } | { pulou }
export async function enviarUnica() {
  const r = rk();
  if (!r.ativo || !r.apelido) return { pulou: true };
  if (!r.fichaU || r.fichaUTorre !== torreAtual()) { await fichaUnica(); if (!r.fichaU || r.fichaUTorre !== torreAtual()) return { offline: true }; }
  U.tEnvio = performance.now();
  const alt = Math.round(S.maxAlt), res = await api(ROTA, { method: 'POST', body: {
    ficha: r.fichaU, jogador: jogador(), apelido: r.apelido, alt, seg: Math.max(0, Math.round((S.torreSeg || 0) - (r.fichaUSeg || 0))),
    orbita: S.orbitaSec && S.maxAlt >= 400000 ? Math.round(S.orbitaSec) : null } }); // tempo de jogo até a 1ª Órbita (só com esta torre lá em cima)
  if (res.ok && res.data.ok) { U.enviada = alt; r.posicao = res.data.posicao; save(); return { ok: true, posicao: res.data.posicao }; }
  if (res.data && res.data.erro === 'nome') return { erro: 'nome', msg: msgServidor(res.data.error) || t('Esse apelido não pode ser usado.') };
  return { offline: !!res.offline, msg: res.data && msgServidor(res.data.error) };
}
const card = () => $('rkEntrar');
function esconderCartao() { if (card()) card().hidden = true; }
function initUnica() {
  const c = document.createElement('div'); c.id = 'rkEntrar'; c.className = 'rk-entrar'; c.hidden = true;
  c.innerHTML = `<b id="rkEntrarT">${t('Sua torre chegou ao nível do ranking!')}</b><small id="rkEntrarS">${t('Escolha um apelido para entrar no top 20 das torres mais altas.')}</small>` +
    `<div class="rk-entrar-f"><input id="rkEntrarNick" maxlength="12" placeholder="${t('Seu apelido')}" autocomplete="off"><button type="button" id="rkEntrarOk">${t('Entrar')}</button><button type="button" class="ghost" id="rkEntrarNo">${t('Agora não')}</button></div><small id="rkEntrarMsg"></small>`;
  document.body.appendChild(c);
  const css = document.createElement('style');
  css.textContent = `.rk-entrar{position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:62;width:min(420px,92vw);background:rgba(20,18,30,.95);border:2px solid #f2b630;border-radius:12px;padding:12px 14px;color:#f4efe6;display:flex;flex-direction:column;gap:6px;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.5)}
  .rk-entrar b{font:700 16px "Chakra Petch";color:#f2b630}.rk-entrar small{font:13px Rubik;color:#d8d0c4}
  .rk-entrar-f{display:flex;gap:6px}.rk-entrar input{flex:1;min-width:0;font:15px Rubik;padding:8px;border-radius:8px;border:1px solid #4b4560;background:#221f2e;color:#fff}
  .rk-entrar button{font:700 14px "Chakra Petch";border:0;border-radius:8px;padding:8px 12px;background:#f2b630;color:#1b1622;cursor:pointer}.rk-entrar button.ghost{background:#3a3550;color:#f4efe6}`;
  document.head.appendChild(css);
  const ok = async () => {
    const nome = $('rkEntrarNick').value.trim();
    if ([...nome].length < 3 || [...nome].length > 12) { $('rkEntrarMsg').textContent = t('O apelido precisa ter de 3 a 12 letras.'); return; }
    Object.assign(rk(), { apelido: nome, ativo: true, nao: false }); $('rkEntrarMsg').textContent = t('Enviando…');
    const res = await enviarUnica();
    if (res.erro === 'nome') { rk().ativo = false; save(); $('rkEntrarMsg').textContent = res.msg; return; }
    save();
    $('rkEntrarMsg').textContent = res.ok ? t('Você está no ranking como {0}: Nº {1}!', nome, res.posicao) : t('Ranking fora do ar agora. Seu apelido ficou guardado; tentamos de novo daqui a pouco.');
    U.msgAte = performance.now() + 5000;
  };
  $('rkEntrarOk').onclick = ok;
  $('rkEntrarNick').onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') ok(); };
  $('rkEntrarNo').onclick = () => { Object.assign(rk(), { naoTorre: torreAtual(), naoAlt: S.maxAlt }); save(); esconderCartao(); }; // volta quando esta torre dobrar de altura
  buscarCorte(); fichaUnica();
}
function tickUnica(bloqueado) {
  const now = performance.now(), r = rk();
  if (now - U.tCorte > 300000) buscarCorte(); // o corte (20º lugar) muda devagar: a cada 5 min
  if (!r.nao && !(r.fichaU && r.fichaUTorre === torreAtual()) && now - U.tFicha > 55000) fichaUnica();
  // cartão para entrar: torre acima do corte (e de pelo menos 40 m), quem ainda não entrou; "agora não" vale até a torre dobrar de altura
  const c = card(); if (!c) return;
  const pode = !bloqueado && U.corte != null && !r.ativo && !r.nao && !(r.naoTorre === torreAtual() && S.maxAlt < 2 * (r.naoAlt || 0)) && !S.colapso && S.maxAlt >= 40 && S.maxAlt > U.corte;
  if (pode && c.hidden) { c.hidden = false; $('rkEntrarMsg').textContent = U.nomeMsg || ''; U.nomeMsg = ''; $('rkEntrarNick').value = r.apelido || ''; }
  else if (!pode && !c.hidden && !(r.ativo && now < U.msgAte)) c.hidden = true;
  // quem já está no ranking: a altura vai sozinha só em pontos certos (pedido do usuário: nada de envio a cada minuto) —
  // ao passar de cada era (100 m, 1 km, 12 km, 50 km, 100 km, Órbita), no fim do ano e no desabamento; falhou, tenta de novo em 30 s
  const marco = MARKS.some(m => S.maxAlt >= m && U.enviada < m);
  if (r.ativo && r.apelido && S.maxAlt > U.enviada && now - U.tEnvio > 30000 && (marco || (S.risco && S.risco.fimAno) || S.colapso))
    enviarUnica().then(res => { if (res && res.erro === 'nome') { r.ativo = false; U.nomeMsg = res.msg; save(); } }); // apelido recusado pelo filtro: o cartão volta com o motivo
}
