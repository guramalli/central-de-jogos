import { useEffect, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Topo from "./Topo.jsx";
import Rodape from "./Rodape.jsx";
import Praca from "./Praca.jsx";
import { CardPartidaRapida } from "./FilaNoCard.jsx";
import { NOMES_FILA } from "./fila.js";
import { ModalFeedback } from "./Modais.jsx";
import { NOVIDADES, ROTULO_TIPO } from "../src/data/novidades.js";

const NOMES = { stop: "Stop", quiz: "Quiz", acromania: "Acromania", mentira: "Mentira Sincera", tribunal: "O Tribunal", impostor: "O Impostor" };
// Jogos com página própria (não usam a lobby de salas do Stop/Quiz/Acromania).
const PAGINA_PROPRIA = { mentira: "mentira", tribunal: "tribunal", impostor: "impostor" };
const JOGOS = [
  { chave: "stop", logo: "/stop-logo.png", cor: "#FF8A7F", sombra: "#C7493F", texto: "Aqui não adianta saber todos os temas: tem que ser rápido. 6 temas, 1 letra sorteada, e quem hesita perde a rodada." },
  { chave: "quiz", logo: "/quiz-logo.png", cor: "#FFD60A", sombra: "#B88A00", texto: "Milhares de perguntas por tema — Futebol, Anime, Games, Terceirão e muito mais. Quem acerta primeiro leva os pontos!" },
  { chave: "acromania", logo: "/acromania-logo.png", cor: "#C3A6FF", sombra: "#8465D1", texto: "Um tema, algumas letras, e você cria a frase mais criativa. A galera vota na melhor.", beta: true },
  { chave: "tribunal", logo: "/tribunal-logo.png", cor: "#7CC8FF", sombra: "#3F84C4", texto: "Alguém é acusado de um crime absurdo. Promotor acusa, advogado defende, e o júri decide: culpado ou inocente?", beta: true },
  // O Impostor — em testes (sem ranking ainda). Sem logo: o card usa o título em texto.
  { chave: "impostor", titulo: "O Impostor", cor: "#FF4D5E", sombra: "#A3202E", texto: "Todo mundo sabe a palavra, menos um. Dê dicas, desconfie de todo mundo e vote em quem está blefando.", beta: true },
];

export default function Inicio({ usuario }) {
  const [perfil, setPerfil] = useState(null);
  const [titulos, setTitulos] = useState(null);
  const [online, setOnline] = useState(null);
  const [acroAtivo, setAcroAtivo] = useState(true);
  const [feedback, setFeedback] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let vivo = true;
    api.get(`/users/${usuario.id}/profile`).then(({ data }) => vivo && setPerfil(data)).catch(() => {});
    api.get(`/users/${usuario.id}/titulos`).then(({ data }) => vivo && setTitulos(data)).catch(() => {});
    api.get("/acromania-rooms").then(({ data }) => vivo && setAcroAtivo(Array.isArray(data) ? true : data.ativo !== false)).catch(() => {});
    const contar = () => api.get("/platform-stats/online").then(({ data }) => vivo && setOnline(data)).catch(() => {});
    contar();
    const t = setInterval(() => { if (!document.hidden) contar(); }, 20000);
    return () => { vivo = false; clearInterval(t); };
  }, [usuario.id]);

  // Próximo título mais perto de sair (mesma conta do clássico).
  const candidatos = [];
  for (const t of titulos?.quiz || []) if (t.proximo) candidatos.push({ nome: t.proximo.nome, atual: t.acertos, alvo: t.proximo.min, logo: t.proximo.logo, unidade: "acertos" });
  for (const t of titulos?.stop || []) if (t.proximo) candidatos.push({ nome: t.proximo.nome, atual: t.stops, alvo: t.proximo.min, logo: t.proximo.logo, unidade: "STOPs" });
  const proximoTitulo = candidatos.filter((c) => c.atual > 0).sort((a, b) => b.atual / b.alvo - a.atual / a.alvo)[0];
  // No máximo 3 cartões no painel da direita. Os jogos vão do que a pessoa
  // mais pontuou no mês pro que menos; se houver um título perto de sair,
  // ele fica com a última vaga (a meta mais concreta).
  const MAX_CARTOES = 3;
  const vagasJogos = MAX_CARTOES - (proximoTitulo ? 1 : 0);
  const mensal = (perfil?.monthly || [])
    .filter((m) => NOMES[m.gameKey])
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, vagasJogos);

  async function convidar() {
    const texto = `Vem jogar comigo na Educação Gamer! Stop, Quiz e muito mais: ${window.location.origin}/`;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) await navigator.share({ text: texto });
      else { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2500); }
    } catch {}
  }

  const jogar = (e, jogo) => { e.preventDefault(); if (PAGINA_PROPRIA[jogo]) irParaPagina(PAGINA_PROPRIA[jogo]); else irParaPagina("jogar", { jogo }); };

  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo="inicio" />
      <main className="v2-pagina v2-inicio">
        <section className="v2-cartao v2-boas-vindas">
          <div className="v2-boas-vindas-texto">
            <span className="v2-sobretitulo">Bem-vindo de volta</span>
            <h1>{usuario.nickname}</h1>
            {perfil?.visitas > 1 && <p>Essa é sua <b>{perfil.visitas}ª</b> vez no portal.</p>}
            <p>Escolha um jogo, suba de patente e dispute a premiação mensal.</p>
            <button className="v2-botao v2-botao-amarelo" onClick={convidar}>{copiado ? "Link copiado!" : "Convidar amigos"}</button>
          </div>
          <div className="v2-painel-jogador">
            {mensal.length === 0 && !proximoTitulo && <div className="v2-vazio">Jogue uma partida pra aparecer aqui a sua patente do mês.</div>}
            {mensal.map((m) => {
              const alvo = m.nextRank ? m.points + m.nextRank.pointsNeeded : null;
              const pct = alvo ? Math.min(100, Math.round((m.points / alvo) * 100)) : 100;
              return (
                <a key={m.gameKey} className="v2-painel-item" href={linkDaPagina("ranking", { jogo: m.gameKey })} onClick={(e) => { e.preventDefault(); irParaPagina("ranking", { jogo: m.gameKey }); }}>
                  <div className="v2-painel-topo">
                    {m.rank?.icon && <img src={m.rank.icon} alt="" className={m.rank.brilha ? "brilha" : ""} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                    <div>
                      <span>{NOMES[m.gameKey]}</span>
                      <b>{m.rank?.name}{m.position ? ` · ${m.position}º no mês` : ""}</b>
                    </div>
                    <em>{m.points.toLocaleString("pt-BR")} pts</em>
                  </div>
                  {m.nextRank && (
                    <>
                      <div className="v2-missao-barra"><div style={{ width: `${pct}%` }} /></div>
                      <small>faltam {m.nextRank.pointsNeeded.toLocaleString("pt-BR")} pra {m.nextRank.name}</small>
                    </>
                  )}
                </a>
              );
            })}
            {proximoTitulo && (
              <a className="v2-painel-item" href={linkDaPagina("editar-perfil")} onClick={(e) => { e.preventDefault(); irParaPagina("editar-perfil"); }}>
                <div className="v2-painel-topo">
                  {proximoTitulo.logo && <img src={proximoTitulo.logo} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                  <div><span>Próximo título</span><b>{proximoTitulo.nome}</b></div>
                  <em>{proximoTitulo.atual}/{proximoTitulo.alvo}</em>
                </div>
                <div className="v2-missao-barra"><div style={{ width: `${Math.min(100, Math.round((proximoTitulo.atual / proximoTitulo.alvo) * 100))}%` }} /></div>
                <small>{proximoTitulo.alvo - proximoTitulo.atual} {proximoTitulo.unidade} pra conquistar</small>
              </a>
            )}
          </div>
        </section>

        {/* Duas fileiras: SALAS (Stop, Quiz) e PARTIDA RÁPIDA (os jogos com fila
            de espera — a fila fica no rodapé do card). */}
        <div className="v2-jogos-cards v2-jogos-salas">
          {JOGOS.filter((j) => !NOMES_FILA[j.chave]).map((j, i) => (
            <a key={j.chave} className="v2-jogo-card" href={PAGINA_PROPRIA[j.chave] ? linkDaPagina(PAGINA_PROPRIA[j.chave]) : linkDaPagina("jogar", { jogo: j.chave })} onClick={(e) => jogar(e, j.chave)} style={{ "--cor": j.cor, "--sombra": j.sombra, animationDelay: `${i * 80}ms` }}>
              {j.beta && <span className="v2-jogo-card-beta">em testes</span>}
              {j.logo ? <img src={j.logo} alt={NOMES[j.chave]} /> : <span className="v2-jogo-card-titulo">{j.titulo}</span>}
              {online?.[j.chave] > 0 && <span className="v2-jogo-card-online"><span className="v2-ponto-vivo" />{online[j.chave]} jogando agora</span>}
              <p>{j.texto}</p>
              <span className="v2-jogo-card-cta">Ver salas →</span>
            </a>
          ))}
        </div>

        <section className="v2-jogos-rapida" aria-labelledby="v2-jogos-rapida-titulo">
          <div className="v2-jogos-rapida-topo">
            <h2 id="v2-jogos-rapida-titulo">⚡ Partida rápida</h2>
            <p>Entre na fila e jogue com quem estiver esperando. Juntou gente, aparece “Partida encontrada” — é só aceitar.</p>
          </div>
          <div className="v2-jogos-cards v2-jogos-rapidos">
            {JOGOS.filter((j) => NOMES_FILA[j.chave] && (j.chave !== "acromania" || acroAtivo)).map((j, i) => (
              <CardPartidaRapida
                key={j.chave}
                jogo={j.chave}
                logo={j.logo}
                titulo={j.titulo}
                nome={NOMES[j.chave]}
                texto={j.texto}
                cor={j.cor}
                sombra={j.sombra}
                beta={j.beta}
                online={online?.[j.chave]}
                hrefSalas={PAGINA_PROPRIA[j.chave] ? linkDaPagina(PAGINA_PROPRIA[j.chave]) : linkDaPagina("jogar", { jogo: j.chave })}
                aoVerSalas={(e) => jogar(e, j.chave)}
                atraso={(i + 2) * 80}
              />
            ))}
          </div>
        </section>

        <div className="v2-inicio-duas">
          <section className="v2-cartao v2-premiacao">
            <span className="v2-premiacao-selo">Premiação</span>
            <p>O <b>Stop</b> e o <b>Quiz</b> têm rankings mensais que premiam de verdade — cada um com os valores abaixo.</p>
            <div className="v2-premios">
              <div className="p1"><b>1º</b><span>R$ 200</span></div>
              <div className="p2"><b>2º</b><span>R$ 100</span></div>
              <div className="p3"><b>3º</b><span>R$ 50</span></div>
            </div>
            <p className="v2-cartao-nota">Os dois rankings são separados — dá para ganhar nos dois. Pagamento via Pix, e tudo zera no dia 1º.</p>
            <a className="v2-link" href={linkDaPagina("ranking")} onClick={(e) => { e.preventDefault(); irParaPagina("ranking"); }}>Ver ranking →</a>
          </section>

          <section className="v2-cartao v2-novidades-caixa">
            <div className="v2-cartao-cabeca">
              <h2>Últimas atualizações</h2>
              <a className="v2-link" href={linkDaPagina("novidades")} onClick={(e) => { e.preventDefault(); irParaPagina("novidades"); }}>ver todas</a>
            </div>
            {/* Atualização grande (destaque: true) aparece em cima, em destaque. */}
            {NOVIDADES.filter((n) => n.destaque).slice(0, 1).map((n) => (
              <a key={n.id} className="v2-novidade-destaque" href={linkDaPagina("novidades")} onClick={(e) => { e.preventDefault(); irParaPagina("novidades"); }}>
                <span className="v2-novidade-destaque-selo">Grande atualização</span>
                <b>{n.titulo}</b>
                <span className="v2-novidade-destaque-texto">{n.texto}</span>
                <span className="v2-novidade-destaque-data">{n.data.slice(8, 10)}/{n.data.slice(5, 7)} · ler mais →</span>
              </a>
            ))}
            <ul className="v2-novidades-lista">
              {NOVIDADES.filter((n) => !n.destaque).slice(0, 8).map((n) => (
                <li key={n.id}>
                  <span className={`v2-novidade-tipo ${n.tipo}`}>{ROTULO_TIPO[n.tipo] || n.tipo}</span>
                  <span className="v2-novidade-titulo">{n.titulo}</span>
                  <span className="v2-novidade-data">{n.data.slice(8, 10)}/{n.data.slice(5, 7)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <Praca usuario={usuario} />

        {(usuario.role === "ADMIN" || usuario.role === "MODERATOR") && (
          <a className="v2-cartao v2-atalho-admin" href={linkDaPagina("admin")} onClick={(e) => { e.preventDefault(); irParaPagina("admin"); }}>Painel admin <span>moderar glossário, perguntas, denúncias e jogadores</span></a>
        )}

        <section className="v2-cartao v2-sobre">
          <h2>Sobre o projeto</h2>
          <p>A Educação Gamer nasceu do carinho de um ex-jogador da antiga <b>Central de Jogos</b>, que queria reviver os momentos incríveis vividos na adolescência jogando com os amigos. Foi por causa dessa vontade de recuperar aquela época boa que essa plataforma começou a ser recriada — com bastante carinho, e ainda em construção. Obrigado por fazer parte dessa jornada!</p>
        </section>

        <div className="v2-beta">
          <span className="v2-selo-beta">beta</span>
          <span>O portal está em fase de testes — pode encontrar bugs ou lentidão de vez em quando. Encontrou algo estranho?</span>
          <button className="v2-botao v2-botao-amarelo" onClick={() => setFeedback(true)}>Enviar feedback</button>
        </div>

      </main>
      <Rodape />
      {feedback && <ModalFeedback aoFechar={() => setFeedback(false)} />}
    </div>
  );
}
