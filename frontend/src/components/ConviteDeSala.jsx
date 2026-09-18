import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../socket.js";

/**
 * AVISO DE CONVITE — aparece por cima de qualquer tela.
 *
 * Fica montado no App inteiro, não dentro de um jogo. Isso é o ponto: o
 * convite precisa chegar onde a pessoa estiver — jogando outra sala, no
 * ranking, no perfil. Se vivesse dentro da página do Stop, só quem já
 * estivesse no Stop receberia.
 *
 * Some sozinho em 30 segundos. Convite pra sala tem validade curta: se a
 * pessoa não viu na hora, a partida já mudou e entrar não faz mais sentido.
 */
const ROTAS = {
  stop: "/jogos/stop",
  quiz: "/jogos/quiz",
  acromania: "/jogos/acromania",
};

export default function ConviteDeSala() {
  const [convite, setConvite] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // `getSocket()` é a conexão GLOBAL — a que existe em qualquer página.
    // Cheguei a importar `socket` direto, que não é exportado; o build
    // reclamou na hora.
    //
    // Tem que ser a global mesmo: o convite precisa chegar mesmo se a pessoa
    // estiver no ranking ou no perfil, fora de qualquer sala.
    const socket = getSocket();
    function aoReceber(dados) {
      if (!dados?.sala) return;
      setConvite(dados);
    }
    socket.on("convite-de-sala", aoReceber);
    return () => socket.off("convite-de-sala", aoReceber);
  }, []);

  useEffect(() => {
    if (!convite) return;
    const timer = setTimeout(() => setConvite(null), 30000);
    return () => clearTimeout(timer);
  }, [convite]);

  if (!convite) return null;

  const base = ROTAS[convite.jogo] || ROTAS.stop;

  return (
    <div className="convite-sala" role="alert">
      <div className="convite-sala-texto">
        <strong>{convite.de}</strong> chamou você para jogar
        <br />
        <span className="convite-sala-local">{convite.salaLabel}</span>
      </div>
      <div className="convite-sala-botoes">
        <button
          className="convite-sala-aceitar"
          onClick={() => {
            // Rota direta por sala, que já existia (/jogos/stop/:roomId).
            // Cheguei a escrever `?sala=` antes de conferir — as páginas de
            // jogo não leem parâmetro de busca, e o botão não faria nada.
            navigate(`${base}/${encodeURIComponent(convite.sala)}`);
            setConvite(null);
          }}
        >
          Entrar
        </button>
        <button className="convite-sala-recusar" onClick={() => setConvite(null)}>
          Agora não
        </button>
      </div>
    </div>
  );
}
