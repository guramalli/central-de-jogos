import { useEffect, useState } from "react";
import { api } from "../api/client.js";

// Envolve qualquer conteúdo (normalmente um nickname) e adiciona um menu de
// clique direito com a opção "Convidar para o clã". O backend confere se
// quem está convidando é mesmo dono de um clã — aqui só chamamos a API.
export default function ClanInviteMenu({ children, userId, nickname, currentUserId }) {
  const [menuPos, setMenuPos] = useState(null); // {x,y} | null
  const [status, setStatus] = useState(null); // null | "sending" | "sent" | mensagem de erro

  useEffect(() => {
    if (!menuPos) return;
    const close = () => setMenuPos(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuPos]);

  function handleContextMenu(e) {
    if (!userId || userId === currentUserId) return; // não convida a si mesmo
    e.preventDefault();
    setStatus(null);
    setMenuPos({ x: e.clientX, y: e.clientY });
  }

  async function invite(e) {
    e.stopPropagation();
    setStatus("sending");
    try {
      await api.post("/clans/invite", { userId });
      setStatus("sent");
    } catch (err) {
      setStatus(err.response?.data?.error || "Erro ao convidar.");
    }
  }

  return (
    <span onContextMenu={handleContextMenu} className="clan-invite-trigger">
      {children}
      {menuPos && (
        <div
          className="clan-context-menu"
          style={{ top: menuPos.y, left: menuPos.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {!status && (
            <button className="clan-context-menu-item" onClick={invite}>
              🚩 Convidar {nickname} para o clã
            </button>
          )}
          {status === "sending" && <div className="clan-context-menu-msg">Enviando...</div>}
          {status === "sent" && <div className="clan-context-menu-msg clan-context-menu-ok">✓ Convite enviado!</div>}
          {status && status !== "sending" && status !== "sent" && (
            <div className="clan-context-menu-msg clan-context-menu-error">{status}</div>
          )}
        </div>
      )}
    </span>
  );
}
