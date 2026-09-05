// DICAS DE USABILIDADE NO CHAT
//
// PARA QUE SERVE:
// O site tem bem mais função do que aparece: perfil com vitrine de emblemas,
// títulos vitalícios, clãs, missões, salas privadas, mensagem direta. Quase
// tudo fica a um clique de distância que ninguém dá. Estas dicas existem pra
// contar que a função existe, no lugar onde a pessoa já está olhando.
//
// POR QUE MEIA HORA:
// A ideia de "dica no chat" já tinha sido levantada e descartada por saturar.
// Numa sala ativa de Stop, meia hora são ~20 rodadas, cada uma com várias
// mensagens de sistema. Nesse ritmo a dica é um respiro, não um ruído.
//
// DUAS REGRAS QUE EVITAM ATRAPALHAR:
//   1. Só sai ENTRE rodadas. Durante votação ou resultado, a dica empurraria
//      o placar pra fora da área visível — justo quando a pessoa quer ler.
//   2. Só sai com gente na sala. Sala vazia não recebe dica nenhuma.
//
// O rodízio é por baralho embaralhado (mesmo esquema dos temas e das
// perguntas): nenhuma repete até todas terem saído.

const DICAS_GERAIS = [
  "💡 Clique no seu nick lá em cima pra ver seu perfil, seus títulos e sua vitrine de emblemas.",
  "💡 Passe o mouse no nick de alguém pra ver a patente e a posição no ranking.",
  "💡 Sua patente é MENSAL e zera todo dia 1º. Já os títulos são pra sempre.",
  "💡 No seu perfil dá pra escolher qual título aparece do lado do seu nick nas salas.",
  "💡 Os três primeiros do ranking de cada jogo levam prêmio em Pix no fim do mês.",
  "💡 As missões do dia ficam no topo do lobby de cada jogo.",
  "💡 Dá pra criar um clã ou entrar num: os pontos do mês de todo mundo somam pro time.",
  "💡 Na página de Amigos dá pra conversar por mensagem direta com quem você adicionou.",
  "💡 Cada jogo tem a própria escada de patentes — o botão fica no lobby.",
  "💡 No celular, use as abas Jogo / Chat / Jogadores pra alternar entre as três telas.",
];

// Uma por jogo, sobre a mecânica que a pessoa costuma descobrir tarde.
const DICAS_POR_JOGO = {
  stop: [
    "💡 No Stop dá pra criar sala privada e chamar só os seus amigos.",
    "💡 Pedir STOP rápido conta pros títulos de raio.",
  ],
  quiz: [
    "💡 No Quiz só o PRIMEIRO a acertar pontua — vale arriscar antes de ter certeza.",
    "💡 Achou uma pergunta errada ou fora do tema? Dá pra denunciar na própria pergunta.",
  ],
  acromania: [
    "💡 No Acromania votar na frase vencedora também dá pontos: preste atenção no que a sala curte.",
    "💡 Você pontua por cada voto que recebe, então dá pra ir bem sem vencer nenhuma rodada.",
  ],
};

const INTERVALO_MS = 30 * 60 * 1000; // meia hora
const CHECAGEM_MS = 60 * 1000; // olha de minuto em minuto se dá pra falar

// Fases em que a dica atrapalharia, com os nomes REAIS dos três jogos:
//   Stop:      active (escrevendo) · voting · grading
//   Quiz:      active (respondendo) · grading
//   Acromania: writing · voting · grading
// Sobram "intermission", "aguardando" e "waiting" — os respiros entre
// rodadas, que é onde a dica cabe.
const FASES_OCUPADAS = new Set(["active", "writing", "voting", "grading"]);

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Liga as dicas numa sala. Não mexe em nada dentro da sala: só lê o estado e
 * usa o systemMessage que ela já tem.
 */
export function ligarDicas(room, gameKey) {
  if (room._dicasTimer) return;

  let fila = [];
  let ultimaEm = Date.now(); // não fala assim que a sala nasce

  const proxima = () => {
    if (fila.length === 0) {
      fila = embaralhar([...DICAS_GERAIS, ...(DICAS_POR_JOGO[gameKey] || [])]);
    }
    return fila.shift();
  };

  room._dicasTimer = setInterval(() => {
    try {
      if (Date.now() - ultimaEm < INTERVALO_MS) return;
      if (!room.players || room.players.size === 0) return;
      if (FASES_OCUPADAS.has(room.state)) return; // espera a próxima checagem

      room.systemMessage(proxima());
      ultimaEm = Date.now();
    } catch (err) {
      console.error("Falha ao enviar dica no chat:", err.message);
    }
  }, CHECAGEM_MS);

  // Não segura o processo vivo só por causa das dicas.
  room._dicasTimer.unref?.();
}

export function desligarDicas(room) {
  if (!room._dicasTimer) return;
  clearInterval(room._dicasTimer);
  room._dicasTimer = null;
}
