import { useState } from "react";
import { api } from "../api/client.js";

function formatMemberSince(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const formatted = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export default function ProfileTooltip({ userId, nickname, rankIcon }) {
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

            <div style={{ marginTop: 6 }}><strong>Pontuação mensal:</strong></div>
            {profile.monthly.length === 0 && <div>—</div>}
            {profile.monthly.map((m) => (
              <div key={m.gameKey}>{m.gameKey}: {m.points} pts</div>
            ))}

            <div style={{ marginTop: 6 }}><strong>Pontuação vitalícia:</strong></div>
            {profile.lifetime.length === 0 && <div>—</div>}
            {profile.lifetime.map((l) => (
              <div key={l.gameKey}>{l.gameKey}: {l.points} pts</div>
            ))}

            <div style={{ marginTop: 6 }}>
              <strong>Clã:</strong> {profile.clan ? `${profile.clan.name} [${profile.clan.tag}]` : "—"}
            </div>
          </>
        )}
      </div>
    </span>
  );
}
