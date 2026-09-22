import { agendarRecarga, ehAdmin, PATENTE_ADMIN } from "./patenteFixa.js";

// PATENTES DO MENTIRA SINCERA
//
// A RÉGUA É TEMPO (a mesma dos outros jogos): patente máxima em ~2h/dia
// durante o mês (~60 horas).
//
// Conta: uma partida dura ~12 min (7 perguntas: escrever ~30–45s, votar
// ~26–35s, revelação ~30s) e rende ~5.000 pts NO JOGO pra um jogador médio
// (acha a verdade em metade das rodadas, engana alguém de vez em quando,
// ganha umas curtidas; multiplicadores ×1/×2/×3). No ranking entra
// pontos ÷ DIVISOR_RANKING = ~500 por partida → ~2.400/hora → ~145.000 em
// 60h. Topo: 150.000.
//
// A curva segue as proporções do Acromania (mesma sensação de progresso nos
// jogos). Regra de ouro: BAIXAR limiar só promove; SUBIR rebaixa — nunca
// subir sem avisar.
//
// A escada conta a evolução de um mentiroso:
//   Nariz   — a mentirinha que faz o nariz crescer;
//   Anzol   — a clássica história de pescador;
//   Cartola — o vigarista de respeito;
//   Máscara — o mestre da Mentira Sincera.
// Silhuetas diferentes de propósito (a 34px, o que separa emblema é o
// CONTORNO): nariz comprido, gancho, chapéu alto, rosto.
//
// ARTE: /ranks-mentira/ — arte própria (zip 565), 512x512 com paleta.
// Pra trocar alguma, é só sobrescrever o arquivo com o mesmo nome e subir a
// VERSAO do service worker (arquivo de nome fixo fica preso no cache).
export const DIVISOR_RANKING = 10;

export const MENTIRA_RANKS = [
  { min: 0,      key: "nariz_bronze",   name: "Nariz de Bronze",   icon: "/ranks-mentira/nariz-bronze.png" },
  { min: 200,    key: "nariz_prata",    name: "Nariz de Prata",    icon: "/ranks-mentira/nariz-prata.png" },
  { min: 600,    key: "nariz_ouro",     name: "Nariz de Ouro",     icon: "/ranks-mentira/nariz-ouro.png" },
  { min: 1900,   key: "anzol_bronze",   name: "Anzol de Bronze",   icon: "/ranks-mentira/anzol-bronze.png" },
  { min: 5600,   key: "anzol_prata",    name: "Anzol de Prata",    icon: "/ranks-mentira/anzol-prata.png" },
  { min: 15000,  key: "anzol_ouro",     name: "Anzol de Ouro",     icon: "/ranks-mentira/anzol-ouro.png" },
  { min: 28000,  key: "cartola_bronze", name: "Cartola de Bronze", icon: "/ranks-mentira/cartola-bronze.png" },
  { min: 43000,  key: "cartola_prata",  name: "Cartola de Prata",  icon: "/ranks-mentira/cartola-prata.png" },
  { min: 64000,  key: "cartola_ouro",   name: "Cartola de Ouro",   icon: "/ranks-mentira/cartola-ouro.png" },
  { min: 86000,  key: "mascara_bronze", name: "Máscara de Bronze", icon: "/ranks-mentira/mascara-bronze.png" },
  { min: 116000, key: "mascara_prata",  name: "Máscara de Prata",  icon: "/ranks-mentira/mascara-prata.png" },
  // Brilha, mas NÃO é exclusiva (igual ao topo do Acromania).
  { min: 150000, key: "mascara_ouro",   name: "Máscara de Ouro",   icon: "/ranks-mentira/mascara-ouro.png", brilha: true },
];

// `opts.userId` é opcional: só serve pra reconhecer conta de admin.
export function getMentiraRankForPoints(points, opts = {}) {
  if (opts.userId) {
    agendarRecarga();
    if (ehAdmin(opts.userId)) return PATENTE_ADMIN;
  }
  let atual = MENTIRA_RANKS[0];
  for (const r of MENTIRA_RANKS) {
    if (points >= r.min) atual = r;
    else break;
  }
  return atual;
}

export function getMentiraNextRankInfo(points) {
  const proxima = MENTIRA_RANKS.find((r) => r.min > points);
  if (!proxima) return null;
  return { name: proxima.name, pointsNeeded: proxima.min - points };
}
