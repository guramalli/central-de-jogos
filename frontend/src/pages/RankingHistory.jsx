import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import RankBadge from "../components/RankBadge.jsx";
import Seo from "../components/Seo.jsx";

const GAME_NAMES = { stop: "Stop", quiz: "Quiz", acromania: "Acromania" };

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

  const [stats, setStats] = useState(null);

  useEffect(() => {
    let vivo = true;
    api
      .get("/ranking/hall-stats")
      .then(({ data }) => vivo && setStats(data))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <div>
      <Seo title="Histórico" description="Confira os campeões dos meses anteriores na Educação Gamer." />
      <Link to="/ranking" className="btn secondary ranks-voltar">
        ← Voltar pro ranking
      </Link>
      <h1>🏛️ Hall da Fama</h1>
      <p style={{ color: "var(--text-dim)" }}>Os campeões de cada mês já encerrado, mês a mês.</p>

      {/* Números do hall: sem eles a página era só uma lista de meses. Quem
          mais venceu e qual o recorde é o que dá peso a "hall da fama". */}
      {stats && stats.totalTitulos > 0 && (
        <>
          <div className="hall-numeros">
            <div className="hall-numero">
              <strong>{stats.mesesFechados}</strong>
              <small>{stats.mesesFechados === 1 ? "mês encerrado" : "meses encerrados"}</small>
            </div>
            <div className="hall-numero">
              <strong>{stats.totalTitulos}</strong>
              <small>{stats.totalTitulos === 1 ? "título entregue" : "títulos entregues"}</small>
            </div>
            <div className="hall-numero">
              <strong>{stats.maisTitulos.length}</strong>
              <small>{stats.maisTitulos.length === 1 ? "campeão diferente" : "campeões diferentes"}</small>
            </div>
          </div>

          <div className="hall-blocos">
            <div className="card">
              <h2>👑 Quem mais venceu</h2>
              {stats.maisTitulos.map((j, i) => (
                <div key={j.userId} className="hall-linha">
                  <span className="hall-pos">{i + 1}º</span>
                  <Link to={`/jogador/${j.userId}`} className="hall-nick">{j.nickname}</Link>
                  <span className="hall-valor">
                    {j.titulos} {j.titulos === 1 ? "título" : "títulos"}
                  </span>
                </div>
              ))}
            </div>

            <div className="card">
              <h2>🔥 Recordes de pontuação</h2>
              {Object.entries(stats.recordes).map(([jogo, r]) => (
                <div key={jogo} className="hall-linha">
                  <span className="hall-pos">{GAME_NAMES[jogo] || jogo}</span>
                  <Link to={`/jogador/${r.userId}`} className="hall-nick">{r.nickname}</Link>
                  <span className="hall-valor">
                    {r.points.toLocaleString("pt-BR")}
                    <small> · {r.label}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

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
