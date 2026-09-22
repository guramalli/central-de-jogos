// Bane (ou libera) um IP inteiro — bloqueia toda visita daquele endereço,
// tanto nas rotas normais quanto no socket (chat, salas). Complementa o
// banimento de CONTA que já existe (campo `banned` do User): banir só a
// conta não impede criar outra — banir o visitante em rajada, por exemplo
// (zip 599), precisa bloquear o IP, já que contas de visitante são de
// graça e não pedem nada pra criar.
//
// Uso (dentro da pasta backend):
//   npm run banir-ip                                  (lista os banidos)
//   npm run banir-ip -- 203.0.113.42                  (bane, sem motivo)
//   npm run banir-ip -- 203.0.113.42 "rajada de visitantes 22/09"
//   npm run banir-ip -- 203.0.113.42 "rajada 22/09" --mensagem "Já te pegamos, cai fora 👋"
//   npm run banir-ip -- --remover 203.0.113.42        (libera o IP)
//
// "motivo" é só SEU, pra lembrar depois por que baniu — não aparece pra
// ninguém. "--mensagem" é o que a PESSOA BANIDA vê, na próxima vez que
// tentar criar conta ou jogar como visitante (sem ela, cai numa genérica:
// "Acesso bloqueado."). O aviso só aparece nessas duas ações — dentro do
// chat/sala já conectado, o site não mostra texto nenhum, só desconecta.
//
// O banimento vale em até 1 minuto (o servidor recarrega a lista de tempos
// em tempos — ver src/ipBan.js), não precisa reiniciar nada.
import "dotenv/config";
import { prisma } from "../src/db.js";

async function main() {
  const args = process.argv.slice(2);
  const iRemover = args.indexOf("--remover");

  if (iRemover >= 0) {
    const alvo = args[iRemover + 1];
    if (!alvo) { console.log('Uso: npm run banir-ip -- --remover <ip>'); process.exit(1); }
    const r = await prisma.bannedIP.deleteMany({ where: { ip: alvo } });
    console.log(r.count ? `✔ IP ${alvo} liberado.` : `IP ${alvo} não estava banido.`);
    return;
  }

  const iMensagem = args.indexOf("--mensagem");
  const mensagem = iMensagem >= 0 ? args[iMensagem + 1] : null;
  // tira "--mensagem" e o texto dela dos posicionais, senão o texto da
  // mensagem seria confundido com o motivo.
  const semMensagem = iMensagem >= 0 ? [...args.slice(0, iMensagem), ...args.slice(iMensagem + 2)] : args;
  const posicionais = semMensagem.filter((a) => !a.startsWith("--"));
  const [ip, motivo] = posicionais;

  if (!ip) {
    const lista = await prisma.bannedIP.findMany({ orderBy: { criadoEm: "desc" } });
    if (!lista.length) { console.log("Nenhum IP banido no momento."); return; }
    console.log(`${lista.length} IP(s) banido(s):\n`);
    for (const b of lista) {
      console.log(`  ${b.ip.padEnd(20)} ${b.motivo || "(sem motivo registrado)"}  — desde ${b.criadoEm.toLocaleString("pt-BR")}`);
      if (b.mensagem) console.log(`    ↳ mensagem que ele vê: "${b.mensagem}"`);
    }
    return;
  }

  await prisma.bannedIP.upsert({
    where: { ip },
    update: { motivo: motivo ?? undefined, mensagem: mensagem ?? undefined },
    create: { ip, motivo: motivo || null, mensagem: mensagem || null },
  });
  console.log(`✔ IP ${ip} banido${motivo ? ` (${motivo})` : ""}. Vale em até 1 minuto.`);
  if (mensagem) console.log(`  Mensagem que ele vai ver: "${mensagem}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
