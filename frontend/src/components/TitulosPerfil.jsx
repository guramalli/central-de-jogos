import { useEffect, useState } from "react";
import { api } from "../api/client.js";

// Seção "Títulos" do perfil: conquistas de longo prazo desbloqueadas jogando.
// Quiz: acertos por tema (Conhecedor → Mestre → título épico do tema).
// Stop: STOPs pedidos por nível de sala, incluindo os relâmpagos da Avançada.
// Mostra os desbloqueados como medalhas e o próximo com barra de progresso.
export default function TitulosPerfil({ userId }) {
  const [titulos, setTitulos] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let vivo = true;
    api
      .get(`/users/${userId}/titulos`)
      .then(({ data }) => vivo && setTitulos(data))
      .catch(() => vivo && setTitulos({ quiz: [], stop: [] }));
    return () => {
      vivo = false;
    };
  }, [userId]);

  if (!titulos) return null;
  const temQuiz = titulos.quiz?.length > 0;
  const temStop = titulos.stop?.length > 0;
  if (!temQuiz && !temStop) return null; // nada a mostrar ainda: seção some

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3>🏅 Títulos</h3>

      {temQuiz && (
        <div className="titulos-bloco">
          <h4 className="titulos-subtitulo">Quiz — acertos por tema</h4>
          {titulos.quiz.map((t) => (
            <LinhaTitulo
              key={t.tema}
              rotulo={t.nomeTema}
              valor={t.acertos}
              unidade="acertos"
              desbloqueados={t.desbloqueados}
              proximo={t.proximo}
            />
          ))}
        </div>
      )}

      {temStop && (
        <div className="titulos-bloco">
          <h4 className="titulos-subtitulo">Stop — STOPs pedidos</h4>
          {titulos.stop.map((t) => (
            <LinhaTitulo
              key={t.grupo}
              rotulo={t.rotulo}
              valor={t.stops}
              unidade="STOPs"
              desbloqueados={t.desbloqueados}
              proximo={t.proximo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LinhaTitulo({ rotulo, valor, unidade, desbloqueados, proximo }) {
  const pct = proximo ? Math.min(100, Math.round((valor / proximo.min) * 100)) : 100;
  return (
    <div className="titulos-linha">
      <div className="titulos-linha-topo">
        <span className="titulos-tema">{rotulo}</span>
        <span className="titulos-contagem">
          {valor} {unidade}
        </span>
      </div>
      {desbloqueados.length > 0 && (
        <div className="titulos-medalhas">
          {desbloqueados.map((d) => (
            <span key={d.nome} className="titulo-medalha" title={`Desbloqueado com ${d.min} ${unidade}`}>
              🏅 {d.nome}
            </span>
          ))}
        </div>
      )}
      {proximo && (
        <div className="titulos-progresso" title={`${valor} de ${proximo.min} ${unidade}`}>
          <div className="titulos-progresso-barra">
            <div className="titulos-progresso-preenchido" style={{ width: `${pct}%` }} />
          </div>
          <span className="titulos-progresso-alvo">
            próximo: <strong>{proximo.nome}</strong> ({proximo.min})
          </span>
        </div>
      )}
    </div>
  );
}
