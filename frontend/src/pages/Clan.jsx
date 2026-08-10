import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import Seo from "../components/Seo.jsx";

export default function Clan() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [myInvites, setMyInvites] = useState([]);
  // Diretório de clãs: todos os clãs do site, e qual deles está expandido
  // mostrando os membros.
  const [todosClans, setTodosClans] = useState([]);
  const [clanAberto, setClanAberto] = useState(null);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [{ data: mine }, { data: invites }, { data: todos }] = await Promise.all([
        api.get("/clans/mine"),
        api.get("/clans/invites/mine"),
        api.get("/clans/todos"),
      ]);
      setData(mine);
      setMyInvites(invites);
      setTodosClans(todos);
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
      <Seo title="Meu Clã" />
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

      {/* Diretório de clãs — todos os grupos do site, com os membros de
          cada um. Ajuda quem ainda não tem clã a encontrar um pra pedir
          convite, e cria aquele clima de disputa entre os grupos. */}
      <div className="card" style={{ marginTop: 24 }}>
        <h2>🚩 Clãs do portal ({todosClans.length})</h2>
        <p style={{ color: "var(--text-dim)", fontSize: 13, marginTop: -4 }}>
          Ordenados pela pontuação somada dos membros neste mês. Clique num clã pra ver quem
          faz parte.
        </p>

        {todosClans.length === 0 && (
          <p style={{ color: "var(--text-dim)" }}>
            Nenhum clã criado ainda. Que tal ser o primeiro?
          </p>
        )}

        <div className="clan-list">
          {todosClans.map((c, i) => {
            const aberto = clanAberto === c.id;
            const meu = data?.clan?.id === c.id;
            return (
              <div key={c.id} className={`clan-list-item ${meu ? "clan-list-item-meu" : ""}`}>
                <button
                  className="clan-list-head"
                  onClick={() => setClanAberto(aberto ? null : c.id)}
                >
                  <span className="clan-list-pos">{i + 1}º</span>
                  <span className="clan-list-tag">[{c.tag}]</span>
                  <span className="clan-list-name">
                    {c.name}
                    {meu && <span className="clan-list-badge">seu clã</span>}
                  </span>
                  <span className="clan-list-meta">
                    {c.memberCount} {c.memberCount === 1 ? "membro" : "membros"}
                  </span>
                  <span className="clan-list-pts">
                    {c.monthlyPoints.toLocaleString("pt-BR")} pts
                  </span>
                  <span className="material-symbols-outlined clan-list-seta">
                    {aberto ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {aberto && (
                  <div className="clan-list-membros">
                    <div className="clan-list-membros-titulo">
                      Líder: <strong>{c.owner.nickname}</strong>
                    </div>
                    <div className="clan-list-membros-grid">
                      {c.members.map((m) => (
                        <Link
                          key={m.id}
                          to={`/jogador/${m.id}`}
                          className={`clan-membro ${m.id === c.owner.id ? "clan-membro-lider" : ""}`}
                        >
                          {m.id === c.owner.id ? "👑 " : ""}
                          {m.nickname}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
