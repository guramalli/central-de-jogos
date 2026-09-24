import { Box3, Quaternion, Vector3 } from "three";
import { IMPACTO, ORDEM_TOCS, VINHETA_TOC } from "./tempos.js";

// O JUIZ do Tribunal — animação procedural por OSSO (sem three.js de tela
// aqui: só matemática, pra dar pra testar sem navegador).
//
// O modelo (juiz-v1.glb) vem com esqueleto (24 ossos) e um clipe de 1
// quadro só, que é a própria pose de repouso (diferença < 1°): o clipe é
// ignorado e tudo é gerado aqui, em camadas, por cima da pose de repouso.
//
// EIXOS: todas as rotações são dadas no espaço do MODELO, não no eixo
// local de cada osso (os ossos vieram de um auto-rig, cada um torto de um
// jeito). No modelo: +X = lado ESQUERDO do juiz, +Y = cima, +Z = frente
// (pra câmera). Rotação em X positiva = inclinar/abaixar pra frente;
// em Z positiva = levantar o braço esquerdo de lado (no direito, negativa).
// Conversão: q_local = P⁻¹ · R · P · q0, onde P é a rotação de mundo do PAI
// na pose de repouso e q0 a rotação local de repouso — então o eixo segue o
// pai quando ele também se mexe (inclinar o tronco leva os braços junto).
//
// O MARTELO: no arquivo ele é um pedaço solto da malha, pendurado nos ossos
// do quadril/coxa (não acompanharia a mão). Ao carregar, prenderMartelo()
// acha esse pedaço (o componente mais perto da mão) e passa 100% do peso
// pra mão ESQUERDA do juiz — que, de frente pra câmera, fica à DIREITA de
// quem olha (é a "mão direita" da arte, vista pela tela).

const EIXO_X = new Vector3(1, 0, 0);
const EIXO_Y = new Vector3(0, 1, 0);
const EIXO_Z = new Vector3(0, 0, 1);
const _q = new Quaternion();
const _r = new Quaternion();

const limitar = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = (x) => x * x * (3 - 2 * x);
const rampa = (t, ini, dur) => suave(limitar((t - ini) / dur));
// Sobe em [a, a+sobe], fica, desce até b.
const janela = (t, a, b, sobe = 0.3, desce = 0.4) => rampa(t, a, sobe) * (1 - rampa(t, b - desce, desce));
const DOIS_PI = Math.PI * 2;

// ---------------- martelo na mão ----------------
export function prenderMartelo(cena) {
  cena.updateMatrixWorld(true);
  cena.traverse((o) => {
    if (!o.isSkinnedMesh || !o.geometry.index) return;
    const geo = o.geometry;
    const n = geo.attributes.position.count;
    const iMao = o.skeleton.bones.findIndex((b) => b.name === "LeftHand");
    if (iMao < 0) return;
    const mao = o.skeleton.bones[iMao].getWorldPosition(new Vector3());
    const altura = new Box3().setFromObject(o).getSize(new Vector3()).y || 1;

    // Componentes conectados (juntando vértices repetidos nas costuras de UV).
    const pai = new Int32Array(n);
    for (let i = 0; i < n; i++) pai[i] = i;
    const raiz = (i) => { while (pai[i] !== i) { pai[i] = pai[pai[i]]; i = pai[i]; } return i; };
    const unir = (a, b) => { a = raiz(a); b = raiz(b); if (a !== b) pai[a] = b; };
    const v = new Vector3();
    const dist = new Float32Array(n);
    const passo = altura / 4000;
    const vistos = new Map();
    for (let i = 0; i < n; i++) {
      o.getVertexPosition(i, v).applyMatrix4(o.matrixWorld);
      dist[i] = v.distanceTo(mao);
      const chave = `${Math.round(v.x / passo)},${Math.round(v.y / passo)},${Math.round(v.z / passo)}`;
      const j = vistos.get(chave);
      if (j === undefined) vistos.set(chave, i); else unir(i, j);
    }
    const idx = geo.index;
    for (let k = 0; k < idx.count; k += 3) { unir(idx.getX(k), idx.getX(k + 1)); unir(idx.getX(k), idx.getX(k + 2)); }
    const comps = new Map();
    for (let i = 0; i < n; i++) {
      const r = raiz(i);
      const c = comps.get(r) || { total: 0, perto: Infinity };
      c.total++;
      c.perto = Math.min(c.perto, dist[i]);
      comps.set(r, c);
    }
    // O martelo: não é o corpo (o maior pedaço) e é o pedaço mais perto da
    // mão (o cabo fica a ~0,09 da altura; os pés, a mais de 0,2).
    let escolhido = null;
    for (const [r, c] of comps) {
      if (c.total > n * 0.3 || c.perto > altura * 0.15) continue;
      if (!escolhido || c.perto < escolhido.perto) escolhido = { r, ...c };
    }
    if (!escolhido) return;
    const si = geo.attributes.skinIndex;
    const sw = geo.attributes.skinWeight;
    for (let i = 0; i < n; i++) {
      if (raiz(i) !== escolhido.r) continue;
      si.setXYZW(i, iMao, 0, 0, 0);
      sw.setXYZW(i, 1, 0, 0, 0);
    }
    si.needsUpdate = true;
    sw.needsUpdate = true;
  });
}

// ---------------- ossos ----------------
const NOMES = ["Spine", "Head", "LeftArm", "LeftForeArm", "LeftHand", "RightArm", "RightForeArm"];

function montarOssos(modelo) {
  modelo.updateMatrixWorld(true);
  const raizInv = modelo.getWorldQuaternion(new Quaternion()).invert();
  const ossos = {};
  for (const nome of NOMES) {
    const o = modelo.getObjectByName(nome);
    if (!o?.isBone || !o.parent) continue;
    const P = raizInv.clone().multiply(o.parent.getWorldQuaternion(new Quaternion()));
    ossos[nome] = { o, q0: o.quaternion.clone(), P, Pinv: P.clone().invert() };
  }
  return ossos;
}

// Rotação no espaço do modelo: primeiro em X, depois Y, depois Z.
function girar(osso, x, y, z) {
  if (!osso) return;
  _r.setFromAxisAngle(EIXO_Z, z);
  _q.setFromAxisAngle(EIXO_Y, y); _r.multiply(_q);
  _q.setFromAxisAngle(EIXO_X, x); _r.multiply(_q);
  osso.o.quaternion.copy(osso.Pinv).multiply(_r).multiply(osso.P).multiply(osso.q0);
}

// ---------------- marteladas ----------------
// Cada batida: levanta (até 0,45s), desce rápido (0,11s) e bate no tempo
// `t` exato — é o tempo do "toc" no arquivo de som — e quica de leve.
const QUEDA = 0.11;
const VOLTA = 0.4;
const SOBE_MAX = 0.45;
const QUIQUE = -0.15;
function batidas(tempos, forca = 1) {
  let ant = -Infinity;
  return tempos.map((t) => {
    const sobe = Math.max(0.08, Math.min(SOBE_MAX, t - ant - QUEDA - 0.05));
    ant = t;
    return { t, sobe, h: forca * Math.max(0.3, sobe / SOBE_MAX) };
  });
}
const volta = (b, t) => { const d = t - b.t; return d >= VOLTA ? 0 : QUIQUE * b.h * (1 - suave(limitar(d / VOLTA))); };
function curvaBatidas(bs, t) {
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i];
    if (t > b.t) continue;
    const ini = b.t - QUEDA - b.sobe;
    if (t < ini) return i > 0 ? volta(bs[i - 1], t) : 0;
    const base = i > 0 ? volta(bs[i - 1], ini) : 0;
    if (t < b.t - QUEDA) return base + (b.h - base) * suave((t - ini) / b.sobe);
    const u = (t - (b.t - QUEDA)) / QUEDA;
    return b.h + (QUIQUE * b.h - b.h) * u * u;
  }
  return bs.length ? volta(bs[bs.length - 1], t) : 0;
}
// Tranco no corpo na hora da batida (0..1).
const pancada = (bs, t) => bs.reduce((m, b) => Math.max(m, b.h * limitar(1 - Math.abs(t - b.t - 0.03) / 0.12)), 0);

// Gestos de uma vez só. Os tempos das batidas batem com os sons:
//   vinheta  → tribunal-vinheta.mp3 termina com um "toc" em 3,45s
//   ordem    → tribunal-ordem.mp3: "Ordem no tribunal!" + tocs em 1,70s e 1,97s
//   batida   → martelo-uma.mp3 (toc em 0,1s) tocado 0,3s depois do gesto
//   condena  → batida forte + aponta pro réu; o som do veredito entra na batida
//   absolve  → dá de ombros, aliviado, e concorda com a cabeça
const GESTOS = {
  vinheta: { dur: VINHETA_TOC + 0.75, batidas: batidas([VINHETA_TOC], 1.1), olha: [0.1, VINHETA_TOC - 0.55] },
  ordem: { dur: ORDEM_TOCS[1] + 0.6, batidas: batidas(ORDEM_TOCS) },
  batida: { dur: 1, batidas: batidas([IMPACTO]) },
  condena: { dur: 3.8, batidas: batidas([IMPACTO], 1.25), aponta: [0.62, 3.7] },
  absolve: { dur: 2.6, ombros: [0.05, 1.5], acena: [1.1, 2.5] },
};

// Humores contínuos (a fase do jogo) → alvo dos parâmetros, sempre suavizados.
//   inclina: tronco pra frente (rad) · tilt: cabeça de lado · severo: queixo baixo
//   aceno: concordar devagar · olhar: olhar em volta · tamborila: batidinhas
//   impacientes · balanco: vaivém do corpo · espia: espiadas de vez em quando
const HUMORES = {
  lobby: { inclina: 0, tilt: 0, severo: 0, aceno: 0, olhar: 0, tamborila: 0, balanco: 1, espia: 1 },
  atento: { inclina: 0.05, tilt: 0, severo: 0.3, aceno: 0.35, olhar: 0, tamborila: 0, balanco: 0.3, espia: 1 },
  leitura: { inclina: 0.13, tilt: 0.05, severo: 0, aceno: 1, olhar: 0, tamborila: 0, balanco: 0.1, espia: 0 },
  ouvindo: { inclina: 0.08, tilt: 0.2, severo: 0, aceno: 0.25, olhar: 0, tamborila: 0, balanco: 0.1, espia: 0 },
  votar: { inclina: 0.02, tilt: 0, severo: 0.3, aceno: 0, olhar: 1, tamborila: 1, balanco: 0.2, espia: 0 },
  suspense: { inclina: 0.12, tilt: 0, severo: 0.5, aceno: 0, olhar: 0.35, tamborila: 0.6, balanco: 0, espia: 0 },
  culpado: { inclina: 0.08, tilt: 0, severo: 1, aceno: 0, olhar: 0, tamborila: 0, balanco: 0, espia: 0 },
  inocente: { inclina: -0.03, tilt: -0.1, severo: 0, aceno: 0.3, olhar: 0, tamborila: 0, balanco: 0.6, espia: 0 },
};

export function criarAnimador(modelo) {
  const ossos = montarOssos(modelo);
  let humor = "lobby";
  const atual = { ...HUMORES.lobby };
  let gesto = null; // { def, ini (ms, performance.now) }
  let t = 0;
  let olhada = null;
  let proxOlhada = 2.5 + Math.random() * 2;
  const corpo = { y: 0, giro: 0, inclina: 0, lado: 0, amassa: 0 };

  return {
    humor(h) { humor = HUMORES[h] ? h : "lobby"; },
    gesto(tipo, inicioMs) { gesto = GESTOS[tipo] ? { def: GESTOS[tipo], ini: inicioMs } : null; },
    // estatico: "reduzir movimento" — pose do humor, sem nada periódico nem gesto.
    posar(dt, estatico, agoraMs) {
      const alvo = HUMORES[humor];
      const k = estatico ? 1 : 1 - Math.exp(-dt * 3);
      for (const c in alvo) atual[c] += (alvo[c] - atual[c]) * k;
      t += estatico ? 0 : dt;

      let g = null;
      let tg = 0;
      if (gesto && !estatico) {
        tg = (agoraMs - gesto.ini) / 1000;
        if (tg > gesto.def.dur) gesto = null;
        else if (tg >= 0) g = gesto.def;
      }

      const resp = estatico ? 0 : Math.sin(t * DOIS_PI * 0.28);
      let spX = atual.inclina + 0.012 * resp, spY = 0;
      let hX = atual.severo * 0.1, hY = 0, hZ = atual.tilt;
      let levanta = 0, aponta = 0, ombros = 0, tranco = 0, giro = estatico ? -0.2 : 0;

      if (!estatico) {
        // concorda devagar (a cabeça desce e volta)
        hX += atual.aceno * 0.08 * (0.5 - 0.5 * Math.cos(t * DOIS_PI * 0.42));
        // olha em volta (votação)
        hY += atual.olhar * 0.32 * Math.sin(t * 0.95);
        spY += atual.olhar * 0.06 * Math.sin(t * 0.95 - 0.5);
        // espiadas de lado de vez em quando
        if (atual.espia > 0.5 && !olhada && !g && t >= proxOlhada) olhada = { ini: t, dir: Math.random() < 0.5 ? -1 : 1 };
        if (olhada) {
          const u = (t - olhada.ini) / 1.6;
          if (u >= 1) { olhada = null; proxOlhada = t + 3 + Math.random() * 4; }
          else {
            const f = suave(limitar(u / 0.2)) * (1 - suave(limitar((u - 0.7) / 0.3)));
            hY += olhada.dir * 0.34 * f;
            hZ += olhada.dir * 0.05 * f;
            spY += olhada.dir * 0.07 * f;
          }
        }
        // batidinhas impacientes com o martelo, em surtos
        if (atual.tamborila > 0.01) {
          const surto = janela(t % 2.6, 0, 1.3, 0.15, 0.2);
          levanta += atual.tamborila * 0.17 * Math.pow(Math.max(0, Math.sin(t * DOIS_PI * 2.6)), 2) * surto;
        }
        giro = atual.balanco * 0.12 * Math.sin(t * DOIS_PI * 0.11);
      }

      if (g) {
        if (g.batidas) {
          levanta += curvaBatidas(g.batidas, tg);
          tranco = pancada(g.batidas, tg);
          hX += 0.08 * tranco;
          spX += 0.04 * tranco;
        }
        if (g.aponta) aponta = janela(tg, g.aponta[0], g.aponta[1], 0.28, 0.45);
        if (g.ombros) ombros = janela(tg, g.ombros[0], g.ombros[1], 0.25, 0.45);
        if (g.acena) hX += 0.1 * Math.max(0, Math.sin((tg - g.acena[0]) * DOIS_PI * 1.4)) * janela(tg, g.acena[0], g.acena[1], 0.1, 0.3);
        if (g.olha) {
          const w = janela(tg, g.olha[0], g.olha[1], 0.4, 0.5);
          hY += 0.3 * Math.sin((tg - g.olha[0]) * 2.6) * w;
          spY += 0.05 * Math.sin((tg - g.olha[0]) * 2.6) * w;
        }
      }

      // Tronco (leva cabeça, ombros e braços junto).
      girar(ossos.Spine, spX + 0.05 * aponta, spY - 0.1 * aponta, 0);
      // Cabeça: severa e virada pro lado que aponta; de lado ao dar de ombros.
      girar(ossos.Head, hX + 0.06 * aponta, hY - 0.12 * aponta, hZ + 0.12 * ombros);
      // Braço do martelo (esquerdo do juiz): vai pra frente e sobe de lado;
      // o antebraço dobra pra cima e o punho arma o golpe.
      girar(ossos.LeftArm, -0.5 * levanta, 0, 0.8 * levanta + 0.35 * ombros);
      girar(ossos.LeftForeArm, -0.15 * levanta, 0, 0.9 * levanta + 0.5 * ombros);
      girar(ossos.LeftHand, 0, 0, 0.55 * levanta);
      // Braço livre (direito): aponta pra frente, pro réu; abre ao dar de ombros.
      girar(ossos.RightArm, -1.45 * aponta, 0.45 * aponta, -0.35 * ombros);
      girar(ossos.RightForeArm, -0.15 * aponta, 0, -0.5 * ombros);

      corpo.y = estatico ? 0 : 0.004 * (1 + resp) + 0.015 * ombros;
      corpo.giro = giro;
      corpo.inclina = 0;
      corpo.lado = 0;
      corpo.amassa = 0.05 * tranco;
      return corpo;
    },
  };
}
