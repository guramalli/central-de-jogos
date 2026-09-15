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
  // Com sala aberta, a tela é do JOGO: título e seletor saem do caminho.
  const [mostrarSeletor, setMostrarSeletor] = useState(false);

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

  const jogando = abertas.length > 0;
  const Jogo = ehStop ? StopGame : QuizGame;
  const nomeDaSala = (id) => salas.find((s) => s.roomId === id)?.label || id;

  return (
    <div className="multi-sala">
      <Seo
        title={`Várias salas de ${ehStop ? "Stop" : "Quiz"} ao mesmo tempo`}
        description="Jogue em mais de uma sala na mesma tela, sem abrir outra aba."
      />

      {/* CABEÇALHO E SELETOR RECOLHEM depois que a primeira sala abre.
          
          Eles são a tela de escolha, e a escolha já foi feita — deixá-los
          fixos comeria a altura das partidas, que é o que a pessoa veio ver.
          O botão "escolher salas" traz tudo de volta. */}
      {!jogando ? (
        <>
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
        </>
      ) : (
        <div className="multi-barra-jogo">
          <button className="multi-btn-mini" onClick={() => setMostrarSeletor((v) => !v)}>
            {mostrarSeletor ? "✕ fechar lista" : "⊞ escolher salas"}
          </button>
          <span className="multi-barra-contador">
            {abertas.length} de {MAX_PAINEIS} salas
          </span>
          <Link to={ehStop ? "/jogos/stop" : "/jogos/quiz"} className="multi-btn-mini">
            ← lobby
          </Link>
        </div>
      )}

      {erro && <div className="error-msg">{erro}</div>}

      {(!jogando || mostrarSeletor) && (
        <Seletor
          salas={salas}
          abertas={abertas}
          alternar={(id) => (abertas.includes(id) ? fechar(id) : abrir(id))}
          ehStop={ehStop}
        />
      )}

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
                  <Jogo
                    key={roomId}
                    salaFixa={roomId}
                    socketProprio
                    compacto
                    aoFechar={() => fechar(roomId)}
                  />
                </Suspense>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// SELETOR DE SALAS
//
// O Quiz tem 35 salas. Em fila corrida de fichas iguais, achar "Cinema —
// Avançado" virava caça-palavras: o olho passa por 34 itens parecidos.
//
// Agrupar por TEMA resolve porque é assim que a pessoa procura — ela quer
// "Cinema", e só depois escolhe a dificuldade. Cada bloco vira uma unidade
// visual com o nome em cima e os dois níveis embaixo.
//
// A COR vem da convenção que o site já usa em todo lugar: verde pra
// padrão/fácil, vermelho pra avançado/difícil. Não é cor nova, é a mesma do
// lobby e das patentes.
function Seletor({ salas, abertas, alternar, ehStop }) {
  const arenas = salas.filter((s) => s.arena);
  const comuns = salas.filter((s) => !s.arena);

  // Agrupa por tema mantendo a ORDEM em que as salas chegaram — ela já vem
  // pareada do servidor (Padrão e Avançado juntos).
  const porTema = [];
  for (const s of comuns) {
    const chave = s.themeKey || s.roomId;
    let grupo = porTema.find((g) => g.chave === chave);
    if (!grupo) {
      grupo = { chave, nome: nomeDoTema(s), salas: [] };
      porTema.push(grupo);
    }
    grupo.salas.push(s);
  }

  return (
    <div className="multi-seletor">
      {arenas.length > 0 && (
        <div className="multi-grupo multi-grupo-arena">
          <span className="multi-grupo-nome">⚡ Arenas</span>
          <div className="multi-grupo-salas">
            {arenas.map((s) => (
              <BotaoSala key={s.roomId} sala={s} aberta={abertas.includes(s.roomId)} alternar={alternar} />
            ))}
          </div>
        </div>
      )}

      {porTema.map((g) => (
        <div key={g.chave} className="multi-grupo">
          <span className="multi-grupo-nome">{g.nome}</span>
          <div className="multi-grupo-salas">
            {g.salas.map((s) => (
              <BotaoSala key={s.roomId} sala={s} aberta={abertas.includes(s.roomId)} alternar={alternar} ehStop={ehStop} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// "Cinema — Avançado" vira só "Cinema": o nível já aparece no botão embaixo.
function nomeDoTema(sala) {
  const bruto = sala.label || sala.roomId;
  return bruto.split("—")[0].trim();
}

// O que sobra do rótulo depois de tirar o tema: "Padrão", "Avançado". Sala
// sem nível (Direito, Zoeira) mostra "Entrar", porque repetir o nome do tema
// dentro do próprio bloco dele seria redundante.
function nivelDaSala(sala) {
  const bruto = sala.label || "";
  const partes = bruto.split("—");
  if (partes.length > 1) return partes.slice(1).join("—").trim();
  if (sala.arena) return bruto.replace(/⚡|Arena|Boca Livre|Relâmpago/gi, "").trim() || "Entrar";
  return "Entrar";
}

function BotaoSala({ sala, aberta, alternar }) {
  const nivel = nivelDaSala(sala);
  // A cor sai do tier que o servidor manda, não de adivinhação pelo texto do
  // rótulo — rótulo muda, tier não.
  const classeNivel =
    sala.tier === "avancado" ? "multi-sala-avancada" : sala.tier === "arena" ? "multi-sala-arena" : "multi-sala-padrao";

  return (
    <button
      className={`multi-sala-btn ${classeNivel} ${aberta ? "multi-sala-on" : ""}`}
      onClick={() => alternar(sala.roomId)}
      title={sala.label}
    >
      <span className="multi-sala-nivel">
        {aberta ? "✓ " : ""}
        {nivel}
      </span>
      {typeof sala.onlineCount === "number" && sala.onlineCount > 0 && (
        <span className="multi-sala-online">{sala.onlineCount}</span>
      )}
    </button>
  );
}
