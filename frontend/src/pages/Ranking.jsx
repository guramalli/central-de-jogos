import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import RankBadge from "../components/RankBadge.jsx";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Ranking() {
  const [tab, setTab] = useState("monthly"); // monthly | lifetime | clans
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const path =
      tab === "monthly" ? "/ranking/monthly/stop" : tab === "lifetime" ? "/ranking/lifetime/stop" : "/clans/ranking/mensal";
    api.get(path).then(({ data }) => setRows(data));
  }, [tab]);

  const isClans = tab === "clans";
  const nameOf = (r) => (isClans ? `[${r.tag}] ${r.name}` : r.nickname);

  return (
    <div>
      <h1>Ranking — Stop</h1>
      <div className="ranking-tabs">
        <button className={`btn ${tab === "monthly" ? "" : "secondary"}`} onClick={() => setTab("monthly")}>
          Mensal (premiação)
        </button>
        <button className={`btn ${tab === "lifetime" ? "" : "secondary"}`} onClick={() => setTab("lifetime")}>
          Vitalício (geral)
        </button>
        <button className={`btn ${tab === "clans" ? "" : "secondary"}`} onClick={() => setTab("clans")}>
          Clãs (mensal)
        </button>
      </div>

      {rows.length > 0 && (
        <div className="podium">
          {rows.slice(0, 3).map((r) => (
            <div key={r.position} className={`podium-item podium-${r.position}`}>
              <div className="podium-medal">{MEDALS[r.position - 1]}</div>
              <div className="podium-name">{nameOf(r)}</div>
              <div className="podium-points">{r.points} pts</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <table className="player-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{isClans ? "Clã" : "Jogador"}</th>
              <th>Pontos</th>
              {tab === "lifetime" && <th>Patente</th>}
              {isClans && <th>Membros</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.position} className={r.position <= 3 ? "row-podium" : ""}>
                <td>{r.position}</td>
                <td>{nameOf(r)}</td>
                <td>{r.points}</td>
                {tab === "lifetime" && (
                  <td>
                    <RankBadge rank={r.rank} />
                  </td>
                )}
                {isClans && <td>{r.memberCount}</td>}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ color: "var(--text-dim)" }}>
                  {isClans ? "Ainda não há clãs com pontuação este mês." : "Ainda não há pontuações registradas."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
