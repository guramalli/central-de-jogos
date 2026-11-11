// A Pedra Ghotin e as trevas (Logs/Historia/ENREDO.md e a constante TREVAS do jogo).
// Cada pedra tem tamanho e raio de trevas pelo nível. Em volta dela o chão escurece e as criaturas comuns que estão dentro
// do raio ficam amaldiçoadas: aura negra, +30% de vida, +20% de dano, +25% de EXP. Quebrar a pedra desfaz as trevas.
import * as THREE from 'three';
import * as M from './mapa.js';
import { piso } from './natureza.js';
import { MACRO } from './texgen.js';
import { Lobo } from './personagens.js';

const V3 = THREE.Vector3; const rnd = (a, b) => a + Math.random() * (b - a); const rs = (a) => (Math.random() - 0.5) * 2 * a;
export const TREVAS = { escBase: 0.9, escPorNivel: 0.012, raioBase: 4, raioPorNivel: 0.2, vida: 1.3, dano: 1.2, exp: 1.25, folga: 1, sobe: 1.2 };
export const GHOTIN_DUREZA = { vida: 3, curaPct: 0.01, curaSeg: 5 };
export const raioTrevas = (nivel) => TREVAS.raioBase + TREVAS.raioPorNivel * nivel;
export const escGhotin = (nivel) => TREVAS.escBase + TREVAS.escPorNivel * nivel;

// um cristal de faces retas: anéis de raio que muda, torto e pontudo
function cristal(r, alt, raio, lados = 6) {
  const aneis = [[0, 1.0], [0.1, 1.12], [0.48, 0.96], [0.78, 0.62], [1.0, 0.0]]; const P = []; const pts = [];
  const ponta = [rs(raio * 0.25), 0, rs(raio * 0.25)];
  aneis.forEach(([fy, fr], k) => { const linha = []; for (let s = 0; s < lados; s++) { const a = s / lados * 6.283 + k * 0.12; const rr = raio * fr * (0.82 + r() * 0.36); linha.push([Math.cos(a) * rr + ponta[0] * fy, alt * fy + (k > 0 && k < 4 ? rs(alt * 0.03) : 0), Math.sin(a) * rr + ponta[2] * fy]); } pts.push(linha); });
  for (let k = 0; k < aneis.length - 1; k++) for (let s = 0; s < lados; s++) { const a = pts[k][s], b = pts[k][(s + 1) % lados], c = pts[k + 1][s], d = pts[k + 1][(s + 1) % lados]; P.push(...a, ...c, ...b, ...b, ...c, ...d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals();
  const uv = new Float32Array(P.length / 3 * 2); for (let i = 0; i < P.length / 3; i++) { uv[i * 2] = P[i * 3] + P[i * 3 + 2]; uv[i * 2 + 1] = P[i * 3 + 1]; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
}

export class Ghotin {
  constructor(ctx, x, z, { nome = 'Ghotin da Tristeza', nivel = 5, vida = 900, cor = 0xff5a3a, horda = 'lobo', qtd = 3 } = {}) {
    this.ctx = ctx; this.nome = nome; this.nivel = nivel; this.cor = cor; this.tipo = 'ghotin'; this.ehPedra = true; this.hordaTipo = horda; this.qtd = qtd;
    this.esc = escGhotin(nivel) * 1.25; this.raioTrevas = raioTrevas(nivel); this.vidaMax = vida * GHOTIN_DUREZA.vida; this.vida = this.vidaMax;
    this.pos = new V3(x, piso(x, z), z); this.raio = 1.05 * this.esc; this.altura = 2.7 * this.esc; this.morto = false; this.estado = 'viva'; this.trevas = 1; this.veneno = 0; this.fogo = 0; this.atordoado = 0; this.mostrarVida = 0;
    this.ondas = [0.8, 0.55, 0.3]; this.onda = 0; this.tCura = 0; this.tConta = 0; this.tArco = 1; this.tRenascer = 0; this.pulso = 0; this.tTreme = 0; this.acFumo = 0; this.acBrasa = 0; this.heroiDentro = false; this.xp = 650; this.yang = 320;
    const r = M.semente(77 + nivel); const cr = new THREE.Color(cor);
    // o material: rocha negra vidrada com veios que pulsam na cor da runa
    this.uPulso = { value: 0 }; this.uVida = { value: 1 };
    const mat = new THREE.MeshStandardMaterial({ color: 0x0c0c12, roughness: 0.24, metalness: 0.4, envMapIntensity: 1.5 });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.tRuidoM = MACRO.tRuidoM; sh.uniforms.uCorRuna = { value: cr }; sh.uniforms.uPulso = this.uPulso; sh.uniforms.uVida = this.uVida; sh.uniforms.uT = ctx.uTempo;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vPL;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPL=position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tRuidoM; uniform vec3 uCorRuna; uniform float uPulso,uVida,uT; varying vec3 vPL;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { float n1=texture2D(tRuidoM,vPL.xy*.21+vPL.z*.13).r, n2=texture2D(tRuidoM,vPL.zy*.17+vPL.x*.11+.37).g, n3=texture2D(tRuidoM,vPL.xz*.6+vPL.y*.4).b;
          float fino=mix(60.,20.,1.-uVida); float veio=pow(1.-abs(n1-.5)*2.,fino)+pow(1.-abs(n2-.5)*2.,fino)*.8+pow(1.-abs(n3-.5)*2.,90.)*.4;
          float pul=.5+.5*sin(uT*2.3+vPL.y*2.4+n1*6.); totalEmissiveRadiance+=uCorRuna*veio*(2.+4.*pul+uPulso*12.)+uCorRuna*uPulso*.35; }`);
    };
    this.mat = mat;
    const g = new THREE.Group(); this.grupo = g; g.position.copy(this.pos); g.scale.setScalar(this.esc); ctx.cena.add(g);
    const principal = new THREE.Mesh(cristal(r, 2.75, 0.78, 7), mat); principal.rotation.set(0.06, 0.4, -0.07); principal.position.y = -0.15; g.add(principal);
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + r() * 0.6, d = 0.75 + r() * 0.45; const m = new THREE.Mesh(cristal(r, 0.8 + r() * 1.0, 0.24 + r() * 0.2, 5), mat); m.position.set(Math.cos(a) * d, -0.12, Math.sin(a) * d); m.rotation.set(Math.sin(a) * (0.3 + r() * 0.4), r() * 6, -Math.cos(a) * (0.3 + r() * 0.4)); g.add(m); }
    // o monte de pedra queimada na base
    const gb = new THREE.IcosahedronGeometry(1, 3); const pb = gb.attributes.position; for (let i = 0; i < pb.count; i++) { const x1 = pb.getX(i), y1 = pb.getY(i), z1 = pb.getZ(i); const n = 1 + 0.22 * M.fbm(x1 * 1.4 + 3, z1 * 1.4 + y1, 3); pb.setXYZ(i, x1 * n * 1.7, Math.max(-0.2, y1 * n * 0.42), z1 * n * 1.7); } gb.computeVertexNormals();
    const base = new THREE.Mesh(gb, new THREE.MeshStandardMaterial({ color: 0x17151a, roughness: 0.95, envMapIntensity: 0.3 })); base.position.y = -0.05; g.add(base);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    // os cacos que flutuam em volta
    this.cacos = new THREE.InstancedMesh(cristal(r, 0.42, 0.11, 5).translate(0, -0.21, 0), mat, 7); this.cacos.castShadow = true; this.cacos.frustumCulled = false; ctx.cena.add(this.cacos);
    this.cacosDados = []; for (let k = 0; k < 7; k++) this.cacosDados.push({ a: k / 7 * 6.283, r: 1.45 + r() * 0.6, y: 1.0 + r() * 1.9, v: 0.35 + r() * 0.3, f: r() * 6.283, e: 0.7 + r() * 0.8 });
    // a luz da runa e o anel no chão
    this.luz = new THREE.PointLight(cor, 0, 9.5, 2); ctx.cena.add(this.luz);
    this.anel = ctx.vfx.disco(1, ctx.vfx.texAnel, cor, true, 0.5); this.anelFundo = ctx.vfx.disco(1, ctx.vfx.texMarca, 0x050406, false, 0.85);
    ctx.vfx.assentar(this.anelFundo, x, z, 3.1 * this.esc);
    M.bloquearCirc(x, z, this.raio * 0.9);
    this.m4 = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new V3(); this.p = new V3();
    this.defensores();
  }
  peito(v) { return v.set(this.pos.x, this.pos.y + this.altura * 0.45, this.pos.z); }
  envenenar() { } queimar() { } atordoar() { }
  topo() { return new V3(this.pos.x, this.pos.y + this.altura, this.pos.z); }
  // a horda: n lobos em volta da pedra
  chamarHorda(n, cacando) {
    const ctx = this.ctx; const minhas = ctx.lobos.filter(l => l.hordaDe === this && !l.morto).length; n = Math.min(n, 9 - minhas); let ga = Math.random() * 7;
    for (let k = 0; k < n; k++) {
      const a = ga + k * 2.1, d = 2.2 + Math.random() * 1.4; let x = this.pos.x + Math.cos(a) * d, z = this.pos.z + Math.sin(a) * d; if (M.bloqueado(x, z)) { x = this.pos.x + Math.cos(a) * 1.8; z = this.pos.z + Math.sin(a) * 1.8; }
      const l = new Lobo(ctx, this.hordaTipo, x, z, { horda: this }); l.casa.set(this.pos.x + Math.cos(a) * 2.6, 0, this.pos.z + Math.sin(a) * 2.6); ctx.lobos.push(l); ctx.hud.rotuloLobo(l); l.nascer();
      ctx.vfx.poeira(l.pos, 5, [0.06, 0.05, 0.08], 1.2); for (let q = 0; q < 8; q++) ctx.vfx.fuligem(l.pos, 0.5, 1.1);
      if (cacando) l.alertar(true);
    }
    return n;
  }
  defensores() { this.chamarHorda(this.qtd, false); }
  receber(dano, o = {}) {
    if (this.morto || this.estado !== 'viva') return; const ctx = this.ctx; this.vida -= dano; this.mostrarVida = 8; this.pulso = 1; this.tTreme = 0.16; ctx.heroi.emCombate = 6;
    ctx.hud.numero(this.peito(new V3()).add(new V3(0, 1.2, 0)), dano, o.critico ? 'critico' : o.skill ? 'skill' : 'normal');
    const p = this.peito(new V3()); const c = new THREE.Color(this.cor);
    if (ctx.tempo - (this.tSom ?? -9) > 0.13) { this.tSom = ctx.tempo; ctx.som.tocar('metin_golpe', { pos: this.pos, vol: 0.9 }); ctx.vfx.estilhacos(p, [0.05, 0.05, 0.07], 5, 4, 0.12); ctx.vfx.faiscas(p, [c.r, c.g, c.b], 9, 4.5); ctx.vfx.tremor = Math.max(ctx.vfx.tremor, 0.1);
      const a = Math.random() * 6.283; ctx.vfx.arco(p, new V3(p.x + Math.cos(a) * 2.2, this.pos.y + 0.05, p.z + Math.sin(a) * 2.2), this.cor, 0.07, 0.12, 6, 0.5); }
    for (const l of ctx.lobos) if (l.hordaDe === this && !l.morto) l.alertar(true);
    if (this.vida <= 0) { this.quebrar(); return; }
    while (this.onda < this.ondas.length && this.vida / this.vidaMax <= this.ondas[this.onda]) { this.onda++; const n = this.chamarHorda(this.qtd, true); if (n > 0) { ctx.hud.aviso(`${this.nome} chamou uma horda!`, 2.4); ctx.som.tocar('chefe_aparece', { pos: this.pos, vol: 0.7 }); ctx.vfx.anel(this.pos.x, this.pos.z, 0.6, this.raioTrevas, 0.6, this.cor); } }
  }
  quebrar() {
    const ctx = this.ctx; this.morto = true; this.estado = 'morta'; this.vida = 0; this.tRenascer = ctx.renascerGhotin || 60; this.tMorta = 0;
    ctx.som.tocar('metin_quebra', { pos: this.pos, vol: 1 }); ctx.som.tocar('desmorona', { pos: this.pos, vol: 0.7, atraso: 0.1 }); ctx.vfx.explosaoTrevas(this.pos.clone(), this.cor);
    this.grupo.visible = false; this.cacos.visible = false; M.liberarRet(this.pos.x - 1.4, this.pos.z - 1.4, this.pos.x + 1.4, this.pos.z + 1.4);
    for (const l of ctx.lobos) if (l.maldita === this) l.libertar();
    ctx.heroi.ganharXp(this.xp, this.yang); ctx.estat.ghotins = (ctx.estat.ghotins || 0) + 1;
    ctx.hud.registro(`Você quebrou a <b>${this.nome}</b>: +${this.xp} XP, +${this.yang} yang, +1 Tinta da Yeouiju`); ctx.hud.titulo('As trevas se desfazem', `${this.nome} quebrada`, 3.6); ctx.som.tocar('drop_raro', { vol: 0.7, atraso: 0.7 });
  }
  // a pedra cai do céu de novo
  cair() { this.estado = 'caindo'; this.tQueda = 0; this.morto = true; this.vida = this.vidaMax; this.onda = 0; this.grupo.visible = true; this.ctx.som.tocar('meteoro_queda', { pos: this.pos, vol: 0.9 }); }
  pousar() {
    const ctx = this.ctx, p = this.pos; this.estado = 'viva'; this.morto = false; this.cacos.visible = true; this.grupo.position.copy(p); M.bloquearCirc(p.x, p.z, this.raio * 0.9);
    ctx.som.tocar('meteoro', { pos: p, vol: 1 }); ctx.vfx.tremor = Math.max(ctx.vfx.tremor, 0.8); ctx.vfx.poeira(p, 26, [0.2, 0.18, 0.2], 2.6); ctx.vfx.estilhacos(p, [0.1, 0.09, 0.1], 22, 8, 0.22);
    ctx.vfx.anel(p.x, p.z, 0.6, this.raioTrevas * 1.3, 0.7, this.cor); ctx.vfx.anel(p.x, p.z, 0.4, this.raioTrevas * 0.8, 0.9, 0x201020, 0.1); ctx.vfx.clarao(new V3(p.x, p.y + 1.5, p.z), this.cor, 150, 0.8, 22); ctx.vfx.coluna(p.clone(), this.cor, 1.8, 16, 0.9, 0.9);
    ctx.hud.registro(`Uma <b>${this.nome}</b> caiu do céu. As trevas voltaram.`); this.defensores();
    // quem estava embaixo é empurrado para fora
    const h = ctx.heroi; const d = Math.hypot(h.pos.x - p.x, h.pos.z - p.z); if (d < 2.2) { const a = d > 0.01 ? Math.atan2(h.pos.z - p.z, h.pos.x - p.x) : 0; h.pos.x = p.x + Math.cos(a) * 2.4; h.pos.z = p.z + Math.sin(a) * 2.4; h.rota = null; h.receber(120, null); }
  }
  atualizar(dt) {
    const ctx = this.ctx, v = ctx.vfx, t = ctx.tempo, p = this.pos; const cr = this._c || (this._c = new THREE.Color(this.cor)); const cc = [cr.r, cr.g, cr.b];
    // as trevas acendem e apagam em 1,2 s
    const alvo = this.estado === 'viva' ? 1 : 0; this.trevas += Math.sign(alvo - this.trevas) * Math.min(Math.abs(alvo - this.trevas), dt / TREVAS.sobe);
    this.pulso = Math.max(0, this.pulso - dt * 3.2); this.uPulso.value = this.pulso; this.uVida.value = Math.max(0, this.vida / this.vidaMax); this.mostrarVida = Math.max(0, this.mostrarVida - dt);
    if (ctx.atm) { ctx.atm.u.uTrevas.value.set(p.x, p.y + 0.6, p.z, this.raioTrevas); ctx.atm.u.uTrevasF.value = this.trevas; }
    if (ctx.uTrevasGrama) ctx.uTrevasGrama.value.set(p.x, p.z, this.raioTrevas, this.trevas);
    this.luz.position.set(p.x, p.y + 1.6 * this.esc, p.z); this.luz.intensity = this.trevas * (16 + 6 * Math.sin(t * 7.3) + 4 * Math.sin(t * 13.1) + this.pulso * 60);
    this.anel.visible = this.trevas > 0.02; this.anelFundo.visible = this.trevas > 0.02; this.anelFundo.material.opacity = 0.85 * this.trevas;
    if (this.anel.visible) { v.assentar(this.anel, p.x, p.z, this.raioTrevas * (0.98 + 0.02 * Math.sin(t * 2.2))); this.anel.material.opacity = (0.22 + 0.1 * Math.sin(t * 3.1)) * this.trevas; }
    if (this.estado === 'morta') { this.tMorta += dt; if (this.tMorta >= this.tRenascer) this.cair(); return; }
    if (this.estado === 'caindo') { this.tQueda += dt; const k = Math.min(1, this.tQueda / 1.1); const y = p.y + 70 * (1 - k * k); this.grupo.position.set(p.x + (1 - k) * 9, y, p.z - (1 - k) * 5);
      for (let i = 0; i < 4; i++) { v.chama(new V3(this.grupo.position.x + rs(0.5), y + 1 + rs(1), this.grupo.position.z + rs(0.5)), 1.6); v.fuligem(new V3(this.grupo.position.x, y + 2, this.grupo.position.z), 0.8, 2); }
      if (k >= 1) this.pousar(); return; }
    // a pedra viva: treme quando apanha, cura devagar, confere a maldição, solta fumaça, brasas e arcos
    this.tTreme = Math.max(0, this.tTreme - dt); const tr = this.tTreme > 0 ? 0.05 : 0; this.grupo.position.set(p.x + rs(tr), p.y + Math.sin(t * 1.3) * 0.02, p.z + rs(tr)); this.grupo.rotation.y = Math.sin(t * 0.2) * 0.05;
    this.tCura += dt; if (this.tCura >= GHOTIN_DUREZA.curaSeg) { this.tCura = 0; if (this.vida < this.vidaMax) this.vida = Math.min(this.vidaMax, this.vida + Math.max(1, Math.floor(this.vidaMax * GHOTIN_DUREZA.curaPct))); }
    this.cacosDados.forEach((c, i) => { const a = c.a + t * c.v; this.p.set(p.x + Math.cos(a) * c.r * this.esc, p.y + (c.y + Math.sin(t * 1.1 + c.f) * 0.18) * this.esc, p.z + Math.sin(a) * c.r * this.esc); this.q.setFromEuler(new THREE.Euler(t * 0.7 + c.f, t * 0.9 + c.f * 2, c.f)); this.e.setScalar(c.e * this.esc); this.m4.compose(this.p, this.q, this.e); this.cacos.setMatrixAt(i, this.m4); }); this.cacos.instanceMatrix.needsUpdate = true;
    this.tConta -= dt; if (this.tConta <= 0) { this.tConta = 0.25; const R = this.raioTrevas;
      for (const l of ctx.lobos) { if (l.morto || l.estado === 'nascendo') continue; const d = Math.hypot(l.pos.x - p.x, l.pos.z - p.z); const dentro = d < R || (l.maldita === this && d < R + TREVAS.folga); if (dentro && !l.maldita) l.amaldicoar(this); else if (!dentro && l.maldita === this) l.libertar(); }
      const h = ctx.heroi; const hd = Math.hypot(h.pos.x - p.x, h.pos.z - p.z) < R; if (hd && !this.heroiDentro) { ctx.hud.registro(`Você entrou nas <b>trevas</b> da ${this.nome}. As criaturas daqui estão amaldiçoadas.`); ctx.som.tocar('arcano_carga', { vol: 0.5 }); } this.heroiDentro = hd; }
    if (Math.hypot(ctx.heroi.pos.x - p.x, ctx.heroi.pos.z - p.z) < 60 || ctx.cam.cine) {
      const R = this.raioTrevas;
      this.acFumo += dt * 34; while (this.acFumo > 1) { this.acFumo -= 1; const a = Math.random() * 6.283, d = Math.sqrt(Math.random()) * R * 1.02; const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d; v.fumo.emitir({ p: new V3(x, piso(x, z) + 0.1, z), v: new V3(-Math.sin(a) * 0.5, rnd(0.25, 0.9), Math.cos(a) * 0.5), vida: rnd(1.8, 3.6), t0: 0.3, t1: rnd(0.9, 1.7), c0: [0.015, 0.012, 0.025], a0: 0.42, a1: 0, q: Math.random() < 0.5 ? 10 : 1, giro: rs(0.6), entra: 0.25, vento: 0.15 }); }
      this.acBrasa += dt * 16; while (this.acBrasa > 1) { this.acBrasa -= 1; const a = Math.random() * 6.283, d = Math.random() * 1.6; v.luz.emitir({ p: new V3(p.x + Math.cos(a) * d, p.y + rnd(0.1, 2.4), p.z + Math.sin(a) * d), v: new V3(rs(0.3), rnd(0.5, 1.6), rs(0.3)), vida: rnd(0.9, 2), t0: rnd(0.05, 0.12), t1: 0.02, c0: cc, a0: 1, a1: 0, q: Math.random() < 0.15 ? 11 : 2, vento: 0.2 }); }
      this.tArco -= dt; if (this.tArco <= 0) { this.tArco = rnd(0.25, 1.3) * (0.4 + 0.6 * this.vida / this.vidaMax); const de = new V3(p.x + rs(0.3), p.y + rnd(1.2, 2.7) * this.esc, p.z + rs(0.3)); let ate; if (Math.random() < 0.45) { const c = this.cacosDados[(Math.random() * 7) | 0]; const a = c.a + t * c.v; ate = new V3(p.x + Math.cos(a) * c.r * this.esc, p.y + c.y * this.esc, p.z + Math.sin(a) * c.r * this.esc); } else { const a = Math.random() * 6.283, d = rnd(1.4, 3.4); const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d; ate = new V3(x, piso(x, z) + 0.05, z); v.faiscas(ate, cc, 4, 2); }
        v.arco(de, ate, this.cor, 0.07, 0.13, 7, 0.5); }
    }
  }
}
