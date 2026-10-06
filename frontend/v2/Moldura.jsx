import Topo from "./Topo.jsx";
import Rodape from "./Rodape.jsx";

// Moldura comum das páginas da v2: topo + <main> + rodapé. Com `embutido`
// (página mostrada dentro de outra, como as abas de Competir e Social), só o
// conteúdo — quem embute já desenhou o topo e o rodapé. A classe do <main>
// continua no invólucro do conteúdo (o layout do mensageiro depende dela).
export default function Moldura({ usuario, embutido = false, classeMain = "v2-pagina", children }) {
  if (embutido) return <div className={`v2-embutido ${classeMain}`}>{children}</div>;
  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} />
      <main className={classeMain}>{children}</main>
      <Rodape />
    </div>
  );
}
