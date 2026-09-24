import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { AvatarImp, CURVA, NOME_MODO, modoDe, useSegundos } from "./comum.jsx";
import { tocar } from "./sons.js";
import Agente from "./Agente.jsx";

// RANKING DA SÉRIE — o FIM da última partida (ou da série que acabou antes).
// Pódio dos 3 primeiros (2º, 1º, 3º, com o 1º no alto), o mascote comemorando
// e a lista completa: total, pontos de cada partida e quantas vezes cada um
// foi impostor / foi pego. Só mostra o que o servidor mandou em
// `estado.serie.ranking` (que só existe no FIM).
//
// Anfitrião: "Jogar outra série" (volta ao lobby com todo mundo). Sem clique,
// a sala volta sozinha no fim do tempo (o relógio do FIM).

const MEDALHA = { 1: "ouro", 2: "prata", 3: "bronze" };

// "P1 +300 · P2 +0 · P3 —" — um chip por partida (— = não jogou).
export function ChipsPartidas({ pontos }) {
  return (
    <span className="imp-ranking-chips">
      {pontos.map((p, i) => (
        <span key={i} className={`imp-ranking-chip ${p == null ? "fora" : p > 0 ? "ganhou" : ""}`}>
          P{i + 1} <b>{p == null ? "—" : `+${p}`}</b>
        </span>
      ))}
    </span>
  );
}

function Estatisticas({ linha }) {
  if (!linha.impostor) return null;
  return (
    <span className="imp-ranking-stats">
      impostor {linha.impostor}×{linha.descoberto ? ` · pego ${linha.descoberto}×` : " · nunca pego"}
    </span>
  );
}

// Degraus: 2º à esquerda, 1º no meio (mais alto), 3º à direita.
function Podio({ ranking, euId }) {
  const top = ranking.slice(0, 3);
  const ordem = [top[1], top[0], top[2]].filter(Boolean);
  return (
    <ol className="imp-podio" aria-label="Pódio">
      {ordem.map((l) => {
        const lugar = ranking.indexOf(l) + 1; // altura do degrau (a posição exibida pode repetir no empate)
        const atraso = lugar === 1 ? 0.9 : lugar === 2 ? 0.55 : 0.2;
        const tamanho = lugar === 1 ? 128 : 92;
        return (
          <li key={l.id} className={`imp-podio-lugar lugar-${lugar} ${MEDALHA[l.posicao] || ""} ${l.id === euId ? "eu" : ""}`}>
            <motion.div
              className="imp-podio-pessoa"
              initial={{ opacity: 0, y: 24, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: atraso + 0.35, type: "spring", stiffness: 260, damping: 16 }}
            >
              {lugar === 1 && (
                <motion.svg
                  className="imp-podio-coroa" viewBox="0 0 64 40" aria-hidden="true"
                  initial={{ y: -14, opacity: 0, rotate: -12 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  transition={{ delay: atraso + 0.8, type: "spring", stiffness: 300, damping: 12 }}
                >
                  <path d="M4 36 L8 10 L22 24 L32 4 L42 24 L56 10 L60 36 Z" />
                </motion.svg>
              )}
              <span className="imp-podio-avatar">
                <AvatarImp id={l.id} nome={l.nickname} cor={l.cor} tamanho={tamanho} />
                <span className="imp-podio-medalha">{l.posicao}<small className="imp-ord">º</small></span>
              </span>
              <span className="imp-podio-nome">{l.nickname}{l.id === euId ? " (você)" : ""}</span>
              <span className="imp-podio-pontos"><b>{l.total}</b> pts</span>
            </motion.div>
            <motion.div
              className="imp-podio-degrau"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: atraso, duration: 0.55, ease: CURVA }}
            >
              <span>{l.posicao}</span>
            </motion.div>
          </li>
        );
      })}
    </ol>
  );
}

// Confete leve (CSS): só no pódio, e some com "reduzir movimento".
const CONFETE = Array.from({ length: 18 }, (_, i) => i);

export default function RankingSerie({ estado, tempo, pedir, aoSair, aoVerPartida }) {
  const s = estado.serie;
  const ranking = s.ranking || [];
  const anfitriao = estado.anfitriaoId === estado.euId;
  const seg = useSegundos(tempo);
  const jogadas = ranking[0]?.pontos.length || s.partida;
  const topo = useRef(null);

  // Tela nova: do topo. Som de vitória pra quem ficou em 1º.
  useEffect(() => {
    topo.current?.scrollIntoView?.({ block: "start" });
    if (ranking.some((l) => l.id === estado.euId && l.posicao === 1)) tocar("vitoria");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      ref={topo}
      className="imp-ranking"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: CURVA }}
    >
      <header className="imp-ranking-topo">
        <div className="imp-ranking-titulos">
          <span className="imp-rotulo">
            {s.motivoFim === "poucos_jogadores" ? "SÉRIE ENCERRADA ANTES" : "SÉRIE ENCERRADA"} · {jogadas} {jogadas === 1 ? "PARTIDA" : "PARTIDAS"} · MODO {NOME_MODO[modoDe(estado)].toUpperCase()}
          </span>
          <h1 className="imp-ranking-titulo">RANKING <br className="imp-so-celular" />DA SÉRIE</h1>
          {s.motivoFim === "poucos_jogadores" && <p className="imp-sub">Ficou gente de menos pra seguir — valem as partidas jogadas.</p>}
        </div>
        <Agente humor="festa" className="imp-agente-ranking" />
      </header>

      <section className="imp-podio-palco">
        <div className="imp-confete" aria-hidden="true">
          {CONFETE.map((i) => <i key={i} style={{ "--i": i }} />)}
        </div>
        <Podio ranking={ranking} euId={estado.euId} />
      </section>

      <section className="imp-painel imp-ranking-lista" aria-label="Classificação completa">
        <div className="imp-linha-titulo">
          <h2>Classificação</h2>
          <span className="imp-contagem">{ranking.length} jogadores</span>
        </div>
        <ol>
          {ranking.map((l, i) => (
            <motion.li
              key={l.id}
              className={`${l.id === estado.euId ? "eu" : ""} ${MEDALHA[l.posicao] || ""}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.05, duration: 0.3, ease: CURVA }}
            >
              <span className="imp-ranking-pos">{l.posicao}<small className="imp-ord">º</small></span>
              <AvatarImp id={l.id} nome={l.nickname} cor={l.cor} tamanho={40} />
              <span className="imp-ranking-quem">
                <span className="imp-ranking-nome">
                  {l.nickname}
                  {l.id === estado.euId && <em> (você)</em>}
                  {l.bot && <span className="imp-tag bot">BOT</span>}
                  {!estado.jogadores.some((j) => j.id === l.id) && <span className="imp-tag fora">SAIU</span>}
                </span>
                <span className="imp-ranking-detalhes">
                  <ChipsPartidas pontos={l.pontos} />
                  <Estatisticas linha={l} />
                </span>
              </span>
              <span className="imp-ranking-total"><b>{l.total}</b><small>pts</small></span>
            </motion.li>
          ))}
        </ol>
        {!estado.valeRanking && <p className="imp-nota">Fase de testes: a série não vale pro ranking mensal.</p>}
      </section>

      <div className="imp-acoes imp-ranking-acoes">
        <button className="imp-botao secundario" onClick={aoSair}>Sair da sala</button>
        <button className="imp-botao secundario" onClick={aoVerPartida}>Ver última partida</button>
        {anfitriao ? (
          <button className="imp-botao principal largo" onClick={() => pedir("impostor-proxima")}>Jogar outra série</button>
        ) : (
          <span className="imp-sub imp-aguardando">Aguardando o anfitrião…</span>
        )}
      </div>
      {seg != null && <p className="imp-nota imp-centro">Todos voltam pra sala de espera em {seg}s.</p>}
    </motion.div>
  );
}
