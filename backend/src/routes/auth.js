import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../db.js";
import { signToken } from "../utils/jwt.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";
import { verificarTurnstile } from "../turnstile.js";
import { autoBanirIP, registrarRejeicao, registrarCriacaoConta } from "../ipBan.js";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Reaproveita a mesma origem configurada pro CORS — é o endereço público do
// site (frontend), usado pra montar o link que vai no e-mail de redefinição.
// Se houver várias origens separadas por vírgula, usa a PRIMEIRA: o e-mail
// precisa de um destino único, e sem esse corte o link sairia quebrado (com
// as duas URLs coladas) assim que uma segunda origem fosse adicionada.
const FRONTEND_URL = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",")[0].trim();
const RESET_TOKEN_VALID_MS = 60 * 60 * 1000; // 1 hora

// Limite de tentativas — protege contra alguém tentando adivinhar senha por
// força bruta (tentativa e erro em sequência, sem limite de velocidade).
// Vale só pras rotas que envolvem SENHA, onde tentativa repetida é sinal
// de ataque.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // no máximo 10 tentativas por IP nesse período
  message: { error: "Muitas tentativas seguidas. Aguarda uns minutos e tenta de novo." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limite bem mais folgado para entrada como visitante e login pelo Google.
//
// Essas rotas NÃO têm senha pra adivinhar, então o risco de força bruta não
// existe — o único abuso possível seria criar contas em massa, que o número
// abaixo já contém.
//
// O ponto crítico: muita gente compartilha o mesmo IP. Redes de escola,
// empresa e principalmente operadoras de celular (que usam CGNAT) colocam
// dezenas ou centenas de pessoas atrás de um único endereço. Com o limite
// apertado, uma divulgação bem-sucedida faria jogadores legítimos serem
// bloqueados justamente na hora de maior movimento.
const entradaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 60, // 60 entradas por IP nesse período
  message: { error: "Muitas entradas seguidas desse endereço. Aguarda um pouquinho." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Visitante é um caso à parte: não pede e-mail nem senha, então um script
// consegue criar dezenas de contas em segundos sem nunca esbarrar no limite
// de cima (pensado pra cadastro de verdade). Foi exatamente isso que
// aconteceu (zip 599): mais de 50 contas "LoadTestUserNN" criadas em
// sequência, direto na API, sem passar pela tela de "jogar sem cadastro".
// Dois limites, mais apertados: um curto (pega rajada) e um diário (pega
// quem tenta driblar espaçando as requisições).
const visitanteLimiterCurto = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 8, // 8 visitantes por IP — dá folga pra uma família/rede compartilhada, não pra um script
  message: { error: "Muitas entradas de visitante seguidas. Aguarda um pouquinho ou crie uma conta." },
  standardHeaders: true,
  legacyHeaders: false,
});
const visitanteLimiterDiario = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 25, // 25 visitantes por IP no dia — pega quem tenta espaçar as requisições pra escapar do limite de cima
  message: { error: "Limite de entradas de visitante desse endereço hoje. Tenta de novo amanhã ou crie uma conta." },
  standardHeaders: true,
  legacyHeaders: false,
});

// O cadastro completo NUNCA teve um limite apertado por IP (zip 613) — só
// o "entradaLimiter" de cima (60/5min, pensado pra outra coisa) e o global
// do site inteiro. Um IP só conseguia criar dezenas de contas registradas
// seguidas sem esbarrar em nada específico. Mesmo padrão do visitante:
// curto (rajada) + diário (quem tenta espaçar).
const cadastroLimiterCurto = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5, // 5 cadastros por IP — uma família cadastrando todo mundo cabe, um script não
  message: { error: "Muitos cadastros seguidos desse endereço. Aguarda um pouquinho." },
  standardHeaders: true,
  legacyHeaders: false,
});
const cadastroLimiterDiario = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 15, // 15 cadastros por IP no dia
  message: { error: "Limite de cadastros desse endereço hoje. Tenta de novo amanhã." },
  standardHeaders: true,
  legacyHeaders: false,
});

// LIMITE GLOBAL, não por IP (zip 601) — os limites acima seguram um único
// endereço, mas não seguram alguém trocando de IP a cada tentativa (o nome
// "ChkRL1/2/3" que apareceu no ataque sugere justamente alguém testando
// se dá pra escapar do limite por IP). `keyGenerator` sempre igual pra
// todo mundo faz o próprio express-rate-limit contar o site INTEIRO como
// uma coisa só. Generoso o bastante pra não atrapalhar um pico real de
// gente chegando (a campanha no Reddit, por exemplo), apertado o bastante
// pra travar um ataque robotizado vindo de vários endereços.
const contaNovaLimiterGlobal = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 50, // contas novas (visitante + cadastro) no SITE INTEIRO nesse período
  keyGenerator: () => "global",
  message: { error: "Muita gente criando conta ao mesmo tempo. Tenta de novo em alguns minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Domínios reservados só pra documentação (RFC 2606) — nenhuma pessoa de
// verdade tem e-mail neles. Uma das contas do ataque (zip 601) usava
// "@example.com" pra se cadastrar de verdade, driblando o limite pensado
// só pra visitante. Bloquear aqui tem risco zero de barrar gente real.
const DOMINIOS_RESERVADOS = new Set(["example.com", "example.net", "example.org", "example.edu"]);

// Apelidos que passam por moderador/admin/dono do site (zip 603) — um
// visitante chamado "admin" não ganha NENHUM poder de verdade, mas pode
// enganar outros jogadores no chat fingindo ser da equipe. Pega variações
// com espaço/underline/maiúscula ("A D M I N", "_admin_") normalizando
// antes de comparar.
const APELIDOS_RESERVADOS = new Set([
  "admin", "administrador", "administrator", "moderador", "moderator",
  "staff", "suporte", "support", "sistema", "system", "root",
  "equipe", "oficial", "official", "educacaogamer",
]);
function normalizarApelido(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}
// zip 606: era comparação EXATA ("admin" == "admin") — passava por cima de
// "AdminEG" (normaliza pra "admineg", uma palavra "diferente" de "admin"
// pra uma comparação exata). Agora checa se a palavra reservada aparece em
// QUALQUER parte do apelido normalizado — pega "AdminEG", "SuperAdmin",
// "Admin123" etc. O preço é bloquear também quem só TEM essas letras por
// coincidência (raro em nomes reais); vale a troca depois de ver alguém
// de verdade explorando essa brecha pra se passar pela equipe do site.
function apelidoReservado(nick) {
  const norm = normalizarApelido(nick);
  for (const palavra of APELIDOS_RESERVADOS) {
    if (norm.includes(palavra)) return true;
  }
  return false;
}

router.post("/register", entradaLimiter, cadastroLimiterCurto, cadastroLimiterDiario, contaNovaLimiterGlobal, async (req, res) => {
  const { nickname, email, password, city, state, birthDate, termsAccepted, turnstileToken } = req.body;
  if (!(await verificarTurnstile(turnstileToken, req.ip))) {
    return res.status(400).json({ error: "Não foi possível confirmar que você não é um robô. Recarregue a página e tente de novo." });
  }
  if (!nickname || !email || !password) {
    return res.status(400).json({ error: "Preencha nickname, email e senha." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Senha deve ter ao menos 8 caracteres." });
  }
  // Mesmas regras de apelido que a entrada de visitante já aplica — antes o
  // cadastro aceitava qualquer coisa (só espaços, símbolos estranhos, sem
  // tamanho mínimo), o que gerava apelidos quebrados no ranking e no chat.
  const nick = String(nickname).trim();
  if (nick.length < 3 || nick.length > 15) {
    return res.status(400).json({ error: "Nickname deve ter entre 3 e 15 caracteres." });
  }
  if (!/^[\p{L}\p{N}_ ]+$/u.test(nick)) {
    return res.status(400).json({ error: "Nickname pode ter apenas letras, números, espaço e underline." });
  }
  if (apelidoReservado(nick)) {
    await registrarRejeicao(req.ip, "apelido de admin");
    return res.status(400).json({ error: "Esse apelido não está disponível." });
  }
  // Validação de e-mail mais rígida (zip 605) — a de antes aceitava
  // basicamente qualquer coisa com "@" e um ponto ("a@a.a" passava), e o
  // ataque estava se aproveitando disso pra cadastrar e-mails que não têm
  // cara de e-mail de verdade. Exige domínio com estrutura real e TLD de
  // pelo menos 2 letras — cobre e-mail de verdade (inclusive .com.br,
  // +apelido, etc.) sem abrir espaço pra lixo sintático.
  const mail = String(email).trim().toLowerCase();
  if (mail.length > 254 || !/^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(mail)) {
    return res.status(400).json({ error: "Informe um e-mail válido." });
  }
  if (DOMINIOS_RESERVADOS.has(mail.split("@")[1])) {
    await autoBanirIP(req.ip, "e-mail de domínio reservado no cadastro");
    return res.status(400).json({ error: "Esse domínio de e-mail não é válido pra cadastro." });
  }
  if (!termsAccepted) {
    return res.status(400).json({ error: "É preciso aceitar os Termos de Uso para se cadastrar." });
  }
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: mail }, { nickname: nick }] },
  });
  if (existing) {
    return res.status(409).json({ error: "Email ou nickname já cadastrado." });
  }
  const hashed = await bcrypt.hash(password, 10);
  // O try/catch cobre a corrida rara de duas pessoas cadastrando o mesmo
  // apelido/e-mail no MESMO instante: a checagem lá em cima passa pras
  // duas, mas o banco (campo único) recusa a segunda — vira erro amigável
  // em vez de erro 500.
  let user;
  try {
    user = await prisma.user.create({
      data: {
        nickname: nick,
        email: mail,
        password: hashed,
        city: city?.trim() || null,
        state: state?.trim() || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        termsAcceptedAt: new Date(),
      },
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email ou nickname já cadastrado." });
    }
    throw err;
  }
  const token = signToken(user);
  console.log(`[conta criada via /register] ${user.nickname} <${mail}> de ${req.ip} (x-forwarded-for bruto: ${req.headers["x-forwarded-for"] || "-"})`);
  await registrarCriacaoConta(req.ip);
  res.json({ token, user: { id: user.id, nickname: user.nickname, role: user.role } });
});

router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Informe e-mail e senha." });
  }
  const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
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
router.post("/google", entradaLimiter, async (req, res) => {
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

  // Marca se a conta foi criada AGORA. O frontend usa isso pra contar a
  // conversão de cadastro no Google Ads só quando é gente nova de verdade —
  // sem isso, todo login com Google seria contado como cadastro.
  let contaNova = false;

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
    contaNova = true;
  }

  if (user.banned) return res.status(403).json({ error: "Esta conta foi banida da plataforma." });

  const token = signToken(user);
  if (contaNova) console.log(`[conta criada via /google] ${user.nickname} <${user.email}> de ${req.ip} (x-forwarded-for bruto: ${req.headers["x-forwarded-for"] || "-"})`);
  res.json({
    token,
    contaNova,
    user: { id: user.id, nickname: user.nickname, role: user.role },
  });
});

// Entrada rápida como visitante: cria uma conta temporária só com nickname,
// sem e-mail nem senha, pra pessoa experimentar o jogo antes de decidir se
// quer se cadastrar. Visitante NÃO concorre a ranking nenhum — a conta
// existe só pra o jogo funcionar (chat, salas, placar da partida).
router.post("/guest", visitanteLimiterCurto, visitanteLimiterDiario, contaNovaLimiterGlobal, async (req, res) => {
  const { nickname, turnstileToken } = req.body;
  if (!(await verificarTurnstile(turnstileToken, req.ip))) {
    return res.status(400).json({ error: "Não foi possível confirmar que você não é um robô. Recarregue a página e tente de novo." });
  }

  const nick = (nickname || "").trim();
  if (nick.length < 3 || nick.length > 15) {
    return res.status(400).json({ error: "O apelido precisa ter entre 3 e 15 caracteres." });
  }
  if (!/^[\p{L}\p{N}_ ]+$/u.test(nick)) {
    return res.status(400).json({ error: "Use apenas letras, números, espaço e underline." });
  }
  if (apelidoReservado(nick)) {
    await registrarRejeicao(req.ip, "apelido de admin (visitante)");
    return res.status(400).json({ error: "Esse apelido não está disponível." });
  }

  // Visitante ganha um sufixo pra deixar claro que não é conta registrada e
  // pra nunca colidir com o nickname de alguém cadastrado.
  let nickname_final = `${nick} (visitante)`;
  if (nickname_final.length > 30) nickname_final = `${nick.slice(0, 18)} (visitante)`;

  // Cria direto e deixa o próprio banco recusar se o nickname já existir
  // (o campo é único). Antes havia uma consulta extra só pra checar antes —
  // o dobro de idas ao banco por pessoa, o que pesa quando muita gente entra
  // ao mesmo tempo, exatamente o cenário de uma divulgação bem-sucedida.
  try {
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

    console.log(`[conta criada via /guest] ${user.nickname} de ${req.ip} (x-forwarded-for bruto: ${req.headers["x-forwarded-for"] || "-"})`);
    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, nickname: user.nickname, role: user.role, isGuest: true },
    });
  } catch (err) {
    // P2002 = violação de campo único, ou seja, apelido já em uso agora.
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Esse apelido já está em uso agora. Tenta outro?" });
    }
    console.error("Falha ao criar visitante:", err.message);
    res.status(500).json({ error: "Não foi possível entrar agora. Tenta de novo?" });
  }
});

export default router;
