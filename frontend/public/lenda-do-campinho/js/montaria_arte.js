/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   MONTARIAS DESENHADAS COM O PILOTO (v138)
   Antes o boneco era recortado e colado em cima do veículo (pernas
   tortas, mãos longe do guidão). Agora cada montaria tem uma arte
   própria com o piloto sentado de verdade (a/mt_<id>.webp: 2 quadros
   lado a lado, olhando para a DIREITA), nas cores-chave dos bonecos:
   camisa verde, shorts azul, cabelo magenta, pele bronzeada — que são
   repintadas com as cores do jogador (igual às folhas de corpo).
   O veículo usa só cores "livres" (vermelho, amarelo, turquesa, branco,
   preto, prata), então não é repintado. Carro de luxo: branco → dourado.
   Sem a arte carregada, usa o desenho antigo.
   Carregar DEPOIS de montarias.js.
   ============================================================ */
const MONT_ARTE = {
  skate: { w: 1.15, anda: 160 }, bicicleta: { w: 1.7, anda: 150 }, lambreta: { w: 1.85, anda: 240 },
  carro: { w: 2.5, anda: 260, face: 'e' }, conversivel: { w: 2.75, anda: 260 }, luxo: { w: 2.85, anda: 260, face: 'e', dourado: true }, // face 'e' = a arte olha para a esquerda
};
Object.keys(MONT_ARTE).forEach(id => { const n = 'mt_' + id; if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } });

// recorta os 2 quadros (mesma caixa nos dois, para não "pular") e rotula os pixels do piloto
const MONT_BASE = {};
// v159: vistas de frente (_f) e de costas (_c) — antes a montaria andava sempre de lado
const MONT_VISTAS = ['skate', 'bicicleta', 'lambreta', 'carro', 'conversivel', 'luxo', 'hover', 'diamante', 'dragao', 'nave'];
MONT_VISTAS.forEach(id => ['_f', '_c'].forEach(v => { const n = 'mt_' + id + v; if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); } }));
function baseMontaria(id, v) {
  const nome = 'mt_' + id + (v ? '_' + v : '');
  if (MONT_BASE[nome]) return MONT_BASE[nome];
  const im = aSprite(nome); if (!im) return null;
  const W = im.width, H = im.height, hw = W >> 1;
  const c = mkCanvas(W, H), x = c.getContext('2d'); x.drawImage(im, 0, 0);
  const all = x.getImageData(0, 0, W, H).data;
  let x0 = hw, y0 = H, x1 = 0, y1 = 0;
  for (let q = 0; q < 2; q++) for (let j = 0; j < H; j += 2) for (let i = 0; i < hw; i += 2) {
    if (all[((j * W) + q * hw + i) * 4 + 3] > 40) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
  }
  if (x1 <= x0 || y1 <= y0) return null;
  x0 = Math.max(0, x0 - 3); y0 = Math.max(0, y0 - 3); x1 = Math.min(hw - 1, x1 + 3); y1 = Math.min(H - 1, y1 + 3);
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1; const quadros = [];
  for (let q = 0; q < 2; q++) {
    const qc = mkCanvas(cw, ch), qx = qc.getContext('2d'); qx.drawImage(im, q * hw + x0, y0, cw, ch, 0, 0, cw, ch);
    const d = qx.getImageData(0, 0, cw, ch).data, n = cw * ch; const rot = new Uint8Array(n), lum = new Float32Array(n), sat = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const r = d[i * 4] / 255, g = d[i * 4 + 1] / 255, b = d[i * 4 + 2] / 255, a = d[i * 4 + 3]; if (a < 20) continue;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn + 1e-6, s = mx ? (mx - mn) / mx : 0;
      let h = mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h *= 60; if (h < 0) h += 360;
      lum[i] = mx; sat[i] = s;
      if (s > 0.3 && mx > 0.18 && h >= 268 && h <= 345) rot[i] = 1;          // cabelo
      else if (s > 0.3 && mx > 0.15 && h >= 80 && h <= 165) rot[i] = 2;      // camisa
      else if (s > 0.35 && mx > 0.15 && h >= 195 && h <= 255) rot[i] = 3;    // shorts
      else if (h >= 4 && h <= 46 && s > 0.18 && s < 0.8 && mx > 0.36) rot[i] = 4; // pele
    }
    const ref = [0, 0, 0, 0, 0];
    for (let k = 1; k <= 4; k++) { const v = []; for (let i = 0; i < n; i += 3) if (rot[i] === k) v.push(lum[i]); v.sort((a, b) => a - b); ref[k] = v.length ? v[v.length >> 1] : 0.5; }
    quadros.push({ c: qc, d, rot, lum, sat, ref, w: cw, h: ch });
  }
  return MONT_BASE[nome] = { quadros };
}
// pinta o piloto com as cores do jogador (e o carro de luxo de dourado)
const MONT_PRONTA = new Map();
function montariaPintada(id, q, sp, v) {
  const b = baseMontaria(id, v); if (!b) return null;
  const k = `${id}|${v || ''}|${q}|${sp.corCab}|${sp.corRoupa}|${sp.corBaixo}|${sp.pele}`; const hit = MONT_PRONTA.get(k); if (hit) return hit;
  const f = b.quadros[q]; const out = mkCanvas(f.w, f.h), x = out.getContext('2d');
  const img = x.createImageData(f.w, f.h), o = img.data; o.set(f.d);
  const alvo = [null, sp.corCab, sp.corRoupa, sp.corBaixo, sp.pele].map(c => c ? bRgb(c) : null);
  const ouro = MONT_ARTE[id].dourado;
  for (let i = 0; i < f.rot.length; i++) {
    const kk = f.rot[i];
    if (kk && alvo[kk]) { const m = f.lum[i] / (f.ref[kk] || 0.5), t = alvo[kk]; for (let j = 0; j < 3; j++) o[i * 4 + j] = m <= 1 ? t[j] * m : Math.min(255, t[j] + (255 - t[j]) * (m - 1) * 0.9); continue; }
    if (ouro && !kk && f.sat[i] < 0.18 && f.lum[i] > 0.55 && o[i * 4 + 3] > 20) { // lataria branca vira ouro (mantém o brilho)
      const u = Math.min(1, Math.max(0, (f.lum[i] - 0.55) / 0.45)), v = u * u; o[i * 4] = 176 + 79 * u; o[i * 4 + 1] = 118 + 124 * v; o[i * 4 + 2] = 18 + 150 * v * v;
    }
  }
  x.putImageData(img, 0, 0);
  MONT_PRONTA.set(k, out); if (MONT_PRONTA.size > 24) MONT_PRONTA.delete(MONT_PRONTA.keys().next().value);
  return out;
}
const _desenhaMontadoAntigo = desenhaMontado;
desenhaMontado = function (ctx, e) {
  const s = G.save; const id = s && s.montaria; const cfg = id && MONT_ARTE[id];
  if (!cfg) return _desenhaMontadoAntigo(ctx, e);
  const q = e.mov ? Math.floor(G.agora / cfg.anda) % 2 : 0;
  const sp = specDe(lookJogador()); const lado = montariaPintada(id, q, sp);
  const v = e.vista === 'frente' ? 'f' : e.vista === 'costas' ? 'c' : null;
  const vc = v && MONT_VISTAS.includes(id) ? montariaPintada(id, q, sp, v) : null; // subindo = de costas, descendo = de frente
  const c = vc || lado;
  if (!c) return _desenhaMontadoAntigo(ctx, e);
  const alt = alturaEnt({ ...e, _semMont: true }); // o veículo cresce um pouco junto com o jogador
  let w = cfg.w * T * (0.86 + 0.14 * alt / 1.56), h = w * c.height / c.width;
  if (vc && lado) { h = w * lado.height / lado.width * 1.05; w = h * vc.width / vc.height; } // de frente/costas: mesma altura da vista de lado
  const x = e.x * T, y = e.y * T; const bump = e.mov ? Math.abs(Math.sin(G.agora / 70)) * 1.4 : 0;
  ctx.save(); ctx.translate(x, y - bump);
  ctx.fillStyle = 'rgba(30,20,40,0.26)'; ctx.beginPath(); ctx.ellipse(0, T * 0.1, w * 0.42, T * 0.2, 0, 0, 7); ctx.fill();
  if (!vc && e.flip !== (cfg.face === 'e')) ctx.scale(-1, 1);
  ctx.drawImage(c, -w / 2, T * 0.2 - h, w, h);
  ctx.restore();
  e._altMont = (h - T * 0.2) / T;
  return true;
};
