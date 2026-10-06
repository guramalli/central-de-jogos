import { lazy } from "react";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Moldura from "./Moldura.jsx";
import Abas, { abaDaPagina } from "./Abas.jsx";
import BuscaJogador from "./BuscaJogador.jsx";
import Amigos from "./Amigos.jsx";
import Cla from "./Cla.jsx";

const Clas = lazy(() => import("./Clas.jsx"));

// SOCIAL — Amigos (conversas e pedidos) e Clã, mais a busca de jogador.
// amigos[&id=] → Amigos (com a conversa aberta); clas → lista de clãs;
// cla&id= → o clã. As duas últimas marcam a aba Clã.
export default function Social({ usuario, pagina, id }) {
  const abas = [
    abaDaPagina("amigos", "Amigos", "amigos", {}, irParaPagina, linkDaPagina),
    abaDaPagina("cla", "Clã", "clas", {}, irParaPagina, linkDaPagina),
  ];
  return (
    <Moldura usuario={usuario}>
      <div className="v2-social-topo">
        <Abas abas={abas} ativa={pagina === "amigos" ? "amigos" : "cla"} rotulo="Social" />
        <BuscaJogador fixa />
      </div>
      {pagina === "amigos" ? <Amigos usuario={usuario} conversaInicial={id} embutido />
        : pagina === "cla" ? <Cla key={id} usuario={usuario} claId={id} embutido />
        : <Clas usuario={usuario} embutido />}
    </Moldura>
  );
}
