import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import RankBadge from "../components/RankBadge.jsx";
import Seo from "../components/Seo.jsx";

const MEDALS = ["🥇", "🥈", "🥉"];
const GAMES = [
  { key: "stop", label: "🅾️ Stop" },
  { key: "quiz", label: "❓ Quiz" },
  { key: "acromania", label: "🔤 Acromania" },
];

// Histórico ("Hall da Fama") de meses já encerrados — não precisa de
// nenhum processo especial de "arquivar" quando o mês vira: os dados de
// pontuação mensal nunca são apagados, então essa página só consulta
// meses passados diretamente, sempre disponível pra qualquer mês concluído.
export default function RankingHistory() {
  const [months, setMonths] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [game, setGame] = useState("stop");
  const [winners, setWinners] = useState(null);

  useEffect(() => {
    api.get("/ranking/history").then(({ data }) => {
      setMonths(data);
      if (data.length > 0) setSelectedMonth(data[0].monthKey);
    });
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    setWinners(null);
    api
      .get(`/ranking/history/${selectedMonth}/${game}`)
      .then(({ data }) => setWinners(data))
      .catch(() => setWinners({ winners: [] }));
  }, [selectedMonth, game]);

  return (
    <div>
      <Seo title="Histórico" description="Confira os campeões dos meses anteriores na Educação Gamer." />
      <h1>🏛️ Hall da Fama</h1>
      <p style={{ color: "var(--text-dim)" }}>Os campeões de cada mês já encerrado, mês a mês.</p>

      {months === null && <p style={{ color: "var(--text-dim)" }}>Carregando...</p>}
      {months && months.length === 0 && (
        <p style={{ color: "var(--text-dim)" }}>
          Ainda não temos nenhum mês encerrado pra mostrar aqui — volta depois que o mês virar!
        </p>
      )}

      {months && months.length > 0 && (
        <>
          <div className="ranking-game-tabs">
            {months.map((m) => (
              <button
                key={m.monthKey}
                className={`btn ${selectedMonth === m.monthKey ? "" : "secondary"}`}
                onClick={() => setSelectedMonth(m.monthKey)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="ranking-tabs">
            {GAMES.map((g) => (
              <button
                key={g.key}
                className={`btn ${game === g.key ? "" : "secondary"}`}
                onClick={() => setGame(g.key)}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="card">
            <h2>{winners?.label || ""}</h2>
            {winners === null && <p style={{ color: "var(--text-dim)" }}>Carregando...</p>}
            {winners && winners.winners.length === 0 && (
              <p style={{ color: "var(--text-dim)" }}>Ninguém pontuou nesse jogo naquele mês.</p>
            )}
            {winners && winners.winners.length > 0 && (
              <table className="player-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Jogador</th>
                    <th>Pontos</th>
                    <th>Patente daquele mês</th>
                  </tr>
                </thead>
                <tbody>
                  {winners.winners.map((w) => (
                    <tr key={w.position} className={w.position <= 3 ? "row-podium" : ""}>
                      <td>{w.position <= 3 ? MEDALS[w.position - 1] : w.position}</td>
                      <td><Link to={`/jogador/${w.userId}`}>{w.nickname}</Link></td>
                      <td>{w.points}</td>
                      <td><RankBadge rank={w.rank} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
