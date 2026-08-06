import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api/client.js";

function formatMemberSince(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const formatted = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// Renderiza o conteúdo do hover num portal, direto no <body> — assim ele
// nunca fica "cortado" por containers com rolagem (tipo a lista de
// jogadores online), que sempre recortam qualquer coisa que vaze pra fora
// deles, mesmo elementos posicionados por cima.
export default function ProfileTooltip({ userId, nickname, rankIcon, gameKey = "stop" }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const anchorRef = useRef(null);

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

  function handleEnter() {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) {
      setCoords({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
    }
    setVisible(true);
    loadProfile();
  }

  const monthly = profile?.monthly.find((m) => m.gameKey === gameKey);
  const lifetime = profile?.lifetime.find((l) => l.gameKey === gameKey);

  return (
    <span
      className="nick-hover"
      ref={anchorRef}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setVisible(false)}
    >
      {rankIcon && <span style={{ marginRight: 4 }}>{rankIcon}</span>}
      {nickname}
      {visible &&
        createPortal(
          <div className="nick-tooltip-portal" style={{ top: coords.top, left: coords.left }}>
            {!profile && <div>Carregando...</div>}
            {profile && (
              <>
                <div>⏱ {profile.playtimeMinutes} min de jogo</div>
                <div>📅 Desde {formatMemberSince(profile.memberSince)}</div>
                <div>Mensal: <strong>{monthly ? `${monthly.points} pts` : "0 pts"}</strong></div>
                <div>Vitalícia: <strong>{lifetime ? lifetime.points : 0} pts</strong></div>
                <div style={{ opacity: 0.75 }}>
                  {lifetime?.nextRank
                    ? `Faltam ${lifetime.nextRank.pointsNeeded} pra ${lifetime.nextRank.name}`
                    : "Patente máxima!"}
                </div>
                <div>🚩 {profile.clan ? `${profile.clan.name} [${profile.clan.tag}]` : "Sem clã"}</div>
              </>
            )}
          </div>,
          document.body
        )}
    </span>
  );
}
