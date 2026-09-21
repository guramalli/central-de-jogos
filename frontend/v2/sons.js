// Sons da v2 — SÓ DENTRO DAS SALAS DE JOGO (Quiz, Stop, Acromania).
//
// Os dois de arquivo (pergunta.mp3, comemoracao.mp3) são os mesmos do
// clássico; o tique, o "erro" e os bipes são sintetizados na hora.
//
// POR QUE WEB AUDIO E NÃO <audio>:
// No iPhone, o <audio> só toca depois de ser "destravado" por um toque, e o
// jeito de destravar era dar play com volume 0 e pausar. Só que no iOS o
// volume do <audio> é SOMENTE LEITURA (sempre 100%): o "play mudo" saía
// ALTO — e como o destravamento rodava no primeiro toque de QUALQUER página,
// o site soltava sons do nada fora dos jogos. Aqui tudo passa pelo
// AudioContext: ele é destravado por um buffer realmente vazio (silêncio de
// verdade), e os arquivos são só DECODIFICADOS, nunca tocados, até o jogo
// pedir. De quebra resolve o som de início de pergunta que não tocava no
// iPhone (a trava própria do <audio> deixa de existir).
//
// E nada disso acontece fora das salas: quem liga é ativarSons(), chamado
// quando uma sala abre.

const ARQUIVOS = {
  pergunta: { url: "/sounds/pergunta.mp3", volume: 0.5 },
  acerto: { url: "/sounds/comemoracao.mp3", volume: 0.35 },
};

let ctx = null;
const buffers = {};
let carregando = false;
let escutando = false;
let mudo = localStorage.getItem("eg_v2_mudo") === "1";

export const estaMudo = () => mudo;
export function alternarMudo() {
  mudo = !mudo;
  localStorage.setItem("eg_v2_mudo", mudo ? "1" : "0");
  return mudo;
}

function carregarArquivos() {
  if (carregando || !ctx) return;
  carregando = true;
  for (const [nome, { url }] of Object.entries(ARQUIVOS)) {
    fetch(url)
      .then((r) => r.arrayBuffer())
      // Forma de callback: o Safari mais antigo não devolve promessa aqui.
      .then((dados) => new Promise((ok, falha) => ctx.decodeAudioData(dados, ok, falha)))
      .then((buf) => { buffers[nome] = buf; })
      .catch(() => {}); // sem o arquivo, o jogo segue sem esse som
  }
}

// Chamado DENTRO de um gesto (toque/tecla): cria/retoma o contexto e toca
// um buffer vazio — silêncio de verdade, em qualquer aparelho.
function destravar() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    const vazio = ctx.createBuffer(1, 1, 22050);
    const fonte = ctx.createBufferSource();
    fonte.buffer = vazio;
    fonte.connect(ctx.destination);
    fonte.start(0);
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    carregarArquivos();
    if (ctx.state === "running") pararDeEscutar();
  } catch {
    // sem áudio no aparelho: o jogo segue mudo, sem quebrar
  }
}

const GESTOS = ["pointerdown", "touchend", "keydown"];
function pararDeEscutar() {
  if (!escutando) return;
  escutando = false;
  GESTOS.forEach((ev) => window.removeEventListener(ev, destravar));
}

// As salas chamam isto ao abrir. Fora delas, nenhum som existe.
export function ativarSons() {
  // iPhone (iOS 17+): pelo Web Audio o som obedece a chave de silencioso do
  // aparelho — o <audio> antigo ignorava. "playback" mantém o comportamento
  // de antes nas salas (e só nelas, porque só elas chamam isto).
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch {}
  if (ctx?.state === "running") return;
  // Se a pessoa já tocou na página (clicou pra entrar na sala), dá pra
  // tentar destravar já — em muitos navegadores isso basta.
  if (navigator.userActivation?.hasBeenActive) destravar();
  if (!escutando) {
    escutando = true;
    GESTOS.forEach((ev) => window.addEventListener(ev, destravar, { passive: true }));
  }
}

function tocarArquivo(nome) {
  if (mudo || !ctx || !buffers[nome]) return;
  try {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const fonte = ctx.createBufferSource();
    const ganho = ctx.createGain();
    ganho.gain.value = ARQUIVOS[nome].volume;
    fonte.buffer = buffers[nome];
    fonte.connect(ganho).connect(ctx.destination);
    fonte.start(0);
  } catch {}
}

function bip(freq, dur, tipo = "sine", vol = 0.12) {
  if (mudo || !ctx) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = tipo;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch {}
}

export const somPergunta = () => tocarArquivo("pergunta");
export const somAcerto = () => tocarArquivo("acerto");
export const somTique = () => bip(880, 0.08, "square", 0.05);
export const somErro = () => { bip(220, 0.12, "sawtooth", 0.06); setTimeout(() => bip(160, 0.16, "sawtooth", 0.06), 90); };
export const somOutroAcertou = () => { bip(660, 0.1); setTimeout(() => bip(520, 0.14), 100); };
// STOP pedido: três bipes subindo, tipo sirene curta.
export const somStop = () => { bip(520, 0.09, "square", 0.07); setTimeout(() => bip(700, 0.09, "square", 0.07), 110); setTimeout(() => bip(900, 0.16, "square", 0.07), 220); };
