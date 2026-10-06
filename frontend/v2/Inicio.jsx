import { useEffect, useState } from "react";
import { api } from "./api.js";
import { irPara, irParaAcro, irParaPagina, irParaStop, linkDaPagina } from "./App.jsx";
import Topo from "./Topo.jsx";
import Rodape from "./Rodape.jsx";
import Praca from "./Praca.jsx";
import { CardPartidaRapida } from "./FilaNoCard.jsx";
import { NOMES_FILA } from "./fila.js";
import { ModalFeedback } from "./Modais.jsx";
import { NOVIDADES, ROTULO_TIPO } from "../src/data/novidades.js";
import LendaDestaque from "./LendaDestaque.jsx";
import { NOMES_JOGOS as NOMES, ROTA_SALAS, armazenamento, linkDaSala, ultimoJogo } from "./navegacao.js";

// Jogos com página própria (não usam a lobby de salas do Stop/Quiz/Acromania).
const PAGINA_PROPRIA = { mentira: "mentira", tribunal: "tribunal", impostor: "impostor" };
const JOGOS = [
  { chave: "stop", logo: "/stop-logo.png", cor: "#FF8A7F", sombra: "#C7493F", texto: "Aqui não adianta saber todos os temas: tem que ser rápido. 6 temas, 1 letra sorteada, e quem hesita perde a rodada." },
  { chave: "quiz", logo: "/quiz-logo.png", cor: "#FFD60A", sombra: "#B88A00", texto: "Milhares de perguntas por tema — Futebol, Anime, Games, Terceirão e muito mais. Quem acerta primeiro leva os pontos!" },
  { chave: "acromania", logo: "/acromania-logo.png", cor: "#C3A6FF", sombra: "#8465D1", texto: "Um tema, algumas letras, e você cria a frase mais criativa. A galera vota na melhor.", beta: true },
  { chave: "tribunal", logo: "/tribunal-logo.png", cor: "#7CC8FF", sombra: "#3F84C4", texto: "Alguém é acusado de um crime absurdo. Promotor acusa, advogado defende, e o júri decide: culpado ou inocente?", beta: true },
  // O Impostor — em testes (sem ranking ainda).
  { chave: "impostor", logo: "/impostor-logo.png", cor: "#FF4D5E", sombra: "#A3202E", texto: "Todo mundo sabe a palavra, menos um. Dê dicas, desconfie de todo mundo e vote em quem está blefando.", beta: true },
];

export default function Inicio({ usuario }) {
  const [online, setOnline] = useState(null);
  const [acroAtivo, setAcroAtivo] = useState(true);
  const [feedback, setFeedback] = useState(false);

  useEffect(() => {
    let vivo = true;
    api.get("/acromania-rooms").then(({ data }) => vivo && setAcroAtivo(Array.isArray(data) ? true : data.ativo !== false)).catch(() => {});
    const contar = () => api.get("/platform-stats/online").then(({ data }) => vivo && setOnline(data)).catch(() => {});
    contar();
    const t = setInterval(() => { if (!document.hidden) contar(); }, 20000);
    return () => { vivo = false; clearInterval(t); };
  }, []);

  const jogar = (e, jogo) => { e.preventDefault(); if (PAGINA_PROPRIA[jogo]) irParaPagina(PAGINA_PROPRIA[jogo]); else irParaPagina("jogar", { jogo }); };

  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} />
      <main className="v2-pagina v2-inicio">
        <Continuar />

        {/* Duas fileiras: SALAS (Stop, Quiz) e FILA DE ESPERA (os jogos com
            fila — a pessoa deixa o nome no rodapé do card). */}
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

        <section className="v2-jogos-rapida" aria-label="Jogos com fila de espera">
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

        {/* Carro-chefe: o RPG Lenda do Campinho, logo depois dos jogos do portal */}
        <LendaDestaque />

        <Praca usuario={usuario} />

        <div className="v2-inicio-duas">
          {/* Fim da premiação em Pix (30/09/2026): setembro foi o último mês pago.
              O cartão ficou no mesmo lugar, agora como aviso. */}
          <section className="v2-cartao v2-premiacao">
            <span className="v2-premiacao-selo">Aviso</span>
            <p><b>Setembro é o último mês com premiação em Pix.</b> A partir de outubro, o Stop e o Quiz não pagam mais prêmio em dinheiro.</p>
            <p className="v2-cartao-nota">Os rankings mensais continuam: patentes, títulos, a coroa e o troféu de campeão do mês. Tudo zera no dia 1º.</p>
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

// CONTINUAR — volta pra última sala aberta. Confere uma vez se a sala ainda
// existe; se sumiu, leva pra página do jogo. Sem rede, tenta a sala mesmo
// assim (a própria sala avisa se der errado). Sem memória, não aparece.
// As funções de App.jsx só são lidas no clique: Inicio e App importam um ao
// outro, e no carregamento do módulo elas ainda não existem.
function Continuar() {
  const [ultimo] = useState(() => ultimoJogo(armazenamento()));
  const [existe, setExiste] = useState(null); // null = ainda conferindo

  useEffect(() => {
    if (!ultimo) return;
    let vivo = true;
    api.get(ROTA_SALAS[ultimo.jogo])
      .then(({ data }) => {
        const lista = Array.isArray(data) ? data : data?.rooms || [];
        if (vivo) setExiste(lista.some((s) => String(s.roomId) === ultimo.sala));
      })
      .catch(() => vivo && setExiste(true));
    return () => { vivo = false; };
  }, [ultimo]);

  if (!ultimo) return null;
  const jogo = JOGOS.find((j) => j.chave === ultimo.jogo);
  const sumiu = existe === false;
  const href = sumiu ? linkDaPagina("jogar", { jogo: ultimo.jogo }) : linkDaSala(ultimo.jogo, ultimo.sala);
  const ir = (e) => { e.preventDefault(); if (sumiu) irParaPagina("jogar", { jogo: ultimo.jogo }); else ({ quiz: irPara, stop: irParaStop, acromania: irParaAcro })[ultimo.jogo](ultimo.sala); };
  return (
    <a className="v2-continuar" href={href} onClick={ir} style={{ "--cor": jogo?.cor, "--sombra": jogo?.sombra }}>
      {jogo?.logo && <img src={jogo.logo} alt="" />}
      <span className="v2-continuar-texto">
        <small>Continuar de onde parou</small>
        <b>{sumiu ? `${NOMES[ultimo.jogo]}: escolher outra sala` : ultimo.nome ? `${NOMES[ultimo.jogo]} · ${ultimo.nome}` : NOMES[ultimo.jogo]}</b>
      </span>
      <span className="v2-botao v2-botao-amarelo v2-continuar-botao">{sumiu ? "Ver salas" : "Continuar"}</span>
    </a>
  );
}
