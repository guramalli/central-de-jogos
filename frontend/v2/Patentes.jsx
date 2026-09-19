import { useEffect, useState } from "react";
import { api } from "./api.js";
import Topo from "./Topo.jsx";
import Rodape from "./Rodape.jsx";
import { buscarPerfil, dadosDoJogo } from "./perfil.js";

// Patentes dos três jogos (Quiz, Stop e Acromania).
export default function Patentes({ usuario, jogoInicial }) {
  const [jogo, setJogo] = useState(["stop", "acromania"].includes(jogoInicial) ? jogoInicial : "quiz");
  const [patentes, setPatentes] = useState(null);
  const [meus, setMeus] = useState(null);

  useEffect(() => {
    setPatentes(null);
    api.get(jogo === "stop" ? "/ranks" : jogo === "acromania" ? "/acromania-ranks" : "/quiz-ranks").then(({ data }) => setPatentes([...data].sort((a, b) => b.min - a.min))).catch(() => setPatentes([]));
    buscarPerfil(usuario.id, 20000).then((p) => setMeus(dadosDoJogo(p, jogo).mensal));
  }, [usuario.id, jogo]);

  const pontos = meus?.points || 0;
  const atual = meus?.rank?.name;

  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo={null} />
      <main className="v2-pagina">
        <div className="v2-pagina-cabeca"><h1>Patentes</h1></div>
        <div className="v2-segmentado" role="group" aria-label="Jogo">
          <button className={jogo === "quiz" ? "ativo" : ""} onClick={() => setJogo("quiz")}>Quiz</button>
          <button className={jogo === "stop" ? "ativo" : ""} onClick={() => setJogo("stop")}>Stop</button>
          <button className={jogo === "acromania" ? "ativo" : ""} onClick={() => setJogo("acromania")}>Acromania</button>
        </div>
        <p className="v2-pagina-nota">Sua patente é calculada pelos pontos <b>do mês</b> no {jogo === "stop" ? "Stop" : jogo === "acromania" ? "Acromania" : "Quiz"} — todo dia 1º ela recomeça do zero.</p>

        {meus && (
          <section className="v2-cartao v2-patente-atual">
            {meus.rank?.icon && <img src={meus.rank.icon} alt="" className={meus.rank.brilha ? "brilha" : ""} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
            <div>
              <span>Sua patente agora</span>
              <b>{meus.rank?.name || "—"}</b>
              <em>{pontos.toLocaleString("pt-BR")} pts no mês{meus.nextRank ? ` · faltam ${meus.nextRank.pointsNeeded.toLocaleString("pt-BR")} pra ${meus.nextRank.name}` : " · patente máxima!"}</em>
            </div>
          </section>
        )}

        {patentes === null && <div className="v2-carregando">Carregando…</div>}
        <div className="v2-patentes">
          {(patentes || []).map((r) => {
            const conquistada = pontos >= r.min;
            const minha = r.name === atual;
            return (
              <div key={r.key} className={`v2-patente ${conquistada ? "conquistada" : ""} ${minha ? "minha" : ""}`}>
                <img src={r.icon} alt="" className={r.brilha ? "brilha" : ""} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
                <div className="v2-patente-texto">
                  <b>{r.name}{minha && <span className="v2-tag-voce">você</span>}{r.exclusiva && <span className="v2-tag-exclusiva">só 1 jogador</span>}</b>
                  <span>{r.min.toLocaleString("pt-BR")} pts no mês</span>
                  {r.exclusiva && <small>Fica com quem estiver em 1º no ranking do mês e tiver batido os pontos mínimos. Todo mês a disputa recomeça.</small>}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Rodape />
    </div>
  );
}
