import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import { irPara, irParaPagina, irParaStop, irParaAcro } from "./App.jsx";
import { REGRAS_ACRO } from "./SalaAcro.jsx";
import { corDoTema, nomeDoTema } from "./temas.js";
import { buscarPerfil, dadosDoJogo } from "./perfil.js";
import Topo from "./Topo.jsx";
import Avatar from "./Avatar.jsx";
import Rodape from "./Rodape.jsx";

const LOGO_JOGO = { quiz: "/quiz-logo.png", stop: "/stop-logo.png", acromania: "/acromania-logo.png" };
const NOME_JOGO = { quiz: "Quiz", stop: "Stop", acromania: "Acromania" };

export default function Lobby({ usuario, jogoInicial }) {
  const [salas, setSalas] = useState(null);
  const [erro, setErro] = useState(false);
  const [perfil, setPerfil] = useState(null);
  const [nivel, setNivel] = useState(() => localStorage.getItem("eg_v2_nivel") || "padrao");
  // Qual jogo o lobby mostra. Lembrado entre visitas.
  const [jogo] = useState(() => (["quiz", "stop", "acromania"].includes(jogoInicial) ? jogoInicial : localStorage.getItem("eg_v2_jogo") || "quiz"));
  const [salasStop, setSalasStop] = useState(null);
  const [privadas, setPrivadas] = useState([]);
  const [acro, setAcro] = useState(null); // { ativo, rooms } do Acromania
  const [privadasAcro, setPrivadasAcro] = useState([]);

  useEffect(() => {
    let vivo = true;
    const carregar = () =>
      api.get("/quiz-rooms")
        .then(({ data }) => vivo && (setSalas(data), setErro(false)))
        .catch(() => vivo && setErro(true));
    carregar();
    const t = setInterval(carregar, 20000);
    buscarPerfil(usuario.id, 20000).then((p) => vivo && p && setPerfil(p));
    return () => { vivo = false; clearInterval(t); };
  }, [usuario.id]);

  useEffect(() => localStorage.setItem("eg_v2_nivel", nivel), [nivel]);
  useEffect(() => localStorage.setItem("eg_v2_jogo", jogo), [jogo]);

  useEffect(() => {
    if (jogo !== "stop") return;
    let vivo = true;
    const carregar = () => {
      api.get("/rooms").then(({ data }) => vivo && setSalasStop(data)).catch(() => vivo && setSalasStop((x) => x || []));
      api.get("/salas-privadas").then(({ data }) => vivo && setPrivadas(data || [])).catch(() => {});
    };
    carregar();
    const t = setInterval(() => { if (!document.hidden) carregar(); }, 20000);
    return () => { vivo = false; clearInterval(t); };
  }, [jogo]);

  useEffect(() => {
    if (jogo !== "acromania") return;
    let vivo = true;
    const carregar = () => {
      api.get("/acromania-rooms")
        .then(({ data }) => vivo && setAcro(Array.isArray(data) ? { ativo: true, rooms: data } : { ativo: data.ativo !== false, rooms: data.rooms || [] }))
        .catch(() => vivo && setAcro((x) => x || { ativo: true, rooms: [] }));
      api.get("/salas-privadas/acromania").then(({ data }) => vivo && setPrivadasAcro(data || [])).catch(() => {});
    };
    carregar();
    const t = setInterval(() => { if (!document.hidden) carregar(); }, 20000);
    return () => { vivo = false; clearInterval(t); };
  }, [jogo]);

  const arenas = useMemo(() => (salas || []).filter((s) => s.arena), [salas]);
  const visiveis = useMemo(() => {
    if (!salas) return [];
    // Sala sem nível (ex.: Direito) aparece nos dois filtros.
    return salas
      .filter((s) => !s.arena && (!s.tier || s.tier === nivel))
      .sort((a, b) => (b.onlineCount - a.onlineCount) || nomeDoTema(a.label).localeCompare(nomeDoTema(b.label), "pt-BR"));
  }, [salas, nivel]);

  const jogandoQuiz = salas ? salas.reduce((n, s) => n + (s.onlineCount || 0), 0) : 0;
  const jogandoStop = salasStop ? salasStop.reduce((n, s) => n + (s.onlineCount || 0), 0) : 0;
  const jogandoAcro = acro?.rooms ? acro.rooms.reduce((n, s) => n + (s.onlineCount || 0), 0) : 0;
  const jogando = jogo === "stop" ? jogandoStop : jogo === "acromania" ? jogandoAcro : jogandoQuiz;
  const { mensal, vitalicio } = dadosDoJogo(perfil, jogo);
  const pct = mensal?.nextRank && mensal.nextRank.pointsNeeded != null
    ? Math.max(4, Math.min(100, Math.round((mensal.points / (mensal.points + mensal.nextRank.pointsNeeded)) * 100)))
    : mensal ? 100 : 0;

  const entrar = (e, id) => { e.preventDefault(); irPara(id); };

  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo={jogo} />

      <div className="v2-lobby">
        <section className="v2-saudacao">
          <div className="v2-saudacao-topo">
            <div className="v2-lobby-jogo">
              <a className="v2-link v2-lobby-voltar" href="/v2/" onClick={(e) => { e.preventDefault(); irPara(null); }}>← todos os jogos</a>
              <img src={LOGO_JOGO[jogo]} alt={NOME_JOGO[jogo]} />
              <p>{jogo === "stop" ? "Escolha uma sala e bora pro Stop." : jogo === "acromania" ? "Um tema, algumas letras e a frase mais criativa vence." : "Escolha um tema e bora jogar."}</p>
            </div>
            {mensal?.rank && (
              <a className="v2-minha-patente" href={`/v2/?pagina=patentes&jogo=${jogo}`} onClick={(e) => { e.preventDefault(); irParaPagina("patentes", { jogo }); }} title="Ver todas as patentes">
                {mensal.rank.icon && <img src={mensal.rank.icon} alt="" className={mensal.rank.brilha ? "brilha" : ""} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                <div>
                  <b>{mensal.rank.name}</b>
                  <span>{mensal.points.toLocaleString("pt-BR")} pts no mês{mensal.position ? ` · ${mensal.position}º no ranking` : ""}</span>
                  <span className="v2-zera">patente e pontos do mês zeram dia 1º</span>
                </div>
              </a>
            )}
          </div>
          <div className="v2-barra-patente" aria-hidden="true"><div style={{ width: `${pct}%` }}><i /></div></div>
          <div className="v2-saudacao-rodape">
            <span>{mensal?.nextRank ? `Faltam ${mensal.nextRank.pointsNeeded.toLocaleString("pt-BR")} pra ${mensal.nextRank.name}` : mensal ? "Patente máxima do mês!" : (jogo === "quiz" ? "Acerte uma pergunta pra entrar no ranking do mês" : "Pontue numa rodada pra entrar no ranking do mês")}</span>
            <span>{(vitalicio?.points || 0).toLocaleString("pt-BR")} pts vitalícios (não zeram)</span>
          </div>
        </section>


        <Top3 jogo={jogo} />

        {(jogo === "stop" || jogo === "quiz") && (
          <a className="v2-chamada-multi" href={`/v2/?pagina=varias&jogo=${jogo}`} onClick={(e) => { e.preventDefault(); irParaPagina("varias", { jogo }); }}>
            <span className="v2-chamada-multi-icone" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></svg>
            </span>
            <span className="v2-chamada-multi-texto"><b>Jogar em várias salas ao mesmo tempo</b><span>Abra até 4 partidas na mesma tela, sem trocar de aba</span></span>
            <span aria-hidden="true">→</span>
          </a>
        )}

        {jogo === "stop" && <LobbyStop salas={salasStop} privadas={privadas} jogando={jogandoStop} />}
        {jogo === "acromania" && <LobbyAcro dados={acro} privadas={privadasAcro} jogando={jogandoAcro} />}


        {jogo === "quiz" && (<>
        <div className="v2-filtros">
          <div className="v2-niveis" role="group" aria-label="Nível das salas">
            <button className={nivel === "padrao" ? "v2-nivel v2-nivel-padrao ativo" : "v2-nivel v2-nivel-padrao"} onClick={() => setNivel("padrao")}>Padrão</button>
            <button className={nivel === "avancado" ? "v2-nivel v2-nivel-avancado ativo" : "v2-nivel v2-nivel-avancado"} onClick={() => setNivel("avancado")}>Avançada</button>
          </div>
          {jogando > 0 && <div className="v2-jogando"><span className="v2-ponto-vivo" />{jogando} jogando agora</div>}
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
                onClick={(e) => entrar(e, s.roomId)}
                className="v2-card"
                title={s.description || undefined}
                style={{ "--cor": cor, "--sombra": sombra, animationDelay: `${i * 35}ms` }}
              >
                <div className="v2-card-topo">
                  <span className="v2-card-icone">{s.themeKey ? <img src={`/temas-quiz/${s.themeKey}.png`} alt="" /> : null}</span>
                  {s.onlineCount > 0 && <span className="v2-card-selo">{s.onlineCount} jogando</span>}
                </div>
                <div>
                  <div className="v2-card-nome">{nomeDoTema(s.label)}</div>
                  <div className="v2-card-sub">{s.questionCount ? `${s.questionCount.toLocaleString("pt-BR")} perguntas` : ""}</div>
                  {s.streakRecord?.count > 0 && (
                    <div className="v2-card-recorde" title="Recorde de acertos seguidos nesta sala">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3.5 2-4.5.3 1.5 1 2.5 2 3 0-3 .5-5.5 1-8.5z" /></svg>
                      {s.streakRecord.count} · {s.streakRecord.nickname}
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>

        {arenas.length > 0 && (
          <section className="v2-arenas">
            <div className="v2-bloco-titulo v2-arenas-titulo">Arenas</div>
            {arenas.map((a) => (
              <a key={a.roomId} href={`/v2/?sala=${a.roomId}`} onClick={(e) => entrar(e, a.roomId)} className="v2-arena">
                <span className="v2-arena-raio" aria-hidden="true">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h8l-1 8 9-12h-8z" /></svg>
                </span>
                <div className="v2-arena-texto">
                  <b>{a.label.replace(/^[^\p{L}\d]+/u, "")}</b>
                  <span>Todo mundo que acerta pontua{a.roundsPerTurn ? ` · turnos de ${a.roundsPerTurn} perguntas` : ""}{a.turnBonus ? ` · bônus de ${a.turnBonus}` : ""}</span>
                </div>
                {a.onlineCount > 0 ? <span className="v2-card-selo">{a.onlineCount} jogando</span> : <span className="v2-arena-cta">Entrar</span>}
              </a>
            ))}
          </section>
        )}
        </>)}
      </div>
      <Rodape />
    </div>
  );
}

// Dificuldade das salas do Stop: rótulo, arte e cor.
const DIFICULDADE = {
  basic: { rotulo: "Iniciante", arte: "iniciante", cor: "#06D6A0", sombra: "#049A74" },
  mid: { rotulo: "Intermediária", arte: "intermediaria", cor: "#FFB86F", sombra: "#C9803A" },
  advanced: { rotulo: "Difícil", arte: "dificil", cor: "#FF8A7F", sombra: "#C7493F" },
};

function LobbyStop({ salas, privadas, jogando }) {
  const entrar = (e, id) => { e.preventDefault(); irParaStop(id); };
  return (
    <>
      <div className="v2-filtros">
        <p className="v2-stop-explica">Rodadas em blocos de 10, com 6 temas e 1 letra por vez.</p>
        {jogando > 0 && <div className="v2-jogando"><span className="v2-ponto-vivo" />{jogando} jogando agora</div>}
      </div>
      <div className="v2-grade v2-grade-stop">
        {!salas && Array.from({ length: 6 }).map((_, i) => <div key={i} className="v2-card v2-card-esqueleto" />)}
        {(salas || []).map((s, i) => {
          const d = s.semPontuacao
            ? { rotulo: "Sem pontuação", arte: "zoeira", cor: "#C3A6FF", sombra: "#8465D1" }
            : DIFICULDADE[s.difficulty] || DIFICULDADE.basic;
          const cheia = s.onlineCount >= s.maxPlayers;
          const trancada = s.minLifetimePoints > 0;
          return (
            <a
              key={s.roomId}
              href={`/v2/?stop=${s.roomId}`}
              onClick={(e) => entrar(e, s.roomId)}
              className={`v2-card v2-card-stop ${cheia ? "cheia" : ""}`}
              style={{ "--cor": d.cor, "--sombra": d.sombra, animationDelay: `${i * 35}ms` }}
              title={s.description || undefined}
            >
              <div className="v2-card-topo">
                <span className="v2-card-icone"><img src={`/dificuldades/${d.arte}.png`} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} /></span>
                {s.onlineCount > 0 && <span className="v2-card-selo">{cheia ? "lotada" : `${s.onlineCount}/${s.maxPlayers}`}</span>}
              </div>
              <div>
                <div className="v2-card-nome">{s.label}{trancada && <svg className="v2-cadeado" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-label="exige pontos"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>}</div>
                <div className="v2-card-sub">{d.rotulo}{trancada ? ` · ${s.minLifetimePoints.toLocaleString("pt-BR")} pts vitalícios` : ""}</div>
              </div>
            </a>
          );
        })}
      </div>

      <section className="v2-privadas">
        <div className="v2-privadas-cabeca">
          <div>
            <h2>Salas dos jogadores</h2>
            <p>Criadas pela galera, com a mesa validando as palavras. Não contam pro ranking.</p>
          </div>
          <a className="v2-botao v2-botao-amarelo" href="/v2/?pagina=privadas&jogo=stop" onClick={(e) => { e.preventDefault(); irParaPagina("privadas", { jogo: "stop" }); }}>+ Criar sala</a>
        </div>
        {privadas.length === 0 ? (
          <p className="v2-privadas-vazio">Nenhuma sala aberta agora.</p>
        ) : (
          <div className="v2-privadas-lista">
            {privadas.map((p) => (
              <a key={p.roomId} className="v2-privada" href={`/v2/?pagina=privadas&jogo=stop&privada=${p.roomId}`} onClick={(e) => { e.preventDefault(); irParaPagina("privadas", { jogo: "stop", privada: p.roomId }); }}>
                <div className="v2-privada-topo">
                  <b>{p.temSenha ? "🔒 " : ""}{p.nome}</b>
                  <span>{p.jogadores === 0 ? "esperando" : `${p.jogadores}/${p.maxPlayers}`}</span>
                </div>
                <div className="v2-privada-info">por {p.criador} · {p.answerSeconds}s por rodada · {p.temas.length} temas</div>
              </a>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function LobbyAcro({ dados, privadas, jogando }) {
  const entrar = (e, id) => { e.preventDefault(); irParaAcro(id); };
  if (dados && !dados.ativo) {
    return (
      <section className="v2-cartao v2-manutencao">
        <h2>Em manutenção</h2>
        <p>O Acromania está temporariamente fora do ar. O Stop e o Quiz seguem funcionando normalmente.</p>
      </section>
    );
  }
  return (
    <>
      <div className="v2-filtros">
        <p className="v2-stop-explica">Partidas de 8 rodadas. Escreva, vote, e a galera decide.</p>
        {jogando > 0 && <div className="v2-jogando"><span className="v2-ponto-vivo" />{jogando} jogando agora</div>}
      </div>
      <div className="v2-acro-lobby">
        <div className="v2-grade v2-grade-acro">
          {!dados && Array.from({ length: 2 }).map((_, i) => <div key={i} className="v2-card v2-card-esqueleto" />)}
          {(dados?.rooms || []).map((r, i) => {
            const cheia = r.onlineCount >= r.maxPlayers;
            return (
              <a key={r.roomId} href={`/v2/?acro=${r.roomId}`} onClick={(e) => entrar(e, r.roomId)} className={`v2-card v2-card-stop ${cheia ? "cheia" : ""}`} style={{ "--cor": i % 2 ? "#FF9ED2" : "#C3A6FF", "--sombra": i % 2 ? "#C75A96" : "#8465D1", animationDelay: `${i * 35}ms` }} title={r.description || undefined}>
                <div className="v2-card-topo">
                  <span className="v2-card-icone"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2B1B5E" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" /></svg></span>
                  {r.onlineCount > 0 && <span className="v2-card-selo">{cheia ? "lotada" : `${r.onlineCount}/${r.maxPlayers}`}</span>}
                </div>
                <div>
                  <div className="v2-card-nome">{r.label}</div>
                  <div className="v2-card-sub">roda com {r.minPlayersToStart}+ jogadores{r.comBots ? " · tem jogadores automáticos" : ""}</div>
                </div>
              </a>
            );
          })}
        </div>
        <section className="v2-cartao v2-acro-como">
          <h2>Como pontuar</h2>
          {REGRAS_ACRO.map(([p, t]) => <div key={t} className="v2-leg"><b className="v2-acro-regra-pts">{p}</b>{t}</div>)}
          <div className="v2-leg-bonus">Fim da partida: 1º +100 · 2º +60 · 3º +30</div>
        </section>
      </div>

      <section className="v2-privadas">
        <div className="v2-privadas-cabeca">
          <div>
            <h2>Salas dos jogadores</h2>
            <p>Com tempos e número de rodadas escolhidos por quem abriu. Não contam pro ranking.</p>
          </div>
          <a className="v2-botao v2-botao-amarelo" href="/v2/?pagina=privadas&jogo=acromania" onClick={(e) => { e.preventDefault(); irParaPagina("privadas", { jogo: "acromania" }); }}>+ Criar sala</a>
        </div>
        {privadas.length === 0 ? <p className="v2-privadas-vazio">Nenhuma sala aberta agora.</p> : (
          <div className="v2-privadas-lista">
            {privadas.map((p) => (
              <a key={p.roomId} className="v2-privada" href={`/v2/?pagina=privadas&jogo=acromania&privada=${p.roomId}`} onClick={(e) => { e.preventDefault(); irParaPagina("privadas", { jogo: "acromania", privada: p.roomId }); }}>
                <div className="v2-privada-topo">
                  <b>{p.temSenha ? "🔒 " : ""}{p.nome}</b>
                  <span>{p.jogadores === 0 ? "esperando" : `${p.jogadores}/${p.maxPlayers}`}</span>
                </div>
                {p.criador && <div className="v2-privada-info">por {p.criador}</div>}
              </a>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// TOP 3 DO MÊS de cada jogo, dentro da lobby (o MiniPodium do clássico).
// O valor do Pix aparece só nos jogos que pagam (Stop e Quiz).
const PREMIOS = ["R$ 200", "R$ 100", "R$ 50"];
function Top3({ jogo }) {
  const [linhas, setLinhas] = useState(null);
  useEffect(() => {
    let vivo = true;
    setLinhas(null);
    api.get(`/ranking/monthly/${jogo}`).then(({ data }) => vivo && setLinhas((data || []).slice(0, 3))).catch(() => vivo && setLinhas([]));
    return () => { vivo = false; };
  }, [jogo]);
  const pagaPix = jogo === "stop" || jogo === "quiz";
  return (
    <section className="v2-cartao v2-top3">
      <div className="v2-cartao-cabeca">
        <h2>Top 3 do mês</h2>
        <a className="v2-link" href={`/v2/?pagina=ranking&jogo=${jogo}`} onClick={(e) => { e.preventDefault(); irParaPagina("ranking", { jogo }); }}>Ver ranking completo →</a>
      </div>
      {linhas === null && <div className="v2-carregando">Carregando…</div>}
      {linhas && linhas.length === 0 && <div className="v2-vazio">Ninguém pontuou este mês ainda. O primeiro lugar pode ser seu!</div>}
      {linhas && linhas.length > 0 && (
        <div className="v2-top3-lista">
          {linhas.map((r) => (
            <a key={r.position} className={`v2-top3-item p${r.position}`} href={`/v2/?pagina=jogador&id=${r.userId}`} onClick={(e) => { e.preventDefault(); irParaPagina("jogador", { id: r.userId }); }}>
              <span className="v2-top3-pos">{r.position}º</span>
              <Avatar userId={r.userId} nickname={r.nickname} tamanho={44} borda />
              <span className="v2-top3-texto">
                <b>{r.nickname}</b>
                <span>{Number(r.points || 0).toLocaleString("pt-BR")} pts</span>
              </span>
              {pagaPix && <em className="v2-top3-premio">{PREMIOS[r.position - 1]}</em>}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
