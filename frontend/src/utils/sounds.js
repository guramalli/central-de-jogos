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

/* ===== ACROMANIA =====
 *
 * Sons sintetizados, não arquivos: o jogo tem quatro momentos e gravar quatro
 * mp3 pesaria no carregamento pra algo que dois bipes resolvem.
 *
 * Respeitam o MESMO mudo do Quiz (`muted`), porque quem desliga o som num
 * jogo não quer ouvir no outro — e o Acromania costuma ser jogado em outra
 * aba, junto com o Stop.
 *
 * Cada som tem um DESENHO diferente, não só um tom diferente: quem está em
 * quatro salas precisa saber o que aconteceu sem olhar.
 */

// Rodada começa: sobe, é o chamado pra ação.
export function playAcromaniaRoundStart() {
  if (muted) return;
  beep(520, 0.1, 0, "triangle", 0.14);
  beep(700, 0.12, 0.09, "triangle", 0.14);
}

// Votação abre: dois toques iguais, como quem bate na mesa pedindo atenção.
export function playAcromaniaVotingStart() {
  if (muted) return;
  beep(660, 0.08, 0, "square", 0.1);
  beep(660, 0.08, 0.14, "square", 0.1);
}

// Resultado: acorde de três notas subindo — o único "alegre" do conjunto.
export function playAcromaniaResult() {
  if (muted) return;
  beep(523, 0.12, 0, "sine", 0.14);
  beep(659, 0.12, 0.1, "sine", 0.14);
  beep(784, 0.2, 0.2, "sine", 0.14);
}

// Recebeu um voto: curto e agudo, pra não atrapalhar quem ainda está lendo
// as outras frases.
export function playAcromaniaVoteReceived() {
  if (muted) return;
  beep(1046, 0.07, 0, "sine", 0.1);
}

// Tempo acabando (5s): desce, é aviso. Volume mais baixo que os outros
// porque toca enquanto a pessoa está digitando.
export function playAcromaniaTimeWarning() {
  if (muted) return;
  beep(440, 0.1, 0, "sawtooth", 0.09);
  beep(330, 0.14, 0.1, "sawtooth", 0.09);
}
