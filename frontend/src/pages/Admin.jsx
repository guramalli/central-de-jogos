import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import AdminGlossary from "../components/AdminGlossary.jsx";

export default function Admin() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  async function loadPending() {
    try {
      const { data } = await api.get("/admin/glossary/pending");
      setPending(data);
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao carregar pendências.");
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

  useEffect(() => {
    loadPending();
    loadUsers();
  }, []);

  async function approve(id) {
    await api.post(`/admin/glossary/${id}/approve`);
    loadPending();
  }
  async function reject(id) {
    await api.post(`/admin/glossary/${id}/reject`);
    loadPending();
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
        <h2>Palavras pendentes de aprovação</h2>
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
