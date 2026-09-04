// Detecção de jogador inativo (idle) nas salas.
//
// O PROBLEMA:
// "Online" hoje significa "tem socket numa sala" — não "está jogando". Quem
// abre a sala e vai almoçar continua contando como online por horas. Isso
// distorce duas coisas que importam:
//
//   1. A lista de jogadores da sala. Alguém entra numa sala com "5 jogando",
//      encontra ninguém respondendo e vai embora achando que o site é morto.
//   2. O contador de online do site, que fica maior que a realidade.
//
// COMO FUNCIONA:
// Cada sala marca o instante da última AÇÃO REAL do jogador — responder,
// pedir STOP, votar, mandar mensagem no chat. Passado o limite sem nenhuma
// ação, ele é removido da sala.
//
// O QUE NÃO CONTA COMO ATIVIDADE:
// Ter a aba aberta, o socket estar conectado, o timer da rodada correndo. Se
// contasse, a detecção não serviria pra nada — é justamente esse o caso que
// queremos pegar.
//
// AVISO ANTES DE REMOVER:
// Ninguém é desconectado de surpresa. Faltando um tempo pro limite, o jogador
// recebe um aviso e qualquer ação cancela a remoção. Sair sem entender por
// quê é pior que ficar.

// Limite por jogo. A régua é o ciclo de cada um: no Stop uma rodada leva até
// 70s e a pessoa pode passar uma ou duas sem responder e ainda estar ali.
// No Quiz o ciclo é mais curto, mas quem só assiste também é comum.
export const LIMITES = {
  stop: 12 * 60 * 1000,       // 12 min — rodadas longas, pausa entre elas
  quiz: 10 * 60 * 1000,       // 10 min
  acromania: 10 * 60 * 1000,  // 10 min
};

// Quanto antes do limite o jogador é avisado.
export const AVISO_ANTES = 2 * 60 * 1000; // 2 min

// Marca atividade de um jogador. Chamado nas ações REAIS de cada sala.
export function marcarAtividade(player) {
  if (!player) return;
  player.ultimaAcao = Date.now();
  // Um novo movimento anula o aviso anterior: se a pessoa voltou, ela some
  // da lista de "prestes a sair" e recebe aviso de novo se sumir outra vez.
  player.avisadoIdle = false;
}

// Percorre os jogadores da sala e devolve quem avisar e quem remover.
//
// Não remove nada por conta própria: cada sala decide o que fazer, porque a
// forma de remover e de avisar muda entre elas.
export function verificarInativos(players, jogo) {
  const limite = LIMITES[jogo] ?? 10 * 60 * 1000;
  const agora = Date.now();
  const avisar = [];
  const remover = [];

  for (const [socketId, p] of players.entries()) {
    // Jogador que acabou de entrar e ainda não agiu conta a entrada como
    // atividade — senão seria removido antes de ter chance de jogar.
    const desde = agora - (p.ultimaAcao ?? p.joinedAt ?? agora);

    if (desde >= limite) {
      remover.push({ socketId, player: p });
    } else if (desde >= limite - AVISO_ANTES && !p.avisadoIdle) {
      p.avisadoIdle = true;
      avisar.push({ socketId, player: p });
    }
  }

  return { avisar, remover };
}

// Minutos restantes até a remoção, pra montar a mensagem de aviso.
export function minutosRestantes() {
  return Math.round(AVISO_ANTES / 60000);
}
