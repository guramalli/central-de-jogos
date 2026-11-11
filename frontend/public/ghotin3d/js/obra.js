// O construtor: junta as peças por material e solta poucas malhas grandes. Tem as peças da arquitetura (telhado curvo, pavilhão, muro).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as M from './mapa.js';

const V3 = THREE.Vector3;

// UV em metros, pela face dominante (para caixas e paredes)
export function uvMundo(g, esc) {
  const p = g.attributes.position, n = g.attributes.normal; const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)); let u, v;
    if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); } else if (ax >= az) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = u / esc; uv[i * 2 + 1] = v / esc;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
}

export function tubo(pts, raios, lados = 7, escU = 1.2, escV = 1.5) {
  const P = [], I = [], U = [], N = []; const up = new V3(0, 1, 0), t = new V3(), a = new V3(), b = new V3(); let v = 0;
  for (let k = 0; k < pts.length; k++) {
    const p = pts[k]; t.copy(pts[Math.min(k + 1, pts.length - 1)]).sub(pts[Math.max(k - 1, 0)]).normalize();
    a.crossVectors(t, Math.abs(t.y) > 0.95 ? new V3(1, 0, 0) : up).normalize(); b.crossVectors(t, a).normalize();
    if (k > 0) v += pts[k].distanceTo(pts[k - 1]); const rr = typeof raios === 'number' ? raios : raios[k];
    for (let s = 0; s <= lados; s++) { const an = s / lados * Math.PI * 2, cx = Math.cos(an), sy = Math.sin(an); const nx = a.x * cx + b.x * sy, ny = a.y * cx + b.y * sy, nz = a.z * cx + b.z * sy; P.push(p.x + nx * rr, p.y + ny * rr, p.z + nz * rr); N.push(nx, ny, nz); U.push(s / lados * Math.max(1, Math.round(rr * 6.283 / escU)), v / escV); }
  }
  for (let k = 0; k < pts.length - 1; k++) for (let s = 0; s < lados; s++) { const i0 = k * (lados + 1) + s; I.push(i0, i0 + lados + 1, i0 + 1, i0 + 1, i0 + lados + 1, i0 + lados + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); return g;
}

export class Obra {
  constructor() { this.g = {}; this.pilha = [new THREE.Matrix4()]; }
  get m() { return this.pilha[this.pilha.length - 1]; }
  entrar(x, y, z, rot = 0) { const m = new THREE.Matrix4().makeRotationY(rot).setPosition(x, y, z); this.pilha.push(this.m.clone().multiply(m)); }
  sair() { this.pilha.pop(); }
  // põe uma geometria (em coordenadas locais) no material; uvEsc > 0 refaz o UV em metros depois de transformar
  add(mat, geo, uvEsc = 0) {
    let g = geo.index ? geo.toNonIndexed() : geo; g.applyMatrix4(this.m);
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    if (uvEsc) uvMundo(g, uvEsc);
    (this.g[mat] ||= []).push(g); return g;
  }
  caixa(mat, x0, y0, z0, x1, y1, z1, esc = 2) { const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return this.add(mat, g, esc); }
  // caixa com o UV próprio das faces (0..1), repetido ao longo do comprimento
  faixa(mat, x0, y0, z0, x1, y1, z1, mod = 1.6) {
    const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)); const uv = g.attributes.uv, n = g.attributes.normal; const rx = Math.max(1, Math.round(Math.abs(x1 - x0) / mod)), rz = Math.max(1, Math.round(Math.abs(z1 - z0) / mod));
    for (let i = 0; i < uv.count; i++) { if (Math.abs(n.getZ(i)) > 0.5) uv.setX(i, uv.getX(i) * rx); else if (Math.abs(n.getX(i)) > 0.5) uv.setX(i, uv.getX(i) * rz); else { uv.setXY(i, uv.getX(i) * rx, uv.getY(i) * 0.2); } }
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return this.add(mat, g);
  }
  cilindro(mat, x, y0, z, r, h, lados = 12, rTopo = null, esc = 2) {
    const g = new THREE.CylinderGeometry(rTopo ?? r, r, h, lados, 1); const uv = g.attributes.uv; const ru = Math.max(1, Math.round(6.283 * r / esc * 2) / 2);
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * ru, uv.getY(i) * h / esc);
    g.translate(x, y0 + h / 2, z); return this.add(mat, g);
  }
  // painel fino com a textura inteira (janela, porta): no plano xy local, virado para +z
  painel(mat, x0, y0, x1, y1, z, esp = 0.06, rot = 0, cx = 0, cz = 0) {
    const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), esp); g.translate((x0 + x1) / 2, (y0 + y1) / 2, z);
    if (rot) { g.rotateY(rot); } if (cx || cz) g.translate(cx, 0, cz); return this.add(mat, g);
  }
  malha(mat, geo, x = 0, y = 0, z = 0, uvEsc = 0) { geo.translate(x, y, z); return this.add(mat, geo, uvEsc); }
  finalizar(cena, materiais, opc = {}) {
    const out = [];
    for (const [nome, lista] of Object.entries(this.g)) {
      if (!materiais[nome]) { console.warn('material ausente', nome); continue; }
      const g = mergeGeometries(lista, false); const mesh = new THREE.Mesh(g, materiais[nome]); mesh.castShadow = opc.semSombra?.includes(nome) ? false : true; mesh.receiveShadow = true; mesh.name = 'obra_' + nome;
      cena.add(mesh); out.push(mesh);
    }
    this.g = {}; return out;
  }
}

// ---------- o telhado de beirais curvos ----------
// W,D: o beiral (por fora); w,d: o topo (d=0 dá cumeeira; w=d=0 dá pirâmide); H: altura; bico: quanto os cantos sobem
export function telhado(o, { W, D, w = 0, d = 0, H, bico = 0.7, p = 1.5, y = 0, mat = 'telha', matForro = 'forro', matCume = 'cume', nu = 16, nv = 8, esc = 2.0, cumeR = 0.2, enfeite = true }) {
  const E = [[-W / 2, D / 2], [W / 2, D / 2], [W / 2, -D / 2], [-W / 2, -D / 2]], Iq = [[-w / 2, d / 2], [w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2]];
  const ponto = (s, u, v) => {
    const e0 = E[s], e1 = E[(s + 1) % 4], i0 = Iq[s], i1 = Iq[(s + 1) % 4];
    const ex = e0[0] + (e1[0] - e0[0]) * u, ez = e0[1] + (e1[1] - e0[1]) * u, ix = i0[0] + (i1[0] - i0[0]) * u, iz = i0[1] + (i1[1] - i0[1]) * u;
    let x = ex + (ix - ex) * v, z = ez + (iz - ez) * v; const c = Math.abs(2 * u - 1), k = c * c * c * (1 - v) * (1 - v);
    const cn = u < 0.5 ? e0 : e1; const cl = Math.hypot(cn[0], cn[1]) || 1; x += cn[0] / cl * bico * 0.55 * k; z += cn[1] / cl * bico * 0.55 * k;
    return new V3(x, y + H * Math.pow(v, p) + bico * k, z);
  };
  const P = [], U = [], I = [], P2 = [], U2 = [], I2 = [], PF = [], UF = [], IF = [];
  for (let s = 0; s < 4; s++) {
    const e0 = E[s], e1 = E[(s + 1) % 4]; const dx = e1[0] - e0[0], dz = e1[1] - e0[1]; const L = Math.hypot(dx, dz); const ux = dx / L, uz = dz / L;
    const corrida = Math.hypot((s % 2 === 0 ? (D - d) : (W - w)) / 2, H);
    const base = P.length / 3;
    for (let iv = 0; iv <= nv; iv++) for (let iu = 0; iu <= nu; iu++) {
      const u = iu / nu, v = iv / nv; const q = ponto(s, u, v); P.push(q.x, q.y, q.z); const ao = q.x * ux + q.z * uz; U.push(ao / esc, v * corrida / esc);
      P2.push(q.x, q.y - 0.16 - 0.1 * (1 - v), q.z); U2.push(ao / 1.6, v * corrida / 1.6);
    }
    for (let iv = 0; iv < nv; iv++) for (let iu = 0; iu < nu; iu++) { const a = base + iv * (nu + 1) + iu, b = a + 1, c = a + nu + 1, d2 = c + 1; I.push(a, b, c, b, d2, c); I2.push(a, c, b, b, c, d2); }
    // a testeira do beiral
    const bf = PF.length / 3; for (let iu = 0; iu <= nu; iu++) { const q = ponto(s, iu / nu, 0); PF.push(q.x, q.y + 0.02, q.z, q.x, q.y - 0.27, q.z); UF.push(iu / nu * L / 1.6, 1, iu / nu * L / 1.6, 0.8); }
    for (let iu = 0; iu < nu; iu++) { const a = bf + iu * 2; IF.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const mk = (P, U, I) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals(); return g; };
  const gt = mk(P, U, I); { const n = gt.attributes.normal; let s = 0; for (let i = 0; i < n.count; i += 7) s += n.getY(i); if (s < 0) { const ix = gt.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } gt.computeVertexNormals(); const i2 = I2; for (let i = 0; i < i2.length; i += 3) { const t = i2[i + 1]; i2[i + 1] = i2[i + 2]; i2[i + 2] = t; } } }
  o.add(mat, gt); o.add(matForro, mk(P2, U2, I2));
  const gf = mk(PF, UF, IF); { const n = gf.attributes.normal, pp = gf.attributes.position; let s = 0; for (let i = 0; i < n.count; i += 5) s += n.getX(i) * pp.getX(i) + n.getZ(i) * pp.getZ(i); if (s < 0) { const ix = gf.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } gf.computeVertexNormals(); } }
  o.add(matForro, gf);
  // as cumeeiras dos cantos
  for (let s = 0; s < 4; s++) { const pts = []; for (let k = 0; k <= 10; k++) { const q = ponto(s, 0, k / 10); q.y += 0.07; pts.push(q); } const q0 = pts[0].clone(); const cn = E[s]; const cl = Math.hypot(cn[0], cn[1]) || 1; pts.unshift(q0.clone().add(new V3(cn[0] / cl * 0.28, 0.22, cn[1] / cl * 0.28))); o.add(matCume, tubo(pts, pts.map((_, i) => cumeR * 0.72 * (i === 0 ? 0.5 : 1)), 6)); }
  // a cumeeira de cima e os enfeites das pontas
  if (d === 0 && w > 0) {
    const yy = y + H + 0.1; o.add(matCume, tubo([new V3(-w / 2 - 0.15, yy, 0), new V3(w / 2 + 0.15, yy, 0)], cumeR * 1.15, 8));
    o.caixa(matCume, -w / 2, yy - 0.3, -cumeR * 0.6, w / 2, yy, cumeR * 0.6, 1.5);
    if (enfeite) for (const sx of [-1, 1]) { const pts = []; for (let k = 0; k <= 7; k++) { const t = k / 7; pts.push(new V3(sx * (w / 2 + 0.05 - 0.55 * Math.sin(t * 2.1) * t), yy + t * 1.05, 0)); } o.add('ouro', tubo(pts, pts.map((_, i) => 0.24 * (1 - i / 9)), 7)); }
  } else if (w === 0 && d === 0 && enfeite) {
    const yy = y + H; o.cilindro('ouro', 0, yy - 0.1, 0, 0.26, 0.35, 10, 0.2); const g = new THREE.SphereGeometry(0.3, 12, 10); g.translate(0, yy + 0.45, 0); o.add('ouro', g); o.cilindro('ouro', 0, yy + 0.7, 0, 0.08, 0.9, 8, 0.01);
  }
}

// ---------- o pavilhão (casa, salão, torre de portão): frente virada para +z local ----------
export function pavilhao(o, { w, d, h = 3.3, pod = 0.4, beiral = 1.15, colR = 0.17, aberto = false, andares = 1, altTel, bico = 0.7, porta = true, matTelha = 'telha', matParede = 'reboco', vao = 2.7, degraus = true, frisoAlt = 0.42, consolo = true, janelasAtras = true }) {
  const hw = w / 2, hd = d / 2;
  // o embasamento de pedra e os degraus
  if (pod > 0) { o.caixa('pedra', -hw - 0.55, 0, -hd - 0.55, hw + 0.55, pod, hd + 0.55, 2.2); o.caixa('pedra', -hw - 0.7, 0, -hd - 0.7, hw + 0.7, pod * 0.45, hd + 0.7, 2.2);
    if (degraus) { const n = Math.max(1, Math.round(pod / 0.2)); for (let k = 0; k < n; k++) o.caixa('pedra', -1.5, 0, hd + 0.55 + k * 0.32, 1.5, pod - (k + 1) * (pod / (n + 1)), hd + 0.55 + (k + 1) * 0.32, 2.2); } }
  const y0 = pod, y1 = pod + h;
  const nx = Math.max(1, Math.round(w / vao)), nz = Math.max(1, Math.round(d / vao));
  const cols = []; for (let i = 0; i <= nx; i++) { cols.push([-hw + w * i / nx, hd], [-hw + w * i / nx, -hd]); } for (let j = 1; j < nz; j++) { cols.push([-hw, -hd + d * j / nz], [hw, -hd + d * j / nz]); }
  for (const [cx, cz] of cols) { o.cilindro('laca', cx, y0, cz, colR, h, 12, colR * 0.92, 1.6); o.cilindro('pedra', cx, y0, cz, colR * 1.55, 0.14, 10, colR * 1.2, 2.2);
    if (consolo) { const s = colR * 2.6; o.caixa('madeiraEsc', cx - s, y1 - frisoAlt - 0.02, cz - colR * 0.9, cx + s, y1 - frisoAlt + 0.14, cz + colR * 0.9, 1.5); o.caixa('madeiraEsc', cx - colR * 0.9, y1 - frisoAlt - 0.02, cz - s, cx + colR * 0.9, y1 - frisoAlt + 0.14, cz + s, 1.5); } }
  // o friso pintado por cima das colunas
  const f0 = y1 - frisoAlt, e = 0.1;
  o.faixa('pintura', -hw - e, f0, hd - e, hw + e, y1, hd + e); o.faixa('pintura', -hw - e, f0, -hd - e, hw + e, y1, -hd + e); o.faixa('pintura', -hw - e, f0, -hd, -hw + e, y1, hd); o.faixa('pintura', hw - e, f0, -hd, hw + e, y1, hd);
  if (!aberto) {
    const r = 0.1; // recuo das paredes para dentro das colunas
    o.caixa(matParede, -hw + r, y0, -hd + r, hw - r, f0, hd - r, 3);
    o.caixa('tijoloCinza', -hw + r - 0.03, y0, -hd + r - 0.03, hw - r + 0.03, y0 + 0.75, hd - r + 0.03, 2.6);
    const jan = (a, b, fixo, eixo, sinal, ehPorta) => {
      const m = (a + b) / 2, lg = Math.abs(b - a) - colR * 2 - 0.36; if (lg < 0.5) return; const j0 = ehPorta ? y0 + 0.02 : y0 + 0.95, j1 = ehPorta ? y0 + 2.5 : Math.min(f0 - 0.25, y0 + 2.45);
      const g = new THREE.BoxGeometry(lg, j1 - j0, 0.07); const uv = g.attributes.uv; if (ehPorta) for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * Math.max(1, Math.round(lg / 0.9)));
      g.translate(0, (j0 + j1) / 2, 0); if (eixo === 'x') { g.rotateY(sinal > 0 ? Math.PI / 2 : -Math.PI / 2); g.translate(fixo + sinal * (-r + 0.035), 0, m); } else { if (sinal < 0) g.rotateY(Math.PI); g.translate(m, 0, fixo + sinal * (-r + 0.035)); }
      o.add(ehPorta ? 'porta' : 'trelica', g);
      // a moldura
      const mo = 0.08; const gm = new THREE.BoxGeometry(lg + mo * 2, j1 - j0 + mo * 2, 0.045); gm.translate(0, (j0 + j1) / 2, 0); if (eixo === 'x') { gm.rotateY(Math.PI / 2); gm.translate(fixo + sinal * (-r + 0.012), 0, m); } else gm.translate(m, 0, fixo + sinal * (-r + 0.012)); o.add('madeiraEsc', gm, 1.5);
    };
    const meio = (nx - 1) / 2;
    for (let i = 0; i < nx; i++) { const a = -hw + w * i / nx, b = -hw + w * (i + 1) / nx; const ep = porta && Math.abs(i - meio) < 0.6; jan(a, b, hd, 'z', 1, ep); if (janelasAtras) jan(a, b, -hd, 'z', -1, false); }
    for (let j = 0; j < nz; j++) { const a = -hd + d * j / nz, b = -hd + d * (j + 1) / nz; jan(a, b, hw, 'x', 1, false); jan(a, b, -hw, 'x', -1, false); }
  }
  // os telhados
  const W = w + beiral * 2, D = d + beiral * 2;
  if (andares === 1) {
    const H = altTel ?? Math.min(W, D) * 0.34; telhado(o, { W, D, w: Math.max(0, (W - D) * 0.92 + (W > D ? 0 : 0)), d: 0, H, bico, y: y1, mat: matTelha });
    return { topo: y1 + H };
  }
  // dois andares: a saia de baixo, o corpo de cima e o telhado de cima
  const Hs = 1.25; telhado(o, { W, D, w: w - 0.5, d: d - 0.5, H: Hs, bico, y: y1, mat: matTelha, p: 1.35, enfeite: false });
  const y2 = y1 + Hs - 0.25, h2 = 1.5, w2 = w - 1.0, d2 = d - 1.0;
  o.caixa(matParede, -w2 / 2, y2, -d2 / 2, w2 / 2, y2 + h2, d2 / 2, 3);
  const n2 = Math.max(2, Math.round(w2 / vao)); for (let i = 0; i <= n2; i++) for (const sz of [-1, 1]) o.cilindro('laca', -w2 / 2 + w2 * i / n2, y2, sz * d2 / 2, colR * 0.8, h2, 10, colR * 0.75, 1.6);
  for (let i = 0; i < n2; i++) for (const sz of [-1, 1]) { const a = -w2 / 2 + w2 * i / n2, b = -w2 / 2 + w2 * (i + 1) / n2; const g = new THREE.BoxGeometry(b - a - colR * 2 - 0.2, h2 - 0.75, 0.06); g.translate((a + b) / 2, y2 + 0.2 + (h2 - 0.75) / 2, sz * (d2 / 2 + 0.035)); o.add('trelica', g); }
  o.faixa('pintura', -w2 / 2 - e, y2 + h2 - 0.38, d2 / 2 - e, w2 / 2 + e, y2 + h2, d2 / 2 + e); o.faixa('pintura', -w2 / 2 - e, y2 + h2 - 0.38, -d2 / 2 - e, w2 / 2 + e, y2 + h2, -d2 / 2 + e);
  o.faixa('pintura', -w2 / 2 - e, y2 + h2 - 0.38, -d2 / 2, -w2 / 2 + e, y2 + h2, d2 / 2); o.faixa('pintura', w2 / 2 - e, y2 + h2 - 0.38, -d2 / 2, w2 / 2 + e, y2 + h2, d2 / 2);
  const W2 = w2 + beiral * 2.1, D2 = d2 + beiral * 2.1, H2 = altTel ?? Math.min(W2, D2) * 0.36;
  telhado(o, { W: W2, D: D2, w: Math.max(0, (W2 - D2) * 0.9), d: 0, H: H2, bico: bico * 1.1, y: y2 + h2, mat: matTelha, cumeR: 0.26 });
  return { topo: y2 + h2 + H2 };
}

// ---------- muro de pátio com capa de telha: de (x0,z0) a (x1,z1), reto num eixo ----------
export function muro(o, x0, z0, x1, z1, alt = 2.3, esp = 0.36) {
  const dx = x1 - x0, dz = z1 - z0; const L = Math.hypot(dx, dz); if (L < 0.2) return; const ang = Math.atan2(-dz, dx);
  o.entrar(x0, 0, z0, ang);
  o.caixa('reboco', 0, 0.45, -esp / 2, L, alt, esp / 2, 3); o.caixa('tijoloCinza', -0.02, 0, -esp / 2 - 0.05, L + 0.02, 0.5, esp / 2 + 0.05, 2.6);
  // a capa: duas águas de telha e uma cumeeira
  const c = esp / 2 + 0.26, yb = alt, yt = alt + 0.3; const P = [], U = [], I = [];
  for (const s of [-1, 1]) { const b = P.length / 3; P.push(0, yb, s * c, L, yb, s * c, L, yt, 0, 0, yt, 0); U.push(0, 0, L / 2, 0, L / 2, 0.2, 0, 0.2); if (s > 0) I.push(b, b + 1, b + 2, b, b + 2, b + 3); else I.push(b, b + 2, b + 1, b, b + 3, b + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals(); o.add('telha', g);
  o.add('cume', tubo([new V3(0, yt + 0.02, 0), new V3(L, yt + 0.02, 0)], 0.085, 6));
  o.caixa('reboco', 0, yb - 0.06, -c + 0.04, L, yb + 0.02, c - 0.04, 3);
  o.sair();
  M.bloquearRet(Math.min(x0, x1) - esp / 2, Math.min(z0, z1) - esp / 2, Math.max(x0, x1) + esp / 2, Math.max(z0, z1) + esp / 2, 0.2);
}

// corrimão de pedra (balaustrada) reto
export function balaustrada(o, x0, z0, x1, z1, y, mat = 'pedraClara') {
  const dx = x1 - x0, dz = z1 - z0; const L = Math.hypot(dx, dz); const ang = Math.atan2(-dz, dx); const n = Math.max(1, Math.round(L / 1.7));
  o.entrar(x0, y, z0, ang);
  for (let k = 0; k <= n; k++) { const x = L * k / n; o.caixa(mat, x - 0.11, 0, -0.11, x + 0.11, 1.0, 0.11, 1.4); const g = new THREE.SphereGeometry(0.13, 8, 6); g.scale(1, 1.25, 1); g.translate(x, 1.12, 0); o.add(mat, g, 1.4); }
  o.caixa(mat, 0, 0.72, -0.07, L, 0.86, 0.07, 1.4); o.caixa(mat, 0, 0.12, -0.05, L, 0.62, 0.05, 1.4);
  o.sair();
}
