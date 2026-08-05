// Sons curtos gerados na hora (Web Audio API) — sem precisar de arquivos de
// áudio externos. Alguns navegadores só liberam áudio depois de alguma
// interação do usuário na página; como o jogador já clicou pra entrar na
// sala antes disso tocar, normalmente funciona sem problema.
let audioCtx;

const MUTE_KEY = "quiz-sound-muted";
let muted = localStorage.getItem(MUTE_KEY) === "true";

export function isSoundMuted() {
  return muted;
}

export function setSoundMuted(value) {
  muted = value;
  localStorage.setItem(MUTE_KEY, value ? "true" : "false");
}

export function toggleSoundMuted() {
  setSoundMuted(!muted);
  return muted;
}

function getCtx() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function beep(freq, duration, delay = 0, type = "sine", volume = 0.15) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const startTime = ctx.currentTime + delay;
  osc.start(startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.stop(startTime + duration + 0.02);
}

// Toca quando uma pergunta nova começa — dois toques curtos, tipo "alerta".
export function playQuestionStartSound() {
  if (muted) return;
  beep(440, 0.12, 0, "sine", 0.12);
  beep(660, 0.16, 0.12, "sine", 0.12);
}

// Toca quando alguém acerta — uma aproximação sintetizada de um grito animado
// (tipo um "eeeaah!"): a nota sobe rápido (glissando) e tem uma camada de
// ruído filtrado por cima pra dar uma textura mais "de voz" do que um bipe
// musical comum. Não é uma gravação de voz de verdade (não tenho acesso a
// áudios prontos aqui) — se um dia vocês tiverem um grito gravado de
// verdade, é bem fácil trocar por ele.
export function playCorrectSound() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.setValueAtTime(280, now);
  osc.frequency.exponentialRampToValueAtTime(950, now + 0.16);
  osc.frequency.exponentialRampToValueAtTime(680, now + 0.4);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

  osc.start(now);
  osc.stop(now + 0.55);

  // Camada de "ruído" curto, filtrado, pra dar uma textura mais de voz/grito.
  const bufferSize = Math.floor(ctx.sampleRate * 0.3);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 1100;
  noiseFilter.Q.value = 0.7;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.07;
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
}
