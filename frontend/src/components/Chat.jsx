import { useState, useRef, useEffect } from "react";

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

export default function Chat({ messages, onSend }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <div className="chat-box">
      <div className="chat-messages">
        {messages.map((m, i) =>
          m.system ? (
            <div key={i} className={`chat-system-msg ${m.bold ? "chat-system-msg-bold" : ""}`}>
              — {m.message} —
            </div>
          ) : (
            <div key={i} className="chat-user-msg">
              <strong style={{ color: colorForUser(m.userId || m.nickname) }}>{m.nickname}:</strong>{" "}
              {m.message}
            </div>
          )
        )}
        <div ref={endRef} />
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <input placeholder="Digite uma mensagem..." value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn" type="submit">Enviar</button>
      </form>
    </div>
  );
}
