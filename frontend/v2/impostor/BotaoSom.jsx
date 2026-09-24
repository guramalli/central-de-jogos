import { useEffect, useState } from "react";
import { alternarMudo, estaMudo, ouvirPreferencias } from "./sons.js";

const IconeSom = ({ mudo }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5 6 9H3v6h3l5 4V5z" />
    {mudo ? <path d="m16 9 5 6M21 9l-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
  </svg>
);

// Liga/desliga o som, com o estado escrito no botão (só o ícone passava
// despercebido). A preferência é a mesma do resto da v2 (eg_v2_mudo) e
// fica guardada no aparelho.
export default function BotaoSom() {
  const [mudo, setMudo] = useState(estaMudo());
  // Outro botão de som da v2 mudou a preferência: acompanha.
  useEffect(() => ouvirPreferencias(() => setMudo(estaMudo())), []);
  const acao = mudo ? "Ligar o som" : "Desligar o som";
  return (
    <button
      type="button"
      className={`imp-barra-botao imp-botao-som ${mudo ? "mudo" : ""}`}
      onClick={() => setMudo(alternarMudo())}
      aria-label={`${mudo ? "Som desligado" : "Som ligado"}. ${acao}`}
      title={acao}
    >
      <IconeSom mudo={mudo} />
      <span>{mudo ? "Som desligado" : "Som ligado"}</span>
    </button>
  );
}
