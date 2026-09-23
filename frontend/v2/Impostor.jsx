import { useEffect, useRef, useState } from "react";
import { novoSocket } from "./api.js";
import Topo from "./Topo.jsx";
import Entrada from "./impostor/Entrada.jsx";
import SalaEspera from "./impostor/SalaEspera.jsx";
import Rodada from "./impostor/Rodada.jsx";
import Votacao from "./impostor/Votacao.jsx";
import Revelacao from "./impostor/Revelacao.jsx";
import "./impostor/impostor.css";

// O IMPOSTOR — tela (EM CONSTRUÇÃO, sem link no site: /v2/?pagina=impostor).
// O motor fica em backend/src/impostor/. Esta tela só mostra o estado que o
// servidor manda e envia intenções (dica, voto, chute) — nunca decide nada.
//
// Mesmo modelo de conexão do Tribunal: o código da sala fica na URL
// (&mesa=KX7-42) e, se a conexão cair, entra de novo sozinho ao reconectar.
export default function Impostor({ usuario, salaDoLink }) {
  const [estado, setEstado] = useState(null);
  const [carta, setCarta] = useState(null);
  const [tempo, setTempo] = useState({ ms: null, em: 0 });
  const [erro, setErro] = useState("");
  const [caiu, setCaiu] = useState(false);
  const socketRef = useRef(null);
  const codigoRef = useRef(salaDoLink || null);

  useEffect(() => {
    const s = novoSocket();
    socketRef.current = s;
    let fase = "";
    s.on("impostor-estado", (e) => {
      if (e.fase !== fase) { fase = e.fase; setErro(""); }
      if (e.fase === "LOBBY") setCarta(null);
      codigoRef.current = e.codigo;
      setTempo({ ms: e.restanteMs, em: Date.now() });
      setEstado(e);
    });
    s.on("impostor-carta", setCarta);
    s.on("impostor-tempo", (t) => setTempo({ ms: t.restanteMs, em: Date.now() }));
    s.on("connect", () => {
      setCaiu(false);
      if (codigoRef.current) {
        s.emit("impostor-entrar", { codigo: codigoRef.current }, (r) => {
          if (r?.erro) { setErro(r.erro); codigoRef.current = null; window.history.replaceState(null, "", "/v2/?pagina=impostor"); }
        });
      }
    });
    s.on("disconnect", () => setCaiu(true));
    s.connect();
    // Sair da página só desconecta: o servidor segura a vaga por 30s (queda
    // de rede, recarregar). Sair DE VEZ é o botão "Sair da sala".
    return () => s.disconnect();
  }, [salaDoLink]);

  const pedir = (evento, dados = {}) =>
    new Promise((ok) => {
      socketRef.current?.emit(evento, dados, (r) => {
        if (r?.erro) setErro(r.erro);
        else setErro("");
        ok(r || {});
      });
    });

  function irParaSala(codigo) {
    codigoRef.current = codigo;
    window.history.replaceState(null, "", `/v2/?pagina=impostor&mesa=${encodeURIComponent(codigo)}`);
  }
  async function criar() {
    const r = await pedir("impostor-criar");
    if (r.codigo) irParaSala(r.codigo);
  }
  async function entrar(codigo) {
    const r = await pedir("impostor-entrar", { codigo });
    if (r.codigo) irParaSala(r.codigo);
  }
  function sairDaSala() {
    socketRef.current?.emit("impostor-sair");
    codigoRef.current = null;
    setEstado(null);
    setCarta(null);
    window.history.replaceState(null, "", "/v2/?pagina=impostor");
  }

  const props = { estado, carta, tempo, pedir, aoSair: sairDaSala };
  let tela;
  if (!estado) tela = <Entrada aoCriar={criar} aoEntrar={entrar} entrando={!!salaDoLink && !erro} />;
  else if (estado.fase === "LOBBY") tela = <SalaEspera {...props} />;
  else if (estado.fase === "CARTAS" || estado.fase === "DICAS") tela = <Rodada {...props} />;
  else if (estado.fase === "VOTACAO") tela = <Votacao {...props} />;
  else tela = <Revelacao {...props} />;

  return (
    <div className="v2-app v2-com-menu imp-app">
      <Topo usuario={usuario} ativo={null} />
      <main className="imp">
        {caiu && <div className="imp-aviso" role="status">Conexão caiu — reconectando…</div>}
        {erro && <div className="imp-aviso erro" role="alert">{erro}</div>}
        {estado && !estado.participo && estado.fase !== "LOBBY" && (
          <div className="imp-aviso" role="status">Partida em andamento. Você está assistindo e joga a próxima.</div>
        )}
        <div className="imp-tela" key={estado?.fase || "entrada"}>{tela}</div>
      </main>
    </div>
  );
}
