import { useEffect, useRef } from "react";
import {
  CanvasTexture,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Box3,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

// O AGENTE IMPOSTOR em 3D (mascote). Este arquivo é o ÚNICO que importa o
// three.js: ele só é baixado pelo import dinâmico de Agente.jsx, então o
// resto do jogo nunca espera por ele.
//
// O modelo não tem esqueleto nem animação: tudo aqui é procedural, mexendo
// no boneco inteiro (posição, giro e escala) conforme o "humor" que a tela
// pede. Os parâmetros mudam suavizados, então a troca de humor não dá tranco.
//
// Nome versionado: trocar o modelo = arquivo novo (agente-v2.glb), e o cache
// do service worker (cache-first) nunca serve um modelo velho.
const URL_MODELO = "/impostor/agente-v1.glb";

// Brilho próprio da textura (fração da cor do mapa usada como emissiva):
// a barra e os olhos já são claros na textura; um pouco de emissão faz eles
// "acenderem" no escuro sem apagar o volume que as luzes dão ao manto.
const BRILHO_PROPRIO = 0.22;

// Humores (o que a tela pede) → alvo dos parâmetros contínuos.
//   bobA/bobF: flutuar (altura e frequência) · inclina: pra frente (rad)
//   balanco: giro lento de um lado pro outro · cursor: segue o mouse
//   tremor: tremedeira nervosa · olhadas: espiadas de lado de vez em quando
const HUMORES = {
  lobby: { bobA: 0.035, bobF: 0.5, inclina: 0, balanco: 0.14, cursor: 1, tremor: 0, olhadas: 0 },
  cartas: { bobA: 0.018, bobF: 0.45, inclina: 0.2, balanco: 0.04, cursor: 0, tremor: 0, olhadas: 0 },
  dicas: { bobA: 0.03, bobF: 0.5, inclina: 0.04, balanco: 0.05, cursor: 0, tremor: 0, olhadas: 1 },
  votacao: { bobA: 0.014, bobF: 1.7, inclina: 0.06, balanco: 0, cursor: 0, tremor: 1, olhadas: 0 },
  festa: { bobA: 0.03, bobF: 0.8, inclina: -0.05, balanco: 0.06, cursor: 0, tremor: 0, olhadas: 0 },
  pego: { bobA: 0.012, bobF: 0.35, inclina: 0.14, balanco: 0, cursor: 0, tremor: 0, olhadas: 0 },
};

// Enquadramento (o boneco é normalizado pra 1 de altura, pés no zero):
// sobra em cima pro pulo da comemoração e dos lados pro giro.
const FOV = 30;
const CENTRO_Y = 0.64;
const MEIA_ALTURA = 0.8;
const MEIA_LARGURA = 0.52;

// ---------------- modelo (baixado e decodificado uma vez só) ----------------
let promessaModelo = null;
function carregarModelo() {
  if (!promessaModelo) {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    promessaModelo = loader.loadAsync(URL_MODELO).then((gltf) => {
      gltf.scene.traverse((o) => {
        if (!o.isMesh || !o.material) return;
        const m = o.material;
        if (m.map && "emissiveMap" in m) {
          m.emissiveMap = m.map;
          m.emissive.set(0xffffff);
          m.emissiveIntensity = BRILHO_PROPRIO;
          m.needsUpdate = true;
        }
      });
      return gltf.scene;
    }).catch((e) => {
      promessaModelo = null; // deixa tentar de novo na próxima montagem
      throw e;
    });
  }
  return promessaModelo;
}

// ---------------- curvas ----------------
const limitar = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = (x) => x * x * (3 - 2 * x);
// Curva por pontos-chave [[u, valor], ...], com transição suave entre eles.
function curva(chaves, u) {
  if (u <= chaves[0][0]) return chaves[0][1];
  for (let i = 1; i < chaves.length; i++) {
    const [u1, v1] = chaves[i];
    if (u <= u1) {
      const [u0, v0] = chaves[i - 1];
      return v0 + (v1 - v0) * suave((u - u0) / (u1 - u0));
    }
  }
  return chaves[chaves.length - 1][1];
}
// Pulinho das cartas (0,7s): agacha, estica e sobe, cai amassando.
const PULINHO = { dur: 0.7, amassa: [[0, 0], [0.16, 0.12], [0.26, -0.1], [0.55, 0], [0.64, 0.1], [0.8, -0.03], [1, 0]], sobe: [0.2, 0.62, 0.12] };
// Comemoração (1,3s): pulo alto com uma volta inteira.
const FESTA = { dur: 1.3, amassa: [[0, 0], [0.15, 0.14], [0.25, -0.12], [0.6, -0.02], [0.72, 0.14], [0.85, -0.04], [1, 0]], sobe: [0.22, 0.72, 0.32] };
const FESTA_INTERVALO = 3.4;
// Pego (2,4s): encolhe na hora, treme, e se recupera — mas fica meio murcho.
const PEGO_DUR = 2.4;
const PEGO_ENCOLHE = [[0, 0], [0.12, 1], [0.65, 1], [1, 0.3]];

function altura([ini, fim, h], u) {
  if (u <= ini || u >= fim) return 0;
  const v = (u - ini) / (fim - ini);
  return h * 4 * v * (1 - v);
}

// Mancha de sombra no chão (textura radial feita no canvas).
function criarSombra() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(0,0,0,0.9)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  const geo = new PlaneGeometry(0.9, 0.5);
  const mat = new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.55 });
  const malha = new Mesh(geo, mat);
  malha.rotation.x = -Math.PI / 2;
  malha.position.y = 0.002;
  return { malha, liberar: () => { geo.dispose(); mat.dispose(); tex.dispose(); } };
}

// humor: lobby | cartas | dicas | votacao | festa | pego
// aoFalhar: sem WebGL, contexto perdido ou modelo que não carregou — quem
// usa esconde o espaço (nunca joga erro pra página).
export default function Agente3D({ humor = "lobby", aoFalhar }) {
  const caixa = useRef(null);
  const humorRef = useRef(humor);
  const aoMudarHumor = useRef(null);
  const falhar = useRef(aoFalhar);
  falhar.current = aoFalhar;

  useEffect(() => {
    humorRef.current = humor;
    aoMudarHumor.current?.(humor);
  }, [humor]);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return undefined;
    let vivo = true;
    let renderer;
    try {
      const grosso = window.matchMedia("(pointer: coarse)").matches;
      renderer = new WebGLRenderer({ alpha: true, antialias: !grosso, powerPreference: "low-power" });
    } catch {
      falhar.current?.();
      return undefined;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const canvas = renderer.domElement;
    canvas.className = "imp-agente-canvas";
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);

    const cena = new Scene();
    const camera = new PerspectiveCamera(FOV, 1, 0.1, 20);

    // Luz: céu frio e fraco + chão avermelhado; luz principal quente de
    // frente/esquerda; contraluz vermelha e âmbar recortando o manto.
    cena.add(new HemisphereLight(0x9aa0c8, 0x3a1419, 1.1));
    const principal = new DirectionalLight(0xfff1e0, 2.1);
    principal.position.set(-1.4, 2.4, 3);
    const contraVermelha = new DirectionalLight(0xff4d3c, 3.2);
    contraVermelha.position.set(1.8, 1.4, -2.4);
    const contraAmbar = new DirectionalLight(0xffb547, 1.6);
    contraAmbar.position.set(-2, 0.8, -2);
    cena.add(principal, contraVermelha, contraAmbar);

    const raiz = new Group();
    raiz.rotation.order = "YXZ"; // gira primeiro; a inclinação segue a frente do boneco
    cena.add(raiz);
    const sombra = criarSombra();
    cena.add(sombra.malha);
    let modelo = null;

    // ---- estado da animação ----
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mouseFino = window.matchMedia("(hover: hover) and (pointer: fine)");
    const atual = { ...(HUMORES[humorRef.current] || HUMORES.lobby) };
    let t = 0;
    let faseBob = 0;
    let encolhe = 0;
    let tremePego = 0;
    let olhar = { x: 0, y: 0 };
    const alvoOlhar = { x: 0, y: 0 };
    let pulo = null; // { tipo: PULINHO|FESTA, ini }
    let pegoIni = -99;
    let proxFesta = 0;
    let olhada = null; // { ini, dir }
    let proxOlhada = 2 + Math.random() * 2;

    function entrarNoHumor(h) {
      if (h === "cartas") pulo = { tipo: PULINHO, ini: t };
      if (h === "festa") { pulo = { tipo: FESTA, ini: t + 0.15 }; proxFesta = t + 0.15 + FESTA_INTERVALO; }
      if (h === "pego") pegoIni = t;
      if (h === "dicas") proxOlhada = t + 1.5 + Math.random() * 2;
    }
    entrarNoHumor(humorRef.current);

    function posar(dt, estatico) {
      const h = humorRef.current;
      const alvo = HUMORES[h] || HUMORES.lobby;
      const k = estatico ? 1 : 1 - Math.exp(-dt * 3.5);
      for (const chave in alvo) atual[chave] += (alvo[chave] - atual[chave]) * k;

      let y = 0, x = 0, giro = 0, inclina = atual.inclina, lado = 0, amassa = 0;
      if (!estatico) {
        faseBob += dt * Math.PI * 2 * atual.bobF;
        y += atual.bobA * (1 + Math.sin(faseBob)) * 0.5;
        giro += atual.balanco * Math.sin(t * Math.PI * 2 * 0.13);

        // olha pro cursor (lobby, computador)
        const kOlhar = 1 - Math.exp(-dt * 3);
        olhar = { x: olhar.x + (alvoOlhar.x - olhar.x) * kOlhar, y: olhar.y + (alvoOlhar.y - olhar.y) * kOlhar };
        giro += olhar.x * 0.4 * atual.cursor;
        inclina += olhar.y * 0.12 * atual.cursor;

        // espiadas de lado (dicas)
        if (h === "dicas" && !olhada && t >= proxOlhada) olhada = { ini: t, dir: Math.random() < 0.5 ? -1 : 1 };
        if (olhada) {
          const u = (t - olhada.ini) / 1.4;
          if (u >= 1) { olhada = null; proxOlhada = t + 2.5 + Math.random() * 3; }
          else {
            const forma = suave(limitar(u / 0.2)) * (1 - suave(limitar((u - 0.7) / 0.3)));
            giro += olhada.dir * 0.55 * forma * atual.olhadas;
            lado += olhada.dir * 0.06 * forma * atual.olhadas;
          }
        }

        // nervoso (votação): tremidinha rápida
        if (atual.tremor > 0.001) {
          x += atual.tremor * 0.012 * (Math.sin(t * 37) + Math.sin(t * 23.3)) * 0.5;
          lado += atual.tremor * 0.04 * Math.sin(t * 29 + 1);
          giro += atual.tremor * 0.05 * Math.sin(t * 17);
        }

        // pulos (cartas e comemoração)
        if (h === "festa" && !pulo && t >= proxFesta) { pulo = { tipo: FESTA, ini: t }; proxFesta = t + FESTA_INTERVALO; }
        if (pulo) {
          const u = (t - pulo.ini) / pulo.tipo.dur;
          if (u >= 1) pulo = null;
          else if (u > 0) {
            amassa += curva(pulo.tipo.amassa, u);
            y += altura(pulo.tipo.sobe, u);
            if (pulo.tipo === FESTA) giro += Math.PI * 2 * suave(limitar((u - 0.22) / 0.5));
          }
        }

        // pego: encolhe, treme e se recupera
        const up = (t - pegoIni) / PEGO_DUR;
        const alvoEnc = h === "pego" ? curva(PEGO_ENCOLHE, Math.max(0, up)) : 0;
        const alvoTreme = h === "pego" && up < 1 ? limitar((alvoEnc - 0.3) / 0.7) : 0;
        const kRapido = 1 - Math.exp(-dt * 10);
        encolhe += (alvoEnc - encolhe) * kRapido;
        tremePego += (alvoTreme - tremePego) * kRapido;
        if (tremePego > 0.001) {
          x += tremePego * 0.018 * Math.sin(t * 61);
          lado += tremePego * 0.05 * Math.sin(t * 47 + 2);
        }
      } else {
        encolhe = h === "pego" ? 0.3 : 0;
        giro = -0.18; // pose parada: três-quartos, mais simpático que de frente
      }

      amassa += encolhe * 0.12;
      const escala = 1 - 0.16 * encolhe;
      raiz.position.set(x, y, 0);
      raiz.rotation.set(inclina, giro, lado);
      raiz.scale.set(escala * (1 + amassa * 0.5), escala * (1 - amassa), escala * (1 + amassa * 0.5));
      const longe = limitar(y / 0.35);
      sombra.malha.scale.setScalar(escala * (1 - 0.45 * longe));
      sombra.malha.material.opacity = 0.55 * (1 - 0.6 * longe);
    }

    // ---- tamanho e enquadramento ----
    function ajustar() {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const tg = Math.tan((FOV * Math.PI) / 360);
      const dist = Math.max(MEIA_ALTURA / tg, MEIA_LARGURA / (tg * camera.aspect));
      camera.position.set(0, CENTRO_Y + 0.06, dist);
      camera.lookAt(0, CENTRO_Y, 0);
      camera.updateProjectionMatrix();
    }
    ajustar();

    // ---- laço: só roda com a aba visível, o canvas na tela e sem "reduzir movimento" ----
    let naTela = true;
    let rodando = false;
    let ultimo = 0;
    const desenhar = () => { if (modelo) renderer.render(cena, camera); };
    function quadro(agora) {
      const dt = Math.min(0.05, ultimo ? (agora - ultimo) / 1000 : 0.016);
      ultimo = agora;
      t += dt;
      posar(dt, false);
      desenhar();
    }
    function atualizarLaco() {
      const rodar = !!modelo && naTela && document.visibilityState === "visible" && !reduzir.matches;
      if (rodar !== rodando) {
        rodando = rodar;
        ultimo = 0;
        renderer.setAnimationLoop(rodar ? quadro : null);
      }
      if (!rodar && modelo && reduzir.matches) { posar(0, true); desenhar(); }
    }

    aoMudarHumor.current = (h) => {
      entrarNoHumor(h);
      if (reduzir.matches) { posar(0, true); desenhar(); }
    };

    const aoVisibilidade = () => atualizarLaco();
    document.addEventListener("visibilitychange", aoVisibilidade);
    reduzir.addEventListener?.("change", atualizarLaco);

    const io = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((entradas) => { naTela = entradas.some((e) => e.isIntersecting); atualizarLaco(); })
      : null;
    io?.observe(el);
    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => { ajustar(); if (!rodando) { if (reduzir.matches) posar(0, true); desenhar(); } })
      : null;
    ro?.observe(el);

    // Olhar pro cursor: só com mouse de verdade (computador).
    const aoMover = (e) => {
      if (!mouseFino.matches) return;
      const r = el.getBoundingClientRect();
      alvoOlhar.x = limitar((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2), -1, 1);
      alvoOlhar.y = limitar((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2), -1, 1);
    };
    window.addEventListener("pointermove", aoMover, { passive: true });

    const aoPerderContexto = (e) => { e.preventDefault(); rodando = false; renderer.setAnimationLoop(null); falhar.current?.(); };
    canvas.addEventListener("webglcontextlost", aoPerderContexto);

    carregarModelo().then((original) => {
      if (!vivo) return;
      modelo = original.clone(true); // divide geometria/material com o original
      // Normaliza: 1 de altura, centrado, pés no zero.
      const caixaModelo = new Box3().setFromObject(modelo);
      const tam = caixaModelo.getSize(new Vector3());
      const centro = caixaModelo.getCenter(new Vector3());
      const s = 1 / (tam.y || 1);
      const dentro = new Group();
      dentro.scale.setScalar(s);
      dentro.position.set(-centro.x * s, -caixaModelo.min.y * s, -centro.z * s);
      dentro.add(modelo);
      raiz.add(dentro);
      posar(0, true);
      if (!reduzir.matches) posar(0.016, false);
      desenhar();
      canvas.classList.add("pronto");
      atualizarLaco();
    }).catch(() => { if (vivo) falhar.current?.(); });

    return () => {
      vivo = false;
      aoMudarHumor.current = null;
      rodando = false;
      renderer.setAnimationLoop(null);
      document.removeEventListener("visibilitychange", aoVisibilidade);
      reduzir.removeEventListener?.("change", atualizarLaco);
      window.removeEventListener("pointermove", aoMover);
      canvas.removeEventListener("webglcontextlost", aoPerderContexto);
      io?.disconnect();
      ro?.disconnect();
      // Libera a GPU deste canvas. A geometria/textura decodificadas ficam
      // no cache do módulo (voltar pra tela não baixa nem decodifica de novo);
      // o three.js reenvia pra GPU se outro canvas usar.
      if (modelo) {
        modelo.traverse((o) => {
          if (!o.isMesh) return;
          o.geometry?.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => { m?.map?.dispose(); m?.dispose(); });
        });
      }
      sombra.liberar();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return <div ref={caixa} className="imp-agente-palco" />;
}
