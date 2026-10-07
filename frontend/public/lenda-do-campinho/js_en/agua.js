/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ÁGUA
   - Fundo liso (sem quadriculado): clarinho perto da areia, azul mais
     fundo longe dela, com manchas suaves (pintaAgua, chamado no renderChao);
   - Brilho leve correndo na superfície;
   - Na praia: a onda ENTRA e SAI da areia devagar, com espuma na frente.
   Carregar DEPOIS de clima.js e arenas.js (envolve desenhaChaoClima).
   ============================================================ */
// por mapa: distância de cada quadro de água até a terra e quais quadros são "beira de praia"
function infoAgua(m) {
  if (m._agua) return m._agua;
  const W = m.w, H = m.h, N = W * H; const dist = new Int16Array(N).fill(-1); const fila = [];
  const agua = i => m.chao[i] === CH.AGUA;
  const areia = t => t === CH.AREIA || (CH.AREIA_MOLHADA != null && t === CH.AREIA_MOLHADA);
  const costa = new Uint8Array(N); let tem = false;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (!agua(i)) continue; tem = true;
    let terra = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const t = m.chao[ny * W + nx]; if (t !== CH.AGUA) { terra = true; if (areia(t)) costa[i] = 1; }
    }
    if (terra) { dist[i] = 0; fila.push(i); }
  }
  for (let k = 0; k < fila.length; k++) { // distância até a terra (em quadros)
    const i = fila[k], x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx; if (agua(j) && dist[j] < 0) { dist[j] = dist[i] + 1; fila.push(j); }
    }
  }
  return (m._agua = { tem, dist, costa });
}

// fundo da água: degradê suave pela distância da terra + manchas claras e escuras
function pintaAgua(x, m, corpo) {
  const inf = infoAgua(m); const W = m.w, H = m.h;
  const raso = [118, 218, 222], fundo = [38, 140, 206];
  const bx = mkCanvas(W, H), b = bx.getContext('2d'); const img = b.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const d = inf.dist[i] < 0 ? 0 : inf.dist[i]; const k = Math.min(1, d / 5);
    const c = raso.map((v, n) => Math.round(v + (fundo[n] - v) * k));
    img.data.set([c[0], c[1], c[2], 255], i * 4);
  }
  b.putImageData(img, 0, 0);
  x.save(); x.clip(corpo);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(bx, 0, 0, W * T, H * T); // ampliado com suavização = degradê liso
  const r = mulberry(W * 17 + H * 3 + 9);
  for (let k = 0; k < W * H * 0.35; k++) { // manchas bem suaves (nada de quadrado)
    const px = r() * W * T, py = r() * H * T, rx = T * (0.4 + r() * 1.1), ry = rx * (0.35 + r() * 0.3);
    x.fillStyle = r() < 0.55 ? 'rgba(255,255,255,0.05)' : 'rgba(10,60,120,0.06)';
    x.beginPath(); x.ellipse(px, py, rx, ry, 0, 0, 7); x.fill();
  }
  x.restore();
}

// a cada quadro: brilho correndo + ondas que entram e saem da areia
let ONDA_CV = null;
function desenhaOndas(ctx, sx, sy, sw, sh) {
  const m = G.mapa; if (!m || m.interior) return;
  const inf = infoAgua(m); if (!inf.tem) return;
  const x0 = Math.max(0, Math.floor(sx / T) - 1), y0 = Math.max(0, Math.floor(sy / T) - 1), x1 = Math.min(m.w, Math.ceil((sx + sw) / T) + 1), y1 = Math.min(m.h, Math.ceil((sy + sh) / T) + 1);
  const vis = [], costa = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = y * m.w + x; if (m.chao[i] !== CH.AGUA) continue; vis.push([x, y]); if (inf.costa[i]) costa.push([x, y]); }
  if (!vis.length) return;
  const t = G.agora / 1000;
  // 1) brilho: linhas onduladas bem claras, andando devagar
  ctx.save(); ctx.clip(caminhoTiles(vis, 0, 0));
  ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let yy = y0 * T + 12; yy < y1 * T; yy += T * 0.55) {
    ctx.strokeStyle = `rgba(255,255,255,${0.07 + 0.05 * Math.sin(yy * 0.05 + t)})`;
    ctx.beginPath();
    for (let xx = x0 * T; xx <= x1 * T; xx += 14) { const yv = yy + Math.sin(xx / 46 + t * 1.1 + yy * 0.09) * 5; if (xx === x0 * T) ctx.moveTo(xx, yv); else ctx.lineTo(xx, yv); }
    ctx.stroke();
  }
  ctx.restore();
  if (!costa.length) return;
  // 2) a onda na areia: entra e sai (~6 s), um pouco atrasada ao longo da praia
  const cv = ctx.canvas;
  if (!ONDA_CV || ONDA_CV.width !== cv.width || ONDA_CV.height !== cv.height) ONDA_CV = mkCanvas(cv.width, cv.height);
  const o = ONDA_CV.getContext('2d');
  o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, cv.width, cv.height); o.setTransform(ctx.getTransform());
  const e0 = 0.16 * T + 3;
  const quanto = (i, j) => (1 - Math.cos(t * 2 * Math.PI / 6 - (i + j) * 0.22)) / 2; // 0 = recuada, 1 = mais pra dentro da areia
  const forma = extra => { const p = new Path2D(); for (const [i, j] of costa) { const g = Math.max(0, e0 + quanto(i, j) * T * 0.3 + extra); p.roundRect(i * T - g, j * T - g, T + 2 * g, T + 2 * g, 0.45 * T + g * 0.4); } return p; };
  o.fillStyle = 'rgba(255,255,255,0.85)'; o.fill(forma(0));             // espuma na frente da onda
  o.globalCompositeOperation = 'destination-out'; o.fillStyle = '#000'; o.fill(forma(-4)); // (apagar precisa de cor opaca)
  o.globalCompositeOperation = 'source-over'; o.fillStyle = 'rgba(120,212,228,0.42)'; o.fill(forma(-4)); // água rasinha por cima da areia
  o.globalCompositeOperation = 'destination-out'; o.fillStyle = '#000'; o.fill(caminhoTiles(vis, 0.16 * T, 0.45 * T)); // só aparece na areia
  o.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(ONDA_CV, 0, 0); ctx.restore();
}
(function () {
  const _dccAgua = typeof desenhaChaoClima === 'function' ? desenhaChaoClima : null;
  desenhaChaoClima = function (ctx, sx, sy, sw, sh, ...r) {
    try { desenhaOndas(ctx, sx, sy, sw, sh); } catch (e) { }
    if (_dccAgua) return _dccAgua(ctx, sx, sy, sw, sh, ...r);
  };
  // mapas já desenhados antes deste arquivo: refaz o chão com a água nova
  for (const id in (typeof MAPAS !== 'undefined' ? MAPAS : {})) { const m = MAPAS[id]; if (m) { delete m._chao; delete m._agua; } }
})();
