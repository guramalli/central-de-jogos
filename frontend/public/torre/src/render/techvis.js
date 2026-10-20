// O que cada compra sem visual próprio mostra na obra (Obra Viva). Tudo derivado de S.lv, sem mexer na simulação;
// respeita o nível de detalhe (cam.z) para não pesar com a câmera longe.
// - pátio (frente do térreo): peças do PixelLab (assets/pecas) e placas;
// - poços dos elevadores: cabos, faixas, cabines, esteira, tubo, cabo até o espaço;
// - fundação: estacas, boias, contrafortes;
// - fachada: aluguel acende mais janelas (em tower.js), toldos das lojas, faixa do leilão, luzes de festa;
// - topo: holofotes do turno da noite, impressora 3D, betoneira, pêndulo, núcleo de grafeno.
import { FH, TW, TL, SLAB } from '../data/constants.js';
import { S } from '../sim/state.js';
import { R, T, hash } from './canvas.js';
import { cam, worldY } from './camera.js';
import { V } from './view.js';
import { blit } from './sprites.js';
import { art } from './assets.js';

const lv = k => S.lv[k] || 0;
// peças do PixelLab (~36×30) em dobro, na escala dos operários
const prop = (name, x, y, k = 2) => { const im = art('pecas/' + name); if (im) blit(im, x, y, im.width / 2, im.height, false, k); return im; };

// ---------- pátio (à direita da olaria e da usina, atrás dos caminhões): as peças entram em fila, sem buracos ----------
const YARD = [ // [chave(s), largura, desenho]
  [['projeto'], 88, x => prop('mesa-plantas', x, 0)],
  [['calculo'], 88, x => prop('escritorio', x, 0)],
  [['argamassa', 'usinaTopo'], 80, x => prop('betoneira-peq', x, 0)],
  [['siderurgica'], 88, x => prop('vigas', x, 0)],
  [['parafusada'], 80, x => prop('viga', x, 0)],
  [['cabos'], 72, x => prop('carretel', x, 0)],
  [['fabrica', 'modulosProntos'], 80, x => prop('compressor', x, 0)],
  [['turnoNoite'], 68, x => prop('torre-luz', x, 0)],
  [['fundacaoBarata'], 72, x => prop('gerador', x, 0)],
  [['mutirao'], 60, x => prop('banheiro', x, 0)],
  [['prefab'], 46, x => { for (let k = 0; k < 3; k++) { R(x - 20, 4 + k * 9, 40, 8, '#b8bcc4'); R(x - 20, 4 + k * 9, 40, 1, '#e2e5ea'); R(x - 14, 6 + k * 9, 8, 4, '#5f87a8'); R(x + 4, 6 + k * 9, 8, 4, '#5f87a8'); } R(x - 22, 0, 44, 4, '#7a5a3a'); }],
  [['reciclagem'], 160, x => { prop('sucata', x - 40, 0); prop('cacamba-entulho', x + 40, 0); }],
  [['agencia'], 104, x => { // ônibus de excursão estacionado
    const c = '#e8a33a'; x -= 48; R(x, 4, 96, 30, c); R(x, 30, 96, 4, '#c47f17'); for (let k = 0; k < 6; k++) R(x + 6 + k * 14, 18, 10, 9, '#9fd0f0');
    R(x + 10, 0, 14, 6, '#20242f'); R(x + 74, 0, 14, 6, '#20242f'); T('EXCURSÃO', x + 48, 11, 6, '#20242f', 'center');
  }],
  [['asteroides'], 30, x => { // cápsula de carga que desce do céu a cada ~14 s
    const q = (V.t / 14) % 1, cy = q < 0.5 ? 700 * (1 - q / 0.5) : 0;
    R(x - 9, cy, 18, 22, '#9aa0ab'); R(x - 9, cy + 18, 18, 4, '#5a5f6a'); R(x - 6, cy + 22, 12, 3, '#3b4152');
    if (q < 0.5) R(x - 5, cy - 8 - (V.t * 20 % 6), 10, 8, '#ffb43a');
  }],
];
export function techYard() {
  if (cam.z < 0.3) return;
  let x = 620;
  for (const [ks, w, draw] of YARD) if (ks.some(lv)) { draw(x + w / 2); x += w; }
  if (lv('imobiliaria') || lv('corretores')) { // placa da imobiliária entre o trilho do panorâmico e a bilheteria
    const px = -250; R(px - 2, 0, 4, 40, '#5a5f6a'); R(px - 30, 22, 60, 20, '#1f5a3a'); R(px - 28, 24, 56, 16, '#f4f1e6');
    T('J. SANTOS', px, 36, 6, '#20242f', 'center'); T(lv('corretores') ? 'CORRETORES' : 'IMÓVEIS', px, 29, 7, '#1f5a3a', 'center');
  }
}

// ---------- poço do elevador i (x0 = borda esquerda, cy = altura da cabine, top = topo do poço) ----------
export function techShaft(i, x0, cy, top, yLo, yHi) {
  if (cam.z < 0.25) return;
  if (lv('cabos')) R(x0 + 13, cy + 32, 4, Math.max(0, top - cy - 32), '#c7ccd6');                 // cabo de aço mais grosso
  if (lv('expresso')) for (let k = 0; k < 3; k++) R(x0 + 4 + k * 8, cy + 30, 5, 3, k % 2 ? '#20242f' : '#ffd23a'); // faixa do expresso
  if (lv('pressurizada')) { R(x0 + 1, cy - 2, 28, 2, '#5fb8ff'); R(x0 + 1, cy + 33, 28, 2, '#5fb8ff'); R(x0 + 1, cy - 2, 2, 37, 'rgba(95,184,255,.6)'); R(x0 + 27, cy - 2, 2, 37, 'rgba(95,184,255,.6)'); } // cabine selada
  if (lv('gaiolaDupla')) { R(x0 + 3, cy + 34, 24, 14, '#c9a227'); R(x0 + 6, cy + 36, 18, 10, '#262a35'); }  // segunda gaiola em cima
  if (lv('contrapeso')) { const wy = Math.max(0, top - cy - 40); R(x0 + 24, wy, 5, 18, '#5a5f6a'); R(x0 + 24, wy, 5, 2, '#9aa0ab'); }
  if (lv('linear') && i === 0) for (let y = Math.max(0, Math.floor(yLo / 48) * 48); y < Math.min(top, yHi); y += 48) R(x0 - 1, y, 32, 2, 'rgba(176,120,255,.55)');
}
// colunas extras ao lado do último poço (esteira, tubo pneumático, cabo espacial)
export function techShaftsExtra(xEnd, top, topWP, yLo, yHi) {
  if (cam.z < 0.25) return;
  let x = xEnd + 6;
  const lo = Math.max(0, yLo), hi = Math.min(top, yHi);
  if (lv('esteira') && hi > lo) {
    R(x, lo, 10, hi - lo, '#3b4152'); R(x + 1, lo, 1, hi - lo, '#6c727e');
    for (let y = Math.floor(lo / 30) * 30 + ((V.t * 40) % 30); y < hi; y += 30) R(x + 2, y, 6, 6, '#b5523b');
    x += 14;
  }
  if (lv('tuboPneumatico') && hi > lo) {
    R(x, lo, 10, hi - lo, 'rgba(200,235,255,.35)'); R(x, lo, 1, hi - lo, 'rgba(255,255,255,.6)'); R(x + 9, lo, 1, hi - lo, 'rgba(255,255,255,.4)');
    const cy = (V.t * 260) % Math.max(1, topWP); if (cy > lo && cy < hi) R(x + 2, cy, 6, 10, '#f2b630');
    x += 14;
  }
  if (lv('elevadorEspacial') || lv('ancoraOrbital')) { // cabo do topo da torre subindo até sair da tela, com uma cápsula
    const c = lv('ancoraOrbital') ? '#ffd23a' : '#9fd8ef', up = Math.max(top, worldY(0) + 50);
    R(x + 3, top, 2, up - top, c); const py = top + ((V.t * 120) % Math.max(1, up - top)); R(x, py, 8, 12, '#d0d5de');
  }
}

// ---------- fundação ----------
export function techFoundation(depth) {
  const es = Math.min(3, lv('estacas')); // estacas profundas: mais compridas a cada nível
  if (es) for (let k = 0; k < 4; k++) { const x = TL + 36 + k * 56; R(x, -depth - 30 - 50 * es, 5, 50 * es, '#8f96a3'); R(x, -depth - 34 - 50 * es, 5, 4, '#5a5f6a'); }
  if (lv('flutuante')) for (let k = 0; k < 5; k++) { const x = TL + 6 + k * 56; R(x, -depth - 14, 16, 12, '#ee7a1c'); R(x + 2, -depth - 12, 12, 3, '#ffb070'); }
  if (lv('contrafortes')) for (const d of [-1, 1]) for (let k = 0; k < 12; k++) { // apoio em cunha encostado na parede
    const w = 6 + (11 - k) * 4, x = d < 0 ? TL - w : TL + TW;
    R(x, k * 10, w, 10, '#9aa0ab'); R(x, k * 10 + 9, w, 1, '#c7ccd6'); R(d < 0 ? x : x + w - 2, k * 10, 2, 10, '#6c727e');
  }
}

// ---------- fachada do andar i (y0 = base do andar); chamada depois da fachada pronta ----------
export function techFacade(i, y0, lvl) {
  if (lvl < 2) return;
  if (i === 0 && lv('lojas')) for (const wx of [12, 72, 132, 192]) { const x = TL + wx - 4; for (let s = 0; s < 4; s++) R(x + s * 11, y0 + 72, 11, 7, s % 2 ? '#f4f1e6' : '#c0303a'); R(x, y0 + 71, 44, 1, '#7a1d24'); }
  if (lv('leilao') && i % 30 === 12) { R(TL + 50, y0 + 77, 140, 15, '#20242f'); R(TL + 52, y0 + 78, 136, 13, '#c9a227'); T('LEILÃO DE COBERTURAS', TL + 120, y0 + 85, 7, '#20242f', 'center'); }
  if ((lv('eventos') || lv('hotelNuvens')) && i % 10 === 7) { // luzes de festa penduradas no andar
    for (let k = 0; k < 12; k++) { const x = TL + 6 + k * 20, sag = Math.sin(k / 11 * Math.PI) * 6; R(x, y0 + FH - 14 - sag, 3, 3, ['#ffd23a', '#ff6a9a', '#5fe0ff'][(k + Math.floor(V.t * 2)) % 3]); }
  }
  if (lv('vidroSolar') && i % 3 === 1) R(TL + 4, y0 + FH - 10, TW - 8, 3, 'rgba(95,184,255,.55)');           // faixa de vidro solar
  if (lv('concretoAD') && i % 4 === 2) R(TL, y0 + SLAB, TW, 2, 'rgba(255,255,255,.18)');                  // laje de concreto de alto desempenho
}

// ---------- topo da obra (fy = piso do andar em obra) ----------
export function techTop(y0, fy) {
  if (cam.z < 0.25) return;
  if (lv('turnoNoite')) for (const x of [TL + 4, TL + TW - 10]) { R(x, fy, 3, 70, '#5a5f6a'); R(x - 4, fy + 68, 11, 6, '#3b4152'); R(x - 3, fy + 69, 9, 4, '#fff6c8'); }
  if (lv('impressao3d')) { const q = (V.t / 4) % 1, x = TL + 20 + (q < 0.5 ? q * 2 : 2 - q * 2) * (TW - 60); R(TL + 6, fy + 86, TW - 12, 4, '#3b4152'); R(x, fy + 66, 18, 20, '#5a5f6a'); R(x + 7, fy + 60, 4, 6, '#ff8a1e'); }
  if (lv('usinaTopo') || lv('argamassa')) prop('betoneira-peq', TL + TW - 50, fy, 1.6);
  if (lv('amortecedor')) { const sw = Math.sin(V.t * 1.2) * 10; R(TL + TW / 2 - 1, fy + 40, 2, 40, '#9aa0ab'); R(TL + TW / 2 - 9 + sw, fy + 28, 18, 14, '#c9a227'); }
  if (lv('grafeno')) R(TL + TW / 2 - 2, fy, 4, FH, `rgba(95,224,255,${(0.35 + 0.2 * Math.sin(V.t * 3)).toFixed(2)})`);
  if (lv('nanotubos')) for (let k = 0; k < 10; k++) R(TL + 12 + k * 22, fy + 2, 8, 2, 'rgba(120,255,200,.6)');
  if (lv('gravidade')) for (let k = 0; k < 6; k++) { const q = (V.t * 0.3 + k / 6) % 1; R(TL + TW + 40 + hash(k, 3) * 120, fy + q * 120, 4, 4, `rgba(176,120,255,${(1 - q).toFixed(2)})`); }
  if (lv('condominioOrbital')) { // condomínio em anel girando ao lado do topo
    const cx = TL - 150, cy = fy + 190, a = V.t * 0.4;
    for (let k = 0; k < 12; k++) { const q = a + k * Math.PI / 6; R(cx + Math.cos(q) * 40 - 4, cy + Math.sin(q) * 14 - 3, 8, 6, k % 3 ? '#d0d5de' : '#ffd23a'); }
    R(cx - 3, cy - 3, 6, 6, '#9aa0ab');
  }
  if (lv('turismoEsp')) { // nave de turistas cruzando o céu a cada ~20 s
    const q = (V.t / 20) % 1;
    if (q < 0.4) { const x = TL - 600 + q / 0.4 * 1440, y = fy + 260; R(x, y, 34, 10, '#eef0f4'); R(x + 30, y + 2, 8, 6, '#5fb8ff'); R(x - 4, y + 2, 4, 6, '#3b4152'); R(x - 12 - (V.t * 30 % 6), y + 3, 8, 4, '#ffb43a'); }
  }
  if (lv('exoesqueleto')) R(TL + 6, fy + 2, TW - 12, 2, 'rgba(255,210,58,.5)');
}
