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
  { key: "series", name: "Séries e Streaming" },
  { key: "novelas", name: "Novelas" },
  { key: "geografia", name: "Geografia" },
  { key: "direito", name: "Direito" },
  { key: "futebol", name: "Futebol" },
  { key: "automobilismo", name: "Automobilismo" },
  { key: "anime", name: "Anime e HQ" },
  { key: "terceirao", name: "Terceirão" },
  { key: "games", name: "Games" },
  { key: "mitologia", name: "Mitologia e Religião" },
];
const THEME_NAME_BY_KEY = Object.fromEntries(THEMES.map((t) => [t.key, t.name]));

const STATUS_LABELS = { approved: "Aprovada", pending: "Pendente", rejected: "Rejeitada" };
const PAGE_SIZE = 20;

// Índice de perguntas do Quiz por tema, no mesmo espírito do índice de
// palavras do Stop: escolhe um tema, adiciona pergunta+resposta direto (já
// aprovada), vê/edita/apaga as que já existem — ou busca por qualquer
// pergunta/resposta em TODOS os temas de uma vez, sem precisar navegar.
export default function AdminQuizGlossary() {
  const [themeKey, setThemeKey] = useState(THEMES[0].key);
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(1);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("medio");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null); // null = busca não feita ainda
  const [searching, setSearching] = useState(false);

  // Edição inline — compartilhada entre a busca e a lista por tema (só uma
  // pergunta pode estar sendo editada por vez).
  const [editingId, setEditingId] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("medio");

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
      await api.post("/admin/quiz-questions", { themeKey, question: newQuestion, answer: newAnswer, difficulty: newDifficulty });
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
    if (!window.confirm("Apagar essa pergunta de vez?")) return;
    await api.delete(`/admin/quiz-questions/${id}`);
    loadQuestions();
    if (searchResults) handleSearch();
  }

  async function handleSearch(e) {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const { data } = await api.get("/admin/quiz-questions/search", { params: { q: searchQuery.trim() } });
      setSearchResults(data);
    } catch {
      setError("Erro ao buscar perguntas.");
    } finally {
      setSearching(false);
    }
  }

  function startEdit(q) {
    setEditingId(q.id);
    setEditQuestion(q.question);
    setEditAnswer(q.answer);
    setEditDifficulty(q.difficulty || "medio");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id) {
    if (!editQuestion.trim() || !editAnswer.trim()) return;
    try {
      await api.patch(`/admin/quiz-questions/${id}`, {
        question: editQuestion,
        answer: editAnswer,
        difficulty: editDifficulty,
      });
      setEditingId(null);
      await loadQuestions();
      if (searchResults) handleSearch();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao salvar edição.");
    }
  }

  const DIFFICULTY_LABELS = { facil: "🟢 Fácil", medio: "🟡 Médio", dificil: "🔴 Difícil" };

  function renderRow(q, showTheme) {
    const isEditing = editingId === q.id;
    return (
      <tr key={q.id}>
        {showTheme && <td>{THEME_NAME_BY_KEY[q.themeKey] || q.themeKey}</td>}
        {isEditing ? (
          <>
            <td>
              <textarea
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                maxLength={300}
                rows={2}
                style={{ width: "100%", marginBottom: 0 }}
              />
            </td>
            <td>
              <input value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} maxLength={60} style={{ marginBottom: 0 }} />
            </td>
            <td>
              <select value={editDifficulty} onChange={(e) => setEditDifficulty(e.target.value)} style={{ marginBottom: 0 }}>
                <option value="facil">🟢 Fácil</option>
                <option value="medio">🟡 Médio</option>
                <option value="dificil">🔴 Difícil</option>
              </select>
            </td>
            <td>
              <button className="btn success" onClick={() => saveEdit(q.id)}>Salvar</button>{" "}
              <button className="btn secondary" onClick={cancelEdit}>Cancelar</button>
            </td>
          </>
        ) : (
          <>
            <td>{q.question}</td>
            <td>{q.answer}</td>
            <td>{DIFFICULTY_LABELS[q.difficulty] || q.difficulty}</td>
            {!showTheme && (
              <td className={q.status !== "approved" ? "word-text-blank" : ""}>
                {STATUS_LABELS[q.status] || q.status}
              </td>
            )}
            <td>
              <button className="btn secondary" onClick={() => startEdit(q)}>Editar</button>{" "}
              <button className="btn secondary admin-word-del" onClick={() => handleDelete(q.id)} title="Remover">
                ✕
              </button>
            </td>
          </>
        )}
      </tr>
    );
  }

  const totalPages = Math.max(1, Math.ceil(questions.length / PAGE_SIZE));
  const pageItems = questions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      {/* Recolhido por padrão, mesmo motivo do glossário do Stop: é uma
          tabela longa que raramente precisa ficar aberta. */}
      <details className="admin-recolhivel">
        <summary>Índice de perguntas do Quiz</summary>
      {error && <div className="error-msg">{error}</div>}

      <h3>Buscar pergunta (em todos os temas)</h3>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Digite parte da pergunta ou resposta..."
          style={{ marginBottom: 0 }}
        />
        <button className="btn" type="submit" disabled={searching}>Buscar</button>
      </form>

      {searchResults !== null && (
        <div style={{ marginTop: 12 }}>
          <table className="player-table player-table-compact">
            <thead>
              <tr>
                <th>Tema</th>
                <th>Pergunta</th>
                <th>Resposta</th>
                <th>Dificuldade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((q) => renderRow(q, true))}
              {searchResults.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: "var(--text-dim)" }}>Nenhuma pergunta encontrada com esse termo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <hr style={{ margin: "20px 0", borderColor: "var(--border)" }} />

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
        <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Dificuldade</label>
        <select value={newDifficulty} onChange={(e) => setNewDifficulty(e.target.value)}>
          <option value="facil">🟢 Fácil</option>
          <option value="medio">🟡 Médio</option>
          <option value="dificil">🔴 Difícil</option>
        </select>
        <button className="btn" type="submit" disabled={saving}>Adicionar (já aprovada)</button>
      </form>

      <h3 style={{ marginTop: 20 }}>Perguntas cadastradas neste tema ({questions.length})</h3>
      <table className="player-table player-table-compact">
        <thead>
          <tr>
            <th>Pergunta</th>
            <th>Resposta</th>
            <th>Dificuldade</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((q) => renderRow(q, false))}
          {questions.length === 0 && (
            <tr>
              <td colSpan={5} style={{ color: "var(--text-dim)" }}>Nenhuma pergunta cadastrada ainda neste tema.</td>
            </tr>
          )}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </details>
    </div>
  );
}
