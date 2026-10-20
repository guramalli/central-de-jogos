// Terra vista do alto (eras altas): disco com superfície em pixel art gerada por código — oceano em 3 tons, costa,
// florestas, desertos, montanhas e gelo —, nuvens numa camada que corre mais rápido, perspectiva (a superfície se
// comprime perto do horizonte), névoa azul na borda, um aro claro de 1–2 px e o brilho da atmosfera para fora.
// Tudo pintado pixel a pixel num canvas à parte (ImageData), refeito algumas vezes por segundo; a cena só copia.
import { hash } from './canvas.js';

const TW = 1024, TH = 256; // textura da superfície (repete na horizontal)
let ground = null, clouds = null, built = 0; // linhas da textura já geradas

// ruído de valor periódico em x (período TW) com fbm de 5 oitavas
function fbm(x, y, seed) {
  let v = 0, a = 0.5, tot = 0;
  for (let s = 128; s >= 8; s >>= 1) {
    const gw = TW / s, gx = x / s, gy = y / s, i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const h = (ii, jj) => hash(((ii % gw) + gw) % gw + seed * 977 + s * 13, jj + seed * 131);
    const top = h(i, j) + (h(i + 1, j) - h(i, j)) * ux, bot = h(i, j + 1) + (h(i + 1, j + 1) - h(i, j + 1)) * ux;
    v += a * (top + (bot - top) * uy); tot += a; a *= 0.5;
  }
  return v / tot;
}

const C = { // paleta (luz de cima, 3–5 tons por material)
  deep: [22, 62, 122], ocean: [30, 82, 150], shallow: [48, 116, 184], coast: [92, 160, 206],
  sand: [214, 196, 140], green: [78, 138, 72], forest: [50, 104, 60], dry: [150, 150, 84], desert: [204, 168, 104],
  rock: [128, 112, 90], snow: [236, 242, 246], ice: [214, 230, 240],
  cloud: [246, 249, 252], cloud2: [200, 216, 234],
};

// gera a textura aos poucos (~1,8 ms por linha): prepEarth(2) por quadro desde 8 km, para não travar quando a Terra aparece
export function prepEarth(rows) {
  if (built >= TH) return true;
  if (!ground) { ground = new Uint8ClampedArray(TW * TH * 3); clouds = new Uint8ClampedArray(TW * TH * 2); }
  const end = Math.min(TH, built + rows);
  for (let y = built; y < end; y++) for (let x = 0; x < TW; x++) {
    const e = fbm(x, y, 1), m = fbm(x, y, 2), pole = Math.abs(y / TH - 0.5) * 2; // "latitude" só para o gelo raro
    let c;
    if (e < 0.47) c = C.deep; else if (e < 0.53) c = C.ocean; else if (e < 0.565) c = C.shallow; else if (e < 0.575) c = C.coast;
    else if (e < 0.585) c = C.sand;
    else if (pole > 0.9 && e > 0.6) c = C.ice;
    else if (e > 0.74) c = C.snow; else if (e > 0.68) c = C.rock;
    else if (m < 0.38) c = C.desert; else if (m < 0.46) c = C.dry; else if (m > 0.56) c = C.forest; else c = C.green;
    const k = (y * TW + x) * 3; ground[k] = c[0]; ground[k + 1] = c[1]; ground[k + 2] = c[2];
    const n = fbm(x * 1.6 % TW, y * 1.3, 3) * 0.7 + fbm(x, y, 4) * 0.3; // nuvens em faixas, 2 tons
    const q = (y * TW + x) * 2;
    clouds[q] = n > 0.61 ? 2 : n > 0.565 ? 1 : 0;
  }
  built = end;
  return built >= TH;
}

let buf = null, bufCtx = null, img = null, lastT = -1, lastKey = '';

// desenha a Terra: k = quanto do disco aparece acima do pé da tela; scroll em s (V.t)
export function drawEarth(ctx, W, H, k, t, leve) {
  if (!prepEarth(4)) return; // ainda gerando (só acontece se a câmera pular direto para o alto)
  const Rr = 1100, cx = W / 2, cy = H + Rr - k, glow = 18, y0 = Math.max(0, Math.floor(cy - Rr - glow)), bh = H - y0;
  if (bh <= 0) return;
  const key = W + ':' + Math.round(k);
  const every = leve ? 1 : 0.2;
  if (!buf || buf.width !== W || buf.height !== bh) {
    buf = document.createElement('canvas'); buf.width = W; buf.height = bh; bufCtx = buf.getContext('2d');
    img = bufCtx.createImageData(W, bh); lastKey = '';
  }
  if (key !== lastKey || t - lastT > every || t < lastT) {
    lastKey = key; lastT = t;
    paint(W, bh, y0, cx, cy, Rr, k, glow, t);
    bufCtx.putImageData(img, 0, 0);
  }
  ctx.drawImage(buf, 0, y0);
}

function paint(W, bh, y0, cx, cy, Rr, k, glow, t) {
  const d = img.data, depth = Math.max(40, k), sg = t * 2.2, sc = t * 4.5; // superfície e nuvens correm devagar
  d.fill(0);
  for (let yy = 0; yy < bh; yy++) {
    const y = yy + y0, dy = y - cy;
    for (let x = 0; x < W; x++) {
      const dx = x - cx, rr = Math.sqrt(dx * dx + dy * dy), o = (yy * W + x) * 4;
      if (rr > Rr + glow) continue;
      if (rr > Rr + 1) { // brilho da atmosfera para fora, em degraus (pixel art)
        const a = Math.pow(1 - (rr - Rr - 1) / (glow - 1), 2);
        const step = Math.ceil(a * 4) / 4;
        d[o] = 120; d[o + 1] = 186; d[o + 2] = 255; d[o + 3] = step * 110; continue;
      }
      if (rr > Rr - 1) { d[o] = 196; d[o + 1] = 232; d[o + 2] = 255; d[o + 3] = 255; continue; } // aro claro
      // posição na superfície: profundidade a partir da borda (perspectiva) e longitude pelo ângulo
      const tt = Math.min(1, (Rr - rr) / depth), v = Math.min(TH - 1, Math.floor(Math.sqrt(tt) * (TH - 1)));
      const lon = Math.asin(Math.max(-1, Math.min(1, dx / rr))) * Rr * (0.55 + 0.45 * tt);
      const ug = ((Math.floor(lon + sg) % TW) + TW) % TW, uc = ((Math.floor(lon * 1.05 + sc) % TW) + TW) % TW;
      const g = (v * TW + ug) * 3;
      let R = ground[g], G = ground[g + 1], B = ground[g + 2];
      const cl = clouds[(v * TW + uc) * 2];
      if (cl === 2) { R = C.cloud[0]; G = C.cloud[1]; B = C.cloud[2]; }
      else if (cl === 1) { R = (R + C.cloud2[0]) >> 1; G = (G + C.cloud2[1]) >> 1; B = (B + C.cloud2[2]) >> 1; }
      // névoa azul perto da borda, em 3 degraus
      const hz = tt < 0.06 ? 0.6 : tt < 0.14 ? 0.38 : tt < 0.26 ? 0.18 : 0;
      if (hz) { R += (150 - R) * hz; G += (205 - G) * hz; B += (255 - B) * hz; }
      d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = 255;
    }
  }
}
