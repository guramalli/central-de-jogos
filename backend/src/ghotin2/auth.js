// ===== Ghotin2 — middleware das rotas com conta (requireG2) e a conferência da conta (conferirContaG2) =====
//
// Igual ao middleware/auth.js do site, mas para as contas do Ghotin2 (tabela Ghotin2Conta) e o token próprio (token.js):
// cada requisição confere no banco se a conta existe, se não foi banida e se o token é da versão atual (tokenVersao), com
// cache de 1 minuto por conta (utils/cache.js). Trocar a senha, sair de todos ou apagar a conta apaga o cache na hora.
//
// Diferença do site: se o banco não responde, aqui é 503 (e não "segue com o token"), porque toda rota do Ghotin2 usa o
// banco logo em seguida de qualquer jeito.
//
// 19/11/2026 (modo online, fase 1): a conferência saiu para conferirContaG2(prisma, token), usada pelo requireG2 (as rotas)
// e pelo socket do mundo (ghotin2/socketMundo.js). O comportamento das rotas continua o mesmo.
import { cacheOuBuscar, cacheApagar } from "../utils/cache.js";
import { verificarTokenG2 } from "./token.js";

const CACHE_S = 60;
const chaveCache = (id) => `g2conta:${id}`;
export const esquecerContaG2 = (id) => cacheApagar(chaveCache(id));

const SESSAO_ACABOU = Object.freeze({ ok: false, status: 401, codigo: "token_invalido", error: "Sua sessão acabou. Entre de novo." });

// Confere o token (só o texto, sem o "Bearer ") e a conta no banco (com o cache de 1 min).
// Devolve { ok: true, conta: { id, tv, iat } } ou { ok: false, status, codigo, error } (o status é o da rota HTTP).
export async function conferirContaG2(prisma, token) {
  let t;
  try { t = verificarTokenG2(token); } catch { return SESSAO_ACABOU; }
  let atual;
  try {
    atual = await cacheOuBuscar(chaveCache(t.id), CACHE_S, async () => {
      const c = await prisma.ghotin2Conta.findUnique({ where: { id: t.id }, select: { banido: true, tokenVersao: true } });
      return c ? { existe: true, banido: c.banido, tv: c.tokenVersao } : { existe: false };
    });
  } catch (e) {
    return { ok: false, status: 503, codigo: "fora_do_ar", error: "As contas do Ghotin2 voltam em instantes." };
  }
  if (!atual.existe || atual.tv !== t.tv) return SESSAO_ACABOU;
  if (atual.banido) return { ok: false, status: 403, codigo: "banido", error: "Esta conta foi banida." };
  return { ok: true, conta: t };
}

export function criaRequireG2({ prisma }) {
  return async function requireG2(req, res, next) {
    const h = req.headers.authorization;
    if (!h || !h.startsWith("Bearer ")) return res.status(401).json({ error: "Entre na sua conta.", codigo: "token_invalido" });
    const r = await conferirContaG2(prisma, h.slice(7));
    if (!r.ok) return res.status(r.status).json({ error: r.error, codigo: r.codigo });
    req.g2 = { id: r.conta.id, tv: r.conta.tv, iat: r.conta.iat };
    next();
  };
}
