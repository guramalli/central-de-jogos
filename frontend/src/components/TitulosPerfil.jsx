import { useEffect, useState } from "react";
import { api } from "../api/client.js";

// Ícone do título: usa a logo (bronze/prata/ouro). Se o PNG não existir
// ainda, cai na medalha 🏅. Tamanho generoso pra valorizar a arte.
function IconeTitulo({ logo, tamanho = 72, apagado = false }) {
  const [erro, setErro] = useState(false);
  const estilo = {
    objectFit: "contain",
    filter: apagado ? "grayscale(1)" : "none",
    opacity: apagado ? 0.35 : 1,
  };
  if (!logo || erro) return <span style={{ fontSize: tamanho * 0.7, opacity: apagado ? 0.35 : 1 }}>🏅</span>;
  // loading="lazy": a vitrine mostra os TRÊS níveis de TODOS os temas de uma
  // vez (até 59 medalhas). Sem isto o navegador pede todas de uma vez ao
  // abrir o perfil; com isto, só as que estão à vista.
  return (
    <img
      src={logo}
      alt=""
      width={tamanho}
      height={tamanho}
      style={estilo}
      loading="lazy"
      decoding="async"
      onError={() => setErro(true)}
    />
  );
}

// Seção "Títulos" do perfil: conquistas de longo prazo desbloqueadas jogando.
// Mostra os TRÊS estágios de cada tema desde o início — os desbloqueados em
// cor, os que faltam esmaecidos — pra que a pessoa já veja o que a espera.
export default function TitulosPerfil({ userId, podeEscolher = false }) {
  const [titulos, setTitulos] = useState(null);
  const [tituloExibido, setTituloExibido] = useState(null);
  const [medalhaNoLugarDaFoto, setMedalhaNoLugarDaFoto] = useState(false);

  useEffect(() => {
    if (!podeEscolher) return;
    api
      .get("/users/me")
      .then(({ data }) => {
        setTituloExibido(data.tituloExibido || null);
        setMedalhaNoLugarDaFoto(data.medalhaNoLugarDaFoto === true);
      })
      .catch(() => {});
  }, [podeEscolher]);

  async function escolher(nome) {
    const novo = tituloExibido === nome ? null : nome; // clicar de novo desmarca
    try {
      await api.patch("/users/me/titulo-exibido", { titulo: novo });
      setTituloExibido(novo);
      // Sem título escolhido não há medalha pra ostentar. O servidor já
      // desliga a preferência nesse caso; isto só mantém a tela em sincronia.
      if (!novo) setMedalhaNoLugarDaFoto(false);
    } catch (e) {
      alert(e.response?.data?.error || "Erro ao salvar o título.");
    }
  }

  async function alternarMedalha() {
    const novo = !medalhaNoLugarDaFoto;
    // Otimista: o interruptor responde na hora e volta atrás se o servidor
    // recusar — mexer nisso não pode dar sensação de travamento.
    setMedalhaNoLugarDaFoto(novo);
    try {
      await api.patch("/users/me/medalha-no-lugar-da-foto", { ligado: novo });
    } catch (e) {
      setMedalhaNoLugarDaFoto(!novo);
      alert(e.response?.data?.error || "Erro ao salvar a preferência.");
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
  if (!temQuiz && !temStop) return null;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3>🏅 Títulos</h3>

      {/* Só aparece pra quem já escolheu um título — antes disso não há
          medalha pra pôr no lugar da foto, e um interruptor desativado só
          geraria dúvida. */}
      {podeEscolher && tituloExibido && (
        <label className="medalha-troca">
          <input
            type="checkbox"
            checked={medalhaNoLugarDaFoto}
            onChange={alternarMedalha}
          />
          <span>
            Usar a medalha no lugar da minha foto
            <small>
              Quando alguém passar o mouse no seu nick, vê a medalha de{" "}
              <strong>{tituloExibido}</strong> em vez da foto. Sua foto continua no perfil.
            </small>
          </span>
        </label>
      )}

      {temQuiz && (
        <div className="titulos-bloco">
          <h4 className="titulos-subtitulo">Quiz — acertos por tema</h4>
          {titulos.quiz.map((t) => (
            <LinhaTitulo
              key={t.tema}
              rotulo={t.nomeTema}
              valor={t.acertos}
              unidade="acertos"
              niveis={t.titulos}
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
              niveis={t.titulos}
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

function LinhaTitulo({ rotulo, valor, unidade, niveis, proximo, tituloExibido, onEscolher }) {
  const pct = proximo ? Math.min(100, Math.round((valor / proximo.min) * 100)) : 100;
  return (
    <div className="titulos-linha">
      <div className="titulos-linha-topo">
        <span className="titulos-tema">{rotulo}</span>
        <span className="titulos-contagem">
          {valor} {unidade}
        </span>
      </div>

      {/* Os três estágios, sempre visíveis. Desbloqueados em cor (e
          clicáveis no próprio perfil); os que faltam ficam esmaecidos com
          o requisito à mostra, pra criar a meta. */}
      <div className="titulos-vitrine">
        {niveis.map((n) => {
          const ativo = tituloExibido === n.nome;
          const clicavel = n.desbloqueado && onEscolher;
          const conteudo = (
            <>
              <IconeTitulo logo={n.logo} apagado={!n.desbloqueado} />
              <span className="titulos-vitrine-nome">{n.nome}</span>
              {n.desbloqueado ? (
                ativo ? (
                  <span className="titulos-vitrine-tag titulos-vitrine-tag-ativa">✓ exibindo</span>
                ) : (
                  clicavel && <span className="titulos-vitrine-tag">exibir</span>
                )
              ) : (
                <span className="titulos-vitrine-req">
                  {n.min} {unidade}
                </span>
              )}
            </>
          );
          if (clicavel) {
            return (
              <button
                key={n.nome}
                type="button"
                className={`titulos-vitrine-item titulos-vitrine-item-btn${ativo ? " titulos-vitrine-item-ativa" : ""}`}
                onClick={() => onEscolher(n.nome)}
                title={ativo ? "Clique pra deixar de exibir no seu nick" : "Clique pra exibir este título no seu nick"}
              >
                {conteudo}
              </button>
            );
          }
          return (
            <div
              key={n.nome}
              className={`titulos-vitrine-item${n.desbloqueado ? "" : " titulos-vitrine-item-bloqueada"}`}
            >
              {conteudo}
            </div>
          );
        })}
      </div>

      {proximo && (
        <div className="titulos-progresso" title={`${valor} de ${proximo.min} ${unidade}`}>
          <div className="titulos-progresso-barra">
            <div className="titulos-progresso-preenchido" style={{ width: `${pct}%` }} />
          </div>
          <span className="titulos-progresso-alvo">
            faltam <strong>{proximo.min - valor}</strong> {unidade} para {proximo.nome}
          </span>
        </div>
      )}
    </div>
  );
}
