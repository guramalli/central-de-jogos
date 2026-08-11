// Faixa com a patente e a pontuação da pessoa — só aparece no celular.
//
// No desktop, essas informações ficam na lista lateral de jogadores, sempre
// à vista. No celular a lista virou uma aba, então a pessoa só veria seu
// progresso se lembrasse de tocar em "jogadores" — e ninguém faz isso no
// meio de uma partida.
//
// Como patente e ranking são justamente o que faz alguém voltar ao site,
// esconder isso do público majoritário custa caro. Aqui fica fixo no topo,
// compacto, sem competir com o jogo.
export default function FaixaPatente({ me, semPontuacao }) {
  if (!me) return null;

  // Sala sem pontuação não tem patente pra mostrar — o placar ali é só da
  // partida, e fingir progresso confundiria.
  if (semPontuacao) {
    return (
      <div className="faixa-patente faixa-patente-simples">
        <span className="faixa-patente-nick">{me.nickname}</span>
        <span className="faixa-patente-pts">
          {me.blockPoints ?? 0} <small>pts na partida</small>
        </span>
      </div>
    );
  }

  return (
    <div className="faixa-patente">
      {me.rank?.icon && (
        <img src={me.rank.icon} alt={me.rank.name} className="faixa-patente-icone" />
      )}
      <div className="faixa-patente-info">
        <span className="faixa-patente-nome">{me.rank?.name || "Sem patente"}</span>
        <span className="faixa-patente-nick">{me.nickname}</span>
      </div>
      <div className="faixa-patente-numeros">
        <span className="faixa-patente-pts">{(me.monthlyPoints ?? 0).toLocaleString("pt-BR")}</span>
        <small>pts no mês</small>
      </div>
    </div>
  );
}
