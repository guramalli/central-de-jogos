import { useEffect, useRef } from "react";
import {
  Box3,
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
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { clone as clonarComEsqueleto } from "three/examples/jsm/utils/SkeletonUtils.js";
import { criarAnimador, prenderMartelo } from "./juizAnim.js";

// O JUIZ do Tribunal em 3D (mascote). Mesmo molde do agente do Impostor
// (impostor/Agente3D.jsx): este arquivo e juizAnim.js são os únicos que
// importam o three.js, e só chegam pelo import dinâmico de Juiz.jsx.
//
// Diferença: o juiz tem ESQUELETO. O corpo inteiro só respira e balança; o
// resto (martelada, aceno, apontar, dar de ombros) é osso por osso, em
// juizAnim.js.
//
// Nome versionado: trocar o modelo = arquivo novo (juiz-v2.glb), e o cache
// do service worker (cache-first) nunca serve um modelo velho.
const URL_MODELO = "/tribunal/juiz-v1.glb";

// O material do arquivo vem com emissão = 100% da textura (fica chapado,
// sem volume). Um pouco de emissão guarda as cores da arte; as luzes dão o
// volume da toga e da peruca.
const BRILHO_PROPRIO = 0.42;

// Enquadramento (normalizado pra 1 de altura, pés no zero): o martelo
// levantado chega na altura da cabeça, e o braço aberto sai um pouco do corpo.
const FOV = 30;
const CENTRO_Y = 0.52;
const MEIA_ALTURA = 0.56;
const MEIA_LARGURA = 0.54;

// ---------------- modelo (baixado, decodificado e ajustado uma vez só) ----------------
let promessaModelo = null;
function carregarModelo() {
  if (!promessaModelo) {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    promessaModelo = loader.loadAsync(URL_MODELO).then((gltf) => {
      gltf.scene.traverse((o) => {
        if (!o.isMesh || !o.material) return;
        o.frustumCulled = false; // a caixa do SkinnedMesh é a da pose parada
        const m = o.material;
        if ("emissiveIntensity" in m) { m.emissiveIntensity = BRILHO_PROPRIO; m.needsUpdate = true; }
      });
      prenderMartelo(gltf.scene); // mexe na geometria compartilhada: uma vez só
      return gltf.scene;
    }).catch((e) => {
      promessaModelo = null; // deixa tentar de novo numa próxima montagem
      throw e;
    });
  }
  return promessaModelo;
}

const limitar = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

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
  const geo = new PlaneGeometry(0.85, 0.45);
  const mat = new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.5 });
  const malha = new Mesh(geo, mat);
  malha.rotation.x = -Math.PI / 2;
  malha.position.y = 0.002;
  return { malha, liberar: () => { geo.dispose(); mat.dispose(); tex.dispose(); } };
}

// humor: lobby | atento | leitura | ouvindo | votar | suspense | culpado | inocente
// gesto: "tipo:inicioMs" (performance.now() de quando o som começou) —
//   vinheta | ordem | batida | condena | absolve (ver juizAnim.js). Pelo
//   relógio da página, o gesto fica no tempo do som mesmo se o boneco
//   terminar de carregar no meio.
// aoFalhar: sem WebGL, contexto perdido ou modelo que não carregou — quem
// usa esconde o espaço (nunca joga erro pra página).
export default function Juiz3D({ humor = "lobby", gesto = "", aoFalhar }) {
  const caixa = useRef(null);
  const humorRef = useRef(humor);
  const gestoRef = useRef(gesto);
  const avisar = useRef(null);
  const falhar = useRef(aoFalhar);
  falhar.current = aoFalhar;

  useEffect(() => {
    humorRef.current = humor;
    gestoRef.current = gesto;
    avisar.current?.();
  }, [humor, gesto]);

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
    canvas.className = "v2-juiz-canvas";
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);

    const cena = new Scene();
    const camera = new PerspectiveCamera(FOV, 1, 0.1, 20);
    // Luz de tribunal: céu morno, chão de madeira, principal quente de
    // frente/esquerda e contraluz dourada recortando a peruca e a toga.
    cena.add(new HemisphereLight(0xfff4e0, 0x4a2c14, 1.2));
    const principal = new DirectionalLight(0xfff1dc, 1.9);
    principal.position.set(-1.4, 2.4, 3);
    const contraDourada = new DirectionalLight(0xffc35a, 2.4);
    contraDourada.position.set(1.8, 1.6, -2.4);
    const contraFria = new DirectionalLight(0x8fa6ff, 1.1);
    contraFria.position.set(-2, 1, -2);
    cena.add(principal, contraDourada, contraFria);

    const raiz = new Group();
    raiz.rotation.order = "YXZ";
    cena.add(raiz);
    const sombra = criarSombra();
    cena.add(sombra.malha);
    let modelo = null;
    let animador = null;
    let gestoAplicado = "";

    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)");

    function aplicarPedidos() {
      if (!animador) return;
      animador.humor(humorRef.current);
      if (gestoRef.current !== gestoAplicado) {
        gestoAplicado = gestoRef.current;
        const [tipo, ms] = String(gestoAplicado).split(":");
        animador.gesto(tipo, Number(ms) || 0);
      }
    }

    function posar(dt, estatico) {
      if (!animador) return;
      const c = animador.posar(dt, estatico, performance.now());
      raiz.position.set(0, c.y, 0);
      raiz.rotation.set(c.inclina, c.giro, c.lado);
      raiz.scale.set(1 + c.amassa * 0.5, 1 - c.amassa, 1 + c.amassa * 0.5);
      sombra.malha.scale.setScalar(1 - 0.4 * limitar(c.y / 0.3));
    }

    function ajustar() {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const tg = Math.tan((FOV * Math.PI) / 360);
      const dist = Math.max(MEIA_ALTURA / tg, MEIA_LARGURA / (tg * camera.aspect));
      camera.position.set(0, CENTRO_Y + 0.08, dist);
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

    avisar.current = () => {
      aplicarPedidos();
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

    const aoPerderContexto = (e) => { e.preventDefault(); rodando = false; renderer.setAnimationLoop(null); falhar.current?.(); };
    canvas.addEventListener("webglcontextlost", aoPerderContexto);

    carregarModelo().then((original) => {
      if (!vivo) return;
      // Clone com esqueleto próprio (o clone comum deixaria a malha presa
      // aos ossos do original). Geometria e material continuam divididos.
      modelo = clonarComEsqueleto(original);
      animador = criarAnimador(modelo);
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
      aplicarPedidos();
      posar(0, true);
      if (!reduzir.matches) posar(0.016, false);
      desenhar();
      canvas.classList.add("pronto");
      atualizarLaco();
    }).catch(() => { if (vivo) falhar.current?.(); });

    return () => {
      vivo = false;
      avisar.current = null;
      rodando = false;
      renderer.setAnimationLoop(null);
      document.removeEventListener("visibilitychange", aoVisibilidade);
      reduzir.removeEventListener?.("change", atualizarLaco);
      canvas.removeEventListener("webglcontextlost", aoPerderContexto);
      io?.disconnect();
      ro?.disconnect();
      // Libera a GPU deste canvas. Geometria/textura decodificadas ficam no
      // cache do módulo (voltar pra tela não baixa nem decodifica de novo).
      if (modelo) {
        modelo.traverse((o) => {
          if (!o.isMesh) return;
          o.geometry?.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => { m?.map?.dispose(); m?.emissiveMap?.dispose(); m?.dispose(); });
        });
      }
      sombra.liberar();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return <div ref={caixa} className="v2-juiz-palco" />;
}
