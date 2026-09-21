import { useEffect, useRef, useState } from "react";
import { novoSocket } from "./api.js";
import { irParaPagina } from "./App.jsx";
import Topo from "./Topo.jsx";
import Avatar from "./Avatar.jsx";

// MENTIRA SINCERA (em teste, escondido): só admin cria sala; quem tiver o
// link/código entra. O servidor manda o estado inteiro a cada mudança
// ("mentira-estado"), já personalizado — a verdade só vem na revelação.

const linkDaSala = (codigo) => `${window.location.origin}/v2/?pagina=mentira&mesa=${codigo}`;
const REVELA_MS = 3500; // tempo de cada mentira na revelação

export default function Mentira({ usuario, salaDoLink }) {
  const [estado, setEstado] = useState(null);
  const [erro, setErro] = useState("");
  const [codigoDigitado, setCodigoDigitado] = useState("");
  const [streamer, setStreamer] = useState(() => localStorage.getItem("eg_mentira_streamer") === "1");
  const socketRef = useRef(null);
  const ehAdmin = usuario.role === "ADMIN";

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
      setEstado(e);
    });
    s.on("connect", () => { if (salaDoLink) s.emit("mentira-entrar", { codigo: salaDoLink }, (r) => r?.erro && setErro(r.erro)); });
    s.connect();
    return () => { s.emit("mentira-sair"); s.disconnect(); };
  }, [salaDoLink]);

  const pedir = (evento, dados = {}) => new Promise((ok) => socketRef.current?.emit(evento, dados, (r) => { if (r?.erro) setErro(r.erro); ok(r); }));
  function alternarStreamer() { const n = !streamer; setStreamer(n); localStorage.setItem("eg_mentira_streamer", n ? "1" : "0"); }

  async function criar() {
    const r = await pedir("mentira-criar");
    if (r?.codigo) window.history.replaceState(null, "", `/v2/?pagina=mentira&mesa=${r.codigo}`);
  }

  // Sem sala ainda: criar (admin) ou entrar com código.
  if (!estado) {
    return (
      <Moldura usuario={usuario}>
        <section className="v2-cartao v2-mentira-entrada">
          <div className="v2-mentira-logo">🎭</div>
          <h1>Mentira Sincera</h1>
          <p className="v2-cartao-nota">Uma curiosidade real, uma lacuna. Todo mundo inventa uma mentira; quem achar a verdade no meio das mentiras pontua — e quem enganar os outros pontua mais ainda.</p>
          <span className="v2-mentira-teste">em teste — só quem tem o link entra</span>
          {erro && <div className="v2-faixa-aviso erro" role="alert">{erro}</div>}
          {salaDoLink && !erro && <div className="v2-carregando">Entrando na sala {streamer ? "" : salaDoLink}…</div>}
          {ehAdmin && <button className="v2-botao v2-botao-amarelo v2-botao-largo" onClick={criar}>Criar sala</button>}
          <form className="v2-mentira-codigo" onSubmit={(e) => { e.preventDefault(); if (codigoDigitado.trim()) pedir("mentira-entrar", { codigo: codigoDigitado.trim() }); }}>
            <label htmlFor="v2-mentira-cod" className="v2-oculto">Código da sala</label>
            <input id="v2-mentira-cod" inputMode="numeric" maxLength={6} placeholder="Código da sala" value={codigoDigitado} onChange={(e) => setCodigoDigitado(e.target.value.replace(/\D/g, ""))} />
            <button className="v2-botao v2-botao-contorno" type="submit">Entrar</button>
          </form>
        </section>
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
            <span className="v2-mentira-rodada">Rodada {estado.rodada} de {estado.totalRodadas}{estado.dobro && <b> · VALE O DOBRO!</b>}</span>
          )}
        </div>
        <div className="v2-mentira-topo-dir">
          <span className="v2-mentira-cod-selo">{streamer ? "código escondido" : `sala ${estado.codigo}`}</span>
          <button className={`v2-botao-pequeno ${streamer ? "ativo" : ""}`} onClick={alternarStreamer} title="Esconde o código e o link da tela (pra live)">{streamer ? "Modo streamer: ligado" : "Modo streamer"}</button>
          <button className="v2-botao-pequeno" onClick={() => { socketRef.current?.emit("mentira-sair"); irParaPagina(null); }}>Sair</button>
        </div>
      </section>

      {erro && <div className="v2-faixa-aviso erro" role="alert">{erro}</div>}

      <div className="v2-mentira-corpo">
        <div className="v2-mentira-palco">
          {fase === "aguardando" && <Espera estado={estado} streamer={streamer} aoComecar={() => pedir("mentira-comecar")} aoBot={(acao) => pedir("mentira-bot", { acao })} />}
          {fase === "escrever" && <Escrever key={`${estado.rodada}-${estado.curiosidade?.texto}`} estado={estado} aoMentir={(texto) => pedir("mentira-mentir", { texto })} aoPular={() => pedir("mentira-pular")} />}
          {fase === "escolher" && <Escolher estado={estado} aoEscolher={(opcaoId) => pedir("mentira-escolher", { opcaoId })} />}
          {fase === "revelar" && <Revelar key={estado.rodada} estado={estado} />}
          {fase === "fim" && <Fim estado={estado} aoJogarDeNovo={() => pedir("mentira-comecar")} />}
        </div>
        <Placar estado={estado} meuId={usuario.id} />
      </div>
    </Moldura>
  );
}

function Moldura({ usuario, children }) {
  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo={null} />
      <main className="v2-pagina v2-mentira">{children}</main>
    </div>
  );
}

function Relogio({ tempo, total }) {
  const pct = Math.max(0, Math.min(100, (tempo / total) * 100));
  return (
    <div className={`v2-mentira-relogio ${tempo <= 5 ? "urgente" : ""}`} aria-label={`${tempo} segundos`}>
      <div className="v2-mentira-relogio-barra"><div style={{ width: `${pct}%` }} /></div>
      <b>{tempo}s</b>
    </div>
  );
}

// A curiosidade com a lacuna destacada (ou preenchida com a verdade).
function Curiosidade({ texto, preenchida }) {
  const [antes, depois] = String(texto || "").split("___");
  return (
    <p className="v2-mentira-curiosidade">
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

function Espera({ estado, streamer, aoComecar, aoBot }) {
  const [copiado, setCopiado] = useState(false);
  const online = estado.jogadores.filter((j) => j.online);
  async function copiar() {
    try { await navigator.clipboard.writeText(`Bora jogar Mentira Sincera! 🎭 ${linkDaSala(estado.codigo)}`); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch {}
  }
  return (
    <section className="v2-cartao v2-mentira-espera">
      <h2>Sala de espera</h2>
      {streamer ? (
        <p className="v2-cartao-nota">Modo streamer ligado: o código e o link estão escondidos da tela. Mande o link pros jogadores por fora (chat privado).</p>
      ) : (
        <div className="v2-mentira-convite">
          <span>Código da sala</span>
          <b>{estado.codigo}</b>
          <small>{linkDaSala(estado.codigo)}</small>
        </div>
      )}
      <button className="v2-botao v2-botao-contorno" onClick={copiar}>{copiado ? "Link copiado!" : "Copiar link de convite"}</button>
      <div className="v2-mentira-quem">{online.map((j) => <span key={j.id} className="pronto">{j.nickname}{j.id === estado.donoId ? " 👑" : ""}{j.bot ? " 🤖" : ""}</span>)}</div>
      {estado.souDono && (
        <div className="v2-mentira-bots">
          <button className="v2-botao v2-botao-contorno" onClick={() => aoBot("adicionar")} disabled={estado.jogadores.length >= 8}>+ bot de teste</button>
          {online.some((j) => j.bot) && <button className="v2-link" onClick={() => aoBot("remover")}>remover bots</button>}
          <small>Bots escrevem mentiras e votam sozinhos — pra testar sem precisar de gente.</small>
        </div>
      )}
      {estado.souDono ? (
        <button className="v2-botao v2-botao-amarelo v2-botao-largo" onClick={aoComecar} disabled={online.length < 2}>{online.length < 2 ? "Esperando mais gente (mín. 2)" : `Começar com ${online.length} jogadores`}</button>
      ) : (
        <p className="v2-cartao-nota">Quem criou a sala começa a partida.</p>
      )}
    </section>
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
      <Relogio tempo={estado.tempo} total={45} />
      <span className="v2-mentira-instrucao">Invente uma mentira que pareça verdade:</span>
      <Curiosidade texto={estado.curiosidade?.texto} />
      {estado.minhaMentira ? (
        <div className="v2-mentira-enviada">Sua mentira: <b>{estado.minhaMentira}</b></div>
      ) : (
        <form className="v2-mentira-form" onSubmit={enviar}>
          <label htmlFor="v2-mentira-texto" className="v2-oculto">Sua mentira</label>
          <input id="v2-mentira-texto" ref={campoRef} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={60} placeholder="Sua mentira…" autoComplete="off" />
          <button className="v2-botao v2-botao-amarelo" type="submit" disabled={enviando || !texto.trim()}>Enviar</button>
        </form>
      )}
      <QuemJa estado={estado} verbo="escrever" />
      {estado.souDono && <button className="v2-link v2-mentira-pular" onClick={aoPular}>pular esta curiosidade</button>}
    </section>
  );
}

function Escolher({ estado, aoEscolher }) {
  return (
    <section className="v2-cartao v2-mentira-fase">
      <Relogio tempo={estado.tempo} total={25} />
      <span className="v2-mentira-instrucao">Qual dessas é a VERDADE?</span>
      <Curiosidade texto={estado.curiosidade?.texto} />
      <div className="v2-mentira-opcoes">
        {(estado.opcoes || []).map((o) => (
          <button key={o.id} className={`v2-mentira-opcao ${estado.meuVoto === o.id ? "escolhida" : ""} ${o.minha ? "minha" : ""}`} disabled={o.minha || !!estado.meuVoto} onClick={() => aoEscolher(o.id)}>
            {o.texto}{o.minha && <small>sua mentira</small>}
          </button>
        ))}
      </div>
      <QuemJa estado={estado} verbo="escolher" />
    </section>
  );
}

// Revelação passo a passo: cada mentira em que alguém caiu, depois a verdade.
function Revelar({ estado }) {
  const itens = estado.revelacao?.itens || [];
  const [passo, setPasso] = useState(0);
  useEffect(() => {
    if (passo >= itens.length - 1) return;
    const t = setTimeout(() => setPasso((p) => p + 1), REVELA_MS);
    return () => clearTimeout(t);
  }, [passo, itens.length]);
  const item = itens[Math.min(passo, itens.length - 1)];
  const final = passo >= itens.length - 1;
  if (!item) return null;
  return (
    <section className="v2-cartao v2-mentira-fase v2-mentira-revela">
      <Curiosidade texto={estado.curiosidade?.texto} preenchida={final ? estado.curiosidade?.verdade : null} />
      <div key={item.id} className={`v2-mentira-carta ${item.verdade ? "verdade" : "mentira"}`}>
        <b className="v2-mentira-carta-texto">{item.texto}</b>
        {item.escolheram.length > 0 && <span className="v2-mentira-caiu">{item.verdade ? "Acertaram" : "Caíram"}: {item.escolheram.join(", ")}</span>}
        <span className="v2-mentira-carimbo">{item.verdade ? "VERDADE!" : item.casa ? "MENTIRA DA CASA" : `MENTIRA de ${item.autores.join(" e ")}`}</span>
      </div>
      {final && (estado.revelacao.ninguemCaiu || []).length > 0 && (
        <p className="v2-mentira-ninguem">Ninguém caiu em: {estado.revelacao.ninguemCaiu.map((i) => `"${i.texto}" (${i.autores.join(", ")})`).join(" · ")}</p>
      )}
    </section>
  );
}

function Fim({ estado, aoJogarDeNovo }) {
  const [primeiro, segundo, terceiro] = estado.jogadores;
  return (
    <section className="v2-cartao v2-mentira-fase v2-mentira-fim">
      <div className="v2-mentira-trofeu">🏆</div>
      <h2>{primeiro ? `${primeiro.nickname} é o maior mentiroso!` : "Fim de jogo"}</h2>
      <div className="v2-mentira-podio">
        {[segundo, primeiro, terceiro].filter(Boolean).map((j) => (
          <div key={j.id} className={j === primeiro ? "p1" : j === segundo ? "p2" : "p3"}>
            <Avatar userId={j.id} nickname={j.nickname} tamanho={j === primeiro ? 64 : 48} />
            <b>{j.nickname}</b>
            <span>{j.pontos.toLocaleString("pt-BR")}</span>
          </div>
        ))}
      </div>
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
          <span className="v2-mentira-nick">{j.nickname}{j.id === estado.donoId ? " 👑" : ""}{j.bot && <em className="v2-tag-bot">bot</em>}</span>
          {j.ganhou > 0 && <em className="v2-mentira-ganho">+{j.ganhou}</em>}
          <b>{j.pontos.toLocaleString("pt-BR")}</b>
        </div>
      ))}
    </aside>
  );
}
