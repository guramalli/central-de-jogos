import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Palavras do Impostor — SEMENTE INICIAL (Fase 1, só pra testar).
// O banco completo (20+ temas × 15 palavras) entra na Fase 4.
//
// Pode rodar quantas vezes quiser: palavra que já existe é ignorada
// (skipDuplicates no @@unique [tema, palavra]), nada é apagado.
//
//   npm run seed:impostor
const prisma = new PrismaClient();

const PALAVRAS = {
  Lugares: [
    "Praia", "Hospital", "Escola", "Aeroporto", "Cinema", "Padaria", "Biblioteca",
    "Estádio", "Igreja", "Shopping", "Farmácia", "Zoológico", "Circo", "Academia", "Museu",
  ],
  Comidas: [
    "Pizza", "Feijoada", "Brigadeiro", "Coxinha", "Pastel", "Sushi", "Lasanha",
    "Pipoca", "Tapioca", "Churrasco", "Açaí", "Hambúrguer", "Pão de queijo", "Sorvete", "Macarrão",
  ],
  Animais: [
    "Cachorro", "Gato", "Elefante", "Girafa", "Tubarão", "Pinguim", "Leão",
    "Cavalo", "Coruja", "Tartaruga", "Macaco", "Jacaré", "Borboleta", "Golfinho", "Papagaio",
  ],
};

async function main() {
  const data = Object.entries(PALAVRAS).flatMap(([tema, lista]) => lista.map((palavra) => ({ tema, palavra })));
  const r = await prisma.impostorPalavra.createMany({ data, skipDuplicates: true });
  console.log(`Impostor: ${r.count} palavras novas (de ${data.length} na lista).`);
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
