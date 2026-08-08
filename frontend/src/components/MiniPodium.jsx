import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

const MEDALS = ["🥇", "🥈", "🥉"];

// Prévia compacta do top 3 do ranking mensal de um jogo, com link pro
// ranking completo — usado nas lobbies do Stop e do Quiz.
export default function MiniPodium({ gameKey }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api
      .get(`/ranking/monthly/${gameKey}`)
      .then(({ data }) => setRows(data.slice(0, 3)))
      .catch(() => setRows([]));
  }, [gameKey]);

  return (
    <div className="glossy-panel mini-podium">
      <div className="mini-podium-header">
        <span>🏆 Top 3 do mês</span>
        <Link to={`/ranking?game=${gameKey}`} className="mini-podium-link">
          Ver ranking completo <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>
      {rows === null && <p className="mini-podium-empty">Carregando...</p>}
      {rows && rows.length === 0 && <p className="mini-podium-empty">Ninguém pontuou este mês ainda.</p>}
      {rows && rows.length > 0 && (
        <ul className="mini-podium-list">
          {rows.map((r) => (
            <li key={r.position}>
              <span className="mini-podium-medal">{MEDALS[r.position - 1]}</span>
              <Link to={`/jogador/${r.userId}`} className="mini-podium-name">{r.nickname}</Link>
              <span className="mini-podium-points">{r.points} pts</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
