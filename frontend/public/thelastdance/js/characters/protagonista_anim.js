// Animações do protagonista (PILOTO, vista de frente). Cada uma devolve a pose dos ossos num instante t (0 a 1).
// Ossos: corpo (balanço do tronco inteiro), quadril, torso, cabeca, braco_dir/antebraco_dir/mao_dir (garrafa),
// braco_esq/antebraco_esq (mão no bolso), coxa_*/canela_*. Valores em pixels do desenho-fonte e graus.
(function (global) {
  "use strict";
  const R = global.NSF && global.NSF.Recorte ? global.NSF.Recorte : require("./recorte.js");
  const { onda, chaves, plantarPes } = R;

  const ANIM = {
    // Respiração: o peito sobe, a cabeça acompanha um pouco atrasada, os braços quase não se mexem.
    parado: {
      duracao: 2.8,
      pose(t) {
        const r = onda(t);
        return plantarPes({
          corpo: { y: -2 * r },
          torso: { sy: 1 + 0.008 * r },
          cabeca: { rot: -1.2 * onda(t, -0.12), y: -1.5 * onda(t, -0.12) },
          braco_dir: { rot: 1.2 * r },
          antebraco_dir: { rot: -1 * onda(t, -0.1) },
          braco_esq: { rot: -0.8 * r },
        });
      },
    },

    // Caminhada de frente, no lugar (quem move o personagem pelo mapa é o jogo).
    // 0–0,5: pé direito (à esquerda da tela) sobe; 0,5–1: pé esquerdo. O corpo desce no apoio e sobe na passagem.
    andar: {
      duracao: 0.95,
      pose(t) {
        const passo = onda(t, 0.25);              // +1 no meio da 1ª metade, −1 no meio da 2ª
        const sobe = Math.abs(onda(t));           // 0 no contato, 1 na passagem
        const levantaDir = t < 0.5 ? Math.sin(Math.PI * t * 2) : 0;
        const levantaEsq = t >= 0.5 ? Math.sin(Math.PI * (t - 0.5) * 2) : 0;
        return plantarPes({
          corpo: { y: 7 - 13 * sobe, x: 6 * passo, rot: 2.2 * passo },
          torso: { rot: -1.6 * passo },
          cabeca: { rot: -1.4 * passo, y: 2 * sobe },
          braco_dir: { rot: -6 * passo },
          antebraco_dir: { rot: -4 * passo },
          braco_esq: { rot: 2 * passo },
          coxa_dir: { rot: 3 * levantaDir },
          canela_dir: { y: -30 * levantaDir, x: 4 * levantaDir },
          coxa_esq: { rot: -3 * levantaEsq },
          canela_esq: { y: -30 * levantaEsq, x: -4 * levantaEsq },
        });
      },
    },

    // Brinde: leva a garrafa à altura do rosto, brinda duas vezes e abaixa.
    // O braço de cima quase não aparece no desenho (está dobrado para a frente): o gesto é do antebraço.
    brinde: {
      duracao: 3.2,
      pose(t) {
        const ergue = chaves(t, [[0, 0], [0.22, 1], [0.72, 1], [0.95, 0], [1, 0]]);
        const tim = t > 0.3 && t < 0.66 ? onda((t - 0.3) / 0.18) : 0; // dois "tins"
        return plantarPes({
          corpo: { y: -4 * ergue, rot: -1.5 * ergue },
          torso: { rot: -2 * ergue },
          cabeca: { rot: -5 * ergue + 1.5 * tim, y: -3 * ergue },
          braco_dir: { rot: 28 * ergue },
          antebraco_dir: { rot: -58 * ergue + 6 * tim },
          mao_dir: { rot: 40 * ergue - 4 * tim },   // garrafa quase em pé, levemente inclinada para o rosto
          braco_esq: { rot: -2 * ergue },
        });
      },
    },

    // Dança: quica no ritmo (2 batidas por ciclo), quadril de um lado para o outro, garrafa para cima.
    danca: {
      duracao: 1.2,
      pose(t) {
        const bate = Math.abs(onda(t));           // quica a cada batida
        const lado = onda(t, 0.25);
        return plantarPes({
          corpo: { y: 12 * bate, x: 10 * lado, rot: 4 * lado },
          torso: { rot: -3 * lado },
          cabeca: { rot: 5 * onda(t * 2, 0.1), y: 3 * bate },
          braco_dir: { rot: 22 + 8 * bate },
          antebraco_dir: { rot: -48 - 14 * bate },
          mao_dir: { rot: 26 + 6 * bate },
          braco_esq: { rot: 3 * lado },
          coxa_dir: { rot: -2 * lado },
          coxa_esq: { rot: -2 * lado },
        });
      },
    },
  };

  if (global.NSF) global.NSF.ANIM_PROTAGONISTA = ANIM;
  if (typeof module !== "undefined") module.exports = ANIM;
})(typeof window !== "undefined" ? window : globalThis);
