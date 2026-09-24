import { versaoTexto } from "./versoes.js";
import { useEffect, useRef, useState } from "react";
import { api, novoSocket, ehSessaoMorta } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Topo from "./Topo.jsx";
import Avatar from "./Avatar.jsx";
import { ativarSons, alternarMudo, estaMudo, estaSemAnimacao, alternarAnimacao, somRodada, somVitoriaRodada, somCampeao, volumeAtual, definirVolume } from "./sons.js";
import { CampoChat, TextoComMarcacoes, useColarNoFim } from "./Chat.jsx";
import { EscadaPatentes } from "./Lobby.jsx";

// MENTIRA SINCERA (em teste, escondido): só admin cria sala; quem tiver o
// link/código entra. O servidor manda o estado inteiro a cada mudança
// ("mentira-estado"), já personalizado — a verdade só vem na revelação.

const linkDaSala = (codigo) => `${window.location.origin}/v2/?pagina=mentira&mesa=${codigo}`;
// CONFETE: papéis coloridos caindo por cima da tela (some sozinho).
const CORES_CONFETE = ["#FFD60A", "#FF5A4D", "#06D6A0", "#7CC8FF", "#C3A6FF", "#FFB86F"];
export function Confete({ quantidade = 90, duracao = 4200 }) {
  const [pecas] = useState(() => Array.from({ length: quantidade }, (_, i) => ({
    id: i,
    esquerda: Math.random() * 100,
    atraso: Math.random() * 0.9,
    queda: 2.2 + Math.random() * 1.8,
    cor: CORES_CONFETE[i % CORES_CONFETE.length],
    giro: Math.floor(Math.random() * 720) - 360,
    largura: 6 + Math.random() * 7,
    redondo: Math.random() < 0.3,
  })));
  const [vivo, setVivo] = useState(true);
  useEffect(() => { const t = setTimeout(() => setVivo(false), duracao); return () => clearTimeout(t); }, []);
  if (!vivo || estaSemAnimacao() || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return null;
  return (
    <div className="v2-confete" aria-hidden="true">
      {pecas.map((p) => (
        <span key={p.id} style={{ left: `${p.esquerda}%`, background: p.cor, width: p.largura, height: p.redondo ? p.largura : p.largura * 1.6, borderRadius: p.redondo ? "50%" : "2px", animationDelay: `${p.atraso}s`, animationDuration: `${p.queda}s`, "--giro": `${p.giro}deg` }} />
      ))}
    </div>
  );
}

// CHAT DA SALA: mensagens, @menção, avisos do jogo e reações rápidas.
const REACOES = ["😂", "🤥", "😱", "🔥", "👏", "🤡"];
// `prefixo` e `reacoes`: o mesmo chat serve pra outros jogos (O Tribunal usa
// "tribunal-chat" / "tribunal-reagir").
export function ChatMentira({ estado, usuario, pedir, prefixo = "mentira", reacoes = REACOES }) {
  const listaRef = useRef(null);
  const [aviso, setAviso] = useState("");
  const chat = estado.chat || [];
  const nicks = estado.jogadores.filter((j) => !j.bot).map((j) => j.nickname);
  // A chave é o id da ÚLTIMA mensagem, não chat.length: o servidor manda só
  // as 50 últimas, então depois de 50 mensagens o tamanho parava de mudar e
  // o chat deixava de rolar sozinho.
  const ultimaMsg = chat[chat.length - 1];
  useColarNoFim(listaRef, ultimaMsg?.id, ultimaMsg?.uid === usuario.id);
  async function enviar(texto) {
    const r = await pedir(`${prefixo}-chat`, { texto });
    if (r?.erro) { setAviso(r.erro); setTimeout(() => setAviso(""), 3000); }
  }
  return (
    <section className="v2-cartao v2-mentira-chat" aria-label="Chat da sala">
      <div className="v2-bloco-titulo">Chat</div>
      <div className="v2-mentira-chat-lista" ref={listaRef} role="log" aria-live="polite">
        {chat.length === 0 && <p className="v2-mentira-chat-vazio">Ninguém falou nada ainda. Provoque! 😏</p>}
        {chat.map((m) => m.tipo === "sistema" ? (
          <p key={m.id} className="v2-mentira-chat-sistema">{m.texto}</p>
        ) : (
          <p key={m.id} className={`v2-mentira-chat-msg ${m.uid === usuario.id ? "minha" : ""}`}>
            <b style={{ color: m.uid === usuario.id ? "var(--amarelo)" : undefined }}>{m.nick}</b>{" "}
            <TextoComMarcacoes texto={m.texto} participantes={nicks} meuNick={usuario.nickname} />
          </p>
        ))}
      </div>
      <div className="v2-mentira-reacoes" role="group" aria-label="Reações rápidas">
        {reacoes.map((e) => <button key={e} onClick={() => pedir(`${prefixo}-reagir`, { emoji: e })} aria-label={`Reagir com ${e}`}>{e}</button>)}
      </div>
      {aviso && <p className="v2-mentira-chat-aviso" role="alert">{aviso}</p>}
      <CampoChat id={`v2-${prefixo}-chat`} aoEnviar={enviar} participantes={nicks} meuNick={usuario.nickname} maxLength={300} />
    </section>
  );
}

// Reações sobem flutuando pela tela de todo mundo (tipo live).
export function ReacoesFlutuando({ reacoes }) {
  const vistasRef = useRef(new Set());
  const [voando, setVoando] = useState([]);
  useEffect(() => {
    const novas = reacoes.filter((r) => !vistasRef.current.has(r.id));
    if (!novas.length) return;
    novas.forEach((r) => vistasRef.current.add(r.id));
    const itens = novas.map((r) => ({ ...r, x: 8 + Math.random() * 84, deriva: Math.round(Math.random() * 80 - 40) }));
    setVoando((v) => [...v, ...itens]);
    const t = setTimeout(() => setVoando((v) => v.filter((x) => !itens.includes(x))), 3200);
    return () => clearTimeout(t);
  }, [reacoes]);
  if (!voando.length || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return null;
  return (
    <div className="v2-reacoes-voando" aria-hidden="true">
      {voando.map((r) => (
        <span key={r.id} style={{ left: `${r.x}%`, "--deriva": `${r.deriva}px` }}>
          <i>{r.emoji}</i><small>{r.nick}</small>
        </span>
      ))}
    </div>
  );
}

// Top 3 do mês na lobby + link pro ranking completo (aba do Mentira).
const MEDALHAS = ["🥇", "🥈", "🥉"];
function Top3Mentira() {
  const [top, setTop] = useState(null);
  useEffect(() => {
    let vivo = true;
    api.get("/ranking/monthly/mentira").then(({ data }) => vivo && setTop((data || []).slice(0, 3))).catch(() => vivo && setTop([]));
    return () => { vivo = false; };
  }, []);
  if (top === null) return null;
  return (
    <section className="v2-cartao v2-mentira-top3" aria-label="Top 3 do mês">
      <div className="v2-cartao-cabeca">
        <h2>🏆 Top 3 do mês</h2>
        <a className="v2-link" href={linkDaPagina("ranking", { jogo: "mentira" })} onClick={(e) => { e.preventDefault(); irParaPagina("ranking", { jogo: "mentira" }); }}>ver ranking completo →</a>
      </div>
      {top.length === 0 ? (
        <p className="v2-cartao-nota">Ninguém pontuou ainda este mês — a primeira partida com 2 pessoas já coloca alguém aqui. 😏</p>
      ) : (
        <ol className="v2-mentira-top3-lista">
          {top.map((r, i) => (
            <li key={r.userId} className={`p${i + 1}`}>
              <span className="v2-mentira-top3-medalha">{MEDALHAS[i]}</span>
              <Avatar userId={r.userId} nickname={r.nickname} tamanho={i === 0 ? 44 : 36} />
              <span className="v2-mentira-top3-nome">
                <a href={linkDaPagina("jogador", { id: r.userId })} onClick={(e) => { e.preventDefault(); irParaPagina("jogador", { id: r.userId }); }}>{r.nickname}</a>
                {r.rank?.name && <small>{r.rank.icon && <img src={r.rank.icon} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />}{r.rank.name}</small>}
              </span>
              <b>{(r.points || 0).toLocaleString("pt-BR")}</b>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// Fim da partida: quanto ela rendeu no ranking do mês (ou por que não contou).
function GanhoNoRanking({ estado }) {
  const pessoas = estado.jogadores.filter((j) => !j.bot).length;
  if (pessoas < 2) return <p className="v2-mentira-ranking-fim nao">Partida sem ranking: precisa de pelo menos 2 pessoas de verdade (bots não contam).</p>;
  if (estado.meuGanhoRanking == null) return null; // ainda gravando (ou não concorre: visitante/admin)
  return <p className="v2-mentira-ranking-fim">📈 <b>+{estado.meuGanhoRanking.toLocaleString("pt-BR")}</b> pontos no ranking do mês</p>;
}

// Patentes do mês na lobby do jogo (mesma escada dos outros jogos).
function MinhaPatente() {
  const [mensal, setMensal] = useState(null);
  useEffect(() => {
    let vivo = true;
    api.get("/mentira-ranks/meu").then(({ data }) => vivo && setMensal(data)).catch(() => vivo && setMensal({ points: 0 }));
    return () => { vivo = false; };
  }, []);
  if (!mensal) return null;
  return (
    <div className="v2-mentira-patentes">
      <EscadaPatentes jogo="mentira" mensal={mensal} semLink rodape={<>Cada partida com <b>pelo menos 2 pessoas</b> leva seus pontos ÷ 10 pro ranking do mês.{mensal.proxima ? ` Faltam ${mensal.proxima.pointsNeeded.toLocaleString("pt-BR")} pra ${mensal.proxima.name}.` : ""}</>} />
    </div>
  );
}

// Salas abertas da lobby (atualiza sozinha).
function SalasAbertas({ aoEntrar }) {
  const [salas, setSalas] = useState(null);
  useEffect(() => {
    let vivo = true;
    const buscar = () => api.get("/mentira-rooms").then(({ data }) => vivo && setSalas(data || [])).catch(() => vivo && setSalas((s) => s || []));
    buscar();
    const t = setInterval(() => { if (!document.hidden) buscar(); }, 10000);
    return () => { vivo = false; clearInterval(t); };
  }, []);
  return (
    <section className="v2-mentira-abertas" aria-label="Salas abertas">
      <div className="v2-bloco-titulo">Salas abertas <span className="v2-mentira-modo-tag">funciona com qualquer um</span></div>
      {salas === null && <div className="v2-carregando">Carregando…</div>}
      {(salas || []).map((s) => (
        <button key={s.codigo} className="v2-mentira-sala-aberta" onClick={() => aoEntrar(s.codigo)}>
          <span className="v2-mentira-sala-icone">{s.permiteBots ? "🤖" : "🎙️"}</span>
          <span className="v2-mentira-sala-texto">
            <b>{s.nome}</b>
            <small>{s.descricao}</small>
          </span>
          <span className="v2-mentira-sala-info">
            <b>{s.jogando}</b> {s.jogando === 1 ? "jogando" : "jogando"}
            {s.emPartida && <em>em partida</em>}
          </span>
          <span className="v2-mentira-sala-entrar">Entrar</span>
        </button>
      ))}
    </section>
  );
}

export default function Mentira({ usuario, salaDoLink }) {
  const [estado, setEstado] = useState(null);
  const [erro, setErro] = useState("");
  const [codigoDigitado, setCodigoDigitado] = useState("");
  const [streamer, setStreamer] = useState(() => localStorage.getItem("eg_mentira_streamer") === "1");
  const socketRef = useRef(null);
  useEffect(() => { ativarSons(); }, []);
  const codigoRef = useRef(salaDoLink || null); // sala atual (pra reentrar depois de uma queda)
  const [caiu, setCaiu] = useState(false);

  useEffect(() => {
    const s = novoSocket();
    socketRef.current = s;
    // O estado chega A CADA SEGUNDO (relógio): o aviso de erro só some quando
    // a fase ou a rodada mudam — senão "essa é a resposta certa!" piscava e
    // sumia antes de dar pra ler.
    let etapa = "";
    s.on("mentira-estado", (e) => {
      const agora = `${e.fase}-${e.rodada}`;
      if (agora !== etapa) { etapa = agora; setErro(""); }
      codigoRef.current = e.codigo;
      setEstado(e);
    });
    // A CADA conexão — inclusive a reconexão depois de uma queda — volta pra
    // sala atual (também pra quem criou a sala, que não veio por link).
    s.on("connect", () => {
      setCaiu(false);
      setErro("");
      if (codigoRef.current) s.emit("mentira-entrar", { codigo: codigoRef.current }, (r) => r?.erro && setErro(r.erro));
    });
    s.on("disconnect", () => setCaiu(true));
    // Conexão recusada (login que não vale neste servidor, servidor fora do
    // ar): sem isto, os botões não faziam nada e não aparecia aviso nenhum.
    // Mesmo aviso do Impostor.
    s.on("connect_error", (err) => {
      setErro(ehSessaoMorta(err)
        ? "Seu login não vale mais neste servidor. Saia da conta (botão no topo) e entre de novo."
        : "Não foi possível conectar ao servidor do jogo. Tentando de novo…");
    });
    s.connect();
    return () => { s.emit("mentira-sair"); s.disconnect(); };
  }, [salaDoLink]);

  // Som de início de rodada (cada pergunta nova e as confissões).
  const rodadaTocadaRef = useRef("");
  useEffect(() => {
    if (!estado) return;
    const chave = `${estado.fase}-${estado.rodada}`;
    if ((estado.fase === "escrever" || estado.fase === "confessar") && rodadaTocadaRef.current !== chave) {
      rodadaTocadaRef.current = chave;
      somRodada();
    }
  }, [estado?.fase, estado?.rodada]);

  const pedir = (evento, dados = {}) => new Promise((ok) => socketRef.current?.emit(evento, dados, (r) => { if (r?.erro) setErro(r.erro); ok(r); }));
  function alternarStreamer() { const n = !streamer; setStreamer(n); localStorage.setItem("eg_mentira_streamer", n ? "1" : "0"); }

  async function entrarEm(codigo) {
    const r = await pedir("mentira-entrar", { codigo });
    if (r?.codigo) { codigoRef.current = r.codigo; window.history.replaceState(null, "", `/v2/?pagina=mentira&mesa=${r.codigo}`); }
  }
  function sairDaSala() {
    socketRef.current?.emit("mentira-sair");
    codigoRef.current = null;
    setEstado(null);
    window.history.replaceState(null, "", "/v2/?pagina=mentira");
  }

  async function criar() {
    const r = await pedir("mentira-criar");
    if (r?.codigo) window.history.replaceState(null, "", `/v2/?pagina=mentira&mesa=${r.codigo}`);
  }

  // Sem sala ainda: a LOBBY do jogo — salas abertas, sala com amigos e código.
  if (!estado) {
    return (
      <Moldura usuario={usuario}>
        <section className="v2-cartao v2-mentira-entrada">
          <img className="v2-mentira-logo-img" src="/mentira-logo.png" alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <h1 className="v2-oculto">Mentira Sincera</h1>
          <span className="v2-versao-jogo v2-versao-jogo-lobby" title="Quantas entregas já mexeram neste jogo">{versaoTexto("mentira")}</span>
          <p className="v2-cartao-nota">Todo mundo inventa mentiras pra completar uma frase. Quem achar a verdade no meio das mentiras pontua; quem enganar os outros pontua mais ainda — e as mentiras mais criativas ganham curtidas que valem pontos.</p>
          <span className="v2-mentira-teste">em testes</span>
          {erro && <div className="v2-faixa-aviso erro" role="alert">{erro}</div>}
          {salaDoLink && !erro && <div className="v2-carregando">Entrando na sala…</div>}
        </section>
        <SalasAbertas aoEntrar={(codigo) => entrarEm(codigo)} />
        <section className="v2-cartao v2-mentira-amigos">
          <div>
            <span className="v2-mentira-modo-tag amigos">entre amigos</span>
            <h2>🫵 Sala com amigos</h2>
            <p className="v2-cartao-nota">Crie uma sala e mande o convite. Aqui fica o modo <b>Sobre Vocês</b>: cada um confessa verdades sobre si e os outros mentem sobre elas — perfeito pra streamer com a galera.</p>
          </div>
          <button className="v2-botao v2-botao-amarelo" onClick={criar}>Criar sala com amigos</button>
          <form className="v2-mentira-codigo" onSubmit={(e) => { e.preventDefault(); if (codigoDigitado.trim()) entrarEm(codigoDigitado.trim()); }}>
            <label htmlFor="v2-mentira-cod" className="v2-oculto">Código da sala</label>
            <input id="v2-mentira-cod" inputMode="numeric" maxLength={6} placeholder="Tem um código? Digite aqui" value={codigoDigitado} onChange={(e) => setCodigoDigitado(e.target.value.replace(/\D/g, ""))} />
            <button className="v2-botao v2-botao-contorno" type="submit">Entrar</button>
          </form>
        </section>
        <Top3Mentira />
        <MinhaPatente />
      </Moldura>
    );
  }

  const { fase } = estado;
  return (
    <Moldura usuario={usuario}>
      <section className="v2-mentira-topo">
        <div>
          <h1>🎭 Mentira Sincera</h1>
          {fase !== "aguardando" && fase !== "fim" && (
            <span className="v2-mentira-rodada">{estado.modo === "sobre" && <em className="v2-mentira-modo-selo">Sobre Vocês</em>}
              {fase === "confessar" ? "Confissões" : estado.modo === "sobre" ? `Sobre ${estado.assunto?.nickname || "…"} — rodada ${estado.rodada} de ${estado.totalRodadas}` : estado.final ? "FINAL" : `Pergunta ${estado.rodada} de ${estado.totalRodadas}`}
              {estado.multiplicador > 1 && <b className={`v2-mentira-mult x${estado.multiplicador}`}>×{estado.multiplicador}</b>}
            </span>
          )}
        </div>
        <div className="v2-mentira-topo-dir">
          <span className="v2-mentira-cod-selo">{estado.publica ? estado.nomeSala : streamer ? "código escondido" : `sala ${estado.codigo}`}</span>
          <ControleSom aoTestar={somRodada} />
          <button className={`v2-botao-pequeno ${streamer ? "ativo" : ""}`} onClick={alternarStreamer} title="Esconde o código e o link da tela (pra live)">{streamer ? "Modo streamer: ligado" : "Modo streamer"}</button>
          <button className="v2-botao-pequeno" onClick={sairDaSala}>Sair</button>
        </div>
      </section>

      {erro && <div className="v2-faixa-aviso erro" role="alert">{erro}</div>}
      {caiu && <div className="v2-faixa-aviso" role="status">📶 Conexão caiu — reconectando… (seus pontos estão guardados)</div>}

      <ReacoesFlutuando reacoes={estado.reacoes || []} />
      <div className="v2-mentira-corpo">
        <div className="v2-mentira-palco">
          {fase === "aguardando" && <Espera estado={estado} streamer={streamer} aoComecar={() => pedir("mentira-comecar")} aoBot={(acao) => pedir("mentira-bot", { acao })} aoModo={(modo) => pedir("mentira-modo", { modo })} />}
          {fase === "confessar" && <Confessar estado={estado} aoConfessar={(texto, indice) => pedir("mentira-confessar", { texto, indice })} />}
          {fase === "escrever" && <Escrever key={`${estado.rodada}-${estado.perguntas?.[0]?.texto}`} estado={estado} aoMentir={(texto) => pedir("mentira-mentir", { texto })} aoPular={() => pedir("mentira-pular")} />}
          {fase === "escolher" && <Escolher estado={estado} aoEscolher={(opcaoId, pergunta) => pedir("mentira-escolher", { opcaoId, pergunta })} aoCurtir={(opcaoId) => pedir("mentira-curtir", { opcaoId })} />}
          {fase === "revelar" && <Revelar key={`${estado.rodada}-${estado.perguntas?.[0]?.texto}`} estado={estado} meuId={usuario.id} aoCurtir={(opcaoId) => pedir("mentira-curtir", { opcaoId })} />}
          {fase === "fim" && <Fim estado={estado} meuId={usuario.id} aoJogarDeNovo={() => pedir("mentira-comecar")} aoModo={(modo) => pedir("mentira-modo", { modo })} />}
        </div>
        <div className="v2-mentira-lateral">
          {fase !== "revelar" && <Placar estado={estado} meuId={usuario.id} />}
          <ChatMentira estado={estado} usuario={usuario} pedir={pedir} />
        </div>
      </div>
    </Moldura>
  );
}

export function Moldura({ usuario, children, classe = "v2-mentira" }) {
  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo={null} />
      <main className={`v2-pagina ${classe}`}>{children}</main>
    </div>
  );
}

// Botão de som + deslizador de volume (Mentira e Tribunal). Arrastar o
// deslizador com o som desligado religa; volume zero é o mesmo que mudo.
export function ControleSom({ aoTestar = null }) {
  const [mudo, setMudo] = useState(estaMudo());
  const [vol, setVol] = useState(volumeAtual());
  const [aberto, setAberto] = useState(false);
  const [semAnimacao, setSemAnimacao] = useState(estaSemAnimacao());
  const efetivo = mudo ? 0 : vol;
  const icone = efetivo === 0 ? "🔇" : efetivo < 0.4 ? "🔈" : efetivo < 0.75 ? "🔉" : "🔊";
  function mudar(e) {
    const v = definirVolume(Number(e.target.value) / 100);
    setVol(v);
    if (mudo && v > 0) setMudo(alternarMudo());
  }
  return (
    <div className={`v2-controle-som ${aberto ? "aberto" : ""}`}>
      <button className={`v2-botao-pequeno ${efetivo > 0 ? "ativo" : ""}`} onClick={() => setAberto((a) => !a)} aria-expanded={aberto} title="Sons do jogo">{icone} Sons</button>
      {aberto && (
        <div className="v2-controle-som-caixa" role="group" aria-label="Volume dos sons">
          <button className="v2-controle-som-mudo" onClick={() => setMudo(alternarMudo())} aria-pressed={mudo}>{mudo ? "🔇 desligado" : "🔊 ligado"}</button>
          <input type="range" min="0" max="100" value={Math.round(vol * 100)} onChange={mudar} onPointerUp={() => aoTestar?.()} onKeyUp={(e) => { if (e.key.startsWith("Arrow")) aoTestar?.(); }} aria-label="Volume" />
          <b>{Math.round(vol * 100)}%</b>
          <button className="v2-controle-som-mudo" onClick={() => setSemAnimacao(alternarAnimacao())} aria-pressed={semAnimacao} aria-label={semAnimacao ? "Ligar animação de acerto" : "Desligar animação de acerto"} title={semAnimacao ? "Ligar animação de acerto" : "Desligar animação de acerto"}>{semAnimacao ? "🚫 confete" : "🎉 confete"}</button>
        </div>
      )}
    </div>
  );
}

export function Relogio({ tempo, total }) {
  const pct = Math.max(0, Math.min(100, (tempo / total) * 100));
  return (
    <div className={`v2-mentira-relogio ${tempo <= 5 ? "urgente" : ""}`} aria-label={`${tempo} segundos`}>
      <div className="v2-mentira-relogio-barra"><div style={{ width: `${pct}%` }} /></div>
      <b>{tempo}s</b>
    </div>
  );
}

// A curiosidade com a lacuna destacada (ou preenchida com a verdade).
function Curiosidade({ texto, preenchida, numero, ficcao }) {
  const [antes, depois] = String(texto || "").split("___");
  return (
    <p className="v2-mentira-curiosidade">
      {numero && <span className="v2-mentira-num">{numero}</span>}
      {antes}
      <span className={`v2-mentira-lacuna ${preenchida ? "cheia" : ""}`}>{preenchida || "_____"}</span>
      {depois}
    </p>
  );
}

function QuemJa({ estado, verbo }) {
  const faltam = estado.jogadores.filter((j) => j.online && !j.pronto);
  return (
    <div className="v2-mentira-quem">
      {estado.jogadores.filter((j) => j.online).map((j) => (
        <span key={j.id} className={j.pronto ? "pronto" : ""}>{j.pronto ? "✓ " : ""}{j.nickname}</span>
      ))}
      <small>{faltam.length ? `esperando ${faltam.length} ${faltam.length === 1 ? "pessoa" : "pessoas"} ${verbo}` : "todo mundo pronto!"}</small>
    </div>
  );
}

// Modo de jogo (só o dono escolhe). O conteúdo é sempre sorteado.
function EscolhaModo({ estado, aoModo }) {
  if (!estado.souDono) return <p className="v2-cartao-nota">Modo: <b>{estado.modo === "sobre" ? "Sobre Vocês (entre amigos)" : "Curiosidades"}</b></p>;
  return (
    <div className="v2-mentira-modos" role="radiogroup" aria-label="Modo de jogo">
      <button role="radio" aria-checked={estado.modo !== "sobre"} className={estado.modo !== "sobre" ? "ativo" : ""} onClick={() => aoModo("curiosidades")}>
        <span>🧠</span><b>Curiosidades</b><em className="v2-mentira-modo-tag">funciona com qualquer um</em><small>Fatos reais e absurdos do mundo. Com final de mentira dupla.</small>
      </button>
      <button role="radio" aria-checked={estado.modo === "sobre"} className={estado.modo === "sobre" ? "ativo" : ""} onClick={() => aoModo("sobre")}>
        <span>🫵</span><b>Sobre Vocês</b><em className="v2-mentira-modo-tag amigos">entre amigos</em><small>Pra quem se conhece — streamer com a galera, amigos por convite. Cada um confessa verdades e os outros mentem sobre elas. Mín. 3.</small>
      </button>
    </div>
  );
}

function Espera({ estado, streamer, aoComecar, aoBot, aoModo }) {
  const [copiado, setCopiado] = useState(false);
  const online = estado.jogadores.filter((j) => j.online);
  async function copiar() {
    try { await navigator.clipboard.writeText(`Bora jogar Mentira Sincera! 🎭 ${linkDaSala(estado.codigo)}`); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch {}
  }
  return (
    <section className="v2-cartao v2-mentira-espera">
      <h2>Sala de espera</h2>
      {estado.publica ? (
        <p className="v2-cartao-nota">Sala aberta: qualquer pessoa entra pela lista de salas do jogo. Quer chamar alguém? Copie o link.</p>
      ) : streamer ? (
        <p className="v2-cartao-nota">Modo streamer ligado: o código e o link estão escondidos da tela. Mande o link pros jogadores por fora (chat privado).</p>
      ) : (
        <div className="v2-mentira-convite">
          <span>Código da sala</span>
          <b>{estado.codigo}</b>
          <small>{linkDaSala(estado.codigo)}</small>
        </div>
      )}
      <button className="v2-botao v2-botao-contorno" onClick={copiar}>{copiado ? "Link copiado!" : "Copiar link de convite"}</button>
      {estado.publica ? (
        <p className="v2-cartao-nota">Modo: <b>Curiosidades</b>{estado.permiteBots ? " · dá pra chamar bots pra completar" : " · só gente de verdade"}</p>
      ) : <EscolhaModo estado={estado} aoModo={aoModo} />}
      <div className="v2-mentira-quem">{online.map((j) => <span key={j.id} className="pronto">{j.nickname}{j.id === estado.donoId ? " 👑" : ""}{j.bot ? " 🤖" : ""}</span>)}</div>
      {estado.souDono && estado.permiteBots && (
        <div className="v2-mentira-bots">
          <button className="v2-botao v2-botao-contorno" onClick={() => aoBot("adicionar")} disabled={estado.jogadores.length >= 8}>+ bot de teste</button>
          {online.some((j) => j.bot) && <button className="v2-link" onClick={() => aoBot("remover")}>remover bots</button>}
          <small>Bots escrevem mentiras e votam sozinhos — pra testar sem precisar de gente.</small>
        </div>
      )}
      {estado.souDono ? (
        <button className="v2-botao v2-botao-amarelo v2-botao-largo" onClick={aoComecar} disabled={online.length < (estado.modo === "sobre" ? 3 : 2)}>
          {online.length < (estado.modo === "sobre" ? 3 : 2) ? `Esperando mais gente (mín. ${estado.modo === "sobre" ? 3 : 2})` : `Começar com ${online.length} jogadores`}
        </button>
      ) : (
        <p className="v2-cartao-nota">Quem criou a sala começa a partida.</p>
      )}
    </section>
  );
}

// Frase do apresentador no começo de cada pergunta (a mesma pra todos).
function aberturaDaRodada(estado) {
  if (estado.modo === "sobre") {
    const quem = estado.assunto?.nickname || "alguém";
    if (estado.rodada === estado.totalRodadas) return `🎤 Última rodada, valendo o DOBRO: agora é sobre ${quem}!`;
    return escolherFrase([`🎤 Agora é sobre ${quem}! Quem conhece de verdade?`, `🎤 Vamos descobrir os segredos de ${quem}.`, `🎤 ${quem}, prepare-se: vão mentir sobre você.`], `${estado.codigo}-${estado.rodada}`);
  }
  if (estado.final) return "🎤 FINAL! Uma mentira só, pra DUAS perguntas. Pontos TRIPLICADOS — e quem enganar nas duas leva +1000!";
  if (estado.rodada === 4) return "🎤 Segunda fase: a partir de agora os pontos DOBRAM. Quem está atrás ainda vira!";
  if (estado.rodada === 1) return "🎤 Bem-vindos ao Mentira Sincera! Mintam com convicção.";
  return escolherFrase(["🎤 Mais uma. Capricha nessa mentira.", "🎤 Essa é absurda. Invente algo mais absurdo ainda.", "🎤 Quero ver quem cai nessa.", "🎤 Valendo! Agora mintam."], `${estado.codigo}-${estado.rodada}`);
}

// "Sobre Vocês": cada um escreve a VERDADE sobre si (1 ou 2 frases).
function Confessar({ estado, aoConfessar }) {
  const frases = estado.minhasFrases || [];
  return (
    <section className="v2-cartao v2-mentira-fase">
      <Relogio tempo={estado.tempo} total={estado.tempoTotal} />
      <p className="v2-mentira-apresentador">🎤 Hora da confissão! Complete com a VERDADE sobre você — depois a galera vai inventar mentiras sobre isso.</p>
      {frases.length ? frases.map((frase, i) => (
        <UmaConfissao key={i} frase={frase} numero={frases.length > 1 ? i + 1 : null} feita={estado.minhasConfissoes[i]} focar={i === 0} aoConfessar={(texto) => aoConfessar(texto, i)} />
      )) : <p className="v2-cartao-nota">Você entrou depois das confissões — joga a partida, mas não vira assunto desta vez.</p>}
      {frases.length > 0 && <p className="v2-mentira-dica">Dica: respostas curtas e verdadeiras rendem mais — quanto mais inacreditável, melhor.</p>}
      <QuemJa estado={estado} verbo="confessar" />
    </section>
  );
}

function UmaConfissao({ frase, numero, feita, focar, aoConfessar }) {
  const [texto, setTexto] = useState("");
  const campoRef = useRef(null);
  useEffect(() => { if (focar) campoRef.current?.focus(); }, []);
  const [antes, depois] = String(frase).split("___");
  const id = `v2-mentira-conf-${numero || 1}`;
  return (
    <div className="v2-mentira-confissao">
      <p className="v2-mentira-curiosidade">{numero && <span className="v2-mentira-num">{numero}</span>}{antes}<span className="v2-mentira-lacuna">_____</span>{depois}</p>
      {feita ? (
        <div className="v2-mentira-enviada">Sua verdade: <b>{feita}</b> 🤫</div>
      ) : (
        <form className="v2-mentira-form" onSubmit={(e) => { e.preventDefault(); if (texto.trim()) aoConfessar(texto); }}>
          <label htmlFor={id} className="v2-oculto">Sua verdade</label>
          <input id={id} ref={campoRef} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={60} placeholder="A verdade…" autoComplete="off" />
          <button className="v2-botao v2-botao-amarelo" type="submit" disabled={!texto.trim()}>Confessar</button>
        </form>
      )}
    </div>
  );
}

function Escrever({ estado, aoMentir, aoPular }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const campoRef = useRef(null);
  useEffect(() => { campoRef.current?.focus(); }, []);
  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    const r = await aoMentir(texto);
    setEnviando(false);
    if (r?.erro) campoRef.current?.focus();
  }
  return (
    <section className="v2-cartao v2-mentira-fase">
      <Relogio tempo={estado.tempo} total={estado.tempoTotal} />
      <p className="v2-mentira-apresentador">{aberturaDaRodada(estado)}</p>
      <span className="v2-mentira-instrucao">{estado.final ? "Uma mentira que sirva pras DUAS:" : "Invente uma mentira que pareça verdade:"}</span>
      {estado.perguntas.map((p, i) => <Curiosidade key={i} texto={p.texto} ficcao={p.ficcao} numero={estado.final ? i + 1 : null} />)}
      {estado.souAssunto ? (
        <div className="v2-mentira-assunto">🫵 Essa é sobre VOCÊ! Os outros estão inventando mentiras — só assista.</div>
      ) : estado.minhaMentira ? (
        <div className="v2-mentira-enviada">Sua mentira: <b>{estado.minhaMentira}</b></div>
      ) : (
        <form className="v2-mentira-form" onSubmit={enviar}>
          <label htmlFor="v2-mentira-texto" className="v2-oculto">Sua mentira</label>
          <input id="v2-mentira-texto" ref={campoRef} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={60} placeholder="Sua mentira…" autoComplete="off" />
          <button className="v2-botao v2-botao-amarelo" type="submit" disabled={enviando || !texto.trim()}>Enviar</button>
        </form>
      )}
      <QuemJa estado={estado} verbo="escrever" />
      {estado.souDono && <button className="v2-link v2-mentira-pular" onClick={aoPular}>pular {estado.final ? "estas curiosidades" : "esta curiosidade"}</button>}
    </section>
  );
}

function Escolher({ estado, aoEscolher, aoCurtir }) {
  const escolheuTudo = estado.souAssunto || estado.meusVotos.every(Boolean);
  return (
    <section className="v2-cartao v2-mentira-fase">
      <Relogio tempo={estado.tempo} total={estado.tempoTotal} />
      {estado.perguntas.map((p, i) => (
        <div key={i} className="v2-mentira-bloco-escolha">
          <span className="v2-mentira-instrucao">{estado.souAssunto ? "Os outros estão tentando achar a SUA verdade:" : estado.final ? `Pergunta ${i + 1}: qual é a VERDADE?` : "Qual dessas é a VERDADE?"}</span>
          <Curiosidade texto={p.texto} ficcao={p.ficcao} />
          <div className="v2-mentira-opcoes">
            {(estado.opcoes?.[i] || []).map((o) => {
              const escolhida = estado.meusVotos[i] === o.id;
              const curtida = estado.minhasCurtidas.includes(o.id);
              return (
                <div key={o.id} className="v2-mentira-opcao-linha">
                  <button className={`v2-mentira-opcao ${escolhida ? "escolhida" : ""} ${o.minha ? "minha" : ""}`} disabled={estado.souAssunto || o.minha || !!estado.meusVotos[i]} onClick={() => aoEscolher(o.id, i)}>
                    {o.texto}{o.minha && <small>sua mentira</small>}
                  </button>
                  {escolheuTudo && !o.minha && (
                    <button className={`v2-mentira-curtir ${curtida ? "ativo" : ""}`} aria-pressed={curtida} aria-label={`Curtir: ${o.texto}`} title="Curtir essa mentira (troféu Mais Engraçado)" onClick={() => aoCurtir(o.id)}>👍</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {estado.todosVotaram ? (
        <p className="v2-mentira-janela">✅ Todo mundo votou! Aproveita pra curtir 👍 as mais criativas — revelação em <b>{estado.tempo}s</b>{estado.curtidasRestantes > 0 ? ` · você ainda tem ${estado.curtidasRestantes} 👍` : ""}</p>
      ) : escolheuTudo && <p className="v2-mentira-dica">👍 Curta as mentiras mais criativas: cada curtida vale <b>+{estado.pontosPorCurtida}</b> pra quem escreveu. Você tem <b>{estado.curtidasRestantes} de 2</b> nesta rodada.</p>}
      <QuemJa estado={estado} verbo="escolher" />
    </section>
  );
}

// Frase do apresentador pra cada carta — a mesma pra todos (sorteio fixo pelo id).
function escolherFrase(lista, semente) {
  let h = 0;
  for (const c of String(semente)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return lista[h % lista.length];
}
function comentario(item, total, ficcao = false) {
  const n = item.escolheram.length;
  if (item.verdade) {
    if (n === 0) return escolherFrase(["🎤 NINGUÉM acertou. Vocês não sabem de nada.", "🎤 Zero acertos. Essa era difícil mesmo."], item.id);
    if (n >= total - 1) return escolherFrase(["🎤 Fácil demais, né? Todo mundo sabia.", "🎤 Essa todo mundo matou."], item.id);
    return escolherFrase(["🎤 Essa era a resposta certa!", "🎤 Pois é: era essa mesmo."], item.id);
  }
  if (item.casa) return escolherFrase(["🎤 Caíram na mentira DA CASA. Isso custa pontos, hein!", "🎤 Essa fui eu que inventei. Obrigado pelos pontos."], item.id);
  const autor = item.autores.join(" e ");
  if (n >= 3) return escolherFrase([`🎤 ${autor} enganou ${n} pessoas. Isso é um profissional.`, `🎤 ${n} vítimas de ${autor}. Assustador.`], item.id);
  if (n === 2) return escolherFrase([`🎤 ${autor} pegou dois de uma vez!`, `🎤 Dois caíram na do ${autor}. Nada mal.`], item.id);
  return escolherFrase([`🎤 ${autor} fez uma vítima.`, `🎤 Um caiu na do ${autor}. Já é alguma coisa.`], item.id);
}

// Pontos que uma carta dá (pra mostrar na hora da carta).
function pontosDaCarta(item, mult) {
  const n = item.escolheram.length;
  if (item.verdade) return n ? `+${(500 * mult).toLocaleString("pt-BR")} pra quem acertou` : null;
  if (item.casa) return n ? `−${(250 * mult).toLocaleString("pt-BR")} pra quem caiu` : null;
  return n ? `+${Math.round((250 * mult * n) / Math.max(1, item.autores.length)).toLocaleString("pt-BR")} pra ${item.autores.join(" e ")}` : null;
}

// Revelação: cada carta (mentiras em que alguém caiu, depois a verdade) fica
// segPorCarta segundos — os nomes de quem caiu aparecem um a um; depois vem o
// RESUMO DA RODADA (todas as frases + quem votou em cada + placar subindo).
function Revelar({ estado, meuId, aoCurtir }) {
  const itens = estado.revelacao?.itens || [];
  const porCarta = (estado.segPorCarta || 5.5) * 1000;
  const [passo, setPasso] = useState(0);
  useEffect(() => {
    if (passo > itens.length - 1) return;
    const t = setTimeout(() => setPasso((p) => p + 1), porCarta);
    return () => clearTimeout(t);
  }, [passo, itens.length]);
  const noResumo = passo > itens.length - 1;
  const item = itens[Math.min(passo, itens.length - 1)];
  const pergunta = item ? estado.perguntas[item.pergunta] || estado.perguntas[0] : null;
  const totalJogadores = estado.jogadores.filter((j) => j.online).length;

  if (noResumo) return <ResumoRodada estado={estado} meuId={meuId} />;
  if (!item) return null;
  const pontos = pontosDaCarta(item, estado.multiplicador || 1);
  return (
    <section className="v2-cartao v2-mentira-fase v2-mentira-revela">
      <div className="v2-mentira-progresso" aria-hidden="true">
        {itens.map((_, i) => <span key={i} className={i < passo ? "feito" : i === passo ? "atual" : ""} />)}
        <em>resumo</em>
      </div>
      {estado.final && <span className="v2-mentira-instrucao">Pergunta {item.pergunta + 1} de 2</span>}
      <Curiosidade texto={pergunta.texto} ficcao={pergunta.ficcao} preenchida={item.verdade ? pergunta.verdade : null} />
      <div key={item.id} className={`v2-mentira-carta ${item.verdade ? "verdade" : "mentira"}`}>
        <b className="v2-mentira-carta-texto">{item.texto}</b>
        {item.escolheram.length > 0 && (
          <div className="v2-mentira-caiu-lista">
            <small>{item.verdade ? "Acertaram:" : "Caíram:"}</small>
            {item.escolheram.map((n, i) => <span key={n} className="v2-mentira-caiu-chip" style={{ animationDelay: `${0.5 + i * 0.45}s` }}>{n}</span>)}
          </div>
        )}
        <span className="v2-mentira-carimbo" style={{ animationDelay: `${0.8 + item.escolheram.length * 0.45}s` }}>
          {item.verdade ? (estado.modo === "sobre" ? `VERDADE! Confissão de ${estado.assunto?.nickname || "alguém"}` : "RESPOSTA CERTA!") : item.casa ? "MENTIRA DA CASA" : `MENTIRA de ${item.autores.join(" e ")}`}
        </span>
        {pontos && <span className={`v2-mentira-pontos-carta ${item.casa ? "negativo" : ""}`} style={{ animationDelay: `${1.3 + item.escolheram.length * 0.45}s` }}>{pontos}</span>}
        {item.curtivel && !estado.curtidasFechadas ? (
          <button className={`v2-mentira-curtir-carta ${estado.minhasCurtidas.includes(item.id) ? "ativo" : ""}`} onClick={() => aoCurtir(item.id)} aria-pressed={estado.minhasCurtidas.includes(item.id)} title={`Curtir: +${estado.pontosPorCurtida} pra quem escreveu (você tem ${estado.curtidasRestantes})`}>
            👍 {item.curtidas > 0 ? item.curtidas : `curtir (+${estado.pontosPorCurtida})`}
          </button>
        ) : item.curtidas > 0 && <span className="v2-mentira-curtidas">👍 {item.curtidas}</span>}
      </div>
      <p className="v2-mentira-apresentador">{comentario(item, totalJogadores, pergunta.ficcao)}</p>
    </section>
  );
}

// Número que conta do valor antigo até o novo.
function Contador({ de, ate, ms = 1600 }) {
  const [v, setV] = useState(de);
  useEffect(() => {
    let raf, inicio;
    const passo = (t) => {
      if (!inicio) inicio = t;
      const f = Math.min(1, (t - inicio) / ms);
      setV(Math.round(de + (ate - de) * (1 - Math.pow(1 - f, 3))));
      if (f < 1) raf = requestAnimationFrame(passo);
    };
    const espera = setTimeout(() => { raf = requestAnimationFrame(passo); }, 700);
    return () => { clearTimeout(espera); cancelAnimationFrame(raf); };
  }, [de, ate]);
  return v.toLocaleString("pt-BR");
}

// RESUMO DA RODADA (estilo Fibbage): todas as frases, de quem é cada uma e
// quem caiu em cada; depois o placar com as barras e os pontos subindo.
function ResumoRodada({ estado, meuId }) {
  const melhor = Math.max(0, ...estado.jogadores.map((j) => j.ganhou));
  const vencedores = melhor > 0 ? estado.jogadores.filter((j) => j.ganhou === melhor) : [];
  const euVenci = vencedores.some((j) => j.id === meuId);
  useEffect(() => { if (euVenci) { const t = setTimeout(somVitoriaRodada, 500); return () => clearTimeout(t); } }, []);
  const todas = [...(estado.revelacao?.todas || [])].sort((a, b) =>
    (a.verdade ? 1 : 0) - (b.verdade ? 1 : 0) || b.escolheram.length - a.escolheram.length);
  const [cresceu, setCresceu] = useState(false);
  useEffect(() => { const t = setTimeout(() => setCresceu(true), 700); return () => clearTimeout(t); }, []);
  const jogadores = estado.jogadores;
  const maior = Math.max(1, ...jogadores.map((j) => j.pontos));
  const porPergunta = estado.final ? [0, 1] : [0];
  return (
    <section className="v2-cartao v2-mentira-fase v2-mentira-resumo">
      {euVenci && <Confete quantidade={45} duracao={3000} />}
      <h2>Resumo da rodada</h2>
      {vencedores.length > 0 && (
        <p className={`v2-mentira-venceu-rodada ${euVenci ? "eu" : ""}`}>
          🏆 {euVenci ? (vencedores.length > 1 ? "Você e mais gente venceram a rodada!" : "Você venceu a rodada!") : `${vencedores.map((j) => j.nickname).join(" e ")} ${vencedores.length > 1 ? "venceram" : "venceu"} a rodada!`} <b>+{melhor.toLocaleString("pt-BR")}</b>
        </p>
      )}
      {porPergunta.map((p) => (
        <div key={p} className="v2-mentira-resumo-bloco">
          {estado.final && <span className="v2-mentira-instrucao">Pergunta {p + 1}</span>}
          <ul className="v2-mentira-resumo-lista">
            {todas.filter((i) => (i.pergunta || 0) === p).map((i, k) => (
              <li key={i.id} className={i.verdade ? "verdade" : i.casa ? "casa" : ""} style={{ animationDelay: `${k * 0.12}s` }}>
                <div className="v2-mentira-resumo-frase">
                  <b>{i.texto}</b>
                  <em>{i.verdade ? (estado.modo === "sobre" ? "✅ VERDADE" : "✅ RESPOSTA CERTA") : i.casa ? "🏠 da casa" : `de ${i.autores.join(" e ")}`}{i.curtidas > 0 ? ` · 👍 ${i.curtidas} (+${Math.round((i.curtidas * (estado.pontosPorCurtida || 100)) / Math.max(1, i.autores.length)).toLocaleString("pt-BR")})` : ""}</em>
                </div>
                <div className="v2-mentira-resumo-votos">
                  {i.escolheram.length ? i.escolheram.map((n) => <span key={n} className={i.verdade ? "acertou" : "caiu"}>{n}</span>) : <small>ninguém</small>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {estado.revelacao?.dupla?.length > 0 && <p className="v2-mentira-dupla">🎯 MENTIRA DUPLA! {estado.revelacao.dupla.join(" e ")}: +1000!</p>}
      <div className="v2-mentira-placar-animado">
        {jogadores.map((j) => {
          const antes = Math.max(0, j.pontos - j.ganhou);
          return (
            <div key={j.id} className={`v2-mentira-barra-linha ${j.id === meuId ? "eu" : ""}`}>
              <span className="v2-mentira-barra-nome">{j.nickname}</span>
              <div className="v2-mentira-barra">
                <div style={{ width: `${((cresceu ? j.pontos : antes) / maior) * 100}%` }} />
              </div>
              <b><Contador de={antes} ate={j.pontos} /></b>
              {j.ganhou !== 0 && <em className={j.ganhou < 0 ? "negativo" : ""}>{j.ganhou > 0 ? "+" : ""}{j.ganhou.toLocaleString("pt-BR")}</em>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Fim({ estado, meuId, aoJogarDeNovo, aoModo }) {
  const topo = estado.jogadores[0]?.pontos || 0;
  const campeoes = topo > 0 ? estado.jogadores.filter((j) => j.pontos === topo) : [];
  const euCampeao = campeoes.some((j) => j.id === meuId);
  useEffect(() => { if (euCampeao) { const t = setTimeout(somCampeao, 300); return () => clearTimeout(t); } }, []);
  const [primeiro, segundo, terceiro] = estado.jogadores;
  return (
    <section className={`v2-cartao v2-mentira-fase v2-mentira-fim ${euCampeao ? "campeao" : ""}`}>
      {campeoes.length > 0 && <Confete quantidade={euCampeao ? 140 : 80} duracao={euCampeao ? 6000 : 4200} />}
      {euCampeao && <div className="v2-mentira-voce-venceu">🎉 VOCÊ VENCEU! 🎉</div>}
      <div className="v2-mentira-trofeu">🏆</div>
      <h2>{primeiro ? `${primeiro.nickname} é o maior mentiroso!` : "Fim de jogo"}</h2>
      <GanhoNoRanking estado={estado} />
      <div className="v2-mentira-podio">
        {[segundo, primeiro, terceiro].filter(Boolean).map((j) => (
          <div key={j.id} className={j === primeiro ? "p1" : j === segundo ? "p2" : "p3"}>
            <Avatar userId={j.id} nickname={j.nickname} tamanho={j === primeiro ? 64 : 48} />
            <b>{j.nickname}</b>
            <span>{j.pontos.toLocaleString("pt-BR")}</span>
          </div>
        ))}
      </div>
      {estado.trofeus && (
        <div className="v2-mentira-trofeus">
          {[["🤥", "Maior Mentiroso", estado.trofeus.mentiroso, "enganados"], ["😂", "Mais Engraçado", estado.trofeus.engracado, "curtidas"], ["🔎", estado.modo === "sobre" ? "Quem mais conhece a galera" : "Detetive", estado.trofeus.detetive, "verdades achadas"]]
            .filter(([, , t]) => t)
            .map(([icone, nome, t, unidade]) => (
              <div key={nome} className="v2-mentira-trofeu-item">
                <span>{icone}</span>
                <b>{nome}</b>
                <em>{t.nomes.join(" e ")}</em>
                <small>{t.valor} {unidade}</small>
              </div>
            ))}
        </div>
      )}
      {estado.souDono && !estado.publica && <EscolhaModo estado={estado} aoModo={aoModo} />}
      {estado.souDono ? <button className="v2-botao v2-botao-amarelo v2-botao-largo" onClick={aoJogarDeNovo}>Jogar de novo</button> : <p className="v2-cartao-nota">O dono da sala pode começar outra partida.</p>}
    </section>
  );
}

function Placar({ estado, meuId }) {
  return (
    <aside className="v2-cartao v2-mentira-placar" aria-label="Placar">
      <div className="v2-bloco-titulo">Placar</div>
      {estado.jogadores.map((j, i) => (
        <div key={j.id} className={`v2-mentira-jogador ${j.id === meuId ? "eu" : ""} ${j.online ? "" : "fora"}`}>
          <span className="v2-mentira-pos">{i + 1}</span>
          <Avatar userId={j.id} nickname={j.nickname} tamanho={30} />
          <span className="v2-mentira-nick">
            {j.patente?.icon && <img className={`v2-mentira-patente ${j.patente.brilha ? "brilha" : ""}`} src={j.patente.icon} alt="" title={j.patente.name} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
            {j.nickname}{j.id === estado.donoId ? " 👑" : ""}{j.bot && <em className="v2-tag-bot">bot</em>}
          </span>
          {j.ganhou > 0 && <em className="v2-mentira-ganho">+{j.ganhou}</em>}
          <b>{j.pontos.toLocaleString("pt-BR")}</b>
        </div>
      ))}
    </aside>
  );
}
