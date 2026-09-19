import { useEffect, useId, useRef, useState } from "react";
import { api, novoSocket, ehSessaoMorta, sair } from "./api.js";
import { voltarAoLobby } from "./App.jsx";
import { nomeDoTema, corDoJogador } from "./temas.js";
import { ativarSons, somPergunta, somAcerto, somTique, somErro, somOutroAcertou, estaMudo, alternarMudo } from "./sons.js";
import Avatar from "./Avatar.jsx";
import { CampoChat, TextoSistema, TextoComMarcacoes } from "./Chat.jsx";
import IconePatente from "./IconePatente.jsx";
import ListaJogadores from "./ListaJogadores.jsx";
import NickHover from "./NickHover.jsx";
import { ModalReportar } from "./Modais.jsx";
import { BotaoConvidar, ConviteRecebido } from "./Convites.jsx";

const RAIO = 30;
const VOLTA = 2 * Math.PI * RAIO;
// Intervalo entre perguntas nas salas normais (o clássico também usa 8 como
// referência do anel). Nas arenas o intervalo é maior e o anel se ajusta
// sozinho pelo maior valor visto.
const INTERVALO_PADRAO = 8;

// "8s 342ms" — formato da Central de Jogos, que mostra a disputa no décimo.
function tempoDeResposta(ms) {
  if (ms == null) return "0s 000ms";
  return `${Math.floor(ms / 1000)}s ${String(ms % 1000).padStart(3, "0")}ms`;
}

export default function Sala({ roomId, usuario, compacto = false, ativo = false, aoFechar = null }) {
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const chatListaRef = useRef(null);
  const uid = useId();
  const logListaRef = useRef(null);
  const fecharResultadoRef = useRef(null);
  const totalIntervaloRef = useRef(INTERVALO_PADRAO);
  const segundosDaSalaRef = useRef(null);

  const [socket, setSocket] = useState(null);
  const [nomeSala, setNomeSala] = useState("");
  const [themeKey, setThemeKey] = useState("");
  const [fase, setFase] = useState("intermission");
  const [tempo, setTempo] = useState(0);
  const [total, setTotal] = useState(40);
  const [totalIntervalo, setTotalIntervalo] = useState(INTERVALO_PADRAO);
  const [pergunta, setPergunta] = useState("");
  const [questionId, setQuestionId] = useState(null);
  const [temaDaPergunta, setTemaDaPergunta] = useState(null);
  const [numero, setNumero] = useState(0);
  const [mascara, setMascara] = useState("");
  const [jogadores, setJogadores] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [log, setLog] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [sequencia, setSequencia] = useState(0);
  const [palpite, setPalpite] = useState("");
  const [historico, setHistorico] = useState([]);
  const [idxHist, setIdxHist] = useState(null);
  const [tremer, setTremer] = useState(false);
  const [cheia, setCheia] = useState(null);
  const [mudo, setMudo] = useState(estaMudo());
  const [avisoColar, setAvisoColar] = useState(false);
  const [turno, setTurno] = useState(null); // arenas: { rodada, total }
  const [rankingTurno, setRankingTurno] = useState([]);
  const [jaPontuei, setJaPontuei] = useState(false);
  const [reportando, setReportando] = useState(false);
  const [recorde, setRecorde] = useState(null);
  const [aba, setAba] = useState("chat"); // celular: chat | log | jogadores

  const addMsg = (m) => setMsgs((prev) => [...prev, { ...m, _k: Math.random() }].slice(-100));
  const podeModerar = usuario.role === "ADMIN" || usuario.role === "MODERATOR";

  // Duração real da pergunta nesta sala. Sem isto, quem entrava no meio de
  // uma pergunta via o anel calculado sobre 40s, mesmo em sala de 20s.
  useEffect(() => {
    api.get("/quiz-rooms").then(({ data }) => {
      const s = data.find((r) => r.roomId === roomId);
      if (s?.questionSeconds) {
        segundosDaSalaRef.current = s.questionSeconds;
        setTotal((t) => (t === 40 ? s.questionSeconds : t));
      }
      if (s?.streakRecord) setRecorde(s.streakRecord);
    }).catch(() => {});
  }, [roomId]);

  useEffect(() => {
    const s = novoSocket();
    socketRef.current = s;
    setSocket(s);
    const entrar = () => s.emit("join-quiz-room", { roomId });
    s.on("connect", entrar);
    s.on("connect_error", (err) => {
      if (!ehSessaoMorta(err)) return;
      sair();
      window.location.replace("/v2/?pagina=entrar&sessao=expirada");
    });
    s.on("quiz-room-full", (d) => setCheia(d || {}));
    s.on("quiz-room-state", (st) => {
      setNomeSala(st.label || "");
      setThemeKey(st.themeKey || "");
      setFase(st.state);
      setTempo(st.timeLeft || 0);
      if (st.streakRecord) setRecorde(st.streakRecord);
      setTurno(st.roundsPerTurn ? { rodada: st.turnRound, total: st.roundsPerTurn } : null);
      if (st.state === "intermission" && st.timeLeft > totalIntervaloRef.current) {
        totalIntervaloRef.current = st.timeLeft;
        setTotalIntervalo(st.timeLeft);
      }
      if (st.question) {
        setPergunta(st.question);
        setQuestionId(st.questionId || null);
        setMascara(st.masked || "");
      }
    });
    s.on("quiz-question-start", (d) => {
      clearTimeout(fecharResultadoRef.current);
      setResultado(null);
      setFase("active");
      setPergunta(d.question);
      setQuestionId(d.questionId || null);
      setTemaDaPergunta(d.temaDaPergunta || null);
      setMascara(d.masked || "");
      setTotal(d.seconds || segundosDaSalaRef.current || 40);
      setTempo(d.seconds || segundosDaSalaRef.current || 40);
      setLog([]);
      setJaPontuei(false);
      setPalpite("");
      setHistorico([]);
      setIdxHist(null);
      setNumero((n) => n + 1);
      if (d.roundsPerTurn) setTurno({ rodada: d.turnRound, total: d.roundsPerTurn });
      somPergunta();
    });
    s.on("quiz-reveal-update", (d) => setMascara(d.masked || ""));
    s.on("quiz-tick", (d) => {
      setFase(d.state);
      setTempo(d.timeLeft);
      if (d.state === "active" && d.timeLeft > 0 && d.timeLeft <= 5) somTique();
      if (d.state === "intermission" && d.timeLeft > totalIntervaloRef.current) {
        totalIntervaloRef.current = d.timeLeft;
        setTotalIntervalo(d.timeLeft);
      }
    });
    s.on("quiz-intermission", () => { setFase("intermission"); setPalpite(""); });
    s.on("quiz-question-result", (d) => {
      setFase("intermission");
      if (d.turnRanking) {
        // Arena: não tem "vencedor" — o intervalo vira o placar do turno.
        setRankingTurno(d.turnRanking);
        return;
      }
      let r;
      if (d.winner) {
        const fuiEu = d.winnerUserId && d.winnerUserId === usuario.id;
        setMascara(d.answer || "");
        if (fuiEu) somAcerto(); else somOutroAcertou();
        setSequencia((n) => (fuiEu ? n + 1 : 0));
        r = { tipo: fuiEu ? "eu" : "outro", nick: d.winner, id: d.winnerUserId, resposta: d.answer, pontos: d.points, segundos: d.elapsedSeconds };
      } else {
        // Ninguém acertou: a resposta NÃO é revelada (regra do jogo).
        setSequencia(0);
        r = { tipo: "ninguem" };
      }
      setResultado(r);
      clearTimeout(fecharResultadoRef.current);
      fecharResultadoRef.current = setTimeout(() => setResultado(null), 3800);
    });
    s.on("quiz-turn-finished", (d) => setRankingTurno(d.ranking || []));
    s.on("quiz-guess-correct-multi", () => {
      setJaPontuei(true);
      setPalpite("");
      somAcerto();
      setResultado({ tipo: "eu", arena: true });
      clearTimeout(fecharResultadoRef.current);
      fecharResultadoRef.current = setTimeout(() => setResultado(null), 1800);
    });
    s.on("quiz-guess-wrong", () => {
      somErro();
      setTremer(true);
      setTimeout(() => setTremer(false), 450);
    });
    s.on("quiz-answer-log", (d) => setLog((prev) => [...prev, d].slice(-60)));
    s.on("quiz-players-online", (d) => setJogadores(d.players || []));
    s.on("quiz-chat-message", (m) => addMsg(m));
    s.on("chat-message-deleted", ({ id }) => setMsgs((prev) => prev.filter((m) => m.id !== id)));
    s.on("aviso-inatividade", (d) => addMsg({ system: true, aviso: true, message: d.mensagem }));
    s.on("aviso-atividade", (d) => {
      if (d.roomId === roomId || (d.userId && d.userId === usuario.id)) return;
      addMsg({ system: true, atividade: true, message: d.mensagem });
    });
    s.on("removido-por-inatividade", (d) => {
      alert(d?.mensagem || "Você saiu da sala por inatividade.");
      sairDaSala();
    });

    s.connect();
    return () => {
      clearTimeout(fecharResultadoRef.current);
      s.removeAllListeners();
      s.disconnect();
    };
  }, [roomId]);

  // Sons só existem dentro das salas: é aqui que eles são ligados.
  useEffect(() => { ativarSons(); }, []);

  const sairDaSala = () => (aoFechar ? aoFechar() : voltarAoLobby("quiz"));

  // CURSOR NO CAMPO QUANDO A RODADA COMEÇA (mesma lógica do clássico).
  // Tenta no próximo quadro e de novo 120ms depois (o campo pode ainda estar
  // montando). Não rouba o foco de quem está digitando em outro campo — o
  // chat é exceção: começou a rodada, responder vale mais que a mensagem.
  // No multi-sala só a sala ATIVA mexe no cursor. No iPhone o teclado só
  // abre por toque; ali quem segura o foco é o campo nunca desmontar.
  useEffect(() => {
    if (fase !== "active") return;
    if (compacto && !ativo) return;
    const focar = () => {
      const f = document.activeElement;
      const campoTexto = f && (f.tagName === "INPUT" || f.tagName === "TEXTAREA") && !f.disabled;
      const noChat = !!f?.closest?.(".v2-chat-form");
      if (campoTexto && !noChat) return;
      inputRef.current?.focus({ preventScroll: true });
    };
    const quadro = requestAnimationFrame(focar);
    const denovo = setTimeout(focar, 120);
    return () => { cancelAnimationFrame(quadro); clearTimeout(denovo); };
  }, [fase, numero, ativo]);

  // Rola SÓ a caixa do chat. scrollIntoView rolava a página inteira no
  // celular — cada mensagem nova (inclusive a de acerto) puxava a tela.
  useEffect(() => { const el = chatListaRef.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs, aba]);
  // A caixa do chat muda de tamanho DEPOIS das mensagens chegarem (grade do
  // multi-sala se ajustando, abas, teclado): segue colada no fim.
  useEffect(() => {
    const el = chatListaRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => { el.scrollTop = el.scrollHeight; });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => { const el = logListaRef.current; if (el) el.scrollTop = el.scrollHeight; }, [log, aba]);

  function enviarPalpite(e) {
    e.preventDefault();
    const g = palpite.trim();
    // Refoco DENTRO do submit: é o que mantém o teclado aberto no iOS.
    inputRef.current?.focus();
    if (!g || fase !== "active" || jaPontuei) return;
    socketRef.current?.emit("quiz-submit-guess", { guess: g });
    setHistorico((h) => [...h, g].slice(-20));
    setIdxHist(null);
    setPalpite("");
  }

  // ↑ e ↓ navegam pelas respostas já enviadas nesta pergunta (igual ao
  // clássico): corrigir uma letra sem redigitar tudo.
  function teclaNoPalpite(e) {
    if (!historico.length) return;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const i = idxHist === null ? historico.length - 1 : Math.max(0, idxHist - 1);
      setIdxHist(i);
      setPalpite(historico[i]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (idxHist === null) return;
      const i = idxHist + 1;
      if (i >= historico.length) { setIdxHist(null); setPalpite(""); }
      else { setIdxHist(i); setPalpite(historico[i]); }
    }
  }

  function enviarChat(texto) {
    socketRef.current?.emit("quiz-chat-message", { message: texto });
  }

  const eu = jogadores.find((j) => j.userId === usuario.id);
  const ativa = fase === "active";
  const intervaloArena = !!turno && fase === "intermission";
  const fracao = ativa
    ? (total > 0 ? Math.max(0, Math.min(1, tempo / total)) : 0)
    : (totalIntervalo > 0 ? Math.max(0, Math.min(1, tempo / totalIntervalo)) : 0);
  const urgente = ativa && tempo <= 5;
  const tema = nomeDoTema(nomeSala);
  const nivel = /Avançad/.test(nomeSala) ? "Avançada" : /Padrão|Iniciante/.test(nomeSala) ? "Padrão" : "";
  const meuNick = usuario.nickname.toLowerCase();

  if (cheia) {
    return (
      <div className="v2-app v2-centro">
        <div className="v2-cartao-entrar">
          <div className="v2-logo-grande">Sala cheia!</div>
          <p>{cheia.roomLabel || "Essa sala"} está lotada{cheia.maxPlayers ? ` (${cheia.maxPlayers} jogadores)` : ""}. Tenta outro tema?</p>
          <button className="v2-botao v2-botao-amarelo" onClick={() => sairDaSala()}>{aoFechar ? "Fechar esta sala" : "Voltar ao lobby"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`v2-app v2-sala aba-${aba} ${compacto ? "compacto" : ""}`}>
      <header className="v2-sala-topo">
        <button className="v2-voltar" aria-label="Sair da sala" title="Sair da sala" onClick={() => sairDaSala()}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        {themeKey && <img className="v2-sala-icone" src={`/temas-quiz/${themeKey}.png`} alt="" />}
        <div className="v2-sala-titulo">
          <div className="v2-sala-nome">{tema || "Carregando…"}</div>
          <div className="v2-sala-info">
            {nivel ? `Sala ${nivel} · ` : ""}{jogadores.length} jogando
            {turno && ` · Rodada ${turno.rodada} de ${turno.total}`}
          </div>
        </div>
        <div className="v2-sala-pontos">
          <div className="v2-pontinho" title="Seus pontos nesta sala (todos os tempos)"><span>Pts sala</span><b>{(eu?.roomLifetimePoints ?? 0).toLocaleString("pt-BR")}</b></div>
          <div className="v2-pontinho" title="Seus pontos no Quiz (todos os tempos)"><span>Pts total</span><b>{(eu?.lifetimePoints ?? 0).toLocaleString("pt-BR")}</b></div>
          {eu?.rank?.icon && (
            <img className={`v2-patente-topo ${eu.rank.brilha ? "brilha" : ""}`} src={eu.rank.icon} alt={eu.rank.name} title={`Sua patente: ${eu.rank.name}`} onError={(e) => { e.currentTarget.style.display = "none"; }} />
          )}
        </div>
        <BotaoConvidar socket={socket} roomId={roomId} nomeSala={tema} />
        <button className="v2-mudo" aria-label={mudo ? "Ligar som" : "Desligar som"} title={mudo ? "Ligar som" : "Desligar som"} onClick={() => setMudo(alternarMudo())}>
          {mudo ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H3v6h3l5 4zM22 9l-6 6M16 9l6 6" /></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" /></svg>
          )}
        </button>
      </header>

      <div className="v2-sala-corpo">
        <aside className="v2-placar" aria-label="Jogadores na sala">
          <div className="v2-bloco-titulo">Jogadores <span>{jogadores.length}</span></div>
          <div className="v2-placar-lista">
            {jogadores.map((j, i) => (
              <div key={j.userId} className={`v2-jogador ${j.userId === usuario.id ? "eu" : ""}`}>
                <span className="v2-jogador-pos">{i + 1}</span>
                <IconePatente rank={j.rank} nickname={j.nickname} userId={j.userId} />
                <div className="v2-jogador-info">
                  <NickHover userId={j.userId} nickname={j.nickname} meuId={usuario.id} roomId={roomId}>
                    <span className="v2-jogador-nome">{j.nickname}</span>
                  </NickHover>
                  {j.rank?.name && (
                    <span className="v2-jogador-patente">
                      {j.rank.name}
                    </span>
                  )}
                </div>
                <span className="v2-jogador-pts" title="Pontos nesta sala neste mês">{(j.roomMonthlyPoints || 0).toLocaleString("pt-BR")}</span>
              </div>
            ))}
            {jogadores.length === 0 && <div className="v2-vazio">Entrando na sala…</div>}
          </div>
          {recorde?.nickname && recorde.count > 0 && (
            <div className="v2-recorde">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3.5 2-4.5.3 1.5 1 2.5 2 3 0-3 .5-5.5 1-8.5z" /></svg>
              <span>Recorde da sala: <b>{recorde.count}</b> seguidas — {recorde.nickname}</span>
            </div>
          )}
        </aside>

        <main className="v2-palco">
          <section className={`v2-pergunta ${ativa ? "" : "esperando"}`}>
            <div className="v2-pergunta-cabeca">
              <div className="v2-pergunta-etiquetas">
                <span className="v2-etiqueta">{ativa ? "Valendo!" : intervaloArena ? "Placar do turno" : "Intervalo"}</span>
                {sequencia >= 2 && (
                  <span className="v2-sequencia">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3.5 2-4.5.3 1.5 1 2.5 2 3 0-3 .5-5.5 1-8.5z" /></svg>
                    sequência {sequencia}
                  </span>
                )}
                {questionId && ativa && (
                  <button className="v2-reportar" onClick={() => setReportando(true)} title="Reportar problema nessa pergunta">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>
                    reportar
                  </button>
                )}
              </div>
              {/* O cronômetro mora NO cartão da pergunta, onde o olho já está.
                  No intervalo ele continua visível, contando pra próxima. */}
              <div className={`v2-relogio ${urgente ? "urgente" : ""} ${ativa ? "" : "intervalo"}`} aria-label={ativa ? `${tempo} segundos para responder` : `Próxima pergunta em ${tempo} segundos`}>
                <svg viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r={RAIO} className="v2-relogio-fundo" />
                  <circle cx="36" cy="36" r={RAIO} className="v2-relogio-arco" strokeDasharray={VOLTA} strokeDashoffset={VOLTA * (1 - fracao)} />
                </svg>
                <span>{tempo > 0 ? tempo : ativa ? 0 : "…"}</span>
                {!ativa && <small>próxima</small>}
              </div>
            </div>

            {intervaloArena ? (
              <div className="v2-ranking-turno">
                {rankingTurno.length === 0 ? <p>Ninguém pontuou ainda neste turno.</p> : rankingTurno.slice(0, 10).map((r) => (
                  <div key={r.userId} className={`v2-rt-linha ${r.userId === usuario.id ? "eu" : ""} ${r.position <= 3 ? `p${r.position}` : ""}`}>
                    <span className="v2-rt-pos">{r.position}º</span>
                    <Avatar userId={r.userId} nickname={r.nickname} tamanho={30} />
                    <span className="v2-rt-nick">{r.nickname}</span>
                    <b>{r.points}</b>
                  </div>
                ))}
              </div>
            ) : jaPontuei ? (
              <div className="v2-ja-pontuei">
                <b>Você acertou!</b>
                <span>Aguarde a próxima pergunta…</span>
              </div>
            ) : (
              <div key={numero} className="v2-pergunta-conteudo">
                {temaDaPergunta && <div className="v2-tema-pergunta">{temaDaPergunta}</div>}
                <p className={`v2-pergunta-texto ${pergunta.length > 110 ? "longa" : pergunta.length > 60 ? "media" : "curta"}`} onContextMenu={(e) => e.preventDefault()}>
                  {pergunta || "Aguardando a primeira pergunta…"}
                </p>
                {mascara && (
                  <div className={`v2-mascara ${tremer ? "tremer" : ""}`} aria-label="Dica da resposta">
                    {mascara.split(" ").map((palavra, pi) => (
                      <span key={pi} className="v2-palavra">
                        {palavra.split("").map((ch, i) => (
                          <span key={i} className={ch === "*" ? "v2-letra oculta" : "v2-letra"}>{ch === "*" ? "" : ch}</span>
                        ))}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form className={`v2-resposta ${tremer ? "tremer" : ""}`} onSubmit={enviarPalpite}>
              <label htmlFor={`${uid}-palpite`} className="v2-oculto">Sua resposta</label>
              <input
                id={`${uid}-palpite`}
                ref={inputRef}
                value={palpite}
                onChange={(e) => { setPalpite(e.target.value); setIdxHist(null); }}
                onKeyDown={teclaNoPalpite}
                onPaste={(e) => { e.preventDefault(); setAvisoColar(true); setTimeout(() => setAvisoColar(false), 2500); }}
                placeholder={jaPontuei ? "Você já pontuou nesta pergunta" : ativa ? "Digite sua resposta…" : "Espere a próxima pergunta…"}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="send"
                maxLength={100}
              />
              <button type="submit" className="v2-enviar">Responder</button>
            </form>
            {avisoColar && <p className="v2-aviso">Colar não vale — precisa digitar!</p>}

            {/* Comemoração DENTRO do cartão da pergunta, por cima dele — o
                resto da sala (placar, log, chat) continua visível. O campo
                de resposta fica montado por baixo, então o foco (e o
                teclado do iPhone) não se perde. */}
            {resultado && (
              <div className={`v2-resultado ${resultado.tipo} ${resultado.arena ? "rapido" : ""}`} role="status" onClick={() => setResultado(null)}>
                {resultado.tipo === "eu" && <Confete />}
                {resultado.tipo === "ninguem" ? (
                  <div className="v2-resultado-selo">
                    <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9 9.5h.01M15 9.5h.01M8.5 16c2-1.5 5-1.5 7 0" /></svg>
                  </div>
                ) : (
                  // Quem acertou: patente do Quiz + nick (no lugar do selo).
                  (() => {
                    const id = resultado.tipo === "eu" ? usuario.id : resultado.id;
                    const nick = resultado.tipo === "eu" ? usuario.nickname : resultado.nick;
                    const rank = jogadores.find((j) => j.userId === id)?.rank;
                    return (
                      <div className="v2-stop-quem v2-quem-acertou">
                        <IconePatente rank={rank} nickname={nick} userId={id} />
                        <span className="v2-stop-quem-nick">{nick}</span>
                        {rank?.name && <span className="v2-stop-quem-patente">{rank.name}</span>}
                      </div>
                    );
                  })()
                )}
                <div className="v2-resultado-titulo">
                  {resultado.tipo === "eu" ? "ACERTOU!" : resultado.tipo === "outro" ? "acertou!" : "Ninguém acertou"}
                </div>
                {resultado.resposta && <div className="v2-resultado-resposta">{resultado.resposta}</div>}
                {resultado.tipo === "ninguem" && <div className="v2-resultado-sub">A resposta fica em segredo…</div>}
                {resultado.tipo === "eu" && !resultado.arena && (
                  <div className="v2-resultado-cards">
                    {resultado.pontos != null && <div className="v2-mini-card"><b>+{resultado.pontos}</b><span>pontos</span></div>}
                    {resultado.segundos != null && <div className="v2-mini-card"><b>{resultado.segundos}s</b><span>pra acertar</span></div>}
                    {sequencia >= 2 && <div className="v2-mini-card amarelo"><b>{sequencia}</b><span>em sequência</span></div>}
                  </div>
                )}
                <div className="v2-resultado-barra"><span /></div>
              </div>
            )}
          </section>

          <section className="v2-log" aria-label="Log de respostas">
            <div className="v2-bloco-titulo">Respostas da rodada</div>
            <div className="v2-log-lista" ref={logListaRef}>
              {log.length === 0 && <div className="v2-vazio">Nenhuma resposta enviada ainda.</div>}
              {log.map((l, i) => (
                <div key={i} className={`v2-log-item ${l.correct ? "certa" : ""}`}>
                  <span className="v2-log-tempo">{tempoDeResposta(l.elapsedMs)}</span>
                  <b style={{ color: l.correct ? undefined : corDoJogador(l.userId) }}>{l.nickname}</b>
                  <span className="v2-log-palpite">{l.guess}</span>
                </div>
              ))}
            </div>
          </section>

        </main>

        <aside className="v2-chat" aria-label="Chat da sala">
          <div className="v2-abas-celular" role="tablist">
            <button role="tab" aria-selected={aba === "chat"} className={aba === "chat" ? "ativa" : ""} onClick={() => setAba("chat")}>Chat</button>
            <button role="tab" aria-selected={aba === "log"} className={aba === "log" ? "ativa" : ""} onClick={() => setAba("log")}>Respostas</button>
            <button role="tab" aria-selected={aba === "jogadores"} className={aba === "jogadores" ? "ativa" : ""} onClick={() => setAba("jogadores")}>Jogadores <span className="v2-aba-contador">{jogadores.length}</span></button>
          </div>
          <div className="v2-bloco-titulo">Chat</div>
          <div className="v2-chat-lista" ref={chatListaRef}>
            {msgs.map((m) => {
              const citaMe = !m.system && m.userId !== usuario.id && meuNick.length > 2 && m.message?.toLowerCase().includes(meuNick);
              return (
                <div key={m.id || m._k} className={`v2-msg ${m.system ? "sistema" : ""} ${m.success ? "sucesso" : ""} ${m.promotion ? "promocao" : ""} ${m.aviso || m.atividade ? "aviso" : ""} ${citaMe ? "me-cita" : ""} ${m.userId === usuario.id ? "minha" : ""}`}>
                  {!m.system && (
                    <b style={{ color: corDoJogador(m.userId) }}>{m.clanTag ? `[${m.clanTag}] ` : ""}{m.nickname}</b>
                  )}
                  {!m.system && " "}
                  <span className={m.bold ? "negrito" : ""}>{m.system ? <TextoSistema mensagem={m.message} destaque={m.tituloDestaque} /> : <TextoComMarcacoes texto={m.message} participantes={jogadores.map((j) => j.nickname)} meuNick={usuario.nickname} />}</span>
                  {podeModerar && !m.system && m.id && (
                    <button className="v2-msg-apagar" aria-label="Apagar mensagem" title="Apagar mensagem" onClick={() => { if (window.confirm(`Apagar a mensagem de ${m.nickname}?`)) socketRef.current?.emit("delete-chat-message", { escopo: "quiz", id: m.id }); }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="v2-lista-jogadores-celular"><ListaJogadores jogadores={jogadores} meuId={usuario.id} pontos={(j) => j.roomMonthlyPoints} /></div>
          <CampoChat id={`${uid}-chat`} aoEnviar={enviarChat} participantes={jogadores.filter((j) => !j.ehBot).map((j) => j.nickname)} meuNick={usuario.nickname} />
        </aside>
      </div>


      {reportando && questionId && <ModalReportar questionId={questionId} texto={pergunta} aoFechar={() => setReportando(false)} />}
      {!compacto && <ConviteRecebido socket={socket} />}
    </div>
  );
}

const CORES_CONFETE = ["#FFD60A", "#FF5A4D", "#FFFFFF", "#2B1B5E", "#FFB86F", "#C3A6FF"];
function Confete() {
  return (
    <div className="v2-confete" aria-hidden="true">
      {Array.from({ length: 28 }).map((_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: CORES_CONFETE[i % CORES_CONFETE.length],
            animationDelay: `${((i * 0.13) % 1.2).toFixed(2)}s`,
            width: i % 3 ? 9 : 14,
            height: i % 3 ? 16 : 8,
            borderRadius: i % 4 ? 3 : "50%",
          }}
        />
      ))}
    </div>
  );
}
