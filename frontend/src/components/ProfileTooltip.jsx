import { useState } from "react";
import { api } from "../api/client.js";

function formatMemberSince(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const formatted = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export default function ProfileTooltip({ userId, nickname, rankIcon, gameKey = "stop" }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadProfile() {
    if (profile || loading) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/users/${userId}/profile`);
      setProfile(data);
    } catch {
      // silencioso: tooltip só não mostra dados se falhar
    } finally {
      setLoading(false);
    }
  }

  const monthly = profile?.monthly.find((m) => m.gameKey === gameKey);
  const lifetime = profile?.lifetime.find((l) => l.gameKey === gameKey);

  return (
    <span className="nick-hover" onMouseEnter={loadProfile}>
      {rankIcon && <span style={{ marginRight: 4 }}>{rankIcon}</span>}
      {nickname}
      <div className="nick-tooltip">
        {!profile && <div>Carregando...</div>}
        {profile && (
          <>
            <div>⏱ {profile.playtimeMinutes} min de jogo</div>
            <div>📅 Desde {formatMemberSince(profile.memberSince)}</div>
            <div>Mensal: <strong>{monthly ? `${monthly.points} pts` : "0 pts"}</strong></div>
            <div>Vitalícia: <strong>{lifetime ? lifetime.points : 0} pts</strong></div>
            <div style={{ opacity: 0.75 }}>
              {lifetime?.nextRank ? `Faltam ${lifetime.nextRank.pointsNeeded} pra ${lifetime.nextRank.name}` : "Patente máxima!"}
            </div>
            <div>🚩 {profile.clan ? `${profile.clan.name} [${profile.clan.tag}]` : "Sem clã"}</div>
          </>
        )}
      </div>
    </span>
  );
}
