import { useEffect, useState } from "react";
import { api } from "../api/client.js";

// Revisão de perguntas parecidas: mostra os pares lado a lado pra decisão
// humana. Nem todo par é duplicata — "Copa de 1974" e "Copa de 1990" são
// parecidas no texto e legítimas —, então nada é apagado automaticamente.
export default function AdminQuizParecidas() {
  const [dados, setDados] = useState(null);
  const [limite, setLimite] = useState(60);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  // ids já resolvidos nesta sessão (apagados ou marcados como ok)
  const [resolvidos, setResolvidos] = useState(() => new Set());
  const [editando, setEditando] = useState(null); // { id, question, answer }
  const [salvando, setSalvando] = useState(false);

  function carregar(lim = limite) {
    setCarregando(true);
    setErro("");
    api
      .get(`/admin/quiz-parecidas?limite=${lim}`)
      .then(({ data }) => setDados(data))
      .catch((e) => setErro(e.response?.data?.error || "Erro ao carregar."))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar(limite);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limite]);

  async function apagar(id, texto) {
    if (!window.confirm(`Apagar esta pergunta?\n\n"${texto}"`)) return;
    try {
      await api.delete(`/admin/quiz-questions/${id}`);
      setResolvidos((prev) => new Set(prev).add(id));
    } catch (e) {
      alert(e.response?.data?.error || "Erro ao apagar.");
    }
  }

  async function salvarEdicao() {
    if (!editando.question.trim() || !editando.answer.trim()) {
      alert("Pergunta e resposta não podem ficar vazias.");
      return;
    }
    setSalvando(true);
    try {
      await api.patch(`/admin/quiz-questions/${editando.id}`, {
        question: editando.question,
        answer: editando.answer,
      });
      setEditando(null);
      carregar();
    } catch (e) {
      alert(e.response?.data?.error || "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando && !dados) return <div className="card" style={{ marginTop: 16 }}>Procurando perguntas parecidas...</div>;
  if (erro) return <div className="card" style={{ marginTop: 16 }}>{erro}</div>;
  if (!dados) return null;

  // Esconde pares em que alguma das duas já foi resolvida nesta sessão.
  const pares = dados.pares.filter((p) => !resolvidos.has(p.a.id) && !resolvidos.has(p.b.id));

  function cartao(q, par) {
    const emEdicao = editando?.id === q.id;
    return (
      <div className="parecidas-item">
        {emEdicao ? (
          <>
            <textarea
              className="parecidas-input"
              rows={3}
              value={editando.question}
              onChange={(e) => setEditando({ ...editando, question: e.target.value })}
            />
            <input
              className="parecidas-input"
              value={editando.answer}
              onChange={(e) => setEditando({ ...editando, answer: e.target.value })}
              placeholder="Resposta"
            />
            <div className="parecidas-acoes">
              <button className="btn btn-sm" onClick={salvarEdicao} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => setEditando(null)}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <p className="parecidas-pergunta">{q.question}</p>
            <p className="parecidas-resposta">→ {q.answer}</p>
            <div className="parecidas-acoes">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setEditando({ id: q.id, question: q.question, answer: q.answer })}
              >
                ✏️ Editar
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => apagar(q.id, q.question)}>
                🗑 Apagar
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="parecidas-cabecalho">
        <h2 style={{ margin: 0 }}>Perguntas parecidas ({pares.length})</h2>
        <div className="parecidas-filtro">
          <label htmlFor="limite-parecidas">Semelhança mínima</label>
          <select
            id="limite-parecidas"
            value={limite}
            onChange={(e) => setLimite(Number(e.target.value))}
          >
            <option value={50}>50%</option>
            <option value={60}>60%</option>
            <option value={70}>70%</option>
            <option value={80}>80%</option>
            <option value={90}>90%</option>
          </select>
        </div>
      </div>

      <p className="parecidas-nota">
        Só aparecem pares da <strong>mesma sala</strong> (tema + dificuldade) e com a{" "}
        <strong>mesma resposta</strong> — repetir entre salas diferentes é normal. Nem todo par é
        duplicata: perguntas sobre anos diferentes podem parecer iguais no texto.
      </p>

      {pares.length === 0 && (
        <p style={{ color: "var(--text-dim)" }}>
          Nenhum par acima de {limite}% de semelhança. 🎉
        </p>
      )}

      {pares.map((p) => (
        <div key={`${p.a.id}-${p.b.id}`} className="parecidas-par">
          <div className="parecidas-par-topo">
            <span className="parecidas-sala">{p.sala}</span>
            <span className="parecidas-percent">{p.semelhanca}% parecidas</span>
            <button
              className="btn btn-sm btn-ghost"
              title="Marcar como revisado — só esconde o par desta lista"
              onClick={() => setResolvidos((prev) => new Set(prev).add(p.a.id))}
            >
              ✓ São diferentes
            </button>
          </div>
          <div className="parecidas-grade">
            {cartao(p.a, p)}
            {cartao(p.b, p)}
          </div>
        </div>
      ))}
    </div>
  );
}
