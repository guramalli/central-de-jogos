import { useState, useRef, useEffect } from "react";
import EmojiPicker from "./EmojiPicker.jsx";

// Paleta de cores pra diferenciar cada jogador no chat — sempre a mesma cor
// pra mesma pessoa (calculada a partir do id dela), separando visualmente
// as falas dos jogadores das mensagens de histórico/sistema.
const NICK_COLORS = [
  "#ff6b6b", "#4ecdc4", "#ffd166", "#a78bfa", "#f78fb3",
  "#6bcf7f", "#ffa07a", "#5dade2", "#f4a261", "#c084fc",
];

function colorForUser(id) {
  if (!id) return "#ffb86f";
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return NICK_COLORS[Math.abs(hash) % NICK_COLORS.length];
}

function formatTime(at) {
  if (!at) return "";
  return new Date(at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// showTimestamp é opcional — só o Chat Geral (praça) usa isso por enquanto;
// os chats de dentro das salas de jogo continuam sem horário, do jeito que
// já estavam, pra não mudar nada ali sem ter sido pedido.
export default function Chat({ messages, onSend, showTimestamp = false }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    // Rola SÓ a caixa de mensagens, mexendo direto na posição dela — o
    // scrollIntoView (usado antes) podia arrastar a página inteira junto,
    // o que jogava a página inicial pra baixo assim que o chat carregava.
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <div className="chat-box">
      <div className="chat-messages" ref={listRef}>
        {messages.map((m, i) =>
          m.system ? (
            <div
              key={i}
              className={`chat-system-msg ${m.bold ? "chat-system-msg-bold" : ""} ${m.success ? "chat-system-msg-success" : ""} ${m.promotion ? "chat-system-msg-promotion" : ""}`}
            >
              — {m.message} —
            </div>
          ) : (
            <div key={i} className="chat-user-msg">
              {showTimestamp && <span className="chat-msg-time">{formatTime(m.at)}</span>}
              <strong style={{ color: colorForUser(m.userId || m.nickname) }}>{m.nickname}:</strong>{" "}
              {m.message}
            </div>
          )
        )}
        <div ref={endRef} />
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <EmojiPicker onSelect={(emoji) => setText((t) => t + emoji)} />
        <input placeholder="Digite uma mensagem..." value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn" type="submit">Enviar</button>
      </form>
    </div>
  );
}
