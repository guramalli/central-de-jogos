import { useEffect, useRef, useState } from "react";
import { api, novoSocket } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Topo from "./Topo.jsx";
import Rodape from "./Rodape.jsx";
import Avatar from "./Avatar.jsx";
import { CampoChat } from "./Chat.jsx";

const quando = (t) => {
  if (!t) return "";
  const d = new Date(t);
  const hoje = new Date();
  return d.toDateString() === hoje.toDateString()
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

export default function Amigos({ usuario, conversaInicial }) {
  const [dados, setDados] = useState(null);
  const [conversas, setConversas] = useState([]);
  const [aberta, setAberta] = useState(null); // amigo com a conversa aberta
  const [busca, setBusca] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [nick, setNick] = useState("");
  const [aviso, setAviso] = useState(null);

  async function carregar() {
    try {
      const [a, c] = await Promise.all([api.get("/friends"), api.get("/friends/conversas")]);
      setDados(a.data);
      setConversas(c.data || []);
    } catch {
      setDados((d) => d || { friends: [], receivedPending: [], sentPending: [] });
    }
  }
  useEffect(() => {
    carregar();
    const t = setInterval(() => { if (!document.hidden) carregar(); }, 20000);
    return () => clearInterval(t);
  }, []);

  // Veio de "Mandar mensagem" (perfil/hover): abre direto a conversa.
  useEffect(() => {
    if (!conversaInicial || !dados || aberta) return;
    const f = dados.friends.find((x) => x.userId === conversaInicial);
    if (f) setAberta(f);
  }, [conversaInicial, dados]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  async function adicionar(e) {
    e.preventDefault();
    if (!nick.trim()) return;
    try {
      const { data } = await api.post("/friends/request", { nickname: nick.trim() });
      setAviso({ ok: true, texto: `Pedido enviado pra ${data.nickname}!` });
      setNick("");
      carregar();
    } catch (err) {
      setAviso({ ok: false, texto: err.response?.data?.error || "Erro ao enviar pedido." });
    }
  }
  async function aceitar(id) {
    try { await api.post(`/friends/${id}/accept`); carregar(); }
    catch (err) { setAviso({ ok: false, texto: err.response?.data?.error || "Erro ao aceitar." }); }
  }
  async function remover(id, pergunta) {
    if (pergunta && !confirm(pergunta)) return;
    try { await api.delete(`/friends/${id}`); if (aberta?.friendshipId === id) setAberta(null); carregar(); }
    catch (err) { setAviso({ ok: false, texto: err.response?.data?.error || "Erro ao remover." }); }
  }

  const porUsuario = new Map(conversas.map((c) => [c.userId, c]));
  const lista = (dados?.friends || [])
    .map((f) => ({ ...f, ...(porUsuario.get(f.userId) || {}), online: f.online }))
    .filter((f) => !busca.trim() || f.nickname.toLowerCase().includes(busca.trim().toLowerCase()))
    .sort((a, b) => {
      if ((a.naoLidas > 0) !== (b.naoLidas > 0)) return a.naoLidas > 0 ? -1 : 1;
      if (a.quando && b.quando) return new Date(b.quando) - new Date(a.quando);
      if (!!a.quando !== !!b.quando) return a.quando ? -1 : 1;
      if (a.online !== b.online) return a.online ? -1 : 1;
      return a.nickname.localeCompare(b.nickname, "pt-BR");
    });
  const totalNaoLidas = lista.reduce((n, f) => n + (f.naoLidas || 0), 0);

  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo="amigos" />
      <main className={`v2-pagina v2-mensageiro ${aberta ? "com-conversa" : ""}`}>
        <aside className="v2-cartao v2-msg-lista">
          <div className="v2-cartao-cabeca">
            <h2>Mensagens {totalNaoLidas > 0 && <span className="v2-bolinha-contador">{totalNaoLidas}</span>}</h2>
            <button className="v2-botao-pequeno" onClick={() => setAdicionando((v) => !v)} aria-expanded={adicionando}>+ Adicionar amigo</button>
          </div>
          {adicionando && (
            <form className="v2-linha-form" onSubmit={adicionar}>
              <label htmlFor="v2-add-nick" className="v2-oculto">Nick do jogador</label>
              <input id="v2-add-nick" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Nick do jogador" autoComplete="off" />
              <button className="v2-botao v2-botao-amarelo" type="submit">Enviar</button>
            </form>
          )}
          {aviso && <div className={`v2-faixa-aviso ${aviso.ok ? "ok" : "erro"}`}>{aviso.texto}</div>}

          {dados?.receivedPending?.length > 0 && (
            <div className="v2-pedidos">
              <div className="v2-bloco-titulo">Pedidos recebidos <span>{dados.receivedPending.length}</span></div>
              {dados.receivedPending.map((p) => (
                <div key={p.friendshipId} className="v2-pedido">
                  <Avatar userId={p.userId} nickname={p.nickname} tamanho={34} />
                  <a href={linkDaPagina("jogador", { id: p.userId })} onClick={(e) => { e.preventDefault(); irParaPagina("jogador", { id: p.userId }); }}>{p.nickname}</a>
                  <button className="v2-botao-pequeno ok" onClick={() => aceitar(p.friendshipId)}>Aceitar</button>
                  <button className="v2-botao-pequeno" onClick={() => remover(p.friendshipId)}>Recusar</button>
                </div>
              ))}
            </div>
          )}

          <label htmlFor="v2-busca-amigo" className="v2-oculto">Buscar amigo</label>
          <input id="v2-busca-amigo" className="v2-campo" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar amigo…" />

          {!dados && <div className="v2-carregando">Carregando…</div>}
          {dados && lista.length === 0 && <div className="v2-vazio">{busca ? "Ninguém com esse nome." : "Você ainda não tem amigos adicionados. Use o botão acima ou o hover de alguém na sala."}</div>}
          <div className="v2-amigos">
            {lista.map((f) => (
              <button key={f.userId} className={`v2-amigo ${aberta?.userId === f.userId ? "aberta" : ""} ${f.naoLidas > 0 ? "nova" : ""}`} onClick={() => setAberta(f)}>
                <span className="v2-amigo-foto">
                  <Avatar userId={f.userId} nickname={f.nickname} tamanho={42} />
                  <i className={f.online ? "on" : ""} aria-label={f.online ? "online" : "offline"} />
                </span>
                <span className="v2-amigo-texto">
                  <b>{f.nickname}</b>
                  <span>{f.ultima ? `${f.ultimaMinha ? "Você: " : ""}${f.ultima}` : f.online ? "online agora" : "offline"}</span>
                </span>
                <span className="v2-amigo-lado">
                  {f.quando && <small>{quando(f.quando)}</small>}
                  {f.naoLidas > 0 && <span className="v2-bolinha-contador">{f.naoLidas}</span>}
                </span>
              </button>
            ))}
          </div>

          {dados?.sentPending?.length > 0 && (
            <div className="v2-pedidos">
              <div className="v2-bloco-titulo">Pedidos enviados</div>
              {dados.sentPending.map((p) => (
                <div key={p.friendshipId} className="v2-pedido">
                  <Avatar userId={p.userId} nickname={p.nickname} tamanho={30} />
                  <span>{p.nickname}</span>
                  <button className="v2-botao-pequeno" onClick={() => remover(p.friendshipId)}>Cancelar</button>
                </div>
              ))}
            </div>
          )}
        </aside>

        <section className="v2-cartao v2-conversa">
          {aberta ? (
            <Conversa
              key={aberta.userId}
              amigo={aberta}
              usuario={usuario}
              aoVoltar={() => setAberta(null)}
              aoRemover={() => remover(aberta.friendshipId, `Desfazer a amizade com ${aberta.nickname}?`)}
              aoLer={() => { carregar(); window.dispatchEvent(new Event("v2-mensagens-lidas")); }}
            />
          ) : (
            <div className="v2-conversa-vazia">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" /></svg>
              <b>Escolha um amigo pra conversar</b>
              <span>As mensagens ficam guardadas mesmo com a pessoa offline.</span>
            </div>
          )}
        </section>
      </main>
      <Rodape />
    </div>
  );
}

// Conversa privada. Conexão própria (join-dm), como no clássico: o servidor
// guarda uma conversa aberta por conexão.
export function Conversa({ amigo, usuario, aoVoltar, aoRemover, aoLer }) {
  const socketRef = useRef(null);
  const listaRef = useRef(null);
  const [msgs, setMsgs] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const s = novoSocket();
    socketRef.current = s;
    const entrar = () => s.emit("join-dm", { friendUserId: amigo.userId });
    s.on("connect", entrar);
    s.on("dm-history", (d) => { setMsgs(d.messages || []); aoLer?.(); });
    s.on("dm-message", (m) => {
      setMsgs((prev) => [...(prev || []), m]);
    });
    s.on("dm-error", (d) => setErro(d?.error || "Erro ao abrir a conversa."));
    s.connect();
    return () => { s.removeAllListeners(); s.disconnect(); };
  }, [amigo.userId]);

  useEffect(() => {
    const el = listaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  function enviar(texto) {
    socketRef.current?.emit("dm-message", { message: texto });
  }

  return (
    <>
      <div className="v2-conversa-topo">
        <button className="v2-voltar v2-so-celular" aria-label="Voltar para a lista" onClick={aoVoltar}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <span className="v2-amigo-foto">
          <Avatar userId={amigo.userId} nickname={amigo.nickname} tamanho={40} />
          <i className={amigo.online ? "on" : ""} />
        </span>
        <div className="v2-conversa-quem">
          <a href={linkDaPagina("jogador", { id: amigo.userId })} onClick={(e) => { e.preventDefault(); irParaPagina("jogador", { id: amigo.userId }); }}><b>{amigo.nickname}</b></a>
          <span>{amigo.online ? "online" : "offline"}</span>
        </div>
        {aoRemover && <button className="v2-botao-pequeno" onClick={aoRemover}>Desfazer amizade</button>}
      </div>
      {erro && <div className="v2-faixa-aviso erro">{erro}</div>}
      <div className="v2-conversa-lista" ref={listaRef}>
        {msgs === null && !erro && <div className="v2-carregando">Abrindo a conversa…</div>}
        {msgs && msgs.length === 0 && <div className="v2-vazio">Nenhuma mensagem ainda. Diga oi!</div>}
        {(msgs || []).map((m, i) => {
          const minha = m.senderId !== amigo.userId;
          return (
            <div key={i} className={`v2-balao-msg ${minha ? "minha" : ""}`}>
              <span>{m.message}</span>
              <small>{quando(m.at || m.createdAt)}</small>
            </div>
          );
        })}
      </div>
      <div className="v2-conversa-form">
        <CampoChat id="v2-dm-campo" aoEnviar={enviar} placeholder={`Mensagem para ${amigo.nickname}…`} maxLength={500} desativado={!!erro} />
      </div>
    </>
  );
}

// Conversa numa janela por cima da página — usada no painel admin, onde o
// admin fala com qualquer jogador (o servidor libera sem amizade).
export function ModalConversa({ amigo, usuario, aoFechar, aoLer }) {
  return (
    <div className="v2-modal-fundo" onClick={aoFechar}>
      <div className="v2-cartao v2-conversa v2-conversa-modal" role="dialog" aria-label={`Conversa com ${amigo.nickname}`} onClick={(e) => e.stopPropagation()}>
        <Conversa amigo={amigo} usuario={usuario} aoVoltar={aoFechar} aoLer={aoLer} />
        <button className="v2-modal-fechar" aria-label="Fechar conversa" onClick={aoFechar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </div>
  );
}
