export default function RankBadge({ rank }) {
  if (!rank) return null;
  // A patente máxima recebe brilho animado (o backend manda brilha: true).
  // É o único lugar do site com animação nesse ícone — justamente pra que
  // encontrar alguém com ela numa sala seja um acontecimento.
  const classe = `rank-badge-icon${rank.brilha ? " rank-badge-icon-brilha" : ""}`;
  return (
    <span className="rank-badge" title={rank.name}>
      <img src={rank.icon} alt={rank.name} className={classe} />
      <span>{rank.name}</span>
    </span>
  );
}
