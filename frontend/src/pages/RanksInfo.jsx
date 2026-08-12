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
        Sua patente é calculada pela sua pontuação <strong>do mês</strong> em cada jogo — todo mês ela é
        recalculada do zero. Confira quanto falta pra próxima:
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
                  {/* A patente máxima é de uma pessoa só: quem lidera o
                      ranking do mês E já passou dos pontos mínimos. */}
                  {r.exclusiva && (
                    <>
                      <span className="rank-exclusiva-tag">só 1 jogador</span>
                      <div className="rank-exclusiva-nota">
                        Exclusiva: fica com quem estiver em <strong>1º lugar no ranking do mês</strong> e
                        tiver batido os pontos mínimos. Quem também passar da marca, mas não liderar,
                        fica com a patente logo abaixo. Todo mês a disputa recomeça.
                      </div>
                    </>
                  )}
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
