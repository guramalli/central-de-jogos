import Topo from "./Topo.jsx";
import Rodape from "./Rodape.jsx";
import { NOVIDADES, ROTULO_TIPO } from "../src/data/novidades.js";

function data(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

// Mesma lista do clássico (src/data/novidades.js) — uma fonte só.
export default function Novidades({ usuario }) {
  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo={null} />
      <main className="v2-pagina">
        <div className="v2-pagina-cabeca"><h1>Novidades</h1></div>
        <p className="v2-pagina-nota">O que mudou no site, da mais recente pra mais antiga.</p>
        {NOVIDADES.length === 0 && <div className="v2-vazio-grande">Nada por aqui ainda.</div>}
        <ol className="v2-novidades">
          {NOVIDADES.map((n, i) => (
            <li key={n.id} className="v2-cartao v2-novidade" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
              <div className="v2-novidade-topo">
                <span className={`v2-novidade-tipo ${n.tipo}`}>{ROTULO_TIPO[n.tipo] || n.tipo}</span>
                <span className="v2-novidade-data">{data(n.data)}</span>
              </div>
              <h2>{n.titulo}</h2>
              <p>{n.texto}</p>
            </li>
          ))}
        </ol>
      </main>
      <Rodape />
    </div>
  );
}
