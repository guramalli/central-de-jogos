// Obra Viva — sons. Gravações e efeitos CC0 em assets/sons/ (ver CREDITOS.txt; preparados por tools/sons-processa.py):
// impactos de obra (Kenney), máquinas e ambiente reais (Freesound) e momentos de jogo em chiptune (FrogPog).
// Enquanto um arquivo não carrega (ou se falhar), os sons antigos sintetizados na hora tocam no lugar.
// Só começam depois do primeiro toque/clique do jogador (regra dos navegadores), respeitam o botão de som e o
// volume, ficam mudos com a aba escondida e têm taxa máxima por tipo para não virar barulho quando a obra acelera.
// Ambiente (canteiro no térreo, mar nas cidades de praia, vento nas eras altas) segue a câmera: tickAmbience().
import { cfg, setCfg } from './config.js';
let ctx = null, master = null, ambBus = null, on = true, noiseBuf = null;
on = cfg().som; // preferência de som e volume nas configurações do aparelho (ui/config.js)
const gainOf = () => 0.28 * cfg().vol;
// modo de teste (?test=1): sem som, sem mexer na preferência salva do jogador
const TEST = typeof location !== 'undefined' && new URLSearchParams(location.search).get('test') === '1';
if (TEST) on = false;

// nome → [arquivo(s) em assets/sons, volume]; vários arquivos = variações sorteadas
const SAMPLES = {
  brick: [['tijolo-0', 'tijolo-1', 'tijolo-2', 'tijolo-3', 'tijolo-4'], 0.55],
  beam: [['viga-0', 'viga-1', 'viga-2', 'viga-3', 'viga-4'], 0.45],
  glass: [['vidro-0', 'vidro-1', 'vidro-2', 'vidro-3', 'vidro-4'], 0.4],
  drill: [['furadeira'], 0.55], phase: [['etapa'], 0.35], floor: [['andar'], 0.35], floorSoft: [['etapa'], 0.12], buy: [['compra'], 0.5],
  machine: [['motor'], 0.55], elevador: [['elevador'], 0.6], mixer: [['betoneira'], 0.45],
  entrega: [['entrega'], 0.6], multa: [['multa'], 0.6], offer: [['proposta'], 0.5], news: [['aviso'], 0.4],
  jornal: [['jornal'], 0.75], click: [['clique'], 0.3], hammer: [['martelo'], 0.4], truck: [['re-caminhao'], 0.35],
  // intempéries (Freesound, CC0; ver CREDITOS.txt): sons soltos — sem o arquivo, a síntese toca no lugar
  trovao: [['clima-trovao'], 0.8], racha: [['clima-racha'], 0.8], onda: [['clima-onda'], 0.9], gelo: [['clima-gelo'], 0.7],
  apito: [['clima-apito'], 0.6], desabamento: [['clima-desaba-2'], 1], desabamento2: [['clima-desaba-1'], 1],
};
// loops das intempéries (o volume segue a ameaça em tickClima)
const CLIMA = { chuva: 'clima-chuva', terremoto: 'clima-terremoto', granizo: 'clima-granizo', vento: 'clima-furacao', nevasca: 'clima-nevasca', solar: 'clima-solar' };
const AMB = { canteiro: 'amb-canteiro', mar: 'amb-mar', vento: 'amb-vento' };
// intervalo mínimo entre dois sons do mesmo tipo (s)
const GAP = { racha: 3, onda: 3, gelo: 3, desabamento2: 5, trovao: 1.2, meteoro: 0.6, apito: 3, desabamento: 5, granizo: 0.03, floorSoft: 1.5, brick: .11, beam: .2, glass: .2, phase: .35, floor: .5, buy: .08, machine: .7, drill: .25, click: .05, news: .3, hammer: 1.5, truck: 8, mixer: 6 };
const last = {}, buf = {};
let loading = false, prontos = false; // prontos: os arquivos já foram baixados (os loops das intempéries esperam por isso)

export const soundOn = () => on;
// sons já decodificados e loops de ambiente tocando (para conferir no console: torre.sons())
export const soundsLoaded = () => ({ arquivos: Object.keys(buf).length, ambiente: Object.keys(amb) });
// volume (0..1), nas configurações
export function setVolume(v) { setCfg({ vol: Math.max(0, Math.min(1, v)) }); if (master) master.gain.value = gainOf(); }
export function setSound(v) {
  if (TEST) return;
  on = !!v;
  setCfg({ som: on });
  if (on) unlock(); else if (ctx && ctx.state === 'running') ctx.suspend();
}

export function unlock() {
  if (!on) return;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = gainOf(); master.connect(ctx.destination);
      ambBus = ctx.createGain(); ambBus.gain.value = 0; ambBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      loadAll();
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) { ctx = null; }
}
if (typeof addEventListener !== 'undefined') {
  addEventListener('pointerdown', unlock, { passive: true });
  addEventListener('keydown', unlock);
  // clique suave em todo botão da interface (não no canvas)
  addEventListener('click', e => { if (e.target && e.target.closest && e.target.closest('button')) sfx('click'); }, true);
}

// carrega e decodifica todos os arquivos (uma vez, depois do primeiro toque)
async function loadAll() {
  if (loading) return; loading = true;
  const names = [...new Set([...Object.values(SAMPLES).flatMap(s => s[0]), ...Object.values(AMB), ...Object.values(CLIMA)])];
  await Promise.all(names.map(async n => {
    try {
      const r = await fetch(`assets/sons/${n}.mp3`); if (!r.ok) return;
      const ab = await r.arrayBuffer();
      buf[n] = await new Promise((ok, err) => ctx.decodeAudioData(ab, ok, err));
    } catch (e) { /* fica a síntese */ }
  }));
  startAmbience(); prontos = true;
}

function play(b, vol, at = 0, rate = 1, dest = master) {
  const t = ctx.currentTime + at, s = ctx.createBufferSource(), g = ctx.createGain();
  s.buffer = b; s.playbackRate.value = rate; g.gain.value = vol;
  s.connect(g); g.connect(dest); s.start(t);
  return s;
}
function tone(freq, dur, type = 'square', vol = .4, at = 0, slide = 0) {
  const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .03);
}
function noise(dur, vol = .3, at = 0, hp = 900) {
  const t = ctx.currentTime + at, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + .03);
}
// ruído grave com queda lenta (trovão, desabamento) e varredura de ruído (meteoro caindo)
function rumble(dur, vol, lp, at) {
  const t = ctx.currentTime + at, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseLong(); f.type = 'lowpass'; f.frequency.value = lp;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .08); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur + .05);
}
function sweep(dur, f0, f1, vol) {
  const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseLong(); f.type = 'bandpass'; f.Q.value = 4; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * .7); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + .05);
}
let longBuf = null;
const noiseLong = () => {
  if (longBuf) return longBuf;
  longBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const d = longBuf.getChannelData(0); let b = 0;
  for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = 0.97 * b + 0.03 * w; d[i] = w * 0.6 + b * 3; } // ruído com mais grave (rosado)
  return longBuf;
};

// ---------- intempéries em loop (modo torre única) ----------
// chuva (ruído filtrado), vento e furacão (a gravação do vento), tsunami (a do mar, mais grave), terremoto (ruído grave +
// senoide de 38 Hz) e tempestade solar (zumbido elétrico). tickClima recebe o tipo ativo e ajusta os volumes.
const clima = {};
function loopNode(make) { const g = ctx.createGain(); g.gain.value = 0; g.connect(master); const src = make(g); return { g, src }; }
function startClima() {
  if (clima.ok || !ctx) return; clima.ok = true;
  const ruido = (g, tipo, freq, q = 0.7) => { const s = ctx.createBufferSource(); s.buffer = noiseLong(); s.loop = true; const f = ctx.createBiquadFilter(); f.type = tipo; f.frequency.value = freq; f.Q.value = q; s.connect(f); f.connect(g); s.start(); return { s, f }; };
  const gravado = (nome, rate = 1) => g => { const b = buf[nome]; if (!b) return null; const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; s.playbackRate.value = rate; s.connect(g); s.start(ctx.currentTime, Math.random() * b.duration); return s; };
  const ou = (nome, reserva) => loopNode(g => gravado(nome)(g) || reserva(g)); // gravação; sem ela, a síntese de antes
  clima.chuva = ou(CLIMA.chuva, g => { const a = ruido(g, 'highpass', 900); const b = ctx.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = 7000; a.f.disconnect(); a.f.connect(b); b.connect(g); return a; });
  clima.terremoto = ou(CLIMA.terremoto, g => { const a = ruido(g, 'lowpass', 140); const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 38; const og = ctx.createGain(); og.gain.value = .6; o.connect(og); og.connect(g); o.start(); return a; });
  clima.solar = ou(CLIMA.solar, g => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 55; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 240; f.Q.value = 3; o.connect(f); f.connect(g); o.start(); return o; });
  clima.vento = ou(CLIMA.vento, g => gravado(AMB.vento)(g) || ruido(g, 'bandpass', 500, 1.2).s);
  clima.nevasca = ou(CLIMA.nevasca, g => gravado(AMB.vento, 0.8)(g) || ruido(g, 'bandpass', 380, 1.2).s);
  clima.granizo = loopNode(gravado(CLIMA.granizo)); // sem a gravação, o granizo vira estalos soltos (tickClima)
  clima.mar = loopNode(gravado(AMB.mar, 0.55));
}
let ultimoClima = 0;
// o: { tipo (ameaça ativa ou clima que continua), forca 0..1, aviso (tipo que vem chegando), dt }
export function tickClima(o) {
  if (!on || !ctx || ctx.state !== 'running' || !prontos) return;
  startClima();
  const t = ctx.currentTime, tp = o.tipo, f = Math.min(1, o.forca || .5), oculto = document.hidden;
  const alvo = { chuva: 0, vento: 0, nevasca: 0, granizo: 0, mar: 0, terremoto: 0, solar: 0 };
  if (!oculto) {
    if (tp === 'chuva' || tp === 'raios') alvo.chuva = .35 + .35 * f;
    if (tp === 'granizo') { alvo.chuva = .2; alvo.granizo = .8; if (!(clima.granizo && clima.granizo.src) && Math.random() < o.dt * 30) sfx('granizo'); }
    if (tp === 'vento') alvo.vento = .55 + .3 * f;
    if (tp === 'furacao') { alvo.vento = 1; alvo.chuva = .3; }
    if (tp === 'ventoAlt' || tp === 'nevasca' || tp === 'gelo') alvo.nevasca = tp === 'gelo' ? .35 : .75;
    if (tp === 'sismo' || tp === 'recalque') alvo.terremoto = .5 + .5 * f;
    if (tp === 'tsunami') { alvo.mar = 1; alvo.terremoto = .35; }
    if (tp === 'solar') alvo.solar = .18 + .1 * Math.sin(t * 7);
    if (!tp && o.aviso) { if (['vento', 'furacao', 'ventoAlt'].includes(o.aviso)) alvo.vento = .15; if (['chuva', 'raios', 'granizo'].includes(o.aviso)) alvo.chuva = .08; }
  }
  const ativoVento = ['vento', 'furacao', 'ventoAlt', 'nevasca', 'gelo'].includes(tp);
  for (const k in alvo) {
    if (!clima[k]) continue;
    if (k === 'vento' || k === 'nevasca') { rajada('clima-' + k, clima[k].g, alvo[k] * .7, ativoVento ? (tp === 'furacao' ? [1.5, 3] : [2.5, 4.5]) : [7, 12]); continue; } // vento em rajadas
    clima[k].g.gain.setTargetAtTime(alvo[k] * (k === 'terremoto' ? .9 : .7), t, .5);
  }
  if (clima.vento && clima.vento.src && clima.vento.src.playbackRate) clima.vento.src.playbackRate.setTargetAtTime(tp === 'furacao' ? 1.3 : 1, t, .5);
}

// síntese de reserva (os sons de antes), para quando o arquivo ainda não carregou
function synth(name, v) {
  switch (name) {
    case 'brick': noise(.045, .22, 0, 1500); tone(150 * v, .07, 'triangle', .3); break;
    case 'beam': tone(220 * v, .12, 'square', .12, 0, .7); noise(.06, .15, 0, 2500); break;
    case 'glass': tone(1400 * v, .08, 'sine', .14); tone(2100 * v, .1, 'sine', .08, .03); break;
    case 'drill': noise(.16, .1, 0, 3500); tone(420, .16, 'sawtooth', .05); break;
    case 'phase': tone(660, .08, 'triangle', .16); tone(880, .1, 'triangle', .14, .07); break;
    case 'floor': tone(523, .12, 'square', .13); tone(659, .12, 'square', .13, .11); tone(784, .26, 'square', .13, .22); break;
    case 'buy': tone(988, .06, 'square', .12); tone(1319, .14, 'square', .12, .055); break;
    case 'machine': tone(80, .6, 'sawtooth', .1, 0, 2.2); noise(.5, .07, 0, 300); break;
    // intempéries (modo torre única): sintetizados na hora
    case 'trovao': noise(.09, .5, 0, 2500); rumble(2.6, .9, 380, .05); rumble(1.8, .5, 160, .35); break;
    case 'meteoro': sweep(1.1, 2400, 300, .25); rumble(1.2, .6, 220, .9); break;
    case 'apito': tone(2900, .16, 'sine', .22); tone(2900, .3, 'sine', .22, .24); break;
    case 'desabamento': rumble(3.5, 1, 260, 0); rumble(2.5, .8, 90, .2); for (let i = 0; i < 14; i++) noise(.05, .25, .3 + Math.random() * 2.8, 1800); tone(55, 2.5, 'sine', .5, 0, .5); break;
    case 'granizo': noise(.018, .12 + Math.random() * .1, 0, 3000 + Math.random() * 3000); break;
    default: return false;
  }
  return true;
}

// toca um som; at = atraso em segundos (ex.: a campainha do elevador novo toca quando o poço termina de subir)
export function sfx(name, at = 0) {
  if (!on || !ctx || ctx.state !== 'running' || document.hidden) return false;
  const now = ctx.currentTime;
  if (now - (last[name] ?? -9) < (GAP[name] ?? .1)) return false;
  last[name] = now;
  const v = .9 + Math.random() * .2, s = SAMPLES[name];
  const file = s && s[0][Math.floor(Math.random() * s[0].length)];
  if (file && buf[file]) { play(buf[file], s[1], at, s[0].length > 1 ? v : 1); return true; }
  return synth(name, v);
}

// ---------- ambiente ----------
const amb = {}; // nome → { gain }
function startAmbience() {
  for (const k in AMB) {
    const b = buf[AMB[k]]; if (!b || amb[k]) continue;
    const g = ctx.createGain(); g.gain.value = 0; g.connect(ambBus);
    const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; s.connect(g); s.start(ctx.currentTime, Math.random() * b.duration);
    amb[k] = { gain: g };
  }
}
// rajada de vento: o volume sobe em ~1,2 s, segura um pouco e some em ~2,2 s (entre as rajadas, silêncio)
const rajadaFim = {}, rajadaProx = {};
function rajada(nome, g, vol, intervalo) {
  const t = ctx.currentTime;
  if (vol <= 0) { if (t > (rajadaFim[nome] || 0)) g.gain.setTargetAtTime(0, t, .4); rajadaProx[nome] = Math.min(rajadaProx[nome] || 0, t + 1.5); return; }
  if (t < (rajadaProx[nome] || 0)) return;
  const sobe = 1.2, segura = 1.2 + Math.random() * 1.8, desce = 2.2;
  g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t);
  g.gain.linearRampToValueAtTime(vol * (.7 + Math.random() * .3), t + sobe);
  g.gain.setValueAtTime(vol * (.7 + Math.random() * .3), t + sobe + segura);
  g.gain.linearRampToValueAtTime(0, t + sobe + segura + desce);
  rajadaFim[nome] = t + sobe + segura + desce;
  rajadaProx[nome] = rajadaFim[nome] + intervalo[0] + Math.random() * (intervalo[1] - intervalo[0]);
}
let nextTruck = 20, nextHammer = 4;
// chamada a cada quadro por main.js. o: { ground 0..1 (térreo à vista), sea (cidade com mar), wind 0..1 (eras altas),
// top (acompanhando o topo com a obra andando), active (jogo correndo: sem pausa, Início nem abertura), dt }
export function tickAmbience(o) {
  if (!ctx || !ambBus || ctx.state !== 'running') return;
  const t = ctx.currentTime, onAmb = on && o.active && cfg().ambiente !== false && !document.hidden;
  ambBus.gain.setTargetAtTime(onAmb ? 1 : 0, t, 0.4);
  const set = (k, v) => amb[k] && amb[k].gain.gain.setTargetAtTime(v, t, 0.6);
  set('canteiro', 0.55 * o.ground);
  set('mar', o.sea ? 0.45 * o.ground : 0);
  if (amb.vento) rajada('ambVento', amb.vento.gain, onAmb ? 0.5 * o.wind : 0, [10, 20]); // vento de fundo em rajadas, não em loop
  if (!onAmb) return;
  // sons soltos de vez em quando: ré do caminhão no térreo, marteladas no topo
  if ((nextTruck -= o.dt) <= 0) { nextTruck = 30 + Math.random() * 40; if (o.ground > 0.5) sfx('truck'); }
  if ((nextHammer -= o.dt) <= 0) { nextHammer = 5 + Math.random() * 6; if (o.top) sfx('hammer'); }
}
