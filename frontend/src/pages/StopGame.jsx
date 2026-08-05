import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getSocket } from "../socket.js";
import { useAuth } from "../context/AuthContext.jsx";
import ScoreTable from "../components/ScoreTable.jsx";
import SuggestWordButton from "../components/SuggestWordButton.jsx";
import OnlinePlayers from "../components/OnlinePlayers.jsx";
import Chat from "../components/Chat.jsx";

const STATUS_TEXT_CLASS = {
  correct: "word-text-correct",
  duplicate: "word-text-duplicate",
  solo: "word-text-solo",
  wrong: "word-text-wrong",
  blank: "word-text-wrong",
};

const THEMES_PER_ROUND = 6;
// Antes do primeiro sorteio da sala, ainda não existem temas — usamos 6 colunas
// "vazias" (sem nome, sem conteúdo) só para a tabela já nascer com o mesmo formato
// final, ao invés de aparecer sem colunas e depois "pular" para 6 quando sorteia.
const EMPTY_THEME_SLOTS = Array.from({ length: THEMES_PER_ROUND }, (_, i) => ({
  key: `slot-${i}`,
  name: "",
}));

export default function StopGame() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { roomId: roomIdParam } = useParams();
  const roomId = roomIdParam || "stop-sala-1";
  const socketRef = useRef(null);
  const inputRefs = useRef([]);

  const [accessDenied, setAccessDenied] = useState(null); // { roomLabel, required, current } | null
  const [roomLabel, setRoomLabel] = useState("");
  const [minCorrectToStop, setMinCorrectToStop] = useState(0);
  const [stopReady, setStopReady] = useState(false);
  const [stopDenied, setStopDenied] = useState(null); // { correctCount, required } | null
  const [stopOverlay, setStopOverlay] = useState(null); // nickname de quem apertou STOP, ou null

  const [phase, setPhase] = useState("intermission"); // intermission | active | grading
  const [timeLeft, setTimeLeft] = useState(0);
  const [themes, setThemes] = useState([]);
  const [letter, setLetter] = useState(null);
  const [roundNumber, setRoundNumber] = useState(0);
  const [roundInBlock, setRoundInBlock] = useState(0);

  const [answers, setAnswers] = useState({});
  const [lastResult, setLastResult] = useState(null);
  const [blockBonus, setBlockBonus] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [skipVote, setSkipVote] = useState({ votes: 0, needed: 0, minPlayers: 3 });
  const [iVotedSkip, setIVotedSkip] = useState(false);

  // Precisa ser calculado aqui em cima (antes dos useEffect abaixo), já que o
  // atalho de teclado do STOP depende de "canStop" no array de dependências.
  // Nas salas normais, precisa preencher todas as lacunas para poder pedir STOP.
  // Nas salas com exigência de acertos mínimos (ex.: Sala Avançada), o botão só
  // fica verde quando o SERVIDOR confirmar que as palavras certas já bateram o
  // mínimo — o cliente não sabe quais estão certas, só recebe esse "sim/não".
  const filledCount = themes.filter((t) => (answers[t.key] || "").trim().length > 0).length;
  const allFilled = themes.length > 0 && filledCount === themes.length;
  const canStop = phase === "active" && (minCorrectToStop > 0 ? stopReady : allFilled);

  useEffect(() => {
    setAccessDenied(null);
    const socket = getSocket();
    socketRef.current = socket;
    socket.connect();
    socket.emit("join-stop-room", { roomId });

    socket.on("connect_error", (err) => {
      if (err.message === "SESSAO_INVALIDA") {
        logout();
        navigate("/login");
      }
    });

    socket.on("room-access-denied", (data) => {
      setAccessDenied(data);
    });

    socket.on("stop-denied", (data) => {
      setStopDenied(data);
    });

    socket.on("stop-readiness", (data) => {
      setStopReady(!!data.ready);
    });

    socket.on("room-state", (state) => {
      setPhase(state.state);
      setTimeLeft(state.timeLeft);
      setThemes(state.themes || []);
      setLetter(state.letter);
      setRoundNumber(state.roundNumber);
      setRoundInBlock(state.roundInBlock);
      setRoomLabel(state.label || "");
      setMinCorrectToStop(state.minCorrectToStop || 0);
    });

    socket.on("round-intermission", () => {
      setPhase("intermission");
      setIVotedSkip(false);
    });

    socket.on("round-start", (data) => {
      setPhase("active");
      setThemes(data.themes);
      setLetter(data.letter);
      setRoundNumber(data.roundNumber);
      setRoundInBlock(data.roundInBlock);
      setAnswers({});
      setLastResult(null);
      setBlockBonus(null);
      setIVotedSkip(false);
      setStopOverlay(null);
      setStopDenied(null);
      setStopReady(false);
    });

    socket.on("player-stopped", (data) => {
      setStopOverlay(data.nickname || "Alguém");
    });

    socket.on("skip-vote-update", (data) => {
      setSkipVote(data);
    });

    socket.on("tick", (data) => {
      setPhase(data.state);
      setTimeLeft(data.timeLeft);
    });

    socket.on("round-result", (data) => {
      setPhase("grading");
      setLastResult(data);
    });

    socket.on("block-bonus", (data) => {
      setBlockBonus(data.bonusResults);
    });

    socket.on("players-online", (data) => {
      setOnlinePlayers(data.players || []);
    });

    socket.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg].slice(-100));
    });

    return () => {
      socket.off("connect_error");
      socket.off("room-access-denied");
      socket.off("stop-denied");
      socket.off("stop-readiness");
      socket.off("room-state");
      socket.off("round-intermission");
      socket.off("round-start");
      socket.off("player-stopped");
      socket.off("tick");
      socket.off("round-result");
      socket.off("block-bonus");
      socket.off("skip-vote-update");
      socket.off("players-online");
      socket.off("chat-message");
      socket.disconnect();
    };
  }, [roomId]);

  // Assim que a rodada começa, o cursor vai direto para a primeira lacuna —
  // não precisa clicar, já pode começar a digitar.
  useEffect(() => {
    if (phase === "active") {
      inputRefs.current[0]?.focus();
    }
  }, [phase, roundNumber]);

  // Some sozinho depois de alguns segundos, mesmo se algo atrasar a correção.
  useEffect(() => {
    if (!stopOverlay) return;
    const t = setTimeout(() => setStopOverlay(null), 3000);
    return () => clearTimeout(t);
  }, [stopOverlay]);

  useEffect(() => {
    if (!stopDenied) return;
    const t = setTimeout(() => setStopDenied(null), 3000);
    return () => clearTimeout(t);
  }, [stopDenied]);

  // Atalho de teclado: Ctrl+Enter (ou Cmd+Enter no Mac) dá STOP (quando permitido).
  // O Enter sozinho fica livre para navegar entre as lacunas (e para o chat),
  // sem risco de disparar STOP sem querer no meio da digitação.
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== "Enter" || !(e.ctrlKey || e.metaKey)) return;
      if (e.target?.closest?.(".chat-input")) return;
      if (canStop) {
        e.preventDefault();
        handleStop();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canStop]);

  function updateAnswer(themeKey, value) {
    const next = { ...answers, [themeKey]: value };
    setAnswers(next);
    socketRef.current?.emit("submit-answers", { answers: next });
  }

  function handleStop() {
    socketRef.current?.emit("stop");
  }

  function handleVoteSkip() {
    if (iVotedSkip) return;
    setIVotedSkip(true);
    socketRef.current?.emit("vote-skip-intermission");
  }

  function sendChat(message) {
    socketRef.current?.emit("chat-message", { message });
  }

  function nicknameFor(userId) {
    return onlinePlayers.find((p) => p.userId === userId)?.nickname;
  }

  const me = onlinePlayers.find((p) => p.userId === user?.id);

  // Monta as linhas da tabela conforme a fase do jogo — mas o componente que
  // efetivamente desenha a tabela (ScoreTable) é sempre o mesmo, então a
  // estrutura visual nunca diverge entre "preenchendo" e "resultado".
  let tableThemes = themes;
  let tableRows = [];
  let statusText = "Aguarde o sorteio da letra...";
  let roundLabel = "PTS";

  if (phase === "active") {
    statusText = "Preencha as lacunas!";
    tableRows = [
      {
        userId: user?.id,
        nickname: user?.nickname,
        points: "—",
        blockTotal: "—",
        cells: Object.fromEntries(
          themes.map((t, idx) => [
            t.key,
            <input
              key={t.key}
              ref={(el) => (inputRefs.current[idx] = el)}
              className="sheet-fill-input"
              value={answers[t.key] || ""}
              placeholder={letter || ""}
              maxLength={40}
              autoComplete="off"
              onChange={(e) => updateAnswer(t.key, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  inputRefs.current[idx + 1]?.focus();
                  return;
                }
                if (e.key === "Backspace" && !(answers[t.key] || "")) {
                  e.preventDefault();
                  inputRefs.current[idx - 1]?.focus();
                }
              }}
            />,
          ])
        ),
      },
    ];
  } else if (lastResult) {
    statusText = `Resultado da rodada ${lastResult.roundNumber}`;
    roundLabel = "PTS";
    tableThemes = lastResult.themes;
    tableRows = lastResult.players.map((p) => ({
      userId: p.userId,
      nickname: p.nickname,
      points: p.points ?? "—",
      blockTotal: p.blockTotal ?? 0,
      cells: Object.fromEntries(
        lastResult.themes.map((t) => {
          const g = p.graded?.[t.key];
          const isMine = user?.id && p.userId === user.id;
          const canSuggest = isMine && g?.status === "wrong" && g?.word;
          return [
            t.key,
            <>
              <span className={STATUS_TEXT_CLASS[g?.status || "blank"]}>{g?.word || "—"}</span>
              {canSuggest && <SuggestWordButton themeKey={t.key} letter={lastResult.letter} word={g.word} />}
            </>,
          ];
        })
      ),
    }));
  } else {
    tableThemes = EMPTY_THEME_SLOTS;
    tableRows = [
      {
        userId: user?.id,
        nickname: user?.nickname,
        points: "—",
        blockTotal: "—",
        cells: Object.fromEntries(EMPTY_THEME_SLOTS.map((t) => [t.key, null])),
      },
    ];
  }

  if (accessDenied) {
    return (
      <div className="sc-root">
        <div className="sc-denied-panel">
          <div className="sc-denied-icon">{accessDenied.full ? "👥" : "🔒"}</div>
          <h2>{accessDenied.full ? "Sala lotada" : "Acesso restrito"}</h2>
          {accessDenied.full ? (
            <p>
              A <strong>{accessDenied.roomLabel}</strong> já está com o máximo de{" "}
              <strong>{accessDenied.maxPlayers} jogadores</strong> online. Tenta de novo daqui a pouco!
            </p>
          ) : (
            <>
              <p>
                A <strong>{accessDenied.roomLabel}</strong> exige pelo menos{" "}
                <strong>{accessDenied.required} pontos vitalícios</strong> no jogo Stop.
              </p>
              <p style={{ color: "var(--text-dim)" }}>
                Você tem <strong>{accessDenied.current}</strong> pontos até agora — continue jogando na
                sala padrão para subir de patente e desbloquear essa sala.
              </p>
            </>
          )}
          <Link to="/" className="btn">Voltar ao Lobby</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sc-root">
      {stopOverlay && (
        <div className="sc-stop-toast">
          <div className="sc-stop-toast-icon">🛑</div>
          <div className="sc-stop-toast-title">STOP!</div>
          <div className="sc-stop-toast-name">{stopOverlay}</div>
        </div>
      )}

      <header className="sc-topbar">
        <div className="sc-topbar-left">
          <div className="sc-topbar-badges">
            <div className="sc-gloss-badge">Pts Sala: {me?.roomLifetimePoints ?? 0}</div>
            <div className="sc-gloss-badge">Pts Total: {me?.lifetimePoints ?? 0}</div>
          </div>

          <div className="sc-topbar-status">
            {roomLabel && <span className="sc-room-label-inline">{roomLabel}</span>}
          </div>

          <button
            className="sc-skip-btn"
            onClick={handleVoteSkip}
            disabled={phase !== "intermission" || iVotedSkip || skipVote.needed < skipVote.minPlayers}
            title={
              phase !== "intermission"
                ? "Só disponível durante o intervalo entre rodadas"
                : skipVote.needed < skipVote.minPlayers
                ? `Precisa de ${skipVote.minPlayers}+ jogadores na sala para votar`
                : "Vote para pular a espera"
            }
          >
            {iVotedSkip ? "Voto registrado ✓" : "Pular espera"}
            {phase === "intermission" && skipVote.needed >= skipVote.minPlayers && ` (${skipVote.votes}/${skipVote.needed})`}
          </button>
        </div>

        <div className="sc-topbar-logo">
          <Link to="/" className="room-exit-btn" title="Sair da sala">
            🚪 Sair da sala
          </Link>
          <img src="/stop-logo.png" alt="Stop!" className="sc-logo-img" />
        </div>
      </header>

      <div className="sc-round-info">
        Rodada {roundNumber} • {roundInBlock}/10 do bloco atual
      </div>

      {blockBonus && (
        <div className="sc-bonus-banner">
          🏆 Bônus do bloco:{" "}
          {blockBonus.map((b, i) => (
            <span key={b.userId}>
              {i > 0 && " · "}
              {nicknameFor(b.userId) || b.userId} +{b.bonus}
            </span>
          ))}
        </div>
      )}

      <div className="sc-retro-panel sc-table-panel">
        <div className="sc-panel-title-row">
          <div className="sc-timerletter">
            <div className="sc-timer-chip">{timeLeft}s</div>
            <div className="sc-timerletter-dash" />
            <div className="sc-letter-chip">{letter || "-"}</div>
          </div>
          <div className="sc-panel-title-text">{statusText}</div>
        </div>

        {minCorrectToStop > 0 && (
          <div className="sc-min-correct-hint">
            ⚡ Nesta sala é preciso ter pelo menos <strong>{minCorrectToStop}</strong> palavras
            certas para pedir STOP.
          </div>
        )}

        {stopDenied && (
          <div className="sc-stop-denied-hint">
            ❌ Você ainda não tem palavras corretas suficientes para pedir STOP nesta sala.
          </div>
        )}

        <div className="sc-table-scroll">
          <ScoreTable themes={tableThemes} rows={tableRows} roundLabel={roundLabel} />
        </div>

        <div className="sc-stop-bar">
          <button
            className={`sc-stop-btn ${canStop ? "sc-stop-btn-ready" : "sc-stop-btn-waiting"}`}
            disabled={!canStop}
            onClick={handleStop}
          >
            STOP! <span className="sc-stop-shortcut-inline">(CTRL+ENTER)</span>
          </button>
        </div>
      </div>

      <div className="sc-bottom-grid">
        <div className="sc-retro-panel sc-tab-panel sc-chat-panel">
          <div className="sc-retro-tab sc-retro-tab-right">chat</div>
          <Chat messages={messages} onSend={sendChat} />
        </div>

        <div className="sc-retro-panel sc-tab-panel sc-legend-panel">
          <div className="sc-retro-tab">pontuação</div>
          <ul className="sc-legend-list">
            <li><span className="sc-swatch sc-swatch-wrong" /> 0 pontos — errada ou em branco</li>
            <li><span className="sc-swatch sc-swatch-duplicate" /> 5 pontos — repetida</li>
            <li><span className="sc-swatch sc-swatch-correct" /> 10 pontos — única</li>
            <li><span className="sc-swatch sc-swatch-solo" /> 15 pontos — só você acertou o tema</li>
          </ul>
          <div className="sc-legend-bonus">Bônus a cada 10 rodadas: 🥇+150 🥈+100 🥉+50</div>
        </div>

        <div className="sc-retro-panel sc-tab-panel sc-players-panel">
          <div className="sc-retro-tab">jogadores ({onlinePlayers.length})</div>
          <OnlinePlayers players={onlinePlayers} />
        </div>
      </div>
    </div>
  );
}
