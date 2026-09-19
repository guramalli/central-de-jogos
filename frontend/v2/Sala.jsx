import { useEffect, useRef, useState } from "react";
import { novoSocket, ehSessaoMorta, sair } from "./api.js";
import { irPara } from "./App.jsx";
import { nomeDoTema, iniciais, corDoJogador } from "./temas.js";
import { somPergunta, somAcerto, somTique, somErro, somOutroAcertou, estaMudo, alternarMudo } from "./sons.js";

const RAIO = 26;
const VOLTA = 2 * Math.PI * RAIO;

export default function Sala({ roomId, usuario }) {
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const chatFimRef = useRef(null);
  const fecharResultadoRef = useRef(null);

  const [nomeSala, setNomeSala] = useState("");
  const [fase, setFase] = useState("intermission");
  const [tempo, setTempo] = useState(0);
  const [total, setTotal] = useState(40);
  const [pergunta, setPergunta] = useState("");
  const [numero, setNumero] = useState(0);
  const [mascara, setMascara] = useState("");
  const [jogadores, setJogadores] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [tentativas, setTentativas] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [sequencia, setSequencia] = useState(0);
  const [palpite, setPalpite] = useState("");
  const [textoChat, setTextoChat] = useState("");
  const [tremer, setTremer] = useState(false);
  const [cheia, setCheia] = useState(null);
  const [mudo, setMudo] = useState(estaMudo());
  const [avisoColar, setAvisoColar] = useState(false);

  const addMsg = (m) => setMsgs((prev) => [...prev, { ...m, _k: Math.random() }].slice(-80));

  useEffect(() => {
    const s = novoSocket();
    socketRef.current = s;
    const entrar = () => s.emit("join-quiz-room", { roomId });
    // Reconexão (deploy, rede): o servidor novo não sabe que estávamos aqui.
    s.on("connect", entrar);
    s.on("connect_error", (err) => {
      if (!ehSessaoMorta(err)) return;
      sair();
      window.location.replace("/login?sessao=expirada");
    });
    s.on("quiz-room-full", (d) => setCheia(d || {}));
    s.on("quiz-room-state", (st) => {
      setNomeSala(st.label || "");
      setFase(st.state);
      setTempo(st.timeLeft || 0);
      if (st.question) {
        setPergunta(st.question);
        setMascara(st.masked || "");
      }
    });
    s.on("quiz-question-start", (d) => {
      clearTimeout(fecharResultadoRef.current);
      setResultado(null);
      setFase("active");
      setPergunta(d.question);
      setMascara(d.masked || "");
      setTotal(d.seconds || 40);
      setTempo(d.seconds || 40);
      setTentativas([]);
      setPalpite("");
      setNumero((n) => n + 1);
      somPergunta();
      // Desktop: foco direto no campo. No iPhone o teclado só abre por toque.
      requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    });
    s.on("quiz-reveal-update", (d) => setMascara(d.masked || ""));
    s.on("quiz-tick", (d) => {
      setFase(d.state);
      setTempo(d.timeLeft);
      if (d.state === "active" && d.timeLeft > 0 && d.timeLeft <= 5) somTique();
    });
    s.on("quiz-intermission", () => { setFase("intermission"); setPalpite(""); });
    s.on("quiz-question-result", (d) => {
      setFase("intermission");
      let r;
      if (d.winner) {
        const fuiEu = d.winnerUserId && d.winnerUserId === usuario.id;
        setMascara(d.answer || "");
        if (fuiEu) somAcerto(); else somOutroAcertou();
        setSequencia((n) => (fuiEu ? n + 1 : 0));
        r = { tipo: fuiEu ? "eu" : "outro", nick: d.winner, resposta: d.answer, pontos: d.points, segundos: d.elapsedSeconds };
      } else {
        // Ninguém acertou: a resposta NÃO é revelada (regra do jogo).
        setSequencia(0);
        r = { tipo: "ninguem" };
      }
      setResultado(r);
      clearTimeout(fecharResultadoRef.current);
      fecharResultadoRef.current = setTimeout(() => setResultado(null), 3800);
    });
    s.on("quiz-guess-wrong", () => {
      somErro();
      setTremer(true);
      setTimeout(() => setTremer(false), 450);
    });
    s.on("quiz-answer-log", (d) => {
      if (d.correct) return;
      setTentativas((prev) => [...prev, d].slice(-8));
    });
    s.on("quiz-players-online", (d) => setJogadores(d.players || []));
    s.on("quiz-chat-message", (m) => addMsg(m));
    s.on("chat-message-deleted", ({ id }) => setMsgs((prev) => prev.filter((m) => m.id !== id)));
    s.on("aviso-inatividade", (d) => addMsg({ system: true, message: d.mensagem }));
    s.on("removido-por-inatividade", (d) => {
      alert(d?.mensagem || "Você saiu da sala por inatividade.");
      irPara(null);
    });

    s.connect();
    return () => {
      clearTimeout(fecharResultadoRef.current);
      s.removeAllListeners();
      s.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    chatFimRef.current?.scrollIntoView({ block: "end" });
  }, [msgs]);

  function enviarPalpite(e) {
    e.preventDefault();
    const g = palpite.trim();
    // Refoco DENTRO do submit: é o que mantém o teclado aberto no iOS.
    inputRef.current?.focus();
    if (!g || fase !== "active") return;
    socketRef.current?.emit("quiz-submit-guess", { guess: g });
    setPalpite("");
  }

  function enviarChat(e) {
    e.preventDefault();
    const t = textoChat.trim();
    if (!t) return;
    socketRef.current?.emit("quiz-chat-message", { message: t });
    setTextoChat("");
  }

  const ativa = fase === "active";
  const fracao = total > 0 ? Math.max(0, Math.min(1, tempo / total)) : 0;
  const urgente = ativa && tempo <= 5;
  const tema = nomeDoTema(nomeSala);
  const nivel = nomeSala.includes("Avançad") ? "Avançada" : nomeSala.includes("Padrão") ? "Padrão" : "";

  if (cheia) {
    return (
      <div className="v2-app v2-centro">
        <div className="v2-cartao-entrar">
          <div className="v2-logo-grande">Sala cheia!</div>
          <p>{cheia.roomLabel || "Essa sala"} está lotada{cheia.maxPlayers ? ` (${cheia.maxPlayers} jogadores)` : ""}. Tenta outro tema?</p>
          <button className="v2-botao v2-botao-amarelo" onClick={() => irPara(null)}>Voltar ao lobby</button>
        </div>
      </div>
    );
  }

  return (
    <div className="v2-app v2-sala">
      <header className="v2-sala-topo">
        <button className="v2-voltar" aria-label="Voltar ao lobby" onClick={() => irPara(null)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="v2-sala-titulo">
          <div className="v2-sala-nome">{tema || "Carregando…"}</div>
          <div className="v2-sala-info">{nivel ? `Sala ${nivel} · ` : ""}{jogadores.length} jogando</div>
        </div>
        <button className="v2-mudo" aria-label={mudo ? "Ligar som" : "Desligar som"} onClick={() => setMudo(alternarMudo())}>
          {mudo ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H3v6h3l5 4zM22 9l-6 6M16 9l6 6" /></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" /></svg>
          )}
        </button>
        <div className={`v2-relogio ${urgente ? "urgente" : ""}`} aria-label={ativa ? `${tempo} segundos` : "Intervalo"}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={RAIO} className="v2-relogio-fundo" />
            <circle cx="32" cy="32" r={RAIO} className="v2-relogio-arco" strokeDasharray={VOLTA} strokeDashoffset={VOLTA * (1 - (ativa ? fracao : 0))} />
          </svg>
          <span>{ativa ? tempo : "…"}</span>
        </div>
      </header>

      <div className="v2-sala-corpo">
        <aside className="v2-placar" aria-label="Placar da sala">
          <div className="v2-bloco-titulo">Placar do mês</div>
          <div className="v2-placar-lista">
            {jogadores.map((j) => (
              <div key={j.userId} className={`v2-jogador ${j.userId === usuario.id ? "eu" : ""}`}>
                <span className="v2-bolinha" style={{ background: corDoJogador(j.userId) }}>{iniciais(j.nickname)}</span>
                <span className="v2-jogador-nome">{j.nickname}</span>
                <span className="v2-jogador-pts">{(j.roomMonthlyPoints || 0).toLocaleString("pt-BR")}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="v2-palco">
          <section key={numero} className={`v2-pergunta ${ativa ? "entrando" : "esperando"}`}>
            <div className="v2-pergunta-topo">
              <span className="v2-etiqueta">{ativa ? "Valendo!" : "Intervalo"}</span>
              {sequencia >= 2 && (
                <span className="v2-sequencia">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3.5 2-4.5.3 1.5 1 2.5 2 3 0-3 .5-5.5 1-8.5z" /></svg>
                  sequência {sequencia}
                </span>
              )}
            </div>
            <p className="v2-pergunta-texto">{pergunta || "Aguardando a primeira pergunta…"}</p>
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
          </section>

          {tentativas.length > 0 && (
            <div className="v2-tentativas" aria-label="Tentativas erradas">
              {tentativas.map((t, i) => (
                <span key={i} className="v2-tentativa"><b>{t.nickname}:</b> {t.guess}</span>
              ))}
            </div>
          )}

          <form className={`v2-resposta ${tremer ? "tremer" : ""}`} onSubmit={enviarPalpite}>
            <label htmlFor="v2-palpite" className="v2-oculto">Sua resposta</label>
            <input
              id="v2-palpite"
              ref={inputRef}
              value={palpite}
              onChange={(e) => setPalpite(e.target.value)}
              onPaste={(e) => { e.preventDefault(); setAvisoColar(true); setTimeout(() => setAvisoColar(false), 2500); }}
              placeholder={ativa ? "Digite sua resposta…" : "Espere a próxima pergunta…"}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={120}
            />
            <button type="submit" className="v2-enviar" aria-label="Enviar resposta" disabled={!ativa}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
            </button>
          </form>
          {avisoColar && <p className="v2-aviso">Colar não vale — precisa digitar!</p>}
        </main>

        <aside className="v2-chat" aria-label="Chat da sala">
          <div className="v2-bloco-titulo">Chat</div>
          <div className="v2-chat-lista">
            {msgs.map((m) => (
              <div key={m.id || m._k} className={m.system ? "v2-msg sistema" : "v2-msg"}>
                {!m.system && <b style={{ color: corDoJogador(m.userId) }}>{m.nickname}: </b>}
                {m.message}
              </div>
            ))}
            <div ref={chatFimRef} />
          </div>
          <form className="v2-chat-form" onSubmit={enviarChat}>
            <label htmlFor="v2-chat-input" className="v2-oculto">Mensagem</label>
            <input id="v2-chat-input" value={textoChat} onChange={(e) => setTextoChat(e.target.value)} placeholder="Mandar mensagem…" maxLength={300} autoComplete="off" />
          </form>
        </aside>
      </div>

      {resultado && (
        <div className={`v2-resultado ${resultado.tipo}`} role="status" onClick={() => setResultado(null)}>
          {resultado.tipo === "eu" && <Confete />}
          <div className="v2-resultado-selo">
            {resultado.tipo === "ninguem" ? (
              <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9 9.5h.01M15 9.5h.01M8.5 16c2-1.5 5-1.5 7 0" /></svg>
            ) : (
              <svg width="78" height="78" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12.5l5 5 10-11" /></svg>
            )}
          </div>
          <div className="v2-resultado-titulo">
            {resultado.tipo === "eu" ? "ACERTOU!" : resultado.tipo === "outro" ? `${resultado.nick} acertou!` : "Ninguém acertou"}
          </div>
          {resultado.resposta && <div className="v2-resultado-resposta">{resultado.resposta}</div>}
          {resultado.tipo === "ninguem" && <div className="v2-resultado-sub">A resposta fica em segredo…</div>}
          {resultado.tipo === "eu" && (
            <div className="v2-resultado-cards">
              {resultado.pontos != null && <div className="v2-mini-card"><b>+{resultado.pontos}</b><span>pontos</span></div>}
              {resultado.segundos != null && <div className="v2-mini-card"><b>{resultado.segundos}s</b><span>pra acertar</span></div>}
              {sequencia >= 2 && <div className="v2-mini-card amarelo"><b>{sequencia}</b><span>em sequência</span></div>}
            </div>
          )}
          <div className="v2-resultado-barra"><span /></div>
        </div>
      )}
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
