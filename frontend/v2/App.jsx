import { useEffect, useState } from "react";
import { usuarioAtual } from "./api.js";
import Lobby from "./Lobby.jsx";
import Sala from "./Sala.jsx";
import SalaStop from "./SalaStop.jsx";
import Ranking from "./Ranking.jsx";
import Missoes from "./Missoes.jsx";
import Patentes from "./Patentes.jsx";
import Perfil from "./Perfil.jsx";

// Navegação por parâmetro (?sala=ID, ?pagina=ranking, ?pagina=jogador&id=X)
// em vez de rotas: /v2/ é sempre o mesmo arquivo, e recarregar nunca cai no
// site clássico por engano.
function lerLocal() {
  const p = new URLSearchParams(window.location.search);
  return { sala: p.get("sala"), stop: p.get("stop"), pagina: p.get("pagina"), id: p.get("id"), jogo: p.get("jogo") };
}

function navegar(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const url = q.toString() ? `/v2/?${q}` : "/v2/";
  window.history.pushState({}, "", url);
  window.dispatchEvent(new Event("popstate"));
  window.scrollTo(0, 0);
}

export const irPara = (sala) => navegar({ sala });
export const irParaStop = (stop) => navegar({ stop });
export const irParaPagina = (pagina, extra = {}) => navegar({ pagina, ...extra });
export const linkDaPagina = (pagina, extra = {}) => {
  const q = new URLSearchParams({ pagina, ...extra });
  return `/v2/?${q}`;
};

export default function App() {
  const [local, setLocal] = useState(lerLocal());
  const usuario = usuarioAtual();

  useEffect(() => {
    const aoVoltar = () => setLocal(lerLocal());
    window.addEventListener("popstate", aoVoltar);
    return () => window.removeEventListener("popstate", aoVoltar);
  }, []);

  if (!usuario) {
    return (
      <div className="v2-app v2-centro">
        <div className="v2-cartao-entrar">
          <div className="v2-logo-grande">educação<span> gamer</span></div>
          <p>Esta é a versão nova, em teste. Entre com sua conta (ou como visitante) no site e volte aqui.</p>
          <a className="v2-botao v2-botao-amarelo" href="/login">Entrar</a>
          <a className="v2-link" href="/">voltar ao site clássico</a>
        </div>
      </div>
    );
  }

  if (local.sala) return <Sala key={local.sala} roomId={local.sala} usuario={usuario} />;
  if (local.stop) return <SalaStop key={local.stop} roomId={local.stop} usuario={usuario} />;
  switch (local.pagina) {
    case "ranking": return <Ranking usuario={usuario} jogoInicial={local.jogo} />;
    case "missoes": return <Missoes usuario={usuario} />;
    case "patentes": return <Patentes key={local.jogo || "q"} usuario={usuario} jogoInicial={local.jogo} />;
    case "jogador": return <Perfil key={local.id} usuario={usuario} userId={local.id || usuario.id} />;
    default: return <Lobby usuario={usuario} />;
  }
}
