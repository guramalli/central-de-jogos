import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";
import { AvatarImp, Cronometro, quem } from "./comum.jsx";
import { tocar } from "./sons.js";

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

// REVELACAO, ULTIMA_CHANCE e FIM (fica montado nas três: a sequência roda
// uma vez só, no começo da revelação).
export default function Revelacao({ estado, carta, tempo, pedir, aoSair }) {
  const rev = estado.revelacao;
  const fim = estado.fase === "FIM" ? estado.resultado : null;
  if (!rev) return <Cancelada estado={estado} fim={fim} pedir={pedir} aoSair={aoSair} />;
  return <Sequencia estado={estado} rev={rev} fim={fim} carta={carta} tempo={tempo} pedir={pedir} aoSair={aoSair} />;
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

function Sequencia({ estado, rev, fim, carta, tempo, pedir, aoSair }) {
  const ordem = useMemo(() => ordemDosVotos(rev.contagem), [rev]);
  const { etapa, mostrados } = useSequencia(estado, tempo, ordem.length);
  const impostorId = rev.impostorId;
  const souImpostor = impostorId === estado.euId || carta?.papel === "impostor";
  const pronto = etapa >= VEREDITO;

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
        <Acusado estado={estado} rev={rev} etapa={etapa} />
        {fim && pronto && (
          <motion.p className="imp-palavra-era" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            A palavra era <b>{fim.palavra}</b>
          </motion.p>
        )}
      </section>

      <section className="imp-revelacao-lado">
        {etapa >= VOTOS && (
          <motion.div className="imp-painel imp-placar" aria-label="Votos" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="imp-rotulo">VOTOS</h2>
            <ul>
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
          <p className="imp-sub imp-centro">Preparando a última chance…</p>
        )}

        {pronto && fim && (
          <Resultado estado={estado} rev={rev} fim={fim} souImpostor={souImpostor} pedir={pedir} aoSair={aoSair} />
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
        <AvatarImp nome={a.nickname} cor={a.cor} tamanho={200} className="imp-anel" />
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

function UltimaChance({ estado, tempo, pedir, souImpostor, impostorId }) {
  const [chute, setChute] = useState("");
  const [enviando, setEnviando] = useState(false);
  const nome = quem(estado, impostorId).nickname;
  async function enviar(e) {
    e.preventDefault();
    if (!chute.trim() || enviando) return;
    setEnviando(true);
    await pedir("impostor-chute", { palavra: chute.trim() });
    setEnviando(false);
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
    return fim.adivinhou ? "Você adivinhou a palavra" : "Você foi descoberto";
  }
  if (estado.meuVoto == null) return "Você não votou";
  return estado.meuVoto === rev.impostorId ? "Você acertou o voto" : "Você errou o voto";
}

function Resultado({ estado, rev, fim, souImpostor, pedir, aoSair }) {
  const meus = fim.pontos[estado.euId];
  const contador = useContador(meus ?? 0);
  const lista = Object.entries(fim.pontos).sort((a, b) => b[1] - a[1]);
  const anfitriao = estado.anfitriaoId === estado.euId;
  return (
    <motion.div className="imp-resultado" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <p className="imp-vencedor">{fim.vencedor === "impostor" ? "O IMPOSTOR VENCEU" : "OS TRIPULANTES VENCERAM"}</p>
      {fim.chute != null && (
        <p className="imp-sub imp-centro">
          {quem(estado, fim.impostorId).nickname} chutou “{fim.chute}” — {fim.adivinhou ? "acertou!" : "errou."}
        </p>
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
      <ul className="imp-pontos-lista">
        {lista.map(([id, pts]) => (
          <li key={id}>
            <span>{quem(estado, id).nickname}{id === fim.impostorId ? " · impostor" : ""}</span>
            <b>+{pts}</b>
          </li>
        ))}
      </ul>
      <Acoes anfitriao={anfitriao} pedir={pedir} aoSair={aoSair} />
    </motion.div>
  );
}

function Acoes({ anfitriao, pedir, aoSair }) {
  return (
    <div className="imp-acoes">
      <button className="imp-botao secundario" onClick={aoSair}>Sair da sala</button>
      {anfitriao ? (
        <button className="imp-botao principal largo" onClick={() => pedir("impostor-proxima")}>Próxima partida</button>
      ) : (
        <span className="imp-sub imp-aguardando">Aguardando o anfitrião começar a próxima…</span>
      )}
    </div>
  );
}

// Partida cancelada (impostor saiu / gente de menos): sem revelação.
function Cancelada({ estado, fim, pedir, aoSair }) {
  if (!fim) return null;
  return (
    <div className="imp-revelacao simples">
      <section className="imp-painel imp-cancelada">
        <span className="imp-rotulo">PARTIDA ENCERRADA</span>
        <p className="imp-vencedor">{MOTIVO_CANCELADA[fim.motivo] || "Partida encerrada."}</p>
        <p className="imp-palavra-era">A palavra era <b>{fim.palavra}</b></p>
        <Acoes anfitriao={estado.anfitriaoId === estado.euId} pedir={pedir} aoSair={aoSair} />
      </section>
    </div>
  );
}
