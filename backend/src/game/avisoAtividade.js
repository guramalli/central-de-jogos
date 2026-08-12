// Avisos de atividade entre salas.
//
// O problema que isto resolve: com poucos jogadores, quem entra numa sala
// vazia espera um pouco e vai embora. Se alguém chega dois minutos depois,
// os dois nunca se encontram — cada um passou pela sala num momento
// diferente e ambos acharam o site morto.
//
// Aqui, quando alguém entra numa sala, quem está sozinho em OUTRA sala
// recebe um aviso no chat. Assim a pessoa sabe onde tem movimento e pode
// ir pra lá, em vez de desistir.

// Espaçamento mínimo entre avisos da mesma sala. Sem isso, alguém entrando
// e saindo repetidamente encheria o chat de todo mundo.
const INTERVALO_MS = 90 * 1000;
const ultimoAviso = new Map(); // roomId -> timestamp

// Quantas pessoas a sala de destino precisa ter pra valer o aviso. Avisar
// que "alguém entrou" numa sala que ficou com 1 pessoa é o mesmo que
// convidar pra outra sala vazia.
const MINIMO_PARA_AVISAR = 1;

export function criarAvisoDeAtividade(io, { roomId, roomLabel, jogo, nickname, totalNaSala }) {
  if (!io || !roomId || totalNaSala < MINIMO_PARA_AVISAR) return;

  const agora = Date.now();
  const anterior = ultimoAviso.get(roomId) || 0;
  if (agora - anterior < INTERVALO_MS) return;
  ultimoAviso.set(roomId, agora);

  const icone = { stop: "✏️", quiz: "🧠", acromania: "💬" }[jogo] || "🎮";
  const pessoas = totalNaSala === 1 ? "1 jogador" : `${totalNaSala} jogadores`;

  io.emit("aviso-atividade", {
    roomId,
    jogo,
    mensagem: `${icone} ${nickname} entrou em ${roomLabel} — ${pessoas} lá agora.`,
    at: agora,
  });
}

// Limpa o histórico de salas que não recebem ninguém há um bom tempo, pra
// o mapa não crescer indefinidamente com o servidor rodando por semanas.
setInterval(() => {
  const limite = Date.now() - 60 * 60 * 1000;
  for (const [roomId, quando] of ultimoAviso.entries()) {
    if (quando < limite) ultimoAviso.delete(roomId);
  }
}, 30 * 60 * 1000);
