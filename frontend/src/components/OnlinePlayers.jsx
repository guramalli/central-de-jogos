import ProfileTooltip from "./ProfileTooltip.jsx";

// Painel "jogadores" no estilo lista retrô: ícone de patente + nick + pontos,
// linhas em zebra sobre fundo creme. O tooltip com clã/tempo de jogo/pontuação
// detalhada aparece ao passar o mouse sobre o nickname aqui (só aqui).
export default function OnlinePlayers({ players }) {
  return (
    <ul className="sc-players-list">
      {players.map((p, i) => (
        <li key={p.userId} className={i % 2 === 0 ? "sc-row-a" : "sc-row-b"}>
          <span className="sc-player-rank" title={p.rank?.name}>
            {p.rank?.icon && <img src={p.rank.icon} alt={p.rank.name} className="sc-player-rank-icon" />}
          </span>
          <span className="sc-player-name">
            <ProfileTooltip userId={p.userId} nickname={p.nickname} />
          </span>
          <span className="sc-player-points">{p.lifetimePoints}</span>
        </li>
      ))}
      {players.length === 0 && <li className="sc-empty">Ninguém mais na sala ainda.</li>}
    </ul>
  );
}
