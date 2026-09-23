import { Howl, Howler } from "howler";

// Sons do Impostor (Howler).
//
// Mudo e volume são OS MESMOS do resto da v2 (chaves eg_v2_mudo e
// eg_v2_volume, gravadas por v2/sons.js): quem desligou o som no site não
// leva susto aqui, e vice-versa. Este módulo só lê as chaves na hora de
// tocar e escreve o mudo no mesmo formato ("1"/"0") — v2/sons.js não muda.
//
// Os arquivos em /sounds/impostor/ são PROVISÓRIOS (bipes curtos). Pra
// trocar, basta sobrescrever com o mesmo nome — ou mudar a extensão aqui.
const CHAVE_MUDO = "eg_v2_mudo";
const CHAVE_VOLUME = "eg_v2_volume";

const ARQUIVOS = {
  cartaVirando: { src: "/sounds/impostor/carta.wav", volume: 0.8 },
  tique: { src: "/sounds/impostor/tique.wav", volume: 0.5 },
  votoConfirmado: { src: "/sounds/impostor/voto.wav", volume: 0.8 },
  revelacao: { src: "/sounds/impostor/revelacao.wav", volume: 1 },
  vitoria: { src: "/sounds/impostor/vitoria.wav", volume: 0.8 },
};

const carregados = {};
function som(nome) {
  if (!carregados[nome]) {
    const { src, volume } = ARQUIVOS[nome];
    // Sem o arquivo, o jogo segue sem esse som (nada de erro na tela).
    carregados[nome] = new Howl({ src: [src], volume, preload: true, onloaderror: () => {}, onplayerror: () => {} });
  }
  return carregados[nome];
}

function ler(chave, padrao) {
  try { return localStorage.getItem(chave) ?? padrao; } catch { return padrao; }
}

export function estaMudo() {
  return ler(CHAVE_MUDO, "0") === "1";
}

export function alternarMudo() {
  const mudo = !estaMudo();
  try { localStorage.setItem(CHAVE_MUDO, mudo ? "1" : "0"); } catch { /* sem armazenamento: vale só nesta página */ }
  if (mudo) Howler.stop();
  return mudo;
}

// Baixa os arquivos ao abrir o jogo, pra o primeiro som não atrasar.
export function prepararSons() {
  for (const nome of Object.keys(ARQUIVOS)) som(nome);
}

export function tocar(nome) {
  if (!ARQUIVOS[nome] || estaMudo()) return;
  const volume = Math.min(1, Math.max(0, parseFloat(ler(CHAVE_VOLUME, "0.7")) || 0));
  if (volume === 0) return;
  Howler.volume(volume);
  try { som(nome).play(); } catch { /* áudio indisponível: segue sem som */ }
}
