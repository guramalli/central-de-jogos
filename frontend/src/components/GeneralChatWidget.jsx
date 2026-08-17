import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getSocket } from "../socket.js";
import Chat from "./Chat.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Widget de chat sempre disponível na página inicial — diferente do chat de
// dentro das salas de jogo, esse fica gravado e é visível pra qualquer um
// que entrar no site, mesmo sem estar jogando nada. A ideia é dar aquela
// sensação de "praça" onde sempre tem gente conversando.
export default function GeneralChatWidget() {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [online, setOnline] = useState([]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    socket.connect();
    socket.emit("join-general-chat");

    socket.on("general-chat-history", (data) => setMessages(data.messages || []));
    socket.on("general-chat-message", (msg) => setMessages((prev) => [...prev, msg]));
    // Moderador apagou: some da praça pra todo mundo que está com ela aberta.
    const aoApagarMensagem = ({ id }) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    };
    socket.on("chat-message-deleted", aoApagarMensagem);
    socket.on("general-chat-online", (data) => setOnline(data.players || []));

    return () => {
      socket.off("general-chat-history");
      socket.off("general-chat-message");
        // Com referência do handler: "chat-message-deleted" é escutado em
      // vários componentes, e um off() sem referência apagaria os
      // listeners dos outros junto com o seu.
      socket.off("chat-message-deleted", aoApagarMensagem);
      socket.off("general-chat-online");
      socket.disconnect();
    };
  }, []);

  const podeModerar = user?.role === "ADMIN" || user?.role === "MODERATOR";
  function apagarMensagem(id) {
    socketRef.current?.emit("delete-chat-message", { escopo: "geral", id });
  }

  function sendChat(text) {
    socketRef.current?.emit("general-chat-message", { message: text });
  }

  return (
    <div className="glossy-panel general-chat-widget">
      <div className="general-chat-header">
        <h3>💬 Praça — Chat Geral</h3>
        <span className="general-chat-online-count">
          🟢 {online.length} {online.length === 1 ? "pessoa" : "pessoas"} aqui agora
        </span>
      </div>
      <div className="general-chat-body">
        <Chat messages={messages} onSend={sendChat} showTimestamp canModerate={podeModerar} onDelete={apagarMensagem} />
        <div className="general-chat-online-list">
          <h4>Quem está na praça</h4>
          {online.length === 0 && <p className="general-chat-online-empty">Ninguém por aqui ainda...</p>}
          <ul>
            {online.map((p) => (
              <li key={p.userId}>
                <Link to={`/jogador/${p.userId}`}>
                  <span className="friend-status-dot friend-status-online" />
                  {p.nickname}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
