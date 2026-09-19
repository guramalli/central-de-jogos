import { useEffect, useState } from "react";
import { api } from "./api.js";
import Topo from "./Topo.jsx";
import { buscarPerfil, dadosDoJogo } from "./perfil.js";

// Por enquanto só as do Quiz — é o único jogo da v2. As do Stop e do
// Acromania continuam no clássico (links no fim).
export default function Patentes({ usuario }) {
  const [patentes, setPatentes] = useState(null);
  const [meus, setMeus] = useState(null);

  useEffect(() => {
    api.get("/quiz-ranks").then(({ data }) => setPatentes([...data].reverse())).catch(() => setPatentes([]));
    buscarPerfil(usuario.id, 20000).then((p) => setMeus(dadosDoJogo(p, "quiz").mensal));
  }, [usuario.id]);

  const pontos = meus?.points || 0;
  const atual = meus?.rank?.name;

  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo="patentes" />
      <main className="v2-pagina">
        <div className="v2-pagina-cabeca"><h1>Patentes do Quiz</h1></div>
        <p className="v2-pagina-nota">Sua patente é calculada pelos pontos <b>do mês</b> no Quiz — todo dia 1º ela recomeça do zero.</p>

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
        <p className="v2-pagina-nota">Patentes dos outros jogos: <a className="v2-link" href="/patentes">Stop</a> · <a className="v2-link" href="/patentes-acromania">Acromania</a></p>
      </main>
    </div>
  );
}
