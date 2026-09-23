import { useEffect, useState } from "react";

// A carta secreta: vira ao tocar. Tripulante vê a palavra; impostor vê o aviso.
// O flip aqui é simples (Fase 2); a animação caprichada entra na Fase 3.
export default function Carta({ carta, abertaInicial = false }) {
  const [aberta, setAberta] = useState(abertaInicial);
  // Espaço esconde a carta rapidinho (no computador).
  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.code === "Space" && e.target === document.body) { e.preventDefault(); setAberta(false); }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  if (!carta) return <div className="imp-carta vazia">Carta a caminho…</div>;
  const impostor = carta.papel === "impostor";
  return (
    <div className="imp-carta-area">
      <button
        className={`imp-carta ${aberta ? "aberta" : ""} ${impostor ? "impostor" : "tripulante"}`}
        onClick={() => setAberta((a) => !a)}
        aria-pressed={aberta}
        aria-label={aberta ? "Esconder carta" : "Revelar carta"}
      >
        <span className="imp-carta-dentro">
          <span className="imp-carta-face frente">
            <span className="imp-carta-interrogacao">?</span>
            <span>Toque para revelar</span>
          </span>
          <span className="imp-carta-face verso">
            <span className="imp-carta-rotulo">{impostor ? "VOCÊ É O" : "A PALAVRA É"}</span>
            <span className="imp-carta-palavra">{impostor ? "IMPOSTOR" : carta.palavra}</span>
            <span className="imp-carta-tema">TEMA · {String(carta.tema).toUpperCase()}</span>
            <span className="imp-carta-dica">
              {impostor ? "Você não sabe a palavra. Ouça as dicas e disfarce." : "Dê dicas sem entregar a palavra ao impostor."}
            </span>
          </span>
        </span>
      </button>
      <p className="imp-nota">Cubra a tela. Só você pode ver.</p>
    </div>
  );
}
