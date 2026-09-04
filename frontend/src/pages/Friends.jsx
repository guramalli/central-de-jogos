import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import Seo from "../components/Seo.jsx";
import ConversaPainel from "../components/ConversaPainel.jsx";

export default function Friends() {
  const [data, setData] = useState({ friends: [], receivedPending: [], sentPending: [] });
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatWith, setChatWith] = useState(null); // { userId, nickname, online } | null
  const [conversas, setConversas] = useState([]);
  const [busca, setBusca] = useState("");
  // Abre o formulário de adicionar amigo. Fica escondido por padrão: a tela é
  // pra conversar, e adicionar é uma ação ocasional.
  const [adicionando, setAdicionando] = useState(false);

  useEffect(() => {
    load();
    // Atualiza sozinho a cada 20s, pra mostrar quem ficou online/offline
    // sem precisar recarregar a página manualmente.
    // 20s -> 60s: a lista de amigos muda devagar.
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    try {
      const [amigos, convs] = await Promise.all([
        api.get("/friends"),
        api.get("/friends/conversas"),
      ]);
      setData(amigos.data);
      setConversas(convs.data || []);
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

  // Uma lista só: cada amigo com seu estado de conversa. É isso que faz a
  // tela parecer um aplicativo de mensagem em vez de três blocos soltos.
  const porUsuario = new Map(conversas.map((c) => [c.userId, c]));
  const lista = friends
    .map((f) => {
      const c = porUsuario.get(f.userId);
      return {
        ...f,
        naoLidas: c?.naoLidas || 0,
        ultima: c?.ultima || null,
        ultimaMinha: c?.ultimaMinha || false,
        quando: c?.quando || null,
      };
    })
    .filter((f) => !busca.trim() || f.nickname.toLowerCase().includes(busca.trim().toLowerCase()))
    // Não lidas primeiro; depois quem tem conversa mais recente; depois os
    // online; e por fim ordem alfabética.
    .sort((a, b) => {
      if ((a.naoLidas > 0) !== (b.naoLidas > 0)) return a.naoLidas > 0 ? -1 : 1;
      if (a.quando && b.quando) return new Date(b.quando) - new Date(a.quando);
      if (a.quando !== b.quando) return a.quando ? -1 : 1;
      if (a.online !== b.online) return a.online ? -1 : 1;
      return a.nickname.localeCompare(b.nickname, "pt-BR");
    });

  const totalNaoLidas = lista.reduce((s, f) => s + f.naoLidas, 0);

  return (
    <div className="mensageiro">
      <Seo title="Amigos" description="Converse com seus amigos e veja quem está online na Educação Gamer." />

      {/* Coluna da esquerda: busca, pedidos e a lista única de conversas. */}
      <aside className={`mensageiro-lista ${chatWith ? "mensageiro-lista-oculta" : ""}`}>
        <div className="mensageiro-lista-topo">
          <h1>
            Mensagens
            {totalNaoLidas > 0 && <span className="mensageiro-total">{totalNaoLidas}</span>}
          </h1>
          <button
            type="button"
            className="mensageiro-add-btn"
            onClick={() => setAdicionando((v) => !v)}
            title="Adicionar amigo"
          >
            <span className="material-symbols-outlined">person_add</span>
          </button>
        </div>

        {adicionando && (
          <form onSubmit={handleAdd} className="mensageiro-add-form">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Nick do jogador"
            />
            <button className="btn btn-sm" type="submit">Enviar</button>
          </form>
        )}
        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}

        {receivedPending.length > 0 && (
          <div className="mensageiro-pedidos">
            <h4>Pedidos recebidos ({receivedPending.length})</h4>
            {receivedPending.map((p) => (
              <div key={p.friendshipId} className="mensageiro-pedido">
                <span>{p.nickname}</span>
                <button className="btn btn-sm" onClick={() => handleAccept(p.friendshipId)}>Aceitar</button>
                <button className="btn secondary btn-sm" onClick={() => handleRemove(p.friendshipId)}>Recusar</button>
              </div>
            ))}
          </div>
        )}

        <input
          className="mensageiro-busca"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar conversa..."
        />

        <div className="mensageiro-conversas">
          {lista.length === 0 && (
            <p className="mensageiro-vazio">
              {busca ? "Ninguém com esse nome." : "Você ainda não tem amigos. Use o + pra adicionar."}
            </p>
          )}
          {lista.map((f) => (
            <button
              key={f.userId}
              type="button"
              className={`mensageiro-item ${chatWith?.userId === f.userId ? "mensageiro-item-ativo" : ""} ${f.naoLidas > 0 ? "mensageiro-item-novo" : ""}`}
              onClick={() => setChatWith({ userId: f.userId, nickname: f.nickname, online: f.online })}
            >
              <span className="mensageiro-avatar">
                {f.nickname.charAt(0).toUpperCase()}
                <span className={`mensageiro-status ${f.online ? "mensageiro-status-on" : ""}`} />
              </span>
              <span className="mensageiro-texto">
                <span className="mensageiro-nick">{f.nickname}</span>
                <span className="mensageiro-previa">
                  {f.ultima
                    ? `${f.ultimaMinha ? "Você: " : ""}${f.ultima}`
                    : f.online ? "online" : "sem conversas ainda"}
                </span>
              </span>
              {f.naoLidas > 0 && <span className="mensageiro-badge">{f.naoLidas}</span>}
            </button>
          ))}
        </div>

        {sentPending.length > 0 && (
          <p className="mensageiro-enviados">
            {sentPending.length} pedido(s) enviado(s), aguardando resposta.
          </p>
        )}
      </aside>

      {/* Coluna da direita: a conversa. */}
      <section className={`mensageiro-conversa ${chatWith ? "mensageiro-conversa-ativa" : ""}`}>
        {chatWith ? (
          <>
            {/* Só no celular: volta pra lista, já que as duas colunas não
                cabem lado a lado numa tela estreita. */}
            <button type="button" className="mensageiro-voltar" onClick={() => setChatWith(null)}>
              <span className="material-symbols-outlined">arrow_back</span> Conversas
            </button>
            <ConversaPainel friend={chatWith} aoLerMensagens={load} />
          </>
        ) : (
          <div className="mensageiro-placeholder">
            <span className="material-symbols-outlined">forum</span>
            <p>Escolha uma conversa para começar.</p>
          </div>
        )}
      </section>
    </div>
  );
}
