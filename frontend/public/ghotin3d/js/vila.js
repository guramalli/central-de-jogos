// A Vila 1: a capital murada (portão sul -> avenida -> praça -> escadaria -> palácio), os bairros, e o que fica fora dos muros.
import * as THREE from 'three';
import * as M from './mapa.js';
import { pbr, recorte } from './texgen.js';
import { Obra, telhado, pavilhao, muro, balaustrada, tubo } from './obra.js';
import { altura, JARDINS } from './natureza.js';

const V3 = THREE.Vector3; const Y = M.CHAO; const PI = Math.PI;
function materiais(ctx) {
  const tg = ctx.tg; const mt = {};
  const pav = tg.fazer('pavimento'), calc = tg.fazer('calcada');
  const tij = tg.fazer('tijolo', { corA: [0.37, 0.35, 0.33], corB: [0.50, 0.47, 0.43] });
  const tijC = tg.fazer('tijolo', { tam: 512, corA: [0.30, 0.31, 0.33], corB: [0.41, 0.42, 0.44] });
  const reb = tg.fazer('reboco', { corA: [0.80, 0.76, 0.67], corB: [0.91, 0.88, 0.80] });
  const rebV = tg.fazer('reboco', { tam: 512, corA: [0.47, 0.12, 0.085], corB: [0.60, 0.17, 0.11] });
  const rebO = tg.fazer('reboco', { tam: 512, corA: [0.70, 0.55, 0.33], corB: [0.82, 0.68, 0.44] });
  const laca = tg.fazer('laca', { tam: 512, corA: [0.46, 0.07, 0.045], corB: [0.63, 0.11, 0.07], p1: 0.4 });
  const mad = tg.fazer('madeira', { corA: [0.25, 0.16, 0.095], corB: [0.41, 0.28, 0.165] });
  const madE = tg.fazer('madeira', { tam: 512, corA: [0.115, 0.07, 0.045], corB: [0.20, 0.125, 0.08] });
  const telha = tg.fazer('telha', { corA: [0.165, 0.175, 0.195], corB: [0.27, 0.28, 0.30], p1: 0.5 });
  const telhaV = tg.fazer('telha', { corA: [0.05, 0.24, 0.17], corB: [0.11, 0.37, 0.26], p1: 0.1 });
  const telhaO = tg.fazer('telha', { corA: [0.60, 0.40, 0.09], corB: [0.80, 0.57, 0.16], p1: 0.1 });
  const trel = tg.fazer('trelica', { tam: 512, corA: [0.27, 0.06, 0.04], corB: [0.40, 0.095, 0.065], p1: 0.5 });
  const pint = tg.fazer('pintura', { tam: 512 });
  const tec = tg.fazer('tecido', { tam: 512, corA: [0.78, 0.78, 0.78], corB: [1, 1, 1] });
  const bronze = tg.fazer('metal', { tam: 512, corA: [0.33, 0.22, 0.09], corB: [0.56, 0.39, 0.16], p1: 0.55 });
  ctx.T.pav = pav; ctx.T.mad = mad; ctx.T.tec = tec;
  mt.tijolo = recorte(pbr(tij, { normalEsc: 1.3, env: 0.5, sujo: 1 }));
  mt.tijoloCinza = recorte(pbr(tijC, { env: 0.5 }));
  mt.pedra = recorte(pbr(pav, { cor: 0xd6d0c6, env: 0.6 })); mt.pedraClara = recorte(pbr(pav, { cor: 0xffffff, env: 0.6 }));
  mt.pisoPedra = pbr(pav, { cor: 0xe9e4da, env: 0.6, poca: 1 }); mt.pisoCalcada = pbr(calc, { cor: 0xe6e0d6, env: 0.55, poca: 1 }); mt.pisoTerra = pbr(ctx.T.terra, { env: 0.4, poca: 1 });
  mt.reboco = recorte(pbr(reb, { env: 0.45, sujo: 0.6 })); mt.rebocoVerm = recorte(pbr(rebV, { env: 0.45 })); mt.rebocoOcre = recorte(pbr(rebO, { env: 0.45, sujo: 0.6 }));
  mt.laca = recorte(pbr(laca, { env: 0.8 })); mt.madeira = recorte(pbr(mad, { env: 0.5 })); mt.madeiraEsc = recorte(pbr(madE, { env: 0.5 }));
  mt.forro = recorte(pbr(mad, { cor: 0xb98a6a, env: 0.35 }));
  mt.telha = recorte(pbr(telha, { normalEsc: 1.5, env: 0.7 })); mt.telhaVerde = recorte(pbr(telhaV, { normalEsc: 1.3, env: 1.0 })); mt.telhaOuro = recorte(pbr(telhaO, { normalEsc: 1.3, env: 1.0 }));
  mt.cume = recorte(new THREE.MeshStandardMaterial({ color: 0x2c2f34, roughness: 0.62, metalness: 0.05, envMapIntensity: 0.7 }));
  mt.ouro = recorte(new THREE.MeshStandardMaterial({ color: 0xd8a23c, roughness: 0.3, metalness: 1, envMapIntensity: 1.2 }));
  mt.trelica = recorte(pbr(trel, { env: 0.5 })); mt.porta = recorte(pbr(trel, { cor: 0xd8c8c0, env: 0.5 }));
  mt.pintura = recorte(pbr(pint, { env: 0.6 }));
  mt.ferro = new THREE.MeshStandardMaterial({ color: 0x2d3035, roughness: 0.48, metalness: 0.92, envMapIntensity: 1 });
  mt.bronze = pbr(bronze, { metal: 0.9, env: 1.1 });
  const pano = (cor) => { const m = pbr(tec, { cor, env: 0.3, lados: THREE.DoubleSide }); return m; };
  mt.panoVerm = pano(0xa82a1c); mt.panoAzul = pano(0x2c4a80); mt.panoOcre = pano(0xc89a48); mt.panoCru = pano(0xd8ccb0); mt.panoVerde = pano(0x3f6a48);
  mt.palha = pbr(tec, { cor: 0xc7a558, env: 0.3 });
  mt.lanterna = new THREE.MeshStandardMaterial({ color: 0xb81f12, emissive: 0xff3208, emissiveIntensity: 1.25, roughness: 0.7 });
  mt.luzPapel = new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffa040, emissiveIntensity: 2.4, roughness: 0.8 });
  mt.brasa = new THREE.MeshStandardMaterial({ color: 0x301008, emissive: 0xff5a10, emissiveIntensity: 4.5, roughness: 0.9 });
  mt.runa = new THREE.MeshStandardMaterial({ color: 0x103040, emissive: 0x30c8ff, emissiveIntensity: 3.2, roughness: 0.5 });
  // o alvo de arco e a placa do portão
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'); g.fillStyle = '#c9b27a'; g.fillRect(0, 0, 256, 256);
  for (const [r, c] of [[118, '#e9e2cf'], [94, '#20201e'], [70, '#3a6fa8'], [46, '#b8281c'], [22, '#e8b83a']]) { g.fillStyle = c; g.beginPath(); g.arc(128, 128, r, 0, 6.283); g.fill(); }
  const ta = new THREE.CanvasTexture(cv); ta.colorSpace = THREE.SRGBColorSpace; mt.alvo = new THREE.MeshStandardMaterial({ map: ta, roughness: 0.95 });
  const cp = document.createElement('canvas'); cp.width = 512; cp.height = 192; const gp = cp.getContext('2d'); gp.fillStyle = '#0d1f3a'; gp.fillRect(0, 0, 512, 192); gp.strokeStyle = '#d8a23c'; gp.lineWidth = 12; gp.strokeRect(10, 10, 492, 172);
  gp.fillStyle = '#e6b84a'; gp.font = 'bold 118px "Malgun Gothic","Noto Sans KR",serif'; gp.textAlign = 'center'; gp.textBaseline = 'middle'; gp.fillText('고틴', 256, 102);
  const tp = new THREE.CanvasTexture(cp); tp.colorSpace = THREE.SRGBColorSpace; tp.anisotropy = 8; mt.placa = new THREE.MeshStandardMaterial({ map: tp, roughness: 0.5, metalness: 0.2 });
  return mt;
}

// retângulo local (com rotação de múltiplos de 90°) -> retângulo no mundo
function retMundo(cx, cz, rot, x0, z0, x1, z1) { const c = Math.cos(rot), s = Math.sin(rot); const P = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => [cx + x * c + z * s, cz - x * s + z * c]); return [Math.min(...P.map(p => p[0])), Math.min(...P.map(p => p[1])), Math.max(...P.map(p => p[0])), Math.max(...P.map(p => p[1]))]; }
const bloqLocal = (cx, cz, rot, x0, z0, x1, z1, m = 0.25) => { const r = retMundo(cx, cz, rot, x0, z0, x1, z1); M.bloquearRet(r[0], r[1], r[2], r[3], m); };
const livreLocal = (cx, cz, rot, x0, z0, x1, z1) => { const r = retMundo(cx, cz, rot, x0, z0, x1, z1); M.liberarRet(r[0], r[1], r[2], r[3]); };

export function criarVila(ctx) {
  const o = new Obra(); const mt = materiais(ctx); ctx.mt = mt; const r = M.semente(515);
  ctx.lanternas = []; ctx.arvoresVila = []; ctx.npcs = []; ctx.fumacas = []; ctx.bandeiras = []; ctx.luzes = []; ctx.fogos = []; ctx.alvosTreino = [];
  const C = M.CID;

  // ---------- peças pequenas ----------
  const lanternaPendurada = (x, y, z, s = 1) => {
    { const w = new V3(x, y, z).applyMatrix4(o.m); ctx.lanternas.push({ x: w.x, y: w.y, z: w.z, s, cor: 0 }); }
    const pts = [[0.001, 0.36], [0.09, 0.35], [0.2, 0.26], [0.27, 0.1], [0.27, -0.1], [0.2, -0.26], [0.09, -0.35], [0.001, -0.36]].map(p => new THREE.Vector2(p[0] * s, p[1] * s));
    o.malha('lanterna', new THREE.LatheGeometry(pts, 18), x, y, z); o.cilindro('ouro', x, y + 0.34 * s, z, 0.1 * s, 0.07 * s, 8); o.cilindro('ouro', x, y - 0.41 * s, z, 0.1 * s, 0.07 * s, 8);
    o.cilindro('madeiraEsc', x, y + 0.4 * s, z, 0.012, 0.5 * s, 4); o.cilindro('panoVerm', x, y - 0.75 * s, z, 0.03 * s, 0.34 * s, 5, 0.05 * s);
  };
  const lanternaPedra = (x, z, y0 = Y) => {
    ctx.lanternas.push({ x, y: y0 + 1.68, z, s: 0.9, cor: 1 });
    o.cilindro('pedraClara', x, y0, z, 0.36, 0.22, 8, 0.3, 1.4); o.cilindro('pedraClara', x, y0 + 0.22, z, 0.13, 1.15, 8, 0.11, 1.4); o.cilindro('pedraClara', x, y0 + 1.37, z, 0.3, 0.12, 8, 0.34, 1.4);
    o.caixa('luzPapel', x - 0.2, y0 + 1.5, z - 0.2, x + 0.2, y0 + 1.86, z + 0.2); for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) o.caixa('pedraClara', x + a * 0.22 - 0.04, y0 + 1.49, z + b * 0.22 - 0.04, x + a * 0.22 + 0.04, y0 + 1.88, z + b * 0.22 + 0.04, 1.4);
    o.entrar(x, y0 + 1.88, z); telhado(o, { W: 0.95, D: 0.95, H: 0.34, bico: 0.12, mat: 'pedraClara', matForro: 'pedraClara', matCume: 'pedraClara', nu: 4, nv: 3, cumeR: 0.05, enfeite: false }); o.sair();
    const gb = new THREE.SphereGeometry(0.09, 8, 6); o.malha('pedraClara', gb, x, y0 + 2.26, z);
    M.bloquearCirc(x, z, 0.3);
  };
  const barril = (x, z, y0 = Y, s = 1) => { const pts = [[0.001, 0], [0.3, 0], [0.36, 0.25], [0.38, 0.45], [0.36, 0.65], [0.3, 0.9], [0.001, 0.9]].map(p => new THREE.Vector2(p[0] * s, p[1] * s)); o.malha('madeira', new THREE.LatheGeometry(pts, 12), x, y0, z); for (const h of [0.14, 0.76]) o.cilindro('ferro', x, y0 + h * s, z, 0.345 * s, 0.05 * s, 12); M.bloquearCirc(x, z, 0.3 * s); };
  const caixote = (x, z, s = 0.7, y0 = Y, rot = 0) => { o.entrar(x, y0, z, rot); o.caixa('madeira', -s / 2, 0, -s / 2, s / 2, s, s / 2, 1.1); for (const a of [-1, 1]) { o.caixa('madeiraEsc', a * s / 2 - 0.03, 0, -s / 2 - 0.02, a * s / 2 + 0.03, s + 0.01, -s / 2 + 0.04, 1); o.caixa('madeiraEsc', a * s / 2 - 0.03, 0, s / 2 - 0.04, a * s / 2 + 0.03, s + 0.01, s / 2 + 0.02, 1); } o.sair(); };
  const saco = (x, z, y0 = Y, s = 1) => { const g = new THREE.SphereGeometry(0.34 * s, 10, 8); g.scale(1, 0.75, 0.8); o.malha('panoCru', g, x, y0 + 0.24 * s, z); };
  const vaso = (x, z, y0 = Y, s = 1, mat = 'bronze') => { const pts = [[0.001, 0], [0.16, 0], [0.26, 0.2], [0.28, 0.42], [0.18, 0.62], [0.13, 0.7], [0.19, 0.78], [0.001, 0.78]].map(p => new THREE.Vector2(p[0] * s, p[1] * s)); o.malha(mat, new THREE.LatheGeometry(pts, 12), x, y0, z); };
  const banca = (x, z, rot, pano) => {
    o.entrar(x, Y, z, rot);
    for (const [a, b] of [[-1.5, -0.9], [1.5, -0.9], [-1.5, 0.9], [1.5, 0.9]]) o.cilindro('madeira', a, 0, b, 0.06, b > 0 ? 2.1 : 2.6, 6);
    const g = new THREE.PlaneGeometry(3.5, 2.3, 8, 4); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x2 = p.getX(i), y2 = p.getY(i); p.setZ(i, -0.12 * Math.cos(x2 / 1.75 * PI / 2) * Math.cos(y2 / 1.15 * PI / 2)); } g.rotateX(-PI / 2 + 0.24); g.computeVertexNormals(); o.malha(pano, g, 0, 2.36, 0, 1.2);
    o.caixa('madeira', -1.45, 0.78, -0.55, 1.45, 0.86, 0.6, 1.3); for (const [a, b] of [[-1.35, -0.45], [1.35, -0.45], [-1.35, 0.5], [1.35, 0.5]]) o.caixa('madeiraEsc', a - 0.05, 0, b - 0.05, a + 0.05, 0.78, b + 0.05, 1);
    o.caixa(pano, -1.47, 0.5, 0.6, 1.47, 0.86, 0.62, 1.2);
    for (let k = 0; k < 9; k++) { const gx = -1.2 + (k % 5) * 0.6 + (r() - 0.5) * 0.1, gz = -0.3 + ((k / 5) | 0) * 0.5; const q = r(); if (q < 0.4) { const gs = new THREE.SphereGeometry(0.1 + r() * 0.05, 8, 6); o.malha(q < 0.2 ? 'lanterna' : 'panoOcre', gs, gx, 0.96, gz); } else if (q < 0.7) vaso(gx, gz, 0.86, 0.4 + r() * 0.25, r() < 0.5 ? 'bronze' : 'tijoloCinza'); else o.caixa('madeira', gx - 0.16, 0.86, gz - 0.13, gx + 0.16, 1.0, gz + 0.13, 0.8); }
    o.sair(); bloqLocal(x, z, rot, -1.6, -1.0, 1.6, 0.8, 0.15);
  };
  const canteiro = (x, z, tipo, esc = 1) => {
    const s = 0.95; for (const [a, b, c, d] of [[-s, -s, s, -s + 0.22], [-s, s - 0.22, s, s], [-s, -s, -s + 0.22, s], [s - 0.22, -s, s, s]]) o.caixa('pedraClara', x + a, Y, z + b, x + c, Y + 0.34, z + d, 1.4);
    o.caixa('pisoTerra', x - s + 0.2, Y, z - s + 0.2, x + s - 0.2, Y + 0.24, z + s - 0.2, 2.5);
    ctx.arvoresVila.push({ tipo, x, z, esc }); M.bloquearRet(x - s, z - s, x + s, z + s, 0.1);
  };
  const bandeira = (x, y, z, cor = 0xa82a1c, alt = 2.6, larg = 0.9) => { ctx.bandeiras.push({ x, y, z, cor, alt, larg }); };
  // o braseiro: pilar de pedra, bacia de bronze, brasa e fogo
  const braseiro = (x, z, y0 = Y) => {
    o.cilindro('pedraClara', x, y0, z, 0.34, 0.22, 8, 0.28, 1.4); o.cilindro('pedraClara', x, y0 + 0.22, z, 0.14, 0.75, 8, 0.12, 1.4);
    const pts = [[0.001, 0], [0.16, 0.02], [0.36, 0.14], [0.46, 0.3], [0.44, 0.34], [0.34, 0.24], [0.001, 0.2]].map(p => new THREE.Vector2(p[0], p[1])); o.malha('bronze', new THREE.LatheGeometry(pts, 14), x, y0 + 0.95, z);
    o.cilindro('brasa', x, y0 + 1.2, z, 0.32, 0.03, 12); ctx.fogos.push({ x, y: y0 + 1.25, z, s: 0.62 }); ctx.lanternas.push({ x, y: y0 + 1.55, z, s: 1.6, cor: 2 }); M.bloquearCirc(x, z, 0.34);
  };
  const banco = (x, z, rot = 0) => { o.entrar(x, Y, z, rot); o.caixa('pedraClara', -0.9, 0.38, -0.24, 0.9, 0.5, 0.24, 1.4); for (const s of [-1, 1]) o.caixa('pedra', s * 0.7 - 0.12, 0, -0.2, s * 0.7 + 0.12, 0.38, 0.2, 2.2); o.sair(); bloqLocal(x, z, rot, -0.9, -0.24, 0.9, 0.24, 0.05); };
  const carroca = (x, z, rot, y0 = Y) => { o.entrar(x, y0, z, rot); o.caixa('madeira', -1.1, 0.55, -0.6, 1.1, 0.65, 0.6, 1.2);
    for (const s of [-1, 1]) { o.caixa('madeira', -1.1, 0.65, s * 0.6 - 0.04, 1.1, 1.05, s * 0.6 + 0.04, 1.2); const gw = new THREE.CylinderGeometry(0.5, 0.5, 0.08, 16).rotateX(PI / 2); o.malha('madeiraEsc', gw, 0, 0.5, s * 0.72); const ga = new THREE.TorusGeometry(0.5, 0.04, 6, 18); o.malha('ferro', ga, 0, 0.5, s * 0.72); }
    o.caixa('madeira', -1.1, 0.65, -0.6, -1.02, 1.05, 0.6, 1.2); o.add('madeira', tubo([new V3(1.1, 0.6, -0.5), new V3(2.3, 0.35, -0.45)], 0.04, 5)); o.add('madeira', tubo([new V3(1.1, 0.6, 0.5), new V3(2.3, 0.35, 0.45)], 0.04, 5));
    const gh = new THREE.SphereGeometry(0.9, 12, 8); gh.scale(1.15, 0.55, 0.62); o.malha('palha', gh, 0, 1.0, 0); o.sair(); bloqLocal(x, z, rot, -1.2, -0.8, 1.3, 0.8, 0.05); };
  const fardo = (x, z, y0 = Y, rot = 0) => { const g = new THREE.CylinderGeometry(0.42, 0.42, 0.9, 14).rotateZ(PI / 2).rotateY(rot); o.malha('palha', g, x, y0 + 0.42, z); M.bloquearCirc(x, z, 0.45); };
  const mastro = (x, z, y0, h = 5.5, cor) => { o.cilindro('madeiraEsc', x, y0, z, 0.07, h, 6, 0.05); o.caixa('madeiraEsc', x - 0.04, y0 + h - 0.25, z - 0.04, x + 1.1, y0 + h - 0.17, z + 0.04, 1); const g = new THREE.SphereGeometry(0.1, 8, 6); o.malha('ouro', g, x, y0 + h + 0.08, z); bandeira(x + 0.55, y0 + h - 0.22, z, cor); };

  // ---------- a muralha ----------
  const trecho = (ax, az, bx, bz, fora) => {
    const dx = bx - ax, dz = bz - az; const L = Math.hypot(dx, dz); const ang = Math.atan2(-dz, dx); const e = C.esp / 2, H = C.alt;
    o.entrar(ax, Y - 0.6, az, ang);
    const g = new THREE.BoxGeometry(L, H + 0.6, C.esp, Math.max(1, Math.round(L / 4)), 1, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setZ(i, p.getZ(i) * 0.86); g.computeVertexNormals(); g.translate(L / 2, (H + 0.6) / 2, 0); o.add('tijolo', g, 3);
    o.caixa('pedra', 0, 0, -e - 0.12, L, 1.1, e + 0.12, 2.2);
    const yt = H + 0.6, et = e * 0.86;
    o.caixa('pedra', 0, yt - 0.02, -et - 0.16, L, yt + 0.16, et + 0.16, 2.2);
    // o parapeito de fora com ameias e o de dentro
    o.caixa('tijolo', 0, yt + 0.16, fora * (et - 0.26) - 0.26, L, yt + 0.75, fora * (et - 0.26) + 0.26, 3);
    const n = Math.floor(L / 1.9); for (let k = 0; k < n; k++) { const x0 = (k + 0.25) * L / n; o.caixa('tijolo', x0, yt + 0.75, fora * (et - 0.26) - 0.26, x0 + L / n * 0.55, yt + 1.5, fora * (et - 0.26) + 0.26, 3); o.caixa('pedra', x0 - 0.03, yt + 1.5, fora * (et - 0.26) - 0.3, x0 + L / n * 0.55 + 0.03, yt + 1.58, fora * (et - 0.26) + 0.3, 2.2); }
    o.caixa('tijolo', 0, yt + 0.16, -fora * (et - 0.16) - 0.16, L, yt + 0.95, -fora * (et - 0.16) + 0.16, 3);
    o.sair();
    M.bloquearRet(Math.min(ax, bx) - (dz ? e : 0), Math.min(az, bz) - (dx ? e : 0), Math.max(ax, bx) + (dz ? e : 0), Math.max(az, bz) + (dx ? e : 0), 0.3);
  };
  // fora: +1 quando o lado de fora é o +z local do trecho
  trecho(C.x0, C.z1, -7.5, C.z1, 1); trecho(7.5, C.z1, C.x1, C.z1, 1);                  // sul
  trecho(C.x1, C.z0, C.x0, C.z0, 1);                                                    // norte (anda de leste para oeste: +z local = norte)
  trecho(C.x1, C.z1, C.x1, 10.5, 1); trecho(C.x1, -2.5, C.x1, C.z0, 1);                 // leste (anda para o norte: +z local = leste)
  trecho(C.x0, C.z0, C.x0, -1.5, 1); trecho(C.x0, 9.5, C.x0, C.z1, 1);                  // oeste (anda para o sul: +z local = oeste)

  // as torres dos cantos
  for (const [cx, cz] of [[C.x0, C.z0], [C.x1, C.z0], [C.x1, C.z1], [C.x0, C.z1]]) {
    const ht = C.alt + 1.5; o.entrar(cx, Y - 0.6, cz);
    const g = new THREE.BoxGeometry(6.6, ht + 0.6, 6.6); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { p.setX(i, p.getX(i) * 0.9); p.setZ(i, p.getZ(i) * 0.9); } g.computeVertexNormals(); g.translate(0, (ht + 0.6) / 2, 0); o.add('tijolo', g, 3);
    o.caixa('pedra', -3.45, 0, -3.45, 3.45, 1.2, 3.45, 2.2); o.caixa('pedra', -3.15, ht + 0.58, -3.15, 3.15, ht + 0.76, 3.15, 2.2);
    for (const s of [-1, 1]) { for (let k = 0; k < 3; k++) { const a = -2.75 + k * 2.05; o.caixa('tijolo', a, ht + 0.76, s * 2.85 - 0.22, a + 1.4, ht + 1.7, s * 2.85 + 0.22, 3); o.caixa('tijolo', s * 2.85 - 0.22, ht + 0.76, a, s * 2.85 + 0.22, ht + 1.7, a + 1.4, 3); } }
    o.sair();
    o.entrar(cx, Y + ht + 0.16, cz); pavilhao(o, { w: 3.6, d: 3.6, h: 2.6, pod: 0.2, beiral: 1.0, aberto: true, degraus: false, bico: 0.6, vao: 3.6, colR: 0.14 }); o.sair();
    M.bloquearRet(cx - 3.3, cz - 3.3, cx + 3.3, cz + 3.3, 0.3);
    mastro(cx + (cx > 0 ? 2.4 : -2.4), cz + (cz > 0 ? 2.4 : -2.4), Y + ht + 0.2, 5.2, cx * cz > 0 ? 0xa82a1c : 0x2c4a80);
  }

  // os portões: bloco com túnel em arco e a torre em cima (frente = +z local = lado de fora)
  const portao = (cx, cz, rot, larg, vao, andares, comPlaca) => {
    const hg = 8.3, prof = 6.6, hp = prof / 2;
    o.entrar(cx, Y - 0.6, cz, rot);
    const rr = vao / 2, hr = 3.3 + 0.6; const sh = new THREE.Shape(); sh.moveTo(-larg / 2, 0); sh.lineTo(-rr, 0); sh.lineTo(-rr, hr); sh.absarc(0, hr, rr, PI, 0, true); sh.lineTo(rr, 0); sh.lineTo(larg / 2, 0); sh.lineTo(larg / 2, hg + 0.6); sh.lineTo(-larg / 2, hg + 0.6); sh.lineTo(-larg / 2, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: prof, bevelEnabled: false, curveSegments: 20 }); g.translate(0, 0, -hp); o.add('tijolo', g, 3);
    // a moldura de pedra do arco, dos dois lados
    for (const s of [-1, 1]) { const pts = []; for (let k = 0; k <= 24; k++) { const a = PI - k / 24 * PI; pts.push(new V3(Math.cos(a) * (rr + 0.2), hr + Math.sin(a) * (rr + 0.2), s * (hp + 0.03))); } pts.unshift(new V3(-rr - 0.2, 0.6, s * (hp + 0.03))); pts.push(new V3(rr + 0.2, 0.6, s * (hp + 0.03))); o.add('pedraClara', tubo(pts, 0.24, 6), 1.4); }
    o.caixa('pedra', -larg / 2 - 0.15, 0, -hp - 0.15, -rr, 1.3, hp + 0.15, 2.2); o.caixa('pedra', rr, 0, -hp - 0.15, larg / 2 + 0.15, 1.3, hp + 0.15, 2.2);
    const yt = hg + 0.6; o.caixa('pedra', -larg / 2 - 0.2, yt - 0.02, -hp - 0.2, larg / 2 + 0.2, yt + 0.18, hp + 0.2, 2.2);
    for (const s of [-1, 1]) { o.caixa('tijolo', -larg / 2, yt + 0.18, s * (hp - 0.25) - 0.25, larg / 2, yt + 0.8, s * (hp - 0.25) + 0.25, 3); const n = Math.floor(larg / 1.9); for (let k = 0; k < n; k++) { const x0 = -larg / 2 + (k + 0.25) * larg / n; o.caixa('tijolo', x0, yt + 0.8, s * (hp - 0.25) - 0.25, x0 + larg / n * 0.55, yt + 1.5, s * (hp - 0.25) + 0.25, 3); } }
    // as folhas do portão, abertas para dentro
    for (const s of [-1, 1]) { o.entrar(s * rr, 0.6, -hp + 0.25, s * 1.32); const lf = rr - 0.1; o.caixa('madeiraEsc', s > 0 ? -lf : 0, 0, -0.09, s > 0 ? 0 : lf, 4.7, 0.09, 1.6); for (let a = 0; a < 5; a++) for (let b = 0; b < 3; b++) { const gs = new THREE.SphereGeometry(0.06, 6, 5); o.malha('ouro', gs, (s > 0 ? -1 : 1) * (0.4 + b * 0.75), 0.6 + a * 0.9, s * -0.1 + 0.0); } o.sair(); }
    if (comPlaca) { const gpl = new THREE.BoxGeometry(3.4, 1.28, 0.12); o.malha('placa', gpl, 0, hr + rr + 1.25, hp + 0.1); o.caixa('ouro', -1.78, hr + rr + 0.56, hp + 0.04, 1.78, hr + rr + 0.62, hp + 0.2); }
    lanternaPendurada(-rr - 1.3, hr + 0.9, hp + 0.5, 1.5); lanternaPendurada(rr + 1.3, hr + 0.9, hp + 0.5, 1.5);
    o.sair();
    o.entrar(cx, Y + hg + 0.16, cz, rot); pavilhao(o, { w: larg - 3.6, d: 4.2, h: 3.2, pod: 0.25, beiral: 1.35, andares, degraus: false, bico: 0.9, colR: 0.2, vao: 2.6 }); o.sair();
    bloqLocal(cx, cz, rot, -larg / 2, -hp, larg / 2, hp, 0.3); livreLocal(cx, cz, rot, -rr + 0.45, -hp - 1, rr - 0.45, hp + 1);
    // o piso do túnel
    o.entrar(cx, Y, cz, rot); const gp = new THREE.PlaneGeometry(vao, prof + 1.2).rotateX(-PI / 2); o.malha('pisoPedra', gp, 0, 0.035, 0.3, 2.2); o.sair();
  };
  portao(M.PORTAO_SUL.x, M.PORTAO_SUL.z, 0, 15, M.PORTAO_SUL.larg, 2, true);
  portao(M.PORTAO_LESTE.x, M.PORTAO_LESTE.z, PI / 2, 13, M.PORTAO_LESTE.larg, 1, true);
  portao(M.PORTAO_OESTE.x, M.PORTAO_OESTE.z, -PI / 2, 11, M.PORTAO_OESTE.larg, 1, false);

  // ---------- os pisos ----------
  {
    const xi = C.x0 + 1.4, xf = C.x1 - 1.4, zi = C.z0 + 1.4, zf = C.z1 - 1.4;
    const xs = new Set([xi, xf]), zs = new Set([zi, zf]); for (const j of JARDINS) { xs.add(j.x0); xs.add(j.x1); zs.add(j.z0); zs.add(j.z1); }
    const X = [...xs].sort((a, b) => a - b), Z = [...zs].sort((a, b) => a - b);
    for (let i = 0; i < X.length - 1; i++) for (let j = 0; j < Z.length - 1; j++) { const mx = (X[i] + X[i + 1]) / 2, mz = (Z[j] + Z[j + 1]) / 2; if (JARDINS.some(q => M.dentroRet(mx, mz, q))) continue; const g = new THREE.PlaneGeometry(X[i + 1] - X[i], Z[j + 1] - Z[j]).rotateX(-PI / 2); o.malha('pisoCalcada', g, mx, Y + 0.02, mz, 2.6); }
    const laje = (x0, z0, x1, z1, h = 0.04) => { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-PI / 2); o.malha('pisoPedra', g, (x0 + x1) / 2, Y + h, (z0 + z1) / 2, 2.2); };
    laje(-16, -4.6, 16, 10, 0.05); laje(-4.2, 10, 4.2, zf, 0.04); laje(xi, 1.4, -16, 6.6, 0.04); laje(16, 1.4, xf, 6.6, 0.04);
    const guia = (x0, z0, x1, z1) => o.caixa('pedraClara', x0, Y, z0, x1, Y + 0.11, z1, 1.4);
    guia(-4.5, 10, -4.2, zf); guia(4.2, 10, 4.5, zf); guia(-16.3, -4.6, -16, 1.4); guia(-16.3, 6.6, -16, 10); guia(16, -4.6, 16.3, 1.4); guia(16, 6.6, 16.3, 10); guia(-16, 10, -4.5, 10.3); guia(4.5, 10, 16, 10.3);
    for (const j of JARDINS) { guia(j.x0 - 0.25, j.z0 - 0.25, j.x1 + 0.25, j.z0); guia(j.x0 - 0.25, j.z1, j.x1 + 0.25, j.z1 + 0.25); guia(j.x0 - 0.25, j.z0, j.x0, j.z1); guia(j.x1, j.z0, j.x1 + 0.25, j.z1); }
  }

  // ---------- o terraço, a escadaria e o palácio ----------
  {
    const t = M.TERRACO, e = M.ESCADA, yt = Y + t.alt;
    o.caixa('tijolo', t.x0, Y - 0.3, t.z0, t.x1, yt - 0.25, t.z1, 3); o.caixa('pedraClara', t.x0 - 0.18, yt - 0.3, t.z0 - 0.18, t.x1 + 0.18, yt - 0.02, t.z1 + 0.18, 1.8);
    o.caixa('pedra', t.x0 - 0.15, Y, t.z0 - 0.15, t.x1 + 0.15, Y + 0.6, t.z1 + 0.15, 2.2);
    const gp = new THREE.PlaneGeometry(t.x1 - t.x0 + 0.3, t.z1 - t.z0 + 0.3).rotateX(-PI / 2); o.malha('pisoPedra', gp, (t.x0 + t.x1) / 2, yt, (t.z0 + t.z1) / 2, 2.2);
    balaustrada(o, t.x0 + 0.1, t.z1 - 0.1, e.x0 - 0.7, t.z1 - 0.1, yt); balaustrada(o, e.x1 + 0.7, t.z1 - 0.1, t.x1 - 0.1, t.z1 - 0.1, yt);
    balaustrada(o, t.x0 + 0.1, t.z0 + 0.1, t.x0 + 0.1, t.z1 - 0.1, yt); balaustrada(o, t.x1 - 0.1, t.z0 + 0.1, t.x1 - 0.1, t.z1 - 0.1, yt); balaustrada(o, t.x0 + 0.1, t.z0 + 0.1, t.x1 - 0.1, t.z0 + 0.1, yt);
    const nd = 12, pd = (e.z1 - e.z0) / nd, hd = t.alt / nd;
    for (let k = 0; k < nd; k++) o.caixa('pedraClara', e.x0, Y, e.z1 - (k + 1) * pd, e.x1, Y + (k + 1) * hd, e.z1 - k * pd, 1.8);
    // a rampa esculpida do meio e as laterais
    for (const s of [-1, 1]) {
      const sh = new THREE.Shape(); const Lr = e.z1 - e.z0; sh.moveTo(0, 0); sh.lineTo(Lr, 0); sh.lineTo(Lr, t.alt + 0.55); sh.lineTo(Lr - 0.3, t.alt + 0.55); sh.lineTo(0, 0.55); sh.lineTo(0, 0);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false }); g.rotateY(PI / 2); o.malha('pedraClara', g, s > 0 ? e.x1 : e.x0 - 0.6, Y, e.z1, 1.8);
      M.bloquearRet(s > 0 ? e.x1 : e.x0 - 0.6, e.z0, s > 0 ? e.x1 + 0.6 : e.x0, e.z1, 0.1);
      lanternaPedra(s * (e.x1 + 2.0), e.z1 + 0.8);
    }
    // a colisão do terraço: só se sobe pela escada
    M.bloquearRet(t.x0 - 0.2, t.z1 - 0.2, e.x0 - 0.5, t.z1 + 0.3, 0.1); M.bloquearRet(e.x1 + 0.5, t.z1 - 0.2, t.x1 + 0.2, t.z1 + 0.3, 0.1);
    M.bloquearRet(t.x0 - 0.3, t.z0 - 0.3, t.x0 + 0.3, t.z1, 0.1); M.bloquearRet(t.x1 - 0.3, t.z0 - 0.3, t.x1 + 0.3, t.z1, 0.1); M.bloquearRet(t.x0, t.z0 - 0.3, t.x1, t.z0 + 0.3, 0.1);
    // o salão do palácio
    o.entrar(0, yt, -19.6); const pal = pavilhao(o, { w: 20, d: 8.6, h: 4.7, pod: 0.55, beiral: 1.9, colR: 0.27, andares: 2, bico: 1.15, matTelha: 'telhaOuro', matParede: 'rebocoVerm', vao: 2.9, frisoAlt: 0.55 }); o.sair();
    M.bloquearRet(-10.7, -24.6, 10.7, -14.6, 0.2);
    for (let k = 0; k < 7; k++) lanternaPendurada(-8.7 + k * 2.9, yt + 4.25, -19.6 + 4.3 + 1.5, 1.15);
    // os incensários de bronze
    for (const s of [-1, 1]) {
      const x = s * 8.5, z = -12.0; o.cilindro('pedraClara', x, yt, z, 0.75, 0.4, 8, 0.65, 1.4);
      const pts = [[0.001, 0.25], [0.28, 0.25], [0.5, 0.5], [0.56, 0.8], [0.5, 1.02], [0.58, 1.08], [0.58, 1.14], [0.42, 1.14], [0.4, 1.0], [0.001, 0.95]].map(p => new THREE.Vector2(p[0], p[1])); o.malha('bronze', new THREE.LatheGeometry(pts, 16), x, yt + 0.4, z);
      for (let k = 0; k < 3; k++) { const a = k / 3 * 6.283; o.cilindro('bronze', x + Math.cos(a) * 0.36, yt + 0.4, z + Math.sin(a) * 0.36, 0.07, 0.36, 6, 0.1); }
      for (const a of [0, PI]) { const gt = new THREE.TorusGeometry(0.16, 0.035, 6, 12); gt.rotateY(PI / 2); o.malha('bronze', gt, x + Math.cos(a) * 0.62, yt + 1.5, z); }
      o.caixa('brasa', x - 0.3, yt + 1.36, z - 0.3, x + 0.3, yt + 1.4, z + 0.3); ctx.fumacas.push({ x, y: yt + 1.5, z, tipo: 'incenso' }); M.bloquearCirc(x, z, 0.75);
    }
    mastro(-12.6, -11.4, yt, 6.2, 0xc89a28); mastro(12.6, -11.4, yt, 6.2, 0xc89a28);
  }

  // ---------- a praça: o caldeirão de bronze e o círculo do teleporte ----------
  {
    const x = 0, z = 3.6; o.cilindro('pedraClara', x, Y, z, 1.7, 0.3, 12, 1.6, 1.4); o.cilindro('pedraClara', x, Y + 0.3, z, 1.25, 0.3, 12, 1.15, 1.4);
    const pts = [[0.001, 0.3], [0.45, 0.3], [0.8, 0.6], [0.95, 1.05], [0.9, 1.4], [1.0, 1.5], [1.0, 1.6], [0.8, 1.6], [0.76, 1.42], [0.001, 1.3]].map(p => new THREE.Vector2(p[0], p[1])); o.malha('bronze', new THREE.LatheGeometry(pts, 20), x, Y + 0.6, z);
    for (let k = 0; k < 3; k++) { const a = k / 3 * 6.283 + 0.5; o.cilindro('bronze', x + Math.cos(a) * 0.6, Y + 0.6, z + Math.sin(a) * 0.6, 0.1, 0.5, 6, 0.15); }
    for (const a of [0, PI]) { const gt = new THREE.TorusGeometry(0.22, 0.05, 6, 12); gt.rotateY(PI / 2); o.malha('bronze', gt, x + Math.cos(a) * 1.05, Y + 2.25, z); }
    o.cilindro('brasa', x, Y + 2.0, z, 0.72, 0.05, 14); ctx.fumacas.push({ x, y: Y + 2.15, z, tipo: 'incenso', forte: 1 }); ctx.fogos.push({ x, y: Y + 2.1, z, s: 0.8 }); M.bloquearCirc(x, z, 1.75);
    // o teleporte
    const tx = -11.5, tz = -0.8; o.cilindro('pedraClara', tx, Y, tz, 2.1, 0.16, 24, 2.0, 1.4); o.cilindro('pedra', tx, Y + 0.16, tz, 1.7, 0.05, 24, 1.7, 2.2);
    const ga = new THREE.TorusGeometry(1.45, 0.05, 6, 40).rotateX(PI / 2); o.malha('runa', ga, tx, Y + 0.23, tz); const gb = new THREE.TorusGeometry(0.85, 0.035, 6, 32).rotateX(PI / 2); o.malha('runa', gb, tx, Y + 0.23, tz);
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; o.entrar(tx + Math.cos(a) * 1.15, Y + 0.215, tz + Math.sin(a) * 1.15, -a); o.caixa('runa', -0.2, 0, -0.03, 0.2, 0.03, 0.03); o.sair(); }
    for (let k = 0; k < 4; k++) { const a = k / 4 * 6.283 + PI / 4; const px = tx + Math.cos(a) * 2.35, pz = tz + Math.sin(a) * 2.35; o.cilindro('pedraClara', px, Y, pz, 0.2, 1.7, 8, 0.15, 1.4); o.caixa('runa', px - 0.09, Y + 1.72, pz - 0.09, px + 0.09, Y + 1.9, pz + 0.09); M.bloquearCirc(px, pz, 0.25); }
    ctx.teleporte = { x: tx, y: Y + 0.25, z: tz };
  }

  // ---------- a avenida: cerejeiras e lanternas ----------
  for (const s of [-1, 1]) { for (const z of [13.2, 19.6, 26]) { canteiro(s * 5.9, z, 2, 0.66 + r() * 0.1); } for (const z of [16.4, 22.8]) lanternaPedra(s * 5.9, z); }
  for (const [x, z] of [[-15.2, -3.8], [15.2, -3.8], [-15.2, 9.2], [15.2, 9.2]]) lanternaPedra(x, z);

  // ---------- o bairro das casas (sudoeste) ----------
  {
    muro(o, -31.8, 12, -20.6, 12); muro(o, -18.4, 12, -7, 12); muro(o, -7, 12, -7, 18.8); muro(o, -7, 21.2, -7, 28.2); muro(o, -19.5, 12, -19.5, 16.8); muro(o, -19.5, 23.2, -19.5, 28.2);
    // os portais dos muros
    for (const [x, z, rot] of [[-19.5, 12, 0], [-7, 20, PI / 2]]) { o.entrar(x, Y, z, rot); for (const s of [-1, 1]) o.cilindro('laca', s * 1.15, 0, 0, 0.13, 2.9, 8, 0.12, 1.6); o.caixa('madeiraEsc', -1.5, 2.55, -0.12, 1.5, 2.8, 0.12, 1.5); o.entrar(0, 2.9, 0); telhado(o, { W: 3.9, D: 1.9, w: 2.2, d: 0, H: 0.7, bico: 0.35, nu: 8, nv: 4, cumeR: 0.12 }); o.sair(); o.sair(); M.bloquearCirc(x + (rot ? 0 : -1.15), z + (rot ? -1.15 : 0), 0.2); M.bloquearCirc(x + (rot ? 0 : 1.15), z + (rot ? 1.15 : 0), 0.2); }
    const casa = (x, z, w, d, rot, parede, tel = 'telha') => { o.entrar(x, Y, z, rot); pavilhao(o, { w, d, h: 3.1, pod: 0.35, beiral: 1.05, matParede: parede, matTelha: tel, bico: 0.6 }); o.sair(); bloqLocal(x, z, rot, -w / 2 - 0.6, -d / 2 - 0.6, w / 2 + 0.6, d / 2 + 0.6, 0.15); };
    casa(-26, 15.2, 9, 4.4, 0, 'reboco'); casa(-26, 25.2, 9, 4.4, PI, 'rebocoOcre'); casa(-13.3, 15.2, 8.4, 4.4, 0, 'rebocoOcre'); casa(-13.3, 25.2, 8.4, 4.4, PI, 'reboco');
    ctx.arvoresVila.push({ tipo: 1, x: -28.5, z: 20, esc: 0.8 }, { tipo: 2, x: -23.2, z: 20.2, esc: 0.9 }, { tipo: 2, x: -15.4, z: 19.6, esc: 0.85 });
    // o poço
    const px = -11, pz = 20.4; o.cilindro('pedra', px, Y, pz, 0.85, 0.75, 12, 0.85, 1.4); o.cilindro('ferro', px, Y + 0.6, pz, 0.68, 0.02, 12); for (const s of [-1, 1]) o.cilindro('madeira', px + s * 0.8, Y, pz, 0.07, 2.2, 6); o.cilindro('madeira', px, Y + 1.72, pz, 0.05, 0.1, 6);
    o.caixa('madeira', px - 0.85, Y + 1.78, pz - 0.05, px + 0.85, Y + 1.86, pz + 0.05, 1); o.entrar(px, Y + 2.15, pz); telhado(o, { W: 2.4, D: 1.9, w: 1.2, d: 0, H: 0.6, bico: 0.25, nu: 6, nv: 4, cumeR: 0.1, enfeite: false }); o.sair(); M.bloquearCirc(px, pz, 0.95);
    for (const [x, z] of [[-30.6, 16.9], [-21.6, 23.4], [-8.4, 23]]) { barril(x, z); }
    vaso(-22.6, 17.2, Y, 1.1, 'tijoloCinza'); vaso(-9.4, 17, Y, 1.2, 'tijoloCinza'); vaso(-17.3, 23.2, Y, 0.9, 'bronze');
  }

  // ---------- a feira, o armazém e a forja (sudeste) ----------
  {
    banca(8.4, 13.9, PI / 2, 'panoVerm'); banca(8.4, 18.1, PI / 2, 'panoAzul'); banca(11.2, 11.6, PI, 'panoOcre'); banca(15.6, 11.6, PI, 'panoVerde');
    // o armazém
    o.entrar(23.4, Y, 16.2); pavilhao(o, { w: 11, d: 5.6, h: 3.5, pod: 0.4, beiral: 1.2, matParede: 'rebocoOcre', bico: 0.7 }); o.sair(); M.bloquearRet(17.3, 12.8, 29.5, 19.6, 0.15);
    for (const [x, z, s] of [[18.6, 20.6, 0.8], [19.5, 20.5, 0.7], [18.9, 20.6, 0.6], [27.6, 20.7, 0.9], [28.6, 20.6, 0.7]]) caixote(x, z, s, Y, r() * 0.5);
    caixote(18.9, 20.6, 0.55, Y + 0.8, 0.3); barril(26.5, 20.5); barril(29.2, 21.6); saco(21, 20.6); saco(21.6, 20.9); saco(21.3, 20.7, Y + 0.38, 0.9); M.bloquearRet(18.1, 20.1, 21.9, 21.2, 0.1); M.bloquearRet(27.1, 20.2, 29, 21.1, 0.1);
    // a forja: um galpão aberto, a fornalha, a bigorna
    const fx = 12.6, fz = 23.2; M.plataformas.push({ x0: fx - 3.65, x1: fx + 3.65, z0: fz - 2.65, z1: fz + 2.65, y: Y + 0.15 }); o.entrar(fx, Y, fz); pavilhao(o, { w: 6.2, d: 4.2, h: 3.0, pod: 0.15, beiral: 0.9, aberto: true, degraus: false, bico: 0.5, colR: 0.15, vao: 3.1, consolo: false }); o.sair();
    for (const [a, b] of [[-3.1, -2.1], [3.1, -2.1], [-3.1, 2.1], [3.1, 2.1], [0, -2.1], [0, 2.1]]) M.bloquearCirc(fx + a, fz + b, 0.22);
    o.entrar(fx - 1.5, Y + 0.15, fz - 1.1); o.caixa('tijoloCinza', -0.9, 0, -0.8, 0.9, 1.3, 0.8, 2.6); o.caixa('tijoloCinza', -0.55, 1.3, -0.55, 0.55, 2.2, 0.55, 2.6); o.caixa('tijoloCinza', -0.3, 2.2, -0.3, 0.3, 4.4, 0.3, 2.6);
    o.caixa('brasa', -0.45, 0.45, 0.78, 0.45, 0.95, 0.83); o.caixa('ferro', -0.55, 0.36, 0.8, 0.55, 0.45, 0.86); o.sair(); M.bloquearRet(fx - 2.4, fz - 1.9, fx - 0.6, fz - 0.3, 0.1);
    ctx.fumacas.push({ x: fx - 1.5, y: Y + 4.6, z: fz - 1.1, tipo: 'chamine' }); ctx.fogos.push({ x: fx - 1.5, y: Y + 0.85, z: fz - 0.2, s: 0.5 }); ctx.luzes.push({ x: fx - 1.4, y: Y + 1.2, z: fz + 0.2, cor: 0xff6a20, forca: 14, raio: 7 });
    // a bigorna
    const bx = fx + 0.7, bz = fz + 0.5; o.cilindro('madeira', bx, Y + 0.15, bz, 0.3, 0.45, 10); o.caixa('ferro', bx - 0.14, Y + 0.6, bz - 0.11, bx + 0.14, Y + 0.72, bz + 0.11); o.caixa('ferro', bx - 0.34, Y + 0.72, bz - 0.13, bx + 0.3, Y + 0.86, bz + 0.13);
    const gc = new THREE.ConeGeometry(0.1, 0.34, 8).rotateZ(PI / 2); o.malha('ferro', gc, bx - 0.5, Y + 0.8, bz); M.bloquearCirc(bx, bz, 0.4); ctx.bigorna = { x: bx, y: Y + 0.86, z: bz };
    barril(fx + 2.3, fz - 1.2); o.cilindro('ferro', fx + 2.3, Y + 0.9, fz - 1.2, 0.3, 0.02, 10);
    // o cabide de armas
    o.entrar(fx + 2.2, Y + 0.15, fz + 1.4, 0); o.caixa('madeiraEsc', -0.8, 0, -0.06, -0.7, 1.5, 0.06, 1); o.caixa('madeiraEsc', 0.7, 0, -0.06, 0.8, 1.5, 0.06, 1); o.caixa('madeiraEsc', -0.8, 1.2, -0.05, 0.8, 1.28, 0.05, 1); o.caixa('madeiraEsc', -0.8, 0.5, -0.05, 0.8, 0.58, 0.05, 1);
    for (let k = 0; k < 4; k++) { const xx = -0.55 + k * 0.37; o.caixa('ferro', xx - 0.03, 0.55, 0.06, xx + 0.03, 1.75, 0.08); o.caixa('ouro', xx - 0.12, 0.5, 0.05, xx + 0.12, 0.55, 0.09); o.caixa('madeiraEsc', xx - 0.025, 0.2, 0.05, xx + 0.025, 0.5, 0.09, 1); } o.sair(); M.bloquearRet(fx + 1.4, fz + 1.2, fx + 3.0, fz + 1.6, 0.1);
  }

  // ---------- o jardim do pagode (noroeste) ----------
  {
    muro(o, -17.3, -27.8, -17.3, -12.2); muro(o, -17.3, -9.4, -17.3, -1); muro(o, -32, -1, -25.6, -1); muro(o, -23.4, -1, -17.3, -1);
    const px = -24.6, pz = -18.5; let w = 6.6, y = Y; o.cilindro('pedra', px, Y, pz, 5.6, 0.5, 8, 5.6, 2.2); o.cilindro('pedraClara', px, Y + 0.5, pz, 5.0, 0.35, 8, 5.0, 1.8); y += 0.85;
    for (let k = 0; k < 5; k++) {
      const h = 2.7 - k * 0.12; o.entrar(px, y, pz);
      o.caixa(k % 2 ? 'reboco' : 'rebocoVerm', -w / 2, 0, -w / 2, w / 2, h, w / 2, 3);
      for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) o.cilindro('laca', a * w / 2, 0, b * w / 2, 0.19, h, 10, 0.17, 1.6);
      for (const [rot] of [[0], [PI / 2], [PI], [-PI / 2]]) { o.entrar(0, 0, 0, rot); const g = new THREE.BoxGeometry(w * 0.42, h - 1.0, 0.07); o.malha(k === 0 && rot === 0 ? 'porta' : 'trelica', g, 0, h / 2 + 0.05, w / 2 + 0.03); o.faixa('pintura', -w / 2 - 0.08, h - 0.4, w / 2 - 0.06, w / 2 + 0.08, h, w / 2 + 0.1); o.sair(); }
      const W = w + 2.5 - k * 0.12;
      if (k < 4) telhado(o, { W, D: W, w: w - 1.0, d: w - 1.0, H: 1.05, bico: 0.85, y: h, mat: 'telhaVerde', nu: 12, nv: 6, p: 1.35, enfeite: false });
      else telhado(o, { W, D: W, w: 0, d: 0, H: 2.4, bico: 0.95, y: h, mat: 'telhaVerde', nu: 12, nv: 8, p: 1.7, enfeite: false });
      for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) lanternaPendurada(a * (W / 2 - 0.25), h - 0.25, b * (W / 2 - 0.25), 0.8);
      o.sair(); y += h + (k < 4 ? 0.8 : 2.4); w -= 1.0;
    }
    // a agulha dourada
    o.cilindro('ouro', px, y - 0.15, pz, 0.3, 0.4, 10, 0.22); for (let k = 0; k < 5; k++) { const g = new THREE.TorusGeometry(0.34 - k * 0.045, 0.07, 6, 14).rotateX(PI / 2); o.malha('ouro', g, px, y + 0.45 + k * 0.38, pz); } o.cilindro('ouro', px, y + 0.2, pz, 0.07, 2.6, 8, 0.03); const gs = new THREE.SphereGeometry(0.2, 10, 8); o.malha('ouro', gs, px, y + 2.85, pz);
    M.bloquearCirc(px, pz, 5.4); ctx.pagode = { x: px, z: pz, topo: y + 3 };
    // o jardim: árvores, pedras de passo e lanternas
    for (const [t, x, z, e] of [[3, -29.6, -25.2, 0.7], [1, -20.2, -25.4, 0.75], [2, -30, -10.6, 0.9], [2, -19.6, -6.4, 0.85], [1, -29.8, -4.4, 0.7], [3, -19.4, -12.6, 0.6]]) ctx.arvoresVila.push({ tipo: t, x, z, esc: e });
    for (let k = 0; k < 9; k++) { const z = -2 - k * 1.2; const x = -24.5 + Math.sin(k * 0.9) * 0.5; o.cilindro('pedra', x, Y + 0.02, z, 0.42 + r() * 0.12, 0.07, 7, 0.4, 1.4); }
    lanternaPedra(-22.6, -4.2); lanternaPedra(-26.6, -10.6);
  }

  // ---------- o quartel (nordeste) ----------
  {
    muro(o, 17.3, -27.8, 17.3, -12.2); muro(o, 17.3, -9.4, 17.3, -1); muro(o, 17.3, -1, 23.4, -1); muro(o, 25.8, -1, 32, -1);
    o.entrar(24.8, Y, -23); pavilhao(o, { w: 12, d: 5, h: 3.4, pod: 0.4, beiral: 1.2, matParede: 'reboco', bico: 0.7 }); o.sair(); M.bloquearRet(18.2, -26.2, 31.4, -19.9, 0.15);
    o.entrar(28.2, Y, -6); pavilhao(o, { w: 5.6, d: 4.6, h: 3.0, pod: 0.3, beiral: 0.95, matParede: 'rebocoOcre', bico: 0.55 }); o.sair(); M.bloquearRet(24.8, -8.9, 31.6, -3.1, 0.15);
    for (const [x, z] of [[20.6, -15.5], [24.2, -15.5], [27.8, -15.5]]) boneco(x, z, Y);
    mastro(19, -18.6, Y, 6, 0xa82a1c); mastro(30.6, -18.6, Y, 6, 0xa82a1c);
    o.entrar(21.5, Y, -10.4); o.caixa('madeiraEsc', -1.2, 0, -0.06, -1.1, 1.6, 0.06, 1); o.caixa('madeiraEsc', 1.1, 0, -0.06, 1.2, 1.6, 0.06, 1); o.caixa('madeiraEsc', -1.2, 1.3, -0.05, 1.2, 1.38, 0.05, 1); for (let k = 0; k < 6; k++) { const xx = -0.9 + k * 0.36; o.cilindro('madeira', xx, 0.1, 0.07, 0.022, 2.3, 5); const gc = new THREE.ConeGeometry(0.05, 0.3, 6); o.malha('ferro', gc, xx, 2.55, 0.07); } o.sair(); M.bloquearRet(20.2, -10.7, 22.8, -10.1, 0.1);
    ctx.arvoresVila.push({ tipo: 0, x: 30, z: -12.6, esc: 0.7 });
  }
  function boneco(x, z, y0) { o.cilindro('madeira', x, y0, z, 0.09, 1.7, 6); o.caixa('madeira', x - 0.7, y0 + 1.25, z - 0.05, x + 0.7, y0 + 1.35, z + 0.05, 1); const g = new THREE.CylinderGeometry(0.3, 0.26, 0.85, 10); o.malha('palha', g, x, y0 + 1.05, z); const gh = new THREE.SphereGeometry(0.2, 10, 8); o.malha('palha', gh, x, y0 + 1.82, z); o.cilindro('pedra', x, y0, z, 0.3, 0.1, 8); M.bloquearCirc(x, z, 0.35); }

  // faixas do meio (leste e oeste da praça): árvores e bancos
  for (const [x, z, t] of [[-22, 8.9, 1], [-28, 9, 0], [21.5, 9, 2], [27.5, 9.1, 1]]) canteiro(x, z, t, 0.75);

  // ---------- fora dos muros ----------
  const hT = (x, z) => altura(x, z);
  const cerca = (pts, fecha = false, altc = 1.0) => {
    const P = []; for (let i = 0; i < pts.length - (fecha ? 0 : 1); i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const n = Math.max(1, Math.round(L / 2.1)); for (let k = 0; k < n; k++) P.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n, k === 0]); } if (!fecha) P.push([...pts[pts.length - 1], true]);
    for (let i = 0; i < P.length; i++) { const [x, z] = P[i]; const y = hT(x, z); o.cilindro('madeira', x, y - 0.2, z, 0.065, altc + 0.3, 6, 0.055); const nx = P[(i + 1) % P.length]; if (i === P.length - 1 && !fecha) break; for (const hh of [0.45, 0.85]) o.add('madeira', tubo([new V3(x, y + hh * altc, z), new V3(nx[0], hT(nx[0], nx[1]) + hh * altc, nx[1])], 0.04, 5)); }
  };
  // o campo de treino
  {
    const t = M.TREINO; cerca([[t.x1, 42.5], [t.x1, t.z0], [t.x0, t.z0], [t.x0, t.z1], [t.x1, t.z1], [t.x1, 45.5]]);
    for (const z of [39.6, 43, 46.4, 49.8]) {
      const x = t.x0 + 1.6, y = hT(x, z); o.entrar(x, y, z, PI / 2);
      for (const [a, b] of [[-0.5, 0], [0.5, 0], [0, -0.7]]) o.add('madeira', tubo([new V3(a, 0, b), new V3(0, 1.25, -0.06)], 0.035, 5));
      const g = new THREE.CylinderGeometry(0.62, 0.62, 0.16, 20).rotateX(PI / 2); o.malha('palha', g, 0, 1.25, 0.04); const gf = new THREE.CircleGeometry(0.6, 24); o.malha('alvo', gf, 0, 1.25, 0.125);
      o.sair(); M.bloquearCirc(x, z, 0.5); ctx.alvosTreino.push({ x: x + 0.2, y: y + 1.25, z });
    }
    for (const [x, z] of [[-12, 40], [-12, 44.5], [-12, 49]]) boneco(x, z, hT(x, z));
    ctx.bonecos = [[-12, 40], [-12, 44.5], [-12, 49]];
  }
  // a roça
  {
    const t = M.ROCA; cerca([[t.x0 - 0.6, 45.6], [t.x0 - 0.6, t.z0 - 0.6], [t.x1 + 0.6, t.z0 - 0.6], [t.x1 + 0.6, t.z1 + 0.6], [t.x0 - 0.6, t.z1 + 0.6], [t.x0 - 0.6, 48.4]], false, 0.9);
    const ex = 17.0, ez = 47.8, ey = hT(ex, ez); o.cilindro('madeira', ex, ey, ez, 0.05, 2.0, 6); o.caixa('madeira', ex - 0.75, ey + 1.45, ez - 0.04, ex + 0.75, ey + 1.53, ez + 0.04, 1); const g = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 8); o.malha('panoCru', g, ex, ey + 1.2, ez); const gh = new THREE.SphereGeometry(0.19, 8, 6); o.malha('palha', gh, ex, ey + 1.8, ez); const gc = new THREE.ConeGeometry(0.34, 0.26, 10); o.malha('palha', gc, ex, ey + 2.03, ez);
    // a casa da roça
    const cx = 36.5, cz = 46, cy = hT(cx, cz); o.entrar(cx, cy - 0.1, cz, -PI / 2); pavilhao(o, { w: 6.4, d: 4.2, h: 2.8, pod: 0.4, beiral: 0.95, matParede: 'rebocoOcre', bico: 0.5 }); o.sair(); M.bloquearRet(cx - 2.8, cz - 3.9, cx + 2.8, cz + 3.9, 0.15);
    saco(33.4, 44.2, hT(33.4, 44.2)); saco(33.5, 44.9, hT(33.5, 44.9)); barril(33.3, 47.6, hT(33.3, 47.6));
  }
  // o lago: o píer, o pavilhão da margem e as vitórias-régias
  {
    const px = M.LAGO.x + M.LAGO.r + 1.2, pz = M.LAGO.z - 1.5; const yp = 0.42;
    for (let k = 0; k < 16; k++) o.caixa('madeira', px - k * 0.5 - 0.48, yp, pz - 0.85 + (k % 2) * 0.03, px - k * 0.5 - 0.02, yp + 0.07, pz + 0.85, 1.2);
    for (let k = 0; k < 5; k++) for (const s of [-1, 1]) o.cilindro('madeira', px - k * 1.9 - 0.2, -2, pz + s * 0.8, 0.08, 2 + yp + 0.5, 6);
    M.liberarRet(px - 7.8, pz - 0.6, px + 1, pz + 0.6); M.plataformas.push({ x0: px - 8, x1: px + 0.3, z0: pz - 0.85, z1: pz + 0.85, y: yp + 0.07 });
    const gx = M.LAGO.x + 6, gz = M.LAGO.z + M.LAGO.r + 5.5, gy = hT(gx, gz); o.entrar(gx, gy - 0.15, gz); pavilhao(o, { w: 4.2, d: 4.2, h: 2.9, pod: 0.45, beiral: 1.15, aberto: true, bico: 0.8, colR: 0.16, vao: 4.2, matTelha: 'telhaVerde' }); o.sair();
    for (const [a, b] of [[-2.1, -2.1], [2.1, -2.1], [2.1, 2.1], [-2.1, 2.1]]) M.bloquearCirc(gx + a, gz + b, 0.25); M.plataformas.push({ x0: gx - 2.65, x1: gx + 2.65, z0: gz - 2.65, z1: gz + 2.65, y: gy + 0.3 });
    const rr = M.semente(8); const gl = []; let n = 0, tent = 0;
    while (n < 46 && tent++ < 900) { const a = rr() * 6.283, d = rr() * (M.LAGO.r + 2); const x = M.LAGO.x + Math.cos(a) * d, z = M.LAGO.z + Math.sin(a) * d; const h = hT(x, z); if (h > -0.25 || h < -1.6) continue; const s = 0.25 + rr() * 0.3; const g = new THREE.CircleGeometry(s, 12, 0.5, 5.8).rotateX(-PI / 2).rotateY(rr() * 6.283); g.translate(x, 0.035, z); gl.push([g, x, z, s]); n++; }
    for (const [g] of gl) o.add('folhaLotus', g, 1); for (const [, x, z, s] of gl) if (rr() < 0.3) { const gf = new THREE.SphereGeometry(0.1, 8, 6); gf.scale(1, 0.8, 1); o.malha('florLotus', gf, x + s * 0.3, 0.12, z); }
    mt.folhaLotus = new THREE.MeshStandardMaterial({ color: 0x3f7a35, roughness: 0.55, envMapIntensity: 0.6 }); mt.florLotus = new THREE.MeshStandardMaterial({ color: 0xf0a8c0, roughness: 0.6, emissive: 0x401020, emissiveIntensity: 0.3 });
  }
  // o mirante
  {
    const x = M.MIRANTE.x, z = M.MIRANTE.z, y = hT(x, z); o.cilindro('pedra', x, y - 1.9, z, 4.0, 1.95, 10, 3.6, 2.2);
    o.entrar(x, y + 0.05, z); M.plataformas.push({ x0: x - 2.75, x1: x + 2.75, z0: z - 2.75, z1: z + 2.75, y: y + 0.35 }); pavilhao(o, { w: 4.4, d: 4.4, h: 3.0, pod: 0.3, beiral: 1.25, aberto: true, bico: 0.9, colR: 0.17, vao: 4.4, degraus: false }); o.caixa('madeira', -1.2, 0.3, -1.95, 1.2, 0.75, -1.4, 1.2); o.sair();   // o banco fica no lado norte: o meio é o caminho da ponte
    for (const [a, b] of [[-2.2, -2.2], [2.2, -2.2], [2.2, 2.2], [-2.2, 2.2]]) M.bloquearCirc(x + a, z + b, 0.25); M.bloquearRet(x - 1.2, z - 1.95, x + 1.2, z - 1.4, 0.1);
    lanternaPedra(x - 3.2, z + 2.6, y + 0.1);
  }
  // a estrada do leste: a placa da bifurcação e a cerca
  { const x = 45.2, z = 6.3, y = hT(x, z); o.cilindro('madeira', x, y - 0.2, z, 0.07, 2.4, 6); o.entrar(x, y + 1.75, z, 0.5); o.caixa('madeira', -0.05, 0, -0.03, 1.05, 0.3, 0.03, 1); o.sair(); o.entrar(x, y + 1.35, z, -1.2); o.caixa('madeira', -0.05, 0, -0.03, 0.95, 0.28, 0.03, 1); o.sair();
    cerca([[36.4, 6.6], [39.5, 6.9], [42.6, 6.6]], false, 0.9); cerca([[36.4, 1.6], [40, 2.2], [44, 1.2], [48, 0.2]], false, 0.9); }

  // ---------- braseiros, bancos, carroças, fardos e arbustos floridos ----------
  for (const s of [-1, 1]) { braseiro(s * 6.7, 34.4, altura(s * 6.7, 34.4)); braseiro(s * 6.2, -11.2, Y + M.TERRACO.alt); }
  braseiro(38.5, 0.2, altura(38.5, 0.2)); braseiro(38.5, 7.9, altura(38.5, 7.9)); braseiro(-38.4, 0.4, altura(-38.4, 0.4)); braseiro(-38.4, 7.6, altura(-38.4, 7.6));
  braseiro(M.MIRANTE.x - 3.2, M.MIRANTE.z - 2.7, altura(M.MIRANTE.x - 3.2, M.MIRANTE.z - 2.7));
  banco(-12.4, 9.3); banco(-7.6, 9.3); banco(-14.9, -1.6, PI / 2); banco(14.9, -1.6, PI / 2);
  carroca(25.6, 22.9, 0.25); fardo(22.9, 23.6, Y, 0.4); fardo(23.2, 24.6, Y, 1.2); carroca(34.2, 50.2, 1.3, altura(34.2, 50.2));
  for (const [x, z] of [[8.2, 51.5], [7.6, 52.6], [-6.2, 39.2], [-6, 47.6], [32.6, 40.6]]) fardo(x, z, altura(x, z), x * 1.3);
  for (const [x, z, e] of [[-30.6, -2.6, 0.8], [-18.7, -2.5, 0.7], [-30.7, -26.4, 0.9], [-18.6, -26.5, 0.8], [-29.6, 19.2, 0.7], [-22.4, 21.4, 0.6], [-16.6, 21.3, 0.6], [-9.9, 19.1, 0.7], [18.7, -2.5, 0.7], [31, -2.5, 0.8], [-27.6, -13.2, 0.9], [-21, -8.4, 0.7]]) ctx.arvoresVila.push({ tipo: 5, x, z, esc: e });

  // ---------- os moradores ----------
  ctx.npcs.push(
    { nome: 'Guarda Sigrid', titulo: 'Guarda do portão sul', modelo: 'guardia', x: 3.4, z: 24.6, rot: -PI / 2, anim: 'parado' },
    { nome: 'Armeiro Bjorn', titulo: 'Armas e armaduras', modelo: 'bjorn', x: 15.6, z: 9.6, rot: PI, anim: 'parado' },
    { nome: 'Feirante Hilda', titulo: 'Poções e mantimentos', modelo: 'hilda', x: 11.2, z: 9.5, rot: PI, anim: 'parado' },
    { nome: 'Ferreiro', titulo: 'Refino de itens', modelo: 'ferreiro', x: 13.9, z: 24.3, rot: -2.3, anim: 'martelando' },
    { nome: 'Guardião do Armazém', titulo: 'Armazém', modelo: 'armazem', x: 23.4, z: 20.9, rot: 0, anim: 'parado' },
    { nome: 'Guarda', titulo: 'Teleportador', modelo: 'guarda', x: -11.5, z: 2.4, rot: 0, anim: 'parado' },
    { nome: 'Guarda', titulo: 'Portão sul', modelo: 'guarda', x: -4.1, z: 35.2, rot: 0, anim: 'parado' },
    { nome: 'Guarda', titulo: 'Portão sul', modelo: 'guarda', x: 4.1, z: 35.2, rot: 0, anim: 'parado' },
    { nome: 'Guarda', titulo: 'Portão leste', modelo: 'guarda', x: 39.9, z: 9.4, rot: PI / 2, anim: 'parado' },
  );
  for (const n of ctx.npcs) M.bloquearCirc(n.x, n.z, 0.4);

  ctx.obras = o.finalizar(ctx.cena, mt, { semSombra: ['pisoPedra', 'pisoCalcada', 'folhaLotus', 'luzPapel', 'brasa', 'runa'] });
  criarBandeiras(ctx);
}

function criarBandeiras(ctx) {
  const g = new THREE.PlaneGeometry(1, 1, 6, 14); g.translate(0, -0.5, 0);
  for (const b of ctx.bandeiras) {
    const m = new THREE.MeshStandardMaterial({ map: ctx.T.tec.cor, normalMap: ctx.T.tec.normal, color: b.cor, side: THREE.DoubleSide, roughness: 0.9, envMapIntensity: 0.3 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uT = ctx.uTempo; sh.uniforms.uF = { value: b.x * 0.7 + b.z * 0.3 }; sh.uniforms.uVento = ctx.vento.u;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT,uF; uniform vec3 uVento;').replace('#include <begin_vertex>', `#include <begin_vertex>
        float k=-position.y; float fv=.55+.6*uVento.z; float w1=(sin(uT*2.6*fv+uF+k*5.)*.16*k+sin(uT*4.3*fv+uF*1.7+k*9.+position.x*4.)*.05*k)*fv; transformed.z+=w1+k*.12*uVento.z; transformed.x+=sin(uT*1.9+uF+k*3.)*.07*k*fv; transformed.y+=k*k*.05*uVento.z;`);
    };
    const mesh = new THREE.Mesh(g, m); mesh.scale.set(b.larg, b.alt, 1); mesh.position.set(b.x, b.y, b.z); mesh.castShadow = true; ctx.cena.add(mesh);
  }
}
