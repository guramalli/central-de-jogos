import crypto from "crypto";

// NEWSLETTER — o link de "não quero mais receber" de cada e-mail.
//
// Precisa funcionar SEM login (a pessoa clica direto do e-mail), então o
// link carrega o id da conta e uma assinatura: HMAC do id com o JWT_SECRET.
// Sem o segredo, ninguém consegue montar o link de outra pessoa pra
// descadastrá-la.

const SEGREDO = process.env.JWT_SECRET || "";

export function assinaturaDescadastro(userId) {
  return crypto
    .createHmac("sha256", SEGREDO)
    .update(`newsletter:${userId}`)
    .digest("base64url")
    .slice(0, 32);
}

export function assinaturaValida(userId, assinatura) {
  if (!SEGREDO || typeof userId !== "string" || typeof assinatura !== "string") return false;
  const certa = Buffer.from(assinaturaDescadastro(userId));
  const veio = Buffer.from(assinatura);
  return certa.length === veio.length && crypto.timingSafeEqual(certa, veio);
}

// `base`: endereço público da API (ex.: https://api.educacaogamer.com.br).
export function linkDescadastro(base, userId) {
  const q = new URLSearchParams({ u: userId, t: assinaturaDescadastro(userId) });
  return `${base.replace(/\/$/, "")}/api/newsletter/sair?${q}`;
}
