import { useEffect, useRef, useState } from "react";
import { getSocket } from "../socket.js";
import Chat from "./Chat.jsx";
import { playMessageSound, isDmSoundMuted, toggleDmSoundMuted } from "../utils/sounds.js";

// Painel de conversa privada — a MESMA lógica que estava dentro do DmModal,
// só que sem a moldura de modal.
//
// POR QUE FOI EXTRAÍDO:
// A página de Amigos passou a mostrar a conversa embutida, ao lado da lista,
// em vez de abrir um modal por cima. O modal continua existindo pros lugares
// onde a conversa é aberta de passagem (hover de perfil, barra do canto,
// painel admin) — ali abrir por cima faz sentido.
//
// Manter uma cópia da lógica em cada lugar levaria a corrigir um bug em um e
// esquecer o outro. Agora os dois usam este componente.
export default function ConversaPainel({ friend, aoLerMensagens }) {
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(isDmSoundMuted());

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    socket.connect();
    socket.emit("join-dm", { friendUserId: friend.userId });

    setMessages([]);
    setError("");

    socket.on("dm-history", (data) => {
      setMessages(data.messages || []);
      // O servidor marcou como lidas neste instante — avisa o resto do site
      // (o avisinho do menu, a lista ao lado) pra atualizar na hora.
      window.dispatchEvent(new Event("unread-counts-changed"));
      aoLerMensagens?.();
    });
    socket.on("dm-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      // Som só pra mensagem que CHEGOU — não pro eco da minha própria.
      if (msg.senderId === friend.userId) playMessageSound();
    });
    socket.on("dm-error", (data) => setError(data.error || "Erro ao abrir a conversa."));

    return () => {
      socket.off("dm-history");
      socket.off("dm-message");
      socket.off("dm-error");
      // Não desconecta: o socket pode estar em uso por outra parte do site.
    };
  }, [friend.userId]);

  function enviar(texto) {
    socketRef.current?.emit("dm-message", { message: texto });
  }

  // Adapta do formato do banco (senderId) pro que o Chat espera
  // (userId + nickname), sem precisar mexer no Chat.
  const adaptadas = messages.map((m) => ({
    userId: m.senderId,
    nickname: m.senderId === friend.userId ? friend.nickname : "Você",
    message: m.message,
    at: m.at,
  }));

  return (
    <div className="conversa-painel">
      <div className="conversa-painel-topo">
        <div className="conversa-painel-quem">
          <span className={`barra-msg-ponto ${friend.online ? "barra-msg-ponto-on" : ""}`} />
          <strong>{friend.nickname}</strong>
          <small>{friend.online ? "online" : "offline"}</small>
        </div>
        <button
          type="button"
          className="conversa-painel-som"
          onClick={() => setMuted(toggleDmSoundMuted())}
          title={muted ? "Ativar som de mensagem" : "Silenciar som de mensagem"}
        >
          <span className="material-symbols-outlined">
            {muted ? "notifications_off" : "notifications"}
          </span>
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {!error && <Chat messages={adaptadas} onSend={enviar} showTimestamp />}
    </div>
  );
}
