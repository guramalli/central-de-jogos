import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [coords, setCoords] = useState({ bottom: 0, right: 0 });
  const btnRef = useRef(null);

  // Confere de tempos em tempos se chegou mensagem nova, e também escuta o
  // evento disparado assim que uma conversa é aberta (marca como lida na
  // hora, sem esperar o próximo ciclo automático).
  useEffect(() => {
    function checkUnread() {
      api.get("/friends/messages/unread-count").then(({ data }) => setUnreadCount(data.count)).catch(() => {});
    }
    checkUnread();
    const interval = setInterval(checkUnread, 30000);
    window.addEventListener("unread-counts-changed", checkUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener("unread-counts-changed", checkUnread);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    api.get("/friends").then(({ data }) => setFriends(data.friends || [])).catch(() => setFriends([]));

    function close() {
      setOpen(false);
    }
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  function handleToggle(e) {
    e.stopPropagation();
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      // Calcula a partir da borda direita/inferior da JANELA (não do botão
      // em si), pra abrir sempre "pra cima" do botão flutuante, ficando
      // visível não importa em que canto da tela o botão esteja.
      setCoords({
        bottom: window.innerHeight - rect.top + 10,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((o) => !o);
  }

  return (
    <div className="friends-quick-chat friends-quick-chat-floating">
      <button ref={btnRef} className="friends-quick-fab" onClick={handleToggle} title="Conversar com amigos">
        💬
        {unreadCount > 0 && <span className="friends-quick-fab-badge">{unreadCount}</span>}
      </button>
      {open &&
        createPortal(
          <div
            className="friends-quick-popover friends-quick-popover-floating"
            style={{ bottom: coords.bottom, right: coords.right }}
            onClick={(e) => e.stopPropagation()}
          >
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
          </div>,
          document.body
        )}
      {chatWith && <DmModal friend={chatWith} onClose={() => setChatWith(null)} />}
    </div>
  );
}
