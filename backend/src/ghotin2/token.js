// ===== Ghotin2 — TOKEN da conta do jogo =====
//
// Sem segredo novo no Render: a chave do Ghotin2 é DERIVADA do JWT_SECRET do site (HMAC-SHA256 do segredo com um rótulo
// fixo). As duas chaves são diferentes, então:
//   - um token do site (assinado com o JWT_SECRET puro) não passa na verificação daqui;
//   - um token do Ghotin2 não passa no utils/jwt.js do site (requireAuth, socket, limite do Lenda).
// Por cima disso, o token leva claims próprios (aud "ghotin2", iss "educacaogamer", tipo "ghotin2_conta"), conferidos aqui,
// e usa `sub` (e não `id`, como o do site) para o número da conta. Quem descobrir a chave derivada não descobre o
// JWT_SECRET (o HMAC não volta), e trocar o JWT_SECRET no Render troca as duas (todo mundo entra de novo).
//
// `tv` = tokenVersao da conta: trocar/redefinir a senha, "sair de todos" e apagar a conta sobem o número e os tokens
// antigos param de valer (conferido no banco, com cache de 1 min, em ghotin2/auth.js).
import crypto from "crypto";
import jwt from "jsonwebtoken";

export const TOKEN_AUD = "ghotin2";
export const TOKEN_ISS = "educacaogamer";
export const TOKEN_TIPO = "ghotin2_conta";
export const TOKEN_VALIDADE = "30d";
export const RENOVAR_DEPOIS_S = 24 * 60 * 60; // quem-sou devolve um token novo quando o atual tem mais de 1 dia

let chave = null;
function chaveG2() {
  if (chave) return chave;
  const segredo = process.env.JWT_SECRET;
  // o utils/jwt.js já derruba o servidor sem JWT_SECRET; aqui também nunca assina com chave previsível
  if (!segredo) throw new Error("JWT_SECRET não configurado");
  chave = crypto.createHmac("sha256", segredo).update("ghotin2/token/v1").digest();
  return chave;
}

export function assinarTokenG2(conta) {
  return jwt.sign({ tipo: TOKEN_TIPO, tv: conta.tokenVersao || 0 }, chaveG2(), {
    algorithm: "HS256", audience: TOKEN_AUD, issuer: TOKEN_ISS, subject: conta.id, expiresIn: TOKEN_VALIDADE,
  });
}

// devolve { id, tv, iat } ou lança erro
export function verificarTokenG2(token) {
  const p = jwt.verify(token, chaveG2(), { algorithms: ["HS256"], audience: TOKEN_AUD, issuer: TOKEN_ISS });
  if (!p || p.tipo !== TOKEN_TIPO || typeof p.sub !== "string" || !p.sub || !Number.isInteger(p.tv)) throw new Error("token de outro tipo");
  return { id: p.sub, tv: p.tv, iat: p.iat };
}

// para o limite por conta do index.js: o id da conta se o cabeçalho tem um token do Ghotin2 válido, senão null (sem banco)
export function contaDoCabecalhoG2(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  try { return verificarTokenG2(h.slice(7)).id; } catch { return null; }
}
