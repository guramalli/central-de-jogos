import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import RankBadge from "../components/RankBadge.jsx";
import Seo from "../components/Seo.jsx";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Ranking() {
  const [game, setGame] = useState("stop"); // stop | quiz — só vale pra mensal/vitalício
  const [tab, setTab] = useState("monthly"); // monthly | lifetime | clans
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const path =
      tab === "monthly"
        ? `/ranking/monthly/${game}`
        : tab === "lifetime"
        ? `/ranking/lifetime/${game}`
        : "/clans/ranking/mensal";
    api.get(path).then(({ data }) => setRows(data));
  }, [tab, game]);

  const isClans = tab === "clans";
  const nameOf = (r) => (isClans ? `[${r.tag}] ${r.name}` : r.nickname);

  return (
    <div>
      <Seo title="Ranking" description="Veja o ranking mensal e vitalício de Stop, Quiz e Acromania." />
      <h1>Ranking</h1>

      {!isClans && (
        <div className="ranking-game-tabs">
          <button className={`btn ${game === "stop" ? "" : "secondary"}`} onClick={() => setGame("stop")}>
            🅾️ Stop
          </button>
          <button className={`btn ${game === "quiz" ? "" : "secondary"}`} onClick={() => setGame("quiz")}>
            ❓ Quiz
          </button>
          <button className={`btn ${game === "acromania" ? "" : "secondary"}`} onClick={() => setGame("acromania")}>
            🔤 Acromania
          </button>
        </div>
      )}

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
              <div className="podium-name">
                {isClans ? nameOf(r) : <Link to={`/jogador/${r.userId}`}>{nameOf(r)}</Link>}
              </div>
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
                <td>{isClans ? nameOf(r) : <Link to={`/jogador/${r.userId}`}>{nameOf(r)}</Link>}</td>
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
