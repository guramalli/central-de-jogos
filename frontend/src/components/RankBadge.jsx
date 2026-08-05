export default function RankBadge({ rank }) {
  if (!rank) return null;
  return (
    <span className="rank-badge" title={rank.name}>
      <img src={rank.icon} alt={rank.name} className="rank-badge-icon" />
      <span>{rank.name}</span>
    </span>
  );
}
