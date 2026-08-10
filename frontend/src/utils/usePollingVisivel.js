import { useEffect, useRef } from "react";

// Polling que só roda quando a aba está VISÍVEL.
//
// O Neon cobra por tempo de banco acordado e só suspende após ~5 minutos
// sem nenhuma consulta. Um setInterval comum continua disparando com a aba
// em segundo plano — então uma aba esquecida aberta a noite toda mantinha
// o banco ligado (e o medidor rodando) sem ninguém usando o site.
//
// Aqui o ciclo pausa quando a aba sai de foco e retoma quando volta,
// executando uma vez na volta pra atualizar o que perdeu.
export function usePollingVisivel(callback, intervaloMs) {
  const salvo = useRef(callback);
  salvo.current = callback;

  useEffect(() => {
    let timer = null;

    const rodar = () => {
      // Dupla checagem: a aba pode ter sido escondida entre o agendamento
      // e a execução.
      if (document.visibilityState === "visible") salvo.current();
    };

    const iniciar = () => {
      if (timer) return;
      timer = setInterval(rodar, intervaloMs);
    };

    const parar = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "visible") {
        rodar(); // atualiza na hora o que ficou desatualizado
        iniciar();
      } else {
        parar();
      }
    };

    // Primeira execução imediata, se a aba já estiver visível.
    aoMudarVisibilidade();
    document.addEventListener("visibilitychange", aoMudarVisibilidade);

    return () => {
      parar();
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    };
  }, [intervaloMs]);
}
