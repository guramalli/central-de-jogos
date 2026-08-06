import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSocket } from "../socket.js";
import { useAuth } from "../context/AuthContext.jsx";
import Chat from "../components/Chat.jsx";
import QuizTimerRing from "../components/QuizTimerRing.jsx";
import ProfileTooltip from "../components/ProfileTooltip.jsx";
import { playQuestionStartSound, playCorrectSound, isSoundMuted, toggleSoundMuted } from "../utils/sounds.js";
import SuggestQuestionForm from "../components/SuggestQuestionForm.jsx";

const THEME_ICONS = {
  esportes: "⚽",
  ciencias: "🧪",
  historia: "🏛️",
  cinema: "🎬",
  letras: "📚",
};

export default function QuizGame() {
  const { user } = useAuth();
  const { roomId } = useParams();
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const wrongLogEndRef = useRef(null);

  const [roomLabel, setRoomLabel] = useState("");
  const [themeKey, setThemeKey] = useState("");
  const [phase, setPhase] = useState("intermission"); // intermission | active
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(40);

  // A "pergunta" e a "dica" (linha de letras) são as ÚNICAS coisas que mudam
  // entre preenchendo e aguardando — o resto da tabela (formulário, tamanho)
  // fica sempre igual, pra não dar aquele "pulo" visual entre os estados.
  const [questionText, setQuestionText] = useState("Aguardando a primeira pergunta...");
  const [answerLine, setAnswerLine] = useState("");

  const [guess, setGuess] = useState("");
  const [wrongFlash, setWrongFlash] = useState(false);
  const [wrongLog, setWrongLog] = useState([]);
  const [messages, setMessages] = useState([]);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [roomFull, setRoomFull] = useState(null);
  const [muted, setMuted] = useState(isSoundMuted());

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    socket.connect();
    socket.emit("join-quiz-room", { roomId });

    socket.on("quiz-room-full", (data) => setRoomFull(data));

    socket.on("quiz-room-state", (state) => {
      setRoomLabel(state.label || "");
      setThemeKey(state.themeKey || "");
      setPhase(state.state);
      setTimeLeft(state.timeLeft);
      if (state.question) {
        setQuestionText(state.question);
        setAnswerLine(state.masked || "");
      }
    });

    socket.on("quiz-intermission", () => {
      setPhase("intermission");
      setGuess("");
    });

    socket.on("quiz-question-start", (data) => {
      setPhase("active");
      setQuestionText(data.question);
      setAnswerLine(data.masked);
      setGuess("");
      setWrongLog([]);
      setTotalSeconds(data.seconds || 40);
      playQuestionStartSound();
    });

    socket.on("quiz-reveal-update", (data) => setAnswerLine(data.masked));

    socket.on("quiz-tick", (data) => {
      setPhase(data.state);
      setTimeLeft(data.timeLeft);
    });

    socket.on("quiz-question-result", (data) => {
      setPhase("intermission");
      // Se alguém ganhou, revela a resposta certa na mesma "linha de dica".
      // Se ninguém acertou, mantém como estava (nunca revela a resposta).
      if (data.winner) {
        setAnswerLine(data.answer);
        playCorrectSound();
      }
    });

    socket.on("quiz-guess-wrong", () => {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 500);
    });

    socket.on("quiz-wrong-log", (data) => {
      setWrongLog((prev) => [...prev, data].slice(-30));
    });

    socket.on("quiz-players-online", (data) => setOnlinePlayers(data.players || []));
    socket.on("quiz-chat-message", (msg) => setMessages((prev) => [...prev, msg].slice(-100)));

    return () => {
      socket.off("quiz-room-full");
      socket.off("quiz-room-state");
      socket.off("quiz-intermission");
      socket.off("quiz-question-start");
      socket.off("quiz-reveal-update");
      socket.off("quiz-tick");
      socket.off("quiz-question-result");
      socket.off("quiz-guess-wrong");
      socket.off("quiz-wrong-log");
      socket.off("quiz-players-online");
      socket.off("quiz-chat-message");
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (phase === "active") inputRef.current?.focus();
  }, [phase, questionText]);

  useEffect(() => {
    wrongLogEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [wrongLog]);

  function handleGuessSubmit(e) {
    e.preventDefault();
    if (!guess.trim() || phase !== "active") return;
    socketRef.current?.emit("quiz-submit-guess", { guess: guess.trim() });
    setGuess("");
  }

  function sendChat(message) {
    socketRef.current?.emit("quiz-chat-message", { message });
  }

  function handleToggleMute() {
    setMuted(toggleSoundMuted());
  }

  if (roomFull) {
    return (
      <div className="sc-denied-panel" style={{ marginTop: 40 }}>
        <div className="sc-denied-icon">👥</div>
        <h2>Sala lotada</h2>
        <p>
          A sala <strong>{roomFull.roomLabel}</strong> já está com o máximo de{" "}
          <strong>{roomFull.maxPlayers} jogadores</strong>. Tenta outro tema ou espera um pouco!
        </p>
        <Link to="/jogos/quiz" className="btn">Voltar pro Quiz</Link>
      </div>
    );
  }

  const me = onlinePlayers.find((p) => p.userId === user?.id);

  return (
    <div className="quiz-root">
      <div className="quiz-stats-bar">
        <div className="quiz-topbar-badges">
          <img src="/quiz-logo.png" alt="Quiz!" className="quiz-room-logo" />
          <div className="quiz-gloss-badge">
            <span className="quiz-badge-label">Pts Sala:</span> {me?.roomLifetimePoints ?? 0}
          </div>
          <div className="quiz-gloss-badge">
            <span className="quiz-badge-label">Pts Total:</span> {me?.lifetimePoints ?? 0}
          </div>
        </div>
        <div className="quiz-topbar-title">
          <span className="quiz-theme-badge">{THEME_ICONS[themeKey] || "❓"}</span>
          <span className="quiz-theme-name">{roomLabel}</span>
        </div>
        <div className="quiz-timer-group">
          <Link to="/jogos/quiz" className="room-exit-btn" title="Sair da sala">
            🚪 Sair da sala
          </Link>
          <button
            className="quiz-mute-btn"
            onClick={handleToggleMute}
            title={muted ? "Ativar som" : "Desativar som"}
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <QuizTimerRing timeLeft={timeLeft} totalSeconds={phase === "active" ? totalSeconds : 8} />
        </div>
      </div>

      <div className="quiz-game-grid">
        {/* Mesma estrutura sempre — só o texto da pergunta e a linha de letras mudam */}
        <div className="quiz-panel quiz-question-card">
          <div className="quiz-question-text">{questionText}</div>
          <div className={`quiz-masked-answer ${wrongFlash ? "quiz-masked-wrong" : ""}`}>
            {answerLine.split("").map((ch, i) => (
              <span key={i} className="quiz-letter-box">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </div>
          <form onSubmit={handleGuessSubmit} className="quiz-guess-form">
            <input
              ref={inputRef}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder={phase === "active" ? "Digite sua resposta..." : "Aguarde a próxima pergunta..."}
              autoComplete="off"
              disabled={phase !== "active"}
            />
            <button className="quiz-answer-btn" type="submit" disabled={phase !== "active"}>
              Responder
            </button>
          </form>
        </div>

        {/* Log de respostas erradas — visível por todo mundo na sala */}
        <div className="quiz-panel quiz-wrong-log-panel">
          <h4 className="quiz-panel-title"><span>✕</span> Errando</h4>
          <div className="quiz-wrong-log-list">
            {wrongLog.length === 0 && <div className="quiz-wrong-log-empty">Ninguém errou ainda nessa pergunta.</div>}
            {wrongLog.map((w, i) => (
              <div key={i} className="quiz-wrong-log-item">{w.guess}</div>
            ))}
            <div ref={wrongLogEndRef} />
          </div>
        </div>
      </div>

      <div className="quiz-bottom-grid">
        <div className="quiz-panel quiz-chat-panel">
          <h3 className="quiz-panel-title">Chat</h3>
          <Chat messages={messages} onSend={sendChat} />
        </div>
        <div className="quiz-panel quiz-players-panel">
          <h3 className="quiz-panel-title">Jogadores ({onlinePlayers.length})</h3>
          <div className="quiz-players-list">
            {onlinePlayers.map((p) => (
              <div key={p.userId} className="quiz-player-row">
                <div className="quiz-player-name">
                  {p.rank?.icon && <img src={p.rank.icon} alt={p.rank.name} className="quiz-player-rank-icon" />}
                  <ProfileTooltip userId={p.userId} nickname={p.nickname} gameKey="quiz" />
                </div>
                <span className="quiz-player-points">{p.roomLifetimePoints}</span>
              </div>
            ))}
            {onlinePlayers.length === 0 && (
              <div className="quiz-wrong-log-empty">Ninguém mais na sala ainda.</div>
            )}
          </div>
        </div>
      </div>

      <SuggestQuestionForm themeKey={themeKey} />
    </div>
  );
}
