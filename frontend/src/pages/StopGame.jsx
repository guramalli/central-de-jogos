import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getSocket } from "../socket.js";
import { useAuth } from "../context/AuthContext.jsx";
import ScoreTable from "../components/ScoreTable.jsx";
import VotacaoPalavras from "../components/VotacaoPalavras.jsx";
import SalaEspera from "../components/SalaEspera.jsx";
import FaixaPatente from "../components/FaixaPatente.jsx";
import SuggestWordButton from "../components/SuggestWordButton.jsx";
import InviteButton from "../components/InviteButton.jsx";
import FriendsQuickChat from "../components/FriendsQuickChat.jsx";
import OnlinePlayers from "../components/OnlinePlayers.jsx";
import Chat from "../components/Chat.jsx";
import { useIsMobile } from "../utils/useIsMobile.js";
import Seo from "../components/Seo.jsx";

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

  // Moderação de chat: moderadores e admins podem apagar mensagens.
  // O servidor confere o cargo de novo antes de apagar — isto aqui só
  // decide se o botão aparece.
  const podeModerar = user?.role === "ADMIN" || user?.role === "MODERATOR";
  function apagarMensagem(id) {
    socketRef.current?.emit("delete-chat-message", { escopo: "stop", id });
  }
  const navigate = useNavigate();
  const { roomId: roomIdParam } = useParams();
  const roomId = roomIdParam || "stop-sala-1";
  const socketRef = useRef(null);
  const inputRefs = useRef([]);
  // Sinais comportamentais dessa rodada — usados só pra sinalizar possível
  // uso de ferramentas externas pro admin revisar depois, nunca pra
  // bloquear ninguém automaticamente. Resetados a cada rodada nova.
  const pastedRef = useRef(false);
  const correctedRef = useRef(false);
  const isMobile = useIsMobile();
  const awaitingResultRef = useRef(false); // evita "closure velha" dentro dos handlers do socket
  const pendingResultRef = useRef(null); // guarda o resultado se ele chegar durante o atraso
  const pendingVotingRef = useRef(null); // idem, pra abertura da votação nas salas privadas
  const stopDelayTimerRef = useRef(null);
  const stoppedThisRoundRef = useRef(false); // alguém pediu STOP nesta rodada?

  const [accessDenied, setAccessDenied] = useState(null); // { roomLabel, required, current } | null
  const [roomLabel, setRoomLabel] = useState("");
  const [minCorrectToStop, setMinCorrectToStop] = useState(0);
  const [stopReady, setStopReady] = useState(false);
  const [stopDenied, setStopDenied] = useState(null); // { correctCount, required } | null
  const [pasteBlockedMsg, setPasteBlockedMsg] = useState(false);
  const [stopOverlay, setStopOverlay] = useState(null); // nickname de quem apertou STOP, ou null
  const [awaitingResult, setAwaitingResult] = useState(false); // mostra "enviando..." durante o atraso proposital
  const [endedByTimeout, setEndedByTimeout] = useState(false); // true quando ninguém pediu STOP na rodada

  const [phase, setPhase] = useState("intermission"); // intermission | active | voting | grading
  // Fase de votação (só nas salas privadas): a lista de palavras que a mesa
  // precisa validar antes da apuração.
  // Tema em julgamento agora — o servidor controla o ritmo.
  const [temaVotacao, setTemaVotacao] = useState(null);
  // Quantos jogadores já terminaram de votar — mostra que a sala está
  // esperando os outros, não travada.
  const [progressoVoto, setProgressoVoto] = useState(null);
  // Sala privada aguardando o dono dar o start.
  const [espera, setEspera] = useState(null);
  // No celular os três painéis não cabem empilhados — viram abas. No
  // desktop os três aparecem lado a lado e esse estado é ignorado.
  const [abaMobile, setAbaMobile] = useState("jogo");
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

  // O botão de STOP agora fica sempre clicável durante a rodada ativa — quem
  // decide se pode mesmo parar é o SERVIDOR (regras de tempo mínimo e de
  // acertos mínimos). Se não puder, o servidor manda "stop-denied" e a
  // bolinha de status fica vermelha com o motivo, em vez de desabilitar o
  // botão no cliente.
  const canAttemptStop = phase === "active";

  useEffect(() => {
    // Ao entrar na sala, garante que a tela começa mostrando o topo — sem
    // isso, a rolagem podia vir "herdada" de onde a pessoa estava antes
    // (tipo se tinha rolado a lista de salas), abrindo o jogo no meio da tela.
    window.scrollTo(0, 0);
  }, [roomId]);

  useEffect(() => {
    setAccessDenied(null);
    const socket = getSocket();
    socketRef.current = socket;
    socket.connect();
    socket.emit("join-stop-room", { roomId });

    // Reconexão após reinício do servidor (deploy) ou queda de rede: reentra
    // na sala automaticamente, senão a tela ficaria presa na última rodada.
    const reentrarNaSala = () => {
      socket.emit("join-stop-room", { roomId });
    };
    socket.on("connect", reentrarNaSala);

    socket.on("connect_error", (err) => {
      if (err.message === "SESSAO_INVALIDA") {
        logout();
        navigate("/login");
      }
    });

    // Movimento em outra sala: aparece no chat como mensagem do sistema,
    // pra quem está sozinho saber onde tem gente em vez de desistir.
    socket.on("aviso-atividade", (data) => {
      if (data.roomId === roomId) return; // já estou nessa sala
      setMessages((prev) => [
        ...prev,
        { system: true, atividade: true, message: data.mensagem, at: data.at },
      ].slice(-200));
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
      if (state.myAnswers) setAnswers(state.myAnswers);
    });

    socket.on("round-intermission", () => {
      // Se ainda estamos segurando o resultado (atraso proposital depois de
      // um STOP), não muda de fase agora — senão os campos preenchidos
      // somem da tela antes da hora, mesmo o resultado ainda não aparecendo.
      // A troca de fase acontece junto quando o atraso terminar.
      if (awaitingResultRef.current) return;
      setPhase("intermission");
      setIVotedSkip(false);
    });

    socket.on("round-start", (data) => {
      setPhase("active");
      setTemaVotacao(null);
      pendingVotingRef.current = null;
      setEspera(null);
      setProgressoVoto(null);
      setThemes(data.themes);
      setLetter(data.letter);
      setRoundNumber(data.roundNumber);
      setRoundInBlock(data.roundInBlock);
      setAnswers({});
      pastedRef.current = false;
      correctedRef.current = false;
      setLastResult(null);
      setBlockBonus(null);
      setIVotedSkip(false);
      setStopOverlay(null);
      setStopDenied(null);
      setStopReady(false);
      awaitingResultRef.current = false;
      setAwaitingResult(false);
      pendingResultRef.current = null;
      if (stopDelayTimerRef.current) clearTimeout(stopDelayTimerRef.current);
      stoppedThisRoundRef.current = false;
      setEndedByTimeout(false);
    });

    socket.on("player-stopped", (data) => {
      setStopOverlay(data.nickname || "Alguém");
      stoppedThisRoundRef.current = true;

      // Atraso proposital: segura a exibição do resultado por uns 5 segundos,
      // pra dar tempo da pessoa ver o aviso de "pediu stop" e a mensagem de
      // "enviando..." — sem isso, quando o servidor corrige rápido demais,
      // esses avisos quase nem aparecem na tela.
      awaitingResultRef.current = true;
      setAwaitingResult(true);
      pendingResultRef.current = null;
      if (stopDelayTimerRef.current) clearTimeout(stopDelayTimerRef.current);
      stopDelayTimerRef.current = setTimeout(() => {
        awaitingResultRef.current = false;
        setAwaitingResult(false);
        if (pendingResultRef.current) {
          applyRoundResult(pendingResultRef.current);
          pendingResultRef.current = null;
        }
        // Sala privada: a votação foi segurada pelo atraso, abre agora.
        if (pendingVotingRef.current) {
          pendingVotingRef.current();
          pendingVotingRef.current = null;
        }
      }, 5000);
    });

    socket.on("skip-vote-update", (data) => {
      setSkipVote(data);
    });

    socket.on("tick", (data) => {
      // Mesma proteção do "round-intermission": não deixa o tick trocar a
      // fase enquanto ainda estamos segurando o resultado do STOP.
      if (!awaitingResultRef.current) {
        setPhase(data.state);
      }
      setTimeLeft(data.timeLeft);
    });

    function applyRoundResult(data) {
      const wasTimeout = !stoppedThisRoundRef.current;
      setEndedByTimeout(wasTimeout);
      setPhase("grading");
      setLastResult(data);
      setStopOverlay(null);

      // Igual acontece com o aviso de "pediu stop", o aviso de "stop por
      // tempo" fica visível por alguns segundos e depois volta pra legenda
      // normal (com as cores dos pontos) — a tabela de resultado em si já
      // aparece na hora, só esse quadradinho pequeno que segura um pouco.
      if (wasTimeout) {
        setTimeout(() => setEndedByTimeout(false), 5000);
      }
    }

    socket.on("voting-progress", (data) => setProgressoVoto(data));

    socket.on("sala-aguardando", (data) => {
      setEspera(data);
      setPhase("aguardando");
    });

    // Andamento da votação: mostra "3 de 5 já votaram" pra ninguém achar
    // que a sala travou enquanto espera os outros.
    socket.on("voting-tema", (data) => {
      // Mesma proteção do resultado: se ainda estamos no atraso do STOP,
      // segura a votação pra o aviso não ser atropelado.
      const abrir = () => {
        setPhase("voting");
        setTemaVotacao(data);
        setTimeLeft(data.seconds);
        setStopOverlay(null);
        setProgressoVoto(null);
      };
      if (awaitingResultRef.current) pendingVotingRef.current = abrir;
      else abrir();
    });

    socket.on("round-result", (data) => {
      // Se ainda estamos dentro da janela de atraso (alguém pediu stop há
      // pouco), guarda o resultado e só aplica quando o temporizador acabar.
      if (awaitingResultRef.current) {
        pendingResultRef.current = data;
      } else {
        applyRoundResult(data);
      }
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

    // Moderador apagou uma mensagem: some da tela de todo mundo na sala.
    socket.on("chat-message-deleted", ({ id }) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    });

    return () => {
      if (stopDelayTimerRef.current) clearTimeout(stopDelayTimerRef.current);
      socket.off("connect", reentrarNaSala);
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
      socket.off("voting-tema");
      socket.off("voting-progress");
      socket.off("sala-aguardando");
      socket.off("block-bonus");
      socket.off("skip-vote-update");
      socket.off("players-online");
      socket.off("chat-message-deleted");
      socket.off("chat-message");
      socket.off("aviso-atividade");
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

  // Rede de segurança: normalmente some quando o resultado da rodada chega
  // (round-result), mas por precaução some sozinho depois de um tempo maior
  // também, caso algo atrase a correção.
  useEffect(() => {
    if (!stopOverlay) return;
    const t = setTimeout(() => setStopOverlay(null), 15000);
    return () => clearTimeout(t);
  }, [stopOverlay]);

  useEffect(() => {
    if (!stopDenied) return;
    const t = setTimeout(() => setStopDenied(null), 3000);
    return () => clearTimeout(t);
  }, [stopDenied]);

  useEffect(() => {
    if (!pasteBlockedMsg) return;
    const t = setTimeout(() => setPasteBlockedMsg(false), 3000);
    return () => clearTimeout(t);
  }, [pasteBlockedMsg]);

  // Atalho de teclado: Ctrl+Enter (ou Cmd+Enter no Mac) dá STOP (quando permitido).
  // O Enter sozinho fica livre para navegar entre as lacunas (e para o chat),
  // sem risco de disparar STOP sem querer no meio da digitação.
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== "Enter" || !(e.ctrlKey || e.metaKey)) return;
      if (e.target?.closest?.(".chat-input")) return;
      if (canAttemptStop) {
        e.preventDefault();
        handleStop();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canAttemptStop]);

  function updateAnswer(themeKey, value) {
    const next = { ...answers, [themeKey]: value };
    setAnswers(next);
    socketRef.current?.emit("submit-answers", {
      answers: next,
      behavior: { pasted: pastedRef.current, corrected: correctedRef.current },
    });
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

  // Um único campo de resposta, com toda a navegação por teclado (Enter,
  // Tab, Backspace pra campo anterior) — usado tanto na tabela normal
  // (desktop) quanto na grade de 2 colunas (mobile), pra não duplicar essa
  // lógica em dois lugares diferentes.
  function renderFillInput(t, idx) {
    return (
      <input
        key={t.key}
        ref={(el) => (inputRefs.current[idx] = el)}
        className="sheet-fill-input"
        value={answers[t.key] || ""}
        placeholder={letter || ""}
        maxLength={40}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        onChange={(e) => updateAnswer(t.key, e.target.value)}
        onPaste={(e) => {
          e.preventDefault();
          pastedRef.current = true;
          setPasteBlockedMsg(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            // Ctrl+Enter é o atalho de STOP — deixa passar pro atalho
            // global em vez de tratar como "ir pro próximo campo".
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            // No último campo, o Enter pede STOP. No celular não existe
            // Ctrl+Enter, e o botão fica longe do teclado aberto — sem
            // isso, quem joga no telefone perdia a corrida do STOP.
            const ehUltimo = idx === themes.length - 1;
            if (ehUltimo && canAttemptStop) {
              e.currentTarget.blur(); // fecha o teclado antes de encerrar
              handleStop();
              return;
            }
            inputRefs.current[idx + 1]?.focus();
            return;
          }
          if (e.key === "Tab" && !e.shiftKey && idx === themes.length - 1) {
            // Último campo + Tab -> volta pro primeiro, em vez de sair
            // do grupo de campos (que é o padrão do navegador).
            e.preventDefault();
            inputRefs.current[0]?.focus();
            return;
          }
          if (e.key === "Tab" && e.shiftKey && idx === 0) {
            // Primeiro campo + Shift+Tab -> vai pro último (simétrico).
            e.preventDefault();
            inputRefs.current[themes.length - 1]?.focus();
            return;
          }
          if ((e.key === "Backspace" || e.key === "Delete") && (answers[t.key] || "")) {
            // Apagando um caractere de verdade (não só navegando entre
            // campos vazios) — sinal natural de que é digitação humana ao
            // vivo, com hesitação/correção.
            correctedRef.current = true;
          }
          if (e.key === "Backspace" && !(answers[t.key] || "")) {
            e.preventDefault();
            inputRefs.current[idx - 1]?.focus();
          }
        }}
      />
    );
  }

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
        cells: Object.fromEntries(themes.map((t, idx) => [t.key, renderFillInput(t, idx)])),
      },
    ];
  } else if (lastResult) {
    statusText = `Resultado da rodada ${lastResult.roundInBlock ?? lastResult.roundNumber} de 10`;
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
          // Sala da Zoeira não tem glossário — os temas são subjetivos, então não
                    // faz sentido sugerir palavra pra cadastrar.
                    const canSuggest = isMine && g?.status === "wrong" && g?.word && !me?.semPontuacao;
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

  // Durante o atraso proposital (depois de alguém pedir STOP), o status
  // mostra "enviando" no lugar do texto normal, não importa a fase.
  if (awaitingResult) {
    statusText = "Enviando palavras ao servidor...";
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
          <Link to="/jogos/stop" className="btn">Voltar pro Stop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sc-root">
      <Seo title={roomLabel ? `Stop — ${roomLabel}` : "Stop"} description="Jogando Stop com a galera na Educação Gamer." />

      {/* Faixa fixa nas salas que não pontuam (Zoeira e privadas). Fica
          sempre visível pra ninguém achar que está subindo no ranking. */}
      {me?.semPontuacao && (
        <div className="sc-sem-pontuacao">
          <span className="sc-sem-pontuacao-icone">🎲</span>
          <span>
            Esta sala <strong>não conta pontos</strong> para o ranking mensal, vitalício ou para a
            premiação. O placar aqui é só da partida.
          </span>
        </div>
      )}

      <header className="sc-topbar">
        <div className="sc-topbar-left">
          <div className="sc-topbar-badges">
            {me?.semPontuacao ? (
              <div className="sc-gloss-badge">Placar da partida: {me?.blockPoints ?? 0}</div>
            ) : (
              <>
                <div className="sc-gloss-badge">Pts Sala: {me?.roomLifetimePoints ?? 0}</div>
                <div className="sc-gloss-badge">Pts Total: {me?.lifetimePoints ?? 0}</div>
              </>
            )}
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
          <FriendsQuickChat />
          <InviteButton
            label="Convidar"
            url={`${window.location.origin}/jogos/stop/${roomId}`}
            message={`Vem jogar Stop comigo agora, tô na ${roomLabel || "sala"}! 🎮`}
          />
          <Link to="/jogos/stop" className="room-exit-btn" title="Sair da sala">
            🚪 Sair da sala
          </Link>
          <img src="/stop-logo.png" alt="Stop!" className="sc-logo-img" />
        </div>
      </header>

      <div className="sc-round-info">
        Rodada {roundInBlock} de 10
      </div>

      <div className={`sc-retro-panel sc-table-panel ${isMobile ? `sc-mobile-aba-${abaMobile}` : ""}`}>
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

        {pasteBlockedMsg && (
          <div className="sc-min-correct-hint sc-paste-blocked-hint">
            🚫 Colar texto não é permitido nas lacunas — precisa digitar a resposta.
          </div>
        )}

        {isMobile && phase === "active" ? (
          <div className="sc-fill-grid">
            {themes.map((t, idx) => (
              <div key={t.key} className="sc-fill-grid-cell">
                <label className="sc-fill-grid-label">{t.name}</label>
                {renderFillInput(t, idx)}
              </div>
            ))}
          </div>
        ) : isMobile && lastResult ? (
          <div className="sc-result-cards">
            {lastResult.players.map((p) => (
              <div key={p.userId} className="sc-result-card">
                <div className="sc-result-card-header">
                  <span className="sc-result-card-name">{p.nickname}</span>
                  <span className="sc-result-card-points">+{p.points ?? 0} pts • {p.blockTotal ?? 0} no bloco</span>
                </div>
                <div className="sc-fill-grid">
                  {lastResult.themes.map((t) => {
                    const g = p.graded?.[t.key];
                    const isMine = user?.id && p.userId === user.id;
                    // Sala da Zoeira não tem glossário — os temas são subjetivos, então não
                    // faz sentido sugerir palavra pra cadastrar.
                    const canSuggest = isMine && g?.status === "wrong" && g?.word && !me?.semPontuacao;
                    return (
                      <div key={t.key} className="sc-fill-grid-cell">
                        <label className="sc-fill-grid-label">{t.name}</label>
                        <div className={STATUS_TEXT_CLASS[g?.status || "blank"]}>{g?.word || "—"}</div>
                        {canSuggest && <SuggestWordButton themeKey={t.key} letter={lastResult.letter} word={g.word} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : phase === "aguardando" && espera ? (
          <SalaEspera
            estado={espera}
            souDono={espera.donoId === user?.id}
            onIniciar={() => socketRef.current?.emit("iniciar-partida")}
          />
        ) : phase === "voting" && temaVotacao ? (
          <VotacaoPalavras
            tema={temaVotacao}
            meuUserId={user?.id}
            segundos={timeLeft}
            progresso={progressoVoto}
            onVotar={(targetUserId, themeKey, valido) =>
              socketRef.current?.emit("vote-word", { targetUserId, themeKey, valido })
            }
          />
        ) : (
          <div className="sc-table-scroll">
            <ScoreTable themes={tableThemes} rows={tableRows} roundLabel={roundLabel} />
          </div>
        )}

        <div className="sc-stop-hint">
          {/* A dica muda por plataforma: no celular não existe Ctrl+Enter,
              e mandar procurar um botão "abaixo" com o teclado aberto não
              ajuda ninguém. */}
          {isMobile ? (
            <>💡 Preencheu tudo? Aperte <strong>Enter</strong> na última lacuna pra pedir stop.</>
          ) : (
            <>
              💡 Peça <strong>stop</strong> clicando no botão da pontuação abaixo, ou apertando{" "}
              <strong>Ctrl+Enter</strong>.
            </>
          )}
        </div>
      </div>

      {isMobile && <FaixaPatente me={me} semPontuacao={me?.semPontuacao} />}

      {isMobile && (
        <div className="sc-abas-mobile">
          <button
            className={`sc-aba ${abaMobile === "jogo" ? "sc-aba-ativa" : ""}`}
            onClick={() => setAbaMobile("jogo")}
          >
            🎯 Rodada
          </button>
          <button
            className={`sc-aba ${abaMobile === "chat" ? "sc-aba-ativa" : ""}`}
            onClick={() => setAbaMobile("chat")}
          >
            💬 Chat
          </button>
          <button
            className={`sc-aba ${abaMobile === "jogadores" ? "sc-aba-ativa" : ""}`}
            onClick={() => setAbaMobile("jogadores")}
          >
            👥 {onlinePlayers.length}
          </button>
        </div>
      )}

      <div className={`sc-bottom-grid ${isMobile ? `sc-mobile-aba-${abaMobile}` : ""}`}>
        <div className="sc-retro-panel sc-tab-panel sc-chat-panel">
          <div className="sc-retro-tab sc-retro-tab-right">chat</div>
          <Chat messages={messages} onSend={sendChat} canModerate={podeModerar} onDelete={apagarMensagem} />
        </div>

        <div className="sc-retro-panel sc-tab-panel sc-legend-panel">
          {stopOverlay ? (
            <div className="sc-legend-stopped">
              <div className="sc-legend-stopped-name">{stopOverlay}</div>
              <div className="sc-legend-stopped-label">pediu stop</div>
            </div>
          ) : phase === "active" ? (
            <div className="sc-legend-status-only">
              <button
                className={`sc-status-ball sc-status-ball-big ${stopDenied ? "sc-status-ball-red" : "sc-status-ball-green"}`}
                onClick={handleStop}
                title="Pedir STOP"
              >
                STOP
              </button>
              {stopDenied && (
                <span className="sc-status-text">
                  {stopDenied.reason === "too-early"
                    ? `Você pediu stop antes do tempo estipulado da sala. Você só pode pedir stop após ${stopDenied.minSeconds} segundos.`
                    : stopDenied.reason === "not-filled"
                    ? "Preencha todas as lacunas para pedir stop."
                    : `Mínimo de ${minCorrectToStop} palavras para pedir stop.`}
                </span>
              )}
            </div>
          ) : endedByTimeout && lastResult ? (
            <div className="sc-legend-status-only">
              <span className="sc-status-ball sc-status-ball-big sc-status-ball-neutral">STOP</span>
              <span className="sc-status-text sc-status-text-timeout">Stop por tempo</span>
            </div>
          ) : (
            <>
              <div className="sc-retro-tab">pontuação</div>
              <ul className="sc-legend-list">
                <li><span className="sc-swatch sc-swatch-wrong" /> 0 pontos — errada ou em branco</li>
                <li><span className="sc-swatch sc-swatch-duplicate" /> 5 pontos — repetida</li>
                <li><span className="sc-swatch sc-swatch-correct" /> 10 pontos — única</li>
                <li><span className="sc-swatch sc-swatch-solo" /> 15 pontos — só você acertou o tema</li>
              </ul>
              <div className="sc-legend-bonus">Bônus a cada 10 rodadas: 🥇+150 🥈+100 🥉+50</div>
            </>
          )}
        </div>

        <div className="sc-retro-panel sc-tab-panel sc-players-panel">
          <div className="sc-retro-tab">jogadores ({onlinePlayers.length})</div>
          <OnlinePlayers players={onlinePlayers} />
        </div>
      </div>
    </div>
  );
}
