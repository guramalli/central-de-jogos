// Sons curtos gerados na hora (Web Audio API) — sem precisar de arquivos de
// áudio externos.
//
// NO CELULAR (iOS principalmente) O CONTEXTO PRECISA SER DESTRAVADO POR UM
// TOQUE. Antes o contexto era criado no primeiro som — que acontece quando a
// rodada começa, não num toque —, e o Safari o criava SUSPENSO. O `resume()`
// só funciona se vier de dentro de um gesto do usuário, então ele ficava
// suspenso pra sempre e nenhum som tocava no iPhone.
//
// A correção é criar e destravar no PRIMEIRO TOQUE em qualquer lugar da
// página, muito antes do primeiro som. No desktop não muda nada.
let audioCtx;
let destravado = false;
// Declarados aqui em cima porque o destravamento por toque precisa deles —
// estavam mais abaixo, junto das funções que os usam.
let questionStartAudio;
let correctAudio;

// Fábricas dos <audio> de arquivo, pra o destravamento acima alcançá-los.
// São funções, não elementos: assim os arquivos só são criados quando o
// primeiro toque acontece, e não no carregamento da página.
const audiosParaDestravar = [
  () => {
    if (!questionStartAudio) {
      questionStartAudio = new Audio("/sounds/pergunta.mp3");
      questionStartAudio.volume = 0.5;
      // `preload` + `load()`: o som da rodada toca sem aviso prévio, e o iOS
      // não baixa arquivo de áudio por conta própria. Sem isto ele começa a
      // buscar só na hora de tocar e perde o momento.
      questionStartAudio.preload = "auto";
      questionStartAudio.load();
    }
    return questionStartAudio;
  },
  () => {
    if (!correctAudio) {
      correctAudio = new Audio("/sounds/comemoracao.mp3");
      // 0.3, que era o valor da função antiga — a fábrica estava com 0.5 e
      // isso deixaria o som de acerto mais alto do que sempre foi.
      correctAudio.volume = 0.3;
      correctAudio.preload = "auto";
      correctAudio.load();
    }
    return correctAudio;
  },
];

function destravarAudio() {
  if (destravado) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === "suspended") audioCtx.resume();

  // Um som mudo de 1 amostra: o iOS só considera o contexto "aquecido"
  // depois de reproduzir alguma coisa dentro do gesto. Sem isto, o resume()
  // sozinho às vezes não basta.
  try {
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const fonte = audioCtx.createBufferSource();
    fonte.buffer = buffer;
    fonte.connect(audioCtx.destination);
    fonte.start(0);
  } catch {
    // Contexto indisponível: o jogo segue sem som, sem quebrar nada.
  }

  // OS <audio> DE ARQUIVO TÊM TRAVA PRÓPRIA no iOS.
  //
  // O contexto acima cobre só os sons sintetizados. Os do Quiz
  // (pergunta.mp3, comemoracao.mp3) usam elemento <audio>, que o Safari
  // bloqueia separadamente — foi por isso que o som da pergunta continuou
  // mudo mesmo depois de eu destravar o contexto.
  //
  // O truque é dar play e pause imediato DENTRO do gesto: o elemento fica
  // marcado como liberado e o play seguinte, fora de gesto, funciona.
  for (const criar of audiosParaDestravar) {
    try {
      const el = criar();
      if (!el) continue;

      // VOLUME 0, NÃO `muted`, e a restauração SEMPRE acontece.
      //
      // A primeira versão punha `muted = true` e só desfazia dentro do
      // `.then()` do play(). Quando o play() não devolve promessa — Safari
      // mais antigo faz isso — o `.then()` nunca roda e o elemento fica mudo
      // PRA SEMPRE. Era por isso que o som de acerto tocava e o de início de
      // rodada não: os dois passam pelo mesmo caminho, e bastava um deles
      // cair nesse buraco.
      //
      // Agora a restauração vai num setTimeout, que roda de qualquer jeito.
      const volumeOriginal = el.volume;
      el.volume = 0;
      el.play()?.catch(() => {});

      setTimeout(() => {
        try {
          el.pause();
          el.currentTime = 0;
        } catch {
          // ignora
        }
        el.volume = volumeOriginal;
        el.muted = false;
      }, 120);
    } catch {
      // elemento indisponível: segue sem som, sem quebrar
    }
  }

  destravado = true;
  for (const ev of ["touchend", "click", "keydown"]) {
    document.removeEventListener(ev, destravarAudio);
  }
}


if (typeof document !== "undefined") {
  // `touchend`, não `touchstart`: o iOS conta o gesto como completo só no
  // fim do toque.
  for (const ev of ["touchend", "click", "keydown"]) {
    document.addEventListener(ev, destravarAudio);
  }
}

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

// Toca quando uma pergunta nova começa — arquivo de áudio de verdade. O
// <audio> é criado uma vez só; a variável está declarada lá em cima, junto
// do destravamento por toque.
export function playQuestionStartSound() {
  if (muted) return;
  // Usa a MESMA fábrica do destravamento: antes esta função criava o
  // elemento por conta própria, sem `preload`, e podia acabar com uma
  // instância diferente da que foi liberada no primeiro toque.
  const el = audiosParaDestravar[0]();
  if (!el) return;
  // `currentTime = 0` lança erro se o arquivo ainda não carregou — e o erro
  // abortava a função ANTES do play(). Por isso vai dentro do try.
  try {
    el.currentTime = 0;
  } catch {
    // ainda carregando: toca do começo mesmo assim
  }
  el.play()?.catch(() => {
    // navegador bloqueou: ignora, o jogo segue
  });
}

// Toca quando alguém acerta — mesma ideia do som da pergunta.
export function playCorrectSound() {
  if (muted) return;
  // Mesma fábrica, mesmo motivo da função acima.
  const el = audiosParaDestravar[1]();
  if (!el) return;
  try {
    el.currentTime = 0;
  } catch {
    // ainda carregando
  }
  el.play()?.catch(() => {
    // navegador bloqueou: ignora
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
 * DOIS sons só: a rodada começando e a contagem dos últimos 5 segundos.
 *
 * Tinha resultado e palmas também, e saíram por decisão do Gustavinho — som
 * demais em partida longa vira ruído e a pessoa desliga tudo, perdendo junto
 * os avisos que importam.
 *
 * Família arcade (onda quadrada, notas curtas): combina com a cara do site,
 * que já é de fliperama — Stop em letras grandes, logos com contorno.
 *
 * Respeitam o mesmo mudo do Quiz: quem desliga num jogo não quer ouvir no
 * outro, e os dois ficam abertos juntos.
 */

// Envelope com ataque e queda. Corte seco estala no alto-falante.
function tomArcade(freq, dur, delay = 0, vol = 0.1) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const t = ctx.currentTime + delay;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// RODADA COMEÇA — escadinha de três notas subindo (sol, dó, mi).
//
// Sobe e RESOLVE na última nota: som que para no meio soa como pergunta, não
// como largada. A terceira nota é mais longa de propósito, pra fechar.
export function playAcromaniaRoundStart() {
  if (muted) return;
  tomArcade(392, 0.07, 0, 0.1);
  tomArcade(523, 0.07, 0.07, 0.1);
  tomArcade(659, 0.16, 0.14, 0.11);
}

// CONTAGEM — um toque por segundo, dos 5 até o 1.
//
// O tom sobe a cada segundo: cinco toques iguais não diriam quanto falta.
// O último é mais longo e mais alto, pra marcar o fim.
export function playAcromaniaTick(segundosRestantes) {
  if (muted) return;
  const passo = Math.max(0, Math.min(4, 5 - segundosRestantes));
  const freq = 660 + passo * 80; // 660, 740, 820, 900, 980
  const ultimo = segundosRestantes <= 1;
  tomArcade(freq, ultimo ? 0.24 : 0.07, 0, ultimo ? 0.13 : 0.09);
}
