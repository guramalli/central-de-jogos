// Resolução-base do canvas (pixels de arte). O CSS amplia mantendo os pixels nítidos.
export const W = 360, H = 480;

// Mundo, em pixels de arte na câmera aproximada (zoom 1). x = 0 é o centro da torre, y = 0 é o chão, y cresce para cima.
export const FH = 96;            // altura de um andar (com laje) — 4 andares cabem na tela no zoom 1
export const SLAB = 8;           // espessura da laje
export const TW = 240;           // largura da torre
export const TL = -TW / 2;       // borda esquerda da torre
export const WORKER_H = 58;      // altura de um operário

export const MPF = 4;            // metros por andar
export const BRICKS = 39;        // material por andar na economia (não é a contagem visual de blocos)
export const PANELS = 6;         // painéis por andar (modo painéis)

export const SAVE_KEY = 'torre-infinita-v1';
export const OFFLINE_MAX_S = 8 * 3600;
