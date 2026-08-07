import jwt from "jsonwebtoken";

// Nunca usa um valor padrão aqui — se JWT_SECRET não estiver configurado,
// o servidor recusa ligar (falha alto e cedo) em vez de assinar tokens com
// uma chave previsível, que qualquer pessoa poderia usar pra forjar login
// de administrador.
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.error("❌ ERRO FATAL: a variável JWT_SECRET não está configurada.");
  console.error("   Configure ela no seu .env (local) ou nas variáveis de ambiente do Render (produção).");
  console.error('   Exemplo: JWT_SECRET=uma-string-longa-e-aleatoria-aqui');
  process.exit(1);
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, nickname: user.nickname, role: user.role },
    SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
