import RoundResultCard from "./RoundResultCard.jsx";

// Mostra até as 10 últimas rodadas já corrigidas, mais recente primeiro,
// cada uma em um card com fundo alternado para facilitar a leitura visual.
export default function RoundHistory({ history, currentUserId }) {
  if (history.length === 0) return null;

  return (
    <div className="card round-history-container">
      <h3 style={{ marginTop: 0 }}>Histórico de rodadas ({history.length}/10)</h3>
      <div className="round-history-scroll">
        {history.map((round, i) => (
          <RoundResultCard
            key={round.roundNumber}
            roundNumber={round.roundNumber}
            letter={round.letter}
            themes={round.themes}
            players={round.players}
            currentUserId={currentUserId}
            variant={i % 2 === 0 ? "normal" : "alt"}
          />
        ))}
      </div>
    </div>
  );
}
