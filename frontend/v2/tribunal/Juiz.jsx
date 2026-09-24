import { Component, lazy, memo, Suspense, useState } from "react";

// O juiz (mascote 3D do Tribunal) — embrulho leve, no mesmo molde do agente
// do Impostor (impostor/Agente.jsx). O three.js mora só em Juiz3D.jsx,
// carregado sob demanda: o jogo aparece na hora e o juiz entra quando
// chegar (com um fade). Sem WebGL 2, se o modelo não carregar ou se algo
// quebrar, o espaço some — o jogo nunca depende dele.
const Juiz3D = lazy(() => import("./Juiz3D.jsx"));

// O three.js atual só desenha com WebGL 2. Testa uma vez só.
let temWebGL;
function suportaWebGL() {
  if (temWebGL !== undefined) return temWebGL;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    temWebGL = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    temWebGL = false;
  }
  return temWebGL;
}

// Falhou uma vez? Desiste até recarregar a página: sem laço de
// tenta-falha-tenta piscando na tela.
let desistiu = false;

class Protecao extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: false };
  }
  static getDerivedStateFromError() {
    return { erro: true };
  }
  componentDidCatch(erro) {
    this.props.aoFalhar?.(erro);
  }
  render() {
    return this.state.erro ? null : this.props.children;
  }
}

// Decorativo: aria-hidden e sem cliques (pointer-events no CSS). O tamanho
// vem da classe (espaço reservado enquanto carrega, sem pulo).
// humor e gesto são textos (props estáveis): o estado da sala chega a cada
// segundo e o canvas NUNCA remonta por isso — só muda o alvo da animação.
function Juiz({ humor = "lobby", gesto = "", className = "" }) {
  const [falhou, setFalhou] = useState(() => desistiu || typeof window === "undefined" || !suportaWebGL());
  if (falhou) return null;
  const aoFalhar = () => { desistiu = true; setFalhou(true); };
  return (
    <div className={`v2-juiz ${className}`} aria-hidden="true">
      <Protecao aoFalhar={aoFalhar}>
        <Suspense fallback={null}>
          <Juiz3D humor={humor} gesto={gesto} aoFalhar={aoFalhar} />
        </Suspense>
      </Protecao>
    </div>
  );
}

export default memo(Juiz);
