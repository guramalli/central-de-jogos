// Move perguntas sobre videogames que estão espalhadas em outros temas
// para o tema novo "games".
//
// Uso:
//   npm run mover-games          -> só MOSTRA o que seria movido (seguro)
//   npm run mover-games -- --go  -> move de verdade
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Termos que indicam com segurança que a pergunta é sobre videogame.
//
// IMPORTANTE: todos são comparados com limite de palavra (ver abaixo), e
// termos curtos ou ambíguos foram evitados de propósito. "Mario" sozinho,
// por exemplo, casaria dentro de "Romário" — por isso aparece só em
// expressões maiores como "super mario" e "mario kart".
const TERMOS_GAMES = [
  // Plataformas e empresas
  "videogame", "video game", "video-game", "console de videogame",
  "playstation", "ps1", "ps2", "ps3", "ps4", "ps5",
  "xbox", "nintendo", "game boy", "gameboy", "nintendo switch",
  "super nintendo", "mega drive", "master system", "dreamcast",
  "sega", "atari", "fliperama", "arcade", "neo geo",
  "steam", "epic games", "activision", "ubisoft", "rockstar games",
  "electronic arts", "konami", "capcom", "square enix", "bandai namco",
  "blizzard", "valve", "bethesda", "naughty dog", "riot games",
  // Franquias
  "super mario", "mario kart", "mario bros", "luigi", "bowser",
  "the legend of zelda", "zelda", "link", "ganondorf",
  "sonic the hedgehog", "sonic", "donkey kong", "kirby", "metroid",
  "pac-man", "pacman", "space invaders", "tetris", "pong",
  "street fighter", "mortal kombat", "tekken", "super smash",
  "final fantasy", "resident evil", "silent hill", "metal gear",
  "castlevania", "mega man", "crash bandicoot", "spyro",
  "grand theft auto", "gta", "red dead", "call of duty", "battlefield",
  "counter-strike", "counter strike", "half-life", "portal 2",
  "the last of us", "uncharted", "god of war", "horizon zero",
  "the witcher", "cyberpunk 2077", "elden ring", "dark souls",
  "bloodborne", "sekiro", "skyrim", "fallout", "the elder scrolls",
  "minecraft", "roblox", "fortnite", "among us", "fall guys",
  "league of legends", "dota", "valorant", "overwatch", "apex legends",
  "world of warcraft", "diablo", "starcraft", "hearthstone",
  "animal crossing", "stardew valley", "terraria", "hollow knight",
  "assassins creed", "assassin's creed", "far cry", "watch dogs",
  "need for speed", "gran turismo", "forza", "fifa", "pes",
  "the sims", "sim city", "age of empires", "civilization",
  "free fire", "pubg", "clash royale", "candy crush", "angry birds",
  // Termos do universo gamer
  "esports", "e-sports", "speedrun", "gameplay", "rpg eletronico",
  "jogo eletronico", "jogos eletronicos", "controle de videogame",
  "cartucho", "joystick", "npc", "boss final", "save game",
];

function pareceGames(texto) {
  const t = String(texto || "").toLowerCase();
  // Limite de palavra: evita casar no meio de outra palavra. Sem isso,
  // "mario" acharia "Romário" e "gta" acharia qualquer coisa.
  return TERMOS_GAMES.some((termo) => {
    const esc = termo.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${esc}([^\\p{L}\\p{N}]|$)`, "iu");
    return regex.test(t);
  });
}

async function main() {
  const executar = process.argv.includes("--go");

  const perguntas = await prisma.quizQuestion.findMany({
    where: { NOT: { themeKey: "games" } },
  });

  const candidatas = perguntas.filter(
    (q) => pareceGames(q.question) || pareceGames(q.answer)
  );

  if (candidatas.length === 0) {
    console.log("Nenhuma pergunta de games encontrada em outros temas.");
    return;
  }

  const porTema = {};
  for (const q of candidatas) {
    porTema[q.themeKey] = (porTema[q.themeKey] || 0) + 1;
  }

  console.log(`Encontradas ${candidatas.length} pergunta(s) de games em outros temas:\n`);
  for (const [tema, qtd] of Object.entries(porTema).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tema.padEnd(14)} ${qtd}`);
  }

  console.log("\nExemplos do que seria movido:");
  candidatas.slice(0, 12).forEach((q) => {
    console.log(`  [${q.themeKey}] ${q.question.slice(0, 66)}`);
  });

  if (!executar) {
    console.log("\n⚠️  Nada foi alterado (modo de simulação).");
    console.log("    Confira a lista acima. Pra mover de verdade:");
    console.log("    npm run mover-games -- --go");
    return;
  }

  let movidas = 0;
  for (const q of candidatas) {
    await prisma.quizQuestion.update({
      where: { id: q.id },
      data: { themeKey: "games" },
    });
    movidas++;
  }

  console.log(`\n✅ ${movidas} pergunta(s) movida(s) para o tema "games".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
