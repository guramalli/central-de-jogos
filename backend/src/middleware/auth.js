import { verifyToken } from "../utils/jwt.js";
import { prisma } from "../db.js";
import { cacheOuBuscar, cacheApagar } from "../utils/cache.js";

// O token dura 7 dias e carrega o papel (role) do momento do login. Sem
// reconferir, quem é banido continuava usando o site até o token vencer, e
// um moderador rebaixado seguia no painel admin. Por isso cada requisição
// autenticada confere banimento e papel ATUAIS no banco — mas via cache de
// 1 minuto por pessoa: a consulta só acontece quando já há uma requisição
// chegando (o banco continua podendo dormir quando o site está parado), e
// uma rajada de requisições da mesma pessoa gera uma consulta só. Banir ou
// trocar o papel pelo painel apaga o cache na hora (esquecerSessao).
const SESSAO_CACHE_SEGUNDOS = 60;
const chaveSessao = (userId) => `auth:${userId}`;

function estadoAtual(userId) {
  return cacheOuBuscar(chaveSessao(userId), SESSAO_CACHE_SEGUNDOS, async () => {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, banned: true } });
    // Objeto (e não null) pra "conta não existe" também ficar em cache —
    // cacheOuBuscar trata null como "não tem no cache".
    return u ? { existe: true, role: u.role, banned: u.banned } : { existe: false };
  });
}

// Chamado quando o banimento ou o papel de alguém muda (rotas admin).
export function esquecerSessao(userId) {
  cacheApagar(chaveSessao(userId));
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido." });
  }
  let payload;
  try {
    payload = verifyToken(header.split(" ")[1]);
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }

  let atual = null;
  try {
    atual = await estadoAtual(payload.id);
  } catch (err) {
    // Banco fora do ar por um instante: segue com o que está no token (o
    // comportamento de antes) em vez de derrubar o site inteiro. A própria
    // rota provavelmente vai falhar ao consultar o banco de qualquer jeito.
    console.error("Falha ao conferir sessão de", payload.id, err.message);
  }
  if (atual && (!atual.existe || atual.banned)) {
    // 401 faz o frontend deslogar (api/client.js), igual a token vencido.
    return res.status(401).json({ error: "Sessão encerrada." });
  }
  // Papel ATUAL do banco, não o gravado no token — é ele que requireRole usa.
  req.user = atual ? { ...payload, role: atual.role } : payload;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Acesso restrito a: " + roles.join(", ") });
    }
    next();
  };
}
