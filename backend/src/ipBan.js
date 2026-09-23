// IPs banidos manualmente (veja scripts/banirIP.js). Guardado em memória e
// recarregado a cada minuto — checar o banco a cada requisição seria caro
// (todo pedido do site passaria por uma consulta), e um banimento não
// precisa valer no MESMO segundo em que foi criado.
import { prisma } from "./db.js";

const MENSAGEM_PADRAO = "Acesso bloqueado.";

let banidos = new Map(); // ip -> mensagem (a que a pessoa banida vê)

async function recarregar() {
  try {
    const linhas = await prisma.bannedIP.findMany({ select: { ip: true, mensagem: true } });
    banidos = new Map(linhas.map((l) => [l.ip, l.mensagem || MENSAGEM_PADRAO]));
  } catch (e) {
    console.error("Falha ao carregar IPs banidos:", e.message);
  }
}

// Primeira carga na subida do servidor, depois a cada 15 minutos.
//
// Era a cada 1 minuto — e uma consulta por minuto, pra sempre, impedia o
// Neon de "dormir" (ele suspende depois de 5 min sem consulta, e cobra pelo
// tempo acordado). Os banimentos AUTOMÁTICOS (abaixo) já valem na hora,
// porque atualizam a lista em memória; só o banimento manual pelo script
// (scripts/banirIP.js) espera a próxima recarga.
const RECARREGAR_MS = 15 * 60 * 1000;
recarregar();
setInterval(recarregar, RECARREGAR_MS).unref?.();

export function ipEstaBanido(ip) {
  return banidos.has(ip);
}

// A mensagem que essa pessoa banida deve ver (a personalizada, se o admin
// escreveu uma; senão a genérica). Só faz sentido chamar depois de
// confirmar o banimento com ipEstaBanido.
export function mensagemDoBanido(ip) {
  return banidos.get(ip) || MENSAGEM_PADRAO;
}

// ---------------- banimento AUTOMÁTICO (zip 612) ----------------
//
// Até aqui, todo banimento dependia de alguém ver o log e digitar o
// comando — cansativo, e sempre um passo atrás de quem troca de IP. Isso
// bane na hora, direto do próprio servidor, mas só pros gatilhos mais
// claros: ver "AUTOBAN_IMEDIATO" e "registrarRejeicao" abaixo pra saber
// qual é qual.

// Grupo 1: bane IMEDIATAMENTE, sem esperar repetição — reservado pra sinais
// em que o risco de pegar gente inocente por coincidência é essencialmente
// zero (ninguém tem e-mail @example.com ou sugere "<script>" por acaso).
export async function autoBanirIP(ip, motivo) {
  if (!ip || banidos.has(ip)) return; // já banido, nada a fazer
  try {
    await prisma.bannedIP.upsert({
      where: { ip },
      update: {},
      create: { ip, motivo: `auto: ${motivo}`, mensagem: MENSAGEM_PADRAO },
    });
    banidos.set(ip, MENSAGEM_PADRAO); // vale JÁ, sem esperar o próximo recarregar()
    console.log(`[banido automaticamente] ${ip} — ${motivo}`);
  } catch (e) {
    console.error("Falha ao banir automaticamente:", e.message);
  }
}

// Grupo 2: sinais que SOZINHOS podem ser só azar (um apelido que colidiu
// por coincidência) — só vira banimento se o MESMO IP repetir 3 vezes em
// 10 minutos. Contador só em memória (não precisa sobreviver a um
// restart; se o servidor reiniciar, o pior caso é a contagem zerar).
const JANELA_MS = 10 * 60 * 1000;
const LIMIAR = 3;
const rejeicoes = new Map(); // ip -> [timestamps]

export async function registrarRejeicao(ip, motivo) {
  if (!ip || banidos.has(ip)) return;
  const agora = Date.now();
  const lista = (rejeicoes.get(ip) || []).filter((t) => t > agora - JANELA_MS);
  lista.push(agora);
  rejeicoes.set(ip, lista);
  if (lista.length >= LIMIAR) {
    rejeicoes.delete(ip);
    await autoBanirIP(ip, `${motivo} (repetiu ${lista.length}x em menos de 10min)`);
  }
}

// Grupo 3 (zip 614): mesma ideia do Grupo 2, mas pra contas criadas COM
// SUCESSO, sem nada de suspeito em nenhuma delas isoladamente (nome
// aleatório, e-mail de verdade — o padrão que passa direto pelos outros
// gatilhos). Uma pessoa só raramente cria 3 contas registradas em 10
// minutos pelo MESMO endereço; script sim. Contador separado do de
// rejeição — são coisas diferentes (sucesso, não falha).
const criacoesConta = new Map(); // ip -> [timestamps]

export async function registrarCriacaoConta(ip) {
  if (!ip || banidos.has(ip)) return;
  const agora = Date.now();
  const lista = (criacoesConta.get(ip) || []).filter((t) => t > agora - JANELA_MS);
  lista.push(agora);
  criacoesConta.set(ip, lista);
  if (lista.length >= LIMIAR) {
    criacoesConta.delete(ip);
    await autoBanirIP(ip, `${lista.length} contas criadas em menos de 10min`);
  }
}

// Socket.IO não aplica o "trust proxy" do Express (isso é só pro objeto
// de requisição do Express) — sem isso, todo mundo pareceria vir do IP
// interno do Render. Lê o X-Forwarded-For manualmente; o primeiro endereço
// da lista é o do navegador de quem conectou.
export function ipDoSocket(socket) {
  const xff = socket.handshake.headers?.["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return socket.handshake.address;
}
