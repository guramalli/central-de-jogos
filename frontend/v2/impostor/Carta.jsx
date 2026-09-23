import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CURVA } from "./comum.jsx";
import { tocar } from "./sons.js";

// A carta secreta: vira em 3D ao tocar (700ms, curva da spec). Tripulante:
// carta clara com a palavra. Impostor: carta vermelha com o aviso.
// Com "reduzir movimento" ligado, troca de face com um fade simples.
//
// `controlada` + `aberta`/`aoVirar`: quem usa pode comandar a carta de fora
// (o botão "Revelar carta" do celular).
export default function Carta({ carta, aberta: abertaFora, aoVirar }) {
  const [abertaDentro, setAbertaDentro] = useState(false);
  const controlada = abertaFora !== undefined;
  const aberta = controlada ? abertaFora : abertaDentro;
  const reduzir = useReducedMotion();

  function virar(valor = !aberta) {
    tocar("cartaVirando");
    if (controlada) aoVirar?.(valor);
    else setAbertaDentro(valor);
  }

  // Espaço esconde a carta rapidinho (no computador).
  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.code === "Space" && e.target === document.body && aberta) { e.preventDefault(); virar(false); }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  });

  if (!carta) return <div className="imp-carta vazia">Carta a caminho…</div>;
  const impostor = carta.papel === "impostor";
  const texto = impostor ? "IMPOSTOR" : String(carta.palavra).toUpperCase();

  const frente = (
    <span className="imp-carta-face frente">
      <span className="imp-carta-interrogacao">?</span>
      <span className="imp-carta-chamada">Toque para revelar</span>
    </span>
  );
  const verso = (
    <span className="imp-carta-face verso">
      <span className="imp-carta-rotulo">{impostor ? "VOCÊ É O" : "A PALAVRA É"}</span>
      <span className="imp-carta-meio">
        <span className="imp-carta-tema">TEMA · {String(carta.tema).toUpperCase()}</span>
        <span className="imp-carta-palavra" style={{ "--tam": tamanhoDaPalavra(texto, impostor) }}>{texto}</span>
      </span>
      <span className="imp-carta-dica">
        {impostor ? "Você não sabe a palavra. Ouça as dicas e finja que sabe." : "Dê uma dica que prove que você sabe, sem entregar a palavra."}
      </span>
    </span>
  );

  return (
    <button
      className={`imp-carta ${impostor ? "impostor" : "tripulante"}`}
      onClick={() => virar()}
      aria-pressed={aberta}
      aria-label={aberta ? "Esconder carta" : "Revelar carta"}
    >
      {reduzir ? (
        <span className="imp-carta-dentro plano">
          <motion.span className="imp-carta-camada" animate={{ opacity: aberta ? 0 : 1 }} transition={{ duration: 0.2 }}>{frente}</motion.span>
          <motion.span className="imp-carta-camada" animate={{ opacity: aberta ? 1 : 0 }} transition={{ duration: 0.2 }}>{verso}</motion.span>
        </span>
      ) : (
        <motion.span
          className="imp-carta-dentro"
          initial={false}
          animate={{ rotateY: aberta ? 180 : 0 }}
          transition={{ duration: 0.7, ease: CURVA }}
        >
          {frente}
          {verso}
        </motion.span>
      )}
    </button>
  );
}

// Anton é condensada (~0,48em por letra). A maior palavra precisa caber na
// largura da carta; "PAO DE QUEIJO" quebra em linhas e vale a mais longa.
function tamanhoDaPalavra(texto, impostor) {
  const maior = Math.max(...texto.split(/\s+/).map((p) => p.length));
  const base = impostor ? 66 : 88;
  return `min(${base}px, calc(var(--imp-carta-larg) * 0.82 / ${Math.max(1, maior) * 0.48}))`;
}
