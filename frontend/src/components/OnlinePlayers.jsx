import ProfileTooltip from "./ProfileTooltip.jsx";
import ClanInviteMenu from "./ClanInviteMenu.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Painel "jogadores" no estilo lista retrô: ícone de patente + nick + pontos
// DA SALA, linhas em zebra sobre fundo creme. O tooltip com clã/tempo de
// jogo/pontuação geral aparece ao passar o mouse; o clique com o botão
// DIREITO no nick abre a opção de convidar pro clã (só funciona de verdade
// se você for dono de um clã — o servidor confere isso).
export default function OnlinePlayers({ players }) {
  const { user } = useAuth();

  return (
    <ul className="sc-players-list">
      {players.map((p, i) => (
        <li key={p.userId} className={i % 2 === 0 ? "sc-row-a" : "sc-row-b"}>
          <span className="sc-player-rank" title={p.rank?.name}>
            {p.rank?.icon && (
              <img
                src={p.rank.icon}
                alt={p.rank.name}
                /* Patente máxima brilha aqui também: é na lista da sala que
                   as pessoas mais se comparam. */
                className={`sc-player-rank-icon${p.rank.brilha ? " rank-badge-icon-brilha" : ""}`}
              />
            )}
          </span>
          <span className="sc-player-name">
            <ClanInviteMenu userId={p.userId} nickname={p.nickname} currentUserId={user?.id}>
              <ProfileTooltip userId={p.userId} nickname={p.nickname} gameKey="stop" />
            </ClanInviteMenu>
          </span>
          {/* Pontuação DA SALA no MÊS corrente — não o acumulado de sempre.
              Quem está jogando quer comparar o desempenho ali, com quem está
              do lado, na mesma disputa mensal que vale o ranking. O total
              geral aparece no hover do perfil e no ranking. */}
          <span className="sc-player-points" title="Pontos nesta sala neste mês">
            {p.semPontuacao ? p.blockPoints ?? 0 : p.roomMonthlyPoints ?? 0}
          </span>
        </li>
      ))}
      {players.length === 0 && <li className="sc-empty">Ninguém mais na sala ainda.</li>}
    </ul>
  );
}
