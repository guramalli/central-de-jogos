// Os efeitos: partículas (luz somada e fumaça), rastros, flechas, clarões, marcas no chão, arcos de raio, colunas de luz, espirais de vento.
import * as THREE from 'three';
import { piso } from './natureza.js';

const V3 = THREE.Vector3;
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const rs = (a = 1) => (Math.random() - 0.5) * 2 * a;

// atlas 4x4 desenhado no canvas (células de 256): 0 brilho, 1 fumaça, 2 estrela, 3 folha, 4 língua de fogo, 5 anel, 6 estilhaço,
// 7 risco, 8 pena, 9 bolha, 10 fiapo de fumaça, 11 runa, 12 gota
function atlas() {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'); const cel = (i) => [(i % 4) * 256, Math.floor(i / 4) * 256];
  const noCel = (i, f) => { const [x, y] = cel(i); g.save(); g.beginPath(); g.rect(x, y, 256, 256); g.clip(); g.translate(x, y); f(); g.restore(); };
  const rad = (x, y, r, paradas) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); for (const [p, a] of paradas) gr.addColorStop(p, `rgba(255,255,255,${a})`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); };
  noCel(0, () => rad(128, 128, 126, [[0, 1], [0.25, 0.75], [0.6, 0.2], [1, 0]]));
  noCel(1, () => { for (let k = 0; k < 46; k++) { const a = Math.random() * 6.283, d = Math.random() * 62; rad(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 34 + Math.random() * 44, [[0, 0.10 + Math.random() * 0.12], [1, 0]]); } g.globalCompositeOperation = 'destination-in'; rad(128, 128, 127, [[0, 1], [0.45, 1], [1, 0]]); });
  noCel(2, () => { rad(128, 128, 120, [[0, 1], [0.12, 0.9], [0.3, 0.25], [1, 0]]); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineCap = 'round'; for (const [a, l, w] of [[0, 118, 5], [Math.PI / 2, 118, 5], [Math.PI / 4, 62, 3], [-Math.PI / 4, 62, 3]]) { g.lineWidth = w; g.beginPath(); g.moveTo(128 - Math.cos(a) * l, 128 - Math.sin(a) * l); g.lineTo(128 + Math.cos(a) * l, 128 + Math.sin(a) * l); g.stroke(); } });
  noCel(3, () => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(128, 30); g.bezierCurveTo(194, 74, 194, 164, 128, 226); g.bezierCurveTo(62, 164, 62, 74, 128, 30); g.fill(); g.strokeStyle = 'rgba(190,190,190,1)'; g.lineWidth = 4; g.beginPath(); g.moveTo(128, 34); g.lineTo(128, 222); g.stroke(); });
  noCel(4, () => { for (let k = 0; k < 26; k++) { const t = Math.random(); const y = 226 - t * 190; const x = 128 + (Math.random() - 0.5) * 80 * (1 - t * 0.8) + Math.sin(t * 5 + k) * 10; const r = (46 - t * 30) * (0.7 + Math.random() * 0.6); rad(x, y, r, [[0, 0.5], [0.5, 0.22], [1, 0]]); } rad(128, 196, 60, [[0, 0.9], [0.5, 0.4], [1, 0]]); g.globalCompositeOperation = 'destination-in'; const gr = g.createLinearGradient(0, 20, 0, 250); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.3, 'rgba(0,0,0,0.9)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  noCel(5, () => { g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 9; g.beginPath(); g.arc(128, 128, 104, 0, 6.283); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 22; g.beginPath(); g.arc(128, 128, 100, 0, 6.283); g.stroke(); });
  noCel(6, () => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(60, 190); g.lineTo(112, 40); g.lineTo(206, 110); g.lineTo(170, 214); g.closePath(); g.fill(); g.fillStyle = 'rgba(150,150,150,1)'; g.beginPath(); g.moveTo(112, 40); g.lineTo(206, 110); g.lineTo(134, 128); g.closePath(); g.fill(); });
  noCel(7, () => { const gr = g.createLinearGradient(8, 0, 248, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(128, 128, 120, 9, 0, 0, 6.283); g.fill(); });
  noCel(8, () => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(128, 20); g.bezierCurveTo(176, 70, 170, 170, 132, 236); g.bezierCurveTo(88, 170, 82, 70, 128, 20); g.fill(); g.strokeStyle = 'rgba(170,170,170,1)'; g.lineWidth = 3; g.beginPath(); g.moveTo(128, 24); g.lineTo(131, 246); g.stroke(); g.lineWidth = 1.5; for (let k = 0; k < 14; k++) { const y = 46 + k * 13; g.beginPath(); g.moveTo(129, y); g.lineTo(129 - 34, y + 16); g.moveTo(129, y); g.lineTo(129 + 34, y + 16); g.stroke(); } });
  noCel(9, () => { g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 96, 0, 6.283); g.stroke(); rad(128, 128, 96, [[0, 0.05], [0.8, 0.16], [1, 0.3]]); g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(92, 88, 22, 13, -0.7, 0, 6.283); g.fill(); });
  noCel(10, () => { g.lineCap = 'round'; for (let k = 0; k < 7; k++) { g.strokeStyle = `rgba(255,255,255,${0.10 + Math.random() * 0.1})`; g.lineWidth = 14 + Math.random() * 22; g.beginPath(); let x = 128 + (Math.random() - 0.5) * 50, y = 230; g.moveTo(x, y); for (let s = 0; s < 6; s++) { const nx = x + Math.sin(s * 1.4 + k) * 46, ny = y - 34; g.quadraticCurveTo(x + (nx - x) * 1.4, y - 10, nx, ny); x = nx; y = ny; } g.stroke(); } g.globalCompositeOperation = 'destination-in'; rad(128, 128, 127, [[0, 1], [0.5, 0.9], [1, 0]]); });
  noCel(11, () => { g.strokeStyle = '#fff'; g.lineWidth = 13; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(70, 52); g.lineTo(186, 52); g.lineTo(128, 128); g.lineTo(190, 204); g.lineTo(66, 204); g.moveTo(128, 128); g.lineTo(128, 220); g.moveTo(92, 128); g.lineTo(164, 128); g.stroke(); });
  noCel(12, () => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(128, 30); g.bezierCurveTo(180, 120, 196, 150, 196, 176); g.arc(128, 176, 68, 0, Math.PI); g.bezierCurveTo(60, 150, 76, 120, 128, 30); g.fill(); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = true; t.flipY = false; return t;
}

class Particulas {
  constructor(cena, tex, max, aditivo) {
    this.max = max; this.n = 0; this.pos = new Float32Array(max * 3); this.cor = new Float32Array(max * 4); this.dad = new Float32Array(max * 3); this.p = new Array(max);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('cor', new THREE.BufferAttribute(this.cor, 4)); g.setAttribute('dad', new THREE.BufferAttribute(this.dad, 3)); g.boundingSphere = new THREE.Sphere(new V3(), 1e6);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { tex: { value: tex }, esc: { value: 1000 } }, transparent: true, depthWrite: false, blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: `attribute vec4 cor; attribute vec3 dad; varying vec4 vC; varying vec3 vD; uniform float esc;
        void main(){ vC=cor; vD=dad; vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=min(900.,dad.x*esc/max(.1,-mv.z)); }`,
      fragmentShader: `uniform sampler2D tex; varying vec4 vC; varying vec3 vD;
        void main(){ vec2 p=gl_PointCoord-.5; float c=cos(vD.y), s=sin(vD.y); p=vec2(p.x*c-p.y*s,p.x*s+p.y*c); if(abs(p.x)>.5||abs(p.y)>.5) discard; p+=.5;
          vec2 o=vec2(mod(vD.z,4.),floor(vD.z/4.))*.25; float a=texture2D(tex,o+clamp(p,.012,.988)*.25).a; gl_FragColor=vec4(vC.rgb${aditivo ? '*a*vC.a' : ''},${aditivo ? '1.' : 'a*vC.a'}); }`,
    });
    this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = aditivo ? 12 : 10; cena.add(this.pts); this.geo = g;
  }
  // o: p, v, vida, t0, t1 (tamanho), c0, c1, a0, a1, grav, arr (arrasto), q (figura), rot, giro, chao (quica no chão), entra, vento (quanto o vento leva)
  emitir(o) {
    if (this.n >= this.max) return; const q = this.p[this.n] || (this.p[this.n] = {}); this.n++;
    q.x = o.p.x; q.y = o.p.y; q.z = o.p.z; q.vx = o.v ? o.v.x : 0; q.vy = o.v ? o.v.y : 0; q.vz = o.v ? o.v.z : 0; q.t = 0; q.vida = o.vida ?? 1; q.t0 = o.t0 ?? 0.3; q.t1 = o.t1 ?? q.t0; q.c0 = o.c0 || [1, 1, 1]; q.c1 = o.c1 || q.c0; q.a0 = o.a0 ?? 1; q.a1 = o.a1 ?? 0; q.grav = o.grav ?? 0; q.arr = o.arr ?? 0; q.q = o.q ?? 0; q.rot = o.rot ?? rnd(6.283); q.giro = o.giro ?? 0; q.chao = o.chao ?? false; q.entra = o.entra ?? 0.08; q.vento = o.vento ?? 0;
  }
  atualizar(dt, vento) {
    let i = 0; const P = this.pos, C = this.cor, D = this.dad; const wx = vento ? vento.x * vento.z : 0, wz = vento ? vento.y * vento.z : 0;
    while (i < this.n) {
      const q = this.p[i]; q.t += dt;
      if (q.t >= q.vida) { this.n--; const u = this.p[this.n]; this.p[this.n] = q; this.p[i] = u; continue; }
      const k = q.t / q.vida; const f = Math.max(0, 1 - q.arr * dt); q.vx *= f; q.vy *= f; q.vz *= f; q.vy -= q.grav * dt; q.x += (q.vx + wx * q.vento) * dt; q.y += q.vy * dt; q.z += (q.vz + wz * q.vento) * dt; q.rot += q.giro * dt;
      if (q.chao) { const h = piso(q.x, q.z) + 0.03; if (q.y < h) { q.y = h; q.vy *= -0.32; q.vx *= 0.55; q.vz *= 0.55; q.giro *= 0.5; } }
      P[i * 3] = q.x; P[i * 3 + 1] = q.y; P[i * 3 + 2] = q.z; const e = Math.min(1, k / q.entra);
      C[i * 4] = q.c0[0] + (q.c1[0] - q.c0[0]) * k; C[i * 4 + 1] = q.c0[1] + (q.c1[1] - q.c0[1]) * k; C[i * 4 + 2] = q.c0[2] + (q.c1[2] - q.c0[2]) * k; C[i * 4 + 3] = (q.a0 + (q.a1 - q.a0) * k) * e;
      D[i * 3] = q.t0 + (q.t1 - q.t0) * k; D[i * 3 + 1] = q.rot; D[i * 3 + 2] = q.q; i++;
    }
    this.geo.setDrawRange(0, this.n); this.geo.attributes.position.needsUpdate = true; this.geo.attributes.cor.needsUpdate = true; this.geo.attributes.dad.needsUpdate = true;
  }
}

// rastro: uma fita que segue um ponto, sempre de frente para a câmera
const _a = new V3(), _b = new V3(), _c = new V3();
class Rastro {
  constructor(cena, n = 22) {
    this.n = n; this.pts = []; for (let i = 0; i < n; i++) this.pts.push(new V3());
    const g = new THREE.BufferGeometry(); this.P = new Float32Array(n * 2 * 3); this.A = new Float32Array(n * 2 * 2); g.setAttribute('position', new THREE.BufferAttribute(this.P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(this.A, 2));
    const I = []; for (let i = 0; i < n - 1; i++) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } g.setIndex(I); g.boundingSphere = new THREE.Sphere(new V3(), 1e6);
    this.mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { cor: { value: new THREE.Color(1, 1, 1) }, forca: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform vec3 cor; uniform float forca; varying vec2 vUv; void main(){ float l=clamp(1.-abs(vUv.y*2.-1.),0.,1.); float a=pow(l,1.6)*pow(clamp(1.-vUv.x,0.,1.),1.5)*forca; gl_FragColor=vec4(cor*a*1.6+vec3(a*a*.6),1.); }' });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.visible = false; this.mesh.renderOrder = 11; cena.add(this.mesh); this.livre = true; this.larg = 0.1; this.geo = g; this.base = 1;
  }
  iniciar(p, cor, larg, base = 1) { this.livre = false; this.mesh.visible = true; for (const q of this.pts) q.copy(p); this.mat.uniforms.cor.value.set(cor); this.base = base; this.mat.uniforms.forca.value = base; this.larg = larg; this.morrendo = 0; }
  mover(p) { for (let i = this.n - 1; i > 0; i--) this.pts[i].copy(this.pts[i - 1]); this.pts[0].copy(p); }
  soltar() { if (!this.morrendo) this.morrendo = 0.001; }
  atualizar(dt, cam) {
    if (this.livre) return; if (this.morrendo) { this.morrendo += dt; this.mover(this.pts[0]); this.mat.uniforms.forca.value = this.base * Math.max(0, 1 - this.morrendo / 0.35); if (this.morrendo > 0.35) { this.livre = true; this.mesh.visible = false; return; } }
    const d = _a, s = _b, c = _c;
    for (let i = 0; i < this.n; i++) { const a = this.pts[Math.max(0, i - 1)], b = this.pts[Math.min(this.n - 1, i + 1)]; d.subVectors(a, b); c.subVectors(cam.position, this.pts[i]); s.crossVectors(d, c); const l = s.length(); if (l > 1e-6) s.multiplyScalar(this.larg * 0.5 / l); else s.set(0, 0, 0);
      const p = this.pts[i]; const o = i * 6; this.P[o] = p.x + s.x; this.P[o + 1] = p.y + s.y; this.P[o + 2] = p.z + s.z; this.P[o + 3] = p.x - s.x; this.P[o + 4] = p.y - s.y; this.P[o + 5] = p.z - s.z; const u = i / (this.n - 1); const q = i * 4; this.A[q] = u; this.A[q + 1] = 0; this.A[q + 2] = u; this.A[q + 3] = 1; }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.uv.needsUpdate = true;
  }
}

function geoFlecha() {
  const P = [], C = [], I = []; const add = (g, cor) => { const b = P.length / 3; const p = g.attributes.position; for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); C.push(...cor); } const ix = g.index.array; for (let i = 0; i < ix.length; i++) I.push(b + ix[i]); };
  add(new THREE.CylinderGeometry(0.014, 0.014, 0.86, 6).rotateX(Math.PI / 2), [0.45, 0.31, 0.17]);
  add(new THREE.ConeGeometry(0.036, 0.14, 6).rotateX(Math.PI / 2).translate(0, 0, 0.5), [0.5, 0.52, 0.56]);
  for (let k = 0; k < 3; k++) { const g = new THREE.PlaneGeometry(0.09, 0.2).rotateY(Math.PI / 2).translate(0, 0.05, -0.32).rotateZ(k * 2.094); add(g, k ? [0.86, 0.84, 0.78] : [0.7, 0.16, 0.1]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals(); return g;
}

export class Vfx {
  constructor(ctx) {
    this.ctx = ctx; const cena = ctx.cena; const tex = atlas(); const q = ctx.qualidade || 1;
    this.luz = new Particulas(cena, tex, Math.round(9000 * Math.max(0.5, q)), true); this.fumo = new Particulas(cena, tex, Math.round(6000 * Math.max(0.5, q)), false);
    this.rastros = []; for (let i = 0; i < 64; i++) this.rastros.push(new Rastro(cena));
    this.gFlecha = geoFlecha(); this.mFlecha = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide });
    this.flechas = []; this.fincadas = []; this.poolFlechas = [];
    this.claroes = []; for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xffffff, 0, 14, 2); l.position.set(0, -50, 0); cena.add(l); this.claroes.push({ l, t: 0, vida: 0, forca: 0, segue: null }); }
    this.marcas = []; this.aneis = []; this.arcos = []; this.colunas = []; this.ventos = []; this.espirais = [];
    this.texAnel = this.fazerTexAnel(); this.texMarca = this.fazerTexMarca();
    this.tremor = 0; this.emissores = [];
    this.gColuna = new THREE.CylinderGeometry(1, 1, 1, 28, 1, true).translate(0, 0.5, 0);
  }
  fazerTexAnel() { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const gr = g.createRadialGradient(128, 128, 60, 128, 128, 127); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.72, 'rgba(255,255,255,0.12)'); gr.addColorStop(0.9, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); }
  fazerTexMarca() { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); for (let k = 0; k < 60; k++) { const a = Math.random() * 6.283, d = Math.random() * 70, r = 18 + Math.random() * 40; const x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); } return new THREE.CanvasTexture(c); }
  // disco que acompanha o relevo
  disco(raio, tex, cor, aditivo, opacidade = 1) {
    const sub = new THREE.PlaneGeometry(2, 2, 14, 14).rotateX(-Math.PI / 2);
    const m = new THREE.MeshBasicMaterial({ map: tex, color: cor, transparent: true, opacity: opacidade, depthWrite: false, blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: !aditivo });
    const mesh = new THREE.Mesh(sub, m); mesh.userData.raio = raio; mesh.renderOrder = 5; this.ctx.cena.add(mesh); return mesh;
  }
  assentar(mesh, x, z, raio) { const p = mesh.geometry.attributes.position; const n = 15; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = j * n + i; const lx = (i / (n - 1) * 2 - 1) * raio, lz = (j / (n - 1) * 2 - 1) * raio; p.setXYZ(k, lx, piso(x + lx, z + lz) + 0.06, lz); } p.needsUpdate = true; mesh.position.set(x, 0, z); mesh.userData.raio = raio; }
  anel(x, z, r0, r1, vida, cor, atraso = 0) { const m = this.disco(r0, this.texAnel, cor, true); m.visible = atraso <= 0; this.aneis.push({ m, x, z, r0, r1, vida, t: -atraso }); this.assentar(m, x, z, r0); }
  marca(x, z, raio, vida, cor = 0x0a0806, op = 0.75) { const m = this.disco(raio, this.texMarca, cor, false, op); this.assentar(m, x, z, raio); this.marcas.push({ m, vida, t: 0, op }); }
  clarao(p, cor, forca, vida, raio = 14, segue = null) { let c = this.claroes.find(c => c.t >= c.vida) || this.claroes[0]; c.l.color.set(cor); c.l.distance = raio; c.l.position.copy(p); c.t = 0; c.vida = vida; c.forca = forca; c.segue = segue; return c; }
  rastro(p, cor, larg = 0.12, base = 1) { const r = this.rastros.find(r => r.livre); if (!r) return null; r.iniciar(p, cor, larg, base); return r; }

  // um raio em ziguezague de p0 a p1 (os relâmpagos do céu e os arcos da Ghotin)
  arco(p0, p1, cor, larg = 0.08, vida = 0.14, segs = 9, desvio = 0.35, ramos = false) {
    const cam = this.ctx.camera; const pts = []; const d = new V3().subVectors(p1, p0); const L = d.length();
    for (let i = 0; i <= segs; i++) { const t = i / segs; const k = Math.sin(t * Math.PI); pts.push(new V3(p0.x + d.x * t + rs(desvio) * k * (L / segs) * 1.6, p0.y + d.y * t + rs(desvio) * k * (L / segs) * 0.8, p0.z + d.z * t + rs(desvio) * k * (L / segs) * 1.6)); }
    const P = [], U = [], I = []; const s = new V3(), c = new V3(), dd = new V3();
    for (let i = 0; i <= segs; i++) { dd.subVectors(pts[Math.min(segs, i + 1)], pts[Math.max(0, i - 1)]); c.subVectors(cam.position, pts[i]); s.crossVectors(dd, c).normalize().multiplyScalar(larg * 0.5 * (1 + 0.0035 * c.length())); P.push(pts[i].x + s.x, pts[i].y + s.y, pts[i].z + s.z, pts[i].x - s.x, pts[i].y - s.y, pts[i].z - s.z); U.push(i / segs, 0, i / segs, 1); if (i < segs) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I);
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false, uniforms: { cor: { value: new THREE.Color(cor) }, f: { value: 1 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }', fragmentShader: 'uniform vec3 cor; uniform float f; varying vec2 vUv; void main(){ float l=clamp(1.-abs(vUv.y*2.-1.),0.,1.); gl_FragColor=vec4((cor*pow(l,1.3)*2.2+vec3(pow(l,6.)*3.))*f,1.); }' });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 13; this.ctx.cena.add(mesh); this.arcos.push({ mesh, t: 0, vida });
    if (ramos) for (let k = 0; k < 3; k++) { const i = 2 + ((Math.random() * (segs - 4)) | 0); const fim = pts[i].clone().add(new V3(rs(L * 0.22), -L * rnd(0.1, 0.25), rs(L * 0.22))); this.arco(pts[i], fim, cor, larg * 0.5, vida * 0.8, 6, desvio, false); }
    return pts;
  }
  // coluna de luz que sobe do chão
  coluna(p, cor, raio = 1, alt = 8, vida = 1, forca = 1) {
    // um facho macio: forte no meio do cilindro visto da câmera, sumindo nas bordas e para cima, com fios de luz que sobem
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { cor: { value: new THREE.Color(cor) }, f: { value: forca }, uT: this.ctx.uTempo },
      vertexShader: 'varying vec2 vUv; varying vec3 vN, vV; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*vec3(normal.x,0.,normal.z)); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'uniform vec3 cor; uniform float f,uT; varying vec2 vUv; varying vec3 vN, vV; void main(){ float meio=pow(abs(dot(normalize(vN),normalize(vV))),2.2); float sobe=pow(clamp(1.-vUv.y,0.,1.),2.2)*smoothstep(0.,.04,vUv.y); float fio=.55+.45*sin(vUv.x*70.+sin(vUv.y*9.-uT*5.)*2.); gl_FragColor=vec4(cor*meio*sobe*fio*f*.55,1.); }' });
    const mesh = new THREE.Mesh(this.gColuna, m); mesh.position.copy(p); mesh.scale.set(raio, alt, raio); mesh.frustumCulled = false; mesh.renderOrder = 11; this.ctx.cena.add(mesh); const c = { mesh, t: 0, vida, raio, forca, alt }; this.colunas.push(c); return c;
  }
  // linha de vento: um risco branco que passa fazendo uma volta
  linhaDeVento(p, dir, comp = 12) { const r = this.rastro(p, 0xffffff, 0.05, 0.2); if (!r) return; this.ventos.push({ r, p0: p.clone(), dir: dir.clone().normalize(), t: 0, dur: comp / 11, comp, fase: rnd(6.283), volta: rnd(0.3, 0.7), lado: Math.random() < 0.5 ? 1 : -1 }); }
  // fitas em espiral em volta de um alvo que anda (os Passos Leves)
  espiral(alvo, cor, dur = 0.8, raio = 0.75, alt = 2.1, n = 3) { const rsx = []; for (let i = 0; i < n; i++) { const r = this.rastro(alvo.pos, cor, 0.16, 0.9); if (r) rsx.push(r); } this.espirais.push({ rs: rsx, alvo, t: 0, dur, raio, alt }); }

  // ----- as flechas -----
  flecha(o) {
    const mesh = this.poolFlechas.pop() || new THREE.Mesh(this.gFlecha, this.mFlecha); mesh.castShadow = true; mesh.scale.setScalar(o.esc || 1.12); mesh.position.copy(o.de); mesh.visible = true; this.ctx.cena.add(mesh);
    const f = { mesh, pos: o.de.clone(), vel: o.vel || 34, alvo: o.alvo || null, ponto: o.ponto ? o.ponto.clone() : null, tipo: o.tipo || 'normal', aoAcertar: o.aoAcertar, dir: new V3(0, 0, 1), t: 0, queda: o.queda || 0, fincar: o.fincar ?? !o.alvo, rastro: null, vidaMax: o.vidaMax || 4, fase: rnd(6.283) };
    if (o.dir) f.dir.copy(o.dir).normalize();
    const cores = { normal: 0xfff0d0, veneno: 0x58ff48, fogo: 0xff7a20, concentrado: 0xffe08a, chuva: 0xd8ecff };
    f.rastro = this.rastro(f.pos, cores[f.tipo] ?? 0xffffff, f.tipo === 'fogo' ? 0.36 : f.tipo === 'veneno' ? 0.28 : f.tipo === 'concentrado' ? 0.22 : 0.11);
    this.flechas.push(f); return f;
  }
  fincarFlecha(pos, dir, vida = 7) { const mesh = this.poolFlechas.pop() || new THREE.Mesh(this.gFlecha, this.mFlecha); mesh.castShadow = true; mesh.visible = true; mesh.scale.setScalar(1.12); mesh.position.copy(pos).addScaledVector(dir, -0.33); mesh.lookAt(mesh.position.clone().add(dir)); this.ctx.cena.add(mesh); this.fincadas.push({ mesh, t: 0, vida }); if (this.fincadas.length > 80) { const v = this.fincadas.shift(); v.mesh.visible = false; this.ctx.cena.remove(v.mesh); this.poolFlechas.push(v.mesh); } }

  // ----- efeitos prontos -----
  faiscas(p, cor, n = 10, forca = 4) { for (let i = 0; i < n; i++) this.luz.emitir({ p, v: new V3(rs(forca), rnd(forca * 0.2, forca), rs(forca)), vida: rnd(0.25, 0.6), t0: rnd(0.08, 0.2), t1: 0.02, c0: cor, a0: 1, a1: 0, grav: 9, q: 2, arr: 1.5 }); }
  poeira(p, n = 6, cor = [0.55, 0.47, 0.36], esc = 1) { for (let i = 0; i < n; i++) this.fumo.emitir({ p: new V3(p.x + rs(0.25 * esc), p.y + rnd(0.05, 0.2), p.z + rs(0.25 * esc)), v: new V3(rs(1.2 * esc), rnd(0.3, 1.1), rs(1.2 * esc)), vida: rnd(0.6, 1.3), t0: 0.25 * esc, t1: rnd(0.9, 1.6) * esc, c0: cor, a0: 0.42, a1: 0, arr: 2.2, q: 1, giro: rs(1), vento: 0.5 }); }
  estilhacos(p, cor, n = 10, forca = 5, tam = 0.14) { for (let i = 0; i < n; i++) this.fumo.emitir({ p: new V3(p.x + rs(0.2), p.y + rnd(0, 0.4), p.z + rs(0.2)), v: new V3(rs(forca), rnd(forca * 0.5, forca * 1.3), rs(forca)), vida: rnd(0.9, 1.9), t0: tam * rnd(0.6, 1.4), t1: tam * 0.5, c0: cor, a0: 1, a1: 0.7, grav: 13, q: 6, giro: rs(12), chao: true, entra: 0.02 }); }
  penas(p, n = 10) { for (let i = 0; i < n; i++) { const a = rnd(6.283), s = rnd(1, 3.5); this.fumo.emitir({ p: new V3(p.x + rs(0.3), p.y + rnd(0.3, 1.4), p.z + rs(0.3)), v: new V3(Math.cos(a) * s, rnd(1.2, 3.2), Math.sin(a) * s), vida: rnd(1.6, 3), t0: rnd(0.16, 0.26), t1: 0.16, c0: [0.95, 0.97, 1], c1: [0.8, 0.9, 1], a0: 0.95, a1: 0, grav: 1.6, arr: 1.6, q: 8, giro: rs(5), vento: 0.6, entra: 0.04 }); } }
  bolhas(p, raio = 1.6, n = 8) { for (let i = 0; i < n; i++) { const a = rnd(6.283), d = Math.sqrt(Math.random()) * raio; this.luz.emitir({ p: new V3(p.x + Math.cos(a) * d, p.y + rnd(0.05, 0.3), p.z + Math.sin(a) * d), v: new V3(rs(0.2), rnd(0.5, 1.5), rs(0.2)), vida: rnd(0.6, 1.4), t0: rnd(0.08, 0.22), t1: rnd(0.2, 0.36), c0: [0.4, 1, 0.3], a0: 0.85, a1: 0, q: 9, giro: 0, rot: 0, arr: 0.5 }); } }
  fuligem(p, esp = 0.45, alt = 0.9) { this.fumo.emitir({ p: new V3(p.x + rs(esp), p.y + rnd(0.1, alt), p.z + rs(esp)), v: new V3(rs(0.15), rnd(0.5, 1.1), rs(0.15)), vida: rnd(0.8, 1.5), t0: rnd(0.1, 0.22), t1: 0.04, c0: [0.02, 0.015, 0.03], a0: 0.85, a1: 0, q: Math.random() < 0.5 ? 1 : 10, giro: rs(1.5), entra: 0.2 }); }
  impactoFlecha(p, tipo) {
    const c = { normal: [1, 0.9, 0.7], veneno: [0.4, 1, 0.3], fogo: [1, 0.55, 0.15], concentrado: [1, 0.85, 0.45], chuva: [0.8, 0.9, 1] }[tipo] || [1, 1, 1];
    this.faiscas(p, c, tipo === 'normal' ? 7 : 12, 3.6); this.luz.emitir({ p, vida: 0.16, t0: 0.5, t1: 1.3, c0: c, a0: 0.9, a1: 0, q: 0 });
    this.luz.emitir({ p, vida: 0.22, t0: 0.2, t1: tipo === 'normal' ? 1.1 : 1.8, c0: c, a0: 0.9, a1: 0, q: 5, rot: 0 });
    for (let i = 0; i < 5; i++) { const a = rnd(6.283); this.luz.emitir({ p, v: new V3(Math.cos(a) * 5, rnd(0, 2), Math.sin(a) * 5), vida: 0.18, t0: 0.5, t1: 0.9, c0: c, a0: 0.8, a1: 0, q: 7, rot: -a, arr: 6 }); }
  }
  nuvemVeneno(p, raio = 2.2) {
    for (let i = 0; i < 30; i++) { const a = rnd(6.283), d = Math.sqrt(Math.random()) * raio; this.fumo.emitir({ p: new V3(p.x + Math.cos(a) * d * 0.3, p.y + rnd(0.1, 0.8), p.z + Math.sin(a) * d * 0.3), v: new V3(Math.cos(a) * d * 1.3, rnd(0.1, 0.7), Math.sin(a) * d * 1.3), vida: rnd(1.8, 3.6), t0: 0.5, t1: rnd(1.8, 2.8), c0: [0.20, 0.5, 0.12], c1: [0.10, 0.26, 0.09], a0: 0.5, a1: 0, arr: 1.8, q: i % 3 ? 1 : 10, giro: rs(0.8), vento: 0.3 }); }
    for (let i = 0; i < 40; i++) { const a = rnd(6.283), s = rnd(1, 4.5); this.luz.emitir({ p: new V3(p.x, p.y + 0.3, p.z), v: new V3(Math.cos(a) * s, rnd(0.5, 4), Math.sin(a) * s), vida: rnd(0.5, 1.2), t0: rnd(0.1, 0.24), t1: 0.03, c0: [0.35, 1, 0.25], a0: 1, a1: 0, grav: 5, arr: 1.2, q: i % 4 ? 2 : 12, chao: true }); }
    this.luz.emitir({ p: new V3(p.x, p.y + 0.4, p.z), vida: 0.3, t0: 1, t1: 4, c0: [0.3, 1, 0.2], a0: 0.8, a1: 0, q: 0 });
    this.anel(p.x, p.z, 0.4, raio * 1.25, 0.6, 0x58ff48); this.anel(p.x, p.z, 0.2, raio * 0.9, 0.8, 0x2f9a2a, 0.12); this.clarao(new V3(p.x, p.y + 1, p.z), 0x58ff48, 26, 0.5, 10);
    this.marca(p.x, p.z, raio * 0.9, 6, 0x143a0c, 0.55); this.emissores.push({ tipo: 'veneno', x: p.x, z: p.z, t: 0, vida: 4.5, s: raio * 0.8, ac: 0 });
  }
  explosaoFogo(p, raio = 3) {
    const L = this.luz, F = this.fumo;
    L.emitir({ p: new V3(p.x, p.y + 0.6, p.z), vida: 0.2, t0: 2, t1: 6, c0: [1, 0.8, 0.5], a0: 0.5, a1: 0, q: 0 });
    // a bola de fogo: línguas que sobem e abrem
    for (let i = 0; i < 90; i++) { const a = rnd(6.283), e = rnd(-0.1, 1.25), s = rnd(2, 9.5); L.emitir({ p: new V3(p.x + rs(0.3), p.y + rnd(0.2, 0.8), p.z + rs(0.3)), v: new V3(Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s * 0.9 + 1.5, Math.sin(a) * Math.cos(e) * s), vida: rnd(0.35, 1.0), t0: rnd(0.7, 1.4), t1: rnd(1.6, 2.7), c0: [1, rnd(0.6, 0.86), 0.22], c1: [0.72, 0.12, 0.02], a0: 0.85, a1: 0, arr: 3.2, q: i % 2 ? 1 : 4, rot: rs(0.5), giro: rs(1.2) }); }
    // a roda de fogo no chão, que corre para fora
    for (let i = 0; i < 44; i++) { const a = i / 44 * 6.283 + rs(0.06), s = rnd(6, 8.5); L.emitir({ p: new V3(p.x + Math.cos(a) * 0.4, p.y + 0.15, p.z + Math.sin(a) * 0.4), v: new V3(Math.cos(a) * s, rnd(0.2, 1.2), Math.sin(a) * s), vida: rnd(0.4, 0.6), t0: 0.5, t1: 1.3, c0: [1, 0.75, 0.3], c1: [0.9, 0.2, 0.03], a0: 0.8, a1: 0, arr: 3.8, q: 4, rot: rs(0.4) }); }
    for (let i = 0; i < 70; i++) { const a = rnd(6.283), s = rnd(3, 13); L.emitir({ p: new V3(p.x, p.y + 0.5, p.z), v: new V3(Math.cos(a) * s, rnd(2, 11), Math.sin(a) * s), vida: rnd(0.6, 1.7), t0: rnd(0.08, 0.2), t1: 0.02, c0: [1, 0.7, 0.25], c1: [1, 0.25, 0.05], a0: 1, a1: 0, grav: 12, arr: 0.8, q: 2, chao: true }); }
    for (let i = 0; i < 30; i++) { const a = rnd(6.283), s = rnd(0.5, 3.5); F.emitir({ p: new V3(p.x + rs(0.6), p.y + rnd(0.3, 1.2), p.z + rs(0.6)), v: new V3(Math.cos(a) * s, rnd(1.2, 3.8), Math.sin(a) * s), vida: rnd(1.8, 3.8), t0: 1.0, t1: rnd(3, 4.8), c0: [0.13, 0.11, 0.10], c1: [0.3, 0.28, 0.26], a0: 0.62, a1: 0, arr: 1.3, q: 1, giro: rs(0.7), entra: 0.2, vento: 0.6 }); }
    this.estilhacos(p, [0.16, 0.13, 0.1], 16, 6, 0.16);
    this.anel(p.x, p.z, 0.5, raio * 1.5, 0.5, 0xffa040); this.anel(p.x, p.z, 0.3, raio * 2.1, 0.75, 0xff6a20, 0.08); this.marca(p.x, p.z, raio * 0.95, 14);
    this.clarao(new V3(p.x, p.y + 1.4, p.z), 0xff8a30, 110, 0.7, 20); this.tremor = Math.max(this.tremor, 0.55);
    this.coluna(new V3(p.x, p.y, p.z), 0xff9a40, 1.1, 5.5, 0.45, 0.8);
    for (let i = 0; i < 9; i++) { const a = rnd(6.283), d = rnd(0.3, raio * 0.85); this.emissores.push({ tipo: 'chama', x: p.x + Math.cos(a) * d, z: p.z + Math.sin(a) * d, y: null, t: 0, vida: rnd(2.4, 5), s: rnd(0.35, 0.75), ac: 0 }); }
  }
  chama(p, s = 1, intens = 1) {
    this.luz.emitir({ p: new V3(p.x + rs(0.12 * s), p.y + rnd(0, 0.1), p.z + rs(0.12 * s)), v: new V3(rs(0.25 * s), rnd(0.8, 1.9) * s, rs(0.25 * s)), vida: rnd(0.35, 0.75), t0: rnd(0.35, 0.6) * s, t1: 0.1 * s, c0: [1, rnd(0.62, 0.88), 0.28], c1: [0.9, 0.18, 0.03], a0: 0.75 * intens, a1: 0, q: 4, rot: rs(0.35), giro: rs(0.8), arr: 0.6, vento: 0.25 });
    if (Math.random() < 0.3) this.luz.emitir({ p: new V3(p.x, p.y + 0.1, p.z), v: new V3(rs(0.6 * s), rnd(1.5, 3.2) * s, rs(0.6 * s)), vida: rnd(0.5, 1.1), t0: 0.07, t1: 0.02, c0: [1, 0.7, 0.3], a0: 1, a1: 0, q: 2, grav: -1, vento: 0.5 });
  }
  fumacaSobe(p, s = 1, cor = [0.34, 0.33, 0.32], a = 0.35) { this.fumo.emitir({ p: new V3(p.x + rs(0.1 * s), p.y, p.z + rs(0.1 * s)), v: new V3(rs(0.15), rnd(0.7, 1.3), rs(0.15)), vida: rnd(3, 5.5), t0: 0.3 * s, t1: rnd(1.8, 3) * s, c0: cor, a0: a, a1: 0, q: Math.random() < 0.6 ? 1 : 10, giro: rs(0.5), arr: 0.15, entra: 0.15, vento: 0.45 }); }
  rajada(p, alvo = null) {   // a lufada dos Passos Leves
    for (let i = 0; i < 50; i++) { const a = rnd(6.283), s = rnd(2.5, 6.5); this.luz.emitir({ p: new V3(p.x + Math.cos(a) * 0.3, p.y + rnd(0.05, 0.5), p.z + Math.sin(a) * 0.3), v: new V3(Math.cos(a + 1.2) * s, rnd(0.6, 3.4), Math.sin(a + 1.2) * s), vida: rnd(0.4, 0.9), t0: rnd(0.25, 0.5), t1: 0.9, c0: [0.75, 0.95, 1], c1: [0.4, 0.75, 1], a0: 0.4, a1: 0, arr: 2.4, q: i % 3 ? 0 : 7, rot: -a - 1.2 }); }
    for (let i = 0; i < 16; i++) { const a = rnd(6.283), s = rnd(2, 5); this.fumo.emitir({ p: new V3(p.x, p.y + 0.15, p.z), v: new V3(Math.cos(a) * s, rnd(1.5, 4.5), Math.sin(a) * s), vida: rnd(0.9, 1.8), t0: 0.16, t1: 0.2, c0: [0.45, 0.6, 0.22], c1: [0.6, 0.5, 0.2], a0: 1, a1: 0, grav: 3.5, arr: 1.2, q: 3, giro: rs(9), vento: 0.4 }); }
    this.penas(p, 12); this.poeira(p, 12, [0.7, 0.68, 0.6], 1.5); this.anel(p.x, p.z, 0.3, 3.2, 0.55, 0xa8e8ff); this.anel(p.x, p.z, 0.2, 2.2, 0.7, 0xd8f4ff, 0.1); this.clarao(new V3(p.x, p.y + 0.8, p.z), 0x9fdcff, 30, 0.45, 9);
    this.coluna(new V3(p.x, p.y, p.z), 0x9fdcff, 0.9, 3.4, 0.6, 0.5); if (alvo) this.espiral(alvo, 0xbfe8ff, 0.85);
  }
  subirNivel(p) { for (let i = 0; i < 80; i++) { const a = rnd(6.283), d = rnd(0.2, 1.1); this.luz.emitir({ p: new V3(p.x + Math.cos(a) * d, p.y + rnd(0, 0.4), p.z + Math.sin(a) * d), v: new V3(0, rnd(1.5, 5.5), 0), vida: rnd(0.8, 1.7), t0: rnd(0.1, 0.3), t1: 0.03, c0: [1, 0.85, 0.4], a0: 1, a1: 0, q: i % 5 ? 2 : 11 }); } this.luz.emitir({ p: new V3(p.x, p.y + 1, p.z), vida: 0.7, t0: 2, t1: 7, c0: [1, 0.85, 0.5], a0: 0.8, a1: 0, q: 0 }); this.anel(p.x, p.z, 0.3, 4, 0.8, 0xffd060); this.clarao(new V3(p.x, p.y + 1.5, p.z), 0xffd070, 60, 0.9, 14); this.coluna(p.clone(), 0xffd070, 1.0, 9, 1.2, 0.9); }
  // a Ghotin quebrando: as trevas estouram e a luz volta
  explosaoTrevas(p, cor) {
    const c = new THREE.Color(cor); const cc = [c.r, c.g, c.b];
    for (let i = 0; i < 70; i++) { const a = rnd(6.283), e = rnd(0, 1.3), s = rnd(3, 12); this.fumo.emitir({ p: new V3(p.x, p.y + rnd(0.3, 2), p.z), v: new V3(Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s, Math.sin(a) * Math.cos(e) * s), vida: rnd(1, 2.6), t0: 0.6, t1: rnd(2, 3.6), c0: [0.02, 0.015, 0.03], c1: [0.12, 0.1, 0.14], a0: 0.8, a1: 0, arr: 2.2, q: i % 2 ? 1 : 10, giro: rs(1), vento: 0.4 }); }
    for (let i = 0; i < 110; i++) { const a = rnd(6.283), s = rnd(3, 15); this.luz.emitir({ p: new V3(p.x, p.y + rnd(0.5, 2.2), p.z), v: new V3(Math.cos(a) * s, rnd(1, 12), Math.sin(a) * s), vida: rnd(0.6, 1.8), t0: rnd(0.1, 0.26), t1: 0.02, c0: [1, 0.9, 0.8], c1: cc, a0: 1, a1: 0, grav: 9, arr: 0.9, q: i % 6 ? 2 : 11, chao: true }); }
    this.estilhacos(new V3(p.x, p.y + 1, p.z), [0.05, 0.05, 0.07], 34, 9, 0.3);
    this.luz.emitir({ p: new V3(p.x, p.y + 1.4, p.z), vida: 0.35, t0: 3, t1: 12, c0: [1, 0.92, 0.85], a0: 0.8, a1: 0, q: 0 });
    for (let k = 0; k < 4; k++) this.anel(p.x, p.z, 0.5, 5 + k * 2.6, 0.7 + k * 0.18, k % 2 ? cor : 0xfff0e0, k * 0.09);
    this.coluna(p.clone(), 0xfff0e0, 1.6, 22, 1.6, 1.3); this.coluna(p.clone(), cor, 2.6, 14, 1.1, 0.7);
    this.clarao(new V3(p.x, p.y + 2, p.z), cor, 220, 1.1, 28); this.tremor = Math.max(this.tremor, 0.9); this.marca(p.x, p.z, 3.4, 20);
  }

  atualizar(dt, cam, t) {
    const vento = this.ctx.vento ? this.ctx.vento.u.value : null;
    // flechas
    for (let i = this.flechas.length - 1; i >= 0; i--) {
      const f = this.flechas[i]; f.t += dt; let fim = false, acertou = false; const alvoPos = f.alvo ? f.alvo.peito(new V3()) : f.ponto;
      if (alvoPos) { const d = new V3().subVectors(alvoPos, f.pos); const L = d.length(); if (f.queda === 0) f.dir.copy(d).normalize(); const passo = f.vel * dt; if (L <= passo + 0.25) { f.pos.copy(alvoPos); fim = true; acertou = true; } else f.pos.addScaledVector(f.dir, passo); }
      else { f.dir.y -= f.queda * dt; f.dir.normalize(); f.pos.addScaledVector(f.dir, f.vel * dt); const h = piso(f.pos.x, f.pos.z); if (f.pos.y <= h + 0.02) { f.pos.y = h + 0.02; fim = true; } }
      if (f.t > f.vidaMax) fim = true;
      f.mesh.position.copy(f.pos); f.mesh.lookAt(f.pos.clone().add(f.dir)); if (f.rastro) f.rastro.mover(f.pos);
      if (f.tipo === 'fogo') {
        for (let k = 0; k < 3; k++) this.chama(new V3(f.pos.x - f.dir.x * k * 0.25, f.pos.y - f.dir.y * k * 0.25, f.pos.z - f.dir.z * k * 0.25), 0.85);
        const lado = new V3(-f.dir.z, 0, f.dir.x); const an = f.t * 26 + f.fase; this.luz.emitir({ p: new V3(f.pos.x + lado.x * Math.cos(an) * 0.28, f.pos.y + Math.sin(an) * 0.28, f.pos.z + lado.z * Math.cos(an) * 0.28), vida: 0.3, t0: 0.26, t1: 0.04, c0: [1, 0.8, 0.35], a0: 0.9, a1: 0, q: 2 });
        if (Math.random() < 0.6) this.fumacaSobe(f.pos, 0.6, [0.2, 0.18, 0.17], 0.3);
      } else if (f.tipo === 'veneno') {
        for (let k = 0; k < 2; k++) this.luz.emitir({ p: f.pos, v: new V3(rs(0.6), rnd(-1.2, 0.3), rs(0.6)), vida: rnd(0.3, 0.7), t0: rnd(0.18, 0.34), t1: 0.04, c0: [0.35, 1, 0.25], a0: 0.9, a1: 0, grav: 3, q: k ? 12 : 0 });
        if (Math.random() < 0.5) this.fumo.emitir({ p: f.pos, v: new V3(rs(0.3), 0.2, rs(0.3)), vida: 0.9, t0: 0.25, t1: 0.8, c0: [0.2, 0.5, 0.12], a0: 0.35, a1: 0, q: 10 });
      } else if (f.tipo === 'concentrado') { if (Math.random() < 0.8) this.luz.emitir({ p: f.pos, vida: 0.25, t0: 0.22, t1: 0.03, c0: [1, 0.85, 0.5], a0: 0.8, a1: 0, q: 2 }); }
      if (fim) {
        if (f.rastro) f.rastro.soltar(); this.flechas.splice(i, 1);
        if (f.aoAcertar) f.aoAcertar(f.pos.clone(), acertou && !!f.alvo);
        this.ctx.cena.remove(f.mesh); f.mesh.visible = false; this.poolFlechas.push(f.mesh); if (f.fincar) this.fincarFlecha(f.pos, f.dir);
      }
    }
    for (let i = this.fincadas.length - 1; i >= 0; i--) { const f = this.fincadas[i]; f.t += dt; if (f.t > f.vida) { const k = 1 - (f.t - f.vida) / 0.6; if (k <= 0) { f.mesh.visible = false; this.ctx.cena.remove(f.mesh); this.poolFlechas.push(f.mesh); this.fincadas.splice(i, 1); } else f.mesh.scale.setScalar(1.12 * k); } }
    // linhas de vento e espirais
    for (let i = this.ventos.length - 1; i >= 0; i--) { const w = this.ventos[i]; w.t += dt; const k = w.t / w.dur; if (k >= 1) { w.r.soltar(); this.ventos.splice(i, 1); continue; }
      const lado = new V3(-w.dir.z, 0, w.dir.x); const p = w.p0.clone().addScaledVector(w.dir, k * w.comp).addScaledVector(lado, w.lado * Math.sin(k * 5.2 + w.fase) * 0.7); p.y += Math.sin(k * 6.6 + w.fase * 1.7) * 0.32 + k * 0.5; w.r.mover(p); w.r.base = 0.2 * Math.sin(Math.min(1, k * 1.05) * Math.PI); w.r.mat.uniforms.forca.value = w.r.base; }
    for (let i = this.espirais.length - 1; i >= 0; i--) { const e = this.espirais[i]; e.t += dt; const k = e.t / e.dur; if (k >= 1) { for (const r of e.rs) r.soltar(); this.espirais.splice(i, 1); continue; }
      e.rs.forEach((r, j) => { const a = k * 11 + j * 6.283 / e.rs.length; const rr = e.raio * (1 - k * 0.45); r.mover(new V3(e.alvo.pos.x + Math.cos(a) * rr, e.alvo.pos.y + 0.1 + k * e.alt, e.alvo.pos.z + Math.sin(a) * rr)); }); }
    for (const r of this.rastros) r.atualizar(dt, cam);
    for (const c of this.claroes) { if (c.t < c.vida) { c.t += dt; const k = Math.max(0, 1 - c.t / c.vida); c.l.intensity = c.forca * k * k; if (c.segue) c.l.position.copy(c.segue); } else c.l.intensity = 0; }
    for (let i = this.aneis.length - 1; i >= 0; i--) { const a = this.aneis[i]; a.t += dt; if (a.t < 0) continue; a.m.visible = true; const k = a.t / a.vida; if (k >= 1) { this.ctx.cena.remove(a.m); a.m.geometry.dispose(); a.m.material.dispose(); this.aneis.splice(i, 1); continue; } const r = a.r0 + (a.r1 - a.r0) * (1 - (1 - k) * (1 - k)); this.assentar(a.m, a.x, a.z, r); a.m.material.opacity = (1 - k); }
    for (let i = this.marcas.length - 1; i >= 0; i--) { const a = this.marcas[i]; a.t += dt; const k = a.t / a.vida; if (k >= 1) { this.ctx.cena.remove(a.m); a.m.geometry.dispose(); a.m.material.dispose(); this.marcas.splice(i, 1); continue; } a.m.material.opacity = a.op * Math.min(1, (1 - k) * 3); }
    for (let i = this.arcos.length - 1; i >= 0; i--) { const a = this.arcos[i]; a.t += dt; const k = a.t / a.vida; if (k >= 1) { this.ctx.cena.remove(a.mesh); a.mesh.geometry.dispose(); a.mesh.material.dispose(); this.arcos.splice(i, 1); continue; } a.mesh.material.uniforms.f.value = (1 - k) * (0.6 + 0.4 * Math.sin(a.t * 90)); }
    for (let i = this.colunas.length - 1; i >= 0; i--) { const c = this.colunas[i]; c.t += dt; const k = c.t / c.vida; if (k >= 1) { this.ctx.cena.remove(c.mesh); c.mesh.material.dispose(); this.colunas.splice(i, 1); continue; } c.mesh.material.uniforms.f.value = c.forca * Math.sin(Math.min(1, k * 4) * Math.PI / 2) * (1 - k); c.mesh.scale.set(c.raio * (1 - 0.5 * k), c.alt * (0.6 + 0.4 * Math.min(1, k * 3)), c.raio * (1 - 0.5 * k)); }
    for (let i = this.emissores.length - 1; i >= 0; i--) { const e = this.emissores[i]; e.t += dt; if (e.t > e.vida) { this.emissores.splice(i, 1); continue; } const y = e.y ?? piso(e.x, e.z); const k = 1 - e.t / e.vida;
      if (e.tipo === 'chama') { e.ac += dt * 26; while (e.ac > 1) { e.ac -= 1; this.chama(new V3(e.x, y + 0.05, e.z), e.s * (0.5 + 0.5 * k)); } if (Math.random() < dt * 4) this.fumacaSobe(new V3(e.x, y + 0.4, e.z), 0.6, [0.16, 0.15, 0.14], 0.3); }
      else if (e.tipo === 'veneno') { e.ac += dt * 16 * k; while (e.ac > 1) { e.ac -= 1; this.bolhas(new V3(e.x, y, e.z), e.s, 1); } if (Math.random() < dt * 5 * k) this.fumo.emitir({ p: new V3(e.x + rs(e.s), y + 0.1, e.z + rs(e.s)), v: new V3(0, rnd(0.3, 0.8), 0), vida: 1.6, t0: 0.3, t1: 1.1, c0: [0.18, 0.45, 0.1], a0: 0.3, a1: 0, q: 10, vento: 0.3 }); } }
    this.luz.mat.uniforms.esc.value = this.fumo.mat.uniforms.esc.value = this.ctx.renderer.domElement.height / (2 * Math.tan(cam.fov * Math.PI / 360));
    this.luz.atualizar(dt, vento); this.fumo.atualizar(dt, vento); this.tremor = Math.max(0, this.tremor - dt * 1.8);
  }
}
