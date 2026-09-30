/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🛣️ RUAS (v153): acabamento das ruas dos mapas abertos.
   - meio-fio (guia) onde o asfalto encontra a calçada/grama;
   - faixa tracejada no meio das ruas largas e faixa de pedestre antes dos cruzamentos;
   - placa no meio da rua vai para a calçada mais perto;
   - árvore/enfeite espalhado que caiu no meio da rua sai (carros, bondes e carrinhos ficam).
   Só desenha no chão (uma vez, junto com o resto do chão): não pesa no jogo.
   Carregar DEPOIS de monumentos.js.
   ============================================================ */
// rua = faixa comprida e estreita do mesmo chão. tipo por quadro: 1 = rua deitada, 2 = rua em pé, 3 = cruzamento
function faixasRua(m, tipos) {
  const W = m.w, H = m.h, N = W * H, eh = new Uint16Array(N), ev = new Uint16Array(N), tipo = new Uint8Array(N);
  const eRua = k => tipos.has(m.chao[k]);
  for (let j = 0; j < H; j++) for (let i = 0; i < W;) { if (!eRua(j * W + i)) { i++; continue; } let f = i; while (f < W && eRua(j * W + f)) f++; for (let k = i; k < f; k++) eh[j * W + k] = f - i; i = f; }
  for (let i = 0; i < W; i++) for (let j = 0; j < H;) { if (!eRua(j * W + i)) { j++; continue; } let f = j; while (f < H && eRua(f * W + i)) f++; for (let k = j; k < f; k++) ev[k * W + i] = f - j; j = f; }
  for (let k = 0; k < N; k++) if (eRua(k)) { if (ev[k] <= 5 && eh[k] >= 8) tipo[k] = 1; else if (eh[k] <= 5 && ev[k] >= 8) tipo[k] = 2; }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i; if (!eRua(k) || tipo[k]) continue;
    let h = false, v = false;
    for (let d = 1; d <= 6 && !h; d++) h = (i - d >= 0 && tipo[k - d] === 1) || (i + d < W && tipo[k + d] === 1);
    for (let d = 1; d <= 6 && !v; d++) v = (j - d >= 0 && tipo[k - d * W] === 2) || (j + d < H && tipo[k + d * W] === 2);
    if (h && v) tipo[k] = 3;
  }
  return { tipo, eh, ev };
}
function mapaDeRua(id) { return typeof dimProjeto === 'function' && !!dimProjeto(id); }
function tiposRua(id) { const c = typeof CIDADES !== 'undefined' && CIDADES.find(x => x.id === id); return new Set([CH.ASFALTO].concat(c && c.rua != null ? [c.rua] : [])); }
const VEICULO_RUA = /carro|onibus|bonde|food_truck|vespa|bicicleta|carrinho|bau|poste|placa|gol|^x$/;

function arrumaRuas(m) {
  if (m.interior || m._ruas) return; m._ruas = true;
  // 0) sobrinha de asfalto com 1 quadro de largura (ex.: embaixo de uma praça que ficou em cima da rua) vira a praça
  { const W = m.w, a = k => m.chao[k] === CH.ASFALTO;
    for (let j = 1; j < m.h - 1; j++) for (let i = 0; i < W; i++) { const k = j * W + i; if (a(k) && !a(k - W) && !a(k + W) && m.chao[k - W] !== CH.AGUA && CH_ANDA(m.chao[k - W]) && (i === 0 || a(k - 1) || a(k + 1))) { let run = 0; for (let d = i; d < W && a(d + j * W) && !a(d + (j - 1) * W) && !a(d + (j + 1) * W); d++) run++; if (run >= 2 && run <= 12) for (let d = i; d < i + run; d++) m.chao[j * W + d] = m.chao[k - W]; } } }
  const W = m.w, { tipo } = faixasRua(m, tiposRua(m.id)), naRua = (x, y) => x >= 0 && y >= 0 && x < W && y < m.h && tipo[y * W + x] > 0;
  // 1) enfeites espalhados que caíram na rua
  const c = typeof CIDADES !== 'undefined' && CIDADES.find(x => x.id === m.id);
  const soltos = new Set(c ? [...(c.props || []), ...(c.arvores || [])] : ['arvore', 'arvore2', 'pinheiro', 'coqueiro', 'coqueiro2', 'arbusto', 'flores', 'pedra']);
  for (let k = 0; k < tipo.length; k++) { const o = m.obj[k]; if (tipo[k] && o && soltos.has(o.t) && !VEICULO_RUA.test(o.t)) m.obj[k] = null; }
  // 1b) nada de vaso, árvore ou lixeira dentro dos campos (Lisboa e Madri tinham)
  for (const cp of m.campos) for (let j = cp.y; j < cp.y + cp.h; j++) for (let i = cp.x; i < cp.x + cp.w; i++) { const o = m.obj[j * W + i]; if (o && o.t !== 'gol' && o.t !== 'x' && o.t !== 'placa') m.obj[j * W + i] = null; }
  // 2) placa no meio da rua → calçada mais perto (de preferência colada na rua)
  const livre = (x, y) => x > 0 && y > 0 && x < W - 1 && y < m.h - 1 && !m.obj[y * W + x] && CH_ANDA(m.chao[y * W + x]) && m.chao[y * W + x] !== CH.AGUA && !naRua(x, y)
    && !m.saidas.some(s => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1) && !m.npcs.some(n => n.x === x && n.y === y) && !m.predios.some(p => p.porta && p.porta.x === x && p.porta.y + 1 === y);
  for (const pl of m.placas) {
    if (!naRua(pl.x, pl.y)) continue;
    let melhor = null;
    for (let r = 1; r <= 6 && !melhor; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = pl.x + dx, y = pl.y + dy; if (!livre(x, y)) continue;
      const cola = naRua(x + 1, y) || naRua(x - 1, y) || naRua(x, y + 1) || naRua(x, y - 1); const nota = Math.hypot(dx, dy) - (cola ? 2 : 0);
      if (!melhor || nota < melhor.n) melhor = { x, y, n: nota };
    }
    if (!melhor) continue;
    const o = m.obj[pl.y * W + pl.x]; if (o && o.t === 'placa') m.obj[pl.y * W + pl.x] = null;
    pl.x = melhor.x; pl.y = melhor.y; m.obj[pl.y * W + pl.x] = { t: 'placa', v: 1 };
  }
}
for (const id of Object.keys(MAPAS_DEF)) {
  if (!mapaDeRua(id)) continue;
  const base = MAPAS_DEF[id];
  MAPAS_DEF[id] = function () { const m = base(); try { arrumaRuas(m); } catch (e) { console.error('ruas', id, e); } return m; };
}

// desenho: meio-fio, faixa do meio e faixa de pedestre (só no asfalto)
function pintaRuas(x, m) {
  const W = m.w, H = m.h, { tipo, eh, ev } = faixasRua(m, new Set([CH.ASFALTO])), asf = k => m.chao[k] === CH.ASFALTO;
  const g = Math.max(3, Math.round(T * 0.11)); // largura da guia
  // faixa do meio (tracejada) e de pedestre
  x.fillStyle = 'rgba(255,255,255,0.72)';
  const perto3 = (i, j, dx, dy, n) => { for (let d = 1; d <= n; d++) { const a = i + dx * d, b = j + dy * d; if (a >= 0 && b >= 0 && a < W && b < H && tipo[b * W + a] === 3) return true; } return false; };
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i; if (!asf(k)) continue;
    if (tipo[k] === 1) {
      const topo = j === 0 || tipo[k - W] !== 1; if (!topo) continue; const esp = ev[k];
      if (esp >= 3 && (perto3(i, j, 1, 0, 1) || perto3(i, j, -1, 0, 1))) { // faixa de pedestre: barras deitadas atravessando a rua
        for (let y = j * T + T * 0.18; y < (j + esp) * T - T * 0.2; y += T * 0.3) x.fillRect(i * T + T * 0.12, y, T * 0.76, T * 0.15);
      } else if (esp >= 3 && !perto3(i, j, 1, 0, 2) && !perto3(i, j, -1, 0, 2)) x.fillRect(i * T + T * 0.2, (j + esp / 2) * T - T * 0.04, T * 0.5, T * 0.08);
    } else if (tipo[k] === 2) {
      const esq = i === 0 || tipo[k - 1] !== 2; if (!esq) continue; const esp = eh[k];
      if (esp >= 3 && (perto3(i, j, 0, 1, 1) || perto3(i, j, 0, -1, 1))) {
        for (let xx = i * T + T * 0.18; xx < (i + esp) * T - T * 0.2; xx += T * 0.3) x.fillRect(xx, j * T + T * 0.12, T * 0.15, T * 0.76);
      } else if (esp >= 3 && !perto3(i, j, 0, 1, 2) && !perto3(i, j, 0, -1, 2)) x.fillRect((i + esp / 2) * T - T * 0.04, j * T + T * 0.2, T * 0.08, T * 0.5);
    }
  }
  // meio-fio: onde o asfalto encosta em outro chão (não na água nem na beirada do mapa)
  const borda = (a, b) => a >= 0 && b >= 0 && a < W && b < H && !asf(b * W + a) && m.chao[b * W + a] !== CH.AGUA;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    if (!asf(j * W + i)) continue; const X = i * T, Y = j * T;
    const lados = [[0, -1, X, Y, T, g], [0, 1, X, Y + T - g, T, g], [-1, 0, X, Y, g, T], [1, 0, X + T - g, Y, g, T]];
    for (const [dx, dy, rx, ry, rw, rh] of lados) {
      if (!borda(i + dx, j + dy)) continue;
      x.fillStyle = '#d9d4ca'; x.fillRect(rx, ry, rw, rh);
      x.fillStyle = 'rgba(60,55,50,0.55)'; // sombrinha do lado da rua
      if (dy === -1) x.fillRect(X, Y + g, T, 2); else if (dy === 1) x.fillRect(X, Y + T - g - 2, T, 2); else if (dx === -1) x.fillRect(X + g, Y, 2, T); else x.fillRect(X + T - g - 2, Y, 2, T);
    }
  }
  // v272: ESQUINAS ARREDONDADAS — o canto do quarteirão (asfalto dos dois lados e na diagonal) vira curva:
  // o asfalto (copiado do cruzamento, que é liso) entra no canto e o meio-fio acompanha a curva
  const R = T * 0.55, cv = x.canvas, pad = g + 3, bw = R + pad;
  const chaoOk = k => !asf(k) && m.chao[k] !== CH.AGUA && CH_ANDA(m.chao[k]);
  for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
    const k = j * W + i; if (!chaoOk(k)) continue;
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      if (!asf(j * W + i + sx) || !asf((j + sy) * W + i) || !asf((j + sy) * W + i + sx)) continue;
      const Px = i * T + (sx > 0 ? T : 0), Py = j * T + (sy > 0 ? T : 0), Cx = Px - sx * R, Cy = Py - sy * R;
      const bx = sx > 0 ? Cx : Px - pad, by = sy > 0 ? Cy : Py - pad;
      const TX = (i + sx) * T + (T - bw) / 2, TY = (j + sy) * T + (T - bw) / 2;
      x.save();
      x.beginPath(); x.rect(bx, by, bw, bw); x.clip();
      x.beginPath(); x.rect(bx - 2, by - 2, bw + 4, bw + 4); x.arc(Cx, Cy, R, 0, Math.PI * 2); x.clip('evenodd');
      x.drawImage(cv, TX, TY, bw, bw, bx, by, bw, bw);
      x.restore();
      const a1 = sx > 0 ? 0 : Math.PI, a2 = sy > 0 ? Math.PI / 2 : -Math.PI / 2, anti = sx * sy < 0;
      x.save(); x.lineCap = 'butt';
      x.strokeStyle = 'rgba(60,55,50,0.55)'; x.lineWidth = 2; x.beginPath(); x.arc(Cx, Cy, R + g + 1, a1, a2, anti); x.stroke();
      x.strokeStyle = '#d9d4ca'; x.lineWidth = g; x.beginPath(); x.arc(Cx, Cy, R + g / 2, a1, a2, anti); x.stroke();
      x.restore();
    }
  }
}
{
  const _renderChaoRua = renderChao;
  renderChao = function (m) {
    const novo = !m._chao; const c = _renderChaoRua.apply(this, arguments);
    if (novo && c === m._chao && !m.interior && mapaDeRua(m.id)) try { pintaRuas(c.getContext('2d'), m); } catch (e) { console.error('ruas', e); }
    return c;
  };
}
