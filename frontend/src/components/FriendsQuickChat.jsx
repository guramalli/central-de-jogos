import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import DmModal from "./DmModal.jsx";

// Botão flutuante de "conversar com amigos" — usado dentro das salas de
// jogo, pra dar pra falar no privado com alguém sem sair da partida. Usa o
// mesmo socket já conectado da sala (Socket.IO permite ficar em várias
// "salas" ao mesmo tempo numa única conexão, sem conflito).
export default function FriendsQuickChat() {
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState(null);
  const [chatWith, setChatWith] = useState(null);

  useEffect(() => {
    if (!open) return;
    api.get("/friends").then(({ data }) => setFriends(data.friends || [])).catch(() => setFriends([]));

    function close() {
      setOpen(false);
    }
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="friends-quick-chat">
      <button
        className="quiz-mute-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        title="Conversar com amigos"
      >
        💬
      </button>
      {open && (
        <div className="friends-quick-popover" onClick={(e) => e.stopPropagation()}>
          <h4>Seus amigos</h4>
          {friends === null && <p className="friends-quick-empty">Carregando...</p>}
          {friends?.length === 0 && (
            <p className="friends-quick-empty">Você ainda não tem amigos adicionados.</p>
          )}
          {friends?.map((f) => (
            <button
              key={f.userId}
              className="friends-quick-item"
              onClick={() => {
                setChatWith(f);
                setOpen(false);
              }}
            >
              <span className={`friend-status-dot ${f.online ? "friend-status-online" : "friend-status-offline"}`} />
              {f.nickname}
            </button>
          ))}
        </div>
      )}
      {chatWith && <DmModal friend={chatWith} onClose={() => setChatWith(null)} />}
    </div>
  );
}
