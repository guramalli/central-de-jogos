// NEWSLETTER — manda um e-mail de novidades pra quem tem conta no portal.
//
//   npm run newsletter -- 2026-09-novidades                 (só mostra quantos receberiam e gera a prévia)
//   npm run newsletter -- 2026-09-novidades --teste=voce@email.com   (manda UM e-mail, só pra esse endereço)
//   npm run newsletter -- 2026-09-novidades --enviar         (manda de verdade, até 250 por vez)
//   npm run newsletter -- 2026-09-novidades --enviar --limite=100
//
// Cada newsletter é um par de arquivos em newsletters/: <id>.json (assunto)
// e o .html do e-mail, que pode usar {{nickname}} e {{link_sair}}.
//
// QUEM RECEBE: conta de verdade (não visitante), não banida, com
// recebeNovidades ligado. Todo e-mail leva o link de sair da lista e o
// cabeçalho List-Unsubscribe (o botão "cancelar inscrição" do Gmail).
//
// PODE RODAR DE NOVO: quem já recebeu fica anotado em
// newsletters/.enviados/<id>.txt e não recebe duas vezes. Os planos grátis
// dos serviços têm limite por dia (Brevo: 300; Resend: 100), então o envio
// é feito em lotes (--limite) — no dia seguinte, é só rodar de novo.
//
// Variáveis no .env:
//   NEWSLETTER_PROVEDOR   brevo | resend
//   NEWSLETTER_API_KEY    chave do serviço
//   NEWSLETTER_REMETENTE  ex.: novidades@educacaogamer.com.br (domínio verificado no serviço)
//   NEWSLETTER_RESPONDER  opcional; pra onde vão as RESPOSTAS ao e-mail
//                         (padrão: o e-mail do site, educacaogamer1@gmail.com)
//   NEWSLETTER_API_URL    opcional; endereço da API pro link de sair
//                         (padrão: https://api.educacaogamer.com.br)
//
// O banco é o do DATABASE_URL do .env — o script mostra o endereço antes
// de fazer qualquer coisa, pra ninguém mandar pra lista errada.
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../src/db.js";
import { linkDescadastro } from "../src/utils/newsletter.js";

const PASTA = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "newsletters");
const PAUSA_MS = 600; // entre um e-mail e outro: bem abaixo do limite por segundo dos serviços
const API_URL = process.env.NEWSLETTER_API_URL || "https://api.educacaogamer.com.br";
// O remetente precisa ser do domínio verificado no serviço (um @gmail.com
// como remetente cai no spam: o Gmail não deixa terceiros mandarem em nome
// dele). Por isso o e-mail do site entra como "responder para".
const RESPONDER = process.env.NEWSLETTER_RESPONDER || "educacaogamer1@gmail.com";

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith("--"));
const opcao = (nome) => args.find((a) => a === `--${nome}` || a.startsWith(`--${nome}=`))?.split("=")[1] ?? (args.includes(`--${nome}`) ? true : null);
const teste = opcao("teste");
const enviar = opcao("enviar") === true;
const limite = Math.max(1, Number(opcao("limite")) || 250);

function sair(msg) { console.error(msg); process.exit(1); }

if (!id) sair("Diga qual newsletter: npm run newsletter -- <id>   (ex.: 2026-09-novidades)");
const arqMeta = path.join(PASTA, `${id}.json`);
if (!fs.existsSync(arqMeta)) sair(`Não achei ${arqMeta}`);
const meta = JSON.parse(fs.readFileSync(arqMeta, "utf8"));
const modelo = fs.readFileSync(path.join(PASTA, meta.html), "utf8");

const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function montar(nickname, linkSair) {
  const html = modelo.replaceAll("{{nickname}}", escapar(nickname)).replaceAll("{{link_sair}}", escapar(linkSair));
  // Versão em texto puro (quem lê sem HTML, e ajuda a não cair no spam).
  const texto = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<div style="display:none[\s\S]*?<\/div>/i, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|h1|h2|tr)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
  return { html, texto };
}

async function mandar({ email, nome, html, texto, linkSair }) {
  const provedor = process.env.NEWSLETTER_PROVEDOR;
  const chave = process.env.NEWSLETTER_API_KEY;
  const remetente = process.env.NEWSLETTER_REMETENTE;
  if (!provedor || !chave || !remetente) sair("Falta configurar NEWSLETTER_PROVEDOR, NEWSLETTER_API_KEY e NEWSLETTER_REMETENTE no .env.");
  const cabecalhos = { "List-Unsubscribe": `<${linkSair}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" };
  let r;
  if (provedor === "brevo") {
    r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": chave, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sender: { name: "Educação Gamer", email: remetente }, replyTo: { email: RESPONDER, name: "Educação Gamer" }, to: [{ email, name: nome }], subject: meta.assunto, htmlContent: html, textContent: texto, headers: cabecalhos }),
    });
  } else if (provedor === "resend") {
    r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${chave}`, "content-type": "application/json" },
      body: JSON.stringify({ from: `Educação Gamer <${remetente}>`, reply_to: RESPONDER, to: [email], subject: meta.assunto, html, text: texto, headers: cabecalhos }),
    });
  } else {
    sair(`NEWSLETTER_PROVEDOR desconhecido: ${provedor} (use brevo ou resend)`);
  }
  if (!r.ok) {
    const corpo = (await r.text()).slice(0, 300);
    const erro = new Error(`HTTP ${r.status}: ${corpo}`);
    erro.status = r.status;
    throw erro;
  }
}

const hostDoBanco = (process.env.DATABASE_URL || "").replace(/^.*@/, "").replace(/[/?].*$/, "");
console.log(`Newsletter: ${meta.id} — "${meta.assunto}"`);
console.log(`Banco: ${hostDoBanco || "(DATABASE_URL vazio)"}`);

// Conta de visitante tem e-mail inventado; os domínios abaixo são de teste.
const DOMINIOS_FALSOS = /@(example\.(com|org|net)|teste?\.com|localhost)$/i;
const candidatos = await prisma.user.findMany({
  where: { isGuest: false, banned: false, recebeNovidades: true },
  select: { id: true, nickname: true, email: true },
  orderBy: { createdAt: "asc" },
});
const validos = candidatos.filter((u) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email) && !DOMINIOS_FALSOS.test(u.email));

const pastaEnviados = path.join(PASTA, ".enviados");
const arqEnviados = path.join(pastaEnviados, `${meta.id}.txt`);
const jaEnviados = new Set(fs.existsSync(arqEnviados) ? fs.readFileSync(arqEnviados, "utf8").split(/\r?\n/).filter(Boolean) : []);
const faltam = validos.filter((u) => !jaEnviados.has(u.id));

console.log(`Recebem novidades: ${validos.length} (já receberam esta: ${validos.length - faltam.length}; faltam: ${faltam.length})`);

// Prévia pra abrir no navegador antes de mandar.
const previa = path.join(PASTA, ".previa.html");
fs.writeFileSync(previa, montar("Fulano", linkDescadastro(API_URL, "previa")).html);
console.log(`Prévia: ${previa}`);

if (teste) {
  if (teste === true || !teste.includes("@")) sair("Use --teste=seu@email.com");
  const { html, texto } = montar("Teste", linkDescadastro(API_URL, "teste"));
  await mandar({ email: teste, nome: "Teste", html, texto, linkSair: linkDescadastro(API_URL, "teste") });
  console.log(`E-mail de teste enviado pra ${teste}. (O link de sair do teste não descadastra ninguém.)`);
} else if (enviar) {
  const lote = faltam.slice(0, limite);
  console.log(`Enviando ${lote.length} agora (limite ${limite})...`);
  fs.mkdirSync(pastaEnviados, { recursive: true });
  let ok = 0;
  for (const u of lote) {
    const linkSair = linkDescadastro(API_URL, u.id);
    const { html, texto } = montar(u.nickname, linkSair);
    try {
      await mandar({ email: u.email, nome: u.nickname, html, texto, linkSair });
      fs.appendFileSync(arqEnviados, `${u.id}\n`);
      ok++;
      if (ok % 25 === 0) console.log(`  ${ok}/${lote.length}`);
    } catch (err) {
      // Cota do dia acabou ou chave recusada: para tudo (roda de novo depois).
      if (err.status === 429 || err.status === 401 || err.status === 403 || err.status === 402) {
        console.error(`Parado: ${err.message}`);
        break;
      }
      console.error(`Falhou pra ${u.nickname}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, PAUSA_MS));
  }
  console.log(`Enviados agora: ${ok}. Faltam: ${faltam.length - ok}.`);
} else {
  console.log("Nada foi enviado. Use --teste=seu@email.com pra testar, ou --enviar pra mandar de verdade.");
}

await prisma.$disconnect();
