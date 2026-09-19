import { useState } from "react";
import { iniciais, corDoJogador } from "./temas.js";

// Nas salas, ao lado do nick vai a PATENTE daquele jogo (não a foto).
// Quem não tem patente (sala sem pontuação, conta sem pontos no mês) ou
// cuja imagem falhar aparece com as iniciais.
export default function IconePatente({ rank, nickname, userId }) {
  const [falhou, setFalhou] = useState(false);
  if (rank?.icon && !falhou) {
    return (
      <img
        className={`v2-patente-jogador ${rank.brilha ? "brilha" : ""}`}
        src={rank.icon}
        alt={rank.name || ""}
        title={rank.name || undefined}
        onError={() => setFalhou(true)}
      />
    );
  }
  return (
    <span className="v2-patente-jogador v2-patente-sem" style={{ background: corDoJogador(userId) }} title={rank?.name || undefined}>
      {iniciais(nickname)}
    </span>
  );
}
