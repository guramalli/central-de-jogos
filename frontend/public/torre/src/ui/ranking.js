// Ranking online (Obra Viva): fala com /api/torre no servidor do site (backend/src/routes/torre.js).
// Cada espaço de save tem S.rank = { jogador (UUID), apelido, ativo, nao (saiu do ranking), naoObra ("agora não" só nesta
// obra), ficha, fichaObra, fichaSeg, enviado, apagarPendente }.
// A ficha é pedida no começo de cada obra; no fim da obra o placar pede o apelido (1ª vez) ou envia sozinho.
// Toda falha de rede vira "fora do ar" e o jogo segue (tempo limite de 6 s).
import { S, save } from '../sim/state.js';
import { VIVA } from '../data/viva.js';
import { FLAGS } from '../data/flags.js';
import { fmtM } from './format.js';
import { roundSecs } from '../sim/prestige.js';

const $ = id => document.getElementById(id);
export const API = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) ? 'http://localhost:4000' : 'https://api.educacaogamer.com.br';
const LISTAS = { obra: 'Melhor obra', total: 'Recorde total', orbita: 'Tempo até a Órbita' };
let lista = 'obra';

async function api(path, { method = 'GET', body } = {}) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 6000);
  try {
    const r = await fetch(API + '/api/torre' + path, { method, signal: ac.signal, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  } catch (e) { return { ok: false, offline: true, data: {} }; }
  finally { clearTimeout(t); }
}
const rk = () => (S.rank ||= { jogador: '', apelido: '', ativo: false, nao: false, ficha: '', fichaObra: 0, fichaSeg: 0, enviado: {} });
function jogador() {
  const r = rk();
  if (!r.jogador) r.jogador = (crypto.randomUUID ? crypto.randomUUID() : 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12));
  return r.jogador;
}
const segJogo = () => roundSecs(); // tempo de jogo da obra inteira (com os aditivos)

// ficha da obra atual (a não ser que a pessoa tenha dito "agora não" ou saído do ranking)
let fichaT = 0;
export async function pedirFicha() {
  if (!FLAGS.viva || rk().nao || S.roundOver) return;
  if (rk().fichaObra === S.obra && rk().ficha) return;
  const alvo = rk(), obra = S.obra, seg0 = segJogo();
  fichaT = performance.now();
  const r = await api('/partida', { method: 'POST', body: { jogador: jogador() } });
  // só vale se ainda é o mesmo espaço e a mesma obra (a pessoa pode ter trocado de espaço durante o pedido)
  if (r.ok && r.data.ficha && rk() === alvo && S.obra === obra) { Object.assign(alvo, { ficha: r.data.ficha, fichaObra: obra, fichaSeg: seg0 }); save(); }
}
// chamada no laço de UI: tenta de novo a ficha que faltou (a cada 60 s) e os pedidos de saída que não chegaram
const PEND = 'torre-rank-apagar';
const pendentes = () => { try { return JSON.parse(localStorage.getItem(PEND) || '[]'); } catch (e) { return []; } };
let tickT = 0;
export function rankTick() {
  if (!FLAGS.viva) return;
  const now = performance.now();
  if (now - tickT < 60000) return;
  tickT = now;
  if (!rk().nao && !S.roundOver && !(rk().fichaObra === S.obra && rk().ficha) && now - fichaT > 55000) pedirFicha();
  if (rk().apagarPendente) sairDoRanking();
  const p = pendentes();
  if (p.length) Promise.all(p.map(j => api('/ranking', { method: 'DELETE', body: { jogador: j } }).then(r => (r.ok ? null : j))))
    .then(rest => { try { localStorage.setItem(PEND, JSON.stringify(rest.filter(Boolean))); } catch (e) { } });
}
// apagar um espaço ou recomeçar: o apelido daquele jogador sai do ranking (se a rede falhar, tenta depois)
export function esquecerJogador(j = (rk().ativo || rk().apelido) ? rk().jogador : '') {
  if (!j) return;
  api('/ranking', { method: 'DELETE', body: { jogador: j } }).then(r => { if (!r.ok) try { localStorage.setItem(PEND, JSON.stringify([...pendentes(), j])); } catch (e) { } });
}

// envia os recordes desta obra; devolve { ok, posicoes } | { erro: 'nome', msg } | { offline }
export async function enviarRecordes() {
  const r = rk();
  if (r.enviado && r.enviado.obra === S.obra && r.enviado.posicoes) return { ok: true, posicoes: r.enviado.posicoes }; // já foi (a ficha é de uso único)
  if (!r.ativo || !r.apelido || !r.ficha || r.fichaObra !== S.obra) return { pulou: true };
  const res = await api('/ranking', { method: 'POST', body: {
    ficha: r.ficha, jogador: jogador(), apelido: r.apelido,
    obra: { alt: Math.round(S.maxAlt), seg: Math.max(0, Math.round(segJogo() - (r.fichaSeg || 0))) },
    total: Math.round(S.altTotal || 0), tempoJogo: Math.round(S.playTime || 0), orbita: S.orbitaSec ? Math.round(S.orbitaSec) : null,
  } });
  if (res.ok && res.data.ok) { r.enviado = { obra: S.obra, posicoes: res.data.posicoes }; save(); return { ok: true, posicoes: res.data.posicoes }; }
  if (res.data && res.data.erro === 'nome') return { erro: 'nome', msg: res.data.error || 'Esse apelido não pode ser usado.' };
  return { offline: !!res.offline, msg: res.data && res.data.error };
}

// devolve true se o servidor confirmou; se não, fica pendente e o rankTick tenta de novo
export async function sairDoRanking() {
  const r = rk();
  Object.assign(r, { ativo: false, nao: true, ficha: '' });
  const res = r.jogador ? await api('/ranking', { method: 'DELETE', body: { jogador: r.jogador } }) : { ok: true };
  r.apagarPendente = !res.ok; save();
  return res.ok;
}
// Configurações: entrar no ranking ou trocar o apelido (vale a partir do próximo envio)
export function definirApelido(nome) {
  nome = String(nome || '').trim();
  if ([...nome].length < 3 || [...nome].length > 12) return 'O apelido precisa ter de 3 a 12 letras.';
  Object.assign(rk(), { apelido: nome, ativo: true, nao: false, naoObra: 0 }); save();
  pedirFicha();
  return '';
}

// ---------- placar: área do ranking ----------
const posTxt = p => [p.obra && `Melhor obra: Nº ${p.obra}`, p.total && `Recorde total: Nº ${p.total}`, p.orbita && `Órbita: Nº ${p.orbita}`].filter(Boolean).join(' · ');
export async function rankNoPlacar() {
  if (!FLAGS.viva) return;
  const box = $('reRank'), r = rk();
  box.hidden = false; $('reRankMsg').textContent = '';
  if (r.ativo && r.apelido) {
    $('reRankForm').hidden = true; $('reRankMsg').textContent = 'Ranking: enviando…';
    const res = await enviarRecordes();
    if (res.erro === 'nome') { r.ativo = false; save(); $('reRankForm').hidden = false; $('reNick').value = r.apelido; $('reRankMsg').textContent = res.msg; return; }
    $('reRankMsg').textContent = res.ok ? `Ranking (${r.apelido}): ${posTxt(res.posicoes)}`
      : res.pulou ? 'Ranking fora do ar quando esta obra começou: ela não entrou. A próxima vai.' : 'Ranking fora do ar agora. Tentamos de novo na próxima obra.';
    return;
  }
  if (r.nao || r.naoObra === S.obra) { box.hidden = true; return; }
  $('reRankForm').hidden = false; $('reNick').value = r.apelido || '';
}
let entrando = false;
async function entrar() {
  if (entrando) return; entrando = true;
  try { await entrar1(); } finally { entrando = false; }
}
async function entrar1() {
  const nome = $('reNick').value.trim(), r = rk();
  if ([...nome].length < 3 || [...nome].length > 12) { $('reRankMsg').textContent = 'O apelido precisa ter de 3 a 12 letras.'; return; }
  if (!r.ficha || r.fichaObra !== S.obra) await pedirFicha();
  Object.assign(r, { apelido: nome, ativo: true, nao: false });
  $('reRankMsg').textContent = 'Enviando…';
  const res = await enviarRecordes();
  if (res.erro === 'nome') { Object.assign(r, { ativo: false }); $('reRankMsg').textContent = res.msg; save(); return; }
  save();
  $('reRankForm').hidden = true;
  $('reRankMsg').textContent = res.ok ? `No ranking como ${nome}! ${posTxt(res.posicoes)}`
    : res.pulou ? `Você entrou como ${nome}. Esta obra começou sem conexão com o ranking e não entrou; a próxima vai.` : 'Ranking fora do ar agora. Seu apelido ficou guardado; tentamos de novo na próxima obra.';
}

// ---------- tela do ranking ----------
const valorTxt = (l, v) => l === 'orbita' ? `${Math.floor(v / 3600)} h ${String(Math.floor(v % 3600 / 60)).padStart(2, '0')} min` : fmtM(v);
let pedido = 0;
async function drawRanking() {
  const meu = ++pedido;
  for (const b of document.querySelectorAll('.rk-tab')) b.classList.toggle('on', b.dataset.l === lista);
  const ul = $('rkList'); ul.innerHTML = '<li class="rk-wait">Carregando…</li>'; $('rkMe').textContent = '';
  const q = `?lista=${lista}` + (rk().jogador ? `&jogador=${encodeURIComponent(rk().jogador)}` : '');
  const res = await api('/ranking' + q);
  if (meu !== pedido) return; // trocou de aba antes da resposta chegar
  if (!res.ok) { ul.innerHTML = '<li class="rk-wait">Ranking fora do ar agora. Tente mais tarde.</li>'; return; }
  const top = res.data.top || [];
  ul.innerHTML = top.length ? '' : '<li class="rk-wait">Ninguém nesta lista ainda. Seja o primeiro!</li>';
  top.forEach((x, k) => { const li = document.createElement('li'); li.innerHTML = `<b>${k + 1}.</b> <span></span> <i>${valorTxt(lista, x.valor)}</i>`; li.querySelector('span').textContent = x.apelido; ul.appendChild(li); });
  const eu = res.data.eu;
  $('rkMe').textContent = eu ? `Você: Nº ${eu.posicao} de ${res.data.total} · ${valorTxt(lista, eu.valor)}` : rk().ativo ? 'Você ainda não tem marca nesta lista.' : 'Entre no ranking no fim de uma obra ou nas Configurações.';
}
export function openRanking() { $('ranking').hidden = false; lista = 'obra'; drawRanking(); }

export function initRanking() {
  if (!FLAGS.viva) return;
  $('reNickOk').onclick = entrar;
  $('reNick').onkeydown = e => { if (e.key === 'Enter') entrar(); };
  $('reNickNo').onclick = () => { Object.assign(rk(), { naoObra: S.obra }); save(); $('reRank').hidden = true; }; // só nesta obra
  for (const b of document.querySelectorAll('.rk-tab')) b.onclick = () => { lista = b.dataset.l; drawRanking(); };
  $('rkClose').onclick = () => { $('ranking').hidden = true; };
  addEventListener('keydown', e => { if (e.key === 'Escape' && !$('ranking').hidden) { e.stopPropagation(); $('ranking').hidden = true; } }, true);
  pedirFicha();
}
