// A ilha vulcânica do Dragão e a ponte de pedra que sai do mirante.
// O relevo (a cratera, o fosso, os canais) vem do mapa.js; aqui ficam a lava, as colunas de basalto, as pedras, a ponte e o que se mexe:
// a fumaça do pico, as brasas, as bolhas, o vapor no mar, as erupções e a luz da lava.
import * as THREE from 'three';
import * as M from './mapa.js';
import { altura } from './natureza.js';
import { Obra, telhado } from './obra.js';
import { recorte } from './texgen.js';

const V3 = THREE.Vector3; const PI = Math.PI;
const rnd = (a, b) => a + Math.random() * (b - a); const rs = (a) => (Math.random() - 0.5) * 2 * a;
const angDif = (a, b) => { let d = a - b; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; return d; };

// ---------- a lava: placas de crosta escura com fendas acesas, que andam com a corrente ----------
function materialLava(ctx, { vel = [0, 0], giro = 0, aberta = 0, escala = 1.7 } = {}) {
  const m = new THREE.ShaderMaterial({
    fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uVel: { value: new THREE.Vector2(vel[0], vel[1]) }, uGiro: { value: giro }, uAberta: { value: aberta }, uEsc: { value: escala }, uForca: { value: 1 } }]),
    vertexShader: /* glsl */`attribute vec2 coord; attribute float borda; varying vec2 vC; varying float vB; varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){ vC=coord; vB=borda; vec4 wp=modelMatrix*vec4(position,1.); vW=wp.xyz; vec4 mvPosition=viewMatrix*wp; gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`uniform sampler2D tR; uniform float uT,uGiro,uAberta,uEsc,uForca; uniform vec2 uVel; varying vec2 vC; varying float vB; varying vec3 vW;
      #include <fog_pars_fragment>
      vec2 h2(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return fract(sin(p)*43758.5453); }
      // a distância até a borda da placa (0 na fenda) e o número da placa
      float placas(vec2 x, out float id){ vec2 n=floor(x), f=fract(x); vec2 mg=vec2(0.), mr=vec2(0.); float md=8.;
        for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ vec2 g=vec2(float(i),float(j)); vec2 r=g+h2(n+g)-f; float d=dot(r,r); if(d<md){ md=d; mr=r; mg=g; } }
        id=h2(n+mg+7.3).x; md=8.;
        for(int j=-2;j<=2;j++) for(int i=-2;i<=2;i++){ vec2 g=mg+vec2(float(i),float(j)); vec2 r=g+h2(n+g)-f; vec2 dr=r-mr; if(dot(dr,dr)>.00001) md=min(md,dot(.5*(mr+r),normalize(dr))); }
        return md; }
      vec3 rampa(float q){ vec3 c=mix(vec3(.026,.019,.019),vec3(.34,.022,.003),smoothstep(.08,.34,q)); c=mix(c,vec3(1.7,.2,.012),smoothstep(.32,.58,q)); c=mix(c,vec3(4.2,1.05,.1),smoothstep(.56,.82,q)); return mix(c,vec3(7.5,3.9,1.1),smoothstep(.84,1.,q)); }
      void main(){
        float a=uGiro*uT; vec2 p=vec2(vC.x*cos(a)-vC.y*sin(a), vC.x*sin(a)+vC.y*cos(a))-uVel*uT;
        vec3 rd=texture2D(tR,p/13.).rgb; vec3 rd2=texture2D(tR,p/3.3+.4).rgb;
        if(vB>0. && vB>rd2.r*.75+rd.g*.45) discard;                                                  // a ponta e as beiras desfiadas, onde a lava entra no mar
        float id; float bd=placas(p/uEsc+(rd.rg-.5)*.55, id);
        float fenda=1.-smoothstep(.008,.05+.07*rd2.g+.06*uAberta,bd);                                  // as fendas entre as placas
        float mole=smoothstep(.8-uAberta*.6,.98-uAberta*.5,id+(rd.b-.5)*.5);                          // placas que derreteram
        float brasa=smoothstep(.35,.75,rd.g)*.3*(1.-smoothstep(.0,.3,bd));                              // o vermelho por baixo da crosta, perto das fendas
        float calor=max(max(fenda*(.8+.2*rd2.b), mole*(.6+.3*rd.r)), brasa); calor=clamp(calor+uAberta*.2*rd2.g,0.,1.);
        calor*=.84+.16*sin(uT*1.7+id*40.+rd.r*6.);
        vec3 c=rampa(calor); c+=vec3(.05,.04,.04)*(.4+rd2.r)*(1.-calor);                              // a crosta fria pega um pouco da luz do céu
        gl_FragColor=vec4(c*uForca,1.);
        #include <fog_fragment>
      }`,
  });
  m.uniforms.uT = ctx.uTempo; m.uniforms.tR = { value: ctx.T.ruido }; return m;
}
function malhaLava(P, C, B, I) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('coord', new THREE.Float32BufferAttribute(C, 2)); g.setAttribute('borda', new THREE.Float32BufferAttribute(B, 1)); g.setIndex(I); return g; }

function criarLava(ctx) {
  const V = M.VULCAO; const cena = ctx.cena; const lavas = [];
  // o lago do fosso: um anel em volta do pátio, girando devagar
  { const P = [], C = [], B = [], I = []; const n = 96, r0 = V.patio - 2.2, r1 = V.fosso + 1.9;
    for (let k = 0; k <= n; k++) { const a = k / n * 2 * PI, c = Math.cos(a), s = Math.sin(a); P.push(V.x + c * r0, V.lava, V.z + s * r0, V.x + c * r1, V.lava, V.z + s * r1); C.push(c * r0, s * r0, c * r1, s * r1); B.push(0, 0); }
    for (let k = 0; k < n; k++) { const i = k * 2; I.push(i, i + 2, i + 1, i + 1, i + 2, i + 3); }
    const m = new THREE.Mesh(malhaLava(P, C, B, I), materialLava(ctx, { giro: 0.016, aberta: 0.05, escala: 1.9 })); m.material.side = THREE.DoubleSide; m.name = 'lava_lago'; cena.add(m); lavas.push(m); }
  // os canais: fitas que seguem os pontos do canal, na altura da lava
  for (const v of M.vulcaoVeios()) {
    const P = [], C = [], B = [], I = []; const p = v.pts, W = v.larg / 2 + 1.25; let s = 0; let incl = 0;
    for (let i = 0; i < p.length; i++) {
      const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)]; let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      if (i > 0) { s += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y, p[i].z - p[i - 1].z); incl += Math.abs(p[i].y - p[i - 1].y); }
      const noMar = p[i].y < 0.3 ? 1 : 0; const fim = Math.max(0, 1 - (p.length - 1 - i) / 3) * (p[p.length - 1].y < 0.3 ? 1 : 0);
      for (const lado of [-1, 0, 1]) { P.push(p[i].x - tz * W * lado, p[i].y, p[i].z + tx * W * lado); C.push(W * lado, s); B.push(Math.max(fim, lado ? noMar * 0.95 : noMar * 0.12)); }
      if (i > 0) { const k = (i - 1) * 3; I.push(k, k + 3, k + 1, k + 1, k + 3, k + 4, k + 1, k + 4, k + 2, k + 2, k + 4, k + 5); }
    }
    const queda = incl / Math.max(1, s);    // 0 no plano, perto de 1 na cascata
    const m = new THREE.Mesh(malhaLava(P, C, B, I), materialLava(ctx, { vel: [0, 0.5 + 2.4 * queda], aberta: 0.12 + 0.5 * queda, escala: 1.3 })); m.material.side = THREE.DoubleSide; m.name = 'lava_' + v.nome; cena.add(m); lavas.push(m);
    if (v.boca) {   // a boca do pico: uma poça acesa
      const b = p[0]; const g = new THREE.CircleGeometry(v.boca + 1.3, 24).rotateX(-PI / 2); const pos = g.attributes.position; const CC = [], BB = []; for (let i = 0; i < pos.count; i++) { CC.push(pos.getX(i), pos.getZ(i)); BB.push(0); }
      g.setAttribute('coord', new THREE.Float32BufferAttribute(CC, 2)); g.setAttribute('borda', new THREE.Float32BufferAttribute(BB, 1)); g.translate(b.x, b.y - 0.03, b.z);
      const mb = new THREE.Mesh(g, materialLava(ctx, { giro: 0.05, aberta: 0.75, escala: 1.0 })); mb.name = 'lava_boca'; cena.add(mb); lavas.push(mb);
    }
  }
  for (const m of lavas) { m.frustumCulled = false; m.renderOrder = 1; }
  return lavas;
}

// ---------- o basalto: colunas de seis lados e pedras soltas ----------
function criarBasalto(ctx) {
  const V = M.VULCAO; const r = M.semente(7331); const cena = ctx.cena;
  const mat = new THREE.MeshStandardMaterial({ map: ctx.T.rocha.cor, normalMap: ctx.T.rocha.normal, color: 0x55535a, roughness: 1, envMapIntensity: 0.5 }); mat.normalScale.set(1.5, 1.5);
  mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <roughnessmap_fragment>', 'float roughnessFactor = roughness * (.55+.45*texture2D( map, vMapUv ).a);'); };
  recorte(mat);   // as colunas entre a câmera e o herói abrem um vão
  const cols = [];   // {x, y, z, r, h, rot}
  const veios = M.vulcaoVeios(); const longeDosVeios = (x, z, d) => { for (const v of veios) for (const p of v.pts) if (Math.hypot(p.x - x, p.z - z) < d + v.larg / 2) return false; return true; };
  // um feixe de colunas num favo: as do meio mais altas
  const feixe = (cx, cz, d, H, aneis = 2, cheio = 0.8, y0 = null) => {
    const rot = r() * PI / 3, c = Math.cos(rot), s = Math.sin(rot);
    for (let j = -aneis; j <= aneis; j++) for (let i = -aneis; i <= aneis; i++) {
      const dist = Math.max(Math.abs(i), Math.abs(j), Math.abs(i + j)); if (dist > aneis || r() > cheio + (dist === 0 ? 1 : 0)) continue;
      const lx = (i + j / 2) * d, lz = j * 0.866 * d; const x = cx + lx * c - lz * s, z = cz + lx * s + lz * c; if (M.vulcaoAndavel(x, z) || !longeDosVeios(x, z, 1.2) || Math.hypot(x - M.ESTATUA.x, z - M.ESTATUA.z) < M.ESTATUA.r + 1.3) continue;
      const ch = y0 ?? altura(x, z); const h = Math.max(0.5, Math.round((H * (1 - 0.24 * dist) * (0.75 + r() * 0.5)) / 0.35) * 0.35);
      cols.push({ x, z, y: ch - 0.8, h: h + 0.8, r: d / 1.732 * 1.012, rot });
    }
  };
  // ao pé da parede de dentro, em volta do fosso
  for (let k = 0; k < 54; k++) {
    const a = r() * 2 * PI; if (Math.abs(angDif(a, PI)) < 0.36) continue; const ro = V.fosso + 1.3 + r() * 2.6; const x = V.x + Math.cos(a) * ro, z = V.z + Math.sin(a) * ro;
    if (!longeDosVeios(x, z, 2.6)) continue; feixe(x, z, 0.85 + r() * 0.5, 1.6 + r() * 3.4 + 2.2 * Math.exp(-(angDif(a, V.picoAng) ** 2) / 0.6), r() < 0.4 ? 2 : 1, 0.82);
  }
  // os dois lados do corredor da entrada: um portal de colunas
  for (const s of [-1, 1]) { for (let k = 0; k < 7; k++) { const x = V.x - V.fosso - 1.5 - k * 1.75 - r() * 0.6, z = V.z + s * (4.3 + r() * 1.3); feixe(x, z, 0.9 + r() * 0.35, 2.4 + r() * 3.2 + (k === 6 ? 2.2 : 0), 1, 0.85); }
    feixe(V.x - V.R + (s < 0 ? 5.8 : 3.4), V.z + s * 4.6, 1.15, 6.4, 2, 0.9); }
  // espigões na crista
  for (let k = 0; k < 26; k++) { const a = r() * 2 * PI; if (Math.abs(angDif(a, PI)) < 0.3) continue; const ro = V.crista + (r() - 0.3) * 2.4 + V.picoCrista * Math.exp(-(angDif(a, V.picoAng) ** 2) / 0.5); const x = V.x + Math.cos(a) * ro, z = V.z + Math.sin(a) * ro; if (!longeDosVeios(x, z, 3)) continue; feixe(x, z, 0.8 + r() * 0.4, 1.4 + r() * 2.6, 1, 0.7); }
  // os degraus de basalto na beira do mar
  for (let k = 0; k < 30; k++) { const a = r() * 2 * PI; if (Math.abs(angDif(a, PI)) < 0.22) continue; const ro = V.R + V.picoR * Math.exp(-(angDif(a, V.picoAng) ** 2) / 0.5) + r() * 3.5 - 0.5; const x = V.x + Math.cos(a) * ro, z = V.z + Math.sin(a) * ro; if (!longeDosVeios(x, z, 3)) continue; const h0 = altura(x, z); if (h0 > 1.2 || h0 < -3.2) continue; feixe(x, z, 1.0 + r() * 0.5, 0.9 + r() * 1.5, r() < 0.5 ? 2 : 1, 0.8, Math.max(h0, -0.6)); }
  // as colunas: uma malha só
  {
    const g = new THREE.CylinderGeometry(1, 1, 1, 6, 1).translate(0, 0.5, 0); const uv = g.attributes.uv, nn = g.attributes.normal, pp = g.attributes.position;
    for (let i = 0; i < uv.count; i++) { if (Math.abs(nn.getY(i)) > 0.5) uv.setXY(i, pp.getX(i) * 0.35 + 0.5, pp.getZ(i) * 0.35 + 0.5); else uv.setXY(i, uv.getX(i) * 2, uv.getY(i)); }
    const im = new THREE.InstancedMesh(g, mat, cols.length); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new V3(), p = new V3(), cor = new THREE.Color(), eixo = new V3(0, 1, 0), eu = new THREE.Euler();
    cols.forEach((c, i) => { eu.set((r() - 0.5) * 0.04, -c.rot, (r() - 0.5) * 0.04); q.setFromEuler(eu); p.set(c.x, c.y, c.z); e.set(c.r, c.h, c.r); m4.compose(p, q, e); im.setMatrixAt(i, m4); const v = 0.72 + r() * 0.5; cor.setRGB(v, v * (0.97 + r() * 0.05), v * (1 + r() * 0.06)); im.setColorAt(i, cor); });
    im.castShadow = im.receiveShadow = true; im.frustumCulled = false; im.name = 'basalto_colunas'; cena.add(im);
  }
  // as pedras soltas
  {
    const vars = [];
    for (let v = 0; v < 3; v++) {
      const g = new THREE.IcosahedronGeometry(1, 3); const p = g.attributes.position; const sx = 0.8 + r() * 0.6, sy = 0.55 + r() * 0.5, sz = 0.8 + r() * 0.6;
      for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const n = 1 + 0.34 * M.fbm(x * 1.1 + v * 9, z * 1.1 + y * 0.8, 3) + 0.14 * M.fbm(x * 3.4 + y, z * 3.4 - y + v, 2); x *= n * sx; y *= n * sy; z *= n * sz; if (y < -0.25) y = -0.25 + (y + 0.25) * 0.2; p.setXYZ(i, x, y, z); }
      g.computeVertexNormals(); const nn = g.attributes.normal, uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) { const ax = Math.abs(nn.getX(i)), ay = Math.abs(nn.getY(i)), az = Math.abs(nn.getZ(i)); if (ay >= ax && ay >= az) uv.setXY(i, p.getX(i) / 2.5, p.getZ(i) / 2.5); else if (ax >= az) uv.setXY(i, p.getZ(i) / 2.5, p.getY(i) / 2.5); else uv.setXY(i, p.getX(i) / 2.5, p.getY(i) / 2.5); }
      vars.push(g);
    }
    const lista = []; let tent = 0;
    while (lista.length < 120 && tent++ < 4000) {
      const a = r() * 2 * PI, ro = V.patio - 1.2 + r() * (V.R + 8 - V.patio); const x = V.x + Math.cos(a) * ro, z = V.z + Math.sin(a) * ro; const h = altura(x, z);
      if (h < -1.2 || (h < V.lava + 0.3 && ro < V.crista) || M.vulcaoAndavel(x, z) || !longeDosVeios(x, z, 1.4) || Math.hypot(x - M.ESTATUA.x, z - M.ESTATUA.z) < M.ESTATUA.r + 1.5) continue; if (Math.abs(z - V.z) < 3.2 && x < V.x - V.patio + 3) continue;
      lista.push({ x, z, y: h, s: ro < V.patio + 0.5 ? 0.3 + r() * 0.35 : 0.35 + r() * r() * 2.3, v: (r() * 3) | 0, rot: r() * 2 * PI });
    }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new V3(), p = new V3();
    for (let v = 0; v < 3; v++) { const arr = lista.filter(a => a.v === v); const im = new THREE.InstancedMesh(vars[v], mat, arr.length);
      arr.forEach((a, i) => { q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.5, a.rot, (r() - 0.5) * 0.5)); p.set(a.x, a.y + 0.05 * a.s, a.z); e.setScalar(a.s); m4.compose(p, q, e); im.setMatrixAt(i, m4); });
      im.castShadow = im.receiveShadow = true; im.frustumCulled = false; im.name = 'basalto_pedras'; cena.add(im); }
  }
  return mat;
}

// ---------- a ponte de pedra: a rampa que desce do mirante, três arcos sobre o mar e a cabeceira na ilha ----------
function criarPonte(ctx) {
  const B = M.PONTE, yD = M.alturaPonte, z0 = B.z - B.larg / 2, z1 = B.z + B.larg / 2, FUNDO = -4.4; const o = new Obra(); const xa = B.xr - 0.45, xb = B.x2 + 0.7;
  // uma barra de pedra de A a B (segue a inclinação do tabuleiro)
  const barra = (mat, ax, ay, bx, by, z, alt, esp, esc = 1.4) => { const len = Math.hypot(bx - ax, by - ay); const g = new THREE.BoxGeometry(len + 0.02, alt, esp); g.rotateZ(Math.atan2(by - ay, bx - ax)); g.translate((ax + bx) / 2, (ay + by) / 2 + alt / 2, z); o.add(mat, g, esc); };
  // o corpo, num perfil só
  const margem = 0.9, pilar = 1.6, vaoL = 5.0, vaoC = 6.5; const arcos = [[B.x0 + margem, vaoL], [B.x0 + margem + vaoL + pilar, vaoC], [B.x0 + margem + vaoL + pilar + vaoC + pilar, vaoL]]; const NASC = 0.45;
  const sh = new THREE.Shape(); sh.moveTo(xa, FUNDO); for (let x = xa; x < xb; x += 0.5) sh.lineTo(x, yD(x) - 0.03); sh.lineTo(xb, yD(xb) - 0.03); sh.lineTo(xb, FUNDO); sh.closePath();
  const arcoPts = (a, w, folga) => { const cx = a + w / 2, topo = yD(cx) - 0.78; const pts = []; for (let k = 0; k <= 22; k++) { const th = PI - k / 22 * PI; pts.push([cx + (w / 2 + folga) * Math.cos(th), NASC + (topo - NASC + folga) * Math.sin(th)]); } return pts; };
  for (const [a, w] of arcos) { const h = new THREE.Path(); h.moveTo(a, FUNDO + 0.3); for (const [x, y] of arcoPts(a, w, 0)) h.lineTo(x, y); h.lineTo(a + w, FUNDO + 0.3); h.closePath(); sh.holes.push(h); }
  { const g = new THREE.ExtrudeGeometry(sh, { depth: B.larg, bevelEnabled: false, curveSegments: 4 }); g.translate(0, 0, z0); o.add('pedra', g, 2.2); }
  // as aduelas (o aro claro de cada arco)
  for (const [a, w] of arcos) { const s2 = new THREE.Shape(); const fora = arcoPts(a, w, 0.36), dentro = arcoPts(a, w, 0).reverse(); s2.moveTo(fora[0][0], fora[0][1]); for (const [x, y] of fora) s2.lineTo(x, y); for (const [x, y] of dentro) s2.lineTo(x, y); s2.closePath();
    const g = new THREE.ExtrudeGeometry(s2, { depth: B.larg + 0.24, bevelEnabled: false, curveSegments: 4 }); g.translate(0, 0, z0 - 0.12); o.add('pedraClara', g, 1.4); }
  // os talhamares dos dois pilares e os pilares de reforço até o tabuleiro
  const pilares = [B.x0 + margem + vaoL + pilar / 2, B.x0 + margem + vaoL + pilar + vaoC + pilar / 2];
  for (const px of pilares) for (const s of [-1, 1]) {
    const zz = s > 0 ? z1 : z0; const g = new THREE.CylinderGeometry(1.0, 1.2, 1.6 - FUNDO, 3, 1); if (s < 0) g.rotateY(PI); g.scale(0.92, 1, 1); g.translate(px, (1.6 + FUNDO) / 2, zz + s * 0.42); o.add('pedra', g, 2.2);
    const gc = new THREE.ConeGeometry(1.0, 1.1, 3); if (s < 0) gc.rotateY(PI); gc.scale(0.92, 1, 1); gc.translate(px, 1.6 + 0.55, zz + s * 0.42); o.add('pedraClara', gc, 1.4);
    o.caixa('pedra', px - 0.5, 1.6, zz + (s > 0 ? -0.05 : -0.3), px + 0.5, yD(px) - 0.03, zz + (s > 0 ? 0.3 : 0.05), 2.2);
  }
  // a cornija, o piso, o meio-fio
  for (let x = xa; x < xb - 0.01; x += 1.0) { const x2 = Math.min(xb, x + 1.0); for (const s of [-1, 1]) { barra('pedraClara', x, yD(x) - 0.2, x2, yD(x2) - 0.2, (s > 0 ? z1 : z0) + s * 0.07, 0.2, 0.3); if (!(s < 0 && x > B.x1 - 0.45)) barra('pedraClara', x, yD(x) - 0.01, x2, yD(x2) - 0.01, (s > 0 ? z1 : z0) - s * 0.19, 0.17, 0.38); } }
  { const P = [], I = []; let k = 0; for (let x = xa + 0.1; x <= xb - 0.1 + 1e-6; x += 0.5) { P.push(x, yD(x) + 0.03, z0 + 0.3, x, yD(x) + 0.03, z1 - 0.3); if (k > 0) { const i = (k - 1) * 2; I.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); } k++; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals(); o.add('pisoPedra', g, 2.2); }
  // a balaustrada: pilaretes, corrimão e painel; nos pilares e nas pontas, pilaretes maiores com lanterna
  const listaPostes = (grandes) => { const ps = []; for (let i = 0; i < grandes.length - 1; i++) { const a = grandes[i], b = grandes[i + 1]; const n = Math.max(1, Math.round((b - a) / 1.75)); for (let k = 0; k < n; k++) ps.push([a + (b - a) * k / n, k === 0]); } ps.push([grandes[grandes.length - 1], true]); return ps; };
  for (const s of [-1, 1]) {
    const zz = (s > 0 ? z1 : z0) - s * 0.19; const postes = listaPostes(s > 0 ? [B.xr + 0.25, B.x0, ...pilares, B.x1, B.x2 + 0.25] : [B.xr + 0.25, B.x0, ...pilares, B.x1 - 0.45]);   // ao norte, a boca do passadiço do terraço fica aberta
    postes.forEach(([x, grande], i) => {
      const y = yD(x) + 0.14;
      if (grande) { o.caixa('pedraClara', x - 0.19, y, zz - 0.19, x + 0.19, y + 1.22, zz + 0.19, 1.4); o.caixa('pedraClara', x - 0.25, y + 1.22, zz - 0.25, x + 0.25, y + 1.32, zz + 0.25, 1.4);
        o.caixa('luzPapel', x - 0.16, y + 1.32, zz - 0.16, x + 0.16, y + 1.66, zz + 0.16); for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) o.caixa('pedraClara', x + a * 0.18 - 0.035, y + 1.32, zz + b * 0.18 - 0.035, x + a * 0.18 + 0.035, y + 1.68, zz + b * 0.18 + 0.035, 1.4);
        const gt = new THREE.ConeGeometry(0.42, 0.34, 4).rotateY(PI / 4); gt.translate(x, y + 1.85, zz); o.add('pedraClara', gt, 1.4); ctx.lanternas.push({ x, y: y + 1.5, z: zz, s: 0.85, cor: 1 }); }
      else { o.caixa('pedraClara', x - 0.11, y, zz - 0.11, x + 0.11, y + 0.98, zz + 0.11, 1.4); const g = new THREE.SphereGeometry(0.135, 8, 6); g.scale(1, 1.2, 1); g.translate(x, y + 1.08, zz); o.add('pedraClara', g, 1.4); }
      if (i < postes.length - 1) { const x2 = postes[i + 1][0], y2 = yD(x2) + 0.14; barra('pedraClara', x, y + 0.74, x2, y2 + 0.74, zz, 0.13, 0.15); barra('pedraClara', x, y + 0.12, x2, y2 + 0.12, zz, 0.5, 0.09); }
    });
  }
  // o portal na entrada da ponte: duas colunas de laca, a viga pintada, o telhado de telha e a placa
  {
    const xg = B.x0 - 1.3, yg = yD(xg); const zc = [z0 - 0.5, z1 + 0.5];
    for (const zz of zc) { o.caixa('pedra', xg - 0.75, FUNDO, zz - 0.75, xg + 0.75, yg + 0.05, zz + 0.75, 2.2); o.caixa('pedraClara', xg - 0.85, yg + 0.05, zz - 0.85, xg + 0.85, yg + 0.25, zz + 0.85, 1.4); o.cilindro('pedraClara', xg, yg + 0.25, zz, 0.42, 0.3, 10, 0.34, 1.4); o.cilindro('laca', xg, yg + 0.55, zz, 0.27, 4.75, 14, 0.24, 1.6); }
    o.caixa('madeiraEsc', xg - 0.17, yg + 4.2, z0 - 1.45, xg + 0.17, yg + 4.52, z1 + 1.45, 1.5); o.caixa('madeiraEsc', xg - 0.13, yg + 3.55, z0 - 0.5, xg + 0.13, yg + 3.78, z1 + 0.5, 1.5);
    o.entrar(xg, yg, B.z, PI / 2);
    o.faixa('pintura', -B.larg / 2 - 1.0, 4.56, -0.13, B.larg / 2 + 1.0, 5.02, 0.13); { const gp = new THREE.BoxGeometry(2.1, 0.79, 0.14); gp.translate(0, 4.12, 0); o.add('placa', gp); }
    o.entrar(0, 5.02, 0); telhado(o, { W: B.larg + 4.0, D: 2.7, w: B.larg + 2.0, d: 0, H: 1.0, bico: 0.6, nu: 14, nv: 5 }); o.sair();
    for (const lx of [-1.75, 1.75]) { const pts = [[0.001, 0.36], [0.09, 0.35], [0.2, 0.26], [0.27, 0.1], [0.27, -0.1], [0.2, -0.26], [0.09, -0.35], [0.001, -0.36]].map(p => new THREE.Vector2(p[0], p[1])); o.malha('lanterna', new THREE.LatheGeometry(pts, 16), lx, 3.02, 0); o.cilindro('ouro', lx, 3.36, 0, 0.1, 0.07, 8); o.cilindro('ouro', lx, 2.6, 0, 0.1, 0.07, 8); o.cilindro('madeiraEsc', lx, 3.4, 0, 0.012, 0.16, 4); const w = new V3(lx, 3.02, 0).applyMatrix4(o.m); ctx.lanternas.push({ x: w.x, y: w.y, z: w.z, s: 1.1, cor: 0 }); }
    o.sair();
  }
  // na ilha, dois pilares de basalto com fogo (as colunas vêm do favo; aqui as bacias)
  for (const s of [-1, 1]) { const x = B.x2 + 1.9, z = B.z + s * 3.3, y = altura(x, z); o.cilindro('pedra', x, y - 0.4, z, 0.62, 2.5, 6, 0.5, 2.2);
    const pts = [[0.001, 0], [0.2, 0.02], [0.5, 0.16], [0.64, 0.36], [0.6, 0.42], [0.46, 0.3], [0.001, 0.24]].map(p => new THREE.Vector2(p[0], p[1])); o.malha('bronze', new THREE.LatheGeometry(pts, 16), x, y + 2.05, z); o.cilindro('brasa', x, y + 2.36, z, 0.44, 0.04, 12);
    ctx.fogos.push({ x, y: y + 2.42, z, s: 0.95 }); ctx.lanternas.push({ x, y: y + 2.8, z, s: 2.2, cor: 2 }); }
  // o terraço da estátua do Imugi: um tambor de pedra ao norte do fim da ponte, ligado a ela por um passadiço, com balaustrada em volta
  {
    const E = M.ESTATUA, yT = E.y, R = E.r; const zN = E.z + R - 0.5;   // onde o passadiço encosta no terraço
    o.cilindro('pedra', E.x, FUNDO, E.z, R + 0.3, yT - FUNDO - 0.03, 36, R, 2.2); o.cilindro('pedraClara', E.x, yT - 0.24, E.z, R + 0.12, 0.22, 36, R + 0.12, 1.4);
    { const g = new THREE.CircleGeometry(R - 0.3, 40).rotateX(-PI / 2); g.translate(E.x, yT + 0.03, E.z); o.add('pisoPedra', g, 2.2); }
    o.cilindro('pedraClara', E.x, yT + 0.02, E.z, E.alt * 0.36, 0.16, 8, E.alt * 0.355, 1.4);                                   // o degrau embaixo da estátua
    const nx0 = B.x1 - 0.25, nx1 = B.x2 + 0.75;                                                                                 // o passadiço
    o.caixa('pedra', nx0, FUNDO, zN - 0.2, nx1, yT - 0.03, z0 + 0.3, 2.2); { const g = new THREE.PlaneGeometry(nx1 - nx0 - 0.5, z0 + 0.3 - zN).rotateX(-PI / 2); g.translate((nx0 + nx1) / 2, yT + 0.03, (zN + z0 + 0.3) / 2); o.add('pisoPedra', g, 2.2); }
    const barraH = (mat, ax, az, bx, bz, y, alt, esp) => { const len = Math.hypot(bx - ax, bz - az); const g = new THREE.BoxGeometry(len + 0.02, alt, esp); g.rotateY(-Math.atan2(bz - az, bx - ax)); g.translate((ax + bx) / 2, y + alt / 2, (az + bz) / 2); o.add(mat, g, 1.4); };
    const poste = (x, z, grande) => { const y = yT + 0.03; if (grande) { o.caixa('pedraClara', x - 0.19, y, z - 0.19, x + 0.19, y + 1.22, z + 0.19, 1.4); o.caixa('pedraClara', x - 0.25, y + 1.22, z - 0.25, x + 0.25, y + 1.32, z + 0.25, 1.4); o.caixa('luzPapel', x - 0.16, y + 1.32, z - 0.16, x + 0.16, y + 1.66, z + 0.16); const gt = new THREE.ConeGeometry(0.42, 0.34, 4).rotateY(PI / 4); gt.translate(x, y + 1.85, z); o.add('pedraClara', gt, 1.4); ctx.lanternas.push({ x, y: y + 1.5, z, s: 0.85, cor: 1 }); }
      else { o.caixa('pedraClara', x - 0.11, y, z - 0.11, x + 0.11, y + 0.98, z + 0.11, 1.4); const g = new THREE.SphereGeometry(0.135, 8, 6); g.scale(1, 1.2, 1); g.translate(x, y + 1.08, z); o.add('pedraClara', g, 1.4); } };
    const corr = (ax, az, bx, bz) => { barraH('pedraClara', ax, az, bx, bz, yT + 0.03 + 0.74, 0.13, 0.15); barraH('pedraClara', ax, az, bx, bz, yT + 0.03 + 0.12, 0.5, 0.09); barraH('pedraClara', ax, az, bx, bz, yT + 0.02, 0.15, 0.36); };
    // em volta do terraço, menos a boca do passadiço (ao sul)
    const a0 = Math.asin(Math.min(1, ((nx1 - nx0) / 2 + 0.05) / (R - 0.2))); const n = 18; const pts = [];
    for (let k = 0; k <= n; k++) { const a = PI / 2 + a0 + (2 * PI - 2 * a0) * k / n; pts.push([E.x + Math.cos(a) * (R - 0.2) + ((nx0 + nx1) / 2 - E.x) * 0, E.z + Math.sin(a) * (R - 0.2)]); }
    pts.forEach(([x, z], i) => { poste(x, z, i === 0 || i === n || i === n / 2); if (i < n) corr(x, z, pts[i + 1][0], pts[i + 1][1]); });
    // os dois lados do passadiço
    for (const x of [nx0 + 0.19, nx1 - 0.19]) { const zc = E.z + Math.sqrt(Math.max(0, (R - 0.2) ** 2 - (x - E.x) ** 2)); corr(x, zc, x, z0 + 0.19); }
    M.plataformas.push({ x0: E.x - R, x1: E.x + R, z0: E.z - R, z1: E.z + R, f: (x, z) => Math.hypot(x - E.x, z - E.z) < R - 0.05 ? yT + 0.03 : null });
    M.plataformas.push({ x0: nx0 + 0.2, x1: nx1 - 0.2, z0: zN - 0.3, z1: z0 + 0.25, y: yT + 0.03 });
    ctx.terracoEstatua = { nx0, nx1, zN };
  }
  const malhas = o.finalizar(ctx.cena, ctx.mt, { semSombra: ['pisoPedra', 'luzPapel', 'brasa'] }); for (const m of malhas) m.name = 'ponte_' + m.name;
  // onde se pisa e o que barra o caminho
  M.plataformas.push({ x0: B.xr, x1: B.x2 + 0.6, z0: z0 + 0.1, z1: z1 - 0.1, f: (x) => yD(x) + 0.03 });
  M.bloquearRet(B.xr + 0.2, z0 - 1.2, B.x2, z0 + 0.45, 0); M.bloquearRet(B.xr + 0.2, z1 - 0.45, B.x2, z1 + 1.2, 0);
  M.liberarRet(B.xr - 0.3, B.z - 1.7, B.x2 + 0.8, B.z + 1.7);
  { const E = M.ESTATUA, t = ctx.terracoEstatua; M.liberarRet(t.nx0 + 0.55, t.zN - 0.6, t.nx1 - 0.55, B.z - 1.6);
    for (let x = E.x - E.r; x <= E.x + E.r; x += M.CEL) for (let z = E.z - E.r; z <= E.z + E.r; z += M.CEL) if (Math.hypot(x - E.x, z - E.z) < E.r - 0.75) M.liberarRet(x, z, x, z);
    M.bloquearCirc(E.x, E.z, E.alt * 0.33); }
}

export function criarVulcao(ctx) {
  criarPonte(ctx);
  ctx.lavas = criarLava(ctx);
  criarBasalto(ctx);
}

// ---------- o vulcão vivo ----------
export class Vulcao {
  constructor(ctx) {
    this.ctx = ctx; const V = M.VULCAO; const veios = M.vulcaoVeios(); this.cascata = veios.find(v => v.nome === 'cascata'); this.rio = veios.find(v => v.nome === 'rio'); this.lingua = veios.find(v => v.nome === 'lingua');
    const b = this.cascata.pts[0]; this.boca = new V3(b.x, b.y, b.z);
    // a luz da lava: três pontos sobre o fosso e um na boca do pico
    this.luzes = []; for (let k = 0; k < 3; k++) { const a = 0.4 + k * 2 * PI / 3; const l = new THREE.PointLight(0xff5a18, 0, 46, 1.7); l.position.set(V.x + Math.cos(a) * (V.fosso - 2), V.lava + 1.6, V.z + Math.sin(a) * (V.fosso - 2)); ctx.cena.add(l); this.luzes.push({ l, f: 150, fase: k * 2.1 }); }
    { const l = new THREE.PointLight(0xff6a20, 0, 60, 1.7); l.position.set(b.x, b.y + 3, b.z); ctx.cena.add(l); this.luzes.push({ l, f: 260, fase: 5 }); }
    this.bocasMar = [this.rio, this.lingua].map(v => v.pts.filter(p => p.y < 0.3)).filter(a => a.length);
    this.tErup = 9; this.tBolha = 0.5; this.acFum = 0; this.acBrasa = 0; this.acCinza = 0; this.acVapor = 0; this.acFio = 0; this.forca = 1; this.perto = 0; this.clarao = 0; this.arena = 0;
    this.foraDemo = !ctx.demo;
  }
  // a erupção: um jorro de lava na boca do pico, com trovão de terra
  erupcao(forte = 1) {
    const ctx = this.ctx, v = ctx.vfx, b = this.boca; const d = Math.hypot(ctx.heroi.pos.x - b.x, ctx.heroi.pos.z - b.z); const dc = ctx.camera.position.distanceTo(b); const vol = Math.max(0, Math.min(1.1, 1.3 - Math.min(d, dc) / 85));   // da vila quase não se ouve; do mirante, um estrondo ao longe
    for (let i = 0; i < 46 * forte; i++) { const a = rnd(0, 2 * PI), s = rnd(1.5, 7.5); v.luz.emitir({ p: new V3(b.x + rs(1.4), b.y + 0.4, b.z + rs(1.4)), v: new V3(Math.cos(a) * s, rnd(10, 21) * forte, Math.sin(a) * s), vida: rnd(2.4, 4.2), t0: rnd(0.5, 1.1), t1: 0.22, c0: [1, 0.72, 0.28], c1: [1, 0.16, 0.02], a0: 1, a1: 0.25, grav: 10.5, q: 0, chao: true, arr: 0.05 }); }
    for (let i = 0; i < 120 * forte; i++) { const a = rnd(0, 2 * PI), s = rnd(1, 10); v.luz.emitir({ p: new V3(b.x + rs(1.2), b.y + 0.6, b.z + rs(1.2)), v: new V3(Math.cos(a) * s, rnd(7, 26) * forte, Math.sin(a) * s), vida: rnd(1.4, 3.4), t0: rnd(0.12, 0.3), t1: 0.03, c0: [1, 0.8, 0.4], c1: [1, 0.25, 0.04], a0: 1, a1: 0, grav: 9, q: 2, arr: 0.25, vento: 0.5 }); }
    for (let i = 0; i < 22 * forte; i++) v.luz.emitir({ p: new V3(b.x + rs(1.6), b.y + rnd(0.5, 3), b.z + rs(1.6)), v: new V3(rs(2.4), rnd(5, 12), rs(2.4)), vida: rnd(0.9, 1.7), t0: 2.4, t1: rnd(6, 9), c0: [1, 0.5, 0.14], c1: [0.7, 0.1, 0.02], a0: 0.5, a1: 0, q: 1, arr: 0.8, giro: rs(0.6) });
    for (let i = 0; i < 26 * forte; i++) v.fumo.emitir({ p: new V3(b.x + rs(2), b.y + rnd(1, 4), b.z + rs(2)), v: new V3(rs(3), rnd(6, 12), rs(3)), vida: rnd(6, 10), t0: 3.4, t1: rnd(13, 20), c0: [0.07, 0.06, 0.06], c1: [0.27, 0.25, 0.25], a0: 0.8, a1: 0, q: 1, arr: 0.35, giro: rs(0.3), entra: 0.1, vento: 0.9 });
    this.clarao = 1; if (vol > 0.02) { ctx.som.tocar('erupcao', { vol, vel: 0.62, var: 0 }); ctx.agendar(0.25, () => ctx.som.tocar('terra', { vol: vol * 0.7, vel: 0.6, var: 0 })); }
    v.tremor = Math.max(v.tremor, 0.42 * Math.max(0, 1 - d / 70) * forte);
  }
  atualizar(dt) {
    const ctx = this.ctx, v = ctx.vfx, V = M.VULCAO, h = ctx.heroi; const cam = ctx.camera.position; const dCam = Math.hypot(cam.x - V.x, cam.z - V.z), dHer = Math.hypot(h.pos.x - V.x, h.pos.z - V.z);
    this.perto = Math.max(0, Math.min(1, 1 - (dHer - 22) / 60));
    // a arena: de 0 (na ponte) a 1 (dentro da ilha); a câmera usa para ir para trás do herói
    this.arena += ((1 - M.sstep(V.R - 7, V.R + 5, dHer)) - this.arena) * Math.min(1, dt * 2.5); if (this.arena < 0.0005) this.arena = 0;
    const t = ctx.tempo; this.clarao = Math.max(0, this.clarao - dt * 0.55);
    for (const L of this.luzes) L.l.intensity = L.f * (0.8 + 0.14 * Math.sin(t * 2.3 + L.fase) + 0.08 * Math.sin(t * 7.1 + L.fase * 3)) * (1 + this.clarao * 1.3);
    if (ctx.atm) { ctx.atm.u.uVulcao.value.set(V.x, V.lava, V.z, V.R + 6); ctx.atm.u.uVulcaoF.value = (0.5 + 0.06 * Math.sin(t * 1.9) + this.clarao * 0.45) * (1 - 0.35 * (ctx.clima ? ctx.clima.chuva : 0)); }
    if (dCam > 230) return; const k = dCam < 120 ? 1 : 0.5; const b = this.boca;
    // a coluna de fumaça do pico, com o clarão da boca por baixo
    this.acFum += dt * 15 * k; while (this.acFum > 1) { this.acFum -= 1;
      v.fumo.emitir({ p: new V3(b.x + rs(1.8), b.y + rnd(0.5, 2), b.z + rs(1.8)), v: new V3(rs(0.7), rnd(3.6, 6.2), rs(0.7)), vida: rnd(8, 13), t0: 2.6, t1: rnd(13, 21), c0: [0.085, 0.075, 0.075], c1: [0.36, 0.34, 0.34], a0: 0.66, a1: 0, q: 1, giro: rs(0.22), arr: 0.11, entra: 0.1, vento: 1.0 });
      if (Math.random() < 0.45) v.luz.emitir({ p: new V3(b.x + rs(1.3), b.y + rnd(0.3, 1.2), b.z + rs(1.3)), v: new V3(rs(0.5), rnd(2.5, 4.5), rs(0.5)), vida: rnd(0.9, 1.6), t0: 1.8, t1: rnd(4.5, 6.5), c0: [1, 0.42, 0.1], c1: [0.6, 0.08, 0.01], a0: 0.34, a1: 0, q: 1, giro: rs(0.4), arr: 0.3 });
      if (Math.random() < 0.6) v.luz.emitir({ p: new V3(b.x + rs(1.5), b.y + 0.5, b.z + rs(1.5)), v: new V3(rs(2.5), rnd(5, 12), rs(2.5)), vida: rnd(1.2, 2.6), t0: rnd(0.1, 0.22), t1: 0.03, c0: [1, 0.75, 0.3], c1: [1, 0.25, 0.04], a0: 1, a1: 0, grav: 6, q: 2, vento: 0.6 });
    }
    // as brasas e os fios de fumaça que sobem do lago
    this.acBrasa += dt * 34 * k; while (this.acBrasa > 1) { this.acBrasa -= 1; const a = rnd(0, 2 * PI), ro = rnd(V.patio + 0.4, V.fosso + 0.4); v.luz.emitir({ p: new V3(V.x + Math.cos(a) * ro, V.lava + 0.1, V.z + Math.sin(a) * ro), v: new V3(rs(0.5), rnd(0.9, 3.4), rs(0.5)), vida: rnd(1.6, 3.8), t0: rnd(0.06, 0.15), t1: 0.02, c0: [1, 0.66, 0.22], c1: [1, 0.2, 0.03], a0: 1, a1: 0, grav: -0.5, q: 2, vento: 0.7 }); }
    this.acFio += dt * 7 * k; while (this.acFio > 1) { this.acFio -= 1; const a = rnd(0, 2 * PI), ro = rnd(V.patio + 0.6, V.fosso); v.fumo.emitir({ p: new V3(V.x + Math.cos(a) * ro, V.lava + 0.2, V.z + Math.sin(a) * ro), v: new V3(rs(0.2), rnd(0.9, 1.7), rs(0.2)), vida: rnd(3, 5), t0: 0.5, t1: rnd(2.2, 3.6), c0: [0.16, 0.1, 0.09], c1: [0.3, 0.27, 0.27], a0: 0.3, a1: 0, q: Math.random() < 0.5 ? 10 : 1, giro: rs(0.4), arr: 0.2, entra: 0.2, vento: 0.6 }); }
    // as bolhas que estouram no lago e os respingos da cascata
    this.tBolha -= dt; if (this.tBolha <= 0) { this.tBolha = rnd(0.25, 0.9); const a = rnd(0, 2 * PI), ro = rnd(V.patio + 0.8, V.fosso - 0.2); const p = new V3(V.x + Math.cos(a) * ro, V.lava + 0.05, V.z + Math.sin(a) * ro);
      for (let i = 0; i < 9; i++) { const an = rnd(0, 2 * PI), s = rnd(0.4, 2.2); v.luz.emitir({ p, v: new V3(Math.cos(an) * s, rnd(2.2, 5.4), Math.sin(an) * s), vida: rnd(0.7, 1.3), t0: rnd(0.16, 0.34), t1: 0.07, c0: [1, 0.74, 0.3], c1: [1, 0.2, 0.03], a0: 1, a1: 0.2, grav: 9.5, q: 0 }); }
      v.luz.emitir({ p, vida: 0.4, t0: 0.5, t1: 2.2, c0: [1, 0.6, 0.2], a0: 0.6, a1: 0, q: 0 }); v.luz.emitir({ p, vida: 0.55, t0: 0.3, t1: 1.7, c0: [1, 0.55, 0.15], a0: 0.8, a1: 0, q: 5, rot: 0 });
      const c = this.cascata.pts[this.cascata.pts.length - 2]; for (let i = 0; i < 5; i++) v.luz.emitir({ p: new V3(c.x + rs(0.9), V.lava + 0.2, c.z + rs(0.9)), v: new V3(rs(1.6), rnd(1.5, 4.2), rs(1.6)), vida: rnd(0.5, 1.1), t0: rnd(0.14, 0.3), t1: 0.05, c0: [1, 0.78, 0.34], c1: [1, 0.22, 0.03], a0: 1, a1: 0, grav: 9, q: 0 });
    }
    // o vapor onde a lava entra no mar
    this.acVapor += dt * 9 * k; while (this.acVapor > 1) { this.acVapor -= 1; for (const lista of this.bocasMar) { const p = lista[(Math.random() * lista.length) | 0]; v.fumo.emitir({ p: new V3(p.x + rs(1.5), 0.2, p.z + rs(1.5)), v: new V3(rs(0.5), rnd(1.6, 3), rs(0.5)), vida: rnd(3.5, 6), t0: 1.0, t1: rnd(5, 8.5), c0: [0.93, 0.93, 0.95], c1: [0.8, 0.82, 0.86], a0: 0.34, a1: 0, q: 1, giro: rs(0.3), arr: 0.2, entra: 0.15, vento: 0.9 }); } }
    // a cinza e as fagulhas no ar, quando a câmera está na ilha
    if (dCam < V.R + 34) { const c = ctx.cam.cine ? ctx.cam.cine.alvo : ctx.cam.alvo;
      this.acCinza += dt * 26; while (this.acCinza > 1) { this.acCinza -= 1; v.fumo.emitir({ p: new V3(c.x + rs(20), c.y + rnd(1, 13), c.z + rs(20)), v: new V3(rs(0.3), rnd(-0.75, -0.25), rs(0.3)), vida: rnd(4, 7), t0: rnd(0.04, 0.085), t1: 0.05, c0: [0.3, 0.29, 0.29], a0: 0.85, a1: 0, q: 1, giro: rs(2), vento: 0.5, entra: 0.1 });
        if (Math.random() < 0.3) v.luz.emitir({ p: new V3(c.x + rs(18), c.y + rnd(0, 7), c.z + rs(18)), v: new V3(rs(0.5), rnd(0.2, 1.2), rs(0.5)), vida: rnd(2, 4), t0: rnd(0.05, 0.11), t1: 0.02, c0: [1, 0.6, 0.2], c1: [1, 0.2, 0.04], a0: 0.9, a1: 0, q: 2, vento: 0.8 }); } }
    // as erupções: de tempos em tempos (na demonstração, só quando o roteiro manda)
    if (this.foraDemo && !ctx.demo) { this.tErup -= dt; if (this.tErup <= 0) { this.tErup = rnd(13, 24); this.erupcao(Math.random() < 0.3 ? 1.5 : 1); } }
  }
}
