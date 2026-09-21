import { useEffect, useRef, useState } from "react";
import { novoSocket } from "./api.js";
import { irParaPagina } from "./App.jsx";
import Topo from "./Topo.jsx";
import Avatar from "./Avatar.jsx";

// MENTIRA SINCERA (em teste, escondido): só admin cria sala; quem tiver o
// link/código entra. O servidor manda o estado inteiro a cada mudança
// ("mentira-estado"), já personalizado — a verdade só vem na revelação.

const linkDaSala = (codigo) => `${window.location.origin}/v2/?pagina=mentira&mesa=${codigo}`;
// NARRADOR POR VOZ — síntese de voz do próprio navegador (pt-BR), sem custo.
// A qualidade depende do aparelho (no Chrome/Edge costuma ter voz boa).
// Cada fala nova interrompe a anterior, pra não acumular fila.
function vozPtBr() {
  const vozes = window.speechSynthesis?.getVoices?.() || [];
  const pt = vozes.filter((v) => /^pt(-|_)BR/i.test(v.lang) || /portugu/i.test(v.name));
  return pt.find((v) => /google|luciana|francisca|thalita|natural/i.test(v.name)) || pt[0] || null;
}
function falarTexto(texto) {
  try {
    const synth = window.speechSynthesis;
    if (!synth || !texto) return;
    synth.cancel();
    const limpo = String(texto).replace(/🎤|🎯|🫵|👍|🤫|🏆|[\u{1F300}-\u{1FAFF}]/gu, "").replace(/_{2,}/g, "tal coisa").trim();
    const u = new SpeechSynthesisUtterance(limpo);
    u.lang = "pt-BR";
    const voz = vozPtBr();
    if (voz) u.voice = voz;
    u.rate = 1.05;
    u.pitch = 1.05;
    synth.speak(u);
  } catch {}
}
function useNarrador(ligado) {
  useEffect(() => { window.speechSynthesis?.getVoices?.(); }, []); // carrega a lista de vozes
  useEffect(() => { if (!ligado) window.speechSynthesis?.cancel?.(); }, [ligado]);
  return (texto) => { if (ligado) falarTexto(texto); };
}

export default function Mentira({ usuario, salaDoLink }) {
  const [estado, setEstado] = useState(null);
  const [erro, setErro] = useState("");
  const [codigoDigitado, setCodigoDigitado] = useState("");
  const [streamer, setStreamer] = useState(() => localStorage.getItem("eg_mentira_streamer") === "1");
  const [voz, setVoz] = useState(() => localStorage.getItem("eg_mentira_voz") !== "0");
  const falar = useNarrador(voz);
  function alternarVoz() { const n = !voz; setVoz(n); localStorage.setItem("eg_mentira_voz", n ? "1" : "0"); if (n) falarTexto("Narração ligada!"); }
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

  // Narra as mudanças de fase (uma vez por fase/rodada).
  const narradoRef = useRef("");
  useEffect(() => {
    if (!estado) return;
    const chave = `${estado.fase}-${estado.rodada}-${estado.todosVotaram ? 1 : 0}`;
    if (narradoRef.current === chave) return;
    narradoRef.current = chave;
    if (estado.fase === "escrever") falar(`${aberturaDaRodada(estado)} ${estado.perguntas.map((p) => p.texto).join(" E a outra: ")}`);
    else if (estado.fase === "escolher" && !estado.todosVotaram) falar(estado.final ? "Hora de escolher! Achem a verdade nas duas perguntas." : "Hora de escolher! Qual dessas é a verdade?");
    else if (estado.fase === "escolher" && estado.todosVotaram) falar("Todo mundo votou! Aproveitem pra curtir as mentiras mais criativas.");
    else if (estado.fase === "confessar") falar("Hora da confissão! Contem a verdade sobre vocês.");
    else if (estado.fase === "fim") falar(estado.jogadores[0] ? `Fim de jogo! ${estado.jogadores[0].nickname} é o grande mentiroso da partida!` : "Fim de jogo!");
  }, [estado?.fase, estado?.rodada, estado?.todosVotaram]);

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
            <span className="v2-mentira-rodada">{estado.modo === "sobre" && <em className="v2-mentira-modo-selo">Sobre Vocês</em>}
              {fase === "confessar" ? "Confissões" : estado.modo === "sobre" ? `Sobre ${estado.assunto?.nickname || "…"} — rodada ${estado.rodada} de ${estado.totalRodadas}` : estado.final ? "FINAL" : `Pergunta ${estado.rodada} de ${estado.totalRodadas}`}
              {estado.multiplicador > 1 && <b className={`v2-mentira-mult x${estado.multiplicador}`}>×{estado.multiplicador}</b>}
            </span>
          )}
        </div>
        <div className="v2-mentira-topo-dir">
          <span className="v2-mentira-cod-selo">{streamer ? "código escondido" : `sala ${estado.codigo}`}</span>
          <button className={`v2-botao-pequeno ${voz ? "ativo" : ""}`} onClick={alternarVoz} aria-pressed={voz} title="Narração por voz (liga/desliga)">{voz ? "🔊 Voz" : "🔇 Voz"}</button>
          <button className={`v2-botao-pequeno ${streamer ? "ativo" : ""}`} onClick={alternarStreamer} title="Esconde o código e o link da tela (pra live)">{streamer ? "Modo streamer: ligado" : "Modo streamer"}</button>
          <button className="v2-botao-pequeno" onClick={() => { socketRef.current?.emit("mentira-sair"); irParaPagina(null); }}>Sair</button>
        </div>
      </section>

      {erro && <div className="v2-faixa-aviso erro" role="alert">{erro}</div>}

      <div className={`v2-mentira-corpo ${fase === "revelar" ? "palco-cheio" : ""}`}>
        <div className="v2-mentira-palco">
          {fase === "aguardando" && <Espera estado={estado} streamer={streamer} aoComecar={() => pedir("mentira-comecar")} aoBot={(acao) => pedir("mentira-bot", { acao })} aoModo={(modo) => pedir("mentira-modo", { modo })} />}
          {fase === "confessar" && <Confessar estado={estado} aoConfessar={(texto) => pedir("mentira-confessar", { texto })} />}
          {fase === "escrever" && <Escrever key={`${estado.rodada}-${estado.perguntas?.[0]?.texto}`} estado={estado} aoMentir={(texto) => pedir("mentira-mentir", { texto })} aoPular={() => pedir("mentira-pular")} />}
          {fase === "escolher" && <Escolher estado={estado} aoEscolher={(opcaoId, pergunta) => pedir("mentira-escolher", { opcaoId, pergunta })} aoCurtir={(opcaoId) => pedir("mentira-curtir", { opcaoId })} />}
          {fase === "revelar" && <Revelar key={`${estado.rodada}-${estado.perguntas?.[0]?.texto}`} estado={estado} falar={falar} meuId={usuario.id} aoCurtir={(opcaoId) => pedir("mentira-curtir", { opcaoId })} />}
          {fase === "fim" && <Fim estado={estado} aoJogarDeNovo={() => pedir("mentira-comecar")} aoModo={(modo) => pedir("mentira-modo", { modo })} />}
        </div>
        {fase !== "revelar" && <Placar estado={estado} meuId={usuario.id} />}
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
function Curiosidade({ texto, preenchida, numero }) {
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

function EscolhaModo({ estado, aoModo }) {
  if (!estado.souDono) return <p className="v2-cartao-nota">Modo: <b>{estado.modo === "sobre" ? "Sobre Vocês" : "Curiosidades"}</b></p>;
  return (
    <div className="v2-mentira-modos" role="radiogroup" aria-label="Modo de jogo">
      <button role="radio" aria-checked={estado.modo !== "sobre"} className={estado.modo !== "sobre" ? "ativo" : ""} onClick={() => aoModo("curiosidades")}>
        <span>🧠</span><b>Curiosidades</b><small>Fatos reais e absurdos do mundo. Com final de mentira dupla.</small>
      </button>
      <button role="radio" aria-checked={estado.modo === "sobre"} className={estado.modo === "sobre" ? "ativo" : ""} onClick={() => aoModo("sobre")}>
        <span>🫵</span><b>Sobre Vocês</b><small>Cada um confessa uma verdade sobre si — e os outros mentem sobre ela. Mín. 3.</small>
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
      <EscolhaModo estado={estado} aoModo={aoModo} />
      <div className="v2-mentira-quem">{online.map((j) => <span key={j.id} className="pronto">{j.nickname}{j.id === estado.donoId ? " 👑" : ""}{j.bot ? " 🤖" : ""}</span>)}</div>
      {estado.souDono && (
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
  if (estado.rodada === 1) return "🎤 Bem-vindos ao Mentira Sincera! Mintam com convicção — e cuidado com as mentiras da casa, elas tiram pontos.";
  return escolherFrase(["🎤 Mais uma. Capricha nessa mentira.", "🎤 Essa aqui é verdade, acredite se quiser.", "🎤 Quero ver quem cai nessa.", "🎤 Fato real. Juro. Agora mintam."], `${estado.codigo}-${estado.rodada}`);
}

// "Sobre Vocês": cada um escreve a VERDADE sobre si.
function Confessar({ estado, aoConfessar }) {
  const [texto, setTexto] = useState("");
  const campoRef = useRef(null);
  useEffect(() => { campoRef.current?.focus(); }, []);
  const [antes, depois] = String(estado.minhaFrase || "").split("___");
  return (
    <section className="v2-cartao v2-mentira-fase">
      <Relogio tempo={estado.tempo} total={60} />
      <p className="v2-mentira-apresentador">🎤 Hora da confissão! Complete com a VERDADE sobre você — depois os outros vão inventar mentiras sobre isso.</p>
      {estado.minhaFrase ? (
        <>
          <p className="v2-mentira-curiosidade">{antes}<span className="v2-mentira-lacuna">_____</span>{depois}</p>
          {estado.minhaConfissao ? (
            <div className="v2-mentira-enviada">Sua verdade: <b>{estado.minhaConfissao}</b> 🤫</div>
          ) : (
            <form className="v2-mentira-form" onSubmit={(e) => { e.preventDefault(); if (texto.trim()) aoConfessar(texto); }}>
              <label htmlFor="v2-mentira-conf" className="v2-oculto">Sua verdade</label>
              <input id="v2-mentira-conf" ref={campoRef} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={60} placeholder="A verdade (curta!)…" autoComplete="off" />
              <button className="v2-botao v2-botao-amarelo" type="submit" disabled={!texto.trim()}>Confessar</button>
            </form>
          )}
          <p className="v2-mentira-dica">Dica: respostas curtas e verdadeiras rendem mais — quanto mais inacreditável, melhor.</p>
        </>
      ) : <p className="v2-cartao-nota">Você entrou depois das confissões — joga a partida, mas não vira assunto desta vez.</p>}
      <QuemJa estado={estado} verbo="confessar" />
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
      <Relogio tempo={estado.tempo} total={estado.final ? 60 : 45} />
      <p className="v2-mentira-apresentador">{aberturaDaRodada(estado)}</p>
      <span className="v2-mentira-instrucao">{estado.final ? "Uma mentira que sirva pras DUAS:" : "Invente uma mentira que pareça verdade:"}</span>
      {estado.perguntas.map((p, i) => <Curiosidade key={i} texto={p.texto} numero={estado.final ? i + 1 : null} />)}
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
      <Relogio tempo={estado.tempo} total={estado.final ? 35 : 25} />
      {estado.perguntas.map((p, i) => (
        <div key={i} className="v2-mentira-bloco-escolha">
          <span className="v2-mentira-instrucao">{estado.souAssunto ? "Os outros estão tentando achar a SUA verdade:" : estado.final ? `Pergunta ${i + 1}: qual é a VERDADE?` : "Qual dessas é a VERDADE?"}</span>
          <Curiosidade texto={p.texto} />
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
        <p className="v2-mentira-janela">✅ Todo mundo votou! Aproveita pra curtir 👍 as mais criativas — revelação em <b>{estado.tempo}s</b></p>
      ) : escolheuTudo && <p className="v2-mentira-dica">Curta as mentiras que te fizeram rir — no fim sai o troféu <b>Mais Engraçado</b>.</p>}
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
function comentario(item, total) {
  const n = item.escolheram.length;
  if (item.verdade) {
    if (n === 0) return escolherFrase(["🎤 NINGUÉM acertou. Vocês não sabem de nada.", "🎤 Zero acertos. A verdade é mais estranha que a ficção."], item.id);
    if (n >= total - 1) return escolherFrase(["🎤 Fácil demais, né? Todo mundo sabia.", "🎤 Essa todo mundo matou."], item.id);
    return escolherFrase(["🎤 Pois é, isso é verdade mesmo.", "🎤 Acredite se quiser: verdade pura."], item.id);
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
function Revelar({ estado, falar, meuId, aoCurtir }) {
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

  // Narração de cada carta e do resumo.
  useEffect(() => {
    if (noResumo) { falar(estado.revelacao?.dupla?.length ? `Mentira dupla! ${estado.revelacao.dupla.join(" e ")} ganhou mil pontos! Vamos ao placar.` : "Vamos ver como ficou o placar!"); return; }
    if (!item) return;
    const quem = item.verdade ? `A verdade é: ${item.texto}!` : item.casa ? `${item.texto}. Mentira da casa!` : `${item.texto}. Mentira de ${item.autores.join(" e ")}!`;
    falar(`${quem} ${comentario(item, totalJogadores).replace("🎤", "")}`);
  }, [passo]);

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
      <Curiosidade texto={pergunta.texto} preenchida={item.verdade ? pergunta.verdade : null} />
      <div key={item.id} className={`v2-mentira-carta ${item.verdade ? "verdade" : "mentira"}`}>
        <b className="v2-mentira-carta-texto">{item.texto}</b>
        {item.escolheram.length > 0 && (
          <div className="v2-mentira-caiu-lista">
            <small>{item.verdade ? "Acertaram:" : "Caíram:"}</small>
            {item.escolheram.map((n, i) => <span key={n} className="v2-mentira-caiu-chip" style={{ animationDelay: `${0.5 + i * 0.45}s` }}>{n}</span>)}
          </div>
        )}
        <span className="v2-mentira-carimbo" style={{ animationDelay: `${0.8 + item.escolheram.length * 0.45}s` }}>
          {item.verdade ? (estado.modo === "sobre" ? `VERDADE! Confissão de ${estado.assunto?.nickname || "alguém"}` : "VERDADE!") : item.casa ? "MENTIRA DA CASA" : `MENTIRA de ${item.autores.join(" e ")}`}
        </span>
        {pontos && <span className={`v2-mentira-pontos-carta ${item.casa ? "negativo" : ""}`} style={{ animationDelay: `${1.3 + item.escolheram.length * 0.45}s` }}>{pontos}</span>}
        {item.curtivel ? (
          <button className={`v2-mentira-curtir-carta ${estado.minhasCurtidas.includes(item.id) ? "ativo" : ""}`} onClick={() => aoCurtir(item.id)} aria-pressed={estado.minhasCurtidas.includes(item.id)} title="Curtir essa mentira (troféu Mais Engraçado)">
            👍 {item.curtidas > 0 ? item.curtidas : "curtir"}
          </button>
        ) : item.curtidas > 0 && <span className="v2-mentira-curtidas">👍 {item.curtidas}</span>}
      </div>
      <p className="v2-mentira-apresentador">{comentario(item, totalJogadores)}</p>
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
  const todas = [...(estado.revelacao?.todas || [])].sort((a, b) =>
    (a.verdade ? 1 : 0) - (b.verdade ? 1 : 0) || b.escolheram.length - a.escolheram.length);
  const [cresceu, setCresceu] = useState(false);
  useEffect(() => { const t = setTimeout(() => setCresceu(true), 700); return () => clearTimeout(t); }, []);
  const jogadores = estado.jogadores;
  const maior = Math.max(1, ...jogadores.map((j) => j.pontos));
  const porPergunta = estado.final ? [0, 1] : [0];
  return (
    <section className="v2-cartao v2-mentira-fase v2-mentira-resumo">
      <h2>Resumo da rodada</h2>
      {porPergunta.map((p) => (
        <div key={p} className="v2-mentira-resumo-bloco">
          {estado.final && <span className="v2-mentira-instrucao">Pergunta {p + 1}</span>}
          <ul className="v2-mentira-resumo-lista">
            {todas.filter((i) => (i.pergunta || 0) === p).map((i, k) => (
              <li key={i.id} className={i.verdade ? "verdade" : i.casa ? "casa" : ""} style={{ animationDelay: `${k * 0.12}s` }}>
                <div className="v2-mentira-resumo-frase">
                  <b>{i.texto}</b>
                  <em>{i.verdade ? "✅ VERDADE" : i.casa ? "🏠 da casa" : `de ${i.autores.join(" e ")}`}{i.curtidas > 0 ? ` · 👍 ${i.curtidas}` : ""}</em>
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

function Fim({ estado, aoJogarDeNovo, aoModo }) {
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
      {estado.souDono && <EscolhaModo estado={estado} aoModo={aoModo} />}
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
