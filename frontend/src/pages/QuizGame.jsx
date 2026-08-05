import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSocket } from "../socket.js";
import { useAuth } from "../context/AuthContext.jsx";
import Chat from "../components/Chat.jsx";
import QuizTimerRing from "../components/QuizTimerRing.jsx";

export default function QuizGame() {
  const { user } = useAuth();
  const { roomId } = useParams();
  const socketRef = useRef(null);
  const inputRef = useRef(null);

  const [roomLabel, setRoomLabel] = useState("");
  const [phase, setPhase] = useState("intermission"); // intermission | active
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(40);
  const [question, setQuestion] = useState(null);
  const [masked, setMasked] = useState("");
  const [lastResult, setLastResult] = useState(null); // { winner, answer } | null
  const [guess, setGuess] = useState("");
  const [wrongFlash, setWrongFlash] = useState(false);
  const [wrongLog, setWrongLog] = useState([]);
  const [messages, setMessages] = useState([]);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [roomFull, setRoomFull] = useState(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    socket.connect();
    socket.emit("join-quiz-room", { roomId });

    socket.on("quiz-room-full", (data) => setRoomFull(data));

    socket.on("quiz-room-state", (state) => {
      setRoomLabel(state.label || "");
      setPhase(state.state);
      setTimeLeft(state.timeLeft);
      setQuestion(state.question);
      setMasked(state.masked || "");
    });

    socket.on("quiz-intermission", () => {
      setPhase("intermission");
      setQuestion(null);
      setGuess("");
    });

    socket.on("quiz-question-start", (data) => {
      setPhase("active");
      setQuestion(data.question);
      setMasked(data.masked);
      setLastResult(null);
      setGuess("");
      setWrongLog([]);
      setTotalSeconds(data.seconds || 40);
    });

    socket.on("quiz-reveal-update", (data) => setMasked(data.masked));

    socket.on("quiz-tick", (data) => {
      setPhase(data.state);
      setTimeLeft(data.timeLeft);
    });

    socket.on("quiz-question-result", (data) => {
      setLastResult(data);
      setPhase("intermission");
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
  }, [phase, question]);

  function handleGuessSubmit(e) {
    e.preventDefault();
    if (!guess.trim() || phase !== "active") return;
    socketRef.current?.emit("quiz-submit-guess", { guess: guess.trim() });
    setGuess("");
  }

  function sendChat(message) {
    socketRef.current?.emit("quiz-chat-message", { message });
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

  return (
    <div className="quiz-root">
      <div className="quiz-topbar">
        <div className="quiz-topbar-title">❓ Quiz — {roomLabel}</div>
        <QuizTimerRing timeLeft={timeLeft} totalSeconds={phase === "active" ? totalSeconds : 8} />
      </div>

      <div className="quiz-main-row">
        <div className="card quiz-question-card">
          {phase === "active" && question ? (
            <>
              <div className="quiz-question-text">{question}</div>
              <div className={`quiz-masked-answer ${wrongFlash ? "quiz-masked-wrong" : ""}`}>
                {masked.split("").map((ch, i) => (
                  <span key={i} className="quiz-letter-box">{ch === " " ? "\u00A0" : ch}</span>
                ))}
              </div>
              <form onSubmit={handleGuessSubmit} className="quiz-guess-form">
                <input
                  ref={inputRef}
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Digite sua resposta..."
                  autoComplete="off"
                />
                <button className="btn success" type="submit">Responder</button>
              </form>
            </>
          ) : (
            <div className="quiz-waiting">
              {lastResult ? (
                lastResult.winner ? (
                  <>
                    <div className="quiz-result-winner">✅ {lastResult.winner} acertou!</div>
                    <div className="quiz-result-answer">Resposta: <strong>{lastResult.answer}</strong></div>
                  </>
                ) : (
                  <div className="quiz-result-nobody">⏰ Ninguém acertou dessa vez.</div>
                )
              ) : (
                <div>Aguardando a próxima pergunta...</div>
              )}
              <div className="quiz-next-timer">Próxima pergunta em {timeLeft}s</div>
            </div>
          )}
        </div>

        {/* Log de respostas erradas — visível por todo mundo na sala */}
        <div className="card quiz-wrong-log-panel">
          <h4 style={{ marginTop: 0 }}>❌ Errando</h4>
          <div className="quiz-wrong-log-list">
            {wrongLog.length === 0 && <div className="quiz-wrong-log-empty">Ninguém errou ainda nessa pergunta.</div>}
            {wrongLog
              .slice()
              .reverse()
              .map((w, i) => (
                <div key={i} className="quiz-wrong-log-item">{w.nickname}</div>
              ))}
          </div>
        </div>
      </div>

      <div className="quiz-bottom-grid">
        <div className="card quiz-chat-panel">
          <h3 style={{ marginTop: 0 }}>Chat</h3>
          <Chat messages={messages} onSend={sendChat} />
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Jogadores ({onlinePlayers.length})</h3>
          <table className="player-table">
            <tbody>
              {onlinePlayers.map((p) => (
                <tr key={p.userId}>
                  <td style={{ width: 30 }}>
                    {p.rank?.icon && <img src={p.rank.icon} alt={p.rank.name} style={{ width: 20, height: 20 }} />}
                  </td>
                  <td>{p.nickname}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{p.lifetimePoints}</td>
                </tr>
              ))}
              {onlinePlayers.length === 0 && (
                <tr>
                  <td style={{ color: "var(--text-dim)" }}>Ninguém mais na sala ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
