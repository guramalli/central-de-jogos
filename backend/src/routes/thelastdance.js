// ===== The Last Dance (jogo em frontend/public/thelastdance/) — ÁREA DOS AMIGOS =====
// Montado em /api/thelastdance. Os personagens com rosto de amigos de verdade vão para o site TRANCADOS
// (assets/vip/amigos.bin, AES-256-GCM com uma chave aleatória). Este servidor guarda a senha e a chave
// (variáveis de ambiente no Render, nunca no código) e só entrega a chave para quem acerta a senha.
//
//   POST /vip  ← { senha }  → 200 { chave } | 401 senha errada | 429 tentativas demais | 503 ainda não configurado
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
    max: 8,                   // 8 tentativas por IP: dá para errar umas vezes, não dá para chutar senha em massa
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Tentativas demais. Espere uns minutos e tente de novo." },
  });

  r.post("/vip", ...(limite ? [tentativas] : []), (req, res) => {
    const senha = env.TLD_SENHA, chave = env.TLD_CHAVE;
    if (!senha || !/^[0-9a-f]{64}$/i.test(chave || "")) {
      return res.status(503).json({ error: "A área dos amigos ainda não foi configurada no servidor." });
    }
    const digitada = req.body && req.body.senha;
    if (typeof digitada !== "string" || !digitada.trim() || digitada.length > 200) {
      return res.status(400).json({ error: "Digite a senha." });
    }
    if (!senhaConfere(digitada, senha)) return res.status(401).json({ error: "Senha errada." });
    res.set("Cache-Control", "no-store");
    res.json({ chave: chave.toLowerCase() });
  });

  return r;
}

export default criaRotasTheLastDance();
