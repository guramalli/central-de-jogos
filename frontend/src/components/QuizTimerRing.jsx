// Timer circular que começa cheio e vai "esvaziando" conforme o tempo passa —
// muda de cor (verde -> laranja -> vermelho) quando está acabando.
export default function QuizTimerRing({ timeLeft, totalSeconds, size = 72 }) {
  const pct = totalSeconds > 0 ? Math.max(0, Math.min(1, timeLeft / totalSeconds)) : 0;
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const color = pct > 0.5 ? "#06d6a0" : pct > 0.2 ? "#ffb86f" : "#e60000";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#333"
        strokeWidth="6"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s ease" }}
      />
      <text
        x={size / 2}
        y={size / 2 + 6}
        textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="700"
        fontSize="18"
        fill={color}
      >
        {timeLeft}
      </text>
    </svg>
  );
}
