// BOTS DE TESTE DO ACROMANIA
//
// PARA QUE SERVE:
// O Acromania precisa de gente simultânea pra funcionar, e é justamente
// isso que não tem hoje. Sem parceiro não dá pra sentir o ritmo do ciclo,
// ver a tela de votação com várias frases nem testar o resultado. Estes
// bots existem pra isso: povoar a sala e deixar o jogo jogável sozinho,
// pra ajustar tempo e mecânica com o jogo rodando de verdade.
//
// NÃO são jogadores de verdade e não têm ambição de ser: as frases saem de
// um banco de palavras por letra, então são bobas de propósito. O objetivo
// é exercitar o CICLO (escrever -> votar -> resultado), não competir.
//
// COMO LIGAR (mesmo padrão do ACROMANIA_ATIVO, sem deploy):
//   dashboard.render.com -> serviço do backend -> Environment
//   ACROMANIA_BOTS = 2      (0 ou variável ausente = desligado)
//
// SEGURANÇA DE RANKING:
// As contas são criadas com isGuest=true E ocultoNoRanking=true. O ranking
// já filtra os dois (ver routes/ranking.js) e a soma dos clãs ignora guest,
// então bot não aparece em premiação nem distorce disputa nenhuma. Os dois
// campos são redundantes de propósito: se um dia um filtro mudar, o outro
// ainda segura.

import { prisma } from "../db.js";

// Quantos bots ligar. Sem a variável, zero — bot nunca entra por acidente.
export function quantidadeDeBots() {
  const n = parseInt(process.env.ACROMANIA_BOTS ?? "0", 10);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, 4); // teto baixo: passar disso não ensina mais nada
}

const BOTS = [
  { nickname: "Robozinho", email: "bot1@bots.educacaogamer.local" },
  { nickname: "Tagarela", email: "bot2@bots.educacaogamer.local" },
  { nickname: "Palpiteiro", email: "bot3@bots.educacaogamer.local" },
  { nickname: "Rabisco", email: "bot4@bots.educacaogamer.local" },
];

// Banco de palavras por letra inicial. As frases do Acromania precisam ter
// cada palavra começando pela letra sorteada, então o bot monta a frase
// escolhendo uma palavra de cada balde. Palavras curtas e comuns, que é o
// que uma pessoa apressada escreveria de verdade.
const PALAVRAS = {
  A: ["abacaxi", "amigo", "azul", "alto", "agora", "aranha", "antigo"],
  B: ["bolo", "bonito", "banana", "barulho", "boa", "bravo", "bicicleta"],
  C: ["cachorro", "cadeira", "comida", "curto", "correndo", "café", "coragem"],
  D: ["doce", "dedo", "dormindo", "difícil", "domingo", "dança", "dourado"],
  E: ["elefante", "escola", "estranho", "energia", "escuro", "esquina"],
  F: ["feliz", "festa", "forte", "fome", "futebol", "frio", "flor"],
  G: ["gato", "grande", "gostoso", "guitarra", "gelado", "garrafa"],
  H: ["hoje", "história", "homem", "horrível", "hotel", "hábito"],
  I: ["igreja", "ideia", "incrível", "ilha", "irmão", "inteiro"],
  J: ["janela", "jacaré", "jogo", "jantar", "junto", "jornal"],
  K: ["kilo", "kart", "ketchup", "karaokê"],
  L: ["laranja", "livro", "longe", "leve", "lindo", "lanche"],
  M: ["macaco", "manhã", "molhado", "música", "melhor", "moleza"],
  N: ["navio", "noite", "nada", "novo", "nuvem", "namorado"],
  O: ["ovo", "óculos", "ontem", "ótimo", "onda", "olhando"],
  P: ["pato", "pizza", "pequeno", "pesado", "praia", "porta", "pulando"],
  Q: ["queijo", "quente", "quadro", "quase", "quintal"],
  R: ["rato", "rápido", "risada", "roupa", "roxo", "rodando"],
  S: ["sapo", "sorvete", "silêncio", "sozinho", "surpresa", "sábado"],
  T: ["tomate", "tarde", "trem", "tranquilo", "teimoso", "tapete"],
  U: ["urso", "último", "uva", "unido", "útil"],
  V: ["vaca", "vermelho", "vento", "veloz", "viagem", "vazio"],
  W: ["wifi", "walkie", "western"],
  X: ["xícara", "xadrez", "xarope", "xingando"],
  Y: ["yoga", "yakisoba", "yeti"],
  Z: ["zebra", "zero", "zangado", "zumbi"],
};

function palavraPara(letra) {
  const balde = PALAVRAS[String(letra).toUpperCase()];
  if (!balde || balde.length === 0) return String(letra).toLowerCase();
  return balde[Math.floor(Math.random() * balde.length)];
}

// Monta a frase respeitando a regra do jogo: uma palavra por letra, na ordem.
function montarFrase(letras) {
  const palavras = (letras || []).map(palavraPara);
  if (palavras.length === 0) return "frase vazia";
  palavras[0] = palavras[0].charAt(0).toUpperCase() + palavras[0].slice(1);
  return palavras.join(" ");
}

// Cria (ou reaproveita) as contas dos bots. Idempotente: pode rodar toda
// vez que a sala nasce, que não duplica nada.
async function garantirContas(quantos) {
  const contas = [];
  for (const def of BOTS.slice(0, quantos)) {
    const conta = await prisma.user.upsert({
      where: { email: def.email },
      update: { isGuest: true, ocultoNoRanking: true, banned: false },
      create: {
        nickname: def.nickname,
        email: def.email,
        isGuest: true,
        ocultoNoRanking: true,
      },
    });
    contas.push(conta);
  }
  return contas;
}

// Socket de mentira. A sala espera um objeto de socket (chama .id, .join,
// .emit e .leave), então em vez de mexer na AcromaniaRoom pra ela aceitar
// jogador sem socket, o bot entrega um objeto com essa forma que não faz
// nada. Assim TODO o caminho do jogo continua idêntico ao de uma pessoa —
// que é o ponto: testar o código real, não um atalho.
function socketFalso(id) {
  return {
    id,
    ehBot: true,
    join() {},
    leave() {},
    emit() {},
    to() {
      return { emit() {} };
    },
  };
}

// Espera aleatória: se os bots respondessem no mesmo instante, o teste do
// ritmo ficaria irreal. Aqui eles demoram entre 3 e 25 segundos pra escrever.
function atraso(min, max) {
  return min + Math.random() * (max - min);
}

// Liga os bots numa sala. Fica observando o estado da sala num timer próprio
// e agindo nas transições — sem nenhum gancho dentro da AcromaniaRoom, o que
// mantém o arquivo do jogo intocado.
export async function ligarBotsNaSala(room) {
  const quantos = quantidadeDeBots();
  if (quantos === 0) return;
  if (room._botsLigados) return;
  room._botsLigados = true;

  let contas;
  try {
    contas = await garantirContas(quantos);
  } catch (err) {
    console.error("Acromania: falha ao criar contas de bot:", err.message);
    room._botsLigados = false;
    return;
  }

  const bots = contas.map((conta, i) => ({
    userId: conta.id,
    nickname: conta.nickname,
    socket: socketFalso(`bot-${i}-${room.roomId}`),
    rodadaEscrita: -1,
    rodadaVotada: -1,
  }));

  for (const bot of bots) {
    try {
      await room.addPlayer(bot.socket, bot.userId, bot.nickname);
    } catch (err) {
      console.error(`Acromania: bot ${bot.nickname} não entrou:`, err.message);
    }
  }

  // Um único timer pra todos os bots da sala. Roda de segundo em segundo,
  // que é a mesma cadência dos timers do jogo.
  let ciclosSemGente = 0;
  room._botsTimer = setInterval(() => {
    try {
      // Bot não fica jogando sozinho: sem nenhuma pessoa de verdade na sala,
      // os bots sairiam rodando rodada eterna, gastando Render e Neon à toa.
      // Depois de 30s sem gente, eles se desligam e a sala esvazia normal.
      const temGente = [...room.players.values()].some((p) => !p.socket?.ehBot);
      if (!temGente) {
        ciclosSemGente += 1;
        if (ciclosSemGente >= 30) {
          desligarBotsNaSala(room, bots);
          return;
        }
        return; // sem gente: não escreve nem vota, só conta o tempo
      }
      ciclosSemGente = 0;

      for (const bot of bots) {
        // ESCREVER: uma vez por rodada, depois de um atraso humano.
        if (room.state === "writing" && bot.rodadaEscrita !== room.roundNumber) {
          if (bot._escreveEm == null) {
            bot._escreveEm = Date.now() + atraso(3000, 25000) ;
          }
          // Nunca deixa passar do fim do tempo: se faltam 3s, manda agora.
          const acabando = room.timeLeft <= 3;
          if (Date.now() >= bot._escreveEm || acabando) {
            bot.rodadaEscrita = room.roundNumber;
            bot._escreveEm = null;
            room.submitPhrase(bot.socket, bot.userId, montarFrase(room.currentLetters));
          }
        }

        if (room.state !== "writing") bot._escreveEm = null;

        // VOTAR: escolhe qualquer frase que não seja a própria.
        if (room.state === "voting" && bot.rodadaVotada !== room.roundNumber) {
          const opcoes = (room.voteEntries || []).filter((e) => e.userId !== bot.userId);
          if (opcoes.length > 0) {
            // Espera alguns segundos pra votação não terminar instantaneamente.
            if (bot._votaEm == null) bot._votaEm = Date.now() + atraso(2000, 8000);
            if (Date.now() >= bot._votaEm || room.timeLeft <= 2) {
              bot.rodadaVotada = room.roundNumber;
              bot._votaEm = null;
              const escolha = opcoes[Math.floor(Math.random() * opcoes.length)];
              room.vote(bot.socket, bot.userId, escolha.entryId);
            }
          }
        }

        if (room.state !== "voting") bot._votaEm = null;
      }
    } catch (err) {
      console.error("Acromania: erro no timer dos bots:", err.message);
    }
  }, 1000);

  console.log(`Acromania: ${bots.length} bot(s) ligados na sala ${room.roomId}`);
}

// Tira os bots da sala e desliga o timer. A sala volta a ficar vazia de
// verdade, e o `ligarBotsNaSala` pode ser chamado de novo quando alguém
// entrar — ele é idempotente por causa do `_botsLigados`.
function desligarBotsNaSala(room, bots) {
  clearInterval(room._botsTimer);
  room._botsTimer = null;
  for (const bot of bots) {
    try {
      room.removePlayer(bot.socket.id);
    } catch (err) {
      console.error(`Acromania: falha ao remover bot ${bot.nickname}:`, err.message);
    }
  }
  room._botsLigados = false;
  console.log(`Acromania: bots desligados na sala ${room.roomId} (sala sem gente)`);
}
