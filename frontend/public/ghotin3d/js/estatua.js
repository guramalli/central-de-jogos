// A estátua do Imugi (a do centro da praça da Vila 1 no jogo; o modelo é o original do Tripo, em Tools/deco3d/praca/estatua_imugi),
// aqui bem grande, num terraço de pedra na entrada da ilha vulcânica. Os veios ocre da pedra acendem devagar e sobem ciscos dourados em volta dela.
import * as THREE from 'three';
import * as M from './mapa.js';
import { recorte } from './texgen.js';

const V3 = THREE.Vector3; const rnd = (a, b) => a + Math.random() * (b - a);

export class EstatuaImugi {
  constructor(ctx) {
    this.ctx = ctx; const E = M.ESTATUA; const g = ctx.gltf.estatua_imugi; this.nome = 'Estátua do Imugi'; this.titulo = 'A serpente que quer virar dragão';
    this.raiz = g.scene; this.raiz.scale.setScalar(E.alt); this.raiz.rotation.y = E.rot || 0; this.y = E.y + 0.03; this.raiz.position.set(E.x, this.y, E.z); ctx.cena.add(this.raiz);
    this.x = E.x; this.z = E.z; this.alt = E.alt; this.uOuro = { value: 1 };
    this.raiz.traverse(o => {
      if (!o.isMesh) return; o.castShadow = true; o.receiveShadow = true; const m = o.material; m.envMapIntensity = 0.6; m.roughness = 1; m.metalness = 0; m.metalnessMap = null; if (m.normalScale) m.normalScale.set(1.25, 1.25);
      if (m.map) m.map.anisotropy = 8;
      // os veios ocre acendem (a cor do veio vem da própria textura)
      m.onBeforeCompile = (sh) => { sh.uniforms.uOuro = this.uOuro; sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uOuro;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n { vec3 cb=diffuseColor.rgb; float veio=smoothstep(.10,.26,cb.r-cb.b)*smoothstep(.0,.08,cb.r-cb.g*1.02); totalEmissiveRadiance+=vec3(1.,.55,.14)*veio*uOuro; }'); };
      recorte(m);
    });
    this.ac = 0;
  }
  atualizar(dt) {
    const ctx = this.ctx, t = ctx.tempo; this.uOuro.value = 0.55 + 0.35 * Math.sin(t * 0.9) + 0.1 * Math.sin(t * 2.7);
    const h = ctx.heroi; const c = ctx.cam.cine ? ctx.cam.cine.alvo : h.pos; if (Math.hypot(c.x - this.x, c.z - this.z) > 60) return;
    this.ac += dt * 9; while (this.ac > 1) { this.ac -= 1; const a = rnd(0, 6.283), r = rnd(0.12, 0.36) * this.alt;
      ctx.vfx.luz.emitir({ p: new V3(this.x + Math.cos(a) * r, this.y + rnd(0.1, 0.75) * this.alt, this.z + Math.sin(a) * r), v: new V3(rnd(-0.15, 0.15), rnd(0.35, 0.95), rnd(-0.15, 0.15)), vida: rnd(2.2, 4.2), t0: rnd(0.05, 0.11), t1: 0.02, c0: [1, 0.8, 0.36], c1: [1, 0.55, 0.15], a0: 0.9, a1: 0, q: 2, entra: 0.25, vento: 0.25 }); }
  }
}
