import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getSocket } from "../socket.js";
import Chat from "./Chat.jsx";
import { playMessageSound, isDmSoundMuted, toggleDmSoundMuted } from "../utils/sounds.js";

// Modal de conversa privada com um amigo — abre por cima da tela atual,
// usa o mesmo socket já conectado (não abre uma conexão nova).
export default function DmModal({ friend, onClose }) {
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(isDmSoundMuted());

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    socket.connect();
    socket.emit("join-dm", { friendUserId: friend.userId });

    socket.on("dm-history", (data) => {
      setMessages(data.messages || []);
      // O servidor já marcou as mensagens como lidas nesse exato momento —
      // avisa o resto do site (o avisinho no menu) pra atualizar na hora,
      // sem esperar o próximo ciclo automático de 30s.
      window.dispatchEvent(new Event("unread-counts-changed"));
    });
    socket.on("dm-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      // Só toca o som pra mensagem que CHEGOU do amigo — não quando é eco
      // da mensagem que eu mesmo acabei de mandar.
      if (msg.senderId === friend.userId) playMessageSound();
    });
    socket.on("dm-error", (data) => setError(data.error || "Erro ao abrir a conversa."));

    return () => {
      socket.off("dm-history");
      socket.off("dm-message");
      socket.off("dm-error");
      // Não desconecta o socket aqui — pode estar em uso por outra parte do
      // site (tipo o Chat Geral rodando em outra aba/página).
    };
  }, [friend.userId]);

  function sendMessage(text) {
    socketRef.current?.emit("dm-message", { message: text });
  }

  function handleToggleMute() {
    setMuted(toggleDmSoundMuted());
  }

  // Adapta as mensagens do formato do banco (senderId) pro formato que o
  // componente Chat já espera (userId + nickname), sem precisar mudar o Chat.
  const adaptedMessages = messages.map((m) => ({
    userId: m.senderId,
    nickname: m.senderId === friend.userId ? friend.nickname : "Você",
    message: m.message,
    at: m.at,
  }));

  return createPortal(
    <div className="dm-modal-overlay" onClick={onClose}>
      <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-modal-header">
          <h3>💬 {friend.nickname}</h3>
          <div className="dm-modal-header-actions">
            <button
              className="dm-modal-mute"
              onClick={handleToggleMute}
              title={muted ? "Ativar som de mensagens" : "Silenciar som de mensagens"}
            >
              {muted ? "🔇" : "🔊"}
            </button>
            <button className="dm-modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        {error && <div className="error-msg">{error}</div>}
        {!error && <Chat messages={adaptedMessages} onSend={sendMessage} showTimestamp />}
      </div>
    </div>,
    document.body
  );
}
