// Mundo isométrico: projeção dimétrica 2:1 (D-A6, provisória), colisão e ordem de desenho.
// Coordenadas do mundo em metros (x, y no chão; z para cima). Sem engine.
(function (global) {
  "use strict";

  const ISO = {
    LARG: 144,    // px na tela por metro ao longo de x/y (losango 144 × 72)
    ALT: 72,
    VERT: 100,    // px por metro de altura
  };

  // Mundo -> tela (relativo à origem do mapa).
  ISO.tela = function (x, y, z) {
    return [(x - y) * ISO.LARG / 2, (x + y) * ISO.ALT / 2 - (z || 0) * ISO.VERT];
  };

  // Direção na tela (seta) -> direção no mundo: direita = (+1, −1), baixo = (+1, +1). Normalizada.
  ISO.direcaoMundo = function (sx, sy) {
    const x = sx + sy, y = sy - sx;
    const n = Math.hypot(x, y);
    return n ? [x / n, y / n] : [0, 0];
  };

  // Distância de um ponto a uma caixa (no chão).
  function distCaixa(px, py, c) {
    const dx = Math.max(c.x0 - px, 0, px - c.x1);
    const dy = Math.max(c.y0 - py, 0, py - c.y1);
    return Math.hypot(dx, dy);
  }

  // O personagem (círculo de raio r) cabe nesse ponto?
  ISO.livre = function (planta, x, y, r) {
    if (x < r || y < r || x > planta.largura - r || y > planta.profundidade - r) return false;
    for (const c of planta.caixas) {
      if (c.passavel) continue;
      if (distCaixa(x, y, c) < r) return false;
    }
    return true;
  };

  // Move tentando os eixos separados (desliza ao encostar na parede).
  ISO.mover = function (planta, ent, dx, dy, r) {
    if (ISO.livre(planta, ent.x + dx, ent.y + dy, r)) { ent.x += dx; ent.y += dy; return true; }
    if (dx && ISO.livre(planta, ent.x + dx, ent.y, r)) { ent.x += dx; return true; }
    if (dy && ISO.livre(planta, ent.x, ent.y + dy, r)) { ent.y += dy; return true; }
    return false;
  };

  // Ordem de desenho: A vai antes de B se A está inteira "atrás" de B (menor x ou menor y).
  // Itens: { x0, y0, x1, y1, ... }. Ordenação topológica (poucos itens por cômodo).
  ISO.ordenar = function (itens) {
    const n = itens.length, antes = itens.map(() => []);
    const eps = 1e-6;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const a = itens[i], b = itens[j];
        const atras = a.x1 <= b.x0 + eps || a.y1 <= b.y0 + eps;
        const frente = b.x1 <= a.x0 + eps || b.y1 <= a.y0 + eps;
        if (atras && !frente) antes[j].push(i);
        else if (atras && frente && (a.x0 + a.y0) < (b.x0 + b.y0)) antes[j].push(i);
      }
    }
    const visto = new Uint8Array(n), saida = [];
    const visitar = (i) => {
      if (visto[i]) return;
      visto[i] = 1;
      for (const k of antes[i]) visitar(k);
      saida.push(itens[i]);
    };
    const porSoma = [...itens.keys()].sort((i, j) => (itens[i].x0 + itens[i].y0) - (itens[j].x0 + itens[j].y0));
    for (const i of porSoma) visitar(i);
    return saida;
  };

  // Grade de alcance (busca em largura) a partir de um ponto: quais células o personagem consegue alcançar.
  ISO.alcance = function (planta, x, y, r, passo) {
    passo = passo || 0.1;
    const nx = Math.ceil(planta.largura / passo), ny = Math.ceil(planta.profundidade / passo);
    const ok = new Uint8Array(nx * ny);
    const livre = (i, j) => ISO.livre(planta, (i + 0.5) * passo, (j + 0.5) * passo, r);
    const fila = [[Math.floor(x / passo), Math.floor(y / passo)]];
    ok[fila[0][1] * nx + fila[0][0]] = 1;
    while (fila.length) {
      const [i, j] = fila.shift();
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = i + di, b = j + dj;
        if (a < 0 || b < 0 || a >= nx || b >= ny || ok[b * nx + a]) continue;
        if (!livre(a, b)) continue;
        ok[b * nx + a] = 1;
        fila.push([a, b]);
      }
    }
    return { passo, nx, ny, ok, alcancavel: (px, py) => ok[Math.floor(py / passo) * nx + Math.floor(px / passo)] === 1 };
  };

  if (global.NSF) global.NSF.ISO = ISO;
  if (typeof module !== "undefined") module.exports = ISO;
})(typeof window !== "undefined" ? window : globalThis);
