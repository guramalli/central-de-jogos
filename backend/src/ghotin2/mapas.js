// ===== Ghotin2 — os MAPAS do mundo, para o servidor do modo online (socketMundo.js) =====
//
// O jogo põe todos os mapas no MESMO sistema de coordenadas (em metros) e acha o mapa pela posição (idMapa). O servidor
// precisa da mesma conta para conferir que a posição mandada cai mesmo no mapa dito, e da caixa do mundo para descartar
// posições impossíveis. Tudo aqui é COPIADO do jogo (repositório jogorpg, Tools/viking/teste/):
//   - idMapa, MAPAS e cavDe: index.html (procure "function idMapa", "const MAPAS" e "function cavDe");
//   - as dungeons (o x e a meia largura de cada uma): index.html, "const DUNGEONS" e o DUNGEONS.forEach logo abaixo dele
//     (ESC_CAV), e as Grutas da Seda (DESERTO.ANDARES_GRUTA, mapa_deserto.js);
//   - a Montanha Gelada: OX, OY e EXT de mapa_montanha.js; a Ilha de Daiyu: OX, OY e EXT de mapa_daiyu.js; o Deserto de
//     Mingsha: OX, OY e RAIO_M de mapa_deserto.js; a Vila Hahoe: V.R de mapa_hahoe.js (a Hahoe nova, ligada desde 16/11).
//
// ---- SE O JOGO MUDAR (um mapa novo, uma dungeon nova, um mapa que mudou de lugar ou de tamanho), MUDE AQUI. ----
// Um mapa que falta aqui faz o servidor descartar as posições dele: quem estiver lá some para os outros.

// ---- a velocidade (index.html: VELOCIDADE 2,5, CORRIDA 3,8, VEL_EQUIP_TETO +100%, velMontado até 6,0) ----
// 3,8 m/s × 2 = 7,6 m/s correndo com o teto do equipamento; montado chega a 6,0; mais 10% de folga para o jitter.
export const VMAX = 8.5;

// ---- as dungeons (x > 240): o meio (x) e a meia largura (meia) de cada uma, já com a escala do jogo ----
// No index.html: as 4 da Vila 1 em x = 300 + n × 120 (meia 59), os 3 andares do Vale dos Dragões em x = 810 + (andar − 1) × 180
// (meia 88) e os 2 andares das Grutas da Seda em x = 1450 + (andar − 1) × 330 (meia 160). Todas com o meio em y = 0.
export const DUNGEONS = [
  { id: "ratos", x: 300, meia: 59 },
  { id: "aranhas", x: 420, meia: 59 },
  { id: "cripta", x: 540, meia: 59 },
  { id: "mina", x: 660, meia: 59 },
  { id: "vale1", x: 810, meia: 88 },
  { id: "vale2", x: 990, meia: 88 },
  { id: "vale3", x: 1170, meia: 88 },
  { id: "grutas1", x: 1450, meia: 160 },
  { id: "grutas2", x: 1780, meia: 160 },
];

// a dungeon onde fica este x (cópia de cavDe)
export function cavDe(x) {
  for (const d of DUNGEONS) if (x > d.x - d.meia && x < d.x + d.meia) return d;
  return null;
}

// o id do mapa de um ponto do mundo (cópia de idMapa do index.html; x e y em metros)
export function idMapa(x, y) {
  if (x > 240) { const d = cavDe(x); return "dg" + Math.round((d ? d.x : x) / 100); }
  return y > 1050 ? "deserto" : y > 350 ? "hahoe" : y < -350 ? "daiyu" : x < -350 ? "montanha" : "vila1";
}

// ---- a caixa de cada mapa (em metros): fora dela não há chão, e a posição é descartada ----
// A Vila 1 usa a fatia inteira que o idMapa dá a ela (a costa dela, com as Terras do Sul, fica bem dentro). Os outros usam o
// centro do mapa e a meia largura: a grade (EXT) ou o raio da costa, com folga.
export const CAIXAS = {
  vila1: { x0: -350, x1: 240, y0: -350, y1: 350 },
  hahoe: { x0: -180, x1: 180, y0: 700 - 180, y1: 700 + 180 },        // (V.R = 163 e a costa ondula até ~170)
  montanha: { x0: -700 - 92, x1: -700 + 92, y0: -92, y1: 92 },       // (OX −700, OY 0, EXT 92)
  daiyu: { x0: -92, x1: 92, y0: -700 - 92, y1: -700 + 92 },          // (OX 0, OY −700, EXT 92)
  deserto: { x0: -150, x1: 150, y0: 1400 - 150, y1: 1400 + 150 },    // (OX 0, OY 1400, RAIO_M ~137)
};
// cada dungeon: o trecho dela em x (d.meia de cada lado) e a mesma meia largura em y (as salas cabem com folga)
for (const d of DUNGEONS) CAIXAS["dg" + Math.round(d.x / 100)] = { x0: d.x - d.meia, x1: d.x + d.meia, y0: -d.meia, y1: d.meia };

// os mapas que têm sala no online (as cavernas dg<n> são compartilhadas, como no Metin2: decisão do usuário, 19/11)
export const MAPAS_COM_SALA = Object.freeze(Object.keys(CAIXAS));
const COM_SALA = new Set(MAPAS_COM_SALA);
export const mapaComSala = (m) => typeof m === "string" && COM_SALA.has(m);

// o ponto (em metros) está dentro de algum mapa? Devolve o id do mapa, ou null
export function mapaDoPonto(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const m = idMapa(x, y), c = CAIXAS[m];
  if (!c || x < c.x0 || x > c.x1 || y < c.y0 || y > c.y1) return null;
  return m;
}

// a caixa do mundo inteiro (em metros), para prender os números antes de qualquer conta
export const MUNDO = (() => {
  const b = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  for (const c of Object.values(CAIXAS)) { b.x0 = Math.min(b.x0, c.x0); b.x1 = Math.max(b.x1, c.x1); b.y0 = Math.min(b.y0, c.y0); b.y1 = Math.max(b.y1, c.y1); }
  return Object.freeze(b);
})();
