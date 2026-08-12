import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Seo from "../components/Seo.jsx";

function formatPoints(n) {
  return n.toLocaleString("pt-BR");
}

export default function RanksInfo() {
  const [ranks, setRanks] = useState([]);

  useEffect(() => {
    api.get("/ranks").then(({ data }) => setRanks(data));
  }, []);

  return (
    <div>
      <Seo title="Patentes do Stop" description="Veja todas as patentes do Stop e quanto falta pra você subir de nível." />
      <h1>Patentes Stop</h1>
      <p style={{ color: "var(--text-dim)" }}>
        Sua patente é calculada pela pontuação vitalícia acumulada em cada jogo — quanto mais você
        joga, mais sobe. Confira quanto falta pra próxima:
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
                <td><img src={r.icon} alt={r.name} className={`ranks-info-icon${r.brilha ? " rank-badge-icon-brilha" : ""}`} /></td>
                <td>
                  {r.name}
                  {/* Só uma pessoa por vez ostenta a patente máxima: quem tem
                      mais pontos vitalícios no jogo. */}
                  {r.exclusiva && <span className="rank-exclusiva-tag">só 1 jogador</span>}
                </td>
                <td>{formatPoints(r.min)} pts</td>
              </tr>
            ))}
            {ranks.length === 0 && (
              <tr>
                <td colSpan={3} style={{ color: "var(--text-dim)" }}>Carregando...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
