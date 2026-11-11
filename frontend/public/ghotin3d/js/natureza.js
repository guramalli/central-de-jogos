// A natureza: o relevo, a grama, o mar e o lago, o céu, as árvores e as pedras.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Water } from 'three/addons/objects/Water.js';
import * as M from './mapa.js';
import { pbr, recorte, MACRO } from './texgen.js';

const { TAM, fbm, sstep, clamp, lerp } = M;
export const NG = 640;                       // nós da grade de altura (0,56 m)
export const alt = new Float32Array((NG + 1) * (NG + 1));
export function prepararAlturas() {
  for (let j = 0; j <= NG; j++) for (let i = 0; i <= NG; i++) alt[j * (NG + 1) + i] = M.alturaTerreno(i / NG * TAM - TAM / 2, j / NG * TAM - TAM / 2);
}
// altura do relevo por interpolação da grade (rápida)
export function altura(x, z) {
  const fx = clamp((x + TAM / 2) / TAM * NG, 0, NG - 0.001), fz = clamp((z + TAM / 2) / TAM * NG, 0, NG - 0.001);
  const i = fx | 0, j = fz | 0, a = fx - i, b = fz - j, k = j * (NG + 1) + i;
  return (alt[k] * (1 - a) + alt[k + 1] * a) * (1 - b) + (alt[k + NG + 1] * (1 - a) + alt[k + NG + 2] * a) * b;
}
export function piso(x, z) {
  for (const p of M.plataformas) if (x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1) { const y = p.f ? p.f(x, z) : p.y; if (y != null) return y; }
  if (M.dentroRet(x, z, M.CID)) return M.alturaPiso(x, z);
  return altura(x, z);
}
function inclinacao(x, z) { const e = 0.6; return Math.hypot(altura(x + e, z) - altura(x - e, z), altura(x, z + e) - altura(x, z - e)) / (2 * e); }

export const JARDINS = [
  { x0: -31.6, x1: -17.6, z0: -27.6, z1: -1.4 },      // o jardim do pagode
  { x0: -30.5, x1: -21.5, z0: 18.5, z1: 21.9 },       // pátios das casas
  { x0: -17.5, x1: -9.0, z0: 18.5, z1: 21.9 },
];

export function criarTexturasChao(ctx) {
  const tg = ctx.tg, T = {};
  T.grama = tg.fazer('grama'); T.terra = tg.fazer('terra'); T.areia = tg.fazer('areia'); T.rocha = tg.fazer('rocha');
  T.ruido = tg.fazer('ruido', { tam: 512, soCor: true, linear: true }).cor;
  ctx.T = T; MACRO.tRuidoM.value = T.ruido;
}

export function criarNatureza(ctx) {
  const { cena, tg, sol } = ctx;
  const T = ctx.T;

  // ---------- mapas de mistura e de densidade ----------
  const NS = 1024; const splat = new Uint8Array(NS * NS * 4), dens = new Uint8Array(NS * NS * 4);
  for (let j = 0; j < NS; j++) for (let i = 0; i < NS; i++) {
    const x = (i + 0.5) / NS * TAM - TAM / 2, z = (j + 0.5) / NS * TAM - TAM / 2; const h = altura(x, z); const k = (j * NS + i) * 4;
    const n1 = fbm(x * 0.09, z * 0.09, 3), n2 = fbm(x * 0.35 + 7, z * 0.35, 2);
    const naCid = M.dentroRet(x, z, M.CID, -1.2); const dCid = M.distRet(x, z, M.CID);
    const dE = M.distEstrada(x, z) + n2 * 0.5; const dL = M.distLago(x, z); const rc = M.costa(x, z);
    let terra = 1 - sstep(-0.2, 0.7, dE);
    if (naCid) terra = 1;
    terra = Math.max(terra, (1 - sstep(1.2, 3.8, dCid)) * 0.75);                                 // pé do muro
    if (M.dentroRet(x, z, M.TREINO, 0.5)) terra = Math.max(terra, 0.55 + n1 * 0.8);
    if (M.dentroRet(x, z, M.ROCA, 0.3)) { const fx = ((x - M.ROCA.x0) % 7.4), fz = ((z - M.ROCA.z0) % 9.2); if (fx < 1.3 || fz < 1.3) terra = 1; else terra = Math.max(terra, 0.35); }
    terra = Math.max(terra, (1 - sstep(M.LAGO.r + 1.0, M.LAGO.r + 4.5, dL)) * 0.9);              // lama da margem
    const fl = Math.exp(-((x + 46) ** 2 + (z + 40) ** 2) / 900); terra = Math.max(terra, sstep(0.15, 0.6, fl * (0.7 + n1)) * 0.6); // chão da floresta
    let areia = (1 - sstep(0.55, 1.05, h + n2 * 0.12)) * sstep(52, 60, rc);
    let rocha = sstep(0.42, 0.75, inclinacao(x, z) + n2 * 0.08) * (h > 0.6 ? 1 : 0.4);
    for (const jd of JARDINS) if (M.dentroRet(x, z, jd)) { terra = 0; }
    let vb = 0, vq = 0; if (x > 84) { [vb, vq] = M.vulcaoInfo(x, z, h); if (vb > 0) terra *= 1 - vb; }      // a ilha vulcânica: basalto e calor
    splat[k] = clamp(terra, 0, 1) * 255; splat[k + 1] = clamp(areia, 0, 1) * 255; splat[k + 2] = clamp(rocha, 0, 1) * 255; splat[k + 3] = (vb * 0.5 + (vb > 0.97 ? vq * 0.5 : 0)) * 255;
    // densidades: R grama, G trigo, B flores
    let g = 1 - clamp(terra * 1.5 + areia * 2 + rocha * 1.5, 0, 1); if (h < 0.35) g = 0; if (vb > 0) g *= 1 - sstep(0.02, 0.3, vb); if (x > M.MIRANTE.x - 3.1 && x < M.PONTE.x0 + 1 && Math.abs(z - M.PONTE.z) < 3.1) g = 0;
    g *= 0.62 + 0.38 * sstep(-0.3, 0.3, n1);
    let trigo = 0;
    if (M.dentroRet(x, z, M.ROCA, -0.2)) { const fx = ((x - M.ROCA.x0) % 7.4), fz = ((z - M.ROCA.z0) % 9.2); trigo = (fx > 1.5 && fz > 1.5) ? 1 : 0; g = trigo ? 0 : g; }
    let flor = g * sstep(0.02, 0.36, fbm(x * 0.045 + 31, z * 0.045 - 9, 3)) * (naCid ? 0.5 : 1);
    // o capim alto dos campos e os juncos da margem do lago
    let alto = naCid ? 0 : g * sstep(0.16, 0.4, fbm(x * 0.055 + 70, z * 0.055 + 13, 3)) * (M.distEstrada(x, z) > 1.2 ? 1 : 0);
    if (dL > M.LAGO.r - 3.5 && dL < M.LAGO.r + 2.6 && h > -0.55 && h < 0.8) alto = Math.max(alto, 0.55 + 0.45 * sstep(-0.2, 0.3, n2));
    dens[k] = g * 255; dens[k + 1] = trigo * 255; dens[k + 2] = clamp(flor, 0, 1) * 255; dens[k + 3] = clamp(alto, 0, 1) * 255;
  }
  const tSplat = new THREE.DataTexture(splat, NS, NS); tSplat.magFilter = tSplat.minFilter = THREE.LinearFilter; tSplat.needsUpdate = true;
  const tDens = new THREE.DataTexture(dens, NS, NS); tDens.magFilter = tDens.minFilter = THREE.LinearFilter; tDens.needsUpdate = true;
  const tAlt = new THREE.DataTexture(alt, NG + 1, NG + 1, THREE.RedFormat, THREE.FloatType); tAlt.magFilter = tAlt.minFilter = THREE.NearestFilter; tAlt.needsUpdate = true;
  ctx.dens = dens; ctx.NS = NS;
  ctx.densEm = (x, z, c) => { const i = clamp(((x + TAM / 2) / TAM * NS) | 0, 0, NS - 1), j = clamp(((z + TAM / 2) / TAM * NS) | 0, 0, NS - 1); return dens[(j * NS + i) * 4 + c] / 255; };

  // ---------- o terreno ----------
  const geo = new THREE.PlaneGeometry(TAM, TAM, NG, NG); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position; for (let k = 0; k < pos.count; k++) pos.setY(k, alt[k]);
  geo.computeVertexNormals();
  const matT = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, envMapIntensity: 0.55 });
  const uT = { tSplat: { value: tSplat }, tG: { value: T.grama.cor }, tT: { value: T.terra.cor }, tA: { value: T.areia.cor }, tR: { value: T.rocha.cor },
    nG: { value: T.grama.normal }, nT: { value: T.terra.normal }, nA: { value: T.areia.normal }, nR: { value: T.rocha.normal }, tRuido: { value: T.ruido }, uTam: { value: TAM }, uTempoT: ctx.uTempo, uMolhado: MACRO.uMolhado };
  matT.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uT);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos; varying vec3 vWNor;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos=(modelMatrix*vec4(transformed,1.)).xyz; vWNor=normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform sampler2D tSplat,tG,tT,tA,tR,nG,nT,nA,nR,tRuido; uniform float uTam,uTempoT,uMolhado; varying vec3 vWPos; varying vec3 vWNor; float terrRough; vec3 terrN; vec3 terrEmis;`)
      .replace('#include <map_fragment>', `
      vec2 wp=vWPos.xz; vec4 sp=texture2D(tSplat,wp/uTam+.5); vec3 rd=texture2D(tRuido,wp/31.).rgb; vec3 rd2=texture2D(tRuido,wp/7.3).rgb;
      float wT=smoothstep(.32,.68,sp.r+(rd.b-.5)*.55+(rd2.g-.5)*.25), wA=smoothstep(.3,.7,sp.g+(rd.g-.5)*.3), wR=smoothstep(.3,.7,sp.b+(rd.b-.5)*.45);
      vec4 cG=mix(texture2D(tG,wp/3.1),texture2D(tG,wp/9.7+.3),.45), cT=mix(texture2D(tT,wp/3.3),texture2D(tT,wp/8.9+.6),.35), cA=texture2D(tA,wp/4.1), cR=mix(texture2D(tR,wp/5.3),texture2D(tR,wp/13.1+.2),.4);
      vec4 c=cG; c=mix(c,cT,wT); c=mix(c,cA,wA); c=mix(c,cR,wR);
      // a ilha vulcânica: basalto escuro nas encostas, cinza no chão plano, areia preta na praia
      float wV=clamp(sp.a*2.,0.,1.), calor=clamp(sp.a*2.-1.,0.,1.); terrEmis=vec3(0.);
      if(wV>.003){ vec3 tw=pow(abs(vWNor),vec3(5.)); tw/=tw.x+tw.y+tw.z;                               // nas paredes a pino a textura é projetada de lado (não estica)
        vec4 rk=cR*tw.y+texture2D(tR,vWPos.zy/5.3)*tw.x+texture2D(tR,vWPos.xy/5.3)*tw.z; float pedra=clamp(wR+.45*rd.b+.25*rd2.g-.2+(1.-tw.y)*2.,0.,1.);
        float lr=dot(rk.rgb,vec3(.3,.55,.15)), lt=dot(cT.rgb,vec3(.3,.55,.15)), la=dot(cA.rgb,vec3(.3,.55,.15));
        vec3 bas=mix(mix(vec3(lt),cT.rgb,.1)*vec3(.058,.06,.071), mix(vec3(lr),rk.rgb,.08)*vec3(.068,.072,.089), pedra); bas=mix(bas,mix(vec3(la),cA.rgb,.1)*vec3(.036,.037,.043),wA);
        bas*=.75+.6*texture2D(tRuido,wp/23.).g; c=mix(c,vec4(bas,mix(cT.a,rk.a,pedra)),smoothstep(0.,.75,wV+(rd2.b-.5)*.25)); }
      float macro=texture2D(tRuido,wp/150.).r; c.rgb*=.74+.52*macro;
      float molh=1.-smoothstep(-.02,.42,vWPos.y); c.rgb*=mix(1.,.5,molh); terrRough=mix(c.a,.3,molh);
      vec3 n0=texture2D(nG,wp/3.1).xyz*2.-1.; n0=mix(n0,texture2D(nT,wp/3.3).xyz*2.-1.,wT); n0=mix(n0,texture2D(nA,wp/4.1).xyz*2.-1.,wA); n0=mix(n0,texture2D(nR,wp/5.3).xyz*2.-1.,wR);
      if(wV>.003){ vec3 nv=texture2D(nR,wp/5.3).xyz*2.-1.; nv.xy*=1.7; n0=mix(n0,normalize(nv),wV*(1.-wA)*.85); }
      terrN=n0;
      // as fendas de brasa perto da lava
      if(calor>.004){ float f1=abs(texture2D(tRuido,wp/4.7).r-.5)*2., f2=abs(texture2D(tRuido,wp/1.9+.37).g-.5)*2.; float fenda=smoothstep(.17,.0,f1)+.55*smoothstep(.13,.0,f2);
        float pulso=.72+.28*sin(uTempoT*1.3+rd.r*9.+wp.x*.2); float q=calor*calor;
        terrEmis=vec3(1.,.22,.03)*(q*fenda*4.2*pulso+q*q*.55)+vec3(1.,.5,.1)*pow(calor,7.)*1.3; c.rgb*=1.-.35*q; }
      // a chuva: tudo mais escuro e liso, com poças na terra das estradas
      float poca=uMolhado*wT*smoothstep(.50,.62,rd2.r*.55+rd.g*.55)*(1.-wR); c.rgb*=1.-.26*uMolhado-.34*poca; terrRough=mix(mix(terrRough,.36,uMolhado*.55),.03,poca); terrN=mix(terrN,vec3(0.,0.,1.),poca);
      // a espuma que vai e vem na beira da água
      { float onda=sin(uTempoT*.8+rd.r*7.+wp.x*.05)*.055; float faixa=smoothstep(.085,.01,abs(vWPos.y-.05-onda)); float esp=faixa*smoothstep(.42,.7,texture2D(tRuido,wp/2.1+vec2(uTempoT*.03,-uTempoT*.02)).b+.18); c.rgb=mix(c.rgb,vec3(.9,.94,.96),esp*.6); terrRough=mix(terrRough,.6,esp); }
      diffuseColor.rgb*=c.rgb;`)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor=terrRough;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance+=terrEmis;')
      .replace('#include <normal_fragment_maps>', `
      { vec3 tx=normalize((viewMatrix*vec4(1.,0.,0.,0.)).xyz); tx=normalize(tx-normal*dot(tx,normal)); vec3 bz=cross(normal,tx); normal=normalize(tx*terrN.x-bz*terrN.y+normal*terrN.z); }`);
  };
  const terreno = new THREE.Mesh(geo, matT); terreno.receiveShadow = true; terreno.castShadow = true;   // a crista do vulcão faz sombra na cratera
   terreno.name = 'terreno'; cena.add(terreno); ctx.terreno = terreno;

  // ---------- a grama, o trigo e as flores (lâminas em volta do herói) ----------
  ctx.grama = [];
  const uG = { uVento: ctx.vento.u, uTrevasG: ctx.uTrevasGrama, tRuidoG: { value: T.ruido }, uMolhadoG: MACRO.uMolhado, uCentro: { value: new THREE.Vector3() }, uT: ctx.uTempo, tAlt: { value: tAlt }, tDens: { value: tDens }, uTam: { value: TAM } };
  function laminas({ S, n, tufo, tipo, corBase, corPonta, altMin, altVar, larg, canal }) {
    // geometria de uma lâmina (ou de um tufo de 3); a flor é uma haste com uma corola de 6 pétalas
    const P = [], U = [], I = []; const blades = tufo ? 3 : 1;
    for (let b = 0; b < blades; b++) {
      const o = P.length / 3; const seg = 3;
      if (tipo === 2) {
        P.push(-0.5, 0, 0, 0.5, 0, 0, -0.5, 0.92, 0, 0.5, 0.92, 0); U.push(0.14, 0, 0.14, 0, 0.14, 0, 0.14, 0); I.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
        const c = o + 4; P.push(0, 1, 0); U.push(0, 1); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; P.push(Math.cos(a), 1, Math.sin(a)); U.push(1, 1); } for (let k = 0; k < 6; k++) I.push(c, c + 1 + (k + 1) % 6, c + 1 + k);
      } else {
        for (let s2 = 0; s2 < seg; s2++) { const t = s2 / seg; P.push(-0.5, t, b, 0.5, t, b); U.push(1 - t * 0.7, 0, 1 - t * 0.7, 0); }
        P.push(0, 1, b); U.push(0.05, 0);
        for (let s2 = 0; s2 < seg - 1; s2++) { const a = o + s2 * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        const a = o + (seg - 1) * 2; I.push(a, a + 1, a + 2);
      }
    }
    const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I);
    const off = new Float32Array(n * 3), rnd = new Float32Array(n * 4); const r = M.semente(7 + tipo * 13 + S);
    for (let k = 0; k < n; k++) { off[k * 3] = r() * S; off[k * 3 + 1] = r() * S; off[k * 3 + 2] = r(); rnd[k * 4] = r(); rnd[k * 4 + 1] = r(); rnd[k * 4 + 2] = r(); rnd[k * 4 + 3] = r(); }
    g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 3)); g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 4)); g.instanceCount = n;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0, side: THREE.DoubleSide, envMapIntensity: 0.5 });
    const un = { ...uG, uS: { value: S }, uTipo: { value: tipo }, cBase: { value: new THREE.Color(corBase) }, cPonta: { value: new THREE.Color(corPonta) }, uAlt: { value: new THREE.Vector2(altMin, altVar) }, uLarg: { value: larg }, uCanal: { value: canal } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, un);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
        uniform vec3 uCentro,cBase,cPonta,uVento; uniform vec4 uTrevasG; uniform float uT,uS,uTam,uLarg,uMolhadoG; uniform int uTipo,uCanal; uniform vec2 uAlt; uniform sampler2D tAlt,tDens,tRuidoG;
        attribute vec3 aOff; attribute vec4 aRnd; varying vec3 vCorG; vec3 gP,gN;
        float altB(vec2 w){ vec2 f=clamp((w/uTam+.5),0.,.9999)*${NG}.; vec2 i=floor(f), a=f-i; vec2 e=vec2(1./${NG + 1}.);
          float h00=texture2D(tAlt,(i+.5)*e).r,h10=texture2D(tAlt,(i+vec2(1.5,.5))*e).r,h01=texture2D(tAlt,(i+vec2(.5,1.5))*e).r,h11=texture2D(tAlt,(i+1.5)*e).r;
          return mix(mix(h00,h10,a.x),mix(h01,h11,a.x),a.y); }`)
        .replace('#include <beginnormal_vertex>', `
        float bi=uTipo==2?0.:position.z; vec2 jit=vec2(fract(aRnd.x*7.13+bi*.37),fract(aRnd.y*5.71+bi*.61))-.5;
        vec2 w=uCentro.xz+mod(aOff.xy-uCentro.xz+uS*.5,uS)-uS*.5+jit*.16*bi;
        vec4 dn=texture2D(tDens,w/uTam+.5); float dd=uCanal==0?dn.r:(uCanal==1?dn.g:(uCanal==2?dn.b:dn.a));
        float dist=distance(w,uCentro.xz); float borda=1.-smoothstep(uS*.36,uS*.49,dist);
        float tv=uTrevasG.w*smoothstep(uTrevasG.z*1.1,uTrevasG.z*.5,distance(w,uTrevasG.xy));
        float existe=step(aOff.z*.96+.02,dd)*borda; float t=min(position.y,1.);
        float altura=(uAlt.x+uAlt.y*fract(aRnd.y+bi*.31))*existe*(.55+.45*dd)*(1.-.45*tv);
        float ang=(aRnd.x+bi*.33)*6.2831853; vec2 dir=vec2(cos(ang),sin(ang)); vec2 vento=uVento.xy;
        float v1=sin(uT*1.9+w.x*.42+w.y*.31+aRnd.w*3.), v2=sin(uT*.7+w.x*.09-w.y*.07), v3=sin(uT*3.7+w.x*1.3+aRnd.w*9.);
        // as rajadas: faixas de vento que correm pelo campo e deitam a grama
        float raj=smoothstep(.48,.84,texture2D(tRuidoG,(w-vento*uT*5.5)/62.).r);
        float curva=(.22+.4*aRnd.z)+(.2*v1+.32*v2+.05*v3)*uVento.z+raj*(.5+.34*uVento.z)+uMolhadoG*.25;
        float lg=uLarg*(.7+.6*aRnd.z)*uv.x;
        vec2 desl=(vec2(-dir.y,dir.x)*.35+vento)*curva*altura*.55;
        gP.xz=w+dir*position.x*lg+desl*t*t;
        gP.y=altB(w)+t*altura*(1.-.12*curva*curva*t)-.02;
        if(uTipo==2 && uv.y>.5){ float tam=uLarg*(1.5+1.3*aRnd.z)*step(.001,altura); vec2 cab=dir*position.x+vec2(-dir.y,dir.x)*position.z; gP.xz=w+desl+cab*tam; gP.y=altB(w)+altura*(1.-.12*curva*curva)-.005+dot(cab,vento)*tam*.45*curva; }
        gN=normalize(vec3(dir.y*.35+vento.x*.2,1.,-dir.x*.35+vento.y*.2));
        float seco=smoothstep(.55,.95,fract(aRnd.w*3.7))*.5;
        vec3 cb=cBase*(.75+.5*aRnd.z), cp=mix(cPonta,vec3(.52,.47,.2),seco)*(.8+.4*fract(aRnd.w*5.3));
        vCorG=mix(cb*.55,cp,pow(t,.8)); vCorG*=1.+raj*.22*t; vCorG*=1.-.22*uMolhadoG;
        if(uTipo==2){ float pn=texture2D(tRuidoG,w/19.).g+aRnd.w*.07; vec3 fl=pn<.43?vec3(.93,.92,.86):(pn<.5?vec3(.95,.74,.16):(pn<.57?vec3(.62,.40,.82):(pn<.63?vec3(.86,.25,.2):vec3(.95,.62,.72))));
          vCorG=uv.y>.5?mix(vec3(.9,.66,.12),fl*(.85+.3*aRnd.z),uv.x):vec3(.16,.26,.08); }
        vCorG=mix(vCorG,vec3(.03,.026,.036),tv*.92);
        vec3 objectNormal=gN;`)
        .replace('#include <begin_vertex>', 'vec3 transformed=gP;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vCorG;')
        .replace('#include <map_fragment>', 'diffuseColor.rgb=vCorG;')
        .replace('#include <normal_fragment_begin>', 'float faceDirection=1.; vec3 normal=normalize(vNormal); vec3 nonPerturbedNormal=normal;');
    };
    m.customProgramCacheKey = () => 'lamina' + tipo;
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.receiveShadow = true; mesh.layers.set(1); mesh.userData.n = n;
    cena.add(mesh); ctx.grama.push(mesh); return mesh;
  }
  const q = ctx.qualidade;
  laminas({ S: 30, n: Math.round(95000 * q), tufo: true, tipo: 0, corBase: 0x2c4d13, corPonta: 0x90ad42, altMin: 0.16, altVar: 0.3, larg: 0.05, canal: 0 });
  laminas({ S: 84, n: Math.round(150000 * q), tufo: false, tipo: 0, corBase: 0x305215, corPonta: 0x92ad44, altMin: 0.2, altVar: 0.34, larg: 0.1, canal: 0 });
  laminas({ S: 70, n: Math.round(70000 * q), tufo: true, tipo: 1, corBase: 0x6a5a1c, corPonta: 0xd9b860, altMin: 0.7, altVar: 0.3, larg: 0.045, canal: 1 });
  laminas({ S: 56, n: Math.round(18000 * q), tufo: false, tipo: 2, corBase: 0x24400f, corPonta: 0xffffff, altMin: 0.17, altVar: 0.2, larg: 0.026, canal: 2 });
  laminas({ S: 64, n: Math.round(46000 * q), tufo: true, tipo: 3, corBase: 0x3b5a1a, corPonta: 0xcbb56c, altMin: 0.6, altVar: 0.55, larg: 0.05, canal: 3 });
  ctx.uGrama = uG;

  // ---------- o céu ----------
  const sky = new Sky(); sky.scale.setScalar(9000); const su = sky.material.uniforms;
  su.turbidity.value = 2.6; su.rayleigh.value = 1.5; su.mieCoefficient.value = 0.0035; su.mieDirectionalG.value = 0.84; su.sunPosition.value.copy(sol);
  sky.material.fragmentShader = sky.material.fragmentShader.replace('gl_FragColor = vec4( retColor, 1.0 );', 'gl_FragColor = vec4( retColor * vec3(0.50,0.56,0.66), 1.0 );');
  cena.add(sky); ctx.sky = sky;
  // o ambiente (reflexos e luz do céu) tirado do próprio céu
  const pm = new THREE.PMREMGenerator(ctx.renderer); const cs = new THREE.Scene(); const sky2 = new Sky(); sky2.scale.setScalar(9000); Object.assign(sky2.material.uniforms.sunPosition.value, sol);
  for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) sky2.material.uniforms[k].value = su[k].value; sky2.material.uniforms.sunPosition.value.copy(sol);
  cs.add(sky2); const chaoEnv = new THREE.Mesh(new THREE.CircleGeometry(8000, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x4a5a34 })); chaoEnv.position.y = -30; cs.add(chaoEnv);
  cena.environment = pm.fromScene(cs, 0, 1, 10000).texture; cena.environmentIntensity = 0.55; pm.dispose();

  // nuvens: uma camada alta, com o ruído gerado
  const nuv = new THREE.Mesh(new THREE.PlaneGeometry(14000, 14000).rotateX(Math.PI / 2), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, uniforms: { tR: { value: T.ruido }, uT: { value: 0 }, sol: { value: sol.clone().normalize() }, uCob: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tR; uniform float uT,uCob; uniform vec3 sol; varying vec3 vP;
      void main(){ vec2 p=vP.xz/5200.+vec2(uT*.0016,uT*.0007); float n=texture2D(tR,p).r*.55+texture2D(tR,p*2.3+.2).g*.3+texture2D(tR,p*5.1+uT*.001).b*.15;
        float d=length(vP.xz)/7000.; float lim=mix(.57,.12,uCob); float a=smoothstep(lim,lim+.23,n)*(1.-smoothstep(.45,.98,d)*(1.-uCob*.8));
        float luz=smoothstep(.5,.9,n); vec3 c=mix(vec3(1.,.95,.86),vec3(.74,.77,.84),luz*.6); c=mix(c,vec3(1.,.82,.62),pow(max(dot(normalize(vP),sol),0.),6.)*.6); c=mix(c,vec3(.30,.33,.38)*(.7+.6*n),uCob);
        gl_FragColor=vec4(c*1.6,a*.92); }` }));
  nuv.position.y = 900; nuv.renderOrder = -5; cena.add(nuv); ctx.nuvens = nuv;

  // ---------- a água (o mar e o lago são o mesmo espelho) ----------
  const nAgua = tg.fazer('agua', { tam: 512, soNormal: true }).normal;
  const agua = new Water(new THREE.PlaneGeometry(9000, 9000), { textureWidth: ctx.qAgua || 1024, textureHeight: (ctx.qAgua || 1024) / 2, waterNormals: nAgua, sunDirection: sol.clone().normalize(), sunColor: 0xfff0d8, waterColor: 0x1a6474, distortionScale: 2.4, fog: true });
  agua.material.fragmentShader = agua.material.fragmentShader.replace('float rf0 = 0.3;', 'float rf0 = 0.07;');
  agua.rotation.x = -Math.PI / 2; agua.position.y = 0; agua.material.uniforms.size.value = 3.2; cena.add(agua); ctx.agua = agua;

  // ---------- montanhas ao longe: serras de relevo com mata embaixo, rocha em cima e neve nos picos ----------
  {
    const r = M.semente(99); const gs = [];
    for (let k = 0; k < 13; k++) {
      const a = k / 13 * Math.PI * 2 + r() * 0.35, d = 1900 + r() * 1500, R = 520 + r() * 520, H = 190 + r() * 330; const N = 40;
      const g = new THREE.PlaneGeometry(R * 2, R * 2, N, N).rotateX(-Math.PI / 2); const p = g.attributes.position; const cor = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i); const rr = Math.hypot(x, z) / R; const base = Math.max(0, 1 - Math.pow(rr, 1.25)); const n = fbm((x + k * 913) * 0.0021, (z - k * 377) * 0.0021, 5); const crista = 1 - Math.min(1, Math.abs(n) * 1.9);
        const h = H * Math.pow(base, 1.15) * (0.42 + 0.9 * crista); p.setY(i, h - 40 * (1 - base)); const t = h / H; const v = 0.85 + 0.3 * fbm(x * 0.01, z * 0.01, 2);
        let c = [0.17 * v, 0.27 * v, 0.17 * v]; const ro = sstep(0.34, 0.6, t + n * 0.2); c = [lerp(c[0], 0.40 * v, ro), lerp(c[1], 0.385 * v, ro), lerp(c[2], 0.37 * v, ro)]; const ne = sstep(0.72, 0.86, t + n * 0.15); c = [lerp(c[0], 0.92, ne), lerp(c[1], 0.94, ne), lerp(c[2], 0.97, ne)];
        cor[i * 3] = c[0]; cor[i * 3 + 1] = c[1]; cor[i * 3 + 2] = c[2];
      }
      g.setAttribute('color', new THREE.BufferAttribute(cor, 3)); g.translate(Math.cos(a) * d, -6, Math.sin(a) * d); g.computeVertexNormals(); gs.push(g);
    }
    const mm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, envMapIntensity: 0.35 });
    for (const g of gs) { const m = new THREE.Mesh(g, mm); m.frustumCulled = true; cena.add(m); }
  }

  // ---------- um bando de aves ----------
  {
    const P = [-0.9, 0, 0.1, 0, 0, -0.18, 0, 0, 0.25, 0.9, 0, 0.1, 0, 0, 0.25, 0, 0, -0.18, 0, 0.02, -0.34, -0.06, 0, 0.3, 0.06, 0, 0.3];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals();
    const m = new THREE.MeshBasicMaterial({ color: 0x1c1d20, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => { sh.uniforms.uT = ctx.uTempo; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;').replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed.y+=sin(uT*8.5+instanceMatrix[3].x*.31+instanceMatrix[3].z*.17)*abs(position.x)*.55;'); };
    const n = 14; const im = new THREE.InstancedMesh(g, m, n); im.frustumCulled = false; cena.add(im); const r = M.semente(4242); ctx.aves = { im, lista: [] };
    for (let i = 0; i < n; i++) ctx.aves.lista.push({ cx: -20 + r() * 50, cz: -10 + r() * 30, R: 26 + r() * 34, y: 21 + r() * 14, f: r() * 6.283, v: (0.16 + r() * 0.1) * (r() < 0.5 ? 1 : -1), e: 0.7 + r() * 0.5 });
  }

  // ---------- árvores ----------
  ctx.arvores = criarArvores(ctx);
  criarPedras(ctx);
}

// ====== texturas de folhagem feitas no canvas ======
// Folhosas: uma folha de 2x2 quadros; cada quadro é um raminho (galhinhos saindo do meio, com as folhas ou as flores presas neles),
// para as placas da copa não repetirem e a beira da copa ser de folhas soltas, não de um disco cheio.
function texFolhas(tipo) {
  const r = M.semente(41 + tipo.length * 7); const rr = (a, b) => a + r() * (b - a);
  if (tipo === 'pinho') {
    // um ramo de pinheiro visto de cima: o eixo, os raminhos dos lados e as agulhas
    const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.clearRect(0, 0, 512, 512); g.lineCap = 'round';
    const agulhas = (x0, y0, x1, y1, n, comp) => { const L = Math.hypot(x1 - x0, y1 - y0), ax = (x1 - x0) / L, ay = (y1 - y0) / L;
      for (let k = 0; k < n; k++) { const t = k / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t; for (const s of [-1, 1]) { const an = 0.75 + r() * 0.55, l = comp * (0.7 + r() * 0.6) * (1 - t * 0.35); const dx = ax * Math.cos(an) - ay * Math.sin(an) * s, dy = ay * Math.cos(an) + ax * Math.sin(an) * s; const v = 58 + r() * 78;
        g.strokeStyle = `rgb(${18 + r() * 30 | 0},${v | 0},${24 + r() * 26 | 0})`; g.lineWidth = 1.6 + r() * 0.9; g.beginPath(); g.moveTo(px, py); g.lineTo(px + dx * l, py + dy * l); g.stroke(); } } };
    const ramo = (x0, y0, x1, y1, w, n, comp) => { g.strokeStyle = '#3d2c1c'; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); agulhas(x0, y0, x1, y1, n, comp); };
    // por baixo, uma massa escura para o ramo não ficar ralo de longe
    for (let k = 0; k < 40; k++) { const t = r(), y = 480 - t * 430, hw = (1 - t * 0.8) * 150 * r(); g.fillStyle = `rgba(${16 + r() * 10 | 0},${44 + r() * 22 | 0},${22 + r() * 10 | 0},0.9)`; g.beginPath(); g.ellipse(256 + (r() - 0.5) * 2 * hw, y, 26 + r() * 22, 20 + r() * 16, r() * 3, 0, 6.283); g.fill(); }
    for (let k = 0; k < 11; k++) { const y = 478 - k * 41; const l = (198 - k * 15) * (0.85 + r() * 0.2); for (const s of [-1, 1]) { const x1 = 256 + s * l, y1 = y - 62 - r() * 34; ramo(256, y, x1, y1, 3.4, 40 - k * 2, 24);
        for (let q = 1; q <= 3; q++) { const t = q / 4, bx = 256 + (x1 - 256) * t, by = y + (y1 - y) * t; ramo(bx, by, bx + s * (22 + r() * 18), by - 30 - r() * 22, 1.8, 12, 17); ramo(bx, by, bx + s * (16 + r() * 16), by + 20 + r() * 16, 1.8, 10, 16); } } }
    ramo(256, 502, 256, 26, 6, 120, 26);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.generateMipmaps = true; return t;
  }
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'); g.clearRect(0, 0, 1024, 1024); g.lineCap = 'round'; g.lineJoin = 'round';
  const flor = tipo === 'flor', bordo = tipo === 'bordo';
  const folha = (x, y, rot, L, cor, claro) => {     // uma folha em ponta, com a nervura e uma metade mais clara
    const W = L * rr(0.4, 0.52); g.save(); g.translate(x, y); g.rotate(rot);
    const gr = g.createLinearGradient(0, L * 0.5, 0, -L * 0.5); gr.addColorStop(0, `rgb(${cor[0] * 0.72 | 0},${cor[1] * 0.74 | 0},${cor[2] * 0.72 | 0})`); gr.addColorStop(1, `rgb(${cor[0] | 0},${cor[1] | 0},${cor[2] | 0})`);
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, L * 0.5); g.bezierCurveTo(W, L * 0.22, W * 0.82, -L * 0.3, 0, -L * 0.5); g.bezierCurveTo(-W * 0.82, -L * 0.3, -W, L * 0.22, 0, L * 0.5); g.fill();
    g.fillStyle = `rgba(${claro[0] | 0},${claro[1] | 0},${claro[2] | 0},0.34)`; g.beginPath(); g.moveTo(0, L * 0.5); g.bezierCurveTo(W, L * 0.22, W * 0.82, -L * 0.3, 0, -L * 0.5); g.closePath(); g.fill();
    g.strokeStyle = `rgba(${cor[0] * 0.5 | 0},${cor[1] * 0.55 | 0},${cor[2] * 0.5 | 0},0.7)`; g.lineWidth = 1.3; g.beginPath(); g.moveTo(0, L * 0.5); g.lineTo(0, -L * 0.46); g.stroke(); g.restore();
  };
  const folhaBordo = (x, y, rot, L, cor) => {       // folha de bordo: cinco pontas
    g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = `rgb(${cor[0] | 0},${cor[1] | 0},${cor[2] | 0})`;
    for (const [a, k] of [[0, 1], [0.72, 0.82], [-0.72, 0.82], [1.5, 0.55], [-1.5, 0.55]]) { g.save(); g.rotate(a); g.beginPath(); g.moveTo(0, L * 0.08); g.bezierCurveTo(L * 0.2 * k, -L * 0.12, L * 0.13 * k, -L * 0.42 * k, 0, -L * 0.58 * k); g.bezierCurveTo(-L * 0.13 * k, -L * 0.42 * k, -L * 0.2 * k, -L * 0.12, 0, L * 0.08); g.fill(); g.restore(); }
    g.strokeStyle = `rgba(${cor[0] * 0.55 | 0},${cor[1] * 0.5 | 0},${cor[2] * 0.5 | 0},0.7)`; g.lineWidth = 1.2; for (const a of [0, 0.72, -0.72]) { g.beginPath(); g.moveTo(0, L * 0.06); g.lineTo(Math.sin(a) * L * 0.42, -Math.cos(a) * L * 0.42); g.stroke(); } g.restore();
  };
  const florzinha = (x, y, s) => {                    // flor de cerejeira: cinco pétalas e o miolo
    const cc = r(); const col = cc < 0.45 ? [255, 236 + r() * 14, 242 + r() * 10] : cc < 0.85 ? [252, 206 + r() * 26, 222 + r() * 20] : [248, 178 + r() * 24, 204 + r() * 20];
    g.save(); g.translate(x, y); g.rotate(r() * 6.283);
    for (let p = 0; p < 5; p++) { g.rotate(6.283 / 5); const gr = g.createRadialGradient(0, -s * 0.2, 0, 0, -s * 0.55, s * 0.6); gr.addColorStop(0, `rgb(${col[0] - 22 | 0},${col[1] - 46 | 0},${col[2] - 34 | 0})`); gr.addColorStop(1, `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`); g.fillStyle = gr; g.beginPath(); g.ellipse(0, -s * 0.56, s * 0.4, s * 0.56, 0, 0, 6.283); g.fill(); }
    g.fillStyle = '#b8415e'; g.beginPath(); g.arc(0, 0, s * 0.17, 0, 6.283); g.fill(); g.fillStyle = '#f6d98a'; for (let p = 0; p < 5; p++) { const a = r() * 6.283; g.beginPath(); g.arc(Math.cos(a) * s * 0.26, Math.sin(a) * s * 0.26, 1.2, 0, 6.283); g.fill(); } g.restore();
  };
  const corFolha = () => { if (bordo) { const q = r(); return q < 0.42 ? [196 + r() * 24, 98 + r() * 32, 32 + r() * 14] : q < 0.74 ? [164 + r() * 26, 52 + r() * 24, 28 + r() * 12] : q < 0.9 ? [208 + r() * 16, 150 + r() * 28, 48 + r() * 16] : [128 + r() * 26, 104 + r() * 24, 40]; }
    if (flor) return [96 + r() * 40, 110 + r() * 34, 52 + r() * 20]; const v = r(); return [36 + v * 34 + r() * 12, 78 + v * 44 + r() * 14, 24 + v * 16 + r() * 8]; };
  for (let q = 0; q < 4; q++) {
    g.save(); g.beginPath(); g.rect((q & 1) * 512 + 3, (q >> 1) * 512 + 3, 506, 506); g.clip(); g.translate((q & 1) * 512 + 256, (q >> 1) * 512 + 256);
    // por baixo: a massa do meio do raminho (escura nas folhas, clara nas flores), para a copa não virar chuvisco
    for (let k = 0; k < 34; k++) { const a = r() * 6.283, d = Math.pow(r(), 0.8) * 150; const v = r(); g.fillStyle = flor ? `rgb(${236 + v * 16 | 0},${196 + v * 30 | 0},${212 + v * 26 | 0})` : bordo ? `rgb(${120 + v * 50 | 0},${44 + v * 30 | 0},${16 + v * 12 | 0})` : `rgb(${20 + v * 18 | 0},${50 + v * 34 | 0},${16 + v * 10 | 0})`;
      g.beginPath(); const x = Math.cos(a) * d, y = Math.sin(a) * d, rb = 26 + r() * 34; for (let s = 0; s < 9; s++) { const an = s / 9 * 6.283, rq = rb * (0.7 + r() * 0.6); if (s) g.lineTo(x + Math.cos(an) * rq, y + Math.sin(an) * rq); else g.moveTo(x + Math.cos(an) * rq, y + Math.sin(an) * rq); } g.closePath(); g.fill(); }
    // os galhinhos saindo do meio, e o que vai preso neles
    const itens = []; const ng = 7 + (r() * 3 | 0);
    for (let k = 0; k < ng; k++) {
      const a0 = k / ng * 6.283 + rr(-0.3, 0.3), L = rr(170, 236), curva = rr(-0.5, 0.5); const pts = []; for (let s = 0; s <= 10; s++) { const t = s / 10, a = a0 + curva * t; pts.push([Math.cos(a) * L * t, Math.sin(a) * L * t]); }
      g.strokeStyle = flor ? 'rgb(64,42,36)' : 'rgb(72,54,34)'; g.lineWidth = flor ? 4.5 : 3.2; g.beginPath(); g.moveTo(0, 0); for (const [x, y] of pts) g.lineTo(x, y); g.stroke();
      for (let s = 2; s <= 10; s++) { const [x, y] = pts[s], [xa, ya] = pts[s - 1]; const dir = Math.atan2(y - ya, x - xa);
        if (flor) { const nf = 2 + (r() * 3 | 0); for (let f = 0; f < nf; f++) itens.push(['f', x + rr(-20, 20), y + rr(-20, 20), rr(11, 16)]); if (r() < 0.5) itens.push(['b', x + rr(-16, 16), y + rr(-16, 16), rr(4, 6.5)]); if (r() < 0.22) itens.push(['l', x + rr(-12, 12), y + rr(-12, 12), dir + rr(-1, 1) + Math.PI / 2, rr(20, 30)]); }
        else for (const lado of [-1, 1]) { const n2 = s === 10 ? 2 : 1; for (let f = 0; f < n2; f++) itens.push(['l', x + rr(-7, 7), y + rr(-7, 7), dir + lado * rr(0.5, 1.15) + Math.PI / 2, bordo ? rr(46, 66) : rr(40, 62)]); } }
    }
    // folhas soltas para encher o meio e desfiar a beira
    const ns = flor ? 60 : 46; for (let k = 0; k < ns; k++) { const a = r() * 6.283, d = Math.pow(r(), 0.6) * 232; const x = Math.cos(a) * d, y = Math.sin(a) * d; if (flor) itens.push(['f', x, y, rr(10, 15)]); else itens.push(['l', x, y, a + rr(-0.9, 0.9) + Math.PI / 2, bordo ? rr(40, 60) : rr(36, 56)]); }
    for (let k = itens.length - 1; k > 0; k--) { const j = (r() * (k + 1)) | 0; const t = itens[k]; itens[k] = itens[j]; itens[j] = t; }
    for (const it of itens) { if (Math.hypot(it[1], it[2]) > 242) continue;
      if (it[0] === 'f') florzinha(it[1], it[2], it[3]); else if (it[0] === 'b') { g.fillStyle = `rgb(${226 + r() * 20 | 0},${96 + r() * 40 | 0},${132 + r() * 30 | 0})`; g.beginPath(); g.arc(it[1], it[2], it[3], 0, 6.283); g.fill(); }
      else { const cor = corFolha(); if (bordo) folhaBordo(it[1], it[2], it[3], it[4], cor); else folha(it[1], it[2], it[3], it[4], cor, [cor[0] + 30, cor[1] + 34, cor[2] + 12]); } }
    g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.generateMipmaps = true; return t;
}

function matFolha(tex, ctx, forcaVento = 1) {
  const m = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.34, alphaToCoverage: true, side: THREE.DoubleSide, vertexColors: true, roughness: 0.8, metalness: 0, envMapIntensity: 0.6 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uT = ctx.uTempo; sh.uniforms.uVento = ctx.vento.u; sh.uniforms.uSolV = ctx.uSolV; sh.uniforms.uSolF = ctx.uSolF;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT; uniform vec3 uVento;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
        vec3 ip=instanceMatrix[3].xyz; float fz=ip.x*.37+ip.z*.51;
        #else
        float fz=0.;
        #endif
        float bal=(sin(uT*1.3+fz+position.y*.5)*.05+sin(uT*2.9+position.x*2.1+position.z*1.7+fz)*.03)*(.45+.75*uVento.z)+sin(uT*.5+fz*.3)*.03*uVento.z;
        transformed.x+=bal*position.y*${(0.5 * forcaVento).toFixed(2)}; transformed.z+=bal*.6*position.y*${(0.5 * forcaVento).toFixed(2)};
        transformed+=normal*sin(uT*3.7+position.x*5.3+position.z*4.1+position.y*2.9+fz)*.022*(.4+uVento.z);`);
    // a folha é fina: os dois lados usam a mesma normal (a da copa), e a luz do sol atravessa as folhas do lado da sombra
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uSolV; uniform float uSolF;').replace('#include <normal_fragment_begin>', 'float faceDirection=1.; vec3 normal=normalize(vNormal); vec3 nonPerturbedNormal=normal;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec3 vv=normalize(vViewPosition); float tras=max(dot(-normal,uSolV),0.), contra=pow(max(dot(-vv,uSolV),0.),3.); totalEmissiveRadiance+=diffuseColor.rgb*vec3(1.,.93,.6)*(tras*.4+contra*.45)*uSolF; }`);
  };
  m.customProgramCacheKey = () => 'folha2' + forcaVento;
  return recorte(m);
}

// um tubo ao longo de pontos (tronco e galhos)
function tubo(P, I, U, N, pts, raios, lados = 7, v0 = 0) {
  const base = P.length / 3; const up = new THREE.Vector3(0, 1, 0), t = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(); let v = v0;
  for (let k = 0; k < pts.length; k++) {
    const p = pts[k]; t.copy(pts[Math.min(k + 1, pts.length - 1)]).sub(pts[Math.max(k - 1, 0)]).normalize();
    a.crossVectors(t, Math.abs(t.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : up).normalize(); b.crossVectors(t, a).normalize();
    if (k > 0) v += pts[k].distanceTo(pts[k - 1]);
    for (let s = 0; s <= lados; s++) { const an = s / lados * Math.PI * 2, cx = Math.cos(an), sy = Math.sin(an); const nx = a.x * cx + b.x * sy, ny = a.y * cx + b.y * sy, nz = a.z * cx + b.z * sy; P.push(p.x + nx * raios[k], p.y + ny * raios[k], p.z + nz * raios[k]); N.push(nx, ny, nz); U.push(s / lados * Math.max(1, Math.round(raios[0] * 6.283 / 1.2)), v / 1.5); }
  }
  for (let k = 0; k < pts.length - 1; k++) for (let s = 0; s < lados; s++) { const i0 = base + k * (lados + 1) + s; I.push(i0, i0 + lados + 1, i0 + 1, i0 + 1, i0 + lados + 1, i0 + lados + 2); }
}

// Uma árvore: o tronco com raízes, os galhos em dois níveis e a copa feita de tufos de placas pequenas na ponta dos galhos.
// As normais das folhas abrem para fora da copa (ela pega luz como um volume) e o miolo é mais escuro.
function gerarArvore(seed, o) {
  const V = THREE.Vector3; const r = M.semente(seed); const P = [], I = [], U = [], N = [];           // tronco
  const fp = [], fu = [], fn = [], fc = [], fi = [];                                                  // folhas
  const H = o.alt * (0.88 + r() * 0.24), R = o.raio * (0.88 + r() * 0.24); const cima = new V(0, 1, 0);
  const unit = () => { const u = r() * 2 - 1, a = r() * 6.283, s = Math.sqrt(1 - u * u); return new V(s * Math.cos(a), u, s * Math.sin(a)); };
  if (o.pinho) {
    // o pinheiro: andares de ramos que saem quase retos e caem na ponta; cada ramo é uma faixa curva de agulhas com uma aba por baixo
    const pts = [], rs = []; const n = 10; const inc = new V((r() - 0.5) * 0.6, 0, (r() - 0.5) * 0.6);
    for (let k = 0; k <= n; k++) { const t = k / n; pts.push(new V(inc.x * t * t + Math.sin(t * 4 + seed) * 0.05, H * t - 0.25, inc.z * t * t)); rs.push(R * (1 - t * 0.94) * (k === 0 ? 1.5 : k === 1 ? 1.12 : 1)); }
    tubo(P, I, U, N, pts, rs, 8);
    const eixo = (t) => new V(inc.x * t * t, H * t, inc.z * t * t); const andares = 13 + (r() * 4 | 0);
    for (let a = 0; a < andares; a++) {
      const t = 0.2 + 0.77 * a / (andares - 1); const L = (o.copa * Math.pow(1 - t, 0.85) + 0.35) * (0.88 + r() * 0.24); const nq = t < 0.55 ? 7 : t < 0.85 ? 6 : 5; const off = r() * 6.283; const o0 = eixo(t);
      for (let k = 0; k < nq; k++) {
        const an = off + k / nq * 6.283 + (r() - 0.5) * 0.5; const d = new V(Math.cos(an), 0, Math.sin(an)), lat = new V(-d.z, 0, d.x); const sobe = 0.2 + r() * 0.12, cai = (0.36 + 0.26 * (1 - t)) * (0.85 + r() * 0.3), Lr = L * (0.82 + r() * 0.3); const luzR = (0.66 + 0.34 * t) * (0.86 + r() * 0.28);
        const ponto = (s) => o0.clone().addScaledVector(d, Lr * s).addScaledVector(cima, Lr * (sobe * s - cai * s * s) + (r() - 0.5) * 0.02);
        for (const aba of [0, 1]) {   // 0: a faixa deitada; 1: a aba pendurada
          const base = fp.length / 3; const ns = 3;
          for (let i = 0; i <= ns; i++) { const s = i / ns; const p = ponto(s); const w = Lr * (aba ? 0.2 : 0.56) * (1 - 0.3 * s); const lado = aba ? new V(0, -1, 0).addScaledVector(lat, 0.25) : lat; const e = 0.5 + 0.5 * s;
            for (const u of [0, 1]) { const q = p.clone().addScaledVector(lado, aba ? w * u : (u - 0.5) * w); fp.push(q.x, q.y, q.z); fu.push(aba ? 0.5 + (u - 0.5) * 0.5 : u, 0.02 + s * 0.96); const nn = new V().addScaledVector(d, 0.45).addScaledVector(cima, aba ? 0.5 : 0.9).addScaledVector(lat, (u - 0.5) * (aba ? 0.2 : 0.5)).normalize(); fn.push(nn.x, nn.y, nn.z); const c = luzR * e * (aba ? 0.8 : 1); fc.push(c, c, c * 0.98); } }
          for (let i = 0; i < ns; i++) { const k0 = base + i * 2; fi.push(k0, k0 + 1, k0 + 2, k0 + 1, k0 + 3, k0 + 2); }
        }
      }
    }
    // a ponta: três placas em pé
    for (let k = 0; k < 3; k++) { const an = k / 3 * Math.PI + r(); const lat = new V(Math.cos(an), 0, Math.sin(an)); const base = fp.length / 3; const p0 = eixo(0.93), w = 0.75, h = H * 0.1 + 0.7;
      for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { const q = p0.clone().addScaledVector(lat, (u - 0.5) * w).addScaledVector(cima, v * h); fp.push(q.x, q.y, q.z); fu.push(0.25 + u * 0.5, 0.5 + v * 0.48); fn.push(lat.z * 0.4, 0.9, -lat.x * 0.4); fc.push(1, 1, 1); } fi.push(base, base + 1, base + 2, base, base + 2, base + 3); }
  } else {
    const copa = o.copa * (0.9 + r() * 0.2); const Ht = H * o.tronco; const centro = new V(0, Ht + (H - Ht) * 0.52, 0); const raioV = Math.max(copa * 0.7, (H - Ht) * 0.62);
    // uma placa da copa: p é o meio, nq para onde ela olha, cT e rp o tufo a que pertence
    const placa = (p, nq, s, cT, rp) => {
      const ax = new V().crossVectors(nq, Math.abs(nq.y) > 0.9 ? new V(1, 0, 0) : cima).normalize(), ay = new V().crossVectors(nq, ax); const ang = r() * 6.283, ca = Math.cos(ang), sa = Math.sin(ang);
      const bx = ax.clone().multiplyScalar(ca).addScaledVector(ay, sa), by = ax.clone().multiplyScalar(-sa).addScaledVector(ay, ca); const q = (r() * 4) | 0, u0 = (q & 1) * 0.5, v0 = (q >> 1) * 0.5, m = 0.008;
      const dc = p.clone().sub(centro); dc.y *= copa / raioV; const fundo = clamp(dc.length() / copa, 0, 1);
      const luz = (0.46 + 0.54 * Math.pow(fundo, 1.3)) * (0.8 + 0.26 * clamp((p.y - centro.y) / raioV * 0.5 + 0.5, 0, 1)) * (0.84 + 0.16 * clamp(p.distanceTo(cT) / rp, 0, 1)) * (0.88 + 0.24 * r());
      const cr = luz * (0.94 + r() * 0.12), cg = luz * (0.94 + r() * 0.12), cb = luz * (0.9 + r() * 0.14); const base = fp.length / 3;
      for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { const pv = p.clone().addScaledVector(bx, (u - 0.5) * s).addScaledVector(by, (v - 0.5) * s); fp.push(pv.x, pv.y, pv.z); fu.push(u0 + m + u * (0.5 - 2 * m), v0 + m + v * (0.5 - 2 * m));
        const nn = pv.clone().sub(centro).multiplyScalar(0.9 / copa).add(pv.clone().sub(cT).multiplyScalar(0.5 / rp)); nn.y += 0.24; nn.normalize(); fn.push(nn.x, nn.y, nn.z); fc.push(cr, cg, cb); }
      fi.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    const tufo = (c, rp, n = o.nTufo) => { for (let k = 0; k < n; k++) { const d = unit(); d.y = d.y * 0.8 + 0.12; d.normalize(); const p = c.clone().addScaledVector(d, rp * (0.4 + 0.6 * r())); const nq = d.clone().add(unit().multiplyScalar(0.75)).normalize(); placa(p, nq, o.cartao * (0.72 + 0.56 * r()), c, rp); } };
    // o tronco: vai até quase o topo, afinando, com o pé alargado e as raízes
    const pts = [], rs = []; const n = 9; const inc = new V((r() - 0.5) * 1.1, 0, (r() - 0.5) * 1.1); const Hl = H * 0.86;
    for (let k = 0; k <= n; k++) { const t = k / n; pts.push(new V(inc.x * t * t + Math.sin(t * 5 + seed) * 0.1 * R / 0.3, Hl * t - 0.25, inc.z * t * t + Math.cos(t * 4 + seed) * 0.1 * R / 0.3)); rs.push(R * Math.pow(1 - t * 0.9, 0.8) * (k === 0 ? 1.75 : k === 1 ? 1.2 : 1)); }
    tubo(P, I, U, N, pts, rs, 9);
    if (o.raizes !== false) { const nr = 4 + (r() * 2 | 0); for (let k = 0; k < nr; k++) { const a = k / nr * 6.283 + r() * 0.6, L = R * (2.4 + r() * 1.4); const gp = [], gr = []; for (let s = 0; s <= 4; s++) { const t = s / 4; gp.push(new V(Math.cos(a) * L * t, R * 1.1 * (1 - t) * (1 - t) - 0.3 * t - 0.05, Math.sin(a) * L * t)); gr.push(R * (0.55 - 0.42 * t)); } tubo(P, I, U, N, gp, gr, 5); } }
    const noTronco = (t) => { const f = clamp(t, 0, 1) * n, i = Math.min(n - 1, f | 0); return pts[i].clone().lerp(pts[i + 1], f - i); };
    // os galhos: saem em espiral ao longo do tronco, os de baixo mais abertos e compridos; cada um solta ramos menores com um tufo na ponta
    const ramo = (orig, dir, L, rad, nivel) => {
      const gp = [], gr = []; const m = nivel ? 4 : 6; const curva = o.curva * (0.7 + r() * 0.6);
      for (let k = 0; k <= m; k++) { const t = k / m; gp.push(orig.clone().addScaledVector(dir, L * t).addScaledVector(cima, L * curva * t * t)); gr.push(rad * (1 - t * 0.86)); }
      tubo(P, I, U, N, gp, gr, nivel ? 4 : 6); const em = (t) => orig.clone().addScaledVector(dir, L * t).addScaledVector(cima, L * curva * t * t); const rp = copa * o.tufo;
      tufo(gp[m], rp * (nivel ? 0.85 + r() * 0.3 : 1.05 + r() * 0.3));
      if (nivel) { if (r() < 0.75) tufo(em(0.55 + r() * 0.2), rp * (0.7 + r() * 0.25), Math.round(o.nTufo * 0.7)); return; }
      const ns = (o.sub ?? 2) + (r() < 0.5 ? 1 : 0);
      for (let k = 0; k < ns; k++) { const t = 0.35 + 0.5 * (k + r() * 0.8) / ns; const lado = new V().crossVectors(dir, cima).normalize().multiplyScalar((k % 2 ? 1 : -1) * (0.6 + r() * 0.6)); const d2 = dir.clone().add(lado).add(new V(0, 0.15 + r() * 0.45, 0)).normalize(); ramo(em(t), d2, L * (0.42 + r() * 0.22), rad * 0.5, 1); }
    };
    const ng = o.galhos + (r() * 2 | 0); const az0 = r() * 6.283;
    for (let k = 0; k < ng; k++) { const f = k / (ng - 1); const t = o.tronco + (0.97 - o.tronco) * Math.pow(f, 0.85) * 0.92; const an = az0 + k * 2.39996 + (r() - 0.5) * 0.5; const elev = o.abre[0] + (o.abre[1] - o.abre[0]) * (0.25 + 0.75 * f) * (0.8 + r() * 0.4);
      const dir = new V(Math.cos(an) * Math.cos(elev), Math.sin(elev), Math.sin(an) * Math.cos(elev)); ramo(noTronco(t / 0.86), dir, copa * (1.02 - 0.42 * f) * (0.85 + r() * 0.3), R * 0.44 * (1 - 0.45 * f), 0); }
    // o topo e o miolo
    const topo = pts[n]; tufo(topo.clone().add(new V(0, copa * o.tufo * 0.5, 0)), copa * o.tufo * 1.15); tufo(topo.clone().add(new V((r() - 0.5) * copa * 0.5, -copa * o.tufo * 0.6, (r() - 0.5) * copa * 0.5)), copa * o.tufo);
    for (let k = 0; k < o.cheio; k++) { const d = unit(); d.y *= 0.6; tufo(centro.clone().add(d.multiplyScalar(copa * (0.3 + r() * 0.34))), copa * o.tufo * (0.9 + r() * 0.3)); }
  }
  const gt = new THREE.BufferGeometry(); gt.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); gt.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); gt.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); gt.setIndex(I);
  const gf = new THREE.BufferGeometry(); gf.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); gf.setAttribute('normal', new THREE.Float32BufferAttribute(fn, 3)); gf.setAttribute('uv', new THREE.Float32BufferAttribute(fu, 2)); gf.setAttribute('color', new THREE.Float32BufferAttribute(fc, 3)); gf.setIndex(fi);
  return { tronco: gt, folhas: gf, raio: R };
}

function criarArvores(ctx) {
  const { cena, tg } = ctx; const r = M.semente(2026);
  const casca = pbr(tg.fazer('casca', { tam: 512, corA: [0.20, 0.155, 0.115], corB: [0.36, 0.30, 0.235] }), { normalEsc: 1.4, env: 0.4 });
  const cascaClara = pbr(tg.fazer('casca', { tam: 512, corA: [0.30, 0.25, 0.21], corB: [0.48, 0.43, 0.38] }), { normalEsc: 1.2, env: 0.4 });
  const tFolha = texFolhas('folha'), tBordo = texFolhas('bordo'), tFlor = texFolhas('flor'), tPinho = texFolhas('pinho');
  const tipos = [
    { nome: 'carvalho', n: 4, o: { alt: 8.8, raio: 0.36, copa: 3.6, tronco: 0.4, galhos: 6, abre: [0.2, 0.8], tufo: 0.3, cartao: 1.3, nTufo: 11, cheio: 5, curva: 0.3 }, mf: matFolha(tFolha, ctx), mt: casca, cor: [0.92, 1.0, 0.86] },
    { nome: 'bordo', n: 3, o: { alt: 7.2, raio: 0.27, copa: 2.9, tronco: 0.38, galhos: 6, abre: [0.3, 0.95], tufo: 0.3, cartao: 1.12, nTufo: 10, cheio: 4, curva: 0.34 }, mf: matFolha(tBordo, ctx), mt: cascaClara, cor: [0.94, 0.9, 0.86] },
    { nome: 'cerejeira', n: 3, o: { alt: 5.4, raio: 0.22, copa: 3.0, tronco: 0.3, galhos: 6, abre: [0.12, 0.62], tufo: 0.27, cartao: 1.0, nTufo: 11, cheio: 4, curva: 0.14 }, mf: matFolha(tFlor, ctx), mt: casca, cor: [1.0, 0.97, 0.98] },
    { nome: 'pinheiro', n: 3, o: { alt: 11, raio: 0.3, copa: 3.0, pinho: true }, mf: matFolha(tPinho, ctx, 0.5), mt: casca, cor: [0.8, 0.94, 0.78] },
    { nome: 'arbusto', n: 3, o: { alt: 1.5, raio: 0.07, copa: 0.95, tronco: 0.2, galhos: 4, abre: [0.35, 1.05], tufo: 0.44, cartao: 0.62, nTufo: 8, cheio: 2, curva: 0.3, sub: 1, raizes: false }, mf: matFolha(tFolha, ctx, 0.7), mt: casca, cor: [0.84, 1.0, 0.8] },
    { nome: 'arbusto florido', n: 2, o: { alt: 1.3, raio: 0.06, copa: 0.85, tronco: 0.2, galhos: 4, abre: [0.35, 1.05], tufo: 0.44, cartao: 0.58, nTufo: 8, cheio: 2, curva: 0.3, sub: 1, raizes: false }, mf: matFolha(tFlor, ctx, 0.7), mt: casca, cor: [1.0, 0.94, 0.82] },
  ];
  const lista = [];   // {tipo, variante, x, z, esc, rot}
  const pode = (x, z, margem = 1.2) => {
    const h = altura(x, z); if (h < 0.75) return false; if (M.costa(x, z) > 60) return false; if (M.distRet(x, z, M.CID) < 5 && !M.dentroRet(x, z, M.CID)) return false; if (M.dentroRet(x, z, M.CID)) return false;
    if (M.distEstrada(x, z) < margem) return false; if (M.distRet(x, z, M.TREINO) < 2 || M.distRet(x, z, M.ROCA) < 2) return false; if (M.distLago(x, z) < M.LAGO.r + 3.5) return false;
    if (Math.hypot(x - M.LOBOS.x, z - M.LOBOS.z) < M.LOBOS.r + 4) return false; if (Math.hypot(x - M.GHOTIN.x, z - M.GHOTIN.z) < 11) return false; if (Math.hypot(x - M.DRAGAO.x, z - M.DRAGAO.z) < 19) return false; if (x > 36 && x < 52 && z > -2 && z < 12) return false; if (Math.hypot(x - M.MIRANTE.x, z - M.MIRANTE.z) < 7) return false;
    for (const a of lista) if (Math.hypot(a.x - x, a.z - z) < 3.4) return false; return true;
  };
  // a floresta do noroeste e do norte: densa, com pinheiros
  let tent = 0;
  while (lista.length < 120 && tent++ < 6000) {
    const x = (r() - 0.5) * 150, z = (r() - 0.5) * 150; const f = Math.exp(-((x + 46) ** 2 + (z + 40) ** 2) / 1100) + 0.8 * Math.exp(-((x - 14) ** 2 + (z + 52) ** 2) / 500) + 0.5 * Math.exp(-((x + 50) ** 2 + (z - 40) ** 2) / 500);
    if (r() > f * 1.3) continue; if (!pode(x, z)) continue; const pin = r() < 0.5; lista.push({ tipo: pin ? 3 : (r() < 0.75 ? 0 : 1), x, z, esc: 0.8 + r() * 0.5, rot: r() * 6.283 });
  }
  // árvores soltas no resto da ilha
  tent = 0; const alvo = lista.length + 46;
  while (lista.length < alvo && tent++ < 5000) { const x = (r() - 0.5) * 150, z = (r() - 0.5) * 150; if (!pode(x, z, 2.5)) continue; const q = r(); lista.push({ tipo: q < 0.5 ? 0 : q < 0.78 ? 1 : q < 0.86 ? 2 : 3, x, z, esc: 0.8 + r() * 0.45, rot: r() * 6.283 }); }
  // os arbustos: nas beiras da mata, pelos campos e junto do muro (não barram o caminho)
  { let n = 0, tt = 0; while (n < 110 && tt++ < 6000) { const x = (r() - 0.5) * 150, z = (r() - 0.5) * 150; const h = altura(x, z); if (h < 0.9 || M.costa(x, z) > 58 || M.dentroRet(x, z, M.CID, 1.5) || M.distEstrada(x, z) < 1.3 || M.distRet(x, z, M.TREINO) < 1 || M.distRet(x, z, M.ROCA) < 1 || M.distLago(x, z) < M.LAGO.r + 2) continue;
      if (Math.hypot(x - M.LOBOS.x, z - M.LOBOS.z) < 6 || Math.hypot(x - M.GHOTIN.x, z - M.GHOTIN.z) < 8 || Math.hypot(x - M.DRAGAO.x, z - M.DRAGAO.z) < 13) continue; let perto = false; for (const a of lista) if (Math.hypot(a.x - x, a.z - z) < (a.tipo >= 4 ? 1.6 : 2.2)) { perto = true; break; } if (perto) continue;
      lista.push({ tipo: r() < 0.62 ? 4 : 5, x, z, esc: 0.7 + r() * 0.7, rot: r() * 6.283 }); n++; } }
  // as árvores plantadas da cidade (vêm do construtor da vila)
  for (const a of (ctx.arvoresVila || [])) lista.push({ ...a, esc: a.esc || 1, rot: r() * 6.283 });
  // malhas instanciadas por tipo e variante
  const grupos = new Map();
  for (const a of lista) { a.v = (r() * tipos[a.tipo].n) | 0; const k = a.tipo + '_' + a.v; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(a); }
  const m4 = new THREE.Matrix4(), qd = new THREE.Quaternion(), e = new THREE.Vector3(), p = new THREE.Vector3(); const cor = new THREE.Color();
  for (const [k, arr] of grupos) {
    const [ti, vi] = k.split('_').map(Number); const tp = tipos[ti]; const g = gerarArvore(100 + ti * 10 + vi, tp.o);
    const tronco = new THREE.InstancedMesh(g.tronco, tp.mt, arr.length), folhas = new THREE.InstancedMesh(g.folhas, tp.mf, arr.length);
    arr.forEach((a, i) => {
      const y = M.dentroRet(a.x, a.z, M.CID) ? M.CHAO : altura(a.x, a.z); qd.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a.rot); p.set(a.x, y, a.z); e.setScalar(a.esc); m4.compose(p, qd, e); tronco.setMatrixAt(i, m4); folhas.setMatrixAt(i, m4);
      const v = 0.82 + r() * 0.3; cor.setRGB(tp.cor[0] * v, tp.cor[1] * (0.9 + r() * 0.2) * v, tp.cor[2] * v); folhas.setColorAt(i, cor);
      if (a.tipo < 4) M.bloquearCirc(a.x, a.z, Math.max(0.35, g.raio * a.esc * 1.1));
      a.y = y; a.alt = tp.o.alt * a.esc;
    });
    tronco.castShadow = tronco.receiveShadow = true; folhas.castShadow = true; folhas.receiveShadow = false;   // a copa não recebe sombra: o escuro do miolo vem da cor das placas (a sombra em placas soltas vira ruído)
    folhas.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tp.mf.map, alphaTest: 0.38 });
    tronco.instanceMatrix.needsUpdate = true; cena.add(tronco, folhas);
  }
  return lista;
}

function criarPedras(ctx) {
  const { cena, tg } = ctx; const r = M.semente(77);
  const mat = new THREE.MeshStandardMaterial({ map: ctx.T.rocha.cor, normalMap: ctx.T.rocha.normal, roughness: 1, envMapIntensity: 0.5 });
  mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <roughnessmap_fragment>', 'float roughnessFactor = roughness * texture2D( map, vMapUv ).a;'); };
  const vars = [];
  for (let v = 0; v < 4; v++) {
    const g = new THREE.IcosahedronGeometry(1, 4); const p = g.attributes.position; const sx = 0.8 + r() * 0.6, sy = 0.5 + r() * 0.45, sz = 0.8 + r() * 0.6;
    for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const n = 1 + 0.3 * fbm(x * 0.9 + v * 7, z * 0.9 + y * 0.7, 3) + 0.12 * fbm(x * 3 + y, z * 3 - y + v, 2); x *= n * sx; y *= n * sy; z *= n * sz; if (y < -0.25) y = -0.25 + (y + 0.25) * 0.2; p.setXYZ(i, x, y, z); }
    g.computeVertexNormals(); const nn = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const ax = Math.abs(nn.getX(i)), ay = Math.abs(nn.getY(i)), az = Math.abs(nn.getZ(i)); if (ay >= ax && ay >= az) uv.setXY(i, p.getX(i) / 2.5, p.getZ(i) / 2.5); else if (ax >= az) uv.setXY(i, p.getZ(i) / 2.5, p.getY(i) / 2.5); else uv.setXY(i, p.getX(i) / 2.5, p.getY(i) / 2.5); }
    vars.push(g);
  }
  const lista = []; let tent = 0;
  const add = (x, z, s) => { const v = (r() * 4) | 0, rot = r() * 6.283; if (x > M.PONTE.xr - 1.5 && x < M.PONTE.x2 + 1 && Math.abs(z - M.PONTE.z) < M.PONTE.larg / 2 + 1.6) return; lista.push({ x, z, s, v, rot }); };
  while (lista.length < 70 && tent++ < 4000) {
    const x = (r() - 0.5) * 160, z = (r() - 0.5) * 160; const h = altura(x, z); if (h < 0.2 || M.costa(x, z) > 66) continue; if (Math.hypot(x - M.GHOTIN.x, z - M.GHOTIN.z) < 8 || Math.hypot(x - M.DRAGAO.x, z - M.DRAGAO.z) < 13) continue; if (M.dentroRet(x, z, M.CID, 4) || M.distEstrada(x, z) < 1.0 || M.distRet(x, z, M.TREINO) < 1 || M.distRet(x, z, M.ROCA) < 1) continue;
    const s = 0.35 + r() * r() * 1.9; add(x, z, s); if (s > 1.2) for (let k = 0; k < 3; k++) add(x + (r() - 0.5) * 4 * s, z + (r() - 0.5) * 4 * s, 0.25 + r() * 0.5);
  }
  // as pedras do campo dos lobos
  for (let k = 0; k < 11; k++) { const a = r() * 6.283, d = 4 + r() * 11; add(M.LOBOS.x + Math.cos(a) * d, M.LOBOS.z + Math.sin(a) * d, 0.35 + r() * 0.9); }
  // as pedras do mirante e da margem do lago
  for (let k = 0; k < 9; k++) { const a = r() * 6.283; add(M.MIRANTE.x + Math.cos(a) * (5 + r() * 4), M.MIRANTE.z + Math.sin(a) * (5 + r() * 4), 0.6 + r() * 1.4); }
  for (let k = 0; k < 10; k++) { const a = r() * 6.283; add(M.LAGO.x + Math.cos(a) * (M.LAGO.r + 2 + r() * 2), M.LAGO.z + Math.sin(a) * (M.LAGO.r + 2 + r() * 2), 0.4 + r() * 0.9); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Vector3(), p = new THREE.Vector3();
  for (let v = 0; v < 4; v++) {
    const arr = lista.filter(a => a.v === v); const im = new THREE.InstancedMesh(vars[v], mat, arr.length);
    arr.forEach((a, i) => { q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.3, a.rot, (r() - 0.5) * 0.3)); p.set(a.x, altura(a.x, a.z) + 0.05 * a.s, a.z); e.setScalar(a.s); m4.compose(p, q, e); im.setMatrixAt(i, m4); if (a.s > 0.7) M.bloquearCirc(a.x, a.z, a.s * 0.75); });
    im.castShadow = im.receiveShadow = true; cena.add(im);
  }
  ctx.rochas = lista;
}

const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _e = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
export function atualizarNatureza(ctx, t, centro) {
  ctx.uGrama.uCentro.value.copy(centro);
  ctx.agua.material.uniforms.time.value = t * 0.55; ctx.nuvens.material.uniforms.uT.value = t;
  if (ctx.aves) { const m4 = _m4, q = _q, p = _p, e = _e; ctx.aves.lista.forEach((b, i) => { const a = b.f + t * b.v; p.set(b.cx + Math.cos(a) * b.R, b.y + Math.sin(t * 0.4 + b.f) * 1.5, b.cz + Math.sin(a) * b.R); q.setFromAxisAngle(_up, -a + (b.v > 0 ? 0 : Math.PI)); e.setScalar(b.e); m4.compose(p, q, e); ctx.aves.im.setMatrixAt(i, m4); }); ctx.aves.im.instanceMatrix.needsUpdate = true; }
}
