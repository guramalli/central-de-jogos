import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import RankBadge from "../components/RankBadge.jsx";
import Seo from "../components/Seo.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const MEDALS = ["🥇", "🥈", "🥉"];

// Premiação em Pix — só Stop e Quiz pagam. O Acromania entra no ranking mas
// não distribui prêmio, e a tela precisa dizer isso em vez de deixar
// subentendido.
const PREMIOS = ["R$ 200", "R$ 100", "R$ 50"];
const JOGOS_COM_PREMIO = ["stop", "quiz"];

const fmt = (n) => (n ?? 0).toLocaleString("pt-BR");
const VALID_GAMES = ["stop", "quiz", "acromania"];

const ROTULO_JOGO = {
  geral: "Geral",
  stop: "Stop",
  quiz: "Quiz",
  acromania: "Acromania",
};

const LOGO_JOGO = {
  stop: "/stop-logo.png",
  quiz: "/quiz-logo.png",
  acromania: "/acromania-logo.png",
};

export default function Ranking() {
  const [searchParams] = useSearchParams();
  const initialGame = VALID_GAMES.includes(searchParams.get("game")) ? searchParams.get("game") : "stop";
  const [game, setGame] = useState(initialGame); // stop | quiz | acromania — só vale pra mensal/vitalício
  const [tab, setTab] = useState("monthly"); // monthly | lifetime | clans
  const [rows, setRows] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const path =
      tab === "monthly"
        ? `/ranking/monthly/${game}`
        : tab === "lifetime"
        ? `/ranking/lifetime/${game}`
        : `/clans/ranking/mensal?jogo=${game}`;
    api.get(path).then(({ data }) => setRows(data));
  }, [tab, game]);

  // "geral" só existe no ranking de clãs. Sem este ajuste, trocar de aba com
  // ele selecionado chamaria /ranking/monthly/geral, que não existe.
  useEffect(() => {
    if (tab !== "clans" && game === "geral") setGame("stop");
  }, [tab, game]);

  const isClans = tab === "clans";
  // Prêmio só aparece onde ele existe de verdade: mensal, individual, e nos
  // dois jogos que pagam. No Acromania e no vitalício, mostrar valores seria
  // prometer o que não existe.
  const mostraPremio = tab === "monthly" && !isClans && JOGOS_COM_PREMIO.includes(game);
  // O seletor de jogo agora vale TAMBÉM pra aba de clãs: antes ele era
  // escondido ali e a soma era só do Stop, com o jogo fixo no servidor —
  // quem jogava Quiz achava que estava somando pro clã e não estava.
  const jogosDisponiveis = isClans
    ? ["geral", "stop", "quiz", "acromania"]
    : ["stop", "quiz", "acromania"];
  const nameOf = (r) => (isClans ? `[${r.tag}] ${r.name}` : r.nickname);

  return (
    <div>
      <Seo title="Ranking" description="Veja o ranking mensal e vitalício de Stop, Quiz e Acromania." />
      <h1>Ranking</h1>
      <p style={{ marginTop: -8 }}>
        <Link to="/ranking/historico" className="ranking-hall">
          🏛️ Hall da Fama
        </Link>
      </p>

      {/* A logo É o botão. Os três jogos já têm identidade visual forte e
          reconhecível; escrever o nome ao lado de um emoji desperdiçava isso.
          O "Geral" não tem logo própria, então usa texto — e a diferença de
          tratamento marca que ele não é um jogo, é a soma dos três. */}
      <div className="ranking-game-tabs">
        {jogosDisponiveis.map((j) => (
          <button
            key={j}
            type="button"
            className={`jogo-tab${game === j ? " jogo-tab-ativo" : ""}${
              j === "geral" ? " jogo-tab-geral" : ""
            }`}
            onClick={() => setGame(j)}
            aria-pressed={game === j}
          >
            {j === "geral" ? (
              <span className="jogo-tab-texto">Geral</span>
            ) : (
              <img src={LOGO_JOGO[j]} alt={ROTULO_JOGO[j]} className="jogo-tab-logo" />
            )}
          </button>
        ))}
      </div>

      <div className="ranking-tabs">
        <button className={`btn ${tab === "monthly" ? "" : "secondary"}`} onClick={() => setTab("monthly")}>
          Mensal (premiação)
        </button>
        <button className={`btn ${tab === "lifetime" ? "" : "secondary"}`} onClick={() => setTab("lifetime")}>
          Vitalício (geral)
        </button>
        <button className={`btn ${tab === "clans" ? "" : "secondary"}`} onClick={() => setTab("clans")}>
          Clãs (mensal)
        </button>
      </div>

      <p className="ranking-contexto">
        {isClans
          ? game === "geral"
            ? "Soma dos pontos do mês de todos os membros, nos três jogos."
            : `Soma dos pontos do mês dos membros no ${ROTULO_JOGO[game]}.`
          : tab === "lifetime"
          ? "Total acumulado desde sempre. Não zera e não vale prêmio."
          : mostraPremio
          ? "Zera todo dia 1º. Os três primeiros recebem por Pix no fim do mês."
          : "Zera todo dia 1º. Este jogo ainda não tem premiação em dinheiro."}
      </p>

      {rows.length > 0 && (
        <div className="podium">
          {rows.slice(0, 3).map((r) => (
            <div key={r.position} className={`podium-item podium-${r.position}`}>
              <div className="podium-medal">{MEDALS[r.position - 1]}</div>
              <div className="podium-name">
                {isClans ? (
                  <Link to={`/cla/${r.id}`}>{nameOf(r)}</Link>
                ) : (
                  <Link to={`/jogador/${r.userId}`}>{nameOf(r)}</Link>
                )}
              </div>
              <div className="podium-points">{fmt(r.points)} pts</div>
              {/* O prêmio ao lado da posição responde a pergunta que a pessoa
                  tem na cabeça: quanto vale estar aqui. */}
              {mostraPremio && <div className="podium-premio">{PREMIOS[r.position - 1]}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <table className="player-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{isClans ? "Clã" : "Jogador"}</th>
              <th>Pontos</th>
              {tab === "monthly" && <th>Patente</th>}
              {isClans && <th>Membros</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.position}
                className={`${r.position <= 3 ? "row-podium" : ""} ${
                  !isClans && r.userId === user?.id ? "row-eu" : ""
                }`}
              >
                <td>{r.position}</td>
                <td>
                  {isClans ? (
                    <Link to={`/cla/${r.id}`}>{nameOf(r)}</Link>
                  ) : (
                    <Link to={`/jogador/${r.userId}`}>{nameOf(r)}</Link>
                  )}
                  {!isClans && r.userId === user?.id && <span className="row-eu-tag">você</span>}
                </td>
                <td className="ranking-pts">{fmt(r.points)}</td>
                {tab === "monthly" && (
                  <td>
                    <RankBadge rank={r.rank} />
                  </td>
                )}
                {isClans && <td>{r.memberCount}</td>}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ color: "var(--text-dim)" }}>
                  {isClans
                    ? "Nenhum clã pontuou neste jogo ainda este mês. Jogue com o seu clã pra abrir o placar."
                    : "Ninguém pontuou aqui este mês. Entre numa sala e o primeiro lugar é seu."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
