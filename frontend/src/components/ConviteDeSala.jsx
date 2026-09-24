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
// Jogos que só existem na versão nova (v2): o convite leva pra página do
// jogo lá, com o código da mesa (?pagina=tribunal&mesa=123456 — o mesmo
// endereço do link de convite da própria sala). Antes, jogo que não estava
// em ROTAS caía no Stop: convite do Tribunal abria uma sala de STOP com o
// código da mesa como nome.
const SO_NA_NOVA = ["tribunal", "mentira", "impostor"];

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
      // Jogo que este site não sabe abrir: melhor não mostrar do que mandar
      // a pessoa pra sala errada.
      if (!ROTAS[dados.jogo] && !SO_NA_NOVA.includes(dados.jogo)) return;
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

  const base = ROTAS[convite.jogo];

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
            setConvite(null);
            if (!base) {
              // Página de outro app (/v2/): troca de endereço de verdade.
              const q = new URLSearchParams({ pagina: convite.jogo, mesa: convite.sala });
              window.location.assign(`/v2/?${q}`);
              return;
            }
            navigate(`${base}/${encodeURIComponent(convite.sala)}`);
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
