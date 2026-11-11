// O Dragão gigante: o modelo do Dragão do jogo (o do Vale dos Dragões), posto bem grande no pátio do meio da ilha vulcânica.
// É de enfeite: respira parado, ruge e sopra fogo de tempos em tempos, e levanta voo: dá a volta por cima do vulcão batendo as asas e pousa de novo.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import * as M from './mapa.js';
import { altura } from './natureza.js';
import { recorte } from './texgen.js';

const V3 = THREE.Vector3; const rnd = (a, b) => a + Math.random() * (b - a); const rs = (a) => (Math.random() - 0.5) * 2 * a;
const _qp = new THREE.Quaternion(), _qd = new THREE.Quaternion(), _qd2 = new THREE.Quaternion(), _qi = new THREE.Quaternion(), _cima = new V3(0, 1, 0), _eixo = new V3(), _a = new V3(), _b = new V3(), _c = new V3(), _p = new V3();

export class DragaoGigante {
  constructor(ctx, x, z, { esc = 5, rot = 0 } = {}) {
    this.ctx = ctx; const g = ctx.gltf.dragao; this.esc = esc; this.x = x; this.z = z; this.nome = 'Dragão'; this.titulo = 'Gigante · senhor do vulcão';
    this.raiz = new THREE.Group(); this.modelo = SkeletonUtils.clone(g.scene); this.raiz.add(this.modelo); this.raiz.scale.setScalar(esc); this.raiz.rotation.y = rot;
    // assenta nas quatro patas: a menor altura do chão em volta
    let y = 1e9; for (const [dx, dz] of [[0, 0], [1.6, 1.6], [-1.6, 1.6], [1.6, -1.6], [-1.6, -1.6]]) y = Math.min(y, altura(x + dx * esc * 0.5, z + dz * esc * 0.5)); this.raiz.position.set(x, y - 0.05 * esc, z); ctx.cena.add(this.raiz);
    this.modelo.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.roughness = 0.62; o.material.envMapIntensity = 0.8; recorte(o.material);   // o recorte: o herói não some quando a câmera fica atrás do Dragão
      o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
    this.mixer = new THREE.AnimationMixer(this.modelo); this.acoes = {}; for (const c of g.animations) this.acoes[c.name] = this.mixer.clipAction(c);
    this.boca = this.modelo.getObjectByName('Boca'); this.cabeca = this.modelo.getObjectByName('Head');
    this.pescoco = ['Neck', 'Neck_2', 'Neck_3', 'Neck_4', 'Head'].map(n => this.modelo.getObjectByName(n)).filter(Boolean); this.olhar = 0; this.baixar = 0;
    this.estado = 'parado'; this.t = 0; this.tProx = 7; this.atual = ''; this.tocar('parado'); this.mixer.update(1.3);
    this.alt = 3.3 * esc; this.raio = 1.05 * esc; M.bloquearCirc(x, z, this.raio);
    this.luz = new THREE.PointLight(0xff7a20, 0, 40, 2); ctx.cena.add(this.luz); this.pBoca = new V3(); this.pCab = new V3(); this.dir = new V3(0, 0.4, 1);
    this.prepararVoo();
  }
  tocar(nome, uma = false, vel = 0.62) { const a = this.acoes[nome]; if (!a) return null; const ant = this.acoes[this.atual]; a.reset(); a.timeScale = vel; a.setLoop(uma ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = uma; a.enabled = true; a.setEffectiveWeight(1); a.play(); if (ant && ant !== a) a.crossFadeFrom(ant, 0.5, false); this.atual = nome; return a; }
  // o: 'rugir' ou 'sopro' (chamado pela demonstração ou pelo relógio próprio)
  agir(o) {
    if (this.estado !== 'parado') return; const ctx = this.ctx; const a = this.tocar(o, true, 0.72); if (!a) return; this.estado = o; this.t = 0; this.dur = a.getClip().duration / 0.72;
    const d = Math.hypot(ctx.heroi.pos.x - this.x, ctx.heroi.pos.z - this.z); const vol = Math.max(0.3, Math.min(1.2, 1.5 - d / 70));
    if (o === 'rugir') { ctx.agendar(0.5, () => { ctx.som.tocar('rugido_chefe', { vol, vel: 0.72, var: 0 }); ctx.vfx.tremor = Math.max(ctx.vfx.tremor, vol * 0.5); }); }
    else { ctx.agendar(0.9, () => { ctx.som.tocar('erupcao', { vol, vel: 0.8, var: 0 }); ctx.som.tocar('magia_fogo', { vol: vol * 0.9, vel: 0.7 }); }); }
  }
  // o pescoço e a cabeça seguem o herói quando ele chega perto (o corpo fica onde está)
  seguirHeroi(dt) {
    const h = this.ctx.heroi; if (!h || !this.pescoco.length) return; const dx = h.pos.x - this.x, dz = h.pos.z - this.z, d = Math.hypot(dx, dz);
    let alvo = 0, baixo = 0; if (d < 52) { alvo = Math.atan2(dx, dz) - this.raiz.rotation.y; while (alvo > Math.PI) alvo -= 2 * Math.PI; while (alvo < -Math.PI) alvo += 2 * Math.PI; alvo = Math.max(-1.25, Math.min(1.25, alvo)); baixo = 0.5 * Math.max(0, 1 - d / 40); }
    const k = Math.min(1, dt * 1.1); this.olhar += (alvo - this.olhar) * k; this.baixar += (baixo - this.baixar) * k; if (Math.abs(this.olhar) < 0.004 && this.baixar < 0.004) return;
    const n = this.pescoco.length; const yaw = this.raiz.rotation.y + this.olhar * 0.5; _eixo.set(Math.cos(yaw), 0, -Math.sin(yaw));     // o eixo do lado do Dragão, para baixar a cabeça
    for (const b of this.pescoco) { b.parent.updateWorldMatrix(true, false); b.parent.getWorldQuaternion(_qp); _qd.setFromAxisAngle(_cima, this.olhar / n); _qd2.setFromAxisAngle(_eixo, this.baixar / n); _qd.multiply(_qd2);
      b.quaternion.premultiply(_qp).premultiply(_qd).premultiply(_qp.invert()); }
  }
  // ---------- o voo ----------
  // O modelo não tem animação de voo: a pose é feita aqui, osso por osso, por cima do "parado".
  // Cada osso é girado para o trecho dele (osso -> filho) apontar numa direção dada nos eixos do Dragão (x esquerda, y cima, z frente).
  prepararVoo() {
    const g = (n) => this.modelo.getObjectByName(n); const o = this.ov = {};
    for (const s of ['L', 'R']) for (const n of ['Braco', 'Ante', 'D1a', 'D1b', 'D2a', 'D2b', 'D3a', 'D3b']) o['Asa' + s + '_' + n] = g('Asa' + s + '_' + n);
    for (const p of ['HL', 'HR', 'FL', 'FR']) for (const n of ['Upper', 'Lower', 'Foot', 'Toe']) o[p + '_' + n] = g(p + '_' + n);
    for (const n of ['Neck', 'Neck_2', 'Neck_3', 'Neck_4', 'Head', 'Boca', 'Tail_1', 'Tail_2', 'Tail_3', 'Tail_4', 'Tail_5', 'Tail_6', 'Tail_7']) o[n] = g(n);
    this.raiz.rotation.order = 'YXZ'; this.base = this.raiz.position.clone(); this.yaw0 = this.raiz.rotation.y; this.cLocal = new V3(0, 1.15, 0.45).multiplyScalar(this.esc);   // o meio do corpo: o Dragão gira em volta dele no ar
    this.centro0 = this.base.clone().add(this.cLocal.clone().applyAxisAngle(_cima, this.yaw0)); this.centro = this.centro0.clone(); this.voo = null; this.tVoo = rnd(24, 40);
  }
  mirar(osso, filho, x, y, z, w = 1) {
    if (!osso || !filho || w <= 0) return; filho.updateWorldMatrix(true, false); _a.setFromMatrixPosition(osso.matrixWorld); _b.setFromMatrixPosition(filho.matrixWorld).sub(_a); if (_b.lengthSq() < 1e-12) return; _b.normalize();
    _c.set(x, y, z).normalize().applyQuaternion(this.raiz.quaternion); _qd.setFromUnitVectors(_b, _c); if (w < 1) _qd.slerp(_qi.identity(), 1 - w);
    osso.parent.getWorldQuaternion(_qp); osso.quaternion.premultiply(_qp).premultiply(_qd).premultiply(_qp.invert());
  }
  girar(osso, x, y, z, ang, w = 1) { if (!osso || w <= 0) return; _c.set(x, y, z).normalize().applyQuaternion(this.raiz.quaternion); _qd.setFromAxisAngle(_c, ang * w); osso.parent.getWorldQuaternion(_qp); osso.quaternion.premultiply(_qp).premultiply(_qd).premultiply(_qp.invert()); }
  // a pose de voo: psi é a fase da batida (a asa está no alto em pi/2), w o peso da pose, A o tamanho da batida
  poseVoo(psi, w, A) {
    const o = this.ov, S = Math.sin, C = Math.cos; const b0 = 0.1;
    const bA = b0 + A * S(psi), bF = b0 + A * S(psi - 0.45), bD = b0 - 0.04 + A * 1.05 * S(psi - 0.95), u = Math.max(0, C(psi - 0.35));   // u: a asa subindo (ela dobra um pouco e vai para trás)
    for (const [s, sn] of [['L', 1], ['R', -1]]) {
      const n = (x) => o['Asa' + s + '_' + x];
      this.mirar(n('Braco'), n('Ante'), sn * C(bA), S(bA), 0.22 - 0.2 * u, w);
      this.mirar(n('Ante'), n('D2a'), sn * C(bF), S(bF) - 0.1 * u, 0.1 - 0.4 * u, w);
      for (const [d, gam] of [['D1', 0.14], ['D2', 0.74], ['D3', 1.3]]) { const g = gam * (1 + 0.28 * u); this.mirar(n(d + 'a'), n(d + 'b'), sn * C(g) * C(bD), C(g) * S(bD) - 0.1 * u - 0.06, -S(g), w); this.girar(n(d + 'b'), 0, 0, 1, sn * 0.3 * S(psi - 1.55), w); }
    }
    // as pernas recolhidas: as de trás esticadas para trás, as da frente dobradas no peito
    for (const [p, sn] of [['HL', 1], ['HR', -1]]) { this.mirar(o[p + '_Upper'], o[p + '_Lower'], sn * 0.12, -0.42, -0.9, w); this.mirar(o[p + '_Lower'], o[p + '_Foot'], sn * 0.04, -0.62, -0.78, w); this.mirar(o[p + '_Foot'], o[p + '_Toe'], 0, -0.3, -0.95, w); }
    for (const [p, sn] of [['FL', 1], ['FR', -1]]) { this.mirar(o[p + '_Upper'], o[p + '_Lower'], sn * 0.1, -0.62, -0.78, w); this.mirar(o[p + '_Lower'], o[p + '_Foot'], sn * 0.02, -0.5, 0.86, w); this.mirar(o[p + '_Foot'], o[p + '_Toe'], 0, -0.85, 0.5, w); }
    // o pescoço esticado para a frente e a cauda reta, com onda
    const cab = 0.05 * S(psi - 0.6);
    for (const [a, b, sobe] of [['Neck', 'Neck_2', 0.8], ['Neck_2', 'Neck_3', 0.62], ['Neck_3', 'Neck_4', 0.42], ['Neck_4', 'Head', 0.22]]) this.mirar(o[a], o[b], 0, sobe + cab, 1, w);
    this.mirar(o.Head, o.Boca, 0, -0.26 + cab, 1, w);
    for (let k = 1; k <= 6; k++) this.mirar(o['Tail_' + k], o['Tail_' + (k + 1)], 0.16 * S(psi * 0.5 - k * 0.6), 0.1 * S(psi - 0.5 - k * 0.55) + 0.03 - 0.02 * k, -1, w);
  }
  distOuvinte() { const c = this.centro, ctx = this.ctx; return Math.min(c.distanceTo(ctx.camera.position), Math.hypot(ctx.heroi.pos.x - c.x, ctx.heroi.pos.z - c.z)); }
  // levanta voo (orbita: quantos segundos dando a volta lá em cima). Devolve false se ele estiver ocupado.
  voar(orbita = 15) {
    if (this.voo || this.estado !== 'parado') return false; const ctx = this.ctx;
    this.voo = { t: 0, psi: Math.PI / 2, phi: Math.atan2(Math.cos(this.yaw0), Math.sin(this.yaw0)), orbita, yaw: this.yaw0, pitch: 0, rolo: 0, ant: this.centro0.clone(), k: 0, pousou: false };
    this.estado = 'voando'; this.olhar = 0; this.baixar = 0; const vol = Math.max(0.2, Math.min(1.1, 1.4 - this.distOuvinte() / 80)); ctx.som.tocar('rugido_chefe', { vol, vel: 0.82, var: 0 }); return true;
  }
  atualizarVoo(dt) {
    const v = this.voo, ctx = this.ctx, fx = ctx.vfx; v.t += dt; const t = v.t; const e = this.esc / 8; const T1 = 1.1, T2 = T1 + 6.5, T3 = T2 + v.orbita, T4 = T3 + 8, T5 = T4 + 1.3;
    const suave = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }; const sob = suave((t - T1) / 6.5), des = suave((t - T3) / 8);
    // o peso da pose, o ritmo e o tamanho da batida: forte na decolagem e na freada, larga lá em cima
    const w = t < T1 ? suave(t / T1) : t < T4 ? 1 : 1 - suave((t - T4) / 1.3); v.k = suave((t - T1) / 2) * (1 - suave((t - T4 + 1) / 2));
    const freq = t < T1 ? 0 : t < T2 ? 1.2 - 0.38 * sob : t < T3 ? 0.8 : 0.82 + 0.5 * des; const amp = t < T2 ? 0.95 - 0.2 * sob : t < T3 ? 0.74 : 0.74 + 0.2 * des;
    const psiAnt = v.psi; v.psi += 2 * Math.PI * freq * dt;
    // o caminho: sai para a frente subindo, entra na volta em torno do vulcão e desce em espiral para o pátio
    const R = 27 * e * (sob - des), alt = 27 * e * (Math.pow(sob, 0.8) - des); const om = 0.5 * suave((t - T1 - 1) / 3.5) * (1 - 0.8 * suave((t - (T4 - 3)) / 3)); v.phi += om * dt;
    const agacha = t < T1 ? -0.8 * e * Math.sin(Math.PI * 0.9 * t / T1) : 0, sobe = t >= T1 && t < T4 ? -0.85 * e * Math.sin(v.psi) * Math.min(1, (t - T1) * 2) * Math.min(1, (T4 - t) * 1.5) : 0;
    _p.set(this.centro0.x + R * Math.cos(v.phi), this.centro0.y + alt + agacha + sobe, this.centro0.z + R * Math.sin(v.phi));
    const k = 1 / Math.max(dt, 1e-4); const vx = (_p.x - v.ant.x) * k, vy = (_p.y - v.ant.y - (sobe - (v.sobeAnt || 0))) * k, vz = (_p.z - v.ant.z) * k, vh = Math.hypot(vx, vz); v.ant.copy(_p); v.sobeAnt = sobe;
    // para onde ele vira: o nariz segue o caminho, sobe na subida, e a asa de dentro baixa na curva
    const fim = t >= T4 - 2.6; let ya = v.yaw; if (fim) ya = this.yaw0; else if (vh > 1.5) ya = Math.atan2(vx, vz);
    let dy = ya - v.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI; const passo = dy * Math.min(1, dt * (fim ? 1.6 : 2.6)); v.yaw += passo;
    const pAlvo = t < T1 ? 0 : t < T4 - 2.4 ? Math.max(-0.4, Math.min(0.6, Math.atan2(vy, Math.max(7, vh)) * 0.9)) : t < T4 ? 0.3 : 0; v.pitch += (pAlvo - v.pitch) * Math.min(1, dt * 2.2);
    const rAlvo = fim ? 0 : Math.max(-0.5, Math.min(0.5, -(passo * k) * vh / 16)); v.rolo += (rAlvo - v.rolo) * Math.min(1, dt * 2);
    this.raiz.rotation.set(-v.pitch, v.yaw, v.rolo); this.raiz.position.copy(_p).sub(_c.copy(this.cLocal).applyQuaternion(this.raiz.quaternion)); this.centro.copy(_p);
    if (this.rotulo) { this.rotulo.x = _p.x; this.rotulo.z = _p.z; }
    this.poseVoo(v.psi, w, amp);
    // a cada batida para baixo: o som do ar e, perto do chão, a poeira e as brasas que a asa levanta
    const dist = this.distOuvinte(); const bat = Math.floor((v.psi - Math.PI / 2) / (2 * Math.PI)) !== Math.floor((psiAnt - Math.PI / 2) / (2 * Math.PI));
    if (bat && t > T1 - 0.05 && t < T4) {
      const vol = Math.max(0, Math.min(1, 1.15 - dist / 75)); if (vol > 0.03) ctx.som.tocar('vento', { vol: vol * 0.9, vel: 0.5, var: 0.05 });
      if (alt < 11 * e) { const f = 1 - alt / (11 * e); const yc = this.base.y + 0.3;
        for (let i = 0; i < 26; i++) { const a = rnd(0, 6.283), s = rnd(5, 12) * f; fx.fumo.emitir({ p: new V3(_p.x + Math.cos(a) * rnd(2, 7), yc, _p.z + Math.sin(a) * rnd(2, 7)), v: new V3(Math.cos(a) * s, rnd(0.6, 2.4), Math.sin(a) * s), vida: rnd(1.4, 2.6), t0: 1.2, t1: rnd(4, 6.5), c0: [0.2, 0.17, 0.16], c1: [0.34, 0.31, 0.3], a0: 0.42 * f, a1: 0, q: 1, arr: 1.1, giro: rs(0.6), entra: 0.15 }); }
        for (let i = 0; i < 44; i++) { const a = rnd(0, 6.283), s = rnd(6, 16) * f; fx.luz.emitir({ p: new V3(_p.x + Math.cos(a) * rnd(1, 9), yc, _p.z + Math.sin(a) * rnd(1, 9)), v: new V3(Math.cos(a) * s, rnd(1, 5), Math.sin(a) * s), vida: rnd(0.8, 1.9), t0: rnd(0.1, 0.24), t1: 0.03, c0: [1, 0.7, 0.28], c1: [1, 0.24, 0.04], a0: 1, a1: 0, grav: 3, arr: 0.6, q: 2, vento: 0.3 }); }
        fx.tremor = Math.max(fx.tremor, 0.22 * f * Math.max(0, 1 - dist / 55)); }
    }
    if (!v.pousou && t >= T4 - 0.1) { v.pousou = true; const vol = Math.max(0, Math.min(1, 1.2 - dist / 70)); if (vol > 0.03) ctx.som.tocar('terra', { vol, vel: 0.6, var: 0 }); fx.tremor = Math.max(fx.tremor, 0.5 * Math.max(0, 1 - dist / 60));
      for (let i = 0; i < 40; i++) { const a = rnd(0, 6.283), s = rnd(4, 11); fx.fumo.emitir({ p: new V3(this.x + Math.cos(a) * rnd(3, 8), this.base.y + 0.3, this.z + Math.sin(a) * rnd(3, 8)), v: new V3(Math.cos(a) * s, rnd(0.8, 3), Math.sin(a) * s), vida: rnd(1.6, 3), t0: 1.4, t1: rnd(4.5, 7), c0: [0.2, 0.17, 0.16], c1: [0.34, 0.31, 0.3], a0: 0.45, a1: 0, q: 1, arr: 1.0, giro: rs(0.6), entra: 0.15 }); } }
    if (t >= T5) { this.voo = null; this.estado = 'parado'; this.raiz.rotation.set(0, this.yaw0, 0); this.raiz.position.copy(this.base); this.centro.copy(this.centro0); if (this.rotulo) { this.rotulo.x = this.x; this.rotulo.z = this.z; } this.tVoo = rnd(50, 85); this.tProx = rnd(6, 11); }
  }
  atualizar(dt) {
    const ctx = this.ctx, v = ctx.vfx; this.mixer.update(dt); this.luz.intensity = 0; if (this.voo) { this.atualizarVoo(dt); return; } this.seguirHeroi(dt);
    if (this.estado === 'parado') { this.tVoo -= dt; if (this.tVoo <= 0 && !ctx.demo) { this.voar(); return; } this.tProx -= dt; if (this.tProx <= 0) { this.tProx = rnd(16, 30); if (!ctx.demo) this.agir(Math.random() < 0.55 ? 'rugir' : 'sopro'); } return; }
    this.t += dt; const k = this.t / this.dur;
    if (this.boca && this.cabeca) { this.boca.getWorldPosition(this.pBoca); this.cabeca.getWorldPosition(this.pCab); this.dir.subVectors(this.pBoca, this.pCab); if (this.dir.lengthSq() < 1e-6) this.dir.set(Math.sin(this.raiz.rotation.y), 0.3, Math.cos(this.raiz.rotation.y)); this.dir.normalize(); }
    if (this.estado === 'sopro') { this.dir.y = Math.max(this.dir.y, 0.38); this.dir.normalize(); }   // o fogo sobe um pouco: passa por cima da crista da cratera
    if (this.estado === 'sopro' && k > 0.3 && k < 0.84) {
      // o sopro: línguas de fogo grandes que saem da boca, brasas e fumaça
      const e = this.esc, p = this.pBoca, d = this.dir; const f = Math.sin((k - 0.3) / 0.54 * Math.PI);
      for (let i = 0; i < 9; i++) { const vel = rnd(9, 15) * e / 5; v.luz.emitir({ p: new V3(p.x + rs(0.25 * e / 5), p.y + rs(0.25 * e / 5), p.z + rs(0.25 * e / 5)), v: new V3(d.x * vel + rs(1.6), d.y * vel + rs(1.6) + 1, d.z * vel + rs(1.6)), vida: rnd(0.7, 1.3), t0: 0.8 * e / 5, t1: rnd(3.2, 5) * e / 5, c0: [1, rnd(0.62, 0.86), 0.25], c1: [0.75, 0.13, 0.02], a0: 0.7 * f, a1: 0, q: i % 2 ? 4 : 1, rot: rs(0.6), giro: rs(1.2), arr: 0.9, vento: 0.3 }); }
      for (let i = 0; i < 3; i++) { const vel = rnd(10, 18) * e / 5; v.luz.emitir({ p: p.clone(), v: new V3(d.x * vel + rs(3), d.y * vel + rs(3) + 2, d.z * vel + rs(3)), vida: rnd(0.9, 2), t0: rnd(0.12, 0.3), t1: 0.03, c0: [1, 0.75, 0.3], c1: [1, 0.3, 0.05], a0: 1, a1: 0, grav: 5, q: 2, vento: 0.4 }); }
      if (Math.random() < 0.7) v.fumo.emitir({ p: new V3(p.x + d.x * 5, p.y + d.y * 5 + 1, p.z + d.z * 5), v: new V3(d.x * 5 + rs(1), 2.5 + d.y * 4, d.z * 5 + rs(1)), vida: rnd(2.5, 4.5), t0: 1.6, t1: rnd(5, 8), c0: [0.12, 0.1, 0.09], c1: [0.3, 0.28, 0.27], a0: 0.5 * f, a1: 0, q: 1, giro: rs(0.5), arr: 0.6, entra: 0.2, vento: 0.5 });
      this.luz.position.set(p.x + d.x * 4, p.y + d.y * 4, p.z + d.z * 4); this.luz.intensity = 420 * f * (0.8 + 0.2 * Math.sin(ctx.tempo * 31)); v.tremor = Math.max(v.tremor, 0.12 * f * Math.max(0, 1 - Math.hypot(ctx.heroi.pos.x - this.x, ctx.heroi.pos.z - this.z) / 60));
    }
    if (this.estado === 'rugir' && k > 0.25 && k < 0.7 && Math.random() < dt * 30) { const p = this.pBoca, d = this.dir; v.fumo.emitir({ p: p.clone(), v: new V3(d.x * 9 + rs(2), d.y * 9 + rs(2), d.z * 9 + rs(2)), vida: 0.9, t0: 0.6, t1: 3.5, c0: [0.85, 0.85, 0.9], a0: 0.16, a1: 0, q: 1, arr: 1.5 }); }
    if (k >= 1) { this.estado = 'parado'; this.tocar('parado'); }
  }
}
