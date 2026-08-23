import { useEffect, useState } from "react";
import { api } from "../api/client.js";

// Painel de perguntas que compartilham a MESMA RESPOSTA dentro de um tema.
//
// Complementa o painel de "parecidas", que compara o TEXTO das perguntas.
// Aqui o critério é a resposta — duas perguntas escritas de formas totalmente
// diferentes podem levar ao mesmo lugar, e para quem joga isso soa como a
// mesma pergunta voltando.
//
// Não é lista de erro: ter duas perguntas com a mesma resposta é normal e às
// vezes desejável. O painel serve pra você OLHAR e decidir — especialmente
// nos grupos com três, quatro perguntas iguais no destino.
export default function AdminRespostasRepetidas({ temas }) {
  const [tema, setTema] = useState("");
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [apagando, setApagando] = useState(null);

  async function buscar(temaEscolhido) {
    setCarregando(true);
    setDados(null);
    try {
      const q = temaEscolhido ? `?tema=${encodeURIComponent(temaEscolhido)}` : "";
      const { data } = await api.get(`/admin/quiz-respostas-repetidas${q}`);
      setDados(data);
    } catch (e) {
      alert(e.response?.data?.error || "Erro ao carregar.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (tema) buscar(tema);
  }, [tema]);

  async function apagar(id, texto) {
    if (!confirm(`Apagar esta pergunta?\n\n"${texto}"\n\nIsso não pode ser desfeito.`)) return;
    setApagando(id);
    try {
      await api.delete(`/admin/quiz-questions/${id}`);
      // Remove da tela sem refazer a consulta inteira, que é pesada.
      setDados((d) => ({
        ...d,
        grupos: d.grupos
          .map((g) => ({ ...g, perguntas: g.perguntas.filter((p) => p.id !== id), total: g.perguntas.filter((p) => p.id !== id).length }))
          .filter((g) => g.total > 1),
      }));
    } catch (e) {
      alert(e.response?.data?.error || "Erro ao apagar.");
    } finally {
      setApagando(null);
    }
  }

  const variedade = dados && dados.total > 0
    ? Math.round((dados.distintas / dados.total) * 100)
    : null;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2>🔁 Perguntas com a mesma resposta</h2>
      <p className="admin-hint">
        Perguntas diferentes que levam ao mesmo destino. Não é erro — mas grupos
        de três ou quatro fazem a sala soar repetida pra quem joga.
      </p>

      <select
        className="admin-select"
        value={tema}
        onChange={(e) => setTema(e.target.value)}
      >
        <option value="">Escolha um tema...</option>
        {Object.entries(temas).map(([k, nome]) => (
          <option key={k} value={k}>{nome}</option>
        ))}
      </select>

      {carregando && <p className="admin-hint">Carregando...</p>}

      {dados && (
        <>
          <div className="repetidas-resumo">
            <span><strong>{dados.total}</strong> perguntas</span>
            <span><strong>{dados.distintas}</strong> respostas distintas</span>
            <span><strong>{dados.envolvidas}</strong> em repetição</span>
            <span className={variedade < 75 ? "repetidas-alerta" : ""}>
              variedade real: <strong>{variedade}%</strong>
            </span>
          </div>

          {dados.grupos.length === 0 && (
            <p className="admin-hint">Nenhuma resposta repetida neste tema.</p>
          )}

          {dados.grupos.map((g) => (
            <div key={g.answer + g.themeKey} className="repetidas-grupo">
              <div className="repetidas-cabecalho">
                <span className="repetidas-resposta">{g.answer}</span>
                <span className="repetidas-contador">{g.total} perguntas</span>
              </div>
              {g.perguntas.map((p) => (
                <div key={p.id} className="repetidas-item">
                  <span className="repetidas-dif">{p.difficulty}</span>
                  <span className="repetidas-texto">{p.question}</span>
                  <button
                    className="btn secondary btn-perigo"
                    disabled={apagando === p.id}
                    onClick={() => apagar(p.id, p.question)}
                  >
                    {apagando === p.id ? "..." : "Apagar"}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
