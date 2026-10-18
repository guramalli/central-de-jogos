// ===== The Last Dance — RANKING DO SURF (minigame em frontend/public/thelastdance/surf.html) =====
// Montado em /api/thelastdance/surf (por routes/thelastdance.js). Sem conta: a pessoa põe um nome de até 10 letras.
//
//   POST /partida                            → { partida }  (vale para UMA gravação; assinada, com a hora do começo)
//   POST /ranking  ← { partida, nome, pontos } → { posicao, total, top, eu }
//   GET  /ranking[?pontos=N]                 → { total, top[, posicao] }  (posicao = onde N ficaria)
//
// Anti-trapaça simples: a partida precisa ter durado o mínimo das 3 ondas, os pontos têm teto por segundo jogado
// e cada partida grava uma vez só. A tabela (tld_surf_ranking) é criada sozinha na primeira vez, sem migração.
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SURF = {
  nomeMax: 10,
  minSegundos: 75,          // 3 ondas de 28 s + remada e nota: uma partida de verdade passa de 100 s
  maxSegundos: 3 * 3600,
  pontosPorSegundo: 4000,   // teto generoso (as melhores ondas rendem bem menos que isso)
  pontosMax: 500000,
  top: 10,
};

// palavrões e ofensas mais comuns (o nome aparece para todo mundo)
const PROIBIDOS = ["caralh", "porra", "bucet", "xoxot", "piroc", "puta", "viad", "fdp", "merda", "cuzao", "arromb",
  "corno", "boquet", "punhet", "foder", "fodid", "nazi", "hitler", "macaco"];

// nome limpo (até 10 letras, números, espaço e . _ -) ou null
export function limparNome(n) {
  if (typeof n !== "string") return null;
  const t = n.normalize("NFC").replace(/\s+/g, " ").trim();
  if (!t || [...t].length > SURF.nomeMax || !/^[\p{L}\p{N} ._-]+$/u.test(t)) return null;
  const base = t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t");
  const junto = base.replace(/[^a-z]/g, ""); // "p.o.r.r.a" e "p o r r a" também caem
  if (PROIBIDOS.some((p) => junto.includes(p))) return null;
  return t;
}

// partida = "<início em ms>.<aleatório>.<assinatura>"
export function assinarPartida(segredo, inicio, aleatorio = randomBytes(9).toString("base64url")) {
  const sig = createHmac("sha256", segredo).update(`surf.${inicio}.${aleatorio}`).digest("base64url").slice(0, 32);
  return `${inicio}.${aleatorio}.${sig}`;
}
export function lerPartida(segredo, partida) {
  if (typeof partida !== "string" || partida.length > 80) return null;
  const [inicio, aleatorio, sig] = partida.split(".");
  if (!/^\d{12,14}$/.test(inicio || "") || !aleatorio || !sig) return null;
  const certa = assinarPartida(segredo, inicio, aleatorio).split(".")[2];
  const a = Buffer.from(sig), b = Buffer.from(certa);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { inicio: Number(inicio) };
}

// banco: Postgres pelo Prisma (SQL com parâmetros; a tabela nasce na primeira chamada).
// carregar() devolve o cliente do Prisma (importado só quando o ranking é usado).
export function bancoPrisma(carregar) {
  let pronta = null, prisma = null;
  const tabela = () => (pronta ||= (async () => {
    prisma = await carregar();
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS tld_surf_ranking (
      id SERIAL PRIMARY KEY, nome VARCHAR(20) NOT NULL, pontos INTEGER NOT NULL, partida VARCHAR(80) NOT NULL UNIQUE,
      ip VARCHAR(16), criado_em TIMESTAMPTZ NOT NULL DEFAULT now())`);
    await prisma.$executeRawUnsafe("CREATE INDEX IF NOT EXISTS tld_surf_ranking_pontos ON tld_surf_ranking (pontos DESC, id)");
  })().catch((e) => { pronta = null; throw e; }));
  return {
    async inserir({ nome, pontos, partida, ip }) {
      await tabela();
      const r = await prisma.$queryRaw`INSERT INTO tld_surf_ranking (nome, pontos, partida, ip)
        VALUES (${nome}, ${pontos}, ${partida}, ${ip}) ON CONFLICT (partida) DO NOTHING RETURNING id`;
      return r[0] ? Number(r[0].id) : null;
    },
    async top(n) {
      await tabela();
      const r = await prisma.$queryRaw`SELECT id, nome, pontos FROM tld_surf_ranking ORDER BY pontos DESC, id ASC LIMIT ${n}`;
      return r.map((x) => ({ id: Number(x.id), nome: x.nome, pontos: Number(x.pontos) }));
    },
    async total() {
      await tabela();
      const r = await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM tld_surf_ranking`;
      return Number(r[0].n);
    },
    // quantos ficam na frente: mais pontos, ou os mesmos pontos e gravados antes
    async naFrente(pontos, id) {
      await tabela();
      const r = id == null
        ? await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM tld_surf_ranking WHERE pontos > ${pontos}`
        : await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM tld_surf_ranking WHERE pontos > ${pontos} OR (pontos = ${pontos} AND id < ${id})`;
      return Number(r[0].n);
    },
  };
}

export function criaRotasSurf({ db, segredo, agora = () => Date.now(), limite = true }) {
  const r = Router();
  const lim = (max, minutos) => rateLimit({ windowMs: minutos * 60 * 1000, max, standardHeaders: true, legacyHeaders: false,
    message: { error: "Muitos pedidos. Espere uns minutos e tente de novo." } });
  const semSegredo = (res) => res.status(503).json({ error: "O ranking ainda não foi configurado no servidor." });
  const ipResumo = (req) => createHash("sha256").update(String(req.ip || "") + "|" + segredo).digest("hex").slice(0, 16);
  const erroBanco = (res, e) => { console.error("[tld surf ranking]", e && e.message); res.status(503).json({ error: "O ranking está fora do ar agora." }); };

  r.post("/partida", ...(limite ? [lim(40, 10)] : []), (req, res) => {
    if (!segredo) return semSegredo(res);
    res.set("Cache-Control", "no-store");
    res.json({ partida: assinarPartida(segredo, agora()) });
  });

  r.get("/ranking", async (req, res) => {
    try {
      const pontos = Number(req.query.pontos);
      const [top, total] = await Promise.all([db.top(SURF.top), db.total()]);
      const corpo = { total, top: top.map(({ nome, pontos: p }) => ({ nome, pontos: p })) };
      if (Number.isInteger(pontos) && pontos >= 0 && pontos <= SURF.pontosMax) corpo.posicao = (await db.naFrente(pontos)) + 1;
      res.set("Cache-Control", "no-store");
      res.json(corpo);
    } catch (e) { erroBanco(res, e); }
  });

  r.post("/ranking", ...(limite ? [lim(12, 60)] : []), async (req, res) => {
    if (!segredo) return semSegredo(res);
    const { partida, nome, pontos } = req.body || {};
    const limpo = limparNome(nome);
    if (!limpo) return res.status(400).json({ error: `Escolha um nome de 1 a ${SURF.nomeMax} letras (sem palavrão).` });
    const p = lerPartida(segredo, partida);
    if (!p) return res.status(400).json({ error: "Partida inválida. Jogue de novo para entrar no ranking." });
    const seg = (agora() - p.inicio) / 1000;
    if (seg < SURF.minSegundos || seg > SURF.maxSegundos) return res.status(400).json({ error: "Partida fora do tempo. Jogue de novo para entrar no ranking." });
    if (!Number.isInteger(pontos) || pontos < 0 || pontos > Math.min(SURF.pontosMax, SURF.pontosPorSegundo * seg)) {
      return res.status(400).json({ error: "Pontuação inválida." });
    }
    try {
      const id = await db.inserir({ nome: limpo, pontos, partida, ip: ipResumo(req) });
      if (id == null) return res.status(409).json({ error: "Essa partida já está no ranking." });
      const [top, total, naFrente] = await Promise.all([db.top(SURF.top), db.total(), db.naFrente(pontos, id)]);
      res.set("Cache-Control", "no-store");
      res.json({
        posicao: naFrente + 1, total,
        top: top.map((x) => ({ nome: x.nome, pontos: x.pontos, eu: x.id === id })),
        eu: { nome: limpo, pontos },
      });
    } catch (e) { erroBanco(res, e); }
  });

  return r;
}
