import { EventEmitter } from "node:events";

// AVISO DE PONTUAÇÃO ENTRE SALAS
//
// O PROBLEMA:
// A pontuação mensal é do JOGO, não da sala — quem joga em duas salas de Stop
// ao mesmo tempo tem um único `monthlyScore`. Mas cada sala é um objeto
// separado na memória e só reconsulta o banco em três momentos: entrada,
// saída e fim de rodada. Subir de patente pontuando na sala A não muda nada
// na sala B até a rodada de lá terminar — e uma rodada de Stop com votação
// leva minutos. Na prática a pessoa vê a patente antiga ao lado do próprio
// nick e acha que o jogo errou.
//
// A SOLUÇÃO:
// Todas as salas rodam no MESMO processo do Node, então quem gravou pontos
// pode simplesmente avisar as outras. Sem banco, sem rede, sem timer.
//
// POR QUE UM MÓDULO SEPARADO:
// Se a sala importasse o gerenciador e o gerenciador importasse a sala,
// teríamos import circular. O emissor no meio quebra o ciclo: a sala só
// avisa, o gerenciador só escuta, e nenhum dos dois conhece o outro.
const emissor = new EventEmitter();

// Muitas salas podem escutar; o limite padrão do Node (10) geraria aviso de
// vazamento de memória sem haver vazamento nenhum.
emissor.setMaxListeners(50);

/**
 * Avisa que estes jogadores tiveram a pontuação mensal alterada.
 *
 * Chamar UMA vez por rodada, com todos os jogadores de uma vez — e não uma
 * vez por jogador. Numa sala de 10, avisar individualmente dispararia 10
 * atualizações em cada sala vizinha, cada uma com sua ida ao banco.
 *
 * @param {string} gameKey   "stop" | "quiz" | "acromania"
 * @param {string[]} userIds jogadores que pontuaram
 * @param {string} salaOrigem roomId de quem pontuou (não precisa se avisar)
 */
export function avisarPontuacao(gameKey, userIds, salaOrigem) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (ids.length === 0) return;
  emissor.emit("pontuou", { gameKey, userIds: ids, salaOrigem });
}

export function aoPontuar(callback) {
  emissor.on("pontuou", callback);
}
