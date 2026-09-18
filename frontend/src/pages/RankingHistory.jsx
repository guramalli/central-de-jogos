import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import RankBadge from "../components/RankBadge.jsx";
import Seo from "../components/Seo.jsx";

const GAME_NAMES = { stop: "Stop", quiz: "Quiz", acromania: "Acromania" };

const MEDALS = ["🥇", "🥈", "🥉"];
const GAMES = [
  { key: "stop", label: "Stop", logo: "/stop-logo.png" },
  { key: "quiz", label: "Quiz", logo: "/quiz-logo.png" },
  { key: "acromania", label: "Acromania", logo: "/acromania-logo.png" },
];

// Histórico ("Hall da Fama") de meses já encerrados — não precisa de
// nenhum processo especial de "arquivar" quando o mês vira: os dados de
// pontuação mensal nunca são apagados, então essa página só consulta
// meses passados diretamente, sempre disponível pra qualquer mês concluído.
// Minutos viram "12h 30min" — 750 minutos não diz nada pra quem lê.
// Acima de 24h a conta vira dias, senão "180h" também perde o sentido.
function formatarTempo(minutos) {
  if (!minutos || minutos < 1) return "—";
  if (minutos < 60) return `${minutos}min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas < 24) return resto > 0 ? `${horas}h ${resto}min` : `${horas}h`;
  const dias = Math.floor(horas / 24);
  const horasResto = horas % 24;
  return horasResto > 0 ? `${dias}d ${horasResto}h` : `${dias}d`;
}

export default function RankingHistory() {
  const [months, setMonths] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [game, setGame] = useState("stop");
  const [winners, setWinners] = useState(null);

  useEffect(() => {
    api.get("/ranking/history").then(({ data }) => {
      setMonths(data);
      if (data.length > 0) setSelectedMonth(data[0].monthKey);
    });
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    setWinners(null);
    api
      .get(`/ranking/history/${selectedMonth}/${game}`)
      .then(({ data }) => setWinners(data))
      .catch(() => setWinners({ winners: [] }));
  }, [selectedMonth, game]);

  const [stats, setStats] = useState(null);

  useEffect(() => {
    let vivo = true;
    api
      .get("/ranking/hall-stats")
      .then(({ data }) => vivo && setStats(data))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <div>
      <Seo title="Histórico" description="Confira os campeões dos meses anteriores na Educação Gamer." />
      <Link to="/ranking" className="btn secondary ranks-voltar">
        ← Voltar pro ranking
      </Link>
      <h1>🏛️ Hall da Fama</h1>
      <p style={{ color: "var(--text-dim)" }}>Os campeões de cada mês já encerrado, mês a mês.</p>

      {months && months.length > 0 && (
        <>
          {/* Os dois seletores juntos, com rótulo. Soltos um embaixo do
              outro, não dava pra saber que o de cima escolhia o MÊS e o de
              baixo o JOGO — pareciam dois grupos de botões sem relação com
              a tabela que vinha depois. */}
          <div className="hall-filtros">
          <div className="hall-filtro">
          <span className="hall-filtro-label">Mês</span>
          <div className="hall-meses">
            {months.map((m) => (
              <button
                key={m.monthKey}
                className={`btn ${selectedMonth === m.monthKey ? "" : "secondary"}`}
                onClick={() => setSelectedMonth(m.monthKey)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Mesmos botões de logo do ranking. A classe `ranking-game-tabs`
              é a dos JOGOS; a de cima, com o mesmo nome, é dos meses — o
              nome enganava e o seletor de jogo estava usando o estilo
              genérico de botão. */}
          </div>
          <div className="hall-filtro">
          <span className="hall-filtro-label">Jogo</span>
          <div className="ranking-game-tabs">
            {GAMES.map((g) => (
              <button
                key={g.key}
                type="button"
                className={`jogo-tab${game === g.key ? " jogo-tab-ativo" : ""}`}
                onClick={() => setGame(g.key)}
                aria-pressed={game === g.key}
              >
                <img src={g.logo} alt={g.label} className="jogo-tab-logo" />
              </button>
            ))}
          </div>
          </div>
          </div>

          <div className="card">
            <h2>{winners?.label || ""}</h2>
            {winners === null && <p style={{ color: "var(--text-dim)" }}>Carregando...</p>}
            {winners && winners.winners.length === 0 && (
              <p style={{ color: "var(--text-dim)" }}>Ninguém pontuou nesse jogo naquele mês.</p>
            )}
            {winners && winners.winners.length > 0 && (
              <table className="player-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Jogador</th>
                    <th>Pontos</th>
                    <th>Patente daquele mês</th>
                  </tr>
                </thead>
                <tbody>
                  {winners.winners.map((w) => (
                    <tr key={w.position} className={w.position <= 3 ? "row-podium" : ""}>
                      <td>{w.position <= 3 ? MEDALS[w.position - 1] : w.position}</td>
                      <td><Link to={`/jogador/${w.userId}`}>{w.nickname}</Link></td>
                      <td>{w.points}</td>
                      <td><RankBadge rank={w.rank} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
      {/* Números do hall: sem eles a página era só uma lista de meses. Quem
          mais venceu e qual o recorde é o que dá peso a "hall da fama". */}
      {stats && stats.totalTitulos > 0 && (
        <>
          {/* Uma linha, não três caixas grandes.
              
              Eram três painéis do tamanho de um card pra mostrar três
              números de um dígito — ocupavam o topo da página inteiro e
              empurravam os campeões, que são o assunto, pra baixo da dobra.
              Aqui viram uma linha de resumo no rodapé da página. */}
          <p className="hall-resumo">
            <strong>{stats.mesesFechados}</strong>{" "}
            {stats.mesesFechados === 1 ? "mês encerrado" : "meses encerrados"} ·{" "}
            <strong>{stats.totalTitulos}</strong>{" "}
            {stats.totalTitulos === 1 ? "título entregue" : "títulos entregues"} ·{" "}
            <strong>{stats.maisTitulos.length}</strong>{" "}
            {stats.maisTitulos.length === 1 ? "campeão diferente" : "campeões diferentes"}
          </p>

          <div className="hall-blocos">
            {/* Um bloco por jogo, mais o geral. "4 títulos" sozinho não dizia
                ONDE a pessoa é forte: quem ganhou quatro vezes no Stop e quem
                ganhou duas em cada jogo apareciam iguais. */}
            <div className="card">
              <h2>👑 Quem mais venceu</h2>
              {Object.entries(stats.maisTitulosPorJogo || {}).map(([jogo, lista]) => (
                <div key={jogo} className="hall-bloco-jogo">
                  <h3 className="hall-jogo-titulo">{GAME_NAMES[jogo] || jogo}</h3>
                  {lista.map((j, i) => (
                    <div key={j.userId} className="hall-linha">
                      <span className="hall-pos">{i + 1}º</span>
                      <Link to={`/jogador/${j.userId}`} className="hall-nick">{j.nickname}</Link>
                      <span className="hall-valor">
                        {j.titulos} {j.titulos === 1 ? "título" : "títulos"}
                      </span>
                    </div>
                  ))}
                </div>
              ))}

              {/* O geral só faz sentido com mais de um jogo premiado — com um
                  só, ele repetiria a lista acima palavra por palavra. */}
              {Object.keys(stats.maisTitulosPorJogo || {}).length > 1 && (
                <div className="hall-bloco-jogo">
                  <h3 className="hall-jogo-titulo">Somando tudo</h3>
                  {stats.maisTitulos.map((j, i) => (
                    <div key={j.userId} className="hall-linha">
                      <span className="hall-pos">{i + 1}º</span>
                      <Link to={`/jogador/${j.userId}`} className="hall-nick">{j.nickname}</Link>
                      <span className="hall-valor">
                        {j.titulos} {j.titulos === 1 ? "título" : "títulos"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h2>🔥 Recordes de pontuação</h2>
              {Object.entries(stats.recordes).map(([jogo, r]) => (
                <div key={jogo} className="hall-linha">
                  <span className="hall-pos">{GAME_NAMES[jogo] || jogo}</span>
                  <Link to={`/jogador/${r.userId}`} className="hall-nick">{r.nickname}</Link>
                  <span className="hall-valor">
                    {r.points.toLocaleString("pt-BR")}
                    <small> · {r.label}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* MARCAS VITALÍCIAS — o outro lado do Hall.
              
              Os cards acima são de quem GANHOU o mês: dependem de estar no
              topo num período. Estes são de quem jogou muito, e ficam pra
              sempre. Quem nunca levou um Pix também tem lugar aqui.
              
              Cada marca só aparece se existir: sala nova ou banco recém-
              limpo não deve mostrar uma linha vazia. */}
          {stats.marcas &&
            (stats.marcas.sequenciaQuiz ||
              stats.marcas.stopsTotal ||
              stats.marcas.tempoDeJogo) && (
              <div className="card hall-marcas">
                <h2>🏅 Marcas de todos os tempos</h2>

                {stats.marcas.sequenciaQuiz && (
                  <div className="hall-linha">
                    <span className="hall-pos">Maior sequência de acertos no Quiz</span>
                    <Link
                      to={`/jogador/${stats.marcas.sequenciaQuiz.userId}`}
                      className="hall-nick"
                    >
                      {stats.marcas.sequenciaQuiz.nickname}
                    </Link>
                    <span className="hall-valor">
                      {stats.marcas.sequenciaQuiz.valor.toLocaleString("pt-BR")}
                      <small>
                        {stats.marcas.sequenciaQuiz.sala
                          ? ` · ${stats.marcas.sequenciaQuiz.sala}`
                          : " acertos"}
                      </small>
                    </span>
                  </div>
                )}

                {/* "nas salas oficiais", não "no Stop".
                    
                    O contador (`StopStat`) só registra em salas com tempo
                    mínimo de 40, 15 ou 5 segundos — as oficiais —, e ignora
                    salas privadas e sem pontuação. Ele também só existe
                    desde que os títulos de perfil entraram no ar, então não
                    tem o histórico anterior.
                    
                    Chamar isso de "total de STOPs" seria mostrar um número
                    que o próprio jogador sabe estar baixo. O rótulo diz o
                    que a marca realmente mede. */}
                {stats.marcas.stopsTotal && (
                  <div className="hall-linha">
                    <span className="hall-pos">Mais STOPs nas salas oficiais</span>
                    <Link
                      to={`/jogador/${stats.marcas.stopsTotal.userId}`}
                      className="hall-nick"
                    >
                      {stats.marcas.stopsTotal.nickname}
                    </Link>
                    <span className="hall-valor">
                      {stats.marcas.stopsTotal.valor.toLocaleString("pt-BR")}
                      <small> stops</small>
                    </span>
                  </div>
                )}

                {stats.marcas.tempoDeJogo && (
                  <div className="hall-linha">
                    <span className="hall-pos">Mais tempo de jogo</span>
                    <Link
                      to={`/jogador/${stats.marcas.tempoDeJogo.userId}`}
                      className="hall-nick"
                    >
                      {stats.marcas.tempoDeJogo.nickname}
                    </Link>
                    <span className="hall-valor">
                      {formatarTempo(stats.marcas.tempoDeJogo.valor)}
                    </span>
                  </div>
                )}
              </div>
            )}
        </>
      )}

      {months === null && <p style={{ color: "var(--text-dim)" }}>Carregando...</p>}
      {months && months.length === 0 && (
        <p style={{ color: "var(--text-dim)" }}>
          Ainda não temos nenhum mês encerrado pra mostrar aqui — volta depois que o mês virar!
        </p>
      )}
    </div>
  );
}
