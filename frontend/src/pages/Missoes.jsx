import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Seo from "../components/Seo.jsx";

// Missões diárias e semanais. As diárias viram à meia-noite; as semanais,
// toda segunda. O progresso é registrado enquanto a pessoa joga.
export default function Missoes() {
  const [dados, setDados] = useState(null);
  const [streak, setStreak] = useState(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  function carregar() {
    api.get("/missoes/lista")
      .then(({ data }) => setDados(data))
      .catch(() => setErro("Não foi possível carregar as missões."));
    api.get("/missoes/streak").then(({ data }) => setStreak(data)).catch(() => {});
  }

  useEffect(carregar, []);

  async function resgatar(missaoKey, tipo) {
    setAviso("");
    try {
      const { data } = await api.post("/missoes/resgatar", { missaoKey, tipo });
      setAviso(`🎉 +${data.pontos} pontos creditados!`);
      carregar();
    } catch (e) {
      setAviso(e.response?.data?.error || "Não foi possível resgatar.");
    }
  }

  if (erro) return <div className="error-msg">{erro}</div>;
  if (!dados) return <p style={{ color: "var(--text-dim)" }}>Carregando missões...</p>;

  if (!dados.ativas) {
    return (
      <div className="card">
        <p style={{ color: "var(--text-dim)" }}>As missões ainda não estão disponíveis.</p>
      </div>
    );
  }

  const bloco = (titulo, subtitulo, lista, tipo) => {
    const concluidas = lista.filter((m) => m.concluida).length;
    return (
      <div className="card" style={{ marginTop: 16 }}>
        <div className="missoes-cabecalho">
          <div>
            <h2 style={{ margin: 0 }}>{titulo}</h2>
            <p className="missoes-sub">{subtitulo}</p>
          </div>
          <span className="missoes-contador">
            {concluidas}/{lista.length}
          </span>
        </div>

        <div className="missoes-lista">
          {lista.map((m) => {
            const pct = Math.min(100, Math.round((m.progresso / m.meta) * 100));
            return (
              <div key={m.key} className={`missao ${m.concluida ? "missao-ok" : ""}`}>
                <div className="missao-topo">
                  <span className="missao-nome">
                    {m.concluida ? "✅ " : ""}
                    {m.nome}
                  </span>
                  <span className="missao-progresso">
                    {Math.min(m.progresso, m.meta)}/{m.meta}
                  </span>
                </div>
                <p className="missao-desc">{m.descricao}</p>
                <div className="missao-barra">
                  <div className="missao-barra-fill" style={{ width: `${pct}%` }} />
                </div>

                <div className="missao-rodape">
                  <span className="missao-pontos">+{m.pontos} pts</span>
                  {m.concluida && !m.resgatada && (
                    <button className="missao-resgatar" onClick={() => resgatar(m.key, tipo)}>
                      Resgatar
                    </button>
                  )}
                  {m.resgatada && <span className="missao-resgatada">✓ resgatada</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Seo title="Missões" description="Complete missões diárias e semanais no Educação Gamer." />

      <div className="hero-banner" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="hero-title">🎯 Missões</h1>
          <p className="hero-subtitle">
            Objetivos que se renovam sozinhos. As diárias viram à meia-noite, as semanais toda
            segunda. O progresso conta enquanto você joga — não precisa fazer nada além de jogar.
          </p>
        </div>
      </div>

      {aviso && <div className="missoes-aviso">{aviso}</div>}

      {streak && (
        <div className="card streak-card">
          <div className="streak-topo">
            <div>
              <div className="streak-numero">🔥 {streak.atual}</div>
              <div className="streak-label">
                {streak.atual === 0
                  ? "Comece sua sequência jogando hoje!"
                  : `${streak.atual === 1 ? "dia" : "dias"} seguidos jogando`}
              </div>
            </div>
            <div className="streak-recorde">
              <span>Seu recorde</span>
              <strong>{streak.recorde}</strong>
            </div>
          </div>

          {streak.proximoMarco && (
            <p className="streak-proximo">
              Próximo prêmio em <strong>{streak.proximoMarco.dias - streak.atual}</strong>{" "}
              {streak.proximoMarco.dias - streak.atual === 1 ? "dia" : "dias"}:{" "}
              <strong>+{streak.proximoMarco.pontos} pts</strong>
            </p>
          )}

          <div className="streak-marcos">
            {streak.marcos.map((m) => (
              <div
                key={m.dias}
                className={`streak-marco ${streak.atual >= m.dias ? "streak-marco-ok" : ""}`}
                title={`${m.dias} dias: +${m.pontos} pts`}
              >
                <span className="streak-marco-dias">{m.dias}d</span>
                <span className="streak-marco-pts">+{m.pontos}</span>
              </div>
            ))}
          </div>
          <p className="streak-aviso">
            A sequência zera se você passar um dia inteiro sem jogar.
          </p>
        </div>
      )}

      {bloco("Diárias", "Renovam todo dia à meia-noite", dados.diarias, "diarias")}
      {bloco("Semanais", "Renovam toda segunda-feira", dados.semanais, "semanais")}
    </div>
  );
}
