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
            <div><strong>Tempo de jogo:</strong> {profile.playtimeMinutes} min</div>
            <div><strong>Membro desde:</strong> {formatMemberSince(profile.memberSince)}</div>

            <div style={{ marginTop: 6 }}>
              <strong>Pontuação mensal ({gameKey}):</strong> {monthly ? `${monthly.points} pts` : "0 pts"}
            </div>

            <div style={{ marginTop: 6 }}>
              <strong>Pontuação vitalícia ({gameKey}):</strong> {lifetime ? lifetime.points : 0} pts
            </div>
            {lifetime?.nextRank ? (
              <div style={{ opacity: 0.75 }}>Faltam {lifetime.nextRank.pointsNeeded} pra {lifetime.nextRank.name}</div>
            ) : (
              <div style={{ opacity: 0.75 }}>Patente máxima!</div>
            )}

            <div style={{ marginTop: 6 }}>
              <strong>Clã:</strong> {profile.clan ? `${profile.clan.name} [${profile.clan.tag}]` : "—"}
            </div>
          </>
        )}
      </div>
    </span>
  );
}
