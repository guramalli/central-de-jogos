import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

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
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [friendStatus, setFriendStatus] = useState(null); // null | "sending" | "sent" | "error"
  const anchorRef = useRef(null);
  const hideTimerRef = useRef(null);

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

  function showTooltip() {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) {
      setCoords({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
    }
    setVisible(true);
    loadProfile();
  }

  function scheduleHide() {
    // Pequeno atraso pra dar tempo do mouse "viajar" até o tooltip (que fica
    // fora do elemento original, num portal) sem fechar no meio do caminho.
    hideTimerRef.current = setTimeout(() => setVisible(false), 150);
  }

  async function handleAddFriend() {
    setFriendStatus("sending");
    try {
      await api.post("/friends/request", { targetUserId: userId });
      setFriendStatus("sent");
    } catch {
      setFriendStatus("error");
    }
  }

  const monthly = profile?.monthly.find((m) => m.gameKey === gameKey);
  const lifetime = profile?.lifetime.find((l) => l.gameKey === gameKey);
  const isMe = user?.id === userId;

  return (
    <span
      className="nick-hover"
      ref={anchorRef}
      onMouseEnter={showTooltip}
      onMouseLeave={scheduleHide}
    >
      {rankIcon && <span style={{ marginRight: 4 }}>{rankIcon}</span>}
      {nickname}
      {visible &&
        createPortal(
          <div
            className="nick-tooltip-portal"
            style={{ top: coords.top, left: coords.left }}
            onMouseEnter={showTooltip}
            onMouseLeave={scheduleHide}
          >
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
                {!isMe && (
                  <div style={{ marginTop: 6 }}>
                    {friendStatus === "sent" ? (
                      <span style={{ color: "#06d6a0" }}>✓ Pedido enviado!</span>
                    ) : friendStatus === "error" ? (
                      <span style={{ color: "#ff8a8a" }}>Não foi possível enviar.</span>
                    ) : (
                      <button
                        className="nick-tooltip-friend-btn"
                        onClick={handleAddFriend}
                        disabled={friendStatus === "sending"}
                      >
                        + Adicionar amigo
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>,
          document.body
        )}
    </span>
  );
}
