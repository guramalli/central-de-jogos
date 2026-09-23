import { Router } from "express";
import { prisma } from "../db.js";
import { assinaturaValida } from "../utils/newsletter.js";

// Descadastro da newsletter, direto do link do e-mail (sem login).
//   GET  /sair   -> página "pronto, você não recebe mais" (clique no link)
//   POST /sair   -> descadastro "de um clique" que o Gmail/Outlook fazem
//                   pelo botão deles (cabeçalho List-Unsubscribe-Post)
//   GET  /voltar -> desfaz, caso tenha clicado sem querer
// A assinatura no link (utils/newsletter.js) garante que só o dono do
// e-mail consegue mexer na própria inscrição.
const router = Router();

const SITE = "https://www.educacaogamer.com.br";

function pagina(titulo, texto, link = null) {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo} — Educação Gamer</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #2b1b5e; font-family: system-ui, sans-serif; color: #2b1b5e; padding: 16px; box-sizing: border-box; }
  main { max-width: 440px; background: #fff6ea; border-radius: 22px; padding: 28px; text-align: center; box-shadow: 0 6px 0 #d8cbb2; }
  h1 { margin: 0 0 10px; font-size: 22px; }
  p { margin: 0 0 16px; line-height: 1.5; }
  a { display: inline-block; margin: 4px; padding: 12px 18px; border-radius: 14px; background: #ffd60a; color: #2b1b5e; font-weight: 800; text-decoration: none; }
  a.leve { background: transparent; text-decoration: underline; font-weight: 600; }
</style></head>
<body><main><h1>${titulo}</h1><p>${texto}</p>${link || ""}<a href="${SITE}">Ir pro Educação Gamer</a></main></body></html>`;
}

async function mudarInscricao(req, recebe) {
  const u = String(req.query.u || "");
  const t = String(req.query.t || "");
  if (!assinaturaValida(u, t)) return false;
  await prisma.user.updateMany({ where: { id: u }, data: { recebeNovidades: recebe } });
  return true;
}

router.get("/sair", async (req, res) => {
  if (!(await mudarInscricao(req, false))) {
    return res.status(400).send(pagina("Link inválido", "Esse link de descadastro não é válido. Se quiser parar de receber, responda o e-mail pedindo e a gente tira na hora."));
  }
  const q = new URLSearchParams({ u: String(req.query.u), t: String(req.query.t) });
  res.send(pagina(
    "Pronto, você não vai mais receber",
    "Tiramos seu e-mail da lista de novidades. Sua conta continua normal, com tudo que você já conquistou.",
    `<a class="leve" href="/api/newsletter/voltar?${q}">Cliquei sem querer — quero continuar recebendo</a><br>`,
  ));
});

router.post("/sair", async (req, res) => {
  const ok = await mudarInscricao(req, false);
  res.status(ok ? 200 : 400).json({ ok });
});

router.get("/voltar", async (req, res) => {
  if (!(await mudarInscricao(req, true))) {
    return res.status(400).send(pagina("Link inválido", "Esse link não é válido."));
  }
  res.send(pagina("Você voltou pra lista!", "Vai continuar recebendo as novidades do portal. Valeu!"));
});

export default router;
