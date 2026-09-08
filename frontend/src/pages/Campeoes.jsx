import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import Seo from "../components/Seo.jsx";

const MEDALHAS = ["🥇", "🥈", "🥉"];
const JOGOS = [
  { key: "stop", label: "🅾️ Stop" },
  { key: "quiz", label: "❓ Quiz" },
  { key: "acromania", label: "🔤 Acromania" },
];

// CAMPEÕES DO MÊS PASSADO
//
// A página de histórico já existe e faz mais que isto — dá pra escolher
// qualquer mês e qualquer jogo. O problema é que ela mostra UM jogo por vez,
// e quem quer só saber "quem ganhou mês passado" precisa navegar.
//
// Aqui é o contrário: nada pra escolher. Abre no último mês encerrado e
// mostra os três pódios de uma vez. Quem quiser ir mais fundo tem o link
// pro histórico no fim.
//
// Calculado na hora a partir do histórico, não congelado: as pontuações
// mensais nunca são apagadas, então o pódio de um mês passado é sempre
// reconstruível. (Os troféus de campeão, esses sim, são congelados — porque
// banir uma conta depois mudaria retroativamente quem foi pago.)
export default function Campeoes() {
  const [mes, setMes] = useState(null);
  const [podios, setPodios] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let vivo = true;
    api
      .get("/ranking/history")
      .then(async ({ data }) => {
        if (!vivo) return;
        if (!data || data.length === 0) {
          setPodios([]);
          return;
        }
        const ultimo = data[0];
        setMes(ultimo);
        // Os três jogos em paralelo: em série seriam três idas seguidas ao
        // servidor pra montar uma tela só.
        const resultados = await Promise.all(
          JOGOS.map((j) =>
            api
              .get(`/ranking/history/${ultimo.monthKey}/${j.key}`)
              .then(({ data: d }) => ({ jogo: j, winners: (d.winners || []).slice(0, 3) }))
              .catch(() => ({ jogo: j, winners: [] }))
          )
        );
        if (vivo) setPodios(resultados);
      })
      .catch(() => vivo && setErro("Não foi possível carregar os campeões."));
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <div>
      <Seo
        title="Campeões do mês"
        description="Os três primeiros de cada jogo no último mês encerrado do Educação Gamer."
      />

      <Link to="/ranking" className="btn secondary ranks-voltar">
        ← Voltar pro ranking
      </Link>

      <h1>🏆 Campeões {mes ? `— ${mes.label}` : ""}</h1>
      <p style={{ color: "var(--text-dim)" }}>
        Os três primeiros de cada jogo no último mês encerrado.
      </p>

      {erro && <div className="card">{erro}</div>}

      {podios === null && !erro && (
        <div className="card">
          <p style={{ color: "var(--text-dim)", margin: 0 }}>Carregando...</p>
        </div>
      )}

      {podios?.length === 0 && (
        <div className="card">
          <p style={{ color: "var(--text-dim)", margin: 0 }}>
            Nenhum mês encerrado ainda — os campeões aparecem aqui a partir do dia 1º.
          </p>
        </div>
      )}

      <div className="campeoes-grade">
        {podios?.map(({ jogo, winners }) => (
          <div key={jogo.key} className="card campeoes-card">
            <h2 className="campeoes-jogo">{jogo.label}</h2>
            {winners.length === 0 ? (
              <p style={{ color: "var(--text-dim)", margin: 0 }}>Ninguém pontuou nesse mês.</p>
            ) : (
              winners.map((w, i) => (
                <div key={w.userId || i} className="campeoes-linha">
                  <span className="campeoes-medalha">{MEDALHAS[i]}</span>
                  <Link to={`/jogador/${w.userId}`} className="campeoes-nick">
                    {w.nickname}
                  </Link>
                  <span className="campeoes-pts">{(w.points || 0).toLocaleString("pt-BR")}</span>
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      <p style={{ marginTop: 18 }}>
        <Link to="/ranking/historico">🏛️ Ver outros meses e o top 10 completo →</Link>
      </p>
    </div>
  );
}
