import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";
import { AvatarImp, Cronometro, SEGREDO_ERA, emSerie, modoDe, quem, useSegundos } from "./comum.jsx";
import { BonecoDoJogador } from "../AvatarBoneco.jsx";
import { tocar } from "./sons.js";
import Agente from "./Agente.jsx";
import RankingSerie from "./RankingSerie.jsx";

const MOTIVO_CANCELADA = {
  impostor_saiu: "O impostor saiu da partida. Ninguém pontua.",
  poucos_jogadores: "Ficaram menos de 3 jogadores. Partida encerrada, ninguém pontua.",
};

// Etapas da sequência (spec, seção 7):
//   0 tela escura "A VERDADE" (1s) → 1 votos um a um (300ms cada) →
//   2 suspense (1s) → 3 avatar do mais votado cresce com anel vermelho →
//   4 nome + veredito com impacto; depois última chance / resultado.
// O servidor segura a REVELACAO por 9s; com 12 votos a sequência leva ~7s.
const ESCURO = 0, VOTOS = 1, SUSPENSE = 2, AVATAR = 3, VEREDITO = 4;

// Depois do resultado da ÚLTIMA partida da série, quanto tempo até a tela
// virar o RANKING DA SÉRIE sozinha (dá pra ler o segredo e os pontos).
const MS_ATE_RANKING = 7000;

// REVELACAO, ULTIMA_CHANCE e FIM (fica montado nas três: a sequência roda
// uma vez só, no começo da revelação). No FIM que fecha uma série, o
// resultado da partida fica na tela um pouco e dá lugar ao ranking final
// (com um botão pra voltar a ver a partida).
export default function Revelacao({ estado, carta, tempo, pedir, aoSair }) {
  const rev = estado.revelacao;
  const fim = estado.fase === "FIM" ? estado.resultado : null;
  const final = !!fim && emSerie(estado) && !!estado.serie.encerrada && !!estado.serie.ranking;
  const [verRanking, setVerRanking] = useState(false);
  useEffect(() => {
    if (!final) return undefined;
    const t = setTimeout(() => setVerRanking(true), MS_ATE_RANKING);
    return () => clearTimeout(t);
  }, [final]);
  const aoVerRanking = final ? () => setVerRanking(true) : null;

  if (final && verRanking) {
    return <RankingSerie estado={estado} tempo={tempo} pedir={pedir} aoSair={aoSair} aoVerPartida={() => setVerRanking(false)} />;
  }
  const comuns = { estado, fim, tempo, pedir, aoSair, aoVerRanking };
  if (!rev) return <Cancelada {...comuns} />;
  return <Sequencia {...comuns} rev={rev} carta={carta} />;
}

// Ordem em que os votos "chegam": em rodízio, do menos votado pro mais
// votado — assim o líder só se define no fim.
function ordemDosVotos(contagem) {
  const asc = [...contagem].sort((a, b) => a.votos - b.votos);
  const max = Math.max(0, ...asc.map((c) => c.votos));
  const ordem = [];
  for (let k = 1; k <= max; k++) for (const c of asc) if (c.votos >= k) ordem.push(c.id);
  return ordem;
}

// O mascote torce pelo impostor: nervoso até o veredito (e de novo na
// última chance); escapou (inocente/empate) → comemora; descoberto → é
// pego. No FIM vale o vencedor (acertou a última chance = comemora).
// Só valores simples entram (o `estado` chega novo a cada aviso do servidor).
function humorDoAgente(fase, descoberto, vencedor, pronto) {
  if (!pronto) return "votacao";
  if (vencedor) return vencedor === "impostor" ? "festa" : vencedor === "tripulantes" ? "pego" : "lobby";
  if (fase === "ULTIMA_CHANCE") return "votacao";
  return descoberto ? "pego" : "festa";
}

function useSequencia(estado, tempo, totalVotos) {
  // Só roda do começo se a revelação acabou de começar. Quem entra (ou
  // reconecta) no meio, ou já na última chance/fim, vê direto o final.
  const doComeco = useRef(estado.fase === "REVELACAO" && (tempo?.ms ?? 0) > 7500).current;
  const [etapa, setEtapa] = useState(doComeco ? ESCURO : VEREDITO);
  const [mostrados, setMostrados] = useState(doComeco ? 0 : totalVotos);

  useEffect(() => {
    if (!doComeco) return undefined;
    tocar("revelacao");
    const timers = [];
    const em = (ms, fn) => timers.push(setTimeout(fn, ms));
    let t = 1000;
    em(t, () => setEtapa(VOTOS));
    for (let i = 1; i <= totalVotos; i++) em(t + i * 300, () => setMostrados(i));
    t += totalVotos * 300 + 400;
    em(t, () => setEtapa(SUSPENSE));
    t += 1000;
    em(t, () => setEtapa(AVATAR));
    t += 800;
    em(t, () => setEtapa(VEREDITO));
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { etapa, mostrados };
}

function Sequencia({ estado, rev, fim, carta, tempo, pedir, aoSair, aoVerRanking }) {
  const ordem = useMemo(() => ordemDosVotos(rev.contagem), [rev]);
  const { etapa, mostrados } = useSequencia(estado, tempo, ordem.length);
  const impostorId = rev.impostorId;
  const souImpostor = impostorId === estado.euId || carta?.papel === "impostor";
  const pronto = etapa >= VEREDITO;
  const humorAgente = useMemo(
    () => humorDoAgente(estado.fase, !!rev.descoberto, fim?.vencedor || null, pronto),
    [estado.fase, rev.descoberto, fim?.vencedor, pronto],
  );

  // Vitória: toca uma vez, quando o resultado aparece e o meu lado ganhou.
  const tocouVitoria = useRef(false);
  useEffect(() => {
    if (!fim || !pronto || tocouVitoria.current || fim.vencedor === "cancelada") return;
    const venci = souImpostor ? fim.vencedor === "impostor" : fim.vencedor === "tripulantes";
    if (venci && fim.pontos[estado.euId] != null) { tocouVitoria.current = true; tocar("vitoria"); }
  }, [fim, pronto]); // eslint-disable-line react-hooks/exhaustive-deps

  const votosVisiveis = (id) => ordem.slice(0, mostrados).filter((x) => x === id).length;
  const maxVotos = Math.max(1, ...rev.contagem.map((c) => c.votos));

  return (
    <div className="imp-revelacao">
      <AnimatePresence>
        {etapa === ESCURO && (
          <motion.div
            className="imp-escuro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.span initial={{ opacity: 0, letterSpacing: "2px" }} animate={{ opacity: 1, letterSpacing: "10px" }} transition={{ duration: 0.9 }}>
              A VERDADE
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="imp-revelacao-palco" aria-live="polite">
        <span className="imp-rotulo imp-verdade">A VERDADE</span>
        <Agente humor={humorAgente} className="imp-agente-revelacao" />
        <Acusado estado={estado} rev={rev} etapa={etapa} />
        {fim && pronto && <Segredo estado={estado} fim={fim} />}
      </section>

      <section className="imp-revelacao-lado">
        {/* Série com mesa cheia (9+): no FIM o placar da série toma o lugar
            dos votos (que já passaram na revelação) — senão a coluna não cabe. */}
        {etapa >= VOTOS && !(fim && emSerie(estado) && (estado.serie.ranking?.length || 0) > 8) && (
          <motion.div className="imp-painel imp-placar" aria-label="Votos" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="imp-rotulo">VOTOS</h2>
            <ul className={rev.contagem.length > 6 ? "muitos" : ""}>
              {rev.contagem.map((c) => {
                const n = votosVisiveis(c.id);
                return (
                  <li key={c.id} className={pronto && c.id === rev.acusadoId ? "acusado" : ""}>
                    <span className="imp-placar-nome">{quem(estado, c.id).nickname}</span>
                    <span className="imp-placar-trilho">
                      <motion.span initial={false} animate={{ width: `${(n / maxVotos) * 100}%` }} transition={{ type: "spring", stiffness: 300, damping: 22 }} />
                    </span>
                    <b>{n}</b>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}

        {pronto && estado.fase === "ULTIMA_CHANCE" && (
          <UltimaChance estado={estado} tempo={tempo} pedir={pedir} souImpostor={souImpostor} impostorId={impostorId} />
        )}
        {pronto && estado.fase === "REVELACAO" && rev.descoberto && (
          <p className="imp-sub imp-centro">
            {modoDe(estado) === "pergunta" ? "No modo Pergunta não tem última chance. Contando os pontos…" : "Preparando a última chance…"}
          </p>
        )}

        {pronto && fim && (
          <Resultado estado={estado} rev={rev} fim={fim} souImpostor={souImpostor} tempo={tempo} pedir={pedir} aoSair={aoSair} aoVerRanking={aoVerRanking} />
        )}
      </section>
    </div>
  );
}

function Acusado({ estado, rev, etapa }) {
  const impostor = quem(estado, rev.impostorId);
  if (etapa < SUSPENSE) return <div className="imp-acusado-espaco" />;
  if (etapa === SUSPENSE) {
    return (
      <div className="imp-acusado-espaco">
        <motion.span className="imp-suspense" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }}>
          E o mais votado é…
        </motion.span>
      </div>
    );
  }

  if (rev.empate) {
    return (
      <div className="imp-acusado">
        <motion.p className="imp-acusado-nome" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>EMPATE</motion.p>
        {etapa >= VEREDITO && (
          <motion.div initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 16 }}>
            <p className="imp-acusado-veredito inocente">NINGUÉM FOI ELIMINADO</p>
            <p className="imp-sub">O impostor era <b>{impostor.nickname}</b> — e escapou.</p>
          </motion.div>
        )}
      </div>
    );
  }

  const a = quem(estado, rev.acusadoId);
  return (
    <div className={`imp-acusado ${rev.descoberto ? "culpado" : "inocente"}`}>
      <motion.div
        className="imp-acusado-avatar"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
      >
        {/* Acusado de corpo inteiro (o avatar dele); bot ou sem perfil: a
            bolinha grande de antes. */}
        <BonecoDoJogador
          userId={rev.acusadoId}
          altura={230}
          semFundo
          className="imp-acusado-boneco"
          reserva={<AvatarImp id={rev.acusadoId} nome={a.nickname} cor={a.cor} tamanho={200} className="imp-anel" />}
        />
      </motion.div>
      {etapa >= VEREDITO && (
        <motion.div
          className="imp-acusado-textos"
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 15 }}
        >
          <p className="imp-acusado-nome">{a.nickname}</p>
          <p className={`imp-acusado-veredito ${rev.descoberto ? "culpado" : "inocente"}`}>{rev.descoberto ? "ERA O IMPOSTOR" : "ERA INOCENTE"}</p>
          {!rev.descoberto && <p className="imp-sub">O impostor era <b>{impostor.nickname}</b>.</p>}
        </motion.div>
      )}
    </div>
  );
}

// O segredo, no fim (só o que o servidor mandou em `resultado`). Na
// Pergunta vão as duas perguntas — e o que o impostor respondeu.
function Segredo({ estado, fim }) {
  const modo = fim.modo || modoDe(estado);
  const doImpostor = modo === "pergunta" ? (estado.respostas || []).find((r) => r.jogadorId === fim.impostorId) : null;
  return (
    <motion.div className={`imp-segredo ${modo}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <p className="imp-palavra-era">{SEGREDO_ERA[modo] || SEGREDO_ERA.palavra} <b>{fim.palavra}</b></p>
      {modo === "pergunta" && fim.perguntaImpostor && (
        <p className="imp-palavra-era impostor">
          A pergunta do impostor era: <b>{fim.perguntaImpostor}</b>
          {doImpostor && <span className="imp-segredo-resposta">Resposta do impostor: <i className={doImpostor.texto ? "" : "imp-branco"}>{doImpostor.texto ? `“${doImpostor.texto}”` : "(em branco)"}</i></span>}
        </p>
      )}
    </motion.div>
  );
}

// Situação e História: a última chance é múltipla escolha (6 opções que o
// servidor manda pra todos). Palavra: o chute é digitado.
const PERGUNTA_CHUTE = {
  situacao: "Onde vocês estavam?",
  historia: "Qual era o tema da história?",
};

function UltimaChance({ estado, tempo, pedir, souImpostor, impostorId }) {
  const [chute, setChute] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [escolhida, setEscolhida] = useState(null);
  const nome = quem(estado, impostorId).nickname;
  const opcoes = estado.opcoes;
  async function enviar(e) {
    e.preventDefault();
    if (!chute.trim() || enviando) return;
    setEnviando(true);
    await pedir("impostor-chute", { palavra: chute.trim() });
    setEnviando(false);
  }
  async function escolher(i) {
    if (enviando || escolhida != null) return;
    setEscolhida(i);
    setEnviando(true);
    const r = await pedir("impostor-chute", { opcao: i });
    setEnviando(false);
    if (!r.ok) setEscolhida(null);
  }
  if (opcoes?.length) {
    const pergunta = PERGUNTA_CHUTE[modoDe(estado)] || "Qual era o segredo?";
    return (
      <motion.div className="imp-ultima opcoes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="imp-ultima-topo">
          <Cronometro tempo={tempo} variante="anel" />
          {souImpostor ? (
            <p><b>Última chance:</b> {pergunta} Você só tem uma tentativa.</p>
          ) : (
            <p><b>Última chance:</b> {nome} está tentando adivinhar… Se acertar, rouba a vitória.</p>
          )}
        </div>
        <ul className="imp-opcoes" role={souImpostor ? "radiogroup" : undefined} aria-label={pergunta}>
          {opcoes.map((o, i) => (
            <motion.li
              key={o}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
            >
              <button
                type="button"
                role={souImpostor ? "radio" : undefined}
                aria-checked={souImpostor ? escolhida === i : undefined}
                className={`imp-opcao ${escolhida === i ? "escolhida" : ""}`}
                disabled={!souImpostor || escolhida != null}
                onClick={() => escolher(i)}
              >
                {o}
              </button>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    );
  }
  return (
    <motion.div className="imp-ultima" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Cronometro tempo={tempo} variante="anel" />
      {souImpostor ? (
        <form className="imp-ultima-form" onSubmit={enviar}>
          <label htmlFor="imp-chute"><b>Última chance:</b> qual é a palavra? Você só tem uma tentativa.</label>
          <div className="imp-dica-linha">
            <input id="imp-chute" className="imp-campo" maxLength={40} autoFocus autoComplete="off" value={chute} onChange={(e) => setChute(e.target.value)} placeholder="Digite a palavra" />
            <button className="imp-botao principal compacto" type="submit" disabled={!chute.trim() || enviando}>Chutar</button>
          </div>
        </form>
      ) : (
        <p><b>Última chance:</b> se {nome} adivinhar a palavra, rouba a vitória.</p>
      )}
    </motion.div>
  );
}

// Pontos subindo com contador animado (sem animação: o número direto).
function useContador(valor) {
  const reduzir = useReducedMotion();
  const [n, setN] = useState(reduzir ? valor : 0);
  useEffect(() => {
    if (reduzir) { setN(valor); return undefined; }
    const controle = animate(0, valor, { duration: 1.2, ease: "easeOut", onUpdate: (v) => setN(Math.round(v)) });
    return () => controle.stop();
  }, [valor, reduzir]);
  return n;
}

function frasePessoal(estado, rev, fim, souImpostor) {
  if (souImpostor) {
    if (!rev.descoberto) return "Você não foi descoberto";
    if (!fim.adivinhou) return "Você foi descoberto";
    return fim.modo === "situacao" || fim.modo === "historia" ? "Você acertou na última chance" : "Você adivinhou a palavra";
  }
  if (estado.meuVoto == null) return "Você não votou";
  return estado.meuVoto === rev.impostorId ? "Você acertou o voto" : "Você errou o voto";
}

function Resultado({ estado, rev, fim, souImpostor, tempo, pedir, aoSair, aoVerRanking }) {
  const meus = fim.pontos[estado.euId];
  const contador = useContador(meus ?? 0);
  const lista = Object.entries(fim.pontos).sort((a, b) => b[1] - a[1]);
  // Numa série, o placar somado (com o que cada um ganhou nesta) substitui
  // a lista de pontos da partida.
  const ranking = emSerie(estado) ? estado.serie.ranking : null;
  return (
    <motion.div className="imp-resultado" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <p className="imp-vencedor">{fim.vencedor === "impostor" ? "O IMPOSTOR VENCEU" : "OS TRIPULANTES VENCERAM"}</p>
      {fim.chute != null && (
        <p className="imp-sub imp-centro">
          {quem(estado, fim.impostorId).nickname} {fim.modo === "situacao" || fim.modo === "historia" ? "escolheu" : "chutou"} “{fim.chute}” — {fim.adivinhou ? "acertou!" : "errou."}
        </p>
      )}
      {fim.motivo === "descoberto" && (
        <p className="imp-sub imp-centro">{quem(estado, fim.impostorId).nickname} foi descoberto — no modo Pergunta não tem última chance.</p>
      )}
      {meus != null && (
        <div className="imp-painel imp-meus-pontos">
          <div>
            <b>{frasePessoal(estado, rev, fim, souImpostor)}</b>
            <span>{!estado.valeRanking ? "Fase de testes: não vale ranking" : meus > 0 ? "Conta para o ranking mensal" : "Sem pontos desta vez"}</span>
          </div>
          <span className="imp-pontos-numero">+{contador} PTS</span>
        </div>
      )}
      {ranking ? (
        <PlacarSerie estado={estado} ranking={ranking} impostorId={fim.impostorId} />
      ) : (
        <ul className={`imp-pontos-lista ${lista.length > 6 ? "muitos" : ""}`}>
          {lista.map(([id, pts]) => (
            <li key={id}>
              <span>{quem(estado, id).nickname}{id === fim.impostorId ? " · impostor" : ""}</span>
              <b>+{pts}</b>
            </li>
          ))}
        </ul>
      )}
      <Acoes estado={estado} tempo={tempo} pedir={pedir} aoSair={aoSair} aoVerRanking={aoVerRanking} />
    </motion.div>
  );
}

// Placar da série no FIM de cada partida: posição, quanto ganhou nesta e o
// total até aqui. Sobe com mola quando a ordem muda (layout).
function PlacarSerie({ estado, ranking, impostorId }) {
  const s = estado.serie;
  const n = s.partida;
  return (
    <section className="imp-painel imp-placar-serie" aria-label="Placar da série">
      <div className="imp-placar-serie-topo">
        <span className="imp-rotulo">PLACAR DA SÉRIE</span>
        <span className="imp-placar-serie-apos">{s.encerrada ? "final" : `após ${n} de ${s.total}`}</span>
      </div>
      <ol className={ranking.length > 8 ? "muitos" : ""}>
        {ranking.map((l, i) => {
          const ganho = l.pontos[n - 1];
          return (
            <motion.li
              key={l.id}
              layout
              className={`${l.id === estado.euId ? "eu" : ""} ${l.posicao <= 3 ? `pos-${l.posicao}` : ""}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, type: "spring", stiffness: 420, damping: 32 }}
            >
              <span className="imp-placar-serie-pos">{l.posicao}<small className="imp-ord">º</small></span>
              <AvatarImp id={l.id} nome={l.nickname} cor={l.cor} tamanho={26} />
              <span className="imp-placar-serie-nome">{l.nickname}</span>
              {l.id === impostorId && <em className="imp-placar-serie-tag">impostor</em>}
              <span className={`imp-placar-serie-ganho ${ganho ? "" : "zero"}`}>{ganho == null ? "—" : `+${ganho}`}</span>
              <b>{l.total}</b>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}

// Botões do FIM. Partida avulsa: "Próxima partida" (volta ao lobby).
// Série no meio: a próxima começa sozinha na contagem (o anfitrião pode
// adiantar). Fim da série: "Ver ranking da série".
function Acoes({ estado, tempo, pedir, aoSair, aoVerRanking }) {
  const anfitriao = estado.anfitriaoId === estado.euId;
  const s = estado.serie;
  const segundos = useSegundos(tempo);
  const seg = segundos > 0 ? segundos : null; // no zero, a próxima já está começando
  const meioDaSerie = emSerie(estado) && !s.encerrada;
  let principal;
  if (aoVerRanking) {
    principal = <button className="imp-botao principal largo" onClick={aoVerRanking}>Ver ranking da série</button>;
  } else if (meioDaSerie) {
    principal = anfitriao ? (
      <button className="imp-botao principal largo" onClick={() => pedir("impostor-proxima")}>
        Próxima partida{seg != null ? ` · ${seg}s` : ""}
      </button>
    ) : (
      <span className="imp-sub imp-aguardando">Partida {s.partida + 1} de {s.total} começa{seg != null ? <> em <b>{seg}s</b></> : " já"}…</span>
    );
  } else {
    principal = anfitriao ? (
      <button className="imp-botao principal largo" onClick={() => pedir("impostor-proxima")}>Próxima partida</button>
    ) : (
      <span className="imp-sub imp-aguardando">Aguardando o anfitrião começar a próxima…</span>
    );
  }
  return (
    <>
      {meioDaSerie && anfitriao && (
        <p className="imp-nota imp-centro imp-proxima-nota">A partida {s.partida + 1} começa sozinha{seg != null ? ` em ${seg}s` : ""}. Mesmo modo, outro impostor.</p>
      )}
      {emSerie(estado) && s.encerrada && s.motivoFim === "poucos_jogadores" && (
        <p className="imp-aviso imp-centro" role="status">A série acabou antes: ficou gente de menos na sala.</p>
      )}
      <div className="imp-acoes">
        <button className="imp-botao secundario" onClick={aoSair}>Sair da sala</button>
        {principal}
      </div>
    </>
  );
}

// Partida cancelada (impostor saiu / gente de menos): sem revelação.
function Cancelada({ estado, fim, tempo, pedir, aoSair, aoVerRanking }) {
  if (!fim) return null;
  const ranking = emSerie(estado) ? estado.serie.ranking : null;
  return (
    <div className="imp-revelacao simples">
      <section className="imp-painel imp-cancelada">
        <span className="imp-rotulo">PARTIDA ENCERRADA</span>
        <p className="imp-vencedor">{MOTIVO_CANCELADA[fim.motivo] || "Partida encerrada."}</p>
        <Segredo estado={estado} fim={fim} />
        {ranking && <PlacarSerie estado={estado} ranking={ranking} impostorId={null} />}
        <Acoes estado={estado} tempo={tempo} pedir={pedir} aoSair={aoSair} aoVerRanking={aoVerRanking} />
      </section>
    </div>
  );
}
