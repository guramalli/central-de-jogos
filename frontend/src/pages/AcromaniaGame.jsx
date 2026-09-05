import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getSocket } from "../socket.js";
import Chat from "../components/Chat.jsx";
import ProfileTooltip from "../components/ProfileTooltip.jsx";
import InviteButton from "../components/InviteButton.jsx";
import QuizTimerRing from "../components/QuizTimerRing.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import Seo from "../components/Seo.jsx";
import FaixaPatente from "../components/FaixaPatente.jsx";
import { useIsMobile } from "../utils/useIsMobile.js";
import { ehFalhaDeAutenticacao, ROTA_SESSAO_EXPIRADA } from "../utils/sessaoSocket.js";

export default function AcromaniaGame() {
  const { roomId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Moderação de chat: moderadores e admins podem apagar mensagens.
  // O servidor confere o cargo de novo antes de apagar — isto aqui só
  // decide se o botão aparece.
  const podeModerar = user?.role === "ADMIN" || user?.role === "MODERATOR";
  function apagarMensagem(id) {
    socketRef.current?.emit("delete-chat-message", { escopo: "acromania", id });
  }
  const { theme: uiTheme } = useTheme();
  const socketRef = useRef(null);
  const phraseInputRef = useRef(null);

  const [roomLabel, setRoomLabel] = useState("");
  const isMobile = useIsMobile();
  // Mesmo padrão do Stop: no celular os painéis viram abas, senão a pessoa
  // precisa rolar demais pra ver chat e jogadores — e acaba não usando.
  const [abaMobile, setAbaMobile] = useState("jogo");
  const [phase, setPhase] = useState("intermission");
  const [timeLeft, setTimeLeft] = useState(0);
  const [theme, setTheme] = useState("");
  const [letters, setLetters] = useState([]);
  const [totalSeconds, setTotalSeconds] = useState(60);

  const [phraseInput, setPhraseInput] = useState("");
  const [pasteBlockedMsg, setPasteBlockedMsg] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waitingNicknames, setWaitingNicknames] = useState([]);

  const [votingEntries, setVotingEntries] = useState([]);
  const [myVote, setMyVote] = useState(null);
  // Id da MINHA frase nesta rodada, mandado só pra mim pelo servidor. Serve
  // pra desabilitar o botão dela — a lista de votação em si continua anônima.
  const [myEntryId, setMyEntryId] = useState(null);

  const [lastResult, setLastResult] = useState(null);
  const [waitingInfo, setWaitingInfo] = useState(null); // { minPlayersToStart, onlineCount } | null

  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [roomFull, setRoomFull] = useState(false);
  // Mensagem de erro vinda do servidor. Antes o backend emitia
  // "acromania-erro" (manutenção, falha ao entrar) e NINGUÉM escutava —
  // a pessoa ficava olhando uma tela parada sem saber o motivo.
  const [erroServidor, setErroServidor] = useState("");

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    socket.connect();
    socket.emit("join-acromania-room", { roomId });

    // RECONEXÃO. O servidor guarda a sala numa propriedade do socket
    // (`socket.currentAcromaniaRoom`). Quando a conexão cai e volta — troca
    // de rede, Wi-Fi oscilando, aba em segundo plano no celular — o socket
    // no servidor é OUTRO, sem essa propriedade. Sem reenviar o join, o
    // envio da frase e o voto eram descartados EM SILÊNCIO: nenhum erro,
    // nenhum aviso, o botão simplesmente não fazia nada, e só um refresh
    // resolvia. Mesmo tratamento que o Stop e o Quiz já tinham.
    const reentrarNaSala = () => {
      socket.emit("join-acromania-room", { roomId });
    };
    socket.on("connect", reentrarNaSala);

    const aoErro = (data) => setErroServidor(data?.mensagem || "Algo deu errado. Tente recarregar a página.");
    socket.on("acromania-erro", aoErro);
    // Entrou (ou reentrou) com sucesso: limpa qualquer erro antigo da tela.
    socket.on("acromania-room-state", () => setErroServidor(""));

    // Sessão morta (token de 7 dias vencido, ou conta banida). Só falha de
    // AUTENTICAÇÃO desloga — queda de rede e reinício do servidor durante um
    // deploy seguem tratados pela reconexão automática do Socket.IO.
    const aoFalharConexao = (err) => {
      if (!ehFalhaDeAutenticacao(err)) return;
      logout();
      navigate(ROTA_SESSAO_EXPIRADA);
    };
    socket.on("connect_error", aoFalharConexao);

    // Movimento em outra sala: aparece no chat como mensagem do sistema,
    // pra quem está sozinho saber onde tem gente em vez de desistir.
    const aoAvisoAtividade = (data) => {
      if (data.roomId === roomId) return; // já estou nessa sala
      if (data.userId && data.userId === user?.id) return; // o aviso é sobre mim mesmo (outra aba)
      setMessages((prev) => [
        ...prev,
        { system: true, atividade: true, message: data.mensagem, at: data.at },
      ].slice(-200));
    };
    socket.on("aviso-atividade", aoAvisoAtividade);

    socket.on("acromania-room-full", () => setRoomFull(true));

    socket.on("acromania-room-state", (state) => {
      setRoomLabel(state.label || "");
      setPhase(state.state);
      setTimeLeft(state.timeLeft);
      setTheme(state.theme || "");
      setLetters(state.letters || []);
      if (state.writingSeconds) setTotalSeconds(state.writingSeconds);
      if (state.onlineCount < state.minPlayersToStart) {
        setWaitingInfo({ minPlayersToStart: state.minPlayersToStart, onlineCount: state.onlineCount });
      }
    });

    // Aviso de inatividade: entra como mensagem do sistema no chat, que é
    // onde o olho já está durante a partida. Um alerta modal atrapalharia
    // justamente quem está no meio de uma rodada.
    socket.on("aviso-inatividade", (data) => {
      setMessages((prev) => [
        ...prev,
        { system: true, atividade: true, message: `⏳ ${data.mensagem}`, at: Date.now() },
      ].slice(-200));
    });

    socket.on("removido-por-inatividade", (data) => {
      alert(data.mensagem || "Você saiu da sala por inatividade.");
      navigate(-1);
    });

    socket.on("acromania-online-players", (data) => setOnlinePlayers(data.players || []));

    socket.on("acromania-chat-message", (msg) => setMessages((prev) => [...prev, msg]));
    // Moderador apagou uma mensagem: some da tela de todo mundo na sala.
    const aoApagarMensagem = ({ id }) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    };
    socket.on("chat-message-deleted", aoApagarMensagem);

    socket.on("acromania-intermission", (data) => {
      setPhase("intermission");
      // NÃO limpa o resultado aqui. O backend manda "round-result" e, no
      // mesmo instante, "intermission" — então limpar aqui fazia a tela de
      // votos piscar e sumir antes de dar pra ler. O resultado agora fica
      // visível durante toda a contagem do intervalo; quem limpa é o começo
      // da rodada seguinte ("acromania-round-start").
      setSubmitted(false);
      setPhraseInput("");
      setVotingEntries([]);
      setMyVote(null);
      setMyEntryId(null);
      setWaitingNicknames([]);
      setWaitingInfo(
        data?.waitingForPlayers
          ? { minPlayersToStart: data.minPlayersToStart, onlineCount: data.onlineCount }
          : null
      );
    });

    socket.on("acromania-tick", (data) => {
      setPhase(data.state);
      setTimeLeft(data.timeLeft);
    });

    socket.on("acromania-round-start", (data) => {
      setPhase("writing");
      setTheme(data.theme);
      setLetters(data.letters);
      setTotalSeconds(data.seconds);
      setTimeLeft(data.seconds);
      setSubmitted(false);
      setPhraseInput("");
      setLastResult(null);
      setWaitingNicknames([]);
      setWaitingInfo(null);
    });

    socket.on("acromania-phrase-submitted", () => setSubmitted(true));

    socket.on("acromania-submissions-update", (data) => setWaitingNicknames(data.nicknames || []));

    socket.on("acromania-voting-start", (data) => {
      setPhase("voting");
      setVotingEntries(data.entries || []);
      setTotalSeconds(data.seconds);
      setTimeLeft(data.seconds);
      setMyVote(null);
      setMyEntryId(null);
    });

    socket.on("acromania-minha-frase", (data) => setMyEntryId(data?.entryId || null));

    // Confirmação do servidor. Antes este handler era vazio e o voto era
    // marcado na tela de forma otimista, então um voto RECUSADO (na própria
    // frase) aparecia como registrado e a pessoa ficava sem votar sem saber.
    socket.on("acromania-vote-registered", (data) => {
      if (data?.entryId) setMyVote(data.entryId);
    });

    socket.on("acromania-round-result", (data) => {
      setPhase("grading");
      setLastResult(data);
      setVotingEntries([]);
    });

    return () => {
      socket.off("connect_error", aoFalharConexao);
      // Faltava remover: sem isto, cada entrada numa sala empilhava mais um
      // handler preso ao roomId antigo (o socket é singleton).
      socket.off("aviso-atividade", aoAvisoAtividade);
      socket.off("acromania-room-full");
      socket.off("acromania-room-state");
      socket.off("acromania-online-players");
      socket.off("chat-message-deleted", aoApagarMensagem);
      socket.off("acromania-chat-message");
      socket.off("acromania-intermission");
      socket.off("acromania-tick");
      socket.off("acromania-round-start");
      socket.off("acromania-phrase-submitted");
      socket.off("acromania-submissions-update");
      socket.off("acromania-voting-start");
      socket.off("acromania-vote-registered");
      socket.off("acromania-minha-frase");
      socket.off("acromania-round-result");
      socket.off("connect", reentrarNaSala);
      socket.off("acromania-erro", aoErro);
      socket.off("aviso-inatividade");
      socket.off("removido-por-inatividade");
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (phase !== "writing" || submitted) return;
    // Espera o próximo quadro de renderização pra garantir que o campo já
    // existe na tela antes de focar, com uma segunda tentativa como rede
    // de segurança pro celular.
    const focar = () => phraseInputRef.current?.focus();
    const raf = requestAnimationFrame(focar);
    const retry = setTimeout(focar, 120);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(retry);
    };
  }, [phase, submitted]);

  useEffect(() => {
    if (!pasteBlockedMsg) return;
    const t = setTimeout(() => setPasteBlockedMsg(false), 3000);
    return () => clearTimeout(t);
  }, [pasteBlockedMsg]);

  function submitPhrase(e) {
    e.preventDefault();
    if (!phraseInput.trim() || submitted) return;
    socketRef.current?.emit("acromania-submit-phrase", { phrase: phraseInput.trim() });
  }

  function castVote(entryId) {
    if (myVote) return;
    if (entryId === myEntryId) return; // não pode votar na própria frase
    // Sem marcação otimista: quem confirma é o servidor, no
    // "acromania-vote-registered". Assim a tela nunca mente sobre o voto.
    socketRef.current?.emit("acromania-vote", { entryId });
  }

  function sendChat(text) {
    socketRef.current?.emit("acromania-chat-message", { message: text });
  }

  const me = onlinePlayers.find((p) => p.userId === user?.id);

  if (roomFull) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 40 }}>
        <h2>Sala lotada 😅</h2>
        <p style={{ color: "var(--text-dim)" }}>Tenta de novo daqui a pouco, ou volta pra lobby.</p>
        <Link to="/jogos/acromania" className="btn" style={{ marginTop: 16, display: "inline-block" }}>Voltar</Link>
      </div>
    );
  }

  return (
    <div className="quiz-root">
      <Seo title={roomLabel ? `Acromania — ${roomLabel}` : "Acromania"} description="Jogando Acromania com a galera na Educação Gamer." />
      <div className="quiz-stats-bar">
        <div className="quiz-topbar-badges">
          <img src={uiTheme === "light" ? "/acromania-logo-light.png" : "/acromania-logo.png"} alt="Acromania" className="quiz-room-logo" />
          <div className="quiz-gloss-badge">
            <span className="quiz-badge-label">Pts Sala:</span> {me?.roomLifetimePoints ?? 0}
          </div>
          <div className="quiz-gloss-badge">
            <span className="quiz-badge-label">Pts Total:</span> {me?.lifetimePoints ?? 0}
          </div>
        </div>
        <div className="quiz-topbar-title">
          <span className="quiz-theme-name">{roomLabel}</span>
          {erroServidor && <div className="acro-erro-banner">⚠️ {erroServidor}</div>}
        </div>
        <div className="quiz-timer-group">
          <InviteButton
            label="Convidar"
            url={`${window.location.origin}/jogos/acromania/${roomId}`}
            message="Vem jogar Acromania comigo agora! 🎮"
          />
          <Link to="/jogos/acromania" className="room-exit-btn" title="Sair da sala">
            🚪 Sair da sala
          </Link>
          {(phase === "writing" || phase === "voting") && (
            <QuizTimerRing timeLeft={timeLeft} totalSeconds={totalSeconds} />
          )}
        </div>
      </div>

      <div className={`quiz-game-grid ${isMobile ? `qz-mobile-aba-${abaMobile}` : ""}`}>
        <div className="quiz-panel quiz-question-card">
          <div className="quiz-retro-tab">
            {phase === "writing" ? "escreva sua frase" : phase === "voting" ? "vote na melhor" : phase === "grading" ? "resultado" : "aguardando"}
          </div>

          {phase === "intermission" && (
            <>
              {waitingInfo ? (
                <>
                  <div className="quiz-question-text">⏳ Aguardando mais jogadores...</div>
                  <p className="acro-waiting-notice">
                    O Acromania só roda com pelo menos <strong>{waitingInfo.minPlayersToStart}</strong> pessoas
                    na sala — agora tem <strong>{waitingInfo.onlineCount}</strong>. Chama mais gente!
                  </p>
                </>
              ) : (
                <>
                  <div className="quiz-question-text">Próxima rodada em {timeLeft}s...</div>
                  <p style={{ color: "var(--qz-text)", opacity: 0.7 }}>Se prepara! Vem tema e letras novas.</p>
                </>
              )}
            </>
          )}

          {(phase === "writing" || phase === "voting" || phase === "grading") && theme && (
            <div className="acro-theme-block">
              <div className="acro-theme-label">Tema: <strong>{theme}</strong></div>
              <div className="acro-letters-row">
                {letters.map((l, i) => (
                  <span key={i} className="acro-letter-chip">{l}</span>
                ))}
              </div>
            </div>
          )}

          {phase === "writing" && (
            <form className="acro-phrase-form" onSubmit={submitPhrase}>
              {submitted ? (
                <p className="acro-submitted-msg">✓ Frase enviada! Espera o tempo acabar...</p>
              ) : (
                <>
                  {pasteBlockedMsg && (
                    <p className="quiz-paste-blocked-hint">🚫 Colar texto não é permitido — precisa digitar sua própria frase.</p>
                  )}
                  <input
                    ref={phraseInputRef}
                    value={phraseInput}
                    onChange={(e) => setPhraseInput(e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault();
                      setPasteBlockedMsg(true);
                    }}
                    maxLength={200}
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder={`Frase começando com ${letters.join(", ")}...`}
                  />
                  <button className="quiz-answer-btn" type="submit">Enviar frase</button>
                </>
              )}
            </form>
          )}

          {phase === "voting" && (
            <div className="acro-voting-list">
              {votingEntries.map((e) => {
                const ehMinha = e.entryId === myEntryId;
                return (
                  <button
                    key={e.entryId}
                    className={`acro-vote-option ${myVote === e.entryId ? "acro-vote-option-selected" : ""} ${
                      ehMinha ? "acro-vote-option-minha" : ""
                    }`}
                    disabled={!!myVote || ehMinha}
                    onClick={() => castVote(e.entryId)}
                  >
                    {e.phrase}
                    {ehMinha && <span className="acro-vote-minha-tag">sua frase</span>}
                  </button>
                );
              })}
              {myVote && <p className="acro-submitted-msg">✓ Voto registrado! Espera o resultado...</p>}
            </div>
          )}

          {(phase === "grading" || phase === "intermission") && lastResult && (
            <div className="acro-results-list">
              {lastResult.noOneWrote ? (
                <p style={{ color: "var(--qz-text)", opacity: 0.75 }}>Ninguém escreveu uma frase nessa rodada.</p>
              ) : (
                lastResult.entries
                  .slice()
                  .sort((a, b) => b.votes - a.votes)
                  .map((e) => (
                    <div key={e.entryId} className={`acro-result-row ${e.won ? "acro-result-row-won" : ""}`}>
                      <div className="acro-result-phrase">
                        {e.won && "🏆 "}"{e.phrase}"
                      </div>
                      <div className="acro-result-meta">
                        {e.nickname} — {e.votes} {e.votes === 1 ? "voto" : "votos"}
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        <div className="quiz-panel quiz-wrong-log-panel">
          <div className="quiz-retro-tab">✓ aguardando</div>
          <div className="quiz-wrong-log-list" style={{ marginTop: 10 }}>
            {phase === "writing" ? (
              waitingNicknames.length === 0 ? (
                <p className="quiz-wrong-log-empty">Ninguém enviou ainda...</p>
              ) : (
                waitingNicknames.map((nick, i) => (
                  <div key={i} className="acro-waiting-row">✓ {nick}</div>
                ))
              )
            ) : (
              <p className="quiz-wrong-log-empty">Só aparece durante a escrita.</p>
            )}
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
                <ProfileTooltip userId={p.userId} nickname={p.nickname} gameKey="acromania" />
                {/* Padronizado com Stop e Quiz: pontos nesta sala no mês,
                    não o total do jogador no Acromania inteiro. */}
                <span className="quiz-player-points" title="Pontos nesta sala neste mês">
                  {p.roomMonthlyPoints ?? 0} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
