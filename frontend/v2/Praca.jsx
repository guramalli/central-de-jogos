import { useEffect, useRef, useState } from "react";
import { novoSocket } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import { corDoJogador } from "./temas.js";
import Avatar from "./Avatar.jsx";
import { CampoChat, TextoSistema, TextoComMarcacoes } from "./Chat.jsx";

const hora = (t) => (t ? new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");

// PRAÇA — o chat geral do site. Histórico vem do banco (50 últimas), e a
// lista de "quem está na praça" é de quem está com ela aberta agora.
export default function Praca({ usuario }) {
  const socketRef = useRef(null);
  const fimRef = useRef(null);
  const listaRef = useRef(null);
  const [msgs, setMsgs] = useState([]);
  const [online, setOnline] = useState([]);
  const podeModerar = usuario.role === "ADMIN" || usuario.role === "MODERATOR";

  useEffect(() => {
    const s = novoSocket();
    socketRef.current = s;
    const entrar = () => s.emit("join-general-chat");
    s.on("connect", entrar);
    s.on("general-chat-history", (d) => setMsgs(d.messages || []));
    s.on("general-chat-message", (m) => setMsgs((prev) => [...prev, m].slice(-150)));
    s.on("chat-message-deleted", ({ id }) => setMsgs((prev) => prev.filter((m) => m.id !== id)));
    s.on("general-chat-online", (d) => setOnline(d.players || []));
    s.connect();
    return () => { s.removeAllListeners(); s.disconnect(); };
  }, []);

  // Rola só a caixa do chat (não a página inteira).
  useEffect(() => {
    const el = listaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  function enviar(texto) {
    socketRef.current?.emit("general-chat-message", { message: texto });
  }

  const meuNick = usuario.nickname.toLowerCase();

  return (
    <section className="v2-cartao v2-praca">
      <div className="v2-praca-cabeca">
        <h2>Praça — chat geral</h2>
        <span className="v2-jogando"><span className="v2-ponto-vivo" />{online.length} {online.length === 1 ? "pessoa" : "pessoas"} aqui agora</span>
      </div>
      <div className="v2-praca-corpo">
        <div className="v2-praca-chat">
          <div className="v2-chat-lista" ref={listaRef}>
            {msgs.length === 0 && <div className="v2-vazio">Ninguém falou nada ainda. Puxa assunto!</div>}
            {msgs.map((m, i) => {
              const citaMe = m.userId !== usuario.id && meuNick.length > 2 && m.message?.toLowerCase().includes(meuNick);
              return (
                <div key={m.id || i} className={`v2-msg ${m.system ? "sistema" : ""} ${citaMe ? "me-cita" : ""} ${m.userId === usuario.id ? "minha" : ""}`}>
                  {!m.system && (
                    <b style={{ color: corDoJogador(m.userId) }}>{m.clanTag ? `[${m.clanTag}] ` : ""}{m.nickname}</b>
                  )}
                  {!m.system && " "}
                  <span>{m.system ? <TextoSistema mensagem={m.message} destaque={m.tituloDestaque} /> : <TextoComMarcacoes texto={m.message} participantes={online.map((p) => p.nickname)} meuNick={usuario.nickname} />}</span>
                  <small className="v2-msg-hora">{hora(m.at || m.createdAt)}</small>
                  {podeModerar && m.id && !m.system && (
                    <button className="v2-msg-apagar" aria-label="Apagar mensagem" onClick={() => socketRef.current?.emit("delete-chat-message", { escopo: "geral", id: m.id })}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  )}
                </div>
              );
            })}
            <div ref={fimRef} />
          </div>
          <CampoChat id="v2-praca-campo" aoEnviar={enviar} participantes={online.map((p) => p.nickname)} meuNick={usuario.nickname} placeholder="Falar na praça…" />
        </div>
        <aside className="v2-praca-quem">
          <div className="v2-bloco-titulo">Quem está na praça</div>
          {online.length === 0 && <div className="v2-vazio">Ninguém por aqui ainda…</div>}
          {online.map((p) => (
            <a key={p.userId} className="v2-praca-pessoa" href={linkDaPagina("jogador", { id: p.userId })} onClick={(e) => { e.preventDefault(); irParaPagina("jogador", { id: p.userId }); }}>
              <Avatar userId={p.userId} nickname={p.nickname} tamanho={28} />
              <span>{p.nickname}</span>
            </a>
          ))}
        </aside>
      </div>
    </section>
  );
}
