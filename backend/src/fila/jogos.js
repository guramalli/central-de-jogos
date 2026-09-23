import { randomUUID } from "crypto";
import { criarSalaDeGrupo as criarSalaImpostor } from "../impostor/socketImpostor.js";
import { criarSalaDeGrupoTribunal } from "../tribunal/socketTribunal.js";
import {
  criarSalaPrivadaAcromania,
  conferirSenhaAcromania,
  agendarDescarteAcromania,
} from "../game/acromaniaGameManager.js";
import { acromaniaAtivo } from "../utils/acromaniaAtivo.js";

// Os jogos da FILA DE ESPERA: mínimo e máximo por grupo, se aceita bots, e
// como criar a sala do grupo. `criarSala` devolve o DESTINO que a tela usa
// pra levar a pessoa até a sala (mesmos parâmetros da URL da v2).
//
// Nenhuma sala da fila vale ranking: o Impostor está em testes, o Tribunal
// não tem ranking e a sala privada do Acromania já é sem pontuação.
let contadorAcro = 0;

export function jogosDaFila(io) {
  return {
    impostor: {
      nome: "Impostor",
      min: 4,
      max: 8,
      bots: true,
      criarSala: ({ membros, comBots }) => criarSalaImpostor({ membros, comBots }),
    },
    tribunal: {
      nome: "Tribunal",
      min: 3,
      max: 6,
      bots: true,
      criarSala: ({ membros, comBots }) => criarSalaDeGrupoTribunal({ membros, comBots }),
    },
    acromania: {
      nome: "Acromania",
      min: 3,
      max: 8,
      bots: false, // sala privada do Acromania não aceita bot
      minComecarAgora: 2, // "Começar agora" a partir de 2 (mínimo da sala privada)
      criarSala: ({ membros }) => {
        if (!acromaniaAtivo()) throw new Error("Acromania em manutenção");
        // Sala privada com senha aleatória: só quem aceitou a partida entra
        // (a senha é "digitada" aqui por cada um, sem ninguém ver).
        const senha = randomUUID().slice(0, 8);
        const { roomId } = criarSalaPrivadaAcromania(io, {
          nome: `Fila ${++contadorAcro}-${randomUUID().slice(0, 4)}`,
          senha,
          maxPlayers: 8,
          criadorId: membros[0].id,
          criadorNickname: membros[0].nickname,
        });
        for (const m of membros) conferirSenhaAcromania(roomId, m.id, senha);
        agendarDescarteAcromania(roomId); // some sozinha se ninguém entrar
        return { acro: roomId };
      },
    },
  };
}
