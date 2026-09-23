import { Router } from "express";
import { getPlatformStats } from "../game/platformStats.js";
import { getOnlinePlayersDetailed as stopOnline } from "../game/gameManager.js";
import { getOnlinePlayersDetailed as quizOnline } from "../game/quizGameManager.js";
import { getOnlinePlayersDetailed as acromaniaOnline } from "../game/acromaniaGameManager.js";
import { getOnlinePlayersDetailedTribunal as tribunalOnline } from "../tribunal/socketTribunal.js";

const router = Router();

// Pública de propósito: essa informação não é sensível, e o rodapé (onde ela
// aparece) também é exibido em páginas sem login, como Login, Cadastro e
// Termos de Uso.
// (getPlatformStats guarda em cache a parte que vem do banco.)
router.get("/", async (req, res) => {
  const stats = await getPlatformStats();
  res.json(stats);
});

// ONDE TEM GENTE JOGANDO AGORA.
//
// O problema que isto resolve: quem chega no site vê três jogos e escolhe
// no escuro. Se cair numa sala vazia, vai embora — e pode ser que houvesse
// gente jogando no outro jogo, na sala ao lado.
//
// Devolve SÓ NÚMEROS, nunca nomes. O painel admin mostra quem está onde
// porque é do dono; aqui a informação é pública e serve pra decidir onde
// entrar, não pra localizar pessoas.
//
// A contagem é por usuário, não por conexão: quem abre a mesma sala em duas
// abas, ou joga em várias salas pelo multi-sala, conta uma vez só. Sem isso
// o número inflaria e a promessa de "tem gente lá" sairia furada.
router.get("/online", (req, res) => {
  const porJogo = [
    ["stop", stopOnline()],
    ["quiz", quizOnline()],
    ["acromania", acromaniaOnline()],
    ["tribunal", tribunalOnline()],
  ];

  const resultado = {};
  const todosOsUsuarios = new Set();

  for (const [jogo, lista] of porJogo) {
    const usuarios = new Set(lista.map((p) => p.userId));
    resultado[jogo] = usuarios.size;
    for (const u of usuarios) todosOsUsuarios.add(u);
  }

  // Total de pessoas distintas: quem está no Stop e no Quiz ao mesmo tempo
  // (multi-sala) não pode ser contado duas vezes aqui.
  resultado.total = todosOsUsuarios.size;
  res.json(resultado);
});

export default router;
