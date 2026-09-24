import { BonecoDoJogador } from "./AvatarBoneco.jsx";

// Figura de um jogador no pódio de fim de bloco/partida das salas (Stop,
// Acromania, turno das arenas do Quiz): o avatar de corpo inteiro dando um
// pulinho, com o emblema de sempre (`children`, a patente) como selo no
// canto. Bot (sem perfil) fica só com o emblema.
//
// No modo várias-salas (.v2-sala.compacto) o boneco some pelo CSS e volta
// o pódio compacto de antes — não cabe um corpo inteiro num quadradinho.
export function FiguraPodio({ userId, posicao, children }) {
  return (
    <span className={`v2-podio-figura p${posicao}`}>
      <BonecoDoJogador userId={userId} altura={posicao === 1 ? 112 : 88} className="v2-podio-boneco-sala" semFundo />
      {children}
    </span>
  );
}
