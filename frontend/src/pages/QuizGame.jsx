import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSocket } from "../socket.js";
import { useAuth } from "../context/AuthContext.jsx";
import Chat from "../components/Chat.jsx";
import QuizTimerRing from "../components/QuizTimerRing.jsx";
import ProfileTooltip from "../components/ProfileTooltip.jsx";

export default function QuizGame() {
  const { user } = useAuth();
  const { roomId } = useParams();
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const wrongLogEndRef = useRef(null);

  const [roomLabel, setRoomLabel] = useState("");
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
      if (data.winner) setAnswerLine(data.answer);
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
        {/* Mesma estrutura sempre — só o texto da pergunta e a linha de letras mudam */}
        <div className="card quiz-question-card">
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
            <button className="btn success" type="submit" disabled={phase !== "active"}>
              Responder
            </button>
          </form>
        </div>

        {/* Log de respostas erradas — visível por todo mundo na sala */}
        <div className="card quiz-wrong-log-panel">
          <h4 style={{ marginTop: 0 }}>❌ Errando</h4>
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
                  <td>
                    <ProfileTooltip userId={p.userId} nickname={p.nickname} />
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{p.roomLifetimePoints}</td>
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
