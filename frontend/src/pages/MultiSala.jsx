import { useState, useEffect, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import Seo from "../components/Seo.jsx";

const StopGame = lazy(() => import("./StopGame.jsx"));
const QuizGame = lazy(() => import("./QuizGame.jsx"));

// MULTI-SALA — várias partidas na mesma página.
//
// COMO FUNCIONA: cada painel monta a MESMA página de jogo que já existe
// (StopGame / QuizGame), só que com a sala vinda por propriedade e com uma
// CONEXÃO PRÓPRIA (socketProprio).
//
// A conexão própria é o ponto todo. O backend guarda uma sala por conexão
// (socket.currentRoom), então dois painéis na mesma conexão fariam o segundo
// expulsar o primeiro da sala dele. Uma conexão por painel resolve sem tocar
// em nada do servidor — cada uma continua tendo a sua única sala.
//
// LIMITE DE 4: cada painel é um jogo inteiro rodando (timers, chat, lista de
// jogadores) e uma conexão aberta. Acima disso o navegador do celular
// engasga, e no Stop já fica impossível acompanhar — são 6 temas por sala
// pra preencher em 30 segundos.
const MAX_PAINEIS = 4;

export default function MultiSala() {
  const { jogo } = useParams(); // "stop" | "quiz"
  const ehStop = jogo !== "quiz";

  const [salas, setSalas] = useState([]);     // salas disponíveis
  const [abertas, setAbertas] = useState([]); // salas nos painéis
  const [erro, setErro] = useState("");

  useEffect(() => {
    api
      .get(ehStop ? "/rooms" : "/quiz-rooms")
      .then(({ data }) => {
        const lista = Array.isArray(data) ? data : data.rooms || [];
        setSalas(lista);
      })
      .catch(() => setErro("Não foi possível carregar as salas."));
  }, [ehStop]);

  function abrir(roomId) {
    setErro("");
    if (abertas.includes(roomId)) return;
    if (abertas.length >= MAX_PAINEIS) {
      setErro(`Dá pra abrir até ${MAX_PAINEIS} salas ao mesmo tempo.`);
      return;
    }
    setAbertas((a) => [...a, roomId]);
  }

  function fechar(roomId) {
    // Tirar da lista desmonta o painel, e o desmonte fecha a conexão dele
    // (socket.disconnect no cleanup da página de jogo). Sem isso a pessoa
    // continuaria na sala como fantasma.
    setAbertas((a) => a.filter((r) => r !== roomId));
  }

  const Jogo = ehStop ? StopGame : QuizGame;
  const nomeDaSala = (id) => salas.find((s) => s.roomId === id)?.label || id;

  return (
    <div className="multi-sala">
      <Seo
        title={`Várias salas de ${ehStop ? "Stop" : "Quiz"} ao mesmo tempo`}
        description="Jogue em mais de uma sala na mesma tela, sem abrir outra aba."
      />

      <div className="multi-cabecalho">
        <div>
          <h1>{ehStop ? "Stop" : "Quiz"} — várias salas</h1>
          <p className="multi-sub">
            Abra até {MAX_PAINEIS} salas na mesma tela. Cada painel é uma partida
            independente, com chat e placar próprios.
          </p>
        </div>
        <Link to={ehStop ? "/jogos/stop" : "/jogos/quiz"} className="retro-btn">
          ← Voltar ao lobby
        </Link>
      </div>

      {erro && <div className="error-msg">{erro}</div>}

      <div className="multi-seletor">
        {salas.map((s) => {
          const aberta = abertas.includes(s.roomId);
          return (
            <button
              key={s.roomId}
              className={`multi-chip ${aberta ? "multi-chip-on" : ""}`}
              onClick={() => (aberta ? fechar(s.roomId) : abrir(s.roomId))}
            >
              {aberta ? "✓ " : "+ "}
              {s.label || s.roomId}
              {typeof s.onlineCount === "number" && (
                <span className="multi-chip-online">{s.onlineCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {abertas.length === 0 ? (
        <p className="multi-vazio">
          Escolha as salas acima pra começar. Elas aparecem lado a lado aqui embaixo.
        </p>
      ) : (
        <div className={`multi-grade multi-grade-${abertas.length}`}>
          {abertas.map((roomId) => (
            <div key={roomId} className="multi-painel">
              <div className="multi-painel-topo">
                <span className="multi-painel-nome">{nomeDaSala(roomId)}</span>
                <button className="multi-fechar" onClick={() => fechar(roomId)}>
                  fechar
                </button>
              </div>
              <div className="multi-painel-jogo">
                <Suspense fallback={<p className="multi-carregando">carregando...</p>}>
                  {/* `key` no roomId: trocar de sala precisa DESMONTAR o painel
                      inteiro, pra conexão antiga fechar e o estado não vazar de
                      uma sala pra outra. */}
                  <Jogo key={roomId} salaFixa={roomId} socketProprio compacto />
                </Suspense>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
