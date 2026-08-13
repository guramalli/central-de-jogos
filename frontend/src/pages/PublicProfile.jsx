import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import Seo from "../components/Seo.jsx";

const GAME_NAMES = { stop: "Stop", quiz: "Quiz", acromania: "Acromania" };

function formatMemberSince(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const formatted = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export default function PublicProfile() {
  const { userId } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [friendStatus, setFriendStatus] = useState(null); // null | "sending" | "sent"
  const [friendError, setFriendError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get(`/users/${userId}/profile`)
      .then(({ data }) => setProfile(data))
      .catch(() => setError("Não foi possível carregar esse perfil."))
      .finally(() => setLoading(false));
    setFriendStatus(null);
  }, [userId]);

  async function handleAddFriend() {
    setFriendStatus("sending");
    setFriendError("");
    try {
      await api.post("/friends/request", { targetUserId: userId });
      setFriendStatus("sent");
    } catch (e) {
      setFriendStatus(null);
      setFriendError(e.response?.data?.error || "Erro ao enviar pedido.");
    }
  }

  if (loading) return <p>Carregando...</p>;
  if (error || !profile) return <p style={{ color: "var(--text-dim)" }}>{error || "Perfil não encontrado."}</p>;

  const isMe = me?.id === userId;

  return (
    <div>
      <Seo title={profile.nickname} description={`Veja o perfil de ${profile.nickname} na Educação Gamer.`} />

      <div className="card public-profile-header">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt={profile.nickname} className="avatar-img avatar-img-large" />
        ) : (
          <div className="avatar-placeholder avatar-placeholder-large">🎮</div>
        )}
        <div>
          <h1 style={{ margin: 0 }}>{profile.nickname}</h1>
          <p style={{ color: "var(--text-dim)", margin: "4px 0" }}>
            📅 Membro desde {formatMemberSince(profile.memberSince)} · ⏱ {profile.playtimeMinutes} min jogados
          </p>
          {profile.clan && (
            <p style={{ color: "var(--accent-2)", margin: "4px 0", fontWeight: 700 }}>
              🚩 {profile.clan.name} [{profile.clan.tag}]
            </p>
          )}
          {!isMe && (
            <div style={{ marginTop: 10 }}>
              {friendStatus === "sent" || profile.friendshipStatus === "pending_sent" ? (
                <span style={{ color: "#06d6a0" }}>✓ Pedido de amizade enviado!</span>
              ) : friendStatus === "sending" ? (
                <span style={{ color: "var(--text-dim)" }}>Enviando...</span>
              ) : profile.friendshipStatus === "friends" ? (
                <span style={{ color: "#06d6a0" }}>✓ Já são amigos</span>
              ) : profile.friendshipStatus === "pending_received" ? (
                <span style={{ color: "var(--accent-2)" }}>
                  Te mandou um pedido de amizade — <Link to="/amigos">confere aqui</Link>
                </span>
              ) : (
                <>
                  <button className="btn" onClick={handleAddFriend}>+ Adicionar amigo</button>
                  {friendError && (
                    <div style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 6 }}>{friendError}</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {profile.achievements.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Conquistas</h2>
          <div className="achievements-grid">
            {profile.achievements.map((a, i) => (
              <div key={i} className="achievement-badge">
                {a.iconUrl ? (
                  <img src={a.iconUrl} alt="" className="achievement-icon-img" />
                ) : (
                  <span className="achievement-icon">{a.icon}</span>
                )}
                <span>{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.monthly.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Ranking mensal</h2>
          <div className="monthly-rank-cards">
            {profile.monthly.map((m) => (
              <div key={m.gameKey} className="monthly-rank-card">
                <div className="monthly-rank-card-top">
                  <span className="monthly-rank-game-name">{GAME_NAMES[m.gameKey] || m.gameKey}</span>
                  {m.position && <span className="monthly-rank-position">{m.position}º no mês</span>}
                </div>

                {m.rank && (
                  <div className="monthly-rank-patent">
                    <img
                      src={m.rank.icon}
                      alt={m.rank.name}
                      className={`monthly-rank-patent-icon${m.rank.brilha ? " rank-badge-icon-brilha" : ""}`}
                    />
                    <span className="monthly-rank-patent-name">{m.rank.name}</span>
                  </div>
                )}

                <div className="monthly-rank-points">
                  <strong>{m.points}</strong>
                  <span>pontos este mês</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Pontuação vitalícia</h2>
        <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: -6 }}>
          Total histórico desde o início — só um título, sem patente vinculada (patente é do mês).
        </p>
        {profile.lifetime.length === 0 && (
          <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Ainda não pontuou em nenhum jogo.</p>
        )}
        {profile.lifetime.map((l) => (
          <div key={l.gameKey} className="friend-row">
            <span>{GAME_NAMES[l.gameKey] || l.gameKey}</span>
            <strong>{l.points} pts</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
