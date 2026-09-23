import { useEffect, useState } from "react";
import { estaMudo, alternarMudo, estaSemAnimacao, alternarAnimacao, ouvirPreferencias } from "./sons.js";

// Som e confete de acerto — os mesmos dois botões do topo das salas, pra
// onde a sala não mostra o próprio topo (a barra do "várias salas": nos
// painéis compactos o cabeçalho de cada sala some). A preferência é do
// aparelho, então vale pra todos os painéis de uma vez.
export default function BotoesSom() {
  const [mudo, setMudo] = useState(estaMudo());
  const [semAnimacao, setSemAnimacao] = useState(estaSemAnimacao());
  useEffect(() => ouvirPreferencias(() => { setMudo(estaMudo()); setSemAnimacao(estaSemAnimacao()); }), []);
  return (
    <>
      <button className="v2-mudo" aria-label={mudo ? "Ligar som" : "Desligar som"} title={mudo ? "Ligar som" : "Desligar som"} onClick={() => setMudo(alternarMudo())}>
        {mudo ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H3v6h3l5 4zM22 9l-6 6M16 9l6 6" /></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" /></svg>
        )}
      </button>
      <button className="v2-mudo" aria-label={semAnimacao ? "Ligar animação de acerto" : "Desligar animação de acerto"} title={semAnimacao ? "Ligar animação de acerto" : "Desligar animação de acerto"} onClick={() => setSemAnimacao(alternarAnimacao())}>
        {semAnimacao ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v5M12 17v5M2 12h5M17 12h5M4.9 19.1l3.5-3.5M15.6 8.4l3.5-3.5M4 4l16 16" /></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v5M12 17v5M2 12h5M17 12h5M4.9 4.9l3.5 3.5M15.6 15.6l3.5 3.5M4.9 19.1l3.5-3.5M15.6 8.4l3.5-3.5" /></svg>
        )}
      </button>
    </>
  );
}
