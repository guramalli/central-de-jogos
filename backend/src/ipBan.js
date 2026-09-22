// IPs banidos manualmente (veja scripts/banirIP.js). Guardado em memória e
// recarregado a cada minuto — checar o banco a cada requisição seria caro
// (todo pedido do site passaria por uma consulta), e um banimento não
// precisa valer no MESMO segundo em que foi criado.
import { prisma } from "./db.js";

let banidos = new Set();

async function recarregar() {
  try {
    const linhas = await prisma.bannedIP.findMany({ select: { ip: true } });
    banidos = new Set(linhas.map((l) => l.ip));
  } catch (e) {
    console.error("Falha ao carregar IPs banidos:", e.message);
  }
}

// Primeira carga na subida do servidor, depois a cada 1 minuto.
recarregar();
setInterval(recarregar, 60 * 1000).unref?.();

export function ipEstaBanido(ip) {
  return banidos.has(ip);
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
