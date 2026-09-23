import { useEffect, useState } from "react";

// Peças usadas por várias telas do Impostor.

// Tempo restante em segundos. O servidor manda o restante (a cada segundo e
// a cada troca de fase); aqui só descontamos o que passou desde o último
// aviso, pra o número não "pular" entre um aviso e outro.
export function useSegundos(tempo) {
  const [, setTique] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTique((n) => n + 1), 250);
    return () => clearInterval(t);
  }, []);
  if (tempo?.ms == null) return null;
  return Math.max(0, Math.ceil((tempo.ms - (Date.now() - tempo.em)) / 1000));
}

export function Cronometro({ tempo, rotulo }) {
  const s = useSegundos(tempo);
  if (s == null) return null;
  return (
    <div className={`imp-cronometro ${s <= 5 ? "urgente" : ""}`} role="timer" aria-label={`${s} segundos`}>
      {rotulo && <span>{rotulo}</span>}
      <b>{s}</b>
    </div>
  );
}

export function AvatarImp({ nome, cor, tamanho = 44 }) {
  return (
    <span className="imp-avatar" style={{ background: cor, width: tamanho, height: tamanho, fontSize: tamanho * 0.44 }} aria-hidden="true">
      {String(nome || "?").charAt(0).toUpperCase()}
    </span>
  );
}

// Nome e cor de um jogador: da lista da sala, ou (se já saiu) do registro
// guardado na largada da partida.
export function quem(estado, id) {
  const j = estado.jogadores.find((x) => x.id === id);
  if (j) return { nickname: j.nickname, cor: j.cor };
  return estado.nomes?.[id] || { nickname: "?", cor: "#7C8090" };
}

export function dicasDe(estado, id) {
  return (estado.dicas || []).filter((d) => d.jogadorId === id);
}
