import { prisma } from "../db.js";

// ===== Patente fixada manualmente =====
//
// Algumas contas exibem uma patente por decisão nossa, e não por pontuação:
// a conta oficial do site, por exemplo, ostenta a coroa máxima sem precisar
// jogar. É puramente visual — não mexe em pontos, não entra no ranking e
// não tira a patente exclusiva de quem a conquistou de verdade jogando.
//
// Fica em memória pelo mesmo motivo do módulo de detentor: a patente é lida
// o tempo todo (lista de sala, chat, ranking, perfil) e uma consulta por
// leitura acordaria o banco à toa.
const fixadas = new Map(); // userId -> { stop, quiz }

// Contas ADMIN. Elas não competem em ranking nenhum, então exibir a patente
// que a pontuação daria (às vezes a máxima, sem ter jogado por ela) confunde
// quem vê — parece que o dono do site está ganhando de todo mundo.
//
// Fica no mesmo cache das patentes fixas porque o problema é idêntico: a
// patente é lida o tempo todo (lista de sala, chat, ranking, perfil) e uma
// consulta por leitura acordaria o banco à toa.
const admins = new Set();

// Emblema exclusivo do administrador, no lugar da patente nos três jogos.
export const PATENTE_ADMIN = {
  min: 0,
  key: "admin",
  name: "Administração",
  icon: "/ranks/admin.png",
  brilha: true,
  admin: true,
};
const RECARREGAR_A_CADA_MS = 5 * 60 * 1000;
let carregadoEm = 0;
let carregando = false;

async function carregar() {
  const contas = await prisma.user.findMany({
    where: {
      OR: [
        { patenteStopFixa: { not: null } },
        { patenteQuizFixa: { not: null } },
        { role: "ADMIN" },
      ],
    },
    select: { id: true, patenteStopFixa: true, patenteQuizFixa: true, role: true },
  });
  fixadas.clear();
  admins.clear();
  for (const c of contas) {
    if (c.role === "ADMIN") admins.add(c.id);
    if (c.patenteStopFixa || c.patenteQuizFixa) {
      fixadas.set(c.id, { stop: c.patenteStopFixa, quiz: c.patenteQuizFixa });
    }
  }
}

// Recarrega em segundo plano quando o cache está velho. Como quase nenhuma
// conta tem patente fixa, essa consulta é minúscula.
export function agendarRecarga() {
  const agora = Date.now();
  if (carregando || agora - carregadoEm < RECARREGAR_A_CADA_MS) return;
  carregadoEm = agora;
  carregando = true;
  carregar()
    .catch(() => {})
    .finally(() => {
      carregando = false;
    });
}

// Devolve a "key" da patente fixada pra esse jogo, ou null.
export function ehAdmin(userId) {
  return admins.has(userId);
}

export function patenteFixaDe(gameKey, userId) {
  const reg = fixadas.get(userId);
  if (!reg) return null;
  // Acromania compartilha o sistema de patentes do Stop.
  return gameKey === "quiz" ? reg.quiz : reg.stop;
}
