// Sons da v2. Os dois de arquivo são os mesmos do site clássico; o tique e o
// "erro" são sintetizados na hora (Web Audio), sem arquivo novo.
//
// iOS: tanto o contexto de áudio quanto os <audio> só destravam dentro de um
// gesto — por isso tudo é criado e "aquecido" no primeiro toque.
let ctx = null;
let pergunta = null;
let acerto = null;
let destravado = false;
let mudo = localStorage.getItem("eg_v2_mudo") === "1";

export const estaMudo = () => mudo;
export function alternarMudo() {
  mudo = !mudo;
  localStorage.setItem("eg_v2_mudo", mudo ? "1" : "0");
  return mudo;
}

function destravar() {
  if (destravado) return;
  destravado = true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) {
    ctx = new AC();
    try {
      const b = ctx.createBuffer(1, 1, 22050);
      const s = ctx.createBufferSource();
      s.buffer = b;
      s.connect(ctx.destination);
      s.start(0);
    } catch {}
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
  }
  pergunta = new Audio("/sounds/pergunta.mp3");
  pergunta.volume = 0.5;
  pergunta.preload = "auto";
  acerto = new Audio("/sounds/comemoracao.mp3");
  acerto.volume = 0.35;
  acerto.preload = "auto";
  // Toca e pausa na hora, dentro do gesto — é o que libera o <audio> no iOS.
  // Sem `muted` esperando promessa (armadilha já conhecida).
  for (const a of [pergunta, acerto]) {
    const v = a.volume;
    a.volume = 0;
    const p = a.play();
    const volta = () => { a.pause(); a.currentTime = 0; a.volume = v; };
    if (p && p.then) p.then(volta).catch(() => { a.volume = v; });
    else volta();
  }
}
["pointerdown", "touchend", "keydown"].forEach((ev) =>
  window.addEventListener(ev, destravar, { passive: true })
);

function tocarArquivo(a) {
  if (mudo || !a) return;
  try { a.currentTime = 0; a.play().catch(() => {}); } catch {}
}

function bip(freq, dur, tipo = "sine", vol = 0.12) {
  if (mudo || !ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = tipo;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + dur);
}

export const somPergunta = () => tocarArquivo(pergunta);
export const somAcerto = () => tocarArquivo(acerto);
export const somTique = () => bip(880, 0.08, "square", 0.05);
export const somErro = () => { bip(220, 0.12, "sawtooth", 0.06); setTimeout(() => bip(160, 0.16, "sawtooth", 0.06), 90); };
export const somOutroAcertou = () => { bip(660, 0.1); setTimeout(() => bip(520, 0.14), 100); };

// STOP pedido: três bipes subindo, tipo sirene curta.
export const somStop = () => { bip(520, 0.09, "square", 0.07); setTimeout(() => bip(700, 0.09, "square", 0.07), 110); setTimeout(() => bip(900, 0.16, "square", 0.07), 220); };
