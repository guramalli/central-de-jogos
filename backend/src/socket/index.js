import { registrarMentira } from "../mentira/socketMentira.js";
import { registrarTribunal } from "../tribunal/socketTribunal.js";
import { registrarImpostor } from "../impostor/socketImpostor.js";
import { registrarFila } from "../fila/socketFila.js";
import { podeFalar } from "../utils/antiFlood.js";
import { chamarBotsNoStop, dispensarBotsDoStop } from "../game/stopBots.js";
import { verifyToken } from "../utils/jwt.js";
import { acromaniaAtivo } from "../utils/acromaniaAtivo.js";
import { cacheInvalidar } from "../utils/cache.js";
import { getOrCreateStopRoom, limparSalaPrivadaSeVazia, jogadoresLiberados, cancelarDescarteSala, salaStopValida } from "../game/gameManager.js";
import { registrarDiaJogado } from "../game/missoes.js";
import { getOrCreateQuizRoom, salaQuizValida } from "../game/quizGameManager.js";
import { getOrCreateAcromaniaRoom, salaAcromaniaValida } from "../game/acromaniaGameManager.js";
import { ligarBotsNaSala, dispensarBotsDaSala } from "../game/acromaniaBots.js";
import { conferirSenhaAcromania as liberadoNaAcromania, agendarDescarteAcromania } from "../game/acromaniaGameManager.js";
import * as generalChat from "../game/generalChat.js";
import * as presence from "../game/presence.js";
import { recheckPeak } from "../game/platformStats.js";
import { prisma } from "../db.js";
import { ipEstaBanido, ipDoSocket } from "../ipBan.js";

// ===== Amortecedor de consultas por conexão =====
// Com a presença global, o socket reconecta a cada navegação entre
// páginas. Sem amortecedor, CADA reconexão faria 2 leituras + 1 escrita
// no banco (conferir usuário/banimento, streak do dia, plataforma) — e o
// Neon cobra por tempo de banco acordado. Este Map em memória lembra o
// que já foi conferido/gravado há pouco e pula as idas repetidas.
// Fica fora do setupSocket pra encerrarSessoesDoUsuario conseguir limpar.
const conexoesRecentes = new Map(); // userId -> { authOkAte, plataformaEm, diaJogadoEm, visitaEm }

// Chamado pelas rotas admin quando alguém é banido (ou tem o papel trocado).
// - Apaga o "já conferido" da pessoa: a próxima conexão vai ao banco de novo
//   (sem isso, um banido reconectava por até 1 minuto).
// - Banido: avisa e derruba todas as abas na hora. A próxima tentativa de
//   conexão recebe SESSAO_INVALIDA, que o frontend já trata deslogando.
// - Papel trocado: não derruba ninguém do jogo; só esquece o "é equipe"
//   guardado no socket (usado pelo anti-flood do chat).
export function encerrarSessoesDoUsuario(io, userId, { banido = false } = {}) {
  const recente = conexoesRecentes.get(userId);
  if (recente) recente.authOkAte = 0;
  if (!io) return;
  const sala = `user:${userId}`;
  if (banido) {
    io.to(sala).emit("sessao-encerrada", { motivo: "banido" });
    io.in(sala).disconnectSockets(true);
  } else {
    for (const s of io.of("/").sockets.values()) {
      if (s.user?.id === userId) s.ehEquipe = undefined;
    }
  }
}

// Embrulho pros handlers async de socket: uma falha (banco instável, sala
// que sumiu no meio do caminho) só vai pro log, com o nome do evento, em vez
// de virar unhandledRejection anônima no console.
const seguro = (evento, fn) => async (...args) => {
  try {
    await fn(...args);
  } catch (err) {
    console.error(`Socket "${evento}" falhou:`, err);
  }
};

export function setupSocket(io) {
  const AUTH_CACHE_MS = 60 * 1000; // reconferir usuário/banimento a cada 1 min no máximo
  const VISITA_CADA_MS = 30 * 60 * 1000; // 30 min: janela de uma sessão
  const PLATAFORMA_CADA_MS = 30 * 60 * 1000; // regravar plataforma a cada 30 min no máximo
  const DIA_JOGADO_CADA_MS = 6 * 60 * 60 * 1000; // streak: conferir no máximo a cada 6h (a função já é diária)

  // Limpeza horária pra o Map não crescer pra sempre.
  setInterval(() => {
    const agora = Date.now();
    for (const [id, info] of conexoesRecentes.entries()) {
      if ((info.plataformaEm || 0) < agora - 24 * 60 * 60 * 1000 && (info.authOkAte || 0) < agora) {
        conexoesRecentes.delete(id);
      }
    }
  }, 60 * 60 * 1000).unref?.();

  io.use(async (socket, next) => {
    try {
      if (ipEstaBanido(ipDoSocket(socket))) {
        console.log(`[bloqueado por IP banido, socket] de ${ipDoSocket(socket)} (x-forwarded-for bruto: ${socket.handshake.headers?.["x-forwarded-for"] || "-"})`);
        return next(new Error("SESSAO_INVALIDA"));
      }

      const token = socket.handshake.auth?.token;
      const payload = verifyToken(token);

      const agora = Date.now();
      const recente = conexoesRecentes.get(payload.id) || {};

      // Confere se o usuário do token ainda existe de verdade no banco —
      // evita "fantasmas" (tokens antigos de antes de um reset de banco, por
      // exemplo) entrarem na sala e derrubarem o servidor ao tentar salvar
      // pontuação para um userId que não existe mais. Também bloqueia quem
      // foi banido depois de já ter feito login (o token continuaria válido).
      // Só o resultado POSITIVO fica em cache (1 min): reconexões de
      // navegação não repetem a consulta, e um banimento passa a valer em
      // novas conexões em no máximo 1 minuto.
      if (!(recente.authOkAte > agora)) {
        // `tituloExibido` entra de carona nesta consulta que já acontecia:
        // é usado na mensagem de entrada na sala e, vindo junto do cache de
        // autenticação, não custa NENHUMA query nova. O preço é que trocar
        // de título leva até AUTH_CACHE_MS pra refletir na mensagem — a
        // mesma janela que um banimento já tem.
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          select: { id: true, banned: true, tituloExibido: true },
        });
        if (!user || user.banned) {
          return next(new Error("SESSAO_INVALIDA"));
        }
        recente.tituloExibido = user.tituloExibido || null;
        recente.authOkAte = agora + AUTH_CACHE_MS;
      }

      // Registra em qual plataforma a pessoa está jogando. Não bloqueia a
      // conexão: se falhar, o jogo segue normalmente — é só métrica.
      // Sequência de dias: conta uma vez por dia, na primeira conexão.
      if (!(recente.diaJogadoEm > agora - DIA_JOGADO_CADA_MS)) {
        recente.diaJogadoEm = agora;
        registrarDiaJogado(payload.id).catch(() => {});
      }

      // CONTADOR DE VISITAS.
      //
      // Conta SESSÃO, não conexão. Sem a janela de 30 minutos, recarregar a
      // aba ou entrar em duas salas contaria como duas visitas — e o número
      // que a tela mostra viraria mentira em uma tarde de jogo.
      if (!(recente.visitaEm > agora - VISITA_CADA_MS)) {
        recente.visitaEm = agora;
        prisma.user
          .update({ where: { id: payload.id }, data: { visitas: { increment: 1 } } })
          .catch(() => {});
        // Log leve de conexão, na mesma cadência da visita (no máx. uma vez
        // a cada 30min por pessoa — sem isso, alguém reconectando toda hora
        // ao navegar pelo site enche o log de linha repetida). Zip 607: é o
        // jeito de achar o IP de uma conta que JÁ existe e está online
        // agora, sem precisar esperar ela se cadastrar de novo.
        // Cabeçalho bruto junto, não só o IP já calculado — se um dia o IP
        // banido não bater com o que a gente esperava, dá pra ver aqui se
        // o problema é a extração (ex.: um proxy a mais no caminho) em vez
        // de ficar só supondo.
        console.log(`[conectou] ${payload.nickname} de ${ipDoSocket(socket)} (x-forwarded-for bruto: ${socket.handshake.headers?.["x-forwarded-for"] || "-"})`);
      }

      const plataforma = socket.handshake.auth?.plataforma;
      if ((plataforma === "mobile" || plataforma === "desktop") && !(recente.plataformaEm > agora - PLATAFORMA_CADA_MS)) {
        recente.plataformaEm = agora;
        prisma.user
          .update({
            where: { id: payload.id },
            data: { ultimaPlataforma: plataforma, ultimoAcesso: new Date() },
          })
          .catch(() => {});
      }

      conexoesRecentes.set(payload.id, recente);

      socket.user = payload;
      // Fica no socket pra as salas lerem sem consultar o banco na entrada.
      socket.tituloExibido = recente.tituloExibido || null;
      next();
    } catch {
      next(new Error("Autenticação inválida."));
    }
  });

  io.on("connection", async (socket) => {
    const { id: userId, nickname } = socket.user;
    // Mentira Sincera (em teste — ver src/mentira/).
    registrarMentira(io, socket);
    registrarTribunal(io, socket); // O Tribunal (em teste, sem link no site)
    registrarImpostor(io, socket); // O Impostor (em construção, sem link no site)
    registrarFila(io, socket); // Fila de espera "Jogar agora" (Impostor, Tribunal, Acromania)

    // Toda conexão autenticada conta como "no site" — independente da
    // página. É daqui que o painel admin tira quem está online.
    presence.addConnection(socket, userId, nickname);

    // ANTI-FLOOD dos chats (utils/antiFlood.js): limite por CONTA. Admin e
    // moderador ficam fora — o papel só é consultado no banco quando alguém
    // esbarra no limite (conversa normal não gera consulta nenhuma).
    async function liberadoNoChat(texto) {
      const r = podeFalar(userId, texto);
      if (r.ok) return true;
      if (socket.ehEquipe === undefined) {
        try {
          const q = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
          socket.ehEquipe = q?.role === "ADMIN" || q?.role === "MODERATOR";
        } catch { socket.ehEquipe = false; }
      }
      if (socket.ehEquipe) return true;
      socket.emit("chat-limite", { mensagem: r.mensagem, esperaMs: r.esperaMs, silenciado: r.silenciado });
      return false;
    }

    // SALA PESSOAL — um canal direto pra cada usuário.
    //
    // As DMs já existiam, mas só funcionam com os dois com a janela de
    // conversa aberta. O convite precisa alcançar o amigo ONDE ELE ESTIVER:
    // jogando outra sala, no lobby, lendo o ranking.
    //
    // Como toda conexão entra aqui, `io.to("user:<id>")` chega em todas as
    // abas da pessoa de uma vez.
    socket.join(`user:${userId}`);

    socket.on("join-stop-room", seguro("join-stop-room", async ({ roomId } = {}) => {
      // Só sala oficial ou que já existe (ver salaStopValida).
      if (!salaStopValida(roomId)) {
        socket.emit("stop-sala-bloqueada", { error: "Essa sala não existe mais. Escolha outra na lista de salas." });
        return;
      }
      // Sala privada com senha só aceita quem passou pela conferência na
      // tela de entrada. Sem isso, bastaria ter o link pra furar a senha.
      if (String(roomId || "").startsWith("stop-privada-") && !jogadoresLiberados.has(`${userId}:${roomId}`)) {
        socket.emit("stop-sala-bloqueada", {
          error: "Entre pela lista de salas — essa sala pede senha.",
        });
        return;
      }
      const room = await getOrCreateStopRoom(io, roomId);
      const joined = await room.addPlayer(socket, userId, nickname);
      if (joined) {
        // Entrou: se a sala estava marcada pra ser descartada por estar
        // vazia, cancela o descarte.
        if (room.privada) cancelarDescarteSala(roomId);
        socket.currentRoom = room;
        recheckPeak().catch(() => {});
      }
    }));

    // `dados?.`: um cliente adulterado pode mandar null aqui, e desestruturar
    // null estoura. O formato das respostas é conferido em submitAnswers.
    socket.on("submit-answers", (dados) => {
      socket.currentRoom?.submitAnswers(socket, userId, dados?.answers, dados?.behavior);
    });

    socket.on("stop", () => {
      socket.currentRoom?.playerStop(socket, userId);
    });

    socket.on("vote-skip-intermission", () => {
      socket.currentRoom?.voteSkip(userId);
    });

    // Voto numa palavra de outro jogador (só nas salas privadas, onde a
    // validação é feita pela mesa em vez do glossário).
    // Dono da sala privada dá o start na partida.
    socket.on("iniciar-partida", () => {
      socket.currentRoom?.iniciarPartida?.(userId);
    });

    // BOTS DE TESTE NA SALA PRIVADA DO STOP (ver game/stopBots.js).
    // Só em sala privada, e só o dono dela ou um admin.
    async function podeMexerNosBots(room) {
      if (!room?.privada) return false;
      if (room.donoId && room.donoId === userId) return true;
      const quem = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      return quem?.role === "ADMIN";
    }
    socket.on("stop-chamar-bots", async ({ quantos } = {}) => {
      const room = socket.currentRoom;
      try {
        if (!(await podeMexerNosBots(room))) {
          socket.emit("stop-bots-erro", { error: "Só quem criou a sala pode chamar bots de teste." });
          return;
        }
        const n = await chamarBotsNoStop(room, quantos);
        if (!n) socket.emit("stop-bots-erro", { error: "Não deu pra chamar bots agora (sala cheia ou já tem bots)." });
      } catch (err) {
        console.error("stop-chamar-bots:", err.message);
      }
    });
    socket.on("stop-dispensar-bots", async () => {
      const room = socket.currentRoom;
      try {
        if (await podeMexerNosBots(room)) dispensarBotsDoStop(room, { motivo: "pedido do dono" });
      } catch (err) {
        console.error("stop-dispensar-bots:", err.message);
      }
    });

    socket.on("vote-word", ({ targetUserId, themeKey, valido } = {}) => {
      if (!targetUserId || !themeKey) return;
      socket.currentRoom?.submitWordVote?.(userId, targetUserId, themeKey, valido);
    });

    socket.on("chat-message", seguro("chat-message", async ({ message } = {}) => {
      if (!message?.trim() || !socket.currentRoom) return;
      if (!(await liberadoNoChat(message))) return;
      socket.currentRoom?.chatMessage(userId, nickname, message.trim().slice(0, 300));
    }));

    // ===== Quiz =====
    socket.on("join-quiz-room", seguro("join-quiz-room", async ({ roomId } = {}) => {
      if (!salaQuizValida(roomId)) return; // só sala oficial ou que já existe
      const room = await getOrCreateQuizRoom(io, roomId);
      const joined = await room.addPlayer(socket, userId, nickname);
      if (joined) {
        socket.currentQuizRoom = room;
        recheckPeak().catch(() => {});
      }
    }));

    socket.on("quiz-submit-guess", ({ guess }) => {
      // Corta o palpite no portão, como já era feito com as mensagens de
      // chat. O texto é retransmitido pra sala INTEIRA no log de respostas,
      // então sem limite um cliente adulterado podia mandar uma string
      // gigante e o servidor a multiplicava por todo mundo na sala.
      // 100 caracteres passam longe de qualquer resposta legítima.
      const limpo = typeof guess === "string" ? guess.slice(0, 100) : "";
      socket.currentQuizRoom?.submitGuess(socket, userId, nickname, limpo);
    });

    socket.on("quiz-chat-message", seguro("quiz-chat-message", async ({ message } = {}) => {
      if (!message?.trim() || !socket.currentQuizRoom) return;
      if (!(await liberadoNoChat(message))) return;
      socket.currentQuizRoom?.chatMessage(userId, nickname, message.trim().slice(0, 300));
    }));

    // ===== Acromania =====
    // O try existe porque este handler é async: sem ele, uma falha ao criar a
    // sala ou ao entrar viraria unhandledRejection — o servidor não cai, mas
    // o jogador fica preso na tela de entrada sem nenhum aviso.
    // Botão de chamar bots, dentro da sala. Qualquer jogador pode usar — não
    // há o que proteger, já que a sala deixa de pontuar assim que eles
    // entram, e a decisão afeta todo mundo que está lá.
    socket.on("acromania-chamar-bots", seguro("acromania-chamar-bots", async ({ quantos } = {}) => {
      const room = socket.currentAcromaniaRoom;
      if (!room) return;
      // Sala privada nunca recebe bot, e sala marcada com bots:false também
      // não — a checagem de verdade está no ligarBotsNaSala.
      const n = Math.min(4, Math.max(1, Number(quantos) || 2));
      if (room.botsPedidos) return; // já tem, não empilha
      room.botsPedidos = true;
      await ligarBotsNaSala(room, n);
      room.systemMessage?.(
        `🤖 ${nickname} chamou ${n} ${n === 1 ? "jogador automático" : "jogadores automáticos"} ` +
          `pra sala não ficar parada. As frases deles são bobas de propósito.`,
        false,
        true
      );
      // Avisa a tela pra esconder o botão e mostrar a faixa de que há bots
      // na sala.
      room.broadcast?.("acromania-bots-ligados", { quantos: n });
    }));

    // Dispensar os bots sem precisar sair da sala. Sem isto, a única forma de
    // voltar a valer ranking era todo mundo sair e esperar 30 segundos.
    socket.on("acromania-dispensar-bots", () => {
      const room = socket.currentAcromaniaRoom;
      if (!room || !room.botsPedidos) return;
      dispensarBotsDaSala(room);
      room.systemMessage?.(
        `👋 ${nickname} dispensou os jogadores automáticos.`,
        false,
        true
      );
      room.broadcast?.("acromania-bots-ligados", { quantos: 0, ligados: false });
    });

    socket.on("join-acromania-room", async ({ roomId } = {}) => {
      if (!salaAcromaniaValida(roomId)) {
        socket.emit("acromania-erro", { mensagem: "Essa sala não existe mais. Escolha outra na lista de salas." });
        return;
      }
      // Barreira de verdade: sem isto, quem já estivesse com a página aberta
      // continuaria entrando mesmo com o jogo desligado no painel.
      if (!acromaniaAtivo()) {
        socket.emit("acromania-erro", {
          mensagem: "O Acromania está temporariamente em manutenção. Volte mais tarde!",
        });
        return;
      }
      // Mesma barreira das salas privadas do Stop: quem não passou pela
      // conferência de senha na tela de entrada não entra pelo link.
      if (
        String(roomId || "").startsWith("acromania-privada-") &&
        !liberadoNaAcromania(userId, roomId)
      ) {
        socket.emit("acromania-erro", {
          mensagem: "Entre pela lista de salas — essa sala pede senha.",
        });
        return;
      }

      try {
        const room = await getOrCreateAcromaniaRoom(io, roomId);
        const joined = await room.addPlayer(socket, userId, nickname);
        if (joined) {
          socket.currentAcromaniaRoom = room;
          recheckPeak().catch(() => {});
          // Os bots se desligam sozinhos quando a sala fica sem gente, então
          // precisam ser religados quando alguém volta. A função é idempotente
          // e não faz nada se ACROMANIA_BOTS não estiver definido.
          ligarBotsNaSala(room).catch(() => {});
        }
      } catch (err) {
        console.error("Falha ao entrar na sala de Acromania:", err);
        socket.emit("acromania-erro", { mensagem: "Não foi possível entrar na sala. Tente de novo." });
      }
    });

    // O `?.` aqui descartava frase e voto EM SILÊNCIO quando o socket tinha
    // reconectado (o socket novo não tem `currentAcromaniaRoom`). O jogador
    // clicava em enviar e não acontecia nada, sem erro nenhum — só o refresh
    // resolvia. Agora a falha é dita em voz alta, e o frontend já refaz o
    // join sozinho no evento "connect".
    const semSala = () =>
      socket.emit("acromania-erro", {
        mensagem: "Conexão reiniciada. Reconectando à sala — tente de novo em instantes.",
      });

    socket.on("acromania-submit-phrase", ({ phrase }) => {
      if (!socket.currentAcromaniaRoom) return semSala();
      socket.currentAcromaniaRoom.submitPhrase(socket, userId, phrase || "");
    });

    socket.on("acromania-vote", ({ entryId }) => {
      if (!socket.currentAcromaniaRoom) return semSala();
      socket.currentAcromaniaRoom.vote(socket, userId, entryId);
    });

    socket.on("acromania-chat-message", seguro("acromania-chat-message", async ({ message } = {}) => {
      if (!message?.trim() || !socket.currentAcromaniaRoom) return;
      if (!(await liberadoNoChat(message))) return;
      socket.currentAcromaniaRoom?.chatMessage(userId, nickname, message.trim().slice(0, 300));
    }));

    // ===== Chat Geral (fora das salas, sempre disponível) =====
    socket.on("join-general-chat", seguro("join-general-chat", async () => {
      socket.join("general-chat-room");
      generalChat.addConnection(socket, userId, nickname);
      // Marca AQUI, junto do registro — não no fim do handler. Se a conexão
      // cair durante os `await` abaixo (ou o banco falhar no histórico), o
      // disconnect precisa saber que tem entrada pra remover. Antes a marca
      // vinha depois dos await e a pessoa ficava "online" pra sempre.
      socket.inGeneralChat = true;

      // Tag do clã guardada no socket, buscada uma vez ao entrar no chat.
      // Consultar a cada mensagem seria uma ida ao banco por linha digitada.
      // Mesmo padrão das salas de jogo.
      try {
        const u = await prisma.user.findUnique({
          where: { id: userId },
          select: { clan: { select: { tag: true } } },
        });
        socket.clanTag = u?.clan?.tag || null;
      } catch {
        socket.clanTag = null;
      }

      const history = await generalChat.loadHistory();
      socket.emit("general-chat-history", { messages: history });
      io.to("general-chat-room").emit("general-chat-online", { players: generalChat.getOnlineList() });
    }));

    socket.on("general-chat-message", seguro("general-chat-message", async ({ message }) => {
      if (!socket.inGeneralChat || !message?.trim()) return;

      // Intervalo mínimo entre mensagens da praça.
      //
      // Diferente dos chats de sala (que são só retransmissão), CADA
      // mensagem daqui vira uma ESCRITA no Neon — e o Neon cobra por tempo
      // de banco acordado. O limite de requisições do Express protege só as
      // rotas /api; conexões de socket não passam por ele. Sem este freio,
      // um cliente adulterado podia gravar milhares de linhas por minuto.
      //
      // 700ms é folgado pra conversa humana (ninguém digita mais rápido que
      // isso) e ainda assim fecha a porta pra script.
      const agora = Date.now();
      if (socket.ultimaMsgGeral && agora - socket.ultimaMsgGeral < 700) return;
      socket.ultimaMsgGeral = agora;
      if (!(await liberadoNoChat(message))) return; // anti-flood por conta

      const clean = message.trim().slice(0, 300);
      const salva = await generalChat.saveMessage(userId, clean);
      io.to("general-chat-room").emit("general-chat-message", {
        id: salva.id,
        userId,
        nickname,
        clanTag: socket.clanTag || null,
        message: clean,
        at: Date.now(),
      });
    }));

    // ===== Moderação de chat (MODERATOR e ADMIN) =====
    // Apaga uma mensagem de qualquer chat: praça (geral), Stop, Quiz ou
    // Acromania. O cargo vem do banco na hora, e não do token, porque o
    // token dura 7 dias — alguém rebaixado hoje não pode continuar
    // moderando com um token emitido antes.
    socket.on("delete-chat-message", seguro("delete-chat-message", async ({ escopo, id } = {}) => {
      if (!id || !escopo) return;
      const quem = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (!quem || (quem.role !== "ADMIN" && quem.role !== "MODERATOR")) {
        socket.emit("chat-moderation-error", { error: "Você não tem permissão pra apagar mensagens." });
        return;
      }

      if (escopo === "geral") {
        await generalChat.deleteMessage(id);
        io.to("general-chat-room").emit("chat-message-deleted", { id });
      } else if (escopo === "stop") {
        socket.currentRoom?.apagarMensagem(id);
      } else if (escopo === "quiz") {
        socket.currentQuizRoom?.apagarMensagem(id);
      } else if (escopo === "acromania") {
        socket.currentAcromaniaRoom?.apagarMensagem(id);
      }
    }));

    // ===== Mensagem privada (só entre amigos) =====
    // CONVIDAR UM AMIGO PRA SALA EM QUE ESTOU.
    //
    // Regras, e cada uma tem motivo:
    //   - só amigo confirmado. Sem isso o convite vira porta pra spam de
    //     estranho, que é o que mata chat de jogo;
    //   - um convite por par a cada 60s. Impede insistência em sequência;
    //   - preciso estar REALMENTE na sala que digo estar — o servidor lê de
    //     `socket.currentRoom`, não confia no que o cliente manda.
    const conviteRecente = new Map(); // "de:para" -> timestamp
    socket.on("convidar-para-sala", async ({ amigoId } = {}) => {
      try {
        if (!amigoId || amigoId === userId) return;

        // Cada jogo guarda a sala atual numa propriedade própria do socket
        // (currentRoom pro Stop, currentQuizRoom pro Quiz, etc.) — checa as
        // quatro nessa ordem e usa a primeira que existir. Antes disso só
        // checava currentRoom, então convidar de dentro do Quiz ou do
        // Acromania sempre dava "Você não está numa sala", mesmo estando
        // (zip 618 — achado ao construir o convite do Tribunal).
        let jogo, id, label;
        if (socket.currentRoom?.roomId) {
          jogo = "stop"; id = socket.currentRoom.roomId; label = socket.currentRoom.label;
        } else if (socket.currentQuizRoom?.roomId) {
          jogo = "quiz"; id = socket.currentQuizRoom.roomId; label = socket.currentQuizRoom.label;
        } else if (socket.currentAcromaniaRoom?.roomId) {
          jogo = "acromania"; id = socket.currentAcromaniaRoom.roomId; label = socket.currentAcromaniaRoom.label;
        } else if (socket.currentTribunalSala?.codigo) {
          jogo = "tribunal"; id = socket.currentTribunalSala.codigo; label = socket.currentTribunalSala.nomeSala;
        } else {
          socket.emit("convite-resultado", { ok: false, erro: "Você não está numa sala." });
          return;
        }

        const chave = `${userId}:${amigoId}`;
        const agora = Date.now();
        if (agora - (conviteRecente.get(chave) || 0) < 60000) {
          socket.emit("convite-resultado", {
            ok: false,
            erro: "Você convidou essa pessoa há pouco. Espere um minuto.",
          });
          return;
        }

        // Amizade aceita, em qualquer direção (quem pediu pode ser um ou outro).
        const amizade = await prisma.friendship.findFirst({
          where: {
            status: "accepted",
            OR: [
              { userAId: userId, userBId: amigoId },
              { userAId: amigoId, userBId: userId },
            ],
          },
        });
        if (!amizade) {
          socket.emit("convite-resultado", { ok: false, erro: "Vocês não são amigos." });
          return;
        }

        conviteRecente.set(chave, agora);

        io.to(`user:${amigoId}`).emit("convite-de-sala", {
          de: nickname,
          deId: userId,
          jogo,
          sala: id,
          salaLabel: label || id,
          em: agora,
        });

        socket.emit("convite-resultado", { ok: true });
      } catch (err) {
        console.error("Falha ao convidar:", err.message);
        socket.emit("convite-resultado", { ok: false, erro: "Não foi possível convidar agora." });
      }
    });

    socket.on("join-dm", seguro("join-dm", async ({ friendUserId } = {}) => {
      if (!friendUserId) return;
      const friendship = await prisma.friendship.findFirst({
        where: {
          status: "accepted",
          OR: [
            { userAId: userId, userBId: friendUserId },
            { userAId: friendUserId, userBId: userId },
          ],
        },
      });
      // Admin e moderador conversam com QUALQUER jogador, sem precisar de
      // amizade — é o canal pra avisar sobre pergunta corrigida, responder
      // denúncia ou falar com o campeão do mês.
      //
      // A regra continua valendo pra todo mundo: sem isso, qualquer pessoa
      // poderia abrir conversa com desconhecidos, que é porta pra incômodo.
      if (!friendship) {
        const [quem, oOutro] = await Promise.all([
          prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
          prisma.user.findUnique({ where: { id: friendUserId }, select: { role: true } }),
        ]);
        const ehStaff = (u) => u?.role === "ADMIN" || u?.role === "MODERATOR";

        // Conversa com staff libera OS DOIS LADOS.
        //
        // Antes a exceção valia só pra quem ABRIA a conversa: o admin falava
        // com qualquer jogador, mas o jogador não conseguia responder —
        // batia na regra de amizade e a conversa morria numa via só. Quem
        // recebe uma mensagem da administração precisa poder responder.
        if (!ehStaff(quem) && !ehStaff(oOutro)) {
          socket.emit("dm-error", { error: "Vocês precisam ser amigos pra conversar." });
          return;
        }
      }

      const roomId = ["dm", ...[userId, friendUserId].sort()].join(":");
      socket.join(roomId);
      socket.currentDmRoom = roomId;
      socket.currentDmFriendId = friendUserId;

      const history = await prisma.privateMessage.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: friendUserId },
            { senderId: friendUserId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      // Marca como lidas as mensagens que o amigo mandou pra mim.
      // Zera o cache de avisos: as mensagens acabaram de virar "lidas",
      // e sem isso o avisinho do menu continuaria com o número velho.
      cacheInvalidar(`avisos:${userId}`);
      await prisma.privateMessage.updateMany({
        where: { senderId: friendUserId, receiverId: userId, read: false },
        data: { read: true },
      });

      socket.emit("dm-history", {
        messages: history.reverse().map((m) => ({
          id: m.id,
          senderId: m.senderId,
          message: m.message,
          at: m.createdAt.getTime(),
        })),
      });
    }));

    socket.on("dm-message", seguro("dm-message", async ({ message } = {}) => {
      if (!socket.currentDmRoom || !socket.currentDmFriendId || !message?.trim()) return;
      // Mesmo freio da praça: cada mensagem privada é uma GRAVAÇÃO no banco,
      // e sem limite um script podia gravar milhares por minuto.
      const agora = Date.now();
      if (socket.ultimaDm && agora - socket.ultimaDm < 700) return;
      socket.ultimaDm = agora;
      if (!(await liberadoNoChat(message))) return; // anti-flood por conta
      const clean = message.trim().slice(0, 500);

      // Se o destinatário já estiver com essa conversa aberta agora (tem
      // outro socket na mesma sala de DM), a mensagem já nasce "lida" —
      // evita o avisinho ficar marcado por engano enquanto os dois já
      // estão conversando ao vivo.
      const roomSockets = io.sockets.adapter.rooms.get(socket.currentDmRoom);
      const receiverPresent = roomSockets && [...roomSockets].some((id) => id !== socket.id);

      const saved = await prisma.privateMessage.create({
        data: {
          senderId: userId,
          receiverId: socket.currentDmFriendId,
          message: clean,
          read: !!receiverPresent,
        },
      });
      // Quem recebeu tem uma mensagem nova: limpa o cache dele pra o
      // avisinho aparecer no próximo ciclo, e não só quando o cache expirar.
      cacheInvalidar(`avisos:${socket.currentDmFriendId}`);
      io.to(socket.currentDmRoom).emit("dm-message", {
        id: saved.id,
        senderId: userId,
        message: clean,
        at: saved.createdAt.getTime(),
      });
    }));

    socket.on("disconnect", () => {
      presence.removeConnection(socket.id);
      const salaQueSaiu = socket.currentRoom;
      socket.currentRoom?.removePlayer(socket.id);
      // Sala privada vazia é descartada: o código deixa de valer e a sala
      // some da memória, em vez de ficar rodando timer pra ninguém.
      if (salaQueSaiu?.privada) limparSalaPrivadaSeVazia(salaQueSaiu.roomId);
      socket.currentQuizRoom?.removePlayer(socket.id);
      const acroQueSaiu = socket.currentAcromaniaRoom;
      acroQueSaiu?.removePlayer(socket.id);
      // Sala privada do Acromania: agenda o descarte (a função confere de
      // novo, na hora, se continua vazia). Sem isto ela ficava na memória
      // pra sempre, com o relógio rodando pra ninguém.
      if (acroQueSaiu?.privada) agendarDescarteAcromania(acroQueSaiu.roomId);
      if (socket.inGeneralChat) {
        generalChat.removeConnection(socket.id);
        io.to("general-chat-room").emit("general-chat-online", { players: generalChat.getOnlineList() });
      }
    });
  });
}
