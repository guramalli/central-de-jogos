// Tela de espera das salas privadas: a partida só começa quando o dono
// aperta o botão, e só com pelo menos 2 pessoas. Assim ninguém volta do
// zap e encontra a sala já no meio de uma rodada.
export default function SalaEspera({ estado, souDono, onIniciar }) {
  const { jogadores = [], minimoParaComecar = 2, podeComecar } = estado || {};
  const faltam = Math.max(0, minimoParaComecar - jogadores.length);

  return (
    <div className="espera">
      <div className="espera-icone">⏳</div>
      <h2 className="espera-titulo">Esperando a galera</h2>
      <p className="espera-sub">
        {faltam > 0
          ? `Falta ${faltam} ${faltam === 1 ? "jogador" : "jogadores"} pra poder começar.`
          : "Já dá pra começar!"}
      </p>

      <div className="espera-jogadores">
        {jogadores.map((j) => (
          <div key={j.userId} className="espera-jogador">
            <span className="espera-jogador-bolinha" />
            {j.nickname}
          </div>
        ))}
        {/* Vagas ainda vazias, pra dar a sensação de que falta gente. */}
        {Array.from({ length: faltam }).map((_, i) => (
          <div key={`vazio-${i}`} className="espera-jogador espera-jogador-vazio">
            <span className="espera-jogador-bolinha" />
            aguardando...
          </div>
        ))}
      </div>

      {souDono ? (
        <>
          <button className="btn espera-btn" onClick={onIniciar} disabled={!podeComecar}>
            {podeComecar ? "▶️ Começar a partida" : `Aguardando mais ${faltam}...`}
          </button>
          <p className="espera-dica">
            Chame a galera! Basta mandar o nome da sala — ela aparece na lobby do Stop.
          </p>
        </>
      ) : (
        <p className="espera-dica">
          Quem criou a sala é que começa a partida. Segura aí. 😄
        </p>
      )}
    </div>
  );
}
