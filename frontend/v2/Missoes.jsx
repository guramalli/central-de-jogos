import { useEffect, useState } from "react";
import { api } from "./api.js";
import Topo from "./Topo.jsx";
import Rodape from "./Rodape.jsx";

export default function Missoes({ usuario }) {
  const [dados, setDados] = useState(null);
  const [streak, setStreak] = useState(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState(null);
  const [resgatando, setResgatando] = useState(null);

  function carregar() {
    api.get("/missoes/lista").then(({ data }) => setDados(data)).catch(() => setErro("Não foi possível carregar as missões."));
    api.get("/missoes/streak").then(({ data }) => setStreak(data)).catch(() => {});
  }
  useEffect(carregar, []);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  async function resgatar(missaoKey, tipo) {
    setResgatando(missaoKey);
    try {
      const { data } = await api.post("/missoes/resgatar", { missaoKey, tipo });
      const nomeJogo = dados?.jogos?.[data.jogo]?.nome;
      setAviso({ ok: true, texto: `+${data.pontos} pontos${nomeJogo ? ` no ranking de ${nomeJogo}` : ""}!` });
      carregar();
    } catch (e) {
      setAviso({ ok: false, texto: e.response?.data?.error || "Não foi possível resgatar." });
    } finally {
      setResgatando(null);
    }
  }

  const bloco = (titulo, sub, lista, tipo) => {
    const feitas = lista.filter((m) => m.concluida).length;
    const porJogo = {};
    for (const m of lista) (porJogo[m.jogo || "geral"] ||= []).push(m);
    return (
      <section className="v2-cartao">
        <div className="v2-cartao-cabeca">
          <div>
            <h2>{titulo}</h2>
            <p>{sub}</p>
          </div>
          <span className="v2-contador">{feitas}/{lista.length}</span>
        </div>
        {Object.entries(porJogo).map(([jogo, missoes]) => {
          const info = dados.jogos?.[jogo] || null;
          return (
            <div key={jogo} className="v2-missoes-grupo">
              {info && <div className="v2-missoes-grupo-titulo">Missões de {info.nome} <span>· pontos vão pro ranking de {info.nome}</span></div>}
              <div className="v2-missoes-grade">
                {missoes.map((m) => {
                  const pct = m.concluida || m.resgatada ? 100 : Math.min(100, Math.round((m.progresso / m.meta) * 100));
                  return (
                    <div key={m.key} className={`v2-missao ${m.concluida ? "ok" : ""} ${m.resgatada ? "resgatada" : ""}`}>
                      <div className="v2-missao-topo">
                        <b>{m.nome}</b>
                        <span>{m.concluida || m.resgatada ? `${m.meta}/${m.meta}` : `${Math.min(m.progresso, m.meta)}/${m.meta}`}</span>
                      </div>
                      <p>{m.descricao}</p>
                      <div className="v2-missao-barra"><div style={{ width: `${pct}%` }} /></div>
                      <div className="v2-missao-rodape">
                        <span className="v2-missao-pontos">+{m.pontos} pts</span>
                        {m.concluida && !m.resgatada && (
                          <button className="v2-botao-resgatar" onClick={() => resgatar(m.key, tipo)} disabled={resgatando === m.key}>
                            {resgatando === m.key ? "…" : "Resgatar"}
                          </button>
                        )}
                        {m.resgatada && <span className="v2-missao-feita">resgatada</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    );
  };

  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo="missoes" />
      <main className="v2-pagina">
        <div className="v2-pagina-cabeca">
          <h1>Missões</h1>
        </div>
        <p className="v2-pagina-nota">As diárias viram à meia-noite, as semanais toda segunda. O progresso conta sozinho enquanto você joga.</p>

        {aviso && <div className={`v2-faixa-aviso ${aviso.ok ? "ok" : "erro"}`} role="status">{aviso.texto}</div>}
        {erro && <div className="v2-faixa-aviso erro">{erro}</div>}
        {!dados && !erro && <div className="v2-carregando">Carregando missões…</div>}

        {streak && (
          <section className="v2-cartao v2-streak">
            <div className="v2-streak-topo">
              <div className="v2-streak-fogo">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3.5 2-4.5.3 1.5 1 2.5 2 3 0-3 .5-5.5 1-8.5z" /></svg>
                <b>{streak.atual}</b>
              </div>
              <div className="v2-streak-texto">
                <b>{streak.atual === 0 ? "Comece sua sequência jogando hoje!" : `${streak.atual === 1 ? "dia" : "dias"} seguidos jogando`}</b>
                {streak.proximoMarco && (
                  <span>Próximo prêmio em {streak.proximoMarco.dias - streak.atual} {streak.proximoMarco.dias - streak.atual === 1 ? "dia" : "dias"}: +{streak.proximoMarco.pontos} pts</span>
                )}
              </div>
              <div className="v2-streak-recorde"><span>seu recorde</span><b>{streak.recorde}</b></div>
            </div>
            <div className="v2-streak-marcos">
              {streak.marcos.map((m) => (
                <div key={m.dias} className={`v2-marco ${streak.atual >= m.dias ? "ok" : ""}`} title={`${m.dias} dias: +${m.pontos} pts`}>
                  <b>{m.dias}d</b><span>+{m.pontos}</span>
                </div>
              ))}
            </div>
            <p className="v2-streak-nota">A sequência zera se você passar um dia inteiro sem jogar. Os pontos vão pro ranking do jogo em que você mais pontuou no mês.</p>
          </section>
        )}

        {dados && !dados.ativas && <section className="v2-cartao"><p>As missões ainda não estão disponíveis.</p></section>}
        {dados?.ativas && bloco("Diárias", "Renovam todo dia à meia-noite", dados.diarias, "diarias")}
        {dados?.ativas && bloco("Semanais", "Renovam toda segunda-feira", dados.semanais, "semanais")}
      </main>
      <Rodape />
    </div>
  );
}
