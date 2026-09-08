import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import Seo from "../components/Seo.jsx";

// Rótulo de cada troféu. "geral" é a soma dos três jogos, e por isso ganha
// destaque próprio: é o mais difícil de conquistar.
const ROTULO_TROFEU = {
  geral: { nome: "Campeão Geral", icone: "👑" },
  stop: { nome: "Campeão do Stop", icone: "🅾️" },
  quiz: { nome: "Campeão do Quiz", icone: "❓" },
  acromania: { nome: "Campeão do Acromania", icone: "🔤" },
};

function mesPorExtenso(monthKey) {
  const [ano, mes] = String(monthKey || "").split("-").map(Number);
  if (!ano || !mes) return monthKey;
  // Data montada em horário local: `new Date("2026-09-01")` é lido como UTC
  // e voltaria um dia no fuso do Brasil, mostrando o mês anterior.
  return new Date(ano, mes - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default function ClanProfile() {
  const { id } = useParams();
  const [clan, setClan] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let vivo = true;
    setClan(null);
    setErro("");
    api
      .get(`/clans/${id}`)
      .then(({ data }) => vivo && setClan(data))
      .catch((e) =>
        vivo && setErro(e.response?.status === 404 ? "Clã não encontrado." : "Não foi possível carregar o clã.")
      );
    return () => {
      vivo = false;
    };
  }, [id]);

  if (erro) {
    return (
      <div>
        <Link to="/ranking" className="btn secondary ranks-voltar">← Voltar pro ranking</Link>
        <div className="card">{erro}</div>
      </div>
    );
  }

  if (!clan) {
    return (
      <div className="card">
        <p style={{ color: "var(--text-dim)", margin: 0 }}>Carregando...</p>
      </div>
    );
  }

  const trofeus = clan.campeonatos || [];

  return (
    <div>
      <Seo
        title={`Clã ${clan.name}`}
        description={`Perfil do clã ${clan.name} no Educação Gamer: membros, troféus e pontuação do mês.`}
      />

      <Link to="/ranking" className="btn secondary ranks-voltar">← Voltar pro ranking</Link>

      <div className="card cla-cabecalho">
        <div>
          <h1 className="cla-nome">
            <span className="cla-tag">[{clan.tag}]</span> {clan.name}
          </h1>
          <p className="cla-sub">
            {clan.members.length} {clan.members.length === 1 ? "membro" : "membros"} · liderado por{" "}
            <Link to={`/jogador/${clan.owner.id}`}>{clan.owner.nickname}</Link>
          </p>
        </div>
        <div className="cla-pontos">
          <strong>{(clan.monthlyPoints ?? 0).toLocaleString("pt-BR")}</strong>
          <small>pontos este mês</small>
        </div>
      </div>

      <div className="card">
        <h2>🏆 Troféus</h2>
        {trofeus.length === 0 ? (
          <p style={{ color: "var(--text-dim)", margin: 0 }}>
            Nenhum troféu ainda. Eles são entregues no fim de cada mês pro clã que mais pontuar em
            cada jogo — e pro que mais pontuar somando os três.
          </p>
        ) : (
          <div className="cla-trofeus">
            {trofeus.map((t) => {
              const info = ROTULO_TROFEU[t.gameKey] || { nome: t.gameKey, icone: "🏆" };
              return (
                <div
                  key={t.id}
                  className={`cla-trofeu${t.gameKey === "geral" ? " cla-trofeu-geral" : ""}`}
                  title={`${t.points.toLocaleString("pt-BR")} pontos com ${t.memberCount} membros`}
                >
                  <span className="cla-trofeu-icone">{info.icone}</span>
                  <span className="cla-trofeu-nome">{info.nome}</span>
                  <span className="cla-trofeu-mes">{mesPorExtenso(t.monthKey)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Membros</h2>
        <table className="player-table">
          <thead>
            <tr>
              <th>Jogador</th>
              <th>Pontos no mês</th>
              <th>Contribuição</th>
            </tr>
          </thead>
          <tbody>
            {clan.members.map((m) => (
              <tr key={m.id}>
                <td>
                  <Link to={`/jogador/${m.id}`}>{m.nickname}</Link>
                  {m.id === clan.owner.id && <span className="cla-dono-tag">líder</span>}
                </td>
                <td className="ranking-pts">
                  {m.contaPontos ? (
                    (m.points ?? 0).toLocaleString("pt-BR")
                  ) : (
                    <span className="cla-nao-conta" title="Contas de administrador e visitantes não somam pontos pro clã">
                      não soma
                    </span>
                  )}
                </td>
                <td>
                  {m.contaPontos && (
                    /* A barra transforma o número em comparação visual: dá
                       pra ver quem carrega o clã sem ler percentual por
                       percentual. */
                    <div className="cla-contrib">
                      <div className="cla-contrib-barra">
                        <div className="cla-contrib-preenchida" style={{ width: `${m.percent}%` }} />
                      </div>
                      <span className="cla-contrib-num">{m.percent}%</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
