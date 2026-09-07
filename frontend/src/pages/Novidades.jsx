import { Link } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import { NOVIDADES } from "../data/novidades.js";

const ROTULO_TIPO = {
  novo: "Novidade",
  melhoria: "Melhoria",
  correcao: "Correção",
  aviso: "Aviso",
};

function formatarData(iso) {
  // Constrói a data em horário local: `new Date("2026-09-07")` é lido como
  // UTC e, no fuso do Brasil, voltaria um dia — a entrada apareceria com a
  // data errada.
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function Novidades() {
  return (
    <div>
      <Seo
        title="Novidades"
        description="O que mudou no Educação Gamer: funções novas, melhorias e correções."
      />

      <Link to="/" className="btn secondary ranks-voltar">
        ← Voltar pro início
      </Link>

      <h1>Novidades</h1>
      <p style={{ color: "var(--text-dim)" }}>
        O que mudou no site, do mais recente pro mais antigo.
      </p>

      {NOVIDADES.length === 0 && (
        <div className="card">
          <p style={{ color: "var(--text-dim)", margin: 0 }}>Nada por aqui ainda.</p>
        </div>
      )}

      <ol className="novidades-lista">
        {NOVIDADES.map((n) => (
          <li key={n.id} className="card novidade-item">
            <div className="novidade-topo">
              <span className={`novidade-tipo novidade-tipo-${n.tipo}`}>
                {ROTULO_TIPO[n.tipo] || n.tipo}
              </span>
              <span className="novidade-data">{formatarData(n.data)}</span>
            </div>
            <h2 className="novidade-titulo">{n.titulo}</h2>
            <p className="novidade-texto">{n.texto}</p>
          </li>
        ))}
      </ol>

      <Link to="/" className="btn secondary ranks-voltar">
        ← Voltar pro início
      </Link>
    </div>
  );
}
