import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Seo from "../components/Seo.jsx";

function formatPoints(n) {
  return n.toLocaleString("pt-BR");
}

export default function RanksInfoAcromania() {
  const [ranks, setRanks] = useState([]);

  useEffect(() => {
    api.get("/acromania-ranks").then(({ data }) => setRanks(data));
  }, []);

  return (
    <div>
      <Seo
        title="Patentes do Acromania"
        description="Veja todas as patentes do Acromania e quanto falta pra você subir de nível."
      />
      <h1>Patentes Acromania</h1>
      <p style={{ color: "var(--text-dim)" }}>
        Sua patente no Acromania é calculada pela sua pontuação <strong>do mês</strong> nesse jogo —
        todo mês ela é recalculada do zero. Você ganha <strong>15 pontos por cada voto recebido</strong>{" "}
        e mais <strong>50 de bônus</strong> se a sua frase for a mais votada da rodada. Além disso,
        quem <strong>votar na frase vencedora ganha 10 pontos</strong> — então vale prestar atenção no
        que a sala está achando graça, não só na própria frase. Ao fim de cada partida, os três
        primeiros do placar levam <strong>100, 60 e 30</strong> pontos.
      </p>

      <div className="card">
        <table className="player-table">
          <thead>
            <tr>
              <th>Patente</th>
              <th>Nome</th>
              <th>Pontos necessários</th>
            </tr>
          </thead>
          <tbody>
            {[...ranks].reverse().map((r) => (
              <tr key={r.key}>
                <td>
                  <img
                    src={r.icon}
                    alt={r.name}
                    className={`ranks-info-icon${r.brilha ? " rank-badge-icon-brilha" : ""}`}
                  />
                </td>
                <td>{r.name}</td>
                <td>{formatPoints(r.min)} pts</td>
              </tr>
            ))}
            {ranks.length === 0 && (
              <tr>
                <td colSpan={3} style={{ color: "var(--text-dim)" }}>
                  Carregando...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
