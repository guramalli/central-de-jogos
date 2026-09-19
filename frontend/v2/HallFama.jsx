import { useEffect, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Topo from "./Topo.jsx";
import Avatar from "./Avatar.jsx";

const JOGOS = [
  { key: "stop", label: "Stop", logo: "/stop-logo.png" },
  { key: "quiz", label: "Quiz", logo: "/quiz-logo.png" },
  { key: "acromania", label: "Acromania", logo: "/acromania-logo.png" },
];
const NOME = { stop: "Stop", quiz: "Quiz", acromania: "Acromania" };
function tempo(min) {
  if (!min || min < 1) return "—";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  return h < 24 && min % 60 ? `${h}h ${min % 60}min` : `${h.toLocaleString("pt-BR")}h`;
}
const Jogador = ({ id, nick }) => (
  <a href={linkDaPagina("jogador", { id })} onClick={(e) => { e.preventDefault(); irParaPagina("jogador", { id }); }}>{nick}</a>
);

export default function HallFama({ usuario }) {
  const [meses, setMeses] = useState(null);
  const [mes, setMes] = useState(null);
  const [jogo, setJogo] = useState("stop");
  const [vencedores, setVencedores] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/ranking/history").then(({ data }) => { setMeses(data || []); if (data?.length) setMes(data[0].monthKey); }).catch(() => setMeses([]));
    api.get("/ranking/hall-stats").then(({ data }) => setStats(data)).catch(() => {});
  }, []);
  useEffect(() => {
    if (!mes) return;
    setVencedores(null);
    api.get(`/ranking/history/${mes}/${jogo}`).then(({ data }) => setVencedores(data)).catch(() => setVencedores({ winners: [] }));
  }, [mes, jogo]);

  const podio = (vencedores?.winners || []).slice(0, 3);
  const ordem = [podio[1], podio[0], podio[2]].filter(Boolean);
  const m = stats?.marcas;

  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo="ranking" />
      <main className="v2-pagina">
        <a className="v2-link" href={linkDaPagina("ranking")} onClick={(e) => { e.preventDefault(); irParaPagina("ranking"); }}>← Ranking</a>
        <div className="v2-pagina-cabeca"><h1>Hall da Fama</h1></div>
        <p className="v2-pagina-nota">Os campeões de cada mês já encerrado — e as marcas que ficam pra sempre.</p>

        {m && (m.sequenciaQuiz || m.stopsTotal || m.tempoDeJogo) && (
          <section className="v2-marcas">
            {m.sequenciaQuiz && (
              <div className="v2-marca">
                <span>Maior sequência no Quiz</span>
                <b>{m.sequenciaQuiz.valor.toLocaleString("pt-BR")}<small> acertos seguidos</small></b>
                <Avatar userId={m.sequenciaQuiz.userId} nickname={m.sequenciaQuiz.nickname} tamanho={40} borda />
                <Jogador id={m.sequenciaQuiz.userId} nick={m.sequenciaQuiz.nickname} />
                {m.sequenciaQuiz.sala && <em>{m.sequenciaQuiz.sala}</em>}
              </div>
            )}
            {m.stopsTotal && (
              <div className="v2-marca">
                <span>Mais STOPs pedidos</span>
                <b>{m.stopsTotal.valor.toLocaleString("pt-BR")}<small> stops</small></b>
                <Avatar userId={m.stopsTotal.userId} nickname={m.stopsTotal.nickname} tamanho={40} borda />
                <Jogador id={m.stopsTotal.userId} nick={m.stopsTotal.nickname} />
                <em>salas oficiais</em>
              </div>
            )}
            {m.tempoDeJogo && (
              <div className="v2-marca">
                <span>Mais tempo de jogo</span>
                <b>{tempo(m.tempoDeJogo.valor)}</b>
                <Avatar userId={m.tempoDeJogo.userId} nickname={m.tempoDeJogo.nickname} tamanho={40} borda />
                <Jogador id={m.tempoDeJogo.userId} nick={m.tempoDeJogo.nickname} />
              </div>
            )}
          </section>
        )}

        {meses?.length === 0 && <div className="v2-vazio-grande">Nenhum mês encerrado ainda. O primeiro campeão aparece aqui no dia 1º.</div>}
        {meses?.length > 0 && (
          <>
            <div className="v2-hall-filtros">
              <span className="v2-bloco-titulo">Mês</span>
              <div className="v2-meses">
                {meses.map((x) => <button key={x.monthKey} className={mes === x.monthKey ? "ativo" : ""} onClick={() => setMes(x.monthKey)}>{x.label}</button>)}
              </div>
            </div>
            <div className="v2-jogos-abas">
              {JOGOS.map((g) => (
                <button key={g.key} className={`v2-jogo-aba ${jogo === g.key ? "ativa" : ""}`} aria-pressed={jogo === g.key} onClick={() => setJogo(g.key)}><img src={g.logo} alt={g.label} /></button>
              ))}
            </div>
            {vencedores === null && <div className="v2-carregando">Carregando…</div>}
            {vencedores && vencedores.winners.length === 0 && <div className="v2-vazio-grande">Ninguém pontuou nesse jogo naquele mês.</div>}
            {ordem.length > 0 && (
              <div className="v2-podio">
                {ordem.map((r) => (
                  <div key={r.position} className={`v2-podio-item p${r.position}`}>
                    <Avatar userId={r.userId} nickname={r.nickname} tamanho={r.position === 1 ? 76 : 60} borda />
                    <div className="v2-podio-nome"><Jogador id={r.userId} nick={r.nickname} /></div>
                    <div className="v2-podio-coluna"><b>{r.position}</b><span>{r.points.toLocaleString("pt-BR")} pts</span></div>
                  </div>
                ))}
              </div>
            )}
            {vencedores?.winners?.length > 3 && (
              <div className="v2-tabela">
                {vencedores.winners.slice(3).map((w) => (
                  <div key={w.position} className={`v2-linha ${w.userId === usuario.id ? "eu" : ""}`}>
                    <span className="v2-linha-pos">{w.position}</span>
                    <Avatar userId={w.userId} nickname={w.nickname} tamanho={32} />
                    <span className="v2-linha-nome"><Jogador id={w.userId} nick={w.nickname} /></span>
                    {w.rank && <span className="v2-linha-patente">{w.rank.icon && <img src={w.rank.icon} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />}<span>{w.rank.name}</span></span>}
                    <b className="v2-linha-pts">{w.points.toLocaleString("pt-BR")}</b>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {stats?.totalTitulos > 0 && (
          <>
            <p className="v2-pagina-nota"><b>{stats.mesesFechados}</b> {stats.mesesFechados === 1 ? "mês encerrado" : "meses encerrados"} · <b>{stats.totalTitulos}</b> {stats.totalTitulos === 1 ? "título entregue" : "títulos entregues"} · <b>{stats.maisTitulos.length}</b> {stats.maisTitulos.length === 1 ? "campeão diferente" : "campeões diferentes"}</p>
            <div className="v2-hall-grade">
              <section className="v2-cartao">
                <h2>Quem mais venceu</h2>
                <div className="v2-hall-jogos">
                  {Object.entries(stats.maisTitulosPorJogo || {}).map(([j, lista]) => (
                    <div key={j}>
                      <div className="v2-bloco-titulo">{NOME[j] || j}</div>
                      {lista.map((x, i) => <div key={x.userId} className="v2-hall-linha"><span>{i + 1}º</span><Jogador id={x.userId} nick={x.nickname} /><em>{x.titulos} {x.titulos === 1 ? "título" : "títulos"}</em></div>)}
                    </div>
                  ))}
                  {Object.keys(stats.maisTitulosPorJogo || {}).length > 1 && (
                    <div>
                      <div className="v2-bloco-titulo">Somando tudo</div>
                      {stats.maisTitulos.map((x, i) => <div key={x.userId} className="v2-hall-linha"><span>{i + 1}º</span><Jogador id={x.userId} nick={x.nickname} /><em>{x.titulos} {x.titulos === 1 ? "título" : "títulos"}</em></div>)}
                    </div>
                  )}
                </div>
              </section>
              <section className="v2-cartao">
                <h2>Recordes de pontuação</h2>
                {Object.entries(stats.recordes || {}).map(([j, r]) => (
                  <div key={j} className="v2-hall-linha"><span>{NOME[j] || j}</span><Jogador id={r.userId} nick={r.nickname} /><em>{r.points.toLocaleString("pt-BR")} · {r.label}</em></div>
                ))}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
