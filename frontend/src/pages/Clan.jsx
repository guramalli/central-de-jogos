import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Clan() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [myInvites, setMyInvites] = useState([]);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [{ data: mine }, { data: invites }] = await Promise.all([
        api.get("/clans/mine"),
        api.get("/clans/invites/mine"),
      ]);
      setData(mine);
      setMyInvites(invites);
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao carregar clã.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/clans", { name, tag });
      setName("");
      setTag("");
      load();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao criar clã.");
    }
  }

  async function handleRemove(userId) {
    if (!confirm("Tem certeza que quer remover esse membro?")) return;
    try {
      await api.delete(`/clans/members/${userId}`);
      load();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao remover membro.");
    }
  }

  async function handleLeave() {
    if (!confirm("Tem certeza que quer sair do clã?")) return;
    try {
      await api.delete(`/clans/members/${user.id}`);
      load();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao sair do clã.");
    }
  }

  async function handleAcceptInvite(id) {
    try {
      await api.post(`/clans/invites/${id}/accept`);
      load();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao aceitar convite.");
    }
  }

  async function handleDeclineInvite(id) {
    try {
      await api.post(`/clans/invites/${id}/decline`);
      load();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao recusar convite.");
    }
  }

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1>Meu Clã</h1>
      {error && <div className="error-msg">{error}</div>}

      {/* Convites pendentes recebidos (aparece mesmo se já tiver clã, embora só
          sirva de fato pra quem ainda não tem) */}
      {myInvites.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2>Convites recebidos</h2>
          {myInvites.map((inv) => (
            <div key={inv.id} className="clan-invite-row">
              <span>
                <strong>[{inv.clan.tag}] {inv.clan.name}</strong> te convidou pro clã
              </span>
              <div>
                <button className="btn success" onClick={() => handleAcceptInvite(inv.id)}>Aceitar</button>{" "}
                <button className="btn secondary" onClick={() => handleDeclineInvite(inv.id)}>Recusar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!data?.clan && (
        <div className="card">
          <h2>Você ainda não tem um clã</h2>
          {data?.canCreate ? (
            <>
              <p style={{ color: "var(--text-dim)" }}>
                Crie o seu! Depois é só convidar outros jogadores clicando com o botão direito no
                nick deles (na lista de jogadores online, dentro do jogo).
              </p>
              <form onSubmit={handleCreate}>
                <input placeholder="Nome do clã" value={name} onChange={(e) => setName(e.target.value)} required />
                <input
                  placeholder="Tag (até 5 letras, ex: EDUG)"
                  value={tag}
                  maxLength={5}
                  onChange={(e) => setTag(e.target.value)}
                  required
                />
                <button className="btn" type="submit">Criar clã</button>
              </form>
            </>
          ) : (
            <p style={{ color: "var(--text-dim)" }}>
              Você precisa de pelo menos <strong>{data?.requiredPoints}</strong> pontos vitalícios no
              Stop pra poder criar um clã (você tem <strong>{data?.myPoints}</strong> agora). Continue
              jogando pra desbloquear, ou espere alguém te convidar pro clã dela.
            </p>
          )}
        </div>
      )}

      {data?.clan && (
        <div className="card">
          <h2>
            [{data.clan.tag}] {data.clan.name}
            {data.clan.isOwner && <span className="clan-owner-badge">Você é o dono</span>}
          </h2>
          <p style={{ color: "var(--text-dim)" }}>
            {data.clan.members.length}/{data.clan.maxMembers} membros
          </p>

          <table className="player-table">
            <thead>
              <tr>
                <th>Membro</th>
                <th>Cargo</th>
                {data.clan.isOwner && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {data.clan.members.map((m) => (
                <tr key={m.id}>
                  <td>{m.nickname}</td>
                  <td>{m.id === data.clan.ownerId ? "Dono" : "Membro"}</td>
                  {data.clan.isOwner && (
                    <td>
                      {m.id !== data.clan.ownerId && (
                        <button className="btn secondary" onClick={() => handleRemove(m.id)}>Remover</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {!data.clan.isOwner && (
            <button className="btn secondary" style={{ marginTop: 14 }} onClick={handleLeave}>
              Sair do clã
            </button>
          )}

          {data.clan.isOwner && (
            <div style={{ marginTop: 20 }}>
              <h3>Convites enviados (pendentes)</h3>
              {data.clan.pendingInvites.length === 0 && (
                <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
                  Nenhum convite pendente. Convide gente clicando com o botão direito no nick dela,
                  na lista de jogadores online dentro do jogo.
                </p>
              )}
              <ul style={{ fontSize: 13, color: "var(--text-dim)" }}>
                {data.clan.pendingInvites.map((inv) => (
                  <li key={inv.id}>{inv.invited.nickname} — aguardando resposta</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
