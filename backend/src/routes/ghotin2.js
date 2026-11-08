// ===== Ghotin2 (RPG de ação em frontend/public/ghotin2/) — CONTAS, SAVE NA NUVEM e RANKING =====
// Montado em /api/ghotin2 (index.js). Contrato completo: repositório do jogo, jogorpg/Logs/Login/API.md.
//
// Contas SÓ do Ghotin2 (decisão de 03/11): tabelas próprias Ghotin2Conta / Ghotin2Personagem / Ghotin2Comum
// (prisma/schema.prisma; SQL em prisma/sql/20261103_ghotin2_contas.sql). Nada aqui lê ou muda as contas do site (User).
// Antes do "prisma db push" as tabelas não existem: as rotas respondem 503 e o jogo segue com o save do navegador.
//
// Reaproveitado do site:
//   - bcryptjs custo 10 (routes/auth.js) para a senha; o e-mail é guardado só como impressão bcrypt (nunca o endereço);
//   - os limites de tentativa de routes/auth.js (express-rate-limit), com instâncias próprias (não somam com o site);
//   - o filtro de nomes do Lenda (lenda/filtroNome.js), para o usuário e o nome do personagem;
//   - utils/mailer.js (Gmail do site) para o "esqueci a senha";
//   - as regras do save do Lenda (lenda/saveNuvem.js: fila por chave, 10 s entre envios, "fechando", envio velho).
// Novo: token próprio com chave derivada do JWT_SECRET (ghotin2/token.js), trava de 5 erros por conta, sessão única
// ("o último computador que entra fica com a conta"), versão por save e o ranking com conferência de plausibilidade.
import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { prisma as prismaReal } from "../db.js";
import { criaGuardaSave, ordemDoCorpo, SAVE_INTERVALO_MS } from "../lenda/saveNuvem.js";
import { enviarSenhaGhotin2 } from "../utils/mailer.js";
import { cacheOuBuscar } from "../utils/cache.js";
import { assinarTokenG2, RENOVAR_DEPOIS_S } from "../ghotin2/token.js";
import { criaRequireG2, esquecerContaG2 } from "../ghotin2/auth.js";
import * as R from "../ghotin2/regras.js";

const URL_JOGO = process.env.GHOTIN2_URL || "https://www.educacaogamer.com.br/ghotin2/"; // (opcional; o link do e-mail)
const BCRYPT_CUSTO = 10;
export const TRAVA = { erros: 5, ms: 15 * 60_000 }; // 5 senhas erradas seguidas na mesma conta: 15 min
const RESET_MS = 60 * 60_000; // o link do e-mail vale 1 hora
const DIA_MS = 24 * 60 * 60_000;

// os limites por IP (e o de "esqueci" por usuário). Nos testes dá para trocar os números.
export const LIMITES_IP = {
  entrar: { windowMs: 15 * 60_000, max: 10 }, // como o authLimiter do site
  cadastroCurto: { windowMs: 10 * 60_000, max: 5 },
  cadastroDia: { windowMs: DIA_MS, max: 15 },
  cadastroGlobal: { windowMs: 5 * 60_000, max: 50 }, // o servidor inteiro
  esqueciIp: { windowMs: 15 * 60_000, max: 10 },
  esqueciUsuario: { windowMs: 60 * 60_000, max: 3 },
  redefinir: { windowMs: 15 * 60_000, max: 10 },
};

const MSG_CREDENCIAIS = "Usuário ou senha incorretos.";
const MSG_ESQUECI = "Se os dados conferem, mandamos um link para o e-mail (vale 1 hora).";
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const RE_CODIGO = /^[0-9a-f]{64}$/;

const erro = (res, status, codigo, error, extra = {}) => res.status(status).json({ error, codigo, ...extra });
const contaPublica = (c) => ({ usuario: c.usuario, nome: c.nomeVisivel, criadoEm: c.criadoEm });
const resumo = (p) => ({ espaco: p.espaco, nome: p.nome, classe: p.classe, vocacao: p.vocacao, nivel: p.nivel, exp: p.exp, mapa: p.mapa, versao: p.versao, criadoEm: p.criadoEm, atualizadoEm: p.atualizadoEm });

// banco fora do ar ou tabela ainda não criada (P2021): 503, e o jogo segue com a cópia do navegador
const rota = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); } catch (e) {
    console.error("[ghotin2]", req.method, req.path, e && (e.code || e.message));
    if (!res.headersSent) {
      const semTabela = e && e.code === "P2021";
      erro(res, 503, "fora_do_ar", semTabela ? "As contas do Ghotin2 ainda não estão ligadas no servidor. O jogo continua salvando neste computador." : "As contas do Ghotin2 voltam em instantes.");
    }
  }
};

function limitador(cfg, mensagem, keyGenerator) {
  return rateLimit({
    ...cfg, standardHeaders: true, legacyHeaders: false, ...(keyGenerator ? { keyGenerator } : {}),
    handler: (req, res) => {
      const fim = req.rateLimit && req.rateLimit.resetTime ? new Date(req.rateLimit.resetTime).getTime() : Date.now() + cfg.windowMs;
      erro(res, 429, "limite", mensagem, { tenteEmS: Math.max(1, Math.ceil((fim - Date.now()) / 1000)) });
    },
  });
}

export function criaRotasGhotin2({
  prisma = prismaReal,
  auth = null,
  guarda = criaGuardaSave(),
  enviarEmail = enviarSenhaGhotin2,
  agora = () => Date.now(),
  limites = LIMITES_IP,
  urlJogo = URL_JOGO,
  rankingCacheS = 60,
} = {}) {
  const r = Router();
  const requireG2 = auth || criaRequireG2({ prisma });
  const L = {
    entrar: limitador(limites.entrar, "Muitas tentativas seguidas. Aguarde uns minutos e tente de novo."),
    cadastroCurto: limitador(limites.cadastroCurto, "Muitos cadastros seguidos deste endereço. Aguarde um pouco."),
    cadastroDia: limitador(limites.cadastroDia, "Limite de cadastros deste endereço hoje. Tente de novo amanhã."),
    cadastroGlobal: limitador(limites.cadastroGlobal, "Muita gente criando conta ao mesmo tempo. Tente de novo em alguns minutos.", () => "global"),
    esqueciIp: limitador(limites.esqueciIp, "Muitos pedidos seguidos. Aguarde uns minutos."),
    esqueciUsuario: limitador(limites.esqueciUsuario, "Já mandamos links demais para esta conta. Aguarde uma hora.", (req) => "u:" + R.chaveUsuario(req.body && req.body.usuario)),
    redefinir: limitador(limites.redefinir, "Muitas tentativas seguidas. Aguarde uns minutos."),
  };
  // compara com um hash qualquer quando a conta não existe: a resposta demora o mesmo que a de uma senha errada
  let hashFalso = null;
  const compararFalso = async (s) => { hashFalso ||= await bcrypt.hash("conta-que-nao-existe", BCRYPT_CUSTO); await bcrypt.compare(String(s || ""), hashFalso); return false; };
  const contaPorUsuario = (u) => (u && u.length <= 16 ? prisma.ghotin2Conta.findUnique({ where: { usuario: u } }) : null);

  // confere a senha com a trava de 5 erros. Devolve null (certo) ou o erro para responder.
  async function senhaComTrava(c, senha) {
    const t = agora();
    const travada = (ms) => ({ status: 429, codigo: "conta_travada", error: "Muitas senhas erradas. A conta ficou travada por 15 minutos.", extra: { tenteEmS: Math.max(1, Math.ceil(ms / 1000)) } });
    if (c.travadoAte && new Date(c.travadoAte).getTime() > t) return travada(new Date(c.travadoAte).getTime() - t);
    if (typeof senha === "string" && senha && (await bcrypt.compare(senha, c.senhaHash))) {
      if (c.falhasLogin || c.travadoAte) await prisma.ghotin2Conta.update({ where: { id: c.id }, data: { falhasLogin: 0, travadoAte: null } });
      return null;
    }
    const u = await prisma.ghotin2Conta.update({ where: { id: c.id }, data: { falhasLogin: { increment: 1 } }, select: { falhasLogin: true } });
    if (u.falhasLogin >= TRAVA.erros) {
      await prisma.ghotin2Conta.update({ where: { id: c.id }, data: { falhasLogin: 0, travadoAte: new Date(t + TRAVA.ms) } });
      return travada(TRAVA.ms);
    }
    return { status: 401, codigo: "credenciais", error: MSG_CREDENCIAIS };
  }
  const responde = (res, e) => erro(res, e.status, e.codigo, e.error, e.extra || {});

  // escrita só com a sessão atual da conta ("o último computador que entra fica com a conta")
  async function sessaoConfere(contaId, sessao) {
    if (typeof sessao !== "string" || !sessao) return false;
    const c = await prisma.ghotin2Conta.findUnique({ where: { id: contaId }, select: { sessao: true } });
    return !!c && c.sessao === sessao;
  }
  const SESSAO_TOMADA = { status: 409, codigo: "sessao_tomada", error: "Você entrou nesta conta em outro computador." };

  // personagens apagados há mais de 7 dias somem de vez (feito aos poucos, quando a conta aparece)
  const limparApagados = (contaId) => prisma.ghotin2Personagem.deleteMany({ where: { contaId, apagadoEm: { lt: new Date(agora() - R.LIMITES.apagadoDias * DIA_MS) } } });

  // ======================= CONTA =======================
  r.post("/conta/cadastrar", L.cadastroCurto, L.cadastroDia, L.cadastroGlobal, rota(async (req, res) => {
    const b = req.body || {};
    const u = R.confereUsuario(b.usuario);
    if (!u.ok) return erro(res, 400, "usuario_invalido", u.erro);
    const s = R.confereSenha(b.senha);
    if (!s.ok) return erro(res, 400, "senha_invalida", s.erro);
    const m = R.confereEmail(b.email);
    if (!m.ok) return erro(res, 400, "email_invalido", m.erro);
    if (b.tenho13 !== true) return erro(res, 400, "idade", "Marque a caixa \"Tenho 13 anos ou mais, ou meus pais deixaram\".");
    if (await prisma.ghotin2Conta.findUnique({ where: { usuario: u.usuario }, select: { id: true } })) return erro(res, 409, "usuario_em_uso", "Esse usuário já existe. Escolha outro.");
    const [senhaHash, emailHash] = await Promise.all([bcrypt.hash(b.senha, BCRYPT_CUSTO), bcrypt.hash(m.email, BCRYPT_CUSTO)]);
    const t = new Date(agora());
    let c;
    try {
      c = await prisma.ghotin2Conta.create({ data: { usuario: u.usuario, nomeVisivel: u.nome, senhaHash, emailHash, termosEm: t, criadoEm: t, ultimoAcesso: t } });
    } catch (e) {
      if (e && e.code === "P2002") return erro(res, 409, "usuario_em_uso", "Esse usuário já existe. Escolha outro.");
      throw e;
    }
    res.status(201).json({ token: assinarTokenG2(c), conta: contaPublica(c) });
  }));

  r.post("/conta/entrar", L.entrar, rota(async (req, res) => {
    const b = req.body || {};
    const c = await contaPorUsuario(R.chaveUsuario(b.usuario));
    if (!c) { await compararFalso(b.senha); return erro(res, 401, "credenciais", MSG_CREDENCIAIS); }
    const e = await senhaComTrava(c, b.senha);
    if (e) return responde(res, e);
    if (c.banido) return erro(res, 403, "banido", "Esta conta foi banida.");
    await prisma.ghotin2Conta.update({ where: { id: c.id }, data: { ultimoAcesso: new Date(agora()) } });
    res.json({ token: assinarTokenG2(c), conta: contaPublica(c) });
  }));

  r.post("/conta/sair", requireG2, rota(async (req, res) => {
    const b = req.body || {}, id = req.g2.id;
    if (typeof b.sessao === "string" && b.sessao) await prisma.ghotin2Conta.updateMany({ where: { id, sessao: b.sessao }, data: { sessao: null, sessaoDesde: null } });
    if (b.todos === true) { await prisma.ghotin2Conta.update({ where: { id }, data: { tokenVersao: { increment: 1 } } }); esquecerContaG2(id); }
    res.json({ ok: true });
  }));

  r.get("/conta/quem-sou", requireG2, rota(async (req, res) => {
    const c = await prisma.ghotin2Conta.findUnique({ where: { id: req.g2.id } });
    if (!c) return erro(res, 401, "token_invalido", "Sua sessão acabou. Entre de novo.");
    const t = agora(), out = { conta: contaPublica(c), sessaoAtiva: !!c.sessao };
    if (Math.floor(t / 1000) - (req.g2.iat || 0) > RENOVAR_DEPOIS_S) out.token = assinarTokenG2(c);
    if (t - new Date(c.ultimoAcesso).getTime() > 60 * 60_000) await prisma.ghotin2Conta.update({ where: { id: c.id }, data: { ultimoAcesso: new Date(t) } });
    res.json(out);
  }));

  r.post("/conta/esqueci-senha", L.esqueciIp, L.esqueciUsuario, rota(async (req, res) => {
    const b = req.body || {};
    const m = R.confereEmail(b.email);
    if (!m.ok) return erro(res, 400, "email_invalido", m.erro);
    const c = await contaPorUsuario(R.chaveUsuario(b.usuario));
    const confere = c && !c.banido ? await bcrypt.compare(m.email, c.emailHash) : await compararFalso(m.email);
    if (confere) {
      const codigo = crypto.randomBytes(32).toString("hex");
      await prisma.ghotin2Conta.update({ where: { id: c.id }, data: { resetHash: sha256(codigo), resetAte: new Date(agora() + RESET_MS) } });
      // manda para o e-mail DIGITADO (o banco não tem o endereço); falha no envio não muda a resposta
      Promise.resolve(enviarEmail({ usuario: c.nomeVisivel, email: m.email, link: `${urlJogo}#redefinir=${codigo}` })).catch(() => {});
    }
    res.json({ ok: true, mensagem: MSG_ESQUECI });
  }));

  r.post("/conta/redefinir-senha", L.redefinir, rota(async (req, res) => {
    const b = req.body || {};
    if (typeof b.codigo !== "string" || !RE_CODIGO.test(b.codigo)) return erro(res, 400, "codigo_invalido", "Este link não vale mais. Peça outro.");
    const s = R.confereSenha(b.senha);
    if (!s.ok) return erro(res, 400, "senha_invalida", s.erro);
    const resetHash = sha256(b.codigo);
    const c = await prisma.ghotin2Conta.findUnique({ where: { resetHash } });
    if (!c || !c.resetAte || new Date(c.resetAte).getTime() < agora()) return erro(res, 400, "codigo_invalido", "Este link não vale mais. Peça outro.");
    const senhaHash = await bcrypt.hash(b.senha, BCRYPT_CUSTO);
    // uma vez só: só grava se o código ainda é o mesmo (dois cliques ao mesmo tempo: o segundo cai)
    const n = await prisma.ghotin2Conta.updateMany({
      where: { id: c.id, resetHash },
      data: { senhaHash, resetHash: null, resetAte: null, tokenVersao: { increment: 1 }, falhasLogin: 0, travadoAte: null, sessao: null, sessaoDesde: null },
    });
    if (n.count !== 1) return erro(res, 400, "codigo_invalido", "Este link não vale mais. Peça outro.");
    esquecerContaG2(c.id);
    const nova = await prisma.ghotin2Conta.findUnique({ where: { id: c.id } });
    if (!nova || nova.banido) return res.json({ ok: true });
    res.json({ ok: true, token: assinarTokenG2(nova), conta: contaPublica(nova) });
  }));

  r.post("/conta/trocar-senha", L.entrar, requireG2, rota(async (req, res) => {
    const b = req.body || {};
    const s = R.confereSenha(b.senhaNova);
    if (!s.ok) return erro(res, 400, "senha_invalida", s.erro);
    const c = await prisma.ghotin2Conta.findUnique({ where: { id: req.g2.id } });
    if (!c) return erro(res, 401, "token_invalido", "Sua sessão acabou. Entre de novo.");
    const e = await senhaComTrava(c, b.senhaAtual);
    if (e) return responde(res, e);
    const senhaHash = await bcrypt.hash(b.senhaNova, BCRYPT_CUSTO);
    const nova = await prisma.ghotin2Conta.update({ where: { id: c.id }, data: { senhaHash, tokenVersao: { increment: 1 }, resetHash: null, resetAte: null } });
    esquecerContaG2(c.id);
    res.json({ ok: true, token: assinarTokenG2(nova) });
  }));

  // LGPD: apaga a conta e tudo dela na hora (os personagens e o comum vão junto, em cascata)
  r.delete("/conta", L.entrar, requireG2, rota(async (req, res) => {
    const c = await prisma.ghotin2Conta.findUnique({ where: { id: req.g2.id } });
    if (!c) return erro(res, 401, "token_invalido", "Sua sessão acabou. Entre de novo.");
    const e = await senhaComTrava(c, (req.body || {}).senha);
    if (e) return responde(res, e);
    await prisma.ghotin2Conta.delete({ where: { id: c.id } });
    esquecerContaG2(c.id);
    res.json({ ok: true });
  }));

  // ======================= SESSÃO =======================
  r.post("/sessao", requireG2, rota(async (req, res) => {
    const sessao = crypto.randomBytes(16).toString("base64url"); // 22 caracteres: também serve de `sessao` do saveNuvem
    const desde = new Date(agora());
    await prisma.ghotin2Conta.update({ where: { id: req.g2.id }, data: { sessao, sessaoDesde: desde } });
    res.json({ sessao, desde });
  }));

  // ======================= PERSONAGENS =======================
  r.get("/personagens", requireG2, rota(async (req, res) => {
    await limparApagados(req.g2.id);
    const ps = await prisma.ghotin2Personagem.findMany({ where: { contaId: req.g2.id, apagadoEm: null }, orderBy: { espaco: "asc" } });
    res.json({ maxEspacos: R.LIMITES.maxEspacos, personagens: ps.map(resumo) });
  }));

  r.post("/personagens", requireG2, rota(async (req, res) => {
    const b = req.body || {}, id = req.g2.id;
    const n = R.confereNomePersonagem(b.nome);
    if (!n.ok) return erro(res, 400, "nome_invalido", n.erro);
    const cl = R.confereClasse(b.classe, b.vocacao);
    if (!cl.ok) return erro(res, 400, cl.codigo, cl.erro);
    let espaco = null;
    if (b.espaco != null) { espaco = R.confereEspaco(b.espaco); if (espaco === null) return erro(res, 400, "espaco_invalido", "Espaço inválido."); }
    const nomeChave = R.chaveNome(n.nome);
    const out = await guarda.emFila(`${id}:espacos`, async () => {
      if (!(await sessaoConfere(id, b.sessao))) return SESSAO_TOMADA;
      await limparApagados(id);
      const vivos = await prisma.ghotin2Personagem.findMany({ where: { contaId: id, apagadoEm: null }, select: { espaco: true } });
      const ocupados = new Set(vivos.map((v) => v.espaco));
      if (ocupados.size >= R.LIMITES.maxEspacos) return { status: 409, codigo: "sem_espaco", error: `A conta já tem ${R.LIMITES.maxEspacos} personagens.` };
      if (espaco === null) espaco = [...Array(R.LIMITES.maxEspacos).keys()].find((e) => !ocupados.has(e));
      else if (ocupados.has(espaco)) return { status: 409, codigo: "espaco_ocupado", error: "Esse espaço já tem um personagem." };
      if (await prisma.ghotin2Personagem.findUnique({ where: { nomeChave }, select: { id: true } })) return { status: 409, codigo: "nome_em_uso", error: "Já existe um herói com esse nome." };
      const t = new Date(agora());
      try {
        const p = await prisma.ghotin2Personagem.create({ data: { contaId: id, espaco, nome: n.nome, nomeChave, classe: cl.classe, vocacao: cl.vocacao, criadoEm: t, subiuEm: t, atualizadoEm: t } });
        return { ok: true, p };
      } catch (e) {
        if (e && e.code === "P2002") return String(e.meta && e.meta.target).includes("nomeChave")
          ? { status: 409, codigo: "nome_em_uso", error: "Já existe um herói com esse nome." }
          : { status: 409, codigo: "espaco_ocupado", error: "Esse espaço já tem um personagem." };
        throw e;
      }
    });
    if (!out.ok) return responde(res, out);
    res.status(201).json({ personagem: resumo(out.p) });
  }));

  const espacoDaRota = (req, res) => {
    const e = R.confereEspaco(req.params.espaco);
    if (e === null) erro(res, 400, "espaco_invalido", "Espaço inválido.");
    return e;
  };
  const vivo = (contaId, espaco) => prisma.ghotin2Personagem.findFirst({ where: { contaId, espaco, apagadoEm: null } });

  r.get("/personagens/:espaco", requireG2, rota(async (req, res) => {
    const espaco = espacoDaRota(req, res); if (espaco === null) return;
    const p = await vivo(req.g2.id, espaco);
    if (!p) return erro(res, 404, "nao_encontrado", "Esse espaço está vazio.");
    res.json({ personagem: resumo(p), dados: p.versao > 0 && p.dados ? p.dados : null });
  }));

  // resposta do 429 do saveNuvem com o tempo de espera
  const tenteEmS = (gravadoEm) => Math.max(1, Math.ceil((SAVE_INTERVALO_MS - (agora() - gravadoEm)) / 1000));
  const versaoBaseOk = (v) => Number.isInteger(v) && v >= 0 && v < 2_000_000_000;

  r.put("/personagens/:espaco", requireG2, rota(async (req, res) => {
    const espaco = espacoDaRota(req, res); if (espaco === null) return;
    const b = req.body || {}, id = req.g2.id;
    const d = R.confereDados(b.dados);
    if (!d.ok) return erro(res, d.status, d.codigo, d.erro);
    if (!versaoBaseOk(b.versaoBase)) return erro(res, 400, "save_invalido", "versaoBase inválida.");
    const ordem = ordemDoCorpo(b), chave = `${id}:${espaco}`;
    const out = await guarda.emFila(chave, async () => {
      if (!(await sessaoConfere(id, b.sessao))) return SESSAO_TOMADA;
      const p = await vivo(id, espaco);
      if (!p) return { status: 404, codigo: "nao_encontrado", error: "Esse espaço está vazio." };
      // (a versão antes do resumo: uma aba ou um computador que ficou para trás recebe a escolha "Dois saves", e não a recusa)
      if (b.versaoBase !== p.versao) return { status: 409, codigo: "versao_antiga", error: "A conta tem um save mais novo deste personagem.", extra: { versao: p.versao, nivel: p.nivel, atualizadoEm: p.atualizadoEm } };
      const rs = R.confereResumo(b.resumo, { classeAtual: p.classe, vocacao: p.vocacao });
      if (!rs.ok) return { status: 400, codigo: rs.codigo, error: rs.erro, extra: { campo: rs.campo, classeConta: p.classe } };
      const gravadoEm = p.versao > 0 ? new Date(p.atualizadoEm).getTime() : null;
      const dec = guarda.decide(chave, ordem, gravadoEm);
      if (!dec.ok) return dec.velho
        ? { status: 409, codigo: "velho", error: dec.error }
        : { status: 429, codigo: "rapido", error: dec.error, extra: { tenteEmS: tenteEmS(gravadoEm) } };
      const t = agora();
      const data = { dados: d.dados, tamanho: d.dados.length, versao: p.versao + 1, nivel: rs.nivel, exp: rs.exp, classe: rs.classe, atualizadoEm: new Date(t) };
      if (rs.mapa) data.mapa = rs.mapa;
      if (rs.nivel > p.nivel) data.subiuEm = new Date(t);
      if (!p.suspeito) {
        const motivo = R.motivoSuspeito(rs, new Date(p.criadoEm).getTime(), t);
        if (motivo) { data.suspeito = true; data.suspeitoMotivo = motivo.slice(0, 200); console.warn(`[ghotin2] personagem ${p.id} fora do ranking: ${motivo}`); }
      }
      const u = await prisma.ghotin2Personagem.updateMany({ where: { id: p.id, versao: p.versao, apagadoEm: null }, data });
      if (u.count !== 1) return { status: 409, codigo: "versao_antiga", error: "A conta tem um save mais novo deste personagem.", extra: { versao: p.versao + 1 } };
      guarda.registra(chave, ordem, dec);
      return { ok: true, versao: data.versao, atualizadoEm: data.atualizadoEm };
    });
    if (!out.ok) return responde(res, out);
    res.json(out);
  }));

  r.delete("/personagens/:espaco", requireG2, rota(async (req, res) => {
    const espaco = espacoDaRota(req, res); if (espaco === null) return;
    const b = req.body || {}, id = req.g2.id;
    const out = await guarda.emFila(`${id}:espacos`, async () => {
      if (!(await sessaoConfere(id, b.sessao))) return SESSAO_TOMADA;
      const p = await vivo(id, espaco);
      if (!p) return { status: 404, codigo: "nao_encontrado", error: "Esse espaço está vazio." };
      if (R.chaveNome(typeof b.nome === "string" ? b.nome.trim() : "") !== p.nomeChave) return { status: 400, codigo: "nome_nao_confere", error: "Digite o nome do personagem para apagar." };
      const t = new Date(agora());
      // o espaço e o nome ficam livres na hora; a linha fica 7 dias (o admin ainda recupera) e depois some
      await prisma.ghotin2Personagem.update({ where: { id: p.id }, data: { apagadoEm: t, espaco: null, nomeChave: null, atualizadoEm: t } });
      return { ok: true };
    });
    if (!out.ok) return responde(res, out);
    res.json({ ok: true });
  }));

  // ======================= COMUM (armazém + mapa explorado) =======================
  r.get("/comum", requireG2, rota(async (req, res) => {
    const c = await prisma.ghotin2Comum.findUnique({ where: { contaId: req.g2.id } });
    if (!c) return erro(res, 404, "nao_encontrado", "A conta ainda não tem armazém salvo.");
    res.json({ dados: c.dados, versao: c.versao, atualizadoEm: c.atualizadoEm });
  }));

  r.put("/comum", requireG2, rota(async (req, res) => {
    const b = req.body || {}, id = req.g2.id;
    const d = R.confereDados(b.dados);
    if (!d.ok) return erro(res, d.status, d.codigo, d.erro);
    if (!versaoBaseOk(b.versaoBase)) return erro(res, 400, "save_invalido", "versaoBase inválida.");
    const ordem = ordemDoCorpo(b), chave = `${id}:comum`;
    const out = await guarda.emFila(chave, async () => {
      if (!(await sessaoConfere(id, b.sessao))) return SESSAO_TOMADA;
      const atual = await prisma.ghotin2Comum.findUnique({ where: { contaId: id }, select: { versao: true, atualizadoEm: true } });
      const versao = atual ? atual.versao : 0;
      if (b.versaoBase !== versao) return { status: 409, codigo: "versao_antiga", error: "A conta tem um armazém mais novo.", extra: { versao, atualizadoEm: atual ? atual.atualizadoEm : null } };
      const gravadoEm = atual ? new Date(atual.atualizadoEm).getTime() : null;
      const dec = guarda.decide(chave, ordem, gravadoEm);
      if (!dec.ok) return dec.velho
        ? { status: 409, codigo: "velho", error: dec.error }
        : { status: 429, codigo: "rapido", error: dec.error, extra: { tenteEmS: tenteEmS(gravadoEm) } };
      const t = new Date(agora());
      const data = { dados: d.dados, tamanho: d.dados.length, versao: versao + 1, atualizadoEm: t };
      if (!atual) {
        try { await prisma.ghotin2Comum.create({ data: { contaId: id, ...data, criadoEm: t } }); }
        catch (e) { if (e && e.code === "P2002") return { status: 409, codigo: "versao_antiga", error: "A conta tem um armazém mais novo.", extra: { versao: 1 } }; throw e; }
      } else {
        const u = await prisma.ghotin2Comum.updateMany({ where: { contaId: id, versao }, data });
        if (u.count !== 1) return { status: 409, codigo: "versao_antiga", error: "A conta tem um armazém mais novo.", extra: { versao: versao + 1 } };
      }
      guarda.registra(chave, ordem, dec);
      return { ok: true, versao: data.versao, atualizadoEm: t };
    });
    if (!out.ok) return responde(res, out);
    res.json(out);
  }));

  // ======================= RANKING (público) =======================
  r.get("/ranking", rota(async (req, res) => {
    const classe = req.query.classe ? String(req.query.classe) : null;
    if (classe && !R.CLASSES.includes(classe)) return erro(res, 400, "classe_invalida", "Classe desconhecida.");
    const pedido = Number(req.query.limite);
    const limite = Number.isInteger(pedido) && pedido >= 1 ? Math.min(pedido, 100) : 50;
    const dados = await cacheOuBuscar(`g2rank:${classe || "todas"}:${limite}`, rankingCacheS, async () => {
      const ps = await prisma.ghotin2Personagem.findMany({
        where: { apagadoEm: null, suspeito: false, versao: { gt: 0 }, conta: { banido: false }, ...(classe ? { classe } : {}) },
        orderBy: [{ nivel: "desc" }, { exp: "desc" }, { subiuEm: "asc" }, { id: "asc" }],
        take: limite,
        select: { nome: true, classe: true, nivel: true, exp: true },
      });
      // só nome do personagem, classe, nível e EXP: nada da conta
      return { classe, geradoEm: new Date(agora()).toISOString(), lista: ps.map((p, i) => ({ posicao: i + 1, nome: p.nome, classe: p.classe, nivel: p.nivel, exp: p.exp, expTotal: R.expTotal(p.nivel, p.exp) })) };
    });
    res.json(dados);
  }));

  return r;
}

export default criaRotasGhotin2();
