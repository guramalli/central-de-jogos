// Obra Viva — sons curtos sintetizados na hora (sem arquivos de áudio).
// Só começam depois do primeiro toque/clique do jogador (regra dos navegadores),
// respeitam o botão de som, ficam mudos com a aba escondida e têm taxa máxima por tipo
// para não virar barulho quando a obra acelera.
const KEY = 'torre-infinita-som';
let ctx = null, master = null, on = true, noiseBuf = null;
try { on = localStorage.getItem(KEY) !== '0'; } catch (e) { }
// modo de teste (?test=1): sem som, sem mexer na preferência salva do jogador
const TEST = new URLSearchParams(location.search).get('test') === '1';
if (TEST) on = false;

// intervalo mínimo entre dois sons do mesmo tipo (s)
const GAP = { brick: .11, beam: .2, glass: .2, phase: .35, floor: .5, buy: .08, machine: .7, drill: .25 };
const last = {};

export const soundOn = () => on;
export function setSound(v) {
  if (TEST) return;
  on = !!v;
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { }
  if (on) unlock(); else if (ctx && ctx.state === 'running') ctx.suspend();
}

export function unlock() {
  if (!on) return;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = .2; master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) { ctx = null; }
}
addEventListener('pointerdown', unlock, { passive: true });
addEventListener('keydown', unlock);

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

export function sfx(name) {
  if (!on || !ctx || ctx.state !== 'running' || document.hidden) return false;
  const now = ctx.currentTime;
  if (now - (last[name] ?? -9) < (GAP[name] ?? .1)) return false;
  last[name] = now;
  const v = .9 + Math.random() * .2;
  switch (name) {
    case 'brick': noise(.045, .22, 0, 1500); tone(150 * v, .07, 'triangle', .3); break;           // tijolo assentado
    case 'beam': tone(220 * v, .12, 'square', .12, 0, .7); noise(.06, .15, 0, 2500); break;      // pilar/viga
    case 'glass': tone(1400 * v, .08, 'sine', .14); tone(2100 * v, .1, 'sine', .08, .03); break; // vidro encaixado
    case 'drill': noise(.16, .1, 0, 3500); tone(420, .16, 'sawtooth', .05); break;               // ferramenta elétrica
    case 'phase': tone(660, .08, 'triangle', .16); tone(880, .1, 'triangle', .14, .07); break;  // etapa nova
    case 'floor': tone(523, .12, 'square', .13); tone(659, .12, 'square', .13, .11); tone(784, .26, 'square', .13, .22); break;
    case 'buy': tone(988, .06, 'square', .12); tone(1319, .14, 'square', .12, .055); break;
    case 'machine': tone(80, .6, 'sawtooth', .1, 0, 2.2); noise(.5, .07, 0, 300); break;        // máquina chegando
    default: return false;
  }
  return true;
}
