import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../db.js";
import { signToken } from "../utils/jwt.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Reaproveita a mesma origem configurada pro CORS — é o endereço público do
// site (frontend), usado pra montar o link que vai no e-mail de redefinição.
const FRONTEND_URL = process.env.CORS_ORIGIN || "http://localhost:5173";
const RESET_TOKEN_VALID_MS = 60 * 60 * 1000; // 1 hora

// Limite de tentativas — protege contra alguém tentando adivinhar senha por
// força bruta (tentativa e erro em sequência, sem limite de velocidade).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // no máximo 10 tentativas por IP nesse período
  message: { error: "Muitas tentativas seguidas. Aguarda uns minutos e tenta de novo." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, async (req, res) => {
  const { nickname, email, password, city, state, birthDate, termsAccepted } = req.body;
  if (!nickname || !email || !password) {
    return res.status(400).json({ error: "Preencha nickname, email e senha." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Senha deve ter ao menos 8 caracteres." });
  }
  if (nickname.trim().length > 15) {
    return res.status(400).json({ error: "Nickname deve ter no máximo 15 caracteres." });
  }
  if (!termsAccepted) {
    return res.status(400).json({ error: "É preciso aceitar os Termos de Uso para se cadastrar." });
  }
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { nickname }] },
  });
  if (existing) {
    return res.status(409).json({ error: "Email ou nickname já cadastrado." });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      nickname,
      email,
      password: hashed,
      city: city?.trim() || null,
      state: state?.trim() || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      termsAcceptedAt: new Date(),
    },
  });
  const token = signToken(user);
  res.json({ token, user: { id: user.id, nickname: user.nickname, role: user.role } });
});

router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Credenciais inválidas." });
  if (!user.password) {
    return res.status(400).json({ error: "Essa conta usa login com Google. Entra pelo botão do Google, não pela senha." });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Credenciais inválidas." });
  if (user.banned) return res.status(403).json({ error: "Esta conta foi banida da plataforma." });
  const token = signToken(user);
  res.json({ token, user: { id: user.id, nickname: user.nickname, role: user.role } });
});

// Pede a redefinição de senha por e-mail. SEMPRE responde com a mesma
// mensagem genérica, exista ou não aquele e-mail no banco — assim ninguém
// consegue "escanear" quais e-mails têm conta cadastrada testando aqui.
router.post("/forgot-password", authLimiter, async (req, res) => {
  const { email } = req.body;
  const genericMessage = { message: "Se esse e-mail estiver cadastrado, mandamos um link de redefinição pra ele." };

  if (!email) return res.status(400).json({ error: "Informe o e-mail." });

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_VALID_MS) },
    });
    const resetUrl = `${FRONTEND_URL}/redefinir-senha?token=${token}`;
    sendPasswordResetEmail({ nickname: user.nickname, email: user.email, resetUrl }).catch(() => {});
  }

  res.json(genericMessage);
});

// Confirma a redefinição — precisa do token válido (mandado por e-mail) e
// não vencido (1 hora).
router.post("/reset-password", authLimiter, async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: "Token e nova senha são obrigatórios." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Senha deve ter ao menos 8 caracteres." });
  }

  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return res.status(400).json({ error: "Link inválido ou expirado. Pede um novo." });
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetToken: null, resetTokenExpiry: null },
  });

  res.json({ message: "Senha redefinida com sucesso! Já pode entrar com a senha nova." });
});

// Gera um nickname único a partir do nome que veio do Google — sanitiza
// (remove acentos e símbolos), corta em 15 caracteres, e se já existir
// alguém com esse nickname, vai testando com um número no final até achar
// um livre.
async function generateNicknameFromName(name) {
  const base = (name || "Jogador")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 12) || "Jogador";

  let candidate = base;
  let suffix = 0;
  while (await prisma.user.findUnique({ where: { nickname: candidate } })) {
    suffix++;
    candidate = `${base}${suffix}`.slice(0, 15);
  }
  return candidate;
}

// Login (ou cadastro automático, se for a primeira vez) via Google — recebe
// o token de identidade que o botão do Google gera no navegador, confirma
// com o próprio Google que ele é válido e de verdade, e só então libera acesso.
router.post("/google", authLimiter, async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: "Token do Google ausente." });
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: "Login com Google não está configurado no servidor ainda." });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    return res.status(401).json({ error: "Token do Google inválido." });
  }

  if (!payload?.email_verified) {
    return res.status(401).json({ error: "E-mail do Google não verificado." });
  }

  let user = await prisma.user.findUnique({ where: { email: payload.email } });

  if (!user) {
    const nickname = await generateNicknameFromName(payload.name);
    user = await prisma.user.create({
      data: {
        nickname,
        email: payload.email,
        password: null,
        avatarUrl: payload.picture || null,
        termsAcceptedAt: new Date(),
      },
    });
  }

  if (user.banned) return res.status(403).json({ error: "Esta conta foi banida da plataforma." });

  const token = signToken(user);
  res.json({ token, user: { id: user.id, nickname: user.nickname, role: user.role } });
});

// Entrada rápida como visitante: cria uma conta temporária só com nickname,
// sem e-mail nem senha, pra pessoa experimentar o jogo antes de decidir se
// quer se cadastrar. Visitante NÃO concorre a ranking nenhum — a conta
// existe só pra o jogo funcionar (chat, salas, placar da partida).
router.post("/guest", authLimiter, async (req, res) => {
  const { nickname } = req.body;

  const nick = (nickname || "").trim();
  if (nick.length < 3 || nick.length > 15) {
    return res.status(400).json({ error: "O apelido precisa ter entre 3 e 15 caracteres." });
  }
  if (!/^[\p{L}\p{N}_ ]+$/u.test(nick)) {
    return res.status(400).json({ error: "Use apenas letras, números, espaço e underline." });
  }

  // Visitante ganha um sufixo pra deixar claro que não é conta registrada e
  // pra nunca colidir com o nickname de alguém cadastrado.
  let nickname_final = `${nick} (visitante)`;
  if (nickname_final.length > 30) nickname_final = `${nick.slice(0, 18)} (visitante)`;

  const existe = await prisma.user.findUnique({ where: { nickname: nickname_final } });
  if (existe) {
    // Já tem alguém usando esse apelido de visitante agora — sugere variar.
    return res.status(409).json({ error: "Esse apelido já está em uso agora. Tenta outro?" });
  }

  const user = await prisma.user.create({
    data: {
      nickname: nickname_final,
      // E-mail sintético só pra satisfazer a restrição de unicidade — não é
      // usado pra nada e não recebe mensagem nenhuma.
      email: `guest_${crypto.randomUUID()}@visitante.local`,
      password: null,
      isGuest: true,
      termsAcceptedAt: new Date(),
    },
  });

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, nickname: user.nickname, role: user.role, isGuest: true },
  });
});

export default router;
