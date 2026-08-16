import { useEffect, useState } from "react";
import { api } from "../api/client.js";

// Seção "Títulos" do perfil: conquistas de longo prazo desbloqueadas jogando.
// Quiz: acertos por tema (Conhecedor → Mestre → título épico do tema).
// Stop: STOPs pedidos por nível de sala, incluindo os relâmpagos da Avançada.
// Mostra os desbloqueados como medalhas e o próximo com barra de progresso.
export default function TitulosPerfil({ userId, podeEscolher = false }) {
  const [titulos, setTitulos] = useState(null);
  // Título que a pessoa escolheu ostentar (aparece no hover do nick em
  // qualquer sala). Só carrega/edita no PRÓPRIO perfil.
  const [tituloExibido, setTituloExibido] = useState(null);

  useEffect(() => {
    if (!podeEscolher) return;
    api.get("/users/me").then(({ data }) => setTituloExibido(data.tituloExibido || null)).catch(() => {});
  }, [podeEscolher]);

  async function escolher(nome) {
    const novo = tituloExibido === nome ? null : nome; // clicar de novo desmarca
    try {
      await api.patch("/users/me/titulo-exibido", { titulo: novo });
      setTituloExibido(novo);
    } catch (e) {
      alert(e.response?.data?.error || "Erro ao salvar o título.");
    }
  }

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
              tituloExibido={tituloExibido}
              onEscolher={podeEscolher ? escolher : null}
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
              tituloExibido={tituloExibido}
              onEscolher={podeEscolher ? escolher : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LinhaTitulo({ rotulo, valor, unidade, desbloqueados, proximo, tituloExibido, onEscolher }) {
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
          {desbloqueados.map((d) =>
            onEscolher ? (
              <button
                key={d.nome}
                type="button"
                className={`titulo-medalha titulo-medalha-btn${tituloExibido === d.nome ? " titulo-medalha-ativa" : ""}`}
                title={
                  tituloExibido === d.nome
                    ? "Este é o título exibido no seu nick — clique pra deixar de exibir"
                    : "Clique pra exibir este título junto do seu nick"
                }
                onClick={() => onEscolher(d.nome)}
              >
                🏅 {d.nome}
                {tituloExibido === d.nome && <span className="titulo-medalha-check"> ✓ exibindo</span>}
              </button>
            ) : (
              <span key={d.nome} className="titulo-medalha" title={`Desbloqueado com ${d.min} ${unidade}`}>
                🏅 {d.nome}
              </span>
            )
          )}
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
