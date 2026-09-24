import { Component, lazy, Suspense, useState } from "react";

// O mascote (agente impostor em 3D) — embrulho leve. O three.js mora só em
// Agente3D.jsx, carregado sob demanda: o jogo aparece na hora e o boneco
// entra quando chegar (com um fade). Sem WebGL 2, se o modelo não carregar
// ou se algo quebrar, o espaço some — o jogo nunca depende dele.
//
// humor: lobby | cartas | dicas | votacao | festa | pego (ver Agente3D.jsx).
const Agente3D = lazy(() => import("./Agente3D.jsx"));

// O three.js atual só desenha com WebGL 2. Testa uma vez e devolve o contexto.
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

// Falhou uma vez (contexto WebGL perdido, modelo que não veio, erro no
// desenho)? Desiste até recarregar a página: as outras telas nem tentam,
// então não existe laço de tenta-falha-tenta piscando na tela.
let desistiu = false;

// Erro no carregamento do pedaço ou no desenho: some em silêncio.
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
// vem da classe (o espaço fica reservado enquanto carrega, sem pulo).
export default function Agente({ humor = "lobby", className = "" }) {
  const [falhou, setFalhou] = useState(() => desistiu || typeof window === "undefined" || !suportaWebGL());
  if (falhou) return null;
  const aoFalhar = () => { desistiu = true; setFalhou(true); };
  return (
    <div className={`imp-agente ${className}`} aria-hidden="true">
      <Protecao aoFalhar={aoFalhar}>
        <Suspense fallback={null}>
          <Agente3D humor={humor} aoFalhar={aoFalhar} />
        </Suspense>
      </Protecao>
    </div>
  );
}
