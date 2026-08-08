import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api/client.js";
import DmModal from "./DmModal.jsx";

// Botão flutuante de "conversar com amigos" — usado dentro das salas de
// jogo, pra dar pra falar no privado com alguém sem sair da partida. Usa o
// mesmo socket já conectado da sala (Socket.IO permite ficar em várias
// "salas" ao mesmo tempo numa única conexão, sem conflito).
//
// A lista de amigos abre num fundo clicável cobrindo a tela toda (mesma
// técnica usada no modal de mensagem privada) — evita qualquer bug de
// "clique fora fecha sozinho", já que não depende de nenhum ouvinte de
// evento global nem cálculo de posição via JavaScript.
export default function FriendsQuickChat() {
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState(null);
  const [chatWith, setChatWith] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

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

  function handleOpen() {
    setOpen(true);
    api.get("/friends").then(({ data }) => setFriends(data.friends || [])).catch(() => setFriends([]));
  }

  return (
    <div className="friends-quick-chat friends-quick-chat-floating">
      <button className="friends-quick-fab" onClick={handleOpen} title="Conversar com amigos">
        💬
        {unreadCount > 0 && <span className="friends-quick-fab-badge">{unreadCount}</span>}
      </button>

      {open &&
        createPortal(
          <div className="friends-quick-overlay" onClick={() => setOpen(false)}>
            <div className="friends-quick-popover" onClick={(e) => e.stopPropagation()}>
              <div className="friends-quick-popover-header">
                <h4>Seus amigos</h4>
                <button className="friends-quick-popover-close" onClick={() => setOpen(false)}>✕</button>
              </div>
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
          </div>,
          document.body
        )}

      {chatWith && <DmModal friend={chatWith} onClose={() => setChatWith(null)} />}
    </div>
  );
}
