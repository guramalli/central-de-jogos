import ProfileTooltip from "./ProfileTooltip.jsx";
import ClanInviteMenu from "./ClanInviteMenu.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Painel "jogadores" no estilo lista retrô: ícone de patente + nick + pontos,
// linhas em zebra sobre fundo creme. O tooltip com clã/tempo de jogo/pontuação
// detalhada aparece ao passar o mouse; o clique com o botão DIREITO no nick
// abre a opção de convidar pro clã (só funciona de verdade se você for dono
// de um clã — o servidor confere isso).
export default function OnlinePlayers({ players }) {
  const { user } = useAuth();

  return (
    <ul className="sc-players-list">
      {players.map((p, i) => (
        <li key={p.userId} className={i % 2 === 0 ? "sc-row-a" : "sc-row-b"}>
          <span className="sc-player-rank" title={p.rank?.name}>
            {p.rank?.icon && <img src={p.rank.icon} alt={p.rank.name} className="sc-player-rank-icon" />}
          </span>
          <span className="sc-player-name">
            <ClanInviteMenu userId={p.userId} nickname={p.nickname} currentUserId={user?.id}>
              <ProfileTooltip userId={p.userId} nickname={p.nickname} />
            </ClanInviteMenu>
          </span>
          <span className="sc-player-points">{p.lifetimePoints}</span>
        </li>
      ))}
      {players.length === 0 && <li className="sc-empty">Ninguém mais na sala ainda.</li>}
    </ul>
  );
}
