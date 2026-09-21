import { useEffect, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Topo from "./Topo.jsx";
import Rodape from "./Rodape.jsx";
import Avatar from "./Avatar.jsx";

const JOGOS = { stop: "Stop", quiz: "Quiz", acromania: "Acromania", geral: "Geral" };
const mes = (k) => {
  const [a, m] = String(k).split("-");
  const s = new Date(Number(a), Number(m) - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function Cla({ usuario, claId }) {
  const [cla, setCla] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get(`/clans/${claId}`).then(({ data }) => setCla(data)).catch((e) => setErro(e.response?.data?.error || "Não foi possível carregar esse clã."));
  }, [claId]);

  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo="clas" />
      <main className="v2-pagina">
        <a className="v2-link" href={linkDaPagina("clas")} onClick={(e) => { e.preventDefault(); irParaPagina("clas"); }}>← Clãs</a>
        {erro && <div className="v2-faixa-aviso erro">{erro}</div>}
        {!cla && !erro && <div className="v2-carregando">Carregando…</div>}
        {cla && (
          <>
            <section className="v2-cartao v2-cla-cabeca">
              <span className="v2-cla-tag">{cla.tag}</span>
              <div>
                <h1>{cla.name}</h1>
                <p>{cla.members.length} membros · dono {cla.owner?.nickname} · {cla.monthlyPoints.toLocaleString("pt-BR")} pts no mês</p>
              </div>
            </section>

            {cla.campeonatos?.length > 0 && (
              <section className="v2-cartao">
                <h2>Troféus</h2>
                <div className="v2-trofeus-cla">
                  {cla.campeonatos.map((c) => (
                    <div key={c.id} className="v2-trofeu-cla">
                      <b>Campeão {JOGOS[c.gameKey] || c.gameKey}</b>
                      <span>{mes(c.monthKey)}</span>
                      <em>{c.points.toLocaleString("pt-BR")} pts</em>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="v2-cartao">
              <h2>Membros</h2>
              <p className="v2-cartao-nota">Quanto cada um contribui pros pontos do clã neste mês.</p>
              <div className="v2-tabela">
                {cla.members.map((m, i) => (
                  <div key={m.id} className={`v2-linha ${m.id === usuario.id ? "eu" : ""}`}>
                    <span className="v2-linha-pos">{i + 1}</span>
                    <Avatar userId={m.id} nickname={m.nickname} tamanho={36} />
                    <span className="v2-linha-nome">
                      <a href={linkDaPagina("jogador", { id: m.id })} onClick={(e) => { e.preventDefault(); irParaPagina("jogador", { id: m.id }); }}>{m.nickname}</a>
                      {m.id === cla.ownerId && <span className="v2-tag-voce">dono</span>}
                    </span>
                    {m.contaPontos ? (
                      <>
                        <span className="v2-cla-barra" aria-hidden="true"><i style={{ width: `${m.percent}%` }} /></span>
                        <span className="v2-linha-extra">{m.percent}%</span>
                        <b className="v2-linha-pts">{m.points.toLocaleString("pt-BR")}</b>
                      </>
                    ) : <span className="v2-linha-extra">não pontua</span>}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <Rodape />
    </div>
  );
}
