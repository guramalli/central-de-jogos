import { useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api/client.js";

const REASONS = [
  { key: "tema_errado", label: "A pergunta não é desse tema" },
  { key: "resposta_errada", label: "A resposta está errada" },
  { key: "escrita", label: "Erro de escrita / digitação" },
  { key: "outro", label: "Outro problema" },
];

// Modal pra jogador sinalizar problema numa pergunta — vai pro painel admin
// revisar. A pergunta continua no ar até alguém decidir o que fazer com ela.
export default function ReportQuestionModal({ questionId, questionText, onClose }) {
  const [reason, setReason] = useState("tema_errado");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const { data } = await api.post("/quiz-questions/report", { questionId, reason, comment });
      setSent(data.message || "Obrigado! O time vai revisar essa pergunta.");
      setTimeout(onClose, 2200);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao enviar. Tenta de novo?");
    } finally {
      setSending(false);
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3>🚩 Reportar problema na pergunta</h3>

        {sent ? (
          <p style={{ color: "#06d6a0" }}>✓ {sent}</p>
        ) : (
          <>
            <p className="report-question-preview">"{questionText}"</p>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="report-reason-list">
                {REASONS.map((r) => (
                  <label key={r.key} className="report-reason-item">
                    <input
                      type="radio"
                      name="reason"
                      value={r.key}
                      checked={reason === r.key}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
              <textarea
                placeholder="Quer detalhar? (opcional)"
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 300))}
                rows={3}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="btn secondary" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn" disabled={sending}>
                  {sending ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
