// Teste de carga: simula muitos jogadores entrando ao mesmo tempo.
//
// Mede as duas coisas que realmente importam quando um streamer manda
// gente de uma vez:
//   1. As rotas HTTP (perfil, ranking, lista de salas)
//   2. As conexões Socket.IO (é onde o jogo de fato acontece)
//
// USO:
//   node prisma/testeCarga.js                          -> 30 jogadores, local
//   node prisma/testeCarga.js --jogadores=100          -> 100 jogadores
//   node prisma/testeCarga.js --url=https://seu.site   -> testa produção
//
// ⚠️  Rode contra o SEU servidor. Testar site de terceiros sem permissão
//     é abuso. E cuidado ao mirar produção com número alto: você pode
//     derrubar seu próprio site na frente dos jogadores reais.
import { io } from "socket.io-client";

function arg(nome, padrao) {
  const a = process.argv.find((x) => x.startsWith(`--${nome}=`));
  return a ? a.split("=")[1] : padrao;
}

const URL = arg("url", "http://localhost:4000");
const JOGADORES = parseInt(arg("jogadores", "30"), 10);
const SALA = arg("sala", "quiz-arena-relampago-iniciante");

const cores = {
  ok: "\x1b[32m", erro: "\x1b[31m", aviso: "\x1b[33m", reset: "\x1b[0m", dim: "\x1b[90m",
};
const c = (cor, txt) => `${cores[cor]}${txt}${cores.reset}`;

// ===== Etapa 1: criar contas de visitante (é o que a galera vai fazer) =====
async function criarVisitantes(qtd) {
  // Sufixo aleatório curto pra não colidir com contas de testes anteriores.
  const sufixoTeste = Math.random().toString(36).slice(2, 7);
  console.log(`\nCriando ${qtd} conta(s) de visitante...`);
  const tokens = [];
  const tempos = [];
  let falhas = 0;
  let primeiroErro = null;

  // Cria em lotes de 10 em vez de todas de uma vez. Disparar centenas de
  // criações simultâneas satura o pool de conexões do banco e trava o
  // teste — o que mediria o limite do pool, não a capacidade real de
  // atender jogadores (que chegam espaçados, não todos no mesmo milissegundo).
  const TAMANHO_LOTE = 10;
  const criar = [];
  for (let i = 0; i < qtd; i++) {
    criar.push(
      (async () => {
        const t0 = Date.now();
        try {
          // Timeout de 20s: sem isso, se o banco engasgar o teste fica
          // travado pra sempre sem dizer o que aconteceu.
          const r = await fetch(`${URL}/api/auth/guest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // Apelido único e curto: o campo aceita no máximo 15 caracteres, então
          // usar timestamp completo estourava o limite e o corte apagava o
          // índice, fazendo todos pedirem o MESMO apelido.
          body: JSON.stringify({ nickname: `t${i}${sufixoTeste}` }),
            signal: AbortSignal.timeout(20000),
          });
          const d = await r.json();
          tempos.push(Date.now() - t0);
          if (d.token) tokens.push(d.token);
          else {
            falhas++;
            if (!primeiroErro && d.error) primeiroErro = d.error;
          }
        } catch (e) {
          falhas++;
          if (!primeiroErro) primeiroErro = e.name === "TimeoutError" ? "tempo esgotado (banco lento ou sobrecarregado)" : e.message;
        }
      })()
    );
  }
  for (let i = 0; i < criar.length; i += TAMANHO_LOTE) {
    await Promise.all(criar.slice(i, i + TAMANHO_LOTE));
    process.stdout.write(`\r  ${Math.min(i + TAMANHO_LOTE, qtd)}/${qtd}...`);
  }
  process.stdout.write("\r" + " ".repeat(30) + "\r");

  const media = tempos.length ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : 0;
  const max = tempos.length ? Math.max(...tempos) : 0;
  console.log(`  ${falhas === 0 ? c("ok", "✓") : c("erro", "✗")} ${tokens.length} criadas, ${falhas} falha(s)`);
  if (primeiroErro) console.log(`  ${c("erro", "motivo: " + primeiroErro)}`);
  console.log(`  ${c("dim", `tempo médio ${media}ms · pior caso ${max}ms`)}`);
  return tokens;
}

// ===== Etapa 2: bombardear as rotas HTTP mais usadas =====
async function testarRotas(tokens) {
  const rotas = [
    ["Lista de salas do Quiz", "/api/quiz-rooms"],
    ["Ranking mensal (Stop)", "/api/ranking/monthly/stop"],
    ["Ranking mensal (Quiz)", "/api/ranking/monthly/quiz"],
    ["Salas do Stop", "/api/rooms"],
  ];

  console.log(`\nDisparando rotas HTTP (${tokens.length} chamadas simultâneas cada)...`);
  for (const [nome, rota] of rotas) {
    const tempos = [];
    let erros = 0;
    await Promise.all(
      tokens.map(async (token) => {
        const t0 = Date.now();
        try {
          const r = await fetch(`${URL}${rota}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(20000),
          });
          tempos.push(Date.now() - t0);
          if (!r.ok) erros++;
        } catch {
          erros++;
        }
      })
    );
    const media = tempos.length ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : 0;
    const max = tempos.length ? Math.max(...tempos) : 0;
    const sinal = erros > 0 ? c("erro", "✗") : max > 2000 ? c("aviso", "!") : c("ok", "✓");
    console.log(`  ${sinal} ${nome.padEnd(24)} média ${String(media).padStart(5)}ms · pior ${String(max).padStart(5)}ms${erros ? c("erro", ` · ${erros} erro(s)`) : ""}`);
  }
}

// ===== Etapa 3: conexões Socket.IO simultâneas (o mais importante) =====
async function testarSockets(tokens) {
  console.log(`\nAbrindo ${tokens.length} conexões Socket.IO na sala "${SALA}"...`);

  const sockets = [];
  let conectados = 0;
  let erros = 0;
  const tempos = [];

  await Promise.all(
    tokens.map(
      (token, i) =>
        new Promise((resolve) => {
          const t0 = Date.now();
          const s = io(URL, {
            auth: { token },
            transports: ["websocket"],
            reconnection: false,
            timeout: 15000,
          });
          sockets.push(s);

          // Só o primeiro resultado conta: sem isso, o timeout de segurança
          // continuava correndo mesmo depois da conexão dar certo e marcava
          // como erro algo que funcionou.
          let jaFinalizou = false;
          let timeoutId = null;

          const finalizar = (ok) => {
            if (jaFinalizou) return;
            jaFinalizou = true;
            if (timeoutId) clearTimeout(timeoutId);
            if (ok) {
              conectados++;
              tempos.push(Date.now() - t0);
            } else {
              erros++;
            }
            resolve();
          };

          s.on("connect", () => {
            s.emit("join-quiz-room", { roomId: SALA });
            finalizar(true);
          });
          s.on("connect_error", () => finalizar(false));
          timeoutId = setTimeout(() => finalizar(false), 15000);
        })
    )
  );

  const media = tempos.length ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : 0;
  const max = tempos.length ? Math.max(...tempos) : 0;
  const sinal = erros > 0 ? c("erro", "✗") : max > 3000 ? c("aviso", "!") : c("ok", "✓");
  console.log(`  ${sinal} ${conectados} conectado(s), ${erros} falha(s)`);
  console.log(`  ${c("dim", `tempo médio ${media}ms · pior caso ${max}ms`)}`);

  // Deixa rodando um pouco pra ver se o servidor aguenta o tráfego contínuo
  // do jogo (perguntas, chat, atualização de placar).
  console.log(`\n  ${c("dim", "Mantendo conexões por 20s para observar estabilidade...")}`);
  let quedas = 0;
  sockets.forEach((s) => s.on("disconnect", () => quedas++));
  await new Promise((r) => setTimeout(r, 20000));
  console.log(`  ${quedas === 0 ? c("ok", "✓") : c("erro", "✗")} ${quedas} queda(s) de conexão durante o período`);

  // Guarda o número ANTES de desconectar: o encerramento abaixo é proposital
  // (limpeza do teste) e dispara o mesmo evento de "disconnect", o que
  // inflaria a contagem e faria o resumo acusar falha que não houve.
  const quedasReais = quedas;
  sockets.forEach((s) => s.disconnect());
  return { conectados, erros, quedas: quedasReais };
}

async function main() {
  console.log(c("aviso", "\n═══ TESTE DE CARGA — Educação Gamer ═══"));
  console.log(`Alvo: ${URL}`);
  console.log(`Jogadores simulados: ${JOGADORES}`);

  if (!URL.includes("localhost")) {
    console.log(c("aviso", "\n⚠️  Você está mirando um servidor REMOTO."));
    console.log(c("aviso", "   Se for produção, isso afeta jogadores reais. Aguardando 5s..."));
    await new Promise((r) => setTimeout(r, 5000));
  }

  const t0 = Date.now();
  const tokens = await criarVisitantes(JOGADORES);

  if (tokens.length === 0) {
    console.log(c("erro", "\n✗ Nenhuma conta criada. O servidor está no ar? A URL está certa?"));
    process.exit(1);
  }

  await testarRotas(tokens);
  const r = await testarSockets(tokens);

  console.log(c("aviso", "\n═══ RESUMO ═══"));
  console.log(c("dim", "Nota: o teste sai de um único IP, então os limites de"));
  console.log(c("dim", "requisição por endereço podem barrar parte das chamadas."));
  console.log(c("dim", "Jogadores reais vêm de IPs diferentes e não sofrem isso."));
  console.log("");
  console.log(`Duração total: ${Math.round((Date.now() - t0) / 1000)}s`);
  console.log(`Conexões simultâneas sustentadas: ${r.conectados - r.quedas} de ${JOGADORES}`);
  if (r.erros === 0 && r.quedas === 0) {
    console.log(c("ok", `\n✓ O servidor aguentou ${JOGADORES} jogadores sem falhas.`));
    console.log(c("dim", "  Tente de novo com o dobro pra achar o limite real."));
  } else {
    console.log(c("erro", `\n✗ Houve falhas com ${JOGADORES} jogadores.`));
    console.log(c("dim", "  Esse é aproximadamente seu teto atual. Considere subir o plano."));
  }

  console.log(c("dim", "\n⚠️  Lembre de limpar as contas de teste depois:"));
  console.log(c("dim", "    npm run limpar-visitantes -- --dias=0 --go\n"));
  process.exit(0);
}

main().catch((e) => {
  console.error(c("erro", "Erro no teste:"), e.message);
  process.exit(1);
});
