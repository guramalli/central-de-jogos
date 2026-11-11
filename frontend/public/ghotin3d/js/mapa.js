// O mapa da Vila 1 em metros: a planta, o relevo, as estradas e a grade de colisão.
// Eixos: x para o leste, z para o sul, y para cima. A cidade murada fica no centro da ilha.

// ---- ruído com semente (simplex 2D) ----
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function semente(n) { return mulberry(n); }
const perm = new Uint8Array(512);
{ const r = mulberry(20261111); const p = new Uint8Array(256); for (let i = 0; i < 256; i++) p[i] = i; for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; const t = p[i]; p[i] = p[j]; p[j] = t; } for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; }
const G2 = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
export function simplex(x, y) {
  const F = 0.3660254037844386, G = 0.21132486540518713;
  const s = (x + y) * F; const i = Math.floor(x + s), j = Math.floor(y + s); const t = (i + j) * G;
  const x0 = x - (i - t), y0 = y - (j - t); const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
  const x1 = x0 - i1 + G, y1 = y0 - j1 + G, x2 = x0 - 1 + 2 * G, y2 = y0 - 1 + 2 * G; const ii = i & 255, jj = j & 255;
  let n = 0, tt = 0.5 - x0 * x0 - y0 * y0;
  if (tt > 0) { const g = G2[perm[ii + perm[jj]] & 7]; tt *= tt; n += tt * tt * (g[0] * x0 + g[1] * y0); }
  tt = 0.5 - x1 * x1 - y1 * y1; if (tt > 0) { const g = G2[perm[ii + i1 + perm[jj + j1]] & 7]; tt *= tt; n += tt * tt * (g[0] * x1 + g[1] * y1); }
  tt = 0.5 - x2 * x2 - y2 * y2; if (tt > 0) { const g = G2[perm[ii + 1 + perm[jj + 1]] & 7]; tt *= tt; n += tt * tt * (g[0] * x2 + g[1] * y2); }
  return 70 * n; // -1..1
}
export function fbm(x, y, oit = 4) { let a = 0.5, s = 0, f = 1; for (let k = 0; k < oit; k++) { s += a * simplex(x * f, y * f); f *= 2; a *= 0.5; } return s; }
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---- a planta ----
export const TAM = 360;            // lado do terreno (a ilha da vila no centro e a ilha vulcânica a leste)
export const CHAO = 1.2;           // altura do platô da cidade
export const CID = { x0: -34, x1: 34, z0: -30, z1: 30, esp: 3.2, alt: 6.6 };
export const PORTAO_SUL = { x: 0, z: CID.z1, larg: 5.4 };
export const PORTAO_LESTE = { x: CID.x1, z: 4, larg: 5.0 };
export const PORTAO_OESTE = { x: CID.x0, z: 4, larg: 4.4 };
export const TERRACO = { x0: -14, x1: 14, z0: -27.5, z1: -10, alt: 2.4 };          // o terraço do palácio
export const ESCADA = { x0: -4.6, x1: 4.6, z0: -10, z1: -4.6 };                      // sobe do sul (z1) para o norte (z0)
export const LAGO = { x: -56, z: 10, r: 12 };
export const MIRANTE = { x: 73, z: -6 };
export const LOBOS = { x: 52, z: 22, r: 13 };                                         // os Campos dos Cães
export const TREINO = { x0: -24, x1: -7, z0: 37, z1: 52 };
export const ROCA = { x0: 9, x1: 31, z0: 38, z1: 56 };
export const NASCER = { x: 0, z: 22 };
// a ponte de pedra: sai do tablado do mirante (xr), desce por uma rampa até x0 e cruza o mar até a ilha vulcânica (x1)
export const PONTE = { xr: 75.75, x0: 84, x1: 105.5, x2: 107.4, z: -6, larg: 4.8, y: 5.0, arco: 1.15 };
// a ilha vulcânica do Dragão: o pátio no meio, o fosso de lava em volta, a crista da cratera e a praia de areia preta
export const VULCAO = { x: 138, z: -6, R: 33, patio: 13.5, fosso: 18.5, crista: 24.5, chao: 5.0, lava: 3.9, picoAng: -1.75, picoCrista: 2.5, picoR: 10, rioAng: 0.85 };
export const DRAGAO = { x: VULCAO.x, z: VULCAO.z, esc: 8, rot: -1.05 };                  // o Dragão gigante, no centro da ilha vulcânica
export const ESTATUA = { x: 106.7, z: -16.2, alt: 10, rot: 0.81 + Math.PI, r: 5.6, y: PONTE.y };   // (com 0,81 ela dava as costas para a ponte; o Gustavo pediu para virar a frente para o lado oposto)                                       // a estátua do Imugi: num terraço redondo de pedra na entrada da ilha vulcânica, ao norte do fim da ponte, de frente para quem chega pela ponte
export const GHOTIN = { x: 45, z: 37.5, nivel: 5 };                                    // a Ghotin da Tristeza, a sudeste (para teste)

// estradas de terra (fora dos muros): listas de pontos
export const ESTRADAS = [
  { larg: 3.4, pts: [[34, 4], [40, 4.5], [47, 3], [55, 0], [63, -3], [70, -5.5]] },          // a estrada do leste até o mirante
  { larg: 2.4, pts: [[44, 4], [47, 10], [50, 16], [52, 22]] },                               // ramal dos campos dos cães
  { larg: 1.7, pts: [[52, 22], [50.5, 28], [47.5, 33]] },                                    // trilha da Ghotin
  { larg: 3.6, pts: [[0, 30], [0, 36], [1, 44], [-1, 54], [0, 64]] },                        // estrada do sul
  { larg: 2.2, pts: [[0, 40], [-6, 42], [-10, 44]] },                                        // campo de treino
  { larg: 2.2, pts: [[1, 46], [6, 47], [10, 47]] },                                          // roça
  { larg: 2.4, pts: [[-34, 4], [-40, 5], [-45, 8]] },                                        // caminho do lago
  { larg: 1.8, pts: [[-40, 5], [-44, -6], [-48, -18], [-50, -30]] },                         // trilha da floresta
];
function distSeg(px, pz, ax, az, bx, bz) { const dx = bx - ax, dz = bz - az; const l = dx * dx + dz * dz; let t = l > 0 ? ((px - ax) * dx + (pz - az) * dz) / l : 0; t = clamp(t, 0, 1); return Math.hypot(px - ax - dx * t, pz - az - dz * t); }
export function distEstrada(x, z) { let m = 1e9, lg = 2; for (const e of ESTRADAS) for (let i = 0; i < e.pts.length - 1; i++) { const d = distSeg(x, z, e.pts[i][0], e.pts[i][1], e.pts[i + 1][0], e.pts[i + 1][1]) - e.larg * 0.5; if (d < m) { m = d; lg = e.larg; } } return m; }
export function distRet(x, z, r) { const dx = Math.max(r.x0 - x, 0, x - r.x1), dz = Math.max(r.z0 - z, 0, z - r.z1); return Math.hypot(dx, dz); }
export function dentroRet(x, z, r, m = 0) { return x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m; }

function raioCosta(x, z) {
  // distância "torta" ao centro: dá a costa irregular e o cabo do mirante
  let r = Math.hypot(x, z);
  r -= 5.5 * fbm(x * 0.016 + 3.1, z * 0.016 - 1.7, 3);
  r -= 9 * Math.exp(-((x - 70) ** 2 + (z + 6) ** 2) / 150);
  r -= 4 * Math.exp(-((x + 30) ** 2 + (z - 68) ** 2) / 260);
  return r;
}
// altura do relevo natural da ilha da vila (sem construções)
function alturaIlha(x, z) {
  const rr = raioCosta(x, z);
  let h = CHAO + 0.9 * fbm(x * 0.03, z * 0.03, 4) + 0.25 * fbm(x * 0.11, z * 0.11, 2);
  h += 5.5 * Math.exp(-((x + 46) ** 2 + (z + 44) ** 2) / 520);          // os morros da floresta (noroeste)
  h += 3.0 * Math.exp(-((x - 20) ** 2 + (z + 52) ** 2) / 400);
  h += 4.2 * Math.exp(-((x - 72) ** 2 + (z + 6) ** 2) / 90);            // o cabo do mirante
  h += 1.6 * Math.exp(-((x - 60) ** 2 + (z - 34) ** 2) / 200);
  // a cidade e as áreas planas
  const dc = distRet(x, z, CID); h = lerp(CHAO, h, sstep(1.5, 12, dc));
  const dt = distRet(x, z, TREINO); h = lerp(CHAO + 0.25, h, sstep(0, 6, dt));
  const dr = distRet(x, z, ROCA); h = lerp(CHAO + 0.2, h, sstep(0, 6, dr));
  const de = distEstrada(x, z); h = lerp(h - 0.06, h, sstep(0, 1.5, de));
  // o lago
  const dl = Math.hypot(x - LAGO.x, z - LAGO.z) + 2.2 * fbm(x * 0.07, z * 0.07, 2);
  h = lerp(-1.9, h, sstep(LAGO.r * 0.45, LAGO.r + 4, dl));
  // a costa: praia e fundo do mar
  const s = sstep(84, 64, rr);
  h = lerp(-7, h, Math.pow(s, 0.85));
  if (rr > 60) h -= 0.25 * sstep(60, 70, rr);
  return h;
}
// ---- a ilha vulcânica ----
const angDif = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
// o raio "torto" (a costa e as paredes irregulares)
function raioVulcao(x, z) { const r = Math.hypot(x - VULCAO.x, z - VULCAO.z); return r + fbm(x * 0.045 + 11.3, z * 0.045 - 4.1, 3) * lerp(0.6, 3.4, sstep(9, 28, r)); }
// a altura da crista da cratera em cada direção: alta ao norte (o pico com a boca), baixa a sudeste (de onde a câmera do jogo olha)
const picoVulcao = (ang) => Math.exp(-(angDif(ang, VULCAO.picoAng) ** 2) / 0.5);
function cristaVulcao(x, z, ang) {
  const V = VULCAO; const pico = picoVulcao(ang), frente = Math.exp(-(angDif(ang, 0.95) ** 2) / 1.3);
  const serra = 1 - Math.min(1, Math.abs(fbm(x * 0.075 + 40, z * 0.075 + 9, 3)) * 1.7);
  return V.chao + 5.0 + 12 * pico - 2.4 * frente + 3.0 * serra;
}
// o relevo da ilha sem os canais de lava
function vulcaoBase(x, z) {
  const V = VULCAO, dx = x - V.x, dz = z - V.z; const r = Math.hypot(dx, dz); if (r > V.R + 27) return -7;
  const ang = Math.atan2(dz, dx), pico = picoVulcao(ang); const rc = V.crista + V.picoCrista * pico, R = V.R + V.picoR * pico;   // do lado do pico a ilha é mais larga: um cone, não um muro
  const n2 = fbm(x * 0.17 - 7, z * 0.17 + 2.3, 3); const ro = raioVulcao(x, z); const crista = cristaVulcao(x, z, ang) + 1.0 * n2;
  let h;
  if (ro < rc) h = lerp(V.lava - 1.1, crista, Math.pow(sstep(V.fosso - 0.5, rc, ro), 0.72));                  // o fosso e a parede de dentro
  else h = lerp(crista, 0.55, Math.pow(sstep(rc, R - 2.5, ro), 0.8));                                           // a encosta de fora
  h += 0.55 * n2 * sstep(V.fosso + 1, rc, ro) * (1 - sstep(R - 5, R - 2, ro));
  h = lerp(h, -7, sstep(R - 1, R + 9, ro));                                                                      // a praia e o fundo do mar
  h = lerp(h, V.chao + 0.1 * n2, 1 - sstep(V.patio - 0.9, V.patio + 0.4, ro));                                   // o pátio do Dragão
  // o corredor da entrada, a oeste: corta a crista e cruza o fosso até o pátio
  if (dx < -(V.patio - 2.5)) { const e = (1 - sstep(2.9, 5.8, Math.abs(dz) + 0.6 * n2)) * (1 - sstep(V.R - 2.4, V.R - 0.8, -dx)); h = lerp(h, V.chao + 0.08 * n2, e); }
  return h;
}
// os canais de lava: listas de pontos com a altura da lava em cada um
let _veios = null;
export function vulcaoVeios() {
  if (_veios) return _veios; const V = VULCAO; const L = []; const cp = V.crista + V.picoCrista, Rp = V.R + V.picoR;   // a crista e a costa do lado do pico
  const ponto = (ang, t) => [V.x + Math.cos(ang) * t, V.z + Math.sin(ang) * t];
  // o rio: sai do fosso por uma garganta na crista de sudeste e desce até o mar
  { const pts = []; let y = V.lava + 0.02; for (let t = V.fosso - 2; t <= V.R + 3.01; t += 1.25) { const [x, z] = ponto(V.rioAng + 0.10 * Math.sin(t * 0.42), t); if (t > V.fosso + 0.5) y = Math.max(0.06, Math.min(y - 0.012, vulcaoBase(x, z) - 0.4)); pts.push({ x, z, y }); } L.push({ nome: 'rio', larg: 3.0, prof: 0.5, pts }); }
  // a boca do pico e a cascata que escorre por dentro da cratera até o fosso
  { const pts = []; let y = 1e9; for (let t = cp + 0.6; t >= V.fosso - 1.5; t -= 1.0) { const [x, z] = ponto(V.picoAng + 0.07 * Math.sin((t - cp - 0.6) * 0.7), t); y = Math.max(V.lava + 0.02, Math.min(y - 0.01, vulcaoBase(x, z) - (t > cp - 1.2 ? 1.5 : 0.35))); pts.push({ x, z, y }); } L.push({ nome: 'cascata', larg: 2.3, prof: 0.45, pts, boca: 2.6 }); }
  // a língua de lava que escorre por fora do pico até o mar, a noroeste
  { const pts = []; let y = 1e9; for (let t = cp + 0.6; t <= Rp + 3.01; t += 1.25) { const [x, z] = ponto(V.picoAng - 0.22 * sstep(cp, cp + 6, t) - 0.12 * sstep(cp, Rp, t), t); y = Math.max(0.06, Math.min(y - 0.012, vulcaoBase(x, z) - (t < cp + 1.2 ? 1.5 : 0.35))); pts.push({ x, z, y }); } L.push({ nome: 'lingua', larg: 2.1, prof: 0.42, pts }); }
  _veios = L; return L;
}
// distância ao canal e a altura da lava no ponto mais perto
function distVeio(v, x, z) {
  let md = 1e9, my = 0; const p = v.pts;
  for (let i = 0; i < p.length - 1; i++) { const ax = p[i].x, az = p[i].z, bx = p[i + 1].x - ax, bz = p[i + 1].z - az; const l = bx * bx + bz * bz; let t = l > 0 ? ((x - ax) * bx + (z - az) * bz) / l : 0; t = clamp(t, 0, 1); const d = Math.hypot(x - ax - bx * t, z - az - bz * t); if (d < md) { md = d; my = p[i].y + (p[i + 1].y - p[i].y) * t; } }
  return [md, my];
}
export function alturaVulcao(x, z) {
  let h = vulcaoBase(x, z); if (h <= -6.9) return h;
  { const E = ESTATUA, d = Math.hypot(x - E.x, z - E.z); if (d < E.r + 3) h = Math.min(h, lerp(E.y - 0.9, h, sstep(E.r + 0.6, E.r + 3, d))); }   // o relevo não fura o terraço da estátua
  const n2 = fbm(x * 0.31 + 3, z * 0.31 - 8, 2);
  for (const v of vulcaoVeios()) { const [d, y] = distVeio(v, x, z); const lg = v.larg * 0.5; if (d < lg + 2.4) h = Math.min(h, lerp(y - v.prof, h, sstep(lg - 0.3, lg + 2.0, d + 0.35 * n2)));
    if (v.boca) { const b = v.pts[0]; const db = Math.hypot(x - b.x, z - b.z); if (db < v.boca + 2.2) h = Math.min(h, lerp(b.y - 0.6, h, sstep(v.boca - 0.5, v.boca + 2.0, db + 0.3 * n2))); } }
  return h;
}
// para pintar o chão: [quanto é basalto, quanto está quente] (0 a 1)
export function vulcaoInfo(x, z, h) {
  const V = VULCAO; const r = Math.hypot(x - V.x, z - V.z); if (r > V.R + 26) return [0, 0];
  const ro = raioVulcao(x, z); const R = V.R + V.picoR * picoVulcao(Math.atan2(z - V.z, x - V.x)); const bas = 1 - sstep(R + 3.5, R + 9, ro); let calor = 0;
  if (ro < V.crista) calor = (1 - sstep(0.1, 1.7, h - V.lava)) * sstep(V.patio - 5, V.patio - 0.5, ro);
  for (const v of vulcaoVeios()) { const [d, y] = distVeio(v, x, z); const lg = v.larg * 0.5; if (d < lg + 3) calor = Math.max(calor, (1 - sstep(lg - 0.2, lg + 2.6, d)) * (1 - sstep(0.4, 2.6, h - y)));
    if (v.boca) { const b = v.pts[0]; calor = Math.max(calor, 1 - sstep(v.boca - 0.5, v.boca + 3.2, Math.hypot(x - b.x, z - b.z))); } }
  return [bas, clamp(calor, 0, 1)];
}
// onde se pisa na ilha vulcânica: o pátio e o corredor da entrada
export function vulcaoAndavel(x, z) {
  const V = VULCAO, dx = x - V.x, dz = z - V.z; const r = Math.hypot(dx, dz);
  if (r < V.patio - 1.5) return true; return dx < -(V.patio - 3) && dx > -(V.R - 1.2) && Math.abs(dz) < 2.3;
}
export function naIlhaVulcanica(x, z) { const d = Math.hypot(x - VULCAO.x, z - VULCAO.z); return d < VULCAO.R + 8 || (d < VULCAO.R + 20 && z < VULCAO.z - 10); }
// altura do relevo natural (sem construções): a ilha da vila e a ilha vulcânica
export function alturaTerreno(x, z) { const h = alturaIlha(x, z); if (x < 84) return h; return Math.max(h, alturaVulcao(x, z)); }
// a altura do tabuleiro da ponte (e da rampa que desce do mirante)
let _yMirante = 0;
export function alturaPonte(x) {
  const B = PONTE; if (!_yMirante) _yMirante = alturaIlha(MIRANTE.x, MIRANTE.z) + 0.35;
  if (x < B.x0) return lerp(_yMirante, B.y, clamp((x - B.xr) / (B.x0 - B.xr), 0, 1));
  if (x > B.x1) return B.y; const u = (x - (B.x0 + B.x1) / 2) / ((B.x1 - B.x0) / 2); return B.y + B.arco * (1 - u * u);
}
export function distLago(x, z) { return Math.hypot(x - LAGO.x, z - LAGO.z) + 2.2 * fbm(x * 0.07, z * 0.07, 2); }
export function costa(x, z) { return raioCosta(x, z); }

export const plataformas = [];   // tablados onde se pisa: {x0,x1,z0,z1,y} ou, com rampa, {x0,x1,z0,z1,f(x,z)}
// altura onde se pisa (com o terraço e a escadaria do palácio)
export function alturaPiso(x, z) {
  if (dentroRet(x, z, TERRACO)) return CHAO + TERRACO.alt;
  if (dentroRet(x, z, ESCADA)) return CHAO + TERRACO.alt * clamp((ESCADA.z1 - z) / (ESCADA.z1 - ESCADA.z0), 0, 1);
  for (const p of plataformas) if (x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1) { const y = p.f ? p.f(x, z) : p.y; if (y != null) return y; }
  if (dentroRet(x, z, CID)) return CHAO + 0.03;
  return alturaTerreno(x, z);
}

// ---- colisão: grade de 0,5 m ----
export const CEL = 0.5, GN = Math.round(TAM / CEL);
export const grade = new Uint8Array(GN * GN);
const gi = (v) => Math.floor((v + TAM / 2) / CEL);
export function bloquearRet(x0, z0, x1, z1, m = 0.25) { const a = Math.max(0, gi(x0 - m)), b = Math.min(GN - 1, gi(x1 + m)), c = Math.max(0, gi(z0 - m)), d = Math.min(GN - 1, gi(z1 + m)); for (let j = c; j <= d; j++) for (let i = a; i <= b; i++) grade[j * GN + i] = 1; }
export function liberarRet(x0, z0, x1, z1) { const a = Math.max(0, gi(x0)), b = Math.min(GN - 1, gi(x1)), c = Math.max(0, gi(z0)), d = Math.min(GN - 1, gi(z1)); for (let j = c; j <= d; j++) for (let i = a; i <= b; i++) grade[j * GN + i] = 0; }
export function bloquearCirc(x, z, r) { const a = gi(x - r), b = gi(x + r), c = gi(z - r), d = gi(z + r); for (let j = c; j <= d; j++) for (let i = a; i <= b; i++) { if (i < 0 || j < 0 || i >= GN || j >= GN) continue; const cx = (i + 0.5) * CEL - TAM / 2, cz = (j + 0.5) * CEL - TAM / 2; if (Math.hypot(cx - x, cz - z) <= r + 0.2) grade[j * GN + i] = 1; } }
export function bloqueado(x, z) { const i = gi(x), j = gi(z); if (i < 0 || j < 0 || i >= GN || j >= GN) return true; return grade[j * GN + i] === 1; }
export function marcarAgua(alt = alturaTerreno) { for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) { const x = (i + 0.5) * CEL - TAM / 2, z = (j + 0.5) * CEL - TAM / 2; if (alt(x, z) < -0.25 || (x > 96 && naIlhaVulcanica(x, z) && !vulcaoAndavel(x, z))) grade[j * GN + i] = 1; } }
export function linhaLivre(ax, az, bx, bz) { const d = Math.hypot(bx - ax, bz - az); const n = Math.ceil(d / (CEL * 0.5)); for (let k = 0; k <= n; k++) { const t = n ? k / n : 0; if (bloqueado(ax + (bx - ax) * t, az + (bz - az) * t)) return false; } return true; }

const _g = new Float32Array(GN * GN), _de = new Int32Array(GN * GN), _fech = new Uint8Array(GN * GN);
// A*: devolve a lista de pontos do caminho (já alisada) ou null
export function caminho(ax, az, bx, bz) {
  if (linhaLivre(ax, az, bx, bz)) return [[bx, bz]];
  let si = gi(ax), sj = gi(az), ti = gi(bx), tj = gi(bz);
  const livreProx = (i, j) => { if (!grade[j * GN + i]) return [i, j]; for (let r = 1; r < 14; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < GN && b < GN && !grade[b * GN + a]) return [a, b]; } return null; };
  const s = livreProx(si, sj), t = livreProx(ti, tj); if (!s || !t) return null;[si, sj] = s;[ti, tj] = t;
  const g = _g.fill(1e9), de = _de.fill(-1), fech = _fech.fill(0);
  const heap = []; const push = (n, f) => { heap.push([f, n]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break;[heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0]; const l = heap.pop(); if (heap.length) { heap[0] = l; let i = 0; for (;;) { let a = 2 * i + 1, b = a + 1, m = i; if (a < heap.length && heap[a][0] < heap[m][0]) m = a; if (b < heap.length && heap[b][0] < heap[m][0]) m = b; if (m === i) break;[heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const hh = (i, j) => { const dx = Math.abs(i - ti), dy = Math.abs(j - tj); return (dx + dy) + (1.4142 - 2) * Math.min(dx, dy); };
  const ini = sj * GN + si, fim = tj * GN + ti; g[ini] = 0; push(ini, hh(si, sj)); let achou = false, cont = 0;
  while (heap.length && cont++ < 120000) {
    const [, n] = pop(); if (fech[n]) continue; fech[n] = 1; if (n === fim) { achou = true; break; }
    const i = n % GN, j = (n / GN) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= GN || b >= GN) continue; const m = b * GN + a; if (grade[m] || fech[m]) continue;
      if (di && dj && (grade[j * GN + a] || grade[b * GN + i])) continue;
      const c = g[n] + (di && dj ? 1.4142 : 1); if (c < g[m]) { g[m] = c; de[m] = n; push(m, c + hh(a, b)); }
    }
  }
  if (!achou) return null;
  const pts = []; for (let n = fim; n !== -1; n = de[n]) pts.push([(n % GN + 0.5) * CEL - TAM / 2, (((n / GN) | 0) + 0.5) * CEL - TAM / 2]); pts.reverse();
  if (!bloqueado(bx, bz)) pts.push([bx, bz]);
  // alisa: corta os pontos que dá para pular em linha reta
  const out = []; let cx = ax, cz = az, k = 0;
  while (k < pts.length) { let far = k; for (let m = Math.min(pts.length - 1, k + 60); m > k; m--) { if (linhaLivre(cx, cz, pts[m][0], pts[m][1])) { far = m; break; } } out.push(pts[far]); cx = pts[far][0]; cz = pts[far][1]; k = far + 1; }
  return out;
}
