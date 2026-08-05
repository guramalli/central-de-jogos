import { useState, useRef, useEffect } from "react";

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
            <div key={i}>
              <strong>{m.nickname}:</strong> {m.message}
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
