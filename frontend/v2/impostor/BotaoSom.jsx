import { useState } from "react";
import { alternarMudo, estaMudo } from "./sons.js";

// Liga/desliga o som. A preferência é a mesma do resto da v2 e fica
// guardada no aparelho.
export default function BotaoSom() {
  const [mudo, setMudo] = useState(estaMudo());
  return (
    <button
      className="imp-botao-som"
      onClick={() => setMudo(alternarMudo())}
      aria-pressed={mudo}
      aria-label={mudo ? "Ligar som" : "Desligar som"}
      title={mudo ? "Ligar som" : "Desligar som"}
    >
      {mudo ? "🔇" : "🔊"}
    </button>
  );
}
