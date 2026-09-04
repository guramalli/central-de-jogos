import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import Seo from "../components/Seo.jsx";
import DmModal from "../components/DmModal.jsx";
import CaixaDeMensagens from "../components/CaixaDeMensagens.jsx";

export default function Friends() {
  const [data, setData] = useState({ friends: [], receivedPending: [], sentPending: [] });
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatWith, setChatWith] = useState(null); // { userId, nickname } | null
  // Muda quando uma conversa fecha, pra caixa recarregar e as mensagens que
  // acabaram de ser lidas saírem do contador.
  const [recarregarCaixa, setRecarregarCaixa] = useState(0);

  useEffect(() => {
    load();
    // Atualiza sozinho a cada 20s, pra mostrar quem ficou online/offline
    // sem precisar recarregar a página manualmente.
    // 20s -> 60s: a lista de amigos muda devagar.
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    try {
      const { data } = await api.get("/friends");
      setData(data);
    } catch {
      // silencioso — próxima atualização automática tenta de novo
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!nickname.trim()) return;
    try {
      const { data: res } = await api.post("/friends/request", { nickname: nickname.trim() });
      setSuccess(`Pedido enviado pra ${res.nickname}!`);
      setNickname("");
      load();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao enviar pedido.");
    }
  }

  async function handleAccept(friendshipId) {
    try {
      await api.post(`/friends/${friendshipId}/accept`);
      load();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao aceitar.");
    }
  }

  async function handleRemove(friendshipId) {
    try {
      await api.delete(`/friends/${friendshipId}`);
      load();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao remover.");
    }
  }

  if (loading) return <p>Carregando...</p>;

  const { friends, receivedPending, sentPending } = data;

  return (
    <div>
      <Seo title="Amigos" description="Veja seus amigos online e adicione novos jogadores na Educação Gamer." />
      <h1>Amigos</h1>

      {/* Primeiro a caixa de mensagens: quem abre esta página com aviso de
          mensagem nova quer LER, não adicionar amigo. */}
      <CaixaDeMensagens
        aoAbrirConversa={setChatWith}
        recarregar={recarregarCaixa}
      />

      <div className="card" style={{ maxWidth: 480, marginBottom: 20 }}>
        <h2>Adicionar amigo</h2>
        {error && <div className="error-msg">{error}</div>}
        {success && <div style={{ color: "#06d6a0", fontSize: 13, marginBottom: 10 }}>✓ {success}</div>}
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 8 }}>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Nickname exato do jogador"
            style={{ marginBottom: 0 }}
          />
          <button className="btn" type="submit">Enviar pedido</button>
        </form>
      </div>

      {receivedPending.length > 0 && (
        <div className="card" style={{ maxWidth: 480, marginBottom: 20 }}>
          <h2>Pedidos recebidos ({receivedPending.length})</h2>
          {receivedPending.map((p) => (
            <div key={p.friendshipId} className="friend-row">
              <span>{p.nickname}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn success" onClick={() => handleAccept(p.friendshipId)}>Aceitar</button>
                <button className="btn secondary" onClick={() => handleRemove(p.friendshipId)}>Recusar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sentPending.length > 0 && (
        <div className="card" style={{ maxWidth: 480, marginBottom: 20 }}>
          <h2>Pedidos enviados ({sentPending.length})</h2>
          {sentPending.map((p) => (
            <div key={p.friendshipId} className="friend-row">
              <span>{p.nickname}</span>
              <button className="btn secondary" onClick={() => handleRemove(p.friendshipId)}>Cancelar</button>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ maxWidth: 480 }}>
        <h2>Seus amigos ({friends.length})</h2>
        {friends.length === 0 && (
          <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
            Você ainda não tem amigos adicionados. Manda um pedido pelo nickname aí em cima, ou
            passa o mouse no nick de alguém numa sala e clica em "Adicionar amigo".
          </p>
        )}
        {friends.map((f) => (
          <div key={f.friendshipId} className="friend-row">
            <Link to={`/jogador/${f.userId}`} className="friend-name">
              <span className={`friend-status-dot ${f.online ? "friend-status-online" : "friend-status-offline"}`} />
              {f.nickname}
            </Link>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn secondary" onClick={() => setChatWith({ userId: f.userId, nickname: f.nickname })}>
                💬 Mensagem
              </button>
              <button className="btn secondary" onClick={() => handleRemove(f.friendshipId)}>Remover amigo</button>
            </div>
          </div>
        ))}
      </div>

      {chatWith && (
        <DmModal
          friend={chatWith}
          onClose={() => {
            setChatWith(null);
            // A conversa foi aberta, então as mensagens dela viraram lidas.
            setRecarregarCaixa((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}
