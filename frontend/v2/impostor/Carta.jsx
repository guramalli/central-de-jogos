import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CURVA } from "./comum.jsx";
import { tocar } from "./sons.js";

// A carta secreta: vira em 3D ao tocar (700ms, curva da spec). Tripulante:
// carta clara com o segredo do modo (palavra, situação, tema da história).
// Impostor: carta vermelha com o aviso. Pergunta: carta clara com a
// pergunta e SEM papel — o impostor desse modo nem sabe que é o impostor.
// Com "reduzir movimento" ligado, troca de face com um fade simples.
//
// `controlada` + `aberta`/`aoVirar`: quem usa pode comandar a carta de fora
// (o botão "Revelar carta" do celular).
export default function Carta({ carta, modo = "palavra", aberta: abertaFora, aoVirar }) {
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
  const face = conteudoDaCarta(carta, modo);

  const frente = (
    <span className="imp-carta-face frente">
      <span className="imp-carta-interrogacao">?</span>
      <span className="imp-carta-chamada">Toque para revelar</span>
    </span>
  );
  const verso = (
    <span className="imp-carta-face verso">
      <span className="imp-carta-rotulo">{face.rotulo}</span>
      <span className="imp-carta-meio">
        {face.tema && <span className="imp-carta-tema">{face.tema}</span>}
        <span className={`imp-carta-palavra ${face.frase ? "frase" : ""}`} style={{ "--tam": face.tamanho }}>{face.texto}</span>
      </span>
      <span className="imp-carta-dica">{face.dica}</span>
    </span>
  );

  return (
    <button
      className={`imp-carta ${face.impostor ? "impostor" : "tripulante"}`}
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

// O que vai no verso, por modo. Só usa o que o servidor mandou na carta.
function conteudoDaCarta(carta, modo) {
  const impostor = carta.papel === "impostor";
  if (modo === "pergunta") {
    // Normal: sem `papel` — ninguém sabe se é o impostor, então a carta é a
    // mesma pra todos. Se o servidor um dia mandar o papel, a carta avisa.
    const texto = String(carta.pergunta || "");
    return {
      impostor,
      rotulo: impostor ? "VOCÊ É O IMPOSTOR · SUA PERGUNTA" : "SUA PERGUNTA",
      texto,
      frase: true,
      tamanho: tamanhoDaFrase(texto),
      dica: impostor
        ? "Os outros receberam uma pergunta parecida. Responda de um jeito que sirva pras duas."
        : "Responda a pergunta. Todos respondem ao mesmo tempo e as respostas aparecem juntas.",
    };
  }
  if (modo === "situacao" || modo === "historia") {
    const situacao = modo === "situacao";
    if (impostor) {
      return {
        impostor,
        rotulo: "VOCÊ É O",
        tema: situacao ? "SITUAÇÃO · ???" : "HISTÓRIA · ???",
        texto: "IMPOSTOR",
        tamanho: tamanhoDaPalavra("IMPOSTOR", true),
        dica: situacao
          ? "Você não sabe onde vocês estão. Ouça as dicas e dê uma que sirva pra quase qualquer lugar."
          : "Você não sabe o tema. Leia as frases dos outros e continue a história como se soubesse.",
      };
    }
    const texto = String((situacao ? carta.situacao : carta.historia) || "");
    return {
      impostor,
      rotulo: situacao ? "VOCÊS ESTÃO" : "A HISTÓRIA É SOBRE",
      texto: situacao ? texto.toUpperCase() : texto,
      frase: true,
      tamanho: tamanhoDaFrase(texto),
      dica: situacao
        ? "Dê dicas de até 3 palavras que provem que você sabe onde estão, sem entregar."
        : "Na sua vez, escreva uma frase que continue a história sem entregar o tema.",
    };
  }
  const texto = impostor ? "IMPOSTOR" : String(carta.palavra).toUpperCase();
  return {
    impostor,
    rotulo: impostor ? "VOCÊ É O" : "A PALAVRA É",
    tema: `TEMA · ${String(carta.tema).toUpperCase()}`,
    texto,
    tamanho: tamanhoDaPalavra(texto, impostor),
    dica: impostor ? "Você não sabe a palavra. Ouça as dicas e finja que sabe." : "Dê uma dica que prove que você sabe, sem entregar a palavra.",
  };
}

// Frases (situação, tema da história, pergunta): várias linhas. Quanto mais
// longa, menor a letra — "Na praia lotada" fica grande; uma pergunta de 50
// letras ocupa 4-5 linhas.
function tamanhoDaFrase(texto) {
  const n = texto.length;
  const fator = n <= 16 ? 0.14 : n <= 28 ? 0.12 : n <= 44 ? 0.1 : 0.088;
  return `calc(var(--imp-carta-larg) * ${fator})`;
}

// Anton é condensada (~0,48em por letra). A maior palavra precisa caber na
// largura da carta; "PAO DE QUEIJO" quebra em linhas e vale a mais longa.
function tamanhoDaPalavra(texto, impostor) {
  const maior = Math.max(...texto.split(/\s+/).map((p) => p.length));
  const base = impostor ? 66 : 88;
  return `min(${base}px, calc(var(--imp-carta-larg) * 0.82 / ${Math.max(1, maior) * 0.48}))`;
}
