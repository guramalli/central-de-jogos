import { useState } from "react";
import { api } from "../api/client.js";

// Formulário compacto (expansível) pra jogador sugerir uma pergunta nova pro
// tema da sala em que está. Entra como pendente até um admin aprovar.
export default function SuggestQuestionForm({ themeKey }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState(null); // null | "sending" | "ok" | mensagem de erro

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    try {
      await api.post("/quiz-questions/suggest", { themeKey, question, answer });
      setStatus("ok");
      setQuestion("");
      setAnswer("");
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus(err.response?.data?.error || "Erro ao enviar sugestão.");
    }
  }

  if (!open) {
    return (
      <button className="quiz-suggest-toggle" onClick={() => setOpen(true)}>
        💡 Sugerir uma pergunta pra esse tema
      </button>
    );
  }

  return (
    <div className="quiz-panel quiz-suggest-panel">
      <h4 className="quiz-panel-title">💡 Sugerir pergunta</h4>
      <form onSubmit={handleSubmit} className="quiz-suggest-form">
        <textarea
          placeholder="Digite a pergunta..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={300}
          rows={2}
          required
        />
        <input
          placeholder="Resposta certa (curta)"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          maxLength={60}
          required
        />
        <div className="quiz-suggest-actions">
          <button className="btn" type="submit" disabled={status === "sending"}>
            Enviar sugestão
          </button>
          <button className="btn secondary" type="button" onClick={() => setOpen(false)}>
            Cancelar
          </button>
        </div>
        {status === "ok" && <div className="quiz-suggest-msg quiz-suggest-ok">✓ Enviada! Um admin vai revisar.</div>}
        {status && status !== "sending" && status !== "ok" && (
          <div className="quiz-suggest-msg quiz-suggest-error">{status}</div>
        )}
      </form>
    </div>
  );
}
