import { useEffect, useState } from "react";
import { usuarioAtual } from "./api.js";
import Lobby from "./Lobby.jsx";
import Sala from "./Sala.jsx";

// Navegação por parâmetro (?sala=ID) em vez de rotas: assim /v2/ é sempre o
// mesmo arquivo e recarregar a página nunca cai no site clássico por engano.
function lerSala() {
  return new URLSearchParams(window.location.search).get("sala");
}

export function irPara(sala) {
  const url = sala ? `/v2/?sala=${encodeURIComponent(sala)}` : "/v2/";
  window.history.pushState({}, "", url);
  window.dispatchEvent(new Event("popstate"));
}

export default function App() {
  const [sala, setSala] = useState(lerSala());
  const usuario = usuarioAtual();

  useEffect(() => {
    const aoVoltar = () => setSala(lerSala());
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

  return sala ? <Sala key={sala} roomId={sala} usuario={usuario} /> : <Lobby usuario={usuario} />;
}
