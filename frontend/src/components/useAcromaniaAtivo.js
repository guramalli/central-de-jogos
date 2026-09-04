import { useEffect, useState } from "react";
import { api } from "../api/client.js";

// Diz se o Acromania está ligado, consultando o backend.
//
// O jogo pode ser desligado pelo painel do Render (variável ACROMANIA_ATIVO)
// sem deploy nenhum. Este hook faz os CARDS da Home e do Lobby sumirem junto
// — senão a pessoa clicaria num card que leva a uma tela de manutenção.
//
// Começa como `true` de propósito: se a consulta falhar, é melhor mostrar o
// card (e a pessoa ver a tela de manutenção ao entrar) do que esconder um
// jogo que está funcionando.
export function useAcromaniaAtivo() {
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    let vivo = true;
    api
      .get("/acromania-rooms")
      .then(({ data }) => {
        if (!vivo) return;
        // Array puro = backend antigo, ainda sem a flag.
        setAtivo(Array.isArray(data) ? true : data.ativo !== false);
      })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  return ativo;
}
