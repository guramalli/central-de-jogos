// Logotipo em texto do jogo Stop: "STOP!" em maiúsculas, vermelho vibrante,
// com contorno preto bem evidente (efeito "cartoon/quadrinho").
export default function StopWordmark({ width = 260 }) {
  const viewW = 400;
  const viewH = 150;
  const height = width * (viewH / viewW);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${viewW} ${viewH}`} xmlns="http://www.w3.org/2000/svg">
      <text
        x={viewW / 2}
        y="108"
        textAnchor="middle"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontSize="94"
        fontWeight="900"
        fontStyle="italic"
        letterSpacing="2"
        fill="#e2231a"
        stroke="#000000"
        strokeWidth="7"
        strokeLinejoin="round"
        paintOrder="stroke fill"
      >
        STOP!
      </text>
    </svg>
  );
}
