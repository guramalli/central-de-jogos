import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { cacheOuBuscar } from "../utils/cache.js";
import { MISSOES_ATIVAS, missoesDe } from "../game/missoes.js";
import { ehPremium } from "../utils/premium.js";

const router = Router();

// Todos os avisinhos do menu numa requisição só.
//
// Antes eram três chamadas separadas a cada ciclo (amigos, mensagens e
// missões). Como o Neon cobra por tempo de banco acordado, cada requisição
// extra empurra o custo pra cima — juntar as três corta 2/3 do tráfego.
//
// O resultado ainda passa por um cache curto: se a pessoa tiver várias
// abas abertas, ou recarregar a página várias vezes, o banco é consultado
// uma vez só nesse intervalo.
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    const dados = await cacheOuBuscar(`avisos:${userId}`, 45, async () => {
      // As duas contagens simples vão juntas, em paralelo.
      const [amigos, mensagens] = await Promise.all([
        prisma.friendship.count({ where: { userBId: userId, status: "pending" } }),
        prisma.privateMessage.count({ where: { receiverId: userId, read: false } }),
      ]);

      let missoes = 0;
      if (MISSOES_ATIVAS) {
        try {
          const u = await prisma.user.findUnique({
            where: { id: userId },
            select: { premiumAte: true, premiumVitalicio: true },
          });
          const m = await missoesDe(userId, ehPremium(u));
          missoes = [...m.diarias, ...m.semanais].filter(
            (x) => x.concluida && !x.resgatada
          ).length;
        } catch {
          // Missões indisponíveis não podem derrubar os outros avisos.
        }
      }

      return { amigos, mensagens, missoes };
    });

    res.json(dados);
  } catch {
    // Falha aqui não pode quebrar o menu do site: devolve tudo zerado.
    res.json({ amigos: 0, mensagens: 0, missoes: 0 });
  }
});

export default router;
