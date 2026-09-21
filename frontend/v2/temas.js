// Cor de cada tema na v2 (fundo do card e sombra "de botão" embaixo).
// Tema sem cor aqui cai no lilás padrão — nada quebra se entrar tema novo.
export const CORES_TEMA = {
  futebol: ["#06D6A0", "#049A74"],
  esportes: ["#5BE0B3", "#2FA57E"],
  automobilismo: ["#FF8A7F", "#C7493F"],
  mpb: ["#FFB86F", "#C9803A"],
  rock: ["#FF8A7F", "#C7493F"],
  musica: ["#FFD60A", "#B88A00"],
  geografia: ["#7CC8FF", "#3F8BC4"],
  historia: ["#E8C39E", "#A8835E"],
  mitologia: ["#E8C39E", "#A8835E"],
  novelas: ["#FF9ED2", "#C75A96"],
  series: ["#FF9ED2", "#C75A96"],
  cinema: ["#FFB86F", "#C9803A"],
  anime: ["#C3A6FF", "#8465D1"],
  games: ["#9FE7C9", "#4FA886"],
  ciencias: ["#7CC8FF", "#3F8BC4"],
  letras: ["#E8C39E", "#A8835E"],
  terceirao: ["#FFD60A", "#B88A00"],
  direito: ["#9FE7C9", "#4FA886"],
  geral: ["#C3A6FF", "#8465D1"],
};
export const corDoTema = (k) => CORES_TEMA[k] || ["#C3A6FF", "#8465D1"];

export const nomeDoTema = (label = "") => label.split(" — ")[0].replace(/^[^\p{L}\d]+/u, "").trim();

export const iniciais = (nick = "") =>
  nick.replace(/[^\p{L}\d ]/gu, "").trim().slice(0, 2).toUpperCase() || "?";

const PALETA = ["#FFD60A", "#FFB86F", "#06D6A0", "#C3A6FF", "#7CC8FF", "#FF9ED2", "#FF8A7F"];
export function corDoJogador(id = "") {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETA[h % PALETA.length];
}
