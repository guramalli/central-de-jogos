// ===== Ghotin2 — middleware das rotas com conta (requireG2) =====
//
// Igual ao middleware/auth.js do site, mas para as contas do Ghotin2 (tabela Ghotin2Conta) e o token próprio (token.js):
// cada requisição confere no banco se a conta existe, se não foi banida e se o token é da versão atual (tokenVersao), com
// cache de 1 minuto por conta (utils/cache.js). Trocar a senha, sair de todos ou apagar a conta apaga o cache na hora.
//
// Diferença do site: se o banco não responde, aqui é 503 (e não "segue com o token"), porque toda rota do Ghotin2 usa o
// banco logo em seguida de qualquer jeito.
import { cacheOuBuscar, cacheApagar } from "../utils/cache.js";
import { verificarTokenG2 } from "./token.js";

const CACHE_S = 60;
const chaveCache = (id) => `g2conta:${id}`;
export const esquecerContaG2 = (id) => cacheApagar(chaveCache(id));

export function criaRequireG2({ prisma }) {
  return async function requireG2(req, res, next) {
    const h = req.headers.authorization;
    if (!h || !h.startsWith("Bearer ")) return res.status(401).json({ error: "Entre na sua conta.", codigo: "token_invalido" });
    let t;
    try { t = verificarTokenG2(h.slice(7)); } catch { return res.status(401).json({ error: "Sua sessão acabou. Entre de novo.", codigo: "token_invalido" }); }
    let atual;
    try {
      atual = await cacheOuBuscar(chaveCache(t.id), CACHE_S, async () => {
        const c = await prisma.ghotin2Conta.findUnique({ where: { id: t.id }, select: { banido: true, tokenVersao: true } });
        return c ? { existe: true, banido: c.banido, tv: c.tokenVersao } : { existe: false };
      });
    } catch (e) {
      return res.status(503).json({ error: "As contas do Ghotin2 voltam em instantes.", codigo: "fora_do_ar" });
    }
    if (!atual.existe || atual.tv !== t.tv) return res.status(401).json({ error: "Sua sessão acabou. Entre de novo.", codigo: "token_invalido" });
    if (atual.banido) return res.status(403).json({ error: "Esta conta foi banida.", codigo: "banido" });
    req.g2 = { id: t.id, tv: t.tv, iat: t.iat };
    next();
  };
}
