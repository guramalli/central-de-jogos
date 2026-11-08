// ===== Ghotin2 (jogo em frontend/public/ghotin2/) — REGRAS das contas, do save e do ranking =====
//
// Funções puras (sem banco), testadas em test/ghotin2/. O contrato da API está no repositório do jogo,
// jogorpg/Logs/Login/API.md.
//
// O jogo roda inteiro no navegador. O servidor guarda uma cópia do save (gzip em base64, feito pelo jogo) e não abre o
// conteúdo: confere só formato e tamanho. O que o ranking mostra vem do "resumo" que o jogo manda junto (nível, EXP,
// classe), conferido aqui contra a tabela de EXP do jogo e contra o tempo de vida do personagem no servidor.
import { confereNome } from "../lenda/filtroNome.js";

// ---- copiado do jogo (index.html: EXP_NIVEL, NIVEL_MAX). SE O JOGO MUDAR A TABELA, MUDE AQUI TAMBÉM. ----
// EXP_NIVEL[n] = EXP para passar do nível n ao n+1 (o índice 0 não é usado).
export const EXP_NIVEL = [0, 300, 800, 1500, 2500, 4300, 7200, 11000, 17000, 24000, 33000, 43000, 58000, 76000, 100000, 130000, 169000,
  219000, 283000, 365000, 472000, 610000, 705000, 813000, 937000, 1077000, 1237000, 1418000, 1624000, 1857000, 2122000,
  2421000, 2761000, 3145000, 3580000, 4073000, 4632000, 5194000, 5717000, 6264000, 6837000,
  7600000, 8274000, 8990000, 9753000, 10560000, 11410000, 12320000, 13270000, 14280000, 15340000,
  16870000, 18960000, 19980000, 21420000, 22930000, 24530000, 26200000, 27960000, 29800000, 32780000,
  36060000, 39670000, 43640000, 48000000, 52800000, 58080000, 63890000, 70280000, 77310000, 85040000];
export const NIVEL_MAX = EXP_NIVEL.length - 1; // 70

// classes e vocações do jogo (NOME_CLASSE e VOCACOES do index.html)
export const VOCACOES = {
  norte: ["viking", "guerreiro"],
  caca: ["arqueiro", "ninja"],
  trevas: ["shura", "feiticeiro"],
  dragao: ["xama", "xama_dragao"],
};
export const CLASSES = ["viking", "guerreiro", "arqueiro", "ninja", "feiticeiro", "shura", "xama", "xama_dragao", "aprendiz"];

export const LIMITES = {
  maxEspacos: 4, // personagens vivos por conta (decisão de 03/11)
  dadosMaxChars: 90_000, // save comprimido em base64; o express.json do site aceita até 100 kB por envio
  nivelAceito: 120, // acima disso o resumo é recusado (400); entre NIVEL_MAX+1 e isto, gravado mas fora do ranking
  expAceita: 2_000_000_000, // cabe no Int do Postgres
  senhaMin: 8,
  senhaMax: 72, // o bcrypt só olha os 72 primeiros bytes
  apagadoDias: 7, // personagem apagado fica guardado (só o admin recupera) e depois some
};

const RE_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const RE_USUARIO = /^[A-Za-z0-9_]{3,16}$/;
const RE_MAPA = /^[a-z0-9_]{1,40}$/;
const RE_EMAIL = /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/; // a mesma do cadastro do site
const DOMINIOS_RESERVADOS = new Set(["example.com", "example.net", "example.org", "example.edu"]);
const inteiro = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

// ---------- conta ----------
// usuário: 3 a 16, letras sem acento, números e _; o filtro de nomes do site (palavrão, equipe, contato)
export function confereUsuario(u) {
  const s = typeof u === "string" ? u.trim() : "";
  if (!RE_USUARIO.test(s)) return { erro: "O usuário precisa ter de 3 a 16 letras (sem acento), números ou _." };
  if (!/[A-Za-z]/.test(s)) return { erro: "O usuário precisa ter pelo menos uma letra." };
  if (!confereNome(s.replace(/_/g, " ")).ok || !confereNome(s).ok) return { erro: "Esse nome de usuário não está disponível." };
  return { ok: true, usuario: s.toLowerCase(), nome: s };
}
export const chaveUsuario = (u) => (typeof u === "string" ? u.trim().toLowerCase() : "");

export function confereSenha(s) {
  if (typeof s !== "string" || s.length < LIMITES.senhaMin) return { erro: `A senha precisa ter pelo menos ${LIMITES.senhaMin} caracteres.` };
  if (Buffer.byteLength(s, "utf8") > LIMITES.senhaMax) return { erro: `A senha pode ter no máximo ${LIMITES.senhaMax} caracteres.` };
  return { ok: true };
}

// o e-mail não é guardado: só uma impressão bcrypt dele (normalizado assim)
export const normalizaEmail = (e) => (typeof e === "string" ? e.trim().toLowerCase() : "");
export function confereEmail(e) {
  const m = normalizaEmail(e);
  if (!m || m.length > 254 || !RE_EMAIL.test(m)) return { erro: "Informe um e-mail válido." };
  if (DOMINIOS_RESERVADOS.has(m.split("@")[1])) return { erro: "Informe um e-mail válido." };
  return { ok: true, email: m };
}

// ---------- personagem ----------
// nome: a regra do jogo (validarNome: 3 a 16, letras, números e espaço) + o filtro de nomes do site
export function confereNomePersonagem(n) {
  const nome = typeof n === "string" ? n.trim().replace(/\s+/g, " ") : "";
  if (nome.length < 3 || nome.length > 16) return { erro: "O nome precisa ter de 3 a 16 caracteres." };
  if (!/^[\p{L}\p{N} ]+$/u.test(nome)) return { erro: "Use só letras, números e espaço no nome." };
  if (!confereNome(nome).ok) return { erro: "Esse nome não está disponível." };
  return { ok: true, nome };
}
// para não repetir nome no jogo: sem maiúscula, sem acento, sem espaço ("João Kim" = "joaokim")
export const chaveNome = (n) => String(n || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "");

export function confereClasse(classe, vocacao) {
  if (!CLASSES.includes(classe)) return { erro: "Classe desconhecida.", codigo: "classe_invalida" };
  const voc = vocacao == null ? null : vocacao;
  if (voc !== null && !Object.hasOwn(VOCACOES, voc)) return { erro: "Vocação desconhecida.", codigo: "vocacao_invalida" };
  if (classe === "aprendiz" && !voc) return { erro: "O aprendiz precisa de uma vocação.", codigo: "vocacao_invalida" };
  if (classe !== "aprendiz" && voc && !VOCACOES[voc].includes(classe)) return { erro: "Essa classe não é dessa vocação.", codigo: "vocacao_invalida" };
  return { ok: true, classe, vocacao: voc };
}

export function confereEspaco(v) {
  const n = typeof v === "string" && /^\d$/.test(v) ? Number(v) : v;
  return inteiro(n, 0, LIMITES.maxEspacos - 1) ? n : null;
}

// ---------- save ----------
export function confereDados(dados) {
  if (typeof dados !== "string" || !dados.length) return { erro: "Save vazio.", codigo: "save_invalido", status: 400 };
  if (dados.length > LIMITES.dadosMaxChars) return { erro: "O save ficou grande demais para a conta. Ele continua salvo neste computador.", codigo: "grande_demais", status: 413 };
  if (!RE_BASE64.test(dados)) return { erro: "Save em formato inválido.", codigo: "save_invalido", status: 400 };
  return { ok: true, dados };
}

// o resumo que vai para a lista e o ranking. `classeAtual`/`vocacao`: as do banco (a classe só muda de aprendiz para
// uma classe da vocação, no Altar). A recusa diz o campo e o motivo legível: o jogo mostra "A conta recusou o save: <motivo>"
export const NOME_CLASSE = { viking: "Viking", guerreiro: "Guerreiro", arqueiro: "Arqueiro", ninja: "Ninja", feiticeiro: "Feiticeiro", shura: "Shura",
  xama: "Xamã Relâmpago", xama_dragao: "Xamã Dragão", aprendiz: "Aprendiz" }; // (NOME_CLASSE do index.html)
const nomeClasse = (c) => NOME_CLASSE[c] || String(c).slice(0, 24);
export function confereResumo(r, { classeAtual, vocacao } = {}) {
  const ruim = (erro, campo) => ({ erro, codigo: "resumo_invalido", campo });
  if (!r || typeof r !== "object") return ruim("Resumo do personagem ausente.", "resumo");
  if (!inteiro(r.nivel, 1, LIMITES.nivelAceito)) return ruim(`Nível inválido (${String(r.nivel).slice(0, 12)}).`, "nivel");
  if (!inteiro(r.exp, 0, LIMITES.expAceita)) return ruim(`EXP inválida (${String(r.exp).slice(0, 14)}).`, "exp");
  let mapa = null;
  if (r.mapa != null) { if (typeof r.mapa !== "string" || !RE_MAPA.test(r.mapa)) return ruim("Mapa inválido.", "mapa"); mapa = r.mapa; }
  let classe = classeAtual;
  if (r.classe != null && r.classe !== classeAtual) {
    const podeTrocar = classeAtual === "aprendiz" && CLASSES.includes(r.classe) && r.classe !== "aprendiz" && (!vocacao || VOCACOES[vocacao]?.includes(r.classe));
    if (!podeTrocar) {
      // (a classe só muda uma vez: de aprendiz para uma da vocação, no Altar. O resto é a troca de teste do admin ou uma aba velha)
      const daVocacao = classeAtual === "aprendiz" && CLASSES.includes(r.classe) && r.classe !== "aprendiz";
      return ruim(daVocacao ? `Classe inválida (${nomeClasse(r.classe)} não é da vocação deste aprendiz).`
        : `Classe inválida (o save é de ${nomeClasse(r.classe)}, e este personagem é ${nomeClasse(classeAtual)} na conta).`, "classe");
    }
    classe = r.classe;
  }
  return { ok: true, nivel: r.nivel, exp: r.exp, mapa, classe };
}

// ---------- ranking ----------
// EXP de todos os níveis anteriores + a EXP do nível atual
const EXP_ACUMULADA = EXP_NIVEL.reduce((acc, _, i) => { acc.push(i === 0 ? 0 : acc[i - 1] + EXP_NIVEL[i - 1]); return acc; }, []);
export function expTotal(nivel, exp) {
  const n = Math.max(1, Math.min(nivel, NIVEL_MAX));
  return EXP_ACUMULADA[n] + exp;
}

// O ritmo MAIS RÁPIDO já medido: Logs/Jogador/BALANCO_EXP_GOLD.md, coluna "Viking hoje" (o balanço de antes de 29/10,
// cerca de 3× mais rápido que o atual). [minutos de jogo, nível]. Dividido pela folga, contado em tempo de relógio desde a
// criação do personagem no servidor (que é sempre maior que o tempo de jogo). Quem passa disso é impossível: fora do ranking.
const RITMO_MAX = [[0, 5], [8, 10], [16, 15], [39, 20], [62, 25], [91, 30], [125, 35], [165, 40], [209, 45], [263, 50], [383, 60], [523, 70]];
export const FOLGA_RITMO = 1.5;
export function nivelPossivel(minutos) {
  const m = minutos * FOLGA_RITMO;
  if (m >= RITMO_MAX[RITMO_MAX.length - 1][0]) return NIVEL_MAX;
  for (let i = 1; i < RITMO_MAX.length; i++) {
    const [m1, n1] = RITMO_MAX[i];
    if (m < m1) { const [m0, n0] = RITMO_MAX[i - 1]; return Math.floor(n0 + ((n1 - n0) * (m - m0)) / (m1 - m0)); }
  }
  return NIVEL_MAX;
}
// null = plausível; senão, o motivo (guardado em suspeitoMotivo)
export function motivoSuspeito({ nivel, exp }, criadoEmMs, agoraMs) {
  if (nivel > NIVEL_MAX) return `nivel ${nivel} acima do maximo ${NIVEL_MAX}`;
  if (exp > EXP_NIVEL[nivel] * 1.05) return `exp ${exp} acima do nivel ${nivel} (${EXP_NIVEL[nivel]})`;
  const minutos = Math.max(0, (agoraMs - criadoEmMs) / 60_000);
  const pode = nivelPossivel(minutos);
  if (nivel > pode) return `nivel ${nivel} com ${Math.round(minutos)} min de vida (maximo ${pode})`;
  return null;
}
