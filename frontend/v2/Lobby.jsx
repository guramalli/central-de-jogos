import { useEffect, useMemo, useState } from "react";
import { api, sair } from "./api.js";
import { irPara } from "./App.jsx";
import { corDoTema, nomeDoTema, iniciais } from "./temas.js";

// Nesta primeira versão só entram as salas de TEMA. As arenas têm regras
// próprias (todo mundo pontua, turnos, bônus) e ficam pra depois.
export default function Lobby({ usuario }) {
  const [salas, setSalas] = useState(null);
  const [erro, setErro] = useState(false);
  const [nivel, setNivel] = useState(() => localStorage.getItem("eg_v2_nivel") || "padrao");

  useEffect(() => {
    let vivo = true;
    const carregar = () =>
      api.get("/quiz-rooms")
        .then(({ data }) => vivo && (setSalas(data.filter((s) => !s.arena)), setErro(false)))
        .catch(() => vivo && setErro(true));
    carregar();
    // Contagem de "jogando" atualiza sozinha, sem recarregar a página.
    const t = setInterval(carregar, 20000);
    return () => { vivo = false; clearInterval(t); };
  }, []);

  useEffect(() => localStorage.setItem("eg_v2_nivel", nivel), [nivel]);

  const visiveis = useMemo(() => {
    if (!salas) return [];
    // Sala sem nível (ex.: Direito) aparece nos dois filtros.
    return salas
      .filter((s) => !s.tier || s.tier === nivel)
      .sort((a, b) => (b.onlineCount - a.onlineCount) || nomeDoTema(a.label).localeCompare(nomeDoTema(b.label), "pt-BR"));
  }, [salas, nivel]);

  const jogando = salas ? salas.reduce((n, s) => n + (s.onlineCount || 0), 0) : 0;

  return (
    <div className="v2-app">
      <header className="v2-topo">
        <a className="v2-logo" href="/v2/" onClick={(e) => { e.preventDefault(); irPara(null); }}>
          <span className="v2-logo-icone" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="11" rx="5" /><path d="M7 11v3M5.5 12.5h3" /><circle cx="16" cy="11.5" r="0.8" /><circle cx="18" cy="13.5" r="0.8" /></svg>
          </span>
          educação<span className="v2-destaque"> gamer</span>
          <span className="v2-selo-beta">v2 beta</span>
        </a>
        <div className="v2-topo-dir">
          <a className="v2-link-classico" href="/jogos/quiz">site clássico</a>
          <button
            className="v2-avatar"
            aria-label={`Conectado como ${usuario.nickname}. Sair`}
            title="Sair"
            onClick={() => { if (confirm("Sair da conta?")) { sair(); window.location.reload(); } }}
          >
            {iniciais(usuario.nickname)}
          </button>
        </div>
      </header>

      <div className="v2-lobby">
        <section className="v2-saudacao">
          <h1>Oi, {usuario.nickname}!</h1>
          <p>Escolha um tema e bora jogar.</p>
        </section>

        <div className="v2-filtros">
          <div className="v2-niveis" role="group" aria-label="Nível das salas">
            <button className={nivel === "padrao" ? "v2-nivel v2-nivel-padrao ativo" : "v2-nivel v2-nivel-padrao"} onClick={() => setNivel("padrao")}>Padrão</button>
            <button className={nivel === "avancado" ? "v2-nivel v2-nivel-avancado ativo" : "v2-nivel v2-nivel-avancado"} onClick={() => setNivel("avancado")}>Avançada</button>
          </div>
          {jogando > 0 && (
            <div className="v2-jogando"><span className="v2-ponto-vivo" />{jogando} jogando agora</div>
          )}
        </div>

        {erro && !salas && <p className="v2-aviso">Não deu pra carregar as salas. Tentando de novo…</p>}

        <div className="v2-grade">
          {!salas && !erro && Array.from({ length: 8 }).map((_, i) => <div key={i} className="v2-card v2-card-esqueleto" />)}
          {visiveis.map((s, i) => {
            const [cor, sombra] = corDoTema(s.themeKey);
            return (
              <a
                key={s.roomId}
                href={`/v2/?sala=${s.roomId}`}
                onClick={(e) => { e.preventDefault(); irPara(s.roomId); }}
                className="v2-card"
                style={{ "--cor": cor, "--sombra": sombra, animationDelay: `${i * 35}ms` }}
              >
                <div className="v2-card-topo">
                  <span className="v2-card-icone">
                    {s.themeKey ? <img src={`/temas-quiz/${s.themeKey}.png`} alt="" /> : null}
                  </span>
                  {s.onlineCount > 0 && <span className="v2-card-selo">{s.onlineCount} jogando</span>}
                </div>
                <div>
                  <div className="v2-card-nome">{nomeDoTema(s.label)}</div>
                  <div className="v2-card-sub">{s.onlineCount > 0 ? "entre agora" : "seja o primeiro"}</div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
