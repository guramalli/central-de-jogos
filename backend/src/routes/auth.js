import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { prisma } from "../db.js";
import { signToken } from "../utils/jwt.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";

const router = Router();

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

export default router;
