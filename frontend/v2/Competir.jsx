import { lazy } from "react";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Moldura from "./Moldura.jsx";
import Abas, { abaDaPagina } from "./Abas.jsx";
import Ranking from "./Ranking.jsx";
import Patentes from "./Patentes.jsx";

// Hall da Fama é pesado e pouco visitado: continua carregando sob demanda.
const HallFama = lazy(() => import("./HallFama.jsx"));

// COMPETIR — Ranking, Hall da Fama e Patentes numa seção só. A aba é o
// próprio ?pagina= (ranking | hall | patentes): links antigos continuam
// valendo. O jogo= acompanha a troca de aba.
export default function Competir({ usuario, aba, jogo }) {
  const extra = jogo ? { jogo } : {};
  const abas = [
    abaDaPagina("ranking", "Ranking", "ranking", extra, irParaPagina, linkDaPagina),
    abaDaPagina("hall", "Hall da Fama", "hall", extra, irParaPagina, linkDaPagina),
    abaDaPagina("patentes", "Patentes", "patentes", extra, irParaPagina, linkDaPagina),
  ];
  return (
    <Moldura usuario={usuario}>
      <Abas abas={abas} ativa={aba} rotulo="Competir" />
      {aba === "hall" ? <HallFama usuario={usuario} embutido />
        : aba === "patentes" ? <Patentes key={jogo || "q"} usuario={usuario} jogoInicial={jogo} embutido />
        : <Ranking usuario={usuario} jogoInicial={jogo} embutido />}
    </Moldura>
  );
}
