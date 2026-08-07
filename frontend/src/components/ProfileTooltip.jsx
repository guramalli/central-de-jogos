import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

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
                <div className="nick-tooltip-avatar-row">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={nickname} className="avatar-img avatar-img-small" />
                  ) : (
                    <div className="avatar-placeholder avatar-placeholder-small">🎮</div>
                  )}
                </div>
                {monthly?.position && (
                  <div className="nick-tooltip-rank-position">
                    {monthly.position <= 3 ? ["🥇", "🥈", "🥉"][monthly.position - 1] : "📊"}{" "}
                    {monthly.position}º no ranking mensal
                  </div>
                )}
                <div>
                  Mensal: <strong>{monthly ? `${monthly.points} pts` : "0 pts"}</strong>
                </div>
                <div>Vitalícia: <strong>{lifetime ? lifetime.points : 0} pts</strong></div>
                <div style={{ opacity: 0.75 }}>
                  {monthly?.nextRank
                    ? `Faltam ${monthly.nextRank.pointsNeeded} pra ${monthly.nextRank.name}`
                    : monthly
                    ? "Patente máxima!"
                    : "Ainda não pontuou este mês"}
                </div>
                <div>🚩 {profile.clan ? `${profile.clan.name} [${profile.clan.tag}]` : "Sem clã"}</div>
                {!isMe && (
                  <div style={{ marginTop: 6 }}>
                    {friendStatus === "sent" || profile.friendshipStatus === "pending_sent" ? (
                      <span style={{ color: "#06d6a0" }}>✓ Pedido enviado!</span>
                    ) : friendStatus === "error" ? (
                      <span style={{ color: "#ff8a8a" }}>Não foi possível enviar.</span>
                    ) : profile.friendshipStatus === "friends" ? (
                      <span style={{ color: "#06d6a0" }}>✓ Já são amigos</span>
                    ) : profile.friendshipStatus === "pending_received" ? (
                      <span style={{ color: "var(--accent-2)" }}>Te mandou um pedido — vê em Amigos</span>
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
                <Link to={`/jogador/${userId}`} className="nick-tooltip-profile-link">
                  Ver perfil completo →
                </Link>
              </>
            )}
          </div>,
          document.body
        )}
    </span>
  );
}
