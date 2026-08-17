import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import DmModal from "./DmModal.jsx";

// Renderiza o conteúdo do hover num portal, direto no <body> — assim ele
// nunca fica "cortado" por containers com rolagem (tipo a lista de
// jogadores online), que sempre recortam qualquer coisa que vaze pra fora
// deles, mesmo elementos posicionados por cima.
export default function ProfileTooltip({ userId, nickname, rankIcon, gameKey = "stop", roomId = null }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [friendStatus, setFriendStatus] = useState(null); // null | "sending" | "sent" | "error"
  const [dmOpen, setDmOpen] = useState(false);
  const [clanInviteStatus, setClanInviteStatus] = useState(null); // null | "sending" | "sent" | "error"
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
      // O balão abre pra baixo por padrão. Mas se o nome está perto do fim
      // da tela (comum na lista de jogadores no celular), não caberia — aí
      // ele vira pra cima. Sem isso, o conteúdo ficava cortado.
      const alturaEstimada = 210;
      const espacoAbaixo = window.innerHeight - rect.bottom;
      const abrirParaCima = espacoAbaixo < alturaEstimada && rect.top > alturaEstimada;

      // O mesmo vale pras laterais: um nome na borda direita empurraria o
      // balão pra fora, já que ele é centralizado no elemento.
      const meiaLargura = 100; // metade da largura fixa do balão
      const centro = rect.left + rect.width / 2;
      const left = Math.min(
        Math.max(centro, meiaLargura + 8),
        window.innerWidth - meiaLargura - 8
      );

      setCoords({
        top: abrirParaCima ? rect.top - 6 : rect.bottom + 6,
        left,
        paraCima: abrirParaCima,
      });
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

  async function handleInviteToClan() {
    setClanInviteStatus("sending");
    try {
      await api.post("/clans/invite", { userId });
      setClanInviteStatus("sent");
    } catch {
      setClanInviteStatus("error");
    }
  }

  const monthly = profile?.monthly.find((m) => m.gameKey === gameKey);
  const lifetime = profile?.lifetime.find((l) => l.gameKey === gameKey);
  // Aproveitamento só da sala em que estamos agora — ver o desempenho da
  // pessoa em outros temas não ajuda em nada aqui dentro.
  const roomAccuracy = roomId ? profile?.quizAccuracy?.find((a) => a.roomId === roomId) : null;
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
            style={{
              top: coords.top,
              left: coords.left,
              transform: coords.paraCima
                ? "translate(-50%, -100%)"
                : "translateX(-50%)",
            }}
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
                {profile.tituloExibido && (
                  <div className="nick-tooltip-titulo">
                    {profile.tituloExibidoLogo && (
                      <img
                        src={profile.tituloExibidoLogo}
                        alt=""
                        className="nick-tooltip-titulo-logo"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    )}
                    {profile.tituloExibido}
                  </div>
                )}
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
                {roomAccuracy && (
                  <div className="nick-tooltip-accuracy">
                    <div className="nick-tooltip-accuracy-row">
                      <span>Aproveitamento na sala</span>
                      <strong>{roomAccuracy.percent}%</strong>
                    </div>
                  </div>
                )}
                {!isMe && !profile.clan && profile.viewerClan && (
                  <div style={{ marginTop: 4 }}>
                    {clanInviteStatus === "sent" ? (
                      <span style={{ color: "#06d6a0" }}>✓ Convite enviado!</span>
                    ) : clanInviteStatus === "error" ? (
                      <span style={{ color: "#ff8a8a" }}>Não foi possível convidar.</span>
                    ) : (
                      <button
                        className="nick-tooltip-friend-btn"
                        onClick={handleInviteToClan}
                        disabled={clanInviteStatus === "sending"}
                      >
                        🚩 Convidar pro [{profile.viewerClan.tag}]
                      </button>
                    )}
                  </div>
                )}
                {!isMe && (
                  <div style={{ marginTop: 6 }}>
                    {friendStatus === "sent" || profile.friendshipStatus === "pending_sent" ? (
                      <span style={{ color: "#06d6a0" }}>✓ Pedido enviado!</span>
                    ) : friendStatus === "error" ? (
                      <span style={{ color: "#ff8a8a" }}>Não foi possível enviar.</span>
                    ) : profile.friendshipStatus === "friends" ? (
                      <button
                        className="nick-tooltip-friend-btn"
                        onClick={() => {
                          setDmOpen(true);
                          setVisible(false);
                        }}
                      >
                        💬 Mandar mensagem
                      </button>
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
      {dmOpen && <DmModal friend={{ userId, nickname }} onClose={() => setDmOpen(false)} />}
    </span>
  );
}
