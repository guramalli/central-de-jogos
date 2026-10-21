// Capa de jornal nos marcos de andares (Obra Viva): 100, 500, 1.000 e depois a cada 1.000, uma vez só na campanha.
// A capa gira e para no meio da tela por ~6 s sem pausar a obra; toque fecha. A foto é a própria cena naquele momento.
// Textos em S.jornais (passa de obra); fotos pequenas num cache à parte por espaço (torre-jornais-espacoN).
import { S, save, activeSlot } from '../sim/state.js';
import { proximoJornal, manchete } from '../data/story.js';
import { city, roundDay } from '../sim/prestige.js';
import { FLAGS } from '../data/flags.js';
import { V } from '../render/view.js';
import { fmtM, fmt } from './format.js';
import { altOf } from '../data/height.js';
import { VIVA } from '../data/viva.js';
import { sfx } from './audio.js';
import { t, LANG } from '../i18n.js';

const $ = id => document.getElementById(id);
const fotosKey = () => 'torre-jornais-espaco' + activeSlot();
const ler = k => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) { return {}; } };
const fotos = () => ler(fotosKey());
let pend = null, fechaT = 0;

function foto() {
  const cv = $('cv'), w = 320, h = Math.round(w * cv.height / cv.width), c = document.createElement('canvas');
  c.width = w; c.height = h; c.getContext('2d').drawImage(cv, 0, 0, w, h);
  try { return c.toDataURL('image/jpeg', 0.72); } catch (e) { return ''; }
}
// título e subtítulo da capa: refeitos pelo marco no idioma atual (o save guarda o texto do idioma em que a capa saiu)
function tituloAlt(alt, cidade) {
  const mk = VIVA.marcosOrbita.find(x => x.m === alt), c = t(cidade);
  if (!mk || mk.n === 'Mil quilômetros') return t('A torre da Vigaluz passa o marco dos mil quilômetros: {0} acima de {1}', fmtM(alt), c);
  return t('A torre da Vigaluz passa o marco "{0}": {1} acima de {2}', t(mk.n), fmtM(alt), c);
}
const subAlt = () => t('Bônus permanente para a construtora: +{0}% em tudo.', Math.round(VIVA.marcosBonus * 100));
const subAndar = n => t('A torre da Construtora Vigaluz já tem {0} de altura.', fmtM(altOf(n)));
function textos(j) {
  const cid = j.cidade || city().n;
  if (j.alt) return { titulo: tituloAlt(j.alt, cid), sub: subAlt() };
  if (Number.isFinite(j.n)) return { titulo: manchete(j.n, cid), sub: subAndar(j.n) };
  return { titulo: j.titulo || '', sub: j.sub || '' };
}
function dataDe(j) { // capas antigas (sem torre) só com a cidade
  const c = t(j.cidade || '');
  if (j.torre) return j.dia ? t('Torre nº {0} · {1} · ano {2}, dia {3}', j.torre, c, j.ano, j.dia) : t('Torre nº {0} · {1} · ano {2}', j.torre, c, j.ano);
  return j.dia ? t('{0}, dia {1}', c, j.dia) : c;
}
function mostrar(j, img) {
  sfx('jornal');
  const tx = textos(j);
  $('jnTitle').textContent = tx.titulo; $('jnSub').textContent = tx.sub;
  $('jnDate').textContent = dataDe(j);
  $('jnImg').src = img || ''; $('jnImg').hidden = !img;
  const el = $('jornal'); el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
}
const fechar = () => { $('jornal').hidden = true; };

// chamada no laço de UI
export function checkJornal(bloqueado) {
  if (!FLAGS.viva) return;
  if (!$('jornal').hidden && V.t > fechaT) fechar();
  if (bloqueado || S.roundOver) return;
  // marcos depois da Órbita (VIVA.marcosOrbita): uma capa na 1ª vez, com o bônus permanente
  const vistosAlt = new Set((S.jornais || []).filter(x => x.alt).map(x => x.alt));
  const novoAlt = (S.marcosAlt || []).find(m => !vistosAlt.has(m));
  if (novoAlt && !pend) {
    const cidade = city().n;
    const jj = { n: Math.floor(S.floors), alt: novoAlt, torre: S.riscoTentativa || 1, ano: (S.risco && S.risco.ano) || 1, cidade, dia: roundDay(),
      titulo: tituloAlt(novoAlt, cidade), sub: subAlt() };
    S.jornais = [...(S.jornais || []), jj].sort((a, b) => a.n - b.n); save();
    const img = foto(), f = fotos(); f['alt' + novoAlt] = img;
    try { localStorage.setItem(fotosKey(), JSON.stringify(f)); } catch (e) { }
    mostrar(jj, img); fechaT = Infinity; // só fecha com um toque
    return;
  }
  const andares = Math.floor(S.floors);
  if (!pend) {
    const n = proximoJornal(andares, (S.jornais || []).filter(j => !j.alt).map(j => j.n));
    if (n) pend = { n, at: V.t + 1.6 }; // espera a câmera afastar no marco
    return;
  }
  if (V.t < pend.at) return;
  const n = pend.n; pend = null;
  const cidade = city().n;
  const j = { n, torre: S.riscoTentativa || 1, ano: (S.risco && S.risco.ano) || 1, cidade, dia: roundDay(), titulo: manchete(n, cidade), sub: subAndar(n) };
  // marcos menores que ficaram para trás nesta passada também contam como noticiados
  const vistos = new Set((S.jornais || []).filter(x => !x.alt).map(x => x.n)), novos = [j];
  for (const m of [100, 500]) if (m < n && !vistos.has(m)) novos.push({ ...j, n: m, titulo: manchete(m, cidade) });
  for (let m = 1000; m < n; m += 1000) if (!vistos.has(m)) novos.push({ ...j, n: m, titulo: manchete(m, cidade) });
  S.jornais = [...(S.jornais || []), ...novos].sort((a, b) => a.n - b.n); save();
  const img = foto(), f = fotos(); f[n] = img;
  try { localStorage.setItem(fotosKey(), JSON.stringify(f)); } catch (e) { }
  mostrar(j, img); fechaT = Infinity; // só fecha com um toque
}

// arquivo de jornais (página de Início)
export function drawArquivo() {
  const ul = $('jnList'), lista = [...(S.jornais || [])].reverse(), f = fotos();
  ul.innerHTML = lista.length ? '' : `<li class="rk-wait">${t('Nenhuma capa ainda. A primeira sai no andar 100!')}</li>`;
  for (const j of lista) {
    const li = document.createElement('li');
    li.innerHTML = `<b>${j.alt ? fmtM(j.alt) : j.n.toLocaleString(LANG === 'en' ? 'en-US' : 'pt-BR')}</b><span></span>`;
    li.querySelector('span').textContent = textos(j).titulo;
    li.onclick = () => { mostrar(j, f[j.alt ? 'alt' + j.alt : j.n]); fechaT = Infinity; };
    ul.appendChild(li);
  }
}
export function initJornal() {
  if (!FLAGS.viva) return;
  $('jornal').onclick = fechar;
  addEventListener('keydown', e => { if (e.key === 'Escape' && !$('jornal').hidden) { e.stopPropagation(); fechar(); } }, true);
}
