// A atmosfera: os raios de sol no ar (luz volumétrica pela sombra do sol), a sombra das nuvens, a cúpula de trevas da Ghotin,
// e o clima (sol e chuva: gotas, respingos, chão molhado, céu fechado, relâmpagos, vento).
import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { MACRO } from './texgen.js';
import { piso } from './natureza.js';

const V3 = THREE.Vector3;
const VERT = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
const COMUM = /* glsl */`
  varying vec2 vUv; uniform sampler2D tDepth, tRuido; uniform mat4 uProjInv, uCamMundo; uniform vec3 uCamPos; uniform vec3 uVento; uniform float uT;
  vec3 posMundo(vec2 uv, float d){ vec4 v=uProjInv*vec4(uv*2.-1., d*2.-1., 1.); v/=v.w; return (uCamMundo*v).xyz; }
  // 1 = debaixo de nuvem. As nuvens andam com o vento.
  float nuvem(vec2 xz){ vec2 p=xz-uVento.xy*uT*3.2; float n=texture2D(tRuido,p/330.).r*.62+texture2D(tRuido,p/121.+.31).g*.38; return smoothstep(.47,.66,n); }
`;

export class AtmosferaPass extends Pass {
  constructor(ctx, luzSol, pegarProfundidade, { passos = 22, meia = true } = {}) {
    super(); this.ctx = ctx; this.luzSol = luzSol; this.pegarProfundidade = pegarProfundidade; this.meia = meia;
    const u = this.u = {
      tDiffuse: { value: null }, tDepth: { value: null }, tRuido: { value: ctx.T.ruido }, tRaios: { value: null }, tShadow: { value: null },
      uProjInv: { value: new THREE.Matrix4() }, uCamMundo: { value: new THREE.Matrix4() }, uCamPos: { value: new V3() }, uShadowMat: { value: new THREE.Matrix4() },
      uSolDir: { value: ctx.sol.clone() }, uVento: ctx.vento.u, uT: ctx.uTempo,
      uDens: { value: 0.0064 }, uNuvemF: { value: 1 }, uRaios: { value: 1 }, uCorRaios: { value: new THREE.Color(1.0, 0.86, 0.62) },
      uTrevas: { value: new THREE.Vector4(0, 0, 0, 5) }, uTrevasF: { value: 0 }, uVulcao: { value: new THREE.Vector4(0, 0, 0, 30) }, uVulcaoF: { value: 0 }, uRelampago: { value: 0 }, uDir: { value: new THREE.Vector2(1, 0) },
    };
    this.matRaios = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, depthTest: false, depthWrite: false, fragmentShader: /* glsl */`
      #include <packing>
      ${COMUM} uniform sampler2D tShadow; uniform mat4 uShadowMat; uniform vec3 uSolDir; uniform float uDens, uNuvemF;
      float luz(vec3 p){ vec4 sc=uShadowMat*vec4(p,1.); sc.xyz/=sc.w; if(sc.x<0.||sc.x>1.||sc.y<0.||sc.y>1.||sc.z>1.) return 1.; return step(sc.z-.0012, unpackRGBAToDepth(texture2D(tShadow,sc.xy))); }
      void main(){
        float d=texture2D(tDepth,vUv).r; vec3 P=posMundo(vUv,d); vec3 r=P-uCamPos; float L=length(r); vec3 dir=r/max(L,.001); L=min(L,95.);
        float n=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
        const int N=${passos}; float dl=L/float(N), acc=0.;
        for(int i=0;i<N;i++){ vec3 s=uCamPos+dir*(float(i)+n)*dl; float h=exp(-max(s.y-1.,0.)*.075); acc+=luz(s)*(1.-uNuvemF*.8*nuvem(s.xz))*h*dl; }
        float c=dot(dir,uSolDir); float g=.74; float hg=(1.-g*g)/pow(1.+g*g-2.*g*c,1.5);
        gl_FragColor=vec4(acc*uDens*(.17+min(hg,7.)*.6),0.,0.,1.); }` });
    this.matBorra = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, depthTest: false, depthWrite: false, fragmentShader: /* glsl */`
      varying vec2 vUv; uniform sampler2D tRaios; uniform vec2 uDir;
      void main(){ float s=texture2D(tRaios,vUv).r*.227; s+=(texture2D(tRaios,vUv+uDir*1.385).r+texture2D(tRaios,vUv-uDir*1.385).r)*.316; s+=(texture2D(tRaios,vUv+uDir*3.231).r+texture2D(tRaios,vUv-uDir*3.231).r)*.070; gl_FragColor=vec4(s,0.,0.,1.); }` });
    this.matFinal = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, depthTest: false, depthWrite: false, fragmentShader: /* glsl */`
      ${COMUM} uniform sampler2D tDiffuse, tRaios; uniform float uNuvemF, uRaios, uTrevasF, uRelampago, uVulcaoF; uniform vec3 uCorRaios; uniform vec4 uTrevas, uVulcao;
      void main(){
        vec4 c=texture2D(tDiffuse,vUv); float d=texture2D(tDepth,vUv).r; vec3 P=posMundo(vUv,d); float lum=dot(c.rgb,vec3(.2126,.7152,.0722)); float brilho=1.-smoothstep(.55,1.8,lum);
        if(d<.99999){
          c.rgb*=1.-uNuvemF*.30*nuvem(P.xz);
          // as trevas no chão e no que está dentro do raio
          if(uTrevasF>0.){ vec3 q=P-uTrevas.xyz; q.y*=.65; float rr=length(q)/uTrevas.w; float rn=texture2D(tRuido,P.xz/5.+vec2(uT*.03,-uT*.021)).g+texture2D(tRuido,P.xz/1.7-vec2(uT*.05,0.)).b*.4;
            float t=smoothstep(1.16,.48,rr+(rn-.7)*.34)*uTrevasF*brilho; c.rgb=mix(c.rgb, mix(vec3(lum),c.rgb,.3)*vec3(.16,.13,.23), t*.9); }
        }
        // a cúpula: uma névoa negra no ar, medida pelo trecho do raio de visão que passa por dentro dela
        if(uTrevasF>0.){ vec3 ro=uCamPos-uTrevas.xyz, rd=P-uCamPos; float tmax=length(rd); rd/=max(tmax,.001); ro.y*=.62; vec3 rdd=vec3(rd.x,rd.y*.62,rd.z); float esc=length(rdd); rdd/=esc; float R=uTrevas.w*1.04;
          float b=dot(ro,rdd), cc=dot(ro,ro)-R*R, h=b*b-cc; if(h>0.){ h=sqrt(h); float t0=max(0.,-b-h), t1=min(-b+h,(d<.99999?tmax*esc:1e5)); float len=max(0.,t1-t0)/esc;
            vec3 pm=uCamPos+rd*((t0+t1)*.5/esc); float rn=texture2D(tRuido,pm.xz/4.+vec2(uT*.025,uT*.017)).g; float am=(1.-exp(-len*.115*(.6+.9*rn)))*uTrevasF*brilho;
            c.rgb=mix(c.rgb,vec3(.012,.010,.020),am*.93); } }
        // o clarão do vulcão: o ar em volta da cratera acende de vermelho, medido pelo trecho do raio de visão que passa por dentro
        if(uVulcaoF>0.){ vec3 ro=uCamPos-uVulcao.xyz, rd=P-uCamPos; float tmax=length(rd); rd/=max(tmax,.001); float R=uVulcao.w; float b=dot(ro,rd), cc=dot(ro,ro)-R*R, h=b*b-cc;
          if(h>0.){ h=sqrt(h); float t0=max(0.,-b-h), t1=min(-b+h,(d<.99999?tmax:1e5)); float len=max(0.,t1-t0); vec3 pm=uCamPos+rd*((t0+t1)*.5); vec3 q=pm-uVulcao.xyz;
            float dens=exp(-max(q.y,0.)*.11)*(1.-smoothstep(.25,1.,length(q.xz)/R)); float rn=texture2D(tRuido,pm.xz/23.+vec2(uT*.011,uT*.007)).g;
            c.rgb+=vec3(1.,.27,.05)*(1.-exp(-len*.02*dens*(.55+.9*rn)))*uVulcaoF; } }
        c.rgb+=uCorRaios*texture2D(tRaios,vUv).r*uRaios; c.rgb*=1.+uRelampago*vec3(1.5,1.7,2.3);
        gl_FragColor=c; }` });
    this.fsq = new FullScreenQuad(this.matRaios);
    const op = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    this.rtA = new THREE.WebGLRenderTarget(4, 4, op); this.rtB = new THREE.WebGLRenderTarget(4, 4, op); this.needsSwap = true;
  }
  setSize(w, h) { const k = this.meia ? 0.5 : 1; this.rtA.setSize(Math.max(2, Math.round(w * k)), Math.max(2, Math.round(h * k))); this.rtB.setSize(this.rtA.width, this.rtA.height); }
  render(renderer, writeBuffer, readBuffer) {
    const u = this.u, cam = this.ctx.camera, sh = this.luzSol.shadow;
    u.tDepth.value = this.pegarProfundidade(readBuffer); u.tShadow.value = sh.map ? sh.map.texture : null; if (!u.tDepth.value || !u.tShadow.value) { this.fsq.material = this.matFinal; u.tDiffuse.value = readBuffer.texture; u.tRaios.value = null; }
    u.uProjInv.value.copy(cam.projectionMatrixInverse); u.uCamMundo.value.copy(cam.matrixWorld); u.uCamPos.value.setFromMatrixPosition(cam.matrixWorld); u.uShadowMat.value.copy(sh.matrix);
    if (u.tDepth.value && u.tShadow.value) {
      this.fsq.material = this.matRaios; renderer.setRenderTarget(this.rtA); this.fsq.render(renderer);
      this.fsq.material = this.matBorra; u.tRaios.value = this.rtA.texture; u.uDir.value.set(1 / this.rtA.width, 0); renderer.setRenderTarget(this.rtB); this.fsq.render(renderer);
      u.tRaios.value = this.rtB.texture; u.uDir.value.set(0, 1 / this.rtA.height); renderer.setRenderTarget(this.rtA); this.fsq.render(renderer);
      u.tRaios.value = this.rtA.texture;
    }
    this.fsq.material = this.matFinal; u.tDiffuse.value = readBuffer.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.fsq.render(renderer);
  }
}

// ---------- as gotas de chuva: riscos que caem numa caixa em volta da câmera ----------
class Gotas {
  constructor(cena, uVento, uTempo, n) {
    const g = new THREE.InstancedBufferGeometry(); const b = new THREE.PlaneGeometry(1, 1); g.index = b.index; g.setAttribute('position', b.attributes.position); g.setAttribute('uv', b.attributes.uv);
    const off = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) off[i] = Math.random(); g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4)); g.instanceCount = 0; g.boundingSphere = new THREE.Sphere(new V3(), 1e6);
    this.u = { uCentro: { value: new V3() }, uT: uTempo, uVento, uCaixa: { value: new V3(46, 30, 46) }, uOpac: { value: 0 } };
    const m = new THREE.ShaderMaterial({ uniforms: this.u, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`attribute vec4 aOff; uniform vec3 uCentro, uCaixa, uVento; uniform float uT; varying vec2 vUv; varying float vA;
        void main(){ vUv=uv; vec3 vel=vec3(uVento.x*uVento.z*4.2,-(17.+aOff.w*7.),uVento.y*uVento.z*4.2);
          vec3 p=uCentro+mod(aOff.xyz*uCaixa+vel*uT,uCaixa)-uCaixa*.5; p.y+=uCaixa.y*.36;
          vec3 dv=normalize(vel); vec3 lado=normalize(cross(dv,cameraPosition-p)); float dist=distance(p,cameraPosition);
          p+=lado*position.x*(.008+.0007*dist)+dv*position.y*(.45+.55*aOff.w); vA=smoothstep(2.,6.,dist)*(.35+.65*aOff.w*aOff.w);
          gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); }`,
      fragmentShader: /* glsl */`uniform float uOpac; varying vec2 vUv; varying float vA;
        void main(){ float a=(1.-abs(vUv.x*2.-1.))*smoothstep(0.,.25,vUv.y)*smoothstep(1.,.6,vUv.y); gl_FragColor=vec4(vec3(.74,.82,.92)*1.25,a*uOpac*vA); }` });
    this.mesh = new THREE.Mesh(g, m); this.mesh.frustumCulled = false; this.mesh.renderOrder = 9; this.mesh.visible = false; cena.add(this.mesh); this.n = n; this.geo = g;
  }
  ajustar(w, centro) { this.mesh.visible = w > 0.01; this.geo.instanceCount = Math.round(this.n * Math.min(1, w * 1.1)); this.u.uOpac.value = 0.42 * Math.min(1, w * 1.5); this.u.uCentro.value.copy(centro); }
}

// ---------- o clima ----------
const lerp = (a, b, t) => a + (b - a) * t;
export class Clima {
  constructor(ctx, refs) {
    this.ctx = ctx; this.r = refs; this.chuva = 0; this.alvo = 0; this.molhado = 0; this.tRel = 6; this.relampago = 0; this.piscadas = []; this.tAuto = 0; this.auto = true; this.tRaj = 0; this.acResp = 0; this.acFolha = 0; this.tLinha = 1;
    this.gotas = new Gotas(ctx.cena, ctx.vento.u, ctx.uTempo, Math.round(15000 * (ctx.qualidade || 1)));
    const c = (h) => new THREE.Color(h);
    this.sol = { sol: c(0xffd9a8), ceu: c(0xf3efe6), chao: c(0xb8a078), nevoa: c(0xc3d0dc) }; this.tempestade = { sol: c(0xaab8c8), ceu: c(0x9aa8ba), chao: c(0x7a7b72), nevoa: c(0x86929c) };
    this.nome = 'Sol';
  }
  alternar() { this.alvo = this.alvo > 0.5 ? 0 : 1; this.auto = false; return this.alvo > 0.5; }
  definir(chuva, ja = false) { this.alvo = chuva ? 1 : 0; this.auto = false; if (ja) { this.chuva = this.alvo; this.molhado = this.alvo; } }
  atualizar(dt, centro) {
    const ctx = this.ctx, r = this.r, v = ctx.vfx;
    // o ciclo sozinho: sol por 2 min e meio, chuva por 1 min e 10 s
    if (this.auto) { this.tAuto += dt; const ciclo = 220; const f = this.tAuto % ciclo; this.alvo = f > 150 ? 1 : 0; }
    this.chuva += Math.sign(this.alvo - this.chuva) * Math.min(Math.abs(this.alvo - this.chuva), dt / 7);
    this.molhado += Math.sign(this.chuva - this.molhado) * Math.min(Math.abs(this.chuva - this.molhado), dt / (this.chuva > this.molhado ? 9 : 40));
    const w = this.chuva, s = w * w * (3 - 2 * w); this.nome = w > 0.5 ? 'Chuva' : 'Sol';
    // o vento: mais forte na chuva, com rajadas
    this.tRaj += dt; const raj = 0.5 + 0.5 * Math.sin(this.tRaj * 0.37) * Math.sin(this.tRaj * 0.13 + 1.7); ctx.vento.u.value.z = lerp(0.85 + 0.5 * raj, 1.7 + 0.9 * raj, s); ctx.vento.rajada = raj;
    // a luz, o céu e a névoa
    r.luzSol.intensity = lerp(r.solForca, 0.55, s) * (1 + this.relampago * 3); r.luzSol.color.lerpColors(this.sol.sol, this.tempestade.sol, s);
    r.luzCeu.intensity = lerp(r.ceuForca, 1.7, s) * (1 + this.relampago * 4); r.luzCeu.color.lerpColors(this.sol.ceu, this.tempestade.ceu, s); r.luzCeu.groundColor.lerpColors(this.sol.chao, this.tempestade.chao, s);
    ctx.cena.fog.color.lerpColors(this.sol.nevoa, this.tempestade.nevoa, s); ctx.cena.fog.density = lerp(0.00105, 0.0062, s); ctx.cena.environmentIntensity = lerp(0.55, 0.95, s);
    const su = ctx.sky.material.uniforms; su.turbidity.value = lerp(2.6, 19, s); su.rayleigh.value = lerp(1.5, 0.22, s); su.mieCoefficient.value = lerp(0.0035, 0.03, s);
    if (ctx.nuvens) ctx.nuvens.material.uniforms.uCob.value = s;
    ctx.renderer.toneMappingExposure = lerp(r.exposicao, r.exposicao * 0.9, s);
    if (r.atm) { r.atm.u.uRaios.value = lerp(1, 0.12, s); r.atm.u.uNuvemF.value = lerp(1, 0, s); r.atm.u.uRelampago.value = this.relampago; }
    MACRO.uMolhado.value = this.molhado; if (ctx.uMolhadoTerreno) ctx.uMolhadoTerreno.value = this.molhado;
    const ag = ctx.agua.material.uniforms; ag.distortionScale.value = lerp(2.4, 5.5, s); ag.waterColor.value.lerpColors(this._a0 || (this._a0 = new THREE.Color(0x1a6474)), this._a1 || (this._a1 = new THREE.Color(0x33474e)), s);
    // as gotas e os respingos
    this.gotas.ajustar(w, centro);
    if (w > 0.05 && v) {
      this.acResp += dt * 520 * w * (ctx.qualidade || 1); let n = 0;
      while (this.acResp > 1 && n++ < 60) { this.acResp -= 1; const a = Math.random() * 6.283, d = Math.sqrt(Math.random()) * 19; const x = centro.x + Math.cos(a) * d, z = centro.z + Math.sin(a) * d; const y = Math.max(0.02, piso(x, z)) + 0.03;
        v.fumo.emitir({ p: new V3(x, y, z), vida: 0.3, t0: 0.05, t1: 0.36, c0: [0.82, 0.88, 0.95], a0: 0.5, a1: 0, q: 5, rot: 0, entra: 0.02 });
        if (Math.random() < 0.5) v.fumo.emitir({ p: new V3(x, y, z), v: new V3((Math.random() - 0.5) * 0.9, 1.2 + Math.random(), (Math.random() - 0.5) * 0.9), vida: 0.26, t0: 0.045, t1: 0.02, c0: [0.85, 0.9, 0.96], a0: 0.6, a1: 0, grav: 9, q: 0, entra: 0.02 }); }
    }
    // os relâmpagos
    if (this.relampago > 0) this.relampago = Math.max(0, this.relampago - dt * 5.5);
    for (let i = this.piscadas.length - 1; i >= 0; i--) { this.piscadas[i] -= dt; if (this.piscadas[i] <= 0) { this.relampago = 0.55 + Math.random() * 0.45; this.piscadas.splice(i, 1); } }
    if (w > 0.6) { this.tRel -= dt; if (this.tRel <= 0) { this.tRel = 6 + Math.random() * 9; this.raio(centro); } }
    // as folhas e as linhas de vento
    if (v) {
      const fz = ctx.vento.u.value.z, vx = ctx.vento.u.value.x, vz = ctx.vento.u.value.y;
      this.acFolha += dt * (2.5 + 7 * raj) * fz; while (this.acFolha > 1) { this.acFolha -= 1; const lado = (Math.random() - 0.5) * 34, tras = -16 - Math.random() * 6; const x = centro.x + vx * tras - vz * lado, z = centro.z + vz * tras + vx * lado; const y = piso(x, z) + 0.2 + Math.random() * 3.5; const vel = 3.5 + 3 * fz * Math.random();
        const cor = Math.random() < 0.6 ? [0.42, 0.55, 0.2] : [0.72, 0.56, 0.2];
        v.fumo.emitir({ p: new V3(x, y, z), v: new V3(vx * vel + (Math.random() - 0.5), (Math.random() - 0.3) * 1.2, vz * vel + (Math.random() - 0.5)), vida: 4 + Math.random() * 3, t0: 0.12, t1: 0.12, c0: cor, a0: 0.95, a1: 0.5, q: 3, giro: (Math.random() - 0.5) * 12, grav: 0.35, arr: 0.02, chao: true, entra: 0.05 }); }
      this.tLinha -= dt * (0.5 + raj) * fz; if (this.tLinha <= 0) { this.tLinha = 0.9 + Math.random() * 1.6; const lado = (Math.random() - 0.5) * 26, tras = -11 - Math.random() * 5; const x = centro.x + vx * tras - vz * lado, z = centro.z + vz * tras + vx * lado; v.linhaDeVento(new V3(x, piso(x, z) + 0.7 + Math.random() * 2.2, z), new V3(vx, 0, vz), 8 + 5 * fz); }
    }
  }
  // um relâmpago: perto de um ponto ao acaso em volta do centro, ou exatamente no ponto dado
  raio(centro, exato = false) {
    const ctx = this.ctx; const a = Math.random() * 6.283, d = exato ? 0 : 70 + Math.random() * 150; const x = centro.x + Math.cos(a) * d, z = centro.z + Math.sin(a) * d; const y0 = Math.max(0, piso(Math.max(-125, Math.min(125, x)), Math.max(-125, Math.min(125, z))));
    this.piscadas.push(0, 0.09 + Math.random() * 0.05, 0.2 + Math.random() * 0.1);
    if (ctx.vfx) { ctx.vfx.arco(new V3(x + (Math.random() - 0.5) * 30, 150, z + (Math.random() - 0.5) * 30), new V3(x, y0, z), 0xcfe0ff, 1.5, 0.32, 14, 9, true); }
    ctx.agendar(exato ? 0.5 : Math.min(4, d / 150), () => ctx.som.tocar('trovao', { vol: exato ? 0.9 : Math.max(0.35, 1.1 - d / 260) }));
  }
}

// ---------- borboletas: pares de asas que batem, vagando perto do herói, só com sol ----------
export class Borboletas {
  constructor(ctx, n = 16) {
    this.ctx = ctx; const P = [0, 0, 0, -0.09, 0, 0.07, -0.08, 0, -0.06, 0, 0, 0, 0.09, 0, 0.07, 0.08, 0, -0.06]; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => { sh.uniforms.uT = ctx.uTempo; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;').replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed.y+=abs(sin(uT*17.+instanceMatrix[3].x*3.1+instanceMatrix[3].z*1.7))*abs(position.x)*1.6;'); };
    this.im = new THREE.InstancedMesh(g, m, n); this.im.frustumCulled = false; ctx.cena.add(this.im); this.lista = []; const cores = [0xf2e8c8, 0xf0b23a, 0xe86a3a, 0x8fb8f0, 0xf6f2ee];
    for (let i = 0; i < n; i++) { this.lista.push({ p: new V3(), alvo: new V3(), t: 0, f: Math.random() * 9, vivo: false }); this.im.setColorAt(i, new THREE.Color(cores[i % cores.length])); }
    this.m4 = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new V3(1, 1, 1); this.up = new V3(0, 1, 0);
  }
  atualizar(dt, centro, chuva) {
    const ctx = this.ctx; const t = ctx.tempo;
    this.lista.forEach((b, i) => {
      if (!b.vivo || b.p.distanceTo(centro) > 30) { const a = Math.random() * 6.283, d = 6 + Math.random() * 16; const x = centro.x + Math.cos(a) * d, z = centro.z + Math.sin(a) * d; if (ctx.densEm(x, z, 2) > 0.15 || ctx.densEm(x, z, 0) > 0.6) { b.p.set(x, piso(x, z) + 0.5, z); b.alvo.copy(b.p); b.vivo = true; b.t = 0; } }
      b.t -= dt; if (b.t <= 0) { b.t = 1 + Math.random() * 2.5; const a = Math.random() * 6.283, d = 1 + Math.random() * 3.5; const x = b.p.x + Math.cos(a) * d, z = b.p.z + Math.sin(a) * d; b.alvo.set(x, piso(x, z) + 0.35 + Math.random() * 0.9, z); }
      const dir = b.alvo.clone().sub(b.p); const L = dir.length(); if (L > 0.05) { dir.multiplyScalar(Math.min(1, 1.4 * dt / L)); b.p.add(dir); }
      const y = b.p.y + Math.sin(t * 6 + b.f) * 0.06; this.q.setFromAxisAngle(this.up, Math.atan2(dir.x, dir.z) + Math.sin(t * 3 + b.f) * 0.4); const esc = b.vivo ? Math.max(0, 1 - chuva * 1.6) : 0; this.e.setScalar(esc);
      this.m4.compose(new V3(b.p.x, y, b.p.z), this.q, this.e); this.im.setMatrixAt(i, this.m4);
    });
    this.im.instanceMatrix.needsUpdate = true;
  }
}
