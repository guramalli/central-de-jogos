import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Topo from "./Topo.jsx";
import Avatar from "./Avatar.jsx";
import { corDoTema } from "./temas.js";
import { linkDoDuelo } from "./Duelos.jsx";
import { ativarSons, somAcerto, somErro, somTique, somPergunta } from "./sons.js";

// O DUELO em si. A tela pede o estado ao servidor e manda cada jogada;
// quem decide acerto, tempo e vez é sempre o servidor (a resposta certa só
// chega depois de responder).

const GIRO_MS = 1600; // o relógio da pergunta já corre no servidor: giro curto
const MOTIVOS = [["resposta_errada", "A resposta está errada"], ["tema_errado", "Não é desse tema"], ["escrita", "Erro de escrita"], ["outro", "Outro problema"]];

export default function Duelo({ usuario, dueloId, veioDeConvite }) {
  const [estado, setEstado] = useState(null);
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState(null); // resultado da última resposta
  const [girando, setGirando] = useState(false);
  const [rotacao, setRotacao] = useState(0);
  const [mostrarPergunta, setMostrarPergunta] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [reportando, setReportando] = useState(false);

  const carregar = () => api.get(`/duelos/${dueloId}`).then(({ data }) => { setEstado(data); setErro(""); }).catch((e) => setErro(e.response?.data?.error || "Não foi possível abrir o duelo."));
  useEffect(() => { ativarSons(); carregar(); }, [dueloId]);

  // Esperando o adversário: confere de tempos em tempos.
  useEffect(() => {
    if (!estado || estado.convite || estado.minhaVez || estado.status !== "andamento" && estado.status !== "aguardando") return;
    const t = setInterval(() => { if (!document.hidden) carregar(); }, 6000);
    return () => clearInterval(t);
  }, [estado?.minhaVez, estado?.status, estado?.convite]);

  async function acao(fn) {
    setEnviando(true);
    try { await fn(); } catch (e) { setErro(e.response?.data?.error || "Algo deu errado. Tente de novo."); carregar(); }
    finally { setEnviando(false); }
  }

  async function girar() {
    await acao(async () => {
      const { data } = await api.post(`/duelos/${dueloId}/girar`);
      const idx = Math.max(0, data.temas.findIndex((t) => t.key === data.pergunta?.tema));
      // Fatia i ocupa [i*60, i*60+60) a partir do topo; pra parar com o
      // centro dela no ponteiro, a roda gira até (360 - centro).
      const centro = idx * 60 + 30;
      setRotacao((r) => r - (r % 360) + 360 * 4 + (360 - centro));
      setGirando(true);
      setMostrarPergunta(false);
      setEstado(data);
      setTimeout(() => { setGirando(false); setMostrarPergunta(true); somPergunta(); }, GIRO_MS);
    });
  }

  async function medalha(tema) {
    await acao(async () => {
      const { data } = await api.post(`/duelos/${dueloId}/medalha`, { tema });
      setEstado(data);
      setMostrarPergunta(true);
      somPergunta();
    });
  }

  async function responder(indice) {
    if (enviando || feedback) return;
    await acao(async () => {
      const { data } = await api.post(`/duelos/${dueloId}/responder`, { indice });
      setFeedback({ ...data, escolhido: indice, pergunta: estado.pergunta });
      if (data.correta) somAcerto(); else somErro();
      setTimeout(() => { setFeedback(null); setEstado(data.estado); }, data.correta ? 1500 : 2600);
    });
  }

  if (erro && !estado) return <Moldura usuario={usuario}><div className="v2-faixa-aviso erro">{erro}</div><VoltarDuelos /></Moldura>;
  if (!estado) return <Moldura usuario={usuario}><div className="v2-carregando">Carregando o duelo…</div></Moldura>;

  // Convite por link, aberto por quem ainda não está no duelo.
  if (estado.convite) {
    return (
      <Moldura usuario={usuario}>
        <section className="v2-cartao v2-duelo-convite">
          <div className="v2-duelo-convite-icone">⚔️</div>
          <h1><b>{estado.criador}</b> te desafiou pra um Duelo!</h1>
          <p>Quiz por turnos: gire a roleta, acerte as perguntas e conquiste as 6 medalhas primeiro. Você joga na sua vez, quando puder.</p>
          {erro && <div className="v2-faixa-aviso erro">{erro}</div>}
          <button className="v2-botao v2-botao-amarelo v2-botao-largo" disabled={enviando} onClick={() => acao(async () => { const { data } = await api.post(`/duelos/${dueloId}/entrar`); setEstado(data); })}>Aceitar o desafio</button>
          <VoltarDuelos />
        </section>
      </Moldura>
    );
  }

  const { eu, adversario, temas, minhaVez, pergunta } = estado;
  const fim = ["encerrado", "recusado", "cancelado"].includes(estado.status);
  const semAdversario = !adversario;
  const nomeAdv = estado.contraBot ? "Robô Duelista" : adversario?.nickname || "seu adversário";

  return (
    <Moldura usuario={usuario}>
      <VoltarDuelos />
      <section className="v2-duelo-placar-topo" aria-label="Placar do duelo">
        <Lado pessoa={eu} temas={temas} titulo="Você" vez={minhaVez} />
        <span className="v2-duelo-vs">VS</span>
        <Lado pessoa={adversario} temas={temas} titulo={nomeAdv} vez={!minhaVez && estado.status === "andamento" && !!adversario} direita />
      </section>

      {erro && <div className="v2-faixa-aviso erro" role="alert">{erro}</div>}

      {/* Convite por link recém-criado ou ainda sem adversário. */}
      {semAdversario && !fim && <CompartilharConvite id={dueloId} destaque={veioDeConvite} />}

      {minhaVez && !fim && !feedback && !(pergunta && mostrarPergunta) && <ResumoDoAdversario estado={estado} nomeAdv={nomeAdv} />}

      {fim ? (
        <Resultado estado={estado} usuario={usuario} nomeAdv={nomeAdv} aoReportar={() => setReportando(true)} />
      ) : minhaVez ? (
        feedback ? (
          <Pergunta pergunta={feedback.pergunta} feedback={feedback} aoReportar={() => setReportando(true)} />
        ) : pergunta && mostrarPergunta ? (
          <Pergunta key={pergunta.texto} pergunta={pergunta} aoResponder={responder} enviando={enviando} />
        ) : estado.precisaEscolherMedalha ? (
          <EscolherMedalha temas={temas} minhas={eu.medalhas} aoEscolher={medalha} enviando={enviando} />
        ) : (
          <section className="v2-cartao v2-duelo-roleta-area">
            <Medidor valor={eu.medidor} />
            <Roleta temas={temas} rotacao={rotacao} girando={girando} />
            <button className="v2-botao v2-botao-amarelo v2-duelo-girar" disabled={enviando || girando} onClick={girar}>{girando ? "Girando…" : "Girar a roleta"}</button>
            <p className="v2-nota-creme">Pergunta {Math.min(estado.perguntasNoTurno + 1, estado.perguntasPorTurno)} de {estado.perguntasPorTurno} neste turno · acertar enche o medidor</p>
            {eu.turnos === 0 && adversario && adversario.turnos > 0 && !estado.contraBot && (
              <button className="v2-link v2-duelo-recusar" onClick={() => { if (confirm("Recusar este duelo?")) acao(async () => { await api.post(`/duelos/${dueloId}/recusar`); irParaPagina("duelos"); }); }}>recusar este duelo</button>
            )}
          </section>
        )
      ) : (
        <EsperandoAdversario estado={estado} nomeAdv={nomeAdv} semAdversario={semAdversario} />
      )}

      {!fim && (
        <button className="v2-link v2-duelo-desistir" onClick={() => { if (confirm("Desistir deste duelo? O adversário leva a vitória.")) acao(async () => { const { data } = await api.post(`/duelos/${dueloId}/desistir`); setEstado(data); }); }}>desistir do duelo</button>
      )}

      {reportando && <Reportar dueloId={dueloId} aoFechar={() => setReportando(false)} />}
    </Moldura>
  );
}

function Moldura({ usuario, children }) {
  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo="duelos" />
      <main className="v2-pagina v2-duelo">{children}</main>
    </div>
  );
}

const VoltarDuelos = () => (
  <a className="v2-link" href={linkDaPagina("duelos")} onClick={(e) => { e.preventDefault(); irParaPagina("duelos"); }}>← Meus duelos</a>
);

function Lado({ pessoa, temas, titulo, vez, direita }) {
  return (
    <div className={`v2-duelo-lado ${vez ? "vez" : ""} ${direita ? "direita" : ""}`}>
      <div className="v2-duelo-quem">
        {pessoa ? <Avatar userId={pessoa.id} nickname={pessoa.nickname} tamanho={40} borda={vez} /> : <span className="v2-duelo-sem-adv">?</span>}
        <span><b>{titulo}</b>{vez && <em>na vez</em>}</span>
      </div>
      <div className="v2-duelo-medalhas" aria-label={`${pessoa?.medalhas?.length || 0} de 6 medalhas`}>
        {temas.map((t) => {
          const tem = pessoa?.medalhas?.includes(t.key);
          return (
            <span key={t.key} className={`v2-duelo-medalha ${tem ? "ok" : ""}`} style={{ "--cor": corDoTema(t.key)[0] }} title={`${t.nome}${tem ? " — conquistada" : ""}`}>
              <img src={`/temas-quiz/${t.key}.png`} alt={t.nome} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Medidor({ valor }) {
  return (
    <div className="v2-duelo-medidor" aria-label={`Medidor: ${valor} de 3`}>
      {[0, 1, 2].map((i) => <span key={i} className={i < valor ? "cheio" : ""} />)}
      <small>{valor >= 3 ? "medalha liberada!" : `${3 - valor} ${3 - valor === 1 ? "acerto" : "acertos"} pra pergunta da medalha`}</small>
    </div>
  );
}

// Nome que cabe na fatia da roleta.
const CURTOS = { geral: "Gerais", automobilismo: "Corrida", mitologia: "Mitologia", terceirao: "Terceirão", series: "Séries", anime: "Anime", rock: "Rock" };
const curto = (t) => CURTOS[t.key] || t.nome.split(" ")[0];

// Roleta em SVG: 6 fatias com a cor e o nome de cada tema.
function Roleta({ temas, rotacao, girando }) {
  const R = 140, C = 150;
  const ponto = (ang, r) => [C + r * Math.sin((ang * Math.PI) / 180), C - r * Math.cos((ang * Math.PI) / 180)];
  return (
    <div className="v2-roleta">
      <div className="v2-roleta-ponteiro" aria-hidden="true" />
      <svg viewBox="0 0 300 300" className="v2-roleta-roda" style={{ transform: `rotate(${rotacao}deg)`, transition: girando ? `transform ${GIRO_MS}ms cubic-bezier(.17,.67,.21,1)` : "none" }} role="img" aria-label={`Roleta com os temas: ${temas.map((t) => t.nome).join(", ")}`}>
        {temas.map((t, i) => {
          const [x1, y1] = ponto(i * 60, R), [x2, y2] = ponto(i * 60 + 60, R);
          const [tx, ty] = ponto(i * 60 + 30, R * 0.62);
          const [cor, sombra] = corDoTema(t.key);
          return (
            <g key={t.key}>
              <path d={`M${C},${C} L${x1},${y1} A${R},${R} 0 0,1 ${x2},${y2} Z`} fill={cor} stroke={sombra} strokeWidth="3" />
              <image href={`/temas-quiz/${t.key}.png`} x={tx - 22} y={ty - 30} width="44" height="44" transform={`rotate(${i * 60 + 30} ${tx} ${ty})`} />
              <text x={tx} y={ty + 26} textAnchor="middle" transform={`rotate(${i * 60 + 30} ${tx} ${ty})`} className={`v2-roleta-texto ${curto(t).length > 8 ? "longo" : ""}`}>{curto(t)}</text>
            </g>
          );
        })}
        <circle cx={C} cy={C} r="30" fill="#2B1B5E" stroke="#FFD60A" strokeWidth="5" />
      </svg>
    </div>
  );
}

function Pergunta({ pergunta, aoResponder, enviando, feedback, aoReportar }) {
  const fimRef = useRef(Date.now() + (pergunta.restante ?? pergunta.segundos) * 1000);
  const [resta, setResta] = useState(pergunta.restante ?? pergunta.segundos);
  const respondeuRef = useRef(false);

  useEffect(() => {
    if (feedback) return;
    const t = setInterval(() => {
      const s = Math.max(0, Math.ceil((fimRef.current - Date.now()) / 1000));
      setResta((antes) => { if (s < antes && s > 0 && s <= 5) somTique(); return s; });
      if (s <= 0 && !respondeuRef.current) { respondeuRef.current = true; aoResponder?.(-1); } // tempo esgotado
    }, 250);
    return () => clearInterval(t);
  }, [feedback]);

  // Teclado no computador: 1 a 4.
  useEffect(() => {
    if (feedback) return;
    const tecla = (e) => { const n = Number(e.key); if (n >= 1 && n <= 4 && !respondeuRef.current) { respondeuRef.current = true; aoResponder?.(n - 1); } };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [feedback]);

  const [cor, sombra] = corDoTema(pergunta.tema);
  const pct = Math.max(0, Math.min(100, (resta / pergunta.segundos) * 100));
  return (
    <section className={`v2-cartao v2-duelo-pergunta ${pergunta.tipo === "medalha" ? "medalha" : ""}`} style={{ "--cor": cor, "--sombra": sombra }}>
      <div className="v2-duelo-pergunta-topo">
        <span className="v2-duelo-tema"><img src={`/temas-quiz/${pergunta.tema}.png`} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />{pergunta.nomeTema}</span>
        {pergunta.tipo === "medalha" && <span className="v2-duelo-tag-medalha">pergunta da medalha</span>}
        {!feedback && <span className={`v2-duelo-tempo ${resta <= 5 ? "urgente" : ""}`}>{resta}s</span>}
      </div>
      {!feedback && <div className="v2-duelo-barra" aria-hidden="true"><div style={{ width: `${pct}%` }} /></div>}
      <h2 className="v2-duelo-enunciado">{pergunta.texto}</h2>
      <div className="v2-duelo-alternativas">
        {pergunta.alternativas.map((a, i) => {
          let classe = "";
          if (feedback) {
            if (i === feedback.indiceCerto) classe = "certa";
            else if (i === feedback.escolhido) classe = "errada";
            else classe = "apagada";
          }
          return (
            <button key={i} className={`v2-duelo-alt ${classe}`} disabled={!!feedback || enviando} onClick={() => { if (!respondeuRef.current) { respondeuRef.current = true; aoResponder(i); } }}>
              <span className="v2-duelo-alt-letra">{"ABCD"[i]}</span>
              <span>{a}</span>
            </button>
          );
        })}
      </div>
      {feedback && (
        <div className={`v2-duelo-feedback ${feedback.correta ? "ok" : "erro"}`} role="status">
          <b>{feedback.correta ? (feedback.ganhouMedalha ? "Medalha conquistada!" : "Acertou!") : feedback.tempoEsgotado ? "Tempo esgotado!" : "Errou!"}</b>
          {!feedback.correta && <span>A resposta era <b>{feedback.respostaCerta}</b>. A vez passa pro adversário.</span>}
          <button className="v2-link" onClick={aoReportar}>reportar pergunta</button>
        </div>
      )}
    </section>
  );
}

function EscolherMedalha({ temas, minhas, aoEscolher, enviando }) {
  return (
    <section className="v2-cartao v2-duelo-escolha">
      <div className="v2-duelo-escolha-topo">🏅</div>
      <h2>Medidor cheio!</h2>
      <p className="v2-nota-creme">Escolha o tema da medalha. Acertou, ela é sua.</p>
      <div className="v2-duelo-escolha-grade">
        {temas.filter((t) => !minhas.includes(t.key)).map((t) => {
          const [cor, sombra] = corDoTema(t.key);
          return (
            <button key={t.key} className="v2-duelo-escolha-tema" disabled={enviando} style={{ "--cor": cor, "--sombra": sombra }} onClick={() => aoEscolher(t.key)}>
              <img src={`/temas-quiz/${t.key}.png`} alt="" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
              <span>{t.nome}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EsperandoAdversario({ estado, nomeAdv, semAdversario }) {
  const jogadasDele = (estado.eventos || []).filter((e) => e.quem !== estado.eu.id).slice(-4).reverse();
  const nomeTema = (k) => estado.temas.find((t) => t.key === k)?.nome || k;
  const horas = estado.prazoEm ? Math.max(0, Math.round((new Date(estado.prazoEm) - Date.now()) / 3600000)) : null;
  return (
    <section className="v2-cartao v2-duelo-espera">
      <div className="v2-duelo-espera-icone">⏳</div>
      <h2>{semAdversario ? "Esperando alguém aceitar o convite" : `Vez de ${nomeAdv}`}</h2>
      <p className="v2-nota-creme">
        {semAdversario ? "Assim que alguém abrir o link e aceitar, o duelo continua." : `Ele tem ${horas ?? 24}h pra jogar. A gente atualiza sozinho — pode fechar e voltar depois.`}
      </p>
      {jogadasDele.length > 0 && (
        <ul className="v2-duelo-eventos">
          {jogadasDele.map((e, i) => (
            <li key={i} className={e.tipo}>
              {e.tipo === "medalha" ? "🏅 Ganhou a medalha de" : e.tipo === "acerto" ? "✓ Acertou" : e.tempo ? "⏱ Deixou o tempo acabar em" : "✕ Errou"} {nomeTema(e.tema)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CompartilharConvite({ id, destaque }) {
  const [copiado, setCopiado] = useState(false);
  const link = linkDoDuelo(id);
  async function compartilhar() {
    const texto = `Te desafio no Duelo da Educação Gamer! ⚔️ Quiz por turnos — aceita? ${link}`;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) await navigator.share({ text: texto });
      else { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2500); }
    } catch {}
  }
  return (
    <section className={`v2-cartao v2-duelo-link ${destaque ? "destaque" : ""}`}>
      <b>Convide alguém pra este duelo</b>
      <span className="v2-duelo-link-url">{link}</span>
      <button className="v2-botao v2-botao-amarelo" onClick={compartilhar}>{copiado ? "Link copiado!" : "Compartilhar convite"}</button>
    </section>
  );
}

function Resultado({ estado, usuario, nomeAdv, aoReportar }) {
  const venci = estado.vencedorId === usuario.id;
  const empate = estado.status === "encerrado" && !estado.vencedorId;
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState("");
  const motivo = { medalhas: "pelas 6 medalhas", turnos: "no fim dos turnos", prazo: "por tempo (prazo de 24h)", desistencia: "por desistência", empate: "" }[estado.motivoFim] || "";
  async function revanche() {
    setCriando(true);
    try {
      const { data } = await api.post("/duelos", estado.contraBot ? { bot: true } : { adversarioId: estado.adversario?.id });
      irParaPagina("duelo", { id: data.id });
    } catch (e) { setErro(e.response?.data?.error || "Não deu pra criar a revanche."); }
    finally { setCriando(false); }
  }
  return (
    <section className={`v2-cartao v2-duelo-fim ${venci ? "venceu" : empate ? "empate" : "perdeu"}`}>
      <div className="v2-duelo-fim-icone">{estado.status === "recusado" ? "🙅" : venci ? "🏆" : empate ? "🤝" : "😵"}</div>
      <h2>{estado.status === "recusado" ? "Duelo recusado" : estado.status === "cancelado" ? "Duelo cancelado" : venci ? "Você venceu!" : empate ? "Empate!" : `${nomeAdv} venceu`}</h2>
      {motivo && <p>{motivo}</p>}
      <div className="v2-duelo-fim-placar"><b>{estado.eu.medalhas.length}</b><span>×</span><b>{estado.adversario?.medalhas?.length ?? 0}</b></div>
      {erro && <div className="v2-faixa-aviso erro">{erro}</div>}
      {estado.status === "encerrado" && estado.adversario && <button className="v2-botao v2-botao-amarelo v2-botao-largo" disabled={criando} onClick={revanche}>Revanche</button>}
      <button className="v2-link" onClick={aoReportar}>reportar a última pergunta</button>
    </section>
  );
}

function Reportar({ dueloId, aoFechar }) {
  const [enviado, setEnviado] = useState(null);
  async function enviar(motivo) {
    try { await api.post(`/duelos/${dueloId}/reportar`, { motivo }); setEnviado("Obrigado! A pergunta vai pra revisão."); }
    catch (e) { setEnviado(e.response?.data?.error || "Não foi possível reportar agora."); }
    setTimeout(aoFechar, 1800);
  }
  return (
    <div className="v2-modal-fundo" onClick={aoFechar}>
      <div className="v2-modal" role="dialog" aria-label="Reportar pergunta" onClick={(e) => e.stopPropagation()}>
        <h3>Reportar a última pergunta</h3>
        {enviado ? <p className="v2-modal-ok">{enviado}</p> : (
          <div className="v2-modal-form">
            {MOTIVOS.map(([k, r]) => <button key={k} className="v2-botao v2-botao-contorno" onClick={() => enviar(k)}>{r}</button>)}
          </div>
        )}
      </div>
    </div>
  );
}

// O que o adversário fez desde a MINHA última jogada — quem volta horas
// depois quer saber antes de girar a roleta.
function ResumoDoAdversario({ estado, nomeAdv }) {
  const eventos = estado.eventos || [];
  let ultimaMinha = -1;
  eventos.forEach((e, i) => { if (e.quem === estado.eu.id) ultimaMinha = i; });
  const dele = eventos.slice(ultimaMinha + 1).filter((e) => e.quem !== estado.eu.id);
  if (!dele.length) return null;
  const nomeTema = (k) => estado.temas.find((t) => t.key === k)?.nome || k;
  const acertos = dele.filter((e) => e.tipo === "acerto" || e.tipo === "medalha").length;
  const medalhas = dele.filter((e) => e.tipo === "medalha").map((e) => nomeTema(e.tema));
  return (
    <section className="v2-duelo-resumo" role="status">
      <b>Enquanto isso, {nomeAdv}:</b>
      <span>
        {acertos === 0 ? "errou a pergunta e passou a vez" : `acertou ${acertos} ${acertos === 1 ? "pergunta" : "perguntas"}`}
        {medalhas.length > 0 && <> e ganhou a medalha de <b>{medalhas.join(", ")}</b> 🏅</>}
        {acertos > 0 && dele.at(-1)?.tipo === "erro" && ", até errar uma"}.
      </span>
    </section>
  );
}
