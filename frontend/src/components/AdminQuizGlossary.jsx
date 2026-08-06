import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Pagination from "./Pagination.jsx";

const THEMES = [
  { key: "esportes", name: "Esportes" },
  { key: "ciencias", name: "Ciências" },
  { key: "historia", name: "História" },
  { key: "cinema", name: "Cinema" },
  { key: "letras", name: "Letras" },
  { key: "geral", name: "Conhecimentos Gerais" },
  { key: "musica", name: "Música" },
  { key: "series", name: "Séries e TV" },
  { key: "novelas", name: "Novelas" },
  { key: "geografia", name: "Geografia" },
];

const STATUS_LABELS = { approved: "Aprovada", pending: "Pendente", rejected: "Rejeitada" };
const PAGE_SIZE = 20;

// Índice de perguntas do Quiz por tema, no mesmo espírito do índice de
// palavras do Stop: escolhe um tema, adiciona pergunta+resposta direto (já
// aprovada), e vê/apaga as que já existem logo abaixo.
export default function AdminQuizGlossary() {
  const [themeKey, setThemeKey] = useState(THEMES[0].key);
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(1);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadQuestions();
    setPage(1);
  }, [themeKey]);

  async function loadQuestions() {
    const { data } = await api.get("/admin/quiz-questions", { params: { themeKey } });
    setQuestions(data);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/admin/quiz-questions", { themeKey, question: newQuestion, answer: newAnswer });
      setNewQuestion("");
      setNewAnswer("");
      await loadQuestions();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao salvar pergunta.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await api.delete(`/admin/quiz-questions/${id}`);
    loadQuestions();
  }

  const totalPages = Math.max(1, Math.ceil(questions.length / PAGE_SIZE));
  const pageItems = questions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2>Índice de perguntas do Quiz</h2>
      {error && <div className="error-msg">{error}</div>}

      <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Tema</label>
      <select value={themeKey} onChange={(e) => setThemeKey(e.target.value)}>
        {THEMES.map((t) => (
          <option key={t.key} value={t.key}>{t.name}</option>
        ))}
      </select>

      <form onSubmit={handleAdd} style={{ marginTop: 12 }}>
        <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Nova pergunta</label>
        <textarea
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          maxLength={300}
          rows={2}
          placeholder="Digite a pergunta..."
          style={{ width: "100%", marginBottom: 8 }}
        />
        <input
          value={newAnswer}
          onChange={(e) => setNewAnswer(e.target.value)}
          maxLength={60}
          placeholder="Resposta certa"
        />
        <button className="btn" type="submit" disabled={saving}>Adicionar (já aprovada)</button>
      </form>

      <h3 style={{ marginTop: 20 }}>Perguntas cadastradas neste tema ({questions.length})</h3>
      <table className="player-table player-table-compact">
        <thead>
          <tr>
            <th>Pergunta</th>
            <th>Resposta</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((q) => (
            <tr key={q.id}>
              <td>{q.question}</td>
              <td>{q.answer}</td>
              <td className={q.status !== "approved" ? "word-text-blank" : ""}>
                {STATUS_LABELS[q.status] || q.status}
              </td>
              <td>
                <button className="btn secondary admin-word-del" onClick={() => handleDelete(q.id)} title="Remover">
                  ✕
                </button>
              </td>
            </tr>
          ))}
          {questions.length === 0 && (
            <tr>
              <td colSpan={4} style={{ color: "var(--text-dim)" }}>Nenhuma pergunta cadastrada ainda neste tema.</td>
            </tr>
          )}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
