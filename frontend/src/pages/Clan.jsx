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
  // Pedidos que EU enviei (pra mostrar "enviado" no lugar do botão) e os que
  // recebi como líder.
  const [meusPedidos, setMeusPedidos] = useState([]);
  const [pedidosRecebidos, setPedidosRecebidos] = useState([]);
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
    carregarPedidos();
  }, []);

  async function carregarPedidos() {
    try {
      const [minhas, recebidas] = await Promise.all([
        api.get("/clans/solicitacoes/minhas"),
        api.get("/clans/solicitacoes/recebidas"),
      ]);
      setMeusPedidos(minhas.data || []);
      setPedidosRecebidos(recebidas.data || []);
    } catch {
      // sem pedidos a tela só não mostra nada
    }
  }

  async function pedirEntrada(clanId) {
    setError("");
    try {
      await api.post(`/clans/${clanId}/solicitar`);
      // Atualiza na hora: sem isso o botão continuaria oferecendo "pedir"
      // e a pessoa clicaria de novo achando que falhou.
      setMeusPedidos((atual) => [...atual, clanId]);
    } catch (e) {
      setError(e.response?.data?.error || "Não foi possível enviar o pedido.");
    }
  }

  async function responderPedido(id, aceitar) {
    setError("");
    try {
      await api.post(`/clans/solicitacoes/${id}/${aceitar ? "aceitar" : "recusar"}`);
      await Promise.all([load(), carregarPedidos()]);
    } catch (e) {
      setError(e.response?.data?.error || "Não foi possível responder o pedido.");
    }
  }

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

      {data?.clan && (
        <div className="card">
          <h2>
            [{data.clan.tag}] {data.clan.name}
            {data.clan.isOwner && <span className="clan-owner-badge">Você é o dono</span>}
          </h2>
          <p style={{ color: "var(--text-dim)" }}>
            {data.clan.members.length}/{data.clan.maxMembers} membros
          </p>

          {/* Esta página JÁ é a administração (membros, cargos, expulsar), então
              um botão "administrar" aqui não levaria a lugar nenhum. O que
              faltava era o caminho pro perfil PÚBLICO — o que os outros veem,
              com troféus e contribuição de cada um. */}
          <p>
            <Link to={`/cla/${data.clan.id}`} className="btn secondary">
              Ver perfil público do clã
            </Link>
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

          {/* Pedidos de ingresso vêm ANTES dos convites enviados: são o que
              exige ação sua, e o contador no menu aponta pra cá. */}
          {data.clan.isOwner && pedidosRecebidos.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3>Pedidos pra entrar ({pedidosRecebidos.length})</h3>
              {pedidosRecebidos.map((p) => (
                <div key={p.id} className="cla-pedido">
                  <Link to={`/jogador/${p.user.id}`}>{p.user.nickname}</Link>
                  <div className="cla-pedido-acoes">
                    <button className="btn btn-sm" onClick={() => responderPedido(p.id, true)}>
                      Aceitar
                    </button>
                    <button
                      className="btn btn-sm secondary"
                      onClick={() => responderPedido(p.id, false)}
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
            const meu = data?.clan?.id === c.id;
            return (
              <div key={c.id} className={`clan-list-item ${meu ? "clan-list-item-meu" : ""}`}>
                {/* Vai direto pro perfil do clã, em vez de expandir aqui.
                    O acordeão mostrava líder e membros; o perfil mostra isso
                    e mais os pontos de cada um, a contribuição e os troféus —
                    manter os dois seria a mesma informação em dois lugares,
                    com um deles sempre pior. */}
                <Link to={`/cla/${c.id}`} className="clan-list-head">
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
                    chevron_right
                  </span>
                </Link>
                {/* Só pra quem não tem clã: quem já tem precisaria sair antes,
                    e oferecer o botão seria um convite a um erro. */}
                {!data?.clan && (
                  <div className="clan-list-pedir">
                    {meusPedidos.includes(c.id) ? (
                      <span className="clan-list-pedido-feito">Pedido enviado</span>
                    ) : (
                      <button className="btn btn-sm" onClick={() => pedirEntrada(c.id)}>
                        Pedir pra entrar
                      </button>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* Criar clã fica no FIM, depois da lista. Quem abre a página vendo o
          formulário cria mais um clã; quem abre vendo os que já existem tende
          a pedir pra entrar. A ideia não é lotar o site de clãs de uma pessoa
          só — clã vazio não joga junto e não disputa ranking. */}
      {!data?.clan && (
        <div className="card">
          <h2>Você ainda não tem um clã</h2>
          {data?.canCreate ? (
            <>
              <p style={{ color: "var(--text-dim)" }}>
                Não achou nenhum acima que combine com você? Crie o seu. Depois é só convidar
                jogadores clicando com o botão direito no nick deles, na lista de jogadores online
                dentro do jogo — ou esperar alguém pedir pra entrar.
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
              Você precisa de pelo menos{" "}
              <strong>{(data?.requiredPoints ?? 0).toLocaleString("pt-BR")}</strong> pontos
              vitalícios somando <strong>Stop, Quiz e Acromania</strong> pra criar um clã (você tem{" "}
              <strong>{(data?.myPoints ?? 0).toLocaleString("pt-BR")}</strong> agora). Continue
              jogando pra desbloquear, ou espere alguém te convidar pro clã dela.
            </p>
          )}
        </div>
      )}

    </div>
  );
}
