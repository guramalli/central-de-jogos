import { useState } from "react";
import { api } from "../api/client.js";

export default function FeedbackModal({ onClose }) {
  const [type, setType] = useState("ideia");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null); // null | "sending" | "ok" | mensagem de erro

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    try {
      await api.post("/feedback", { type, message });
      setStatus("ok");
      setMessage("");
    } catch (err) {
      setStatus(err.response?.data?.error || "Erro ao enviar. Tenta de novo?");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>💬 Enviar feedback</h2>
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
          Ideia de melhoria, bug encontrado, ou qualquer outra coisa — sua mensagem vai direto pra
          quem cuida do site.
        </p>

        {status === "ok" ? (
          <div className="feedback-ok">
            <p>✓ Obrigado! Sua mensagem foi enviada.</p>
            <button className="btn" onClick={onClose}>Fechar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="register-label">Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="ideia">💡 Ideia de atualização</option>
              <option value="bug">🐛 Aviso de bug</option>
              <option value="outro">✉️ Outro</option>
            </select>

            <label className="register-label">Mensagem</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="Conta com detalhes..."
              required
              style={{ width: "100%" }}
            />

            <button className="btn" type="submit" disabled={status === "sending"} style={{ marginTop: 10 }}>
              {status === "sending" ? "Enviando..." : "Enviar"}
            </button>
            {status && status !== "sending" && status !== "ok" && (
              <div className="error-msg" style={{ marginTop: 8 }}>{status}</div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
