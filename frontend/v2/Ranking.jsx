import { useEffect, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Topo from "./Topo.jsx";
import Rodape from "./Rodape.jsx";
import Avatar from "./Avatar.jsx";

const JOGOS = { stop: "Stop", quiz: "Quiz", acromania: "Acromania" };
const LOGO = { stop: "/stop-logo.png", quiz: "/quiz-logo.png", acromania: "/acromania-logo.png" };
// Mesmos valores do clássico. Só Stop e Quiz pagam.
const PREMIOS = ["R$ 200", "R$ 100", "R$ 50"];
const COM_PREMIO = ["stop", "quiz"];
const fmt = (n) => (n ?? 0).toLocaleString("pt-BR");

export default function Ranking({ usuario, jogoInicial }) {
  const [jogo, setJogo] = useState(JOGOS[jogoInicial] ? jogoInicial : "quiz");
  const [aba, setAba] = useState("monthly"); // monthly | lifetime | clans
  const [linhas, setLinhas] = useState(null);

  useEffect(() => {
    if (aba !== "clans" && jogo === "geral") { setJogo("quiz"); return; }
    setLinhas(null);
    const caminho = aba === "monthly" ? `/ranking/monthly/${jogo}`
      : aba === "lifetime" ? `/ranking/lifetime/${jogo}`
      : `/clans/ranking/mensal?jogo=${jogo}`;
    api.get(caminho).then(({ data }) => setLinhas(data || [])).catch(() => setLinhas([]));
  }, [aba, jogo]);

  const cla = aba === "clans";
  const premio = aba === "monthly" && COM_PREMIO.includes(jogo);
  const jogos = cla ? ["geral", "stop", "quiz", "acromania"] : ["stop", "quiz", "acromania"];
  // O Mentira Sincera não entra no ranking de clãs: se ele estava marcado, volta pro Geral.
  useEffect(() => { if (cla && !jogos.includes(jogo)) setJogo("geral"); }, [cla, jogo]);
  const podio = (linhas || []).slice(0, 3);
  const ordemPodio = [podio[1], podio[0], podio[2]].filter(Boolean);

  const abrirJogador = (e, id) => { e.preventDefault(); irParaPagina("jogador", { id }); };
  const nome = (r) => (cla ? `[${r.tag}] ${r.name}` : r.nickname);
  const link = (r) => cla
    ? <a href={`/v2/?pagina=cla&id=${r.id}`} onClick={(e) => { e.preventDefault(); irParaPagina("cla", { id: r.id }); }}>{nome(r)}</a>
    : <a href={linkDaPagina("jogador", { id: r.userId })} onClick={(e) => abrirJogador(e, r.userId)}>{nome(r)}</a>;

  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo="ranking" />
      <main className="v2-pagina">
        <div className="v2-pagina-cabeca">
          <h1>Ranking</h1>
          <a className="v2-link" href="/v2/?pagina=hall" onClick={(e) => { e.preventDefault(); irParaPagina("hall"); }}>Hall da Fama</a>
        </div>

        <div className="v2-jogos-abas" role="group" aria-label="Jogo">
          {jogos.map((j) => (
            <button key={j} className={`v2-jogo-aba ${jogo === j ? "ativa" : ""}`} aria-pressed={jogo === j} onClick={() => setJogo(j)}>
              {j === "geral" ? <span>Geral</span> : <img src={LOGO[j]} alt={JOGOS[j]} />}
            </button>
          ))}
        </div>

        <div className="v2-segmentado" role="group" aria-label="Tipo de ranking">
          <button className={aba === "monthly" ? "ativo" : ""} onClick={() => setAba("monthly")}>Mensal</button>
          <button className={aba === "lifetime" ? "ativo" : ""} onClick={() => setAba("lifetime")}>Vitalício</button>
          <button className={aba === "clans" ? "ativo" : ""} onClick={() => setAba("clans")}>Clãs</button>
        </div>

        <p className="v2-pagina-nota">
          {cla
            ? jogo === "geral" ? "Soma dos pontos do mês de todos os membros, nos três jogos." : `Soma dos pontos do mês dos membros no ${JOGOS[jogo]}.`
            : aba === "lifetime" ? "Total acumulado desde sempre. Não zera e não vale prêmio."
            : premio ? "Zera todo dia 1º. Os três primeiros recebem por Pix no fim do mês."
            : "Zera todo dia 1º. Este jogo ainda não tem premiação em dinheiro."}
        </p>

        {linhas === null && <div className="v2-carregando">Carregando…</div>}

        {ordemPodio.length > 0 && (
          <div className="v2-podio">
            {ordemPodio.map((r) => (
              <div key={r.position} className={`v2-podio-item p${r.position}`}>
                {!cla && <Avatar userId={r.userId} nickname={r.nickname} tamanho={r.position === 1 ? 76 : 60} borda sempreBoneco />}
                <div className="v2-podio-nome">{link(r)}</div>
                <div className="v2-podio-coluna">
                  <b>{r.position}</b>
                  <span>{fmt(r.points)} pts</span>
                  {premio && <em>{PREMIOS[r.position - 1]}</em>}
                </div>
              </div>
            ))}
          </div>
        )}

        {linhas && (
          <div className="v2-tabela">
            {linhas.map((r) => {
              const eu = !cla && r.userId === usuario.id;
              return (
                <div key={r.position} className={`v2-linha ${eu ? "eu" : ""} ${r.position <= 3 ? "topo3" : ""}`}>
                  <span className="v2-linha-pos">{r.position}</span>
                  {!cla && <Avatar userId={r.userId} nickname={r.nickname} tamanho={36} />}
                  <span className="v2-linha-nome">{link(r)}{eu && <span className="v2-tag-voce">você</span>}</span>
                  {aba === "monthly" && r.rank && (
                    <span className="v2-linha-patente" title={r.rank.name}>
                      {r.rank.icon && <img src={r.rank.icon} alt="" className={r.rank.brilha ? "brilha" : ""} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                      <span>{r.rank.name}</span>
                    </span>
                  )}
                  {cla && <span className="v2-linha-extra">{r.memberCount} membros</span>}
                  <b className="v2-linha-pts">{fmt(r.points)}</b>
                </div>
              );
            })}
            {linhas.length === 0 && (
              <div className="v2-vazio-grande">
                {cla ? "Nenhum clã pontuou neste jogo ainda este mês." : "Ninguém pontuou aqui este mês. Entre numa sala e o primeiro lugar é seu."}
              </div>
            )}
          </div>
        )}
      </main>
      <Rodape />
    </div>
  );
}
