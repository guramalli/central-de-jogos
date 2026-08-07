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

// Toca quando uma pergunta nova começa — usa um arquivo de áudio de verdade
// (não sintetizado). O <audio> é criado uma vez só e reaproveitado.
let questionStartAudio;
export function playQuestionStartSound() {
  if (muted) return;
  if (!questionStartAudio) {
    questionStartAudio = new Audio("/sounds/pergunta.mp3");
    questionStartAudio.volume = 0.5;
  }
  questionStartAudio.currentTime = 0;
  questionStartAudio.play().catch(() => {
    // navegador pode bloquear autoplay antes de qualquer interação — sem problema, ignora
  });
}

// Toca quando alguém acerta — usa um arquivo de áudio de verdade (não
// sintetizado). O <audio> é criado uma vez só e reaproveitado.
let correctAudio;
export function playCorrectSound() {
  if (muted) return;
  if (!correctAudio) {
    correctAudio = new Audio("/sounds/comemoracao.mp3");
    correctAudio.volume = 0.3;
  }
  correctAudio.currentTime = 0;
  correctAudio.play().catch(() => {
    // navegador pode bloquear autoplay antes de qualquer interação — sem problema, ignora
  });
}

// Som de mensagem privada — mute próprio, separado do mute do Quiz (alguém
// pode querer silenciar só as mensagens sem silenciar o jogo, ou vice-versa).
const DM_MUTE_KEY = "dm-sound-muted";
let dmMuted = localStorage.getItem(DM_MUTE_KEY) === "true";

export function isDmSoundMuted() {
  return dmMuted;
}

export function toggleDmSoundMuted() {
  dmMuted = !dmMuted;
  localStorage.setItem(DM_MUTE_KEY, dmMuted ? "true" : "false");
  return dmMuted;
}

export function playMessageSound() {
  if (dmMuted) return;
  beep(880, 0.08, 0, "sine", 0.12);
  beep(1180, 0.1, 0.08, "sine", 0.12);
}
