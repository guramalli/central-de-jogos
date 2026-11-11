// Os personagens: o Arqueiro (com as 5 skills), os lobos (IA simples) e os moradores.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import * as M from './mapa.js';
import { piso } from './natureza.js';

const V3 = THREE.Vector3; const PI = Math.PI;
const rnd = (a, b) => a + Math.random() * (b - a);
const angDif = (a, b) => { let d = (b - a) % (2 * PI); if (d > PI) d -= 2 * PI; if (d < -PI) d += 2 * PI; return d; };

export async function carregarModelos(ctx, progresso) {
  const loader = new GLTFLoader(); const nomes = ['arqueiro', 'lobo', 'lobo_alfa', 'bjorn', 'hilda', 'ferreiro', 'guarda', 'guardia', 'armazem', 'dragao']; ctx.gltf = {};
  const tl = new THREE.TextureLoader(); const tex = async (u) => { const t = await tl.loadAsync(u); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; progresso(); return t; };
  const [t4, tArco] = await Promise.all([tex('assets/texturas/arqueiro_4k.jpg'), tex('assets/texturas/arco_2k.jpg'), ...nomes.map(async n => { ctx.gltf[n] = await loader.loadAsync('assets/modelos/' + n + '.glb'); progresso(); }),
    loader.loadAsync('assets/modelos/estatua_imugi.glb').then(g => { ctx.gltf.estatua_imugi = g; progresso(); })]);
  for (const n of nomes) ctx.gltf[n].scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; const m = o.material; m.roughness = 0.78; m.metalness = 0; m.envMapIntensity = 0.55; if (m.name === 'ArqueiroDesenho') m.map = t4; if (m.name === 'ArcoDesenho') { m.map = tArco; m.roughness = 0.5; } } });
}

// a hora em que a flecha sai da corda: a peça da flecha some na animação
function tempoSolta(clip, padrao) {
  const tr = clip.tracks.find(t => t.name === 'peca_flecha.scale'); if (!tr) return padrao; let viu = false;
  for (let i = 0; i < tr.times.length; i++) { const s = tr.values[i * 3]; if (s > 0.5) viu = true; else if (viu) return tr.times[Math.max(0, i - 1)] + 0.02; } return padrao;
}

export const SKILLS = [
  { id: 'venenosa', nome: 'Flecha Venenosa', tecla: '1', recarga: 22, mana: 128, alcance: 11, desc: 'Envenena o alvo e pode atordoar.' },
  { id: 'fogo', nome: 'Flecha de Fogo', tecla: '2', recarga: 25, mana: 121, alcance: 12, desc: 'Segura a corda até a ponta pegar fogo. Explode em área e deixa o alvo queimando.' },
  { id: 'concentrado', nome: 'Tiro Concentrado', tecla: '3', recarga: 18, mana: 111, alcance: 11, desc: '5 flechas seguidas no alvo.' },
  { id: 'chuva', nome: 'Chuva de Flechas', tecla: '4', recarga: 35, mana: 101, alcance: 13, desc: 'Mire no chão e clique: 24 flechas caem num círculo de 3,2 m.' },
  { id: 'passos', nome: 'Passos Leves', tecla: '5', recarga: 30, mana: 52, alcance: 0, desc: 'Por 20 s, anda e corre 45% mais rápido.' },
];

export class Heroi {
  constructor(ctx) {
    this.ctx = ctx; const g = ctx.gltf.arqueiro; this.raiz = new THREE.Group(); this.modelo = g.scene; this.raiz.add(this.modelo); ctx.cena.add(this.raiz);
    this.mixer = new THREE.AnimationMixer(this.modelo); this.acoes = {}; for (const c of g.animations) this.acoes[c.name] = this.mixer.clipAction(c);
    this.tSolta = { atirar: tempoSolta(g.animations.find(c => c.name === 'atirar'), 0.86), chuva: tempoSolta(g.animations.find(c => c.name === 'chuva'), 0.86), certeiro: tempoSolta(g.animations.find(c => c.name === 'certeiro'), 1.76) };
    this.noFlecha = this.modelo.getObjectByName('peca_flecha');
    this.pos = new V3(M.NASCER.x, 0, M.NASCER.z); this.pos.y = piso(this.pos.x, this.pos.z); this.rot = PI; this.raiz.position.copy(this.pos); this.raiz.rotation.y = this.rot;
    this.nivel = 12; this.vidaMax = 2400; this.vida = 2400; this.manaMax = 900; this.mana = 900; this.xp = 0; this.xpProx = 900; this.yang = 0;
    this.atk = 75; this.dex = 40; this.str = 14; this.k = 0.55;
    this.velBase = 5.0; this.rota = null; this.alvo = null; this.auto = false; this.acao = null; this.morto = false; this.tMorto = 0;
    this.recargas = SKILLS.map(() => 0); this.buffPassos = 0; this.mirando = false; this.teclas = { x: 0, z: 0 }; this.tPasso = 0; this.tFantasma = 0; this.tRepath = 0; this.emCombate = 0; this.animAtual = '';
    this.tocar('parado');
    // os vultos dos Passos Leves: cópias da malha, congeladas na pose
    this.vultos = []; const mv = new THREE.MeshBasicMaterial({ color: 0x8fd8ff, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending });
    for (let i = 0; i < 6; i++) { const c = SkeletonUtils.clone(this.modelo); c.traverse(o => { if (o.isMesh) { o.material = mv.clone(); o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; } }); const gp = new THREE.Group(); gp.add(c); gp.visible = false; ctx.cena.add(gp); const ossos = []; c.traverse(o => { if (o.isBone || o.name.startsWith('peca_')) ossos.push(o); }); this.vultos.push({ gp, c, ossos, t: 1 }); }
    this.ossosModelo = new Map(); this.modelo.traverse(o => { if (o.isBone || o.name.startsWith('peca_')) this.ossosModelo.set(o.name, o); });
  }
  tocar(nome, { vel = 1, uma = false, fade = 0.14, reinicia = false } = {}) {
    const a = this.acoes[nome]; if (!a) return; if (this.animAtual === nome && !reinicia) { a.timeScale = vel; return a; }
    const ant = this.acoes[this.animAtual]; a.reset(); a.timeScale = vel; a.setLoop(uma ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = uma; a.enabled = true; a.setEffectiveWeight(1); a.play();
    if (ant && ant !== a) a.crossFadeFrom(ant, fade, false); else a.fadeIn(fade * 0.5); this.animAtual = nome; return a;
  }
  get vel() { return this.velBase * (this.buffPassos > 0 ? 1.45 : 1); }
  peito(v) { return v.set(this.pos.x, this.pos.y + 1.1, this.pos.z); }
  frente() { return new V3(Math.sin(this.rot), 0, Math.cos(this.rot)); }
  pontaFlecha() { const p = new V3(); if (this.noFlecha) { this.noFlecha.getWorldPosition(p); if (p.distanceTo(this.pos) < 3 && p.y > this.pos.y + 0.5) return p.addScaledVector(this.frente(), 0.45); } return p.copy(this.pos).addScaledVector(this.frente(), 0.7).setY(this.pos.y + 1.42); }
  irPara(x, z, manterAlvo = false) {
    if (this.morto) return; if (!manterAlvo) { this.auto = false; }
    if (this.acao && !this.acao.solto) this.cancelarAcao(); else if (this.acao) this.acao = null;
    const r = M.caminho(this.pos.x, this.pos.z, x, z); this.rota = r; this.destino = r && r.length ? r[r.length - 1] : null;
  }
  parar() { this.rota = null; }
  cancelarAcao() { if (this.acao && this.acao.aoCancelar) this.acao.aoCancelar(); this.acao = null; }
  atacar(alvo) { if (this.morto || !alvo || alvo.morto) return; this.alvo = alvo; this.auto = true; this.tRepath = 0; }

  // ----- dano (as fórmulas seguem as do jogo) -----
  danoNormal() { const c = Math.random() < 0.12; return { v: Math.round(rnd(62, 88) * (c ? 2 : 1)), critico: c }; }
  danoSkill(id) {
    const a = this.atk, k = this.k; let v = 0;
    if (id === 'venenosa') v = a + (1.5 * a + rnd(100, 200) + 6 * this.dex + 2 * this.str) * k;
    else if (id === 'fogo') v = 1.5 * a + (2.8 * a + rnd(100, 300)) * k;
    else if (id === 'concentrado') v = (a + 0.3 * a * 5 + (0.8 * a + 8 * this.dex) * k) / 5 * rnd(0.9, 1.1);
    else if (id === 'chuva') v = (a + (1.9 * a + 2 * this.dex + 2 * this.str) * k) / 4 * rnd(0.85, 1.15);
    return Math.round(v);
  }

  // ----- as ações de tiro -----
  iniciarAcao(tipo, alvo, ponto) {
    const ctx = this.ctx, som = ctx.som; this.rota = null;
    const anim = tipo === 'fogo' ? 'certeiro' : tipo === 'chuva' ? 'chuva' : 'atirar'; const vel = tipo === 'normal' ? 1.3 : tipo === 'concentrado' ? 1.35 : tipo === 'fogo' ? 1.1 : 1.15;
    const clip = this.acoes[anim].getClip(); this.tocar(anim, { vel, uma: true, reinicia: true, fade: 0.1 });
    const a = this.acao = { tipo, alvo, ponto, t: 0, vel, tSolta: this.tSolta[anim] ?? 0.86, dur: clip.duration, solto: false, seq: 0 };
    som.tocar('flecha_saca', { vol: 0.6, pos: this.pos }); som.tocar('arco_puxa', { vol: tipo === 'normal' ? 0.5 : 0.85, pos: this.pos, atraso: 0.22 / vel });
    if (tipo === 'fogo') { a.luz = ctx.vfx.clarao(this.pontaFlecha(), 0xff7a20, 0, 3, 9); som.tocar('magia_fogo', { vol: 0.8, atraso: 0.45 }); }
    if (tipo === 'venenosa') som.tocar('veneno', { vol: 0.5, atraso: 0.3 });
    if (tipo !== 'normal') som.voz(tipo, ctx.vozSempre);
  }
  soltar(a) {
    const ctx = this.ctx, vfx = ctx.vfx, som = ctx.som; const de = this.pontaFlecha(); const self = this;
    const alvoVivo = a.alvo && !a.alvo.morto ? a.alvo : null; const dir = this.frente();
    if (a.tipo === 'normal') {
      som.tocar('arco', { pos: this.pos }); const d = this.danoNormal();
      vfx.flecha({ de, alvo: alvoVivo, dir, queda: alvoVivo ? 0 : 0.25, tipo: 'normal', aoAcertar: (p, ok) => { if (ok) { alvoVivo.receber(d.v, { critico: d.critico }); vfx.impactoFlecha(p, 'normal'); som.tocar('flecha_acerta', { pos: p, vol: 0.8 }); } else { vfx.poeira(p, 3); som.tocar('flecha_acerta', { pos: p, vol: 0.4 }); } } });
    } else if (a.tipo === 'venenosa') {
      som.tocar('disparo_veneno', { pos: this.pos }); som.tocar('arco', { pos: this.pos, vol: 0.7 }); const dano = this.danoSkill('venenosa');
      vfx.flecha({ de, alvo: alvoVivo, dir, queda: alvoVivo ? 0 : 0.2, tipo: 'veneno', vel: 30, esc: 1.3, aoAcertar: (p, ok) => {
        som.tocar('veneno', { pos: p }); som.tocar('flecha_acerta', { pos: p, vol: 0.7 }); vfx.nuvemVeneno(new V3(p.x, piso(p.x, p.z), p.z), 2.2);
        for (const l of ctx.inimigos()) { if (l.morto) continue; const dd = Math.hypot(l.pos.x - p.x, l.pos.z - p.z); if (l === alvoVivo) { l.receber(dano, { skill: true }); l.envenenar(8, 46); if (Math.random() < 0.4) l.atordoar(2.6); } else if (dd < 2.2) { l.receber(Math.round(dano * 0.35), { skill: true }); l.envenenar(6, 46); } }
      } });
    } else if (a.tipo === 'fogo') {
      som.tocar('disparo_fogo', { pos: this.pos }); som.tocar('arco', { pos: this.pos, vol: 0.8 }); const dano = this.danoSkill('fogo'); if (a.luz) { a.luz.vida = 0; a.luz = null; }
      const f = vfx.flecha({ de, alvo: alvoVivo, dir, queda: alvoVivo ? 0 : 0.15, tipo: 'fogo', vel: 28, esc: 1.4, aoAcertar: (p) => {
        const ch = new V3(p.x, piso(p.x, p.z), p.z); vfx.explosaoFogo(ch, 3); som.tocar('furia_explosao', { pos: p, vol: 1 }); som.tocar('meteoro', { pos: p, vol: 0.7 });
        for (const l of ctx.inimigos()) { if (l.morto) continue; const dd = Math.hypot(l.pos.x - p.x, l.pos.z - p.z); if (l === alvoVivo) { l.receber(dano, { skill: true, critico: true }); l.queimar(5, 38); } else if (dd < 3.2) { l.receber(Math.round(dano * 0.7), { skill: true }); l.queimar(4, 38); } }
      } });
      vfx.clarao(de, 0xff8a30, 34, 1.2, 10, f.pos);
    } else if (a.tipo === 'concentrado') {
      a.seq = 1; a.proxima = 0; a.dano = () => this.danoSkill('concentrado'); this.dispararConcentrado(a);
    } else if (a.tipo === 'chuva') {
      som.tocar('arco', { pos: this.pos }); som.tocar('vento', { pos: this.pos, vol: 0.7 });
      for (let i = 0; i < 5; i++) vfx.flecha({ de: de.clone().add(new V3(rnd(-0.15, 0.15), 0, rnd(-0.15, 0.15))), dir: new V3(dir.x * 0.28 + rnd(-0.06, 0.06), 1, dir.z * 0.28 + rnd(-0.06, 0.06)), tipo: 'chuva', vel: 34, vidaMax: 0.55, fincar: false });
      const c = a.ponto.clone(); const R = 3.2; vfx.anel(c.x, c.z, R * 0.3, R, 0.5, 0xbfe0ff); vfx.anel(c.x, c.z, R * 0.2, R, 0.6, 0x9fd0ff, 0.45); vfx.anel(c.x, c.z, R * 0.2, R, 0.6, 0x9fd0ff, 0.9); vfx.coluna(new V3(c.x, piso(c.x, c.z), c.z), 0xbfe0ff, R * 0.9, 13, 2.3, 0.3);
      ctx.agendar(0.75, () => { som.tocar('vento', { pos: c, vol: 0.9 }); });
      for (let i = 0; i < 24; i++) {
        const rr = R * Math.pow(Math.random(), 0.85) * (i < 6 ? 0.35 : 1), an = Math.random() * 2 * PI; const tx = c.x + Math.cos(an) * rr, tz = c.z + Math.sin(an) * rr;
        ctx.agendar(0.85 + i * 0.045 + Math.random() * 0.05, () => {
          const alvoP = new V3(tx, piso(tx, tz), tz); const dq = new V3(dir.x * 0.22, -1, dir.z * 0.22).normalize(); const deQ = alvoP.clone().addScaledVector(dq, -17);
          vfx.flecha({ de: deQ, ponto: alvoP, dir: dq, tipo: 'chuva', vel: 42, queda: 0.0001, fincar: true, aoAcertar: (p) => {
            vfx.poeira(p, 3); vfx.faiscas(new V3(p.x, p.y + 0.1, p.z), [0.85, 0.92, 1], 4, 2.5); vfx.fumo.emitir({ p: new V3(p.x, p.y + 0.06, p.z), vida: 0.3, t0: 0.15, t1: 0.95, c0: [0.85, 0.9, 1], a0: 0.6, a1: 0, q: 5, rot: 0, entra: 0.02 }); if (i % 3 === 0) som.tocar('flecha_acerta', { pos: p, vol: 0.55 });
            for (const l of ctx.inimigos()) { if (l.morto) continue; if (Math.hypot(l.pos.x - p.x, l.pos.z - p.z) < (l.ehPedra ? l.raio * 0.9 : 1.0)) l.receber(this.danoSkill('chuva'), { skill: true }); }
          } });
        });
      }
    }
  }
  dispararConcentrado(a) {
    const ctx = this.ctx; const alvoVivo = a.alvo && !a.alvo.morto ? a.alvo : null; const de = this.pontaFlecha().add(new V3(rnd(-0.08, 0.08), rnd(-0.08, 0.08), 0)); const ultimo = a.seq === 5;
    ctx.som.tocar('arco', { pos: this.pos, vel: 0.95 + a.seq * 0.05, vol: 0.9 }); const dano = a.dano();
    ctx.vfx.flecha({ de, alvo: alvoVivo, dir: this.frente(), queda: alvoVivo ? 0 : 0.1, tipo: 'concentrado', vel: 44, esc: ultimo ? 1.4 : 1.15, aoAcertar: (p, ok) => { ctx.vfx.impactoFlecha(p, 'concentrado'); ctx.som.tocar('flecha_acerta', { pos: p, vol: 0.75 }); if (ok) { alvoVivo.receber(ultimo ? Math.round(dano * 1.5) : dano, { skill: true, critico: ultimo }); if (ultimo) { ctx.vfx.anel(p.x, p.z, 0.2, 1.8, 0.35, 0xffd27a); ctx.vfx.tremor = Math.max(ctx.vfx.tremor, 0.2); } } } });
    ctx.vfx.luz.emitir({ p: de, vida: 0.12, t0: 0.5, t1: 1.1, c0: [1, 0.85, 0.5], a0: 0.8, a1: 0, q: 2 }); ctx.vfx.luz.emitir({ p: de, vida: 0.2, t0: 0.2, t1: 1.3, c0: [1, 0.85, 0.5], a0: 0.9, a1: 0, q: 5, rot: 0 });
  }

  usarSkill(i, pontoMira = null) {
    const ctx = this.ctx, s = SKILLS[i]; if (this.morto) return false;
    if (this.recargas[i] > 0) { ctx.hud.aviso(`${s.nome}: em recarga (${Math.ceil(this.recargas[i])} s)`); ctx.som.tocar('ui_negar', { vol: 0.5 }); return false; }
    if (this.mana < s.mana) { ctx.hud.aviso('Mana insuficiente'); ctx.som.tocar('ui_negar', { vol: 0.5 }); return false; }
    if (s.id === 'passos') {
      this.gastar(i); this.buffPassos = 20; ctx.vfx.rajada(this.pos, this); ctx.som.tocar('vortice', { pos: this.pos }); ctx.som.tocar('magia_buff', { pos: this.pos, vol: 0.7 }); ctx.som.voz('passos', ctx.vozSempre); return true;
    }
    if (s.id === 'chuva') {
      if (!pontoMira) { this.mirando = !this.mirando; return false; }
      const d = Math.hypot(pontoMira.x - this.pos.x, pontoMira.z - this.pos.z); const p = pontoMira.clone(); if (d > s.alcance) { p.x = this.pos.x + (p.x - this.pos.x) * s.alcance / d; p.z = this.pos.z + (p.z - this.pos.z) * s.alcance / d; p.y = piso(p.x, p.z); }
      this.mirando = false; this.gastar(i); if (this.acao) this.cancelarAcao(); this.virarPara(p.x, p.z, true); this.iniciarAcao('chuva', null, p); return true;
    }
    let alvo = this.alvo && !this.alvo.morto ? this.alvo : ctx.inimigoMaisPerto(this.pos, s.alcance + 4);
    if (!alvo) { ctx.hud.aviso('Sem alvo: clique num lobo'); ctx.som.tocar('ui_negar', { vol: 0.5 }); return false; }
    const d = Math.hypot(alvo.pos.x - this.pos.x, alvo.pos.z - this.pos.z); if (d > s.alcance + 4) { ctx.hud.aviso('Alvo longe demais'); return false; }
    this.alvo = alvo; this.auto = true; this.gastar(i); if (this.acao) this.cancelarAcao(); this.virarPara(alvo.pos.x, alvo.pos.z, true); this.iniciarAcao(s.id, alvo, null); return true;
  }
  gastar(i) { this.recargas[i] = SKILLS[i].recarga * (this.ctx.recargaCurta ? 0.25 : 1); this.mana -= SKILLS[i].mana; this.emCombate = 6; }
  virarPara(x, z, ja = false) { const a = Math.atan2(x - this.pos.x, z - this.pos.z); if (ja) this.rot = a; else this.rotAlvo = a; return a; }

  receber(dano, de) {
    if (this.morto) return; this.vida -= dano; this.emCombate = 6; this.ctx.hud.numero(this.peito(new V3()), dano, 'heroi'); this.ctx.som.tocar('grunhido', { vol: 0.7 }); this.ctx.vfx.faiscas(this.peito(new V3()), [0.9, 0.1, 0.08], 6, 2.2);
    if (!this.acao || this.acao.tipo === 'normal') { if (!this.acao && !this.rota) this.tocar('dano', { uma: true, reinicia: true, fade: 0.06 }); this.tDano = 0.3; }
    if (!this.alvo || this.alvo.morto) { this.alvo = de; }
    if (this.vida <= 0) { this.vida = 0; this.morto = true; this.tMorto = 0; this.acao = null; this.rota = null; this.auto = false; this.mirando = false; this.tocar('morte', { uma: true, reinicia: true }); this.ctx.som.tocar('morte_jogador'); this.ctx.hud.aviso('Você caiu. Renascendo na vila em 5 s...', 5); }
  }
  ganharXp(n, yang) {
    this.xp += n; this.yang += yang; if (this.xp >= this.xpProx) { this.xp -= this.xpProx; this.xpProx = Math.round(this.xpProx * 1.35); this.nivel++; this.vidaMax += 120; this.manaMax += 40; this.vida = this.vidaMax; this.mana = this.manaMax; this.atk += 4; this.dex += 2; this.ctx.vfx.subirNivel(this.pos); this.ctx.som.tocar('nivel'); this.ctx.hud.titulo(`Nível ${this.nivel}`, 'Você ficou mais forte'); }
  }

  atualizar(dt) {
    const ctx = this.ctx; this.mixer.update(dt);
    if (this.riscos && (this.buffPassos <= 0 || this.morto || (!this.rota && Math.hypot(this.teclas.x, this.teclas.z) < 0.1))) { for (const r of this.riscos) if (r) r.soltar(); this.riscos = null; }
    for (let i = 0; i < this.recargas.length; i++) this.recargas[i] = Math.max(0, this.recargas[i] - dt);
    if (this.buffPassos > 0) this.buffPassos = Math.max(0, this.buffPassos - dt);
    this.emCombate = Math.max(0, this.emCombate - dt);
    for (const v of this.vultos) { if (v.t < 1) { v.t += dt / 0.42; const k = Math.max(0, 1 - v.t); v.c.traverse(o => { if (o.isMesh) o.material.opacity = 0.34 * k; }); if (v.t >= 1) v.gp.visible = false; } }
    if (this.morto) { this.tMorto += dt; if (this.tMorto > 5) this.renascer(); this.raiz.position.copy(this.pos); return; }
    this.mana = Math.min(this.manaMax, this.mana + (this.emCombate > 0 ? 9 : 26) * dt); if (this.emCombate <= 0) this.vida = Math.min(this.vidaMax, this.vida + this.vidaMax * 0.035 * dt);
    if (this.alvo && this.alvo.morto) { this.alvo = null; if (this.auto) { const prox = ctx.loboMaisPerto(this.pos, 9, true); if (prox) this.alvo = prox; else this.auto = false; } }
    let movendo = false; const tecl = Math.hypot(this.teclas.x, this.teclas.z) > 0.1;
    // a ação em curso
    if (this.acao) {
      const a = this.acao; a.t += dt * a.vel; if (a.alvo && !a.alvo.morto) this.virarPara(a.alvo.pos.x, a.alvo.pos.z); else if (a.ponto) this.virarPara(a.ponto.x, a.ponto.z);
      if (a.tipo === 'fogo' && !a.solto) { const k = Math.min(1, a.t / a.tSolta); const p = this.pontaFlecha();
        if (!a.anelCarga) { a.anelCarga = true; ctx.vfx.anel(this.pos.x, this.pos.z, 0.3, 1.8, a.tSolta / a.vel, 0xff8a30); }
        { const an = Math.random() * 6.283, el = (Math.random() - 0.5) * 2; const de2 = new V3(p.x + Math.cos(an) * 0.9, p.y + el * 0.6, p.z + Math.sin(an) * 0.9); ctx.vfx.luz.emitir({ p: de2, v: new V3((p.x - de2.x) * 3.2, (p.y - de2.y) * 3.2, (p.z - de2.z) * 3.2), vida: 0.3, t0: 0.12, t1: 0.03, c0: [1, 0.72, 0.3], a0: 0.2 + 0.8 * k, a1: 0, q: 2 }); }
        for (let n = 0; n < 1 + k * 3; n++) ctx.vfx.chama(p, 0.25 + k * 0.75, 0.6 + 0.4 * k); if (a.luz) { a.luz.l.position.copy(p); a.luz.t = 0; a.luz.forca = 0; a.luz.l.intensity = k * 26; a.luz.vida = 1; a.luz.forca = k * 26; } if (Math.random() < k * 0.5) ctx.vfx.luz.emitir({ p, v: new V3(rnd(-1.5, 1.5), rnd(0.5, 2.5), rnd(-1.5, 1.5)), vida: 0.5, t0: 0.07, t1: 0.02, c0: [1, 0.7, 0.3], a0: 1, a1: 0, q: 2 }); }
      if (a.tipo === 'venenosa' && !a.solto && a.t > 0.3) { const p = this.pontaFlecha(); ctx.vfx.luz.emitir({ p: new V3(p.x + rnd(-0.3, 0.3), p.y + rnd(-0.3, 0.3), p.z + rnd(-0.3, 0.3)), v: new V3(0, 0.3, 0), vida: 0.35, t0: 0.16, t1: 0.03, c0: [0.35, 1, 0.25], a0: 0.9, a1: 0, q: 0 }); }
      if (!a.solto && a.t >= a.tSolta) { a.solto = true; this.soltar(a); }
      if (a.tipo === 'concentrado' && a.solto && a.seq < 5) { a.proxima += dt; const ac = this.acoes.atirar; ac.timeScale = 0.12; if (a.proxima >= 0.105) { a.proxima = 0; a.seq++; this.dispararConcentrado(a); if (a.seq >= 5) ac.timeScale = a.vel; } a.t = a.tSolta + 0.01; }
      if (a.t >= a.dur - 0.12) { this.acao = null; }
      if (tecl && (a.solto || a.tipo === 'normal')) this.acao = null;
    }
    if (!this.acao) {
      // o ataque normal automático no alvo
      if (this.auto && this.alvo && !this.alvo.morto && !tecl) {
        const d = Math.hypot(this.alvo.pos.x - this.pos.x, this.alvo.pos.z - this.pos.z);
        if (d <= 9.5 && (!this.rota || d < 8.5)) { this.rota = null; this.virarPara(this.alvo.pos.x, this.alvo.pos.z, d > 0 && Math.abs(angDif(this.rot, Math.atan2(this.alvo.pos.x - this.pos.x, this.alvo.pos.z - this.pos.z))) < 0.5); this.iniciarAcao('normal', this.alvo, null); this.emCombate = 6; }
        else if (d > 9.5) { this.tRepath -= dt; if (this.tRepath <= 0 || !this.rota) { this.tRepath = 0.5; this.rota = M.caminho(this.pos.x, this.pos.z, this.alvo.pos.x, this.alvo.pos.z); } }
      }
      // andar: pelas teclas ou pela rota do clique
      let vx = 0, vz = 0;
      if (tecl) { this.rota = null; this.auto = false; const l = Math.hypot(this.teclas.x, this.teclas.z); vx = this.teclas.x / l; vz = this.teclas.z / l; }
      else if (this.rota && this.rota.length) { const [tx, tz] = this.rota[0]; const dx = tx - this.pos.x, dz = tz - this.pos.z; const d = Math.hypot(dx, dz); if (d < 0.22) { this.rota.shift(); if (!this.rota.length) this.rota = null; } else { vx = dx / d; vz = dz / d; } }
      if (vx || vz) {
        movendo = true; const passo = this.vel * dt; let nx = this.pos.x + vx * passo, nz = this.pos.z + vz * passo;
        if (M.bloqueado(nx, nz)) { if (!M.bloqueado(nx, this.pos.z)) nz = this.pos.z; else if (!M.bloqueado(this.pos.x, nz)) nx = this.pos.x; else { nx = this.pos.x; nz = this.pos.z; movendo = false; this.rota = null; } }
        this.pos.x = nx; this.pos.z = nz; this.rotAlvo = Math.atan2(vx, vz);
      }
      if (!this.acao) { if (movendo) this.tocar('correndo', { vel: this.vel / 5.0 * 1.05 }); else if (!(this.tDano > 0)) this.tocar('parado'); }
    }
    this.tDano = Math.max(0, (this.tDano || 0) - dt);
    if (this.rotAlvo !== undefined) { const d = angDif(this.rot, this.rotAlvo); this.rot += d * Math.min(1, dt * 14); }
    const alvoY = piso(this.pos.x, this.pos.z); this.pos.y += (alvoY - this.pos.y) * Math.min(1, dt * 18);
    this.raiz.position.copy(this.pos); this.raiz.rotation.y = this.rot;
    // passos, poeira e os vultos do vento
    if (movendo) {
      this.tPasso -= dt; if (this.tPasso <= 0) { this.tPasso = 0.3 * 5.0 / this.vel; ctx.som.tocar('passo', { vol: 0.35 }); if (!M.dentroRet(this.pos.x, this.pos.z, M.CID)) ctx.vfx.poeira(this.pos, 1, [0.6, 0.52, 0.4], 0.6); }
      if (this.buffPassos > 0) {
        if (!this.riscos) this.riscos = [ctx.vfx.rastro(this.pos, 0xbfe8ff, 0.09, 0.55), ctx.vfx.rastro(this.pos, 0xbfe8ff, 0.09, 0.55)];
        { const lx = Math.cos(this.rot) * 0.2, lz = -Math.sin(this.rot) * 0.2; this.riscos.forEach((r, i) => { if (r) r.mover(new V3(this.pos.x + (i ? lx : -lx), this.pos.y + 0.16 + 0.1 * Math.sin(ctx.tempo * 20 + i * 3.14), this.pos.z + (i ? lz : -lz))); }); }
        this.tFantasma -= dt; if (this.tFantasma <= 0) { this.tFantasma = 0.085; const v = this.vultos.find(v => v.t >= 1) || this.vultos[0]; v.t = 0; v.gp.visible = true; v.gp.position.copy(this.pos); v.gp.rotation.y = this.rot; for (const o of v.ossos) { const s = this.ossosModelo.get(o.name); if (s) { o.position.copy(s.position); o.quaternion.copy(s.quaternion); o.scale.copy(s.scale); } } }
        const f = this.frente(); for (let k = 0; k < 2; k++) ctx.vfx.luz.emitir({ p: new V3(this.pos.x + rnd(-0.3, 0.3), this.pos.y + rnd(0.05, 0.5), this.pos.z + rnd(-0.3, 0.3)), v: new V3(-f.x * 2 + rnd(-0.5, 0.5), rnd(0.2, 1), -f.z * 2 + rnd(-0.5, 0.5)), vida: rnd(0.3, 0.6), t0: rnd(0.2, 0.4), t1: 0.6, c0: [0.7, 0.93, 1], a0: 0.3, a1: 0, q: 0 });
      }
    } else if (this.buffPassos > 0 && Math.random() < dt * 14) { const a = Math.random() * 2 * PI; ctx.vfx.luz.emitir({ p: new V3(this.pos.x + Math.cos(a) * 0.45, this.pos.y + 0.08, this.pos.z + Math.sin(a) * 0.45), v: new V3(Math.cos(a + 1.5) * 1.2, rnd(0.6, 1.4), Math.sin(a + 1.5) * 1.2), vida: 0.6, t0: 0.24, t1: 0.05, c0: [0.7, 0.93, 1], a0: 0.45, a1: 0, q: 0 }); }
  }
  renascer() { this.morto = false; this.vida = this.vidaMax; this.mana = this.manaMax; this.pos.set(M.NASCER.x, 0, M.NASCER.z); this.pos.y = piso(this.pos.x, this.pos.z); this.rot = PI; this.rotAlvo = PI; this.alvo = null; this.animAtual = ''; this.tocar('parado'); this.ctx.vfx.subirNivel(this.pos); this.ctx.som.tocar('magia_buff'); }
}

// ================= os lobos =================
const TIPOS = {
  cao: { nome: 'Cão Selvagem', nivel: 1, vida: 420, dano: [26, 38], xp: 60, yang: 14, esc: 0.86, cor: [1.0, 0.82, 0.62], modelo: 'lobo' },
  lobo: { nome: 'Lobo', nivel: 3, vida: 560, dano: [36, 52], xp: 90, yang: 22, esc: 1.0, cor: [1, 1, 1], modelo: 'lobo' },
  azul: { nome: 'Lobo Azul', nivel: 5, vida: 720, dano: [46, 64], xp: 130, yang: 34, esc: 1.08, cor: [0.62, 0.78, 1.15], modelo: 'lobo' },
  alfa: { nome: 'Lobo Alfa', nivel: 22, vida: 2900, dano: [78, 108], xp: 520, yang: 180, esc: 1.0, cor: [1, 1, 1], modelo: 'lobo_alfa' },
};

export class Lobo {
  constructor(ctx, tipo, x, z, opc = {}) {
    this.ctx = ctx; this.t = TIPOS[tipo]; this.tipo = tipo; const g = ctx.gltf[this.t.modelo];
    this.raiz = new THREE.Group(); this.modelo = SkeletonUtils.clone(g.scene); this.raiz.add(this.modelo); this.raiz.scale.setScalar(this.t.esc); ctx.cena.add(this.raiz);
    this.mats = []; this.modelo.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.setRGB(...this.t.cor); o.material.transparent = false; this.mats.push(o.material); o.castShadow = true; o.frustumCulled = false; } });
    this.mixer = new THREE.AnimationMixer(this.modelo); this.acoes = {}; for (const c of g.animations) this.acoes[c.name] = this.mixer.clipAction(c);
    this.casa = new V3(x, 0, z); this.pos = new V3(x, piso(x, z), z); this.rot = Math.random() * 2 * PI; this.altura = tipo === 'alfa' ? 1.25 : 0.85 * this.t.esc; this.raio = tipo === 'alfa' ? 0.75 : 0.5;
    this.vidaMax = this.t.vida; this.vida = this.vidaMax; this.estado = 'parado'; this.tEstado = rnd(0.5, 3); this.morto = false; this.animAtual = ''; this.tMordida = 0; this.veneno = 0; this.fogo = 0; this.atordoado = 0; this.tTick = 0; this.tFogoTick = 0; this.destino = null; this.viuHeroi = false; this.nome = this.t.nome; this.nivel = this.t.nivel; this.mostrarVida = 0;
    this.horda = !!opc.horda; this.hordaDe = opc.horda || null; this.raioPasseio = this.horda ? 2.4 : 6; this.maldita = null; this.danoMult = 1; this.xpMult = 1; this.tFlash = 0; this.acAura = 0;
    this.tocar('parado'); this.mixer.update(Math.random() * 1.5);
  }
  tocar(nome, { vel = 1, uma = false, fade = 0.15, reinicia = false } = {}) {
    const a = this.acoes[nome]; if (!a) return; if (this.animAtual === nome && !reinicia) { a.timeScale = vel; return a; }
    const ant = this.acoes[this.animAtual]; a.reset(); a.timeScale = vel; a.setLoop(uma ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = uma; a.enabled = true; a.setEffectiveWeight(1); a.play(); if (ant && ant !== a) a.crossFadeFrom(ant, fade, false); this.animAtual = nome; return a;
  }
  peito(v) { return v.set(this.pos.x, this.pos.y + this.altura * 0.62, this.pos.z); }
  mudar(e, t = 0) { this.estado = e; this.tEstado = t; }
  nascer() { this.mudar('nascendo', 0); for (const m of this.mats) { m.opacity = 0; m.transparent = true; } }
  // as trevas da Ghotin: aura negra, +30% de vida, +20% de dano, +25% de EXP (sai quando deixa o raio ou a pedra quebra)
  amaldicoar(pedra) { if (this.maldita) { this.maldita = pedra; return; } this.maldita = pedra; this.vidaMax = Math.round(this.vidaMax * 1.3); this.vida = Math.round(this.vida * 1.3); this.danoMult = 1.2; this.xpMult = 1.25; this.nome = this.t.nome + ' Amaldiçoado'; for (let k = 0; k < 10; k++) this.ctx.vfx.fuligem(this.pos, 0.5, 1); }
  libertar() { if (!this.maldita) return; this.maldita = null; this.vidaMax = this.t.vida; this.vida = Math.min(this.vidaMax, Math.round(this.vida / 1.3)); this.danoMult = 1; this.xpMult = 1; this.nome = this.t.nome; }
  receber(dano, o = {}) {
    if (this.morto) return; this.vida -= dano; this.mostrarVida = 6; this.tFlash = 0.1; const ctx = this.ctx; ctx.hud.numero(this.peito(new V3()), dano, o.critico ? 'critico' : o.veneno ? 'veneno' : o.fogo ? 'fogo' : o.skill ? 'skill' : 'normal');
    ctx.heroi.emCombate = 6;
    if (this.vida <= 0) { this.morrer(); return; }
    if (!o.veneno && !o.fogo) { if (Math.random() < 0.5) ctx.som.tocar('ganido', { pos: this.pos, vol: 0.7 }); if (this.estado !== 'morder' && this.atordoado <= 0) { this.tocar('dano', { uma: true, reinicia: true, fade: 0.05 }); this.tFlinch = 0.28; } }
    if (this.estado === 'parado' || this.estado === 'passear' || this.estado === 'voltar' || this.estado === 'uivar') { this.alertar(true); for (const l of ctx.lobos) if (l !== this && !l.morto && l.pos.distanceTo(this.pos) < 5.5) l.alertar(true); }
  }
  envenenar(t, dps) { this.veneno = Math.max(this.veneno, t); this.venenoDps = dps; }
  queimar(t, dps) { this.fogo = Math.max(this.fogo, t); this.fogoDps = dps; }
  atordoar(t) { this.atordoado = Math.max(this.atordoado, t); this.ctx.hud.numero(this.peito(new V3()), 'Atordoado!', 'texto'); }
  alertar(direto = false) { if (this.morto || this.estado === 'perseguir' || this.estado === 'morder') return; if (!direto && !this.viuHeroi && Math.random() < 0.45) { this.viuHeroi = true; this.mudar('uivar', 1.7); this.tocar('uivar', { uma: true, reinicia: true }); this.ctx.som.tocar('uivo', { pos: this.pos }); } else { this.viuHeroi = true; this.mudar('perseguir'); if (Math.random() < 0.6) this.ctx.som.tocar('rosnado', { pos: this.pos, vol: 0.8 }); } }
  morrer() {
    const ctx = this.ctx; this.morto = true; this.vida = 0; this.mudar('morto', 0); this.tocar('morte', { uma: true, reinicia: true, fade: 0.08 }); ctx.som.tocar('ganido', { pos: this.pos, vel: 0.85 }); this.veneno = this.fogo = this.atordoado = 0;
    const xp = Math.round(this.t.xp * this.xpMult), yang = Math.round(this.t.yang * this.xpMult);
    ctx.heroi.ganharXp(xp, yang); ctx.hud.registro(`Você derrotou <b>${this.nome}</b>: +${xp} XP, +${yang} yang`); ctx.hud.numero(this.peito(new V3()).add(new V3(0, 0.6, 0)), `+${xp} XP`, 'xp');
    ctx.agendar(0.45, () => ctx.vfx.poeira(this.pos, 7, [0.5, 0.45, 0.36], 1.1)); if (this.maldita) for (let k = 0; k < 14; k++) ctx.vfx.fuligem(this.pos, 0.6, 1.2); ctx.som.tocar('moeda', { pos: this.pos, vol: 0.6, atraso: 0.4 }); ctx.estat.abates++;
    for (const m of this.mats) { m.transparent = true; }
  }
  renascer() { this.morto = false; this.vida = this.vidaMax; const a = Math.random() * 2 * PI, d = Math.random() * 2.5; this.pos.set(this.casa.x + Math.cos(a) * d, 0, this.casa.z + Math.sin(a) * d); this.pos.y = piso(this.pos.x, this.pos.z); this.raiz.visible = true; this.viuHeroi = false; this.mostrarVida = 0; this.animAtual = ''; this.tocar('parado'); this.mudar('nascendo', 0); for (const m of this.mats) { m.opacity = 0; m.transparent = true; } }
  andar(tx, tz, vel, dt) {
    const dx = tx - this.pos.x, dz = tz - this.pos.z; const d = Math.hypot(dx, dz); if (d < 0.05) return d; let vx = dx / d, vz = dz / d;
    // afasta dos outros lobos, para não empilhar
    for (const l of this.ctx.lobos) { if (l === this || l.morto) continue; const ex = this.pos.x - l.pos.x, ez = this.pos.z - l.pos.z; const e = Math.hypot(ex, ez); const m = this.raio + l.raio + 0.25; if (e < m && e > 0.001) { vx += ex / e * (m - e) * 2.2; vz += ez / e * (m - e) * 2.2; } }
    const n = Math.hypot(vx, vz) || 1; vx /= n; vz /= n; const passo = Math.min(d, vel * dt); let nx = this.pos.x + vx * passo, nz = this.pos.z + vz * passo;
    if (M.bloqueado(nx, nz)) { if (!M.bloqueado(nx, this.pos.z)) nz = this.pos.z; else if (!M.bloqueado(this.pos.x, nz)) nx = this.pos.x; else { nx = this.pos.x; nz = this.pos.z; } }
    this.pos.x = nx; this.pos.z = nz; this.rotAlvo = Math.atan2(vx, vz); return d;
  }
  atualizar(dt) {
    const ctx = this.ctx, h = ctx.heroi; this.mixer.update(dt); this.tEstado -= dt; this.mostrarVida = Math.max(0, this.mostrarVida - dt); this.tMordida = Math.max(0, this.tMordida - dt); this.tFlinch = Math.max(0, (this.tFlinch || 0) - dt);
    if (this.estado === 'morto') {
      const t = -this.tEstado; if (t > 2.2) { const k = Math.max(0, 1 - (t - 2.2) / 1.4); for (const m of this.mats) m.opacity = k; if (k <= 0) this.raiz.visible = false; }
      if (this.horda) { if (t > 3.8 && !this.remover) { this.remover = true; this.raiz.visible = false; } } else if (t > (ctx.renascerLobos || 18)) this.renascer(); this.raiz.position.copy(this.pos); return;
    }
    if (this.estado === 'nascendo') { const k = Math.min(1, -this.tEstado / 1.2); for (const m of this.mats) m.opacity = k; if (k >= 1) { for (const m of this.mats) { m.transparent = false; m.opacity = 1; } this.mudar('parado', rnd(1, 3)); } this.raiz.position.copy(this.pos); return; }
    // estados de dano contínuo
    if (this.veneno > 0) { this.veneno -= dt; this.tTick -= dt; if (this.tTick <= 0) { this.tTick = 1; this.receber(Math.round(this.venenoDps * rnd(0.85, 1.15)), { veneno: true }); if (this.morto) return; } if (Math.random() < dt * 9) ctx.vfx.luz.emitir({ p: new V3(this.pos.x + rnd(-0.4, 0.4), this.pos.y + rnd(0.2, 0.9), this.pos.z + rnd(-0.4, 0.4)), v: new V3(0, rnd(0.4, 1), 0), vida: 0.8, t0: 0.16, t1: 0.04, c0: [0.35, 1, 0.25], a0: 0.8, a1: 0, q: 0 }); if (Math.random() < dt * 3) ctx.vfx.fumo.emitir({ p: this.peito(new V3()), v: new V3(rnd(-0.2, 0.2), 0.5, rnd(-0.2, 0.2)), vida: 1.2, t0: 0.3, t1: 0.9, c0: [0.2, 0.5, 0.12], a0: 0.35, a1: 0, q: 1 }); }
    if (this.fogo > 0) { this.fogo -= dt; this.tFogoTick -= dt; if (this.tFogoTick <= 0) { this.tFogoTick = 1; this.receber(Math.round(this.fogoDps * rnd(0.85, 1.15)), { fogo: true }); if (this.morto) return; } for (let k = 0; k < 2; k++) if (Math.random() < dt * 40) ctx.vfx.chama(new V3(this.pos.x + rnd(-0.45, 0.45), this.pos.y + rnd(0.3, 0.8), this.pos.z + rnd(-0.45, 0.45)), 0.6); }
    this.tFlash = Math.max(0, this.tFlash - dt); { const f = this.tFlash > 0 ? 0.28 : 0; for (const m of this.mats) m.emissive.setRGB(f, f, f); }
    if (this.maldita) { this.acAura += dt * 17; while (this.acAura > 1) { this.acAura -= 1; ctx.vfx.fuligem(this.pos, 0.45 * this.t.esc, this.altura); } }
    const tinta = this.veneno > 0 ? [0.6, 1.25, 0.55] : this.fogo > 0 ? [1.35, 0.75, 0.5] : this.maldita ? [0.3, 0.27, 0.37] : null; for (const m of this.mats) { if (tinta) m.color.setRGB(this.t.cor[0] * tinta[0], this.t.cor[1] * tinta[1], this.t.cor[2] * tinta[2]); else m.color.setRGB(...this.t.cor); }
    if (this.atordoado > 0) { this.atordoado -= dt; this.tocar('dano', { vel: 0.35 }); if (Math.random() < dt * 10) { const a = ctx.tempo * 5 + Math.random(); ctx.vfx.luz.emitir({ p: new V3(this.pos.x + Math.cos(a) * 0.4, this.pos.y + this.altura + 0.25, this.pos.z + Math.sin(a) * 0.4), vida: 0.5, t0: 0.22, t1: 0.05, c0: [1, 0.95, 0.4], a0: 1, a1: 0, q: 2 }); } this.raiz.position.copy(this.pos); return; }
    const dh = Math.hypot(h.pos.x - this.pos.x, h.pos.z - this.pos.z); const dcasa = Math.hypot(this.casa.x - this.pos.x, this.casa.z - this.pos.z);
    const visao = this.tipo === 'alfa' ? 9 : 7;
    switch (this.estado) {
      case 'parado': if (this.tFlinch <= 0) this.tocar('parado'); if (!h.morto && dh < visao) { this.alertar(); break; } if (this.tEstado <= 0) { if (Math.random() < 0.12) { this.mudar('uivar', 2); this.tocar('uivar', { uma: true, reinicia: true }); ctx.som.tocar('uivo', { pos: this.pos, vol: 0.7 }); } else { const a = Math.random() * 2 * PI, d = rnd(1.2, this.raioPasseio); this.destino = [this.casa.x + Math.cos(a) * d, this.casa.z + Math.sin(a) * d]; this.mudar('passear', rnd(3, 7)); } } break;
      case 'passear': if (!h.morto && dh < visao) { this.alertar(); break; } { const d = this.andar(this.destino[0], this.destino[1], 0.9, dt); this.tocar('andando', { vel: 1 }); if (d < 0.3 || this.tEstado <= 0) this.mudar('parado', rnd(1.5, 5)); } break;
      case 'uivar': if (!h.morto && dh < visao * 1.6) this.rotAlvo = Math.atan2(h.pos.x - this.pos.x, h.pos.z - this.pos.z); if (this.tEstado <= 0) { if (!h.morto && dh < visao * 1.8) { this.mudar('perseguir'); for (const l of ctx.lobos) if (l !== this && !l.morto && l.pos.distanceTo(this.pos) < 8) l.alertar(true); } else this.mudar('parado', rnd(1, 3)); } break;
      case 'perseguir':
        if (h.morto || dcasa > 30 || dh > 26) { this.mudar('voltar'); break; }
        if (dh < 1.75 + this.raio * 0.6) { if (this.tMordida <= 0) { this.mudar('morder', (this.acoes.morder.getClip().duration)); this.tocar('morder', { uma: true, reinicia: true, fade: 0.08 }); this.mordeu = false; ctx.som.tocar('rosnado', { pos: this.pos, vol: 0.5 }); } else { if (this.tFlinch <= 0) this.tocar('parado'); } this.rotAlvo = Math.atan2(h.pos.x - this.pos.x, h.pos.z - this.pos.z); }
        else { this.andar(h.pos.x, h.pos.z, this.tipo === 'alfa' ? 3.9 : 3.4, dt); if (this.tFlinch <= 0) this.tocar('correndo', { vel: 1 }); }
        break;
      case 'morder': this.rotAlvo = Math.atan2(h.pos.x - this.pos.x, h.pos.z - this.pos.z); { const dur = this.acoes.morder.getClip().duration; if (!this.mordeu && this.tEstado <= dur * 0.5) { this.mordeu = true; if (dh < 2.3 + this.raio * 0.6 && !h.morto) { h.receber(Math.round(rnd(this.t.dano[0], this.t.dano[1]) * this.danoMult), this); ctx.som.tocar('mordida', { pos: this.pos }); } } if (this.tEstado <= 0) { this.tMordida = rnd(0.35, 0.7); this.mudar('perseguir'); } } break;
      case 'voltar': { const d = this.andar(this.casa.x, this.casa.z, 2.6, dt); this.tocar('andando', { vel: 1.6 }); this.vida = Math.min(this.vidaMax, this.vida + this.vidaMax * 0.15 * dt); if (!h.morto && dh < visao * 0.8 && dcasa < 20) { this.mudar('perseguir'); break; } if (d < 1) { this.viuHeroi = false; this.mudar('parado', rnd(1, 3)); } } break;
    }
    if (this.rotAlvo !== undefined) this.rot += angDif(this.rot, this.rotAlvo) * Math.min(1, dt * 9);
    const y = piso(this.pos.x, this.pos.z); this.pos.y += (y - this.pos.y) * Math.min(1, dt * 14);
    this.raiz.position.copy(this.pos); this.raiz.rotation.y = this.rot;
    // inclina o corpo conforme o relevo
    const e = 0.5, f = new V3(Math.sin(this.rot), 0, Math.cos(this.rot)); const inc = Math.atan2(piso(this.pos.x - f.x * e, this.pos.z - f.z * e) - piso(this.pos.x + f.x * e, this.pos.z + f.z * e), 2 * e); this.raiz.rotation.order = 'YXZ'; this.raiz.rotation.x += (inc - this.raiz.rotation.x) * Math.min(1, dt * 8);
  }
}

export function criarLobos(ctx) {
  ctx.lobos = []; const c = M.LOBOS;
  const lista = [['alfa', 1, 1], ['lobo', -5, -3.5], ['lobo', 5.5, -6], ['azul', 8, 5], ['cao', -6.5, 6], ['lobo', -11, -9], ['cao', 12, -2], ['azul', -1, 11.5], ['cao', 2, -12.5], ['lobo', -12.5, 3]];
  for (const [t, dx, dz] of lista) ctx.lobos.push(new Lobo(ctx, t, c.x + dx, c.z + dz));
  ctx.pedras = ctx.pedras || [];
  // os inimigos: os lobos e as Pedras Ghotin vivas
  ctx.inimigos = () => ctx.pedras.length ? ctx.lobos.concat(ctx.pedras.filter(p => !p.morto)) : ctx.lobos;
  ctx.inimigoMaisPerto = (p, max = 1e9) => { let m = null, md = max; for (const l of ctx.inimigos()) { if (l.morto) continue; const d = Math.hypot(l.pos.x - p.x, l.pos.z - p.z) - (l.ehPedra ? l.raio : 0); if (d < md) { md = d; m = l; } } return m; };
  ctx.loboMaisPerto = (p, max = 1e9, soBravo = false) => { let m = null, md = max; for (const l of ctx.lobos) { if (l.morto) continue; if (soBravo && l.estado !== 'perseguir' && l.estado !== 'morder') continue; const d = Math.hypot(l.pos.x - p.x, l.pos.z - p.z); if (d < md) { md = d; m = l; } } return m; };
}

// ================= os moradores =================
export function criarMoradores(ctx) {
  ctx.moradores = [];
  for (const n of ctx.npcs) {
    const g = ctx.gltf[n.modelo]; if (!g) continue; const raiz = new THREE.Group(); const m = SkeletonUtils.clone(g.scene); raiz.add(m); raiz.position.set(n.x, piso(n.x, n.z), n.z); raiz.rotation.y = n.rot; ctx.cena.add(raiz);
    const mixer = new THREE.AnimationMixer(m); const clip = g.animations.find(c => c.name === n.anim) || g.animations[0]; const a = mixer.clipAction(clip); a.play(); mixer.update(Math.random() * 3);
    ctx.moradores.push({ ...n, raiz, mixer, clip, tMartelo: 0, alt: 1.9 });
  }
}
export function atualizarMoradores(ctx, dt) {
  const h = ctx.heroi;
  for (const n of ctx.moradores) {
    const d = Math.hypot(n.x - h.pos.x, n.z - h.pos.z); if (d > 60) continue; n.mixer.update(dt);
    if (n.anim === 'martelando') { const t = n.mixer.time % n.clip.duration; if (n.tAnt !== undefined && n.tAnt < n.clip.duration * 0.55 && t >= n.clip.duration * 0.55) { ctx.som.tocar('metal', { pos: { x: n.x, z: n.z }, vol: 0.8 }); if (ctx.bigorna) ctx.vfx.faiscas(new V3(ctx.bigorna.x, ctx.bigorna.y + 0.05, ctx.bigorna.z), [1, 0.7, 0.3], 9, 2.6); } n.tAnt = t; }
    else if (d < 4.5 && n.anim === 'parado') { const a = Math.atan2(h.pos.x - n.x, h.pos.z - n.z); n.raiz.rotation.y += angDif(n.raiz.rotation.y, a) * Math.min(1, dt * 4); } else if (n.anim === 'parado') n.raiz.rotation.y += angDif(n.raiz.rotation.y, n.rot) * Math.min(1, dt * 2);
  }
}
