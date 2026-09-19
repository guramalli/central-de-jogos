import { useEffect, useMemo, useRef, useState } from "react";
import { api, novoSocket, ehSessaoMorta, sair } from "./api.js";
import { irPara } from "./App.jsx";
import { corDoJogador } from "./temas.js";
import { somPergunta, somAcerto, somTique, somStop, estaMudo, alternarMudo } from "./sons.js";
import Avatar from "./Avatar.jsx";
import NickHover from "./NickHover.jsx";
import { BotaoConvidar, ConviteRecebido } from "./Convites.jsx";

const RAIO = 30;
const VOLTA = 2 * Math.PI * RAIO;
// Pontuação de cada situação (igual ao clássico).
const STATUS = {
  correct: { classe: "certa", pts: 10, rotulo: "única" },
  duplicate: { classe: "repetida", pts: 5, rotulo: "repetida" },
  solo: { classe: "solo", pts: 15, rotulo: "só você" },
  wrong: { classe: "errada", pts: 0, rotulo: "errada" },
  blank: { classe: "errada", pts: 0, rotulo: "em branco" },
};
const ehCelular = () => window.matchMedia("(max-width: 999px)").matches;

export default function SalaStop({ roomId, usuario }) {
  const socketRef = useRef(null);
  const inputsRef = useRef([]);
  const coladoRef = useRef(false);
  const corrigidoRef = useRef(false);
  const aguardandoRef = useRef(false);
  const resultadoPendenteRef = useRef(null);
  const atrasoRef = useRef(null);
  const alguemPediuRef = useRef(false);
  const chatFimRef = useRef(null);

  const [socket, setSocket] = useState(null);
  const [negado, setNegado] = useState(null);
  const [nomeSala, setNomeSala] = useState("");
  const [minCertas, setMinCertas] = useState(0);
  const [pronto, setPronto] = useState(false);
  const [stopNegado, setStopNegado] = useState(null);
  const [avisoColar, setAvisoColar] = useState(false);
  const [quemPediu, setQuemPediu] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [porTempo, setPorTempo] = useState(false);
  const [fase, setFase] = useState("intermission");
  const [tempo, setTempo] = useState(0);
  const [segResposta, setSegResposta] = useState(60);
  const [segIntervalo, setSegIntervalo] = useState(15);
  const [temas, setTemas] = useState([]);
  const [letra, setLetra] = useState(null);
  const [rodada, setRodada] = useState(0);
  const [rodadaBloco, setRodadaBloco] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [bonusBloco, setBonusBloco] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [jogadores, setJogadores] = useState([]);
  const [pular, setPular] = useState({ votes: 0, needed: 0, minPlayers: 3 });
  const [voteiPular, setVoteiPular] = useState(false);
  const [textoChat, setTextoChat] = useState("");
  const [mudo, setMudo] = useState(estaMudo());
  const [aba, setAba] = useState("chat"); // celular: chat | legenda

  const addMsg = (m) => setMsgs((prev) => [...prev, { ...m, _k: Math.random() }].slice(-120));
  const podeModerar = usuario.role === "ADMIN" || usuario.role === "MODERATOR";

  useEffect(() => {
    const s = novoSocket();
    socketRef.current = s;
    setSocket(s);
    const entrar = () => s.emit("join-stop-room", { roomId });
    s.on("connect", entrar);
    s.on("connect_error", (err) => {
      if (!ehSessaoMorta(err)) return;
      sair();
      window.location.replace("/login?sessao=expirada");
    });
    s.on("room-access-denied", (d) => setNegado(d || {}));
    s.on("stop-denied", (d) => setStopNegado(d || {}));
    s.on("stop-readiness", (d) => setPronto(!!d.ready));
    s.on("room-state", (st) => {
      setFase(st.state);
      setTempo(st.timeLeft || 0);
      setTemas(st.themes || []);
      setLetra(st.letter);
      setRodada(st.roundNumber);
      setRodadaBloco(st.roundInBlock);
      setNomeSala(st.label || "");
      setMinCertas(st.minCorrectToStop || 0);
      if (st.answerSeconds) setSegResposta(st.answerSeconds);
      if (st.intermissionSeconds) setSegIntervalo(st.intermissionSeconds);
      if (st.myAnswers) setRespostas(st.myAnswers);
    });
    s.on("round-intermission", () => {
      if (aguardandoRef.current) return;
      setFase("intermission");
      setVoteiPular(false);
    });
    s.on("round-start", (d) => {
      setFase("active");
      setTemas(d.themes || []);
      setLetra(d.letter);
      setRodada(d.roundNumber);
      setRodadaBloco(d.roundInBlock);
      if (d.seconds) { setSegResposta(d.seconds); setTempo(d.seconds); }
      setRespostas({});
      coladoRef.current = false;
      corrigidoRef.current = false;
      setResultado(null);
      setBonusBloco(null);
      setVoteiPular(false);
      setQuemPediu(null);
      setStopNegado(null);
      setPronto(false);
      aguardandoRef.current = false;
      setEnviando(false);
      resultadoPendenteRef.current = null;
      clearTimeout(atrasoRef.current);
      alguemPediuRef.current = false;
      setPorTempo(false);
      somPergunta();
      // Desktop: cursor no primeiro campo (no celular o teclado só abre por toque).
      requestAnimationFrame(() => {
        const f = document.activeElement;
        const digitando = f && (f.tagName === "INPUT" || f.tagName === "TEXTAREA") && !f.closest(".v2-chat-form");
        if (!digitando) inputsRef.current[0]?.focus({ preventScroll: true });
      });
    });
    s.on("player-stopped", (d) => {
      setQuemPediu({ nick: d.nickname || "Alguém", id: d.userId });
      alguemPediuRef.current = true;
      somStop();
      // Atraso proposital de 5s (igual ao clássico): dá tempo das últimas
      // letras digitadas chegarem ao servidor antes da apuração aparecer.
      aguardandoRef.current = true;
      setEnviando(true);
      resultadoPendenteRef.current = null;
      clearTimeout(atrasoRef.current);
      atrasoRef.current = setTimeout(() => {
        aguardandoRef.current = false;
        setEnviando(false);
        if (resultadoPendenteRef.current) {
          aplicarResultado(resultadoPendenteRef.current);
          resultadoPendenteRef.current = null;
        }
      }, 5000);
    });
    s.on("skip-vote-update", (d) => setPular(d));
    s.on("tick", (d) => {
      if (!aguardandoRef.current) setFase(d.state);
      setTempo(d.timeLeft);
      if (d.state === "active" && !aguardandoRef.current && d.timeLeft > 0 && d.timeLeft <= 5) somTique();
    });
    function aplicarResultado(d) {
      const tempoAcabou = !alguemPediuRef.current;
      setPorTempo(tempoAcabou);
      setFase("grading");
      setResultado(d);
      setQuemPediu(null);
    }
    s.on("round-result", (d) => {
      if (aguardandoRef.current) resultadoPendenteRef.current = d;
      else aplicarResultado(d);
    });
    s.on("block-bonus", (d) => {
      const lista = d.bonusResults || [];
      setBonusBloco(lista);
      if (lista.some((b) => b.userId === usuario.id)) somAcerto();
    });
    // Salas privadas usam votação da mesa — ainda não existem na v2.
    s.on("sala-aguardando", () => setFase("aguardando"));
    s.on("voting-tema", () => setFase("voting"));
    s.on("players-online", (d) => setJogadores(d.players || []));
    s.on("chat-message", (m) => addMsg(m));
    s.on("chat-message-deleted", ({ id }) => setMsgs((prev) => prev.filter((m) => m.id !== id)));
    s.on("aviso-inatividade", (d) => addMsg({ system: true, aviso: true, message: d.mensagem }));
    s.on("aviso-atividade", (d) => {
      if (d.roomId === roomId || (d.userId && d.userId === usuario.id)) return;
      addMsg({ system: true, atividade: true, message: d.mensagem });
    });
    s.on("removido-por-inatividade", (d) => {
      alert(d?.mensagem || "Você saiu da sala por inatividade.");
      irPara(null);
    });

    s.connect();
    return () => {
      clearTimeout(atrasoRef.current);
      s.removeAllListeners();
      s.disconnect();
    };
  }, [roomId]);

  useEffect(() => { chatFimRef.current?.scrollIntoView({ block: "end" }); }, [msgs, aba]);
  useEffect(() => {
    if (!stopNegado) return;
    const t = setTimeout(() => setStopNegado(null), 3500);
    return () => clearTimeout(t);
  }, [stopNegado]);
  useEffect(() => {
    if (!bonusBloco) return;
    const t = setTimeout(() => setBonusBloco(null), 7000);
    return () => clearTimeout(t);
  }, [bonusBloco]);
  useEffect(() => {
    if (!porTempo) return;
    const t = setTimeout(() => setPorTempo(false), 5000);
    return () => clearTimeout(t);
  }, [porTempo]);

  const ativa = fase === "active" && !enviando;
  function pedirStop() { if (ativa) socketRef.current?.emit("stop"); }

  // Ctrl+Enter pede STOP de qualquer lugar (menos do chat).
  useEffect(() => {
    const tecla = (e) => {
      if (e.key !== "Enter" || !(e.ctrlKey || e.metaKey)) return;
      if (e.target?.closest?.(".v2-chat-form")) return;
      if (ativa) { e.preventDefault(); pedirStop(); }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [ativa]);

  function atualizar(chave, valor) {
    const prox = { ...respostas, [chave]: valor };
    setRespostas(prox);
    socketRef.current?.emit("submit-answers", {
      answers: prox,
      behavior: { pasted: coladoRef.current, corrected: corrigidoRef.current },
    });
  }

  function teclaNoCampo(e, idx, chave) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) return;
    if (e.key === "Enter") {
      e.preventDefault();
      if (idx === temas.length - 1 && ativa) { e.currentTarget.blur(); pedirStop(); return; }
      inputsRef.current[idx + 1]?.focus();
      return;
    }
    if (e.key === "Tab" && !e.shiftKey && idx === temas.length - 1) { e.preventDefault(); inputsRef.current[0]?.focus(); return; }
    if (e.key === "Tab" && e.shiftKey && idx === 0) { e.preventDefault(); inputsRef.current[temas.length - 1]?.focus(); return; }
    if ((e.key === "Backspace" || e.key === "Delete") && (respostas[chave] || "")) corrigidoRef.current = true;
    if (e.key === "Backspace" && !(respostas[chave] || "")) { e.preventDefault(); inputsRef.current[idx - 1]?.focus(); }
  }

  function votarPular() {
    if (voteiPular) return;
    setVoteiPular(true);
    socketRef.current?.emit("vote-skip-intermission");
  }

  function enviarChat(e) {
    e.preventDefault();
    const t = textoChat.trim();
    if (!t) return;
    socketRef.current?.emit("chat-message", { message: t });
    setTextoChat("");
  }

  const eu = jogadores.find((j) => j.userId === usuario.id);
  const semPontos = !!eu?.semPontuacao;
  const preenchidas = temas.filter((t) => (respostas[t.key] || "").trim()).length;
  const fracao = fase === "active"
    ? (segResposta > 0 ? Math.max(0, Math.min(1, tempo / segResposta)) : 0)
    : (segIntervalo > 0 ? Math.max(0, Math.min(1, tempo / segIntervalo)) : 0);
  const urgente = ativa && tempo <= 10;
  const podePular = fase !== "active" && !enviando && pular.needed >= pular.minPlayers;
  const nicks = useMemo(() => jogadores.map((j) => j.nickname.toLowerCase()), [jogadores]);
  const meuNick = usuario.nickname.toLowerCase();

  if (negado) {
    return (
      <div className="v2-app v2-centro">
        <div className="v2-cartao-entrar">
          <div className="v2-logo-grande">{negado.full ? "Sala lotada!" : "Sala trancada"}</div>
          {negado.full ? (
            <p>A <b>{negado.roomLabel}</b> está com o máximo de {negado.maxPlayers} jogadores. Tenta de novo daqui a pouco!</p>
          ) : (
            <p>A <b>{negado.roomLabel}</b> exige {Number(negado.required || 0).toLocaleString("pt-BR")} pontos vitalícios no Stop. Você tem {Number(negado.current || 0).toLocaleString("pt-BR")} — continue jogando nas salas abertas pra liberar.</p>
          )}
          <button className="v2-botao v2-botao-amarelo" onClick={() => irPara(null)}>Voltar ao lobby</button>
        </div>
      </div>
    );
  }

  const legenda = (
    <div className="v2-stop-legenda">
      <div className="v2-bloco-titulo">Pontuação</div>
      <div className="v2-leg"><i className="certa" />única <b>10</b></div>
      <div className="v2-leg"><i className="repetida" />repetida <b>5</b></div>
      <div className="v2-leg"><i className="solo" />só você acertou o tema <b>15</b></div>
      <div className="v2-leg"><i className="errada" />errada ou em branco <b>0</b></div>
      <div className="v2-leg-bonus">A cada 10 rodadas: 1º +150 · 2º +100 · 3º +50</div>
    </div>
  );

  return (
    <div className={`v2-app v2-sala v2-sala-stop aba-${aba}`}>
      <header className="v2-sala-topo">
        <button className="v2-voltar" aria-label="Sair da sala" title="Sair da sala" onClick={() => irPara(null)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <img className="v2-sala-icone v2-stop-logo" src="/stop-logo.png" alt="" />
        <div className="v2-sala-titulo">
          <div className="v2-sala-nome">{nomeSala || "Carregando…"}</div>
          <div className="v2-sala-info">Rodada {rodadaBloco || "–"} de 10 · {jogadores.length} jogando</div>
        </div>
        <div className="v2-sala-pontos">
          {semPontos ? (
            <div className="v2-pontinho"><span>Placar da partida</span><b>{(eu?.blockPoints ?? 0).toLocaleString("pt-BR")}</b></div>
          ) : (
            <>
              <div className="v2-pontinho" title="Seus pontos nesta sala (todos os tempos)"><span>Pts sala</span><b>{(eu?.roomLifetimePoints ?? 0).toLocaleString("pt-BR")}</b></div>
              <div className="v2-pontinho" title="Seus pontos no Stop (todos os tempos)"><span>Pts total</span><b>{(eu?.lifetimePoints ?? 0).toLocaleString("pt-BR")}</b></div>
              {eu?.rank?.icon && <img className={`v2-patente-topo ${eu.rank.brilha ? "brilha" : ""}`} src={eu.rank.icon} alt={eu.rank.name} title={`Sua patente: ${eu.rank.name}`} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
            </>
          )}
        </div>
        <BotaoConvidar socket={socket} roomId={roomId} nomeSala={nomeSala} jogo="stop" />
        <button className="v2-mudo" aria-label={mudo ? "Ligar som" : "Desligar som"} title={mudo ? "Ligar som" : "Desligar som"} onClick={() => setMudo(alternarMudo())}>
          {mudo ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H3v6h3l5 4zM22 9l-6 6M16 9l6 6" /></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" /></svg>
          )}
        </button>
      </header>

      {semPontos && <div className="v2-faixa-zoeira">Esta sala é só resenha: <b>não conta pontos</b> pro ranking nem pra premiação.</div>}

      <div className="v2-sala-corpo">
        <aside className="v2-placar" aria-label="Jogadores na sala">
          <div className="v2-bloco-titulo">Jogadores <span>{jogadores.length}</span></div>
          <div className="v2-placar-lista">
            {jogadores.map((j, i) => (
              <div key={j.userId} className={`v2-jogador ${j.userId === usuario.id ? "eu" : ""}`}>
                <span className="v2-jogador-pos">{i + 1}</span>
                <Avatar userId={j.userId} nickname={j.nickname} tamanho={40} />
                <div className="v2-jogador-info">
                  <NickHover userId={j.userId} nickname={j.nickname} meuId={usuario.id} gameKey="stop">
                    <span className="v2-jogador-nome">{j.nickname}</span>
                  </NickHover>
                  {j.rank?.name && (
                    <span className="v2-jogador-patente">
                      {j.rank.icon && <img src={j.rank.icon} alt="" className={j.rank.brilha ? "brilha" : ""} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                      {j.rank.name}
                    </span>
                  )}
                </div>
                <span className="v2-jogador-pts" title={j.semPontuacao ? "Placar da partida" : "Pontos nesta sala neste mês"}>
                  {(j.semPontuacao ? j.blockPoints ?? 0 : j.roomMonthlyPoints ?? 0).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
            {jogadores.length === 0 && <div className="v2-vazio">Entrando na sala…</div>}
          </div>
        </aside>

        <main className="v2-palco">
          <section className="v2-pergunta v2-stop-cartao">
            <div className="v2-stop-cabeca">
              <div key={`${rodada}-${letra}`} className={`v2-stop-letra ${fase === "active" ? "girando" : ""}`} aria-label={letra ? `Letra ${letra}` : "Sem letra"}>
                {letra || "?"}
              </div>
              <div className="v2-stop-status">
                <b>
                  {enviando ? "Enviando palavras…"
                    : fase === "active" ? "Preencha as lacunas!"
                    : resultado ? `Resultado da rodada ${resultado.roundInBlock ?? resultado.roundNumber} de 10`
                    : fase === "voting" || fase === "aguardando" ? "Esta sala usa a votação da mesa — jogue pelo site clássico."
                    : "Sorteando a próxima letra…"}
                </b>
                <span>
                  {fase === "active" && !enviando ? `${preenchidas} de ${temas.length} preenchidas${minCertas > 0 ? ` · mínimo de ${minCertas} certas pra pedir STOP` : ""}`
                    : fase !== "active" && !enviando ? "Próxima rodada logo mais" : ""}
                </span>
              </div>
              <div className={`v2-relogio ${urgente ? "urgente" : ""} ${fase === "active" ? "" : "intervalo"}`} aria-label={fase === "active" ? `${tempo} segundos` : `Próxima rodada em ${tempo} segundos`}>
                <svg viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r={RAIO} className="v2-relogio-fundo" />
                  <circle cx="36" cy="36" r={RAIO} className="v2-relogio-arco" strokeDasharray={VOLTA} strokeDashoffset={VOLTA * (1 - fracao)} />
                </svg>
                <span>{tempo > 0 ? tempo : "…"}</span>
                {fase !== "active" && <small>próxima</small>}
              </div>
            </div>

            {fase === "active" && (
              <div className="v2-stop-campos">
                {temas.map((t, idx) => {
                  const v = respostas[t.key] || "";
                  return (
                    <label key={t.key} className={`v2-stop-campo ${v.trim() ? "preenchido" : ""}`}>
                      <span>{t.name}</span>
                      <input
                        ref={(el) => (inputsRef.current[idx] = el)}
                        value={v}
                        placeholder={letra ? `${letra}…` : ""}
                        maxLength={40}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        enterKeyHint={idx === temas.length - 1 ? "done" : "next"}
                        disabled={enviando}
                        onChange={(e) => atualizar(t.key, e.target.value)}
                        onPaste={(e) => { e.preventDefault(); coladoRef.current = true; setAvisoColar(true); setTimeout(() => setAvisoColar(false), 2500); }}
                        onKeyDown={(e) => teclaNoCampo(e, idx, t.key)}
                      />
                    </label>
                  );
                })}
              </div>
            )}
            {avisoColar && <p className="v2-aviso">Colar não vale — precisa digitar!</p>}

            {fase === "active" && (
              <div className="v2-stop-acao">
                <button className={`v2-botao-stop ${pronto || minCertas === 0 ? "pronto" : ""} ${stopNegado ? "negado" : ""}`} onClick={pedirStop} disabled={enviando}>
                  STOP!
                </button>
                <span className="v2-stop-dica">
                  {stopNegado
                    ? stopNegado.reason === "too-early" ? `Calma! Só dá pra pedir STOP depois de ${stopNegado.minSeconds} segundos.`
                      : stopNegado.reason === "not-filled" ? "Preencha todas as lacunas pra pedir STOP."
                      : `Precisa de pelo menos ${minCertas} palavras certas pra pedir STOP.`
                    : ehCelular() ? "Aperte Enter na última lacuna pra pedir STOP." : "Atalho: Ctrl+Enter pede STOP de qualquer campo."}
                </span>
              </div>
            )}

            {fase !== "active" && resultado && <Resultado resultado={resultado} meuId={usuario.id} semPontos={semPontos} />}
            {fase !== "active" && !resultado && (
              <div className="v2-stop-espera">
                <b>Fique pronto!</b>
                <span>Quando a letra aparecer, os 6 temas abrem aqui.</span>
              </div>
            )}

            {fase !== "active" && !enviando && (
              <div className="v2-stop-pular">
                <button className="v2-botao-pequeno" onClick={votarPular} disabled={!podePular || voteiPular} title={!podePular ? `Precisa de ${pular.minPlayers}+ jogadores na sala` : "Vote pra pular a espera"}>
                  {voteiPular ? "Voto registrado" : "Pular espera"}{podePular ? ` (${pular.votes}/${pular.needed})` : ""}
                </button>
              </div>
            )}

            {/* Overlays dentro do cartão, como no Quiz. */}
            {quemPediu && (
              <div className="v2-resultado v2-stop-pedido" role="status">
                <div className="v2-stop-pedido-placa">STOP!</div>
                <div className="v2-resultado-titulo">{quemPediu.id === usuario.id ? "Você pediu stop!" : `${quemPediu.nick} pediu stop!`}</div>
                <div className="v2-resultado-sub">Conferindo as palavras…</div>
              </div>
            )}
            {!quemPediu && porTempo && resultado && fase !== "active" && (
              <div className="v2-stop-selo-tempo">Stop por tempo</div>
            )}
            {bonusBloco && bonusBloco.length > 0 && fase !== "active" && (
              <div className={`v2-resultado ${bonusBloco.some((b) => b.userId === usuario.id) ? "eu" : "outro"} v2-stop-bonus`} role="status" onClick={() => setBonusBloco(null)}>
                {bonusBloco.some((b) => b.userId === usuario.id) && <Confete />}
                <div className="v2-resultado-titulo">Fim do bloco!</div>
                <div className="v2-stop-podio">
                  {[bonusBloco[1], bonusBloco[0], bonusBloco[2]].filter(Boolean).map((b) => (
                    <div key={b.userId} className={`v2-stop-podio-item p${b.position}`}>
                      <Avatar userId={b.userId} nickname={b.nickname} tamanho={b.position === 1 ? 56 : 44} borda />
                      <span className="v2-stop-podio-nick">{b.nickname}</span>
                      <div className="v2-stop-podio-coluna"><b>{b.position}º</b><em>+{b.bonus}</em></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="v2-stop-lateral">{legenda}</section>
        </main>

        <aside className="v2-chat" aria-label="Chat da sala">
          <div className="v2-abas-celular" role="tablist">
            <button role="tab" aria-selected={aba === "chat"} className={aba === "chat" ? "ativa" : ""} onClick={() => setAba("chat")}>Chat</button>
            <button role="tab" aria-selected={aba === "legenda"} className={aba === "legenda" ? "ativa" : ""} onClick={() => setAba("legenda")}>Pontuação</button>
          </div>
          <div className="v2-bloco-titulo">Chat</div>
          <div className="v2-chat-lista">
            {msgs.map((m) => {
              const citaMe = !m.system && m.userId !== usuario.id && meuNick.length > 2 && m.message?.toLowerCase().includes(meuNick);
              return (
                <div key={m.id || m._k} className={`v2-msg ${m.system ? "sistema" : ""} ${m.success ? "sucesso" : ""} ${m.promotion ? "promocao" : ""} ${m.aviso || m.atividade ? "aviso" : ""} ${citaMe ? "me-cita" : ""} ${m.userId === usuario.id ? "minha" : ""}`}>
                  {!m.system && (
                    <NickHover userId={m.userId} nickname={m.nickname} meuId={usuario.id} gameKey="stop">
                      <b style={{ color: corDoJogador(m.userId) }}>{m.clanTag ? `[${m.clanTag}] ` : ""}{m.nickname}</b>
                    </NickHover>
                  )}
                  {!m.system && " "}
                  <span className={m.bold ? "negrito" : ""}>{m.message}</span>
                  {podeModerar && !m.system && m.id && (
                    <button className="v2-msg-apagar" aria-label="Apagar mensagem" title="Apagar mensagem" onClick={() => socketRef.current?.emit("delete-chat-message", { escopo: "stop", id: m.id })}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  )}
                </div>
              );
            })}
            <div ref={chatFimRef} />
          </div>
          <div className="v2-chat-legenda-celular">{legenda}</div>
          <form className="v2-chat-form" onSubmit={enviarChat}>
            <label htmlFor="v2-chat-stop" className="v2-oculto">Mensagem</label>
            <input id="v2-chat-stop" value={textoChat} onChange={(e) => setTextoChat(e.target.value)} placeholder="Mandar mensagem…" maxLength={300} autoComplete="off" list="v2-nicks-stop" />
            <datalist id="v2-nicks-stop">{nicks.map((n) => <option key={n} value={n} />)}</datalist>
          </form>
        </aside>
      </div>
      <ConviteRecebido socket={socket} />
    </div>
  );
}

// Apuração: tabela no desktop, cartões por jogador no celular (mesmo
// componente, o CSS decide).
function Resultado({ resultado, meuId, semPontos }) {
  return (
    <div className="v2-apuracao">
      <div className="v2-apuracao-tabela" style={{ "--temas": resultado.themes.length }}>
        <div className="v2-apuracao-linha cabeca">
          <span className="v2-ap-jogador">Jogador</span>
          {resultado.themes.map((t) => <span key={t.key} className="v2-ap-tema">{t.name}</span>)}
          <span className="v2-ap-pts" title="Pontos nesta rodada">Pts</span>
          <span className="v2-ap-pts" title="Total do bloco de 10 rodadas">Bloco</span>
        </div>
        {resultado.players.map((p, i) => (
          <div key={p.userId} className={`v2-apuracao-linha ${p.userId === meuId ? "eu" : ""}`} style={{ animationDelay: `${i * 60}ms` }}>
            <span className="v2-ap-jogador">
              <Avatar userId={p.userId} nickname={p.nickname} tamanho={28} />
              <b>{p.nickname}</b>
            </span>
            {resultado.themes.map((t) => {
              const g = p.graded?.[t.key];
              const st = STATUS[g?.status || "blank"] || STATUS.blank;
              return (
                <span key={t.key} className={`v2-ap-palavra ${st.classe}`} title={`${t.name}: ${st.rotulo}${g?.destaque ? " · marcada como muito boa (+5)" : ""}`}>
                  <em className="v2-ap-tema-celular">{t.name}</em>
                  <span className="v2-ap-texto" title={g?.word || undefined}>{g?.word || "—"}{g?.destaque && <i className="v2-ap-estrela" aria-label="muito boa">★</i>}</span>
                  {g?.status === "wrong" && g?.word && !semPontos && (
                    <SugerirPalavra themeKey={t.key} letra={resultado.letter} palavra={g.word} />
                  )}
                </span>
              );
            })}
            <span className="v2-ap-pts"><b>+{p.points ?? 0}</b></span>
            <span className="v2-ap-pts">{p.blockTotal ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Palavra que o glossário não conhecia: dá pra sugerir pra revisão.
function SugerirPalavra({ themeKey, letra, palavra }) {
  const [estado, setEstado] = useState("");
  async function enviar(e) {
    e.stopPropagation();
    setEstado("enviando");
    try { await api.post("/glossary/suggest", { themeKey, letter: letra, word: palavra }); setEstado("ok"); }
    catch { setEstado("erro"); }
  }
  if (estado === "ok") return <span className="v2-ap-sugerida">sugerida</span>;
  return (
    <button className="v2-ap-sugerir" onClick={enviar} disabled={estado === "enviando"} title="Acha que essa palavra vale? Sugira pro glossário">
      {estado === "erro" ? "tentar de novo" : estado === "enviando" ? "…" : "+ sugerir"}
    </button>
  );
}

const CORES_CONFETE = ["#FFD60A", "#FF5A4D", "#FFFFFF", "#2B1B5E", "#FFB86F", "#C3A6FF"];
function Confete() {
  return (
    <div className="v2-confete" aria-hidden="true">
      {Array.from({ length: 24 }).map((_, i) => (
        <i key={i} style={{ left: `${(i * 41) % 100}%`, background: CORES_CONFETE[i % CORES_CONFETE.length], animationDelay: `${((i * 0.13) % 1.2).toFixed(2)}s`, width: i % 3 ? 9 : 14, height: i % 3 ? 16 : 8, borderRadius: i % 4 ? 3 : "50%" }} />
      ))}
    </div>
  );
}
