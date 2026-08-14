import { useEffect, useState } from "react";
import { api } from "../api/client.js";

// Gráfico de cadastros por dia. É desenhado em SVG puro (sem biblioteca):
// são poucos dados e uma barra por dia, então trazer uma dependência de
// gráficos só pra isso pesaria o site sem necessidade.
export default function AdminCadastrosPorDia() {
  const [dados, setDados] = useState(null);
  const [dias, setDias] = useState(30);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    api
      .get(`/admin/cadastros-por-dia?dias=${dias}`)
      .then(({ data }) => ativo && setDados(data))
      .catch((e) => ativo && setErro(e.response?.data?.error || "Erro ao carregar."));
    return () => {
      ativo = false;
    };
  }, [dias]);

  if (erro) return <div className="card" style={{ marginTop: 16 }}>{erro}</div>;
  if (!dados) return <div className="card" style={{ marginTop: 16 }}>Carregando cadastros...</div>;

  const { serie, total, mediaPorDia, melhorDia } = dados;
  const maximo = Math.max(1, ...serie.map((d) => d.total));

  // Dimensões do desenho. A largura da barra se ajusta ao período escolhido
  // pra o gráfico caber igual em 7 dias ou em 90.
  const alturaGrafico = 180;
  const largura = 100; // em %, o SVG é responsivo via viewBox
  const passo = largura / serie.length;

  function rotulo(dataIso) {
    const [, m, d] = dataIso.split("-");
    return `${d}/${m}`;
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="cadastros-cabecalho">
        <h2 style={{ margin: 0 }}>Cadastros por dia</h2>
        <div className="cadastros-periodos">
          {[7, 30, 90, 365].map((n) => (
            <button
              key={n}
              type="button"
              className={`cadastros-periodo${dias === n ? " ativo" : ""}`}
              onClick={() => setDias(n)}
            >
              {n === 365 ? "1 ano" : `${n}d`}
            </button>
          ))}
        </div>
      </div>

      <div className="cadastros-resumo">
        <div><strong>{total}</strong><span>no período</span></div>
        <div><strong>{mediaPorDia}</strong><span>por dia (média)</span></div>
        {melhorDia && melhorDia.total > 0 && (
          <div><strong>{melhorDia.total}</strong><span>melhor dia ({rotulo(melhorDia.data)})</span></div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${largura} ${alturaGrafico}`}
        preserveAspectRatio="none"
        className="cadastros-grafico"
        role="img"
        aria-label={`Cadastros por dia nos últimos ${dias} dias`}
      >
        {serie.map((d, i) => {
          const altura = (d.total / maximo) * (alturaGrafico - 20);
          return (
            <rect
              key={d.data}
              x={i * passo + passo * 0.15}
              y={alturaGrafico - altura}
              width={passo * 0.7}
              height={altura}
              rx={passo * 0.2}
              fill={d.total === maximo && d.total > 0 ? "#ffb15c" : "#7c6bd8"}
            >
              <title>{`${rotulo(d.data)}: ${d.total} cadastro(s)`}</title>
            </rect>
          );
        })}
      </svg>

      <div className="cadastros-eixo">
        <span>{serie.length ? rotulo(serie[0].data) : ""}</span>
        <span>{serie.length ? rotulo(serie[serie.length - 1].data) : "hoje"}</span>
      </div>

      <p className="cadastros-nota">
        Passe o mouse numa barra pra ver o dia. Visitantes não entram na conta — só contas
        cadastradas.
      </p>
    </div>
  );
}
