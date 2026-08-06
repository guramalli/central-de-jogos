import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import AdminGlossary from "../components/AdminGlossary.jsx";
import AdminQuizGlossary from "../components/AdminQuizGlossary.jsx";

const QUIZ_THEME_NAMES = {
  esportes: "Esportes",
  ciencias: "Ciências",
  historia: "História",
  cinema: "Cinema",
  letras: "Letras",
};

export default function Admin() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [quizPending, setQuizPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [error, setError] = useState("");

  async function loadPending() {
    try {
      const { data } = await api.get("/admin/glossary/pending");
      setPending(data);
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao carregar pendências.");
    }
  }

  async function loadQuizPending() {
    try {
      const { data } = await api.get("/admin/quiz-questions/pending");
      setQuizPending(data);
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao carregar pendências do quiz.");
    }
  }

  async function loadUsers() {
    if (user.role !== "ADMIN") return;
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch {
      // moderadores não têm acesso a essa lista; ignore
    }
  }

  async function loadFeedbacks() {
    try {
      const { data } = await api.get("/admin/feedback");
      setFeedbacks(data);
    } catch (e) {
      // silencioso — não é crítico
    }
  }

  useEffect(() => {
    loadPending();
    loadQuizPending();
    loadUsers();
    loadFeedbacks();
  }, []);

  async function approve(id) {
    await api.post(`/admin/glossary/${id}/approve`);
    loadPending();
  }
  async function reject(id) {
    await api.post(`/admin/glossary/${id}/reject`);
    loadPending();
  }

  async function approveQuiz(id) {
    await api.post(`/admin/quiz-questions/${id}/approve`);
    loadQuizPending();
  }
  async function rejectQuiz(id) {
    await api.post(`/admin/quiz-questions/${id}/reject`);
    loadQuizPending();
  }

  async function changeRole(id, role) {
    await api.post(`/admin/users/${id}/role`, { role });
    loadUsers();
  }

  if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
    return <p>Acesso restrito a moderadores e administradores.</p>;
  }

  return (
    <div>
      <h1>Painel Admin — Educação Gamer</h1>
      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        <h2>💬 Feedback dos jogadores ({feedbacks.length})</h2>
        <table className="player-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Jogador</th>
              <th>Mensagem</th>
              <th>Quando</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((f) => (
              <tr key={f.id}>
                <td>{f.type === "bug" ? "🐛 Bug" : f.type === "ideia" ? "💡 Ideia" : "✉️ Outro"}</td>
                <td>{f.user?.nickname} <span style={{ color: "var(--text-dim)", fontSize: 11 }}>({f.user?.email})</span></td>
                <td>{f.message}</td>
                <td style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {new Date(f.createdAt).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
            {feedbacks.length === 0 && (
              <tr>
                <td colSpan={4} style={{ color: "var(--text-dim)" }}>Nenhum feedback enviado ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Palavras pendentes de aprovação (Stop)</h2>
        <table className="player-table">
          <thead>
            <tr>
              <th>Tema</th>
              <th>Letra</th>
              <th>Palavra</th>
              <th>Sugerida por</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((p) => (
              <tr key={p.id}>
                <td>{p.theme.name}</td>
                <td>{p.letter}</td>
                <td>{p.word}</td>
                <td>{p.suggestedBy?.nickname || "—"}</td>
                <td>
                  <button className="btn success" onClick={() => approve(p.id)}>Aprovar</button>{" "}
                  <button className="btn secondary" onClick={() => reject(p.id)}>Rejeitar</button>
                </td>
              </tr>
            ))}
            {pending.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: "var(--text-dim)" }}>Nenhuma pendência.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminGlossary />

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Perguntas pendentes de aprovação (Quiz)</h2>
        <table className="player-table">
          <thead>
            <tr>
              <th>Tema</th>
              <th>Pergunta</th>
              <th>Resposta</th>
              <th>Sugerida por</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {quizPending.map((q) => (
              <tr key={q.id}>
                <td>{QUIZ_THEME_NAMES[q.themeKey] || q.themeKey}</td>
                <td>{q.question}</td>
                <td>{q.answer}</td>
                <td>{q.suggestedBy?.nickname || "—"}</td>
                <td>
                  <button className="btn success" onClick={() => approveQuiz(q.id)}>Aprovar</button>{" "}
                  <button className="btn secondary" onClick={() => rejectQuiz(q.id)}>Rejeitar</button>
                </td>
              </tr>
            ))}
            {quizPending.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: "var(--text-dim)" }}>Nenhuma pendência.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminQuizGlossary />

      {user.role === "ADMIN" && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Usuários</h2>
          <table className="player-table">
            <thead>
              <tr>
                <th>Nickname</th>
                <th>E-mail</th>
                <th>Role</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.nickname}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                      <option value="PLAYER">PLAYER</option>
                      <option value="MODERATOR">MODERATOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
