// ===== The Last Dance (jogo em frontend/public/thelastdance/) — ÁREA DOS AMIGOS =====
// Montado em /api/thelastdance. Os personagens com rosto de amigos de verdade vão para o site TRANCADOS
// (assets/vip/amigos.bin, AES-256-GCM com uma chave aleatória). Este servidor guarda a senha e a chave
// (variáveis de ambiente no Render, nunca no código) e só entrega a chave para quem acerta a senha.
//
//   POST /vip  ← { senha }  → 200 { chave } | 401 senha errada | 429 tentativas demais | 503 ainda não configurado
//   GET /vip/estado         → { configurado, problema } (o que falta no Render; nunca mostra a senha nem a chave)
//
// Variáveis: TLD_SENHA (a senha que você passa para os amigos) e TLD_CHAVE (64 caracteres hex, gerada pelo
// frontend/public/thelastdance/tools/vip_trancar.mjs). Trocar a senha = trocar TLD_SENHA no Render (a chave fica).
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createHash, timingSafeEqual } from "node:crypto";

const resumo = (s) => createHash("sha256").update(String(s).normalize("NFC").trim().toLowerCase(), "utf8").digest();

// Confere a senha sem vazar pelo tempo de resposta. Maiúsculas/minúsculas e espaços nas pontas não contam.
export function senhaConfere(digitada, certa) {
  if (typeof digitada !== "string" || !certa) return false;
  return timingSafeEqual(resumo(digitada), resumo(certa));
}

export function criaRotasTheLastDance({ env = process.env, limite = true } = {}) {
  const r = Router();
  const tentativas = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 8,                   // 8 senhas erradas por IP: dá para errar umas vezes, não dá para chutar senha em massa
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,                               // só senha ERRADA conta como tentativa
    requestWasSuccessful: (req, res) => res.statusCode !== 401,
    message: { error: "Tentativas demais. Espere uns minutos e tente de novo." },
  });

  // Tolera o que costuma vir junto ao colar no painel do Render: espaços, quebra de linha e aspas.
  const lerSenha = () => String(env.TLD_SENHA || "").trim().replace(/^["']|["']$/g, "");
  const lerChave = () => String(env.TLD_CHAVE || "").replace(/[\s"']/g, "");
  // O que falta configurar, sem mostrar nada da senha nem da chave ("" = tudo certo).
  function falta() {
    const chave = lerChave(), problemas = [];
    if (!lerSenha()) problemas.push("falta a variável TLD_SENHA");
    if (!chave) problemas.push("falta a variável TLD_CHAVE");
    else if (chave.length !== 64) problemas.push(`a TLD_CHAVE tem ${chave.length} caracteres (precisa ter 64)`);
    else if (!/^[0-9a-f]{64}$/i.test(chave)) problemas.push("a TLD_CHAVE tem caracteres fora de 0-9 e a-f");
    return problemas.join("; ");
  }

  // Conferência da configuração: não gasta tentativa e não revela nada secreto.
  r.get("/vip/estado", (req, res) => {
    const f = falta();
    res.set("Cache-Control", "no-store");
    res.json({ configurado: !f, problema: f || null });
  });

  r.post("/vip", ...(limite ? [tentativas] : []), (req, res) => {
    const f = falta();
    if (f) return res.status(503).json({ error: "A área dos amigos ainda não foi configurada no servidor (" + f + ")." });
    const digitada = req.body && req.body.senha;
    if (typeof digitada !== "string" || !digitada.trim() || digitada.length > 200) {
      return res.status(400).json({ error: "Digite a senha." });
    }
    if (!senhaConfere(digitada, lerSenha())) return res.status(401).json({ error: "Senha errada." });
    res.set("Cache-Control", "no-store");
    res.json({ chave: lerChave().toLowerCase() });
  });

  return r;
}

export default criaRotasTheLastDance();
