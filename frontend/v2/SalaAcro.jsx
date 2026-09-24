import DicaNova from "./DicaNova.jsx";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { novoSocket, ehSessaoMorta, sair } from "./api.js";
import { voltarAoLobby } from "./App.jsx";
import { corDoJogador, iniciais } from "./temas.js";
import { ativarSons, somPergunta, somAcerto, somTique, estaMudo, alternarMudo, estaSemAnimacao, alternarAnimacao, ouvirPreferencias } from "./sons.js";
import Avatar from "./Avatar.jsx";
import { BonecoDoJogador } from "./AvatarBoneco.jsx";
import { CampoChat, TextoSistema, TextoComMarcacoes, useColarNoFim } from "./Chat.jsx";
import IconePatente from "./IconePatente.jsx";
import { FiguraPodio } from "./PodioSala.jsx";
import ListaJogadores from "./ListaJogadores.jsx";
import NickHover from "./NickHover.jsx";
import { BotaoConvidar, ConviteRecebido } from "./Convites.jsx";
import ChatAmigosFlutuante from "./ChatAmigosFlutuante.jsx";

const RAIO = 30;
const VOLTA = 2 * Math.PI * RAIO;

// Mesmas regras do clássico — ficam à vista na sala.
export const REGRAS_ACRO = [
  ["+15", "por voto que a sua frase receber"],
  ["+50", "se a sua frase for a mais votada"],
  ["+10", "se você votar na frase que vencer"],
  ["+5", "pro primeiro a enviar a frase"],
  ["0", "quem não vota não pontua na rodada"],
];

export default function SalaAcro({ roomId, usuario, compacto = false, ativo = false, aoFechar = null }) {
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const chatListaRef = useRef(null);
  const uid = useId();
  const tempoAntesRef = useRef(null);

  const [socket, setSocket] = useState(null);
  const [nomeSala, setNomeSala] = useState("");
  const [fase, setFase] = useState("intermission"); // intermission | writing | voting | grading
  const [tempo, setTempo] = useState(0);
  const [total, setTotal] = useState(60);
  const [tema, setTema] = useState("");
  const [letras, setLetras] = useState([]);
  const [frase, setFrase] = useState("");
  const [enviada, setEnviada] = useState(false);
  const [erroFrase, setErroFrase] = useState("");
  const [avisoColar, setAvisoColar] = useState(false);
  const [quemEnviou, setQuemEnviou] = useState([]);
  const [quemVotou, setQuemVotou] = useState([]);
  const [opcoes, setOpcoes] = useState([]);
  const [meuVoto, setMeuVoto] = useState(null);
  const [minhaFrase, setMinhaFrase] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [turno, setTurno] = useState({ rodada: null, total: null });
  const [placar, setPlacar] = useState([]);
  const [fimPartida, setFimPartida] = useState(null);
  const [bonusVoto, setBonusVoto] = useState(0);
  const [espera, setEspera] = useState(null);
  const [botsLigados, setBotsLigados] = useState(false);
  const [permiteBots, setPermiteBots] = useState(false);
  const [faltaGente, setFaltaGente] = useState(false);
  const [jogadores, setJogadores] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [cheia, setCheia] = useState(false);
  const [erroServidor, setErroServidor] = useState("");
  const [mudo, setMudo] = useState(estaMudo());
  // Confete de acerto ligado/desligado (preferência do aparelho, ao lado do mudo).
  const [semAnimacao, setSemAnimacao] = useState(estaSemAnimacao());
  // Mudou em outro botão (ex.: barra do "várias salas"): acompanha.
  useEffect(() => ouvirPreferencias(() => { setMudo(estaMudo()); setSemAnimacao(estaSemAnimacao()); }), []);
  const [aba, setAba] = useState("chat"); // celular: chat | placar | jogadores

  const addMsg = (m) => setMsgs((prev) => [...prev, { ...m, _k: Math.random() }].slice(-120));
  const podeModerar = usuario.role === "ADMIN" || usuario.role === "MODERATOR";

  useEffect(() => {
    const s = novoSocket();
    socketRef.current = s;
    setSocket(s);
    const entrar = () => s.emit("join-acromania-room", { roomId });
    s.on("connect", entrar);
    s.on("connect_error", (err) => {
      if (!ehSessaoMorta(err)) return;
      sair();
      window.location.replace("/v2/?pagina=entrar&sessao=expirada");
    });
    s.on("acromania-erro", (d) => setErroServidor(d?.mensagem || "Algo deu errado. Tente recarregar a página."));
    s.on("acromania-room-full", () => setCheia(true));
    s.on("acromania-room-state", (st) => {
      setErroServidor("");
      setNomeSala(st.label || "");
      setFase(st.state);
      setTempo(st.timeLeft || 0);
      setTema(st.theme || "");
      setLetras(st.letters || []);
      if (st.writingSeconds) setTotal(st.writingSeconds);
      if (st.roundsPerTurn) {
        setTurno({ rodada: st.turnRound, total: st.roundsPerTurn });
        setPlacar(st.turnRanking || []);
      }
      if (st.onlineCount < st.minPlayersToStart) setEspera({ minimo: st.minPlayersToStart, agora: st.onlineCount });
    });
    s.on("acromania-turn-finished", (d) => {
      const r = d?.ranking || [];
      setFimPartida(r);
      if (r.slice(0, 3).some((x) => x.userId === usuario.id)) somAcerto();
    });
    s.on("acromania-bonus-voto", (d) => setBonusVoto(d?.pontos || 0));
    s.on("acromania-online-players", (d) => {
      setJogadores(d.players || []);
      if (d.botsPedidos !== undefined) setBotsLigados(d.botsPedidos);
      if (d.permiteBots !== undefined) setPermiteBots(d.permiteBots);
      if (d.faltamJogadores !== undefined) setFaltaGente(d.faltamJogadores);
      if (d.players) setEspera((e) => (e ? { ...e, agora: d.players.length } : e));
    });
    s.on("acromania-bots-ligados", (d) => setBotsLigados(d?.ligados !== false));
    s.on("acromania-chat-message", (m) => addMsg(m));
    s.on("chat-message-deleted", ({ id }) => setMsgs((prev) => prev.filter((m) => m.id !== id)));
    s.on("acromania-intermission", (d) => {
      setFase("intermission");
      if (d?.seconds) { setTotal(d.seconds); setTempo(d.seconds); }
      setEnviada(false);
      setFrase("");
      setOpcoes([]);
      setMeuVoto(null);
      setMinhaFrase(null);
      setQuemEnviou([]);
      setQuemVotou([]);
      setEspera(d?.waitingForPlayers ? { minimo: d.minPlayersToStart, agora: d.onlineCount } : null);
    });
    s.on("acromania-tick", (d) => { setFase(d.state); setTempo(d.timeLeft); });
    s.on("acromania-round-start", (d) => {
      somPergunta();
      setFase("writing");
      setTema(d.theme);
      setLetras(d.letters || []);
      setTotal(d.seconds);
      setTempo(d.seconds);
      setEnviada(false);
      setFrase("");
      setErroFrase("");
      setResultado(null);
      setQuemEnviou([]);
      setEspera(null);
      setFimPartida(null);
      setBonusVoto(0);
    });
    s.on("acromania-phrase-submitted", () => { setEnviada(true); setErroFrase(""); });
    s.on("acromania-frase-invalida", (d) => setErroFrase(d?.motivo || "Sua frase não respeita as letras da rodada."));
    s.on("acromania-submissions-update", (d) =>
      setQuemEnviou(d.jogadores || (d.nicknames || []).map((nickname) => ({ nickname, primeiro: false })))
    );
    s.on("acromania-voting-start", (d) => {
      setFase("voting");
      setOpcoes(d.entries || []);
      setTotal(d.seconds);
      setTempo(d.seconds);
      setMeuVoto(null);
      setMinhaFrase(null);
      setErroFrase("");
      setQuemVotou([]);
      if (d?.roundsPerTurn) setTurno({ rodada: d.turnRound, total: d.roundsPerTurn });
      setBonusVoto(0);
    });
    s.on("acromania-votes-update", (d) => setQuemVotou(d?.jogadores || []));
    s.on("acromania-minha-frase", (d) => setMinhaFrase(d?.entryId || null));
    s.on("acromania-vote-registered", (d) => { if (d?.entryId) setMeuVoto(d.entryId); });
    s.on("acromania-round-result", (d) => {
      setFase("grading");
      setResultado(d);
      setOpcoes([]);
      if (d?.roundsPerTurn) {
        setTurno({ rodada: d.turnRound, total: d.roundsPerTurn });
        setPlacar(d.turnRanking || []);
      }
      // Minha frase ganhou? Comemora.
      const top = (d?.entries || []).reduce((m, e) => Math.max(m, e.votes || 0), 0);
      if (top > 0 && (d?.entries || []).some((e) => e.userId === usuario.id && e.votes === top)) somAcerto();
    });
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
    return () => { s.removeAllListeners(); s.disconnect(); };
  }, [roomId]);

  // Tique nos últimos 5 segundos da escrita (só quando o tempo DESCE).
  useEffect(() => {
    const antes = tempoAntesRef.current;
    tempoAntesRef.current = tempo;
    if (fase !== "writing" || antes === null || tempo >= antes) return;
    if (tempo > 0 && tempo <= 5) somTique();
  }, [tempo, fase]);

  // Sons só existem dentro das salas: é aqui que eles são ligados.
  useEffect(() => { ativarSons(); }, []);

  const sairDaSala = () => (aoFechar ? aoFechar() : voltarAoLobby("acromania"));

  // CURSOR NO CAMPO QUANDO A RODADA COMEÇA (mesma lógica do clássico).
  // Tenta no próximo quadro e de novo 120ms depois (o campo pode ainda estar
  // montando). Não rouba o foco de quem está digitando em outro campo — o
  // chat é exceção: começou a rodada, responder vale mais que a mensagem.
  // No multi-sala só a sala ATIVA mexe no cursor. No iPhone o teclado só
  // abre por toque; ali quem segura o foco é o campo nunca desmontar.
  useEffect(() => {
    if (fase !== "writing") return;
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
  }, [fase, tema, ativo]);

  // Rola SÓ a caixa do chat. scrollIntoView rolava a página inteira no
  // celular — cada mensagem nova (inclusive a de acerto) puxava a tela.
  // Só gruda no fim se a pessoa já estava lá (ou se a mensagem é dela); a
  // caixa mudando de tamanho (multi-sala, abas, teclado) também segue colada.
  const ultimaMsg = msgs[msgs.length - 1];
  useColarNoFim(chatListaRef, ultimaMsg?.id || ultimaMsg?._k, !!ultimaMsg && !ultimaMsg.system && ultimaMsg.userId === usuario.id, aba);
  useEffect(() => {
    if (!fimPartida) return;
    const t = setTimeout(() => setFimPartida(null), 8000);
    return () => clearTimeout(t);
  }, [fimPartida]);

  function enviarFrase(e) {
    e.preventDefault();
    inputRef.current?.focus();
    const f = frase.trim();
    if (!f) return;
    socketRef.current?.emit("acromania-submit-phrase", { phrase: f });
  }

  function votar(id) {
    if (id === minhaFrase) return; // não dá pra votar na própria
    socketRef.current?.emit("acromania-vote", { entryId: id });
  }

  function enviarChat(texto) {
    socketRef.current?.emit("acromania-chat-message", { message: texto });
  }

  // Quais letras a frase já cobre, na ordem: acende cada ficha conforme a
  // pessoa digita. Só visual — quem valida de verdade é o servidor.
  const cobertas = useMemo(() => {
    const palavras = frase.trim().split(/\s+/).filter(Boolean);
    const tira = (x) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    return letras.map((l, i) => !!palavras[i] && tira(palavras[i]).startsWith(tira(l)));
  }, [frase, letras]);

  const eu = jogadores.find((j) => j.userId === usuario.id);
  const emJogo = fase === "writing" || fase === "voting";
  const fracao = total > 0 ? Math.max(0, Math.min(1, tempo / total)) : 0;
  const urgente = emJogo && tempo <= 5;
  const meuNick = usuario.nickname.toLowerCase();

  // Resultado: posição por número de votos (empates dividem a posição).
  const linhasResultado = useMemo(() => {
    if (!resultado?.entries) return [];
    const contagens = [...new Set(resultado.entries.map((e) => e.votes).filter((v) => v > 0))].sort((a, b) => b - a);
    const quantas = {};
    for (const e of resultado.entries) if (e.votes > 0) quantas[e.votes] = (quantas[e.votes] || 0) + 1;
    return resultado.entries.slice().sort((a, b) => b.votes - a.votes).map((e) => {
      const pos = e.votes > 0 ? contagens.indexOf(e.votes) + 1 : 0;
      return { ...e, pos, empate: (quantas[e.votes] || 0) > 1 };
    });
  }, [resultado]);

  if (cheia) {
    return (
      <div className="v2-app v2-centro">
        <div className="v2-cartao-entrar">
          <div className="v2-logo-grande">Sala lotada!</div>
          <p>Tenta de novo daqui a pouco.</p>
          <button className="v2-botao v2-botao-amarelo" onClick={() => sairDaSala()}>{aoFechar ? "Fechar esta sala" : "Voltar ao lobby"}</button>
        </div>
      </div>
    );
  }

  const blocoPlacar = (
    <div className="v2-acro-placar">
      <div className="v2-bloco-titulo">Placar da partida {turno.total > 0 && <span>{Math.min(turno.rodada || 1, turno.total)}/{turno.total}</span>}</div>
      {placar.length === 0 ? <div className="v2-vazio">Ninguém pontuou ainda nesta partida.</div> : placar.slice(0, 8).map((r) => (
        <div key={r.userId} className={`v2-acro-placar-linha ${r.userId === usuario.id ? "eu" : ""} ${r.position <= 3 ? `p${r.position}` : ""}`}>
          <span className="v2-rt-pos">{r.position}º</span>
          <span className="v2-rt-nick">{r.nickname}</span>
          <b>{r.points}</b>
        </div>
      ))}
      <details className="v2-acro-regras">
        <summary>como se pontua</summary>
        {REGRAS_ACRO.map(([p, t]) => <div key={t}><b>{p}</b> {t}</div>)}
      </details>
    </div>
  );

  return (
    <div className={`v2-app v2-sala v2-sala-acro aba-${aba} ${compacto ? "compacto" : ""}`}>
      <header className="v2-sala-topo">
        <button className="v2-voltar" aria-label="Sair da sala" title="Sair da sala" onClick={() => sairDaSala()}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <img className="v2-sala-icone v2-stop-logo" src="/acromania-logo.png" alt="" />
        <div className="v2-sala-titulo">
          <div className="v2-sala-nome">{nomeSala || "Carregando…"}</div>
          <div className="v2-sala-info">{turno.total > 0 ? `Rodada ${Math.min(turno.rodada || 1, turno.total)} de ${turno.total} · ` : ""}{jogadores.length} na sala</div>
        </div>
        <div className="v2-sala-pontos">
          <div className="v2-pontinho" title="Seus pontos nesta sala (todos os tempos)"><span>Pts sala</span><b>{(eu?.roomLifetimePoints ?? 0).toLocaleString("pt-BR")}</b></div>
          <div className="v2-pontinho" title="Seus pontos no Acromania (todos os tempos)"><span>Pts total</span><b>{(eu?.lifetimePoints ?? 0).toLocaleString("pt-BR")}</b></div>
          {eu?.rank?.icon && <img className={`v2-patente-topo ${eu.rank.brilha ? "brilha" : ""}`} src={eu.rank.icon} alt={eu.rank.name} title={`Sua patente: ${eu.rank.name}`} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
        </div>
        <BotaoConvidar socket={socket} roomId={roomId} nomeSala={nomeSala} jogo="acromania" />
        <button className="v2-mudo" aria-label={mudo ? "Ligar som" : "Desligar som"} title={mudo ? "Ligar som" : "Desligar som"} onClick={() => setMudo(alternarMudo())}>
          {mudo ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H3v6h3l5 4zM22 9l-6 6M16 9l6 6" /></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" /></svg>
          )}
        </button>
        <button className="v2-mudo" aria-label={semAnimacao ? "Ligar animação de acerto" : "Desligar animação de acerto"} title={semAnimacao ? "Ligar animação de acerto" : "Desligar animação de acerto"} onClick={() => setSemAnimacao(alternarAnimacao())}>
          {semAnimacao ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v5M12 17v5M2 12h5M17 12h5M4.9 19.1l3.5-3.5M15.6 8.4l3.5-3.5M4 4l16 16" /></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v5M12 17v5M2 12h5M17 12h5M4.9 4.9l3.5 3.5M15.6 15.6l3.5 3.5M4.9 19.1l3.5-3.5M15.6 8.4l3.5-3.5" /></svg>
          )}
        </button>
      </header>

      {erroServidor && <div className="v2-faixa-aviso erro v2-faixa-sala">{erroServidor}</div>}

      <div className="v2-sala-corpo">
        <aside className="v2-placar" aria-label="Jogadores na sala">
          <div className="v2-bloco-titulo">Jogadores <span>{jogadores.length}</span></div>
          <div className="v2-placar-lista">
            {jogadores.map((j, i) => (
              <div key={j.userId} className={`v2-jogador ${j.userId === usuario.id ? "eu" : ""}`}>
                <span className="v2-jogador-pos">{i + 1}</span>
                {j.ehBot ? (
                  <span className="v2-avatar-foto v2-avatar-bot" style={{ width: 40, height: 40 }} title="jogador automático">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 4v4M9 13h.01M15 13h.01M9 17h6" /></svg>
                  </span>
                ) : (
                  <IconePatente rank={j.rank} nickname={j.nickname} userId={j.userId} />
                )}
                <div className="v2-jogador-info">
                  {j.ehBot ? <span className="v2-jogador-nome">{j.nickname}</span> : (
                    <>
                      <NickHover userId={j.userId} nickname={j.nickname} meuId={usuario.id} gameKey="acromania">
                        <span className="v2-jogador-nome">{j.nickname}</span>
                      </NickHover>
                      {i === jogadores.findIndex((x) => !x.ehBot) && <DicaNova chave="nickname" texto="Toque no nome de alguém pra ver o perfil, os pontos do mês e a patente." lado="baixo-direita" />}
                    </>
                  )}
                  {j.ehBot ? <span className="v2-jogador-patente">jogador automático</span> : j.rank?.name && (
                    <span className="v2-jogador-patente">
                      {j.rank.name}
                    </span>
                  )}
                </div>
                <span className="v2-jogador-pts" title="Pontos nesta sala neste mês">{(j.roomMonthlyPoints ?? 0).toLocaleString("pt-BR")}</span>
              </div>
            ))}
            {jogadores.length === 0 && <div className="v2-vazio">Entrando na sala…</div>}
          </div>
        </aside>

        <main className="v2-palco">
          <section className="v2-pergunta v2-acro-cartao">
            <div className="v2-stop-cabeca">
              <div className="v2-stop-status">
                <span className="v2-etiqueta v2-acro-etiqueta">
                  {fase === "writing" ? "Escreva sua frase" : fase === "voting" ? "Vote na melhor" : fase === "grading" ? "Resultado" : "Intervalo"}
                </span>
                {tema && fase !== "intermission" ? <b className="v2-acro-tema">Tema: {tema}</b> : <b>{espera ? "Esperando mais jogadores…" : "Se prepara: vem tema e letras novas!"}</b>}
              </div>
              <div className={`v2-relogio ${urgente ? "urgente" : ""} ${emJogo ? "" : "intervalo"}`} aria-label={`${tempo} segundos`}>
                <svg viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r={RAIO} className="v2-relogio-fundo" />
                  <circle cx="36" cy="36" r={RAIO} className="v2-relogio-arco" strokeDasharray={VOLTA} strokeDashoffset={VOLTA * (1 - fracao)} />
                </svg>
                <span>{tempo > 0 ? tempo : "…"}</span>
                {!emJogo && <small>{espera ? "checagem" : "próxima"}</small>}
              </div>
            </div>

            {botsLigados && (
              <div className="v2-acro-bots">
                Tem jogadores automáticos nesta sala.
                <button onClick={() => socketRef.current?.emit("acromania-dispensar-bots")}>dispensar</button>
              </div>
            )}
            {permiteBots && !botsLigados && faltaGente && (
              <div className="v2-acro-chamar-bots">
                <button className="v2-botao v2-botao-amarelo" onClick={() => socketRef.current?.emit("acromania-chamar-bots", { quantos: 2 })}>Chamar jogadores automáticos</button>
                <span>A sala está vazia. Eles enchem a mesa pra você não ficar esperando — as frases são bobas de propósito.</span>
              </div>
            )}

            {fase === "intermission" && espera && (
              <div className="v2-stop-espera">
                <b>Faltam jogadores</b>
                <span>O Acromania roda com pelo menos {espera.minimo} pessoas — agora tem {espera.agora}. Chama a galera!</span>
              </div>
            )}

            {(fase === "writing" || fase === "voting") && letras.length > 0 && (
              <div className="v2-acro-letras" aria-label={`Letras: ${letras.join(", ")}`}>
                {letras.map((l, i) => (
                  <span key={`${l}${i}`} className={`v2-acro-letra ${fase === "writing" && cobertas[i] ? "ok" : ""}`} style={{ animationDelay: `${i * 90}ms` }}>{l}</span>
                ))}
              </div>
            )}

            {fase === "writing" && (
              <form className="v2-resposta v2-acro-form" onSubmit={enviarFrase}>
                <label htmlFor={`${uid}-frase`} className="v2-oculto">Sua frase</label>
                <input
                  id={`${uid}-frase`}
                  ref={inputRef}
                  value={frase}
                  onChange={(e) => { setFrase(e.target.value); if (erroFrase) setErroFrase(""); }}
                  onPaste={(e) => { e.preventDefault(); setAvisoColar(true); setTimeout(() => setAvisoColar(false), 2500); }}
                  maxLength={200}
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="send"
                  placeholder={`Uma frase com ${letras.join(" ")}…`}
                />
                <button type="submit" className="v2-enviar">{enviada ? "Trocar" : "Enviar"}</button>
              </form>
            )}
            {fase === "writing" && erroFrase && <p className="v2-acro-erro">{erroFrase}</p>}
            {fase === "writing" && avisoColar && <p className="v2-aviso">Colar não vale — precisa ser sua frase!</p>}
            {fase === "writing" && enviada && !erroFrase && (
              <p className="v2-acro-ok">Frase enviada! Dá pra trocar enquanto o tempo não acabar (trocar faz perder o bônus de mais rápido).</p>
            )}

            {fase === "voting" && (
              <div className="v2-acro-votacao">
                {opcoes.map((o, i) => {
                  const minha = o.entryId === minhaFrase;
                  return (
                    <button
                      key={o.entryId}
                      className={`v2-acro-opcao ${meuVoto === o.entryId ? "votada" : ""} ${minha ? "minha" : ""}`}
                      disabled={minha}
                      onClick={() => votar(o.entryId)}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <span>{o.phrase}</span>
                      {minha && <em>sua frase</em>}
                      {meuVoto === o.entryId && <em className="voto">seu voto</em>}
                    </button>
                  );
                })}
                {!meuVoto && <p className="v2-acro-aviso-voto">Vote numa frase — quem não vota não pontua na rodada.</p>}
              </div>
            )}

            {(fase === "grading" || fase === "intermission") && resultado && !espera && (
              <div className="v2-acro-resultado">
                {bonusVoto > 0 && <div className="v2-acro-bonus">Você votou na frase vencedora: <b>+{bonusVoto} pts</b></div>}
                {resultado.noOneWrote ? (
                  <p className="v2-acro-vazio">Ninguém escreveu uma frase nessa rodada.</p>
                ) : linhasResultado.map((e, i) => (
                  <div key={e.entryId} className={`v2-acro-linha ${e.pos === 1 ? (e.empate ? "empate" : "vencedora") : e.pos === 2 && !e.empate ? "segunda" : ""} ${e.userId === usuario.id ? "minha" : ""}`} style={{ animationDelay: `${i * 80}ms` }}>
                    {/* Autor da frase vencedora de corpo inteiro, comemorando
                        (no empate não: seriam vários). Bot não tem boneco. */}
                    {e.pos === 1 && !e.empate && !compacto && (
                      <div className="v2-acro-vencedor-boneco" aria-hidden="true">
                        <BonecoDoJogador userId={e.userId} altura={120} semFundo />
                      </div>
                    )}
                    <div className="v2-acro-linha-frase">
                      {e.pos === 1 && <span className="v2-acro-trofeu" aria-label={e.empate ? "empate" : "vencedora"}>{e.empate ? "=" : "1º"}</span>}
                      “{e.phrase}”
                    </div>
                    <div className="v2-acro-linha-meta">
                      <span className="v2-acro-autor"><span className="v2-bolinha-mini" style={{ background: corDoJogador(e.userId) }}>{iniciais(e.nickname)}</span>{e.nickname}{e.userId === usuario.id && <em>você</em>}</span>
                      <span className="v2-acro-votos">{e.votes} {e.votes === 1 ? "voto" : "votos"}</span>
                      {e.maisRapido && <span className="v2-acro-rapido">+ rápido</span>}
                      {e.naoVotou && <span className="v2-acro-naovotou" title="Quem não vota não pontua na rodada">não votou · 0 pts</span>}
                      {e.pontos > 0 && <b className="v2-acro-pts">+{e.pontos}</b>}
                    </div>
                    {e.detalhe?.length > 0 && <div className="v2-acro-conta">{e.detalhe.join(" · ")}</div>}
                  </div>
                ))}
              </div>
            )}

            {fimPartida && (
              <div className={`v2-resultado ${fimPartida.slice(0, 3).some((r) => r.userId === usuario.id) ? "eu" : "outro"} v2-stop-bonus`} role="status" onClick={() => setFimPartida(null)}>
                {fimPartida.slice(0, 3).some((r) => r.userId === usuario.id) && !semAnimacao && <Confete />}
                <div className="v2-resultado-titulo">Fim da partida!</div>
                {fimPartida.length === 0 ? <div className="v2-resultado-sub">Ninguém pontuou nessa partida.</div> : (
                  <div className="v2-stop-podio">
                    {[fimPartida[1], fimPartida[0], fimPartida[2]].filter(Boolean).map((r) => (
                      <div key={r.userId} className={`v2-stop-podio-item p${r.position}`}>
                        <FiguraPodio userId={r.userId} posicao={r.position}>
                          <IconePatente rank={jogadores.find((j) => j.userId === r.userId)?.rank} nickname={r.nickname} userId={r.userId} />
                        </FiguraPodio>
                        <span className="v2-stop-podio-nick">{r.nickname}</span>
                        <div className="v2-stop-podio-coluna"><b>{r.position}º</b><em>{r.points} pts</em></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="v2-stop-lateral v2-acro-lateral">
            {blocoPlacar}
            <div className="v2-acro-andamento">
              <div className="v2-bloco-titulo">{fase === "voting" ? "Já votaram" : "Já enviaram"}</div>
              {fase === "writing" ? (quemEnviou.length === 0 ? <div className="v2-vazio">Ninguém enviou ainda…</div>
                : quemEnviou.map((j, i) => <div key={i} className="v2-acro-andou">{j.nickname}{j.primeiro && <em>+ rápido</em>}</div>))
                : fase === "voting" ? (quemVotou.length === 0 ? <div className="v2-vazio">Ninguém votou ainda…</div>
                : quemVotou.map((j, i) => <div key={i} className="v2-acro-andou">{j.nickname}</div>))
                : <div className="v2-vazio">Aparece durante a escrita e a votação.</div>}
            </div>
          </section>
        </main>

        <aside className="v2-chat" aria-label="Chat da sala">
          <div className="v2-abas-celular" role="tablist">
            <button role="tab" aria-selected={aba === "chat"} className={aba === "chat" ? "ativa" : ""} onClick={() => setAba("chat")}>Chat</button>
            <button role="tab" aria-selected={aba === "legenda"} className={aba === "legenda" ? "ativa" : ""} onClick={() => setAba("legenda")}>Placar</button>
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
                  <span className={m.bold ? "negrito" : ""}>{m.system ? <TextoSistema mensagem={m.message} destaque={m.tituloDestaque} fila={m.fila} /> : <TextoComMarcacoes texto={m.message} participantes={jogadores.map((j) => j.nickname)} meuNick={usuario.nickname} />}</span>
                  {podeModerar && !m.system && m.id && (
                    <button className="v2-msg-apagar" aria-label="Apagar mensagem" title="Apagar mensagem" onClick={() => { if (window.confirm(`Apagar a mensagem de ${m.nickname}?`)) socketRef.current?.emit("delete-chat-message", { escopo: "acromania", id: m.id }); }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="v2-chat-legenda-celular">{blocoPlacar}</div>
          <div className="v2-lista-jogadores-celular"><ListaJogadores jogadores={jogadores} meuId={usuario.id} pontos={(j) => j.roomMonthlyPoints} /></div>
          <CampoChat id={`${uid}-chat`} aoEnviar={enviarChat} participantes={jogadores.filter((j) => !j.ehBot).map((j) => j.nickname)} meuNick={usuario.nickname} />
        </aside>
      </div>
      {!compacto && <ConviteRecebido socket={socket} />}
      {!compacto && <ChatAmigosFlutuante usuario={usuario} />}
    </div>
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
