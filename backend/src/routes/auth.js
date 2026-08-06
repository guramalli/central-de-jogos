import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { signToken } from "../utils/jwt.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { nickname, email, password, city, state, birthDate, termsAccepted } = req.body;
  if (!nickname || !email || !password) {
    return res.status(400).json({ error: "Preencha nickname, email e senha." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Senha deve ter ao menos 6 caracteres." });
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

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Credenciais inválidas." });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Credenciais inválidas." });
  if (user.banned) return res.status(403).json({ error: "Esta conta foi banida da plataforma." });
  const token = signToken(user);
  res.json({ token, user: { id: user.id, nickname: user.nickname, role: user.role } });
});

export default router;
