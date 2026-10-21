// ===== Torre Infinita — RANKING ONLINE (jogo em frontend/public/torre/) =====
// Montado em /api/torre. Sem conta: cada espaço de save tem um "jogador" (UUID aleatório) e um apelido.
//
//   POST   /partida  ← { jogador }                                  → { ficha }  (pedida no começo de cada obra)
//   POST   /ranking  ← { ficha, jogador, apelido, obra: { alt, seg } } → { ok, posicoes }  (no fim da obra)
//   GET    /ranking?lista=obra|total|orbita[&jogador=]              → { total, top, eu }
//   DELETE /ranking  ← { jogador }                                  → { ok }  ("sair do ranking")
//
// Torre única (modo principal do jogo desde 21/10/2026): ranking de quem chegou mais alto numa torre.
//   POST   /unica/partida ← { jogador }                              → { ficha }  (pedida no começo de cada torre)
//   POST   /unica/ranking ← { ficha, jogador, apelido, alt, seg }    → { ok, posicao }  (a mesma ficha atualiza enquanto
//                           a torre cresce; vale a maior altura; ficha mais velha que a última aceita é recusada)
//   GET    /unica/ranking[?lista=altura|orbita][&jogador=]          → { total, top (20), corte, eu }  (corte: altura do 20º)
//          orbita = tempo de jogo somado (todas as torres) até a primeira torre passar de 400 km; menor é melhor; só a partir de
//          TORRE.orbitaMinUnica (o robô excelente leva ~4h45); em fase de testes (TORRE.unicaLivre) nada é barrado, só marcado
//   DELETE /unica/ranking ← { jogador }                              → { ok }
//
// O servidor não confia em totais vindos do jogo: ele SOMA as obras que recebe. Cada obra vem com uma ficha assinada
// (JWT_SECRET), presa ao jogador e de USO ÚNICO (precisa ser mais nova que a última aceita). Listas:
//   obra   = maior altura numa obra (m);  total = soma das alturas das obras enviadas (m);
//   orbita = segundos de jogo somados até a primeira obra que passou de 400 km (menor é melhor), só depois de
//            TORRE.orbitaMin de jogo somado.
// Conferências: o tempo real desde a ficha precisa ser pelo menos o tempo de jogo da obra (o relógio da obra pausa
// fora do jogo, então pode passar do tempo de jogo, até 60 dias; com aditivos a obra soma 20 min por ano de contrato); altura com teto por segundo de jogo e teto absoluto.
// A tabela nasce sozinha, como a do surf.
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { confereNome } from "../lenda/filtroNome.js";

export const TORRE = {
  apelidoMin: 3, apelidoMax: 12,
  fichaDias: 60,             // uma obra com aditivos pode atravessar semanas de tempo real
  obraSegMax: 48 * 3600,     // cada ano de contrato são 20 min de jogo; aditivos somam (até 144 anos, na prática ilimitado)
  altPorSegundo: 3000,       // m por segundo de jogo numa obra (depois da Órbita o robô passa de 1.600)
  altMinTeto: 3000,          // começo de obra: teto mínimo
  altMax: 5_000_000,         // 5.000 km numa obra (marcos depois da Órbita vão até 2.000 km; o robô chega perto disso)
  orbitaAlt: 400_000,        // 400 km
  orbitaMin: 3 * 3600,       // a Órbita só conta depois de 3 h de jogo somado (o robô atento leva ~4h20)
  top: 10,
  topUnica: 20,
  orbitaMinUnica: 5 * 3600,  // torre única: tempo até a Órbita só conta acima de 5 h de jogo (quando unicaLivre for false)
  // torre única em fase de testes (pedido do usuário, 21/10/2026: "preciso saber se existem bugs explorados"): tempo, altura
  // e Órbita fora do normal entram no ranking, mas ficam marcados em torre_unica.suspeita (npm run torre-ranking mostra)
  unicaLivre: true,             // torre única: as 20 torres mais altas (o 20º é o corte para entrar)
};
const ORDEM = { obra: "obra_max DESC", total: "total DESC", orbita: "orbita ASC" };
const jogadorOk = (j) => typeof j === "string" && /^[A-Za-z0-9-]{8,40}$/.test(j);

// ficha = "<início em ms>.<aleatório>.<assinatura>", assinada junto com o jogador
export function assinarFicha(segredo, inicio, jogador, aleatorio = randomBytes(9).toString("base64url")) {
  const sig = createHmac("sha256", segredo).update(`torre.${inicio}.${jogador}.${aleatorio}`).digest("base64url").slice(0, 32);
  return `${inicio}.${aleatorio}.${sig}`;
}
export function lerFicha(segredo, ficha, jogador) {
  if (typeof ficha !== "string" || ficha.length > 80 || !jogadorOk(jogador)) return null;
  const [inicio, aleatorio, sig] = ficha.split(".");
  if (!/^\d{12,14}$/.test(inicio || "") || !aleatorio || !sig) return null;
  const certa = assinarFicha(segredo, inicio, jogador, aleatorio).split(".")[2];
  const a = Buffer.from(sig), b = Buffer.from(certa);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { inicio: Number(inicio) };
}
const MOTIVO = {
  simbolo: "use só letras, números e espaço", letras: "use pelo menos 2 letras", contato: "não coloque contato nem site",
  reservado: "esse nome é reservado", palavrao: "sem palavrão",
};
function conferirApelido(a) {
  if (typeof a !== "string") return { ok: false, msg: "Escolha um apelido." };
  const t = a.normalize("NFC").replace(/\s+/g, " ").trim(), n = [...t].length;
  if (n < TORRE.apelidoMin || n > TORRE.apelidoMax) return { ok: false, msg: `O apelido precisa ter de ${TORRE.apelidoMin} a ${TORRE.apelidoMax} letras.` };
  const r = confereNome(t);
  return r.ok ? { ok: true, nome: r.nome } : { ok: false, msg: `Esse apelido não pode ser usado: ${MOTIVO[r.motivo] || "escolha outro"}.` };
}
const num = (v) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);
const valorDe = (l, x) => (l === "obra" ? x.obra_max : l === "total" ? x.total : x.orbita);

// banco em memória (testes): uma linha por jogador
export function bancoMemoria() {
  const linhas = new Map(), unica = new Map(); let seq = 0;
  const uOrdem = (a, b) => b.alt_max - a.alt_max || a.seq - b.seq, oOrdem = (a, b) => a.orbita - b.orbita || a.oseq - b.oseq;
  const ordem = (l) => (a, b) => (l === "orbita" ? a.orbita - b.orbita : valorDe(l, b) - valorDe(l, a)) || a.seq - b.seq;
  const da = (l) => [...linhas.values()].filter((x) => l !== "orbita" || x.orbita != null);
  return {
    linhas,
    async jogador(j) { return linhas.get(j) || null; },
    async salvar(j, dados) { linhas.set(j, { ...(linhas.get(j) || {}), ...dados, jogador: j, seq: ++seq }); },
    async top(l, n) { return da(l).sort(ordem(l)).slice(0, n).map((x) => ({ apelido: x.apelido, valor: valorDe(l, x) })); },
    async total(l) { return da(l).length; },
    async naFrente(l, x) { return da(l).filter((y) => ordem(l)(y, x) < 0).length; },
    async apagar(j) { linhas.delete(j); },
    async apagarApelido(a) {
      let n = 0;
      for (const m of [linhas, unica]) for (const [j, x] of m) if (x.apelido.toLowerCase() === a.toLowerCase()) { m.delete(j); n++; }
      return n;
    },
    // torre única: maior altura; empate = quem chegou primeiro
    async uJogador(j) { return unica.get(j) || null; },
    async uSalvar(j, d) { const a = unica.get(j); unica.set(j, { ...d, suspeita: d.suspeita || (a && a.suspeita) || null, orbita: a && a.orbita != null ? a.orbita : d.orbita ?? null, jogador: j, seq: a && a.alt_max >= d.alt_max ? a.seq : ++seq, oseq: a && a.oseq ? a.oseq : (d.orbita != null ? ++seq : 0) }); },
    async uTop(n, l) { return l === 'orbita' ? [...unica.values()].filter((x) => x.orbita != null).sort(oOrdem).slice(0, n).map((x) => ({ apelido: x.apelido, valor: x.orbita }))
      : [...unica.values()].sort(uOrdem).slice(0, n).map((x) => ({ apelido: x.apelido, valor: x.alt_max })); },
    async uTotal(l) { return l === 'orbita' ? [...unica.values()].filter((x) => x.orbita != null).length : unica.size; },
    async uNaFrente(x, l) { return l === 'orbita' ? [...unica.values()].filter((y) => y.orbita != null && oOrdem(y, x) < 0).length : [...unica.values()].filter((y) => uOrdem(y, x) < 0).length; },
    async uApagar(j) { unica.delete(j); },
  };
}

// banco: Postgres pelo Prisma (SQL com parâmetros; a tabela nasce na primeira chamada)
export function bancoPrisma(carregar) {
  let pronta = null, prisma = null;
  const tabela = () => (pronta ||= (async () => {
    prisma = await carregar();
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS torre_jogadores (
      jogador VARCHAR(40) PRIMARY KEY, apelido VARCHAR(24) NOT NULL, ultima_ficha BIGINT NOT NULL DEFAULT 0,
      obras INTEGER NOT NULL DEFAULT 0, segs DOUBLE PRECISION NOT NULL DEFAULT 0, total DOUBLE PRECISION NOT NULL DEFAULT 0,
      obra_max DOUBLE PRECISION NOT NULL DEFAULT 0, orbita DOUBLE PRECISION, ip VARCHAR(16), atualizado TIMESTAMPTZ NOT NULL DEFAULT now())`);
    await prisma.$executeRawUnsafe("CREATE INDEX IF NOT EXISTS torre_jogadores_obra ON torre_jogadores (obra_max DESC)");
    await prisma.$executeRawUnsafe("CREATE INDEX IF NOT EXISTS torre_jogadores_total ON torre_jogadores (total DESC)");
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS torre_unica (
      jogador VARCHAR(40) PRIMARY KEY, apelido VARCHAR(24) NOT NULL, ultima_ficha BIGINT NOT NULL DEFAULT 0,
      alt_max DOUBLE PRECISION NOT NULL DEFAULT 0, alcancado TIMESTAMPTZ NOT NULL DEFAULT now(), ip VARCHAR(16))`);
    await prisma.$executeRawUnsafe("CREATE INDEX IF NOT EXISTS torre_unica_alt ON torre_unica (alt_max DESC, alcancado ASC)");
    await prisma.$executeRawUnsafe("ALTER TABLE torre_unica ADD COLUMN IF NOT EXISTS orbita DOUBLE PRECISION");
    await prisma.$executeRawUnsafe("ALTER TABLE torre_unica ADD COLUMN IF NOT EXISTS orbita_em TIMESTAMPTZ");
    await prisma.$executeRawUnsafe("ALTER TABLE torre_unica ADD COLUMN IF NOT EXISTS suspeita TEXT");
  })().catch((e) => { pronta = null; throw e; }));
  const linha = (x) => x && ({ ...x, ultima_ficha: Number(x.ultima_ficha), obras: Number(x.obras), segs: Number(x.segs), total: Number(x.total),
    obra_max: Number(x.obra_max), orbita: x.orbita == null ? null : Number(x.orbita) });
  return {
    async jogador(j) { await tabela(); const r = await prisma.$queryRaw`SELECT * FROM torre_jogadores WHERE jogador = ${j}`; return linha(r[0]) || null; },
    async salvar(j, d) {
      await tabela();
      await prisma.$executeRaw`INSERT INTO torre_jogadores (jogador, apelido, ultima_ficha, obras, segs, total, obra_max, orbita, ip)
        VALUES (${j}, ${d.apelido}, ${d.ultima_ficha}, ${d.obras}, ${d.segs}, ${d.total}, ${d.obra_max}, ${d.orbita}, ${d.ip})
        ON CONFLICT (jogador) DO UPDATE SET apelido = EXCLUDED.apelido, ultima_ficha = EXCLUDED.ultima_ficha, obras = EXCLUDED.obras,
          segs = EXCLUDED.segs, total = EXCLUDED.total, obra_max = EXCLUDED.obra_max, orbita = EXCLUDED.orbita, ip = EXCLUDED.ip, atualizado = now()`;
    },
    async top(l, n) {
      await tabela();
      const r = l === "obra" ? await prisma.$queryRaw`SELECT apelido, obra_max AS v FROM torre_jogadores ORDER BY obra_max DESC, atualizado ASC LIMIT ${n}`
        : l === "total" ? await prisma.$queryRaw`SELECT apelido, total AS v FROM torre_jogadores ORDER BY total DESC, atualizado ASC LIMIT ${n}`
        : await prisma.$queryRaw`SELECT apelido, orbita AS v FROM torre_jogadores WHERE orbita IS NOT NULL ORDER BY orbita ASC, atualizado ASC LIMIT ${n}`;
      return r.map((x) => ({ apelido: x.apelido, valor: Number(x.v) }));
    },
    async total(l) {
      await tabela();
      const r = l === "orbita" ? await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM torre_jogadores WHERE orbita IS NOT NULL`
        : await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM torre_jogadores`;
      return Number(r[0].n);
    },
    async naFrente(l, x) {
      await tabela();
      const r = l === "obra" ? await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM torre_jogadores t WHERE t.obra_max > ${x.obra_max} OR (t.obra_max = ${x.obra_max} AND t.atualizado < (SELECT atualizado FROM torre_jogadores WHERE jogador = ${x.jogador}))`
        : l === "total" ? await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM torre_jogadores t WHERE t.total > ${x.total} OR (t.total = ${x.total} AND t.atualizado < (SELECT atualizado FROM torre_jogadores WHERE jogador = ${x.jogador}))`
        : await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM torre_jogadores t WHERE t.orbita IS NOT NULL AND (t.orbita < ${x.orbita} OR (t.orbita = ${x.orbita} AND t.atualizado < (SELECT atualizado FROM torre_jogadores WHERE jogador = ${x.jogador})))`;
      return Number(r[0].n);
    },
    async apagar(j) { await tabela(); await prisma.$executeRaw`DELETE FROM torre_jogadores WHERE jogador = ${j}`; },
    async uJogador(j) {
      await tabela(); const r = await prisma.$queryRaw`SELECT * FROM torre_unica WHERE jogador = ${j}`;
      return r[0] ? { ...r[0], ultima_ficha: Number(r[0].ultima_ficha), alt_max: Number(r[0].alt_max), orbita: r[0].orbita == null ? null : Number(r[0].orbita) } : null;
    },
    async uSalvar(j, d) {
      await tabela();
      const orb = d.orbita ?? null;
      await prisma.$executeRaw`INSERT INTO torre_unica (jogador, apelido, ultima_ficha, alt_max, ip, orbita, orbita_em, suspeita) VALUES (${j}, ${d.apelido}, ${d.ultima_ficha}, ${d.alt_max}, ${d.ip}, ${orb}, CASE WHEN ${orb}::double precision IS NULL THEN NULL ELSE now() END, ${d.suspeita ?? null})
        ON CONFLICT (jogador) DO UPDATE SET apelido = EXCLUDED.apelido, ultima_ficha = EXCLUDED.ultima_ficha, ip = EXCLUDED.ip,
          orbita = COALESCE(torre_unica.orbita, EXCLUDED.orbita), orbita_em = COALESCE(torre_unica.orbita_em, EXCLUDED.orbita_em),
          suspeita = COALESCE(EXCLUDED.suspeita, torre_unica.suspeita),
          alcancado = CASE WHEN EXCLUDED.alt_max > torre_unica.alt_max THEN now() ELSE torre_unica.alcancado END,
          alt_max = GREATEST(torre_unica.alt_max, EXCLUDED.alt_max)`;
    },
    async uTop(n, l) {
      await tabela();
      const r = l === 'orbita' ? await prisma.$queryRaw`SELECT apelido, orbita AS v FROM torre_unica WHERE orbita IS NOT NULL ORDER BY orbita ASC, orbita_em ASC LIMIT ${n}`
        : await prisma.$queryRaw`SELECT apelido, alt_max AS v FROM torre_unica ORDER BY alt_max DESC, alcancado ASC LIMIT ${n}`;
      return r.map((x) => ({ apelido: x.apelido, valor: Number(x.v) }));
    },
    async uTotal(l) {
      await tabela();
      const r = l === 'orbita' ? await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM torre_unica WHERE orbita IS NOT NULL` : await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM torre_unica`;
      return Number(r[0].n);
    },
    async uNaFrente(x, l) {
      await tabela();
      const r = l === 'orbita' ? await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM torre_unica t WHERE t.orbita IS NOT NULL AND (t.orbita < ${x.orbita} OR (t.orbita = ${x.orbita} AND t.orbita_em < (SELECT orbita_em FROM torre_unica WHERE jogador = ${x.jogador})))`
        : await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM torre_unica t WHERE t.alt_max > ${x.alt_max} OR (t.alt_max = ${x.alt_max} AND t.alcancado < (SELECT alcancado FROM torre_unica WHERE jogador = ${x.jogador}))`;
      return Number(r[0].n);
    },
    async uApagar(j) { await tabela(); await prisma.$executeRaw`DELETE FROM torre_unica WHERE jogador = ${j}`; },
    async apagarApelido(a) {
      await tabela();
      return Number(await prisma.$executeRaw`DELETE FROM torre_jogadores WHERE lower(apelido) = lower(${a})`) + Number(await prisma.$executeRaw`DELETE FROM torre_unica WHERE lower(apelido) = lower(${a})`);
    },
  };
}

// moderação (scripts/torre-ranking.js): tira do ranking quem usa um apelido ofensivo que passou pelo filtro
export const removerApelido = (db, apelido) => db.apagarApelido(String(apelido || '').trim());

export function criaRotasTorre({ db, segredo, agora = () => Date.now(), limite = true }) {
  const r = Router();
  // limite por IP + jogador (uma sala de escola sai pelo mesmo IP)
  const lim = (max, minutos) => rateLimit({ windowMs: minutos * 60 * 1000, max, standardHeaders: true, legacyHeaders: false,
    keyGenerator: (req) => `${req.ip}|${(req.body && typeof req.body.jogador === "string" && req.body.jogador.slice(0, 40)) || ""}`,
    message: { error: "Muitos pedidos. Espere uns minutos e tente de novo." } });
  const semSegredo = (res) => res.status(503).json({ error: "O ranking ainda não foi configurado no servidor." });
  const ipResumo = (req) => createHash("sha256").update(String(req.ip || "") + "|" + segredo).digest("hex").slice(0, 16);
  const erroBanco = (res, e) => { console.error("[torre ranking]", e && e.message); res.status(503).json({ error: "O ranking está fora do ar agora." }); };
  const invalido = (res, msg, st = 400) => res.status(st).json({ error: msg });

  r.post("/partida", ...(limite ? [lim(60, 10)] : []), (req, res) => {
    if (!segredo) return semSegredo(res);
    const { jogador } = req.body || {};
    if (!jogadorOk(jogador)) return invalido(res, "Jogador inválido.");
    res.set("Cache-Control", "no-store");
    res.json({ ficha: assinarFicha(segredo, agora(), jogador) });
  });

  r.get("/ranking", async (req, res) => {
    const lista = String(req.query.lista || "");
    if (!ORDEM[lista]) return invalido(res, "Lista inválida.");
    try {
      const [top, total] = await Promise.all([db.top(lista, TORRE.top), db.total(lista)]);
      const corpo = { total, top, eu: null };
      const jogador = req.query.jogador;
      if (jogadorOk(jogador)) {
        const m = await db.jogador(jogador);
        if (m && valorDe(lista, m) != null && (lista !== "obra" || m.obras > 0)) corpo.eu = { posicao: (await db.naFrente(lista, m)) + 1, valor: valorDe(lista, m) };
      }
      res.set("Cache-Control", "no-store");
      res.json(corpo);
    } catch (e) { erroBanco(res, e); }
  });

  r.post("/ranking", ...(limite ? [lim(120, 60)] : []), async (req, res) => {
    if (!segredo) return semSegredo(res);
    const { ficha, jogador, apelido, obra } = req.body || {};
    const ap = conferirApelido(apelido);
    if (!ap.ok) return res.status(400).json({ erro: "nome", error: ap.msg });
    const f = lerFicha(segredo, ficha, jogador);
    if (!f) return invalido(res, "Obra inválida para o ranking.");
    const real = (agora() - f.inicio) / 1000;
    const alt = num(obra && obra.alt), seg = num(obra && obra.seg);
    if (alt == null || seg == null) return invalido(res, "Dados da obra inválidos.");
    if (real > TORRE.fichaDias * 86400 || seg > TORRE.obraSegMax || real < seg - 5) return invalido(res, "Obra fora do tempo.");
    if (alt > Math.min(TORRE.altMax, Math.max(TORRE.altMinTeto, TORRE.altPorSegundo * seg))) return invalido(res, "Altura inválida.");
    try {
      const antes = (await db.jogador(jogador)) || { ultima_ficha: 0, obras: 0, segs: 0, total: 0, obra_max: 0, orbita: null };
      if (f.inicio <= antes.ultima_ficha) return invalido(res, "Essa obra já está no ranking.", 409);
      const segs = antes.segs + seg;
      const novo = {
        apelido: ap.nome, ultima_ficha: f.inicio, obras: antes.obras + 1, segs, total: antes.total + alt, obra_max: Math.max(antes.obra_max, alt),
        orbita: antes.orbita != null ? antes.orbita : alt >= TORRE.orbitaAlt && segs >= TORRE.orbitaMin ? segs : null, ip: ipResumo(req),
      };
      await db.salvar(jogador, novo);
      const eu = await db.jogador(jogador), posicoes = {};
      for (const l of Object.keys(ORDEM)) if (valorDe(l, eu) != null) posicoes[l] = (await db.naFrente(l, eu)) + 1;
      res.set("Cache-Control", "no-store");
      res.json({ ok: true, posicoes });
    } catch (e) { erroBanco(res, e); }
  });

  // ---------- torre única ----------
  r.post("/unica/partida", ...(limite ? [lim(60, 10)] : []), (req, res) => {
    if (!segredo) return semSegredo(res);
    const { jogador } = req.body || {};
    if (!jogadorOk(jogador)) return invalido(res, "Jogador inválido.");
    res.set("Cache-Control", "no-store");
    res.json({ ficha: assinarFicha(segredo, agora(), jogador) });
  });
  r.get("/unica/ranking", async (req, res) => {
    try {
      const l = req.query.lista === "orbita" ? "orbita" : "altura";
      const [top, total, topAlt] = await Promise.all([db.uTop(TORRE.topUnica, l), db.uTotal(l), l === "altura" ? null : db.uTop(TORRE.topUnica, "altura")]);
      const alt = topAlt || top; // o corte (para o campo do apelido aparecer) é sempre pela altura
      const corpo = { total, top, corte: alt.length >= TORRE.topUnica ? alt[TORRE.topUnica - 1].valor : 0, eu: null };
      const jogador = req.query.jogador;
      if (jogadorOk(jogador)) {
        const m = await db.uJogador(jogador);
        if (m && (l === "altura" || m.orbita != null)) corpo.eu = { posicao: (await db.uNaFrente(m, l)) + 1, valor: l === "orbita" ? m.orbita : m.alt_max };
      }
      res.set("Cache-Control", "no-store");
      res.json(corpo);
    } catch (e) { erroBanco(res, e); }
  });
  r.post("/unica/ranking", ...(limite ? [lim(240, 60)] : []), async (req, res) => {
    if (!segredo) return semSegredo(res);
    const { ficha, jogador, apelido } = req.body || {};
    const ap = conferirApelido(apelido);
    if (!ap.ok) return res.status(400).json({ erro: "nome", error: ap.msg });
    const f = lerFicha(segredo, ficha, jogador);
    if (!f) return invalido(res, "Torre inválida para o ranking.");
    const real = (agora() - f.inicio) / 1000, alt = num(req.body.alt), seg = num(req.body.seg);
    if (alt == null || seg == null) return invalido(res, "Dados da torre inválidos.");
    // conferências: na fase liberada (TORRE.unicaLivre) não barram, só marcam a linha como suspeita
    const suspeitas = [];
    const confere = (ok, msg) => { if (!ok) suspeitas.push(msg); return ok || TORRE.unicaLivre; };
    if (!confere(!(real > TORRE.fichaDias * 86400 || seg > TORRE.obraSegMax || real < seg - 5), `tempo: jogo ${Math.round(seg)} s, real ${Math.round(real)} s`)) return invalido(res, "Torre fora do tempo.");
    if (!confere(alt <= Math.min(TORRE.altMax, Math.max(TORRE.altMinTeto, TORRE.altPorSegundo * seg)), `altura: ${Math.round(alt)} m em ${Math.round(seg)} s`)) return invalido(res, "Altura inválida.");
    // tempo até a Órbita (tempo de jogo somado de todas as torres): só com a torre na Órbita
    let orbita = null;
    if (req.body.orbita != null && alt >= TORRE.orbitaAlt) {
      orbita = num(req.body.orbita);
      if (orbita == null) return invalido(res, "Tempo até a Órbita inválido.");
      if (!confere(!(orbita < TORRE.orbitaMinUnica || orbita < seg - 5), `órbita: ${Math.round(orbita)} s`)) return invalido(res, "Tempo até a Órbita inválido.");
    }
    const suspeita = suspeitas.length ? suspeitas.join("; ") : null;
    if (suspeita) console.warn(`[torre/unica] envio suspeito de ${String(apelido).slice(0, 12)} (${jogador}): ${suspeita}`);
    try {
      const antes = await db.uJogador(jogador);
      if (antes && f.inicio < antes.ultima_ficha) return invalido(res, "Essa torre já foi substituída por uma mais nova.", 409);
      await db.uSalvar(jogador, { apelido: ap.nome, ultima_ficha: f.inicio, alt_max: Math.max(alt, antes ? antes.alt_max : 0), ip: ipResumo(req), orbita, suspeita });
      const eu = await db.uJogador(jogador);
      res.set("Cache-Control", "no-store");
      res.json({ ok: true, posicao: (await db.uNaFrente(eu)) + 1 });
    } catch (e) { erroBanco(res, e); }
  });
  r.delete("/unica/ranking", ...(limite ? [lim(20, 60)] : []), async (req, res) => {
    const { jogador } = req.body || {};
    if (!jogadorOk(jogador)) return invalido(res, "Jogador inválido.");
    try { await db.uApagar(jogador); res.json({ ok: true }); } catch (e) { erroBanco(res, e); }
  });

  r.delete("/ranking", ...(limite ? [lim(20, 60)] : []), async (req, res) => {
    const { jogador } = req.body || {};
    if (!jogadorOk(jogador)) return invalido(res, "Jogador inválido.");
    try { await db.apagar(jogador); res.json({ ok: true }); } catch (e) { erroBanco(res, e); }
  });

  return r;
}

export default criaRotasTorre({ db: bancoPrisma(() => import("../db.js").then((m) => m.prisma)), segredo: process.env.JWT_SECRET || "" });
