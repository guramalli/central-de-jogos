import IconePatente from "./IconePatente.jsx";

// Lista de quem está na sala, pra aba "Jogadores" do celular (Quiz, Stop e
// Acromania). No celular ela substitui a fileira de fichinhas do topo.
export default function ListaJogadores({ jogadores, meuId, pontos }) {
  return (
    <div className="v2-lista-celular">
      {jogadores.map((j, i) => (
        <div key={j.userId} className={`v2-jogador ${j.userId === meuId ? "eu" : ""}`}>
          <span className="v2-jogador-pos">{i + 1}</span>
          <IconePatente rank={j.rank} nickname={j.nickname} userId={j.userId} />
          <div className="v2-jogador-info">
            <span className="v2-jogador-nome">{j.nickname}{j.ehBot && <em className="v2-tag-bot">bot</em>}</span>
            {j.rank?.name && <span className="v2-jogador-patente">{j.rank.name}</span>}
          </div>
          <span className="v2-jogador-pts">{Number(pontos(j) || 0).toLocaleString("pt-BR")}</span>
        </div>
      ))}
      {jogadores.length === 0 && <div className="v2-vazio">Entrando na sala…</div>}
    </div>
  );
}
