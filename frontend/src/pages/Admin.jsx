import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import AdminGlossary from "../components/AdminGlossary.jsx";
import AdminQuizGlossary from "../components/AdminQuizGlossary.jsx";
import Pagination from "../components/Pagination.jsx";
import Seo from "../components/Seo.jsx";

const PAGE_SIZE = 20;

const REPORT_REASON_LABELS = {
  tema_errado: "Não é desse tema",
  resposta_errada: "Resposta errada",
  escrita: "Erro de escrita",
  outro: "Outro problema",
};

const QUIZ_THEME_NAMES = {
  esportes: "Esportes",
  ciencias: "Ciências",
  historia: "História",
  cinema: "Cinema",
  letras: "Letras",
  geral: "Conhecimentos Gerais",
  musica: "Música",
  series: "Séries e Streaming",
  novelas: "Novelas",
  geografia: "Geografia",
  direito: "Direito",
  futebol: "Futebol",
  automobilismo: "Automobilismo",
  anime: "Anime e HQ",
};

export default function Admin() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [quizPending, setQuizPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [feedbacks, setFeedbacks] = useState([]);
  const [suspicious, setSuspicious] = useState([]);
  const [online, setOnline] = useState(null);
  const [questionReports, setQuestionReports] = useState([]);
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

  async function loadSuspicious() {
    if (user.role !== "ADMIN") return;
    try {
      const { data } = await api.get("/admin/suspicious-activity");
      setSuspicious(data);
    } catch {
      // silencioso — não é crítico
    }
  }

  // Descarta os registros de atividade suspeita de um jogador — usado
  // quando o admin revisa e conclui que foi alarme falso.
  async function ignorarSuspeita(user) {
    const ok = window.confirm(
      `Descartar os alertas de atividade suspeita de "${user.nickname}"?\n\n` +
        "Os registros serão apagados e a pessoa some desta lista. " +
        "A conta dela NÃO é afetada."
    );
    if (!ok) return;
    try {
      await api.delete(`/admin/suspicious-activity/${user.id}`);
      loadSuspicious();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao descartar os alertas.");
    }
  }

  async function loadOnline() {
    try {
      const { data } = await api.get("/admin/online");
      setOnline(data);
    } catch {
      // silencioso — não é crítico
    }
  }

  async function loadQuestionReports() {
    try {
      const { data } = await api.get("/admin/question-reports");
      setQuestionReports(data);
    } catch {
      // silencioso — não é crítico
    }
  }

  async function resolveQuestionReport(questionId) {
    try {
      await api.post(`/admin/question-reports/${questionId}/resolve`);
      loadQuestionReports();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao marcar como resolvido.");
    }
  }

  useEffect(() => {
    loadPending();
    loadQuizPending();
    loadUsers();
    loadFeedbacks();
    loadSuspicious();
    loadQuestionReports();
    loadOnline();
    // Atualiza sozinho, pra dar pra acompanhar o movimento em tempo real
    // durante uma divulgação ou live sem precisar recarregar a página.
    const timer = setInterval(loadOnline, 15000);
    return () => clearInterval(timer);
  }, []);

  async function deleteFeedback(id) {
    await api.delete(`/admin/feedback/${id}`);
    loadFeedbacks();
  }

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

  async function toggleBan(u) {
    const action = u.banned ? "desbanir" : "banir";
    if (!window.confirm(`Tem certeza que quer ${action} "${u.nickname}"?`)) return;
    try {
      await api.post(`/admin/users/${u.id}/ban`, { banned: !u.banned });
      loadUsers();
      loadSuspicious();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao alterar banimento.");
    }
  }

  async function deleteUser(u) {
    const confirmText = window.prompt(
      `Isso vai apagar PERMANENTEMENTE a conta "${u.nickname}" e todo o histórico dela (pontos, mensagens, sugestões). Não tem como desfazer.\n\nDigite o nickname "${u.nickname}" pra confirmar:`
    );
    if (confirmText !== u.nickname) {
      if (confirmText !== null) alert("Nickname não confere — nada foi apagado.");
      return;
    }
    try {
      await api.delete(`/admin/users/${u.id}`);
      loadUsers();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao apagar usuário.");
    }
  }

  if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
    return <p>Acesso restrito a moderadores e administradores.</p>;
  }

  return (
    <div>
      <Seo title="Painel Admin" />
      <h1>Painel Admin — Educação Gamer</h1>

      <div className="card admin-online-card">
        <div className="admin-online-head">
          <h2>🟢 Online agora</h2>
          <button className="btn secondary admin-online-refresh" onClick={loadOnline}>
            Atualizar
          </button>
        </div>

        {!online ? (
          <p style={{ color: "var(--text-dim)" }}>Carregando...</p>
        ) : (
          <>
            <div className="admin-online-numbers">
              <div className="admin-online-stat">
                <strong>{online.total}</strong>
                <span>no site</span>
              </div>
              <div className="admin-online-stat">
                <strong>{online.jogando}</strong>
                <span>em partida</span>
              </div>
              <div className="admin-online-stat">
                <strong>{online.registrados}</strong>
                <span>com conta</span>
              </div>
              <div className="admin-online-stat">
                <strong>{online.visitantes}</strong>
                <span>visitantes</span>
              </div>
            </div>

            {online.jogadores.length === 0 ? (
              <p style={{ color: "var(--text-dim)", marginTop: 12 }}>
                Ninguém online no momento.
              </p>
            ) : (
              <div className="admin-online-list">
                {online.jogadores.map((p) => (
                  <div key={p.userId} className="admin-online-row">
                    <span className="admin-online-nick">
                      {p.nickname}
                      {p.isGuest && <span className="admin-online-guest">visitante</span>}
                    </span>
                    <span className="admin-online-where">{p.local}</span>
                  </div>
                ))}
              </div>
            )}
            {online.ocultos > 0 && (
              <p className="admin-online-note">
                Mostrando os {online.jogadores.length} primeiros · mais {online.ocultos} online
              </p>
            )}
            <p className="admin-online-note">Atualiza sozinho a cada 15 segundos.</p>
          </>
        )}
      </div>
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
              <th>Ações</th>
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
                <td>
                  <button className="btn secondary admin-word-del" onClick={() => deleteFeedback(f.id)} title="Apagar">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {feedbacks.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: "var(--text-dim)" }}>Nenhum feedback enviado ainda.</td>
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
              <th>Origem / Motivo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {quizPending.map((q) => (
              <tr key={q.id}>
                <td>{QUIZ_THEME_NAMES[q.themeKey] || q.themeKey}</td>
                <td>{q.question}</td>
                <td>{q.answer}</td>
                <td>
                  {q.validationNote ? (
                    <span style={{ color: "var(--accent)" }}>🤖 {q.validationNote}</span>
                  ) : (
                    q.suggestedBy?.nickname || "—"
                  )}
                </td>
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
          <h2>Usuários ({users.length})</h2>
          <table className="player-table player-table-compact">
            <thead>
              <tr>
                <th>Nickname</th>
                <th>E-mail</th>
                <th>Cadastrado em</th>
                <th>Role</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.slice((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE).map((u) => (
                <tr key={u.id}>
                  <td>{u.nickname}</td>
                  <td>{u.email}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td>{u.role}</td>
                  <td>
                    {u.banned ? <span style={{ color: "var(--accent)" }}>🚫 Banido</span> : <span style={{ color: "#06d6a0" }}>✓ Ativo</span>}
                  </td>
                  <td style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                      <option value="PLAYER">PLAYER</option>
                      <option value="MODERATOR">MODERATOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    {u.role !== "ADMIN" && (
                      <>
                        <button className="btn secondary" onClick={() => toggleBan(u)}>
                          {u.banned ? "Desbanir" : "Banir"}
                        </button>
                        <button className="btn secondary admin-word-del" onClick={() => deleteUser(u)} title="Apagar permanentemente">
                          ✕
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={usersPage}
            totalPages={Math.max(1, Math.ceil(users.length / PAGE_SIZE))}
            onChange={setUsersPage}
          />
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <h2>🚩 Perguntas reportadas ({questionReports.length})</h2>
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
          Perguntas que jogadores sinalizaram com problema. A com mais denúncias aparece primeiro.
          Corrija pelo índice de perguntas acima e depois marque como resolvida aqui.
        </p>
        {questionReports.length === 0 && (
          <p style={{ color: "var(--text-dim)" }}>Nenhuma pergunta reportada no momento. 🎉</p>
        )}
        {questionReports.map((g) => (
          <div key={g.questionId} className="report-group">
            <div className="report-group-head">
              <div>
                <strong>{g.question.question}</strong>
                <div style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 2 }}>
                  Resposta: <strong>{g.question.answer}</strong> · Tema: {g.question.themeKey} ·{" "}
                  <span style={{ color: "var(--accent)" }}>{g.count} denúncia(s)</span>
                </div>
              </div>
              <button className="btn secondary" onClick={() => resolveQuestionReport(g.questionId)}>
                Marcar resolvida
              </button>
            </div>
            <ul className="report-group-list">
              {g.reports.map((r) => (
                <li key={r.id}>
                  <strong>{r.nickname}</strong>: {REPORT_REASON_LABELS[r.reason] || r.reason}
                  {r.comment && <span style={{ color: "var(--text-dim)" }}> — "{r.comment}"</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {user.role === "ADMIN" && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>🕵️ Atividade suspeita (Stop)</h2>
          <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
            Sinais de possível uso de ferramentas externas (colar resposta, ou acertar tudo sem
            nenhuma correção com tempo sobrando). <strong>Nada aqui é bloqueado automaticamente</strong> —
            é só pra você revisar e decidir.
          </p>
          <table className="player-table">
            <thead>
              <tr>
                <th>Jogador</th>
                <th>Colou texto</th>
                <th>"Bom demais"</th>
                <th>Total</th>
                <th>Última vez</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {suspicious.map((g) => (
                <tr key={g.user.id}>
                  <td>{g.user.nickname} {g.user.banned && <span style={{ color: "var(--accent)" }}>(banido)</span>}</td>
                  <td>{g.pasteCount}</td>
                  <td>{g.tooPerfectCount}</td>
                  <td><strong>{g.count}</strong></td>
                  <td style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    {new Date(g.latest).toLocaleString("pt-BR")}
                  </td>
                  <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button className="btn secondary" onClick={() => toggleBan(g.user)}>
                      {g.user.banned ? "Desbanir" : "Banir"}
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() => ignorarSuspeita(g.user)}
                      title="Descartar os registros — a conta não é afetada"
                    >
                      Ignorar
                    </button>
                  </td>
                </tr>
              ))}
              {suspicious.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--text-dim)" }}>Nenhum sinal registrado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
