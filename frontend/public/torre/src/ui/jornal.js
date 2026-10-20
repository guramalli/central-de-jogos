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

const $ = id => document.getElementById(id);
const fotosKey = () => 'torre-jornais-espaco' + activeSlot();
const ler = k => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) { return {}; } };
const fotos = () => ler(fotosKey());
// portfólio: foto de cada torre entregue (por obra), tirada com a câmera mostrando a torre inteira
const pfKey = () => 'torre-portfolio-espaco' + activeSlot();
export function guardarFotoTorre(obra) {
  const f = ler(pfKey()); f[obra] = foto();
  const ks = Object.keys(f).map(Number).sort((a, b) => a - b); while (ks.length > 40) delete f[ks.shift()]; // guarda as 40 últimas
  try { localStorage.setItem(pfKey(), JSON.stringify(f)); } catch (e) { }
}
let pend = null, fechaT = 0;

function foto() {
  const cv = $('cv'), w = 320, h = Math.round(w * cv.height / cv.width), c = document.createElement('canvas');
  c.width = w; c.height = h; c.getContext('2d').drawImage(cv, 0, 0, w, h);
  try { return c.toDataURL('image/jpeg', 0.72); } catch (e) { return ''; }
}
function mostrar(j, img) {
  $('jnTitle').textContent = j.titulo; $('jnSub').textContent = j.sub;
  $('jnDate').textContent = `Obra nº ${j.obra} · ${j.cidade}` + (j.dia ? ` · dia ${j.dia}` : '');
  $('jnImg').src = img || ''; $('jnImg').hidden = !img;
  const el = $('jornal'); el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
}
const fechar = () => { $('jornal').hidden = true; };

// chamada no laço de UI
export function checkJornal(bloqueado) {
  if (!FLAGS.viva) return;
  if (!$('jornal').hidden && V.t > fechaT) fechar();
  if (bloqueado || S.roundOver) return;
  const andares = Math.floor(S.floors);
  if (!pend) {
    const n = proximoJornal(andares, (S.jornais || []).map(j => j.n));
    if (n) pend = { n, at: V.t + 1.6 }; // espera a câmera afastar no marco
    return;
  }
  if (V.t < pend.at) return;
  const n = pend.n; pend = null;
  const cidade = city().n;
  const j = { n, obra: S.obra || 1, cidade, dia: roundDay(), titulo: manchete(n, cidade), sub: `A torre da Construtora J. Santos já tem ${fmtM(altOf(n))} de altura.` };
  // marcos menores que ficaram para trás nesta passada também contam como noticiados
  const vistos = new Set((S.jornais || []).map(x => x.n)), novos = [j];
  for (const m of [100, 500]) if (m < n && !vistos.has(m)) novos.push({ ...j, n: m, titulo: manchete(m, cidade) });
  for (let m = 1000; m < n; m += 1000) if (!vistos.has(m)) novos.push({ ...j, n: m, titulo: manchete(m, cidade) });
  S.jornais = [...(S.jornais || []), ...novos].sort((a, b) => a.n - b.n); save();
  const img = foto(), f = fotos(); f[n] = img;
  try { localStorage.setItem(fotosKey(), JSON.stringify(f)); } catch (e) { }
  mostrar(j, img); fechaT = V.t + 6;
}

// portfólio (página de Início): torres entregues e arquivo de jornais
export function drawArquivo() {
  const pl = $('pfList'), torres = [...(S.torres || [])].reverse(), pf = ler(pfKey());
  pl.innerHTML = torres.length ? '' : '<li class="rk-wait">Nenhuma torre entregue ainda.</li>';
  for (const t of torres) {
    const li = document.createElement('li'), img = document.createElement('img'), d = document.createElement('div');
    img.alt = ''; if (pf[t.obra]) img.src = pf[t.obra];
    const taxa = t.taxa < 10 ? t.taxa.toFixed(1).replace('.', ',') : fmt(t.taxa);
    d.innerHTML = '<b></b><span></span>';
    d.querySelector('b').textContent = `Obra nº ${t.obra} · ${t.cidade} · ${fmtM(t.alt)}`;
    d.querySelector('span').textContent = `Entregue no dia ${t.dia} · paga R$ ${taxa}/s`;
    li.append(img, d); pl.appendChild(li);
  }
  const ul = $('jnList'), lista = [...(S.jornais || [])].reverse(), f = fotos();
  ul.innerHTML = lista.length ? '' : '<li class="rk-wait">Nenhuma capa ainda. A primeira sai no andar 100!</li>';
  for (const j of lista) {
    const li = document.createElement('li');
    li.innerHTML = `<b>${j.n.toLocaleString('pt-BR')}</b><span></span>`;
    li.querySelector('span').textContent = j.titulo;
    li.onclick = () => { mostrar(j, f[j.n]); fechaT = Infinity; };
    ul.appendChild(li);
  }
}
export function initJornal() {
  if (!FLAGS.viva) return;
  $('jornal').onclick = fechar;
  addEventListener('keydown', e => { if (e.key === 'Escape' && !$('jornal').hidden) { e.stopPropagation(); fechar(); } }, true);
}
