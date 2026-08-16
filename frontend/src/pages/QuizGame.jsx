import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSocket } from "../socket.js";
import { useAuth } from "../context/AuthContext.jsx";
import Chat from "../components/Chat.jsx";
import QuizTimerRing from "../components/QuizTimerRing.jsx";
import ProfileTooltip from "../components/ProfileTooltip.jsx";
import { playQuestionStartSound, playCorrectSound, isSoundMuted, toggleSoundMuted } from "../utils/sounds.js";
import SuggestQuestionForm from "../components/SuggestQuestionForm.jsx";
import ReportQuestionModal from "../components/ReportQuestionModal.jsx";
import InviteButton from "../components/InviteButton.jsx";
import FriendsQuickChat from "../components/FriendsQuickChat.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import Seo from "../components/Seo.jsx";
import FaixaPatente from "../components/FaixaPatente.jsx";
import { useIsMobile } from "../utils/useIsMobile.js";

// Formata o tempo de resposta no padrão "8s 342ms" — o mesmo formato que a
// Central de Jogos usava, que deixa clara a disputa por décimo de segundo.
function formatElapsed(ms) {
  if (ms === undefined || ms === null) return "0s 000ms";
  const seconds = Math.floor(ms / 1000);
  const millis = ms % 1000;
  return `${seconds}s ${String(millis).padStart(3, "0")}ms`;
}

const THEME_ICONS = {
  mitologia: "🏛️",
  games: "🎮",
  terceirao: "🎓",
  esportes: "🏅",
  futebol: "⚽",
  automobilismo: "🏎️",
  anime: "🎌",
  ciencias: "🧪",
  historia: "🏛️",
  cinema: "🎬",
  letras: "📚",
  geral: "🧠",
  musica: "🎵",
  series: "📺",
  novelas: "🎭",
  geografia: "🌍",
  direito: "⚖️",
};

export default function QuizGame() {
  const { user } = useAuth();

  // Moderação de chat: moderadores e admins podem apagar mensagens.
  // O servidor confere o cargo de novo antes de apagar — isto aqui só
  // decide se o botão aparece.
  const podeModerar = user?.role === "ADMIN" || user?.role === "MODERATOR";
  function apagarMensagem(id) {
    socketRef.current?.emit("delete-chat-message", { escopo: "quiz", id });
  }
  const { theme } = useTheme();
  const { roomId } = useParams();
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const wrongLogEndRef = useRef(null);

  const [roomLabel, setRoomLabel] = useState("");
  const isMobile = useIsMobile();
  // Mesmo padrão do Stop: no celular os painéis viram abas, senão a pessoa
  // precisa rolar demais pra ver chat e jogadores — e acaba não usando.
  const [abaMobile, setAbaMobile] = useState("jogo");
  const [turnInfo, setTurnInfo] = useState(null); // { round, total } | null — só nas arenas
  const [questionId, setQuestionId] = useState(null);
  const [turnRanking, setTurnRanking] = useState([]);
  // Na arena, quem já acertou a pergunta atual para de ver ela — não tem
  // mais o que fazer nessa rodada, e evita ficar olhando à toa.
  const [alreadyScored, setAlreadyScored] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
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
  // Histórico das respostas que a pessoa enviou nessa pergunta, navegável
  // com as setas ↑ e ↓ (igual no terminal).
  const [guessHistory, setGuessHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(null);
  const [pasteBlockedMsg, setPasteBlockedMsg] = useState(false);
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

    // Se o servidor reiniciar (ex.: um deploy) ou a conexão cair e voltar, o
    // socket reconecta sozinho — mas o servidor novo não sabe que estávamos
    // nesta sala. Sem reenviar o join, a tela ficaria congelada na última
    // pergunta, dando impressão de travamento. Este listener refaz a entrada
    // a cada reconexão, trazendo o estado atual da sala.
    const reentrarNaSala = () => {
      socket.emit("join-quiz-room", { roomId });
    };
    socket.on("connect", reentrarNaSala);

    // Movimento em outra sala: aparece no chat como mensagem do sistema,
    // pra quem está sozinho saber onde tem gente em vez de desistir.
    socket.on("aviso-atividade", (data) => {
      if (data.roomId === roomId) return; // já estou nessa sala
      if (data.userId && data.userId === user?.id) return; // o aviso é sobre mim mesmo (outra aba)
      setMessages((prev) => [
        ...prev,
        { system: true, atividade: true, message: data.mensagem, at: data.at },
      ].slice(-200));
    });

    socket.on("quiz-room-full", (data) => setRoomFull(data));

    socket.on("quiz-room-state", (state) => {
      setRoomLabel(state.label || "");
      setThemeKey(state.themeKey || "");
      setPhase(state.state);
      setTimeLeft(state.timeLeft);
      setTurnInfo(state.roundsPerTurn ? { round: state.turnRound, total: state.roundsPerTurn } : null);
      if (state.question) {
        setQuestionText(state.question);
        setQuestionId(state.questionId || null);
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
      setQuestionId(data.questionId || null);
      setAnswerLine(data.masked);
      setGuess("");
      setGuessHistory([]);
      setHistoryIndex(null);
      setWrongLog([]);
      setAlreadyScored(false);
      setTotalSeconds(data.seconds || 40);
      if (data.roundsPerTurn) setTurnInfo({ round: data.turnRound, total: data.roundsPerTurn });
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
      // Modo arena: mostra o ranking acumulado do turno no painel da pergunta.
      if (data.turnRanking) {
        setTurnRanking(data.turnRanking);
        // Na arena a resposta nunca é revelada — o painel vira o placar
        // do turno, e a mesma pergunta pode voltar em turnos futuros.
        // O som de acerto já tocou no momento em que a pessoa acertou
        // (evento quiz-guess-correct-multi), então não repete aqui.
      }
    });

    socket.on("quiz-turn-finished", (data) => {
      setTurnRanking(data.ranking || []);
    });

    socket.on("quiz-guess-correct-multi", () => {
      setAlreadyScored(true);
      setGuess("");
      playCorrectSound();
    });

    socket.on("quiz-guess-wrong", () => {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 500);
    });

    socket.on("quiz-answer-log", (data) => {
      setWrongLog((prev) => [...prev, data].slice(-40));
    });

    socket.on("quiz-players-online", (data) => setOnlinePlayers(data.players || []));
    socket.on("quiz-chat-message", (msg) => setMessages((prev) => [...prev, msg].slice(-100)));
    // Moderador apagou uma mensagem: some da tela de todo mundo na sala.
    socket.on("chat-message-deleted", ({ id }) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    });

    return () => {
      socket.off("connect", reentrarNaSala);
      socket.off("quiz-room-full");
      socket.off("quiz-room-state");
      socket.off("quiz-intermission");
      socket.off("quiz-question-start");
      socket.off("quiz-reveal-update");
      socket.off("quiz-tick");
      socket.off("quiz-question-result");
      socket.off("quiz-turn-finished");
      socket.off("quiz-guess-correct-multi");
      socket.off("quiz-guess-wrong");
      socket.off("quiz-answer-log");
      socket.off("quiz-players-online");
      socket.off("chat-message-deleted");
      socket.off("quiz-chat-message");
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (phase !== "active") return;
    // O campo fica desabilitado durante o intervalo, e navegador nenhum
    // deixa focar um campo desabilitado. Por isso o foco espera o próximo
    // quadro de renderização (quando o campo já voltou a ficar ativo) — e
    // tenta de novo logo depois, como rede de segurança pra celular, que
    // às vezes demora um pouco mais pra liberar o campo.
    const focar = () => inputRef.current?.focus();
    const raf = requestAnimationFrame(focar);
    const retry = setTimeout(focar, 120);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(retry);
    };
  }, [phase, questionText]);

  useEffect(() => {
    wrongLogEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [wrongLog]);

  useEffect(() => {
    if (!pasteBlockedMsg) return;
    const t = setTimeout(() => setPasteBlockedMsg(false), 3000);
    return () => clearTimeout(t);
  }, [pasteBlockedMsg]);

  function handleGuessSubmit(e) {
    e.preventDefault();
    if (!guess.trim() || phase !== "active") return;
    const sent = guess.trim();
    socketRef.current?.emit("quiz-submit-guess", { guess: sent });
    // Guarda no histórico pra dar pra recuperar com as setas do teclado —
    // útil quando erra por uma letra e quer corrigir sem redigitar tudo.
    setGuessHistory((prev) => [...prev, sent].slice(-20));
    setHistoryIndex(null);
    setGuess("");
  }

  // Navega pelo histórico de respostas com as setas ↑ e ↓, igual funciona
  // no terminal: ↑ volta pras anteriores, ↓ avança de volta pro campo vazio.
  function handleGuessKeyDown(e) {
    if (guessHistory.length === 0) return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const nextIdx = historyIndex === null ? guessHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setGuess(guessHistory[nextIdx]);
      // Joga o cursor pro fim do texto, pra já poder editar direto
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (el) el.setSelectionRange(el.value.length, el.value.length);
      });
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === null) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= guessHistory.length) {
        // Passou do último: volta pro campo vazio, pronto pra digitar novo
        setHistoryIndex(null);
        setGuess("");
      } else {
        setHistoryIndex(nextIdx);
        setGuess(guessHistory[nextIdx]);
      }
    }
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
  // Nas arenas, o intervalo entre perguntas é longo (10s) de propósito —
  // esse tempo é usado pra mostrar o placar do turno no lugar da pergunta.
  const isArenaBreak = !!turnInfo && phase === "intermission";

  return (
    <div className="quiz-root" data-quiz-theme={themeKey || undefined}>
      <Seo title={roomLabel ? `Quiz — ${roomLabel}` : "Quiz"} description="Jogando Quiz com a galera na Educação Gamer." />
      <div className="quiz-stats-bar">
        <div className="quiz-topbar-badges">
          <img src={theme === "light" ? "/quiz-logo-light.png" : "/quiz-logo.png"} alt="Quiz!" className="quiz-room-logo" />
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
          {turnInfo && (
            <span className="quiz-turn-counter">
              Rodada {turnInfo.round} de {turnInfo.total}
            </span>
          )}
        </div>
        <div className="quiz-timer-group">
          <FriendsQuickChat />
          <InviteButton
            label="Convidar"
            url={`${window.location.origin}/jogos/quiz/${roomId}`}
            message={`Vem jogar Quiz comigo agora, tô na sala de ${roomLabel || "Quiz"}! 🎮`}
          />
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

      <div className={`quiz-game-grid ${isMobile ? `qz-mobile-aba-${abaMobile}` : ""}`}>
        {/* Mesma estrutura sempre — só o texto da pergunta e a linha de letras mudam */}
        <div className="quiz-panel quiz-question-card">
          {isArenaBreak ? (
            <>
              <div className="quiz-retro-tab">placar do turno</div>
              <div className="arena-break-panel">
                <div className="arena-break-header">
                  <span className="arena-break-round">
                    Rodada {turnInfo.round} de {turnInfo.total}
                  </span>
                </div>

                {turnRanking.length === 0 ? (
                  <p className="arena-break-empty">Ninguém pontuou ainda nesse turno.</p>
                ) : (
                  <div className="arena-break-list">
                    {turnRanking.slice(0, 10).map((r) => (
                      <div
                        key={r.userId}
                        className={`arena-break-row ${r.userId === user?.id ? "arena-break-me" : ""} ${
                          r.position <= 3 ? "arena-break-podium" : ""
                        }`}
                      >
                        <span className="arena-break-pos">
                          {r.position <= 3 ? ["🥇", "🥈", "🥉"][r.position - 1] : `${r.position}º`}
                        </span>
                        <span className="arena-break-nick">{r.nickname}</span>
                        <span className="arena-break-pts">{r.points}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="arena-break-next">Próxima pergunta em instantes...</p>
              </div>
            </>
          ) : alreadyScored ? (
            <>
              <div className="quiz-retro-tab">✓ ponto marcado</div>
              <div className="arena-scored-panel">
                <div className="arena-scored-check">✅</div>
                <p className="arena-scored-title">Você acertou!</p>
                <p className="arena-scored-sub">Aguarde a próxima pergunta...</p>
              </div>
            </>
          ) : (
            <>
              <div className="quiz-retro-tab">pergunta</div>
              {questionId && phase === "active" && (
                <button
                  className="quiz-report-btn"
                  onClick={() => setReportOpen(true)}
                  title="Reportar problema nessa pergunta"
                >
                  🚩 <span className="quiz-report-btn-text">reportar erro</span>
                </button>
              )}
              <div className="quiz-question-text" onContextMenu={(e) => e.preventDefault()}>
                {questionText}
              </div>
              <div className={`quiz-masked-answer ${wrongFlash ? "quiz-masked-wrong" : ""}`}>
                {answerLine.split("").map((ch, i) => (
                  <span key={i} className="quiz-letter-box">{ch === " " ? "\u00A0" : ch}</span>
                ))}
              </div>
              {pasteBlockedMsg && (
                <p className="quiz-paste-blocked-hint">🚫 Colar texto não é permitido — precisa digitar a resposta.</p>
              )}
            </>
          )}
          {!isArenaBreak && !alreadyScored && (
            <form onSubmit={handleGuessSubmit} className="quiz-guess-form">
              <input
                ref={inputRef}
                value={guess}
                onChange={(e) => {
                  setGuess(e.target.value);
                  setHistoryIndex(null);
                }}
                onKeyDown={handleGuessKeyDown}
                onPaste={(e) => {
                  e.preventDefault();
                  setPasteBlockedMsg(true);
                }}
                placeholder={phase === "active" ? "Digite sua resposta..." : "Aguarde a próxima pergunta..."}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="send"
              />
              {/* O campo e o botão ficam SEMPRE habilitados de propósito:
                  no celular, o navegador só abre o teclado com toque do
                  usuário — se o campo desabilita a cada intervalo, o foco
                  cai e o teclado fecha, obrigando a pessoa a tocar de novo
                  a cada pergunta. Habilitado direto, um toque no início da
                  sessão basta: o cursor fica no campo e o Enter (tecla
                  "enviar" do teclado) já manda a resposta. Palpite fora da
                  pergunta é ignorado pelo handleGuessSubmit, que confere a
                  fase antes de enviar. */}
              <button className="quiz-answer-btn" type="submit">
                Responder
              </button>
            </form>
          )}
        </div>

        {/* Log de respostas — todas as tentativas da sala, certas e erradas */}
        <div className="quiz-panel quiz-wrong-log-panel">
          <div className="quiz-retro-tab">log</div>
          <div className="quiz-wrong-log-list" style={{ marginTop: 10 }}>
            {wrongLog.length === 0 && (
              <div className="quiz-wrong-log-empty">Nenhuma resposta enviada ainda.</div>
            )}
            {wrongLog.map((w, i) => (
              <div key={i} className={`quiz-log-item ${w.correct ? "quiz-log-item-correct" : ""}`}>
                <span className="quiz-log-time">[{formatElapsed(w.elapsedMs)}]</span>{" "}
                <span className="quiz-log-nick">‹{w.nickname}›</span>{" "}
                <span className="quiz-log-guess">{w.guess}</span>
              </div>
            ))}
            <div ref={wrongLogEndRef} />
          </div>
        </div>
      </div>

      {isMobile && <FaixaPatente me={me} semPontuacao={me?.semPontuacao} />}

      {isMobile && (
        <div className="qz-abas-mobile">
          <button
            className={`qz-aba ${abaMobile === "jogo" ? "qz-aba-ativa" : ""}`}
            onClick={() => setAbaMobile("jogo")}
          >
            🎯 Rodada
          </button>
          <button
            className={`qz-aba ${abaMobile === "chat" ? "qz-aba-ativa" : ""}`}
            onClick={() => setAbaMobile("chat")}
          >
            💬 Chat
          </button>
          <button
            className={`qz-aba ${abaMobile === "jogadores" ? "qz-aba-ativa" : ""}`}
            onClick={() => setAbaMobile("jogadores")}
          >
            👥 {onlinePlayers.length}
          </button>
        </div>
      )}

      <div className={`quiz-bottom-grid ${isMobile ? `qz-mobile-aba-${abaMobile}` : ""}`}>
        <div className="quiz-panel quiz-chat-panel">
          <div className="quiz-retro-tab">chat</div>
          <Chat messages={messages} onSend={sendChat} canModerate={podeModerar} onDelete={apagarMensagem} />
        </div>
        <div className="quiz-panel quiz-players-panel">
          <div className="quiz-retro-tab">jogadores ({onlinePlayers.length})</div>
          <div className="quiz-players-list" style={{ marginTop: 10 }}>
            {onlinePlayers.map((p) => (
              <div key={p.userId} className="quiz-player-row">
                <div className="quiz-player-name">
                  {p.rank?.icon && (
                    <img
                      src={p.rank.icon}
                      alt={p.rank.name}
                      title={p.rank.name}
                      className={`quiz-player-rank-icon${p.rank.brilha ? " rank-badge-icon-brilha" : ""}`}
                    />
                  )}
                  <ProfileTooltip userId={p.userId} nickname={p.nickname} gameKey="quiz" roomId={roomId} />
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

      {reportOpen && questionId && (
        <ReportQuestionModal
          questionId={questionId}
          questionText={questionText}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}
