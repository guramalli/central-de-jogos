// O que o herói leva: o arco (o modelo, o refino e o brilho do +7, +8 e +9) e as poções.
// Os números, os nomes e as cores são os do jogo (Tools/viking/teste/index.html, só lido):
//   BRILHO_REF ........ a cor de cada refino: +7 dourado, +8 violeta, +9 vermelho-fogo; abaixo de +7 a arma não brilha
//   ARMAS_RARAS ....... a arma rara do arqueiro é o Arco de Chifre; em 3D as raras usam o modelo 2 da classe (3d/armas/arco_2.glb)
//   ARMAS_TIER ........ os nomes dos modelos 0 a 6 (para comparar com ?arco=1 a 6)
//   brilhoArma3d ...... o halo: duas cascas somadas em volta da arma (a de fora na cor forte, a rente na cor clara), pulsando
//   passoArma ......... os pontos de luz que sobem da arma (18 por segundo) e a flecha comum na cor do refino
//   POCOES, encherBalde, drenarBaldes ... a Poção Vermelha (P) dá 300 de vida, que entra aos poucos: a cada 1 s, até 7% da vida máxima
import * as THREE from 'three';

const V3 = THREE.Vector3;
const rnd = (a, b) => a + Math.random() * (b - a);

export const BRILHO_REF = {
  7: { forte: 0xffb21a, claro: 0xfff0c0, nome: 'dourado', quente: [1, 0.78, 0.3] },
  8: { forte: 0xa64dff, claro: 0xecd8ff, nome: 'violeta', quente: [0.78, 0.5, 1] },
  9: { forte: 0xff2a12, claro: 0xffb8a0, nome: 'vermelho-fogo', quente: [1, 0.36, 0.07] },   // (quente: a cor das partículas, mais viva que a clara: com a luz forte do sol a clara saía rosada)
};
const NOMES_ARCO = ['Arco', 'Arco de Cavalgada', 'Arco Bronzeado', 'Arco da Ruína Negra', 'Arco Espinhoso', 'Arco do Unicórnio', 'Arco Asa Gigante'];
// o arco na mão: o raro (Arco de Chifre) +9. ?arco=1..6 troca pelo modelo comum desse número e ?ref=0..9 muda o refino (só para comparar)
export function arcoDaPagina(Q) {
  const n = Q && Q.get('arco'), r = Q && Q.get('ref'); const ref = r !== null && r !== '' && !isNaN(+r) ? Math.max(0, Math.min(9, Math.round(+r))) : 9;
  if (n === '0') return { nome: NOMES_ARCO[0], modelo: null, rara: false, ref };
  if (n && NOMES_ARCO[+n] && +n >= 1) return { nome: NOMES_ARCO[+n], modelo: 'arco_' + (+n), rara: false, ref };
  return { nome: 'Arco de Chifre', modelo: 'arco_2', rara: true, ref };
}

// a Poção Vermelha (P), como no jogo: 300 de vida; do nível 20 a Média (800) e do 45 a Grande (1.200)
export const POCAO = { nome: 'Poção Vermelha (P)', cura: 300, balde: 0.07, tique: 1, inicio: 10, queda: 0.06, quedaHorda: 0.12 };

// troca a peça do arco do herói pela do modelo novo (a malha e o material; o nó, com a animação dele, fica)
export function vestirArco(modelo, gltfArco) {
  const peca = modelo.getObjectByName('peca_arco'); if (!peca || !gltfArco) return peca || null;
  let nova = null; gltfArco.scene.traverse(o => { if (o.isMesh && o.name === 'peca_arco') nova = o; }); if (!nova) return peca;
  peca.geometry = nova.geometry; const m = nova.material; m.roughness = 0.5; m.metalness = 0; m.envMapIntensity = 0.55; if (m.map) m.map.anisotropy = 8; peca.material = m;
  peca.castShadow = true; peca.receiveShadow = true; peca.frustumCulled = false; return peca;
}

// o brilho do refino no arco: as duas cascas, os pontos de luz que sobem e, no +9, as brasas e as línguas de fogo
export class BrilhoArco {
  constructor(ctx, peca, ref) {
    this.ctx = ctx; this.peca = peca; this.ref = ref; this.cor = BRILHO_REF[ref] || null; this.emitidos = 0; this.ac = 0; this.acB = 0; this.acC = 0; this.f = 0; this.ligado = true;
    if (!this.cor || !peca) return;
    const forte = new THREE.Color(this.cor.forte), claro = new THREE.Color(this.cor.claro); this.forte = forte; this.claro = claro;
    // a casca: a malha do arco inflada pela normal, desenhada pelo avesso e somada (aparece só por fora da silhueta);
    // a espessura cresce com a distância, para o halo ter o mesmo tamanho na tela de perto e de longe
    const casca = (cor, esp, forca) => {
      const u = { uCor: { value: cor.clone() }, uEsp: { value: esp }, uF: { value: forca } };
      const m = new THREE.ShaderMaterial({ uniforms: u, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
        vertexShader: 'uniform float uEsp; void main(){ vec4 q = modelViewMatrix * vec4(position, 1.0); float e = uEsp * max(1.0, -q.z); vec4 mv = modelViewMatrix * vec4(position + normalize(normal) * e, 1.0); mv.z -= e * 1.2 + 0.002; gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform vec3 uCor; uniform float uF; void main(){ gl_FragColor = vec4(uCor * uF, 1.0); }' });
      const k = new THREE.Mesh(peca.geometry, m); k.frustumCulled = false; k.castShadow = false; k.receiveShadow = false; k.renderOrder = 9; k.name = 'casca_refino'; peca.add(k); return { k, u };
    };
    this.fora = casca(forte, 0.0032, 1); this.rente = casca(claro, 0.0012, 0.7);
    // a luz do arco no corpo do arqueiro (fraca, sem sombra)
    this.luz = new THREE.PointLight(this.cor.forte, 0, 2.6, 2); this.luz.name = 'luz_refino'; peca.add(this.luz);
    // o eixo comprido do arco (de uma ponta à outra), para espalhar os pontos de luz
    peca.geometry.computeBoundingBox(); const b = peca.geometry.boundingBox, s = b.getSize(new V3()); const eixo = s.x > s.y ? (s.x > s.z ? 'x' : 'z') : (s.y > s.z ? 'y' : 'z');
    this.p0 = b.getCenter(new V3()); this.p1 = this.p0.clone(); this.p0[eixo] = b.min[eixo]; this.p1[eixo] = b.max[eixo]; this.meio = b.getCenter(new V3());
    // pontos da própria malha (para o ponto de luz nascer no arco, e não no ar do meio da curva)
    const pos = peca.geometry.attributes.position; this.amostras = []; const passo = Math.max(1, Math.floor(pos.count / 160)); for (let i = 0; i < pos.count; i += passo) this.amostras.push(new V3(pos.getX(i), pos.getY(i), pos.getZ(i)));
    this._p = new V3();
  }
  // um ponto do arco, no mundo
  ponto() { const a = this.amostras[(Math.random() * this.amostras.length) | 0]; return this._p.copy(a).applyMatrix4(this.peca.matrixWorld).clone(); }
  atualizar(dt, t) {
    if (!this.cor) return; const on = this.ligado && this.peca.visible;
    this.fora.k.visible = this.rente.k.visible = on; if (!on) { this.luz.intensity = 0; return; }
    // o pulso do jogo: 0,8 + 0,14 sen(7t) + 0,06 sen(19t)
    const f = this.f = 0.8 + 0.14 * Math.sin(t * 7) + 0.06 * Math.sin(t * 19);
    this.fora.u.uF.value = 1.5 * f; this.rente.u.uF.value = 1.05 * f; this.fora.u.uEsp.value = 0.0032 * (0.85 + 0.3 * f);
    this.luz.intensity = 1.6 * f;
    const vfx = this.ctx.vfx, F = this.forte, C = this.claro, Q = this.cor.quente; this.peca.updateWorldMatrix(true, false);
    // os pontos de luz subindo do arco: 18 por segundo, a cor forte com 25% de branco
    this.ac += dt * 18; while (this.ac >= 1) { this.ac -= 1; this.emitidos++; const p = this.ponto();
      vfx.luz.emitir({ p, v: new V3(rnd(-0.06, 0.06), rnd(0.45, 0.75), rnd(-0.06, 0.06)), vida: rnd(0.65, 0.95), t0: rnd(0.17, 0.25), t1: 0.05, c0: Q, c1: [F.r, F.g, F.b], a0: 3.6, a1: 0, q: 0, vento: 0.15 }); }
    if (this.ref >= 9) {
      // +9: brasas que sobem balançando e línguas de fogo curtas rentes ao arco
      this.acB += dt * 10; while (this.acB >= 1) { this.acB -= 1; this.emitidos++; const p = this.ponto();
        vfx.luz.emitir({ p, v: new V3(rnd(-0.25, 0.25), rnd(0.5, 1.1), rnd(-0.25, 0.25)), vida: rnd(0.7, 1.3), t0: rnd(0.08, 0.12), t1: 0.03, c0: [1, 0.62, 0.3], c1: [F.r, F.g * 0.6, F.b * 0.6], a0: 10, a1: 0, q: 2, grav: -0.35, arr: 0.8, vento: 0.5, giro: rnd(-3, 3) }); }
      this.acC += dt * 8; while (this.acC >= 1) { this.acC -= 1; this.emitidos++; const p = this.ponto();
        vfx.luz.emitir({ p, v: new V3(rnd(-0.05, 0.05), rnd(0.3, 0.55), rnd(-0.05, 0.05)), vida: rnd(0.24, 0.38), t0: rnd(0.26, 0.36), t1: 0.1, c0: [Q[0], Q[1] * 1.4, Q[2] * 2], c1: [F.r, F.g, F.b], a0: 2.6, a1: 0, q: 4, rot: rnd(-0.3, 0.3), arr: 0.5, vento: 0.2 }); }
    } else if (this.ref === 8) {
      // +8: estrelinhas que piscam
      this.acB += dt * 4; while (this.acB >= 1) { this.acB -= 1; this.emitidos++; const p = this.ponto();
        vfx.luz.emitir({ p, v: new V3(0, 0.1, 0), vida: rnd(0.28, 0.42), t0: 0.08, t1: 0.26, c0: [C.r, C.g, C.b], c1: [F.r, F.g, F.b], a0: 7, a1: 0, q: 2, giro: 2.5 }); }
    }
  }
}
