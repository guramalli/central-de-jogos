import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

// Missões do dia de UM jogo, para aparecer na lobby dele.
//
// Por que aqui e não só na página de missões: as metas diárias são curtas
// (dez rodadas, acertar em três temas, pedir um STOP) e ficavam numa página
// separada, que o jogador novo não tem motivo pra visitar. Ele jogava sem
// nunca saber que estava a três rodadas de fechar alguma coisa.
//
// A lobby do jogo é onde ele passa antes de entrar na sala — e mostrar só as
// missões DAQUELE jogo evita o ruído de listar objetivo de Stop pra quem
// veio jogar Quiz.
//
// Fica na coluna da direita do cabeçalho, embaixo do "Ver patentes": é o
// canto que o olho já procura pra saber "como eu vou nesse jogo".
//
// Usa o /missoes/lista, que já existe e já é chamado pelo avisinho do menu.
// Nenhum endpoint novo.
export default function MissoesDoJogo({ gameKey }) {
  const [missoes, setMissoes] = useState(null);

  useEffect(() => {
    let vivo = true;
    api
      .get("/missoes/lista")
      .then(({ data }) => vivo && setMissoes(data))
      .catch(() => {}); // silencioso: sem missões a lobby segue normal
    return () => {
      vivo = false;
    };
  }, []);

  if (missoes?.ativas === false) return null;

  // Diárias e semanais deste jogo, sem as já resgatadas (não rendem mais
  // nada). Ordem: primeiro as concluídas esperando resgate, que são ponto na
  // mão; depois as mais perto de fechar.
  const lista = [...(missoes?.diarias || []), ...(missoes?.semanais || [])]
    .filter((m) => m.jogo === gameKey && !m.resgatada)
    .sort((a, b) => {
      if (a.concluida !== b.concluida) return a.concluida ? -1 : 1;
      return b.progresso / b.meta - a.progresso / a.meta;
    })
    // Duas, não três: a coluna do cabeçalho é estreita e uma terceira
    // esticaria o bloco pra baixo, desalinhando do texto de apresentação.
    .slice(0, 2);

  if (lista.length === 0) return null;

  const prontas = lista.filter((m) => m.concluida).length;

  return (
    <div className="missoes-lobby">
      <div className="missoes-lobby-topo">
        <h2 className="missoes-lobby-titulo">
          <span className="material-symbols-outlined">task_alt</span>
          Missões do dia
        </h2>
        <Link to="/missoes" className="missoes-lobby-link">
          {prontas > 0 ? `${prontas} pra resgatar →` : "Ver todas →"}
        </Link>
      </div>

      <div className="missoes-lobby-lista">
        {lista.map((m) => {
          // Concluída (ou resgatada) = barra cheia, independente da razão
          // progresso/meta. Se a meta for endurecida depois, quem já fechou
          // não passa a ver a barra retroceder.
          const pct = m.concluida || m.resgatada
            ? 100
            : Math.min(100, Math.round((m.progresso / m.meta) * 100));
          return (
            <div key={m.key} className="missao-lobby">
              <div className="missao-lobby-linha">
                <span className="missao-lobby-nome">{m.nome}</span>
                {m.concluida ? (
                  /* Fechada e não resgatada: o aviso vale mais que a barra
                     cheia — é ponto esperando ser buscado. */
                  <span className="missao-lobby-pronta">resgatar +{m.pontos}</span>
                ) : (
                  <span className="missao-lobby-contador">
                    {Math.min(m.progresso, m.meta)}/{m.meta}
                  </span>
                )}
              </div>
              <p className="missao-lobby-desc">{m.descricao}</p>
              <div className="missao-lobby-barra">
                <div
                  className={`missao-lobby-cheia ${m.concluida ? "missao-lobby-cheia-pronta" : ""}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
