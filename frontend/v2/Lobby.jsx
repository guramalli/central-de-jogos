import { useEffect, useMemo, useState } from "react";
import { api, sair, novoSocket } from "./api.js";
import { irPara } from "./App.jsx";
import { corDoTema, nomeDoTema } from "./temas.js";
import { buscarPerfil, dadosDoJogo } from "./perfil.js";
import Avatar from "./Avatar.jsx";
import NickHover from "./NickHover.jsx";
import { ConviteRecebido } from "./Convites.jsx";

export default function Lobby({ usuario }) {
  const [salas, setSalas] = useState(null);
  const [erro, setErro] = useState(false);
  const [perfil, setPerfil] = useState(null);
  const [socket, setSocket] = useState(null);
  const [nivel, setNivel] = useState(() => localStorage.getItem("eg_v2_nivel") || "padrao");

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

  // Conexão do lobby: sem ela a pessoa aparece OFFLINE pros amigos enquanto
  // escolhe a sala, e não recebe convite. Fecha ao entrar numa sala (a sala
  // abre a sua própria).
  useEffect(() => {
    const s = novoSocket();
    s.connect();
    setSocket(s);
    return () => { s.removeAllListeners(); s.disconnect(); };
  }, []);

  useEffect(() => localStorage.setItem("eg_v2_nivel", nivel), [nivel]);

  const arenas = useMemo(() => (salas || []).filter((s) => s.arena), [salas]);
  const visiveis = useMemo(() => {
    if (!salas) return [];
    // Sala sem nível (ex.: Direito) aparece nos dois filtros.
    return salas
      .filter((s) => !s.arena && (!s.tier || s.tier === nivel))
      .sort((a, b) => (b.onlineCount - a.onlineCount) || nomeDoTema(a.label).localeCompare(nomeDoTema(b.label), "pt-BR"));
  }, [salas, nivel]);

  const jogando = salas ? salas.reduce((n, s) => n + (s.onlineCount || 0), 0) : 0;
  const { mensal, vitalicio } = dadosDoJogo(perfil, "quiz");
  const pct = mensal?.nextRank && mensal.nextRank.pointsNeeded != null
    ? Math.max(4, Math.min(100, Math.round((mensal.points / (mensal.points + mensal.nextRank.pointsNeeded)) * 100)))
    : mensal ? 100 : 0;

  const entrar = (e, id) => { e.preventDefault(); irPara(id); };

  return (
    <div className="v2-app">
      <header className="v2-topo">
        <a className="v2-logo" href="/v2/" onClick={(e) => entrar(e, null)}>
          <span className="v2-logo-icone" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="11" rx="5" /><path d="M7 11v3M5.5 12.5h3" /><circle cx="16" cy="11.5" r="0.8" /><circle cx="18" cy="13.5" r="0.8" /></svg>
          </span>
          educação<span className="v2-destaque"> gamer</span>
          <span className="v2-selo-beta">v2 beta</span>
        </a>
        <nav className="v2-menu" aria-label="Site">
          <a href="/ranking">Ranking</a>
          <a href="/missoes">Missões</a>
          <a href="/amigos">Amigos</a>
          <a href="/cla">Clãs</a>
          <a href="/patentes-quiz">Patentes</a>
        </nav>
        <div className="v2-topo-dir">
          <a className="v2-link-classico" href="/jogos/quiz">site clássico</a>
          <a href="/perfil" className="v2-topo-avatar" title="Meu perfil">
            <Avatar userId={usuario.id} nickname={usuario.nickname} tamanho={44} borda />
          </a>
          <button className="v2-sair" title="Sair da conta" aria-label="Sair da conta" onClick={() => { if (confirm("Sair da conta?")) { sair(); window.location.reload(); } }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
          </button>
        </div>
      </header>

      <div className="v2-lobby">
        <section className="v2-saudacao">
          <div className="v2-saudacao-topo">
            <div>
              <h1>Oi, <NickHover userId={usuario.id} nickname={usuario.nickname} meuId={usuario.id}>{usuario.nickname}</NickHover>!</h1>
              <p>Escolha um tema e bora jogar.</p>
            </div>
            {mensal?.rank && (
              <div className="v2-minha-patente">
                {mensal.rank.icon && <img src={mensal.rank.icon} alt="" className={mensal.rank.brilha ? "brilha" : ""} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                <div>
                  <b>{mensal.rank.name}</b>
                  <span>{mensal.points.toLocaleString("pt-BR")} pts no mês{mensal.position ? ` · ${mensal.position}º no ranking` : ""}</span>
                </div>
              </div>
            )}
          </div>
          <div className="v2-barra-patente" aria-hidden="true"><div style={{ width: `${pct}%` }}><i /></div></div>
          <div className="v2-saudacao-rodape">
            <span>{mensal?.nextRank ? `Faltam ${mensal.nextRank.pointsNeeded.toLocaleString("pt-BR")} pra ${mensal.nextRank.name}` : mensal ? "Patente máxima do mês!" : "Acerte uma pergunta pra entrar no ranking do mês"}</span>
            <span>{(vitalicio?.points || 0).toLocaleString("pt-BR")} pts vitalícios · zera dia 1º</span>
          </div>
        </section>

        {arenas.length > 0 && (
          <section className="v2-arenas">
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
      </div>
      <ConviteRecebido socket={socket} />
    </div>
  );
}
